// Helper functions
// An array of short month names from Jan-Dec, in current locale
const monthsOfYear = [...Array(12)].map((_, i) => {
  const date = new Date(2000, i, 1);
  return date.toLocaleString(undefined, { month: 'short' });
});

// Main
(async () => {

  console.clear();
  const today = new Date();
  const startOfUTCToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getUTCDate()));

  // Init Datepicker
  // https://fengyuanchen.github.io/datepicker/
  // https://github.com/fengyuanchen/datepicker
  const dateField = $('[data-component="datepicker"]').datepicker({
    'container': '.datepicker-wrapper',
    'autoShow': false,
    'autoHide': false,
    'autoPick': true,
    'format': 'yyyy-mm-dd',
    'inline': true,
    'date': startOfUTCToday,
    'endDate': startOfUTCToday,
    'startView': 0, // days
    'weekStart': 0, // sun
    'yearFirst': false,
    'zIndex': 1,
    'daysMin': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  }).on('pick.datepicker', evt => {
    // Update date_str field after datepicker selection
    setTimeout(() => {
      evt.target.dispatchEvent(new Event('change', {
        bubbles: true, cancelable: true, composed: true
      }));
      evt.target.reportValidity();
    }, 10);
  });

  // Init Tinymce
  // https://www.tiny.cloud/docs/release-notes/release-notes50/
  tinymce.init({
    selector: '#body',
    content_css: [
      "https://fonts.googleapis.com/css?family=Open+Sans:400,400i,600&display=swap",
      "/assets/css/webflow.9498fd7ed.css",
      "/assets/css/main.css",
      "/assets/css/tinymce-override.css",
    ],
    branding: false,
    contextmenu: false,
    draggable_modal: true,
    elementpath: false,
    plugins: 'anchor autolink charmap code emoticons image link lists media searchreplace',
    toolbar: 'bold italic underline link numlist bullist removeformat | undo redo | searchreplace code',
    menubar: false,
    statusbar: false,
    min_height: 300,
    setup: editor => {
      editor.on('change', evt => {
        console.log('the event object ', evt);
        console.log('the editor object ', editor);
        console.log('the content ', editor.getContent());

        // Update textarea
        const target = editor.targetElm;
        target.value = editor.getContent().replace(/[\n\r]+/, '');
        editor.targetElm.dispatchEvent(new Event('change', {
          bubbles: true, cancelable: true, composed: true
        }));
      });
    }
  });

  const form = document.querySelector('#event-editor-form');
  const output = document.querySelector('#json-output');

  // Generate JSON from form fields
  const tryGenerateJson = () => {
    if (!form.checkValidity()) return;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // If slug is empty, generate from title
    if (!data.slug) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    // Join multiple values (from checkboxes) into array
    const join = key => {
      const values = [...formData.getAll(key)].flatMap(v => v.split(/[,; ]+/)).filter(Boolean);
      data[key] = values;
    };
    join('classes');

    // Join links
    const linkText = [...form.querySelectorAll('.linkText')].map(v => v.value)
    data.links = [...form.querySelectorAll('.linkUrl')].map(v => v.value)
      .map((url, i) => ({ text: linkText[i], url }))
      .filter(v => v.text && v.url); // remove empty links

    // Join tags
    const tagText = [...form.querySelectorAll('.tagText')].map(v => v.value)
    data.tags = [...form.querySelectorAll('.tagUrl')].map(v => v.value)
      .map((url, i) => ({ text: tagText[i], url }))
      .filter(v => v.text && v.url); // remove empty links

    // Remove empty fields
    Object.entries(data).forEach(([key, value]) => {
      if (value.length === 0) delete data[key];
    });

    // Output JSON
    const json = JSON.stringify(data, null, 2);
    output.value = json + ',';
  };

  // Import JSON to form fields
  const tryImportJson = () => {
    form.reset();

    try {
      const json = JSON.parse(output.value.trim().replace(/,$/, ''));
      Object.entries(json).forEach(([key, value]) => {

        const field = document.getElementById(key);
        if (field) field.value = value;

        // If date field, update datepicker
        if (key === 'date_str') {
          dateField.datepicker('update');
        }

        // If body field, update tinymce
        if (key === 'body') {
          tinymce.activeEditor.setContent(value);
        }

        // If classes field, update checkboxes
        if (key === 'classes') {
          const otherField = document.querySelector('#classes_other');
          otherField.value = '';
          value.forEach(v => {
            const checkbox = document.querySelector(`[name="classes"][value="${v}"]`);
            if (checkbox) {
              checkbox.checked = true;
            }
            else if (otherField.value.length) {
              otherField.value += `;${v}`;
            }
            else {
              otherField.value = v;
            }
          });
        }

        // If links field, update links
        if (key === 'links') {
          document.querySelectorAll('.linkText').forEach((el, i) => {
            el.value = value[i]?.text || '';
          });
          document.querySelectorAll('.linkUrl').forEach((el, i) => {
            el.value = value[i]?.url || '';
          });
        }

        // If tags field, update tags
        if (key === 'tags') {
          document.querySelectorAll('.tagText').forEach((el, i) => {
            el.value = value[i]?.text || '';
          });
          document.querySelectorAll('.tagUrl').forEach((el, i) => {
            el.value = value[i]?.url || '';
          });
        }
      });

      // Update form fields
      [...form.elements].forEach(el => formatField(el));
    } catch (e) { } // ignore errors
  };

  const formatField = field => {
    field.value = field.value.trim();

    // If has linked fields, toggle the other to required if not empty
    const notEmpty = field.value.length > 0;
    const pairField = document.querySelector(`#${field.dataset.pair}`);
    if (pairField) pairField.required = notEmpty;

    // If linkedEvent field, and not empty, prepend with #
    if (field.id === 'linkedEvent' && notEmpty && field.value[0] !== '#') {
      field.value = `#${field.value}`;
    }

    // If url field, and does not start with http, prepend with https://
    if (field.type === 'url' && notEmpty && !field.value.match(/^https?:\/\//)) {
      field.value = `https://${field.value}`;
    }

    // If icon field, try preview image
    if (field.id === 'icon') {
      const preview = field.nextElementSibling;
      preview.src = field.value;
      preview.style.display = notEmpty ? 'inline-block' : 'none';
    }
  };

  // Form field change
  form.addEventListener('change', evt => {
    const target = evt.target;
    formatField(target);

    target.reportValidity();
    tryGenerateJson();
  });

  // Import JSON button
  document.querySelector('#import-json').addEventListener('click', evt => {
    evt.preventDefault();
    tryImportJson();
  });

  // Init dropdown import
  const dropdown = document.querySelector('#events-import-slug');
  if (dropdown) {
    let currentYear;

    const { items } = await $.getJSON('/timeline_data.json');
    items.forEach(event => {

      // Assumes items are already sorted by year
      const year = event.date_str?.slice(0, 4);
      if (!year) return;

      // New year
      if (currentYear !== year) {
        currentYear = year;
        const currentYearElem = document.createElement('optgroup');
        currentYearElem.label = year;
        dropdown.append(currentYearElem);
      }

      // Create element html
      const eventEl = document.createElement('option');
      eventEl.value = event.slug || event.title;
      eventEl.innerText = event.title.split(' ').slice(0, 8).join(' ');
      if (eventEl.innerText.length < event.title.length) eventEl.innerText += '...';
      // Append month
      if (event.date_str?.length) {
        const month = Number(event.date_str.match(/-(\d\d)-/)?.pop());
        eventEl.innerText = `${monthsOfYear[month - 1]} - ${eventEl.innerText}`;
      }

      dropdown.append(eventEl);
    });

    // Event listener
    dropdown.addEventListener('change', evt => {
      const slug = evt.target.value;
      const item = items.find(e => e.slug === slug || e.title === slug);
      if (!item) return;

      output.value = JSON.stringify(item, null, 2) + ',';

      // Import JSON
      tryImportJson();
    });
  }

  /**
   * @summary Copy text to clipboard
   * @param {string | HTMLElement} content text or element to copy
   * @returns {boolean} success
   */
  const copyToClipboard = async content => {
    let success = false;

    // If content is an element, get its value or innerText
    if (content instanceof HTMLElement) {
      content = content.value || content.innerText;
    }

    // Save current focus
    const previousFocusElement = document.activeElement;

    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    Object.assign(textArea.style, {
      position: 'fixed',
      zIndex: -1,
      opacity: 0,
      pointerEvents: 'none'
    });
    textArea.value = content;
    document.body.appendChild(textArea);
    window.focus();
    textArea.focus();
    textArea.select();

    // Method 1
    try {
      if (typeof navigator.clipboard?.writeText === 'function') {
        success = await navigator.clipboard.writeText(content || textArea.value);
      }
    }
    catch (err) { }

    // Method 2
    try {
      if (!success) document.execCommand('copy');
      success = true;
    }
    catch (err) { }

    // Remove temporary textarea and restore previous focus
    document.body.removeChild(textArea);
    previousFocusElement.focus();

    return success;
  };

  // Copy JSON button
  document.querySelector('#copy-json').addEventListener('click', evt => {
    evt.preventDefault();
    copyToClipboard(output);
  });

})();