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
        // Resolve student id for the logged in user (works for STUDENT and PARENT)
        // 1) Try: user id -> student (for STUDENT role)
        let response = await fetch(`/api/students/${session.user.id}`);
        if (response.ok) {
          const studentData = await response.json();
          // Redirect to the student profile using the student ID
          router.replace(`/Dashboard/list/students/${studentData.id}`);
        } else {
          // 2) If parent: find first assigned child and redirect
          const childRes = await fetch(`/api/users/${session.user.id}`);
          if (childRes.ok) {
            const userData = await childRes.json();
            const childIds: string[] = Array.isArray(userData.studentIds)
              ? userData.studentIds
              : [];
            if (childIds.length > 0) {
              router.replace(`/Dashboard/list/students/${childIds[0]}`);
              return;
            }
          }
          // Fallback
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
    <ProtectedRoute allowedRoles={["STUDENT", "PARENT"]}>
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
