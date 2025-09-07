"use client";

import { useState, useEffect } from "react";
import StudentMultiSelect from "../StudentMultiSelect";

type FormProps = {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
};

export default function ParentForm({ type, data, onSuccess }: FormProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    surname: "",
    phone: "",
    address: "",
  });
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hydrate = async () => {
      if (type !== "update") return;
      if (data && (data.username || data.name)) {
        setFormData({
          username: data.username || "",
          password: "",
          confirmPassword: "",
          name: data.name || "",
          surname: data.surname || "",
          phone: data.phone || "",
          address: data.address || "",
        });
        if (Array.isArray((data as any).studentIds)) {
          setSelectedStudentIds((data as any).studentIds);
        }
        return;
      }
      if (data?.id) {
        try {
          const res = await fetch(`/api/users/${data.id}`);
          const u = await res.json();
          if (res.ok) {
            setFormData({
              username: u.username || "",
              password: "",
              confirmPassword: "",
              name: u.name || "",
              surname: u.surname || "",
              phone: u.phone || "",
              address: u.address || "",
            });
            if (Array.isArray(u.studentIds))
              setSelectedStudentIds(u.studentIds);
          }
        } catch (e) {
          console.error("Failed to load parent details", e);
        }
      }
    };
    hydrate();
  }, [type, data]);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await fetch("/api/students?page=1&limit=1000");
        const json = await res.json();
        const list = (json.students || json).map((s: any) => ({
          id: s.id,
          name: `${s.name} ${s.surname} (${s.grade?.level ?? s.gradeLevel}${
            s.class?.name ?? s.className ?? ""
          })`,
        }));
        setStudents(list);
      } catch (e) {
        console.error("Failed to load students", e);
      }
    };
    loadStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (type === "create" && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (type === "create" && formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const endpoint =
        type === "create" ? "/api/auth/signup" : `/api/users/${data?.id}`;
      const method = type === "create" ? "POST" : "PUT";

      const requestBody =
        type === "create"
          ? {
              username: formData.username,
              password: formData.password,
              role: "PARENT",
              name: formData.name,
              surname: formData.surname,
              phone: formData.phone,
              address: formData.address,
              studentIds: selectedStudentIds,
            }
          : {
              username: formData.username,
              ...(formData.password && { password: formData.password }),
              name: formData.name,
              surname: formData.surname,
              phone: formData.phone,
              address: formData.address,
              studentIds: selectedStudentIds,
            };

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          `${
            type === "create" ? "Parent created" : "Parent updated"
          } successfully!`
        );
        onSuccess?.();
      } else {
        setError(result.error || `Failed to ${type} parent`);
      }
    } catch (error) {
      console.error(`Error ${type}ing parent:`, error);
      setError(`Failed to ${type} parent. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl text-gray-500 font-semibold mb-4">
        {type === "create" ? "Create New Parent" : "Update Parent"}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              First Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="surname"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Name
            </label>
            <input
              type="text"
              id="surname"
              value={formData.surname}
              onChange={(e) =>
                setFormData({ ...formData, surname: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {type === "create" && (
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username *
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={type === "create"}
            />
          </div>
        )}

        {type === "create" && (
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password *
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        {type === "create" && (
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        <StudentMultiSelect
          value={selectedStudentIds}
          onChange={setSelectedStudentIds}
          placeholder={
            type === "create"
              ? "Assign students (optional)"
              : "Search students..."
          }
          label={type === "create" ? "Assign Students" : "Students Assigned"}
        />

        <div className="flex gap-2 justify-end pt-4">
          <button
            type="button"
            onClick={() => onSuccess?.()}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#6B8A7A] text-white rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : type === "create"
              ? "Create Parent"
              : "Update Parent"}
          </button>
        </div>
      </form>
    </div>
  );
}
