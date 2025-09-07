import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../Model/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching all users");

    // Get pagination and search parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;
    const role = searchParams.get("role"); // For filtering by role (e.g., PARENT)

    // Build where clause for role filtering and search
    const whereClause = {
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: "insensitive" as const } },
              { role: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    // Get total count for pagination
    const totalItems = await prisma.user.count({ where: whereClause });
    const totalPages = Math.ceil(totalItems / limit);

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: skip,
      take: limit,
    });

    // For parents, also fetch their associated students and profile info
    const usersWithStudents = await Promise.all(
      users.map(async (user) => {
        if (user.role === "PARENT") {
          // Fetch parent profile (support legacy mapping by id or username)
          const parent = await prisma.parent.findFirst({
            where: {
              OR: [{ id: user.id }, { username: user.username }],
            },
          });
          const students = await prisma.student.findMany({
            where: {
              parentId: parent?.id || undefined,
            },
            select: {
              name: true,
              surname: true,
            },
          });

          return {
            ...user,
            name: parent?.name || "",
            surname: parent?.surname || "",
            phone: parent?.phone || "",
            address: parent?.address || "",
            students: students.map((s) => `${s.name} ${s.surname}`),
          };
        }
        return user;
      })
    );

    return NextResponse.json({
      users: usersWithStudents,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
