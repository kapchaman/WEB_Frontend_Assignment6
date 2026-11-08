/* Task 2 additions. jQuery is the only animation and event library. */
(function ($) {
  'use strict';
  let $panel = null;
  let currentName = null;
  let requestedName = null;
  let closing = false;
  let finishMove = null;
  const sorted = {};

  function guestByName(name) {
    return $('#house .guest').filter(function () { return $(this).attr('data-name') === name; });
  }
  function avatarBox(name) {
    const $avatar = guestByName(name).find('.avatar-ring');
    if (!$avatar.length) return { left: 0, top: 0, width: 55, height: 55 };
    const offset = $avatar.offset();
    return { left: offset.left - $(window).scrollLeft(), top: offset.top - $(window).scrollTop(), width: $avatar.outerWidth(), height: $avatar.outerHeight() };
  }
  function removePanel() {
    if ($panel) $panel.stop(true, false).remove();
    $panel = null; currentName = null; requestedName = null; closing = false;
  }
  function openRequested() {
    const name = requestedName;
    const $guest = guestByName(name);
    if (!name || !$guest.length) return;
    currentName = name;
    const g = Party.readGuest($guest);
    const roomId = $guest.closest('.room').attr('id');
    const roomName = $guest.closest('.room').attr('data-name');
    $panel = $('<section>', { class: 'detail-panel', role: 'dialog', 'aria-label': g.name + ' guest details' }).css(avatarBox(name)).appendTo('body');
    $('<button>', { class: 'detail-close', type: 'button', text: '×', 'aria-label': 'Close guest details' }).appendTo($panel);
    $guest.find('.avatar-ring').clone().css('--clothing', $guest.css('--clothing')).appendTo($panel);
    $('<h2>', { text: g.name }).appendTo($panel);
    $('<p>', { text: 'Came at ' + g.arrival + ' · Wearing ' + g.color }).appendTo($panel);
    $('<p>', { text: g.aitu ? 'AITU student' : 'Not an AITU student' }).appendTo($panel);
    const words = $.map(g.things, function (item) { return { phone: 'a phone', bag: 'a bag', cup: 'a cup', glasses: 'glasses', crumbs: 'crumbs' }[item]; });
    const list = words.length > 1 ? words.slice(0, -1).join(', ') + ' and ' + words[words.length - 1] : words[0];
    $('<p>', { text: words.length ? 'Has ' + list : 'Has no things' }).appendTo($panel);
    $('<p>', { text: 'Currently in the ' + roomName.toLowerCase() }).appendTo($panel);
    $('<div>', { class: 'detail-label', text: 'SEND TO ANOTHER ROOM' }).appendTo($panel);
    const $buttons = $('<div>', { class: 'move-buttons' }).appendTo($panel);
    $.each(Party.rooms, function (_, room) {
      if (room.id !== roomId) $('<button>', { type: 'button', class: 'move-button', 'data-room': room.id, text: 'Move to the ' + room.name.toLowerCase() }).appendTo($buttons);
    });
    const width = Math.min(410, $(window).width() - 28);
    const height = 382;
    $panel.stop(true, false).animate({ left: ($(window).width() - width) / 2, top: Math.max(14, ($(window).height() - height) / 2), width: width, height: height }, 260, function () {
      $(this).find('.detail-close').trigger('focus');
    });
  }
  function closeThenOpenRequested() {
    if (!$panel) { openRequested(); return; }
    if (closing) return; // Later clicks only replace requestedName.
    closing = true;
    $panel.stop(true, false).animate(avatarBox(currentName), 220, function () {
      $(this).remove(); $panel = null; currentName = null; closing = false;
      openRequested();
    });
  }
  function chooseGuest(name) {
    Party.finishCase();
    requestedName = name;
    if (currentName === name && !closing) return;
    closeThenOpenRequested();
  }

  // FLIP: keep each card at its CURRENT screen position after DOM reordering,
  // then animate its left/top offsets to zero. Retargeting avoids queue build-up.
  function reorder($list, elements) {
    const positions = new Map();
    $list.children('.guest').each(function () {
      $(this).stop('layout', true, false);
      positions.set(this, $(this).offset());
    });
    $.each(elements, function (_, element) { $(element).css({ left: 0, top: 0 }).appendTo($list); });
    $list.children('.guest').each(function () {
      const before = positions.get(this);
      const after = $(this).offset();
      $(this).css({ left: before.left - after.left, top: before.top - after.top })
        .animate({ left: 0, top: 0 }, { duration: 450, queue: 'layout' }).dequeue('layout');
    });
  }
  function sortRoom(id) {
    if (finishMove) finishMove();
    Party.finishCase();
    const $list = $('#' + id + ' .guest-list');
    sorted[id] = !sorted[id]; // Toggle logical state even while a previous animation runs.
    const baseNames = $.map(Party.rooms.filter(function (r) { return r.id === id; })[0].guests, function (g) { return g.name; });
    const elements = $list.children('.guest').get().sort(function (a, b) {
      if (sorted[id]) return +$(a).attr('data-minutes') - +$(b).attr('data-minutes');
      const aIndex = baseNames.indexOf($(a).attr('data-name'));
      const bIndex = baseNames.indexOf($(b).attr('data-name'));
      // Miras is a temporary case insertion, absent from the persistent array.
      const rank = function (node, index) { return index < 0 ? baseNames.indexOf('Askar') + 0.5 : index; };
      return rank(a, aIndex) - rank(b, bIndex);
    });
    reorder($list, elements);
    $('#' + id + ' .sort-button').text(sorted[id] ? 'Restore picture order' : 'Sort by time').attr('aria-pressed', String(sorted[id]));
  }

  function moveGuest(name, destinationId) {
    if (finishMove) finishMove();
    Party.finishCase();
    removePanel();
    const $guest = guestByName(name);
    if (!$guest.length) return;
    const sourceId = $guest.closest('.room').attr('id');
    if (sourceId === destinationId) return;
    const g = Party.readGuest($guest);
    const destination = Party.rooms.filter(function (r) { return r.id === destinationId; })[0];
    // Commit the move immediately, so the next case rebuild uses the new location.
    // A scenario may temporarily relocate Miras; remove his persistent copy too.
    $.each(Party.rooms, function (_, room) {
      room.guests = room.guests.filter(function (item) { return item.name !== name; });
    });
    destination.guests.push(g);
    $guest.stop('layout', true, false);
    const start = $guest.offset();
    const width = $guest.outerWidth(true);
    const $oldSlot = $('<div>', { class: 'move-slot' }).css('width', width).insertBefore($guest);
    const $destinationList = $('#' + destinationId + ' .guest-list');
    const $newSlot = $('<div>', { class: 'move-slot' }).css('width', 0).appendTo($destinationList);
    const $flight = $guest.clone().removeClass('guest').addClass('flight').css({
      width: $guest.outerWidth(), height: $guest.outerHeight(), opacity: 1,
      left: start.left - $(window).scrollLeft(), top: start.top - $(window).scrollTop()
    }).appendTo('body');
    // flight keeps the same card styling while it is outside the room.
    $flight.addClass('guest');
    $guest.detach();
    const end = $newSlot.offset();
    let complete = false;
    finishMove = function () {
      if (complete) return;
      complete = true;
      $flight.stop(true, false).remove();
      $oldSlot.stop(true, false).remove();
      $newSlot.stop(true, false).replaceWith($guest.css({ opacity: 1, left: 0, top: 0 }));
      finishMove = null;
    };
    $oldSlot.animate({ width: 0 }, 500);
    $newSlot.animate({ width: width }, 500);
    $flight.animate({ left: end.left - $(window).scrollLeft(), top: end.top - $(window).scrollTop() }, 500, finishMove);
    // Keep the toggle state: a sorted room must still offer Restore picture order.
    // The moved guest goes last as required, even when the room was sorted.
    $('.toast').stop(true, false).remove();
    $('<div>', { class: 'toast', role: 'status', text: name + ' moved to the ' + destination.name.toLowerCase() }).appendTo('body').delay(1800).fadeOut(200, function () { $(this).remove(); });
  }
  Party.motion = {
    reset: function () {
      removePanel();
      if (finishMove) finishMove();
      $.each(sorted, function (id) { delete sorted[id]; });
      $('.toast').stop(true, false).remove();
    }, settleMove: function () { if (finishMove) finishMove(); },
    sortRoom: sortRoom, moveGuest: moveGuest
  };
  $(function () {
    $('#house').on('click', '.guest', function (event) { event.stopPropagation(); chooseGuest($(this).attr('data-name')); });
    $('#house').on('click', '.sort-button', function () { sortRoom($(this).attr('data-room')); });
    $(document).on('click', '.detail-close', function () { requestedName = null; closeThenOpenRequested(); });
    $(document).on('click', '.move-button', function () { moveGuest(currentName, $(this).attr('data-room')); });
    $(document).on('click', function (event) {
      if ($panel && !$(event.target).closest('.detail-panel, .guest').length) { requestedName = null; closeThenOpenRequested(); }
    }).on('keydown', function (event) {
      if (event.key === 'Escape') { requestedName = null; closeThenOpenRequested(); }
    });
    $(window).on('resize', function () {
      removePanel(); if (finishMove) finishMove();
      Party.finishCase();
      $('#house .guest').stop('layout', true, true).css({ left: 0, top: 0 });
    });
  });
})(jQuery);
