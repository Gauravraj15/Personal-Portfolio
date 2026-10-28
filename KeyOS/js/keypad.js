/* ============================================================
   KeyOS — keypad.js
   Turns physical clicks and real keyboard presses into a single
   normalised "keyos:key" event.

   Event detail:
     { key: 'OK' | 'UP' | '5' | 'CALL' | ..., source: 'pointer' | 'keyboard' }
   ============================================================ */

window.KeyOS = window.KeyOS || {};

(function (KeyOS) {
  'use strict';

  /**
   * Physical keyboard -> KeyOS key name.
   * Arrow keys, Enter, Backspace/Escape, digits, * and #, plus
   * "C" for Call and the "End" key for the red button.
   */
  var KEY_MAP = {
    ArrowUp: 'UP',
    ArrowDown: 'DOWN',
    ArrowLeft: 'LEFT',
    ArrowRight: 'RIGHT',
    Enter: 'OK',
    Backspace: 'BACK',
    Escape: 'BACK',
    End: 'END',
    '*': '*',
    '#': '#',
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    c: 'CALL',
    C: 'CALL'
  };

  var PRESS_FLASH_MS = 130;

  var rootEl = null;
  var keydownHandler = null;
  var flashTimers = new Map();

  /* ----------------------------------------------------------
     Helpers
     ---------------------------------------------------------- */

  /** Never swallow keystrokes aimed at a real text field. */
  function isTypingTarget(target) {
    if (!target || !(target instanceof HTMLElement)) {
      return false;
    }
    var tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  function findKeyButton(key) {
    if (!rootEl) {
      return null;
    }
    var safeKey = String(key).replace(/"/g, '\\"');
    return rootEl.querySelector('[data-key="' + safeKey + '"]');
  }

  /** Briefly light up the matching on-screen key. */
  function flashKey(key) {
    var button = findKeyButton(key);
    if (!button) {
      return;
    }

    button.classList.add('is-pressed');

    if (flashTimers.has(key)) {
      window.clearTimeout(flashTimers.get(key));
    }
    flashTimers.set(key, window.setTimeout(function () {
      button.classList.remove('is-pressed');
      flashTimers.delete(key);
    }, PRESS_FLASH_MS));
  }

  /** Emit the normalised event. */
  function emit(key, source) {
    if (!key) {
      return;
    }
    flashKey(key);
    document.dispatchEvent(new CustomEvent('keyos:key', {
      detail: { key: key, source: source }
    }));
  }

  /* ----------------------------------------------------------
     Binding
     ---------------------------------------------------------- */

  function bindButtons() {
    if (!rootEl) {
      return;
    }

    rootEl.querySelectorAll('[data-key]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        emit(button.dataset.key, 'pointer');
      });
    });
  }

  function bindKeyboard() {
    keydownHandler = function (event) {
      // Another handler already consumed this key.
      if (event.defaultPrevented) {
        return;
      }

      // Leave browser and OS shortcuts alone.
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      // Never interfere with real typing.
      if (isTypingTarget(event.target)) {
        return;
      }

      // If a keypad button itself has focus, let the browser's native
      // Enter/Space activation fire the click — avoids double-triggering.
      if ((event.key === 'Enter' || event.key === ' ') &&
          event.target instanceof HTMLElement &&
          event.target.closest('[data-key]')) {
        return;
      }

      var mapped = KEY_MAP[event.key];
      if (!mapped) {
        return;
      }

      // Stop arrow keys from scrolling the page.
      event.preventDefault();

      // Ignore auto-repeat so a held key never fires twice.
      if (event.repeat) {
        return;
      }

      emit(mapped, 'keyboard');
    };

    document.addEventListener('keydown', keydownHandler);
  }

  /* ----------------------------------------------------------
     Public API
     ---------------------------------------------------------- */

  function init(root) {
    rootEl = root || document;
    bindButtons();
    bindKeyboard();
  }

  function destroy() {
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
    flashTimers.forEach(function (id) {
      window.clearTimeout(id);
    });
    flashTimers.clear();
  }

  KeyOS.Keypad = {
    init: init,
    destroy: destroy,
    emit: emit,
    KEY_MAP: KEY_MAP
  };
})(window.KeyOS);