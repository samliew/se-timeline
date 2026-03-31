"use client";

import { useEffect, useRef, useCallback } from "react";
import type { TimelineEvent } from "@/lib/types";

interface YearGroup {
  year: number;
  events: TimelineEvent[];
}

interface Props {
  yearGroups: YearGroup[];
  years: number[];
}

/** Convert tag-related strings to CSS class names */
function tagsStrToClass(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .split(/\s+/g)
    .map(
      (v) =>
        "tag-" +
        v.replace(/(^\W+|\W+$)/g, "").replace(/\W+/g, "-")
    )
    .join(" ");
}

/** Build the inner HTML for a single event card */
function buildEventHTML(event: TimelineEvent): string {
  const slug =
    event.slug ||
    event.title
      ?.toLowerCase()
      .replace(/\W+/g, "-");

  const tags =
    event.tags
      ?.map((tag) => {
        const isMse = tag.url.includes("meta.stackexchange.com");
        return `<a href="${tag.url ?? "#"}" class="tag ${isMse ? "meta-se-tag" : ""}">${tag.text}</a>`;
      })
      .join("") ?? "";

  const buttons =
    event.links
      ?.map(
        (link) =>
          `<a href="${link.url ?? "#"}" class="button event-button">${link.text}</a>`
      )
      .join("") ?? "";

  return `
<div class="event-tags less-important">
  <div class="inline">${event.type ?? ""}</div>
</div>
<div class="connector">
  <div class="connector-dot">
    <div class="featured-connector-dot"></div>
  </div>
  <div class="connector-dot dot-right">
    <div class="featured-connector-dot"></div>
  </div>
  <div class="featured-connector"></div>
</div>
<div class="box">
  <div class="featured-box"></div>
  ${event.icon ? `<img class="site-icon" src="${event.icon}" alt="" />` : ""}
  <div class="event-date">
    <div class="date date-from">${event.date_str}</div>
    <a href="/event-editor/?event=${slug}" class="edit-event" title="Edit event">edit</a>
  </div>
  <h4 class="event-name">${event.title ?? "Untitled Event"}</h4>
  ${event.summary ? `<div class="event-summary">${event.summary}</div>` : ""}
  ${event.body ? `<div class="event-description w-richtext">${event.body}</div>` : ""}
  <div class="event-tags">${tags}</div>
  ${buttons}
  ${event.linkedEvent ? `<a href="${event.linkedEvent}" class="linked-event">linked event</a>` : ""}
</div>`;
}

export default function TimelineClient({ yearGroups, years }: Props) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const yearPickerRef = useRef<HTMLSelectElement>(null);

  /** Smooth scroll to a position */
  const animateTo = useCallback((scrollY: number) => {
    window.scrollTo({ top: scrollY, behavior: "smooth" });
  }, []);

  /** Get offset for header */
  const offsetConstant = useCallback(() => {
    const header = document.querySelector("header");
    const yearEl = document.querySelector(".timeline-year");
    const headerHeight = header?.getBoundingClientRect().height ?? 80;
    const yearHeight = yearEl?.getBoundingClientRect().height ?? 0;
    return headerHeight + yearHeight;
  }, []);

  /** Go to a specific event by slug */
  const goToEvent = useCallback(
    (slug: string) => {
      const elem = document.getElementById(slug);
      if (!elem) return;
      elem.click();
      elem.classList.add("highlight");
      setTimeout(() => elem.classList.remove("highlight"), 2000);
    },
    []
  );

  /** Go to a specific year */
  const goToYear = useCallback(
    (year: number) => {
      const el = document.querySelector(
        `.timeline-year[data-year="${year}"]`
      ) as HTMLElement | null;
      if (el) el.click();
    },
    []
  );

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    // Remove empty elements
    timeline
      .querySelectorAll(".event-summary, .event-description, .event-link")
      .forEach((el) => {
        if (el.textContent?.trim() === "") el.remove();
      });

    // Resize small and large boxes
    const desktopMultiplier = window.innerWidth < 1200 ? 1.3 : 1;
    timeline.querySelectorAll(".box").forEach((el) => {
      const h = (el as HTMLElement).offsetHeight;
      const parent = el.parentElement;
      if (!parent) return;
      if (h < 180 * desktopMultiplier) parent.classList.add("event-small");
      if (h > 350 * desktopMultiplier) parent.classList.add("event-large");
      if (h > 700 * desktopMultiplier) parent.classList.add("event-xlarge");
    });

    // Show URL in tooltips for links that don't have a title
    timeline
      .querySelectorAll<HTMLAnchorElement>(".event a:not([title])")
      .forEach((el) => {
        el.title = el.href;
      });

    // Set tags as CSS classes for filter toggling
    timeline
      .querySelectorAll(".event-tags")
      .forEach((el) => {
        const event = el.closest(".event");
        if (event) {
          event.classList.add(...tagsStrToClass(el.textContent ?? "").split(" ").filter(Boolean));
        }
      });

    // === Year navigation ===
    const yearPicker = yearPickerRef.current;
    const sidebar = sidebarRef.current;
    const yearElements = Array.from(
      timeline.querySelectorAll<HTMLElement>(
        ".timeline-year:not(.static-year)"
      )
    );
    const reversedYears = [...yearElements].reverse();

    // Scroll-based year update
    let debounceTimer: ReturnType<typeof setTimeout>;
    const scrollUpdateCurrentYear = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const scrTop = window.scrollY;
        const prev = reversedYears.filter(
          (el) => el.getBoundingClientRect().top + window.scrollY - 80 <= scrTop
        );
        if (yearPicker) {
          if (prev.length) {
            yearPicker.value = prev[0].dataset.year ?? "";
          } else if (reversedYears.length) {
            yearPicker.value =
              reversedYears[reversedYears.length - 1].dataset.year ?? "";
          }
        }
        if (sidebar) {
          sidebar
            .querySelectorAll("a")
            .forEach((a) => a.classList.remove("current-year"));
          const currentYearStr = prev.length
            ? prev[0].dataset.year
            : reversedYears[reversedYears.length - 1]?.dataset.year;
          if (currentYearStr) {
            sidebar
              .querySelector(`a[data-year="${currentYearStr}"]`)
              ?.classList.add("current-year");
          }
        }
      }, 50);
    };
    window.addEventListener("scroll", scrollUpdateCurrentYear);

    // Sidebar hover logic
    let sidebarTimeout: ReturnType<typeof setTimeout>;
    const mousemoveHandler = (e: MouseEvent) => {
      if (!sidebar) return;
      clearTimeout(sidebarTimeout);
      const active = e.pageX + 100 > document.documentElement.clientWidth;
      if (active) {
        sidebar.classList.add("sidebar-open");
      } else {
        sidebarTimeout = setTimeout(() => {
          sidebar.classList.remove("sidebar-open");
        }, 400);
      }
    };
    document.addEventListener("mousemove", mousemoveHandler);

    // Event click handlers
    const timelineClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Linked event click
      const linkedEvent = target.closest(".linked-event") as HTMLAnchorElement | null;
      if (linkedEvent) {
        e.stopPropagation();
        e.preventDefault();
        const hash = linkedEvent.getAttribute("href");
        if (hash) {
          const slug = hash.startsWith("#") ? hash.slice(1) : hash;
          const elem = document.getElementById(slug);
          if (elem) {
            history.replaceState(
              null,
              document.title,
              `${location.pathname}${location.search}#${slug}`
            );
            animateTo(
              elem.getBoundingClientRect().top + window.scrollY - offsetConstant()
            );
            elem.classList.add("highlight");
            setTimeout(() => elem.classList.remove("highlight"), 2000);
          }
        }
        return;
      }

      // Year header click
      const yearHeader = target.closest(
        ".timeline-year:not(.static-year)"
      ) as HTMLElement | null;
      if (yearHeader) {
        const next = yearHeader.nextElementSibling;
        const firstChild = next?.firstElementChild as HTMLElement | null;
        if (firstChild) {
          animateTo(
            firstChild.getBoundingClientRect().top +
              window.scrollY -
              offsetConstant()
          );
        }
        return;
      }

      // Event box click
      const eventEl = target.closest(".event") as HTMLElement | null;
      if (eventEl) {
        history.replaceState(
          null,
          document.title,
          `${location.pathname}${location.search}#${eventEl.id}`
        );
        animateTo(
          eventEl.getBoundingClientRect().top +
            window.scrollY -
            offsetConstant()
        );
      }
    };
    timeline.addEventListener("click", timelineClickHandler);

    // On page load scroll to hash
    if (location.hash) {
      const slug = location.hash.slice(1);
      const eventEl = document.getElementById(slug);
      if (eventEl) {
        setTimeout(() => {
          animateTo(
            eventEl.getBoundingClientRect().top +
              window.scrollY -
              offsetConstant()
          );
          eventEl.classList.add("highlight");
          setTimeout(() => {
            document
              .querySelectorAll(".event.highlight")
              .forEach((el) => el.classList.remove("highlight"));
          }, 2000);
        }, 100);
      }
    }

    // Initial call
    scrollUpdateCurrentYear();

    return () => {
      window.removeEventListener("scroll", scrollUpdateCurrentYear);
      document.removeEventListener("mousemove", mousemoveHandler);
      timeline.removeEventListener("click", timelineClickHandler);
      clearTimeout(debounceTimer);
      clearTimeout(sidebarTimeout);
    };
  }, [animateTo, goToEvent, offsetConstant]);

  const handleYearPickerChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    goToYear(Number(e.target.value));
  };

  const handleSidebarClick = (
    e: React.MouseEvent<HTMLElement>,
    year: number
  ) => {
    e.preventDefault();
    goToYear(year);
  };

  const handleBackToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    animateTo(0);
  };

  const handleFilterChange = (filterType: string, checked: boolean) => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    let selector = "";
    switch (filterType) {
      case "mod-resignations":
        selector =
          ".tag-moderator.tag-resignation, .tag-moderator.tag-reinstatement";
        break;
      case "staff-resignations":
        selector = ".tag-staff.tag-resignation";
        break;
      case "site-graduations":
        selector = ".tag-site-graduation";
        break;
    }
    if (selector) {
      timeline.querySelectorAll(selector).forEach((el) => {
        el.classList.toggle("event-hidden", !checked);
      });
    }
  };

  return (
    <div className="fixed-header background-se">
      <header className="navbar">
        <div className="header-left"></div>
        <a
          href="#"
          id="back-to-top"
          className="header-link w-inline-block rainbow-text"
          onClick={handleBackToTop}
        >
          <h1 className="main-title desktop-only">
            The Stack Exchange Timeline
          </h1>
          <h1 className="main-title mobile-only">SE Timeline</h1>
        </a>
        <div className="header-right">
          <div>
            <select
              id="year-picker"
              className="year-picker w-select"
              ref={yearPickerRef}
              onChange={handleYearPickerChange}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <aside id="sidebar" className="sidebar" ref={sidebarRef}>
        {years.map((y) => (
          <a
            key={y}
            data-year={y}
            onClick={(e) => handleSidebarClick(e, y)}
          >
            {y}
          </a>
        ))}
      </aside>

      <aside className="filter-container">
        <div className="filter-section-title">show:</div>
        <div className="filters">
          <div className="filter-group inline">
            <label title="moderator resignations and reinstatements">
              <input
                type="checkbox"
                id="mod-resignations"
                defaultChecked
                onChange={(e) =>
                  handleFilterChange("mod-resignations", e.target.checked)
                }
              />{" "}
              mod movements
            </label>
          </div>
          <div className="filter-group inline">
            <label title="staff fired and resignations">
              <input
                type="checkbox"
                id="staff-resignations"
                defaultChecked
                onChange={(e) =>
                  handleFilterChange("staff-resignations", e.target.checked)
                }
              />{" "}
              staff movements
            </label>
          </div>
          <div className="filter-group inline">
            <label title="sites graduating (launching) out of beta">
              <input
                type="checkbox"
                id="site-graduations"
                defaultChecked
                onChange={(e) =>
                  handleFilterChange("site-graduations", e.target.checked)
                }
              />{" "}
              site graduations
            </label>
          </div>
        </div>
      </aside>

      <main id="timeline" className="timeline" ref={timelineRef}>
        <div className="timeline-line"></div>
        <div className="events-container">
          <div className="static-year">
            <h2 className="timeline-year static-year">present</h2>
            <div className="contribution-notice">
              <div className="box">
                Missing recent events?{" "}
                <a href="/event-editor" target="_blank">
                  Add it here
                </a>
                !
              </div>
            </div>
          </div>

          {yearGroups.map((group) => (
            <div className="year-group" key={group.year}>
              <h2 className="timeline-year" data-year={group.year}>
                {group.year}
              </h2>
              <div className="events-list">
                {group.events.map((event) => {
                  const slug =
                    event.slug ||
                    event.title
                      .toLowerCase()
                      .replace(/[^\w\s]+/g, "")
                      .replace(/\s+/g, "-")
                      .trim();
                  const classes = ["event", ...(event.classes ?? [])].join(
                    " "
                  );
                  return (
                    <div
                      key={slug}
                      id={slug}
                      className={classes}
                      dangerouslySetInnerHTML={{
                        __html: buildEventHTML(event),
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <h2 className="timeline-year static-year">the beginning</h2>
        <div className="left-mask"></div>
        <div className="right-mask"></div>
      </main>

      <footer className="footer">
        <div className="w-container">
          <p>All dates displayed in UTC+0</p>
          <p>
            <a href="https://discord.gg/tpgZmwR" target="_blank" rel="noreferrer">
              Feedback &amp; Discussion
            </a>{" "}
            |{" "}
            <a
              href="https://github.com/samliew/se-timeline"
              target="_blank"
              rel="noreferrer"
            >
              Contribute
            </a>
          </p>
          <div className="disclaimer">
            The Contents of this Website are provided on an &quot;as is&quot;
            basis without warranties of any kind. To the fullest extent
            permitted by law, the owners of this website do not warrant and
            hereby disclaims any warranty as to the accuracy, correctness,
            reliability, timeliness, non-infringement, title, merchantability
            or fitness for any particular purpose of the Contents of this
            Website; and that the Contents available through this Website or any
            functions associated therewith will be uninterrupted or error-free,
            or that defects will be corrected or that this Website and the
            server is and will be free of all viruses and/or other harmful
            elements. The owners of this website shall also not be liable for
            any damage or loss of any kind caused as a result (direct or
            indirect) of the use of the Website, including but not limited to
            any damage or loss suffered as a result of reliance on the Contents
            contained in or available from the Website.
          </div>
        </div>
      </footer>
    </div>
  );
}
