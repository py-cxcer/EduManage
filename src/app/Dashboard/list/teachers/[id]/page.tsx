"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProtectedRoute from "../../../../../View/components/ProtectedRoute";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  Droplets,
  Edit3,
  Save,
  X,
} from "lucide-react";
import SubjectMultiSelect from "@/View/components/SubjectMultiSelect";
import ClassMultiSelect from "@/View/components/ClassMultiSelect";

interface TeacherData {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  bloodType: string;
  dateOfBirth: string;
  birthday?: string; // Add this field for API compatibility
  sex: string;
  img?: string;
  classes?: any[];
  subjects?: any[];
}

interface TeacherStats {
  attendance: number;
  branches: number;
  lessons: number;
  classes: number;
}

const SingleTeacherPage = () => {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<TeacherData>>({});
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch teacher profile data
        const teacherResponse = await fetch(`/api/teachers/${teacherId}`);

        if (!teacherResponse.ok) {
          throw new Error(
            `Failed to fetch teacher: ${teacherResponse.statusText}`
          );
        }

        const teacherData = await teacherResponse.json();

        // Handle the date field mapping - API returns 'birthday' but we need 'dateOfBirth'
        if (teacherData.birthday && !teacherData.dateOfBirth) {
          teacherData.dateOfBirth = teacherData.birthday;
        }

        setTeacher(teacherData);
        // Initialize selections for edit mode
        setSelectedSubjectIds(
          Array.isArray(teacherData.subjects)
            ? teacherData.subjects
                .map((s: any) => s.id)
                .filter((n: any) => Number.isFinite(n))
            : []
        );
        setSelectedClassIds(
          Array.isArray(teacherData.classes)
            ? teacherData.classes
                .map((c: any) => c.id)
                .filter((n: any) => Number.isFinite(n))
            : []
        );

        // Fetch teacher statistics
        const statsResponse = await fetch(`/api/teachers/${teacherId}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          // Fallback to mock data if API fails
          setStats({
            attendance: 90,
            branches: 2,
            lessons: 6,
            classes: 6,
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching teacher data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch teacher data"
        );
        setLoading(false);
      }
    };

    if (teacherId) {
      fetchTeacherData();
    }
  }, [teacherId]);

  const startEditing = () => {
    setEditData({
      name: teacher?.name || "",
      surname: teacher?.surname || "",
      email: teacher?.email || "",
      phone: teacher?.phone || "",
      address: teacher?.address || "",
      bloodType: teacher?.bloodType || "",
      dateOfBirth: teacher?.dateOfBirth || "",
      sex: teacher?.sex || "",
    });
    setSelectedSubjectIds(
      Array.isArray(teacher?.subjects)
        ? teacher!.subjects.map((s: any) => s.id)
        : []
    );
    setSelectedClassIds(
      Array.isArray(teacher?.classes)
        ? teacher!.classes.map((c: any) => c.id)
        : []
    );
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditData({});
  };

  const saveChanges = async () => {
    if (!teacher) return;

    try {
      // Validate required fields
      if (!editData.name?.trim() || !editData.surname?.trim()) {
        alert("Name and surname are required fields");
        return;
      }

      const response = await fetch(`/api/teachers/${teacher.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editData.name?.trim(),
          surname: editData.surname?.trim(),
          email: editData.email?.trim() || teacher.email,
          phone: editData.phone?.trim(),
          address: editData.address?.trim(),
          bloodType: editData.bloodType,
          birthday: editData.dateOfBirth, // API expects 'birthday', not 'dateOfBirth'
          sex: editData.sex,
          subjectIds: selectedSubjectIds,
          classIds: selectedClassIds,
        }),
      });

      if (response.ok) {
        const updatedTeacher = await response.json();

        // Handle the date field mapping after update
        if (updatedTeacher.birthday && !updatedTeacher.dateOfBirth) {
          updatedTeacher.dateOfBirth = updatedTeacher.birthday;
        }

        setTeacher(updatedTeacher);
        setEditing(false);
        setEditData({});
        // Show success message
        alert("Teacher information updated successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update teacher");
      }
    } catch (error) {
      console.error("Error updating teacher:", error);
      alert(
        `Failed to update teacher information: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4 text-lg">
              Loading Teacher Profile...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Error state
  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Error Loading Profile
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-[#A7C1A8] text-white px-6 py-3 rounded-lg hover:bg-[#819A91] transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // No teacher data
  if (!teacher) {
    return (
      <ProtectedRoute>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Teacher Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The requested teacher profile could not be loaded.
            </p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Format date of birth - handle both dateOfBirth and birthday fields
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  // Get the date of birth from either field
  const getDateOfBirth = () => {
    return teacher.dateOfBirth || teacher.birthday || "";
  };

  // Check if current user can edit this profile
  const canEdit =
    session?.user?.role === "ADMIN" ||
    (session?.user?.role === "TEACHER" && session.user.id === teacherId);

  return (
    <ProtectedRoute>
      {/* Check if teacher is viewing their own profile or if admin is viewing any profile */}
      {session?.user?.role === "TEACHER" && session.user.id !== teacherId ? (
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You can only view your own profile.
            </p>
            <button
              onClick={() => router.back()}
              className="bg-[#A7C1A8] text-white px-6 py-3 rounded-lg hover:bg-[#819A91] transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Teacher Profile
              </h1>
              {canEdit && !editing && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 bg-[#819A91] text-white px-4 py-2 rounded-lg hover:bg-[#A7C1A8] transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
              {editing && (
                <div className="flex gap-2">
                  <button
                    onClick={saveChanges}
                    className="flex items-center gap-2 bg-[#A7C1A8] text-white px-4 py-2 rounded-lg hover:bg-[#819A91] transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="w-20 h-1 bg-gradient-to-r from-[#6B8A7A] to-[#819A91] rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {/* Profile Image */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Image
                      src={teacher.img || "/no-avatar.png"}
                      alt={`${teacher.name} ${teacher.surname}`}
                      width={120}
                      height={120}
                      className="w-30 h-30 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mt-4">
                    {teacher.name} {teacher.surname}
                  </h2>
                  <p className="text-gray-600 text-sm">Teacher</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-[#E3EAD9] rounded-lg">
                    <div className="text-2xl font-bold text-[#6B8A7A]">
                      {stats?.lessons || 0}
                    </div>
                    <div className="text-xs text-gray-600">Lessons</div>
                  </div>
                  <div className="text-center p-3 bg-[#E3EAD9] rounded-lg">
                    <div className="text-2xl font-bold text-[#819A91]">
                      {stats?.classes || 0}
                    </div>
                    <div className="text-xs text-gray-600">Classes</div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {teacher.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {teacher.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {teacher.address || "Address not specified"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#6B8A7A]" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        First Name
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={editData.name || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">
                          {teacher.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Last Name
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={editData.surname || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              surname: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">
                          {teacher.surname}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Gender
                      </label>
                      {editing ? (
                        <select
                          value={editData.sex || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, sex: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Gender</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 capitalize">
                          {teacher.sex || "Not specified"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Blood Type
                      </label>
                      {editing ? (
                        <select
                          value={editData.bloodType || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              bloodType: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Blood Type</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-red-500" />
                          <span className="text-gray-900">
                            {teacher.bloodType || "Not specified"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Date of Birth
                      </label>
                      {editing ? (
                        <input
                          type="date"
                          value={editData.dateOfBirth || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              dateOfBirth: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">
                            {formatDate(getDateOfBirth())}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Phone Number
                      </label>
                      {editing ? (
                        <input
                          type="tel"
                          value={editData.phone || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, phone: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{teacher.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Address
                      </label>
                      {editing ? (
                        <textarea
                          value={editData.address || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              address: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {teacher.address || "Not specified"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Teacher ID
                      </label>
                      <p className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                        {teacher.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teaching Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Teaching Information
                </h3>

                {/* Classes */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#A7C1A8] rounded-full"></div>
                    Classes Taught
                  </h4>
                  {!editing && teacher.classes && teacher.classes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {teacher.classes.map((cls: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <span className="text-sm font-medium text-gray-700">
                            {cls.grade?.level}
                            {cls.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : !editing ? (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-sm text-gray-500">
                        No classes assigned
                      </span>
                    </div>
                  ) : (
                    <ClassMultiSelect
                      value={selectedClassIds}
                      onChange={setSelectedClassIds}
                    />
                  )}
                </div>

                {/* Subjects */}
                <div>
                  <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#819A91] rounded-full"></div>
                    Subjects Taught
                  </h4>
                  {!editing &&
                  teacher.subjects &&
                  teacher.subjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {teacher.subjects.map((subject: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <span className="text-sm font-medium text-gray-700">
                            {subject.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : !editing ? (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-sm text-gray-500">
                        No subjects assigned
                      </span>
                    </div>
                  ) : (
                    <SubjectMultiSelect
                      value={selectedSubjectIds}
                      onChange={setSelectedSubjectIds}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default SingleTeacherPage;
