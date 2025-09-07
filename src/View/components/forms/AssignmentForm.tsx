"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { InputField } from "@/View/components/InputField";
import { useState, useEffect } from "react";

const AssignmentFormSchema = z.object({
  title: z
    .string()
    .min(1, "Assignment title is required")
    .max(200, "Title must be 200 characters or less"),
  dueDate: z.string().min(1, "Due date is required"),
  lessonId: z.string().min(1, "Lesson selection is required"),
  classId: z.string().optional(),
});

interface LessonOption {
  id: number;
  subjectName: string;
  className: string;
  teacherName: string;
  classes?: { id: number; label: string }[];
}

interface AssignmentFormProps {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}

const AssignmentForm = ({ type, data, onSuccess }: AssignmentFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(AssignmentFormSchema),
  });

  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [classChoices, setClassChoices] = useState<
    { id: number; label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(true);

  // Load lessons for selection
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch("/api/lessons");
        if (response.ok) {
          const result = await response.json();
          const lessonOptions: LessonOption[] = result.lessons.map(
            (lesson: any) => {
              const classes = (lesson.classes || []).map((c: any) => ({
                id: c.id,
                label: `${c.grade?.level ?? ""}${c.name}`,
              }));
              return {
                id: lesson.id,
                subjectName: lesson.subjectName,
                className: lesson.className,
                teacherName: lesson.teacherName,
                classes,
              } as LessonOption;
            }
          );
          setLessons(lessonOptions);
        }
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchLessons();
  }, []);

  // Load existing assignment data for update
  useEffect(() => {
    if (data && type === "update") {
      setValue("title", data.title || "");
      setValue(
        "dueDate",
        data.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : ""
      );
      setValue("lessonId", data.lessonId?.toString() || "");
    }
  }, [data, type, setValue]);

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    try {
      const apiData = {
        title: formData.title,
        dueDate: formData.dueDate,
        lessonId: formData.lessonId,
        classId: formData.classId ? parseInt(formData.classId) : undefined,
      };

      const url =
        type === "create" ? "/api/assignments" : `/api/assignments/${data.id}`;
      const method = type === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        console.log(
          `Assignment ${type === "create" ? "created" : "updated"} successfully`
        );
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorData = await response.json();
        console.error(
          `Error ${type === "create" ? "creating" : "updating"} assignment:`,
          errorData.error
        );
        alert(
          `Failed to ${type === "create" ? "create" : "update"} assignment: ${
            errorData.error
          }`
        );
      }
    } catch (error) {
      console.error(
        `Error ${type === "create" ? "creating" : "updating"} assignment:`,
        error
      );
      alert(`Failed to ${type === "create" ? "create" : "update"} assignment`);
    } finally {
      setLoading(false);
    }
  });

  const selectedLessonId = watch("lessonId");
  const selectedClassId = watch("classId");
  const selectedLesson = lessons.find(
    (lesson) => lesson.id.toString() === selectedLessonId
  );

  useEffect(() => {
    if (selectedLesson) {
      const list = selectedLesson.classes || [];
      setClassChoices(list);
      if (list.length <= 1) {
        setValue("classId", (list[0]?.id || "").toString());
      } else {
        setValue("classId", "");
      }
    } else {
      setClassChoices([]);
      setValue("classId", "");
    }
  }, [selectedLesson, setValue]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-700">
        {type === "create" ? "Create a new Assignment" : "Edit Assignment"}
      </h1>

      <span className="text-xs text-gray-500 font-semibold font-medium">
        Assignment Information
      </span>

      <div className="flex justify-between gap-4 flex-wrap">
        <div className="w-full md:w-1/2">
          <InputField
            label="Assignment Title"
            register={register}
            name="title"
            error={errors.title}
          />
        </div>
      </div>

      <div className="flex justify-between gap-4 flex-wrap">
        <div className="w-full md:w-1/2">
          <label className="text-xs text-gray-700">Due Date</label>
          <input
            type="date"
            {...register("dueDate")}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8A7A]"
          />
          {errors.dueDate && (
            <span className="text-red-500 text-xs">
              {errors.dueDate.message}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between gap-4 flex-wrap">
        <div className="w-full md:w-1/2">
          <label className="text-xs text-gray-700">Lesson</label>
          {loadingLessons ? (
            <div className="w-full p-2 border border-gray-300 rounded-md bg-gray-100">
              Loading lessons...
            </div>
          ) : (
            <select
              {...register("lessonId")}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8A7A]"
            >
              <option value="">Select a lesson</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.subjectName} - {lesson.className} (
                  {lesson.teacherName})
                </option>
              ))}
            </select>
          )}
          {errors.lessonId && (
            <span className="text-red-500 text-xs">
              {errors.lessonId.message}
            </span>
          )}
        </div>
      </div>

      {classChoices.length > 1 && (
        <div className="flex justify-between gap-4 flex-wrap">
          <div className="w-full md:w-1/2">
            <label className="text-xs text-gray-700">Class Section</label>
            <select
              {...register("classId")}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B8A7A]"
            >
              <option value="">Select a class</option>
              {classChoices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {selectedLesson && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Selected Lesson Details:
          </h3>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Subject:</strong> {selectedLesson.subjectName}
            </p>
            <p>
              <strong>Class:</strong>{" "}
              {selectedClassId
                ? classChoices.find((c) => c.id.toString() === selectedClassId)
                    ?.label
                : selectedLesson.className}
            </p>
            <p>
              <strong>Teacher:</strong> {selectedLesson.teacherName}
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || loadingLessons}
        className="bg-[#6B8A7A] text-white p-2 rounded-md disabled:opacity-50"
      >
        {loading
          ? "Processing..."
          : type === "create"
          ? "Create Assignment"
          : "Update Assignment"}
      </button>
    </form>
  );
};

export default AssignmentForm;
