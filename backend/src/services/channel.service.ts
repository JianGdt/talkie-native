import { Pool } from "pg";

export class ChannelService {
  constructor(private db: Pool) {}

  async getAllChannels() {
    const query = `
    SELECT 
      c.id,
      c.name,
      c.description,
      c.category,
      c.created_at,
      c.updated_at,
      COUNT(DISTINCT cm.user_id)::int as member_count,
      COALESCE(
        json_agg(
          json_build_object(
            'id', up.user_id,
            'username', up.username,
            'avatar', up.avatar_url
          )
          ORDER BY cm.joined_at DESC
        ) FILTER (WHERE cm.user_id IS NOT NULL),
        '[]'
      ) as active_users
    FROM channels c
    LEFT JOIN channel_members cm ON c.id = cm.channel_id
    LEFT JOIN user_profiles up ON cm.user_id = up.user_id
    GROUP BY c.id, c.name, c.description, c.category, c.created_at, c.updated_at
    ORDER BY c.created_at DESC
  `;

    const result = await this.db.query(query);
    return result.rows;
  }

  async getChannel(channelId: string) {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.category,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT cm.user_id)::int as member_count,
        COALESCE(
          json_agg(
            json_build_object(
              'id', up.user_id,
              'username', up.username,
              'avatar', up.avatar_url
            )
            ORDER BY cm.joined_at DESC
          ) FILTER (WHERE cm.user_id IS NOT NULL),
          '[]'
        ) as active_users
      FROM channels c
      LEFT JOIN channel_members cm ON c.id = cm.channel_id
      LEFT JOIN user_profiles up ON cm.user_id = up.user_id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.description, c.category, c.created_at, c.updated_at
    `;

    const result = await this.db.query(query, [channelId]);
    return result.rows[0] || null;
  }

  async createChannel(
    name: string,
    description?: string,
    category: "public" | "private" | "team" = "public",
  ) {
    const query = `
      INSERT INTO channels (name, description, category)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, category, created_at, updated_at
    `;

    const result = await this.db.query(query, [name, description, category]);
    return result.rows[0];
  }

  async updateChannel(
    channelId: string,
    updates: {
      name?: string;
      description?: string;
      category?: "public" | "private" | "team";
    },
  ) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(updates.name);
      paramCount++;
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(updates.description);
      paramCount++;
    }

    if (updates.category !== undefined) {
      fields.push(`category = $${paramCount}`);
      values.push(updates.category);
      paramCount++;
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(channelId);

    const query = `
      UPDATE channels
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, name, description, category, created_at, updated_at
    `;

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  async deleteChannel(channelId: string) {
    const query = `DELETE FROM channels WHERE id = $1`;
    await this.db.query(query, [channelId]);
  }

  async getChannelMessages(
    channelId: string,
    limit: number = 50,
    before: number | null = null,
  ) {
    const query = `
      SELECT 
        m.id,
        m.channel_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.created_at,
        up.username as sender_username,
        up.avatar_url as sender_avatar,
        EXTRACT(EPOCH FROM m.created_at) * 1000 as timestamp
      FROM messages m
      JOIN user_profiles up ON m.sender_id = up.user_id
      WHERE m.channel_id = $1
        ${before ? "AND EXTRACT(EPOCH FROM m.created_at) * 1000 < $3" : ""}
      ORDER BY m.created_at DESC
      LIMIT $2
    `;

    const params = before ? [channelId, limit, before] : [channelId, limit];

    const result = await this.db.query(query, params);

    return result.rows.reverse();
  }

  async saveMessage(
    channelId: string,
    senderId: string,
    content: string,
    messageType: string = "text",
  ) {
    const query = `
    INSERT INTO messages (channel_id, sender_id, content, message_type)
    VALUES ($1::uuid, $2::uuid, $3, $4)
    RETURNING id, created_at, EXTRACT(EPOCH FROM created_at) * 1000 as timestamp
  `;

    const result = await this.db.query(query, [
      channelId,
      senderId,
      content,
      messageType,
    ]);

    return result.rows[0];
  }

  async addMember(channelId: string, userId: string) {
    const query = `
    INSERT INTO channel_members (channel_id, user_id)
    VALUES ($1::uuid, $2::uuid)
    ON CONFLICT (channel_id, user_id) DO NOTHING
    RETURNING id
  `;

    const result = await this.db.query(query, [channelId, userId]);
    return result.rows[0];
  }

  async removeMember(channelId: string, userId: string) {
    const query = `
      DELETE FROM channel_members
      WHERE channel_id = $1 AND user_id = $2
    `;

    await this.db.query(query, [channelId, userId]);
  }

  async getChannelMembers(channelId: string) {
    const query = `
      SELECT 
        up.user_id as id,
        up.username as name,
        up.avatar_url as avatar,
        cm.joined_at,
        'online' as status
      FROM channel_members cm
      JOIN user_profiles up ON cm.user_id = up.user_id
      WHERE cm.channel_id = $1
      ORDER BY cm.joined_at DESC
    `;

    const result = await this.db.query(query, [channelId]);
    return result.rows;
  }

  async isMember(channelId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1
      FROM channel_members
      WHERE channel_id = $1 AND user_id = $2
      LIMIT 1
    `;

    const result = await this.db.query(query, [channelId, userId]);
    return result.rows.length > 0;
  }

  async getUserChannels(userId: string) {
    const query = `
    SELECT 
      c.id,
      c.name,
      c.description,
      c.category,
      c.created_at,
      c.updated_at,
      my_membership.joined_at as user_joined_at,
      COUNT(DISTINCT cm.user_id)::int as member_count,
      COALESCE(
        json_agg(
          json_build_object(
            'id', up.user_id,
            'username', up.username,
            'avatar', up.avatar_url
          )
          ORDER BY cm.joined_at DESC
        ) FILTER (WHERE cm.user_id IS NOT NULL),
        '[]'
      ) as active_users
    FROM channels c
    JOIN channel_members my_membership ON c.id = my_membership.channel_id AND my_membership.user_id = $1
    LEFT JOIN channel_members cm ON c.id = cm.channel_id
    LEFT JOIN user_profiles up ON cm.user_id = up.user_id
    GROUP BY c.id, c.name, c.description, c.category, c.created_at, c.updated_at, my_membership.joined_at
    ORDER BY my_membership.joined_at DESC
  `;

    const result = await this.db.query(query, [userId]);
    return result.rows;
  }
}
