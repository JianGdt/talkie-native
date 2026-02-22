import { Pool } from "pg";
import { UserProfile } from "../@types/websocket";

const UPDATABLE_PROFILE_FIELDS: (keyof UserProfile)[] = [
  "username",
  "full_name",
  "avatar_url",
  "bio",
];

export class UserService {
  constructor(private db: Pool) {}

  async createProfile(
    userId: string,
    username: string,
    fullName?: string,
  ): Promise<UserProfile> {
    if (!this.isValidUUID(userId)) throw new Error("Invalid userId format");
    if (!username || username.trim().length < 2 || username.length > 50) {
      throw new Error("Username must be between 2 and 50 characters");
    }
    if (fullName && fullName.length > 100) {
      throw new Error("Full name must be under 100 characters");
    }

    const query = `
      INSERT INTO user_profiles (user_id, username, full_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE
        SET username = EXCLUDED.username,
            full_name = EXCLUDED.full_name,
            updated_at = NOW()
      RETURNING *
    `;

    const result = await this.db.query(query, [
      userId,
      username.trim(),
      fullName?.trim(),
    ]);
    return result.rows[0];
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!this.isValidUUID(userId)) throw new Error("Invalid userId format");

    const query = "SELECT * FROM user_profiles WHERE user_id = $1";
    const result = await this.db.query(query, [userId]);
    return result.rows[0] || null;
  }

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    if (!username || username.trim().length === 0) {
      throw new Error("Username is required");
    }

    const query = "SELECT * FROM user_profiles WHERE username = $1";
    const result = await this.db.query(query, [username.trim()]);
    return result.rows[0] || null;
  }

  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>,
  ): Promise<UserProfile> {
    if (!this.isValidUUID(userId)) throw new Error("Invalid userId format");

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // ✅ SECURITY FIX: Only allow fields in the allowlist
    // Previously, any key in `updates` was blindly added to the query
    // This prevents SQL injection via crafted field names
    for (const [key, value] of Object.entries(updates)) {
      if (UPDATABLE_PROFILE_FIELDS.includes(key as keyof UserProfile)) {
        // ✅ Validate field-level constraints
        if (key === "username") {
          if (!value || String(value).length < 2 || String(value).length > 50) {
            throw new Error("Username must be between 2 and 50 characters");
          }
        }
        if (key === "full_name" && value && String(value).length > 100) {
          throw new Error("Full name must be under 100 characters");
        }
        if (key === "bio" && value && String(value).length > 500) {
          throw new Error("Bio must be under 500 characters");
        }

        fields.push(`${key} = $${paramCount}`);
        values.push(typeof value === "string" ? value.trim() : value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error("No valid fields to update");
    }

    values.push(userId);

    const query = `
      UPDATE user_profiles
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);

    if (!result.rows[0]) {
      throw new Error("User not found");
    }

    return result.rows[0];
  }

  async getAllProfiles(): Promise<UserProfile[]> {
    // ✅ Limit the columns returned — avoid exposing sensitive internal fields
    const query = `
      SELECT user_id, username, full_name, avatar_url, bio, created_at, updated_at
      FROM user_profiles
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query);
    return result.rows;
  }

  async searchUsers(searchQuery: string, limit: number = 20) {
    // ✅ Validate and cap limit — never let client request unlimited rows
    const safeLimit = Math.min(Math.max(1, limit), 50);

    if (!searchQuery || searchQuery.trim().length === 0) {
      throw new Error("Search query is required");
    }

    // ✅ Max search length to avoid abuse
    if (searchQuery.length > 100) {
      throw new Error("Search query too long");
    }

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

    const result = await this.db.query(sql, [
      `%${searchQuery.trim()}%`,
      safeLimit,
    ]);
    return result;
  }

  private isValidUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
