"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  lessonId: z.string().min(1, "Lesson is required"),
  classId: z.string().optional(),
});

type ExamFormData = z.infer<typeof examSchema>;

type LessonOption = {
  id: number;
  subjectName: string;
  className: string; // could be multiple labels
  teacherName: string;
  classes?: { id: number; label: string }[];
};

type ExamFormProps = {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
};

const ExamForm = ({ type, data, onSuccess }: ExamFormProps) => {
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [classChoices, setClassChoices] = useState<
    { id: number; label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
  });

  const selectedLessonId = watch("lessonId");
  const selectedClassId = watch("classId");

  // Load lessons for the dropdown
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch("/api/lessons");
        const data = await response.json();

        // Transform lessons data to include subject, class, and teacher info
        const lessonOptions: LessonOption[] = data.lessons.map(
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
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLessonsLoading(false);
      }
    };

    fetchLessons();
  }, []);

  // Load exam data for update
  useEffect(() => {
    if (type === "update" && data) {
      if (data.title) {
        // We have full exam data
        setValue("title", data.title || "");
        setValue(
          "date",
          data.startTime
            ? new Date(data.startTime).toISOString().slice(0, 10)
            : ""
        );
        setValue("lessonId", data.lessonId?.toString() || "");
      } else if (data.id) {
        // We only have the ID, fetch the full exam data
        const fetchExamData = async () => {
          try {
            const response = await fetch(`/api/exams/${data.id}`);
            const examData = await response.json();
            if (response.ok) {
              setValue("title", examData.title || "");
              setValue(
                "date",
                examData.startTime
                  ? new Date(examData.startTime).toISOString().slice(0, 10)
                  : ""
              );
              setValue("lessonId", examData.lessonId?.toString() || "");
            }
          } catch (error) {
            console.error("Error fetching exam data:", error);
          }
        };
        fetchExamData();
      }
    }
  }, [type, data, setValue]);

  const onSubmit = async (formData: ExamFormData) => {
    setLoading(true);
    try {
      const examData = {
        title: formData.title,
        date: formData.date,
        lessonId: parseInt(formData.lessonId),
        classId: formData.classId ? parseInt(formData.classId) : undefined,
      };

      const url = type === "create" ? "/api/exams" : `/api/exams/${data.id}`;
      const method = type === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(examData),
      });

      if (response.ok) {
        alert(
          `${type === "create" ? "Exam created" : "Exam updated"} successfully!`
        );
        onSuccess?.();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error(
        `Error ${type === "create" ? "creating" : "updating"} exam:`,
        error
      );
      alert(
        `Failed to ${
          type === "create" ? "create" : "update"
        } exam. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">
        {type === "create" ? "Create New Exam" : "Update Exam"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            {...register("title")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter exam title"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lesson *
          </label>
          {lessonsLoading ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
              Loading lessons...
            </div>
          ) : (
            <select
              {...register("lessonId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a lesson</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.subjectName} - {lesson.className} -{" "}
                  {lesson.teacherName}
                </option>
              ))}
            </select>
          )}
          {errors.lessonId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.lessonId.message}
            </p>
          )}
        </div>

        {classChoices.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Section *
            </label>
            <select
              {...register("classId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a class</option>
              {classChoices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedLesson && (
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">
              Selected Lesson Details:
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Subject:</strong> {selectedLesson.subjectName}
              </p>
              <p>
                <strong>Class:</strong>{" "}
                {selectedClassId
                  ? classChoices.find(
                      (c) => c.id.toString() === selectedClassId
                    )?.label
                  : selectedLesson.className}
              </p>
              <p>
                <strong>Teacher:</strong> {selectedLesson.teacherName}
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            {...register("date")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.date && (
            <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <button
            type="button"
            onClick={() => onSuccess?.()}
            className="bg-gray-500 text-white py-2 px-4 rounded-md border-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#B17F59] text-white py-2 px-4 rounded-md border-none disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : type === "create"
              ? "Create Exam"
              : "Update Exam"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamForm;
