import Link from "next/link";
import Image from "next/image";
import Menu from "@/View/components/Menu";
import Navbar from "@/View/components/Navbar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex overflow-hidden">
      <div className="h-full overflow-y-auto w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] bg-[#EEEFE0] p-4">
        <Link
          href="/"
          className="flex items-center justify-center lg:justify-start gap-3"
        >
          <Image src="/logo.png" alt="logo" width={32} height={32} />
          <span className="hidden lg:block text-black py-2">EduManage</span>
        </Link>
        <Menu />
      </div>

      <div className="h-full overflow-y-auto w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#D7DEC3]">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
