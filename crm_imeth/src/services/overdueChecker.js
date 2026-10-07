/**
 * @file overdueChecker.js
 * @description Background service to monitor follow-up tasks, identify overdue deadlines,
 * and dispatch real-time notifications to the assigned sales agents.
 */

const prisma = require('../config/db');

let checkerInterval = null;

/**
 * Checks all active follow-ups whose deadline has passed (dueAt <= now)
 * and dispatches a notification to the assigned sales agent if one hasn't been sent yet.
 * @param {import('socket.io').Server} io - Socket.IO server instance
 */
async function checkOverdueFollowups(io) {
  try {
    const now = new Date();

    // Query uncompleted follow-ups that have passed their deadline
    const overdueFollowups = await prisma.followup.findMany({
      where: {
        completed: false,
        dueAt: { lte: now },
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            assignedToId: true,
            tenantId: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      take: 200,
    });

    if (!overdueFollowups || overdueFollowups.length === 0) {
      return;
    }

    for (const followup of overdueFollowups) {
      // Determine the target sales agent: task assignee -> lead assignee -> task creator
      const targetUserId =
        followup.assignedToId ||
        followup.lead?.assignedToId ||
        followup.createdById;

      if (!targetUserId) continue;

      const taskLink = `/leads/${followup.leadId}?followupId=${followup.id}`;

      // Check if an overdue notification for this specific task has already been sent
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          userId: targetUserId,
          type: 'TASK_OVERDUE',
          linkUrl: taskLink,
        },
      });

      if (alreadyNotified) {
        continue;
      }

      // Format notification text
      const leadName =
        followup.lead?.name || followup.lead?.phoneNumber || 'Lead';
      const dueTimeStr = followup.dueAt
        ? new Date(followup.dueAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'scheduled time';

      const notifTitle = `Overdue Task: ${followup.type || 'Follow-up'}`;
      const notifBody = `Task for "${leadName}" is overdue (was due at ${dueTimeStr}). Please follow up now.`;

      const notification = await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'TASK_OVERDUE',
          title: notifTitle,
          body: notifBody,
          message: notifBody,
          linkUrl: taskLink,
        },
      });

      // Dispatch real-time notification to the sales agent's user room
      if (io) {
        io.to(`user:${targetUserId}`).emit('new_notification', notification);
        console.log(
          `📡 [Overdue Checker] Dispatched TASK_OVERDUE notification to user:${targetUserId} for followup ${followup.id}`
        );
      }
    }
  } catch (error) {
    console.error('[Overdue Checker] Error processing overdue follow-ups:', error.message);
  }
}

/**
 * Checks all active follow-ups due in the next 15 minutes (now < dueAt <= now + 15m)
 * and dispatches a pre-due notification to the assigned sales agent if not yet sent.
 * @param {import('socket.io').Server} io - Socket.IO server instance
 */
async function checkDueSoonFollowups(io) {
  try {
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);

    const dueSoonFollowups = await prisma.followup.findMany({
      where: {
        completed: false,
        dueAt: { gt: now, lte: in15Minutes },
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            assignedToId: true,
            tenantId: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      take: 200,
    });

    if (!dueSoonFollowups || dueSoonFollowups.length === 0) {
      return;
    }

    for (const followup of dueSoonFollowups) {
      const targetUserId =
        followup.assignedToId ||
        followup.lead?.assignedToId ||
        followup.createdById;

      if (!targetUserId) continue;

      const taskLink = `/leads/${followup.leadId}?followupId=${followup.id}`;

      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          userId: targetUserId,
          type: 'TASK_DUE_SOON',
          linkUrl: taskLink,
        },
      });

      if (alreadyNotified) {
        continue;
      }

      const leadName =
        followup.lead?.name || followup.lead?.phoneNumber || 'Lead';
      const dueTimeStr = followup.dueAt
        ? new Date(followup.dueAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'scheduled time';

      const notifTitle = `Upcoming Follow-up: ${followup.type || 'Task'}`;
      const notifBody = `Task for "${leadName}" is due soon at ${dueTimeStr}. Please prepare.`;

      const notification = await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'TASK_DUE_SOON',
          title: notifTitle,
          body: notifBody,
          message: notifBody,
          linkUrl: taskLink,
        },
      });

      if (io) {
        io.to(`user:${targetUserId}`).emit('new_notification', notification);
        console.log(
          `📡 [Reminder Checker] Dispatched TASK_DUE_SOON notification to user:${targetUserId} for followup ${followup.id}`
        );
      }
    }
  } catch (error) {
    console.error('[Reminder Checker] Error processing due soon follow-ups:', error.message);
  }
}

/**
 * Runs both overdue and upcoming pre-due reminder checks.
 * @param {import('socket.io').Server} io
 */
async function checkAllFollowupReminders(io) {
  await Promise.allSettled([
    checkDueSoonFollowups(io),
    checkOverdueFollowups(io),
  ]);
}

/**
 * Starts the periodic follow-up task and reminder checker.
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {number} intervalMs - Check interval in milliseconds (default: 60s)
 */
function startOverdueChecker(io, intervalMs = 60000) {
  if (checkerInterval) {
    clearInterval(checkerInterval);
  }

  console.log(`⏰ [Reminder Checker] Service started (Interval: ${intervalMs / 1000}s)`);

  // Run initial check after a brief 5s warmup delay
  setTimeout(() => {
    checkAllFollowupReminders(io).catch((err) =>
      console.warn('[Reminder Checker] Initial check failed:', err.message)
    );
  }, 5000);

  // Set recurring interval
  checkerInterval = setInterval(() => {
    checkAllFollowupReminders(io).catch((err) =>
      console.warn('[Reminder Checker] Periodic check failed:', err.message)
    );
  }, intervalMs);

  return checkerInterval;
}

module.exports = {
  checkOverdueFollowups,
  checkDueSoonFollowups,
  checkAllFollowupReminders,
  startOverdueChecker,
};
