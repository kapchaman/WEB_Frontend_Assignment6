/* Rendering and interaction shared by the copied Task 1 and Task 2 versions. */
(function ($) {
  'use strict';
  const colors = { green: '#41946b', black: '#27312e', yellow: '#e4b943', purple: '#9271ba', blue: '#518fc3', red: '#c76a5c' };
  const icons = { phone: '▯', cup: '☕', bag: '▣', glasses: '👓', crumbs: '⁙' };
  const rooms = $.extend(true, [], PartyData);
  const motion = $('body').attr('data-task') === '2';
  let version = 0;

  function makeGuest(g) {
    const time = g.arrival.split(':');
    const $card = $('<button>', { type: 'button', class: 'guest color-' + g.color + (g.aitu ? ' aitu' : ''),
      'aria-label': g.name + ', arrived ' + g.arrival,
      'data-name': g.name, 'data-color': g.color, 'data-arrival': g.arrival,
      'data-minutes': +time[0] * 60 + +time[1], 'data-things': g.things.length,
      'data-items': g.things.join(',') }).css('--clothing', colors[g.color]);
    $.each(g.things, function (_, item) { $card.addClass('has-' + item); });
    $('<span>', { class: 'avatar-ring' }).append($('<img>', { src: '../assets/avatars/' + g.name + '.svg', alt: '', draggable: false })).appendTo($card);
    $('<strong>', { class: 'guest-name', text: g.name }).appendTo($card);
    $('<span>', { class: 'arrival', text: g.arrival }).appendTo($card);
    const $things = $('<span>', { class: 'things', 'aria-label': g.things.join(', ') || 'No things' }).appendTo($card);
    $.each(g.things, function (_, item) { $('<span>', { text: icons[item], title: item, 'aria-label': item }).appendTo($things); });
    if (!g.things.length) $things.text('—');
    $('<span>', { class: 'badge ' + (g.aitu ? 'student' : 'visitor'), text: g.aitu ? 'AITU' : 'GUEST' }).appendTo($card);
    return $card;
  }

  function render() {
    version++;
    if (Party.motion) Party.motion.reset();
    $('#house .guest').stop('layout', true, true).finish();
    $('#house').empty().attr('aria-busy', 'false');
    $.each([2, 1], function (_, floor) {
      const $floor = $('<section>', { class: 'floor', 'data-floor': floor }).appendTo('#house');
      $('<div>', { class: 'floor-heading' }).append($('<span>', { text: floor === 2 ? '02 / UPSTAIRS' : '01 / DOWNSTAIRS' }), $('<span>', { text: floor === 2 ? 'The gathering' : 'The missing cake' })).appendTo($floor);
      const $rooms = $('<div>', { class: 'rooms' }).appendTo($floor);
      $.each(rooms, function (_, room) {
        if (room.floor !== floor) return;
        const $room = $('<section>', { class: 'room', id: room.id, 'data-name': room.name }).appendTo($rooms);
        const $heading = $('<div>', { class: 'room-heading' }).appendTo($room);
        $('<h2>', { text: room.name }).appendTo($heading);
        if (motion) $('<button>', { class: 'sort-button', type: 'button', text: 'Sort by time', 'data-room': room.id, 'aria-pressed': 'false' }).appendTo($heading);
        const $list = $('<div>', { class: 'guest-list' }).appendTo($room);
        $.each(room.guests, function (_, g) { makeGuest(g).appendTo($list); });
      });
    });
  }

  // Finish the whole case effect queue, including fadeOut's removal callback.
  function finishCase() {
    $('#house .guest').finish();
    $('#house').attr('aria-busy', 'false');
  }

  function getOrMakeGuest(g) {
    const $existing = $('#house .guest').filter(function () { return $(this).attr('data-name') === g.name; });
    return $existing.length ? $existing.first() : makeGuest(g);
  }

  function runCase(index) {
    render(); // Reset temporary case changes; persistent moves live in rooms.
    $('#house').attr('aria-busy', 'true');
    const current = PartyCases[index];
    $('.case-button').removeClass('active').attr('aria-pressed', 'false').eq(index).addClass('active').attr('aria-pressed', 'true');
    const $found = current.run();
    const isRoom = current.kind === 'rooms';
    const $guests = isRoom ? $found.find('.guest') : $found;
    $found.addClass('found');
    const names = $found.map(function () { return $(this).attr('data-name'); }).get();
    $('#result-title').text('Case ' + (index + 1) + ' · ' + current.title);
    $('#result-count').text(names.length);
    $('#result-unit').text(isRoom ? 'rooms found' : index === 19 ? 'suspect found' : 'guests found');
    $('#result-names').text(names.join(' · ') || 'No matches');
    $('#chain').text(current.run.toString().replace(/^function\s*\(\)\s*\{\s*return\s*/, '').replace(/;?\s*\}$/, ''));
    // Removal destroys jQuery's queue data, so do not await a promise on that card.
    if (index === 18) {
      if (motion) $('.guest').not($found).stop(true, false).fadeTo(300, 0.2);
      return; // Case 19 performs its jump, fade and completion in its own chain.
    }
    // Wait for insertion to finish before starting the jump.
    const token = version;
    $found.promise().done(function () {
      if (version !== token) return;
      const $connected = $guests.filter(function () { return $.contains(document, this); });
      if (motion) $('.guest').not($connected).stop(true, false).fadeTo(300, 0.2);
      $connected.animate({ top: -10 }, 140).animate({ top: 0 }, 160).promise().done(function () {
        if (version === token) $('#house').attr('aria-busy', 'false');
      });
    });
  }

  window.Party = {
    rooms: rooms, makeGuest: makeGuest, getOrMakeGuest: getOrMakeGuest,
    render: render, runCase: runCase, finishCase: finishCase,
    readGuest: function ($guest) {
      return { name: $guest.attr('data-name'), color: $guest.attr('data-color'), arrival: $guest.attr('data-arrival'),
        aitu: $guest.hasClass('aitu'), things: $guest.attr('data-items') ? $guest.attr('data-items').split(',') : [] };
    }
  };

  $(function () {
    $('#task-number').text(motion ? 'TASK 02 / THE PARTY IN MOTION' : 'TASK 01 / SELECTOR DETECTIVE');
    $('#other-task').attr('href', motion ? '../task1/index.html' : '../task2/index.html').text(motion ? 'Open Task 1 ↗' : 'Open Task 2 ↗');
    $.each(PartyCases, function (index, c) {
      $('<button>', { type: 'button', class: 'case-button', 'data-case': index, 'aria-pressed': 'false' })
        .append($('<span>', { class: 'case-number', text: String(index + 1).padStart(2, '0') }), $('<span>', { text: c.title })).appendTo('#cases');
    });
    render();
    $('#cases').on('click', '.case-button', function () { runCase(+$(this).attr('data-case')); });
    $('#clear').on('click', function () {
      version++; // Invalidate any pending case animation callback.
      $('#house').attr('aria-busy', 'false');
      if (Party.motion) Party.motion.settleMove();
      finishCase();
      $('#house .guest').fadeTo(300, 1);
      $('.found').removeClass('found');
      $('.case-button').removeClass('active').attr('aria-pressed', 'false');
      $('#result-title').text('Board cleared'); $('#result-names').text('All guests are visible. Select a case to investigate.');
      $('#result-count').text($('.guest').length); $('#result-unit').text('guests visible'); $('#chain').text('Choose a case to inspect its jQuery chain.');
    });
    $('#reset').on('click', function () { window.location.reload(); });
    if (!motion) $('#interaction-hint').text('Choose a case. Every search starts from the original party.');
  });
})(jQuery);
