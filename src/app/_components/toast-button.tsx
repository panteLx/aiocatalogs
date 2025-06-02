"use client";

import { toast } from "sonner";

export function ToastButton() {
  return (
    <button
      onClick={() => {
        toast("Welcome!", {
          description: "Thanks for trying out our toast notifications!",
        });
      }}
      className="rounded-lg bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20"
    >
      Show Toast Notification
    </button>
  );
}
