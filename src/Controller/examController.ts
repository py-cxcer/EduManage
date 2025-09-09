import { prisma } from "@/Model/prisma";

export const getAllExams = async () => {
  return await prisma.exam.findMany({
    include: {
      lesson: {
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
      },
      class: {
        include: {
          grade: true,
        },
      },
    },
  });
};
