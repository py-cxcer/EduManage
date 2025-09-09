import { prisma } from "@/Model/prisma";

export const getAllAssignments = async () => {
  return await prisma.assignment.findMany({
    include: {
      subject: true,
      teacher: {
        select: { name: true, surname: true },
      },
      class: {
        include: {
          grade: true,
        },
      },
      lesson: {
        include: {
          subject: true,
        },
      },
    },
  });
};
