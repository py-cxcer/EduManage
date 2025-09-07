"use client";
import { useEffect, useState } from "react";

type Props = { type: "create" | "update"; data?: any; onSuccess?: () => void };

type StudentOption = { id: string; label: string };

export default function FinanceForm({ type, data, onSuccess }: Props) {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [status, setStatus] = useState<"PAID" | "NOT_PAID">("NOT_PAID");
  const [paidAt, setPaidAt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const id = (data as any)?.id as string | undefined;

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await fetch("/api/students?page=1&limit=1000");
        const json = await res.json();
        const list = (json.students || json).map((s: any) => ({
          id: s.id,
          label: `${s.name} ${s.surname} (${s.grade?.level || s.gradeLevel}${
            s.class?.name || s.className || ""
          })`,
        }));
        setStudents(list);
      } catch (e) {
        console.error("Failed to load students", e);
      }
    };
    loadStudents();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (type !== "update" || !id) return;
      const res = await fetch(`/api/finance/${id}`);
      if (!res.ok) return;
      const p = await res.json();
      setStudentId(p.studentId);
      setAmount(p.amount);
      setStatus(p.status);
      setPaidAt(p.paidAt ? new Date(p.paidAt).toISOString().slice(0, 10) : "");
    };
    load();
  }, [type, id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || amount === "") {
      alert("Student and amount are required");
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        studentId,
        amount: Number(amount),
        status,
        paidAt:
          status === "PAID"
            ? paidAt || new Date().toISOString().slice(0, 10)
            : null,
      };
      const url = type === "create" ? "/api/finance" : `/api/finance/${id}`;
      const method = type === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to save payment");
        return;
      }
      onSuccess?.();
    } catch (e) {
      alert("Failed to save payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-700">
        {type === "create" ? "Create Payment" : "Edit Payment"}
      </h1>

      <div>
        <label className="text-xs text-gray-700">Student</label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          <option value="">Select student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="w-full md:w-1/2">
          <label className="text-xs text-gray-700">Amount</label>
          <input
            type="number"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
        <div className="w-full md:w-1/2">
          <label className="text-xs text-gray-700">Status</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="NOT_PAID">Not Paid</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {status === "PAID" && (
        <div className="w-full md:w-1/3">
          <label className="text-xs text-gray-700">Paid Date</label>
          <input
            type="date"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-[#6B8A7A] text-white p-2 rounded-md disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : type === "create"
          ? "Create Payment"
          : "Update Payment"}
      </button>
    </form>
  );
}
