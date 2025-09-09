import { prisma } from "@/Model/prisma";

export const getAllAnnouncements = async () => {
  return await prisma.announcement.findMany({
    include: {
      class: {
        include: {
          grade: true,
        },
      },
    },
  });
};
