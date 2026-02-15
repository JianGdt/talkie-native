import { Pool } from "pg";
import { UserProfile } from "../@types/websocket";

export class UserService {
  constructor(private db: Pool) {}

  async createProfile(
    userId: string,
    username: string,
    fullName?: string,
  ): Promise<UserProfile> {
    const query = `
      INSERT INTO user_profiles (user_id, username, full_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE
        SET username = EXCLUDED.username,
            full_name = EXCLUDED.full_name,
            updated_at = NOW()
      RETURNING *
    `;

    const result = await this.db.query(query, [userId, username, fullName]);
    return result.rows[0];
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const query = "SELECT * FROM user_profiles WHERE user_id = $1";
    const result = await this.db.query(query, [userId]);
    return result.rows[0] || null;
  }

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    const query = "SELECT * FROM user_profiles WHERE username = $1";
    const result = await this.db.query(query, [username]);
    return result.rows[0] || null;
  }

  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>,
  ): Promise<UserProfile> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id" && key !== "user_id" && key !== "created_at") {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    values.push(userId);

    const query = `
      UPDATE user_profiles
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getAllProfiles(): Promise<UserProfile[]> {
    const query = "SELECT * FROM user_profiles ORDER BY created_at DESC";
    const result = await this.db.query(query);
    return result.rows;
  }

  async searchUsers(query: string, limit: number = 20) {
    const sql = `
    SELECT 
      up.user_id as id,
      up.username as name,
      up.full_name,
      up.avatar_url as avatar,
      au.email,
      COALESCE(pr.status, 'offline') as status,
      pr.last_seen
    FROM user_profiles up
    LEFT JOIN auth.users au ON au.id = up.user_id
    LEFT JOIN user_presence pr ON pr.user_id = up.user_id
    WHERE 
      up.username ILIKE $1 
      OR up.full_name ILIKE $1
      OR au.email ILIKE $1
    ORDER BY 
      CASE 
        WHEN pr.status = 'online' THEN 1
        WHEN pr.status = 'away' THEN 2
        ELSE 3
      END,
      up.username
    LIMIT $2
  `;

    const result = await this.db.query(sql, [`%${query}%`, limit]);
    return result;
  }
}
