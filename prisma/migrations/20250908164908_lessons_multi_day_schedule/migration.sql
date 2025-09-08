/*
  Warnings:

  - You are about to drop the column `endAt` on the `lesson` table. All the data in the column will be lost.
  - You are about to drop the column `startAt` on the `lesson` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `lesson` DROP COLUMN `endAt`,
    DROP COLUMN `startAt`,
    ADD COLUMN `daysJson` JSON NULL;
