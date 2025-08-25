import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedDate: string;
  itemsReported: number;
  itemsReturned: number;
  reputation: number;
  // ...added optional contact fields
  phoneNumber?: string;
  address?: {
    number: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  // extended signup signature to accept phoneNumber and address
  signup: (
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    address?: {
      number: string;
      address: string;
      postalCode: string;
      city: string;
      country: string;
    }
  ) => Promise<boolean>;
  updateUser: (userId: string, updateData: Partial<User>) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Login response data:", data);

        // Handle createdAt field that comes as [timestamp, decimal] array
        let joinedDate = new Date().toISOString().split("T")[0];
        if (data.user.createdAt && Array.isArray(data.user.createdAt)) {
          // Convert Ballerina time array to JavaScript Date
          const timestamp = data.user.createdAt[0];
          joinedDate = new Date(timestamp * 1000).toISOString().split("T")[0];
        }

        console.log(
          "👤 Using user ID from backend:",
          data.user._id || data.user.id
        );

        const loggedInUser: User = {
          id: data.user._id || data.user.id || Date.now().toString(),
          name:
            `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() ||
            "User",
          email: data.user.email,
          avatar: "👤",
          joinedDate: joinedDate,
          itemsReported: 0,
          itemsReturned: 0,
          reputation: 5.0,
          phoneNumber: data.user.phoneNumber,
          address: data.user.address,
        };

        setUser(loggedInUser);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  // Updated signup to call backend API
  const signup = async (
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    address?: {
      number: string;
      address: string;
      postalCode: string;
      city: string;
      country: string;
    }
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Split name into firstName and lastName
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      console.log("Signup payload:", {
        email,
        phoneNumber: phoneNumber || "",
        address: address || {
          number: "",
          address: "",
          postalCode: "",
          city: "",
          country: "",
        },
        password,
        firstName,
        lastName,
      });

      const response = await fetch("http://localhost:8080/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          phoneNumber: phoneNumber || "",
          address: address || {
            number: "",
            address: "",
            postalCode: "",
            city: "",
            country: "",
          },
          password,
          firstName,
          lastName,
        }),
      });

      const responseData = await response.json();
      console.log("Signup response:", responseData);

      if (response.ok && responseData.user) {
        // Handle createdAt field that comes as [timestamp, decimal] array
        let joinedDate = new Date().toISOString().split("T")[0];
        if (
          responseData.user.createdAt &&
          Array.isArray(responseData.user.createdAt)
        ) {
          // Convert Ballerina time array to JavaScript Date
          const timestamp = responseData.user.createdAt[0];
          joinedDate = new Date(timestamp * 1000).toISOString().split("T")[0];
        }

        // User created successfully - use data from backend response
        const newUser: User = {
          id:
            responseData.user._id ||
            responseData.user.id ||
            Date.now().toString(),
          name: name,
          email: responseData.user.email,
          avatar: "🆕",
          joinedDate: joinedDate,
          itemsReported: 0,
          itemsReturned: 0,
          reputation: 5.0,
          phoneNumber: responseData.user.phoneNumber,
          address: responseData.user.address,
        };

        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
        setIsLoading(false);
        return true;
      } else {
        console.error("Signup failed:", responseData);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Signup error:", error);
      setIsLoading(false);
      return false;
    }
  };

  // Update user function
  const updateUser = async (
    userId: string,
    updateData: Partial<User>
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8080/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: updateData.email,
          phoneNumber: updateData.phoneNumber,
          address: updateData.address,
          firstName: updateData.name?.split(" ")[0],
          lastName: updateData.name?.split(" ").slice(1).join(" "),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Update response data:", data);

        // Handle createdAt field that comes as [timestamp, decimal] array
        let joinedDate =
          user?.joinedDate || new Date().toISOString().split("T")[0];
        if (data.user.createdAt && Array.isArray(data.user.createdAt)) {
          // Convert Ballerina time array to JavaScript Date
          const timestamp = data.user.createdAt[0];
          joinedDate = new Date(timestamp * 1000).toISOString().split("T")[0];
        }

        // Update user with response data
        const updatedUser: User = {
          ...user!,
          id: data.user._id || data.user.id || user!.id,
          name:
            `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() ||
            updateData.name ||
            user!.name,
          email: data.user.email || updateData.email || user!.email,
          phoneNumber: data.user.phoneNumber || updateData.phoneNumber,
          address: data.user.address || updateData.address,
          joinedDate: joinedDate,
        };

        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Update error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Check if user is already logged in
  useState(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  });

  return (
    <AuthContext.Provider
      value={{ user, login, signup, updateUser, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
