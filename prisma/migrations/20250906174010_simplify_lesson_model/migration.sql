/*
  Warnings:

  - You are about to drop the column `day` on the `lesson` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `lesson` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `lesson` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `lesson` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `lesson` DROP COLUMN `day`,
    DROP COLUMN `endTime`,
    DROP COLUMN `name`,
    DROP COLUMN `startTime`;
