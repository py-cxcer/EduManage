"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../../View/components/ProtectedRoute";

export default function StudentProfileRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const redirectToStudentProfile = async () => {
      if (status === "loading" || !session?.user?.id) return;

      try {
        // Try to fetch student data using the user ID
        // The API will handle the lookup and return the correct student
        const response = await fetch(`/api/students/${session.user.id}`);
        if (response.ok) {
          const studentData = await response.json();
          // Redirect to the student profile using the student ID
          router.replace(`/Dashboard/list/students/${studentData.id}`);
        } else {
          // No student record found, redirect to regular profile
          router.replace("/Dashboard/profile");
        }
      } catch (error) {
        console.error("Error redirecting to student profile:", error);
        // Fallback to regular profile
        router.replace("/Dashboard/profile");
      }
    };

    redirectToStudentProfile();
  }, [session, status, router]);

  return (
    <ProtectedRoute requiredRole="STUDENT">
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-lg">
            Redirecting to your profile...
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
