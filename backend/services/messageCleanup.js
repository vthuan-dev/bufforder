const prisma = require('../lib/prisma');

/**
 * MessageCleanupService
 * Auto-delete inactive chat messages for users after 1 hour of no activity.
 * CRITICAL: Messages and threads are ALWAYS preserved in the database for Admin!
 * Only `isDeletedForUser` is set to true.
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
    console.log('[MessageCleanupService] Started - checking every 5 minutes (user-side soft delete only, admin preserved)');
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

      // Soft delete messages older than 1 hour for USER ONLY
      // This hides messages from user view while preserving full history for admin
      const result = await prisma.chatMessage.updateMany({
        where: {
          createdAt: { lt: oneHourAgo },
          isDeletedForUser: false
        },
        data: {
          isDeletedForUser: true,
          deletedForUserAt: new Date()
        }
      });

      if (result.count > 0) {
        console.log(`[MessageCleanupService] Soft-deleted ${result.count} inactive messages for users (Admin history preserved)`);
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
