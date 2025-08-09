# Authentication System Setup Guide

This guide will help you set up the complete authentication system using NextAuth.js for your Next.js school management application.

## Prerequisites

- Node.js 18+ installed
- MySQL database running
- Your existing Next.js project

## Installation

1. **Install Dependencies**

   ```bash
   npm install next-auth bcryptjs @types/bcryptjs
   ```

2. **Environment Variables**
   Create or update your `.env.local` file:

   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/your_database"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

   **Generate a secure secret:**

   ```bash
   openssl rand -base64 32
   ```

## Database Setup

1. **Update Prisma Schema**
   The schema has been updated with a new `User` model and `UserRole` enum.

2. **Run Database Migrations**

   ```bash
   npx prisma migrate dev --name add_auth_users
   ```

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

## File Structure

The authentication system follows your MVC structure:

```
src/
├── app/
│   ├── api/auth/
│   │   ├── [...nextauth]/route.ts    # NextAuth API route
│   │   └── signup/route.ts           # Signup API route
│   └── Dashboard/
│       ├── page.tsx                  # Main dashboard
│       └── admin/page.tsx            # Admin dashboard
├── Controller/
│   └── authController.ts             # Authentication business logic
├── Model/
│   └── prisma.ts                     # Prisma client (existing)
├── View/components/
│   ├── LoginForm.tsx                 # Login form component
│   ├── SignupForm.tsx                # Signup form component
│   ├── SignOutButton.tsx             # Sign out button
│   ├── UserProfile.tsx               # User profile display
│   ├── ProtectedRoute.tsx            # Route protection component
│   └── SessionProvider.tsx           # NextAuth session provider
├── lib/
│   └── auth.ts                       # NextAuth configuration
├── types/
│   └── next-auth.d.ts                # TypeScript declarations
└── middleware.ts                     # Route protection middleware
```

## Features Implemented

### ✅ Backend & Auth Logic

- NextAuth.js with Credentials provider
- Prisma ORM integration
- User table with role-based authentication
- Secure password hashing with bcrypt
- API routes for login and signup

### ✅ Prisma Schema

- User model with id, username, password, role
- UserRole enum (ADMIN, TEACHER, STUDENT, PARENT)
- Database migrations ready

### ✅ MVC Structure

- Model: Prisma client in `Model/prisma.ts`
- Controller: Auth logic in `Controller/authController.ts`
- View: UI components in `View/components/`
- API routes in `src/app/api/auth/`

### ✅ Modern UI

- Sleek login and signup forms
- Role selection on signup
- Error/success messages
- Loading indicators
- Responsive design with Tailwind CSS

### ✅ Session & Role Handling

- JWT sessions
- User role in session object
- Route protection based on roles
- Middleware for automatic redirects

### ✅ Bonus Features

- Sign out button
- Password strength validation
- User profile component
- Protected route component

## Usage Examples

### 1. Using useSession in Components

```tsx
"use client";

import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>Welcome, {session.user.username}!</h1>
      <p>Your role: {session.user.role}</p>
    </div>
  );
}
```

### 2. Protecting Routes

```tsx
import ProtectedRoute from "../View/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div>Admin-only content</div>
    </ProtectedRoute>
  );
}
```

### 3. Server-Side Authentication

```tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "../lib/auth";

export default async function ServerComponent() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return <div>Welcome, {session.user.username}!</div>;
}
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Signup Request

```json
{
  "username": "john_doe",
  "password": "SecurePass123!",
  "role": "STUDENT"
}
```

### Signup Response

```json
{
  "message": "User created successfully",
  "user": {
    "id": "clx123...",
    "username": "john_doe",
    "role": "STUDENT",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Route Protection

The middleware automatically protects routes:

- `/Dashboard/*` - Requires authentication
- `/Dashboard/admin/*` - Requires ADMIN role
- `/Dashboard/teacher/*` - Requires TEACHER or ADMIN role
- `/Dashboard/student/*` - Requires STUDENT or ADMIN role


## Testing the System

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Create a test user:**

   - Visit `/sign-up`
   - Create an account with role "ADMIN"
   - Use a strong password (8+ chars, uppercase, lowercase, number, special char)

3. **Test authentication:**

   - Visit `/sign-in`
   - Login with your credentials
   - You should be redirected to `/Dashboard`

4. **Test role-based access:**
   - Try accessing `/Dashboard/admin` (should work for admin)
   - Try accessing `/Dashboard/teacher` (should redirect for non-teachers)

## Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT session tokens
- ✅ Role-based access control
- ✅ Route protection middleware
- ✅ Password strength validation
- ✅ Input validation and sanitization
- ✅ Secure session handling

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Check your `DATABASE_URL` in `.env.local`
   - Ensure MySQL is running
   - Run `npx prisma db push` to sync schema

2. **NextAuth Secret Error**

   - Generate a new secret: `openssl rand -base64 32`
   - Update `NEXTAUTH_SECRET` in `.env.local`

3. **TypeScript Errors**

   - Run `npx prisma generate` to update types
   - Restart your TypeScript server

4. **Session Not Working**
   - Ensure `SessionProvider` wraps your app in `layout.tsx`
   - Check that `NEXTAUTH_URL` is set correctly

### Getting Help

- Check the NextAuth.js documentation: https://next-auth.js.org/
- Review the Prisma documentation: https://www.prisma.io/docs/
- Check the console for error messages

## Next Steps

1. **Customize the UI** - Modify the form components to match your design
2. **Add more roles** - Extend the UserRole enum as needed
3. **Implement forgot password** - Add password reset functionality
4. **Add email verification** - Implement email confirmation
5. **Add OAuth providers** - Integrate Google, GitHub, etc.
6. **Add user management** - Create admin interfaces for user management

## Support

If you encounter any issues, check the error logs and ensure all dependencies are properly installed. The authentication system is designed to be secure and scalable for your school management application.
