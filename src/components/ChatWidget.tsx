"use client";

import dynamic from "next/dynamic";

// The chat reads the saved conversation from sessionStorage on first render, so it only runs in the browser.
export const ChatWidget = dynamic(() => import("./Chat").then((m) => m.Chat), { ssr: false });
