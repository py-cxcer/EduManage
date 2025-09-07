"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { error } from "console";
import { useForm } from "react-hook-form";
import { email, z } from "zod";
import { InputField } from "@/View/components/InputField";
import { useState, useEffect } from "react";

const StudentFormSchema = z
  .object({
    username: z
      .string()
      .min(1, "Username is required")
      .max(25, "Username must be 25 characters or less"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters long"),
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(25, "First name must be 25 characters or less"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(25, "Last name must be 25 characters or less"),
    phone: z.string().optional(),
    address: z.string().optional(),
    birthday: z
      .string()
      .min(1, "Date of birth is required")
      .transform((val) => new Date(val)),
    sex: z.enum(["MALE", "FEMALE", "OTHER"], "Gender is required"),
    classId: z.string().min(1, "Class is required"),
    gradeId: z.string().min(1, "Grade is required"),
    // image: z.union([z.instanceof(File), z.undefined()]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ClassOption = {
  id: number;
  name: string;
  gradeId: number;
  grade: {
    level: number;
  };
};

type GradeOption = {
  id: number;
  level: number;
};

const StudentForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [grades, setGrades] = useState<GradeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  const [gradesLoading, setGradesLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(StudentFormSchema),
  });

  const selectedGradeId = watch("gradeId");

  // Load grades for the dropdown
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await fetch("/api/grades");
        const data = await response.json();
        setGrades(data.grades || data);
      } catch (error) {
        console.error("Error fetching grades:", error);
      } finally {
        setGradesLoading(false);
      }
    };

    fetchGrades();
  }, []);

  // Load classes for the dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("/api/classes");
        const data = await response.json();
        setClasses(data.classes || data);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setClassesLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Load student data for update
  useEffect(() => {
    if (type === "update" && data) {
      if (data.name) {
        // We have full student data
        setValue("username", data.username || "");
        setValue("email", data.email || "");
        setValue("firstName", data.name || "");
        setValue("lastName", data.surname || "");
        setValue("phone", data.phone || "");
        setValue("address", data.address || "");
        setValue(
          "birthday",
          data.birthday
            ? new Date(data.birthday).toISOString().slice(0, 10)
            : ""
        );
        setValue("sex", data.sex || "MALE");
        setValue("classId", data.classId?.toString() || "");
        setValue("gradeId", data.gradeId?.toString() || "");
      } else if (data.id) {
        // We only have the ID, fetch the full student data
        const fetchStudentData = async () => {
          try {
            const response = await fetch(`/api/students/${data.id}`);
            const studentData = await response.json();
            if (response.ok) {
              setValue("username", studentData.username || "");
              setValue("email", studentData.email || "");
              setValue("firstName", studentData.name || "");
              setValue("lastName", studentData.surname || "");
              setValue("phone", studentData.phone || "");
              setValue("address", studentData.address || "");
              setValue(
                "birthday",
                studentData.birthday
                  ? new Date(studentData.birthday).toISOString().slice(0, 10)
                  : ""
              );
              setValue("sex", studentData.sex || "MALE");
              setValue("classId", studentData.classId?.toString() || "");
              setValue("gradeId", studentData.gradeId?.toString() || "");
            }
          } catch (error) {
            console.error("Error fetching student data:", error);
          }
        };
        fetchStudentData();
      }
    }
  }, [type, data, setValue]);

  const onSubmit = handleSubmit(async (Data) => {
    console.log("Submitting student data:", Data);

    setLoading(true);
    try {
      // Transform the data to match API expectations
      const apiData = {
        username: Data.username,
        password: Data.password,
        name: Data.firstName,
        surname: Data.lastName,
        email: Data.email,
        phone: Data.phone || "",
        address: Data.address || "",
        bloodType: "A+", // Default value
        sex: Data.sex?.toUpperCase() || "MALE",
        birthday: Data.birthday,
        parentId: "defaultParent", // Default value
        classId: parseInt(Data.classId),
        gradeId: parseInt(Data.gradeId),
      };

      const url =
        type === "create" ? "/api/students" : `/api/students/${data.id}`;
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
          `${
            type === "create" ? "Student created" : "Student updated"
          } successfully!`
        );
        onSuccess?.();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(
        `Error ${type === "create" ? "creating" : "updating"} student:`,
        error
      );
      alert(
        `Failed to ${
          type === "create" ? "create" : "update"
        } student. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  });

  // Filter classes based on selected grade
  const filteredClasses = classes.filter(
    (cls) => !selectedGradeId || cls.gradeId === parseInt(selectedGradeId)
  );

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-700 ">
        {type === "create" ? "Create a new Student" : "Update Student"}
      </h1>
      <span className="text-xs text-gray-500 font-semibold font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between gap-4 flex-wrap">
        <InputField
          label="Username"
          register={register}
          name="username"
          error={errors.username}
        />
        <InputField
          label="Email"
          type="email"
          register={register}
          name="email"
          error={errors.email}
        />
        <InputField
          label="Password"
          type="password"
          register={register}
          name="password"
          error={errors.password}
        />
        <InputField
          label="Confirm Password"
          type="password"
          register={register}
          name="confirmPassword"
          error={errors.confirmPassword}
        />
      </div>
      <span className="text-xs text-gray-500 font-semibold font-medium">
        Personal Information
      </span>
      <div className="flex justify-between gap-4 flex-wrap">
        <InputField
          label="First Name"
          register={register}
          name="firstName"
          error={errors.firstName}
        />
        <InputField
          label="Last Name"
          register={register}
          name="lastName"
          error={errors.lastName}
        />
        <InputField
          label="Phone"
          type="tel"
          register={register}
          name="phone"
          defaultValue={data?.phone}
          error={errors.phone}
        />
        <InputField
          label="Address"
          register={register}
          name="address"
          defaultValue={data?.address}
          error={errors.address}
        />
        <InputField
          label="Date of Birth"
          type="date"
          register={register}
          name="birthday"
          defaultValue={data?.birthday}
          error={errors.birthday}
        />

        {/* <InputField
          label="Profile Picture"
          type="file"
          register={register}
          name="image"
          error={errors.image}
        /> */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-700">Gender</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
            {...register("sex")}
            defaultValue={data?.sex}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">
              {errors.sex.message.toString()}
            </p>
          )}
        </div>
      </div>

      <span className="text-xs text-gray-500 font-semibold font-medium">
        Academic Information
      </span>
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="text-xs text-gray-700">Grade *</label>
          {gradesLoading ? (
            <div className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black bg-gray-100">
              Loading grades...
            </div>
          ) : (
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
              {...register("gradeId")}
            >
              <option value="">Select a grade</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  Grade {grade.level}
                </option>
              ))}
            </select>
          )}
          {errors.gradeId?.message && (
            <p className="text-xs text-red-400">
              {errors.gradeId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="text-xs text-gray-700">Class Section *</label>
          {classesLoading ? (
            <div className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black bg-gray-100">
              Loading classes...
            </div>
          ) : (
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full text-black"
              {...register("classId")}
              disabled={!selectedGradeId}
            >
              <option value="">Select a class section</option>
              {filteredClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.grade.level}
                  {cls.name}
                </option>
              ))}
            </select>
          )}
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>
      </div>

      {selectedGradeId && filteredClasses.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-md">
          <h4 className="font-medium text-gray-700 mb-2">
            Selected Class Details:
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Grade:</strong>{" "}
              {grades.find((g) => g.id === parseInt(selectedGradeId))?.level}
            </p>
            <p>
              <strong>Available Sections:</strong>{" "}
              {filteredClasses
                .map((cls) => `${cls.grade.level}${cls.name}`)
                .join(", ")}
            </p>
          </div>
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
          ? "Create Student"
          : "Update Student"}
      </button>
    </form>
  );
};

export default StudentForm;
