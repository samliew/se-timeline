import fs from "fs";
import path from "path";
import type { TimelineData, TimelineEvent } from "@/lib/types";
import TimelineClient from "./TimelineClient";

/** Convert a title to a URL-friendly slug */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]+/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

/** Group events by year */
function groupByYear(
  items: TimelineEvent[]
): { year: number; events: TimelineEvent[] }[] {
  const groups: { year: number; events: TimelineEvent[] }[] = [];
  let currentYear = 0;

  for (const event of items) {
    const yearStr = event.date_str?.slice(0, 4);
    if (!yearStr) continue;

    const year = Number(yearStr);
    if (isNaN(year)) continue;

    // Ensure slug
    if (!event.slug) {
      event.slug = toSlug(event.title);
    }

    if (currentYear !== year) {
      currentYear = year;
      groups.push({ year, events: [] });
    }

    groups[groups.length - 1].events.push(event);
  }

  return groups;
}

export default function HomePage() {
  const dataPath = path.join(process.cwd(), "timeline_data.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const data: TimelineData = JSON.parse(raw);
  const yearGroups = groupByYear(data.items);
  const years = yearGroups.map((g) => g.year);

  return <TimelineClient yearGroups={yearGroups} years={years} />;
}
