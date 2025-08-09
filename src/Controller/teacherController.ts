import { prisma } from "@/Model/prisma";

export const getAllTeachers = async () => {
  return await prisma.teacher.findMany({
    include: {
      subjects: true,
      classes: true,
    },
  });
};
