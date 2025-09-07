"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

interface MenuItem {
  icon: string;
  Label: string;
  href: string;
  access: string[];
  isLogout?: boolean;
  dynamicHref?: (session: any) => string;
}

const menuItems: Array<{
  title: string;
  items: MenuItem[];
}> = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        Label: "Dashboard",
        href: "/Dashboard",
        access: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
      {
        icon: "/teacher.png",
        Label: "Teachers",
        href: "/Dashboard/list/teachers",
        access: ["ADMIN", "TEACHER"], // Only admin & teachers can see teachers
      },
      {
        icon: "/student.png",
        Label: "Students",
        href: "/Dashboard/list/students",
        access: ["ADMIN", "TEACHER"], // Only admin & teachers can see students
      },
      {
        icon: "/parent.png",
        Label: "Parents",
        href: "/Dashboard/list/parents",
        access: ["ADMIN", "TEACHER"], // Only admin & teachers can see parents
      },
      {
        icon: "/attendance.png",
        Label: "Attendance",
        href: "/Dashboard/list/attendance",
        access: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], //admin, teacher, student, parents can see attendance
      },
      {
        icon: "/subject.png",
        Label: "Subjects",
        href: "/Dashboard/list/subject",
        access: ["ADMIN"], // Only admin can see subjects
      },

      {
        icon: "/class.png",
        Label: "Classes",
        href: "/Dashboard/list/classes",
        access: ["ADMIN", "TEACHER"], // Only admin can see classes
      },
      {
        icon: "/lesson.png",
        Label: "Lessons",
        href: "/Dashboard/list/lessons",
        access: ["ADMIN", "TEACHER"], // Only admin & teachercan see lessons`
      },
      {
        icon: "/assignment.png",
        Label: "Assignments",
        href: "/Dashboard/list/assignments",
        access: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], //admin, teacher, student, parents can see assignments
      },
      {
        icon: "/exam.png",
        Label: "Exams",
        href: "/Dashboard/list/exams",
        access: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], //admin, teacher, student, parents can see exams
      },
      {
        icon: "/results.png",
        Label: "Results",
        href: "/Dashboard/list/results",
        access: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], //admin, teacher, student, parents can see results
      },
      {
        icon: "/event.png",
        Label: "Events",
        href: "/Dashboard/list/events",
        access: ["ADMIN", "TEACHER", "STUDENT", "PARENT"], //admin, teacher, student, parents can see events
      },
      {
        icon: "/finance.png",
        Label: "Finance",
        href: "/Dashboard/list/finance",
        access: ["ADMIN", "PARENT"], // All roles can see finance
      },
      {
        icon: "/announcement.png",
        Label: "Announcements",
        href: "/Dashboard/list/announcement",
        access: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/avatar.png",
        Label: "My Profile",
        href: "/Dashboard/profile",
        access: ["TEACHER", "STUDENT"], // Teachers,students see their profile
        dynamicHref: (session: any) => {
          if (session?.user?.role === "STUDENT") {
            // For students, we need to find their student ID first
            // We'll use a special route that handles this lookup
            return `/Dashboard/profile/student`;
          }
          return "/Dashboard/profile";
        },
      },
      {
        icon: "/settings.png",
        Label: "settings",
        href: "/Dashboard/settings",
        access: ["ADMIN", "TEACHER", "STUDENT"],
      },
      {
        icon: "/logout.png",
        Label: "Logout",
        href: "#",
        access: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
        isLogout: true,
      },
    ],
  },
];

const Menu = () => {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="" key={i.title}>
          <span className="hidden lg:block text-gray-600 font-light my-4">
            {i.title}
          </span>
          {i.items
            .filter((item) => userRole && item.access.includes(userRole))
            .map((item) =>
              item.isLogout ? (
                <button
                  key={item.Label}
                  onClick={() => signOut({ callbackUrl: "/sign-in" })}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-600 py-5 hover:bg-white/50 rounded-lg transition-colors w-full"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.Label}</span>
                </button>
              ) : (
                <Link
                  href={
                    item.dynamicHref ? item.dynamicHref(session) : item.href
                  }
                  key={item.Label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-600 py-5 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.Label}</span>
                </Link>
              )
            )}
        </div>
      ))}
    </div>
  );
};

export default Menu;

// #878672
// #545333
