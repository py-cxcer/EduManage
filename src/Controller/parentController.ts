import { prisma } from "@/Model/prisma";

export const getAllParents = async () => {
  return await prisma.parent.findMany({
    include: {
      students: {
        include: {
          class: true,
          grade: true,
        },
      },
    },
  });
};
