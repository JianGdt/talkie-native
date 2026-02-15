import { Pool } from "pg";

export class ConversationService {
  constructor(private db: Pool) {}
  async getUserConversations(userId: string) {
    const query = `
      SELECT 
        c.id,
        c.type,
        c.name,
        c.created_at,
        c.updated_at,
        -- Get participants (excluding current user for DMs)
        COALESCE(
          json_agg(
            json_build_object(
              'id', up.user_id,
              'name', up.username,
              'avatar', up.avatar_url,
              'status', 'online'
            )
            ORDER BY up.username
          ) FILTER (WHERE up.user_id IS NOT NULL AND up.user_id != $1),
          '[]'
        ) as participants,
        (
          SELECT json_build_object(
            'content', m.content,
            'sender', sender.username,
            'timestamp', EXTRACT(EPOCH FROM m.created_at) * 1000,
            'isRead', CASE 
              WHEN m.sender_id = $1 THEN true
              WHEN cp.last_read_at >= m.created_at THEN true
              ELSE false
            END
          )
          FROM messages m
          JOIN user_profiles sender ON m.sender_id = sender.user_id
          LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        -- Get unread count
        (
          SELECT COUNT(*)::int
          FROM messages m
          LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
          WHERE m.conversation_id = c.id
            AND m.sender_id != $1
            AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
        ) as unread_count,
        cp.is_pinned,
        cp.is_muted
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      LEFT JOIN conversation_participants other_cp ON c.id = other_cp.conversation_id
      LEFT JOIN user_profiles up ON other_cp.user_id = up.user_id
      WHERE cp.user_id = $1
      GROUP BY c.id, c.type, c.name, c.created_at, c.updated_at, cp.is_pinned, cp.is_muted, cp.last_read_at
      ORDER BY 
        cp.is_pinned DESC,
        (
          SELECT m.created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) DESC NULLS LAST
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  async createDirectMessage(userId: string, otherUserId: string) {
    const existingQuery = `
      SELECT c.id
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
      WHERE c.type = 'direct'
        AND cp1.user_id = $1
        AND cp2.user_id = $2
      LIMIT 1
    `;

    const existing = await this.db.query(existingQuery, [userId, otherUserId]);

    if (existing.rows.length > 0) {
      return {
        conversationId: existing.rows[0].id,
        isNew: false,
      };
    }

    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      const createConvQuery = `
        INSERT INTO conversations (type)
        VALUES ('direct')
        RETURNING id
      `;

      const newConv = await client.query(createConvQuery);
      const conversationId = newConv.rows[0].id;

      const addParticipantsQuery = `
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES ($1, $2), ($1, $3)
      `;

      await client.query(addParticipantsQuery, [
        conversationId,
        userId,
        otherUserId,
      ]);

      await client.query("COMMIT");

      return {
        conversationId,
        isNew: true,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async createGroup(userId: string, name: string, participantIds: string[]) {
    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      const createQuery = `
        INSERT INTO conversations (type, name)
        VALUES ('group', $1)
        RETURNING id
      `;

      const result = await client.query(createQuery, [name]);
      const conversationId = result.rows[0].id;

      const allParticipants = [userId, ...participantIds];
      const values = allParticipants
        .map((_, i) => `($1, $${i + 2})`)
        .join(", ");

      const addParticipantsQuery = `
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES ${values}
      `;

      await client.query(addParticipantsQuery, [
        conversationId,
        ...allParticipants,
      ]);

      await client.query("COMMIT");

      return {
        conversationId,
        name,
        participantCount: allParticipants.length,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    before: number | null = null,
  ) {
    const query = `
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.created_at,
        up.username as sender_username,
        up.avatar_url as sender_avatar,
        EXTRACT(EPOCH FROM m.created_at) * 1000 as timestamp
      FROM messages m
      JOIN user_profiles up ON m.sender_id = up.user_id
      WHERE m.conversation_id = $1
        ${before ? "AND EXTRACT(EPOCH FROM m.created_at) * 1000 < $3" : ""}
      ORDER BY m.created_at DESC
      LIMIT $2
    `;

    const params = before
      ? [conversationId, limit, before]
      : [conversationId, limit];

    const result = await this.db.query(query, params);

    return result.rows.reverse();
  }

  async saveMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: string = "text",
  ) {
    const query = `
      INSERT INTO messages (conversation_id, sender_id, content, message_type)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at, EXTRACT(EPOCH FROM created_at) * 1000 as timestamp
    `;

    const result = await this.db.query(query, [
      conversationId,
      senderId,
      content,
      messageType,
    ]);

    await this.db.query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
      [conversationId],
    );

    return result.rows[0];
  }

  async markAsRead(conversationId: string, userId: string) {
    const query = `
      UPDATE conversation_participants
      SET last_read_at = NOW()
      WHERE conversation_id = $1 AND user_id = $2
    `;

    await this.db.query(query, [conversationId, userId]);
  }

  async togglePin(conversationId: string, userId: string, isPinned: boolean) {
    const query = `
      UPDATE conversation_participants
      SET is_pinned = $3
      WHERE conversation_id = $1 AND user_id = $2
    `;

    await this.db.query(query, [conversationId, userId, isPinned]);
  }

  async toggleMute(conversationId: string, userId: string, isMuted: boolean) {
    const query = `
      UPDATE conversation_participants
      SET is_muted = $3
      WHERE conversation_id = $1 AND user_id = $2
    `;

    await this.db.query(query, [conversationId, userId, isMuted]);
  }

  async getParticipants(conversationId: string) {
    const query = `
      SELECT 
        up.user_id as id,
        up.username as name,
        up.avatar_url as avatar,
        'online' as status
      FROM conversation_participants cp
      JOIN user_profiles up ON cp.user_id = up.user_id
      WHERE cp.conversation_id = $1
      ORDER BY up.username
    `;

    const result = await this.db.query(query, [conversationId]);
    return result.rows;
  }
}
