"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../View/components/ProtectedRoute";

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
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;

      try {
        const role = session.user.role.toLowerCase();
        console.log("Fetching profile for:", {
          userId: session.user.id,
          username: session.user.username,
          role: role,
          url: `/api/${role}s/${session.user.id}`,
        });

        const response = await fetch(`/api/${role}s/${session.user.id}`);

        if (response.ok) {
          const data = await response.json();
          console.log("Profile data received:", data);
          setProfile(data);
        } else if (response.status === 404) {
          // Handle case where profile doesn't exist yet
          console.log(
            "Profile not found - user may need to complete profile setup"
          );
        } else {
          console.error(
            "Failed to fetch profile:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session]);

  const handleEdit = () => {
    setEditData(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData(null);
    setIsEditing(false);
  };

  const validateForm = () => {
    if (!editData) return false;

    // Check required fields
    if (!editData.name.trim()) {
      alert("First name is required");
      return false;
    }
    if (!editData.surname.trim()) {
      alert("Last name is required");
      return false;
    }
    if (!editData.email.trim()) {
      alert("Email is required");
      return false;
    }
    if (!editData.address.trim()) {
      alert("Address is required");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editData.email)) {
      alert("Please enter a valid email address");
      return false;
    }

    // Validate phone format (if provided)
    if (editData.phone && editData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(editData.phone.replace(/\s/g, ""))) {
        alert("Please enter a valid phone number");
        return false;
      }
    }

    // Validate birthday
    const birthDate = new Date(editData.birthday);
    const today = new Date();
    if (birthDate >= today) {
      alert("Birthday must be in the past");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!editData || !session?.user?.id) return;

    // Validate form before submitting
    if (!validateForm()) return;

    setSaving(true);
    try {
      const role = session.user.role.toLowerCase();
      const response = await fetch(`/api/${role}s/${session.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editData.name.trim(),
          surname: editData.surname.trim(),
          email: editData.email.trim(),
          phone: editData.phone?.trim() || null,
          address: editData.address.trim(),
          birthday: editData.birthday,
          sex: editData.sex,
          bloodType: editData.bloodType,
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        setEditData(null);
        alert("Profile updated successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (editData) {
      setEditData({
        ...editData,
        [field]: value,
      });
    }
  };

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
            No profile found
          </h1>
          <p className="text-gray-600 mb-4">
            Your account is created but your{" "}
            {session?.user?.role?.toLowerCase()} profile hasn’t been set up yet.
          </p>
          <button
            onClick={() => router.push("/Dashboard")}
            className="px-4 py-2 rounded-md bg-[#6B8A7A] text-white hover:bg-[#5A7A6A]"
          >
            Back to Dashboard
          </button>
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
                  {session?.user?.role} • {profile.email}
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
                        First Name{" "}
                        {isEditing && <span className="text-red-500">*</span>}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData?.name || ""}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#6B8A7A] focus:border-[#6B8A7A]"
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profile.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Last Name{" "}
                        {isEditing && <span className="text-red-500">*</span>}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData?.surname || ""}
                          onChange={(e) =>
                            handleInputChange("surname", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#6B8A7A] focus:border-[#6B8A7A]"
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profile.surname}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Email{" "}
                        {isEditing && <span className="text-red-500">*</span>}
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editData?.email || ""}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#6B8A7A] focus:border-[#6B8A7A]"
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profile.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Phone
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData?.phone || ""}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#6B8A7A] focus:border-[#6B8A7A]"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profile.phone || "Not provided"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Address{" "}
                        {isEditing && <span className="text-red-500">*</span>}
                      </label>
                      {isEditing ? (
                        <textarea
                          value={editData?.address || ""}
                          onChange={(e) =>
                            handleInputChange("address", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#6B8A7A] focus:border-[#6B8A7A]"
                          rows={2}
                          required
                        />
                      ) : (
                        <p className="text-gray-900">{profile.address}</p>
                      )}
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
                      {isEditing ? (
                        <input
                          type="date"
                          value={
                            editData?.birthday
                              ? editData.birthday.split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleInputChange("birthday", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#6B8A7A] focus:border-[#6B8A7A]"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {new Date(profile.birthday).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Gender
                      </label>
                      {isEditing ? (
                        <select
                          value={editData?.sex || ""}
                          onChange={(e) =>
                            handleInputChange("sex", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#6B8A7A] focus:border-[#6B8A7A]"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 capitalize">
                          {profile.sex.toLowerCase()}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Blood Type
                      </label>
                      {isEditing ? (
                        <select
                          value={editData?.bloodType || ""}
                          onChange={(e) =>
                            handleInputChange("bloodType", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#6B8A7A] focus:border-[#6B8A7A]"
                        >
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
                        <p className="text-gray-900">{profile.bloodType}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Username
                      </label>
                      <p className="text-gray-900">{profile.username}</p>
                      <p className="text-xs text-gray-500">
                        Username cannot be changed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-[#6B8A7A] text-white px-6 py-2 rounded-md hover:bg-[#5A7A6A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="bg-[#6B8A7A] text-white px-6 py-2 rounded-md hover:bg-[#5A7A6A] transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
                <button
                  onClick={() => router.back()}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
