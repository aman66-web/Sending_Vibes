import type { Screen } from "./card";

// The moments within a screen worth seeing on their own while making a card: the
// envelope closed and then opening, the question and then "yes", a game being played
// and then won. The editor's arrows step through these one at a time, and each
// screen starts at whichever it's given (see the `stage` prop on the screens).

export type StageName =
  | "envelope"
  | "opened"
  | "asking"
  | "dodged"
  | "yes"
  | "photos"
  | "photo"
  | "letter"
  | "playing"
  | "won"
  | "question"
  | "wrong"
  | "quizDone"
  | "covered"
  | "revealed"
  | "typing"
  | "solved"
  | "spin"
  | "landed"
  | "coupons"
  | "redeemed"
  | "jar"
  | "note"
  | "jarEmpty"
  | "percent"
  | "event"
  | "boxes"
  | "picked"
  | "finale";

export type Stage = { name: StageName; n?: number };

// Where the slider sits at each of its stages, one per line it says, then full.
export const SLIDER_STAGES = [18, 40, 70, 90, 100];

export function stagesOf(screen: Screen): Stage[] {
  switch (screen.type) {
    case "intro":
      return [{ name: "envelope" }, { name: "opened" }];
    case "question":
      return [{ name: "asking" }, { name: "dodged" }, { name: "yes" }];
    case "photos":
      return screen.photos.length > 1 ? screen.photos.map((_, i) => ({ name: "photo", n: i + 1 })) : [{ name: "photos" }];
    case "message":
      return [{ name: "letter" }];
    case "game":
      return [{ name: "playing" }, { name: "won" }];
    case "quiz":
      // The first question, a wrong answer to it, the other questions, then the end.
      return [
        { name: "question", n: 1 },
        { name: "wrong" },
        ...screen.questions.slice(1).map((_, i) => ({ name: "question" as const, n: i + 2 })),
        { name: "quizDone" },
      ];
    case "scratch":
      return [{ name: "covered" }, { name: "revealed" }];
    case "typeit":
      return [{ name: "typing" }, { name: "solved" }];
    case "wheel":
      return [{ name: "spin" }, { name: "landed" }];
    case "coupons":
      return [{ name: "coupons" }, { name: "redeemed" }];
    case "reasons":
      // The jar, each note pulled out in turn, then the jar empty (with the last note).
      return [{ name: "jar" }, ...screen.reasons.slice(1).map((_, i) => ({ name: "note" as const, n: i + 1 })), { name: "jarEmpty" }];
    case "slider":
      return SLIDER_STAGES.map((n) => ({ name: "percent", n }));
    case "timeline":
      return screen.events.map((_, i) => ({ name: "event", n: i + 1 }));
    case "boxes":
      return [{ name: "boxes" }, { name: "picked" }];
    case "finale":
      return [{ name: "finale" }];
  }
}
