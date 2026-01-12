# 🎨 Mermaid Diagrams - Greeting Message Platform

## 1. 📊 Database ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    USER ||--o{ ADDRESS : has
    USER ||--o{ BANKCARD : has
    USER ||--o{ ORDER : places
    USER ||--o{ CHATTHREAD : creates
    USER ||--o{ DEPOSITREQUEST : submits
    USER ||--o{ WITHDRAWALREQUEST : submits
    CHATTHREAD ||--o{ CHATMESSAGE : contains

    USER {
        string id PK
        string phoneNumber UK
        string email UK
        string fullName
        string password
        string vipLevel
        float totalDeposited
        float balance
        float freezeBalance
        float commission
        boolean isActive
        datetime lastSeenAt
        string inviteCodeUsed
        json commissionConfig
        json dailyEarnings
        datetime createdAt
        datetime updatedAt
    }

    ADDRESS {
        string id PK
        string userId FK
        string fullName
        string phoneNumber
        string addressLine1
        string city
        string postalCode
        boolean isDefault
    }

    BANKCARD {
        string id PK
        string userId FK
        string bankName
        string cardNumber
        string accountName
        boolean isDefault
    }

    ORDER {
        string id PK
        string userId FK
        string orderNumber UK
        string clientRequestId
        int productId
        string productName
        float productPrice
        float commissionRate
        float commissionAmount
        string brand
        string category
        text image
        string status
        datetime completedAt
        datetime orderDate
        datetime createdAt
        datetime updatedAt
    }

    CHATTHREAD {
        string id PK
        string userId FK
        string userIp
        datetime lastMessageAt
        text lastMessageText
        int unreadForAdmin
        int unreadForUser
        string status
        datetime createdAt
        datetime updatedAt
    }

    CHATMESSAGE {
        string id PK
        string threadId FK
        string senderType
        string senderId
        text text
        text imageUrl
        boolean readByAdmin
        boolean readByUser
        boolean isDeletedForUser
        datetime deletedForUserAt
        boolean isDeletedForAdmin
        datetime deletedForAdminAt
        datetime createdAt
        datetime updatedAt
    }

    DEPOSITREQUEST {
        string id PK
        string userId FK
        float amount
        string status
        datetime requestDate
        string approvedBy
        datetime approvedAt
        text rejectionReason
        text notes
        datetime createdAt
        datetime updatedAt
    }

    WITHDRAWALREQUEST {
        string id PK
        string userId FK
        float amount
        string bankCardId
        string status
        string approvedBy
        datetime approvedAt
        text rejectionReason
        text notes
        datetime requestDate
        datetime createdAt
        datetime updatedAt
    }

    ADMIN {
        string id PK
        string username UK
        string email UK
        string fullName
        string phoneNumber
        string password
        string role
        boolean isActive
        datetime lastLogin
        datetime createdAt
        datetime updatedAt
    }
```

---

## 2. 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UserApp["👤 User App<br/>(React + TypeScript)"]
        AdminPanel["👨‍💼 Admin Panel<br/>(React + TypeScript)"]
    end

    subgraph "Server Layer"
        Express["🚀 Express Server<br/>(Node.js)"]
        SocketIO["💬 Socket.IO<br/>(Real-time)"]
        
        subgraph "Middleware"
            CORS["CORS"]
            JWT["JWT Auth"]
            ErrorHandler["Error Handler"]
        end
        
        subgraph "Routes"
            AuthRoute["Auth Routes"]
            OrderRoute["Order Routes"]
            VIPRoute["VIP Routes"]
            AdminRoute["Admin Routes"]
            ChatRoute["Chat Routes"]
        end
        
        subgraph "Services"
            MessageCleanup["Message Cleanup"]
            Cache["Redis Cache"]
        end
    end

    subgraph "Data Layer"
        Prisma["🔷 Prisma ORM"]
        MySQL["🗄️ MySQL Database<br/>(MariaDB 10.4)"]
    end

    UserApp -->|HTTP/WebSocket| Express
    AdminPanel -->|HTTP/WebSocket| Express
    
    Express --> CORS
    Express --> JWT
    Express --> ErrorHandler
    
    Express --> AuthRoute
    Express --> OrderRoute
    Express --> VIPRoute
    Express --> AdminRoute
    Express --> ChatRoute
    
    Express --> SocketIO
    Express --> MessageCleanup
    Express --> Cache
    
    AuthRoute --> Prisma
    OrderRoute --> Prisma
    VIPRoute --> Prisma
    AdminRoute --> Prisma
    ChatRoute --> Prisma
    
    Prisma -->|SQL Queries| MySQL

    style UserApp fill:#e1f5ff
    style AdminPanel fill:#fff4e1
    style Express fill:#e8f5e9
    style MySQL fill:#f3e5f5
    style Prisma fill:#e0f2f1
```

---

## 3. 🔄 User Journey Flow

```mermaid
flowchart TD
    Start([👤 User Opens App]) --> Register{Has Account?}
    
    Register -->|No| RegForm[📝 Fill Registration Form<br/>Phone, Name, Password, Invite Code]
    RegForm --> RegAPI[POST /api/auth/register]
    RegAPI --> RegSuccess[✅ Account Created<br/>VIP 0, Balance: $0]
    
    Register -->|Yes| Login[🔐 Login<br/>Phone + Password]
    Login --> LoginAPI[POST /api/auth/login]
    LoginAPI --> GetToken[🎫 Receive JWT Token]
    
    RegSuccess --> Home
    GetToken --> Home[🏠 Home Dashboard]
    
    Home --> Deposit[💰 Request Deposit]
    Deposit --> DepositAPI[POST /api/vip/deposit]
    DepositAPI --> AdminApprove{Admin Approves?}
    
    AdminApprove -->|Yes| UpdateBalance[✅ Balance Updated<br/>VIP Upgraded]
    AdminApprove -->|No| DepositRejected[❌ Deposit Rejected]
    
    UpdateBalance --> TakeOrder[📦 Take Order]
    TakeOrder --> OrderAPI[POST /api/orders/take]
    OrderAPI --> CheckBalance{Balance >= Price?}
    
    CheckBalance -->|Yes| CalcCommission[💵 Calculate Commission<br/>Based on VIP Level]
    CheckBalance -->|No| InsufficientBalance[❌ Insufficient Balance]
    
    CalcCommission --> CheckDaily{Daily Limit<br/>Reached?}
    CheckDaily -->|No| CreateOrder[✅ Order Created<br/>Commission Earned]
    CheckDaily -->|Yes| DailyLimit[⏰ Daily Limit Reached<br/>Come Back Tomorrow]
    
    CreateOrder --> MoreOrders{Take More<br/>Orders?}
    MoreOrders -->|Yes| TakeOrder
    MoreOrders -->|No| Withdraw[💸 Request Withdrawal]
    
    Withdraw --> WithdrawAPI[POST /api/vip/withdrawal]
    WithdrawAPI --> AdminApproveW{Admin Approves?}
    
    AdminApproveW -->|Yes| ReceiveMoney[✅ Money Received]
    AdminApproveW -->|No| WithdrawRejected[❌ Withdrawal Rejected]
    
    ReceiveMoney --> End([🎉 Success])
    
    style Start fill:#e1f5ff
    style Home fill:#e8f5e9
    style UpdateBalance fill:#c8e6c9
    style CreateOrder fill:#c8e6c9
    style ReceiveMoney fill:#c8e6c9
    style InsufficientBalance fill:#ffcdd2
    style DepositRejected fill:#ffcdd2
    style WithdrawRejected fill:#ffcdd2
```

---

## 4. 💰 Order & Commission Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as 🎨 Frontend
    participant S as 🚀 Server
    participant P as 🔷 Prisma
    participant D as 🗄️ Database

    U->>F: Click "Take Order"
    F->>F: Generate idempotencyKey
    F->>S: POST /api/orders/take<br/>{product, idempotencyKey}
    
    S->>S: Verify JWT Token
    S->>P: Check User Balance
    P->>D: SELECT * FROM User WHERE id = ?
    D-->>P: User Data
    P-->>S: User Balance: $500
    
    alt Balance Insufficient
        S-->>F: ❌ Error: Insufficient Balance
        F-->>U: Show Error Message
    else Balance Sufficient
        S->>S: Calculate Commission<br/>VIP 3 → $18/order
        S->>S: Add Randomness (±10%)<br/>$18 × 1.05 = $18.90
        S->>S: Check Daily Limit<br/>$150/$180 → OK
        
        S->>P: Begin Transaction
        P->>D: BEGIN
        
        P->>D: INSERT INTO Order<br/>(userId, product, commission)
        D-->>P: Order Created
        
        P->>D: UPDATE User SET<br/>balance += $15.12,<br/>commission += $18.90
        D-->>P: User Updated
        
        P->>D: COMMIT
        D-->>P: ✅ Transaction Success
        
        P-->>S: Order + Updated User
        S-->>F: ✅ Success<br/>{order, newBalance, commission}
        F-->>U: Show Success<br/>Balance: $515.12<br/>Commission: +$18.90
    end
```

---

## 5. 💬 Real-time Chat Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant UF as 🎨 User Frontend
    participant S as 🚀 Socket.IO Server
    participant AF as 🎨 Admin Frontend
    participant A as 👨‍💼 Admin
    participant D as 🗄️ Database

    U->>UF: Open Chat
    UF->>S: Connect Socket.IO<br/>auth: {token}
    S->>S: Verify JWT
    S->>UF: Connected ✅
    S->>S: Join room: "user:123"
    
    A->>AF: Open Admin Panel
    AF->>S: Connect Socket.IO<br/>auth: {adminToken}
    S->>S: Verify Admin Token
    S->>AF: Connected ✅
    S->>S: Join room: "admins"
    
    U->>UF: Type Message: "Hello"
    UF->>S: emit('chat:send', {text: "Hello"})
    S->>D: Save Message
    D-->>S: Message Saved
    
    S->>S: Increment unreadForAdmin
    S->>AF: emit('chat:message', {text: "Hello"})
    AF->>A: 🔔 New Message<br/>"Hello"
    
    A->>AF: Type Reply: "Hi, how can I help?"
    AF->>S: emit('chat:send', {text: "Hi..."})
    S->>D: Save Message
    D-->>S: Message Saved
    
    S->>S: Increment unreadForUser
    S->>UF: emit('chat:message', {text: "Hi..."})
    UF->>U: 🔔 New Message<br/>"Hi, how can I help?"
    
    U->>UF: Read Message
    UF->>S: emit('chat:markRead')
    S->>D: UPDATE unreadForUser = 0
    D-->>S: Updated
```

---

## 6. 🔐 Authentication Flow

```mermaid
flowchart LR
    subgraph Registration
        R1[📝 User Input<br/>Phone, Password, Invite] --> R2[POST /api/auth/register]
        R2 --> R3{Validate}
        R3 -->|Valid| R4[Hash Password<br/>bcrypt]
        R3 -->|Invalid| R5[❌ Error]
        R4 --> R6[Create User in DB]
        R6 --> R7[Generate JWT Token]
        R7 --> R8[✅ Return Token + User]
    end
    
    subgraph Login
        L1[🔐 User Input<br/>Phone, Password] --> L2[POST /api/auth/login]
        L2 --> L3[Find User by Phone]
        L3 --> L4{User Exists?}
        L4 -->|Yes| L5[Compare Password<br/>bcrypt.compare]
        L4 -->|No| L6[❌ User Not Found]
        L5 --> L7{Password Match?}
        L7 -->|Yes| L8[Generate JWT Token]
        L7 -->|No| L9[❌ Wrong Password]
        L8 --> L10[✅ Return Token + User]
    end
    
    subgraph Protected Request
        P1[🔒 API Request<br/>Authorization: Bearer token] --> P2[Extract Token]
        P2 --> P3[Verify JWT]
        P3 --> P4{Valid?}
        P4 -->|Yes| P5[Extract userId]
        P4 -->|No| P6[❌ 401 Unauthorized]
        P5 --> P7[Attach to req.userId]
        P7 --> P8[✅ Process Request]
    end
    
    style R8 fill:#c8e6c9
    style L10 fill:#c8e6c9
    style P8 fill:#c8e6c9
    style R5 fill:#ffcdd2
    style L6 fill:#ffcdd2
    style L9 fill:#ffcdd2
    style P6 fill:#ffcdd2
```

---

## 7. 📊 VIP System Flow

```mermaid
graph TD
    Start([User Deposits Money]) --> CheckTotal{Calculate<br/>Total Deposited}
    
    CheckTotal --> VIP0{>= $100?}
    VIP0 -->|No| SetVIP0[VIP 0<br/>$5/order<br/>$50/day]
    VIP0 -->|Yes| VIP1{>= $500?}
    
    VIP1 -->|No| SetVIP1[VIP 1<br/>$8/order<br/>$80/day]
    VIP1 -->|Yes| VIP2{>= $1,000?}
    
    VIP2 -->|No| SetVIP2[VIP 2<br/>$12/order<br/>$120/day]
    VIP2 -->|Yes| VIP3{>= $3,000?}
    
    VIP3 -->|No| SetVIP3[VIP 3<br/>$18/order<br/>$180/day]
    VIP3 -->|Yes| VIP4{>= $5,000?}
    
    VIP4 -->|No| SetVIP4[VIP 4<br/>$25/order<br/>$250/day]
    VIP4 -->|Yes| VIP5{>= $10,000?}
    
    VIP5 -->|No| SetVIP5[VIP 5<br/>$35/order<br/>$350/day]
    VIP5 -->|Yes| VIP6{>= $20,000?}
    
    VIP6 -->|No| SetVIP6[VIP 6<br/>$50/order<br/>$500/day]
    VIP6 -->|Yes| VIP7{>= $50,000?}
    
    VIP7 -->|No| SetVIP7[VIP 7<br/>$70/order<br/>$700/day]
    VIP7 -->|Yes| SVIP{>= $100,000?}
    
    SVIP -->|No| SetSVIP[SVIP<br/>$100/order<br/>$1,000/day]
    SVIP -->|Yes| SetRoyal[Royal VIP<br/>$150/order<br/>$1,500/day]
    
    SetVIP0 --> Update[Update User<br/>vipLevel + commissionConfig]
    SetVIP1 --> Update
    SetVIP2 --> Update
    SetVIP3 --> Update
    SetVIP4 --> Update
    SetVIP5 --> Update
    SetVIP6 --> Update
    SetVIP7 --> Update
    SetSVIP --> Update
    SetRoyal --> Update
    
    Update --> Notify[🔔 Notify User<br/>VIP Upgraded!]
    Notify --> End([✅ Complete])
    
    style SetVIP0 fill:#ffebee
    style SetVIP1 fill:#fff3e0
    style SetVIP2 fill:#fff9c4
    style SetVIP3 fill:#f0f4c3
    style SetVIP4 fill:#dcedc8
    style SetVIP5 fill:#c8e6c9
    style SetVIP6 fill:#b2dfdb
    style SetVIP7 fill:#b2ebf2
    style SetSVIP fill:#b3e5fc
    style SetRoyal fill:#e1bee7
```

---

## 8. 🔄 Admin Workflow

```mermaid
stateDiagram-v2
    [*] --> Login: Admin Opens Panel
    Login --> Dashboard: Authenticated
    
    Dashboard --> Users: Manage Users
    Dashboard --> Orders: Manage Orders
    Dashboard --> Deposits: Review Deposits
    Dashboard --> Withdrawals: Review Withdrawals
    Dashboard --> Chat: Support Chat
    
    Users --> ViewUser: View Details
    Users --> EditUser: Edit User
    Users --> DeleteUser: Delete User
    Users --> TopUp: Top Up Balance
    
    ViewUser --> Users
    EditUser --> Users
    DeleteUser --> Users
    TopUp --> Users
    
    Orders --> ViewOrder: View Details
    Orders --> UpdateStatus: Update Status
    
    ViewOrder --> Orders
    UpdateStatus --> Orders
    
    Deposits --> ReviewDeposit: Review Request
    ReviewDeposit --> ApproveDeposit: Approve
    ReviewDeposit --> RejectDeposit: Reject
    
    ApproveDeposit --> UpdateUserBalance: Update Balance + VIP
    RejectDeposit --> NotifyUser: Send Notification
    
    UpdateUserBalance --> Deposits
    NotifyUser --> Deposits
    
    Withdrawals --> ReviewWithdrawal: Review Request
    ReviewWithdrawal --> ApproveWithdrawal: Approve
    ReviewWithdrawal --> RejectWithdrawal: Reject
    
    ApproveWithdrawal --> DeductBalance: Deduct Balance
    RejectWithdrawal --> NotifyUser2: Send Notification
    
    DeductBalance --> Withdrawals
    NotifyUser2 --> Withdrawals
    
    Chat --> ViewThreads: View All Threads
    ViewThreads --> SelectThread: Select Thread
    SelectThread --> SendMessage: Send Reply
    SendMessage --> ViewThreads
    
    Dashboard --> Logout: Sign Out
    Logout --> [*]
```

---

## 📝 Notes

Các mermaid diagram này có thể render trực tiếp trên:
- ✅ GitHub
- ✅ GitLab
- ✅ VS Code (với extension)
- ✅ Notion
- ✅ Confluence
- ✅ Mermaid Live Editor (https://mermaid.live)

**Cách sử dụng:**
1. Copy code mermaid
2. Paste vào markdown file
3. View trên platform hỗ trợ mermaid

**Hoặc export sang:**
- PNG/SVG: Dùng Mermaid CLI hoặc Live Editor
- PDF: Dùng Pandoc hoặc Markdown to PDF tools
