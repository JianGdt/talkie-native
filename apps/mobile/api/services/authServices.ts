import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";

export const authService = {
  forgotPassword: (email: string, redirectTo?: string) =>
    apiClient.publicPost<{ success: boolean }>(API_ENDPOINTS.FORGOT_PASSWORD, {
      email,
      redirectTo,
    }),

  resetPassword: (password: string) =>
    apiClient.post<{ success: boolean }>(API_ENDPOINTS.RESET_PASSWORD, {
      password,
    }),
};
