const prisma = require('../lib/prisma');

/**
 * MessageCleanupService
 * Auto-delete inactive chat threads after 1 hour of no activity
 */
class MessageCleanupService {
  constructor() {
    this.intervalId = null;
    this.io = null;
    this.cleanupIntervalMs = 5 * 60 * 1000; // Run every 5 minutes
    this.inactivityThresholdMs = 60 * 60 * 1000; // 1 hour
  }

  setSocketIO(io) {
    this.io = io;
  }

  start() {
    console.log('[MessageCleanupService] Started - checking every 5 minutes');
    this.intervalId = setInterval(() => this.cleanup(), this.cleanupIntervalMs);
    // Run once immediately
    this.cleanup();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[MessageCleanupService] Stopped');
    }
  }

  async cleanup() {
    try {
      const oneHourAgo = new Date(Date.now() - this.inactivityThresholdMs);

      // Find threads with no recent messages
      const inactiveThreads = await prisma.chatThread.findMany({
        where: {
          lastMessageAt: { lt: oneHourAgo }
        },
        select: { id: true, userId: true }
      });

      if (inactiveThreads.length === 0) {
        return;
      }

      console.log(`[MessageCleanupService] Found ${inactiveThreads.length} inactive threads`);

      for (const thread of inactiveThreads) {
        try {
          // Delete messages and thread in transaction
          await prisma.$transaction([
            prisma.chatMessage.deleteMany({ where: { threadId: thread.id } }),
            prisma.chatThread.delete({ where: { id: thread.id } })
          ]);

          // Emit realtime event
          if (this.io) {
            this.io.to(`thread:${thread.id}`).emit('chat:threadDeleted', { threadId: thread.id });
            this.io.to(`user:${thread.userId}`).emit('chat:threadDeleted', { threadId: thread.id });
          }

          console.log(`[MessageCleanupService] Deleted thread ${thread.id}`);
        } catch (err) {
          console.error(`[MessageCleanupService] Error deleting thread ${thread.id}:`, err.message);
        }
      }
    } catch (error) {
      console.error('[MessageCleanupService] Cleanup error:', error);
    }
  }

  // Static method to get messages for user (excluding deleted)
  static async getMessagesForUser(threadId) {
    return prisma.chatMessage.findMany({
      where: {
        threadId,
        isDeletedForUser: false
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  // Static method to get messages for admin (all)
  static async getMessagesForAdmin(threadId) {
    return prisma.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' }
    });
  }

  // Static method to soft delete messages for a user
  static async deleteMessagesForUser(userId) {
    const threads = await prisma.chatThread.findMany({
      where: { userId },
      select: { id: true }
    });

    return prisma.chatMessage.updateMany({
      where: { threadId: { in: threads.map(t => t.id) } },
      data: { isDeletedForUser: true, deletedForUserAt: new Date() }
    });
  }
}

module.exports = MessageCleanupService;
