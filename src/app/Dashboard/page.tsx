"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import UserProfile from "../../View/components/UserProfile";
import ProtectedRoute from "../../View/components/ProtectedRoute";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/sign-in");
      return;
    }

    // Redirect to role-specific dashboard
    switch (session.user.role) {
      case "ADMIN":
        router.push("/Dashboard/admin");
        break;
      case "TEACHER":
        router.push("/Dashboard/teacher");
        break;
      case "STUDENT":
        router.push("/Dashboard/student");
        break;
      case "PARENT":
        router.push("/Dashboard/parent");
        break;
      default:
        // Stay on main dashboard
        break;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome to your personalized dashboard
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() =>
                      router.push(
                        `/Dashboard/${session?.user.role.toLowerCase()}`
                      )
                    }
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">
                      Go to {session?.user.role} Dashboard
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Access your role-specific features
                    </p>
                  </button>
                  <button
                    onClick={() => router.push("/sign-in")}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">
                      Account Settings
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage your account preferences
                    </p>
                  </button>
                </div>
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
