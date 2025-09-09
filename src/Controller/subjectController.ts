import { prisma } from "@/Model/prisma";

export const getAllSubjects = async () => {
  return await prisma.subject.findMany({
    include: {
      teachers: {
        select: { name: true, surname: true },
      },
    },
  });
};
