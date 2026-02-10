import { FastifyInstance } from "fastify";
import { verifyAuth } from "../middleware/verifyAuth";
import { z } from "zod";
import { UserService } from "../services/user-service";

const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  fullName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

export async function userRoutes(fastify: FastifyInstance) {
  const userService = new UserService(fastify.db);

  // Get current user profile
  fastify.get(
    "/users/me",
    {
      preHandler: verifyAuth,
    },
    async (request, reply) => {
      try {
        const profile = await userService.getProfile(request.user!.id);

        if (!profile) {
          return reply.status(404).send({ error: "Profile not found" });
        }

        return reply.send({ profile });
      } catch (error: any) {
        console.error("Get profile error:", error);
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  fastify.patch(
    "/users/me",
    {
      preHandler: verifyAuth,
    },
    async (request, reply) => {
      try {
        const body = updateProfileSchema.parse(request.body);

        if (body.username) {
          const existingProfile = await userService.getProfileByUsername(
            body.username,
          );
          if (existingProfile && existingProfile.user_id !== request.user!.id) {
            return reply.status(400).send({ error: "Username already taken" });
          }
        }

        const updates: any = {};
        if (body.username) updates.username = body.username;
        if (body.fullName !== undefined) updates.full_name = body.fullName;
        if (body.avatarUrl !== undefined) updates.avatar_url = body.avatarUrl;
        if (body.bio !== undefined) updates.bio = body.bio;

        const profile = await userService.updateProfile(
          request.user!.id,
          updates,
        );

        return reply.send({ profile });
      } catch (error: any) {
        console.error("Update profile error:", error);
        return reply.status(400).send({ error: error.message });
      }
    },
  );

  // Get user by ID
  fastify.get("/users/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const profile = await userService.getProfile(userId);

      if (!profile) {
        return reply.status(404).send({ error: "User not found" });
      }

      return reply.send({ profile });
    } catch (error: any) {
      console.error("Get user error:", error);
      return reply.status(500).send({ error: error.message });
    }
  });

  // fetch or get all the users
  fastify.get("/users", async (request, reply) => {
    try {
      const profiles = await userService.getAllProfiles();
      return reply.send({ profiles });
    } catch (error: any) {
      console.error("Get users error:", error);
      return reply.status(500).send({ error: error.message });
    }
  });
}
