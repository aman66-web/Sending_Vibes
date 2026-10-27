import { notFound } from "next/navigation";

// Any address that isn't a real page shows the "ran away" page, in the visitor's language.
export default function Missing() {
  notFound();
}
