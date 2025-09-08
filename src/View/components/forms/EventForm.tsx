"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  classId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

type FormData = z.infer<typeof schema>;

type Props = {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
};

export default function EventForm({ type, data, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/classes?page=1&limit=1000");
        const json = await res.json();
        const options = (json.classes || []).map((c: any) => ({
          id: c.id,
          label: `${c.grade?.level || ""}${c.name}`,
        }));
        setClasses(options);
      } catch (e) {
        console.error("Error loading classes", e);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    // Populate on update
    const load = async () => {
      if (type !== "update") return;
      if (data && data.title) {
        setValue("title", data.title || "");
        setValue("description", data.description || "");
        setValue("classId", data.classId ? String(data.classId) : "");
        const d = data.startTime ? new Date(data.startTime) : undefined;
        const e = data.endTime ? new Date(data.endTime) : undefined;
        if (d) setValue("date", d.toISOString().slice(0, 10));
        if (d)
          setValue(
            "startTime",
            `${String(d.getHours()).padStart(2, "0")}:${String(
              d.getMinutes()
            ).padStart(2, "0")}`
          );
        if (e)
          setValue(
            "endTime",
            `${String(e.getHours()).padStart(2, "0")}:${String(
              e.getMinutes()
            ).padStart(2, "0")}`
          );
        return;
      }
      if (data?.id) {
        const res = await fetch(`/api/events/${data.id}`);
        const ev = await res.json();
        if (res.ok) {
          setValue("title", ev.title || "");
          setValue("description", ev.description || "");
          setValue("classId", ev.classId ? String(ev.classId) : "");
          const d = ev.startTime ? new Date(ev.startTime) : undefined;
          const e = ev.endTime ? new Date(ev.endTime) : undefined;
          if (d) setValue("date", d.toISOString().slice(0, 10));
          if (d)
            setValue(
              "startTime",
              `${String(d.getHours()).padStart(2, "0")}:${String(
                d.getMinutes()
              ).padStart(2, "0")}`
            );
          if (e)
            setValue(
              "endTime",
              `${String(e.getHours()).padStart(2, "0")}:${String(
                e.getMinutes()
              ).padStart(2, "0")}`
            );
        }
      }
    };
    load();
  }, [type, data, setValue]);

  const onSubmit = handleSubmit(async (form) => {
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || "",
        classId: form.classId ? Number(form.classId) : undefined,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
      };
      const url = type === "create" ? "/api/events" : `/api/events/${data.id}`;
      const method = type === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to save event");
        return;
      }
      onSuccess?.();
    } catch (e) {
      console.error("Failed to save event", e);
      alert("Failed to save event");
    } finally {
      setLoading(false);
    }
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-700">
        {type === "create" ? "Create Event" : "Edit Event"}
      </h1>

      <div className="flex gap-4 flex-wrap">
        <div className="w-full md:w-1/2">
          <label className="text-xs text-gray-700">Title</label>
          <input
            type="text"
            {...register("title")}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          {errors.title && (
            <span className="text-red-500 text-xs">{errors.title.message}</span>
          )}
        </div>
        <div className="w-full md:w-1/2">
          <label className="text-xs text-gray-700">
            Class Section (optional)
          </label>
          <select
            {...register("classId")}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-700">Description</label>
        <textarea
          {...register("description")}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="w-full md:w-1/3">
          <label className="text-xs text-gray-700">Date</label>
          <input
            type="date"
            {...register("date")}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          {errors.date && (
            <span className="text-red-500 text-xs">{errors.date.message}</span>
          )}
        </div>
        <div className="w-full md:w-1/3">
          <label className="text-xs text-gray-700">Start Time</label>
          <input
            type="time"
            {...register("startTime")}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          {errors.startTime && (
            <span className="text-red-500 text-xs">
              {errors.startTime.message}
            </span>
          )}
        </div>
        <div className="w-full md:w-1/3">
          <label className="text-xs text-gray-700">End Time</label>
          <input
            type="time"
            {...register("endTime")}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          {errors.endTime && (
            <span className="text-red-500 text-xs">
              {errors.endTime.message}
            </span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-[#6B8A7A] text-white p-2 rounded-md disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : type === "create"
          ? "Create Event"
          : "Update Event"}
      </button>
    </form>
  );
}
