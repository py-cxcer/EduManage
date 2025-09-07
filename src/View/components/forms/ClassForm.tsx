"use client";
import { useEffect, useMemo, useState } from "react";

type FormProps = {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
};

interface TeacherOption {
  id: string;
  label: string;
}

export default function ClassForm({ type, data, onSuccess }: FormProps) {
  const [name, setName] = useState<string>(data?.name || "");
  const [capacity, setCapacity] = useState<number>(data?.capacity ?? 30);
  const initialGrade =
    typeof data?.grade === "number" ? data.grade : data?.grade?.level;
  const [grade, setGrade] = useState<number>(initialGrade || 1);
  const [supervisorId, setSupervisorId] = useState<string | "">(
    data?.supervisorId || ""
  );

  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const res = await fetch("/api/teachers?page=1&limit=1000");
        const body = await res.json();
        if (cancelled) return;
        const list = Array.isArray(body?.teachers) ? body.teachers : body;
        const mapped: TeacherOption[] = (list || []).map((t: any) => ({
          id: t.id,
          label: `${t.name} ${t.surname}`,
        }));
        setTeachers(mapped);
      } catch (e) {
        if (!cancelled) setTeachers([]);
      } finally {
        if (!cancelled) setLoadingTeachers(false);
      }
    };
    fetchTeachers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadExisting = async () => {
      if (!data?.id) return;
      try {
        const res = await fetch(`/api/classes/${data.id}`);
        const cls = await res.json();
        if (cancelled || !res.ok) return;
        setName(cls?.name || "");
        setCapacity(cls?.capacity ?? 30);
        const lvl = cls?.grade?.level ?? 1;
        setGrade(lvl);
        // We don't get supervisor id directly from GET; fetch by listing supervisor? Adjust if available
        // Since GET returns only supervisor name, leave supervisorId unchanged when absent
      } catch {}
    };
    loadExisting();
    return () => {
      cancelled = true;
    };
  }, [data?.id]);

  const grades = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: name?.trim(),
        capacity: Number(capacity) || 0,
        gradeLevel: Number(grade),
        supervisorId: supervisorId || null,
      };
      const url =
        type === "create" ? "/api/classes" : `/api/classes/${data?.id}`;
      const method = type === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(
          `Error: ${
            result?.error ||
            (type === "create"
              ? "Failed to create class"
              : "Failed to update class")
          }`
        );
        return;
      }
      alert(
        type === "create"
          ? "Class created successfully"
          : "Class updated successfully"
      );
      onSuccess?.();
    } catch (err) {
      console.error(err);
      alert(
        type === "create" ? "Failed to create class" : "Failed to update class"
      );
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={submit}>
      <h2 className="text-lg font-semibold text-gray-700">
        {type === "update" ? "Update Class" : "Create Class"}
      </h2>
      <div className="flex gap-4 flex-wrap">
        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="text-xs text-gray-700">Class Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
            required
          />
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-700">Capacity</label>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(parseInt(e.target.value || "0", 10))}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
            required
          />
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-700">Grade</label>
          <select
            value={grade}
            onChange={(e) => setGrade(parseInt(e.target.value, 10))}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
          >
            {grades.map((g) => (
              <option key={g} value={g}>{`Grade ${g}`}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="text-xs text-gray-700">Homeroom Teacher</label>
          <select
            value={supervisorId}
            onChange={(e) => setSupervisorId(e.target.value)}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
          >
            <option value="">No homeroom teacher</option>
            {loadingTeachers ? (
              <option>Loading...</option>
            ) : (
              teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
      <button className="bg-[#6B8A7A] text-white p-2 rounded-md">
        {type === "update" ? "Update Class" : "Create Class"}
      </button>
    </form>
  );
}
