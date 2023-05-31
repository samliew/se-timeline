$(function () {

  // Helper: remove highlight
  const removeHighlight = function () {
    $('.event.highlight').removeClass('highlight');
  };
  // Helper: scroll to element
  const animateTo = function (scrollY) {
    $('html, body').stop(1).animate({
      scrollTop: scrollY
    }, 400);
  };
  // Helper: go to event
  const goToEvent = function (slug) {
    const elem = $('#' + slug).click();
    elem.addClass('highlight');
    setTimeout(removeHighlight, 2000);
  };
  // Helper: go to year
  const goToYear = function (year) {
    year = Number(year);
    if (!isNaN(year)) $(`.timeline-year[data-year="${year}"]`).click();
  };
  // Helper: string to tags
  const tagsStrToClass = function (str) {
    return str.toLowerCase().trim().split(/\s+/g)
      .map(v => 'tag-' + v.replace(/(^\W+|\W+$)/g, '').replace(/\W+/g, '-'))
      .join(' ');
  };

  const events = $('.event');

  // Remove unused elements
  $('.event-summary, .event-description, .event-link', events)
    .filter((i, el) => el.textContent == '').remove();

  // Resize small and large boxes
  $('.box').each(function () {
    var h = $(this).outerHeight();
    if (h < 180) $(this).parent().addClass('event-small');
    if (h > 260) $(this).parent().addClass('event-large');
  });

  // To turn autoscroll on, replace click with mouseover
  const topHeight = $('header').outerHeight() || 80;
  const offsetConstant = 108 + topHeight;
  $('.timeline').on('click', '.event', function () {
    history.replaceState(null, document.title, `${location.pathname}${location.search}#${this.id}`);
    animateTo($(this).offset().top - offsetConstant);
  }).on('click', '.timeline-year:not(.static-year)', function () {
    animateTo($(this).next().children().first().offset().top - offsetConstant);
  }).on('click', '.linked-event', function (evt) {
    evt.stopPropagation();
    goToEvent(this.hash.substr(1));
    return false;
  });

  // Apply fake permalinks (dynamic link anchors) to events
  let scrollToPermalink = () => { };
  $('.event-name').each(function (i, el) {
    const slug = el.textContent.toLowerCase().replace(/[^\w\s]+/g, '').replace(/\s+/g, '-').trim();
    const evt = $(this).parents('.event').attr('id', (i, v) => v ? v : slug);

    // On page load scroll to item if match hash
    if (slug === location.hash.substr(1)) {
      scrollToPermalink = function () {
        setTimeout(function () {
          animateTo(evt.offset().top - offsetConstant);
          evt.addClass('highlight');
          setTimeout(removeHighlight, 2000);
        }, 200);
      };
      scrollToPermalink();
    }
  });

  // Year selector and sidebar nav
  const yearPicker = $('#year-picker').empty().on('input', function (i, el) {
    goToYear(this.value);
  }).on('click', 'option', function (i, el) {
    goToYear(this.value);
  });
  const sidenav = $('#sidebar').empty().on('click', 'a[data-year]', function (i, el) {
    yearPicker.focus();
    goToYear(this.dataset.year);
  });
  // Build
  const years = $('.timeline-year:not(.static-year)').each(function () {
    const year = Number(this.textContent.trim());
    if (!isNaN(year)) {
      this.dataset.year = year;
      yearPicker.append(`<option value="${year}">${year}</option>`);
      sidenav.append(`<a data-year="${year}">${year}</a>`);
    }
  });
  // Recalculate on page scroll
  const reversedYears = years.get().reverse();
  const sidenavLinks = sidenav.children('a');
  scrollUpdateCurrentYear = function () {
    const scrTop = $(document).scrollTop();
    const prev = reversedYears.filter(function (el, i) {
      return $(el).offset().top - 80 <= scrTop;
    });
    // Set dropdown to current year

    if (prev.length) {
      yearPicker.val(prev[0].dataset.year);
      sidenavLinks.removeClass('current-year')
        .filter(`[data-year="${prev[0].dataset.year}"]`).addClass('current-year');
    } else { // default to first
      yearPicker.val(reversedYears[reversedYears.length - 1].dataset.year);
      sidenavLinks.removeClass('current-year').first().addClass('current-year');
    }
  };
  $(document).on('load scroll', $.debounce(50, scrollUpdateCurrentYear));

  // Show sidebar when mouse near right hand side
  const mouseNearby = Math.min(180, document.body.clientWidth * 0.15); // pixels within this area next to sidebar
  let sidebarTimeout;
  const mousemoveUpdateSidebar = function (event) {
    if (sidebarTimeout) clearTimeout(sidebarTimeout);
    let active = event.pageX + 100 > $(document).outerWidth();
    if (active) {
      sidenav.addClass('sidebar-open');
    } else {
      // hide after a short delay, if no further interruptions
      sidebarTimeout = setTimeout(function () {
        sidenav.removeClass('sidebar-open');
      }, 400);
    }
  };
  $(document).on('mousemove', $.debounce(10, e => mousemoveUpdateSidebar(e)));

  const tags = $('.event-tags');
  // Pre-process - set tags as a class for better filter toggling
  tags.each(function (i, el) {
    $(this).closest('.event').addClass(tagsStrToClass(el.textContent));
  });
  // Toggle descr
  $('#event-descriptions').change(function () {
    const chk = !this.checked;
    $('#timeline').toggleClass('hide-descriptions', chk);
  });
  // Filter tags
  $('#mod-resignations').change(function () {
    const chk = !this.checked;
    events.filter('.tag-moderator.tag-resignation, .tag-moderator.tag-reinstatement')
      .toggleClass('event-hidden', chk);
  });
  $('#staff-resignations').change(function () {
    const chk = !this.checked;
    events.filter('.tag-staff.tag-resignation')
      .toggleClass('event-hidden', chk);
  });
  $('#site-graduations').change(function () {
    const chk = !this.checked;
    events.filter('.tag-site-graduation')
      .toggleClass('event-hidden', chk);
  });

  // Back to top
  $('#back-to-top').click(function () {
    animateTo(0);
  });

  // Tooltips for discuss links
  $('.event a:not([title])').each(function () {
    this.title = this.href;
  });

});