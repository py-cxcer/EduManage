import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If user is not authenticated, redirect to sign-in
    if (!token) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // Role-based route protection
    const userRole = token.role as string;

    // Admin routes
    if (path.startsWith("/Dashboard/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/Dashboard", req.url));
    }

    // Teacher routes
    if (
      path.startsWith("/Dashboard/teacher") &&
      userRole !== "TEACHER" &&
      userRole !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/Dashboard", req.url));
    }

    // Student routes
    if (
      path.startsWith("/Dashboard/student") &&
      userRole !== "STUDENT" &&
      userRole !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/Dashboard", req.url));
    }

    // Parent routes
    if (
      path.startsWith("/Dashboard/parent") &&
      userRole !== "PARENT" &&
      userRole !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/Dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/Dashboard/:path*", "/api/protected/:path*"],
};
