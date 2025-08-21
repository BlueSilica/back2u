import { useState } from "react";

interface FoundItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  image?: string;
  contactInfo: string;
  userId: string;
  userAvatar: string;
  userName: string;
  timeAgo: string;
  status: "found" | "claimed" | "pending";
}

const FoundItems = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "location">(
    "newest"
  );
  const [showFilters, setShowFilters] = useState(false);

  // Dummy data for found items
  const [foundItems] = useState<FoundItem[]>([
    {
      id: "1",
      title: "Blue Backpack with Laptop",
      description:
        "Found a blue Jansport backpack containing a laptop, notebooks, and student ID near the university library entrance. Appears to belong to a computer science student.",
      category: "Bags",
      location: "University Library",
      date: "2025-08-21",
      contactInfo: "Contact to claim with proof",
      userId: "1",
      userAvatar: "👨‍💼",
      userName: "John Doe",
      timeAgo: "2 hours ago",
      status: "found",
    },
    {
      id: "2",
      title: "Silver Wedding Ring",
      description:
        'Found a beautiful silver wedding ring with diamond setting in the Central Park restroom area. Has engraving inside that reads "Forever Yours - M&K 2020".',
      category: "Jewelry",
      location: "Central Park",
      date: "2025-08-21",
      contactInfo: "Safe keeping - describe engraving to claim",
      userId: "2",
      userAvatar: "👩‍💼",
      userName: "Sarah Smith",
      timeAgo: "4 hours ago",
      status: "found",
    },
    {
      id: "3",
      title: "Brown Leather Wallet",
      description:
        "Found a brown leather wallet containing cash, credit cards, and driver license. Found on the bench outside Starbucks on Main Street.",
      category: "Personal Items",
      location: "Main Street Starbucks",
      date: "2025-08-20",
      contactInfo: "Turned in to local police station",
      userId: "3",
      userAvatar: "👨‍🎓",
      userName: "Mike Johnson",
      timeAgo: "1 day ago",
      status: "claimed",
    },
    {
      id: "4",
      title: "iPhone 13 Pro Max",
      description:
        "Found an iPhone 13 Pro Max in rose gold color with a clear case and pink popsocket. Screen has a small crack. Found in the mall food court.",
      category: "Electronics",
      location: "Downtown Mall",
      date: "2025-08-20",
      contactInfo: "Device locked - contact with proof of ownership",
      userId: "4",
      userAvatar: "👩‍🏫",
      userName: "Emily Davis",
      timeAgo: "1 day ago",
      status: "found",
    },
    {
      id: "5",
      title: "Car Keys with Honda Keychain",
      description:
        "Found a set of car keys with Honda keychain and house keys attached. Also has a small red flashlight keychain. Found in the grocery store parking lot.",
      category: "Keys",
      location: "SaveMart Parking Lot",
      date: "2025-08-19",
      contactInfo: "Meeting at safe public location only",
      userId: "5",
      userAvatar: "👨‍⚕️",
      userName: "Dr. Robert Wilson",
      timeAgo: "2 days ago",
      status: "found",
    },
    {
      id: "6",
      title: "Ray-Ban Sunglasses",
      description:
        "Found stylish Ray-Ban aviator sunglasses in excellent condition. Found on the beach near the volleyball courts. Case not included.",
      category: "Accessories",
      location: "Santa Monica Beach",
      date: "2025-08-19",
      contactInfo: "Describe exact model to claim",
      userId: "6",
      userAvatar: "👩‍🎨",
      userName: "Lisa Rodriguez",
      timeAgo: "2 days ago",
      status: "pending",
    },
    {
      id: "7",
      title: "Red Nintendo Switch",
      description:
        "Found a red Nintendo Switch console with charger and carrying case. Contains several game cartridges. Found at the bus stop near the shopping center.",
      category: "Electronics",
      location: "Metro Bus Stop #42",
      date: "2025-08-18",
      contactInfo: "Verify saved games or console serial number",
      userId: "7",
      userAvatar: "👨‍💻",
      userName: "Alex Chen",
      timeAgo: "3 days ago",
      status: "found",
    },
    {
      id: "8",
      title: "Pink Bicycle Helmet",
      description:
        "Found a pink bicycle helmet with unicorn stickers, appears to be child-sized. Found near the playground at Riverside Park.",
      category: "Sports Equipment",
      location: "Riverside Park",
      date: "2025-08-17",
      contactInfo: "Parent/guardian contact required",
      userId: "8",
      userAvatar: "👩‍🏃",
      userName: "Maria Garcia",
      timeAgo: "4 days ago",
      status: "found",
    },
  ]);

  const categories = [
    "All Categories",
    "Electronics",
    "Personal Items",
    "Bags",
    "Keys",
    "Jewelry",
    "Accessories",
    "Sports Equipment",
    "Documents",
    "Other",
  ];
  const locations = [
    "All Locations",
    "University Library",
    "Central Park",
    "Downtown Mall",
    "Main Street",
    "Santa Monica Beach",
    "Metro Bus Stop",
    "Riverside Park",
  ];

  // Filter and sort items
  const filteredItems = foundItems
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "" ||
        selectedCategory === "All Categories" ||
        item.category === selectedCategory;
      const matchesLocation =
        selectedLocation === "" ||
        selectedLocation === "All Locations" ||
        item.location.includes(selectedLocation.replace("All Locations", ""));
      return matchesSearch && matchesCategory && matchesLocation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "location":
          return a.location.localeCompare(b.location);
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "found":
        return "bg-green-100 text-green-600";
      case "claimed":
        return "bg-blue-100 text-blue-600";
      case "pending":
        return "bg-yellow-100 text-yellow-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "found":
        return "✅";
      case "claimed":
        return "🎉";
      case "pending":
        return "⏳";
      default:
        return "❓";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "found":
        return "Available";
      case "claimed":
        return "Claimed";
      case "pending":
        return "Pending";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 py-16">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Found Items
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Browse through items that have been found by our community
              members. See something that belongs to you? Contact the finder to
              claim it!
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-2xl font-bold text-green-600">
                {foundItems.filter((item) => item.status === "found").length}
              </div>
              <div className="text-sm text-gray-600">Items Available</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm text-center">
              <div className="text-3xl mb-2">🎉</div>
              <div className="text-2xl font-bold text-blue-600">
                {foundItems.filter((item) => item.status === "claimed").length}
              </div>
              <div className="text-sm text-gray-600">Items Claimed</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm text-center">
              <div className="text-3xl mb-2">🤝</div>
              <div className="text-2xl font-bold text-purple-600">
                {foundItems.length}
              </div>
              <div className="text-sm text-gray-600">Total Found</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search found items by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <span>🎛️</span> Filters
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "newest" | "oldest" | "location")
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="location">By Location</option>
              </select>
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "newest" | "oldest" | "location")
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="location">By Location</option>
              </select>
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredItems.length} of {foundItems.length} found items
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Items Found
            </h3>
            <p className="text-gray-600 mb-6">
              No items match your search criteria. Try adjusting your filters or
              search terms.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setSelectedLocation("");
              }}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{item.userAvatar}</div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {item.userName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.timeAgo}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {getStatusIcon(item.status)} {getStatusText(item.status)}
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {item.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-2">
                    <span>🏷️</span>
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span className="font-medium">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span className="font-medium">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600 mb-1">
                    How to claim:
                  </div>
                  <div className="text-sm text-gray-800 font-medium">
                    {item.contactInfo}
                  </div>
                </div>

                <div className="flex gap-3">
                  {item.status === "found" && (
                    <button className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 font-medium">
                      💬 Contact Finder
                    </button>
                  )}
                  {item.status === "claimed" && (
                    <button
                      disabled
                      className="flex-1 bg-gray-300 text-gray-500 py-3 px-4 rounded-lg cursor-not-allowed font-medium"
                    >
                      ✅ Already Claimed
                    </button>
                  )}
                  {item.status === "pending" && (
                    <button className="flex-1 bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors font-medium">
                      ⏳ Claim Pending
                    </button>
                  )}

                  <button className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                    📤 Share
                  </button>
                  <button className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                    🔖 Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-8 text-center text-white">
          <div className="text-4xl mb-4">🤝</div>
          <h3 className="text-2xl font-bold mb-2">Found Something Too?</h3>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Help reunite lost items with their owners by reporting what you've
            found. Your good deed could make someone's day!
          </p>
          <button className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            📢 Report Found Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoundItems;
