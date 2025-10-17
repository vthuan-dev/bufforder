const ChatMessage = require('../models/ChatMessage');
const ChatThread = require('../models/ChatThread');

/**
 * Message cleanup service
 * Automatically deletes user messages after 1 hour
 * Keeps admin messages permanently
 */
class MessageCleanupService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Start the cleanup service
   * Runs every 5 minutes to check for messages to delete
   */
  start() {
    if (this.isRunning) {
      console.log('[MessageCleanup] Service already running');
      return;
    }

    this.isRunning = true;
    console.log('[MessageCleanup] Starting message cleanup service...');

    // Run immediately on start
    this.cleanupMessages();

    // Then run every 5 minutes
    this.intervalId = setInterval(() => {
      this.cleanupMessages();
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
   * Clean up messages based on retention policy
   */
  async cleanupMessages() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      
      // Find user messages older than 1 hour that haven't been marked for deletion
      const userMessagesToDelete = await ChatMessage.find({
        senderType: 'user',
        createdAt: { $lt: oneHourAgo },
        isDeletedForUser: false
      });

      if (userMessagesToDelete.length > 0) {
        console.log(`[MessageCleanup] Found ${userMessagesToDelete.length} user messages to delete`);
        
        // Mark user messages as deleted for user (but keep for admin)
        await ChatMessage.updateMany(
          {
            _id: { $in: userMessagesToDelete.map(msg => msg._id) }
          },
          {
            $set: {
              isDeletedForUser: true,
              deletedForUserAt: new Date()
            }
          }
        );

        console.log(`[MessageCleanup] Marked ${userMessagesToDelete.length} user messages as deleted for user`);
      }

      // Update thread last message if needed
      await this.updateThreadLastMessages();

    } catch (error) {
      console.error('[MessageCleanup] Error during cleanup:', error);
    }
  }

  /**
   * Update thread last messages after cleanup
   */
  async updateThreadLastMessages() {
    try {
      const threads = await ChatThread.find({});
      
      for (const thread of threads) {
        // Find the last non-deleted message for this thread
        const lastMessage = await ChatMessage.findOne({
          threadId: thread._id,
          isDeletedForUser: false
        }).sort({ createdAt: -1 });

        if (lastMessage) {
          await ChatThread.findByIdAndUpdate(thread._id, {
            lastMessageAt: lastMessage.createdAt,
            lastMessageText: lastMessage.text
          });
        }
      }
    } catch (error) {
      console.error('[MessageCleanup] Error updating thread messages:', error);
    }
  }

  /**
   * Get messages for user (excluding deleted ones)
   */
  static async getMessagesForUser(threadId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    // Fetch newest first to ensure we always include the most recent messages
    const docs = await ChatMessage.find({
      threadId,
      isDeletedForUser: false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Return in chronological order for UI rendering
    return docs.reverse();
  }

  /**
   * Get messages for admin (including all messages)
   */
  static async getMessagesForAdmin(threadId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const docs = await ChatMessage.find({
      threadId,
      isDeletedForAdmin: false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    return docs.reverse();
  }

  /**
   * Manually delete messages for a specific user
   */
  static async deleteMessagesForUser(userId) {
    try {
      const result = await ChatMessage.updateMany(
        { senderId: userId, senderType: 'user' },
        {
          $set: {
            isDeletedForUser: true,
            deletedForUserAt: new Date()
          }
        }
      );
      
      console.log(`[MessageCleanup] Manually deleted ${result.modifiedCount} messages for user ${userId}`);
      return result;
    } catch (error) {
      console.error('[MessageCleanup] Error deleting messages for user:', error);
      throw error;
    }
  }
}

module.exports = MessageCleanupService;
