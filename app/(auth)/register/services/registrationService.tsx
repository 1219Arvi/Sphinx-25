import { RegisterFormData } from "../types/registrations";
import { getAuthToken } from "@/app/hooks/useUser/utils/helperFunctions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const token = getAuthToken();

export interface RegistrationResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const registerUser = async (
  data: RegisterFormData
): Promise<RegistrationResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ||
          `Registration failed with status ${response.status}`
      );
    }

    const result = await response.json();
    return {
      success: true,
      message: "Registration successful!",
      data: result,
    };
  } catch (error) {
    console.error("❌ Registration error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.",
    };
  }
};
