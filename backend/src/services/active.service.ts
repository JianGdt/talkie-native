import { Pool } from "pg";

export class ActiveUserService {
  constructor(private db: Pool) {}

  async setUserOnline(userId: string) {
    try {
      await this.db.query(
        `INSERT INTO user_presence (user_id, status, last_seen, updated_at)
         VALUES ($1, 'online', NOW(), NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           status = 'online', 
           last_seen = NOW(), 
           updated_at = NOW()`,
        [userId],
      );
      console.log(`✅ User ${userId} is now online`);
    } catch (error) {
      console.error("Error setting user online:", error);
    }
  }

  async setUserOffline(userId: string) {
    try {
      await this.db.query(
        `INSERT INTO user_presence (user_id, status, last_seen, updated_at)
         VALUES ($1, 'offline', NOW(), NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           status = 'offline', 
           last_seen = NOW(), 
           updated_at = NOW()`,
        [userId],
      );
      console.log(`👋 User ${userId} is now offline`);
    } catch (error) {
      console.error("Error setting user offline:", error);
    }
  }

  async updateLastSeen(userId: string) {
    try {
      await this.db.query(
        `UPDATE user_presence 
         SET last_seen = NOW(), updated_at = NOW()
         WHERE user_id = $1`,
        [userId],
      );
    } catch (error) {
      console.error("Error updating last seen:", error);
    }
  }

  async getUserStatus(userId: string) {
    const result = await this.db.query(
      `SELECT status, last_seen FROM user_presence WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0] || { status: "offline", last_seen: null };
  }

  async markStaleUsersOffline() {
    try {
      const result = await this.db.query(
        `UPDATE user_presence
         SET status = 'offline', updated_at = NOW()
         WHERE status = 'online' 
           AND last_seen < NOW() - INTERVAL '5 minutes'
         RETURNING user_id`,
      );

      if (result.rows.length > 0) {
        console.log(`🔄 Marked ${result.rows.length} stale users as offline`);
      }
    } catch (error) {
      console.error("Error marking stale users offline:", error);
    }
  }
}
