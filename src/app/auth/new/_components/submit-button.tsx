"use client";

import { useFormStatus } from "react-dom";

function SubmitButtonContent() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
    >
      {pending ? "Creating..." : "Generate New User ID"}
    </button>
  );
}

export function SubmitButton() {
  return <SubmitButtonContent />;
}
