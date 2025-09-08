"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { InputField } from "@/View/components/InputField";
import SubjectMultiSelect from "@/View/components/SubjectMultiSelect";
import ClassMultiSelect from "@/View/components/ClassMultiSelect";
import TeacherMultiSelect from "@/View/components/TeacherMultiSelect";
import { useState, useEffect } from "react";

const LessonFormSchema = z.object({});

const LessonForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(LessonFormSchema),
  });

  const [subjectIds, setSubjectIds] = useState<number[]>([]);
  const [classIds, setClassIds] = useState<number[]>([]);
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [days, setDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [openDays, setOpenDays] = useState<boolean>(false);

  // Load existing data for update
  useEffect(() => {
    if (type === "update" && data) {
      if (data.startAt)
        setStartAt(new Date(data.startAt).toISOString().slice(0, 16));
      if (data.endAt) setEndAt(new Date(data.endAt).toISOString().slice(0, 16));
      if (Array.isArray(data.days)) setDays(data.days);
      else if (data.dayOfWeek !== undefined && data.dayOfWeek !== null)
        setDayOfWeek(String(data.dayOfWeek));
      if (data.startTime) setStartTime(data.startTime);
      if (data.endTime) setEndTime(data.endTime);
      if (data.subjectId) {
        setSubjectIds([data.subjectId]);
      }
      if (data.classId) {
        setClassIds([data.classId]);
      }
      if (data.teacherId) {
        setTeacherIds([data.teacherId]);
      }
    } else if (type === "update" && data?.id) {
      // If we only have the ID, fetch the full lesson data
      const fetchLessonData = async () => {
        try {
          const response = await fetch(`/api/lessons/${data.id}`);
          const lessonData = await response.json();
          if (response.ok) {
            if (lessonData.subjectId) {
              setSubjectIds([lessonData.subjectId]);
            }
            if (lessonData.classes && lessonData.classes.length > 0) {
              setClassIds(lessonData.classes.map((cls: any) => cls.id));
            } else if (lessonData.classId) {
              setClassIds([lessonData.classId]);
            }
            if (lessonData.teacherId) {
              setTeacherIds([lessonData.teacherId]);
            }
          }
        } catch (error) {
          console.error("Error fetching lesson data:", error);
        }
      };
      fetchLessonData();
    }
  }, [data, type, setValue]);

  const onSubmit = handleSubmit(async (formData) => {
    console.log("Submitting lesson data:", formData);
    console.log("Selected subject IDs:", subjectIds);
    console.log("Selected class IDs:", classIds);
    console.log("Selected teacher IDs:", teacherIds);

    // Basic validation
    if (subjectIds.length === 0) {
      alert("Please select at least one subject");
      return;
    }

    if (classIds.length === 0) {
      alert("Please select at least one class");
      return;
    }

    if (teacherIds.length === 0) {
      alert("Please select at least one teacher");
      return;
    }

    setLoading(true);

    try {
      const apiData = {
        subjectId: subjectIds[0], // For now, use the first selected subject
        classIds: classIds,
        teacherId: teacherIds[0], // For now, use the first selected teacher
        startAt: startAt || undefined,
        endAt: endAt || undefined,
        dayOfWeek: dayOfWeek !== "" ? parseInt(dayOfWeek) : undefined,
        days: days.length ? days : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      };

      const url =
        type === "create" ? "/api/lessons" : `/api/lessons/${data.id}`;
      const method = type === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();
      console.log("API response:", result);

      if (response.ok) {
        alert(
          `Lesson ${type === "create" ? "created" : "updated"} successfully!`
        );
        onSuccess?.();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(
        `Error ${type === "create" ? "creating" : "updating"} lesson:`,
        error
      );
      alert(
        `Failed to ${
          type === "create" ? "create" : "update"
        } lesson. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-700">
        {type === "create" ? "Create a new Lesson" : "Edit Lesson"}
      </h1>

      <span className="text-xs text-gray-500 font-semibold font-medium">
        Lesson Assignment
      </span>

      <div className="flex justify-between gap-4 flex-wrap">
        <SubjectMultiSelect
          value={subjectIds}
          onChange={setSubjectIds}
          placeholder="Select subject..."
        />
      </div>

      <div className="flex justify-between gap-4 flex-wrap">
        <ClassMultiSelect
          value={classIds}
          onChange={setClassIds}
          placeholder="Select classes..."
        />
      </div>

      <div className="flex justify-between gap-4 flex-wrap">
        <TeacherMultiSelect
          value={teacherIds}
          onChange={setTeacherIds}
          placeholder="Select teacher..."
        />
      </div>

      <span className="text-xs text-gray-500 font-semibold font-medium">
        Schedule (optional)
      </span>

      <div className="flex justify-between gap-4 flex-wrap">
        <div className="w-full md:w-1/2">
          <label className="text-xs text-gray-700">Days of Week</label>
          <div className="relative">
            <button
              type="button"
              className="w-full ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm bg-white text-black text-left"
              onClick={() => setOpenDays((s) => !s)}
            >
              {days.length ? `${days.length} selected` : "Select day(s)..."}
            </button>
            {openDays && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto p-2">
                {[
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ].map((label, idx) => (
                  <label key={idx} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={days.includes(idx)}
                      onChange={(e) =>
                        setDays((prev) =>
                          e.target.checked
                            ? [...prev, idx]
                            : prev.filter((d) => d !== idx)
                        )
                      }
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {days.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {days
                .slice()
                .sort()
                .map((d) => (
                  <span
                    key={d}
                    className="px-2 py-0.5 text-xs bg-[#e6efe6] rounded"
                  >
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between gap-4 flex-wrap">
        <div className="w-full md:w-1/2">
          <label className="text-xs text-gray-700">Start Time (HH:MM)</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8A7A]"
          />
        </div>
        <div className="w-full md:w-1/2">
          <label className="text-xs text-gray-700">End Time (HH:MM)</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8A7A]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-[#6B8A7A] text-white p-2 rounded-md disabled:opacity-50"
      >
        {loading
          ? "Processing..."
          : type === "create"
          ? "Create Lesson"
          : "Update Lesson"}
      </button>
    </form>
  );
};

export default LessonForm;
