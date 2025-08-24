export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "moderator";
  status: "active" | "suspended" | "pending";
  joinedDate: string;
  lastActive: string;
  itemsReported: number;
  itemsReturned: number;
  reputation: number;
  avatar?: string;
}

export interface AdminItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "lost" | "found" | "matched" | "pending";
  datePosted: string;
  location: string;
  images: string[];
  reportedBy: string;
  contactInfo?: string;
}

export interface AdminReport {
  id: string;
  reportId: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  reportedUser?: {
    id: string;
    name: string;
    email: string;
  };
  reportedItem?: {
    id: string;
    title: string;
  };
  reason: string;
  description: string;
  status: "open" | "reviewed" | "resolved" | "dismissed";
  createdAt: string;
  resolvedAt?: string;
}

export interface DashboardStats {
  totalItems: number;
  totalUsers: number;
  totalMatches: number;
  pendingReports: number;
  recentActivity: Array<{
    id: string;
    type: "item_posted" | "item_matched" | "user_joined" | "report_filed";
    description: string;
    timestamp: string;
    user: string;
  }>;
}
