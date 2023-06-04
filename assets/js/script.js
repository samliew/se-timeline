/* ===== HELPER FUNCTIONS ===== */

// Scroll to element
const animateTo = function (scrollY) {
  if ($ && $.fn && $.fn.animate) {
    $('html, body').stop(1).animate({
      scrollTop: scrollY
    }, 400);
  }
};
// Highlight and go to event
const goToEvent = function (slug) {
  const elem = document.querySelector('#' + slug);
  if (!elem) return;
  elem.click();
  elem.classList.add('highlight');

  // Remove highlight after short delay
  setTimeout(() => {
    elem.classList.remove('highlight');
  }, 2000);
};
// Go to first element in year (latest event)
const goToYear = function (year) {
  year = Number(year);
  if (!isNaN(year)) $(`.timeline-year[data-year="${year}"]`).click();
};
// String to tags
const tagsStrToClass = function (str) {
  return str.toLowerCase().trim().split(/\s+/g)
    .map(v => 'tag-' + v.replace(/(^\W+|\W+$)/g, '').replace(/\W+/g, '-'))
    .join(' ');
};



/* ===== TIMELINE INIT/BUILDER FUNCTIONS ===== */
const createYearGroupElem = year => {
  // Validation
  const y = Number(year);
  if (isNaN(y) || y < 1970 || Math.round(y) !== y || y > (new Date()).getFullYear()) {
    console.error('Invalid year:', year);
    return;
  }

  const yearEl = document.createElement('div');
  yearEl.classList.add('year-group');
  yearEl.innerHTML = `<h2 class="timeline-year" data-year="${y}">${y}</h2><div class="events-list"></div>`;
  return yearEl;
};

const createEventElem = event => {
  // Validate required fields
  if (!event.title) {
    console.error('Event missing title:', event);
    return;
  }
  if (!event.date_str) {
    console.error('Event missing date_str:', event);
    return;
  }

  // Defaults
  event.classes = event.classes ?? [];

  const slug = event.slug || event.title?.toLowerCase().replace(/\W+/g, '-');
  const tags = event.tags?.map(tag => {
    const { text, url, isMse } = tag;
    return `<a href="${url ?? '#'}" class="tag ${isMse ? 'meta-se-tag' : ''}">${text}</a>`;
  }).join('');
  const buttons = event.links?.map(link => {
    const { text, url } = link;
    return `<a href="${url ?? '#'}" class="button event-button">${text}</a>`;
  }).join('');
  const linkedEventLink = !event.linkedEvent ? '' :
    `<a href="${event.linkedEvent}" class="linked-event">linked event</a>`;

  const eventEl = document.createElement('div');
  eventEl.classList.add('event', ...event.classes);
  eventEl.id = slug;
  eventEl.innerHTML = `
<div class="event-tags less-important">
  <div class="inline">${event.type ?? ''}</div>
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
  <div class="event-date">
    <div class="date date-from">${event.date_str}</div>
  </div>
  <h4 class="event-name">${event.title}</h4>
  <div class="event-summary">${event.summary ?? ''}</div>
  <div class="event-description w-richtext">
    ${event.body ?? ''}
  </div>
  <div class="event-tags">${tags}<div>
  ${buttons ?? ''}
  ${linkedEventLink ?? ''}
</div>`;

  return eventEl;
};

const buildTimeline = async () => {

  // Build timeline from json
  let currentYear = 0, currentYearEventsElem;
  const timelineEl = document.querySelector('#timeline > .events-container');
  timelineEl.querySelectorAll('.year-group').forEach(v => v.remove());

  const { items } = await $.getJSON('./timeline_data.json');
  items.forEach(event => {

    // Assumes items are already sorted by year
    const year = event.date_str?.slice(0, 4);
    if (!year) return;

    // New year
    if (currentYear !== year) {
      currentYear = year;
      const currentYearElem = createYearGroupElem(year);
      currentYearEventsElem = currentYearElem.querySelector('.events-list');
      timelineEl.append(currentYearElem);
    }

    // Create element html
    const eventEl = createEventElem(event);
    currentYearEventsElem.append(eventEl);
  });

  // Move "beginning" to end
  const beginning = [...timelineEl.querySelectorAll('.static-year')].pop();
  timelineEl.append(beginning);

  // Remove unused/empty elements
  document.querySelectorAll('.event-summary, .event-description, .event-link').forEach(el => {
    if (el.textContent?.trim() === '') el.remove();
  });

  // Resize small and large boxes
  document.querySelectorAll('.box').forEach(el => {
    const $el = $(el);
    var h = $el.outerHeight();
    if (h < 180) $el.parent().addClass('event-small');
    if (h > 260) $el.parent().addClass('event-large');
  });

  // Show url in tooltips for links that don't have a title
  document.querySelectorAll('.event a:not([title])').forEach(el => {
    el.title = el.href;
  });
};

const initYearNav = () => {

  // Add year selector and sidebar nav
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
  const scrollUpdateCurrentYear = function () {
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


  // Show desktop sidebar when mouse near right hand side
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
};



/* ===== MAIN FUNCTION ===== */
$(async function () {
  await buildTimeline();
  initYearNav();

  // When event box is clicked, scroll to it
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


  // Apply id slugs to events that does not have one
  $('.event-name').each(function (i, el) {
    const slug = el.textContent.toLowerCase().replace(/[^\w\s]+/g, '').replace(/\s+/g, '-').trim();
    const eventEl = $(this).parents('.event').attr('id', (i, v) => v ? v : slug);

    // On page load scroll to item if match hash
    if (slug === location.hash?.slice(1)) {
      const scrollToPermalink = function () {
        animateTo(eventEl.offset().top - offsetConstant);
        eventEl.addClass('highlight');
        setTimeout(() => {
          document.querySelectorAll('.event.hightlight').forEach(el => el.classList.remove('highlight'));
        }, 2000);
      };
      setTimeout(scrollToPermalink, 100);
    }
  });


  // Pre-process - set tags as a class for better filter toggling
  const events = $('.event');
  const tags = $('.event-tags');
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
    return false;
  });

});