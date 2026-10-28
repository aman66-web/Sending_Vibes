"use client";

import { createContext, useContext } from "react";
import { labelList, labelText, type Labels, type ListKey, type TextKey } from "@/lib/labels";

// The screen showing's own wording for the words built into it, for the screens and
// games to read. CardPlayer provides it for whichever screen is on.
export const LabelsContext = createContext<Labels | undefined>(undefined);

export function useWords() {
  const labels = useContext(LabelsContext);
  return {
    text: (key: TextKey, vars?: Record<string, string | number>) => labelText(labels, key, vars),
    list: (key: ListKey) => labelList(labels, key),
  };
}
