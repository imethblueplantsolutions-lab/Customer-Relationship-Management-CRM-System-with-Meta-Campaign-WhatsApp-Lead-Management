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
 * Starts the periodic overdue task checker.
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {number} intervalMs - Check interval in milliseconds (default: 60s)
 */
function startOverdueChecker(io, intervalMs = 60000) {
  if (checkerInterval) {
    clearInterval(checkerInterval);
  }

  console.log(`⏰ [Overdue Checker] Service started (Interval: ${intervalMs / 1000}s)`);

  // Run initial check after a brief 5s warmup delay
  setTimeout(() => {
    checkOverdueFollowups(io).catch((err) =>
      console.warn('[Overdue Checker] Initial check failed:', err.message)
    );
  }, 5000);

  // Set recurring interval
  checkerInterval = setInterval(() => {
    checkOverdueFollowups(io).catch((err) =>
      console.warn('[Overdue Checker] Periodic check failed:', err.message)
    );
  }, intervalMs);

  return checkerInterval;
}

module.exports = {
  checkOverdueFollowups,
  startOverdueChecker,
};
