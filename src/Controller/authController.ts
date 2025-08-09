import { UserRole } from "@prisma/client";
import { prisma } from "../Model/prisma";
import bcrypt from "bcryptjs";

// Utility functions for generating formatted IDs
export async function getNextStudentId(): Promise<string> {
  const lastStudent = await prisma.student.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });

  if (!lastStudent) {
    return "S001";
  }

  const lastNumber = parseInt(lastStudent.id.substring(1));
  const nextNumber = lastNumber + 1;
  return `S${nextNumber.toString().padStart(3, "0")}`;
}

export async function getNextTeacherId(): Promise<string> {
  const lastTeacher = await prisma.teacher.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });

  if (!lastTeacher) {
    return "T001";
  }

  const lastNumber = parseInt(lastTeacher.id.substring(1));
  const nextNumber = lastNumber + 1;
  return `T${nextNumber.toString().padStart(3, "0")}`;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export class AuthController {
  // Create a new user
  static async createUser(username: string, password: string, role: string) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        throw new Error("Username already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: role.toUpperCase() as UserRole,
        },
      });
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  // Verify user credentials
  static async verifyCredentials(username: string, password: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        role: user.role,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id: string) {
    try {
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

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Update user password
  static async updatePassword(userId: string, newPassword: string) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      const user = await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
        select: {
          id: true,
          username: true,
          role: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  static async deleteUser(userId: string) {
    try {
      await prisma.user.delete({
        where: { id: userId },
      });

      return { message: "User deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Get all users (admin only)
  static async getAllUsers() {
    try {
      const users = await prisma.user.findMany({
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
      });

      return users;
    } catch (error) {
      throw error;
    }
  }
}
