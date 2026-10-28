/* ============================================================
   KeyOS — main.js
   Application bootstrap.

   Responsibilities for Step 1:
     • Wire the status bar (network name, signal, battery).
     • Initialise the navigation layer and register screens.
     • Initialise the keypad input layer.
     • Start the clock.
     • Show the standby screen.
   ============================================================ */

window.KeyOS = window.KeyOS || {};

(function (KeyOS) {
  'use strict';

  var Storage = KeyOS.Storage;
  var Clock = KeyOS.Clock;
  var Nav = KeyOS.Navigation;
  var Keypad = KeyOS.Keypad;

  var NETWORK_NAME = 'KeyOS Network';
  var MAX_SIGNAL_BARS = 4;

  /* Status bar element references (assigned during boot). */
  var signalEl = null;
  var batteryEl = null;
  var batteryFillEl = null;
  var networkEl = null;

  /* Simulated device state. */
  var signalLevel = 4;    // 1..4 bars
  var batteryLevel = 82;  // percent

  /* ==========================================================
     STATUS BAR
     ========================================================== */

  function renderSignal() {
    if (!signalEl) {
      return;
    }
    signalEl.querySelectorAll('i').forEach(function (bar, index) {
      bar.classList.toggle('is-on', index < signalLevel);
    });
    signalEl.setAttribute('aria-label', 'Signal strength ' + signalLevel + ' of ' + MAX_SIGNAL_BARS);
    signalEl.setAttribute('title', 'Signal: ' + signalLevel + '/' + MAX_SIGNAL_BARS);
  }

  function renderBattery() {
    if (!batteryEl || !batteryFillEl) {
      return;
    }
    batteryFillEl.style.width = batteryLevel + '%';
    batteryEl.setAttribute('aria-label', 'Battery ' + batteryLevel + ' percent');
    batteryEl.setAttribute('title', 'Battery: ' + batteryLevel + '%');
  }

  /**
   * Slow, purely cosmetic simulation so the indicators feel alive.
   * Signal drifts between 2 and 4 bars; battery drains toward a floor.
   */
  function startStatusSimulation() {
    window.setInterval(function () {
      var direction = Math.random() < 0.5 ? -1 : 1;
      signalLevel = Math.min(MAX_SIGNAL_BARS, Math.max(2, signalLevel + direction));
      renderSignal();
    }, 20000);

    window.setInterval(function () {
      if (batteryLevel > 15) {
        batteryLevel -= 1;
        renderBattery();
      }
    }, 60000);
  }

  /* ==========================================================
     KEY DESCRIPTION (used by the Step 1 keypad test readout)
     ========================================================== */

  var KEY_LABELS = {
    SOFT_LEFT: 'Left soft',
    SOFT_RIGHT: 'Right soft',
    UP: 'Up',
    DOWN: 'Down',
    LEFT: 'Left',
    RIGHT: 'Right',
    OK: 'OK',
    BACK: 'Back',
    CALL: 'Call',
    END: 'End'
  };

  function describeKey(key) {
    if (Object.prototype.hasOwnProperty.call(KEY_LABELS, key)) {
      return KEY_LABELS[key];
    }
    return key;
  }

  /* ==========================================================
     SCREEN: STANDBY
     ========================================================== */

  function buildStandbyView() {
    var view = document.createElement('div');
    view.className = 'screen-view screen-view--standby';

    /* --- top: brand --- */
    var top = document.createElement('div');
    top.className = 'standby__top';

    var brand = document.createElement('div');
    brand.className = 'standby__brand';
    brand.textContent = 'KeyOS';

    var tagline = document.createElement('div');
    tagline.className = 'standby__tagline';
    tagline.textContent = 'Standby';

    top.appendChild(brand);
    top.appendChild(tagline);

    /* --- middle: clock + date --- */
    var middle = document.createElement('div');
    middle.className = 'standby__middle';

    var clockEl = document.createElement('div');
    clockEl.className = 'standby__clock js-clock-time';
    clockEl.textContent = '--:--';

    var dateEl = document.createElement('div');
    dateEl.className = 'standby__date js-clock-date';
    dateEl.textContent = '';

    middle.appendChild(clockEl);
    middle.appendChild(dateEl);

    /* --- bottom: keypad test readout --- */
    var bottom = document.createElement('div');
    bottom.className = 'standby__bottom';

    var echo = document.createElement('div');
    echo.className = 'standby__echo';
    echo.textContent = 'Press any key\u2026';

    var note = document.createElement('div');
    note.className = 'standby__note';
    note.textContent = 'Step 1 \u2014 hardware test build';

    bottom.appendChild(echo);
    bottom.appendChild(note);

    view.appendChild(top);
    view.appendChild(middle);
    view.appendChild(bottom);

    return view;
  }

  function createStandbyScreen() {
    var echoEl = null;
    var keyCount = 0;
    var onKeyHandler = null;

    return {
      render: function () {
        var view = buildStandbyView();
        echoEl = view.querySelector('.standby__echo');
        return view;
      },

      onEnter: function () {
        keyCount = 0;

        onKeyHandler = function (event) {
          keyCount += 1;
          if (echoEl) {
            echoEl.textContent = 'Key: ' + describeKey(event.detail.key) + '  #' + keyCount;
          }
        };

        document.addEventListener('keyos:key', onKeyHandler);

        // Paint the clock immediately instead of waiting up to 1 second.
        Clock.render();
      },

      onExit: function () {
        if (onKeyHandler) {
          document.removeEventListener('keyos:key', onKeyHandler);
        }
        onKeyHandler = null;
        echoEl = null;
      },

      softKeys: function () {
        return {
          left: {
            label: 'Menu',
            action: function () {
              Nav.go('menu-placeholder');
            }
          },
          right: {
            label: 'Names',
            action: function () {
              Nav.go('contacts-placeholder');
            }
          }
        };
      },

      onKey: function (key) {
        // OK opens the menu, exactly like a classic feature phone.
        if (key === 'OK') {
          Nav.go('menu-placeholder');
          return true;
        }
        return false;
      }
    };
  }

  /* ==========================================================
     SCREEN: GENERIC INFO (Step 1 placeholders)
     ========================================================== */

  function createInfoScreen(title, paragraphs) {
    return {
      render: function () {
        var view = document.createElement('div');
        view.className = 'screen-view screen-view--info';

        var heading = document.createElement('div');
        heading.className = 'screen-view__title';
        heading.textContent = title;

        var body = document.createElement('div');
        body.className = 'screen-view__body';

        paragraphs.forEach(function (text) {
          var p = document.createElement('p');
          p.textContent = text;
          body.appendChild(p);
        });

        var footer = document.createElement('div');
        footer.className = 'screen-view__footer';
        footer.textContent = 'Press Back to return';

        view.appendChild(heading);
        view.appendChild(body);
        view.appendChild(footer);
        return view;
      },

      softKeys: function () {
        return {
          left: null,
          right: {
            label: 'Back',
            action: function () {
              Nav.back();
            }
          }
        };
      }
    };
  }

  /* ==========================================================
     BOOT
     ========================================================== */

  function boot() {
    /* --- cache DOM references --- */
    networkEl = document.getElementById('networkName');
    signalEl = document.getElementById('signalIndicator');
    batteryEl = document.getElementById('batteryIndicator');
    batteryFillEl = batteryEl ? batteryEl.querySelector('.meter__fill') : null;

    var screenContent = document.getElementById('screenContent');
    var softLeftLabel = document.getElementById('softLeftLabel');
    var softRightLabel = document.getElementById('softRightLabel');
    var phoneEl = document.getElementById('phone');

    if (!screenContent || !phoneEl) {
      console.error('KeyOS: required DOM elements are missing. Check index.html.');
      return;
    }

    /* --- status bar --- */
    if (networkEl) {
      networkEl.textContent = NETWORK_NAME;
    }
    renderSignal();
    renderBattery();
    startStatusSimulation();

    /* --- navigation --- */
    Nav.init({
      container: screenContent,
      softLeftLabel: softLeftLabel,
      softRightLabel: softRightLabel
    });

    Nav.register('standby', createStandbyScreen());

    Nav.register('menu-placeholder', createInfoScreen('Menu', [
      'The full application menu is built in Step 2.',
      'Step 1 delivers the phone shell, the LCD screen, the live clock and the complete keypad input layer.',
      'Applications arriving next: Phone, Contacts, Messages, Call History, Games, Calculator, Alarm, Calendar, Notes, Settings, File Manager, Music Player and About KeyOS.'
    ]));

    Nav.register('contacts-placeholder', createInfoScreen('Contacts', [
      'The Contacts application is built in Step 4.',
      'It will support adding, editing, deleting and searching contacts with persistent LocalStorage storage.'
    ]));

    /* --- keypad input --- */
    Keypad.init(phoneEl);

    /* Route every normalised key through the navigation layer. */
    document.addEventListener('keyos:key', function (event) {
      Nav.handleKey(event.detail.key);
    });

    /* --- clock --- */
    Clock.start();

    /* --- show the standby screen --- */
    Nav.setRoot('standby');

    /* --- storage notice --- */
    if (!Storage.isPersistent()) {
      console.warn('KeyOS: running without persistent storage in this browser session.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.KeyOS);