import { prisma } from "@/Model/prisma";

export const getAllEvents = async () => {
  return await prisma.event.findMany({
    include: {
      class: {
        include: {
          grade: true,
        },
      },
    },
  });
};
