-- Add account freeze mechanism fields
-- Migration: add_account_freeze.sql

ALTER TABLE User ADD COLUMN IF NOT EXISTS isFrozen BOOLEAN DEFAULT false;
ALTER TABLE User ADD COLUMN IF NOT EXISTS frozenBalance DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE User ADD COLUMN IF NOT EXISTS frozenAt DATETIME NULL;
ALTER TABLE User ADD COLUMN IF NOT EXISTS frozenReason TEXT NULL;
ALTER TABLE User ADD COLUMN IF NOT EXISTS unfrozenAt DATETIME NULL;
ALTER TABLE User ADD COLUMN IF NOT EXISTS unfrozenBy VARCHAR(255) NULL;

-- Add index for frozen accounts query
CREATE INDEX IF NOT EXISTS idx_user_frozen ON User(isFrozen);

-- Add comment
ALTER TABLE User COMMENT = 'User table with account freeze mechanism';
