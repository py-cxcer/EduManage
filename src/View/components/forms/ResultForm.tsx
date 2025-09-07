"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const resultSchema = z.object({
  score: z
    .number()
    .min(0, "Score must be at least 0")
    .max(100, "Score must be at most 100"),
  lessonId: z.string().min(1, "Lesson is required"),
  classId: z.string().optional(),
  studentId: z.string().min(1, "Student is required"),
  assessmentType: z.enum(["exam", "assignment"]),
  assessmentId: z.string().min(1, "Assessment is required"),
});

type ResultFormData = z.infer<typeof resultSchema>;

type LessonOption = {
  id: number;
  subjectName: string;
  className: string;
  teacherName: string;
  classes?: { id: number; label: string }[];
};

type StudentOption = {
  id: string;
  name: string;
  surname: string;
  className: string;
  classId?: number;
};

type AssessmentOption = {
  id: number;
  title: string;
  date: string;
  type: "exam" | "assignment";
};

type ResultFormProps = {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
};

const ResultForm = ({ type, data, onSuccess }: ResultFormProps) => {
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [classChoices, setClassChoices] = useState<
    { id: number; label: string }[]
  >([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [assessments, setAssessments] = useState<AssessmentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ResultFormData>({
    resolver: zodResolver(resultSchema),
  });

  const selectedLessonId = watch("lessonId");
  const selectedAssessmentType = watch("assessmentType");
  const selectedClassId = watch("classId");

  // Debug lesson selection
  useEffect(() => {
    console.log("Selected lesson ID changed:", selectedLessonId);
  }, [selectedLessonId]);

  // Load lessons for the dropdown
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch("/api/lessons");
        const data = await response.json();

        console.log("Fetched lessons:", data);

        // Transform lessons data to include subject, class, teacher, and classes list
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

        console.log("Transformed lesson options:", lessonOptions);
        setLessons(lessonOptions);
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLessonsLoading(false);
      }
    };

    fetchLessons();
  }, []);

  // Load students for the dropdown
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch("/api/students?page=1&limit=1000");
        const data = await response.json();

        // Transform students data
        const list = Array.isArray(data?.students)
          ? data.students
          : Array.isArray(data)
          ? data
          : [];
        const studentOptions: StudentOption[] = list.map((student: any) => ({
          id: student.id,
          name: student.name,
          surname: student.surname,
          className:
            student?.class?.grade && student?.class?.name
              ? `${student.class.grade.level}${student.class.name}`
              : "",
          classId: student.classId,
        }));

        setStudents(studentOptions);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Load assessments based on selected lesson and type
  useEffect(() => {
    const fetchAssessments = async () => {
      if (!selectedLessonId || !selectedAssessmentType) {
        setAssessments([]);
        setAssessmentsLoading(false);
        return;
      }

      setAssessmentsLoading(true);
      try {
        const endpoint =
          selectedAssessmentType === "exam" ? "/api/exams" : "/api/assignments";
        const response = await fetch(endpoint);
        const data = await response.json();

        console.log(`Fetched ${selectedAssessmentType}s:`, data);
        console.log(`Looking for lessonId: ${selectedLessonId}`);

        // Filter assessments for the selected lesson
        const lessonAssessments = (
          data.exams ||
          data.assignments ||
          data
        ).filter((assessment: any) => {
          const assessmentLessonId = parseInt(assessment.lessonId);
          const selectedLessonIdInt = parseInt(selectedLessonId);
          console.log(
            `Assessment ${
              assessment.id
            }: lessonId=${assessmentLessonId}, selected=${selectedLessonIdInt}, matches=${
              assessmentLessonId === selectedLessonIdInt
            }`
          );
          return assessmentLessonId === selectedLessonIdInt;
        });

        console.log(
          `Filtered ${selectedAssessmentType}s for lesson ${selectedLessonId}:`,
          lessonAssessments
        );

        // Transform assessments data
        const assessmentOptions: AssessmentOption[] = lessonAssessments.map(
          (assessment: any) => ({
            id: assessment.id,
            title: assessment.title,
            date:
              selectedAssessmentType === "exam"
                ? assessment.startTime
                : assessment.dueDate,
            type: selectedAssessmentType,
          })
        );

        console.log("Transformed assessment options:", assessmentOptions);

        setAssessments(assessmentOptions);
      } catch (error) {
        console.error("Error fetching assessments:", error);
      } finally {
        setAssessmentsLoading(false);
      }
    };

    fetchAssessments();
  }, [selectedLessonId, selectedAssessmentType]);

  // Load result data for update
  useEffect(() => {
    if (type === "update" && data) {
      if (data.score !== undefined) {
        // We have full result data
        setValue("score", data.score);
        setValue("lessonId", data.lessonId?.toString() || "");
        setValue("studentId", data.studentId || "");

        // Determine assessment type and ID
        if (data.examId) {
          setValue("assessmentType", "exam");
          setValue("assessmentId", data.examId.toString());
        } else if (data.assignmentId) {
          setValue("assessmentType", "assignment");
          setValue("assessmentId", data.assignmentId.toString());
        }
      } else if (data.id) {
        // We only have the ID, fetch the full result data
        const fetchResultData = async () => {
          try {
            const response = await fetch(`/api/results/${data.id}`);
            const resultData = await response.json();
            if (response.ok) {
              setValue("score", resultData.score);
              setValue("lessonId", resultData.lessonId?.toString() || "");
              setValue("studentId", resultData.studentId || "");

              // Determine assessment type and ID
              if (resultData.examId) {
                setValue("assessmentType", "exam");
                setValue("assessmentId", resultData.examId.toString());
              } else if (resultData.assignmentId) {
                setValue("assessmentType", "assignment");
                setValue("assessmentId", resultData.assignmentId.toString());
              }
            }
          } catch (error) {
            console.error("Error fetching result data:", error);
          }
        };
        fetchResultData();
      }
    }
  }, [type, data, setValue]);

  const onSubmit = async (formData: ResultFormData) => {
    setLoading(true);
    try {
      const resultData = {
        score: formData.score,
        studentId: formData.studentId,
        [formData.assessmentType === "exam" ? "examId" : "assignmentId"]:
          parseInt(formData.assessmentId),
      };

      const url =
        type === "create" ? "/api/results" : `/api/results/${data.id}`;
      const method = type === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultData),
      });

      if (response.ok) {
        alert(
          `${
            type === "create" ? "Result created" : "Result updated"
          } successfully!`
        );
        onSuccess?.();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error(
        `Error ${type === "create" ? "creating" : "updating"} result:`,
        error
      );
      alert(
        `Failed to ${
          type === "create" ? "create" : "update"
        } result. Please try again.`
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

  const selectedStudent = students.find(
    (student) => student.id === watch("studentId")
  );

  const selectedAssessment = assessments.find(
    (assessment) => assessment.id.toString() === watch("assessmentId")
  );

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">
        {type === "create" ? "Create New Result" : "Update Result"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            Student *
          </label>
          {studentsLoading ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
              Loading students...
            </div>
          ) : (
            <select
              {...register("studentId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a student</option>
              {students
                .filter((student) => {
                  if (!selectedLesson) return true;
                  if (selectedClassId)
                    return student.classId === Number(selectedClassId);
                  // fallback to class name compare
                  return student.className === selectedLesson.className;
                })
                .map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} {student.surname} - {student.className}
                  </option>
                ))}
            </select>
          )}
          {errors.studentId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.studentId.message}
            </p>
          )}
        </div>

        {selectedStudent && (
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">
              Selected Student Details:
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Name:</strong> {selectedStudent.name}{" "}
                {selectedStudent.surname}
              </p>
              <p>
                <strong>Class:</strong> {selectedStudent.className}
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assessment Type *
          </label>
          <select
            {...register("assessmentType")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select assessment type</option>
            <option value="exam">Exam</option>
            <option value="assignment">Assignment</option>
          </select>
          {errors.assessmentType && (
            <p className="text-red-500 text-sm mt-1">
              {errors.assessmentType.message}
            </p>
          )}
        </div>

        {selectedAssessmentType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {selectedAssessmentType === "exam" ? "Exam" : "Assignment"} *
            </label>
            {assessmentsLoading ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                Loading {selectedAssessmentType}s...
              </div>
            ) : (
              <select
                {...register("assessmentId")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select {selectedAssessmentType}</option>
                {assessments.map((assessment) => {
                  const formattedDate = assessment.date
                    ? new Date(assessment.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                      })
                    : "No date";
                  return (
                    <option key={assessment.id} value={assessment.id}>
                      {assessment.title} - {formattedDate}
                    </option>
                  );
                })}
              </select>
            )}
            {errors.assessmentId && (
              <p className="text-red-500 text-sm mt-1">
                {errors.assessmentId.message}
              </p>
            )}
          </div>
        )}

        {selectedAssessment && (
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">
              Selected Assessment Details:
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Title:</strong> {selectedAssessment.title}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedAssessment.date).toLocaleDateString()}
              </p>
              <p>
                <strong>Type:</strong> {selectedAssessment.type}
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Score *
          </label>
          <input
            type="number"
            min="0"
            max="100"
            {...register("score", { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter score (0-100)"
          />
          {errors.score && (
            <p className="text-red-500 text-sm mt-1">{errors.score.message}</p>
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
              ? "Create Result"
              : "Update Result"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResultForm;
