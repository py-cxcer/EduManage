import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log("Fetching user with ID:", id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { id: user.id },
      });
      const assignedStudents = await prisma.student.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      return NextResponse.json({
        ...user,
        name: parent?.name ?? "",
        surname: parent?.surname ?? "",
        phone: parent?.phone ?? "",
        address: parent?.address ?? "",
        studentIds: assignedStudents.map((s) => s.id),
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { username, password, name, surname, phone, address, studentIds } =
      body;

    const data: any = {};
    if (username !== undefined) data.username = String(username);
    if (password) data.password = password; // Assume hashed elsewhere if needed; re-use existing flows

    // Update the auth user
    const updatedUser = await prisma.user.update({ where: { id }, data });

    // If this is a parent, update the Parent profile and assigned students
    if (updatedUser.role === "PARENT") {
      const parentUpdate: any = {};
      if (name !== undefined) parentUpdate.name = String(name);
      if (surname !== undefined) parentUpdate.surname = String(surname);
      if (phone !== undefined)
        parentUpdate.phone = phone === "" ? undefined : String(phone);
      if (address !== undefined) parentUpdate.address = String(address);

      // Parent is keyed by id in schema; if not found, upsert by user.username
      await prisma.parent.upsert({
        where: { id },
        create: {
          id,
          username: updatedUser.username,
          name: parentUpdate.name || "",
          surname: parentUpdate.surname || "",
          phone: (parentUpdate.phone as any) ?? undefined,
          address: parentUpdate.address || "",
        },
        update: parentUpdate,
      });

      if (Array.isArray(studentIds)) {
        // Clear current assignments from these students first
        // Assign selected students to this parent
        await prisma.student.updateMany({
          where: { parentId: id, NOT: { id: { in: studentIds } } },
          data: { parentId: "defaultParent" },
        });
        await prisma.student.updateMany({
          where: { id: { in: studentIds } },
          data: { parentId: id },
        });
      }
    }

    return NextResponse.json({ message: "User updated" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
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
    console.log("Deleting user with ID:", id);

    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If it's a parent, check if they have any students
    if (user.role === "PARENT") {
      const students = await prisma.student.findMany({
        where: {
          parent: {
            username: user.username,
          },
        },
      });

      if (students.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot delete parent. They have students assigned. Please reassign or delete the students first.",
          },
          { status: 400 }
        );
      }
    }

    // Delete the user
    await prisma.user.delete({
      where: { id },
    });

    console.log("User deleted successfully:", id);
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
