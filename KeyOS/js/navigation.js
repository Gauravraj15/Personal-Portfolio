/* ============================================================
   KeyOS — navigation.js
   Screen registry + navigation stack.

   A "screen definition" is an object:

     {
       render(params)  -> HTMLElement            (required)
       onEnter(el, params)                       (optional)
       onExit(el)                                (optional)
       onKey(key, el) -> boolean                 (optional)
       softKeys(params) -> { left, right }       (optional)
     }

   `onKey` returning true means the screen consumed the key and the
   navigation layer should not act on it.
   ============================================================ */

window.KeyOS = window.KeyOS || {};

(function (KeyOS) {
  'use strict';

  var screens = new Map();
  var stack = [];            // [{ name, params }, ...] — last item is active

  var containerEl = null;
  var softLeftEl = null;
  var softRightEl = null;

  var activeName = null;
  var activeDefinition = null;
  var activeView = null;
  var activeSoftKeys = { left: null, right: null };

  /* ----------------------------------------------------------
     Setup
     ---------------------------------------------------------- */

  function init(options) {
    options = options || {};
    containerEl = options.container || null;
    softLeftEl = options.softLeftLabel || null;
    softRightEl = options.softRightLabel || null;

    if (!containerEl) {
      throw new Error('KeyOS.Navigation.init: a container element is required.');
    }
  }

  function register(name, definition) {
    if (!name || typeof name !== 'string') {
      throw new Error('KeyOS.Navigation.register: a screen name is required.');
    }
    if (!definition || typeof definition.render !== 'function') {
      throw new Error('KeyOS.Navigation.register: screen "' + name + '" needs a render() function.');
    }
    screens.set(name, definition);
  }

  function has(name) {
    return screens.has(name);
  }

  /* ----------------------------------------------------------
     Internal rendering
     ---------------------------------------------------------- */

  function buildErrorView(screenName) {
    var view = document.createElement('div');
    view.className = 'screen-view screen-view--info';

    var title = document.createElement('div');
    title.className = 'screen-view__title';
    title.textContent = 'Screen error';

    var body = document.createElement('div');
    body.className = 'screen-view__body';

    var message = document.createElement('p');
    message.textContent = 'Could not open "' + screenName + '".';
    body.appendChild(message);

    var hint = document.createElement('p');
    hint.textContent = 'Press Back to return to the previous screen.';
    body.appendChild(hint);

    view.appendChild(title);
    view.appendChild(body);
    return view;
  }

  function teardown() {
    if (activeDefinition && typeof activeDefinition.onExit === 'function') {
      try {
        activeDefinition.onExit(activeView);
      } catch (error) {
        console.error('KeyOS.Navigation: onExit failed for "' + activeName + '".', error);
      }
    }

    activeName = null;
    activeDefinition = null;
    activeView = null;

    if (containerEl) {
      containerEl.replaceChildren();
    }
  }

  function applySoftKeys(config) {
    activeSoftKeys = {
      left: config && config.left ? config.left : null,
      right: config && config.right ? config.right : null
    };

    if (softLeftEl) {
      softLeftEl.textContent = activeSoftKeys.left ? activeSoftKeys.left.label : '';
    }
    if (softRightEl) {
      softRightEl.textContent = activeSoftKeys.right ? activeSoftKeys.right.label : '';
    }
  }

  function renderEntry(entry) {
    var definition = screens.get(entry.name);

    if (!definition) {
      console.warn('KeyOS.Navigation: unknown screen "' + entry.name + '".');
      return;
    }

    teardown();

    var view = null;
    try {
      view = definition.render(entry.params);
    } catch (error) {
      console.error('KeyOS.Navigation: "' + entry.name + '" failed to render.', error);
      view = null;
    }

    if (!(view instanceof HTMLElement)) {
      if (view !== null) {
        console.error('KeyOS.Navigation: "' + entry.name + '" render() must return an HTMLElement.');
      }
      containerEl.appendChild(buildErrorView(entry.name));
      activeName = entry.name;
      applySoftKeys({ right: { label: 'Back', action: back } });
      return;
    }

    containerEl.appendChild(view);

    activeName = entry.name;
    activeDefinition = definition;
    activeView = view;

    if (typeof definition.onEnter === 'function') {
      try {
        definition.onEnter(view, entry.params);
      } catch (error) {
        console.error('KeyOS.Navigation: onEnter failed for "' + entry.name + '".', error);
      }
    }

    applySoftKeys(typeof definition.softKeys === 'function' ? definition.softKeys(entry.params) : null);
  }

  /* ----------------------------------------------------------
     Public navigation
     ---------------------------------------------------------- */

  /** Push a new screen onto the stack. */
  function go(name, params) {
    if (!screens.has(name)) {
      console.warn('KeyOS.Navigation.go: unknown screen "' + name + '".');
      return false;
    }
    stack.push({ name: name, params: params || {} });
    renderEntry(stack[stack.length - 1]);
    return true;
  }

  /** Replace the active screen (does not grow the stack). */
  function replace(name, params) {
    if (!screens.has(name)) {
      console.warn('KeyOS.Navigation.replace: unknown screen "' + name + '".');
      return false;
    }
    if (stack.length > 0) {
      stack.pop();
    }
    return go(name, params);
  }

  /** Pop one screen. Returns false when already at the root screen. */
  function back() {
    if (stack.length <= 1) {
      return false;
    }
    stack.pop();
    renderEntry(stack[stack.length - 1]);
    return true;
  }

  /** Collapse the stack back to the root screen. */
  function home() {
    if (stack.length <= 1) {
      return false;
    }
    stack.length = 1;
    renderEntry(stack[0]);
    return true;
  }

  /** Define (or redefine) the root screen and show it. */
  function setRoot(name, params) {
    if (!screens.has(name)) {
      console.warn('KeyOS.Navigation.setRoot: unknown screen "' + name + '".');
      return false;
    }
    stack.length = 0;
    stack.push({ name: name, params: params || {} });
    renderEntry(stack[0]);
    return true;
  }

  /** Re-render the currently active screen. */
  function refresh() {
    if (stack.length === 0) {
      return false;
    }
    renderEntry(stack[stack.length - 1]);
    return true;
  }

  /* ----------------------------------------------------------
     Key routing
     ---------------------------------------------------------- */

  /**
   * Route a key from the keypad layer.
   * Order: active screen first, then global soft keys, then Back/End.
   */
  function handleKey(key) {
    if (!key) {
      return false;
    }

    if (activeDefinition && typeof activeDefinition.onKey === 'function') {
      var handled = false;
      try {
        handled = activeDefinition.onKey(key, activeView) === true;
      } catch (error) {
        console.error('KeyOS.Navigation: onKey failed on "' + activeName + '".', error);
      }
      if (handled) {
        return true;
      }
    }

    switch (key) {
      case 'SOFT_LEFT':
        if (activeSoftKeys.left) {
          activeSoftKeys.left.action();
          return true;
        }
        return false;

      case 'SOFT_RIGHT':
        if (activeSoftKeys.right) {
          activeSoftKeys.right.action();
          return true;
        }
        return false;

      case 'BACK':
        return back();

      case 'END':
        return home();

      default:
        return false;
    }
  }

  /* ----------------------------------------------------------
     Introspection
     ---------------------------------------------------------- */

  function current() {
    return activeName;
  }

  function depth() {
    return stack.length;
  }

  function getStack() {
    return stack.map(function (entry) {
      return entry.name;
    });
  }

  KeyOS.Navigation = {
    init: init,
    register: register,
    has: has,
    go: go,
    replace: replace,
    back: back,
    home: home,
    setRoot: setRoot,
    refresh: refresh,
    handleKey: handleKey,
    current: current,
    depth: depth,
    getStack: getStack
  };
})(window.KeyOS);