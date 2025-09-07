"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SignOutButton from "./SignOutButton";

export default function UserProfile() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "TEACHER":
        return "bg-blue-100 text-blue-800";
      case "STUDENT":
        return "bg-green-100 text-green-800";
      case "PARENT":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "TEACHER":
        return "Teacher";
      case "STUDENT":
        return "Student";
      case "PARENT":
        return "Parent";
      default:
        return role;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-semibold text-lg">
              {session.user.username?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {session.user.username}
          </p>
          <p className="text-sm text-gray-500 truncate">
            ID: {session.user.id}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
              session.user.role
            )}`}
          >
            {getRoleDisplayName(session.user.role)}
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-200 pt-4">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Username</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {session.user.username}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Role</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {getRoleDisplayName(session.user.role)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex justify-between items-center">
        {/* View Profile button for teachers */}
        {session.user.role === "TEACHER" && (
          <button
            onClick={async () => {
              try {
                // Get the teacher ID from the user ID
                const response = await fetch(
                  `/api/teachers/by-user-id/${session.user.id}`
                );
                if (response.ok) {
                  const data = await response.json();
                  router.push(`/Dashboard/list/teachers/${data.teacherId}`);
                } else {
                  console.error("Failed to get teacher ID");
                }
              } catch (error) {
                console.error("Error getting teacher ID:", error);
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            View My Profile
          </button>
        )}

        <SignOutButton />
      </div>
    </div>
  );
}
