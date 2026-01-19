-- Add GPS location fields to ChatThread table
ALTER TABLE `chatthread` 
ADD COLUMN `userLatitude` DOUBLE NULL AFTER `userIp`,
ADD COLUMN `userLongitude` DOUBLE NULL AFTER `userLatitude`,
ADD COLUMN `userGpsLocation` TEXT NULL AFTER `userLongitude`,
ADD COLUMN `userGpsUpdatedAt` DATETIME NULL AFTER `userGpsLocation`;
