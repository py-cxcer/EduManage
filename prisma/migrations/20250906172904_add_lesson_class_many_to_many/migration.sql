-- DropForeignKey
ALTER TABLE `lesson` DROP FOREIGN KEY `Lesson_classId_fkey`;

-- DropIndex
DROP INDEX `Lesson_classId_fkey` ON `lesson`;

-- AlterTable
ALTER TABLE `lesson` MODIFY `classId` INTEGER NULL;

-- CreateTable
CREATE TABLE `_LessonClass` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_LessonClass_AB_unique`(`A`, `B`),
    INDEX `_LessonClass_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Lesson` ADD CONSTRAINT `Lesson_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_LessonClass` ADD CONSTRAINT `_LessonClass_A_fkey` FOREIGN KEY (`A`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_LessonClass` ADD CONSTRAINT `_LessonClass_B_fkey` FOREIGN KEY (`B`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
