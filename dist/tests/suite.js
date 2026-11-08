(function ($) {
  'use strict';
  const expected = [
    'Arman,Sophia,Dias,Bekzat,Aruzhan,Saule', 'Arman,Sophia,Bekzat,Sergey,Natasha,Inkar',
    'Aigerim,Ivan,Sophia,Dias,Aruzhan', 'Madina,Arman,Bekzat,Saule,Emma,Timur,Yerlan,Daniel,Zarina,Inkar',
    'Dias,Sergey,Natasha', 'Aliya,Sophia,Aruzhan,Nurlan,Yerlan,Askar',
    'Aigerim,Arman,Bekzat,Sergey,Natasha,Askar', 'Aliya,Madina,Saule,Zarina', 'Natasha,Inkar',
    'Ivan,Saule,Kamila,Inkar', 'Madina,Dias,Timur,Natasha', 'Sergey,Yerlan,Kamila',
    'Aigerim,Madina,Nurlan,Natasha', 'Hall', 'Balcony,Living room', 'Balcony', 'Ivan,Dias,Nurlan,Daniel',
    'Miras', 'Natasha', 'Zarina'
  ];
  const results = [];
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const names = $cards => $cards.map(function () { return $(this).attr('data-name'); }).get().join(',');
  let q, win;
  async function open(task) {
    await new Promise((resolve, reject) => {
      $('#preview').one('load', function () {
        win = this.contentWindow; q = win.jQuery;
        if (!q) { reject(new Error('jQuery did not load')); return; }
        q(resolve);
      }).attr('src', '../task' + task + '/index.html?test=' + Date.now());
    });
  }
  const clickCase = number => q('.case-button[data-case="' + (number - 1) + '"]').trigger('click');
  const guest = name => q('#house .guest[data-name="' + name + '"]');
  const sort = room => q('#' + room + ' .sort-button').trigger('click');
  async function settle() { await delay(800); }
  function idle() {
    assert(q('#house').attr('aria-busy') === 'false', 'House is stuck busy');
    assert(q('.guest:animated').length === 0, 'Guest animations still running');
    assert(q('.flight,.move-slot').length === 0, 'Movement placeholders remain');
  }
  function opacity(value, selector) {
    q(selector || '#house .guest').each(function () {
      assert(Math.abs(+q(this).css('opacity') - value) < 0.01, q(this).attr('data-name') + ': wrong opacity');
    });
  }
  async function check(name, action) {
    try { await action(); results.push({name, passed:true}); }
    catch (error) { results.push({name, passed:false, error:error.message}); }
    const result = results[results.length - 1];
    $('<li>', {class:result.passed ? 'pass' : 'fail', text:(result.passed ? 'PASS ' : 'FAIL ') + name + (result.error ? ': ' + result.error : '')}).appendTo('#results');
  }
  async function move(name, room) {
    guest(name).trigger('click'); await delay(300);
    q('.detail-panel .move-button[data-room="' + room + '"]').trigger('click');
    await settle();
  }
  $(async function () {
    for (const task of [1, 2]) {
      await open(task);
      for (let index = 0; index < expected.length; index++) {
        await check('Task ' + task + ' / case ' + (index + 1), async function () {
          clickCase(index + 1); await settle();
          const actual = q('#result-names').text().split(' · ').join(',');
          assert(actual === expected[index], actual + ' != ' + expected[index]);
          assert(+q('#result-count').text() === expected[index].split(',').length, 'Wrong count');
          if (index === 17) assert(names(q('#living-room .guest')).endsWith('Askar,Miras,Inkar'), 'Miras is not between Askar and Inkar');
          if (index === 18) assert(guest('Natasha').length === 0 && q('#house .guest').length === 20, 'Natasha did not leave');
          idle();
        });
      }
    }
    await check('Spotlight then Clear', async function () {
      await open(2); clickCase(3); await settle();
      opacity(1, '#house .guest.found'); opacity(0.2, '#house .guest:not(.found)');
      q('#clear').trigger('click'); await settle(); opacity(1); idle();
    });
    await check('Room spotlight', async function () {
      await open(2); clickCase(14); await settle();
      opacity(1, '#hall .guest'); opacity(0.2, '#house .room:not(#hall) .guest'); idle();
    });
    await check('Clear during Natasha jump completes removal', async function () {
      await open(2); clickCase(19); q('#clear').trigger('click'); await settle();
      assert(guest('Natasha').length === 0, 'Natasha survived Clear');
      assert(q('#result-count').text() === '20', 'Clear counts a removed card'); opacity(1); idle();
    });
    await check('Sort during Natasha jump completes removal', async function () {
      await open(2); clickCase(19); sort('living-room'); await settle();
      assert(guest('Natasha').length === 0, 'Natasha survived sorting'); opacity(0.2); idle();
    });
    await check('Clear during Miras fade leaves a visible card', async function () {
      await open(2); clickCase(18); q('#clear').trigger('click'); await settle();
      assert(guest('Miras').length === 1, 'Miras missing or duplicated'); opacity(1); idle();
    });
    await check('Move Arman and run case 1', async function () {
      await open(2); await move('Arman', 'balcony');
      assert(names(q('#balcony .guest')).endsWith(',Arman'), 'Arman is not at the end');
      clickCase(1); await settle();
      assert(q('#result-names').text() === 'Sophia · Dias · Bekzat · Aruzhan · Saule', 'Move was not persisted'); idle();
    });
    await check('Moved Miras is not duplicated by case 18', async function () {
      await open(2); clickCase(18); await settle(); await move('Miras', 'balcony');
      clickCase(18); await settle(); assert(guest('Miras').length === 1, 'Duplicate Miras');
      clickCase(18); await settle(); assert(guest('Miras').length === 1, 'Repeated case duplicates Miras'); idle();
    });
    await check('Sort twice restores picture order', async function () {
      await open(2); sort('living-room'); await settle();
      assert(names(q('#living-room .guest')) === 'Daniel,Inkar,Natasha,Askar,Zarina', 'Wrong arrival order');
      sort('living-room'); await settle();
      assert(names(q('#living-room .guest')) === 'Daniel,Zarina,Natasha,Askar,Inkar', 'Wrong picture order'); idle();
    });
    await check('Five rapid sort clicks', async function () {
      await open(2); for (let i = 0; i < 5; i++) sort('living-room'); await settle();
      assert(names(q('#living-room .guest')) === 'Daniel,Inkar,Natasha,Askar,Zarina', 'Wrong final sort state');
      q('#living-room .guest').each(function () { assert(+parseFloat(q(this).css('left')) === 0 && +parseFloat(q(this).css('top')) === 0, 'Card left displaced'); }); idle();
    });
    await check('Sort during spotlight preserves final opacity', async function () {
      await open(2); clickCase(3); await delay(80); sort('hall'); await settle();
      opacity(1, '#house .guest.found'); opacity(0.2, '#house .guest:not(.found)'); idle();
    });
    await check('Move during sort keeps picture restoration available', async function () {
      await open(2); sort('living-room'); await settle(); await move('Arman', 'living-room');
      q('#living-room .sort-button').trigger('click'); await settle();
      assert(names(q('#living-room .guest')) === 'Daniel,Zarina,Natasha,Askar,Inkar,Arman', 'Sort toggle lost picture order after move'); idle();
    });
    await check('Guest details, rapid switch, Esc and outside close', async function () {
      await open(2); guest('Arman').trigger('click'); await delay(300);
      assert(q('.detail-panel').text().includes('Has a bag and glasses'), 'Missing guest information');
      guest('Sophia').trigger('click'); guest('Dias').trigger('click'); await settle();
      assert(q('.detail-panel').length === 1 && q('.detail-panel h2').text() === 'Dias', 'Wrong final guest panel');
      q(win.document).trigger(q.Event('keydown', {key:'Escape'})); await settle();
      assert(!q('.detail-panel').length, 'Esc did not close details');
      guest('Arman').trigger('click'); await delay(300); q('header').trigger('click'); await settle();
      assert(!q('.detail-panel').length, 'Outside click did not close details');
    });
    const failed = results.filter(result => !result.passed).length;
    window.Assignment6TestResults = {passed:results.length - failed, failed, results};
    $('#summary').text((results.length - failed) + ' passed, ' + failed + ' failed').attr('data-complete', 'true');
  });
})(jQuery);
