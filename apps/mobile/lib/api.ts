const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export async function pingBackend() {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}

export const api = {
  async register(email: string, password: string, username: string) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    });
    return response.json();
  },

  async getProfile(token: string) {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};
