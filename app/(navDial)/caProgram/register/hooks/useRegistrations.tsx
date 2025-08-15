import { useCallback } from "react";
import { useTransitionRouter } from "next-view-transitions";
import { toast } from "sonner";
import { CARegisterFormData } from "@/app/schemas/CARegisterSchema"; 
import { registerCAUser } from "../services/registrationService"; 
import { slideInOut } from "@/app/animations/pageTrans";

export const useCARegistration = (reset: () => void) => {
  const router = useTransitionRouter();

  const handleRegistration = useCallback(
    async (data: CARegisterFormData) => {
      console.log("🚀 Submitting CA Registration:", data);
      const result = await registerCAUser(data);
      
      if (result.success) {
        console.log("✅ CA Registration successful:", result.data);
        reset();
        toast.success(result.message);
        
        setTimeout(() => {
          router.push("/", { onTransitionReady: slideInOut });
        }, 2000);
      } else {
        toast.error(result.message);
      }
    },
    [reset, router]
  );

  return { handleRegistration };
};