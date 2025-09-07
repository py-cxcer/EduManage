import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

// Utility function to get next teacher ID
async function getNextTeacherId(): Promise<string> {
  const lastTeacher = await prisma.teacher.findFirst({
    where: { id: { startsWith: "T" } },
    orderBy: { id: "desc" },
    select: { id: true },
  });

  if (!lastTeacher) {
    return "T001";
  }

  const lastNumber = parseInt(lastTeacher.id.slice(1), 10) || 0;
  const nextNumber = lastNumber + 1;
  return `T${nextNumber.toString().padStart(3, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all teachers");

    // Get pagination and search parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // Build search conditions
    const searchConditions = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { surname: { contains: search, mode: "insensitive" as const } },
            { id: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Get total count for pagination (with search filter)
    const totalItems = await prisma.teacher.count({
      where: searchConditions,
    });
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch paginated teachers (with search filter)
    const teachers = await prisma.teacher.findMany({
      where: searchConditions,
      include: {
        subjects: true,
        classes: true,
      },
      skip: skip,
      take: limit,
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({
      teachers,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    console.log("Creating teacher with data:", body);

    const {
      username,
      password,
      name,
      surname,
      email,
      phone,
      address,
      bloodType,
      sex,
      birthday,
      subjectIds,
    } = body;

    // Validate and normalize sex field
    const validSexValues = ["MALE", "FEMALE", "OTHER"];
    const normalizedSex = sex?.toString().toUpperCase();
    if (!normalizedSex || !validSexValues.includes(normalizedSex)) {
      return NextResponse.json(
        { error: "Invalid sex value. Must be MALE, FEMALE, or OTHER." },
        { status: 400 }
      );
    }

    // Normalize optional unique fields
    const normalizedEmail = email && email.trim() !== "" ? email.trim() : null;
    const normalizedPhone = phone && phone.trim() !== "" ? phone.trim() : null;

    // Pre-check username uniqueness
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists. Choose another." },
        { status: 409 }
      );
    }
    const existingTeacher = await prisma.teacher.findUnique({
      where: { username },
    });
    if (existingTeacher) {
      return NextResponse.json(
        { error: "Teacher username already exists." },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate formatted teacher ID
    const teacherId = await getNextTeacherId();

    // Create both records in a transaction
    const teacher = await prisma.$transaction(async (tx) => {
      const createdTeacher = await tx.teacher.create({
        data: {
          id: teacherId, // Use the formatted ID as the primary key
          username,
          name,
          surname,
          email: normalizedEmail,
          phone: normalizedPhone,
          address,
          bloodType,
          sex: normalizedSex as any, // Use normalized sex value
          birthday: new Date(birthday),
          subjects:
            subjectIds && Array.isArray(subjectIds) && subjectIds.length
              ? {
                  connect: subjectIds.map((id: number) => ({ id })),
                }
              : undefined,
        },
        include: {
          subjects: true,
          classes: true,
        },
      });

      await tx.user.create({
        data: {
          id: teacherId, // Use the same formatted ID
          username,
          password: hashedPassword,
          role: "TEACHER",
        },
      });

      return createdTeacher;
    });

    console.log("Teacher created successfully:", teacher);
    return NextResponse.json(teacher, { status: 201 });
  } catch (error: any) {
    console.error("Error creating teacher:", error);
    if (error?.code === "P2002") {
      const target = Array.isArray(error?.meta?.target)
        ? error.meta.target.join(", ")
        : error?.meta?.target || "unique field";
      return NextResponse.json(
        { error: `Conflict: ${target} already exists.` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create teacher" },
      { status: 500 }
    );
  }
}
