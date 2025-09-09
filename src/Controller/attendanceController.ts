import { prisma } from "@/Model/prisma";

export const getAllAttendances = async () => {
  return await prisma.attendance.findMany({
    include: {
      student: {
        include: {
          class: true,
          grade: true,
        },
      },
      lesson: {
        include: {
          subject: true,
          teacher: {
            select: { name: true, surname: true },
          },
        },
      },
    },
  });
};
