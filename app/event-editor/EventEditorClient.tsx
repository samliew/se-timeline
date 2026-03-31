"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export default function EventEditorClient() {
  const [scriptsLoaded, setScriptsLoaded] = useState(0);
  const initRef = useRef(false);

  // We need 4 scripts to load: jQuery, jQuery debounce, Datepicker, TinyMCE
  const TOTAL_SCRIPTS = 4;

  const onScriptLoad = () => {
    setScriptsLoaded((prev) => prev + 1);
  };

  useEffect(() => {
    if (scriptsLoaded < TOTAL_SCRIPTS || initRef.current) return;
    initRef.current = true;

    // Load the editor logic after all external scripts are ready
    const script = document.createElement("script");
    script.src = "/js/editor.js";
    document.body.appendChild(script);

    return () => {
      // Cleanup TinyMCE on unmount
      const w = window as unknown as Record<string, unknown>;
      const tinymce = w.tinymce as { editors?: { destroy: () => void }[] } | undefined;
      if (tinymce?.editors) {
        tinymce.editors.forEach((editor) => editor.destroy());
      }
    };
  }, [scriptsLoaded]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/datepicker/1.0.10/datepicker.min.css"
        integrity="sha512-YdYyWQf8AS4WSB0WWdc3FbQ3Ypdm0QCWD2k4hgfqbQbRCJBEgX0iAegkl2S1Evma5ImaVXLBeUkIlP6hQ1eYKQ=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <link rel="stylesheet" href="/css/webflow.9498fd7ed.css" />
      <link rel="stylesheet" href="/css/main.css" />
      <link rel="stylesheet" href="/css/editor.css" />

      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"
        integrity="sha512-bLT0Qm9VnAYZDflyKcBaQ2gg0hSYNQrJ8RilYldYQ1FxQYoCLtUjuuRuZo+fjqhx/qtq/1itJ0C2ejDxltZVFg=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        strategy="afterInteractive"
        onLoad={onScriptLoad}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jquery-throttle-debounce/1.1/jquery.ba-throttle-debounce.min.js"
        integrity="sha512-JZSo0h5TONFYmyLMqp8k4oPhuo6yNk9mHM+FY50aBjpypfofqtEWsAgRDQm94ImLCzSaHeqNvYuD9382CEn2zw=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        strategy="afterInteractive"
        onLoad={onScriptLoad}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/datepicker/1.0.10/datepicker.min.js"
        integrity="sha512-RCgrAvvoLpP7KVgTkTctrUdv7C6t7Un3p1iaoPr1++3pybCyCsCZZN7QEHMZTcJTmcJ7jzexTO+eFpHk4OCFAg=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        strategy="afterInteractive"
        onLoad={onScriptLoad}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.10.7/tinymce.min.js"
        integrity="sha512-Ckge7OuE2kEtJHLhA8wnsn3aEImoJpk3k4MAhbGnGVlxYAgx/5uv/MYdPTzuX6/dCwbPriGxylCRhTKcRd0MZQ=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        strategy="afterInteractive"
        onLoad={onScriptLoad}
      />

      <header className="navbar">
        <div className="header-left">
          <a href="/" className="back-link" title="Back to Timeline">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M448 224V288C448 305.674 433.674 320 416 320H224V416C224 428.938 216.203 440.609 204.25 445.562C192.281 450.516 178.531 447.781 169.375 438.625L9.375 278.625C3.125 272.375 0 264.188 0 256S3.125 239.625 9.375 233.375L169.375 73.375C178.531 64.219 192.281 61.484 204.25 66.438C216.203 71.391 224 83.062 224 96V192H416C433.674 192 448 206.328 448 224Z" />
            </svg>
            <span>Back to Timeline</span>
          </a>
        </div>
        <h1 className="main-title">Event Editor</h1>
        <div className="header-right">
          <a href="/" className="back-link" title="Back to Timeline">
            <span className="mobile-only">Timeline</span>
          </a>
        </div>
      </header>

      <main className="event-editor w-container" style={{ paddingBottom: "5rem" }}>
        <div className="w-col">
          <aside>
            This is a UI to assist in adding/editing event details for export to
            a JSON object. To import an existing event&apos;s details, click an edit
            icon on an event in the{" "}
            <a href="/" title="Back to Timeline">
              timeline
            </a>
            , or see the{" "}
            <a href="#event-json">instructions at the bottom of this page</a>.
          </aside>
          <form action="#" className="event-editor-form" id="event-editor-form">
            <div className="form-row">
              <label className="w-label required">Date</label>
              <div className="info">displayed date string in UTC (required)</div>
              <input
                className="w-input"
                type="text"
                name="date_str"
                id="date_str"
                placeholder="YYYY-MM-DD"
                pattern="^\d{4}-\d{2}-\d{2}$"
                maxLength={10}
                data-component="datepicker"
                required
              />
              <div
                className="datepicker-wrapper"
                style={{ position: "relative" }}
              ></div>
            </div>
            <div className="form-row">
              <label className="w-label required" htmlFor="title">
                Title
              </label>
              <div className="info">title of event (required)</div>
              <input
                className="w-input w-input-large"
                type="text"
                name="title"
                id="title"
                maxLength={500}
                required
              />
            </div>
            <div className="form-row">
              <label className="w-label" htmlFor="slug">
                Slug
              </label>
              <div className="info">this is auto-generated if not set</div>
              <input
                className="w-input"
                type="text"
                name="slug"
                id="slug"
                maxLength={500}
                pattern="^([a-z0-9]|-)+$"
              />
            </div>
            <div className="form-row">
              <label className="w-label" htmlFor="type">
                Type
              </label>
              <div className="info">describe the event using single words</div>
              <input
                className="w-input"
                type="text"
                name="type"
                id="type"
                maxLength={140}
                placeholder="chat blog licensing moderators staff resignation company"
              />
            </div>
            <div className="form-row">
              <label className="w-label" htmlFor="summary">
                Summary
              </label>
              <div className="info">
                a short summary, displayed in italics under the title
              </div>
              <input
                className="w-input"
                type="text"
                name="summary"
                id="summary"
                maxLength={500}
              />
            </div>
            <div className="form-row">
              <label className="w-label required" htmlFor="body">
                Body
              </label>
              <div className="info">ctrl+click to open links in a new window</div>
              <textarea
                className="w-input"
                name="body"
                id="body"
                rows={3}
                style={{ width: "100%", minHeight: "150px", resize: "vertical" }}
                required
              ></textarea>
            </div>
            <fieldset>
              <legend className="w-label">Classes</legend>
              <div className="class-grid">
                <div className="form-row-inline">
                  <input
                    className="w-checkbox"
                    type="checkbox"
                    name="classes"
                    id="classes_featured-event"
                    value="featured-event"
                  />
                  <label className="w-label" htmlFor="classes_featured-event">
                    featured
                  </label>
                  <div className="info">feature with a red border</div>
                </div>
                <div className="form-row-inline">
                  <input
                    className="w-checkbox"
                    type="checkbox"
                    name="classes"
                    id="classes_tag-moderator"
                    value="tag-moderator"
                  />
                  <label className="w-label" htmlFor="classes_tag-moderator">
                    moderator
                  </label>
                  <div className="info">event is about specific moderator</div>
                </div>
                <div className="form-row-inline">
                  <input
                    className="w-checkbox"
                    type="checkbox"
                    name="classes"
                    id="classes_tag-staff"
                    value="tag-staff"
                  />
                  <label className="w-label" htmlFor="classes_tag-staff">
                    staff
                  </label>
                  <div className="info">event is about specific staff</div>
                </div>
                <div className="form-row-inline">
                  <input
                    className="w-checkbox"
                    type="checkbox"
                    name="classes"
                    id="classes_tag-resignation"
                    value="tag-resignation"
                  />
                  <label className="w-label" htmlFor="classes_tag-resignation">
                    resignation
                  </label>
                  <div className="info">event is about resignation</div>
                </div>
                <div className="form-row-inline">
                  <input
                    className="w-checkbox"
                    type="checkbox"
                    name="classes"
                    id="classes_tag-reinstatement"
                    value="tag-reinstatement"
                  />
                  <label className="w-label" htmlFor="classes_tag-reinstatement">
                    reinstatement
                  </label>
                  <div className="info">event is about reinstatement</div>
                </div>
                <div className="form-row-inline">
                  <input
                    className="w-checkbox"
                    type="checkbox"
                    name="classes"
                    id="classes_tag-site-graduation"
                    value="tag-site-graduation"
                  />
                  <label
                    className="w-label"
                    htmlFor="classes_tag-site-graduation"
                  >
                    site-graduation
                  </label>
                  <div className="info">event is about site graduation</div>
                </div>
                <input type="hidden" name="classes" id="classes_other" defaultValue="" />
              </div>
            </fieldset>
            <div className="form-row">
              <label className="w-label" htmlFor="links">
                Links
              </label>
              <div className="info">button links (up to three)</div>
              <div className="link-grid">
                <span>1.</span>
                <input
                  className="w-input linkText"
                  type="text"
                  id="linkText0"
                  data-pair="linkUrl0"
                  placeholder="discuss"
                  maxLength={50}
                />
                <input
                  className="w-input linkUrl"
                  type="url"
                  id="linkUrl0"
                  data-pair="linkText0"
                  placeholder="https://"
                />
                <span>2.</span>
                <input
                  className="w-input linkText"
                  type="text"
                  id="linkText1"
                  data-pair="linkUrl1"
                  placeholder="chat"
                  maxLength={50}
                />
                <input
                  className="w-input linkUrl"
                  type="url"
                  id="linkUrl1"
                  data-pair="linkText1"
                  placeholder="https://"
                />
                <span>3.</span>
                <input
                  className="w-input linkText"
                  type="text"
                  id="linkText2"
                  data-pair="linkUrl2"
                  placeholder="meta post"
                  maxLength={50}
                />
                <input
                  className="w-input linkUrl"
                  type="url"
                  id="linkUrl2"
                  data-pair="linkText2"
                  placeholder="https://"
                />
              </div>
            </div>
            <div className="form-row">
              <label className="w-label" htmlFor="tags">
                Tags
              </label>
              <div className="info">an array of link tags (up to three)</div>
              <div className="tags-grid">
                <span>1.</span>
                <input
                  className="w-input tagText"
                  type="text"
                  id="tagText0"
                  data-pair="tagUrl0"
                  placeholder="tag-text"
                  maxLength={50}
                  pattern="^[a-z0-9-]+$"
                />
                <input
                  className="w-input tagUrl"
                  type="url"
                  id="tagUrl0"
                  data-pair="tagText0"
                  placeholder="https://"
                />
                <span>2.</span>
                <input
                  className="w-input tagText"
                  type="text"
                  id="tagText1"
                  data-pair="tagUrl1"
                  placeholder="tag-text"
                  maxLength={50}
                  pattern="^[a-z0-9-]+$"
                />
                <input
                  className="w-input tagUrl"
                  type="url"
                  id="tagUrl1"
                  data-pair="tagText1"
                  placeholder="https://"
                />
                <span>3.</span>
                <input
                  className="w-input tagText"
                  type="text"
                  id="tagText2"
                  data-pair="tagUrl2"
                  placeholder="tag-text"
                  maxLength={50}
                  pattern="^[a-z0-9-]+$"
                />
                <input
                  className="w-input tagUrl"
                  type="url"
                  id="tagUrl2"
                  data-pair="tagText2"
                  placeholder="https://"
                />
              </div>
            </div>
            <div className="form-row">
              <label className="w-label" htmlFor="linkedEvent">
                Linked Event
              </label>
              <div className="info">
                another event&apos;s slug prefixed with a #
              </div>
              <div className="d-flex">
                <div className="linked-event-wrapper">
                  <input
                    className="w-input"
                    type="text"
                    name="linkedEvent"
                    id="linkedEvent"
                    maxLength={500}
                    placeholder="#"
                    pattern="^#([a-z0-9]|-)+$"
                  />
                  <select className="w-select" id="linked-event-selector">
                    <option>select event</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="icon-preview-wrapper">
                <div>
                  <label className="w-label" htmlFor="icon">
                    Icon
                  </label>
                  <div className="info">
                    image url (e.g.: for site graduation events)
                  </div>
                  <input
                    className="w-input"
                    type="url"
                    name="icon"
                    id="icon"
                    placeholder="https://"
                  />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src=""
                  className="icon-preview"
                  id="icon-preview"
                  title="preview"
                  alt="icon preview"
                />
              </div>
            </div>

            <aside className="form-invalid-notice danger">
              Please fix any validation issues in the highlighted fields above.
            </aside>

            <div className="form-actions" style={{ marginBottom: "3rem" }}>
              <button
                className="w-button w-button-danger"
                id="clear-form"
                type="reset"
              >
                Clear
              </button>
            </div>
          </form>

          <h4 id="event-json">Event JSON</h4>
          <aside>
            <strong>Export:</strong> The event JSON will be generated in the
            field below when the event editor form is valid. This page does not
            auto-save - please refer to the{" "}
            <a
              href="https://github.com/samliew/se-timeline#contributing"
              target="_blank"
              rel="noreferrer"
            >
              readme
            </a>{" "}
            on GitHub for contribution notes, and copy the JSON below into a{" "}
            <a
              href="https://github.com/samliew/se-timeline/issues/new/choose"
              target="_blank"
              rel="noreferrer"
            >
              new issue
            </a>{" "}
            for review.
          </aside>

          <div className="json-output-wrapper">
            <textarea
              name="output"
              id="json-output"
              rows={10}
              className="w-input json-output"
              placeholder="Please fix any validation issues in the highlighted fields above."
              required
            ></textarea>
            <div className="import-export-actions">
              <button className="w-button small" id="copy-json" type="button">
                Copy
              </button>
              <button className="w-button small" id="import-json" type="button">
                Import
              </button>
            </div>
          </div>

          <aside>
            <strong>Import:</strong> To load the event, select an existing event
            from the dropdown below, or paste an event JSON object into the
            field above then click the &quot;Import&quot; button.
          </aside>

          <div className="import-field-wrapper">
            Import:
            <select className="w-select" id="import-event-selector">
              <option>select event</option>
            </select>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="w-container">
          <p>
            <a href="/">Back to Timeline (Home)</a>
          </p>
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
            reliability, timeliness, non-infringement, title, merchantability or
            fitness for any particular purpose of the Contents of this Website;
            and that the Contents available through this Website or any functions
            associated therewith will be uninterrupted or error-free, or that
            defects will be corrected or that this Website and the server is and
            will be free of all viruses and/or other harmful elements. The
            owners of this website shall also not be liable for any damage or
            loss of any kind caused as a result (direct or indirect) of the use
            of the Website, including but not limited to any damage or loss
            suffered as a result of reliance on the Contents contained in or
            available from the Website.
          </div>
        </div>
      </footer>
    </>
  );
}
