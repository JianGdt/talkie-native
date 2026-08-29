import { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabase, supabaseAdmin } from "../config/supabase";
import { UserService } from "../services/user.service";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(20),
  fullName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url().optional(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6),
});

export async function authRoutes(fastify: FastifyInstance) {
  const userService = new UserService(fastify.db);

  // Register
  fastify.post("/auth/register", async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);

      // Check if username already exists
      const existingProfile = await userService.getProfileByUsername(
        body.username,
      );
      if (existingProfile) {
        return reply.status(400).send({ error: "Username already taken" });
      }

      // Create auth user in Supabase
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true, // Auto-confirm for development
          user_metadata: {
            username: body.username,
            full_name: body.fullName,
          },
        });

      if (authError) {
        return reply.status(400).send({ error: authError.message });
      }

      // Create user profile in database
      const profile = await userService.createProfile(
        authData.user.id,
        body.username,
        body.fullName,
      );

      return reply.status(201).send({
        message: "User registered successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          profile,
        },
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      return reply.status(400).send({ error: error.message });
    }
  });

  // Login (handled by Supabase client, but we can add logging here)
  fastify.post("/auth/login", async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });

      if (error) {
        return reply.status(401).send({ error: error.message });
      }

      // Get user profile
      const profile = await userService.getProfile(data.user.id);

      return reply.send({
        session: data.session,
        user: {
          ...data.user,
          profile,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post("/auth/forgot-password", async (request, reply) => {
    try {
      const body = forgotPasswordSchema.parse(request.body);
      const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
        redirectTo: body.redirectTo,
      });

      if (error) return reply.status(400).send({ error: error.message });
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post("/auth/reset-password", async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply.status(401).send({ error: "Missing authorization header" });
      }

      const body = resetPasswordSchema.parse(request.body);
      const token = authHeader.substring(7);
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return reply.status(401).send({ error: "Invalid recovery token" });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: body.password,
      });
      if (updateError) {
        return reply.status(400).send({ error: updateError.message });
      }

      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Verify token
  fastify.get("/auth/verify", async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return reply
          .status(401)
          .send({ error: "Missing authorization header" });
      }

      const token = authHeader.substring(7);

      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return reply.status(401).send({ error: "Invalid token" });
      }

      const profile = await userService.getProfile(user.id);

      return reply.send({
        user: {
          ...user,
          profile,
        },
      });
    } catch (error: any) {
      console.error("Verify error:", error);
      return reply.status(401).send({ error: error.message });
    }
  });
}
