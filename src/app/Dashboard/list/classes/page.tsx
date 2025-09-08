"use client";

import { useSession } from "next-auth/react";
import ProtectedRoute from "../../../../View/components/ProtectedRoute";
import TableSearch from "@/View/components/TableSearch";
import Image from "next/image";
import Table from "@/View/components/Table";
import ActionForm from "@/View/components/ActionForm";

import { useEffect, useState, useCallback } from "react";
import Pagination from "@/View/components/Pagination";

const columns = [
  {
    header: "Class Name",
    accessor: "classname",
  },
  {
    header: "Capacity",
    accessor: "capacity",
    className: "hidden md:table-cell",
  },
  {
    header: "Grade",
    accessor: "grade",
    className: "hidden md:table-cell",
  },
  {
    header: "Homeroom Teacher",
    accessor: "homeroomTeacher",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

type ClassInfo = {
  id: number;
  name: string;
  capacity: number;
  grade: { id: number; level: number } | string | number;
  supervisor?: { name: string; surname: string } | null;
};

const ClassRow = ({
  item,
  onEdit,
}: {
  item: ClassInfo;
  onEdit: (id: number) => void;
}) => {
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
            {(typeof item.grade === "object"
              ? (item.grade as any)?.level
              : item.grade) || ""}
            {item.name}
          </h3>
        </div>
      </td>
      <td className="hidden md:table-cell text-gray-500">{item.capacity}</td>
      <td className="hidden md:table-cell text-gray-500">
        {typeof item.grade === "object"
          ? (item.grade as any)?.level
          : item.grade}
      </td>
      <td className="hidden md:table-cell text-gray-500">
        {item.supervisor
          ? `${item.supervisor.name} ${item.supervisor.surname}`
          : ""}
      </td>
      <td className="">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(item.id)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F5ECD5]"
                title="Edit Class"
              >
                <Image
                  src="/edit.png"
                  alt="Edit Class"
                  width={16}
                  height={16}
                />
              </button>
              <ActionForm table="Class" type="delete" id={item.id.toString()} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

const ClassList = () => {
  const { data: session } = useSession();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [grades, setGrades] = useState<{ id: number; level: number }[]>([]);
  const [gradeId, setGradeId] = useState<number | "">("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const onEdit = useCallback((id: number) => setOpenId(id), []);
  const isAdmin = session?.user?.role === "ADMIN";
  const itemsPerPage = 7;

  useEffect(() => {
    // load grades for filter dropdown
    const loadGrades = async () => {
      try {
        const res = await fetch("/api/grades");
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.grades || [];
        setGrades(list);
      } catch (e) {
        console.error("Failed to load grades", e);
      }
    };
    loadGrades();
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const searchParam = searchTerm
          ? `&search=${encodeURIComponent(searchTerm)}`
          : "";
        const gradeParam = gradeId ? `&gradeId=${gradeId}` : "";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(
          `/api/classes?page=${currentPage}&limit=${itemsPerPage}${searchParam}${gradeParam}`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        let data: any = {};
        try {
          data = await response.json();
        } catch (e) {
          data = {};
        }
        const list = Array.isArray(data.classes)
          ? data.classes
          : Array.isArray(data)
          ? data
          : [];
        setClasses(list);
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
          console.error("Error fetching classes:", error);
          setClasses([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    const abortController = new AbortController();
    fetchClasses();

    return () => {
      abortController.abort();
    };
  }, [currentPage, searchTerm, gradeId]);

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

  const rowData = (item: ClassInfo) => (
    <ClassRow key={item.id} item={item} onEdit={onEdit} />
  );

  if (loading) {
    return (
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading Classes...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}>
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold text-gray-500">
            All Classes Information
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 text-gray-500 w-full md:w-auto">
            <TableSearch
              onSearch={handleSearch}
              placeholder="Search classes..."
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
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <div className="p-3">
                      <div className="text-xs text-gray-600 mb-2">
                        Filter by Grade
                      </div>
                      <select
                        value={gradeId}
                        onChange={(e) => {
                          setGradeId(
                            e.target.value
                              ? parseInt(e.target.value)
                              : ("" as any)
                          );
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
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => {
                            setGradeId("");
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
              {isAdmin && <ActionForm table="Class" type="create" />}
            </div>
          </div>
        </div>
        <Table columns={columns} rowData={rowData} data={classes} />
        {openId !== null && (
          <ActionForm
            table="Class"
            type="update"
            data={{ id: openId }}
            autoOpen
            hideTrigger
            onClose={() => setOpenId(null)}
          />
        )}
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

export default ClassList;
