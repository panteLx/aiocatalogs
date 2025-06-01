"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestPost() {
  const { data: latestPost, isLoading, error } = api.post.getLatest.useQuery();
  const utils = api.useUtils();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-4">
          <div className="rounded-md bg-white/5 p-4">
            <div className="mb-2 h-4 w-3/4 rounded bg-white/10"></div>
            <div className="mb-2 h-3 w-1/2 rounded bg-white/10"></div>
            <div className="h-10 w-full rounded bg-white/10"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="rounded-md bg-white/5 p-4 text-red-400">
          Error loading latest post: {error.message}
        </div>
      </div>
    );
  }

  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setTitle("");
      setContent("");
      setAuthor("");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestPost ? (
        <div className="mb-4 rounded-lg bg-white/5 p-4">
          <h3 className="text-lg font-bold">{latestPost.title}</h3>
          {latestPost.author && (
            <p className="text-sm text-white/70">By {latestPost.author}</p>
          )}
          <p className="mt-2 truncate text-white/90">{latestPost.content}</p>
          <p className="mt-2 text-xs text-white/50">
            {new Date(latestPost.created_at).toLocaleString()}
          </p>
        </div>
      ) : (
        <p className="mb-4">You have no posts yet.</p>
      )}

      <h3 className="mb-2 font-semibold">Create a new post</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !content.trim()) return;

          createPost.mutate({
            title,
            content,
            author: author.trim() || undefined,
          });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md bg-white/10 px-4 py-2 text-white"
          required
        />

        <input
          type="text"
          placeholder="Author (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full rounded-md bg-white/10 px-4 py-2 text-white"
        />

        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md bg-white/10 px-4 py-2 text-white"
          required
        />

        <button
          type="submit"
          className="rounded-md bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createPost.isPending || !title.trim() || !content.trim()}
        >
          {createPost.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
