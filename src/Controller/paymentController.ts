import { prisma } from "@/Model/prisma";

export const getAllPayments = async () => {
  return await prisma.payment.findMany({
    include: {
      student: {
        include: {
          class: true,
          grade: true,
        },
      },
    },
  });
};
