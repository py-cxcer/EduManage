"use client";

import { useSession } from "next-auth/react";
import ProtectedRoute from "../../../../View/components/ProtectedRoute";
import TableSearch from "@/View/components/TableSearch";
import Image from "next/image";
import Table from "@/View/components/Table";
import ActionForm from "@/View/components/ActionForm";

import { useEffect, useState } from "react";
import Pagination from "@/View/components/Pagination";

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Teachers",
    accessor: "teachers",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

type SubjectInfo = {
  id: number;
  name: string;
  teacherNames: string;
  teachers?: Array<{
    id: string;
    name: string;
    surname: string;
  }>;
};

const SubjectRow = ({ item }: { item: SubjectInfo }) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-[#EDF2DC] odd:bg-[#FAF9EE] text-sm hover:bg-[#F0E4D3]"
    >
      <td className="flex items-center gap-4 p-4">
        <div>
          <h3 className="font-semibold text-gray-700">{item.name}</h3>
          {/* <p className="text-xs text-gray-500">Subject ID: {item.id}</p> */}
        </div>
      </td>
      <td className="hidden md:table-cell text-gray-500">
        {item.teacherNames}
      </td>
      <td className="">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <ActionForm
                table="Subject"
                type="update"
                data={item}
                id={item.id.toString()}
              />
              <ActionForm
                table="Subject"
                type="delete"
                id={item.id.toString()}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

const SubjectList = () => {
  const { data: session } = useSession();
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const isAdmin = session?.user?.role === "ADMIN";
  const itemsPerPage = 7;

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch(
          `/api/subjects?page=${currentPage}&limit=${itemsPerPage}`
        );
        const data = await response.json();
        setSubjects(data.subjects || data);
        setTotalPages(
          data.totalPages ||
            Math.ceil((data.subjects || data).length / itemsPerPage)
        );
        setTotalItems(data.totalItems || (data.subjects || data).length);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setLoading(true);
  };

  const rowData = (item: SubjectInfo) => (
    <SubjectRow key={item.id} item={item} />
  );

  if (loading) {
    return (
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading Subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold text-gray-500">
            All Subjects Information
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
              {isAdmin && <ActionForm table="Subject" type="create" />}
            </div>
          </div>
        </div>
        <Table columns={columns} rowData={rowData} data={subjects} />
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

export default SubjectList;
