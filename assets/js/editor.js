(() => {

  console.clear();

  // Init Datepicker
  // https://fengyuanchen.github.io/datepicker/
  // https://github.com/fengyuanchen/datepicker
  $('[data-component="datepicker"]').datepicker({
    'autoShow': false,
    'autoHide': false,
    'autoPick': false,
    'format': 'yyyy-mm-dd',
    'inline': true,
    'endDate': new Date(),
    'startView': 2,
    'weekStart': 0,
    'yearFirst': false,
    'container': '.datepicker-wrapper',
    'zIndex': 1,
    'daysMin': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  }).on('pick.datepicker', evt => {
    evt.target.dispatchEvent(new Event('change'));
    evt.target.reportValidity();
  });

  // Init Tinymce
  // https://www.tiny.cloud/docs/release-notes/release-notes50/
  tinymce.init({
    selector: '#body',
    branding: false,
    contextmenu: false,
    draggable_modal: true,
    elementpath: false,
    plugins: 'anchor autolink charmap code emoticons image link lists media searchreplace',
    toolbar: 'bold italic underline link numlist bullist removeformat | undo redo | searchreplace code',
    menubar: false,
    statusbar: false,
    min_height: 300,
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

    // Add body
    data.body = tinymce.activeEditor.getContent();

    // Join multiple values (from checkboxes) into array
    const join = key => {
      const values = formData.getAll(key);
      data[key] = values;
    };
    join('classes');

    // Join links
    const linkText = formData.getAll('linkText');
    data.links = formData.getAll('linkUrl')
      .map((url, i) => ({ text: linkText[i], url }))
      .filter(v => v.text && v.url); // remove empty links
    delete data.linkText;
    delete data.linkUrl;

    // Join tags
    const tagText = formData.getAll('tagText');
    data.tags = formData.getAll('tagUrl')
      .map((url, i) => ({ text: tagText[i], url }))
      .filter(v => v.text && v.url); // remove empty links
    delete data.tagText;
    delete data.tagUrl;

    // Output JSON
    const json = JSON.stringify(data, null, 2);
    output.value = json;
  };

  // Import JSON to form fields
  const tryImportJson = () => {
    try {
      const json = JSON.parse(output.value);
      Object.entries(json).forEach(([key, value]) => {
        const field = document.querySelector(`#${key}`);
        if (field) field.value = value;
      });
    } catch (e) { } // ignore errors
  };

  // Form field change
  form.addEventListener('change', evt => {
    const target = evt.target;
    target.value = target.value.trim();
    target.reportValidity();

    // If has linked fields, toggle the other to required if not empty
    const notEmpty = target.value.length > 0;
    const pairField = document.querySelector(`#${target.dataset.pair}`);
    if (pairField) pairField.required = notEmpty;

    // If linkedEvent field, and not empty, prepend with #
    if (target.id === 'linkedEvent' && notEmpty && target.value[0] !== '#') {
      target.value = `#${target.value}`;
    }

    tryGenerateJson();
  });

})();