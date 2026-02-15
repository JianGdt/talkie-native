import { FastifyInstance } from "fastify";
import { UserService } from "../services/user.service";
import { ChannelService } from "../services/channel.service";

interface SearchQuery {
  q?: string;
  limit?: string;
}

interface UserParams {
  userId: string;
}

export default async function userRoutes(fastify: FastifyInstance) {
  const userService = new UserService(fastify.db);
  const channelService = new ChannelService(fastify.db);

  fastify.get<{ Querystring: SearchQuery }>(
    "/api/users/search",
    async (request, reply) => {
      try {
        const { q, limit } = request.query;

        if (!q || q.trim().length === 0) {
          return reply.send([]);
        }

        const searchLimit = parseInt(limit || "20");

        const result = await userService.searchUsers(q, searchLimit);

        return reply.send(result.rows);
      } catch (error) {
        console.error("Search error:", error);
        return reply.status(500).send({
          error: "Failed to search users",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.get<{ Params: UserParams }>(
    "/api/users/:userId",
    async (request, reply) => {
      try {
        const { userId } = request.params;

        const profile = await userService.getProfile(userId);

        if (!profile) {
          return reply.status(404).send({
            error: "User not found",
          });
        }

        return reply.send({
          id: profile.user_id,
          username: profile.username,
          fullName: profile.full_name,
          avatar: profile.avatar_url,
          bio: profile.bio,
          status: "online",
          createdAt: profile.created_at,
        });
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to fetch user profile",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.get("/api/users", async (request, reply) => {
    try {
      const profiles = await userService.getAllProfiles();

      const users = profiles.map((profile) => ({
        id: profile.user_id,
        username: profile.username,
        fullName: profile.full_name,
        avatar: profile.avatar_url,
        status: "online",
        createdAt: profile.created_at,
      }));

      return reply.send(users);
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to fetch users",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  fastify.patch<{ Params: UserParams }>(
    "/api/users/:userId",
    async (request, reply) => {
      try {
        const { userId } = request.params;
        const updates = request.body as {
          username?: string;
          full_name?: string;
          avatar_url?: string;
          bio?: string;
        };

        const updatedProfile = await userService.updateProfile(userId, updates);

        return reply.send({
          id: updatedProfile.user_id,
          username: updatedProfile.username,
          fullName: updatedProfile.full_name,
          avatar: updatedProfile.avatar_url,
          bio: updatedProfile.bio,
          updatedAt: updatedProfile.updated_at,
        });
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to update user profile",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.get<{ Params: UserParams }>(
    "/api/users/:userId/channels",
    async (request, reply) => {
      try {
        const { userId } = request.params;

        const channels = await channelService.getUserChannels(userId);

        return reply.send(channels);
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to fetch user channels",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );
}
