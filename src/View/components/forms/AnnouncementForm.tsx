"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  audience: z.enum(["all", "class"]),
  classId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

type FormData = z.infer<typeof schema>;

type Props = { type: "create" | "update"; data?: any; onSuccess?: () => void };

export default function AnnouncementForm({ type, data, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { audience: "class" },
  });

  const audience = watch("audience");
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
    const load = async () => {
      if (type !== "update") return;
      if (data && data.title) {
        setValue("title", data.title || "");
        setValue("description", data.description || "");
        setValue(
          "date",
          data.date ? new Date(data.date).toISOString().slice(0, 10) : ""
        );
        if (data.classId) {
          setValue("audience", "class");
          setValue("classId", String(data.classId));
        } else {
          setValue("audience", "all");
          setValue("classId", "");
        }
        return;
      }
      if (data?.id) {
        const res = await fetch(`/api/announcements/${data.id}`);
        const a = await res.json();
        if (res.ok) {
          setValue("title", a.title || "");
          setValue("description", a.description || "");
          setValue(
            "date",
            a.date ? new Date(a.date).toISOString().slice(0, 10) : ""
          );
          if (a.classId) {
            setValue("audience", "class");
            setValue("classId", String(a.classId));
          } else {
            setValue("audience", "all");
            setValue("classId", "");
          }
        }
      }
    };
    load();
  }, [type, data, setValue]);

  const onSubmit = handleSubmit(async (form) => {
    setLoading(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description || "",
        date: form.date,
        audience: form.audience,
      };
      if (form.audience === "class" && form.classId)
        payload.classId = Number(form.classId);

      const url =
        type === "create"
          ? "/api/announcements"
          : `/api/announcements/${data.id}`;
      const method = type === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to save announcement");
        return;
      }
      onSuccess?.();
    } catch (e) {
      console.error("Failed to save announcement", e);
      alert("Failed to save announcement");
    } finally {
      setLoading(false);
    }
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-700">
        {type === "create" ? "Create Announcement" : "Edit Announcement"}
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
          <label className="text-xs text-gray-700">Audience</label>
          <select
            {...register("audience")}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="class">Specific class section</option>
            <option value="all">Everyone</option>
          </select>
        </div>
      </div>

      {audience === "class" && (
        <div>
          <label className="text-xs text-gray-700">Class Section</label>
          <select
            {...register("classId")}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-xs text-gray-700">Description</label>
        <textarea
          {...register("description")}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

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

      <button
        type="submit"
        disabled={loading}
        className="bg-[#6B8A7A] text-white p-2 rounded-md disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : type === "create"
          ? "Create Announcement"
          : "Update Announcement"}
      </button>
    </form>
  );
}
