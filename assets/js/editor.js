(() => {

  // Datepicker defaults
  $.fn.datepicker.setDefaults({
    'autoShow': false,
    'autoHide': true,
    'autoPick': false,
    'format': 'yyyy-mm-dd',
    'inline': false,
    'endDate': new Date(),
    'startView': 2,
    'weekStart': 0,
    'yearFirst': false,
    'daysMin': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  });

  // Init Datepicker
  $('[data-component="datepicker"]').datepicker();

})();