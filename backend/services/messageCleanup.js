const ChatMessage = require('../models/ChatMessage');
const ChatThread = require('../models/ChatThread');

/**
 * Message cleanup service - IMPROVED VERSION
 * Deletes ENTIRE conversation (all messages, both user and admin) after 1 hour of INACTIVITY
 * Inactivity = no new messages in the thread for 1 hour
 */
class MessageCleanupService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.io = null; // Socket.io instance for realtime notifications
  }

  /**
   * Set the Socket.io instance for realtime notifications
   */
  setSocketIO(io) {
    this.io = io;
  }

  /**
   * Start the cleanup service
   * Runs every 5 minutes to check for inactive threads
   */
  start() {
    if (this.isRunning) {
      console.log('[MessageCleanup] Service already running');
      return;
    }

    this.isRunning = true;
    console.log('[MessageCleanup] Starting cleanup service (1h inactivity rule)...');

    // Run immediately on start
    this.cleanupInactiveThreads();

    // Then run every 5 minutes
    this.intervalId = setInterval(() => {
      this.cleanupInactiveThreads();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[MessageCleanup] Service stopped');
  }

  /**
   * Clean up threads that have been inactive for 1 hour
   * Deletes ALL messages in the thread (both user and admin)
   */
  async cleanupInactiveThreads() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      // Find threads that have been inactive for 1 hour
      const inactiveThreads = await ChatThread.find({
        lastMessageAt: { $lt: oneHourAgo },
        status: 'open' // Only clean open threads
      });

      if (inactiveThreads.length === 0) {
        return; // Nothing to clean
      }

      console.log(`[MessageCleanup] Found ${inactiveThreads.length} inactive threads to clean`);

      for (const thread of inactiveThreads) {
        await this.deleteThread(thread);
      }

    } catch (error) {
      console.error('[MessageCleanup] Error during cleanup:', error);
    }
  }

  /**
   * Delete a thread and all its messages (HARD DELETE)
   * Notifies connected clients via socket
   */
  async deleteThread(thread) {
    try {
      const threadId = thread._id;
      const userId = thread.userId;

      // Count messages before deletion for logging
      const messageCount = await ChatMessage.countDocuments({ threadId });

      // 1. Delete ALL messages in this thread
      await ChatMessage.deleteMany({ threadId });

      // 2. HARD DELETE the thread from DB
      await ChatThread.deleteOne({ _id: threadId });

      console.log(`[MessageCleanup] HARD DELETED thread ${threadId}: ${messageCount} messages removed`);

      // 3. Notify clients via socket (realtime sync)
      if (this.io) {
        // Notify the user
        this.io.to(`user:${userId}`).emit('chat:threadDeleted', {
          threadId: String(threadId),
          reason: 'inactivity',
          message: 'Cuộc trò chuyện đã được xóa hoàn toàn sau 1 giờ không hoạt động để bảo mật'
        });

        // Notify admins
        this.io.to('admins').emit('chat:threadDeleted', {
          threadId: String(threadId),
          userId: String(userId),
          reason: 'inactivity'
        });

        console.log(`[MessageCleanup] Emitted chat:threadDeleted for thread ${threadId}`);
      }

    } catch (error) {
      console.error(`[MessageCleanup] Error hard-deleting thread ${thread._id}:`, error);
    }
  }

  /**
   * Manually delete a specific thread
   */
  async deleteThreadById(threadId) {
    try {
      const thread = await ChatThread.findById(threadId);
      if (!thread) {
        console.log(`[MessageCleanup] Thread ${threadId} not found`);
        return false;
      }
      await this.deleteThread(thread);
      return true;
    } catch (error) {
      console.error(`[MessageCleanup] Error manually deleting thread ${threadId}:`, error);
      return false;
    }
  }

  /**
   * Get messages for user (exclude deleted threads)
   */
  static async getMessagesForUser(threadId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const docs = await ChatMessage.find({ threadId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return docs.reverse();
  }

  /**
   * Get messages for admin
   */
  static async getMessagesForAdmin(threadId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const docs = await ChatMessage.find({ threadId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return docs.reverse();
  }
}

module.exports = MessageCleanupService;

