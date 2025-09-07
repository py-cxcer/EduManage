"use client";

import { useSession } from "next-auth/react";
import ProtectedRoute from "../../../../View/components/ProtectedRoute";
import TableSearch from "@/View/components/TableSearch";
import Image from "next/image";
import Table from "@/View/components/Table";
import ActionForm from "@/View/components/ActionForm";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Subject, Class, Teacher } from "@prisma/client";
import Pagination from "@/View/components/Pagination";

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Teacher ID",
    accessor: "teacherId",
    className: "hidden md:table-cell",
  },
  {
    header: "Subjects",
    accessor: "subjects",
    className: "hidden md:table-cell",
  },
  {
    header: "Classes",
    accessor: "classes",
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

type TeacherInfo = Teacher & { subjects: Subject[] } & {
  classes: (Class & { grade?: { level: number } })[];
};

const TeacherRow = ({ item }: { item: TeacherInfo }) => {
  const { data: session } = useSession();
  const router = useRouter();
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
      <td className="hidden md:table-cell text-gray-500">
        {item.subjects?.map((subject) => subject.name).join(", ") ||
          "No subjects"}
      </td>
      <td className="hidden md:table-cell text-gray-500">
        {item.classes
          ?.map(
            (classItem) => `${classItem.grade?.level || ""}${classItem.name}`
          )
          .join(", ") || "No classes"}
      </td>
      <td className="hidden md:table-cell text-gray-500">{item.phone}</td>
      <td className="hidden md:table-cell text-gray-500">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              {/* View Profile button */}
              <button
                onClick={() =>
                  router.push(`/Dashboard/list/teachers/${item.id}`)
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
              <ActionForm table="Teacher" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

const TeacherListPage = () => {
  const { data: session } = useSession();
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const isAdmin = session?.user?.role === "ADMIN";
  const itemsPerPage = 7;

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const searchParam = searchTerm
          ? `&search=${encodeURIComponent(searchTerm)}`
          : "";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(
          `/api/teachers?page=${currentPage}&limit=${itemsPerPage}${searchParam}`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        let data: any = {};
        try {
          data = await response.json();
        } catch (e) {
          data = {};
        }
        const list = Array.isArray(data.teachers)
          ? data.teachers
          : Array.isArray(data)
          ? data
          : [];
        setTeachers(list);
        const pages = Number.isFinite(data.totalPages)
          ? data.totalPages
          : Math.ceil(list.length / itemsPerPage) || 1;
        setTotalPages(pages);
        const items = Number.isFinite(data.totalItems)
          ? data.totalItems
          : list.length;
        setTotalItems(items);
      } catch (error) {
        if ((error as any)?.name !== "AbortError") {
          console.error("Error fetching teachers:", error);
          setTeachers([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    const abortController = new AbortController();
    // Run the actual fetch, but wire up cleanup to abort
    fetchTeachers();

    return () => {
      abortController.abort();
    };
  }, [currentPage, searchTerm]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage((prev) => (prev === page ? prev : page));
    setLoading(true);
  }, []);

  const handleSearch = useCallback(
    (term: string) => {
      if (term === searchTerm) return;
      setSearchTerm(term);
      setCurrentPage(1);
      setLoading(true);
    },
    [searchTerm]
  );

  const rowData = (item: TeacherInfo) => (
    <TeacherRow key={item.id} item={item} />
  );

  if (loading) {
    return (
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold text-gray-500">
            All Teachers' Information
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 text-gray-500 w-full md:w-auto">
            <TableSearch
              onSearch={handleSearch}
              placeholder="Search teachers..."
              ignoreEmpty={false}
            />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFF2C2]">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFF2C2]">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              {isAdmin && <ActionForm table="Teacher" type="create" />}
            </div>
          </div>
        </div>
        <Table columns={columns} rowData={rowData} data={teachers} />

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

export default TeacherListPage;
