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
    header: "Subject",
    accessor: "subject",
    className: "hidden md:table-cell",
  },
  {
    header: "Class",
    accessor: "class",
    className: "hidden md:table-cell",
  },
  {
    header: "Teacher",
    accessor: "teacher",
    className: "hidden md:table-cell",
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

type ExamInfo = {
  id: number;
  title: string;
  subjectName: string;
  className: string;
  teacherName: string;
  formattedDate: string;
};

const ExamRow = ({ item }: { item: ExamInfo }) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-[#EDF2DC] odd:bg-[#FAF9EE] text-sm hover:bg-[#F0E4D3]"
    >
      <td className="flex items-center gap-4 p-4">
        <div>
          <h3 className="font-semibold text-gray-500">{item.subjectName}</h3>
        </div>
      </td>

      <td className="hidden md:table-cell text-gray-500">{item.className}</td>
      <td className="hidden md:table-cell text-gray-500">{item.teacherName}</td>
      <td className="hidden md:table-cell text-gray-500">
        {item.formattedDate}
      </td>
      <td className="">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <ActionForm table="Exam" type="update" id={item.id.toString()} />
              <ActionForm table="Exam" type="delete" id={item.id.toString()} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

const ExamList = () => {
  const { data: session } = useSession();
  const [exams, setExams] = useState<ExamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: number; label: string }[]>([]);
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [teacherId, setTeacherId] = useState<string | "">("");
  const [classId, setClassId] = useState<number | "">("");
  const [filterOpen, setFilterOpen] = useState(false);
  const isAdmin = session?.user?.role === "ADMIN";
  const itemsPerPage = 7;

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [sRes, tRes, cRes] = await Promise.all([
          fetch("/api/subjects"),
          fetch("/api/teachers"),
          fetch("/api/classes?page=1&limit=1000"),
        ]);
        const [sJson, tJson, cJson] = await Promise.all([
          sRes.json(),
          tRes.json(),
          cRes.json(),
        ]);
        setSubjects(
          (Array.isArray(sJson?.subjects) ? sJson.subjects : sJson).map(
            (s: any) => ({ id: s.id, name: s.name })
          )
        );
        const tList = Array.isArray(tJson?.teachers) ? tJson.teachers : tJson;
        setTeachers(
          tList.map((t: any) => ({ id: t.id, name: `${t.name} ${t.surname}` }))
        );
        const cList = (cJson.classes || cJson || []).map((c: any) => ({
          id: c.id,
          label: `${c.grade?.level ?? ""}${c.name}`,
        }));
        setClasses(cList);
      } catch (e) {
        console.error("Failed loading filters", e);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const qs = [
          `page=${currentPage}`,
          `limit=${itemsPerPage}`,
          subjectId ? `subjectId=${subjectId}` : "",
          teacherId ? `teacherId=${teacherId}` : "",
          classId ? `classId=${classId}` : "",
        ]
          .filter(Boolean)
          .join("&");
        const response = await fetch(`/api/exams?${qs}`);
        const data = await response.json();
        setExams(data.exams || data);
        setTotalPages(
          data.totalPages ||
            Math.ceil((data.exams || data).length / itemsPerPage)
        );
        setTotalItems(data.totalItems || (data.exams || data).length);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [currentPage, subjectId, teacherId, classId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setLoading(true);
  };

  const rowData = (item: ExamInfo) => <ExamRow key={item.id} item={item} />;

  if (loading) {
    return (
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading Exams...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold text-gray-500">
            All Exams Information
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 text-gray-500 w-full md:w-auto">
            <TableSearch />
            <div className="relative">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFF2C2]"
                onClick={() => setFilterOpen((s) => !s)}
                title="Filter"
              >
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              {filterOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-3 space-y-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Subject</div>
                    <select
                      value={subjectId}
                      onChange={(e) =>
                        setSubjectId(
                          e.target.value
                            ? parseInt(e.target.value)
                            : ("" as any)
                        )
                      }
                      className="w-full p-2 text-sm ring-[1.5px] ring-gray-300 rounded-md bg-white"
                    >
                      <option value="">All Subjects</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Class</div>
                    <select
                      value={classId}
                      onChange={(e) =>
                        setClassId(
                          e.target.value
                            ? parseInt(e.target.value)
                            : ("" as any)
                        )
                      }
                      className="w-full p-2 text-sm ring-[1.5px] ring-gray-300 rounded-md bg-white"
                    >
                      <option value="">All Classes</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Teacher</div>
                    <select
                      value={teacherId as any}
                      onChange={(e) =>
                        setTeacherId(e.target.value || ("" as any))
                      }
                      className="w-full p-2 text-sm ring-[1.5px] ring-gray-300 rounded-md bg-white"
                    >
                      <option value="">All Teachers</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSubjectId("");
                        setClassId("");
                        setTeacherId("");
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
              )}
            </div>
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFF2C2]">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              {isAdmin && <ActionForm table="Exam" type="create" />}
            </div>
          </div>
        </div>
        <Table columns={columns} rowData={rowData} data={exams} />
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

export default ExamList;
