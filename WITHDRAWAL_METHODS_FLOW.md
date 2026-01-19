# Flow Chi Tiết: Withdrawal Methods

## 🗄️ Database Structure

### Table: `usdtwallet`
```sql
CREATE TABLE usdtwallet (
  id VARCHAR(191) PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  walletAddress VARCHAR(191) NOT NULL,
  walletName VARCHAR(191) NOT NULL,
  network VARCHAR(191) NOT NULL,
  isDefault BOOLEAN DEFAULT false,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES user(id)
);
```

### Table: `bankcard`
```sql
CREATE TABLE bankcard (
  id VARCHAR(191) PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  bankName VARCHAR(191) NOT NULL,
  cardNumber VARCHAR(191) NOT NULL,
  holderName VARCHAR(191) NOT NULL,
  isDefault BOOLEAN DEFAULT false,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES user(id)
);
```

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           WithdrawalMethodsPage Component                │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │         TabNavigation                          │    │  │
│  │  │  [Bank Cards] [USDT Wallets]                  │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  │                                                          │  │
│  │  ┌─────────────────┐      ┌──────────────────┐        │  │
│  │  │ BankCardsTab    │      │ USDTWalletsTab   │        │  │
│  │  │                 │      │                  │        │  │
│  │  │ 💙 Blue Cards   │      │ 💜 Purple Cards  │        │  │
│  │  └─────────────────┘      └──────────────────┘        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User Actions
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CUSTOM HOOKS LAYER                         │
│                                                                 │
│  ┌──────────────────────┐         ┌──────────────────────┐    │
│  │   useBankCards()     │         │  useUSDTWallets()    │    │
│  │                      │         │                      │    │
│  │  - cards[]           │         │  - wallets[]         │    │
│  │  - addCard()         │         │  - addWallet()       │    │
│  │  - deleteCard()      │         │  - deleteWallet()    │    │
│  │  - setDefault()      │         │  - setDefault()      │    │
│  │  - isLoading         │         │  - isLoading         │    │
│  │  - error             │         │  - error             │    │
│  └──────────────────────┘         └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API SERVICE LAYER                          │
│                     (frontend/src/services/api.ts)              │
│                                                                 │
│  Bank Cards:                    USDT Wallets:                  │
│  ├─ getBankCards()              ├─ getUsdtWallets()           │
│  ├─ addBankCard()               ├─ addUsdtWallet()            │
│  ├─ deleteBankCard(id)          ├─ deleteUsdtWallet(id)       │
│  └─ setDefaultBankCard(id)      └─ setDefaultUsdtWallet(id)   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API ROUTES                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/bank-cards                                         │  │
│  │  ├─ GET    /          → List all cards                  │  │
│  │  ├─ POST   /          → Add new card                    │  │
│  │  ├─ DELETE /:id       → Delete card                     │  │
│  │  └─ PUT    /:id       → Set default card                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/usdt-wallets                                       │  │
│  │  ├─ GET    /          → List all wallets                │  │
│  │  ├─ POST   /          → Add new wallet                  │  │
│  │  ├─ DELETE /:id       → Delete wallet                   │  │
│  │  └─ PUT    /:id       → Set default wallet              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (MySQL)                           │
│                                                                 │
│  ┌──────────────────────┐         ┌──────────────────────┐    │
│  │  Table: bankcard     │         │  Table: usdtwallet   │    │
│  │                      │         │                      │    │
│  │  id                  │         │  id                  │    │
│  │  userId ────────┐    │         │  userId ────────┐   │    │
│  │  bankName       │    │         │  walletAddress  │   │    │
│  │  cardNumber     │    │         │  walletName     │   │    │
│  │  holderName     │    │         │  network        │   │    │
│  │  isDefault      │    │         │  isDefault      │   │    │
│  │  createdAt      │    │         │  createdAt      │   │    │
│  └──────────────────────┘         └──────────────────────┘    │
│           │                                 │                  │
│           └─────────────┬───────────────────┘                  │
│                         │                                      │
│                  ┌──────▼──────┐                              │
│                  │ Table: user  │                              │
│                  │              │                              │
│                  │ id           │                              │
│                  │ username     │                              │
│                  │ email        │                              │
│                  │ balance      │                              │
│                  └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Example Flow: Add USDT Wallet

### Step 1: User Input
```
User fills form:
├─ Wallet Name: "My Binance Wallet"
├─ Network: TRC20
└─ Address: "TXyz123abc456def789..."
```

### Step 2: Frontend Hook
```typescript
// useUSDTWallets.ts
const addWallet = async (input) => {
  setIsLoading(true);
  
  const result = await api.addUsdtWallet({
    walletName: "My Binance Wallet",
    walletAddress: "TXyz123abc456def789...",
    network: "TRC20",
    isDefault: wallets.length === 0  // Auto-default if first
  });
  
  setWallets(result.data.usdtWallets);
  setIsLoading(false);
}
```

### Step 3: API Call
```typescript
// api.ts
addUsdtWallet: async (data) => {
  const response = await fetch('/api/usdt-wallets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

### Step 4: Backend Processing
```javascript
// backend/routes/usdt-wallets.js
router.post('/', async (req, res) => {
  const { walletName, walletAddress, network, isDefault } = req.body;
  const userId = req.user.id;
  
  // If setting as default, unset others
  if (isDefault) {
    await prisma.usdtwallet.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    });
  }
  
  // Create new wallet
  const wallet = await prisma.usdtwallet.create({
    data: {
      id: generateId(),
      userId,
      walletName,
      walletAddress,
      network,
      isDefault
    }
  });
  
  // Return all wallets
  const allWallets = await prisma.usdtwallet.findMany({
    where: { userId }
  });
  
  res.json({ success: true, data: { usdtWallets: allWallets } });
});
```

### Step 5: Database Insert
```sql
-- MySQL executes:
INSERT INTO usdtwallet (
  id, 
  userId, 
  walletName, 
  walletAddress, 
  network, 
  isDefault, 
  createdAt
) VALUES (
  'wallet_abc123',
  'user_xyz789',
  'My Binance Wallet',
  'TXyz123abc456def789...',
  'TRC20',
  1,
  NOW()
);
```

### Step 6: Response & UI Update
```
Backend → Frontend:
{
  success: true,
  data: {
    usdtWallets: [
      {
        id: "wallet_abc123",
        walletName: "My Binance Wallet",
        walletAddress: "TXyz123abc456def789...",
        network: "TRC20",
        isDefault: true,
        createdAt: "2025-01-19T..."
      }
    ]
  }
}

Frontend updates:
├─ Close form
├─ Update wallets list
├─ Show success toast: "Wallet added successfully!"
└─ Render purple gradient card
```

## 🔄 Example Flow: Delete Bank Card

### Step 1: User Action
```
User clicks delete button on card
└─ Confirmation dialog appears
    └─ User confirms
```

### Step 2: Frontend Hook
```typescript
// useBankCards.ts
const deleteCard = async (id) => {
  setIsLoading(true);
  
  const result = await api.deleteBankCard(id);
  
  setCards(result.data.bankCards);
  setIsLoading(false);
}
```

### Step 3: API Call
```typescript
// api.ts
deleteBankCard: async (id) => {
  const response = await fetch(`/api/bank-cards/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

### Step 4: Backend Processing
```javascript
// backend/routes/bank-cards.js
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Check if card exists and belongs to user
  const card = await prisma.bankcard.findFirst({
    where: { id, userId }
  });
  
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  
  const wasDefault = card.isDefault;
  
  // Delete card
  await prisma.bankcard.delete({
    where: { id }
  });
  
  // If was default, promote next card
  if (wasDefault) {
    const nextCard = await prisma.bankcard.findFirst({
      where: { userId }
    });
    
    if (nextCard) {
      await prisma.bankcard.update({
        where: { id: nextCard.id },
        data: { isDefault: true }
      });
    }
  }
  
  // Return updated list
  const allCards = await prisma.bankcard.findMany({
    where: { userId }
  });
  
  res.json({ success: true, data: { bankCards: allCards } });
});
```

### Step 5: Database Delete
```sql
-- MySQL executes:
DELETE FROM bankcard WHERE id = 'card_abc123';

-- If was default, promote next:
UPDATE bankcard 
SET isDefault = 1 
WHERE userId = 'user_xyz789' 
LIMIT 1;
```

### Step 6: Response & UI Update
```
Backend → Frontend:
{
  success: true,
  data: {
    bankCards: [
      // Remaining cards, with new default if needed
    ]
  }
}

Frontend updates:
├─ Remove card from list with animation
├─ Update default badge if changed
└─ Show success toast: "Card deleted successfully!"
```

## 📝 Summary

**Có, tất cả đều lưu trong database MySQL:**

1. **USDT Wallets** → Table `usdtwallet`
   - Địa chỉ ví, tên ví, network (TRC20/ERC20)
   - Mỗi user có thể có nhiều ví
   - 1 ví được đánh dấu default

2. **Bank Cards** → Table `bankcard`
   - Tên ngân hàng, số tài khoản, tên chủ thẻ
   - Mỗi user có thể có nhiều thẻ
   - 1 thẻ được đánh dấu default

3. **Flow hoàn chỉnh:**
   ```
   User Input → React Hook → API Call → Backend Route → 
   Prisma ORM → MySQL Database → Response → UI Update
   ```

4. **Data được persist (lưu trữ lâu dài):**
   - Không mất khi refresh page
   - Không mất khi logout/login lại
   - Lưu trong database thật sự
   - Có thể query, backup, restore

Bạn có thể test bằng cách:
1. Add vài USDT wallets và bank cards
2. Refresh page → Data vẫn còn
3. Logout và login lại → Data vẫn còn
4. Check trực tiếp trong MySQL database → Data có trong table
