/*
  Warnings:

  - You are about to drop the column `studentId` on the `student` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `teacher` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Student_studentId_key` ON `student`;

-- DropIndex
DROP INDEX `Teacher_teacherId_key` ON `teacher`;

-- AlterTable
ALTER TABLE `student` DROP COLUMN `studentId`;

-- AlterTable
ALTER TABLE `teacher` DROP COLUMN `teacherId`;
