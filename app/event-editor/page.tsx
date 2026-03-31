import type { Metadata } from "next";
import EventEditorClient from "./EventEditorClient";

export const metadata: Metadata = {
  title: "Event Editor - The Stack Exchange Timeline",
  description: "Add or edit timeline events",
};

export default function EventEditorPage() {
  return <EventEditorClient />;
}
