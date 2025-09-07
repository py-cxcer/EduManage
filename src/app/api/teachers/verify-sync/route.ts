import { NextRequest, NextResponse } from "next/server";
import { verifyTeacherClassSync } from "../../../../lib/teacherClassSync";

export async function GET(request: NextRequest) {
  try {
    console.log("Verifying teacher-class sync...");

    const verificationResult = await verifyTeacherClassSync();

    return NextResponse.json({
      message: "Teacher-class sync verification completed",
      ...verificationResult,
    });
  } catch (error) {
    console.error("Error verifying teacher-class sync:", error);
    return NextResponse.json(
      { error: "Failed to verify teacher-class sync" },
      { status: 500 }
    );
  }
}
