import { prisma } from "../Model/prisma";

/**
 * Recalculates and updates a teacher's class assignments based on their current lessons
 * @param teacherId - The ID of the teacher to update
 * @param tx - Optional Prisma transaction (if not provided, will use regular prisma client)
 */
export async function syncTeacherClasses(teacherId: string, tx?: any) {
  const prismaClient = tx || prisma;

  try {
    // Get all lessons for this teacher with proper error handling
    const teacherLessons = await prismaClient.lesson.findMany({
      where: { teacherId: teacherId },
      include: {
        classes: {
          include: {
            grade: true,
          },
        },
      },
    });

    console.log(`Syncing classes for teacher ${teacherId}:`, {
      lessonsCount: teacherLessons.length,
      lessons: teacherLessons.map((lesson: any) => ({
        id: lesson.id,
        subjectId: lesson.subjectId,
        classes: lesson.classes.map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          grade: cls.grade?.level,
        })),
      })),
    });

    // Get all unique class IDs for this teacher
    const teacherClassIds = [
      ...new Set(
        teacherLessons.flatMap((lesson: any) =>
          lesson.classes.map((cls: any) => cls.id)
        )
      ),
    ];

    console.log(`Teacher ${teacherId} should have classes:`, teacherClassIds);

    // Clear all existing class relationships first to ensure clean state
    await prismaClient.teacher.update({
      where: { id: teacherId },
      data: {
        classes: {
          set: [], // Clear all existing relationships
        },
      },
    });

    // Add the correct class relationships
    if (teacherClassIds.length > 0) {
      await prismaClient.teacher.update({
        where: { id: teacherId },
        data: {
          classes: {
            connect: teacherClassIds.map((id) => ({ id })),
          },
        },
      });
    }

    // Verify the update
    const updatedTeacher = await prismaClient.teacher.findUnique({
      where: { id: teacherId },
      include: {
        classes: {
          include: {
            grade: true,
          },
        },
      },
    });

    console.log(
      `Teacher ${teacherId} now has classes:`,
      updatedTeacher?.classes.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        grade: cls.grade?.level,
      })) || []
    );

    return teacherClassIds;
  } catch (error) {
    console.error(`Error syncing classes for teacher ${teacherId}:`, error);
    throw error;
  }
}

/**
 * Syncs all teachers' class assignments based on their current lessons
 * @param tx - Optional Prisma transaction
 */
export async function syncAllTeacherClasses(tx?: any) {
  const prismaClient = tx || prisma;

  console.log("Starting sync for all teachers...");

  // Get all teachers
  const teachers = await prismaClient.teacher.findMany({
    select: { id: true },
  });

  console.log(`Found ${teachers.length} teachers to sync`);

  // For each teacher, sync their classes
  for (const teacher of teachers) {
    await syncTeacherClasses(teacher.id, prismaClient);
  }

  console.log("Sync completed for all teachers");
  return teachers.length;
}

/**
 * Verifies that all teachers have the correct class assignments based on their lessons
 * @param tx - Optional Prisma transaction
 */
export async function verifyTeacherClassSync(tx?: any) {
  const prismaClient = tx || prisma;

  console.log("Verifying teacher-class sync...");

  const teachers = await prismaClient.teacher.findMany({
    include: {
      classes: {
        include: {
          grade: true,
        },
      },
      lessons: {
        include: {
          classes: {
            include: {
              grade: true,
            },
          },
          subject: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const issues = [];

  for (const teacher of teachers) {
    // Get expected classes from lessons
    const expectedClassIds: number[] = [
      ...new Set(
        teacher.lessons.flatMap((lesson: any) =>
          lesson.classes.map((cls: any) => cls.id)
        )
      ),
    ] as number[];

    // Get actual classes from teacher
    const actualClassIds: number[] = teacher.classes.map((cls: any) => cls.id);

    // Check for missing classes
    const missingClasses = expectedClassIds.filter(
      (id) => !actualClassIds.includes(id)
    );

    // Check for extra classes
    const extraClasses = actualClassIds.filter(
      (id) => !expectedClassIds.includes(id)
    );

    if (missingClasses.length > 0 || extraClasses.length > 0) {
      // Get detailed lesson information for debugging
      const lessonDetails = teacher.lessons.map((lesson: any) => ({
        id: lesson.id,
        subject: lesson.subject.name,
        classes: lesson.classes.map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          grade: cls.grade?.level,
        })),
      }));

      issues.push({
        teacherId: teacher.id,
        teacherName: `${teacher.name} ${teacher.surname}`,
        expectedClasses: expectedClassIds,
        actualClasses: actualClassIds,
        missingClasses,
        extraClasses,
        lessonDetails,
      });
    }
  }

  if (issues.length > 0) {
    console.error("Teacher-class sync verification found issues:", issues);
  } else {
    console.log(
      "Teacher-class sync verification passed - all teachers have correct class assignments"
    );
  }

  return {
    totalTeachers: teachers.length,
    issuesFound: issues.length,
    issues,
  };
}

/**
 * Forces a complete resync of all teacher-class relationships
 * This function clears all teacher-class relationships and rebuilds them from scratch
 * @param tx - Optional Prisma transaction
 */
export async function forceResyncAllTeachers(tx?: any) {
  const prismaClient = tx || prisma;

  console.log("Starting forced resync of all teachers...");

  // Get all teachers
  const teachers = await prismaClient.teacher.findMany({
    select: { id: true },
  });

  console.log(`Found ${teachers.length} teachers to resync`);

  // Clear all teacher-class relationships
  await prismaClient.teacher.updateMany({
    data: {
      classes: {
        set: [],
      },
    },
  });

  console.log("Cleared all teacher-class relationships");

  // Rebuild all relationships
  for (const teacher of teachers) {
    await syncTeacherClasses(teacher.id, prismaClient);
  }

  console.log("Forced resync completed for all teachers");
  return teachers.length;
}
