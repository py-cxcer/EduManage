import Image from "next/image";

const UserCard = ({ type }: { type: string }) => {
  return (
    <div className="rounded-2xl border-black odd:bg-[#A7C1A8] even:bg-[#819A91] p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-lime-600">
          XX-Aug-2025
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4">1,234</h1>
      <h2 className="capitalize text-sm font-medium text-white">{type}</h2>
    </div>
  );
};

export default UserCard;
