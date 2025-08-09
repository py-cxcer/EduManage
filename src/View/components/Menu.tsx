"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        Label: "Dashboard",
        href: "/Dashboard",
        access: ["ADMIN", "TEACHER", "STUDENT"],
      },
      {
        icon: "/teacher.png",
        Label: "Teachers",
        href: "/Dashboard/list/teachers",
        access: ["ADMIN"], // Only admin can see teachers
      },
      {
        icon: "/student.png",
        Label: "Students",
        href: "/Dashboard/list/students",
        access: ["ADMIN"], // Only admin can see students
      },
      {
        icon: "/avatar.png",
        Label: "My Profile",
        href: "/Dashboard/profile",
        access: ["TEACHER", "STUDENT"], // Teachers and students see their profile
      },
    ],
  },
];

const Menu = () => {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  return (
    <div className="">
      {menuItems.map((i) => (
        <div className="" key={i.title}>
          <span className="hidden lg:block text-gray-600 font-light my-4">
            {i.title}
          </span>
          {i.items
            .filter((item) => userRole && item.access.includes(userRole))
            .map((item) => (
              <Link
                href={item.href}
                key={item.Label}
                className="flex items-center justify-center lg:justify-start gap-4 text-gray-600 py-5 hover:bg-white/50 rounded-lg transition-colors"
              >
                <Image src={item.icon} alt="" width={20} height={20} />
                <span className="hidden lg:block">{item.Label}</span>
              </Link>
            ))}
        </div>
      ))}
    </div>
  );
};

export default Menu;

// #878672
// #545333
