-- AlterTable
ALTER TABLE `student` MODIFY `sex` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL;

-- AlterTable
ALTER TABLE `teacher` MODIFY `sex` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL;
