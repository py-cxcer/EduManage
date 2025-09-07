import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = (searchParams.get("search") || "").trim();
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { student: { name: { contains: search, mode: "insensitive" } } },
            { student: { surname: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {};

    const totalItems = await prisma.payment.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            surname: true,
            class: {
              select: {
                name: true,
                grade: { select: { level: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const items = payments.map((p) => ({
      id: p.id,
      studentName: `${p.student.name} ${p.student.surname}`,
      className: `${p.student.class.grade.level}${p.student.class.name}`,
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt || null,
      formattedDate: p.paidAt
        ? new Date(p.paidAt).toLocaleDateString("en-GB")
        : "—",
    }));

    return NextResponse.json({
      payments: items,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, amount, status, paidAt } = body;
    if (!studentId || amount === undefined) {
      return NextResponse.json(
        { error: "studentId and amount are required" },
        { status: 400 }
      );
    }
    const created = await prisma.payment.create({
      data: {
        studentId: String(studentId),
        amount: Number(amount),
        status: status === "PAID" ? "PAID" : "NOT_PAID",
        paidAt: paidAt ? new Date(paidAt) : null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
