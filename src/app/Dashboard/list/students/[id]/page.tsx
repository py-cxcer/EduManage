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
  GraduationCap,
  Users,
  TrendingUp,
  Clock,
  BookOpen,
  Award,
} from "lucide-react";

interface StudentData {
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
  grade?: {
    id: number;
    level: number;
  };
  class?: {
    id: number;
    name: string;
    capacity: number;
  };
  parent?: {
    id: string;
    name: string;
    surname: string;
    email?: string;
    phone: string;
  };
}

interface StudentStats {
  attendance: {
    overall: number;
    recent: number;
    totalRecords: number;
    presentRecords: number;
    bySubject: Array<{
      subject: string;
      percentage: number;
      total: number;
      present: number;
    }>;
  };
  academic: {
    averageScore: number;
    totalResults: number;
    recentResults: Array<{
      id: number;
      score: number;
      type: string;
      subject: string;
      title: string;
      date: string;
    }>;
  };
  classInfo: {
    grade: number;
    className: string;
    classCapacity: number;
    parentName: string;
  };
}

const SingleStudentPage = () => {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentData | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<StudentData>>({});

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch student profile data
        const studentResponse = await fetch(`/api/students/${studentId}`);

        if (!studentResponse.ok) {
          throw new Error(
            `Failed to fetch student: ${studentResponse.statusText}`
          );
        }

        const studentData = await studentResponse.json();

        // Handle the date field mapping - API returns 'birthday' in the format 'dateOfBirth'
        if (studentData.birthday && !studentData.dateOfBirth) {
          studentData.dateOfBirth = studentData.birthday;
        }

        setStudent(studentData);

        // Fetch student statistics
        const statsResponse = await fetch(`/api/students/${studentId}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          // Fallback to mock data if API fails
          setStats({
            attendance: {
              overall: 85,
              recent: 90,
              totalRecords: 50,
              presentRecords: 43,
              bySubject: [],
            },
            academic: {
              averageScore: 78,
              totalResults: 12,
              recentResults: [],
            },
            classInfo: {
              grade: 1,
              className: "1A",
              classCapacity: 30,
              parentName: "John Doe",
            },
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching student data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch student data"
        );
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  const startEditing = () => {
    setEditData({
      name: student?.name || "",
      surname: student?.surname || "",
      email: student?.email || "",
      phone: student?.phone || "",
      address: student?.address || "",
      bloodType: student?.bloodType || "",
      dateOfBirth: student?.dateOfBirth || "",
      sex: student?.sex || "",
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditData({});
  };

  const saveChanges = async () => {
    if (!student) return;

    try {
      // Validate required fields
      if (!editData.name?.trim() || !editData.surname?.trim()) {
        alert("Name and surname are required fields");
        return;
      }

      const response = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editData.name?.trim(),
          surname: editData.surname?.trim(),
          email: editData.email?.trim() || student.email,
          phone: editData.phone?.trim(),
          address: editData.address?.trim(),
          bloodType: editData.bloodType,
          birthday: editData.dateOfBirth, // API expects 'birthday', not 'dateOfBirth'
          sex: editData.sex,
        }),
      });

      if (response.ok) {
        const updatedStudent = await response.json();

        // Handle the date field mapping after update
        if (updatedStudent.birthday && !updatedStudent.dateOfBirth) {
          updatedStudent.dateOfBirth = updatedStudent.birthday;
        }

        setStudent(updatedStudent);
        setEditing(false);
        setEditData({});
        // Show success message
        alert("Student information updated successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update student");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      alert(
        `Failed to update student information: ${
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
              Loading Student Profile...
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

  // No student data
  if (!student) {
    return (
      <ProtectedRoute>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Student Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The requested student profile could not be loaded.
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
    return student.dateOfBirth || student.birthday || "";
  };

  // Check if current user can edit this profile
  const canEdit =
    session?.user?.role === "ADMIN" ||
    (session?.user?.role === "STUDENT" && session.user.id === studentId);

  return (
    <ProtectedRoute>
      {/* Check if student is viewing their own profile or if admin is viewing any profile */}
      {session?.user?.role === "STUDENT" && session.user.id !== studentId ? (
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
        <div className="flex-1 p-4 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Student Profile
              </h1>
              {canEdit && !editing && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 bg-[#819A91] text-white px-3 py-1.5 rounded-lg hover:bg-[#A7C1A8] transition-colors text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
              {editing && (
                <div className="flex gap-2">
                  <button
                    onClick={saveChanges}
                    className="flex items-center gap-2 bg-[#A7C1A8] text-white px-3 py-1.5 rounded-lg hover:bg-[#819A91] transition-colors text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-[#6B8A7A] to-[#819A91] rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Left Column - Profile Card */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit">
                {/* Profile Image */}
                <div className="text-center mb-4">
                  <div className="relative inline-block">
                    <Image
                      src={student.img || "/no-avatar.png"}
                      alt={`${student.name} ${student.surname}`}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mt-2">
                    {student.name} {student.surname}
                  </h2>
                  <p className="text-gray-600 text-xs">Student</p>
                  {stats?.classInfo && (
                    <div className="mt-1">
                      <p className="text-xs font-medium text-[#6B8A7A]">
                        Grade {stats.classInfo.grade} -{" "}
                        {stats.classInfo.className}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-center p-2 bg-[#E3EAD9] rounded-lg">
                    <div className="text-lg font-bold text-[#6B8A7A]">
                      {stats?.attendance?.overall || 0}%
                    </div>
                    <div className="text-xs text-gray-600">Attendance</div>
                  </div>
                  <div className="text-center p-2 bg-[#E3EAD9] rounded-lg">
                    <div className="text-lg font-bold text-[#819A91]">
                      {stats?.academic?.averageScore || 0}
                    </div>
                    <div className="text-xs text-gray-600">Avg Score</div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Mail className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-700 truncate">
                      {student.email || "Email not specified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Phone className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-700">
                      {student.phone || "Phone not specified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-700 truncate">
                      {student.address || "Address not specified"}
                    </span>
                  </div>
                  {stats?.classInfo?.parentName && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Users className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-700 truncate">
                        Parent: {stats.classInfo.parentName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Information */}
            <div className="xl:col-span-3 space-y-4">
              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#6B8A7A]" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">
                      First Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.name || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium text-sm">
                        {student.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium text-sm">
                        {student.surname}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">
                      Gender
                    </label>
                    {editing ? (
                      <select
                        value={editData.sex || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, sex: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 capitalize text-sm">
                        {student.sex || "Not specified"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
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
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-red-500" />
                        <span className="text-gray-900 text-sm">
                          {student.bloodType || "Not specified"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">
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
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-900 text-sm">
                          {formatDate(getDateOfBirth())}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">
                      Phone Number
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={editData.phone || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, phone: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 text-sm">
                        {student.phone || "Not specified"}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 block mb-1">
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
                        rows={2}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 text-sm">
                        {student.address || "Not specified"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">
                      Student ID
                    </label>
                    <p className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                      {student.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#6B8A7A]" />
                  Academic Information
                </h3>

                {/* Class and Grade Info */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#A7C1A8] rounded-full"></div>
                    Current Enrollment
                  </h4>
                  {stats?.classInfo ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#E3EAD9] rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-[#6B8A7A]">
                          {stats.classInfo.grade}
                        </div>
                        <div className="text-xs text-gray-600">Grade Level</div>
                      </div>
                      <div className="bg-[#E3EAD9] rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-[#6B8A7A]">
                          {stats.classInfo.className}
                        </div>
                        <div className="text-xs text-gray-600">
                          Class Section
                        </div>
                      </div>
                      <div className="bg-[#E3EAD9] rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-[#819A91]">
                          {stats.classInfo.classCapacity}
                        </div>
                        <div className="text-xs text-gray-600">
                          Class Capacity
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <span className="text-xs text-gray-500">
                        No class information available
                      </span>
                    </div>
                  )}
                </div>

                {/* Academic Performance */}
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#819A91] rounded-full"></div>
                    Academic Performance
                  </h4>
                  {stats?.academic ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#E3EAD9] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="w-3 h-3 text-[#6B8A7A]" />
                          <span className="text-xs font-medium text-gray-700">
                            Average Score
                          </span>
                        </div>
                        <div className="text-lg font-bold text-[#6B8A7A]">
                          {stats.academic.averageScore}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Based on {stats.academic.totalResults} assessments
                        </div>
                      </div>
                      <div className="bg-[#E3EAD9] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="w-3 h-3 text-[#819A91]" />
                          <span className="text-xs font-medium text-gray-700">
                            Total Assessments
                          </span>
                        </div>
                        <div className="text-lg font-bold text-[#819A91]">
                          {stats.academic.totalResults}
                        </div>
                        <div className="text-xs text-gray-500">
                          Exams and assignments
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <span className="text-xs text-gray-500">
                        No academic data available
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Tracker */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#6B8A7A]" />
                  Attendance Tracker
                </h3>

                {/* Overall Attendance */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Overall Attendance
                  </h4>
                  {stats?.attendance ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#E3EAD9] rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-[#6B8A7A]">
                          {stats.attendance.overall}%
                        </div>
                        <div className="text-xs text-gray-600">Overall</div>
                        <div className="text-xs text-gray-500">
                          {stats.attendance.presentRecords}/
                          {stats.attendance.totalRecords} days
                        </div>
                      </div>
                      <div className="bg-[#E3EAD9] rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-[#819A91]">
                          {stats.attendance.recent}%
                        </div>
                        <div className="text-xs text-gray-600">
                          Recent (30 days)
                        </div>
                        <div className="text-xs text-gray-500">Last month</div>
                      </div>
                      <div className="bg-[#E3EAD9] rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-[#6B8A7A]">
                          {stats.attendance.totalRecords}
                        </div>
                        <div className="text-xs text-gray-600">
                          Total Records
                        </div>
                        <div className="text-xs text-gray-500">All time</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <span className="text-xs text-gray-500">
                        No attendance data available
                      </span>
                    </div>
                  )}
                </div>

                {/* Attendance by Subject */}
                {stats?.attendance?.bySubject &&
                  stats.attendance.bySubject.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#819A91] rounded-full"></div>
                        Attendance by Subject
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {stats.attendance.bySubject.map((subject, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-700 text-sm">
                                {subject.subject}
                              </span>
                              <span className="text-xs font-bold text-[#6B8A7A]">
                                {subject.percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-[#6B8A7A] h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${subject.percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {subject.present}/{subject.total} classes attended
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default SingleStudentPage;
