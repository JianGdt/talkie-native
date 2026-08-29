import { Pool } from "pg";
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
      console.warn("⚠️ Database not connected, channels unavailable");
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
        console.log("📦 No channels in database");
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
      this.channels.clear();
    }
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

    const activeUsersByChannel = new Map<string, Set<string>>();
    const participantsByChannel = new Map<string, Map<string, User>>();

    this.channels.forEach((channel, channelId) => {
      activeUsersByChannel.set(channelId, new Set(channel.activeUsers));
      participantsByChannel.set(channelId, new Map(channel.participants));
    });

    this.channels.clear();
    await this.loadChannelsFromDatabase();

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
