"use client";

import { useSession } from "next-auth/react";
import ProtectedRoute from "../../../../View/components/ProtectedRoute";
import TableSearch from "@/View/components/TableSearch";
import Image from "next/image";
import Table from "@/View/components/Table";
import ActionForm from "@/View/components/ActionForm";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Grade, Student } from "@prisma/client";
import Pagination from "@/View/components/Pagination";

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

type StudentInfo = Student & {
  grade: Grade;
  class: {
    id: number;
    name: string;
    gradeId: number;
    grade: {
      level: number;
    };
  };
};

const StudentRow = ({ item }: { item: StudentInfo }) => {
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
        {item.class?.grade?.level || "N/A"}
        {item.class?.name || ""}
      </td>
      <td className="hidden md:table-cell text-gray-500">{item.phone}</td>
      <td className="hidden md:table-cell text-gray-500">{item.address}</td>
      <td className="">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <ActionForm table="Student" type="update" id={item.id} />
              <button
                onClick={() =>
                  router.push(`/Dashboard/list/students/${item.id}`)
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [grades, setGrades] = useState<{ id: number; level: number }[]>([]);
  const [classes, setClasses] = useState<
    { id: number; label: string; gradeId: number }[]
  >([]);
  const [gradeId, setGradeId] = useState<number | "">("");
  const [classId, setClassId] = useState<number | "">("");
  const [filterOpen, setFilterOpen] = useState(false);
  const isAdmin = session?.user?.role === "ADMIN";
  const itemsPerPage = 7;

  useEffect(() => {
    // load filter options
    const loadMeta = async () => {
      try {
        const [gRes, cRes] = await Promise.all([
          fetch("/api/grades"),
          fetch("/api/classes"),
        ]);
        const [gJson, cJson] = await Promise.all([gRes.json(), cRes.json()]);
        const g = Array.isArray(gJson) ? gJson : gJson.grades || [];
        const c = (cJson.classes || cJson || []).map((x: any) => ({
          id: x.id,
          label: `${x.grade?.level ?? ""}${x.name}`,
          gradeId: x.grade?.id ?? x.gradeId,
        }));
        setGrades(g);
        setClasses(c);
      } catch (e) {
        console.error("Failed to load grade/class options", e);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const searchParam = searchTerm
          ? `&search=${encodeURIComponent(searchTerm)}`
          : "";
        const gradeParam = gradeId ? `&gradeId=${gradeId}` : "";
        const classParam = classId ? `&classId=${classId}` : "";
        const response = await fetch(
          `/api/students?page=${currentPage}&limit=${itemsPerPage}${searchParam}${gradeParam}${classParam}`
        );
        const data = await response.json();
        setStudents(data.students || data);
        setTotalPages(
          data.totalPages ||
            Math.ceil((data.students || data).length / itemsPerPage)
        );
        setTotalItems(data.totalItems || (data.students || data).length);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [currentPage, searchTerm, gradeId, classId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setLoading(true);
  };

  const handleSearch = useCallback(
    (term: string) => {
      if (term === searchTerm) return;
      setSearchTerm(term);
      setCurrentPage(1); // Reset to first page when searching
      setLoading(true);
    },
    [searchTerm]
  );

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
            <TableSearch
              onSearch={handleSearch}
              placeholder="Search students..."
              ignoreEmpty={false}
            />
            <div className="flex items-center gap-4 self-end">
              <div className="relative">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFF2C2]"
                  onClick={() => setFilterOpen((s) => !s)}
                  title="Filter"
                >
                  <Image src="/filter.png" alt="" width={14} height={14} />
                </button>
                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <div className="p-3 space-y-3">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Grade</div>
                        <select
                          value={gradeId}
                          onChange={(e) => {
                            const val = e.target.value
                              ? parseInt(e.target.value)
                              : ("" as any);
                            setGradeId(val);
                            // if grade changes and current class not in grade, reset
                            setClassId("");
                            setCurrentPage(1);
                            setLoading(true);
                          }}
                          className="w-full p-2 text-sm ring-[1.5px] ring-gray-300 rounded-md bg-white"
                        >
                          <option value="">All Grades</option>
                          {grades.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.level}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Class</div>
                        <select
                          value={classId}
                          onChange={(e) => {
                            setClassId(
                              e.target.value
                                ? parseInt(e.target.value)
                                : ("" as any)
                            );
                            setCurrentPage(1);
                            setLoading(true);
                          }}
                          className="w-full p-2 text-sm ring-[1.5px] ring-gray-300 rounded-md bg-white"
                        >
                          <option value="">All Classes</option>
                          {classes
                            .filter((c) => !gradeId || c.gradeId === gradeId)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setGradeId("");
                            setClassId("");
                            setCurrentPage(1);
                            setLoading(true);
                            setFilterOpen(false);
                          }}
                          className="px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => setFilterOpen(false)}
                          className="px-2 py-1 text-xs bg-[#6B8A7A] text-white rounded"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFF2C2]">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              {isAdmin && <ActionForm table="Student" type="create" />}
            </div>
          </div>
        </div>
        <Table columns={columns} rowData={rowData} data={students} />
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

export default StudentList;
