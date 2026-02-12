export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
