import { prisma } from "@/Model/prisma";

export const getAllResults = async () => {
  return await prisma.result.findMany({
    include: {
      student: {
        include: {
          class: true,
          grade: true,
        },
      },
      exam: {
        include: {
          lesson: {
            include: {
              subject: true,
            },
          },
        },
      },
      assignment: {
        include: {
          subject: true,
        },
      },
    },
  });
};
