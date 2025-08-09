"use client";

import { useSession } from "next-auth/react";
import ProtectedRoute from "../../../../View/components/ProtectedRoute";
import TableSearch from "@/View/components/TableSearch";
import Image from "next/image";
import Table from "@/View/components/Table";
import ActionForm from "@/View/components/ActionForm";
import { useEffect, useState } from "react";
import { Grade, Student } from "@prisma/client";

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Student ID",
    accessor: "studentId",
    className: "hidden md:table-cell",
  },
  {
    header: "Grade",
    accessor: "Grade",
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

type StudentInfo = Student & { grade: Grade };

const StudentRow = ({ item }: { item: StudentInfo }) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-[#EDF2DC] odd:bg-[#FAF9EE] text-sm hover:bg-[#F0E4D3]"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.img || "/no-avatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold text-gray-700">
            {item.name} {item.surname}
          </h3>
          <p className="text-xs text-gray-500">{item?.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell text-gray-500">{item.id}</td>
      <td className="hidden md:table-cell text-gray-500">{item.grade.level}</td>
      <td className="hidden md:table-cell text-gray-500">{item.phone}</td>
      <td className="hidden md:table-cell text-gray-500">{item.address}</td>
      <td className="">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              {/* Middle icon now opens profile */}
              <button
                onClick={() =>
                  window.open(`/Dashboard/profile/${item.id}`, "_blank")
                }
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F5ECD5]"
                title="View Profile"
              >
                <Image
                  src="/update.png"
                  alt="View Profile"
                  width={16}
                  height={16}
                />
              </button>
              <ActionForm table="Student" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

const StudentList = () => {
  const { data: session } = useSession();
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch("/api/students");
        const data = await response.json();
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const rowData = (item: StudentInfo) => (
    <StudentRow key={item.id} item={item} />
  );

  if (loading) {
    return (
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold text-gray-500">
            All Students' Information
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
              {isAdmin && <ActionForm table="Student" type="create" />}
            </div>
          </div>
        </div>
        <Table columns={columns} rowData={rowData} data={students} />
      </div>
    </ProtectedRoute>
  );
};

export default StudentList;
