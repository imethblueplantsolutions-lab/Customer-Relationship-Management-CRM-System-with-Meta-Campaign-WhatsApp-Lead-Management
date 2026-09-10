const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const webhookQueue = require('../queues/webhookQueue');

// Enforce authentication & ADMIN role authorization on all job routes
router.use(authenticate);
router.use(authorize(['ADMIN']));

// GET /: Fetch all FailedJob records ordered by createdAt descending
router.get('/', async (req, res) => {
  try {
    const failedJobs = await prisma.failedJob.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: failedJobs });
  } catch (error) {
    console.error('[AdminJobs] Error fetching failed jobs:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve dead letter jobs' });
  }
});

// POST /:id/replay: Re-queue failed job and mark status as REPLAYED
router.post('/:id/replay', async (req, res) => {
  try {
    const { id } = req.params;

    const failedJob = await prisma.failedJob.findUnique({
      where: { id },
    });

    if (!failedJob) {
      return res.status(404).json({ success: false, error: 'Failed job record not found' });
    }

    // Re-add the job payload back to webhookQueue
    const newJob = await webhookQueue.add(failedJob.jobName, failedJob.payload);

    // Update status to REPLAYED
    const updatedJob = await prisma.failedJob.update({
      where: { id },
      data: {
        status: 'REPLAYED',
      },
    });

    res.status(200).json({
      success: true,
      message: `Job ${failedJob.jobId} successfully re-queued as job ${newJob.id}`,
      data: updatedJob,
    });
  } catch (error) {
    console.error('[AdminJobs] Error replaying failed job:', error);
    res.status(500).json({ success: false, error: 'Failed to replay job' });
  }
});

module.exports = router;
