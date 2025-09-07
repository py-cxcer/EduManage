/*
  Warnings:

  - A unique constraint covering the columns `[gradeId,name]` on the table `Class` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Class_name_key` ON `class`;

-- CreateIndex
CREATE UNIQUE INDEX `Class_gradeId_name_key` ON `Class`(`gradeId`, `name`);
