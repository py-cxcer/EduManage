"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { InputField } from "@/View/components/InputField";
import TeacherMultiSelect from "@/View/components/TeacherMultiSelect";
import { useState, useEffect } from "react";

const SubjectFormSchema = z.object({
  name: z
    .string()
    .min(1, "Subject name is required")
    .max(50, "Subject name must be 50 characters or less"),
});

const SubjectForm = ({
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
  } = useForm({
    resolver: zodResolver(SubjectFormSchema),
  });

  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing data for update
  useEffect(() => {
    if (type === "update" && data) {
      setValue("name", data.name);
      if (data.teachers) {
        const teacherIds = data.teachers.map((teacher: any) => teacher.id);
        setTeacherIds(teacherIds);
      } else if (data.id) {
        // If we only have the ID, fetch the full subject data
        const fetchSubjectData = async () => {
          try {
            const response = await fetch(`/api/subjects/${data.id}`);
            const subjectData = await response.json();
            if (response.ok) {
              setValue("name", subjectData.name);
              if (subjectData.teachers) {
                const teacherIds = subjectData.teachers.map(
                  (teacher: any) => teacher.id
                );
                setTeacherIds(teacherIds);
              }
            }
          } catch (error) {
            console.error("Error fetching subject data:", error);
          }
        };
        fetchSubjectData();
      }
    }
  }, [data, type, setValue]);

  const onSubmit = handleSubmit(async (formData) => {
    console.log("Submitting subject data:", formData);
    console.log("Selected teacher IDs:", teacherIds);

    // Basic validation
    if (!formData.name) {
      alert("Please fill in the subject name");
      return;
    }

    setLoading(true);

    try {
      const apiData = {
        name: formData.name,
        teacherIds: teacherIds,
      };

      const url =
        type === "create" ? "/api/subjects" : `/api/subjects/${data.id}`;
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
          `Subject ${type === "create" ? "created" : "updated"} successfully!`
        );
        onSuccess?.();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(
        `Error ${type === "create" ? "creating" : "updating"} subject:`,
        error
      );
      alert(
        `Failed to ${
          type === "create" ? "create" : "update"
        } subject. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-700">
        {type === "create" ? "Create a new Subject" : "Edit Subject"}
      </h1>

      <span className="text-xs text-gray-500 font-semibold font-medium">
        Subject Information
      </span>

      <div className="flex justify-between gap-4 flex-wrap">
        <div className="w-full md:w-1/2">
          <InputField
            label="Subject Name"
            register={register}
            name="name"
            error={errors.name}
          />
        </div>
      </div>

      <div className="flex justify-between gap-4 flex-wrap">
        <TeacherMultiSelect
          value={teacherIds}
          onChange={setTeacherIds}
          placeholder="Select teachers for this subject..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-[#6B8A7A] text-white p-2 rounded-md disabled:opacity-50"
      >
        {loading
          ? "Processing..."
          : type === "create"
          ? "Create Subject"
          : "Update Subject"}
      </button>
    </form>
  );
};

export default SubjectForm;
