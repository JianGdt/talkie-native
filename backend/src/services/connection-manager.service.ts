import { ClientConnection, TransmissionState } from "../@types/message";

class ConnectionManager {
  private connections: Map<string, ClientConnection> = new Map();
  private transmissions: Map<string, TransmissionState> = new Map();

  constructor() {
    console.log("🧠 ConnectionManager instance created");
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  addConnection(userId: string, connection: ClientConnection) {
    const existing = this.connections.get(userId);

    if (existing) {
      console.log(`♻️ Replacing existing connection for ${userId}`);
      try {
        existing.ws.terminate();
      } catch {}
      this.connections.delete(userId);
    }

    this.connections.set(userId, connection);

    console.log(
      `✅ Connection added for user: ${connection.username} (${userId})`,
    );
  }

  removeConnection(userId: string) {
    const connection = this.connections.get(userId);
    if (!connection) return;

    if (connection.currentChannel) {
      this.endTransmission(connection.currentChannel, userId);
    }

    this.connections.delete(userId);

    console.log(
      `🔌 Connection removed for user: ${connection.username} (${userId})`,
    );
  }

  getConnection(userId: string): ClientConnection | undefined {
    return this.connections.get(userId);
  }

  getAllConnections(): ClientConnection[] {
    return Array.from(this.connections.values());
  }

  getConnectionsByChannel(channelId: string): ClientConnection[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.currentChannel === channelId,
    );
  }

  updateConnectionChannel(userId: string, channelId?: string) {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.currentChannel = channelId;
      console.log(`📻 User ${userId} channel updated: ${channelId || "none"}`);
    }
  }

  // ============================================
  // AUTH MANAGEMENT
  // ============================================

  markAuthenticated(userId: string, isAuthenticated: boolean) {
    const connection = this.connections.get(userId);

    console.log("🔐 markAuthenticated called:", userId, "found:", !!connection);

    if (connection) {
      connection.isAuthenticated = isAuthenticated;
      console.log(
        `✅ ${userId} authentication state →`,
        connection.isAuthenticated,
      );
    }
  }

  isAuthenticated(userId: string): boolean {
    return this.connections.get(userId)?.isAuthenticated ?? false;
  }

  // ============================================
  // TRANSMISSION MANAGEMENT
  // ============================================

  startTransmission(
    channelId: string,
    userId: string,
    username: string,
  ): boolean {
    const existing = this.transmissions.get(channelId);

    if (existing && existing.userId !== userId) {
      return false;
    }

    this.transmissions.set(channelId, {
      channelId,
      userId,
      username,
      startTime: Date.now(),
    });

    return true;
  }

  endTransmission(channelId: string, userId: string): number | null {
    const transmission = this.transmissions.get(channelId);

    if (transmission && transmission.userId === userId) {
      const duration = Date.now() - transmission.startTime;
      this.transmissions.delete(channelId);
      return duration;
    }

    return null;
  }

  getActiveTransmission(channelId: string): TransmissionState | undefined {
    return this.transmissions.get(channelId);
  }

  isTransmitting(channelId: string, userId: string): boolean {
    const transmission = this.transmissions.get(channelId);
    return transmission ? transmission.userId === userId : false;
  }

  // ============================================
  // HEARTBEAT
  // ============================================

  markAlive(userId: string) {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.isAlive = true;
    }
  }

  markDead(userId: string) {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.isAlive = false;
    }
  }

  getDeadConnections(): ClientConnection[] {
    return Array.from(this.connections.values()).filter(
      (conn) => !conn.isAlive,
    );
  }

  // ============================================
  // STATS
  // ============================================

  getStats() {
    return {
      totalConnections: this.connections.size,
      authenticatedConnections: Array.from(this.connections.values()).filter(
        (conn) => conn.isAuthenticated,
      ).length,
      activeTransmissions: this.transmissions.size,
    };
  }
}

/**
 * 🔥 Safe Singleton Pattern
 * This guarantees only ONE instance across the app.
 */
export const connectionManager = new ConnectionManager();
