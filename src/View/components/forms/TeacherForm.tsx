"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { error } from "console";
import { useForm } from "react-hook-form";
import { email, z } from "zod";
import { InputField } from "@/View/components/InputField";

const TeacherFormSchema = z
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
    sex: z.enum(["male", "female", "other"], "Gender is required"),
    // image: z.union([z.instanceof(File), z.undefined()]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const TeacherForm = ({
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
  } = useForm({
    resolver: zodResolver(TeacherFormSchema),
  });

  const onSubmit = handleSubmit(async (Data) => {
    console.log("Submitting teacher data:", Data);

    // Basic validation
    if (
      !Data.username ||
      !Data.password ||
      !Data.firstName ||
      !Data.lastName ||
      !Data.email
    ) {
      alert("Please fill in all required fields");
      return;
    }

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
      };

      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();
      console.log("API response:", result);

      if (response.ok) {
        alert("Teacher created successfully!");
        // Call the success callback to close modal and refresh
        onSuccess?.();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating teacher:", error);
      alert("Failed to create teacher. Please try again.");
    }
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold text-gray-700 ">
        Create a new Teacher
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
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
            defaultValue={data?.sex}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">
              {errors.sex.message.toString()}
            </p>
          )}
        </div>
      </div>

      <button className="bg-[#6B8A7A] text-white p-2 rounded-md">
        {type === "create" ? "Create Teacher" : "Update Teacher"}
      </button>
    </form>
  );
};

export default TeacherForm;
