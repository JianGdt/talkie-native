import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { Channel } from "../@types/message";
import { User } from "../@types/websocket";

class ChannelManager {
  private channels: Map<string, Channel> = new Map();
  private db: Pool | null = null;

  constructor() {
    console.log("🧠 ChannelManager instance created");
  }

  async initialize(db: Pool) {
    this.db = db;
    console.log("🔌 ChannelManager connected to database");
    await this.loadChannelsFromDatabase();
  }

  private async loadChannelsFromDatabase() {
    if (!this.db) {
      console.warn("⚠️ Database not connected, using default channels");
      this.initializeDefaultChannels();
      return;
    }

    try {
      const query = `
        SELECT 
          id::text as id,
          name, 
          description, 
          category,
          created_at
        FROM channels
        ORDER BY created_at ASC
      `;

      const result = await this.db.query(query);

      if (result.rows.length === 0) {
        console.log("📦 No channels in database, creating defaults...");
        await this.createDefaultChannels();
        return;
      }

      result.rows.forEach((row) => {
        const channel: Channel = {
          id: row.id,
          name: row.name,
          description: row.description,
          participants: new Map(),
          activeUsers: new Set(),
          createdAt: row.created_at,
        };
        this.channels.set(channel.id, channel);
      });

      console.log(`✅ Loaded ${result.rows.length} channels from database`);
    } catch (error) {
      console.error("❌ Failed to load channels from database:", error);
      console.log("📦 Falling back to in-memory default channels");
      this.initializeDefaultChannels();
    }
  }

  private async createDefaultChannels() {
    if (!this.db) {
      this.initializeDefaultChannels();
      return;
    }

    const defaultChannels = [
      {
        name: "General",
        description: "Main communication channel",
        category: "public",
      },
      {
        name: "Random",
        description: "Off-topic conversations",
        category: "public",
      },
      {
        name: "Announcements",
        description: "Important updates and news",
        category: "public",
      },
    ];

    try {
      for (const channelData of defaultChannels) {
        // Check if channel exists by name
        const existing = await this.db.query(
          "SELECT * FROM channels WHERE name = $1 LIMIT 1",
          [channelData.name],
        );

        let channelId: string;
        let createdAt: Date;

        if (existing.rows.length === 0) {
          // Create new channel with UUID
          channelId = uuidv4();
          const result = await this.db.query(
            `INSERT INTO channels (id, name, description, category, created_by, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             RETURNING id::text, created_at`,
            [
              channelId,
              channelData.name,
              channelData.description,
              channelData.category,
              null,
            ],
          );

          channelId = result.rows[0].id;
          createdAt = result.rows[0].created_at;

          console.log(
            `✅ Created default channel: ${channelData.name} (${channelId})`,
          );
        } else {
          // Use existing channel
          channelId = existing.rows[0].id;
          createdAt = existing.rows[0].created_at;
          console.log(
            `✅ Loaded existing channel: ${channelData.name} (${channelId})`,
          );
        }

        // Add to in-memory map
        const channel: Channel = {
          id: channelId,
          name: channelData.name,
          description: channelData.description,
          participants: new Map(),
          activeUsers: new Set(),
          createdAt: createdAt,
        };

        this.channels.set(channelId, channel);
      }

      console.log(`✅ Initialized ${defaultChannels.length} default channels`);
    } catch (error) {
      console.error(
        "⚠️ Could not initialize default channels (table may not exist yet):",
        error,
      );
      console.log("📦 Using in-memory fallback channels");
      this.initializeDefaultChannels();
    }
  }

  private initializeDefaultChannels() {
    const defaultChannels = [
      {
        id: uuidv4(),
        name: "General",
        description: "Main communication channel",
      },
      {
        id: uuidv4(),
        name: "Random",
        description: "Off-topic conversations",
      },
      {
        id: uuidv4(),
        name: "Announcements",
        description: "Important updates and news",
      },
    ];

    defaultChannels.forEach((channelData) => {
      const channel: Channel = {
        ...channelData,
        participants: new Map(),
        activeUsers: new Set(),
        createdAt: new Date(),
      };
      this.channels.set(channel.id, channel);
    });

    console.log(
      `✅ Initialized ${defaultChannels.length} default channels (in-memory fallback)`,
    );
  }

  getChannel(channelId: string): Channel | undefined {
    return this.channels.get(channelId);
  }

  getAllChannels(): any[] {
    return Array.from(this.channels.values()).map((channel) => ({
      ...channel,
      participants: Array.from(channel.participants.values()),
      activeUsers: Array.from(channel.activeUsers),
    }));
  }

  getChannelInfo(channelId: string) {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return null;
    }

    return {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      participants: Array.from(channel.participants.values()),
      activeUsers: Array.from(channel.activeUsers),
      activeCount: channel.activeUsers.size,
      createdAt: channel.createdAt,
    };
  }

  getChannelUsers(channelId: string): User[] {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return [];
    }

    return Array.from(channel.activeUsers)
      .map((userId) => channel.participants.get(userId))
      .filter((user): user is User => user !== undefined);
  }

  addUserToChannel(channelId: string, user: User): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) {
      console.error(`❌ Channel ${channelId} not found`);
      return false;
    }

    channel.participants.set(user.id, user);
    channel.activeUsers.add(user.id);

    console.log(
      `👤 ${user.username} joined channel: ${channel.name} (${channel.activeUsers.size} users)`,
    );
    return true;
  }

  removeUserFromChannel(channelId: string, userId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) {
      console.error(`❌ Channel ${channelId} not found`);
      return false;
    }

    const user = channel.participants.get(userId);
    channel.activeUsers.delete(userId);

    if (user) {
      console.log(
        `👋 ${user.username} left channel: ${channel.name} (${channel.activeUsers.size} users)`,
      );
    }

    return true;
  }

  isUserInChannel(channelId: string, userId: string): boolean {
    const channel = this.channels.get(channelId);
    return channel ? channel.activeUsers.has(userId) : false;
  }

  async reloadChannels() {
    if (!this.db) {
      console.warn("⚠️ Cannot reload: Database not connected");
      return;
    }

    // Preserve active users and participants
    const activeUsersByChannel = new Map<string, Set<string>>();
    const participantsByChannel = new Map<string, Map<string, User>>();

    this.channels.forEach((channel, channelId) => {
      activeUsersByChannel.set(channelId, new Set(channel.activeUsers));
      participantsByChannel.set(channelId, new Map(channel.participants));
    });

    // Clear and reload
    this.channels.clear();
    await this.loadChannelsFromDatabase();

    // Restore active users
    activeUsersByChannel.forEach((activeUsers, channelId) => {
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.activeUsers = activeUsers;
        channel.participants =
          participantsByChannel.get(channelId) || new Map();
      }
    });

    console.log("🔄 Reloaded channels from database");
  }

  clearActiveUsers() {
    this.channels.forEach((channel) => {
      channel.activeUsers.clear();
      channel.participants.clear();
    });
    console.log("🧹 Cleared all active users from channels");
  }
  
}

export default new ChannelManager();
