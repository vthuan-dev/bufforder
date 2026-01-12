# 🎨 Database ERD - Visual Diagram

## Sơ đồ quan hệ đầy đủ (Full ERD)

```
                                    ┌─────────────────────────────────────────────────────┐
                                    │                      👤 USER                        │
                                    │─────────────────────────────────────────────────────│
                                    │ 🔑 id: String (CUID)                                │
                                    │ 🔒 phoneNumber: String (UNIQUE)                     │
                                    │ 📧 email: String? (UNIQUE)                          │
                                    │ 👤 fullName: String                                 │
                                    │ 🔐 password: String (hashed)                        │
                                    │ ⭐ vipLevel: String (default: "vip-0")              │
                                    │ 💰 totalDeposited: Float (0)                        │
                                    │ 💵 balance: Float (0)                               │
                                    │ ❄️  freezeBalance: Float (0)                        │
                                    │ 💸 commission: Float (0)                            │
                                    │ ✅ isActive: Boolean (true)                         │
                                    │ 🕐 lastSeenAt: DateTime?                            │
                                    │ 🎫 inviteCodeUsed: String?                          │
                                    │ ⚙️  commissionConfig: Json?                         │
                                    │ 📊 dailyEarnings: Json?                             │
                                    │ 📅 createdAt, updatedAt                             │
                                    └──────────────┬──────────────────────────────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
                    │                              │                              │
      