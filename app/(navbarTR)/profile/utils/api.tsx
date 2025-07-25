import { toast } from "sonner";
import { useTransitionRouter } from "next-view-transitions";
import { slideInOut } from "@/app/animations/pageTrans";
import { ProfileResponse } from "../types/profileTypes";
import { canMakeRequest, incrementRequestCount } from "./requestTracker";
import { clearAuthData } from "./auth";
import { ProfileData } from "@/app/schemas/profileSchema";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const fetchProfileData = async (
  token: string
): Promise<ProfileData> => {
  console.log("📦 Fetching profile data...");

  if (!canMakeRequest()) {
    throw new Error("Request limit exceeded. Please wait before trying again.");
  }

  incrementRequestCount();

  try {
    const response = await fetch(`${API_BASE_URL}/user/info`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.error("❌ Server returned non-JSON response:", response.status);
      throw new Error(`Server returned non-JSON response: ${response.status}`);
    }

    const result: ProfileResponse = await response.json();
    console.log("🧾 Raw server response:", result);

    if (!response.ok) {
      console.error("❌ Profile fetch failed:", result);
      throw new Error(
        result.error ||
          result.message ||
          `HTTP error! status: ${response.status}`
      );
    }

    console.log("✅ Profile data fetched successfully");
    console.log(result.user);
    return result.user;
  } catch (error) {
    console.error("🚨 Profile fetch error:", error);

    if (
      error instanceof SyntaxError &&
      error.message.includes("Unexpected token")
    ) {
      throw new Error(
        "Server returned invalid response. Please check if the profile endpoint exists."
      );
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }

    throw error;
  }
};

export const handleApiError = (
  error: Error,
  router: ReturnType<typeof useTransitionRouter>,
  refreshUserData: () => void,
  isRefresh: boolean = false
): boolean => {
  const message = error.message;
  console.error("🚨 API Error:", message);

  if (message.includes("401") || message.includes("Unauthorized")) {
    toast.error("Session expired. Please log in again.");
    clearAuthData();
    refreshUserData();
    setTimeout(() => {
      router.push("/login", { onTransitionReady: slideInOut });
    }, 1000);
    return true;
  } else if (message.includes("403") || message.includes("Forbidden")) {
    toast.error("Access denied. Please check your permissions.");
    return true;
  } else if (message.includes("Request limit exceeded")) {
    toast.error("Too many requests. Please wait before trying again.");
    return true;
  } else if (message.includes("404") || message.includes("Not Found")) {
    toast.error("Profile not found. Please contact support.");
    return true;
  } else if (message.includes("429") || message.includes("Too Many Requests")) {
    toast.error("Too many requests. Please wait a moment and try again.");
    return true;
  } else if (
    message.includes("500") ||
    message.includes("Internal Server Error")
  ) {
    toast.error("Server error. Please try again later.");
  } else if (
    message.includes("503") ||
    message.includes("Service Unavailable")
  ) {
    toast.error("Service temporarily unavailable. Please try again later.");
  } else if (
    message.includes("non-JSON response") ||
    message.includes("invalid response")
  ) {
    toast.error("Server configuration error. Please try again later.");
  } else if (message.includes("Network error") || message.includes("fetch")) {
    toast.error("Network error. Please check your connection and try again.");
  } else {
    const errorMsg = isRefresh
      ? "Failed to refresh profile."
      : "Failed to load profile.";
    toast.error(message || `${errorMsg} Please try again.`);
  }

  return false; // Continue retrying for non-auth errors
};
