const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

// Test user credentials (update with your test user)
const TEST_USER = {
  phoneNumber: '0123456789',
  password: 'password123'
};

async function testUSDTWalletAPI() {
  console.log('🧪 Testing USDT Wallet API...\n');

  try {
    // 1. Login to get token
    console.log('1️⃣ Logging in...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    const loginData = await loginRes.json();
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      console.log('💡 Please update TEST_USER credentials in the script');
      return;
    }
    
    const token = loginData.data.token;
    console.log('✅ Login successful\n');

    // 2. Get existing wallets
    console.log('2️⃣ Fetching existing wallets...');
    const getRes = await fetch(`${API_BASE}/usdt-wallets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getData = await getRes.json();
    console.log('✅ Wallets:', getData.data?.usdtWallets?.length || 0, 'found\n');

    // 3. Add TRC20 wallet
    console.log('3️⃣ Adding TRC20 wallet...');
    const trc20Wallet = {
      walletAddress: 'TXYZabc123456789012345678901234567',
      walletName: 'Test TRC20 Wallet',
      network: 'TRC20'
    };
    const addTrc20Res = await fetch(`${API_BASE}/usdt-wallets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(trc20Wallet)
    });
    const addTrc20Data = await addTrc20Res.json();
    
    if (addTrc20Data.success) {
      console.log('✅ TRC20 wallet added successfully');
      const addedWallet = addTrc20Data.data.usdtWallets.find(w => w.walletAddress === trc20Wallet.walletAddress);
      console.log('   ID:', addedWallet?.id);
      console.log('   Default:', addedWallet?.isDefault, '\n');
    } else {
      console.log('⚠️  TRC20 wallet add result:', addTrc20Data.message, '\n');
    }

    // 4. Add ERC20 wallet
    console.log('4️⃣ Adding ERC20 wallet...');
    const erc20Wallet = {
      walletAddress: '0x1234567890123456789012345678901234567890',
      walletName: 'Test ERC20 Wallet',
      network: 'ERC20'
    };
    const addErc20Res = await fetch(`${API_BASE}/usdt-wallets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(erc20Wallet)
    });
    const addErc20Data = await addErc20Res.json();
    
    if (addErc20Data.success) {
      console.log('✅ ERC20 wallet added successfully');
      const addedWallet = addErc20Data.data.usdtWallets.find(w => w.walletAddress === erc20Wallet.walletAddress);
      console.log('   ID:', addedWallet?.id);
      console.log('   Default:', addedWallet?.isDefault, '\n');
    } else {
      console.log('⚠️  ERC20 wallet add result:', addErc20Data.message, '\n');
    }

    // 5. Get all wallets again
    console.log('5️⃣ Fetching all wallets...');
    const getAllRes = await fetch(`${API_BASE}/usdt-wallets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getAllData = await getAllRes.json();
    const allWallets = getAllData.data?.usdtWallets || [];
    console.log('✅ Total wallets:', allWallets.length);
    allWallets.forEach((w, i) => {
      console.log(`   ${i + 1}. ${w.walletName} (${w.network}) - Default: ${w.isDefault}`);
    });
    console.log();

    // 6. Test invalid address
    console.log('6️⃣ Testing invalid address validation...');
    const invalidWallet = {
      walletAddress: 'INVALID_ADDRESS',
      walletName: 'Invalid Wallet',
      network: 'TRC20'
    };
    const invalidRes = await fetch(`${API_BASE}/usdt-wallets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidWallet)
    });
    const invalidData = await invalidRes.json();
    
    if (!invalidData.success) {
      console.log('✅ Validation working correctly:', invalidData.message, '\n');
    } else {
      console.log('⚠️  Validation should have failed\n');
    }

    // 7. Set default wallet (if we have multiple)
    if (allWallets.length > 1) {
      console.log('7️⃣ Setting second wallet as default...');
      const secondWallet = allWallets[1];
      const setDefaultRes = await fetch(`${API_BASE}/usdt-wallets/${secondWallet.id}/default`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const setDefaultData = await setDefaultRes.json();
      
      if (setDefaultData.success) {
        console.log('✅ Default wallet updated');
        const defaultWallet = setDefaultData.data.usdtWallets.find(w => w.isDefault);
        console.log('   New default:', defaultWallet?.walletName, '\n');
      }
    }

    // 8. Delete a wallet
    if (allWallets.length > 0) {
      console.log('8️⃣ Deleting last wallet...');
      const lastWallet = allWallets[allWallets.length - 1];
      const deleteRes = await fetch(`${API_BASE}/usdt-wallets/${lastWallet.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const deleteData = await deleteRes.json();
      
      if (deleteData.success) {
        console.log('✅ Wallet deleted successfully');
        console.log('   Remaining wallets:', deleteData.data.usdtWallets.length, '\n');
      }
    }

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testUSDTWalletAPI();
