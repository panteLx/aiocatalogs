import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { type Post } from "~/server/db/d1";

// Fallback to mocked data if D1 is not available
const mockPosts: Post[] = [
  {
    id: 1,
    title: "Hello World",
    content: "This is a sample post",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: publicProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      author: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Use D1 database if available, otherwise use mock data
      if (ctx.d1Service) {
        return await ctx.d1Service.createPost({
          title: input.title,
          content: input.content,
          author: input.author,
        });
      } else {
        // Fallback to mock implementation
        const newPost: Post = {
          id: mockPosts.length + 1,
          title: input.title,
          content: input.content,
          author: input.author,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockPosts.push(newPost);
        return newPost;
      }
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    if (ctx.d1Service) {
      const recentPosts = await ctx.d1Service.getRecentPosts(1);
      return recentPosts[0] ?? null;
    } else {
      // Fallback to mock implementation
      return mockPosts.at(-1) ?? null;
    }
  }),
  
  getRecentPosts: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(5),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.d1Service) {
        return await ctx.d1Service.getRecentPosts(input.limit);
      } else {
        // Fallback to mock implementation
        return mockPosts.slice(-input.limit);
      }
    }),
    
  getAllPosts: publicProcedure.query(async ({ ctx }) => {
    if (ctx.d1Service) {
      return await ctx.d1Service.getAllPosts();
    } else {
      // Fallback to mock implementation
      return [...mockPosts];
    }
  }),
  
  getPostById: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.d1Service) {
        return await ctx.d1Service.getPostById(input.id);
      } else {
        // Fallback to mock implementation
        return mockPosts.find(post => post.id === input.id) ?? null;
      }
    }),
});
