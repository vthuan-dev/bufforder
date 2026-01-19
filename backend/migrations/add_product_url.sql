-- Add productUrl field to product table
ALTER TABLE `product` ADD COLUMN `productUrl` TEXT NULL AFTER `image`;
