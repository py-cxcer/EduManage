"use client";
import Image from "next/image";
import { useState } from "react";
import type { ComponentType } from "react";
import TeacherForm from "./forms/TeacherForm";
import StudentForm from "./forms/StudentForm";
import ParentForm from "./forms/ParentForm";
import ClassForm from "./forms/ClassForm";
import SubjectForm from "./forms/SubjectForm";
import LessonForm from "./forms/LessonForm";
import AssignmentForm from "./forms/AssignmentForm";
import ExamForm from "./forms/ExamForm";
import ResultForm from "./forms/ResultForm";
import EventForm from "./forms/EventForm";
import AnnouncementForm from "./forms/AnnouncementForm";
import FinanceForm from "./forms/FinanceForm";

type FormProps = {
  type: "create" | "update";
  data?: unknown;
  onSuccess?: () => void;
};

const forms: Record<
  | "Teacher"
  | "Student"
  | "Parent"
  | "Subject"
  | "Class"
  | "Lesson"
  | "Attendance"
  | "Exam"
  | "Assignment"
  | "Result"
  | "Event"
  | "Announcement"
  | "Finance",
  ComponentType<FormProps>
> = {
  Teacher: TeacherForm,
  Student: StudentForm,
  Parent: ParentForm,
  Subject: SubjectForm,
  Class: ClassForm,
  Lesson: LessonForm,
  Attendance: () => <div>Attendance form not implemented yet</div>,
  Exam: ExamForm,
  Assignment: AssignmentForm,
  Result: ResultForm,
  Event: EventForm,
  Announcement: AnnouncementForm,
  Finance: FinanceForm,
};

const ActionForm = ({
  table,
  type,
  data,
  id,
  autoOpen = false,
  hideTrigger = false,
  onClose,
}: {
  table:
    | "Teacher"
    | "Student"
    | "Parent"
    | "Subject"
    | "Class"
    | "Lesson"
    | "Attendance"
    | "Exam"
    | "Assignment"
    | "Result"
    | "Event"
    | "Announcement"
    | "Finance";
  type: "create" | "update" | "delete";
  data?: unknown;
  id?: string;
  autoOpen?: boolean;
  hideTrigger?: boolean;
  onClose?: () => void;
}) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-[#FEFAE0]"
      : type === "update"
      ? "bg-[#F5ECD5]"
      : "";

  const [open, setOpen] = useState(!!autoOpen);

  const handleFormSuccess = () => {
    setOpen(false);
    // Refresh the page to show the new data
    window.location.reload();
    onClose?.();
  };

  const handleDelete = async () => {
    if (!id) {
      console.error("No ID provided for delete operation");
      alert("Error: No ID provided for delete operation");
      return;
    }

    console.log(`Attempting to delete ${table} with ID:`, id);

    // Handle different API endpoints for different table types
    const endpoint =
      table === "Parent"
        ? `/api/users/${id}`
        : table === "Subject"
        ? `/api/subjects/${id}`
        : table === "Class"
        ? `/api/classes/${id}`
        : table === "Lesson"
        ? `/api/lessons/${id}`
        : table === "Attendance"
        ? `/api/attendances/${id}`
        : table === "Exam"
        ? `/api/exams/${id}`
        : table === "Assignment"
        ? `/api/assignments/${id}`
        : table === "Result"
        ? `/api/results/${id}`
        : table === "Event"
        ? `/api/events/${id}`
        : table === "Announcement"
        ? `/api/announcements/${id}`
        : table === "Finance"
        ? `/api/finance/${id}`
        : `/api/${table.toLowerCase()}s/${id}`;

    console.log(`API endpoint: ${endpoint}`);

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      console.log("Delete response status:", response.status);
      console.log("Delete response ok:", response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log("Delete success result:", result);
        alert(`${table} deleted successfully!`);
        setOpen(false);
        window.location.reload();
        onClose?.();
      } else {
        const result = await response.json();
        console.error("Delete error result:", result);
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error deleting ${table.toLowerCase()}:`, error);
      alert(`Failed to delete ${table.toLowerCase()}. Please try again.`);
    }
  };

  const Form = () => {
    if (type === "delete") {
      return (
        <div className="p-4 flex flex-col gap-4">
          <span className="text-center font-medium text-gray-700">
            The data for the selected item will be lost. Are You Sure You Want
            To DELETE This {table}?
          </span>
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleDelete}
              className="bg-[#B17F59] text-white py-2 px-4 rounded-md border-none"
            >
              Delete
            </button>
            <button
              onClick={() => setOpen(false)}
              className="bg-gray-500 text-white py-2 px-4 rounded-md border-none"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
    if (type === "create" || type === "update") {
      // Pass the success callback to the form
      const FormComponent = forms[table];
      // For update operations, pass the ID as data if no data is provided
      const formData = type === "update" && !data && id ? { id } : data;
      return (
        <FormComponent
          type={type}
          data={formData}
          onSuccess={handleFormSuccess}
        />
      );
    }
    return "Form not found";
  };

  return (
    <>
      {!hideTrigger && (
        <button
          className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
          onClick={() => setOpen(true)}
        >
          <Image
            src={type === "update" ? "/edit.png" : `/${type}.png`}
            alt=""
            width={16}
            height={16}
          />
        </button>
      )}
      {open && (
        <div className="w-screen h-screen fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => {
                setOpen(false);
                onClose?.();
              }}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionForm;
