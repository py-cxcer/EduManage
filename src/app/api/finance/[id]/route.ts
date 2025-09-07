import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const payment = await prisma.payment.findUnique({
      where: { id: Number(id) },
      include: {
        student: { include: { class: { include: { grade: true } } } },
      },
    });
    if (!payment)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(payment);
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const data: any = {};
    if (body.amount !== undefined) data.amount = Number(body.amount);
    if (body.status) data.status = body.status === "PAID" ? "PAID" : "NOT_PAID";
    if (body.paidAt !== undefined)
      data.paidAt = body.paidAt ? new Date(body.paidAt) : null;
    if (body.studentId) data.studentId = String(body.studentId);

    const { id } = await context.params;
    const updated = await prisma.payment.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await prisma.payment.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Deleted" });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
