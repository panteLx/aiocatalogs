'use client';

import { api } from '~/trpc/react';

export function RecentPosts() {
  const { data: posts, isLoading, error } = api.post.getRecentPosts.useQuery({ limit: 5 });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border border-white/10 rounded-md p-4 bg-white/5">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-1/2 mb-2"></div>
              <div className="h-10 bg-white/10 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="text-red-400 p-4 bg-white/5 rounded-md">
          Error loading posts: {error.message}
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="w-full">
        <div className="text-white/70 p-4 bg-white/5 rounded-md">
          No posts yet. Be the first to create one!
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="border border-white/10 rounded-md p-4 bg-white/5 hover:bg-white/10 transition">
            <h3 className="font-semibold text-lg">{post.title}</h3>
            {post.author && <p className="text-sm text-white/70 mb-2">By {post.author}</p>}
            <p className="text-white/90 mt-2">{post.content}</p>
            <p className="text-xs text-white/50 mt-2">
              {new Date(post.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
