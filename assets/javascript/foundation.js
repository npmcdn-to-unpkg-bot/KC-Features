'use strict';

;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return factory();
    });
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.whatInput = factory();
  }
})(this, function () {
  'use strict';

  /*
    ---------------
    variables
    ---------------
  */

  // array of actively pressed keys

  var activeKeys = [];

  // cache document.body
  var body = document.body;

  // boolean: true if touch buffer timer is running
  var buffer = false;

  // the last used input type
  var currentInput = null;

  // array of form elements that take keyboard input
  var formInputs = ['input', 'select', 'textarea'];

  // user-set flag to allow typing in form fields to be recorded
  var formTyping = body.hasAttribute('data-whatinput-formtyping');

  // mapping of events to input types
  var inputMap = {
    'keydown': 'keyboard',
    'mousedown': 'mouse',
    'mouseenter': 'mouse',
    'touchstart': 'touch',
    'pointerdown': 'pointer',
    'MSPointerDown': 'pointer'
  };

  // array of all used input types
  var inputTypes = [];

  // mapping of key codes to common name
  var keyMap = {
    9: 'tab',
    13: 'enter',
    16: 'shift',
    27: 'esc',
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  // map of IE 10 pointer events
  var pointerMap = {
    2: 'touch',
    3: 'touch', // treat pen like touch
    4: 'mouse'
  };

  // touch buffer timer
  var timer;

  /*
    ---------------
    functions
    ---------------
  */

  function bufferInput(event) {
    clearTimeout(timer);

    setInput(event);

    buffer = true;
    timer = setTimeout(function () {
      buffer = false;
    }, 1000);
  }

  function immediateInput(event) {
    if (!buffer) setInput(event);
  }

  function setInput(event) {
    var eventKey = key(event);
    var eventTarget = target(event);
    var value = inputMap[event.type];
    if (value === 'pointer') value = pointerType(event);

    if (currentInput !== value) {
      if (
      // only if the user flag isn't set
      !formTyping &&

      // only if currentInput has a value
      currentInput &&

      // only if the input is `keyboard`
      value === 'keyboard' &&

      // not if the key is `TAB`
      keyMap[eventKey] !== 'tab' &&

      // only if the target is one of the elements in `formInputs`
      formInputs.indexOf(eventTarget.nodeName.toLowerCase()) >= 0) {
        // ignore keyboard typing on form elements
      } else {
          currentInput = value;
          body.setAttribute('data-whatinput', currentInput);

          if (inputTypes.indexOf(currentInput) === -1) inputTypes.push(currentInput);
        }
    }

    if (value === 'keyboard') logKeys(eventKey);
  }

  function key(event) {
    return event.keyCode ? event.keyCode : event.which;
  }

  function target(event) {
    return event.target || event.srcElement;
  }

  function pointerType(event) {
    return typeof event.pointerType === 'number' ? pointerMap[event.pointerType] : event.pointerType;
  }

  // keyboard logging
  function logKeys(eventKey) {
    if (activeKeys.indexOf(keyMap[eventKey]) === -1 && keyMap[eventKey]) activeKeys.push(keyMap[eventKey]);
  }

  function unLogKeys(event) {
    var eventKey = key(event);
    var arrayPos = activeKeys.indexOf(keyMap[eventKey]);

    if (arrayPos !== -1) activeKeys.splice(arrayPos, 1);
  }

  function bindEvents() {

    // pointer/mouse
    var mouseEvent = 'mousedown';

    if (window.PointerEvent) {
      mouseEvent = 'pointerdown';
    } else if (window.MSPointerEvent) {
      mouseEvent = 'MSPointerDown';
    }

    body.addEventListener(mouseEvent, immediateInput);
    body.addEventListener('mouseenter', immediateInput);

    // touch
    if ('ontouchstart' in window) {
      body.addEventListener('touchstart', bufferInput);
    }

    // keyboard
    body.addEventListener('keydown', immediateInput);
    document.addEventListener('keyup', unLogKeys);
  }

  /*
    ---------------
    init
     don't start script unless browser cuts the mustard,
    also passes if polyfills are used
    ---------------
  */

  if ('addEventListener' in window && Array.prototype.indexOf) {
    bindEvents();
  }

  /*
    ---------------
    api
    ---------------
  */

  return {

    // returns string: the current input type
    ask: function () {
      return currentInput;
    },

    // returns array: currently pressed keys
    keys: function () {
      return activeKeys;
    },

    // returns array: all the detected input types
    types: function () {
      return inputTypes;
    },

    // accepts string: manually set the input type
    set: setInput
  };
});
;!function ($) {

  "use strict";

  var FOUNDATION_VERSION = '6.2.0';

  // Global Foundation object
  // This is attached to the window, or used as a module for AMD/Browserify
  var Foundation = {
    version: FOUNDATION_VERSION,

    /**
     * Stores initialized plugins.
     */
    _plugins: {},

    /**
     * Stores generated unique ids for plugin instances
     */
    _uuids: [],

    /**
     * Returns a boolean for RTL support
     */
    rtl: function () {
      return $('html').attr('dir') === 'rtl';
    },
    /**
     * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
     * @param {Object} plugin - The constructor of the plugin.
     */
    plugin: function (plugin, name) {
      // Object key to use when adding to global Foundation object
      // Examples: Foundation.Reveal, Foundation.OffCanvas
      var className = name || functionName(plugin);
      // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
      // Examples: data-reveal, data-off-canvas
      var attrName = hyphenate(className);

      // Add to the Foundation object and the plugins list (for reflowing)
      this._plugins[attrName] = this[className] = plugin;
    },
    /**
     * @function
     * Populates the _uuids array with pointers to each individual plugin instance.
     * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
     * Also fires the initialization event for each plugin, consolidating repeditive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @param {String} name - the name of the plugin, passed as a camelCased string.
     * @fires Plugin#init
     */
    registerPlugin: function (plugin, name) {
      var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
      plugin.uuid = this.GetYoDigits(6, pluginName);

      if (!plugin.$element.attr('data-' + pluginName)) {
        plugin.$element.attr('data-' + pluginName, plugin.uuid);
      }
      if (!plugin.$element.data('zfPlugin')) {
        plugin.$element.data('zfPlugin', plugin);
      }
      /**
       * Fires when the plugin has initialized.
       * @event Plugin#init
       */
      plugin.$element.trigger('init.zf.' + pluginName);

      this._uuids.push(plugin.uuid);

      return;
    },
    /**
     * @function
     * Removes the plugins uuid from the _uuids array.
     * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
     * Also fires the destroyed event for the plugin, consolidating repeditive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @fires Plugin#destroyed
     */
    unregisterPlugin: function (plugin) {
      var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

      this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
      plugin.$element.removeAttr('data-' + pluginName).removeData('zfPlugin')
      /**
       * Fires when the plugin has been destroyed.
       * @event Plugin#destroyed
       */
      .trigger('destroyed.zf.' + pluginName);
      for (var prop in plugin) {
        plugin[prop] = null; //clean up script to prep for garbage collection.
      }
      return;
    },

    /**
     * @function
     * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
     * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
     * @default If no argument is passed, reflow all currently active plugins.
     */
    reInit: function (plugins) {
      var isJQ = plugins instanceof $;
      try {
        if (isJQ) {
          plugins.each(function () {
            $(this).data('zfPlugin')._init();
          });
        } else {
          var type = typeof plugins,
              _this = this,
              fns = {
            'object': function (plgs) {
              plgs.forEach(function (p) {
                p = hyphenate(p);
                $('[data-' + p + ']').foundation('_init');
              });
            },
            'string': function () {
              plugins = hyphenate(plugins);
              $('[data-' + plugins + ']').foundation('_init');
            },
            'undefined': function () {
              this['object'](Object.keys(_this._plugins));
            }
          };
          fns[type](plugins);
        }
      } catch (err) {
        console.error(err);
      } finally {
        return plugins;
      }
    },

    /**
     * returns a random base-36 uid with namespacing
     * @function
     * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
     * @param {String} namespace - name of plugin to be incorporated in uid, optional.
     * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
     * @returns {String} - unique id
     */
    GetYoDigits: function (length, namespace) {
      length = length || 6;
      return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? '-' + namespace : '');
    },
    /**
     * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
     * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
     * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
     */
    reflow: function (elem, plugins) {

      // If plugins is undefined, just grab everything
      if (typeof plugins === 'undefined') {
        plugins = Object.keys(this._plugins);
      }
      // If plugins is a string, convert it to an array with one item
      else if (typeof plugins === 'string') {
          plugins = [plugins];
        }

      var _this = this;

      // Iterate through each plugin
      $.each(plugins, function (i, name) {
        // Get the current plugin
        var plugin = _this._plugins[name];

        // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
        var $elem = $(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

        // For each plugin found, initialize it
        $elem.each(function () {
          var $el = $(this),
              opts = {};
          // Don't double-dip on plugins
          if ($el.data('zfPlugin')) {
            console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
            return;
          }

          if ($el.attr('data-options')) {
            var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
              var opt = e.split(':').map(function (el) {
                return el.trim();
              });
              if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
            });
          }
          try {
            $el.data('zfPlugin', new plugin($(this), opts));
          } catch (er) {
            console.error(er);
          } finally {
            return;
          }
        });
      });
    },
    getFnName: functionName,
    transitionend: function ($elem) {
      var transitions = {
        'transition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'otransitionend'
      };
      var elem = document.createElement('div'),
          end;

      for (var t in transitions) {
        if (typeof elem.style[t] !== 'undefined') {
          end = transitions[t];
        }
      }
      if (end) {
        return end;
      } else {
        end = setTimeout(function () {
          $elem.triggerHandler('transitionend', [$elem]);
        }, 1);
        return 'transitionend';
      }
    }
  };

  Foundation.util = {
    /**
     * Function for applying a debounce effect to a function call.
     * @function
     * @param {Function} func - Function to be called at end of timeout.
     * @param {Number} delay - Time in ms to delay the call of `func`.
     * @returns function
     */
    throttle: function (func, delay) {
      var timer = null;

      return function () {
        var context = this,
            args = arguments;

        if (timer === null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    }
  };

  // TODO: consider not making this a jQuery function
  // TODO: need way to reflow vs. re-initialize
  /**
   * The Foundation jQuery method.
   * @param {String|Array} method - An action to perform on the current jQuery object.
   */
  var foundation = function (method) {
    var type = typeof method,
        $meta = $('meta.foundation-mq'),
        $noJS = $('.no-js');

    if (!$meta.length) {
      $('<meta class="foundation-mq">').appendTo(document.head);
    }
    if ($noJS.length) {
      $noJS.removeClass('no-js');
    }

    if (type === 'undefined') {
      //needs to initialize the Foundation object, or an individual plugin.
      Foundation.MediaQuery._init();
      Foundation.reflow(this);
    } else if (type === 'string') {
      //an individual method to invoke on a plugin or group of plugins
      var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
      var plugClass = this.data('zfPlugin'); //determine the class of plugin

      if (plugClass !== undefined && plugClass[method] !== undefined) {
        //make sure both the class and method exist
        if (this.length === 1) {
          //if there's only one, call it directly.
          plugClass[method].apply(plugClass, args);
        } else {
          this.each(function (i, el) {
            //otherwise loop through the jQuery collection and invoke the method on each
            plugClass[method].apply($(el).data('zfPlugin'), args);
          });
        }
      } else {
        //error for no class or no method
        throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
      }
    } else {
      //error for invalid argument type
      throw new TypeError('We\'re sorry, ' + type + ' is not a valid parameter. You must use a string representing the method you wish to invoke.');
    }
    return this;
  };

  window.Foundation = Foundation;
  $.fn.foundation = foundation;

  // Polyfill for requestAnimationFrame
  (function () {
    if (!Date.now || !window.Date.now) window.Date.now = Date.now = function () {
      return new Date().getTime();
    };

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i];
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      var lastTime = 0;
      window.requestAnimationFrame = function (callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function () {
          callback(lastTime = nextTime);
        }, nextTime - now);
      };
      window.cancelAnimationFrame = clearTimeout;
    }
    /**
     * Polyfill for performance.now, required by rAF
     */
    if (!window.performance || !window.performance.now) {
      window.performance = {
        start: Date.now(),
        now: function () {
          return Date.now() - this.start;
        }
      };
    }
  })();
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function () {},
          fBound = function () {
        return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      if (this.prototype) {
        // native functions don't have a prototype
        fNOP.prototype = this.prototype;
      }
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
  // Polyfill to get the name of a function in IE9
  function functionName(fn) {
    if (Function.prototype.name === undefined) {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = funcNameRegex.exec(fn.toString());
      return results && results.length > 1 ? results[1].trim() : "";
    } else if (fn.prototype === undefined) {
      return fn.constructor.name;
    } else {
      return fn.prototype.constructor.name;
    }
  }
  function parseValue(str) {
    if (/true/.test(str)) return true;else if (/false/.test(str)) return false;else if (!isNaN(str * 1)) return parseFloat(str);
    return str;
  }
  // Convert PascalCase to kebab-case
  // Thank you: http://stackoverflow.com/a/8955580
  function hyphenate(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}(jQuery);
;'use strict';

!function ($) {

  Foundation.Box = {
    ImNotTouchingYou: ImNotTouchingYou,
    GetDimensions: GetDimensions,
    GetOffsets: GetOffsets
  };

  /**
   * Compares the dimensions of an element to a container and determines collision events with container.
   * @function
   * @param {jQuery} element - jQuery object to test for collisions.
   * @param {jQuery} parent - jQuery object to use as bounding container.
   * @param {Boolean} lrOnly - set to true to check left and right values only.
   * @param {Boolean} tbOnly - set to true to check top and bottom values only.
   * @default if no parent object passed, detects collisions with `window`.
   * @returns {Boolean} - true if collision free, false if a collision in any direction.
   */
  function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
    var eleDims = GetDimensions(element),
        top,
        bottom,
        left,
        right;

    if (parent) {
      var parDims = GetDimensions(parent);

      bottom = eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top;
      top = eleDims.offset.top >= parDims.offset.top;
      left = eleDims.offset.left >= parDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= parDims.width;
    } else {
      bottom = eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top;
      top = eleDims.offset.top >= eleDims.windowDims.offset.top;
      left = eleDims.offset.left >= eleDims.windowDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= eleDims.windowDims.width;
    }

    var allDirs = [bottom, top, left, right];

    if (lrOnly) {
      return left === right === true;
    }

    if (tbOnly) {
      return top === bottom === true;
    }

    return allDirs.indexOf(false) === -1;
  };

  /**
   * Uses native methods to return an object of dimension values.
   * @function
   * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
   * @returns {Object} - nested object of integer pixel values
   * TODO - if element is window, return only those values.
   */
  function GetDimensions(elem, test) {
    elem = elem.length ? elem[0] : elem;

    if (elem === window || elem === document) {
      throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
    }

    var rect = elem.getBoundingClientRect(),
        parRect = elem.parentNode.getBoundingClientRect(),
        winRect = document.body.getBoundingClientRect(),
        winY = window.pageYOffset,
        winX = window.pageXOffset;

    return {
      width: rect.width,
      height: rect.height,
      offset: {
        top: rect.top + winY,
        left: rect.left + winX
      },
      parentDims: {
        width: parRect.width,
        height: parRect.height,
        offset: {
          top: parRect.top + winY,
          left: parRect.left + winX
        }
      },
      windowDims: {
        width: winRect.width,
        height: winRect.height,
        offset: {
          top: winY,
          left: winX
        }
      }
    };
  }

  /**
   * Returns an object of top and left integer pixel values for dynamically rendered elements,
   * such as: Tooltip, Reveal, and Dropdown
   * @function
   * @param {jQuery} element - jQuery object for the element being positioned.
   * @param {jQuery} anchor - jQuery object for the element's anchor point.
   * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
   * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
   * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
   * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
   * TODO alter/rewrite to work with `em` values as well/instead of pixels
   */
  function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
    var $eleDims = GetDimensions(element),
        $anchorDims = anchor ? GetDimensions(anchor) : null;

    switch (position) {
      case 'top':
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top
        };
        break;
      case 'right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset,
          top: $anchorDims.offset.top
        };
        break;
      case 'center top':
        return {
          left: $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'center bottom':
        return {
          left: isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      case 'center left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center':
        return {
          left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2,
          top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'reveal':
        return {
          left: ($eleDims.windowDims.width - $eleDims.width) / 2,
          top: $eleDims.windowDims.offset.top + vOffset
        };
      case 'reveal full':
        return {
          left: $eleDims.windowDims.offset.left,
          top: $eleDims.windowDims.offset.top
        };
        break;
      default:
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
    }
  }
}(jQuery);
;/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/

'use strict';

!function ($) {

  var keyCodes = {
    9: 'TAB',
    13: 'ENTER',
    27: 'ESCAPE',
    32: 'SPACE',
    37: 'ARROW_LEFT',
    38: 'ARROW_UP',
    39: 'ARROW_RIGHT',
    40: 'ARROW_DOWN'
  };

  var commands = {};

  var Keyboard = {
    keys: getKeyCodes(keyCodes),

    /**
     * Parses the (keyboard) event and returns a String that represents its key
     * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
     * @param {Event} event - the event generated by the event handler
     * @return String key - String that represents the key pressed
     */
    parseKey: function (event) {
      var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();
      if (event.shiftKey) key = 'SHIFT_' + key;
      if (event.ctrlKey) key = 'CTRL_' + key;
      if (event.altKey) key = 'ALT_' + key;
      return key;
    },


    /**
     * Handles the given (keyboard) event
     * @param {Event} event - the event generated by the event handler
     * @param {String} component - Foundation component's name, e.g. Slider or Reveal
     * @param {Objects} functions - collection of functions that are to be executed
     */
    handleKey: function (event, component, functions) {
      var commandList = commands[component],
          keyCode = this.parseKey(event),
          cmds,
          command,
          fn;

      if (!commandList) return console.warn('Component not defined!');

      if (typeof commandList.ltr === 'undefined') {
        // this component does not differentiate between ltr and rtl
        cmds = commandList; // use plain list
      } else {
          // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
          if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);else cmds = $.extend({}, commandList.rtl, commandList.ltr);
        }
      command = cmds[keyCode];

      fn = functions[command];
      if (fn && typeof fn === 'function') {
        // execute function  if exists
        fn.apply();
        if (functions.handled || typeof functions.handled === 'function') {
          // execute function when event was handled
          functions.handled.apply();
        }
      } else {
        if (functions.unhandled || typeof functions.unhandled === 'function') {
          // execute function when event was not handled
          functions.unhandled.apply();
        }
      }
    },


    /**
     * Finds all focusable elements within the given `$element`
     * @param {jQuery} $element - jQuery object to search within
     * @return {jQuery} $focusable - all focusable elements within `$element`
     */
    findFocusable: function ($element) {
      return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
        if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) {
          return false;
        } //only have visible elements and those that have a tabindex greater or equal 0
        return true;
      });
    },


    /**
     * Returns the component name name
     * @param {Object} component - Foundation component, e.g. Slider or Reveal
     * @return String componentName
     */

    register: function (componentName, cmds) {
      commands[componentName] = cmds;
    }
  };

  /*
   * Constants for easier comparing.
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   */
  function getKeyCodes(kcs) {
    var k = {};
    for (var kc in kcs) {
      k[kcs[kc]] = kcs[kc];
    }return k;
  }

  Foundation.Keyboard = Keyboard;
}(jQuery);
;'use strict';

!function ($) {

  // Default set of media queries
  var defaultQueries = {
    'default': 'only screen',
    landscape: 'only screen and (orientation: landscape)',
    portrait: 'only screen and (orientation: portrait)',
    retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
  };

  var MediaQuery = {
    queries: [],

    current: '',

    /**
     * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
     * @function
     * @private
     */
    _init: function () {
      var self = this;
      var extractedStyles = $('.foundation-mq').css('font-family');
      var namedQueries;

      namedQueries = parseStyleToObject(extractedStyles);

      for (var key in namedQueries) {
        self.queries.push({
          name: key,
          value: 'only screen and (min-width: ' + namedQueries[key] + ')'
        });
      }

      this.current = this._getCurrentSize();

      this._watcher();
    },


    /**
     * Checks if the screen is at least as wide as a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to check.
     * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
     */
    atLeast: function (size) {
      var query = this.get(size);

      if (query) {
        return window.matchMedia(query).matches;
      }

      return false;
    },


    /**
     * Gets the media query of a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to get.
     * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
     */
    get: function (size) {
      for (var i in this.queries) {
        var query = this.queries[i];
        if (size === query.name) return query.value;
      }

      return null;
    },


    /**
     * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
     * @function
     * @private
     * @returns {String} Name of the current breakpoint.
     */
    _getCurrentSize: function () {
      var matched;

      for (var i in this.queries) {
        var query = this.queries[i];

        if (window.matchMedia(query.value).matches) {
          matched = query;
        }
      }

      if (typeof matched === 'object') {
        return matched.name;
      } else {
        return matched;
      }
    },


    /**
     * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
     * @function
     * @private
     */
    _watcher: function () {
      var _this = this;

      $(window).on('resize.zf.mediaquery', function () {
        var newSize = _this._getCurrentSize();

        if (newSize !== _this.current) {
          // Broadcast the media query change on the window
          $(window).trigger('changed.zf.mediaquery', [newSize, _this.current]);

          // Change the current media query
          _this.current = newSize;
        }
      });
    }
  };

  Foundation.MediaQuery = MediaQuery;

  // matchMedia() polyfill - Test a CSS media type/query in JS.
  // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
  window.matchMedia || (window.matchMedia = function () {
    'use strict';

    // For browsers that support matchMedium api such as IE 9 and webkit

    var styleMedia = window.styleMedia || window.media;

    // For those that don't support matchMedium
    if (!styleMedia) {
      var style = document.createElement('style'),
          script = document.getElementsByTagName('script')[0],
          info = null;

      style.type = 'text/css';
      style.id = 'matchmediajs-test';

      script.parentNode.insertBefore(style, script);

      // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
      info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

      styleMedia = {
        matchMedium: function (media) {
          var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

          // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
          if (style.styleSheet) {
            style.styleSheet.cssText = text;
          } else {
            style.textContent = text;
          }

          // Test if media query is true or false
          return info.width === '1px';
        }
      };
    }

    return function (media) {
      return {
        matches: styleMedia.matchMedium(media || 'all'),
        media: media || 'all'
      };
    };
  }());

  // Thank you: https://github.com/sindresorhus/query-string
  function parseStyleToObject(str) {
    var styleObject = {};

    if (typeof str !== 'string') {
      return styleObject;
    }

    str = str.trim().slice(1, -1); // browsers re-quote string style values

    if (!str) {
      return styleObject;
    }

    styleObject = str.split('&').reduce(function (ret, param) {
      var parts = param.replace(/\+/g, ' ').split('=');
      var key = parts[0];
      var val = parts[1];
      key = decodeURIComponent(key);

      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val);

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val;
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
      return ret;
    }, {});

    return styleObject;
  }

  Foundation.MediaQuery = MediaQuery;
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Motion module.
   * @module foundation.motion
   */

  var initClasses = ['mui-enter', 'mui-leave'];
  var activeClasses = ['mui-enter-active', 'mui-leave-active'];

  var Motion = {
    animateIn: function (element, animation, cb) {
      animate(true, element, animation, cb);
    },

    animateOut: function (element, animation, cb) {
      animate(false, element, animation, cb);
    }
  };

  function Move(duration, elem, fn) {
    var anim,
        prog,
        start = null;
    // console.log('called');

    function move(ts) {
      if (!start) start = window.performance.now();
      // console.log(start, ts);
      prog = ts - start;
      fn.apply(elem);

      if (prog < duration) {
        anim = window.requestAnimationFrame(move, elem);
      } else {
        window.cancelAnimationFrame(anim);
        elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      }
    }
    anim = window.requestAnimationFrame(move);
  }

  /**
   * Animates an element in or out using a CSS transition class.
   * @function
   * @private
   * @param {Boolean} isIn - Defines if the animation is in or out.
   * @param {Object} element - jQuery or HTML object to animate.
   * @param {String} animation - CSS class to use.
   * @param {Function} cb - Callback to run when animation is finished.
   */
  function animate(isIn, element, animation, cb) {
    element = $(element).eq(0);

    if (!element.length) return;

    var initClass = isIn ? initClasses[0] : initClasses[1];
    var activeClass = isIn ? activeClasses[0] : activeClasses[1];

    // Set up the animation
    reset();

    element.addClass(animation).css('transition', 'none');

    requestAnimationFrame(function () {
      element.addClass(initClass);
      if (isIn) element.show();
    });

    // Start the animation
    requestAnimationFrame(function () {
      element[0].offsetWidth;
      element.css('transition', '').addClass(activeClass);
    });

    // Clean up the animation when it finishes
    element.one(Foundation.transitionend(element), finish);

    // Hides the element (for out animations), resets the element, and runs a callback
    function finish() {
      if (!isIn) element.hide();
      reset();
      if (cb) cb.apply(element);
    }

    // Resets transitions and removes motion-specific classes
    function reset() {
      element[0].style.transitionDuration = 0;
      element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
    }
  }

  Foundation.Move = Move;
  Foundation.Motion = Motion;
}(jQuery);
;'use strict';

!function ($) {

  var Nest = {
    Feather: function (menu) {
      var type = arguments.length <= 1 || arguments[1] === undefined ? 'zf' : arguments[1];

      menu.attr('role', 'menubar');

      var items = menu.find('li').attr({ 'role': 'menuitem' }),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('a:first').attr('tabindex', 0);

      items.each(function () {
        var $item = $(this),
            $sub = $item.children('ul');

        if ($sub.length) {
          $item.addClass(hasSubClass).attr({
            'aria-haspopup': true,
            'aria-expanded': false,
            'aria-label': $item.children('a:first').text()
          });

          $sub.addClass('submenu ' + subMenuClass).attr({
            'data-submenu': '',
            'aria-hidden': true,
            'role': 'menu'
          });
        }

        if ($item.parent('[data-submenu]').length) {
          $item.addClass('is-submenu-item ' + subItemClass);
        }
      });

      return;
    },
    Burn: function (menu, type) {
      var items = menu.find('li').removeAttr('tabindex'),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('*').removeClass(subMenuClass + ' ' + subItemClass + ' ' + hasSubClass + ' is-submenu-item submenu is-active').removeAttr('data-submenu').css('display', '');

      // console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
      //           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
      //           .removeAttr('data-submenu'));
      // items.each(function(){
      //   var $item = $(this),
      //       $sub = $item.children('ul');
      //   if($item.parent('[data-submenu]').length){
      //     $item.removeClass('is-submenu-item ' + subItemClass);
      //   }
      //   if($sub.length){
      //     $item.removeClass('has-submenu');
      //     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
      //   }
      // });
    }
  };

  Foundation.Nest = Nest;
}(jQuery);
;'use strict';

!function ($) {

  function Timer(elem, options, cb) {
    var _this = this,
        duration = options.duration,
        //options is an object for easily adding features later.
    nameSpace = Object.keys(elem.data())[0] || 'timer',
        remain = -1,
        start,
        timer;

    this.isPaused = false;

    this.restart = function () {
      remain = -1;
      clearTimeout(timer);
      this.start();
    };

    this.start = function () {
      this.isPaused = false;
      // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      remain = remain <= 0 ? duration : remain;
      elem.data('paused', false);
      start = Date.now();
      timer = setTimeout(function () {
        if (options.infinite) {
          _this.restart(); //rerun the timer.
        }
        cb();
      }, remain);
      elem.trigger('timerstart.zf.' + nameSpace);
    };

    this.pause = function () {
      this.isPaused = true;
      //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      elem.data('paused', true);
      var end = Date.now();
      remain = remain - (end - start);
      elem.trigger('timerpaused.zf.' + nameSpace);
    };
  }

  /**
   * Runs a callback function when images are fully loaded.
   * @param {Object} images - Image(s) to check if loaded.
   * @param {Func} callback - Function to execute when image is fully loaded.
   */
  function onImagesLoaded(images, callback) {
    var self = this,
        unloaded = images.length;

    if (unloaded === 0) {
      callback();
    }

    images.each(function () {
      if (this.complete) {
        singleImageLoaded();
      } else if (typeof this.naturalWidth !== 'undefined' && this.naturalWidth > 0) {
        singleImageLoaded();
      } else {
        $(this).one('load', function () {
          singleImageLoaded();
        });
      }
    });

    function singleImageLoaded() {
      unloaded--;
      if (unloaded === 0) {
        callback();
      }
    }
  }

  Foundation.Timer = Timer;
  Foundation.onImagesLoaded = onImagesLoaded;
}(jQuery);
;//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************
(function ($) {

	$.spotSwipe = {
		version: '1.0.0',
		enabled: 'ontouchstart' in document.documentElement,
		preventDefault: false,
		moveThreshold: 75,
		timeThreshold: 200
	};

	var startPosX,
	    startPosY,
	    startTime,
	    elapsedTime,
	    isMoving = false;

	function onTouchEnd() {
		//  alert(this);
		this.removeEventListener('touchmove', onTouchMove);
		this.removeEventListener('touchend', onTouchEnd);
		isMoving = false;
	}

	function onTouchMove(e) {
		if ($.spotSwipe.preventDefault) {
			e.preventDefault();
		}
		if (isMoving) {
			var x = e.touches[0].pageX;
			var y = e.touches[0].pageY;
			var dx = startPosX - x;
			var dy = startPosY - y;
			var dir;
			elapsedTime = new Date().getTime() - startTime;
			if (Math.abs(dx) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
				dir = dx > 0 ? 'left' : 'right';
			}
			// else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
			//   dir = dy > 0 ? 'down' : 'up';
			// }
			if (dir) {
				e.preventDefault();
				onTouchEnd.call(this);
				$(this).trigger('swipe', dir).trigger('swipe' + dir);
			}
		}
	}

	function onTouchStart(e) {
		if (e.touches.length == 1) {
			startPosX = e.touches[0].pageX;
			startPosY = e.touches[0].pageY;
			isMoving = true;
			startTime = new Date().getTime();
			this.addEventListener('touchmove', onTouchMove, false);
			this.addEventListener('touchend', onTouchEnd, false);
		}
	}

	function init() {
		this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
	}

	function teardown() {
		this.removeEventListener('touchstart', onTouchStart);
	}

	$.event.special.swipe = { setup: init };

	$.each(['left', 'up', 'down', 'right'], function () {
		$.event.special['swipe' + this] = { setup: function () {
				$(this).on('swipe', $.noop);
			} };
	});
})(jQuery);
/****************************************************
 * Method for adding psuedo drag events to elements *
 ***************************************************/
!function ($) {
	$.fn.addTouch = function () {
		this.each(function (i, el) {
			$(el).bind('touchstart touchmove touchend touchcancel', function () {
				//we pass the original event object because the jQuery event
				//object is normalized to w3c specs and does not provide the TouchList
				handleTouch(event);
			});
		});

		var handleTouch = function (event) {
			var touches = event.changedTouches,
			    first = touches[0],
			    eventTypes = {
				touchstart: 'mousedown',
				touchmove: 'mousemove',
				touchend: 'mouseup'
			},
			    type = eventTypes[event.type],
			    simulatedEvent;

			if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
				simulatedEvent = window.MouseEvent(type, {
					'bubbles': true,
					'cancelable': true,
					'screenX': first.screenX,
					'screenY': first.screenY,
					'clientX': first.clientX,
					'clientY': first.clientY
				});
			} else {
				simulatedEvent = document.createEvent('MouseEvent');
				simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/, null);
			}
			first.target.dispatchEvent(simulatedEvent);
		};
	};
}(jQuery);

//**********************************
//**From the jQuery Mobile Library**
//**need to recreate functionality**
//**and try to improve if possible**
//**********************************

/* Removing the jQuery function ****
************************************

(function( $, window, undefined ) {

	var $document = $( document ),
		// supportTouch = $.mobile.support.touch,
		touchStartEvent = 'touchstart'//supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = 'touchend'//supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = 'touchmove'//supportTouch ? "touchmove" : "mousemove";

	// setup new event shortcuts
	$.each( ( "touchstart touchmove touchend " +
		"swipe swipeleft swiperight" ).split( " " ), function( i, name ) {

		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};

		// jQuery < 1.8
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});

	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}

	// also handles taphold

	// Also handles swipeleft, swiperight
	$.event.special.swipe = {

		// More than this horizontal displacement, and we will suppress scrolling.
		scrollSupressionThreshold: 30,

		// More time than this, and it isn't a swipe.
		durationThreshold: 1000,

		// Swipe horizontal displacement must be more than this.
		horizontalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		// Swipe vertical displacement must be less than this.
		verticalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;

			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {

				// iOS4 clientX/clientY have the value that should have been
				// in pageX/pageY. While pageX/page/ have the value 0
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {

				// Some Android browsers have totally bogus values for clientX/Y
				// when scrolling/zooming a page. Detectable since clientX/clientY
				// should never be smaller than pageX/pageY minus page scroll
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}

			return {
				x: x,
				y: y
			};
		},

		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},

		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},

		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},

		// This serves as a flag to ensure that at most one swipe event event is
		// in work at any given time
		eventInProgress: false,

		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};

			// Retrieve the events data for this element and add the swipe context
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;

			context.start = function( event ) {

				// Bail if we're already working on a swipe event
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;

				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;

				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}

					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {

							// Reset the context to make way for the next swipe event
							$.event.special.swipe.eventInProgress = false;
						}
					}
					// prevent scrolling
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};

				context.stop = function() {
						emitted = true;

						// Reset the context to make way for the next swipe event
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};

				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},

		teardown: function() {
			var events, context;

			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}

			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {

		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );
*/
;'use strict';

!function ($) {

  var MutationObserver = function () {
    var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
    for (var i = 0; i < prefixes.length; i++) {
      if (prefixes[i] + 'MutationObserver' in window) {
        return window[prefixes[i] + 'MutationObserver'];
      }
    }
    return false;
  }();

  var triggers = function (el, type) {
    el.data(type).split(' ').forEach(function (id) {
      $('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
    });
  };
  // Elements with [data-open] will reveal a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-open]', function () {
    triggers($(this), 'open');
  });

  // Elements with [data-close] will close a plugin that supports it when clicked.
  // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
  $(document).on('click.zf.trigger', '[data-close]', function () {
    var id = $(this).data('close');
    if (id) {
      triggers($(this), 'close');
    } else {
      $(this).trigger('close.zf.trigger');
    }
  });

  // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-toggle]', function () {
    triggers($(this), 'toggle');
  });

  // Elements with [data-closable] will respond to close.zf.trigger events.
  $(document).on('close.zf.trigger', '[data-closable]', function (e) {
    e.stopPropagation();
    var animation = $(this).data('closable');

    if (animation !== '') {
      Foundation.Motion.animateOut($(this), animation, function () {
        $(this).trigger('closed.zf');
      });
    } else {
      $(this).fadeOut().trigger('closed.zf');
    }
  });

  $(document).on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', function () {
    var id = $(this).data('toggle-focus');
    $('#' + id).triggerHandler('toggle.zf.trigger', [$(this)]);
  });

  /**
  * Fires once after all other scripts have loaded
  * @function
  * @private
  */
  $(window).load(function () {
    checkListeners();
  });

  function checkListeners() {
    eventsListener();
    resizeListener();
    scrollListener();
    closemeListener();
  }

  //******** only fires this function once on load, if there's something to watch ********
  function closemeListener(pluginName) {
    var yetiBoxes = $('[data-yeti-box]'),
        plugNames = ['dropdown', 'tooltip', 'reveal'];

    if (pluginName) {
      if (typeof pluginName === 'string') {
        plugNames.push(pluginName);
      } else if (typeof pluginName === 'object' && typeof pluginName[0] === 'string') {
        plugNames.concat(pluginName);
      } else {
        console.error('Plugin names must be strings');
      }
    }
    if (yetiBoxes.length) {
      var listeners = plugNames.map(function (name) {
        return 'closeme.zf.' + name;
      }).join(' ');

      $(window).off(listeners).on(listeners, function (e, pluginId) {
        var plugin = e.namespace.split('.')[0];
        var plugins = $('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');

        plugins.each(function () {
          var _this = $(this);

          _this.triggerHandler('close.zf.trigger', [_this]);
        });
      });
    }
  }

  function resizeListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-resize]');
    if ($nodes.length) {
      $(window).off('resize.zf.trigger').on('resize.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('resizeme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a resize event
          $nodes.attr('data-events', "resize");
        }, debounce || 10); //default time to emit resize event
      });
    }
  }

  function scrollListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-scroll]');
    if ($nodes.length) {
      $(window).off('scroll.zf.trigger').on('scroll.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('scrollme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a scroll event
          $nodes.attr('data-events', "scroll");
        }, debounce || 10); //default time to emit scroll event
      });
    }
  }

  function eventsListener() {
    if (!MutationObserver) {
      return false;
    }
    var nodes = document.querySelectorAll('[data-resize], [data-scroll], [data-mutate]');

    //element callback
    var listeningElementsMutation = function (mutationRecordsList) {
      var $target = $(mutationRecordsList[0].target);
      //trigger the event handler for the element depending on type
      switch ($target.attr("data-events")) {

        case "resize":
          $target.triggerHandler('resizeme.zf.trigger', [$target]);
          break;

        case "scroll":
          $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
          break;

        // case "mutate" :
        // console.log('mutate', $target);
        // $target.triggerHandler('mutate.zf.trigger');
        //
        // //make sure we don't get stuck in an infinite loop from sloppy codeing
        // if ($target.index('[data-mutate]') == $("[data-mutate]").length-1) {
        //   domMutationObserver();
        // }
        // break;

        default:
          return false;
        //nothing
      }
    };

    if (nodes.length) {
      //for each element that needs to listen for resizing, scrolling, (or coming soon mutation) add a single observer
      for (var i = 0; i <= nodes.length - 1; i++) {
        var elementObserver = new MutationObserver(listeningElementsMutation);
        elementObserver.observe(nodes[i], { attributes: true, childList: false, characterData: false, subtree: false, attributeFilter: ["data-events"] });
      }
    }
  }

  // ------------------------------------

  // [PH]
  // Foundation.CheckWatchers = checkWatchers;
  Foundation.IHearYou = checkListeners;
  // Foundation.ISeeYou = scrollListener;
  // Foundation.IFeelYou = closemeListener;
}(jQuery);

// function domMutationObserver(debounce) {
//   // !!! This is coming soon and needs more work; not active  !!! //
//   var timer,
//   nodes = document.querySelectorAll('[data-mutate]');
//   //
//   if (nodes.length) {
//     // var MutationObserver = (function () {
//     //   var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
//     //   for (var i=0; i < prefixes.length; i++) {
//     //     if (prefixes[i] + 'MutationObserver' in window) {
//     //       return window[prefixes[i] + 'MutationObserver'];
//     //     }
//     //   }
//     //   return false;
//     // }());
//
//
//     //for the body, we need to listen for all changes effecting the style and class attributes
//     var bodyObserver = new MutationObserver(bodyMutation);
//     bodyObserver.observe(document.body, { attributes: true, childList: true, characterData: false, subtree:true, attributeFilter:["style", "class"]});
//
//
//     //body callback
//     function bodyMutation(mutate) {
//       //trigger all listening elements and signal a mutation event
//       if (timer) { clearTimeout(timer); }
//
//       timer = setTimeout(function() {
//         bodyObserver.disconnect();
//         $('[data-mutate]').attr('data-events',"mutate");
//       }, debounce || 150);
//     }
//   }
// }
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Dropdown module.
   * @module foundation.dropdown
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   */

  var Dropdown = function () {
    /**
     * Creates a new instance of a dropdown.
     * @class
     * @param {jQuery} element - jQuery object to make into a dropdown.
     *        Object should be of the dropdown panel, rather than its anchor.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Dropdown(element, options) {
      _classCallCheck(this, Dropdown);

      this.$element = element;
      this.options = $.extend({}, Dropdown.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Dropdown');
      Foundation.Keyboard.register('Dropdown', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close',
        'TAB': 'tab_forward',
        'SHIFT_TAB': 'tab_backward'
      });
    }

    /**
     * Initializes the plugin by setting/checking options and attributes, adding helper variables, and saving the anchor.
     * @function
     * @private
     */


    _createClass(Dropdown, [{
      key: '_init',
      value: function _init() {
        var $id = this.$element.attr('id');

        this.$anchor = $('[data-toggle="' + $id + '"]') || $('[data-open="' + $id + '"]');
        this.$anchor.attr({
          'aria-controls': $id,
          'data-is-focus': false,
          'data-yeti-box': $id,
          'aria-haspopup': true,
          'aria-expanded': false

        });

        this.options.positionClass = this.getPositionClass();
        this.counter = 4;
        this.usedPositions = [];
        this.$element.attr({
          'aria-hidden': 'true',
          'data-yeti-box': $id,
          'data-resize': $id,
          'aria-labelledby': this.$anchor[0].id || Foundation.GetYoDigits(6, 'dd-anchor')
        });
        this._events();
      }

      /**
       * Helper function to determine current orientation of dropdown pane.
       * @function
       * @returns {String} position - string value of a position class.
       */

    }, {
      key: 'getPositionClass',
      value: function getPositionClass() {
        var position = this.$element[0].className.match(/\b(top|left|right)\b/g);
        position = position ? position[0] : '';
        return position;
      }

      /**
       * Adjusts the dropdown panes orientation by adding/removing positioning classes.
       * @function
       * @private
       * @param {String} position - position class to remove.
       */

    }, {
      key: '_reposition',
      value: function _reposition(position) {
        this.usedPositions.push(position ? position : 'bottom');
        //default, try switching to opposite side
        if (!position && this.usedPositions.indexOf('top') < 0) {
          this.$element.addClass('top');
        } else if (position === 'top' && this.usedPositions.indexOf('bottom') < 0) {
          this.$element.removeClass(position);
        } else if (position === 'left' && this.usedPositions.indexOf('right') < 0) {
          this.$element.removeClass(position).addClass('right');
        } else if (position === 'right' && this.usedPositions.indexOf('left') < 0) {
          this.$element.removeClass(position).addClass('left');
        }

        //if default change didn't work, try bottom or left first
        else if (!position && this.usedPositions.indexOf('top') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.$element.addClass('left');
          } else if (position === 'top' && this.usedPositions.indexOf('bottom') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.$element.removeClass(position).addClass('left');
          } else if (position === 'left' && this.usedPositions.indexOf('right') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.$element.removeClass(position);
          } else if (position === 'right' && this.usedPositions.indexOf('left') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.$element.removeClass(position);
          }
          //if nothing cleared, set to bottom
          else {
              this.$element.removeClass(position);
            }
        this.classChanged = true;
        this.counter--;
      }

      /**
       * Sets the position and orientation of the dropdown pane, checks for collisions.
       * Recursively calls itself if a collision is detected, with a new position class.
       * @function
       * @private
       */

    }, {
      key: '_setPosition',
      value: function _setPosition() {
        if (this.$anchor.attr('aria-expanded') === 'false') {
          return false;
        }
        var position = this.getPositionClass(),
            $eleDims = Foundation.Box.GetDimensions(this.$element),
            $anchorDims = Foundation.Box.GetDimensions(this.$anchor),
            _this = this,
            direction = position === 'left' ? 'left' : position === 'right' ? 'left' : 'top',
            param = direction === 'top' ? 'height' : 'width',
            offset = param === 'height' ? this.options.vOffset : this.options.hOffset;

        if ($eleDims.width >= $eleDims.windowDims.width || !this.counter && !Foundation.Box.ImNotTouchingYou(this.$element)) {
          this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            'width': $eleDims.windowDims.width - this.options.hOffset * 2,
            'height': 'auto'
          });
          this.classChanged = true;
          return false;
        }

        this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, position, this.options.vOffset, this.options.hOffset));

        while (!Foundation.Box.ImNotTouchingYou(this.$element) && this.counter) {
          this._reposition(position);
          this._setPosition();
        }
      }

      /**
       * Adds event listeners to the element utilizing the triggers utility library.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'resizeme.zf.trigger': this._setPosition.bind(this)
        });

        if (this.options.hover) {
          this.$anchor.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.open();
              _this.$anchor.data('hover', true);
            }, _this.options.hoverDelay);
          }).on('mouseleave.zf.dropdown', function () {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.close();
              _this.$anchor.data('hover', false);
            }, _this.options.hoverDelay);
          });
          if (this.options.hoverPane) {
            this.$element.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
              clearTimeout(_this.timeout);
            }).on('mouseleave.zf.dropdown', function () {
              clearTimeout(_this.timeout);
              _this.timeout = setTimeout(function () {
                _this.close();
                _this.$anchor.data('hover', false);
              }, _this.options.hoverDelay);
            });
          }
        }
        this.$anchor.add(this.$element).on('keydown.zf.dropdown', function (e) {

          var $target = $(this),
              visibleFocusableElements = Foundation.Keyboard.findFocusable(_this.$element);

          Foundation.Keyboard.handleKey(e, 'Dropdown', {
            tab_forward: function () {
              if (_this.$element.find(':focus').is(visibleFocusableElements.eq(-1))) {
                // left modal downwards, setting focus to first element
                if (_this.options.trapFocus) {
                  // if focus shall be trapped
                  visibleFocusableElements.eq(0).focus();
                  e.preventDefault();
                } else {
                  // if focus is not trapped, close dropdown on focus out
                  _this.close();
                }
              }
            },
            tab_backward: function () {
              if (_this.$element.find(':focus').is(visibleFocusableElements.eq(0)) || _this.$element.is(':focus')) {
                // left modal upwards, setting focus to last element
                if (_this.options.trapFocus) {
                  // if focus shall be trapped
                  visibleFocusableElements.eq(-1).focus();
                  e.preventDefault();
                } else {
                  // if focus is not trapped, close dropdown on focus out
                  _this.close();
                }
              }
            },
            open: function () {
              if ($target.is(_this.$anchor)) {
                _this.open();
                _this.$element.attr('tabindex', -1).focus();
                e.preventDefault();
              }
            },
            close: function () {
              _this.close();
              _this.$anchor.focus();
            }
          });
        });
      }

      /**
       * Adds an event handler to the body to close any dropdowns on a click.
       * @function
       * @private
       */

    }, {
      key: '_addBodyHandler',
      value: function _addBodyHandler() {
        var $body = $(document.body).not(this.$element),
            _this = this;
        $body.off('click.zf.dropdown').on('click.zf.dropdown', function (e) {
          if (_this.$anchor.is(e.target) || _this.$anchor.find(e.target).length) {
            return;
          }
          if (_this.$element.find(e.target).length) {
            return;
          }
          _this.close();
          $body.off('click.zf.dropdown');
        });
      }

      /**
       * Opens the dropdown pane, and fires a bubbling event to close other dropdowns.
       * @function
       * @fires Dropdown#closeme
       * @fires Dropdown#show
       */

    }, {
      key: 'open',
      value: function open() {
        // var _this = this;
        /**
         * Fires to close other open dropdowns
         * @event Dropdown#closeme
         */
        this.$element.trigger('closeme.zf.dropdown', this.$element.attr('id'));
        this.$anchor.addClass('hover').attr({ 'aria-expanded': true });
        // this.$element/*.show()*/;
        this._setPosition();
        this.$element.addClass('is-open').attr({ 'aria-hidden': false });

        if (this.options.autoFocus) {
          var $focusable = Foundation.Keyboard.findFocusable(this.$element);
          if ($focusable.length) {
            $focusable.eq(0).focus();
          }
        }

        if (this.options.closeOnClick) {
          this._addBodyHandler();
        }

        /**
         * Fires once the dropdown is visible.
         * @event Dropdown#show
         */
        this.$element.trigger('show.zf.dropdown', [this.$element]);
      }

      /**
       * Closes the open dropdown pane.
       * @function
       * @fires Dropdown#hide
       */

    }, {
      key: 'close',
      value: function close() {
        if (!this.$element.hasClass('is-open')) {
          return false;
        }
        this.$element.removeClass('is-open').attr({ 'aria-hidden': true });

        this.$anchor.removeClass('hover').attr('aria-expanded', false);

        if (this.classChanged) {
          var curPositionClass = this.getPositionClass();
          if (curPositionClass) {
            this.$element.removeClass(curPositionClass);
          }
          this.$element.addClass(this.options.positionClass)
          /*.hide()*/.css({ height: '', width: '' });
          this.classChanged = false;
          this.counter = 4;
          this.usedPositions.length = 0;
        }
        this.$element.trigger('hide.zf.dropdown', [this.$element]);
      }

      /**
       * Toggles the dropdown pane's visibility.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.$element.hasClass('is-open')) {
          if (this.$anchor.data('hover')) return;
          this.close();
        } else {
          this.open();
        }
      }

      /**
       * Destroys the dropdown.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.trigger').hide();
        this.$anchor.off('.zf.dropdown');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Dropdown;
  }();

  Dropdown.defaults = {
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 250
     */
    hoverDelay: 250,
    /**
     * Allow submenus to open on hover events
     * @option
     * @example false
     */
    hover: false,
    /**
     * Don't close dropdown when hovering over dropdown pane
     * @option
     * @example true
     */
    hoverPane: false,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    vOffset: 1,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    hOffset: 1,
    /**
     * Class applied to adjust open position. JS will test and fill this in.
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Allow the plugin to trap focus to the dropdown pane if opened with keyboard commands.
     * @option
     * @example false
     */
    trapFocus: false,
    /**
     * Allow the plugin to set focus to the first focusable element within the pane, regardless of method of opening.
     * @option
     * @example true
     */
    autoFocus: false,
    /**
     * Allows a click on the body to close the dropdown.
     * @option
     * @example false
     */
    closeOnClick: false
  };

  // Window exports
  Foundation.plugin(Dropdown, 'Dropdown');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * DropdownMenu module.
   * @module foundation.dropdown-menu
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.nest
   */

  var DropdownMenu = function () {
    /**
     * Creates a new instance of DropdownMenu.
     * @class
     * @fires DropdownMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function DropdownMenu(element, options) {
      _classCallCheck(this, DropdownMenu);

      this.$element = element;
      this.options = $.extend({}, DropdownMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'dropdown');
      this._init();

      Foundation.registerPlugin(this, 'DropdownMenu');
      Foundation.Keyboard.register('DropdownMenu', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the plugin, and calls _prepareMenu
     * @private
     * @function
     */


    _createClass(DropdownMenu, [{
      key: '_init',
      value: function _init() {
        var subs = this.$element.find('li.is-dropdown-submenu-parent');
        this.$element.children('.is-dropdown-submenu-parent').children('.is-dropdown-submenu').addClass('first-sub');

        this.$menuItems = this.$element.find('[role="menuitem"]');
        this.$tabs = this.$element.children('[role="menuitem"]');
        this.$tabs.find('ul.is-dropdown-submenu').addClass(this.options.verticalClass);

        if (this.$element.hasClass(this.options.rightClass) || this.options.alignment === 'right' || Foundation.rtl()) {
          this.options.alignment = 'right';
          subs.addClass('opens-left');
        } else {
          subs.addClass('opens-right');
        }
        this.changed = false;
        this._events();
      }
    }, {
      key: '_events',

      /**
       * Adds event listeners to elements within the menu
       * @private
       * @function
       */
      value: function _events() {
        var _this = this,
            hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
            parClass = 'is-dropdown-submenu-parent';

        if (this.options.clickOpen || hasTouch) {
          this.$menuItems.on('click.zf.dropdownmenu touchstart.zf.dropdownmenu', function (e) {
            var $elem = $(e.target).parentsUntil('ul', '.' + parClass),
                hasSub = $elem.hasClass(parClass),
                hasClicked = $elem.attr('data-is-click') === 'true',
                $sub = $elem.children('.is-dropdown-submenu');

            if (hasSub) {
              if (hasClicked) {
                if (!_this.options.closeOnClick || !_this.options.clickOpen && !hasTouch || _this.options.forceFollow && hasTouch) {
                  return;
                } else {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  _this._hide($elem);
                }
              } else {
                e.preventDefault();
                e.stopImmediatePropagation();
                _this._show($elem.children('.is-dropdown-submenu'));
                $elem.add($elem.parentsUntil(_this.$element, '.' + parClass)).attr('data-is-click', true);
              }
            } else {
              return;
            }
          });
        }

        if (!this.options.disableHover) {
          this.$menuItems.on('mouseenter.zf.dropdownmenu', function (e) {
            e.stopImmediatePropagation();
            var $elem = $(this),
                hasSub = $elem.hasClass(parClass);

            if (hasSub) {
              clearTimeout(_this.delay);
              _this.delay = setTimeout(function () {
                _this._show($elem.children('.is-dropdown-submenu'));
              }, _this.options.hoverDelay);
            }
          }).on('mouseleave.zf.dropdownmenu', function (e) {
            var $elem = $(this),
                hasSub = $elem.hasClass(parClass);
            if (hasSub && _this.options.autoclose) {
              if ($elem.attr('data-is-click') === 'true' && _this.options.clickOpen) {
                return false;
              }

              clearTimeout(_this.delay);
              _this.delay = setTimeout(function () {
                _this._hide($elem);
              }, _this.options.closingTime);
            }
          });
        }
        this.$menuItems.on('keydown.zf.dropdownmenu', function (e) {
          var $element = $(e.target).parentsUntil('ul', '[role="menuitem"]'),
              isTab = _this.$tabs.index($element) > -1,
              $elements = isTab ? _this.$tabs : $element.siblings('li').add($element),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(i - 1);
              $nextElement = $elements.eq(i + 1);
              return;
            }
          });

          var nextSibling = function () {
            if (!$element.is(':last-child')) $nextElement.children('a:first').focus();
          },
              prevSibling = function () {
            $prevElement.children('a:first').focus();
          },
              openSub = function () {
            var $sub = $element.children('ul.is-dropdown-submenu');
            if ($sub.length) {
              _this._show($sub);
              $element.find('li > a:first').focus();
            } else {
              return;
            }
          },
              closeSub = function () {
            //if ($element.is(':first-child')) {
            var close = $element.parent('ul').parent('li');
            close.children('a:first').focus();
            _this._hide(close);
            //}
          };
          var functions = {
            open: openSub,
            close: function () {
              _this._hide(_this.$element);
              _this.$menuItems.find('a:first').focus(); // focus to first element
            },
            handled: function () {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          };

          if (isTab) {
            if (_this.vertical) {
              // vertical menu
              if (_this.options.alignment === 'left') {
                // left aligned
                $.extend(functions, {
                  down: nextSibling,
                  up: prevSibling,
                  next: openSub,
                  previous: closeSub
                });
              } else {
                // right aligned
                $.extend(functions, {
                  down: nextSibling,
                  up: prevSibling,
                  next: closeSub,
                  previous: openSub
                });
              }
            } else {
              // horizontal menu
              $.extend(functions, {
                next: nextSibling,
                previous: prevSibling,
                down: openSub,
                up: closeSub
              });
            }
          } else {
            // not tabs -> one sub
            if (_this.options.alignment === 'left') {
              // left aligned
              $.extend(functions, {
                next: openSub,
                previous: closeSub,
                down: nextSibling,
                up: prevSibling
              });
            } else {
              // right aligned
              $.extend(functions, {
                next: closeSub,
                previous: openSub,
                down: nextSibling,
                up: prevSibling
              });
            }
          }
          Foundation.Keyboard.handleKey(e, 'DropdownMenu', functions);
        });
      }

      /**
       * Adds an event handler to the body to close any dropdowns on a click.
       * @function
       * @private
       */

    }, {
      key: '_addBodyHandler',
      value: function _addBodyHandler() {
        var $body = $(document.body),
            _this = this;
        $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu').on('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu', function (e) {
          var $link = _this.$element.find(e.target);
          if ($link.length) {
            return;
          }

          _this._hide();
          $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu');
        });
      }

      /**
       * Opens a dropdown pane, and checks for collisions first.
       * @param {jQuery} $sub - ul element that is a submenu to show
       * @function
       * @private
       * @fires DropdownMenu#show
       */

    }, {
      key: '_show',
      value: function _show($sub) {
        var idx = this.$tabs.index(this.$tabs.filter(function (i, el) {
          return $(el).find($sub).length > 0;
        }));
        var $sibs = $sub.parent('li.is-dropdown-submenu-parent').siblings('li.is-dropdown-submenu-parent');
        this._hide($sibs, idx);
        $sub.css('visibility', 'hidden').addClass('js-dropdown-active').attr({ 'aria-hidden': false }).parent('li.is-dropdown-submenu-parent').addClass('is-active').attr({ 'aria-expanded': true });
        var clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
        if (!clear) {
          var oldClass = this.options.alignment === 'left' ? '-right' : '-left',
              $parentLi = $sub.parent('.is-dropdown-submenu-parent');
          $parentLi.removeClass('opens' + oldClass).addClass('opens-' + this.options.alignment);
          clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
          if (!clear) {
            $parentLi.removeClass('opens-' + this.options.alignment).addClass('opens-inner');
          }
          this.changed = true;
        }
        $sub.css('visibility', '');
        if (this.options.closeOnClick) {
          this._addBodyHandler();
        }
        /**
         * Fires when the new dropdown pane is visible.
         * @event DropdownMenu#show
         */
        this.$element.trigger('show.zf.dropdownmenu', [$sub]);
      }

      /**
       * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
       * @function
       * @param {jQuery} $elem - element with a submenu to hide
       * @param {Number} idx - index of the $tabs collection to hide
       * @private
       */

    }, {
      key: '_hide',
      value: function _hide($elem, idx) {
        var $toClose;
        if ($elem && $elem.length) {
          $toClose = $elem;
        } else if (idx !== undefined) {
          $toClose = this.$tabs.not(function (i, el) {
            return i === idx;
          });
        } else {
          $toClose = this.$element;
        }
        var somethingToClose = $toClose.hasClass('is-active') || $toClose.find('.is-active').length > 0;

        if (somethingToClose) {
          $toClose.find('li.is-active').add($toClose).attr({
            'aria-expanded': false,
            'data-is-click': false
          }).removeClass('is-active');

          $toClose.find('ul.js-dropdown-active').attr({
            'aria-hidden': true
          }).removeClass('js-dropdown-active');

          if (this.changed || $toClose.find('opens-inner').length) {
            var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
            $toClose.find('li.is-dropdown-submenu-parent').add($toClose).removeClass('opens-inner opens-' + this.options.alignment).addClass('opens-' + oldClass);
            this.changed = false;
          }
          /**
           * Fires when the open menus are closed.
           * @event DropdownMenu#hide
           */
          this.$element.trigger('hide.zf.dropdownmenu', [$toClose]);
        }
      }

      /**
       * Destroys the plugin.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$menuItems.off('.zf.dropdownmenu').removeAttr('data-is-click').removeClass('is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner');
        $(document.body).off('.zf.dropdownmenu');
        Foundation.Nest.Burn(this.$element, 'dropdown');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return DropdownMenu;
  }();

  /**
   * Default settings for plugin
   */


  DropdownMenu.defaults = {
    /**
     * Disallows hover events from opening submenus
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
     * @option
     * @example true
     */
    autoclose: true,
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 50
     */
    hoverDelay: 50,
    /**
     * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
     * @option
     * @example true
     */
    clickOpen: false,
    /**
     * Amount of time to delay closing a submenu on a mouseleave event.
     * @option
     * @example 500
     */

    closingTime: 500,
    /**
     * Position of the menu relative to what direction the submenus should open. Handled by JS.
     * @option
     * @example 'left'
     */
    alignment: 'left',
    /**
     * Allow clicks on the body to close any open submenus.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
     * @option
     * @example 'vertical'
     */
    verticalClass: 'vertical',
    /**
     * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
     * @option
     * @example 'align-right'
     */
    rightClass: 'align-right',
    /**
     * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
     * @option
     * @example false
     */
    forceFollow: true
  };

  // Window exports
  Foundation.plugin(DropdownMenu, 'DropdownMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveMenu module.
   * @module foundation.responsiveMenu
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.accordionMenu
   * @requires foundation.util.drilldown
   * @requires foundation.util.dropdown-menu
   */

  var ResponsiveMenu = function () {
    /**
     * Creates a new instance of a responsive menu.
     * @class
     * @fires ResponsiveMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function ResponsiveMenu(element, options) {
      _classCallCheck(this, ResponsiveMenu);

      this.$element = $(element);
      this.rules = this.$element.data('responsive-menu');
      this.currentMq = null;
      this.currentPlugin = null;

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveMenu');
    }

    /**
     * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
     * @function
     * @private
     */


    _createClass(ResponsiveMenu, [{
      key: '_init',
      value: function _init() {
        var rulesTree = {};

        // Parse rules from "classes" in data attribute
        var rules = this.rules.split(' ');

        // Iterate through every rule found
        for (var i = 0; i < rules.length; i++) {
          var rule = rules[i].split('-');
          var ruleSize = rule.length > 1 ? rule[0] : 'small';
          var rulePlugin = rule.length > 1 ? rule[1] : rule[0];

          if (MenuPlugins[rulePlugin] !== null) {
            rulesTree[ruleSize] = MenuPlugins[rulePlugin];
          }
        }

        this.rules = rulesTree;

        if (!$.isEmptyObject(rulesTree)) {
          this._checkMediaQueries();
        }
      }

      /**
       * Initializes events for the Menu.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          _this._checkMediaQueries();
        });
        // $(window).on('resize.zf.ResponsiveMenu', function() {
        //   _this._checkMediaQueries();
        // });
      }

      /**
       * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
       * @function
       * @private
       */

    }, {
      key: '_checkMediaQueries',
      value: function _checkMediaQueries() {
        var matchedMq,
            _this = this;
        // Iterate through each rule and find the last matching rule
        $.each(this.rules, function (key) {
          if (Foundation.MediaQuery.atLeast(key)) {
            matchedMq = key;
          }
        });

        // No match? No dice
        if (!matchedMq) return;

        // Plugin already initialized? We good
        if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

        // Remove existing plugin-specific CSS classes
        $.each(MenuPlugins, function (key, value) {
          _this.$element.removeClass(value.cssClass);
        });

        // Add the CSS class for the new plugin
        this.$element.addClass(this.rules[matchedMq].cssClass);

        // Create an instance of the new plugin
        if (this.currentPlugin) this.currentPlugin.destroy();
        this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
      }

      /**
       * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.currentPlugin.destroy();
        $(window).off('.zf.ResponsiveMenu');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return ResponsiveMenu;
  }();

  ResponsiveMenu.defaults = {};

  // The plugin matches the plugin classes with these plugin instances.
  var MenuPlugins = {
    dropdown: {
      cssClass: 'dropdown',
      plugin: Foundation._plugins['dropdown-menu'] || null
    },
    drilldown: {
      cssClass: 'drilldown',
      plugin: Foundation._plugins['drilldown'] || null
    },
    accordion: {
      cssClass: 'accordion-menu',
      plugin: Foundation._plugins['accordion-menu'] || null
    }
  };

  // Window exports
  Foundation.plugin(ResponsiveMenu, 'ResponsiveMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveToggle module.
   * @module foundation.responsiveToggle
   * @requires foundation.util.mediaQuery
   */

  var ResponsiveToggle = function () {
    /**
     * Creates a new instance of Tab Bar.
     * @class
     * @fires ResponsiveToggle#init
     * @param {jQuery} element - jQuery object to attach tab bar functionality to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function ResponsiveToggle(element, options) {
      _classCallCheck(this, ResponsiveToggle);

      this.$element = $(element);
      this.options = $.extend({}, ResponsiveToggle.defaults, this.$element.data(), options);

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveToggle');
    }

    /**
     * Initializes the tab bar by finding the target element, toggling element, and running update().
     * @function
     * @private
     */


    _createClass(ResponsiveToggle, [{
      key: '_init',
      value: function _init() {
        var targetID = this.$element.data('responsive-toggle');
        if (!targetID) {
          console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
        }

        this.$targetMenu = $('#' + targetID);
        this.$toggler = this.$element.find('[data-toggle]');

        this._update();
      }

      /**
       * Adds necessary event handlers for the tab bar to work.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', this._update.bind(this));

        this.$toggler.on('click.zf.responsiveToggle', this.toggleMenu.bind(this));
      }

      /**
       * Checks the current media query to determine if the tab bar should be visible or hidden.
       * @function
       * @private
       */

    }, {
      key: '_update',
      value: function _update() {
        // Mobile
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$element.show();
          this.$targetMenu.hide();
        }

        // Desktop
        else {
            this.$element.hide();
            this.$targetMenu.show();
          }
      }

      /**
       * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
       * @function
       * @fires ResponsiveToggle#toggled
       */

    }, {
      key: 'toggleMenu',
      value: function toggleMenu() {
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$targetMenu.toggle(0);

          /**
           * Fires when the element attached to the tab bar toggles.
           * @event ResponsiveToggle#toggled
           */
          this.$element.trigger('toggled.zf.responsiveToggle');
        }
      }
    }, {
      key: 'destroy',
      value: function destroy() {
        //TODO this...
      }
    }]);

    return ResponsiveToggle;
  }();

  ResponsiveToggle.defaults = {
    /**
     * The breakpoint after which the menu is always shown, and the tab bar is hidden.
     * @option
     * @example 'medium'
     */
    hideFor: 'medium'
  };

  // Window exports
  Foundation.plugin(ResponsiveToggle, 'ResponsiveToggle');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Reveal module.
   * @module foundation.reveal
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.motion if using animations
   */

  var Reveal = function () {
    /**
     * Creates a new instance of Reveal.
     * @class
     * @param {jQuery} element - jQuery object to use for the modal.
     * @param {Object} options - optional parameters.
     */

    function Reveal(element, options) {
      _classCallCheck(this, Reveal);

      this.$element = element;
      this.options = $.extend({}, Reveal.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Reveal');
      Foundation.Keyboard.register('Reveal', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close',
        'TAB': 'tab_forward',
        'SHIFT_TAB': 'tab_backward'
      });
    }

    /**
     * Initializes the modal by adding the overlay and close buttons, (if selected).
     * @private
     */


    _createClass(Reveal, [{
      key: '_init',
      value: function _init() {
        this.id = this.$element.attr('id');
        this.isActive = false;
        this.cached = { mq: Foundation.MediaQuery.current };
        this.isiOS = iPhoneSniff();

        if (this.isiOS) {
          this.$element.addClass('is-ios');
        }

        this.$anchor = $('[data-open="' + this.id + '"]').length ? $('[data-open="' + this.id + '"]') : $('[data-toggle="' + this.id + '"]');

        if (this.$anchor.length) {
          var anchorId = this.$anchor[0].id || Foundation.GetYoDigits(6, 'reveal');

          this.$anchor.attr({
            'aria-controls': this.id,
            'id': anchorId,
            'aria-haspopup': true,
            'tabindex': 0
          });
          this.$element.attr({ 'aria-labelledby': anchorId });
        }

        if (this.options.fullScreen || this.$element.hasClass('full')) {
          this.options.fullScreen = true;
          this.options.overlay = false;
        }
        if (this.options.overlay && !this.$overlay) {
          this.$overlay = this._makeOverlay(this.id);
        }

        this.$element.attr({
          'role': 'dialog',
          'aria-hidden': true,
          'data-yeti-box': this.id,
          'data-resize': this.id
        });

        if (this.$overlay) {
          this.$element.detach().appendTo(this.$overlay);
        } else {
          this.$element.detach().appendTo($('body'));
          this.$element.addClass('without-overlay');
        }
        this._events();
        if (this.options.deepLink && window.location.hash === '#' + this.id) {
          $(window).one('load.zf.reveal', this.open.bind(this));
        }
      }

      /**
       * Creates an overlay div to display behind the modal.
       * @private
       */

    }, {
      key: '_makeOverlay',
      value: function _makeOverlay(id) {
        var $overlay = $('<div></div>').addClass('reveal-overlay').attr({ 'tabindex': -1, 'aria-hidden': true }).appendTo('body');
        return $overlay;
      }

      /**
       * Updates position of modal
       * TODO:  Figure out if we actually need to cache these values or if it doesn't matter
       * @private
       */

    }, {
      key: '_updatePosition',
      value: function _updatePosition() {
        var width = this.$element.outerWidth();
        var outerWidth = $(window).width();
        var height = this.$element.outerHeight();
        var outerHeight = $(window).height();
        var left = parseInt((outerWidth - width) / 2, 10);
        var top;
        if (height > outerHeight) {
          top = parseInt(Math.min(100, outerHeight / 10), 10);
        } else {
          top = parseInt((outerHeight - height) / 4, 10);
        }
        this.$element.css({ top: top + 'px' });
        // only worry about left if we don't have an overlay, otherwise we're perfectly in the middle
        if (!this.$overlay) {
          this.$element.css({ left: left + 'px' });
        }
      }

      /**
       * Adds event handlers for the modal.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'resizeme.zf.trigger': function () {
            _this._updatePosition();
          }
        });

        if (this.$anchor.length) {
          this.$anchor.on('keydown.zf.reveal', function (e) {
            if (e.which === 13 || e.which === 32) {
              e.stopPropagation();
              e.preventDefault();
              _this.open();
            }
          });
        }

        if (this.options.closeOnClick && this.options.overlay) {
          this.$overlay.off('.zf.reveal').on('click.zf.reveal', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
              return;
            }
            _this.close();
          });
        }
        if (this.options.deepLink) {
          $(window).on('popstate.zf.reveal:' + this.id, this._handleState.bind(this));
        }
      }

      /**
       * Handles modal methods on back/forward button clicks or any other event that triggers popstate.
       * @private
       */

    }, {
      key: '_handleState',
      value: function _handleState(e) {
        if (window.location.hash === '#' + this.id && !this.isActive) {
          this.open();
        } else {
          this.close();
        }
      }

      /**
       * Opens the modal controlled by `this.$anchor`, and closes all others by default.
       * @function
       * @fires Reveal#closeme
       * @fires Reveal#open
       */

    }, {
      key: 'open',
      value: function open() {
        var _this2 = this;

        if (this.options.deepLink) {
          var hash = '#' + this.id;

          if (window.history.pushState) {
            window.history.pushState(null, null, hash);
          } else {
            window.location.hash = hash;
          }
        }

        this.isActive = true;

        // Make elements invisible, but remove display: none so we can get size and positioning
        this.$element.css({ 'visibility': 'hidden' }).show().scrollTop(0);
        if (this.options.overlay) {
          this.$overlay.css({ 'visibility': 'hidden' }).show();
        }

        this._updatePosition();

        this.$element.hide().css({ 'visibility': '' });

        if (this.$overlay) {
          this.$overlay.css({ 'visibility': '' }).hide();
        }

        if (!this.options.multipleOpened) {
          /**
           * Fires immediately before the modal opens.
           * Closes any other modals that are currently open
           * @event Reveal#closeme
           */
          this.$element.trigger('closeme.zf.reveal', this.id);
        }

        // Motion UI method of reveal
        if (this.options.animationIn) {
          if (this.options.overlay) {
            Foundation.Motion.animateIn(this.$overlay, 'fade-in');
          }
          Foundation.Motion.animateIn(this.$element, this.options.animationIn, function () {
            this.focusableElements = Foundation.Keyboard.findFocusable(this.$element);
          });
        }
        // jQuery method of reveal
        else {
            if (this.options.overlay) {
              this.$overlay.show(0);
            }
            this.$element.show(this.options.showDelay);
          }

        // handle accessibility
        this.$element.attr({
          'aria-hidden': false,
          'tabindex': -1
        }).focus();

        /**
         * Fires when the modal has successfully opened.
         * @event Reveal#open
         */
        this.$element.trigger('open.zf.reveal');

        if (this.isiOS) {
          var scrollPos = window.pageYOffset;
          $('html, body').addClass('is-reveal-open').scrollTop(scrollPos);
        } else {
          $('body').addClass('is-reveal-open');
        }

        $('body').addClass('is-reveal-open').attr('aria-hidden', this.options.overlay || this.options.fullScreen ? true : false);

        setTimeout(function () {
          _this2._extraHandlers();
        }, 0);
      }

      /**
       * Adds extra event handlers for the body and window if necessary.
       * @private
       */

    }, {
      key: '_extraHandlers',
      value: function _extraHandlers() {
        var _this = this;
        this.focusableElements = Foundation.Keyboard.findFocusable(this.$element);

        if (!this.options.overlay && this.options.closeOnClick && !this.options.fullScreen) {
          $('body').on('click.zf.reveal', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
              return;
            }
            _this.close();
          });
        }

        if (this.options.closeOnEsc) {
          $(window).on('keydown.zf.reveal', function (e) {
            Foundation.Keyboard.handleKey(e, 'Reveal', {
              close: function () {
                if (_this.options.closeOnEsc) {
                  _this.close();
                  _this.$anchor.focus();
                }
              }
            });
            if (_this.focusableElements.length === 0) {
              // no focusable elements inside the modal at all, prevent tabbing in general
              e.preventDefault();
            }
          });
        }

        // lock focus within modal while tabbing
        this.$element.on('keydown.zf.reveal', function (e) {
          var $target = $(this);
          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Reveal', {
            tab_forward: function () {
              if (_this.$element.find(':focus').is(_this.focusableElements.eq(-1))) {
                // left modal downwards, setting focus to first element
                _this.focusableElements.eq(0).focus();
                e.preventDefault();
              }
            },
            tab_backward: function () {
              if (_this.$element.find(':focus').is(_this.focusableElements.eq(0)) || _this.$element.is(':focus')) {
                // left modal upwards, setting focus to last element
                _this.focusableElements.eq(-1).focus();
                e.preventDefault();
              }
            },
            open: function () {
              if (_this.$element.find(':focus').is(_this.$element.find('[data-close]'))) {
                setTimeout(function () {
                  // set focus back to anchor if close button has been activated
                  _this.$anchor.focus();
                }, 1);
              } else if ($target.is(_this.focusableElements)) {
                // dont't trigger if acual element has focus (i.e. inputs, links, ...)
                _this.open();
              }
            },
            close: function () {
              if (_this.options.closeOnEsc) {
                _this.close();
                _this.$anchor.focus();
              }
            }
          });
        });
      }

      /**
       * Closes the modal.
       * @function
       * @fires Reveal#closed
       */

    }, {
      key: 'close',
      value: function close() {
        if (!this.isActive || !this.$element.is(':visible')) {
          return false;
        }
        var _this = this;

        // Motion UI method of hiding
        if (this.options.animationOut) {
          if (this.options.overlay) {
            Foundation.Motion.animateOut(this.$overlay, 'fade-out', finishUp);
          } else {
            finishUp();
          }

          Foundation.Motion.animateOut(this.$element, this.options.animationOut);
        }
        // jQuery method of hiding
        else {
            if (this.options.overlay) {
              this.$overlay.hide(0, finishUp);
            } else {
              finishUp();
            }

            this.$element.hide(this.options.hideDelay);
          }

        // Conditionals to remove extra event listeners added on open
        if (this.options.closeOnEsc) {
          $(window).off('keydown.zf.reveal');
        }

        if (!this.options.overlay && this.options.closeOnClick) {
          $('body').off('click.zf.reveal');
        }

        this.$element.off('keydown.zf.reveal');

        function finishUp() {
          if (_this.isiOS) {
            $('html, body').removeClass('is-reveal-open');
          } else {
            $('body').removeClass('is-reveal-open');
          }

          $('body').attr({
            'aria-hidden': false,
            'tabindex': ''
          });

          _this.$element.attr('aria-hidden', true);

          /**
          * Fires when the modal is done closing.
          * @event Reveal#closed
          */
          _this.$element.trigger('closed.zf.reveal');
        }

        /**
        * Resets the modal content
        * This prevents a running video to keep going in the background
        */
        if (this.options.resetOnClose) {
          this.$element.html(this.$element.html());
        }

        this.isActive = false;
        if (_this.options.deepLink) {
          if (window.history.replaceState) {
            window.history.replaceState("", document.title, window.location.pathname);
          } else {
            window.location.hash = '';
          }
        }
      }

      /**
       * Toggles the open/closed state of a modal.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.isActive) {
          this.close();
        } else {
          this.open();
        }
      }
    }, {
      key: 'destroy',


      /**
       * Destroys an instance of a modal.
       * @function
       */
      value: function destroy() {
        if (this.options.overlay) {
          this.$overlay.hide().off().remove();
        }
        this.$element.hide().off();
        this.$anchor.off('.zf');
        $(window).off('.zf.reveal:' + this.id);

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Reveal;
  }();

  Reveal.defaults = {
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-in-left'
     */
    animationIn: '',
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-out-right'
     */
    animationOut: '',
    /**
     * Time, in ms, to delay the opening of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    showDelay: 0,
    /**
     * Time, in ms, to delay the closing of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    hideDelay: 0,
    /**
     * Allows a click on the body/overlay to close the modal.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Allows the modal to close if the user presses the `ESCAPE` key.
     * @option
     * @example true
     */
    closeOnEsc: true,
    /**
     * If true, allows multiple modals to be displayed at once.
     * @option
     * @example false
     */
    multipleOpened: false,
    /**
     * Distance, in pixels, the modal should push down from the top of the screen.
     * @option
     * @example 100
     */
    vOffset: 100,
    /**
     * Distance, in pixels, the modal should push in from the side of the screen.
     * @option
     * @example 0
     */
    hOffset: 0,
    /**
     * Allows the modal to be fullscreen, completely blocking out the rest of the view. JS checks for this as well.
     * @option
     * @example false
     */
    fullScreen: false,
    /**
     * Percentage of screen height the modal should push up from the bottom of the view.
     * @option
     * @example 10
     */
    btmOffsetPct: 10,
    /**
     * Allows the modal to generate an overlay div, which will cover the view when modal opens.
     * @option
     * @example true
     */
    overlay: true,
    /**
     * Allows the modal to remove and reinject markup on close. Should be true if using video elements w/o using provider's api, otherwise, videos will continue to play in the background.
     * @option
     * @example false
     */
    resetOnClose: false,
    /**
     * Allows the modal to alter the url on open/close, and allows the use of the `back` button to close modals. ALSO, allows a modal to auto-maniacally open on page load IF the hash === the modal's user-set id.
     * @option
     * @example false
     */
    deepLink: false
  };

  // Window exports
  Foundation.plugin(Reveal, 'Reveal');

  function iPhoneSniff() {
    return (/iP(ad|hone|od).*OS/.test(window.navigator.userAgent)
    );
  }
}(jQuery);
;'use strict';

/*!-----------------------------------------------------------------------------
 * Vegas - Fullscreen Backgrounds and Slideshows.
 * v2.2.0 - built 2016-01-18
 * Licensed under the MIT License.
 * http://vegas.jaysalvat.com/
 * ----------------------------------------------------------------------------
 * Copyright (C) 2010-2016 Jay Salvat
 * http://jaysalvat.com/
 * --------------------------------------------------------------------------*/

(function ($) {
    'use strict';

    var defaults = {
        slide: 0,
        delay: 5000,
        preload: false,
        preloadImage: false,
        preloadVideo: false,
        timer: true,
        overlay: false,
        autoplay: true,
        shuffle: false,
        cover: true,
        color: null,
        align: 'center',
        valign: 'center',
        transition: 'fade',
        transitionDuration: 1000,
        transitionRegister: [],
        animation: null,
        animationDuration: 'auto',
        animationRegister: [],
        init: function () {},
        play: function () {},
        pause: function () {},
        walk: function () {},
        slides: [
            // {
            //  src:                null,
            //  color:              null,
            //  delay:              null,
            //  align:              null,
            //  valign:             null,
            //  transition:         null,
            //  transitionDuration: null,
            //  animation:          null,
            //  animationDuration:  null,
            //  cover:              true,
            //  video: {
            //      src: [],
            //      mute: true,
            //      loop: true
            // }
            // ...
        ]
    };

    var videoCache = {};

    var Vegas = function (elmt, options) {
        this.elmt = elmt;
        this.settings = $.extend({}, defaults, $.vegas.defaults, options);
        this.slide = this.settings.slide;
        this.total = this.settings.slides.length;
        this.noshow = this.total < 2;
        this.paused = !this.settings.autoplay || this.noshow;
        this.$elmt = $(elmt);
        this.$timer = null;
        this.$overlay = null;
        this.$slide = null;
        this.timeout = null;

        this.transitions = ['fade', 'fade2', 'blur', 'blur2', 'flash', 'flash2', 'negative', 'negative2', 'burn', 'burn2', 'slideLeft', 'slideLeft2', 'slideRight', 'slideRight2', 'slideUp', 'slideUp2', 'slideDown', 'slideDown2', 'zoomIn', 'zoomIn2', 'zoomOut', 'zoomOut2', 'swirlLeft', 'swirlLeft2', 'swirlRight', 'swirlRight2'];

        this.animations = ['kenburns', 'kenburnsLeft', 'kenburnsRight', 'kenburnsUp', 'kenburnsUpLeft', 'kenburnsUpRight', 'kenburnsDown', 'kenburnsDownLeft', 'kenburnsDownRight'];

        if (this.settings.transitionRegister instanceof Array === false) {
            this.settings.transitionRegister = [this.settings.transitionRegister];
        }

        if (this.settings.animationRegister instanceof Array === false) {
            this.settings.animationRegister = [this.settings.animationRegister];
        }

        this.transitions = this.transitions.concat(this.settings.transitionRegister);
        this.animations = this.animations.concat(this.settings.animationRegister);

        this.support = {
            objectFit: 'objectFit' in document.body.style,
            transition: 'transition' in document.body.style || 'WebkitTransition' in document.body.style,
            video: $.vegas.isVideoCompatible()
        };

        if (this.settings.shuffle === true) {
            this.shuffle();
        }

        this._init();
    };

    Vegas.prototype = {
        _init: function () {
            var $wrapper,
                $overlay,
                $timer,
                isBody = this.elmt.tagName === 'BODY',
                timer = this.settings.timer,
                overlay = this.settings.overlay,
                self = this;

            // Preloading
            this._preload();

            // Wrapper with content
            if (!isBody) {
                this.$elmt.css('height', this.$elmt.css('height'));

                $wrapper = $('<div class="vegas-wrapper">').css('overflow', this.$elmt.css('overflow')).css('padding', this.$elmt.css('padding'));

                // Some browsers don't compute padding shorthand
                if (!this.$elmt.css('padding')) {
                    $wrapper.css('padding-top', this.$elmt.css('padding-top')).css('padding-bottom', this.$elmt.css('padding-bottom')).css('padding-left', this.$elmt.css('padding-left')).css('padding-right', this.$elmt.css('padding-right'));
                }

                this.$elmt.clone(true).children().appendTo($wrapper);
                this.elmt.innerHTML = '';
            }

            // Timer
            if (timer && this.support.transition) {
                $timer = $('<div class="vegas-timer"><div class="vegas-timer-progress">');
                this.$timer = $timer;
                this.$elmt.prepend($timer);
            }

            // Overlay
            if (overlay) {
                $overlay = $('<div class="vegas-overlay">');

                if (typeof overlay === 'string') {
                    $overlay.css('background-image', 'url(' + overlay + ')');
                }

                this.$overlay = $overlay;
                this.$elmt.prepend($overlay);
            }

            // Container
            this.$elmt.addClass('vegas-container');

            if (!isBody) {
                this.$elmt.append($wrapper);
            }

            setTimeout(function () {
                self.trigger('init');
                self._goto(self.slide);

                if (self.settings.autoplay) {
                    self.trigger('play');
                }
            }, 1);
        },

        _preload: function () {
            var img, i;

            for (i = 0; i < this.settings.slides.length; i++) {
                if (this.settings.preload || this.settings.preloadImages) {
                    if (this.settings.slides[i].src) {
                        img = new Image();
                        img.src = this.settings.slides[i].src;
                    }
                }

                if (this.settings.preload || this.settings.preloadVideos) {
                    if (this.support.video && this.settings.slides[i].video) {
                        if (this.settings.slides[i].video instanceof Array) {
                            this._video(this.settings.slides[i].video);
                        } else {
                            this._video(this.settings.slides[i].video.src);
                        }
                    }
                }
            }
        },

        _random: function (array) {
            return array[Math.floor(Math.random() * (array.length - 1))];
        },

        _slideShow: function () {
            var self = this;

            if (this.total > 1 && !this.paused && !this.noshow) {
                this.timeout = setTimeout(function () {
                    self.next();
                }, this._options('delay'));
            }
        },

        _timer: function (state) {
            var self = this;

            clearTimeout(this.timeout);

            if (!this.$timer) {
                return;
            }

            this.$timer.removeClass('vegas-timer-running').find('div').css('transition-duration', '0ms');

            if (this.paused || this.noshow) {
                return;
            }

            if (state) {
                setTimeout(function () {
                    self.$timer.addClass('vegas-timer-running').find('div').css('transition-duration', self._options('delay') - 100 + 'ms');
                }, 100);
            }
        },

        _video: function (srcs) {
            var video,
                source,
                cacheKey = srcs.toString();

            if (videoCache[cacheKey]) {
                return videoCache[cacheKey];
            }

            if (srcs instanceof Array === false) {
                srcs = [srcs];
            }

            video = document.createElement('video');
            video.preload = true;

            srcs.forEach(function (src) {
                source = document.createElement('source');
                source.src = src;
                video.appendChild(source);
            });

            videoCache[cacheKey] = video;

            return video;
        },

        _fadeOutSound: function (video, duration) {
            var self = this,
                delay = duration / 10,
                volume = video.volume - 0.09;

            if (volume > 0) {
                video.volume = volume;

                setTimeout(function () {
                    self._fadeOutSound(video, duration);
                }, delay);
            } else {
                video.pause();
            }
        },

        _fadeInSound: function (video, duration) {
            var self = this,
                delay = duration / 10,
                volume = video.volume + 0.09;

            if (volume < 1) {
                video.volume = volume;

                setTimeout(function () {
                    self._fadeInSound(video, duration);
                }, delay);
            }
        },

        _options: function (key, i) {
            if (i === undefined) {
                i = this.slide;
            }

            if (this.settings.slides[i][key] !== undefined) {
                return this.settings.slides[i][key];
            }

            return this.settings[key];
        },

        _goto: function (nb) {
            if (typeof this.settings.slides[nb] === 'undefined') {
                nb = 0;
            }

            this.slide = nb;

            var $slide,
                $inner,
                $video,
                $slides = this.$elmt.children('.vegas-slide'),
                src = this.settings.slides[nb].src,
                videoSettings = this.settings.slides[nb].video,
                delay = this._options('delay'),
                align = this._options('align'),
                valign = this._options('valign'),
                cover = this._options('cover'),
                color = this._options('color') || this.$elmt.css('background-color'),
                self = this,
                total = $slides.length,
                video,
                img;

            var transition = this._options('transition'),
                transitionDuration = this._options('transitionDuration'),
                animation = this._options('animation'),
                animationDuration = this._options('animationDuration');

            if (cover !== 'repeat') {
                if (cover === true) {
                    cover = 'cover';
                } else if (cover === false) {
                    cover = 'contain';
                }
            }

            if (transition === 'random' || transition instanceof Array) {
                if (transition instanceof Array) {
                    transition = this._random(transition);
                } else {
                    transition = this._random(this.transitions);
                }
            }

            if (animation === 'random' || animation instanceof Array) {
                if (animation instanceof Array) {
                    animation = this._random(animation);
                } else {
                    animation = this._random(this.animations);
                }
            }

            if (transitionDuration === 'auto' || transitionDuration > delay) {
                transitionDuration = delay;
            }

            if (animationDuration === 'auto') {
                animationDuration = delay;
            }

            $slide = $('<div class="vegas-slide"></div>');

            if (this.support.transition && transition) {
                $slide.addClass('vegas-transition-' + transition);
            }

            // Video

            if (this.support.video && videoSettings) {
                if (videoSettings instanceof Array) {
                    video = this._video(videoSettings);
                } else {
                    video = this._video(videoSettings.src);
                }

                video.loop = videoSettings.loop !== undefined ? videoSettings.loop : true;
                video.muted = videoSettings.mute !== undefined ? videoSettings.mute : true;

                if (video.muted === false) {
                    video.volume = 0;
                    this._fadeInSound(video, transitionDuration);
                } else {
                    video.pause();
                }

                $video = $(video).addClass('vegas-video').css('background-color', color);

                if (this.support.objectFit) {
                    $video.css('object-position', align + ' ' + valign).css('object-fit', cover).css('width', '100%').css('height', '100%');
                } else if (cover === 'contain') {
                    $video.css('width', '100%').css('height', '100%');
                }

                $slide.append($video);

                // Image
            } else {
                    img = new Image();

                    $inner = $('<div class="vegas-slide-inner"></div>').css('background-image', 'url(' + src + ')').css('background-color', color).css('background-position', align + ' ' + valign);

                    if (cover === 'repeat') {
                        $inner.css('background-repeat', 'repeat');
                    } else {
                        $inner.css('background-size', cover);
                    }

                    if (this.support.transition && animation) {
                        $inner.addClass('vegas-animation-' + animation).css('animation-duration', animationDuration + 'ms');
                    }

                    $slide.append($inner);
                }

            if (!this.support.transition) {
                $slide.css('display', 'none');
            }

            if (total) {
                $slides.eq(total - 1).after($slide);
            } else {
                this.$elmt.prepend($slide);
            }

            self._timer(false);

            function go() {
                self._timer(true);

                setTimeout(function () {
                    if (transition) {
                        if (self.support.transition) {
                            $slides.css('transition', 'all ' + transitionDuration + 'ms').addClass('vegas-transition-' + transition + '-out');

                            $slides.each(function () {
                                var video = $slides.find('video').get(0);

                                if (video) {
                                    video.volume = 1;
                                    self._fadeOutSound(video, transitionDuration);
                                }
                            });

                            $slide.css('transition', 'all ' + transitionDuration + 'ms').addClass('vegas-transition-' + transition + '-in');
                        } else {
                            $slide.fadeIn(transitionDuration);
                        }
                    }

                    for (var i = 0; i < $slides.length - 4; i++) {
                        $slides.eq(i).remove();
                    }

                    self.trigger('walk');
                    self._slideShow();
                }, 100);
            }
            if (video) {
                if (video.readyState === 4) {
                    video.currentTime = 0;
                }

                video.play();
                go();
            } else {
                img.src = src;
                img.onload = go;
            }
        },

        shuffle: function () {
            var temp, rand;

            for (var i = this.total - 1; i > 0; i--) {
                rand = Math.floor(Math.random() * (i + 1));
                temp = this.settings.slides[i];

                this.settings.slides[i] = this.settings.slides[rand];
                this.settings.slides[rand] = temp;
            }
        },

        play: function () {
            if (this.paused) {
                this.paused = false;
                this.next();
                this.trigger('play');
            }
        },

        pause: function () {
            this._timer(false);
            this.paused = true;
            this.trigger('pause');
        },

        toggle: function () {
            if (this.paused) {
                this.play();
            } else {
                this.pause();
            }
        },

        playing: function () {
            return !this.paused && !this.noshow;
        },

        current: function (advanced) {
            if (advanced) {
                return {
                    slide: this.slide,
                    data: this.settings.slides[this.slide]
                };
            }
            return this.slide;
        },

        jump: function (nb) {
            if (nb < 0 || nb > this.total - 1 || nb === this.slide) {
                return;
            }

            this.slide = nb;
            this._goto(this.slide);
        },

        next: function () {
            this.slide++;

            if (this.slide >= this.total) {
                this.slide = 0;
            }

            this._goto(this.slide);
        },

        previous: function () {
            this.slide--;

            if (this.slide < 0) {
                this.slide = this.total - 1;
            }

            this._goto(this.slide);
        },

        trigger: function (fn) {
            var params = [];

            if (fn === 'init') {
                params = [this.settings];
            } else {
                params = [this.slide, this.settings.slides[this.slide]];
            }

            this.$elmt.trigger('vegas' + fn, params);

            if (typeof this.settings[fn] === 'function') {
                this.settings[fn].apply(this.$elmt, params);
            }
        },

        options: function (key, value) {
            var oldSlides = this.settings.slides.slice();

            if (typeof key === 'object') {
                this.settings = $.extend({}, defaults, $.vegas.defaults, key);
            } else if (typeof key === 'string') {
                if (value === undefined) {
                    return this.settings[key];
                }
                this.settings[key] = value;
            } else {
                return this.settings;
            }

            // In case slides have changed
            if (this.settings.slides !== oldSlides) {
                this.total = this.settings.slides.length;
                this.noshow = this.total < 2;
                this._preload();
            }
        },

        destroy: function () {
            clearTimeout(this.timeout);

            this.$elmt.removeClass('vegas-container');
            this.$elmt.find('> .vegas-slide').remove();
            this.$elmt.find('> .vegas-wrapper').clone(true).children().appendTo(this.$elmt);
            this.$elmt.find('> .vegas-wrapper').remove();

            if (this.settings.timer) {
                this.$timer.remove();
            }

            if (this.settings.overlay) {
                this.$overlay.remove();
            }

            this.elmt._vegas = null;
        }
    };

    $.fn.vegas = function (options) {
        var args = arguments,
            error = false,
            returns;

        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                if (!this._vegas) {
                    this._vegas = new Vegas(this, options);
                }
            });
        } else if (typeof options === 'string') {
            this.each(function () {
                var instance = this._vegas;

                if (!instance) {
                    throw new Error('No Vegas applied to this element.');
                }

                if (typeof instance[options] === 'function' && options[0] !== '_') {
                    returns = instance[options].apply(instance, [].slice.call(args, 1));
                } else {
                    error = true;
                }
            });

            if (error) {
                throw new Error('No method "' + options + '" in Vegas.');
            }

            return returns !== undefined ? returns : this;
        }
    };

    $.vegas = {};
    $.vegas.defaults = defaults;

    $.vegas.isVideoCompatible = function () {
        return !/(Android|webOS|Phone|iPad|iPod|BlackBerry|Windows Phone)/i.test(navigator.userAgent);
    };
})(window.jQuery || window.Zepto);
;'use strict';

/**
 * Featherlight - ultra slim jQuery lightbox
 * Version 1.3.5 - http://noelboss.github.io/featherlight/
 *
 * Copyright 2015, Noël Raoul Bossart (http://www.noelboss.com)
 * MIT Licensed.
**/
(function ($) {
	"use strict";

	if ('undefined' === typeof $) {
		if ('console' in window) {
			window.console.info('Too much lightness, Featherlight needs jQuery.');
		}
		return;
	}

	/* Featherlight is exported as $.featherlight.
    It is a function used to open a featherlight lightbox.
 	   [tech]
    Featherlight uses prototype inheritance.
    Each opened lightbox will have a corresponding object.
    That object may have some attributes that override the
    prototype's.
    Extensions created with Featherlight.extend will have their
    own prototype that inherits from Featherlight's prototype,
    thus attributes can be overriden either at the object level,
    or at the extension level.
    To create callbacks that chain themselves instead of overriding,
    use chainCallbacks.
    For those familiar with CoffeeScript, this correspond to
    Featherlight being a class and the Gallery being a class
    extending Featherlight.
    The chainCallbacks is used since we don't have access to
    CoffeeScript's `super`.
 */

	function Featherlight($content, config) {
		if (this instanceof Featherlight) {
			/* called with new */
			this.id = Featherlight.id++;
			this.setup($content, config);
			this.chainCallbacks(Featherlight._callbackChain);
		} else {
			var fl = new Featherlight($content, config);
			fl.open();
			return fl;
		}
	}

	var opened = [],
	    pruneOpened = function (remove) {
		opened = $.grep(opened, function (fl) {
			return fl !== remove && fl.$instance.closest('body').length > 0;
		});
		return opened;
	};

	// structure({iframeMinHeight: 44, foo: 0}, 'iframe')
	//   #=> {min-height: 44}
	var structure = function (obj, prefix) {
		var result = {},
		    regex = new RegExp('^' + prefix + '([A-Z])(.*)');
		for (var key in obj) {
			var match = key.match(regex);
			if (match) {
				var dasherized = (match[1] + match[2].replace(/([A-Z])/g, '-$1')).toLowerCase();
				result[dasherized] = obj[key];
			}
		}
		return result;
	};

	/* document wide key handler */
	var eventMap = { keyup: 'onKeyUp', resize: 'onResize' };

	var globalEventHandler = function (event) {
		$.each(Featherlight.opened().reverse(), function () {
			if (!event.isDefaultPrevented()) {
				if (false === this[eventMap[event.type]](event)) {
					event.preventDefault();event.stopPropagation();return false;
				}
			}
		});
	};

	var toggleGlobalEvents = function (set) {
		if (set !== Featherlight._globalHandlerInstalled) {
			Featherlight._globalHandlerInstalled = set;
			var events = $.map(eventMap, function (_, name) {
				return name + '.' + Featherlight.prototype.namespace;
			}).join(' ');
			$(window)[set ? 'on' : 'off'](events, globalEventHandler);
		}
	};

	Featherlight.prototype = {
		constructor: Featherlight,
		/*** defaults ***/
		/* extend featherlight with defaults and methods */
		namespace: 'featherlight', /* Name of the events and css class prefix */
		targetAttr: 'data-featherlight', /* Attribute of the triggered element that contains the selector to the lightbox content */
		variant: null, /* Class that will be added to change look of the lightbox */
		resetCss: false, /* Reset all css */
		background: null, /* Custom DOM for the background, wrapper and the closebutton */
		openTrigger: 'click', /* Event that triggers the lightbox */
		closeTrigger: 'click', /* Event that triggers the closing of the lightbox */
		filter: null, /* Selector to filter events. Think $(...).on('click', filter, eventHandler) */
		root: 'body', /* Where to append featherlights */
		openSpeed: 250, /* Duration of opening animation */
		closeSpeed: 250, /* Duration of closing animation */
		closeOnClick: 'background', /* Close lightbox on click ('background', 'anywhere' or false) */
		closeOnEsc: true, /* Close lightbox when pressing esc */
		closeIcon: '&#10005;', /* Close icon */
		loading: '', /* Content to show while initial content is loading */
		persist: false, /* If set, the content will persist and will be shown again when opened again. 'shared' is a special value when binding multiple elements for them to share the same content */
		otherClose: null, /* Selector for alternate close buttons (e.g. "a.close") */
		beforeOpen: $.noop, /* Called before open. can return false to prevent opening of lightbox. Gets event as parameter, this contains all data */
		beforeContent: $.noop, /* Called when content is loaded. Gets event as parameter, this contains all data */
		beforeClose: $.noop, /* Called before close. can return false to prevent opening of lightbox. Gets event as parameter, this contains all data */
		afterOpen: $.noop, /* Called after open. Gets event as parameter, this contains all data */
		afterContent: $.noop, /* Called after content is ready and has been set. Gets event as parameter, this contains all data */
		afterClose: $.noop, /* Called after close. Gets event as parameter, this contains all data */
		onKeyUp: $.noop, /* Called on key up for the frontmost featherlight */
		onResize: $.noop, /* Called after new content and when a window is resized */
		type: null, /* Specify type of lightbox. If unset, it will check for the targetAttrs value. */
		contentFilters: ['jquery', 'image', 'html', 'ajax', 'iframe', 'text'], /* List of content filters to use to determine the content */

		/*** methods ***/
		/* setup iterates over a single instance of featherlight and prepares the background and binds the events */
		setup: function (target, config) {
			/* all arguments are optional */
			if (typeof target === 'object' && target instanceof $ === false && !config) {
				config = target;
				target = undefined;
			}

			var self = $.extend(this, config, { target: target }),
			    css = !self.resetCss ? self.namespace : self.namespace + '-reset',
			    /* by adding -reset to the classname, we reset all the default css */
			$background = $(self.background || ['<div class="' + css + '-loading ' + css + '">', '<div class="' + css + '-content">', '<span class="' + css + '-close-icon ' + self.namespace + '-close">', self.closeIcon, '</span>', '<div class="' + self.namespace + '-inner">' + self.loading + '</div>', '</div>', '</div>'].join('')),
			    closeButtonSelector = '.' + self.namespace + '-close' + (self.otherClose ? ',' + self.otherClose : '');

			self.$instance = $background.clone().addClass(self.variant); /* clone DOM for the background, wrapper and the close button */

			/* close when click on background/anywhere/null or closebox */
			self.$instance.on(self.closeTrigger + '.' + self.namespace, function (event) {
				var $target = $(event.target);
				if ('background' === self.closeOnClick && $target.is('.' + self.namespace) || 'anywhere' === self.closeOnClick || $target.closest(closeButtonSelector).length) {
					self.close(event);
					event.preventDefault();
				}
			});

			return this;
		},

		/* this method prepares the content and converts it into a jQuery object or a promise */
		getContent: function () {
			if (this.persist !== false && this.$content) {
				return this.$content;
			}
			var self = this,
			    filters = this.constructor.contentFilters,
			    readTargetAttr = function (name) {
				return self.$currentTarget && self.$currentTarget.attr(name);
			},
			    targetValue = readTargetAttr(self.targetAttr),
			    data = self.target || targetValue || '';

			/* Find which filter applies */
			var filter = filters[self.type]; /* check explicit type like {type: 'image'} */

			/* check explicit type like data-featherlight="image" */
			if (!filter && data in filters) {
				filter = filters[data];
				data = self.target && targetValue;
			}
			data = data || readTargetAttr('href') || '';

			/* check explicity type & content like {image: 'photo.jpg'} */
			if (!filter) {
				for (var filterName in filters) {
					if (self[filterName]) {
						filter = filters[filterName];
						data = self[filterName];
					}
				}
			}

			/* otherwise it's implicit, run checks */
			if (!filter) {
				var target = data;
				data = null;
				$.each(self.contentFilters, function () {
					filter = filters[this];
					if (filter.test) {
						data = filter.test(target);
					}
					if (!data && filter.regex && target.match && target.match(filter.regex)) {
						data = target;
					}
					return !data;
				});
				if (!data) {
					if ('console' in window) {
						window.console.error('Featherlight: no content filter found ' + (target ? ' for "' + target + '"' : ' (no target specified)'));
					}
					return false;
				}
			}
			/* Process it */
			return filter.process.call(self, data);
		},

		/* sets the content of $instance to $content */
		setContent: function ($content) {
			var self = this;
			/* we need a special class for the iframe */
			if ($content.is('iframe') || $('iframe', $content).length > 0) {
				self.$instance.addClass(self.namespace + '-iframe');
			}

			self.$instance.removeClass(self.namespace + '-loading');

			/* replace content by appending to existing one before it is removed
      this insures that featherlight-inner remain at the same relative
   	 position to any other items added to featherlight-content */
			self.$instance.find('.' + self.namespace + '-inner').not($content) /* excluded new content, important if persisted */
			.slice(1).remove().end() /* In the unexpected event where there are many inner elements, remove all but the first one */
			.replaceWith($.contains(self.$instance[0], $content[0]) ? '' : $content);

			self.$content = $content.addClass(self.namespace + '-inner');

			return self;
		},

		/* opens the lightbox. "this" contains $instance with the lightbox, and with the config.
  	Returns a promise that is resolved after is successfully opened. */
		open: function (event) {
			var self = this;
			self.$instance.hide().appendTo(self.root);
			if ((!event || !event.isDefaultPrevented()) && self.beforeOpen(event) !== false) {

				if (event) {
					event.preventDefault();
				}
				var $content = self.getContent();

				if ($content) {
					opened.push(self);

					toggleGlobalEvents(true);

					self.$instance.fadeIn(self.openSpeed);
					self.beforeContent(event);

					/* Set content and show */
					return $.when($content).always(function ($content) {
						self.setContent($content);
						self.afterContent(event);
					}).then(self.$instance.promise())
					/* Call afterOpen after fadeIn is done */
					.done(function () {
						self.afterOpen(event);
					});
				}
			}
			self.$instance.detach();
			return $.Deferred().reject().promise();
		},

		/* closes the lightbox. "this" contains $instance with the lightbox, and with the config
  	returns a promise, resolved after the lightbox is successfully closed. */
		close: function (event) {
			var self = this,
			    deferred = $.Deferred();

			if (self.beforeClose(event) === false) {
				deferred.reject();
			} else {

				if (0 === pruneOpened(self).length) {
					toggleGlobalEvents(false);
				}

				self.$instance.fadeOut(self.closeSpeed, function () {
					self.$instance.detach();
					self.afterClose(event);
					deferred.resolve();
				});
			}
			return deferred.promise();
		},

		/* Utility function to chain callbacks
     [Warning: guru-level]
     Used be extensions that want to let users specify callbacks but
     also need themselves to use the callbacks.
     The argument 'chain' has callback names as keys and function(super, event)
     as values. That function is meant to call `super` at some point.
  */
		chainCallbacks: function (chain) {
			for (var name in chain) {
				this[name] = $.proxy(chain[name], this, $.proxy(this[name], this));
			}
		}
	};

	$.extend(Featherlight, {
		id: 0, /* Used to id single featherlight instances */
		autoBind: '[data-featherlight]', /* Will automatically bind elements matching this selector. Clear or set before onReady */
		defaults: Featherlight.prototype, /* You can access and override all defaults using $.featherlight.defaults, which is just a synonym for $.featherlight.prototype */
		/* Contains the logic to determine content */
		contentFilters: {
			jquery: {
				regex: /^[#.]\w/, /* Anything that starts with a class name or identifiers */
				test: function (elem) {
					return elem instanceof $ && elem;
				},
				process: function (elem) {
					return this.persist !== false ? $(elem) : $(elem).clone(true);
				}
			},
			image: {
				regex: /\.(png|jpg|jpeg|gif|tiff|bmp|svg)(\?\S*)?$/i,
				process: function (url) {
					var self = this,
					    deferred = $.Deferred(),
					    img = new Image(),
					    $img = $('<img src="' + url + '" alt="" class="' + self.namespace + '-image" />');
					img.onload = function () {
						/* Store naturalWidth & height for IE8 */
						$img.naturalWidth = img.width;$img.naturalHeight = img.height;
						deferred.resolve($img);
					};
					img.onerror = function () {
						deferred.reject($img);
					};
					img.src = url;
					return deferred.promise();
				}
			},
			html: {
				regex: /^\s*<[\w!][^<]*>/, /* Anything that starts with some kind of valid tag */
				process: function (html) {
					return $(html);
				}
			},
			ajax: {
				regex: /./, /* At this point, any content is assumed to be an URL */
				process: function (url) {
					var self = this,
					    deferred = $.Deferred();
					/* we are using load so one can specify a target with: url.html #targetelement */
					var $container = $('<div></div>').load(url, function (response, status) {
						if (status !== "error") {
							deferred.resolve($container.contents());
						}
						deferred.fail();
					});
					return deferred.promise();
				}
			},
			iframe: {
				process: function (url) {
					var deferred = new $.Deferred();
					var $content = $('<iframe/>').hide().attr('src', url).css(structure(this, 'iframe')).on('load', function () {
						deferred.resolve($content.show());
					})
					// We can't move an <iframe> and avoid reloading it,
					// so let's put it in place ourselves right now:
					.appendTo(this.$instance.find('.' + this.namespace + '-content'));
					return deferred.promise();
				}
			},
			text: {
				process: function (text) {
					return $('<div>', { text: text });
				}
			}
		},

		functionAttributes: ['beforeOpen', 'afterOpen', 'beforeContent', 'afterContent', 'beforeClose', 'afterClose'],

		/*** class methods ***/
		/* read element's attributes starting with data-featherlight- */
		readElementConfig: function (element, namespace) {
			var Klass = this,
			    regexp = new RegExp('^data-' + namespace + '-(.*)'),
			    config = {};
			if (element && element.attributes) {
				$.each(element.attributes, function () {
					var match = this.name.match(regexp);
					if (match) {
						var val = this.value,
						    name = $.camelCase(match[1]);
						if ($.inArray(name, Klass.functionAttributes) >= 0) {
							/* jshint -W054 */
							val = new Function(val); /* jshint +W054 */
						} else {
								try {
									val = $.parseJSON(val);
								} catch (e) {}
							}
						config[name] = val;
					}
				});
			}
			return config;
		},

		/* Used to create a Featherlight extension
     [Warning: guru-level]
     Creates the extension's prototype that in turn
     inherits Featherlight's prototype.
     Could be used to extend an extension too...
     This is pretty high level wizardy, it comes pretty much straight
     from CoffeeScript and won't teach you anything about Featherlight
     as it's not really specific to this library.
     My suggestion: move along and keep your sanity.
  */
		extend: function (child, defaults) {
			/* Setup class hierarchy, adapted from CoffeeScript */
			var Ctor = function () {
				this.constructor = child;
			};
			Ctor.prototype = this.prototype;
			child.prototype = new Ctor();
			child.__super__ = this.prototype;
			/* Copy class methods & attributes */
			$.extend(child, this, defaults);
			child.defaults = child.prototype;
			return child;
		},

		attach: function ($source, $content, config) {
			var Klass = this;
			if (typeof $content === 'object' && $content instanceof $ === false && !config) {
				config = $content;
				$content = undefined;
			}
			/* make a copy */
			config = $.extend({}, config);

			/* Only for openTrigger and namespace... */
			var namespace = config.namespace || Klass.defaults.namespace,
			    tempConfig = $.extend({}, Klass.defaults, Klass.readElementConfig($source[0], namespace), config),
			    sharedPersist;

			$source.on(tempConfig.openTrigger + '.' + tempConfig.namespace, tempConfig.filter, function (event) {
				/* ... since we might as well compute the config on the actual target */
				var elemConfig = $.extend({ $source: $source, $currentTarget: $(this) }, Klass.readElementConfig($source[0], tempConfig.namespace), Klass.readElementConfig(this, tempConfig.namespace), config);
				var fl = sharedPersist || $(this).data('featherlight-persisted') || new Klass($content, elemConfig);
				if (fl.persist === 'shared') {
					sharedPersist = fl;
				} else if (fl.persist !== false) {
					$(this).data('featherlight-persisted', fl);
				}
				elemConfig.$currentTarget.blur(); // Otherwise 'enter' key might trigger the dialog again
				fl.open(event);
			});
			return $source;
		},

		current: function () {
			var all = this.opened();
			return all[all.length - 1] || null;
		},

		opened: function () {
			var klass = this;
			pruneOpened();
			return $.grep(opened, function (fl) {
				return fl instanceof klass;
			});
		},

		close: function (event) {
			var cur = this.current();
			if (cur) {
				return cur.close(event);
			}
		},

		/* Does the auto binding on startup.
     Meant only to be used by Featherlight and its extensions
  */
		_onReady: function () {
			var Klass = this;
			if (Klass.autoBind) {
				/* Bind existing elements */
				$(Klass.autoBind).each(function () {
					Klass.attach($(this));
				});
				/* If a click propagates to the document level, then we have an item that was added later on */
				$(document).on('click', Klass.autoBind, function (evt) {
					if (evt.isDefaultPrevented() || evt.namespace === 'featherlight') {
						return;
					}
					evt.preventDefault();
					/* Bind featherlight */
					Klass.attach($(evt.currentTarget));
					/* Click again; this time our binding will catch it */
					$(evt.target).trigger('click.featherlight');
				});
			}
		},

		/* Featherlight uses the onKeyUp callback to intercept the escape key.
     Private to Featherlight.
  */
		_callbackChain: {
			onKeyUp: function (_super, event) {
				if (27 === event.keyCode) {
					if (this.closeOnEsc) {
						$.featherlight.close(event);
					}
					return false;
				} else {
					return _super(event);
				}
			},

			onResize: function (_super, event) {
				if (this.$content.naturalWidth) {
					var w = this.$content.naturalWidth,
					    h = this.$content.naturalHeight;
					/* Reset apparent image size first so container grows */
					this.$content.css('width', '').css('height', '');
					/* Calculate the worst ratio so that dimensions fit */
					var ratio = Math.max(w / parseInt(this.$content.parent().css('width'), 10), h / parseInt(this.$content.parent().css('height'), 10));
					/* Resize content */
					if (ratio > 1) {
						this.$content.css('width', '' + w / ratio + 'px').css('height', '' + h / ratio + 'px');
					}
				}
				return _super(event);
			},

			afterContent: function (_super, event) {
				var r = _super(event);
				this.onResize(event);
				return r;
			}
		}
	});

	$.featherlight = Featherlight;

	/* bind jQuery elements to trigger featherlight */
	$.fn.featherlight = function ($content, config) {
		return Featherlight.attach(this, $content, config);
	};

	/* bind featherlight on ready if config autoBind is set */
	$(document).ready(function () {
		Featherlight._onReady();
	});
})(jQuery);
;'use strict';

/*!
 * Masonry PACKAGED v4.0.0
 * Cascading grid layout library
 * http://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

/**
 * Bridget makes jQuery widgets
 * v2.0.0
 * MIT license
 */

/* jshint browser: true, strict: true, undef: true, unused: true */

(function (window, factory) {
  'use strict';
  /* globals define: false, module: false, require: false */

  if (typeof define == 'function' && define.amd) {
    // AMD
    define('jquery-bridget/jquery-bridget', ['jquery'], function (jQuery) {
      factory(window, jQuery);
    });
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('jquery'));
  } else {
    // browser global
    window.jQueryBridget = factory(window, window.jQuery);
  }
})(window, function factory(window, jQuery) {
  'use strict';

  // ----- utils ----- //

  var arraySlice = Array.prototype.slice;

  // helper function for logging errors
  // $.error breaks jQuery chaining
  var console = window.console;
  var logError = typeof console == 'undefined' ? function () {} : function (message) {
    console.error(message);
  };

  // ----- jQueryBridget ----- //

  function jQueryBridget(namespace, PluginClass, $) {
    $ = $ || jQuery || window.jQuery;
    if (!$) {
      return;
    }

    // add option method -> $().plugin('option', {...})
    if (!PluginClass.prototype.option) {
      // option setter
      PluginClass.prototype.option = function (opts) {
        // bail out if not an object
        if (!$.isPlainObject(opts)) {
          return;
        }
        this.options = $.extend(true, this.options, opts);
      };
    }

    // make jQuery plugin
    $.fn[namespace] = function (arg0 /*, arg1 */) {
      if (typeof arg0 == 'string') {
        // method call $().plugin( 'methodName', { options } )
        // shift arguments by 1
        var args = arraySlice.call(arguments, 1);
        return methodCall(this, arg0, args);
      }
      // just $().plugin({ options })
      plainCall(this, arg0);
      return this;
    };

    // $().plugin('methodName')
    function methodCall($elems, methodName, args) {
      var returnValue;
      var pluginMethodStr = '$().' + namespace + '("' + methodName + '")';

      $elems.each(function (i, elem) {
        // get instance
        var instance = $.data(elem, namespace);
        if (!instance) {
          logError(namespace + ' not initialized. Cannot call methods, i.e. ' + pluginMethodStr);
          return;
        }

        var method = instance[methodName];
        if (!method || methodName.charAt(0) == '_') {
          logError(pluginMethodStr + ' is not a valid method');
          return;
        }

        // apply method, get return value
        var value = method.apply(instance, args);
        // set return value if value is returned, use only first value
        returnValue = returnValue === undefined ? value : returnValue;
      });

      return returnValue !== undefined ? returnValue : $elems;
    }

    function plainCall($elems, options) {
      $elems.each(function (i, elem) {
        var instance = $.data(elem, namespace);
        if (instance) {
          // set options & init
          instance.option(options);
          instance._init();
        } else {
          // initialize new instance
          instance = new PluginClass(elem, options);
          $.data(elem, namespace, instance);
        }
      });
    }

    updateJQuery($);
  }

  // ----- updateJQuery ----- //

  // set $.bridget for v1 backwards compatibility
  function updateJQuery($) {
    if (!$ || $ && $.bridget) {
      return;
    }
    $.bridget = jQueryBridget;
  }

  updateJQuery(jQuery || window.jQuery);

  // -----  ----- //

  return jQueryBridget;
});

/**
 * EvEmitter v1.0.1
 * Lil' event emitter
 * MIT License
 */

/* jshint unused: true, undef: true, strict: true */

(function (global, factory) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module */
  if (typeof define == 'function' && define.amd) {
    // AMD - RequireJS
    define('ev-emitter/ev-emitter', factory);
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS - Browserify, Webpack
    module.exports = factory();
  } else {
    // Browser globals
    global.EvEmitter = factory();
  }
})(this, function () {

  function EvEmitter() {}

  var proto = EvEmitter.prototype;

  proto.on = function (eventName, listener) {
    if (!eventName || !listener) {
      return;
    }
    // set events hash
    var events = this._events = this._events || {};
    // set listeners array
    var listeners = events[eventName] = events[eventName] || [];
    // only add once
    if (listeners.indexOf(listener) == -1) {
      listeners.push(listener);
    }

    return this;
  };

  proto.once = function (eventName, listener) {
    if (!eventName || !listener) {
      return;
    }
    // add event
    this.on(eventName, listener);
    // set once flag
    // set onceEvents hash
    var onceEvents = this._onceEvents = this._onceEvents || {};
    // set onceListeners array
    var onceListeners = onceEvents[eventName] = onceEvents[eventName] || [];
    // set flag
    onceListeners[listener] = true;

    return this;
  };

  proto.off = function (eventName, listener) {
    var listeners = this._events && this._events[eventName];
    if (!listeners || !listeners.length) {
      return;
    }
    var index = listeners.indexOf(listener);
    if (index != -1) {
      listeners.splice(index, 1);
    }

    return this;
  };

  proto.emitEvent = function (eventName, args) {
    var listeners = this._events && this._events[eventName];
    if (!listeners || !listeners.length) {
      return;
    }
    var i = 0;
    var listener = listeners[i];
    args = args || [];
    // once stuff
    var onceListeners = this._onceEvents && this._onceEvents[eventName];

    while (listener) {
      var isOnce = onceListeners && onceListeners[listener];
      if (isOnce) {
        // remove listener
        // remove before trigger to prevent recursion
        this.off(eventName, listener);
        // unset once flag
        delete onceListeners[listener];
      }
      // trigger listener
      listener.apply(this, args);
      // get next listener
      i += isOnce ? 0 : 1;
      listener = listeners[i];
    }

    return this;
  };

  return EvEmitter;
});

/*!
 * getSize v2.0.2
 * measure size of elements
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false, console: false */

(function (window, factory) {
  'use strict';

  if (typeof define == 'function' && define.amd) {
    // AMD
    define('get-size/get-size', [], function () {
      return factory();
    });
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.getSize = factory();
  }
})(window, function factory() {
  'use strict';

  // -------------------------- helpers -------------------------- //

  // get a number from a string, not a percentage

  function getStyleSize(value) {
    var num = parseFloat(value);
    // not a percent like '100%', and a number
    var isValid = value.indexOf('%') == -1 && !isNaN(num);
    return isValid && num;
  }

  function noop() {}

  var logError = typeof console == 'undefined' ? noop : function (message) {
    console.error(message);
  };

  // -------------------------- measurements -------------------------- //

  var measurements = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderBottomWidth'];

  var measurementsLength = measurements.length;

  function getZeroSize() {
    var size = {
      width: 0,
      height: 0,
      innerWidth: 0,
      innerHeight: 0,
      outerWidth: 0,
      outerHeight: 0
    };
    for (var i = 0; i < measurementsLength; i++) {
      var measurement = measurements[i];
      size[measurement] = 0;
    }
    return size;
  }

  // -------------------------- getStyle -------------------------- //

  /**
   * getStyle, get style of element, check for Firefox bug
   * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
   */
  function getStyle(elem) {
    var style = getComputedStyle(elem);
    if (!style) {
      logError('Style returned ' + style + '. Are you running this code in a hidden iframe on Firefox? ' + 'See http://bit.ly/getsizebug1');
    }
    return style;
  }

  // -------------------------- setup -------------------------- //

  var isSetup = false;

  var isBoxSizeOuter;

  /**
   * setup
   * check isBoxSizerOuter
   * do on first getSize() rather than on page load for Firefox bug
   */
  function setup() {
    // setup once
    if (isSetup) {
      return;
    }
    isSetup = true;

    // -------------------------- box sizing -------------------------- //

    /**
     * WebKit measures the outer-width on style.width on border-box elems
     * IE & Firefox<29 measures the inner-width
     */
    var div = document.createElement('div');
    div.style.width = '200px';
    div.style.padding = '1px 2px 3px 4px';
    div.style.borderStyle = 'solid';
    div.style.borderWidth = '1px 2px 3px 4px';
    div.style.boxSizing = 'border-box';

    var body = document.body || document.documentElement;
    body.appendChild(div);
    var style = getStyle(div);

    getSize.isBoxSizeOuter = isBoxSizeOuter = getStyleSize(style.width) == 200;
    body.removeChild(div);
  }

  // -------------------------- getSize -------------------------- //

  function getSize(elem) {
    setup();

    // use querySeletor if elem is string
    if (typeof elem == 'string') {
      elem = document.querySelector(elem);
    }

    // do not proceed on non-objects
    if (!elem || typeof elem != 'object' || !elem.nodeType) {
      return;
    }

    var style = getStyle(elem);

    // if hidden, everything is 0
    if (style.display == 'none') {
      return getZeroSize();
    }

    var size = {};
    size.width = elem.offsetWidth;
    size.height = elem.offsetHeight;

    var isBorderBox = size.isBorderBox = style.boxSizing == 'border-box';

    // get all measurements
    for (var i = 0; i < measurementsLength; i++) {
      var measurement = measurements[i];
      var value = style[measurement];
      var num = parseFloat(value);
      // any 'auto', 'medium' value will be 0
      size[measurement] = !isNaN(num) ? num : 0;
    }

    var paddingWidth = size.paddingLeft + size.paddingRight;
    var paddingHeight = size.paddingTop + size.paddingBottom;
    var marginWidth = size.marginLeft + size.marginRight;
    var marginHeight = size.marginTop + size.marginBottom;
    var borderWidth = size.borderLeftWidth + size.borderRightWidth;
    var borderHeight = size.borderTopWidth + size.borderBottomWidth;

    var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

    // overwrite width and height if we can get it from style
    var styleWidth = getStyleSize(style.width);
    if (styleWidth !== false) {
      size.width = styleWidth + (
      // add padding and border unless it's already including it
      isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
    }

    var styleHeight = getStyleSize(style.height);
    if (styleHeight !== false) {
      size.height = styleHeight + (
      // add padding and border unless it's already including it
      isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
    }

    size.innerWidth = size.width - (paddingWidth + borderWidth);
    size.innerHeight = size.height - (paddingHeight + borderHeight);

    size.outerWidth = size.width + marginWidth;
    size.outerHeight = size.height + marginHeight;

    return size;
  }

  return getSize;
});

/**
 * matchesSelector v2.0.1
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */

(function (window, factory) {
  /*global define: false, module: false */
  'use strict';
  // universal module definition

  if (typeof define == 'function' && define.amd) {
    // AMD
    define('matches-selector/matches-selector', factory);
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.matchesSelector = factory();
  }
})(window, function factory() {
  'use strict';

  var matchesMethod = function () {
    var ElemProto = Element.prototype;
    // check for the standard method name first
    if (ElemProto.matches) {
      return 'matches';
    }
    // check un-prefixed
    if (ElemProto.matchesSelector) {
      return 'matchesSelector';
    }
    // check vendor prefixes
    var prefixes = ['webkit', 'moz', 'ms', 'o'];

    for (var i = 0; i < prefixes.length; i++) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';
      if (ElemProto[method]) {
        return method;
      }
    }
  }();

  return function matchesSelector(elem, selector) {
    return elem[matchesMethod](selector);
  };
});

/**
 * Fizzy UI utils v2.0.0
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */

(function (window, factory) {
  /*global define: false, module: false, require: false */
  'use strict';
  // universal module definition

  if (typeof define == 'function' && define.amd) {
    // AMD
    define('fizzy-ui-utils/utils', ['matches-selector/matches-selector'], function (matchesSelector) {
      return factory(window, matchesSelector);
    });
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('desandro-matches-selector'));
  } else {
    // browser global
    window.fizzyUIUtils = factory(window, window.matchesSelector);
  }
})(window, function factory(window, matchesSelector) {

  var utils = {};

  // ----- extend ----- //

  // extends objects
  utils.extend = function (a, b) {
    for (var prop in b) {
      a[prop] = b[prop];
    }
    return a;
  };

  // ----- modulo ----- //

  utils.modulo = function (num, div) {
    return (num % div + div) % div;
  };

  // ----- makeArray ----- //

  // turn element or nodeList into an array
  utils.makeArray = function (obj) {
    var ary = [];
    if (Array.isArray(obj)) {
      // use object if already an array
      ary = obj;
    } else if (obj && typeof obj.length == 'number') {
      // convert nodeList to array
      for (var i = 0; i < obj.length; i++) {
        ary.push(obj[i]);
      }
    } else {
      // array of single index
      ary.push(obj);
    }
    return ary;
  };

  // ----- removeFrom ----- //

  utils.removeFrom = function (ary, obj) {
    var index = ary.indexOf(obj);
    if (index != -1) {
      ary.splice(index, 1);
    }
  };

  // ----- getParent ----- //

  utils.getParent = function (elem, selector) {
    while (elem != document.body) {
      elem = elem.parentNode;
      if (matchesSelector(elem, selector)) {
        return elem;
      }
    }
  };

  // ----- getQueryElement ----- //

  // use element as selector string
  utils.getQueryElement = function (elem) {
    if (typeof elem == 'string') {
      return document.querySelector(elem);
    }
    return elem;
  };

  // ----- handleEvent ----- //

  // enable .ontype to trigger from .addEventListener( elem, 'type' )
  utils.handleEvent = function (event) {
    var method = 'on' + event.type;
    if (this[method]) {
      this[method](event);
    }
  };

  // ----- filterFindElements ----- //

  utils.filterFindElements = function (elems, selector) {
    // make array of elems
    elems = utils.makeArray(elems);
    var ffElems = [];

    elems.forEach(function (elem) {
      // check that elem is an actual element
      if (!(elem instanceof HTMLElement)) {
        return;
      }
      // add elem if no selector
      if (!selector) {
        ffElems.push(elem);
        return;
      }
      // filter & find items if we have a selector
      // filter
      if (matchesSelector(elem, selector)) {
        ffElems.push(elem);
      }
      // find children
      var childElems = elem.querySelectorAll(selector);
      // concat childElems to filterFound array
      for (var i = 0; i < childElems.length; i++) {
        ffElems.push(childElems[i]);
      }
    });

    return ffElems;
  };

  // ----- debounceMethod ----- //

  utils.debounceMethod = function (_class, methodName, threshold) {
    // original method
    var method = _class.prototype[methodName];
    var timeoutName = methodName + 'Timeout';

    _class.prototype[methodName] = function () {
      var timeout = this[timeoutName];
      if (timeout) {
        clearTimeout(timeout);
      }
      var args = arguments;

      var _this = this;
      this[timeoutName] = setTimeout(function () {
        method.apply(_this, args);
        delete _this[timeoutName];
      }, threshold || 100);
    };
  };

  // ----- docReady ----- //

  utils.docReady = function (callback) {
    if (document.readyState == 'complete') {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  };

  // ----- htmlInit ----- //

  // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
  utils.toDashed = function (str) {
    return str.replace(/(.)([A-Z])/g, function (match, $1, $2) {
      return $1 + '-' + $2;
    }).toLowerCase();
  };

  var console = window.console;
  /**
   * allow user to initialize classes via [data-namespace] or .js-namespace class
   * htmlInit( Widget, 'widgetName' )
   * options are parsed from data-namespace-options
   */
  utils.htmlInit = function (WidgetClass, namespace) {
    utils.docReady(function () {
      var dashedNamespace = utils.toDashed(namespace);
      var dataAttr = 'data-' + dashedNamespace;
      var dataAttrElems = document.querySelectorAll('[' + dataAttr + ']');
      var jsDashElems = document.querySelectorAll('.js-' + dashedNamespace);
      var elems = utils.makeArray(dataAttrElems).concat(utils.makeArray(jsDashElems));
      var dataOptionsAttr = dataAttr + '-options';
      var jQuery = window.jQuery;

      elems.forEach(function (elem) {
        var attr = elem.getAttribute(dataAttr) || elem.getAttribute(dataOptionsAttr);
        var options;
        try {
          options = attr && JSON.parse(attr);
        } catch (error) {
          // log error, do not initialize
          if (console) {
            console.error('Error parsing ' + dataAttr + ' on ' + elem.className + ': ' + error);
          }
          return;
        }
        // initialize
        var instance = new WidgetClass(elem, options);
        // make available via $().data('layoutname')
        if (jQuery) {
          jQuery.data(elem, namespace, instance);
        }
      });
    });
  };

  // -----  ----- //

  return utils;
});

/**
 * Outlayer Item
 */

(function (window, factory) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD - RequireJS
    define('outlayer/item', ['ev-emitter/ev-emitter', 'get-size/get-size'], function (EvEmitter, getSize) {
      return factory(window, EvEmitter, getSize);
    });
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS - Browserify, Webpack
    module.exports = factory(window, require('ev-emitter'), require('get-size'));
  } else {
    // browser global
    window.Outlayer = {};
    window.Outlayer.Item = factory(window, window.EvEmitter, window.getSize);
  }
})(window, function factory(window, EvEmitter, getSize) {
  'use strict';

  // ----- helpers ----- //

  function isEmptyObj(obj) {
    for (var prop in obj) {
      return false;
    }
    prop = null;
    return true;
  }

  // -------------------------- CSS3 support -------------------------- //

  var docElemStyle = document.documentElement.style;

  var transitionProperty = typeof docElemStyle.transition == 'string' ? 'transition' : 'WebkitTransition';
  var transformProperty = typeof docElemStyle.transform == 'string' ? 'transform' : 'WebkitTransform';

  var transitionEndEvent = {
    WebkitTransition: 'webkitTransitionEnd',
    transition: 'transitionend'
  }[transitionProperty];

  // cache all vendor properties
  var vendorProperties = [transformProperty, transitionProperty, transitionProperty + 'Duration', transitionProperty + 'Property'];

  // -------------------------- Item -------------------------- //

  function Item(element, layout) {
    if (!element) {
      return;
    }

    this.element = element;
    // parent layout class, i.e. Masonry, Isotope, or Packery
    this.layout = layout;
    this.position = {
      x: 0,
      y: 0
    };

    this._create();
  }

  // inherit EvEmitter
  var proto = Item.prototype = Object.create(EvEmitter.prototype);
  proto.constructor = Item;

  proto._create = function () {
    // transition objects
    this._transn = {
      ingProperties: {},
      clean: {},
      onEnd: {}
    };

    this.css({
      position: 'absolute'
    });
  };

  // trigger specified handler for event type
  proto.handleEvent = function (event) {
    var method = 'on' + event.type;
    if (this[method]) {
      this[method](event);
    }
  };

  proto.getSize = function () {
    this.size = getSize(this.element);
  };

  /**
   * apply CSS styles to element
   * @param {Object} style
   */
  proto.css = function (style) {
    var elemStyle = this.element.style;

    for (var prop in style) {
      // use vendor property if available
      var supportedProp = vendorProperties[prop] || prop;
      elemStyle[supportedProp] = style[prop];
    }
  };

  // measure position, and sets it
  proto.getPosition = function () {
    var style = getComputedStyle(this.element);
    var isOriginLeft = this.layout._getOption('originLeft');
    var isOriginTop = this.layout._getOption('originTop');
    var xValue = style[isOriginLeft ? 'left' : 'right'];
    var yValue = style[isOriginTop ? 'top' : 'bottom'];
    // convert percent to pixels
    var layoutSize = this.layout.size;
    var x = xValue.indexOf('%') != -1 ? parseFloat(xValue) / 100 * layoutSize.width : parseInt(xValue, 10);
    var y = yValue.indexOf('%') != -1 ? parseFloat(yValue) / 100 * layoutSize.height : parseInt(yValue, 10);

    // clean up 'auto' or other non-integer values
    x = isNaN(x) ? 0 : x;
    y = isNaN(y) ? 0 : y;
    // remove padding from measurement
    x -= isOriginLeft ? layoutSize.paddingLeft : layoutSize.paddingRight;
    y -= isOriginTop ? layoutSize.paddingTop : layoutSize.paddingBottom;

    this.position.x = x;
    this.position.y = y;
  };

  // set settled position, apply padding
  proto.layoutPosition = function () {
    var layoutSize = this.layout.size;
    var style = {};
    var isOriginLeft = this.layout._getOption('originLeft');
    var isOriginTop = this.layout._getOption('originTop');

    // x
    var xPadding = isOriginLeft ? 'paddingLeft' : 'paddingRight';
    var xProperty = isOriginLeft ? 'left' : 'right';
    var xResetProperty = isOriginLeft ? 'right' : 'left';

    var x = this.position.x + layoutSize[xPadding];
    // set in percentage or pixels
    style[xProperty] = this.getXValue(x);
    // reset other property
    style[xResetProperty] = '';

    // y
    var yPadding = isOriginTop ? 'paddingTop' : 'paddingBottom';
    var yProperty = isOriginTop ? 'top' : 'bottom';
    var yResetProperty = isOriginTop ? 'bottom' : 'top';

    var y = this.position.y + layoutSize[yPadding];
    // set in percentage or pixels
    style[yProperty] = this.getYValue(y);
    // reset other property
    style[yResetProperty] = '';

    this.css(style);
    this.emitEvent('layout', [this]);
  };

  proto.getXValue = function (x) {
    var isHorizontal = this.layout._getOption('horizontal');
    return this.layout.options.percentPosition && !isHorizontal ? x / this.layout.size.width * 100 + '%' : x + 'px';
  };

  proto.getYValue = function (y) {
    var isHorizontal = this.layout._getOption('horizontal');
    return this.layout.options.percentPosition && isHorizontal ? y / this.layout.size.height * 100 + '%' : y + 'px';
  };

  proto._transitionTo = function (x, y) {
    this.getPosition();
    // get current x & y from top/left
    var curX = this.position.x;
    var curY = this.position.y;

    var compareX = parseInt(x, 10);
    var compareY = parseInt(y, 10);
    var didNotMove = compareX === this.position.x && compareY === this.position.y;

    // save end position
    this.setPosition(x, y);

    // if did not move and not transitioning, just go to layout
    if (didNotMove && !this.isTransitioning) {
      this.layoutPosition();
      return;
    }

    var transX = x - curX;
    var transY = y - curY;
    var transitionStyle = {};
    transitionStyle.transform = this.getTranslate(transX, transY);

    this.transition({
      to: transitionStyle,
      onTransitionEnd: {
        transform: this.layoutPosition
      },
      isCleaning: true
    });
  };

  proto.getTranslate = function (x, y) {
    // flip cooridinates if origin on right or bottom
    var isOriginLeft = this.layout._getOption('originLeft');
    var isOriginTop = this.layout._getOption('originTop');
    x = isOriginLeft ? x : -x;
    y = isOriginTop ? y : -y;
    return 'translate3d(' + x + 'px, ' + y + 'px, 0)';
  };

  // non transition + transform support
  proto.goTo = function (x, y) {
    this.setPosition(x, y);
    this.layoutPosition();
  };

  proto.moveTo = proto._transitionTo;

  proto.setPosition = function (x, y) {
    this.position.x = parseInt(x, 10);
    this.position.y = parseInt(y, 10);
  };

  // ----- transition ----- //

  /**
   * @param {Object} style - CSS
   * @param {Function} onTransitionEnd
   */

  // non transition, just trigger callback
  proto._nonTransition = function (args) {
    this.css(args.to);
    if (args.isCleaning) {
      this._removeStyles(args.to);
    }
    for (var prop in args.onTransitionEnd) {
      args.onTransitionEnd[prop].call(this);
    }
  };

  /**
   * proper transition
   * @param {Object} args - arguments
   *   @param {Object} to - style to transition to
   *   @param {Object} from - style to start transition from
   *   @param {Boolean} isCleaning - removes transition styles after transition
   *   @param {Function} onTransitionEnd - callback
   */
  proto._transition = function (args) {
    // redirect to nonTransition if no transition duration
    if (!parseFloat(this.layout.options.transitionDuration)) {
      this._nonTransition(args);
      return;
    }

    var _transition = this._transn;
    // keep track of onTransitionEnd callback by css property
    for (var prop in args.onTransitionEnd) {
      _transition.onEnd[prop] = args.onTransitionEnd[prop];
    }
    // keep track of properties that are transitioning
    for (prop in args.to) {
      _transition.ingProperties[prop] = true;
      // keep track of properties to clean up when transition is done
      if (args.isCleaning) {
        _transition.clean[prop] = true;
      }
    }

    // set from styles
    if (args.from) {
      this.css(args.from);
      // force redraw. http://blog.alexmaccaw.com/css-transitions
      var h = this.element.offsetHeight;
      // hack for JSHint to hush about unused var
      h = null;
    }
    // enable transition
    this.enableTransition(args.to);
    // set styles that are transitioning
    this.css(args.to);

    this.isTransitioning = true;
  };

  // dash before all cap letters, including first for
  // WebkitTransform => -webkit-transform
  function toDashedAll(str) {
    return str.replace(/([A-Z])/g, function ($1) {
      return '-' + $1.toLowerCase();
    });
  }

  var transitionProps = 'opacity,' + toDashedAll(vendorProperties.transform || 'transform');

  proto.enableTransition = function () /* style */{
    // HACK changing transitionProperty during a transition
    // will cause transition to jump
    if (this.isTransitioning) {
      return;
    }

    // make `transition: foo, bar, baz` from style object
    // HACK un-comment this when enableTransition can work
    // while a transition is happening
    // var transitionValues = [];
    // for ( var prop in style ) {
    //   // dash-ify camelCased properties like WebkitTransition
    //   prop = vendorProperties[ prop ] || prop;
    //   transitionValues.push( toDashedAll( prop ) );
    // }
    // enable transition styles
    this.css({
      transitionProperty: transitionProps,
      transitionDuration: this.layout.options.transitionDuration
    });
    // listen for transition end event
    this.element.addEventListener(transitionEndEvent, this, false);
  };

  proto.transition = Item.prototype[transitionProperty ? '_transition' : '_nonTransition'];

  // ----- events ----- //

  proto.onwebkitTransitionEnd = function (event) {
    this.ontransitionend(event);
  };

  proto.onotransitionend = function (event) {
    this.ontransitionend(event);
  };

  // properties that I munge to make my life easier
  var dashedVendorProperties = {
    '-webkit-transform': 'transform'
  };

  proto.ontransitionend = function (event) {
    // disregard bubbled events from children
    if (event.target !== this.element) {
      return;
    }
    var _transition = this._transn;
    // get property name of transitioned property, convert to prefix-free
    var propertyName = dashedVendorProperties[event.propertyName] || event.propertyName;

    // remove property that has completed transitioning
    delete _transition.ingProperties[propertyName];
    // check if any properties are still transitioning
    if (isEmptyObj(_transition.ingProperties)) {
      // all properties have completed transitioning
      this.disableTransition();
    }
    // clean style
    if (propertyName in _transition.clean) {
      // clean up style
      this.element.style[event.propertyName] = '';
      delete _transition.clean[propertyName];
    }
    // trigger onTransitionEnd callback
    if (propertyName in _transition.onEnd) {
      var onTransitionEnd = _transition.onEnd[propertyName];
      onTransitionEnd.call(this);
      delete _transition.onEnd[propertyName];
    }

    this.emitEvent('transitionEnd', [this]);
  };

  proto.disableTransition = function () {
    this.removeTransitionStyles();
    this.element.removeEventListener(transitionEndEvent, this, false);
    this.isTransitioning = false;
  };

  /**
   * removes style property from element
   * @param {Object} style
  **/
  proto._removeStyles = function (style) {
    // clean up transition styles
    var cleanStyle = {};
    for (var prop in style) {
      cleanStyle[prop] = '';
    }
    this.css(cleanStyle);
  };

  var cleanTransitionStyle = {
    transitionProperty: '',
    transitionDuration: ''
  };

  proto.removeTransitionStyles = function () {
    // remove transition
    this.css(cleanTransitionStyle);
  };

  // ----- show/hide/remove ----- //

  // remove element from DOM
  proto.removeElem = function () {
    this.element.parentNode.removeChild(this.element);
    // remove display: none
    this.css({ display: '' });
    this.emitEvent('remove', [this]);
  };

  proto.remove = function () {
    // just remove element if no transition support or no transition
    if (!transitionProperty || !parseFloat(this.layout.options.transitionDuration)) {
      this.removeElem();
      return;
    }

    // start transition
    this.once('transitionEnd', function () {
      this.removeElem();
    });
    this.hide();
  };

  proto.reveal = function () {
    delete this.isHidden;
    // remove display: none
    this.css({ display: '' });

    var options = this.layout.options;

    var onTransitionEnd = {};
    var transitionEndProperty = this.getHideRevealTransitionEndProperty('visibleStyle');
    onTransitionEnd[transitionEndProperty] = this.onRevealTransitionEnd;

    this.transition({
      from: options.hiddenStyle,
      to: options.visibleStyle,
      isCleaning: true,
      onTransitionEnd: onTransitionEnd
    });
  };

  proto.onRevealTransitionEnd = function () {
    // check if still visible
    // during transition, item may have been hidden
    if (!this.isHidden) {
      this.emitEvent('reveal');
    }
  };

  /**
   * get style property use for hide/reveal transition end
   * @param {String} styleProperty - hiddenStyle/visibleStyle
   * @returns {String}
   */
  proto.getHideRevealTransitionEndProperty = function (styleProperty) {
    var optionStyle = this.layout.options[styleProperty];
    // use opacity
    if (optionStyle.opacity) {
      return 'opacity';
    }
    // get first property
    for (var prop in optionStyle) {
      return prop;
    }
  };

  proto.hide = function () {
    // set flag
    this.isHidden = true;
    // remove display: none
    this.css({ display: '' });

    var options = this.layout.options;

    var onTransitionEnd = {};
    var transitionEndProperty = this.getHideRevealTransitionEndProperty('hiddenStyle');
    onTransitionEnd[transitionEndProperty] = this.onHideTransitionEnd;

    this.transition({
      from: options.visibleStyle,
      to: options.hiddenStyle,
      // keep hidden stuff hidden
      isCleaning: true,
      onTransitionEnd: onTransitionEnd
    });
  };

  proto.onHideTransitionEnd = function () {
    // check if still hidden
    // during transition, item may have been un-hidden
    if (this.isHidden) {
      this.css({ display: 'none' });
      this.emitEvent('hide');
    }
  };

  proto.destroy = function () {
    this.css({
      position: '',
      left: '',
      right: '',
      top: '',
      bottom: '',
      transition: '',
      transform: ''
    });
  };

  return Item;
});

/*!
 * Outlayer v2.0.0
 * the brains and guts of a layout library
 * MIT license
 */

(function (window, factory) {
  'use strict';
  // universal module definition
  /* jshint strict: false */ /* globals define, module, require */

  if (typeof define == 'function' && define.amd) {
    // AMD - RequireJS
    define('outlayer/outlayer', ['ev-emitter/ev-emitter', 'get-size/get-size', 'fizzy-ui-utils/utils', './item'], function (EvEmitter, getSize, utils, Item) {
      return factory(window, EvEmitter, getSize, utils, Item);
    });
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS - Browserify, Webpack
    module.exports = factory(window, require('ev-emitter'), require('get-size'), require('fizzy-ui-utils'), require('./item'));
  } else {
    // browser global
    window.Outlayer = factory(window, window.EvEmitter, window.getSize, window.fizzyUIUtils, window.Outlayer.Item);
  }
})(window, function factory(window, EvEmitter, getSize, utils, Item) {
  'use strict';

  // ----- vars ----- //

  var console = window.console;
  var jQuery = window.jQuery;
  var noop = function () {};

  // -------------------------- Outlayer -------------------------- //

  // globally unique identifiers
  var GUID = 0;
  // internal store of all Outlayer intances
  var instances = {};

  /**
   * @param {Element, String} element
   * @param {Object} options
   * @constructor
   */
  function Outlayer(element, options) {
    var queryElement = utils.getQueryElement(element);
    if (!queryElement) {
      if (console) {
        console.error('Bad element for ' + this.constructor.namespace + ': ' + (queryElement || element));
      }
      return;
    }
    this.element = queryElement;
    // add jQuery
    if (jQuery) {
      this.$element = jQuery(this.element);
    }

    // options
    this.options = utils.extend({}, this.constructor.defaults);
    this.option(options);

    // add id for Outlayer.getFromElement
    var id = ++GUID;
    this.element.outlayerGUID = id; // expando
    instances[id] = this; // associate via id

    // kick it off
    this._create();

    var isInitLayout = this._getOption('initLayout');
    if (isInitLayout) {
      this.layout();
    }
  }

  // settings are for internal use only
  Outlayer.namespace = 'outlayer';
  Outlayer.Item = Item;

  // default options
  Outlayer.defaults = {
    containerStyle: {
      position: 'relative'
    },
    initLayout: true,
    originLeft: true,
    originTop: true,
    resize: true,
    resizeContainer: true,
    // item options
    transitionDuration: '0.4s',
    hiddenStyle: {
      opacity: 0,
      transform: 'scale(0.001)'
    },
    visibleStyle: {
      opacity: 1,
      transform: 'scale(1)'
    }
  };

  var proto = Outlayer.prototype;
  // inherit EvEmitter
  utils.extend(proto, EvEmitter.prototype);

  /**
   * set options
   * @param {Object} opts
   */
  proto.option = function (opts) {
    utils.extend(this.options, opts);
  };

  /**
   * get backwards compatible option value, check old name
   */
  proto._getOption = function (option) {
    var oldOption = this.constructor.compatOptions[option];
    return oldOption && this.options[oldOption] !== undefined ? this.options[oldOption] : this.options[option];
  };

  Outlayer.compatOptions = {
    // currentName: oldName
    initLayout: 'isInitLayout',
    horizontal: 'isHorizontal',
    layoutInstant: 'isLayoutInstant',
    originLeft: 'isOriginLeft',
    originTop: 'isOriginTop',
    resize: 'isResizeBound',
    resizeContainer: 'isResizingContainer'
  };

  proto._create = function () {
    // get items from children
    this.reloadItems();
    // elements that affect layout, but are not laid out
    this.stamps = [];
    this.stamp(this.options.stamp);
    // set container style
    utils.extend(this.element.style, this.options.containerStyle);

    // bind resize method
    var canBindResize = this._getOption('resize');
    if (canBindResize) {
      this.bindResize();
    }
  };

  // goes through all children again and gets bricks in proper order
  proto.reloadItems = function () {
    // collection of item elements
    this.items = this._itemize(this.element.children);
  };

  /**
   * turn elements into Outlayer.Items to be used in layout
   * @param {Array or NodeList or HTMLElement} elems
   * @returns {Array} items - collection of new Outlayer Items
   */
  proto._itemize = function (elems) {

    var itemElems = this._filterFindItemElements(elems);
    var Item = this.constructor.Item;

    // create new Outlayer Items for collection
    var items = [];
    for (var i = 0; i < itemElems.length; i++) {
      var elem = itemElems[i];
      var item = new Item(elem, this);
      items.push(item);
    }

    return items;
  };

  /**
   * get item elements to be used in layout
   * @param {Array or NodeList or HTMLElement} elems
   * @returns {Array} items - item elements
   */
  proto._filterFindItemElements = function (elems) {
    return utils.filterFindElements(elems, this.options.itemSelector);
  };

  /**
   * getter method for getting item elements
   * @returns {Array} elems - collection of item elements
   */
  proto.getItemElements = function () {
    return this.items.map(function (item) {
      return item.element;
    });
  };

  // ----- init & layout ----- //

  /**
   * lays out all items
   */
  proto.layout = function () {
    this._resetLayout();
    this._manageStamps();

    // don't animate first layout
    var layoutInstant = this._getOption('layoutInstant');
    var isInstant = layoutInstant !== undefined ? layoutInstant : !this._isLayoutInited;
    this.layoutItems(this.items, isInstant);

    // flag for initalized
    this._isLayoutInited = true;
  };

  // _init is alias for layout
  proto._init = proto.layout;

  /**
   * logic before any new layout
   */
  proto._resetLayout = function () {
    this.getSize();
  };

  proto.getSize = function () {
    this.size = getSize(this.element);
  };

  /**
   * get measurement from option, for columnWidth, rowHeight, gutter
   * if option is String -> get element from selector string, & get size of element
   * if option is Element -> get size of element
   * else use option as a number
   *
   * @param {String} measurement
   * @param {String} size - width or height
   * @private
   */
  proto._getMeasurement = function (measurement, size) {
    var option = this.options[measurement];
    var elem;
    if (!option) {
      // default to 0
      this[measurement] = 0;
    } else {
      // use option as an element
      if (typeof option == 'string') {
        elem = this.element.querySelector(option);
      } else if (option instanceof HTMLElement) {
        elem = option;
      }
      // use size of element, if element
      this[measurement] = elem ? getSize(elem)[size] : option;
    }
  };

  /**
   * layout a collection of item elements
   * @api public
   */
  proto.layoutItems = function (items, isInstant) {
    items = this._getItemsForLayout(items);

    this._layoutItems(items, isInstant);

    this._postLayout();
  };

  /**
   * get the items to be laid out
   * you may want to skip over some items
   * @param {Array} items
   * @returns {Array} items
   */
  proto._getItemsForLayout = function (items) {
    return items.filter(function (item) {
      return !item.isIgnored;
    });
  };

  /**
   * layout items
   * @param {Array} items
   * @param {Boolean} isInstant
   */
  proto._layoutItems = function (items, isInstant) {
    this._emitCompleteOnItems('layout', items);

    if (!items || !items.length) {
      // no items, emit event with empty array
      return;
    }

    var queue = [];

    items.forEach(function (item) {
      // get x/y object from method
      var position = this._getItemLayoutPosition(item);
      // enqueue
      position.item = item;
      position.isInstant = isInstant || item.isLayoutInstant;
      queue.push(position);
    }, this);

    this._processLayoutQueue(queue);
  };

  /**
   * get item layout position
   * @param {Outlayer.Item} item
   * @returns {Object} x and y position
   */
  proto._getItemLayoutPosition = function () /* item */{
    return {
      x: 0,
      y: 0
    };
  };

  /**
   * iterate over array and position each item
   * Reason being - separating this logic prevents 'layout invalidation'
   * thx @paul_irish
   * @param {Array} queue
   */
  proto._processLayoutQueue = function (queue) {
    queue.forEach(function (obj) {
      this._positionItem(obj.item, obj.x, obj.y, obj.isInstant);
    }, this);
  };

  /**
   * Sets position of item in DOM
   * @param {Outlayer.Item} item
   * @param {Number} x - horizontal position
   * @param {Number} y - vertical position
   * @param {Boolean} isInstant - disables transitions
   */
  proto._positionItem = function (item, x, y, isInstant) {
    if (isInstant) {
      // if not transition, just set CSS
      item.goTo(x, y);
    } else {
      item.moveTo(x, y);
    }
  };

  /**
   * Any logic you want to do after each layout,
   * i.e. size the container
   */
  proto._postLayout = function () {
    this.resizeContainer();
  };

  proto.resizeContainer = function () {
    var isResizingContainer = this._getOption('resizeContainer');
    if (!isResizingContainer) {
      return;
    }
    var size = this._getContainerSize();
    if (size) {
      this._setContainerMeasure(size.width, true);
      this._setContainerMeasure(size.height, false);
    }
  };

  /**
   * Sets width or height of container if returned
   * @returns {Object} size
   *   @param {Number} width
   *   @param {Number} height
   */
  proto._getContainerSize = noop;

  /**
   * @param {Number} measure - size of width or height
   * @param {Boolean} isWidth
   */
  proto._setContainerMeasure = function (measure, isWidth) {
    if (measure === undefined) {
      return;
    }

    var elemSize = this.size;
    // add padding and border width if border box
    if (elemSize.isBorderBox) {
      measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight + elemSize.borderLeftWidth + elemSize.borderRightWidth : elemSize.paddingBottom + elemSize.paddingTop + elemSize.borderTopWidth + elemSize.borderBottomWidth;
    }

    measure = Math.max(measure, 0);
    this.element.style[isWidth ? 'width' : 'height'] = measure + 'px';
  };

  /**
   * emit eventComplete on a collection of items events
   * @param {String} eventName
   * @param {Array} items - Outlayer.Items
   */
  proto._emitCompleteOnItems = function (eventName, items) {
    var _this = this;
    function onComplete() {
      _this.dispatchEvent(eventName + 'Complete', null, [items]);
    }

    var count = items.length;
    if (!items || !count) {
      onComplete();
      return;
    }

    var doneCount = 0;
    function tick() {
      doneCount++;
      if (doneCount == count) {
        onComplete();
      }
    }

    // bind callback
    items.forEach(function (item) {
      item.once(eventName, tick);
    });
  };

  /**
   * emits events via EvEmitter and jQuery events
   * @param {String} type - name of event
   * @param {Event} event - original event
   * @param {Array} args - extra arguments
   */
  proto.dispatchEvent = function (type, event, args) {
    // add original event to arguments
    var emitArgs = event ? [event].concat(args) : args;
    this.emitEvent(type, emitArgs);

    if (jQuery) {
      // set this.$element
      this.$element = this.$element || jQuery(this.element);
      if (event) {
        // create jQuery event
        var $event = jQuery.Event(event);
        $event.type = type;
        this.$element.trigger($event, args);
      } else {
        // just trigger with type if no event available
        this.$element.trigger(type, args);
      }
    }
  };

  // -------------------------- ignore & stamps -------------------------- //

  /**
   * keep item in collection, but do not lay it out
   * ignored items do not get skipped in layout
   * @param {Element} elem
   */
  proto.ignore = function (elem) {
    var item = this.getItem(elem);
    if (item) {
      item.isIgnored = true;
    }
  };

  /**
   * return item to layout collection
   * @param {Element} elem
   */
  proto.unignore = function (elem) {
    var item = this.getItem(elem);
    if (item) {
      delete item.isIgnored;
    }
  };

  /**
   * adds elements to stamps
   * @param {NodeList, Array, Element, or String} elems
   */
  proto.stamp = function (elems) {
    elems = this._find(elems);
    if (!elems) {
      return;
    }

    this.stamps = this.stamps.concat(elems);
    // ignore
    elems.forEach(this.ignore, this);
  };

  /**
   * removes elements to stamps
   * @param {NodeList, Array, or Element} elems
   */
  proto.unstamp = function (elems) {
    elems = this._find(elems);
    if (!elems) {
      return;
    }

    elems.forEach(function (elem) {
      // filter out removed stamp elements
      utils.removeFrom(this.stamps, elem);
      this.unignore(elem);
    }, this);
  };

  /**
   * finds child elements
   * @param {NodeList, Array, Element, or String} elems
   * @returns {Array} elems
   */
  proto._find = function (elems) {
    if (!elems) {
      return;
    }
    // if string, use argument as selector string
    if (typeof elems == 'string') {
      elems = this.element.querySelectorAll(elems);
    }
    elems = utils.makeArray(elems);
    return elems;
  };

  proto._manageStamps = function () {
    if (!this.stamps || !this.stamps.length) {
      return;
    }

    this._getBoundingRect();

    this.stamps.forEach(this._manageStamp, this);
  };

  // update boundingLeft / Top
  proto._getBoundingRect = function () {
    // get bounding rect for container element
    var boundingRect = this.element.getBoundingClientRect();
    var size = this.size;
    this._boundingRect = {
      left: boundingRect.left + size.paddingLeft + size.borderLeftWidth,
      top: boundingRect.top + size.paddingTop + size.borderTopWidth,
      right: boundingRect.right - (size.paddingRight + size.borderRightWidth),
      bottom: boundingRect.bottom - (size.paddingBottom + size.borderBottomWidth)
    };
  };

  /**
   * @param {Element} stamp
  **/
  proto._manageStamp = noop;

  /**
   * get x/y position of element relative to container element
   * @param {Element} elem
   * @returns {Object} offset - has left, top, right, bottom
   */
  proto._getElementOffset = function (elem) {
    var boundingRect = elem.getBoundingClientRect();
    var thisRect = this._boundingRect;
    var size = getSize(elem);
    var offset = {
      left: boundingRect.left - thisRect.left - size.marginLeft,
      top: boundingRect.top - thisRect.top - size.marginTop,
      right: thisRect.right - boundingRect.right - size.marginRight,
      bottom: thisRect.bottom - boundingRect.bottom - size.marginBottom
    };
    return offset;
  };

  // -------------------------- resize -------------------------- //

  // enable event handlers for listeners
  // i.e. resize -> onresize
  proto.handleEvent = utils.handleEvent;

  /**
   * Bind layout to window resizing
   */
  proto.bindResize = function () {
    window.addEventListener('resize', this);
    this.isResizeBound = true;
  };

  /**
   * Unbind layout to window resizing
   */
  proto.unbindResize = function () {
    window.removeEventListener('resize', this);
    this.isResizeBound = false;
  };

  proto.onresize = function () {
    this.resize();
  };

  utils.debounceMethod(Outlayer, 'onresize', 100);

  proto.resize = function () {
    // don't trigger if size did not change
    // or if resize was unbound. See #9
    if (!this.isResizeBound || !this.needsResizeLayout()) {
      return;
    }

    this.layout();
  };

  /**
   * check if layout is needed post layout
   * @returns Boolean
   */
  proto.needsResizeLayout = function () {
    var size = getSize(this.element);
    // check that this.size and size are there
    // IE8 triggers resize on body size change, so they might not be
    var hasSizes = this.size && size;
    return hasSizes && size.innerWidth !== this.size.innerWidth;
  };

  // -------------------------- methods -------------------------- //

  /**
   * add items to Outlayer instance
   * @param {Array or NodeList or Element} elems
   * @returns {Array} items - Outlayer.Items
  **/
  proto.addItems = function (elems) {
    var items = this._itemize(elems);
    // add items to collection
    if (items.length) {
      this.items = this.items.concat(items);
    }
    return items;
  };

  /**
   * Layout newly-appended item elements
   * @param {Array or NodeList or Element} elems
   */
  proto.appended = function (elems) {
    var items = this.addItems(elems);
    if (!items.length) {
      return;
    }
    // layout and reveal just the new items
    this.layoutItems(items, true);
    this.reveal(items);
  };

  /**
   * Layout prepended elements
   * @param {Array or NodeList or Element} elems
   */
  proto.prepended = function (elems) {
    var items = this._itemize(elems);
    if (!items.length) {
      return;
    }
    // add items to beginning of collection
    var previousItems = this.items.slice(0);
    this.items = items.concat(previousItems);
    // start new layout
    this._resetLayout();
    this._manageStamps();
    // layout new stuff without transition
    this.layoutItems(items, true);
    this.reveal(items);
    // layout previous items
    this.layoutItems(previousItems);
  };

  /**
   * reveal a collection of items
   * @param {Array of Outlayer.Items} items
   */
  proto.reveal = function (items) {
    this._emitCompleteOnItems('reveal', items);
    if (!items || !items.length) {
      return;
    }
    items.forEach(function (item) {
      item.reveal();
    });
  };

  /**
   * hide a collection of items
   * @param {Array of Outlayer.Items} items
   */
  proto.hide = function (items) {
    this._emitCompleteOnItems('hide', items);
    if (!items || !items.length) {
      return;
    }
    items.forEach(function (item) {
      item.hide();
    });
  };

  /**
   * reveal item elements
   * @param {Array}, {Element}, {NodeList} items
   */
  proto.revealItemElements = function (elems) {
    var items = this.getItems(elems);
    this.reveal(items);
  };

  /**
   * hide item elements
   * @param {Array}, {Element}, {NodeList} items
   */
  proto.hideItemElements = function (elems) {
    var items = this.getItems(elems);
    this.hide(items);
  };

  /**
   * get Outlayer.Item, given an Element
   * @param {Element} elem
   * @param {Function} callback
   * @returns {Outlayer.Item} item
   */
  proto.getItem = function (elem) {
    // loop through items to get the one that matches
    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];
      if (item.element == elem) {
        // return item
        return item;
      }
    }
  };

  /**
   * get collection of Outlayer.Items, given Elements
   * @param {Array} elems
   * @returns {Array} items - Outlayer.Items
   */
  proto.getItems = function (elems) {
    elems = utils.makeArray(elems);
    var items = [];
    elems.forEach(function (elem) {
      var item = this.getItem(elem);
      if (item) {
        items.push(item);
      }
    }, this);

    return items;
  };

  /**
   * remove element(s) from instance and DOM
   * @param {Array or NodeList or Element} elems
   */
  proto.remove = function (elems) {
    var removeItems = this.getItems(elems);

    this._emitCompleteOnItems('remove', removeItems);

    // bail if no items to remove
    if (!removeItems || !removeItems.length) {
      return;
    }

    removeItems.forEach(function (item) {
      item.remove();
      // remove item from collection
      utils.removeFrom(this.items, item);
    }, this);
  };

  // ----- destroy ----- //

  // remove and disable Outlayer instance
  proto.destroy = function () {
    // clean up dynamic styles
    var style = this.element.style;
    style.height = '';
    style.position = '';
    style.width = '';
    // destroy items
    this.items.forEach(function (item) {
      item.destroy();
    });

    this.unbindResize();

    var id = this.element.outlayerGUID;
    delete instances[id]; // remove reference to instance by id
    delete this.element.outlayerGUID;
    // remove data for jQuery
    if (jQuery) {
      jQuery.removeData(this.element, this.constructor.namespace);
    }
  };

  // -------------------------- data -------------------------- //

  /**
   * get Outlayer instance from element
   * @param {Element} elem
   * @returns {Outlayer}
   */
  Outlayer.data = function (elem) {
    elem = utils.getQueryElement(elem);
    var id = elem && elem.outlayerGUID;
    return id && instances[id];
  };

  // -------------------------- create Outlayer class -------------------------- //

  /**
   * create a layout class
   * @param {String} namespace
   */
  Outlayer.create = function (namespace, options) {
    // sub-class Outlayer
    var Layout = subclass(Outlayer);
    // apply new options and compatOptions
    Layout.defaults = utils.extend({}, Outlayer.defaults);
    utils.extend(Layout.defaults, options);
    Layout.compatOptions = utils.extend({}, Outlayer.compatOptions);

    Layout.namespace = namespace;

    Layout.data = Outlayer.data;

    // sub-class Item
    Layout.Item = subclass(Item);

    // -------------------------- declarative -------------------------- //

    utils.htmlInit(Layout, namespace);

    // -------------------------- jQuery bridge -------------------------- //

    // make into jQuery plugin
    if (jQuery && jQuery.bridget) {
      jQuery.bridget(namespace, Layout);
    }

    return Layout;
  };

  function subclass(Parent) {
    function SubClass() {
      Parent.apply(this, arguments);
    }

    SubClass.prototype = Object.create(Parent.prototype);
    SubClass.prototype.constructor = SubClass;

    return SubClass;
  }

  // ----- fin ----- //

  // back in global
  Outlayer.Item = Item;

  return Outlayer;
});

/*!
 * Masonry v4.0.0
 * Cascading grid layout library
 * http://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

(function (window, factory) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define(['outlayer/outlayer', 'get-size/get-size'], factory);
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('outlayer'), require('get-size'));
  } else {
    // browser global
    window.Masonry = factory(window.Outlayer, window.getSize);
  }
})(window, function factory(Outlayer, getSize) {

  // -------------------------- masonryDefinition -------------------------- //

  // create an Outlayer layout class
  var Masonry = Outlayer.create('masonry');
  // isFitWidth -> fitWidth
  Masonry.compatOptions.fitWidth = 'isFitWidth';

  Masonry.prototype._resetLayout = function () {
    this.getSize();
    this._getMeasurement('columnWidth', 'outerWidth');
    this._getMeasurement('gutter', 'outerWidth');
    this.measureColumns();

    // reset column Y
    this.colYs = [];
    for (var i = 0; i < this.cols; i++) {
      this.colYs.push(0);
    }

    this.maxY = 0;
  };

  Masonry.prototype.measureColumns = function () {
    this.getContainerWidth();
    // if columnWidth is 0, default to outerWidth of first item
    if (!this.columnWidth) {
      var firstItem = this.items[0];
      var firstItemElem = firstItem && firstItem.element;
      // columnWidth fall back to item of first element
      this.columnWidth = firstItemElem && getSize(firstItemElem).outerWidth ||
      // if first elem has no width, default to size of container
      this.containerWidth;
    }

    var columnWidth = this.columnWidth += this.gutter;

    // calculate columns
    var containerWidth = this.containerWidth + this.gutter;
    var cols = containerWidth / columnWidth;
    // fix rounding errors, typically with gutters
    var excess = columnWidth - containerWidth % columnWidth;
    // if overshoot is less than a pixel, round up, otherwise floor it
    var mathMethod = excess && excess < 1 ? 'round' : 'floor';
    cols = Math[mathMethod](cols);
    this.cols = Math.max(cols, 1);
  };

  Masonry.prototype.getContainerWidth = function () {
    // container is parent if fit width
    var isFitWidth = this._getOption('fitWidth');
    var container = isFitWidth ? this.element.parentNode : this.element;
    // check that this.size and size are there
    // IE8 triggers resize on body size change, so they might not be
    var size = getSize(container);
    this.containerWidth = size && size.innerWidth;
  };

  Masonry.prototype._getItemLayoutPosition = function (item) {
    item.getSize();
    // how many columns does this brick span
    var remainder = item.size.outerWidth % this.columnWidth;
    var mathMethod = remainder && remainder < 1 ? 'round' : 'ceil';
    // round if off by 1 pixel, otherwise use ceil
    var colSpan = Math[mathMethod](item.size.outerWidth / this.columnWidth);
    colSpan = Math.min(colSpan, this.cols);

    var colGroup = this._getColGroup(colSpan);
    // get the minimum Y value from the columns
    var minimumY = Math.min.apply(Math, colGroup);
    var shortColIndex = colGroup.indexOf(minimumY);

    // position the brick
    var position = {
      x: this.columnWidth * shortColIndex,
      y: minimumY
    };

    // apply setHeight to necessary columns
    var setHeight = minimumY + item.size.outerHeight;
    var setSpan = this.cols + 1 - colGroup.length;
    for (var i = 0; i < setSpan; i++) {
      this.colYs[shortColIndex + i] = setHeight;
    }

    return position;
  };

  /**
   * @param {Number} colSpan - number of columns the element spans
   * @returns {Array} colGroup
   */
  Masonry.prototype._getColGroup = function (colSpan) {
    if (colSpan < 2) {
      // if brick spans only one column, use all the column Ys
      return this.colYs;
    }

    var colGroup = [];
    // how many different places could this brick fit horizontally
    var groupCount = this.cols + 1 - colSpan;
    // for each group potential horizontal position
    for (var i = 0; i < groupCount; i++) {
      // make an array of colY values for that one group
      var groupColYs = this.colYs.slice(i, i + colSpan);
      // and get the max value of the array
      colGroup[i] = Math.max.apply(Math, groupColYs);
    }
    return colGroup;
  };

  Masonry.prototype._manageStamp = function (stamp) {
    var stampSize = getSize(stamp);
    var offset = this._getElementOffset(stamp);
    // get the columns that this stamp affects
    var isOriginLeft = this._getOption('originLeft');
    var firstX = isOriginLeft ? offset.left : offset.right;
    var lastX = firstX + stampSize.outerWidth;
    var firstCol = Math.floor(firstX / this.columnWidth);
    firstCol = Math.max(0, firstCol);
    var lastCol = Math.floor(lastX / this.columnWidth);
    // lastCol should not go over if multiple of columnWidth #425
    lastCol -= lastX % this.columnWidth ? 0 : 1;
    lastCol = Math.min(this.cols - 1, lastCol);
    // set colYs to bottom of the stamp

    var isOriginTop = this._getOption('originTop');
    var stampMaxY = (isOriginTop ? offset.top : offset.bottom) + stampSize.outerHeight;
    for (var i = firstCol; i <= lastCol; i++) {
      this.colYs[i] = Math.max(stampMaxY, this.colYs[i]);
    }
  };

  Masonry.prototype._getContainerSize = function () {
    this.maxY = Math.max.apply(Math, this.colYs);
    var size = {
      height: this.maxY
    };

    if (this._getOption('fitWidth')) {
      size.width = this._getContainerFitWidth();
    }

    return size;
  };

  Masonry.prototype._getContainerFitWidth = function () {
    var unusedCols = 0;
    // count unused columns
    var i = this.cols;
    while (--i) {
      if (this.colYs[i] !== 0) {
        break;
      }
      unusedCols++;
    }
    // fit container to columns that have been used
    return (this.cols - unusedCols) * this.columnWidth - this.gutter;
  };

  Masonry.prototype.needsResizeLayout = function () {
    var previousWidth = this.containerWidth;
    this.getContainerWidth();
    return previousWidth != this.containerWidth;
  };

  return Masonry;
});
;'use strict';

/*!
 * imagesLoaded PACKAGED v4.1.0
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

/**
 * EvEmitter v1.0.1
 * Lil' event emitter
 * MIT License
 */

/* jshint unused: true, undef: true, strict: true */

(function (global, factory) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module */
  if (typeof define == 'function' && define.amd) {
    // AMD - RequireJS
    define('ev-emitter/ev-emitter', factory);
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS - Browserify, Webpack
    module.exports = factory();
  } else {
    // Browser globals
    global.EvEmitter = factory();
  }
})(this, function () {

  function EvEmitter() {}

  var proto = EvEmitter.prototype;

  proto.on = function (eventName, listener) {
    if (!eventName || !listener) {
      return;
    }
    // set events hash
    var events = this._events = this._events || {};
    // set listeners array
    var listeners = events[eventName] = events[eventName] || [];
    // only add once
    if (listeners.indexOf(listener) == -1) {
      listeners.push(listener);
    }

    return this;
  };

  proto.once = function (eventName, listener) {
    if (!eventName || !listener) {
      return;
    }
    // add event
    this.on(eventName, listener);
    // set once flag
    // set onceEvents hash
    var onceEvents = this._onceEvents = this._onceEvents || {};
    // set onceListeners array
    var onceListeners = onceEvents[eventName] = onceEvents[eventName] || [];
    // set flag
    onceListeners[listener] = true;

    return this;
  };

  proto.off = function (eventName, listener) {
    var listeners = this._events && this._events[eventName];
    if (!listeners || !listeners.length) {
      return;
    }
    var index = listeners.indexOf(listener);
    if (index != -1) {
      listeners.splice(index, 1);
    }

    return this;
  };

  proto.emitEvent = function (eventName, args) {
    var listeners = this._events && this._events[eventName];
    if (!listeners || !listeners.length) {
      return;
    }
    var i = 0;
    var listener = listeners[i];
    args = args || [];
    // once stuff
    var onceListeners = this._onceEvents && this._onceEvents[eventName];

    while (listener) {
      var isOnce = onceListeners && onceListeners[listener];
      if (isOnce) {
        // remove listener
        // remove before trigger to prevent recursion
        this.off(eventName, listener);
        // unset once flag
        delete onceListeners[listener];
      }
      // trigger listener
      listener.apply(this, args);
      // get next listener
      i += isOnce ? 0 : 1;
      listener = listeners[i];
    }

    return this;
  };

  return EvEmitter;
});

/*!
 * imagesLoaded v4.1.0
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

(function (window, factory) {
  'use strict';
  // universal module definition

  /*global define: false, module: false, require: false */

  if (typeof define == 'function' && define.amd) {
    // AMD
    define(['ev-emitter/ev-emitter'], function (EvEmitter) {
      return factory(window, EvEmitter);
    });
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('ev-emitter'));
  } else {
    // browser global
    window.imagesLoaded = factory(window, window.EvEmitter);
  }
})(window,

// --------------------------  factory -------------------------- //

function factory(window, EvEmitter) {

  var $ = window.jQuery;
  var console = window.console;

  // -------------------------- helpers -------------------------- //

  // extend objects
  function extend(a, b) {
    for (var prop in b) {
      a[prop] = b[prop];
    }
    return a;
  }

  // turn element or nodeList into an array
  function makeArray(obj) {
    var ary = [];
    if (Array.isArray(obj)) {
      // use object if already an array
      ary = obj;
    } else if (typeof obj.length == 'number') {
      // convert nodeList to array
      for (var i = 0; i < obj.length; i++) {
        ary.push(obj[i]);
      }
    } else {
      // array of single index
      ary.push(obj);
    }
    return ary;
  }

  // -------------------------- imagesLoaded -------------------------- //

  /**
   * @param {Array, Element, NodeList, String} elem
   * @param {Object or Function} options - if function, use as callback
   * @param {Function} onAlways - callback function
   */
  function ImagesLoaded(elem, options, onAlways) {
    // coerce ImagesLoaded() without new, to be new ImagesLoaded()
    if (!(this instanceof ImagesLoaded)) {
      return new ImagesLoaded(elem, options, onAlways);
    }
    // use elem as selector string
    if (typeof elem == 'string') {
      elem = document.querySelectorAll(elem);
    }

    this.elements = makeArray(elem);
    this.options = extend({}, this.options);

    if (typeof options == 'function') {
      onAlways = options;
    } else {
      extend(this.options, options);
    }

    if (onAlways) {
      this.on('always', onAlways);
    }

    this.getImages();

    if ($) {
      // add jQuery Deferred object
      this.jqDeferred = new $.Deferred();
    }

    // HACK check async to allow time to bind listeners
    setTimeout(function () {
      this.check();
    }.bind(this));
  }

  ImagesLoaded.prototype = Object.create(EvEmitter.prototype);

  ImagesLoaded.prototype.options = {};

  ImagesLoaded.prototype.getImages = function () {
    this.images = [];

    // filter & find items if we have an item selector
    this.elements.forEach(this.addElementImages, this);
  };

  /**
   * @param {Node} element
   */
  ImagesLoaded.prototype.addElementImages = function (elem) {
    // filter siblings
    if (elem.nodeName == 'IMG') {
      this.addImage(elem);
    }
    // get background image on element
    if (this.options.background === true) {
      this.addElementBackgroundImages(elem);
    }

    // find children
    // no non-element nodes, #143
    var nodeType = elem.nodeType;
    if (!nodeType || !elementNodeTypes[nodeType]) {
      return;
    }
    var childImgs = elem.querySelectorAll('img');
    // concat childElems to filterFound array
    for (var i = 0; i < childImgs.length; i++) {
      var img = childImgs[i];
      this.addImage(img);
    }

    // get child background images
    if (typeof this.options.background == 'string') {
      var children = elem.querySelectorAll(this.options.background);
      for (i = 0; i < children.length; i++) {
        var child = children[i];
        this.addElementBackgroundImages(child);
      }
    }
  };

  var elementNodeTypes = {
    1: true,
    9: true,
    11: true
  };

  ImagesLoaded.prototype.addElementBackgroundImages = function (elem) {
    var style = getComputedStyle(elem);
    if (!style) {
      // Firefox returns null if in a hidden iframe https://bugzil.la/548397
      return;
    }
    // get url inside url("...")
    var reURL = /url\((['"])?(.*?)\1\)/gi;
    var matches = reURL.exec(style.backgroundImage);
    while (matches !== null) {
      var url = matches && matches[2];
      if (url) {
        this.addBackground(url, elem);
      }
      matches = reURL.exec(style.backgroundImage);
    }
  };

  /**
   * @param {Image} img
   */
  ImagesLoaded.prototype.addImage = function (img) {
    var loadingImage = new LoadingImage(img);
    this.images.push(loadingImage);
  };

  ImagesLoaded.prototype.addBackground = function (url, elem) {
    var background = new Background(url, elem);
    this.images.push(background);
  };

  ImagesLoaded.prototype.check = function () {
    var _this = this;
    this.progressedCount = 0;
    this.hasAnyBroken = false;
    // complete if no images
    if (!this.images.length) {
      this.complete();
      return;
    }

    function onProgress(image, elem, message) {
      // HACK - Chrome triggers event before object properties have changed. #83
      setTimeout(function () {
        _this.progress(image, elem, message);
      });
    }

    this.images.forEach(function (loadingImage) {
      loadingImage.once('progress', onProgress);
      loadingImage.check();
    });
  };

  ImagesLoaded.prototype.progress = function (image, elem, message) {
    this.progressedCount++;
    this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
    // progress event
    this.emitEvent('progress', [this, image, elem]);
    if (this.jqDeferred && this.jqDeferred.notify) {
      this.jqDeferred.notify(this, image);
    }
    // check if completed
    if (this.progressedCount == this.images.length) {
      this.complete();
    }

    if (this.options.debug && console) {
      console.log('progress: ' + message, image, elem);
    }
  };

  ImagesLoaded.prototype.complete = function () {
    var eventName = this.hasAnyBroken ? 'fail' : 'done';
    this.isComplete = true;
    this.emitEvent(eventName, [this]);
    this.emitEvent('always', [this]);
    if (this.jqDeferred) {
      var jqMethod = this.hasAnyBroken ? 'reject' : 'resolve';
      this.jqDeferred[jqMethod](this);
    }
  };

  // --------------------------  -------------------------- //

  function LoadingImage(img) {
    this.img = img;
  }

  LoadingImage.prototype = Object.create(EvEmitter.prototype);

  LoadingImage.prototype.check = function () {
    // If complete is true and browser supports natural sizes,
    // try to check for image status manually.
    var isComplete = this.getIsImageComplete();
    if (isComplete) {
      // report based on naturalWidth
      this.confirm(this.img.naturalWidth !== 0, 'naturalWidth');
      return;
    }

    // If none of the checks above matched, simulate loading on detached element.
    this.proxyImage = new Image();
    this.proxyImage.addEventListener('load', this);
    this.proxyImage.addEventListener('error', this);
    // bind to image as well for Firefox. #191
    this.img.addEventListener('load', this);
    this.img.addEventListener('error', this);
    this.proxyImage.src = this.img.src;
  };

  LoadingImage.prototype.getIsImageComplete = function () {
    return this.img.complete && this.img.naturalWidth !== undefined;
  };

  LoadingImage.prototype.confirm = function (isLoaded, message) {
    this.isLoaded = isLoaded;
    this.emitEvent('progress', [this, this.img, message]);
  };

  // ----- events ----- //

  // trigger specified handler for event type
  LoadingImage.prototype.handleEvent = function (event) {
    var method = 'on' + event.type;
    if (this[method]) {
      this[method](event);
    }
  };

  LoadingImage.prototype.onload = function () {
    this.confirm(true, 'onload');
    this.unbindEvents();
  };

  LoadingImage.prototype.onerror = function () {
    this.confirm(false, 'onerror');
    this.unbindEvents();
  };

  LoadingImage.prototype.unbindEvents = function () {
    this.proxyImage.removeEventListener('load', this);
    this.proxyImage.removeEventListener('error', this);
    this.img.removeEventListener('load', this);
    this.img.removeEventListener('error', this);
  };

  // -------------------------- Background -------------------------- //

  function Background(url, element) {
    this.url = url;
    this.element = element;
    this.img = new Image();
  }

  // inherit LoadingImage prototype
  Background.prototype = Object.create(LoadingImage.prototype);

  Background.prototype.check = function () {
    this.img.addEventListener('load', this);
    this.img.addEventListener('error', this);
    this.img.src = this.url;
    // check if image is already complete
    var isComplete = this.getIsImageComplete();
    if (isComplete) {
      this.confirm(this.img.naturalWidth !== 0, 'naturalWidth');
      this.unbindEvents();
    }
  };

  Background.prototype.unbindEvents = function () {
    this.img.removeEventListener('load', this);
    this.img.removeEventListener('error', this);
  };

  Background.prototype.confirm = function (isLoaded, message) {
    this.isLoaded = isLoaded;
    this.emitEvent('progress', [this, this.element, message]);
  };

  // -------------------------- jQuery -------------------------- //

  ImagesLoaded.makeJQueryPlugin = function (jQuery) {
    jQuery = jQuery || window.jQuery;
    if (!jQuery) {
      return;
    }
    // set local variable
    $ = jQuery;
    // $().imagesLoaded()
    $.fn.imagesLoaded = function (options, callback) {
      var instance = new ImagesLoaded(this, options, callback);
      return instance.jqDeferred.promise($(this));
    };
  };
  // try making plugin
  ImagesLoaded.makeJQueryPlugin();

  // --------------------------  -------------------------- //

  return ImagesLoaded;
});
;'use strict';

/*!
 * smooth-scroll v9.1.1: Animate scrolling to anchor links
 * (c) 2016 Chris Ferdinandi
 * MIT License
 * http://github.com/cferdinandi/smooth-scroll
 */

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory(root));
	} else if (typeof exports === 'object') {
		module.exports = factory(root);
	} else {
		root.smoothScroll = factory(root);
	}
})(typeof global !== 'undefined' ? global : this.window || this.global, function (root) {

	'use strict';

	//
	// Variables
	//

	var smoothScroll = {}; // Object for public APIs
	var supports = 'querySelector' in document && 'addEventListener' in root; // Feature test
	var settings, eventTimeout, fixedHeader, headerHeight, animationInterval;

	// Default settings
	var defaults = {
		selector: '[data-scroll]',
		selectorHeader: '[data-scroll-header]',
		speed: 500,
		easing: 'easeInOutCubic',
		offset: 0,
		updateURL: true,
		callback: function () {}
	};

	//
	// Methods
	//

	/**
  * Merge two or more objects. Returns a new object.
  * @private
  * @param {Boolean}  deep     If true, do a deep (or recursive) merge [optional]
  * @param {Object}   objects  The objects to merge together
  * @returns {Object}          Merged values of defaults and options
  */
	var extend = function () {

		// Variables
		var extended = {};
		var deep = false;
		var i = 0;
		var length = arguments.length;

		// Check if a deep merge
		if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
			deep = arguments[0];
			i++;
		}

		// Merge the object into the extended object
		var merge = function (obj) {
			for (var prop in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, prop)) {
					// If deep merge and property is an object, merge properties
					if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
						extended[prop] = extend(true, extended[prop], obj[prop]);
					} else {
						extended[prop] = obj[prop];
					}
				}
			}
		};

		// Loop through each object and conduct a merge
		for (; i < length; i++) {
			var obj = arguments[i];
			merge(obj);
		}

		return extended;
	};

	/**
  * Get the height of an element.
  * @private
  * @param  {Node} elem The element to get the height of
  * @return {Number}    The element's height in pixels
  */
	var getHeight = function (elem) {
		return Math.max(elem.scrollHeight, elem.offsetHeight, elem.clientHeight);
	};

	/**
  * Get the closest matching element up the DOM tree.
  * @private
  * @param  {Element} elem     Starting element
  * @param  {String}  selector Selector to match against (class, ID, data attribute, or tag)
  * @return {Boolean|Element}  Returns null if not match found
  */
	var getClosest = function (elem, selector) {

		// Variables
		var firstChar = selector.charAt(0);
		var supports = 'classList' in document.documentElement;
		var attribute, value;

		// If selector is a data attribute, split attribute from value
		if (firstChar === '[') {
			selector = selector.substr(1, selector.length - 2);
			attribute = selector.split('=');

			if (attribute.length > 1) {
				value = true;
				attribute[1] = attribute[1].replace(/"/g, '').replace(/'/g, '');
			}
		}

		// Get closest match
		for (; elem && elem !== document; elem = elem.parentNode) {

			// If selector is a class
			if (firstChar === '.') {
				if (supports) {
					if (elem.classList.contains(selector.substr(1))) {
						return elem;
					}
				} else {
					if (new RegExp('(^|\\s)' + selector.substr(1) + '(\\s|$)').test(elem.className)) {
						return elem;
					}
				}
			}

			// If selector is an ID
			if (firstChar === '#') {
				if (elem.id === selector.substr(1)) {
					return elem;
				}
			}

			// If selector is a data attribute
			if (firstChar === '[') {
				if (elem.hasAttribute(attribute[0])) {
					if (value) {
						if (elem.getAttribute(attribute[0]) === attribute[1]) {
							return elem;
						}
					} else {
						return elem;
					}
				}
			}

			// If selector is a tag
			if (elem.tagName.toLowerCase() === selector) {
				return elem;
			}
		}

		return null;
	};

	/**
  * Escape special characters for use with querySelector
  * @public
  * @param {String} id The anchor ID to escape
  * @author Mathias Bynens
  * @link https://github.com/mathiasbynens/CSS.escape
  */
	smoothScroll.escapeCharacters = function (id) {

		// Remove leading hash
		if (id.charAt(0) === '#') {
			id = id.substr(1);
		}

		var string = String(id);
		var length = string.length;
		var index = -1;
		var codeUnit;
		var result = '';
		var firstCodeUnit = string.charCodeAt(0);
		while (++index < length) {
			codeUnit = string.charCodeAt(index);
			// Note: there’s no need to special-case astral symbols, surrogate
			// pairs, or lone surrogates.

			// If the character is NULL (U+0000), then throw an
			// `InvalidCharacterError` exception and terminate these steps.
			if (codeUnit === 0x0000) {
				throw new InvalidCharacterError('Invalid character: the input contains U+0000.');
			}

			if (
			// If the character is in the range [\1-\1F] (U+0001 to U+001F) or is
			// U+007F, […]
			codeUnit >= 0x0001 && codeUnit <= 0x001F || codeUnit == 0x007F ||
			// If the character is the first character and is in the range [0-9]
			// (U+0030 to U+0039), […]
			index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
			// If the character is the second character and is in the range [0-9]
			// (U+0030 to U+0039) and the first character is a `-` (U+002D), […]
			index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && firstCodeUnit === 0x002D) {
				// http://dev.w3.org/csswg/cssom/#escape-a-character-as-code-point
				result += '\\' + codeUnit.toString(16) + ' ';
				continue;
			}

			// If the character is not handled by one of the above rules and is
			// greater than or equal to U+0080, is `-` (U+002D) or `_` (U+005F), or
			// is in one of the ranges [0-9] (U+0030 to U+0039), [A-Z] (U+0041 to
			// U+005A), or [a-z] (U+0061 to U+007A), […]
			if (codeUnit >= 0x0080 || codeUnit === 0x002D || codeUnit === 0x005F || codeUnit >= 0x0030 && codeUnit <= 0x0039 || codeUnit >= 0x0041 && codeUnit <= 0x005A || codeUnit >= 0x0061 && codeUnit <= 0x007A) {
				// the character itself
				result += string.charAt(index);
				continue;
			}

			// Otherwise, the escaped character.
			// http://dev.w3.org/csswg/cssom/#escape-a-character
			result += '\\' + string.charAt(index);
		}

		return '#' + result;
	};

	/**
  * Calculate the easing pattern
  * @private
  * @link https://gist.github.com/gre/1650294
  * @param {String} type Easing pattern
  * @param {Number} time Time animation should take to complete
  * @returns {Number}
  */
	var easingPattern = function (type, time) {
		var pattern;
		if (type === 'easeInQuad') pattern = time * time; // accelerating from zero velocity
		if (type === 'easeOutQuad') pattern = time * (2 - time); // decelerating to zero velocity
		if (type === 'easeInOutQuad') pattern = time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time; // acceleration until halfway, then deceleration
		if (type === 'easeInCubic') pattern = time * time * time; // accelerating from zero velocity
		if (type === 'easeOutCubic') pattern = --time * time * time + 1; // decelerating to zero velocity
		if (type === 'easeInOutCubic') pattern = time < 0.5 ? 4 * time * time * time : (time - 1) * (2 * time - 2) * (2 * time - 2) + 1; // acceleration until halfway, then deceleration
		if (type === 'easeInQuart') pattern = time * time * time * time; // accelerating from zero velocity
		if (type === 'easeOutQuart') pattern = 1 - --time * time * time * time; // decelerating to zero velocity
		if (type === 'easeInOutQuart') pattern = time < 0.5 ? 8 * time * time * time * time : 1 - 8 * --time * time * time * time; // acceleration until halfway, then deceleration
		if (type === 'easeInQuint') pattern = time * time * time * time * time; // accelerating from zero velocity
		if (type === 'easeOutQuint') pattern = 1 + --time * time * time * time * time; // decelerating to zero velocity
		if (type === 'easeInOutQuint') pattern = time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * --time * time * time * time * time; // acceleration until halfway, then deceleration
		return pattern || time; // no easing, no acceleration
	};

	/**
  * Calculate how far to scroll
  * @private
  * @param {Element} anchor The anchor element to scroll to
  * @param {Number} headerHeight Height of a fixed header, if any
  * @param {Number} offset Number of pixels by which to offset scroll
  * @returns {Number}
  */
	var getEndLocation = function (anchor, headerHeight, offset) {
		var location = 0;
		if (anchor.offsetParent) {
			do {
				location += anchor.offsetTop;
				anchor = anchor.offsetParent;
			} while (anchor);
		}
		location = location - headerHeight - offset;
		return location >= 0 ? location : 0;
	};

	/**
  * Determine the document's height
  * @private
  * @returns {Number}
  */
	var getDocumentHeight = function () {
		return Math.max(root.document.body.scrollHeight, root.document.documentElement.scrollHeight, root.document.body.offsetHeight, root.document.documentElement.offsetHeight, root.document.body.clientHeight, root.document.documentElement.clientHeight);
	};

	/**
  * Convert data-options attribute into an object of key/value pairs
  * @private
  * @param {String} options Link-specific options as a data attribute string
  * @returns {Object}
  */
	var getDataOptions = function (options) {
		return !options || !(typeof JSON === 'object' && typeof JSON.parse === 'function') ? {} : JSON.parse(options);
	};

	/**
  * Update the URL
  * @private
  * @param {Element} anchor The element to scroll to
  * @param {Boolean} url Whether or not to update the URL history
  */
	var updateUrl = function (anchor, url) {
		if (root.history.pushState && (url || url === 'true') && root.location.protocol !== 'file:') {
			root.history.pushState(null, null, [root.location.protocol, '//', root.location.host, root.location.pathname, root.location.search, anchor].join(''));
		}
	};

	var getHeaderHeight = function (header) {
		return header === null ? 0 : getHeight(header) + header.offsetTop;
	};

	/**
  * Start/stop the scrolling animation
  * @public
  * @param {Element} anchor The element to scroll to
  * @param {Element} toggle The element that toggled the scroll event
  * @param {Object} options
  */
	smoothScroll.animateScroll = function (anchor, toggle, options) {

		// Options and overrides
		var overrides = getDataOptions(toggle ? toggle.getAttribute('data-options') : null);
		var animateSettings = extend(settings || defaults, options || {}, overrides); // Merge user options with defaults

		// Selectors and variables
		var isNum = Object.prototype.toString.call(anchor) === '[object Number]' ? true : false;
		var anchorElem = isNum ? null : anchor === '#' ? root.document.documentElement : root.document.querySelector(anchor);
		if (!isNum && !anchorElem) return;
		var startLocation = root.pageYOffset; // Current location on the page
		if (!fixedHeader) {
			fixedHeader = root.document.querySelector(animateSettings.selectorHeader);
		} // Get the fixed header if not already set
		if (!headerHeight) {
			headerHeight = getHeaderHeight(fixedHeader);
		} // Get the height of a fixed header if one exists and not already set
		var endLocation = isNum ? anchor : getEndLocation(anchorElem, headerHeight, parseInt(animateSettings.offset, 10)); // Location to scroll to
		var distance = endLocation - startLocation; // distance to travel
		var documentHeight = getDocumentHeight();
		var timeLapsed = 0;
		var percentage, position;

		// Update URL
		if (!isNum) {
			updateUrl(anchor, animateSettings.updateURL);
		}

		/**
   * Stop the scroll animation when it reaches its target (or the bottom/top of page)
   * @private
   * @param {Number} position Current position on the page
   * @param {Number} endLocation Scroll to location
   * @param {Number} animationInterval How much to scroll on this loop
   */
		var stopAnimateScroll = function (position, endLocation, animationInterval) {
			var currentLocation = root.pageYOffset;
			if (position == endLocation || currentLocation == endLocation || root.innerHeight + currentLocation >= documentHeight) {
				clearInterval(animationInterval);
				if (!isNum) {
					anchorElem.focus();
				}
				animateSettings.callback(anchor, toggle); // Run callbacks after animation complete
			}
		};

		/**
   * Loop scrolling animation
   * @private
   */
		var loopAnimateScroll = function () {
			timeLapsed += 16;
			percentage = timeLapsed / parseInt(animateSettings.speed, 10);
			percentage = percentage > 1 ? 1 : percentage;
			position = startLocation + distance * easingPattern(animateSettings.easing, percentage);
			root.scrollTo(0, Math.floor(position));
			stopAnimateScroll(position, endLocation, animationInterval);
		};

		/**
   * Set interval timer
   * @private
   */
		var startAnimateScroll = function () {
			clearInterval(animationInterval);
			animationInterval = setInterval(loopAnimateScroll, 16);
		};

		/**
   * Reset position to fix weird iOS bug
   * @link https://github.com/cferdinandi/smooth-scroll/issues/45
   */
		if (root.pageYOffset === 0) {
			root.scrollTo(0, 0);
		}

		// Start scrolling animation
		startAnimateScroll();
	};

	/**
  * If smooth scroll element clicked, animate scroll
  * @private
  */
	var eventHandler = function (event) {

		// Don't run if right-click or command/control + click
		if (event.button !== 0 || event.metaKey || event.ctrlKey) return;

		// If a smooth scroll link, animate it
		var toggle = getClosest(event.target, settings.selector);
		if (toggle && toggle.tagName.toLowerCase() === 'a') {
			event.preventDefault(); // Prevent default click event
			var hash = smoothScroll.escapeCharacters(toggle.hash); // Escape hash characters
			smoothScroll.animateScroll(hash, toggle, settings); // Animate scroll
		}
	};

	/**
  * On window scroll and resize, only run events at a rate of 15fps for better performance
  * @private
  * @param  {Function} eventTimeout Timeout function
  * @param  {Object} settings
  */
	var eventThrottler = function (event) {
		if (!eventTimeout) {
			eventTimeout = setTimeout(function () {
				eventTimeout = null; // Reset timeout
				headerHeight = getHeaderHeight(fixedHeader); // Get the height of a fixed header if one exists
			}, 66);
		}
	};

	/**
  * Destroy the current initialization.
  * @public
  */
	smoothScroll.destroy = function () {

		// If plugin isn't already initialized, stop
		if (!settings) return;

		// Remove event listeners
		root.document.removeEventListener('click', eventHandler, false);
		root.removeEventListener('resize', eventThrottler, false);

		// Reset varaibles
		settings = null;
		eventTimeout = null;
		fixedHeader = null;
		headerHeight = null;
		animationInterval = null;
	};

	/**
  * Initialize Smooth Scroll
  * @public
  * @param {Object} options User settings
  */
	smoothScroll.init = function (options) {

		// feature test
		if (!supports) return;

		// Destroy any existing initializations
		smoothScroll.destroy();

		// Selectors and variables
		settings = extend(defaults, options || {}); // Merge user options with defaults
		fixedHeader = root.document.querySelector(settings.selectorHeader); // Get the fixed header
		headerHeight = getHeaderHeight(fixedHeader);

		// When a toggle is clicked, run the click handler
		root.document.addEventListener('click', eventHandler, false);
		if (fixedHeader) {
			root.addEventListener('resize', eventThrottler, false);
		}
	};

	//
	// Public APIs
	//

	return smoothScroll;
});
;var sbi_js_exists = typeof sbi_js_exists !== 'undefined' ? true : false;
if (!sbi_js_exists) {

    (function () {
        var e, t;e = function () {
            function e(e, t) {
                var n, r;this.options = { target: "instafeed", get: "popular", resolution: "thumbnail", sortBy: "none", links: !0, mock: !1, useHttp: !1 };if (typeof e == "object") for (n in e) r = e[n], this.options[n] = r;this.context = t != null ? t : this, this.unique = this._genKey();
            }return e.prototype.hasNext = function () {
                return typeof this.context.nextUrl == "string" && this.context.nextUrl.length > 0;
            }, e.prototype.next = function () {
                return this.hasNext() ? this.run(this.context.nextUrl) : !1;
            }, e.prototype.run = function (t) {
                var n, r, i;if (typeof this.options.clientId != "string" && typeof this.options.accessToken != "string") throw new Error("Missing clientId or accessToken.");if (typeof this.options.accessToken != "string" && typeof this.options.clientId != "string") throw new Error("Missing clientId or accessToken.");return this.options.before != null && typeof this.options.before == "function" && this.options.before.call(this), typeof document != "undefined" && document !== null && (i = document.createElement("script"), i.id = "instafeed-fetcher", i.src = t || this._buildUrl(), n = document.getElementsByTagName("head"), n[0].appendChild(i), r = "instafeedCache" + this.unique, window[r] = new e(this.options, this), window[r].unique = this.unique), !0;
            }, e.prototype.parse = function (e) {
                var t, n, r, i, s, o, u, a, f, l, c, h, p, d, v, m, g, y, b, w, E, S;if (typeof e != "object") {
                    if (this.options.error != null && typeof this.options.error == "function") return this.options.error.call(this, "Invalid JSON data"), !1;throw new Error("Invalid JSON response");
                }if (e.meta.code !== 200) {
                    if (this.options.error != null && typeof this.options.error == "function") return this.options.error.call(this, e.meta.error_message), !1;throw new Error("Error from Instagram: " + e.meta.error_message);
                }if (e.data.length === 0) {
                    if (this.options.error != null && typeof this.options.error == "function") return this.options.error.call(this, "No images were returned from Instagram"), !1;throw new Error("No images were returned from Instagram");
                }this.options.success != null && typeof this.options.success == "function" && this.options.success.call(this, e), this.context.nextUrl = "", e.pagination != null && (this.context.nextUrl = e.pagination.next_url);if (this.options.sortBy !== "none") {
                    this.options.sortBy === "random" ? d = ["", "random"] : d = this.options.sortBy.split("-"), p = d[0] === "least" ? !0 : !1;switch (d[1]) {case "random":
                            e.data.sort(function () {
                                return .5 - Math.random();
                            });break;case "recent":
                            e.data = this._sortBy(e.data, "created_time", p);break;case "liked":
                            e.data = this._sortBy(e.data, "likes.count", p);break;case "commented":
                            e.data = this._sortBy(e.data, "comments.count", p);break;default:
                            throw new Error("Invalid option for sortBy: '" + this.options.sortBy + "'.");}
                }if (typeof document != "undefined" && document !== null && this.options.mock === !1) {
                    a = e.data, this.options.limit != null && a.length > this.options.limit && (a = a.slice(0, this.options.limit + 1 || 9e9)), n = document.createDocumentFragment(), this.options.filter != null && typeof this.options.filter == "function" && (a = this._filter(a, this.options.filter));if (this.options.template != null && typeof this.options.template == "string") {
                        i = "", o = "", l = "", v = document.createElement("div");for (m = 0, b = a.length; m < b; m++) s = a[m], u = s.images[this.options.resolution].url, this.options.useHttp || (u = u.replace("http://", "//")), o = this._makeTemplate(this.options.template, { model: s, id: s.id, link: s.link, image: u, caption: this._getObjectProperty(s, "caption.text"), likes: s.likes.count, comments: s.comments.count, location: this._getObjectProperty(s, "location.name") }), i += o;v.innerHTML = i, S = [].slice.call(v.childNodes);for (g = 0, w = S.length; g < w; g++) h = S[g], n.appendChild(h);
                    } else for (y = 0, E = a.length; y < E; y++) s = a[y], f = document.createElement("img"), u = s.images[this.options.resolution].url, this.options.useHttp || (u = u.replace("http://", "//")), f.src = u, this.options.links === !0 ? (t = document.createElement("a"), t.href = s.link, t.appendChild(f), n.appendChild(t)) : n.appendChild(f);this.options.target.append(n), r = document.getElementsByTagName("head")[0], r.removeChild(document.getElementById("instafeed-fetcher")), c = "instafeedCache" + this.unique, window[c] = void 0;try {
                        delete window[c];
                    } catch (x) {}
                }return this.options.after != null && typeof this.options.after == "function" && this.options.after.call(this), !0;
            }, e.prototype._buildUrl = function () {
                var e, t, n;e = "https://api.instagram.com/v1";switch (this.options.get) {case "popular":
                        t = "media/popular";break;case "tagged":
                        if (typeof this.options.tagName != "string") throw new Error("No tag name specified. Use the 'tagName' option.");t = "tags/" + this.options.tagName + "/media/recent";break;case "location":
                        if (typeof this.options.locationId != "number") throw new Error("No location specified. Use the 'locationId' option.");t = "locations/" + this.options.locationId + "/media/recent";break;case "user":
                        if (typeof this.options.userId != "number") throw new Error("No user specified. Use the 'userId' option.");if (typeof this.options.accessToken != "string") throw new Error("No access token. Use the 'accessToken' option.");t = "users/" + this.options.userId + "/media/recent";break;default:
                        throw new Error("Invalid option for get: '" + this.options.get + "'.");}return n = "" + e + "/" + t, this.options.accessToken != null ? n += "?access_token=" + this.options.accessToken : n += "?client_id=" + this.options.clientId, this.options.limit != null && (n += "&count=" + this.options.limit), n += "&callback=instafeedCache" + this.unique + ".parse", n;
            }, e.prototype._genKey = function () {
                var e;return e = function () {
                    return ((1 + Math.random()) * 65536 | 0).toString(16).substring(1);
                }, "" + e() + e() + e() + e();
            }, e.prototype._makeTemplate = function (e, t) {
                var n, r, i, s, o;r = /(?:\{{2})([\w\[\]\.]+)(?:\}{2})/, n = e;while (r.test(n)) i = n.match(r)[1], s = (o = this._getObjectProperty(t, i)) != null ? o : "", n = n.replace(r, "" + s);return n;
            }, e.prototype._getObjectProperty = function (e, t) {
                var n, r;t = t.replace(/\[(\w+)\]/g, ".$1"), r = t.split(".");while (r.length) {
                    n = r.shift();if (!(e != null && n in e)) return null;e = e[n];
                }return e;
            }, e.prototype._sortBy = function (e, t, n) {
                var r;return r = function (e, r) {
                    var i, s;return i = this._getObjectProperty(e, t), s = this._getObjectProperty(r, t), n ? i > s ? 1 : -1 : i < s ? 1 : -1;
                }, e.sort(r.bind(this)), e;
            }, e.prototype._filter = function (e, t) {
                var n, r, i, s, o;n = [], i = function (e) {
                    if (t(e)) return n.push(e);
                };for (s = 0, o = e.length; s < o; s++) r = e[s], i(r);return n;
            }, e;
        }(), t = typeof exports != "undefined" && exports !== null ? exports : window, t.instagramfeed = e;
    }).call(this);

    //Shim for "fixing" IE's lack of support (IE < 9) for applying slice on host objects like NamedNodeMap, NodeList, and HTMLCollection) https://github.com/stevenschobert/instafeed.js/issues/84
    (function () {
        "use strict";
        var e = Array.prototype.slice;try {
            e.call(document.documentElement);
        } catch (t) {
            Array.prototype.slice = function (t, n) {
                n = typeof n !== "undefined" ? n : this.length;if (Object.prototype.toString.call(this) === "[object Array]") {
                    return e.call(this, t, n);
                }var r,
                    i = [],
                    s,
                    o = this.length;var u = t || 0;u = u >= 0 ? u : o + u;var a = n ? n : o;if (n < 0) {
                    a = o + n;
                }s = a - u;if (s > 0) {
                    i = new Array(s);if (this.charAt) {
                        for (r = 0; r < s; r++) {
                            i[r] = this.charAt(u + r);
                        }
                    } else {
                        for (r = 0; r < s; r++) {
                            i[r] = this[u + r];
                        }
                    }
                }return i;
            };
        }
    })();

    //IE8 also doesn't offer the .bind() method triggered by the 'sortBy' property. Copy and paste the polyfill offered here:
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (e) {
            if (typeof this !== "function") {
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }var t = Array.prototype.slice.call(arguments, 1),
                n = this,
                r = function () {},
                i = function () {
                return n.apply(this instanceof r && e ? this : e, t.concat(Array.prototype.slice.call(arguments)));
            };r.prototype = this.prototype;i.prototype = new r();return i;
        };
    }

    function sbi_init() {

        jQuery('#sb_instagram.sbi').each(function () {

            var $self = jQuery(this),
                $target = $self.find('#sbi_images'),
                $loadBtn = $self.find("#sbi_load .sbi_load_btn"),
                imgRes = 'standard_resolution',
                cols = parseInt(this.getAttribute('data-cols'), 10),
                num = this.getAttribute('data-num'),

            //Convert styles JSON string to an object
            feedOptions = JSON.parse(this.getAttribute('data-options')),
                getType = 'user',
                sortby = 'none',
                user_id = this.getAttribute('data-id'),
                num = this.getAttribute('data-num'),
                posts_arr = [],
                $header = '',
                morePosts = []; //Used to determine whether to show the Load More button when displaying posts from more than one id/hashtag. If one of the ids/hashtags has more posts then still show button.

            if (feedOptions.sortby !== '') sortby = feedOptions.sortby;

            switch (this.getAttribute('data-res')) {
                case 'auto':
                    var feedWidth = $self.innerWidth(),
                        colWidth = $self.innerWidth() / cols;

                    //Check if page width is less than 640. If it is then use the script above
                    var sbiWindowWidth = jQuery(window).width();
                    if (sbiWindowWidth < 640) {
                        //Need this for mobile so that image res is right on mobile, as the number of cols isn't always accurate on mobile as they are changed using CSS
                        if (feedWidth < 640 && $self.is('.sbi_col_3, .sbi_col_4, .sbi_col_5, .sbi_col_6')) colWidth = 300; //Use medium images
                        if (feedWidth < 640 && $self.is('.sbi_col_7, .sbi_col_8, .sbi_col_9, .sbi_col_10')) colWidth = 100; //Use thumbnail images
                        if (feedWidth > 320 && feedWidth < 480 && sbiWindowWidth < 480) colWidth = 480; //Use full size images
                        if (feedWidth < 320 && sbiWindowWidth < 480) colWidth = 300; //Use medium size images
                    }

                    if (colWidth < 150) {
                        imgRes = 'thumbnail';
                    } else if (colWidth < 320) {
                        imgRes = 'low_resolution';
                    } else {
                        imgRes = 'standard_resolution';
                    }

                    //If the feed is hidden (eg; in a tab) then the width is returned as 100, and so auto set the res to be medium to cover most bases
                    if (feedWidth <= 100) imgRes = 'low_resolution';

                    break;
                case 'thumb':
                    imgRes = 'thumbnail';
                    break;
                case 'medium':
                    imgRes = 'low_resolution';
                    break;
                default:
                    imgRes = 'standard_resolution';
            }

            //Split comma separated hashtags into array
            var ids_arr = user_id.replace(/ /g, '').split(",");
            var looparray = ids_arr;

            //Get page info for first User ID
            var headerStyles = '',
                sbi_page_url = 'https://api.instagram.com/v1/users/' + ids_arr[0] + '?access_token=' + sb_instagram_js_options.sb_instagram_at;

            if (feedOptions.headercolor.length) headerStyles = 'style="color: #' + feedOptions.headercolor + '"';

            jQuery.ajax({
                method: "GET",
                url: sbi_page_url,
                dataType: "jsonp",
                success: function (data) {
                    $header = '<a href="http://instagram.com/' + data.data.username + '" target="_blank" title="@' + data.data.username + '" class="sbi_header_link">';
                    $header += '<div class="sbi_header_text">';
                    $header += '<h3 ' + headerStyles;
                    if (data.data.bio.length == 0) $header += ' class="sbi_no_bio"';
                    $header += '>@' + data.data.username + '</h3>';
                    if (data.data.bio.length) $header += '<p class="sbi_bio" ' + headerStyles + '>' + data.data.bio + '</p>';
                    $header += '</div>';
                    $header += '<div class="sbi_header_img">';
                    $header += '<div class="sbi_header_img_hover"><i class="fa fa-instagram"></i></div>';
                    $header += '<img src="' + data.data.profile_picture + '" alt="' + data.data.full_name + '" width="50" height="50">';
                    $header += '</div>';
                    $header += '</a>';
                    //Add the header
                    $self.find('.sb_instagram_header').prepend($header);
                    //Change the URL of the follow button
                    if ($self.find('.sbi_follow_btn').length) $self.find('.sbi_follow_btn a').attr('href', 'http://instagram.com/' + data.data.username);
                }
            });

            //Loop through User IDs
            jQuery.each(looparray, function (index, entry) {

                var userFeed = new instagramfeed({
                    target: $target,
                    get: getType,
                    sortBy: sortby,
                    resolution: imgRes,
                    limit: parseInt(num, 10),
                    template: '<div class="sbi_item sbi_type_{{model.type}} sbi_new" id="sbi_{{id}}" data-date="{{model.created_time_raw}}"><div class="sbi_photo_wrap"><a class="sbi_photo" href="{{link}}" target="_blank"><img src="{{image}}" alt="{{caption}}" /></a></div></div>',
                    filter: function (image) {
                        //Create time for sorting
                        var date = new Date(image.created_time * 1000),
                            time = date.getTime();
                        image.created_time_raw = time;

                        //Replace double quotes in the captions with the HTML symbol
                        //Always check to make sure it exists
                        if (image.caption != null) image.caption.text = image.caption.text.replace(/"/g, "&quot;");

                        return true;
                    },
                    userId: parseInt(entry, 10),
                    accessToken: sb_instagram_js_options.sb_instagram_at,
                    after: function () {

                        $self.find('.sbi_loader').remove();

                        /* Load more button */
                        if (this.hasNext()) morePosts.push('1');

                        if (morePosts.length > 0) {
                            $loadBtn.show();
                        } else {
                            $loadBtn.hide();
                            $self.css('padding-bottom', 0);
                        }

                        // Call Custom JS if it exists
                        if (typeof sbi_custom_js == 'function') setTimeout(function () {
                            sbi_custom_js();
                        }, 100);

                        if (imgRes !== 'thumbnail') {
                            //This needs to be here otherwise it results in the following error for some sites: $self.find(...).sbi_imgLiquid() is not a function.
                            /*! imgLiquid v0.9.944 / 03-05-2013 https://github.com/karacas/imgLiquid */
                            var sbi_imgLiquid = sbi_imgLiquid || { VER: "0.9.944" };sbi_imgLiquid.bgs_Available = !1, sbi_imgLiquid.bgs_CheckRunned = !1, function (i) {
                                function t() {
                                    if (!sbi_imgLiquid.bgs_CheckRunned) {
                                        sbi_imgLiquid.bgs_CheckRunned = !0;var t = i('<span style="background-size:cover" />');i("body").append(t), !function () {
                                            var i = t[0];if (i && window.getComputedStyle) {
                                                var e = window.getComputedStyle(i, null);e && e.backgroundSize && (sbi_imgLiquid.bgs_Available = "cover" === e.backgroundSize);
                                            }
                                        }(), t.remove();
                                    }
                                }i.fn.extend({ sbi_imgLiquid: function (e) {
                                        this.defaults = { fill: !0, verticalAlign: "center", horizontalAlign: "center", useBackgroundSize: !0, useDataHtmlAttr: !0, responsive: !0, delay: 0, fadeInTime: 0, removeBoxBackground: !0, hardPixels: !0, responsiveCheckTime: 500, timecheckvisibility: 500, onStart: null, onFinish: null, onItemStart: null, onItemFinish: null, onItemError: null }, t();var a = this;return this.options = e, this.settings = i.extend({}, this.defaults, this.options), this.settings.onStart && this.settings.onStart(), this.each(function (t) {
                                            function e() {
                                                -1 === u.css("background-image").indexOf(encodeURI(c.attr("src"))) && u.css({ "background-image": 'url("' + encodeURI(c.attr("src")) + '")' }), u.css({ "background-size": g.fill ? "cover" : "contain", "background-position": (g.horizontalAlign + " " + g.verticalAlign).toLowerCase(), "background-repeat": "no-repeat" }), i("a:first", u).css({ display: "block", width: "100%", height: "100%" }), i("img", u).css({ display: "none" }), g.onItemFinish && g.onItemFinish(t, u, c), u.addClass("sbi_imgLiquid_bgSize"), u.addClass("sbi_imgLiquid_ready"), l();
                                            }function o() {
                                                function e() {
                                                    c.data("sbi_imgLiquid_error") || c.data("sbi_imgLiquid_loaded") || c.data("sbi_imgLiquid_oldProcessed") || (u.is(":visible") && c[0].complete && c[0].width > 0 && c[0].height > 0 ? (c.data("sbi_imgLiquid_loaded", !0), setTimeout(r, t * g.delay)) : setTimeout(e, g.timecheckvisibility));
                                                }if (c.data("oldSrc") && c.data("oldSrc") !== c.attr("src")) {
                                                    var a = c.clone().removeAttr("style");return a.data("sbi_imgLiquid_settings", c.data("sbi_imgLiquid_settings")), c.parent().prepend(a), c.remove(), c = a, c[0].width = 0, void setTimeout(o, 10);
                                                }return c.data("sbi_imgLiquid_oldProcessed") ? void r() : (c.data("sbi_imgLiquid_oldProcessed", !1), c.data("oldSrc", c.attr("src")), i("img:not(:first)", u).css("display", "none"), u.css({ overflow: "hidden" }), c.fadeTo(0, 0).removeAttr("width").removeAttr("height").css({ visibility: "visible", "max-width": "none", "max-height": "none", width: "auto", height: "auto", display: "block" }), c.on("error", n), c[0].onerror = n, e(), void d());
                                            }function d() {
                                                (g.responsive || c.data("sbi_imgLiquid_oldProcessed")) && c.data("sbi_imgLiquid_settings") && (g = c.data("sbi_imgLiquid_settings"), u.actualSize = u.get(0).offsetWidth + u.get(0).offsetHeight / 1e4, u.sizeOld && u.actualSize !== u.sizeOld && r(), u.sizeOld = u.actualSize, setTimeout(d, g.responsiveCheckTime));
                                            }function n() {
                                                c.data("sbi_imgLiquid_error", !0), u.addClass("sbi_imgLiquid_error"), g.onItemError && g.onItemError(t, u, c), l();
                                            }function s() {
                                                var i = {};if (a.settings.useDataHtmlAttr) {
                                                    var t = u.attr("data-sbi_imgLiquid-fill"),
                                                        e = u.attr("data-sbi_imgLiquid-horizontalAlign"),
                                                        o = u.attr("data-sbi_imgLiquid-verticalAlign");("true" === t || "false" === t) && (i.fill = Boolean("true" === t)), void 0 === e || "left" !== e && "center" !== e && "right" !== e && -1 === e.indexOf("%") || (i.horizontalAlign = e), void 0 === o || "top" !== o && "bottom" !== o && "center" !== o && -1 === o.indexOf("%") || (i.verticalAlign = o);
                                                }return sbi_imgLiquid.isIE && a.settings.ieFadeInDisabled && (i.fadeInTime = 0), i;
                                            }function r() {
                                                var i,
                                                    e,
                                                    a,
                                                    o,
                                                    d,
                                                    n,
                                                    s,
                                                    r,
                                                    m = 0,
                                                    h = 0,
                                                    f = u.width(),
                                                    v = u.height();void 0 === c.data("owidth") && c.data("owidth", c[0].width), void 0 === c.data("oheight") && c.data("oheight", c[0].height), g.fill === f / v >= c.data("owidth") / c.data("oheight") ? (i = "100%", e = "auto", a = Math.floor(f), o = Math.floor(f * (c.data("oheight") / c.data("owidth")))) : (i = "auto", e = "100%", a = Math.floor(v * (c.data("owidth") / c.data("oheight"))), o = Math.floor(v)), d = g.horizontalAlign.toLowerCase(), s = f - a, "left" === d && (h = 0), "center" === d && (h = .5 * s), "right" === d && (h = s), -1 !== d.indexOf("%") && (d = parseInt(d.replace("%", ""), 10), d > 0 && (h = s * d * .01)), n = g.verticalAlign.toLowerCase(), r = v - o, "left" === n && (m = 0), "center" === n && (m = .5 * r), "bottom" === n && (m = r), -1 !== n.indexOf("%") && (n = parseInt(n.replace("%", ""), 10), n > 0 && (m = r * n * .01)), g.hardPixels && (i = a, e = o), c.css({ width: i, height: e, "margin-left": Math.floor(h), "margin-top": Math.floor(m) }), c.data("sbi_imgLiquid_oldProcessed") || (c.fadeTo(g.fadeInTime, 1), c.data("sbi_imgLiquid_oldProcessed", !0), g.removeBoxBackground && u.css("background-image", "none"), u.addClass("sbi_imgLiquid_nobgSize"), u.addClass("sbi_imgLiquid_ready")), g.onItemFinish && g.onItemFinish(t, u, c), l();
                                            }function l() {
                                                t === a.length - 1 && a.settings.onFinish && a.settings.onFinish();
                                            }var g = a.settings,
                                                u = i(this),
                                                c = i("img:first", u);return c.length ? (c.data("sbi_imgLiquid_settings") ? (u.removeClass("sbi_imgLiquid_error").removeClass("sbi_imgLiquid_ready"), g = i.extend({}, c.data("sbi_imgLiquid_settings"), a.options)) : g = i.extend({}, a.settings, s()), c.data("sbi_imgLiquid_settings", g), g.onItemStart && g.onItemStart(t, u, c), void (sbi_imgLiquid.bgs_Available && g.useBackgroundSize ? e() : o())) : void n();
                                        });
                                    } });
                            }(jQuery);

                            // Use imagefill to set the images as backgrounds so they can be square
                            !function () {
                                var css = sbi_imgLiquid.injectCss,
                                    head = document.getElementsByTagName('head')[0],
                                    style = document.createElement('style');
                                style.type = 'text/css';
                                if (style.styleSheet) {
                                    style.styleSheet.cssText = css;
                                } else {
                                    style.appendChild(document.createTextNode(css));
                                }
                                head.appendChild(style);
                            }();
                            $self.find(".sbi_photo").sbi_imgLiquid({ fill: true });
                        } // End: ( imgRes !== 'thumbnail' ) check

                        //Only check the width once the resize event is over
                        var sbi_delay = function () {
                            var sbi_timer = 0;
                            return function (sbi_callback, sbi_ms) {
                                clearTimeout(sbi_timer);
                                sbi_timer = setTimeout(sbi_callback, sbi_ms);
                            };
                        }();

                        jQuery(window).resize(function () {
                            sbi_delay(function () {
                                sbiSetPhotoHeight();
                            }, 500);
                        });

                        //Resize image height
                        function sbiSetPhotoHeight() {

                            if (imgRes !== 'thumbnail') {
                                var sbi_photo_width = $self.find('.sbi_photo').eq(0).innerWidth();

                                //Figure out number of columns for either desktop or mobile
                                var sbi_num_cols = parseInt(cols);

                                if (!$self.hasClass('sbi_disable_mobile')) {
                                    var sbiWindowWidth = jQuery(window).width();
                                    if (sbiWindowWidth < 640 && parseInt(cols) > 2 && parseInt(cols) < 7) sbi_num_cols = 2;
                                    if (sbiWindowWidth < 640 && parseInt(cols) > 6 && parseInt(cols) < 11) sbi_num_cols = 4;
                                    if (sbiWindowWidth <= 480 && parseInt(cols) > 2) sbi_num_cols = 1;
                                }

                                //Figure out what the width should be using the number of cols
                                var sbi_photo_width_manual = $self.find('#sbi_images').width() / sbi_num_cols - feedOptions.imagepadding * 2;

                                //If the width is less than it should be then set it manually
                                if (sbi_photo_width <= sbi_photo_width_manual) sbi_photo_width = sbi_photo_width_manual;

                                $self.find('.sbi_photo').css('height', sbi_photo_width);
                            }
                        }
                        sbiSetPhotoHeight();

                        /* Detect when element becomes visible. Used for when the feed is initially hidden, in a tab for example. https://github.com/shaunbowe/jquery.visibilityChanged */
                        !function (i) {
                            var n = { callback: function () {}, runOnLoad: !0, frequency: 100, sbiPreviousVisibility: null },
                                c = {};c.sbiCheckVisibility = function (i, n) {
                                if (jQuery.contains(document, i[0])) {
                                    var e = n.sbiPreviousVisibility,
                                        t = i.is(":visible");n.sbiPreviousVisibility = t, null == e ? n.runOnLoad && n.callback(i, t) : e !== t && n.callback(i, t), setTimeout(function () {
                                        c.sbiCheckVisibility(i, n);
                                    }, n.frequency);
                                }
                            }, i.fn.sbiVisibilityChanged = function (e) {
                                var t = i.extend({}, n, e);return this.each(function () {
                                    c.sbiCheckVisibility(i(this), t);
                                });
                            };
                        }(jQuery);

                        //If the feed is initially hidden (in a tab for example) then check for when it becomes visible and set then set the height
                        jQuery(".sbi").filter(':hidden').sbiVisibilityChanged({
                            callback: function (element, visible) {
                                sbiSetPhotoHeight();
                            },
                            runOnLoad: false
                        });

                        //Fade photos on hover
                        jQuery('#sb_instagram .sbi_photo').each(function () {
                            jQuery(this).hover(function () {
                                jQuery(this).fadeTo(200, 0.85);
                            }, function () {
                                jQuery(this).stop().fadeTo(500, 1);
                            });
                        });

                        //Sort posts by date
                        //only sort the new posts that are loaded in, not the whole feed, otherwise some photos will switch positions due to dates
                        $self.find('#sbi_images .sbi_item.sbi_new').sort(function (a, b) {
                            var aComp = jQuery(a).data('date'),
                                bComp = jQuery(b).data('date');

                            if (sortby == 'none') {
                                //Order by date
                                return bComp - aComp;
                            } else {
                                //Randomize
                                return Math.round(Math.random()) - 0.5;
                            }
                        }).appendTo($self.find("#sbi_images"));

                        //Remove the new class after 500ms, once the sorting is done
                        setTimeout(function () {
                            jQuery('#sbi_images .sbi_item.sbi_new').removeClass('sbi_new');
                            //Reset the morePosts variable so we can check whether there are more posts every time the Load More button is clicked
                            morePosts = [];
                        }, 500);
                    }, // End 'after' function
                    error: function (data) {
                        var sbiErrorMsg = '',
                            sbiErrorDir = '';

                        if (data.indexOf('access_token') > -1) {
                            sbiErrorMsg += '<p><b>Error: Access Token is not valid</b><br /><span>This error message is only visible to WordPress admins</span>';
                            sbiErrorDir = "<p>There's an issue with the Instagram Access Token that you are using. Please obtain a new Access Token on the plugin's Settings page.";
                        } else if (data.indexOf('user does not exist') > -1) {
                            sbiErrorMsg += '<p><b>Error: The User ID does not exist</b><br /><span>This error is only visible to WordPress admins</span>';
                            sbiErrorDir = "<p>Please double check the Instagram User ID that you are using. To find your User ID simply enter your Instagram user name into this <a href='http://www.otzberg.net/iguserid/' target='_blank'>tool</a>.</p>";
                        }

                        //Add the error message to the page unless the user is displaying multiple ids or hashtags
                        if (looparray.length < 2) jQuery('#sb_instagram').empty().append('<p style="text-align: center;">Unable to show Instagram photos</p><div id="sbi_mod_error">' + sbiErrorMsg + sbiErrorDir + '</div>');
                    }
                });

                $loadBtn.click(function () {
                    userFeed.next();
                });

                userFeed.run();
            }); //End User ID array loop
        });
    }

    jQuery(document).ready(function () {
        sbi_init();
    });
} // end sbi_js_exists check
;'use strict';

jQuery('iframe[src*="youtube.com"]').wrap("<div class='flex-video widescreen'/>");
jQuery('iframe[src*="vimeo.com"]').wrap("<div class='flex-video widescreen vimeo'/>");
;"use strict";
;"use strict";

jQuery(document).foundation();
;'use strict';

// Joyride demo
$('#start-jr').on('click', function () {
  $(document).foundation('joyride', 'start');
});
;"use strict";
;'use strict';

;(function (window, document, undefined) {

    'use strict';

    // Cut the mustard

    var supports = 'querySelector' in document && 'addEventListener' in window;
    if (!supports) return;

    // Get all anchors
    var anchors = document.querySelectorAll('[href*="#"]');

    // Add smooth scroll to all anchors
    for (var i = 0, len = anchors.length; i < len; i++) {
        var url = new RegExp(window.location.hostname + window.location.pathname);
        if (!url.test(anchors[i].href)) continue;
        anchors[i].setAttribute('data-scroll', true);
    }

    // Initial smooth scroll (add your attributes as desired)
    smoothScroll.init();
})(window, document);
;'use strict';

$(window).bind(' load resize orientationChange ', function () {
  var footer = $("#footer-container");
  var pos = footer.position();
  var height = $(window).height();
  height = height - pos.top;
  height = height - footer.height() - 1;

  function stickyFooter() {
    footer.css({
      'margin-top': height + 'px'
    });
  }

  if (height > 0) {
    stickyFooter();
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndoYXQtaW5wdXQuanMiLCJmb3VuZGF0aW9uLmNvcmUuanMiLCJmb3VuZGF0aW9uLnV0aWwuYm94LmpzIiwiZm91bmRhdGlvbi51dGlsLmtleWJvYXJkLmpzIiwiZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnkuanMiLCJmb3VuZGF0aW9uLnV0aWwubW90aW9uLmpzIiwiZm91bmRhdGlvbi51dGlsLm5lc3QuanMiLCJmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlci5qcyIsImZvdW5kYXRpb24udXRpbC50b3VjaC5qcyIsImZvdW5kYXRpb24udXRpbC50cmlnZ2Vycy5qcyIsImZvdW5kYXRpb24uZHJvcGRvd24uanMiLCJmb3VuZGF0aW9uLmRyb3Bkb3duTWVudS5qcyIsImZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnUuanMiLCJmb3VuZGF0aW9uLnJlc3BvbnNpdmVUb2dnbGUuanMiLCJmb3VuZGF0aW9uLnJldmVhbC5qcyIsInZlZ2FzLmpzIiwiZmVhdGhlcmxpZ2h0LmpzIiwibWFzb25yeS5wa2dkLmpzIiwiaW1hZ2VzbG9hZGVkLnBrZ2QuanMiLCJzbW9vdGgtc2Nyb2xsLmpzIiwic2ItaW5zdGFncmFtLmpzIiwiZmxleC12aWRlby5qcyIsImZyb250cGFnZS1zbGlkZXIuanMiLCJpbml0LWZvdW5kYXRpb24uanMiLCJqb3lyaWRlLWRlbW8uanMiLCJvZmZDYW52YXMuanMiLCJzbW9vdGhzY3JvbGwuanMiLCJzdGlja3lmb290ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxDQUFDLENBQUMsVUFBUyxJQUFULEVBQWUsT0FBZixFQUF3QjtBQUN4QixNQUFJLE9BQU8sTUFBUCxLQUFrQixVQUFsQixJQUFnQyxPQUFPLEdBQVAsRUFBWTtBQUM5QyxXQUFPLEVBQVAsRUFBVyxZQUFXO0FBQ3BCLGFBQVEsU0FBUixDQURvQjtLQUFYLENBQVgsQ0FEOEM7R0FBaEQsTUFJTyxJQUFJLE9BQU8sT0FBUCxLQUFtQixRQUFuQixF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IiwiZmlsZSI6ImZvdW5kYXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyI7KGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gKGZhY3RvcnkoKSk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC53aGF0SW5wdXQgPSBmYWN0b3J5KCk7XG4gIH1cbn0gKHRoaXMsIGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cblxuICAvKlxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAgIHZhcmlhYmxlc1xuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAqL1xuXG4gIC8vIGFycmF5IG9mIGFjdGl2ZWx5IHByZXNzZWQga2V5c1xuICB2YXIgYWN0aXZlS2V5cyA9IFtdO1xuXG4gIC8vIGNhY2hlIGRvY3VtZW50LmJvZHlcbiAgdmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuXG4gIC8vIGJvb2xlYW46IHRydWUgaWYgdG91Y2ggYnVmZmVyIHRpbWVyIGlzIHJ1bm5pbmdcbiAgdmFyIGJ1ZmZlciA9IGZhbHNlO1xuXG4gIC8vIHRoZSBsYXN0IHVzZWQgaW5wdXQgdHlwZVxuICB2YXIgY3VycmVudElucHV0ID0gbnVsbDtcblxuICAvLyBhcnJheSBvZiBmb3JtIGVsZW1lbnRzIHRoYXQgdGFrZSBrZXlib2FyZCBpbnB1dFxuICB2YXIgZm9ybUlucHV0cyA9IFtcbiAgICAnaW5wdXQnLFxuICAgICdzZWxlY3QnLFxuICAgICd0ZXh0YXJlYSdcbiAgXTtcblxuICAvLyB1c2VyLXNldCBmbGFnIHRvIGFsbG93IHR5cGluZyBpbiBmb3JtIGZpZWxkcyB0byBiZSByZWNvcmRlZFxuICB2YXIgZm9ybVR5cGluZyA9IGJvZHkuaGFzQXR0cmlidXRlKCdkYXRhLXdoYXRpbnB1dC1mb3JtdHlwaW5nJyk7XG5cbiAgLy8gbWFwcGluZyBvZiBldmVudHMgdG8gaW5wdXQgdHlwZXNcbiAgdmFyIGlucHV0TWFwID0ge1xuICAgICdrZXlkb3duJzogJ2tleWJvYXJkJyxcbiAgICAnbW91c2Vkb3duJzogJ21vdXNlJyxcbiAgICAnbW91c2VlbnRlcic6ICdtb3VzZScsXG4gICAgJ3RvdWNoc3RhcnQnOiAndG91Y2gnLFxuICAgICdwb2ludGVyZG93bic6ICdwb2ludGVyJyxcbiAgICAnTVNQb2ludGVyRG93bic6ICdwb2ludGVyJ1xuICB9O1xuXG4gIC8vIGFycmF5IG9mIGFsbCB1c2VkIGlucHV0IHR5cGVzXG4gIHZhciBpbnB1dFR5cGVzID0gW107XG5cbiAgLy8gbWFwcGluZyBvZiBrZXkgY29kZXMgdG8gY29tbW9uIG5hbWVcbiAgdmFyIGtleU1hcCA9IHtcbiAgICA5OiAndGFiJyxcbiAgICAxMzogJ2VudGVyJyxcbiAgICAxNjogJ3NoaWZ0JyxcbiAgICAyNzogJ2VzYycsXG4gICAgMzI6ICdzcGFjZScsXG4gICAgMzc6ICdsZWZ0JyxcbiAgICAzODogJ3VwJyxcbiAgICAzOTogJ3JpZ2h0JyxcbiAgICA0MDogJ2Rvd24nXG4gIH07XG5cbiAgLy8gbWFwIG9mIElFIDEwIHBvaW50ZXIgZXZlbnRzXG4gIHZhciBwb2ludGVyTWFwID0ge1xuICAgIDI6ICd0b3VjaCcsXG4gICAgMzogJ3RvdWNoJywgLy8gdHJlYXQgcGVuIGxpa2UgdG91Y2hcbiAgICA0OiAnbW91c2UnXG4gIH07XG5cbiAgLy8gdG91Y2ggYnVmZmVyIHRpbWVyXG4gIHZhciB0aW1lcjtcblxuXG4gIC8qXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb25zXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICovXG5cbiAgZnVuY3Rpb24gYnVmZmVySW5wdXQoZXZlbnQpIHtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuXG4gICAgc2V0SW5wdXQoZXZlbnQpO1xuXG4gICAgYnVmZmVyID0gdHJ1ZTtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBidWZmZXIgPSBmYWxzZTtcbiAgICB9LCAxMDAwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGltbWVkaWF0ZUlucHV0KGV2ZW50KSB7XG4gICAgaWYgKCFidWZmZXIpIHNldElucHV0KGV2ZW50KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldElucHV0KGV2ZW50KSB7XG4gICAgdmFyIGV2ZW50S2V5ID0ga2V5KGV2ZW50KTtcbiAgICB2YXIgZXZlbnRUYXJnZXQgPSB0YXJnZXQoZXZlbnQpO1xuICAgIHZhciB2YWx1ZSA9IGlucHV0TWFwW2V2ZW50LnR5cGVdO1xuICAgIGlmICh2YWx1ZSA9PT0gJ3BvaW50ZXInKSB2YWx1ZSA9IHBvaW50ZXJUeXBlKGV2ZW50KTtcblxuICAgIGlmIChjdXJyZW50SW5wdXQgIT09IHZhbHVlKSB7XG4gICAgICBpZiAoXG4gICAgICAgIC8vIG9ubHkgaWYgdGhlIHVzZXIgZmxhZyBpc24ndCBzZXRcbiAgICAgICAgIWZvcm1UeXBpbmcgJiZcblxuICAgICAgICAvLyBvbmx5IGlmIGN1cnJlbnRJbnB1dCBoYXMgYSB2YWx1ZVxuICAgICAgICBjdXJyZW50SW5wdXQgJiZcblxuICAgICAgICAvLyBvbmx5IGlmIHRoZSBpbnB1dCBpcyBga2V5Ym9hcmRgXG4gICAgICAgIHZhbHVlID09PSAna2V5Ym9hcmQnICYmXG5cbiAgICAgICAgLy8gbm90IGlmIHRoZSBrZXkgaXMgYFRBQmBcbiAgICAgICAga2V5TWFwW2V2ZW50S2V5XSAhPT0gJ3RhYicgJiZcblxuICAgICAgICAvLyBvbmx5IGlmIHRoZSB0YXJnZXQgaXMgb25lIG9mIHRoZSBlbGVtZW50cyBpbiBgZm9ybUlucHV0c2BcbiAgICAgICAgZm9ybUlucHV0cy5pbmRleE9mKGV2ZW50VGFyZ2V0Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpID49IDBcbiAgICAgICkge1xuICAgICAgICAvLyBpZ25vcmUga2V5Ym9hcmQgdHlwaW5nIG9uIGZvcm0gZWxlbWVudHNcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN1cnJlbnRJbnB1dCA9IHZhbHVlO1xuICAgICAgICBib2R5LnNldEF0dHJpYnV0ZSgnZGF0YS13aGF0aW5wdXQnLCBjdXJyZW50SW5wdXQpO1xuXG4gICAgICAgIGlmIChpbnB1dFR5cGVzLmluZGV4T2YoY3VycmVudElucHV0KSA9PT0gLTEpIGlucHV0VHlwZXMucHVzaChjdXJyZW50SW5wdXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh2YWx1ZSA9PT0gJ2tleWJvYXJkJykgbG9nS2V5cyhldmVudEtleSk7XG4gIH1cblxuICBmdW5jdGlvbiBrZXkoZXZlbnQpIHtcbiAgICByZXR1cm4gKGV2ZW50LmtleUNvZGUpID8gZXZlbnQua2V5Q29kZSA6IGV2ZW50LndoaWNoO1xuICB9XG5cbiAgZnVuY3Rpb24gdGFyZ2V0KGV2ZW50KSB7XG4gICAgcmV0dXJuIGV2ZW50LnRhcmdldCB8fCBldmVudC5zcmNFbGVtZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gcG9pbnRlclR5cGUoZXZlbnQpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBldmVudC5wb2ludGVyVHlwZSA9PT0gJ251bWJlcicpID8gcG9pbnRlck1hcFtldmVudC5wb2ludGVyVHlwZV0gOiBldmVudC5wb2ludGVyVHlwZTtcbiAgfVxuXG4gIC8vIGtleWJvYXJkIGxvZ2dpbmdcbiAgZnVuY3Rpb24gbG9nS2V5cyhldmVudEtleSkge1xuICAgIGlmIChhY3RpdmVLZXlzLmluZGV4T2Yoa2V5TWFwW2V2ZW50S2V5XSkgPT09IC0xICYmIGtleU1hcFtldmVudEtleV0pIGFjdGl2ZUtleXMucHVzaChrZXlNYXBbZXZlbnRLZXldKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVuTG9nS2V5cyhldmVudCkge1xuICAgIHZhciBldmVudEtleSA9IGtleShldmVudCk7XG4gICAgdmFyIGFycmF5UG9zID0gYWN0aXZlS2V5cy5pbmRleE9mKGtleU1hcFtldmVudEtleV0pO1xuXG4gICAgaWYgKGFycmF5UG9zICE9PSAtMSkgYWN0aXZlS2V5cy5zcGxpY2UoYXJyYXlQb3MsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gYmluZEV2ZW50cygpIHtcblxuICAgIC8vIHBvaW50ZXIvbW91c2VcbiAgICB2YXIgbW91c2VFdmVudCA9ICdtb3VzZWRvd24nO1xuXG4gICAgaWYgKHdpbmRvdy5Qb2ludGVyRXZlbnQpIHtcbiAgICAgIG1vdXNlRXZlbnQgPSAncG9pbnRlcmRvd24nO1xuICAgIH0gZWxzZSBpZiAod2luZG93Lk1TUG9pbnRlckV2ZW50KSB7XG4gICAgICBtb3VzZUV2ZW50ID0gJ01TUG9pbnRlckRvd24nO1xuICAgIH1cblxuICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcihtb3VzZUV2ZW50LCBpbW1lZGlhdGVJbnB1dCk7XG4gICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgaW1tZWRpYXRlSW5wdXQpO1xuXG4gICAgLy8gdG91Y2hcbiAgICBpZiAoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSB7XG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBidWZmZXJJbnB1dCk7XG4gICAgfVxuXG4gICAgLy8ga2V5Ym9hcmRcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBpbW1lZGlhdGVJbnB1dCk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB1bkxvZ0tleXMpO1xuICB9XG5cblxuICAvKlxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAgIGluaXRcblxuICAgIGRvbid0IHN0YXJ0IHNjcmlwdCB1bmxlc3MgYnJvd3NlciBjdXRzIHRoZSBtdXN0YXJkLFxuICAgIGFsc28gcGFzc2VzIGlmIHBvbHlmaWxscyBhcmUgdXNlZFxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAqL1xuXG4gIGlmICgnYWRkRXZlbnRMaXN0ZW5lcicgaW4gd2luZG93ICYmIEFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gICAgYmluZEV2ZW50cygpO1xuICB9XG5cblxuICAvKlxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAgIGFwaVxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAqL1xuXG4gIHJldHVybiB7XG5cbiAgICAvLyByZXR1cm5zIHN0cmluZzogdGhlIGN1cnJlbnQgaW5wdXQgdHlwZVxuICAgIGFzazogZnVuY3Rpb24oKSB7IHJldHVybiBjdXJyZW50SW5wdXQ7IH0sXG5cbiAgICAvLyByZXR1cm5zIGFycmF5OiBjdXJyZW50bHkgcHJlc3NlZCBrZXlzXG4gICAga2V5czogZnVuY3Rpb24oKSB7IHJldHVybiBhY3RpdmVLZXlzOyB9LFxuXG4gICAgLy8gcmV0dXJucyBhcnJheTogYWxsIHRoZSBkZXRlY3RlZCBpbnB1dCB0eXBlc1xuICAgIHR5cGVzOiBmdW5jdGlvbigpIHsgcmV0dXJuIGlucHV0VHlwZXM7IH0sXG5cbiAgICAvLyBhY2NlcHRzIHN0cmluZzogbWFudWFsbHkgc2V0IHRoZSBpbnB1dCB0eXBlXG4gICAgc2V0OiBzZXRJbnB1dFxuICB9O1xuXG59KSk7XG4iLCIhZnVuY3Rpb24oJCkge1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEZPVU5EQVRJT05fVkVSU0lPTiA9ICc2LjIuMCc7XG5cbi8vIEdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuLy8gVGhpcyBpcyBhdHRhY2hlZCB0byB0aGUgd2luZG93LCBvciB1c2VkIGFzIGEgbW9kdWxlIGZvciBBTUQvQnJvd3NlcmlmeVxudmFyIEZvdW5kYXRpb24gPSB7XG4gIHZlcnNpb246IEZPVU5EQVRJT05fVkVSU0lPTixcblxuICAvKipcbiAgICogU3RvcmVzIGluaXRpYWxpemVkIHBsdWdpbnMuXG4gICAqL1xuICBfcGx1Z2luczoge30sXG5cbiAgLyoqXG4gICAqIFN0b3JlcyBnZW5lcmF0ZWQgdW5pcXVlIGlkcyBmb3IgcGx1Z2luIGluc3RhbmNlc1xuICAgKi9cbiAgX3V1aWRzOiBbXSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJvb2xlYW4gZm9yIFJUTCBzdXBwb3J0XG4gICAqL1xuICBydGw6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICQoJ2h0bWwnKS5hdHRyKCdkaXInKSA9PT0gJ3J0bCc7XG4gIH0sXG4gIC8qKlxuICAgKiBEZWZpbmVzIGEgRm91bmRhdGlvbiBwbHVnaW4sIGFkZGluZyBpdCB0byB0aGUgYEZvdW5kYXRpb25gIG5hbWVzcGFjZSBhbmQgdGhlIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplIHdoZW4gcmVmbG93aW5nLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBwbHVnaW4uXG4gICAqL1xuICBwbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSkge1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gYWRkaW5nIHRvIGdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuICAgIC8vIEV4YW1wbGVzOiBGb3VuZGF0aW9uLlJldmVhbCwgRm91bmRhdGlvbi5PZmZDYW52YXNcbiAgICB2YXIgY2xhc3NOYW1lID0gKG5hbWUgfHwgZnVuY3Rpb25OYW1lKHBsdWdpbikpO1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gc3RvcmluZyB0aGUgcGx1Z2luLCBhbHNvIHVzZWQgdG8gY3JlYXRlIHRoZSBpZGVudGlmeWluZyBkYXRhIGF0dHJpYnV0ZSBmb3IgdGhlIHBsdWdpblxuICAgIC8vIEV4YW1wbGVzOiBkYXRhLXJldmVhbCwgZGF0YS1vZmYtY2FudmFzXG4gICAgdmFyIGF0dHJOYW1lICA9IGh5cGhlbmF0ZShjbGFzc05hbWUpO1xuXG4gICAgLy8gQWRkIHRvIHRoZSBGb3VuZGF0aW9uIG9iamVjdCBhbmQgdGhlIHBsdWdpbnMgbGlzdCAoZm9yIHJlZmxvd2luZylcbiAgICB0aGlzLl9wbHVnaW5zW2F0dHJOYW1lXSA9IHRoaXNbY2xhc3NOYW1lXSA9IHBsdWdpbjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBQb3B1bGF0ZXMgdGhlIF91dWlkcyBhcnJheSB3aXRoIHBvaW50ZXJzIHRvIGVhY2ggaW5kaXZpZHVhbCBwbHVnaW4gaW5zdGFuY2UuXG4gICAqIEFkZHMgdGhlIGB6ZlBsdWdpbmAgZGF0YS1hdHRyaWJ1dGUgdG8gcHJvZ3JhbW1hdGljYWxseSBjcmVhdGVkIHBsdWdpbnMgdG8gYWxsb3cgdXNlIG9mICQoc2VsZWN0b3IpLmZvdW5kYXRpb24obWV0aG9kKSBjYWxscy5cbiAgICogQWxzbyBmaXJlcyB0aGUgaW5pdGlhbGl6YXRpb24gZXZlbnQgZm9yIGVhY2ggcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGVkaXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBwbHVnaW4sIHBhc3NlZCBhcyBhIGNhbWVsQ2FzZWQgc3RyaW5nLlxuICAgKiBAZmlyZXMgUGx1Z2luI2luaXRcbiAgICovXG4gIHJlZ2lzdGVyUGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpe1xuICAgIHZhciBwbHVnaW5OYW1lID0gbmFtZSA/IGh5cGhlbmF0ZShuYW1lKSA6IGZ1bmN0aW9uTmFtZShwbHVnaW4uY29uc3RydWN0b3IpLnRvTG93ZXJDYXNlKCk7XG4gICAgcGx1Z2luLnV1aWQgPSB0aGlzLkdldFlvRGlnaXRzKDYsIHBsdWdpbk5hbWUpO1xuXG4gICAgaWYoIXBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKSl7IHBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gLCBwbHVnaW4udXVpZCk7IH1cbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykpeyBwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nLCBwbHVnaW4pOyB9XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBpbml0aWFsaXplZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2luaXRcbiAgICAgICAgICAgKi9cbiAgICBwbHVnaW4uJGVsZW1lbnQudHJpZ2dlcihgaW5pdC56Zi4ke3BsdWdpbk5hbWV9YCk7XG5cbiAgICB0aGlzLl91dWlkcy5wdXNoKHBsdWdpbi51dWlkKTtcblxuICAgIHJldHVybjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBSZW1vdmVzIHRoZSBwbHVnaW5zIHV1aWQgZnJvbSB0aGUgX3V1aWRzIGFycmF5LlxuICAgKiBSZW1vdmVzIHRoZSB6ZlBsdWdpbiBkYXRhIGF0dHJpYnV0ZSwgYXMgd2VsbCBhcyB0aGUgZGF0YS1wbHVnaW4tbmFtZSBhdHRyaWJ1dGUuXG4gICAqIEFsc28gZmlyZXMgdGhlIGRlc3Ryb3llZCBldmVudCBmb3IgdGhlIHBsdWdpbiwgY29uc29saWRhdGluZyByZXBlZGl0aXZlIGNvZGUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBhbiBpbnN0YW5jZSBvZiBhIHBsdWdpbiwgdXN1YWxseSBgdGhpc2AgaW4gY29udGV4dC5cbiAgICogQGZpcmVzIFBsdWdpbiNkZXN0cm95ZWRcbiAgICovXG4gIHVucmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbil7XG4gICAgdmFyIHBsdWdpbk5hbWUgPSBoeXBoZW5hdGUoZnVuY3Rpb25OYW1lKHBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicpLmNvbnN0cnVjdG9yKSk7XG5cbiAgICB0aGlzLl91dWlkcy5zcGxpY2UodGhpcy5fdXVpZHMuaW5kZXhPZihwbHVnaW4udXVpZCksIDEpO1xuICAgIHBsdWdpbi4kZWxlbWVudC5yZW1vdmVBdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKS5yZW1vdmVEYXRhKCd6ZlBsdWdpbicpXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBiZWVuIGRlc3Ryb3llZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2Rlc3Ryb3llZFxuICAgICAgICAgICAqL1xuICAgICAgICAgIC50cmlnZ2VyKGBkZXN0cm95ZWQuemYuJHtwbHVnaW5OYW1lfWApO1xuICAgIGZvcih2YXIgcHJvcCBpbiBwbHVnaW4pe1xuICAgICAgcGx1Z2luW3Byb3BdID0gbnVsbDsvL2NsZWFuIHVwIHNjcmlwdCB0byBwcmVwIGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgfVxuICAgIHJldHVybjtcbiAgfSxcblxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIENhdXNlcyBvbmUgb3IgbW9yZSBhY3RpdmUgcGx1Z2lucyB0byByZS1pbml0aWFsaXplLCByZXNldHRpbmcgZXZlbnQgbGlzdGVuZXJzLCByZWNhbGN1bGF0aW5nIHBvc2l0aW9ucywgZXRjLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGx1Z2lucyAtIG9wdGlvbmFsIHN0cmluZyBvZiBhbiBpbmRpdmlkdWFsIHBsdWdpbiBrZXksIGF0dGFpbmVkIGJ5IGNhbGxpbmcgYCQoZWxlbWVudCkuZGF0YSgncGx1Z2luTmFtZScpYCwgb3Igc3RyaW5nIG9mIGEgcGx1Z2luIGNsYXNzIGkuZS4gYCdkcm9wZG93bidgXG4gICAqIEBkZWZhdWx0IElmIG5vIGFyZ3VtZW50IGlzIHBhc3NlZCwgcmVmbG93IGFsbCBjdXJyZW50bHkgYWN0aXZlIHBsdWdpbnMuXG4gICAqL1xuICAgcmVJbml0OiBmdW5jdGlvbihwbHVnaW5zKXtcbiAgICAgdmFyIGlzSlEgPSBwbHVnaW5zIGluc3RhbmNlb2YgJDtcbiAgICAgdHJ5e1xuICAgICAgIGlmKGlzSlEpe1xuICAgICAgICAgcGx1Z2lucy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICQodGhpcykuZGF0YSgnemZQbHVnaW4nKS5faW5pdCgpO1xuICAgICAgICAgfSk7XG4gICAgICAgfWVsc2V7XG4gICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBwbHVnaW5zLFxuICAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgZm5zID0ge1xuICAgICAgICAgICAnb2JqZWN0JzogZnVuY3Rpb24ocGxncyl7XG4gICAgICAgICAgICAgcGxncy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuICAgICAgICAgICAgICAgcCA9IGh5cGhlbmF0ZShwKTtcbiAgICAgICAgICAgICAgICQoJ1tkYXRhLScrIHAgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgJ3N0cmluZyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgcGx1Z2lucyA9IGh5cGhlbmF0ZShwbHVnaW5zKTtcbiAgICAgICAgICAgICAkKCdbZGF0YS0nKyBwbHVnaW5zICsnXScpLmZvdW5kYXRpb24oJ19pbml0Jyk7XG4gICAgICAgICAgIH0sXG4gICAgICAgICAgICd1bmRlZmluZWQnOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgIHRoaXNbJ29iamVjdCddKE9iamVjdC5rZXlzKF90aGlzLl9wbHVnaW5zKSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH07XG4gICAgICAgICBmbnNbdHlwZV0ocGx1Z2lucyk7XG4gICAgICAgfVxuICAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgIH1maW5hbGx5e1xuICAgICAgIHJldHVybiBwbHVnaW5zO1xuICAgICB9XG4gICB9LFxuXG4gIC8qKlxuICAgKiByZXR1cm5zIGEgcmFuZG9tIGJhc2UtMzYgdWlkIHdpdGggbmFtZXNwYWNpbmdcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggLSBudW1iZXIgb2YgcmFuZG9tIGJhc2UtMzYgZGlnaXRzIGRlc2lyZWQuIEluY3JlYXNlIGZvciBtb3JlIHJhbmRvbSBzdHJpbmdzLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIC0gbmFtZSBvZiBwbHVnaW4gdG8gYmUgaW5jb3Jwb3JhdGVkIGluIHVpZCwgb3B0aW9uYWwuXG4gICAqIEBkZWZhdWx0IHtTdHJpbmd9ICcnIC0gaWYgbm8gcGx1Z2luIG5hbWUgaXMgcHJvdmlkZWQsIG5vdGhpbmcgaXMgYXBwZW5kZWQgdG8gdGhlIHVpZC5cbiAgICogQHJldHVybnMge1N0cmluZ30gLSB1bmlxdWUgaWRcbiAgICovXG4gIEdldFlvRGlnaXRzOiBmdW5jdGlvbihsZW5ndGgsIG5hbWVzcGFjZSl7XG4gICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDY7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoKE1hdGgucG93KDM2LCBsZW5ndGggKyAxKSAtIE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygzNiwgbGVuZ3RoKSkpLnRvU3RyaW5nKDM2KS5zbGljZSgxKSArIChuYW1lc3BhY2UgPyBgLSR7bmFtZXNwYWNlfWAgOiAnJyk7XG4gIH0sXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHBsdWdpbnMgb24gYW55IGVsZW1lbnRzIHdpdGhpbiBgZWxlbWAgKGFuZCBgZWxlbWAgaXRzZWxmKSB0aGF0IGFyZW4ndCBhbHJlYWR5IGluaXRpYWxpemVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbSAtIGpRdWVyeSBvYmplY3QgY29udGFpbmluZyB0aGUgZWxlbWVudCB0byBjaGVjayBpbnNpZGUuIEFsc28gY2hlY2tzIHRoZSBlbGVtZW50IGl0c2VsZiwgdW5sZXNzIGl0J3MgdGhlIGBkb2N1bWVudGAgb2JqZWN0LlxuICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gcGx1Z2lucyAtIEEgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUuIExlYXZlIHRoaXMgb3V0IHRvIGluaXRpYWxpemUgZXZlcnl0aGluZy5cbiAgICovXG4gIHJlZmxvdzogZnVuY3Rpb24oZWxlbSwgcGx1Z2lucykge1xuXG4gICAgLy8gSWYgcGx1Z2lucyBpcyB1bmRlZmluZWQsIGp1c3QgZ3JhYiBldmVyeXRoaW5nXG4gICAgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcGx1Z2lucyA9IE9iamVjdC5rZXlzKHRoaXMuX3BsdWdpbnMpO1xuICAgIH1cbiAgICAvLyBJZiBwbHVnaW5zIGlzIGEgc3RyaW5nLCBjb252ZXJ0IGl0IHRvIGFuIGFycmF5IHdpdGggb25lIGl0ZW1cbiAgICBlbHNlIGlmICh0eXBlb2YgcGx1Z2lucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBsdWdpbnMgPSBbcGx1Z2luc107XG4gICAgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHBsdWdpblxuICAgICQuZWFjaChwbHVnaW5zLCBmdW5jdGlvbihpLCBuYW1lKSB7XG4gICAgICAvLyBHZXQgdGhlIGN1cnJlbnQgcGx1Z2luXG4gICAgICB2YXIgcGx1Z2luID0gX3RoaXMuX3BsdWdpbnNbbmFtZV07XG5cbiAgICAgIC8vIExvY2FsaXplIHRoZSBzZWFyY2ggdG8gYWxsIGVsZW1lbnRzIGluc2lkZSBlbGVtLCBhcyB3ZWxsIGFzIGVsZW0gaXRzZWxmLCB1bmxlc3MgZWxlbSA9PT0gZG9jdW1lbnRcbiAgICAgIHZhciAkZWxlbSA9ICQoZWxlbSkuZmluZCgnW2RhdGEtJytuYW1lKyddJykuYWRkQmFjaygnW2RhdGEtJytuYW1lKyddJyk7XG5cbiAgICAgIC8vIEZvciBlYWNoIHBsdWdpbiBmb3VuZCwgaW5pdGlhbGl6ZSBpdFxuICAgICAgJGVsZW0uZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRlbCA9ICQodGhpcyksXG4gICAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgIC8vIERvbid0IGRvdWJsZS1kaXAgb24gcGx1Z2luc1xuICAgICAgICBpZiAoJGVsLmRhdGEoJ3pmUGx1Z2luJykpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJUcmllZCB0byBpbml0aWFsaXplIFwiK25hbWUrXCIgb24gYW4gZWxlbWVudCB0aGF0IGFscmVhZHkgaGFzIGEgRm91bmRhdGlvbiBwbHVnaW4uXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCRlbC5hdHRyKCdkYXRhLW9wdGlvbnMnKSl7XG4gICAgICAgICAgdmFyIHRoaW5nID0gJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpLnNwbGl0KCc7JykuZm9yRWFjaChmdW5jdGlvbihlLCBpKXtcbiAgICAgICAgICAgIHZhciBvcHQgPSBlLnNwbGl0KCc6JykubWFwKGZ1bmN0aW9uKGVsKXsgcmV0dXJuIGVsLnRyaW0oKTsgfSk7XG4gICAgICAgICAgICBpZihvcHRbMF0pIG9wdHNbb3B0WzBdXSA9IHBhcnNlVmFsdWUob3B0WzFdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0cnl7XG4gICAgICAgICAgJGVsLmRhdGEoJ3pmUGx1Z2luJywgbmV3IHBsdWdpbigkKHRoaXMpLCBvcHRzKSk7XG4gICAgICAgIH1jYXRjaChlcil7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcik7XG4gICAgICAgIH1maW5hbGx5e1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG4gIGdldEZuTmFtZTogZnVuY3Rpb25OYW1lLFxuICB0cmFuc2l0aW9uZW5kOiBmdW5jdGlvbigkZWxlbSl7XG4gICAgdmFyIHRyYW5zaXRpb25zID0ge1xuICAgICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgJ09UcmFuc2l0aW9uJzogJ290cmFuc2l0aW9uZW5kJ1xuICAgIH07XG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgZW5kO1xuXG4gICAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucyl7XG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbdF0gIT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgZW5kID0gdHJhbnNpdGlvbnNbdF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmKGVuZCl7XG4gICAgICByZXR1cm4gZW5kO1xuICAgIH1lbHNle1xuICAgICAgZW5kID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAkZWxlbS50cmlnZ2VySGFuZGxlcigndHJhbnNpdGlvbmVuZCcsIFskZWxlbV0pO1xuICAgICAgfSwgMSk7XG4gICAgICByZXR1cm4gJ3RyYW5zaXRpb25lbmQnO1xuICAgIH1cbiAgfVxufTtcblxuRm91bmRhdGlvbi51dGlsID0ge1xuICAvKipcbiAgICogRnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgZGVib3VuY2UgZWZmZWN0IHRvIGEgZnVuY3Rpb24gY2FsbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgLSBGdW5jdGlvbiB0byBiZSBjYWxsZWQgYXQgZW5kIG9mIHRpbWVvdXQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSAtIFRpbWUgaW4gbXMgdG8gZGVsYXkgdGhlIGNhbGwgb2YgYGZ1bmNgLlxuICAgKiBAcmV0dXJucyBmdW5jdGlvblxuICAgKi9cbiAgdGhyb3R0bGU6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSkge1xuICAgIHZhciB0aW1lciA9IG51bGw7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgICBpZiAodGltZXIgPT09IG51bGwpIHtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn07XG5cbi8vIFRPRE86IGNvbnNpZGVyIG5vdCBtYWtpbmcgdGhpcyBhIGpRdWVyeSBmdW5jdGlvblxuLy8gVE9ETzogbmVlZCB3YXkgdG8gcmVmbG93IHZzLiByZS1pbml0aWFsaXplXG4vKipcbiAqIFRoZSBGb3VuZGF0aW9uIGpRdWVyeSBtZXRob2QuXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gbWV0aG9kIC0gQW4gYWN0aW9uIHRvIHBlcmZvcm0gb24gdGhlIGN1cnJlbnQgalF1ZXJ5IG9iamVjdC5cbiAqL1xudmFyIGZvdW5kYXRpb24gPSBmdW5jdGlvbihtZXRob2QpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgbWV0aG9kLFxuICAgICAgJG1ldGEgPSAkKCdtZXRhLmZvdW5kYXRpb24tbXEnKSxcbiAgICAgICRub0pTID0gJCgnLm5vLWpzJyk7XG5cbiAgaWYoISRtZXRhLmxlbmd0aCl7XG4gICAgJCgnPG1ldGEgY2xhc3M9XCJmb3VuZGF0aW9uLW1xXCI+JykuYXBwZW5kVG8oZG9jdW1lbnQuaGVhZCk7XG4gIH1cbiAgaWYoJG5vSlMubGVuZ3RoKXtcbiAgICAkbm9KUy5yZW1vdmVDbGFzcygnbm8tanMnKTtcbiAgfVxuXG4gIGlmKHR5cGUgPT09ICd1bmRlZmluZWQnKXsvL25lZWRzIHRvIGluaXRpYWxpemUgdGhlIEZvdW5kYXRpb24gb2JqZWN0LCBvciBhbiBpbmRpdmlkdWFsIHBsdWdpbi5cbiAgICBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuX2luaXQoKTtcbiAgICBGb3VuZGF0aW9uLnJlZmxvdyh0aGlzKTtcbiAgfWVsc2UgaWYodHlwZSA9PT0gJ3N0cmluZycpey8vYW4gaW5kaXZpZHVhbCBtZXRob2QgdG8gaW52b2tlIG9uIGEgcGx1Z2luIG9yIGdyb3VwIG9mIHBsdWdpbnNcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7Ly9jb2xsZWN0IGFsbCB0aGUgYXJndW1lbnRzLCBpZiBuZWNlc3NhcnlcbiAgICB2YXIgcGx1Z0NsYXNzID0gdGhpcy5kYXRhKCd6ZlBsdWdpbicpOy8vZGV0ZXJtaW5lIHRoZSBjbGFzcyBvZiBwbHVnaW5cblxuICAgIGlmKHBsdWdDbGFzcyAhPT0gdW5kZWZpbmVkICYmIHBsdWdDbGFzc1ttZXRob2RdICE9PSB1bmRlZmluZWQpey8vbWFrZSBzdXJlIGJvdGggdGhlIGNsYXNzIGFuZCBtZXRob2QgZXhpc3RcbiAgICAgIGlmKHRoaXMubGVuZ3RoID09PSAxKXsvL2lmIHRoZXJlJ3Mgb25seSBvbmUsIGNhbGwgaXQgZGlyZWN0bHkuXG4gICAgICAgICAgcGx1Z0NsYXNzW21ldGhvZF0uYXBwbHkocGx1Z0NsYXNzLCBhcmdzKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSwgZWwpey8vb3RoZXJ3aXNlIGxvb3AgdGhyb3VnaCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gYW5kIGludm9rZSB0aGUgbWV0aG9kIG9uIGVhY2hcbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseSgkKGVsKS5kYXRhKCd6ZlBsdWdpbicpLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfWVsc2V7Ly9lcnJvciBmb3Igbm8gY2xhc3Mgb3Igbm8gbWV0aG9kXG4gICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJXZSdyZSBzb3JyeSwgJ1wiICsgbWV0aG9kICsgXCInIGlzIG5vdCBhbiBhdmFpbGFibGUgbWV0aG9kIGZvciBcIiArIChwbHVnQ2xhc3MgPyBmdW5jdGlvbk5hbWUocGx1Z0NsYXNzKSA6ICd0aGlzIGVsZW1lbnQnKSArICcuJyk7XG4gICAgfVxuICB9ZWxzZXsvL2Vycm9yIGZvciBpbnZhbGlkIGFyZ3VtZW50IHR5cGVcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBXZSdyZSBzb3JyeSwgJHt0eXBlfSBpcyBub3QgYSB2YWxpZCBwYXJhbWV0ZXIuIFlvdSBtdXN0IHVzZSBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1ldGhvZCB5b3Ugd2lzaCB0byBpbnZva2UuYCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG53aW5kb3cuRm91bmRhdGlvbiA9IEZvdW5kYXRpb247XG4kLmZuLmZvdW5kYXRpb24gPSBmb3VuZGF0aW9uO1xuXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4oZnVuY3Rpb24oKSB7XG4gIGlmICghRGF0ZS5ub3cgfHwgIXdpbmRvdy5EYXRlLm5vdylcbiAgICB3aW5kb3cuRGF0ZS5ub3cgPSBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG5cbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKytpKSB7XG4gICAgICB2YXIgdnAgPSB2ZW5kb3JzW2ldO1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSAod2luZG93W3ZwKydDYW5jZWxBbmltYXRpb25GcmFtZSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3dbdnArJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddKTtcbiAgfVxuICBpZiAoL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxuICAgIHx8ICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8ICF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGxhc3RUaW1lID0gbmV4dFRpbWUpOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VGltZSAtIG5vdyk7XG4gICAgfTtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjbGVhclRpbWVvdXQ7XG4gIH1cbiAgLyoqXG4gICAqIFBvbHlmaWxsIGZvciBwZXJmb3JtYW5jZS5ub3csIHJlcXVpcmVkIGJ5IHJBRlxuICAgKi9cbiAgaWYoIXdpbmRvdy5wZXJmb3JtYW5jZSB8fCAhd2luZG93LnBlcmZvcm1hbmNlLm5vdyl7XG4gICAgd2luZG93LnBlcmZvcm1hbmNlID0ge1xuICAgICAgc3RhcnQ6IERhdGUubm93KCksXG4gICAgICBub3c6IGZ1bmN0aW9uKCl7IHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGFydDsgfVxuICAgIH07XG4gIH1cbn0pKCk7XG5pZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24ob1RoaXMpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcbiAgICB9XG5cbiAgICB2YXIgYUFyZ3MgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXG4gICAgICAgIGZUb0JpbmQgPSB0aGlzLFxuICAgICAgICBmTk9QICAgID0gZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgZkJvdW5kICA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXG4gICAgICAgICAgICAgICAgID8gdGhpc1xuICAgICAgICAgICAgICAgICA6IG9UaGlzLFxuICAgICAgICAgICAgICAgICBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9O1xuXG4gICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XG4gICAgICAvLyBuYXRpdmUgZnVuY3Rpb25zIGRvbid0IGhhdmUgYSBwcm90b3R5cGVcbiAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgfVxuICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xuXG4gICAgcmV0dXJuIGZCb3VuZDtcbiAgfTtcbn1cbi8vIFBvbHlmaWxsIHRvIGdldCB0aGUgbmFtZSBvZiBhIGZ1bmN0aW9uIGluIElFOVxuZnVuY3Rpb24gZnVuY3Rpb25OYW1lKGZuKSB7XG4gIGlmIChGdW5jdGlvbi5wcm90b3R5cGUubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb25cXHMoW14oXXsxLH0pXFwoLztcbiAgICB2YXIgcmVzdWx0cyA9IChmdW5jTmFtZVJlZ2V4KS5leGVjKChmbikudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoID4gMSkgPyByZXN1bHRzWzFdLnRyaW0oKSA6IFwiXCI7XG4gIH1cbiAgZWxzZSBpZiAoZm4ucHJvdG90eXBlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm4uY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gZm4ucHJvdG90eXBlLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbn1cbmZ1bmN0aW9uIHBhcnNlVmFsdWUoc3RyKXtcbiAgaWYoL3RydWUvLnRlc3Qoc3RyKSkgcmV0dXJuIHRydWU7XG4gIGVsc2UgaWYoL2ZhbHNlLy50ZXN0KHN0cikpIHJldHVybiBmYWxzZTtcbiAgZWxzZSBpZighaXNOYU4oc3RyICogMSkpIHJldHVybiBwYXJzZUZsb2F0KHN0cik7XG4gIHJldHVybiBzdHI7XG59XG4vLyBDb252ZXJ0IFBhc2NhbENhc2UgdG8ga2ViYWItY2FzZVxuLy8gVGhhbmsgeW91OiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS84OTU1NTgwXG5mdW5jdGlvbiBoeXBoZW5hdGUoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbn1cblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5Gb3VuZGF0aW9uLkJveCA9IHtcbiAgSW1Ob3RUb3VjaGluZ1lvdTogSW1Ob3RUb3VjaGluZ1lvdSxcbiAgR2V0RGltZW5zaW9uczogR2V0RGltZW5zaW9ucyxcbiAgR2V0T2Zmc2V0czogR2V0T2Zmc2V0c1xufVxuXG4vKipcbiAqIENvbXBhcmVzIHRoZSBkaW1lbnNpb25zIG9mIGFuIGVsZW1lbnQgdG8gYSBjb250YWluZXIgYW5kIGRldGVybWluZXMgY29sbGlzaW9uIGV2ZW50cyB3aXRoIGNvbnRhaW5lci5cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHRlc3QgZm9yIGNvbGxpc2lvbnMuXG4gKiBAcGFyYW0ge2pRdWVyeX0gcGFyZW50IC0galF1ZXJ5IG9iamVjdCB0byB1c2UgYXMgYm91bmRpbmcgY29udGFpbmVyLlxuICogQHBhcmFtIHtCb29sZWFufSBsck9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayBsZWZ0IGFuZCByaWdodCB2YWx1ZXMgb25seS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdGJPbmx5IC0gc2V0IHRvIHRydWUgdG8gY2hlY2sgdG9wIGFuZCBib3R0b20gdmFsdWVzIG9ubHkuXG4gKiBAZGVmYXVsdCBpZiBubyBwYXJlbnQgb2JqZWN0IHBhc3NlZCwgZGV0ZWN0cyBjb2xsaXNpb25zIHdpdGggYHdpbmRvd2AuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSB0cnVlIGlmIGNvbGxpc2lvbiBmcmVlLCBmYWxzZSBpZiBhIGNvbGxpc2lvbiBpbiBhbnkgZGlyZWN0aW9uLlxuICovXG5mdW5jdGlvbiBJbU5vdFRvdWNoaW5nWW91KGVsZW1lbnQsIHBhcmVudCwgbHJPbmx5LCB0Yk9ubHkpIHtcbiAgdmFyIGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgdG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0O1xuXG4gIGlmIChwYXJlbnQpIHtcbiAgICB2YXIgcGFyRGltcyA9IEdldERpbWVuc2lvbnMocGFyZW50KTtcblxuICAgIGJvdHRvbSA9IChlbGVEaW1zLm9mZnNldC50b3AgKyBlbGVEaW1zLmhlaWdodCA8PSBwYXJEaW1zLmhlaWdodCArIHBhckRpbXMub2Zmc2V0LnRvcCk7XG4gICAgdG9wICAgID0gKGVsZURpbXMub2Zmc2V0LnRvcCA+PSBwYXJEaW1zLm9mZnNldC50b3ApO1xuICAgIGxlZnQgICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ID49IHBhckRpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBwYXJEaW1zLndpZHRoKTtcbiAgfVxuICBlbHNlIHtcbiAgICBib3R0b20gPSAoZWxlRGltcy5vZmZzZXQudG9wICsgZWxlRGltcy5oZWlnaHQgPD0gZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCArIGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBlbGVEaW1zLndpbmRvd0RpbXMud2lkdGgpO1xuICB9XG5cbiAgdmFyIGFsbERpcnMgPSBbYm90dG9tLCB0b3AsIGxlZnQsIHJpZ2h0XTtcblxuICBpZiAobHJPbmx5KSB7XG4gICAgcmV0dXJuIGxlZnQgPT09IHJpZ2h0ID09PSB0cnVlO1xuICB9XG5cbiAgaWYgKHRiT25seSkge1xuICAgIHJldHVybiB0b3AgPT09IGJvdHRvbSA9PT0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBhbGxEaXJzLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbn07XG5cbi8qKlxuICogVXNlcyBuYXRpdmUgbWV0aG9kcyB0byByZXR1cm4gYW4gb2JqZWN0IG9mIGRpbWVuc2lvbiB2YWx1ZXMuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5IHx8IEhUTUx9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IG9yIERPTSBlbGVtZW50IGZvciB3aGljaCB0byBnZXQgdGhlIGRpbWVuc2lvbnMuIENhbiBiZSBhbnkgZWxlbWVudCBvdGhlciB0aGF0IGRvY3VtZW50IG9yIHdpbmRvdy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbmVzdGVkIG9iamVjdCBvZiBpbnRlZ2VyIHBpeGVsIHZhbHVlc1xuICogVE9ETyAtIGlmIGVsZW1lbnQgaXMgd2luZG93LCByZXR1cm4gb25seSB0aG9zZSB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIEdldERpbWVuc2lvbnMoZWxlbSwgdGVzdCl7XG4gIGVsZW0gPSBlbGVtLmxlbmd0aCA/IGVsZW1bMF0gOiBlbGVtO1xuXG4gIGlmIChlbGVtID09PSB3aW5kb3cgfHwgZWxlbSA9PT0gZG9jdW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJJ20gc29ycnksIERhdmUuIEknbSBhZnJhaWQgSSBjYW4ndCBkbyB0aGF0LlwiKTtcbiAgfVxuXG4gIHZhciByZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHBhclJlY3QgPSBlbGVtLnBhcmVudE5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB3aW5SZWN0ID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHdpblkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG4gICAgICB3aW5YID0gd2luZG93LnBhZ2VYT2Zmc2V0O1xuXG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcbiAgICBvZmZzZXQ6IHtcbiAgICAgIHRvcDogcmVjdC50b3AgKyB3aW5ZLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgd2luWFxuICAgIH0sXG4gICAgcGFyZW50RGltczoge1xuICAgICAgd2lkdGg6IHBhclJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHBhclJlY3QuaGVpZ2h0LFxuICAgICAgb2Zmc2V0OiB7XG4gICAgICAgIHRvcDogcGFyUmVjdC50b3AgKyB3aW5ZLFxuICAgICAgICBsZWZ0OiBwYXJSZWN0LmxlZnQgKyB3aW5YXG4gICAgICB9XG4gICAgfSxcbiAgICB3aW5kb3dEaW1zOiB7XG4gICAgICB3aWR0aDogd2luUmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogd2luUmVjdC5oZWlnaHQsXG4gICAgICBvZmZzZXQ6IHtcbiAgICAgICAgdG9wOiB3aW5ZLFxuICAgICAgICBsZWZ0OiB3aW5YXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBvYmplY3Qgb2YgdG9wIGFuZCBsZWZ0IGludGVnZXIgcGl4ZWwgdmFsdWVzIGZvciBkeW5hbWljYWxseSByZW5kZXJlZCBlbGVtZW50cyxcbiAqIHN1Y2ggYXM6IFRvb2x0aXAsIFJldmVhbCwgYW5kIERyb3Bkb3duXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcG9zaXRpb25lZC5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBhbmNob3IgLSBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZWxlbWVudCdzIGFuY2hvciBwb2ludC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIGEgc3RyaW5nIHJlbGF0aW5nIHRvIHRoZSBkZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50LCByZWxhdGl2ZSB0byBpdCdzIGFuY2hvclxuICogQHBhcmFtIHtOdW1iZXJ9IHZPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgdmVydGljYWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBoT2Zmc2V0IC0gaW50ZWdlciBwaXhlbCB2YWx1ZSBvZiBkZXNpcmVkIGhvcml6b250YWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNPdmVyZmxvdyAtIGlmIGEgY29sbGlzaW9uIGV2ZW50IGlzIGRldGVjdGVkLCBzZXRzIHRvIHRydWUgdG8gZGVmYXVsdCB0aGUgZWxlbWVudCB0byBmdWxsIHdpZHRoIC0gYW55IGRlc2lyZWQgb2Zmc2V0LlxuICogVE9ETyBhbHRlci9yZXdyaXRlIHRvIHdvcmsgd2l0aCBgZW1gIHZhbHVlcyBhcyB3ZWxsL2luc3RlYWQgb2YgcGl4ZWxzXG4gKi9cbmZ1bmN0aW9uIEdldE9mZnNldHMoZWxlbWVudCwgYW5jaG9yLCBwb3NpdGlvbiwgdk9mZnNldCwgaE9mZnNldCwgaXNPdmVyZmxvdykge1xuICB2YXIgJGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgJGFuY2hvckRpbXMgPSBhbmNob3IgPyBHZXREaW1lbnNpb25zKGFuY2hvcikgOiBudWxsO1xuXG4gIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICBjYXNlICd0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0LFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciB0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgKCRhbmNob3JEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMiksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiBpc092ZXJmbG93ID8gaE9mZnNldCA6ICgoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciBsZWZ0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogKCRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAoJGFuY2hvckRpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgcmlnaHQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgKyAxLFxuICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0ICsgKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcbiAgICAgICAgdG9wOiAoJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgKCRlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyZXZlYWwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLSAkZWxlRGltcy53aWR0aCkgLyAyLFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICBjYXNlICdyZXZlYWwgZnVsbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0LFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6IChGb3VuZGF0aW9uLnJ0bCgpID8gJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAkZWxlRGltcy53aWR0aCArICRhbmNob3JEaW1zLndpZHRoIDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XG4gICAgICB9XG4gIH1cbn1cblxufShqUXVlcnkpO1xuIiwiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBUaGlzIHV0aWwgd2FzIGNyZWF0ZWQgYnkgTWFyaXVzIE9sYmVydHogKlxuICogUGxlYXNlIHRoYW5rIE1hcml1cyBvbiBHaXRIdWIgL293bGJlcnR6ICpcbiAqIG9yIHRoZSB3ZWIgaHR0cDovL3d3dy5tYXJpdXNvbGJlcnR6LmRlLyAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5jb25zdCBrZXlDb2RlcyA9IHtcbiAgOTogJ1RBQicsXG4gIDEzOiAnRU5URVInLFxuICAyNzogJ0VTQ0FQRScsXG4gIDMyOiAnU1BBQ0UnLFxuICAzNzogJ0FSUk9XX0xFRlQnLFxuICAzODogJ0FSUk9XX1VQJyxcbiAgMzk6ICdBUlJPV19SSUdIVCcsXG4gIDQwOiAnQVJST1dfRE9XTidcbn1cblxudmFyIGNvbW1hbmRzID0ge31cblxudmFyIEtleWJvYXJkID0ge1xuICBrZXlzOiBnZXRLZXlDb2RlcyhrZXlDb2RlcyksXG5cbiAgLyoqXG4gICAqIFBhcnNlcyB0aGUgKGtleWJvYXJkKSBldmVudCBhbmQgcmV0dXJucyBhIFN0cmluZyB0aGF0IHJlcHJlc2VudHMgaXRzIGtleVxuICAgKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXG4gICAqIEByZXR1cm4gU3RyaW5nIGtleSAtIFN0cmluZyB0aGF0IHJlcHJlc2VudHMgdGhlIGtleSBwcmVzc2VkXG4gICAqL1xuICBwYXJzZUtleShldmVudCkge1xuICAgIHZhciBrZXkgPSBrZXlDb2Rlc1tldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlXSB8fCBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LndoaWNoKS50b1VwcGVyQ2FzZSgpO1xuICAgIGlmIChldmVudC5zaGlmdEtleSkga2V5ID0gYFNISUZUXyR7a2V5fWA7XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIGtleSA9IGBDVFJMXyR7a2V5fWA7XG4gICAgaWYgKGV2ZW50LmFsdEtleSkga2V5ID0gYEFMVF8ke2tleX1gO1xuICAgIHJldHVybiBrZXk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIGdpdmVuIChrZXlib2FyZCkgZXZlbnRcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCdzIG5hbWUsIGUuZy4gU2xpZGVyIG9yIFJldmVhbFxuICAgKiBAcGFyYW0ge09iamVjdHN9IGZ1bmN0aW9ucyAtIGNvbGxlY3Rpb24gb2YgZnVuY3Rpb25zIHRoYXQgYXJlIHRvIGJlIGV4ZWN1dGVkXG4gICAqL1xuICBoYW5kbGVLZXkoZXZlbnQsIGNvbXBvbmVudCwgZnVuY3Rpb25zKSB7XG4gICAgdmFyIGNvbW1hbmRMaXN0ID0gY29tbWFuZHNbY29tcG9uZW50XSxcbiAgICAgIGtleUNvZGUgPSB0aGlzLnBhcnNlS2V5KGV2ZW50KSxcbiAgICAgIGNtZHMsXG4gICAgICBjb21tYW5kLFxuICAgICAgZm47XG5cbiAgICBpZiAoIWNvbW1hbmRMaXN0KSByZXR1cm4gY29uc29sZS53YXJuKCdDb21wb25lbnQgbm90IGRlZmluZWQhJyk7XG5cbiAgICBpZiAodHlwZW9mIGNvbW1hbmRMaXN0Lmx0ciA9PT0gJ3VuZGVmaW5lZCcpIHsgLy8gdGhpcyBjb21wb25lbnQgZG9lcyBub3QgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGx0ciBhbmQgcnRsXG4gICAgICAgIGNtZHMgPSBjb21tYW5kTGlzdDsgLy8gdXNlIHBsYWluIGxpc3RcbiAgICB9IGVsc2UgeyAvLyBtZXJnZSBsdHIgYW5kIHJ0bDogaWYgZG9jdW1lbnQgaXMgcnRsLCBydGwgb3ZlcndyaXRlcyBsdHIgYW5kIHZpY2UgdmVyc2FcbiAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QubHRyLCBjb21tYW5kTGlzdC5ydGwpO1xuXG4gICAgICAgIGVsc2UgY21kcyA9ICQuZXh0ZW5kKHt9LCBjb21tYW5kTGlzdC5ydGwsIGNvbW1hbmRMaXN0Lmx0cik7XG4gICAgfVxuICAgIGNvbW1hbmQgPSBjbWRzW2tleUNvZGVdO1xuXG4gICAgZm4gPSBmdW5jdGlvbnNbY29tbWFuZF07XG4gICAgaWYgKGZuICYmIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uICBpZiBleGlzdHNcbiAgICAgIGZuLmFwcGx5KCk7XG4gICAgICBpZiAoZnVuY3Rpb25zLmhhbmRsZWQgfHwgdHlwZW9mIGZ1bmN0aW9ucy5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgaGFuZGxlZFxuICAgICAgICAgIGZ1bmN0aW9ucy5oYW5kbGVkLmFwcGx5KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChmdW5jdGlvbnMudW5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMudW5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgbm90IGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMudW5oYW5kbGVkLmFwcGx5KCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBGaW5kcyBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGhpbiB0aGUgZ2l2ZW4gYCRlbGVtZW50YFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHNlYXJjaCB3aXRoaW5cbiAgICogQHJldHVybiB7alF1ZXJ5fSAkZm9jdXNhYmxlIC0gYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gYCRlbGVtZW50YFxuICAgKi9cbiAgZmluZEZvY3VzYWJsZSgkZWxlbWVudCkge1xuICAgIHJldHVybiAkZWxlbWVudC5maW5kKCdhW2hyZWZdLCBhcmVhW2hyZWZdLCBpbnB1dDpub3QoW2Rpc2FibGVkXSksIHNlbGVjdDpub3QoW2Rpc2FibGVkXSksIHRleHRhcmVhOm5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKSwgaWZyYW1lLCBvYmplY3QsIGVtYmVkLCAqW3RhYmluZGV4XSwgKltjb250ZW50ZWRpdGFibGVdJykuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEkKHRoaXMpLmlzKCc6dmlzaWJsZScpIHx8ICQodGhpcykuYXR0cigndGFiaW5kZXgnKSA8IDApIHsgcmV0dXJuIGZhbHNlOyB9IC8vb25seSBoYXZlIHZpc2libGUgZWxlbWVudHMgYW5kIHRob3NlIHRoYXQgaGF2ZSBhIHRhYmluZGV4IGdyZWF0ZXIgb3IgZXF1YWwgMFxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBuYW1lIG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudCAtIEZvdW5kYXRpb24gY29tcG9uZW50LCBlLmcuIFNsaWRlciBvciBSZXZlYWxcbiAgICogQHJldHVybiBTdHJpbmcgY29tcG9uZW50TmFtZVxuICAgKi9cblxuICByZWdpc3Rlcihjb21wb25lbnROYW1lLCBjbWRzKSB7XG4gICAgY29tbWFuZHNbY29tcG9uZW50TmFtZV0gPSBjbWRzO1xuICB9XG59XG5cbi8qXG4gKiBDb25zdGFudHMgZm9yIGVhc2llciBjb21wYXJpbmcuXG4gKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAqL1xuZnVuY3Rpb24gZ2V0S2V5Q29kZXMoa2NzKSB7XG4gIHZhciBrID0ge307XG4gIGZvciAodmFyIGtjIGluIGtjcykga1trY3Nba2NdXSA9IGtjc1trY107XG4gIHJldHVybiBrO1xufVxuXG5Gb3VuZGF0aW9uLktleWJvYXJkID0gS2V5Ym9hcmQ7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLy8gRGVmYXVsdCBzZXQgb2YgbWVkaWEgcXVlcmllc1xuY29uc3QgZGVmYXVsdFF1ZXJpZXMgPSB7XG4gICdkZWZhdWx0JyA6ICdvbmx5IHNjcmVlbicsXG4gIGxhbmRzY2FwZSA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcbiAgcG9ydHJhaXQgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpJyxcbiAgcmV0aW5hIDogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcbn07XG5cbnZhciBNZWRpYVF1ZXJ5ID0ge1xuICBxdWVyaWVzOiBbXSxcblxuICBjdXJyZW50OiAnJyxcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG1lZGlhIHF1ZXJ5IGhlbHBlciwgYnkgZXh0cmFjdGluZyB0aGUgYnJlYWtwb2ludCBsaXN0IGZyb20gdGhlIENTUyBhbmQgYWN0aXZhdGluZyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZXh0cmFjdGVkU3R5bGVzID0gJCgnLmZvdW5kYXRpb24tbXEnKS5jc3MoJ2ZvbnQtZmFtaWx5Jyk7XG4gICAgdmFyIG5hbWVkUXVlcmllcztcblxuICAgIG5hbWVkUXVlcmllcyA9IHBhcnNlU3R5bGVUb09iamVjdChleHRyYWN0ZWRTdHlsZXMpO1xuXG4gICAgZm9yICh2YXIga2V5IGluIG5hbWVkUXVlcmllcykge1xuICAgICAgc2VsZi5xdWVyaWVzLnB1c2goe1xuICAgICAgICBuYW1lOiBrZXksXG4gICAgICAgIHZhbHVlOiBgb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6ICR7bmFtZWRRdWVyaWVzW2tleV19KWBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuY3VycmVudCA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCk7XG5cbiAgICB0aGlzLl93YXRjaGVyKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIGlzIGF0IGxlYXN0IGFzIHdpZGUgYXMgYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBicmVha3BvaW50IG1hdGNoZXMsIGBmYWxzZWAgaWYgaXQncyBzbWFsbGVyLlxuICAgKi9cbiAgYXRMZWFzdChzaXplKSB7XG4gICAgdmFyIHF1ZXJ5ID0gdGhpcy5nZXQoc2l6ZSk7XG5cbiAgICBpZiAocXVlcnkpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubWF0Y2hNZWRpYShxdWVyeSkubWF0Y2hlcztcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1lZGlhIHF1ZXJ5IG9mIGEgYnJlYWtwb2ludC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBnZXQuXG4gICAqIEByZXR1cm5zIHtTdHJpbmd8bnVsbH0gLSBUaGUgbWVkaWEgcXVlcnkgb2YgdGhlIGJyZWFrcG9pbnQsIG9yIGBudWxsYCBpZiB0aGUgYnJlYWtwb2ludCBkb2Vzbid0IGV4aXN0LlxuICAgKi9cbiAgZ2V0KHNpemUpIHtcbiAgICBmb3IgKHZhciBpIGluIHRoaXMucXVlcmllcykge1xuICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW2ldO1xuICAgICAgaWYgKHNpemUgPT09IHF1ZXJ5Lm5hbWUpIHJldHVybiBxdWVyeS52YWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBicmVha3BvaW50IG5hbWUgYnkgdGVzdGluZyBldmVyeSBicmVha3BvaW50IGFuZCByZXR1cm5pbmcgdGhlIGxhc3Qgb25lIHRvIG1hdGNoICh0aGUgYmlnZ2VzdCBvbmUpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge1N0cmluZ30gTmFtZSBvZiB0aGUgY3VycmVudCBicmVha3BvaW50LlxuICAgKi9cbiAgX2dldEN1cnJlbnRTaXplKCkge1xuICAgIHZhciBtYXRjaGVkO1xuXG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLnF1ZXJpZXMpIHtcbiAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcblxuICAgICAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKHF1ZXJ5LnZhbHVlKS5tYXRjaGVzKSB7XG4gICAgICAgIG1hdGNoZWQgPSBxdWVyeTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1hdGNoZWQgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZC5uYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZDtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFjdGl2YXRlcyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLCB3aGljaCBmaXJlcyBhbiBldmVudCBvbiB0aGUgd2luZG93IHdoZW5ldmVyIHRoZSBicmVha3BvaW50IGNoYW5nZXMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3dhdGNoZXIoKSB7XG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuemYubWVkaWFxdWVyeScsICgpID0+IHtcbiAgICAgIHZhciBuZXdTaXplID0gdGhpcy5fZ2V0Q3VycmVudFNpemUoKTtcblxuICAgICAgaWYgKG5ld1NpemUgIT09IHRoaXMuY3VycmVudCkge1xuICAgICAgICAvLyBCcm9hZGNhc3QgdGhlIG1lZGlhIHF1ZXJ5IGNoYW5nZSBvbiB0aGUgd2luZG93XG4gICAgICAgICQod2luZG93KS50cmlnZ2VyKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBbbmV3U2l6ZSwgdGhpcy5jdXJyZW50XSk7XG5cbiAgICAgICAgLy8gQ2hhbmdlIHRoZSBjdXJyZW50IG1lZGlhIHF1ZXJ5XG4gICAgICAgIHRoaXMuY3VycmVudCA9IG5ld1NpemU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG5cbkZvdW5kYXRpb24uTWVkaWFRdWVyeSA9IE1lZGlhUXVlcnk7XG5cbi8vIG1hdGNoTWVkaWEoKSBwb2x5ZmlsbCAtIFRlc3QgYSBDU1MgbWVkaWEgdHlwZS9xdWVyeSBpbiBKUy5cbi8vIEF1dGhvcnMgJiBjb3B5cmlnaHQgKGMpIDIwMTI6IFNjb3R0IEplaGwsIFBhdWwgSXJpc2gsIE5pY2hvbGFzIFpha2FzLCBEYXZpZCBLbmlnaHQuIER1YWwgTUlUL0JTRCBsaWNlbnNlXG53aW5kb3cubWF0Y2hNZWRpYSB8fCAod2luZG93Lm1hdGNoTWVkaWEgPSBmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEZvciBicm93c2VycyB0aGF0IHN1cHBvcnQgbWF0Y2hNZWRpdW0gYXBpIHN1Y2ggYXMgSUUgOSBhbmQgd2Via2l0XG4gIHZhciBzdHlsZU1lZGlhID0gKHdpbmRvdy5zdHlsZU1lZGlhIHx8IHdpbmRvdy5tZWRpYSk7XG5cbiAgLy8gRm9yIHRob3NlIHRoYXQgZG9uJ3Qgc3VwcG9ydCBtYXRjaE1lZGl1bVxuICBpZiAoIXN0eWxlTWVkaWEpIHtcbiAgICB2YXIgc3R5bGUgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyksXG4gICAgc2NyaXB0ICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF0sXG4gICAgaW5mbyAgICAgICAgPSBudWxsO1xuXG4gICAgc3R5bGUudHlwZSAgPSAndGV4dC9jc3MnO1xuICAgIHN0eWxlLmlkICAgID0gJ21hdGNobWVkaWFqcy10ZXN0JztcblxuICAgIHNjcmlwdC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzdHlsZSwgc2NyaXB0KTtcblxuICAgIC8vICdzdHlsZS5jdXJyZW50U3R5bGUnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3dpbmRvdy5nZXRDb21wdXRlZFN0eWxlJyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXG4gICAgaW5mbyA9ICgnZ2V0Q29tcHV0ZWRTdHlsZScgaW4gd2luZG93KSAmJiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShzdHlsZSwgbnVsbCkgfHwgc3R5bGUuY3VycmVudFN0eWxlO1xuXG4gICAgc3R5bGVNZWRpYSA9IHtcbiAgICAgIG1hdGNoTWVkaXVtKG1lZGlhKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gYEBtZWRpYSAke21lZGlhfXsgI21hdGNobWVkaWFqcy10ZXN0IHsgd2lkdGg6IDFweDsgfSB9YDtcblxuICAgICAgICAvLyAnc3R5bGUuc3R5bGVTaGVldCcgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnc3R5bGUudGV4dENvbnRlbnQnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSB0ZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRlc3QgaWYgbWVkaWEgcXVlcnkgaXMgdHJ1ZSBvciBmYWxzZVxuICAgICAgICByZXR1cm4gaW5mby53aWR0aCA9PT0gJzFweCc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKG1lZGlhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1hdGNoZXM6IHN0eWxlTWVkaWEubWF0Y2hNZWRpdW0obWVkaWEgfHwgJ2FsbCcpLFxuICAgICAgbWVkaWE6IG1lZGlhIHx8ICdhbGwnXG4gICAgfTtcbiAgfVxufSgpKTtcblxuLy8gVGhhbmsgeW91OiBodHRwczovL2dpdGh1Yi5jb20vc2luZHJlc29yaHVzL3F1ZXJ5LXN0cmluZ1xuZnVuY3Rpb24gcGFyc2VTdHlsZVRvT2JqZWN0KHN0cikge1xuICB2YXIgc3R5bGVPYmplY3QgPSB7fTtcblxuICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gc3R5bGVPYmplY3Q7XG4gIH1cblxuICBzdHIgPSBzdHIudHJpbSgpLnNsaWNlKDEsIC0xKTsgLy8gYnJvd3NlcnMgcmUtcXVvdGUgc3RyaW5nIHN0eWxlIHZhbHVlc1xuXG4gIGlmICghc3RyKSB7XG4gICAgcmV0dXJuIHN0eWxlT2JqZWN0O1xuICB9XG5cbiAgc3R5bGVPYmplY3QgPSBzdHIuc3BsaXQoJyYnKS5yZWR1Y2UoZnVuY3Rpb24ocmV0LCBwYXJhbSkge1xuICAgIHZhciBwYXJ0cyA9IHBhcmFtLnJlcGxhY2UoL1xcKy9nLCAnICcpLnNwbGl0KCc9Jyk7XG4gICAgdmFyIGtleSA9IHBhcnRzWzBdO1xuICAgIHZhciB2YWwgPSBwYXJ0c1sxXTtcbiAgICBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQoa2V5KTtcblxuICAgIC8vIG1pc3NpbmcgYD1gIHNob3VsZCBiZSBgbnVsbGA6XG4gICAgLy8gaHR0cDovL3czLm9yZy9UUi8yMDEyL1dELXVybC0yMDEyMDUyNC8jY29sbGVjdC11cmwtcGFyYW1ldGVyc1xuICAgIHZhbCA9IHZhbCA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGRlY29kZVVSSUNvbXBvbmVudCh2YWwpO1xuXG4gICAgaWYgKCFyZXQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgcmV0W2tleV0gPSB2YWw7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJldFtrZXldKSkge1xuICAgICAgcmV0W2tleV0ucHVzaCh2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRba2V5XSA9IFtyZXRba2V5XSwgdmFsXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfSwge30pO1xuXG4gIHJldHVybiBzdHlsZU9iamVjdDtcbn1cblxuRm91bmRhdGlvbi5NZWRpYVF1ZXJ5ID0gTWVkaWFRdWVyeTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIE1vdGlvbiBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ubW90aW9uXG4gKi9cblxuY29uc3QgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xuY29uc3QgYWN0aXZlQ2xhc3NlcyA9IFsnbXVpLWVudGVyLWFjdGl2ZScsICdtdWktbGVhdmUtYWN0aXZlJ107XG5cbmNvbnN0IE1vdGlvbiA9IHtcbiAgYW5pbWF0ZUluOiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZSh0cnVlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfSxcblxuICBhbmltYXRlT3V0OiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZShmYWxzZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH1cbn1cblxuZnVuY3Rpb24gTW92ZShkdXJhdGlvbiwgZWxlbSwgZm4pe1xuICB2YXIgYW5pbSwgcHJvZywgc3RhcnQgPSBudWxsO1xuICAvLyBjb25zb2xlLmxvZygnY2FsbGVkJyk7XG5cbiAgZnVuY3Rpb24gbW92ZSh0cyl7XG4gICAgaWYoIXN0YXJ0KSBzdGFydCA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAvLyBjb25zb2xlLmxvZyhzdGFydCwgdHMpO1xuICAgIHByb2cgPSB0cyAtIHN0YXJ0O1xuICAgIGZuLmFwcGx5KGVsZW0pO1xuXG4gICAgaWYocHJvZyA8IGR1cmF0aW9uKXsgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSwgZWxlbSk7IH1cbiAgICBlbHNle1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW0pO1xuICAgICAgZWxlbS50cmlnZ2VyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKS50cmlnZ2VySGFuZGxlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSk7XG4gICAgfVxuICB9XG4gIGFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1vdmUpO1xufVxuXG4vKipcbiAqIEFuaW1hdGVzIGFuIGVsZW1lbnQgaW4gb3Igb3V0IHVzaW5nIGEgQ1NTIHRyYW5zaXRpb24gY2xhc3MuXG4gKiBAZnVuY3Rpb25cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzSW4gLSBEZWZpbmVzIGlmIHRoZSBhbmltYXRpb24gaXMgaW4gb3Igb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb3IgSFRNTCBvYmplY3QgdG8gYW5pbWF0ZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBhbmltYXRpb24gLSBDU1MgY2xhc3MgdG8gdXNlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBDYWxsYmFjayB0byBydW4gd2hlbiBhbmltYXRpb24gaXMgZmluaXNoZWQuXG4gKi9cbmZ1bmN0aW9uIGFuaW1hdGUoaXNJbiwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICBlbGVtZW50ID0gJChlbGVtZW50KS5lcSgwKTtcblxuICBpZiAoIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XG5cbiAgdmFyIGluaXRDbGFzcyA9IGlzSW4gPyBpbml0Q2xhc3Nlc1swXSA6IGluaXRDbGFzc2VzWzFdO1xuICB2YXIgYWN0aXZlQ2xhc3MgPSBpc0luID8gYWN0aXZlQ2xhc3Nlc1swXSA6IGFjdGl2ZUNsYXNzZXNbMV07XG5cbiAgLy8gU2V0IHVwIHRoZSBhbmltYXRpb25cbiAgcmVzZXQoKTtcblxuICBlbGVtZW50XG4gICAgLmFkZENsYXNzKGFuaW1hdGlvbilcbiAgICAuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGVsZW1lbnQuYWRkQ2xhc3MoaW5pdENsYXNzKTtcbiAgICBpZiAoaXNJbikgZWxlbWVudC5zaG93KCk7XG4gIH0pO1xuXG4gIC8vIFN0YXJ0IHRoZSBhbmltYXRpb25cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICBlbGVtZW50WzBdLm9mZnNldFdpZHRoO1xuICAgIGVsZW1lbnRcbiAgICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnJylcbiAgICAgIC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XG4gIH0pO1xuXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xuICBlbGVtZW50Lm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoZWxlbWVudCksIGZpbmlzaCk7XG5cbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xuICBmdW5jdGlvbiBmaW5pc2goKSB7XG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcbiAgICByZXNldCgpO1xuICAgIGlmIChjYikgY2IuYXBwbHkoZWxlbWVudCk7XG4gIH1cblxuICAvLyBSZXNldHMgdHJhbnNpdGlvbnMgYW5kIHJlbW92ZXMgbW90aW9uLXNwZWNpZmljIGNsYXNzZXNcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoYCR7aW5pdENsYXNzfSAke2FjdGl2ZUNsYXNzfSAke2FuaW1hdGlvbn1gKTtcbiAgfVxufVxuXG5Gb3VuZGF0aW9uLk1vdmUgPSBNb3ZlO1xuRm91bmRhdGlvbi5Nb3Rpb24gPSBNb3Rpb247XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3QgTmVzdCA9IHtcbiAgRmVhdGhlcihtZW51LCB0eXBlID0gJ3pmJykge1xuICAgIG1lbnUuYXR0cigncm9sZScsICdtZW51YmFyJyk7XG5cbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykuYXR0cih7J3JvbGUnOiAnbWVudWl0ZW0nfSksXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxuICAgICAgICBzdWJJdGVtQ2xhc3MgPSBgJHtzdWJNZW51Q2xhc3N9LWl0ZW1gLFxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YDtcblxuICAgIG1lbnUuZmluZCgnYTpmaXJzdCcpLmF0dHIoJ3RhYmluZGV4JywgMCk7XG5cbiAgICBpdGVtcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRpdGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAkc3ViID0gJGl0ZW0uY2hpbGRyZW4oJ3VsJyk7XG5cbiAgICAgIGlmICgkc3ViLmxlbmd0aCkge1xuICAgICAgICAkaXRlbVxuICAgICAgICAgIC5hZGRDbGFzcyhoYXNTdWJDbGFzcylcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXG4gICAgICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAgICAgICAgJ2FyaWEtbGFiZWwnOiAkaXRlbS5jaGlsZHJlbignYTpmaXJzdCcpLnRleHQoKVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICRzdWJcbiAgICAgICAgICAuYWRkQ2xhc3MoYHN1Ym1lbnUgJHtzdWJNZW51Q2xhc3N9YClcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnZGF0YS1zdWJtZW51JzogJycsXG4gICAgICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxuICAgICAgICAgICAgJ3JvbGUnOiAnbWVudSdcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCRpdGVtLnBhcmVudCgnW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpIHtcbiAgICAgICAgJGl0ZW0uYWRkQ2xhc3MoYGlzLXN1Ym1lbnUtaXRlbSAke3N1Ykl0ZW1DbGFzc31gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybjtcbiAgfSxcblxuICBCdXJuKG1lbnUsIHR5cGUpIHtcbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykucmVtb3ZlQXR0cigndGFiaW5kZXgnKSxcbiAgICAgICAgc3ViTWVudUNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudWAsXG4gICAgICAgIHN1Ykl0ZW1DbGFzcyA9IGAke3N1Yk1lbnVDbGFzc30taXRlbWAsXG4gICAgICAgIGhhc1N1YkNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudS1wYXJlbnRgO1xuXG4gICAgbWVudVxuICAgICAgLmZpbmQoJyonKVxuICAgICAgLnJlbW92ZUNsYXNzKGAke3N1Yk1lbnVDbGFzc30gJHtzdWJJdGVtQ2xhc3N9ICR7aGFzU3ViQ2xhc3N9IGlzLXN1Ym1lbnUtaXRlbSBzdWJtZW51IGlzLWFjdGl2ZWApXG4gICAgICAucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51JykuY3NzKCdkaXNwbGF5JywgJycpO1xuXG4gICAgLy8gY29uc29sZS5sb2coICAgICAgbWVudS5maW5kKCcuJyArIHN1Yk1lbnVDbGFzcyArICcsIC4nICsgc3ViSXRlbUNsYXNzICsgJywgLmhhcy1zdWJtZW51LCAuaXMtc3VibWVudS1pdGVtLCAuc3VibWVudSwgW2RhdGEtc3VibWVudV0nKVxuICAgIC8vICAgICAgICAgICAucmVtb3ZlQ2xhc3Moc3ViTWVudUNsYXNzICsgJyAnICsgc3ViSXRlbUNsYXNzICsgJyBoYXMtc3VibWVudSBpcy1zdWJtZW51LWl0ZW0gc3VibWVudScpXG4gICAgLy8gICAgICAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKSk7XG4gICAgLy8gaXRlbXMuZWFjaChmdW5jdGlvbigpe1xuICAgIC8vICAgdmFyICRpdGVtID0gJCh0aGlzKSxcbiAgICAvLyAgICAgICAkc3ViID0gJGl0ZW0uY2hpbGRyZW4oJ3VsJyk7XG4gICAgLy8gICBpZigkaXRlbS5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKXtcbiAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLXN1Ym1lbnUtaXRlbSAnICsgc3ViSXRlbUNsYXNzKTtcbiAgICAvLyAgIH1cbiAgICAvLyAgIGlmKCRzdWIubGVuZ3RoKXtcbiAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2hhcy1zdWJtZW51Jyk7XG4gICAgLy8gICAgICRzdWIucmVtb3ZlQ2xhc3MoJ3N1Ym1lbnUgJyArIHN1Yk1lbnVDbGFzcykucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51Jyk7XG4gICAgLy8gICB9XG4gICAgLy8gfSk7XG4gIH1cbn1cblxuRm91bmRhdGlvbi5OZXN0ID0gTmVzdDtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5mdW5jdGlvbiBUaW1lcihlbGVtLCBvcHRpb25zLCBjYikge1xuICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgZHVyYXRpb24gPSBvcHRpb25zLmR1cmF0aW9uLC8vb3B0aW9ucyBpcyBhbiBvYmplY3QgZm9yIGVhc2lseSBhZGRpbmcgZmVhdHVyZXMgbGF0ZXIuXG4gICAgICBuYW1lU3BhY2UgPSBPYmplY3Qua2V5cyhlbGVtLmRhdGEoKSlbMF0gfHwgJ3RpbWVyJyxcbiAgICAgIHJlbWFpbiA9IC0xLFxuICAgICAgc3RhcnQsXG4gICAgICB0aW1lcjtcblxuICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XG5cbiAgdGhpcy5yZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmVtYWluID0gLTE7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB0aGlzLnN0YXJ0KCk7XG4gIH1cblxuICB0aGlzLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuICAgIC8vIGlmKCFlbGVtLmRhdGEoJ3BhdXNlZCcpKXsgcmV0dXJuIGZhbHNlOyB9Ly9tYXliZSBpbXBsZW1lbnQgdGhpcyBzYW5pdHkgY2hlY2sgaWYgdXNlZCBmb3Igb3RoZXIgdGhpbmdzLlxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgcmVtYWluID0gcmVtYWluIDw9IDAgPyBkdXJhdGlvbiA6IHJlbWFpbjtcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIGZhbHNlKTtcbiAgICBzdGFydCA9IERhdGUubm93KCk7XG4gICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBpZihvcHRpb25zLmluZmluaXRlKXtcbiAgICAgICAgX3RoaXMucmVzdGFydCgpOy8vcmVydW4gdGhlIHRpbWVyLlxuICAgICAgfVxuICAgICAgY2IoKTtcbiAgICB9LCByZW1haW4pO1xuICAgIGVsZW0udHJpZ2dlcihgdGltZXJzdGFydC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxuXG4gIHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgICAvL2lmKGVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIHRydWUpO1xuICAgIHZhciBlbmQgPSBEYXRlLm5vdygpO1xuICAgIHJlbWFpbiA9IHJlbWFpbiAtIChlbmQgLSBzdGFydCk7XG4gICAgZWxlbS50cmlnZ2VyKGB0aW1lcnBhdXNlZC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgYSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGltYWdlcyBhcmUgZnVsbHkgbG9hZGVkLlxuICogQHBhcmFtIHtPYmplY3R9IGltYWdlcyAtIEltYWdlKHMpIHRvIGNoZWNrIGlmIGxvYWRlZC5cbiAqIEBwYXJhbSB7RnVuY30gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gaW1hZ2UgaXMgZnVsbHkgbG9hZGVkLlxuICovXG5mdW5jdGlvbiBvbkltYWdlc0xvYWRlZChpbWFnZXMsIGNhbGxiYWNrKXtcbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgdW5sb2FkZWQgPSBpbWFnZXMubGVuZ3RoO1xuXG4gIGlmICh1bmxvYWRlZCA9PT0gMCkge1xuICAgIGNhbGxiYWNrKCk7XG4gIH1cblxuICBpbWFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb21wbGV0ZSkge1xuICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHRoaXMubmF0dXJhbFdpZHRoICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLm5hdHVyYWxXaWR0aCA+IDApIHtcbiAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCh0aGlzKS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2luZ2xlSW1hZ2VMb2FkZWQoKSB7XG4gICAgdW5sb2FkZWQtLTtcbiAgICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59XG5cbkZvdW5kYXRpb24uVGltZXIgPSBUaW1lcjtcbkZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQgPSBvbkltYWdlc0xvYWRlZDtcblxufShqUXVlcnkpO1xuIiwiLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKldvcmsgaW5zcGlyZWQgYnkgbXVsdGlwbGUganF1ZXJ5IHN3aXBlIHBsdWdpbnMqKlxuLy8qKkRvbmUgYnkgWW9oYWkgQXJhcmF0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuKGZ1bmN0aW9uKCQpIHtcblxuICAkLnNwb3RTd2lwZSA9IHtcbiAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgIGVuYWJsZWQ6ICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2UsXG4gICAgbW92ZVRocmVzaG9sZDogNzUsXG4gICAgdGltZVRocmVzaG9sZDogMjAwXG4gIH07XG5cbiAgdmFyICAgc3RhcnRQb3NYLFxuICAgICAgICBzdGFydFBvc1ksXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZWxhcHNlZFRpbWUsXG4gICAgICAgIGlzTW92aW5nID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gb25Ub3VjaEVuZCgpIHtcbiAgICAvLyAgYWxlcnQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQpO1xuICAgIGlzTW92aW5nID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBvblRvdWNoTW92ZShlKSB7XG4gICAgaWYgKCQuc3BvdFN3aXBlLnByZXZlbnREZWZhdWx0KSB7IGUucHJldmVudERlZmF1bHQoKTsgfVxuICAgIGlmKGlzTW92aW5nKSB7XG4gICAgICB2YXIgeCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgIHZhciB5ID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgdmFyIGR4ID0gc3RhcnRQb3NYIC0geDtcbiAgICAgIHZhciBkeSA9IHN0YXJ0UG9zWSAtIHk7XG4gICAgICB2YXIgZGlyO1xuICAgICAgZWxhcHNlZFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZTtcbiAgICAgIGlmKE1hdGguYWJzKGR4KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcbiAgICAgICAgZGlyID0gZHggPiAwID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICAgIH1cbiAgICAgIC8vIGVsc2UgaWYoTWF0aC5hYnMoZHkpID49ICQuc3BvdFN3aXBlLm1vdmVUaHJlc2hvbGQgJiYgZWxhcHNlZFRpbWUgPD0gJC5zcG90U3dpcGUudGltZVRocmVzaG9sZCkge1xuICAgICAgLy8gICBkaXIgPSBkeSA+IDAgPyAnZG93bicgOiAndXAnO1xuICAgICAgLy8gfVxuICAgICAgaWYoZGlyKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgb25Ub3VjaEVuZC5jYWxsKHRoaXMpO1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ3N3aXBlJywgZGlyKS50cmlnZ2VyKGBzd2lwZSR7ZGlyfWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgc3RhcnRQb3NYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgc3RhcnRQb3NZID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgaXNNb3ZpbmcgPSB0cnVlO1xuICAgICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyICYmIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0KTtcbiAgfVxuXG4gICQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHsgc2V0dXA6IGluaXQgfTtcblxuICAkLmVhY2goWydsZWZ0JywgJ3VwJywgJ2Rvd24nLCAncmlnaHQnXSwgZnVuY3Rpb24gKCkge1xuICAgICQuZXZlbnQuc3BlY2lhbFtgc3dpcGUke3RoaXN9YF0gPSB7IHNldHVwOiBmdW5jdGlvbigpe1xuICAgICAgJCh0aGlzKS5vbignc3dpcGUnLCAkLm5vb3ApO1xuICAgIH0gfTtcbiAgfSk7XG59KShqUXVlcnkpO1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1ldGhvZCBmb3IgYWRkaW5nIHBzdWVkbyBkcmFnIGV2ZW50cyB0byBlbGVtZW50cyAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuIWZ1bmN0aW9uKCQpe1xuICAkLmZuLmFkZFRvdWNoID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSxlbCl7XG4gICAgICAkKGVsKS5iaW5kKCd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCcsZnVuY3Rpb24oKXtcbiAgICAgICAgLy93ZSBwYXNzIHRoZSBvcmlnaW5hbCBldmVudCBvYmplY3QgYmVjYXVzZSB0aGUgalF1ZXJ5IGV2ZW50XG4gICAgICAgIC8vb2JqZWN0IGlzIG5vcm1hbGl6ZWQgdG8gdzNjIHNwZWNzIGFuZCBkb2VzIG5vdCBwcm92aWRlIHRoZSBUb3VjaExpc3RcbiAgICAgICAgaGFuZGxlVG91Y2goZXZlbnQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFuZGxlVG91Y2ggPSBmdW5jdGlvbihldmVudCl7XG4gICAgICB2YXIgdG91Y2hlcyA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzLFxuICAgICAgICAgIGZpcnN0ID0gdG91Y2hlc1swXSxcbiAgICAgICAgICBldmVudFR5cGVzID0ge1xuICAgICAgICAgICAgdG91Y2hzdGFydDogJ21vdXNlZG93bicsXG4gICAgICAgICAgICB0b3VjaG1vdmU6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgdG91Y2hlbmQ6ICdtb3VzZXVwJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHlwZSA9IGV2ZW50VHlwZXNbZXZlbnQudHlwZV0sXG4gICAgICAgICAgc2ltdWxhdGVkRXZlbnRcbiAgICAgICAgO1xuXG4gICAgICBpZignTW91c2VFdmVudCcgaW4gd2luZG93ICYmIHR5cGVvZiB3aW5kb3cuTW91c2VFdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IHdpbmRvdy5Nb3VzZUV2ZW50KHR5cGUsIHtcbiAgICAgICAgICAnYnViYmxlcyc6IHRydWUsXG4gICAgICAgICAgJ2NhbmNlbGFibGUnOiB0cnVlLFxuICAgICAgICAgICdzY3JlZW5YJzogZmlyc3Quc2NyZWVuWCxcbiAgICAgICAgICAnc2NyZWVuWSc6IGZpcnN0LnNjcmVlblksXG4gICAgICAgICAgJ2NsaWVudFgnOiBmaXJzdC5jbGllbnRYLFxuICAgICAgICAgICdjbGllbnRZJzogZmlyc3QuY2xpZW50WVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbXVsYXRlZEV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ01vdXNlRXZlbnQnKTtcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQuaW5pdE1vdXNlRXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSwgd2luZG93LCAxLCBmaXJzdC5zY3JlZW5YLCBmaXJzdC5zY3JlZW5ZLCBmaXJzdC5jbGllbnRYLCBmaXJzdC5jbGllbnRZLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgMC8qbGVmdCovLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIGZpcnN0LnRhcmdldC5kaXNwYXRjaEV2ZW50KHNpbXVsYXRlZEV2ZW50KTtcbiAgICB9O1xuICB9O1xufShqUXVlcnkpO1xuXG5cbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKkZyb20gdGhlIGpRdWVyeSBNb2JpbGUgTGlicmFyeSoqXG4vLyoqbmVlZCB0byByZWNyZWF0ZSBmdW5jdGlvbmFsaXR5Kipcbi8vKiphbmQgdHJ5IHRvIGltcHJvdmUgaWYgcG9zc2libGUqKlxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cbi8qIFJlbW92aW5nIHRoZSBqUXVlcnkgZnVuY3Rpb24gKioqKlxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cbihmdW5jdGlvbiggJCwgd2luZG93LCB1bmRlZmluZWQgKSB7XG5cblx0dmFyICRkb2N1bWVudCA9ICQoIGRvY3VtZW50ICksXG5cdFx0Ly8gc3VwcG9ydFRvdWNoID0gJC5tb2JpbGUuc3VwcG9ydC50b3VjaCxcblx0XHR0b3VjaFN0YXJ0RXZlbnQgPSAndG91Y2hzdGFydCcvL3N1cHBvcnRUb3VjaCA/IFwidG91Y2hzdGFydFwiIDogXCJtb3VzZWRvd25cIixcblx0XHR0b3VjaFN0b3BFdmVudCA9ICd0b3VjaGVuZCcvL3N1cHBvcnRUb3VjaCA/IFwidG91Y2hlbmRcIiA6IFwibW91c2V1cFwiLFxuXHRcdHRvdWNoTW92ZUV2ZW50ID0gJ3RvdWNobW92ZScvL3N1cHBvcnRUb3VjaCA/IFwidG91Y2htb3ZlXCIgOiBcIm1vdXNlbW92ZVwiO1xuXG5cdC8vIHNldHVwIG5ldyBldmVudCBzaG9ydGN1dHNcblx0JC5lYWNoKCAoIFwidG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgXCIgK1xuXHRcdFwic3dpcGUgc3dpcGVsZWZ0IHN3aXBlcmlnaHRcIiApLnNwbGl0KCBcIiBcIiApLCBmdW5jdGlvbiggaSwgbmFtZSApIHtcblxuXHRcdCQuZm5bIG5hbWUgXSA9IGZ1bmN0aW9uKCBmbiApIHtcblx0XHRcdHJldHVybiBmbiA/IHRoaXMuYmluZCggbmFtZSwgZm4gKSA6IHRoaXMudHJpZ2dlciggbmFtZSApO1xuXHRcdH07XG5cblx0XHQvLyBqUXVlcnkgPCAxLjhcblx0XHRpZiAoICQuYXR0ckZuICkge1xuXHRcdFx0JC5hdHRyRm5bIG5hbWUgXSA9IHRydWU7XG5cdFx0fVxuXHR9KTtcblxuXHRmdW5jdGlvbiB0cmlnZ2VyQ3VzdG9tRXZlbnQoIG9iaiwgZXZlbnRUeXBlLCBldmVudCwgYnViYmxlICkge1xuXHRcdHZhciBvcmlnaW5hbFR5cGUgPSBldmVudC50eXBlO1xuXHRcdGV2ZW50LnR5cGUgPSBldmVudFR5cGU7XG5cdFx0aWYgKCBidWJibGUgKSB7XG5cdFx0XHQkLmV2ZW50LnRyaWdnZXIoIGV2ZW50LCB1bmRlZmluZWQsIG9iaiApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkLmV2ZW50LmRpc3BhdGNoLmNhbGwoIG9iaiwgZXZlbnQgKTtcblx0XHR9XG5cdFx0ZXZlbnQudHlwZSA9IG9yaWdpbmFsVHlwZTtcblx0fVxuXG5cdC8vIGFsc28gaGFuZGxlcyB0YXBob2xkXG5cblx0Ly8gQWxzbyBoYW5kbGVzIHN3aXBlbGVmdCwgc3dpcGVyaWdodFxuXHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUgPSB7XG5cblx0XHQvLyBNb3JlIHRoYW4gdGhpcyBob3Jpem9udGFsIGRpc3BsYWNlbWVudCwgYW5kIHdlIHdpbGwgc3VwcHJlc3Mgc2Nyb2xsaW5nLlxuXHRcdHNjcm9sbFN1cHJlc3Npb25UaHJlc2hvbGQ6IDMwLFxuXG5cdFx0Ly8gTW9yZSB0aW1lIHRoYW4gdGhpcywgYW5kIGl0IGlzbid0IGEgc3dpcGUuXG5cdFx0ZHVyYXRpb25UaHJlc2hvbGQ6IDEwMDAsXG5cblx0XHQvLyBTd2lwZSBob3Jpem9udGFsIGRpc3BsYWNlbWVudCBtdXN0IGJlIG1vcmUgdGhhbiB0aGlzLlxuXHRcdGhvcml6b250YWxEaXN0YW5jZVRocmVzaG9sZDogd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMiA/IDE1IDogMzAsXG5cblx0XHQvLyBTd2lwZSB2ZXJ0aWNhbCBkaXNwbGFjZW1lbnQgbXVzdCBiZSBsZXNzIHRoYW4gdGhpcy5cblx0XHR2ZXJ0aWNhbERpc3RhbmNlVGhyZXNob2xkOiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA+PSAyID8gMTUgOiAzMCxcblxuXHRcdGdldExvY2F0aW9uOiBmdW5jdGlvbiAoIGV2ZW50ICkge1xuXHRcdFx0dmFyIHdpblBhZ2VYID0gd2luZG93LnBhZ2VYT2Zmc2V0LFxuXHRcdFx0XHR3aW5QYWdlWSA9IHdpbmRvdy5wYWdlWU9mZnNldCxcblx0XHRcdFx0eCA9IGV2ZW50LmNsaWVudFgsXG5cdFx0XHRcdHkgPSBldmVudC5jbGllbnRZO1xuXG5cdFx0XHRpZiAoIGV2ZW50LnBhZ2VZID09PSAwICYmIE1hdGguZmxvb3IoIHkgKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VZICkgfHxcblx0XHRcdFx0ZXZlbnQucGFnZVggPT09IDAgJiYgTWF0aC5mbG9vciggeCApID4gTWF0aC5mbG9vciggZXZlbnQucGFnZVggKSApIHtcblxuXHRcdFx0XHQvLyBpT1M0IGNsaWVudFgvY2xpZW50WSBoYXZlIHRoZSB2YWx1ZSB0aGF0IHNob3VsZCBoYXZlIGJlZW5cblx0XHRcdFx0Ly8gaW4gcGFnZVgvcGFnZVkuIFdoaWxlIHBhZ2VYL3BhZ2UvIGhhdmUgdGhlIHZhbHVlIDBcblx0XHRcdFx0eCA9IHggLSB3aW5QYWdlWDtcblx0XHRcdFx0eSA9IHkgLSB3aW5QYWdlWTtcblx0XHRcdH0gZWxzZSBpZiAoIHkgPCAoIGV2ZW50LnBhZ2VZIC0gd2luUGFnZVkpIHx8IHggPCAoIGV2ZW50LnBhZ2VYIC0gd2luUGFnZVggKSApIHtcblxuXHRcdFx0XHQvLyBTb21lIEFuZHJvaWQgYnJvd3NlcnMgaGF2ZSB0b3RhbGx5IGJvZ3VzIHZhbHVlcyBmb3IgY2xpZW50WC9ZXG5cdFx0XHRcdC8vIHdoZW4gc2Nyb2xsaW5nL3pvb21pbmcgYSBwYWdlLiBEZXRlY3RhYmxlIHNpbmNlIGNsaWVudFgvY2xpZW50WVxuXHRcdFx0XHQvLyBzaG91bGQgbmV2ZXIgYmUgc21hbGxlciB0aGFuIHBhZ2VYL3BhZ2VZIG1pbnVzIHBhZ2Ugc2Nyb2xsXG5cdFx0XHRcdHggPSBldmVudC5wYWdlWCAtIHdpblBhZ2VYO1xuXHRcdFx0XHR5ID0gZXZlbnQucGFnZVkgLSB3aW5QYWdlWTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0eDogeCxcblx0XHRcdFx0eTogeVxuXHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0c3RhcnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbIDAgXSA6IGV2ZW50LFxuXHRcdFx0XHRsb2NhdGlvbiA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5nZXRMb2NhdGlvbiggZGF0YSApO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHRpbWU6ICggbmV3IERhdGUoKSApLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdGNvb3JkczogWyBsb2NhdGlvbi54LCBsb2NhdGlvbi55IF0sXG5cdFx0XHRcdFx0XHRvcmlnaW46ICQoIGV2ZW50LnRhcmdldCApXG5cdFx0XHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0c3RvcDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0dmFyIGRhdGEgPSBldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXMgP1xuXHRcdFx0XHRcdGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlc1sgMCBdIDogZXZlbnQsXG5cdFx0XHRcdGxvY2F0aW9uID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmdldExvY2F0aW9uKCBkYXRhICk7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0dGltZTogKCBuZXcgRGF0ZSgpICkuZ2V0VGltZSgpLFxuXHRcdFx0XHRcdFx0Y29vcmRzOiBbIGxvY2F0aW9uLngsIGxvY2F0aW9uLnkgXVxuXHRcdFx0XHRcdH07XG5cdFx0fSxcblxuXHRcdGhhbmRsZVN3aXBlOiBmdW5jdGlvbiggc3RhcnQsIHN0b3AsIHRoaXNPYmplY3QsIG9yaWdUYXJnZXQgKSB7XG5cdFx0XHRpZiAoIHN0b3AudGltZSAtIHN0YXJ0LnRpbWUgPCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZHVyYXRpb25UaHJlc2hvbGQgJiZcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMCBdIC0gc3RvcC5jb29yZHNbIDAgXSApID4gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmhvcml6b250YWxEaXN0YW5jZVRocmVzaG9sZCAmJlxuXHRcdFx0XHRNYXRoLmFicyggc3RhcnQuY29vcmRzWyAxIF0gLSBzdG9wLmNvb3Jkc1sgMSBdICkgPCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUudmVydGljYWxEaXN0YW5jZVRocmVzaG9sZCApIHtcblx0XHRcdFx0dmFyIGRpcmVjdGlvbiA9IHN0YXJ0LmNvb3Jkc1swXSA+IHN0b3AuY29vcmRzWyAwIF0gPyBcInN3aXBlbGVmdFwiIDogXCJzd2lwZXJpZ2h0XCI7XG5cblx0XHRcdFx0dHJpZ2dlckN1c3RvbUV2ZW50KCB0aGlzT2JqZWN0LCBcInN3aXBlXCIsICQuRXZlbnQoIFwic3dpcGVcIiwgeyB0YXJnZXQ6IG9yaWdUYXJnZXQsIHN3aXBlc3RhcnQ6IHN0YXJ0LCBzd2lwZXN0b3A6IHN0b3AgfSksIHRydWUgKTtcblx0XHRcdFx0dHJpZ2dlckN1c3RvbUV2ZW50KCB0aGlzT2JqZWN0LCBkaXJlY3Rpb24sJC5FdmVudCggZGlyZWN0aW9uLCB7IHRhcmdldDogb3JpZ1RhcmdldCwgc3dpcGVzdGFydDogc3RhcnQsIHN3aXBlc3RvcDogc3RvcCB9ICksIHRydWUgKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cblx0XHR9LFxuXG5cdFx0Ly8gVGhpcyBzZXJ2ZXMgYXMgYSBmbGFnIHRvIGVuc3VyZSB0aGF0IGF0IG1vc3Qgb25lIHN3aXBlIGV2ZW50IGV2ZW50IGlzXG5cdFx0Ly8gaW4gd29yayBhdCBhbnkgZ2l2ZW4gdGltZVxuXHRcdGV2ZW50SW5Qcm9ncmVzczogZmFsc2UsXG5cblx0XHRzZXR1cDogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZXZlbnRzLFxuXHRcdFx0XHR0aGlzT2JqZWN0ID0gdGhpcyxcblx0XHRcdFx0JHRoaXMgPSAkKCB0aGlzT2JqZWN0ICksXG5cdFx0XHRcdGNvbnRleHQgPSB7fTtcblxuXHRcdFx0Ly8gUmV0cmlldmUgdGhlIGV2ZW50cyBkYXRhIGZvciB0aGlzIGVsZW1lbnQgYW5kIGFkZCB0aGUgc3dpcGUgY29udGV4dFxuXHRcdFx0ZXZlbnRzID0gJC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiApO1xuXHRcdFx0aWYgKCAhZXZlbnRzICkge1xuXHRcdFx0XHRldmVudHMgPSB7IGxlbmd0aDogMCB9O1xuXHRcdFx0XHQkLmRhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiLCBldmVudHMgKTtcblx0XHRcdH1cblx0XHRcdGV2ZW50cy5sZW5ndGgrKztcblx0XHRcdGV2ZW50cy5zd2lwZSA9IGNvbnRleHQ7XG5cblx0XHRcdGNvbnRleHQuc3RhcnQgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cblx0XHRcdFx0Ly8gQmFpbCBpZiB3ZSdyZSBhbHJlYWR5IHdvcmtpbmcgb24gYSBzd2lwZSBldmVudFxuXHRcdFx0XHRpZiAoICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ldmVudEluUHJvZ3Jlc3MgKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ldmVudEluUHJvZ3Jlc3MgPSB0cnVlO1xuXG5cdFx0XHRcdHZhciBzdG9wLFxuXHRcdFx0XHRcdHN0YXJ0ID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLnN0YXJ0KCBldmVudCApLFxuXHRcdFx0XHRcdG9yaWdUYXJnZXQgPSBldmVudC50YXJnZXQsXG5cdFx0XHRcdFx0ZW1pdHRlZCA9IGZhbHNlO1xuXG5cdFx0XHRcdGNvbnRleHQubW92ZSA9IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdFx0XHRpZiAoICFzdGFydCB8fCBldmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSApIHtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzdG9wID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLnN0b3AoIGV2ZW50ICk7XG5cdFx0XHRcdFx0aWYgKCAhZW1pdHRlZCApIHtcblx0XHRcdFx0XHRcdGVtaXR0ZWQgPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuaGFuZGxlU3dpcGUoIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICk7XG5cdFx0XHRcdFx0XHRpZiAoIGVtaXR0ZWQgKSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gUmVzZXQgdGhlIGNvbnRleHQgdG8gbWFrZSB3YXkgZm9yIHRoZSBuZXh0IHN3aXBlIGV2ZW50XG5cdFx0XHRcdFx0XHRcdCQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ldmVudEluUHJvZ3Jlc3MgPSBmYWxzZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gcHJldmVudCBzY3JvbGxpbmdcblx0XHRcdFx0XHRpZiAoIE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDAgXSAtIHN0b3AuY29vcmRzWyAwIF0gKSA+ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkICkge1xuXHRcdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Y29udGV4dC5zdG9wID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRlbWl0dGVkID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0Ly8gUmVzZXQgdGhlIGNvbnRleHQgdG8gbWFrZSB3YXkgZm9yIHRoZSBuZXh0IHN3aXBlIGV2ZW50XG5cdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHQkZG9jdW1lbnQub2ZmKCB0b3VjaE1vdmVFdmVudCwgY29udGV4dC5tb3ZlICk7XG5cdFx0XHRcdFx0XHRjb250ZXh0Lm1vdmUgPSBudWxsO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRkb2N1bWVudC5vbiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApXG5cdFx0XHRcdFx0Lm9uZSggdG91Y2hTdG9wRXZlbnQsIGNvbnRleHQuc3RvcCApO1xuXHRcdFx0fTtcblx0XHRcdCR0aGlzLm9uKCB0b3VjaFN0YXJ0RXZlbnQsIGNvbnRleHQuc3RhcnQgKTtcblx0XHR9LFxuXG5cdFx0dGVhcmRvd246IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGV2ZW50cywgY29udGV4dDtcblxuXHRcdFx0ZXZlbnRzID0gJC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiApO1xuXHRcdFx0aWYgKCBldmVudHMgKSB7XG5cdFx0XHRcdGNvbnRleHQgPSBldmVudHMuc3dpcGU7XG5cdFx0XHRcdGRlbGV0ZSBldmVudHMuc3dpcGU7XG5cdFx0XHRcdGV2ZW50cy5sZW5ndGgtLTtcblx0XHRcdFx0aWYgKCBldmVudHMubGVuZ3RoID09PSAwICkge1xuXHRcdFx0XHRcdCQucmVtb3ZlRGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIGNvbnRleHQgKSB7XG5cdFx0XHRcdGlmICggY29udGV4dC5zdGFydCApIHtcblx0XHRcdFx0XHQkKCB0aGlzICkub2ZmKCB0b3VjaFN0YXJ0RXZlbnQsIGNvbnRleHQuc3RhcnQgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIGNvbnRleHQubW92ZSApIHtcblx0XHRcdFx0XHQkZG9jdW1lbnQub2ZmKCB0b3VjaE1vdmVFdmVudCwgY29udGV4dC5tb3ZlICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBjb250ZXh0LnN0b3AgKSB7XG5cdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hTdG9wRXZlbnQsIGNvbnRleHQuc3RvcCApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHQkLmVhY2goe1xuXHRcdHN3aXBlbGVmdDogXCJzd2lwZS5sZWZ0XCIsXG5cdFx0c3dpcGVyaWdodDogXCJzd2lwZS5yaWdodFwiXG5cdH0sIGZ1bmN0aW9uKCBldmVudCwgc291cmNlRXZlbnQgKSB7XG5cblx0XHQkLmV2ZW50LnNwZWNpYWxbIGV2ZW50IF0gPSB7XG5cdFx0XHRzZXR1cDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCQoIHRoaXMgKS5iaW5kKCBzb3VyY2VFdmVudCwgJC5ub29wICk7XG5cdFx0XHR9LFxuXHRcdFx0dGVhcmRvd246IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKCB0aGlzICkudW5iaW5kKCBzb3VyY2VFdmVudCApO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0pO1xufSkoIGpRdWVyeSwgdGhpcyApO1xuKi9cbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3QgTXV0YXRpb25PYnNlcnZlciA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciBwcmVmaXhlcyA9IFsnV2ViS2l0JywgJ01veicsICdPJywgJ01zJywgJyddO1xuICBmb3IgKHZhciBpPTA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChgJHtwcmVmaXhlc1tpXX1NdXRhdGlvbk9ic2VydmVyYCBpbiB3aW5kb3cpIHtcbiAgICAgIHJldHVybiB3aW5kb3dbYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmBdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59KCkpO1xuXG5jb25zdCB0cmlnZ2VycyA9IChlbCwgdHlwZSkgPT4ge1xuICBlbC5kYXRhKHR5cGUpLnNwbGl0KCcgJykuZm9yRWFjaChpZCA9PiB7XG4gICAgJChgIyR7aWR9YClbIHR5cGUgPT09ICdjbG9zZScgPyAndHJpZ2dlcicgOiAndHJpZ2dlckhhbmRsZXInXShgJHt0eXBlfS56Zi50cmlnZ2VyYCwgW2VsXSk7XG4gIH0pO1xufTtcbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtb3Blbl0gd2lsbCByZXZlYWwgYSBwbHVnaW4gdGhhdCBzdXBwb3J0cyBpdCB3aGVuIGNsaWNrZWQuXG4kKGRvY3VtZW50KS5vbignY2xpY2suemYudHJpZ2dlcicsICdbZGF0YS1vcGVuXScsIGZ1bmN0aW9uKCkge1xuICB0cmlnZ2VycygkKHRoaXMpLCAnb3BlbicpO1xufSk7XG5cbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtY2xvc2VdIHdpbGwgY2xvc2UgYSBwbHVnaW4gdGhhdCBzdXBwb3J0cyBpdCB3aGVuIGNsaWNrZWQuXG4vLyBJZiB1c2VkIHdpdGhvdXQgYSB2YWx1ZSBvbiBbZGF0YS1jbG9zZV0sIHRoZSBldmVudCB3aWxsIGJ1YmJsZSwgYWxsb3dpbmcgaXQgdG8gY2xvc2UgYSBwYXJlbnQgY29tcG9uZW50LlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2VdJywgZnVuY3Rpb24oKSB7XG4gIGxldCBpZCA9ICQodGhpcykuZGF0YSgnY2xvc2UnKTtcbiAgaWYgKGlkKSB7XG4gICAgdHJpZ2dlcnMoJCh0aGlzKSwgJ2Nsb3NlJyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZS56Zi50cmlnZ2VyJyk7XG4gIH1cbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLXRvZ2dsZV0gd2lsbCB0b2dnbGUgYSBwbHVnaW4gdGhhdCBzdXBwb3J0cyBpdCB3aGVuIGNsaWNrZWQuXG4kKGRvY3VtZW50KS5vbignY2xpY2suemYudHJpZ2dlcicsICdbZGF0YS10b2dnbGVdJywgZnVuY3Rpb24oKSB7XG4gIHRyaWdnZXJzKCQodGhpcyksICd0b2dnbGUnKTtcbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NhYmxlXSB3aWxsIHJlc3BvbmQgdG8gY2xvc2UuemYudHJpZ2dlciBldmVudHMuXG4kKGRvY3VtZW50KS5vbignY2xvc2UuemYudHJpZ2dlcicsICdbZGF0YS1jbG9zYWJsZV0nLCBmdW5jdGlvbihlKXtcbiAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgbGV0IGFuaW1hdGlvbiA9ICQodGhpcykuZGF0YSgnY2xvc2FibGUnKTtcblxuICBpZihhbmltYXRpb24gIT09ICcnKXtcbiAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlT3V0KCQodGhpcyksIGFuaW1hdGlvbiwgZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLnRyaWdnZXIoJ2Nsb3NlZC56ZicpO1xuICAgIH0pO1xuICB9ZWxzZXtcbiAgICAkKHRoaXMpLmZhZGVPdXQoKS50cmlnZ2VyKCdjbG9zZWQuemYnKTtcbiAgfVxufSk7XG5cbiQoZG9jdW1lbnQpLm9uKCdmb2N1cy56Zi50cmlnZ2VyIGJsdXIuemYudHJpZ2dlcicsICdbZGF0YS10b2dnbGUtZm9jdXNdJywgZnVuY3Rpb24oKSB7XG4gIGxldCBpZCA9ICQodGhpcykuZGF0YSgndG9nZ2xlLWZvY3VzJyk7XG4gICQoYCMke2lkfWApLnRyaWdnZXJIYW5kbGVyKCd0b2dnbGUuemYudHJpZ2dlcicsIFskKHRoaXMpXSk7XG59KTtcblxuLyoqXG4qIEZpcmVzIG9uY2UgYWZ0ZXIgYWxsIG90aGVyIHNjcmlwdHMgaGF2ZSBsb2FkZWRcbiogQGZ1bmN0aW9uXG4qIEBwcml2YXRlXG4qL1xuJCh3aW5kb3cpLmxvYWQoKCkgPT4ge1xuICBjaGVja0xpc3RlbmVycygpO1xufSk7XG5cbmZ1bmN0aW9uIGNoZWNrTGlzdGVuZXJzKCkge1xuICBldmVudHNMaXN0ZW5lcigpO1xuICByZXNpemVMaXN0ZW5lcigpO1xuICBzY3JvbGxMaXN0ZW5lcigpO1xuICBjbG9zZW1lTGlzdGVuZXIoKTtcbn1cblxuLy8qKioqKioqKiBvbmx5IGZpcmVzIHRoaXMgZnVuY3Rpb24gb25jZSBvbiBsb2FkLCBpZiB0aGVyZSdzIHNvbWV0aGluZyB0byB3YXRjaCAqKioqKioqKlxuZnVuY3Rpb24gY2xvc2VtZUxpc3RlbmVyKHBsdWdpbk5hbWUpIHtcbiAgdmFyIHlldGlCb3hlcyA9ICQoJ1tkYXRhLXlldGktYm94XScpLFxuICAgICAgcGx1Z05hbWVzID0gWydkcm9wZG93bicsICd0b29sdGlwJywgJ3JldmVhbCddO1xuXG4gIGlmKHBsdWdpbk5hbWUpe1xuICAgIGlmKHR5cGVvZiBwbHVnaW5OYW1lID09PSAnc3RyaW5nJyl7XG4gICAgICBwbHVnTmFtZXMucHVzaChwbHVnaW5OYW1lKTtcbiAgICB9ZWxzZSBpZih0eXBlb2YgcGx1Z2luTmFtZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHBsdWdpbk5hbWVbMF0gPT09ICdzdHJpbmcnKXtcbiAgICAgIHBsdWdOYW1lcy5jb25jYXQocGx1Z2luTmFtZSk7XG4gICAgfWVsc2V7XG4gICAgICBjb25zb2xlLmVycm9yKCdQbHVnaW4gbmFtZXMgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICB9XG4gIGlmKHlldGlCb3hlcy5sZW5ndGgpe1xuICAgIGxldCBsaXN0ZW5lcnMgPSBwbHVnTmFtZXMubWFwKChuYW1lKSA9PiB7XG4gICAgICByZXR1cm4gYGNsb3NlbWUuemYuJHtuYW1lfWA7XG4gICAgfSkuam9pbignICcpO1xuXG4gICAgJCh3aW5kb3cpLm9mZihsaXN0ZW5lcnMpLm9uKGxpc3RlbmVycywgZnVuY3Rpb24oZSwgcGx1Z2luSWQpe1xuICAgICAgbGV0IHBsdWdpbiA9IGUubmFtZXNwYWNlLnNwbGl0KCcuJylbMF07XG4gICAgICBsZXQgcGx1Z2lucyA9ICQoYFtkYXRhLSR7cGx1Z2lufV1gKS5ub3QoYFtkYXRhLXlldGktYm94PVwiJHtwbHVnaW5JZH1cIl1gKTtcblxuICAgICAgcGx1Z2lucy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBfdGhpcyA9ICQodGhpcyk7XG5cbiAgICAgICAgX3RoaXMudHJpZ2dlckhhbmRsZXIoJ2Nsb3NlLnpmLnRyaWdnZXInLCBbX3RoaXNdKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc2l6ZUxpc3RlbmVyKGRlYm91bmNlKXtcbiAgbGV0IHRpbWVyLFxuICAgICAgJG5vZGVzID0gJCgnW2RhdGEtcmVzaXplXScpO1xuICBpZigkbm9kZXMubGVuZ3RoKXtcbiAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUuemYudHJpZ2dlcicpXG4gICAgLm9uKCdyZXNpemUuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICh0aW1lcikgeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG5cbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuXG4gICAgICAgIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsvL2ZhbGxiYWNrIGZvciBJRSA5XG4gICAgICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgcmVzaXplIGV2ZW50XG4gICAgICAgICRub2Rlcy5hdHRyKCdkYXRhLWV2ZW50cycsIFwicmVzaXplXCIpO1xuICAgICAgfSwgZGVib3VuY2UgfHwgMTApOy8vZGVmYXVsdCB0aW1lIHRvIGVtaXQgcmVzaXplIGV2ZW50XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2Nyb2xsTGlzdGVuZXIoZGVib3VuY2Upe1xuICBsZXQgdGltZXIsXG4gICAgICAkbm9kZXMgPSAkKCdbZGF0YS1zY3JvbGxdJyk7XG4gIGlmKCRub2Rlcy5sZW5ndGgpe1xuICAgICQod2luZG93KS5vZmYoJ3Njcm9sbC56Zi50cmlnZ2VyJylcbiAgICAub24oJ3Njcm9sbC56Zi50cmlnZ2VyJywgZnVuY3Rpb24oZSl7XG4gICAgICBpZih0aW1lcil7IGNsZWFyVGltZW91dCh0aW1lcik7IH1cblxuICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgaWYoIU11dGF0aW9uT2JzZXJ2ZXIpey8vZmFsbGJhY2sgZm9yIElFIDlcbiAgICAgICAgICAkbm9kZXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignc2Nyb2xsbWUuemYudHJpZ2dlcicpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSBzY3JvbGwgZXZlbnRcbiAgICAgICAgJG5vZGVzLmF0dHIoJ2RhdGEtZXZlbnRzJywgXCJzY3JvbGxcIik7XG4gICAgICB9LCBkZWJvdW5jZSB8fCAxMCk7Ly9kZWZhdWx0IHRpbWUgdG8gZW1pdCBzY3JvbGwgZXZlbnRcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBldmVudHNMaXN0ZW5lcigpIHtcbiAgaWYoIU11dGF0aW9uT2JzZXJ2ZXIpeyByZXR1cm4gZmFsc2U7IH1cbiAgbGV0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtcmVzaXplXSwgW2RhdGEtc2Nyb2xsXSwgW2RhdGEtbXV0YXRlXScpO1xuXG4gIC8vZWxlbWVudCBjYWxsYmFja1xuICB2YXIgbGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbiA9IGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkc0xpc3QpIHtcbiAgICB2YXIgJHRhcmdldCA9ICQobXV0YXRpb25SZWNvcmRzTGlzdFswXS50YXJnZXQpO1xuICAgIC8vdHJpZ2dlciB0aGUgZXZlbnQgaGFuZGxlciBmb3IgdGhlIGVsZW1lbnQgZGVwZW5kaW5nIG9uIHR5cGVcbiAgICBzd2l0Y2ggKCR0YXJnZXQuYXR0cihcImRhdGEtZXZlbnRzXCIpKSB7XG5cbiAgICAgIGNhc2UgXCJyZXNpemVcIiA6XG4gICAgICAkdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXRdKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFwic2Nyb2xsXCIgOlxuICAgICAgJHRhcmdldC50cmlnZ2VySGFuZGxlcignc2Nyb2xsbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0LCB3aW5kb3cucGFnZVlPZmZzZXRdKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgICAvLyBjYXNlIFwibXV0YXRlXCIgOlxuICAgICAgLy8gY29uc29sZS5sb2coJ211dGF0ZScsICR0YXJnZXQpO1xuICAgICAgLy8gJHRhcmdldC50cmlnZ2VySGFuZGxlcignbXV0YXRlLnpmLnRyaWdnZXInKTtcbiAgICAgIC8vXG4gICAgICAvLyAvL21ha2Ugc3VyZSB3ZSBkb24ndCBnZXQgc3R1Y2sgaW4gYW4gaW5maW5pdGUgbG9vcCBmcm9tIHNsb3BweSBjb2RlaW5nXG4gICAgICAvLyBpZiAoJHRhcmdldC5pbmRleCgnW2RhdGEtbXV0YXRlXScpID09ICQoXCJbZGF0YS1tdXRhdGVdXCIpLmxlbmd0aC0xKSB7XG4gICAgICAvLyAgIGRvbU11dGF0aW9uT2JzZXJ2ZXIoKTtcbiAgICAgIC8vIH1cbiAgICAgIC8vIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0IDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIC8vbm90aGluZ1xuICAgIH1cbiAgfVxuXG4gIGlmKG5vZGVzLmxlbmd0aCl7XG4gICAgLy9mb3IgZWFjaCBlbGVtZW50IHRoYXQgbmVlZHMgdG8gbGlzdGVuIGZvciByZXNpemluZywgc2Nyb2xsaW5nLCAob3IgY29taW5nIHNvb24gbXV0YXRpb24pIGFkZCBhIHNpbmdsZSBvYnNlcnZlclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG5vZGVzLmxlbmd0aC0xOyBpKyspIHtcbiAgICAgIGxldCBlbGVtZW50T2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihsaXN0ZW5pbmdFbGVtZW50c011dGF0aW9uKTtcbiAgICAgIGVsZW1lbnRPYnNlcnZlci5vYnNlcnZlKG5vZGVzW2ldLCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogZmFsc2UsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOmZhbHNlLCBhdHRyaWJ1dGVGaWx0ZXI6W1wiZGF0YS1ldmVudHNcIl19KTtcbiAgICB9XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFtQSF1cbi8vIEZvdW5kYXRpb24uQ2hlY2tXYXRjaGVycyA9IGNoZWNrV2F0Y2hlcnM7XG5Gb3VuZGF0aW9uLklIZWFyWW91ID0gY2hlY2tMaXN0ZW5lcnM7XG4vLyBGb3VuZGF0aW9uLklTZWVZb3UgPSBzY3JvbGxMaXN0ZW5lcjtcbi8vIEZvdW5kYXRpb24uSUZlZWxZb3UgPSBjbG9zZW1lTGlzdGVuZXI7XG5cbn0oalF1ZXJ5KTtcblxuLy8gZnVuY3Rpb24gZG9tTXV0YXRpb25PYnNlcnZlcihkZWJvdW5jZSkge1xuLy8gICAvLyAhISEgVGhpcyBpcyBjb21pbmcgc29vbiBhbmQgbmVlZHMgbW9yZSB3b3JrOyBub3QgYWN0aXZlICAhISEgLy9cbi8vICAgdmFyIHRpbWVyLFxuLy8gICBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW11dGF0ZV0nKTtcbi8vICAgLy9cbi8vICAgaWYgKG5vZGVzLmxlbmd0aCkge1xuLy8gICAgIC8vIHZhciBNdXRhdGlvbk9ic2VydmVyID0gKGZ1bmN0aW9uICgpIHtcbi8vICAgICAvLyAgIHZhciBwcmVmaXhlcyA9IFsnV2ViS2l0JywgJ01veicsICdPJywgJ01zJywgJyddO1xuLy8gICAgIC8vICAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAvLyAgICAgaWYgKHByZWZpeGVzW2ldICsgJ011dGF0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdykge1xuLy8gICAgIC8vICAgICAgIHJldHVybiB3aW5kb3dbcHJlZml4ZXNbaV0gKyAnTXV0YXRpb25PYnNlcnZlciddO1xuLy8gICAgIC8vICAgICB9XG4vLyAgICAgLy8gICB9XG4vLyAgICAgLy8gICByZXR1cm4gZmFsc2U7XG4vLyAgICAgLy8gfSgpKTtcbi8vXG4vL1xuLy8gICAgIC8vZm9yIHRoZSBib2R5LCB3ZSBuZWVkIHRvIGxpc3RlbiBmb3IgYWxsIGNoYW5nZXMgZWZmZWN0aW5nIHRoZSBzdHlsZSBhbmQgY2xhc3MgYXR0cmlidXRlc1xuLy8gICAgIHZhciBib2R5T2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihib2R5TXV0YXRpb24pO1xuLy8gICAgIGJvZHlPYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTp0cnVlLCBhdHRyaWJ1dGVGaWx0ZXI6W1wic3R5bGVcIiwgXCJjbGFzc1wiXX0pO1xuLy9cbi8vXG4vLyAgICAgLy9ib2R5IGNhbGxiYWNrXG4vLyAgICAgZnVuY3Rpb24gYm9keU11dGF0aW9uKG11dGF0ZSkge1xuLy8gICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIG11dGF0aW9uIGV2ZW50XG4vLyAgICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuLy9cbi8vICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbi8vICAgICAgICAgYm9keU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbi8vICAgICAgICAgJCgnW2RhdGEtbXV0YXRlXScpLmF0dHIoJ2RhdGEtZXZlbnRzJyxcIm11dGF0ZVwiKTtcbi8vICAgICAgIH0sIGRlYm91bmNlIHx8IDE1MCk7XG4vLyAgICAgfVxuLy8gICB9XG4vLyB9XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogRHJvcGRvd24gbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmRyb3Bkb3duXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICovXG5cbmNsYXNzIERyb3Bkb3duIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBkcm9wZG93bi5cbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93bi5cbiAgICogICAgICAgIE9iamVjdCBzaG91bGQgYmUgb2YgdGhlIGRyb3Bkb3duIHBhbmVsLCByYXRoZXIgdGhhbiBpdHMgYW5jaG9yLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIERyb3Bkb3duLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnRHJvcGRvd24nKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdEcm9wZG93bicsIHtcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxuICAgICAgJ1RBQic6ICd0YWJfZm9yd2FyZCcsXG4gICAgICAnU0hJRlRfVEFCJzogJ3RhYl9iYWNrd2FyZCdcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luIGJ5IHNldHRpbmcvY2hlY2tpbmcgb3B0aW9ucyBhbmQgYXR0cmlidXRlcywgYWRkaW5nIGhlbHBlciB2YXJpYWJsZXMsIGFuZCBzYXZpbmcgdGhlIGFuY2hvci5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgJGlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgdGhpcy4kYW5jaG9yID0gJChgW2RhdGEtdG9nZ2xlPVwiJHskaWR9XCJdYCkgfHwgJChgW2RhdGEtb3Blbj1cIiR7JGlkfVwiXWApO1xuICAgIHRoaXMuJGFuY2hvci5hdHRyKHtcbiAgICAgICdhcmlhLWNvbnRyb2xzJzogJGlkLFxuICAgICAgJ2RhdGEtaXMtZm9jdXMnOiBmYWxzZSxcbiAgICAgICdkYXRhLXlldGktYm94JzogJGlkLFxuICAgICAgJ2FyaWEtaGFzcG9wdXAnOiB0cnVlLFxuICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBmYWxzZVxuXG4gICAgfSk7XG5cbiAgICB0aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzcyA9IHRoaXMuZ2V0UG9zaXRpb25DbGFzcygpO1xuICAgIHRoaXMuY291bnRlciA9IDQ7XG4gICAgdGhpcy51c2VkUG9zaXRpb25zID0gW107XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcbiAgICAgICdhcmlhLWhpZGRlbic6ICd0cnVlJyxcbiAgICAgICdkYXRhLXlldGktYm94JzogJGlkLFxuICAgICAgJ2RhdGEtcmVzaXplJzogJGlkLFxuICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IHRoaXMuJGFuY2hvclswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdkZC1hbmNob3InKVxuICAgIH0pO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB0byBkZXRlcm1pbmUgY3VycmVudCBvcmllbnRhdGlvbiBvZiBkcm9wZG93biBwYW5lLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHJldHVybnMge1N0cmluZ30gcG9zaXRpb24gLSBzdHJpbmcgdmFsdWUgb2YgYSBwb3NpdGlvbiBjbGFzcy5cbiAgICovXG4gIGdldFBvc2l0aW9uQ2xhc3MoKSB7XG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goL1xcYih0b3B8bGVmdHxyaWdodClcXGIvZyk7XG4gICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24gPyBwb3NpdGlvblswXSA6ICcnO1xuICAgIHJldHVybiBwb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGp1c3RzIHRoZSBkcm9wZG93biBwYW5lcyBvcmllbnRhdGlvbiBieSBhZGRpbmcvcmVtb3ZpbmcgcG9zaXRpb25pbmcgY2xhc3Nlcy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIHBvc2l0aW9uIGNsYXNzIHRvIHJlbW92ZS5cbiAgICovXG4gIF9yZXBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgdGhpcy51c2VkUG9zaXRpb25zLnB1c2gocG9zaXRpb24gPyBwb3NpdGlvbiA6ICdib3R0b20nKTtcbiAgICAvL2RlZmF1bHQsIHRyeSBzd2l0Y2hpbmcgdG8gb3Bwb3NpdGUgc2lkZVxuICAgIGlmKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygndG9wJyk7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICd0b3AnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pXG4gICAgICAgICAgLmFkZENsYXNzKCdyaWdodCcpO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAncmlnaHQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbilcbiAgICAgICAgICAuYWRkQ2xhc3MoJ2xlZnQnKTtcbiAgICB9XG5cbiAgICAvL2lmIGRlZmF1bHQgY2hhbmdlIGRpZG4ndCB3b3JrLCB0cnkgYm90dG9tIG9yIGxlZnQgZmlyc3RcbiAgICBlbHNlIGlmKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnbGVmdCcpO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbilcbiAgICAgICAgICAuYWRkQ2xhc3MoJ2xlZnQnKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH1cbiAgICAvL2lmIG5vdGhpbmcgY2xlYXJlZCwgc2V0IHRvIGJvdHRvbVxuICAgIGVsc2V7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgdGhpcy5jbGFzc0NoYW5nZWQgPSB0cnVlO1xuICAgIHRoaXMuY291bnRlci0tO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiBvZiB0aGUgZHJvcGRvd24gcGFuZSwgY2hlY2tzIGZvciBjb2xsaXNpb25zLlxuICAgKiBSZWN1cnNpdmVseSBjYWxscyBpdHNlbGYgaWYgYSBjb2xsaXNpb24gaXMgZGV0ZWN0ZWQsIHdpdGggYSBuZXcgcG9zaXRpb24gY2xhc3MuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldFBvc2l0aW9uKCkge1xuICAgIGlmKHRoaXMuJGFuY2hvci5hdHRyKCdhcmlhLWV4cGFuZGVkJykgPT09ICdmYWxzZScpeyByZXR1cm4gZmFsc2U7IH1cbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLmdldFBvc2l0aW9uQ2xhc3MoKSxcbiAgICAgICAgJGVsZURpbXMgPSBGb3VuZGF0aW9uLkJveC5HZXREaW1lbnNpb25zKHRoaXMuJGVsZW1lbnQpLFxuICAgICAgICAkYW5jaG9yRGltcyA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcy4kYW5jaG9yKSxcbiAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICBkaXJlY3Rpb24gPSAocG9zaXRpb24gPT09ICdsZWZ0JyA/ICdsZWZ0JyA6ICgocG9zaXRpb24gPT09ICdyaWdodCcpID8gJ2xlZnQnIDogJ3RvcCcpKSxcbiAgICAgICAgcGFyYW0gPSAoZGlyZWN0aW9uID09PSAndG9wJykgPyAnaGVpZ2h0JyA6ICd3aWR0aCcsXG4gICAgICAgIG9mZnNldCA9IChwYXJhbSA9PT0gJ2hlaWdodCcpID8gdGhpcy5vcHRpb25zLnZPZmZzZXQgOiB0aGlzLm9wdGlvbnMuaE9mZnNldDtcblxuICAgIGlmKCgkZWxlRGltcy53aWR0aCA+PSAkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoKSB8fCAoIXRoaXMuY291bnRlciAmJiAhRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLiRlbGVtZW50KSkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmZzZXQoRm91bmRhdGlvbi5Cb3guR2V0T2Zmc2V0cyh0aGlzLiRlbGVtZW50LCB0aGlzLiRhbmNob3IsICdjZW50ZXIgYm90dG9tJywgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0LCB0cnVlKSkuY3NzKHtcbiAgICAgICAgJ3dpZHRoJzogJGVsZURpbXMud2luZG93RGltcy53aWR0aCAtICh0aGlzLm9wdGlvbnMuaE9mZnNldCAqIDIpLFxuICAgICAgICAnaGVpZ2h0JzogJ2F1dG8nXG4gICAgICB9KTtcbiAgICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50Lm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMuJGVsZW1lbnQsIHRoaXMuJGFuY2hvciwgcG9zaXRpb24sIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCkpO1xuXG4gICAgd2hpbGUoIUZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UodGhpcy4kZWxlbWVudCkgJiYgdGhpcy5jb3VudGVyKXtcbiAgICAgIHRoaXMuX3JlcG9zaXRpb24ocG9zaXRpb24pO1xuICAgICAgdGhpcy5fc2V0UG9zaXRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIGVsZW1lbnQgdXRpbGl6aW5nIHRoZSB0cmlnZ2VycyB1dGlsaXR5IGxpYnJhcnkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiB0aGlzLl9zZXRQb3NpdGlvbi5iaW5kKHRoaXMpXG4gICAgfSk7XG5cbiAgICBpZih0aGlzLm9wdGlvbnMuaG92ZXIpe1xuICAgICAgdGhpcy4kYW5jaG9yLm9mZignbW91c2VlbnRlci56Zi5kcm9wZG93biBtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJylcbiAgICAgICAgICAub24oJ21vdXNlZW50ZXIuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgX3RoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJywgdHJ1ZSk7XG4gICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xuICAgICAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInLCBmYWxzZSk7XG4gICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xuICAgICAgICAgIH0pO1xuICAgICAgaWYodGhpcy5vcHRpb25zLmhvdmVyUGFuZSl7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duIG1vdXNlbGVhdmUuemYuZHJvcGRvd24nKVxuICAgICAgICAgICAgLm9uKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XG4gICAgICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJywgZmFsc2UpO1xuICAgICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuJGFuY2hvci5hZGQodGhpcy4kZWxlbWVudCkub24oJ2tleWRvd24uemYuZHJvcGRvd24nLCBmdW5jdGlvbihlKSB7XG5cbiAgICAgIHZhciAkdGFyZ2V0ID0gJCh0aGlzKSxcbiAgICAgICAgdmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKF90aGlzLiRlbGVtZW50KTtcblxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ0Ryb3Bkb3duJywge1xuICAgICAgICB0YWJfZm9yd2FyZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKF90aGlzLiRlbGVtZW50LmZpbmQoJzpmb2N1cycpLmlzKHZpc2libGVGb2N1c2FibGVFbGVtZW50cy5lcSgtMSkpKSB7IC8vIGxlZnQgbW9kYWwgZG93bndhcmRzLCBzZXR0aW5nIGZvY3VzIHRvIGZpcnN0IGVsZW1lbnRcbiAgICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLnRyYXBGb2N1cykgeyAvLyBpZiBmb2N1cyBzaGFsbCBiZSB0cmFwcGVkXG4gICAgICAgICAgICAgIHZpc2libGVGb2N1c2FibGVFbGVtZW50cy5lcSgwKS5mb2N1cygpO1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9IGVsc2UgeyAvLyBpZiBmb2N1cyBpcyBub3QgdHJhcHBlZCwgY2xvc2UgZHJvcGRvd24gb24gZm9jdXMgb3V0XG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0YWJfYmFja3dhcmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyh2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoMCkpIHx8IF90aGlzLiRlbGVtZW50LmlzKCc6Zm9jdXMnKSkgeyAvLyBsZWZ0IG1vZGFsIHVwd2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gbGFzdCBlbGVtZW50XG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy50cmFwRm9jdXMpIHsgLy8gaWYgZm9jdXMgc2hhbGwgYmUgdHJhcHBlZFxuICAgICAgICAgICAgICB2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpLmZvY3VzKCk7XG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7IC8vIGlmIGZvY3VzIGlzIG5vdCB0cmFwcGVkLCBjbG9zZSBkcm9wZG93biBvbiBmb2N1cyBvdXRcbiAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICgkdGFyZ2V0LmlzKF90aGlzLiRhbmNob3IpKSB7XG4gICAgICAgICAgICBfdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICBfdGhpcy4kZWxlbWVudC5hdHRyKCd0YWJpbmRleCcsIC0xKS5mb2N1cygpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgX3RoaXMuJGFuY2hvci5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGFuIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGJvZHkgdG8gY2xvc2UgYW55IGRyb3Bkb3ducyBvbiBhIGNsaWNrLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9hZGRCb2R5SGFuZGxlcigpIHtcbiAgICAgdmFyICRib2R5ID0gJChkb2N1bWVudC5ib2R5KS5ub3QodGhpcy4kZWxlbWVudCksXG4gICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICRib2R5Lm9mZignY2xpY2suemYuZHJvcGRvd24nKVxuICAgICAgICAgIC5vbignY2xpY2suemYuZHJvcGRvd24nLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgIGlmKF90aGlzLiRhbmNob3IuaXMoZS50YXJnZXQpIHx8IF90aGlzLiRhbmNob3IuZmluZChlLnRhcmdldCkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKF90aGlzLiRlbGVtZW50LmZpbmQoZS50YXJnZXQpLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgJGJvZHkub2ZmKCdjbGljay56Zi5kcm9wZG93bicpO1xuICAgICAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBkcm9wZG93biBwYW5lLCBhbmQgZmlyZXMgYSBidWJibGluZyBldmVudCB0byBjbG9zZSBvdGhlciBkcm9wZG93bnMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgRHJvcGRvd24jY2xvc2VtZVxuICAgKiBAZmlyZXMgRHJvcGRvd24jc2hvd1xuICAgKi9cbiAgb3BlbigpIHtcbiAgICAvLyB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIC8qKlxuICAgICAqIEZpcmVzIHRvIGNsb3NlIG90aGVyIG9wZW4gZHJvcGRvd25zXG4gICAgICogQGV2ZW50IERyb3Bkb3duI2Nsb3NlbWVcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlbWUuemYuZHJvcGRvd24nLCB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJykpO1xuICAgIHRoaXMuJGFuY2hvci5hZGRDbGFzcygnaG92ZXInKVxuICAgICAgICAuYXR0cih7J2FyaWEtZXhwYW5kZWQnOiB0cnVlfSk7XG4gICAgLy8gdGhpcy4kZWxlbWVudC8qLnNob3coKSovO1xuICAgIHRoaXMuX3NldFBvc2l0aW9uKCk7XG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnaXMtb3BlbicpXG4gICAgICAgIC5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pO1xuXG4gICAgaWYodGhpcy5vcHRpb25zLmF1dG9Gb2N1cyl7XG4gICAgICB2YXIgJGZvY3VzYWJsZSA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcbiAgICAgIGlmKCRmb2N1c2FibGUubGVuZ3RoKXtcbiAgICAgICAgJGZvY3VzYWJsZS5lcSgwKS5mb2N1cygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2speyB0aGlzLl9hZGRCb2R5SGFuZGxlcigpOyB9XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyBvbmNlIHRoZSBkcm9wZG93biBpcyB2aXNpYmxlLlxuICAgICAqIEBldmVudCBEcm9wZG93biNzaG93XG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzaG93LnpmLmRyb3Bkb3duJywgW3RoaXMuJGVsZW1lbnRdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIG9wZW4gZHJvcGRvd24gcGFuZS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBEcm9wZG93biNoaWRlXG4gICAqL1xuICBjbG9zZSgpIHtcbiAgICBpZighdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKXtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcygnaXMtb3BlbicpXG4gICAgICAgIC5hdHRyKHsnYXJpYS1oaWRkZW4nOiB0cnVlfSk7XG5cbiAgICB0aGlzLiRhbmNob3IucmVtb3ZlQ2xhc3MoJ2hvdmVyJylcbiAgICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSk7XG5cbiAgICBpZih0aGlzLmNsYXNzQ2hhbmdlZCl7XG4gICAgICB2YXIgY3VyUG9zaXRpb25DbGFzcyA9IHRoaXMuZ2V0UG9zaXRpb25DbGFzcygpO1xuICAgICAgaWYoY3VyUG9zaXRpb25DbGFzcyl7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoY3VyUG9zaXRpb25DbGFzcyk7XG4gICAgICB9XG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzKVxuICAgICAgICAgIC8qLmhpZGUoKSovLmNzcyh7aGVpZ2h0OiAnJywgd2lkdGg6ICcnfSk7XG4gICAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5jb3VudGVyID0gNDtcbiAgICAgIHRoaXMudXNlZFBvc2l0aW9ucy5sZW5ndGggPSAwO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2hpZGUuemYuZHJvcGRvd24nLCBbdGhpcy4kZWxlbWVudF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIGRyb3Bkb3duIHBhbmUncyB2aXNpYmlsaXR5LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHRvZ2dsZSgpIHtcbiAgICBpZih0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpe1xuICAgICAgaWYodGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJykpIHJldHVybjtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgZHJvcGRvd24uXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXInKS5oaWRlKCk7XG4gICAgdGhpcy4kYW5jaG9yLm9mZignLnpmLmRyb3Bkb3duJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuRHJvcGRvd24uZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBkZWxheSBvcGVuaW5nIGEgc3VibWVudSBvbiBob3ZlciBldmVudC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAyNTBcbiAgICovXG4gIGhvdmVyRGVsYXk6IDI1MCxcbiAgLyoqXG4gICAqIEFsbG93IHN1Ym1lbnVzIHRvIG9wZW4gb24gaG92ZXIgZXZlbnRzXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGhvdmVyOiBmYWxzZSxcbiAgLyoqXG4gICAqIERvbid0IGNsb3NlIGRyb3Bkb3duIHdoZW4gaG92ZXJpbmcgb3ZlciBkcm9wZG93biBwYW5lXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgaG92ZXJQYW5lOiBmYWxzZSxcbiAgLyoqXG4gICAqIE51bWJlciBvZiBwaXhlbHMgYmV0d2VlbiB0aGUgZHJvcGRvd24gcGFuZSBhbmQgdGhlIHRyaWdnZXJpbmcgZWxlbWVudCBvbiBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDFcbiAgICovXG4gIHZPZmZzZXQ6IDEsXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcGl4ZWxzIGJldHdlZW4gdGhlIGRyb3Bkb3duIHBhbmUgYW5kIHRoZSB0cmlnZ2VyaW5nIGVsZW1lbnQgb24gb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxXG4gICAqL1xuICBoT2Zmc2V0OiAxLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byBhZGp1c3Qgb3BlbiBwb3NpdGlvbi4gSlMgd2lsbCB0ZXN0IGFuZCBmaWxsIHRoaXMgaW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3RvcCdcbiAgICovXG4gIHBvc2l0aW9uQ2xhc3M6ICcnLFxuICAvKipcbiAgICogQWxsb3cgdGhlIHBsdWdpbiB0byB0cmFwIGZvY3VzIHRvIHRoZSBkcm9wZG93biBwYW5lIGlmIG9wZW5lZCB3aXRoIGtleWJvYXJkIGNvbW1hbmRzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICB0cmFwRm9jdXM6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3cgdGhlIHBsdWdpbiB0byBzZXQgZm9jdXMgdG8gdGhlIGZpcnN0IGZvY3VzYWJsZSBlbGVtZW50IHdpdGhpbiB0aGUgcGFuZSwgcmVnYXJkbGVzcyBvZiBtZXRob2Qgb2Ygb3BlbmluZy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBhdXRvRm9jdXM6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3dzIGEgY2xpY2sgb24gdGhlIGJvZHkgdG8gY2xvc2UgdGhlIGRyb3Bkb3duLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IGZhbHNlXG59XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihEcm9wZG93biwgJ0Ryb3Bkb3duJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBEcm9wZG93bk1lbnUgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmRyb3Bkb3duLW1lbnVcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm5lc3RcbiAqL1xuXG5jbGFzcyBEcm9wZG93bk1lbnUge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBEcm9wZG93bk1lbnUuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgRHJvcGRvd25NZW51I2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhIGRyb3Bkb3duIG1lbnUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRHJvcGRvd25NZW51LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICBGb3VuZGF0aW9uLk5lc3QuRmVhdGhlcih0aGlzLiRlbGVtZW50LCAnZHJvcGRvd24nKTtcbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdEcm9wZG93bk1lbnUnKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdEcm9wZG93bk1lbnUnLCB7XG4gICAgICAnRU5URVInOiAnb3BlbicsXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXG4gICAgICAnQVJST1dfUklHSFQnOiAnbmV4dCcsXG4gICAgICAnQVJST1dfVVAnOiAndXAnLFxuICAgICAgJ0FSUk9XX0RPV04nOiAnZG93bicsXG4gICAgICAnQVJST1dfTEVGVCc6ICdwcmV2aW91cycsXG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJ1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBwbHVnaW4sIGFuZCBjYWxscyBfcHJlcGFyZU1lbnVcbiAgICogQHByaXZhdGVcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgc3VicyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcbiAgICB0aGlzLiRlbGVtZW50LmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKS5hZGRDbGFzcygnZmlyc3Qtc3ViJyk7XG5cbiAgICB0aGlzLiRtZW51SXRlbXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tyb2xlPVwibWVudWl0ZW1cIl0nKTtcbiAgICB0aGlzLiR0YWJzID0gdGhpcy4kZWxlbWVudC5jaGlsZHJlbignW3JvbGU9XCJtZW51aXRlbVwiXScpO1xuICAgIHRoaXMuJHRhYnMuZmluZCgndWwuaXMtZHJvcGRvd24tc3VibWVudScpLmFkZENsYXNzKHRoaXMub3B0aW9ucy52ZXJ0aWNhbENsYXNzKTtcblxuICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMub3B0aW9ucy5yaWdodENsYXNzKSB8fCB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAncmlnaHQnIHx8IEZvdW5kYXRpb24ucnRsKCkpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPSAncmlnaHQnO1xuICAgICAgc3Vicy5hZGRDbGFzcygnb3BlbnMtbGVmdCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdWJzLmFkZENsYXNzKCdvcGVucy1yaWdodCcpO1xuICAgIH1cbiAgICB0aGlzLmNoYW5nZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfTtcbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIGVsZW1lbnRzIHdpdGhpbiB0aGUgbWVudVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgaGFzVG91Y2ggPSAnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cgfHwgKHR5cGVvZiB3aW5kb3cub250b3VjaHN0YXJ0ICE9PSAndW5kZWZpbmVkJyksXG4gICAgICAgIHBhckNsYXNzID0gJ2lzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JztcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xpY2tPcGVuIHx8IGhhc1RvdWNoKSB7XG4gICAgICB0aGlzLiRtZW51SXRlbXMub24oJ2NsaWNrLnpmLmRyb3Bkb3dubWVudSB0b3VjaHN0YXJ0LnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyICRlbGVtID0gJChlLnRhcmdldCkucGFyZW50c1VudGlsKCd1bCcsIGAuJHtwYXJDbGFzc31gKSxcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKSxcbiAgICAgICAgICAgIGhhc0NsaWNrZWQgPSAkZWxlbS5hdHRyKCdkYXRhLWlzLWNsaWNrJykgPT09ICd0cnVlJyxcbiAgICAgICAgICAgICRzdWIgPSAkZWxlbS5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKTtcblxuICAgICAgICBpZiAoaGFzU3ViKSB7XG4gICAgICAgICAgaWYgKGhhc0NsaWNrZWQpIHtcbiAgICAgICAgICAgIGlmICghX3RoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgfHwgKCFfdGhpcy5vcHRpb25zLmNsaWNrT3BlbiAmJiAhaGFzVG91Y2gpIHx8IChfdGhpcy5vcHRpb25zLmZvcmNlRm9sbG93ICYmIGhhc1RvdWNoKSkgeyByZXR1cm47IH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpKTtcbiAgICAgICAgICAgICRlbGVtLmFkZCgkZWxlbS5wYXJlbnRzVW50aWwoX3RoaXMuJGVsZW1lbnQsIGAuJHtwYXJDbGFzc31gKSkuYXR0cignZGF0YS1pcy1jbGljaycsIHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHsgcmV0dXJuOyB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kaXNhYmxlSG92ZXIpIHtcbiAgICAgIHRoaXMuJG1lbnVJdGVtcy5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgICBoYXNTdWIgPSAkZWxlbS5oYXNDbGFzcyhwYXJDbGFzcyk7XG5cbiAgICAgICAgaWYgKGhhc1N1Yikge1xuICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy5kZWxheSk7XG4gICAgICAgICAgX3RoaXMuZGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuX3Nob3coJGVsZW0uY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykpO1xuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSk7XG4gICAgICAgIH1cbiAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyICRlbGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKTtcbiAgICAgICAgaWYgKGhhc1N1YiAmJiBfdGhpcy5vcHRpb25zLmF1dG9jbG9zZSkge1xuICAgICAgICAgIGlmICgkZWxlbS5hdHRyKCdkYXRhLWlzLWNsaWNrJykgPT09ICd0cnVlJyAmJiBfdGhpcy5vcHRpb25zLmNsaWNrT3BlbikgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy5kZWxheSk7XG4gICAgICAgICAgX3RoaXMuZGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuY2xvc2luZ1RpbWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy4kbWVudUl0ZW1zLm9uKCdrZXlkb3duLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkZWxlbWVudCA9ICQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCAnW3JvbGU9XCJtZW51aXRlbVwiXScpLFxuICAgICAgICAgIGlzVGFiID0gX3RoaXMuJHRhYnMuaW5kZXgoJGVsZW1lbnQpID4gLTEsXG4gICAgICAgICAgJGVsZW1lbnRzID0gaXNUYWIgPyBfdGhpcy4kdGFicyA6ICRlbGVtZW50LnNpYmxpbmdzKCdsaScpLmFkZCgkZWxlbWVudCksXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxuICAgICAgICAgICRuZXh0RWxlbWVudDtcblxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoaS0xKTtcbiAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudHMuZXEoaSsxKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB2YXIgbmV4dFNpYmxpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCEkZWxlbWVudC5pcygnOmxhc3QtY2hpbGQnKSkgJG5leHRFbGVtZW50LmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgIH0sIHByZXZTaWJsaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRwcmV2RWxlbWVudC5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XG4gICAgICB9LCBvcGVuU3ViID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc3ViID0gJGVsZW1lbnQuY2hpbGRyZW4oJ3VsLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKTtcbiAgICAgICAgaWYgKCRzdWIubGVuZ3RoKSB7XG4gICAgICAgICAgX3RoaXMuX3Nob3coJHN1Yik7XG4gICAgICAgICAgJGVsZW1lbnQuZmluZCgnbGkgPiBhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgICAgfSBlbHNlIHsgcmV0dXJuOyB9XG4gICAgICB9LCBjbG9zZVN1YiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvL2lmICgkZWxlbWVudC5pcygnOmZpcnN0LWNoaWxkJykpIHtcbiAgICAgICAgdmFyIGNsb3NlID0gJGVsZW1lbnQucGFyZW50KCd1bCcpLnBhcmVudCgnbGknKTtcbiAgICAgICAgICBjbG9zZS5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XG4gICAgICAgICAgX3RoaXMuX2hpZGUoY2xvc2UpO1xuICAgICAgICAvL31cbiAgICAgIH07XG4gICAgICB2YXIgZnVuY3Rpb25zID0ge1xuICAgICAgICBvcGVuOiBvcGVuU3ViLFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMuX2hpZGUoX3RoaXMuJGVsZW1lbnQpO1xuICAgICAgICAgIF90aGlzLiRtZW51SXRlbXMuZmluZCgnYTpmaXJzdCcpLmZvY3VzKCk7IC8vIGZvY3VzIHRvIGZpcnN0IGVsZW1lbnRcbiAgICAgICAgfSxcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGlmIChpc1RhYikge1xuICAgICAgICBpZiAoX3RoaXMudmVydGljYWwpIHsgLy8gdmVydGljYWwgbWVudVxuICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnKSB7IC8vIGxlZnQgYWxpZ25lZFxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgICB1cDogcHJldlNpYmxpbmcsXG4gICAgICAgICAgICAgIG5leHQ6IG9wZW5TdWIsXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBjbG9zZVN1YlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHsgLy8gcmlnaHQgYWxpZ25lZFxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgICB1cDogcHJldlNpYmxpbmcsXG4gICAgICAgICAgICAgIG5leHQ6IGNsb3NlU3ViLFxuICAgICAgICAgICAgICBwcmV2aW91czogb3BlblN1YlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgeyAvLyBob3Jpem9udGFsIG1lbnVcbiAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgIG5leHQ6IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgcHJldmlvdXM6IHByZXZTaWJsaW5nLFxuICAgICAgICAgICAgZG93bjogb3BlblN1YixcbiAgICAgICAgICAgIHVwOiBjbG9zZVN1YlxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBub3QgdGFicyAtPiBvbmUgc3ViXG4gICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnKSB7IC8vIGxlZnQgYWxpZ25lZFxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgbmV4dDogb3BlblN1YixcbiAgICAgICAgICAgIHByZXZpb3VzOiBjbG9zZVN1YixcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7IC8vIHJpZ2h0IGFsaWduZWRcbiAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgIG5leHQ6IGNsb3NlU3ViLFxuICAgICAgICAgICAgcHJldmlvdXM6IG9wZW5TdWIsXG4gICAgICAgICAgICBkb3duOiBuZXh0U2libGluZyxcbiAgICAgICAgICAgIHVwOiBwcmV2U2libGluZ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnRHJvcGRvd25NZW51JywgZnVuY3Rpb25zKTtcblxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gZXZlbnQgaGFuZGxlciB0byB0aGUgYm9keSB0byBjbG9zZSBhbnkgZHJvcGRvd25zIG9uIGEgY2xpY2suXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEJvZHlIYW5kbGVyKCkge1xuICAgIHZhciAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSksXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAkYm9keS5vZmYoJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScpXG4gICAgICAgICAub24oJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgdmFyICRsaW5rID0gX3RoaXMuJGVsZW1lbnQuZmluZChlLnRhcmdldCk7XG4gICAgICAgICAgIGlmICgkbGluay5sZW5ndGgpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgICAgX3RoaXMuX2hpZGUoKTtcbiAgICAgICAgICAgJGJvZHkub2ZmKCdtb3VzZXVwLnpmLmRyb3Bkb3dubWVudSB0b3VjaGVuZC56Zi5kcm9wZG93bm1lbnUnKTtcbiAgICAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIGEgZHJvcGRvd24gcGFuZSwgYW5kIGNoZWNrcyBmb3IgY29sbGlzaW9ucyBmaXJzdC5cbiAgICogQHBhcmFtIHtqUXVlcnl9ICRzdWIgLSB1bCBlbGVtZW50IHRoYXQgaXMgYSBzdWJtZW51IHRvIHNob3dcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBmaXJlcyBEcm9wZG93bk1lbnUjc2hvd1xuICAgKi9cbiAgX3Nob3coJHN1Yikge1xuICAgIHZhciBpZHggPSB0aGlzLiR0YWJzLmluZGV4KHRoaXMuJHRhYnMuZmlsdGVyKGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICByZXR1cm4gJChlbCkuZmluZCgkc3ViKS5sZW5ndGggPiAwO1xuICAgIH0pKTtcbiAgICB2YXIgJHNpYnMgPSAkc3ViLnBhcmVudCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5zaWJsaW5ncygnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcbiAgICB0aGlzLl9oaWRlKCRzaWJzLCBpZHgpO1xuICAgICRzdWIuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpLmFkZENsYXNzKCdqcy1kcm9wZG93bi1hY3RpdmUnKS5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pXG4gICAgICAgIC5wYXJlbnQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpXG4gICAgICAgIC5hdHRyKHsnYXJpYS1leHBhbmRlZCc6IHRydWV9KTtcbiAgICB2YXIgY2xlYXIgPSBGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KCRzdWIsIG51bGwsIHRydWUpO1xuICAgIGlmICghY2xlYXIpIHtcbiAgICAgIHZhciBvbGRDbGFzcyA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdsZWZ0JyA/ICctcmlnaHQnIDogJy1sZWZ0JyxcbiAgICAgICAgICAkcGFyZW50TGkgPSAkc3ViLnBhcmVudCgnLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jyk7XG4gICAgICAkcGFyZW50TGkucmVtb3ZlQ2xhc3MoYG9wZW5zJHtvbGRDbGFzc31gKS5hZGRDbGFzcyhgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApO1xuICAgICAgY2xlYXIgPSBGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KCRzdWIsIG51bGwsIHRydWUpO1xuICAgICAgaWYgKCFjbGVhcikge1xuICAgICAgICAkcGFyZW50TGkucmVtb3ZlQ2xhc3MoYG9wZW5zLSR7dGhpcy5vcHRpb25zLmFsaWdubWVudH1gKS5hZGRDbGFzcygnb3BlbnMtaW5uZXInKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY2hhbmdlZCA9IHRydWU7XG4gICAgfVxuICAgICRzdWIuY3NzKCd2aXNpYmlsaXR5JywgJycpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7IHRoaXMuX2FkZEJvZHlIYW5kbGVyKCk7IH1cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBuZXcgZHJvcGRvd24gcGFuZSBpcyB2aXNpYmxlLlxuICAgICAqIEBldmVudCBEcm9wZG93bk1lbnUjc2hvd1xuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2hvdy56Zi5kcm9wZG93bm1lbnUnLCBbJHN1Yl0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhpZGVzIGEgc2luZ2xlLCBjdXJyZW50bHkgb3BlbiBkcm9wZG93biBwYW5lLCBpZiBwYXNzZWQgYSBwYXJhbWV0ZXIsIG90aGVyd2lzZSwgaGlkZXMgZXZlcnl0aGluZy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbSAtIGVsZW1lbnQgd2l0aCBhIHN1Ym1lbnUgdG8gaGlkZVxuICAgKiBAcGFyYW0ge051bWJlcn0gaWR4IC0gaW5kZXggb2YgdGhlICR0YWJzIGNvbGxlY3Rpb24gdG8gaGlkZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2hpZGUoJGVsZW0sIGlkeCkge1xuICAgIHZhciAkdG9DbG9zZTtcbiAgICBpZiAoJGVsZW0gJiYgJGVsZW0ubGVuZ3RoKSB7XG4gICAgICAkdG9DbG9zZSA9ICRlbGVtO1xuICAgIH0gZWxzZSBpZiAoaWR4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICR0b0Nsb3NlID0gdGhpcy4kdGFicy5ub3QoZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAgcmV0dXJuIGkgPT09IGlkeDtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICR0b0Nsb3NlID0gdGhpcy4kZWxlbWVudDtcbiAgICB9XG4gICAgdmFyIHNvbWV0aGluZ1RvQ2xvc2UgPSAkdG9DbG9zZS5oYXNDbGFzcygnaXMtYWN0aXZlJykgfHwgJHRvQ2xvc2UuZmluZCgnLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDA7XG5cbiAgICBpZiAoc29tZXRoaW5nVG9DbG9zZSkge1xuICAgICAgJHRvQ2xvc2UuZmluZCgnbGkuaXMtYWN0aXZlJykuYWRkKCR0b0Nsb3NlKS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBmYWxzZSxcbiAgICAgICAgJ2RhdGEtaXMtY2xpY2snOiBmYWxzZVxuICAgICAgfSkucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuXG4gICAgICAkdG9DbG9zZS5maW5kKCd1bC5qcy1kcm9wZG93bi1hY3RpdmUnKS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZVxuICAgICAgfSkucmVtb3ZlQ2xhc3MoJ2pzLWRyb3Bkb3duLWFjdGl2ZScpO1xuXG4gICAgICBpZiAodGhpcy5jaGFuZ2VkIHx8ICR0b0Nsb3NlLmZpbmQoJ29wZW5zLWlubmVyJykubGVuZ3RoKSB7XG4gICAgICAgIHZhciBvbGRDbGFzcyA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdsZWZ0JyA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgICAgICR0b0Nsb3NlLmZpbmQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuYWRkKCR0b0Nsb3NlKVxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhgb3BlbnMtaW5uZXIgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKGBvcGVucy0ke29sZENsYXNzfWApO1xuICAgICAgICB0aGlzLmNoYW5nZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgb3BlbiBtZW51cyBhcmUgY2xvc2VkLlxuICAgICAgICogQGV2ZW50IERyb3Bkb3duTWVudSNoaWRlXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignaGlkZS56Zi5kcm9wZG93bm1lbnUnLCBbJHRvQ2xvc2VdKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIHBsdWdpbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuJG1lbnVJdGVtcy5vZmYoJy56Zi5kcm9wZG93bm1lbnUnKS5yZW1vdmVBdHRyKCdkYXRhLWlzLWNsaWNrJylcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdpcy1yaWdodC1hcnJvdyBpcy1sZWZ0LWFycm93IGlzLWRvd24tYXJyb3cgb3BlbnMtcmlnaHQgb3BlbnMtbGVmdCBvcGVucy1pbm5lcicpO1xuICAgICQoZG9jdW1lbnQuYm9keSkub2ZmKCcuemYuZHJvcGRvd25tZW51Jyk7XG4gICAgRm91bmRhdGlvbi5OZXN0LkJ1cm4odGhpcy4kZWxlbWVudCwgJ2Ryb3Bkb3duJyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbi8qKlxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXG4gKi9cbkRyb3Bkb3duTWVudS5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIERpc2FsbG93cyBob3ZlciBldmVudHMgZnJvbSBvcGVuaW5nIHN1Ym1lbnVzXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGRpc2FibGVIb3ZlcjogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvdyBhIHN1Ym1lbnUgdG8gYXV0b21hdGljYWxseSBjbG9zZSBvbiBhIG1vdXNlbGVhdmUgZXZlbnQsIGlmIG5vdCBjbGlja2VkIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgYXV0b2Nsb3NlOiB0cnVlLFxuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gZGVsYXkgb3BlbmluZyBhIHN1Ym1lbnUgb24gaG92ZXIgZXZlbnQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgNTBcbiAgICovXG4gIGhvdmVyRGVsYXk6IDUwLFxuICAvKipcbiAgICogQWxsb3cgYSBzdWJtZW51IHRvIG9wZW4vcmVtYWluIG9wZW4gb24gcGFyZW50IGNsaWNrIGV2ZW50LiBBbGxvd3MgY3Vyc29yIHRvIG1vdmUgYXdheSBmcm9tIG1lbnUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xpY2tPcGVuOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGRlbGF5IGNsb3NpbmcgYSBzdWJtZW51IG9uIGEgbW91c2VsZWF2ZSBldmVudC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSA1MDBcbiAgICovXG5cbiAgY2xvc2luZ1RpbWU6IDUwMCxcbiAgLyoqXG4gICAqIFBvc2l0aW9uIG9mIHRoZSBtZW51IHJlbGF0aXZlIHRvIHdoYXQgZGlyZWN0aW9uIHRoZSBzdWJtZW51cyBzaG91bGQgb3Blbi4gSGFuZGxlZCBieSBKUy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnbGVmdCdcbiAgICovXG4gIGFsaWdubWVudDogJ2xlZnQnLFxuICAvKipcbiAgICogQWxsb3cgY2xpY2tzIG9uIHRoZSBib2R5IHRvIGNsb3NlIGFueSBvcGVuIHN1Ym1lbnVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gdmVydGljYWwgb3JpZW50ZWQgbWVudXMsIEZvdW5kYXRpb24gZGVmYXVsdCBpcyBgdmVydGljYWxgLiBVcGRhdGUgdGhpcyBpZiB1c2luZyB5b3VyIG93biBjbGFzcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAndmVydGljYWwnXG4gICAqL1xuICB2ZXJ0aWNhbENsYXNzOiAndmVydGljYWwnLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byByaWdodC1zaWRlIG9yaWVudGVkIG1lbnVzLCBGb3VuZGF0aW9uIGRlZmF1bHQgaXMgYGFsaWduLXJpZ2h0YC4gVXBkYXRlIHRoaXMgaWYgdXNpbmcgeW91ciBvd24gY2xhc3MuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2FsaWduLXJpZ2h0J1xuICAgKi9cbiAgcmlnaHRDbGFzczogJ2FsaWduLXJpZ2h0JyxcbiAgLyoqXG4gICAqIEJvb2xlYW4gdG8gZm9yY2Ugb3ZlcmlkZSB0aGUgY2xpY2tpbmcgb2YgbGlua3MgdG8gcGVyZm9ybSBkZWZhdWx0IGFjdGlvbiwgb24gc2Vjb25kIHRvdWNoIGV2ZW50IGZvciBtb2JpbGUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGZvcmNlRm9sbG93OiB0cnVlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oRHJvcGRvd25NZW51LCAnRHJvcGRvd25NZW51Jyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBSZXNwb25zaXZlTWVudSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnVcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5hY2NvcmRpb25NZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmRyaWxsZG93blxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5kcm9wZG93bi1tZW51XG4gKi9cblxuY2xhc3MgUmVzcG9uc2l2ZU1lbnUge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIHJlc3BvbnNpdmUgbWVudS5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlTWVudSNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93biBtZW51LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgdGhpcy5ydWxlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgncmVzcG9uc2l2ZS1tZW51Jyk7XG4gICAgdGhpcy5jdXJyZW50TXEgPSBudWxsO1xuICAgIHRoaXMuY3VycmVudFBsdWdpbiA9IG51bGw7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdSZXNwb25zaXZlTWVudScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBNZW51IGJ5IHBhcnNpbmcgdGhlIGNsYXNzZXMgZnJvbSB0aGUgJ2RhdGEtUmVzcG9uc2l2ZU1lbnUnIGF0dHJpYnV0ZSBvbiB0aGUgZWxlbWVudC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgcnVsZXNUcmVlID0ge307XG5cbiAgICAvLyBQYXJzZSBydWxlcyBmcm9tIFwiY2xhc3Nlc1wiIGluIGRhdGEgYXR0cmlidXRlXG4gICAgdmFyIHJ1bGVzID0gdGhpcy5ydWxlcy5zcGxpdCgnICcpO1xuXG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGV2ZXJ5IHJ1bGUgZm91bmRcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcnVsZSA9IHJ1bGVzW2ldLnNwbGl0KCctJyk7XG4gICAgICB2YXIgcnVsZVNpemUgPSBydWxlLmxlbmd0aCA+IDEgPyBydWxlWzBdIDogJ3NtYWxsJztcbiAgICAgIHZhciBydWxlUGx1Z2luID0gcnVsZS5sZW5ndGggPiAxID8gcnVsZVsxXSA6IHJ1bGVbMF07XG5cbiAgICAgIGlmIChNZW51UGx1Z2luc1tydWxlUGx1Z2luXSAhPT0gbnVsbCkge1xuICAgICAgICBydWxlc1RyZWVbcnVsZVNpemVdID0gTWVudVBsdWdpbnNbcnVsZVBsdWdpbl07XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5ydWxlcyA9IHJ1bGVzVHJlZTtcblxuICAgIGlmICghJC5pc0VtcHR5T2JqZWN0KHJ1bGVzVHJlZSkpIHtcbiAgICAgIHRoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgdGhlIE1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xuICAgIH0pO1xuICAgIC8vICQod2luZG93KS5vbigncmVzaXplLnpmLlJlc3BvbnNpdmVNZW51JywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICBfdGhpcy5fY2hlY2tNZWRpYVF1ZXJpZXMoKTtcbiAgICAvLyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIGN1cnJlbnQgc2NyZWVuIHdpZHRoIGFnYWluc3QgYXZhaWxhYmxlIG1lZGlhIHF1ZXJpZXMuIElmIHRoZSBtZWRpYSBxdWVyeSBoYXMgY2hhbmdlZCwgYW5kIHRoZSBwbHVnaW4gbmVlZGVkIGhhcyBjaGFuZ2VkLCB0aGUgcGx1Z2lucyB3aWxsIHN3YXAgb3V0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9jaGVja01lZGlhUXVlcmllcygpIHtcbiAgICB2YXIgbWF0Y2hlZE1xLCBfdGhpcyA9IHRoaXM7XG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggcnVsZSBhbmQgZmluZCB0aGUgbGFzdCBtYXRjaGluZyBydWxlXG4gICAgJC5lYWNoKHRoaXMucnVsZXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KGtleSkpIHtcbiAgICAgICAgbWF0Y2hlZE1xID0ga2V5O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTm8gbWF0Y2g/IE5vIGRpY2VcbiAgICBpZiAoIW1hdGNoZWRNcSkgcmV0dXJuO1xuXG4gICAgLy8gUGx1Z2luIGFscmVhZHkgaW5pdGlhbGl6ZWQ/IFdlIGdvb2RcbiAgICBpZiAodGhpcy5jdXJyZW50UGx1Z2luIGluc3RhbmNlb2YgdGhpcy5ydWxlc1ttYXRjaGVkTXFdLnBsdWdpbikgcmV0dXJuO1xuXG4gICAgLy8gUmVtb3ZlIGV4aXN0aW5nIHBsdWdpbi1zcGVjaWZpYyBDU1MgY2xhc3Nlc1xuICAgICQuZWFjaChNZW51UGx1Z2lucywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgX3RoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3ModmFsdWUuY3NzQ2xhc3MpO1xuICAgIH0pO1xuXG4gICAgLy8gQWRkIHRoZSBDU1MgY2xhc3MgZm9yIHRoZSBuZXcgcGx1Z2luXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLnJ1bGVzW21hdGNoZWRNcV0uY3NzQ2xhc3MpO1xuXG4gICAgLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBuZXcgcGx1Z2luXG4gICAgaWYgKHRoaXMuY3VycmVudFBsdWdpbikgdGhpcy5jdXJyZW50UGx1Z2luLmRlc3Ryb3koKTtcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4gPSBuZXcgdGhpcy5ydWxlc1ttYXRjaGVkTXFdLnBsdWdpbih0aGlzLiRlbGVtZW50LCB7fSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGluc3RhbmNlIG9mIHRoZSBjdXJyZW50IHBsdWdpbiBvbiB0aGlzIGVsZW1lbnQsIGFzIHdlbGwgYXMgdGhlIHdpbmRvdyByZXNpemUgaGFuZGxlciB0aGF0IHN3aXRjaGVzIHRoZSBwbHVnaW5zIG91dC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY3VycmVudFBsdWdpbi5kZXN0cm95KCk7XG4gICAgJCh3aW5kb3cpLm9mZignLnpmLlJlc3BvbnNpdmVNZW51Jyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblJlc3BvbnNpdmVNZW51LmRlZmF1bHRzID0ge307XG5cbi8vIFRoZSBwbHVnaW4gbWF0Y2hlcyB0aGUgcGx1Z2luIGNsYXNzZXMgd2l0aCB0aGVzZSBwbHVnaW4gaW5zdGFuY2VzLlxudmFyIE1lbnVQbHVnaW5zID0ge1xuICBkcm9wZG93bjoge1xuICAgIGNzc0NsYXNzOiAnZHJvcGRvd24nLFxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snZHJvcGRvd24tbWVudSddIHx8IG51bGxcbiAgfSxcbiBkcmlsbGRvd246IHtcbiAgICBjc3NDbGFzczogJ2RyaWxsZG93bicsXG4gICAgcGx1Z2luOiBGb3VuZGF0aW9uLl9wbHVnaW5zWydkcmlsbGRvd24nXSB8fCBudWxsXG4gIH0sXG4gIGFjY29yZGlvbjoge1xuICAgIGNzc0NsYXNzOiAnYWNjb3JkaW9uLW1lbnUnLFxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snYWNjb3JkaW9uLW1lbnUnXSB8fCBudWxsXG4gIH1cbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihSZXNwb25zaXZlTWVudSwgJ1Jlc3BvbnNpdmVNZW51Jyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBSZXNwb25zaXZlVG9nZ2xlIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5yZXNwb25zaXZlVG9nZ2xlXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqL1xuXG5jbGFzcyBSZXNwb25zaXZlVG9nZ2xlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgVGFiIEJhci5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlVG9nZ2xlI2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGF0dGFjaCB0YWIgYmFyIGZ1bmN0aW9uYWxpdHkgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgUmVzcG9uc2l2ZVRvZ2dsZS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnUmVzcG9uc2l2ZVRvZ2dsZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSB0YWIgYmFyIGJ5IGZpbmRpbmcgdGhlIHRhcmdldCBlbGVtZW50LCB0b2dnbGluZyBlbGVtZW50LCBhbmQgcnVubmluZyB1cGRhdGUoKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgdGFyZ2V0SUQgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3Jlc3BvbnNpdmUtdG9nZ2xlJyk7XG4gICAgaWYgKCF0YXJnZXRJRCkge1xuICAgICAgY29uc29sZS5lcnJvcignWW91ciB0YWIgYmFyIG5lZWRzIGFuIElEIG9mIGEgTWVudSBhcyB0aGUgdmFsdWUgb2YgZGF0YS10YWItYmFyLicpO1xuICAgIH1cblxuICAgIHRoaXMuJHRhcmdldE1lbnUgPSAkKGAjJHt0YXJnZXRJRH1gKTtcbiAgICB0aGlzLiR0b2dnbGVyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS10b2dnbGVdJyk7XG5cbiAgICB0aGlzLl91cGRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIG5lY2Vzc2FyeSBldmVudCBoYW5kbGVycyBmb3IgdGhlIHRhYiBiYXIgdG8gd29yay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIHRoaXMuX3VwZGF0ZS5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMuJHRvZ2dsZXIub24oJ2NsaWNrLnpmLnJlc3BvbnNpdmVUb2dnbGUnLCB0aGlzLnRvZ2dsZU1lbnUuYmluZCh0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjdXJyZW50IG1lZGlhIHF1ZXJ5IHRvIGRldGVybWluZSBpZiB0aGUgdGFiIGJhciBzaG91bGQgYmUgdmlzaWJsZSBvciBoaWRkZW4uXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3VwZGF0ZSgpIHtcbiAgICAvLyBNb2JpbGVcbiAgICBpZiAoIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5oaWRlRm9yKSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5zaG93KCk7XG4gICAgICB0aGlzLiR0YXJnZXRNZW51LmhpZGUoKTtcbiAgICB9XG5cbiAgICAvLyBEZXNrdG9wXG4gICAgZWxzZSB7XG4gICAgICB0aGlzLiRlbGVtZW50LmhpZGUoKTtcbiAgICAgIHRoaXMuJHRhcmdldE1lbnUuc2hvdygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyLiBUaGUgdG9nZ2xlIG9ubHkgaGFwcGVucyBpZiB0aGUgc2NyZWVuIGlzIHNtYWxsIGVub3VnaCB0byBhbGxvdyBpdC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlVG9nZ2xlI3RvZ2dsZWRcbiAgICovXG4gIHRvZ2dsZU1lbnUoKSB7XG4gICAgaWYgKCFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuaGlkZUZvcikpIHtcbiAgICAgIHRoaXMuJHRhcmdldE1lbnUudG9nZ2xlKDApO1xuXG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIGVsZW1lbnQgYXR0YWNoZWQgdG8gdGhlIHRhYiBiYXIgdG9nZ2xlcy5cbiAgICAgICAqIEBldmVudCBSZXNwb25zaXZlVG9nZ2xlI3RvZ2dsZWRcbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd0b2dnbGVkLnpmLnJlc3BvbnNpdmVUb2dnbGUnKTtcbiAgICB9XG4gIH07XG5cbiAgZGVzdHJveSgpIHtcbiAgICAvL1RPRE8gdGhpcy4uLlxuICB9XG59XG5cblJlc3BvbnNpdmVUb2dnbGUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBUaGUgYnJlYWtwb2ludCBhZnRlciB3aGljaCB0aGUgbWVudSBpcyBhbHdheXMgc2hvd24sIGFuZCB0aGUgdGFiIGJhciBpcyBoaWRkZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ21lZGl1bSdcbiAgICovXG4gIGhpZGVGb3I6ICdtZWRpdW0nXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oUmVzcG9uc2l2ZVRvZ2dsZSwgJ1Jlc3BvbnNpdmVUb2dnbGUnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIFJldmVhbCBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ucmV2ZWFsXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvbiBpZiB1c2luZyBhbmltYXRpb25zXG4gKi9cblxuY2xhc3MgUmV2ZWFsIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgUmV2ZWFsLlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHVzZSBmb3IgdGhlIG1vZGFsLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIG9wdGlvbmFsIHBhcmFtZXRlcnMuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFJldmVhbC5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1JldmVhbCcpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ1JldmVhbCcsIHtcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxuICAgICAgJ1RBQic6ICd0YWJfZm9yd2FyZCcsXG4gICAgICAnU0hJRlRfVEFCJzogJ3RhYl9iYWNrd2FyZCdcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgbW9kYWwgYnkgYWRkaW5nIHRoZSBvdmVybGF5IGFuZCBjbG9zZSBidXR0b25zLCAoaWYgc2VsZWN0ZWQpLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdGhpcy5pZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2U7XG4gICAgdGhpcy5jYWNoZWQgPSB7bXE6IEZvdW5kYXRpb24uTWVkaWFRdWVyeS5jdXJyZW50fTtcbiAgICB0aGlzLmlzaU9TID0gaVBob25lU25pZmYoKTtcblxuICAgIGlmKHRoaXMuaXNpT1MpeyB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdpcy1pb3MnKTsgfVxuXG4gICAgdGhpcy4kYW5jaG9yID0gJChgW2RhdGEtb3Blbj1cIiR7dGhpcy5pZH1cIl1gKS5sZW5ndGggPyAkKGBbZGF0YS1vcGVuPVwiJHt0aGlzLmlkfVwiXWApIDogJChgW2RhdGEtdG9nZ2xlPVwiJHt0aGlzLmlkfVwiXWApO1xuXG4gICAgaWYgKHRoaXMuJGFuY2hvci5sZW5ndGgpIHtcbiAgICAgIHZhciBhbmNob3JJZCA9IHRoaXMuJGFuY2hvclswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdyZXZlYWwnKTtcblxuICAgICAgdGhpcy4kYW5jaG9yLmF0dHIoe1xuICAgICAgICAnYXJpYS1jb250cm9scyc6IHRoaXMuaWQsXG4gICAgICAgICdpZCc6IGFuY2hvcklkLFxuICAgICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXG4gICAgICAgICd0YWJpbmRleCc6IDBcbiAgICAgIH0pO1xuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKHsnYXJpYS1sYWJlbGxlZGJ5JzogYW5jaG9ySWR9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4gfHwgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnZnVsbCcpKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuZnVsbFNjcmVlbiA9IHRydWU7XG4gICAgICB0aGlzLm9wdGlvbnMub3ZlcmxheSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgIXRoaXMuJG92ZXJsYXkpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkgPSB0aGlzLl9tYWtlT3ZlcmxheSh0aGlzLmlkKTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xuICAgICAgICAncm9sZSc6ICdkaWFsb2cnLFxuICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxuICAgICAgICAnZGF0YS15ZXRpLWJveCc6IHRoaXMuaWQsXG4gICAgICAgICdkYXRhLXJlc2l6ZSc6IHRoaXMuaWRcbiAgICB9KTtcblxuICAgIGlmKHRoaXMuJG92ZXJsYXkpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuZGV0YWNoKCkuYXBwZW5kVG8odGhpcy4kb3ZlcmxheSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuZGV0YWNoKCkuYXBwZW5kVG8oJCgnYm9keScpKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ3dpdGhvdXQtb3ZlcmxheScpO1xuICAgIH1cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rICYmIHdpbmRvdy5sb2NhdGlvbi5oYXNoID09PSAoIGAjJHt0aGlzLmlkfWApKSB7XG4gICAgICAkKHdpbmRvdykub25lKCdsb2FkLnpmLnJldmVhbCcsIHRoaXMub3Blbi5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvdmVybGF5IGRpdiB0byBkaXNwbGF5IGJlaGluZCB0aGUgbW9kYWwuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfbWFrZU92ZXJsYXkoaWQpIHtcbiAgICB2YXIgJG92ZXJsYXkgPSAkKCc8ZGl2PjwvZGl2PicpXG4gICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygncmV2ZWFsLW92ZXJsYXknKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cih7J3RhYmluZGV4JzogLTEsICdhcmlhLWhpZGRlbic6IHRydWV9KVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8oJ2JvZHknKTtcbiAgICByZXR1cm4gJG92ZXJsYXk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBwb3NpdGlvbiBvZiBtb2RhbFxuICAgKiBUT0RPOiAgRmlndXJlIG91dCBpZiB3ZSBhY3R1YWxseSBuZWVkIHRvIGNhY2hlIHRoZXNlIHZhbHVlcyBvciBpZiBpdCBkb2Vzbid0IG1hdHRlclxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3VwZGF0ZVBvc2l0aW9uKCkge1xuICAgIHZhciB3aWR0aCA9IHRoaXMuJGVsZW1lbnQub3V0ZXJXaWR0aCgpO1xuICAgIHZhciBvdXRlcldpZHRoID0gJCh3aW5kb3cpLndpZHRoKCk7XG4gICAgdmFyIGhlaWdodCA9IHRoaXMuJGVsZW1lbnQub3V0ZXJIZWlnaHQoKTtcbiAgICB2YXIgb3V0ZXJIZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCk7XG4gICAgdmFyIGxlZnQgPSBwYXJzZUludCgob3V0ZXJXaWR0aCAtIHdpZHRoKSAvIDIsIDEwKTtcbiAgICB2YXIgdG9wO1xuICAgIGlmIChoZWlnaHQgPiBvdXRlckhlaWdodCkge1xuICAgICAgdG9wID0gcGFyc2VJbnQoTWF0aC5taW4oMTAwLCBvdXRlckhlaWdodCAvIDEwKSwgMTApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0b3AgPSBwYXJzZUludCgob3V0ZXJIZWlnaHQgLSBoZWlnaHQpIC8gNCwgMTApO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LmNzcyh7dG9wOiB0b3AgKyAncHgnfSk7XG4gICAgLy8gb25seSB3b3JyeSBhYm91dCBsZWZ0IGlmIHdlIGRvbid0IGhhdmUgYW4gb3ZlcmxheSwgb3RoZXJ3aXNlIHdlJ3JlIHBlcmZlY3RseSBpbiB0aGUgbWlkZGxlXG4gICAgaWYoIXRoaXMuJG92ZXJsYXkpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtsZWZ0OiBsZWZ0ICsgJ3B4J30pO1xuICAgIH1cblxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBtb2RhbC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuX3VwZGF0ZVBvc2l0aW9uKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy4kYW5jaG9yLmxlbmd0aCkge1xuICAgICAgdGhpcy4kYW5jaG9yLm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUud2hpY2ggPT09IDEzIHx8IGUud2hpY2ggPT09IDMyKSB7XG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiB0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgdGhpcy4kb3ZlcmxheS5vZmYoJy56Zi5yZXZlYWwnKS5vbignY2xpY2suemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS50YXJnZXQgPT09IF90aGlzLiRlbGVtZW50WzBdIHx8ICQuY29udGFpbnMoX3RoaXMuJGVsZW1lbnRbMF0sIGUudGFyZ2V0KSkgeyByZXR1cm47IH1cbiAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICAkKHdpbmRvdykub24oYHBvcHN0YXRlLnpmLnJldmVhbDoke3RoaXMuaWR9YCwgdGhpcy5faGFuZGxlU3RhdGUuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgbW9kYWwgbWV0aG9kcyBvbiBiYWNrL2ZvcndhcmQgYnV0dG9uIGNsaWNrcyBvciBhbnkgb3RoZXIgZXZlbnQgdGhhdCB0cmlnZ2VycyBwb3BzdGF0ZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9oYW5kbGVTdGF0ZShlKSB7XG4gICAgaWYod2luZG93LmxvY2F0aW9uLmhhc2ggPT09ICggJyMnICsgdGhpcy5pZCkgJiYgIXRoaXMuaXNBY3RpdmUpeyB0aGlzLm9wZW4oKTsgfVxuICAgIGVsc2V7IHRoaXMuY2xvc2UoKTsgfVxuICB9XG5cblxuICAvKipcbiAgICogT3BlbnMgdGhlIG1vZGFsIGNvbnRyb2xsZWQgYnkgYHRoaXMuJGFuY2hvcmAsIGFuZCBjbG9zZXMgYWxsIG90aGVycyBieSBkZWZhdWx0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFJldmVhbCNjbG9zZW1lXG4gICAqIEBmaXJlcyBSZXZlYWwjb3BlblxuICAgKi9cbiAgb3BlbigpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICB2YXIgaGFzaCA9IGAjJHt0aGlzLmlkfWA7XG5cbiAgICAgIGlmICh3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUpIHtcbiAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIGhhc2gpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBoYXNoO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xuXG4gICAgLy8gTWFrZSBlbGVtZW50cyBpbnZpc2libGUsIGJ1dCByZW1vdmUgZGlzcGxheTogbm9uZSBzbyB3ZSBjYW4gZ2V0IHNpemUgYW5kIHBvc2l0aW9uaW5nXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAuY3NzKHsgJ3Zpc2liaWxpdHknOiAnaGlkZGVuJyB9KVxuICAgICAgICAuc2hvdygpXG4gICAgICAgIC5zY3JvbGxUb3AoMCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmNzcyh7J3Zpc2liaWxpdHknOiAnaGlkZGVuJ30pLnNob3coKTtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVQb3NpdGlvbigpO1xuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLmhpZGUoKVxuICAgICAgLmNzcyh7ICd2aXNpYmlsaXR5JzogJycgfSk7XG5cbiAgICBpZih0aGlzLiRvdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmNzcyh7J3Zpc2liaWxpdHknOiAnJ30pLmhpZGUoKTtcbiAgICB9XG5cblxuICAgIGlmICghdGhpcy5vcHRpb25zLm11bHRpcGxlT3BlbmVkKSB7XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgbW9kYWwgb3BlbnMuXG4gICAgICAgKiBDbG9zZXMgYW55IG90aGVyIG1vZGFscyB0aGF0IGFyZSBjdXJyZW50bHkgb3BlblxuICAgICAgICogQGV2ZW50IFJldmVhbCNjbG9zZW1lXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VtZS56Zi5yZXZlYWwnLCB0aGlzLmlkKTtcbiAgICB9XG5cbiAgICAvLyBNb3Rpb24gVUkgbWV0aG9kIG9mIHJldmVhbFxuICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uSW4pIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4odGhpcy4kb3ZlcmxheSwgJ2ZhZGUtaW4nKTtcbiAgICAgIH1cbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbih0aGlzLiRlbGVtZW50LCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uSW4sIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZvY3VzYWJsZUVsZW1lbnRzID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKHRoaXMuJGVsZW1lbnQpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGpRdWVyeSBtZXRob2Qgb2YgcmV2ZWFsXG4gICAgZWxzZSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcbiAgICAgICAgdGhpcy4kb3ZlcmxheS5zaG93KDApO1xuICAgICAgfVxuICAgICAgdGhpcy4kZWxlbWVudC5zaG93KHRoaXMub3B0aW9ucy5zaG93RGVsYXkpO1xuICAgIH1cblxuICAgIC8vIGhhbmRsZSBhY2Nlc3NpYmlsaXR5XG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLmF0dHIoe1xuICAgICAgICAnYXJpYS1oaWRkZW4nOiBmYWxzZSxcbiAgICAgICAgJ3RhYmluZGV4JzogLTFcbiAgICAgIH0pXG4gICAgICAuZm9jdXMoKTtcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG1vZGFsIGhhcyBzdWNjZXNzZnVsbHkgb3BlbmVkLlxuICAgICAqIEBldmVudCBSZXZlYWwjb3BlblxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb3Blbi56Zi5yZXZlYWwnKTtcblxuICAgIGlmICh0aGlzLmlzaU9TKSB7XG4gICAgICB2YXIgc2Nyb2xsUG9zID0gd2luZG93LnBhZ2VZT2Zmc2V0O1xuICAgICAgJCgnaHRtbCwgYm9keScpLmFkZENsYXNzKCdpcy1yZXZlYWwtb3BlbicpLnNjcm9sbFRvcChzY3JvbGxQb3MpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICQoJ2JvZHknKS5hZGRDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKTtcbiAgICB9XG5cbiAgICAkKCdib2R5JylcbiAgICAgIC5hZGRDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKVxuICAgICAgLmF0dHIoJ2FyaWEtaGlkZGVuJywgKHRoaXMub3B0aW9ucy5vdmVybGF5IHx8IHRoaXMub3B0aW9ucy5mdWxsU2NyZWVuKSA/IHRydWUgOiBmYWxzZSk7XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuX2V4dHJhSGFuZGxlcnMoKTtcbiAgICB9LCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV4dHJhIGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgYm9keSBhbmQgd2luZG93IGlmIG5lY2Vzc2FyeS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9leHRyYUhhbmRsZXJzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy5mb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgdGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiAhdGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4pIHtcbiAgICAgICQoJ2JvZHknKS5vbignY2xpY2suemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS50YXJnZXQgPT09IF90aGlzLiRlbGVtZW50WzBdIHx8ICQuY29udGFpbnMoX3RoaXMuJGVsZW1lbnRbMF0sIGUudGFyZ2V0KSkgeyByZXR1cm47IH1cbiAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkVzYykge1xuICAgICAgJCh3aW5kb3cpLm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ1JldmVhbCcsIHtcbiAgICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5jbG9zZU9uRXNjKSB7XG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMubGVuZ3RoID09PSAwKSB7IC8vIG5vIGZvY3VzYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIG1vZGFsIGF0IGFsbCwgcHJldmVudCB0YWJiaW5nIGluIGdlbmVyYWxcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIGxvY2sgZm9jdXMgd2l0aGluIG1vZGFsIHdoaWxlIHRhYmJpbmdcbiAgICB0aGlzLiRlbGVtZW50Lm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkdGFyZ2V0ID0gJCh0aGlzKTtcbiAgICAgIC8vIGhhbmRsZSBrZXlib2FyZCBldmVudCB3aXRoIGtleWJvYXJkIHV0aWxcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdSZXZlYWwnLCB7XG4gICAgICAgIHRhYl9mb3J3YXJkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXMoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpKSkgeyAvLyBsZWZ0IG1vZGFsIGRvd253YXJkcywgc2V0dGluZyBmb2N1cyB0byBmaXJzdCBlbGVtZW50XG4gICAgICAgICAgICBfdGhpcy5mb2N1c2FibGVFbGVtZW50cy5lcSgwKS5mb2N1cygpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGFiX2JhY2t3YXJkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXMoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMuZXEoMCkpIHx8IF90aGlzLiRlbGVtZW50LmlzKCc6Zm9jdXMnKSkgeyAvLyBsZWZ0IG1vZGFsIHVwd2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gbGFzdCBlbGVtZW50XG4gICAgICAgICAgICBfdGhpcy5mb2N1c2FibGVFbGVtZW50cy5lcSgtMSkuZm9jdXMoKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyhfdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1jbG9zZV0nKSkpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIHNldCBmb2N1cyBiYWNrIHRvIGFuY2hvciBpZiBjbG9zZSBidXR0b24gaGFzIGJlZW4gYWN0aXZhdGVkXG4gICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcbiAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoJHRhcmdldC5pcyhfdGhpcy5mb2N1c2FibGVFbGVtZW50cykpIHsgLy8gZG9udCd0IHRyaWdnZXIgaWYgYWN1YWwgZWxlbWVudCBoYXMgZm9jdXMgKGkuZS4gaW5wdXRzLCBsaW5rcywgLi4uKVxuICAgICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmNsb3NlT25Fc2MpIHtcbiAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmZvY3VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIG1vZGFsLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFJldmVhbCNjbG9zZWRcbiAgICovXG4gIGNsb3NlKCkge1xuICAgIGlmICghdGhpcy5pc0FjdGl2ZSB8fCAhdGhpcy4kZWxlbWVudC5pcygnOnZpc2libGUnKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gTW90aW9uIFVJIG1ldGhvZCBvZiBoaWRpbmdcbiAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbk91dCkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQodGhpcy4kb3ZlcmxheSwgJ2ZhZGUtb3V0JywgZmluaXNoVXApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGZpbmlzaFVwKCk7XG4gICAgICB9XG5cbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQodGhpcy4kZWxlbWVudCwgdGhpcy5vcHRpb25zLmFuaW1hdGlvbk91dCk7XG4gICAgfVxuICAgIC8vIGpRdWVyeSBtZXRob2Qgb2YgaGlkaW5nXG4gICAgZWxzZSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcbiAgICAgICAgdGhpcy4kb3ZlcmxheS5oaWRlKDAsIGZpbmlzaFVwKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBmaW5pc2hVcCgpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLiRlbGVtZW50LmhpZGUodGhpcy5vcHRpb25zLmhpZGVEZWxheSk7XG4gICAgfVxuXG4gICAgLy8gQ29uZGl0aW9uYWxzIHRvIHJlbW92ZSBleHRyYSBldmVudCBsaXN0ZW5lcnMgYWRkZWQgb24gb3BlblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkVzYykge1xuICAgICAgJCh3aW5kb3cpLm9mZigna2V5ZG93bi56Zi5yZXZlYWwnKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5vdmVybGF5ICYmIHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHtcbiAgICAgICQoJ2JvZHknKS5vZmYoJ2NsaWNrLnpmLnJldmVhbCcpO1xuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdrZXlkb3duLnpmLnJldmVhbCcpO1xuXG4gICAgZnVuY3Rpb24gZmluaXNoVXAoKSB7XG4gICAgICBpZiAoX3RoaXMuaXNpT1MpIHtcbiAgICAgICAgJCgnaHRtbCwgYm9keScpLnJlbW92ZUNsYXNzKCdpcy1yZXZlYWwtb3BlbicpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKTtcbiAgICAgIH1cblxuICAgICAgJCgnYm9keScpLmF0dHIoe1xuICAgICAgICAnYXJpYS1oaWRkZW4nOiBmYWxzZSxcbiAgICAgICAgJ3RhYmluZGV4JzogJydcbiAgICAgIH0pO1xuXG4gICAgICBfdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpO1xuXG4gICAgICAvKipcbiAgICAgICogRmlyZXMgd2hlbiB0aGUgbW9kYWwgaXMgZG9uZSBjbG9zaW5nLlxuICAgICAgKiBAZXZlbnQgUmV2ZWFsI2Nsb3NlZFxuICAgICAgKi9cbiAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlZC56Zi5yZXZlYWwnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFJlc2V0cyB0aGUgbW9kYWwgY29udGVudFxuICAgICogVGhpcyBwcmV2ZW50cyBhIHJ1bm5pbmcgdmlkZW8gdG8ga2VlcCBnb2luZyBpbiB0aGUgYmFja2dyb3VuZFxuICAgICovXG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZXNldE9uQ2xvc2UpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuaHRtbCh0aGlzLiRlbGVtZW50Lmh0bWwoKSk7XG4gICAgfVxuXG4gICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xuICAgICBpZiAoX3RoaXMub3B0aW9ucy5kZWVwTGluaykge1xuICAgICAgIGlmICh3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUpIHtcbiAgICAgICAgIHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZShcIlwiLCBkb2N1bWVudC50aXRsZSwgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcbiAgICAgICB9IGVsc2Uge1xuICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnJztcbiAgICAgICB9XG4gICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBvcGVuL2Nsb3NlZCBzdGF0ZSBvZiBhIG1vZGFsLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHRvZ2dsZSgpIHtcbiAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGEgbW9kYWwuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkuaGlkZSgpLm9mZigpLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LmhpZGUoKS5vZmYoKTtcbiAgICB0aGlzLiRhbmNob3Iub2ZmKCcuemYnKTtcbiAgICAkKHdpbmRvdykub2ZmKGAuemYucmV2ZWFsOiR7dGhpcy5pZH1gKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfTtcbn1cblxuUmV2ZWFsLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogTW90aW9uLVVJIGNsYXNzIHRvIHVzZSBmb3IgYW5pbWF0ZWQgZWxlbWVudHMuIElmIG5vbmUgdXNlZCwgZGVmYXVsdHMgdG8gc2ltcGxlIHNob3cvaGlkZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnc2xpZGUtaW4tbGVmdCdcbiAgICovXG4gIGFuaW1hdGlvbkluOiAnJyxcbiAgLyoqXG4gICAqIE1vdGlvbi1VSSBjbGFzcyB0byB1c2UgZm9yIGFuaW1hdGVkIGVsZW1lbnRzLiBJZiBub25lIHVzZWQsIGRlZmF1bHRzIHRvIHNpbXBsZSBzaG93L2hpZGUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3NsaWRlLW91dC1yaWdodCdcbiAgICovXG4gIGFuaW1hdGlvbk91dDogJycsXG4gIC8qKlxuICAgKiBUaW1lLCBpbiBtcywgdG8gZGVsYXkgdGhlIG9wZW5pbmcgb2YgYSBtb2RhbCBhZnRlciBhIGNsaWNrIGlmIG5vIGFuaW1hdGlvbiB1c2VkLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEwXG4gICAqL1xuICBzaG93RGVsYXk6IDAsXG4gIC8qKlxuICAgKiBUaW1lLCBpbiBtcywgdG8gZGVsYXkgdGhlIGNsb3Npbmcgb2YgYSBtb2RhbCBhZnRlciBhIGNsaWNrIGlmIG5vIGFuaW1hdGlvbiB1c2VkLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEwXG4gICAqL1xuICBoaWRlRGVsYXk6IDAsXG4gIC8qKlxuICAgKiBBbGxvd3MgYSBjbGljayBvbiB0aGUgYm9keS9vdmVybGF5IHRvIGNsb3NlIHRoZSBtb2RhbC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IHRydWUsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGNsb3NlIGlmIHRoZSB1c2VyIHByZXNzZXMgdGhlIGBFU0NBUEVgIGtleS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uRXNjOiB0cnVlLFxuICAvKipcbiAgICogSWYgdHJ1ZSwgYWxsb3dzIG11bHRpcGxlIG1vZGFscyB0byBiZSBkaXNwbGF5ZWQgYXQgb25jZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgbXVsdGlwbGVPcGVuZWQ6IGZhbHNlLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIG1vZGFsIHNob3VsZCBwdXNoIGRvd24gZnJvbSB0aGUgdG9wIG9mIHRoZSBzY3JlZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMTAwXG4gICAqL1xuICB2T2Zmc2V0OiAxMDAsXG4gIC8qKlxuICAgKiBEaXN0YW5jZSwgaW4gcGl4ZWxzLCB0aGUgbW9kYWwgc2hvdWxkIHB1c2ggaW4gZnJvbSB0aGUgc2lkZSBvZiB0aGUgc2NyZWVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDBcbiAgICovXG4gIGhPZmZzZXQ6IDAsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGJlIGZ1bGxzY3JlZW4sIGNvbXBsZXRlbHkgYmxvY2tpbmcgb3V0IHRoZSByZXN0IG9mIHRoZSB2aWV3LiBKUyBjaGVja3MgZm9yIHRoaXMgYXMgd2VsbC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZnVsbFNjcmVlbjogZmFsc2UsXG4gIC8qKlxuICAgKiBQZXJjZW50YWdlIG9mIHNjcmVlbiBoZWlnaHQgdGhlIG1vZGFsIHNob3VsZCBwdXNoIHVwIGZyb20gdGhlIGJvdHRvbSBvZiB0aGUgdmlldy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxMFxuICAgKi9cbiAgYnRtT2Zmc2V0UGN0OiAxMCxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gZ2VuZXJhdGUgYW4gb3ZlcmxheSBkaXYsIHdoaWNoIHdpbGwgY292ZXIgdGhlIHZpZXcgd2hlbiBtb2RhbCBvcGVucy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBvdmVybGF5OiB0cnVlLFxuICAvKipcbiAgICogQWxsb3dzIHRoZSBtb2RhbCB0byByZW1vdmUgYW5kIHJlaW5qZWN0IG1hcmt1cCBvbiBjbG9zZS4gU2hvdWxkIGJlIHRydWUgaWYgdXNpbmcgdmlkZW8gZWxlbWVudHMgdy9vIHVzaW5nIHByb3ZpZGVyJ3MgYXBpLCBvdGhlcndpc2UsIHZpZGVvcyB3aWxsIGNvbnRpbnVlIHRvIHBsYXkgaW4gdGhlIGJhY2tncm91bmQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIHJlc2V0T25DbG9zZTogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGFsdGVyIHRoZSB1cmwgb24gb3Blbi9jbG9zZSwgYW5kIGFsbG93cyB0aGUgdXNlIG9mIHRoZSBgYmFja2AgYnV0dG9uIHRvIGNsb3NlIG1vZGFscy4gQUxTTywgYWxsb3dzIGEgbW9kYWwgdG8gYXV0by1tYW5pYWNhbGx5IG9wZW4gb24gcGFnZSBsb2FkIElGIHRoZSBoYXNoID09PSB0aGUgbW9kYWwncyB1c2VyLXNldCBpZC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZGVlcExpbms6IGZhbHNlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oUmV2ZWFsLCAnUmV2ZWFsJyk7XG5cbmZ1bmN0aW9uIGlQaG9uZVNuaWZmKCkge1xuICByZXR1cm4gL2lQKGFkfGhvbmV8b2QpLipPUy8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59XG5cbn0oalF1ZXJ5KTtcbiIsIi8qIS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBWZWdhcyAtIEZ1bGxzY3JlZW4gQmFja2dyb3VuZHMgYW5kIFNsaWRlc2hvd3MuXG4gKiB2Mi4yLjAgLSBidWlsdCAyMDE2LTAxLTE4XG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4gKiBodHRwOi8vdmVnYXMuamF5c2FsdmF0LmNvbS9cbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIENvcHlyaWdodCAoQykgMjAxMC0yMDE2IEpheSBTYWx2YXRcbiAqIGh0dHA6Ly9qYXlzYWx2YXQuY29tL1xuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4oZnVuY3Rpb24gKCQpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIHNsaWRlOiAgICAgICAgICAgICAgMCxcbiAgICAgICAgZGVsYXk6ICAgICAgICAgICAgICA1MDAwLFxuICAgICAgICBwcmVsb2FkOiAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICBwcmVsb2FkSW1hZ2U6ICAgICAgIGZhbHNlLFxuICAgICAgICBwcmVsb2FkVmlkZW86ICAgICAgIGZhbHNlLFxuICAgICAgICB0aW1lcjogICAgICAgICAgICAgIHRydWUsXG4gICAgICAgIG92ZXJsYXk6ICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgIGF1dG9wbGF5OiAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgc2h1ZmZsZTogICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgY292ZXI6ICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICBjb2xvcjogICAgICAgICAgICAgIG51bGwsXG4gICAgICAgIGFsaWduOiAgICAgICAgICAgICAgJ2NlbnRlcicsXG4gICAgICAgIHZhbGlnbjogICAgICAgICAgICAgJ2NlbnRlcicsXG4gICAgICAgIHRyYW5zaXRpb246ICAgICAgICAgJ2ZhZGUnLFxuICAgICAgICB0cmFuc2l0aW9uRHVyYXRpb246IDEwMDAsXG4gICAgICAgIHRyYW5zaXRpb25SZWdpc3RlcjogW10sXG4gICAgICAgIGFuaW1hdGlvbjogICAgICAgICAgbnVsbCxcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICAnYXV0bycsXG4gICAgICAgIGFuaW1hdGlvblJlZ2lzdGVyOiAgW10sXG4gICAgICAgIGluaXQ6ICBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgcGxheTogIGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBwYXVzZTogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIHdhbGs6ICBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgc2xpZGVzOiBbXG4gICAgICAgICAgICAvLyB7XG4gICAgICAgICAgICAvLyAgc3JjOiAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgLy8gIGNvbG9yOiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIC8vICBkZWxheTogICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAvLyAgYWxpZ246ICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgLy8gIHZhbGlnbjogICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIC8vICB0cmFuc2l0aW9uOiAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAvLyAgdHJhbnNpdGlvbkR1cmF0aW9uOiBudWxsLFxuICAgICAgICAgICAgLy8gIGFuaW1hdGlvbjogICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIC8vICBhbmltYXRpb25EdXJhdGlvbjogIG51bGwsXG4gICAgICAgICAgICAvLyAgY292ZXI6ICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgLy8gIHZpZGVvOiB7XG4gICAgICAgICAgICAvLyAgICAgIHNyYzogW10sXG4gICAgICAgICAgICAvLyAgICAgIG11dGU6IHRydWUsXG4gICAgICAgICAgICAvLyAgICAgIGxvb3A6IHRydWVcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIC4uLlxuICAgICAgICBdXG4gICAgfTtcblxuICAgIHZhciB2aWRlb0NhY2hlID0ge307XG5cbiAgICB2YXIgVmVnYXMgPSBmdW5jdGlvbiAoZWxtdCwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmVsbXQgICAgICAgICA9IGVsbXQ7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgICAgID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCAkLnZlZ2FzLmRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5zbGlkZSAgICAgICAgPSB0aGlzLnNldHRpbmdzLnNsaWRlO1xuICAgICAgICB0aGlzLnRvdGFsICAgICAgICA9IHRoaXMuc2V0dGluZ3Muc2xpZGVzLmxlbmd0aDtcbiAgICAgICAgdGhpcy5ub3Nob3cgICAgICAgPSB0aGlzLnRvdGFsIDwgMjtcbiAgICAgICAgdGhpcy5wYXVzZWQgICAgICAgPSAhdGhpcy5zZXR0aW5ncy5hdXRvcGxheSB8fCB0aGlzLm5vc2hvdztcbiAgICAgICAgdGhpcy4kZWxtdCAgICAgICAgPSAkKGVsbXQpO1xuICAgICAgICB0aGlzLiR0aW1lciAgICAgICA9IG51bGw7XG4gICAgICAgIHRoaXMuJG92ZXJsYXkgICAgID0gbnVsbDtcbiAgICAgICAgdGhpcy4kc2xpZGUgICAgICAgPSBudWxsO1xuICAgICAgICB0aGlzLnRpbWVvdXQgICAgICA9IG51bGw7XG5cbiAgICAgICAgdGhpcy50cmFuc2l0aW9ucyA9IFtcbiAgICAgICAgICAgICdmYWRlJywgJ2ZhZGUyJyxcbiAgICAgICAgICAgICdibHVyJywgJ2JsdXIyJyxcbiAgICAgICAgICAgICdmbGFzaCcsICdmbGFzaDInLFxuICAgICAgICAgICAgJ25lZ2F0aXZlJywgJ25lZ2F0aXZlMicsXG4gICAgICAgICAgICAnYnVybicsICdidXJuMicsXG4gICAgICAgICAgICAnc2xpZGVMZWZ0JywgJ3NsaWRlTGVmdDInLFxuICAgICAgICAgICAgJ3NsaWRlUmlnaHQnLCAnc2xpZGVSaWdodDInLFxuICAgICAgICAgICAgJ3NsaWRlVXAnLCAnc2xpZGVVcDInLFxuICAgICAgICAgICAgJ3NsaWRlRG93bicsICdzbGlkZURvd24yJyxcbiAgICAgICAgICAgICd6b29tSW4nLCAnem9vbUluMicsXG4gICAgICAgICAgICAnem9vbU91dCcsICd6b29tT3V0MicsXG4gICAgICAgICAgICAnc3dpcmxMZWZ0JywgJ3N3aXJsTGVmdDInLFxuICAgICAgICAgICAgJ3N3aXJsUmlnaHQnLCAnc3dpcmxSaWdodDInXG4gICAgICAgIF07XG5cbiAgICAgICAgdGhpcy5hbmltYXRpb25zID0gW1xuICAgICAgICAgICAgJ2tlbmJ1cm5zJyxcbiAgICAgICAgICAgICdrZW5idXJuc0xlZnQnLCAna2VuYnVybnNSaWdodCcsXG4gICAgICAgICAgICAna2VuYnVybnNVcCcsICdrZW5idXJuc1VwTGVmdCcsICdrZW5idXJuc1VwUmlnaHQnLFxuICAgICAgICAgICAgJ2tlbmJ1cm5zRG93bicsICdrZW5idXJuc0Rvd25MZWZ0JywgJ2tlbmJ1cm5zRG93blJpZ2h0J1xuICAgICAgICBdO1xuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRyYW5zaXRpb25SZWdpc3RlciBpbnN0YW5jZW9mIEFycmF5ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy50cmFuc2l0aW9uUmVnaXN0ZXIgPSBbIHRoaXMuc2V0dGluZ3MudHJhbnNpdGlvblJlZ2lzdGVyIF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5hbmltYXRpb25SZWdpc3RlciBpbnN0YW5jZW9mIEFycmF5ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5hbmltYXRpb25SZWdpc3RlciA9IFsgdGhpcy5zZXR0aW5ncy5hbmltYXRpb25SZWdpc3RlciBdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50cmFuc2l0aW9ucyA9IHRoaXMudHJhbnNpdGlvbnMuY29uY2F0KHRoaXMuc2V0dGluZ3MudHJhbnNpdGlvblJlZ2lzdGVyKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zICA9IHRoaXMuYW5pbWF0aW9ucy5jb25jYXQodGhpcy5zZXR0aW5ncy5hbmltYXRpb25SZWdpc3Rlcik7XG5cbiAgICAgICAgdGhpcy5zdXBwb3J0ID0ge1xuICAgICAgICAgICAgb2JqZWN0Rml0OiAgJ29iamVjdEZpdCcgIGluIGRvY3VtZW50LmJvZHkuc3R5bGUsXG4gICAgICAgICAgICB0cmFuc2l0aW9uOiAndHJhbnNpdGlvbicgaW4gZG9jdW1lbnQuYm9keS5zdHlsZSB8fCAnV2Via2l0VHJhbnNpdGlvbicgaW4gZG9jdW1lbnQuYm9keS5zdHlsZSxcbiAgICAgICAgICAgIHZpZGVvOiAgICAgICQudmVnYXMuaXNWaWRlb0NvbXBhdGlibGUoKVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnNodWZmbGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMuc2h1ZmZsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faW5pdCgpO1xuICAgIH07XG5cbiAgICBWZWdhcy5wcm90b3R5cGUgPSB7XG4gICAgICAgIF9pbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgJHdyYXBwZXIsXG4gICAgICAgICAgICAgICAgJG92ZXJsYXksXG4gICAgICAgICAgICAgICAgJHRpbWVyLFxuICAgICAgICAgICAgICAgIGlzQm9keSAgPSB0aGlzLmVsbXQudGFnTmFtZSA9PT0gJ0JPRFknLFxuICAgICAgICAgICAgICAgIHRpbWVyICAgPSB0aGlzLnNldHRpbmdzLnRpbWVyLFxuICAgICAgICAgICAgICAgIG92ZXJsYXkgPSB0aGlzLnNldHRpbmdzLm92ZXJsYXksXG4gICAgICAgICAgICAgICAgc2VsZiAgICA9IHRoaXM7XG5cbiAgICAgICAgICAgIC8vIFByZWxvYWRpbmdcbiAgICAgICAgICAgIHRoaXMuX3ByZWxvYWQoKTtcblxuICAgICAgICAgICAgLy8gV3JhcHBlciB3aXRoIGNvbnRlbnRcbiAgICAgICAgICAgIGlmICghaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kZWxtdC5jc3MoJ2hlaWdodCcsIHRoaXMuJGVsbXQuY3NzKCdoZWlnaHQnKSk7XG5cbiAgICAgICAgICAgICAgICAkd3JhcHBlciA9ICQoJzxkaXYgY2xhc3M9XCJ2ZWdhcy13cmFwcGVyXCI+JylcbiAgICAgICAgICAgICAgICAgICAgLmNzcygnb3ZlcmZsb3cnLCB0aGlzLiRlbG10LmNzcygnb3ZlcmZsb3cnKSlcbiAgICAgICAgICAgICAgICAgICAgLmNzcygncGFkZGluZycsICB0aGlzLiRlbG10LmNzcygncGFkZGluZycpKTtcblxuICAgICAgICAgICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgZG9uJ3QgY29tcHV0ZSBwYWRkaW5nIHNob3J0aGFuZFxuICAgICAgICAgICAgICAgIGlmICghdGhpcy4kZWxtdC5jc3MoJ3BhZGRpbmcnKSkge1xuICAgICAgICAgICAgICAgICAgICAkd3JhcHBlclxuICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygncGFkZGluZy10b3AnLCAgICB0aGlzLiRlbG10LmNzcygncGFkZGluZy10b3AnKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ3BhZGRpbmctYm90dG9tJywgdGhpcy4kZWxtdC5jc3MoJ3BhZGRpbmctYm90dG9tJykpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdwYWRkaW5nLWxlZnQnLCAgIHRoaXMuJGVsbXQuY3NzKCdwYWRkaW5nLWxlZnQnKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ3BhZGRpbmctcmlnaHQnLCAgdGhpcy4kZWxtdC5jc3MoJ3BhZGRpbmctcmlnaHQnKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy4kZWxtdC5jbG9uZSh0cnVlKS5jaGlsZHJlbigpLmFwcGVuZFRvKCR3cmFwcGVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVsbXQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRpbWVyXG4gICAgICAgICAgICBpZiAodGltZXIgJiYgdGhpcy5zdXBwb3J0LnRyYW5zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAkdGltZXIgPSAkKCc8ZGl2IGNsYXNzPVwidmVnYXMtdGltZXJcIj48ZGl2IGNsYXNzPVwidmVnYXMtdGltZXItcHJvZ3Jlc3NcIj4nKTtcbiAgICAgICAgICAgICAgICB0aGlzLiR0aW1lciA9ICR0aW1lcjtcbiAgICAgICAgICAgICAgICB0aGlzLiRlbG10LnByZXBlbmQoJHRpbWVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gT3ZlcmxheVxuICAgICAgICAgICAgaWYgKG92ZXJsYXkpIHtcbiAgICAgICAgICAgICAgICAkb3ZlcmxheSA9ICQoJzxkaXYgY2xhc3M9XCJ2ZWdhcy1vdmVybGF5XCI+Jyk7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG92ZXJsYXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICRvdmVybGF5LmNzcygnYmFja2dyb3VuZC1pbWFnZScsICd1cmwoJyArIG92ZXJsYXkgKyAnKScpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuJG92ZXJsYXkgPSAkb3ZlcmxheTtcbiAgICAgICAgICAgICAgICB0aGlzLiRlbG10LnByZXBlbmQoJG92ZXJsYXkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDb250YWluZXJcbiAgICAgICAgICAgIHRoaXMuJGVsbXQuYWRkQ2xhc3MoJ3ZlZ2FzLWNvbnRhaW5lcicpO1xuXG4gICAgICAgICAgICBpZiAoIWlzQm9keSkge1xuICAgICAgICAgICAgICAgIHRoaXMuJGVsbXQuYXBwZW5kKCR3cmFwcGVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2VsZi50cmlnZ2VyKCdpbml0Jyk7XG4gICAgICAgICAgICAgICAgc2VsZi5fZ290byhzZWxmLnNsaWRlKTtcblxuICAgICAgICAgICAgICAgIGlmIChzZWxmLnNldHRpbmdzLmF1dG9wbGF5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudHJpZ2dlcigncGxheScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9wcmVsb2FkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW1nLCBpO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zZXR0aW5ncy5zbGlkZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5wcmVsb2FkIHx8IHRoaXMuc2V0dGluZ3MucHJlbG9hZEltYWdlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zbGlkZXNbaV0uc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZy5zcmMgPSB0aGlzLnNldHRpbmdzLnNsaWRlc1tpXS5zcmM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5wcmVsb2FkIHx8IHRoaXMuc2V0dGluZ3MucHJlbG9hZFZpZGVvcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdXBwb3J0LnZpZGVvICYmIHRoaXMuc2V0dGluZ3Muc2xpZGVzW2ldLnZpZGVvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zbGlkZXNbaV0udmlkZW8gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZpZGVvKHRoaXMuc2V0dGluZ3Muc2xpZGVzW2ldLnZpZGVvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmlkZW8odGhpcy5zZXR0aW5ncy5zbGlkZXNbaV0udmlkZW8uc3JjKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfcmFuZG9tOiBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiBhcnJheVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoYXJyYXkubGVuZ3RoIC0gMSkpXTtcbiAgICAgICAgfSxcblxuICAgICAgICBfc2xpZGVTaG93OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnRvdGFsID4gMSAmJiAhdGhpcy5wYXVzZWQgJiYgIXRoaXMubm9zaG93KSB7XG4gICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubmV4dCgpO1xuICAgICAgICAgICAgICAgIH0sIHRoaXMuX29wdGlvbnMoJ2RlbGF5JykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF90aW1lcjogZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMuJHRpbWVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLiR0aW1lclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygndmVnYXMtdGltZXItcnVubmluZycpXG4gICAgICAgICAgICAgICAgICAgIC5maW5kKCdkaXYnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygndHJhbnNpdGlvbi1kdXJhdGlvbicsICcwbXMnKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMucGF1c2VkIHx8IHRoaXMubm9zaG93KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICBzZWxmLiR0aW1lclxuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZlZ2FzLXRpbWVyLXJ1bm5pbmcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ2RpdicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygndHJhbnNpdGlvbi1kdXJhdGlvbicsIHNlbGYuX29wdGlvbnMoJ2RlbGF5JykgLSAxMDAgKyAnbXMnKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF92aWRlbzogZnVuY3Rpb24gKHNyY3MpIHtcbiAgICAgICAgICAgIHZhciB2aWRlbyxcbiAgICAgICAgICAgICAgICBzb3VyY2UsXG4gICAgICAgICAgICAgICAgY2FjaGVLZXkgPSBzcmNzLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIGlmICh2aWRlb0NhY2hlW2NhY2hlS2V5XSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2aWRlb0NhY2hlW2NhY2hlS2V5XTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNyY3MgaW5zdGFuY2VvZiBBcnJheSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBzcmNzID0gWyBzcmNzIF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcbiAgICAgICAgICAgIHZpZGVvLnByZWxvYWQgPSB0cnVlO1xuXG4gICAgICAgICAgICBzcmNzLmZvckVhY2goZnVuY3Rpb24gKHNyYykge1xuICAgICAgICAgICAgICAgIHNvdXJjZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICAgICAgICAgICAgICAgIHNvdXJjZS5zcmMgPSBzcmM7XG4gICAgICAgICAgICAgICAgdmlkZW8uYXBwZW5kQ2hpbGQoc291cmNlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2aWRlb0NhY2hlW2NhY2hlS2V5XSA9IHZpZGVvO1xuXG4gICAgICAgICAgICByZXR1cm4gdmlkZW87XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2ZhZGVPdXRTb3VuZDogZnVuY3Rpb24gKHZpZGVvLCBkdXJhdGlvbikge1xuICAgICAgICAgICAgdmFyIHNlbGYgICA9IHRoaXMsXG4gICAgICAgICAgICAgICAgZGVsYXkgID0gZHVyYXRpb24gLyAxMCxcbiAgICAgICAgICAgICAgICB2b2x1bWUgPSB2aWRlby52b2x1bWUgLSAwLjA5O1xuXG4gICAgICAgICAgICBpZiAodm9sdW1lID4gMCkge1xuICAgICAgICAgICAgICAgIHZpZGVvLnZvbHVtZSA9IHZvbHVtZTtcblxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9mYWRlT3V0U291bmQodmlkZW8sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICB9LCBkZWxheSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZpZGVvLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2ZhZGVJblNvdW5kOiBmdW5jdGlvbiAodmlkZW8sIGR1cmF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiAgID0gdGhpcyxcbiAgICAgICAgICAgICAgICBkZWxheSAgPSBkdXJhdGlvbiAvIDEwLFxuICAgICAgICAgICAgICAgIHZvbHVtZSA9IHZpZGVvLnZvbHVtZSArIDAuMDk7XG5cbiAgICAgICAgICAgIGlmICh2b2x1bWUgPCAxKSB7XG4gICAgICAgICAgICAgICAgdmlkZW8udm9sdW1lID0gdm9sdW1lO1xuXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2ZhZGVJblNvdW5kKHZpZGVvLCBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9vcHRpb25zOiBmdW5jdGlvbiAoa2V5LCBpKSB7XG4gICAgICAgICAgICBpZiAoaSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaSA9IHRoaXMuc2xpZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnNsaWRlc1tpXVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5zbGlkZXNbaV1ba2V5XTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3Nba2V5XTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZ290bzogZnVuY3Rpb24gKG5iKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuc2V0dGluZ3Muc2xpZGVzW25iXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBuYiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2xpZGUgPSBuYjtcblxuICAgICAgICAgICAgdmFyICRzbGlkZSxcbiAgICAgICAgICAgICAgICAkaW5uZXIsXG4gICAgICAgICAgICAgICAgJHZpZGVvLFxuICAgICAgICAgICAgICAgICRzbGlkZXMgICAgICAgPSB0aGlzLiRlbG10LmNoaWxkcmVuKCcudmVnYXMtc2xpZGUnKSxcbiAgICAgICAgICAgICAgICBzcmMgICAgICAgICAgID0gdGhpcy5zZXR0aW5ncy5zbGlkZXNbbmJdLnNyYyxcbiAgICAgICAgICAgICAgICB2aWRlb1NldHRpbmdzID0gdGhpcy5zZXR0aW5ncy5zbGlkZXNbbmJdLnZpZGVvLFxuICAgICAgICAgICAgICAgIGRlbGF5ICAgICAgICAgPSB0aGlzLl9vcHRpb25zKCdkZWxheScpLFxuICAgICAgICAgICAgICAgIGFsaWduICAgICAgICAgPSB0aGlzLl9vcHRpb25zKCdhbGlnbicpLFxuICAgICAgICAgICAgICAgIHZhbGlnbiAgICAgICAgPSB0aGlzLl9vcHRpb25zKCd2YWxpZ24nKSxcbiAgICAgICAgICAgICAgICBjb3ZlciAgICAgICAgID0gdGhpcy5fb3B0aW9ucygnY292ZXInKSxcbiAgICAgICAgICAgICAgICBjb2xvciAgICAgICAgID0gdGhpcy5fb3B0aW9ucygnY29sb3InKSB8fCB0aGlzLiRlbG10LmNzcygnYmFja2dyb3VuZC1jb2xvcicpLFxuICAgICAgICAgICAgICAgIHNlbGYgICAgICAgICAgPSB0aGlzLFxuICAgICAgICAgICAgICAgIHRvdGFsICAgICAgICAgPSAkc2xpZGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICB2aWRlbyxcbiAgICAgICAgICAgICAgICBpbWc7XG5cbiAgICAgICAgICAgIHZhciB0cmFuc2l0aW9uICAgICAgICAgPSB0aGlzLl9vcHRpb25zKCd0cmFuc2l0aW9uJyksXG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uID0gdGhpcy5fb3B0aW9ucygndHJhbnNpdGlvbkR1cmF0aW9uJyksXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uICAgICAgICAgID0gdGhpcy5fb3B0aW9ucygnYW5pbWF0aW9uJyksXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb24gID0gdGhpcy5fb3B0aW9ucygnYW5pbWF0aW9uRHVyYXRpb24nKTtcblxuICAgICAgICAgICAgaWYgKGNvdmVyICE9PSAncmVwZWF0Jykge1xuICAgICAgICAgICAgICAgIGlmIChjb3ZlciA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb3ZlciA9ICdjb3Zlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb3ZlciA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY292ZXIgPSAnY29udGFpbic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHJhbnNpdGlvbiA9PT0gJ3JhbmRvbScgfHwgdHJhbnNpdGlvbiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRyYW5zaXRpb24gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uID0gdGhpcy5fcmFuZG9tKHRyYW5zaXRpb24pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb24gPSB0aGlzLl9yYW5kb20odGhpcy50cmFuc2l0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYW5pbWF0aW9uID09PSAncmFuZG9tJyB8fCBhbmltYXRpb24gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb24gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb24gPSB0aGlzLl9yYW5kb20oYW5pbWF0aW9uKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb24gPSB0aGlzLl9yYW5kb20odGhpcy5hbmltYXRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0cmFuc2l0aW9uRHVyYXRpb24gPT09ICdhdXRvJyB8fCB0cmFuc2l0aW9uRHVyYXRpb24gPiBkZWxheSkge1xuICAgICAgICAgICAgICAgIHRyYW5zaXRpb25EdXJhdGlvbiA9IGRlbGF5O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYW5pbWF0aW9uRHVyYXRpb24gPT09ICdhdXRvJykge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uID0gZGVsYXk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICRzbGlkZSA9ICQoJzxkaXYgY2xhc3M9XCJ2ZWdhcy1zbGlkZVwiPjwvZGl2PicpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdHJhbnNpdGlvbikge1xuICAgICAgICAgICAgICAgICRzbGlkZS5hZGRDbGFzcygndmVnYXMtdHJhbnNpdGlvbi0nICsgdHJhbnNpdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFZpZGVvXG5cbiAgICAgICAgICAgIGlmICh0aGlzLnN1cHBvcnQudmlkZW8gJiYgdmlkZW9TZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIGlmICh2aWRlb1NldHRpbmdzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmlkZW8gPSB0aGlzLl92aWRlbyh2aWRlb1NldHRpbmdzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2aWRlbyA9IHRoaXMuX3ZpZGVvKHZpZGVvU2V0dGluZ3Muc3JjKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2aWRlby5sb29wICA9IHZpZGVvU2V0dGluZ3MubG9vcCAhPT0gdW5kZWZpbmVkID8gdmlkZW9TZXR0aW5ncy5sb29wIDogdHJ1ZTtcbiAgICAgICAgICAgICAgICB2aWRlby5tdXRlZCA9IHZpZGVvU2V0dGluZ3MubXV0ZSAhPT0gdW5kZWZpbmVkID8gdmlkZW9TZXR0aW5ncy5tdXRlIDogdHJ1ZTtcblxuICAgICAgICAgICAgICAgIGlmICh2aWRlby5tdXRlZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmlkZW8udm9sdW1lID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZmFkZUluU291bmQodmlkZW8sIHRyYW5zaXRpb25EdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmlkZW8ucGF1c2UoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkdmlkZW8gPSAkKHZpZGVvKVxuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZlZ2FzLXZpZGVvJylcbiAgICAgICAgICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG9yKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN1cHBvcnQub2JqZWN0Rml0KSB7XG4gICAgICAgICAgICAgICAgICAgICR2aWRlb1xuICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygnb2JqZWN0LXBvc2l0aW9uJywgYWxpZ24gKyAnICcgKyB2YWxpZ24pXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdvYmplY3QtZml0JywgY292ZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCd3aWR0aCcsICAnMTAwJScpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdoZWlnaHQnLCAnMTAwJScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY292ZXIgPT09ICdjb250YWluJykge1xuICAgICAgICAgICAgICAgICAgICAkdmlkZW9cbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ3dpZHRoJywgICcxMDAlJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ2hlaWdodCcsICcxMDAlJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgJHNsaWRlLmFwcGVuZCgkdmlkZW8pO1xuXG4gICAgICAgICAgICAvLyBJbWFnZVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGltZyA9IG5ldyBJbWFnZSgpO1xuXG4gICAgICAgICAgICAgICAgJGlubmVyID0gJCgnPGRpdiBjbGFzcz1cInZlZ2FzLXNsaWRlLWlubmVyXCI+PC9kaXY+JylcbiAgICAgICAgICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1pbWFnZScsICAgICd1cmwoJyArIHNyYyArICcpJylcbiAgICAgICAgICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsICAgIGNvbG9yKVxuICAgICAgICAgICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLXBvc2l0aW9uJywgYWxpZ24gKyAnICcgKyB2YWxpZ24pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNvdmVyID09PSAncmVwZWF0Jykge1xuICAgICAgICAgICAgICAgICAgICAkaW5uZXIuY3NzKCdiYWNrZ3JvdW5kLXJlcGVhdCcsICdyZXBlYXQnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkaW5uZXIuY3NzKCdiYWNrZ3JvdW5kLXNpemUnLCBjb3Zlcik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3VwcG9ydC50cmFuc2l0aW9uICYmIGFuaW1hdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAkaW5uZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmVnYXMtYW5pbWF0aW9uLScgKyBhbmltYXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdhbmltYXRpb24tZHVyYXRpb24nLCAgYW5pbWF0aW9uRHVyYXRpb24gKyAnbXMnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkc2xpZGUuYXBwZW5kKCRpbm5lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5zdXBwb3J0LnRyYW5zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAkc2xpZGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRvdGFsKSB7XG4gICAgICAgICAgICAgICAgJHNsaWRlcy5lcSh0b3RhbCAtIDEpLmFmdGVyKCRzbGlkZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuJGVsbXQucHJlcGVuZCgkc2xpZGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxmLl90aW1lcihmYWxzZSk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdvICgpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl90aW1lcih0cnVlKTtcblxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuc3VwcG9ydC50cmFuc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNsaWRlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCd0cmFuc2l0aW9uJywgJ2FsbCAnICsgdHJhbnNpdGlvbkR1cmF0aW9uICsgJ21zJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCd2ZWdhcy10cmFuc2l0aW9uLScgKyB0cmFuc2l0aW9uICsgJy1vdXQnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzbGlkZXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2aWRlbyA9ICRzbGlkZXMuZmluZCgndmlkZW8nKS5nZXQoMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZpZGVvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWRlby52b2x1bWUgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fZmFkZU91dFNvdW5kKHZpZGVvLCB0cmFuc2l0aW9uRHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2xpZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygndHJhbnNpdGlvbicsICdhbGwgJyArIHRyYW5zaXRpb25EdXJhdGlvbiArICdtcycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmVnYXMtdHJhbnNpdGlvbi0nICsgdHJhbnNpdGlvbiArICctaW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNsaWRlLmZhZGVJbih0cmFuc2l0aW9uRHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkc2xpZGVzLmxlbmd0aCAtIDQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICRzbGlkZXMuZXEoaSkucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRyaWdnZXIoJ3dhbGsnKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2xpZGVTaG93KCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2aWRlbykge1xuICAgICAgICAgICAgICAgIGlmICh2aWRlby5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZpZGVvLmN1cnJlbnRUaW1lID0gMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2aWRlby5wbGF5KCk7XG4gICAgICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgICAgICAgICBpbWcub25sb2FkID0gZ287XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2h1ZmZsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRlbXAsXG4gICAgICAgICAgICAgICAgcmFuZDtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMudG90YWwgLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgcmFuZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgICAgICAgICAgIHRlbXAgPSB0aGlzLnNldHRpbmdzLnNsaWRlc1tpXTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3Muc2xpZGVzW2ldID0gdGhpcy5zZXR0aW5ncy5zbGlkZXNbcmFuZF07XG4gICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5zbGlkZXNbcmFuZF0gPSB0ZW1wO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHBsYXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnBhdXNlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdwbGF5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX3RpbWVyKGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcigncGF1c2UnKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0b2dnbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnBhdXNlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGxheWluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0aGlzLnBhdXNlZCAmJiAhdGhpcy5ub3Nob3c7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3VycmVudDogZnVuY3Rpb24gKGFkdmFuY2VkKSB7XG4gICAgICAgICAgICBpZiAoYWR2YW5jZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzbGlkZTogdGhpcy5zbGlkZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogIHRoaXMuc2V0dGluZ3Muc2xpZGVzW3RoaXMuc2xpZGVdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNsaWRlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGp1bXA6IGZ1bmN0aW9uIChuYikge1xuICAgICAgICAgICAgaWYgKG5iIDwgMCB8fCBuYiA+IHRoaXMudG90YWwgLSAxIHx8IG5iID09PSB0aGlzLnNsaWRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNsaWRlID0gbmI7XG4gICAgICAgICAgICB0aGlzLl9nb3RvKHRoaXMuc2xpZGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuc2xpZGUrKztcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2xpZGUgPj0gdGhpcy50b3RhbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2xpZGUgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9nb3RvKHRoaXMuc2xpZGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHByZXZpb3VzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnNsaWRlLS07XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNsaWRlIDwgMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2xpZGUgPSB0aGlzLnRvdGFsIC0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZ290byh0aGlzLnNsaWRlKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0cmlnZ2VyOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBbXTtcblxuICAgICAgICAgICAgaWYgKGZuID09PSAnaW5pdCcpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSBbIHRoaXMuc2V0dGluZ3MgXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0gW1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNsaWRlLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLnNsaWRlc1t0aGlzLnNsaWRlXVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuJGVsbXQudHJpZ2dlcigndmVnYXMnICsgZm4sIHBhcmFtcyk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5zZXR0aW5nc1tmbl0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzW2ZuXS5hcHBseSh0aGlzLiRlbG10LCBwYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9wdGlvbnM6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgb2xkU2xpZGVzID0gdGhpcy5zZXR0aW5ncy5zbGlkZXMuc2xpY2UoKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgJC52ZWdhcy5kZWZhdWx0cywga2V5KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5nc1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3M7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluIGNhc2Ugc2xpZGVzIGhhdmUgY2hhbmdlZFxuICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3Muc2xpZGVzICE9PSBvbGRTbGlkZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRvdGFsICA9IHRoaXMuc2V0dGluZ3Muc2xpZGVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aGlzLm5vc2hvdyA9IHRoaXMudG90YWwgPCAyO1xuICAgICAgICAgICAgICAgIHRoaXMuX3ByZWxvYWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcblxuICAgICAgICAgICAgdGhpcy4kZWxtdC5yZW1vdmVDbGFzcygndmVnYXMtY29udGFpbmVyJyk7XG4gICAgICAgICAgICB0aGlzLiRlbG10LmZpbmQoJz4gLnZlZ2FzLXNsaWRlJykucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLiRlbG10LmZpbmQoJz4gLnZlZ2FzLXdyYXBwZXInKS5jbG9uZSh0cnVlKS5jaGlsZHJlbigpLmFwcGVuZFRvKHRoaXMuJGVsbXQpO1xuICAgICAgICAgICAgdGhpcy4kZWxtdC5maW5kKCc+IC52ZWdhcy13cmFwcGVyJykucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRpbWVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kdGltZXIucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLm92ZXJsYXkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRvdmVybGF5LnJlbW92ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmVsbXQuX3ZlZ2FzID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmZuLnZlZ2FzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgICAgIGVycm9yID0gZmFsc2UsXG4gICAgICAgICAgICByZXR1cm5zO1xuXG4gICAgICAgIGlmIChvcHRpb25zID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX3ZlZ2FzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZlZ2FzID0gbmV3IFZlZ2FzKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLl92ZWdhcztcblxuICAgICAgICAgICAgICAgIGlmICghaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBWZWdhcyBhcHBsaWVkIHRvIHRoaXMgZWxlbWVudC4nKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGluc3RhbmNlW29wdGlvbnNdID09PSAnZnVuY3Rpb24nICYmIG9wdGlvbnNbMF0gIT09ICdfJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5zID0gaW5zdGFuY2Vbb3B0aW9uc10uYXBwbHkoaW5zdGFuY2UsIFtdLnNsaWNlLmNhbGwoYXJncywgMSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBtZXRob2QgXCInICsgb3B0aW9ucyArICdcIiBpbiBWZWdhcy4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldHVybnMgIT09IHVuZGVmaW5lZCA/IHJldHVybnMgOiB0aGlzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQudmVnYXMgPSB7fTtcbiAgICAkLnZlZ2FzLmRlZmF1bHRzID0gZGVmYXVsdHM7XG5cbiAgICAkLnZlZ2FzLmlzVmlkZW9Db21wYXRpYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gIS8oQW5kcm9pZHx3ZWJPU3xQaG9uZXxpUGFkfGlQb2R8QmxhY2tCZXJyeXxXaW5kb3dzIFBob25lKS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gICAgfTtcblxufSkod2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG8pO1xuIiwiLyoqXG4gKiBGZWF0aGVybGlnaHQgLSB1bHRyYSBzbGltIGpRdWVyeSBsaWdodGJveFxuICogVmVyc2lvbiAxLjMuNSAtIGh0dHA6Ly9ub2VsYm9zcy5naXRodWIuaW8vZmVhdGhlcmxpZ2h0L1xuICpcbiAqIENvcHlyaWdodCAyMDE1LCBOb8OrbCBSYW91bCBCb3NzYXJ0IChodHRwOi8vd3d3Lm5vZWxib3NzLmNvbSlcbiAqIE1JVCBMaWNlbnNlZC5cbioqL1xuKGZ1bmN0aW9uKCQpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0aWYoJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiAkKSB7XG5cdFx0aWYoJ2NvbnNvbGUnIGluIHdpbmRvdyl7IHdpbmRvdy5jb25zb2xlLmluZm8oJ1RvbyBtdWNoIGxpZ2h0bmVzcywgRmVhdGhlcmxpZ2h0IG5lZWRzIGpRdWVyeS4nKTsgfVxuXHRcdHJldHVybjtcblx0fVxuXG5cdC8qIEZlYXRoZXJsaWdodCBpcyBleHBvcnRlZCBhcyAkLmZlYXRoZXJsaWdodC5cblx0ICAgSXQgaXMgYSBmdW5jdGlvbiB1c2VkIHRvIG9wZW4gYSBmZWF0aGVybGlnaHQgbGlnaHRib3guXG5cblx0ICAgW3RlY2hdXG5cdCAgIEZlYXRoZXJsaWdodCB1c2VzIHByb3RvdHlwZSBpbmhlcml0YW5jZS5cblx0ICAgRWFjaCBvcGVuZWQgbGlnaHRib3ggd2lsbCBoYXZlIGEgY29ycmVzcG9uZGluZyBvYmplY3QuXG5cdCAgIFRoYXQgb2JqZWN0IG1heSBoYXZlIHNvbWUgYXR0cmlidXRlcyB0aGF0IG92ZXJyaWRlIHRoZVxuXHQgICBwcm90b3R5cGUncy5cblx0ICAgRXh0ZW5zaW9ucyBjcmVhdGVkIHdpdGggRmVhdGhlcmxpZ2h0LmV4dGVuZCB3aWxsIGhhdmUgdGhlaXJcblx0ICAgb3duIHByb3RvdHlwZSB0aGF0IGluaGVyaXRzIGZyb20gRmVhdGhlcmxpZ2h0J3MgcHJvdG90eXBlLFxuXHQgICB0aHVzIGF0dHJpYnV0ZXMgY2FuIGJlIG92ZXJyaWRlbiBlaXRoZXIgYXQgdGhlIG9iamVjdCBsZXZlbCxcblx0ICAgb3IgYXQgdGhlIGV4dGVuc2lvbiBsZXZlbC5cblx0ICAgVG8gY3JlYXRlIGNhbGxiYWNrcyB0aGF0IGNoYWluIHRoZW1zZWx2ZXMgaW5zdGVhZCBvZiBvdmVycmlkaW5nLFxuXHQgICB1c2UgY2hhaW5DYWxsYmFja3MuXG5cdCAgIEZvciB0aG9zZSBmYW1pbGlhciB3aXRoIENvZmZlZVNjcmlwdCwgdGhpcyBjb3JyZXNwb25kIHRvXG5cdCAgIEZlYXRoZXJsaWdodCBiZWluZyBhIGNsYXNzIGFuZCB0aGUgR2FsbGVyeSBiZWluZyBhIGNsYXNzXG5cdCAgIGV4dGVuZGluZyBGZWF0aGVybGlnaHQuXG5cdCAgIFRoZSBjaGFpbkNhbGxiYWNrcyBpcyB1c2VkIHNpbmNlIHdlIGRvbid0IGhhdmUgYWNjZXNzIHRvXG5cdCAgIENvZmZlZVNjcmlwdCdzIGBzdXBlcmAuXG5cdCovXG5cblx0ZnVuY3Rpb24gRmVhdGhlcmxpZ2h0KCRjb250ZW50LCBjb25maWcpIHtcblx0XHRpZih0aGlzIGluc3RhbmNlb2YgRmVhdGhlcmxpZ2h0KSB7ICAvKiBjYWxsZWQgd2l0aCBuZXcgKi9cblx0XHRcdHRoaXMuaWQgPSBGZWF0aGVybGlnaHQuaWQrKztcblx0XHRcdHRoaXMuc2V0dXAoJGNvbnRlbnQsIGNvbmZpZyk7XG5cdFx0XHR0aGlzLmNoYWluQ2FsbGJhY2tzKEZlYXRoZXJsaWdodC5fY2FsbGJhY2tDaGFpbik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBmbCA9IG5ldyBGZWF0aGVybGlnaHQoJGNvbnRlbnQsIGNvbmZpZyk7XG5cdFx0XHRmbC5vcGVuKCk7XG5cdFx0XHRyZXR1cm4gZmw7XG5cdFx0fVxuXHR9XG5cblx0dmFyIG9wZW5lZCA9IFtdLFxuXHRcdHBydW5lT3BlbmVkID0gZnVuY3Rpb24ocmVtb3ZlKSB7XG5cdFx0XHRvcGVuZWQgPSAkLmdyZXAob3BlbmVkLCBmdW5jdGlvbihmbCkge1xuXHRcdFx0XHRyZXR1cm4gZmwgIT09IHJlbW92ZSAmJiBmbC4kaW5zdGFuY2UuY2xvc2VzdCgnYm9keScpLmxlbmd0aCA+IDA7XG5cdFx0XHR9ICk7XG5cdFx0XHRyZXR1cm4gb3BlbmVkO1xuXHRcdH07XG5cblx0Ly8gc3RydWN0dXJlKHtpZnJhbWVNaW5IZWlnaHQ6IDQ0LCBmb286IDB9LCAnaWZyYW1lJylcblx0Ly8gICAjPT4ge21pbi1oZWlnaHQ6IDQ0fVxuXHR2YXIgc3RydWN0dXJlID0gZnVuY3Rpb24ob2JqLCBwcmVmaXgpIHtcblx0XHR2YXIgcmVzdWx0ID0ge30sXG5cdFx0XHRyZWdleCA9IG5ldyBSZWdFeHAoJ14nICsgcHJlZml4ICsgJyhbQS1aXSkoLiopJyk7XG5cdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xuXHRcdFx0dmFyIG1hdGNoID0ga2V5Lm1hdGNoKHJlZ2V4KTtcblx0XHRcdGlmIChtYXRjaCkge1xuXHRcdFx0XHR2YXIgZGFzaGVyaXplZCA9IChtYXRjaFsxXSArIG1hdGNoWzJdLnJlcGxhY2UoLyhbQS1aXSkvZywgJy0kMScpKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRyZXN1bHRbZGFzaGVyaXplZF0gPSBvYmpba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fTtcblxuXHQvKiBkb2N1bWVudCB3aWRlIGtleSBoYW5kbGVyICovXG5cdHZhciBldmVudE1hcCA9IHsga2V5dXA6ICdvbktleVVwJywgcmVzaXplOiAnb25SZXNpemUnIH07XG5cblx0dmFyIGdsb2JhbEV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0JC5lYWNoKEZlYXRoZXJsaWdodC5vcGVuZWQoKS5yZXZlcnNlKCksIGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCFldmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkge1xuXHRcdFx0XHRpZiAoZmFsc2UgPT09IHRoaXNbZXZlbnRNYXBbZXZlbnQudHlwZV1dKGV2ZW50KSkge1xuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyByZXR1cm4gZmFsc2U7XG5cdFx0XHQgIH1cblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblxuXHR2YXIgdG9nZ2xlR2xvYmFsRXZlbnRzID0gZnVuY3Rpb24oc2V0KSB7XG5cdFx0XHRpZihzZXQgIT09IEZlYXRoZXJsaWdodC5fZ2xvYmFsSGFuZGxlckluc3RhbGxlZCkge1xuXHRcdFx0XHRGZWF0aGVybGlnaHQuX2dsb2JhbEhhbmRsZXJJbnN0YWxsZWQgPSBzZXQ7XG5cdFx0XHRcdHZhciBldmVudHMgPSAkLm1hcChldmVudE1hcCwgZnVuY3Rpb24oXywgbmFtZSkgeyByZXR1cm4gbmFtZSsnLicrRmVhdGhlcmxpZ2h0LnByb3RvdHlwZS5uYW1lc3BhY2U7IH0gKS5qb2luKCcgJyk7XG5cdFx0XHRcdCQod2luZG93KVtzZXQgPyAnb24nIDogJ29mZiddKGV2ZW50cywgZ2xvYmFsRXZlbnRIYW5kbGVyKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdEZlYXRoZXJsaWdodC5wcm90b3R5cGUgPSB7XG5cdFx0Y29uc3RydWN0b3I6IEZlYXRoZXJsaWdodCxcblx0XHQvKioqIGRlZmF1bHRzICoqKi9cblx0XHQvKiBleHRlbmQgZmVhdGhlcmxpZ2h0IHdpdGggZGVmYXVsdHMgYW5kIG1ldGhvZHMgKi9cblx0XHRuYW1lc3BhY2U6ICAgICAgJ2ZlYXRoZXJsaWdodCcsICAgICAgICAvKiBOYW1lIG9mIHRoZSBldmVudHMgYW5kIGNzcyBjbGFzcyBwcmVmaXggKi9cblx0XHR0YXJnZXRBdHRyOiAgICAgJ2RhdGEtZmVhdGhlcmxpZ2h0JywgICAvKiBBdHRyaWJ1dGUgb2YgdGhlIHRyaWdnZXJlZCBlbGVtZW50IHRoYXQgY29udGFpbnMgdGhlIHNlbGVjdG9yIHRvIHRoZSBsaWdodGJveCBjb250ZW50ICovXG5cdFx0dmFyaWFudDogICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgLyogQ2xhc3MgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIGNoYW5nZSBsb29rIG9mIHRoZSBsaWdodGJveCAqL1xuXHRcdHJlc2V0Q3NzOiAgICAgICBmYWxzZSwgICAgICAgICAgICAgICAgIC8qIFJlc2V0IGFsbCBjc3MgKi9cblx0XHRiYWNrZ3JvdW5kOiAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAvKiBDdXN0b20gRE9NIGZvciB0aGUgYmFja2dyb3VuZCwgd3JhcHBlciBhbmQgdGhlIGNsb3NlYnV0dG9uICovXG5cdFx0b3BlblRyaWdnZXI6ICAgICdjbGljaycsICAgICAgICAgICAgICAgLyogRXZlbnQgdGhhdCB0cmlnZ2VycyB0aGUgbGlnaHRib3ggKi9cblx0XHRjbG9zZVRyaWdnZXI6ICAgJ2NsaWNrJywgICAgICAgICAgICAgICAvKiBFdmVudCB0aGF0IHRyaWdnZXJzIHRoZSBjbG9zaW5nIG9mIHRoZSBsaWdodGJveCAqL1xuXHRcdGZpbHRlcjogICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgIC8qIFNlbGVjdG9yIHRvIGZpbHRlciBldmVudHMuIFRoaW5rICQoLi4uKS5vbignY2xpY2snLCBmaWx0ZXIsIGV2ZW50SGFuZGxlcikgKi9cblx0XHRyb290OiAgICAgICAgICAgJ2JvZHknLCAgICAgICAgICAgICAgICAvKiBXaGVyZSB0byBhcHBlbmQgZmVhdGhlcmxpZ2h0cyAqL1xuXHRcdG9wZW5TcGVlZDogICAgICAyNTAsICAgICAgICAgICAgICAgICAgIC8qIER1cmF0aW9uIG9mIG9wZW5pbmcgYW5pbWF0aW9uICovXG5cdFx0Y2xvc2VTcGVlZDogICAgIDI1MCwgICAgICAgICAgICAgICAgICAgLyogRHVyYXRpb24gb2YgY2xvc2luZyBhbmltYXRpb24gKi9cblx0XHRjbG9zZU9uQ2xpY2s6ICAgJ2JhY2tncm91bmQnLCAgICAgICAgICAvKiBDbG9zZSBsaWdodGJveCBvbiBjbGljayAoJ2JhY2tncm91bmQnLCAnYW55d2hlcmUnIG9yIGZhbHNlKSAqL1xuXHRcdGNsb3NlT25Fc2M6ICAgICB0cnVlLCAgICAgICAgICAgICAgICAgIC8qIENsb3NlIGxpZ2h0Ym94IHdoZW4gcHJlc3NpbmcgZXNjICovXG5cdFx0Y2xvc2VJY29uOiAgICAgICcmIzEwMDA1OycsICAgICAgICAgICAgLyogQ2xvc2UgaWNvbiAqL1xuXHRcdGxvYWRpbmc6ICAgICAgICAnJywgICAgICAgICAgICAgICAgICAgIC8qIENvbnRlbnQgdG8gc2hvdyB3aGlsZSBpbml0aWFsIGNvbnRlbnQgaXMgbG9hZGluZyAqL1xuXHRcdHBlcnNpc3Q6ICAgICAgICBmYWxzZSwgICAgICAgICAgICAgICAgIC8qIElmIHNldCwgdGhlIGNvbnRlbnQgd2lsbCBwZXJzaXN0IGFuZCB3aWxsIGJlIHNob3duIGFnYWluIHdoZW4gb3BlbmVkIGFnYWluLiAnc2hhcmVkJyBpcyBhIHNwZWNpYWwgdmFsdWUgd2hlbiBiaW5kaW5nIG11bHRpcGxlIGVsZW1lbnRzIGZvciB0aGVtIHRvIHNoYXJlIHRoZSBzYW1lIGNvbnRlbnQgKi9cblx0XHRvdGhlckNsb3NlOiAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAvKiBTZWxlY3RvciBmb3IgYWx0ZXJuYXRlIGNsb3NlIGJ1dHRvbnMgKGUuZy4gXCJhLmNsb3NlXCIpICovXG5cdFx0YmVmb3JlT3BlbjogICAgICQubm9vcCwgICAgICAgICAgICAgICAgLyogQ2FsbGVkIGJlZm9yZSBvcGVuLiBjYW4gcmV0dXJuIGZhbHNlIHRvIHByZXZlbnQgb3BlbmluZyBvZiBsaWdodGJveC4gR2V0cyBldmVudCBhcyBwYXJhbWV0ZXIsIHRoaXMgY29udGFpbnMgYWxsIGRhdGEgKi9cblx0XHRiZWZvcmVDb250ZW50OiAgJC5ub29wLCAgICAgICAgICAgICAgICAvKiBDYWxsZWQgd2hlbiBjb250ZW50IGlzIGxvYWRlZC4gR2V0cyBldmVudCBhcyBwYXJhbWV0ZXIsIHRoaXMgY29udGFpbnMgYWxsIGRhdGEgKi9cblx0XHRiZWZvcmVDbG9zZTogICAgJC5ub29wLCAgICAgICAgICAgICAgICAvKiBDYWxsZWQgYmVmb3JlIGNsb3NlLiBjYW4gcmV0dXJuIGZhbHNlIHRvIHByZXZlbnQgb3BlbmluZyBvZiBsaWdodGJveC4gR2V0cyBldmVudCBhcyBwYXJhbWV0ZXIsIHRoaXMgY29udGFpbnMgYWxsIGRhdGEgKi9cblx0XHRhZnRlck9wZW46ICAgICAgJC5ub29wLCAgICAgICAgICAgICAgICAvKiBDYWxsZWQgYWZ0ZXIgb3Blbi4gR2V0cyBldmVudCBhcyBwYXJhbWV0ZXIsIHRoaXMgY29udGFpbnMgYWxsIGRhdGEgKi9cblx0XHRhZnRlckNvbnRlbnQ6ICAgJC5ub29wLCAgICAgICAgICAgICAgICAvKiBDYWxsZWQgYWZ0ZXIgY29udGVudCBpcyByZWFkeSBhbmQgaGFzIGJlZW4gc2V0LiBHZXRzIGV2ZW50IGFzIHBhcmFtZXRlciwgdGhpcyBjb250YWlucyBhbGwgZGF0YSAqL1xuXHRcdGFmdGVyQ2xvc2U6ICAgICAkLm5vb3AsICAgICAgICAgICAgICAgIC8qIENhbGxlZCBhZnRlciBjbG9zZS4gR2V0cyBldmVudCBhcyBwYXJhbWV0ZXIsIHRoaXMgY29udGFpbnMgYWxsIGRhdGEgKi9cblx0XHRvbktleVVwOiAgICAgICAgJC5ub29wLCAgICAgICAgICAgICAgICAvKiBDYWxsZWQgb24ga2V5IHVwIGZvciB0aGUgZnJvbnRtb3N0IGZlYXRoZXJsaWdodCAqL1xuXHRcdG9uUmVzaXplOiAgICAgICAkLm5vb3AsICAgICAgICAgICAgICAgIC8qIENhbGxlZCBhZnRlciBuZXcgY29udGVudCBhbmQgd2hlbiBhIHdpbmRvdyBpcyByZXNpemVkICovXG5cdFx0dHlwZTogICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgLyogU3BlY2lmeSB0eXBlIG9mIGxpZ2h0Ym94LiBJZiB1bnNldCwgaXQgd2lsbCBjaGVjayBmb3IgdGhlIHRhcmdldEF0dHJzIHZhbHVlLiAqL1xuXHRcdGNvbnRlbnRGaWx0ZXJzOiBbJ2pxdWVyeScsICdpbWFnZScsICdodG1sJywgJ2FqYXgnLCAnaWZyYW1lJywgJ3RleHQnXSwgLyogTGlzdCBvZiBjb250ZW50IGZpbHRlcnMgdG8gdXNlIHRvIGRldGVybWluZSB0aGUgY29udGVudCAqL1xuXG5cdFx0LyoqKiBtZXRob2RzICoqKi9cblx0XHQvKiBzZXR1cCBpdGVyYXRlcyBvdmVyIGEgc2luZ2xlIGluc3RhbmNlIG9mIGZlYXRoZXJsaWdodCBhbmQgcHJlcGFyZXMgdGhlIGJhY2tncm91bmQgYW5kIGJpbmRzIHRoZSBldmVudHMgKi9cblx0XHRzZXR1cDogZnVuY3Rpb24odGFyZ2V0LCBjb25maWcpe1xuXHRcdFx0LyogYWxsIGFyZ3VtZW50cyBhcmUgb3B0aW9uYWwgKi9cblx0XHRcdGlmICh0eXBlb2YgdGFyZ2V0ID09PSAnb2JqZWN0JyAmJiB0YXJnZXQgaW5zdGFuY2VvZiAkID09PSBmYWxzZSAmJiAhY29uZmlnKSB7XG5cdFx0XHRcdGNvbmZpZyA9IHRhcmdldDtcblx0XHRcdFx0dGFyZ2V0ID0gdW5kZWZpbmVkO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgc2VsZiA9ICQuZXh0ZW5kKHRoaXMsIGNvbmZpZywge3RhcmdldDogdGFyZ2V0fSksXG5cdFx0XHRcdGNzcyA9ICFzZWxmLnJlc2V0Q3NzID8gc2VsZi5uYW1lc3BhY2UgOiBzZWxmLm5hbWVzcGFjZSsnLXJlc2V0JywgLyogYnkgYWRkaW5nIC1yZXNldCB0byB0aGUgY2xhc3NuYW1lLCB3ZSByZXNldCBhbGwgdGhlIGRlZmF1bHQgY3NzICovXG5cdFx0XHRcdCRiYWNrZ3JvdW5kID0gJChzZWxmLmJhY2tncm91bmQgfHwgW1xuXHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiJytjc3MrJy1sb2FkaW5nICcrY3NzKydcIj4nLFxuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCInK2NzcysnLWNvbnRlbnRcIj4nLFxuXHRcdFx0XHRcdFx0XHQnPHNwYW4gY2xhc3M9XCInK2NzcysnLWNsb3NlLWljb24gJysgc2VsZi5uYW1lc3BhY2UgKyAnLWNsb3NlXCI+Jyxcblx0XHRcdFx0XHRcdFx0XHRzZWxmLmNsb3NlSWNvbixcblx0XHRcdFx0XHRcdFx0Jzwvc3Bhbj4nLFxuXHRcdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cIicrc2VsZi5uYW1lc3BhY2UrJy1pbm5lclwiPicgKyBzZWxmLmxvYWRpbmcgKyAnPC9kaXY+Jyxcblx0XHRcdFx0XHRcdCc8L2Rpdj4nLFxuXHRcdFx0XHRcdCc8L2Rpdj4nXS5qb2luKCcnKSksXG5cdFx0XHRcdGNsb3NlQnV0dG9uU2VsZWN0b3IgPSAnLicrc2VsZi5uYW1lc3BhY2UrJy1jbG9zZScgKyAoc2VsZi5vdGhlckNsb3NlID8gJywnICsgc2VsZi5vdGhlckNsb3NlIDogJycpO1xuXG5cdFx0XHRzZWxmLiRpbnN0YW5jZSA9ICRiYWNrZ3JvdW5kLmNsb25lKCkuYWRkQ2xhc3Moc2VsZi52YXJpYW50KTsgLyogY2xvbmUgRE9NIGZvciB0aGUgYmFja2dyb3VuZCwgd3JhcHBlciBhbmQgdGhlIGNsb3NlIGJ1dHRvbiAqL1xuXG5cdFx0XHQvKiBjbG9zZSB3aGVuIGNsaWNrIG9uIGJhY2tncm91bmQvYW55d2hlcmUvbnVsbCBvciBjbG9zZWJveCAqL1xuXHRcdFx0c2VsZi4kaW5zdGFuY2Uub24oc2VsZi5jbG9zZVRyaWdnZXIrJy4nK3NlbGYubmFtZXNwYWNlLCBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHR2YXIgJHRhcmdldCA9ICQoZXZlbnQudGFyZ2V0KTtcblx0XHRcdFx0aWYoICgnYmFja2dyb3VuZCcgPT09IHNlbGYuY2xvc2VPbkNsaWNrICAmJiAkdGFyZ2V0LmlzKCcuJytzZWxmLm5hbWVzcGFjZSkpXG5cdFx0XHRcdFx0fHwgJ2FueXdoZXJlJyA9PT0gc2VsZi5jbG9zZU9uQ2xpY2tcblx0XHRcdFx0XHR8fCAkdGFyZ2V0LmNsb3Nlc3QoY2xvc2VCdXR0b25TZWxlY3RvcikubGVuZ3RoICl7XG5cdFx0XHRcdFx0c2VsZi5jbG9zZShldmVudCk7XG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHQvKiB0aGlzIG1ldGhvZCBwcmVwYXJlcyB0aGUgY29udGVudCBhbmQgY29udmVydHMgaXQgaW50byBhIGpRdWVyeSBvYmplY3Qgb3IgYSBwcm9taXNlICovXG5cdFx0Z2V0Q29udGVudDogZnVuY3Rpb24oKXtcblx0XHRcdGlmKHRoaXMucGVyc2lzdCAhPT0gZmFsc2UgJiYgdGhpcy4kY29udGVudCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy4kY29udGVudDtcblx0XHRcdH1cblx0XHRcdHZhciBzZWxmID0gdGhpcyxcblx0XHRcdFx0ZmlsdGVycyA9IHRoaXMuY29uc3RydWN0b3IuY29udGVudEZpbHRlcnMsXG5cdFx0XHRcdHJlYWRUYXJnZXRBdHRyID0gZnVuY3Rpb24obmFtZSl7IHJldHVybiBzZWxmLiRjdXJyZW50VGFyZ2V0ICYmIHNlbGYuJGN1cnJlbnRUYXJnZXQuYXR0cihuYW1lKTsgfSxcblx0XHRcdFx0dGFyZ2V0VmFsdWUgPSByZWFkVGFyZ2V0QXR0cihzZWxmLnRhcmdldEF0dHIpLFxuXHRcdFx0XHRkYXRhID0gc2VsZi50YXJnZXQgfHwgdGFyZ2V0VmFsdWUgfHwgJyc7XG5cblx0XHRcdC8qIEZpbmQgd2hpY2ggZmlsdGVyIGFwcGxpZXMgKi9cblx0XHRcdHZhciBmaWx0ZXIgPSBmaWx0ZXJzW3NlbGYudHlwZV07IC8qIGNoZWNrIGV4cGxpY2l0IHR5cGUgbGlrZSB7dHlwZTogJ2ltYWdlJ30gKi9cblxuXHRcdFx0LyogY2hlY2sgZXhwbGljaXQgdHlwZSBsaWtlIGRhdGEtZmVhdGhlcmxpZ2h0PVwiaW1hZ2VcIiAqL1xuXHRcdFx0aWYoIWZpbHRlciAmJiBkYXRhIGluIGZpbHRlcnMpIHtcblx0XHRcdFx0ZmlsdGVyID0gZmlsdGVyc1tkYXRhXTtcblx0XHRcdFx0ZGF0YSA9IHNlbGYudGFyZ2V0ICYmIHRhcmdldFZhbHVlO1xuXHRcdFx0fVxuXHRcdFx0ZGF0YSA9IGRhdGEgfHwgcmVhZFRhcmdldEF0dHIoJ2hyZWYnKSB8fCAnJztcblxuXHRcdFx0LyogY2hlY2sgZXhwbGljaXR5IHR5cGUgJiBjb250ZW50IGxpa2Uge2ltYWdlOiAncGhvdG8uanBnJ30gKi9cblx0XHRcdGlmKCFmaWx0ZXIpIHtcblx0XHRcdFx0Zm9yKHZhciBmaWx0ZXJOYW1lIGluIGZpbHRlcnMpIHtcblx0XHRcdFx0XHRpZihzZWxmW2ZpbHRlck5hbWVdKSB7XG5cdFx0XHRcdFx0XHRmaWx0ZXIgPSBmaWx0ZXJzW2ZpbHRlck5hbWVdO1xuXHRcdFx0XHRcdFx0ZGF0YSA9IHNlbGZbZmlsdGVyTmFtZV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8qIG90aGVyd2lzZSBpdCdzIGltcGxpY2l0LCBydW4gY2hlY2tzICovXG5cdFx0XHRpZighZmlsdGVyKSB7XG5cdFx0XHRcdHZhciB0YXJnZXQgPSBkYXRhO1xuXHRcdFx0XHRkYXRhID0gbnVsbDtcblx0XHRcdFx0JC5lYWNoKHNlbGYuY29udGVudEZpbHRlcnMsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGZpbHRlciA9IGZpbHRlcnNbdGhpc107XG5cdFx0XHRcdFx0aWYoZmlsdGVyLnRlc3QpICB7XG5cdFx0XHRcdFx0XHRkYXRhID0gZmlsdGVyLnRlc3QodGFyZ2V0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoIWRhdGEgJiYgZmlsdGVyLnJlZ2V4ICYmIHRhcmdldC5tYXRjaCAmJiB0YXJnZXQubWF0Y2goZmlsdGVyLnJlZ2V4KSkge1xuXHRcdFx0XHRcdFx0ZGF0YSA9IHRhcmdldDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuICFkYXRhO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0aWYoIWRhdGEpIHtcblx0XHRcdFx0XHRpZignY29uc29sZScgaW4gd2luZG93KXsgd2luZG93LmNvbnNvbGUuZXJyb3IoJ0ZlYXRoZXJsaWdodDogbm8gY29udGVudCBmaWx0ZXIgZm91bmQgJyArICh0YXJnZXQgPyAnIGZvciBcIicgKyB0YXJnZXQgKyAnXCInIDogJyAobm8gdGFyZ2V0IHNwZWNpZmllZCknKSk7IH1cblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdC8qIFByb2Nlc3MgaXQgKi9cblx0XHRcdHJldHVybiBmaWx0ZXIucHJvY2Vzcy5jYWxsKHNlbGYsIGRhdGEpO1xuXHRcdH0sXG5cblx0XHQvKiBzZXRzIHRoZSBjb250ZW50IG9mICRpbnN0YW5jZSB0byAkY29udGVudCAqL1xuXHRcdHNldENvbnRlbnQ6IGZ1bmN0aW9uKCRjb250ZW50KXtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcdC8qIHdlIG5lZWQgYSBzcGVjaWFsIGNsYXNzIGZvciB0aGUgaWZyYW1lICovXG5cdFx0XHRpZigkY29udGVudC5pcygnaWZyYW1lJykgfHwgJCgnaWZyYW1lJywgJGNvbnRlbnQpLmxlbmd0aCA+IDApe1xuXHRcdFx0XHRzZWxmLiRpbnN0YW5jZS5hZGRDbGFzcyhzZWxmLm5hbWVzcGFjZSsnLWlmcmFtZScpO1xuXHRcdFx0fVxuXG5cdFx0XHRzZWxmLiRpbnN0YW5jZS5yZW1vdmVDbGFzcyhzZWxmLm5hbWVzcGFjZSsnLWxvYWRpbmcnKTtcblxuXHRcdFx0LyogcmVwbGFjZSBjb250ZW50IGJ5IGFwcGVuZGluZyB0byBleGlzdGluZyBvbmUgYmVmb3JlIGl0IGlzIHJlbW92ZWRcblx0XHRcdCAgIHRoaXMgaW5zdXJlcyB0aGF0IGZlYXRoZXJsaWdodC1pbm5lciByZW1haW4gYXQgdGhlIHNhbWUgcmVsYXRpdmVcblx0XHRcdFx0IHBvc2l0aW9uIHRvIGFueSBvdGhlciBpdGVtcyBhZGRlZCB0byBmZWF0aGVybGlnaHQtY29udGVudCAqL1xuXHRcdFx0c2VsZi4kaW5zdGFuY2UuZmluZCgnLicrc2VsZi5uYW1lc3BhY2UrJy1pbm5lcicpXG5cdFx0XHRcdC5ub3QoJGNvbnRlbnQpICAgICAgICAgICAgICAgIC8qIGV4Y2x1ZGVkIG5ldyBjb250ZW50LCBpbXBvcnRhbnQgaWYgcGVyc2lzdGVkICovXG5cdFx0XHRcdC5zbGljZSgxKS5yZW1vdmUoKS5lbmQoKSAgICAgIC8qIEluIHRoZSB1bmV4cGVjdGVkIGV2ZW50IHdoZXJlIHRoZXJlIGFyZSBtYW55IGlubmVyIGVsZW1lbnRzLCByZW1vdmUgYWxsIGJ1dCB0aGUgZmlyc3Qgb25lICovXG5cdFx0XHRcdC5yZXBsYWNlV2l0aCgkLmNvbnRhaW5zKHNlbGYuJGluc3RhbmNlWzBdLCAkY29udGVudFswXSkgPyAnJyA6ICRjb250ZW50KTtcblxuXHRcdFx0c2VsZi4kY29udGVudCA9ICRjb250ZW50LmFkZENsYXNzKHNlbGYubmFtZXNwYWNlKyctaW5uZXInKTtcblxuXHRcdFx0cmV0dXJuIHNlbGY7XG5cdFx0fSxcblxuXHRcdC8qIG9wZW5zIHRoZSBsaWdodGJveC4gXCJ0aGlzXCIgY29udGFpbnMgJGluc3RhbmNlIHdpdGggdGhlIGxpZ2h0Ym94LCBhbmQgd2l0aCB0aGUgY29uZmlnLlxuXHRcdFx0UmV0dXJucyBhIHByb21pc2UgdGhhdCBpcyByZXNvbHZlZCBhZnRlciBpcyBzdWNjZXNzZnVsbHkgb3BlbmVkLiAqL1xuXHRcdG9wZW46IGZ1bmN0aW9uKGV2ZW50KXtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcdHNlbGYuJGluc3RhbmNlLmhpZGUoKS5hcHBlbmRUbyhzZWxmLnJvb3QpO1xuXHRcdFx0aWYoKCFldmVudCB8fCAhZXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpXG5cdFx0XHRcdCYmIHNlbGYuYmVmb3JlT3BlbihldmVudCkgIT09IGZhbHNlKSB7XG5cblx0XHRcdFx0aWYoZXZlbnQpe1xuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyICRjb250ZW50ID0gc2VsZi5nZXRDb250ZW50KCk7XG5cblx0XHRcdFx0aWYoJGNvbnRlbnQpIHtcblx0XHRcdFx0XHRvcGVuZWQucHVzaChzZWxmKTtcblxuXHRcdFx0XHRcdHRvZ2dsZUdsb2JhbEV2ZW50cyh0cnVlKTtcblxuXHRcdFx0XHRcdHNlbGYuJGluc3RhbmNlLmZhZGVJbihzZWxmLm9wZW5TcGVlZCk7XG5cdFx0XHRcdFx0c2VsZi5iZWZvcmVDb250ZW50KGV2ZW50KTtcblxuXHRcdFx0XHRcdC8qIFNldCBjb250ZW50IGFuZCBzaG93ICovXG5cdFx0XHRcdFx0cmV0dXJuICQud2hlbigkY29udGVudClcblx0XHRcdFx0XHRcdC5hbHdheXMoZnVuY3Rpb24oJGNvbnRlbnQpe1xuXHRcdFx0XHRcdFx0XHRzZWxmLnNldENvbnRlbnQoJGNvbnRlbnQpO1xuXHRcdFx0XHRcdFx0XHRzZWxmLmFmdGVyQ29udGVudChldmVudCk7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRoZW4oc2VsZi4kaW5zdGFuY2UucHJvbWlzZSgpKVxuXHRcdFx0XHRcdFx0LyogQ2FsbCBhZnRlck9wZW4gYWZ0ZXIgZmFkZUluIGlzIGRvbmUgKi9cblx0XHRcdFx0XHRcdC5kb25lKGZ1bmN0aW9uKCl7IHNlbGYuYWZ0ZXJPcGVuKGV2ZW50KTsgfSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHNlbGYuJGluc3RhbmNlLmRldGFjaCgpO1xuXHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKS5wcm9taXNlKCk7XG5cdFx0fSxcblxuXHRcdC8qIGNsb3NlcyB0aGUgbGlnaHRib3guIFwidGhpc1wiIGNvbnRhaW5zICRpbnN0YW5jZSB3aXRoIHRoZSBsaWdodGJveCwgYW5kIHdpdGggdGhlIGNvbmZpZ1xuXHRcdFx0cmV0dXJucyBhIHByb21pc2UsIHJlc29sdmVkIGFmdGVyIHRoZSBsaWdodGJveCBpcyBzdWNjZXNzZnVsbHkgY2xvc2VkLiAqL1xuXHRcdGNsb3NlOiBmdW5jdGlvbihldmVudCl7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXMsXG5cdFx0XHRcdGRlZmVycmVkID0gJC5EZWZlcnJlZCgpO1xuXG5cdFx0XHRpZihzZWxmLmJlZm9yZUNsb3NlKGV2ZW50KSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KCk7XG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdGlmICgwID09PSBwcnVuZU9wZW5lZChzZWxmKS5sZW5ndGgpIHtcblx0XHRcdFx0XHR0b2dnbGVHbG9iYWxFdmVudHMoZmFsc2UpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c2VsZi4kaW5zdGFuY2UuZmFkZU91dChzZWxmLmNsb3NlU3BlZWQsZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRzZWxmLiRpbnN0YW5jZS5kZXRhY2goKTtcblx0XHRcdFx0XHRzZWxmLmFmdGVyQ2xvc2UoZXZlbnQpO1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuXHRcdH0sXG5cblx0XHQvKiBVdGlsaXR5IGZ1bmN0aW9uIHRvIGNoYWluIGNhbGxiYWNrc1xuXHRcdCAgIFtXYXJuaW5nOiBndXJ1LWxldmVsXVxuXHRcdCAgIFVzZWQgYmUgZXh0ZW5zaW9ucyB0aGF0IHdhbnQgdG8gbGV0IHVzZXJzIHNwZWNpZnkgY2FsbGJhY2tzIGJ1dFxuXHRcdCAgIGFsc28gbmVlZCB0aGVtc2VsdmVzIHRvIHVzZSB0aGUgY2FsbGJhY2tzLlxuXHRcdCAgIFRoZSBhcmd1bWVudCAnY2hhaW4nIGhhcyBjYWxsYmFjayBuYW1lcyBhcyBrZXlzIGFuZCBmdW5jdGlvbihzdXBlciwgZXZlbnQpXG5cdFx0ICAgYXMgdmFsdWVzLiBUaGF0IGZ1bmN0aW9uIGlzIG1lYW50IHRvIGNhbGwgYHN1cGVyYCBhdCBzb21lIHBvaW50LlxuXHRcdCovXG5cdFx0Y2hhaW5DYWxsYmFja3M6IGZ1bmN0aW9uKGNoYWluKSB7XG5cdFx0XHRmb3IgKHZhciBuYW1lIGluIGNoYWluKSB7XG5cdFx0XHRcdHRoaXNbbmFtZV0gPSAkLnByb3h5KGNoYWluW25hbWVdLCB0aGlzLCAkLnByb3h5KHRoaXNbbmFtZV0sIHRoaXMpKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0JC5leHRlbmQoRmVhdGhlcmxpZ2h0LCB7XG5cdFx0aWQ6IDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVXNlZCB0byBpZCBzaW5nbGUgZmVhdGhlcmxpZ2h0IGluc3RhbmNlcyAqL1xuXHRcdGF1dG9CaW5kOiAgICAgICAnW2RhdGEtZmVhdGhlcmxpZ2h0XScsICAgIC8qIFdpbGwgYXV0b21hdGljYWxseSBiaW5kIGVsZW1lbnRzIG1hdGNoaW5nIHRoaXMgc2VsZWN0b3IuIENsZWFyIG9yIHNldCBiZWZvcmUgb25SZWFkeSAqL1xuXHRcdGRlZmF1bHRzOiAgICAgICBGZWF0aGVybGlnaHQucHJvdG90eXBlLCAgIC8qIFlvdSBjYW4gYWNjZXNzIGFuZCBvdmVycmlkZSBhbGwgZGVmYXVsdHMgdXNpbmcgJC5mZWF0aGVybGlnaHQuZGVmYXVsdHMsIHdoaWNoIGlzIGp1c3QgYSBzeW5vbnltIGZvciAkLmZlYXRoZXJsaWdodC5wcm90b3R5cGUgKi9cblx0XHQvKiBDb250YWlucyB0aGUgbG9naWMgdG8gZGV0ZXJtaW5lIGNvbnRlbnQgKi9cblx0XHRjb250ZW50RmlsdGVyczoge1xuXHRcdFx0anF1ZXJ5OiB7XG5cdFx0XHRcdHJlZ2V4OiAvXlsjLl1cXHcvLCAgICAgICAgIC8qIEFueXRoaW5nIHRoYXQgc3RhcnRzIHdpdGggYSBjbGFzcyBuYW1lIG9yIGlkZW50aWZpZXJzICovXG5cdFx0XHRcdHRlc3Q6IGZ1bmN0aW9uKGVsZW0pICAgIHsgcmV0dXJuIGVsZW0gaW5zdGFuY2VvZiAkICYmIGVsZW07IH0sXG5cdFx0XHRcdHByb2Nlc3M6IGZ1bmN0aW9uKGVsZW0pIHsgcmV0dXJuIHRoaXMucGVyc2lzdCAhPT0gZmFsc2UgPyAkKGVsZW0pIDogJChlbGVtKS5jbG9uZSh0cnVlKTsgfVxuXHRcdFx0fSxcblx0XHRcdGltYWdlOiB7XG5cdFx0XHRcdHJlZ2V4OiAvXFwuKHBuZ3xqcGd8anBlZ3xnaWZ8dGlmZnxibXB8c3ZnKShcXD9cXFMqKT8kL2ksXG5cdFx0XHRcdHByb2Nlc3M6IGZ1bmN0aW9uKHVybCkgIHtcblx0XHRcdFx0XHR2YXIgc2VsZiA9IHRoaXMsXG5cdFx0XHRcdFx0XHRkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKSxcblx0XHRcdFx0XHRcdGltZyA9IG5ldyBJbWFnZSgpLFxuXHRcdFx0XHRcdFx0JGltZyA9ICQoJzxpbWcgc3JjPVwiJyt1cmwrJ1wiIGFsdD1cIlwiIGNsYXNzPVwiJytzZWxmLm5hbWVzcGFjZSsnLWltYWdlXCIgLz4nKTtcblx0XHRcdFx0XHRpbWcub25sb2FkICA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0LyogU3RvcmUgbmF0dXJhbFdpZHRoICYgaGVpZ2h0IGZvciBJRTggKi9cblx0XHRcdFx0XHRcdCRpbWcubmF0dXJhbFdpZHRoID0gaW1nLndpZHRoOyAkaW1nLm5hdHVyYWxIZWlnaHQgPSBpbWcuaGVpZ2h0O1xuXHRcdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZSggJGltZyApO1xuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0aW1nLm9uZXJyb3IgPSBmdW5jdGlvbigpIHsgZGVmZXJyZWQucmVqZWN0KCRpbWcpOyB9O1xuXHRcdFx0XHRcdGltZy5zcmMgPSB1cmw7XG5cdFx0XHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGh0bWw6IHtcblx0XHRcdFx0cmVnZXg6IC9eXFxzKjxbXFx3IV1bXjxdKj4vLCAvKiBBbnl0aGluZyB0aGF0IHN0YXJ0cyB3aXRoIHNvbWUga2luZCBvZiB2YWxpZCB0YWcgKi9cblx0XHRcdFx0cHJvY2VzczogZnVuY3Rpb24oaHRtbCkgeyByZXR1cm4gJChodG1sKTsgfVxuXHRcdFx0fSxcblx0XHRcdGFqYXg6IHtcblx0XHRcdFx0cmVnZXg6IC8uLywgICAgICAgICAgICAvKiBBdCB0aGlzIHBvaW50LCBhbnkgY29udGVudCBpcyBhc3N1bWVkIHRvIGJlIGFuIFVSTCAqL1xuXHRcdFx0XHRwcm9jZXNzOiBmdW5jdGlvbih1cmwpICB7XG5cdFx0XHRcdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0XHRcdFx0ZGVmZXJyZWQgPSAkLkRlZmVycmVkKCk7XG5cdFx0XHRcdFx0Lyogd2UgYXJlIHVzaW5nIGxvYWQgc28gb25lIGNhbiBzcGVjaWZ5IGEgdGFyZ2V0IHdpdGg6IHVybC5odG1sICN0YXJnZXRlbGVtZW50ICovXG5cdFx0XHRcdFx0dmFyICRjb250YWluZXIgPSAkKCc8ZGl2PjwvZGl2PicpLmxvYWQodXJsLCBmdW5jdGlvbihyZXNwb25zZSwgc3RhdHVzKXtcblx0XHRcdFx0XHRcdGlmICggc3RhdHVzICE9PSBcImVycm9yXCIgKSB7XG5cdFx0XHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoJGNvbnRhaW5lci5jb250ZW50cygpKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGRlZmVycmVkLmZhaWwoKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0aWZyYW1lOiB7XG5cdFx0XHRcdHByb2Nlc3M6IGZ1bmN0aW9uKHVybCkge1xuXHRcdFx0XHRcdHZhciBkZWZlcnJlZCA9IG5ldyAkLkRlZmVycmVkKCk7XG5cdFx0XHRcdFx0dmFyICRjb250ZW50ID0gJCgnPGlmcmFtZS8+Jylcblx0XHRcdFx0XHRcdC5oaWRlKClcblx0XHRcdFx0XHRcdC5hdHRyKCdzcmMnLCB1cmwpXG5cdFx0XHRcdFx0XHQuY3NzKHN0cnVjdHVyZSh0aGlzLCAnaWZyYW1lJykpXG5cdFx0XHRcdFx0XHQub24oJ2xvYWQnLCBmdW5jdGlvbigpIHsgZGVmZXJyZWQucmVzb2x2ZSgkY29udGVudC5zaG93KCkpOyB9KVxuXHRcdFx0XHRcdFx0Ly8gV2UgY2FuJ3QgbW92ZSBhbiA8aWZyYW1lPiBhbmQgYXZvaWQgcmVsb2FkaW5nIGl0LFxuXHRcdFx0XHRcdFx0Ly8gc28gbGV0J3MgcHV0IGl0IGluIHBsYWNlIG91cnNlbHZlcyByaWdodCBub3c6XG5cdFx0XHRcdFx0XHQuYXBwZW5kVG8odGhpcy4kaW5zdGFuY2UuZmluZCgnLicgKyB0aGlzLm5hbWVzcGFjZSArICctY29udGVudCcpKTtcblx0XHRcdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0dGV4dDoge1xuXHRcdFx0XHRwcm9jZXNzOiBmdW5jdGlvbih0ZXh0KSB7IHJldHVybiAkKCc8ZGl2PicsIHt0ZXh0OiB0ZXh0fSk7IH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0ZnVuY3Rpb25BdHRyaWJ1dGVzOiBbJ2JlZm9yZU9wZW4nLCAnYWZ0ZXJPcGVuJywgJ2JlZm9yZUNvbnRlbnQnLCAnYWZ0ZXJDb250ZW50JywgJ2JlZm9yZUNsb3NlJywgJ2FmdGVyQ2xvc2UnXSxcblxuXHRcdC8qKiogY2xhc3MgbWV0aG9kcyAqKiovXG5cdFx0LyogcmVhZCBlbGVtZW50J3MgYXR0cmlidXRlcyBzdGFydGluZyB3aXRoIGRhdGEtZmVhdGhlcmxpZ2h0LSAqL1xuXHRcdHJlYWRFbGVtZW50Q29uZmlnOiBmdW5jdGlvbihlbGVtZW50LCBuYW1lc3BhY2UpIHtcblx0XHRcdHZhciBLbGFzcyA9IHRoaXMsXG5cdFx0XHRcdHJlZ2V4cCA9IG5ldyBSZWdFeHAoJ15kYXRhLScgKyBuYW1lc3BhY2UgKyAnLSguKiknKSxcblx0XHRcdFx0Y29uZmlnID0ge307XG5cdFx0XHRpZiAoZWxlbWVudCAmJiBlbGVtZW50LmF0dHJpYnV0ZXMpIHtcblx0XHRcdFx0JC5lYWNoKGVsZW1lbnQuYXR0cmlidXRlcywgZnVuY3Rpb24oKXtcblx0XHRcdFx0XHR2YXIgbWF0Y2ggPSB0aGlzLm5hbWUubWF0Y2gocmVnZXhwKTtcblx0XHRcdFx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdFx0XHRcdHZhciB2YWwgPSB0aGlzLnZhbHVlLFxuXHRcdFx0XHRcdFx0XHRuYW1lID0gJC5jYW1lbENhc2UobWF0Y2hbMV0pO1xuXHRcdFx0XHRcdFx0aWYgKCQuaW5BcnJheShuYW1lLCBLbGFzcy5mdW5jdGlvbkF0dHJpYnV0ZXMpID49IDApIHsgIC8qIGpzaGludCAtVzA1NCAqL1xuXHRcdFx0XHRcdFx0XHR2YWwgPSBuZXcgRnVuY3Rpb24odmFsKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBqc2hpbnQgK1cwNTQgKi9cblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHRyeSB7IHZhbCA9ICQucGFyc2VKU09OKHZhbCk7IH1cblx0XHRcdFx0XHRcdFx0Y2F0Y2goZSkge31cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvbmZpZ1tuYW1lXSA9IHZhbDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGNvbmZpZztcblx0XHR9LFxuXG5cdFx0LyogVXNlZCB0byBjcmVhdGUgYSBGZWF0aGVybGlnaHQgZXh0ZW5zaW9uXG5cdFx0ICAgW1dhcm5pbmc6IGd1cnUtbGV2ZWxdXG5cdFx0ICAgQ3JlYXRlcyB0aGUgZXh0ZW5zaW9uJ3MgcHJvdG90eXBlIHRoYXQgaW4gdHVyblxuXHRcdCAgIGluaGVyaXRzIEZlYXRoZXJsaWdodCdzIHByb3RvdHlwZS5cblx0XHQgICBDb3VsZCBiZSB1c2VkIHRvIGV4dGVuZCBhbiBleHRlbnNpb24gdG9vLi4uXG5cdFx0ICAgVGhpcyBpcyBwcmV0dHkgaGlnaCBsZXZlbCB3aXphcmR5LCBpdCBjb21lcyBwcmV0dHkgbXVjaCBzdHJhaWdodFxuXHRcdCAgIGZyb20gQ29mZmVlU2NyaXB0IGFuZCB3b24ndCB0ZWFjaCB5b3UgYW55dGhpbmcgYWJvdXQgRmVhdGhlcmxpZ2h0XG5cdFx0ICAgYXMgaXQncyBub3QgcmVhbGx5IHNwZWNpZmljIHRvIHRoaXMgbGlicmFyeS5cblx0XHQgICBNeSBzdWdnZXN0aW9uOiBtb3ZlIGFsb25nIGFuZCBrZWVwIHlvdXIgc2FuaXR5LlxuXHRcdCovXG5cdFx0ZXh0ZW5kOiBmdW5jdGlvbihjaGlsZCwgZGVmYXVsdHMpIHtcblx0XHRcdC8qIFNldHVwIGNsYXNzIGhpZXJhcmNoeSwgYWRhcHRlZCBmcm9tIENvZmZlZVNjcmlwdCAqL1xuXHRcdFx0dmFyIEN0b3IgPSBmdW5jdGlvbigpeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH07XG5cdFx0XHRDdG9yLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xuXHRcdFx0Y2hpbGQucHJvdG90eXBlID0gbmV3IEN0b3IoKTtcblx0XHRcdGNoaWxkLl9fc3VwZXJfXyA9IHRoaXMucHJvdG90eXBlO1xuXHRcdFx0LyogQ29weSBjbGFzcyBtZXRob2RzICYgYXR0cmlidXRlcyAqL1xuXHRcdFx0JC5leHRlbmQoY2hpbGQsIHRoaXMsIGRlZmF1bHRzKTtcblx0XHRcdGNoaWxkLmRlZmF1bHRzID0gY2hpbGQucHJvdG90eXBlO1xuXHRcdFx0cmV0dXJuIGNoaWxkO1xuXHRcdH0sXG5cblx0XHRhdHRhY2g6IGZ1bmN0aW9uKCRzb3VyY2UsICRjb250ZW50LCBjb25maWcpIHtcblx0XHRcdHZhciBLbGFzcyA9IHRoaXM7XG5cdFx0XHRpZiAodHlwZW9mICRjb250ZW50ID09PSAnb2JqZWN0JyAmJiAkY29udGVudCBpbnN0YW5jZW9mICQgPT09IGZhbHNlICYmICFjb25maWcpIHtcblx0XHRcdFx0Y29uZmlnID0gJGNvbnRlbnQ7XG5cdFx0XHRcdCRjb250ZW50ID0gdW5kZWZpbmVkO1xuXHRcdFx0fVxuXHRcdFx0LyogbWFrZSBhIGNvcHkgKi9cblx0XHRcdGNvbmZpZyA9ICQuZXh0ZW5kKHt9LCBjb25maWcpO1xuXG5cdFx0XHQvKiBPbmx5IGZvciBvcGVuVHJpZ2dlciBhbmQgbmFtZXNwYWNlLi4uICovXG5cdFx0XHR2YXIgbmFtZXNwYWNlID0gY29uZmlnLm5hbWVzcGFjZSB8fCBLbGFzcy5kZWZhdWx0cy5uYW1lc3BhY2UsXG5cdFx0XHRcdHRlbXBDb25maWcgPSAkLmV4dGVuZCh7fSwgS2xhc3MuZGVmYXVsdHMsIEtsYXNzLnJlYWRFbGVtZW50Q29uZmlnKCRzb3VyY2VbMF0sIG5hbWVzcGFjZSksIGNvbmZpZyksXG5cdFx0XHRcdHNoYXJlZFBlcnNpc3Q7XG5cblx0XHRcdCRzb3VyY2Uub24odGVtcENvbmZpZy5vcGVuVHJpZ2dlcisnLicrdGVtcENvbmZpZy5uYW1lc3BhY2UsIHRlbXBDb25maWcuZmlsdGVyLCBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHQvKiAuLi4gc2luY2Ugd2UgbWlnaHQgYXMgd2VsbCBjb21wdXRlIHRoZSBjb25maWcgb24gdGhlIGFjdHVhbCB0YXJnZXQgKi9cblx0XHRcdFx0dmFyIGVsZW1Db25maWcgPSAkLmV4dGVuZChcblx0XHRcdFx0XHR7JHNvdXJjZTogJHNvdXJjZSwgJGN1cnJlbnRUYXJnZXQ6ICQodGhpcyl9LFxuXHRcdFx0XHRcdEtsYXNzLnJlYWRFbGVtZW50Q29uZmlnKCRzb3VyY2VbMF0sIHRlbXBDb25maWcubmFtZXNwYWNlKSxcblx0XHRcdFx0XHRLbGFzcy5yZWFkRWxlbWVudENvbmZpZyh0aGlzLCB0ZW1wQ29uZmlnLm5hbWVzcGFjZSksXG5cdFx0XHRcdFx0Y29uZmlnKTtcblx0XHRcdFx0dmFyIGZsID0gc2hhcmVkUGVyc2lzdCB8fCAkKHRoaXMpLmRhdGEoJ2ZlYXRoZXJsaWdodC1wZXJzaXN0ZWQnKSB8fCBuZXcgS2xhc3MoJGNvbnRlbnQsIGVsZW1Db25maWcpO1xuXHRcdFx0XHRpZihmbC5wZXJzaXN0ID09PSAnc2hhcmVkJykge1xuXHRcdFx0XHRcdHNoYXJlZFBlcnNpc3QgPSBmbDtcblx0XHRcdFx0fSBlbHNlIGlmKGZsLnBlcnNpc3QgIT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0JCh0aGlzKS5kYXRhKCdmZWF0aGVybGlnaHQtcGVyc2lzdGVkJywgZmwpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsZW1Db25maWcuJGN1cnJlbnRUYXJnZXQuYmx1cigpOyAvLyBPdGhlcndpc2UgJ2VudGVyJyBrZXkgbWlnaHQgdHJpZ2dlciB0aGUgZGlhbG9nIGFnYWluXG5cdFx0XHRcdGZsLm9wZW4oZXZlbnQpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gJHNvdXJjZTtcblx0XHR9LFxuXG5cdFx0Y3VycmVudDogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgYWxsID0gdGhpcy5vcGVuZWQoKTtcblx0XHRcdHJldHVybiBhbGxbYWxsLmxlbmd0aCAtIDFdIHx8IG51bGw7XG5cdFx0fSxcblxuXHRcdG9wZW5lZDogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIga2xhc3MgPSB0aGlzO1xuXHRcdFx0cHJ1bmVPcGVuZWQoKTtcblx0XHRcdHJldHVybiAkLmdyZXAob3BlbmVkLCBmdW5jdGlvbihmbCkgeyByZXR1cm4gZmwgaW5zdGFuY2VvZiBrbGFzczsgfSApO1xuXHRcdH0sXG5cblx0XHRjbG9zZTogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdHZhciBjdXIgPSB0aGlzLmN1cnJlbnQoKTtcblx0XHRcdGlmKGN1cikgeyByZXR1cm4gY3VyLmNsb3NlKGV2ZW50KTsgfVxuXHRcdH0sXG5cblx0XHQvKiBEb2VzIHRoZSBhdXRvIGJpbmRpbmcgb24gc3RhcnR1cC5cblx0XHQgICBNZWFudCBvbmx5IHRvIGJlIHVzZWQgYnkgRmVhdGhlcmxpZ2h0IGFuZCBpdHMgZXh0ZW5zaW9uc1xuXHRcdCovXG5cdFx0X29uUmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIEtsYXNzID0gdGhpcztcblx0XHRcdGlmKEtsYXNzLmF1dG9CaW5kKXtcblx0XHRcdFx0LyogQmluZCBleGlzdGluZyBlbGVtZW50cyAqL1xuXHRcdFx0XHQkKEtsYXNzLmF1dG9CaW5kKS5lYWNoKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0S2xhc3MuYXR0YWNoKCQodGhpcykpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0LyogSWYgYSBjbGljayBwcm9wYWdhdGVzIHRvIHRoZSBkb2N1bWVudCBsZXZlbCwgdGhlbiB3ZSBoYXZlIGFuIGl0ZW0gdGhhdCB3YXMgYWRkZWQgbGF0ZXIgb24gKi9cblx0XHRcdFx0JChkb2N1bWVudCkub24oJ2NsaWNrJywgS2xhc3MuYXV0b0JpbmQsIGZ1bmN0aW9uKGV2dCkge1xuXHRcdFx0XHRcdGlmIChldnQuaXNEZWZhdWx0UHJldmVudGVkKCkgfHwgZXZ0Lm5hbWVzcGFjZSA9PT0gJ2ZlYXRoZXJsaWdodCcpIHtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0LyogQmluZCBmZWF0aGVybGlnaHQgKi9cblx0XHRcdFx0XHRLbGFzcy5hdHRhY2goJChldnQuY3VycmVudFRhcmdldCkpO1xuXHRcdFx0XHRcdC8qIENsaWNrIGFnYWluOyB0aGlzIHRpbWUgb3VyIGJpbmRpbmcgd2lsbCBjYXRjaCBpdCAqL1xuXHRcdFx0XHRcdCQoZXZ0LnRhcmdldCkudHJpZ2dlcignY2xpY2suZmVhdGhlcmxpZ2h0Jyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvKiBGZWF0aGVybGlnaHQgdXNlcyB0aGUgb25LZXlVcCBjYWxsYmFjayB0byBpbnRlcmNlcHQgdGhlIGVzY2FwZSBrZXkuXG5cdFx0ICAgUHJpdmF0ZSB0byBGZWF0aGVybGlnaHQuXG5cdFx0Ki9cblx0XHRfY2FsbGJhY2tDaGFpbjoge1xuXHRcdFx0b25LZXlVcDogZnVuY3Rpb24oX3N1cGVyLCBldmVudCl7XG5cdFx0XHRcdGlmKDI3ID09PSBldmVudC5rZXlDb2RlKSB7XG5cdFx0XHRcdFx0aWYgKHRoaXMuY2xvc2VPbkVzYykge1xuXHRcdFx0XHRcdFx0JC5mZWF0aGVybGlnaHQuY2xvc2UoZXZlbnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIF9zdXBlcihldmVudCk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdG9uUmVzaXplOiBmdW5jdGlvbihfc3VwZXIsIGV2ZW50KXtcblx0XHRcdFx0aWYgKHRoaXMuJGNvbnRlbnQubmF0dXJhbFdpZHRoKSB7XG5cdFx0XHRcdFx0dmFyIHcgPSB0aGlzLiRjb250ZW50Lm5hdHVyYWxXaWR0aCwgaCA9IHRoaXMuJGNvbnRlbnQubmF0dXJhbEhlaWdodDtcblx0XHRcdFx0XHQvKiBSZXNldCBhcHBhcmVudCBpbWFnZSBzaXplIGZpcnN0IHNvIGNvbnRhaW5lciBncm93cyAqL1xuXHRcdFx0XHRcdHRoaXMuJGNvbnRlbnQuY3NzKCd3aWR0aCcsICcnKS5jc3MoJ2hlaWdodCcsICcnKTtcblx0XHRcdFx0XHQvKiBDYWxjdWxhdGUgdGhlIHdvcnN0IHJhdGlvIHNvIHRoYXQgZGltZW5zaW9ucyBmaXQgKi9cblx0XHRcdFx0XHR2YXIgcmF0aW8gPSBNYXRoLm1heChcblx0XHRcdFx0XHRcdHcgIC8gcGFyc2VJbnQodGhpcy4kY29udGVudC5wYXJlbnQoKS5jc3MoJ3dpZHRoJyksMTApLFxuXHRcdFx0XHRcdFx0aCAvIHBhcnNlSW50KHRoaXMuJGNvbnRlbnQucGFyZW50KCkuY3NzKCdoZWlnaHQnKSwxMCkpO1xuXHRcdFx0XHRcdC8qIFJlc2l6ZSBjb250ZW50ICovXG5cdFx0XHRcdFx0aWYgKHJhdGlvID4gMSkge1xuXHRcdFx0XHRcdFx0dGhpcy4kY29udGVudC5jc3MoJ3dpZHRoJywgJycgKyB3IC8gcmF0aW8gKyAncHgnKS5jc3MoJ2hlaWdodCcsICcnICsgaCAvIHJhdGlvICsgJ3B4Jyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBfc3VwZXIoZXZlbnQpO1xuXHRcdFx0fSxcblxuXHRcdFx0YWZ0ZXJDb250ZW50OiBmdW5jdGlvbihfc3VwZXIsIGV2ZW50KXtcblx0XHRcdFx0dmFyIHIgPSBfc3VwZXIoZXZlbnQpO1xuXHRcdFx0XHR0aGlzLm9uUmVzaXplKGV2ZW50KTtcblx0XHRcdFx0cmV0dXJuIHI7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxuXHQkLmZlYXRoZXJsaWdodCA9IEZlYXRoZXJsaWdodDtcblxuXHQvKiBiaW5kIGpRdWVyeSBlbGVtZW50cyB0byB0cmlnZ2VyIGZlYXRoZXJsaWdodCAqL1xuXHQkLmZuLmZlYXRoZXJsaWdodCA9IGZ1bmN0aW9uKCRjb250ZW50LCBjb25maWcpIHtcblx0XHRyZXR1cm4gRmVhdGhlcmxpZ2h0LmF0dGFjaCh0aGlzLCAkY29udGVudCwgY29uZmlnKTtcblx0fTtcblxuXHQvKiBiaW5kIGZlYXRoZXJsaWdodCBvbiByZWFkeSBpZiBjb25maWcgYXV0b0JpbmQgaXMgc2V0ICovXG5cdCQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7IEZlYXRoZXJsaWdodC5fb25SZWFkeSgpOyB9KTtcbn0oalF1ZXJ5KSk7XG4iLCIvKiFcbiAqIE1hc29ucnkgUEFDS0FHRUQgdjQuMC4wXG4gKiBDYXNjYWRpbmcgZ3JpZCBsYXlvdXQgbGlicmFyeVxuICogaHR0cDovL21hc29ucnkuZGVzYW5kcm8uY29tXG4gKiBNSVQgTGljZW5zZVxuICogYnkgRGF2aWQgRGVTYW5kcm9cbiAqL1xuXG4vKipcbiAqIEJyaWRnZXQgbWFrZXMgalF1ZXJ5IHdpZGdldHNcbiAqIHYyLjAuMFxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKiBqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgc3RyaWN0OiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvKiBnbG9iYWxzIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIHJlcXVpcmU6IGZhbHNlICovXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoICdqcXVlcnktYnJpZGdldC9qcXVlcnktYnJpZGdldCcsWyAnanF1ZXJ5JyBdLCBmdW5jdGlvbiggalF1ZXJ5ICkge1xuICAgICAgZmFjdG9yeSggd2luZG93LCBqUXVlcnkgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2pxdWVyeScpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5qUXVlcnlCcmlkZ2V0ID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5qUXVlcnlcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBqUXVlcnkgKSB7XG4ndXNlIHN0cmljdCc7XG5cbi8vIC0tLS0tIHV0aWxzIC0tLS0tIC8vXG5cbnZhciBhcnJheVNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuXG4vLyBoZWxwZXIgZnVuY3Rpb24gZm9yIGxvZ2dpbmcgZXJyb3JzXG4vLyAkLmVycm9yIGJyZWFrcyBqUXVlcnkgY2hhaW5pbmdcbnZhciBjb25zb2xlID0gd2luZG93LmNvbnNvbGU7XG52YXIgbG9nRXJyb3IgPSB0eXBlb2YgY29uc29sZSA9PSAndW5kZWZpbmVkJyA/IGZ1bmN0aW9uKCkge30gOlxuICBmdW5jdGlvbiggbWVzc2FnZSApIHtcbiAgICBjb25zb2xlLmVycm9yKCBtZXNzYWdlICk7XG4gIH07XG5cbi8vIC0tLS0tIGpRdWVyeUJyaWRnZXQgLS0tLS0gLy9cblxuZnVuY3Rpb24galF1ZXJ5QnJpZGdldCggbmFtZXNwYWNlLCBQbHVnaW5DbGFzcywgJCApIHtcbiAgJCA9ICQgfHwgalF1ZXJ5IHx8IHdpbmRvdy5qUXVlcnk7XG4gIGlmICggISQgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gYWRkIG9wdGlvbiBtZXRob2QgLT4gJCgpLnBsdWdpbignb3B0aW9uJywgey4uLn0pXG4gIGlmICggIVBsdWdpbkNsYXNzLnByb3RvdHlwZS5vcHRpb24gKSB7XG4gICAgLy8gb3B0aW9uIHNldHRlclxuICAgIFBsdWdpbkNsYXNzLnByb3RvdHlwZS5vcHRpb24gPSBmdW5jdGlvbiggb3B0cyApIHtcbiAgICAgIC8vIGJhaWwgb3V0IGlmIG5vdCBhbiBvYmplY3RcbiAgICAgIGlmICggISQuaXNQbGFpbk9iamVjdCggb3B0cyApICl7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKCB0cnVlLCB0aGlzLm9wdGlvbnMsIG9wdHMgKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gbWFrZSBqUXVlcnkgcGx1Z2luXG4gICQuZm5bIG5hbWVzcGFjZSBdID0gZnVuY3Rpb24oIGFyZzAgLyosIGFyZzEgKi8gKSB7XG4gICAgaWYgKCB0eXBlb2YgYXJnMCA9PSAnc3RyaW5nJyApIHtcbiAgICAgIC8vIG1ldGhvZCBjYWxsICQoKS5wbHVnaW4oICdtZXRob2ROYW1lJywgeyBvcHRpb25zIH0gKVxuICAgICAgLy8gc2hpZnQgYXJndW1lbnRzIGJ5IDFcbiAgICAgIHZhciBhcmdzID0gYXJyYXlTbGljZS5jYWxsKCBhcmd1bWVudHMsIDEgKTtcbiAgICAgIHJldHVybiBtZXRob2RDYWxsKCB0aGlzLCBhcmcwLCBhcmdzICk7XG4gICAgfVxuICAgIC8vIGp1c3QgJCgpLnBsdWdpbih7IG9wdGlvbnMgfSlcbiAgICBwbGFpbkNhbGwoIHRoaXMsIGFyZzAgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyAkKCkucGx1Z2luKCdtZXRob2ROYW1lJylcbiAgZnVuY3Rpb24gbWV0aG9kQ2FsbCggJGVsZW1zLCBtZXRob2ROYW1lLCBhcmdzICkge1xuICAgIHZhciByZXR1cm5WYWx1ZTtcbiAgICB2YXIgcGx1Z2luTWV0aG9kU3RyID0gJyQoKS4nICsgbmFtZXNwYWNlICsgJyhcIicgKyBtZXRob2ROYW1lICsgJ1wiKSc7XG5cbiAgICAkZWxlbXMuZWFjaCggZnVuY3Rpb24oIGksIGVsZW0gKSB7XG4gICAgICAvLyBnZXQgaW5zdGFuY2VcbiAgICAgIHZhciBpbnN0YW5jZSA9ICQuZGF0YSggZWxlbSwgbmFtZXNwYWNlICk7XG4gICAgICBpZiAoICFpbnN0YW5jZSApIHtcbiAgICAgICAgbG9nRXJyb3IoIG5hbWVzcGFjZSArICcgbm90IGluaXRpYWxpemVkLiBDYW5ub3QgY2FsbCBtZXRob2RzLCBpLmUuICcgK1xuICAgICAgICAgIHBsdWdpbk1ldGhvZFN0ciApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBtZXRob2QgPSBpbnN0YW5jZVsgbWV0aG9kTmFtZSBdO1xuICAgICAgaWYgKCAhbWV0aG9kIHx8IG1ldGhvZE5hbWUuY2hhckF0KDApID09ICdfJyApIHtcbiAgICAgICAgbG9nRXJyb3IoIHBsdWdpbk1ldGhvZFN0ciArICcgaXMgbm90IGEgdmFsaWQgbWV0aG9kJyApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIGFwcGx5IG1ldGhvZCwgZ2V0IHJldHVybiB2YWx1ZVxuICAgICAgdmFyIHZhbHVlID0gbWV0aG9kLmFwcGx5KCBpbnN0YW5jZSwgYXJncyApO1xuICAgICAgLy8gc2V0IHJldHVybiB2YWx1ZSBpZiB2YWx1ZSBpcyByZXR1cm5lZCwgdXNlIG9ubHkgZmlyc3QgdmFsdWVcbiAgICAgIHJldHVyblZhbHVlID0gcmV0dXJuVmFsdWUgPT09IHVuZGVmaW5lZCA/IHZhbHVlIDogcmV0dXJuVmFsdWU7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmV0dXJuVmFsdWUgIT09IHVuZGVmaW5lZCA/IHJldHVyblZhbHVlIDogJGVsZW1zO1xuICB9XG5cbiAgZnVuY3Rpb24gcGxhaW5DYWxsKCAkZWxlbXMsIG9wdGlvbnMgKSB7XG4gICAgJGVsZW1zLmVhY2goIGZ1bmN0aW9uKCBpLCBlbGVtICkge1xuICAgICAgdmFyIGluc3RhbmNlID0gJC5kYXRhKCBlbGVtLCBuYW1lc3BhY2UgKTtcbiAgICAgIGlmICggaW5zdGFuY2UgKSB7XG4gICAgICAgIC8vIHNldCBvcHRpb25zICYgaW5pdFxuICAgICAgICBpbnN0YW5jZS5vcHRpb24oIG9wdGlvbnMgKTtcbiAgICAgICAgaW5zdGFuY2UuX2luaXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGluaXRpYWxpemUgbmV3IGluc3RhbmNlXG4gICAgICAgIGluc3RhbmNlID0gbmV3IFBsdWdpbkNsYXNzKCBlbGVtLCBvcHRpb25zICk7XG4gICAgICAgICQuZGF0YSggZWxlbSwgbmFtZXNwYWNlLCBpbnN0YW5jZSApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlSlF1ZXJ5KCAkICk7XG5cbn1cblxuLy8gLS0tLS0gdXBkYXRlSlF1ZXJ5IC0tLS0tIC8vXG5cbi8vIHNldCAkLmJyaWRnZXQgZm9yIHYxIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG5mdW5jdGlvbiB1cGRhdGVKUXVlcnkoICQgKSB7XG4gIGlmICggISQgfHwgKCAkICYmICQuYnJpZGdldCApICkge1xuICAgIHJldHVybjtcbiAgfVxuICAkLmJyaWRnZXQgPSBqUXVlcnlCcmlkZ2V0O1xufVxuXG51cGRhdGVKUXVlcnkoIGpRdWVyeSB8fCB3aW5kb3cualF1ZXJ5ICk7XG5cbi8vIC0tLS0tICAtLS0tLSAvL1xuXG5yZXR1cm4galF1ZXJ5QnJpZGdldDtcblxufSkpO1xuXG4vKipcbiAqIEV2RW1pdHRlciB2MS4wLjFcbiAqIExpbCcgZXZlbnQgZW1pdHRlclxuICogTUlUIExpY2Vuc2VcbiAqL1xuXG4vKiBqc2hpbnQgdW51c2VkOiB0cnVlLCB1bmRlZjogdHJ1ZSwgc3RyaWN0OiB0cnVlICovXG5cbiggZnVuY3Rpb24oIGdsb2JhbCwgZmFjdG9yeSApIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG4gIC8qIGpzaGludCBzdHJpY3Q6IGZhbHNlICovIC8qIGdsb2JhbHMgZGVmaW5lLCBtb2R1bGUgKi9cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTUQgLSBSZXF1aXJlSlNcbiAgICBkZWZpbmUoICdldi1lbWl0dGVyL2V2LWVtaXR0ZXInLGZhY3RvcnkgKTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyApIHtcbiAgICAvLyBDb21tb25KUyAtIEJyb3dzZXJpZnksIFdlYnBhY2tcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBCcm93c2VyIGdsb2JhbHNcbiAgICBnbG9iYWwuRXZFbWl0dGVyID0gZmFjdG9yeSgpO1xuICB9XG5cbn0oIHRoaXMsIGZ1bmN0aW9uKCkge1xuXG5cblxuZnVuY3Rpb24gRXZFbWl0dGVyKCkge31cblxudmFyIHByb3RvID0gRXZFbWl0dGVyLnByb3RvdHlwZTtcblxucHJvdG8ub24gPSBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApIHtcbiAgaWYgKCAhZXZlbnROYW1lIHx8ICFsaXN0ZW5lciApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gc2V0IGV2ZW50cyBoYXNoXG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIC8vIHNldCBsaXN0ZW5lcnMgYXJyYXlcbiAgdmFyIGxpc3RlbmVycyA9IGV2ZW50c1sgZXZlbnROYW1lIF0gPSBldmVudHNbIGV2ZW50TmFtZSBdIHx8IFtdO1xuICAvLyBvbmx5IGFkZCBvbmNlXG4gIGlmICggbGlzdGVuZXJzLmluZGV4T2YoIGxpc3RlbmVyICkgPT0gLTEgKSB7XG4gICAgbGlzdGVuZXJzLnB1c2goIGxpc3RlbmVyICk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLm9uY2UgPSBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApIHtcbiAgaWYgKCAhZXZlbnROYW1lIHx8ICFsaXN0ZW5lciApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gYWRkIGV2ZW50XG4gIHRoaXMub24oIGV2ZW50TmFtZSwgbGlzdGVuZXIgKTtcbiAgLy8gc2V0IG9uY2UgZmxhZ1xuICAvLyBzZXQgb25jZUV2ZW50cyBoYXNoXG4gIHZhciBvbmNlRXZlbnRzID0gdGhpcy5fb25jZUV2ZW50cyA9IHRoaXMuX29uY2VFdmVudHMgfHwge307XG4gIC8vIHNldCBvbmNlTGlzdGVuZXJzIGFycmF5XG4gIHZhciBvbmNlTGlzdGVuZXJzID0gb25jZUV2ZW50c1sgZXZlbnROYW1lIF0gPSBvbmNlRXZlbnRzWyBldmVudE5hbWUgXSB8fCBbXTtcbiAgLy8gc2V0IGZsYWdcbiAgb25jZUxpc3RlbmVyc1sgbGlzdGVuZXIgXSA9IHRydWU7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5vZmYgPSBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApIHtcbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbIGV2ZW50TmFtZSBdO1xuICBpZiAoICFsaXN0ZW5lcnMgfHwgIWxpc3RlbmVycy5sZW5ndGggKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBpbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKCBsaXN0ZW5lciApO1xuICBpZiAoIGluZGV4ICE9IC0xICkge1xuICAgIGxpc3RlbmVycy5zcGxpY2UoIGluZGV4LCAxICk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmVtaXRFdmVudCA9IGZ1bmN0aW9uKCBldmVudE5hbWUsIGFyZ3MgKSB7XG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXTtcbiAgaWYgKCAhbGlzdGVuZXJzIHx8ICFsaXN0ZW5lcnMubGVuZ3RoICkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgaSA9IDA7XG4gIHZhciBsaXN0ZW5lciA9IGxpc3RlbmVyc1tpXTtcbiAgYXJncyA9IGFyZ3MgfHwgW107XG4gIC8vIG9uY2Ugc3R1ZmZcbiAgdmFyIG9uY2VMaXN0ZW5lcnMgPSB0aGlzLl9vbmNlRXZlbnRzICYmIHRoaXMuX29uY2VFdmVudHNbIGV2ZW50TmFtZSBdO1xuXG4gIHdoaWxlICggbGlzdGVuZXIgKSB7XG4gICAgdmFyIGlzT25jZSA9IG9uY2VMaXN0ZW5lcnMgJiYgb25jZUxpc3RlbmVyc1sgbGlzdGVuZXIgXTtcbiAgICBpZiAoIGlzT25jZSApIHtcbiAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lclxuICAgICAgLy8gcmVtb3ZlIGJlZm9yZSB0cmlnZ2VyIHRvIHByZXZlbnQgcmVjdXJzaW9uXG4gICAgICB0aGlzLm9mZiggZXZlbnROYW1lLCBsaXN0ZW5lciApO1xuICAgICAgLy8gdW5zZXQgb25jZSBmbGFnXG4gICAgICBkZWxldGUgb25jZUxpc3RlbmVyc1sgbGlzdGVuZXIgXTtcbiAgICB9XG4gICAgLy8gdHJpZ2dlciBsaXN0ZW5lclxuICAgIGxpc3RlbmVyLmFwcGx5KCB0aGlzLCBhcmdzICk7XG4gICAgLy8gZ2V0IG5leHQgbGlzdGVuZXJcbiAgICBpICs9IGlzT25jZSA/IDAgOiAxO1xuICAgIGxpc3RlbmVyID0gbGlzdGVuZXJzW2ldO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5yZXR1cm4gRXZFbWl0dGVyO1xuXG59KSk7XG5cbi8qIVxuICogZ2V0U2l6ZSB2Mi4wLjJcbiAqIG1lYXN1cmUgc2l6ZSBvZiBlbGVtZW50c1xuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCBzdHJpY3Q6IHRydWUsIHVuZGVmOiB0cnVlLCB1bnVzZWQ6IHRydWUgKi9cbi8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIGNvbnNvbGU6IGZhbHNlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCAnZ2V0LXNpemUvZ2V0LXNpemUnLFtdLGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LmdldFNpemUgPSBmYWN0b3J5KCk7XG4gIH1cblxufSkoIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSgpIHtcbid1c2Ugc3RyaWN0JztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGVscGVycyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyBnZXQgYSBudW1iZXIgZnJvbSBhIHN0cmluZywgbm90IGEgcGVyY2VudGFnZVxuZnVuY3Rpb24gZ2V0U3R5bGVTaXplKCB2YWx1ZSApIHtcbiAgdmFyIG51bSA9IHBhcnNlRmxvYXQoIHZhbHVlICk7XG4gIC8vIG5vdCBhIHBlcmNlbnQgbGlrZSAnMTAwJScsIGFuZCBhIG51bWJlclxuICB2YXIgaXNWYWxpZCA9IHZhbHVlLmluZGV4T2YoJyUnKSA9PSAtMSAmJiAhaXNOYU4oIG51bSApO1xuICByZXR1cm4gaXNWYWxpZCAmJiBudW07XG59XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG52YXIgbG9nRXJyb3IgPSB0eXBlb2YgY29uc29sZSA9PSAndW5kZWZpbmVkJyA/IG5vb3AgOlxuICBmdW5jdGlvbiggbWVzc2FnZSApIHtcbiAgICBjb25zb2xlLmVycm9yKCBtZXNzYWdlICk7XG4gIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG1lYXN1cmVtZW50cyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG52YXIgbWVhc3VyZW1lbnRzID0gW1xuICAncGFkZGluZ0xlZnQnLFxuICAncGFkZGluZ1JpZ2h0JyxcbiAgJ3BhZGRpbmdUb3AnLFxuICAncGFkZGluZ0JvdHRvbScsXG4gICdtYXJnaW5MZWZ0JyxcbiAgJ21hcmdpblJpZ2h0JyxcbiAgJ21hcmdpblRvcCcsXG4gICdtYXJnaW5Cb3R0b20nLFxuICAnYm9yZGVyTGVmdFdpZHRoJyxcbiAgJ2JvcmRlclJpZ2h0V2lkdGgnLFxuICAnYm9yZGVyVG9wV2lkdGgnLFxuICAnYm9yZGVyQm90dG9tV2lkdGgnXG5dO1xuXG52YXIgbWVhc3VyZW1lbnRzTGVuZ3RoID0gbWVhc3VyZW1lbnRzLmxlbmd0aDtcblxuZnVuY3Rpb24gZ2V0WmVyb1NpemUoKSB7XG4gIHZhciBzaXplID0ge1xuICAgIHdpZHRoOiAwLFxuICAgIGhlaWdodDogMCxcbiAgICBpbm5lcldpZHRoOiAwLFxuICAgIGlubmVySGVpZ2h0OiAwLFxuICAgIG91dGVyV2lkdGg6IDAsXG4gICAgb3V0ZXJIZWlnaHQ6IDBcbiAgfTtcbiAgZm9yICggdmFyIGk9MDsgaSA8IG1lYXN1cmVtZW50c0xlbmd0aDsgaSsrICkge1xuICAgIHZhciBtZWFzdXJlbWVudCA9IG1lYXN1cmVtZW50c1tpXTtcbiAgICBzaXplWyBtZWFzdXJlbWVudCBdID0gMDtcbiAgfVxuICByZXR1cm4gc2l6ZTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZ2V0U3R5bGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLyoqXG4gKiBnZXRTdHlsZSwgZ2V0IHN0eWxlIG9mIGVsZW1lbnQsIGNoZWNrIGZvciBGaXJlZm94IGJ1Z1xuICogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NTQ4Mzk3XG4gKi9cbmZ1bmN0aW9uIGdldFN0eWxlKCBlbGVtICkge1xuICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKCBlbGVtICk7XG4gIGlmICggIXN0eWxlICkge1xuICAgIGxvZ0Vycm9yKCAnU3R5bGUgcmV0dXJuZWQgJyArIHN0eWxlICtcbiAgICAgICcuIEFyZSB5b3UgcnVubmluZyB0aGlzIGNvZGUgaW4gYSBoaWRkZW4gaWZyYW1lIG9uIEZpcmVmb3g/ICcgK1xuICAgICAgJ1NlZSBodHRwOi8vYml0Lmx5L2dldHNpemVidWcxJyApO1xuICB9XG4gIHJldHVybiBzdHlsZTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gc2V0dXAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxudmFyIGlzU2V0dXAgPSBmYWxzZTtcblxudmFyIGlzQm94U2l6ZU91dGVyO1xuXG4vKipcbiAqIHNldHVwXG4gKiBjaGVjayBpc0JveFNpemVyT3V0ZXJcbiAqIGRvIG9uIGZpcnN0IGdldFNpemUoKSByYXRoZXIgdGhhbiBvbiBwYWdlIGxvYWQgZm9yIEZpcmVmb3ggYnVnXG4gKi9cbmZ1bmN0aW9uIHNldHVwKCkge1xuICAvLyBzZXR1cCBvbmNlXG4gIGlmICggaXNTZXR1cCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaXNTZXR1cCA9IHRydWU7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYm94IHNpemluZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8qKlxuICAgKiBXZWJLaXQgbWVhc3VyZXMgdGhlIG91dGVyLXdpZHRoIG9uIHN0eWxlLndpZHRoIG9uIGJvcmRlci1ib3ggZWxlbXNcbiAgICogSUUgJiBGaXJlZm94PDI5IG1lYXN1cmVzIHRoZSBpbm5lci13aWR0aFxuICAgKi9cbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuc3R5bGUud2lkdGggPSAnMjAwcHgnO1xuICBkaXYuc3R5bGUucGFkZGluZyA9ICcxcHggMnB4IDNweCA0cHgnO1xuICBkaXYuc3R5bGUuYm9yZGVyU3R5bGUgPSAnc29saWQnO1xuICBkaXYuc3R5bGUuYm9yZGVyV2lkdGggPSAnMXB4IDJweCAzcHggNHB4JztcbiAgZGl2LnN0eWxlLmJveFNpemluZyA9ICdib3JkZXItYm94JztcblxuICB2YXIgYm9keSA9IGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICBib2R5LmFwcGVuZENoaWxkKCBkaXYgKTtcbiAgdmFyIHN0eWxlID0gZ2V0U3R5bGUoIGRpdiApO1xuXG4gIGdldFNpemUuaXNCb3hTaXplT3V0ZXIgPSBpc0JveFNpemVPdXRlciA9IGdldFN0eWxlU2l6ZSggc3R5bGUud2lkdGggKSA9PSAyMDA7XG4gIGJvZHkucmVtb3ZlQ2hpbGQoIGRpdiApO1xuXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGdldFNpemUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuZnVuY3Rpb24gZ2V0U2l6ZSggZWxlbSApIHtcbiAgc2V0dXAoKTtcblxuICAvLyB1c2UgcXVlcnlTZWxldG9yIGlmIGVsZW0gaXMgc3RyaW5nXG4gIGlmICggdHlwZW9mIGVsZW0gPT0gJ3N0cmluZycgKSB7XG4gICAgZWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIGVsZW0gKTtcbiAgfVxuXG4gIC8vIGRvIG5vdCBwcm9jZWVkIG9uIG5vbi1vYmplY3RzXG4gIGlmICggIWVsZW0gfHwgdHlwZW9mIGVsZW0gIT0gJ29iamVjdCcgfHwgIWVsZW0ubm9kZVR5cGUgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHN0eWxlID0gZ2V0U3R5bGUoIGVsZW0gKTtcblxuICAvLyBpZiBoaWRkZW4sIGV2ZXJ5dGhpbmcgaXMgMFxuICBpZiAoIHN0eWxlLmRpc3BsYXkgPT0gJ25vbmUnICkge1xuICAgIHJldHVybiBnZXRaZXJvU2l6ZSgpO1xuICB9XG5cbiAgdmFyIHNpemUgPSB7fTtcbiAgc2l6ZS53aWR0aCA9IGVsZW0ub2Zmc2V0V2lkdGg7XG4gIHNpemUuaGVpZ2h0ID0gZWxlbS5vZmZzZXRIZWlnaHQ7XG5cbiAgdmFyIGlzQm9yZGVyQm94ID0gc2l6ZS5pc0JvcmRlckJveCA9IHN0eWxlLmJveFNpemluZyA9PSAnYm9yZGVyLWJveCc7XG5cbiAgLy8gZ2V0IGFsbCBtZWFzdXJlbWVudHNcbiAgZm9yICggdmFyIGk9MDsgaSA8IG1lYXN1cmVtZW50c0xlbmd0aDsgaSsrICkge1xuICAgIHZhciBtZWFzdXJlbWVudCA9IG1lYXN1cmVtZW50c1tpXTtcbiAgICB2YXIgdmFsdWUgPSBzdHlsZVsgbWVhc3VyZW1lbnQgXTtcbiAgICB2YXIgbnVtID0gcGFyc2VGbG9hdCggdmFsdWUgKTtcbiAgICAvLyBhbnkgJ2F1dG8nLCAnbWVkaXVtJyB2YWx1ZSB3aWxsIGJlIDBcbiAgICBzaXplWyBtZWFzdXJlbWVudCBdID0gIWlzTmFOKCBudW0gKSA/IG51bSA6IDA7XG4gIH1cblxuICB2YXIgcGFkZGluZ1dpZHRoID0gc2l6ZS5wYWRkaW5nTGVmdCArIHNpemUucGFkZGluZ1JpZ2h0O1xuICB2YXIgcGFkZGluZ0hlaWdodCA9IHNpemUucGFkZGluZ1RvcCArIHNpemUucGFkZGluZ0JvdHRvbTtcbiAgdmFyIG1hcmdpbldpZHRoID0gc2l6ZS5tYXJnaW5MZWZ0ICsgc2l6ZS5tYXJnaW5SaWdodDtcbiAgdmFyIG1hcmdpbkhlaWdodCA9IHNpemUubWFyZ2luVG9wICsgc2l6ZS5tYXJnaW5Cb3R0b207XG4gIHZhciBib3JkZXJXaWR0aCA9IHNpemUuYm9yZGVyTGVmdFdpZHRoICsgc2l6ZS5ib3JkZXJSaWdodFdpZHRoO1xuICB2YXIgYm9yZGVySGVpZ2h0ID0gc2l6ZS5ib3JkZXJUb3BXaWR0aCArIHNpemUuYm9yZGVyQm90dG9tV2lkdGg7XG5cbiAgdmFyIGlzQm9yZGVyQm94U2l6ZU91dGVyID0gaXNCb3JkZXJCb3ggJiYgaXNCb3hTaXplT3V0ZXI7XG5cbiAgLy8gb3ZlcndyaXRlIHdpZHRoIGFuZCBoZWlnaHQgaWYgd2UgY2FuIGdldCBpdCBmcm9tIHN0eWxlXG4gIHZhciBzdHlsZVdpZHRoID0gZ2V0U3R5bGVTaXplKCBzdHlsZS53aWR0aCApO1xuICBpZiAoIHN0eWxlV2lkdGggIT09IGZhbHNlICkge1xuICAgIHNpemUud2lkdGggPSBzdHlsZVdpZHRoICtcbiAgICAgIC8vIGFkZCBwYWRkaW5nIGFuZCBib3JkZXIgdW5sZXNzIGl0J3MgYWxyZWFkeSBpbmNsdWRpbmcgaXRcbiAgICAgICggaXNCb3JkZXJCb3hTaXplT3V0ZXIgPyAwIDogcGFkZGluZ1dpZHRoICsgYm9yZGVyV2lkdGggKTtcbiAgfVxuXG4gIHZhciBzdHlsZUhlaWdodCA9IGdldFN0eWxlU2l6ZSggc3R5bGUuaGVpZ2h0ICk7XG4gIGlmICggc3R5bGVIZWlnaHQgIT09IGZhbHNlICkge1xuICAgIHNpemUuaGVpZ2h0ID0gc3R5bGVIZWlnaHQgK1xuICAgICAgLy8gYWRkIHBhZGRpbmcgYW5kIGJvcmRlciB1bmxlc3MgaXQncyBhbHJlYWR5IGluY2x1ZGluZyBpdFxuICAgICAgKCBpc0JvcmRlckJveFNpemVPdXRlciA/IDAgOiBwYWRkaW5nSGVpZ2h0ICsgYm9yZGVySGVpZ2h0ICk7XG4gIH1cblxuICBzaXplLmlubmVyV2lkdGggPSBzaXplLndpZHRoIC0gKCBwYWRkaW5nV2lkdGggKyBib3JkZXJXaWR0aCApO1xuICBzaXplLmlubmVySGVpZ2h0ID0gc2l6ZS5oZWlnaHQgLSAoIHBhZGRpbmdIZWlnaHQgKyBib3JkZXJIZWlnaHQgKTtcblxuICBzaXplLm91dGVyV2lkdGggPSBzaXplLndpZHRoICsgbWFyZ2luV2lkdGg7XG4gIHNpemUub3V0ZXJIZWlnaHQgPSBzaXplLmhlaWdodCArIG1hcmdpbkhlaWdodDtcblxuICByZXR1cm4gc2l6ZTtcbn1cblxucmV0dXJuIGdldFNpemU7XG5cbn0pO1xuXG4vKipcbiAqIG1hdGNoZXNTZWxlY3RvciB2Mi4wLjFcbiAqIG1hdGNoZXNTZWxlY3RvciggZWxlbWVudCwgJy5zZWxlY3RvcicgKVxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCBzdHJpY3Q6IHRydWUsIHVuZGVmOiB0cnVlLCB1bnVzZWQ6IHRydWUgKi9cblxuKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkge1xuICAvKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCBtb2R1bGU6IGZhbHNlICovXG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCAnbWF0Y2hlcy1zZWxlY3Rvci9tYXRjaGVzLXNlbGVjdG9yJyxmYWN0b3J5ICk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5tYXRjaGVzU2VsZWN0b3IgPSBmYWN0b3J5KCk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1hdGNoZXNNZXRob2QgPSAoIGZ1bmN0aW9uKCkge1xuICAgIHZhciBFbGVtUHJvdG8gPSBFbGVtZW50LnByb3RvdHlwZTtcbiAgICAvLyBjaGVjayBmb3IgdGhlIHN0YW5kYXJkIG1ldGhvZCBuYW1lIGZpcnN0XG4gICAgaWYgKCBFbGVtUHJvdG8ubWF0Y2hlcyApIHtcbiAgICAgIHJldHVybiAnbWF0Y2hlcyc7XG4gICAgfVxuICAgIC8vIGNoZWNrIHVuLXByZWZpeGVkXG4gICAgaWYgKCBFbGVtUHJvdG8ubWF0Y2hlc1NlbGVjdG9yICkge1xuICAgICAgcmV0dXJuICdtYXRjaGVzU2VsZWN0b3InO1xuICAgIH1cbiAgICAvLyBjaGVjayB2ZW5kb3IgcHJlZml4ZXNcbiAgICB2YXIgcHJlZml4ZXMgPSBbICd3ZWJraXQnLCAnbW96JywgJ21zJywgJ28nIF07XG5cbiAgICBmb3IgKCB2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICB2YXIgcHJlZml4ID0gcHJlZml4ZXNbaV07XG4gICAgICB2YXIgbWV0aG9kID0gcHJlZml4ICsgJ01hdGNoZXNTZWxlY3Rvcic7XG4gICAgICBpZiAoIEVsZW1Qcm90b1sgbWV0aG9kIF0gKSB7XG4gICAgICAgIHJldHVybiBtZXRob2Q7XG4gICAgICB9XG4gICAgfVxuICB9KSgpO1xuXG4gIHJldHVybiBmdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IoIGVsZW0sIHNlbGVjdG9yICkge1xuICAgIHJldHVybiBlbGVtWyBtYXRjaGVzTWV0aG9kIF0oIHNlbGVjdG9yICk7XG4gIH07XG5cbn0pKTtcblxuLyoqXG4gKiBGaXp6eSBVSSB1dGlscyB2Mi4wLjBcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSwgc3RyaWN0OiB0cnVlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSwgcmVxdWlyZTogZmFsc2UgKi9cbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggJ2Zpenp5LXVpLXV0aWxzL3V0aWxzJyxbXG4gICAgICAnbWF0Y2hlcy1zZWxlY3Rvci9tYXRjaGVzLXNlbGVjdG9yJ1xuICAgIF0sIGZ1bmN0aW9uKCBtYXRjaGVzU2VsZWN0b3IgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBtYXRjaGVzU2VsZWN0b3IgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2Rlc2FuZHJvLW1hdGNoZXMtc2VsZWN0b3InKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuZml6enlVSVV0aWxzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5tYXRjaGVzU2VsZWN0b3JcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBtYXRjaGVzU2VsZWN0b3IgKSB7XG5cblxuXG52YXIgdXRpbHMgPSB7fTtcblxuLy8gLS0tLS0gZXh0ZW5kIC0tLS0tIC8vXG5cbi8vIGV4dGVuZHMgb2JqZWN0c1xudXRpbHMuZXh0ZW5kID0gZnVuY3Rpb24oIGEsIGIgKSB7XG4gIGZvciAoIHZhciBwcm9wIGluIGIgKSB7XG4gICAgYVsgcHJvcCBdID0gYlsgcHJvcCBdO1xuICB9XG4gIHJldHVybiBhO1xufTtcblxuLy8gLS0tLS0gbW9kdWxvIC0tLS0tIC8vXG5cbnV0aWxzLm1vZHVsbyA9IGZ1bmN0aW9uKCBudW0sIGRpdiApIHtcbiAgcmV0dXJuICggKCBudW0gJSBkaXYgKSArIGRpdiApICUgZGl2O1xufTtcblxuLy8gLS0tLS0gbWFrZUFycmF5IC0tLS0tIC8vXG5cbi8vIHR1cm4gZWxlbWVudCBvciBub2RlTGlzdCBpbnRvIGFuIGFycmF5XG51dGlscy5tYWtlQXJyYXkgPSBmdW5jdGlvbiggb2JqICkge1xuICB2YXIgYXJ5ID0gW107XG4gIGlmICggQXJyYXkuaXNBcnJheSggb2JqICkgKSB7XG4gICAgLy8gdXNlIG9iamVjdCBpZiBhbHJlYWR5IGFuIGFycmF5XG4gICAgYXJ5ID0gb2JqO1xuICB9IGVsc2UgaWYgKCBvYmogJiYgdHlwZW9mIG9iai5sZW5ndGggPT0gJ251bWJlcicgKSB7XG4gICAgLy8gY29udmVydCBub2RlTGlzdCB0byBhcnJheVxuICAgIGZvciAoIHZhciBpPTA7IGkgPCBvYmoubGVuZ3RoOyBpKysgKSB7XG4gICAgICBhcnkucHVzaCggb2JqW2ldICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIGFycmF5IG9mIHNpbmdsZSBpbmRleFxuICAgIGFyeS5wdXNoKCBvYmogKTtcbiAgfVxuICByZXR1cm4gYXJ5O1xufTtcblxuLy8gLS0tLS0gcmVtb3ZlRnJvbSAtLS0tLSAvL1xuXG51dGlscy5yZW1vdmVGcm9tID0gZnVuY3Rpb24oIGFyeSwgb2JqICkge1xuICB2YXIgaW5kZXggPSBhcnkuaW5kZXhPZiggb2JqICk7XG4gIGlmICggaW5kZXggIT0gLTEgKSB7XG4gICAgYXJ5LnNwbGljZSggaW5kZXgsIDEgKTtcbiAgfVxufTtcblxuLy8gLS0tLS0gZ2V0UGFyZW50IC0tLS0tIC8vXG5cbnV0aWxzLmdldFBhcmVudCA9IGZ1bmN0aW9uKCBlbGVtLCBzZWxlY3RvciApIHtcbiAgd2hpbGUgKCBlbGVtICE9IGRvY3VtZW50LmJvZHkgKSB7XG4gICAgZWxlbSA9IGVsZW0ucGFyZW50Tm9kZTtcbiAgICBpZiAoIG1hdGNoZXNTZWxlY3RvciggZWxlbSwgc2VsZWN0b3IgKSApIHtcbiAgICAgIHJldHVybiBlbGVtO1xuICAgIH1cbiAgfVxufTtcblxuLy8gLS0tLS0gZ2V0UXVlcnlFbGVtZW50IC0tLS0tIC8vXG5cbi8vIHVzZSBlbGVtZW50IGFzIHNlbGVjdG9yIHN0cmluZ1xudXRpbHMuZ2V0UXVlcnlFbGVtZW50ID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIGlmICggdHlwZW9mIGVsZW0gPT0gJ3N0cmluZycgKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIGVsZW0gKTtcbiAgfVxuICByZXR1cm4gZWxlbTtcbn07XG5cbi8vIC0tLS0tIGhhbmRsZUV2ZW50IC0tLS0tIC8vXG5cbi8vIGVuYWJsZSAub250eXBlIHRvIHRyaWdnZXIgZnJvbSAuYWRkRXZlbnRMaXN0ZW5lciggZWxlbSwgJ3R5cGUnIClcbnV0aWxzLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICB2YXIgbWV0aG9kID0gJ29uJyArIGV2ZW50LnR5cGU7XG4gIGlmICggdGhpc1sgbWV0aG9kIF0gKSB7XG4gICAgdGhpc1sgbWV0aG9kIF0oIGV2ZW50ICk7XG4gIH1cbn07XG5cbi8vIC0tLS0tIGZpbHRlckZpbmRFbGVtZW50cyAtLS0tLSAvL1xuXG51dGlscy5maWx0ZXJGaW5kRWxlbWVudHMgPSBmdW5jdGlvbiggZWxlbXMsIHNlbGVjdG9yICkge1xuICAvLyBtYWtlIGFycmF5IG9mIGVsZW1zXG4gIGVsZW1zID0gdXRpbHMubWFrZUFycmF5KCBlbGVtcyApO1xuICB2YXIgZmZFbGVtcyA9IFtdO1xuXG4gIGVsZW1zLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtICkge1xuICAgIC8vIGNoZWNrIHRoYXQgZWxlbSBpcyBhbiBhY3R1YWwgZWxlbWVudFxuICAgIGlmICggISggZWxlbSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICkgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGFkZCBlbGVtIGlmIG5vIHNlbGVjdG9yXG4gICAgaWYgKCAhc2VsZWN0b3IgKSB7XG4gICAgICBmZkVsZW1zLnB1c2goIGVsZW0gKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gZmlsdGVyICYgZmluZCBpdGVtcyBpZiB3ZSBoYXZlIGEgc2VsZWN0b3JcbiAgICAvLyBmaWx0ZXJcbiAgICBpZiAoIG1hdGNoZXNTZWxlY3RvciggZWxlbSwgc2VsZWN0b3IgKSApIHtcbiAgICAgIGZmRWxlbXMucHVzaCggZWxlbSApO1xuICAgIH1cbiAgICAvLyBmaW5kIGNoaWxkcmVuXG4gICAgdmFyIGNoaWxkRWxlbXMgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoIHNlbGVjdG9yICk7XG4gICAgLy8gY29uY2F0IGNoaWxkRWxlbXMgdG8gZmlsdGVyRm91bmQgYXJyYXlcbiAgICBmb3IgKCB2YXIgaT0wOyBpIDwgY2hpbGRFbGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICAgIGZmRWxlbXMucHVzaCggY2hpbGRFbGVtc1tpXSApO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGZmRWxlbXM7XG59O1xuXG4vLyAtLS0tLSBkZWJvdW5jZU1ldGhvZCAtLS0tLSAvL1xuXG51dGlscy5kZWJvdW5jZU1ldGhvZCA9IGZ1bmN0aW9uKCBfY2xhc3MsIG1ldGhvZE5hbWUsIHRocmVzaG9sZCApIHtcbiAgLy8gb3JpZ2luYWwgbWV0aG9kXG4gIHZhciBtZXRob2QgPSBfY2xhc3MucHJvdG90eXBlWyBtZXRob2ROYW1lIF07XG4gIHZhciB0aW1lb3V0TmFtZSA9IG1ldGhvZE5hbWUgKyAnVGltZW91dCc7XG5cbiAgX2NsYXNzLnByb3RvdHlwZVsgbWV0aG9kTmFtZSBdID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRpbWVvdXQgPSB0aGlzWyB0aW1lb3V0TmFtZSBdO1xuICAgIGlmICggdGltZW91dCApIHtcbiAgICAgIGNsZWFyVGltZW91dCggdGltZW91dCApO1xuICAgIH1cbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpc1sgdGltZW91dE5hbWUgXSA9IHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgbWV0aG9kLmFwcGx5KCBfdGhpcywgYXJncyApO1xuICAgICAgZGVsZXRlIF90aGlzWyB0aW1lb3V0TmFtZSBdO1xuICAgIH0sIHRocmVzaG9sZCB8fCAxMDAgKTtcbiAgfTtcbn07XG5cbi8vIC0tLS0tIGRvY1JlYWR5IC0tLS0tIC8vXG5cbnV0aWxzLmRvY1JlYWR5ID0gZnVuY3Rpb24oIGNhbGxiYWNrICkge1xuICBpZiAoIGRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJyApIHtcbiAgICBjYWxsYmFjaygpO1xuICB9IGVsc2Uge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdET01Db250ZW50TG9hZGVkJywgY2FsbGJhY2sgKTtcbiAgfVxufTtcblxuLy8gLS0tLS0gaHRtbEluaXQgLS0tLS0gLy9cblxuLy8gaHR0cDovL2phbWVzcm9iZXJ0cy5uYW1lL2Jsb2cvMjAxMC8wMi8yMi9zdHJpbmctZnVuY3Rpb25zLWZvci1qYXZhc2NyaXB0LXRyaW0tdG8tY2FtZWwtY2FzZS10by1kYXNoZWQtYW5kLXRvLXVuZGVyc2NvcmUvXG51dGlscy50b0Rhc2hlZCA9IGZ1bmN0aW9uKCBzdHIgKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSggLyguKShbQS1aXSkvZywgZnVuY3Rpb24oIG1hdGNoLCAkMSwgJDIgKSB7XG4gICAgcmV0dXJuICQxICsgJy0nICsgJDI7XG4gIH0pLnRvTG93ZXJDYXNlKCk7XG59O1xuXG52YXIgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlO1xuLyoqXG4gKiBhbGxvdyB1c2VyIHRvIGluaXRpYWxpemUgY2xhc3NlcyB2aWEgW2RhdGEtbmFtZXNwYWNlXSBvciAuanMtbmFtZXNwYWNlIGNsYXNzXG4gKiBodG1sSW5pdCggV2lkZ2V0LCAnd2lkZ2V0TmFtZScgKVxuICogb3B0aW9ucyBhcmUgcGFyc2VkIGZyb20gZGF0YS1uYW1lc3BhY2Utb3B0aW9uc1xuICovXG51dGlscy5odG1sSW5pdCA9IGZ1bmN0aW9uKCBXaWRnZXRDbGFzcywgbmFtZXNwYWNlICkge1xuICB1dGlscy5kb2NSZWFkeSggZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRhc2hlZE5hbWVzcGFjZSA9IHV0aWxzLnRvRGFzaGVkKCBuYW1lc3BhY2UgKTtcbiAgICB2YXIgZGF0YUF0dHIgPSAnZGF0YS0nICsgZGFzaGVkTmFtZXNwYWNlO1xuICAgIHZhciBkYXRhQXR0ckVsZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJ1snICsgZGF0YUF0dHIgKyAnXScgKTtcbiAgICB2YXIganNEYXNoRWxlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnLmpzLScgKyBkYXNoZWROYW1lc3BhY2UgKTtcbiAgICB2YXIgZWxlbXMgPSB1dGlscy5tYWtlQXJyYXkoIGRhdGFBdHRyRWxlbXMgKVxuICAgICAgLmNvbmNhdCggdXRpbHMubWFrZUFycmF5KCBqc0Rhc2hFbGVtcyApICk7XG4gICAgdmFyIGRhdGFPcHRpb25zQXR0ciA9IGRhdGFBdHRyICsgJy1vcHRpb25zJztcbiAgICB2YXIgalF1ZXJ5ID0gd2luZG93LmpRdWVyeTtcblxuICAgIGVsZW1zLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtICkge1xuICAgICAgdmFyIGF0dHIgPSBlbGVtLmdldEF0dHJpYnV0ZSggZGF0YUF0dHIgKSB8fFxuICAgICAgICBlbGVtLmdldEF0dHJpYnV0ZSggZGF0YU9wdGlvbnNBdHRyICk7XG4gICAgICB2YXIgb3B0aW9ucztcbiAgICAgIHRyeSB7XG4gICAgICAgIG9wdGlvbnMgPSBhdHRyICYmIEpTT04ucGFyc2UoIGF0dHIgKTtcbiAgICAgIH0gY2F0Y2ggKCBlcnJvciApIHtcbiAgICAgICAgLy8gbG9nIGVycm9yLCBkbyBub3QgaW5pdGlhbGl6ZVxuICAgICAgICBpZiAoIGNvbnNvbGUgKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvciggJ0Vycm9yIHBhcnNpbmcgJyArIGRhdGFBdHRyICsgJyBvbiAnICsgZWxlbS5jbGFzc05hbWUgK1xuICAgICAgICAgICc6ICcgKyBlcnJvciApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIGluaXRpYWxpemVcbiAgICAgIHZhciBpbnN0YW5jZSA9IG5ldyBXaWRnZXRDbGFzcyggZWxlbSwgb3B0aW9ucyApO1xuICAgICAgLy8gbWFrZSBhdmFpbGFibGUgdmlhICQoKS5kYXRhKCdsYXlvdXRuYW1lJylcbiAgICAgIGlmICggalF1ZXJ5ICkge1xuICAgICAgICBqUXVlcnkuZGF0YSggZWxlbSwgbmFtZXNwYWNlLCBpbnN0YW5jZSApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIH0pO1xufTtcblxuLy8gLS0tLS0gIC0tLS0tIC8vXG5cbnJldHVybiB1dGlscztcblxufSkpO1xuXG4vKipcbiAqIE91dGxheWVyIEl0ZW1cbiAqL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqLyAvKiBnbG9iYWxzIGRlZmluZSwgbW9kdWxlLCByZXF1aXJlICovXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EIC0gUmVxdWlyZUpTXG4gICAgZGVmaW5lKCAnb3V0bGF5ZXIvaXRlbScsW1xuICAgICAgICAnZXYtZW1pdHRlci9ldi1lbWl0dGVyJyxcbiAgICAgICAgJ2dldC1zaXplL2dldC1zaXplJ1xuICAgICAgXSxcbiAgICAgIGZ1bmN0aW9uKCBFdkVtaXR0ZXIsIGdldFNpemUgKSB7XG4gICAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIEV2RW1pdHRlciwgZ2V0U2l6ZSApO1xuICAgICAgfVxuICAgICk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMgKSB7XG4gICAgLy8gQ29tbW9uSlMgLSBCcm93c2VyaWZ5LCBXZWJwYWNrXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgcmVxdWlyZSgnZXYtZW1pdHRlcicpLFxuICAgICAgcmVxdWlyZSgnZ2V0LXNpemUnKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuT3V0bGF5ZXIgPSB7fTtcbiAgICB3aW5kb3cuT3V0bGF5ZXIuSXRlbSA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICB3aW5kb3cuRXZFbWl0dGVyLFxuICAgICAgd2luZG93LmdldFNpemVcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBFdkVtaXR0ZXIsIGdldFNpemUgKSB7XG4ndXNlIHN0cmljdCc7XG5cbi8vIC0tLS0tIGhlbHBlcnMgLS0tLS0gLy9cblxuZnVuY3Rpb24gaXNFbXB0eU9iaiggb2JqICkge1xuICBmb3IgKCB2YXIgcHJvcCBpbiBvYmogKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHByb3AgPSBudWxsO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ1NTMyBzdXBwb3J0IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cblxudmFyIGRvY0VsZW1TdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZTtcblxudmFyIHRyYW5zaXRpb25Qcm9wZXJ0eSA9IHR5cGVvZiBkb2NFbGVtU3R5bGUudHJhbnNpdGlvbiA9PSAnc3RyaW5nJyA/XG4gICd0cmFuc2l0aW9uJyA6ICdXZWJraXRUcmFuc2l0aW9uJztcbnZhciB0cmFuc2Zvcm1Qcm9wZXJ0eSA9IHR5cGVvZiBkb2NFbGVtU3R5bGUudHJhbnNmb3JtID09ICdzdHJpbmcnID9cbiAgJ3RyYW5zZm9ybScgOiAnV2Via2l0VHJhbnNmb3JtJztcblxudmFyIHRyYW5zaXRpb25FbmRFdmVudCA9IHtcbiAgV2Via2l0VHJhbnNpdGlvbjogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICB0cmFuc2l0aW9uOiAndHJhbnNpdGlvbmVuZCdcbn1bIHRyYW5zaXRpb25Qcm9wZXJ0eSBdO1xuXG4vLyBjYWNoZSBhbGwgdmVuZG9yIHByb3BlcnRpZXNcbnZhciB2ZW5kb3JQcm9wZXJ0aWVzID0gW1xuICB0cmFuc2Zvcm1Qcm9wZXJ0eSxcbiAgdHJhbnNpdGlvblByb3BlcnR5LFxuICB0cmFuc2l0aW9uUHJvcGVydHkgKyAnRHVyYXRpb24nLFxuICB0cmFuc2l0aW9uUHJvcGVydHkgKyAnUHJvcGVydHknXG5dO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJdGVtIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbmZ1bmN0aW9uIEl0ZW0oIGVsZW1lbnQsIGxheW91dCApIHtcbiAgaWYgKCAhZWxlbWVudCApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAvLyBwYXJlbnQgbGF5b3V0IGNsYXNzLCBpLmUuIE1hc29ucnksIElzb3RvcGUsIG9yIFBhY2tlcnlcbiAgdGhpcy5sYXlvdXQgPSBsYXlvdXQ7XG4gIHRoaXMucG9zaXRpb24gPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH07XG5cbiAgdGhpcy5fY3JlYXRlKCk7XG59XG5cbi8vIGluaGVyaXQgRXZFbWl0dGVyXG52YXIgcHJvdG8gPSBJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEV2RW1pdHRlci5wcm90b3R5cGUgKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gSXRlbTtcblxucHJvdG8uX2NyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyB0cmFuc2l0aW9uIG9iamVjdHNcbiAgdGhpcy5fdHJhbnNuID0ge1xuICAgIGluZ1Byb3BlcnRpZXM6IHt9LFxuICAgIGNsZWFuOiB7fSxcbiAgICBvbkVuZDoge31cbiAgfTtcblxuICB0aGlzLmNzcyh7XG4gICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgfSk7XG59O1xuXG4vLyB0cmlnZ2VyIHNwZWNpZmllZCBoYW5kbGVyIGZvciBldmVudCB0eXBlXG5wcm90by5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdmFyIG1ldGhvZCA9ICdvbicgKyBldmVudC50eXBlO1xuICBpZiAoIHRoaXNbIG1ldGhvZCBdICkge1xuICAgIHRoaXNbIG1ldGhvZCBdKCBldmVudCApO1xuICB9XG59O1xuXG5wcm90by5nZXRTaXplID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc2l6ZSA9IGdldFNpemUoIHRoaXMuZWxlbWVudCApO1xufTtcblxuLyoqXG4gKiBhcHBseSBDU1Mgc3R5bGVzIHRvIGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBzdHlsZVxuICovXG5wcm90by5jc3MgPSBmdW5jdGlvbiggc3R5bGUgKSB7XG4gIHZhciBlbGVtU3R5bGUgPSB0aGlzLmVsZW1lbnQuc3R5bGU7XG5cbiAgZm9yICggdmFyIHByb3AgaW4gc3R5bGUgKSB7XG4gICAgLy8gdXNlIHZlbmRvciBwcm9wZXJ0eSBpZiBhdmFpbGFibGVcbiAgICB2YXIgc3VwcG9ydGVkUHJvcCA9IHZlbmRvclByb3BlcnRpZXNbIHByb3AgXSB8fCBwcm9wO1xuICAgIGVsZW1TdHlsZVsgc3VwcG9ydGVkUHJvcCBdID0gc3R5bGVbIHByb3AgXTtcbiAgfVxufTtcblxuIC8vIG1lYXN1cmUgcG9zaXRpb24sIGFuZCBzZXRzIGl0XG5wcm90by5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKCB0aGlzLmVsZW1lbnQgKTtcbiAgdmFyIGlzT3JpZ2luTGVmdCA9IHRoaXMubGF5b3V0Ll9nZXRPcHRpb24oJ29yaWdpbkxlZnQnKTtcbiAgdmFyIGlzT3JpZ2luVG9wID0gdGhpcy5sYXlvdXQuX2dldE9wdGlvbignb3JpZ2luVG9wJyk7XG4gIHZhciB4VmFsdWUgPSBzdHlsZVsgaXNPcmlnaW5MZWZ0ID8gJ2xlZnQnIDogJ3JpZ2h0JyBdO1xuICB2YXIgeVZhbHVlID0gc3R5bGVbIGlzT3JpZ2luVG9wID8gJ3RvcCcgOiAnYm90dG9tJyBdO1xuICAvLyBjb252ZXJ0IHBlcmNlbnQgdG8gcGl4ZWxzXG4gIHZhciBsYXlvdXRTaXplID0gdGhpcy5sYXlvdXQuc2l6ZTtcbiAgdmFyIHggPSB4VmFsdWUuaW5kZXhPZignJScpICE9IC0xID9cbiAgICAoIHBhcnNlRmxvYXQoIHhWYWx1ZSApIC8gMTAwICkgKiBsYXlvdXRTaXplLndpZHRoIDogcGFyc2VJbnQoIHhWYWx1ZSwgMTAgKTtcbiAgdmFyIHkgPSB5VmFsdWUuaW5kZXhPZignJScpICE9IC0xID9cbiAgICAoIHBhcnNlRmxvYXQoIHlWYWx1ZSApIC8gMTAwICkgKiBsYXlvdXRTaXplLmhlaWdodCA6IHBhcnNlSW50KCB5VmFsdWUsIDEwICk7XG5cbiAgLy8gY2xlYW4gdXAgJ2F1dG8nIG9yIG90aGVyIG5vbi1pbnRlZ2VyIHZhbHVlc1xuICB4ID0gaXNOYU4oIHggKSA/IDAgOiB4O1xuICB5ID0gaXNOYU4oIHkgKSA/IDAgOiB5O1xuICAvLyByZW1vdmUgcGFkZGluZyBmcm9tIG1lYXN1cmVtZW50XG4gIHggLT0gaXNPcmlnaW5MZWZ0ID8gbGF5b3V0U2l6ZS5wYWRkaW5nTGVmdCA6IGxheW91dFNpemUucGFkZGluZ1JpZ2h0O1xuICB5IC09IGlzT3JpZ2luVG9wID8gbGF5b3V0U2l6ZS5wYWRkaW5nVG9wIDogbGF5b3V0U2l6ZS5wYWRkaW5nQm90dG9tO1xuXG4gIHRoaXMucG9zaXRpb24ueCA9IHg7XG4gIHRoaXMucG9zaXRpb24ueSA9IHk7XG59O1xuXG4vLyBzZXQgc2V0dGxlZCBwb3NpdGlvbiwgYXBwbHkgcGFkZGluZ1xucHJvdG8ubGF5b3V0UG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGxheW91dFNpemUgPSB0aGlzLmxheW91dC5zaXplO1xuICB2YXIgc3R5bGUgPSB7fTtcbiAgdmFyIGlzT3JpZ2luTGVmdCA9IHRoaXMubGF5b3V0Ll9nZXRPcHRpb24oJ29yaWdpbkxlZnQnKTtcbiAgdmFyIGlzT3JpZ2luVG9wID0gdGhpcy5sYXlvdXQuX2dldE9wdGlvbignb3JpZ2luVG9wJyk7XG5cbiAgLy8geFxuICB2YXIgeFBhZGRpbmcgPSBpc09yaWdpbkxlZnQgPyAncGFkZGluZ0xlZnQnIDogJ3BhZGRpbmdSaWdodCc7XG4gIHZhciB4UHJvcGVydHkgPSBpc09yaWdpbkxlZnQgPyAnbGVmdCcgOiAncmlnaHQnO1xuICB2YXIgeFJlc2V0UHJvcGVydHkgPSBpc09yaWdpbkxlZnQgPyAncmlnaHQnIDogJ2xlZnQnO1xuXG4gIHZhciB4ID0gdGhpcy5wb3NpdGlvbi54ICsgbGF5b3V0U2l6ZVsgeFBhZGRpbmcgXTtcbiAgLy8gc2V0IGluIHBlcmNlbnRhZ2Ugb3IgcGl4ZWxzXG4gIHN0eWxlWyB4UHJvcGVydHkgXSA9IHRoaXMuZ2V0WFZhbHVlKCB4ICk7XG4gIC8vIHJlc2V0IG90aGVyIHByb3BlcnR5XG4gIHN0eWxlWyB4UmVzZXRQcm9wZXJ0eSBdID0gJyc7XG5cbiAgLy8geVxuICB2YXIgeVBhZGRpbmcgPSBpc09yaWdpblRvcCA/ICdwYWRkaW5nVG9wJyA6ICdwYWRkaW5nQm90dG9tJztcbiAgdmFyIHlQcm9wZXJ0eSA9IGlzT3JpZ2luVG9wID8gJ3RvcCcgOiAnYm90dG9tJztcbiAgdmFyIHlSZXNldFByb3BlcnR5ID0gaXNPcmlnaW5Ub3AgPyAnYm90dG9tJyA6ICd0b3AnO1xuXG4gIHZhciB5ID0gdGhpcy5wb3NpdGlvbi55ICsgbGF5b3V0U2l6ZVsgeVBhZGRpbmcgXTtcbiAgLy8gc2V0IGluIHBlcmNlbnRhZ2Ugb3IgcGl4ZWxzXG4gIHN0eWxlWyB5UHJvcGVydHkgXSA9IHRoaXMuZ2V0WVZhbHVlKCB5ICk7XG4gIC8vIHJlc2V0IG90aGVyIHByb3BlcnR5XG4gIHN0eWxlWyB5UmVzZXRQcm9wZXJ0eSBdID0gJyc7XG5cbiAgdGhpcy5jc3MoIHN0eWxlICk7XG4gIHRoaXMuZW1pdEV2ZW50KCAnbGF5b3V0JywgWyB0aGlzIF0gKTtcbn07XG5cbnByb3RvLmdldFhWYWx1ZSA9IGZ1bmN0aW9uKCB4ICkge1xuICB2YXIgaXNIb3Jpem9udGFsID0gdGhpcy5sYXlvdXQuX2dldE9wdGlvbignaG9yaXpvbnRhbCcpO1xuICByZXR1cm4gdGhpcy5sYXlvdXQub3B0aW9ucy5wZXJjZW50UG9zaXRpb24gJiYgIWlzSG9yaXpvbnRhbCA/XG4gICAgKCAoIHggLyB0aGlzLmxheW91dC5zaXplLndpZHRoICkgKiAxMDAgKSArICclJyA6IHggKyAncHgnO1xufTtcblxucHJvdG8uZ2V0WVZhbHVlID0gZnVuY3Rpb24oIHkgKSB7XG4gIHZhciBpc0hvcml6b250YWwgPSB0aGlzLmxheW91dC5fZ2V0T3B0aW9uKCdob3Jpem9udGFsJyk7XG4gIHJldHVybiB0aGlzLmxheW91dC5vcHRpb25zLnBlcmNlbnRQb3NpdGlvbiAmJiBpc0hvcml6b250YWwgP1xuICAgICggKCB5IC8gdGhpcy5sYXlvdXQuc2l6ZS5oZWlnaHQgKSAqIDEwMCApICsgJyUnIDogeSArICdweCc7XG59O1xuXG5wcm90by5fdHJhbnNpdGlvblRvID0gZnVuY3Rpb24oIHgsIHkgKSB7XG4gIHRoaXMuZ2V0UG9zaXRpb24oKTtcbiAgLy8gZ2V0IGN1cnJlbnQgeCAmIHkgZnJvbSB0b3AvbGVmdFxuICB2YXIgY3VyWCA9IHRoaXMucG9zaXRpb24ueDtcbiAgdmFyIGN1clkgPSB0aGlzLnBvc2l0aW9uLnk7XG5cbiAgdmFyIGNvbXBhcmVYID0gcGFyc2VJbnQoIHgsIDEwICk7XG4gIHZhciBjb21wYXJlWSA9IHBhcnNlSW50KCB5LCAxMCApO1xuICB2YXIgZGlkTm90TW92ZSA9IGNvbXBhcmVYID09PSB0aGlzLnBvc2l0aW9uLnggJiYgY29tcGFyZVkgPT09IHRoaXMucG9zaXRpb24ueTtcblxuICAvLyBzYXZlIGVuZCBwb3NpdGlvblxuICB0aGlzLnNldFBvc2l0aW9uKCB4LCB5ICk7XG5cbiAgLy8gaWYgZGlkIG5vdCBtb3ZlIGFuZCBub3QgdHJhbnNpdGlvbmluZywganVzdCBnbyB0byBsYXlvdXRcbiAgaWYgKCBkaWROb3RNb3ZlICYmICF0aGlzLmlzVHJhbnNpdGlvbmluZyApIHtcbiAgICB0aGlzLmxheW91dFBvc2l0aW9uKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHRyYW5zWCA9IHggLSBjdXJYO1xuICB2YXIgdHJhbnNZID0geSAtIGN1clk7XG4gIHZhciB0cmFuc2l0aW9uU3R5bGUgPSB7fTtcbiAgdHJhbnNpdGlvblN0eWxlLnRyYW5zZm9ybSA9IHRoaXMuZ2V0VHJhbnNsYXRlKCB0cmFuc1gsIHRyYW5zWSApO1xuXG4gIHRoaXMudHJhbnNpdGlvbih7XG4gICAgdG86IHRyYW5zaXRpb25TdHlsZSxcbiAgICBvblRyYW5zaXRpb25FbmQ6IHtcbiAgICAgIHRyYW5zZm9ybTogdGhpcy5sYXlvdXRQb3NpdGlvblxuICAgIH0sXG4gICAgaXNDbGVhbmluZzogdHJ1ZVxuICB9KTtcbn07XG5cbnByb3RvLmdldFRyYW5zbGF0ZSA9IGZ1bmN0aW9uKCB4LCB5ICkge1xuICAvLyBmbGlwIGNvb3JpZGluYXRlcyBpZiBvcmlnaW4gb24gcmlnaHQgb3IgYm90dG9tXG4gIHZhciBpc09yaWdpbkxlZnQgPSB0aGlzLmxheW91dC5fZ2V0T3B0aW9uKCdvcmlnaW5MZWZ0Jyk7XG4gIHZhciBpc09yaWdpblRvcCA9IHRoaXMubGF5b3V0Ll9nZXRPcHRpb24oJ29yaWdpblRvcCcpO1xuICB4ID0gaXNPcmlnaW5MZWZ0ID8geCA6IC14O1xuICB5ID0gaXNPcmlnaW5Ub3AgPyB5IDogLXk7XG4gIHJldHVybiAndHJhbnNsYXRlM2QoJyArIHggKyAncHgsICcgKyB5ICsgJ3B4LCAwKSc7XG59O1xuXG4vLyBub24gdHJhbnNpdGlvbiArIHRyYW5zZm9ybSBzdXBwb3J0XG5wcm90by5nb1RvID0gZnVuY3Rpb24oIHgsIHkgKSB7XG4gIHRoaXMuc2V0UG9zaXRpb24oIHgsIHkgKTtcbiAgdGhpcy5sYXlvdXRQb3NpdGlvbigpO1xufTtcblxucHJvdG8ubW92ZVRvID0gcHJvdG8uX3RyYW5zaXRpb25UbztcblxucHJvdG8uc2V0UG9zaXRpb24gPSBmdW5jdGlvbiggeCwgeSApIHtcbiAgdGhpcy5wb3NpdGlvbi54ID0gcGFyc2VJbnQoIHgsIDEwICk7XG4gIHRoaXMucG9zaXRpb24ueSA9IHBhcnNlSW50KCB5LCAxMCApO1xufTtcblxuLy8gLS0tLS0gdHJhbnNpdGlvbiAtLS0tLSAvL1xuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBzdHlsZSAtIENTU1xuICogQHBhcmFtIHtGdW5jdGlvbn0gb25UcmFuc2l0aW9uRW5kXG4gKi9cblxuLy8gbm9uIHRyYW5zaXRpb24sIGp1c3QgdHJpZ2dlciBjYWxsYmFja1xucHJvdG8uX25vblRyYW5zaXRpb24gPSBmdW5jdGlvbiggYXJncyApIHtcbiAgdGhpcy5jc3MoIGFyZ3MudG8gKTtcbiAgaWYgKCBhcmdzLmlzQ2xlYW5pbmcgKSB7XG4gICAgdGhpcy5fcmVtb3ZlU3R5bGVzKCBhcmdzLnRvICk7XG4gIH1cbiAgZm9yICggdmFyIHByb3AgaW4gYXJncy5vblRyYW5zaXRpb25FbmQgKSB7XG4gICAgYXJncy5vblRyYW5zaXRpb25FbmRbIHByb3AgXS5jYWxsKCB0aGlzICk7XG4gIH1cbn07XG5cbi8qKlxuICogcHJvcGVyIHRyYW5zaXRpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBhcmdzIC0gYXJndW1lbnRzXG4gKiAgIEBwYXJhbSB7T2JqZWN0fSB0byAtIHN0eWxlIHRvIHRyYW5zaXRpb24gdG9cbiAqICAgQHBhcmFtIHtPYmplY3R9IGZyb20gLSBzdHlsZSB0byBzdGFydCB0cmFuc2l0aW9uIGZyb21cbiAqICAgQHBhcmFtIHtCb29sZWFufSBpc0NsZWFuaW5nIC0gcmVtb3ZlcyB0cmFuc2l0aW9uIHN0eWxlcyBhZnRlciB0cmFuc2l0aW9uXG4gKiAgIEBwYXJhbSB7RnVuY3Rpb259IG9uVHJhbnNpdGlvbkVuZCAtIGNhbGxiYWNrXG4gKi9cbnByb3RvLl90cmFuc2l0aW9uID0gZnVuY3Rpb24oIGFyZ3MgKSB7XG4gIC8vIHJlZGlyZWN0IHRvIG5vblRyYW5zaXRpb24gaWYgbm8gdHJhbnNpdGlvbiBkdXJhdGlvblxuICBpZiAoICFwYXJzZUZsb2F0KCB0aGlzLmxheW91dC5vcHRpb25zLnRyYW5zaXRpb25EdXJhdGlvbiApICkge1xuICAgIHRoaXMuX25vblRyYW5zaXRpb24oIGFyZ3MgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgX3RyYW5zaXRpb24gPSB0aGlzLl90cmFuc247XG4gIC8vIGtlZXAgdHJhY2sgb2Ygb25UcmFuc2l0aW9uRW5kIGNhbGxiYWNrIGJ5IGNzcyBwcm9wZXJ0eVxuICBmb3IgKCB2YXIgcHJvcCBpbiBhcmdzLm9uVHJhbnNpdGlvbkVuZCApIHtcbiAgICBfdHJhbnNpdGlvbi5vbkVuZFsgcHJvcCBdID0gYXJncy5vblRyYW5zaXRpb25FbmRbIHByb3AgXTtcbiAgfVxuICAvLyBrZWVwIHRyYWNrIG9mIHByb3BlcnRpZXMgdGhhdCBhcmUgdHJhbnNpdGlvbmluZ1xuICBmb3IgKCBwcm9wIGluIGFyZ3MudG8gKSB7XG4gICAgX3RyYW5zaXRpb24uaW5nUHJvcGVydGllc1sgcHJvcCBdID0gdHJ1ZTtcbiAgICAvLyBrZWVwIHRyYWNrIG9mIHByb3BlcnRpZXMgdG8gY2xlYW4gdXAgd2hlbiB0cmFuc2l0aW9uIGlzIGRvbmVcbiAgICBpZiAoIGFyZ3MuaXNDbGVhbmluZyApIHtcbiAgICAgIF90cmFuc2l0aW9uLmNsZWFuWyBwcm9wIF0gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIHNldCBmcm9tIHN0eWxlc1xuICBpZiAoIGFyZ3MuZnJvbSApIHtcbiAgICB0aGlzLmNzcyggYXJncy5mcm9tICk7XG4gICAgLy8gZm9yY2UgcmVkcmF3LiBodHRwOi8vYmxvZy5hbGV4bWFjY2F3LmNvbS9jc3MtdHJhbnNpdGlvbnNcbiAgICB2YXIgaCA9IHRoaXMuZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgLy8gaGFjayBmb3IgSlNIaW50IHRvIGh1c2ggYWJvdXQgdW51c2VkIHZhclxuICAgIGggPSBudWxsO1xuICB9XG4gIC8vIGVuYWJsZSB0cmFuc2l0aW9uXG4gIHRoaXMuZW5hYmxlVHJhbnNpdGlvbiggYXJncy50byApO1xuICAvLyBzZXQgc3R5bGVzIHRoYXQgYXJlIHRyYW5zaXRpb25pbmdcbiAgdGhpcy5jc3MoIGFyZ3MudG8gKTtcblxuICB0aGlzLmlzVHJhbnNpdGlvbmluZyA9IHRydWU7XG5cbn07XG5cbi8vIGRhc2ggYmVmb3JlIGFsbCBjYXAgbGV0dGVycywgaW5jbHVkaW5nIGZpcnN0IGZvclxuLy8gV2Via2l0VHJhbnNmb3JtID0+IC13ZWJraXQtdHJhbnNmb3JtXG5mdW5jdGlvbiB0b0Rhc2hlZEFsbCggc3RyICkge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoIC8oW0EtWl0pL2csIGZ1bmN0aW9uKCAkMSApIHtcbiAgICByZXR1cm4gJy0nICsgJDEudG9Mb3dlckNhc2UoKTtcbiAgfSk7XG59XG5cbnZhciB0cmFuc2l0aW9uUHJvcHMgPSAnb3BhY2l0eSwnICtcbiAgdG9EYXNoZWRBbGwoIHZlbmRvclByb3BlcnRpZXMudHJhbnNmb3JtIHx8ICd0cmFuc2Zvcm0nICk7XG5cbnByb3RvLmVuYWJsZVRyYW5zaXRpb24gPSBmdW5jdGlvbigvKiBzdHlsZSAqLykge1xuICAvLyBIQUNLIGNoYW5naW5nIHRyYW5zaXRpb25Qcm9wZXJ0eSBkdXJpbmcgYSB0cmFuc2l0aW9uXG4gIC8vIHdpbGwgY2F1c2UgdHJhbnNpdGlvbiB0byBqdW1wXG4gIGlmICggdGhpcy5pc1RyYW5zaXRpb25pbmcgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gbWFrZSBgdHJhbnNpdGlvbjogZm9vLCBiYXIsIGJhemAgZnJvbSBzdHlsZSBvYmplY3RcbiAgLy8gSEFDSyB1bi1jb21tZW50IHRoaXMgd2hlbiBlbmFibGVUcmFuc2l0aW9uIGNhbiB3b3JrXG4gIC8vIHdoaWxlIGEgdHJhbnNpdGlvbiBpcyBoYXBwZW5pbmdcbiAgLy8gdmFyIHRyYW5zaXRpb25WYWx1ZXMgPSBbXTtcbiAgLy8gZm9yICggdmFyIHByb3AgaW4gc3R5bGUgKSB7XG4gIC8vICAgLy8gZGFzaC1pZnkgY2FtZWxDYXNlZCBwcm9wZXJ0aWVzIGxpa2UgV2Via2l0VHJhbnNpdGlvblxuICAvLyAgIHByb3AgPSB2ZW5kb3JQcm9wZXJ0aWVzWyBwcm9wIF0gfHwgcHJvcDtcbiAgLy8gICB0cmFuc2l0aW9uVmFsdWVzLnB1c2goIHRvRGFzaGVkQWxsKCBwcm9wICkgKTtcbiAgLy8gfVxuICAvLyBlbmFibGUgdHJhbnNpdGlvbiBzdHlsZXNcbiAgdGhpcy5jc3Moe1xuICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogdHJhbnNpdGlvblByb3BzLFxuICAgIHRyYW5zaXRpb25EdXJhdGlvbjogdGhpcy5sYXlvdXQub3B0aW9ucy50cmFuc2l0aW9uRHVyYXRpb25cbiAgfSk7XG4gIC8vIGxpc3RlbiBmb3IgdHJhbnNpdGlvbiBlbmQgZXZlbnRcbiAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIHRyYW5zaXRpb25FbmRFdmVudCwgdGhpcywgZmFsc2UgKTtcbn07XG5cbnByb3RvLnRyYW5zaXRpb24gPSBJdGVtLnByb3RvdHlwZVsgdHJhbnNpdGlvblByb3BlcnR5ID8gJ190cmFuc2l0aW9uJyA6ICdfbm9uVHJhbnNpdGlvbicgXTtcblxuLy8gLS0tLS0gZXZlbnRzIC0tLS0tIC8vXG5cbnByb3RvLm9ud2Via2l0VHJhbnNpdGlvbkVuZCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdGhpcy5vbnRyYW5zaXRpb25lbmQoIGV2ZW50ICk7XG59O1xuXG5wcm90by5vbm90cmFuc2l0aW9uZW5kID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICB0aGlzLm9udHJhbnNpdGlvbmVuZCggZXZlbnQgKTtcbn07XG5cbi8vIHByb3BlcnRpZXMgdGhhdCBJIG11bmdlIHRvIG1ha2UgbXkgbGlmZSBlYXNpZXJcbnZhciBkYXNoZWRWZW5kb3JQcm9wZXJ0aWVzID0ge1xuICAnLXdlYmtpdC10cmFuc2Zvcm0nOiAndHJhbnNmb3JtJ1xufTtcblxucHJvdG8ub250cmFuc2l0aW9uZW5kID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICAvLyBkaXNyZWdhcmQgYnViYmxlZCBldmVudHMgZnJvbSBjaGlsZHJlblxuICBpZiAoIGV2ZW50LnRhcmdldCAhPT0gdGhpcy5lbGVtZW50ICkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgX3RyYW5zaXRpb24gPSB0aGlzLl90cmFuc247XG4gIC8vIGdldCBwcm9wZXJ0eSBuYW1lIG9mIHRyYW5zaXRpb25lZCBwcm9wZXJ0eSwgY29udmVydCB0byBwcmVmaXgtZnJlZVxuICB2YXIgcHJvcGVydHlOYW1lID0gZGFzaGVkVmVuZG9yUHJvcGVydGllc1sgZXZlbnQucHJvcGVydHlOYW1lIF0gfHwgZXZlbnQucHJvcGVydHlOYW1lO1xuXG4gIC8vIHJlbW92ZSBwcm9wZXJ0eSB0aGF0IGhhcyBjb21wbGV0ZWQgdHJhbnNpdGlvbmluZ1xuICBkZWxldGUgX3RyYW5zaXRpb24uaW5nUHJvcGVydGllc1sgcHJvcGVydHlOYW1lIF07XG4gIC8vIGNoZWNrIGlmIGFueSBwcm9wZXJ0aWVzIGFyZSBzdGlsbCB0cmFuc2l0aW9uaW5nXG4gIGlmICggaXNFbXB0eU9iaiggX3RyYW5zaXRpb24uaW5nUHJvcGVydGllcyApICkge1xuICAgIC8vIGFsbCBwcm9wZXJ0aWVzIGhhdmUgY29tcGxldGVkIHRyYW5zaXRpb25pbmdcbiAgICB0aGlzLmRpc2FibGVUcmFuc2l0aW9uKCk7XG4gIH1cbiAgLy8gY2xlYW4gc3R5bGVcbiAgaWYgKCBwcm9wZXJ0eU5hbWUgaW4gX3RyYW5zaXRpb24uY2xlYW4gKSB7XG4gICAgLy8gY2xlYW4gdXAgc3R5bGVcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGVbIGV2ZW50LnByb3BlcnR5TmFtZSBdID0gJyc7XG4gICAgZGVsZXRlIF90cmFuc2l0aW9uLmNsZWFuWyBwcm9wZXJ0eU5hbWUgXTtcbiAgfVxuICAvLyB0cmlnZ2VyIG9uVHJhbnNpdGlvbkVuZCBjYWxsYmFja1xuICBpZiAoIHByb3BlcnR5TmFtZSBpbiBfdHJhbnNpdGlvbi5vbkVuZCApIHtcbiAgICB2YXIgb25UcmFuc2l0aW9uRW5kID0gX3RyYW5zaXRpb24ub25FbmRbIHByb3BlcnR5TmFtZSBdO1xuICAgIG9uVHJhbnNpdGlvbkVuZC5jYWxsKCB0aGlzICk7XG4gICAgZGVsZXRlIF90cmFuc2l0aW9uLm9uRW5kWyBwcm9wZXJ0eU5hbWUgXTtcbiAgfVxuXG4gIHRoaXMuZW1pdEV2ZW50KCAndHJhbnNpdGlvbkVuZCcsIFsgdGhpcyBdICk7XG59O1xuXG5wcm90by5kaXNhYmxlVHJhbnNpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnJlbW92ZVRyYW5zaXRpb25TdHlsZXMoKTtcbiAgdGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoIHRyYW5zaXRpb25FbmRFdmVudCwgdGhpcywgZmFsc2UgKTtcbiAgdGhpcy5pc1RyYW5zaXRpb25pbmcgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogcmVtb3ZlcyBzdHlsZSBwcm9wZXJ0eSBmcm9tIGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBzdHlsZVxuKiovXG5wcm90by5fcmVtb3ZlU3R5bGVzID0gZnVuY3Rpb24oIHN0eWxlICkge1xuICAvLyBjbGVhbiB1cCB0cmFuc2l0aW9uIHN0eWxlc1xuICB2YXIgY2xlYW5TdHlsZSA9IHt9O1xuICBmb3IgKCB2YXIgcHJvcCBpbiBzdHlsZSApIHtcbiAgICBjbGVhblN0eWxlWyBwcm9wIF0gPSAnJztcbiAgfVxuICB0aGlzLmNzcyggY2xlYW5TdHlsZSApO1xufTtcblxudmFyIGNsZWFuVHJhbnNpdGlvblN0eWxlID0ge1xuICB0cmFuc2l0aW9uUHJvcGVydHk6ICcnLFxuICB0cmFuc2l0aW9uRHVyYXRpb246ICcnXG59O1xuXG5wcm90by5yZW1vdmVUcmFuc2l0aW9uU3R5bGVzID0gZnVuY3Rpb24oKSB7XG4gIC8vIHJlbW92ZSB0cmFuc2l0aW9uXG4gIHRoaXMuY3NzKCBjbGVhblRyYW5zaXRpb25TdHlsZSApO1xufTtcblxuLy8gLS0tLS0gc2hvdy9oaWRlL3JlbW92ZSAtLS0tLSAvL1xuXG4vLyByZW1vdmUgZWxlbWVudCBmcm9tIERPTVxucHJvdG8ucmVtb3ZlRWxlbSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggdGhpcy5lbGVtZW50ICk7XG4gIC8vIHJlbW92ZSBkaXNwbGF5OiBub25lXG4gIHRoaXMuY3NzKHsgZGlzcGxheTogJycgfSk7XG4gIHRoaXMuZW1pdEV2ZW50KCAncmVtb3ZlJywgWyB0aGlzIF0gKTtcbn07XG5cbnByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBqdXN0IHJlbW92ZSBlbGVtZW50IGlmIG5vIHRyYW5zaXRpb24gc3VwcG9ydCBvciBubyB0cmFuc2l0aW9uXG4gIGlmICggIXRyYW5zaXRpb25Qcm9wZXJ0eSB8fCAhcGFyc2VGbG9hdCggdGhpcy5sYXlvdXQub3B0aW9ucy50cmFuc2l0aW9uRHVyYXRpb24gKSApIHtcbiAgICB0aGlzLnJlbW92ZUVsZW0oKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBzdGFydCB0cmFuc2l0aW9uXG4gIHRoaXMub25jZSggJ3RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlbW92ZUVsZW0oKTtcbiAgfSk7XG4gIHRoaXMuaGlkZSgpO1xufTtcblxucHJvdG8ucmV2ZWFsID0gZnVuY3Rpb24oKSB7XG4gIGRlbGV0ZSB0aGlzLmlzSGlkZGVuO1xuICAvLyByZW1vdmUgZGlzcGxheTogbm9uZVxuICB0aGlzLmNzcyh7IGRpc3BsYXk6ICcnIH0pO1xuXG4gIHZhciBvcHRpb25zID0gdGhpcy5sYXlvdXQub3B0aW9ucztcblxuICB2YXIgb25UcmFuc2l0aW9uRW5kID0ge307XG4gIHZhciB0cmFuc2l0aW9uRW5kUHJvcGVydHkgPSB0aGlzLmdldEhpZGVSZXZlYWxUcmFuc2l0aW9uRW5kUHJvcGVydHkoJ3Zpc2libGVTdHlsZScpO1xuICBvblRyYW5zaXRpb25FbmRbIHRyYW5zaXRpb25FbmRQcm9wZXJ0eSBdID0gdGhpcy5vblJldmVhbFRyYW5zaXRpb25FbmQ7XG5cbiAgdGhpcy50cmFuc2l0aW9uKHtcbiAgICBmcm9tOiBvcHRpb25zLmhpZGRlblN0eWxlLFxuICAgIHRvOiBvcHRpb25zLnZpc2libGVTdHlsZSxcbiAgICBpc0NsZWFuaW5nOiB0cnVlLFxuICAgIG9uVHJhbnNpdGlvbkVuZDogb25UcmFuc2l0aW9uRW5kXG4gIH0pO1xufTtcblxucHJvdG8ub25SZXZlYWxUcmFuc2l0aW9uRW5kID0gZnVuY3Rpb24oKSB7XG4gIC8vIGNoZWNrIGlmIHN0aWxsIHZpc2libGVcbiAgLy8gZHVyaW5nIHRyYW5zaXRpb24sIGl0ZW0gbWF5IGhhdmUgYmVlbiBoaWRkZW5cbiAgaWYgKCAhdGhpcy5pc0hpZGRlbiApIHtcbiAgICB0aGlzLmVtaXRFdmVudCgncmV2ZWFsJyk7XG4gIH1cbn07XG5cbi8qKlxuICogZ2V0IHN0eWxlIHByb3BlcnR5IHVzZSBmb3IgaGlkZS9yZXZlYWwgdHJhbnNpdGlvbiBlbmRcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHlsZVByb3BlcnR5IC0gaGlkZGVuU3R5bGUvdmlzaWJsZVN0eWxlXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5wcm90by5nZXRIaWRlUmV2ZWFsVHJhbnNpdGlvbkVuZFByb3BlcnR5ID0gZnVuY3Rpb24oIHN0eWxlUHJvcGVydHkgKSB7XG4gIHZhciBvcHRpb25TdHlsZSA9IHRoaXMubGF5b3V0Lm9wdGlvbnNbIHN0eWxlUHJvcGVydHkgXTtcbiAgLy8gdXNlIG9wYWNpdHlcbiAgaWYgKCBvcHRpb25TdHlsZS5vcGFjaXR5ICkge1xuICAgIHJldHVybiAnb3BhY2l0eSc7XG4gIH1cbiAgLy8gZ2V0IGZpcnN0IHByb3BlcnR5XG4gIGZvciAoIHZhciBwcm9wIGluIG9wdGlvblN0eWxlICkge1xuICAgIHJldHVybiBwcm9wO1xuICB9XG59O1xuXG5wcm90by5oaWRlID0gZnVuY3Rpb24oKSB7XG4gIC8vIHNldCBmbGFnXG4gIHRoaXMuaXNIaWRkZW4gPSB0cnVlO1xuICAvLyByZW1vdmUgZGlzcGxheTogbm9uZVxuICB0aGlzLmNzcyh7IGRpc3BsYXk6ICcnIH0pO1xuXG4gIHZhciBvcHRpb25zID0gdGhpcy5sYXlvdXQub3B0aW9ucztcblxuICB2YXIgb25UcmFuc2l0aW9uRW5kID0ge307XG4gIHZhciB0cmFuc2l0aW9uRW5kUHJvcGVydHkgPSB0aGlzLmdldEhpZGVSZXZlYWxUcmFuc2l0aW9uRW5kUHJvcGVydHkoJ2hpZGRlblN0eWxlJyk7XG4gIG9uVHJhbnNpdGlvbkVuZFsgdHJhbnNpdGlvbkVuZFByb3BlcnR5IF0gPSB0aGlzLm9uSGlkZVRyYW5zaXRpb25FbmQ7XG5cbiAgdGhpcy50cmFuc2l0aW9uKHtcbiAgICBmcm9tOiBvcHRpb25zLnZpc2libGVTdHlsZSxcbiAgICB0bzogb3B0aW9ucy5oaWRkZW5TdHlsZSxcbiAgICAvLyBrZWVwIGhpZGRlbiBzdHVmZiBoaWRkZW5cbiAgICBpc0NsZWFuaW5nOiB0cnVlLFxuICAgIG9uVHJhbnNpdGlvbkVuZDogb25UcmFuc2l0aW9uRW5kXG4gIH0pO1xufTtcblxucHJvdG8ub25IaWRlVHJhbnNpdGlvbkVuZCA9IGZ1bmN0aW9uKCkge1xuICAvLyBjaGVjayBpZiBzdGlsbCBoaWRkZW5cbiAgLy8gZHVyaW5nIHRyYW5zaXRpb24sIGl0ZW0gbWF5IGhhdmUgYmVlbiB1bi1oaWRkZW5cbiAgaWYgKCB0aGlzLmlzSGlkZGVuICkge1xuICAgIHRoaXMuY3NzKHsgZGlzcGxheTogJ25vbmUnIH0pO1xuICAgIHRoaXMuZW1pdEV2ZW50KCdoaWRlJyk7XG4gIH1cbn07XG5cbnByb3RvLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jc3Moe1xuICAgIHBvc2l0aW9uOiAnJyxcbiAgICBsZWZ0OiAnJyxcbiAgICByaWdodDogJycsXG4gICAgdG9wOiAnJyxcbiAgICBib3R0b206ICcnLFxuICAgIHRyYW5zaXRpb246ICcnLFxuICAgIHRyYW5zZm9ybTogJydcbiAgfSk7XG59O1xuXG5yZXR1cm4gSXRlbTtcblxufSkpO1xuXG4vKiFcbiAqIE91dGxheWVyIHYyLjAuMFxuICogdGhlIGJyYWlucyBhbmQgZ3V0cyBvZiBhIGxheW91dCBsaWJyYXJ5XG4gKiBNSVQgbGljZW5zZVxuICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cbiAgLyoganNoaW50IHN0cmljdDogZmFsc2UgKi8gLyogZ2xvYmFscyBkZWZpbmUsIG1vZHVsZSwgcmVxdWlyZSAqL1xuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRCAtIFJlcXVpcmVKU1xuICAgIGRlZmluZSggJ291dGxheWVyL291dGxheWVyJyxbXG4gICAgICAgICdldi1lbWl0dGVyL2V2LWVtaXR0ZXInLFxuICAgICAgICAnZ2V0LXNpemUvZ2V0LXNpemUnLFxuICAgICAgICAnZml6enktdWktdXRpbHMvdXRpbHMnLFxuICAgICAgICAnLi9pdGVtJ1xuICAgICAgXSxcbiAgICAgIGZ1bmN0aW9uKCBFdkVtaXR0ZXIsIGdldFNpemUsIHV0aWxzLCBJdGVtICkge1xuICAgICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBFdkVtaXR0ZXIsIGdldFNpemUsIHV0aWxzLCBJdGVtKTtcbiAgICAgIH1cbiAgICApO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzICkge1xuICAgIC8vIENvbW1vbkpTIC0gQnJvd3NlcmlmeSwgV2VicGFja1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2V2LWVtaXR0ZXInKSxcbiAgICAgIHJlcXVpcmUoJ2dldC1zaXplJyksXG4gICAgICByZXF1aXJlKCdmaXp6eS11aS11dGlscycpLFxuICAgICAgcmVxdWlyZSgnLi9pdGVtJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93Lk91dGxheWVyID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5FdkVtaXR0ZXIsXG4gICAgICB3aW5kb3cuZ2V0U2l6ZSxcbiAgICAgIHdpbmRvdy5maXp6eVVJVXRpbHMsXG4gICAgICB3aW5kb3cuT3V0bGF5ZXIuSXRlbVxuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIEV2RW1pdHRlciwgZ2V0U2l6ZSwgdXRpbHMsIEl0ZW0gKSB7XG4ndXNlIHN0cmljdCc7XG5cbi8vIC0tLS0tIHZhcnMgLS0tLS0gLy9cblxudmFyIGNvbnNvbGUgPSB3aW5kb3cuY29uc29sZTtcbnZhciBqUXVlcnkgPSB3aW5kb3cualF1ZXJ5O1xudmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBPdXRsYXllciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyBnbG9iYWxseSB1bmlxdWUgaWRlbnRpZmllcnNcbnZhciBHVUlEID0gMDtcbi8vIGludGVybmFsIHN0b3JlIG9mIGFsbCBPdXRsYXllciBpbnRhbmNlc1xudmFyIGluc3RhbmNlcyA9IHt9O1xuXG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50LCBTdHJpbmd9IGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gT3V0bGF5ZXIoIGVsZW1lbnQsIG9wdGlvbnMgKSB7XG4gIHZhciBxdWVyeUVsZW1lbnQgPSB1dGlscy5nZXRRdWVyeUVsZW1lbnQoIGVsZW1lbnQgKTtcbiAgaWYgKCAhcXVlcnlFbGVtZW50ICkge1xuICAgIGlmICggY29uc29sZSApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoICdCYWQgZWxlbWVudCBmb3IgJyArIHRoaXMuY29uc3RydWN0b3IubmFtZXNwYWNlICtcbiAgICAgICAgJzogJyArICggcXVlcnlFbGVtZW50IHx8IGVsZW1lbnQgKSApO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5lbGVtZW50ID0gcXVlcnlFbGVtZW50O1xuICAvLyBhZGQgalF1ZXJ5XG4gIGlmICggalF1ZXJ5ICkge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBqUXVlcnkoIHRoaXMuZWxlbWVudCApO1xuICB9XG5cbiAgLy8gb3B0aW9uc1xuICB0aGlzLm9wdGlvbnMgPSB1dGlscy5leHRlbmQoIHt9LCB0aGlzLmNvbnN0cnVjdG9yLmRlZmF1bHRzICk7XG4gIHRoaXMub3B0aW9uKCBvcHRpb25zICk7XG5cbiAgLy8gYWRkIGlkIGZvciBPdXRsYXllci5nZXRGcm9tRWxlbWVudFxuICB2YXIgaWQgPSArK0dVSUQ7XG4gIHRoaXMuZWxlbWVudC5vdXRsYXllckdVSUQgPSBpZDsgLy8gZXhwYW5kb1xuICBpbnN0YW5jZXNbIGlkIF0gPSB0aGlzOyAvLyBhc3NvY2lhdGUgdmlhIGlkXG5cbiAgLy8ga2ljayBpdCBvZmZcbiAgdGhpcy5fY3JlYXRlKCk7XG5cbiAgdmFyIGlzSW5pdExheW91dCA9IHRoaXMuX2dldE9wdGlvbignaW5pdExheW91dCcpO1xuICBpZiAoIGlzSW5pdExheW91dCApIHtcbiAgICB0aGlzLmxheW91dCgpO1xuICB9XG59XG5cbi8vIHNldHRpbmdzIGFyZSBmb3IgaW50ZXJuYWwgdXNlIG9ubHlcbk91dGxheWVyLm5hbWVzcGFjZSA9ICdvdXRsYXllcic7XG5PdXRsYXllci5JdGVtID0gSXRlbTtcblxuLy8gZGVmYXVsdCBvcHRpb25zXG5PdXRsYXllci5kZWZhdWx0cyA9IHtcbiAgY29udGFpbmVyU3R5bGU6IHtcbiAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJ1xuICB9LFxuICBpbml0TGF5b3V0OiB0cnVlLFxuICBvcmlnaW5MZWZ0OiB0cnVlLFxuICBvcmlnaW5Ub3A6IHRydWUsXG4gIHJlc2l6ZTogdHJ1ZSxcbiAgcmVzaXplQ29udGFpbmVyOiB0cnVlLFxuICAvLyBpdGVtIG9wdGlvbnNcbiAgdHJhbnNpdGlvbkR1cmF0aW9uOiAnMC40cycsXG4gIGhpZGRlblN0eWxlOiB7XG4gICAgb3BhY2l0eTogMCxcbiAgICB0cmFuc2Zvcm06ICdzY2FsZSgwLjAwMSknXG4gIH0sXG4gIHZpc2libGVTdHlsZToge1xuICAgIG9wYWNpdHk6IDEsXG4gICAgdHJhbnNmb3JtOiAnc2NhbGUoMSknXG4gIH1cbn07XG5cbnZhciBwcm90byA9IE91dGxheWVyLnByb3RvdHlwZTtcbi8vIGluaGVyaXQgRXZFbWl0dGVyXG51dGlscy5leHRlbmQoIHByb3RvLCBFdkVtaXR0ZXIucHJvdG90eXBlICk7XG5cbi8qKlxuICogc2V0IG9wdGlvbnNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gKi9cbnByb3RvLm9wdGlvbiA9IGZ1bmN0aW9uKCBvcHRzICkge1xuICB1dGlscy5leHRlbmQoIHRoaXMub3B0aW9ucywgb3B0cyApO1xufTtcblxuLyoqXG4gKiBnZXQgYmFja3dhcmRzIGNvbXBhdGlibGUgb3B0aW9uIHZhbHVlLCBjaGVjayBvbGQgbmFtZVxuICovXG5wcm90by5fZ2V0T3B0aW9uID0gZnVuY3Rpb24oIG9wdGlvbiApIHtcbiAgdmFyIG9sZE9wdGlvbiA9IHRoaXMuY29uc3RydWN0b3IuY29tcGF0T3B0aW9uc1sgb3B0aW9uIF07XG4gIHJldHVybiBvbGRPcHRpb24gJiYgdGhpcy5vcHRpb25zWyBvbGRPcHRpb24gXSAhPT0gdW5kZWZpbmVkID9cbiAgICB0aGlzLm9wdGlvbnNbIG9sZE9wdGlvbiBdIDogdGhpcy5vcHRpb25zWyBvcHRpb24gXTtcbn07XG5cbk91dGxheWVyLmNvbXBhdE9wdGlvbnMgPSB7XG4gIC8vIGN1cnJlbnROYW1lOiBvbGROYW1lXG4gIGluaXRMYXlvdXQ6ICdpc0luaXRMYXlvdXQnLFxuICBob3Jpem9udGFsOiAnaXNIb3Jpem9udGFsJyxcbiAgbGF5b3V0SW5zdGFudDogJ2lzTGF5b3V0SW5zdGFudCcsXG4gIG9yaWdpbkxlZnQ6ICdpc09yaWdpbkxlZnQnLFxuICBvcmlnaW5Ub3A6ICdpc09yaWdpblRvcCcsXG4gIHJlc2l6ZTogJ2lzUmVzaXplQm91bmQnLFxuICByZXNpemVDb250YWluZXI6ICdpc1Jlc2l6aW5nQ29udGFpbmVyJ1xufTtcblxucHJvdG8uX2NyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBnZXQgaXRlbXMgZnJvbSBjaGlsZHJlblxuICB0aGlzLnJlbG9hZEl0ZW1zKCk7XG4gIC8vIGVsZW1lbnRzIHRoYXQgYWZmZWN0IGxheW91dCwgYnV0IGFyZSBub3QgbGFpZCBvdXRcbiAgdGhpcy5zdGFtcHMgPSBbXTtcbiAgdGhpcy5zdGFtcCggdGhpcy5vcHRpb25zLnN0YW1wICk7XG4gIC8vIHNldCBjb250YWluZXIgc3R5bGVcbiAgdXRpbHMuZXh0ZW5kKCB0aGlzLmVsZW1lbnQuc3R5bGUsIHRoaXMub3B0aW9ucy5jb250YWluZXJTdHlsZSApO1xuXG4gIC8vIGJpbmQgcmVzaXplIG1ldGhvZFxuICB2YXIgY2FuQmluZFJlc2l6ZSA9IHRoaXMuX2dldE9wdGlvbigncmVzaXplJyk7XG4gIGlmICggY2FuQmluZFJlc2l6ZSApIHtcbiAgICB0aGlzLmJpbmRSZXNpemUoKTtcbiAgfVxufTtcblxuLy8gZ29lcyB0aHJvdWdoIGFsbCBjaGlsZHJlbiBhZ2FpbiBhbmQgZ2V0cyBicmlja3MgaW4gcHJvcGVyIG9yZGVyXG5wcm90by5yZWxvYWRJdGVtcyA9IGZ1bmN0aW9uKCkge1xuICAvLyBjb2xsZWN0aW9uIG9mIGl0ZW0gZWxlbWVudHNcbiAgdGhpcy5pdGVtcyA9IHRoaXMuX2l0ZW1pemUoIHRoaXMuZWxlbWVudC5jaGlsZHJlbiApO1xufTtcblxuXG4vKipcbiAqIHR1cm4gZWxlbWVudHMgaW50byBPdXRsYXllci5JdGVtcyB0byBiZSB1c2VkIGluIGxheW91dFxuICogQHBhcmFtIHtBcnJheSBvciBOb2RlTGlzdCBvciBIVE1MRWxlbWVudH0gZWxlbXNcbiAqIEByZXR1cm5zIHtBcnJheX0gaXRlbXMgLSBjb2xsZWN0aW9uIG9mIG5ldyBPdXRsYXllciBJdGVtc1xuICovXG5wcm90by5faXRlbWl6ZSA9IGZ1bmN0aW9uKCBlbGVtcyApIHtcblxuICB2YXIgaXRlbUVsZW1zID0gdGhpcy5fZmlsdGVyRmluZEl0ZW1FbGVtZW50cyggZWxlbXMgKTtcbiAgdmFyIEl0ZW0gPSB0aGlzLmNvbnN0cnVjdG9yLkl0ZW07XG5cbiAgLy8gY3JlYXRlIG5ldyBPdXRsYXllciBJdGVtcyBmb3IgY29sbGVjdGlvblxuICB2YXIgaXRlbXMgPSBbXTtcbiAgZm9yICggdmFyIGk9MDsgaSA8IGl0ZW1FbGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICB2YXIgZWxlbSA9IGl0ZW1FbGVtc1tpXTtcbiAgICB2YXIgaXRlbSA9IG5ldyBJdGVtKCBlbGVtLCB0aGlzICk7XG4gICAgaXRlbXMucHVzaCggaXRlbSApO1xuICB9XG5cbiAgcmV0dXJuIGl0ZW1zO1xufTtcblxuLyoqXG4gKiBnZXQgaXRlbSBlbGVtZW50cyB0byBiZSB1c2VkIGluIGxheW91dFxuICogQHBhcmFtIHtBcnJheSBvciBOb2RlTGlzdCBvciBIVE1MRWxlbWVudH0gZWxlbXNcbiAqIEByZXR1cm5zIHtBcnJheX0gaXRlbXMgLSBpdGVtIGVsZW1lbnRzXG4gKi9cbnByb3RvLl9maWx0ZXJGaW5kSXRlbUVsZW1lbnRzID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICByZXR1cm4gdXRpbHMuZmlsdGVyRmluZEVsZW1lbnRzKCBlbGVtcywgdGhpcy5vcHRpb25zLml0ZW1TZWxlY3RvciApO1xufTtcblxuLyoqXG4gKiBnZXR0ZXIgbWV0aG9kIGZvciBnZXR0aW5nIGl0ZW0gZWxlbWVudHNcbiAqIEByZXR1cm5zIHtBcnJheX0gZWxlbXMgLSBjb2xsZWN0aW9uIG9mIGl0ZW0gZWxlbWVudHNcbiAqL1xucHJvdG8uZ2V0SXRlbUVsZW1lbnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLml0ZW1zLm1hcCggZnVuY3Rpb24oIGl0ZW0gKSB7XG4gICAgcmV0dXJuIGl0ZW0uZWxlbWVudDtcbiAgfSk7XG59O1xuXG4vLyAtLS0tLSBpbml0ICYgbGF5b3V0IC0tLS0tIC8vXG5cbi8qKlxuICogbGF5cyBvdXQgYWxsIGl0ZW1zXG4gKi9cbnByb3RvLmxheW91dCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9yZXNldExheW91dCgpO1xuICB0aGlzLl9tYW5hZ2VTdGFtcHMoKTtcblxuICAvLyBkb24ndCBhbmltYXRlIGZpcnN0IGxheW91dFxuICB2YXIgbGF5b3V0SW5zdGFudCA9IHRoaXMuX2dldE9wdGlvbignbGF5b3V0SW5zdGFudCcpO1xuICB2YXIgaXNJbnN0YW50ID0gbGF5b3V0SW5zdGFudCAhPT0gdW5kZWZpbmVkID9cbiAgICBsYXlvdXRJbnN0YW50IDogIXRoaXMuX2lzTGF5b3V0SW5pdGVkO1xuICB0aGlzLmxheW91dEl0ZW1zKCB0aGlzLml0ZW1zLCBpc0luc3RhbnQgKTtcblxuICAvLyBmbGFnIGZvciBpbml0YWxpemVkXG4gIHRoaXMuX2lzTGF5b3V0SW5pdGVkID0gdHJ1ZTtcbn07XG5cbi8vIF9pbml0IGlzIGFsaWFzIGZvciBsYXlvdXRcbnByb3RvLl9pbml0ID0gcHJvdG8ubGF5b3V0O1xuXG4vKipcbiAqIGxvZ2ljIGJlZm9yZSBhbnkgbmV3IGxheW91dFxuICovXG5wcm90by5fcmVzZXRMYXlvdXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5nZXRTaXplKCk7XG59O1xuXG5cbnByb3RvLmdldFNpemUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zaXplID0gZ2V0U2l6ZSggdGhpcy5lbGVtZW50ICk7XG59O1xuXG4vKipcbiAqIGdldCBtZWFzdXJlbWVudCBmcm9tIG9wdGlvbiwgZm9yIGNvbHVtbldpZHRoLCByb3dIZWlnaHQsIGd1dHRlclxuICogaWYgb3B0aW9uIGlzIFN0cmluZyAtPiBnZXQgZWxlbWVudCBmcm9tIHNlbGVjdG9yIHN0cmluZywgJiBnZXQgc2l6ZSBvZiBlbGVtZW50XG4gKiBpZiBvcHRpb24gaXMgRWxlbWVudCAtPiBnZXQgc2l6ZSBvZiBlbGVtZW50XG4gKiBlbHNlIHVzZSBvcHRpb24gYXMgYSBudW1iZXJcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbWVhc3VyZW1lbnRcbiAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gd2lkdGggb3IgaGVpZ2h0XG4gKiBAcHJpdmF0ZVxuICovXG5wcm90by5fZ2V0TWVhc3VyZW1lbnQgPSBmdW5jdGlvbiggbWVhc3VyZW1lbnQsIHNpemUgKSB7XG4gIHZhciBvcHRpb24gPSB0aGlzLm9wdGlvbnNbIG1lYXN1cmVtZW50IF07XG4gIHZhciBlbGVtO1xuICBpZiAoICFvcHRpb24gKSB7XG4gICAgLy8gZGVmYXVsdCB0byAwXG4gICAgdGhpc1sgbWVhc3VyZW1lbnQgXSA9IDA7XG4gIH0gZWxzZSB7XG4gICAgLy8gdXNlIG9wdGlvbiBhcyBhbiBlbGVtZW50XG4gICAgaWYgKCB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnICkge1xuICAgICAgZWxlbSA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCBvcHRpb24gKTtcbiAgICB9IGVsc2UgaWYgKCBvcHRpb24gaW5zdGFuY2VvZiBIVE1MRWxlbWVudCApIHtcbiAgICAgIGVsZW0gPSBvcHRpb247XG4gICAgfVxuICAgIC8vIHVzZSBzaXplIG9mIGVsZW1lbnQsIGlmIGVsZW1lbnRcbiAgICB0aGlzWyBtZWFzdXJlbWVudCBdID0gZWxlbSA/IGdldFNpemUoIGVsZW0gKVsgc2l6ZSBdIDogb3B0aW9uO1xuICB9XG59O1xuXG4vKipcbiAqIGxheW91dCBhIGNvbGxlY3Rpb24gb2YgaXRlbSBlbGVtZW50c1xuICogQGFwaSBwdWJsaWNcbiAqL1xucHJvdG8ubGF5b3V0SXRlbXMgPSBmdW5jdGlvbiggaXRlbXMsIGlzSW5zdGFudCApIHtcbiAgaXRlbXMgPSB0aGlzLl9nZXRJdGVtc0ZvckxheW91dCggaXRlbXMgKTtcblxuICB0aGlzLl9sYXlvdXRJdGVtcyggaXRlbXMsIGlzSW5zdGFudCApO1xuXG4gIHRoaXMuX3Bvc3RMYXlvdXQoKTtcbn07XG5cbi8qKlxuICogZ2V0IHRoZSBpdGVtcyB0byBiZSBsYWlkIG91dFxuICogeW91IG1heSB3YW50IHRvIHNraXAgb3ZlciBzb21lIGl0ZW1zXG4gKiBAcGFyYW0ge0FycmF5fSBpdGVtc1xuICogQHJldHVybnMge0FycmF5fSBpdGVtc1xuICovXG5wcm90by5fZ2V0SXRlbXNGb3JMYXlvdXQgPSBmdW5jdGlvbiggaXRlbXMgKSB7XG4gIHJldHVybiBpdGVtcy5maWx0ZXIoIGZ1bmN0aW9uKCBpdGVtICkge1xuICAgIHJldHVybiAhaXRlbS5pc0lnbm9yZWQ7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBsYXlvdXQgaXRlbXNcbiAqIEBwYXJhbSB7QXJyYXl9IGl0ZW1zXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzSW5zdGFudFxuICovXG5wcm90by5fbGF5b3V0SXRlbXMgPSBmdW5jdGlvbiggaXRlbXMsIGlzSW5zdGFudCApIHtcbiAgdGhpcy5fZW1pdENvbXBsZXRlT25JdGVtcyggJ2xheW91dCcsIGl0ZW1zICk7XG5cbiAgaWYgKCAhaXRlbXMgfHwgIWl0ZW1zLmxlbmd0aCApIHtcbiAgICAvLyBubyBpdGVtcywgZW1pdCBldmVudCB3aXRoIGVtcHR5IGFycmF5XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHF1ZXVlID0gW107XG5cbiAgaXRlbXMuZm9yRWFjaCggZnVuY3Rpb24oIGl0ZW0gKSB7XG4gICAgLy8gZ2V0IHgveSBvYmplY3QgZnJvbSBtZXRob2RcbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLl9nZXRJdGVtTGF5b3V0UG9zaXRpb24oIGl0ZW0gKTtcbiAgICAvLyBlbnF1ZXVlXG4gICAgcG9zaXRpb24uaXRlbSA9IGl0ZW07XG4gICAgcG9zaXRpb24uaXNJbnN0YW50ID0gaXNJbnN0YW50IHx8IGl0ZW0uaXNMYXlvdXRJbnN0YW50O1xuICAgIHF1ZXVlLnB1c2goIHBvc2l0aW9uICk7XG4gIH0sIHRoaXMgKTtcblxuICB0aGlzLl9wcm9jZXNzTGF5b3V0UXVldWUoIHF1ZXVlICk7XG59O1xuXG4vKipcbiAqIGdldCBpdGVtIGxheW91dCBwb3NpdGlvblxuICogQHBhcmFtIHtPdXRsYXllci5JdGVtfSBpdGVtXG4gKiBAcmV0dXJucyB7T2JqZWN0fSB4IGFuZCB5IHBvc2l0aW9uXG4gKi9cbnByb3RvLl9nZXRJdGVtTGF5b3V0UG9zaXRpb24gPSBmdW5jdGlvbiggLyogaXRlbSAqLyApIHtcbiAgcmV0dXJuIHtcbiAgICB4OiAwLFxuICAgIHk6IDBcbiAgfTtcbn07XG5cbi8qKlxuICogaXRlcmF0ZSBvdmVyIGFycmF5IGFuZCBwb3NpdGlvbiBlYWNoIGl0ZW1cbiAqIFJlYXNvbiBiZWluZyAtIHNlcGFyYXRpbmcgdGhpcyBsb2dpYyBwcmV2ZW50cyAnbGF5b3V0IGludmFsaWRhdGlvbidcbiAqIHRoeCBAcGF1bF9pcmlzaFxuICogQHBhcmFtIHtBcnJheX0gcXVldWVcbiAqL1xucHJvdG8uX3Byb2Nlc3NMYXlvdXRRdWV1ZSA9IGZ1bmN0aW9uKCBxdWV1ZSApIHtcbiAgcXVldWUuZm9yRWFjaCggZnVuY3Rpb24oIG9iaiApIHtcbiAgICB0aGlzLl9wb3NpdGlvbkl0ZW0oIG9iai5pdGVtLCBvYmoueCwgb2JqLnksIG9iai5pc0luc3RhbnQgKTtcbiAgfSwgdGhpcyApO1xufTtcblxuLyoqXG4gKiBTZXRzIHBvc2l0aW9uIG9mIGl0ZW0gaW4gRE9NXG4gKiBAcGFyYW0ge091dGxheWVyLkl0ZW19IGl0ZW1cbiAqIEBwYXJhbSB7TnVtYmVyfSB4IC0gaG9yaXpvbnRhbCBwb3NpdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IHkgLSB2ZXJ0aWNhbCBwb3NpdGlvblxuICogQHBhcmFtIHtCb29sZWFufSBpc0luc3RhbnQgLSBkaXNhYmxlcyB0cmFuc2l0aW9uc1xuICovXG5wcm90by5fcG9zaXRpb25JdGVtID0gZnVuY3Rpb24oIGl0ZW0sIHgsIHksIGlzSW5zdGFudCApIHtcbiAgaWYgKCBpc0luc3RhbnQgKSB7XG4gICAgLy8gaWYgbm90IHRyYW5zaXRpb24sIGp1c3Qgc2V0IENTU1xuICAgIGl0ZW0uZ29UbyggeCwgeSApO1xuICB9IGVsc2Uge1xuICAgIGl0ZW0ubW92ZVRvKCB4LCB5ICk7XG4gIH1cbn07XG5cbi8qKlxuICogQW55IGxvZ2ljIHlvdSB3YW50IHRvIGRvIGFmdGVyIGVhY2ggbGF5b3V0LFxuICogaS5lLiBzaXplIHRoZSBjb250YWluZXJcbiAqL1xucHJvdG8uX3Bvc3RMYXlvdXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5yZXNpemVDb250YWluZXIoKTtcbn07XG5cbnByb3RvLnJlc2l6ZUNvbnRhaW5lciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaXNSZXNpemluZ0NvbnRhaW5lciA9IHRoaXMuX2dldE9wdGlvbigncmVzaXplQ29udGFpbmVyJyk7XG4gIGlmICggIWlzUmVzaXppbmdDb250YWluZXIgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBzaXplID0gdGhpcy5fZ2V0Q29udGFpbmVyU2l6ZSgpO1xuICBpZiAoIHNpemUgKSB7XG4gICAgdGhpcy5fc2V0Q29udGFpbmVyTWVhc3VyZSggc2l6ZS53aWR0aCwgdHJ1ZSApO1xuICAgIHRoaXMuX3NldENvbnRhaW5lck1lYXN1cmUoIHNpemUuaGVpZ2h0LCBmYWxzZSApO1xuICB9XG59O1xuXG4vKipcbiAqIFNldHMgd2lkdGggb3IgaGVpZ2h0IG9mIGNvbnRhaW5lciBpZiByZXR1cm5lZFxuICogQHJldHVybnMge09iamVjdH0gc2l6ZVxuICogICBAcGFyYW0ge051bWJlcn0gd2lkdGhcbiAqICAgQHBhcmFtIHtOdW1iZXJ9IGhlaWdodFxuICovXG5wcm90by5fZ2V0Q29udGFpbmVyU2l6ZSA9IG5vb3A7XG5cbi8qKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1lYXN1cmUgLSBzaXplIG9mIHdpZHRoIG9yIGhlaWdodFxuICogQHBhcmFtIHtCb29sZWFufSBpc1dpZHRoXG4gKi9cbnByb3RvLl9zZXRDb250YWluZXJNZWFzdXJlID0gZnVuY3Rpb24oIG1lYXN1cmUsIGlzV2lkdGggKSB7XG4gIGlmICggbWVhc3VyZSA9PT0gdW5kZWZpbmVkICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBlbGVtU2l6ZSA9IHRoaXMuc2l6ZTtcbiAgLy8gYWRkIHBhZGRpbmcgYW5kIGJvcmRlciB3aWR0aCBpZiBib3JkZXIgYm94XG4gIGlmICggZWxlbVNpemUuaXNCb3JkZXJCb3ggKSB7XG4gICAgbWVhc3VyZSArPSBpc1dpZHRoID8gZWxlbVNpemUucGFkZGluZ0xlZnQgKyBlbGVtU2l6ZS5wYWRkaW5nUmlnaHQgK1xuICAgICAgZWxlbVNpemUuYm9yZGVyTGVmdFdpZHRoICsgZWxlbVNpemUuYm9yZGVyUmlnaHRXaWR0aCA6XG4gICAgICBlbGVtU2l6ZS5wYWRkaW5nQm90dG9tICsgZWxlbVNpemUucGFkZGluZ1RvcCArXG4gICAgICBlbGVtU2l6ZS5ib3JkZXJUb3BXaWR0aCArIGVsZW1TaXplLmJvcmRlckJvdHRvbVdpZHRoO1xuICB9XG5cbiAgbWVhc3VyZSA9IE1hdGgubWF4KCBtZWFzdXJlLCAwICk7XG4gIHRoaXMuZWxlbWVudC5zdHlsZVsgaXNXaWR0aCA/ICd3aWR0aCcgOiAnaGVpZ2h0JyBdID0gbWVhc3VyZSArICdweCc7XG59O1xuXG4vKipcbiAqIGVtaXQgZXZlbnRDb21wbGV0ZSBvbiBhIGNvbGxlY3Rpb24gb2YgaXRlbXMgZXZlbnRzXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lXG4gKiBAcGFyYW0ge0FycmF5fSBpdGVtcyAtIE91dGxheWVyLkl0ZW1zXG4gKi9cbnByb3RvLl9lbWl0Q29tcGxldGVPbkl0ZW1zID0gZnVuY3Rpb24oIGV2ZW50TmFtZSwgaXRlbXMgKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIGZ1bmN0aW9uIG9uQ29tcGxldGUoKSB7XG4gICAgX3RoaXMuZGlzcGF0Y2hFdmVudCggZXZlbnROYW1lICsgJ0NvbXBsZXRlJywgbnVsbCwgWyBpdGVtcyBdICk7XG4gIH1cblxuICB2YXIgY291bnQgPSBpdGVtcy5sZW5ndGg7XG4gIGlmICggIWl0ZW1zIHx8ICFjb3VudCApIHtcbiAgICBvbkNvbXBsZXRlKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGRvbmVDb3VudCA9IDA7XG4gIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgZG9uZUNvdW50Kys7XG4gICAgaWYgKCBkb25lQ291bnQgPT0gY291bnQgKSB7XG4gICAgICBvbkNvbXBsZXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gYmluZCBjYWxsYmFja1xuICBpdGVtcy5mb3JFYWNoKCBmdW5jdGlvbiggaXRlbSApIHtcbiAgICBpdGVtLm9uY2UoIGV2ZW50TmFtZSwgdGljayApO1xuICB9KTtcbn07XG5cbi8qKlxuICogZW1pdHMgZXZlbnRzIHZpYSBFdkVtaXR0ZXIgYW5kIGpRdWVyeSBldmVudHNcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIC0gbmFtZSBvZiBldmVudFxuICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSBvcmlnaW5hbCBldmVudFxuICogQHBhcmFtIHtBcnJheX0gYXJncyAtIGV4dHJhIGFyZ3VtZW50c1xuICovXG5wcm90by5kaXNwYXRjaEV2ZW50ID0gZnVuY3Rpb24oIHR5cGUsIGV2ZW50LCBhcmdzICkge1xuICAvLyBhZGQgb3JpZ2luYWwgZXZlbnQgdG8gYXJndW1lbnRzXG4gIHZhciBlbWl0QXJncyA9IGV2ZW50ID8gWyBldmVudCBdLmNvbmNhdCggYXJncyApIDogYXJncztcbiAgdGhpcy5lbWl0RXZlbnQoIHR5cGUsIGVtaXRBcmdzICk7XG5cbiAgaWYgKCBqUXVlcnkgKSB7XG4gICAgLy8gc2V0IHRoaXMuJGVsZW1lbnRcbiAgICB0aGlzLiRlbGVtZW50ID0gdGhpcy4kZWxlbWVudCB8fCBqUXVlcnkoIHRoaXMuZWxlbWVudCApO1xuICAgIGlmICggZXZlbnQgKSB7XG4gICAgICAvLyBjcmVhdGUgalF1ZXJ5IGV2ZW50XG4gICAgICB2YXIgJGV2ZW50ID0galF1ZXJ5LkV2ZW50KCBldmVudCApO1xuICAgICAgJGV2ZW50LnR5cGUgPSB0eXBlO1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCAkZXZlbnQsIGFyZ3MgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8ganVzdCB0cmlnZ2VyIHdpdGggdHlwZSBpZiBubyBldmVudCBhdmFpbGFibGVcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlciggdHlwZSwgYXJncyApO1xuICAgIH1cbiAgfVxufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaWdub3JlICYgc3RhbXBzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cblxuLyoqXG4gKiBrZWVwIGl0ZW0gaW4gY29sbGVjdGlvbiwgYnV0IGRvIG5vdCBsYXkgaXQgb3V0XG4gKiBpZ25vcmVkIGl0ZW1zIGRvIG5vdCBnZXQgc2tpcHBlZCBpbiBsYXlvdXRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbVxuICovXG5wcm90by5pZ25vcmUgPSBmdW5jdGlvbiggZWxlbSApIHtcbiAgdmFyIGl0ZW0gPSB0aGlzLmdldEl0ZW0oIGVsZW0gKTtcbiAgaWYgKCBpdGVtICkge1xuICAgIGl0ZW0uaXNJZ25vcmVkID0gdHJ1ZTtcbiAgfVxufTtcblxuLyoqXG4gKiByZXR1cm4gaXRlbSB0byBsYXlvdXQgY29sbGVjdGlvblxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gKi9cbnByb3RvLnVuaWdub3JlID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIHZhciBpdGVtID0gdGhpcy5nZXRJdGVtKCBlbGVtICk7XG4gIGlmICggaXRlbSApIHtcbiAgICBkZWxldGUgaXRlbS5pc0lnbm9yZWQ7XG4gIH1cbn07XG5cbi8qKlxuICogYWRkcyBlbGVtZW50cyB0byBzdGFtcHNcbiAqIEBwYXJhbSB7Tm9kZUxpc3QsIEFycmF5LCBFbGVtZW50LCBvciBTdHJpbmd9IGVsZW1zXG4gKi9cbnByb3RvLnN0YW1wID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICBlbGVtcyA9IHRoaXMuX2ZpbmQoIGVsZW1zICk7XG4gIGlmICggIWVsZW1zICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuc3RhbXBzID0gdGhpcy5zdGFtcHMuY29uY2F0KCBlbGVtcyApO1xuICAvLyBpZ25vcmVcbiAgZWxlbXMuZm9yRWFjaCggdGhpcy5pZ25vcmUsIHRoaXMgKTtcbn07XG5cbi8qKlxuICogcmVtb3ZlcyBlbGVtZW50cyB0byBzdGFtcHNcbiAqIEBwYXJhbSB7Tm9kZUxpc3QsIEFycmF5LCBvciBFbGVtZW50fSBlbGVtc1xuICovXG5wcm90by51bnN0YW1wID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICBlbGVtcyA9IHRoaXMuX2ZpbmQoIGVsZW1zICk7XG4gIGlmICggIWVsZW1zICl7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZWxlbXMuZm9yRWFjaCggZnVuY3Rpb24oIGVsZW0gKSB7XG4gICAgLy8gZmlsdGVyIG91dCByZW1vdmVkIHN0YW1wIGVsZW1lbnRzXG4gICAgdXRpbHMucmVtb3ZlRnJvbSggdGhpcy5zdGFtcHMsIGVsZW0gKTtcbiAgICB0aGlzLnVuaWdub3JlKCBlbGVtICk7XG4gIH0sIHRoaXMgKTtcbn07XG5cbi8qKlxuICogZmluZHMgY2hpbGQgZWxlbWVudHNcbiAqIEBwYXJhbSB7Tm9kZUxpc3QsIEFycmF5LCBFbGVtZW50LCBvciBTdHJpbmd9IGVsZW1zXG4gKiBAcmV0dXJucyB7QXJyYXl9IGVsZW1zXG4gKi9cbnByb3RvLl9maW5kID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICBpZiAoICFlbGVtcyApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gaWYgc3RyaW5nLCB1c2UgYXJndW1lbnQgYXMgc2VsZWN0b3Igc3RyaW5nXG4gIGlmICggdHlwZW9mIGVsZW1zID09ICdzdHJpbmcnICkge1xuICAgIGVsZW1zID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIGVsZW1zICk7XG4gIH1cbiAgZWxlbXMgPSB1dGlscy5tYWtlQXJyYXkoIGVsZW1zICk7XG4gIHJldHVybiBlbGVtcztcbn07XG5cbnByb3RvLl9tYW5hZ2VTdGFtcHMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCAhdGhpcy5zdGFtcHMgfHwgIXRoaXMuc3RhbXBzLmxlbmd0aCApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLl9nZXRCb3VuZGluZ1JlY3QoKTtcblxuICB0aGlzLnN0YW1wcy5mb3JFYWNoKCB0aGlzLl9tYW5hZ2VTdGFtcCwgdGhpcyApO1xufTtcblxuLy8gdXBkYXRlIGJvdW5kaW5nTGVmdCAvIFRvcFxucHJvdG8uX2dldEJvdW5kaW5nUmVjdCA9IGZ1bmN0aW9uKCkge1xuICAvLyBnZXQgYm91bmRpbmcgcmVjdCBmb3IgY29udGFpbmVyIGVsZW1lbnRcbiAgdmFyIGJvdW5kaW5nUmVjdCA9IHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgdmFyIHNpemUgPSB0aGlzLnNpemU7XG4gIHRoaXMuX2JvdW5kaW5nUmVjdCA9IHtcbiAgICBsZWZ0OiBib3VuZGluZ1JlY3QubGVmdCArIHNpemUucGFkZGluZ0xlZnQgKyBzaXplLmJvcmRlckxlZnRXaWR0aCxcbiAgICB0b3A6IGJvdW5kaW5nUmVjdC50b3AgKyBzaXplLnBhZGRpbmdUb3AgKyBzaXplLmJvcmRlclRvcFdpZHRoLFxuICAgIHJpZ2h0OiBib3VuZGluZ1JlY3QucmlnaHQgLSAoIHNpemUucGFkZGluZ1JpZ2h0ICsgc2l6ZS5ib3JkZXJSaWdodFdpZHRoICksXG4gICAgYm90dG9tOiBib3VuZGluZ1JlY3QuYm90dG9tIC0gKCBzaXplLnBhZGRpbmdCb3R0b20gKyBzaXplLmJvcmRlckJvdHRvbVdpZHRoIClcbiAgfTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBzdGFtcFxuKiovXG5wcm90by5fbWFuYWdlU3RhbXAgPSBub29wO1xuXG4vKipcbiAqIGdldCB4L3kgcG9zaXRpb24gb2YgZWxlbWVudCByZWxhdGl2ZSB0byBjb250YWluZXIgZWxlbWVudFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBvZmZzZXQgLSBoYXMgbGVmdCwgdG9wLCByaWdodCwgYm90dG9tXG4gKi9cbnByb3RvLl9nZXRFbGVtZW50T2Zmc2V0ID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIHZhciBib3VuZGluZ1JlY3QgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB2YXIgdGhpc1JlY3QgPSB0aGlzLl9ib3VuZGluZ1JlY3Q7XG4gIHZhciBzaXplID0gZ2V0U2l6ZSggZWxlbSApO1xuICB2YXIgb2Zmc2V0ID0ge1xuICAgIGxlZnQ6IGJvdW5kaW5nUmVjdC5sZWZ0IC0gdGhpc1JlY3QubGVmdCAtIHNpemUubWFyZ2luTGVmdCxcbiAgICB0b3A6IGJvdW5kaW5nUmVjdC50b3AgLSB0aGlzUmVjdC50b3AgLSBzaXplLm1hcmdpblRvcCxcbiAgICByaWdodDogdGhpc1JlY3QucmlnaHQgLSBib3VuZGluZ1JlY3QucmlnaHQgLSBzaXplLm1hcmdpblJpZ2h0LFxuICAgIGJvdHRvbTogdGhpc1JlY3QuYm90dG9tIC0gYm91bmRpbmdSZWN0LmJvdHRvbSAtIHNpemUubWFyZ2luQm90dG9tXG4gIH07XG4gIHJldHVybiBvZmZzZXQ7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSByZXNpemUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLy8gZW5hYmxlIGV2ZW50IGhhbmRsZXJzIGZvciBsaXN0ZW5lcnNcbi8vIGkuZS4gcmVzaXplIC0+IG9ucmVzaXplXG5wcm90by5oYW5kbGVFdmVudCA9IHV0aWxzLmhhbmRsZUV2ZW50O1xuXG4vKipcbiAqIEJpbmQgbGF5b3V0IHRvIHdpbmRvdyByZXNpemluZ1xuICovXG5wcm90by5iaW5kUmVzaXplID0gZnVuY3Rpb24oKSB7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAncmVzaXplJywgdGhpcyApO1xuICB0aGlzLmlzUmVzaXplQm91bmQgPSB0cnVlO1xufTtcblxuLyoqXG4gKiBVbmJpbmQgbGF5b3V0IHRvIHdpbmRvdyByZXNpemluZ1xuICovXG5wcm90by51bmJpbmRSZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdyZXNpemUnLCB0aGlzICk7XG4gIHRoaXMuaXNSZXNpemVCb3VuZCA9IGZhbHNlO1xufTtcblxucHJvdG8ub25yZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5yZXNpemUoKTtcbn07XG5cbnV0aWxzLmRlYm91bmNlTWV0aG9kKCBPdXRsYXllciwgJ29ucmVzaXplJywgMTAwICk7XG5cbnByb3RvLnJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBkb24ndCB0cmlnZ2VyIGlmIHNpemUgZGlkIG5vdCBjaGFuZ2VcbiAgLy8gb3IgaWYgcmVzaXplIHdhcyB1bmJvdW5kLiBTZWUgIzlcbiAgaWYgKCAhdGhpcy5pc1Jlc2l6ZUJvdW5kIHx8ICF0aGlzLm5lZWRzUmVzaXplTGF5b3V0KCkgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5sYXlvdXQoKTtcbn07XG5cbi8qKlxuICogY2hlY2sgaWYgbGF5b3V0IGlzIG5lZWRlZCBwb3N0IGxheW91dFxuICogQHJldHVybnMgQm9vbGVhblxuICovXG5wcm90by5uZWVkc1Jlc2l6ZUxheW91dCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2l6ZSA9IGdldFNpemUoIHRoaXMuZWxlbWVudCApO1xuICAvLyBjaGVjayB0aGF0IHRoaXMuc2l6ZSBhbmQgc2l6ZSBhcmUgdGhlcmVcbiAgLy8gSUU4IHRyaWdnZXJzIHJlc2l6ZSBvbiBib2R5IHNpemUgY2hhbmdlLCBzbyB0aGV5IG1pZ2h0IG5vdCBiZVxuICB2YXIgaGFzU2l6ZXMgPSB0aGlzLnNpemUgJiYgc2l6ZTtcbiAgcmV0dXJuIGhhc1NpemVzICYmIHNpemUuaW5uZXJXaWR0aCAhPT0gdGhpcy5zaXplLmlubmVyV2lkdGg7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtZXRob2RzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8qKlxuICogYWRkIGl0ZW1zIHRvIE91dGxheWVyIGluc3RhbmNlXG4gKiBAcGFyYW0ge0FycmF5IG9yIE5vZGVMaXN0IG9yIEVsZW1lbnR9IGVsZW1zXG4gKiBAcmV0dXJucyB7QXJyYXl9IGl0ZW1zIC0gT3V0bGF5ZXIuSXRlbXNcbioqL1xucHJvdG8uYWRkSXRlbXMgPSBmdW5jdGlvbiggZWxlbXMgKSB7XG4gIHZhciBpdGVtcyA9IHRoaXMuX2l0ZW1pemUoIGVsZW1zICk7XG4gIC8vIGFkZCBpdGVtcyB0byBjb2xsZWN0aW9uXG4gIGlmICggaXRlbXMubGVuZ3RoICkge1xuICAgIHRoaXMuaXRlbXMgPSB0aGlzLml0ZW1zLmNvbmNhdCggaXRlbXMgKTtcbiAgfVxuICByZXR1cm4gaXRlbXM7XG59O1xuXG4vKipcbiAqIExheW91dCBuZXdseS1hcHBlbmRlZCBpdGVtIGVsZW1lbnRzXG4gKiBAcGFyYW0ge0FycmF5IG9yIE5vZGVMaXN0IG9yIEVsZW1lbnR9IGVsZW1zXG4gKi9cbnByb3RvLmFwcGVuZGVkID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICB2YXIgaXRlbXMgPSB0aGlzLmFkZEl0ZW1zKCBlbGVtcyApO1xuICBpZiAoICFpdGVtcy5sZW5ndGggKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIGxheW91dCBhbmQgcmV2ZWFsIGp1c3QgdGhlIG5ldyBpdGVtc1xuICB0aGlzLmxheW91dEl0ZW1zKCBpdGVtcywgdHJ1ZSApO1xuICB0aGlzLnJldmVhbCggaXRlbXMgKTtcbn07XG5cbi8qKlxuICogTGF5b3V0IHByZXBlbmRlZCBlbGVtZW50c1xuICogQHBhcmFtIHtBcnJheSBvciBOb2RlTGlzdCBvciBFbGVtZW50fSBlbGVtc1xuICovXG5wcm90by5wcmVwZW5kZWQgPSBmdW5jdGlvbiggZWxlbXMgKSB7XG4gIHZhciBpdGVtcyA9IHRoaXMuX2l0ZW1pemUoIGVsZW1zICk7XG4gIGlmICggIWl0ZW1zLmxlbmd0aCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gYWRkIGl0ZW1zIHRvIGJlZ2lubmluZyBvZiBjb2xsZWN0aW9uXG4gIHZhciBwcmV2aW91c0l0ZW1zID0gdGhpcy5pdGVtcy5zbGljZSgwKTtcbiAgdGhpcy5pdGVtcyA9IGl0ZW1zLmNvbmNhdCggcHJldmlvdXNJdGVtcyApO1xuICAvLyBzdGFydCBuZXcgbGF5b3V0XG4gIHRoaXMuX3Jlc2V0TGF5b3V0KCk7XG4gIHRoaXMuX21hbmFnZVN0YW1wcygpO1xuICAvLyBsYXlvdXQgbmV3IHN0dWZmIHdpdGhvdXQgdHJhbnNpdGlvblxuICB0aGlzLmxheW91dEl0ZW1zKCBpdGVtcywgdHJ1ZSApO1xuICB0aGlzLnJldmVhbCggaXRlbXMgKTtcbiAgLy8gbGF5b3V0IHByZXZpb3VzIGl0ZW1zXG4gIHRoaXMubGF5b3V0SXRlbXMoIHByZXZpb3VzSXRlbXMgKTtcbn07XG5cbi8qKlxuICogcmV2ZWFsIGEgY29sbGVjdGlvbiBvZiBpdGVtc1xuICogQHBhcmFtIHtBcnJheSBvZiBPdXRsYXllci5JdGVtc30gaXRlbXNcbiAqL1xucHJvdG8ucmV2ZWFsID0gZnVuY3Rpb24oIGl0ZW1zICkge1xuICB0aGlzLl9lbWl0Q29tcGxldGVPbkl0ZW1zKCAncmV2ZWFsJywgaXRlbXMgKTtcbiAgaWYgKCAhaXRlbXMgfHwgIWl0ZW1zLmxlbmd0aCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaXRlbXMuZm9yRWFjaCggZnVuY3Rpb24oIGl0ZW0gKSB7XG4gICAgaXRlbS5yZXZlYWwoKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIGhpZGUgYSBjb2xsZWN0aW9uIG9mIGl0ZW1zXG4gKiBAcGFyYW0ge0FycmF5IG9mIE91dGxheWVyLkl0ZW1zfSBpdGVtc1xuICovXG5wcm90by5oaWRlID0gZnVuY3Rpb24oIGl0ZW1zICkge1xuICB0aGlzLl9lbWl0Q29tcGxldGVPbkl0ZW1zKCAnaGlkZScsIGl0ZW1zICk7XG4gIGlmICggIWl0ZW1zIHx8ICFpdGVtcy5sZW5ndGggKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGl0ZW1zLmZvckVhY2goIGZ1bmN0aW9uKCBpdGVtICkge1xuICAgIGl0ZW0uaGlkZSgpO1xuICB9KTtcbn07XG5cbi8qKlxuICogcmV2ZWFsIGl0ZW0gZWxlbWVudHNcbiAqIEBwYXJhbSB7QXJyYXl9LCB7RWxlbWVudH0sIHtOb2RlTGlzdH0gaXRlbXNcbiAqL1xucHJvdG8ucmV2ZWFsSXRlbUVsZW1lbnRzID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICB2YXIgaXRlbXMgPSB0aGlzLmdldEl0ZW1zKCBlbGVtcyApO1xuICB0aGlzLnJldmVhbCggaXRlbXMgKTtcbn07XG5cbi8qKlxuICogaGlkZSBpdGVtIGVsZW1lbnRzXG4gKiBAcGFyYW0ge0FycmF5fSwge0VsZW1lbnR9LCB7Tm9kZUxpc3R9IGl0ZW1zXG4gKi9cbnByb3RvLmhpZGVJdGVtRWxlbWVudHMgPSBmdW5jdGlvbiggZWxlbXMgKSB7XG4gIHZhciBpdGVtcyA9IHRoaXMuZ2V0SXRlbXMoIGVsZW1zICk7XG4gIHRoaXMuaGlkZSggaXRlbXMgKTtcbn07XG5cbi8qKlxuICogZ2V0IE91dGxheWVyLkl0ZW0sIGdpdmVuIGFuIEVsZW1lbnRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm5zIHtPdXRsYXllci5JdGVtfSBpdGVtXG4gKi9cbnByb3RvLmdldEl0ZW0gPSBmdW5jdGlvbiggZWxlbSApIHtcbiAgLy8gbG9vcCB0aHJvdWdoIGl0ZW1zIHRvIGdldCB0aGUgb25lIHRoYXQgbWF0Y2hlc1xuICBmb3IgKCB2YXIgaT0wOyBpIDwgdGhpcy5pdGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICB2YXIgaXRlbSA9IHRoaXMuaXRlbXNbaV07XG4gICAgaWYgKCBpdGVtLmVsZW1lbnQgPT0gZWxlbSApIHtcbiAgICAgIC8vIHJldHVybiBpdGVtXG4gICAgICByZXR1cm4gaXRlbTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogZ2V0IGNvbGxlY3Rpb24gb2YgT3V0bGF5ZXIuSXRlbXMsIGdpdmVuIEVsZW1lbnRzXG4gKiBAcGFyYW0ge0FycmF5fSBlbGVtc1xuICogQHJldHVybnMge0FycmF5fSBpdGVtcyAtIE91dGxheWVyLkl0ZW1zXG4gKi9cbnByb3RvLmdldEl0ZW1zID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICBlbGVtcyA9IHV0aWxzLm1ha2VBcnJheSggZWxlbXMgKTtcbiAgdmFyIGl0ZW1zID0gW107XG4gIGVsZW1zLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtICkge1xuICAgIHZhciBpdGVtID0gdGhpcy5nZXRJdGVtKCBlbGVtICk7XG4gICAgaWYgKCBpdGVtICkge1xuICAgICAgaXRlbXMucHVzaCggaXRlbSApO1xuICAgIH1cbiAgfSwgdGhpcyApO1xuXG4gIHJldHVybiBpdGVtcztcbn07XG5cbi8qKlxuICogcmVtb3ZlIGVsZW1lbnQocykgZnJvbSBpbnN0YW5jZSBhbmQgRE9NXG4gKiBAcGFyYW0ge0FycmF5IG9yIE5vZGVMaXN0IG9yIEVsZW1lbnR9IGVsZW1zXG4gKi9cbnByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uKCBlbGVtcyApIHtcbiAgdmFyIHJlbW92ZUl0ZW1zID0gdGhpcy5nZXRJdGVtcyggZWxlbXMgKTtcblxuICB0aGlzLl9lbWl0Q29tcGxldGVPbkl0ZW1zKCAncmVtb3ZlJywgcmVtb3ZlSXRlbXMgKTtcblxuICAvLyBiYWlsIGlmIG5vIGl0ZW1zIHRvIHJlbW92ZVxuICBpZiAoICFyZW1vdmVJdGVtcyB8fCAhcmVtb3ZlSXRlbXMubGVuZ3RoICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHJlbW92ZUl0ZW1zLmZvckVhY2goIGZ1bmN0aW9uKCBpdGVtICkge1xuICAgIGl0ZW0ucmVtb3ZlKCk7XG4gICAgLy8gcmVtb3ZlIGl0ZW0gZnJvbSBjb2xsZWN0aW9uXG4gICAgdXRpbHMucmVtb3ZlRnJvbSggdGhpcy5pdGVtcywgaXRlbSApO1xuICB9LCB0aGlzICk7XG59O1xuXG4vLyAtLS0tLSBkZXN0cm95IC0tLS0tIC8vXG5cbi8vIHJlbW92ZSBhbmQgZGlzYWJsZSBPdXRsYXllciBpbnN0YW5jZVxucHJvdG8uZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAvLyBjbGVhbiB1cCBkeW5hbWljIHN0eWxlc1xuICB2YXIgc3R5bGUgPSB0aGlzLmVsZW1lbnQuc3R5bGU7XG4gIHN0eWxlLmhlaWdodCA9ICcnO1xuICBzdHlsZS5wb3NpdGlvbiA9ICcnO1xuICBzdHlsZS53aWR0aCA9ICcnO1xuICAvLyBkZXN0cm95IGl0ZW1zXG4gIHRoaXMuaXRlbXMuZm9yRWFjaCggZnVuY3Rpb24oIGl0ZW0gKSB7XG4gICAgaXRlbS5kZXN0cm95KCk7XG4gIH0pO1xuXG4gIHRoaXMudW5iaW5kUmVzaXplKCk7XG5cbiAgdmFyIGlkID0gdGhpcy5lbGVtZW50Lm91dGxheWVyR1VJRDtcbiAgZGVsZXRlIGluc3RhbmNlc1sgaWQgXTsgLy8gcmVtb3ZlIHJlZmVyZW5jZSB0byBpbnN0YW5jZSBieSBpZFxuICBkZWxldGUgdGhpcy5lbGVtZW50Lm91dGxheWVyR1VJRDtcbiAgLy8gcmVtb3ZlIGRhdGEgZm9yIGpRdWVyeVxuICBpZiAoIGpRdWVyeSApIHtcbiAgICBqUXVlcnkucmVtb3ZlRGF0YSggdGhpcy5lbGVtZW50LCB0aGlzLmNvbnN0cnVjdG9yLm5hbWVzcGFjZSApO1xuICB9XG5cbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRhdGEgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLyoqXG4gKiBnZXQgT3V0bGF5ZXIgaW5zdGFuY2UgZnJvbSBlbGVtZW50XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1cbiAqIEByZXR1cm5zIHtPdXRsYXllcn1cbiAqL1xuT3V0bGF5ZXIuZGF0YSA9IGZ1bmN0aW9uKCBlbGVtICkge1xuICBlbGVtID0gdXRpbHMuZ2V0UXVlcnlFbGVtZW50KCBlbGVtICk7XG4gIHZhciBpZCA9IGVsZW0gJiYgZWxlbS5vdXRsYXllckdVSUQ7XG4gIHJldHVybiBpZCAmJiBpbnN0YW5jZXNbIGlkIF07XG59O1xuXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGNyZWF0ZSBPdXRsYXllciBjbGFzcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vKipcbiAqIGNyZWF0ZSBhIGxheW91dCBjbGFzc1xuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICovXG5PdXRsYXllci5jcmVhdGUgPSBmdW5jdGlvbiggbmFtZXNwYWNlLCBvcHRpb25zICkge1xuICAvLyBzdWItY2xhc3MgT3V0bGF5ZXJcbiAgdmFyIExheW91dCA9IHN1YmNsYXNzKCBPdXRsYXllciApO1xuICAvLyBhcHBseSBuZXcgb3B0aW9ucyBhbmQgY29tcGF0T3B0aW9uc1xuICBMYXlvdXQuZGVmYXVsdHMgPSB1dGlscy5leHRlbmQoIHt9LCBPdXRsYXllci5kZWZhdWx0cyApO1xuICB1dGlscy5leHRlbmQoIExheW91dC5kZWZhdWx0cywgb3B0aW9ucyApO1xuICBMYXlvdXQuY29tcGF0T3B0aW9ucyA9IHV0aWxzLmV4dGVuZCgge30sIE91dGxheWVyLmNvbXBhdE9wdGlvbnMgICk7XG5cbiAgTGF5b3V0Lm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblxuICBMYXlvdXQuZGF0YSA9IE91dGxheWVyLmRhdGE7XG5cbiAgLy8gc3ViLWNsYXNzIEl0ZW1cbiAgTGF5b3V0Lkl0ZW0gPSBzdWJjbGFzcyggSXRlbSApO1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRlY2xhcmF0aXZlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgdXRpbHMuaHRtbEluaXQoIExheW91dCwgbmFtZXNwYWNlICk7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0galF1ZXJ5IGJyaWRnZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8vIG1ha2UgaW50byBqUXVlcnkgcGx1Z2luXG4gIGlmICggalF1ZXJ5ICYmIGpRdWVyeS5icmlkZ2V0ICkge1xuICAgIGpRdWVyeS5icmlkZ2V0KCBuYW1lc3BhY2UsIExheW91dCApO1xuICB9XG5cbiAgcmV0dXJuIExheW91dDtcbn07XG5cbmZ1bmN0aW9uIHN1YmNsYXNzKCBQYXJlbnQgKSB7XG4gIGZ1bmN0aW9uIFN1YkNsYXNzKCkge1xuICAgIFBhcmVudC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gIH1cblxuICBTdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBQYXJlbnQucHJvdG90eXBlICk7XG4gIFN1YkNsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFN1YkNsYXNzO1xuXG4gIHJldHVybiBTdWJDbGFzcztcbn1cblxuLy8gLS0tLS0gZmluIC0tLS0tIC8vXG5cbi8vIGJhY2sgaW4gZ2xvYmFsXG5PdXRsYXllci5JdGVtID0gSXRlbTtcblxucmV0dXJuIE91dGxheWVyO1xuXG59KSk7XG5cbi8qIVxuICogTWFzb25yeSB2NC4wLjBcbiAqIENhc2NhZGluZyBncmlkIGxheW91dCBsaWJyYXJ5XG4gKiBodHRwOi8vbWFzb25yeS5kZXNhbmRyby5jb21cbiAqIE1JVCBMaWNlbnNlXG4gKiBieSBEYXZpZCBEZVNhbmRyb1xuICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG4gIC8qIGpzaGludCBzdHJpY3Q6IGZhbHNlICovIC8qZ2xvYmFscyBkZWZpbmUsIG1vZHVsZSwgcmVxdWlyZSAqL1xuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgICAnb3V0bGF5ZXIvb3V0bGF5ZXInLFxuICAgICAgICAnZ2V0LXNpemUvZ2V0LXNpemUnXG4gICAgICBdLFxuICAgICAgZmFjdG9yeSApO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgcmVxdWlyZSgnb3V0bGF5ZXInKSxcbiAgICAgIHJlcXVpcmUoJ2dldC1zaXplJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93Lk1hc29ucnkgPSBmYWN0b3J5KFxuICAgICAgd2luZG93Lk91dGxheWVyLFxuICAgICAgd2luZG93LmdldFNpemVcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggT3V0bGF5ZXIsIGdldFNpemUgKSB7XG5cblxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtYXNvbnJ5RGVmaW5pdGlvbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8vIGNyZWF0ZSBhbiBPdXRsYXllciBsYXlvdXQgY2xhc3NcbiAgdmFyIE1hc29ucnkgPSBPdXRsYXllci5jcmVhdGUoJ21hc29ucnknKTtcbiAgLy8gaXNGaXRXaWR0aCAtPiBmaXRXaWR0aFxuICBNYXNvbnJ5LmNvbXBhdE9wdGlvbnMuZml0V2lkdGggPSAnaXNGaXRXaWR0aCc7XG5cbiAgTWFzb25yeS5wcm90b3R5cGUuX3Jlc2V0TGF5b3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5nZXRTaXplKCk7XG4gICAgdGhpcy5fZ2V0TWVhc3VyZW1lbnQoICdjb2x1bW5XaWR0aCcsICdvdXRlcldpZHRoJyApO1xuICAgIHRoaXMuX2dldE1lYXN1cmVtZW50KCAnZ3V0dGVyJywgJ291dGVyV2lkdGgnICk7XG4gICAgdGhpcy5tZWFzdXJlQ29sdW1ucygpO1xuXG4gICAgLy8gcmVzZXQgY29sdW1uIFlcbiAgICB0aGlzLmNvbFlzID0gW107XG4gICAgZm9yICggdmFyIGk9MDsgaSA8IHRoaXMuY29sczsgaSsrICkge1xuICAgICAgdGhpcy5jb2xZcy5wdXNoKCAwICk7XG4gICAgfVxuXG4gICAgdGhpcy5tYXhZID0gMDtcbiAgfTtcblxuICBNYXNvbnJ5LnByb3RvdHlwZS5tZWFzdXJlQ29sdW1ucyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZ2V0Q29udGFpbmVyV2lkdGgoKTtcbiAgICAvLyBpZiBjb2x1bW5XaWR0aCBpcyAwLCBkZWZhdWx0IHRvIG91dGVyV2lkdGggb2YgZmlyc3QgaXRlbVxuICAgIGlmICggIXRoaXMuY29sdW1uV2lkdGggKSB7XG4gICAgICB2YXIgZmlyc3RJdGVtID0gdGhpcy5pdGVtc1swXTtcbiAgICAgIHZhciBmaXJzdEl0ZW1FbGVtID0gZmlyc3RJdGVtICYmIGZpcnN0SXRlbS5lbGVtZW50O1xuICAgICAgLy8gY29sdW1uV2lkdGggZmFsbCBiYWNrIHRvIGl0ZW0gb2YgZmlyc3QgZWxlbWVudFxuICAgICAgdGhpcy5jb2x1bW5XaWR0aCA9IGZpcnN0SXRlbUVsZW0gJiYgZ2V0U2l6ZSggZmlyc3RJdGVtRWxlbSApLm91dGVyV2lkdGggfHxcbiAgICAgICAgLy8gaWYgZmlyc3QgZWxlbSBoYXMgbm8gd2lkdGgsIGRlZmF1bHQgdG8gc2l6ZSBvZiBjb250YWluZXJcbiAgICAgICAgdGhpcy5jb250YWluZXJXaWR0aDtcbiAgICB9XG5cbiAgICB2YXIgY29sdW1uV2lkdGggPSB0aGlzLmNvbHVtbldpZHRoICs9IHRoaXMuZ3V0dGVyO1xuXG4gICAgLy8gY2FsY3VsYXRlIGNvbHVtbnNcbiAgICB2YXIgY29udGFpbmVyV2lkdGggPSB0aGlzLmNvbnRhaW5lcldpZHRoICsgdGhpcy5ndXR0ZXI7XG4gICAgdmFyIGNvbHMgPSBjb250YWluZXJXaWR0aCAvIGNvbHVtbldpZHRoO1xuICAgIC8vIGZpeCByb3VuZGluZyBlcnJvcnMsIHR5cGljYWxseSB3aXRoIGd1dHRlcnNcbiAgICB2YXIgZXhjZXNzID0gY29sdW1uV2lkdGggLSBjb250YWluZXJXaWR0aCAlIGNvbHVtbldpZHRoO1xuICAgIC8vIGlmIG92ZXJzaG9vdCBpcyBsZXNzIHRoYW4gYSBwaXhlbCwgcm91bmQgdXAsIG90aGVyd2lzZSBmbG9vciBpdFxuICAgIHZhciBtYXRoTWV0aG9kID0gZXhjZXNzICYmIGV4Y2VzcyA8IDEgPyAncm91bmQnIDogJ2Zsb29yJztcbiAgICBjb2xzID0gTWF0aFsgbWF0aE1ldGhvZCBdKCBjb2xzICk7XG4gICAgdGhpcy5jb2xzID0gTWF0aC5tYXgoIGNvbHMsIDEgKTtcbiAgfTtcblxuICBNYXNvbnJ5LnByb3RvdHlwZS5nZXRDb250YWluZXJXaWR0aCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGNvbnRhaW5lciBpcyBwYXJlbnQgaWYgZml0IHdpZHRoXG4gICAgdmFyIGlzRml0V2lkdGggPSB0aGlzLl9nZXRPcHRpb24oJ2ZpdFdpZHRoJyk7XG4gICAgdmFyIGNvbnRhaW5lciA9IGlzRml0V2lkdGggPyB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSA6IHRoaXMuZWxlbWVudDtcbiAgICAvLyBjaGVjayB0aGF0IHRoaXMuc2l6ZSBhbmQgc2l6ZSBhcmUgdGhlcmVcbiAgICAvLyBJRTggdHJpZ2dlcnMgcmVzaXplIG9uIGJvZHkgc2l6ZSBjaGFuZ2UsIHNvIHRoZXkgbWlnaHQgbm90IGJlXG4gICAgdmFyIHNpemUgPSBnZXRTaXplKCBjb250YWluZXIgKTtcbiAgICB0aGlzLmNvbnRhaW5lcldpZHRoID0gc2l6ZSAmJiBzaXplLmlubmVyV2lkdGg7XG4gIH07XG5cbiAgTWFzb25yeS5wcm90b3R5cGUuX2dldEl0ZW1MYXlvdXRQb3NpdGlvbiA9IGZ1bmN0aW9uKCBpdGVtICkge1xuICAgIGl0ZW0uZ2V0U2l6ZSgpO1xuICAgIC8vIGhvdyBtYW55IGNvbHVtbnMgZG9lcyB0aGlzIGJyaWNrIHNwYW5cbiAgICB2YXIgcmVtYWluZGVyID0gaXRlbS5zaXplLm91dGVyV2lkdGggJSB0aGlzLmNvbHVtbldpZHRoO1xuICAgIHZhciBtYXRoTWV0aG9kID0gcmVtYWluZGVyICYmIHJlbWFpbmRlciA8IDEgPyAncm91bmQnIDogJ2NlaWwnO1xuICAgIC8vIHJvdW5kIGlmIG9mZiBieSAxIHBpeGVsLCBvdGhlcndpc2UgdXNlIGNlaWxcbiAgICB2YXIgY29sU3BhbiA9IE1hdGhbIG1hdGhNZXRob2QgXSggaXRlbS5zaXplLm91dGVyV2lkdGggLyB0aGlzLmNvbHVtbldpZHRoICk7XG4gICAgY29sU3BhbiA9IE1hdGgubWluKCBjb2xTcGFuLCB0aGlzLmNvbHMgKTtcblxuICAgIHZhciBjb2xHcm91cCA9IHRoaXMuX2dldENvbEdyb3VwKCBjb2xTcGFuICk7XG4gICAgLy8gZ2V0IHRoZSBtaW5pbXVtIFkgdmFsdWUgZnJvbSB0aGUgY29sdW1uc1xuICAgIHZhciBtaW5pbXVtWSA9IE1hdGgubWluLmFwcGx5KCBNYXRoLCBjb2xHcm91cCApO1xuICAgIHZhciBzaG9ydENvbEluZGV4ID0gY29sR3JvdXAuaW5kZXhPZiggbWluaW11bVkgKTtcblxuICAgIC8vIHBvc2l0aW9uIHRoZSBicmlja1xuICAgIHZhciBwb3NpdGlvbiA9IHtcbiAgICAgIHg6IHRoaXMuY29sdW1uV2lkdGggKiBzaG9ydENvbEluZGV4LFxuICAgICAgeTogbWluaW11bVlcbiAgICB9O1xuXG4gICAgLy8gYXBwbHkgc2V0SGVpZ2h0IHRvIG5lY2Vzc2FyeSBjb2x1bW5zXG4gICAgdmFyIHNldEhlaWdodCA9IG1pbmltdW1ZICsgaXRlbS5zaXplLm91dGVySGVpZ2h0O1xuICAgIHZhciBzZXRTcGFuID0gdGhpcy5jb2xzICsgMSAtIGNvbEdyb3VwLmxlbmd0aDtcbiAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBzZXRTcGFuOyBpKysgKSB7XG4gICAgICB0aGlzLmNvbFlzWyBzaG9ydENvbEluZGV4ICsgaSBdID0gc2V0SGVpZ2h0O1xuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbjtcbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGNvbFNwYW4gLSBudW1iZXIgb2YgY29sdW1ucyB0aGUgZWxlbWVudCBzcGFuc1xuICAgKiBAcmV0dXJucyB7QXJyYXl9IGNvbEdyb3VwXG4gICAqL1xuICBNYXNvbnJ5LnByb3RvdHlwZS5fZ2V0Q29sR3JvdXAgPSBmdW5jdGlvbiggY29sU3BhbiApIHtcbiAgICBpZiAoIGNvbFNwYW4gPCAyICkge1xuICAgICAgLy8gaWYgYnJpY2sgc3BhbnMgb25seSBvbmUgY29sdW1uLCB1c2UgYWxsIHRoZSBjb2x1bW4gWXNcbiAgICAgIHJldHVybiB0aGlzLmNvbFlzO1xuICAgIH1cblxuICAgIHZhciBjb2xHcm91cCA9IFtdO1xuICAgIC8vIGhvdyBtYW55IGRpZmZlcmVudCBwbGFjZXMgY291bGQgdGhpcyBicmljayBmaXQgaG9yaXpvbnRhbGx5XG4gICAgdmFyIGdyb3VwQ291bnQgPSB0aGlzLmNvbHMgKyAxIC0gY29sU3BhbjtcbiAgICAvLyBmb3IgZWFjaCBncm91cCBwb3RlbnRpYWwgaG9yaXpvbnRhbCBwb3NpdGlvblxuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGdyb3VwQ291bnQ7IGkrKyApIHtcbiAgICAgIC8vIG1ha2UgYW4gYXJyYXkgb2YgY29sWSB2YWx1ZXMgZm9yIHRoYXQgb25lIGdyb3VwXG4gICAgICB2YXIgZ3JvdXBDb2xZcyA9IHRoaXMuY29sWXMuc2xpY2UoIGksIGkgKyBjb2xTcGFuICk7XG4gICAgICAvLyBhbmQgZ2V0IHRoZSBtYXggdmFsdWUgb2YgdGhlIGFycmF5XG4gICAgICBjb2xHcm91cFtpXSA9IE1hdGgubWF4LmFwcGx5KCBNYXRoLCBncm91cENvbFlzICk7XG4gICAgfVxuICAgIHJldHVybiBjb2xHcm91cDtcbiAgfTtcblxuICBNYXNvbnJ5LnByb3RvdHlwZS5fbWFuYWdlU3RhbXAgPSBmdW5jdGlvbiggc3RhbXAgKSB7XG4gICAgdmFyIHN0YW1wU2l6ZSA9IGdldFNpemUoIHN0YW1wICk7XG4gICAgdmFyIG9mZnNldCA9IHRoaXMuX2dldEVsZW1lbnRPZmZzZXQoIHN0YW1wICk7XG4gICAgLy8gZ2V0IHRoZSBjb2x1bW5zIHRoYXQgdGhpcyBzdGFtcCBhZmZlY3RzXG4gICAgdmFyIGlzT3JpZ2luTGVmdCA9IHRoaXMuX2dldE9wdGlvbignb3JpZ2luTGVmdCcpO1xuICAgIHZhciBmaXJzdFggPSBpc09yaWdpbkxlZnQgPyBvZmZzZXQubGVmdCA6IG9mZnNldC5yaWdodDtcbiAgICB2YXIgbGFzdFggPSBmaXJzdFggKyBzdGFtcFNpemUub3V0ZXJXaWR0aDtcbiAgICB2YXIgZmlyc3RDb2wgPSBNYXRoLmZsb29yKCBmaXJzdFggLyB0aGlzLmNvbHVtbldpZHRoICk7XG4gICAgZmlyc3RDb2wgPSBNYXRoLm1heCggMCwgZmlyc3RDb2wgKTtcbiAgICB2YXIgbGFzdENvbCA9IE1hdGguZmxvb3IoIGxhc3RYIC8gdGhpcy5jb2x1bW5XaWR0aCApO1xuICAgIC8vIGxhc3RDb2wgc2hvdWxkIG5vdCBnbyBvdmVyIGlmIG11bHRpcGxlIG9mIGNvbHVtbldpZHRoICM0MjVcbiAgICBsYXN0Q29sIC09IGxhc3RYICUgdGhpcy5jb2x1bW5XaWR0aCA/IDAgOiAxO1xuICAgIGxhc3RDb2wgPSBNYXRoLm1pbiggdGhpcy5jb2xzIC0gMSwgbGFzdENvbCApO1xuICAgIC8vIHNldCBjb2xZcyB0byBib3R0b20gb2YgdGhlIHN0YW1wXG5cbiAgICB2YXIgaXNPcmlnaW5Ub3AgPSB0aGlzLl9nZXRPcHRpb24oJ29yaWdpblRvcCcpO1xuICAgIHZhciBzdGFtcE1heFkgPSAoIGlzT3JpZ2luVG9wID8gb2Zmc2V0LnRvcCA6IG9mZnNldC5ib3R0b20gKSArXG4gICAgICBzdGFtcFNpemUub3V0ZXJIZWlnaHQ7XG4gICAgZm9yICggdmFyIGkgPSBmaXJzdENvbDsgaSA8PSBsYXN0Q29sOyBpKysgKSB7XG4gICAgICB0aGlzLmNvbFlzW2ldID0gTWF0aC5tYXgoIHN0YW1wTWF4WSwgdGhpcy5jb2xZc1tpXSApO1xuICAgIH1cbiAgfTtcblxuICBNYXNvbnJ5LnByb3RvdHlwZS5fZ2V0Q29udGFpbmVyU2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubWF4WSA9IE1hdGgubWF4LmFwcGx5KCBNYXRoLCB0aGlzLmNvbFlzICk7XG4gICAgdmFyIHNpemUgPSB7XG4gICAgICBoZWlnaHQ6IHRoaXMubWF4WVxuICAgIH07XG5cbiAgICBpZiAoIHRoaXMuX2dldE9wdGlvbignZml0V2lkdGgnKSApIHtcbiAgICAgIHNpemUud2lkdGggPSB0aGlzLl9nZXRDb250YWluZXJGaXRXaWR0aCgpO1xuICAgIH1cblxuICAgIHJldHVybiBzaXplO1xuICB9O1xuXG4gIE1hc29ucnkucHJvdG90eXBlLl9nZXRDb250YWluZXJGaXRXaWR0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB1bnVzZWRDb2xzID0gMDtcbiAgICAvLyBjb3VudCB1bnVzZWQgY29sdW1uc1xuICAgIHZhciBpID0gdGhpcy5jb2xzO1xuICAgIHdoaWxlICggLS1pICkge1xuICAgICAgaWYgKCB0aGlzLmNvbFlzW2ldICE9PSAwICkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHVudXNlZENvbHMrKztcbiAgICB9XG4gICAgLy8gZml0IGNvbnRhaW5lciB0byBjb2x1bW5zIHRoYXQgaGF2ZSBiZWVuIHVzZWRcbiAgICByZXR1cm4gKCB0aGlzLmNvbHMgLSB1bnVzZWRDb2xzICkgKiB0aGlzLmNvbHVtbldpZHRoIC0gdGhpcy5ndXR0ZXI7XG4gIH07XG5cbiAgTWFzb25yeS5wcm90b3R5cGUubmVlZHNSZXNpemVMYXlvdXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJldmlvdXNXaWR0aCA9IHRoaXMuY29udGFpbmVyV2lkdGg7XG4gICAgdGhpcy5nZXRDb250YWluZXJXaWR0aCgpO1xuICAgIHJldHVybiBwcmV2aW91c1dpZHRoICE9IHRoaXMuY29udGFpbmVyV2lkdGg7XG4gIH07XG5cbiAgcmV0dXJuIE1hc29ucnk7XG5cbn0pKTtcblxuIiwiLyohXG4gKiBpbWFnZXNMb2FkZWQgUEFDS0FHRUQgdjQuMS4wXG4gKiBKYXZhU2NyaXB0IGlzIGFsbCBsaWtlIFwiWW91IGltYWdlcyBhcmUgZG9uZSB5ZXQgb3Igd2hhdD9cIlxuICogTUlUIExpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEV2RW1pdHRlciB2MS4wLjFcbiAqIExpbCcgZXZlbnQgZW1pdHRlclxuICogTUlUIExpY2Vuc2VcbiAqL1xuXG4vKiBqc2hpbnQgdW51c2VkOiB0cnVlLCB1bmRlZjogdHJ1ZSwgc3RyaWN0OiB0cnVlICovXG5cbiggZnVuY3Rpb24oIGdsb2JhbCwgZmFjdG9yeSApIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG4gIC8qIGpzaGludCBzdHJpY3Q6IGZhbHNlICovIC8qIGdsb2JhbHMgZGVmaW5lLCBtb2R1bGUgKi9cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTUQgLSBSZXF1aXJlSlNcbiAgICBkZWZpbmUoICdldi1lbWl0dGVyL2V2LWVtaXR0ZXInLGZhY3RvcnkgKTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyApIHtcbiAgICAvLyBDb21tb25KUyAtIEJyb3dzZXJpZnksIFdlYnBhY2tcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBCcm93c2VyIGdsb2JhbHNcbiAgICBnbG9iYWwuRXZFbWl0dGVyID0gZmFjdG9yeSgpO1xuICB9XG5cbn0oIHRoaXMsIGZ1bmN0aW9uKCkge1xuXG5cblxuZnVuY3Rpb24gRXZFbWl0dGVyKCkge31cblxudmFyIHByb3RvID0gRXZFbWl0dGVyLnByb3RvdHlwZTtcblxucHJvdG8ub24gPSBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApIHtcbiAgaWYgKCAhZXZlbnROYW1lIHx8ICFsaXN0ZW5lciApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gc2V0IGV2ZW50cyBoYXNoXG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIC8vIHNldCBsaXN0ZW5lcnMgYXJyYXlcbiAgdmFyIGxpc3RlbmVycyA9IGV2ZW50c1sgZXZlbnROYW1lIF0gPSBldmVudHNbIGV2ZW50TmFtZSBdIHx8IFtdO1xuICAvLyBvbmx5IGFkZCBvbmNlXG4gIGlmICggbGlzdGVuZXJzLmluZGV4T2YoIGxpc3RlbmVyICkgPT0gLTEgKSB7XG4gICAgbGlzdGVuZXJzLnB1c2goIGxpc3RlbmVyICk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLm9uY2UgPSBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApIHtcbiAgaWYgKCAhZXZlbnROYW1lIHx8ICFsaXN0ZW5lciApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gYWRkIGV2ZW50XG4gIHRoaXMub24oIGV2ZW50TmFtZSwgbGlzdGVuZXIgKTtcbiAgLy8gc2V0IG9uY2UgZmxhZ1xuICAvLyBzZXQgb25jZUV2ZW50cyBoYXNoXG4gIHZhciBvbmNlRXZlbnRzID0gdGhpcy5fb25jZUV2ZW50cyA9IHRoaXMuX29uY2VFdmVudHMgfHwge307XG4gIC8vIHNldCBvbmNlTGlzdGVuZXJzIGFycmF5XG4gIHZhciBvbmNlTGlzdGVuZXJzID0gb25jZUV2ZW50c1sgZXZlbnROYW1lIF0gPSBvbmNlRXZlbnRzWyBldmVudE5hbWUgXSB8fCBbXTtcbiAgLy8gc2V0IGZsYWdcbiAgb25jZUxpc3RlbmVyc1sgbGlzdGVuZXIgXSA9IHRydWU7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5vZmYgPSBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApIHtcbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbIGV2ZW50TmFtZSBdO1xuICBpZiAoICFsaXN0ZW5lcnMgfHwgIWxpc3RlbmVycy5sZW5ndGggKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBpbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKCBsaXN0ZW5lciApO1xuICBpZiAoIGluZGV4ICE9IC0xICkge1xuICAgIGxpc3RlbmVycy5zcGxpY2UoIGluZGV4LCAxICk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmVtaXRFdmVudCA9IGZ1bmN0aW9uKCBldmVudE5hbWUsIGFyZ3MgKSB7XG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXTtcbiAgaWYgKCAhbGlzdGVuZXJzIHx8ICFsaXN0ZW5lcnMubGVuZ3RoICkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgaSA9IDA7XG4gIHZhciBsaXN0ZW5lciA9IGxpc3RlbmVyc1tpXTtcbiAgYXJncyA9IGFyZ3MgfHwgW107XG4gIC8vIG9uY2Ugc3R1ZmZcbiAgdmFyIG9uY2VMaXN0ZW5lcnMgPSB0aGlzLl9vbmNlRXZlbnRzICYmIHRoaXMuX29uY2VFdmVudHNbIGV2ZW50TmFtZSBdO1xuXG4gIHdoaWxlICggbGlzdGVuZXIgKSB7XG4gICAgdmFyIGlzT25jZSA9IG9uY2VMaXN0ZW5lcnMgJiYgb25jZUxpc3RlbmVyc1sgbGlzdGVuZXIgXTtcbiAgICBpZiAoIGlzT25jZSApIHtcbiAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lclxuICAgICAgLy8gcmVtb3ZlIGJlZm9yZSB0cmlnZ2VyIHRvIHByZXZlbnQgcmVjdXJzaW9uXG4gICAgICB0aGlzLm9mZiggZXZlbnROYW1lLCBsaXN0ZW5lciApO1xuICAgICAgLy8gdW5zZXQgb25jZSBmbGFnXG4gICAgICBkZWxldGUgb25jZUxpc3RlbmVyc1sgbGlzdGVuZXIgXTtcbiAgICB9XG4gICAgLy8gdHJpZ2dlciBsaXN0ZW5lclxuICAgIGxpc3RlbmVyLmFwcGx5KCB0aGlzLCBhcmdzICk7XG4gICAgLy8gZ2V0IG5leHQgbGlzdGVuZXJcbiAgICBpICs9IGlzT25jZSA/IDAgOiAxO1xuICAgIGxpc3RlbmVyID0gbGlzdGVuZXJzW2ldO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5yZXR1cm4gRXZFbWl0dGVyO1xuXG59KSk7XG5cbi8qIVxuICogaW1hZ2VzTG9hZGVkIHY0LjEuMFxuICogSmF2YVNjcmlwdCBpcyBhbGwgbGlrZSBcIllvdSBpbWFnZXMgYXJlIGRvbmUgeWV0IG9yIHdoYXQ/XCJcbiAqIE1JVCBMaWNlbnNlXG4gKi9cblxuKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkgeyAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIHJlcXVpcmU6IGZhbHNlICovXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICdldi1lbWl0dGVyL2V2LWVtaXR0ZXInXG4gICAgXSwgZnVuY3Rpb24oIEV2RW1pdHRlciApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIEV2RW1pdHRlciApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgcmVxdWlyZSgnZXYtZW1pdHRlcicpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5pbWFnZXNMb2FkZWQgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgd2luZG93LkV2RW1pdHRlclxuICAgICk7XG4gIH1cblxufSkoIHdpbmRvdyxcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIGZhY3RvcnkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBFdkVtaXR0ZXIgKSB7XG5cblxuXG52YXIgJCA9IHdpbmRvdy5qUXVlcnk7XG52YXIgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoZWxwZXJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8vIGV4dGVuZCBvYmplY3RzXG5mdW5jdGlvbiBleHRlbmQoIGEsIGIgKSB7XG4gIGZvciAoIHZhciBwcm9wIGluIGIgKSB7XG4gICAgYVsgcHJvcCBdID0gYlsgcHJvcCBdO1xuICB9XG4gIHJldHVybiBhO1xufVxuXG4vLyB0dXJuIGVsZW1lbnQgb3Igbm9kZUxpc3QgaW50byBhbiBhcnJheVxuZnVuY3Rpb24gbWFrZUFycmF5KCBvYmogKSB7XG4gIHZhciBhcnkgPSBbXTtcbiAgaWYgKCBBcnJheS5pc0FycmF5KCBvYmogKSApIHtcbiAgICAvLyB1c2Ugb2JqZWN0IGlmIGFscmVhZHkgYW4gYXJyYXlcbiAgICBhcnkgPSBvYmo7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBvYmoubGVuZ3RoID09ICdudW1iZXInICkge1xuICAgIC8vIGNvbnZlcnQgbm9kZUxpc3QgdG8gYXJyYXlcbiAgICBmb3IgKCB2YXIgaT0wOyBpIDwgb2JqLmxlbmd0aDsgaSsrICkge1xuICAgICAgYXJ5LnB1c2goIG9ialtpXSApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBhcnJheSBvZiBzaW5nbGUgaW5kZXhcbiAgICBhcnkucHVzaCggb2JqICk7XG4gIH1cbiAgcmV0dXJuIGFyeTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaW1hZ2VzTG9hZGVkIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8qKlxuICogQHBhcmFtIHtBcnJheSwgRWxlbWVudCwgTm9kZUxpc3QsIFN0cmluZ30gZWxlbVxuICogQHBhcmFtIHtPYmplY3Qgb3IgRnVuY3Rpb259IG9wdGlvbnMgLSBpZiBmdW5jdGlvbiwgdXNlIGFzIGNhbGxiYWNrXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvbkFsd2F5cyAtIGNhbGxiYWNrIGZ1bmN0aW9uXG4gKi9cbmZ1bmN0aW9uIEltYWdlc0xvYWRlZCggZWxlbSwgb3B0aW9ucywgb25BbHdheXMgKSB7XG4gIC8vIGNvZXJjZSBJbWFnZXNMb2FkZWQoKSB3aXRob3V0IG5ldywgdG8gYmUgbmV3IEltYWdlc0xvYWRlZCgpXG4gIGlmICggISggdGhpcyBpbnN0YW5jZW9mIEltYWdlc0xvYWRlZCApICkge1xuICAgIHJldHVybiBuZXcgSW1hZ2VzTG9hZGVkKCBlbGVtLCBvcHRpb25zLCBvbkFsd2F5cyApO1xuICB9XG4gIC8vIHVzZSBlbGVtIGFzIHNlbGVjdG9yIHN0cmluZ1xuICBpZiAoIHR5cGVvZiBlbGVtID09ICdzdHJpbmcnICkge1xuICAgIGVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBlbGVtICk7XG4gIH1cblxuICB0aGlzLmVsZW1lbnRzID0gbWFrZUFycmF5KCBlbGVtICk7XG4gIHRoaXMub3B0aW9ucyA9IGV4dGVuZCgge30sIHRoaXMub3B0aW9ucyApO1xuXG4gIGlmICggdHlwZW9mIG9wdGlvbnMgPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICBvbkFsd2F5cyA9IG9wdGlvbnM7XG4gIH0gZWxzZSB7XG4gICAgZXh0ZW5kKCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMgKTtcbiAgfVxuXG4gIGlmICggb25BbHdheXMgKSB7XG4gICAgdGhpcy5vbiggJ2Fsd2F5cycsIG9uQWx3YXlzICk7XG4gIH1cblxuICB0aGlzLmdldEltYWdlcygpO1xuXG4gIGlmICggJCApIHtcbiAgICAvLyBhZGQgalF1ZXJ5IERlZmVycmVkIG9iamVjdFxuICAgIHRoaXMuanFEZWZlcnJlZCA9IG5ldyAkLkRlZmVycmVkKCk7XG4gIH1cblxuICAvLyBIQUNLIGNoZWNrIGFzeW5jIHRvIGFsbG93IHRpbWUgdG8gYmluZCBsaXN0ZW5lcnNcbiAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jaGVjaygpO1xuICB9LmJpbmQoIHRoaXMgKSk7XG59XG5cbkltYWdlc0xvYWRlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBFdkVtaXR0ZXIucHJvdG90eXBlICk7XG5cbkltYWdlc0xvYWRlZC5wcm90b3R5cGUub3B0aW9ucyA9IHt9O1xuXG5JbWFnZXNMb2FkZWQucHJvdG90eXBlLmdldEltYWdlcyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmltYWdlcyA9IFtdO1xuXG4gIC8vIGZpbHRlciAmIGZpbmQgaXRlbXMgaWYgd2UgaGF2ZSBhbiBpdGVtIHNlbGVjdG9yXG4gIHRoaXMuZWxlbWVudHMuZm9yRWFjaCggdGhpcy5hZGRFbGVtZW50SW1hZ2VzLCB0aGlzICk7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7Tm9kZX0gZWxlbWVudFxuICovXG5JbWFnZXNMb2FkZWQucHJvdG90eXBlLmFkZEVsZW1lbnRJbWFnZXMgPSBmdW5jdGlvbiggZWxlbSApIHtcbiAgLy8gZmlsdGVyIHNpYmxpbmdzXG4gIGlmICggZWxlbS5ub2RlTmFtZSA9PSAnSU1HJyApIHtcbiAgICB0aGlzLmFkZEltYWdlKCBlbGVtICk7XG4gIH1cbiAgLy8gZ2V0IGJhY2tncm91bmQgaW1hZ2Ugb24gZWxlbWVudFxuICBpZiAoIHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kID09PSB0cnVlICkge1xuICAgIHRoaXMuYWRkRWxlbWVudEJhY2tncm91bmRJbWFnZXMoIGVsZW0gKTtcbiAgfVxuXG4gIC8vIGZpbmQgY2hpbGRyZW5cbiAgLy8gbm8gbm9uLWVsZW1lbnQgbm9kZXMsICMxNDNcbiAgdmFyIG5vZGVUeXBlID0gZWxlbS5ub2RlVHlwZTtcbiAgaWYgKCAhbm9kZVR5cGUgfHwgIWVsZW1lbnROb2RlVHlwZXNbIG5vZGVUeXBlIF0gKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBjaGlsZEltZ3MgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xuICAvLyBjb25jYXQgY2hpbGRFbGVtcyB0byBmaWx0ZXJGb3VuZCBhcnJheVxuICBmb3IgKCB2YXIgaT0wOyBpIDwgY2hpbGRJbWdzLmxlbmd0aDsgaSsrICkge1xuICAgIHZhciBpbWcgPSBjaGlsZEltZ3NbaV07XG4gICAgdGhpcy5hZGRJbWFnZSggaW1nICk7XG4gIH1cblxuICAvLyBnZXQgY2hpbGQgYmFja2dyb3VuZCBpbWFnZXNcbiAgaWYgKCB0eXBlb2YgdGhpcy5vcHRpb25zLmJhY2tncm91bmQgPT0gJ3N0cmluZycgKSB7XG4gICAgdmFyIGNoaWxkcmVuID0gZWxlbS5xdWVyeVNlbGVjdG9yQWxsKCB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZCApO1xuICAgIGZvciAoIGk9MDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrICkge1xuICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICB0aGlzLmFkZEVsZW1lbnRCYWNrZ3JvdW5kSW1hZ2VzKCBjaGlsZCApO1xuICAgIH1cbiAgfVxufTtcblxudmFyIGVsZW1lbnROb2RlVHlwZXMgPSB7XG4gIDE6IHRydWUsXG4gIDk6IHRydWUsXG4gIDExOiB0cnVlXG59O1xuXG5JbWFnZXNMb2FkZWQucHJvdG90eXBlLmFkZEVsZW1lbnRCYWNrZ3JvdW5kSW1hZ2VzID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoIGVsZW0gKTtcbiAgaWYgKCAhc3R5bGUgKSB7XG4gICAgLy8gRmlyZWZveCByZXR1cm5zIG51bGwgaWYgaW4gYSBoaWRkZW4gaWZyYW1lIGh0dHBzOi8vYnVnemlsLmxhLzU0ODM5N1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBnZXQgdXJsIGluc2lkZSB1cmwoXCIuLi5cIilcbiAgdmFyIHJlVVJMID0gL3VybFxcKChbJ1wiXSk/KC4qPylcXDFcXCkvZ2k7XG4gIHZhciBtYXRjaGVzID0gcmVVUkwuZXhlYyggc3R5bGUuYmFja2dyb3VuZEltYWdlICk7XG4gIHdoaWxlICggbWF0Y2hlcyAhPT0gbnVsbCApIHtcbiAgICB2YXIgdXJsID0gbWF0Y2hlcyAmJiBtYXRjaGVzWzJdO1xuICAgIGlmICggdXJsICkge1xuICAgICAgdGhpcy5hZGRCYWNrZ3JvdW5kKCB1cmwsIGVsZW0gKTtcbiAgICB9XG4gICAgbWF0Y2hlcyA9IHJlVVJMLmV4ZWMoIHN0eWxlLmJhY2tncm91bmRJbWFnZSApO1xuICB9XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7SW1hZ2V9IGltZ1xuICovXG5JbWFnZXNMb2FkZWQucHJvdG90eXBlLmFkZEltYWdlID0gZnVuY3Rpb24oIGltZyApIHtcbiAgdmFyIGxvYWRpbmdJbWFnZSA9IG5ldyBMb2FkaW5nSW1hZ2UoIGltZyApO1xuICB0aGlzLmltYWdlcy5wdXNoKCBsb2FkaW5nSW1hZ2UgKTtcbn07XG5cbkltYWdlc0xvYWRlZC5wcm90b3R5cGUuYWRkQmFja2dyb3VuZCA9IGZ1bmN0aW9uKCB1cmwsIGVsZW0gKSB7XG4gIHZhciBiYWNrZ3JvdW5kID0gbmV3IEJhY2tncm91bmQoIHVybCwgZWxlbSApO1xuICB0aGlzLmltYWdlcy5wdXNoKCBiYWNrZ3JvdW5kICk7XG59O1xuXG5JbWFnZXNMb2FkZWQucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24oKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHRoaXMucHJvZ3Jlc3NlZENvdW50ID0gMDtcbiAgdGhpcy5oYXNBbnlCcm9rZW4gPSBmYWxzZTtcbiAgLy8gY29tcGxldGUgaWYgbm8gaW1hZ2VzXG4gIGlmICggIXRoaXMuaW1hZ2VzLmxlbmd0aCApIHtcbiAgICB0aGlzLmNvbXBsZXRlKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Qcm9ncmVzcyggaW1hZ2UsIGVsZW0sIG1lc3NhZ2UgKSB7XG4gICAgLy8gSEFDSyAtIENocm9tZSB0cmlnZ2VycyBldmVudCBiZWZvcmUgb2JqZWN0IHByb3BlcnRpZXMgaGF2ZSBjaGFuZ2VkLiAjODNcbiAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLnByb2dyZXNzKCBpbWFnZSwgZWxlbSwgbWVzc2FnZSApO1xuICAgIH0pO1xuICB9XG5cbiAgdGhpcy5pbWFnZXMuZm9yRWFjaCggZnVuY3Rpb24oIGxvYWRpbmdJbWFnZSApIHtcbiAgICBsb2FkaW5nSW1hZ2Uub25jZSggJ3Byb2dyZXNzJywgb25Qcm9ncmVzcyApO1xuICAgIGxvYWRpbmdJbWFnZS5jaGVjaygpO1xuICB9KTtcbn07XG5cbkltYWdlc0xvYWRlZC5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiggaW1hZ2UsIGVsZW0sIG1lc3NhZ2UgKSB7XG4gIHRoaXMucHJvZ3Jlc3NlZENvdW50Kys7XG4gIHRoaXMuaGFzQW55QnJva2VuID0gdGhpcy5oYXNBbnlCcm9rZW4gfHwgIWltYWdlLmlzTG9hZGVkO1xuICAvLyBwcm9ncmVzcyBldmVudFxuICB0aGlzLmVtaXRFdmVudCggJ3Byb2dyZXNzJywgWyB0aGlzLCBpbWFnZSwgZWxlbSBdICk7XG4gIGlmICggdGhpcy5qcURlZmVycmVkICYmIHRoaXMuanFEZWZlcnJlZC5ub3RpZnkgKSB7XG4gICAgdGhpcy5qcURlZmVycmVkLm5vdGlmeSggdGhpcywgaW1hZ2UgKTtcbiAgfVxuICAvLyBjaGVjayBpZiBjb21wbGV0ZWRcbiAgaWYgKCB0aGlzLnByb2dyZXNzZWRDb3VudCA9PSB0aGlzLmltYWdlcy5sZW5ndGggKSB7XG4gICAgdGhpcy5jb21wbGV0ZSgpO1xuICB9XG5cbiAgaWYgKCB0aGlzLm9wdGlvbnMuZGVidWcgJiYgY29uc29sZSApIHtcbiAgICBjb25zb2xlLmxvZyggJ3Byb2dyZXNzOiAnICsgbWVzc2FnZSwgaW1hZ2UsIGVsZW0gKTtcbiAgfVxufTtcblxuSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZXZlbnROYW1lID0gdGhpcy5oYXNBbnlCcm9rZW4gPyAnZmFpbCcgOiAnZG9uZSc7XG4gIHRoaXMuaXNDb21wbGV0ZSA9IHRydWU7XG4gIHRoaXMuZW1pdEV2ZW50KCBldmVudE5hbWUsIFsgdGhpcyBdICk7XG4gIHRoaXMuZW1pdEV2ZW50KCAnYWx3YXlzJywgWyB0aGlzIF0gKTtcbiAgaWYgKCB0aGlzLmpxRGVmZXJyZWQgKSB7XG4gICAgdmFyIGpxTWV0aG9kID0gdGhpcy5oYXNBbnlCcm9rZW4gPyAncmVqZWN0JyA6ICdyZXNvbHZlJztcbiAgICB0aGlzLmpxRGVmZXJyZWRbIGpxTWV0aG9kIF0oIHRoaXMgKTtcbiAgfVxufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbmZ1bmN0aW9uIExvYWRpbmdJbWFnZSggaW1nICkge1xuICB0aGlzLmltZyA9IGltZztcbn1cblxuTG9hZGluZ0ltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEV2RW1pdHRlci5wcm90b3R5cGUgKTtcblxuTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICAvLyBJZiBjb21wbGV0ZSBpcyB0cnVlIGFuZCBicm93c2VyIHN1cHBvcnRzIG5hdHVyYWwgc2l6ZXMsXG4gIC8vIHRyeSB0byBjaGVjayBmb3IgaW1hZ2Ugc3RhdHVzIG1hbnVhbGx5LlxuICB2YXIgaXNDb21wbGV0ZSA9IHRoaXMuZ2V0SXNJbWFnZUNvbXBsZXRlKCk7XG4gIGlmICggaXNDb21wbGV0ZSApIHtcbiAgICAvLyByZXBvcnQgYmFzZWQgb24gbmF0dXJhbFdpZHRoXG4gICAgdGhpcy5jb25maXJtKCB0aGlzLmltZy5uYXR1cmFsV2lkdGggIT09IDAsICduYXR1cmFsV2lkdGgnICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSWYgbm9uZSBvZiB0aGUgY2hlY2tzIGFib3ZlIG1hdGNoZWQsIHNpbXVsYXRlIGxvYWRpbmcgb24gZGV0YWNoZWQgZWxlbWVudC5cbiAgdGhpcy5wcm94eUltYWdlID0gbmV3IEltYWdlKCk7XG4gIHRoaXMucHJveHlJbWFnZS5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIHRoaXMgKTtcbiAgdGhpcy5wcm94eUltYWdlLmFkZEV2ZW50TGlzdGVuZXIoICdlcnJvcicsIHRoaXMgKTtcbiAgLy8gYmluZCB0byBpbWFnZSBhcyB3ZWxsIGZvciBGaXJlZm94LiAjMTkxXG4gIHRoaXMuaW1nLmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgdGhpcyApO1xuICB0aGlzLmltZy5hZGRFdmVudExpc3RlbmVyKCAnZXJyb3InLCB0aGlzICk7XG4gIHRoaXMucHJveHlJbWFnZS5zcmMgPSB0aGlzLmltZy5zcmM7XG59O1xuXG5Mb2FkaW5nSW1hZ2UucHJvdG90eXBlLmdldElzSW1hZ2VDb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5pbWcuY29tcGxldGUgJiYgdGhpcy5pbWcubmF0dXJhbFdpZHRoICE9PSB1bmRlZmluZWQ7XG59O1xuXG5Mb2FkaW5nSW1hZ2UucHJvdG90eXBlLmNvbmZpcm0gPSBmdW5jdGlvbiggaXNMb2FkZWQsIG1lc3NhZ2UgKSB7XG4gIHRoaXMuaXNMb2FkZWQgPSBpc0xvYWRlZDtcbiAgdGhpcy5lbWl0RXZlbnQoICdwcm9ncmVzcycsIFsgdGhpcywgdGhpcy5pbWcsIG1lc3NhZ2UgXSApO1xufTtcblxuLy8gLS0tLS0gZXZlbnRzIC0tLS0tIC8vXG5cbi8vIHRyaWdnZXIgc3BlY2lmaWVkIGhhbmRsZXIgZm9yIGV2ZW50IHR5cGVcbkxvYWRpbmdJbWFnZS5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIHZhciBtZXRob2QgPSAnb24nICsgZXZlbnQudHlwZTtcbiAgaWYgKCB0aGlzWyBtZXRob2QgXSApIHtcbiAgICB0aGlzWyBtZXRob2QgXSggZXZlbnQgKTtcbiAgfVxufTtcblxuTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jb25maXJtKCB0cnVlLCAnb25sb2FkJyApO1xuICB0aGlzLnVuYmluZEV2ZW50cygpO1xufTtcblxuTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuY29uZmlybSggZmFsc2UsICdvbmVycm9yJyApO1xuICB0aGlzLnVuYmluZEV2ZW50cygpO1xufTtcblxuTG9hZGluZ0ltYWdlLnByb3RvdHlwZS51bmJpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcm94eUltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdsb2FkJywgdGhpcyApO1xuICB0aGlzLnByb3h5SW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2Vycm9yJywgdGhpcyApO1xuICB0aGlzLmltZy5yZW1vdmVFdmVudExpc3RlbmVyKCAnbG9hZCcsIHRoaXMgKTtcbiAgdGhpcy5pbWcucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2Vycm9yJywgdGhpcyApO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQmFja2dyb3VuZCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5mdW5jdGlvbiBCYWNrZ3JvdW5kKCB1cmwsIGVsZW1lbnQgKSB7XG4gIHRoaXMudXJsID0gdXJsO1xuICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICB0aGlzLmltZyA9IG5ldyBJbWFnZSgpO1xufVxuXG4vLyBpbmhlcml0IExvYWRpbmdJbWFnZSBwcm90b3R5cGVcbkJhY2tncm91bmQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggTG9hZGluZ0ltYWdlLnByb3RvdHlwZSApO1xuXG5CYWNrZ3JvdW5kLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmltZy5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIHRoaXMgKTtcbiAgdGhpcy5pbWcuYWRkRXZlbnRMaXN0ZW5lciggJ2Vycm9yJywgdGhpcyApO1xuICB0aGlzLmltZy5zcmMgPSB0aGlzLnVybDtcbiAgLy8gY2hlY2sgaWYgaW1hZ2UgaXMgYWxyZWFkeSBjb21wbGV0ZVxuICB2YXIgaXNDb21wbGV0ZSA9IHRoaXMuZ2V0SXNJbWFnZUNvbXBsZXRlKCk7XG4gIGlmICggaXNDb21wbGV0ZSApIHtcbiAgICB0aGlzLmNvbmZpcm0oIHRoaXMuaW1nLm5hdHVyYWxXaWR0aCAhPT0gMCwgJ25hdHVyYWxXaWR0aCcgKTtcbiAgICB0aGlzLnVuYmluZEV2ZW50cygpO1xuICB9XG59O1xuXG5CYWNrZ3JvdW5kLnByb3RvdHlwZS51bmJpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5pbWcucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCB0aGlzICk7XG4gIHRoaXMuaW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdlcnJvcicsIHRoaXMgKTtcbn07XG5cbkJhY2tncm91bmQucHJvdG90eXBlLmNvbmZpcm0gPSBmdW5jdGlvbiggaXNMb2FkZWQsIG1lc3NhZ2UgKSB7XG4gIHRoaXMuaXNMb2FkZWQgPSBpc0xvYWRlZDtcbiAgdGhpcy5lbWl0RXZlbnQoICdwcm9ncmVzcycsIFsgdGhpcywgdGhpcy5lbGVtZW50LCBtZXNzYWdlIF0gKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGpRdWVyeSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5JbWFnZXNMb2FkZWQubWFrZUpRdWVyeVBsdWdpbiA9IGZ1bmN0aW9uKCBqUXVlcnkgKSB7XG4gIGpRdWVyeSA9IGpRdWVyeSB8fCB3aW5kb3cualF1ZXJ5O1xuICBpZiAoICFqUXVlcnkgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIHNldCBsb2NhbCB2YXJpYWJsZVxuICAkID0galF1ZXJ5O1xuICAvLyAkKCkuaW1hZ2VzTG9hZGVkKClcbiAgJC5mbi5pbWFnZXNMb2FkZWQgPSBmdW5jdGlvbiggb3B0aW9ucywgY2FsbGJhY2sgKSB7XG4gICAgdmFyIGluc3RhbmNlID0gbmV3IEltYWdlc0xvYWRlZCggdGhpcywgb3B0aW9ucywgY2FsbGJhY2sgKTtcbiAgICByZXR1cm4gaW5zdGFuY2UuanFEZWZlcnJlZC5wcm9taXNlKCAkKHRoaXMpICk7XG4gIH07XG59O1xuLy8gdHJ5IG1ha2luZyBwbHVnaW5cbkltYWdlc0xvYWRlZC5tYWtlSlF1ZXJ5UGx1Z2luKCk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5yZXR1cm4gSW1hZ2VzTG9hZGVkO1xuXG59KTtcblxuIiwiLyohXG4gKiBzbW9vdGgtc2Nyb2xsIHY5LjEuMTogQW5pbWF0ZSBzY3JvbGxpbmcgdG8gYW5jaG9yIGxpbmtzXG4gKiAoYykgMjAxNiBDaHJpcyBGZXJkaW5hbmRpXG4gKiBNSVQgTGljZW5zZVxuICogaHR0cDovL2dpdGh1Yi5jb20vY2ZlcmRpbmFuZGkvc21vb3RoLXNjcm9sbFxuICovXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHRpZiAoIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcblx0XHRkZWZpbmUoW10sIGZhY3Rvcnkocm9vdCkpO1xuXHR9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJvb3QpO1xuXHR9IGVsc2Uge1xuXHRcdHJvb3Quc21vb3RoU2Nyb2xsID0gZmFjdG9yeShyb290KTtcblx0fVxufSkodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzLndpbmRvdyB8fCB0aGlzLmdsb2JhbCwgZnVuY3Rpb24gKHJvb3QpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0Ly9cblx0Ly8gVmFyaWFibGVzXG5cdC8vXG5cblx0dmFyIHNtb290aFNjcm9sbCA9IHt9OyAvLyBPYmplY3QgZm9yIHB1YmxpYyBBUElzXG5cdHZhciBzdXBwb3J0cyA9ICdxdWVyeVNlbGVjdG9yJyBpbiBkb2N1bWVudCAmJiAnYWRkRXZlbnRMaXN0ZW5lcicgaW4gcm9vdDsgLy8gRmVhdHVyZSB0ZXN0XG5cdHZhciBzZXR0aW5ncywgZXZlbnRUaW1lb3V0LCBmaXhlZEhlYWRlciwgaGVhZGVySGVpZ2h0LCBhbmltYXRpb25JbnRlcnZhbDtcblxuXHQvLyBEZWZhdWx0IHNldHRpbmdzXG5cdHZhciBkZWZhdWx0cyA9IHtcblx0XHRzZWxlY3RvcjogJ1tkYXRhLXNjcm9sbF0nLFxuXHRcdHNlbGVjdG9ySGVhZGVyOiAnW2RhdGEtc2Nyb2xsLWhlYWRlcl0nLFxuXHRcdHNwZWVkOiA1MDAsXG5cdFx0ZWFzaW5nOiAnZWFzZUluT3V0Q3ViaWMnLFxuXHRcdG9mZnNldDogMCxcblx0XHR1cGRhdGVVUkw6IHRydWUsXG5cdFx0Y2FsbGJhY2s6IGZ1bmN0aW9uICgpIHt9XG5cdH07XG5cblxuXHQvL1xuXHQvLyBNZXRob2RzXG5cdC8vXG5cblx0LyoqXG5cdCAqIE1lcmdlIHR3byBvciBtb3JlIG9iamVjdHMuIFJldHVybnMgYSBuZXcgb2JqZWN0LlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59ICBkZWVwICAgICBJZiB0cnVlLCBkbyBhIGRlZXAgKG9yIHJlY3Vyc2l2ZSkgbWVyZ2UgW29wdGlvbmFsXVxuXHQgKiBAcGFyYW0ge09iamVjdH0gICBvYmplY3RzICBUaGUgb2JqZWN0cyB0byBtZXJnZSB0b2dldGhlclxuXHQgKiBAcmV0dXJucyB7T2JqZWN0fSAgICAgICAgICBNZXJnZWQgdmFsdWVzIG9mIGRlZmF1bHRzIGFuZCBvcHRpb25zXG5cdCAqL1xuXHR2YXIgZXh0ZW5kID0gZnVuY3Rpb24gKCkge1xuXG5cdFx0Ly8gVmFyaWFibGVzXG5cdFx0dmFyIGV4dGVuZGVkID0ge307XG5cdFx0dmFyIGRlZXAgPSBmYWxzZTtcblx0XHR2YXIgaSA9IDA7XG5cdFx0dmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cblx0XHQvLyBDaGVjayBpZiBhIGRlZXAgbWVyZ2Vcblx0XHRpZiAoIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCggYXJndW1lbnRzWzBdICkgPT09ICdbb2JqZWN0IEJvb2xlYW5dJyApIHtcblx0XHRcdGRlZXAgPSBhcmd1bWVudHNbMF07XG5cdFx0XHRpKys7XG5cdFx0fVxuXG5cdFx0Ly8gTWVyZ2UgdGhlIG9iamVjdCBpbnRvIHRoZSBleHRlbmRlZCBvYmplY3Rcblx0XHR2YXIgbWVyZ2UgPSBmdW5jdGlvbiAob2JqKSB7XG5cdFx0XHRmb3IgKCB2YXIgcHJvcCBpbiBvYmogKSB7XG5cdFx0XHRcdGlmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBvYmosIHByb3AgKSApIHtcblx0XHRcdFx0XHQvLyBJZiBkZWVwIG1lcmdlIGFuZCBwcm9wZXJ0eSBpcyBhbiBvYmplY3QsIG1lcmdlIHByb3BlcnRpZXNcblx0XHRcdFx0XHRpZiAoIGRlZXAgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9ialtwcm9wXSkgPT09ICdbb2JqZWN0IE9iamVjdF0nICkge1xuXHRcdFx0XHRcdFx0ZXh0ZW5kZWRbcHJvcF0gPSBleHRlbmQoIHRydWUsIGV4dGVuZGVkW3Byb3BdLCBvYmpbcHJvcF0gKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZXh0ZW5kZWRbcHJvcF0gPSBvYmpbcHJvcF07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIExvb3AgdGhyb3VnaCBlYWNoIG9iamVjdCBhbmQgY29uZHVjdCBhIG1lcmdlXG5cdFx0Zm9yICggOyBpIDwgbGVuZ3RoOyBpKysgKSB7XG5cdFx0XHR2YXIgb2JqID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0bWVyZ2Uob2JqKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZXh0ZW5kZWQ7XG5cblx0fTtcblxuXHQvKipcblx0ICogR2V0IHRoZSBoZWlnaHQgb2YgYW4gZWxlbWVudC5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtICB7Tm9kZX0gZWxlbSBUaGUgZWxlbWVudCB0byBnZXQgdGhlIGhlaWdodCBvZlxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgIFRoZSBlbGVtZW50J3MgaGVpZ2h0IGluIHBpeGVsc1xuXHQgKi9cblx0dmFyIGdldEhlaWdodCA9IGZ1bmN0aW9uICggZWxlbSApIHtcblx0XHRyZXR1cm4gTWF0aC5tYXgoIGVsZW0uc2Nyb2xsSGVpZ2h0LCBlbGVtLm9mZnNldEhlaWdodCwgZWxlbS5jbGllbnRIZWlnaHQgKTtcblx0fTtcblxuXHQvKipcblx0ICogR2V0IHRoZSBjbG9zZXN0IG1hdGNoaW5nIGVsZW1lbnQgdXAgdGhlIERPTSB0cmVlLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0gIHtFbGVtZW50fSBlbGVtICAgICBTdGFydGluZyBlbGVtZW50XG5cdCAqIEBwYXJhbSAge1N0cmluZ30gIHNlbGVjdG9yIFNlbGVjdG9yIHRvIG1hdGNoIGFnYWluc3QgKGNsYXNzLCBJRCwgZGF0YSBhdHRyaWJ1dGUsIG9yIHRhZylcblx0ICogQHJldHVybiB7Qm9vbGVhbnxFbGVtZW50fSAgUmV0dXJucyBudWxsIGlmIG5vdCBtYXRjaCBmb3VuZFxuXHQgKi9cblx0dmFyIGdldENsb3Nlc3QgPSBmdW5jdGlvbiAoIGVsZW0sIHNlbGVjdG9yICkge1xuXG5cdFx0Ly8gVmFyaWFibGVzXG5cdFx0dmFyIGZpcnN0Q2hhciA9IHNlbGVjdG9yLmNoYXJBdCgwKTtcblx0XHR2YXIgc3VwcG9ydHMgPSAnY2xhc3NMaXN0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cdFx0dmFyIGF0dHJpYnV0ZSwgdmFsdWU7XG5cblx0XHQvLyBJZiBzZWxlY3RvciBpcyBhIGRhdGEgYXR0cmlidXRlLCBzcGxpdCBhdHRyaWJ1dGUgZnJvbSB2YWx1ZVxuXHRcdGlmICggZmlyc3RDaGFyID09PSAnWycgKSB7XG5cdFx0XHRzZWxlY3RvciA9IHNlbGVjdG9yLnN1YnN0cigxLCBzZWxlY3Rvci5sZW5ndGggLSAyKTtcblx0XHRcdGF0dHJpYnV0ZSA9IHNlbGVjdG9yLnNwbGl0KCAnPScgKTtcblxuXHRcdFx0aWYgKCBhdHRyaWJ1dGUubGVuZ3RoID4gMSApIHtcblx0XHRcdFx0dmFsdWUgPSB0cnVlO1xuXHRcdFx0XHRhdHRyaWJ1dGVbMV0gPSBhdHRyaWJ1dGVbMV0ucmVwbGFjZSggL1wiL2csICcnICkucmVwbGFjZSggLycvZywgJycgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBHZXQgY2xvc2VzdCBtYXRjaFxuXHRcdGZvciAoIDsgZWxlbSAmJiBlbGVtICE9PSBkb2N1bWVudDsgZWxlbSA9IGVsZW0ucGFyZW50Tm9kZSApIHtcblxuXHRcdFx0Ly8gSWYgc2VsZWN0b3IgaXMgYSBjbGFzc1xuXHRcdFx0aWYgKCBmaXJzdENoYXIgPT09ICcuJyApIHtcblx0XHRcdFx0aWYgKCBzdXBwb3J0cyApIHtcblx0XHRcdFx0XHRpZiAoIGVsZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCBzZWxlY3Rvci5zdWJzdHIoMSkgKSApIHtcblx0XHRcdFx0XHRcdHJldHVybiBlbGVtO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpZiAoIG5ldyBSZWdFeHAoJyhefFxcXFxzKScgKyBzZWxlY3Rvci5zdWJzdHIoMSkgKyAnKFxcXFxzfCQpJykudGVzdCggZWxlbS5jbGFzc05hbWUgKSApIHtcblx0XHRcdFx0XHRcdHJldHVybiBlbGVtO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiBzZWxlY3RvciBpcyBhbiBJRFxuXHRcdFx0aWYgKCBmaXJzdENoYXIgPT09ICcjJyApIHtcblx0XHRcdFx0aWYgKCBlbGVtLmlkID09PSBzZWxlY3Rvci5zdWJzdHIoMSkgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGVsZW07XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgc2VsZWN0b3IgaXMgYSBkYXRhIGF0dHJpYnV0ZVxuXHRcdFx0aWYgKCBmaXJzdENoYXIgPT09ICdbJyApIHtcblx0XHRcdFx0aWYgKCBlbGVtLmhhc0F0dHJpYnV0ZSggYXR0cmlidXRlWzBdICkgKSB7XG5cdFx0XHRcdFx0aWYgKCB2YWx1ZSApIHtcblx0XHRcdFx0XHRcdGlmICggZWxlbS5nZXRBdHRyaWJ1dGUoIGF0dHJpYnV0ZVswXSApID09PSBhdHRyaWJ1dGVbMV0gKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBlbGVtO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZWxlbTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgc2VsZWN0b3IgaXMgYSB0YWdcblx0XHRcdGlmICggZWxlbS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHNlbGVjdG9yICkge1xuXHRcdFx0XHRyZXR1cm4gZWxlbTtcblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdHJldHVybiBudWxsO1xuXG5cdH07XG5cblx0LyoqXG5cdCAqIEVzY2FwZSBzcGVjaWFsIGNoYXJhY3RlcnMgZm9yIHVzZSB3aXRoIHF1ZXJ5U2VsZWN0b3Jcblx0ICogQHB1YmxpY1xuXHQgKiBAcGFyYW0ge1N0cmluZ30gaWQgVGhlIGFuY2hvciBJRCB0byBlc2NhcGVcblx0ICogQGF1dGhvciBNYXRoaWFzIEJ5bmVuc1xuXHQgKiBAbGluayBodHRwczovL2dpdGh1Yi5jb20vbWF0aGlhc2J5bmVucy9DU1MuZXNjYXBlXG5cdCAqL1xuXHRzbW9vdGhTY3JvbGwuZXNjYXBlQ2hhcmFjdGVycyA9IGZ1bmN0aW9uICggaWQgKSB7XG5cblx0XHQvLyBSZW1vdmUgbGVhZGluZyBoYXNoXG5cdFx0aWYgKCBpZC5jaGFyQXQoMCkgPT09ICcjJyApIHtcblx0XHRcdGlkID0gaWQuc3Vic3RyKDEpO1xuXHRcdH1cblxuXHRcdHZhciBzdHJpbmcgPSBTdHJpbmcoaWQpO1xuXHRcdHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuXHRcdHZhciBpbmRleCA9IC0xO1xuXHRcdHZhciBjb2RlVW5pdDtcblx0XHR2YXIgcmVzdWx0ID0gJyc7XG5cdFx0dmFyIGZpcnN0Q29kZVVuaXQgPSBzdHJpbmcuY2hhckNvZGVBdCgwKTtcblx0XHR3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuXHRcdFx0Y29kZVVuaXQgPSBzdHJpbmcuY2hhckNvZGVBdChpbmRleCk7XG5cdFx0XHQvLyBOb3RlOiB0aGVyZeKAmXMgbm8gbmVlZCB0byBzcGVjaWFsLWNhc2UgYXN0cmFsIHN5bWJvbHMsIHN1cnJvZ2F0ZVxuXHRcdFx0Ly8gcGFpcnMsIG9yIGxvbmUgc3Vycm9nYXRlcy5cblxuXHRcdFx0Ly8gSWYgdGhlIGNoYXJhY3RlciBpcyBOVUxMIChVKzAwMDApLCB0aGVuIHRocm93IGFuXG5cdFx0XHQvLyBgSW52YWxpZENoYXJhY3RlckVycm9yYCBleGNlcHRpb24gYW5kIHRlcm1pbmF0ZSB0aGVzZSBzdGVwcy5cblx0XHRcdGlmIChjb2RlVW5pdCA9PT0gMHgwMDAwKSB7XG5cdFx0XHRcdHRocm93IG5ldyBJbnZhbGlkQ2hhcmFjdGVyRXJyb3IoXG5cdFx0XHRcdFx0J0ludmFsaWQgY2hhcmFjdGVyOiB0aGUgaW5wdXQgY29udGFpbnMgVSswMDAwLidcblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKFxuXHRcdFx0XHQvLyBJZiB0aGUgY2hhcmFjdGVyIGlzIGluIHRoZSByYW5nZSBbXFwxLVxcMUZdIChVKzAwMDEgdG8gVSswMDFGKSBvciBpc1xuXHRcdFx0XHQvLyBVKzAwN0YsIFvigKZdXG5cdFx0XHRcdChjb2RlVW5pdCA+PSAweDAwMDEgJiYgY29kZVVuaXQgPD0gMHgwMDFGKSB8fCBjb2RlVW5pdCA9PSAweDAwN0YgfHxcblx0XHRcdFx0Ly8gSWYgdGhlIGNoYXJhY3RlciBpcyB0aGUgZmlyc3QgY2hhcmFjdGVyIGFuZCBpcyBpbiB0aGUgcmFuZ2UgWzAtOV1cblx0XHRcdFx0Ly8gKFUrMDAzMCB0byBVKzAwMzkpLCBb4oCmXVxuXHRcdFx0XHQoaW5kZXggPT09IDAgJiYgY29kZVVuaXQgPj0gMHgwMDMwICYmIGNvZGVVbml0IDw9IDB4MDAzOSkgfHxcblx0XHRcdFx0Ly8gSWYgdGhlIGNoYXJhY3RlciBpcyB0aGUgc2Vjb25kIGNoYXJhY3RlciBhbmQgaXMgaW4gdGhlIHJhbmdlIFswLTldXG5cdFx0XHRcdC8vIChVKzAwMzAgdG8gVSswMDM5KSBhbmQgdGhlIGZpcnN0IGNoYXJhY3RlciBpcyBhIGAtYCAoVSswMDJEKSwgW+KApl1cblx0XHRcdFx0KFxuXHRcdFx0XHRcdGluZGV4ID09PSAxICYmXG5cdFx0XHRcdFx0Y29kZVVuaXQgPj0gMHgwMDMwICYmIGNvZGVVbml0IDw9IDB4MDAzOSAmJlxuXHRcdFx0XHRcdGZpcnN0Q29kZVVuaXQgPT09IDB4MDAyRFxuXHRcdFx0XHQpXG5cdFx0XHQpIHtcblx0XHRcdFx0Ly8gaHR0cDovL2Rldi53My5vcmcvY3Nzd2cvY3Nzb20vI2VzY2FwZS1hLWNoYXJhY3Rlci1hcy1jb2RlLXBvaW50XG5cdFx0XHRcdHJlc3VsdCArPSAnXFxcXCcgKyBjb2RlVW5pdC50b1N0cmluZygxNikgKyAnICc7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiB0aGUgY2hhcmFjdGVyIGlzIG5vdCBoYW5kbGVkIGJ5IG9uZSBvZiB0aGUgYWJvdmUgcnVsZXMgYW5kIGlzXG5cdFx0XHQvLyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gVSswMDgwLCBpcyBgLWAgKFUrMDAyRCkgb3IgYF9gIChVKzAwNUYpLCBvclxuXHRcdFx0Ly8gaXMgaW4gb25lIG9mIHRoZSByYW5nZXMgWzAtOV0gKFUrMDAzMCB0byBVKzAwMzkpLCBbQS1aXSAoVSswMDQxIHRvXG5cdFx0XHQvLyBVKzAwNUEpLCBvciBbYS16XSAoVSswMDYxIHRvIFUrMDA3QSksIFvigKZdXG5cdFx0XHRpZiAoXG5cdFx0XHRcdGNvZGVVbml0ID49IDB4MDA4MCB8fFxuXHRcdFx0XHRjb2RlVW5pdCA9PT0gMHgwMDJEIHx8XG5cdFx0XHRcdGNvZGVVbml0ID09PSAweDAwNUYgfHxcblx0XHRcdFx0Y29kZVVuaXQgPj0gMHgwMDMwICYmIGNvZGVVbml0IDw9IDB4MDAzOSB8fFxuXHRcdFx0XHRjb2RlVW5pdCA+PSAweDAwNDEgJiYgY29kZVVuaXQgPD0gMHgwMDVBIHx8XG5cdFx0XHRcdGNvZGVVbml0ID49IDB4MDA2MSAmJiBjb2RlVW5pdCA8PSAweDAwN0Fcblx0XHRcdCkge1xuXHRcdFx0XHQvLyB0aGUgY2hhcmFjdGVyIGl0c2VsZlxuXHRcdFx0XHRyZXN1bHQgKz0gc3RyaW5nLmNoYXJBdChpbmRleCk7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBPdGhlcndpc2UsIHRoZSBlc2NhcGVkIGNoYXJhY3Rlci5cblx0XHRcdC8vIGh0dHA6Ly9kZXYudzMub3JnL2Nzc3dnL2Nzc29tLyNlc2NhcGUtYS1jaGFyYWN0ZXJcblx0XHRcdHJlc3VsdCArPSAnXFxcXCcgKyBzdHJpbmcuY2hhckF0KGluZGV4KTtcblxuXHRcdH1cblxuXHRcdHJldHVybiAnIycgKyByZXN1bHQ7XG5cblx0fTtcblxuXHQvKipcblx0ICogQ2FsY3VsYXRlIHRoZSBlYXNpbmcgcGF0dGVyblxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAbGluayBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9ncmUvMTY1MDI5NFxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBFYXNpbmcgcGF0dGVyblxuXHQgKiBAcGFyYW0ge051bWJlcn0gdGltZSBUaW1lIGFuaW1hdGlvbiBzaG91bGQgdGFrZSB0byBjb21wbGV0ZVxuXHQgKiBAcmV0dXJucyB7TnVtYmVyfVxuXHQgKi9cblx0dmFyIGVhc2luZ1BhdHRlcm4gPSBmdW5jdGlvbiAoIHR5cGUsIHRpbWUgKSB7XG5cdFx0dmFyIHBhdHRlcm47XG5cdFx0aWYgKCB0eXBlID09PSAnZWFzZUluUXVhZCcgKSBwYXR0ZXJuID0gdGltZSAqIHRpbWU7IC8vIGFjY2VsZXJhdGluZyBmcm9tIHplcm8gdmVsb2NpdHlcblx0XHRpZiAoIHR5cGUgPT09ICdlYXNlT3V0UXVhZCcgKSBwYXR0ZXJuID0gdGltZSAqICgyIC0gdGltZSk7IC8vIGRlY2VsZXJhdGluZyB0byB6ZXJvIHZlbG9jaXR5XG5cdFx0aWYgKCB0eXBlID09PSAnZWFzZUluT3V0UXVhZCcgKSBwYXR0ZXJuID0gdGltZSA8IDAuNSA/IDIgKiB0aW1lICogdGltZSA6IC0xICsgKDQgLSAyICogdGltZSkgKiB0aW1lOyAvLyBhY2NlbGVyYXRpb24gdW50aWwgaGFsZndheSwgdGhlbiBkZWNlbGVyYXRpb25cblx0XHRpZiAoIHR5cGUgPT09ICdlYXNlSW5DdWJpYycgKSBwYXR0ZXJuID0gdGltZSAqIHRpbWUgKiB0aW1lOyAvLyBhY2NlbGVyYXRpbmcgZnJvbSB6ZXJvIHZlbG9jaXR5XG5cdFx0aWYgKCB0eXBlID09PSAnZWFzZU91dEN1YmljJyApIHBhdHRlcm4gPSAoLS10aW1lKSAqIHRpbWUgKiB0aW1lICsgMTsgLy8gZGVjZWxlcmF0aW5nIHRvIHplcm8gdmVsb2NpdHlcblx0XHRpZiAoIHR5cGUgPT09ICdlYXNlSW5PdXRDdWJpYycgKSBwYXR0ZXJuID0gdGltZSA8IDAuNSA/IDQgKiB0aW1lICogdGltZSAqIHRpbWUgOiAodGltZSAtIDEpICogKDIgKiB0aW1lIC0gMikgKiAoMiAqIHRpbWUgLSAyKSArIDE7IC8vIGFjY2VsZXJhdGlvbiB1bnRpbCBoYWxmd2F5LCB0aGVuIGRlY2VsZXJhdGlvblxuXHRcdGlmICggdHlwZSA9PT0gJ2Vhc2VJblF1YXJ0JyApIHBhdHRlcm4gPSB0aW1lICogdGltZSAqIHRpbWUgKiB0aW1lOyAvLyBhY2NlbGVyYXRpbmcgZnJvbSB6ZXJvIHZlbG9jaXR5XG5cdFx0aWYgKCB0eXBlID09PSAnZWFzZU91dFF1YXJ0JyApIHBhdHRlcm4gPSAxIC0gKC0tdGltZSkgKiB0aW1lICogdGltZSAqIHRpbWU7IC8vIGRlY2VsZXJhdGluZyB0byB6ZXJvIHZlbG9jaXR5XG5cdFx0aWYgKCB0eXBlID09PSAnZWFzZUluT3V0UXVhcnQnICkgcGF0dGVybiA9IHRpbWUgPCAwLjUgPyA4ICogdGltZSAqIHRpbWUgKiB0aW1lICogdGltZSA6IDEgLSA4ICogKC0tdGltZSkgKiB0aW1lICogdGltZSAqIHRpbWU7IC8vIGFjY2VsZXJhdGlvbiB1bnRpbCBoYWxmd2F5LCB0aGVuIGRlY2VsZXJhdGlvblxuXHRcdGlmICggdHlwZSA9PT0gJ2Vhc2VJblF1aW50JyApIHBhdHRlcm4gPSB0aW1lICogdGltZSAqIHRpbWUgKiB0aW1lICogdGltZTsgLy8gYWNjZWxlcmF0aW5nIGZyb20gemVybyB2ZWxvY2l0eVxuXHRcdGlmICggdHlwZSA9PT0gJ2Vhc2VPdXRRdWludCcgKSBwYXR0ZXJuID0gMSArICgtLXRpbWUpICogdGltZSAqIHRpbWUgKiB0aW1lICogdGltZTsgLy8gZGVjZWxlcmF0aW5nIHRvIHplcm8gdmVsb2NpdHlcblx0XHRpZiAoIHR5cGUgPT09ICdlYXNlSW5PdXRRdWludCcgKSBwYXR0ZXJuID0gdGltZSA8IDAuNSA/IDE2ICogdGltZSAqIHRpbWUgKiB0aW1lICogdGltZSAqIHRpbWUgOiAxICsgMTYgKiAoLS10aW1lKSAqIHRpbWUgKiB0aW1lICogdGltZSAqIHRpbWU7IC8vIGFjY2VsZXJhdGlvbiB1bnRpbCBoYWxmd2F5LCB0aGVuIGRlY2VsZXJhdGlvblxuXHRcdHJldHVybiBwYXR0ZXJuIHx8IHRpbWU7IC8vIG5vIGVhc2luZywgbm8gYWNjZWxlcmF0aW9uXG5cdH07XG5cblx0LyoqXG5cdCAqIENhbGN1bGF0ZSBob3cgZmFyIHRvIHNjcm9sbFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGFuY2hvciBUaGUgYW5jaG9yIGVsZW1lbnQgdG8gc2Nyb2xsIHRvXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBoZWFkZXJIZWlnaHQgSGVpZ2h0IG9mIGEgZml4ZWQgaGVhZGVyLCBpZiBhbnlcblx0ICogQHBhcmFtIHtOdW1iZXJ9IG9mZnNldCBOdW1iZXIgb2YgcGl4ZWxzIGJ5IHdoaWNoIHRvIG9mZnNldCBzY3JvbGxcblx0ICogQHJldHVybnMge051bWJlcn1cblx0ICovXG5cdHZhciBnZXRFbmRMb2NhdGlvbiA9IGZ1bmN0aW9uICggYW5jaG9yLCBoZWFkZXJIZWlnaHQsIG9mZnNldCApIHtcblx0XHR2YXIgbG9jYXRpb24gPSAwO1xuXHRcdGlmIChhbmNob3Iub2Zmc2V0UGFyZW50KSB7XG5cdFx0XHRkbyB7XG5cdFx0XHRcdGxvY2F0aW9uICs9IGFuY2hvci5vZmZzZXRUb3A7XG5cdFx0XHRcdGFuY2hvciA9IGFuY2hvci5vZmZzZXRQYXJlbnQ7XG5cdFx0XHR9IHdoaWxlIChhbmNob3IpO1xuXHRcdH1cblx0XHRsb2NhdGlvbiA9IGxvY2F0aW9uIC0gaGVhZGVySGVpZ2h0IC0gb2Zmc2V0O1xuXHRcdHJldHVybiBsb2NhdGlvbiA+PSAwID8gbG9jYXRpb24gOiAwO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgdGhlIGRvY3VtZW50J3MgaGVpZ2h0XG5cdCAqIEBwcml2YXRlXG5cdCAqIEByZXR1cm5zIHtOdW1iZXJ9XG5cdCAqL1xuXHR2YXIgZ2V0RG9jdW1lbnRIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIE1hdGgubWF4KFxuXHRcdFx0cm9vdC5kb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCwgcm9vdC5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0LFxuXHRcdFx0cm9vdC5kb2N1bWVudC5ib2R5Lm9mZnNldEhlaWdodCwgcm9vdC5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0LFxuXHRcdFx0cm9vdC5kb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodCwgcm9vdC5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0XG5cdFx0KTtcblx0fTtcblxuXHQvKipcblx0ICogQ29udmVydCBkYXRhLW9wdGlvbnMgYXR0cmlidXRlIGludG8gYW4gb2JqZWN0IG9mIGtleS92YWx1ZSBwYWlyc1xuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucyBMaW5rLXNwZWNpZmljIG9wdGlvbnMgYXMgYSBkYXRhIGF0dHJpYnV0ZSBzdHJpbmdcblx0ICogQHJldHVybnMge09iamVjdH1cblx0ICovXG5cdHZhciBnZXREYXRhT3B0aW9ucyA9IGZ1bmN0aW9uICggb3B0aW9ucyApIHtcblx0XHRyZXR1cm4gIW9wdGlvbnMgfHwgISh0eXBlb2YgSlNPTiA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIEpTT04ucGFyc2UgPT09ICdmdW5jdGlvbicpID8ge30gOiBKU09OLnBhcnNlKCBvcHRpb25zICk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFVwZGF0ZSB0aGUgVVJMXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gYW5jaG9yIFRoZSBlbGVtZW50IHRvIHNjcm9sbCB0b1xuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IHVybCBXaGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIFVSTCBoaXN0b3J5XG5cdCAqL1xuXHR2YXIgdXBkYXRlVXJsID0gZnVuY3Rpb24gKCBhbmNob3IsIHVybCApIHtcblx0XHRpZiAoIHJvb3QuaGlzdG9yeS5wdXNoU3RhdGUgJiYgKHVybCB8fCB1cmwgPT09ICd0cnVlJykgJiYgcm9vdC5sb2NhdGlvbi5wcm90b2NvbCAhPT0gJ2ZpbGU6JyApIHtcblx0XHRcdHJvb3QuaGlzdG9yeS5wdXNoU3RhdGUoIG51bGwsIG51bGwsIFtyb290LmxvY2F0aW9uLnByb3RvY29sLCAnLy8nLCByb290LmxvY2F0aW9uLmhvc3QsIHJvb3QubG9jYXRpb24ucGF0aG5hbWUsIHJvb3QubG9jYXRpb24uc2VhcmNoLCBhbmNob3JdLmpvaW4oJycpICk7XG5cdFx0fVxuXHR9O1xuXG5cdHZhciBnZXRIZWFkZXJIZWlnaHQgPSBmdW5jdGlvbiAoIGhlYWRlciApIHtcblx0XHRyZXR1cm4gaGVhZGVyID09PSBudWxsID8gMCA6ICggZ2V0SGVpZ2h0KCBoZWFkZXIgKSArIGhlYWRlci5vZmZzZXRUb3AgKTtcblx0fTtcblxuXHQvKipcblx0ICogU3RhcnQvc3RvcCB0aGUgc2Nyb2xsaW5nIGFuaW1hdGlvblxuXHQgKiBAcHVibGljXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gYW5jaG9yIFRoZSBlbGVtZW50IHRvIHNjcm9sbCB0b1xuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IHRvZ2dsZSBUaGUgZWxlbWVudCB0aGF0IHRvZ2dsZWQgdGhlIHNjcm9sbCBldmVudFxuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuXHQgKi9cblx0c21vb3RoU2Nyb2xsLmFuaW1hdGVTY3JvbGwgPSBmdW5jdGlvbiAoIGFuY2hvciwgdG9nZ2xlLCBvcHRpb25zICkge1xuXG5cdFx0Ly8gT3B0aW9ucyBhbmQgb3ZlcnJpZGVzXG5cdFx0dmFyIG92ZXJyaWRlcyA9IGdldERhdGFPcHRpb25zKCB0b2dnbGUgPyB0b2dnbGUuZ2V0QXR0cmlidXRlKCdkYXRhLW9wdGlvbnMnKSA6IG51bGwgKTtcblx0XHR2YXIgYW5pbWF0ZVNldHRpbmdzID0gZXh0ZW5kKCBzZXR0aW5ncyB8fCBkZWZhdWx0cywgb3B0aW9ucyB8fCB7fSwgb3ZlcnJpZGVzICk7IC8vIE1lcmdlIHVzZXIgb3B0aW9ucyB3aXRoIGRlZmF1bHRzXG5cblx0XHQvLyBTZWxlY3RvcnMgYW5kIHZhcmlhYmxlc1xuXHRcdHZhciBpc051bSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCggYW5jaG9yICkgPT09ICdbb2JqZWN0IE51bWJlcl0nID8gdHJ1ZSA6IGZhbHNlO1xuXHRcdHZhciBhbmNob3JFbGVtID0gaXNOdW0gPyBudWxsIDogKCBhbmNob3IgPT09ICcjJyA/IHJvb3QuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IDogcm9vdC5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKGFuY2hvcikgKTtcblx0XHRpZiAoICFpc051bSAmJiAhYW5jaG9yRWxlbSApIHJldHVybjtcblx0XHR2YXIgc3RhcnRMb2NhdGlvbiA9IHJvb3QucGFnZVlPZmZzZXQ7IC8vIEN1cnJlbnQgbG9jYXRpb24gb24gdGhlIHBhZ2Vcblx0XHRpZiAoICFmaXhlZEhlYWRlciApIHsgZml4ZWRIZWFkZXIgPSByb290LmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIGFuaW1hdGVTZXR0aW5ncy5zZWxlY3RvckhlYWRlciApOyB9ICAvLyBHZXQgdGhlIGZpeGVkIGhlYWRlciBpZiBub3QgYWxyZWFkeSBzZXRcblx0XHRpZiAoICFoZWFkZXJIZWlnaHQgKSB7IGhlYWRlckhlaWdodCA9IGdldEhlYWRlckhlaWdodCggZml4ZWRIZWFkZXIgKTsgfSAvLyBHZXQgdGhlIGhlaWdodCBvZiBhIGZpeGVkIGhlYWRlciBpZiBvbmUgZXhpc3RzIGFuZCBub3QgYWxyZWFkeSBzZXRcblx0XHR2YXIgZW5kTG9jYXRpb24gPSBpc051bSA/IGFuY2hvciA6IGdldEVuZExvY2F0aW9uKCBhbmNob3JFbGVtLCBoZWFkZXJIZWlnaHQsIHBhcnNlSW50KGFuaW1hdGVTZXR0aW5ncy5vZmZzZXQsIDEwKSApOyAvLyBMb2NhdGlvbiB0byBzY3JvbGwgdG9cblx0XHR2YXIgZGlzdGFuY2UgPSBlbmRMb2NhdGlvbiAtIHN0YXJ0TG9jYXRpb247IC8vIGRpc3RhbmNlIHRvIHRyYXZlbFxuXHRcdHZhciBkb2N1bWVudEhlaWdodCA9IGdldERvY3VtZW50SGVpZ2h0KCk7XG5cdFx0dmFyIHRpbWVMYXBzZWQgPSAwO1xuXHRcdHZhciBwZXJjZW50YWdlLCBwb3NpdGlvbjtcblxuXHRcdC8vIFVwZGF0ZSBVUkxcblx0XHRpZiAoICFpc051bSApIHtcblx0XHRcdHVwZGF0ZVVybChhbmNob3IsIGFuaW1hdGVTZXR0aW5ncy51cGRhdGVVUkwpO1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIFN0b3AgdGhlIHNjcm9sbCBhbmltYXRpb24gd2hlbiBpdCByZWFjaGVzIGl0cyB0YXJnZXQgKG9yIHRoZSBib3R0b20vdG9wIG9mIHBhZ2UpXG5cdFx0ICogQHByaXZhdGVcblx0XHQgKiBAcGFyYW0ge051bWJlcn0gcG9zaXRpb24gQ3VycmVudCBwb3NpdGlvbiBvbiB0aGUgcGFnZVxuXHRcdCAqIEBwYXJhbSB7TnVtYmVyfSBlbmRMb2NhdGlvbiBTY3JvbGwgdG8gbG9jYXRpb25cblx0XHQgKiBAcGFyYW0ge051bWJlcn0gYW5pbWF0aW9uSW50ZXJ2YWwgSG93IG11Y2ggdG8gc2Nyb2xsIG9uIHRoaXMgbG9vcFxuXHRcdCAqL1xuXHRcdHZhciBzdG9wQW5pbWF0ZVNjcm9sbCA9IGZ1bmN0aW9uIChwb3NpdGlvbiwgZW5kTG9jYXRpb24sIGFuaW1hdGlvbkludGVydmFsKSB7XG5cdFx0XHR2YXIgY3VycmVudExvY2F0aW9uID0gcm9vdC5wYWdlWU9mZnNldDtcblx0XHRcdGlmICggcG9zaXRpb24gPT0gZW5kTG9jYXRpb24gfHwgY3VycmVudExvY2F0aW9uID09IGVuZExvY2F0aW9uIHx8ICggKHJvb3QuaW5uZXJIZWlnaHQgKyBjdXJyZW50TG9jYXRpb24pID49IGRvY3VtZW50SGVpZ2h0ICkgKSB7XG5cdFx0XHRcdGNsZWFySW50ZXJ2YWwoYW5pbWF0aW9uSW50ZXJ2YWwpO1xuXHRcdFx0XHRpZiAoICFpc051bSApIHtcblx0XHRcdFx0XHRhbmNob3JFbGVtLmZvY3VzKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0YW5pbWF0ZVNldHRpbmdzLmNhbGxiYWNrKCBhbmNob3IsIHRvZ2dsZSApOyAvLyBSdW4gY2FsbGJhY2tzIGFmdGVyIGFuaW1hdGlvbiBjb21wbGV0ZVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBMb29wIHNjcm9sbGluZyBhbmltYXRpb25cblx0XHQgKiBAcHJpdmF0ZVxuXHRcdCAqL1xuXHRcdHZhciBsb29wQW5pbWF0ZVNjcm9sbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHRpbWVMYXBzZWQgKz0gMTY7XG5cdFx0XHRwZXJjZW50YWdlID0gKCB0aW1lTGFwc2VkIC8gcGFyc2VJbnQoYW5pbWF0ZVNldHRpbmdzLnNwZWVkLCAxMCkgKTtcblx0XHRcdHBlcmNlbnRhZ2UgPSAoIHBlcmNlbnRhZ2UgPiAxICkgPyAxIDogcGVyY2VudGFnZTtcblx0XHRcdHBvc2l0aW9uID0gc3RhcnRMb2NhdGlvbiArICggZGlzdGFuY2UgKiBlYXNpbmdQYXR0ZXJuKGFuaW1hdGVTZXR0aW5ncy5lYXNpbmcsIHBlcmNlbnRhZ2UpICk7XG5cdFx0XHRyb290LnNjcm9sbFRvKCAwLCBNYXRoLmZsb29yKHBvc2l0aW9uKSApO1xuXHRcdFx0c3RvcEFuaW1hdGVTY3JvbGwocG9zaXRpb24sIGVuZExvY2F0aW9uLCBhbmltYXRpb25JbnRlcnZhbCk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFNldCBpbnRlcnZhbCB0aW1lclxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dmFyIHN0YXJ0QW5pbWF0ZVNjcm9sbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGNsZWFySW50ZXJ2YWwoYW5pbWF0aW9uSW50ZXJ2YWwpO1xuXHRcdFx0YW5pbWF0aW9uSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChsb29wQW5pbWF0ZVNjcm9sbCwgMTYpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXNldCBwb3NpdGlvbiB0byBmaXggd2VpcmQgaU9TIGJ1Z1xuXHRcdCAqIEBsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9jZmVyZGluYW5kaS9zbW9vdGgtc2Nyb2xsL2lzc3Vlcy80NVxuXHRcdCAqL1xuXHRcdGlmICggcm9vdC5wYWdlWU9mZnNldCA9PT0gMCApIHtcblx0XHRcdHJvb3Quc2Nyb2xsVG8oIDAsIDAgKTtcblx0XHR9XG5cblx0XHQvLyBTdGFydCBzY3JvbGxpbmcgYW5pbWF0aW9uXG5cdFx0c3RhcnRBbmltYXRlU2Nyb2xsKCk7XG5cblx0fTtcblxuXHQvKipcblx0ICogSWYgc21vb3RoIHNjcm9sbCBlbGVtZW50IGNsaWNrZWQsIGFuaW1hdGUgc2Nyb2xsXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHR2YXIgZXZlbnRIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cblx0XHQvLyBEb24ndCBydW4gaWYgcmlnaHQtY2xpY2sgb3IgY29tbWFuZC9jb250cm9sICsgY2xpY2tcblx0XHRpZiAoIGV2ZW50LmJ1dHRvbiAhPT0gMCB8fCBldmVudC5tZXRhS2V5IHx8IGV2ZW50LmN0cmxLZXkgKSByZXR1cm47XG5cblx0XHQvLyBJZiBhIHNtb290aCBzY3JvbGwgbGluaywgYW5pbWF0ZSBpdFxuXHRcdHZhciB0b2dnbGUgPSBnZXRDbG9zZXN0KCBldmVudC50YXJnZXQsIHNldHRpbmdzLnNlbGVjdG9yICk7XG5cdFx0aWYgKCB0b2dnbGUgJiYgdG9nZ2xlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2EnICkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTsgLy8gUHJldmVudCBkZWZhdWx0IGNsaWNrIGV2ZW50XG5cdFx0XHR2YXIgaGFzaCA9IHNtb290aFNjcm9sbC5lc2NhcGVDaGFyYWN0ZXJzKCB0b2dnbGUuaGFzaCApOyAvLyBFc2NhcGUgaGFzaCBjaGFyYWN0ZXJzXG5cdFx0XHRzbW9vdGhTY3JvbGwuYW5pbWF0ZVNjcm9sbCggaGFzaCwgdG9nZ2xlLCBzZXR0aW5ncyk7IC8vIEFuaW1hdGUgc2Nyb2xsXG5cdFx0fVxuXG5cdH07XG5cblx0LyoqXG5cdCAqIE9uIHdpbmRvdyBzY3JvbGwgYW5kIHJlc2l6ZSwgb25seSBydW4gZXZlbnRzIGF0IGEgcmF0ZSBvZiAxNWZwcyBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSAge0Z1bmN0aW9ufSBldmVudFRpbWVvdXQgVGltZW91dCBmdW5jdGlvblxuXHQgKiBAcGFyYW0gIHtPYmplY3R9IHNldHRpbmdzXG5cdCAqL1xuXHR2YXIgZXZlbnRUaHJvdHRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHRpZiAoICFldmVudFRpbWVvdXQgKSB7XG5cdFx0XHRldmVudFRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRldmVudFRpbWVvdXQgPSBudWxsOyAvLyBSZXNldCB0aW1lb3V0XG5cdFx0XHRcdGhlYWRlckhlaWdodCA9IGdldEhlYWRlckhlaWdodCggZml4ZWRIZWFkZXIgKTsgLy8gR2V0IHRoZSBoZWlnaHQgb2YgYSBmaXhlZCBoZWFkZXIgaWYgb25lIGV4aXN0c1xuXHRcdFx0fSwgNjYpO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogRGVzdHJveSB0aGUgY3VycmVudCBpbml0aWFsaXphdGlvbi5cblx0ICogQHB1YmxpY1xuXHQgKi9cblx0c21vb3RoU2Nyb2xsLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG5cblx0XHQvLyBJZiBwbHVnaW4gaXNuJ3QgYWxyZWFkeSBpbml0aWFsaXplZCwgc3RvcFxuXHRcdGlmICggIXNldHRpbmdzICkgcmV0dXJuO1xuXG5cdFx0Ly8gUmVtb3ZlIGV2ZW50IGxpc3RlbmVyc1xuXHRcdHJvb3QuZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2NsaWNrJywgZXZlbnRIYW5kbGVyLCBmYWxzZSApO1xuXHRcdHJvb3QucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ3Jlc2l6ZScsIGV2ZW50VGhyb3R0bGVyLCBmYWxzZSApO1xuXG5cdFx0Ly8gUmVzZXQgdmFyYWlibGVzXG5cdFx0c2V0dGluZ3MgPSBudWxsO1xuXHRcdGV2ZW50VGltZW91dCA9IG51bGw7XG5cdFx0Zml4ZWRIZWFkZXIgPSBudWxsO1xuXHRcdGhlYWRlckhlaWdodCA9IG51bGw7XG5cdFx0YW5pbWF0aW9uSW50ZXJ2YWwgPSBudWxsO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBJbml0aWFsaXplIFNtb290aCBTY3JvbGxcblx0ICogQHB1YmxpY1xuXHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBVc2VyIHNldHRpbmdzXG5cdCAqL1xuXHRzbW9vdGhTY3JvbGwuaW5pdCA9IGZ1bmN0aW9uICggb3B0aW9ucyApIHtcblxuXHRcdC8vIGZlYXR1cmUgdGVzdFxuXHRcdGlmICggIXN1cHBvcnRzICkgcmV0dXJuO1xuXG5cdFx0Ly8gRGVzdHJveSBhbnkgZXhpc3RpbmcgaW5pdGlhbGl6YXRpb25zXG5cdFx0c21vb3RoU2Nyb2xsLmRlc3Ryb3koKTtcblxuXHRcdC8vIFNlbGVjdG9ycyBhbmQgdmFyaWFibGVzXG5cdFx0c2V0dGluZ3MgPSBleHRlbmQoIGRlZmF1bHRzLCBvcHRpb25zIHx8IHt9ICk7IC8vIE1lcmdlIHVzZXIgb3B0aW9ucyB3aXRoIGRlZmF1bHRzXG5cdFx0Zml4ZWRIZWFkZXIgPSByb290LmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIHNldHRpbmdzLnNlbGVjdG9ySGVhZGVyICk7IC8vIEdldCB0aGUgZml4ZWQgaGVhZGVyXG5cdFx0aGVhZGVySGVpZ2h0ID0gZ2V0SGVhZGVySGVpZ2h0KCBmaXhlZEhlYWRlciApO1xuXG5cdFx0Ly8gV2hlbiBhIHRvZ2dsZSBpcyBjbGlja2VkLCBydW4gdGhlIGNsaWNrIGhhbmRsZXJcblx0XHRyb290LmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnRIYW5kbGVyLCBmYWxzZSApO1xuXHRcdGlmICggZml4ZWRIZWFkZXIgKSB7IHJvb3QuYWRkRXZlbnRMaXN0ZW5lciggJ3Jlc2l6ZScsIGV2ZW50VGhyb3R0bGVyLCBmYWxzZSApOyB9XG5cblx0fTtcblxuXG5cdC8vXG5cdC8vIFB1YmxpYyBBUElzXG5cdC8vXG5cblx0cmV0dXJuIHNtb290aFNjcm9sbDtcblxufSk7IiwidmFyIHNiaV9qc19leGlzdHMgPSAodHlwZW9mIHNiaV9qc19leGlzdHMgIT09ICd1bmRlZmluZWQnKSA/IHRydWUgOiBmYWxzZTtcclxuaWYoIXNiaV9qc19leGlzdHMpe1xyXG5cclxuXHQoZnVuY3Rpb24oKXt2YXIgZSx0O2U9ZnVuY3Rpb24oKXtmdW5jdGlvbiBlKGUsdCl7dmFyIG4scjt0aGlzLm9wdGlvbnM9e3RhcmdldDpcImluc3RhZmVlZFwiLGdldDpcInBvcHVsYXJcIixyZXNvbHV0aW9uOlwidGh1bWJuYWlsXCIsc29ydEJ5Olwibm9uZVwiLGxpbmtzOiEwLG1vY2s6ITEsdXNlSHR0cDohMX07aWYodHlwZW9mIGU9PVwib2JqZWN0XCIpZm9yKG4gaW4gZSlyPWVbbl0sdGhpcy5vcHRpb25zW25dPXI7dGhpcy5jb250ZXh0PXQhPW51bGw/dDp0aGlzLHRoaXMudW5pcXVlPXRoaXMuX2dlbktleSgpfXJldHVybiBlLnByb3RvdHlwZS5oYXNOZXh0PWZ1bmN0aW9uKCl7cmV0dXJuIHR5cGVvZiB0aGlzLmNvbnRleHQubmV4dFVybD09XCJzdHJpbmdcIiYmdGhpcy5jb250ZXh0Lm5leHRVcmwubGVuZ3RoPjB9LGUucHJvdG90eXBlLm5leHQ9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5oYXNOZXh0KCk/dGhpcy5ydW4odGhpcy5jb250ZXh0Lm5leHRVcmwpOiExfSxlLnByb3RvdHlwZS5ydW49ZnVuY3Rpb24odCl7dmFyIG4scixpO2lmKHR5cGVvZiB0aGlzLm9wdGlvbnMuY2xpZW50SWQhPVwic3RyaW5nXCImJnR5cGVvZiB0aGlzLm9wdGlvbnMuYWNjZXNzVG9rZW4hPVwic3RyaW5nXCIpdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBjbGllbnRJZCBvciBhY2Nlc3NUb2tlbi5cIik7aWYodHlwZW9mIHRoaXMub3B0aW9ucy5hY2Nlc3NUb2tlbiE9XCJzdHJpbmdcIiYmdHlwZW9mIHRoaXMub3B0aW9ucy5jbGllbnRJZCE9XCJzdHJpbmdcIil0aHJvdyBuZXcgRXJyb3IoXCJNaXNzaW5nIGNsaWVudElkIG9yIGFjY2Vzc1Rva2VuLlwiKTtyZXR1cm4gdGhpcy5vcHRpb25zLmJlZm9yZSE9bnVsbCYmdHlwZW9mIHRoaXMub3B0aW9ucy5iZWZvcmU9PVwiZnVuY3Rpb25cIiYmdGhpcy5vcHRpb25zLmJlZm9yZS5jYWxsKHRoaXMpLHR5cGVvZiBkb2N1bWVudCE9XCJ1bmRlZmluZWRcIiYmZG9jdW1lbnQhPT1udWxsJiYoaT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpLGkuaWQ9XCJpbnN0YWZlZWQtZmV0Y2hlclwiLGkuc3JjPXR8fHRoaXMuX2J1aWxkVXJsKCksbj1kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIiksblswXS5hcHBlbmRDaGlsZChpKSxyPVwiaW5zdGFmZWVkQ2FjaGVcIit0aGlzLnVuaXF1ZSx3aW5kb3dbcl09bmV3IGUodGhpcy5vcHRpb25zLHRoaXMpLHdpbmRvd1tyXS51bmlxdWU9dGhpcy51bmlxdWUpLCEwfSxlLnByb3RvdHlwZS5wYXJzZT1mdW5jdGlvbihlKXt2YXIgdCxuLHIsaSxzLG8sdSxhLGYsbCxjLGgscCxkLHYsbSxnLHksYix3LEUsUztpZih0eXBlb2YgZSE9XCJvYmplY3RcIil7aWYodGhpcy5vcHRpb25zLmVycm9yIT1udWxsJiZ0eXBlb2YgdGhpcy5vcHRpb25zLmVycm9yPT1cImZ1bmN0aW9uXCIpcmV0dXJuIHRoaXMub3B0aW9ucy5lcnJvci5jYWxsKHRoaXMsXCJJbnZhbGlkIEpTT04gZGF0YVwiKSwhMTt0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIEpTT04gcmVzcG9uc2VcIil9aWYoZS5tZXRhLmNvZGUhPT0yMDApe2lmKHRoaXMub3B0aW9ucy5lcnJvciE9bnVsbCYmdHlwZW9mIHRoaXMub3B0aW9ucy5lcnJvcj09XCJmdW5jdGlvblwiKXJldHVybiB0aGlzLm9wdGlvbnMuZXJyb3IuY2FsbCh0aGlzLGUubWV0YS5lcnJvcl9tZXNzYWdlKSwhMTt0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciBmcm9tIEluc3RhZ3JhbTogXCIrZS5tZXRhLmVycm9yX21lc3NhZ2UpfWlmKGUuZGF0YS5sZW5ndGg9PT0wKXtpZih0aGlzLm9wdGlvbnMuZXJyb3IhPW51bGwmJnR5cGVvZiB0aGlzLm9wdGlvbnMuZXJyb3I9PVwiZnVuY3Rpb25cIilyZXR1cm4gdGhpcy5vcHRpb25zLmVycm9yLmNhbGwodGhpcyxcIk5vIGltYWdlcyB3ZXJlIHJldHVybmVkIGZyb20gSW5zdGFncmFtXCIpLCExO3Rocm93IG5ldyBFcnJvcihcIk5vIGltYWdlcyB3ZXJlIHJldHVybmVkIGZyb20gSW5zdGFncmFtXCIpfXRoaXMub3B0aW9ucy5zdWNjZXNzIT1udWxsJiZ0eXBlb2YgdGhpcy5vcHRpb25zLnN1Y2Nlc3M9PVwiZnVuY3Rpb25cIiYmdGhpcy5vcHRpb25zLnN1Y2Nlc3MuY2FsbCh0aGlzLGUpLHRoaXMuY29udGV4dC5uZXh0VXJsPVwiXCIsZS5wYWdpbmF0aW9uIT1udWxsJiYodGhpcy5jb250ZXh0Lm5leHRVcmw9ZS5wYWdpbmF0aW9uLm5leHRfdXJsKTtpZih0aGlzLm9wdGlvbnMuc29ydEJ5IT09XCJub25lXCIpe3RoaXMub3B0aW9ucy5zb3J0Qnk9PT1cInJhbmRvbVwiP2Q9W1wiXCIsXCJyYW5kb21cIl06ZD10aGlzLm9wdGlvbnMuc29ydEJ5LnNwbGl0KFwiLVwiKSxwPWRbMF09PT1cImxlYXN0XCI/ITA6ITE7c3dpdGNoKGRbMV0pe2Nhc2VcInJhbmRvbVwiOmUuZGF0YS5zb3J0KGZ1bmN0aW9uKCl7cmV0dXJuLjUtTWF0aC5yYW5kb20oKX0pO2JyZWFrO2Nhc2VcInJlY2VudFwiOmUuZGF0YT10aGlzLl9zb3J0QnkoZS5kYXRhLFwiY3JlYXRlZF90aW1lXCIscCk7YnJlYWs7Y2FzZVwibGlrZWRcIjplLmRhdGE9dGhpcy5fc29ydEJ5KGUuZGF0YSxcImxpa2VzLmNvdW50XCIscCk7YnJlYWs7Y2FzZVwiY29tbWVudGVkXCI6ZS5kYXRhPXRoaXMuX3NvcnRCeShlLmRhdGEsXCJjb21tZW50cy5jb3VudFwiLHApO2JyZWFrO2RlZmF1bHQ6dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBvcHRpb24gZm9yIHNvcnRCeTogJ1wiK3RoaXMub3B0aW9ucy5zb3J0QnkrXCInLlwiKX19aWYodHlwZW9mIGRvY3VtZW50IT1cInVuZGVmaW5lZFwiJiZkb2N1bWVudCE9PW51bGwmJnRoaXMub3B0aW9ucy5tb2NrPT09ITEpe2E9ZS5kYXRhLHRoaXMub3B0aW9ucy5saW1pdCE9bnVsbCYmYS5sZW5ndGg+dGhpcy5vcHRpb25zLmxpbWl0JiYoYT1hLnNsaWNlKDAsdGhpcy5vcHRpb25zLmxpbWl0KzF8fDllOSkpLG49ZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLHRoaXMub3B0aW9ucy5maWx0ZXIhPW51bGwmJnR5cGVvZiB0aGlzLm9wdGlvbnMuZmlsdGVyPT1cImZ1bmN0aW9uXCImJihhPXRoaXMuX2ZpbHRlcihhLHRoaXMub3B0aW9ucy5maWx0ZXIpKTtpZih0aGlzLm9wdGlvbnMudGVtcGxhdGUhPW51bGwmJnR5cGVvZiB0aGlzLm9wdGlvbnMudGVtcGxhdGU9PVwic3RyaW5nXCIpe2k9XCJcIixvPVwiXCIsbD1cIlwiLHY9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtmb3IobT0wLGI9YS5sZW5ndGg7bTxiO20rKylzPWFbbV0sdT1zLmltYWdlc1t0aGlzLm9wdGlvbnMucmVzb2x1dGlvbl0udXJsLHRoaXMub3B0aW9ucy51c2VIdHRwfHwodT11LnJlcGxhY2UoXCJodHRwOi8vXCIsXCIvL1wiKSksbz10aGlzLl9tYWtlVGVtcGxhdGUodGhpcy5vcHRpb25zLnRlbXBsYXRlLHttb2RlbDpzLGlkOnMuaWQsbGluazpzLmxpbmssaW1hZ2U6dSxjYXB0aW9uOnRoaXMuX2dldE9iamVjdFByb3BlcnR5KHMsXCJjYXB0aW9uLnRleHRcIiksbGlrZXM6cy5saWtlcy5jb3VudCxjb21tZW50czpzLmNvbW1lbnRzLmNvdW50LGxvY2F0aW9uOnRoaXMuX2dldE9iamVjdFByb3BlcnR5KHMsXCJsb2NhdGlvbi5uYW1lXCIpfSksaSs9bzt2LmlubmVySFRNTD1pLFM9W10uc2xpY2UuY2FsbCh2LmNoaWxkTm9kZXMpO2ZvcihnPTAsdz1TLmxlbmd0aDtnPHc7ZysrKWg9U1tnXSxuLmFwcGVuZENoaWxkKGgpfWVsc2UgZm9yKHk9MCxFPWEubGVuZ3RoO3k8RTt5Kyspcz1hW3ldLGY9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKSx1PXMuaW1hZ2VzW3RoaXMub3B0aW9ucy5yZXNvbHV0aW9uXS51cmwsdGhpcy5vcHRpb25zLnVzZUh0dHB8fCh1PXUucmVwbGFjZShcImh0dHA6Ly9cIixcIi8vXCIpKSxmLnNyYz11LHRoaXMub3B0aW9ucy5saW5rcz09PSEwPyh0PWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpLHQuaHJlZj1zLmxpbmssdC5hcHBlbmRDaGlsZChmKSxuLmFwcGVuZENoaWxkKHQpKTpuLmFwcGVuZENoaWxkKGYpO3RoaXMub3B0aW9ucy50YXJnZXQuYXBwZW5kKG4pLHI9ZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoZWFkXCIpWzBdLHIucmVtb3ZlQ2hpbGQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJpbnN0YWZlZWQtZmV0Y2hlclwiKSksYz1cImluc3RhZmVlZENhY2hlXCIrdGhpcy51bmlxdWUsd2luZG93W2NdPXZvaWQgMDt0cnl7ZGVsZXRlIHdpbmRvd1tjXX1jYXRjaCh4KXt9fXJldHVybiB0aGlzLm9wdGlvbnMuYWZ0ZXIhPW51bGwmJnR5cGVvZiB0aGlzLm9wdGlvbnMuYWZ0ZXI9PVwiZnVuY3Rpb25cIiYmdGhpcy5vcHRpb25zLmFmdGVyLmNhbGwodGhpcyksITB9LGUucHJvdG90eXBlLl9idWlsZFVybD1mdW5jdGlvbigpe3ZhciBlLHQsbjtlPVwiaHR0cHM6Ly9hcGkuaW5zdGFncmFtLmNvbS92MVwiO3N3aXRjaCh0aGlzLm9wdGlvbnMuZ2V0KXtjYXNlXCJwb3B1bGFyXCI6dD1cIm1lZGlhL3BvcHVsYXJcIjticmVhaztjYXNlXCJ0YWdnZWRcIjppZih0eXBlb2YgdGhpcy5vcHRpb25zLnRhZ05hbWUhPVwic3RyaW5nXCIpdGhyb3cgbmV3IEVycm9yKFwiTm8gdGFnIG5hbWUgc3BlY2lmaWVkLiBVc2UgdGhlICd0YWdOYW1lJyBvcHRpb24uXCIpO3Q9XCJ0YWdzL1wiK3RoaXMub3B0aW9ucy50YWdOYW1lK1wiL21lZGlhL3JlY2VudFwiO2JyZWFrO2Nhc2VcImxvY2F0aW9uXCI6aWYodHlwZW9mIHRoaXMub3B0aW9ucy5sb2NhdGlvbklkIT1cIm51bWJlclwiKXRocm93IG5ldyBFcnJvcihcIk5vIGxvY2F0aW9uIHNwZWNpZmllZC4gVXNlIHRoZSAnbG9jYXRpb25JZCcgb3B0aW9uLlwiKTt0PVwibG9jYXRpb25zL1wiK3RoaXMub3B0aW9ucy5sb2NhdGlvbklkK1wiL21lZGlhL3JlY2VudFwiO2JyZWFrO2Nhc2VcInVzZXJcIjppZih0eXBlb2YgdGhpcy5vcHRpb25zLnVzZXJJZCE9XCJudW1iZXJcIil0aHJvdyBuZXcgRXJyb3IoXCJObyB1c2VyIHNwZWNpZmllZC4gVXNlIHRoZSAndXNlcklkJyBvcHRpb24uXCIpO2lmKHR5cGVvZiB0aGlzLm9wdGlvbnMuYWNjZXNzVG9rZW4hPVwic3RyaW5nXCIpdGhyb3cgbmV3IEVycm9yKFwiTm8gYWNjZXNzIHRva2VuLiBVc2UgdGhlICdhY2Nlc3NUb2tlbicgb3B0aW9uLlwiKTt0PVwidXNlcnMvXCIrdGhpcy5vcHRpb25zLnVzZXJJZCtcIi9tZWRpYS9yZWNlbnRcIjticmVhaztkZWZhdWx0OnRocm93IG5ldyBFcnJvcihcIkludmFsaWQgb3B0aW9uIGZvciBnZXQ6ICdcIit0aGlzLm9wdGlvbnMuZ2V0K1wiJy5cIil9cmV0dXJuIG49XCJcIitlK1wiL1wiK3QsdGhpcy5vcHRpb25zLmFjY2Vzc1Rva2VuIT1udWxsP24rPVwiP2FjY2Vzc190b2tlbj1cIit0aGlzLm9wdGlvbnMuYWNjZXNzVG9rZW46bis9XCI/Y2xpZW50X2lkPVwiK3RoaXMub3B0aW9ucy5jbGllbnRJZCx0aGlzLm9wdGlvbnMubGltaXQhPW51bGwmJihuKz1cIiZjb3VudD1cIit0aGlzLm9wdGlvbnMubGltaXQpLG4rPVwiJmNhbGxiYWNrPWluc3RhZmVlZENhY2hlXCIrdGhpcy51bmlxdWUrXCIucGFyc2VcIixufSxlLnByb3RvdHlwZS5fZ2VuS2V5PWZ1bmN0aW9uKCl7dmFyIGU7cmV0dXJuIGU9ZnVuY3Rpb24oKXtyZXR1cm4oKDErTWF0aC5yYW5kb20oKSkqNjU1MzZ8MCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKX0sXCJcIitlKCkrZSgpK2UoKStlKCl9LGUucHJvdG90eXBlLl9tYWtlVGVtcGxhdGU9ZnVuY3Rpb24oZSx0KXt2YXIgbixyLGkscyxvO3I9Lyg/Olxce3syfSkoW1xcd1xcW1xcXVxcLl0rKSg/OlxcfXsyfSkvLG49ZTt3aGlsZShyLnRlc3QobikpaT1uLm1hdGNoKHIpWzFdLHM9KG89dGhpcy5fZ2V0T2JqZWN0UHJvcGVydHkodCxpKSkhPW51bGw/bzpcIlwiLG49bi5yZXBsYWNlKHIsXCJcIitzKTtyZXR1cm4gbn0sZS5wcm90b3R5cGUuX2dldE9iamVjdFByb3BlcnR5PWZ1bmN0aW9uKGUsdCl7dmFyIG4scjt0PXQucmVwbGFjZSgvXFxbKFxcdyspXFxdL2csXCIuJDFcIikscj10LnNwbGl0KFwiLlwiKTt3aGlsZShyLmxlbmd0aCl7bj1yLnNoaWZ0KCk7aWYoIShlIT1udWxsJiZuIGluIGUpKXJldHVybiBudWxsO2U9ZVtuXX1yZXR1cm4gZX0sZS5wcm90b3R5cGUuX3NvcnRCeT1mdW5jdGlvbihlLHQsbil7dmFyIHI7cmV0dXJuIHI9ZnVuY3Rpb24oZSxyKXt2YXIgaSxzO3JldHVybiBpPXRoaXMuX2dldE9iamVjdFByb3BlcnR5KGUsdCkscz10aGlzLl9nZXRPYmplY3RQcm9wZXJ0eShyLHQpLG4/aT5zPzE6LTE6aTxzPzE6LTF9LGUuc29ydChyLmJpbmQodGhpcykpLGV9LGUucHJvdG90eXBlLl9maWx0ZXI9ZnVuY3Rpb24oZSx0KXt2YXIgbixyLGkscyxvO249W10saT1mdW5jdGlvbihlKXtpZih0KGUpKXJldHVybiBuLnB1c2goZSl9O2ZvcihzPTAsbz1lLmxlbmd0aDtzPG87cysrKXI9ZVtzXSxpKHIpO3JldHVybiBufSxlfSgpLHQ9dHlwZW9mIGV4cG9ydHMhPVwidW5kZWZpbmVkXCImJmV4cG9ydHMhPT1udWxsP2V4cG9ydHM6d2luZG93LHQuaW5zdGFncmFtZmVlZD1lfSkuY2FsbCh0aGlzKTtcclxuXHJcblx0Ly9TaGltIGZvciBcImZpeGluZ1wiIElFJ3MgbGFjayBvZiBzdXBwb3J0IChJRSA8IDkpIGZvciBhcHBseWluZyBzbGljZSBvbiBob3N0IG9iamVjdHMgbGlrZSBOYW1lZE5vZGVNYXAsIE5vZGVMaXN0LCBhbmQgSFRNTENvbGxlY3Rpb24pIGh0dHBzOi8vZ2l0aHViLmNvbS9zdGV2ZW5zY2hvYmVydC9pbnN0YWZlZWQuanMvaXNzdWVzLzg0XHJcblx0KGZ1bmN0aW9uKCl7XCJ1c2Ugc3RyaWN0XCI7dmFyIGU9QXJyYXkucHJvdG90eXBlLnNsaWNlO3RyeXtlLmNhbGwoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KX1jYXRjaCh0KXtBcnJheS5wcm90b3R5cGUuc2xpY2U9ZnVuY3Rpb24odCxuKXtuPXR5cGVvZiBuIT09XCJ1bmRlZmluZWRcIj9uOnRoaXMubGVuZ3RoO2lmKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0aGlzKT09PVwiW29iamVjdCBBcnJheV1cIil7cmV0dXJuIGUuY2FsbCh0aGlzLHQsbil9dmFyIHIsaT1bXSxzLG89dGhpcy5sZW5ndGg7dmFyIHU9dHx8MDt1PXU+PTA/dTpvK3U7dmFyIGE9bj9uOm87aWYobjwwKXthPW8rbn1zPWEtdTtpZihzPjApe2k9bmV3IEFycmF5KHMpO2lmKHRoaXMuY2hhckF0KXtmb3Iocj0wO3I8cztyKyspe2lbcl09dGhpcy5jaGFyQXQodStyKX19ZWxzZXtmb3Iocj0wO3I8cztyKyspe2lbcl09dGhpc1t1K3JdfX19cmV0dXJuIGl9fX0pKClcclxuXHJcblx0Ly9JRTggYWxzbyBkb2Vzbid0IG9mZmVyIHRoZSAuYmluZCgpIG1ldGhvZCB0cmlnZ2VyZWQgYnkgdGhlICdzb3J0QnknIHByb3BlcnR5LiBDb3B5IGFuZCBwYXN0ZSB0aGUgcG9seWZpbGwgb2ZmZXJlZCBoZXJlOlxyXG5cdGlmKCFGdW5jdGlvbi5wcm90b3R5cGUuYmluZCl7RnVuY3Rpb24ucHJvdG90eXBlLmJpbmQ9ZnVuY3Rpb24oZSl7aWYodHlwZW9mIHRoaXMhPT1cImZ1bmN0aW9uXCIpe3Rocm93IG5ldyBUeXBlRXJyb3IoXCJGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZVwiKX12YXIgdD1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsMSksbj10aGlzLHI9ZnVuY3Rpb24oKXt9LGk9ZnVuY3Rpb24oKXtyZXR1cm4gbi5hcHBseSh0aGlzIGluc3RhbmNlb2YgciYmZT90aGlzOmUsdC5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpfTtyLnByb3RvdHlwZT10aGlzLnByb3RvdHlwZTtpLnByb3RvdHlwZT1uZXcgcjtyZXR1cm4gaX19XHJcblxyXG4gICAgZnVuY3Rpb24gc2JpX2luaXQoKXtcclxuXHJcbiAgICAgICAgalF1ZXJ5KCcjc2JfaW5zdGFncmFtLnNiaScpLmVhY2goZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHZhciAkc2VsZiA9IGpRdWVyeSh0aGlzKSxcclxuICAgICAgICAgICAgICAgICR0YXJnZXQgPSAkc2VsZi5maW5kKCcjc2JpX2ltYWdlcycpLFxyXG4gICAgICAgICAgICAgICAgJGxvYWRCdG4gPSAkc2VsZi5maW5kKFwiI3NiaV9sb2FkIC5zYmlfbG9hZF9idG5cIiksXHJcbiAgICAgICAgICAgICAgICBpbWdSZXMgPSAnc3RhbmRhcmRfcmVzb2x1dGlvbicsXHJcbiAgICAgICAgICAgICAgICBjb2xzID0gcGFyc2VJbnQoIHRoaXMuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbHMnKSwgMTAgKSxcclxuICAgICAgICAgICAgICAgIG51bSA9IHRoaXMuZ2V0QXR0cmlidXRlKCdkYXRhLW51bScpLFxyXG4gICAgICAgICAgICAgICAgLy9Db252ZXJ0IHN0eWxlcyBKU09OIHN0cmluZyB0byBhbiBvYmplY3RcclxuICAgICAgICAgICAgICAgIGZlZWRPcHRpb25zID0gSlNPTi5wYXJzZSggdGhpcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3B0aW9ucycpICksXHJcbiAgICAgICAgICAgICAgICBnZXRUeXBlID0gJ3VzZXInLFxyXG4gICAgICAgICAgICAgICAgc29ydGJ5ID0gJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgdXNlcl9pZCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyksXHJcbiAgICAgICAgICAgICAgICBudW0gPSB0aGlzLmdldEF0dHJpYnV0ZSgnZGF0YS1udW0nKSxcclxuICAgICAgICAgICAgICAgIHBvc3RzX2FyciA9IFtdLFxyXG4gICAgICAgICAgICAgICAgJGhlYWRlciA9ICcnLFxyXG4gICAgICAgICAgICAgICAgbW9yZVBvc3RzID0gW107IC8vVXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciB0byBzaG93IHRoZSBMb2FkIE1vcmUgYnV0dG9uIHdoZW4gZGlzcGxheWluZyBwb3N0cyBmcm9tIG1vcmUgdGhhbiBvbmUgaWQvaGFzaHRhZy4gSWYgb25lIG9mIHRoZSBpZHMvaGFzaHRhZ3MgaGFzIG1vcmUgcG9zdHMgdGhlbiBzdGlsbCBzaG93IGJ1dHRvbi5cclxuXHJcbiAgICAgICAgICAgIGlmKCBmZWVkT3B0aW9ucy5zb3J0YnkgIT09ICcnICkgc29ydGJ5ID0gZmVlZE9wdGlvbnMuc29ydGJ5O1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoKCB0aGlzLmdldEF0dHJpYnV0ZSgnZGF0YS1yZXMnKSApIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2F1dG8nOlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmZWVkV2lkdGggPSAkc2VsZi5pbm5lcldpZHRoKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbFdpZHRoID0gJHNlbGYuaW5uZXJXaWR0aCgpIC8gY29scztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy9DaGVjayBpZiBwYWdlIHdpZHRoIGlzIGxlc3MgdGhhbiA2NDAuIElmIGl0IGlzIHRoZW4gdXNlIHRoZSBzY3JpcHQgYWJvdmVcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc2JpV2luZG93V2lkdGggPSBqUXVlcnkod2luZG93KS53aWR0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCBzYmlXaW5kb3dXaWR0aCA8IDY0MCApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL05lZWQgdGhpcyBmb3IgbW9iaWxlIHNvIHRoYXQgaW1hZ2UgcmVzIGlzIHJpZ2h0IG9uIG1vYmlsZSwgYXMgdGhlIG51bWJlciBvZiBjb2xzIGlzbid0IGFsd2F5cyBhY2N1cmF0ZSBvbiBtb2JpbGUgYXMgdGhleSBhcmUgY2hhbmdlZCB1c2luZyBDU1NcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIGZlZWRXaWR0aCA8IDY0MCAmJiAkc2VsZi5pcygnLnNiaV9jb2xfMywgLnNiaV9jb2xfNCwgLnNiaV9jb2xfNSwgLnNiaV9jb2xfNicpICkgY29sV2lkdGggPSAzMDA7IC8vVXNlIG1lZGl1bSBpbWFnZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIGZlZWRXaWR0aCA8IDY0MCAmJiAkc2VsZi5pcygnLnNiaV9jb2xfNywgLnNiaV9jb2xfOCwgLnNiaV9jb2xfOSwgLnNiaV9jb2xfMTAnKSApIGNvbFdpZHRoID0gMTAwOyAvL1VzZSB0aHVtYm5haWwgaW1hZ2VzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCAoZmVlZFdpZHRoID4gMzIwICYmIGZlZWRXaWR0aCA8IDQ4MCkgJiYgc2JpV2luZG93V2lkdGggPCA0ODAgKSBjb2xXaWR0aCA9IDQ4MDsgLy9Vc2UgZnVsbCBzaXplIGltYWdlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggZmVlZFdpZHRoIDwgMzIwICYmIHNiaVdpbmRvd1dpZHRoIDwgNDgwICkgY29sV2lkdGggPSAzMDA7IC8vVXNlIG1lZGl1bSBzaXplIGltYWdlc1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIGNvbFdpZHRoIDwgMTUwICl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZ1JlcyA9ICd0aHVtYm5haWwnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiggY29sV2lkdGggPCAzMjAgKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nUmVzID0gJ2xvd19yZXNvbHV0aW9uJztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWdSZXMgPSAnc3RhbmRhcmRfcmVzb2x1dGlvbic7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL0lmIHRoZSBmZWVkIGlzIGhpZGRlbiAoZWc7IGluIGEgdGFiKSB0aGVuIHRoZSB3aWR0aCBpcyByZXR1cm5lZCBhcyAxMDAsIGFuZCBzbyBhdXRvIHNldCB0aGUgcmVzIHRvIGJlIG1lZGl1bSB0byBjb3ZlciBtb3N0IGJhc2VzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIGZlZWRXaWR0aCA8PSAxMDAgKSBpbWdSZXMgPSAnbG93X3Jlc29sdXRpb24nO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RodW1iJzpcclxuICAgICAgICAgICAgICAgICAgICBpbWdSZXMgPSAndGh1bWJuYWlsJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ21lZGl1bSc6XHJcbiAgICAgICAgICAgICAgICAgICAgaW1nUmVzID0gJ2xvd19yZXNvbHV0aW9uJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaW1nUmVzID0gJ3N0YW5kYXJkX3Jlc29sdXRpb24nO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL1NwbGl0IGNvbW1hIHNlcGFyYXRlZCBoYXNodGFncyBpbnRvIGFycmF5XHJcbiAgICAgICAgICAgIHZhciBpZHNfYXJyID0gdXNlcl9pZC5yZXBsYWNlKC8gL2csJycpLnNwbGl0KFwiLFwiKTtcclxuICAgICAgICAgICAgdmFyIGxvb3BhcnJheSA9IGlkc19hcnI7XHJcblxyXG4gICAgICAgICAgICAvL0dldCBwYWdlIGluZm8gZm9yIGZpcnN0IFVzZXIgSURcclxuICAgICAgICAgICAgdmFyIGhlYWRlclN0eWxlcyA9ICcnLFxyXG4gICAgICAgICAgICAgICAgc2JpX3BhZ2VfdXJsID0gJ2h0dHBzOi8vYXBpLmluc3RhZ3JhbS5jb20vdjEvdXNlcnMvJyArIGlkc19hcnJbMF0gKyAnP2FjY2Vzc190b2tlbj0nICsgc2JfaW5zdGFncmFtX2pzX29wdGlvbnMuc2JfaW5zdGFncmFtX2F0O1xyXG5cclxuICAgICAgICAgICAgaWYoZmVlZE9wdGlvbnMuaGVhZGVyY29sb3IubGVuZ3RoKSBoZWFkZXJTdHlsZXMgPSAnc3R5bGU9XCJjb2xvcjogIycrZmVlZE9wdGlvbnMuaGVhZGVyY29sb3IrJ1wiJztcclxuXHJcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHtcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcclxuICAgICAgICAgICAgICAgIHVybDogc2JpX3BhZ2VfdXJsLFxyXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAkaGVhZGVyID0gJzxhIGhyZWY9XCJodHRwOi8vaW5zdGFncmFtLmNvbS8nK2RhdGEuZGF0YS51c2VybmFtZSsnXCIgdGFyZ2V0PVwiX2JsYW5rXCIgdGl0bGU9XCJAJytkYXRhLmRhdGEudXNlcm5hbWUrJ1wiIGNsYXNzPVwic2JpX2hlYWRlcl9saW5rXCI+JztcclxuICAgICAgICAgICAgICAgICAgICAkaGVhZGVyICs9ICc8ZGl2IGNsYXNzPVwic2JpX2hlYWRlcl90ZXh0XCI+JztcclxuICAgICAgICAgICAgICAgICAgICAkaGVhZGVyICs9ICc8aDMgJyArIGhlYWRlclN0eWxlcztcclxuICAgICAgICAgICAgICAgICAgICBpZiggZGF0YS5kYXRhLmJpby5sZW5ndGggPT0gMCApICRoZWFkZXIgKz0gJyBjbGFzcz1cInNiaV9ub19iaW9cIic7XHJcbiAgICAgICAgICAgICAgICAgICAgJGhlYWRlciArPSAnPkAnK2RhdGEuZGF0YS51c2VybmFtZSsnPC9oMz4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKCBkYXRhLmRhdGEuYmlvLmxlbmd0aCApICRoZWFkZXIgKz0gJzxwIGNsYXNzPVwic2JpX2Jpb1wiICcraGVhZGVyU3R5bGVzKyc+JytkYXRhLmRhdGEuYmlvKyc8L3A+JztcclxuICAgICAgICAgICAgICAgICAgICAkaGVhZGVyICs9ICc8L2Rpdj4nO1xyXG4gICAgICAgICAgICAgICAgICAgICRoZWFkZXIgKz0gJzxkaXYgY2xhc3M9XCJzYmlfaGVhZGVyX2ltZ1wiPic7XHJcbiAgICAgICAgICAgICAgICAgICAgJGhlYWRlciArPSAnPGRpdiBjbGFzcz1cInNiaV9oZWFkZXJfaW1nX2hvdmVyXCI+PGkgY2xhc3M9XCJmYSBmYS1pbnN0YWdyYW1cIj48L2k+PC9kaXY+JztcclxuICAgICAgICAgICAgICAgICAgICAkaGVhZGVyICs9ICc8aW1nIHNyYz1cIicrZGF0YS5kYXRhLnByb2ZpbGVfcGljdHVyZSsnXCIgYWx0PVwiJytkYXRhLmRhdGEuZnVsbF9uYW1lKydcIiB3aWR0aD1cIjUwXCIgaGVpZ2h0PVwiNTBcIj4nO1xyXG4gICAgICAgICAgICAgICAgICAgICRoZWFkZXIgKz0gJzwvZGl2Pic7XHJcbiAgICAgICAgICAgICAgICAgICAgJGhlYWRlciArPSAnPC9hPic7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9BZGQgdGhlIGhlYWRlclxyXG4gICAgICAgICAgICAgICAgICAgICRzZWxmLmZpbmQoJy5zYl9pbnN0YWdyYW1faGVhZGVyJykucHJlcGVuZCggJGhlYWRlciApO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vQ2hhbmdlIHRoZSBVUkwgb2YgdGhlIGZvbGxvdyBidXR0b25cclxuICAgICAgICAgICAgICAgICAgICBpZiggJHNlbGYuZmluZCgnLnNiaV9mb2xsb3dfYnRuJykubGVuZ3RoICkgJHNlbGYuZmluZCgnLnNiaV9mb2xsb3dfYnRuIGEnKS5hdHRyKCdocmVmJywgJ2h0dHA6Ly9pbnN0YWdyYW0uY29tLycgKyBkYXRhLmRhdGEudXNlcm5hbWUgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vTG9vcCB0aHJvdWdoIFVzZXIgSURzXHJcbiAgICAgICAgICAgIGpRdWVyeS5lYWNoKCBsb29wYXJyYXksIGZ1bmN0aW9uKCBpbmRleCwgZW50cnkgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHVzZXJGZWVkID0gbmV3IGluc3RhZ3JhbWZlZWQoe1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogJHRhcmdldCxcclxuICAgICAgICAgICAgICAgICAgICBnZXQ6IGdldFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgc29ydEJ5OiBzb3J0YnksXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x1dGlvbjogaW1nUmVzLFxyXG4gICAgICAgICAgICAgICAgICAgIGxpbWl0OiBwYXJzZUludCggbnVtLCAxMCApLFxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInNiaV9pdGVtIHNiaV90eXBlX3t7bW9kZWwudHlwZX19IHNiaV9uZXdcIiBpZD1cInNiaV97e2lkfX1cIiBkYXRhLWRhdGU9XCJ7e21vZGVsLmNyZWF0ZWRfdGltZV9yYXd9fVwiPjxkaXYgY2xhc3M9XCJzYmlfcGhvdG9fd3JhcFwiPjxhIGNsYXNzPVwic2JpX3Bob3RvXCIgaHJlZj1cInt7bGlua319XCIgdGFyZ2V0PVwiX2JsYW5rXCI+PGltZyBzcmM9XCJ7e2ltYWdlfX1cIiBhbHQ9XCJ7e2NhcHRpb259fVwiIC8+PC9hPjwvZGl2PjwvZGl2PicsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBmdW5jdGlvbihpbWFnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL0NyZWF0ZSB0aW1lIGZvciBzb3J0aW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoaW1hZ2UuY3JlYXRlZF90aW1lKjEwMDApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZSA9IGRhdGUuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZS5jcmVhdGVkX3RpbWVfcmF3ID0gdGltZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vUmVwbGFjZSBkb3VibGUgcXVvdGVzIGluIHRoZSBjYXB0aW9ucyB3aXRoIHRoZSBIVE1MIHN5bWJvbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL0Fsd2F5cyBjaGVjayB0byBtYWtlIHN1cmUgaXQgZXhpc3RzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGltYWdlLmNhcHRpb24gIT0gbnVsbCkgaW1hZ2UuY2FwdGlvbi50ZXh0ID0gaW1hZ2UuY2FwdGlvbi50ZXh0LnJlcGxhY2UoL1wiL2csIFwiJnF1b3Q7XCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB1c2VySWQ6IHBhcnNlSW50KCBlbnRyeSwgMTAgKSxcclxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NUb2tlbjogc2JfaW5zdGFncmFtX2pzX29wdGlvbnMuc2JfaW5zdGFncmFtX2F0LFxyXG4gICAgICAgICAgICAgICAgICAgIGFmdGVyOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzZWxmLmZpbmQoJy5zYmlfbG9hZGVyJykucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBMb2FkIG1vcmUgYnV0dG9uICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc05leHQoKSkgbW9yZVBvc3RzLnB1c2goJzEnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKG1vcmVQb3N0cy5sZW5ndGggPiAwKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsb2FkQnRuLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsb2FkQnRuLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzZWxmLmNzcygncGFkZGluZy1ib3R0b20nLCAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGwgQ3VzdG9tIEpTIGlmIGl0IGV4aXN0c1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNiaV9jdXN0b21fanMgPT0gJ2Z1bmN0aW9uJykgc2V0VGltZW91dChmdW5jdGlvbigpeyBzYmlfY3VzdG9tX2pzKCk7IH0sIDEwMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiggaW1nUmVzICE9PSAndGh1bWJuYWlsJyApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9UaGlzIG5lZWRzIHRvIGJlIGhlcmUgb3RoZXJ3aXNlIGl0IHJlc3VsdHMgaW4gdGhlIGZvbGxvd2luZyBlcnJvciBmb3Igc29tZSBzaXRlczogJHNlbGYuZmluZCguLi4pLnNiaV9pbWdMaXF1aWQoKSBpcyBub3QgYSBmdW5jdGlvbi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qISBpbWdMaXF1aWQgdjAuOS45NDQgLyAwMy0wNS0yMDEzIGh0dHBzOi8vZ2l0aHViLmNvbS9rYXJhY2FzL2ltZ0xpcXVpZCAqL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNiaV9pbWdMaXF1aWQ9c2JpX2ltZ0xpcXVpZHx8e1ZFUjpcIjAuOS45NDRcIn07c2JpX2ltZ0xpcXVpZC5iZ3NfQXZhaWxhYmxlPSExLHNiaV9pbWdMaXF1aWQuYmdzX0NoZWNrUnVubmVkPSExLGZ1bmN0aW9uKGkpe2Z1bmN0aW9uIHQoKXtpZighc2JpX2ltZ0xpcXVpZC5iZ3NfQ2hlY2tSdW5uZWQpe3NiaV9pbWdMaXF1aWQuYmdzX0NoZWNrUnVubmVkPSEwO3ZhciB0PWkoJzxzcGFuIHN0eWxlPVwiYmFja2dyb3VuZC1zaXplOmNvdmVyXCIgLz4nKTtpKFwiYm9keVwiKS5hcHBlbmQodCksIWZ1bmN0aW9uKCl7dmFyIGk9dFswXTtpZihpJiZ3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSl7dmFyIGU9d2luZG93LmdldENvbXB1dGVkU3R5bGUoaSxudWxsKTtlJiZlLmJhY2tncm91bmRTaXplJiYoc2JpX2ltZ0xpcXVpZC5iZ3NfQXZhaWxhYmxlPVwiY292ZXJcIj09PWUuYmFja2dyb3VuZFNpemUpfX0oKSx0LnJlbW92ZSgpfX1pLmZuLmV4dGVuZCh7c2JpX2ltZ0xpcXVpZDpmdW5jdGlvbihlKXt0aGlzLmRlZmF1bHRzPXtmaWxsOiEwLHZlcnRpY2FsQWxpZ246XCJjZW50ZXJcIixob3Jpem9udGFsQWxpZ246XCJjZW50ZXJcIix1c2VCYWNrZ3JvdW5kU2l6ZTohMCx1c2VEYXRhSHRtbEF0dHI6ITAscmVzcG9uc2l2ZTohMCxkZWxheTowLGZhZGVJblRpbWU6MCxyZW1vdmVCb3hCYWNrZ3JvdW5kOiEwLGhhcmRQaXhlbHM6ITAscmVzcG9uc2l2ZUNoZWNrVGltZTo1MDAsdGltZWNoZWNrdmlzaWJpbGl0eTo1MDAsb25TdGFydDpudWxsLG9uRmluaXNoOm51bGwsb25JdGVtU3RhcnQ6bnVsbCxvbkl0ZW1GaW5pc2g6bnVsbCxvbkl0ZW1FcnJvcjpudWxsfSx0KCk7dmFyIGE9dGhpcztyZXR1cm4gdGhpcy5vcHRpb25zPWUsdGhpcy5zZXR0aW5ncz1pLmV4dGVuZCh7fSx0aGlzLmRlZmF1bHRzLHRoaXMub3B0aW9ucyksdGhpcy5zZXR0aW5ncy5vblN0YXJ0JiZ0aGlzLnNldHRpbmdzLm9uU3RhcnQoKSx0aGlzLmVhY2goZnVuY3Rpb24odCl7ZnVuY3Rpb24gZSgpey0xPT09dS5jc3MoXCJiYWNrZ3JvdW5kLWltYWdlXCIpLmluZGV4T2YoZW5jb2RlVVJJKGMuYXR0cihcInNyY1wiKSkpJiZ1LmNzcyh7XCJiYWNrZ3JvdW5kLWltYWdlXCI6J3VybChcIicrZW5jb2RlVVJJKGMuYXR0cihcInNyY1wiKSkrJ1wiKSd9KSx1LmNzcyh7XCJiYWNrZ3JvdW5kLXNpemVcIjpnLmZpbGw/XCJjb3ZlclwiOlwiY29udGFpblwiLFwiYmFja2dyb3VuZC1wb3NpdGlvblwiOihnLmhvcml6b250YWxBbGlnbitcIiBcIitnLnZlcnRpY2FsQWxpZ24pLnRvTG93ZXJDYXNlKCksXCJiYWNrZ3JvdW5kLXJlcGVhdFwiOlwibm8tcmVwZWF0XCJ9KSxpKFwiYTpmaXJzdFwiLHUpLmNzcyh7ZGlzcGxheTpcImJsb2NrXCIsd2lkdGg6XCIxMDAlXCIsaGVpZ2h0OlwiMTAwJVwifSksaShcImltZ1wiLHUpLmNzcyh7ZGlzcGxheTpcIm5vbmVcIn0pLGcub25JdGVtRmluaXNoJiZnLm9uSXRlbUZpbmlzaCh0LHUsYyksdS5hZGRDbGFzcyhcInNiaV9pbWdMaXF1aWRfYmdTaXplXCIpLHUuYWRkQ2xhc3MoXCJzYmlfaW1nTGlxdWlkX3JlYWR5XCIpLGwoKX1mdW5jdGlvbiBvKCl7ZnVuY3Rpb24gZSgpe2MuZGF0YShcInNiaV9pbWdMaXF1aWRfZXJyb3JcIil8fGMuZGF0YShcInNiaV9pbWdMaXF1aWRfbG9hZGVkXCIpfHxjLmRhdGEoXCJzYmlfaW1nTGlxdWlkX29sZFByb2Nlc3NlZFwiKXx8KHUuaXMoXCI6dmlzaWJsZVwiKSYmY1swXS5jb21wbGV0ZSYmY1swXS53aWR0aD4wJiZjWzBdLmhlaWdodD4wPyhjLmRhdGEoXCJzYmlfaW1nTGlxdWlkX2xvYWRlZFwiLCEwKSxzZXRUaW1lb3V0KHIsdCpnLmRlbGF5KSk6c2V0VGltZW91dChlLGcudGltZWNoZWNrdmlzaWJpbGl0eSkpfWlmKGMuZGF0YShcIm9sZFNyY1wiKSYmYy5kYXRhKFwib2xkU3JjXCIpIT09Yy5hdHRyKFwic3JjXCIpKXt2YXIgYT1jLmNsb25lKCkucmVtb3ZlQXR0cihcInN0eWxlXCIpO3JldHVybiBhLmRhdGEoXCJzYmlfaW1nTGlxdWlkX3NldHRpbmdzXCIsYy5kYXRhKFwic2JpX2ltZ0xpcXVpZF9zZXR0aW5nc1wiKSksYy5wYXJlbnQoKS5wcmVwZW5kKGEpLGMucmVtb3ZlKCksYz1hLGNbMF0ud2lkdGg9MCx2b2lkIHNldFRpbWVvdXQobywxMCl9cmV0dXJuIGMuZGF0YShcInNiaV9pbWdMaXF1aWRfb2xkUHJvY2Vzc2VkXCIpP3ZvaWQgcigpOihjLmRhdGEoXCJzYmlfaW1nTGlxdWlkX29sZFByb2Nlc3NlZFwiLCExKSxjLmRhdGEoXCJvbGRTcmNcIixjLmF0dHIoXCJzcmNcIikpLGkoXCJpbWc6bm90KDpmaXJzdClcIix1KS5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpLHUuY3NzKHtvdmVyZmxvdzpcImhpZGRlblwifSksYy5mYWRlVG8oMCwwKS5yZW1vdmVBdHRyKFwid2lkdGhcIikucmVtb3ZlQXR0cihcImhlaWdodFwiKS5jc3Moe3Zpc2liaWxpdHk6XCJ2aXNpYmxlXCIsXCJtYXgtd2lkdGhcIjpcIm5vbmVcIixcIm1heC1oZWlnaHRcIjpcIm5vbmVcIix3aWR0aDpcImF1dG9cIixoZWlnaHQ6XCJhdXRvXCIsZGlzcGxheTpcImJsb2NrXCJ9KSxjLm9uKFwiZXJyb3JcIixuKSxjWzBdLm9uZXJyb3I9bixlKCksdm9pZCBkKCkpfWZ1bmN0aW9uIGQoKXsoZy5yZXNwb25zaXZlfHxjLmRhdGEoXCJzYmlfaW1nTGlxdWlkX29sZFByb2Nlc3NlZFwiKSkmJmMuZGF0YShcInNiaV9pbWdMaXF1aWRfc2V0dGluZ3NcIikmJihnPWMuZGF0YShcInNiaV9pbWdMaXF1aWRfc2V0dGluZ3NcIiksdS5hY3R1YWxTaXplPXUuZ2V0KDApLm9mZnNldFdpZHRoK3UuZ2V0KDApLm9mZnNldEhlaWdodC8xZTQsdS5zaXplT2xkJiZ1LmFjdHVhbFNpemUhPT11LnNpemVPbGQmJnIoKSx1LnNpemVPbGQ9dS5hY3R1YWxTaXplLHNldFRpbWVvdXQoZCxnLnJlc3BvbnNpdmVDaGVja1RpbWUpKX1mdW5jdGlvbiBuKCl7Yy5kYXRhKFwic2JpX2ltZ0xpcXVpZF9lcnJvclwiLCEwKSx1LmFkZENsYXNzKFwic2JpX2ltZ0xpcXVpZF9lcnJvclwiKSxnLm9uSXRlbUVycm9yJiZnLm9uSXRlbUVycm9yKHQsdSxjKSxsKCl9ZnVuY3Rpb24gcygpe3ZhciBpPXt9O2lmKGEuc2V0dGluZ3MudXNlRGF0YUh0bWxBdHRyKXt2YXIgdD11LmF0dHIoXCJkYXRhLXNiaV9pbWdMaXF1aWQtZmlsbFwiKSxlPXUuYXR0cihcImRhdGEtc2JpX2ltZ0xpcXVpZC1ob3Jpem9udGFsQWxpZ25cIiksbz11LmF0dHIoXCJkYXRhLXNiaV9pbWdMaXF1aWQtdmVydGljYWxBbGlnblwiKTsoXCJ0cnVlXCI9PT10fHxcImZhbHNlXCI9PT10KSYmKGkuZmlsbD1Cb29sZWFuKFwidHJ1ZVwiPT09dCkpLHZvaWQgMD09PWV8fFwibGVmdFwiIT09ZSYmXCJjZW50ZXJcIiE9PWUmJlwicmlnaHRcIiE9PWUmJi0xPT09ZS5pbmRleE9mKFwiJVwiKXx8KGkuaG9yaXpvbnRhbEFsaWduPWUpLHZvaWQgMD09PW98fFwidG9wXCIhPT1vJiZcImJvdHRvbVwiIT09byYmXCJjZW50ZXJcIiE9PW8mJi0xPT09by5pbmRleE9mKFwiJVwiKXx8KGkudmVydGljYWxBbGlnbj1vKX1yZXR1cm4gc2JpX2ltZ0xpcXVpZC5pc0lFJiZhLnNldHRpbmdzLmllRmFkZUluRGlzYWJsZWQmJihpLmZhZGVJblRpbWU9MCksaX1mdW5jdGlvbiByKCl7dmFyIGksZSxhLG8sZCxuLHMscixtPTAsaD0wLGY9dS53aWR0aCgpLHY9dS5oZWlnaHQoKTt2b2lkIDA9PT1jLmRhdGEoXCJvd2lkdGhcIikmJmMuZGF0YShcIm93aWR0aFwiLGNbMF0ud2lkdGgpLHZvaWQgMD09PWMuZGF0YShcIm9oZWlnaHRcIikmJmMuZGF0YShcIm9oZWlnaHRcIixjWzBdLmhlaWdodCksZy5maWxsPT09Zi92Pj1jLmRhdGEoXCJvd2lkdGhcIikvYy5kYXRhKFwib2hlaWdodFwiKT8oaT1cIjEwMCVcIixlPVwiYXV0b1wiLGE9TWF0aC5mbG9vcihmKSxvPU1hdGguZmxvb3IoZiooYy5kYXRhKFwib2hlaWdodFwiKS9jLmRhdGEoXCJvd2lkdGhcIikpKSk6KGk9XCJhdXRvXCIsZT1cIjEwMCVcIixhPU1hdGguZmxvb3IodiooYy5kYXRhKFwib3dpZHRoXCIpL2MuZGF0YShcIm9oZWlnaHRcIikpKSxvPU1hdGguZmxvb3IodikpLGQ9Zy5ob3Jpem9udGFsQWxpZ24udG9Mb3dlckNhc2UoKSxzPWYtYSxcImxlZnRcIj09PWQmJihoPTApLFwiY2VudGVyXCI9PT1kJiYoaD0uNSpzKSxcInJpZ2h0XCI9PT1kJiYoaD1zKSwtMSE9PWQuaW5kZXhPZihcIiVcIikmJihkPXBhcnNlSW50KGQucmVwbGFjZShcIiVcIixcIlwiKSwxMCksZD4wJiYoaD1zKmQqLjAxKSksbj1nLnZlcnRpY2FsQWxpZ24udG9Mb3dlckNhc2UoKSxyPXYtbyxcImxlZnRcIj09PW4mJihtPTApLFwiY2VudGVyXCI9PT1uJiYobT0uNSpyKSxcImJvdHRvbVwiPT09biYmKG09ciksLTEhPT1uLmluZGV4T2YoXCIlXCIpJiYobj1wYXJzZUludChuLnJlcGxhY2UoXCIlXCIsXCJcIiksMTApLG4+MCYmKG09cipuKi4wMSkpLGcuaGFyZFBpeGVscyYmKGk9YSxlPW8pLGMuY3NzKHt3aWR0aDppLGhlaWdodDplLFwibWFyZ2luLWxlZnRcIjpNYXRoLmZsb29yKGgpLFwibWFyZ2luLXRvcFwiOk1hdGguZmxvb3IobSl9KSxjLmRhdGEoXCJzYmlfaW1nTGlxdWlkX29sZFByb2Nlc3NlZFwiKXx8KGMuZmFkZVRvKGcuZmFkZUluVGltZSwxKSxjLmRhdGEoXCJzYmlfaW1nTGlxdWlkX29sZFByb2Nlc3NlZFwiLCEwKSxnLnJlbW92ZUJveEJhY2tncm91bmQmJnUuY3NzKFwiYmFja2dyb3VuZC1pbWFnZVwiLFwibm9uZVwiKSx1LmFkZENsYXNzKFwic2JpX2ltZ0xpcXVpZF9ub2JnU2l6ZVwiKSx1LmFkZENsYXNzKFwic2JpX2ltZ0xpcXVpZF9yZWFkeVwiKSksZy5vbkl0ZW1GaW5pc2gmJmcub25JdGVtRmluaXNoKHQsdSxjKSxsKCl9ZnVuY3Rpb24gbCgpe3Q9PT1hLmxlbmd0aC0xJiZhLnNldHRpbmdzLm9uRmluaXNoJiZhLnNldHRpbmdzLm9uRmluaXNoKCl9dmFyIGc9YS5zZXR0aW5ncyx1PWkodGhpcyksYz1pKFwiaW1nOmZpcnN0XCIsdSk7cmV0dXJuIGMubGVuZ3RoPyhjLmRhdGEoXCJzYmlfaW1nTGlxdWlkX3NldHRpbmdzXCIpPyh1LnJlbW92ZUNsYXNzKFwic2JpX2ltZ0xpcXVpZF9lcnJvclwiKS5yZW1vdmVDbGFzcyhcInNiaV9pbWdMaXF1aWRfcmVhZHlcIiksZz1pLmV4dGVuZCh7fSxjLmRhdGEoXCJzYmlfaW1nTGlxdWlkX3NldHRpbmdzXCIpLGEub3B0aW9ucykpOmc9aS5leHRlbmQoe30sYS5zZXR0aW5ncyxzKCkpLGMuZGF0YShcInNiaV9pbWdMaXF1aWRfc2V0dGluZ3NcIixnKSxnLm9uSXRlbVN0YXJ0JiZnLm9uSXRlbVN0YXJ0KHQsdSxjKSx2b2lkKHNiaV9pbWdMaXF1aWQuYmdzX0F2YWlsYWJsZSYmZy51c2VCYWNrZ3JvdW5kU2l6ZT9lKCk6bygpKSk6dm9pZCBuKCl9KX19KX0oalF1ZXJ5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2UgaW1hZ2VmaWxsIHRvIHNldCB0aGUgaW1hZ2VzIGFzIGJhY2tncm91bmRzIHNvIHRoZXkgY2FuIGJlIHNxdWFyZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIWZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3NzID0gc2JpX2ltZ0xpcXVpZC5pbmplY3RDc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLnR5cGUgPSAndGV4dC9jc3MnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHlsZS5zdHlsZVNoZWV0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IGNzcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3MpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2VsZi5maW5kKFwiLnNiaV9waG90b1wiKS5zYmlfaW1nTGlxdWlkKHtmaWxsOnRydWV9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAvLyBFbmQ6ICggaW1nUmVzICE9PSAndGh1bWJuYWlsJyApIGNoZWNrXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL09ubHkgY2hlY2sgdGhlIHdpZHRoIG9uY2UgdGhlIHJlc2l6ZSBldmVudCBpcyBvdmVyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzYmlfZGVsYXkgPSAoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzYmlfdGltZXIgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzYmlfY2FsbGJhY2ssIHNiaV9tcyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0IChzYmlfdGltZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNiaV90aW1lciA9IHNldFRpbWVvdXQoc2JpX2NhbGxiYWNrLCBzYmlfbXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeSh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2JpX2RlbGF5KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2JpU2V0UGhvdG9IZWlnaHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDUwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9SZXNpemUgaW1hZ2UgaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHNiaVNldFBob3RvSGVpZ2h0KCl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoIGltZ1JlcyAhPT0gJ3RodW1ibmFpbCcgKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2JpX3Bob3RvX3dpZHRoID0gJHNlbGYuZmluZCgnLnNiaV9waG90bycpLmVxKDApLmlubmVyV2lkdGgoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9GaWd1cmUgb3V0IG51bWJlciBvZiBjb2x1bW5zIGZvciBlaXRoZXIgZGVza3RvcCBvciBtb2JpbGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2JpX251bV9jb2xzID0gcGFyc2VJbnQoY29scyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKCAhJHNlbGYuaGFzQ2xhc3MoJ3NiaV9kaXNhYmxlX21vYmlsZScpICl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzYmlXaW5kb3dXaWR0aCA9IGpRdWVyeSh3aW5kb3cpLndpZHRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKCBzYmlXaW5kb3dXaWR0aCA8IDY0MCAmJiAocGFyc2VJbnQoY29scykgPiAyICYmIHBhcnNlSW50KGNvbHMpIDwgNyApICkgc2JpX251bV9jb2xzID0gMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoIHNiaVdpbmRvd1dpZHRoIDwgNjQwICYmIChwYXJzZUludChjb2xzKSA+IDYgJiYgcGFyc2VJbnQoY29scykgPCAxMSApICkgc2JpX251bV9jb2xzID0gNDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoIHNiaVdpbmRvd1dpZHRoIDw9IDQ4MCAmJiBwYXJzZUludChjb2xzKSA+IDIgKSBzYmlfbnVtX2NvbHMgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL0ZpZ3VyZSBvdXQgd2hhdCB0aGUgd2lkdGggc2hvdWxkIGJlIHVzaW5nIHRoZSBudW1iZXIgb2YgY29sc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzYmlfcGhvdG9fd2lkdGhfbWFudWFsID0gKCAkc2VsZi5maW5kKCcjc2JpX2ltYWdlcycpLndpZHRoKCkgLyBzYmlfbnVtX2NvbHMgKSAtIChmZWVkT3B0aW9ucy5pbWFnZXBhZGRpbmcqMik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vSWYgdGhlIHdpZHRoIGlzIGxlc3MgdGhhbiBpdCBzaG91bGQgYmUgdGhlbiBzZXQgaXQgbWFudWFsbHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiggc2JpX3Bob3RvX3dpZHRoIDw9IChzYmlfcGhvdG9fd2lkdGhfbWFudWFsKSApIHNiaV9waG90b193aWR0aCA9IHNiaV9waG90b193aWR0aF9tYW51YWw7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzZWxmLmZpbmQoJy5zYmlfcGhvdG8nKS5jc3MoJ2hlaWdodCcsIHNiaV9waG90b193aWR0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNiaVNldFBob3RvSGVpZ2h0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvKiBEZXRlY3Qgd2hlbiBlbGVtZW50IGJlY29tZXMgdmlzaWJsZS4gVXNlZCBmb3Igd2hlbiB0aGUgZmVlZCBpcyBpbml0aWFsbHkgaGlkZGVuLCBpbiBhIHRhYiBmb3IgZXhhbXBsZS4gaHR0cHM6Ly9naXRodWIuY29tL3NoYXVuYm93ZS9qcXVlcnkudmlzaWJpbGl0eUNoYW5nZWQgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgIWZ1bmN0aW9uKGkpe3ZhciBuPXtjYWxsYmFjazpmdW5jdGlvbigpe30scnVuT25Mb2FkOiEwLGZyZXF1ZW5jeToxMDAsc2JpUHJldmlvdXNWaXNpYmlsaXR5Om51bGx9LGM9e307Yy5zYmlDaGVja1Zpc2liaWxpdHk9ZnVuY3Rpb24oaSxuKXtpZihqUXVlcnkuY29udGFpbnMoZG9jdW1lbnQsaVswXSkpe3ZhciBlPW4uc2JpUHJldmlvdXNWaXNpYmlsaXR5LHQ9aS5pcyhcIjp2aXNpYmxlXCIpO24uc2JpUHJldmlvdXNWaXNpYmlsaXR5PXQsbnVsbD09ZT9uLnJ1bk9uTG9hZCYmbi5jYWxsYmFjayhpLHQpOmUhPT10JiZuLmNhbGxiYWNrKGksdCksc2V0VGltZW91dChmdW5jdGlvbigpe2Muc2JpQ2hlY2tWaXNpYmlsaXR5KGksbil9LG4uZnJlcXVlbmN5KX19LGkuZm4uc2JpVmlzaWJpbGl0eUNoYW5nZWQ9ZnVuY3Rpb24oZSl7dmFyIHQ9aS5leHRlbmQoe30sbixlKTtyZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCl7Yy5zYmlDaGVja1Zpc2liaWxpdHkoaSh0aGlzKSx0KX0pfX0oalF1ZXJ5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vSWYgdGhlIGZlZWQgaXMgaW5pdGlhbGx5IGhpZGRlbiAoaW4gYSB0YWIgZm9yIGV4YW1wbGUpIHRoZW4gY2hlY2sgZm9yIHdoZW4gaXQgYmVjb21lcyB2aXNpYmxlIGFuZCBzZXQgdGhlbiBzZXQgdGhlIGhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkoXCIuc2JpXCIpLmZpbHRlcignOmhpZGRlbicpLnNiaVZpc2liaWxpdHlDaGFuZ2VkKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbihlbGVtZW50LCB2aXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYmlTZXRQaG90b0hlaWdodCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bk9uTG9hZDogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9GYWRlIHBob3RvcyBvbiBob3ZlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJyNzYl9pbnN0YWdyYW0gLnNiaV9waG90bycpLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeSh0aGlzKS5ob3ZlcihmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeSh0aGlzKS5mYWRlVG8oMjAwLCAwLjg1KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KHRoaXMpLnN0b3AoKS5mYWRlVG8oNTAwLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vU29ydCBwb3N0cyBieSBkYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vb25seSBzb3J0IHRoZSBuZXcgcG9zdHMgdGhhdCBhcmUgbG9hZGVkIGluLCBub3QgdGhlIHdob2xlIGZlZWQsIG90aGVyd2lzZSBzb21lIHBob3RvcyB3aWxsIHN3aXRjaCBwb3NpdGlvbnMgZHVlIHRvIGRhdGVzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzZWxmLmZpbmQoJyNzYmlfaW1hZ2VzIC5zYmlfaXRlbS5zYmlfbmV3Jykuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFDb21wID0galF1ZXJ5KGEpLmRhdGEoJ2RhdGUnKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiQ29tcCA9IGpRdWVyeShiKS5kYXRhKCdkYXRlJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoc29ydGJ5ID09ICdub25lJyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9PcmRlciBieSBkYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJDb21wIC0gYUNvbXA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vUmFuZG9taXplXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkpLTAuNSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5hcHBlbmRUbyggJHNlbGYuZmluZChcIiNzYmlfaW1hZ2VzXCIpICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1JlbW92ZSB0aGUgbmV3IGNsYXNzIGFmdGVyIDUwMG1zLCBvbmNlIHRoZSBzb3J0aW5nIGlzIGRvbmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KCcjc2JpX2ltYWdlcyAuc2JpX2l0ZW0uc2JpX25ldycpLnJlbW92ZUNsYXNzKCdzYmlfbmV3Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1Jlc2V0IHRoZSBtb3JlUG9zdHMgdmFyaWFibGUgc28gd2UgY2FuIGNoZWNrIHdoZXRoZXIgdGhlcmUgYXJlIG1vcmUgcG9zdHMgZXZlcnkgdGltZSB0aGUgTG9hZCBNb3JlIGJ1dHRvbiBpcyBjbGlja2VkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb3JlUG9zdHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgNTAwKTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH0sIC8vIEVuZCAnYWZ0ZXInIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNiaUVycm9yTXNnID0gJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYmlFcnJvckRpciA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIGRhdGEuaW5kZXhPZignYWNjZXNzX3Rva2VuJykgPiAtMSApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2JpRXJyb3JNc2cgKz0gJzxwPjxiPkVycm9yOiBBY2Nlc3MgVG9rZW4gaXMgbm90IHZhbGlkPC9iPjxiciAvPjxzcGFuPlRoaXMgZXJyb3IgbWVzc2FnZSBpcyBvbmx5IHZpc2libGUgdG8gV29yZFByZXNzIGFkbWluczwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2JpRXJyb3JEaXIgPSBcIjxwPlRoZXJlJ3MgYW4gaXNzdWUgd2l0aCB0aGUgSW5zdGFncmFtIEFjY2VzcyBUb2tlbiB0aGF0IHlvdSBhcmUgdXNpbmcuIFBsZWFzZSBvYnRhaW4gYSBuZXcgQWNjZXNzIFRva2VuIG9uIHRoZSBwbHVnaW4ncyBTZXR0aW5ncyBwYWdlLlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoIGRhdGEuaW5kZXhPZigndXNlciBkb2VzIG5vdCBleGlzdCcpID4gLTEgKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNiaUVycm9yTXNnICs9ICc8cD48Yj5FcnJvcjogVGhlIFVzZXIgSUQgZG9lcyBub3QgZXhpc3Q8L2I+PGJyIC8+PHNwYW4+VGhpcyBlcnJvciBpcyBvbmx5IHZpc2libGUgdG8gV29yZFByZXNzIGFkbWluczwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2JpRXJyb3JEaXIgPSBcIjxwPlBsZWFzZSBkb3VibGUgY2hlY2sgdGhlIEluc3RhZ3JhbSBVc2VyIElEIHRoYXQgeW91IGFyZSB1c2luZy4gVG8gZmluZCB5b3VyIFVzZXIgSUQgc2ltcGx5IGVudGVyIHlvdXIgSW5zdGFncmFtIHVzZXIgbmFtZSBpbnRvIHRoaXMgPGEgaHJlZj0naHR0cDovL3d3dy5vdHpiZXJnLm5ldC9pZ3VzZXJpZC8nIHRhcmdldD0nX2JsYW5rJz50b29sPC9hPi48L3A+XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vQWRkIHRoZSBlcnJvciBtZXNzYWdlIHRvIHRoZSBwYWdlIHVubGVzcyB0aGUgdXNlciBpcyBkaXNwbGF5aW5nIG11bHRpcGxlIGlkcyBvciBoYXNodGFnc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihsb29wYXJyYXkubGVuZ3RoIDwgMikgalF1ZXJ5KCcjc2JfaW5zdGFncmFtJykuZW1wdHkoKS5hcHBlbmQoICc8cCBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjtcIj5VbmFibGUgdG8gc2hvdyBJbnN0YWdyYW0gcGhvdG9zPC9wPjxkaXYgaWQ9XCJzYmlfbW9kX2Vycm9yXCI+JyArIHNiaUVycm9yTXNnICsgc2JpRXJyb3JEaXIgKyAnPC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJGxvYWRCdG4uY2xpY2soZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXNlckZlZWQubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdXNlckZlZWQucnVuKCk7XHJcblxyXG4gICAgICAgICAgICB9KTsgLy9FbmQgVXNlciBJRCBhcnJheSBsb29wXHJcblxyXG4gICAgICAgIFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBqUXVlcnkoIGRvY3VtZW50ICkucmVhZHkoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgc2JpX2luaXQoKTtcclxuICAgIH0pO1xyXG5cclxufSAvLyBlbmQgc2JpX2pzX2V4aXN0cyBjaGVjayIsImpRdWVyeSggJ2lmcmFtZVtzcmMqPVwieW91dHViZS5jb21cIl0nKS53cmFwKFwiPGRpdiBjbGFzcz0nZmxleC12aWRlbyB3aWRlc2NyZWVuJy8+XCIpO1xualF1ZXJ5KCAnaWZyYW1lW3NyYyo9XCJ2aW1lby5jb21cIl0nKS53cmFwKFwiPGRpdiBjbGFzcz0nZmxleC12aWRlbyB3aWRlc2NyZWVuIHZpbWVvJy8+XCIpO1xuIiwiIiwialF1ZXJ5KGRvY3VtZW50KS5mb3VuZGF0aW9uKCk7XG4iLCIvLyBKb3lyaWRlIGRlbW9cbiQoJyNzdGFydC1qcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAkKGRvY3VtZW50KS5mb3VuZGF0aW9uKCdqb3lyaWRlJywnc3RhcnQnKTtcbn0pOyIsIiIsIjsoZnVuY3Rpb24gKHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gQ3V0IHRoZSBtdXN0YXJkXG4gICAgdmFyIHN1cHBvcnRzID0gJ3F1ZXJ5U2VsZWN0b3InIGluIGRvY3VtZW50ICYmICdhZGRFdmVudExpc3RlbmVyJyBpbiB3aW5kb3c7XG4gICAgaWYgKCAhc3VwcG9ydHMgKSByZXR1cm47XG5cbiAgICAvLyBHZXQgYWxsIGFuY2hvcnNcbiAgICB2YXIgYW5jaG9ycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoICdbaHJlZio9XCIjXCJdJyApO1xuXG4gICAgLy8gQWRkIHNtb290aCBzY3JvbGwgdG8gYWxsIGFuY2hvcnNcbiAgICBmb3IgKCB2YXIgaSA9IDAsIGxlbiA9IGFuY2hvcnMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICAgIHZhciB1cmwgPSBuZXcgUmVnRXhwKCB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKTtcbiAgICAgICAgaWYgKCAhdXJsLnRlc3QoIGFuY2hvcnNbaV0uaHJlZiApICkgY29udGludWU7XG4gICAgICAgIGFuY2hvcnNbaV0uc2V0QXR0cmlidXRlKCAnZGF0YS1zY3JvbGwnLCB0cnVlICk7XG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbCBzbW9vdGggc2Nyb2xsIChhZGQgeW91ciBhdHRyaWJ1dGVzIGFzIGRlc2lyZWQpXG4gICAgc21vb3RoU2Nyb2xsLmluaXQoKTtcblxufSkod2luZG93LCBkb2N1bWVudCk7IiwiXG4kKHdpbmRvdykuYmluZCgnIGxvYWQgcmVzaXplIG9yaWVudGF0aW9uQ2hhbmdlICcsIGZ1bmN0aW9uICgpIHtcbiAgIHZhciBmb290ZXIgPSAkKFwiI2Zvb3Rlci1jb250YWluZXJcIik7XG4gICB2YXIgcG9zID0gZm9vdGVyLnBvc2l0aW9uKCk7XG4gICB2YXIgaGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpO1xuICAgaGVpZ2h0ID0gaGVpZ2h0IC0gcG9zLnRvcDtcbiAgIGhlaWdodCA9IGhlaWdodCAtIGZvb3Rlci5oZWlnaHQoKSAtMTtcblxuICAgZnVuY3Rpb24gc3RpY2t5Rm9vdGVyKCkge1xuICAgICBmb290ZXIuY3NzKHtcbiAgICAgICAgICdtYXJnaW4tdG9wJzogaGVpZ2h0ICsgJ3B4J1xuICAgICB9KTtcbiAgIH1cblxuICAgaWYgKGhlaWdodCA+IDApIHtcbiAgICAgc3RpY2t5Rm9vdGVyKCk7XG4gICB9XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
