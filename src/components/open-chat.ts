// The event that opens the help chat from anywhere on the page (see Chat.tsx).
export const OPEN_CHAT = "envelette:open-chat";

export function openChat() {
  window.dispatchEvent(new Event(OPEN_CHAT));
}
