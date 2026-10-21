module.exports = {
  // MySQL (Prisma)
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/greeting_message',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_this_in_production',
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || 'BuffOrderAdminAuth_k9X2mQ7vL4wZ1pE8_2026',
  PORT: process.env.PORT || 5000,
  INVITE_CODE: 'ASHFORD2024',
  INVITE_CODES: [
    '570318',
    '942615',
    '803247',
    '169437',
    '285074',
    '637890',
    '451908',
    '726349',
    '394176',
    '820564'
  ]
};
