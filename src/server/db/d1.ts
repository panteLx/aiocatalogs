import { type D1Database } from "@cloudflare/workers-types";

// Define the Post type
export interface Post {
  id: number;
  title: string;
  content: string;
  author?: string;
  created_at: string;
  updated_at: string;
}

export class D1Service {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Create a new post
  async createPost(
    postData: Omit<Post, "id" | "created_at" | "updated_at">,
  ): Promise<Post> {
    const { title, content, author } = postData;

    const result = await this.db
      .prepare(
        "INSERT INTO posts (title, content, author) VALUES (?, ?, ?) RETURNING *",
      )
      .bind(title, content, author ?? null)
      .run();

    if (!result.success) {
      throw new Error("Failed to create post");
    }

    const createdPost = result.results[0];
    if (!createdPost) {
      throw new Error("Failed to retrieve created post");
    }

    return {
      id: Number(createdPost.id),
      title: String(createdPost.title),
      content: String(createdPost.content),
      author:
        typeof createdPost.author === "string" ? createdPost.author : undefined,
      created_at: String(createdPost.created_at),
      updated_at: String(createdPost.updated_at),
    };
  }

  // Get all posts
  async getAllPosts(): Promise<Post[]> {
    const result = await this.db
      .prepare("SELECT * FROM posts ORDER BY created_at DESC")
      .run();

    if (!result.success) {
      throw new Error("Failed to get posts");
    }

    return result.results.map((post) => ({
      id: Number(post.id),
      title: String(post.title),
      content: String(post.content),
      author: post.author ? String(post.author) : undefined,
      created_at: String(post.created_at),
      updated_at: String(post.updated_at),
    }));
  }

  // Get a post by ID
  async getPostById(id: number): Promise<Post | null> {
    const result = await this.db
      .prepare("SELECT * FROM posts WHERE id = ?")
      .bind(id)
      .run();

    if (!result.success || result.results.length === 0) {
      return null;
    }

    const foundPost = result.results[0];
    if (!foundPost) {
      return null;
    }

    return {
      id: Number(foundPost.id),
      title: String(foundPost.title),
      content: String(foundPost.content),
      author:
        typeof foundPost.author === "string" ? foundPost.author : undefined,
      created_at: String(foundPost.created_at),
      updated_at: String(foundPost.updated_at),
    };
  }

  // Get recent posts
  async getRecentPosts(limit = 5): Promise<Post[]> {
    const result = await this.db
      .prepare("SELECT * FROM posts ORDER BY created_at DESC LIMIT ?")
      .bind(limit)
      .run();

    if (!result.success) {
      throw new Error("Failed to get recent posts");
    }

    return result.results.map((post) => ({
      id: Number(post.id),
      title: String(post.title),
      content: String(post.content),
      author: post.author ? String(post.author) : undefined,
      created_at: String(post.created_at),
      updated_at: String(post.updated_at),
    }));
  }

  // Update a post
  async updatePost(
    id: number,
    updates: Partial<Omit<Post, "id" | "created_at" | "updated_at">>,
  ): Promise<Post | null> {
    const { title, content, author } = updates;
    const setStatements = [];
    const bindValues = [];

    if (title !== undefined) {
      setStatements.push("title = ?");
      bindValues.push(title);
    }

    if (content !== undefined) {
      setStatements.push("content = ?");
      bindValues.push(content);
    }

    if (author !== undefined) {
      setStatements.push("author = ?");
      bindValues.push(author);
    }

    if (setStatements.length === 0) {
      return this.getPostById(id);
    }

    setStatements.push('updated_at = datetime("now")');
    bindValues.push(id);

    const result = await this.db
      .prepare(
        `UPDATE posts SET ${setStatements.join(", ")} WHERE id = ? RETURNING *`,
      )
      .bind(...bindValues)
      .run();

    if (!result.success || result.results.length === 0) {
      return null;
    }

    const updatedPost = result.results[0];
    if (!updatedPost) {
      return null;
    }

    return {
      id: Number(updatedPost.id),
      title: String(updatedPost.title),
      content: String(updatedPost.content),
      author:
        typeof updatedPost.author === "string" ? updatedPost.author : undefined,
      created_at: String(updatedPost.created_at),
      updated_at: String(updatedPost.updated_at),
    };
  }

  // Delete a post
  async deletePost(id: number): Promise<boolean> {
    const result = await this.db
      .prepare("DELETE FROM posts WHERE id = ?")
      .bind(id)
      .run();

    return result.success;
  }
}
