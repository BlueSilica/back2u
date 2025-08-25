import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface Address {
  number: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

interface UserProfileData {
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  address?: Address;
}

const UserProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [profileData, setProfileData] = useState<UserProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: {
      number: "",
      address: "",
      postalCode: "",
      city: "",
      country: "",
    },
  });

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      const nameParts = user.name.split(" ");
      setProfileData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        address: user.address || {
          number: "",
          address: "",
          postalCode: "",
          city: "",
          country: "",
        },
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof UserProfileData, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      address: {
        ...prev.address!,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      setError("User ID not found");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Use the updateUser function from context
      const fullName = `${profileData.firstName || ""} ${
        profileData.lastName || ""
      }`.trim();
      const success = await updateUser(user.id, {
        ...profileData,
        name: fullName,
      });

      if (success) {
        setMessage("Profile updated successfully!");
        setIsEditing(false);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setError("Failed to update profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      const nameParts = user.name.split(" ");
      setProfileData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        address: user.address || {
          number: "",
          address: "",
          postalCode: "",
          city: "",
          country: "",
        },
      });
    }
    setIsEditing(false);
    setError("");
    setMessage("");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to view your profile
          </h2>
          <p className="text-gray-600">
            You need to be logged in to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.avatar}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h1>
                <p className="text-gray-600">Member since {user.joinedDate}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.firstName || ""}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your first name"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">
                  {profileData.firstName || "Not provided"}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.lastName || ""}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your last name"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">
                  {profileData.lastName || "Not provided"}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">
                  {profileData.email}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phoneNumber || ""}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your phone number"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">
                  {profileData.phoneNumber || "Not provided"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Address Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* House/Apartment Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                House/Apartment Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.address?.number || ""}
                  onChange={(e) =>
                    handleAddressChange("number", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter house/apartment number"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">
                  {profileData.address?.number || "Not provided"}
                </p>
              )}
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.address?.address || ""}
                  onChange={(e) =>
                    handleAddressChange("address", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter street address"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">
                  {profileData.address?.address || "Not provided"}
                </p>
              )}
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.address?.postalCode || ""}
                  onChange={(e) =>
                    handleAddressChange("postalCode", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter postal code"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">
                  {profileData.address?.postalCode || "Not provided"}
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.address?.city || ""}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">
                  {profileData.address?.city || "Not provided"}
                </p>
              )}
            </div>

            {/* Country */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.address?.country || ""}
                  onChange={(e) =>
                    handleAddressChange("country", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter country"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg">
                  {profileData.address?.country || "Not provided"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Account Statistics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {user.itemsReported}
              </div>
              <div className="text-sm text-gray-600">Items Reported</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {user.itemsReturned}
              </div>
              <div className="text-sm text-gray-600">Items Returned</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {user.reputation.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Reputation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
