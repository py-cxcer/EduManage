"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import SignOutButton from "./SignOutButton";

const Navbar = () => {
  const { data: session } = useSession();

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
    <div className="flex items-center justify-between p-4">
      <div className="hidden md:flex items-center gap-1 tex-xs rouded-full ring-[1.5px] ring-gray-300 px-2">
        <Image src="/search.png" alt="Search" width={14} height={14} />
        <input
          type="text"
          placeholder="Search..."
          className="w-[200px] p-2 bg-white text-black rounded-full px-2 py-0.5 outline-none"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col leading-3 font-medium">
          <span className="text-sm text-black">
            {session?.user?.username || "User"}
          </span>
          <span className="text-[10px] text-gray-700 text-right">
            {session?.user?.role
              ? getRoleDisplayName(session.user.role)
              : "Guest"}
          </span>
        </div>
        <Image
          src="/avatar.png"
          alt=""
          width={36}
          height={36}
          className="rounded-full"
        />
        <div className="hidden lg:block">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
