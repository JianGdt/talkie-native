import { Channel } from "../@types/message";

/**
 * Channel Manager
 *
 * Manages channels (rooms) for the walkie-talkie app
 *
 * Responsibilities:
 * - Initialize default channels
 * - Track channel participants
 * - Manage user joins/leaves
 * - Provide channel information
 */
class ChannelManager {
  private channels: Map<string, Channel> = new Map();

  constructor() {
    this.initializeDefaultChannels();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize default channels on server start
   */
  private initializeDefaultChannels() {
    const defaultChannels = [
      {
        id: "1",
        name: "General",
        description: "Main communication channel",
      },
      {
        id: "2",
        name: "Team Alpha",
        description: "Team coordination channel",
      },
      {
        id: "3",
        name: "Emergency",
        description: "Emergency communications only",
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

    console.log(`✅ Initialized ${defaultChannels.length} default channels`);
  }

  // ============================================
  // CHANNEL QUERIES
  // ============================================

  /**
   * Get a specific channel by ID
   */
  getChannel(channelId: string): Channel | undefined {
    return this.channels.get(channelId);
  }

  /**
   * Get all channels with serialized data
   */
  getAllChannels(): any[] {
    return Array.from(this.channels.values()).map((channel) => ({
      ...channel,
      participants: Array.from(channel.participants.values()),
      activeUsers: Array.from(channel.activeUsers),
    }));
  }

  /**
   * Get detailed channel information
   */
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

  /**
   * Get all users in a channel
   */
  getChannelUsers(channelId: string): User[] {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return [];
    }

    return Array.from(channel.activeUsers)
      .map((userId) => channel.participants.get(userId))
      .filter((user): user is User => user !== undefined);
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * Add a user to a channel
   *
   * @returns true if successful, false if channel doesn't exist
   */
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

  /**
   * Remove a user from a channel
   *
   * @returns true if successful, false if channel doesn't exist
   */
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

  /**
   * Check if a user is in a specific channel
   */
  isUserInChannel(channelId: string, userId: string): boolean {
    const channel = this.channels.get(channelId);
    return channel ? channel.activeUsers.has(userId) : false;
  }

  // ============================================
  // CHANNEL CREATION/DELETION
  // ============================================

  /**
   * Create a new channel
   */
  createChannel(name: string, description?: string): Channel {
    const id = `channel_${Date.now()}`;
    const channel: Channel = {
      id,
      name,
      description,
      participants: new Map(),
      activeUsers: new Set(),
      createdAt: new Date(),
    };

    this.channels.set(id, channel);
    console.log(`📻 Created new channel: ${name} (${id})`);

    return channel;
  }

  /**
   * Delete a channel
   *
   * @returns true if deleted, false if doesn't exist
   */
  deleteChannel(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (channel) {
      console.log(`🗑️ Deleted channel: ${channel.name} (${channelId})`);
      return this.channels.delete(channelId);
    }
    return false;
  }
}

export default new ChannelManager();
