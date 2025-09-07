import Image from "next/image";
import { useEffect, useState } from "react";

const UserCard = ({
  type,
}: {
  type: "student" | "teacher" | "parent" | string;
}) => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        if (type === "student") {
          const res = await fetch("/api/students?page=1&limit=1");
          const json = await res.json();
          setCount(json.totalItems || (json.students || []).length || 0);
        } else if (type === "teacher") {
          const res = await fetch("/api/teachers?page=1&limit=1");
          const json = await res.json();
          setCount(json.totalItems || (json.teachers || []).length || 0);
        } else if (type === "parent") {
          const res = await fetch("/api/users?page=1&limit=1000");
          const json = await res.json();
          const list = Array.isArray(json?.users)
            ? json.users
            : Array.isArray(json)
            ? json
            : [];
          const parents = list.filter((u: any) => u.role === "PARENT");
          setCount(parents.length);
        } else {
          setCount(0);
        }
      } catch (e) {
        setCount(0);
      }
    };
    fetchCount();
  }, [type]);

  const dateStr = new Date().toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl border-black odd:bg-[#A7C1A8] even:bg-[#819A91] p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-lime-600">
          {dateStr}
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4">{count ?? "--"}</h1>
      <h2 className="capitalize text-sm font-medium text-white">{type}</h2>
    </div>
  );
};

export default UserCard;
