import { prisma } from "@/Model/prisma";

export const getAllGrades = async () => {
  return await prisma.grade.findMany({
    include: {
      students: true,
      classess: true,
    },
  });
};
