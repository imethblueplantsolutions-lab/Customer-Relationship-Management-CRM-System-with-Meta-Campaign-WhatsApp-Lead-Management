const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const CacheService = require('../services/cacheService');
const { tenantStorage } = require('../middleware/tenant');
const { authorize } = require('../middleware/auth');

// GET: Fetch leads for current tenant (Agents see only assigned leads; Admins & Team Leads see all)
router.get('/', async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const isAgent = req.user?.role === 'AGENT';
    const currentUserId = req.user?.userId || req.user?.id;

    const where = { tenantId };

    // Agent role restriction: can only view assigned leads
    if (isAgent && currentUserId) {
      where.assignedToId = currentUserId;
    }

    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, email: true, role: true } },
          attribution: true,
          _count: { select: { followups: true, messages: true } }
        },
        skip,
        take
      }),
      prisma.lead.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
});

// POST: Manually add a new customer lead (Accessible to Admin, Team Lead & Agent)
router.post('/', authorize(['ADMIN', 'TEAM_LEAD', 'AGENT']), async (req, res) => {
  try {
    const { phoneNumber, name, displayName, whatsappNumber, email, notes, category, tags, assignedToId } = req.body;
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const isAgent = req.user?.role === 'AGENT';
    const currentUserId = req.user?.userId || req.user?.id;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    // Ensure Tenant exists
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: `Tenant ${tenantId}` }
    });

    // Agents automatically assign the lead to themselves; Admins/Team Leads can assign to any user
    const finalAssignedToId = isAgent ? currentUserId : (assignedToId || null);

    const newLead = await prisma.lead.create({
      data: {
        phoneNumber,
        name: name || phoneNumber,
        displayName: displayName || null,
        whatsappNumber: whatsappNumber || null,
        email: email || null,
        notes: notes || null,
        category: category || 'Manual Entry',
        tags: tags || [],
        status: 'NEW',
        tenantId,
        assignedToId: finalAssignedToId
      },
      include: {
        assignedTo: { select: { id: true, email: true, role: true } }
      }
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    // Automatically record SYSTEM_ASSIGNMENT activity if created with an assignee
    if (finalAssignedToId) {
      try {
        const assigneeUser = newLead.assignedTo || await prisma.user.findUnique({
          where: { id: finalAssignedToId },
          select: { name: true, email: true }
        });
        const assigneeName = assigneeUser?.name || assigneeUser?.email?.split('@')[0] || 'Sales Agent';
        await prisma.activity.create({
          data: {
            leadId: newLead.id,
            createdById: currentUserId || null,
            type: 'SYSTEM_ASSIGNMENT',
            title: 'Lead Assigned',
            description: `Lead assigned to ${assigneeName}`,
            occurredAt: new Date()
          }
        });
      } catch (actErr) {
        console.warn('[Activity] Failed to create system assignment activity on create:', actErr.message);
      }
    }

    // Notify assigned agent if different from creator
    if (finalAssignedToId && finalAssignedToId !== currentUserId) {
      try {
        const assignerName = req.user?.email 
          ? `${req.user.email.split('@')[0]} (${req.user.role === 'ADMIN' ? 'Admin' : req.user.role === 'TEAM_LEAD' ? 'Team Lead' : 'Manager'})` 
          : 'Team Lead/Admin';
        const notification = await prisma.notification.create({
          data: {
            userId: finalAssignedToId,
            type: 'LEAD_ASSIGNED',
            title: 'New Lead Assigned to You',
            body: `${assignerName} assigned you a new lead: ${name || phoneNumber}`,
            linkUrl: `/leads/${newLead.id}`
          }
        });
        const { io } = require('../index');
        if (io) io.to(`user:${finalAssignedToId}`).emit('new_notification', notification);
      } catch (e) {
        console.warn('[Notification] Failed to notify agent on lead assign:', e.message);
      }
    }

    res.status(201).json({ success: true, data: newLead });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'This phone number already exists in your organization' });
    }
    console.error('Add lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to add customer lead' });
  }
});

// GET: Fetch single lead by ID with full attribution, messages, and follow-ups
router.get('/:id', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const isAgent = req.user?.role === 'AGENT';
    const currentUserId = req.user?.userId || req.user?.id;

    const where = { id: req.params.id, tenantId };
    if (isAgent && currentUserId) {
      where.assignedToId = currentUserId;
    }

    const lead = await prisma.lead.findFirst({
      where,
      include: {
        assignedTo: { select: { id: true, email: true, role: true } },
        attribution: true,
        messages: { orderBy: { createdAt: 'asc' } },
        followups: {
          orderBy: { dueAt: 'asc' },
          include: {
            createdBy: { select: { id: true, email: true, role: true } },
            assignedTo: { select: { id: true, email: true, role: true } }
          }
        },
        activities: {
          orderBy: { occurredAt: 'asc' },
          include: {
            createdBy: { select: { id: true, name: true, email: true, role: true } }
          }
        }
      }
    });

    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found or access denied' });
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lead' });
  }
});

// POST: Send outbound WhatsApp message via Meta Cloud API using DB Tokens
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, error: 'Message body cannot be empty' });
    }

    const lead = await prisma.lead.findFirst({ 
      where: { id, tenantId },
      include: { tenant: true }
    });
    
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    let messageId = `outbound_${Date.now()}`;

    // If Meta Cloud API credentials are configured, send to Meta
    if (lead.tenant.metaAccessToken && lead.tenant.metaPhoneNumberId) {
      const metaResponse = await fetch(`https://graph.facebook.com/v20.0/${lead.tenant.metaPhoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lead.tenant.metaAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: lead.phoneNumber,
          type: 'text',
          text: { body },
        }),
      });

      const metaData = await metaResponse.json();
      if (!metaResponse.ok) {
        throw new Error(metaData.error?.message || 'Meta API transmission failed');
      }
      messageId = metaData.messages?.[0]?.id || messageId;
    }

    const savedMessage = await prisma.message.create({
      data: {
        messageId,
        leadId: lead.id,
        body,
        timestamp: Math.floor(Date.now() / 1000).toString(),
        direction: 'OUTBOUND'
      }
    });

    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('new_message', { leadId: lead.id, message: savedMessage });
      }
    } catch (e) {
      console.warn('Socket broadcast warning:', e.message);
    }

    res.status(200).json({ success: true, data: savedMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to send message' });
  }
});

// PUT: Update lead status, assignee, or metadata (Admin/Team Lead can assign; Agents cannot reassign)
router.put('/:id', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const isAgent = req.user?.role === 'AGENT';
    const currentUserId = req.user?.userId || req.user?.id;
    const { status, category, assignedToId, tags, name, displayName, whatsappNumber, email, notes } = req.body;

    const existingLead = await prisma.lead.findFirst({
      where: { id: req.params.id, tenantId }
    });

    if (!existingLead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Agents can only edit their own assigned leads
    if (isAgent && existingLead.assignedToId !== currentUserId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only edit your assigned leads' });
    }

    // Agents cannot assign or reassign leads
    if (assignedToId !== undefined && isAgent) {
      return res.status(403).json({ success: false, error: 'Forbidden: Sales agents cannot assign leads to other agents' });
    }

    const updateData = {
      ...(status && { status }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags }),
      ...(name !== undefined && { name }),
      ...(displayName !== undefined && { displayName: displayName || null }),
      ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber || null }),
      ...(email !== undefined && { email: email || null }),
      ...(notes !== undefined && { notes: notes || null }),
      updatedAt: new Date()
    };

    const targetAssignedToId = assignedToId === '' ? null : assignedToId;
    const isAssignmentChanged = assignedToId !== undefined && targetAssignedToId !== existingLead.assignedToId;

    if (assignedToId !== undefined) {
      updateData.assignedToId = targetAssignedToId;
    }

    const updatedLead = await prisma.lead.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    // Automatically record SYSTEM_ASSIGNMENT activity if assignee was changed
    if (isAssignmentChanged) {
      try {
        let title = 'Lead Unassigned';
        let description = 'Lead unassigned from previous agent';

        if (targetAssignedToId) {
          const assigneeUser = updatedLead.assignedTo || await prisma.user.findUnique({
            where: { id: targetAssignedToId },
            select: { name: true, email: true }
          });
          const assigneeName = assigneeUser?.name || assigneeUser?.email?.split('@')[0] || 'Sales Agent';
          title = existingLead.assignedToId ? 'Lead Reassigned' : 'Lead Assigned';
          description = `Lead ${existingLead.assignedToId ? 'reassigned' : 'assigned'} to ${assigneeName}`;
        }

        await prisma.activity.create({
          data: {
            leadId: updatedLead.id,
            createdById: currentUserId || null,
            type: 'SYSTEM_ASSIGNMENT',
            title,
            description,
            occurredAt: new Date()
          }
        });
      } catch (actErr) {
        console.warn('[Activity] Failed to create system assignment activity on update:', actErr.message);
      }
    }

    // Notify assigned sales agent if lead was newly assigned or reassigned by Admin/Team Lead
    if (targetAssignedToId && isAssignmentChanged && targetAssignedToId !== currentUserId) {
      try {
        const assignerName = req.user?.email 
          ? `${req.user.email.split('@')[0]} (${req.user.role === 'ADMIN' ? 'Admin' : req.user.role === 'TEAM_LEAD' ? 'Team Lead' : 'Manager'})` 
          : 'Team Lead/Admin';
        const notification = await prisma.notification.create({
          data: {
            userId: targetAssignedToId,
            type: 'LEAD_ASSIGNED',
            title: 'Lead Assigned to You',
            body: `${assignerName} assigned you lead: ${updatedLead.name || updatedLead.phoneNumber}`,
            linkUrl: `/leads/${updatedLead.id}`
          }
        });
        const { io } = require('../index');
        if (io) io.to(`user:${targetAssignedToId}`).emit('new_notification', notification);
      } catch (e) {
        console.warn('[Notification] Failed to notify agent on lead reassign:', e.message);
      }
    }

    res.status(200).json({ success: true, data: updatedLead });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

// POST: Add follow-up activity / reminder to a lead
// Admins & Team Leads can assign to any agent; Agents can only assign to themselves
router.post('/:id/followups', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const isAgent = req.user?.role === 'AGENT';
    const currentUserId = req.user?.userId || req.user?.id;
    const { type, note, dueAt, assignedToId } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, tenantId }
    });

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    if (isAgent && lead.assignedToId !== currentUserId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only add follow-ups to your assigned leads' });
    }

    // Agent can only assign follow-ups to themselves
    let targetAssigneeId = null;
    if (isAgent) {
      targetAssigneeId = currentUserId;
    } else {
      targetAssigneeId = assignedToId || currentUserId || null;
    }

    const followup = await prisma.followup.create({
      data: {
        leadId: req.params.id,
        createdById: currentUserId || null,
        assignedToId: targetAssigneeId,
        type: type || 'CALL',
        note: note || '',
        dueAt: dueAt ? new Date(dueAt) : null,
      },
      include: {
        createdBy: { select: { id: true, email: true, role: true } },
        assignedTo: { select: { id: true, email: true, role: true } }
      }
    });

    await prisma.lead.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() }
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    // Notify assigned agent if different from creator
    if (targetAssigneeId && targetAssigneeId !== currentUserId) {
      try {
        const notification = await prisma.notification.create({
          data: {
            userId: targetAssigneeId,
            type: 'FOLLOWUP_ASSIGNED',
            title: 'New Follow-up Assigned to You',
            body: `A ${type || 'CALL'} task was assigned to you for lead: ${lead.name || lead.phoneNumber}`,
            linkUrl: `/leads/${req.params.id}`
          }
        });
        const { io } = require('../index');
        if (io) io.to(`user:${targetAssigneeId}`).emit('new_notification', notification);
      } catch (e) {
        console.warn('[Notification] Failed to notify agent on followup assign:', e.message);
      }
    }

    res.status(201).json({ success: true, data: followup });
  } catch (error) {
    console.error('Error creating followup:', error);
    res.status(500).json({ success: false, error: 'Failed to schedule follow-up' });
  }
});

// PUT: Update or complete follow-up activity
router.put('/:id/followups/:followupId', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const isAgent = req.user?.role === 'AGENT';
    const currentUserId = req.user?.userId || req.user?.id;
    const { completed, note, dueAt, type } = req.body;

    const followup = await prisma.followup.findFirst({
      where: { id: req.params.followupId, leadId: req.params.id },
      include: { lead: true }
    });

    if (!followup || followup.lead.tenantId !== tenantId) {
      return res.status(404).json({ success: false, error: 'Follow-up not found' });
    }

    if (isAgent && followup.assignedToId !== currentUserId && followup.createdById !== currentUserId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only update your own follow-ups' });
    }

    const updated = await prisma.followup.update({
      where: { id: req.params.followupId },
      data: {
        ...(completed !== undefined && { completed: Boolean(completed) }),
        ...(note !== undefined && { note }),
        ...(dueAt !== undefined && { dueAt: dueAt ? new Date(dueAt) : null }),
        ...(type !== undefined && { type })
      },
      include: {
        createdBy: { select: { id: true, email: true, role: true } },
        assignedTo: { select: { id: true, email: true, role: true } }
      }
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating followup:', error);
    res.status(500).json({ success: false, error: 'Failed to update follow-up' });
  }
});

// POST: Create activity / timeline entry for a lead
router.post('/:id/activities', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const isAgent = req.user?.role === 'AGENT';
    const currentUserId = req.user?.userId || req.user?.id;
    const { type, title, description, occurredAt, createdById } = req.body;

    const whereClause = { id: req.params.id, tenantId };
    if (isAgent && currentUserId) {
      whereClause.assignedToId = currentUserId;
    }

    const lead = await prisma.lead.findFirst({ where: whereClause });
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const targetCreatorId = (!isAgent && createdById) ? createdById : currentUserId;

    const activity = await prisma.activity.create({
      data: {
        leadId: req.params.id,
        createdById: targetCreatorId || null,
        type: type || 'NOTE',
        title: title || null,
        description: description || null,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    // Update lead's updatedAt timestamp
    await prisma.lead.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() }
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ success: false, error: 'Failed to create activity' });
  }
});

// DELETE: Remove an activity (creator or Admin/Team Lead)
router.delete('/:id/activities/:activityId', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const isAgent = req.user?.role === 'AGENT';
    const currentUserId = req.user?.userId || req.user?.id;

    const activity = await prisma.activity.findFirst({
      where: { id: req.params.activityId, leadId: req.params.id },
      include: { lead: true }
    });

    if (!activity || activity.lead.tenantId !== tenantId) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    // Agents can only delete their own activities
    if (isAgent && activity.createdById !== currentUserId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only delete your own activities' });
    }

    await prisma.activity.delete({ where: { id: req.params.activityId } });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    res.status(200).json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ success: false, error: 'Failed to delete activity' });
  }
});

// DELETE: Delete lead (Admin & Team Lead only)
router.delete('/:id', authorize(['ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;

    await prisma.lead.deleteMany({
      where: { id: req.params.id, tenantId }
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

module.exports = router;

