import Image from "next/image";

const TableSearch = () => {
  return (
    <div className="w-full md:flex items-center gap-1 tex-xs rouded-full ring-[1.5px] ring-gray-300 px-2">
      <Image src="/search.png" alt="Search" width={14} height={14} />
      <input
        type="text"
        placeholder="Search..."
        className="w-[200px] p-2 bg-white text-black rounded-full px-2 py-0.5 outline-none"
        // className="border border-gray-300 rounded-full px-2 py-0.5 bg-white text-black outline-none"
      />
    </div>
  );
};

export default TableSearch;
