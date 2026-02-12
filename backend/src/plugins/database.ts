import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { Pool } from "pg";
import { env } from "../config/env";

async function databasePlugin(fastify: FastifyInstance) {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log("Database connected successfully");
    const result = await client.query("SELECT NOW()");
    console.log("✅ Database query test successful:", result.rows[0].now);

    // Initialize default channels (with error handling)
    try {
      await client.query(`
        INSERT INTO channels (id, name, description, created_at)
        VALUES 
          ('general', 'General', 'General discussion', NOW()),
          ('random', 'Random', 'Random chat', NOW()),
          ('tech', 'Tech', 'Technology discussion', NOW())
        ON CONFLICT (id) DO NOTHING;
      `);

      const channelCount = await client.query("SELECT COUNT(*) FROM channels");
      console.log(
        `✅ Initialized ${channelCount.rows[0].count} default channels`,
      );
    } catch (initError) {
      console.warn(
        "⚠️ Could not initialize default channels (table may not exist yet):",
        initError,
      );
      // Don't throw - allow app to start even if channels table doesn't exist
    }

    client.release();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    console.error(
      "Connection string (sanitized):",
      env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@"),
    );

    (fastify as any).dbConnected = false;
  }

  fastify.decorate("db", pool);
  fastify.addHook("onClose", async () => {
    try {
      await pool.end();
      console.log("🔌 Database connection pool closed");
    } catch (error) {
      console.error("Error closing database pool:", error);
    }
  });
}

export default fp(databasePlugin);

declare module "fastify" {
  interface FastifyInstance {
    db: Pool;
  }
}
