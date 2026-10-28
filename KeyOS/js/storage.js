/* ============================================================
   KeyOS — storage.js
   Safe, reusable LocalStorage helper.

   Every key written by KeyOS is namespaced with the "keyos."
   prefix so we never collide with other apps on the same origin.

   If LocalStorage is unavailable (private mode, disabled cookies,
   storage quota errors) the module transparently falls back to an
   in-memory Map so the simulator keeps working for the session.
   ============================================================ */

window.KeyOS = window.KeyOS || {};

(function (KeyOS) {
  'use strict';

  var PREFIX = 'keyos.';
  var memoryStore = new Map();
  var backend = null;
  var backendName = 'memory';

  /* ----------------------------------------------------------
     Detect a usable LocalStorage backend.
     Accessing window.localStorage can itself throw in some
     browser privacy configurations, so everything is guarded.
     ---------------------------------------------------------- */
  function detectBackend() {
    try {
      var probeKey = PREFIX + '__probe__';
      window.localStorage.setItem(probeKey, '1');
      window.localStorage.removeItem(probeKey);
      backendName = 'localStorage';
      return window.localStorage;
    } catch (error) {
      console.warn(
        'KeyOS.Storage: LocalStorage is unavailable — using in-memory storage for this session.',
        error
      );
      backendName = 'memory';
      return null;
    }
  }

  backend = detectBackend();

  /* ----------------------------------------------------------
     Internal helpers
     ---------------------------------------------------------- */

  function fullKey(key) {
    return PREFIX + String(key);
  }

  /** Deep-copy plain JSON values so callers cannot mutate stored data. */
  function clone(value) {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function rawGet(storageKey) {
    try {
      return backend ? backend.getItem(storageKey) : memoryStore.get(storageKey);
    } catch (error) {
      console.warn('KeyOS.Storage: read failed for "' + storageKey + '".', error);
      return null;
    }
  }

  function rawSet(storageKey, rawValue) {
    try {
      if (backend) {
        backend.setItem(storageKey, rawValue);
      } else {
        memoryStore.set(storageKey, rawValue);
      }
      return true;
    } catch (error) {
      console.warn('KeyOS.Storage: write failed for "' + storageKey + '".', error);
      return false;
    }
  }

  function rawRemove(storageKey) {
    try {
      if (backend) {
        backend.removeItem(storageKey);
      } else {
        memoryStore.delete(storageKey);
      }
      return true;
    } catch (error) {
      console.warn('KeyOS.Storage: remove failed for "' + storageKey + '".', error);
      return false;
    }
  }

  /* ----------------------------------------------------------
     Public API
     ---------------------------------------------------------- */

  /**
   * Read a stored value.
   * Returns a clone of `fallbackValue` when the key is missing,
   * empty, or corrupted — never throws.
   */
  function read(key, fallbackValue) {
    var storageKey = fullKey(key);
    var raw = rawGet(storageKey);

    if (raw === null || raw === undefined) {
      return clone(fallbackValue);
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn(
        'KeyOS.Storage: corrupted data at "' + key + '" — falling back to the default value.'
      );
      return clone(fallbackValue);
    }
  }

  /** Write a value. Returns true when the write succeeded. */
  function write(key, value) {
    var raw;
    try {
      raw = JSON.stringify(value);
    } catch (error) {
      console.warn('KeyOS.Storage: value for "' + key + '" is not serialisable.', error);
      return false;
    }
    if (raw === undefined) {
      console.warn('KeyOS.Storage: value for "' + key + '" serialised to undefined.');
      return false;
    }
    return rawSet(fullKey(key), raw);
  }

  /** Remove a single stored key. */
  function remove(key) {
    return rawRemove(fullKey(key));
  }

  /** List every KeyOS-owned key (without the namespace prefix). */
  function keys() {
    var result = [];
    try {
      if (backend) {
        for (var i = 0; i < backend.length; i += 1) {
          var storedKey = backend.key(i);
          if (storedKey && storedKey.indexOf(PREFIX) === 0) {
            result.push(storedKey.slice(PREFIX.length));
          }
        }
      } else {
        memoryStore.forEach(function (_value, storedKey) {
          if (storedKey.indexOf(PREFIX) === 0) {
            result.push(storedKey.slice(PREFIX.length));
          }
        });
      }
    } catch (error) {
      console.warn('KeyOS.Storage: unable to enumerate keys.', error);
    }
    return result;
  }

  /**
   * Delete every KeyOS key. Used by Settings → Factory reset (Step 13).
   * Only touches keys under our own namespace.
   */
  function clearAll() {
    try {
      if (backend) {
        var doomed = [];
        for (var i = 0; i < backend.length; i += 1) {
          var storedKey = backend.key(i);
          if (storedKey && storedKey.indexOf(PREFIX) === 0) {
            doomed.push(storedKey);
          }
        }
        doomed.forEach(function (storedKey) {
          backend.removeItem(storedKey);
        });
      } else {
        var memoryDoomed = [];
        memoryStore.forEach(function (_value, storedKey) {
          if (storedKey.indexOf(PREFIX) === 0) {
            memoryDoomed.push(storedKey);
          }
        });
        memoryDoomed.forEach(function (storedKey) {
          memoryStore.delete(storedKey);
        });
      }
      return true;
    } catch (error) {
      console.warn('KeyOS.Storage: factory reset failed.', error);
      return false;
    }
  }

  /** True when data will survive a page reload. */
  function isPersistent() {
    return backendName === 'localStorage';
  }

  KeyOS.Storage = {
    PREFIX: PREFIX,
    read: read,
    write: write,
    remove: remove,
    keys: keys,
    clearAll: clearAll,
    isPersistent: isPersistent,
    clone: clone
  };
})(window.KeyOS);