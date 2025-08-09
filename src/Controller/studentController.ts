import { prisma } from "@/Model/prisma";

export const getAllStudents = async () => {
  return await prisma.student.findMany({
    include: {
      class: true,
      grade: true,
    },
  });
};
