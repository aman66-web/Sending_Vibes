"use client";

import dynamic from "next/dynamic";

// The creator reads the saved draft from localStorage on first render, so it only runs in the browser.
export const ClientCreator = dynamic(() => import("./Creator").then((m) => m.Creator), {
  ssr: false,
  loading: () => <div className="grid min-h-dvh place-items-center text-4xl">💌</div>,
});
