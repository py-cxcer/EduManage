import { prisma } from "@/Model/prisma";

export const getAllLessons = async () => {
  return await prisma.lesson.findMany({
    include: {
      subject: true,
      teacher: {
        select: { name: true, surname: true },
      },
      classes: {
        include: {
          grade: true,
        },
      },
    },
  });
};
