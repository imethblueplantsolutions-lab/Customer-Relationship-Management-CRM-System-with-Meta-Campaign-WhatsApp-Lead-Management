const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const CacheService = require('../services/cacheService');
const { tenantStorage } = require('../middleware/tenant');
const { authenticate, authorize } = require('../middleware/auth');

// GET /: Fetch leads for current tenant with RBAC, advanced filters & tags
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = '1', limit = '50', status, search, tagId, category } = req.query;
    const store = tenantStorage.getStore();

    // 1. Extract userId, role, and tenantId from the authenticated req.user object
    const userId = req.user?.userId || req.user?.id;
    const role = req.user?.role || 'AGENT';
    const tenantId = req.user?.tenantId || store?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context could not be resolved' });
    }

    // 2. Initialize a Prisma whereClause object with { tenantId }
    const whereClause = { tenantId };

    // 3. Inject the RBAC logic: standard AGENT users only see leads explicitly assigned to them
    if (role === 'AGENT') {
      whereClause.assignedToId = userId;
    }

    // 4. Append filtering logic:
    // status: Exact match
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    // category: Exact match if provided
    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    // search: Use OR to match name (contains, mode: 'insensitive') or phoneNumber (contains)
    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      whereClause.OR = [
        { name: { contains: trimmedSearch, mode: 'insensitive' } },
        { phoneNumber: { contains: trimmedSearch } },
      ];
    }

    // tagId: Use relation filtering tags: { some: { id: tagId } }
    if (tagId && tagId !== 'ALL') {
      whereClause.tags = {
        some: {
          id: tagId,
        },
      };
    }

    // 5. Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    // 6. Execute prisma.$transaction with findMany and count in parallel
    const [leads, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
          tags: true,
          attribution: true,
          _count: { select: { followups: true, messages: true, attachments: true } },
        },
        skip,
        take,
      }),
      prisma.lead.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / take) || 1;

    // 7. Return paginated response
    res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error('[Leads Router] Error fetching leads with filters & RBAC:', error);
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
        status: 'NEW',
        tenantId,
        assignedToId: finalAssignedToId,
        ...(Array.isArray(tags) && tags.length > 0
          ? {
              tags: {
                connectOrCreate: tags
                  .map((t) => {
                    const tagName = typeof t === 'string' ? t.trim() : (t.name || '').trim();
                    return {
                      where: { tenantId_name: { tenantId, name: tagName } },
                      create: { name: tagName, tenantId },
                    };
                  })
                  .filter((t) => t.create.name),
              },
            }
          : {}),
      },
      include: {
        assignedTo: { select: { id: true, email: true, role: true } },
        tags: true,
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
        const systemActivity = await prisma.activity.create({
          data: {
            leadId: newLead.id,
            createdById: currentUserId || null,
            type: 'SYSTEM_ASSIGNMENT',
            title: 'Lead Assigned',
            description: `Lead assigned to ${assigneeName}`,
            occurredAt: new Date()
          },
          include: {
            createdBy: { select: { id: true, name: true, email: true, role: true } }
          }
        });

        try {
          const { io } = require('../index');
          if (io) {
            io.to(`tenant:${tenantId}`).emit('lead_activity_created', { leadId: newLead.id, activity: systemActivity });
          }
        } catch (socketErr) {
          console.warn('[Socket] Failed to emit lead_activity_created on create:', socketErr.message);
        }
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

// POST /merge: Merge two leads (Primary & Secondary), re-pointing all data to Primary
router.post('/merge', authenticate, authorize(['ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { primaryLeadId, secondaryLeadId } = req.body;
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const currentUserId = req.user?.userId || req.user?.id;

    if (!primaryLeadId || !secondaryLeadId) {
      return res.status(400).json({
        success: false,
        error: 'Both primaryLeadId and secondaryLeadId are required for merging',
      });
    }

    if (primaryLeadId === secondaryLeadId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot merge a lead into itself. Please select two distinct leads.',
      });
    }

    // Verify both leads exist in the current tenant
    const [primaryLead, secondaryLead] = await Promise.all([
      prisma.lead.findFirst({ where: { id: primaryLeadId, tenantId } }),
      prisma.lead.findFirst({ where: { id: secondaryLeadId, tenantId } }),
    ]);

    if (!primaryLead) {
      return res.status(404).json({ success: false, error: 'Primary lead record not found in this organization' });
    }

    if (!secondaryLead) {
      return res.status(404).json({ success: false, error: 'Secondary lead record not found in this organization' });
    }

    // Atomically transfer messages, activities, follow-ups, and attachments, then delete secondary lead
    const mergedLead = await prisma.$transaction(async (tx) => {
      // a) Update all Message records where leadId === secondaryLeadId to primaryLeadId
      await tx.message.updateMany({
        where: { leadId: secondaryLeadId },
        data: { leadId: primaryLeadId },
      });

      // b) Update all Activity records where leadId === secondaryLeadId to primaryLeadId
      await tx.activity.updateMany({
        where: { leadId: secondaryLeadId },
        data: { leadId: primaryLeadId },
      });

      // c) Update all Followup records where leadId === secondaryLeadId to primaryLeadId
      await tx.followup.updateMany({
        where: { leadId: secondaryLeadId },
        data: { leadId: primaryLeadId },
      });

      // d) Update all Attachment records where leadId === secondaryLeadId to primaryLeadId
      await tx.attachment.updateMany({
        where: { leadId: secondaryLeadId },
        data: { leadId: primaryLeadId },
      });

      // Transfer any deals linked to the secondary lead
      await tx.deal.updateMany({
        where: { leadId: secondaryLeadId },
        data: { leadId: primaryLeadId },
      });

      // e) Create a new Activity on the primary lead stating: "Merged with duplicate lead record."
      await tx.activity.create({
        data: {
          leadId: primaryLeadId,
          createdById: currentUserId || null,
          type: 'NOTE',
          title: 'Lead Merged',
          description: 'Merged with duplicate lead record.',
        },
      });

      // f) Delete the Lead record for secondaryLeadId
      await tx.lead.delete({
        where: { id: secondaryLeadId },
      });

      return tx.lead.findUnique({
        where: { id: primaryLeadId },
        include: {
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
          _count: { select: { messages: true, activities: true, followups: true, attachments: true } },
        },
      });
    });

    // Invalidate dashboard cache
    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    // Broadcast Socket.IO event if available
    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('lead_merged', {
          primaryLeadId,
          secondaryLeadId,
          mergedLead,
        });
      }
    } catch (socketErr) {
      console.warn('[Socket] Failed to broadcast lead_merged:', socketErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Leads merged successfully. All records transferred to primary lead.',
      data: mergedLead,
    });
  } catch (error) {
    console.error('[Leads] Error merging leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to merge leads: ' + (error.message || 'Internal error'),
    });
  }
});

// GET /tags: Fetch all tags for the current tenant
router.get('/tags', authenticate, async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;

    const tags = await prisma.tag.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ success: true, data: tags });
  } catch (error) {
    console.error('[Leads Router] Error fetching tags:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tags' });
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
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        tags: true,
        attribution: true,
        messages: { orderBy: { createdAt: 'asc' } },
        followups: {
          orderBy: { dueAt: 'asc' },
          include: {
            createdBy: { select: { id: true, name: true, email: true, role: true } },
            assignedTo: { select: { id: true, name: true, email: true, role: true } }
          }
        },
        activities: {
          orderBy: { occurredAt: 'asc' },
          include: {
            createdBy: { select: { id: true, name: true, email: true, role: true } }
          }
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { id: true, name: true, email: true } }
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
        direction: 'OUTBOUND',
        source: 'CRM'
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
      ...(name !== undefined && { name }),
      ...(displayName !== undefined && { displayName: displayName || null }),
      ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber || null }),
      ...(email !== undefined && { email: email || null }),
      ...(notes !== undefined && { notes: notes || null }),
      updatedAt: new Date()
    };

    if (tags !== undefined && Array.isArray(tags)) {
      updateData.tags = {
        set: [],
        connectOrCreate: tags
          .map((t) => {
            const tagName = typeof t === 'string' ? t.trim() : (t.name || '').trim();
            return {
              where: { tenantId_name: { tenantId, name: tagName } },
              create: { name: tagName, tenantId },
            };
          })
          .filter((t) => t.create.name),
      };
    }

    const targetAssignedToId = assignedToId === '' ? null : assignedToId;
    const isAssignmentChanged = assignedToId !== undefined && targetAssignedToId !== existingLead.assignedToId;

    if (assignedToId !== undefined) {
      updateData.assignedToId = targetAssignedToId;
    }

    const updatedLead = await prisma.lead.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        tags: true,
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

        const systemActivity = await prisma.activity.create({
          data: {
            leadId: updatedLead.id,
            createdById: currentUserId || null,
            type: 'SYSTEM_ASSIGNMENT',
            title,
            description,
            occurredAt: new Date()
          },
          include: {
            createdBy: { select: { id: true, name: true, email: true, role: true } }
          }
        });

        try {
          const { io } = require('../index');
          if (io) {
            io.to(`tenant:${tenantId}`).emit('lead_activity_created', { leadId: updatedLead.id, activity: systemActivity });
          }
        } catch (socketErr) {
          console.warn('[Socket] Failed to emit lead_activity_created on update:', socketErr.message);
        }
      } catch (actErr) {
        console.warn('[Activity] Failed to create system assignment activity on update:', actErr.message);
      }
    }

    // Broadcast lead update to all clients in the tenant
    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('lead_updated', { leadId: updatedLead.id, lead: updatedLead });
      }
    } catch (socketErr) {
      console.warn('[Socket] Failed to broadcast lead_updated:', socketErr.message);
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
// GET: Fetch all follow-up reminders in tenant (for dedicated Follow-ups page)
router.get('/followups/all', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const isAgent = req.user?.role === 'AGENT';
    const currentUserId = req.user?.userId || req.user?.id;
    const { filter } = req.query;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const filterClause = {};
    if (filter === 'OVERDUE' || filter === 'overdue') {
      filterClause.completed = false;
      filterClause.dueAt = { lt: now };
    } else if (filter === 'TODAY' || filter === 'today') {
      filterClause.completed = false;
      filterClause.dueAt = { gte: now, lte: endOfToday };
    } else if (filter === 'UPCOMING' || filter === 'upcoming') {
      filterClause.OR = [
        { completed: true },
        { dueAt: { gt: endOfToday } },
        { dueAt: null },
      ];
    }

    const followups = await prisma.followup.findMany({
      where: {
        lead: { tenantId },
        ...filterClause,
        ...(isAgent && {
          OR: [
            { assignedToId: currentUserId },
            { createdById: currentUserId },
          ],
        }),
      },
      orderBy: { dueAt: 'asc' },
      take: 200, // Server-side limit to prevent unbounded result sets
      include: {
        lead: {
          select: { id: true, name: true, phoneNumber: true, status: true, category: true }
        },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        attachments: {
          select: { id: true, fileName: true, fileUrl: true, fileType: true, fileSize: true, createdAt: true }
        },
      },
    });

    res.status(200).json({ success: true, data: followups });
  } catch (error) {
    console.error('Error fetching all followups:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch follow-ups' });
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
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    await prisma.lead.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() }
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    // Automatically record TASK_SCHEDULED activity on the timeline
    try {
      const dueText = dueAt ? ` (Due: ${new Date(dueAt).toLocaleString()})` : '';
      const assigneeUser = followup.assignedTo || (targetAssigneeId ? await prisma.user.findUnique({
        where: { id: targetAssigneeId },
        select: { name: true, email: true }
      }) : null);
      const assigneeName = assigneeUser?.name || assigneeUser?.email?.split('@')[0] || '';
      const assignText = assigneeName ? ` [Assigned: ${assigneeName}]` : '';

      const scheduledActivity = await prisma.activity.create({
        data: {
          leadId: req.params.id,
          createdById: currentUserId || null,
          type: 'TASK_SCHEDULED',
          title: `Follow-up Scheduled: ${type || 'Task'}`,
          description: `Scheduled ${type || 'CALL'} task: "${note || 'No notes'}"${dueText}${assignText}`,
          occurredAt: new Date()
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } }
        }
      });

      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('lead_activity_created', { leadId: req.params.id, activity: scheduledActivity });
      }
    } catch (actErr) {
      console.warn('[Activity] Failed to create TASK_SCHEDULED activity:', actErr.message);
    }

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

    const isNowCompleted = completed !== undefined && Boolean(completed) === true && !followup.completed;

    const updated = await prisma.followup.update({
      where: { id: req.params.followupId },
      data: {
        ...(completed !== undefined && { completed: Boolean(completed) }),
        ...(note !== undefined && { note }),
        ...(dueAt !== undefined && { dueAt: dueAt ? new Date(dueAt) : null }),
        ...(type !== undefined && { type })
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    // Automatically record TASK_COMPLETED activity on timeline when completed/done
    if (isNowCompleted) {
      try {
        const completedActivity = await prisma.activity.create({
          data: {
            leadId: req.params.id,
            createdById: currentUserId || null,
            type: 'TASK_COMPLETED',
            title: `Follow-up Completed: ${updated.type || 'Task'}`,
            description: `Marked ${updated.type || 'task'} as done: "${updated.note || 'Completed task'}"`,
            occurredAt: new Date()
          },
          include: {
            createdBy: { select: { id: true, name: true, email: true, role: true } }
          }
        });

        const { io } = require('../index');
        if (io) {
          io.to(`tenant:${tenantId}`).emit('lead_activity_created', { leadId: req.params.id, activity: completedActivity });
        }
      } catch (actErr) {
        console.warn('[Activity] Failed to create TASK_COMPLETED activity:', actErr.message);
      }
    }

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

    // Broadcast activity creation to all clients viewing this lead or tenant
    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('lead_activity_created', { leadId: req.params.id, activity });
      }
    } catch (socketErr) {
      console.warn('[Socket] Failed to broadcast lead_activity_created:', socketErr.message);
    }

    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ success: false, error: 'Failed to create activity' });
  }
});

// PUT: Update an activity (creator or Admin/Team Lead)
router.put('/:id/activities/:activityId', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const isAgent = req.user?.role === 'AGENT';
    const currentUserId = req.user?.userId || req.user?.id;
    const { type, title, description, occurredAt } = req.body;

    const activity = await prisma.activity.findFirst({
      where: { id: req.params.activityId, leadId: req.params.id },
      include: { lead: true }
    });

    if (!activity || activity.lead.tenantId !== tenantId) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    // Agents can only edit their own activities
    if (isAgent && activity.createdById !== currentUserId) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only edit your own activities' });
    }

    const updated = await prisma.activity.update({
      where: { id: req.params.activityId },
      data: {
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title: title || null }),
        ...(description !== undefined && { description: description || null }),
        ...(occurredAt !== undefined && { occurredAt: new Date(occurredAt) }),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    // Broadcast activity update
    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('lead_activity_updated', {
          leadId: req.params.id,
          activity: updated
        });
      }
    } catch (socketErr) {
      console.warn('[Socket] Failed to broadcast lead_activity_updated:', socketErr.message);
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ success: false, error: 'Failed to update activity' });
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

    // Broadcast activity deletion
    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('lead_activity_deleted', {
          leadId: req.params.id,
          activityId: req.params.activityId
        });
      }
    } catch (socketErr) {
      console.warn('[Socket] Failed to broadcast lead_activity_deleted:', socketErr.message);
    }

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

    const result = await prisma.lead.deleteMany({
      where: { id: req.params.id, tenantId }
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found or access denied' });
    }

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});


module.exports = router;

