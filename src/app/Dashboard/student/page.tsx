"use client";

import { useSession } from "next-auth/react";
import ProtectedRoute from "../../../View/components/ProtectedRoute";

export default function StudentPage() {
  const { data: session } = useSession();

  return (
    <ProtectedRoute requiredRole="STUDENT">
      <div className="p-6 min-h-screen bg-[#D7DEC3]">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {session?.user?.username}!
          </h1>
          <p className="text-xl text-gray-600">
            You are logged in as a Student.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
