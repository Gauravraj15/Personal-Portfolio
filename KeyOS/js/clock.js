/* ============================================================
   KeyOS — clock.js
   Central clock service.

   • Ticks once per second.
   • Updates every element carrying .js-clock-time / .js-clock-date.
   • Fires a "keyos:clock-tick" event so any screen can react.
   • Honours the 12h/24h setting from Storage (Settings app, Step 13).
   ============================================================ */

window.KeyOS = window.KeyOS || {};

(function (KeyOS) {
  'use strict';

  var Storage = KeyOS.Storage;

  var SETTINGS_KEY = 'settings';
  var TICK_INTERVAL_MS = 1000;

  var DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAYS_LONG = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];
  var MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  var MONTHS_LONG = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  var timerId = null;

  /* ----------------------------------------------------------
     Formatting
     ---------------------------------------------------------- */

  function pad2(value) {
    return value < 10 ? '0' + value : String(value);
  }

  /** Reads the stored clock format. Defaults to 24-hour. */
  function getHourFormat() {
    var settings = Storage.read(SETTINGS_KEY, null);
    if (settings && settings.clockFormat === '12') {
      return '12';
    }
    return '24';
  }

  /** "14:32" or "2:32 PM" */
  function formatTime(date, format) {
    var hours24 = date.getHours();
    var minutes = pad2(date.getMinutes());

    if (format === '12') {
      var suffix = hours24 < 12 ? 'AM' : 'PM';
      var hours12 = hours24 % 12;
      if (hours12 === 0) {
        hours12 = 12;
      }
      return hours12 + ':' + minutes + ' ' + suffix;
    }
    return pad2(hours24) + ':' + minutes;
  }

  /** "Mon 12 May 2025" — used in the status/standby area. */
  function formatDate(date) {
    return DAYS_SHORT[date.getDay()] + ' ' +
      date.getDate() + ' ' +
      MONTHS_SHORT[date.getMonth()] + ' ' +
      date.getFullYear();
  }

  /** "Monday, 12 May 2025" — used by Calendar / Alarm (later steps). */
  function formatDateLong(date) {
    return DAYS_LONG[date.getDay()] + ', ' +
      date.getDate() + ' ' +
      MONTHS_LONG[date.getMonth()] + ' ' +
      date.getFullYear();
  }

  /** Convenience bundle. */
  function formatClock(date) {
    var format = getHourFormat();
    return {
      time: formatTime(date, format),
      date: formatDate(date),
      format: format
    };
  }

  /* ----------------------------------------------------------
     Rendering
     ---------------------------------------------------------- */

  /**
   * Paints the current time into every .js-clock-time element and the
   * date into every .js-clock-date element. Elements are queried on each
   * render so screens can mount and unmount freely.
   */
  function render() {
    var now = new Date();
    var formatted = formatClock(now);

    document.querySelectorAll('.js-clock-time').forEach(function (el) {
      if (el.textContent !== formatted.time) {
        el.textContent = formatted.time;
      }
    });

    document.querySelectorAll('.js-clock-date').forEach(function (el) {
      if (el.textContent !== formatted.date) {
        el.textContent = formatted.date;
      }
    });

    return {
      now: now,
      time: formatted.time,
      date: formatted.date,
      format: formatted.format
    };
  }

  function tick() {
    var payload = render();
    document.dispatchEvent(
      new CustomEvent('keyos:clock-tick', { detail: payload })
    );
  }

  /* ----------------------------------------------------------
     Lifecycle
     ---------------------------------------------------------- */

  function start() {
    if (timerId !== null) {
      return;
    }
    tick();
    timerId = window.setInterval(tick, TICK_INTERVAL_MS);
  }

  function stop() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function isRunning() {
    return timerId !== null;
  }

  /* Re-paint immediately when the clock format setting changes. */
  document.addEventListener('keyos:settings-changed', function () {
    render();
  });

  KeyOS.Clock = {
    start: start,
    stop: stop,
    isRunning: isRunning,
    render: render,
    getHourFormat: getHourFormat,
    formatTime: formatTime,
    formatDate: formatDate,
    formatDateLong: formatDateLong,
    formatClock: formatClock,
    MONTHS_SHORT: MONTHS_SHORT,
    MONTHS_LONG: MONTHS_LONG,
    DAYS_SHORT: DAYS_SHORT,
    DAYS_LONG: DAYS_LONG
  };
})(window.KeyOS);