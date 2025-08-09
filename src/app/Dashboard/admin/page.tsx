"use client";

import { useSession } from "next-auth/react";
import ProtectedRoute from "../../../View/components/ProtectedRoute";
import UserProfile from "../../../View/components/UserProfile";

export default function AdminDashboardPage() {
  const { data: session } = useSession();

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Welcome, {session?.user.username}! You have administrative
              privileges.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Welcome to EduManage Admin Panel
                </h2>
                <p className="text-gray-600">
                  You can manage teachers and students from the navigation menu.
                </p>
              </div>
            </div>

            <div>
              <UserProfile />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
