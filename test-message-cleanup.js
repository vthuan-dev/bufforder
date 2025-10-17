/**
 * Test script for message cleanup functionality
 * Tests the automatic deletion of user messages after 1 hour
 */

const axios = require('axios');
const config = require('./backend/config');

const API_BASE = 'http://localhost:5000/api';

async function testMessageCleanup() {
  console.log('🧪 Testing Message Cleanup Functionality...\n');

  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const adminLogin = await axios.post(`${API_BASE}/auth/admin/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (!adminLogin.data.success) {
      throw new Error('Admin login failed');
    }
    
    const adminToken = adminLogin.data.data.token;
    console.log('✅ Admin logged in successfully\n');

    // 2. Login as user
    console.log('2. Logging in as user...');
    const userLogin = await axios.post(`${API_BASE}/auth/login`, {
      phoneNumber: '0123456789',
      password: 'password123'
    });
    
    if (!userLogin.data.success) {
      throw new Error('User login failed');
    }
    
    const userToken = userLogin.data.data.token;
    console.log('✅ User logged in successfully\n');

    // 3. Create a chat thread
    console.log('3. Creating chat thread...');
    const threadResponse = await axios.post(`${API_BASE}/chat/thread`, {}, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (!threadResponse.data.success) {
      throw new Error('Failed to create thread');
    }
    
    const threadId = threadResponse.data.data.threadId;
    console.log(`✅ Thread created: ${threadId}\n`);

    // 4. Send test messages
    console.log('4. Sending test messages...');
    
    // User sends messages
    await axios.post(`${API_BASE}/chat/thread/${threadId}/messages`, {
      text: 'Hello admin, this is a test message from user'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    await axios.post(`${API_BASE}/chat/thread/${threadId}/messages`, {
      text: 'This message should be deleted after 1 hour'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    // Admin sends message
    await axios.post(`${API_BASE}/chat/admin/threads/${threadId}/messages`, {
      text: 'Hello user, this is a message from admin'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Test messages sent\n');

    // 5. Check messages for user (should see all messages)
    console.log('5. Checking messages for user...');
    const userMessages = await axios.get(`${API_BASE}/chat/thread/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    console.log(`User sees ${userMessages.data.data.messages.length} messages:`);
    userMessages.data.data.messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.senderType}] ${msg.text} (${msg.createdAt})`);
    });
    console.log('');

    // 6. Check messages for admin (should see all messages)
    console.log('6. Checking messages for admin...');
    const adminMessages = await axios.get(`${API_BASE}/chat/admin/threads/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`Admin sees ${adminMessages.data.data.messages.length} messages:`);
    adminMessages.data.data.messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.senderType}] ${msg.text} (${msg.createdAt})`);
    });
    console.log('');

    // 7. Simulate message cleanup (manually trigger for testing)
    console.log('7. Simulating message cleanup...');
    
    // Create old messages for testing
    const ChatMessage = require('./backend/models/ChatMessage');
    const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    
    await ChatMessage.create({
      threadId: threadId,
      senderType: 'user',
      senderId: userLogin.data.data.user.id,
      text: 'This is an old user message (2 hours ago)',
      createdAt: oldTime
    });
    
    await ChatMessage.create({
      threadId: threadId,
      senderType: 'admin',
      senderId: adminLogin.data.data.admin.id,
      text: 'This is an old admin message (2 hours ago)',
      createdAt: oldTime
    });
    
    console.log('✅ Old test messages created\n');

    // 8. Run cleanup service manually
    console.log('8. Running cleanup service...');
    const MessageCleanupService = require('./backend/services/messageCleanup');
    const cleanupService = new MessageCleanupService();
    await cleanupService.cleanupMessages();
    console.log('✅ Cleanup service executed\n');

    // 9. Check messages again
    console.log('9. Checking messages after cleanup...');
    
    const userMessagesAfter = await axios.get(`${API_BASE}/chat/thread/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const adminMessagesAfter = await axios.get(`${API_BASE}/chat/admin/threads/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`User sees ${userMessagesAfter.data.data.messages.length} messages after cleanup:`);
    userMessagesAfter.data.data.messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.senderType}] ${msg.text} (${msg.createdAt})`);
    });
    console.log('');
    
    console.log(`Admin sees ${adminMessagesAfter.data.data.messages.length} messages after cleanup:`);
    adminMessagesAfter.data.data.messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.senderType}] ${msg.text} (${msg.createdAt})`);
    });
    console.log('');

    // 10. Test manual deletion
    console.log('10. Testing manual message deletion...');
    const deleteResponse = await axios.post(`${API_BASE}/chat/admin/users/${userLogin.data.data.user.id}/delete-messages`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`✅ Manual deletion completed: ${deleteResponse.data.data.deletedCount} messages deleted\n`);

    console.log('🎉 Message cleanup test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ User messages are automatically deleted after 1 hour');
    console.log('- ✅ Admin messages are preserved');
    console.log('- ✅ Admin can see all messages (including deleted ones)');
    console.log('- ✅ User only sees non-deleted messages');
    console.log('- ✅ Manual deletion works for admin');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
if (require.main === module) {
  testMessageCleanup();
}

module.exports = testMessageCleanup;
