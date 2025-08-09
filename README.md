# EduManage - School Management System

A comprehensive education management system built with Next.js, featuring role-based authentication and modern UI design.

## 🎯 System Overview

EduManage is a full-stack web application designed to streamline academic processes for educational institutions. It provides role-based access for Admins, Teachers, and Students with complete CRUD functionality.

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **Authentication**: NextAuth.js with JWT
- **Architecture**: MVC Pattern

## 📋 Prerequisites

Before installing, ensure you have the following installed on your computer:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **MySQL** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/mysql/)
3. **Git** - [Download here](https://git-scm.com/downloads)
4. **Code Editor** (VS Code recommended) - [Download here](https://code.visualstudio.com/)

## 🚀 Installation Guide

### Step 1: Download the Project

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd "EduManage"
```

### Step 2: Install Dependencies

```bash
# Install all required packages
npm install
```

### Step 3: Database Setup

1. **Start MySQL Server**

   - Windows: Open MySQL Workbench or start MySQL service
   - Mac: Use MySQL preference pane or `brew services start mysql`
   - Linux: `sudo systemctl start mysql`

2. **Create Database**

   ```sql
   CREATE DATABASE edumanage;
   ```

3. **Create Database User (Optional but recommended)**
   ```sql
   CREATE USER 'edumanage_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON edumanage.* TO 'edumanage_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Step 4: Environment Configuration

1. **Copy environment template**

   ```bash
   cp env.example .env.local
   ```

2. **Edit `.env.local` file** with your database credentials:

   ```env
   # Database Configuration
   DATABASE_URL="mysql://username:password@localhost:3306/edumanage"

   # NextAuth Configuration
   NEXTAUTH_SECRET="your-super-secret-jwt-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

   **Replace:**

   - `username` with your MySQL username (default: `root`)
   - `password` with your MySQL password
   - Generate a secure secret for `NEXTAUTH_SECRET` (32+ characters)

### Step 5: Database Migration & Seeding

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npx prisma db seed
```

### Step 6: Start the Application

```bash
# Start development server
npm run dev
```

The application will be available at: **http://localhost:3000**

## 🔐 Default Login Credentials

After seeding, you can use these accounts:

### Admin Account

- **Username**: `admin`
- **Password**: `admin123`

### Sample Teacher Accounts

- **Username**: `teacher1` | **Password**: `password123`
- **Username**: `teacher2` | **Password**: `password123`

### Sample Student Accounts

- **Username**: `student1` | **Password**: `password123`
- **Username**: `student2` | **Password**: `password123`

## 📚 User Guide

### For Administrators

1. **Login** with admin credentials
2. **Manage Students**: Navigate to Students → Add/Edit/Delete student records
3. **Manage Teachers**: Navigate to Teachers → Add/Edit/Delete teacher profiles
4. **View Profiles**: Click profile buttons to view individual user details

### For Teachers & Students

1. **Login** with your credentials
2. **View Dashboard**: See personalized welcome message
3. **Edit Profile**: Update your personal information via "My Profile"

## 🗂️ Project Structure

```
School Management/
├── prisma/                 # Database schema & migrations
│   ├── schema.prisma      # Database models
│   ├── seed.ts           # Sample data
│   └── migrations/       # Database migrations
├── src/
│   ├── app/              # Next.js App Router (Pages)
│   │   ├── api/          # API endpoints
│   │   ├── Dashboard/    # Dashboard pages
│   │   └── layout.tsx    # Root layout
│   ├── Controller/       # Business logic
│   ├── Model/           # Database access layer
│   ├── View/            # UI components
│   ├── lib/             # Utilities & auth config
│   └── middleware.ts    # Route protection
└── public/              # Static assets
```

## 🔧 Troubleshooting

### Common Issues & Solutions

1. **Database Connection Error**

   ```
   Error: P1001: Can't reach database server
   ```

   **Solution**:

   - Verify MySQL is running
   - Check DATABASE_URL in .env.local
   - Ensure database exists

2. **Port Already in Use**

   ```
   Port 3000 is already in use
   ```

   **Solution**: The app will automatically use the next available port (3001, 3002, etc.)

3. **Migration Errors**

   ```
   Error: Migration failed
   ```

   **Solution**:

   ```bash
   npx prisma migrate reset --force
   npx prisma migrate dev
   ```

4. **Missing Dependencies**
   ```
   Module not found
   ```
   **Solution**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Getting Help

If you encounter issues:

1. Check the terminal for error messages
2. Verify all prerequisites are installed
3. Ensure MySQL server is running
4. Check `.env.local` configuration
5. Try restarting the development server

## 🏗️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# View database in browser
npx prisma studio

# Generate Prisma client
npx prisma generate
```

## 📊 Database Management

### View Database (Prisma Studio)

```bash
npx prisma studio
```

Access at: http://localhost:5555

### Reset Database

```bash
npx prisma migrate reset --force
npx prisma db seed
```

## 🔒 Security Features

- **Password Hashing**: bcrypt encryption
- **JWT Authentication**: Secure session management
- **Role-Based Access**: Route protection based on user roles
- **Input Validation**: Server-side and client-side validation
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

## 🌐 Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a production database
3. Configure proper environment variables
4. Build the application: `npm run build`
5. Start with: `npm start`

---

**EduManage** - Streamlining Education Management © 2025
