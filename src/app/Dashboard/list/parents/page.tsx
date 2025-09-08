"use client";

import { useSession } from "next-auth/react";
import ProtectedRoute from "../../../../View/components/ProtectedRoute";
import TableSearch from "@/View/components/TableSearch";
import Image from "next/image";
import Table from "@/View/components/Table";
import ActionForm from "@/View/components/ActionForm";

import { useEffect, useState } from "react";
import { User } from "@prisma/client";
import Pagination from "@/View/components/Pagination";

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Student Names",
    accessor: "studentNames",
    className: "hidden md:table-cell",
  },
  {
    header: "Role",
    accessor: "role",
    className: "hidden md:table-cell",
  },
  {
    header: "Phone",
    accessor: "phone",
    className: "hidden md:table-cell",
  },
  {
    header: "Address",
    accessor: "address",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

type ParentInfo = User & {
  role: "PARENT";
  students?: string[];
  name?: string;
  surname?: string;
  phone?: string;
  address?: string;
};

const ParentRow = ({ item }: { item: ParentInfo }) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-[#EDF2DC] odd:bg-[#FAF9EE] text-sm hover:bg-[#F0E4D3]"
    >
      <td className="flex items-center gap-4 p-4">
        <div>
          <h3 className="font-semibold text-gray-700">
            {item.name || item.surname
              ? `${item.name || ""} ${item.surname || ""}`.trim()
              : item.username}
          </h3>
          {/* <p className="text-xs text-gray-500">{item.username}@edu.com</p> */}
        </div>
      </td>
      <td className="hidden md:table-cell text-gray-500">
        {item.students && item.students.length > 0
          ? item.students.join(", ")
          : "No students assigned"}
      </td>
      <td className="hidden md:table-cell text-gray-500">{item.role}</td>
      <td className="hidden md:table-cell text-gray-500">
        {item.phone || "N/A"}
      </td>
      <td className="hidden md:table-cell text-gray-500">
        {item.address || "N/A"}
      </td>
      <td className="">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <ActionForm table="Parent" type="update" id={item.id} />
              <ActionForm table="Parent" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

const ParentList = () => {
  const { data: session } = useSession();
  const [parents, setParents] = useState<ParentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const isAdmin = session?.user?.role === "ADMIN";
  const itemsPerPage = 7;

  useEffect(() => {
    const fetchParents = async () => {
      try {
        const response = await fetch(
          `/api/users?page=${currentPage}&limit=${itemsPerPage}&role=PARENT`
        );
        const data = await response.json();
        // Filter only parents if not already filtered by API
        const parentUsers = data.users
          ? data.users.filter((user: User) => user.role === "PARENT")
          : data.filter((user: User) => user.role === "PARENT");
        setParents(parentUsers);
        setTotalPages(
          data.totalPages || Math.ceil(parentUsers.length / itemsPerPage)
        );
        setTotalItems(data.totalItems || parentUsers.length);
      } catch (error) {
        console.error("Error fetching parents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParents();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setLoading(true);
  };

  const rowData = (item: ParentInfo) => <ParentRow key={item.id} item={item} />;

  if (loading) {
    return (
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading Parents...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}>
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold text-gray-500">
            All Parents Information
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 text-gray-500 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFF2C2]">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFF2C2]">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              {isAdmin && <ActionForm table="Parent" type="create" />}
            </div>
          </div>
        </div>
        <Table columns={columns} rowData={rowData} data={parents} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </ProtectedRoute>
  );
};

export default ParentList;
