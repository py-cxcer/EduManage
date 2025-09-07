"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "../../../../View/components/ProtectedRoute";

interface UserProfile {
  id: string;
  username: string;
  name: string;
  surname: string;
  email: string;
  phone: string | null;
  address: string;
  birthday: string;
  sex: string;
  bloodType: string;
  img?: string;
  grade?: { level: number };
  class?: { name: string };
  parent?: { name: string; surname: string };
  subjects?: Array<{ name: string }>;
  classes?: Array<{ name: string; grade?: { level: number } }>;
}

export default function UserProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string>("");
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        // First, try to fetch by User ID (cuid)
        const userResponse = await fetch(`/api/users/${userId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const roleLower = String(userData.role).toLowerCase();
          setUserType(roleLower);

          // Then fetch the specific profile using the same id; server routes accept userId too
          const response = await fetch(`/api/${roleLower}s/${userId}`);
          if (response.ok) {
            const data = await response.json();
            setProfile(data);
            return;
          }
        }

        // Fallback: treat the param as a domain ID (T###/S###)
        const teacherRes = await fetch(`/api/teachers/${userId}`);
        if (teacherRes.ok) {
          const data = await teacherRes.json();
          setUserType("teacher");
          setProfile(data);
          return;
        }

        const studentRes = await fetch(`/api/students/${userId}`);
        if (studentRes.ok) {
          const data = await studentRes.json();
          setUserType("student");
          setProfile(data);
          return;
        }

        console.error("Failed to resolve profile by id");
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#D7DEC3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 min-h-screen bg-[#D7DEC3] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Profile Not Found
          </h1>
          <p className="text-gray-600">Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole={session?.user?.role}>
      <div className="p-6 min-h-screen bg-[#D7DEC3]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-500">
                  {profile.name.charAt(0)}
                  {profile.surname.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.name} {profile.surname}
                </h1>
                <p className="text-lg text-gray-600">
                  {userType.charAt(0).toUpperCase() + userType.slice(1)} •{" "}
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Personal Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Full Name
                      </label>
                      <p className="text-gray-900">
                        {profile.name} {profile.surname}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <p className="text-gray-900">{profile.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Phone
                      </label>
                      <p className="text-gray-900">
                        {profile.phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Address
                      </label>
                      <p className="text-gray-900">{profile.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Additional Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Date of Birth
                      </label>
                      <p className="text-gray-900">
                        {new Date(profile.birthday).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Gender
                      </label>
                      <p className="text-gray-900 capitalize">
                        {profile.sex.toLowerCase()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Blood Type
                      </label>
                      <p className="text-gray-900">{profile.bloodType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Username
                      </label>
                      <p className="text-gray-900">{profile.username}</p>
                    </div>

                    {/* Student-specific information */}
                    {userType === "student" && (
                      <>
                        {profile.grade && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Grade
                            </label>
                            <p className="text-gray-900">
                              Grade {profile.grade.level}
                            </p>
                          </div>
                        )}
                        {profile.class && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Class Section
                            </label>
                            <p className="text-gray-900">
                              {profile.grade?.level || "N/A"}
                              {profile.class?.name || ""}
                            </p>
                          </div>
                        )}
                        {profile.parent && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Parent
                            </label>
                            <p className="text-gray-900">
                              {profile.parent.name} {profile.parent.surname}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Teacher-specific information */}
                    {userType === "teacher" && (
                      <>
                        {profile.subjects && profile.subjects.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Subjects
                            </label>
                            <p className="text-gray-900">
                              {profile.subjects.map((s) => s.name).join(", ")}
                            </p>
                          </div>
                        )}
                        {profile.classes && profile.classes.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Classes
                            </label>
                            <p className="text-gray-900">
                              {profile.classes
                                .map((c) => `${c.grade?.level || ""}${c.name}`)
                                .join(", ")}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={() => router.back()}
                className="bg-[#6B8A7A] text-white px-6 py-2 rounded-md hover:bg-[#5A7A6A] transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
