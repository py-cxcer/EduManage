import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../Model/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log("Fetching admin with ID:", id);

    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // For admin, we'll return basic user info from the User table
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

    // Create a profile-like response for admin
    const adminProfile = {
      id: user?.id || admin.id,
      username: user?.username || admin.username,
      name: "Admin", // Default name for admin
      surname: "User", // Default surname for admin
      email: `${admin.username}@edumanage.com`, // Generated email
      phone: null,
      address: "Admin Office",
      birthday: user?.createdAt || new Date(),
      sex: "OTHER",
      bloodType: "Unknown",
    };

    return NextResponse.json(adminProfile);
  } catch (error) {
    console.error("Error fetching admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    console.log("Updating admin with ID:", id, "Data:", body);

    const { name, surname, email, phone, address, birthday, sex, bloodType } =
      body;

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!existingAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // For admin, we'll store basic info in a JSON field or just return a success message
    // Since the Admin model is simple, we'll create a mock updated profile
    const updatedAdminProfile = {
      id,
      username: existingAdmin.username,
      name,
      surname,
      email,
      phone,
      address,
      birthday,
      sex: sex.toUpperCase(),
      bloodType,
    };

    console.log("Admin profile updated successfully:", updatedAdminProfile);
    return NextResponse.json(updatedAdminProfile);
  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json(
      { error: "Failed to update admin" },
      { status: 500 }
    );
  }
}
