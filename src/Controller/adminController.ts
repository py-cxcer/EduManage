import { prisma } from "@/Model/prisma";

export const getAllAdmins = async () => {
  return await prisma.admin.findMany({
    include: {
      // Add any related data if needed in the future
    },
  });
};
