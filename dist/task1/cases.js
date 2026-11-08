/* Every run function returns ONE jQuery chain. Predicates inspect DOM cards only. */
window.PartyCases = [
  { title: 'Who is in the hall?', run: function () {
    return $('#hall .guest');
  }},
  { title: 'Yellow or purple clothes', run: function () {
    return $('.guest.color-yellow, .guest.color-purple');
  }},
  { title: 'AITU students upstairs', run: function () {
    return $('.floor[data-floor="2"] .guest.aitu');
  }},
  { title: 'Glasses or a bag', run: function () {
    return $('.guest.has-glasses, .guest.has-bag');
  }},
  { title: 'Came with nothing', run: function () {
    return $('.guest[data-things="0"]');
  }},
  { title: 'Phone, but no bag', run: function () {
    return $('.guest.has-phone').not('.has-bag');
  }},
  { title: 'Arrived from 20:30 to 21:00', run: function () {
    return $('.guest').filter(function () {
      return +$(this).attr('data-minutes') >= 1230 && +$(this).attr('data-minutes') <= 1260;
    });
  }},
  { title: 'After 21:00, not an AITU student', run: function () {
    return $('.guest').not('.aitu').filter(function () {
      return +$(this).attr('data-minutes') > 1260;
    });
  }},
  { title: 'Immediately next to Askar', run: function () {
    return $('.guest[data-name="Askar"]').prev('.guest').add($('.guest[data-name="Askar"]').next('.guest'));
  }},
  { title: 'Last guest in each room', run: function () {
    return $('.guest-list > .guest:last-child');
  }},
  { title: 'Third guest in each room', run: function () {
    return $('.guest-list > .guest:nth-child(3)');
  }},
  { title: 'Everyone after Timur', run: function () {
    return $('.guest[data-name="Timur"]').nextAll('.guest');
  }},
  { title: 'Immediately before someone in black', run: function () {
    return $('.guest.color-black').prev('.guest');
  }},
  { title: 'The room with Aruzhan', kind: 'rooms', run: function () {
    return $('.guest[data-name="Aruzhan"]').closest('.room');
  }},
  { title: 'Rooms with fewer than 6 guests', kind: 'rooms', run: function () {
    return $('.room').filter(function () {
      return $(this).find('.guest').length < 6;
    });
  }},
  { title: 'A cup in the room, but no glasses', kind: 'rooms', run: function () {
    return $('.room').has('.guest.has-cup').not(':has(.guest.has-glasses)');
  }},
  { title: 'Earliest arrival in each room', run: function () {
    return $('.guest').filter(function () {
      const minutes = +$(this).attr('data-minutes');
      return $(this).siblings('.guest').filter(function () {
        return +$(this).attr('data-minutes') < minutes;
      }).length === 0;
    });
  }},
  { title: 'Miras joins Askar and Inkar', run: function () {
    return Party.getOrMakeGuest({ name: 'Miras', color: 'blue', arrival: '21:20', aitu: true, things: ['phone'] })
      .hide().insertAfter('.guest[data-name="Askar"]').fadeIn(350);
  }},
  { title: 'Natasha goes home', run: function () {
    return $('.guest[data-name="Natasha"]').animate({ top: -10 }, 140).animate({ top: 0 }, 160).fadeOut(350, function () {
      $(this).remove();
      $('#house').attr('aria-busy', 'false');
    });
  }},
  { title: 'Who took the birthday cake?', run: function () {
    return $('.floor[data-floor="1"] .guest.has-crumbs').not('.has-cup').filter(function () {
      const minutes = +$(this).attr('data-minutes');
      return minutes > 1260 && minutes < 1290 &&
        ($(this).prev('.guest').is('.aitu') || $(this).next('.guest').is('.aitu'));
    });
  }}
];
