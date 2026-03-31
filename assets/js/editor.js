// Helper functions
// An array of short month names from Jan-Dec, in current locale
const monthsOfYear = [...Array(12)].map((_, i) => {
  const date = new Date(2000, i, 1);
  return date.toLocaleString(undefined, { month: 'short' });
});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const toSlug = str => str?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');


// Main
(async () => {

  // If this script is loaded with ".html" extension, redirect to "/"
  if (location.pathname.endsWith('.html')) {
    const url = location.pathname.replace(/[^/]+\.html$/, '');
    history.replaceState(null, null, url + location.search + location.hash);
  }

  const today = new Date();
  const startOfUTCToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getUTCDate()));

  // Init Datepicker
  // https://fengyuanchen.github.io/datepicker/
  // https://github.com/fengyuanchen/datepicker
  const dateField = $('[data-component="datepicker"]').datepicker({
    'container': '.datepicker-wrapper',
    'autoShow': false,
    'autoHide': false,
    'autoPick': false, // pick the initial date automatically when initialised
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
    // Trigger change event after datepicker selection
    setTimeout(() => {
      evt.target.dispatchEvent(new Event('change', {
        bubbles: true, cancelable: true, composed: true
      }));
    }, 1);
  });

  // Init Tinymce
  // https://www.tiny.cloud/docs/release-notes/release-notes50/
  const bodyField = document.querySelector('#body');
  tinymce.init({
    target: bodyField,
    content_css: [
      "https://fonts.googleapis.com/css?family=Open+Sans:400,400i,600&display=swap&",
      "/assets/css/webflow.9498fd7ed.css?",
      "/assets/css/main.css?",
      "/assets/css/tinymce-override.css?",
    ],
    cache_suffix: 'v=1', // update this if there are breaking changes in the stylesheet
    branding: false,
    contextmenu: false,
    draggable_modal: true,
    elementpath: true,
    plugins: 'anchor autolink charmap code emoticons image link lists media searchreplace paste',
    toolbar: 'bold italic underline superscript subscript link blockquote numlist bullist removeformat | undo redo | searchreplace code',
    menubar: false,
    statusbar: true,
    min_height: 320,
    custom_undo_redo_levels: 30,
    invalid_elements: 'script,style,div',

    // Paste Plugin Options
    paste_as_text: false,
    paste_block_drop: true,
    paste_data_images: true,
    paste_enable_default_filters: true,
    paste_filter_drop: true,
    //paste_word_valid_elements: 'b,strong,i,em,a,p,br,ul,ol,li',
    paste_webkit_styles: 'none',
    paste_retain_style_properties: '',
    paste_merge_formats: true,
    paste_tab_spaces: 0,
    paste_convert_word_fake_lists: true,
    paste_remove_styles_if_webkit: true,
    smart_paste: true,
    image_file_types: 'jpeg,jpg,png,gif,webp',
    paste_preprocess: (plugin, args) => { },
    paste_postprocess: (plugin, args) => {
      // Iterate through all children elements in args.node and remove all element attributes
      //   except for "href" in <a> tags and "src" in <img> tags
      [...args.node.querySelectorAll('*')].forEach(el => {
        const allowedAttrs = el.tagName === 'A' ? ['href'] : el.tagName === 'IMG' ? ['src'] : [];
        [...el.attributes].forEach(attr => {
          if (!allowedAttrs.includes(attr.name)) {
            el.removeAttribute(attr.name);
          }
        });
      });
    },

    // Callback
    setup: editor => {
      editor.on('change', evt => {
        // console.log({
        //   event: evt,
        //   editor,
        //   content: editor.getContent(),
        // });

        // If there are blockquotes with only a single paragraph, remove the inner paragraph
        [...editor.getBody().querySelectorAll('blockquote')].forEach(bq => {
          const p = bq.querySelector('p');
          if (p && !p.previousElementSibling && !p.nextElementSibling) {
            bq.innerHTML = p.innerHTML;
          }
        });

        // Update textarea
        const target = editor.targetElm;
        target.value = editor.getContent().replace(/[\n\r]+/, '');
        editor.targetElm.dispatchEvent(new Event('change', {
          bubbles: true, cancelable: true
        }));
      });
    }
  });

  const form = document.querySelector('#event-editor-form');
  const output = document.querySelector('#json-output');
  const importDropdown = document.querySelector('#import-event-selector');
  const linkedDropdown = document.querySelector('#linked-event-selector');
  const iconField = document.querySelector('#icon');
  const iconPreview = document.querySelector('#icon-preview');
  let isEditing = false;

  // Generate JSON from form fields
  const tryGenerateJson = () => {

    // Validate form
    if (!form.checkValidity()) {
      output.value = '';
      return;
    }

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
  const tryImportJson = async () => {
    form.reset();

    // Reset all tinymce editors
    tinymce.editors.forEach(editor => {
      editor.setContent('');
    });

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

      isEditing = true;

      // Scroll to top of page
      window.scrollTo(0, 0);

    } catch (err) { } // ignore errors

    // Format form fields
    await delay(15);
    [...form.elements].forEach(el => formatField(el));
  };

  // Format a form field
  const formatField = field => {
    field.value = field.value?.trim();

    const { name, value, tagName } = field;

    if (tagName === 'BUTTON') return;
    if (tagName === 'FIELDSET') return;
    if (value === undefined) return;

    // If has linked fields, toggle the other to required if not empty
    const notEmpty = field.value.length > 0;
    const pairField = document.querySelector(`#${field.dataset.pair}`);
    if (pairField) pairField.required = notEmpty;

    // If title and first letter is not uppercase, uppercase all words
    if (name === 'title' && notEmpty && !field.value.match(/^[A-Z]/)) {
      field.value = field.value.replace(/\b\w/g, l => l.toUpperCase());
    }

    // If slug format field
    if (name === 'slug' || name === 'linkedEvent') {
      field.value = toSlug(field.value);
    }

    // If linked event field
    if (name === 'linkedEvent') {
      // Prepend with #
      if (notEmpty && field.value[0] !== '#') {
        field.value = `#${field.value}`;
      }
      // Slug different from linked dropdown, reset linked dropdown
      const slug = field.value.replace(/^#/, '');
      if (slug !== linkedDropdown.value) {
        linkedDropdown.selectedIndex = 0;
      }
    }

    // If url field, and does not start with http, prepend with https://
    if (field.type === 'url' && notEmpty && !field.value.match(/^https?:\/\//)) {
      field.value = `https://${field.value}`;
    }

    // If icon field, try preview image
    if (name === 'icon') {
      // No src - Reset invalid error state
      if (field.value === '') {
        iconPreview.removeAttribute('src');
        field.setCustomValidity('');
      }
      else {
        iconPreview.src = field.value;
      }
    }

    // Validate field
    field.reportValidity();
  };

  // EVENT: Form field change
  form.addEventListener('change', evt => {
    const target = evt.target;
    formatField(target);
    tryGenerateJson();
  });

  // EVENT: Title field blur
  const titleField = document.querySelector('#title');
  const slugField = document.querySelector('#slug');
  titleField.addEventListener('blur', evt => {
    // Generate slug from title if creation mode
    if (slugField.value === '' || isEditing === false) {
      slugField.value = toSlug(titleField.value);
    }
  });

  // EVENT: RESET - Form reset
  form.addEventListener('reset', async evt => {
    isEditing = false;
    await delay(1);

    // Remove required attribute from link-grid and tags-grid
    [...form.querySelectorAll('.link-grid input, .tags-grid input')].forEach(el => {
      el.required = false;
    });

    // Reset datepicker value
    if (dateField[0].value === '') {
      dateField[0].value = `${startOfUTCToday.getUTCFullYear()}-${startOfUTCToday.getUTCMonth() + 1}-${startOfUTCToday.getUTCDate()}`;
      dateField.datepicker('update'); // sync datepicker with field
      dateField.datepicker('pick'); // update field with formatted date
    }

    // Clear image preview
    if (iconField.value === '') {
      iconPreview.removeAttribute('src');
      iconField.setCustomValidity('');
    }

    // Set selectedIndex for linked event and import dropdowns
    linkedDropdown && (linkedDropdown.selectedIndex = 0);
    importDropdown && (importDropdown.selectedIndex = 0);
  });

  // EVENT: CLICK - Clear button
  document.querySelector('#clear-form').addEventListener('click', async evt => {
    await delay(1);

    // Reset all tinymce editors
    tinymce.editors.forEach(editor => {
      editor.setContent('');
    });

    // In addition to form reset, clear output
    output.value = '';

    // Clear URL params
    history.replaceState(null, null, location.pathname);
  });

  // Preview image error state
  iconPreview.addEventListener('error', () => {
    // No src - ignore error
    if (iconPreview.src === '') return;
    iconField.setCustomValidity('Invalid image URL');
  });

  // EVENT: CLICK - Import JSON button
  document.querySelector('#import-json').addEventListener('click', evt => {
    tryImportJson();
  });

  // Init linked event and import dropdowns
  // EVENT: CHANGE - linked event dropdown
  // EVENT: CHANGE - import JSON dropdown
  if (linkedDropdown && importDropdown) {
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

        importDropdown.append(currentYearElem);
        linkedDropdown.append(currentYearElem.cloneNode(true));
      }

      // Create element html
      const eventEl = document.createElement('option');
      eventEl.value = event.slug || toSlug(event.title);
      eventEl.innerText = event.title;
      // if (eventEl.innerText.length < event.title.length) eventEl.innerText += '...';
      // // Append month
      // if (event.date_str?.length) {
      //  const month = Number(event.date_str.match(/-(\d\d)-/)?.pop());
      //  eventEl.innerText = `${monthsOfYear[month - 1]} - ${eventEl.innerText}`;
      // }

      importDropdown.append(eventEl);
      linkedDropdown.append(eventEl.cloneNode(true));
    });

    // Add event listener for linked event dropdown
    linkedDropdown.addEventListener('change', evt => {
      const slug = evt.target.value;
      const item = items.find(v => v.slug === slug);
      if (!item) return;

      // Update form field
      const linkedEvent = document.querySelector('#linkedEvent');
      linkedEvent.value = item.slug || item.title;

      // Trigger change event
      linkedEvent.dispatchEvent(new Event('change', {
        bubbles: true, cancelable: true
      }));
    });

    // Add event listener for import JSON dropdown
    importDropdown.addEventListener('change', evt => {
      const slug = evt.target.value;
      const item = items.find(v => v.slug === slug);

      // Replace URL
      window.history.replaceState(null, null, window.location.pathname + `?event=${slug}`);

      // Reset dropdown if not found
      if (!item) {
        importDropdown.selectedIndex = 0;
        return;
      }

      // Update output and import JSON
      output.value = JSON.stringify(item, null, 2) + ',';

      tryImportJson();
    });

    // If event slug was passed on page load, try to import
    const slug = new URLSearchParams(window.location.search).get('event');
    if (slug) {
      importDropdown.value = slug;
      importDropdown.dispatchEvent(new Event('change', {
        bubbles: true, cancelable: true
      }));
    }
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
    catch (err) { } // ignore errors

    // Method 2
    try {
      if (!success) document.execCommand('copy');
      success = true;
    }
    catch (err) { } // ignore errors

    // Remove temporary textarea and restore previous focus
    document.body.removeChild(textArea);
    previousFocusElement.focus();

    return success;
  };

  // EVENT: CLICK - Copy JSON button
  document.querySelector('#copy-json').addEventListener('click', evt => {
    copyToClipboard(output);
  });

})();