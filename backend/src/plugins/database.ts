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
    console.log("✅ Database connected successfully");
    const result = await client.query("SELECT NOW()");
    console.log("✅ Database query test successful:", result.rows[0].now);
    client.release();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    console.error(
      "Connection string (sanitized):",
      env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@"),
    );
    throw error; // Fail fast if database connection fails
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
