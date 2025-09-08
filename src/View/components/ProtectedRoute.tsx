"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string; // deprecated in favor of allowedRoles
  allowedRoles?: string[];
  fallback?: ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
  fallback,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      router.push("/sign-in");
      return;
    }

    const role = session.user.role;
    if (
      (requiredRole && role !== requiredRole) ||
      (Array.isArray(allowedRoles) &&
        allowedRoles.length > 0 &&
        !allowedRoles.includes(role))
    ) {
      router.push("/Dashboard");
      return;
    }
  }, [session, status, router, requiredRole, allowedRoles]);

  // Show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show fallback or redirect if not authenticated
  if (!session) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600">Please sign in to access this page.</p>
          </div>
        </div>
      )
    );
  }

  // Check role if required
  if (
    (requiredRole && session.user.role !== requiredRole) ||
    (Array.isArray(allowedRoles) &&
      allowedRoles.length > 0 &&
      !allowedRoles.includes(session.user.role))
  ) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      )
    );
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
}
