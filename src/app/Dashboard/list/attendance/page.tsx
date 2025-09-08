"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/View/components/ProtectedRoute";
import Image from "next/image";

type Option = { id: number; name: string; label?: string };

export default function AttendancePage() {
  const [grades, setGrades] = useState<{ id: number; level: number }[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [classId, setClassId] = useState<number | "">("");
  const [lessonId, setLessonId] = useState<number | "">("");
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [rows, setRows] = useState<
    { studentId: string; name: string; present: boolean }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [gradesRes, classesRes, lessonsRes] = await Promise.all([
          fetch("/api/grades"),
          fetch("/api/classes?page=1&limit=1000"),
          fetch("/api/lessons?page=1&limit=1000"),
        ]);
        const [gradesJson, classesJson, lessonsJson] = await Promise.all([
          gradesRes.json(),
          classesRes.json(),
          lessonsRes.json(),
        ]);
        setGrades(
          Array.isArray(gradesJson) ? gradesJson : gradesJson.grades || []
        );
        const cls = (classesJson.classes || classesJson || []).map(
          (c: any) => ({
            id: c.id,
            name: c.name,
            label: `${c.grade?.level ?? ""}${c.name}`,
          })
        );
        setClasses(cls);
        const lsn = (lessonsJson.lessons || lessonsJson || []).map(
          (l: any) => ({
            id: l.id,
            subjectName: l.subjectName ?? l.subject?.name,
            teacherName:
              l.teacherName ??
              `${l.teacher?.name ?? ""} ${l.teacher?.surname ?? ""}`.trim(),
            classes: l.classes || [],
          })
        );
        setLessons(lsn);
      } catch (e) {
        console.error("Failed to load initial data", e);
      }
    };
    load();
  }, []);

  const lessonOptionsForClass = useMemo(() => {
    if (!classId) return [] as any[];
    return lessons.filter(
      (l: any) =>
        Array.isArray(l.classes) && l.classes.some((c: any) => c.id === classId)
    );
  }, [lessons, classId]);

  const fetchAttendance = async () => {
    if (!classId || !lessonId || !date) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/attendance?classId=${classId}&lessonId=${lessonId}&date=${date}`
      );
      const json = await res.json();
      if (res.ok) setRows(json.items || []);
      else setRows([]);
    } catch (e) {
      console.error("Failed to fetch attendance", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // auto-load when ready
    if (classId && lessonId && date) fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, lessonId, date]);

  const setPresent = (studentId: string, present: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, present } : r))
    );
  };

  const save = async () => {
    if (!lessonId || !date) return;
    setLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, date, items: rows }),
      });
      if (!res.ok) throw new Error("Failed to save attendance");
      alert("Attendance saved");
    } catch (e) {
      console.error(e);
      alert("Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}>
      <div className="bg-[#EEEFE0] p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="hidden md:block text-lg font-semibold text-gray-500">
            Attendance
          </h1>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-2 text-sm ring-[1.5px] ring-gray-300 rounded-md bg-white"
            />
            <select
              value={classId}
              onChange={(e) => {
                setClassId(
                  e.target.value ? parseInt(e.target.value) : ("" as any)
                );
                setLessonId("");
              }}
              className="p-2 text-sm ring-[1.5px] ring-gray-300 rounded-md bg-white"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || c.name}
                </option>
              ))}
            </select>
            <select
              value={lessonId}
              onChange={(e) =>
                setLessonId(
                  e.target.value ? parseInt(e.target.value) : ("" as any)
                )
              }
              className="p-2 text-sm ring-[1.5px] ring-gray-300 rounded-md bg-white"
              disabled={!classId}
            >
              <option value="">Select Lesson</option>
              {lessonOptionsForClass.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.subjectName} — {l.teacherName}
                </option>
              ))}
            </select>
            <button
              onClick={save}
              disabled={loading || !lessonId}
              className="px-4 py-2 bg-[#6B8A7A] text-white rounded-md hover:opacity-90 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-[#6B8A7A] text-white">
              <tr>
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Present</th>
                <th className="text-left p-3">Absent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.studentId} className="border-t border-gray-200">
                  <td className="p-3 text-gray-700">{r.name}</td>
                  <td className="p-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name={`att-${r.studentId}`}
                        checked={r.present === true}
                        onChange={() => setPresent(r.studentId, true)}
                        className="h-4 w-4"
                      />
                      <span className="text-gray-700">Present</span>
                    </label>
                  </td>
                  <td className="p-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name={`att-${r.studentId}`}
                        checked={r.present === false}
                        onChange={() => setPresent(r.studentId, false)}
                        className="h-4 w-4"
                      />
                      <span className="text-gray-700">Absent</span>
                    </label>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={3}>
                    {classId && lessonId
                      ? "No students found"
                      : "Choose class and lesson to load students"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
