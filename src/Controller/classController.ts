import { prisma } from "@/Model/prisma";

export const getAllClasses = async () => {
  return await prisma.class.findMany({
    include: {
      grade: true,
      supervisor: {
        select: { name: true, surname: true },
      },
      students: true,
    },
  });
};
