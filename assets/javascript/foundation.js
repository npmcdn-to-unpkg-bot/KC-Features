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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndoYXQtaW5wdXQuanMiLCJmb3VuZGF0aW9uLmNvcmUuanMiLCJmb3VuZGF0aW9uLnV0aWwuYm94LmpzIiwiZm91bmRhdGlvbi51dGlsLmtleWJvYXJkLmpzIiwiZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnkuanMiLCJmb3VuZGF0aW9uLnV0aWwubW90aW9uLmpzIiwiZm91bmRhdGlvbi51dGlsLm5lc3QuanMiLCJmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlci5qcyIsImZvdW5kYXRpb24udXRpbC50b3VjaC5qcyIsImZvdW5kYXRpb24udXRpbC50cmlnZ2Vycy5qcyIsImZvdW5kYXRpb24uZHJvcGRvd24uanMiLCJmb3VuZGF0aW9uLmRyb3Bkb3duTWVudS5qcyIsImZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnUuanMiLCJmb3VuZGF0aW9uLnJlc3BvbnNpdmVUb2dnbGUuanMiLCJmb3VuZGF0aW9uLnJldmVhbC5qcyIsInZlZ2FzLmpzIiwiZmVhdGhlcmxpZ2h0LmpzIiwibWFzb25yeS5wa2dkLmpzIiwiaW1hZ2VzbG9hZGVkLnBrZ2QuanMiLCJmbGV4LXZpZGVvLmpzIiwiZnJvbnRwYWdlLXNsaWRlci5qcyIsImluaXQtZm91bmRhdGlvbi5qcyIsImpveXJpZGUtZGVtby5qcyIsIm9mZkNhbnZhcy5qcyIsInN0aWNreWZvb3Rlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLENBQUMsQ0FBQyxVQUFTLElBQVQsRUFBZSxPQUFmLEVBQXdCO0FBQ3hCLE1BQUksT0FBTyxNQUFQLEtBQWtCLFVBQWxCLElBQWdDLE9BQU8sR0FBUCxFQUFZO0FBQzlDLFdBQU8sRUFBUCxFQUFXLFlBQVc7QUFDcEIsYUFBUSxTQUFSLENBRG9CO0tBQVgsQ0FBWCxDQUQ4QztHQUFoRCxNQUlPLElBQUksT0FBTyxPQUFQLEtBQW1CLFFBQW5CLEVBQTZCO0FBQ3RDLFdBQU8sT0FBUCxHQUFpQixTQUFqQixDQURzQztHQUFqQyxNQUVBO0FBQ0wsU0FBSyxTQUFMLEdBQWlCLFNBQWpCLENBREs7R0FGQTtDQUxQLEVBVUMsSUFWRCxFQVVPLFlBQVc7QUFDbEI7Ozs7Ozs7OztBQURrQjtBQVdsQixNQUFJLGFBQWEsRUFBYjs7O0FBWGMsTUFjZCxPQUFPLFNBQVMsSUFBVDs7O0FBZE8sTUFpQmQsU0FBUyxLQUFUOzs7QUFqQmMsTUFvQmQsZUFBZSxJQUFmOzs7QUFwQmMsTUF1QmQsYUFBYSxDQUNmLE9BRGUsRUFFZixRQUZlLEVBR2YsVUFIZSxDQUFiOzs7QUF2QmMsTUE4QmQsYUFBYSxLQUFLLFlBQUwsQ0FBa0IsMkJBQWxCLENBQWI7OztBQTlCYyxNQWlDZCxXQUFXO0FBQ2IsZUFBVyxVQUFYO0FBQ0EsaUJBQWEsT0FBYjtBQUNBLGtCQUFjLE9BQWQ7QUFDQSxrQkFBYyxPQUFkO0FBQ0EsbUJBQWUsU0FBZjtBQUNBLHFCQUFpQixTQUFqQjtHQU5FOzs7QUFqQ2MsTUEyQ2QsYUFBYSxFQUFiOzs7QUEzQ2MsTUE4Q2QsU0FBUztBQUNYLE9BQUcsS0FBSDtBQUNBLFFBQUksT0FBSjtBQUNBLFFBQUksT0FBSjtBQUNBLFFBQUksS0FBSjtBQUNBLFFBQUksT0FBSjtBQUNBLFFBQUksTUFBSjtBQUNBLFFBQUksSUFBSjtBQUNBLFFBQUksT0FBSjtBQUNBLFFBQUksTUFBSjtHQVRFOzs7QUE5Q2MsTUEyRGQsYUFBYTtBQUNmLE9BQUcsT0FBSDtBQUNBLE9BQUcsT0FBSDtBQUNBLE9BQUcsT0FBSDtHQUhFOzs7QUEzRGMsTUFrRWQsS0FBSjs7Ozs7Ozs7QUFsRWtCLFdBMkVULFdBQVQsQ0FBcUIsS0FBckIsRUFBNEI7QUFDMUIsaUJBQWEsS0FBYixFQUQwQjs7QUFHMUIsYUFBUyxLQUFULEVBSDBCOztBQUsxQixhQUFTLElBQVQsQ0FMMEI7QUFNMUIsWUFBUSxXQUFXLFlBQVc7QUFDNUIsZUFBUyxLQUFULENBRDRCO0tBQVgsRUFFaEIsSUFGSyxDQUFSLENBTjBCO0dBQTVCOztBQVdBLFdBQVMsY0FBVCxDQUF3QixLQUF4QixFQUErQjtBQUM3QixRQUFJLENBQUMsTUFBRCxFQUFTLFNBQVMsS0FBVCxFQUFiO0dBREY7O0FBSUEsV0FBUyxRQUFULENBQWtCLEtBQWxCLEVBQXlCO0FBQ3ZCLFFBQUksV0FBVyxJQUFJLEtBQUosQ0FBWCxDQURtQjtBQUV2QixRQUFJLGNBQWMsT0FBTyxLQUFQLENBQWQsQ0FGbUI7QUFHdkIsUUFBSSxRQUFRLFNBQVMsTUFBTSxJQUFOLENBQWpCLENBSG1CO0FBSXZCLFFBQUksVUFBVSxTQUFWLEVBQXFCLFFBQVEsWUFBWSxLQUFaLENBQVIsQ0FBekI7O0FBRUEsUUFBSSxpQkFBaUIsS0FBakIsRUFBd0I7QUFDMUI7O0FBRUUsT0FBQyxVQUFEOzs7QUFHQSxrQkFIQTs7O0FBTUEsZ0JBQVUsVUFBVjs7O0FBR0EsYUFBTyxRQUFQLE1BQXFCLEtBQXJCOzs7QUFHQSxpQkFBVyxPQUFYLENBQW1CLFlBQVksUUFBWixDQUFxQixXQUFyQixFQUFuQixLQUEwRCxDQUExRCxFQUNBOztPQWZGLE1BaUJPO0FBQ0wseUJBQWUsS0FBZixDQURLO0FBRUwsZUFBSyxZQUFMLENBQWtCLGdCQUFsQixFQUFvQyxZQUFwQyxFQUZLOztBQUlMLGNBQUksV0FBVyxPQUFYLENBQW1CLFlBQW5CLE1BQXFDLENBQUMsQ0FBRCxFQUFJLFdBQVcsSUFBWCxDQUFnQixZQUFoQixFQUE3QztTQXJCRjtLQURGOztBQTBCQSxRQUFJLFVBQVUsVUFBVixFQUFzQixRQUFRLFFBQVIsRUFBMUI7R0FoQ0Y7O0FBbUNBLFdBQVMsR0FBVCxDQUFhLEtBQWIsRUFBb0I7QUFDbEIsV0FBTyxLQUFDLENBQU0sT0FBTixHQUFpQixNQUFNLE9BQU4sR0FBZ0IsTUFBTSxLQUFOLENBRHZCO0dBQXBCOztBQUlBLFdBQVMsTUFBVCxDQUFnQixLQUFoQixFQUF1QjtBQUNyQixXQUFPLE1BQU0sTUFBTixJQUFnQixNQUFNLFVBQU4sQ0FERjtHQUF2Qjs7QUFJQSxXQUFTLFdBQVQsQ0FBcUIsS0FBckIsRUFBNEI7QUFDMUIsV0FBTyxPQUFRLE1BQU0sV0FBTixLQUFzQixRQUE3QixHQUF5QyxXQUFXLE1BQU0sV0FBTixDQUFyRCxHQUEwRSxNQUFNLFdBQU4sQ0FEdkQ7R0FBNUI7OztBQXJJa0IsV0EwSVQsT0FBVCxDQUFpQixRQUFqQixFQUEyQjtBQUN6QixRQUFJLFdBQVcsT0FBWCxDQUFtQixPQUFPLFFBQVAsQ0FBbkIsTUFBeUMsQ0FBQyxDQUFELElBQU0sT0FBTyxRQUFQLENBQS9DLEVBQWlFLFdBQVcsSUFBWCxDQUFnQixPQUFPLFFBQVAsQ0FBaEIsRUFBckU7R0FERjs7QUFJQSxXQUFTLFNBQVQsQ0FBbUIsS0FBbkIsRUFBMEI7QUFDeEIsUUFBSSxXQUFXLElBQUksS0FBSixDQUFYLENBRG9CO0FBRXhCLFFBQUksV0FBVyxXQUFXLE9BQVgsQ0FBbUIsT0FBTyxRQUFQLENBQW5CLENBQVgsQ0FGb0I7O0FBSXhCLFFBQUksYUFBYSxDQUFDLENBQUQsRUFBSSxXQUFXLE1BQVgsQ0FBa0IsUUFBbEIsRUFBNEIsQ0FBNUIsRUFBckI7R0FKRjs7QUFPQSxXQUFTLFVBQVQsR0FBc0I7OztBQUdwQixRQUFJLGFBQWEsV0FBYixDQUhnQjs7QUFLcEIsUUFBSSxPQUFPLFlBQVAsRUFBcUI7QUFDdkIsbUJBQWEsYUFBYixDQUR1QjtLQUF6QixNQUVPLElBQUksT0FBTyxjQUFQLEVBQXVCO0FBQ2hDLG1CQUFhLGVBQWIsQ0FEZ0M7S0FBM0I7O0FBSVAsU0FBSyxnQkFBTCxDQUFzQixVQUF0QixFQUFrQyxjQUFsQyxFQVhvQjtBQVlwQixTQUFLLGdCQUFMLENBQXNCLFlBQXRCLEVBQW9DLGNBQXBDOzs7QUFab0IsUUFlaEIsa0JBQWtCLE1BQWxCLEVBQTBCO0FBQzVCLFdBQUssZ0JBQUwsQ0FBc0IsWUFBdEIsRUFBb0MsV0FBcEMsRUFENEI7S0FBOUI7OztBQWZvQixRQW9CcEIsQ0FBSyxnQkFBTCxDQUFzQixTQUF0QixFQUFpQyxjQUFqQyxFQXBCb0I7QUFxQnBCLGFBQVMsZ0JBQVQsQ0FBMEIsT0FBMUIsRUFBbUMsU0FBbkMsRUFyQm9CO0dBQXRCOzs7Ozs7Ozs7O0FBckprQixNQXVMZCxzQkFBc0IsTUFBdEIsSUFBZ0MsTUFBTSxTQUFOLENBQWdCLE9BQWhCLEVBQXlCO0FBQzNELGlCQUQyRDtHQUE3RDs7Ozs7Ozs7QUF2TGtCLFNBa01YOzs7QUFHTCxTQUFLLFlBQVc7QUFBRSxhQUFPLFlBQVAsQ0FBRjtLQUFYOzs7QUFHTCxVQUFNLFlBQVc7QUFBRSxhQUFPLFVBQVAsQ0FBRjtLQUFYOzs7QUFHTixXQUFPLFlBQVc7QUFBRSxhQUFPLFVBQVAsQ0FBRjtLQUFYOzs7QUFHUCxTQUFLLFFBQUw7R0FaRixDQWxNa0I7Q0FBWCxDQVZSO0NDQUQsQ0FBQyxVQUFTLENBQVQsRUFBWTs7QUFFYixlQUZhOztBQUliLE1BQUkscUJBQXFCLE9BQXJCOzs7O0FBSlMsTUFRVCxhQUFhO0FBQ2YsYUFBUyxrQkFBVDs7Ozs7QUFLQSxjQUFVLEVBQVY7Ozs7O0FBS0EsWUFBUSxFQUFSOzs7OztBQUtBLFNBQUssWUFBVTtBQUNiLGFBQU8sRUFBRSxNQUFGLEVBQVUsSUFBVixDQUFlLEtBQWYsTUFBMEIsS0FBMUIsQ0FETTtLQUFWOzs7OztBQU9MLFlBQVEsVUFBUyxNQUFULEVBQWlCLElBQWpCLEVBQXVCOzs7QUFHN0IsVUFBSSxZQUFhLFFBQVEsYUFBYSxNQUFiLENBQVI7OztBQUhZLFVBTXpCLFdBQVksVUFBVSxTQUFWLENBQVo7OztBQU55QixVQVM3QixDQUFLLFFBQUwsQ0FBYyxRQUFkLElBQTBCLEtBQUssU0FBTCxJQUFrQixNQUFsQixDQVRHO0tBQXZCOzs7Ozs7Ozs7O0FBb0JSLG9CQUFnQixVQUFTLE1BQVQsRUFBaUIsSUFBakIsRUFBc0I7QUFDcEMsVUFBSSxhQUFhLE9BQU8sVUFBVSxJQUFWLENBQVAsR0FBeUIsYUFBYSxPQUFPLFdBQVAsQ0FBYixDQUFpQyxXQUFqQyxFQUF6QixDQURtQjtBQUVwQyxhQUFPLElBQVAsR0FBYyxLQUFLLFdBQUwsQ0FBaUIsQ0FBakIsRUFBb0IsVUFBcEIsQ0FBZCxDQUZvQzs7QUFJcEMsVUFBRyxDQUFDLE9BQU8sUUFBUCxDQUFnQixJQUFoQixXQUE2QixVQUE3QixDQUFELEVBQTRDO0FBQUUsZUFBTyxRQUFQLENBQWdCLElBQWhCLFdBQTZCLFVBQTdCLEVBQTJDLE9BQU8sSUFBUCxDQUEzQyxDQUFGO09BQS9DO0FBQ0EsVUFBRyxDQUFDLE9BQU8sUUFBUCxDQUFnQixJQUFoQixDQUFxQixVQUFyQixDQUFELEVBQWtDO0FBQUUsZUFBTyxRQUFQLENBQWdCLElBQWhCLENBQXFCLFVBQXJCLEVBQWlDLE1BQWpDLEVBQUY7T0FBckM7Ozs7O0FBTG9DLFlBVXBDLENBQU8sUUFBUCxDQUFnQixPQUFoQixjQUFtQyxVQUFuQyxFQVZvQzs7QUFZcEMsV0FBSyxNQUFMLENBQVksSUFBWixDQUFpQixPQUFPLElBQVAsQ0FBakIsQ0Fab0M7O0FBY3BDLGFBZG9DO0tBQXRCOzs7Ozs7Ozs7QUF3QmhCLHNCQUFrQixVQUFTLE1BQVQsRUFBZ0I7QUFDaEMsVUFBSSxhQUFhLFVBQVUsYUFBYSxPQUFPLFFBQVAsQ0FBZ0IsSUFBaEIsQ0FBcUIsVUFBckIsRUFBaUMsV0FBakMsQ0FBdkIsQ0FBYixDQUQ0Qjs7QUFHaEMsV0FBSyxNQUFMLENBQVksTUFBWixDQUFtQixLQUFLLE1BQUwsQ0FBWSxPQUFaLENBQW9CLE9BQU8sSUFBUCxDQUF2QyxFQUFxRCxDQUFyRCxFQUhnQztBQUloQyxhQUFPLFFBQVAsQ0FBZ0IsVUFBaEIsV0FBbUMsVUFBbkMsRUFBaUQsVUFBakQsQ0FBNEQsVUFBNUQ7Ozs7O09BS08sT0FMUCxtQkFLK0IsVUFML0IsRUFKZ0M7QUFVaEMsV0FBSSxJQUFJLElBQUosSUFBWSxNQUFoQixFQUF1QjtBQUNyQixlQUFPLElBQVAsSUFBZSxJQUFmO0FBRHFCLE9BQXZCO0FBR0EsYUFiZ0M7S0FBaEI7Ozs7Ozs7O0FBc0JqQixZQUFRLFVBQVMsT0FBVCxFQUFpQjtBQUN2QixVQUFJLE9BQU8sbUJBQW1CLENBQW5CLENBRFk7QUFFdkIsVUFBRztBQUNELFlBQUcsSUFBSCxFQUFRO0FBQ04sa0JBQVEsSUFBUixDQUFhLFlBQVU7QUFDckIsY0FBRSxJQUFGLEVBQVEsSUFBUixDQUFhLFVBQWIsRUFBeUIsS0FBekIsR0FEcUI7V0FBVixDQUFiLENBRE07U0FBUixNQUlLO0FBQ0gsY0FBSSxPQUFPLE9BQU8sT0FBUDtjQUNYLFFBQVEsSUFBUjtjQUNBLE1BQU07QUFDSixzQkFBVSxVQUFTLElBQVQsRUFBYztBQUN0QixtQkFBSyxPQUFMLENBQWEsVUFBUyxDQUFULEVBQVc7QUFDdEIsb0JBQUksVUFBVSxDQUFWLENBQUosQ0FEc0I7QUFFdEIsa0JBQUUsV0FBVSxDQUFWLEdBQWEsR0FBYixDQUFGLENBQW9CLFVBQXBCLENBQStCLE9BQS9CLEVBRnNCO2VBQVgsQ0FBYixDQURzQjthQUFkO0FBTVYsc0JBQVUsWUFBVTtBQUNsQix3QkFBVSxVQUFVLE9BQVYsQ0FBVixDQURrQjtBQUVsQixnQkFBRSxXQUFVLE9BQVYsR0FBbUIsR0FBbkIsQ0FBRixDQUEwQixVQUExQixDQUFxQyxPQUFyQyxFQUZrQjthQUFWO0FBSVYseUJBQWEsWUFBVTtBQUNyQixtQkFBSyxRQUFMLEVBQWUsT0FBTyxJQUFQLENBQVksTUFBTSxRQUFOLENBQTNCLEVBRHFCO2FBQVY7V0FYZixDQUhHO0FBa0JILGNBQUksSUFBSixFQUFVLE9BQVYsRUFsQkc7U0FKTDtPQURGLENBeUJDLE9BQU0sR0FBTixFQUFVO0FBQ1QsZ0JBQVEsS0FBUixDQUFjLEdBQWQsRUFEUztPQUFWLFNBRU87QUFDTixlQUFPLE9BQVAsQ0FETTtPQTNCUjtLQUZNOzs7Ozs7Ozs7O0FBMENULGlCQUFhLFVBQVMsTUFBVCxFQUFpQixTQUFqQixFQUEyQjtBQUN0QyxlQUFTLFVBQVUsQ0FBVixDQUQ2QjtBQUV0QyxhQUFPLEtBQUssS0FBTCxDQUFZLEtBQUssR0FBTCxDQUFTLEVBQVQsRUFBYSxTQUFTLENBQVQsQ0FBYixHQUEyQixLQUFLLE1BQUwsS0FBZ0IsS0FBSyxHQUFMLENBQVMsRUFBVCxFQUFhLE1BQWIsQ0FBaEIsQ0FBdkMsQ0FBOEUsUUFBOUUsQ0FBdUYsRUFBdkYsRUFBMkYsS0FBM0YsQ0FBaUcsQ0FBakcsS0FBdUcsa0JBQWdCLFNBQWhCLEdBQThCLEVBQTlCLENBQXZHLENBRitCO0tBQTNCOzs7Ozs7QUFTYixZQUFRLFVBQVMsSUFBVCxFQUFlLE9BQWYsRUFBd0I7OztBQUc5QixVQUFJLE9BQU8sT0FBUCxLQUFtQixXQUFuQixFQUFnQztBQUNsQyxrQkFBVSxPQUFPLElBQVAsQ0FBWSxLQUFLLFFBQUwsQ0FBdEIsQ0FEa0M7OztBQUFwQyxXQUlLLElBQUksT0FBTyxPQUFQLEtBQW1CLFFBQW5CLEVBQTZCO0FBQ3BDLG9CQUFVLENBQUMsT0FBRCxDQUFWLENBRG9DO1NBQWpDOztBQUlMLFVBQUksUUFBUSxJQUFSOzs7QUFYMEIsT0FjOUIsQ0FBRSxJQUFGLENBQU8sT0FBUCxFQUFnQixVQUFTLENBQVQsRUFBWSxJQUFaLEVBQWtCOztBQUVoQyxZQUFJLFNBQVMsTUFBTSxRQUFOLENBQWUsSUFBZixDQUFUOzs7QUFGNEIsWUFLNUIsUUFBUSxFQUFFLElBQUYsRUFBUSxJQUFSLENBQWEsV0FBUyxJQUFULEdBQWMsR0FBZCxDQUFiLENBQWdDLE9BQWhDLENBQXdDLFdBQVMsSUFBVCxHQUFjLEdBQWQsQ0FBaEQ7OztBQUw0QixhQVFoQyxDQUFNLElBQU4sQ0FBVyxZQUFXO0FBQ3BCLGNBQUksTUFBTSxFQUFFLElBQUYsQ0FBTjtjQUNBLE9BQU8sRUFBUDs7QUFGZ0IsY0FJaEIsSUFBSSxJQUFKLENBQVMsVUFBVCxDQUFKLEVBQTBCO0FBQ3hCLG9CQUFRLElBQVIsQ0FBYSx5QkFBdUIsSUFBdkIsR0FBNEIsc0RBQTVCLENBQWIsQ0FEd0I7QUFFeEIsbUJBRndCO1dBQTFCOztBQUtBLGNBQUcsSUFBSSxJQUFKLENBQVMsY0FBVCxDQUFILEVBQTRCO0FBQzFCLGdCQUFJLFFBQVEsSUFBSSxJQUFKLENBQVMsY0FBVCxFQUF5QixLQUF6QixDQUErQixHQUEvQixFQUFvQyxPQUFwQyxDQUE0QyxVQUFTLENBQVQsRUFBWSxDQUFaLEVBQWM7QUFDcEUsa0JBQUksTUFBTSxFQUFFLEtBQUYsQ0FBUSxHQUFSLEVBQWEsR0FBYixDQUFpQixVQUFTLEVBQVQsRUFBWTtBQUFFLHVCQUFPLEdBQUcsSUFBSCxFQUFQLENBQUY7ZUFBWixDQUF2QixDQURnRTtBQUVwRSxrQkFBRyxJQUFJLENBQUosQ0FBSCxFQUFXLEtBQUssSUFBSSxDQUFKLENBQUwsSUFBZSxXQUFXLElBQUksQ0FBSixDQUFYLENBQWYsQ0FBWDthQUZzRCxDQUFwRCxDQURzQjtXQUE1QjtBQU1BLGNBQUc7QUFDRCxnQkFBSSxJQUFKLENBQVMsVUFBVCxFQUFxQixJQUFJLE1BQUosQ0FBVyxFQUFFLElBQUYsQ0FBWCxFQUFvQixJQUFwQixDQUFyQixFQURDO1dBQUgsQ0FFQyxPQUFNLEVBQU4sRUFBUztBQUNSLG9CQUFRLEtBQVIsQ0FBYyxFQUFkLEVBRFE7V0FBVCxTQUVPO0FBQ04sbUJBRE07V0FKUjtTQWZTLENBQVgsQ0FSZ0M7T0FBbEIsQ0FBaEIsQ0FkOEI7S0FBeEI7QUErQ1IsZUFBVyxZQUFYO0FBQ0EsbUJBQWUsVUFBUyxLQUFULEVBQWU7QUFDNUIsVUFBSSxjQUFjO0FBQ2hCLHNCQUFjLGVBQWQ7QUFDQSw0QkFBb0IscUJBQXBCO0FBQ0EseUJBQWlCLGVBQWpCO0FBQ0EsdUJBQWUsZ0JBQWY7T0FKRSxDQUR3QjtBQU81QixVQUFJLE9BQU8sU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQVA7VUFDQSxHQURKLENBUDRCOztBQVU1QixXQUFLLElBQUksQ0FBSixJQUFTLFdBQWQsRUFBMEI7QUFDeEIsWUFBSSxPQUFPLEtBQUssS0FBTCxDQUFXLENBQVgsQ0FBUCxLQUF5QixXQUF6QixFQUFxQztBQUN2QyxnQkFBTSxZQUFZLENBQVosQ0FBTixDQUR1QztTQUF6QztPQURGO0FBS0EsVUFBRyxHQUFILEVBQU87QUFDTCxlQUFPLEdBQVAsQ0FESztPQUFQLE1BRUs7QUFDSCxjQUFNLFdBQVcsWUFBVTtBQUN6QixnQkFBTSxjQUFOLENBQXFCLGVBQXJCLEVBQXNDLENBQUMsS0FBRCxDQUF0QyxFQUR5QjtTQUFWLEVBRWQsQ0FGRyxDQUFOLENBREc7QUFJSCxlQUFPLGVBQVAsQ0FKRztPQUZMO0tBZmE7R0E1TGIsQ0FSUzs7QUE4TmIsYUFBVyxJQUFYLEdBQWtCOzs7Ozs7OztBQVFoQixjQUFVLFVBQVUsSUFBVixFQUFnQixLQUFoQixFQUF1QjtBQUMvQixVQUFJLFFBQVEsSUFBUixDQUQyQjs7QUFHL0IsYUFBTyxZQUFZO0FBQ2pCLFlBQUksVUFBVSxJQUFWO1lBQWdCLE9BQU8sU0FBUCxDQURIOztBQUdqQixZQUFJLFVBQVUsSUFBVixFQUFnQjtBQUNsQixrQkFBUSxXQUFXLFlBQVk7QUFDN0IsaUJBQUssS0FBTCxDQUFXLE9BQVgsRUFBb0IsSUFBcEIsRUFENkI7QUFFN0Isb0JBQVEsSUFBUixDQUY2QjtXQUFaLEVBR2hCLEtBSEssQ0FBUixDQURrQjtTQUFwQjtPQUhLLENBSHdCO0tBQXZCO0dBUlo7Ozs7Ozs7O0FBOU5hLE1BNFBULGFBQWEsVUFBUyxNQUFULEVBQWlCO0FBQ2hDLFFBQUksT0FBTyxPQUFPLE1BQVA7UUFDUCxRQUFRLEVBQUUsb0JBQUYsQ0FBUjtRQUNBLFFBQVEsRUFBRSxRQUFGLENBQVIsQ0FINEI7O0FBS2hDLFFBQUcsQ0FBQyxNQUFNLE1BQU4sRUFBYTtBQUNmLFFBQUUsOEJBQUYsRUFBa0MsUUFBbEMsQ0FBMkMsU0FBUyxJQUFULENBQTNDLENBRGU7S0FBakI7QUFHQSxRQUFHLE1BQU0sTUFBTixFQUFhO0FBQ2QsWUFBTSxXQUFOLENBQWtCLE9BQWxCLEVBRGM7S0FBaEI7O0FBSUEsUUFBRyxTQUFTLFdBQVQsRUFBcUI7O0FBQ3RCLGlCQUFXLFVBQVgsQ0FBc0IsS0FBdEIsR0FEc0I7QUFFdEIsaUJBQVcsTUFBWCxDQUFrQixJQUFsQixFQUZzQjtLQUF4QixNQUdNLElBQUcsU0FBUyxRQUFULEVBQWtCOztBQUN6QixVQUFJLE9BQU8sTUFBTSxTQUFOLENBQWdCLEtBQWhCLENBQXNCLElBQXRCLENBQTJCLFNBQTNCLEVBQXNDLENBQXRDLENBQVA7QUFEcUIsVUFFckIsWUFBWSxLQUFLLElBQUwsQ0FBVSxVQUFWLENBQVo7O0FBRnFCLFVBSXRCLGNBQWMsU0FBZCxJQUEyQixVQUFVLE1BQVYsTUFBc0IsU0FBdEIsRUFBZ0M7O0FBQzVELFlBQUcsS0FBSyxNQUFMLEtBQWdCLENBQWhCLEVBQWtCOztBQUNqQixvQkFBVSxNQUFWLEVBQWtCLEtBQWxCLENBQXdCLFNBQXhCLEVBQW1DLElBQW5DLEVBRGlCO1NBQXJCLE1BRUs7QUFDSCxlQUFLLElBQUwsQ0FBVSxVQUFTLENBQVQsRUFBWSxFQUFaLEVBQWU7O0FBQ3ZCLHNCQUFVLE1BQVYsRUFBa0IsS0FBbEIsQ0FBd0IsRUFBRSxFQUFGLEVBQU0sSUFBTixDQUFXLFVBQVgsQ0FBeEIsRUFBZ0QsSUFBaEQsRUFEdUI7V0FBZixDQUFWLENBREc7U0FGTDtPQURGLE1BUUs7O0FBQ0gsY0FBTSxJQUFJLGNBQUosQ0FBbUIsbUJBQW1CLE1BQW5CLEdBQTRCLG1DQUE1QixJQUFtRSxZQUFZLGFBQWEsU0FBYixDQUFaLEdBQXNDLGNBQXRDLENBQW5FLEdBQTJILEdBQTNILENBQXpCLENBREc7T0FSTDtLQUpJLE1BZUQ7O0FBQ0gsWUFBTSxJQUFJLFNBQUosb0JBQThCLHFHQUE5QixDQUFOLENBREc7S0FmQztBQWtCTixXQUFPLElBQVAsQ0FqQ2dDO0dBQWpCLENBNVBKOztBQWdTYixTQUFPLFVBQVAsR0FBb0IsVUFBcEIsQ0FoU2E7QUFpU2IsSUFBRSxFQUFGLENBQUssVUFBTCxHQUFrQixVQUFsQjs7O0FBalNhLEdBb1NaLFlBQVc7QUFDVixRQUFJLENBQUMsS0FBSyxHQUFMLElBQVksQ0FBQyxPQUFPLElBQVAsQ0FBWSxHQUFaLEVBQ2hCLE9BQU8sSUFBUCxDQUFZLEdBQVosR0FBa0IsS0FBSyxHQUFMLEdBQVcsWUFBVztBQUFFLGFBQU8sSUFBSSxJQUFKLEdBQVcsT0FBWCxFQUFQLENBQUY7S0FBWCxDQUQvQjs7QUFHQSxRQUFJLFVBQVUsQ0FBQyxRQUFELEVBQVcsS0FBWCxDQUFWLENBSk07QUFLVixTQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sSUFBSSxRQUFRLE1BQVIsSUFBa0IsQ0FBQyxPQUFPLHFCQUFQLEVBQThCLEVBQUUsQ0FBRixFQUFLO0FBQ3RFLFVBQUksS0FBSyxRQUFRLENBQVIsQ0FBTCxDQURrRTtBQUV0RSxhQUFPLHFCQUFQLEdBQStCLE9BQU8sS0FBRyx1QkFBSCxDQUF0QyxDQUZzRTtBQUd0RSxhQUFPLG9CQUFQLEdBQStCLE9BQU8sS0FBRyxzQkFBSCxDQUFQLElBQ0QsT0FBTyxLQUFHLDZCQUFILENBRE4sQ0FIdUM7S0FBMUU7QUFNQSxRQUFJLHVCQUF1QixJQUF2QixDQUE0QixPQUFPLFNBQVAsQ0FBaUIsU0FBakIsQ0FBNUIsSUFDQyxDQUFDLE9BQU8scUJBQVAsSUFBZ0MsQ0FBQyxPQUFPLG9CQUFQLEVBQTZCO0FBQ2xFLFVBQUksV0FBVyxDQUFYLENBRDhEO0FBRWxFLGFBQU8scUJBQVAsR0FBK0IsVUFBUyxRQUFULEVBQW1CO0FBQzlDLFlBQUksTUFBTSxLQUFLLEdBQUwsRUFBTixDQUQwQztBQUU5QyxZQUFJLFdBQVcsS0FBSyxHQUFMLENBQVMsV0FBVyxFQUFYLEVBQWUsR0FBeEIsQ0FBWCxDQUYwQztBQUc5QyxlQUFPLFdBQVcsWUFBVztBQUFFLG1CQUFTLFdBQVcsUUFBWCxDQUFULENBQUY7U0FBWCxFQUNBLFdBQVcsR0FBWCxDQURsQixDQUg4QztPQUFuQixDQUZtQztBQVFsRSxhQUFPLG9CQUFQLEdBQThCLFlBQTlCLENBUmtFO0tBRHBFOzs7O0FBWFUsUUF5QlAsQ0FBQyxPQUFPLFdBQVAsSUFBc0IsQ0FBQyxPQUFPLFdBQVAsQ0FBbUIsR0FBbkIsRUFBdUI7QUFDaEQsYUFBTyxXQUFQLEdBQXFCO0FBQ25CLGVBQU8sS0FBSyxHQUFMLEVBQVA7QUFDQSxhQUFLLFlBQVU7QUFBRSxpQkFBTyxLQUFLLEdBQUwsS0FBYSxLQUFLLEtBQUwsQ0FBdEI7U0FBVjtPQUZQLENBRGdEO0tBQWxEO0dBekJELENBQUQsR0FwU2E7QUFvVWIsTUFBSSxDQUFDLFNBQVMsU0FBVCxDQUFtQixJQUFuQixFQUF5QjtBQUM1QixhQUFTLFNBQVQsQ0FBbUIsSUFBbkIsR0FBMEIsVUFBUyxLQUFULEVBQWdCO0FBQ3hDLFVBQUksT0FBTyxJQUFQLEtBQWdCLFVBQWhCLEVBQTRCOzs7QUFHOUIsY0FBTSxJQUFJLFNBQUosQ0FBYyxzRUFBZCxDQUFOLENBSDhCO09BQWhDOztBQU1BLFVBQUksUUFBVSxNQUFNLFNBQU4sQ0FBZ0IsS0FBaEIsQ0FBc0IsSUFBdEIsQ0FBMkIsU0FBM0IsRUFBc0MsQ0FBdEMsQ0FBVjtVQUNBLFVBQVUsSUFBVjtVQUNBLE9BQVUsWUFBVyxFQUFYO1VBQ1YsU0FBVSxZQUFXO0FBQ25CLGVBQU8sUUFBUSxLQUFSLENBQWMsZ0JBQWdCLElBQWhCLEdBQ1osSUFEWSxHQUVaLEtBRlksRUFHZCxNQUFNLE1BQU4sQ0FBYSxNQUFNLFNBQU4sQ0FBZ0IsS0FBaEIsQ0FBc0IsSUFBdEIsQ0FBMkIsU0FBM0IsQ0FBYixDQUhBLENBQVAsQ0FEbUI7T0FBWCxDQVYwQjs7QUFpQnhDLFVBQUksS0FBSyxTQUFMLEVBQWdCOztBQUVsQixhQUFLLFNBQUwsR0FBaUIsS0FBSyxTQUFMLENBRkM7T0FBcEI7QUFJQSxhQUFPLFNBQVAsR0FBbUIsSUFBSSxJQUFKLEVBQW5CLENBckJ3Qzs7QUF1QnhDLGFBQU8sTUFBUCxDQXZCd0M7S0FBaEIsQ0FERTtHQUE5Qjs7QUFwVWEsV0FnV0osWUFBVCxDQUFzQixFQUF0QixFQUEwQjtBQUN4QixRQUFJLFNBQVMsU0FBVCxDQUFtQixJQUFuQixLQUE0QixTQUE1QixFQUF1QztBQUN6QyxVQUFJLGdCQUFnQix3QkFBaEIsQ0FEcUM7QUFFekMsVUFBSSxVQUFVLGNBQWdCLElBQWhCLENBQXFCLEdBQUssUUFBTCxFQUFyQixDQUFWLENBRnFDO0FBR3pDLGFBQU8sT0FBQyxJQUFXLFFBQVEsTUFBUixHQUFpQixDQUFqQixHQUFzQixRQUFRLENBQVIsRUFBVyxJQUFYLEVBQWxDLEdBQXNELEVBQXRELENBSGtDO0tBQTNDLE1BS0ssSUFBSSxHQUFHLFNBQUgsS0FBaUIsU0FBakIsRUFBNEI7QUFDbkMsYUFBTyxHQUFHLFdBQUgsQ0FBZSxJQUFmLENBRDRCO0tBQWhDLE1BR0E7QUFDSCxhQUFPLEdBQUcsU0FBSCxDQUFhLFdBQWIsQ0FBeUIsSUFBekIsQ0FESjtLQUhBO0dBTlA7QUFhQSxXQUFTLFVBQVQsQ0FBb0IsR0FBcEIsRUFBd0I7QUFDdEIsUUFBRyxPQUFPLElBQVAsQ0FBWSxHQUFaLENBQUgsRUFBcUIsT0FBTyxJQUFQLENBQXJCLEtBQ0ssSUFBRyxRQUFRLElBQVIsQ0FBYSxHQUFiLENBQUgsRUFBc0IsT0FBTyxLQUFQLENBQXRCLEtBQ0EsSUFBRyxDQUFDLE1BQU0sTUFBTSxDQUFOLENBQVAsRUFBaUIsT0FBTyxXQUFXLEdBQVgsQ0FBUCxDQUFwQjtBQUNMLFdBQU8sR0FBUCxDQUpzQjtHQUF4Qjs7O0FBN1dhLFdBcVhKLFNBQVQsQ0FBbUIsR0FBbkIsRUFBd0I7QUFDdEIsV0FBTyxJQUFJLE9BQUosQ0FBWSxpQkFBWixFQUErQixPQUEvQixFQUF3QyxXQUF4QyxFQUFQLENBRHNCO0dBQXhCO0NBclhDLENBeVhDLE1BelhELENBQUQ7Q0NBQTs7QUFFQSxDQUFDLFVBQVMsQ0FBVCxFQUFZOztBQUViLGFBQVcsR0FBWCxHQUFpQjtBQUNmLHNCQUFrQixnQkFBbEI7QUFDQSxtQkFBZSxhQUFmO0FBQ0EsZ0JBQVksVUFBWjtHQUhGOzs7Ozs7Ozs7Ozs7QUFGYSxXQWtCSixnQkFBVCxDQUEwQixPQUExQixFQUFtQyxNQUFuQyxFQUEyQyxNQUEzQyxFQUFtRCxNQUFuRCxFQUEyRDtBQUN6RCxRQUFJLFVBQVUsY0FBYyxPQUFkLENBQVY7UUFDQSxHQURKO1FBQ1MsTUFEVDtRQUNpQixJQURqQjtRQUN1QixLQUR2QixDQUR5RDs7QUFJekQsUUFBSSxNQUFKLEVBQVk7QUFDVixVQUFJLFVBQVUsY0FBYyxNQUFkLENBQVYsQ0FETTs7QUFHVixlQUFVLFFBQVEsTUFBUixDQUFlLEdBQWYsR0FBcUIsUUFBUSxNQUFSLElBQWtCLFFBQVEsTUFBUixHQUFpQixRQUFRLE1BQVIsQ0FBZSxHQUFmLENBSHhEO0FBSVYsWUFBVSxRQUFRLE1BQVIsQ0FBZSxHQUFmLElBQXNCLFFBQVEsTUFBUixDQUFlLEdBQWYsQ0FKdEI7QUFLVixhQUFVLFFBQVEsTUFBUixDQUFlLElBQWYsSUFBdUIsUUFBUSxNQUFSLENBQWUsSUFBZixDQUx2QjtBQU1WLGNBQVUsUUFBUSxNQUFSLENBQWUsSUFBZixHQUFzQixRQUFRLEtBQVIsSUFBaUIsUUFBUSxLQUFSLENBTnZDO0tBQVosTUFRSztBQUNILGVBQVUsUUFBUSxNQUFSLENBQWUsR0FBZixHQUFxQixRQUFRLE1BQVIsSUFBa0IsUUFBUSxVQUFSLENBQW1CLE1BQW5CLEdBQTRCLFFBQVEsVUFBUixDQUFtQixNQUFuQixDQUEwQixHQUExQixDQUQxRTtBQUVILFlBQVUsUUFBUSxNQUFSLENBQWUsR0FBZixJQUFzQixRQUFRLFVBQVIsQ0FBbUIsTUFBbkIsQ0FBMEIsR0FBMUIsQ0FGN0I7QUFHSCxhQUFVLFFBQVEsTUFBUixDQUFlLElBQWYsSUFBdUIsUUFBUSxVQUFSLENBQW1CLE1BQW5CLENBQTBCLElBQTFCLENBSDlCO0FBSUgsY0FBVSxRQUFRLE1BQVIsQ0FBZSxJQUFmLEdBQXNCLFFBQVEsS0FBUixJQUFpQixRQUFRLFVBQVIsQ0FBbUIsS0FBbkIsQ0FKOUM7S0FSTDs7QUFlQSxRQUFJLFVBQVUsQ0FBQyxNQUFELEVBQVMsR0FBVCxFQUFjLElBQWQsRUFBb0IsS0FBcEIsQ0FBVixDQW5CcUQ7O0FBcUJ6RCxRQUFJLE1BQUosRUFBWTtBQUNWLGFBQU8sU0FBUyxLQUFULEtBQW1CLElBQW5CLENBREc7S0FBWjs7QUFJQSxRQUFJLE1BQUosRUFBWTtBQUNWLGFBQU8sUUFBUSxNQUFSLEtBQW1CLElBQW5CLENBREc7S0FBWjs7QUFJQSxXQUFPLFFBQVEsT0FBUixDQUFnQixLQUFoQixNQUEyQixDQUFDLENBQUQsQ0E3QnVCO0dBQTNEOzs7Ozs7Ozs7QUFsQmEsV0F5REosYUFBVCxDQUF1QixJQUF2QixFQUE2QixJQUE3QixFQUFrQztBQUNoQyxXQUFPLEtBQUssTUFBTCxHQUFjLEtBQUssQ0FBTCxDQUFkLEdBQXdCLElBQXhCLENBRHlCOztBQUdoQyxRQUFJLFNBQVMsTUFBVCxJQUFtQixTQUFTLFFBQVQsRUFBbUI7QUFDeEMsWUFBTSxJQUFJLEtBQUosQ0FBVSw4Q0FBVixDQUFOLENBRHdDO0tBQTFDOztBQUlBLFFBQUksT0FBTyxLQUFLLHFCQUFMLEVBQVA7UUFDQSxVQUFVLEtBQUssVUFBTCxDQUFnQixxQkFBaEIsRUFBVjtRQUNBLFVBQVUsU0FBUyxJQUFULENBQWMscUJBQWQsRUFBVjtRQUNBLE9BQU8sT0FBTyxXQUFQO1FBQ1AsT0FBTyxPQUFPLFdBQVAsQ0FYcUI7O0FBYWhDLFdBQU87QUFDTCxhQUFPLEtBQUssS0FBTDtBQUNQLGNBQVEsS0FBSyxNQUFMO0FBQ1IsY0FBUTtBQUNOLGFBQUssS0FBSyxHQUFMLEdBQVcsSUFBWDtBQUNMLGNBQU0sS0FBSyxJQUFMLEdBQVksSUFBWjtPQUZSO0FBSUEsa0JBQVk7QUFDVixlQUFPLFFBQVEsS0FBUjtBQUNQLGdCQUFRLFFBQVEsTUFBUjtBQUNSLGdCQUFRO0FBQ04sZUFBSyxRQUFRLEdBQVIsR0FBYyxJQUFkO0FBQ0wsZ0JBQU0sUUFBUSxJQUFSLEdBQWUsSUFBZjtTQUZSO09BSEY7QUFRQSxrQkFBWTtBQUNWLGVBQU8sUUFBUSxLQUFSO0FBQ1AsZ0JBQVEsUUFBUSxNQUFSO0FBQ1IsZ0JBQVE7QUFDTixlQUFLLElBQUw7QUFDQSxnQkFBTSxJQUFOO1NBRkY7T0FIRjtLQWZGLENBYmdDO0dBQWxDOzs7Ozs7Ozs7Ozs7OztBQXpEYSxXQTRHSixVQUFULENBQW9CLE9BQXBCLEVBQTZCLE1BQTdCLEVBQXFDLFFBQXJDLEVBQStDLE9BQS9DLEVBQXdELE9BQXhELEVBQWlFLFVBQWpFLEVBQTZFO0FBQzNFLFFBQUksV0FBVyxjQUFjLE9BQWQsQ0FBWDtRQUNBLGNBQWMsU0FBUyxjQUFjLE1BQWQsQ0FBVCxHQUFpQyxJQUFqQyxDQUZ5RDs7QUFJM0UsWUFBUSxRQUFSO0FBQ0UsV0FBSyxLQUFMO0FBQ0UsZUFBTztBQUNMLGdCQUFPLFdBQVcsR0FBWCxLQUFtQixZQUFZLE1BQVosQ0FBbUIsSUFBbkIsR0FBMEIsU0FBUyxLQUFULEdBQWlCLFlBQVksS0FBWixHQUFvQixZQUFZLE1BQVosQ0FBbUIsSUFBbkI7QUFDekYsZUFBSyxZQUFZLE1BQVosQ0FBbUIsR0FBbkIsSUFBMEIsU0FBUyxNQUFULEdBQWtCLE9BQWxCLENBQTFCO1NBRlAsQ0FERjtBQUtFLGNBTEY7QUFERixXQU9PLE1BQUw7QUFDRSxlQUFPO0FBQ0wsZ0JBQU0sWUFBWSxNQUFaLENBQW1CLElBQW5CLElBQTJCLFNBQVMsS0FBVCxHQUFpQixPQUFqQixDQUEzQjtBQUNOLGVBQUssWUFBWSxNQUFaLENBQW1CLEdBQW5CO1NBRlAsQ0FERjtBQUtFLGNBTEY7QUFQRixXQWFPLE9BQUw7QUFDRSxlQUFPO0FBQ0wsZ0JBQU0sWUFBWSxNQUFaLENBQW1CLElBQW5CLEdBQTBCLFlBQVksS0FBWixHQUFvQixPQUE5QztBQUNOLGVBQUssWUFBWSxNQUFaLENBQW1CLEdBQW5CO1NBRlAsQ0FERjtBQUtFLGNBTEY7QUFiRixXQW1CTyxZQUFMO0FBQ0UsZUFBTztBQUNMLGdCQUFNLFdBQUMsQ0FBWSxNQUFaLENBQW1CLElBQW5CLEdBQTJCLFlBQVksS0FBWixHQUFvQixDQUFwQixHQUEyQixTQUFTLEtBQVQsR0FBaUIsQ0FBakI7QUFDN0QsZUFBSyxZQUFZLE1BQVosQ0FBbUIsR0FBbkIsSUFBMEIsU0FBUyxNQUFULEdBQWtCLE9BQWxCLENBQTFCO1NBRlAsQ0FERjtBQUtFLGNBTEY7QUFuQkYsV0F5Qk8sZUFBTDtBQUNFLGVBQU87QUFDTCxnQkFBTSxhQUFhLE9BQWIsR0FBd0IsV0FBQyxDQUFZLE1BQVosQ0FBbUIsSUFBbkIsR0FBMkIsWUFBWSxLQUFaLEdBQW9CLENBQXBCLEdBQTJCLFNBQVMsS0FBVCxHQUFpQixDQUFqQjtBQUNyRixlQUFLLFlBQVksTUFBWixDQUFtQixHQUFuQixHQUF5QixZQUFZLE1BQVosR0FBcUIsT0FBOUM7U0FGUCxDQURGO0FBS0UsY0FMRjtBQXpCRixXQStCTyxhQUFMO0FBQ0UsZUFBTztBQUNMLGdCQUFNLFlBQVksTUFBWixDQUFtQixJQUFuQixJQUEyQixTQUFTLEtBQVQsR0FBaUIsT0FBakIsQ0FBM0I7QUFDTixlQUFLLFdBQUMsQ0FBWSxNQUFaLENBQW1CLEdBQW5CLEdBQTBCLFlBQVksTUFBWixHQUFxQixDQUFyQixHQUE0QixTQUFTLE1BQVQsR0FBa0IsQ0FBbEI7U0FGOUQsQ0FERjtBQUtFLGNBTEY7QUEvQkYsV0FxQ08sY0FBTDtBQUNFLGVBQU87QUFDTCxnQkFBTSxZQUFZLE1BQVosQ0FBbUIsSUFBbkIsR0FBMEIsWUFBWSxLQUFaLEdBQW9CLE9BQTlDLEdBQXdELENBQXhEO0FBQ04sZUFBSyxXQUFDLENBQVksTUFBWixDQUFtQixHQUFuQixHQUEwQixZQUFZLE1BQVosR0FBcUIsQ0FBckIsR0FBNEIsU0FBUyxNQUFULEdBQWtCLENBQWxCO1NBRjlELENBREY7QUFLRSxjQUxGO0FBckNGLFdBMkNPLFFBQUw7QUFDRSxlQUFPO0FBQ0wsZ0JBQU0sUUFBQyxDQUFTLFVBQVQsQ0FBb0IsTUFBcEIsQ0FBMkIsSUFBM0IsR0FBbUMsU0FBUyxVQUFULENBQW9CLEtBQXBCLEdBQTRCLENBQTVCLEdBQW1DLFNBQVMsS0FBVCxHQUFpQixDQUFqQjtBQUM3RSxlQUFLLFFBQUMsQ0FBUyxVQUFULENBQW9CLE1BQXBCLENBQTJCLEdBQTNCLEdBQWtDLFNBQVMsVUFBVCxDQUFvQixNQUFwQixHQUE2QixDQUE3QixHQUFvQyxTQUFTLE1BQVQsR0FBa0IsQ0FBbEI7U0FGOUUsQ0FERjtBQUtFLGNBTEY7QUEzQ0YsV0FpRE8sUUFBTDtBQUNFLGVBQU87QUFDTCxnQkFBTSxDQUFDLFNBQVMsVUFBVCxDQUFvQixLQUFwQixHQUE0QixTQUFTLEtBQVQsQ0FBN0IsR0FBK0MsQ0FBL0M7QUFDTixlQUFLLFNBQVMsVUFBVCxDQUFvQixNQUFwQixDQUEyQixHQUEzQixHQUFpQyxPQUFqQztTQUZQLENBREY7QUFqREYsV0FzRE8sYUFBTDtBQUNFLGVBQU87QUFDTCxnQkFBTSxTQUFTLFVBQVQsQ0FBb0IsTUFBcEIsQ0FBMkIsSUFBM0I7QUFDTixlQUFLLFNBQVMsVUFBVCxDQUFvQixNQUFwQixDQUEyQixHQUEzQjtTQUZQLENBREY7QUFLRSxjQUxGO0FBdERGO0FBNkRJLGVBQU87QUFDTCxnQkFBTyxXQUFXLEdBQVgsS0FBbUIsWUFBWSxNQUFaLENBQW1CLElBQW5CLEdBQTBCLFNBQVMsS0FBVCxHQUFpQixZQUFZLEtBQVosR0FBb0IsWUFBWSxNQUFaLENBQW1CLElBQW5CO0FBQ3pGLGVBQUssWUFBWSxNQUFaLENBQW1CLEdBQW5CLEdBQXlCLFlBQVksTUFBWixHQUFxQixPQUE5QztTQUZQLENBREY7QUE1REYsS0FKMkU7R0FBN0U7Q0E1R0MsQ0FvTEMsTUFwTEQsQ0FBRDs7Ozs7Ozs7O0FDTUE7O0FBRUEsQ0FBQyxVQUFTLENBQVQsRUFBWTs7QUFFYixNQUFNLFdBQVc7QUFDZixPQUFHLEtBQUg7QUFDQSxRQUFJLE9BQUo7QUFDQSxRQUFJLFFBQUo7QUFDQSxRQUFJLE9BQUo7QUFDQSxRQUFJLFlBQUo7QUFDQSxRQUFJLFVBQUo7QUFDQSxRQUFJLGFBQUo7QUFDQSxRQUFJLFlBQUo7R0FSSSxDQUZPOztBQWFiLE1BQUksV0FBVyxFQUFYLENBYlM7O0FBZWIsTUFBSSxXQUFXO0FBQ2IsVUFBTSxZQUFZLFFBQVosQ0FBTjs7Ozs7Ozs7QUFRQSx3QkFBUyxPQUFPO0FBQ2QsVUFBSSxNQUFNLFNBQVMsTUFBTSxLQUFOLElBQWUsTUFBTSxPQUFOLENBQXhCLElBQTBDLE9BQU8sWUFBUCxDQUFvQixNQUFNLEtBQU4sQ0FBcEIsQ0FBaUMsV0FBakMsRUFBMUMsQ0FESTtBQUVkLFVBQUksTUFBTSxRQUFOLEVBQWdCLGlCQUFlLEdBQWYsQ0FBcEI7QUFDQSxVQUFJLE1BQU0sT0FBTixFQUFlLGdCQUFjLEdBQWQsQ0FBbkI7QUFDQSxVQUFJLE1BQU0sTUFBTixFQUFjLGVBQWEsR0FBYixDQUFsQjtBQUNBLGFBQU8sR0FBUCxDQUxjO0tBVEg7Ozs7Ozs7OztBQXVCYix5QkFBVSxPQUFPLFdBQVcsV0FBVztBQUNyQyxVQUFJLGNBQWMsU0FBUyxTQUFULENBQWQ7VUFDRixVQUFVLEtBQUssUUFBTCxDQUFjLEtBQWQsQ0FBVjtVQUNBLElBRkY7VUFHRSxPQUhGO1VBSUUsRUFKRixDQURxQzs7QUFPckMsVUFBSSxDQUFDLFdBQUQsRUFBYyxPQUFPLFFBQVEsSUFBUixDQUFhLHdCQUFiLENBQVAsQ0FBbEI7O0FBRUEsVUFBSSxPQUFPLFlBQVksR0FBWixLQUFvQixXQUEzQixFQUF3Qzs7QUFDeEMsZUFBTyxXQUFQO0FBRHdDLE9BQTVDLE1BRU87O0FBQ0gsY0FBSSxXQUFXLEdBQVgsRUFBSixFQUFzQixPQUFPLEVBQUUsTUFBRixDQUFTLEVBQVQsRUFBYSxZQUFZLEdBQVosRUFBaUIsWUFBWSxHQUFaLENBQXJDLENBQXRCLEtBRUssT0FBTyxFQUFFLE1BQUYsQ0FBUyxFQUFULEVBQWEsWUFBWSxHQUFaLEVBQWlCLFlBQVksR0FBWixDQUFyQyxDQUZMO1NBSEo7QUFPQSxnQkFBVSxLQUFLLE9BQUwsQ0FBVixDQWhCcUM7O0FBa0JyQyxXQUFLLFVBQVUsT0FBVixDQUFMLENBbEJxQztBQW1CckMsVUFBSSxNQUFNLE9BQU8sRUFBUCxLQUFjLFVBQWQsRUFBMEI7O0FBQ2xDLFdBQUcsS0FBSCxHQURrQztBQUVsQyxZQUFJLFVBQVUsT0FBVixJQUFxQixPQUFPLFVBQVUsT0FBVixLQUFzQixVQUE3QixFQUF5Qzs7QUFDOUQsb0JBQVUsT0FBVixDQUFrQixLQUFsQixHQUQ4RDtTQUFsRTtPQUZGLE1BS087QUFDTCxZQUFJLFVBQVUsU0FBVixJQUF1QixPQUFPLFVBQVUsU0FBVixLQUF3QixVQUEvQixFQUEyQzs7QUFDbEUsb0JBQVUsU0FBVixDQUFvQixLQUFwQixHQURrRTtTQUF0RTtPQU5GO0tBMUNXOzs7Ozs7OztBQTJEYiw2QkFBYyxVQUFVO0FBQ3RCLGFBQU8sU0FBUyxJQUFULENBQWMsOEtBQWQsRUFBOEwsTUFBOUwsQ0FBcU0sWUFBVztBQUNyTixZQUFJLENBQUMsRUFBRSxJQUFGLEVBQVEsRUFBUixDQUFXLFVBQVgsQ0FBRCxJQUEyQixFQUFFLElBQUYsRUFBUSxJQUFSLENBQWEsVUFBYixJQUEyQixDQUEzQixFQUE4QjtBQUFFLGlCQUFPLEtBQVAsQ0FBRjtTQUE3RDtBQURxTixlQUU5TSxJQUFQLENBRnFOO09BQVgsQ0FBNU0sQ0FEc0I7S0EzRFg7Ozs7Ozs7OztBQXdFYix3QkFBUyxlQUFlLE1BQU07QUFDNUIsZUFBUyxhQUFULElBQTBCLElBQTFCLENBRDRCO0tBeEVqQjtHQUFYOzs7Ozs7QUFmUyxXQWdHSixXQUFULENBQXFCLEdBQXJCLEVBQTBCO0FBQ3hCLFFBQUksSUFBSSxFQUFKLENBRG9CO0FBRXhCLFNBQUssSUFBSSxFQUFKLElBQVUsR0FBZjtBQUFvQixRQUFFLElBQUksRUFBSixDQUFGLElBQWEsSUFBSSxFQUFKLENBQWI7S0FBcEIsT0FDTyxDQUFQLENBSHdCO0dBQTFCOztBQU1BLGFBQVcsUUFBWCxHQUFzQixRQUF0QixDQXRHYTtDQUFaLENBd0dDLE1BeEdELENBQUQ7Q0NWQTs7QUFFQSxDQUFDLFVBQVMsQ0FBVCxFQUFZOzs7QUFHYixNQUFNLGlCQUFpQjtBQUNyQixlQUFZLGFBQVo7QUFDQSxlQUFZLDBDQUFaO0FBQ0EsY0FBVyx5Q0FBWDtBQUNBLFlBQVMseURBQ1AsbURBRE8sR0FFUCxtREFGTyxHQUdQLDhDQUhPLEdBSVAsMkNBSk8sR0FLUCx5Q0FMTztHQUpMLENBSE87O0FBZWIsTUFBSSxhQUFhO0FBQ2YsYUFBUyxFQUFUOztBQUVBLGFBQVMsRUFBVDs7Ozs7OztBQU9BLHVCQUFRO0FBQ04sVUFBSSxPQUFPLElBQVAsQ0FERTtBQUVOLFVBQUksa0JBQWtCLEVBQUUsZ0JBQUYsRUFBb0IsR0FBcEIsQ0FBd0IsYUFBeEIsQ0FBbEIsQ0FGRTtBQUdOLFVBQUksWUFBSixDQUhNOztBQUtOLHFCQUFlLG1CQUFtQixlQUFuQixDQUFmLENBTE07O0FBT04sV0FBSyxJQUFJLEdBQUosSUFBVyxZQUFoQixFQUE4QjtBQUM1QixhQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCO0FBQ2hCLGdCQUFNLEdBQU47QUFDQSxrREFBc0MsYUFBYSxHQUFiLE9BQXRDO1NBRkYsRUFENEI7T0FBOUI7O0FBT0EsV0FBSyxPQUFMLEdBQWUsS0FBSyxlQUFMLEVBQWYsQ0FkTTs7QUFnQk4sV0FBSyxRQUFMLEdBaEJNO0tBVk87Ozs7Ozs7OztBQW1DZix1QkFBUSxNQUFNO0FBQ1osVUFBSSxRQUFRLEtBQUssR0FBTCxDQUFTLElBQVQsQ0FBUixDQURROztBQUdaLFVBQUksS0FBSixFQUFXO0FBQ1QsZUFBTyxPQUFPLFVBQVAsQ0FBa0IsS0FBbEIsRUFBeUIsT0FBekIsQ0FERTtPQUFYOztBQUlBLGFBQU8sS0FBUCxDQVBZO0tBbkNDOzs7Ozs7Ozs7QUFtRGYsbUJBQUksTUFBTTtBQUNSLFdBQUssSUFBSSxDQUFKLElBQVMsS0FBSyxPQUFMLEVBQWM7QUFDMUIsWUFBSSxRQUFRLEtBQUssT0FBTCxDQUFhLENBQWIsQ0FBUixDQURzQjtBQUUxQixZQUFJLFNBQVMsTUFBTSxJQUFOLEVBQVksT0FBTyxNQUFNLEtBQU4sQ0FBaEM7T0FGRjs7QUFLQSxhQUFPLElBQVAsQ0FOUTtLQW5ESzs7Ozs7Ozs7O0FBa0VmLGlDQUFrQjtBQUNoQixVQUFJLE9BQUosQ0FEZ0I7O0FBR2hCLFdBQUssSUFBSSxDQUFKLElBQVMsS0FBSyxPQUFMLEVBQWM7QUFDMUIsWUFBSSxRQUFRLEtBQUssT0FBTCxDQUFhLENBQWIsQ0FBUixDQURzQjs7QUFHMUIsWUFBSSxPQUFPLFVBQVAsQ0FBa0IsTUFBTSxLQUFOLENBQWxCLENBQStCLE9BQS9CLEVBQXdDO0FBQzFDLG9CQUFVLEtBQVYsQ0FEMEM7U0FBNUM7T0FIRjs7QUFRQSxVQUFJLE9BQU8sT0FBUCxLQUFtQixRQUFuQixFQUE2QjtBQUMvQixlQUFPLFFBQVEsSUFBUixDQUR3QjtPQUFqQyxNQUVPO0FBQ0wsZUFBTyxPQUFQLENBREs7T0FGUDtLQTdFYTs7Ozs7Ozs7QUF5RmYsMEJBQVc7OztBQUNULFFBQUUsTUFBRixFQUFVLEVBQVYsQ0FBYSxzQkFBYixFQUFxQyxZQUFNO0FBQ3pDLFlBQUksVUFBVSxNQUFLLGVBQUwsRUFBVixDQURxQzs7QUFHekMsWUFBSSxZQUFZLE1BQUssT0FBTCxFQUFjOztBQUU1QixZQUFFLE1BQUYsRUFBVSxPQUFWLENBQWtCLHVCQUFsQixFQUEyQyxDQUFDLE9BQUQsRUFBVSxNQUFLLE9BQUwsQ0FBckQ7OztBQUY0QixlQUs1QixDQUFLLE9BQUwsR0FBZSxPQUFmLENBTDRCO1NBQTlCO09BSG1DLENBQXJDLENBRFM7S0F6Rkk7R0FBYixDQWZTOztBQXVIYixhQUFXLFVBQVgsR0FBd0IsVUFBeEI7Ozs7QUF2SGEsUUEySGIsQ0FBTyxVQUFQLEtBQXNCLE9BQU8sVUFBUCxHQUFvQixZQUFXO0FBQ25EOzs7QUFEbUQ7QUFJbkQsUUFBSSxhQUFjLE9BQU8sVUFBUCxJQUFxQixPQUFPLEtBQVA7OztBQUpZLFFBTy9DLENBQUMsVUFBRCxFQUFhO0FBQ2YsVUFBSSxRQUFVLFNBQVMsYUFBVCxDQUF1QixPQUF2QixDQUFWO1VBQ0osU0FBYyxTQUFTLG9CQUFULENBQThCLFFBQTlCLEVBQXdDLENBQXhDLENBQWQ7VUFDQSxPQUFjLElBQWQsQ0FIZTs7QUFLZixZQUFNLElBQU4sR0FBYyxVQUFkLENBTGU7QUFNZixZQUFNLEVBQU4sR0FBYyxtQkFBZCxDQU5lOztBQVFmLGFBQU8sVUFBUCxDQUFrQixZQUFsQixDQUErQixLQUEvQixFQUFzQyxNQUF0Qzs7O0FBUmUsVUFXZixHQUFPLGtCQUFDLElBQXNCLE1BQXRCLElBQWlDLE9BQU8sZ0JBQVAsQ0FBd0IsS0FBeEIsRUFBK0IsSUFBL0IsQ0FBbEMsSUFBMEUsTUFBTSxZQUFOLENBWGxFOztBQWFmLG1CQUFhO0FBQ1gsK0JBQVksT0FBTztBQUNqQixjQUFJLG1CQUFpQixnREFBakI7OztBQURhLGNBSWIsTUFBTSxVQUFOLEVBQWtCO0FBQ3BCLGtCQUFNLFVBQU4sQ0FBaUIsT0FBakIsR0FBMkIsSUFBM0IsQ0FEb0I7V0FBdEIsTUFFTztBQUNMLGtCQUFNLFdBQU4sR0FBb0IsSUFBcEIsQ0FESztXQUZQOzs7QUFKaUIsaUJBV1YsS0FBSyxLQUFMLEtBQWUsS0FBZixDQVhVO1NBRFI7T0FBYixDQWJlO0tBQWpCOztBQThCQSxXQUFPLFVBQVMsS0FBVCxFQUFnQjtBQUNyQixhQUFPO0FBQ0wsaUJBQVMsV0FBVyxXQUFYLENBQXVCLFNBQVMsS0FBVCxDQUFoQztBQUNBLGVBQU8sU0FBUyxLQUFUO09BRlQsQ0FEcUI7S0FBaEIsQ0FyQzRDO0dBQVgsRUFBcEIsQ0FBdEI7OztBQTNIYSxXQXlLSixrQkFBVCxDQUE0QixHQUE1QixFQUFpQztBQUMvQixRQUFJLGNBQWMsRUFBZCxDQUQyQjs7QUFHL0IsUUFBSSxPQUFPLEdBQVAsS0FBZSxRQUFmLEVBQXlCO0FBQzNCLGFBQU8sV0FBUCxDQUQyQjtLQUE3Qjs7QUFJQSxVQUFNLElBQUksSUFBSixHQUFXLEtBQVgsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBQyxDQUFELENBQTFCOztBQVArQixRQVMzQixDQUFDLEdBQUQsRUFBTTtBQUNSLGFBQU8sV0FBUCxDQURRO0tBQVY7O0FBSUEsa0JBQWMsSUFBSSxLQUFKLENBQVUsR0FBVixFQUFlLE1BQWYsQ0FBc0IsVUFBUyxHQUFULEVBQWMsS0FBZCxFQUFxQjtBQUN2RCxVQUFJLFFBQVEsTUFBTSxPQUFOLENBQWMsS0FBZCxFQUFxQixHQUFyQixFQUEwQixLQUExQixDQUFnQyxHQUFoQyxDQUFSLENBRG1EO0FBRXZELFVBQUksTUFBTSxNQUFNLENBQU4sQ0FBTixDQUZtRDtBQUd2RCxVQUFJLE1BQU0sTUFBTSxDQUFOLENBQU4sQ0FIbUQ7QUFJdkQsWUFBTSxtQkFBbUIsR0FBbkIsQ0FBTjs7OztBQUp1RCxTQVF2RCxHQUFNLFFBQVEsU0FBUixHQUFvQixJQUFwQixHQUEyQixtQkFBbUIsR0FBbkIsQ0FBM0IsQ0FSaUQ7O0FBVXZELFVBQUksQ0FBQyxJQUFJLGNBQUosQ0FBbUIsR0FBbkIsQ0FBRCxFQUEwQjtBQUM1QixZQUFJLEdBQUosSUFBVyxHQUFYLENBRDRCO09BQTlCLE1BRU8sSUFBSSxNQUFNLE9BQU4sQ0FBYyxJQUFJLEdBQUosQ0FBZCxDQUFKLEVBQTZCO0FBQ2xDLFlBQUksR0FBSixFQUFTLElBQVQsQ0FBYyxHQUFkLEVBRGtDO09BQTdCLE1BRUE7QUFDTCxZQUFJLEdBQUosSUFBVyxDQUFDLElBQUksR0FBSixDQUFELEVBQVcsR0FBWCxDQUFYLENBREs7T0FGQTtBQUtQLGFBQU8sR0FBUCxDQWpCdUQ7S0FBckIsRUFrQmpDLEVBbEJXLENBQWQsQ0FiK0I7O0FBaUMvQixXQUFPLFdBQVAsQ0FqQytCO0dBQWpDOztBQW9DQSxhQUFXLFVBQVgsR0FBd0IsVUFBeEIsQ0E3TWE7Q0FBWixDQStNQyxNQS9NRCxDQUFEO0NDRkE7O0FBRUEsQ0FBQyxVQUFTLENBQVQsRUFBWTs7Ozs7OztBQU9iLE1BQU0sY0FBZ0IsQ0FBQyxXQUFELEVBQWMsV0FBZCxDQUFoQixDQVBPO0FBUWIsTUFBTSxnQkFBZ0IsQ0FBQyxrQkFBRCxFQUFxQixrQkFBckIsQ0FBaEIsQ0FSTzs7QUFVYixNQUFNLFNBQVM7QUFDYixlQUFXLFVBQVMsT0FBVCxFQUFrQixTQUFsQixFQUE2QixFQUE3QixFQUFpQztBQUMxQyxjQUFRLElBQVIsRUFBYyxPQUFkLEVBQXVCLFNBQXZCLEVBQWtDLEVBQWxDLEVBRDBDO0tBQWpDOztBQUlYLGdCQUFZLFVBQVMsT0FBVCxFQUFrQixTQUFsQixFQUE2QixFQUE3QixFQUFpQztBQUMzQyxjQUFRLEtBQVIsRUFBZSxPQUFmLEVBQXdCLFNBQXhCLEVBQW1DLEVBQW5DLEVBRDJDO0tBQWpDO0dBTFIsQ0FWTzs7QUFvQmIsV0FBUyxJQUFULENBQWMsUUFBZCxFQUF3QixJQUF4QixFQUE4QixFQUE5QixFQUFpQztBQUMvQixRQUFJLElBQUo7UUFBVSxJQUFWO1FBQWdCLFFBQVEsSUFBUjs7O0FBRGUsYUFJdEIsSUFBVCxDQUFjLEVBQWQsRUFBaUI7QUFDZixVQUFHLENBQUMsS0FBRCxFQUFRLFFBQVEsT0FBTyxXQUFQLENBQW1CLEdBQW5CLEVBQVIsQ0FBWDs7QUFEZSxVQUdmLEdBQU8sS0FBSyxLQUFMLENBSFE7QUFJZixTQUFHLEtBQUgsQ0FBUyxJQUFULEVBSmU7O0FBTWYsVUFBRyxPQUFPLFFBQVAsRUFBZ0I7QUFBRSxlQUFPLE9BQU8scUJBQVAsQ0FBNkIsSUFBN0IsRUFBbUMsSUFBbkMsQ0FBUCxDQUFGO09BQW5CLE1BQ0k7QUFDRixlQUFPLG9CQUFQLENBQTRCLElBQTVCLEVBREU7QUFFRixhQUFLLE9BQUwsQ0FBYSxxQkFBYixFQUFvQyxDQUFDLElBQUQsQ0FBcEMsRUFBNEMsY0FBNUMsQ0FBMkQscUJBQTNELEVBQWtGLENBQUMsSUFBRCxDQUFsRixFQUZFO09BREo7S0FORjtBQVlBLFdBQU8sT0FBTyxxQkFBUCxDQUE2QixJQUE3QixDQUFQLENBaEIrQjtHQUFqQzs7Ozs7Ozs7Ozs7QUFwQmEsV0FnREosT0FBVCxDQUFpQixJQUFqQixFQUF1QixPQUF2QixFQUFnQyxTQUFoQyxFQUEyQyxFQUEzQyxFQUErQztBQUM3QyxjQUFVLEVBQUUsT0FBRixFQUFXLEVBQVgsQ0FBYyxDQUFkLENBQVYsQ0FENkM7O0FBRzdDLFFBQUksQ0FBQyxRQUFRLE1BQVIsRUFBZ0IsT0FBckI7O0FBRUEsUUFBSSxZQUFZLE9BQU8sWUFBWSxDQUFaLENBQVAsR0FBd0IsWUFBWSxDQUFaLENBQXhCLENBTDZCO0FBTTdDLFFBQUksY0FBYyxPQUFPLGNBQWMsQ0FBZCxDQUFQLEdBQTBCLGNBQWMsQ0FBZCxDQUExQjs7O0FBTjJCLFNBUzdDLEdBVDZDOztBQVc3QyxZQUNHLFFBREgsQ0FDWSxTQURaLEVBRUcsR0FGSCxDQUVPLFlBRlAsRUFFcUIsTUFGckIsRUFYNkM7O0FBZTdDLDBCQUFzQixZQUFNO0FBQzFCLGNBQVEsUUFBUixDQUFpQixTQUFqQixFQUQwQjtBQUUxQixVQUFJLElBQUosRUFBVSxRQUFRLElBQVIsR0FBVjtLQUZvQixDQUF0Qjs7O0FBZjZDLHlCQXFCN0MsQ0FBc0IsWUFBTTtBQUMxQixjQUFRLENBQVIsRUFBVyxXQUFYLENBRDBCO0FBRTFCLGNBQ0csR0FESCxDQUNPLFlBRFAsRUFDcUIsRUFEckIsRUFFRyxRQUZILENBRVksV0FGWixFQUYwQjtLQUFOLENBQXRCOzs7QUFyQjZDLFdBNkI3QyxDQUFRLEdBQVIsQ0FBWSxXQUFXLGFBQVgsQ0FBeUIsT0FBekIsQ0FBWixFQUErQyxNQUEvQzs7O0FBN0I2QyxhQWdDcEMsTUFBVCxHQUFrQjtBQUNoQixVQUFJLENBQUMsSUFBRCxFQUFPLFFBQVEsSUFBUixHQUFYO0FBQ0EsY0FGZ0I7QUFHaEIsVUFBSSxFQUFKLEVBQVEsR0FBRyxLQUFILENBQVMsT0FBVCxFQUFSO0tBSEY7OztBQWhDNkMsYUF1Q3BDLEtBQVQsR0FBaUI7QUFDZixjQUFRLENBQVIsRUFBVyxLQUFYLENBQWlCLGtCQUFqQixHQUFzQyxDQUF0QyxDQURlO0FBRWYsY0FBUSxXQUFSLENBQXVCLGtCQUFhLG9CQUFlLFNBQW5ELEVBRmU7S0FBakI7R0F2Q0Y7O0FBNkNBLGFBQVcsSUFBWCxHQUFrQixJQUFsQixDQTdGYTtBQThGYixhQUFXLE1BQVgsR0FBb0IsTUFBcEIsQ0E5RmE7Q0FBWixDQWdHQyxNQWhHRCxDQUFEO0NDRkE7O0FBRUEsQ0FBQyxVQUFTLENBQVQsRUFBWTs7QUFFYixNQUFNLE9BQU87QUFDWCx1QkFBUSxNQUFtQjtVQUFiLDZEQUFPLG9CQUFNOztBQUN6QixXQUFLLElBQUwsQ0FBVSxNQUFWLEVBQWtCLFNBQWxCLEVBRHlCOztBQUd6QixVQUFJLFFBQVEsS0FBSyxJQUFMLENBQVUsSUFBVixFQUFnQixJQUFoQixDQUFxQixFQUFDLFFBQVEsVUFBUixFQUF0QixDQUFSO1VBQ0EsdUJBQXFCLGlCQUFyQjtVQUNBLGVBQWtCLHNCQUFsQjtVQUNBLHNCQUFvQix3QkFBcEIsQ0FOcUI7O0FBUXpCLFdBQUssSUFBTCxDQUFVLFNBQVYsRUFBcUIsSUFBckIsQ0FBMEIsVUFBMUIsRUFBc0MsQ0FBdEMsRUFSeUI7O0FBVXpCLFlBQU0sSUFBTixDQUFXLFlBQVc7QUFDcEIsWUFBSSxRQUFRLEVBQUUsSUFBRixDQUFSO1lBQ0EsT0FBTyxNQUFNLFFBQU4sQ0FBZSxJQUFmLENBQVAsQ0FGZ0I7O0FBSXBCLFlBQUksS0FBSyxNQUFMLEVBQWE7QUFDZixnQkFDRyxRQURILENBQ1ksV0FEWixFQUVHLElBRkgsQ0FFUTtBQUNKLDZCQUFpQixJQUFqQjtBQUNBLDZCQUFpQixLQUFqQjtBQUNBLDBCQUFjLE1BQU0sUUFBTixDQUFlLFNBQWYsRUFBMEIsSUFBMUIsRUFBZDtXQUxKLEVBRGU7O0FBU2YsZUFDRyxRQURILGNBQ3VCLFlBRHZCLEVBRUcsSUFGSCxDQUVRO0FBQ0osNEJBQWdCLEVBQWhCO0FBQ0EsMkJBQWUsSUFBZjtBQUNBLG9CQUFRLE1BQVI7V0FMSixFQVRlO1NBQWpCOztBQWtCQSxZQUFJLE1BQU0sTUFBTixDQUFhLGdCQUFiLEVBQStCLE1BQS9CLEVBQXVDO0FBQ3pDLGdCQUFNLFFBQU4sc0JBQWtDLFlBQWxDLEVBRHlDO1NBQTNDO09BdEJTLENBQVgsQ0FWeUI7O0FBcUN6QixhQXJDeUI7S0FEaEI7QUF5Q1gsb0JBQUssTUFBTSxNQUFNO0FBQ2YsVUFBSSxRQUFRLEtBQUssSUFBTCxDQUFVLElBQVYsRUFBZ0IsVUFBaEIsQ0FBMkIsVUFBM0IsQ0FBUjtVQUNBLHVCQUFxQixpQkFBckI7VUFDQSxlQUFrQixzQkFBbEI7VUFDQSxzQkFBb0Isd0JBQXBCLENBSlc7O0FBTWYsV0FDRyxJQURILENBQ1EsR0FEUixFQUVHLFdBRkgsQ0FFa0IscUJBQWdCLHFCQUFnQixrREFGbEQsRUFHRyxVQUhILENBR2MsY0FIZCxFQUc4QixHQUg5QixDQUdrQyxTQUhsQyxFQUc2QyxFQUg3Qzs7Ozs7Ozs7Ozs7Ozs7OztBQU5lLEtBekNOO0dBQVAsQ0FGTzs7QUF1RWIsYUFBVyxJQUFYLEdBQWtCLElBQWxCLENBdkVhO0NBQVosQ0F5RUMsTUF6RUQsQ0FBRDtDQ0ZBOztBQUVBLENBQUMsVUFBUyxDQUFULEVBQVk7O0FBRWIsV0FBUyxLQUFULENBQWUsSUFBZixFQUFxQixPQUFyQixFQUE4QixFQUE5QixFQUFrQztBQUNoQyxRQUFJLFFBQVEsSUFBUjtRQUNBLFdBQVcsUUFBUSxRQUFSOztBQUNYLGdCQUFZLE9BQU8sSUFBUCxDQUFZLEtBQUssSUFBTCxFQUFaLEVBQXlCLENBQXpCLEtBQStCLE9BQS9CO1FBQ1osU0FBUyxDQUFDLENBQUQ7UUFDVCxLQUpKO1FBS0ksS0FMSixDQURnQzs7QUFRaEMsU0FBSyxRQUFMLEdBQWdCLEtBQWhCLENBUmdDOztBQVVoQyxTQUFLLE9BQUwsR0FBZSxZQUFXO0FBQ3hCLGVBQVMsQ0FBQyxDQUFELENBRGU7QUFFeEIsbUJBQWEsS0FBYixFQUZ3QjtBQUd4QixXQUFLLEtBQUwsR0FId0I7S0FBWCxDQVZpQjs7QUFnQmhDLFNBQUssS0FBTCxHQUFhLFlBQVc7QUFDdEIsV0FBSyxRQUFMLEdBQWdCLEtBQWhCOztBQURzQixrQkFHdEIsQ0FBYSxLQUFiLEVBSHNCO0FBSXRCLGVBQVMsVUFBVSxDQUFWLEdBQWMsUUFBZCxHQUF5QixNQUF6QixDQUphO0FBS3RCLFdBQUssSUFBTCxDQUFVLFFBQVYsRUFBb0IsS0FBcEIsRUFMc0I7QUFNdEIsY0FBUSxLQUFLLEdBQUwsRUFBUixDQU5zQjtBQU90QixjQUFRLFdBQVcsWUFBVTtBQUMzQixZQUFHLFFBQVEsUUFBUixFQUFpQjtBQUNsQixnQkFBTSxPQUFOO0FBRGtCLFNBQXBCO0FBR0EsYUFKMkI7T0FBVixFQUtoQixNQUxLLENBQVIsQ0FQc0I7QUFhdEIsV0FBSyxPQUFMLG9CQUE4QixTQUE5QixFQWJzQjtLQUFYLENBaEJtQjs7QUFnQ2hDLFNBQUssS0FBTCxHQUFhLFlBQVc7QUFDdEIsV0FBSyxRQUFMLEdBQWdCLElBQWhCOztBQURzQixrQkFHdEIsQ0FBYSxLQUFiLEVBSHNCO0FBSXRCLFdBQUssSUFBTCxDQUFVLFFBQVYsRUFBb0IsSUFBcEIsRUFKc0I7QUFLdEIsVUFBSSxNQUFNLEtBQUssR0FBTCxFQUFOLENBTGtCO0FBTXRCLGVBQVMsVUFBVSxNQUFNLEtBQU4sQ0FBVixDQU5hO0FBT3RCLFdBQUssT0FBTCxxQkFBK0IsU0FBL0IsRUFQc0I7S0FBWCxDQWhDbUI7R0FBbEM7Ozs7Ozs7QUFGYSxXQWtESixjQUFULENBQXdCLE1BQXhCLEVBQWdDLFFBQWhDLEVBQXlDO0FBQ3ZDLFFBQUksT0FBTyxJQUFQO1FBQ0EsV0FBVyxPQUFPLE1BQVAsQ0FGd0I7O0FBSXZDLFFBQUksYUFBYSxDQUFiLEVBQWdCO0FBQ2xCLGlCQURrQjtLQUFwQjs7QUFJQSxXQUFPLElBQVAsQ0FBWSxZQUFXO0FBQ3JCLFVBQUksS0FBSyxRQUFMLEVBQWU7QUFDakIsNEJBRGlCO09BQW5CLE1BR0ssSUFBSSxPQUFPLEtBQUssWUFBTCxLQUFzQixXQUE3QixJQUE0QyxLQUFLLFlBQUwsR0FBb0IsQ0FBcEIsRUFBdUI7QUFDMUUsNEJBRDBFO09BQXZFLE1BR0E7QUFDSCxVQUFFLElBQUYsRUFBUSxHQUFSLENBQVksTUFBWixFQUFvQixZQUFXO0FBQzdCLDhCQUQ2QjtTQUFYLENBQXBCLENBREc7T0FIQTtLQUpLLENBQVosQ0FSdUM7O0FBc0J2QyxhQUFTLGlCQUFULEdBQTZCO0FBQzNCLGlCQUQyQjtBQUUzQixVQUFJLGFBQWEsQ0FBYixFQUFnQjtBQUNsQixtQkFEa0I7T0FBcEI7S0FGRjtHQXRCRjs7QUE4QkEsYUFBVyxLQUFYLEdBQW1CLEtBQW5CLENBaEZhO0FBaUZiLGFBQVcsY0FBWCxHQUE0QixjQUE1QixDQWpGYTtDQUFaLENBbUZDLE1BbkZELENBQUQ7Ozs7O0FDRUEsQ0FBQyxVQUFTLENBQVQsRUFBWTs7QUFFWCxHQUFFLFNBQUYsR0FBYztBQUNaLFdBQVMsT0FBVDtBQUNBLFdBQVMsa0JBQWtCLFNBQVMsZUFBVDtBQUMzQixrQkFBZ0IsS0FBaEI7QUFDQSxpQkFBZSxFQUFmO0FBQ0EsaUJBQWUsR0FBZjtFQUxGLENBRlc7O0FBVVgsS0FBTSxTQUFOO0tBQ00sU0FETjtLQUVNLFNBRk47S0FHTSxXQUhOO0tBSU0sV0FBVyxLQUFYLENBZEs7O0FBZ0JYLFVBQVMsVUFBVCxHQUFzQjs7QUFFcEIsT0FBSyxtQkFBTCxDQUF5QixXQUF6QixFQUFzQyxXQUF0QyxFQUZvQjtBQUdwQixPQUFLLG1CQUFMLENBQXlCLFVBQXpCLEVBQXFDLFVBQXJDLEVBSG9CO0FBSXBCLGFBQVcsS0FBWCxDQUpvQjtFQUF0Qjs7QUFPQSxVQUFTLFdBQVQsQ0FBcUIsQ0FBckIsRUFBd0I7QUFDdEIsTUFBSSxFQUFFLFNBQUYsQ0FBWSxjQUFaLEVBQTRCO0FBQUUsS0FBRSxjQUFGLEdBQUY7R0FBaEM7QUFDQSxNQUFHLFFBQUgsRUFBYTtBQUNYLE9BQUksSUFBSSxFQUFFLE9BQUYsQ0FBVSxDQUFWLEVBQWEsS0FBYixDQURHO0FBRVgsT0FBSSxJQUFJLEVBQUUsT0FBRixDQUFVLENBQVYsRUFBYSxLQUFiLENBRkc7QUFHWCxPQUFJLEtBQUssWUFBWSxDQUFaLENBSEU7QUFJWCxPQUFJLEtBQUssWUFBWSxDQUFaLENBSkU7QUFLWCxPQUFJLEdBQUosQ0FMVztBQU1YLGlCQUFjLElBQUksSUFBSixHQUFXLE9BQVgsS0FBdUIsU0FBdkIsQ0FOSDtBQU9YLE9BQUcsS0FBSyxHQUFMLENBQVMsRUFBVCxLQUFnQixFQUFFLFNBQUYsQ0FBWSxhQUFaLElBQTZCLGVBQWUsRUFBRSxTQUFGLENBQVksYUFBWixFQUEyQjtBQUN4RixVQUFNLEtBQUssQ0FBTCxHQUFTLE1BQVQsR0FBa0IsT0FBbEIsQ0FEa0Y7SUFBMUY7Ozs7QUFQVyxPQWFSLEdBQUgsRUFBUTtBQUNOLE1BQUUsY0FBRixHQURNO0FBRU4sZUFBVyxJQUFYLENBQWdCLElBQWhCLEVBRk07QUFHTixNQUFFLElBQUYsRUFBUSxPQUFSLENBQWdCLE9BQWhCLEVBQXlCLEdBQXpCLEVBQThCLE9BQTlCLFdBQThDLEdBQTlDLEVBSE07SUFBUjtHQWJGO0VBRkY7O0FBdUJBLFVBQVMsWUFBVCxDQUFzQixDQUF0QixFQUF5QjtBQUN2QixNQUFJLEVBQUUsT0FBRixDQUFVLE1BQVYsSUFBb0IsQ0FBcEIsRUFBdUI7QUFDekIsZUFBWSxFQUFFLE9BQUYsQ0FBVSxDQUFWLEVBQWEsS0FBYixDQURhO0FBRXpCLGVBQVksRUFBRSxPQUFGLENBQVUsQ0FBVixFQUFhLEtBQWIsQ0FGYTtBQUd6QixjQUFXLElBQVgsQ0FIeUI7QUFJekIsZUFBWSxJQUFJLElBQUosR0FBVyxPQUFYLEVBQVosQ0FKeUI7QUFLekIsUUFBSyxnQkFBTCxDQUFzQixXQUF0QixFQUFtQyxXQUFuQyxFQUFnRCxLQUFoRCxFQUx5QjtBQU16QixRQUFLLGdCQUFMLENBQXNCLFVBQXRCLEVBQWtDLFVBQWxDLEVBQThDLEtBQTlDLEVBTnlCO0dBQTNCO0VBREY7O0FBV0EsVUFBUyxJQUFULEdBQWdCO0FBQ2QsT0FBSyxnQkFBTCxJQUF5QixLQUFLLGdCQUFMLENBQXNCLFlBQXRCLEVBQW9DLFlBQXBDLEVBQWtELEtBQWxELENBQXpCLENBRGM7RUFBaEI7O0FBSUEsVUFBUyxRQUFULEdBQW9CO0FBQ2xCLE9BQUssbUJBQUwsQ0FBeUIsWUFBekIsRUFBdUMsWUFBdkMsRUFEa0I7RUFBcEI7O0FBSUEsR0FBRSxLQUFGLENBQVEsT0FBUixDQUFnQixLQUFoQixHQUF3QixFQUFFLE9BQU8sSUFBUCxFQUExQixDQWpFVzs7QUFtRVgsR0FBRSxJQUFGLENBQU8sQ0FBQyxNQUFELEVBQVMsSUFBVCxFQUFlLE1BQWYsRUFBdUIsT0FBdkIsQ0FBUCxFQUF3QyxZQUFZO0FBQ2xELElBQUUsS0FBRixDQUFRLE9BQVIsV0FBd0IsSUFBeEIsSUFBa0MsRUFBRSxPQUFPLFlBQVU7QUFDbkQsTUFBRSxJQUFGLEVBQVEsRUFBUixDQUFXLE9BQVgsRUFBb0IsRUFBRSxJQUFGLENBQXBCLENBRG1EO0lBQVYsRUFBM0MsQ0FEa0Q7RUFBWixDQUF4QyxDQW5FVztDQUFaLENBQUQsQ0F3RUcsTUF4RUg7Ozs7QUE0RUEsQ0FBQyxVQUFTLENBQVQsRUFBVztBQUNWLEdBQUUsRUFBRixDQUFLLFFBQUwsR0FBZ0IsWUFBVTtBQUN4QixPQUFLLElBQUwsQ0FBVSxVQUFTLENBQVQsRUFBVyxFQUFYLEVBQWM7QUFDdEIsS0FBRSxFQUFGLEVBQU0sSUFBTixDQUFXLDJDQUFYLEVBQXVELFlBQVU7OztBQUcvRCxnQkFBWSxLQUFaLEVBSCtEO0lBQVYsQ0FBdkQsQ0FEc0I7R0FBZCxDQUFWLENBRHdCOztBQVN4QixNQUFJLGNBQWMsVUFBUyxLQUFULEVBQWU7QUFDL0IsT0FBSSxVQUFVLE1BQU0sY0FBTjtPQUNWLFFBQVEsUUFBUSxDQUFSLENBQVI7T0FDQSxhQUFhO0FBQ1gsZ0JBQVksV0FBWjtBQUNBLGVBQVcsV0FBWDtBQUNBLGNBQVUsU0FBVjtJQUhGO09BS0EsT0FBTyxXQUFXLE1BQU0sSUFBTixDQUFsQjtPQUNBLGNBUkosQ0FEK0I7O0FBWS9CLE9BQUcsZ0JBQWdCLE1BQWhCLElBQTBCLE9BQU8sT0FBTyxVQUFQLEtBQXNCLFVBQTdCLEVBQXlDO0FBQ3BFLHFCQUFpQixPQUFPLFVBQVAsQ0FBa0IsSUFBbEIsRUFBd0I7QUFDdkMsZ0JBQVcsSUFBWDtBQUNBLG1CQUFjLElBQWQ7QUFDQSxnQkFBVyxNQUFNLE9BQU47QUFDWCxnQkFBVyxNQUFNLE9BQU47QUFDWCxnQkFBVyxNQUFNLE9BQU47QUFDWCxnQkFBVyxNQUFNLE9BQU47S0FOSSxDQUFqQixDQURvRTtJQUF0RSxNQVNPO0FBQ0wscUJBQWlCLFNBQVMsV0FBVCxDQUFxQixZQUFyQixDQUFqQixDQURLO0FBRUwsbUJBQWUsY0FBZixDQUE4QixJQUE5QixFQUFvQyxJQUFwQyxFQUEwQyxJQUExQyxFQUFnRCxNQUFoRCxFQUF3RCxDQUF4RCxFQUEyRCxNQUFNLE9BQU4sRUFBZSxNQUFNLE9BQU4sRUFBZSxNQUFNLE9BQU4sRUFBZSxNQUFNLE9BQU4sRUFBZSxLQUF2SCxFQUE4SCxLQUE5SCxFQUFxSSxLQUFySSxFQUE0SSxLQUE1SSxFQUFtSixVQUFuSixFQUE4SixJQUE5SixFQUZLO0lBVFA7QUFhQSxTQUFNLE1BQU4sQ0FBYSxhQUFiLENBQTJCLGNBQTNCLEVBekIrQjtHQUFmLENBVE07RUFBVixDQUROO0NBQVgsQ0FzQ0MsTUF0Q0QsQ0FBRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0NoRkE7O0FBRUEsQ0FBQyxVQUFTLENBQVQsRUFBWTs7QUFFYixNQUFNLG1CQUFvQixZQUFZO0FBQ3BDLFFBQUksV0FBVyxDQUFDLFFBQUQsRUFBVyxLQUFYLEVBQWtCLEdBQWxCLEVBQXVCLElBQXZCLEVBQTZCLEVBQTdCLENBQVgsQ0FEZ0M7QUFFcEMsU0FBSyxJQUFJLElBQUUsQ0FBRixFQUFLLElBQUksU0FBUyxNQUFULEVBQWlCLEdBQW5DLEVBQXdDO0FBQ3RDLFVBQUksUUFBRyxDQUFTLENBQVQsc0JBQUgsSUFBb0MsTUFBcEMsRUFBNEM7QUFDOUMsZUFBTyxPQUFVLFNBQVMsQ0FBVCxzQkFBVixDQUFQLENBRDhDO09BQWhEO0tBREY7QUFLQSxXQUFPLEtBQVAsQ0FQb0M7R0FBWixFQUFwQixDQUZPOztBQVliLE1BQU0sV0FBVyxVQUFDLEVBQUQsRUFBSyxJQUFMLEVBQWM7QUFDN0IsT0FBRyxJQUFILENBQVEsSUFBUixFQUFjLEtBQWQsQ0FBb0IsR0FBcEIsRUFBeUIsT0FBekIsQ0FBaUMsY0FBTTtBQUNyQyxjQUFNLEVBQU4sRUFBYSxTQUFTLE9BQVQsR0FBbUIsU0FBbkIsR0FBK0IsZ0JBQS9CLENBQWIsQ0FBaUUsb0JBQWpFLEVBQW9GLENBQUMsRUFBRCxDQUFwRixFQURxQztLQUFOLENBQWpDLENBRDZCO0dBQWQ7O0FBWkosR0FrQmIsQ0FBRSxRQUFGLEVBQVksRUFBWixDQUFlLGtCQUFmLEVBQW1DLGFBQW5DLEVBQWtELFlBQVc7QUFDM0QsYUFBUyxFQUFFLElBQUYsQ0FBVCxFQUFrQixNQUFsQixFQUQyRDtHQUFYLENBQWxEOzs7O0FBbEJhLEdBd0JiLENBQUUsUUFBRixFQUFZLEVBQVosQ0FBZSxrQkFBZixFQUFtQyxjQUFuQyxFQUFtRCxZQUFXO0FBQzVELFFBQUksS0FBSyxFQUFFLElBQUYsRUFBUSxJQUFSLENBQWEsT0FBYixDQUFMLENBRHdEO0FBRTVELFFBQUksRUFBSixFQUFRO0FBQ04sZUFBUyxFQUFFLElBQUYsQ0FBVCxFQUFrQixPQUFsQixFQURNO0tBQVIsTUFHSztBQUNILFFBQUUsSUFBRixFQUFRLE9BQVIsQ0FBZ0Isa0JBQWhCLEVBREc7S0FITDtHQUZpRCxDQUFuRDs7O0FBeEJhLEdBbUNiLENBQUUsUUFBRixFQUFZLEVBQVosQ0FBZSxrQkFBZixFQUFtQyxlQUFuQyxFQUFvRCxZQUFXO0FBQzdELGFBQVMsRUFBRSxJQUFGLENBQVQsRUFBa0IsUUFBbEIsRUFENkQ7R0FBWCxDQUFwRDs7O0FBbkNhLEdBd0NiLENBQUUsUUFBRixFQUFZLEVBQVosQ0FBZSxrQkFBZixFQUFtQyxpQkFBbkMsRUFBc0QsVUFBUyxDQUFULEVBQVc7QUFDL0QsTUFBRSxlQUFGLEdBRCtEO0FBRS9ELFFBQUksWUFBWSxFQUFFLElBQUYsRUFBUSxJQUFSLENBQWEsVUFBYixDQUFaLENBRjJEOztBQUkvRCxRQUFHLGNBQWMsRUFBZCxFQUFpQjtBQUNsQixpQkFBVyxNQUFYLENBQWtCLFVBQWxCLENBQTZCLEVBQUUsSUFBRixDQUE3QixFQUFzQyxTQUF0QyxFQUFpRCxZQUFXO0FBQzFELFVBQUUsSUFBRixFQUFRLE9BQVIsQ0FBZ0IsV0FBaEIsRUFEMEQ7T0FBWCxDQUFqRCxDQURrQjtLQUFwQixNQUlLO0FBQ0gsUUFBRSxJQUFGLEVBQVEsT0FBUixHQUFrQixPQUFsQixDQUEwQixXQUExQixFQURHO0tBSkw7R0FKb0QsQ0FBdEQsQ0F4Q2E7O0FBcURiLElBQUUsUUFBRixFQUFZLEVBQVosQ0FBZSxrQ0FBZixFQUFtRCxxQkFBbkQsRUFBMEUsWUFBVztBQUNuRixRQUFJLEtBQUssRUFBRSxJQUFGLEVBQVEsSUFBUixDQUFhLGNBQWIsQ0FBTCxDQUQrRTtBQUVuRixZQUFNLEVBQU4sRUFBWSxjQUFaLENBQTJCLG1CQUEzQixFQUFnRCxDQUFDLEVBQUUsSUFBRixDQUFELENBQWhELEVBRm1GO0dBQVgsQ0FBMUU7Ozs7Ozs7QUFyRGEsR0ErRGIsQ0FBRSxNQUFGLEVBQVUsSUFBVixDQUFlLFlBQU07QUFDbkIscUJBRG1CO0dBQU4sQ0FBZixDQS9EYTs7QUFtRWIsV0FBUyxjQUFULEdBQTBCO0FBQ3hCLHFCQUR3QjtBQUV4QixxQkFGd0I7QUFHeEIscUJBSHdCO0FBSXhCLHNCQUp3QjtHQUExQjs7O0FBbkVhLFdBMkVKLGVBQVQsQ0FBeUIsVUFBekIsRUFBcUM7QUFDbkMsUUFBSSxZQUFZLEVBQUUsaUJBQUYsQ0FBWjtRQUNBLFlBQVksQ0FBQyxVQUFELEVBQWEsU0FBYixFQUF3QixRQUF4QixDQUFaLENBRitCOztBQUluQyxRQUFHLFVBQUgsRUFBYztBQUNaLFVBQUcsT0FBTyxVQUFQLEtBQXNCLFFBQXRCLEVBQStCO0FBQ2hDLGtCQUFVLElBQVYsQ0FBZSxVQUFmLEVBRGdDO09BQWxDLE1BRU0sSUFBRyxPQUFPLFVBQVAsS0FBc0IsUUFBdEIsSUFBa0MsT0FBTyxXQUFXLENBQVgsQ0FBUCxLQUF5QixRQUF6QixFQUFrQztBQUMzRSxrQkFBVSxNQUFWLENBQWlCLFVBQWpCLEVBRDJFO09BQXZFLE1BRUQ7QUFDSCxnQkFBUSxLQUFSLENBQWMsOEJBQWQsRUFERztPQUZDO0tBSFI7QUFTQSxRQUFHLFVBQVUsTUFBVixFQUFpQjtBQUNsQixVQUFJLFlBQVksVUFBVSxHQUFWLENBQWMsVUFBQyxJQUFELEVBQVU7QUFDdEMsK0JBQXFCLElBQXJCLENBRHNDO09BQVYsQ0FBZCxDQUViLElBRmEsQ0FFUixHQUZRLENBQVosQ0FEYzs7QUFLbEIsUUFBRSxNQUFGLEVBQVUsR0FBVixDQUFjLFNBQWQsRUFBeUIsRUFBekIsQ0FBNEIsU0FBNUIsRUFBdUMsVUFBUyxDQUFULEVBQVksUUFBWixFQUFxQjtBQUMxRCxZQUFJLFNBQVMsRUFBRSxTQUFGLENBQVksS0FBWixDQUFrQixHQUFsQixFQUF1QixDQUF2QixDQUFULENBRHNEO0FBRTFELFlBQUksVUFBVSxhQUFXLFlBQVgsRUFBc0IsR0FBdEIsc0JBQTZDLGVBQTdDLENBQVYsQ0FGc0Q7O0FBSTFELGdCQUFRLElBQVIsQ0FBYSxZQUFVO0FBQ3JCLGNBQUksUUFBUSxFQUFFLElBQUYsQ0FBUixDQURpQjs7QUFHckIsZ0JBQU0sY0FBTixDQUFxQixrQkFBckIsRUFBeUMsQ0FBQyxLQUFELENBQXpDLEVBSHFCO1NBQVYsQ0FBYixDQUowRDtPQUFyQixDQUF2QyxDQUxrQjtLQUFwQjtHQWJGOztBQStCQSxXQUFTLGNBQVQsQ0FBd0IsUUFBeEIsRUFBaUM7QUFDL0IsUUFBSSxjQUFKO1FBQ0ksU0FBUyxFQUFFLGVBQUYsQ0FBVCxDQUYyQjtBQUcvQixRQUFHLE9BQU8sTUFBUCxFQUFjO0FBQ2YsUUFBRSxNQUFGLEVBQVUsR0FBVixDQUFjLG1CQUFkLEVBQ0MsRUFERCxDQUNJLG1CQURKLEVBQ3lCLFVBQVMsQ0FBVCxFQUFZO0FBQ25DLFlBQUksS0FBSixFQUFXO0FBQUUsdUJBQWEsS0FBYixFQUFGO1NBQVg7O0FBRUEsZ0JBQVEsV0FBVyxZQUFVOztBQUUzQixjQUFHLENBQUMsZ0JBQUQsRUFBa0I7O0FBQ25CLG1CQUFPLElBQVAsQ0FBWSxZQUFVO0FBQ3BCLGdCQUFFLElBQUYsRUFBUSxjQUFSLENBQXVCLHFCQUF2QixFQURvQjthQUFWLENBQVosQ0FEbUI7V0FBckI7O0FBRjJCLGdCQVEzQixDQUFPLElBQVAsQ0FBWSxhQUFaLEVBQTJCLFFBQTNCLEVBUjJCO1NBQVYsRUFTaEIsWUFBWSxFQUFaLENBVEg7QUFIbUMsT0FBWixDQUR6QixDQURlO0tBQWpCO0dBSEY7O0FBc0JBLFdBQVMsY0FBVCxDQUF3QixRQUF4QixFQUFpQztBQUMvQixRQUFJLGNBQUo7UUFDSSxTQUFTLEVBQUUsZUFBRixDQUFULENBRjJCO0FBRy9CLFFBQUcsT0FBTyxNQUFQLEVBQWM7QUFDZixRQUFFLE1BQUYsRUFBVSxHQUFWLENBQWMsbUJBQWQsRUFDQyxFQURELENBQ0ksbUJBREosRUFDeUIsVUFBUyxDQUFULEVBQVc7QUFDbEMsWUFBRyxLQUFILEVBQVM7QUFBRSx1QkFBYSxLQUFiLEVBQUY7U0FBVDs7QUFFQSxnQkFBUSxXQUFXLFlBQVU7O0FBRTNCLGNBQUcsQ0FBQyxnQkFBRCxFQUFrQjs7QUFDbkIsbUJBQU8sSUFBUCxDQUFZLFlBQVU7QUFDcEIsZ0JBQUUsSUFBRixFQUFRLGNBQVIsQ0FBdUIscUJBQXZCLEVBRG9CO2FBQVYsQ0FBWixDQURtQjtXQUFyQjs7QUFGMkIsZ0JBUTNCLENBQU8sSUFBUCxDQUFZLGFBQVosRUFBMkIsUUFBM0IsRUFSMkI7U0FBVixFQVNoQixZQUFZLEVBQVosQ0FUSDtBQUhrQyxPQUFYLENBRHpCLENBRGU7S0FBakI7R0FIRjs7QUFzQkEsV0FBUyxjQUFULEdBQTBCO0FBQ3hCLFFBQUcsQ0FBQyxnQkFBRCxFQUFrQjtBQUFFLGFBQU8sS0FBUCxDQUFGO0tBQXJCO0FBQ0EsUUFBSSxRQUFRLFNBQVMsZ0JBQVQsQ0FBMEIsNkNBQTFCLENBQVI7OztBQUZvQixRQUtwQiw0QkFBNEIsVUFBUyxtQkFBVCxFQUE4QjtBQUM1RCxVQUFJLFVBQVUsRUFBRSxvQkFBb0IsQ0FBcEIsRUFBdUIsTUFBdkIsQ0FBWjs7QUFEd0QsY0FHcEQsUUFBUSxJQUFSLENBQWEsYUFBYixDQUFSOztBQUVFLGFBQUssUUFBTDtBQUNBLGtCQUFRLGNBQVIsQ0FBdUIscUJBQXZCLEVBQThDLENBQUMsT0FBRCxDQUE5QyxFQURBO0FBRUEsZ0JBRkE7O0FBRkYsYUFNTyxRQUFMO0FBQ0Esa0JBQVEsY0FBUixDQUF1QixxQkFBdkIsRUFBOEMsQ0FBQyxPQUFELEVBQVUsT0FBTyxXQUFQLENBQXhELEVBREE7QUFFQSxnQkFGQTs7Ozs7Ozs7Ozs7O0FBTkY7QUFxQkUsaUJBQU8sS0FBUCxDQURBOztBQXBCRixPQUg0RDtLQUE5QixDQUxSOztBQWtDeEIsUUFBRyxNQUFNLE1BQU4sRUFBYTs7QUFFZCxXQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sS0FBSyxNQUFNLE1BQU4sR0FBYSxDQUFiLEVBQWdCLEdBQXJDLEVBQTBDO0FBQ3hDLFlBQUksa0JBQWtCLElBQUksZ0JBQUosQ0FBcUIseUJBQXJCLENBQWxCLENBRG9DO0FBRXhDLHdCQUFnQixPQUFoQixDQUF3QixNQUFNLENBQU4sQ0FBeEIsRUFBa0MsRUFBRSxZQUFZLElBQVosRUFBa0IsV0FBVyxLQUFYLEVBQWtCLGVBQWUsS0FBZixFQUFzQixTQUFRLEtBQVIsRUFBZSxpQkFBZ0IsQ0FBQyxhQUFELENBQWhCLEVBQTdHLEVBRndDO09BQTFDO0tBRkY7R0FsQ0Y7Ozs7OztBQXRKYSxZQXFNYixDQUFXLFFBQVgsR0FBc0IsY0FBdEI7OztDQXJNQyxDQXlNQyxNQXpNRCxDQUFEO0FBQWE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NDRmI7Ozs7OztBQUVBLENBQUMsVUFBUyxDQUFULEVBQVk7Ozs7Ozs7Ozs7TUFVUDs7Ozs7Ozs7O0FBUUosYUFSSSxRQVFKLENBQVksT0FBWixFQUFxQixPQUFyQixFQUE4Qjs0QkFSMUIsVUFRMEI7O0FBQzVCLFdBQUssUUFBTCxHQUFnQixPQUFoQixDQUQ0QjtBQUU1QixXQUFLLE9BQUwsR0FBZSxFQUFFLE1BQUYsQ0FBUyxFQUFULEVBQWEsU0FBUyxRQUFULEVBQW1CLEtBQUssUUFBTCxDQUFjLElBQWQsRUFBaEMsRUFBc0QsT0FBdEQsQ0FBZixDQUY0QjtBQUc1QixXQUFLLEtBQUwsR0FINEI7O0FBSzVCLGlCQUFXLGNBQVgsQ0FBMEIsSUFBMUIsRUFBZ0MsVUFBaEMsRUFMNEI7QUFNNUIsaUJBQVcsUUFBWCxDQUFvQixRQUFwQixDQUE2QixVQUE3QixFQUF5QztBQUN2QyxpQkFBUyxNQUFUO0FBQ0EsaUJBQVMsTUFBVDtBQUNBLGtCQUFVLE9BQVY7QUFDQSxlQUFPLGFBQVA7QUFDQSxxQkFBYSxjQUFiO09BTEYsRUFONEI7S0FBOUI7Ozs7Ozs7OztpQkFSSTs7OEJBNEJJO0FBQ04sWUFBSSxNQUFNLEtBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsSUFBbkIsQ0FBTixDQURFOztBQUdOLGFBQUssT0FBTCxHQUFlLHFCQUFtQixVQUFuQixLQUErQixtQkFBaUIsVUFBakIsQ0FBL0IsQ0FIVDtBQUlOLGFBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0I7QUFDaEIsMkJBQWlCLEdBQWpCO0FBQ0EsMkJBQWlCLEtBQWpCO0FBQ0EsMkJBQWlCLEdBQWpCO0FBQ0EsMkJBQWlCLElBQWpCO0FBQ0EsMkJBQWlCLEtBQWpCOztTQUxGLEVBSk07O0FBYU4sYUFBSyxPQUFMLENBQWEsYUFBYixHQUE2QixLQUFLLGdCQUFMLEVBQTdCLENBYk07QUFjTixhQUFLLE9BQUwsR0FBZSxDQUFmLENBZE07QUFlTixhQUFLLGFBQUwsR0FBcUIsRUFBckIsQ0FmTTtBQWdCTixhQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CO0FBQ2pCLHlCQUFlLE1BQWY7QUFDQSwyQkFBaUIsR0FBakI7QUFDQSx5QkFBZSxHQUFmO0FBQ0EsNkJBQW1CLEtBQUssT0FBTCxDQUFhLENBQWIsRUFBZ0IsRUFBaEIsSUFBc0IsV0FBVyxXQUFYLENBQXVCLENBQXZCLEVBQTBCLFdBQTFCLENBQXRCO1NBSnJCLEVBaEJNO0FBc0JOLGFBQUssT0FBTCxHQXRCTTs7Ozs7Ozs7Ozs7eUNBOEJXO0FBQ2pCLFlBQUksV0FBVyxLQUFLLFFBQUwsQ0FBYyxDQUFkLEVBQWlCLFNBQWpCLENBQTJCLEtBQTNCLENBQWlDLHVCQUFqQyxDQUFYLENBRGE7QUFFYixtQkFBVyxXQUFXLFNBQVMsQ0FBVCxDQUFYLEdBQXlCLEVBQXpCLENBRkU7QUFHakIsZUFBTyxRQUFQLENBSGlCOzs7Ozs7Ozs7Ozs7a0NBWVAsVUFBVTtBQUNwQixhQUFLLGFBQUwsQ0FBbUIsSUFBbkIsQ0FBd0IsV0FBVyxRQUFYLEdBQXNCLFFBQXRCLENBQXhCOztBQURvQixZQUdqQixDQUFDLFFBQUQsSUFBYyxLQUFLLGFBQUwsQ0FBbUIsT0FBbkIsQ0FBMkIsS0FBM0IsSUFBb0MsQ0FBcEMsRUFBdUM7QUFDdEQsZUFBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixLQUF2QixFQURzRDtTQUF4RCxNQUVNLElBQUcsYUFBYSxLQUFiLElBQXVCLEtBQUssYUFBTCxDQUFtQixPQUFuQixDQUEyQixRQUEzQixJQUF1QyxDQUF2QyxFQUEwQztBQUN4RSxlQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLFFBQTFCLEVBRHdFO1NBQXBFLE1BRUEsSUFBRyxhQUFhLE1BQWIsSUFBd0IsS0FBSyxhQUFMLENBQW1CLE9BQW5CLENBQTJCLE9BQTNCLElBQXNDLENBQXRDLEVBQXlDO0FBQ3hFLGVBQUssUUFBTCxDQUFjLFdBQWQsQ0FBMEIsUUFBMUIsRUFDSyxRQURMLENBQ2MsT0FEZCxFQUR3RTtTQUFwRSxNQUdBLElBQUcsYUFBYSxPQUFiLElBQXlCLEtBQUssYUFBTCxDQUFtQixPQUFuQixDQUEyQixNQUEzQixJQUFxQyxDQUFyQyxFQUF3QztBQUN4RSxlQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLFFBQTFCLEVBQ0ssUUFETCxDQUNjLE1BRGQsRUFEd0U7Ozs7QUFBcEUsYUFNRCxJQUFHLENBQUMsUUFBRCxJQUFjLEtBQUssYUFBTCxDQUFtQixPQUFuQixDQUEyQixLQUEzQixJQUFvQyxDQUFDLENBQUQsSUFBUSxLQUFLLGFBQUwsQ0FBbUIsT0FBbkIsQ0FBMkIsTUFBM0IsSUFBcUMsQ0FBckMsRUFBd0M7QUFDeEcsaUJBQUssUUFBTCxDQUFjLFFBQWQsQ0FBdUIsTUFBdkIsRUFEd0c7V0FBckcsTUFFQyxJQUFHLGFBQWEsS0FBYixJQUF1QixLQUFLLGFBQUwsQ0FBbUIsT0FBbkIsQ0FBMkIsUUFBM0IsSUFBdUMsQ0FBQyxDQUFELElBQVEsS0FBSyxhQUFMLENBQW1CLE9BQW5CLENBQTJCLE1BQTNCLElBQXFDLENBQXJDLEVBQXdDO0FBQ3JILGlCQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLFFBQTFCLEVBQ0ssUUFETCxDQUNjLE1BRGQsRUFEcUg7V0FBakgsTUFHQSxJQUFHLGFBQWEsTUFBYixJQUF3QixLQUFLLGFBQUwsQ0FBbUIsT0FBbkIsQ0FBMkIsT0FBM0IsSUFBc0MsQ0FBQyxDQUFELElBQVEsS0FBSyxhQUFMLENBQW1CLE9BQW5CLENBQTJCLFFBQTNCLElBQXVDLENBQXZDLEVBQTBDO0FBQ3ZILGlCQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLFFBQTFCLEVBRHVIO1dBQW5ILE1BRUEsSUFBRyxhQUFhLE9BQWIsSUFBeUIsS0FBSyxhQUFMLENBQW1CLE9BQW5CLENBQTJCLE1BQTNCLElBQXFDLENBQUMsQ0FBRCxJQUFRLEtBQUssYUFBTCxDQUFtQixPQUFuQixDQUEyQixRQUEzQixJQUF1QyxDQUF2QyxFQUEwQztBQUN2SCxpQkFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixRQUExQixFQUR1SDs7O0FBQW5ILGVBSUY7QUFDRixtQkFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixRQUExQixFQURFO2FBSkU7QUFPTixhQUFLLFlBQUwsR0FBb0IsSUFBcEIsQ0E5Qm9CO0FBK0JwQixhQUFLLE9BQUwsR0EvQm9COzs7Ozs7Ozs7Ozs7cUNBd0NQO0FBQ2IsWUFBRyxLQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLGVBQWxCLE1BQXVDLE9BQXZDLEVBQStDO0FBQUUsaUJBQU8sS0FBUCxDQUFGO1NBQWxEO0FBQ0EsWUFBSSxXQUFXLEtBQUssZ0JBQUwsRUFBWDtZQUNBLFdBQVcsV0FBVyxHQUFYLENBQWUsYUFBZixDQUE2QixLQUFLLFFBQUwsQ0FBeEM7WUFDQSxjQUFjLFdBQVcsR0FBWCxDQUFlLGFBQWYsQ0FBNkIsS0FBSyxPQUFMLENBQTNDO1lBQ0EsUUFBUSxJQUFSO1lBQ0EsWUFBYSxhQUFhLE1BQWIsR0FBc0IsTUFBdEIsR0FBZ0MsUUFBQyxLQUFhLE9BQWIsR0FBd0IsTUFBekIsR0FBa0MsS0FBbEM7WUFDN0MsUUFBUSxTQUFDLEtBQWMsS0FBZCxHQUF1QixRQUF4QixHQUFtQyxPQUFuQztZQUNSLFNBQVMsS0FBQyxLQUFVLFFBQVYsR0FBc0IsS0FBSyxPQUFMLENBQWEsT0FBYixHQUF1QixLQUFLLE9BQUwsQ0FBYSxPQUFiLENBUjlDOztBQVViLFlBQUcsUUFBQyxDQUFTLEtBQVQsSUFBa0IsU0FBUyxVQUFULENBQW9CLEtBQXBCLElBQStCLENBQUMsS0FBSyxPQUFMLElBQWdCLENBQUMsV0FBVyxHQUFYLENBQWUsZ0JBQWYsQ0FBZ0MsS0FBSyxRQUFMLENBQWpDLEVBQWlEO0FBQ3JILGVBQUssUUFBTCxDQUFjLE1BQWQsQ0FBcUIsV0FBVyxHQUFYLENBQWUsVUFBZixDQUEwQixLQUFLLFFBQUwsRUFBZSxLQUFLLE9BQUwsRUFBYyxlQUF2RCxFQUF3RSxLQUFLLE9BQUwsQ0FBYSxPQUFiLEVBQXNCLEtBQUssT0FBTCxDQUFhLE9BQWIsRUFBc0IsSUFBcEgsQ0FBckIsRUFBZ0osR0FBaEosQ0FBb0o7QUFDbEoscUJBQVMsU0FBUyxVQUFULENBQW9CLEtBQXBCLEdBQTZCLEtBQUssT0FBTCxDQUFhLE9BQWIsR0FBdUIsQ0FBdkI7QUFDdEMsc0JBQVUsTUFBVjtXQUZGLEVBRHFIO0FBS3JILGVBQUssWUFBTCxHQUFvQixJQUFwQixDQUxxSDtBQU1ySCxpQkFBTyxLQUFQLENBTnFIO1NBQXZIOztBQVNBLGFBQUssUUFBTCxDQUFjLE1BQWQsQ0FBcUIsV0FBVyxHQUFYLENBQWUsVUFBZixDQUEwQixLQUFLLFFBQUwsRUFBZSxLQUFLLE9BQUwsRUFBYyxRQUF2RCxFQUFpRSxLQUFLLE9BQUwsQ0FBYSxPQUFiLEVBQXNCLEtBQUssT0FBTCxDQUFhLE9BQWIsQ0FBNUcsRUFuQmE7O0FBcUJiLGVBQU0sQ0FBQyxXQUFXLEdBQVgsQ0FBZSxnQkFBZixDQUFnQyxLQUFLLFFBQUwsQ0FBakMsSUFBbUQsS0FBSyxPQUFMLEVBQWE7QUFDcEUsZUFBSyxXQUFMLENBQWlCLFFBQWpCLEVBRG9FO0FBRXBFLGVBQUssWUFBTCxHQUZvRTtTQUF0RTs7Ozs7Ozs7Ozs7Z0NBV1E7QUFDUixZQUFJLFFBQVEsSUFBUixDQURJO0FBRVIsYUFBSyxRQUFMLENBQWMsRUFBZCxDQUFpQjtBQUNmLDZCQUFtQixLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsSUFBZixDQUFuQjtBQUNBLDhCQUFvQixLQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLElBQWhCLENBQXBCO0FBQ0EsK0JBQXFCLEtBQUssTUFBTCxDQUFZLElBQVosQ0FBaUIsSUFBakIsQ0FBckI7QUFDQSxpQ0FBdUIsS0FBSyxZQUFMLENBQWtCLElBQWxCLENBQXVCLElBQXZCLENBQXZCO1NBSkYsRUFGUTs7QUFTUixZQUFHLEtBQUssT0FBTCxDQUFhLEtBQWIsRUFBbUI7QUFDcEIsZUFBSyxPQUFMLENBQWEsR0FBYixDQUFpQiwrQ0FBakIsRUFDSyxFQURMLENBQ1Esd0JBRFIsRUFDa0MsWUFBVTtBQUN0Qyx5QkFBYSxNQUFNLE9BQU4sQ0FBYixDQURzQztBQUV0QyxrQkFBTSxPQUFOLEdBQWdCLFdBQVcsWUFBVTtBQUNuQyxvQkFBTSxJQUFOLEdBRG1DO0FBRW5DLG9CQUFNLE9BQU4sQ0FBYyxJQUFkLENBQW1CLE9BQW5CLEVBQTRCLElBQTVCLEVBRm1DO2FBQVYsRUFHeEIsTUFBTSxPQUFOLENBQWMsVUFBZCxDQUhILENBRnNDO1dBQVYsQ0FEbEMsQ0FPTyxFQVBQLENBT1Usd0JBUFYsRUFPb0MsWUFBVTtBQUN4Qyx5QkFBYSxNQUFNLE9BQU4sQ0FBYixDQUR3QztBQUV4QyxrQkFBTSxPQUFOLEdBQWdCLFdBQVcsWUFBVTtBQUNuQyxvQkFBTSxLQUFOLEdBRG1DO0FBRW5DLG9CQUFNLE9BQU4sQ0FBYyxJQUFkLENBQW1CLE9BQW5CLEVBQTRCLEtBQTVCLEVBRm1DO2FBQVYsRUFHeEIsTUFBTSxPQUFOLENBQWMsVUFBZCxDQUhILENBRndDO1dBQVYsQ0FQcEMsQ0FEb0I7QUFlcEIsY0FBRyxLQUFLLE9BQUwsQ0FBYSxTQUFiLEVBQXVCO0FBQ3hCLGlCQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLCtDQUFsQixFQUNLLEVBREwsQ0FDUSx3QkFEUixFQUNrQyxZQUFVO0FBQ3RDLDJCQUFhLE1BQU0sT0FBTixDQUFiLENBRHNDO2FBQVYsQ0FEbEMsQ0FHTyxFQUhQLENBR1Usd0JBSFYsRUFHb0MsWUFBVTtBQUN4QywyQkFBYSxNQUFNLE9BQU4sQ0FBYixDQUR3QztBQUV4QyxvQkFBTSxPQUFOLEdBQWdCLFdBQVcsWUFBVTtBQUNuQyxzQkFBTSxLQUFOLEdBRG1DO0FBRW5DLHNCQUFNLE9BQU4sQ0FBYyxJQUFkLENBQW1CLE9BQW5CLEVBQTRCLEtBQTVCLEVBRm1DO2VBQVYsRUFHeEIsTUFBTSxPQUFOLENBQWMsVUFBZCxDQUhILENBRndDO2FBQVYsQ0FIcEMsQ0FEd0I7V0FBMUI7U0FmRjtBQTRCQSxhQUFLLE9BQUwsQ0FBYSxHQUFiLENBQWlCLEtBQUssUUFBTCxDQUFqQixDQUFnQyxFQUFoQyxDQUFtQyxxQkFBbkMsRUFBMEQsVUFBUyxDQUFULEVBQVk7O0FBRXBFLGNBQUksVUFBVSxFQUFFLElBQUYsQ0FBVjtjQUNGLDJCQUEyQixXQUFXLFFBQVgsQ0FBb0IsYUFBcEIsQ0FBa0MsTUFBTSxRQUFOLENBQTdELENBSGtFOztBQUtwRSxxQkFBVyxRQUFYLENBQW9CLFNBQXBCLENBQThCLENBQTlCLEVBQWlDLFVBQWpDLEVBQTZDO0FBQzNDLHlCQUFhLFlBQVc7QUFDdEIsa0JBQUksTUFBTSxRQUFOLENBQWUsSUFBZixDQUFvQixRQUFwQixFQUE4QixFQUE5QixDQUFpQyx5QkFBeUIsRUFBekIsQ0FBNEIsQ0FBQyxDQUFELENBQTdELENBQUosRUFBdUU7O0FBQ3JFLG9CQUFJLE1BQU0sT0FBTixDQUFjLFNBQWQsRUFBeUI7O0FBQzNCLDJDQUF5QixFQUF6QixDQUE0QixDQUE1QixFQUErQixLQUEvQixHQUQyQjtBQUUzQixvQkFBRSxjQUFGLEdBRjJCO2lCQUE3QixNQUdPOztBQUNMLHdCQUFNLEtBQU4sR0FESztpQkFIUDtlQURGO2FBRFc7QUFVYiwwQkFBYyxZQUFXO0FBQ3ZCLGtCQUFJLE1BQU0sUUFBTixDQUFlLElBQWYsQ0FBb0IsUUFBcEIsRUFBOEIsRUFBOUIsQ0FBaUMseUJBQXlCLEVBQXpCLENBQTRCLENBQTVCLENBQWpDLEtBQW9FLE1BQU0sUUFBTixDQUFlLEVBQWYsQ0FBa0IsUUFBbEIsQ0FBcEUsRUFBaUc7O0FBQ25HLG9CQUFJLE1BQU0sT0FBTixDQUFjLFNBQWQsRUFBeUI7O0FBQzNCLDJDQUF5QixFQUF6QixDQUE0QixDQUFDLENBQUQsQ0FBNUIsQ0FBZ0MsS0FBaEMsR0FEMkI7QUFFM0Isb0JBQUUsY0FBRixHQUYyQjtpQkFBN0IsTUFHTzs7QUFDTCx3QkFBTSxLQUFOLEdBREs7aUJBSFA7ZUFERjthQURZO0FBVWQsa0JBQU0sWUFBVztBQUNmLGtCQUFJLFFBQVEsRUFBUixDQUFXLE1BQU0sT0FBTixDQUFmLEVBQStCO0FBQzdCLHNCQUFNLElBQU4sR0FENkI7QUFFN0Isc0JBQU0sUUFBTixDQUFlLElBQWYsQ0FBb0IsVUFBcEIsRUFBZ0MsQ0FBQyxDQUFELENBQWhDLENBQW9DLEtBQXBDLEdBRjZCO0FBRzdCLGtCQUFFLGNBQUYsR0FINkI7ZUFBL0I7YUFESTtBQU9OLG1CQUFPLFlBQVc7QUFDaEIsb0JBQU0sS0FBTixHQURnQjtBQUVoQixvQkFBTSxPQUFOLENBQWMsS0FBZCxHQUZnQjthQUFYO1dBNUJULEVBTG9FO1NBQVosQ0FBMUQsQ0FyQ1E7Ozs7Ozs7Ozs7O3dDQW1GUTtBQUNmLFlBQUksUUFBUSxFQUFFLFNBQVMsSUFBVCxDQUFGLENBQWlCLEdBQWpCLENBQXFCLEtBQUssUUFBTCxDQUE3QjtZQUNBLFFBQVEsSUFBUixDQUZXO0FBR2YsY0FBTSxHQUFOLENBQVUsbUJBQVYsRUFDTSxFQUROLENBQ1MsbUJBRFQsRUFDOEIsVUFBUyxDQUFULEVBQVc7QUFDbEMsY0FBRyxNQUFNLE9BQU4sQ0FBYyxFQUFkLENBQWlCLEVBQUUsTUFBRixDQUFqQixJQUE4QixNQUFNLE9BQU4sQ0FBYyxJQUFkLENBQW1CLEVBQUUsTUFBRixDQUFuQixDQUE2QixNQUE3QixFQUFxQztBQUNwRSxtQkFEb0U7V0FBdEU7QUFHQSxjQUFHLE1BQU0sUUFBTixDQUFlLElBQWYsQ0FBb0IsRUFBRSxNQUFGLENBQXBCLENBQThCLE1BQTlCLEVBQXNDO0FBQ3ZDLG1CQUR1QztXQUF6QztBQUdBLGdCQUFNLEtBQU4sR0FQa0M7QUFRbEMsZ0JBQU0sR0FBTixDQUFVLG1CQUFWLEVBUmtDO1NBQVgsQ0FEOUIsQ0FIZTs7Ozs7Ozs7Ozs7OzZCQXNCWDs7Ozs7O0FBTUwsYUFBSyxRQUFMLENBQWMsT0FBZCxDQUFzQixxQkFBdEIsRUFBNkMsS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixJQUFuQixDQUE3QyxFQU5LO0FBT0wsYUFBSyxPQUFMLENBQWEsUUFBYixDQUFzQixPQUF0QixFQUNLLElBREwsQ0FDVSxFQUFDLGlCQUFpQixJQUFqQixFQURYOztBQVBLLFlBVUwsQ0FBSyxZQUFMLEdBVks7QUFXTCxhQUFLLFFBQUwsQ0FBYyxRQUFkLENBQXVCLFNBQXZCLEVBQ0ssSUFETCxDQUNVLEVBQUMsZUFBZSxLQUFmLEVBRFgsRUFYSzs7QUFjTCxZQUFHLEtBQUssT0FBTCxDQUFhLFNBQWIsRUFBdUI7QUFDeEIsY0FBSSxhQUFhLFdBQVcsUUFBWCxDQUFvQixhQUFwQixDQUFrQyxLQUFLLFFBQUwsQ0FBL0MsQ0FEb0I7QUFFeEIsY0FBRyxXQUFXLE1BQVgsRUFBa0I7QUFDbkIsdUJBQVcsRUFBWCxDQUFjLENBQWQsRUFBaUIsS0FBakIsR0FEbUI7V0FBckI7U0FGRjs7QUFPQSxZQUFHLEtBQUssT0FBTCxDQUFhLFlBQWIsRUFBMEI7QUFBRSxlQUFLLGVBQUwsR0FBRjtTQUE3Qjs7Ozs7O0FBckJLLFlBMkJMLENBQUssUUFBTCxDQUFjLE9BQWQsQ0FBc0Isa0JBQXRCLEVBQTBDLENBQUMsS0FBSyxRQUFMLENBQTNDLEVBM0JLOzs7Ozs7Ozs7Ozs4QkFtQ0M7QUFDTixZQUFHLENBQUMsS0FBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixTQUF2QixDQUFELEVBQW1DO0FBQ3BDLGlCQUFPLEtBQVAsQ0FEb0M7U0FBdEM7QUFHQSxhQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLFNBQTFCLEVBQ0ssSUFETCxDQUNVLEVBQUMsZUFBZSxJQUFmLEVBRFgsRUFKTTs7QUFPTixhQUFLLE9BQUwsQ0FBYSxXQUFiLENBQXlCLE9BQXpCLEVBQ0ssSUFETCxDQUNVLGVBRFYsRUFDMkIsS0FEM0IsRUFQTTs7QUFVTixZQUFHLEtBQUssWUFBTCxFQUFrQjtBQUNuQixjQUFJLG1CQUFtQixLQUFLLGdCQUFMLEVBQW5CLENBRGU7QUFFbkIsY0FBRyxnQkFBSCxFQUFvQjtBQUNsQixpQkFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixnQkFBMUIsRUFEa0I7V0FBcEI7QUFHQSxlQUFLLFFBQUwsQ0FBYyxRQUFkLENBQXVCLEtBQUssT0FBTCxDQUFhLGFBQWI7cUJBQXZCLENBQ2dCLEdBRGhCLENBQ29CLEVBQUMsUUFBUSxFQUFSLEVBQVksT0FBTyxFQUFQLEVBRGpDLEVBTG1CO0FBT25CLGVBQUssWUFBTCxHQUFvQixLQUFwQixDQVBtQjtBQVFuQixlQUFLLE9BQUwsR0FBZSxDQUFmLENBUm1CO0FBU25CLGVBQUssYUFBTCxDQUFtQixNQUFuQixHQUE0QixDQUE1QixDQVRtQjtTQUFyQjtBQVdBLGFBQUssUUFBTCxDQUFjLE9BQWQsQ0FBc0Isa0JBQXRCLEVBQTBDLENBQUMsS0FBSyxRQUFMLENBQTNDLEVBckJNOzs7Ozs7Ozs7OytCQTRCQztBQUNQLFlBQUcsS0FBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixTQUF2QixDQUFILEVBQXFDO0FBQ25DLGNBQUcsS0FBSyxPQUFMLENBQWEsSUFBYixDQUFrQixPQUFsQixDQUFILEVBQStCLE9BQS9CO0FBQ0EsZUFBSyxLQUFMLEdBRm1DO1NBQXJDLE1BR0s7QUFDSCxlQUFLLElBQUwsR0FERztTQUhMOzs7Ozs7Ozs7O2dDQVlRO0FBQ1IsYUFBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixhQUFsQixFQUFpQyxJQUFqQyxHQURRO0FBRVIsYUFBSyxPQUFMLENBQWEsR0FBYixDQUFpQixjQUFqQixFQUZROztBQUlSLG1CQUFXLGdCQUFYLENBQTRCLElBQTVCLEVBSlE7Ozs7V0FuVU47TUFWTzs7QUFxVmIsV0FBUyxRQUFULEdBQW9COzs7Ozs7QUFNbEIsZ0JBQVksR0FBWjs7Ozs7O0FBTUEsV0FBTyxLQUFQOzs7Ozs7QUFNQSxlQUFXLEtBQVg7Ozs7OztBQU1BLGFBQVMsQ0FBVDs7Ozs7O0FBTUEsYUFBUyxDQUFUOzs7Ozs7QUFNQSxtQkFBZSxFQUFmOzs7Ozs7QUFNQSxlQUFXLEtBQVg7Ozs7OztBQU1BLGVBQVcsS0FBWDs7Ozs7O0FBTUEsa0JBQWMsS0FBZDtHQXRERjs7O0FBclZhLFlBK1liLENBQVcsTUFBWCxDQUFrQixRQUFsQixFQUE0QixVQUE1QixFQS9ZYTtDQUFaLENBaVpDLE1BalpELENBQUQ7Q0NGQTs7Ozs7O0FBRUEsQ0FBQyxVQUFTLENBQVQsRUFBWTs7Ozs7Ozs7OztNQVVQOzs7Ozs7Ozs7QUFRSixhQVJJLFlBUUosQ0FBWSxPQUFaLEVBQXFCLE9BQXJCLEVBQThCOzRCQVIxQixjQVEwQjs7QUFDNUIsV0FBSyxRQUFMLEdBQWdCLE9BQWhCLENBRDRCO0FBRTVCLFdBQUssT0FBTCxHQUFlLEVBQUUsTUFBRixDQUFTLEVBQVQsRUFBYSxhQUFhLFFBQWIsRUFBdUIsS0FBSyxRQUFMLENBQWMsSUFBZCxFQUFwQyxFQUEwRCxPQUExRCxDQUFmLENBRjRCOztBQUk1QixpQkFBVyxJQUFYLENBQWdCLE9BQWhCLENBQXdCLEtBQUssUUFBTCxFQUFlLFVBQXZDLEVBSjRCO0FBSzVCLFdBQUssS0FBTCxHQUw0Qjs7QUFPNUIsaUJBQVcsY0FBWCxDQUEwQixJQUExQixFQUFnQyxjQUFoQyxFQVA0QjtBQVE1QixpQkFBVyxRQUFYLENBQW9CLFFBQXBCLENBQTZCLGNBQTdCLEVBQTZDO0FBQzNDLGlCQUFTLE1BQVQ7QUFDQSxpQkFBUyxNQUFUO0FBQ0EsdUJBQWUsTUFBZjtBQUNBLG9CQUFZLElBQVo7QUFDQSxzQkFBYyxNQUFkO0FBQ0Esc0JBQWMsVUFBZDtBQUNBLGtCQUFVLE9BQVY7T0FQRixFQVI0QjtLQUE5Qjs7Ozs7Ozs7O2lCQVJJOzs4QkFnQ0k7QUFDTixZQUFJLE9BQU8sS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQiwrQkFBbkIsQ0FBUCxDQURFO0FBRU4sYUFBSyxRQUFMLENBQWMsUUFBZCxDQUF1Qiw2QkFBdkIsRUFBc0QsUUFBdEQsQ0FBK0Qsc0JBQS9ELEVBQXVGLFFBQXZGLENBQWdHLFdBQWhHLEVBRk07O0FBSU4sYUFBSyxVQUFMLEdBQWtCLEtBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsbUJBQW5CLENBQWxCLENBSk07QUFLTixhQUFLLEtBQUwsR0FBYSxLQUFLLFFBQUwsQ0FBYyxRQUFkLENBQXVCLG1CQUF2QixDQUFiLENBTE07QUFNTixhQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLHdCQUFoQixFQUEwQyxRQUExQyxDQUFtRCxLQUFLLE9BQUwsQ0FBYSxhQUFiLENBQW5ELENBTk07O0FBUU4sWUFBSSxLQUFLLFFBQUwsQ0FBYyxRQUFkLENBQXVCLEtBQUssT0FBTCxDQUFhLFVBQWIsQ0FBdkIsSUFBbUQsS0FBSyxPQUFMLENBQWEsU0FBYixLQUEyQixPQUEzQixJQUFzQyxXQUFXLEdBQVgsRUFBekYsRUFBMkc7QUFDN0csZUFBSyxPQUFMLENBQWEsU0FBYixHQUF5QixPQUF6QixDQUQ2RztBQUU3RyxlQUFLLFFBQUwsQ0FBYyxZQUFkLEVBRjZHO1NBQS9HLE1BR087QUFDTCxlQUFLLFFBQUwsQ0FBYyxhQUFkLEVBREs7U0FIUDtBQU1BLGFBQUssT0FBTCxHQUFlLEtBQWYsQ0FkTTtBQWVOLGFBQUssT0FBTCxHQWZNOzs7Ozs7Ozs7O2dDQXNCRTtBQUNSLFlBQUksUUFBUSxJQUFSO1lBQ0EsV0FBVyxrQkFBa0IsTUFBbEIsSUFBNkIsT0FBTyxPQUFPLFlBQVAsS0FBd0IsV0FBL0I7WUFDeEMsV0FBVyw0QkFBWCxDQUhJOztBQUtSLFlBQUksS0FBSyxPQUFMLENBQWEsU0FBYixJQUEwQixRQUExQixFQUFvQztBQUN0QyxlQUFLLFVBQUwsQ0FBZ0IsRUFBaEIsQ0FBbUIsa0RBQW5CLEVBQXVFLFVBQVMsQ0FBVCxFQUFZO0FBQ2pGLGdCQUFJLFFBQVEsRUFBRSxFQUFFLE1BQUYsQ0FBRixDQUFZLFlBQVosQ0FBeUIsSUFBekIsUUFBbUMsUUFBbkMsQ0FBUjtnQkFDQSxTQUFTLE1BQU0sUUFBTixDQUFlLFFBQWYsQ0FBVDtnQkFDQSxhQUFhLE1BQU0sSUFBTixDQUFXLGVBQVgsTUFBZ0MsTUFBaEM7Z0JBQ2IsT0FBTyxNQUFNLFFBQU4sQ0FBZSxzQkFBZixDQUFQLENBSjZFOztBQU1qRixnQkFBSSxNQUFKLEVBQVk7QUFDVixrQkFBSSxVQUFKLEVBQWdCO0FBQ2Qsb0JBQUksQ0FBQyxNQUFNLE9BQU4sQ0FBYyxZQUFkLElBQStCLENBQUMsTUFBTSxPQUFOLENBQWMsU0FBZCxJQUEyQixDQUFDLFFBQUQsSUFBZSxNQUFNLE9BQU4sQ0FBYyxXQUFkLElBQTZCLFFBQTdCLEVBQXdDO0FBQUUseUJBQUY7aUJBQXZILE1BQ0s7QUFDSCxvQkFBRSx3QkFBRixHQURHO0FBRUgsb0JBQUUsY0FBRixHQUZHO0FBR0gsd0JBQU0sS0FBTixDQUFZLEtBQVosRUFIRztpQkFETDtlQURGLE1BT087QUFDTCxrQkFBRSxjQUFGLEdBREs7QUFFTCxrQkFBRSx3QkFBRixHQUZLO0FBR0wsc0JBQU0sS0FBTixDQUFZLE1BQU0sUUFBTixDQUFlLHNCQUFmLENBQVosRUFISztBQUlMLHNCQUFNLEdBQU4sQ0FBVSxNQUFNLFlBQU4sQ0FBbUIsTUFBTSxRQUFOLFFBQW9CLFFBQXZDLENBQVYsRUFBOEQsSUFBOUQsQ0FBbUUsZUFBbkUsRUFBb0YsSUFBcEYsRUFKSztlQVBQO2FBREYsTUFjTztBQUFFLHFCQUFGO2FBZFA7V0FOcUUsQ0FBdkUsQ0FEc0M7U0FBeEM7O0FBeUJBLFlBQUksQ0FBQyxLQUFLLE9BQUwsQ0FBYSxZQUFiLEVBQTJCO0FBQzlCLGVBQUssVUFBTCxDQUFnQixFQUFoQixDQUFtQiw0QkFBbkIsRUFBaUQsVUFBUyxDQUFULEVBQVk7QUFDM0QsY0FBRSx3QkFBRixHQUQyRDtBQUUzRCxnQkFBSSxRQUFRLEVBQUUsSUFBRixDQUFSO2dCQUNBLFNBQVMsTUFBTSxRQUFOLENBQWUsUUFBZixDQUFULENBSHVEOztBQUszRCxnQkFBSSxNQUFKLEVBQVk7QUFDViwyQkFBYSxNQUFNLEtBQU4sQ0FBYixDQURVO0FBRVYsb0JBQU0sS0FBTixHQUFjLFdBQVcsWUFBVztBQUNsQyxzQkFBTSxLQUFOLENBQVksTUFBTSxRQUFOLENBQWUsc0JBQWYsQ0FBWixFQURrQztlQUFYLEVBRXRCLE1BQU0sT0FBTixDQUFjLFVBQWQsQ0FGSCxDQUZVO2FBQVo7V0FMK0MsQ0FBakQsQ0FXRyxFQVhILENBV00sNEJBWE4sRUFXb0MsVUFBUyxDQUFULEVBQVk7QUFDOUMsZ0JBQUksUUFBUSxFQUFFLElBQUYsQ0FBUjtnQkFDQSxTQUFTLE1BQU0sUUFBTixDQUFlLFFBQWYsQ0FBVCxDQUYwQztBQUc5QyxnQkFBSSxVQUFVLE1BQU0sT0FBTixDQUFjLFNBQWQsRUFBeUI7QUFDckMsa0JBQUksTUFBTSxJQUFOLENBQVcsZUFBWCxNQUFnQyxNQUFoQyxJQUEwQyxNQUFNLE9BQU4sQ0FBYyxTQUFkLEVBQXlCO0FBQUUsdUJBQU8sS0FBUCxDQUFGO2VBQXZFOztBQUVBLDJCQUFhLE1BQU0sS0FBTixDQUFiLENBSHFDO0FBSXJDLG9CQUFNLEtBQU4sR0FBYyxXQUFXLFlBQVc7QUFDbEMsc0JBQU0sS0FBTixDQUFZLEtBQVosRUFEa0M7ZUFBWCxFQUV0QixNQUFNLE9BQU4sQ0FBYyxXQUFkLENBRkgsQ0FKcUM7YUFBdkM7V0FIa0MsQ0FYcEMsQ0FEOEI7U0FBaEM7QUF5QkEsYUFBSyxVQUFMLENBQWdCLEVBQWhCLENBQW1CLHlCQUFuQixFQUE4QyxVQUFTLENBQVQsRUFBWTtBQUN4RCxjQUFJLFdBQVcsRUFBRSxFQUFFLE1BQUYsQ0FBRixDQUFZLFlBQVosQ0FBeUIsSUFBekIsRUFBK0IsbUJBQS9CLENBQVg7Y0FDQSxRQUFRLE1BQU0sS0FBTixDQUFZLEtBQVosQ0FBa0IsUUFBbEIsSUFBOEIsQ0FBQyxDQUFEO2NBQ3RDLFlBQVksUUFBUSxNQUFNLEtBQU4sR0FBYyxTQUFTLFFBQVQsQ0FBa0IsSUFBbEIsRUFBd0IsR0FBeEIsQ0FBNEIsUUFBNUIsQ0FBdEI7Y0FDWixZQUhKO2NBSUksWUFKSixDQUR3RDs7QUFPeEQsb0JBQVUsSUFBVixDQUFlLFVBQVMsQ0FBVCxFQUFZO0FBQ3pCLGdCQUFJLEVBQUUsSUFBRixFQUFRLEVBQVIsQ0FBVyxRQUFYLENBQUosRUFBMEI7QUFDeEIsNkJBQWUsVUFBVSxFQUFWLENBQWEsSUFBRSxDQUFGLENBQTVCLENBRHdCO0FBRXhCLDZCQUFlLFVBQVUsRUFBVixDQUFhLElBQUUsQ0FBRixDQUE1QixDQUZ3QjtBQUd4QixxQkFId0I7YUFBMUI7V0FEYSxDQUFmLENBUHdEOztBQWV4RCxjQUFJLGNBQWMsWUFBVztBQUMzQixnQkFBSSxDQUFDLFNBQVMsRUFBVCxDQUFZLGFBQVosQ0FBRCxFQUE2QixhQUFhLFFBQWIsQ0FBc0IsU0FBdEIsRUFBaUMsS0FBakMsR0FBakM7V0FEZ0I7Y0FFZixjQUFjLFlBQVc7QUFDMUIseUJBQWEsUUFBYixDQUFzQixTQUF0QixFQUFpQyxLQUFqQyxHQUQwQjtXQUFYO2NBRWQsVUFBVSxZQUFXO0FBQ3RCLGdCQUFJLE9BQU8sU0FBUyxRQUFULENBQWtCLHdCQUFsQixDQUFQLENBRGtCO0FBRXRCLGdCQUFJLEtBQUssTUFBTCxFQUFhO0FBQ2Ysb0JBQU0sS0FBTixDQUFZLElBQVosRUFEZTtBQUVmLHVCQUFTLElBQVQsQ0FBYyxjQUFkLEVBQThCLEtBQTlCLEdBRmU7YUFBakIsTUFHTztBQUFFLHFCQUFGO2FBSFA7V0FGVztjQU1WLFdBQVcsWUFBVzs7QUFFdkIsZ0JBQUksUUFBUSxTQUFTLE1BQVQsQ0FBZ0IsSUFBaEIsRUFBc0IsTUFBdEIsQ0FBNkIsSUFBN0IsQ0FBUixDQUZtQjtBQUdyQixrQkFBTSxRQUFOLENBQWUsU0FBZixFQUEwQixLQUExQixHQUhxQjtBQUlyQixrQkFBTSxLQUFOLENBQVksS0FBWjs7QUFKcUIsV0FBWCxDQXpCMEM7QUFnQ3hELGNBQUksWUFBWTtBQUNkLGtCQUFNLE9BQU47QUFDQSxtQkFBTyxZQUFXO0FBQ2hCLG9CQUFNLEtBQU4sQ0FBWSxNQUFNLFFBQU4sQ0FBWixDQURnQjtBQUVoQixvQkFBTSxVQUFOLENBQWlCLElBQWpCLENBQXNCLFNBQXRCLEVBQWlDLEtBQWpDO0FBRmdCLGFBQVg7QUFJUCxxQkFBUyxZQUFXO0FBQ2xCLGdCQUFFLGNBQUYsR0FEa0I7QUFFbEIsZ0JBQUUsd0JBQUYsR0FGa0I7YUFBWDtXQU5QLENBaENvRDs7QUE0Q3hELGNBQUksS0FBSixFQUFXO0FBQ1QsZ0JBQUksTUFBTSxRQUFOLEVBQWdCOztBQUNsQixrQkFBSSxNQUFNLE9BQU4sQ0FBYyxTQUFkLEtBQTRCLE1BQTVCLEVBQW9DOztBQUN0QyxrQkFBRSxNQUFGLENBQVMsU0FBVCxFQUFvQjtBQUNsQix3QkFBTSxXQUFOO0FBQ0Esc0JBQUksV0FBSjtBQUNBLHdCQUFNLE9BQU47QUFDQSw0QkFBVSxRQUFWO2lCQUpGLEVBRHNDO2VBQXhDLE1BT087O0FBQ0wsa0JBQUUsTUFBRixDQUFTLFNBQVQsRUFBb0I7QUFDbEIsd0JBQU0sV0FBTjtBQUNBLHNCQUFJLFdBQUo7QUFDQSx3QkFBTSxRQUFOO0FBQ0EsNEJBQVUsT0FBVjtpQkFKRixFQURLO2VBUFA7YUFERixNQWdCTzs7QUFDTCxnQkFBRSxNQUFGLENBQVMsU0FBVCxFQUFvQjtBQUNsQixzQkFBTSxXQUFOO0FBQ0EsMEJBQVUsV0FBVjtBQUNBLHNCQUFNLE9BQU47QUFDQSxvQkFBSSxRQUFKO2VBSkYsRUFESzthQWhCUDtXQURGLE1BeUJPOztBQUNMLGdCQUFJLE1BQU0sT0FBTixDQUFjLFNBQWQsS0FBNEIsTUFBNUIsRUFBb0M7O0FBQ3RDLGdCQUFFLE1BQUYsQ0FBUyxTQUFULEVBQW9CO0FBQ2xCLHNCQUFNLE9BQU47QUFDQSwwQkFBVSxRQUFWO0FBQ0Esc0JBQU0sV0FBTjtBQUNBLG9CQUFJLFdBQUo7ZUFKRixFQURzQzthQUF4QyxNQU9POztBQUNMLGdCQUFFLE1BQUYsQ0FBUyxTQUFULEVBQW9CO0FBQ2xCLHNCQUFNLFFBQU47QUFDQSwwQkFBVSxPQUFWO0FBQ0Esc0JBQU0sV0FBTjtBQUNBLG9CQUFJLFdBQUo7ZUFKRixFQURLO2FBUFA7V0ExQkY7QUEwQ0EscUJBQVcsUUFBWCxDQUFvQixTQUFwQixDQUE4QixDQUE5QixFQUFpQyxjQUFqQyxFQUFpRCxTQUFqRCxFQXRGd0Q7U0FBWixDQUE5QyxDQXZEUTs7Ozs7Ozs7Ozs7d0NBdUpRO0FBQ2hCLFlBQUksUUFBUSxFQUFFLFNBQVMsSUFBVCxDQUFWO1lBQ0EsUUFBUSxJQUFSLENBRlk7QUFHaEIsY0FBTSxHQUFOLENBQVUsa0RBQVYsRUFDTSxFQUROLENBQ1Msa0RBRFQsRUFDNkQsVUFBUyxDQUFULEVBQVk7QUFDbEUsY0FBSSxRQUFRLE1BQU0sUUFBTixDQUFlLElBQWYsQ0FBb0IsRUFBRSxNQUFGLENBQTVCLENBRDhEO0FBRWxFLGNBQUksTUFBTSxNQUFOLEVBQWM7QUFBRSxtQkFBRjtXQUFsQjs7QUFFQSxnQkFBTSxLQUFOLEdBSmtFO0FBS2xFLGdCQUFNLEdBQU4sQ0FBVSxrREFBVixFQUxrRTtTQUFaLENBRDdELENBSGdCOzs7Ozs7Ozs7Ozs7OzRCQW9CWixNQUFNO0FBQ1YsWUFBSSxNQUFNLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsS0FBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixVQUFTLENBQVQsRUFBWSxFQUFaLEVBQWdCO0FBQzNELGlCQUFPLEVBQUUsRUFBRixFQUFNLElBQU4sQ0FBVyxJQUFYLEVBQWlCLE1BQWpCLEdBQTBCLENBQTFCLENBRG9EO1NBQWhCLENBQW5DLENBQU4sQ0FETTtBQUlWLFlBQUksUUFBUSxLQUFLLE1BQUwsQ0FBWSwrQkFBWixFQUE2QyxRQUE3QyxDQUFzRCwrQkFBdEQsQ0FBUixDQUpNO0FBS1YsYUFBSyxLQUFMLENBQVcsS0FBWCxFQUFrQixHQUFsQixFQUxVO0FBTVYsYUFBSyxHQUFMLENBQVMsWUFBVCxFQUF1QixRQUF2QixFQUFpQyxRQUFqQyxDQUEwQyxvQkFBMUMsRUFBZ0UsSUFBaEUsQ0FBcUUsRUFBQyxlQUFlLEtBQWYsRUFBdEUsRUFDSyxNQURMLENBQ1ksK0JBRFosRUFDNkMsUUFEN0MsQ0FDc0QsV0FEdEQsRUFFSyxJQUZMLENBRVUsRUFBQyxpQkFBaUIsSUFBakIsRUFGWCxFQU5VO0FBU1YsWUFBSSxRQUFRLFdBQVcsR0FBWCxDQUFlLGdCQUFmLENBQWdDLElBQWhDLEVBQXNDLElBQXRDLEVBQTRDLElBQTVDLENBQVIsQ0FUTTtBQVVWLFlBQUksQ0FBQyxLQUFELEVBQVE7QUFDVixjQUFJLFdBQVcsS0FBSyxPQUFMLENBQWEsU0FBYixLQUEyQixNQUEzQixHQUFvQyxRQUFwQyxHQUErQyxPQUEvQztjQUNYLFlBQVksS0FBSyxNQUFMLENBQVksNkJBQVosQ0FBWixDQUZNO0FBR1Ysb0JBQVUsV0FBVixXQUE4QixRQUE5QixFQUEwQyxRQUExQyxZQUE0RCxLQUFLLE9BQUwsQ0FBYSxTQUFiLENBQTVELENBSFU7QUFJVixrQkFBUSxXQUFXLEdBQVgsQ0FBZSxnQkFBZixDQUFnQyxJQUFoQyxFQUFzQyxJQUF0QyxFQUE0QyxJQUE1QyxDQUFSLENBSlU7QUFLVixjQUFJLENBQUMsS0FBRCxFQUFRO0FBQ1Ysc0JBQVUsV0FBVixZQUErQixLQUFLLE9BQUwsQ0FBYSxTQUFiLENBQS9CLENBQXlELFFBQXpELENBQWtFLGFBQWxFLEVBRFU7V0FBWjtBQUdBLGVBQUssT0FBTCxHQUFlLElBQWYsQ0FSVTtTQUFaO0FBVUEsYUFBSyxHQUFMLENBQVMsWUFBVCxFQUF1QixFQUF2QixFQXBCVTtBQXFCVixZQUFJLEtBQUssT0FBTCxDQUFhLFlBQWIsRUFBMkI7QUFBRSxlQUFLLGVBQUwsR0FBRjtTQUEvQjs7Ozs7QUFyQlUsWUEwQlYsQ0FBSyxRQUFMLENBQWMsT0FBZCxDQUFzQixzQkFBdEIsRUFBOEMsQ0FBQyxJQUFELENBQTlDLEVBMUJVOzs7Ozs7Ozs7Ozs7OzRCQW9DTixPQUFPLEtBQUs7QUFDaEIsWUFBSSxRQUFKLENBRGdCO0FBRWhCLFlBQUksU0FBUyxNQUFNLE1BQU4sRUFBYztBQUN6QixxQkFBVyxLQUFYLENBRHlCO1NBQTNCLE1BRU8sSUFBSSxRQUFRLFNBQVIsRUFBbUI7QUFDNUIscUJBQVcsS0FBSyxLQUFMLENBQVcsR0FBWCxDQUFlLFVBQVMsQ0FBVCxFQUFZLEVBQVosRUFBZ0I7QUFDeEMsbUJBQU8sTUFBTSxHQUFOLENBRGlDO1dBQWhCLENBQTFCLENBRDRCO1NBQXZCLE1BS0Y7QUFDSCxxQkFBVyxLQUFLLFFBQUwsQ0FEUjtTQUxFO0FBUVAsWUFBSSxtQkFBbUIsU0FBUyxRQUFULENBQWtCLFdBQWxCLEtBQWtDLFNBQVMsSUFBVCxDQUFjLFlBQWQsRUFBNEIsTUFBNUIsR0FBcUMsQ0FBckMsQ0FaekM7O0FBY2hCLFlBQUksZ0JBQUosRUFBc0I7QUFDcEIsbUJBQVMsSUFBVCxDQUFjLGNBQWQsRUFBOEIsR0FBOUIsQ0FBa0MsUUFBbEMsRUFBNEMsSUFBNUMsQ0FBaUQ7QUFDL0MsNkJBQWlCLEtBQWpCO0FBQ0EsNkJBQWlCLEtBQWpCO1dBRkYsRUFHRyxXQUhILENBR2UsV0FIZixFQURvQjs7QUFNcEIsbUJBQVMsSUFBVCxDQUFjLHVCQUFkLEVBQXVDLElBQXZDLENBQTRDO0FBQzFDLDJCQUFlLElBQWY7V0FERixFQUVHLFdBRkgsQ0FFZSxvQkFGZixFQU5vQjs7QUFVcEIsY0FBSSxLQUFLLE9BQUwsSUFBZ0IsU0FBUyxJQUFULENBQWMsYUFBZCxFQUE2QixNQUE3QixFQUFxQztBQUN2RCxnQkFBSSxXQUFXLEtBQUssT0FBTCxDQUFhLFNBQWIsS0FBMkIsTUFBM0IsR0FBb0MsT0FBcEMsR0FBOEMsTUFBOUMsQ0FEd0M7QUFFdkQscUJBQVMsSUFBVCxDQUFjLCtCQUFkLEVBQStDLEdBQS9DLENBQW1ELFFBQW5ELEVBQ1MsV0FEVCx3QkFDMEMsS0FBSyxPQUFMLENBQWEsU0FBYixDQUQxQyxDQUVTLFFBRlQsWUFFMkIsUUFGM0IsRUFGdUQ7QUFLdkQsaUJBQUssT0FBTCxHQUFlLEtBQWYsQ0FMdUQ7V0FBekQ7Ozs7O0FBVm9CLGNBcUJwQixDQUFLLFFBQUwsQ0FBYyxPQUFkLENBQXNCLHNCQUF0QixFQUE4QyxDQUFDLFFBQUQsQ0FBOUMsRUFyQm9CO1NBQXRCOzs7Ozs7Ozs7O2dDQTZCUTtBQUNSLGFBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixrQkFBcEIsRUFBd0MsVUFBeEMsQ0FBbUQsZUFBbkQsRUFDSyxXQURMLENBQ2lCLCtFQURqQixFQURRO0FBR1IsVUFBRSxTQUFTLElBQVQsQ0FBRixDQUFpQixHQUFqQixDQUFxQixrQkFBckIsRUFIUTtBQUlSLG1CQUFXLElBQVgsQ0FBZ0IsSUFBaEIsQ0FBcUIsS0FBSyxRQUFMLEVBQWUsVUFBcEMsRUFKUTtBQUtSLG1CQUFXLGdCQUFYLENBQTRCLElBQTVCLEVBTFE7Ozs7V0FoVE47Ozs7OztBQVZPOztBQXNVYixlQUFhLFFBQWIsR0FBd0I7Ozs7OztBQU10QixrQkFBYyxLQUFkOzs7Ozs7QUFNQSxlQUFXLElBQVg7Ozs7OztBQU1BLGdCQUFZLEVBQVo7Ozs7OztBQU1BLGVBQVcsS0FBWDs7Ozs7OztBQU9BLGlCQUFhLEdBQWI7Ozs7OztBQU1BLGVBQVcsTUFBWDs7Ozs7O0FBTUEsa0JBQWMsSUFBZDs7Ozs7O0FBTUEsbUJBQWUsVUFBZjs7Ozs7O0FBTUEsZ0JBQVksYUFBWjs7Ozs7O0FBTUEsaUJBQWEsSUFBYjtHQTdERjs7O0FBdFVhLFlBdVliLENBQVcsTUFBWCxDQUFrQixZQUFsQixFQUFnQyxjQUFoQyxFQXZZYTtDQUFaLENBeVlDLE1BellELENBQUQ7Q0NGQTs7Ozs7O0FBRUEsQ0FBQyxVQUFTLENBQVQsRUFBWTs7Ozs7Ozs7Ozs7O01BWVA7Ozs7Ozs7OztBQVFKLGFBUkksY0FRSixDQUFZLE9BQVosRUFBcUIsT0FBckIsRUFBOEI7NEJBUjFCLGdCQVEwQjs7QUFDNUIsV0FBSyxRQUFMLEdBQWdCLEVBQUUsT0FBRixDQUFoQixDQUQ0QjtBQUU1QixXQUFLLEtBQUwsR0FBYSxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLGlCQUFuQixDQUFiLENBRjRCO0FBRzVCLFdBQUssU0FBTCxHQUFpQixJQUFqQixDQUg0QjtBQUk1QixXQUFLLGFBQUwsR0FBcUIsSUFBckIsQ0FKNEI7O0FBTTVCLFdBQUssS0FBTCxHQU40QjtBQU81QixXQUFLLE9BQUwsR0FQNEI7O0FBUzVCLGlCQUFXLGNBQVgsQ0FBMEIsSUFBMUIsRUFBZ0MsZ0JBQWhDLEVBVDRCO0tBQTlCOzs7Ozs7Ozs7aUJBUkk7OzhCQXlCSTtBQUNOLFlBQUksWUFBWSxFQUFaOzs7QUFERSxZQUlGLFFBQVEsS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixHQUFqQixDQUFSOzs7QUFKRSxhQU9ELElBQUksSUFBSSxDQUFKLEVBQU8sSUFBSSxNQUFNLE1BQU4sRUFBYyxHQUFsQyxFQUF1QztBQUNyQyxjQUFJLE9BQU8sTUFBTSxDQUFOLEVBQVMsS0FBVCxDQUFlLEdBQWYsQ0FBUCxDQURpQztBQUVyQyxjQUFJLFdBQVcsS0FBSyxNQUFMLEdBQWMsQ0FBZCxHQUFrQixLQUFLLENBQUwsQ0FBbEIsR0FBNEIsT0FBNUIsQ0FGc0I7QUFHckMsY0FBSSxhQUFhLEtBQUssTUFBTCxHQUFjLENBQWQsR0FBa0IsS0FBSyxDQUFMLENBQWxCLEdBQTRCLEtBQUssQ0FBTCxDQUE1QixDQUhvQjs7QUFLckMsY0FBSSxZQUFZLFVBQVosTUFBNEIsSUFBNUIsRUFBa0M7QUFDcEMsc0JBQVUsUUFBVixJQUFzQixZQUFZLFVBQVosQ0FBdEIsQ0FEb0M7V0FBdEM7U0FMRjs7QUFVQSxhQUFLLEtBQUwsR0FBYSxTQUFiLENBakJNOztBQW1CTixZQUFJLENBQUMsRUFBRSxhQUFGLENBQWdCLFNBQWhCLENBQUQsRUFBNkI7QUFDL0IsZUFBSyxrQkFBTCxHQUQrQjtTQUFqQzs7Ozs7Ozs7Ozs7Z0NBVVE7QUFDUixZQUFJLFFBQVEsSUFBUixDQURJOztBQUdSLFVBQUUsTUFBRixFQUFVLEVBQVYsQ0FBYSx1QkFBYixFQUFzQyxZQUFXO0FBQy9DLGdCQUFNLGtCQUFOLEdBRCtDO1NBQVgsQ0FBdEM7Ozs7QUFIUTs7Ozs7Ozs7OzsyQ0FnQlc7QUFDbkIsWUFBSSxTQUFKO1lBQWUsUUFBUSxJQUFSOztBQURJLFNBR25CLENBQUUsSUFBRixDQUFPLEtBQUssS0FBTCxFQUFZLFVBQVMsR0FBVCxFQUFjO0FBQy9CLGNBQUksV0FBVyxVQUFYLENBQXNCLE9BQXRCLENBQThCLEdBQTlCLENBQUosRUFBd0M7QUFDdEMsd0JBQVksR0FBWixDQURzQztXQUF4QztTQURpQixDQUFuQjs7O0FBSG1CLFlBVWYsQ0FBQyxTQUFELEVBQVksT0FBaEI7OztBQVZtQixZQWFmLEtBQUssYUFBTCxZQUE4QixLQUFLLEtBQUwsQ0FBVyxTQUFYLEVBQXNCLE1BQXRCLEVBQThCLE9BQWhFOzs7QUFibUIsU0FnQm5CLENBQUUsSUFBRixDQUFPLFdBQVAsRUFBb0IsVUFBUyxHQUFULEVBQWMsS0FBZCxFQUFxQjtBQUN2QyxnQkFBTSxRQUFOLENBQWUsV0FBZixDQUEyQixNQUFNLFFBQU4sQ0FBM0IsQ0FEdUM7U0FBckIsQ0FBcEI7OztBQWhCbUIsWUFxQm5CLENBQUssUUFBTCxDQUFjLFFBQWQsQ0FBdUIsS0FBSyxLQUFMLENBQVcsU0FBWCxFQUFzQixRQUF0QixDQUF2Qjs7O0FBckJtQixZQXdCZixLQUFLLGFBQUwsRUFBb0IsS0FBSyxhQUFMLENBQW1CLE9BQW5CLEdBQXhCO0FBQ0EsYUFBSyxhQUFMLEdBQXFCLElBQUksS0FBSyxLQUFMLENBQVcsU0FBWCxFQUFzQixNQUF0QixDQUE2QixLQUFLLFFBQUwsRUFBZSxFQUFoRCxDQUFyQixDQXpCbUI7Ozs7Ozs7Ozs7Z0NBZ0NYO0FBQ1IsYUFBSyxhQUFMLENBQW1CLE9BQW5CLEdBRFE7QUFFUixVQUFFLE1BQUYsRUFBVSxHQUFWLENBQWMsb0JBQWQsRUFGUTtBQUdSLG1CQUFXLGdCQUFYLENBQTRCLElBQTVCLEVBSFE7Ozs7V0F0R047TUFaTzs7QUF5SGIsaUJBQWUsUUFBZixHQUEwQixFQUExQjs7O0FBekhhLE1BNEhULGNBQWM7QUFDaEIsY0FBVTtBQUNSLGdCQUFVLFVBQVY7QUFDQSxjQUFRLFdBQVcsUUFBWCxDQUFvQixlQUFwQixLQUF3QyxJQUF4QztLQUZWO0FBSUQsZUFBVztBQUNSLGdCQUFVLFdBQVY7QUFDQSxjQUFRLFdBQVcsUUFBWCxDQUFvQixXQUFwQixLQUFvQyxJQUFwQztLQUZYO0FBSUMsZUFBVztBQUNULGdCQUFVLGdCQUFWO0FBQ0EsY0FBUSxXQUFXLFFBQVgsQ0FBb0IsZ0JBQXBCLEtBQXlDLElBQXpDO0tBRlY7R0FURTs7O0FBNUhTLFlBNEliLENBQVcsTUFBWCxDQUFrQixjQUFsQixFQUFrQyxnQkFBbEMsRUE1SWE7Q0FBWixDQThJQyxNQTlJRCxDQUFEO0NDRkE7Ozs7OztBQUVBLENBQUMsVUFBUyxDQUFULEVBQVk7Ozs7Ozs7O01BUVA7Ozs7Ozs7OztBQVFKLGFBUkksZ0JBUUosQ0FBWSxPQUFaLEVBQXFCLE9BQXJCLEVBQThCOzRCQVIxQixrQkFRMEI7O0FBQzVCLFdBQUssUUFBTCxHQUFnQixFQUFFLE9BQUYsQ0FBaEIsQ0FENEI7QUFFNUIsV0FBSyxPQUFMLEdBQWUsRUFBRSxNQUFGLENBQVMsRUFBVCxFQUFhLGlCQUFpQixRQUFqQixFQUEyQixLQUFLLFFBQUwsQ0FBYyxJQUFkLEVBQXhDLEVBQThELE9BQTlELENBQWYsQ0FGNEI7O0FBSTVCLFdBQUssS0FBTCxHQUo0QjtBQUs1QixXQUFLLE9BQUwsR0FMNEI7O0FBTzVCLGlCQUFXLGNBQVgsQ0FBMEIsSUFBMUIsRUFBZ0Msa0JBQWhDLEVBUDRCO0tBQTlCOzs7Ozs7Ozs7aUJBUkk7OzhCQXVCSTtBQUNOLFlBQUksV0FBVyxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLG1CQUFuQixDQUFYLENBREU7QUFFTixZQUFJLENBQUMsUUFBRCxFQUFXO0FBQ2Isa0JBQVEsS0FBUixDQUFjLGtFQUFkLEVBRGE7U0FBZjs7QUFJQSxhQUFLLFdBQUwsR0FBbUIsUUFBTSxRQUFOLENBQW5CLENBTk07QUFPTixhQUFLLFFBQUwsR0FBZ0IsS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixlQUFuQixDQUFoQixDQVBNOztBQVNOLGFBQUssT0FBTCxHQVRNOzs7Ozs7Ozs7OztnQ0FpQkU7QUFDUixZQUFJLFFBQVEsSUFBUixDQURJOztBQUdSLFVBQUUsTUFBRixFQUFVLEVBQVYsQ0FBYSx1QkFBYixFQUFzQyxLQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLElBQWxCLENBQXRDLEVBSFE7O0FBS1IsYUFBSyxRQUFMLENBQWMsRUFBZCxDQUFpQiwyQkFBakIsRUFBOEMsS0FBSyxVQUFMLENBQWdCLElBQWhCLENBQXFCLElBQXJCLENBQTlDLEVBTFE7Ozs7Ozs7Ozs7O2dDQWFBOztBQUVSLFlBQUksQ0FBQyxXQUFXLFVBQVgsQ0FBc0IsT0FBdEIsQ0FBOEIsS0FBSyxPQUFMLENBQWEsT0FBYixDQUEvQixFQUFzRDtBQUN4RCxlQUFLLFFBQUwsQ0FBYyxJQUFkLEdBRHdEO0FBRXhELGVBQUssV0FBTCxDQUFpQixJQUFqQixHQUZ3RDs7OztBQUExRCxhQU1LO0FBQ0gsaUJBQUssUUFBTCxDQUFjLElBQWQsR0FERztBQUVILGlCQUFLLFdBQUwsQ0FBaUIsSUFBakIsR0FGRztXQU5MOzs7Ozs7Ozs7OzttQ0FpQlc7QUFDWCxZQUFJLENBQUMsV0FBVyxVQUFYLENBQXNCLE9BQXRCLENBQThCLEtBQUssT0FBTCxDQUFhLE9BQWIsQ0FBL0IsRUFBc0Q7QUFDeEQsZUFBSyxXQUFMLENBQWlCLE1BQWpCLENBQXdCLENBQXhCOzs7Ozs7QUFEd0QsY0FPeEQsQ0FBSyxRQUFMLENBQWMsT0FBZCxDQUFzQiw2QkFBdEIsRUFQd0Q7U0FBMUQ7Ozs7Z0NBV1E7Ozs7O1dBcEZOO01BUk87O0FBaUdiLG1CQUFpQixRQUFqQixHQUE0Qjs7Ozs7O0FBTTFCLGFBQVMsUUFBVDtHQU5GOzs7QUFqR2EsWUEyR2IsQ0FBVyxNQUFYLENBQWtCLGdCQUFsQixFQUFvQyxrQkFBcEMsRUEzR2E7Q0FBWixDQTZHQyxNQTdHRCxDQUFEO0NDRkE7Ozs7OztBQUVBLENBQUMsVUFBUyxDQUFULEVBQVk7Ozs7Ozs7Ozs7OztNQVlQOzs7Ozs7OztBQU9KLGFBUEksTUFPSixDQUFZLE9BQVosRUFBcUIsT0FBckIsRUFBOEI7NEJBUDFCLFFBTzBCOztBQUM1QixXQUFLLFFBQUwsR0FBZ0IsT0FBaEIsQ0FENEI7QUFFNUIsV0FBSyxPQUFMLEdBQWUsRUFBRSxNQUFGLENBQVMsRUFBVCxFQUFhLE9BQU8sUUFBUCxFQUFpQixLQUFLLFFBQUwsQ0FBYyxJQUFkLEVBQTlCLEVBQW9ELE9BQXBELENBQWYsQ0FGNEI7QUFHNUIsV0FBSyxLQUFMLEdBSDRCOztBQUs1QixpQkFBVyxjQUFYLENBQTBCLElBQTFCLEVBQWdDLFFBQWhDLEVBTDRCO0FBTTVCLGlCQUFXLFFBQVgsQ0FBb0IsUUFBcEIsQ0FBNkIsUUFBN0IsRUFBdUM7QUFDckMsaUJBQVMsTUFBVDtBQUNBLGlCQUFTLE1BQVQ7QUFDQSxrQkFBVSxPQUFWO0FBQ0EsZUFBTyxhQUFQO0FBQ0EscUJBQWEsY0FBYjtPQUxGLEVBTjRCO0tBQTlCOzs7Ozs7OztpQkFQSTs7OEJBMEJJO0FBQ04sYUFBSyxFQUFMLEdBQVUsS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixJQUFuQixDQUFWLENBRE07QUFFTixhQUFLLFFBQUwsR0FBZ0IsS0FBaEIsQ0FGTTtBQUdOLGFBQUssTUFBTCxHQUFjLEVBQUMsSUFBSSxXQUFXLFVBQVgsQ0FBc0IsT0FBdEIsRUFBbkIsQ0FITTtBQUlOLGFBQUssS0FBTCxHQUFhLGFBQWIsQ0FKTTs7QUFNTixZQUFHLEtBQUssS0FBTCxFQUFXO0FBQUUsZUFBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixRQUF2QixFQUFGO1NBQWQ7O0FBRUEsYUFBSyxPQUFMLEdBQWUsbUJBQWlCLEtBQUssRUFBTCxPQUFqQixFQUE4QixNQUE5QixHQUF1QyxtQkFBaUIsS0FBSyxFQUFMLE9BQWpCLENBQXZDLEdBQXVFLHFCQUFtQixLQUFLLEVBQUwsT0FBbkIsQ0FBdkUsQ0FSVDs7QUFVTixZQUFJLEtBQUssT0FBTCxDQUFhLE1BQWIsRUFBcUI7QUFDdkIsY0FBSSxXQUFXLEtBQUssT0FBTCxDQUFhLENBQWIsRUFBZ0IsRUFBaEIsSUFBc0IsV0FBVyxXQUFYLENBQXVCLENBQXZCLEVBQTBCLFFBQTFCLENBQXRCLENBRFE7O0FBR3ZCLGVBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0I7QUFDaEIsNkJBQWlCLEtBQUssRUFBTDtBQUNqQixrQkFBTSxRQUFOO0FBQ0EsNkJBQWlCLElBQWpCO0FBQ0Esd0JBQVksQ0FBWjtXQUpGLEVBSHVCO0FBU3ZCLGVBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsRUFBQyxtQkFBbUIsUUFBbkIsRUFBcEIsRUFUdUI7U0FBekI7O0FBWUEsWUFBSSxLQUFLLE9BQUwsQ0FBYSxVQUFiLElBQTJCLEtBQUssUUFBTCxDQUFjLFFBQWQsQ0FBdUIsTUFBdkIsQ0FBM0IsRUFBMkQ7QUFDN0QsZUFBSyxPQUFMLENBQWEsVUFBYixHQUEwQixJQUExQixDQUQ2RDtBQUU3RCxlQUFLLE9BQUwsQ0FBYSxPQUFiLEdBQXVCLEtBQXZCLENBRjZEO1NBQS9EO0FBSUEsWUFBSSxLQUFLLE9BQUwsQ0FBYSxPQUFiLElBQXdCLENBQUMsS0FBSyxRQUFMLEVBQWU7QUFDMUMsZUFBSyxRQUFMLEdBQWdCLEtBQUssWUFBTCxDQUFrQixLQUFLLEVBQUwsQ0FBbEMsQ0FEMEM7U0FBNUM7O0FBSUEsYUFBSyxRQUFMLENBQWMsSUFBZCxDQUFtQjtBQUNmLGtCQUFRLFFBQVI7QUFDQSx5QkFBZSxJQUFmO0FBQ0EsMkJBQWlCLEtBQUssRUFBTDtBQUNqQix5QkFBZSxLQUFLLEVBQUw7U0FKbkIsRUE5Qk07O0FBcUNOLFlBQUcsS0FBSyxRQUFMLEVBQWU7QUFDaEIsZUFBSyxRQUFMLENBQWMsTUFBZCxHQUF1QixRQUF2QixDQUFnQyxLQUFLLFFBQUwsQ0FBaEMsQ0FEZ0I7U0FBbEIsTUFFTztBQUNMLGVBQUssUUFBTCxDQUFjLE1BQWQsR0FBdUIsUUFBdkIsQ0FBZ0MsRUFBRSxNQUFGLENBQWhDLEVBREs7QUFFTCxlQUFLLFFBQUwsQ0FBYyxRQUFkLENBQXVCLGlCQUF2QixFQUZLO1NBRlA7QUFNQSxhQUFLLE9BQUwsR0EzQ007QUE0Q04sWUFBSSxLQUFLLE9BQUwsQ0FBYSxRQUFiLElBQXlCLE9BQU8sUUFBUCxDQUFnQixJQUFoQixXQUErQixLQUFLLEVBQUwsRUFBWTtBQUN0RSxZQUFFLE1BQUYsRUFBVSxHQUFWLENBQWMsZ0JBQWQsRUFBZ0MsS0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLElBQWYsQ0FBaEMsRUFEc0U7U0FBeEU7Ozs7Ozs7Ozs7bUNBU1csSUFBSTtBQUNmLFlBQUksV0FBVyxFQUFFLGFBQUYsRUFDRSxRQURGLENBQ1csZ0JBRFgsRUFFRSxJQUZGLENBRU8sRUFBQyxZQUFZLENBQUMsQ0FBRCxFQUFJLGVBQWUsSUFBZixFQUZ4QixFQUdFLFFBSEYsQ0FHVyxNQUhYLENBQVgsQ0FEVztBQUtmLGVBQU8sUUFBUCxDQUxlOzs7Ozs7Ozs7Ozt3Q0FhQztBQUNoQixZQUFJLFFBQVEsS0FBSyxRQUFMLENBQWMsVUFBZCxFQUFSLENBRFk7QUFFaEIsWUFBSSxhQUFhLEVBQUUsTUFBRixFQUFVLEtBQVYsRUFBYixDQUZZO0FBR2hCLFlBQUksU0FBUyxLQUFLLFFBQUwsQ0FBYyxXQUFkLEVBQVQsQ0FIWTtBQUloQixZQUFJLGNBQWMsRUFBRSxNQUFGLEVBQVUsTUFBVixFQUFkLENBSlk7QUFLaEIsWUFBSSxPQUFPLFNBQVMsQ0FBQyxhQUFhLEtBQWIsQ0FBRCxHQUF1QixDQUF2QixFQUEwQixFQUFuQyxDQUFQLENBTFk7QUFNaEIsWUFBSSxHQUFKLENBTmdCO0FBT2hCLFlBQUksU0FBUyxXQUFULEVBQXNCO0FBQ3hCLGdCQUFNLFNBQVMsS0FBSyxHQUFMLENBQVMsR0FBVCxFQUFjLGNBQWMsRUFBZCxDQUF2QixFQUEwQyxFQUExQyxDQUFOLENBRHdCO1NBQTFCLE1BRU87QUFDTCxnQkFBTSxTQUFTLENBQUMsY0FBYyxNQUFkLENBQUQsR0FBeUIsQ0FBekIsRUFBNEIsRUFBckMsQ0FBTixDQURLO1NBRlA7QUFLQSxhQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLEVBQUMsS0FBSyxNQUFNLElBQU4sRUFBeEI7O0FBWmdCLFlBY2IsQ0FBQyxLQUFLLFFBQUwsRUFBZTtBQUNqQixlQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLEVBQUMsTUFBTSxPQUFPLElBQVAsRUFBekIsRUFEaUI7U0FBbkI7Ozs7Ozs7Ozs7Z0NBVVE7QUFDUixZQUFJLFFBQVEsSUFBUixDQURJOztBQUdSLGFBQUssUUFBTCxDQUFjLEVBQWQsQ0FBaUI7QUFDZiw2QkFBbUIsS0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLElBQWYsQ0FBbkI7QUFDQSw4QkFBb0IsS0FBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixJQUFoQixDQUFwQjtBQUNBLCtCQUFxQixLQUFLLE1BQUwsQ0FBWSxJQUFaLENBQWlCLElBQWpCLENBQXJCO0FBQ0EsaUNBQXVCLFlBQVc7QUFDaEMsa0JBQU0sZUFBTixHQURnQztXQUFYO1NBSnpCLEVBSFE7O0FBWVIsWUFBSSxLQUFLLE9BQUwsQ0FBYSxNQUFiLEVBQXFCO0FBQ3ZCLGVBQUssT0FBTCxDQUFhLEVBQWIsQ0FBZ0IsbUJBQWhCLEVBQXFDLFVBQVMsQ0FBVCxFQUFZO0FBQy9DLGdCQUFJLEVBQUUsS0FBRixLQUFZLEVBQVosSUFBa0IsRUFBRSxLQUFGLEtBQVksRUFBWixFQUFnQjtBQUNwQyxnQkFBRSxlQUFGLEdBRG9DO0FBRXBDLGdCQUFFLGNBQUYsR0FGb0M7QUFHcEMsb0JBQU0sSUFBTixHQUhvQzthQUF0QztXQURtQyxDQUFyQyxDQUR1QjtTQUF6Qjs7QUFVQSxZQUFJLEtBQUssT0FBTCxDQUFhLFlBQWIsSUFBNkIsS0FBSyxPQUFMLENBQWEsT0FBYixFQUFzQjtBQUNyRCxlQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLFlBQWxCLEVBQWdDLEVBQWhDLENBQW1DLGlCQUFuQyxFQUFzRCxVQUFTLENBQVQsRUFBWTtBQUNoRSxnQkFBSSxFQUFFLE1BQUYsS0FBYSxNQUFNLFFBQU4sQ0FBZSxDQUFmLENBQWIsSUFBa0MsRUFBRSxRQUFGLENBQVcsTUFBTSxRQUFOLENBQWUsQ0FBZixDQUFYLEVBQThCLEVBQUUsTUFBRixDQUFoRSxFQUEyRTtBQUFFLHFCQUFGO2FBQS9FO0FBQ0Esa0JBQU0sS0FBTixHQUZnRTtXQUFaLENBQXRELENBRHFEO1NBQXZEO0FBTUEsWUFBSSxLQUFLLE9BQUwsQ0FBYSxRQUFiLEVBQXVCO0FBQ3pCLFlBQUUsTUFBRixFQUFVLEVBQVYseUJBQW1DLEtBQUssRUFBTCxFQUFXLEtBQUssWUFBTCxDQUFrQixJQUFsQixDQUF1QixJQUF2QixDQUE5QyxFQUR5QjtTQUEzQjs7Ozs7Ozs7OzttQ0FTVyxHQUFHO0FBQ2QsWUFBRyxPQUFPLFFBQVAsQ0FBZ0IsSUFBaEIsS0FBMkIsTUFBTSxLQUFLLEVBQUwsSUFBWSxDQUFDLEtBQUssUUFBTCxFQUFjO0FBQUUsZUFBSyxJQUFMLEdBQUY7U0FBL0QsTUFDSTtBQUFFLGVBQUssS0FBTCxHQUFGO1NBREo7Ozs7Ozs7Ozs7Ozs2QkFXSzs7O0FBQ0wsWUFBSSxLQUFLLE9BQUwsQ0FBYSxRQUFiLEVBQXVCO0FBQ3pCLGNBQUksYUFBVyxLQUFLLEVBQUwsQ0FEVTs7QUFHekIsY0FBSSxPQUFPLE9BQVAsQ0FBZSxTQUFmLEVBQTBCO0FBQzVCLG1CQUFPLE9BQVAsQ0FBZSxTQUFmLENBQXlCLElBQXpCLEVBQStCLElBQS9CLEVBQXFDLElBQXJDLEVBRDRCO1dBQTlCLE1BRU87QUFDTCxtQkFBTyxRQUFQLENBQWdCLElBQWhCLEdBQXVCLElBQXZCLENBREs7V0FGUDtTQUhGOztBQVVBLGFBQUssUUFBTCxHQUFnQixJQUFoQjs7O0FBWEssWUFjTCxDQUFLLFFBQUwsQ0FDSyxHQURMLENBQ1MsRUFBRSxjQUFjLFFBQWQsRUFEWCxFQUVLLElBRkwsR0FHSyxTQUhMLENBR2UsQ0FIZixFQWRLO0FBa0JMLFlBQUksS0FBSyxPQUFMLENBQWEsT0FBYixFQUFzQjtBQUN4QixlQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLEVBQUMsY0FBYyxRQUFkLEVBQW5CLEVBQTRDLElBQTVDLEdBRHdCO1NBQTFCOztBQUlBLGFBQUssZUFBTCxHQXRCSzs7QUF3QkwsYUFBSyxRQUFMLENBQ0csSUFESCxHQUVHLEdBRkgsQ0FFTyxFQUFFLGNBQWMsRUFBZCxFQUZULEVBeEJLOztBQTRCTCxZQUFHLEtBQUssUUFBTCxFQUFlO0FBQ2hCLGVBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsRUFBQyxjQUFjLEVBQWQsRUFBbkIsRUFBc0MsSUFBdEMsR0FEZ0I7U0FBbEI7O0FBS0EsWUFBSSxDQUFDLEtBQUssT0FBTCxDQUFhLGNBQWIsRUFBNkI7Ozs7OztBQU1oQyxlQUFLLFFBQUwsQ0FBYyxPQUFkLENBQXNCLG1CQUF0QixFQUEyQyxLQUFLLEVBQUwsQ0FBM0MsQ0FOZ0M7U0FBbEM7OztBQWpDSyxZQTJDRCxLQUFLLE9BQUwsQ0FBYSxXQUFiLEVBQTBCO0FBQzVCLGNBQUksS0FBSyxPQUFMLENBQWEsT0FBYixFQUFzQjtBQUN4Qix1QkFBVyxNQUFYLENBQWtCLFNBQWxCLENBQTRCLEtBQUssUUFBTCxFQUFlLFNBQTNDLEVBRHdCO1dBQTFCO0FBR0EscUJBQVcsTUFBWCxDQUFrQixTQUFsQixDQUE0QixLQUFLLFFBQUwsRUFBZSxLQUFLLE9BQUwsQ0FBYSxXQUFiLEVBQTBCLFlBQVc7QUFDOUUsaUJBQUssaUJBQUwsR0FBeUIsV0FBVyxRQUFYLENBQW9CLGFBQXBCLENBQWtDLEtBQUssUUFBTCxDQUEzRCxDQUQ4RTtXQUFYLENBQXJFLENBSjRCOzs7QUFBOUIsYUFTSztBQUNILGdCQUFJLEtBQUssT0FBTCxDQUFhLE9BQWIsRUFBc0I7QUFDeEIsbUJBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsQ0FBbkIsRUFEd0I7YUFBMUI7QUFHQSxpQkFBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixLQUFLLE9BQUwsQ0FBYSxTQUFiLENBQW5CLENBSkc7V0FUTDs7O0FBM0NLLFlBNERMLENBQUssUUFBTCxDQUNHLElBREgsQ0FDUTtBQUNKLHlCQUFlLEtBQWY7QUFDQSxzQkFBWSxDQUFDLENBQUQ7U0FIaEIsRUFLRyxLQUxIOzs7Ozs7QUE1REssWUF1RUwsQ0FBSyxRQUFMLENBQWMsT0FBZCxDQUFzQixnQkFBdEIsRUF2RUs7O0FBeUVMLFlBQUksS0FBSyxLQUFMLEVBQVk7QUFDZCxjQUFJLFlBQVksT0FBTyxXQUFQLENBREY7QUFFZCxZQUFFLFlBQUYsRUFBZ0IsUUFBaEIsQ0FBeUIsZ0JBQXpCLEVBQTJDLFNBQTNDLENBQXFELFNBQXJELEVBRmM7U0FBaEIsTUFJSztBQUNILFlBQUUsTUFBRixFQUFVLFFBQVYsQ0FBbUIsZ0JBQW5CLEVBREc7U0FKTDs7QUFRQSxVQUFFLE1BQUYsRUFDRyxRQURILENBQ1ksZ0JBRFosRUFFRyxJQUZILENBRVEsYUFGUixFQUV1QixJQUFDLENBQUssT0FBTCxDQUFhLE9BQWIsSUFBd0IsS0FBSyxPQUFMLENBQWEsVUFBYixHQUEyQixJQUFwRCxHQUEyRCxLQUEzRCxDQUZ2QixDQWpGSzs7QUFxRkwsbUJBQVcsWUFBTTtBQUNmLGlCQUFLLGNBQUwsR0FEZTtTQUFOLEVBRVIsQ0FGSCxFQXJGSzs7Ozs7Ozs7Ozt1Q0E4RlU7QUFDZixZQUFJLFFBQVEsSUFBUixDQURXO0FBRWYsYUFBSyxpQkFBTCxHQUF5QixXQUFXLFFBQVgsQ0FBb0IsYUFBcEIsQ0FBa0MsS0FBSyxRQUFMLENBQTNELENBRmU7O0FBSWYsWUFBSSxDQUFDLEtBQUssT0FBTCxDQUFhLE9BQWIsSUFBd0IsS0FBSyxPQUFMLENBQWEsWUFBYixJQUE2QixDQUFDLEtBQUssT0FBTCxDQUFhLFVBQWIsRUFBeUI7QUFDbEYsWUFBRSxNQUFGLEVBQVUsRUFBVixDQUFhLGlCQUFiLEVBQWdDLFVBQVMsQ0FBVCxFQUFZO0FBQzFDLGdCQUFJLEVBQUUsTUFBRixLQUFhLE1BQU0sUUFBTixDQUFlLENBQWYsQ0FBYixJQUFrQyxFQUFFLFFBQUYsQ0FBVyxNQUFNLFFBQU4sQ0FBZSxDQUFmLENBQVgsRUFBOEIsRUFBRSxNQUFGLENBQWhFLEVBQTJFO0FBQUUscUJBQUY7YUFBL0U7QUFDQSxrQkFBTSxLQUFOLEdBRjBDO1dBQVosQ0FBaEMsQ0FEa0Y7U0FBcEY7O0FBT0EsWUFBSSxLQUFLLE9BQUwsQ0FBYSxVQUFiLEVBQXlCO0FBQzNCLFlBQUUsTUFBRixFQUFVLEVBQVYsQ0FBYSxtQkFBYixFQUFrQyxVQUFTLENBQVQsRUFBWTtBQUM1Qyx1QkFBVyxRQUFYLENBQW9CLFNBQXBCLENBQThCLENBQTlCLEVBQWlDLFFBQWpDLEVBQTJDO0FBQ3pDLHFCQUFPLFlBQVc7QUFDaEIsb0JBQUksTUFBTSxPQUFOLENBQWMsVUFBZCxFQUEwQjtBQUM1Qix3QkFBTSxLQUFOLEdBRDRCO0FBRTVCLHdCQUFNLE9BQU4sQ0FBYyxLQUFkLEdBRjRCO2lCQUE5QjtlQURLO2FBRFQsRUFENEM7QUFTNUMsZ0JBQUksTUFBTSxpQkFBTixDQUF3QixNQUF4QixLQUFtQyxDQUFuQyxFQUFzQzs7QUFDeEMsZ0JBQUUsY0FBRixHQUR3QzthQUExQztXQVRnQyxDQUFsQyxDQUQyQjtTQUE3Qjs7O0FBWGUsWUE0QmYsQ0FBSyxRQUFMLENBQWMsRUFBZCxDQUFpQixtQkFBakIsRUFBc0MsVUFBUyxDQUFULEVBQVk7QUFDaEQsY0FBSSxVQUFVLEVBQUUsSUFBRixDQUFWOztBQUQ0QyxvQkFHaEQsQ0FBVyxRQUFYLENBQW9CLFNBQXBCLENBQThCLENBQTlCLEVBQWlDLFFBQWpDLEVBQTJDO0FBQ3pDLHlCQUFhLFlBQVc7QUFDdEIsa0JBQUksTUFBTSxRQUFOLENBQWUsSUFBZixDQUFvQixRQUFwQixFQUE4QixFQUE5QixDQUFpQyxNQUFNLGlCQUFOLENBQXdCLEVBQXhCLENBQTJCLENBQUMsQ0FBRCxDQUE1RCxDQUFKLEVBQXNFOztBQUNwRSxzQkFBTSxpQkFBTixDQUF3QixFQUF4QixDQUEyQixDQUEzQixFQUE4QixLQUE5QixHQURvRTtBQUVwRSxrQkFBRSxjQUFGLEdBRm9FO2VBQXRFO2FBRFc7QUFNYiwwQkFBYyxZQUFXO0FBQ3ZCLGtCQUFJLE1BQU0sUUFBTixDQUFlLElBQWYsQ0FBb0IsUUFBcEIsRUFBOEIsRUFBOUIsQ0FBaUMsTUFBTSxpQkFBTixDQUF3QixFQUF4QixDQUEyQixDQUEzQixDQUFqQyxLQUFtRSxNQUFNLFFBQU4sQ0FBZSxFQUFmLENBQWtCLFFBQWxCLENBQW5FLEVBQWdHOztBQUNsRyxzQkFBTSxpQkFBTixDQUF3QixFQUF4QixDQUEyQixDQUFDLENBQUQsQ0FBM0IsQ0FBK0IsS0FBL0IsR0FEa0c7QUFFbEcsa0JBQUUsY0FBRixHQUZrRztlQUFwRzthQURZO0FBTWQsa0JBQU0sWUFBVztBQUNmLGtCQUFJLE1BQU0sUUFBTixDQUFlLElBQWYsQ0FBb0IsUUFBcEIsRUFBOEIsRUFBOUIsQ0FBaUMsTUFBTSxRQUFOLENBQWUsSUFBZixDQUFvQixjQUFwQixDQUFqQyxDQUFKLEVBQTJFO0FBQ3pFLDJCQUFXLFlBQVc7O0FBQ3BCLHdCQUFNLE9BQU4sQ0FBYyxLQUFkLEdBRG9CO2lCQUFYLEVBRVIsQ0FGSCxFQUR5RTtlQUEzRSxNQUlPLElBQUksUUFBUSxFQUFSLENBQVcsTUFBTSxpQkFBTixDQUFmLEVBQXlDOztBQUM5QyxzQkFBTSxJQUFOLEdBRDhDO2VBQXpDO2FBTEg7QUFTTixtQkFBTyxZQUFXO0FBQ2hCLGtCQUFJLE1BQU0sT0FBTixDQUFjLFVBQWQsRUFBMEI7QUFDNUIsc0JBQU0sS0FBTixHQUQ0QjtBQUU1QixzQkFBTSxPQUFOLENBQWMsS0FBZCxHQUY0QjtlQUE5QjthQURLO1dBdEJULEVBSGdEO1NBQVosQ0FBdEMsQ0E1QmU7Ozs7Ozs7Ozs7OzhCQW9FVDtBQUNOLFlBQUksQ0FBQyxLQUFLLFFBQUwsSUFBaUIsQ0FBQyxLQUFLLFFBQUwsQ0FBYyxFQUFkLENBQWlCLFVBQWpCLENBQUQsRUFBK0I7QUFDbkQsaUJBQU8sS0FBUCxDQURtRDtTQUFyRDtBQUdBLFlBQUksUUFBUSxJQUFSOzs7QUFKRSxZQU9GLEtBQUssT0FBTCxDQUFhLFlBQWIsRUFBMkI7QUFDN0IsY0FBSSxLQUFLLE9BQUwsQ0FBYSxPQUFiLEVBQXNCO0FBQ3hCLHVCQUFXLE1BQVgsQ0FBa0IsVUFBbEIsQ0FBNkIsS0FBSyxRQUFMLEVBQWUsVUFBNUMsRUFBd0QsUUFBeEQsRUFEd0I7V0FBMUIsTUFHSztBQUNILHVCQURHO1dBSEw7O0FBT0EscUJBQVcsTUFBWCxDQUFrQixVQUFsQixDQUE2QixLQUFLLFFBQUwsRUFBZSxLQUFLLE9BQUwsQ0FBYSxZQUFiLENBQTVDLENBUjZCOzs7QUFBL0IsYUFXSztBQUNILGdCQUFJLEtBQUssT0FBTCxDQUFhLE9BQWIsRUFBc0I7QUFDeEIsbUJBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsQ0FBbkIsRUFBc0IsUUFBdEIsRUFEd0I7YUFBMUIsTUFHSztBQUNILHlCQURHO2FBSEw7O0FBT0EsaUJBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsS0FBSyxPQUFMLENBQWEsU0FBYixDQUFuQixDQVJHO1dBWEw7OztBQVBNLFlBOEJGLEtBQUssT0FBTCxDQUFhLFVBQWIsRUFBeUI7QUFDM0IsWUFBRSxNQUFGLEVBQVUsR0FBVixDQUFjLG1CQUFkLEVBRDJCO1NBQTdCOztBQUlBLFlBQUksQ0FBQyxLQUFLLE9BQUwsQ0FBYSxPQUFiLElBQXdCLEtBQUssT0FBTCxDQUFhLFlBQWIsRUFBMkI7QUFDdEQsWUFBRSxNQUFGLEVBQVUsR0FBVixDQUFjLGlCQUFkLEVBRHNEO1NBQXhEOztBQUlBLGFBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsbUJBQWxCLEVBdENNOztBQXdDTixpQkFBUyxRQUFULEdBQW9CO0FBQ2xCLGNBQUksTUFBTSxLQUFOLEVBQWE7QUFDZixjQUFFLFlBQUYsRUFBZ0IsV0FBaEIsQ0FBNEIsZ0JBQTVCLEVBRGU7V0FBakIsTUFHSztBQUNILGNBQUUsTUFBRixFQUFVLFdBQVYsQ0FBc0IsZ0JBQXRCLEVBREc7V0FITDs7QUFPQSxZQUFFLE1BQUYsRUFBVSxJQUFWLENBQWU7QUFDYiwyQkFBZSxLQUFmO0FBQ0Esd0JBQVksRUFBWjtXQUZGLEVBUmtCOztBQWFsQixnQkFBTSxRQUFOLENBQWUsSUFBZixDQUFvQixhQUFwQixFQUFtQyxJQUFuQzs7Ozs7O0FBYmtCLGVBbUJsQixDQUFNLFFBQU4sQ0FBZSxPQUFmLENBQXVCLGtCQUF2QixFQW5Ca0I7U0FBcEI7Ozs7OztBQXhDTSxZQWtFRixLQUFLLE9BQUwsQ0FBYSxZQUFiLEVBQTJCO0FBQzdCLGVBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsS0FBSyxRQUFMLENBQWMsSUFBZCxFQUFuQixFQUQ2QjtTQUEvQjs7QUFJQSxhQUFLLFFBQUwsR0FBZ0IsS0FBaEIsQ0F0RU07QUF1RUwsWUFBSSxNQUFNLE9BQU4sQ0FBYyxRQUFkLEVBQXdCO0FBQzFCLGNBQUksT0FBTyxPQUFQLENBQWUsWUFBZixFQUE2QjtBQUMvQixtQkFBTyxPQUFQLENBQWUsWUFBZixDQUE0QixFQUE1QixFQUFnQyxTQUFTLEtBQVQsRUFBZ0IsT0FBTyxRQUFQLENBQWdCLFFBQWhCLENBQWhELENBRCtCO1dBQWpDLE1BRU87QUFDTCxtQkFBTyxRQUFQLENBQWdCLElBQWhCLEdBQXVCLEVBQXZCLENBREs7V0FGUDtTQURGOzs7Ozs7Ozs7OytCQWFNO0FBQ1AsWUFBSSxLQUFLLFFBQUwsRUFBZTtBQUNqQixlQUFLLEtBQUwsR0FEaUI7U0FBbkIsTUFFTztBQUNMLGVBQUssSUFBTCxHQURLO1NBRlA7Ozs7Ozs7Ozs7Z0NBV1E7QUFDUixZQUFJLEtBQUssT0FBTCxDQUFhLE9BQWIsRUFBc0I7QUFDeEIsZUFBSyxRQUFMLENBQWMsSUFBZCxHQUFxQixHQUFyQixHQUEyQixNQUEzQixHQUR3QjtTQUExQjtBQUdBLGFBQUssUUFBTCxDQUFjLElBQWQsR0FBcUIsR0FBckIsR0FKUTtBQUtSLGFBQUssT0FBTCxDQUFhLEdBQWIsQ0FBaUIsS0FBakIsRUFMUTtBQU1SLFVBQUUsTUFBRixFQUFVLEdBQVYsaUJBQTRCLEtBQUssRUFBTCxDQUE1QixDQU5ROztBQVFSLG1CQUFXLGdCQUFYLENBQTRCLElBQTVCLEVBUlE7Ozs7V0F2YU47TUFaTzs7QUErYmIsU0FBTyxRQUFQLEdBQWtCOzs7Ozs7QUFNaEIsaUJBQWEsRUFBYjs7Ozs7O0FBTUEsa0JBQWMsRUFBZDs7Ozs7O0FBTUEsZUFBVyxDQUFYOzs7Ozs7QUFNQSxlQUFXLENBQVg7Ozs7OztBQU1BLGtCQUFjLElBQWQ7Ozs7OztBQU1BLGdCQUFZLElBQVo7Ozs7OztBQU1BLG9CQUFnQixLQUFoQjs7Ozs7O0FBTUEsYUFBUyxHQUFUOzs7Ozs7QUFNQSxhQUFTLENBQVQ7Ozs7OztBQU1BLGdCQUFZLEtBQVo7Ozs7OztBQU1BLGtCQUFjLEVBQWQ7Ozs7OztBQU1BLGFBQVMsSUFBVDs7Ozs7O0FBTUEsa0JBQWMsS0FBZDs7Ozs7O0FBTUEsY0FBVSxLQUFWO0dBcEZGOzs7QUEvYmEsWUF1aEJiLENBQVcsTUFBWCxDQUFrQixNQUFsQixFQUEwQixRQUExQixFQXZoQmE7O0FBeWhCYixXQUFTLFdBQVQsR0FBdUI7QUFDckIsV0FBTyxzQkFBcUIsSUFBckIsQ0FBMEIsT0FBTyxTQUFQLENBQWlCLFNBQWpCLENBQWpDO01BRHFCO0dBQXZCO0NBemhCQyxDQTZoQkMsTUE3aEJELENBQUQ7Ozs7Ozs7Ozs7Ozs7QUNRQSxDQUFDLFVBQVUsQ0FBVixFQUFhO0FBQ1YsaUJBRFU7O0FBR1YsUUFBSSxXQUFXO0FBQ1gsZUFBb0IsQ0FBcEI7QUFDQSxlQUFvQixJQUFwQjtBQUNBLGlCQUFvQixLQUFwQjtBQUNBLHNCQUFvQixLQUFwQjtBQUNBLHNCQUFvQixLQUFwQjtBQUNBLGVBQW9CLElBQXBCO0FBQ0EsaUJBQW9CLEtBQXBCO0FBQ0Esa0JBQW9CLElBQXBCO0FBQ0EsaUJBQW9CLEtBQXBCO0FBQ0EsZUFBb0IsSUFBcEI7QUFDQSxlQUFvQixJQUFwQjtBQUNBLGVBQW9CLFFBQXBCO0FBQ0EsZ0JBQW9CLFFBQXBCO0FBQ0Esb0JBQW9CLE1BQXBCO0FBQ0EsNEJBQW9CLElBQXBCO0FBQ0EsNEJBQW9CLEVBQXBCO0FBQ0EsbUJBQW9CLElBQXBCO0FBQ0EsMkJBQW9CLE1BQXBCO0FBQ0EsMkJBQW9CLEVBQXBCO0FBQ0EsY0FBTyxZQUFZLEVBQVo7QUFDUCxjQUFPLFlBQVksRUFBWjtBQUNQLGVBQU8sWUFBWSxFQUFaO0FBQ1AsY0FBTyxZQUFZLEVBQVo7QUFDUCxnQkFBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7O1NBQVI7S0F4QkEsQ0FITTs7QUFnRFYsUUFBSSxhQUFhLEVBQWIsQ0FoRE07O0FBa0RWLFFBQUksUUFBUSxVQUFVLElBQVYsRUFBZ0IsT0FBaEIsRUFBeUI7QUFDakMsYUFBSyxJQUFMLEdBQW9CLElBQXBCLENBRGlDO0FBRWpDLGFBQUssUUFBTCxHQUFvQixFQUFFLE1BQUYsQ0FBUyxFQUFULEVBQWEsUUFBYixFQUF1QixFQUFFLEtBQUYsQ0FBUSxRQUFSLEVBQWtCLE9BQXpDLENBQXBCLENBRmlDO0FBR2pDLGFBQUssS0FBTCxHQUFvQixLQUFLLFFBQUwsQ0FBYyxLQUFkLENBSGE7QUFJakMsYUFBSyxLQUFMLEdBQW9CLEtBQUssUUFBTCxDQUFjLE1BQWQsQ0FBcUIsTUFBckIsQ0FKYTtBQUtqQyxhQUFLLE1BQUwsR0FBb0IsS0FBSyxLQUFMLEdBQWEsQ0FBYixDQUxhO0FBTWpDLGFBQUssTUFBTCxHQUFvQixDQUFDLEtBQUssUUFBTCxDQUFjLFFBQWQsSUFBMEIsS0FBSyxNQUFMLENBTmQ7QUFPakMsYUFBSyxLQUFMLEdBQW9CLEVBQUUsSUFBRixDQUFwQixDQVBpQztBQVFqQyxhQUFLLE1BQUwsR0FBb0IsSUFBcEIsQ0FSaUM7QUFTakMsYUFBSyxRQUFMLEdBQW9CLElBQXBCLENBVGlDO0FBVWpDLGFBQUssTUFBTCxHQUFvQixJQUFwQixDQVZpQztBQVdqQyxhQUFLLE9BQUwsR0FBb0IsSUFBcEIsQ0FYaUM7O0FBYWpDLGFBQUssV0FBTCxHQUFtQixDQUNmLE1BRGUsRUFDUCxPQURPLEVBRWYsTUFGZSxFQUVQLE9BRk8sRUFHZixPQUhlLEVBR04sUUFITSxFQUlmLFVBSmUsRUFJSCxXQUpHLEVBS2YsTUFMZSxFQUtQLE9BTE8sRUFNZixXQU5lLEVBTUYsWUFORSxFQU9mLFlBUGUsRUFPRCxhQVBDLEVBUWYsU0FSZSxFQVFKLFVBUkksRUFTZixXQVRlLEVBU0YsWUFURSxFQVVmLFFBVmUsRUFVTCxTQVZLLEVBV2YsU0FYZSxFQVdKLFVBWEksRUFZZixXQVplLEVBWUYsWUFaRSxFQWFmLFlBYmUsRUFhRCxhQWJDLENBQW5CLENBYmlDOztBQTZCakMsYUFBSyxVQUFMLEdBQWtCLENBQ2QsVUFEYyxFQUVkLGNBRmMsRUFFRSxlQUZGLEVBR2QsWUFIYyxFQUdBLGdCQUhBLEVBR2tCLGlCQUhsQixFQUlkLGNBSmMsRUFJRSxrQkFKRixFQUlzQixtQkFKdEIsQ0FBbEIsQ0E3QmlDOztBQW9DakMsWUFBSSxLQUFLLFFBQUwsQ0FBYyxrQkFBZCxZQUE0QyxLQUE1QyxLQUFzRCxLQUF0RCxFQUE2RDtBQUM3RCxpQkFBSyxRQUFMLENBQWMsa0JBQWQsR0FBbUMsQ0FBRSxLQUFLLFFBQUwsQ0FBYyxrQkFBZCxDQUFyQyxDQUQ2RDtTQUFqRTs7QUFJQSxZQUFJLEtBQUssUUFBTCxDQUFjLGlCQUFkLFlBQTJDLEtBQTNDLEtBQXFELEtBQXJELEVBQTREO0FBQzVELGlCQUFLLFFBQUwsQ0FBYyxpQkFBZCxHQUFrQyxDQUFFLEtBQUssUUFBTCxDQUFjLGlCQUFkLENBQXBDLENBRDREO1NBQWhFOztBQUlBLGFBQUssV0FBTCxHQUFtQixLQUFLLFdBQUwsQ0FBaUIsTUFBakIsQ0FBd0IsS0FBSyxRQUFMLENBQWMsa0JBQWQsQ0FBM0MsQ0E1Q2lDO0FBNkNqQyxhQUFLLFVBQUwsR0FBbUIsS0FBSyxVQUFMLENBQWdCLE1BQWhCLENBQXVCLEtBQUssUUFBTCxDQUFjLGlCQUFkLENBQTFDLENBN0NpQzs7QUErQ2pDLGFBQUssT0FBTCxHQUFlO0FBQ1gsdUJBQVksZUFBZ0IsU0FBUyxJQUFULENBQWMsS0FBZDtBQUM1Qix3QkFBWSxnQkFBZ0IsU0FBUyxJQUFULENBQWMsS0FBZCxJQUF1QixzQkFBc0IsU0FBUyxJQUFULENBQWMsS0FBZDtBQUN6RSxtQkFBWSxFQUFFLEtBQUYsQ0FBUSxpQkFBUixFQUFaO1NBSEosQ0EvQ2lDOztBQXFEakMsWUFBSSxLQUFLLFFBQUwsQ0FBYyxPQUFkLEtBQTBCLElBQTFCLEVBQWdDO0FBQ2hDLGlCQUFLLE9BQUwsR0FEZ0M7U0FBcEM7O0FBSUEsYUFBSyxLQUFMLEdBekRpQztLQUF6QixDQWxERjs7QUE4R1YsVUFBTSxTQUFOLEdBQWtCO0FBQ2QsZUFBTyxZQUFZO0FBQ2YsZ0JBQUksUUFBSjtnQkFDSSxRQURKO2dCQUVJLE1BRko7Z0JBR0ksU0FBVSxLQUFLLElBQUwsQ0FBVSxPQUFWLEtBQXNCLE1BQXRCO2dCQUNWLFFBQVUsS0FBSyxRQUFMLENBQWMsS0FBZDtnQkFDVixVQUFVLEtBQUssUUFBTCxDQUFjLE9BQWQ7Z0JBQ1YsT0FBVSxJQUFWOzs7QUFQVyxnQkFVZixDQUFLLFFBQUw7OztBQVZlLGdCQWFYLENBQUMsTUFBRCxFQUFTO0FBQ1QscUJBQUssS0FBTCxDQUFXLEdBQVgsQ0FBZSxRQUFmLEVBQXlCLEtBQUssS0FBTCxDQUFXLEdBQVgsQ0FBZSxRQUFmLENBQXpCLEVBRFM7O0FBR1QsMkJBQVcsRUFBRSw2QkFBRixFQUNOLEdBRE0sQ0FDRixVQURFLEVBQ1UsS0FBSyxLQUFMLENBQVcsR0FBWCxDQUFlLFVBQWYsQ0FEVixFQUVOLEdBRk0sQ0FFRixTQUZFLEVBRVUsS0FBSyxLQUFMLENBQVcsR0FBWCxDQUFlLFNBQWYsQ0FGVixDQUFYOzs7QUFIUyxvQkFRTCxDQUFDLEtBQUssS0FBTCxDQUFXLEdBQVgsQ0FBZSxTQUFmLENBQUQsRUFBNEI7QUFDNUIsNkJBQ0ssR0FETCxDQUNTLGFBRFQsRUFDMkIsS0FBSyxLQUFMLENBQVcsR0FBWCxDQUFlLGFBQWYsQ0FEM0IsRUFFSyxHQUZMLENBRVMsZ0JBRlQsRUFFMkIsS0FBSyxLQUFMLENBQVcsR0FBWCxDQUFlLGdCQUFmLENBRjNCLEVBR0ssR0FITCxDQUdTLGNBSFQsRUFHMkIsS0FBSyxLQUFMLENBQVcsR0FBWCxDQUFlLGNBQWYsQ0FIM0IsRUFJSyxHQUpMLENBSVMsZUFKVCxFQUkyQixLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWUsZUFBZixDQUozQixFQUQ0QjtpQkFBaEM7O0FBUUEscUJBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsSUFBakIsRUFBdUIsUUFBdkIsR0FBa0MsUUFBbEMsQ0FBMkMsUUFBM0MsRUFoQlM7QUFpQlQscUJBQUssSUFBTCxDQUFVLFNBQVYsR0FBc0IsRUFBdEIsQ0FqQlM7YUFBYjs7O0FBYmUsZ0JBa0NYLFNBQVMsS0FBSyxPQUFMLENBQWEsVUFBYixFQUF5QjtBQUNsQyx5QkFBUyxFQUFFLDZEQUFGLENBQVQsQ0FEa0M7QUFFbEMscUJBQUssTUFBTCxHQUFjLE1BQWQsQ0FGa0M7QUFHbEMscUJBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsTUFBbkIsRUFIa0M7YUFBdEM7OztBQWxDZSxnQkF5Q1gsT0FBSixFQUFhO0FBQ1QsMkJBQVcsRUFBRSw2QkFBRixDQUFYLENBRFM7O0FBR1Qsb0JBQUksT0FBTyxPQUFQLEtBQW1CLFFBQW5CLEVBQTZCO0FBQzdCLDZCQUFTLEdBQVQsQ0FBYSxrQkFBYixFQUFpQyxTQUFTLE9BQVQsR0FBbUIsR0FBbkIsQ0FBakMsQ0FENkI7aUJBQWpDOztBQUlBLHFCQUFLLFFBQUwsR0FBZ0IsUUFBaEIsQ0FQUztBQVFULHFCQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLFFBQW5CLEVBUlM7YUFBYjs7O0FBekNlLGdCQXFEZixDQUFLLEtBQUwsQ0FBVyxRQUFYLENBQW9CLGlCQUFwQixFQXJEZTs7QUF1RGYsZ0JBQUksQ0FBQyxNQUFELEVBQVM7QUFDVCxxQkFBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixRQUFsQixFQURTO2FBQWI7O0FBSUEsdUJBQVcsWUFBWTtBQUNuQixxQkFBSyxPQUFMLENBQWEsTUFBYixFQURtQjtBQUVuQixxQkFBSyxLQUFMLENBQVcsS0FBSyxLQUFMLENBQVgsQ0FGbUI7O0FBSW5CLG9CQUFJLEtBQUssUUFBTCxDQUFjLFFBQWQsRUFBd0I7QUFDeEIseUJBQUssT0FBTCxDQUFhLE1BQWIsRUFEd0I7aUJBQTVCO2FBSk8sRUFPUixDQVBILEVBM0RlO1NBQVo7O0FBcUVQLGtCQUFVLFlBQVk7QUFDbEIsZ0JBQUksR0FBSixFQUFTLENBQVQsQ0FEa0I7O0FBR2xCLGlCQUFLLElBQUksQ0FBSixFQUFPLElBQUksS0FBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixNQUFyQixFQUE2QixHQUE3QyxFQUFrRDtBQUM5QyxvQkFBSSxLQUFLLFFBQUwsQ0FBYyxPQUFkLElBQXlCLEtBQUssUUFBTCxDQUFjLGFBQWQsRUFBNkI7QUFDdEQsd0JBQUksS0FBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixDQUFyQixFQUF3QixHQUF4QixFQUE2QjtBQUM3Qiw4QkFBTSxJQUFJLEtBQUosRUFBTixDQUQ2QjtBQUU3Qiw0QkFBSSxHQUFKLEdBQVUsS0FBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixDQUFyQixFQUF3QixHQUF4QixDQUZtQjtxQkFBakM7aUJBREo7O0FBT0Esb0JBQUksS0FBSyxRQUFMLENBQWMsT0FBZCxJQUF5QixLQUFLLFFBQUwsQ0FBYyxhQUFkLEVBQTZCO0FBQ3RELHdCQUFJLEtBQUssT0FBTCxDQUFhLEtBQWIsSUFBc0IsS0FBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixDQUFyQixFQUF3QixLQUF4QixFQUErQjtBQUNyRCw0QkFBSSxLQUFLLFFBQUwsQ0FBYyxNQUFkLENBQXFCLENBQXJCLEVBQXdCLEtBQXhCLFlBQXlDLEtBQXpDLEVBQWdEO0FBQ2hELGlDQUFLLE1BQUwsQ0FBWSxLQUFLLFFBQUwsQ0FBYyxNQUFkLENBQXFCLENBQXJCLEVBQXdCLEtBQXhCLENBQVosQ0FEZ0Q7eUJBQXBELE1BRU87QUFDSCxpQ0FBSyxNQUFMLENBQVksS0FBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixDQUFyQixFQUF3QixLQUF4QixDQUE4QixHQUE5QixDQUFaLENBREc7eUJBRlA7cUJBREo7aUJBREo7YUFSSjtTQUhNOztBQXVCVixpQkFBUyxVQUFVLEtBQVYsRUFBaUI7QUFDdEIsbUJBQU8sTUFBTSxLQUFLLEtBQUwsQ0FBVyxLQUFLLE1BQUwsTUFBaUIsTUFBTSxNQUFOLEdBQWUsQ0FBZixDQUFqQixDQUFqQixDQUFQLENBRHNCO1NBQWpCOztBQUlULG9CQUFZLFlBQVk7QUFDcEIsZ0JBQUksT0FBTyxJQUFQLENBRGdCOztBQUdwQixnQkFBSSxLQUFLLEtBQUwsR0FBYSxDQUFiLElBQWtCLENBQUMsS0FBSyxNQUFMLElBQWUsQ0FBQyxLQUFLLE1BQUwsRUFBYTtBQUNoRCxxQkFBSyxPQUFMLEdBQWUsV0FBVyxZQUFZO0FBQ2xDLHlCQUFLLElBQUwsR0FEa0M7aUJBQVosRUFFdkIsS0FBSyxRQUFMLENBQWMsT0FBZCxDQUZZLENBQWYsQ0FEZ0Q7YUFBcEQ7U0FIUTs7QUFVWixnQkFBUSxVQUFVLEtBQVYsRUFBaUI7QUFDckIsZ0JBQUksT0FBTyxJQUFQLENBRGlCOztBQUdyQix5QkFBYSxLQUFLLE9BQUwsQ0FBYixDQUhxQjs7QUFLckIsZ0JBQUksQ0FBQyxLQUFLLE1BQUwsRUFBYTtBQUNkLHVCQURjO2FBQWxCOztBQUlBLGlCQUFLLE1BQUwsQ0FDSyxXQURMLENBQ2lCLHFCQURqQixFQUVTLElBRlQsQ0FFYyxLQUZkLEVBR2EsR0FIYixDQUdpQixxQkFIakIsRUFHd0MsS0FIeEMsRUFUcUI7O0FBY3JCLGdCQUFJLEtBQUssTUFBTCxJQUFlLEtBQUssTUFBTCxFQUFhO0FBQzVCLHVCQUQ0QjthQUFoQzs7QUFJQSxnQkFBSSxLQUFKLEVBQVc7QUFDUCwyQkFBVyxZQUFZO0FBQ3BCLHlCQUFLLE1BQUwsQ0FDRSxRQURGLENBQ1cscUJBRFgsRUFFTSxJQUZOLENBRVcsS0FGWCxFQUdVLEdBSFYsQ0FHYyxxQkFIZCxFQUdxQyxLQUFLLFFBQUwsQ0FBYyxPQUFkLElBQXlCLEdBQXpCLEdBQStCLElBQS9CLENBSHJDLENBRG9CO2lCQUFaLEVBS1IsR0FMSCxFQURPO2FBQVg7U0FsQkk7O0FBNEJSLGdCQUFRLFVBQVUsSUFBVixFQUFnQjtBQUNwQixnQkFBSSxLQUFKO2dCQUNJLE1BREo7Z0JBRUksV0FBVyxLQUFLLFFBQUwsRUFBWCxDQUhnQjs7QUFLcEIsZ0JBQUksV0FBVyxRQUFYLENBQUosRUFBMEI7QUFDdEIsdUJBQU8sV0FBVyxRQUFYLENBQVAsQ0FEc0I7YUFBMUI7O0FBSUEsZ0JBQUksZ0JBQWdCLEtBQWhCLEtBQTBCLEtBQTFCLEVBQWlDO0FBQ2pDLHVCQUFPLENBQUUsSUFBRixDQUFQLENBRGlDO2FBQXJDOztBQUlBLG9CQUFRLFNBQVMsYUFBVCxDQUF1QixPQUF2QixDQUFSLENBYm9CO0FBY3BCLGtCQUFNLE9BQU4sR0FBZ0IsSUFBaEIsQ0Fkb0I7O0FBZ0JwQixpQkFBSyxPQUFMLENBQWEsVUFBVSxHQUFWLEVBQWU7QUFDeEIseUJBQVMsU0FBUyxhQUFULENBQXVCLFFBQXZCLENBQVQsQ0FEd0I7QUFFeEIsdUJBQU8sR0FBUCxHQUFhLEdBQWIsQ0FGd0I7QUFHeEIsc0JBQU0sV0FBTixDQUFrQixNQUFsQixFQUh3QjthQUFmLENBQWIsQ0FoQm9COztBQXNCcEIsdUJBQVcsUUFBWCxJQUF1QixLQUF2QixDQXRCb0I7O0FBd0JwQixtQkFBTyxLQUFQLENBeEJvQjtTQUFoQjs7QUEyQlIsdUJBQWUsVUFBVSxLQUFWLEVBQWlCLFFBQWpCLEVBQTJCO0FBQ3RDLGdCQUFJLE9BQVMsSUFBVDtnQkFDQSxRQUFTLFdBQVcsRUFBWDtnQkFDVCxTQUFTLE1BQU0sTUFBTixHQUFlLElBQWYsQ0FIeUI7O0FBS3RDLGdCQUFJLFNBQVMsQ0FBVCxFQUFZO0FBQ1osc0JBQU0sTUFBTixHQUFlLE1BQWYsQ0FEWTs7QUFHWiwyQkFBVyxZQUFZO0FBQ25CLHlCQUFLLGFBQUwsQ0FBbUIsS0FBbkIsRUFBMEIsUUFBMUIsRUFEbUI7aUJBQVosRUFFUixLQUZILEVBSFk7YUFBaEIsTUFNTztBQUNILHNCQUFNLEtBQU4sR0FERzthQU5QO1NBTFc7O0FBZ0JmLHNCQUFjLFVBQVUsS0FBVixFQUFpQixRQUFqQixFQUEyQjtBQUNyQyxnQkFBSSxPQUFTLElBQVQ7Z0JBQ0EsUUFBUyxXQUFXLEVBQVg7Z0JBQ1QsU0FBUyxNQUFNLE1BQU4sR0FBZSxJQUFmLENBSHdCOztBQUtyQyxnQkFBSSxTQUFTLENBQVQsRUFBWTtBQUNaLHNCQUFNLE1BQU4sR0FBZSxNQUFmLENBRFk7O0FBR1osMkJBQVcsWUFBWTtBQUNuQix5QkFBSyxZQUFMLENBQWtCLEtBQWxCLEVBQXlCLFFBQXpCLEVBRG1CO2lCQUFaLEVBRVIsS0FGSCxFQUhZO2FBQWhCO1NBTFU7O0FBY2Qsa0JBQVUsVUFBVSxHQUFWLEVBQWUsQ0FBZixFQUFrQjtBQUN4QixnQkFBSSxNQUFNLFNBQU4sRUFBaUI7QUFDakIsb0JBQUksS0FBSyxLQUFMLENBRGE7YUFBckI7O0FBSUEsZ0JBQUksS0FBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixDQUFyQixFQUF3QixHQUF4QixNQUFpQyxTQUFqQyxFQUE0QztBQUM1Qyx1QkFBTyxLQUFLLFFBQUwsQ0FBYyxNQUFkLENBQXFCLENBQXJCLEVBQXdCLEdBQXhCLENBQVAsQ0FENEM7YUFBaEQ7O0FBSUEsbUJBQU8sS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFQLENBVHdCO1NBQWxCOztBQVlWLGVBQU8sVUFBVSxFQUFWLEVBQWM7QUFDakIsZ0JBQUksT0FBTyxLQUFLLFFBQUwsQ0FBYyxNQUFkLENBQXFCLEVBQXJCLENBQVAsS0FBb0MsV0FBcEMsRUFBaUQ7QUFDakQscUJBQUssQ0FBTCxDQURpRDthQUFyRDs7QUFJQSxpQkFBSyxLQUFMLEdBQWEsRUFBYixDQUxpQjs7QUFPakIsZ0JBQUksTUFBSjtnQkFDSSxNQURKO2dCQUVJLE1BRko7Z0JBR0ksVUFBZ0IsS0FBSyxLQUFMLENBQVcsUUFBWCxDQUFvQixjQUFwQixDQUFoQjtnQkFDQSxNQUFnQixLQUFLLFFBQUwsQ0FBYyxNQUFkLENBQXFCLEVBQXJCLEVBQXlCLEdBQXpCO2dCQUNoQixnQkFBZ0IsS0FBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixFQUFyQixFQUF5QixLQUF6QjtnQkFDaEIsUUFBZ0IsS0FBSyxRQUFMLENBQWMsT0FBZCxDQUFoQjtnQkFDQSxRQUFnQixLQUFLLFFBQUwsQ0FBYyxPQUFkLENBQWhCO2dCQUNBLFNBQWdCLEtBQUssUUFBTCxDQUFjLFFBQWQsQ0FBaEI7Z0JBQ0EsUUFBZ0IsS0FBSyxRQUFMLENBQWMsT0FBZCxDQUFoQjtnQkFDQSxRQUFnQixLQUFLLFFBQUwsQ0FBYyxPQUFkLEtBQTBCLEtBQUssS0FBTCxDQUFXLEdBQVgsQ0FBZSxrQkFBZixDQUExQjtnQkFDaEIsT0FBZ0IsSUFBaEI7Z0JBQ0EsUUFBZ0IsUUFBUSxNQUFSO2dCQUNoQixLQWJKO2dCQWNJLEdBZEosQ0FQaUI7O0FBdUJqQixnQkFBSSxhQUFxQixLQUFLLFFBQUwsQ0FBYyxZQUFkLENBQXJCO2dCQUNBLHFCQUFxQixLQUFLLFFBQUwsQ0FBYyxvQkFBZCxDQUFyQjtnQkFDQSxZQUFxQixLQUFLLFFBQUwsQ0FBYyxXQUFkLENBQXJCO2dCQUNBLG9CQUFxQixLQUFLLFFBQUwsQ0FBYyxtQkFBZCxDQUFyQixDQTFCYTs7QUE0QmpCLGdCQUFJLFVBQVUsUUFBVixFQUFvQjtBQUNwQixvQkFBSSxVQUFVLElBQVYsRUFBZ0I7QUFDaEIsNEJBQVEsT0FBUixDQURnQjtpQkFBcEIsTUFFTyxJQUFJLFVBQVUsS0FBVixFQUFpQjtBQUN4Qiw0QkFBUSxTQUFSLENBRHdCO2lCQUFyQjthQUhYOztBQVFBLGdCQUFJLGVBQWUsUUFBZixJQUEyQixzQkFBc0IsS0FBdEIsRUFBNkI7QUFDeEQsb0JBQUksc0JBQXNCLEtBQXRCLEVBQTZCO0FBQzdCLGlDQUFhLEtBQUssT0FBTCxDQUFhLFVBQWIsQ0FBYixDQUQ2QjtpQkFBakMsTUFFTztBQUNILGlDQUFhLEtBQUssT0FBTCxDQUFhLEtBQUssV0FBTCxDQUExQixDQURHO2lCQUZQO2FBREo7O0FBUUEsZ0JBQUksY0FBYyxRQUFkLElBQTBCLHFCQUFxQixLQUFyQixFQUE0QjtBQUN0RCxvQkFBSSxxQkFBcUIsS0FBckIsRUFBNEI7QUFDNUIsZ0NBQVksS0FBSyxPQUFMLENBQWEsU0FBYixDQUFaLENBRDRCO2lCQUFoQyxNQUVPO0FBQ0gsZ0NBQVksS0FBSyxPQUFMLENBQWEsS0FBSyxVQUFMLENBQXpCLENBREc7aUJBRlA7YUFESjs7QUFRQSxnQkFBSSx1QkFBdUIsTUFBdkIsSUFBaUMscUJBQXFCLEtBQXJCLEVBQTRCO0FBQzdELHFDQUFxQixLQUFyQixDQUQ2RDthQUFqRTs7QUFJQSxnQkFBSSxzQkFBc0IsTUFBdEIsRUFBOEI7QUFDOUIsb0NBQW9CLEtBQXBCLENBRDhCO2FBQWxDOztBQUlBLHFCQUFTLEVBQUUsaUNBQUYsQ0FBVCxDQTVEaUI7O0FBOERqQixnQkFBSSxLQUFLLE9BQUwsQ0FBYSxVQUFiLElBQTJCLFVBQTNCLEVBQXVDO0FBQ3ZDLHVCQUFPLFFBQVAsQ0FBZ0Isc0JBQXNCLFVBQXRCLENBQWhCLENBRHVDO2FBQTNDOzs7O0FBOURpQixnQkFvRWIsS0FBSyxPQUFMLENBQWEsS0FBYixJQUFzQixhQUF0QixFQUFxQztBQUNyQyxvQkFBSSx5QkFBeUIsS0FBekIsRUFBZ0M7QUFDaEMsNEJBQVEsS0FBSyxNQUFMLENBQVksYUFBWixDQUFSLENBRGdDO2lCQUFwQyxNQUVPO0FBQ0gsNEJBQVEsS0FBSyxNQUFMLENBQVksY0FBYyxHQUFkLENBQXBCLENBREc7aUJBRlA7O0FBTUEsc0JBQU0sSUFBTixHQUFjLGNBQWMsSUFBZCxLQUF1QixTQUF2QixHQUFtQyxjQUFjLElBQWQsR0FBcUIsSUFBeEQsQ0FQdUI7QUFRckMsc0JBQU0sS0FBTixHQUFjLGNBQWMsSUFBZCxLQUF1QixTQUF2QixHQUFtQyxjQUFjLElBQWQsR0FBcUIsSUFBeEQsQ0FSdUI7O0FBVXJDLG9CQUFJLE1BQU0sS0FBTixLQUFnQixLQUFoQixFQUF1QjtBQUN2QiwwQkFBTSxNQUFOLEdBQWUsQ0FBZixDQUR1QjtBQUV2Qix5QkFBSyxZQUFMLENBQWtCLEtBQWxCLEVBQXlCLGtCQUF6QixFQUZ1QjtpQkFBM0IsTUFHTztBQUNILDBCQUFNLEtBQU4sR0FERztpQkFIUDs7QUFPQSx5QkFBUyxFQUFFLEtBQUYsRUFDSixRQURJLENBQ0ssYUFETCxFQUVKLEdBRkksQ0FFQSxrQkFGQSxFQUVvQixLQUZwQixDQUFULENBakJxQzs7QUFxQnJDLG9CQUFJLEtBQUssT0FBTCxDQUFhLFNBQWIsRUFBd0I7QUFDeEIsMkJBQ0ssR0FETCxDQUNTLGlCQURULEVBQzRCLFFBQVEsR0FBUixHQUFjLE1BQWQsQ0FENUIsQ0FFSyxHQUZMLENBRVMsWUFGVCxFQUV1QixLQUZ2QixFQUdLLEdBSEwsQ0FHUyxPQUhULEVBR21CLE1BSG5CLEVBSUssR0FKTCxDQUlTLFFBSlQsRUFJbUIsTUFKbkIsRUFEd0I7aUJBQTVCLE1BTU8sSUFBSSxVQUFVLFNBQVYsRUFBcUI7QUFDNUIsMkJBQ0ssR0FETCxDQUNTLE9BRFQsRUFDbUIsTUFEbkIsRUFFSyxHQUZMLENBRVMsUUFGVCxFQUVtQixNQUZuQixFQUQ0QjtpQkFBekI7O0FBTVAsdUJBQU8sTUFBUCxDQUFjLE1BQWQ7OzthQWpDSixNQXFDTztBQXJDa0MsQUFzQ3JDLDBCQUFNLElBQUksS0FBSixFQUFOLENBREc7O0FBR0gsNkJBQVMsRUFBRSx1Q0FBRixFQUNKLEdBREksQ0FDQSxrQkFEQSxFQUN1QixTQUFTLEdBQVQsR0FBZSxHQUFmLENBRHZCLENBRUosR0FGSSxDQUVBLGtCQUZBLEVBRXVCLEtBRnZCLEVBR0osR0FISSxDQUdBLHFCQUhBLEVBR3VCLFFBQVEsR0FBUixHQUFjLE1BQWQsQ0FIaEMsQ0FIRzs7QUFRSCx3QkFBSSxVQUFVLFFBQVYsRUFBb0I7QUFDcEIsK0JBQU8sR0FBUCxDQUFXLG1CQUFYLEVBQWdDLFFBQWhDLEVBRG9CO3FCQUF4QixNQUVPO0FBQ0gsK0JBQU8sR0FBUCxDQUFXLGlCQUFYLEVBQThCLEtBQTlCLEVBREc7cUJBRlA7O0FBTUEsd0JBQUksS0FBSyxPQUFMLENBQWEsVUFBYixJQUEyQixTQUEzQixFQUFzQztBQUN0QywrQkFDSyxRQURMLENBQ2MscUJBQXFCLFNBQXJCLENBRGQsQ0FFSyxHQUZMLENBRVMsb0JBRlQsRUFFZ0Msb0JBQW9CLElBQXBCLENBRmhDLENBRHNDO3FCQUExQzs7QUFNQSwyQkFBTyxNQUFQLENBQWMsTUFBZCxFQXBCRztpQkFyQ1A7O0FBNERBLGdCQUFJLENBQUMsS0FBSyxPQUFMLENBQWEsVUFBYixFQUF5QjtBQUMxQix1QkFBTyxHQUFQLENBQVcsU0FBWCxFQUFzQixNQUF0QixFQUQwQjthQUE5Qjs7QUFJQSxnQkFBSSxLQUFKLEVBQVc7QUFDUCx3QkFBUSxFQUFSLENBQVcsUUFBUSxDQUFSLENBQVgsQ0FBc0IsS0FBdEIsQ0FBNEIsTUFBNUIsRUFETzthQUFYLE1BRU87QUFDSCxxQkFBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixNQUFuQixFQURHO2FBRlA7O0FBTUEsaUJBQUssTUFBTCxDQUFZLEtBQVosRUExSWlCOztBQTRJakIscUJBQVMsRUFBVCxHQUFlO0FBQ1gscUJBQUssTUFBTCxDQUFZLElBQVosRUFEVzs7QUFHWCwyQkFBVyxZQUFZO0FBQ25CLHdCQUFJLFVBQUosRUFBZ0I7QUFDWiw0QkFBSSxLQUFLLE9BQUwsQ0FBYSxVQUFiLEVBQXlCO0FBQ3pCLG9DQUNLLEdBREwsQ0FDUyxZQURULEVBQ3VCLFNBQVMsa0JBQVQsR0FBOEIsSUFBOUIsQ0FEdkIsQ0FFSyxRQUZMLENBRWMsc0JBQXNCLFVBQXRCLEdBQW1DLE1BQW5DLENBRmQsQ0FEeUI7O0FBS3pCLG9DQUFRLElBQVIsQ0FBYSxZQUFZO0FBQ3JCLG9DQUFJLFFBQVEsUUFBUSxJQUFSLENBQWEsT0FBYixFQUFzQixHQUF0QixDQUEwQixDQUExQixDQUFSLENBRGlCOztBQUdyQixvQ0FBSSxLQUFKLEVBQVc7QUFDUCwwQ0FBTSxNQUFOLEdBQWUsQ0FBZixDQURPO0FBRVAseUNBQUssYUFBTCxDQUFtQixLQUFuQixFQUEwQixrQkFBMUIsRUFGTztpQ0FBWDs2QkFIUyxDQUFiLENBTHlCOztBQWN6QixtQ0FDSyxHQURMLENBQ1MsWUFEVCxFQUN1QixTQUFTLGtCQUFULEdBQThCLElBQTlCLENBRHZCLENBRUssUUFGTCxDQUVjLHNCQUFzQixVQUF0QixHQUFtQyxLQUFuQyxDQUZkLENBZHlCO3lCQUE3QixNQWlCTztBQUNILG1DQUFPLE1BQVAsQ0FBYyxrQkFBZCxFQURHO3lCQWpCUDtxQkFESjs7QUF1QkEseUJBQUssSUFBSSxJQUFJLENBQUosRUFBTyxJQUFJLFFBQVEsTUFBUixHQUFpQixDQUFqQixFQUFvQixHQUF4QyxFQUE2QztBQUN4QyxnQ0FBUSxFQUFSLENBQVcsQ0FBWCxFQUFjLE1BQWQsR0FEd0M7cUJBQTdDOztBQUlBLHlCQUFLLE9BQUwsQ0FBYSxNQUFiLEVBNUJtQjtBQTZCbkIseUJBQUssVUFBTCxHQTdCbUI7aUJBQVosRUE4QlIsR0E5QkgsRUFIVzthQUFmO0FBbUNBLGdCQUFJLEtBQUosRUFBVztBQUNQLG9CQUFJLE1BQU0sVUFBTixLQUFxQixDQUFyQixFQUF3QjtBQUN4QiwwQkFBTSxXQUFOLEdBQW9CLENBQXBCLENBRHdCO2lCQUE1Qjs7QUFJQSxzQkFBTSxJQUFOLEdBTE87QUFNUCxxQkFOTzthQUFYLE1BT087QUFDSCxvQkFBSSxHQUFKLEdBQVUsR0FBVixDQURHO0FBRUgsb0JBQUksTUFBSixHQUFhLEVBQWIsQ0FGRzthQVBQO1NBL0tHOztBQTRMUCxpQkFBUyxZQUFZO0FBQ2pCLGdCQUFJLElBQUosRUFDSSxJQURKLENBRGlCOztBQUlqQixpQkFBSyxJQUFJLElBQUksS0FBSyxLQUFMLEdBQWEsQ0FBYixFQUFnQixJQUFJLENBQUosRUFBTyxHQUFwQyxFQUF5QztBQUNyQyx1QkFBTyxLQUFLLEtBQUwsQ0FBVyxLQUFLLE1BQUwsTUFBaUIsSUFBSSxDQUFKLENBQWpCLENBQWxCLENBRHFDO0FBRXJDLHVCQUFPLEtBQUssUUFBTCxDQUFjLE1BQWQsQ0FBcUIsQ0FBckIsQ0FBUCxDQUZxQzs7QUFJckMscUJBQUssUUFBTCxDQUFjLE1BQWQsQ0FBcUIsQ0FBckIsSUFBMEIsS0FBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixJQUFyQixDQUExQixDQUpxQztBQUtyQyxxQkFBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixJQUFyQixJQUE2QixJQUE3QixDQUxxQzthQUF6QztTQUpLOztBQWFULGNBQU0sWUFBWTtBQUNkLGdCQUFJLEtBQUssTUFBTCxFQUFhO0FBQ2IscUJBQUssTUFBTCxHQUFjLEtBQWQsQ0FEYTtBQUViLHFCQUFLLElBQUwsR0FGYTtBQUdiLHFCQUFLLE9BQUwsQ0FBYSxNQUFiLEVBSGE7YUFBakI7U0FERTs7QUFRTixlQUFPLFlBQVk7QUFDZixpQkFBSyxNQUFMLENBQVksS0FBWixFQURlO0FBRWYsaUJBQUssTUFBTCxHQUFjLElBQWQsQ0FGZTtBQUdmLGlCQUFLLE9BQUwsQ0FBYSxPQUFiLEVBSGU7U0FBWjs7QUFNUCxnQkFBUSxZQUFZO0FBQ2hCLGdCQUFJLEtBQUssTUFBTCxFQUFhO0FBQ2IscUJBQUssSUFBTCxHQURhO2FBQWpCLE1BRU87QUFDSCxxQkFBSyxLQUFMLEdBREc7YUFGUDtTQURJOztBQVFSLGlCQUFTLFlBQVk7QUFDakIsbUJBQU8sQ0FBQyxLQUFLLE1BQUwsSUFBZSxDQUFDLEtBQUssTUFBTCxDQURQO1NBQVo7O0FBSVQsaUJBQVMsVUFBVSxRQUFWLEVBQW9CO0FBQ3pCLGdCQUFJLFFBQUosRUFBYztBQUNWLHVCQUFPO0FBQ0gsMkJBQU8sS0FBSyxLQUFMO0FBQ1AsMEJBQU8sS0FBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixLQUFLLEtBQUwsQ0FBNUI7aUJBRkosQ0FEVTthQUFkO0FBTUEsbUJBQU8sS0FBSyxLQUFMLENBUGtCO1NBQXBCOztBQVVULGNBQU0sVUFBVSxFQUFWLEVBQWM7QUFDaEIsZ0JBQUksS0FBSyxDQUFMLElBQVUsS0FBSyxLQUFLLEtBQUwsR0FBYSxDQUFiLElBQWtCLE9BQU8sS0FBSyxLQUFMLEVBQVk7QUFDcEQsdUJBRG9EO2FBQXhEOztBQUlBLGlCQUFLLEtBQUwsR0FBYSxFQUFiLENBTGdCO0FBTWhCLGlCQUFLLEtBQUwsQ0FBVyxLQUFLLEtBQUwsQ0FBWCxDQU5nQjtTQUFkOztBQVNOLGNBQU0sWUFBWTtBQUNkLGlCQUFLLEtBQUwsR0FEYzs7QUFHZCxnQkFBSSxLQUFLLEtBQUwsSUFBYyxLQUFLLEtBQUwsRUFBWTtBQUMxQixxQkFBSyxLQUFMLEdBQWEsQ0FBYixDQUQwQjthQUE5Qjs7QUFJQSxpQkFBSyxLQUFMLENBQVcsS0FBSyxLQUFMLENBQVgsQ0FQYztTQUFaOztBQVVOLGtCQUFVLFlBQVk7QUFDbEIsaUJBQUssS0FBTCxHQURrQjs7QUFHbEIsZ0JBQUksS0FBSyxLQUFMLEdBQWEsQ0FBYixFQUFnQjtBQUNoQixxQkFBSyxLQUFMLEdBQWEsS0FBSyxLQUFMLEdBQWEsQ0FBYixDQURHO2FBQXBCOztBQUlBLGlCQUFLLEtBQUwsQ0FBVyxLQUFLLEtBQUwsQ0FBWCxDQVBrQjtTQUFaOztBQVVWLGlCQUFTLFVBQVUsRUFBVixFQUFjO0FBQ25CLGdCQUFJLFNBQVMsRUFBVCxDQURlOztBQUduQixnQkFBSSxPQUFPLE1BQVAsRUFBZTtBQUNmLHlCQUFTLENBQUUsS0FBSyxRQUFMLENBQVgsQ0FEZTthQUFuQixNQUVPO0FBQ0gseUJBQVMsQ0FDTCxLQUFLLEtBQUwsRUFDQSxLQUFLLFFBQUwsQ0FBYyxNQUFkLENBQXFCLEtBQUssS0FBTCxDQUZoQixDQUFULENBREc7YUFGUDs7QUFTQSxpQkFBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixVQUFVLEVBQVYsRUFBYyxNQUFqQyxFQVptQjs7QUFjbkIsZ0JBQUksT0FBTyxLQUFLLFFBQUwsQ0FBYyxFQUFkLENBQVAsS0FBNkIsVUFBN0IsRUFBeUM7QUFDekMscUJBQUssUUFBTCxDQUFjLEVBQWQsRUFBa0IsS0FBbEIsQ0FBd0IsS0FBSyxLQUFMLEVBQVksTUFBcEMsRUFEeUM7YUFBN0M7U0FkSzs7QUFtQlQsaUJBQVMsVUFBVSxHQUFWLEVBQWUsS0FBZixFQUFzQjtBQUMzQixnQkFBSSxZQUFZLEtBQUssUUFBTCxDQUFjLE1BQWQsQ0FBcUIsS0FBckIsRUFBWixDQUR1Qjs7QUFHM0IsZ0JBQUksT0FBTyxHQUFQLEtBQWUsUUFBZixFQUF5QjtBQUN6QixxQkFBSyxRQUFMLEdBQWdCLEVBQUUsTUFBRixDQUFTLEVBQVQsRUFBYSxRQUFiLEVBQXVCLEVBQUUsS0FBRixDQUFRLFFBQVIsRUFBa0IsR0FBekMsQ0FBaEIsQ0FEeUI7YUFBN0IsTUFFTyxJQUFJLE9BQU8sR0FBUCxLQUFlLFFBQWYsRUFBeUI7QUFDaEMsb0JBQUksVUFBVSxTQUFWLEVBQXFCO0FBQ3JCLDJCQUFPLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBUCxDQURxQjtpQkFBekI7QUFHQSxxQkFBSyxRQUFMLENBQWMsR0FBZCxJQUFxQixLQUFyQixDQUpnQzthQUE3QixNQUtBO0FBQ0gsdUJBQU8sS0FBSyxRQUFMLENBREo7YUFMQTs7O0FBTG9CLGdCQWV2QixLQUFLLFFBQUwsQ0FBYyxNQUFkLEtBQXlCLFNBQXpCLEVBQW9DO0FBQ3BDLHFCQUFLLEtBQUwsR0FBYyxLQUFLLFFBQUwsQ0FBYyxNQUFkLENBQXFCLE1BQXJCLENBRHNCO0FBRXBDLHFCQUFLLE1BQUwsR0FBYyxLQUFLLEtBQUwsR0FBYSxDQUFiLENBRnNCO0FBR3BDLHFCQUFLLFFBQUwsR0FIb0M7YUFBeEM7U0FmSzs7QUFzQlQsaUJBQVMsWUFBWTtBQUNqQix5QkFBYSxLQUFLLE9BQUwsQ0FBYixDQURpQjs7QUFHakIsaUJBQUssS0FBTCxDQUFXLFdBQVgsQ0FBdUIsaUJBQXZCLEVBSGlCO0FBSWpCLGlCQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLGdCQUFoQixFQUFrQyxNQUFsQyxHQUppQjtBQUtqQixpQkFBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixrQkFBaEIsRUFBb0MsS0FBcEMsQ0FBMEMsSUFBMUMsRUFBZ0QsUUFBaEQsR0FBMkQsUUFBM0QsQ0FBb0UsS0FBSyxLQUFMLENBQXBFLENBTGlCO0FBTWpCLGlCQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLGtCQUFoQixFQUFvQyxNQUFwQyxHQU5pQjs7QUFRakIsZ0JBQUksS0FBSyxRQUFMLENBQWMsS0FBZCxFQUFxQjtBQUNyQixxQkFBSyxNQUFMLENBQVksTUFBWixHQURxQjthQUF6Qjs7QUFJQSxnQkFBSSxLQUFLLFFBQUwsQ0FBYyxPQUFkLEVBQXVCO0FBQ3ZCLHFCQUFLLFFBQUwsQ0FBYyxNQUFkLEdBRHVCO2FBQTNCOztBQUlBLGlCQUFLLElBQUwsQ0FBVSxNQUFWLEdBQW1CLElBQW5CLENBaEJpQjtTQUFaO0tBL2ZiLENBOUdVOztBQWlvQlYsTUFBRSxFQUFGLENBQUssS0FBTCxHQUFhLFVBQVMsT0FBVCxFQUFrQjtBQUMzQixZQUFJLE9BQU8sU0FBUDtZQUNBLFFBQVEsS0FBUjtZQUNBLE9BRkosQ0FEMkI7O0FBSzNCLFlBQUksWUFBWSxTQUFaLElBQXlCLE9BQU8sT0FBUCxLQUFtQixRQUFuQixFQUE2QjtBQUN0RCxtQkFBTyxLQUFLLElBQUwsQ0FBVSxZQUFZO0FBQ3pCLG9CQUFJLENBQUMsS0FBSyxNQUFMLEVBQWE7QUFDZCx5QkFBSyxNQUFMLEdBQWMsSUFBSSxLQUFKLENBQVUsSUFBVixFQUFnQixPQUFoQixDQUFkLENBRGM7aUJBQWxCO2FBRGEsQ0FBakIsQ0FEc0Q7U0FBMUQsTUFNTyxJQUFJLE9BQU8sT0FBUCxLQUFtQixRQUFuQixFQUE2QjtBQUNwQyxpQkFBSyxJQUFMLENBQVUsWUFBWTtBQUNsQixvQkFBSSxXQUFXLEtBQUssTUFBTCxDQURHOztBQUdsQixvQkFBSSxDQUFDLFFBQUQsRUFBVztBQUNYLDBCQUFNLElBQUksS0FBSixDQUFVLG1DQUFWLENBQU4sQ0FEVztpQkFBZjs7QUFJQSxvQkFBSSxPQUFPLFNBQVMsT0FBVCxDQUFQLEtBQTZCLFVBQTdCLElBQTJDLFFBQVEsQ0FBUixNQUFlLEdBQWYsRUFBb0I7QUFDL0QsOEJBQVUsU0FBUyxPQUFULEVBQWtCLEtBQWxCLENBQXdCLFFBQXhCLEVBQWtDLEdBQUcsS0FBSCxDQUFTLElBQVQsQ0FBYyxJQUFkLEVBQW9CLENBQXBCLENBQWxDLENBQVYsQ0FEK0Q7aUJBQW5FLE1BRU87QUFDSCw0QkFBUSxJQUFSLENBREc7aUJBRlA7YUFQTSxDQUFWLENBRG9DOztBQWVwQyxnQkFBSSxLQUFKLEVBQVc7QUFDUCxzQkFBTSxJQUFJLEtBQUosQ0FBVSxnQkFBZ0IsT0FBaEIsR0FBMEIsYUFBMUIsQ0FBaEIsQ0FETzthQUFYOztBQUlBLG1CQUFPLFlBQVksU0FBWixHQUF3QixPQUF4QixHQUFrQyxJQUFsQyxDQW5CNkI7U0FBakM7S0FYRSxDQWpvQkg7O0FBbXFCVixNQUFFLEtBQUYsR0FBVSxFQUFWLENBbnFCVTtBQW9xQlYsTUFBRSxLQUFGLENBQVEsUUFBUixHQUFtQixRQUFuQixDQXBxQlU7O0FBc3FCVixNQUFFLEtBQUYsQ0FBUSxpQkFBUixHQUE0QixZQUFZO0FBQ3BDLGVBQU8sQ0FBQyw0REFBNEQsSUFBNUQsQ0FBaUUsVUFBVSxTQUFWLENBQWxFLENBRDZCO0tBQVosQ0F0cUJsQjtDQUFiLENBQUQsQ0EwcUJHLE9BQU8sTUFBUCxJQUFpQixPQUFPLEtBQVAsQ0ExcUJwQjs7Ozs7Ozs7OztBQ0hBLENBQUMsVUFBUyxDQUFULEVBQVk7QUFDWixjQURZOztBQUdaLEtBQUcsZ0JBQWdCLE9BQU8sQ0FBUCxFQUFVO0FBQzVCLE1BQUcsYUFBYSxNQUFiLEVBQW9CO0FBQUUsVUFBTyxPQUFQLENBQWUsSUFBZixDQUFvQixnREFBcEIsRUFBRjtHQUF2QjtBQUNBLFNBRjRCO0VBQTdCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSFksVUE2QkgsWUFBVCxDQUFzQixRQUF0QixFQUFnQyxNQUFoQyxFQUF3QztBQUN2QyxNQUFHLGdCQUFnQixZQUFoQixFQUE4Qjs7QUFDaEMsUUFBSyxFQUFMLEdBQVUsYUFBYSxFQUFiLEVBQVYsQ0FEZ0M7QUFFaEMsUUFBSyxLQUFMLENBQVcsUUFBWCxFQUFxQixNQUFyQixFQUZnQztBQUdoQyxRQUFLLGNBQUwsQ0FBb0IsYUFBYSxjQUFiLENBQXBCLENBSGdDO0dBQWpDLE1BSU87QUFDTixPQUFJLEtBQUssSUFBSSxZQUFKLENBQWlCLFFBQWpCLEVBQTJCLE1BQTNCLENBQUwsQ0FERTtBQUVOLE1BQUcsSUFBSCxHQUZNO0FBR04sVUFBTyxFQUFQLENBSE07R0FKUDtFQUREOztBQVlBLEtBQUksU0FBUyxFQUFUO0tBQ0gsY0FBYyxVQUFTLE1BQVQsRUFBaUI7QUFDOUIsV0FBUyxFQUFFLElBQUYsQ0FBTyxNQUFQLEVBQWUsVUFBUyxFQUFULEVBQWE7QUFDcEMsVUFBTyxPQUFPLE1BQVAsSUFBaUIsR0FBRyxTQUFILENBQWEsT0FBYixDQUFxQixNQUFyQixFQUE2QixNQUE3QixHQUFzQyxDQUF0QyxDQURZO0dBQWIsQ0FBeEIsQ0FEOEI7QUFJOUIsU0FBTyxNQUFQLENBSjhCO0VBQWpCOzs7O0FBMUNILEtBbURSLFlBQVksVUFBUyxHQUFULEVBQWMsTUFBZCxFQUFzQjtBQUNyQyxNQUFJLFNBQVMsRUFBVDtNQUNILFFBQVEsSUFBSSxNQUFKLENBQVcsTUFBTSxNQUFOLEdBQWUsYUFBZixDQUFuQixDQUZvQztBQUdyQyxPQUFLLElBQUksR0FBSixJQUFXLEdBQWhCLEVBQXFCO0FBQ3BCLE9BQUksUUFBUSxJQUFJLEtBQUosQ0FBVSxLQUFWLENBQVIsQ0FEZ0I7QUFFcEIsT0FBSSxLQUFKLEVBQVc7QUFDVixRQUFJLGFBQWEsQ0FBQyxNQUFNLENBQU4sSUFBVyxNQUFNLENBQU4sRUFBUyxPQUFULENBQWlCLFVBQWpCLEVBQTZCLEtBQTdCLENBQVgsQ0FBRCxDQUFpRCxXQUFqRCxFQUFiLENBRE07QUFFVixXQUFPLFVBQVAsSUFBcUIsSUFBSSxHQUFKLENBQXJCLENBRlU7SUFBWDtHQUZEO0FBT0EsU0FBTyxNQUFQLENBVnFDO0VBQXRCOzs7QUFuREosS0FpRVIsV0FBVyxFQUFFLE9BQU8sU0FBUCxFQUFrQixRQUFRLFVBQVIsRUFBL0IsQ0FqRVE7O0FBbUVaLEtBQUkscUJBQXFCLFVBQVMsS0FBVCxFQUFnQjtBQUN4QyxJQUFFLElBQUYsQ0FBTyxhQUFhLE1BQWIsR0FBc0IsT0FBdEIsRUFBUCxFQUF3QyxZQUFXO0FBQ2xELE9BQUksQ0FBQyxNQUFNLGtCQUFOLEVBQUQsRUFBNkI7QUFDaEMsUUFBSSxVQUFVLEtBQUssU0FBUyxNQUFNLElBQU4sQ0FBZCxFQUEyQixLQUEzQixDQUFWLEVBQTZDO0FBQ2hELFdBQU0sY0FBTixHQURnRCxLQUN4QixDQUFNLGVBQU4sR0FEd0IsT0FDUSxLQUFQLENBREQ7S0FBakQ7SUFERDtHQUR1QyxDQUF4QyxDQUR3QztFQUFoQixDQW5FYjs7QUE2RVosS0FBSSxxQkFBcUIsVUFBUyxHQUFULEVBQWM7QUFDckMsTUFBRyxRQUFRLGFBQWEsdUJBQWIsRUFBc0M7QUFDaEQsZ0JBQWEsdUJBQWIsR0FBdUMsR0FBdkMsQ0FEZ0Q7QUFFaEQsT0FBSSxTQUFTLEVBQUUsR0FBRixDQUFNLFFBQU4sRUFBZ0IsVUFBUyxDQUFULEVBQVksSUFBWixFQUFrQjtBQUFFLFdBQU8sT0FBSyxHQUFMLEdBQVMsYUFBYSxTQUFiLENBQXVCLFNBQXZCLENBQWxCO0lBQWxCLENBQWhCLENBQTBGLElBQTFGLENBQStGLEdBQS9GLENBQVQsQ0FGNEM7QUFHaEQsS0FBRSxNQUFGLEVBQVUsTUFBTSxJQUFOLEdBQWEsS0FBYixDQUFWLENBQThCLE1BQTlCLEVBQXNDLGtCQUF0QyxFQUhnRDtHQUFqRDtFQUR1QixDQTdFYjs7QUFxRlosY0FBYSxTQUFiLEdBQXlCO0FBQ3hCLGVBQWEsWUFBYjs7O0FBR0EsYUFBZ0IsY0FBaEI7QUFDQSxjQUFnQixtQkFBaEI7QUFDQSxXQUFnQixJQUFoQjtBQUNBLFlBQWdCLEtBQWhCO0FBQ0EsY0FBZ0IsSUFBaEI7QUFDQSxlQUFnQixPQUFoQjtBQUNBLGdCQUFnQixPQUFoQjtBQUNBLFVBQWdCLElBQWhCO0FBQ0EsUUFBZ0IsTUFBaEI7QUFDQSxhQUFnQixHQUFoQjtBQUNBLGNBQWdCLEdBQWhCO0FBQ0EsZ0JBQWdCLFlBQWhCO0FBQ0EsY0FBZ0IsSUFBaEI7QUFDQSxhQUFnQixVQUFoQjtBQUNBLFdBQWdCLEVBQWhCO0FBQ0EsV0FBZ0IsS0FBaEI7QUFDQSxjQUFnQixJQUFoQjtBQUNBLGNBQWdCLEVBQUUsSUFBRjtBQUNoQixpQkFBZ0IsRUFBRSxJQUFGO0FBQ2hCLGVBQWdCLEVBQUUsSUFBRjtBQUNoQixhQUFnQixFQUFFLElBQUY7QUFDaEIsZ0JBQWdCLEVBQUUsSUFBRjtBQUNoQixjQUFnQixFQUFFLElBQUY7QUFDaEIsV0FBZ0IsRUFBRSxJQUFGO0FBQ2hCLFlBQWdCLEVBQUUsSUFBRjtBQUNoQixRQUFnQixJQUFoQjtBQUNBLGtCQUFnQixDQUFDLFFBQUQsRUFBVyxPQUFYLEVBQW9CLE1BQXBCLEVBQTRCLE1BQTVCLEVBQW9DLFFBQXBDLEVBQThDLE1BQTlDLENBQWhCOzs7O0FBSUEsU0FBTyxVQUFTLE1BQVQsRUFBaUIsTUFBakIsRUFBd0I7O0FBRTlCLE9BQUksT0FBTyxNQUFQLEtBQWtCLFFBQWxCLElBQThCLGtCQUFrQixDQUFsQixLQUF3QixLQUF4QixJQUFpQyxDQUFDLE1BQUQsRUFBUztBQUMzRSxhQUFTLE1BQVQsQ0FEMkU7QUFFM0UsYUFBUyxTQUFULENBRjJFO0lBQTVFOztBQUtBLE9BQUksT0FBTyxFQUFFLE1BQUYsQ0FBUyxJQUFULEVBQWUsTUFBZixFQUF1QixFQUFDLFFBQVEsTUFBUixFQUF4QixDQUFQO09BQ0gsTUFBTSxDQUFDLEtBQUssUUFBTCxHQUFnQixLQUFLLFNBQUwsR0FBaUIsS0FBSyxTQUFMLEdBQWUsUUFBZjs7QUFDeEMsaUJBQWMsRUFBRSxLQUFLLFVBQUwsSUFBbUIsQ0FDbEMsaUJBQWUsR0FBZixHQUFtQixXQUFuQixHQUErQixHQUEvQixHQUFtQyxJQUFuQyxFQUNDLGlCQUFlLEdBQWYsR0FBbUIsWUFBbkIsRUFDQyxrQkFBZ0IsR0FBaEIsR0FBb0IsY0FBcEIsR0FBb0MsS0FBSyxTQUFMLEdBQWlCLFVBQXJELEVBQ0MsS0FBSyxTQUFMLEVBQ0QsU0FMZ0MsRUFNaEMsaUJBQWUsS0FBSyxTQUFMLEdBQWUsVUFBOUIsR0FBMkMsS0FBSyxPQUFMLEdBQWUsUUFBMUQsRUFDRCxRQVBpQyxFQVFsQyxRQVJrQyxFQVF4QixJQVJ3QixDQVFuQixFQVJtQixDQUFuQixDQUFoQjtPQVNBLHNCQUFzQixNQUFJLEtBQUssU0FBTCxHQUFlLFFBQW5CLElBQStCLEtBQUssVUFBTCxHQUFrQixNQUFNLEtBQUssVUFBTCxHQUFrQixFQUExQyxDQUEvQixDQWxCTzs7QUFvQjlCLFFBQUssU0FBTCxHQUFpQixZQUFZLEtBQVosR0FBb0IsUUFBcEIsQ0FBNkIsS0FBSyxPQUFMLENBQTlDOzs7QUFwQjhCLE9BdUI5QixDQUFLLFNBQUwsQ0FBZSxFQUFmLENBQWtCLEtBQUssWUFBTCxHQUFrQixHQUFsQixHQUFzQixLQUFLLFNBQUwsRUFBZ0IsVUFBUyxLQUFULEVBQWdCO0FBQ3ZFLFFBQUksVUFBVSxFQUFFLE1BQU0sTUFBTixDQUFaLENBRG1FO0FBRXZFLFFBQUksWUFBQyxLQUFpQixLQUFLLFlBQUwsSUFBc0IsUUFBUSxFQUFSLENBQVcsTUFBSSxLQUFLLFNBQUwsQ0FBdEQsSUFDRCxlQUFlLEtBQUssWUFBTCxJQUNmLFFBQVEsT0FBUixDQUFnQixtQkFBaEIsRUFBcUMsTUFBckMsRUFBNkM7QUFDaEQsVUFBSyxLQUFMLENBQVcsS0FBWCxFQURnRDtBQUVoRCxXQUFNLGNBQU4sR0FGZ0Q7S0FGakQ7SUFGdUQsQ0FBeEQsQ0F2QjhCOztBQWlDOUIsVUFBTyxJQUFQLENBakM4QjtHQUF4Qjs7O0FBcUNQLGNBQVksWUFBVTtBQUNyQixPQUFHLEtBQUssT0FBTCxLQUFpQixLQUFqQixJQUEwQixLQUFLLFFBQUwsRUFBZTtBQUMzQyxXQUFPLEtBQUssUUFBTCxDQURvQztJQUE1QztBQUdBLE9BQUksT0FBTyxJQUFQO09BQ0gsVUFBVSxLQUFLLFdBQUwsQ0FBaUIsY0FBakI7T0FDVixpQkFBaUIsVUFBUyxJQUFULEVBQWM7QUFBRSxXQUFPLEtBQUssY0FBTCxJQUF1QixLQUFLLGNBQUwsQ0FBb0IsSUFBcEIsQ0FBeUIsSUFBekIsQ0FBdkIsQ0FBVDtJQUFkO09BQ2pCLGNBQWMsZUFBZSxLQUFLLFVBQUwsQ0FBN0I7T0FDQSxPQUFPLEtBQUssTUFBTCxJQUFlLFdBQWYsSUFBOEIsRUFBOUI7OztBQVJhLE9BV2pCLFNBQVMsUUFBUSxLQUFLLElBQUwsQ0FBakI7OztBQVhpQixPQWNsQixDQUFDLE1BQUQsSUFBVyxRQUFRLE9BQVIsRUFBaUI7QUFDOUIsYUFBUyxRQUFRLElBQVIsQ0FBVCxDQUQ4QjtBQUU5QixXQUFPLEtBQUssTUFBTCxJQUFlLFdBQWYsQ0FGdUI7SUFBL0I7QUFJQSxVQUFPLFFBQVEsZUFBZSxNQUFmLENBQVIsSUFBa0MsRUFBbEM7OztBQWxCYyxPQXFCbEIsQ0FBQyxNQUFELEVBQVM7QUFDWCxTQUFJLElBQUksVUFBSixJQUFrQixPQUF0QixFQUErQjtBQUM5QixTQUFHLEtBQUssVUFBTCxDQUFILEVBQXFCO0FBQ3BCLGVBQVMsUUFBUSxVQUFSLENBQVQsQ0FEb0I7QUFFcEIsYUFBTyxLQUFLLFVBQUwsQ0FBUCxDQUZvQjtNQUFyQjtLQUREO0lBREQ7OztBQXJCcUIsT0ErQmxCLENBQUMsTUFBRCxFQUFTO0FBQ1gsUUFBSSxTQUFTLElBQVQsQ0FETztBQUVYLFdBQU8sSUFBUCxDQUZXO0FBR1gsTUFBRSxJQUFGLENBQU8sS0FBSyxjQUFMLEVBQXFCLFlBQVc7QUFDdEMsY0FBUyxRQUFRLElBQVIsQ0FBVCxDQURzQztBQUV0QyxTQUFHLE9BQU8sSUFBUCxFQUFjO0FBQ2hCLGFBQU8sT0FBTyxJQUFQLENBQVksTUFBWixDQUFQLENBRGdCO01BQWpCO0FBR0EsU0FBRyxDQUFDLElBQUQsSUFBUyxPQUFPLEtBQVAsSUFBZ0IsT0FBTyxLQUFQLElBQWdCLE9BQU8sS0FBUCxDQUFhLE9BQU8sS0FBUCxDQUF0RCxFQUFxRTtBQUN2RSxhQUFPLE1BQVAsQ0FEdUU7TUFBeEU7QUFHQSxZQUFPLENBQUMsSUFBRCxDQVIrQjtLQUFYLENBQTVCLENBSFc7QUFhWCxRQUFHLENBQUMsSUFBRCxFQUFPO0FBQ1QsU0FBRyxhQUFhLE1BQWIsRUFBb0I7QUFBRSxhQUFPLE9BQVAsQ0FBZSxLQUFmLENBQXFCLDRDQUE0QyxTQUFTLFdBQVcsTUFBWCxHQUFvQixHQUFwQixHQUEwQix3QkFBbkMsQ0FBNUMsQ0FBckIsQ0FBRjtNQUF2QjtBQUNBLFlBQU8sS0FBUCxDQUZTO0tBQVY7SUFiRDs7QUEvQnFCLFVBa0RkLE9BQU8sT0FBUCxDQUFlLElBQWYsQ0FBb0IsSUFBcEIsRUFBMEIsSUFBMUIsQ0FBUCxDQWxEcUI7R0FBVjs7O0FBc0RaLGNBQVksVUFBUyxRQUFULEVBQWtCO0FBQzdCLE9BQUksT0FBTyxJQUFQOztBQUR5QixPQUcxQixTQUFTLEVBQVQsQ0FBWSxRQUFaLEtBQXlCLEVBQUUsUUFBRixFQUFZLFFBQVosRUFBc0IsTUFBdEIsR0FBK0IsQ0FBL0IsRUFBaUM7QUFDNUQsU0FBSyxTQUFMLENBQWUsUUFBZixDQUF3QixLQUFLLFNBQUwsR0FBZSxTQUFmLENBQXhCLENBRDREO0lBQTdEOztBQUlBLFFBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsS0FBSyxTQUFMLEdBQWUsVUFBZixDQUEzQjs7Ozs7QUFQNkIsT0FZN0IsQ0FBSyxTQUFMLENBQWUsSUFBZixDQUFvQixNQUFJLEtBQUssU0FBTCxHQUFlLFFBQW5CLENBQXBCLENBQ0UsR0FERixDQUNNLFFBRE47SUFFRSxLQUZGLENBRVEsQ0FGUixFQUVXLE1BRlgsR0FFb0IsR0FGcEI7SUFHRSxXQUhGLENBR2MsRUFBRSxRQUFGLENBQVcsS0FBSyxTQUFMLENBQWUsQ0FBZixDQUFYLEVBQThCLFNBQVMsQ0FBVCxDQUE5QixJQUE2QyxFQUE3QyxHQUFrRCxRQUFsRCxDQUhkLENBWjZCOztBQWlCN0IsUUFBSyxRQUFMLEdBQWdCLFNBQVMsUUFBVCxDQUFrQixLQUFLLFNBQUwsR0FBZSxRQUFmLENBQWxDLENBakI2Qjs7QUFtQjdCLFVBQU8sSUFBUCxDQW5CNkI7R0FBbEI7Ozs7QUF3QlosUUFBTSxVQUFTLEtBQVQsRUFBZTtBQUNwQixPQUFJLE9BQU8sSUFBUCxDQURnQjtBQUVwQixRQUFLLFNBQUwsQ0FBZSxJQUFmLEdBQXNCLFFBQXRCLENBQStCLEtBQUssSUFBTCxDQUEvQixDQUZvQjtBQUdwQixPQUFHLENBQUMsQ0FBQyxLQUFELElBQVUsQ0FBQyxNQUFNLGtCQUFOLEVBQUQsQ0FBWCxJQUNDLEtBQUssVUFBTCxDQUFnQixLQUFoQixNQUEyQixLQUEzQixFQUFrQzs7QUFFckMsUUFBRyxLQUFILEVBQVM7QUFDUixXQUFNLGNBQU4sR0FEUTtLQUFUO0FBR0EsUUFBSSxXQUFXLEtBQUssVUFBTCxFQUFYLENBTGlDOztBQU9yQyxRQUFHLFFBQUgsRUFBYTtBQUNaLFlBQU8sSUFBUCxDQUFZLElBQVosRUFEWTs7QUFHWix3QkFBbUIsSUFBbkIsRUFIWTs7QUFLWixVQUFLLFNBQUwsQ0FBZSxNQUFmLENBQXNCLEtBQUssU0FBTCxDQUF0QixDQUxZO0FBTVosVUFBSyxhQUFMLENBQW1CLEtBQW5COzs7QUFOWSxZQVNMLEVBQUUsSUFBRixDQUFPLFFBQVAsRUFDTCxNQURLLENBQ0UsVUFBUyxRQUFULEVBQWtCO0FBQ3pCLFdBQUssVUFBTCxDQUFnQixRQUFoQixFQUR5QjtBQUV6QixXQUFLLFlBQUwsQ0FBa0IsS0FBbEIsRUFGeUI7TUFBbEIsQ0FERixDQUtMLElBTEssQ0FLQSxLQUFLLFNBQUwsQ0FBZSxPQUFmLEVBTEE7O01BT0wsSUFQSyxDQU9BLFlBQVU7QUFBRSxXQUFLLFNBQUwsQ0FBZSxLQUFmLEVBQUY7TUFBVixDQVBQLENBVFk7S0FBYjtJQVJEO0FBMkJBLFFBQUssU0FBTCxDQUFlLE1BQWYsR0E5Qm9CO0FBK0JwQixVQUFPLEVBQUUsUUFBRixHQUFhLE1BQWIsR0FBc0IsT0FBdEIsRUFBUCxDQS9Cb0I7R0FBZjs7OztBQW9DTixTQUFPLFVBQVMsS0FBVCxFQUFlO0FBQ3JCLE9BQUksT0FBTyxJQUFQO09BQ0gsV0FBVyxFQUFFLFFBQUYsRUFBWCxDQUZvQjs7QUFJckIsT0FBRyxLQUFLLFdBQUwsQ0FBaUIsS0FBakIsTUFBNEIsS0FBNUIsRUFBbUM7QUFDckMsYUFBUyxNQUFULEdBRHFDO0lBQXRDLE1BRU87O0FBRU4sUUFBSSxNQUFNLFlBQVksSUFBWixFQUFrQixNQUFsQixFQUEwQjtBQUNuQyx3QkFBbUIsS0FBbkIsRUFEbUM7S0FBcEM7O0FBSUEsU0FBSyxTQUFMLENBQWUsT0FBZixDQUF1QixLQUFLLFVBQUwsRUFBZ0IsWUFBVTtBQUNoRCxVQUFLLFNBQUwsQ0FBZSxNQUFmLEdBRGdEO0FBRWhELFVBQUssVUFBTCxDQUFnQixLQUFoQixFQUZnRDtBQUdoRCxjQUFTLE9BQVQsR0FIZ0Q7S0FBVixDQUF2QyxDQU5NO0lBRlA7QUFjQSxVQUFPLFNBQVMsT0FBVCxFQUFQLENBbEJxQjtHQUFmOzs7Ozs7Ozs7QUE0QlAsa0JBQWdCLFVBQVMsS0FBVCxFQUFnQjtBQUMvQixRQUFLLElBQUksSUFBSixJQUFZLEtBQWpCLEVBQXdCO0FBQ3ZCLFNBQUssSUFBTCxJQUFhLEVBQUUsS0FBRixDQUFRLE1BQU0sSUFBTixDQUFSLEVBQXFCLElBQXJCLEVBQTJCLEVBQUUsS0FBRixDQUFRLEtBQUssSUFBTCxDQUFSLEVBQW9CLElBQXBCLENBQTNCLENBQWIsQ0FEdUI7SUFBeEI7R0FEZTtFQXJOakIsQ0FyRlk7O0FBaVRaLEdBQUUsTUFBRixDQUFTLFlBQVQsRUFBdUI7QUFDdEIsTUFBSSxDQUFKO0FBQ0EsWUFBZ0IscUJBQWhCO0FBQ0EsWUFBZ0IsYUFBYSxTQUFiOztBQUVoQixrQkFBZ0I7QUFDZixXQUFRO0FBQ1AsV0FBTyxTQUFQO0FBQ0EsVUFBTSxVQUFTLElBQVQsRUFBa0I7QUFBRSxZQUFPLGdCQUFnQixDQUFoQixJQUFxQixJQUFyQixDQUFUO0tBQWxCO0FBQ04sYUFBUyxVQUFTLElBQVQsRUFBZTtBQUFFLFlBQU8sS0FBSyxPQUFMLEtBQWlCLEtBQWpCLEdBQXlCLEVBQUUsSUFBRixDQUF6QixHQUFtQyxFQUFFLElBQUYsRUFBUSxLQUFSLENBQWMsSUFBZCxDQUFuQyxDQUFUO0tBQWY7SUFIVjtBQUtBLFVBQU87QUFDTixXQUFPLDZDQUFQO0FBQ0EsYUFBUyxVQUFTLEdBQVQsRUFBZTtBQUN2QixTQUFJLE9BQU8sSUFBUDtTQUNILFdBQVcsRUFBRSxRQUFGLEVBQVg7U0FDQSxNQUFNLElBQUksS0FBSixFQUFOO1NBQ0EsT0FBTyxFQUFFLGVBQWEsR0FBYixHQUFpQixrQkFBakIsR0FBb0MsS0FBSyxTQUFMLEdBQWUsWUFBbkQsQ0FBVCxDQUpzQjtBQUt2QixTQUFJLE1BQUosR0FBYyxZQUFXOztBQUV4QixXQUFLLFlBQUwsR0FBb0IsSUFBSSxLQUFKLENBRkksSUFFTyxDQUFLLGFBQUwsR0FBcUIsSUFBSSxNQUFKLENBRjVCO0FBR3hCLGVBQVMsT0FBVCxDQUFrQixJQUFsQixFQUh3QjtNQUFYLENBTFM7QUFVdkIsU0FBSSxPQUFKLEdBQWMsWUFBVztBQUFFLGVBQVMsTUFBVCxDQUFnQixJQUFoQixFQUFGO01BQVgsQ0FWUztBQVd2QixTQUFJLEdBQUosR0FBVSxHQUFWLENBWHVCO0FBWXZCLFlBQU8sU0FBUyxPQUFULEVBQVAsQ0FadUI7S0FBZjtJQUZWO0FBaUJBLFNBQU07QUFDTCxXQUFPLGtCQUFQO0FBQ0EsYUFBUyxVQUFTLElBQVQsRUFBZTtBQUFFLFlBQU8sRUFBRSxJQUFGLENBQVAsQ0FBRjtLQUFmO0lBRlY7QUFJQSxTQUFNO0FBQ0wsV0FBTyxHQUFQO0FBQ0EsYUFBUyxVQUFTLEdBQVQsRUFBZTtBQUN2QixTQUFJLE9BQU8sSUFBUDtTQUNILFdBQVcsRUFBRSxRQUFGLEVBQVg7O0FBRnNCLFNBSW5CLGFBQWEsRUFBRSxhQUFGLEVBQWlCLElBQWpCLENBQXNCLEdBQXRCLEVBQTJCLFVBQVMsUUFBVCxFQUFtQixNQUFuQixFQUEwQjtBQUNyRSxVQUFLLFdBQVcsT0FBWCxFQUFxQjtBQUN6QixnQkFBUyxPQUFULENBQWlCLFdBQVcsUUFBWCxFQUFqQixFQUR5QjtPQUExQjtBQUdBLGVBQVMsSUFBVCxHQUpxRTtNQUExQixDQUF4QyxDQUptQjtBQVV2QixZQUFPLFNBQVMsT0FBVCxFQUFQLENBVnVCO0tBQWY7SUFGVjtBQWVBLFdBQVE7QUFDUCxhQUFTLFVBQVMsR0FBVCxFQUFjO0FBQ3RCLFNBQUksV0FBVyxJQUFJLEVBQUUsUUFBRixFQUFmLENBRGtCO0FBRXRCLFNBQUksV0FBVyxFQUFFLFdBQUYsRUFDYixJQURhLEdBRWIsSUFGYSxDQUVSLEtBRlEsRUFFRCxHQUZDLEVBR2IsR0FIYSxDQUdULFVBQVUsSUFBVixFQUFnQixRQUFoQixDQUhTLEVBSWIsRUFKYSxDQUlWLE1BSlUsRUFJRixZQUFXO0FBQUUsZUFBUyxPQUFULENBQWlCLFNBQVMsSUFBVCxFQUFqQixFQUFGO01BQVg7OztBQUpFLE1BT2IsUUFQYSxDQU9KLEtBQUssU0FBTCxDQUFlLElBQWYsQ0FBb0IsTUFBTSxLQUFLLFNBQUwsR0FBaUIsVUFBdkIsQ0FQaEIsQ0FBWCxDQUZrQjtBQVV0QixZQUFPLFNBQVMsT0FBVCxFQUFQLENBVnNCO0tBQWQ7SUFEVjtBQWNBLFNBQU07QUFDTCxhQUFTLFVBQVMsSUFBVCxFQUFlO0FBQUUsWUFBTyxFQUFFLE9BQUYsRUFBVyxFQUFDLE1BQU0sSUFBTixFQUFaLENBQVAsQ0FBRjtLQUFmO0lBRFY7R0F4REQ7O0FBNkRBLHNCQUFvQixDQUFDLFlBQUQsRUFBZSxXQUFmLEVBQTRCLGVBQTVCLEVBQTZDLGNBQTdDLEVBQTZELGFBQTdELEVBQTRFLFlBQTVFLENBQXBCOzs7O0FBSUEscUJBQW1CLFVBQVMsT0FBVCxFQUFrQixTQUFsQixFQUE2QjtBQUMvQyxPQUFJLFFBQVEsSUFBUjtPQUNILFNBQVMsSUFBSSxNQUFKLENBQVcsV0FBVyxTQUFYLEdBQXVCLE9BQXZCLENBQXBCO09BQ0EsU0FBUyxFQUFULENBSDhDO0FBSS9DLE9BQUksV0FBVyxRQUFRLFVBQVIsRUFBb0I7QUFDbEMsTUFBRSxJQUFGLENBQU8sUUFBUSxVQUFSLEVBQW9CLFlBQVU7QUFDcEMsU0FBSSxRQUFRLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsTUFBaEIsQ0FBUixDQURnQztBQUVwQyxTQUFJLEtBQUosRUFBVztBQUNWLFVBQUksTUFBTSxLQUFLLEtBQUw7VUFDVCxPQUFPLEVBQUUsU0FBRixDQUFZLE1BQU0sQ0FBTixDQUFaLENBQVAsQ0FGUztBQUdWLFVBQUksRUFBRSxPQUFGLENBQVUsSUFBVixFQUFnQixNQUFNLGtCQUFOLENBQWhCLElBQTZDLENBQTdDLEVBQWdEOztBQUNuRCxhQUFNLElBQUksUUFBSixDQUFhLEdBQWIsQ0FBTjtBQURtRCxPQUFwRCxNQUVPO0FBQ04sWUFBSTtBQUFFLGVBQU0sRUFBRSxTQUFGLENBQVksR0FBWixDQUFOLENBQUY7U0FBSixDQUNBLE9BQU0sQ0FBTixFQUFTLEVBQVQ7UUFKRDtBQU1BLGFBQU8sSUFBUCxJQUFlLEdBQWYsQ0FUVTtNQUFYO0tBRjBCLENBQTNCLENBRGtDO0lBQW5DO0FBZ0JBLFVBQU8sTUFBUCxDQXBCK0M7R0FBN0I7Ozs7Ozs7Ozs7OztBQWlDbkIsVUFBUSxVQUFTLEtBQVQsRUFBZ0IsUUFBaEIsRUFBMEI7O0FBRWpDLE9BQUksT0FBTyxZQUFVO0FBQUUsU0FBSyxXQUFMLEdBQW1CLEtBQW5CLENBQUY7SUFBVixDQUZzQjtBQUdqQyxRQUFLLFNBQUwsR0FBaUIsS0FBSyxTQUFMLENBSGdCO0FBSWpDLFNBQU0sU0FBTixHQUFrQixJQUFJLElBQUosRUFBbEIsQ0FKaUM7QUFLakMsU0FBTSxTQUFOLEdBQWtCLEtBQUssU0FBTDs7QUFMZSxJQU9qQyxDQUFFLE1BQUYsQ0FBUyxLQUFULEVBQWdCLElBQWhCLEVBQXNCLFFBQXRCLEVBUGlDO0FBUWpDLFNBQU0sUUFBTixHQUFpQixNQUFNLFNBQU4sQ0FSZ0I7QUFTakMsVUFBTyxLQUFQLENBVGlDO0dBQTFCOztBQVlSLFVBQVEsVUFBUyxPQUFULEVBQWtCLFFBQWxCLEVBQTRCLE1BQTVCLEVBQW9DO0FBQzNDLE9BQUksUUFBUSxJQUFSLENBRHVDO0FBRTNDLE9BQUksT0FBTyxRQUFQLEtBQW9CLFFBQXBCLElBQWdDLG9CQUFvQixDQUFwQixLQUEwQixLQUExQixJQUFtQyxDQUFDLE1BQUQsRUFBUztBQUMvRSxhQUFTLFFBQVQsQ0FEK0U7QUFFL0UsZUFBVyxTQUFYLENBRitFO0lBQWhGOztBQUYyQyxTQU8zQyxHQUFTLEVBQUUsTUFBRixDQUFTLEVBQVQsRUFBYSxNQUFiLENBQVQ7OztBQVAyQyxPQVV2QyxZQUFZLE9BQU8sU0FBUCxJQUFvQixNQUFNLFFBQU4sQ0FBZSxTQUFmO09BQ25DLGFBQWEsRUFBRSxNQUFGLENBQVMsRUFBVCxFQUFhLE1BQU0sUUFBTixFQUFnQixNQUFNLGlCQUFOLENBQXdCLFFBQVEsQ0FBUixDQUF4QixFQUFvQyxTQUFwQyxDQUE3QixFQUE2RSxNQUE3RSxDQUFiO09BQ0EsYUFGRCxDQVYyQzs7QUFjM0MsV0FBUSxFQUFSLENBQVcsV0FBVyxXQUFYLEdBQXVCLEdBQXZCLEdBQTJCLFdBQVcsU0FBWCxFQUFzQixXQUFXLE1BQVgsRUFBbUIsVUFBUyxLQUFULEVBQWdCOztBQUU5RixRQUFJLGFBQWEsRUFBRSxNQUFGLENBQ2hCLEVBQUMsU0FBUyxPQUFULEVBQWtCLGdCQUFnQixFQUFFLElBQUYsQ0FBaEIsRUFESCxFQUVoQixNQUFNLGlCQUFOLENBQXdCLFFBQVEsQ0FBUixDQUF4QixFQUFvQyxXQUFXLFNBQVgsQ0FGcEIsRUFHaEIsTUFBTSxpQkFBTixDQUF3QixJQUF4QixFQUE4QixXQUFXLFNBQVgsQ0FIZCxFQUloQixNQUpnQixDQUFiLENBRjBGO0FBTzlGLFFBQUksS0FBSyxpQkFBaUIsRUFBRSxJQUFGLEVBQVEsSUFBUixDQUFhLHdCQUFiLENBQWpCLElBQTJELElBQUksS0FBSixDQUFVLFFBQVYsRUFBb0IsVUFBcEIsQ0FBM0QsQ0FQcUY7QUFROUYsUUFBRyxHQUFHLE9BQUgsS0FBZSxRQUFmLEVBQXlCO0FBQzNCLHFCQUFnQixFQUFoQixDQUQyQjtLQUE1QixNQUVPLElBQUcsR0FBRyxPQUFILEtBQWUsS0FBZixFQUFzQjtBQUMvQixPQUFFLElBQUYsRUFBUSxJQUFSLENBQWEsd0JBQWIsRUFBdUMsRUFBdkMsRUFEK0I7S0FBekI7QUFHUCxlQUFXLGNBQVgsQ0FBMEIsSUFBMUI7QUFiOEYsTUFjOUYsQ0FBRyxJQUFILENBQVEsS0FBUixFQWQ4RjtJQUFoQixDQUEvRSxDQWQyQztBQThCM0MsVUFBTyxPQUFQLENBOUIyQztHQUFwQzs7QUFpQ1IsV0FBUyxZQUFXO0FBQ25CLE9BQUksTUFBTSxLQUFLLE1BQUwsRUFBTixDQURlO0FBRW5CLFVBQU8sSUFBSSxJQUFJLE1BQUosR0FBYSxDQUFiLENBQUosSUFBdUIsSUFBdkIsQ0FGWTtHQUFYOztBQUtULFVBQVEsWUFBVztBQUNsQixPQUFJLFFBQVEsSUFBUixDQURjO0FBRWxCLGlCQUZrQjtBQUdsQixVQUFPLEVBQUUsSUFBRixDQUFPLE1BQVAsRUFBZSxVQUFTLEVBQVQsRUFBYTtBQUFFLFdBQU8sY0FBYyxLQUFkLENBQVQ7SUFBYixDQUF0QixDQUhrQjtHQUFYOztBQU1SLFNBQU8sVUFBUyxLQUFULEVBQWdCO0FBQ3RCLE9BQUksTUFBTSxLQUFLLE9BQUwsRUFBTixDQURrQjtBQUV0QixPQUFHLEdBQUgsRUFBUTtBQUFFLFdBQU8sSUFBSSxLQUFKLENBQVUsS0FBVixDQUFQLENBQUY7SUFBUjtHQUZNOzs7OztBQVFQLFlBQVUsWUFBVztBQUNwQixPQUFJLFFBQVEsSUFBUixDQURnQjtBQUVwQixPQUFHLE1BQU0sUUFBTixFQUFlOztBQUVqQixNQUFFLE1BQU0sUUFBTixDQUFGLENBQWtCLElBQWxCLENBQXVCLFlBQVU7QUFDaEMsV0FBTSxNQUFOLENBQWEsRUFBRSxJQUFGLENBQWIsRUFEZ0M7S0FBVixDQUF2Qjs7QUFGaUIsS0FNakIsQ0FBRSxRQUFGLEVBQVksRUFBWixDQUFlLE9BQWYsRUFBd0IsTUFBTSxRQUFOLEVBQWdCLFVBQVMsR0FBVCxFQUFjO0FBQ3JELFNBQUksSUFBSSxrQkFBSixNQUE0QixJQUFJLFNBQUosS0FBa0IsY0FBbEIsRUFBa0M7QUFDakUsYUFEaUU7TUFBbEU7QUFHQSxTQUFJLGNBQUo7O0FBSnFELFVBTXJELENBQU0sTUFBTixDQUFhLEVBQUUsSUFBSSxhQUFKLENBQWY7O0FBTnFELE1BUXJELENBQUUsSUFBSSxNQUFKLENBQUYsQ0FBYyxPQUFkLENBQXNCLG9CQUF0QixFQVJxRDtLQUFkLENBQXhDLENBTmlCO0lBQWxCO0dBRlM7Ozs7O0FBd0JWLGtCQUFnQjtBQUNmLFlBQVMsVUFBUyxNQUFULEVBQWlCLEtBQWpCLEVBQXVCO0FBQy9CLFFBQUcsT0FBTyxNQUFNLE9BQU4sRUFBZTtBQUN4QixTQUFJLEtBQUssVUFBTCxFQUFpQjtBQUNwQixRQUFFLFlBQUYsQ0FBZSxLQUFmLENBQXFCLEtBQXJCLEVBRG9CO01BQXJCO0FBR0EsWUFBTyxLQUFQLENBSndCO0tBQXpCLE1BS087QUFDTixZQUFPLE9BQU8sS0FBUCxDQUFQLENBRE07S0FMUDtJQURROztBQVdULGFBQVUsVUFBUyxNQUFULEVBQWlCLEtBQWpCLEVBQXVCO0FBQ2hDLFFBQUksS0FBSyxRQUFMLENBQWMsWUFBZCxFQUE0QjtBQUMvQixTQUFJLElBQUksS0FBSyxRQUFMLENBQWMsWUFBZDtTQUE0QixJQUFJLEtBQUssUUFBTCxDQUFjLGFBQWQ7O0FBRFQsU0FHL0IsQ0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixPQUFsQixFQUEyQixFQUEzQixFQUErQixHQUEvQixDQUFtQyxRQUFuQyxFQUE2QyxFQUE3Qzs7QUFIK0IsU0FLM0IsUUFBUSxLQUFLLEdBQUwsQ0FDWCxJQUFLLFNBQVMsS0FBSyxRQUFMLENBQWMsTUFBZCxHQUF1QixHQUF2QixDQUEyQixPQUEzQixDQUFULEVBQTZDLEVBQTdDLENBQUwsRUFDQSxJQUFJLFNBQVMsS0FBSyxRQUFMLENBQWMsTUFBZCxHQUF1QixHQUF2QixDQUEyQixRQUEzQixDQUFULEVBQThDLEVBQTlDLENBQUosQ0FGRzs7QUFMMkIsU0FTM0IsUUFBUSxDQUFSLEVBQVc7QUFDZCxXQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLE9BQWxCLEVBQTJCLEtBQUssSUFBSSxLQUFKLEdBQVksSUFBakIsQ0FBM0IsQ0FBa0QsR0FBbEQsQ0FBc0QsUUFBdEQsRUFBZ0UsS0FBSyxJQUFJLEtBQUosR0FBWSxJQUFqQixDQUFoRSxDQURjO01BQWY7S0FURDtBQWFBLFdBQU8sT0FBTyxLQUFQLENBQVAsQ0FkZ0M7SUFBdkI7O0FBaUJWLGlCQUFjLFVBQVMsTUFBVCxFQUFpQixLQUFqQixFQUF1QjtBQUNwQyxRQUFJLElBQUksT0FBTyxLQUFQLENBQUosQ0FEZ0M7QUFFcEMsU0FBSyxRQUFMLENBQWMsS0FBZCxFQUZvQztBQUdwQyxXQUFPLENBQVAsQ0FIb0M7SUFBdkI7R0E3QmY7RUEvTEQsRUFqVFk7O0FBcWhCWixHQUFFLFlBQUYsR0FBaUIsWUFBakI7OztBQXJoQlksRUF3aEJaLENBQUUsRUFBRixDQUFLLFlBQUwsR0FBb0IsVUFBUyxRQUFULEVBQW1CLE1BQW5CLEVBQTJCO0FBQzlDLFNBQU8sYUFBYSxNQUFiLENBQW9CLElBQXBCLEVBQTBCLFFBQTFCLEVBQW9DLE1BQXBDLENBQVAsQ0FEOEM7RUFBM0I7OztBQXhoQlIsRUE2aEJaLENBQUUsUUFBRixFQUFZLEtBQVosQ0FBa0IsWUFBVTtBQUFFLGVBQWEsUUFBYixHQUFGO0VBQVYsQ0FBbEIsQ0E3aEJZO0NBQVosRUE4aEJDLE1BOWhCRCxDQUFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDU0EsQ0FBRSxVQUFVLE1BQVYsRUFBa0IsT0FBbEIsRUFBNEI7QUFDNUI7OztBQUQ0QixNQUl2QixPQUFPLE1BQVAsSUFBaUIsVUFBakIsSUFBK0IsT0FBTyxHQUFQLEVBQWE7O0FBRS9DLFdBQVEsK0JBQVIsRUFBd0MsQ0FBRSxRQUFGLENBQXhDLEVBQXNELFVBQVUsTUFBVixFQUFtQjtBQUN2RSxjQUFTLE1BQVQsRUFBaUIsTUFBakIsRUFEdUU7S0FBbkIsQ0FBdEQsQ0FGK0M7R0FBakQsTUFLTyxJQUFLLE9BQU8sTUFBUCxJQUFpQixRQUFqQixJQUE2QixPQUFPLE9BQVAsRUFBaUI7O0FBRXhELFdBQU8sT0FBUCxHQUFpQixRQUNmLE1BRGUsRUFFZixRQUFRLFFBQVIsQ0FGZSxDQUFqQixDQUZ3RDtHQUFuRCxNQU1BOztBQUVMLFdBQU8sYUFBUCxHQUF1QixRQUNyQixNQURxQixFQUVyQixPQUFPLE1BQVAsQ0FGRixDQUZLO0dBTkE7Q0FUUCxFQXVCQyxNQXZCRCxFQXVCUyxTQUFTLE9BQVQsQ0FBa0IsTUFBbEIsRUFBMEIsTUFBMUIsRUFBbUM7QUFDOUM7Ozs7QUFEOEMsTUFLMUMsYUFBYSxNQUFNLFNBQU4sQ0FBZ0IsS0FBaEI7Ozs7QUFMNkIsTUFTMUMsVUFBVSxPQUFPLE9BQVAsQ0FUZ0M7QUFVOUMsTUFBSSxXQUFXLE9BQU8sT0FBUCxJQUFrQixXQUFsQixHQUFnQyxZQUFXLEVBQVgsR0FDN0MsVUFBVSxPQUFWLEVBQW9CO0FBQ2xCLFlBQVEsS0FBUixDQUFlLE9BQWYsRUFEa0I7R0FBcEI7Ozs7QUFYNEMsV0FpQnJDLGFBQVQsQ0FBd0IsU0FBeEIsRUFBbUMsV0FBbkMsRUFBZ0QsQ0FBaEQsRUFBb0Q7QUFDbEQsUUFBSSxLQUFLLE1BQUwsSUFBZSxPQUFPLE1BQVAsQ0FEK0I7QUFFbEQsUUFBSyxDQUFDLENBQUQsRUFBSztBQUNSLGFBRFE7S0FBVjs7O0FBRmtELFFBTzdDLENBQUMsWUFBWSxTQUFaLENBQXNCLE1BQXRCLEVBQStCOztBQUVuQyxrQkFBWSxTQUFaLENBQXNCLE1BQXRCLEdBQStCLFVBQVUsSUFBVixFQUFpQjs7QUFFOUMsWUFBSyxDQUFDLEVBQUUsYUFBRixDQUFpQixJQUFqQixDQUFELEVBQTBCO0FBQzdCLGlCQUQ2QjtTQUEvQjtBQUdBLGFBQUssT0FBTCxHQUFlLEVBQUUsTUFBRixDQUFVLElBQVYsRUFBZ0IsS0FBSyxPQUFMLEVBQWMsSUFBOUIsQ0FBZixDQUw4QztPQUFqQixDQUZJO0tBQXJDOzs7QUFQa0QsS0FtQmxELENBQUUsRUFBRixDQUFNLFNBQU4sSUFBb0IsVUFBVSxnQkFBVixFQUE2QjtBQUMvQyxVQUFLLE9BQU8sSUFBUCxJQUFlLFFBQWYsRUFBMEI7OztBQUc3QixZQUFJLE9BQU8sV0FBVyxJQUFYLENBQWlCLFNBQWpCLEVBQTRCLENBQTVCLENBQVAsQ0FIeUI7QUFJN0IsZUFBTyxXQUFZLElBQVosRUFBa0IsSUFBbEIsRUFBd0IsSUFBeEIsQ0FBUCxDQUo2QjtPQUEvQjs7QUFEK0MsZUFRL0MsQ0FBVyxJQUFYLEVBQWlCLElBQWpCLEVBUitDO0FBUy9DLGFBQU8sSUFBUCxDQVQrQztLQUE3Qjs7O0FBbkI4QixhQWdDekMsVUFBVCxDQUFxQixNQUFyQixFQUE2QixVQUE3QixFQUF5QyxJQUF6QyxFQUFnRDtBQUM5QyxVQUFJLFdBQUosQ0FEOEM7QUFFOUMsVUFBSSxrQkFBa0IsU0FBUyxTQUFULEdBQXFCLElBQXJCLEdBQTRCLFVBQTVCLEdBQXlDLElBQXpDLENBRndCOztBQUk5QyxhQUFPLElBQVAsQ0FBYSxVQUFVLENBQVYsRUFBYSxJQUFiLEVBQW9COztBQUUvQixZQUFJLFdBQVcsRUFBRSxJQUFGLENBQVEsSUFBUixFQUFjLFNBQWQsQ0FBWCxDQUYyQjtBQUcvQixZQUFLLENBQUMsUUFBRCxFQUFZO0FBQ2YsbUJBQVUsWUFBWSw4Q0FBWixHQUNSLGVBRFEsQ0FBVixDQURlO0FBR2YsaUJBSGU7U0FBakI7O0FBTUEsWUFBSSxTQUFTLFNBQVUsVUFBVixDQUFULENBVDJCO0FBVS9CLFlBQUssQ0FBQyxNQUFELElBQVcsV0FBVyxNQUFYLENBQWtCLENBQWxCLEtBQXdCLEdBQXhCLEVBQThCO0FBQzVDLG1CQUFVLGtCQUFrQix3QkFBbEIsQ0FBVixDQUQ0QztBQUU1QyxpQkFGNEM7U0FBOUM7OztBQVYrQixZQWdCM0IsUUFBUSxPQUFPLEtBQVAsQ0FBYyxRQUFkLEVBQXdCLElBQXhCLENBQVI7O0FBaEIyQixtQkFrQi9CLEdBQWMsZ0JBQWdCLFNBQWhCLEdBQTRCLEtBQTVCLEdBQW9DLFdBQXBDLENBbEJpQjtPQUFwQixDQUFiLENBSjhDOztBQXlCOUMsYUFBTyxnQkFBZ0IsU0FBaEIsR0FBNEIsV0FBNUIsR0FBMEMsTUFBMUMsQ0F6QnVDO0tBQWhEOztBQTRCQSxhQUFTLFNBQVQsQ0FBb0IsTUFBcEIsRUFBNEIsT0FBNUIsRUFBc0M7QUFDcEMsYUFBTyxJQUFQLENBQWEsVUFBVSxDQUFWLEVBQWEsSUFBYixFQUFvQjtBQUMvQixZQUFJLFdBQVcsRUFBRSxJQUFGLENBQVEsSUFBUixFQUFjLFNBQWQsQ0FBWCxDQUQyQjtBQUUvQixZQUFLLFFBQUwsRUFBZ0I7O0FBRWQsbUJBQVMsTUFBVCxDQUFpQixPQUFqQixFQUZjO0FBR2QsbUJBQVMsS0FBVCxHQUhjO1NBQWhCLE1BSU87O0FBRUwscUJBQVcsSUFBSSxXQUFKLENBQWlCLElBQWpCLEVBQXVCLE9BQXZCLENBQVgsQ0FGSztBQUdMLFlBQUUsSUFBRixDQUFRLElBQVIsRUFBYyxTQUFkLEVBQXlCLFFBQXpCLEVBSEs7U0FKUDtPQUZXLENBQWIsQ0FEb0M7S0FBdEM7O0FBZUEsaUJBQWMsQ0FBZCxFQTNFa0Q7R0FBcEQ7Ozs7O0FBakI4QyxXQW1HckMsWUFBVCxDQUF1QixDQUF2QixFQUEyQjtBQUN6QixRQUFLLENBQUMsQ0FBRCxJQUFRLEtBQUssRUFBRSxPQUFGLEVBQWM7QUFDOUIsYUFEOEI7S0FBaEM7QUFHQSxNQUFFLE9BQUYsR0FBWSxhQUFaLENBSnlCO0dBQTNCOztBQU9BLGVBQWMsVUFBVSxPQUFPLE1BQVAsQ0FBeEI7Ozs7QUExRzhDLFNBOEd2QyxhQUFQLENBOUc4QztDQUFuQyxDQXZCWDs7Ozs7Ozs7OztBQWlKQSxDQUFFLFVBQVUsTUFBVixFQUFrQixPQUFsQixFQUE0Qjs7O0FBRzVCLE1BQUssT0FBTyxNQUFQLElBQWlCLFVBQWpCLElBQStCLE9BQU8sR0FBUCxFQUFhOztBQUUvQyxXQUFRLHVCQUFSLEVBQWdDLE9BQWhDLEVBRitDO0dBQWpELE1BR08sSUFBSyxPQUFPLE1BQVAsSUFBaUIsUUFBakIsSUFBNkIsT0FBTyxPQUFQLEVBQWlCOztBQUV4RCxXQUFPLE9BQVAsR0FBaUIsU0FBakIsQ0FGd0Q7R0FBbkQsTUFHQTs7QUFFTCxXQUFPLFNBQVAsR0FBbUIsU0FBbkIsQ0FGSztHQUhBO0NBTlAsRUFjQyxJQWRELEVBY08sWUFBVzs7QUFJcEIsV0FBUyxTQUFULEdBQXFCLEVBQXJCOztBQUVBLE1BQUksUUFBUSxVQUFVLFNBQVYsQ0FOUTs7QUFRcEIsUUFBTSxFQUFOLEdBQVcsVUFBVSxTQUFWLEVBQXFCLFFBQXJCLEVBQWdDO0FBQ3pDLFFBQUssQ0FBQyxTQUFELElBQWMsQ0FBQyxRQUFELEVBQVk7QUFDN0IsYUFENkI7S0FBL0I7O0FBRHlDLFFBS3JDLFNBQVMsS0FBSyxPQUFMLEdBQWUsS0FBSyxPQUFMLElBQWdCLEVBQWhCOztBQUxhLFFBT3JDLFlBQVksT0FBUSxTQUFSLElBQXNCLE9BQVEsU0FBUixLQUF1QixFQUF2Qjs7QUFQRyxRQVNwQyxVQUFVLE9BQVYsQ0FBbUIsUUFBbkIsS0FBaUMsQ0FBQyxDQUFELEVBQUs7QUFDekMsZ0JBQVUsSUFBVixDQUFnQixRQUFoQixFQUR5QztLQUEzQzs7QUFJQSxXQUFPLElBQVAsQ0FieUM7R0FBaEMsQ0FSUzs7QUF3QnBCLFFBQU0sSUFBTixHQUFhLFVBQVUsU0FBVixFQUFxQixRQUFyQixFQUFnQztBQUMzQyxRQUFLLENBQUMsU0FBRCxJQUFjLENBQUMsUUFBRCxFQUFZO0FBQzdCLGFBRDZCO0tBQS9COztBQUQyQyxRQUszQyxDQUFLLEVBQUwsQ0FBUyxTQUFULEVBQW9CLFFBQXBCOzs7QUFMMkMsUUFRdkMsYUFBYSxLQUFLLFdBQUwsR0FBbUIsS0FBSyxXQUFMLElBQW9CLEVBQXBCOztBQVJPLFFBVXZDLGdCQUFnQixXQUFZLFNBQVosSUFBMEIsV0FBWSxTQUFaLEtBQTJCLEVBQTNCOztBQVZILGlCQVkzQyxDQUFlLFFBQWYsSUFBNEIsSUFBNUIsQ0FaMkM7O0FBYzNDLFdBQU8sSUFBUCxDQWQyQztHQUFoQyxDQXhCTzs7QUF5Q3BCLFFBQU0sR0FBTixHQUFZLFVBQVUsU0FBVixFQUFxQixRQUFyQixFQUFnQztBQUMxQyxRQUFJLFlBQVksS0FBSyxPQUFMLElBQWdCLEtBQUssT0FBTCxDQUFjLFNBQWQsQ0FBaEIsQ0FEMEI7QUFFMUMsUUFBSyxDQUFDLFNBQUQsSUFBYyxDQUFDLFVBQVUsTUFBVixFQUFtQjtBQUNyQyxhQURxQztLQUF2QztBQUdBLFFBQUksUUFBUSxVQUFVLE9BQVYsQ0FBbUIsUUFBbkIsQ0FBUixDQUxzQztBQU0xQyxRQUFLLFNBQVMsQ0FBQyxDQUFELEVBQUs7QUFDakIsZ0JBQVUsTUFBVixDQUFrQixLQUFsQixFQUF5QixDQUF6QixFQURpQjtLQUFuQjs7QUFJQSxXQUFPLElBQVAsQ0FWMEM7R0FBaEMsQ0F6Q1E7O0FBc0RwQixRQUFNLFNBQU4sR0FBa0IsVUFBVSxTQUFWLEVBQXFCLElBQXJCLEVBQTRCO0FBQzVDLFFBQUksWUFBWSxLQUFLLE9BQUwsSUFBZ0IsS0FBSyxPQUFMLENBQWMsU0FBZCxDQUFoQixDQUQ0QjtBQUU1QyxRQUFLLENBQUMsU0FBRCxJQUFjLENBQUMsVUFBVSxNQUFWLEVBQW1CO0FBQ3JDLGFBRHFDO0tBQXZDO0FBR0EsUUFBSSxJQUFJLENBQUosQ0FMd0M7QUFNNUMsUUFBSSxXQUFXLFVBQVUsQ0FBVixDQUFYLENBTndDO0FBTzVDLFdBQU8sUUFBUSxFQUFSOztBQVBxQyxRQVN4QyxnQkFBZ0IsS0FBSyxXQUFMLElBQW9CLEtBQUssV0FBTCxDQUFrQixTQUFsQixDQUFwQixDQVR3Qjs7QUFXNUMsV0FBUSxRQUFSLEVBQW1CO0FBQ2pCLFVBQUksU0FBUyxpQkFBaUIsY0FBZSxRQUFmLENBQWpCLENBREk7QUFFakIsVUFBSyxNQUFMLEVBQWM7OztBQUdaLGFBQUssR0FBTCxDQUFVLFNBQVYsRUFBcUIsUUFBckI7O0FBSFksZUFLTCxjQUFlLFFBQWYsQ0FBUCxDQUxZO09BQWQ7O0FBRmlCLGNBVWpCLENBQVMsS0FBVCxDQUFnQixJQUFoQixFQUFzQixJQUF0Qjs7QUFWaUIsT0FZakIsSUFBSyxTQUFTLENBQVQsR0FBYSxDQUFiLENBWlk7QUFhakIsaUJBQVcsVUFBVSxDQUFWLENBQVgsQ0FiaUI7S0FBbkI7O0FBZ0JBLFdBQU8sSUFBUCxDQTNCNEM7R0FBNUIsQ0F0REU7O0FBb0ZwQixTQUFPLFNBQVAsQ0FwRm9CO0NBQVgsQ0FkVDs7Ozs7Ozs7Ozs7QUErR0EsQ0FBRSxVQUFVLE1BQVYsRUFBa0IsT0FBbEIsRUFBNEI7QUFDNUIsZUFENEI7O0FBRzVCLE1BQUssT0FBTyxNQUFQLElBQWlCLFVBQWpCLElBQStCLE9BQU8sR0FBUCxFQUFhOztBQUUvQyxXQUFRLG1CQUFSLEVBQTRCLEVBQTVCLEVBQStCLFlBQVc7QUFDeEMsYUFBTyxTQUFQLENBRHdDO0tBQVgsQ0FBL0IsQ0FGK0M7R0FBakQsTUFLTyxJQUFLLE9BQU8sTUFBUCxJQUFpQixRQUFqQixJQUE2QixPQUFPLE9BQVAsRUFBaUI7O0FBRXhELFdBQU8sT0FBUCxHQUFpQixTQUFqQixDQUZ3RDtHQUFuRCxNQUdBOztBQUVMLFdBQU8sT0FBUCxHQUFpQixTQUFqQixDQUZLO0dBSEE7Q0FSUCxDQUFGLENBZ0JJLE1BaEJKLEVBZ0JZLFNBQVMsT0FBVCxHQUFtQjtBQUMvQjs7Ozs7QUFEK0I7QUFNL0IsV0FBUyxZQUFULENBQXVCLEtBQXZCLEVBQStCO0FBQzdCLFFBQUksTUFBTSxXQUFZLEtBQVosQ0FBTjs7QUFEeUIsUUFHekIsVUFBVSxNQUFNLE9BQU4sQ0FBYyxHQUFkLEtBQXNCLENBQUMsQ0FBRCxJQUFNLENBQUMsTUFBTyxHQUFQLENBQUQsQ0FIYjtBQUk3QixXQUFPLFdBQVcsR0FBWCxDQUpzQjtHQUEvQjs7QUFPQSxXQUFTLElBQVQsR0FBZ0IsRUFBaEI7O0FBRUEsTUFBSSxXQUFXLE9BQU8sT0FBUCxJQUFrQixXQUFsQixHQUFnQyxJQUFoQyxHQUNiLFVBQVUsT0FBVixFQUFvQjtBQUNsQixZQUFRLEtBQVIsQ0FBZSxPQUFmLEVBRGtCO0dBQXBCOzs7O0FBaEI2QixNQXNCM0IsZUFBZSxDQUNqQixhQURpQixFQUVqQixjQUZpQixFQUdqQixZQUhpQixFQUlqQixlQUppQixFQUtqQixZQUxpQixFQU1qQixhQU5pQixFQU9qQixXQVBpQixFQVFqQixjQVJpQixFQVNqQixpQkFUaUIsRUFVakIsa0JBVmlCLEVBV2pCLGdCQVhpQixFQVlqQixtQkFaaUIsQ0FBZixDQXRCMkI7O0FBcUMvQixNQUFJLHFCQUFxQixhQUFhLE1BQWIsQ0FyQ007O0FBdUMvQixXQUFTLFdBQVQsR0FBdUI7QUFDckIsUUFBSSxPQUFPO0FBQ1QsYUFBTyxDQUFQO0FBQ0EsY0FBUSxDQUFSO0FBQ0Esa0JBQVksQ0FBWjtBQUNBLG1CQUFhLENBQWI7QUFDQSxrQkFBWSxDQUFaO0FBQ0EsbUJBQWEsQ0FBYjtLQU5FLENBRGlCO0FBU3JCLFNBQU0sSUFBSSxJQUFFLENBQUYsRUFBSyxJQUFJLGtCQUFKLEVBQXdCLEdBQXZDLEVBQTZDO0FBQzNDLFVBQUksY0FBYyxhQUFhLENBQWIsQ0FBZCxDQUR1QztBQUUzQyxXQUFNLFdBQU4sSUFBc0IsQ0FBdEIsQ0FGMkM7S0FBN0M7QUFJQSxXQUFPLElBQVAsQ0FicUI7R0FBdkI7Ozs7Ozs7O0FBdkMrQixXQTZEdEIsUUFBVCxDQUFtQixJQUFuQixFQUEwQjtBQUN4QixRQUFJLFFBQVEsaUJBQWtCLElBQWxCLENBQVIsQ0FEb0I7QUFFeEIsUUFBSyxDQUFDLEtBQUQsRUFBUztBQUNaLGVBQVUsb0JBQW9CLEtBQXBCLEdBQ1IsNkRBRFEsR0FFUiwrQkFGUSxDQUFWLENBRFk7S0FBZDtBQUtBLFdBQU8sS0FBUCxDQVB3QjtHQUExQjs7OztBQTdEK0IsTUF5RTNCLFVBQVUsS0FBVixDQXpFMkI7O0FBMkUvQixNQUFJLGNBQUo7Ozs7Ozs7QUEzRStCLFdBa0Z0QixLQUFULEdBQWlCOztBQUVmLFFBQUssT0FBTCxFQUFlO0FBQ2IsYUFEYTtLQUFmO0FBR0EsY0FBVSxJQUFWOzs7Ozs7OztBQUxlLFFBYVgsTUFBTSxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBTixDQWJXO0FBY2YsUUFBSSxLQUFKLENBQVUsS0FBVixHQUFrQixPQUFsQixDQWRlO0FBZWYsUUFBSSxLQUFKLENBQVUsT0FBVixHQUFvQixpQkFBcEIsQ0FmZTtBQWdCZixRQUFJLEtBQUosQ0FBVSxXQUFWLEdBQXdCLE9BQXhCLENBaEJlO0FBaUJmLFFBQUksS0FBSixDQUFVLFdBQVYsR0FBd0IsaUJBQXhCLENBakJlO0FBa0JmLFFBQUksS0FBSixDQUFVLFNBQVYsR0FBc0IsWUFBdEIsQ0FsQmU7O0FBb0JmLFFBQUksT0FBTyxTQUFTLElBQVQsSUFBaUIsU0FBUyxlQUFULENBcEJiO0FBcUJmLFNBQUssV0FBTCxDQUFrQixHQUFsQixFQXJCZTtBQXNCZixRQUFJLFFBQVEsU0FBVSxHQUFWLENBQVIsQ0F0Qlc7O0FBd0JmLFlBQVEsY0FBUixHQUF5QixpQkFBaUIsYUFBYyxNQUFNLEtBQU4sQ0FBZCxJQUErQixHQUEvQixDQXhCM0I7QUF5QmYsU0FBSyxXQUFMLENBQWtCLEdBQWxCLEVBekJlO0dBQWpCOzs7O0FBbEYrQixXQWlIdEIsT0FBVCxDQUFrQixJQUFsQixFQUF5QjtBQUN2Qjs7O0FBRHVCLFFBSWxCLE9BQU8sSUFBUCxJQUFlLFFBQWYsRUFBMEI7QUFDN0IsYUFBTyxTQUFTLGFBQVQsQ0FBd0IsSUFBeEIsQ0FBUCxDQUQ2QjtLQUEvQjs7O0FBSnVCLFFBU2xCLENBQUMsSUFBRCxJQUFTLE9BQU8sSUFBUCxJQUFlLFFBQWYsSUFBMkIsQ0FBQyxLQUFLLFFBQUwsRUFBZ0I7QUFDeEQsYUFEd0Q7S0FBMUQ7O0FBSUEsUUFBSSxRQUFRLFNBQVUsSUFBVixDQUFSOzs7QUFibUIsUUFnQmxCLE1BQU0sT0FBTixJQUFpQixNQUFqQixFQUEwQjtBQUM3QixhQUFPLGFBQVAsQ0FENkI7S0FBL0I7O0FBSUEsUUFBSSxPQUFPLEVBQVAsQ0FwQm1CO0FBcUJ2QixTQUFLLEtBQUwsR0FBYSxLQUFLLFdBQUwsQ0FyQlU7QUFzQnZCLFNBQUssTUFBTCxHQUFjLEtBQUssWUFBTCxDQXRCUzs7QUF3QnZCLFFBQUksY0FBYyxLQUFLLFdBQUwsR0FBbUIsTUFBTSxTQUFOLElBQW1CLFlBQW5COzs7QUF4QmQsU0EyQmpCLElBQUksSUFBRSxDQUFGLEVBQUssSUFBSSxrQkFBSixFQUF3QixHQUF2QyxFQUE2QztBQUMzQyxVQUFJLGNBQWMsYUFBYSxDQUFiLENBQWQsQ0FEdUM7QUFFM0MsVUFBSSxRQUFRLE1BQU8sV0FBUCxDQUFSLENBRnVDO0FBRzNDLFVBQUksTUFBTSxXQUFZLEtBQVosQ0FBTjs7QUFIdUMsVUFLM0MsQ0FBTSxXQUFOLElBQXNCLENBQUMsTUFBTyxHQUFQLENBQUQsR0FBZ0IsR0FBaEIsR0FBc0IsQ0FBdEIsQ0FMcUI7S0FBN0M7O0FBUUEsUUFBSSxlQUFlLEtBQUssV0FBTCxHQUFtQixLQUFLLFlBQUwsQ0FuQ2Y7QUFvQ3ZCLFFBQUksZ0JBQWdCLEtBQUssVUFBTCxHQUFrQixLQUFLLGFBQUwsQ0FwQ2Y7QUFxQ3ZCLFFBQUksY0FBYyxLQUFLLFVBQUwsR0FBa0IsS0FBSyxXQUFMLENBckNiO0FBc0N2QixRQUFJLGVBQWUsS0FBSyxTQUFMLEdBQWlCLEtBQUssWUFBTCxDQXRDYjtBQXVDdkIsUUFBSSxjQUFjLEtBQUssZUFBTCxHQUF1QixLQUFLLGdCQUFMLENBdkNsQjtBQXdDdkIsUUFBSSxlQUFlLEtBQUssY0FBTCxHQUFzQixLQUFLLGlCQUFMLENBeENsQjs7QUEwQ3ZCLFFBQUksdUJBQXVCLGVBQWUsY0FBZjs7O0FBMUNKLFFBNkNuQixhQUFhLGFBQWMsTUFBTSxLQUFOLENBQTNCLENBN0NtQjtBQThDdkIsUUFBSyxlQUFlLEtBQWYsRUFBdUI7QUFDMUIsV0FBSyxLQUFMLEdBQWE7O0FBRVQsNkJBQXVCLENBQXZCLEdBQTJCLGVBQWUsV0FBZixDQUZsQixDQURhO0tBQTVCOztBQU1BLFFBQUksY0FBYyxhQUFjLE1BQU0sTUFBTixDQUE1QixDQXBEbUI7QUFxRHZCLFFBQUssZ0JBQWdCLEtBQWhCLEVBQXdCO0FBQzNCLFdBQUssTUFBTCxHQUFjOztBQUVWLDZCQUF1QixDQUF2QixHQUEyQixnQkFBZ0IsWUFBaEIsQ0FGakIsQ0FEYTtLQUE3Qjs7QUFNQSxTQUFLLFVBQUwsR0FBa0IsS0FBSyxLQUFMLElBQWUsZUFBZSxXQUFmLENBQWYsQ0EzREs7QUE0RHZCLFNBQUssV0FBTCxHQUFtQixLQUFLLE1BQUwsSUFBZ0IsZ0JBQWdCLFlBQWhCLENBQWhCLENBNURJOztBQThEdkIsU0FBSyxVQUFMLEdBQWtCLEtBQUssS0FBTCxHQUFhLFdBQWIsQ0E5REs7QUErRHZCLFNBQUssV0FBTCxHQUFtQixLQUFLLE1BQUwsR0FBYyxZQUFkLENBL0RJOztBQWlFdkIsV0FBTyxJQUFQLENBakV1QjtHQUF6Qjs7QUFvRUEsU0FBTyxPQUFQLENBckwrQjtDQUFuQixDQWhCWjs7Ozs7Ozs7OztBQWlOQSxDQUFFLFVBQVUsTUFBVixFQUFrQixPQUFsQixFQUE0Qjs7QUFFNUI7O0FBRjRCO0FBSTVCLE1BQUssT0FBTyxNQUFQLElBQWlCLFVBQWpCLElBQStCLE9BQU8sR0FBUCxFQUFhOztBQUUvQyxXQUFRLG1DQUFSLEVBQTRDLE9BQTVDLEVBRitDO0dBQWpELE1BR08sSUFBSyxPQUFPLE1BQVAsSUFBaUIsUUFBakIsSUFBNkIsT0FBTyxPQUFQLEVBQWlCOztBQUV4RCxXQUFPLE9BQVAsR0FBaUIsU0FBakIsQ0FGd0Q7R0FBbkQsTUFHQTs7QUFFTCxXQUFPLGVBQVAsR0FBeUIsU0FBekIsQ0FGSztHQUhBO0NBUFAsRUFlQyxNQWZELEVBZVMsU0FBUyxPQUFULEdBQW1CO0FBQzVCLGVBRDRCOztBQUc1QixNQUFJLGdCQUFnQixZQUFhO0FBQy9CLFFBQUksWUFBWSxRQUFRLFNBQVI7O0FBRGUsUUFHMUIsVUFBVSxPQUFWLEVBQW9CO0FBQ3ZCLGFBQU8sU0FBUCxDQUR1QjtLQUF6Qjs7QUFIK0IsUUFPMUIsVUFBVSxlQUFWLEVBQTRCO0FBQy9CLGFBQU8saUJBQVAsQ0FEK0I7S0FBakM7O0FBUCtCLFFBVzNCLFdBQVcsQ0FBRSxRQUFGLEVBQVksS0FBWixFQUFtQixJQUFuQixFQUF5QixHQUF6QixDQUFYLENBWDJCOztBQWEvQixTQUFNLElBQUksSUFBRSxDQUFGLEVBQUssSUFBSSxTQUFTLE1BQVQsRUFBaUIsR0FBcEMsRUFBMEM7QUFDeEMsVUFBSSxTQUFTLFNBQVMsQ0FBVCxDQUFULENBRG9DO0FBRXhDLFVBQUksU0FBUyxTQUFTLGlCQUFULENBRjJCO0FBR3hDLFVBQUssVUFBVyxNQUFYLENBQUwsRUFBMkI7QUFDekIsZUFBTyxNQUFQLENBRHlCO09BQTNCO0tBSEY7R0Fib0IsRUFBbEIsQ0FId0I7O0FBeUI1QixTQUFPLFNBQVMsZUFBVCxDQUEwQixJQUExQixFQUFnQyxRQUFoQyxFQUEyQztBQUNoRCxXQUFPLEtBQU0sYUFBTixFQUF1QixRQUF2QixDQUFQLENBRGdEO0dBQTNDLENBekJxQjtDQUFuQixDQWZYOzs7Ozs7Ozs7QUFxREEsQ0FBRSxVQUFVLE1BQVYsRUFBa0IsT0FBbEIsRUFBNEI7O0FBRTVCOzs7QUFGNEIsTUFLdkIsT0FBTyxNQUFQLElBQWlCLFVBQWpCLElBQStCLE9BQU8sR0FBUCxFQUFhOztBQUUvQyxXQUFRLHNCQUFSLEVBQStCLENBQzdCLG1DQUQ2QixDQUEvQixFQUVHLFVBQVUsZUFBVixFQUE0QjtBQUM3QixhQUFPLFFBQVMsTUFBVCxFQUFpQixlQUFqQixDQUFQLENBRDZCO0tBQTVCLENBRkgsQ0FGK0M7R0FBakQsTUFPTyxJQUFLLE9BQU8sTUFBUCxJQUFpQixRQUFqQixJQUE2QixPQUFPLE9BQVAsRUFBaUI7O0FBRXhELFdBQU8sT0FBUCxHQUFpQixRQUNmLE1BRGUsRUFFZixRQUFRLDJCQUFSLENBRmUsQ0FBakIsQ0FGd0Q7R0FBbkQsTUFNQTs7QUFFTCxXQUFPLFlBQVAsR0FBc0IsUUFDcEIsTUFEb0IsRUFFcEIsT0FBTyxlQUFQLENBRkYsQ0FGSztHQU5BO0NBWlAsRUEwQkMsTUExQkQsRUEwQlMsU0FBUyxPQUFULENBQWtCLE1BQWxCLEVBQTBCLGVBQTFCLEVBQTRDOztBQUl2RCxNQUFJLFFBQVEsRUFBUjs7Ozs7QUFKbUQsT0FTdkQsQ0FBTSxNQUFOLEdBQWUsVUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFpQjtBQUM5QixTQUFNLElBQUksSUFBSixJQUFZLENBQWxCLEVBQXNCO0FBQ3BCLFFBQUcsSUFBSCxJQUFZLEVBQUcsSUFBSCxDQUFaLENBRG9CO0tBQXRCO0FBR0EsV0FBTyxDQUFQLENBSjhCO0dBQWpCOzs7O0FBVHdDLE9Ba0J2RCxDQUFNLE1BQU4sR0FBZSxVQUFVLEdBQVYsRUFBZSxHQUFmLEVBQXFCO0FBQ2xDLFdBQU8sQ0FBRSxHQUFFLEdBQU0sR0FBTixHQUFjLEdBQWhCLENBQUYsR0FBMEIsR0FBMUIsQ0FEMkI7R0FBckI7Ozs7O0FBbEJ3QyxPQXlCdkQsQ0FBTSxTQUFOLEdBQWtCLFVBQVUsR0FBVixFQUFnQjtBQUNoQyxRQUFJLE1BQU0sRUFBTixDQUQ0QjtBQUVoQyxRQUFLLE1BQU0sT0FBTixDQUFlLEdBQWYsQ0FBTCxFQUE0Qjs7QUFFMUIsWUFBTSxHQUFOLENBRjBCO0tBQTVCLE1BR08sSUFBSyxPQUFPLE9BQU8sSUFBSSxNQUFKLElBQWMsUUFBckIsRUFBZ0M7O0FBRWpELFdBQU0sSUFBSSxJQUFFLENBQUYsRUFBSyxJQUFJLElBQUksTUFBSixFQUFZLEdBQS9CLEVBQXFDO0FBQ25DLFlBQUksSUFBSixDQUFVLElBQUksQ0FBSixDQUFWLEVBRG1DO09BQXJDO0tBRkssTUFLQTs7QUFFTCxVQUFJLElBQUosQ0FBVSxHQUFWLEVBRks7S0FMQTtBQVNQLFdBQU8sR0FBUCxDQWRnQztHQUFoQjs7OztBQXpCcUMsT0E0Q3ZELENBQU0sVUFBTixHQUFtQixVQUFVLEdBQVYsRUFBZSxHQUFmLEVBQXFCO0FBQ3RDLFFBQUksUUFBUSxJQUFJLE9BQUosQ0FBYSxHQUFiLENBQVIsQ0FEa0M7QUFFdEMsUUFBSyxTQUFTLENBQUMsQ0FBRCxFQUFLO0FBQ2pCLFVBQUksTUFBSixDQUFZLEtBQVosRUFBbUIsQ0FBbkIsRUFEaUI7S0FBbkI7R0FGaUI7Ozs7QUE1Q29DLE9BcUR2RCxDQUFNLFNBQU4sR0FBa0IsVUFBVSxJQUFWLEVBQWdCLFFBQWhCLEVBQTJCO0FBQzNDLFdBQVEsUUFBUSxTQUFTLElBQVQsRUFBZ0I7QUFDOUIsYUFBTyxLQUFLLFVBQUwsQ0FEdUI7QUFFOUIsVUFBSyxnQkFBaUIsSUFBakIsRUFBdUIsUUFBdkIsQ0FBTCxFQUF5QztBQUN2QyxlQUFPLElBQVAsQ0FEdUM7T0FBekM7S0FGRjtHQURnQjs7Ozs7QUFyRHFDLE9BaUV2RCxDQUFNLGVBQU4sR0FBd0IsVUFBVSxJQUFWLEVBQWlCO0FBQ3ZDLFFBQUssT0FBTyxJQUFQLElBQWUsUUFBZixFQUEwQjtBQUM3QixhQUFPLFNBQVMsYUFBVCxDQUF3QixJQUF4QixDQUFQLENBRDZCO0tBQS9CO0FBR0EsV0FBTyxJQUFQLENBSnVDO0dBQWpCOzs7OztBQWpFK0IsT0EyRXZELENBQU0sV0FBTixHQUFvQixVQUFVLEtBQVYsRUFBa0I7QUFDcEMsUUFBSSxTQUFTLE9BQU8sTUFBTSxJQUFOLENBRGdCO0FBRXBDLFFBQUssS0FBTSxNQUFOLENBQUwsRUFBc0I7QUFDcEIsV0FBTSxNQUFOLEVBQWdCLEtBQWhCLEVBRG9CO0tBQXRCO0dBRmtCOzs7O0FBM0VtQyxPQW9GdkQsQ0FBTSxrQkFBTixHQUEyQixVQUFVLEtBQVYsRUFBaUIsUUFBakIsRUFBNEI7O0FBRXJELFlBQVEsTUFBTSxTQUFOLENBQWlCLEtBQWpCLENBQVIsQ0FGcUQ7QUFHckQsUUFBSSxVQUFVLEVBQVYsQ0FIaUQ7O0FBS3JELFVBQU0sT0FBTixDQUFlLFVBQVUsSUFBVixFQUFpQjs7QUFFOUIsVUFBSyxFQUFHLGdCQUFnQixXQUFoQixDQUFILEVBQW1DO0FBQ3RDLGVBRHNDO09BQXhDOztBQUY4QixVQU16QixDQUFDLFFBQUQsRUFBWTtBQUNmLGdCQUFRLElBQVIsQ0FBYyxJQUFkLEVBRGU7QUFFZixlQUZlO09BQWpCOzs7QUFOOEIsVUFZekIsZ0JBQWlCLElBQWpCLEVBQXVCLFFBQXZCLENBQUwsRUFBeUM7QUFDdkMsZ0JBQVEsSUFBUixDQUFjLElBQWQsRUFEdUM7T0FBekM7O0FBWjhCLFVBZ0IxQixhQUFhLEtBQUssZ0JBQUwsQ0FBdUIsUUFBdkIsQ0FBYjs7QUFoQjBCLFdBa0J4QixJQUFJLElBQUUsQ0FBRixFQUFLLElBQUksV0FBVyxNQUFYLEVBQW1CLEdBQXRDLEVBQTRDO0FBQzFDLGdCQUFRLElBQVIsQ0FBYyxXQUFXLENBQVgsQ0FBZCxFQUQwQztPQUE1QztLQWxCYSxDQUFmLENBTHFEOztBQTRCckQsV0FBTyxPQUFQLENBNUJxRDtHQUE1Qjs7OztBQXBGNEIsT0FxSHZELENBQU0sY0FBTixHQUF1QixVQUFVLE1BQVYsRUFBa0IsVUFBbEIsRUFBOEIsU0FBOUIsRUFBMEM7O0FBRS9ELFFBQUksU0FBUyxPQUFPLFNBQVAsQ0FBa0IsVUFBbEIsQ0FBVCxDQUYyRDtBQUcvRCxRQUFJLGNBQWMsYUFBYSxTQUFiLENBSDZDOztBQUsvRCxXQUFPLFNBQVAsQ0FBa0IsVUFBbEIsSUFBaUMsWUFBVztBQUMxQyxVQUFJLFVBQVUsS0FBTSxXQUFOLENBQVYsQ0FEc0M7QUFFMUMsVUFBSyxPQUFMLEVBQWU7QUFDYixxQkFBYyxPQUFkLEVBRGE7T0FBZjtBQUdBLFVBQUksT0FBTyxTQUFQLENBTHNDOztBQU8xQyxVQUFJLFFBQVEsSUFBUixDQVBzQztBQVExQyxXQUFNLFdBQU4sSUFBc0IsV0FBWSxZQUFXO0FBQzNDLGVBQU8sS0FBUCxDQUFjLEtBQWQsRUFBcUIsSUFBckIsRUFEMkM7QUFFM0MsZUFBTyxNQUFPLFdBQVAsQ0FBUCxDQUYyQztPQUFYLEVBRy9CLGFBQWEsR0FBYixDQUhILENBUjBDO0tBQVgsQ0FMOEI7R0FBMUM7Ozs7QUFySGdDLE9BMkl2RCxDQUFNLFFBQU4sR0FBaUIsVUFBVSxRQUFWLEVBQXFCO0FBQ3BDLFFBQUssU0FBUyxVQUFULElBQXVCLFVBQXZCLEVBQW9DO0FBQ3ZDLGlCQUR1QztLQUF6QyxNQUVPO0FBQ0wsZUFBUyxnQkFBVCxDQUEyQixrQkFBM0IsRUFBK0MsUUFBL0MsRUFESztLQUZQO0dBRGU7Ozs7O0FBM0lzQyxPQXNKdkQsQ0FBTSxRQUFOLEdBQWlCLFVBQVUsR0FBVixFQUFnQjtBQUMvQixXQUFPLElBQUksT0FBSixDQUFhLGFBQWIsRUFBNEIsVUFBVSxLQUFWLEVBQWlCLEVBQWpCLEVBQXFCLEVBQXJCLEVBQTBCO0FBQzNELGFBQU8sS0FBSyxHQUFMLEdBQVcsRUFBWCxDQURvRDtLQUExQixDQUE1QixDQUVKLFdBRkksRUFBUCxDQUQrQjtHQUFoQixDQXRKc0M7O0FBNEp2RCxNQUFJLFVBQVUsT0FBTyxPQUFQOzs7Ozs7QUE1SnlDLE9Ba0t2RCxDQUFNLFFBQU4sR0FBaUIsVUFBVSxXQUFWLEVBQXVCLFNBQXZCLEVBQW1DO0FBQ2xELFVBQU0sUUFBTixDQUFnQixZQUFXO0FBQ3pCLFVBQUksa0JBQWtCLE1BQU0sUUFBTixDQUFnQixTQUFoQixDQUFsQixDQURxQjtBQUV6QixVQUFJLFdBQVcsVUFBVSxlQUFWLENBRlU7QUFHekIsVUFBSSxnQkFBZ0IsU0FBUyxnQkFBVCxDQUEyQixNQUFNLFFBQU4sR0FBaUIsR0FBakIsQ0FBM0MsQ0FIcUI7QUFJekIsVUFBSSxjQUFjLFNBQVMsZ0JBQVQsQ0FBMkIsU0FBUyxlQUFULENBQXpDLENBSnFCO0FBS3pCLFVBQUksUUFBUSxNQUFNLFNBQU4sQ0FBaUIsYUFBakIsRUFDVCxNQURTLENBQ0QsTUFBTSxTQUFOLENBQWlCLFdBQWpCLENBREMsQ0FBUixDQUxxQjtBQU96QixVQUFJLGtCQUFrQixXQUFXLFVBQVgsQ0FQRztBQVF6QixVQUFJLFNBQVMsT0FBTyxNQUFQLENBUlk7O0FBVXpCLFlBQU0sT0FBTixDQUFlLFVBQVUsSUFBVixFQUFpQjtBQUM5QixZQUFJLE9BQU8sS0FBSyxZQUFMLENBQW1CLFFBQW5CLEtBQ1QsS0FBSyxZQUFMLENBQW1CLGVBQW5CLENBRFMsQ0FEbUI7QUFHOUIsWUFBSSxPQUFKLENBSDhCO0FBSTlCLFlBQUk7QUFDRixvQkFBVSxRQUFRLEtBQUssS0FBTCxDQUFZLElBQVosQ0FBUixDQURSO1NBQUosQ0FFRSxPQUFRLEtBQVIsRUFBZ0I7O0FBRWhCLGNBQUssT0FBTCxFQUFlO0FBQ2Isb0JBQVEsS0FBUixDQUFlLG1CQUFtQixRQUFuQixHQUE4QixNQUE5QixHQUF1QyxLQUFLLFNBQUwsR0FDdEQsSUFEZSxHQUNSLEtBRFEsQ0FBZixDQURhO1dBQWY7QUFJQSxpQkFOZ0I7U0FBaEI7O0FBTjRCLFlBZTFCLFdBQVcsSUFBSSxXQUFKLENBQWlCLElBQWpCLEVBQXVCLE9BQXZCLENBQVg7O0FBZjBCLFlBaUJ6QixNQUFMLEVBQWM7QUFDWixpQkFBTyxJQUFQLENBQWEsSUFBYixFQUFtQixTQUFuQixFQUE4QixRQUE5QixFQURZO1NBQWQ7T0FqQmEsQ0FBZixDQVZ5QjtLQUFYLENBQWhCLENBRGtEO0dBQW5DOzs7O0FBbEtzQyxTQXdNaEQsS0FBUCxDQXhNdUQ7Q0FBNUMsQ0ExQlg7Ozs7OztBQTBPQSxDQUFFLFVBQVUsTUFBVixFQUFrQixPQUFsQixFQUE0Qjs7O0FBRzVCLE1BQUssT0FBTyxNQUFQLElBQWlCLFVBQWpCLElBQStCLE9BQU8sR0FBUCxFQUFhOztBQUUvQyxXQUFRLGVBQVIsRUFBd0IsQ0FDcEIsdUJBRG9CLEVBRXBCLG1CQUZvQixDQUF4QixFQUlFLFVBQVUsU0FBVixFQUFxQixPQUFyQixFQUErQjtBQUM3QixhQUFPLFFBQVMsTUFBVCxFQUFpQixTQUFqQixFQUE0QixPQUE1QixDQUFQLENBRDZCO0tBQS9CLENBSkYsQ0FGK0M7R0FBakQsTUFVTyxJQUFLLE9BQU8sTUFBUCxJQUFpQixRQUFqQixJQUE2QixPQUFPLE9BQVAsRUFBaUI7O0FBRXhELFdBQU8sT0FBUCxHQUFpQixRQUNmLE1BRGUsRUFFZixRQUFRLFlBQVIsQ0FGZSxFQUdmLFFBQVEsVUFBUixDQUhlLENBQWpCLENBRndEO0dBQW5ELE1BT0E7O0FBRUwsV0FBTyxRQUFQLEdBQWtCLEVBQWxCLENBRks7QUFHTCxXQUFPLFFBQVAsQ0FBZ0IsSUFBaEIsR0FBdUIsUUFDckIsTUFEcUIsRUFFckIsT0FBTyxTQUFQLEVBQ0EsT0FBTyxPQUFQLENBSEYsQ0FISztHQVBBO0NBYlAsRUE4QkMsTUE5QkQsRUE4QlMsU0FBUyxPQUFULENBQWtCLE1BQWxCLEVBQTBCLFNBQTFCLEVBQXFDLE9BQXJDLEVBQStDO0FBQzFEOzs7O0FBRDBELFdBS2pELFVBQVQsQ0FBcUIsR0FBckIsRUFBMkI7QUFDekIsU0FBTSxJQUFJLElBQUosSUFBWSxHQUFsQixFQUF3QjtBQUN0QixhQUFPLEtBQVAsQ0FEc0I7S0FBeEI7QUFHQSxXQUFPLElBQVAsQ0FKeUI7QUFLekIsV0FBTyxJQUFQLENBTHlCO0dBQTNCOzs7O0FBTDBELE1BZ0J0RCxlQUFlLFNBQVMsZUFBVCxDQUF5QixLQUF6QixDQWhCdUM7O0FBa0IxRCxNQUFJLHFCQUFxQixPQUFPLGFBQWEsVUFBYixJQUEyQixRQUFsQyxHQUN2QixZQUR1QixHQUNSLGtCQURRLENBbEJpQztBQW9CMUQsTUFBSSxvQkFBb0IsT0FBTyxhQUFhLFNBQWIsSUFBMEIsUUFBakMsR0FDdEIsV0FEc0IsR0FDUixpQkFEUSxDQXBCa0M7O0FBdUIxRCxNQUFJLHFCQUFxQjtBQUN2QixzQkFBa0IscUJBQWxCO0FBQ0EsZ0JBQVksZUFBWjtHQUZ1QixDQUd0QixrQkFIc0IsQ0FBckI7OztBQXZCc0QsTUE2QnRELG1CQUFtQixDQUNyQixpQkFEcUIsRUFFckIsa0JBRnFCLEVBR3JCLHFCQUFxQixVQUFyQixFQUNBLHFCQUFxQixVQUFyQixDQUpFOzs7O0FBN0JzRCxXQXNDakQsSUFBVCxDQUFlLE9BQWYsRUFBd0IsTUFBeEIsRUFBaUM7QUFDL0IsUUFBSyxDQUFDLE9BQUQsRUFBVztBQUNkLGFBRGM7S0FBaEI7O0FBSUEsU0FBSyxPQUFMLEdBQWUsT0FBZjs7QUFMK0IsUUFPL0IsQ0FBSyxNQUFMLEdBQWMsTUFBZCxDQVArQjtBQVEvQixTQUFLLFFBQUwsR0FBZ0I7QUFDZCxTQUFHLENBQUg7QUFDQSxTQUFHLENBQUg7S0FGRixDQVIrQjs7QUFhL0IsU0FBSyxPQUFMLEdBYitCO0dBQWpDOzs7QUF0QzBELE1BdUR0RCxRQUFRLEtBQUssU0FBTCxHQUFpQixPQUFPLE1BQVAsQ0FBZSxVQUFVLFNBQVYsQ0FBaEMsQ0F2RDhDO0FBd0QxRCxRQUFNLFdBQU4sR0FBb0IsSUFBcEIsQ0F4RDBEOztBQTBEMUQsUUFBTSxPQUFOLEdBQWdCLFlBQVc7O0FBRXpCLFNBQUssT0FBTCxHQUFlO0FBQ2IscUJBQWUsRUFBZjtBQUNBLGFBQU8sRUFBUDtBQUNBLGFBQU8sRUFBUDtLQUhGLENBRnlCOztBQVF6QixTQUFLLEdBQUwsQ0FBUztBQUNQLGdCQUFVLFVBQVY7S0FERixFQVJ5QjtHQUFYOzs7QUExRDBDLE9Bd0UxRCxDQUFNLFdBQU4sR0FBb0IsVUFBVSxLQUFWLEVBQWtCO0FBQ3BDLFFBQUksU0FBUyxPQUFPLE1BQU0sSUFBTixDQURnQjtBQUVwQyxRQUFLLEtBQU0sTUFBTixDQUFMLEVBQXNCO0FBQ3BCLFdBQU0sTUFBTixFQUFnQixLQUFoQixFQURvQjtLQUF0QjtHQUZrQixDQXhFc0M7O0FBK0UxRCxRQUFNLE9BQU4sR0FBZ0IsWUFBVztBQUN6QixTQUFLLElBQUwsR0FBWSxRQUFTLEtBQUssT0FBTCxDQUFyQixDQUR5QjtHQUFYOzs7Ozs7QUEvRTBDLE9BdUYxRCxDQUFNLEdBQU4sR0FBWSxVQUFVLEtBQVYsRUFBa0I7QUFDNUIsUUFBSSxZQUFZLEtBQUssT0FBTCxDQUFhLEtBQWIsQ0FEWTs7QUFHNUIsU0FBTSxJQUFJLElBQUosSUFBWSxLQUFsQixFQUEwQjs7QUFFeEIsVUFBSSxnQkFBZ0IsaUJBQWtCLElBQWxCLEtBQTRCLElBQTVCLENBRkk7QUFHeEIsZ0JBQVcsYUFBWCxJQUE2QixNQUFPLElBQVAsQ0FBN0IsQ0FId0I7S0FBMUI7R0FIVTs7O0FBdkY4QyxPQWtHMUQsQ0FBTSxXQUFOLEdBQW9CLFlBQVc7QUFDN0IsUUFBSSxRQUFRLGlCQUFrQixLQUFLLE9BQUwsQ0FBMUIsQ0FEeUI7QUFFN0IsUUFBSSxlQUFlLEtBQUssTUFBTCxDQUFZLFVBQVosQ0FBdUIsWUFBdkIsQ0FBZixDQUZ5QjtBQUc3QixRQUFJLGNBQWMsS0FBSyxNQUFMLENBQVksVUFBWixDQUF1QixXQUF2QixDQUFkLENBSHlCO0FBSTdCLFFBQUksU0FBUyxNQUFPLGVBQWUsTUFBZixHQUF3QixPQUF4QixDQUFoQixDQUp5QjtBQUs3QixRQUFJLFNBQVMsTUFBTyxjQUFjLEtBQWQsR0FBc0IsUUFBdEIsQ0FBaEI7O0FBTHlCLFFBT3pCLGFBQWEsS0FBSyxNQUFMLENBQVksSUFBWixDQVBZO0FBUTdCLFFBQUksSUFBSSxPQUFPLE9BQVAsQ0FBZSxHQUFmLEtBQXVCLENBQUMsQ0FBRCxHQUM3QixVQUFFLENBQVksTUFBWixJQUF1QixHQUF2QixHQUErQixXQUFXLEtBQVgsR0FBbUIsU0FBVSxNQUFWLEVBQWtCLEVBQWxCLENBRDlDLENBUnFCO0FBVTdCLFFBQUksSUFBSSxPQUFPLE9BQVAsQ0FBZSxHQUFmLEtBQXVCLENBQUMsQ0FBRCxHQUM3QixVQUFFLENBQVksTUFBWixJQUF1QixHQUF2QixHQUErQixXQUFXLE1BQVgsR0FBb0IsU0FBVSxNQUFWLEVBQWtCLEVBQWxCLENBRC9DOzs7QUFWcUIsS0FjN0IsR0FBSSxNQUFPLENBQVAsSUFBYSxDQUFiLEdBQWlCLENBQWpCLENBZHlCO0FBZTdCLFFBQUksTUFBTyxDQUFQLElBQWEsQ0FBYixHQUFpQixDQUFqQjs7QUFmeUIsS0FpQjdCLElBQUssZUFBZSxXQUFXLFdBQVgsR0FBeUIsV0FBVyxZQUFYLENBakJoQjtBQWtCN0IsU0FBSyxjQUFjLFdBQVcsVUFBWCxHQUF3QixXQUFXLGFBQVgsQ0FsQmQ7O0FBb0I3QixTQUFLLFFBQUwsQ0FBYyxDQUFkLEdBQWtCLENBQWxCLENBcEI2QjtBQXFCN0IsU0FBSyxRQUFMLENBQWMsQ0FBZCxHQUFrQixDQUFsQixDQXJCNkI7R0FBWDs7O0FBbEdzQyxPQTJIMUQsQ0FBTSxjQUFOLEdBQXVCLFlBQVc7QUFDaEMsUUFBSSxhQUFhLEtBQUssTUFBTCxDQUFZLElBQVosQ0FEZTtBQUVoQyxRQUFJLFFBQVEsRUFBUixDQUY0QjtBQUdoQyxRQUFJLGVBQWUsS0FBSyxNQUFMLENBQVksVUFBWixDQUF1QixZQUF2QixDQUFmLENBSDRCO0FBSWhDLFFBQUksY0FBYyxLQUFLLE1BQUwsQ0FBWSxVQUFaLENBQXVCLFdBQXZCLENBQWQ7OztBQUo0QixRQU81QixXQUFXLGVBQWUsYUFBZixHQUErQixjQUEvQixDQVBpQjtBQVFoQyxRQUFJLFlBQVksZUFBZSxNQUFmLEdBQXdCLE9BQXhCLENBUmdCO0FBU2hDLFFBQUksaUJBQWlCLGVBQWUsT0FBZixHQUF5QixNQUF6QixDQVRXOztBQVdoQyxRQUFJLElBQUksS0FBSyxRQUFMLENBQWMsQ0FBZCxHQUFrQixXQUFZLFFBQVosQ0FBbEI7O0FBWHdCLFNBYWhDLENBQU8sU0FBUCxJQUFxQixLQUFLLFNBQUwsQ0FBZ0IsQ0FBaEIsQ0FBckI7O0FBYmdDLFNBZWhDLENBQU8sY0FBUCxJQUEwQixFQUExQjs7O0FBZmdDLFFBa0I1QixXQUFXLGNBQWMsWUFBZCxHQUE2QixlQUE3QixDQWxCaUI7QUFtQmhDLFFBQUksWUFBWSxjQUFjLEtBQWQsR0FBc0IsUUFBdEIsQ0FuQmdCO0FBb0JoQyxRQUFJLGlCQUFpQixjQUFjLFFBQWQsR0FBeUIsS0FBekIsQ0FwQlc7O0FBc0JoQyxRQUFJLElBQUksS0FBSyxRQUFMLENBQWMsQ0FBZCxHQUFrQixXQUFZLFFBQVosQ0FBbEI7O0FBdEJ3QixTQXdCaEMsQ0FBTyxTQUFQLElBQXFCLEtBQUssU0FBTCxDQUFnQixDQUFoQixDQUFyQjs7QUF4QmdDLFNBMEJoQyxDQUFPLGNBQVAsSUFBMEIsRUFBMUIsQ0ExQmdDOztBQTRCaEMsU0FBSyxHQUFMLENBQVUsS0FBVixFQTVCZ0M7QUE2QmhDLFNBQUssU0FBTCxDQUFnQixRQUFoQixFQUEwQixDQUFFLElBQUYsQ0FBMUIsRUE3QmdDO0dBQVgsQ0EzSG1DOztBQTJKMUQsUUFBTSxTQUFOLEdBQWtCLFVBQVUsQ0FBVixFQUFjO0FBQzlCLFFBQUksZUFBZSxLQUFLLE1BQUwsQ0FBWSxVQUFaLENBQXVCLFlBQXZCLENBQWYsQ0FEMEI7QUFFOUIsV0FBTyxLQUFLLE1BQUwsQ0FBWSxPQUFaLENBQW9CLGVBQXBCLElBQXVDLENBQUMsWUFBRCxHQUM1QyxDQUFJLEdBQUksS0FBSyxNQUFMLENBQVksSUFBWixDQUFpQixLQUFqQixHQUEyQixHQUFqQyxHQUF5QyxHQUEzQyxHQUFpRCxJQUFJLElBQUosQ0FIckI7R0FBZCxDQTNKd0M7O0FBaUsxRCxRQUFNLFNBQU4sR0FBa0IsVUFBVSxDQUFWLEVBQWM7QUFDOUIsUUFBSSxlQUFlLEtBQUssTUFBTCxDQUFZLFVBQVosQ0FBdUIsWUFBdkIsQ0FBZixDQUQwQjtBQUU5QixXQUFPLEtBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0IsZUFBcEIsSUFBdUMsWUFBdkMsR0FDTCxDQUFJLEdBQUksS0FBSyxNQUFMLENBQVksSUFBWixDQUFpQixNQUFqQixHQUE0QixHQUFsQyxHQUEwQyxHQUE1QyxHQUFrRCxJQUFJLElBQUosQ0FIdEI7R0FBZCxDQWpLd0M7O0FBdUsxRCxRQUFNLGFBQU4sR0FBc0IsVUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFpQjtBQUNyQyxTQUFLLFdBQUw7O0FBRHFDLFFBR2pDLE9BQU8sS0FBSyxRQUFMLENBQWMsQ0FBZCxDQUgwQjtBQUlyQyxRQUFJLE9BQU8sS0FBSyxRQUFMLENBQWMsQ0FBZCxDQUowQjs7QUFNckMsUUFBSSxXQUFXLFNBQVUsQ0FBVixFQUFhLEVBQWIsQ0FBWCxDQU5pQztBQU9yQyxRQUFJLFdBQVcsU0FBVSxDQUFWLEVBQWEsRUFBYixDQUFYLENBUGlDO0FBUXJDLFFBQUksYUFBYSxhQUFhLEtBQUssUUFBTCxDQUFjLENBQWQsSUFBbUIsYUFBYSxLQUFLLFFBQUwsQ0FBYyxDQUFkOzs7QUFSekIsUUFXckMsQ0FBSyxXQUFMLENBQWtCLENBQWxCLEVBQXFCLENBQXJCOzs7QUFYcUMsUUFjaEMsY0FBYyxDQUFDLEtBQUssZUFBTCxFQUF1QjtBQUN6QyxXQUFLLGNBQUwsR0FEeUM7QUFFekMsYUFGeUM7S0FBM0M7O0FBS0EsUUFBSSxTQUFTLElBQUksSUFBSixDQW5Cd0I7QUFvQnJDLFFBQUksU0FBUyxJQUFJLElBQUosQ0FwQndCO0FBcUJyQyxRQUFJLGtCQUFrQixFQUFsQixDQXJCaUM7QUFzQnJDLG9CQUFnQixTQUFoQixHQUE0QixLQUFLLFlBQUwsQ0FBbUIsTUFBbkIsRUFBMkIsTUFBM0IsQ0FBNUIsQ0F0QnFDOztBQXdCckMsU0FBSyxVQUFMLENBQWdCO0FBQ2QsVUFBSSxlQUFKO0FBQ0EsdUJBQWlCO0FBQ2YsbUJBQVcsS0FBSyxjQUFMO09BRGI7QUFHQSxrQkFBWSxJQUFaO0tBTEYsRUF4QnFDO0dBQWpCLENBdktvQzs7QUF3TTFELFFBQU0sWUFBTixHQUFxQixVQUFVLENBQVYsRUFBYSxDQUFiLEVBQWlCOztBQUVwQyxRQUFJLGVBQWUsS0FBSyxNQUFMLENBQVksVUFBWixDQUF1QixZQUF2QixDQUFmLENBRmdDO0FBR3BDLFFBQUksY0FBYyxLQUFLLE1BQUwsQ0FBWSxVQUFaLENBQXVCLFdBQXZCLENBQWQsQ0FIZ0M7QUFJcEMsUUFBSSxlQUFlLENBQWYsR0FBbUIsQ0FBQyxDQUFELENBSmE7QUFLcEMsUUFBSSxjQUFjLENBQWQsR0FBa0IsQ0FBQyxDQUFELENBTGM7QUFNcEMsV0FBTyxpQkFBaUIsQ0FBakIsR0FBcUIsTUFBckIsR0FBOEIsQ0FBOUIsR0FBa0MsUUFBbEMsQ0FONkI7R0FBakI7OztBQXhNcUMsT0FrTjFELENBQU0sSUFBTixHQUFhLFVBQVUsQ0FBVixFQUFhLENBQWIsRUFBaUI7QUFDNUIsU0FBSyxXQUFMLENBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBRDRCO0FBRTVCLFNBQUssY0FBTCxHQUY0QjtHQUFqQixDQWxONkM7O0FBdU4xRCxRQUFNLE1BQU4sR0FBZSxNQUFNLGFBQU4sQ0F2TjJDOztBQXlOMUQsUUFBTSxXQUFOLEdBQW9CLFVBQVUsQ0FBVixFQUFhLENBQWIsRUFBaUI7QUFDbkMsU0FBSyxRQUFMLENBQWMsQ0FBZCxHQUFrQixTQUFVLENBQVYsRUFBYSxFQUFiLENBQWxCLENBRG1DO0FBRW5DLFNBQUssUUFBTCxDQUFjLENBQWQsR0FBa0IsU0FBVSxDQUFWLEVBQWEsRUFBYixDQUFsQixDQUZtQztHQUFqQjs7Ozs7Ozs7OztBQXpOc0MsT0FzTzFELENBQU0sY0FBTixHQUF1QixVQUFVLElBQVYsRUFBaUI7QUFDdEMsU0FBSyxHQUFMLENBQVUsS0FBSyxFQUFMLENBQVYsQ0FEc0M7QUFFdEMsUUFBSyxLQUFLLFVBQUwsRUFBa0I7QUFDckIsV0FBSyxhQUFMLENBQW9CLEtBQUssRUFBTCxDQUFwQixDQURxQjtLQUF2QjtBQUdBLFNBQU0sSUFBSSxJQUFKLElBQVksS0FBSyxlQUFMLEVBQXVCO0FBQ3ZDLFdBQUssZUFBTCxDQUFzQixJQUF0QixFQUE2QixJQUE3QixDQUFtQyxJQUFuQyxFQUR1QztLQUF6QztHQUxxQjs7Ozs7Ozs7OztBQXRPbUMsT0F3UDFELENBQU0sV0FBTixHQUFvQixVQUFVLElBQVYsRUFBaUI7O0FBRW5DLFFBQUssQ0FBQyxXQUFZLEtBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0Isa0JBQXBCLENBQWIsRUFBd0Q7QUFDM0QsV0FBSyxjQUFMLENBQXFCLElBQXJCLEVBRDJEO0FBRTNELGFBRjJEO0tBQTdEOztBQUtBLFFBQUksY0FBYyxLQUFLLE9BQUw7O0FBUGlCLFNBUzdCLElBQUksSUFBSixJQUFZLEtBQUssZUFBTCxFQUF1QjtBQUN2QyxrQkFBWSxLQUFaLENBQW1CLElBQW5CLElBQTRCLEtBQUssZUFBTCxDQUFzQixJQUF0QixDQUE1QixDQUR1QztLQUF6Qzs7QUFUbUMsU0FhN0IsSUFBTixJQUFjLEtBQUssRUFBTCxFQUFVO0FBQ3RCLGtCQUFZLGFBQVosQ0FBMkIsSUFBM0IsSUFBb0MsSUFBcEM7O0FBRHNCLFVBR2pCLEtBQUssVUFBTCxFQUFrQjtBQUNyQixvQkFBWSxLQUFaLENBQW1CLElBQW5CLElBQTRCLElBQTVCLENBRHFCO09BQXZCO0tBSEY7OztBQWJtQyxRQXNCOUIsS0FBSyxJQUFMLEVBQVk7QUFDZixXQUFLLEdBQUwsQ0FBVSxLQUFLLElBQUwsQ0FBVjs7QUFEZSxVQUdYLElBQUksS0FBSyxPQUFMLENBQWEsWUFBYjs7QUFITyxPQUtmLEdBQUksSUFBSixDQUxlO0tBQWpCOztBQXRCbUMsUUE4Qm5DLENBQUssZ0JBQUwsQ0FBdUIsS0FBSyxFQUFMLENBQXZCOztBQTlCbUMsUUFnQ25DLENBQUssR0FBTCxDQUFVLEtBQUssRUFBTCxDQUFWLENBaENtQzs7QUFrQ25DLFNBQUssZUFBTCxHQUF1QixJQUF2QixDQWxDbUM7R0FBakI7Ozs7QUF4UHNDLFdBZ1NqRCxXQUFULENBQXNCLEdBQXRCLEVBQTRCO0FBQzFCLFdBQU8sSUFBSSxPQUFKLENBQWEsVUFBYixFQUF5QixVQUFVLEVBQVYsRUFBZTtBQUM3QyxhQUFPLE1BQU0sR0FBRyxXQUFILEVBQU4sQ0FEc0M7S0FBZixDQUFoQyxDQUQwQjtHQUE1Qjs7QUFNQSxNQUFJLGtCQUFrQixhQUNwQixZQUFhLGlCQUFpQixTQUFqQixJQUE4QixXQUE5QixDQURPLENBdFNvQzs7QUF5UzFELFFBQU0sZ0JBQU4sR0FBeUIsdUJBQXNCOzs7QUFHN0MsUUFBSyxLQUFLLGVBQUwsRUFBdUI7QUFDMUIsYUFEMEI7S0FBNUI7Ozs7Ozs7Ozs7OztBQUg2QyxRQWlCN0MsQ0FBSyxHQUFMLENBQVM7QUFDUCwwQkFBb0IsZUFBcEI7QUFDQSwwQkFBb0IsS0FBSyxNQUFMLENBQVksT0FBWixDQUFvQixrQkFBcEI7S0FGdEI7O0FBakI2QyxRQXNCN0MsQ0FBSyxPQUFMLENBQWEsZ0JBQWIsQ0FBK0Isa0JBQS9CLEVBQW1ELElBQW5ELEVBQXlELEtBQXpELEVBdEI2QztHQUF0QixDQXpTaUM7O0FBa1UxRCxRQUFNLFVBQU4sR0FBbUIsS0FBSyxTQUFMLENBQWdCLHFCQUFxQixhQUFyQixHQUFxQyxnQkFBckMsQ0FBbkM7Ozs7QUFsVTBELE9Bc1UxRCxDQUFNLHFCQUFOLEdBQThCLFVBQVUsS0FBVixFQUFrQjtBQUM5QyxTQUFLLGVBQUwsQ0FBc0IsS0FBdEIsRUFEOEM7R0FBbEIsQ0F0VTRCOztBQTBVMUQsUUFBTSxnQkFBTixHQUF5QixVQUFVLEtBQVYsRUFBa0I7QUFDekMsU0FBSyxlQUFMLENBQXNCLEtBQXRCLEVBRHlDO0dBQWxCOzs7QUExVWlDLE1BK1V0RCx5QkFBeUI7QUFDM0IseUJBQXFCLFdBQXJCO0dBREUsQ0EvVXNEOztBQW1WMUQsUUFBTSxlQUFOLEdBQXdCLFVBQVUsS0FBVixFQUFrQjs7QUFFeEMsUUFBSyxNQUFNLE1BQU4sS0FBaUIsS0FBSyxPQUFMLEVBQWU7QUFDbkMsYUFEbUM7S0FBckM7QUFHQSxRQUFJLGNBQWMsS0FBSyxPQUFMOztBQUxzQixRQU9wQyxlQUFlLHVCQUF3QixNQUFNLFlBQU4sQ0FBeEIsSUFBZ0QsTUFBTSxZQUFOOzs7QUFQM0IsV0FVakMsWUFBWSxhQUFaLENBQTJCLFlBQTNCLENBQVA7O0FBVndDLFFBWW5DLFdBQVksWUFBWSxhQUFaLENBQWpCLEVBQStDOztBQUU3QyxXQUFLLGlCQUFMLEdBRjZDO0tBQS9DOztBQVp3QyxRQWlCbkMsZ0JBQWdCLFlBQVksS0FBWixFQUFvQjs7QUFFdkMsV0FBSyxPQUFMLENBQWEsS0FBYixDQUFvQixNQUFNLFlBQU4sQ0FBcEIsR0FBMkMsRUFBM0MsQ0FGdUM7QUFHdkMsYUFBTyxZQUFZLEtBQVosQ0FBbUIsWUFBbkIsQ0FBUCxDQUh1QztLQUF6Qzs7QUFqQndDLFFBdUJuQyxnQkFBZ0IsWUFBWSxLQUFaLEVBQW9CO0FBQ3ZDLFVBQUksa0JBQWtCLFlBQVksS0FBWixDQUFtQixZQUFuQixDQUFsQixDQURtQztBQUV2QyxzQkFBZ0IsSUFBaEIsQ0FBc0IsSUFBdEIsRUFGdUM7QUFHdkMsYUFBTyxZQUFZLEtBQVosQ0FBbUIsWUFBbkIsQ0FBUCxDQUh1QztLQUF6Qzs7QUFNQSxTQUFLLFNBQUwsQ0FBZ0IsZUFBaEIsRUFBaUMsQ0FBRSxJQUFGLENBQWpDLEVBN0J3QztHQUFsQixDQW5Wa0M7O0FBbVgxRCxRQUFNLGlCQUFOLEdBQTBCLFlBQVc7QUFDbkMsU0FBSyxzQkFBTCxHQURtQztBQUVuQyxTQUFLLE9BQUwsQ0FBYSxtQkFBYixDQUFrQyxrQkFBbEMsRUFBc0QsSUFBdEQsRUFBNEQsS0FBNUQsRUFGbUM7QUFHbkMsU0FBSyxlQUFMLEdBQXVCLEtBQXZCLENBSG1DO0dBQVg7Ozs7OztBQW5YZ0MsT0E2WDFELENBQU0sYUFBTixHQUFzQixVQUFVLEtBQVYsRUFBa0I7O0FBRXRDLFFBQUksYUFBYSxFQUFiLENBRmtDO0FBR3RDLFNBQU0sSUFBSSxJQUFKLElBQVksS0FBbEIsRUFBMEI7QUFDeEIsaUJBQVksSUFBWixJQUFxQixFQUFyQixDQUR3QjtLQUExQjtBQUdBLFNBQUssR0FBTCxDQUFVLFVBQVYsRUFOc0M7R0FBbEIsQ0E3WG9DOztBQXNZMUQsTUFBSSx1QkFBdUI7QUFDekIsd0JBQW9CLEVBQXBCO0FBQ0Esd0JBQW9CLEVBQXBCO0dBRkUsQ0F0WXNEOztBQTJZMUQsUUFBTSxzQkFBTixHQUErQixZQUFXOztBQUV4QyxTQUFLLEdBQUwsQ0FBVSxvQkFBVixFQUZ3QztHQUFYOzs7OztBQTNZMkIsT0FtWjFELENBQU0sVUFBTixHQUFtQixZQUFXO0FBQzVCLFNBQUssT0FBTCxDQUFhLFVBQWIsQ0FBd0IsV0FBeEIsQ0FBcUMsS0FBSyxPQUFMLENBQXJDOztBQUQ0QixRQUc1QixDQUFLLEdBQUwsQ0FBUyxFQUFFLFNBQVMsRUFBVCxFQUFYLEVBSDRCO0FBSTVCLFNBQUssU0FBTCxDQUFnQixRQUFoQixFQUEwQixDQUFFLElBQUYsQ0FBMUIsRUFKNEI7R0FBWCxDQW5adUM7O0FBMFoxRCxRQUFNLE1BQU4sR0FBZSxZQUFXOztBQUV4QixRQUFLLENBQUMsa0JBQUQsSUFBdUIsQ0FBQyxXQUFZLEtBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0Isa0JBQXBCLENBQWIsRUFBd0Q7QUFDbEYsV0FBSyxVQUFMLEdBRGtGO0FBRWxGLGFBRmtGO0tBQXBGOzs7QUFGd0IsUUFReEIsQ0FBSyxJQUFMLENBQVcsZUFBWCxFQUE0QixZQUFXO0FBQ3JDLFdBQUssVUFBTCxHQURxQztLQUFYLENBQTVCLENBUndCO0FBV3hCLFNBQUssSUFBTCxHQVh3QjtHQUFYLENBMVoyQzs7QUF3YTFELFFBQU0sTUFBTixHQUFlLFlBQVc7QUFDeEIsV0FBTyxLQUFLLFFBQUw7O0FBRGlCLFFBR3hCLENBQUssR0FBTCxDQUFTLEVBQUUsU0FBUyxFQUFULEVBQVgsRUFId0I7O0FBS3hCLFFBQUksVUFBVSxLQUFLLE1BQUwsQ0FBWSxPQUFaLENBTFU7O0FBT3hCLFFBQUksa0JBQWtCLEVBQWxCLENBUG9CO0FBUXhCLFFBQUksd0JBQXdCLEtBQUssa0NBQUwsQ0FBd0MsY0FBeEMsQ0FBeEIsQ0FSb0I7QUFTeEIsb0JBQWlCLHFCQUFqQixJQUEyQyxLQUFLLHFCQUFMLENBVG5COztBQVd4QixTQUFLLFVBQUwsQ0FBZ0I7QUFDZCxZQUFNLFFBQVEsV0FBUjtBQUNOLFVBQUksUUFBUSxZQUFSO0FBQ0osa0JBQVksSUFBWjtBQUNBLHVCQUFpQixlQUFqQjtLQUpGLEVBWHdCO0dBQVgsQ0F4YTJDOztBQTJiMUQsUUFBTSxxQkFBTixHQUE4QixZQUFXOzs7QUFHdkMsUUFBSyxDQUFDLEtBQUssUUFBTCxFQUFnQjtBQUNwQixXQUFLLFNBQUwsQ0FBZSxRQUFmLEVBRG9CO0tBQXRCO0dBSDRCOzs7Ozs7O0FBM2I0QixPQXdjMUQsQ0FBTSxrQ0FBTixHQUEyQyxVQUFVLGFBQVYsRUFBMEI7QUFDbkUsUUFBSSxjQUFjLEtBQUssTUFBTCxDQUFZLE9BQVosQ0FBcUIsYUFBckIsQ0FBZDs7QUFEK0QsUUFHOUQsWUFBWSxPQUFaLEVBQXNCO0FBQ3pCLGFBQU8sU0FBUCxDQUR5QjtLQUEzQjs7QUFIbUUsU0FPN0QsSUFBSSxJQUFKLElBQVksV0FBbEIsRUFBZ0M7QUFDOUIsYUFBTyxJQUFQLENBRDhCO0tBQWhDO0dBUHlDLENBeGNlOztBQW9kMUQsUUFBTSxJQUFOLEdBQWEsWUFBVzs7QUFFdEIsU0FBSyxRQUFMLEdBQWdCLElBQWhCOztBQUZzQixRQUl0QixDQUFLLEdBQUwsQ0FBUyxFQUFFLFNBQVMsRUFBVCxFQUFYLEVBSnNCOztBQU10QixRQUFJLFVBQVUsS0FBSyxNQUFMLENBQVksT0FBWixDQU5ROztBQVF0QixRQUFJLGtCQUFrQixFQUFsQixDQVJrQjtBQVN0QixRQUFJLHdCQUF3QixLQUFLLGtDQUFMLENBQXdDLGFBQXhDLENBQXhCLENBVGtCO0FBVXRCLG9CQUFpQixxQkFBakIsSUFBMkMsS0FBSyxtQkFBTCxDQVZyQjs7QUFZdEIsU0FBSyxVQUFMLENBQWdCO0FBQ2QsWUFBTSxRQUFRLFlBQVI7QUFDTixVQUFJLFFBQVEsV0FBUjs7QUFFSixrQkFBWSxJQUFaO0FBQ0EsdUJBQWlCLGVBQWpCO0tBTEYsRUFac0I7R0FBWCxDQXBkNkM7O0FBeWUxRCxRQUFNLG1CQUFOLEdBQTRCLFlBQVc7OztBQUdyQyxRQUFLLEtBQUssUUFBTCxFQUFnQjtBQUNuQixXQUFLLEdBQUwsQ0FBUyxFQUFFLFNBQVMsTUFBVCxFQUFYLEVBRG1CO0FBRW5CLFdBQUssU0FBTCxDQUFlLE1BQWYsRUFGbUI7S0FBckI7R0FIMEIsQ0F6ZThCOztBQWtmMUQsUUFBTSxPQUFOLEdBQWdCLFlBQVc7QUFDekIsU0FBSyxHQUFMLENBQVM7QUFDUCxnQkFBVSxFQUFWO0FBQ0EsWUFBTSxFQUFOO0FBQ0EsYUFBTyxFQUFQO0FBQ0EsV0FBSyxFQUFMO0FBQ0EsY0FBUSxFQUFSO0FBQ0Esa0JBQVksRUFBWjtBQUNBLGlCQUFXLEVBQVg7S0FQRixFQUR5QjtHQUFYLENBbGYwQzs7QUE4ZjFELFNBQU8sSUFBUCxDQTlmMEQ7Q0FBL0MsQ0E5Qlg7Ozs7Ozs7O0FBc2lCQSxDQUFFLFVBQVUsTUFBVixFQUFrQixPQUFsQixFQUE0QjtBQUM1Qjs7O0FBRDRCO0FBSTVCLE1BQUssT0FBTyxNQUFQLElBQWlCLFVBQWpCLElBQStCLE9BQU8sR0FBUCxFQUFhOztBQUUvQyxXQUFRLG1CQUFSLEVBQTRCLENBQ3hCLHVCQUR3QixFQUV4QixtQkFGd0IsRUFHeEIsc0JBSHdCLEVBSXhCLFFBSndCLENBQTVCLEVBTUUsVUFBVSxTQUFWLEVBQXFCLE9BQXJCLEVBQThCLEtBQTlCLEVBQXFDLElBQXJDLEVBQTRDO0FBQzFDLGFBQU8sUUFBUyxNQUFULEVBQWlCLFNBQWpCLEVBQTRCLE9BQTVCLEVBQXFDLEtBQXJDLEVBQTRDLElBQTVDLENBQVAsQ0FEMEM7S0FBNUMsQ0FORixDQUYrQztHQUFqRCxNQVlPLElBQUssT0FBTyxNQUFQLElBQWlCLFFBQWpCLElBQTZCLE9BQU8sT0FBUCxFQUFpQjs7QUFFeEQsV0FBTyxPQUFQLEdBQWlCLFFBQ2YsTUFEZSxFQUVmLFFBQVEsWUFBUixDQUZlLEVBR2YsUUFBUSxVQUFSLENBSGUsRUFJZixRQUFRLGdCQUFSLENBSmUsRUFLZixRQUFRLFFBQVIsQ0FMZSxDQUFqQixDQUZ3RDtHQUFuRCxNQVNBOztBQUVMLFdBQU8sUUFBUCxHQUFrQixRQUNoQixNQURnQixFQUVoQixPQUFPLFNBQVAsRUFDQSxPQUFPLE9BQVAsRUFDQSxPQUFPLFlBQVAsRUFDQSxPQUFPLFFBQVAsQ0FBZ0IsSUFBaEIsQ0FMRixDQUZLO0dBVEE7Q0FoQlAsRUFvQ0MsTUFwQ0QsRUFvQ1MsU0FBUyxPQUFULENBQWtCLE1BQWxCLEVBQTBCLFNBQTFCLEVBQXFDLE9BQXJDLEVBQThDLEtBQTlDLEVBQXFELElBQXJELEVBQTREO0FBQ3ZFOzs7O0FBRHVFLE1BS25FLFVBQVUsT0FBTyxPQUFQLENBTHlEO0FBTXZFLE1BQUksU0FBUyxPQUFPLE1BQVAsQ0FOMEQ7QUFPdkUsTUFBSSxPQUFPLFlBQVcsRUFBWDs7Ozs7QUFQNEQsTUFZbkUsT0FBTyxDQUFQOztBQVptRSxNQWNuRSxZQUFZLEVBQVo7Ozs7Ozs7QUFkbUUsV0FzQjlELFFBQVQsQ0FBbUIsT0FBbkIsRUFBNEIsT0FBNUIsRUFBc0M7QUFDcEMsUUFBSSxlQUFlLE1BQU0sZUFBTixDQUF1QixPQUF2QixDQUFmLENBRGdDO0FBRXBDLFFBQUssQ0FBQyxZQUFELEVBQWdCO0FBQ25CLFVBQUssT0FBTCxFQUFlO0FBQ2IsZ0JBQVEsS0FBUixDQUFlLHFCQUFxQixLQUFLLFdBQUwsQ0FBaUIsU0FBakIsR0FDbEMsSUFEYSxJQUNKLGdCQUFnQixPQUFoQixDQURJLENBQWYsQ0FEYTtPQUFmO0FBSUEsYUFMbUI7S0FBckI7QUFPQSxTQUFLLE9BQUwsR0FBZSxZQUFmOztBQVRvQyxRQVcvQixNQUFMLEVBQWM7QUFDWixXQUFLLFFBQUwsR0FBZ0IsT0FBUSxLQUFLLE9BQUwsQ0FBeEIsQ0FEWTtLQUFkOzs7QUFYb0MsUUFnQnBDLENBQUssT0FBTCxHQUFlLE1BQU0sTUFBTixDQUFjLEVBQWQsRUFBa0IsS0FBSyxXQUFMLENBQWlCLFFBQWpCLENBQWpDLENBaEJvQztBQWlCcEMsU0FBSyxNQUFMLENBQWEsT0FBYjs7O0FBakJvQyxRQW9CaEMsS0FBSyxFQUFFLElBQUYsQ0FwQjJCO0FBcUJwQyxTQUFLLE9BQUwsQ0FBYSxZQUFiLEdBQTRCLEVBQTVCO0FBckJvQyxhQXNCcEMsQ0FBVyxFQUFYLElBQWtCLElBQWxCOzs7QUF0Qm9DLFFBeUJwQyxDQUFLLE9BQUwsR0F6Qm9DOztBQTJCcEMsUUFBSSxlQUFlLEtBQUssVUFBTCxDQUFnQixZQUFoQixDQUFmLENBM0JnQztBQTRCcEMsUUFBSyxZQUFMLEVBQW9CO0FBQ2xCLFdBQUssTUFBTCxHQURrQjtLQUFwQjtHQTVCRjs7O0FBdEJ1RSxVQXdEdkUsQ0FBUyxTQUFULEdBQXFCLFVBQXJCLENBeER1RTtBQXlEdkUsV0FBUyxJQUFULEdBQWdCLElBQWhCOzs7QUF6RHVFLFVBNER2RSxDQUFTLFFBQVQsR0FBb0I7QUFDbEIsb0JBQWdCO0FBQ2QsZ0JBQVUsVUFBVjtLQURGO0FBR0EsZ0JBQVksSUFBWjtBQUNBLGdCQUFZLElBQVo7QUFDQSxlQUFXLElBQVg7QUFDQSxZQUFRLElBQVI7QUFDQSxxQkFBaUIsSUFBakI7O0FBRUEsd0JBQW9CLE1BQXBCO0FBQ0EsaUJBQWE7QUFDWCxlQUFTLENBQVQ7QUFDQSxpQkFBVyxjQUFYO0tBRkY7QUFJQSxrQkFBYztBQUNaLGVBQVMsQ0FBVDtBQUNBLGlCQUFXLFVBQVg7S0FGRjtHQWZGLENBNUR1RTs7QUFpRnZFLE1BQUksUUFBUSxTQUFTLFNBQVQ7O0FBakYyRCxPQW1GdkUsQ0FBTSxNQUFOLENBQWMsS0FBZCxFQUFxQixVQUFVLFNBQVYsQ0FBckI7Ozs7OztBQW5GdUUsT0F5RnZFLENBQU0sTUFBTixHQUFlLFVBQVUsSUFBVixFQUFpQjtBQUM5QixVQUFNLE1BQU4sQ0FBYyxLQUFLLE9BQUwsRUFBYyxJQUE1QixFQUQ4QjtHQUFqQjs7Ozs7QUF6RndELE9BZ0d2RSxDQUFNLFVBQU4sR0FBbUIsVUFBVSxNQUFWLEVBQW1CO0FBQ3BDLFFBQUksWUFBWSxLQUFLLFdBQUwsQ0FBaUIsYUFBakIsQ0FBZ0MsTUFBaEMsQ0FBWixDQURnQztBQUVwQyxXQUFPLGFBQWEsS0FBSyxPQUFMLENBQWMsU0FBZCxNQUE4QixTQUE5QixHQUNsQixLQUFLLE9BQUwsQ0FBYyxTQUFkLENBREssR0FDdUIsS0FBSyxPQUFMLENBQWMsTUFBZCxDQUR2QixDQUY2QjtHQUFuQixDQWhHb0Q7O0FBc0d2RSxXQUFTLGFBQVQsR0FBeUI7O0FBRXZCLGdCQUFZLGNBQVo7QUFDQSxnQkFBWSxjQUFaO0FBQ0EsbUJBQWUsaUJBQWY7QUFDQSxnQkFBWSxjQUFaO0FBQ0EsZUFBVyxhQUFYO0FBQ0EsWUFBUSxlQUFSO0FBQ0EscUJBQWlCLHFCQUFqQjtHQVJGLENBdEd1RTs7QUFpSHZFLFFBQU0sT0FBTixHQUFnQixZQUFXOztBQUV6QixTQUFLLFdBQUw7O0FBRnlCLFFBSXpCLENBQUssTUFBTCxHQUFjLEVBQWQsQ0FKeUI7QUFLekIsU0FBSyxLQUFMLENBQVksS0FBSyxPQUFMLENBQWEsS0FBYixDQUFaOztBQUx5QixTQU96QixDQUFNLE1BQU4sQ0FBYyxLQUFLLE9BQUwsQ0FBYSxLQUFiLEVBQW9CLEtBQUssT0FBTCxDQUFhLGNBQWIsQ0FBbEM7OztBQVB5QixRQVVyQixnQkFBZ0IsS0FBSyxVQUFMLENBQWdCLFFBQWhCLENBQWhCLENBVnFCO0FBV3pCLFFBQUssYUFBTCxFQUFxQjtBQUNuQixXQUFLLFVBQUwsR0FEbUI7S0FBckI7R0FYYzs7O0FBakh1RCxPQWtJdkUsQ0FBTSxXQUFOLEdBQW9CLFlBQVc7O0FBRTdCLFNBQUssS0FBTCxHQUFhLEtBQUssUUFBTCxDQUFlLEtBQUssT0FBTCxDQUFhLFFBQWIsQ0FBNUIsQ0FGNkI7R0FBWDs7Ozs7OztBQWxJbUQsT0E2SXZFLENBQU0sUUFBTixHQUFpQixVQUFVLEtBQVYsRUFBa0I7O0FBRWpDLFFBQUksWUFBWSxLQUFLLHVCQUFMLENBQThCLEtBQTlCLENBQVosQ0FGNkI7QUFHakMsUUFBSSxPQUFPLEtBQUssV0FBTCxDQUFpQixJQUFqQjs7O0FBSHNCLFFBTTdCLFFBQVEsRUFBUixDQU42QjtBQU9qQyxTQUFNLElBQUksSUFBRSxDQUFGLEVBQUssSUFBSSxVQUFVLE1BQVYsRUFBa0IsR0FBckMsRUFBMkM7QUFDekMsVUFBSSxPQUFPLFVBQVUsQ0FBVixDQUFQLENBRHFDO0FBRXpDLFVBQUksT0FBTyxJQUFJLElBQUosQ0FBVSxJQUFWLEVBQWdCLElBQWhCLENBQVAsQ0FGcUM7QUFHekMsWUFBTSxJQUFOLENBQVksSUFBWixFQUh5QztLQUEzQzs7QUFNQSxXQUFPLEtBQVAsQ0FiaUM7R0FBbEI7Ozs7Ozs7QUE3SXNELE9Ba0t2RSxDQUFNLHVCQUFOLEdBQWdDLFVBQVUsS0FBVixFQUFrQjtBQUNoRCxXQUFPLE1BQU0sa0JBQU4sQ0FBMEIsS0FBMUIsRUFBaUMsS0FBSyxPQUFMLENBQWEsWUFBYixDQUF4QyxDQURnRDtHQUFsQjs7Ozs7O0FBbEt1QyxPQTBLdkUsQ0FBTSxlQUFOLEdBQXdCLFlBQVc7QUFDakMsV0FBTyxLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWdCLFVBQVUsSUFBVixFQUFpQjtBQUN0QyxhQUFPLEtBQUssT0FBTCxDQUQrQjtLQUFqQixDQUF2QixDQURpQztHQUFYOzs7Ozs7O0FBMUsrQyxPQXFMdkUsQ0FBTSxNQUFOLEdBQWUsWUFBVztBQUN4QixTQUFLLFlBQUwsR0FEd0I7QUFFeEIsU0FBSyxhQUFMOzs7QUFGd0IsUUFLcEIsZ0JBQWdCLEtBQUssVUFBTCxDQUFnQixlQUFoQixDQUFoQixDQUxvQjtBQU14QixRQUFJLFlBQVksa0JBQWtCLFNBQWxCLEdBQ2QsYUFEYyxHQUNFLENBQUMsS0FBSyxlQUFMLENBUEs7QUFReEIsU0FBSyxXQUFMLENBQWtCLEtBQUssS0FBTCxFQUFZLFNBQTlCOzs7QUFSd0IsUUFXeEIsQ0FBSyxlQUFMLEdBQXVCLElBQXZCLENBWHdCO0dBQVg7OztBQXJMd0QsT0FvTXZFLENBQU0sS0FBTixHQUFjLE1BQU0sTUFBTjs7Ozs7QUFwTXlELE9BeU12RSxDQUFNLFlBQU4sR0FBcUIsWUFBVztBQUM5QixTQUFLLE9BQUwsR0FEOEI7R0FBWCxDQXpNa0Q7O0FBOE12RSxRQUFNLE9BQU4sR0FBZ0IsWUFBVztBQUN6QixTQUFLLElBQUwsR0FBWSxRQUFTLEtBQUssT0FBTCxDQUFyQixDQUR5QjtHQUFYOzs7Ozs7Ozs7Ozs7QUE5TXVELE9BNE52RSxDQUFNLGVBQU4sR0FBd0IsVUFBVSxXQUFWLEVBQXVCLElBQXZCLEVBQThCO0FBQ3BELFFBQUksU0FBUyxLQUFLLE9BQUwsQ0FBYyxXQUFkLENBQVQsQ0FEZ0Q7QUFFcEQsUUFBSSxJQUFKLENBRm9EO0FBR3BELFFBQUssQ0FBQyxNQUFELEVBQVU7O0FBRWIsV0FBTSxXQUFOLElBQXNCLENBQXRCLENBRmE7S0FBZixNQUdPOztBQUVMLFVBQUssT0FBTyxNQUFQLElBQWlCLFFBQWpCLEVBQTRCO0FBQy9CLGVBQU8sS0FBSyxPQUFMLENBQWEsYUFBYixDQUE0QixNQUE1QixDQUFQLENBRCtCO09BQWpDLE1BRU8sSUFBSyxrQkFBa0IsV0FBbEIsRUFBZ0M7QUFDMUMsZUFBTyxNQUFQLENBRDBDO09BQXJDOztBQUpGLFVBUUwsQ0FBTSxXQUFOLElBQXNCLE9BQU8sUUFBUyxJQUFULEVBQWlCLElBQWpCLENBQVAsR0FBaUMsTUFBakMsQ0FSakI7S0FIUDtHQUhzQjs7Ozs7O0FBNU4rQyxPQWtQdkUsQ0FBTSxXQUFOLEdBQW9CLFVBQVUsS0FBVixFQUFpQixTQUFqQixFQUE2QjtBQUMvQyxZQUFRLEtBQUssa0JBQUwsQ0FBeUIsS0FBekIsQ0FBUixDQUQrQzs7QUFHL0MsU0FBSyxZQUFMLENBQW1CLEtBQW5CLEVBQTBCLFNBQTFCLEVBSCtDOztBQUsvQyxTQUFLLFdBQUwsR0FMK0M7R0FBN0I7Ozs7Ozs7O0FBbFBtRCxPQWdRdkUsQ0FBTSxrQkFBTixHQUEyQixVQUFVLEtBQVYsRUFBa0I7QUFDM0MsV0FBTyxNQUFNLE1BQU4sQ0FBYyxVQUFVLElBQVYsRUFBaUI7QUFDcEMsYUFBTyxDQUFDLEtBQUssU0FBTCxDQUQ0QjtLQUFqQixDQUFyQixDQUQyQztHQUFsQjs7Ozs7OztBQWhRNEMsT0EyUXZFLENBQU0sWUFBTixHQUFxQixVQUFVLEtBQVYsRUFBaUIsU0FBakIsRUFBNkI7QUFDaEQsU0FBSyxvQkFBTCxDQUEyQixRQUEzQixFQUFxQyxLQUFyQyxFQURnRDs7QUFHaEQsUUFBSyxDQUFDLEtBQUQsSUFBVSxDQUFDLE1BQU0sTUFBTixFQUFlOztBQUU3QixhQUY2QjtLQUEvQjs7QUFLQSxRQUFJLFFBQVEsRUFBUixDQVI0Qzs7QUFVaEQsVUFBTSxPQUFOLENBQWUsVUFBVSxJQUFWLEVBQWlCOztBQUU5QixVQUFJLFdBQVcsS0FBSyxzQkFBTCxDQUE2QixJQUE3QixDQUFYOztBQUYwQixjQUk5QixDQUFTLElBQVQsR0FBZ0IsSUFBaEIsQ0FKOEI7QUFLOUIsZUFBUyxTQUFULEdBQXFCLGFBQWEsS0FBSyxlQUFMLENBTEo7QUFNOUIsWUFBTSxJQUFOLENBQVksUUFBWixFQU44QjtLQUFqQixFQU9aLElBUEgsRUFWZ0Q7O0FBbUJoRCxTQUFLLG1CQUFMLENBQTBCLEtBQTFCLEVBbkJnRDtHQUE3Qjs7Ozs7OztBQTNRa0QsT0FzU3ZFLENBQU0sc0JBQU4sR0FBK0Isc0JBQXVCO0FBQ3BELFdBQU87QUFDTCxTQUFHLENBQUg7QUFDQSxTQUFHLENBQUg7S0FGRixDQURvRDtHQUF2Qjs7Ozs7Ozs7QUF0U3dDLE9BbVR2RSxDQUFNLG1CQUFOLEdBQTRCLFVBQVUsS0FBVixFQUFrQjtBQUM1QyxVQUFNLE9BQU4sQ0FBZSxVQUFVLEdBQVYsRUFBZ0I7QUFDN0IsV0FBSyxhQUFMLENBQW9CLElBQUksSUFBSixFQUFVLElBQUksQ0FBSixFQUFPLElBQUksQ0FBSixFQUFPLElBQUksU0FBSixDQUE1QyxDQUQ2QjtLQUFoQixFQUVaLElBRkgsRUFENEM7R0FBbEI7Ozs7Ozs7OztBQW5UMkMsT0FnVXZFLENBQU0sYUFBTixHQUFzQixVQUFVLElBQVYsRUFBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkIsRUFBc0IsU0FBdEIsRUFBa0M7QUFDdEQsUUFBSyxTQUFMLEVBQWlCOztBQUVmLFdBQUssSUFBTCxDQUFXLENBQVgsRUFBYyxDQUFkLEVBRmU7S0FBakIsTUFHTztBQUNMLFdBQUssTUFBTCxDQUFhLENBQWIsRUFBZ0IsQ0FBaEIsRUFESztLQUhQO0dBRG9COzs7Ozs7QUFoVWlELE9BNlV2RSxDQUFNLFdBQU4sR0FBb0IsWUFBVztBQUM3QixTQUFLLGVBQUwsR0FENkI7R0FBWCxDQTdVbUQ7O0FBaVZ2RSxRQUFNLGVBQU4sR0FBd0IsWUFBVztBQUNqQyxRQUFJLHNCQUFzQixLQUFLLFVBQUwsQ0FBZ0IsaUJBQWhCLENBQXRCLENBRDZCO0FBRWpDLFFBQUssQ0FBQyxtQkFBRCxFQUF1QjtBQUMxQixhQUQwQjtLQUE1QjtBQUdBLFFBQUksT0FBTyxLQUFLLGlCQUFMLEVBQVAsQ0FMNkI7QUFNakMsUUFBSyxJQUFMLEVBQVk7QUFDVixXQUFLLG9CQUFMLENBQTJCLEtBQUssS0FBTCxFQUFZLElBQXZDLEVBRFU7QUFFVixXQUFLLG9CQUFMLENBQTJCLEtBQUssTUFBTCxFQUFhLEtBQXhDLEVBRlU7S0FBWjtHQU5zQjs7Ozs7Ozs7QUFqVitDLE9BbVd2RSxDQUFNLGlCQUFOLEdBQTBCLElBQTFCOzs7Ozs7QUFuV3VFLE9BeVd2RSxDQUFNLG9CQUFOLEdBQTZCLFVBQVUsT0FBVixFQUFtQixPQUFuQixFQUE2QjtBQUN4RCxRQUFLLFlBQVksU0FBWixFQUF3QjtBQUMzQixhQUQyQjtLQUE3Qjs7QUFJQSxRQUFJLFdBQVcsS0FBSyxJQUFMOztBQUx5QyxRQU9uRCxTQUFTLFdBQVQsRUFBdUI7QUFDMUIsaUJBQVcsVUFBVSxTQUFTLFdBQVQsR0FBdUIsU0FBUyxZQUFULEdBQzFDLFNBQVMsZUFBVCxHQUEyQixTQUFTLGdCQUFULEdBQzNCLFNBQVMsYUFBVCxHQUF5QixTQUFTLFVBQVQsR0FDekIsU0FBUyxjQUFULEdBQTBCLFNBQVMsaUJBQVQsQ0FKRjtLQUE1Qjs7QUFPQSxjQUFVLEtBQUssR0FBTCxDQUFVLE9BQVYsRUFBbUIsQ0FBbkIsQ0FBVixDQWR3RDtBQWV4RCxTQUFLLE9BQUwsQ0FBYSxLQUFiLENBQW9CLFVBQVUsT0FBVixHQUFvQixRQUFwQixDQUFwQixHQUFxRCxVQUFVLElBQVYsQ0FmRztHQUE3Qjs7Ozs7OztBQXpXMEMsT0FnWXZFLENBQU0sb0JBQU4sR0FBNkIsVUFBVSxTQUFWLEVBQXFCLEtBQXJCLEVBQTZCO0FBQ3hELFFBQUksUUFBUSxJQUFSLENBRG9EO0FBRXhELGFBQVMsVUFBVCxHQUFzQjtBQUNwQixZQUFNLGFBQU4sQ0FBcUIsWUFBWSxVQUFaLEVBQXdCLElBQTdDLEVBQW1ELENBQUUsS0FBRixDQUFuRCxFQURvQjtLQUF0Qjs7QUFJQSxRQUFJLFFBQVEsTUFBTSxNQUFOLENBTjRDO0FBT3hELFFBQUssQ0FBQyxLQUFELElBQVUsQ0FBQyxLQUFELEVBQVM7QUFDdEIsbUJBRHNCO0FBRXRCLGFBRnNCO0tBQXhCOztBQUtBLFFBQUksWUFBWSxDQUFaLENBWm9EO0FBYXhELGFBQVMsSUFBVCxHQUFnQjtBQUNkLGtCQURjO0FBRWQsVUFBSyxhQUFhLEtBQWIsRUFBcUI7QUFDeEIscUJBRHdCO09BQTFCO0tBRkY7OztBQWJ3RCxTQXFCeEQsQ0FBTSxPQUFOLENBQWUsVUFBVSxJQUFWLEVBQWlCO0FBQzlCLFdBQUssSUFBTCxDQUFXLFNBQVgsRUFBc0IsSUFBdEIsRUFEOEI7S0FBakIsQ0FBZixDQXJCd0Q7R0FBN0I7Ozs7Ozs7O0FBaFkwQyxPQWdhdkUsQ0FBTSxhQUFOLEdBQXNCLFVBQVUsSUFBVixFQUFnQixLQUFoQixFQUF1QixJQUF2QixFQUE4Qjs7QUFFbEQsUUFBSSxXQUFXLFFBQVEsQ0FBRSxLQUFGLEVBQVUsTUFBVixDQUFrQixJQUFsQixDQUFSLEdBQW1DLElBQW5DLENBRm1DO0FBR2xELFNBQUssU0FBTCxDQUFnQixJQUFoQixFQUFzQixRQUF0QixFQUhrRDs7QUFLbEQsUUFBSyxNQUFMLEVBQWM7O0FBRVosV0FBSyxRQUFMLEdBQWdCLEtBQUssUUFBTCxJQUFpQixPQUFRLEtBQUssT0FBTCxDQUF6QixDQUZKO0FBR1osVUFBSyxLQUFMLEVBQWE7O0FBRVgsWUFBSSxTQUFTLE9BQU8sS0FBUCxDQUFjLEtBQWQsQ0FBVCxDQUZPO0FBR1gsZUFBTyxJQUFQLEdBQWMsSUFBZCxDQUhXO0FBSVgsYUFBSyxRQUFMLENBQWMsT0FBZCxDQUF1QixNQUF2QixFQUErQixJQUEvQixFQUpXO09BQWIsTUFLTzs7QUFFTCxhQUFLLFFBQUwsQ0FBYyxPQUFkLENBQXVCLElBQXZCLEVBQTZCLElBQTdCLEVBRks7T0FMUDtLQUhGO0dBTG9COzs7Ozs7Ozs7QUFoYWlELE9BNGJ2RSxDQUFNLE1BQU4sR0FBZSxVQUFVLElBQVYsRUFBaUI7QUFDOUIsUUFBSSxPQUFPLEtBQUssT0FBTCxDQUFjLElBQWQsQ0FBUCxDQUQwQjtBQUU5QixRQUFLLElBQUwsRUFBWTtBQUNWLFdBQUssU0FBTCxHQUFpQixJQUFqQixDQURVO0tBQVo7R0FGYTs7Ozs7O0FBNWJ3RCxPQXVjdkUsQ0FBTSxRQUFOLEdBQWlCLFVBQVUsSUFBVixFQUFpQjtBQUNoQyxRQUFJLE9BQU8sS0FBSyxPQUFMLENBQWMsSUFBZCxDQUFQLENBRDRCO0FBRWhDLFFBQUssSUFBTCxFQUFZO0FBQ1YsYUFBTyxLQUFLLFNBQUwsQ0FERztLQUFaO0dBRmU7Ozs7OztBQXZjc0QsT0FrZHZFLENBQU0sS0FBTixHQUFjLFVBQVUsS0FBVixFQUFrQjtBQUM5QixZQUFRLEtBQUssS0FBTCxDQUFZLEtBQVosQ0FBUixDQUQ4QjtBQUU5QixRQUFLLENBQUMsS0FBRCxFQUFTO0FBQ1osYUFEWTtLQUFkOztBQUlBLFNBQUssTUFBTCxHQUFjLEtBQUssTUFBTCxDQUFZLE1BQVosQ0FBb0IsS0FBcEIsQ0FBZDs7QUFOOEIsU0FROUIsQ0FBTSxPQUFOLENBQWUsS0FBSyxNQUFMLEVBQWEsSUFBNUIsRUFSOEI7R0FBbEI7Ozs7OztBQWxkeUQsT0FpZXZFLENBQU0sT0FBTixHQUFnQixVQUFVLEtBQVYsRUFBa0I7QUFDaEMsWUFBUSxLQUFLLEtBQUwsQ0FBWSxLQUFaLENBQVIsQ0FEZ0M7QUFFaEMsUUFBSyxDQUFDLEtBQUQsRUFBUTtBQUNYLGFBRFc7S0FBYjs7QUFJQSxVQUFNLE9BQU4sQ0FBZSxVQUFVLElBQVYsRUFBaUI7O0FBRTlCLFlBQU0sVUFBTixDQUFrQixLQUFLLE1BQUwsRUFBYSxJQUEvQixFQUY4QjtBQUc5QixXQUFLLFFBQUwsQ0FBZSxJQUFmLEVBSDhCO0tBQWpCLEVBSVosSUFKSCxFQU5nQztHQUFsQjs7Ozs7OztBQWpldUQsT0FtZnZFLENBQU0sS0FBTixHQUFjLFVBQVUsS0FBVixFQUFrQjtBQUM5QixRQUFLLENBQUMsS0FBRCxFQUFTO0FBQ1osYUFEWTtLQUFkOztBQUQ4QixRQUt6QixPQUFPLEtBQVAsSUFBZ0IsUUFBaEIsRUFBMkI7QUFDOUIsY0FBUSxLQUFLLE9BQUwsQ0FBYSxnQkFBYixDQUErQixLQUEvQixDQUFSLENBRDhCO0tBQWhDO0FBR0EsWUFBUSxNQUFNLFNBQU4sQ0FBaUIsS0FBakIsQ0FBUixDQVI4QjtBQVM5QixXQUFPLEtBQVAsQ0FUOEI7R0FBbEIsQ0FuZnlEOztBQStmdkUsUUFBTSxhQUFOLEdBQXNCLFlBQVc7QUFDL0IsUUFBSyxDQUFDLEtBQUssTUFBTCxJQUFlLENBQUMsS0FBSyxNQUFMLENBQVksTUFBWixFQUFxQjtBQUN6QyxhQUR5QztLQUEzQzs7QUFJQSxTQUFLLGdCQUFMLEdBTCtCOztBQU8vQixTQUFLLE1BQUwsQ0FBWSxPQUFaLENBQXFCLEtBQUssWUFBTCxFQUFtQixJQUF4QyxFQVArQjtHQUFYOzs7QUEvZmlELE9BMGdCdkUsQ0FBTSxnQkFBTixHQUF5QixZQUFXOztBQUVsQyxRQUFJLGVBQWUsS0FBSyxPQUFMLENBQWEscUJBQWIsRUFBZixDQUY4QjtBQUdsQyxRQUFJLE9BQU8sS0FBSyxJQUFMLENBSHVCO0FBSWxDLFNBQUssYUFBTCxHQUFxQjtBQUNuQixZQUFNLGFBQWEsSUFBYixHQUFvQixLQUFLLFdBQUwsR0FBbUIsS0FBSyxlQUFMO0FBQzdDLFdBQUssYUFBYSxHQUFiLEdBQW1CLEtBQUssVUFBTCxHQUFrQixLQUFLLGNBQUw7QUFDMUMsYUFBTyxhQUFhLEtBQWIsSUFBdUIsS0FBSyxZQUFMLEdBQW9CLEtBQUssZ0JBQUwsQ0FBM0M7QUFDUCxjQUFRLGFBQWEsTUFBYixJQUF3QixLQUFLLGFBQUwsR0FBcUIsS0FBSyxpQkFBTCxDQUE3QztLQUpWLENBSmtDO0dBQVg7Ozs7O0FBMWdCOEMsT0F5aEJ2RSxDQUFNLFlBQU4sR0FBcUIsSUFBckI7Ozs7Ozs7QUF6aEJ1RSxPQWdpQnZFLENBQU0saUJBQU4sR0FBMEIsVUFBVSxJQUFWLEVBQWlCO0FBQ3pDLFFBQUksZUFBZSxLQUFLLHFCQUFMLEVBQWYsQ0FEcUM7QUFFekMsUUFBSSxXQUFXLEtBQUssYUFBTCxDQUYwQjtBQUd6QyxRQUFJLE9BQU8sUUFBUyxJQUFULENBQVAsQ0FIcUM7QUFJekMsUUFBSSxTQUFTO0FBQ1gsWUFBTSxhQUFhLElBQWIsR0FBb0IsU0FBUyxJQUFULEdBQWdCLEtBQUssVUFBTDtBQUMxQyxXQUFLLGFBQWEsR0FBYixHQUFtQixTQUFTLEdBQVQsR0FBZSxLQUFLLFNBQUw7QUFDdkMsYUFBTyxTQUFTLEtBQVQsR0FBaUIsYUFBYSxLQUFiLEdBQXFCLEtBQUssV0FBTDtBQUM3QyxjQUFRLFNBQVMsTUFBVCxHQUFrQixhQUFhLE1BQWIsR0FBc0IsS0FBSyxZQUFMO0tBSjlDLENBSnFDO0FBVXpDLFdBQU8sTUFBUCxDQVZ5QztHQUFqQjs7Ozs7O0FBaGlCNkMsT0FpakJ2RSxDQUFNLFdBQU4sR0FBb0IsTUFBTSxXQUFOOzs7OztBQWpqQm1ELE9Bc2pCdkUsQ0FBTSxVQUFOLEdBQW1CLFlBQVc7QUFDNUIsV0FBTyxnQkFBUCxDQUF5QixRQUF6QixFQUFtQyxJQUFuQyxFQUQ0QjtBQUU1QixTQUFLLGFBQUwsR0FBcUIsSUFBckIsQ0FGNEI7R0FBWDs7Ozs7QUF0akJvRCxPQThqQnZFLENBQU0sWUFBTixHQUFxQixZQUFXO0FBQzlCLFdBQU8sbUJBQVAsQ0FBNEIsUUFBNUIsRUFBc0MsSUFBdEMsRUFEOEI7QUFFOUIsU0FBSyxhQUFMLEdBQXFCLEtBQXJCLENBRjhCO0dBQVgsQ0E5akJrRDs7QUFta0J2RSxRQUFNLFFBQU4sR0FBaUIsWUFBVztBQUMxQixTQUFLLE1BQUwsR0FEMEI7R0FBWCxDQW5rQnNEOztBQXVrQnZFLFFBQU0sY0FBTixDQUFzQixRQUF0QixFQUFnQyxVQUFoQyxFQUE0QyxHQUE1QyxFQXZrQnVFOztBQXlrQnZFLFFBQU0sTUFBTixHQUFlLFlBQVc7OztBQUd4QixRQUFLLENBQUMsS0FBSyxhQUFMLElBQXNCLENBQUMsS0FBSyxpQkFBTCxFQUFELEVBQTRCO0FBQ3RELGFBRHNEO0tBQXhEOztBQUlBLFNBQUssTUFBTCxHQVB3QjtHQUFYOzs7Ozs7QUF6a0J3RCxPQXVsQnZFLENBQU0saUJBQU4sR0FBMEIsWUFBVztBQUNuQyxRQUFJLE9BQU8sUUFBUyxLQUFLLE9BQUwsQ0FBaEI7OztBQUQrQixRQUkvQixXQUFXLEtBQUssSUFBTCxJQUFhLElBQWIsQ0FKb0I7QUFLbkMsV0FBTyxZQUFZLEtBQUssVUFBTCxLQUFvQixLQUFLLElBQUwsQ0FBVSxVQUFWLENBTEo7R0FBWDs7Ozs7Ozs7O0FBdmxCNkMsT0FzbUJ2RSxDQUFNLFFBQU4sR0FBaUIsVUFBVSxLQUFWLEVBQWtCO0FBQ2pDLFFBQUksUUFBUSxLQUFLLFFBQUwsQ0FBZSxLQUFmLENBQVI7O0FBRDZCLFFBRzVCLE1BQU0sTUFBTixFQUFlO0FBQ2xCLFdBQUssS0FBTCxHQUFhLEtBQUssS0FBTCxDQUFXLE1BQVgsQ0FBbUIsS0FBbkIsQ0FBYixDQURrQjtLQUFwQjtBQUdBLFdBQU8sS0FBUCxDQU5pQztHQUFsQjs7Ozs7O0FBdG1Cc0QsT0FtbkJ2RSxDQUFNLFFBQU4sR0FBaUIsVUFBVSxLQUFWLEVBQWtCO0FBQ2pDLFFBQUksUUFBUSxLQUFLLFFBQUwsQ0FBZSxLQUFmLENBQVIsQ0FENkI7QUFFakMsUUFBSyxDQUFDLE1BQU0sTUFBTixFQUFlO0FBQ25CLGFBRG1CO0tBQXJCOztBQUZpQyxRQU1qQyxDQUFLLFdBQUwsQ0FBa0IsS0FBbEIsRUFBeUIsSUFBekIsRUFOaUM7QUFPakMsU0FBSyxNQUFMLENBQWEsS0FBYixFQVBpQztHQUFsQjs7Ozs7O0FBbm5Cc0QsT0Fpb0J2RSxDQUFNLFNBQU4sR0FBa0IsVUFBVSxLQUFWLEVBQWtCO0FBQ2xDLFFBQUksUUFBUSxLQUFLLFFBQUwsQ0FBZSxLQUFmLENBQVIsQ0FEOEI7QUFFbEMsUUFBSyxDQUFDLE1BQU0sTUFBTixFQUFlO0FBQ25CLGFBRG1CO0tBQXJCOztBQUZrQyxRQU05QixnQkFBZ0IsS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixDQUFqQixDQUFoQixDQU44QjtBQU9sQyxTQUFLLEtBQUwsR0FBYSxNQUFNLE1BQU4sQ0FBYyxhQUFkLENBQWI7O0FBUGtDLFFBU2xDLENBQUssWUFBTCxHQVRrQztBQVVsQyxTQUFLLGFBQUw7O0FBVmtDLFFBWWxDLENBQUssV0FBTCxDQUFrQixLQUFsQixFQUF5QixJQUF6QixFQVprQztBQWFsQyxTQUFLLE1BQUwsQ0FBYSxLQUFiOztBQWJrQyxRQWVsQyxDQUFLLFdBQUwsQ0FBa0IsYUFBbEIsRUFma0M7R0FBbEI7Ozs7OztBQWpvQnFELE9BdXBCdkUsQ0FBTSxNQUFOLEdBQWUsVUFBVSxLQUFWLEVBQWtCO0FBQy9CLFNBQUssb0JBQUwsQ0FBMkIsUUFBM0IsRUFBcUMsS0FBckMsRUFEK0I7QUFFL0IsUUFBSyxDQUFDLEtBQUQsSUFBVSxDQUFDLE1BQU0sTUFBTixFQUFlO0FBQzdCLGFBRDZCO0tBQS9CO0FBR0EsVUFBTSxPQUFOLENBQWUsVUFBVSxJQUFWLEVBQWlCO0FBQzlCLFdBQUssTUFBTCxHQUQ4QjtLQUFqQixDQUFmLENBTCtCO0dBQWxCOzs7Ozs7QUF2cEJ3RCxPQXFxQnZFLENBQU0sSUFBTixHQUFhLFVBQVUsS0FBVixFQUFrQjtBQUM3QixTQUFLLG9CQUFMLENBQTJCLE1BQTNCLEVBQW1DLEtBQW5DLEVBRDZCO0FBRTdCLFFBQUssQ0FBQyxLQUFELElBQVUsQ0FBQyxNQUFNLE1BQU4sRUFBZTtBQUM3QixhQUQ2QjtLQUEvQjtBQUdBLFVBQU0sT0FBTixDQUFlLFVBQVUsSUFBVixFQUFpQjtBQUM5QixXQUFLLElBQUwsR0FEOEI7S0FBakIsQ0FBZixDQUw2QjtHQUFsQjs7Ozs7O0FBcnFCMEQsT0FtckJ2RSxDQUFNLGtCQUFOLEdBQTJCLFVBQVUsS0FBVixFQUFrQjtBQUMzQyxRQUFJLFFBQVEsS0FBSyxRQUFMLENBQWUsS0FBZixDQUFSLENBRHVDO0FBRTNDLFNBQUssTUFBTCxDQUFhLEtBQWIsRUFGMkM7R0FBbEI7Ozs7OztBQW5yQjRDLE9BNHJCdkUsQ0FBTSxnQkFBTixHQUF5QixVQUFVLEtBQVYsRUFBa0I7QUFDekMsUUFBSSxRQUFRLEtBQUssUUFBTCxDQUFlLEtBQWYsQ0FBUixDQURxQztBQUV6QyxTQUFLLElBQUwsQ0FBVyxLQUFYLEVBRnlDO0dBQWxCOzs7Ozs7OztBQTVyQjhDLE9BdXNCdkUsQ0FBTSxPQUFOLEdBQWdCLFVBQVUsSUFBVixFQUFpQjs7QUFFL0IsU0FBTSxJQUFJLElBQUUsQ0FBRixFQUFLLElBQUksS0FBSyxLQUFMLENBQVcsTUFBWCxFQUFtQixHQUF0QyxFQUE0QztBQUMxQyxVQUFJLE9BQU8sS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUFQLENBRHNDO0FBRTFDLFVBQUssS0FBSyxPQUFMLElBQWdCLElBQWhCLEVBQXVCOztBQUUxQixlQUFPLElBQVAsQ0FGMEI7T0FBNUI7S0FGRjtHQUZjOzs7Ozs7O0FBdnNCdUQsT0F1dEJ2RSxDQUFNLFFBQU4sR0FBaUIsVUFBVSxLQUFWLEVBQWtCO0FBQ2pDLFlBQVEsTUFBTSxTQUFOLENBQWlCLEtBQWpCLENBQVIsQ0FEaUM7QUFFakMsUUFBSSxRQUFRLEVBQVIsQ0FGNkI7QUFHakMsVUFBTSxPQUFOLENBQWUsVUFBVSxJQUFWLEVBQWlCO0FBQzlCLFVBQUksT0FBTyxLQUFLLE9BQUwsQ0FBYyxJQUFkLENBQVAsQ0FEMEI7QUFFOUIsVUFBSyxJQUFMLEVBQVk7QUFDVixjQUFNLElBQU4sQ0FBWSxJQUFaLEVBRFU7T0FBWjtLQUZhLEVBS1osSUFMSCxFQUhpQzs7QUFVakMsV0FBTyxLQUFQLENBVmlDO0dBQWxCOzs7Ozs7QUF2dEJzRCxPQXd1QnZFLENBQU0sTUFBTixHQUFlLFVBQVUsS0FBVixFQUFrQjtBQUMvQixRQUFJLGNBQWMsS0FBSyxRQUFMLENBQWUsS0FBZixDQUFkLENBRDJCOztBQUcvQixTQUFLLG9CQUFMLENBQTJCLFFBQTNCLEVBQXFDLFdBQXJDOzs7QUFIK0IsUUFNMUIsQ0FBQyxXQUFELElBQWdCLENBQUMsWUFBWSxNQUFaLEVBQXFCO0FBQ3pDLGFBRHlDO0tBQTNDOztBQUlBLGdCQUFZLE9BQVosQ0FBcUIsVUFBVSxJQUFWLEVBQWlCO0FBQ3BDLFdBQUssTUFBTDs7QUFEb0MsV0FHcEMsQ0FBTSxVQUFOLENBQWtCLEtBQUssS0FBTCxFQUFZLElBQTlCLEVBSG9DO0tBQWpCLEVBSWxCLElBSkgsRUFWK0I7R0FBbEI7Ozs7O0FBeHVCd0QsT0E0dkJ2RSxDQUFNLE9BQU4sR0FBZ0IsWUFBVzs7QUFFekIsUUFBSSxRQUFRLEtBQUssT0FBTCxDQUFhLEtBQWIsQ0FGYTtBQUd6QixVQUFNLE1BQU4sR0FBZSxFQUFmLENBSHlCO0FBSXpCLFVBQU0sUUFBTixHQUFpQixFQUFqQixDQUp5QjtBQUt6QixVQUFNLEtBQU4sR0FBYyxFQUFkOztBQUx5QixRQU96QixDQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW9CLFVBQVUsSUFBVixFQUFpQjtBQUNuQyxXQUFLLE9BQUwsR0FEbUM7S0FBakIsQ0FBcEIsQ0FQeUI7O0FBV3pCLFNBQUssWUFBTCxHQVh5Qjs7QUFhekIsUUFBSSxLQUFLLEtBQUssT0FBTCxDQUFhLFlBQWIsQ0FiZ0I7QUFjekIsV0FBTyxVQUFXLEVBQVgsQ0FBUDtBQWR5QixXQWVsQixLQUFLLE9BQUwsQ0FBYSxZQUFiOztBQWZrQixRQWlCcEIsTUFBTCxFQUFjO0FBQ1osYUFBTyxVQUFQLENBQW1CLEtBQUssT0FBTCxFQUFjLEtBQUssV0FBTCxDQUFpQixTQUFqQixDQUFqQyxDQURZO0tBQWQ7R0FqQmM7Ozs7Ozs7OztBQTV2QnVELFVBMHhCdkUsQ0FBUyxJQUFULEdBQWdCLFVBQVUsSUFBVixFQUFpQjtBQUMvQixXQUFPLE1BQU0sZUFBTixDQUF1QixJQUF2QixDQUFQLENBRCtCO0FBRS9CLFFBQUksS0FBSyxRQUFRLEtBQUssWUFBTCxDQUZjO0FBRy9CLFdBQU8sTUFBTSxVQUFXLEVBQVgsQ0FBTixDQUh3QjtHQUFqQjs7Ozs7Ozs7QUExeEJ1RCxVQXV5QnZFLENBQVMsTUFBVCxHQUFrQixVQUFVLFNBQVYsRUFBcUIsT0FBckIsRUFBK0I7O0FBRS9DLFFBQUksU0FBUyxTQUFVLFFBQVYsQ0FBVDs7QUFGMkMsVUFJL0MsQ0FBTyxRQUFQLEdBQWtCLE1BQU0sTUFBTixDQUFjLEVBQWQsRUFBa0IsU0FBUyxRQUFULENBQXBDLENBSitDO0FBSy9DLFVBQU0sTUFBTixDQUFjLE9BQU8sUUFBUCxFQUFpQixPQUEvQixFQUwrQztBQU0vQyxXQUFPLGFBQVAsR0FBdUIsTUFBTSxNQUFOLENBQWMsRUFBZCxFQUFrQixTQUFTLGFBQVQsQ0FBekMsQ0FOK0M7O0FBUS9DLFdBQU8sU0FBUCxHQUFtQixTQUFuQixDQVIrQzs7QUFVL0MsV0FBTyxJQUFQLEdBQWMsU0FBUyxJQUFUOzs7QUFWaUMsVUFhL0MsQ0FBTyxJQUFQLEdBQWMsU0FBVSxJQUFWLENBQWQ7Ozs7QUFiK0MsU0FpQi9DLENBQU0sUUFBTixDQUFnQixNQUFoQixFQUF3QixTQUF4Qjs7Ozs7QUFqQitDLFFBc0IxQyxVQUFVLE9BQU8sT0FBUCxFQUFpQjtBQUM5QixhQUFPLE9BQVAsQ0FBZ0IsU0FBaEIsRUFBMkIsTUFBM0IsRUFEOEI7S0FBaEM7O0FBSUEsV0FBTyxNQUFQLENBMUIrQztHQUEvQixDQXZ5QnFEOztBQW8wQnZFLFdBQVMsUUFBVCxDQUFtQixNQUFuQixFQUE0QjtBQUMxQixhQUFTLFFBQVQsR0FBb0I7QUFDbEIsYUFBTyxLQUFQLENBQWMsSUFBZCxFQUFvQixTQUFwQixFQURrQjtLQUFwQjs7QUFJQSxhQUFTLFNBQVQsR0FBcUIsT0FBTyxNQUFQLENBQWUsT0FBTyxTQUFQLENBQXBDLENBTDBCO0FBTTFCLGFBQVMsU0FBVCxDQUFtQixXQUFuQixHQUFpQyxRQUFqQyxDQU4wQjs7QUFRMUIsV0FBTyxRQUFQLENBUjBCO0dBQTVCOzs7OztBQXAwQnVFLFVBazFCdkUsQ0FBUyxJQUFULEdBQWdCLElBQWhCLENBbDFCdUU7O0FBbzFCdkUsU0FBTyxRQUFQLENBcDFCdUU7Q0FBNUQsQ0FwQ1g7Ozs7Ozs7Ozs7QUFvNEJBLENBQUUsVUFBVSxNQUFWLEVBQWtCLE9BQWxCLEVBQTRCOzs7QUFHNUIsTUFBSyxPQUFPLE1BQVAsSUFBaUIsVUFBakIsSUFBK0IsT0FBTyxHQUFQLEVBQWE7O0FBRS9DLFdBQVEsQ0FDSixtQkFESSxFQUVKLG1CQUZJLENBQVIsRUFJRSxPQUpGLEVBRitDO0dBQWpELE1BT08sSUFBSyxPQUFPLE1BQVAsSUFBaUIsUUFBakIsSUFBNkIsT0FBTyxPQUFQLEVBQWlCOztBQUV4RCxXQUFPLE9BQVAsR0FBaUIsUUFDZixRQUFRLFVBQVIsQ0FEZSxFQUVmLFFBQVEsVUFBUixDQUZlLENBQWpCLENBRndEO0dBQW5ELE1BTUE7O0FBRUwsV0FBTyxPQUFQLEdBQWlCLFFBQ2YsT0FBTyxRQUFQLEVBQ0EsT0FBTyxPQUFQLENBRkYsQ0FGSztHQU5BO0NBVlAsRUF3QkMsTUF4QkQsRUF3QlMsU0FBUyxPQUFULENBQWtCLFFBQWxCLEVBQTRCLE9BQTVCLEVBQXNDOzs7OztBQU8vQyxNQUFJLFVBQVUsU0FBUyxNQUFULENBQWdCLFNBQWhCLENBQVY7O0FBUDJDLFNBUy9DLENBQVEsYUFBUixDQUFzQixRQUF0QixHQUFpQyxZQUFqQyxDQVQrQzs7QUFXL0MsVUFBUSxTQUFSLENBQWtCLFlBQWxCLEdBQWlDLFlBQVc7QUFDMUMsU0FBSyxPQUFMLEdBRDBDO0FBRTFDLFNBQUssZUFBTCxDQUFzQixhQUF0QixFQUFxQyxZQUFyQyxFQUYwQztBQUcxQyxTQUFLLGVBQUwsQ0FBc0IsUUFBdEIsRUFBZ0MsWUFBaEMsRUFIMEM7QUFJMUMsU0FBSyxjQUFMOzs7QUFKMEMsUUFPMUMsQ0FBSyxLQUFMLEdBQWEsRUFBYixDQVAwQztBQVExQyxTQUFNLElBQUksSUFBRSxDQUFGLEVBQUssSUFBSSxLQUFLLElBQUwsRUFBVyxHQUE5QixFQUFvQztBQUNsQyxXQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWlCLENBQWpCLEVBRGtDO0tBQXBDOztBQUlBLFNBQUssSUFBTCxHQUFZLENBQVosQ0FaMEM7R0FBWCxDQVhjOztBQTBCL0MsVUFBUSxTQUFSLENBQWtCLGNBQWxCLEdBQW1DLFlBQVc7QUFDNUMsU0FBSyxpQkFBTDs7QUFENEMsUUFHdkMsQ0FBQyxLQUFLLFdBQUwsRUFBbUI7QUFDdkIsVUFBSSxZQUFZLEtBQUssS0FBTCxDQUFXLENBQVgsQ0FBWixDQURtQjtBQUV2QixVQUFJLGdCQUFnQixhQUFhLFVBQVUsT0FBVjs7QUFGVixVQUl2QixDQUFLLFdBQUwsR0FBbUIsaUJBQWlCLFFBQVMsYUFBVCxFQUF5QixVQUF6Qjs7QUFFbEMsV0FBSyxjQUFMLENBTnFCO0tBQXpCOztBQVNBLFFBQUksY0FBYyxLQUFLLFdBQUwsSUFBb0IsS0FBSyxNQUFMOzs7QUFaTSxRQWV4QyxpQkFBaUIsS0FBSyxjQUFMLEdBQXNCLEtBQUssTUFBTCxDQWZDO0FBZ0I1QyxRQUFJLE9BQU8saUJBQWlCLFdBQWpCOztBQWhCaUMsUUFrQnhDLFNBQVMsY0FBYyxpQkFBaUIsV0FBakI7O0FBbEJpQixRQW9CeEMsYUFBYSxVQUFVLFNBQVMsQ0FBVCxHQUFhLE9BQXZCLEdBQWlDLE9BQWpDLENBcEIyQjtBQXFCNUMsV0FBTyxLQUFNLFVBQU4sRUFBb0IsSUFBcEIsQ0FBUCxDQXJCNEM7QUFzQjVDLFNBQUssSUFBTCxHQUFZLEtBQUssR0FBTCxDQUFVLElBQVYsRUFBZ0IsQ0FBaEIsQ0FBWixDQXRCNEM7R0FBWCxDQTFCWTs7QUFtRC9DLFVBQVEsU0FBUixDQUFrQixpQkFBbEIsR0FBc0MsWUFBVzs7QUFFL0MsUUFBSSxhQUFhLEtBQUssVUFBTCxDQUFnQixVQUFoQixDQUFiLENBRjJDO0FBRy9DLFFBQUksWUFBWSxhQUFhLEtBQUssT0FBTCxDQUFhLFVBQWIsR0FBMEIsS0FBSyxPQUFMOzs7QUFIUixRQU0zQyxPQUFPLFFBQVMsU0FBVCxDQUFQLENBTjJDO0FBTy9DLFNBQUssY0FBTCxHQUFzQixRQUFRLEtBQUssVUFBTCxDQVBpQjtHQUFYLENBbkRTOztBQTZEL0MsVUFBUSxTQUFSLENBQWtCLHNCQUFsQixHQUEyQyxVQUFVLElBQVYsRUFBaUI7QUFDMUQsU0FBSyxPQUFMOztBQUQwRCxRQUd0RCxZQUFZLEtBQUssSUFBTCxDQUFVLFVBQVYsR0FBdUIsS0FBSyxXQUFMLENBSG1CO0FBSTFELFFBQUksYUFBYSxhQUFhLFlBQVksQ0FBWixHQUFnQixPQUE3QixHQUF1QyxNQUF2Qzs7QUFKeUMsUUFNdEQsVUFBVSxLQUFNLFVBQU4sRUFBb0IsS0FBSyxJQUFMLENBQVUsVUFBVixHQUF1QixLQUFLLFdBQUwsQ0FBckQsQ0FOc0Q7QUFPMUQsY0FBVSxLQUFLLEdBQUwsQ0FBVSxPQUFWLEVBQW1CLEtBQUssSUFBTCxDQUE3QixDQVAwRDs7QUFTMUQsUUFBSSxXQUFXLEtBQUssWUFBTCxDQUFtQixPQUFuQixDQUFYOztBQVRzRCxRQVd0RCxXQUFXLEtBQUssR0FBTCxDQUFTLEtBQVQsQ0FBZ0IsSUFBaEIsRUFBc0IsUUFBdEIsQ0FBWCxDQVhzRDtBQVkxRCxRQUFJLGdCQUFnQixTQUFTLE9BQVQsQ0FBa0IsUUFBbEIsQ0FBaEI7OztBQVpzRCxRQWV0RCxXQUFXO0FBQ2IsU0FBRyxLQUFLLFdBQUwsR0FBbUIsYUFBbkI7QUFDSCxTQUFHLFFBQUg7S0FGRTs7O0FBZnNELFFBcUJ0RCxZQUFZLFdBQVcsS0FBSyxJQUFMLENBQVUsV0FBVixDQXJCK0I7QUFzQjFELFFBQUksVUFBVSxLQUFLLElBQUwsR0FBWSxDQUFaLEdBQWdCLFNBQVMsTUFBVCxDQXRCNEI7QUF1QjFELFNBQU0sSUFBSSxJQUFJLENBQUosRUFBTyxJQUFJLE9BQUosRUFBYSxHQUE5QixFQUFvQztBQUNsQyxXQUFLLEtBQUwsQ0FBWSxnQkFBZ0IsQ0FBaEIsQ0FBWixHQUFrQyxTQUFsQyxDQURrQztLQUFwQzs7QUFJQSxXQUFPLFFBQVAsQ0EzQjBEO0dBQWpCOzs7Ozs7QUE3REksU0ErRi9DLENBQVEsU0FBUixDQUFrQixZQUFsQixHQUFpQyxVQUFVLE9BQVYsRUFBb0I7QUFDbkQsUUFBSyxVQUFVLENBQVYsRUFBYzs7QUFFakIsYUFBTyxLQUFLLEtBQUwsQ0FGVTtLQUFuQjs7QUFLQSxRQUFJLFdBQVcsRUFBWDs7QUFOK0MsUUFRL0MsYUFBYSxLQUFLLElBQUwsR0FBWSxDQUFaLEdBQWdCLE9BQWhCOztBQVJrQyxTQVU3QyxJQUFJLElBQUksQ0FBSixFQUFPLElBQUksVUFBSixFQUFnQixHQUFqQyxFQUF1Qzs7QUFFckMsVUFBSSxhQUFhLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBa0IsQ0FBbEIsRUFBcUIsSUFBSSxPQUFKLENBQWxDOztBQUZpQyxjQUlyQyxDQUFTLENBQVQsSUFBYyxLQUFLLEdBQUwsQ0FBUyxLQUFULENBQWdCLElBQWhCLEVBQXNCLFVBQXRCLENBQWQsQ0FKcUM7S0FBdkM7QUFNQSxXQUFPLFFBQVAsQ0FoQm1EO0dBQXBCLENBL0ZjOztBQWtIL0MsVUFBUSxTQUFSLENBQWtCLFlBQWxCLEdBQWlDLFVBQVUsS0FBVixFQUFrQjtBQUNqRCxRQUFJLFlBQVksUUFBUyxLQUFULENBQVosQ0FENkM7QUFFakQsUUFBSSxTQUFTLEtBQUssaUJBQUwsQ0FBd0IsS0FBeEIsQ0FBVDs7QUFGNkMsUUFJN0MsZUFBZSxLQUFLLFVBQUwsQ0FBZ0IsWUFBaEIsQ0FBZixDQUo2QztBQUtqRCxRQUFJLFNBQVMsZUFBZSxPQUFPLElBQVAsR0FBYyxPQUFPLEtBQVAsQ0FMTztBQU1qRCxRQUFJLFFBQVEsU0FBUyxVQUFVLFVBQVYsQ0FONEI7QUFPakQsUUFBSSxXQUFXLEtBQUssS0FBTCxDQUFZLFNBQVMsS0FBSyxXQUFMLENBQWhDLENBUDZDO0FBUWpELGVBQVcsS0FBSyxHQUFMLENBQVUsQ0FBVixFQUFhLFFBQWIsQ0FBWCxDQVJpRDtBQVNqRCxRQUFJLFVBQVUsS0FBSyxLQUFMLENBQVksUUFBUSxLQUFLLFdBQUwsQ0FBOUI7O0FBVDZDLFdBV2pELElBQVcsUUFBUSxLQUFLLFdBQUwsR0FBbUIsQ0FBM0IsR0FBK0IsQ0FBL0IsQ0FYc0M7QUFZakQsY0FBVSxLQUFLLEdBQUwsQ0FBVSxLQUFLLElBQUwsR0FBWSxDQUFaLEVBQWUsT0FBekIsQ0FBVjs7O0FBWmlELFFBZTdDLGNBQWMsS0FBSyxVQUFMLENBQWdCLFdBQWhCLENBQWQsQ0FmNkM7QUFnQmpELFFBQUksWUFBWSxDQUFFLGNBQWMsT0FBTyxHQUFQLEdBQWEsT0FBTyxNQUFQLENBQTdCLEdBQ2QsVUFBVSxXQUFWLENBakIrQztBQWtCakQsU0FBTSxJQUFJLElBQUksUUFBSixFQUFjLEtBQUssT0FBTCxFQUFjLEdBQXRDLEVBQTRDO0FBQzFDLFdBQUssS0FBTCxDQUFXLENBQVgsSUFBZ0IsS0FBSyxHQUFMLENBQVUsU0FBVixFQUFxQixLQUFLLEtBQUwsQ0FBVyxDQUFYLENBQXJCLENBQWhCLENBRDBDO0tBQTVDO0dBbEIrQixDQWxIYzs7QUF5SS9DLFVBQVEsU0FBUixDQUFrQixpQkFBbEIsR0FBc0MsWUFBVztBQUMvQyxTQUFLLElBQUwsR0FBWSxLQUFLLEdBQUwsQ0FBUyxLQUFULENBQWdCLElBQWhCLEVBQXNCLEtBQUssS0FBTCxDQUFsQyxDQUQrQztBQUUvQyxRQUFJLE9BQU87QUFDVCxjQUFRLEtBQUssSUFBTDtLQUROLENBRjJDOztBQU0vQyxRQUFLLEtBQUssVUFBTCxDQUFnQixVQUFoQixDQUFMLEVBQW1DO0FBQ2pDLFdBQUssS0FBTCxHQUFhLEtBQUsscUJBQUwsRUFBYixDQURpQztLQUFuQzs7QUFJQSxXQUFPLElBQVAsQ0FWK0M7R0FBWCxDQXpJUzs7QUFzSi9DLFVBQVEsU0FBUixDQUFrQixxQkFBbEIsR0FBMEMsWUFBVztBQUNuRCxRQUFJLGFBQWEsQ0FBYjs7QUFEK0MsUUFHL0MsSUFBSSxLQUFLLElBQUwsQ0FIMkM7QUFJbkQsV0FBUSxFQUFFLENBQUYsRUFBTTtBQUNaLFVBQUssS0FBSyxLQUFMLENBQVcsQ0FBWCxNQUFrQixDQUFsQixFQUFzQjtBQUN6QixjQUR5QjtPQUEzQjtBQUdBLG1CQUpZO0tBQWQ7O0FBSm1ELFdBVzVDLENBQUUsS0FBSyxJQUFMLEdBQVksVUFBWixDQUFGLEdBQTZCLEtBQUssV0FBTCxHQUFtQixLQUFLLE1BQUwsQ0FYSjtHQUFYLENBdEpLOztBQW9LL0MsVUFBUSxTQUFSLENBQWtCLGlCQUFsQixHQUFzQyxZQUFXO0FBQy9DLFFBQUksZ0JBQWdCLEtBQUssY0FBTCxDQUQyQjtBQUUvQyxTQUFLLGlCQUFMLEdBRitDO0FBRy9DLFdBQU8saUJBQWlCLEtBQUssY0FBTCxDQUh1QjtHQUFYLENBcEtTOztBQTBLL0MsU0FBTyxPQUFQLENBMUsrQztDQUF0QyxDQXhCWDs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM1cEVBLENBQUUsVUFBVSxNQUFWLEVBQWtCLE9BQWxCLEVBQTRCOzs7QUFHNUIsTUFBSyxPQUFPLE1BQVAsSUFBaUIsVUFBakIsSUFBK0IsT0FBTyxHQUFQLEVBQWE7O0FBRS9DLFdBQVEsdUJBQVIsRUFBZ0MsT0FBaEMsRUFGK0M7R0FBakQsTUFHTyxJQUFLLE9BQU8sTUFBUCxJQUFpQixRQUFqQixJQUE2QixPQUFPLE9BQVAsRUFBaUI7O0FBRXhELFdBQU8sT0FBUCxHQUFpQixTQUFqQixDQUZ3RDtHQUFuRCxNQUdBOztBQUVMLFdBQU8sU0FBUCxHQUFtQixTQUFuQixDQUZLO0dBSEE7Q0FOUCxFQWNDLElBZEQsRUFjTyxZQUFXOztBQUlwQixXQUFTLFNBQVQsR0FBcUIsRUFBckI7O0FBRUEsTUFBSSxRQUFRLFVBQVUsU0FBVixDQU5ROztBQVFwQixRQUFNLEVBQU4sR0FBVyxVQUFVLFNBQVYsRUFBcUIsUUFBckIsRUFBZ0M7QUFDekMsUUFBSyxDQUFDLFNBQUQsSUFBYyxDQUFDLFFBQUQsRUFBWTtBQUM3QixhQUQ2QjtLQUEvQjs7QUFEeUMsUUFLckMsU0FBUyxLQUFLLE9BQUwsR0FBZSxLQUFLLE9BQUwsSUFBZ0IsRUFBaEI7O0FBTGEsUUFPckMsWUFBWSxPQUFRLFNBQVIsSUFBc0IsT0FBUSxTQUFSLEtBQXVCLEVBQXZCOztBQVBHLFFBU3BDLFVBQVUsT0FBVixDQUFtQixRQUFuQixLQUFpQyxDQUFDLENBQUQsRUFBSztBQUN6QyxnQkFBVSxJQUFWLENBQWdCLFFBQWhCLEVBRHlDO0tBQTNDOztBQUlBLFdBQU8sSUFBUCxDQWJ5QztHQUFoQyxDQVJTOztBQXdCcEIsUUFBTSxJQUFOLEdBQWEsVUFBVSxTQUFWLEVBQXFCLFFBQXJCLEVBQWdDO0FBQzNDLFFBQUssQ0FBQyxTQUFELElBQWMsQ0FBQyxRQUFELEVBQVk7QUFDN0IsYUFENkI7S0FBL0I7O0FBRDJDLFFBSzNDLENBQUssRUFBTCxDQUFTLFNBQVQsRUFBb0IsUUFBcEI7OztBQUwyQyxRQVF2QyxhQUFhLEtBQUssV0FBTCxHQUFtQixLQUFLLFdBQUwsSUFBb0IsRUFBcEI7O0FBUk8sUUFVdkMsZ0JBQWdCLFdBQVksU0FBWixJQUEwQixXQUFZLFNBQVosS0FBMkIsRUFBM0I7O0FBVkgsaUJBWTNDLENBQWUsUUFBZixJQUE0QixJQUE1QixDQVoyQzs7QUFjM0MsV0FBTyxJQUFQLENBZDJDO0dBQWhDLENBeEJPOztBQXlDcEIsUUFBTSxHQUFOLEdBQVksVUFBVSxTQUFWLEVBQXFCLFFBQXJCLEVBQWdDO0FBQzFDLFFBQUksWUFBWSxLQUFLLE9BQUwsSUFBZ0IsS0FBSyxPQUFMLENBQWMsU0FBZCxDQUFoQixDQUQwQjtBQUUxQyxRQUFLLENBQUMsU0FBRCxJQUFjLENBQUMsVUFBVSxNQUFWLEVBQW1CO0FBQ3JDLGFBRHFDO0tBQXZDO0FBR0EsUUFBSSxRQUFRLFVBQVUsT0FBVixDQUFtQixRQUFuQixDQUFSLENBTHNDO0FBTTFDLFFBQUssU0FBUyxDQUFDLENBQUQsRUFBSztBQUNqQixnQkFBVSxNQUFWLENBQWtCLEtBQWxCLEVBQXlCLENBQXpCLEVBRGlCO0tBQW5COztBQUlBLFdBQU8sSUFBUCxDQVYwQztHQUFoQyxDQXpDUTs7QUFzRHBCLFFBQU0sU0FBTixHQUFrQixVQUFVLFNBQVYsRUFBcUIsSUFBckIsRUFBNEI7QUFDNUMsUUFBSSxZQUFZLEtBQUssT0FBTCxJQUFnQixLQUFLLE9BQUwsQ0FBYyxTQUFkLENBQWhCLENBRDRCO0FBRTVDLFFBQUssQ0FBQyxTQUFELElBQWMsQ0FBQyxVQUFVLE1BQVYsRUFBbUI7QUFDckMsYUFEcUM7S0FBdkM7QUFHQSxRQUFJLElBQUksQ0FBSixDQUx3QztBQU01QyxRQUFJLFdBQVcsVUFBVSxDQUFWLENBQVgsQ0FOd0M7QUFPNUMsV0FBTyxRQUFRLEVBQVI7O0FBUHFDLFFBU3hDLGdCQUFnQixLQUFLLFdBQUwsSUFBb0IsS0FBSyxXQUFMLENBQWtCLFNBQWxCLENBQXBCLENBVHdCOztBQVc1QyxXQUFRLFFBQVIsRUFBbUI7QUFDakIsVUFBSSxTQUFTLGlCQUFpQixjQUFlLFFBQWYsQ0FBakIsQ0FESTtBQUVqQixVQUFLLE1BQUwsRUFBYzs7O0FBR1osYUFBSyxHQUFMLENBQVUsU0FBVixFQUFxQixRQUFyQjs7QUFIWSxlQUtMLGNBQWUsUUFBZixDQUFQLENBTFk7T0FBZDs7QUFGaUIsY0FVakIsQ0FBUyxLQUFULENBQWdCLElBQWhCLEVBQXNCLElBQXRCOztBQVZpQixPQVlqQixJQUFLLFNBQVMsQ0FBVCxHQUFhLENBQWIsQ0FaWTtBQWFqQixpQkFBVyxVQUFVLENBQVYsQ0FBWCxDQWJpQjtLQUFuQjs7QUFnQkEsV0FBTyxJQUFQLENBM0I0QztHQUE1QixDQXRERTs7QUFvRnBCLFNBQU8sU0FBUCxDQXBGb0I7Q0FBWCxDQWRUOzs7Ozs7OztBQTRHQSxDQUFFLFVBQVUsTUFBVixFQUFrQixPQUFsQixFQUE0QjtBQUFFOzs7OztBQUFGLE1BS3ZCLE9BQU8sTUFBUCxJQUFpQixVQUFqQixJQUErQixPQUFPLEdBQVAsRUFBYTs7QUFFL0MsV0FBUSxDQUNOLHVCQURNLENBQVIsRUFFRyxVQUFVLFNBQVYsRUFBc0I7QUFDdkIsYUFBTyxRQUFTLE1BQVQsRUFBaUIsU0FBakIsQ0FBUCxDQUR1QjtLQUF0QixDQUZILENBRitDO0dBQWpELE1BT08sSUFBSyxPQUFPLE1BQVAsSUFBaUIsUUFBakIsSUFBNkIsT0FBTyxPQUFQLEVBQWlCOztBQUV4RCxXQUFPLE9BQVAsR0FBaUIsUUFDZixNQURlLEVBRWYsUUFBUSxZQUFSLENBRmUsQ0FBakIsQ0FGd0Q7R0FBbkQsTUFNQTs7QUFFTCxXQUFPLFlBQVAsR0FBc0IsUUFDcEIsTUFEb0IsRUFFcEIsT0FBTyxTQUFQLENBRkYsQ0FGSztHQU5BO0NBWlAsQ0FBRixDQTBCSSxNQTFCSjs7OztBQThCQSxTQUFTLE9BQVQsQ0FBa0IsTUFBbEIsRUFBMEIsU0FBMUIsRUFBc0M7O0FBSXRDLE1BQUksSUFBSSxPQUFPLE1BQVAsQ0FKOEI7QUFLdEMsTUFBSSxVQUFVLE9BQU8sT0FBUDs7Ozs7QUFMd0IsV0FVN0IsTUFBVCxDQUFpQixDQUFqQixFQUFvQixDQUFwQixFQUF3QjtBQUN0QixTQUFNLElBQUksSUFBSixJQUFZLENBQWxCLEVBQXNCO0FBQ3BCLFFBQUcsSUFBSCxJQUFZLEVBQUcsSUFBSCxDQUFaLENBRG9CO0tBQXRCO0FBR0EsV0FBTyxDQUFQLENBSnNCO0dBQXhCOzs7QUFWc0MsV0FrQjdCLFNBQVQsQ0FBb0IsR0FBcEIsRUFBMEI7QUFDeEIsUUFBSSxNQUFNLEVBQU4sQ0FEb0I7QUFFeEIsUUFBSyxNQUFNLE9BQU4sQ0FBZSxHQUFmLENBQUwsRUFBNEI7O0FBRTFCLFlBQU0sR0FBTixDQUYwQjtLQUE1QixNQUdPLElBQUssT0FBTyxJQUFJLE1BQUosSUFBYyxRQUFyQixFQUFnQzs7QUFFMUMsV0FBTSxJQUFJLElBQUUsQ0FBRixFQUFLLElBQUksSUFBSSxNQUFKLEVBQVksR0FBL0IsRUFBcUM7QUFDbkMsWUFBSSxJQUFKLENBQVUsSUFBSSxDQUFKLENBQVYsRUFEbUM7T0FBckM7S0FGSyxNQUtBOztBQUVMLFVBQUksSUFBSixDQUFVLEdBQVYsRUFGSztLQUxBO0FBU1AsV0FBTyxHQUFQLENBZHdCO0dBQTFCOzs7Ozs7Ozs7QUFsQnNDLFdBMEM3QixZQUFULENBQXVCLElBQXZCLEVBQTZCLE9BQTdCLEVBQXNDLFFBQXRDLEVBQWlEOztBQUUvQyxRQUFLLEVBQUcsZ0JBQWdCLFlBQWhCLENBQUgsRUFBb0M7QUFDdkMsYUFBTyxJQUFJLFlBQUosQ0FBa0IsSUFBbEIsRUFBd0IsT0FBeEIsRUFBaUMsUUFBakMsQ0FBUCxDQUR1QztLQUF6Qzs7QUFGK0MsUUFNMUMsT0FBTyxJQUFQLElBQWUsUUFBZixFQUEwQjtBQUM3QixhQUFPLFNBQVMsZ0JBQVQsQ0FBMkIsSUFBM0IsQ0FBUCxDQUQ2QjtLQUEvQjs7QUFJQSxTQUFLLFFBQUwsR0FBZ0IsVUFBVyxJQUFYLENBQWhCLENBVitDO0FBVy9DLFNBQUssT0FBTCxHQUFlLE9BQVEsRUFBUixFQUFZLEtBQUssT0FBTCxDQUEzQixDQVgrQzs7QUFhL0MsUUFBSyxPQUFPLE9BQVAsSUFBa0IsVUFBbEIsRUFBK0I7QUFDbEMsaUJBQVcsT0FBWCxDQURrQztLQUFwQyxNQUVPO0FBQ0wsYUFBUSxLQUFLLE9BQUwsRUFBYyxPQUF0QixFQURLO0tBRlA7O0FBTUEsUUFBSyxRQUFMLEVBQWdCO0FBQ2QsV0FBSyxFQUFMLENBQVMsUUFBVCxFQUFtQixRQUFuQixFQURjO0tBQWhCOztBQUlBLFNBQUssU0FBTCxHQXZCK0M7O0FBeUIvQyxRQUFLLENBQUwsRUFBUzs7QUFFUCxXQUFLLFVBQUwsR0FBa0IsSUFBSSxFQUFFLFFBQUYsRUFBdEIsQ0FGTztLQUFUOzs7QUF6QitDLGNBK0IvQyxDQUFZLFlBQVc7QUFDckIsV0FBSyxLQUFMLEdBRHFCO0tBQVgsQ0FFVixJQUZVLENBRUosSUFGSSxDQUFaLEVBL0IrQztHQUFqRDs7QUFvQ0EsZUFBYSxTQUFiLEdBQXlCLE9BQU8sTUFBUCxDQUFlLFVBQVUsU0FBVixDQUF4QyxDQTlFc0M7O0FBZ0Z0QyxlQUFhLFNBQWIsQ0FBdUIsT0FBdkIsR0FBaUMsRUFBakMsQ0FoRnNDOztBQWtGdEMsZUFBYSxTQUFiLENBQXVCLFNBQXZCLEdBQW1DLFlBQVc7QUFDNUMsU0FBSyxNQUFMLEdBQWMsRUFBZDs7O0FBRDRDLFFBSTVDLENBQUssUUFBTCxDQUFjLE9BQWQsQ0FBdUIsS0FBSyxnQkFBTCxFQUF1QixJQUE5QyxFQUo0QztHQUFYOzs7OztBQWxGRyxjQTRGdEMsQ0FBYSxTQUFiLENBQXVCLGdCQUF2QixHQUEwQyxVQUFVLElBQVYsRUFBaUI7O0FBRXpELFFBQUssS0FBSyxRQUFMLElBQWlCLEtBQWpCLEVBQXlCO0FBQzVCLFdBQUssUUFBTCxDQUFlLElBQWYsRUFENEI7S0FBOUI7O0FBRnlELFFBTXBELEtBQUssT0FBTCxDQUFhLFVBQWIsS0FBNEIsSUFBNUIsRUFBbUM7QUFDdEMsV0FBSywwQkFBTCxDQUFpQyxJQUFqQyxFQURzQztLQUF4Qzs7OztBQU55RCxRQVlyRCxXQUFXLEtBQUssUUFBTCxDQVowQztBQWF6RCxRQUFLLENBQUMsUUFBRCxJQUFhLENBQUMsaUJBQWtCLFFBQWxCLENBQUQsRUFBZ0M7QUFDaEQsYUFEZ0Q7S0FBbEQ7QUFHQSxRQUFJLFlBQVksS0FBSyxnQkFBTCxDQUFzQixLQUF0QixDQUFaOztBQWhCcUQsU0FrQm5ELElBQUksSUFBRSxDQUFGLEVBQUssSUFBSSxVQUFVLE1BQVYsRUFBa0IsR0FBckMsRUFBMkM7QUFDekMsVUFBSSxNQUFNLFVBQVUsQ0FBVixDQUFOLENBRHFDO0FBRXpDLFdBQUssUUFBTCxDQUFlLEdBQWYsRUFGeUM7S0FBM0M7OztBQWxCeUQsUUF3QnBELE9BQU8sS0FBSyxPQUFMLENBQWEsVUFBYixJQUEyQixRQUFsQyxFQUE2QztBQUNoRCxVQUFJLFdBQVcsS0FBSyxnQkFBTCxDQUF1QixLQUFLLE9BQUwsQ0FBYSxVQUFiLENBQWxDLENBRDRDO0FBRWhELFdBQU0sSUFBRSxDQUFGLEVBQUssSUFBSSxTQUFTLE1BQVQsRUFBaUIsR0FBaEMsRUFBc0M7QUFDcEMsWUFBSSxRQUFRLFNBQVMsQ0FBVCxDQUFSLENBRGdDO0FBRXBDLGFBQUssMEJBQUwsQ0FBaUMsS0FBakMsRUFGb0M7T0FBdEM7S0FGRjtHQXhCd0MsQ0E1Rko7O0FBNkh0QyxNQUFJLG1CQUFtQjtBQUNyQixPQUFHLElBQUg7QUFDQSxPQUFHLElBQUg7QUFDQSxRQUFJLElBQUo7R0FIRSxDQTdIa0M7O0FBbUl0QyxlQUFhLFNBQWIsQ0FBdUIsMEJBQXZCLEdBQW9ELFVBQVUsSUFBVixFQUFpQjtBQUNuRSxRQUFJLFFBQVEsaUJBQWtCLElBQWxCLENBQVIsQ0FEK0Q7QUFFbkUsUUFBSyxDQUFDLEtBQUQsRUFBUzs7QUFFWixhQUZZO0tBQWQ7O0FBRm1FLFFBTy9ELFFBQVEseUJBQVIsQ0FQK0Q7QUFRbkUsUUFBSSxVQUFVLE1BQU0sSUFBTixDQUFZLE1BQU0sZUFBTixDQUF0QixDQVIrRDtBQVNuRSxXQUFRLFlBQVksSUFBWixFQUFtQjtBQUN6QixVQUFJLE1BQU0sV0FBVyxRQUFRLENBQVIsQ0FBWCxDQURlO0FBRXpCLFVBQUssR0FBTCxFQUFXO0FBQ1QsYUFBSyxhQUFMLENBQW9CLEdBQXBCLEVBQXlCLElBQXpCLEVBRFM7T0FBWDtBQUdBLGdCQUFVLE1BQU0sSUFBTixDQUFZLE1BQU0sZUFBTixDQUF0QixDQUx5QjtLQUEzQjtHQVRrRDs7Ozs7QUFuSWQsY0F3SnRDLENBQWEsU0FBYixDQUF1QixRQUF2QixHQUFrQyxVQUFVLEdBQVYsRUFBZ0I7QUFDaEQsUUFBSSxlQUFlLElBQUksWUFBSixDQUFrQixHQUFsQixDQUFmLENBRDRDO0FBRWhELFNBQUssTUFBTCxDQUFZLElBQVosQ0FBa0IsWUFBbEIsRUFGZ0Q7R0FBaEIsQ0F4Skk7O0FBNkp0QyxlQUFhLFNBQWIsQ0FBdUIsYUFBdkIsR0FBdUMsVUFBVSxHQUFWLEVBQWUsSUFBZixFQUFzQjtBQUMzRCxRQUFJLGFBQWEsSUFBSSxVQUFKLENBQWdCLEdBQWhCLEVBQXFCLElBQXJCLENBQWIsQ0FEdUQ7QUFFM0QsU0FBSyxNQUFMLENBQVksSUFBWixDQUFrQixVQUFsQixFQUYyRDtHQUF0QixDQTdKRDs7QUFrS3RDLGVBQWEsU0FBYixDQUF1QixLQUF2QixHQUErQixZQUFXO0FBQ3hDLFFBQUksUUFBUSxJQUFSLENBRG9DO0FBRXhDLFNBQUssZUFBTCxHQUF1QixDQUF2QixDQUZ3QztBQUd4QyxTQUFLLFlBQUwsR0FBb0IsS0FBcEI7O0FBSHdDLFFBS25DLENBQUMsS0FBSyxNQUFMLENBQVksTUFBWixFQUFxQjtBQUN6QixXQUFLLFFBQUwsR0FEeUI7QUFFekIsYUFGeUI7S0FBM0I7O0FBS0EsYUFBUyxVQUFULENBQXFCLEtBQXJCLEVBQTRCLElBQTVCLEVBQWtDLE9BQWxDLEVBQTRDOztBQUUxQyxpQkFBWSxZQUFXO0FBQ3JCLGNBQU0sUUFBTixDQUFnQixLQUFoQixFQUF1QixJQUF2QixFQUE2QixPQUE3QixFQURxQjtPQUFYLENBQVosQ0FGMEM7S0FBNUM7O0FBT0EsU0FBSyxNQUFMLENBQVksT0FBWixDQUFxQixVQUFVLFlBQVYsRUFBeUI7QUFDNUMsbUJBQWEsSUFBYixDQUFtQixVQUFuQixFQUErQixVQUEvQixFQUQ0QztBQUU1QyxtQkFBYSxLQUFiLEdBRjRDO0tBQXpCLENBQXJCLENBakJ3QztHQUFYLENBbEtPOztBQXlMdEMsZUFBYSxTQUFiLENBQXVCLFFBQXZCLEdBQWtDLFVBQVUsS0FBVixFQUFpQixJQUFqQixFQUF1QixPQUF2QixFQUFpQztBQUNqRSxTQUFLLGVBQUwsR0FEaUU7QUFFakUsU0FBSyxZQUFMLEdBQW9CLEtBQUssWUFBTCxJQUFxQixDQUFDLE1BQU0sUUFBTjs7QUFGdUIsUUFJakUsQ0FBSyxTQUFMLENBQWdCLFVBQWhCLEVBQTRCLENBQUUsSUFBRixFQUFRLEtBQVIsRUFBZSxJQUFmLENBQTVCLEVBSmlFO0FBS2pFLFFBQUssS0FBSyxVQUFMLElBQW1CLEtBQUssVUFBTCxDQUFnQixNQUFoQixFQUF5QjtBQUMvQyxXQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsQ0FBd0IsSUFBeEIsRUFBOEIsS0FBOUIsRUFEK0M7S0FBakQ7O0FBTGlFLFFBUzVELEtBQUssZUFBTCxJQUF3QixLQUFLLE1BQUwsQ0FBWSxNQUFaLEVBQXFCO0FBQ2hELFdBQUssUUFBTCxHQURnRDtLQUFsRDs7QUFJQSxRQUFLLEtBQUssT0FBTCxDQUFhLEtBQWIsSUFBc0IsT0FBdEIsRUFBZ0M7QUFDbkMsY0FBUSxHQUFSLENBQWEsZUFBZSxPQUFmLEVBQXdCLEtBQXJDLEVBQTRDLElBQTVDLEVBRG1DO0tBQXJDO0dBYmdDLENBekxJOztBQTJNdEMsZUFBYSxTQUFiLENBQXVCLFFBQXZCLEdBQWtDLFlBQVc7QUFDM0MsUUFBSSxZQUFZLEtBQUssWUFBTCxHQUFvQixNQUFwQixHQUE2QixNQUE3QixDQUQyQjtBQUUzQyxTQUFLLFVBQUwsR0FBa0IsSUFBbEIsQ0FGMkM7QUFHM0MsU0FBSyxTQUFMLENBQWdCLFNBQWhCLEVBQTJCLENBQUUsSUFBRixDQUEzQixFQUgyQztBQUkzQyxTQUFLLFNBQUwsQ0FBZ0IsUUFBaEIsRUFBMEIsQ0FBRSxJQUFGLENBQTFCLEVBSjJDO0FBSzNDLFFBQUssS0FBSyxVQUFMLEVBQWtCO0FBQ3JCLFVBQUksV0FBVyxLQUFLLFlBQUwsR0FBb0IsUUFBcEIsR0FBK0IsU0FBL0IsQ0FETTtBQUVyQixXQUFLLFVBQUwsQ0FBaUIsUUFBakIsRUFBNkIsSUFBN0IsRUFGcUI7S0FBdkI7R0FMZ0M7Ozs7QUEzTUksV0F3TjdCLFlBQVQsQ0FBdUIsR0FBdkIsRUFBNkI7QUFDM0IsU0FBSyxHQUFMLEdBQVcsR0FBWCxDQUQyQjtHQUE3Qjs7QUFJQSxlQUFhLFNBQWIsR0FBeUIsT0FBTyxNQUFQLENBQWUsVUFBVSxTQUFWLENBQXhDLENBNU5zQzs7QUE4TnRDLGVBQWEsU0FBYixDQUF1QixLQUF2QixHQUErQixZQUFXOzs7QUFHeEMsUUFBSSxhQUFhLEtBQUssa0JBQUwsRUFBYixDQUhvQztBQUl4QyxRQUFLLFVBQUwsRUFBa0I7O0FBRWhCLFdBQUssT0FBTCxDQUFjLEtBQUssR0FBTCxDQUFTLFlBQVQsS0FBMEIsQ0FBMUIsRUFBNkIsY0FBM0MsRUFGZ0I7QUFHaEIsYUFIZ0I7S0FBbEI7OztBQUp3QyxRQVd4QyxDQUFLLFVBQUwsR0FBa0IsSUFBSSxLQUFKLEVBQWxCLENBWHdDO0FBWXhDLFNBQUssVUFBTCxDQUFnQixnQkFBaEIsQ0FBa0MsTUFBbEMsRUFBMEMsSUFBMUMsRUFad0M7QUFheEMsU0FBSyxVQUFMLENBQWdCLGdCQUFoQixDQUFrQyxPQUFsQyxFQUEyQyxJQUEzQzs7QUFid0MsUUFleEMsQ0FBSyxHQUFMLENBQVMsZ0JBQVQsQ0FBMkIsTUFBM0IsRUFBbUMsSUFBbkMsRUFmd0M7QUFnQnhDLFNBQUssR0FBTCxDQUFTLGdCQUFULENBQTJCLE9BQTNCLEVBQW9DLElBQXBDLEVBaEJ3QztBQWlCeEMsU0FBSyxVQUFMLENBQWdCLEdBQWhCLEdBQXNCLEtBQUssR0FBTCxDQUFTLEdBQVQsQ0FqQmtCO0dBQVgsQ0E5Tk87O0FBa1B0QyxlQUFhLFNBQWIsQ0FBdUIsa0JBQXZCLEdBQTRDLFlBQVc7QUFDckQsV0FBTyxLQUFLLEdBQUwsQ0FBUyxRQUFULElBQXFCLEtBQUssR0FBTCxDQUFTLFlBQVQsS0FBMEIsU0FBMUIsQ0FEeUI7R0FBWCxDQWxQTjs7QUFzUHRDLGVBQWEsU0FBYixDQUF1QixPQUF2QixHQUFpQyxVQUFVLFFBQVYsRUFBb0IsT0FBcEIsRUFBOEI7QUFDN0QsU0FBSyxRQUFMLEdBQWdCLFFBQWhCLENBRDZEO0FBRTdELFNBQUssU0FBTCxDQUFnQixVQUFoQixFQUE0QixDQUFFLElBQUYsRUFBUSxLQUFLLEdBQUwsRUFBVSxPQUFsQixDQUE1QixFQUY2RDtHQUE5Qjs7Ozs7QUF0UEssY0E4UHRDLENBQWEsU0FBYixDQUF1QixXQUF2QixHQUFxQyxVQUFVLEtBQVYsRUFBa0I7QUFDckQsUUFBSSxTQUFTLE9BQU8sTUFBTSxJQUFOLENBRGlDO0FBRXJELFFBQUssS0FBTSxNQUFOLENBQUwsRUFBc0I7QUFDcEIsV0FBTSxNQUFOLEVBQWdCLEtBQWhCLEVBRG9CO0tBQXRCO0dBRm1DLENBOVBDOztBQXFRdEMsZUFBYSxTQUFiLENBQXVCLE1BQXZCLEdBQWdDLFlBQVc7QUFDekMsU0FBSyxPQUFMLENBQWMsSUFBZCxFQUFvQixRQUFwQixFQUR5QztBQUV6QyxTQUFLLFlBQUwsR0FGeUM7R0FBWCxDQXJRTTs7QUEwUXRDLGVBQWEsU0FBYixDQUF1QixPQUF2QixHQUFpQyxZQUFXO0FBQzFDLFNBQUssT0FBTCxDQUFjLEtBQWQsRUFBcUIsU0FBckIsRUFEMEM7QUFFMUMsU0FBSyxZQUFMLEdBRjBDO0dBQVgsQ0ExUUs7O0FBK1F0QyxlQUFhLFNBQWIsQ0FBdUIsWUFBdkIsR0FBc0MsWUFBVztBQUMvQyxTQUFLLFVBQUwsQ0FBZ0IsbUJBQWhCLENBQXFDLE1BQXJDLEVBQTZDLElBQTdDLEVBRCtDO0FBRS9DLFNBQUssVUFBTCxDQUFnQixtQkFBaEIsQ0FBcUMsT0FBckMsRUFBOEMsSUFBOUMsRUFGK0M7QUFHL0MsU0FBSyxHQUFMLENBQVMsbUJBQVQsQ0FBOEIsTUFBOUIsRUFBc0MsSUFBdEMsRUFIK0M7QUFJL0MsU0FBSyxHQUFMLENBQVMsbUJBQVQsQ0FBOEIsT0FBOUIsRUFBdUMsSUFBdkMsRUFKK0M7R0FBWDs7OztBQS9RQSxXQXdSN0IsVUFBVCxDQUFxQixHQUFyQixFQUEwQixPQUExQixFQUFvQztBQUNsQyxTQUFLLEdBQUwsR0FBVyxHQUFYLENBRGtDO0FBRWxDLFNBQUssT0FBTCxHQUFlLE9BQWYsQ0FGa0M7QUFHbEMsU0FBSyxHQUFMLEdBQVcsSUFBSSxLQUFKLEVBQVgsQ0FIa0M7R0FBcEM7OztBQXhSc0MsWUErUnRDLENBQVcsU0FBWCxHQUF1QixPQUFPLE1BQVAsQ0FBZSxhQUFhLFNBQWIsQ0FBdEMsQ0EvUnNDOztBQWlTdEMsYUFBVyxTQUFYLENBQXFCLEtBQXJCLEdBQTZCLFlBQVc7QUFDdEMsU0FBSyxHQUFMLENBQVMsZ0JBQVQsQ0FBMkIsTUFBM0IsRUFBbUMsSUFBbkMsRUFEc0M7QUFFdEMsU0FBSyxHQUFMLENBQVMsZ0JBQVQsQ0FBMkIsT0FBM0IsRUFBb0MsSUFBcEMsRUFGc0M7QUFHdEMsU0FBSyxHQUFMLENBQVMsR0FBVCxHQUFlLEtBQUssR0FBTDs7QUFIdUIsUUFLbEMsYUFBYSxLQUFLLGtCQUFMLEVBQWIsQ0FMa0M7QUFNdEMsUUFBSyxVQUFMLEVBQWtCO0FBQ2hCLFdBQUssT0FBTCxDQUFjLEtBQUssR0FBTCxDQUFTLFlBQVQsS0FBMEIsQ0FBMUIsRUFBNkIsY0FBM0MsRUFEZ0I7QUFFaEIsV0FBSyxZQUFMLEdBRmdCO0tBQWxCO0dBTjJCLENBalNTOztBQTZTdEMsYUFBVyxTQUFYLENBQXFCLFlBQXJCLEdBQW9DLFlBQVc7QUFDN0MsU0FBSyxHQUFMLENBQVMsbUJBQVQsQ0FBOEIsTUFBOUIsRUFBc0MsSUFBdEMsRUFENkM7QUFFN0MsU0FBSyxHQUFMLENBQVMsbUJBQVQsQ0FBOEIsT0FBOUIsRUFBdUMsSUFBdkMsRUFGNkM7R0FBWCxDQTdTRTs7QUFrVHRDLGFBQVcsU0FBWCxDQUFxQixPQUFyQixHQUErQixVQUFVLFFBQVYsRUFBb0IsT0FBcEIsRUFBOEI7QUFDM0QsU0FBSyxRQUFMLEdBQWdCLFFBQWhCLENBRDJEO0FBRTNELFNBQUssU0FBTCxDQUFnQixVQUFoQixFQUE0QixDQUFFLElBQUYsRUFBUSxLQUFLLE9BQUwsRUFBYyxPQUF0QixDQUE1QixFQUYyRDtHQUE5Qjs7OztBQWxUTyxjQXlUdEMsQ0FBYSxnQkFBYixHQUFnQyxVQUFVLE1BQVYsRUFBbUI7QUFDakQsYUFBUyxVQUFVLE9BQU8sTUFBUCxDQUQ4QjtBQUVqRCxRQUFLLENBQUMsTUFBRCxFQUFVO0FBQ2IsYUFEYTtLQUFmOztBQUZpRCxLQU1qRCxHQUFJLE1BQUo7O0FBTmlELEtBUWpELENBQUUsRUFBRixDQUFLLFlBQUwsR0FBb0IsVUFBVSxPQUFWLEVBQW1CLFFBQW5CLEVBQThCO0FBQ2hELFVBQUksV0FBVyxJQUFJLFlBQUosQ0FBa0IsSUFBbEIsRUFBd0IsT0FBeEIsRUFBaUMsUUFBakMsQ0FBWCxDQUQ0QztBQUVoRCxhQUFPLFNBQVMsVUFBVCxDQUFvQixPQUFwQixDQUE2QixFQUFFLElBQUYsQ0FBN0IsQ0FBUCxDQUZnRDtLQUE5QixDQVI2QjtHQUFuQjs7QUF6VE0sY0F1VXRDLENBQWEsZ0JBQWI7Ozs7QUF2VXNDLFNBMlUvQixZQUFQLENBM1VzQztDQUF0QyxDQTlCQTs7O0FDMUhBLE9BQVEsNEJBQVIsRUFBc0MsSUFBdEMsQ0FBMkMsc0NBQTNDO0FBQ0EsT0FBUSwwQkFBUixFQUFvQyxJQUFwQyxDQUF5Qyw0Q0FBekM7Q0NEQTs7O0FDQUEsT0FBTyxRQUFQLEVBQWlCLFVBQWpCOzs7O0FDQ0EsRUFBRSxXQUFGLEVBQWUsRUFBZixDQUFrQixPQUFsQixFQUEyQixZQUFXO0FBQ3BDLElBQUUsUUFBRixFQUFZLFVBQVosQ0FBdUIsU0FBdkIsRUFBaUMsT0FBakMsRUFEb0M7Q0FBWCxDQUEzQjtDQ0RBOzs7QUNDQSxFQUFFLE1BQUYsRUFBVSxJQUFWLENBQWUsaUNBQWYsRUFBa0QsWUFBWTtBQUMzRCxNQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFULENBRHVEO0FBRTNELE1BQUksTUFBTSxPQUFPLFFBQVAsRUFBTixDQUZ1RDtBQUczRCxNQUFJLFNBQVMsRUFBRSxNQUFGLEVBQVUsTUFBVixFQUFULENBSHVEO0FBSTNELFdBQVMsU0FBUyxJQUFJLEdBQUosQ0FKeUM7QUFLM0QsV0FBUyxTQUFTLE9BQU8sTUFBUCxFQUFULEdBQTBCLENBQTFCLENBTGtEOztBQU8zRCxXQUFTLFlBQVQsR0FBd0I7QUFDdEIsV0FBTyxHQUFQLENBQVc7QUFDUCxvQkFBYyxTQUFTLElBQVQ7S0FEbEIsRUFEc0I7R0FBeEI7O0FBTUEsTUFBSSxTQUFTLENBQVQsRUFBWTtBQUNkLG1CQURjO0dBQWhCO0NBYitDLENBQWxEIiwiZmlsZSI6ImZvdW5kYXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyI7KGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gKGZhY3RvcnkoKSk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC53aGF0SW5wdXQgPSBmYWN0b3J5KCk7XG4gIH1cbn0gKHRoaXMsIGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cblxuICAvKlxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAgIHZhcmlhYmxlc1xuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAqL1xuXG4gIC8vIGFycmF5IG9mIGFjdGl2ZWx5IHByZXNzZWQga2V5c1xuICB2YXIgYWN0aXZlS2V5cyA9IFtdO1xuXG4gIC8vIGNhY2hlIGRvY3VtZW50LmJvZHlcbiAgdmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuXG4gIC8vIGJvb2xlYW46IHRydWUgaWYgdG91Y2ggYnVmZmVyIHRpbWVyIGlzIHJ1bm5pbmdcbiAgdmFyIGJ1ZmZlciA9IGZhbHNlO1xuXG4gIC8vIHRoZSBsYXN0IHVzZWQgaW5wdXQgdHlwZVxuICB2YXIgY3VycmVudElucHV0ID0gbnVsbDtcblxuICAvLyBhcnJheSBvZiBmb3JtIGVsZW1lbnRzIHRoYXQgdGFrZSBrZXlib2FyZCBpbnB1dFxuICB2YXIgZm9ybUlucHV0cyA9IFtcbiAgICAnaW5wdXQnLFxuICAgICdzZWxlY3QnLFxuICAgICd0ZXh0YXJlYSdcbiAgXTtcblxuICAvLyB1c2VyLXNldCBmbGFnIHRvIGFsbG93IHR5cGluZyBpbiBmb3JtIGZpZWxkcyB0byBiZSByZWNvcmRlZFxuICB2YXIgZm9ybVR5cGluZyA9IGJvZHkuaGFzQXR0cmlidXRlKCdkYXRhLXdoYXRpbnB1dC1mb3JtdHlwaW5nJyk7XG5cbiAgLy8gbWFwcGluZyBvZiBldmVudHMgdG8gaW5wdXQgdHlwZXNcbiAgdmFyIGlucHV0TWFwID0ge1xuICAgICdrZXlkb3duJzogJ2tleWJvYXJkJyxcbiAgICAnbW91c2Vkb3duJzogJ21vdXNlJyxcbiAgICAnbW91c2VlbnRlcic6ICdtb3VzZScsXG4gICAgJ3RvdWNoc3RhcnQnOiAndG91Y2gnLFxuICAgICdwb2ludGVyZG93bic6ICdwb2ludGVyJyxcbiAgICAnTVNQb2ludGVyRG93bic6ICdwb2ludGVyJ1xuICB9O1xuXG4gIC8vIGFycmF5IG9mIGFsbCB1c2VkIGlucHV0IHR5cGVzXG4gIHZhciBpbnB1dFR5cGVzID0gW107XG5cbiAgLy8gbWFwcGluZyBvZiBrZXkgY29kZXMgdG8gY29tbW9uIG5hbWVcbiAgdmFyIGtleU1hcCA9IHtcbiAgICA5OiAndGFiJyxcbiAgICAxMzogJ2VudGVyJyxcbiAgICAxNjogJ3NoaWZ0JyxcbiAgICAyNzogJ2VzYycsXG4gICAgMzI6ICdzcGFjZScsXG4gICAgMzc6ICdsZWZ0JyxcbiAgICAzODogJ3VwJyxcbiAgICAzOTogJ3JpZ2h0JyxcbiAgICA0MDogJ2Rvd24nXG4gIH07XG5cbiAgLy8gbWFwIG9mIElFIDEwIHBvaW50ZXIgZXZlbnRzXG4gIHZhciBwb2ludGVyTWFwID0ge1xuICAgIDI6ICd0b3VjaCcsXG4gICAgMzogJ3RvdWNoJywgLy8gdHJlYXQgcGVuIGxpa2UgdG91Y2hcbiAgICA0OiAnbW91c2UnXG4gIH07XG5cbiAgLy8gdG91Y2ggYnVmZmVyIHRpbWVyXG4gIHZhciB0aW1lcjtcblxuXG4gIC8qXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb25zXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICovXG5cbiAgZnVuY3Rpb24gYnVmZmVySW5wdXQoZXZlbnQpIHtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuXG4gICAgc2V0SW5wdXQoZXZlbnQpO1xuXG4gICAgYnVmZmVyID0gdHJ1ZTtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBidWZmZXIgPSBmYWxzZTtcbiAgICB9LCAxMDAwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGltbWVkaWF0ZUlucHV0KGV2ZW50KSB7XG4gICAgaWYgKCFidWZmZXIpIHNldElucHV0KGV2ZW50KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldElucHV0KGV2ZW50KSB7XG4gICAgdmFyIGV2ZW50S2V5ID0ga2V5KGV2ZW50KTtcbiAgICB2YXIgZXZlbnRUYXJnZXQgPSB0YXJnZXQoZXZlbnQpO1xuICAgIHZhciB2YWx1ZSA9IGlucHV0TWFwW2V2ZW50LnR5cGVdO1xuICAgIGlmICh2YWx1ZSA9PT0gJ3BvaW50ZXInKSB2YWx1ZSA9IHBvaW50ZXJUeXBlKGV2ZW50KTtcblxuICAgIGlmIChjdXJyZW50SW5wdXQgIT09IHZhbHVlKSB7XG4gICAgICBpZiAoXG4gICAgICAgIC8vIG9ubHkgaWYgdGhlIHVzZXIgZmxhZyBpc24ndCBzZXRcbiAgICAgICAgIWZvcm1UeXBpbmcgJiZcblxuICAgICAgICAvLyBvbmx5IGlmIGN1cnJlbnRJbnB1dCBoYXMgYSB2YWx1ZVxuICAgICAgICBjdXJyZW50SW5wdXQgJiZcblxuICAgICAgICAvLyBvbmx5IGlmIHRoZSBpbnB1dCBpcyBga2V5Ym9hcmRgXG4gICAgICAgIHZhbHVlID09PSAna2V5Ym9hcmQnICYmXG5cbiAgICAgICAgLy8gbm90IGlmIHRoZSBrZXkgaXMgYFRBQmBcbiAgICAgICAga2V5TWFwW2V2ZW50S2V5XSAhPT0gJ3RhYicgJiZcblxuICAgICAgICAvLyBvbmx5IGlmIHRoZSB0YXJnZXQgaXMgb25lIG9mIHRoZSBlbGVtZW50cyBpbiBgZm9ybUlucHV0c2BcbiAgICAgICAgZm9ybUlucHV0cy5pbmRleE9mKGV2ZW50VGFyZ2V0Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpID49IDBcbiAgICAgICkge1xuICAgICAgICAvLyBpZ25vcmUga2V5Ym9hcmQgdHlwaW5nIG9uIGZvcm0gZWxlbWVudHNcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN1cnJlbnRJbnB1dCA9IHZhbHVlO1xuICAgICAgICBib2R5LnNldEF0dHJpYnV0ZSgnZGF0YS13aGF0aW5wdXQnLCBjdXJyZW50SW5wdXQpO1xuXG4gICAgICAgIGlmIChpbnB1dFR5cGVzLmluZGV4T2YoY3VycmVudElucHV0KSA9PT0gLTEpIGlucHV0VHlwZXMucHVzaChjdXJyZW50SW5wdXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh2YWx1ZSA9PT0gJ2tleWJvYXJkJykgbG9nS2V5cyhldmVudEtleSk7XG4gIH1cblxuICBmdW5jdGlvbiBrZXkoZXZlbnQpIHtcbiAgICByZXR1cm4gKGV2ZW50LmtleUNvZGUpID8gZXZlbnQua2V5Q29kZSA6IGV2ZW50LndoaWNoO1xuICB9XG5cbiAgZnVuY3Rpb24gdGFyZ2V0KGV2ZW50KSB7XG4gICAgcmV0dXJuIGV2ZW50LnRhcmdldCB8fCBldmVudC5zcmNFbGVtZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gcG9pbnRlclR5cGUoZXZlbnQpIHtcbiAgICByZXR1cm4gKHR5cGVvZiBldmVudC5wb2ludGVyVHlwZSA9PT0gJ251bWJlcicpID8gcG9pbnRlck1hcFtldmVudC5wb2ludGVyVHlwZV0gOiBldmVudC5wb2ludGVyVHlwZTtcbiAgfVxuXG4gIC8vIGtleWJvYXJkIGxvZ2dpbmdcbiAgZnVuY3Rpb24gbG9nS2V5cyhldmVudEtleSkge1xuICAgIGlmIChhY3RpdmVLZXlzLmluZGV4T2Yoa2V5TWFwW2V2ZW50S2V5XSkgPT09IC0xICYmIGtleU1hcFtldmVudEtleV0pIGFjdGl2ZUtleXMucHVzaChrZXlNYXBbZXZlbnRLZXldKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVuTG9nS2V5cyhldmVudCkge1xuICAgIHZhciBldmVudEtleSA9IGtleShldmVudCk7XG4gICAgdmFyIGFycmF5UG9zID0gYWN0aXZlS2V5cy5pbmRleE9mKGtleU1hcFtldmVudEtleV0pO1xuXG4gICAgaWYgKGFycmF5UG9zICE9PSAtMSkgYWN0aXZlS2V5cy5zcGxpY2UoYXJyYXlQb3MsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gYmluZEV2ZW50cygpIHtcblxuICAgIC8vIHBvaW50ZXIvbW91c2VcbiAgICB2YXIgbW91c2VFdmVudCA9ICdtb3VzZWRvd24nO1xuXG4gICAgaWYgKHdpbmRvdy5Qb2ludGVyRXZlbnQpIHtcbiAgICAgIG1vdXNlRXZlbnQgPSAncG9pbnRlcmRvd24nO1xuICAgIH0gZWxzZSBpZiAod2luZG93Lk1TUG9pbnRlckV2ZW50KSB7XG4gICAgICBtb3VzZUV2ZW50ID0gJ01TUG9pbnRlckRvd24nO1xuICAgIH1cblxuICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcihtb3VzZUV2ZW50LCBpbW1lZGlhdGVJbnB1dCk7XG4gICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgaW1tZWRpYXRlSW5wdXQpO1xuXG4gICAgLy8gdG91Y2hcbiAgICBpZiAoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSB7XG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBidWZmZXJJbnB1dCk7XG4gICAgfVxuXG4gICAgLy8ga2V5Ym9hcmRcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBpbW1lZGlhdGVJbnB1dCk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB1bkxvZ0tleXMpO1xuICB9XG5cblxuICAvKlxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAgIGluaXRcblxuICAgIGRvbid0IHN0YXJ0IHNjcmlwdCB1bmxlc3MgYnJvd3NlciBjdXRzIHRoZSBtdXN0YXJkLFxuICAgIGFsc28gcGFzc2VzIGlmIHBvbHlmaWxscyBhcmUgdXNlZFxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAqL1xuXG4gIGlmICgnYWRkRXZlbnRMaXN0ZW5lcicgaW4gd2luZG93ICYmIEFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gICAgYmluZEV2ZW50cygpO1xuICB9XG5cblxuICAvKlxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAgIGFwaVxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAqL1xuXG4gIHJldHVybiB7XG5cbiAgICAvLyByZXR1cm5zIHN0cmluZzogdGhlIGN1cnJlbnQgaW5wdXQgdHlwZVxuICAgIGFzazogZnVuY3Rpb24oKSB7IHJldHVybiBjdXJyZW50SW5wdXQ7IH0sXG5cbiAgICAvLyByZXR1cm5zIGFycmF5OiBjdXJyZW50bHkgcHJlc3NlZCBrZXlzXG4gICAga2V5czogZnVuY3Rpb24oKSB7IHJldHVybiBhY3RpdmVLZXlzOyB9LFxuXG4gICAgLy8gcmV0dXJucyBhcnJheTogYWxsIHRoZSBkZXRlY3RlZCBpbnB1dCB0eXBlc1xuICAgIHR5cGVzOiBmdW5jdGlvbigpIHsgcmV0dXJuIGlucHV0VHlwZXM7IH0sXG5cbiAgICAvLyBhY2NlcHRzIHN0cmluZzogbWFudWFsbHkgc2V0IHRoZSBpbnB1dCB0eXBlXG4gICAgc2V0OiBzZXRJbnB1dFxuICB9O1xuXG59KSk7XG4iLCIhZnVuY3Rpb24oJCkge1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEZPVU5EQVRJT05fVkVSU0lPTiA9ICc2LjIuMCc7XG5cbi8vIEdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuLy8gVGhpcyBpcyBhdHRhY2hlZCB0byB0aGUgd2luZG93LCBvciB1c2VkIGFzIGEgbW9kdWxlIGZvciBBTUQvQnJvd3NlcmlmeVxudmFyIEZvdW5kYXRpb24gPSB7XG4gIHZlcnNpb246IEZPVU5EQVRJT05fVkVSU0lPTixcblxuICAvKipcbiAgICogU3RvcmVzIGluaXRpYWxpemVkIHBsdWdpbnMuXG4gICAqL1xuICBfcGx1Z2luczoge30sXG5cbiAgLyoqXG4gICAqIFN0b3JlcyBnZW5lcmF0ZWQgdW5pcXVlIGlkcyBmb3IgcGx1Z2luIGluc3RhbmNlc1xuICAgKi9cbiAgX3V1aWRzOiBbXSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJvb2xlYW4gZm9yIFJUTCBzdXBwb3J0XG4gICAqL1xuICBydGw6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICQoJ2h0bWwnKS5hdHRyKCdkaXInKSA9PT0gJ3J0bCc7XG4gIH0sXG4gIC8qKlxuICAgKiBEZWZpbmVzIGEgRm91bmRhdGlvbiBwbHVnaW4sIGFkZGluZyBpdCB0byB0aGUgYEZvdW5kYXRpb25gIG5hbWVzcGFjZSBhbmQgdGhlIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplIHdoZW4gcmVmbG93aW5nLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBwbHVnaW4uXG4gICAqL1xuICBwbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSkge1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gYWRkaW5nIHRvIGdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuICAgIC8vIEV4YW1wbGVzOiBGb3VuZGF0aW9uLlJldmVhbCwgRm91bmRhdGlvbi5PZmZDYW52YXNcbiAgICB2YXIgY2xhc3NOYW1lID0gKG5hbWUgfHwgZnVuY3Rpb25OYW1lKHBsdWdpbikpO1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gc3RvcmluZyB0aGUgcGx1Z2luLCBhbHNvIHVzZWQgdG8gY3JlYXRlIHRoZSBpZGVudGlmeWluZyBkYXRhIGF0dHJpYnV0ZSBmb3IgdGhlIHBsdWdpblxuICAgIC8vIEV4YW1wbGVzOiBkYXRhLXJldmVhbCwgZGF0YS1vZmYtY2FudmFzXG4gICAgdmFyIGF0dHJOYW1lICA9IGh5cGhlbmF0ZShjbGFzc05hbWUpO1xuXG4gICAgLy8gQWRkIHRvIHRoZSBGb3VuZGF0aW9uIG9iamVjdCBhbmQgdGhlIHBsdWdpbnMgbGlzdCAoZm9yIHJlZmxvd2luZylcbiAgICB0aGlzLl9wbHVnaW5zW2F0dHJOYW1lXSA9IHRoaXNbY2xhc3NOYW1lXSA9IHBsdWdpbjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBQb3B1bGF0ZXMgdGhlIF91dWlkcyBhcnJheSB3aXRoIHBvaW50ZXJzIHRvIGVhY2ggaW5kaXZpZHVhbCBwbHVnaW4gaW5zdGFuY2UuXG4gICAqIEFkZHMgdGhlIGB6ZlBsdWdpbmAgZGF0YS1hdHRyaWJ1dGUgdG8gcHJvZ3JhbW1hdGljYWxseSBjcmVhdGVkIHBsdWdpbnMgdG8gYWxsb3cgdXNlIG9mICQoc2VsZWN0b3IpLmZvdW5kYXRpb24obWV0aG9kKSBjYWxscy5cbiAgICogQWxzbyBmaXJlcyB0aGUgaW5pdGlhbGl6YXRpb24gZXZlbnQgZm9yIGVhY2ggcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGVkaXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBwbHVnaW4sIHBhc3NlZCBhcyBhIGNhbWVsQ2FzZWQgc3RyaW5nLlxuICAgKiBAZmlyZXMgUGx1Z2luI2luaXRcbiAgICovXG4gIHJlZ2lzdGVyUGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpe1xuICAgIHZhciBwbHVnaW5OYW1lID0gbmFtZSA/IGh5cGhlbmF0ZShuYW1lKSA6IGZ1bmN0aW9uTmFtZShwbHVnaW4uY29uc3RydWN0b3IpLnRvTG93ZXJDYXNlKCk7XG4gICAgcGx1Z2luLnV1aWQgPSB0aGlzLkdldFlvRGlnaXRzKDYsIHBsdWdpbk5hbWUpO1xuXG4gICAgaWYoIXBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKSl7IHBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gLCBwbHVnaW4udXVpZCk7IH1cbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykpeyBwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nLCBwbHVnaW4pOyB9XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBpbml0aWFsaXplZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2luaXRcbiAgICAgICAgICAgKi9cbiAgICBwbHVnaW4uJGVsZW1lbnQudHJpZ2dlcihgaW5pdC56Zi4ke3BsdWdpbk5hbWV9YCk7XG5cbiAgICB0aGlzLl91dWlkcy5wdXNoKHBsdWdpbi51dWlkKTtcblxuICAgIHJldHVybjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBSZW1vdmVzIHRoZSBwbHVnaW5zIHV1aWQgZnJvbSB0aGUgX3V1aWRzIGFycmF5LlxuICAgKiBSZW1vdmVzIHRoZSB6ZlBsdWdpbiBkYXRhIGF0dHJpYnV0ZSwgYXMgd2VsbCBhcyB0aGUgZGF0YS1wbHVnaW4tbmFtZSBhdHRyaWJ1dGUuXG4gICAqIEFsc28gZmlyZXMgdGhlIGRlc3Ryb3llZCBldmVudCBmb3IgdGhlIHBsdWdpbiwgY29uc29saWRhdGluZyByZXBlZGl0aXZlIGNvZGUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBhbiBpbnN0YW5jZSBvZiBhIHBsdWdpbiwgdXN1YWxseSBgdGhpc2AgaW4gY29udGV4dC5cbiAgICogQGZpcmVzIFBsdWdpbiNkZXN0cm95ZWRcbiAgICovXG4gIHVucmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbil7XG4gICAgdmFyIHBsdWdpbk5hbWUgPSBoeXBoZW5hdGUoZnVuY3Rpb25OYW1lKHBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicpLmNvbnN0cnVjdG9yKSk7XG5cbiAgICB0aGlzLl91dWlkcy5zcGxpY2UodGhpcy5fdXVpZHMuaW5kZXhPZihwbHVnaW4udXVpZCksIDEpO1xuICAgIHBsdWdpbi4kZWxlbWVudC5yZW1vdmVBdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKS5yZW1vdmVEYXRhKCd6ZlBsdWdpbicpXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBiZWVuIGRlc3Ryb3llZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2Rlc3Ryb3llZFxuICAgICAgICAgICAqL1xuICAgICAgICAgIC50cmlnZ2VyKGBkZXN0cm95ZWQuemYuJHtwbHVnaW5OYW1lfWApO1xuICAgIGZvcih2YXIgcHJvcCBpbiBwbHVnaW4pe1xuICAgICAgcGx1Z2luW3Byb3BdID0gbnVsbDsvL2NsZWFuIHVwIHNjcmlwdCB0byBwcmVwIGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgfVxuICAgIHJldHVybjtcbiAgfSxcblxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIENhdXNlcyBvbmUgb3IgbW9yZSBhY3RpdmUgcGx1Z2lucyB0byByZS1pbml0aWFsaXplLCByZXNldHRpbmcgZXZlbnQgbGlzdGVuZXJzLCByZWNhbGN1bGF0aW5nIHBvc2l0aW9ucywgZXRjLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGx1Z2lucyAtIG9wdGlvbmFsIHN0cmluZyBvZiBhbiBpbmRpdmlkdWFsIHBsdWdpbiBrZXksIGF0dGFpbmVkIGJ5IGNhbGxpbmcgYCQoZWxlbWVudCkuZGF0YSgncGx1Z2luTmFtZScpYCwgb3Igc3RyaW5nIG9mIGEgcGx1Z2luIGNsYXNzIGkuZS4gYCdkcm9wZG93bidgXG4gICAqIEBkZWZhdWx0IElmIG5vIGFyZ3VtZW50IGlzIHBhc3NlZCwgcmVmbG93IGFsbCBjdXJyZW50bHkgYWN0aXZlIHBsdWdpbnMuXG4gICAqL1xuICAgcmVJbml0OiBmdW5jdGlvbihwbHVnaW5zKXtcbiAgICAgdmFyIGlzSlEgPSBwbHVnaW5zIGluc3RhbmNlb2YgJDtcbiAgICAgdHJ5e1xuICAgICAgIGlmKGlzSlEpe1xuICAgICAgICAgcGx1Z2lucy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICQodGhpcykuZGF0YSgnemZQbHVnaW4nKS5faW5pdCgpO1xuICAgICAgICAgfSk7XG4gICAgICAgfWVsc2V7XG4gICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBwbHVnaW5zLFxuICAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgZm5zID0ge1xuICAgICAgICAgICAnb2JqZWN0JzogZnVuY3Rpb24ocGxncyl7XG4gICAgICAgICAgICAgcGxncy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuICAgICAgICAgICAgICAgcCA9IGh5cGhlbmF0ZShwKTtcbiAgICAgICAgICAgICAgICQoJ1tkYXRhLScrIHAgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgJ3N0cmluZyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgcGx1Z2lucyA9IGh5cGhlbmF0ZShwbHVnaW5zKTtcbiAgICAgICAgICAgICAkKCdbZGF0YS0nKyBwbHVnaW5zICsnXScpLmZvdW5kYXRpb24oJ19pbml0Jyk7XG4gICAgICAgICAgIH0sXG4gICAgICAgICAgICd1bmRlZmluZWQnOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgIHRoaXNbJ29iamVjdCddKE9iamVjdC5rZXlzKF90aGlzLl9wbHVnaW5zKSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH07XG4gICAgICAgICBmbnNbdHlwZV0ocGx1Z2lucyk7XG4gICAgICAgfVxuICAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgIH1maW5hbGx5e1xuICAgICAgIHJldHVybiBwbHVnaW5zO1xuICAgICB9XG4gICB9LFxuXG4gIC8qKlxuICAgKiByZXR1cm5zIGEgcmFuZG9tIGJhc2UtMzYgdWlkIHdpdGggbmFtZXNwYWNpbmdcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggLSBudW1iZXIgb2YgcmFuZG9tIGJhc2UtMzYgZGlnaXRzIGRlc2lyZWQuIEluY3JlYXNlIGZvciBtb3JlIHJhbmRvbSBzdHJpbmdzLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIC0gbmFtZSBvZiBwbHVnaW4gdG8gYmUgaW5jb3Jwb3JhdGVkIGluIHVpZCwgb3B0aW9uYWwuXG4gICAqIEBkZWZhdWx0IHtTdHJpbmd9ICcnIC0gaWYgbm8gcGx1Z2luIG5hbWUgaXMgcHJvdmlkZWQsIG5vdGhpbmcgaXMgYXBwZW5kZWQgdG8gdGhlIHVpZC5cbiAgICogQHJldHVybnMge1N0cmluZ30gLSB1bmlxdWUgaWRcbiAgICovXG4gIEdldFlvRGlnaXRzOiBmdW5jdGlvbihsZW5ndGgsIG5hbWVzcGFjZSl7XG4gICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDY7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoKE1hdGgucG93KDM2LCBsZW5ndGggKyAxKSAtIE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygzNiwgbGVuZ3RoKSkpLnRvU3RyaW5nKDM2KS5zbGljZSgxKSArIChuYW1lc3BhY2UgPyBgLSR7bmFtZXNwYWNlfWAgOiAnJyk7XG4gIH0sXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHBsdWdpbnMgb24gYW55IGVsZW1lbnRzIHdpdGhpbiBgZWxlbWAgKGFuZCBgZWxlbWAgaXRzZWxmKSB0aGF0IGFyZW4ndCBhbHJlYWR5IGluaXRpYWxpemVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbSAtIGpRdWVyeSBvYmplY3QgY29udGFpbmluZyB0aGUgZWxlbWVudCB0byBjaGVjayBpbnNpZGUuIEFsc28gY2hlY2tzIHRoZSBlbGVtZW50IGl0c2VsZiwgdW5sZXNzIGl0J3MgdGhlIGBkb2N1bWVudGAgb2JqZWN0LlxuICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gcGx1Z2lucyAtIEEgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUuIExlYXZlIHRoaXMgb3V0IHRvIGluaXRpYWxpemUgZXZlcnl0aGluZy5cbiAgICovXG4gIHJlZmxvdzogZnVuY3Rpb24oZWxlbSwgcGx1Z2lucykge1xuXG4gICAgLy8gSWYgcGx1Z2lucyBpcyB1bmRlZmluZWQsIGp1c3QgZ3JhYiBldmVyeXRoaW5nXG4gICAgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcGx1Z2lucyA9IE9iamVjdC5rZXlzKHRoaXMuX3BsdWdpbnMpO1xuICAgIH1cbiAgICAvLyBJZiBwbHVnaW5zIGlzIGEgc3RyaW5nLCBjb252ZXJ0IGl0IHRvIGFuIGFycmF5IHdpdGggb25lIGl0ZW1cbiAgICBlbHNlIGlmICh0eXBlb2YgcGx1Z2lucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBsdWdpbnMgPSBbcGx1Z2luc107XG4gICAgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHBsdWdpblxuICAgICQuZWFjaChwbHVnaW5zLCBmdW5jdGlvbihpLCBuYW1lKSB7XG4gICAgICAvLyBHZXQgdGhlIGN1cnJlbnQgcGx1Z2luXG4gICAgICB2YXIgcGx1Z2luID0gX3RoaXMuX3BsdWdpbnNbbmFtZV07XG5cbiAgICAgIC8vIExvY2FsaXplIHRoZSBzZWFyY2ggdG8gYWxsIGVsZW1lbnRzIGluc2lkZSBlbGVtLCBhcyB3ZWxsIGFzIGVsZW0gaXRzZWxmLCB1bmxlc3MgZWxlbSA9PT0gZG9jdW1lbnRcbiAgICAgIHZhciAkZWxlbSA9ICQoZWxlbSkuZmluZCgnW2RhdGEtJytuYW1lKyddJykuYWRkQmFjaygnW2RhdGEtJytuYW1lKyddJyk7XG5cbiAgICAgIC8vIEZvciBlYWNoIHBsdWdpbiBmb3VuZCwgaW5pdGlhbGl6ZSBpdFxuICAgICAgJGVsZW0uZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRlbCA9ICQodGhpcyksXG4gICAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgIC8vIERvbid0IGRvdWJsZS1kaXAgb24gcGx1Z2luc1xuICAgICAgICBpZiAoJGVsLmRhdGEoJ3pmUGx1Z2luJykpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJUcmllZCB0byBpbml0aWFsaXplIFwiK25hbWUrXCIgb24gYW4gZWxlbWVudCB0aGF0IGFscmVhZHkgaGFzIGEgRm91bmRhdGlvbiBwbHVnaW4uXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCRlbC5hdHRyKCdkYXRhLW9wdGlvbnMnKSl7XG4gICAgICAgICAgdmFyIHRoaW5nID0gJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpLnNwbGl0KCc7JykuZm9yRWFjaChmdW5jdGlvbihlLCBpKXtcbiAgICAgICAgICAgIHZhciBvcHQgPSBlLnNwbGl0KCc6JykubWFwKGZ1bmN0aW9uKGVsKXsgcmV0dXJuIGVsLnRyaW0oKTsgfSk7XG4gICAgICAgICAgICBpZihvcHRbMF0pIG9wdHNbb3B0WzBdXSA9IHBhcnNlVmFsdWUob3B0WzFdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0cnl7XG4gICAgICAgICAgJGVsLmRhdGEoJ3pmUGx1Z2luJywgbmV3IHBsdWdpbigkKHRoaXMpLCBvcHRzKSk7XG4gICAgICAgIH1jYXRjaChlcil7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcik7XG4gICAgICAgIH1maW5hbGx5e1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG4gIGdldEZuTmFtZTogZnVuY3Rpb25OYW1lLFxuICB0cmFuc2l0aW9uZW5kOiBmdW5jdGlvbigkZWxlbSl7XG4gICAgdmFyIHRyYW5zaXRpb25zID0ge1xuICAgICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgJ09UcmFuc2l0aW9uJzogJ290cmFuc2l0aW9uZW5kJ1xuICAgIH07XG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgZW5kO1xuXG4gICAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucyl7XG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbdF0gIT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgZW5kID0gdHJhbnNpdGlvbnNbdF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmKGVuZCl7XG4gICAgICByZXR1cm4gZW5kO1xuICAgIH1lbHNle1xuICAgICAgZW5kID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAkZWxlbS50cmlnZ2VySGFuZGxlcigndHJhbnNpdGlvbmVuZCcsIFskZWxlbV0pO1xuICAgICAgfSwgMSk7XG4gICAgICByZXR1cm4gJ3RyYW5zaXRpb25lbmQnO1xuICAgIH1cbiAgfVxufTtcblxuRm91bmRhdGlvbi51dGlsID0ge1xuICAvKipcbiAgICogRnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgZGVib3VuY2UgZWZmZWN0IHRvIGEgZnVuY3Rpb24gY2FsbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgLSBGdW5jdGlvbiB0byBiZSBjYWxsZWQgYXQgZW5kIG9mIHRpbWVvdXQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSAtIFRpbWUgaW4gbXMgdG8gZGVsYXkgdGhlIGNhbGwgb2YgYGZ1bmNgLlxuICAgKiBAcmV0dXJucyBmdW5jdGlvblxuICAgKi9cbiAgdGhyb3R0bGU6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSkge1xuICAgIHZhciB0aW1lciA9IG51bGw7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgICBpZiAodGltZXIgPT09IG51bGwpIHtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn07XG5cbi8vIFRPRE86IGNvbnNpZGVyIG5vdCBtYWtpbmcgdGhpcyBhIGpRdWVyeSBmdW5jdGlvblxuLy8gVE9ETzogbmVlZCB3YXkgdG8gcmVmbG93IHZzLiByZS1pbml0aWFsaXplXG4vKipcbiAqIFRoZSBGb3VuZGF0aW9uIGpRdWVyeSBtZXRob2QuXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gbWV0aG9kIC0gQW4gYWN0aW9uIHRvIHBlcmZvcm0gb24gdGhlIGN1cnJlbnQgalF1ZXJ5IG9iamVjdC5cbiAqL1xudmFyIGZvdW5kYXRpb24gPSBmdW5jdGlvbihtZXRob2QpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgbWV0aG9kLFxuICAgICAgJG1ldGEgPSAkKCdtZXRhLmZvdW5kYXRpb24tbXEnKSxcbiAgICAgICRub0pTID0gJCgnLm5vLWpzJyk7XG5cbiAgaWYoISRtZXRhLmxlbmd0aCl7XG4gICAgJCgnPG1ldGEgY2xhc3M9XCJmb3VuZGF0aW9uLW1xXCI+JykuYXBwZW5kVG8oZG9jdW1lbnQuaGVhZCk7XG4gIH1cbiAgaWYoJG5vSlMubGVuZ3RoKXtcbiAgICAkbm9KUy5yZW1vdmVDbGFzcygnbm8tanMnKTtcbiAgfVxuXG4gIGlmKHR5cGUgPT09ICd1bmRlZmluZWQnKXsvL25lZWRzIHRvIGluaXRpYWxpemUgdGhlIEZvdW5kYXRpb24gb2JqZWN0LCBvciBhbiBpbmRpdmlkdWFsIHBsdWdpbi5cbiAgICBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuX2luaXQoKTtcbiAgICBGb3VuZGF0aW9uLnJlZmxvdyh0aGlzKTtcbiAgfWVsc2UgaWYodHlwZSA9PT0gJ3N0cmluZycpey8vYW4gaW5kaXZpZHVhbCBtZXRob2QgdG8gaW52b2tlIG9uIGEgcGx1Z2luIG9yIGdyb3VwIG9mIHBsdWdpbnNcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7Ly9jb2xsZWN0IGFsbCB0aGUgYXJndW1lbnRzLCBpZiBuZWNlc3NhcnlcbiAgICB2YXIgcGx1Z0NsYXNzID0gdGhpcy5kYXRhKCd6ZlBsdWdpbicpOy8vZGV0ZXJtaW5lIHRoZSBjbGFzcyBvZiBwbHVnaW5cblxuICAgIGlmKHBsdWdDbGFzcyAhPT0gdW5kZWZpbmVkICYmIHBsdWdDbGFzc1ttZXRob2RdICE9PSB1bmRlZmluZWQpey8vbWFrZSBzdXJlIGJvdGggdGhlIGNsYXNzIGFuZCBtZXRob2QgZXhpc3RcbiAgICAgIGlmKHRoaXMubGVuZ3RoID09PSAxKXsvL2lmIHRoZXJlJ3Mgb25seSBvbmUsIGNhbGwgaXQgZGlyZWN0bHkuXG4gICAgICAgICAgcGx1Z0NsYXNzW21ldGhvZF0uYXBwbHkocGx1Z0NsYXNzLCBhcmdzKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSwgZWwpey8vb3RoZXJ3aXNlIGxvb3AgdGhyb3VnaCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gYW5kIGludm9rZSB0aGUgbWV0aG9kIG9uIGVhY2hcbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseSgkKGVsKS5kYXRhKCd6ZlBsdWdpbicpLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfWVsc2V7Ly9lcnJvciBmb3Igbm8gY2xhc3Mgb3Igbm8gbWV0aG9kXG4gICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJXZSdyZSBzb3JyeSwgJ1wiICsgbWV0aG9kICsgXCInIGlzIG5vdCBhbiBhdmFpbGFibGUgbWV0aG9kIGZvciBcIiArIChwbHVnQ2xhc3MgPyBmdW5jdGlvbk5hbWUocGx1Z0NsYXNzKSA6ICd0aGlzIGVsZW1lbnQnKSArICcuJyk7XG4gICAgfVxuICB9ZWxzZXsvL2Vycm9yIGZvciBpbnZhbGlkIGFyZ3VtZW50IHR5cGVcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBXZSdyZSBzb3JyeSwgJHt0eXBlfSBpcyBub3QgYSB2YWxpZCBwYXJhbWV0ZXIuIFlvdSBtdXN0IHVzZSBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1ldGhvZCB5b3Ugd2lzaCB0byBpbnZva2UuYCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG53aW5kb3cuRm91bmRhdGlvbiA9IEZvdW5kYXRpb247XG4kLmZuLmZvdW5kYXRpb24gPSBmb3VuZGF0aW9uO1xuXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4oZnVuY3Rpb24oKSB7XG4gIGlmICghRGF0ZS5ub3cgfHwgIXdpbmRvdy5EYXRlLm5vdylcbiAgICB3aW5kb3cuRGF0ZS5ub3cgPSBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG5cbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKytpKSB7XG4gICAgICB2YXIgdnAgPSB2ZW5kb3JzW2ldO1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSAod2luZG93W3ZwKydDYW5jZWxBbmltYXRpb25GcmFtZSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3dbdnArJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddKTtcbiAgfVxuICBpZiAoL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxuICAgIHx8ICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8ICF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGxhc3RUaW1lID0gbmV4dFRpbWUpOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VGltZSAtIG5vdyk7XG4gICAgfTtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjbGVhclRpbWVvdXQ7XG4gIH1cbiAgLyoqXG4gICAqIFBvbHlmaWxsIGZvciBwZXJmb3JtYW5jZS5ub3csIHJlcXVpcmVkIGJ5IHJBRlxuICAgKi9cbiAgaWYoIXdpbmRvdy5wZXJmb3JtYW5jZSB8fCAhd2luZG93LnBlcmZvcm1hbmNlLm5vdyl7XG4gICAgd2luZG93LnBlcmZvcm1hbmNlID0ge1xuICAgICAgc3RhcnQ6IERhdGUubm93KCksXG4gICAgICBub3c6IGZ1bmN0aW9uKCl7IHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGFydDsgfVxuICAgIH07XG4gIH1cbn0pKCk7XG5pZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24ob1RoaXMpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcbiAgICB9XG5cbiAgICB2YXIgYUFyZ3MgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXG4gICAgICAgIGZUb0JpbmQgPSB0aGlzLFxuICAgICAgICBmTk9QICAgID0gZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgZkJvdW5kICA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXG4gICAgICAgICAgICAgICAgID8gdGhpc1xuICAgICAgICAgICAgICAgICA6IG9UaGlzLFxuICAgICAgICAgICAgICAgICBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9O1xuXG4gICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XG4gICAgICAvLyBuYXRpdmUgZnVuY3Rpb25zIGRvbid0IGhhdmUgYSBwcm90b3R5cGVcbiAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgfVxuICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xuXG4gICAgcmV0dXJuIGZCb3VuZDtcbiAgfTtcbn1cbi8vIFBvbHlmaWxsIHRvIGdldCB0aGUgbmFtZSBvZiBhIGZ1bmN0aW9uIGluIElFOVxuZnVuY3Rpb24gZnVuY3Rpb25OYW1lKGZuKSB7XG4gIGlmIChGdW5jdGlvbi5wcm90b3R5cGUubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb25cXHMoW14oXXsxLH0pXFwoLztcbiAgICB2YXIgcmVzdWx0cyA9IChmdW5jTmFtZVJlZ2V4KS5leGVjKChmbikudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoID4gMSkgPyByZXN1bHRzWzFdLnRyaW0oKSA6IFwiXCI7XG4gIH1cbiAgZWxzZSBpZiAoZm4ucHJvdG90eXBlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm4uY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gZm4ucHJvdG90eXBlLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbn1cbmZ1bmN0aW9uIHBhcnNlVmFsdWUoc3RyKXtcbiAgaWYoL3RydWUvLnRlc3Qoc3RyKSkgcmV0dXJuIHRydWU7XG4gIGVsc2UgaWYoL2ZhbHNlLy50ZXN0KHN0cikpIHJldHVybiBmYWxzZTtcbiAgZWxzZSBpZighaXNOYU4oc3RyICogMSkpIHJldHVybiBwYXJzZUZsb2F0KHN0cik7XG4gIHJldHVybiBzdHI7XG59XG4vLyBDb252ZXJ0IFBhc2NhbENhc2UgdG8ga2ViYWItY2FzZVxuLy8gVGhhbmsgeW91OiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS84OTU1NTgwXG5mdW5jdGlvbiBoeXBoZW5hdGUoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbn1cblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5Gb3VuZGF0aW9uLkJveCA9IHtcbiAgSW1Ob3RUb3VjaGluZ1lvdTogSW1Ob3RUb3VjaGluZ1lvdSxcbiAgR2V0RGltZW5zaW9uczogR2V0RGltZW5zaW9ucyxcbiAgR2V0T2Zmc2V0czogR2V0T2Zmc2V0c1xufVxuXG4vKipcbiAqIENvbXBhcmVzIHRoZSBkaW1lbnNpb25zIG9mIGFuIGVsZW1lbnQgdG8gYSBjb250YWluZXIgYW5kIGRldGVybWluZXMgY29sbGlzaW9uIGV2ZW50cyB3aXRoIGNvbnRhaW5lci5cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHRlc3QgZm9yIGNvbGxpc2lvbnMuXG4gKiBAcGFyYW0ge2pRdWVyeX0gcGFyZW50IC0galF1ZXJ5IG9iamVjdCB0byB1c2UgYXMgYm91bmRpbmcgY29udGFpbmVyLlxuICogQHBhcmFtIHtCb29sZWFufSBsck9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayBsZWZ0IGFuZCByaWdodCB2YWx1ZXMgb25seS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdGJPbmx5IC0gc2V0IHRvIHRydWUgdG8gY2hlY2sgdG9wIGFuZCBib3R0b20gdmFsdWVzIG9ubHkuXG4gKiBAZGVmYXVsdCBpZiBubyBwYXJlbnQgb2JqZWN0IHBhc3NlZCwgZGV0ZWN0cyBjb2xsaXNpb25zIHdpdGggYHdpbmRvd2AuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSB0cnVlIGlmIGNvbGxpc2lvbiBmcmVlLCBmYWxzZSBpZiBhIGNvbGxpc2lvbiBpbiBhbnkgZGlyZWN0aW9uLlxuICovXG5mdW5jdGlvbiBJbU5vdFRvdWNoaW5nWW91KGVsZW1lbnQsIHBhcmVudCwgbHJPbmx5LCB0Yk9ubHkpIHtcbiAgdmFyIGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgdG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0O1xuXG4gIGlmIChwYXJlbnQpIHtcbiAgICB2YXIgcGFyRGltcyA9IEdldERpbWVuc2lvbnMocGFyZW50KTtcblxuICAgIGJvdHRvbSA9IChlbGVEaW1zLm9mZnNldC50b3AgKyBlbGVEaW1zLmhlaWdodCA8PSBwYXJEaW1zLmhlaWdodCArIHBhckRpbXMub2Zmc2V0LnRvcCk7XG4gICAgdG9wICAgID0gKGVsZURpbXMub2Zmc2V0LnRvcCA+PSBwYXJEaW1zLm9mZnNldC50b3ApO1xuICAgIGxlZnQgICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ID49IHBhckRpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBwYXJEaW1zLndpZHRoKTtcbiAgfVxuICBlbHNlIHtcbiAgICBib3R0b20gPSAoZWxlRGltcy5vZmZzZXQudG9wICsgZWxlRGltcy5oZWlnaHQgPD0gZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCArIGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBlbGVEaW1zLndpbmRvd0RpbXMud2lkdGgpO1xuICB9XG5cbiAgdmFyIGFsbERpcnMgPSBbYm90dG9tLCB0b3AsIGxlZnQsIHJpZ2h0XTtcblxuICBpZiAobHJPbmx5KSB7XG4gICAgcmV0dXJuIGxlZnQgPT09IHJpZ2h0ID09PSB0cnVlO1xuICB9XG5cbiAgaWYgKHRiT25seSkge1xuICAgIHJldHVybiB0b3AgPT09IGJvdHRvbSA9PT0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBhbGxEaXJzLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbn07XG5cbi8qKlxuICogVXNlcyBuYXRpdmUgbWV0aG9kcyB0byByZXR1cm4gYW4gb2JqZWN0IG9mIGRpbWVuc2lvbiB2YWx1ZXMuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5IHx8IEhUTUx9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IG9yIERPTSBlbGVtZW50IGZvciB3aGljaCB0byBnZXQgdGhlIGRpbWVuc2lvbnMuIENhbiBiZSBhbnkgZWxlbWVudCBvdGhlciB0aGF0IGRvY3VtZW50IG9yIHdpbmRvdy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbmVzdGVkIG9iamVjdCBvZiBpbnRlZ2VyIHBpeGVsIHZhbHVlc1xuICogVE9ETyAtIGlmIGVsZW1lbnQgaXMgd2luZG93LCByZXR1cm4gb25seSB0aG9zZSB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIEdldERpbWVuc2lvbnMoZWxlbSwgdGVzdCl7XG4gIGVsZW0gPSBlbGVtLmxlbmd0aCA/IGVsZW1bMF0gOiBlbGVtO1xuXG4gIGlmIChlbGVtID09PSB3aW5kb3cgfHwgZWxlbSA9PT0gZG9jdW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJJ20gc29ycnksIERhdmUuIEknbSBhZnJhaWQgSSBjYW4ndCBkbyB0aGF0LlwiKTtcbiAgfVxuXG4gIHZhciByZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHBhclJlY3QgPSBlbGVtLnBhcmVudE5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB3aW5SZWN0ID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHdpblkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG4gICAgICB3aW5YID0gd2luZG93LnBhZ2VYT2Zmc2V0O1xuXG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcbiAgICBvZmZzZXQ6IHtcbiAgICAgIHRvcDogcmVjdC50b3AgKyB3aW5ZLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgd2luWFxuICAgIH0sXG4gICAgcGFyZW50RGltczoge1xuICAgICAgd2lkdGg6IHBhclJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHBhclJlY3QuaGVpZ2h0LFxuICAgICAgb2Zmc2V0OiB7XG4gICAgICAgIHRvcDogcGFyUmVjdC50b3AgKyB3aW5ZLFxuICAgICAgICBsZWZ0OiBwYXJSZWN0LmxlZnQgKyB3aW5YXG4gICAgICB9XG4gICAgfSxcbiAgICB3aW5kb3dEaW1zOiB7XG4gICAgICB3aWR0aDogd2luUmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogd2luUmVjdC5oZWlnaHQsXG4gICAgICBvZmZzZXQ6IHtcbiAgICAgICAgdG9wOiB3aW5ZLFxuICAgICAgICBsZWZ0OiB3aW5YXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBvYmplY3Qgb2YgdG9wIGFuZCBsZWZ0IGludGVnZXIgcGl4ZWwgdmFsdWVzIGZvciBkeW5hbWljYWxseSByZW5kZXJlZCBlbGVtZW50cyxcbiAqIHN1Y2ggYXM6IFRvb2x0aXAsIFJldmVhbCwgYW5kIERyb3Bkb3duXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcG9zaXRpb25lZC5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBhbmNob3IgLSBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZWxlbWVudCdzIGFuY2hvciBwb2ludC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIGEgc3RyaW5nIHJlbGF0aW5nIHRvIHRoZSBkZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50LCByZWxhdGl2ZSB0byBpdCdzIGFuY2hvclxuICogQHBhcmFtIHtOdW1iZXJ9IHZPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgdmVydGljYWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBoT2Zmc2V0IC0gaW50ZWdlciBwaXhlbCB2YWx1ZSBvZiBkZXNpcmVkIGhvcml6b250YWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNPdmVyZmxvdyAtIGlmIGEgY29sbGlzaW9uIGV2ZW50IGlzIGRldGVjdGVkLCBzZXRzIHRvIHRydWUgdG8gZGVmYXVsdCB0aGUgZWxlbWVudCB0byBmdWxsIHdpZHRoIC0gYW55IGRlc2lyZWQgb2Zmc2V0LlxuICogVE9ETyBhbHRlci9yZXdyaXRlIHRvIHdvcmsgd2l0aCBgZW1gIHZhbHVlcyBhcyB3ZWxsL2luc3RlYWQgb2YgcGl4ZWxzXG4gKi9cbmZ1bmN0aW9uIEdldE9mZnNldHMoZWxlbWVudCwgYW5jaG9yLCBwb3NpdGlvbiwgdk9mZnNldCwgaE9mZnNldCwgaXNPdmVyZmxvdykge1xuICB2YXIgJGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgJGFuY2hvckRpbXMgPSBhbmNob3IgPyBHZXREaW1lbnNpb25zKGFuY2hvcikgOiBudWxsO1xuXG4gIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICBjYXNlICd0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0LFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciB0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgKCRhbmNob3JEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMiksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiBpc092ZXJmbG93ID8gaE9mZnNldCA6ICgoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciBsZWZ0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogKCRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAoJGFuY2hvckRpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgcmlnaHQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgKyAxLFxuICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0ICsgKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcbiAgICAgICAgdG9wOiAoJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgKCRlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyZXZlYWwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLSAkZWxlRGltcy53aWR0aCkgLyAyLFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICBjYXNlICdyZXZlYWwgZnVsbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0LFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6IChGb3VuZGF0aW9uLnJ0bCgpID8gJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAkZWxlRGltcy53aWR0aCArICRhbmNob3JEaW1zLndpZHRoIDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XG4gICAgICB9XG4gIH1cbn1cblxufShqUXVlcnkpO1xuIiwiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBUaGlzIHV0aWwgd2FzIGNyZWF0ZWQgYnkgTWFyaXVzIE9sYmVydHogKlxuICogUGxlYXNlIHRoYW5rIE1hcml1cyBvbiBHaXRIdWIgL293bGJlcnR6ICpcbiAqIG9yIHRoZSB3ZWIgaHR0cDovL3d3dy5tYXJpdXNvbGJlcnR6LmRlLyAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5jb25zdCBrZXlDb2RlcyA9IHtcbiAgOTogJ1RBQicsXG4gIDEzOiAnRU5URVInLFxuICAyNzogJ0VTQ0FQRScsXG4gIDMyOiAnU1BBQ0UnLFxuICAzNzogJ0FSUk9XX0xFRlQnLFxuICAzODogJ0FSUk9XX1VQJyxcbiAgMzk6ICdBUlJPV19SSUdIVCcsXG4gIDQwOiAnQVJST1dfRE9XTidcbn1cblxudmFyIGNvbW1hbmRzID0ge31cblxudmFyIEtleWJvYXJkID0ge1xuICBrZXlzOiBnZXRLZXlDb2RlcyhrZXlDb2RlcyksXG5cbiAgLyoqXG4gICAqIFBhcnNlcyB0aGUgKGtleWJvYXJkKSBldmVudCBhbmQgcmV0dXJucyBhIFN0cmluZyB0aGF0IHJlcHJlc2VudHMgaXRzIGtleVxuICAgKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXG4gICAqIEByZXR1cm4gU3RyaW5nIGtleSAtIFN0cmluZyB0aGF0IHJlcHJlc2VudHMgdGhlIGtleSBwcmVzc2VkXG4gICAqL1xuICBwYXJzZUtleShldmVudCkge1xuICAgIHZhciBrZXkgPSBrZXlDb2Rlc1tldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlXSB8fCBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LndoaWNoKS50b1VwcGVyQ2FzZSgpO1xuICAgIGlmIChldmVudC5zaGlmdEtleSkga2V5ID0gYFNISUZUXyR7a2V5fWA7XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIGtleSA9IGBDVFJMXyR7a2V5fWA7XG4gICAgaWYgKGV2ZW50LmFsdEtleSkga2V5ID0gYEFMVF8ke2tleX1gO1xuICAgIHJldHVybiBrZXk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIGdpdmVuIChrZXlib2FyZCkgZXZlbnRcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCdzIG5hbWUsIGUuZy4gU2xpZGVyIG9yIFJldmVhbFxuICAgKiBAcGFyYW0ge09iamVjdHN9IGZ1bmN0aW9ucyAtIGNvbGxlY3Rpb24gb2YgZnVuY3Rpb25zIHRoYXQgYXJlIHRvIGJlIGV4ZWN1dGVkXG4gICAqL1xuICBoYW5kbGVLZXkoZXZlbnQsIGNvbXBvbmVudCwgZnVuY3Rpb25zKSB7XG4gICAgdmFyIGNvbW1hbmRMaXN0ID0gY29tbWFuZHNbY29tcG9uZW50XSxcbiAgICAgIGtleUNvZGUgPSB0aGlzLnBhcnNlS2V5KGV2ZW50KSxcbiAgICAgIGNtZHMsXG4gICAgICBjb21tYW5kLFxuICAgICAgZm47XG5cbiAgICBpZiAoIWNvbW1hbmRMaXN0KSByZXR1cm4gY29uc29sZS53YXJuKCdDb21wb25lbnQgbm90IGRlZmluZWQhJyk7XG5cbiAgICBpZiAodHlwZW9mIGNvbW1hbmRMaXN0Lmx0ciA9PT0gJ3VuZGVmaW5lZCcpIHsgLy8gdGhpcyBjb21wb25lbnQgZG9lcyBub3QgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGx0ciBhbmQgcnRsXG4gICAgICAgIGNtZHMgPSBjb21tYW5kTGlzdDsgLy8gdXNlIHBsYWluIGxpc3RcbiAgICB9IGVsc2UgeyAvLyBtZXJnZSBsdHIgYW5kIHJ0bDogaWYgZG9jdW1lbnQgaXMgcnRsLCBydGwgb3ZlcndyaXRlcyBsdHIgYW5kIHZpY2UgdmVyc2FcbiAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QubHRyLCBjb21tYW5kTGlzdC5ydGwpO1xuXG4gICAgICAgIGVsc2UgY21kcyA9ICQuZXh0ZW5kKHt9LCBjb21tYW5kTGlzdC5ydGwsIGNvbW1hbmRMaXN0Lmx0cik7XG4gICAgfVxuICAgIGNvbW1hbmQgPSBjbWRzW2tleUNvZGVdO1xuXG4gICAgZm4gPSBmdW5jdGlvbnNbY29tbWFuZF07XG4gICAgaWYgKGZuICYmIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uICBpZiBleGlzdHNcbiAgICAgIGZuLmFwcGx5KCk7XG4gICAgICBpZiAoZnVuY3Rpb25zLmhhbmRsZWQgfHwgdHlwZW9mIGZ1bmN0aW9ucy5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgaGFuZGxlZFxuICAgICAgICAgIGZ1bmN0aW9ucy5oYW5kbGVkLmFwcGx5KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChmdW5jdGlvbnMudW5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMudW5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgbm90IGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMudW5oYW5kbGVkLmFwcGx5KCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBGaW5kcyBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGhpbiB0aGUgZ2l2ZW4gYCRlbGVtZW50YFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHNlYXJjaCB3aXRoaW5cbiAgICogQHJldHVybiB7alF1ZXJ5fSAkZm9jdXNhYmxlIC0gYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gYCRlbGVtZW50YFxuICAgKi9cbiAgZmluZEZvY3VzYWJsZSgkZWxlbWVudCkge1xuICAgIHJldHVybiAkZWxlbWVudC5maW5kKCdhW2hyZWZdLCBhcmVhW2hyZWZdLCBpbnB1dDpub3QoW2Rpc2FibGVkXSksIHNlbGVjdDpub3QoW2Rpc2FibGVkXSksIHRleHRhcmVhOm5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKSwgaWZyYW1lLCBvYmplY3QsIGVtYmVkLCAqW3RhYmluZGV4XSwgKltjb250ZW50ZWRpdGFibGVdJykuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEkKHRoaXMpLmlzKCc6dmlzaWJsZScpIHx8ICQodGhpcykuYXR0cigndGFiaW5kZXgnKSA8IDApIHsgcmV0dXJuIGZhbHNlOyB9IC8vb25seSBoYXZlIHZpc2libGUgZWxlbWVudHMgYW5kIHRob3NlIHRoYXQgaGF2ZSBhIHRhYmluZGV4IGdyZWF0ZXIgb3IgZXF1YWwgMFxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBuYW1lIG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudCAtIEZvdW5kYXRpb24gY29tcG9uZW50LCBlLmcuIFNsaWRlciBvciBSZXZlYWxcbiAgICogQHJldHVybiBTdHJpbmcgY29tcG9uZW50TmFtZVxuICAgKi9cblxuICByZWdpc3Rlcihjb21wb25lbnROYW1lLCBjbWRzKSB7XG4gICAgY29tbWFuZHNbY29tcG9uZW50TmFtZV0gPSBjbWRzO1xuICB9XG59XG5cbi8qXG4gKiBDb25zdGFudHMgZm9yIGVhc2llciBjb21wYXJpbmcuXG4gKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAqL1xuZnVuY3Rpb24gZ2V0S2V5Q29kZXMoa2NzKSB7XG4gIHZhciBrID0ge307XG4gIGZvciAodmFyIGtjIGluIGtjcykga1trY3Nba2NdXSA9IGtjc1trY107XG4gIHJldHVybiBrO1xufVxuXG5Gb3VuZGF0aW9uLktleWJvYXJkID0gS2V5Ym9hcmQ7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLy8gRGVmYXVsdCBzZXQgb2YgbWVkaWEgcXVlcmllc1xuY29uc3QgZGVmYXVsdFF1ZXJpZXMgPSB7XG4gICdkZWZhdWx0JyA6ICdvbmx5IHNjcmVlbicsXG4gIGxhbmRzY2FwZSA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcbiAgcG9ydHJhaXQgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpJyxcbiAgcmV0aW5hIDogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcbn07XG5cbnZhciBNZWRpYVF1ZXJ5ID0ge1xuICBxdWVyaWVzOiBbXSxcblxuICBjdXJyZW50OiAnJyxcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG1lZGlhIHF1ZXJ5IGhlbHBlciwgYnkgZXh0cmFjdGluZyB0aGUgYnJlYWtwb2ludCBsaXN0IGZyb20gdGhlIENTUyBhbmQgYWN0aXZhdGluZyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZXh0cmFjdGVkU3R5bGVzID0gJCgnLmZvdW5kYXRpb24tbXEnKS5jc3MoJ2ZvbnQtZmFtaWx5Jyk7XG4gICAgdmFyIG5hbWVkUXVlcmllcztcblxuICAgIG5hbWVkUXVlcmllcyA9IHBhcnNlU3R5bGVUb09iamVjdChleHRyYWN0ZWRTdHlsZXMpO1xuXG4gICAgZm9yICh2YXIga2V5IGluIG5hbWVkUXVlcmllcykge1xuICAgICAgc2VsZi5xdWVyaWVzLnB1c2goe1xuICAgICAgICBuYW1lOiBrZXksXG4gICAgICAgIHZhbHVlOiBgb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6ICR7bmFtZWRRdWVyaWVzW2tleV19KWBcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuY3VycmVudCA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCk7XG5cbiAgICB0aGlzLl93YXRjaGVyKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIGlzIGF0IGxlYXN0IGFzIHdpZGUgYXMgYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBicmVha3BvaW50IG1hdGNoZXMsIGBmYWxzZWAgaWYgaXQncyBzbWFsbGVyLlxuICAgKi9cbiAgYXRMZWFzdChzaXplKSB7XG4gICAgdmFyIHF1ZXJ5ID0gdGhpcy5nZXQoc2l6ZSk7XG5cbiAgICBpZiAocXVlcnkpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubWF0Y2hNZWRpYShxdWVyeSkubWF0Y2hlcztcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1lZGlhIHF1ZXJ5IG9mIGEgYnJlYWtwb2ludC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBnZXQuXG4gICAqIEByZXR1cm5zIHtTdHJpbmd8bnVsbH0gLSBUaGUgbWVkaWEgcXVlcnkgb2YgdGhlIGJyZWFrcG9pbnQsIG9yIGBudWxsYCBpZiB0aGUgYnJlYWtwb2ludCBkb2Vzbid0IGV4aXN0LlxuICAgKi9cbiAgZ2V0KHNpemUpIHtcbiAgICBmb3IgKHZhciBpIGluIHRoaXMucXVlcmllcykge1xuICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW2ldO1xuICAgICAgaWYgKHNpemUgPT09IHF1ZXJ5Lm5hbWUpIHJldHVybiBxdWVyeS52YWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBicmVha3BvaW50IG5hbWUgYnkgdGVzdGluZyBldmVyeSBicmVha3BvaW50IGFuZCByZXR1cm5pbmcgdGhlIGxhc3Qgb25lIHRvIG1hdGNoICh0aGUgYmlnZ2VzdCBvbmUpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge1N0cmluZ30gTmFtZSBvZiB0aGUgY3VycmVudCBicmVha3BvaW50LlxuICAgKi9cbiAgX2dldEN1cnJlbnRTaXplKCkge1xuICAgIHZhciBtYXRjaGVkO1xuXG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLnF1ZXJpZXMpIHtcbiAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcblxuICAgICAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKHF1ZXJ5LnZhbHVlKS5tYXRjaGVzKSB7XG4gICAgICAgIG1hdGNoZWQgPSBxdWVyeTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1hdGNoZWQgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZC5uYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZDtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFjdGl2YXRlcyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLCB3aGljaCBmaXJlcyBhbiBldmVudCBvbiB0aGUgd2luZG93IHdoZW5ldmVyIHRoZSBicmVha3BvaW50IGNoYW5nZXMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3dhdGNoZXIoKSB7XG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuemYubWVkaWFxdWVyeScsICgpID0+IHtcbiAgICAgIHZhciBuZXdTaXplID0gdGhpcy5fZ2V0Q3VycmVudFNpemUoKTtcblxuICAgICAgaWYgKG5ld1NpemUgIT09IHRoaXMuY3VycmVudCkge1xuICAgICAgICAvLyBCcm9hZGNhc3QgdGhlIG1lZGlhIHF1ZXJ5IGNoYW5nZSBvbiB0aGUgd2luZG93XG4gICAgICAgICQod2luZG93KS50cmlnZ2VyKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBbbmV3U2l6ZSwgdGhpcy5jdXJyZW50XSk7XG5cbiAgICAgICAgLy8gQ2hhbmdlIHRoZSBjdXJyZW50IG1lZGlhIHF1ZXJ5XG4gICAgICAgIHRoaXMuY3VycmVudCA9IG5ld1NpemU7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG5cbkZvdW5kYXRpb24uTWVkaWFRdWVyeSA9IE1lZGlhUXVlcnk7XG5cbi8vIG1hdGNoTWVkaWEoKSBwb2x5ZmlsbCAtIFRlc3QgYSBDU1MgbWVkaWEgdHlwZS9xdWVyeSBpbiBKUy5cbi8vIEF1dGhvcnMgJiBjb3B5cmlnaHQgKGMpIDIwMTI6IFNjb3R0IEplaGwsIFBhdWwgSXJpc2gsIE5pY2hvbGFzIFpha2FzLCBEYXZpZCBLbmlnaHQuIER1YWwgTUlUL0JTRCBsaWNlbnNlXG53aW5kb3cubWF0Y2hNZWRpYSB8fCAod2luZG93Lm1hdGNoTWVkaWEgPSBmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEZvciBicm93c2VycyB0aGF0IHN1cHBvcnQgbWF0Y2hNZWRpdW0gYXBpIHN1Y2ggYXMgSUUgOSBhbmQgd2Via2l0XG4gIHZhciBzdHlsZU1lZGlhID0gKHdpbmRvdy5zdHlsZU1lZGlhIHx8IHdpbmRvdy5tZWRpYSk7XG5cbiAgLy8gRm9yIHRob3NlIHRoYXQgZG9uJ3Qgc3VwcG9ydCBtYXRjaE1lZGl1bVxuICBpZiAoIXN0eWxlTWVkaWEpIHtcbiAgICB2YXIgc3R5bGUgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyksXG4gICAgc2NyaXB0ICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF0sXG4gICAgaW5mbyAgICAgICAgPSBudWxsO1xuXG4gICAgc3R5bGUudHlwZSAgPSAndGV4dC9jc3MnO1xuICAgIHN0eWxlLmlkICAgID0gJ21hdGNobWVkaWFqcy10ZXN0JztcblxuICAgIHNjcmlwdC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzdHlsZSwgc2NyaXB0KTtcblxuICAgIC8vICdzdHlsZS5jdXJyZW50U3R5bGUnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3dpbmRvdy5nZXRDb21wdXRlZFN0eWxlJyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXG4gICAgaW5mbyA9ICgnZ2V0Q29tcHV0ZWRTdHlsZScgaW4gd2luZG93KSAmJiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShzdHlsZSwgbnVsbCkgfHwgc3R5bGUuY3VycmVudFN0eWxlO1xuXG4gICAgc3R5bGVNZWRpYSA9IHtcbiAgICAgIG1hdGNoTWVkaXVtKG1lZGlhKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gYEBtZWRpYSAke21lZGlhfXsgI21hdGNobWVkaWFqcy10ZXN0IHsgd2lkdGg6IDFweDsgfSB9YDtcblxuICAgICAgICAvLyAnc3R5bGUuc3R5bGVTaGVldCcgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnc3R5bGUudGV4dENvbnRlbnQnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSB0ZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRlc3QgaWYgbWVkaWEgcXVlcnkgaXMgdHJ1ZSBvciBmYWxzZVxuICAgICAgICByZXR1cm4gaW5mby53aWR0aCA9PT0gJzFweCc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKG1lZGlhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1hdGNoZXM6IHN0eWxlTWVkaWEubWF0Y2hNZWRpdW0obWVkaWEgfHwgJ2FsbCcpLFxuICAgICAgbWVkaWE6IG1lZGlhIHx8ICdhbGwnXG4gICAgfTtcbiAgfVxufSgpKTtcblxuLy8gVGhhbmsgeW91OiBodHRwczovL2dpdGh1Yi5jb20vc2luZHJlc29yaHVzL3F1ZXJ5LXN0cmluZ1xuZnVuY3Rpb24gcGFyc2VTdHlsZVRvT2JqZWN0KHN0cikge1xuICB2YXIgc3R5bGVPYmplY3QgPSB7fTtcblxuICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gc3R5bGVPYmplY3Q7XG4gIH1cblxuICBzdHIgPSBzdHIudHJpbSgpLnNsaWNlKDEsIC0xKTsgLy8gYnJvd3NlcnMgcmUtcXVvdGUgc3RyaW5nIHN0eWxlIHZhbHVlc1xuXG4gIGlmICghc3RyKSB7XG4gICAgcmV0dXJuIHN0eWxlT2JqZWN0O1xuICB9XG5cbiAgc3R5bGVPYmplY3QgPSBzdHIuc3BsaXQoJyYnKS5yZWR1Y2UoZnVuY3Rpb24ocmV0LCBwYXJhbSkge1xuICAgIHZhciBwYXJ0cyA9IHBhcmFtLnJlcGxhY2UoL1xcKy9nLCAnICcpLnNwbGl0KCc9Jyk7XG4gICAgdmFyIGtleSA9IHBhcnRzWzBdO1xuICAgIHZhciB2YWwgPSBwYXJ0c1sxXTtcbiAgICBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQoa2V5KTtcblxuICAgIC8vIG1pc3NpbmcgYD1gIHNob3VsZCBiZSBgbnVsbGA6XG4gICAgLy8gaHR0cDovL3czLm9yZy9UUi8yMDEyL1dELXVybC0yMDEyMDUyNC8jY29sbGVjdC11cmwtcGFyYW1ldGVyc1xuICAgIHZhbCA9IHZhbCA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGRlY29kZVVSSUNvbXBvbmVudCh2YWwpO1xuXG4gICAgaWYgKCFyZXQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgcmV0W2tleV0gPSB2YWw7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJldFtrZXldKSkge1xuICAgICAgcmV0W2tleV0ucHVzaCh2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRba2V5XSA9IFtyZXRba2V5XSwgdmFsXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfSwge30pO1xuXG4gIHJldHVybiBzdHlsZU9iamVjdDtcbn1cblxuRm91bmRhdGlvbi5NZWRpYVF1ZXJ5ID0gTWVkaWFRdWVyeTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIE1vdGlvbiBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ubW90aW9uXG4gKi9cblxuY29uc3QgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xuY29uc3QgYWN0aXZlQ2xhc3NlcyA9IFsnbXVpLWVudGVyLWFjdGl2ZScsICdtdWktbGVhdmUtYWN0aXZlJ107XG5cbmNvbnN0IE1vdGlvbiA9IHtcbiAgYW5pbWF0ZUluOiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZSh0cnVlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfSxcblxuICBhbmltYXRlT3V0OiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZShmYWxzZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH1cbn1cblxuZnVuY3Rpb24gTW92ZShkdXJhdGlvbiwgZWxlbSwgZm4pe1xuICB2YXIgYW5pbSwgcHJvZywgc3RhcnQgPSBudWxsO1xuICAvLyBjb25zb2xlLmxvZygnY2FsbGVkJyk7XG5cbiAgZnVuY3Rpb24gbW92ZSh0cyl7XG4gICAgaWYoIXN0YXJ0KSBzdGFydCA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAvLyBjb25zb2xlLmxvZyhzdGFydCwgdHMpO1xuICAgIHByb2cgPSB0cyAtIHN0YXJ0O1xuICAgIGZuLmFwcGx5KGVsZW0pO1xuXG4gICAgaWYocHJvZyA8IGR1cmF0aW9uKXsgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSwgZWxlbSk7IH1cbiAgICBlbHNle1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW0pO1xuICAgICAgZWxlbS50cmlnZ2VyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKS50cmlnZ2VySGFuZGxlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSk7XG4gICAgfVxuICB9XG4gIGFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1vdmUpO1xufVxuXG4vKipcbiAqIEFuaW1hdGVzIGFuIGVsZW1lbnQgaW4gb3Igb3V0IHVzaW5nIGEgQ1NTIHRyYW5zaXRpb24gY2xhc3MuXG4gKiBAZnVuY3Rpb25cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzSW4gLSBEZWZpbmVzIGlmIHRoZSBhbmltYXRpb24gaXMgaW4gb3Igb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb3IgSFRNTCBvYmplY3QgdG8gYW5pbWF0ZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBhbmltYXRpb24gLSBDU1MgY2xhc3MgdG8gdXNlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBDYWxsYmFjayB0byBydW4gd2hlbiBhbmltYXRpb24gaXMgZmluaXNoZWQuXG4gKi9cbmZ1bmN0aW9uIGFuaW1hdGUoaXNJbiwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICBlbGVtZW50ID0gJChlbGVtZW50KS5lcSgwKTtcblxuICBpZiAoIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XG5cbiAgdmFyIGluaXRDbGFzcyA9IGlzSW4gPyBpbml0Q2xhc3Nlc1swXSA6IGluaXRDbGFzc2VzWzFdO1xuICB2YXIgYWN0aXZlQ2xhc3MgPSBpc0luID8gYWN0aXZlQ2xhc3Nlc1swXSA6IGFjdGl2ZUNsYXNzZXNbMV07XG5cbiAgLy8gU2V0IHVwIHRoZSBhbmltYXRpb25cbiAgcmVzZXQoKTtcblxuICBlbGVtZW50XG4gICAgLmFkZENsYXNzKGFuaW1hdGlvbilcbiAgICAuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGVsZW1lbnQuYWRkQ2xhc3MoaW5pdENsYXNzKTtcbiAgICBpZiAoaXNJbikgZWxlbWVudC5zaG93KCk7XG4gIH0pO1xuXG4gIC8vIFN0YXJ0IHRoZSBhbmltYXRpb25cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICBlbGVtZW50WzBdLm9mZnNldFdpZHRoO1xuICAgIGVsZW1lbnRcbiAgICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnJylcbiAgICAgIC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XG4gIH0pO1xuXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xuICBlbGVtZW50Lm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoZWxlbWVudCksIGZpbmlzaCk7XG5cbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xuICBmdW5jdGlvbiBmaW5pc2goKSB7XG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcbiAgICByZXNldCgpO1xuICAgIGlmIChjYikgY2IuYXBwbHkoZWxlbWVudCk7XG4gIH1cblxuICAvLyBSZXNldHMgdHJhbnNpdGlvbnMgYW5kIHJlbW92ZXMgbW90aW9uLXNwZWNpZmljIGNsYXNzZXNcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoYCR7aW5pdENsYXNzfSAke2FjdGl2ZUNsYXNzfSAke2FuaW1hdGlvbn1gKTtcbiAgfVxufVxuXG5Gb3VuZGF0aW9uLk1vdmUgPSBNb3ZlO1xuRm91bmRhdGlvbi5Nb3Rpb24gPSBNb3Rpb247XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3QgTmVzdCA9IHtcbiAgRmVhdGhlcihtZW51LCB0eXBlID0gJ3pmJykge1xuICAgIG1lbnUuYXR0cigncm9sZScsICdtZW51YmFyJyk7XG5cbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykuYXR0cih7J3JvbGUnOiAnbWVudWl0ZW0nfSksXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxuICAgICAgICBzdWJJdGVtQ2xhc3MgPSBgJHtzdWJNZW51Q2xhc3N9LWl0ZW1gLFxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YDtcblxuICAgIG1lbnUuZmluZCgnYTpmaXJzdCcpLmF0dHIoJ3RhYmluZGV4JywgMCk7XG5cbiAgICBpdGVtcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRpdGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAkc3ViID0gJGl0ZW0uY2hpbGRyZW4oJ3VsJyk7XG5cbiAgICAgIGlmICgkc3ViLmxlbmd0aCkge1xuICAgICAgICAkaXRlbVxuICAgICAgICAgIC5hZGRDbGFzcyhoYXNTdWJDbGFzcylcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXG4gICAgICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAgICAgICAgJ2FyaWEtbGFiZWwnOiAkaXRlbS5jaGlsZHJlbignYTpmaXJzdCcpLnRleHQoKVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICRzdWJcbiAgICAgICAgICAuYWRkQ2xhc3MoYHN1Ym1lbnUgJHtzdWJNZW51Q2xhc3N9YClcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnZGF0YS1zdWJtZW51JzogJycsXG4gICAgICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxuICAgICAgICAgICAgJ3JvbGUnOiAnbWVudSdcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCRpdGVtLnBhcmVudCgnW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpIHtcbiAgICAgICAgJGl0ZW0uYWRkQ2xhc3MoYGlzLXN1Ym1lbnUtaXRlbSAke3N1Ykl0ZW1DbGFzc31gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybjtcbiAgfSxcblxuICBCdXJuKG1lbnUsIHR5cGUpIHtcbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykucmVtb3ZlQXR0cigndGFiaW5kZXgnKSxcbiAgICAgICAgc3ViTWVudUNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudWAsXG4gICAgICAgIHN1Ykl0ZW1DbGFzcyA9IGAke3N1Yk1lbnVDbGFzc30taXRlbWAsXG4gICAgICAgIGhhc1N1YkNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudS1wYXJlbnRgO1xuXG4gICAgbWVudVxuICAgICAgLmZpbmQoJyonKVxuICAgICAgLnJlbW92ZUNsYXNzKGAke3N1Yk1lbnVDbGFzc30gJHtzdWJJdGVtQ2xhc3N9ICR7aGFzU3ViQ2xhc3N9IGlzLXN1Ym1lbnUtaXRlbSBzdWJtZW51IGlzLWFjdGl2ZWApXG4gICAgICAucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51JykuY3NzKCdkaXNwbGF5JywgJycpO1xuXG4gICAgLy8gY29uc29sZS5sb2coICAgICAgbWVudS5maW5kKCcuJyArIHN1Yk1lbnVDbGFzcyArICcsIC4nICsgc3ViSXRlbUNsYXNzICsgJywgLmhhcy1zdWJtZW51LCAuaXMtc3VibWVudS1pdGVtLCAuc3VibWVudSwgW2RhdGEtc3VibWVudV0nKVxuICAgIC8vICAgICAgICAgICAucmVtb3ZlQ2xhc3Moc3ViTWVudUNsYXNzICsgJyAnICsgc3ViSXRlbUNsYXNzICsgJyBoYXMtc3VibWVudSBpcy1zdWJtZW51LWl0ZW0gc3VibWVudScpXG4gICAgLy8gICAgICAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKSk7XG4gICAgLy8gaXRlbXMuZWFjaChmdW5jdGlvbigpe1xuICAgIC8vICAgdmFyICRpdGVtID0gJCh0aGlzKSxcbiAgICAvLyAgICAgICAkc3ViID0gJGl0ZW0uY2hpbGRyZW4oJ3VsJyk7XG4gICAgLy8gICBpZigkaXRlbS5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKXtcbiAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLXN1Ym1lbnUtaXRlbSAnICsgc3ViSXRlbUNsYXNzKTtcbiAgICAvLyAgIH1cbiAgICAvLyAgIGlmKCRzdWIubGVuZ3RoKXtcbiAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2hhcy1zdWJtZW51Jyk7XG4gICAgLy8gICAgICRzdWIucmVtb3ZlQ2xhc3MoJ3N1Ym1lbnUgJyArIHN1Yk1lbnVDbGFzcykucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51Jyk7XG4gICAgLy8gICB9XG4gICAgLy8gfSk7XG4gIH1cbn1cblxuRm91bmRhdGlvbi5OZXN0ID0gTmVzdDtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5mdW5jdGlvbiBUaW1lcihlbGVtLCBvcHRpb25zLCBjYikge1xuICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgZHVyYXRpb24gPSBvcHRpb25zLmR1cmF0aW9uLC8vb3B0aW9ucyBpcyBhbiBvYmplY3QgZm9yIGVhc2lseSBhZGRpbmcgZmVhdHVyZXMgbGF0ZXIuXG4gICAgICBuYW1lU3BhY2UgPSBPYmplY3Qua2V5cyhlbGVtLmRhdGEoKSlbMF0gfHwgJ3RpbWVyJyxcbiAgICAgIHJlbWFpbiA9IC0xLFxuICAgICAgc3RhcnQsXG4gICAgICB0aW1lcjtcblxuICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XG5cbiAgdGhpcy5yZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmVtYWluID0gLTE7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB0aGlzLnN0YXJ0KCk7XG4gIH1cblxuICB0aGlzLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuICAgIC8vIGlmKCFlbGVtLmRhdGEoJ3BhdXNlZCcpKXsgcmV0dXJuIGZhbHNlOyB9Ly9tYXliZSBpbXBsZW1lbnQgdGhpcyBzYW5pdHkgY2hlY2sgaWYgdXNlZCBmb3Igb3RoZXIgdGhpbmdzLlxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgcmVtYWluID0gcmVtYWluIDw9IDAgPyBkdXJhdGlvbiA6IHJlbWFpbjtcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIGZhbHNlKTtcbiAgICBzdGFydCA9IERhdGUubm93KCk7XG4gICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBpZihvcHRpb25zLmluZmluaXRlKXtcbiAgICAgICAgX3RoaXMucmVzdGFydCgpOy8vcmVydW4gdGhlIHRpbWVyLlxuICAgICAgfVxuICAgICAgY2IoKTtcbiAgICB9LCByZW1haW4pO1xuICAgIGVsZW0udHJpZ2dlcihgdGltZXJzdGFydC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxuXG4gIHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgICAvL2lmKGVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIHRydWUpO1xuICAgIHZhciBlbmQgPSBEYXRlLm5vdygpO1xuICAgIHJlbWFpbiA9IHJlbWFpbiAtIChlbmQgLSBzdGFydCk7XG4gICAgZWxlbS50cmlnZ2VyKGB0aW1lcnBhdXNlZC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgYSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGltYWdlcyBhcmUgZnVsbHkgbG9hZGVkLlxuICogQHBhcmFtIHtPYmplY3R9IGltYWdlcyAtIEltYWdlKHMpIHRvIGNoZWNrIGlmIGxvYWRlZC5cbiAqIEBwYXJhbSB7RnVuY30gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gaW1hZ2UgaXMgZnVsbHkgbG9hZGVkLlxuICovXG5mdW5jdGlvbiBvbkltYWdlc0xvYWRlZChpbWFnZXMsIGNhbGxiYWNrKXtcbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgdW5sb2FkZWQgPSBpbWFnZXMubGVuZ3RoO1xuXG4gIGlmICh1bmxvYWRlZCA9PT0gMCkge1xuICAgIGNhbGxiYWNrKCk7XG4gIH1cblxuICBpbWFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb21wbGV0ZSkge1xuICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHRoaXMubmF0dXJhbFdpZHRoICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLm5hdHVyYWxXaWR0aCA+IDApIHtcbiAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCh0aGlzKS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2luZ2xlSW1hZ2VMb2FkZWQoKSB7XG4gICAgdW5sb2FkZWQtLTtcbiAgICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59XG5cbkZvdW5kYXRpb24uVGltZXIgPSBUaW1lcjtcbkZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQgPSBvbkltYWdlc0xvYWRlZDtcblxufShqUXVlcnkpO1xuIiwiLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKldvcmsgaW5zcGlyZWQgYnkgbXVsdGlwbGUganF1ZXJ5IHN3aXBlIHBsdWdpbnMqKlxuLy8qKkRvbmUgYnkgWW9oYWkgQXJhcmF0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuKGZ1bmN0aW9uKCQpIHtcblxuICAkLnNwb3RTd2lwZSA9IHtcbiAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgIGVuYWJsZWQ6ICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2UsXG4gICAgbW92ZVRocmVzaG9sZDogNzUsXG4gICAgdGltZVRocmVzaG9sZDogMjAwXG4gIH07XG5cbiAgdmFyICAgc3RhcnRQb3NYLFxuICAgICAgICBzdGFydFBvc1ksXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZWxhcHNlZFRpbWUsXG4gICAgICAgIGlzTW92aW5nID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gb25Ub3VjaEVuZCgpIHtcbiAgICAvLyAgYWxlcnQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQpO1xuICAgIGlzTW92aW5nID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBvblRvdWNoTW92ZShlKSB7XG4gICAgaWYgKCQuc3BvdFN3aXBlLnByZXZlbnREZWZhdWx0KSB7IGUucHJldmVudERlZmF1bHQoKTsgfVxuICAgIGlmKGlzTW92aW5nKSB7XG4gICAgICB2YXIgeCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgIHZhciB5ID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgdmFyIGR4ID0gc3RhcnRQb3NYIC0geDtcbiAgICAgIHZhciBkeSA9IHN0YXJ0UG9zWSAtIHk7XG4gICAgICB2YXIgZGlyO1xuICAgICAgZWxhcHNlZFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZTtcbiAgICAgIGlmKE1hdGguYWJzKGR4KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcbiAgICAgICAgZGlyID0gZHggPiAwID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICAgIH1cbiAgICAgIC8vIGVsc2UgaWYoTWF0aC5hYnMoZHkpID49ICQuc3BvdFN3aXBlLm1vdmVUaHJlc2hvbGQgJiYgZWxhcHNlZFRpbWUgPD0gJC5zcG90U3dpcGUudGltZVRocmVzaG9sZCkge1xuICAgICAgLy8gICBkaXIgPSBkeSA+IDAgPyAnZG93bicgOiAndXAnO1xuICAgICAgLy8gfVxuICAgICAgaWYoZGlyKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgb25Ub3VjaEVuZC5jYWxsKHRoaXMpO1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ3N3aXBlJywgZGlyKS50cmlnZ2VyKGBzd2lwZSR7ZGlyfWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgc3RhcnRQb3NYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgc3RhcnRQb3NZID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgaXNNb3ZpbmcgPSB0cnVlO1xuICAgICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyICYmIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0KTtcbiAgfVxuXG4gICQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHsgc2V0dXA6IGluaXQgfTtcblxuICAkLmVhY2goWydsZWZ0JywgJ3VwJywgJ2Rvd24nLCAncmlnaHQnXSwgZnVuY3Rpb24gKCkge1xuICAgICQuZXZlbnQuc3BlY2lhbFtgc3dpcGUke3RoaXN9YF0gPSB7IHNldHVwOiBmdW5jdGlvbigpe1xuICAgICAgJCh0aGlzKS5vbignc3dpcGUnLCAkLm5vb3ApO1xuICAgIH0gfTtcbiAgfSk7XG59KShqUXVlcnkpO1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1ldGhvZCBmb3IgYWRkaW5nIHBzdWVkbyBkcmFnIGV2ZW50cyB0byBlbGVtZW50cyAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuIWZ1bmN0aW9uKCQpe1xuICAkLmZuLmFkZFRvdWNoID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSxlbCl7XG4gICAgICAkKGVsKS5iaW5kKCd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCcsZnVuY3Rpb24oKXtcbiAgICAgICAgLy93ZSBwYXNzIHRoZSBvcmlnaW5hbCBldmVudCBvYmplY3QgYmVjYXVzZSB0aGUgalF1ZXJ5IGV2ZW50XG4gICAgICAgIC8vb2JqZWN0IGlzIG5vcm1hbGl6ZWQgdG8gdzNjIHNwZWNzIGFuZCBkb2VzIG5vdCBwcm92aWRlIHRoZSBUb3VjaExpc3RcbiAgICAgICAgaGFuZGxlVG91Y2goZXZlbnQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFuZGxlVG91Y2ggPSBmdW5jdGlvbihldmVudCl7XG4gICAgICB2YXIgdG91Y2hlcyA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzLFxuICAgICAgICAgIGZpcnN0ID0gdG91Y2hlc1swXSxcbiAgICAgICAgICBldmVudFR5cGVzID0ge1xuICAgICAgICAgICAgdG91Y2hzdGFydDogJ21vdXNlZG93bicsXG4gICAgICAgICAgICB0b3VjaG1vdmU6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgdG91Y2hlbmQ6ICdtb3VzZXVwJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHlwZSA9IGV2ZW50VHlwZXNbZXZlbnQudHlwZV0sXG4gICAgICAgICAgc2ltdWxhdGVkRXZlbnRcbiAgICAgICAgO1xuXG4gICAgICBpZignTW91c2VFdmVudCcgaW4gd2luZG93ICYmIHR5cGVvZiB3aW5kb3cuTW91c2VFdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IHdpbmRvdy5Nb3VzZUV2ZW50KHR5cGUsIHtcbiAgICAgICAgICAnYnViYmxlcyc6IHRydWUsXG4gICAgICAgICAgJ2NhbmNlbGFibGUnOiB0cnVlLFxuICAgICAgICAgICdzY3JlZW5YJzogZmlyc3Quc2NyZWVuWCxcbiAgICAgICAgICAnc2NyZWVuWSc6IGZpcnN0LnNjcmVlblksXG4gICAgICAgICAgJ2NsaWVudFgnOiBmaXJzdC5jbGllbnRYLFxuICAgICAgICAgICdjbGllbnRZJzogZmlyc3QuY2xpZW50WVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbXVsYXRlZEV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ01vdXNlRXZlbnQnKTtcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQuaW5pdE1vdXNlRXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSwgd2luZG93LCAxLCBmaXJzdC5zY3JlZW5YLCBmaXJzdC5zY3JlZW5ZLCBmaXJzdC5jbGllbnRYLCBmaXJzdC5jbGllbnRZLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgMC8qbGVmdCovLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIGZpcnN0LnRhcmdldC5kaXNwYXRjaEV2ZW50KHNpbXVsYXRlZEV2ZW50KTtcbiAgICB9O1xuICB9O1xufShqUXVlcnkpO1xuXG5cbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKkZyb20gdGhlIGpRdWVyeSBNb2JpbGUgTGlicmFyeSoqXG4vLyoqbmVlZCB0byByZWNyZWF0ZSBmdW5jdGlvbmFsaXR5Kipcbi8vKiphbmQgdHJ5IHRvIGltcHJvdmUgaWYgcG9zc2libGUqKlxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cbi8qIFJlbW92aW5nIHRoZSBqUXVlcnkgZnVuY3Rpb24gKioqKlxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cbihmdW5jdGlvbiggJCwgd2luZG93LCB1bmRlZmluZWQgKSB7XG5cblx0dmFyICRkb2N1bWVudCA9ICQoIGRvY3VtZW50ICksXG5cdFx0Ly8gc3VwcG9ydFRvdWNoID0gJC5tb2JpbGUuc3VwcG9ydC50b3VjaCxcblx0XHR0b3VjaFN0YXJ0RXZlbnQgPSAndG91Y2hzdGFydCcvL3N1cHBvcnRUb3VjaCA/IFwidG91Y2hzdGFydFwiIDogXCJtb3VzZWRvd25cIixcblx0XHR0b3VjaFN0b3BFdmVudCA9ICd0b3VjaGVuZCcvL3N1cHBvcnRUb3VjaCA/IFwidG91Y2hlbmRcIiA6IFwibW91c2V1cFwiLFxuXHRcdHRvdWNoTW92ZUV2ZW50ID0gJ3RvdWNobW92ZScvL3N1cHBvcnRUb3VjaCA/IFwidG91Y2htb3ZlXCIgOiBcIm1vdXNlbW92ZVwiO1xuXG5cdC8vIHNldHVwIG5ldyBldmVudCBzaG9ydGN1dHNcblx0JC5lYWNoKCAoIFwidG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgXCIgK1xuXHRcdFwic3dpcGUgc3dpcGVsZWZ0IHN3aXBlcmlnaHRcIiApLnNwbGl0KCBcIiBcIiApLCBmdW5jdGlvbiggaSwgbmFtZSApIHtcblxuXHRcdCQuZm5bIG5hbWUgXSA9IGZ1bmN0aW9uKCBmbiApIHtcblx0XHRcdHJldHVybiBmbiA/IHRoaXMuYmluZCggbmFtZSwgZm4gKSA6IHRoaXMudHJpZ2dlciggbmFtZSApO1xuXHRcdH07XG5cblx0XHQvLyBqUXVlcnkgPCAxLjhcblx0XHRpZiAoICQuYXR0ckZuICkge1xuXHRcdFx0JC5hdHRyRm5bIG5hbWUgXSA9IHRydWU7XG5cdFx0fVxuXHR9KTtcblxuXHRmdW5jdGlvbiB0cmlnZ2VyQ3VzdG9tRXZlbnQoIG9iaiwgZXZlbnRUeXBlLCBldmVudCwgYnViYmxlICkge1xuXHRcdHZhciBvcmlnaW5hbFR5cGUgPSBldmVudC50eXBlO1xuXHRcdGV2ZW50LnR5cGUgPSBldmVudFR5cGU7XG5cdFx0aWYgKCBidWJibGUgKSB7XG5cdFx0XHQkLmV2ZW50LnRyaWdnZXIoIGV2ZW50LCB1bmRlZmluZWQsIG9iaiApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkLmV2ZW50LmRpc3BhdGNoLmNhbGwoIG9iaiwgZXZlbnQgKTtcblx0XHR9XG5cdFx0ZXZlbnQudHlwZSA9IG9yaWdpbmFsVHlwZTtcblx0fVxuXG5cdC8vIGFsc28gaGFuZGxlcyB0YXBob2xkXG5cblx0Ly8gQWxzbyBoYW5kbGVzIHN3aXBlbGVmdCwgc3dpcGVyaWdodFxuXHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUgPSB7XG5cblx0XHQvLyBNb3JlIHRoYW4gdGhpcyBob3Jpem9udGFsIGRpc3BsYWNlbWVudCwgYW5kIHdlIHdpbGwgc3VwcHJlc3Mgc2Nyb2xsaW5nLlxuXHRcdHNjcm9sbFN1cHJlc3Npb25UaHJlc2hvbGQ6IDMwLFxuXG5cdFx0Ly8gTW9yZSB0aW1lIHRoYW4gdGhpcywgYW5kIGl0IGlzbid0IGEgc3dpcGUuXG5cdFx0ZHVyYXRpb25UaHJlc2hvbGQ6IDEwMDAsXG5cblx0XHQvLyBTd2lwZSBob3Jpem9udGFsIGRpc3BsYWNlbWVudCBtdXN0IGJlIG1vcmUgdGhhbiB0aGlzLlxuXHRcdGhvcml6b250YWxEaXN0YW5jZVRocmVzaG9sZDogd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMiA/IDE1IDogMzAsXG5cblx0XHQvLyBTd2lwZSB2ZXJ0aWNhbCBkaXNwbGFjZW1lbnQgbXVzdCBiZSBsZXNzIHRoYW4gdGhpcy5cblx0XHR2ZXJ0aWNhbERpc3RhbmNlVGhyZXNob2xkOiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA+PSAyID8gMTUgOiAzMCxcblxuXHRcdGdldExvY2F0aW9uOiBmdW5jdGlvbiAoIGV2ZW50ICkge1xuXHRcdFx0dmFyIHdpblBhZ2VYID0gd2luZG93LnBhZ2VYT2Zmc2V0LFxuXHRcdFx0XHR3aW5QYWdlWSA9IHdpbmRvdy5wYWdlWU9mZnNldCxcblx0XHRcdFx0eCA9IGV2ZW50LmNsaWVudFgsXG5cdFx0XHRcdHkgPSBldmVudC5jbGllbnRZO1xuXG5cdFx0XHRpZiAoIGV2ZW50LnBhZ2VZID09PSAwICYmIE1hdGguZmxvb3IoIHkgKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VZICkgfHxcblx0XHRcdFx0ZXZlbnQucGFnZVggPT09IDAgJiYgTWF0aC5mbG9vciggeCApID4gTWF0aC5mbG9vciggZXZlbnQucGFnZVggKSApIHtcblxuXHRcdFx0XHQvLyBpT1M0IGNsaWVudFgvY2xpZW50WSBoYXZlIHRoZSB2YWx1ZSB0aGF0IHNob3VsZCBoYXZlIGJlZW5cblx0XHRcdFx0Ly8gaW4gcGFnZVgvcGFnZVkuIFdoaWxlIHBhZ2VYL3BhZ2UvIGhhdmUgdGhlIHZhbHVlIDBcblx0XHRcdFx0eCA9IHggLSB3aW5QYWdlWDtcblx0XHRcdFx0eSA9IHkgLSB3aW5QYWdlWTtcblx0XHRcdH0gZWxzZSBpZiAoIHkgPCAoIGV2ZW50LnBhZ2VZIC0gd2luUGFnZVkpIHx8IHggPCAoIGV2ZW50LnBhZ2VYIC0gd2luUGFnZVggKSApIHtcblxuXHRcdFx0XHQvLyBTb21lIEFuZHJvaWQgYnJvd3NlcnMgaGF2ZSB0b3RhbGx5IGJvZ3VzIHZhbHVlcyBmb3IgY2xpZW50WC9ZXG5cdFx0XHRcdC8vIHdoZW4gc2Nyb2xsaW5nL3pvb21pbmcgYSBwYWdlLiBEZXRlY3RhYmxlIHNpbmNlIGNsaWVudFgvY2xpZW50WVxuXHRcdFx0XHQvLyBzaG91bGQgbmV2ZXIgYmUgc21hbGxlciB0aGFuIHBhZ2VYL3BhZ2VZIG1pbnVzIHBhZ2Ugc2Nyb2xsXG5cdFx0XHRcdHggPSBldmVudC5wYWdlWCAtIHdpblBhZ2VYO1xuXHRcdFx0XHR5ID0gZXZlbnQucGFnZVkgLSB3aW5QYWdlWTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0eDogeCxcblx0XHRcdFx0eTogeVxuXHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0c3RhcnQ6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbIDAgXSA6IGV2ZW50LFxuXHRcdFx0XHRsb2NhdGlvbiA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5nZXRMb2NhdGlvbiggZGF0YSApO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHRpbWU6ICggbmV3IERhdGUoKSApLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdGNvb3JkczogWyBsb2NhdGlvbi54LCBsb2NhdGlvbi55IF0sXG5cdFx0XHRcdFx0XHRvcmlnaW46ICQoIGV2ZW50LnRhcmdldCApXG5cdFx0XHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0c3RvcDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0dmFyIGRhdGEgPSBldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXMgP1xuXHRcdFx0XHRcdGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlc1sgMCBdIDogZXZlbnQsXG5cdFx0XHRcdGxvY2F0aW9uID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmdldExvY2F0aW9uKCBkYXRhICk7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0dGltZTogKCBuZXcgRGF0ZSgpICkuZ2V0VGltZSgpLFxuXHRcdFx0XHRcdFx0Y29vcmRzOiBbIGxvY2F0aW9uLngsIGxvY2F0aW9uLnkgXVxuXHRcdFx0XHRcdH07XG5cdFx0fSxcblxuXHRcdGhhbmRsZVN3aXBlOiBmdW5jdGlvbiggc3RhcnQsIHN0b3AsIHRoaXNPYmplY3QsIG9yaWdUYXJnZXQgKSB7XG5cdFx0XHRpZiAoIHN0b3AudGltZSAtIHN0YXJ0LnRpbWUgPCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZHVyYXRpb25UaHJlc2hvbGQgJiZcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMCBdIC0gc3RvcC5jb29yZHNbIDAgXSApID4gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmhvcml6b250YWxEaXN0YW5jZVRocmVzaG9sZCAmJlxuXHRcdFx0XHRNYXRoLmFicyggc3RhcnQuY29vcmRzWyAxIF0gLSBzdG9wLmNvb3Jkc1sgMSBdICkgPCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUudmVydGljYWxEaXN0YW5jZVRocmVzaG9sZCApIHtcblx0XHRcdFx0dmFyIGRpcmVjdGlvbiA9IHN0YXJ0LmNvb3Jkc1swXSA+IHN0b3AuY29vcmRzWyAwIF0gPyBcInN3aXBlbGVmdFwiIDogXCJzd2lwZXJpZ2h0XCI7XG5cblx0XHRcdFx0dHJpZ2dlckN1c3RvbUV2ZW50KCB0aGlzT2JqZWN0LCBcInN3aXBlXCIsICQuRXZlbnQoIFwic3dpcGVcIiwgeyB0YXJnZXQ6IG9yaWdUYXJnZXQsIHN3aXBlc3RhcnQ6IHN0YXJ0LCBzd2lwZXN0b3A6IHN0b3AgfSksIHRydWUgKTtcblx0XHRcdFx0dHJpZ2dlckN1c3RvbUV2ZW50KCB0aGlzT2JqZWN0LCBkaXJlY3Rpb24sJC5FdmVudCggZGlyZWN0aW9uLCB7IHRhcmdldDogb3JpZ1RhcmdldCwgc3dpcGVzdGFydDogc3RhcnQsIHN3aXBlc3RvcDogc3RvcCB9ICksIHRydWUgKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cblx0XHR9LFxuXG5cdFx0Ly8gVGhpcyBzZXJ2ZXMgYXMgYSBmbGFnIHRvIGVuc3VyZSB0aGF0IGF0IG1vc3Qgb25lIHN3aXBlIGV2ZW50IGV2ZW50IGlzXG5cdFx0Ly8gaW4gd29yayBhdCBhbnkgZ2l2ZW4gdGltZVxuXHRcdGV2ZW50SW5Qcm9ncmVzczogZmFsc2UsXG5cblx0XHRzZXR1cDogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZXZlbnRzLFxuXHRcdFx0XHR0aGlzT2JqZWN0ID0gdGhpcyxcblx0XHRcdFx0JHRoaXMgPSAkKCB0aGlzT2JqZWN0ICksXG5cdFx0XHRcdGNvbnRleHQgPSB7fTtcblxuXHRcdFx0Ly8gUmV0cmlldmUgdGhlIGV2ZW50cyBkYXRhIGZvciB0aGlzIGVsZW1lbnQgYW5kIGFkZCB0aGUgc3dpcGUgY29udGV4dFxuXHRcdFx0ZXZlbnRzID0gJC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiApO1xuXHRcdFx0aWYgKCAhZXZlbnRzICkge1xuXHRcdFx0XHRldmVudHMgPSB7IGxlbmd0aDogMCB9O1xuXHRcdFx0XHQkLmRhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiLCBldmVudHMgKTtcblx0XHRcdH1cblx0XHRcdGV2ZW50cy5sZW5ndGgrKztcblx0XHRcdGV2ZW50cy5zd2lwZSA9IGNvbnRleHQ7XG5cblx0XHRcdGNvbnRleHQuc3RhcnQgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cblx0XHRcdFx0Ly8gQmFpbCBpZiB3ZSdyZSBhbHJlYWR5IHdvcmtpbmcgb24gYSBzd2lwZSBldmVudFxuXHRcdFx0XHRpZiAoICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ldmVudEluUHJvZ3Jlc3MgKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ldmVudEluUHJvZ3Jlc3MgPSB0cnVlO1xuXG5cdFx0XHRcdHZhciBzdG9wLFxuXHRcdFx0XHRcdHN0YXJ0ID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLnN0YXJ0KCBldmVudCApLFxuXHRcdFx0XHRcdG9yaWdUYXJnZXQgPSBldmVudC50YXJnZXQsXG5cdFx0XHRcdFx0ZW1pdHRlZCA9IGZhbHNlO1xuXG5cdFx0XHRcdGNvbnRleHQubW92ZSA9IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdFx0XHRpZiAoICFzdGFydCB8fCBldmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSApIHtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRzdG9wID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLnN0b3AoIGV2ZW50ICk7XG5cdFx0XHRcdFx0aWYgKCAhZW1pdHRlZCApIHtcblx0XHRcdFx0XHRcdGVtaXR0ZWQgPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuaGFuZGxlU3dpcGUoIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICk7XG5cdFx0XHRcdFx0XHRpZiAoIGVtaXR0ZWQgKSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gUmVzZXQgdGhlIGNvbnRleHQgdG8gbWFrZSB3YXkgZm9yIHRoZSBuZXh0IHN3aXBlIGV2ZW50XG5cdFx0XHRcdFx0XHRcdCQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ldmVudEluUHJvZ3Jlc3MgPSBmYWxzZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gcHJldmVudCBzY3JvbGxpbmdcblx0XHRcdFx0XHRpZiAoIE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDAgXSAtIHN0b3AuY29vcmRzWyAwIF0gKSA+ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkICkge1xuXHRcdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Y29udGV4dC5zdG9wID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRlbWl0dGVkID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0Ly8gUmVzZXQgdGhlIGNvbnRleHQgdG8gbWFrZSB3YXkgZm9yIHRoZSBuZXh0IHN3aXBlIGV2ZW50XG5cdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHQkZG9jdW1lbnQub2ZmKCB0b3VjaE1vdmVFdmVudCwgY29udGV4dC5tb3ZlICk7XG5cdFx0XHRcdFx0XHRjb250ZXh0Lm1vdmUgPSBudWxsO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRkb2N1bWVudC5vbiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApXG5cdFx0XHRcdFx0Lm9uZSggdG91Y2hTdG9wRXZlbnQsIGNvbnRleHQuc3RvcCApO1xuXHRcdFx0fTtcblx0XHRcdCR0aGlzLm9uKCB0b3VjaFN0YXJ0RXZlbnQsIGNvbnRleHQuc3RhcnQgKTtcblx0XHR9LFxuXG5cdFx0dGVhcmRvd246IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGV2ZW50cywgY29udGV4dDtcblxuXHRcdFx0ZXZlbnRzID0gJC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiApO1xuXHRcdFx0aWYgKCBldmVudHMgKSB7XG5cdFx0XHRcdGNvbnRleHQgPSBldmVudHMuc3dpcGU7XG5cdFx0XHRcdGRlbGV0ZSBldmVudHMuc3dpcGU7XG5cdFx0XHRcdGV2ZW50cy5sZW5ndGgtLTtcblx0XHRcdFx0aWYgKCBldmVudHMubGVuZ3RoID09PSAwICkge1xuXHRcdFx0XHRcdCQucmVtb3ZlRGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIGNvbnRleHQgKSB7XG5cdFx0XHRcdGlmICggY29udGV4dC5zdGFydCApIHtcblx0XHRcdFx0XHQkKCB0aGlzICkub2ZmKCB0b3VjaFN0YXJ0RXZlbnQsIGNvbnRleHQuc3RhcnQgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIGNvbnRleHQubW92ZSApIHtcblx0XHRcdFx0XHQkZG9jdW1lbnQub2ZmKCB0b3VjaE1vdmVFdmVudCwgY29udGV4dC5tb3ZlICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBjb250ZXh0LnN0b3AgKSB7XG5cdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hTdG9wRXZlbnQsIGNvbnRleHQuc3RvcCApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHQkLmVhY2goe1xuXHRcdHN3aXBlbGVmdDogXCJzd2lwZS5sZWZ0XCIsXG5cdFx0c3dpcGVyaWdodDogXCJzd2lwZS5yaWdodFwiXG5cdH0sIGZ1bmN0aW9uKCBldmVudCwgc291cmNlRXZlbnQgKSB7XG5cblx0XHQkLmV2ZW50LnNwZWNpYWxbIGV2ZW50IF0gPSB7XG5cdFx0XHRzZXR1cDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCQoIHRoaXMgKS5iaW5kKCBzb3VyY2VFdmVudCwgJC5ub29wICk7XG5cdFx0XHR9LFxuXHRcdFx0dGVhcmRvd246IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKCB0aGlzICkudW5iaW5kKCBzb3VyY2VFdmVudCApO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0pO1xufSkoIGpRdWVyeSwgdGhpcyApO1xuKi9cbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3QgTXV0YXRpb25PYnNlcnZlciA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciBwcmVmaXhlcyA9IFsnV2ViS2l0JywgJ01veicsICdPJywgJ01zJywgJyddO1xuICBmb3IgKHZhciBpPTA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChgJHtwcmVmaXhlc1tpXX1NdXRhdGlvbk9ic2VydmVyYCBpbiB3aW5kb3cpIHtcbiAgICAgIHJldHVybiB3aW5kb3dbYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmBdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59KCkpO1xuXG5jb25zdCB0cmlnZ2VycyA9IChlbCwgdHlwZSkgPT4ge1xuICBlbC5kYXRhKHR5cGUpLnNwbGl0KCcgJykuZm9yRWFjaChpZCA9PiB7XG4gICAgJChgIyR7aWR9YClbIHR5cGUgPT09ICdjbG9zZScgPyAndHJpZ2dlcicgOiAndHJpZ2dlckhhbmRsZXInXShgJHt0eXBlfS56Zi50cmlnZ2VyYCwgW2VsXSk7XG4gIH0pO1xufTtcbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtb3Blbl0gd2lsbCByZXZlYWwgYSBwbHVnaW4gdGhhdCBzdXBwb3J0cyBpdCB3aGVuIGNsaWNrZWQuXG4kKGRvY3VtZW50KS5vbignY2xpY2suemYudHJpZ2dlcicsICdbZGF0YS1vcGVuXScsIGZ1bmN0aW9uKCkge1xuICB0cmlnZ2VycygkKHRoaXMpLCAnb3BlbicpO1xufSk7XG5cbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtY2xvc2VdIHdpbGwgY2xvc2UgYSBwbHVnaW4gdGhhdCBzdXBwb3J0cyBpdCB3aGVuIGNsaWNrZWQuXG4vLyBJZiB1c2VkIHdpdGhvdXQgYSB2YWx1ZSBvbiBbZGF0YS1jbG9zZV0sIHRoZSBldmVudCB3aWxsIGJ1YmJsZSwgYWxsb3dpbmcgaXQgdG8gY2xvc2UgYSBwYXJlbnQgY29tcG9uZW50LlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2VdJywgZnVuY3Rpb24oKSB7XG4gIGxldCBpZCA9ICQodGhpcykuZGF0YSgnY2xvc2UnKTtcbiAgaWYgKGlkKSB7XG4gICAgdHJpZ2dlcnMoJCh0aGlzKSwgJ2Nsb3NlJyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZS56Zi50cmlnZ2VyJyk7XG4gIH1cbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLXRvZ2dsZV0gd2lsbCB0b2dnbGUgYSBwbHVnaW4gdGhhdCBzdXBwb3J0cyBpdCB3aGVuIGNsaWNrZWQuXG4kKGRvY3VtZW50KS5vbignY2xpY2suemYudHJpZ2dlcicsICdbZGF0YS10b2dnbGVdJywgZnVuY3Rpb24oKSB7XG4gIHRyaWdnZXJzKCQodGhpcyksICd0b2dnbGUnKTtcbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NhYmxlXSB3aWxsIHJlc3BvbmQgdG8gY2xvc2UuemYudHJpZ2dlciBldmVudHMuXG4kKGRvY3VtZW50KS5vbignY2xvc2UuemYudHJpZ2dlcicsICdbZGF0YS1jbG9zYWJsZV0nLCBmdW5jdGlvbihlKXtcbiAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgbGV0IGFuaW1hdGlvbiA9ICQodGhpcykuZGF0YSgnY2xvc2FibGUnKTtcblxuICBpZihhbmltYXRpb24gIT09ICcnKXtcbiAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlT3V0KCQodGhpcyksIGFuaW1hdGlvbiwgZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLnRyaWdnZXIoJ2Nsb3NlZC56ZicpO1xuICAgIH0pO1xuICB9ZWxzZXtcbiAgICAkKHRoaXMpLmZhZGVPdXQoKS50cmlnZ2VyKCdjbG9zZWQuemYnKTtcbiAgfVxufSk7XG5cbiQoZG9jdW1lbnQpLm9uKCdmb2N1cy56Zi50cmlnZ2VyIGJsdXIuemYudHJpZ2dlcicsICdbZGF0YS10b2dnbGUtZm9jdXNdJywgZnVuY3Rpb24oKSB7XG4gIGxldCBpZCA9ICQodGhpcykuZGF0YSgndG9nZ2xlLWZvY3VzJyk7XG4gICQoYCMke2lkfWApLnRyaWdnZXJIYW5kbGVyKCd0b2dnbGUuemYudHJpZ2dlcicsIFskKHRoaXMpXSk7XG59KTtcblxuLyoqXG4qIEZpcmVzIG9uY2UgYWZ0ZXIgYWxsIG90aGVyIHNjcmlwdHMgaGF2ZSBsb2FkZWRcbiogQGZ1bmN0aW9uXG4qIEBwcml2YXRlXG4qL1xuJCh3aW5kb3cpLmxvYWQoKCkgPT4ge1xuICBjaGVja0xpc3RlbmVycygpO1xufSk7XG5cbmZ1bmN0aW9uIGNoZWNrTGlzdGVuZXJzKCkge1xuICBldmVudHNMaXN0ZW5lcigpO1xuICByZXNpemVMaXN0ZW5lcigpO1xuICBzY3JvbGxMaXN0ZW5lcigpO1xuICBjbG9zZW1lTGlzdGVuZXIoKTtcbn1cblxuLy8qKioqKioqKiBvbmx5IGZpcmVzIHRoaXMgZnVuY3Rpb24gb25jZSBvbiBsb2FkLCBpZiB0aGVyZSdzIHNvbWV0aGluZyB0byB3YXRjaCAqKioqKioqKlxuZnVuY3Rpb24gY2xvc2VtZUxpc3RlbmVyKHBsdWdpbk5hbWUpIHtcbiAgdmFyIHlldGlCb3hlcyA9ICQoJ1tkYXRhLXlldGktYm94XScpLFxuICAgICAgcGx1Z05hbWVzID0gWydkcm9wZG93bicsICd0b29sdGlwJywgJ3JldmVhbCddO1xuXG4gIGlmKHBsdWdpbk5hbWUpe1xuICAgIGlmKHR5cGVvZiBwbHVnaW5OYW1lID09PSAnc3RyaW5nJyl7XG4gICAgICBwbHVnTmFtZXMucHVzaChwbHVnaW5OYW1lKTtcbiAgICB9ZWxzZSBpZih0eXBlb2YgcGx1Z2luTmFtZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHBsdWdpbk5hbWVbMF0gPT09ICdzdHJpbmcnKXtcbiAgICAgIHBsdWdOYW1lcy5jb25jYXQocGx1Z2luTmFtZSk7XG4gICAgfWVsc2V7XG4gICAgICBjb25zb2xlLmVycm9yKCdQbHVnaW4gbmFtZXMgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICB9XG4gIGlmKHlldGlCb3hlcy5sZW5ndGgpe1xuICAgIGxldCBsaXN0ZW5lcnMgPSBwbHVnTmFtZXMubWFwKChuYW1lKSA9PiB7XG4gICAgICByZXR1cm4gYGNsb3NlbWUuemYuJHtuYW1lfWA7XG4gICAgfSkuam9pbignICcpO1xuXG4gICAgJCh3aW5kb3cpLm9mZihsaXN0ZW5lcnMpLm9uKGxpc3RlbmVycywgZnVuY3Rpb24oZSwgcGx1Z2luSWQpe1xuICAgICAgbGV0IHBsdWdpbiA9IGUubmFtZXNwYWNlLnNwbGl0KCcuJylbMF07XG4gICAgICBsZXQgcGx1Z2lucyA9ICQoYFtkYXRhLSR7cGx1Z2lufV1gKS5ub3QoYFtkYXRhLXlldGktYm94PVwiJHtwbHVnaW5JZH1cIl1gKTtcblxuICAgICAgcGx1Z2lucy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBfdGhpcyA9ICQodGhpcyk7XG5cbiAgICAgICAgX3RoaXMudHJpZ2dlckhhbmRsZXIoJ2Nsb3NlLnpmLnRyaWdnZXInLCBbX3RoaXNdKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc2l6ZUxpc3RlbmVyKGRlYm91bmNlKXtcbiAgbGV0IHRpbWVyLFxuICAgICAgJG5vZGVzID0gJCgnW2RhdGEtcmVzaXplXScpO1xuICBpZigkbm9kZXMubGVuZ3RoKXtcbiAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUuemYudHJpZ2dlcicpXG4gICAgLm9uKCdyZXNpemUuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICh0aW1lcikgeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG5cbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuXG4gICAgICAgIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsvL2ZhbGxiYWNrIGZvciBJRSA5XG4gICAgICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgcmVzaXplIGV2ZW50XG4gICAgICAgICRub2Rlcy5hdHRyKCdkYXRhLWV2ZW50cycsIFwicmVzaXplXCIpO1xuICAgICAgfSwgZGVib3VuY2UgfHwgMTApOy8vZGVmYXVsdCB0aW1lIHRvIGVtaXQgcmVzaXplIGV2ZW50XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2Nyb2xsTGlzdGVuZXIoZGVib3VuY2Upe1xuICBsZXQgdGltZXIsXG4gICAgICAkbm9kZXMgPSAkKCdbZGF0YS1zY3JvbGxdJyk7XG4gIGlmKCRub2Rlcy5sZW5ndGgpe1xuICAgICQod2luZG93KS5vZmYoJ3Njcm9sbC56Zi50cmlnZ2VyJylcbiAgICAub24oJ3Njcm9sbC56Zi50cmlnZ2VyJywgZnVuY3Rpb24oZSl7XG4gICAgICBpZih0aW1lcil7IGNsZWFyVGltZW91dCh0aW1lcik7IH1cblxuICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgaWYoIU11dGF0aW9uT2JzZXJ2ZXIpey8vZmFsbGJhY2sgZm9yIElFIDlcbiAgICAgICAgICAkbm9kZXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcignc2Nyb2xsbWUuemYudHJpZ2dlcicpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSBzY3JvbGwgZXZlbnRcbiAgICAgICAgJG5vZGVzLmF0dHIoJ2RhdGEtZXZlbnRzJywgXCJzY3JvbGxcIik7XG4gICAgICB9LCBkZWJvdW5jZSB8fCAxMCk7Ly9kZWZhdWx0IHRpbWUgdG8gZW1pdCBzY3JvbGwgZXZlbnRcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBldmVudHNMaXN0ZW5lcigpIHtcbiAgaWYoIU11dGF0aW9uT2JzZXJ2ZXIpeyByZXR1cm4gZmFsc2U7IH1cbiAgbGV0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtcmVzaXplXSwgW2RhdGEtc2Nyb2xsXSwgW2RhdGEtbXV0YXRlXScpO1xuXG4gIC8vZWxlbWVudCBjYWxsYmFja1xuICB2YXIgbGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbiA9IGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkc0xpc3QpIHtcbiAgICB2YXIgJHRhcmdldCA9ICQobXV0YXRpb25SZWNvcmRzTGlzdFswXS50YXJnZXQpO1xuICAgIC8vdHJpZ2dlciB0aGUgZXZlbnQgaGFuZGxlciBmb3IgdGhlIGVsZW1lbnQgZGVwZW5kaW5nIG9uIHR5cGVcbiAgICBzd2l0Y2ggKCR0YXJnZXQuYXR0cihcImRhdGEtZXZlbnRzXCIpKSB7XG5cbiAgICAgIGNhc2UgXCJyZXNpemVcIiA6XG4gICAgICAkdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXRdKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFwic2Nyb2xsXCIgOlxuICAgICAgJHRhcmdldC50cmlnZ2VySGFuZGxlcignc2Nyb2xsbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0LCB3aW5kb3cucGFnZVlPZmZzZXRdKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgICAvLyBjYXNlIFwibXV0YXRlXCIgOlxuICAgICAgLy8gY29uc29sZS5sb2coJ211dGF0ZScsICR0YXJnZXQpO1xuICAgICAgLy8gJHRhcmdldC50cmlnZ2VySGFuZGxlcignbXV0YXRlLnpmLnRyaWdnZXInKTtcbiAgICAgIC8vXG4gICAgICAvLyAvL21ha2Ugc3VyZSB3ZSBkb24ndCBnZXQgc3R1Y2sgaW4gYW4gaW5maW5pdGUgbG9vcCBmcm9tIHNsb3BweSBjb2RlaW5nXG4gICAgICAvLyBpZiAoJHRhcmdldC5pbmRleCgnW2RhdGEtbXV0YXRlXScpID09ICQoXCJbZGF0YS1tdXRhdGVdXCIpLmxlbmd0aC0xKSB7XG4gICAgICAvLyAgIGRvbU11dGF0aW9uT2JzZXJ2ZXIoKTtcbiAgICAgIC8vIH1cbiAgICAgIC8vIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0IDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIC8vbm90aGluZ1xuICAgIH1cbiAgfVxuXG4gIGlmKG5vZGVzLmxlbmd0aCl7XG4gICAgLy9mb3IgZWFjaCBlbGVtZW50IHRoYXQgbmVlZHMgdG8gbGlzdGVuIGZvciByZXNpemluZywgc2Nyb2xsaW5nLCAob3IgY29taW5nIHNvb24gbXV0YXRpb24pIGFkZCBhIHNpbmdsZSBvYnNlcnZlclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG5vZGVzLmxlbmd0aC0xOyBpKyspIHtcbiAgICAgIGxldCBlbGVtZW50T2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihsaXN0ZW5pbmdFbGVtZW50c011dGF0aW9uKTtcbiAgICAgIGVsZW1lbnRPYnNlcnZlci5vYnNlcnZlKG5vZGVzW2ldLCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogZmFsc2UsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOmZhbHNlLCBhdHRyaWJ1dGVGaWx0ZXI6W1wiZGF0YS1ldmVudHNcIl19KTtcbiAgICB9XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFtQSF1cbi8vIEZvdW5kYXRpb24uQ2hlY2tXYXRjaGVycyA9IGNoZWNrV2F0Y2hlcnM7XG5Gb3VuZGF0aW9uLklIZWFyWW91ID0gY2hlY2tMaXN0ZW5lcnM7XG4vLyBGb3VuZGF0aW9uLklTZWVZb3UgPSBzY3JvbGxMaXN0ZW5lcjtcbi8vIEZvdW5kYXRpb24uSUZlZWxZb3UgPSBjbG9zZW1lTGlzdGVuZXI7XG5cbn0oalF1ZXJ5KTtcblxuLy8gZnVuY3Rpb24gZG9tTXV0YXRpb25PYnNlcnZlcihkZWJvdW5jZSkge1xuLy8gICAvLyAhISEgVGhpcyBpcyBjb21pbmcgc29vbiBhbmQgbmVlZHMgbW9yZSB3b3JrOyBub3QgYWN0aXZlICAhISEgLy9cbi8vICAgdmFyIHRpbWVyLFxuLy8gICBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW11dGF0ZV0nKTtcbi8vICAgLy9cbi8vICAgaWYgKG5vZGVzLmxlbmd0aCkge1xuLy8gICAgIC8vIHZhciBNdXRhdGlvbk9ic2VydmVyID0gKGZ1bmN0aW9uICgpIHtcbi8vICAgICAvLyAgIHZhciBwcmVmaXhlcyA9IFsnV2ViS2l0JywgJ01veicsICdPJywgJ01zJywgJyddO1xuLy8gICAgIC8vICAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAvLyAgICAgaWYgKHByZWZpeGVzW2ldICsgJ011dGF0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdykge1xuLy8gICAgIC8vICAgICAgIHJldHVybiB3aW5kb3dbcHJlZml4ZXNbaV0gKyAnTXV0YXRpb25PYnNlcnZlciddO1xuLy8gICAgIC8vICAgICB9XG4vLyAgICAgLy8gICB9XG4vLyAgICAgLy8gICByZXR1cm4gZmFsc2U7XG4vLyAgICAgLy8gfSgpKTtcbi8vXG4vL1xuLy8gICAgIC8vZm9yIHRoZSBib2R5LCB3ZSBuZWVkIHRvIGxpc3RlbiBmb3IgYWxsIGNoYW5nZXMgZWZmZWN0aW5nIHRoZSBzdHlsZSBhbmQgY2xhc3MgYXR0cmlidXRlc1xuLy8gICAgIHZhciBib2R5T2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihib2R5TXV0YXRpb24pO1xuLy8gICAgIGJvZHlPYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTp0cnVlLCBhdHRyaWJ1dGVGaWx0ZXI6W1wic3R5bGVcIiwgXCJjbGFzc1wiXX0pO1xuLy9cbi8vXG4vLyAgICAgLy9ib2R5IGNhbGxiYWNrXG4vLyAgICAgZnVuY3Rpb24gYm9keU11dGF0aW9uKG11dGF0ZSkge1xuLy8gICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIG11dGF0aW9uIGV2ZW50XG4vLyAgICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuLy9cbi8vICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbi8vICAgICAgICAgYm9keU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbi8vICAgICAgICAgJCgnW2RhdGEtbXV0YXRlXScpLmF0dHIoJ2RhdGEtZXZlbnRzJyxcIm11dGF0ZVwiKTtcbi8vICAgICAgIH0sIGRlYm91bmNlIHx8IDE1MCk7XG4vLyAgICAgfVxuLy8gICB9XG4vLyB9XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogRHJvcGRvd24gbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmRyb3Bkb3duXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICovXG5cbmNsYXNzIERyb3Bkb3duIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBkcm9wZG93bi5cbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93bi5cbiAgICogICAgICAgIE9iamVjdCBzaG91bGQgYmUgb2YgdGhlIGRyb3Bkb3duIHBhbmVsLCByYXRoZXIgdGhhbiBpdHMgYW5jaG9yLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIERyb3Bkb3duLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnRHJvcGRvd24nKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdEcm9wZG93bicsIHtcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxuICAgICAgJ1RBQic6ICd0YWJfZm9yd2FyZCcsXG4gICAgICAnU0hJRlRfVEFCJzogJ3RhYl9iYWNrd2FyZCdcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luIGJ5IHNldHRpbmcvY2hlY2tpbmcgb3B0aW9ucyBhbmQgYXR0cmlidXRlcywgYWRkaW5nIGhlbHBlciB2YXJpYWJsZXMsIGFuZCBzYXZpbmcgdGhlIGFuY2hvci5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgJGlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgdGhpcy4kYW5jaG9yID0gJChgW2RhdGEtdG9nZ2xlPVwiJHskaWR9XCJdYCkgfHwgJChgW2RhdGEtb3Blbj1cIiR7JGlkfVwiXWApO1xuICAgIHRoaXMuJGFuY2hvci5hdHRyKHtcbiAgICAgICdhcmlhLWNvbnRyb2xzJzogJGlkLFxuICAgICAgJ2RhdGEtaXMtZm9jdXMnOiBmYWxzZSxcbiAgICAgICdkYXRhLXlldGktYm94JzogJGlkLFxuICAgICAgJ2FyaWEtaGFzcG9wdXAnOiB0cnVlLFxuICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBmYWxzZVxuXG4gICAgfSk7XG5cbiAgICB0aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzcyA9IHRoaXMuZ2V0UG9zaXRpb25DbGFzcygpO1xuICAgIHRoaXMuY291bnRlciA9IDQ7XG4gICAgdGhpcy51c2VkUG9zaXRpb25zID0gW107XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcbiAgICAgICdhcmlhLWhpZGRlbic6ICd0cnVlJyxcbiAgICAgICdkYXRhLXlldGktYm94JzogJGlkLFxuICAgICAgJ2RhdGEtcmVzaXplJzogJGlkLFxuICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IHRoaXMuJGFuY2hvclswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdkZC1hbmNob3InKVxuICAgIH0pO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB0byBkZXRlcm1pbmUgY3VycmVudCBvcmllbnRhdGlvbiBvZiBkcm9wZG93biBwYW5lLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHJldHVybnMge1N0cmluZ30gcG9zaXRpb24gLSBzdHJpbmcgdmFsdWUgb2YgYSBwb3NpdGlvbiBjbGFzcy5cbiAgICovXG4gIGdldFBvc2l0aW9uQ2xhc3MoKSB7XG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goL1xcYih0b3B8bGVmdHxyaWdodClcXGIvZyk7XG4gICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24gPyBwb3NpdGlvblswXSA6ICcnO1xuICAgIHJldHVybiBwb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGp1c3RzIHRoZSBkcm9wZG93biBwYW5lcyBvcmllbnRhdGlvbiBieSBhZGRpbmcvcmVtb3ZpbmcgcG9zaXRpb25pbmcgY2xhc3Nlcy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIHBvc2l0aW9uIGNsYXNzIHRvIHJlbW92ZS5cbiAgICovXG4gIF9yZXBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgdGhpcy51c2VkUG9zaXRpb25zLnB1c2gocG9zaXRpb24gPyBwb3NpdGlvbiA6ICdib3R0b20nKTtcbiAgICAvL2RlZmF1bHQsIHRyeSBzd2l0Y2hpbmcgdG8gb3Bwb3NpdGUgc2lkZVxuICAgIGlmKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygndG9wJyk7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICd0b3AnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pXG4gICAgICAgICAgLmFkZENsYXNzKCdyaWdodCcpO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAncmlnaHQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbilcbiAgICAgICAgICAuYWRkQ2xhc3MoJ2xlZnQnKTtcbiAgICB9XG5cbiAgICAvL2lmIGRlZmF1bHQgY2hhbmdlIGRpZG4ndCB3b3JrLCB0cnkgYm90dG9tIG9yIGxlZnQgZmlyc3RcbiAgICBlbHNlIGlmKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnbGVmdCcpO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbilcbiAgICAgICAgICAuYWRkQ2xhc3MoJ2xlZnQnKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH1cbiAgICAvL2lmIG5vdGhpbmcgY2xlYXJlZCwgc2V0IHRvIGJvdHRvbVxuICAgIGVsc2V7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgdGhpcy5jbGFzc0NoYW5nZWQgPSB0cnVlO1xuICAgIHRoaXMuY291bnRlci0tO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiBvZiB0aGUgZHJvcGRvd24gcGFuZSwgY2hlY2tzIGZvciBjb2xsaXNpb25zLlxuICAgKiBSZWN1cnNpdmVseSBjYWxscyBpdHNlbGYgaWYgYSBjb2xsaXNpb24gaXMgZGV0ZWN0ZWQsIHdpdGggYSBuZXcgcG9zaXRpb24gY2xhc3MuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldFBvc2l0aW9uKCkge1xuICAgIGlmKHRoaXMuJGFuY2hvci5hdHRyKCdhcmlhLWV4cGFuZGVkJykgPT09ICdmYWxzZScpeyByZXR1cm4gZmFsc2U7IH1cbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLmdldFBvc2l0aW9uQ2xhc3MoKSxcbiAgICAgICAgJGVsZURpbXMgPSBGb3VuZGF0aW9uLkJveC5HZXREaW1lbnNpb25zKHRoaXMuJGVsZW1lbnQpLFxuICAgICAgICAkYW5jaG9yRGltcyA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcy4kYW5jaG9yKSxcbiAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICBkaXJlY3Rpb24gPSAocG9zaXRpb24gPT09ICdsZWZ0JyA/ICdsZWZ0JyA6ICgocG9zaXRpb24gPT09ICdyaWdodCcpID8gJ2xlZnQnIDogJ3RvcCcpKSxcbiAgICAgICAgcGFyYW0gPSAoZGlyZWN0aW9uID09PSAndG9wJykgPyAnaGVpZ2h0JyA6ICd3aWR0aCcsXG4gICAgICAgIG9mZnNldCA9IChwYXJhbSA9PT0gJ2hlaWdodCcpID8gdGhpcy5vcHRpb25zLnZPZmZzZXQgOiB0aGlzLm9wdGlvbnMuaE9mZnNldDtcblxuICAgIGlmKCgkZWxlRGltcy53aWR0aCA+PSAkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoKSB8fCAoIXRoaXMuY291bnRlciAmJiAhRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLiRlbGVtZW50KSkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmZzZXQoRm91bmRhdGlvbi5Cb3guR2V0T2Zmc2V0cyh0aGlzLiRlbGVtZW50LCB0aGlzLiRhbmNob3IsICdjZW50ZXIgYm90dG9tJywgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0LCB0cnVlKSkuY3NzKHtcbiAgICAgICAgJ3dpZHRoJzogJGVsZURpbXMud2luZG93RGltcy53aWR0aCAtICh0aGlzLm9wdGlvbnMuaE9mZnNldCAqIDIpLFxuICAgICAgICAnaGVpZ2h0JzogJ2F1dG8nXG4gICAgICB9KTtcbiAgICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50Lm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMuJGVsZW1lbnQsIHRoaXMuJGFuY2hvciwgcG9zaXRpb24sIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCkpO1xuXG4gICAgd2hpbGUoIUZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UodGhpcy4kZWxlbWVudCkgJiYgdGhpcy5jb3VudGVyKXtcbiAgICAgIHRoaXMuX3JlcG9zaXRpb24ocG9zaXRpb24pO1xuICAgICAgdGhpcy5fc2V0UG9zaXRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIGVsZW1lbnQgdXRpbGl6aW5nIHRoZSB0cmlnZ2VycyB1dGlsaXR5IGxpYnJhcnkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiB0aGlzLl9zZXRQb3NpdGlvbi5iaW5kKHRoaXMpXG4gICAgfSk7XG5cbiAgICBpZih0aGlzLm9wdGlvbnMuaG92ZXIpe1xuICAgICAgdGhpcy4kYW5jaG9yLm9mZignbW91c2VlbnRlci56Zi5kcm9wZG93biBtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJylcbiAgICAgICAgICAub24oJ21vdXNlZW50ZXIuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgX3RoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJywgdHJ1ZSk7XG4gICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xuICAgICAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInLCBmYWxzZSk7XG4gICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xuICAgICAgICAgIH0pO1xuICAgICAgaWYodGhpcy5vcHRpb25zLmhvdmVyUGFuZSl7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duIG1vdXNlbGVhdmUuemYuZHJvcGRvd24nKVxuICAgICAgICAgICAgLm9uKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XG4gICAgICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJywgZmFsc2UpO1xuICAgICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuJGFuY2hvci5hZGQodGhpcy4kZWxlbWVudCkub24oJ2tleWRvd24uemYuZHJvcGRvd24nLCBmdW5jdGlvbihlKSB7XG5cbiAgICAgIHZhciAkdGFyZ2V0ID0gJCh0aGlzKSxcbiAgICAgICAgdmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKF90aGlzLiRlbGVtZW50KTtcblxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ0Ryb3Bkb3duJywge1xuICAgICAgICB0YWJfZm9yd2FyZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKF90aGlzLiRlbGVtZW50LmZpbmQoJzpmb2N1cycpLmlzKHZpc2libGVGb2N1c2FibGVFbGVtZW50cy5lcSgtMSkpKSB7IC8vIGxlZnQgbW9kYWwgZG93bndhcmRzLCBzZXR0aW5nIGZvY3VzIHRvIGZpcnN0IGVsZW1lbnRcbiAgICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLnRyYXBGb2N1cykgeyAvLyBpZiBmb2N1cyBzaGFsbCBiZSB0cmFwcGVkXG4gICAgICAgICAgICAgIHZpc2libGVGb2N1c2FibGVFbGVtZW50cy5lcSgwKS5mb2N1cygpO1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9IGVsc2UgeyAvLyBpZiBmb2N1cyBpcyBub3QgdHJhcHBlZCwgY2xvc2UgZHJvcGRvd24gb24gZm9jdXMgb3V0XG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0YWJfYmFja3dhcmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyh2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoMCkpIHx8IF90aGlzLiRlbGVtZW50LmlzKCc6Zm9jdXMnKSkgeyAvLyBsZWZ0IG1vZGFsIHVwd2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gbGFzdCBlbGVtZW50XG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy50cmFwRm9jdXMpIHsgLy8gaWYgZm9jdXMgc2hhbGwgYmUgdHJhcHBlZFxuICAgICAgICAgICAgICB2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpLmZvY3VzKCk7XG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7IC8vIGlmIGZvY3VzIGlzIG5vdCB0cmFwcGVkLCBjbG9zZSBkcm9wZG93biBvbiBmb2N1cyBvdXRcbiAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICgkdGFyZ2V0LmlzKF90aGlzLiRhbmNob3IpKSB7XG4gICAgICAgICAgICBfdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICBfdGhpcy4kZWxlbWVudC5hdHRyKCd0YWJpbmRleCcsIC0xKS5mb2N1cygpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgX3RoaXMuJGFuY2hvci5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGFuIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGJvZHkgdG8gY2xvc2UgYW55IGRyb3Bkb3ducyBvbiBhIGNsaWNrLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9hZGRCb2R5SGFuZGxlcigpIHtcbiAgICAgdmFyICRib2R5ID0gJChkb2N1bWVudC5ib2R5KS5ub3QodGhpcy4kZWxlbWVudCksXG4gICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICRib2R5Lm9mZignY2xpY2suemYuZHJvcGRvd24nKVxuICAgICAgICAgIC5vbignY2xpY2suemYuZHJvcGRvd24nLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgIGlmKF90aGlzLiRhbmNob3IuaXMoZS50YXJnZXQpIHx8IF90aGlzLiRhbmNob3IuZmluZChlLnRhcmdldCkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKF90aGlzLiRlbGVtZW50LmZpbmQoZS50YXJnZXQpLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgJGJvZHkub2ZmKCdjbGljay56Zi5kcm9wZG93bicpO1xuICAgICAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBkcm9wZG93biBwYW5lLCBhbmQgZmlyZXMgYSBidWJibGluZyBldmVudCB0byBjbG9zZSBvdGhlciBkcm9wZG93bnMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgRHJvcGRvd24jY2xvc2VtZVxuICAgKiBAZmlyZXMgRHJvcGRvd24jc2hvd1xuICAgKi9cbiAgb3BlbigpIHtcbiAgICAvLyB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIC8qKlxuICAgICAqIEZpcmVzIHRvIGNsb3NlIG90aGVyIG9wZW4gZHJvcGRvd25zXG4gICAgICogQGV2ZW50IERyb3Bkb3duI2Nsb3NlbWVcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlbWUuemYuZHJvcGRvd24nLCB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJykpO1xuICAgIHRoaXMuJGFuY2hvci5hZGRDbGFzcygnaG92ZXInKVxuICAgICAgICAuYXR0cih7J2FyaWEtZXhwYW5kZWQnOiB0cnVlfSk7XG4gICAgLy8gdGhpcy4kZWxlbWVudC8qLnNob3coKSovO1xuICAgIHRoaXMuX3NldFBvc2l0aW9uKCk7XG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnaXMtb3BlbicpXG4gICAgICAgIC5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pO1xuXG4gICAgaWYodGhpcy5vcHRpb25zLmF1dG9Gb2N1cyl7XG4gICAgICB2YXIgJGZvY3VzYWJsZSA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcbiAgICAgIGlmKCRmb2N1c2FibGUubGVuZ3RoKXtcbiAgICAgICAgJGZvY3VzYWJsZS5lcSgwKS5mb2N1cygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2speyB0aGlzLl9hZGRCb2R5SGFuZGxlcigpOyB9XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyBvbmNlIHRoZSBkcm9wZG93biBpcyB2aXNpYmxlLlxuICAgICAqIEBldmVudCBEcm9wZG93biNzaG93XG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzaG93LnpmLmRyb3Bkb3duJywgW3RoaXMuJGVsZW1lbnRdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIG9wZW4gZHJvcGRvd24gcGFuZS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBEcm9wZG93biNoaWRlXG4gICAqL1xuICBjbG9zZSgpIHtcbiAgICBpZighdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKXtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcygnaXMtb3BlbicpXG4gICAgICAgIC5hdHRyKHsnYXJpYS1oaWRkZW4nOiB0cnVlfSk7XG5cbiAgICB0aGlzLiRhbmNob3IucmVtb3ZlQ2xhc3MoJ2hvdmVyJylcbiAgICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSk7XG5cbiAgICBpZih0aGlzLmNsYXNzQ2hhbmdlZCl7XG4gICAgICB2YXIgY3VyUG9zaXRpb25DbGFzcyA9IHRoaXMuZ2V0UG9zaXRpb25DbGFzcygpO1xuICAgICAgaWYoY3VyUG9zaXRpb25DbGFzcyl7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoY3VyUG9zaXRpb25DbGFzcyk7XG4gICAgICB9XG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzKVxuICAgICAgICAgIC8qLmhpZGUoKSovLmNzcyh7aGVpZ2h0OiAnJywgd2lkdGg6ICcnfSk7XG4gICAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5jb3VudGVyID0gNDtcbiAgICAgIHRoaXMudXNlZFBvc2l0aW9ucy5sZW5ndGggPSAwO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2hpZGUuemYuZHJvcGRvd24nLCBbdGhpcy4kZWxlbWVudF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIGRyb3Bkb3duIHBhbmUncyB2aXNpYmlsaXR5LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHRvZ2dsZSgpIHtcbiAgICBpZih0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpe1xuICAgICAgaWYodGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJykpIHJldHVybjtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgZHJvcGRvd24uXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXInKS5oaWRlKCk7XG4gICAgdGhpcy4kYW5jaG9yLm9mZignLnpmLmRyb3Bkb3duJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuRHJvcGRvd24uZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBkZWxheSBvcGVuaW5nIGEgc3VibWVudSBvbiBob3ZlciBldmVudC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAyNTBcbiAgICovXG4gIGhvdmVyRGVsYXk6IDI1MCxcbiAgLyoqXG4gICAqIEFsbG93IHN1Ym1lbnVzIHRvIG9wZW4gb24gaG92ZXIgZXZlbnRzXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGhvdmVyOiBmYWxzZSxcbiAgLyoqXG4gICAqIERvbid0IGNsb3NlIGRyb3Bkb3duIHdoZW4gaG92ZXJpbmcgb3ZlciBkcm9wZG93biBwYW5lXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgaG92ZXJQYW5lOiBmYWxzZSxcbiAgLyoqXG4gICAqIE51bWJlciBvZiBwaXhlbHMgYmV0d2VlbiB0aGUgZHJvcGRvd24gcGFuZSBhbmQgdGhlIHRyaWdnZXJpbmcgZWxlbWVudCBvbiBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDFcbiAgICovXG4gIHZPZmZzZXQ6IDEsXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcGl4ZWxzIGJldHdlZW4gdGhlIGRyb3Bkb3duIHBhbmUgYW5kIHRoZSB0cmlnZ2VyaW5nIGVsZW1lbnQgb24gb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxXG4gICAqL1xuICBoT2Zmc2V0OiAxLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byBhZGp1c3Qgb3BlbiBwb3NpdGlvbi4gSlMgd2lsbCB0ZXN0IGFuZCBmaWxsIHRoaXMgaW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3RvcCdcbiAgICovXG4gIHBvc2l0aW9uQ2xhc3M6ICcnLFxuICAvKipcbiAgICogQWxsb3cgdGhlIHBsdWdpbiB0byB0cmFwIGZvY3VzIHRvIHRoZSBkcm9wZG93biBwYW5lIGlmIG9wZW5lZCB3aXRoIGtleWJvYXJkIGNvbW1hbmRzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICB0cmFwRm9jdXM6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3cgdGhlIHBsdWdpbiB0byBzZXQgZm9jdXMgdG8gdGhlIGZpcnN0IGZvY3VzYWJsZSBlbGVtZW50IHdpdGhpbiB0aGUgcGFuZSwgcmVnYXJkbGVzcyBvZiBtZXRob2Qgb2Ygb3BlbmluZy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBhdXRvRm9jdXM6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3dzIGEgY2xpY2sgb24gdGhlIGJvZHkgdG8gY2xvc2UgdGhlIGRyb3Bkb3duLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IGZhbHNlXG59XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihEcm9wZG93biwgJ0Ryb3Bkb3duJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBEcm9wZG93bk1lbnUgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmRyb3Bkb3duLW1lbnVcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm5lc3RcbiAqL1xuXG5jbGFzcyBEcm9wZG93bk1lbnUge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBEcm9wZG93bk1lbnUuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgRHJvcGRvd25NZW51I2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhIGRyb3Bkb3duIG1lbnUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRHJvcGRvd25NZW51LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICBGb3VuZGF0aW9uLk5lc3QuRmVhdGhlcih0aGlzLiRlbGVtZW50LCAnZHJvcGRvd24nKTtcbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdEcm9wZG93bk1lbnUnKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdEcm9wZG93bk1lbnUnLCB7XG4gICAgICAnRU5URVInOiAnb3BlbicsXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXG4gICAgICAnQVJST1dfUklHSFQnOiAnbmV4dCcsXG4gICAgICAnQVJST1dfVVAnOiAndXAnLFxuICAgICAgJ0FSUk9XX0RPV04nOiAnZG93bicsXG4gICAgICAnQVJST1dfTEVGVCc6ICdwcmV2aW91cycsXG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJ1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBwbHVnaW4sIGFuZCBjYWxscyBfcHJlcGFyZU1lbnVcbiAgICogQHByaXZhdGVcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgc3VicyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcbiAgICB0aGlzLiRlbGVtZW50LmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKS5hZGRDbGFzcygnZmlyc3Qtc3ViJyk7XG5cbiAgICB0aGlzLiRtZW51SXRlbXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tyb2xlPVwibWVudWl0ZW1cIl0nKTtcbiAgICB0aGlzLiR0YWJzID0gdGhpcy4kZWxlbWVudC5jaGlsZHJlbignW3JvbGU9XCJtZW51aXRlbVwiXScpO1xuICAgIHRoaXMuJHRhYnMuZmluZCgndWwuaXMtZHJvcGRvd24tc3VibWVudScpLmFkZENsYXNzKHRoaXMub3B0aW9ucy52ZXJ0aWNhbENsYXNzKTtcblxuICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMub3B0aW9ucy5yaWdodENsYXNzKSB8fCB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAncmlnaHQnIHx8IEZvdW5kYXRpb24ucnRsKCkpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPSAncmlnaHQnO1xuICAgICAgc3Vicy5hZGRDbGFzcygnb3BlbnMtbGVmdCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdWJzLmFkZENsYXNzKCdvcGVucy1yaWdodCcpO1xuICAgIH1cbiAgICB0aGlzLmNoYW5nZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfTtcbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIGVsZW1lbnRzIHdpdGhpbiB0aGUgbWVudVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgaGFzVG91Y2ggPSAnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cgfHwgKHR5cGVvZiB3aW5kb3cub250b3VjaHN0YXJ0ICE9PSAndW5kZWZpbmVkJyksXG4gICAgICAgIHBhckNsYXNzID0gJ2lzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JztcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xpY2tPcGVuIHx8IGhhc1RvdWNoKSB7XG4gICAgICB0aGlzLiRtZW51SXRlbXMub24oJ2NsaWNrLnpmLmRyb3Bkb3dubWVudSB0b3VjaHN0YXJ0LnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyICRlbGVtID0gJChlLnRhcmdldCkucGFyZW50c1VudGlsKCd1bCcsIGAuJHtwYXJDbGFzc31gKSxcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKSxcbiAgICAgICAgICAgIGhhc0NsaWNrZWQgPSAkZWxlbS5hdHRyKCdkYXRhLWlzLWNsaWNrJykgPT09ICd0cnVlJyxcbiAgICAgICAgICAgICRzdWIgPSAkZWxlbS5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKTtcblxuICAgICAgICBpZiAoaGFzU3ViKSB7XG4gICAgICAgICAgaWYgKGhhc0NsaWNrZWQpIHtcbiAgICAgICAgICAgIGlmICghX3RoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgfHwgKCFfdGhpcy5vcHRpb25zLmNsaWNrT3BlbiAmJiAhaGFzVG91Y2gpIHx8IChfdGhpcy5vcHRpb25zLmZvcmNlRm9sbG93ICYmIGhhc1RvdWNoKSkgeyByZXR1cm47IH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpKTtcbiAgICAgICAgICAgICRlbGVtLmFkZCgkZWxlbS5wYXJlbnRzVW50aWwoX3RoaXMuJGVsZW1lbnQsIGAuJHtwYXJDbGFzc31gKSkuYXR0cignZGF0YS1pcy1jbGljaycsIHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHsgcmV0dXJuOyB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kaXNhYmxlSG92ZXIpIHtcbiAgICAgIHRoaXMuJG1lbnVJdGVtcy5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgICBoYXNTdWIgPSAkZWxlbS5oYXNDbGFzcyhwYXJDbGFzcyk7XG5cbiAgICAgICAgaWYgKGhhc1N1Yikge1xuICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy5kZWxheSk7XG4gICAgICAgICAgX3RoaXMuZGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuX3Nob3coJGVsZW0uY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykpO1xuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSk7XG4gICAgICAgIH1cbiAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyICRlbGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKTtcbiAgICAgICAgaWYgKGhhc1N1YiAmJiBfdGhpcy5vcHRpb25zLmF1dG9jbG9zZSkge1xuICAgICAgICAgIGlmICgkZWxlbS5hdHRyKCdkYXRhLWlzLWNsaWNrJykgPT09ICd0cnVlJyAmJiBfdGhpcy5vcHRpb25zLmNsaWNrT3BlbikgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy5kZWxheSk7XG4gICAgICAgICAgX3RoaXMuZGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuY2xvc2luZ1RpbWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy4kbWVudUl0ZW1zLm9uKCdrZXlkb3duLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkZWxlbWVudCA9ICQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCAnW3JvbGU9XCJtZW51aXRlbVwiXScpLFxuICAgICAgICAgIGlzVGFiID0gX3RoaXMuJHRhYnMuaW5kZXgoJGVsZW1lbnQpID4gLTEsXG4gICAgICAgICAgJGVsZW1lbnRzID0gaXNUYWIgPyBfdGhpcy4kdGFicyA6ICRlbGVtZW50LnNpYmxpbmdzKCdsaScpLmFkZCgkZWxlbWVudCksXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxuICAgICAgICAgICRuZXh0RWxlbWVudDtcblxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoaS0xKTtcbiAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudHMuZXEoaSsxKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB2YXIgbmV4dFNpYmxpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCEkZWxlbWVudC5pcygnOmxhc3QtY2hpbGQnKSkgJG5leHRFbGVtZW50LmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgIH0sIHByZXZTaWJsaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRwcmV2RWxlbWVudC5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XG4gICAgICB9LCBvcGVuU3ViID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc3ViID0gJGVsZW1lbnQuY2hpbGRyZW4oJ3VsLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKTtcbiAgICAgICAgaWYgKCRzdWIubGVuZ3RoKSB7XG4gICAgICAgICAgX3RoaXMuX3Nob3coJHN1Yik7XG4gICAgICAgICAgJGVsZW1lbnQuZmluZCgnbGkgPiBhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgICAgfSBlbHNlIHsgcmV0dXJuOyB9XG4gICAgICB9LCBjbG9zZVN1YiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvL2lmICgkZWxlbWVudC5pcygnOmZpcnN0LWNoaWxkJykpIHtcbiAgICAgICAgdmFyIGNsb3NlID0gJGVsZW1lbnQucGFyZW50KCd1bCcpLnBhcmVudCgnbGknKTtcbiAgICAgICAgICBjbG9zZS5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XG4gICAgICAgICAgX3RoaXMuX2hpZGUoY2xvc2UpO1xuICAgICAgICAvL31cbiAgICAgIH07XG4gICAgICB2YXIgZnVuY3Rpb25zID0ge1xuICAgICAgICBvcGVuOiBvcGVuU3ViLFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMuX2hpZGUoX3RoaXMuJGVsZW1lbnQpO1xuICAgICAgICAgIF90aGlzLiRtZW51SXRlbXMuZmluZCgnYTpmaXJzdCcpLmZvY3VzKCk7IC8vIGZvY3VzIHRvIGZpcnN0IGVsZW1lbnRcbiAgICAgICAgfSxcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGlmIChpc1RhYikge1xuICAgICAgICBpZiAoX3RoaXMudmVydGljYWwpIHsgLy8gdmVydGljYWwgbWVudVxuICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnKSB7IC8vIGxlZnQgYWxpZ25lZFxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgICB1cDogcHJldlNpYmxpbmcsXG4gICAgICAgICAgICAgIG5leHQ6IG9wZW5TdWIsXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBjbG9zZVN1YlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHsgLy8gcmlnaHQgYWxpZ25lZFxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgICB1cDogcHJldlNpYmxpbmcsXG4gICAgICAgICAgICAgIG5leHQ6IGNsb3NlU3ViLFxuICAgICAgICAgICAgICBwcmV2aW91czogb3BlblN1YlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgeyAvLyBob3Jpem9udGFsIG1lbnVcbiAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgIG5leHQ6IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgcHJldmlvdXM6IHByZXZTaWJsaW5nLFxuICAgICAgICAgICAgZG93bjogb3BlblN1YixcbiAgICAgICAgICAgIHVwOiBjbG9zZVN1YlxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBub3QgdGFicyAtPiBvbmUgc3ViXG4gICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnKSB7IC8vIGxlZnQgYWxpZ25lZFxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgbmV4dDogb3BlblN1YixcbiAgICAgICAgICAgIHByZXZpb3VzOiBjbG9zZVN1YixcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7IC8vIHJpZ2h0IGFsaWduZWRcbiAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgIG5leHQ6IGNsb3NlU3ViLFxuICAgICAgICAgICAgcHJldmlvdXM6IG9wZW5TdWIsXG4gICAgICAgICAgICBkb3duOiBuZXh0U2libGluZyxcbiAgICAgICAgICAgIHVwOiBwcmV2U2libGluZ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnRHJvcGRvd25NZW51JywgZnVuY3Rpb25zKTtcblxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gZXZlbnQgaGFuZGxlciB0byB0aGUgYm9keSB0byBjbG9zZSBhbnkgZHJvcGRvd25zIG9uIGEgY2xpY2suXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEJvZHlIYW5kbGVyKCkge1xuICAgIHZhciAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSksXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAkYm9keS5vZmYoJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScpXG4gICAgICAgICAub24oJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgdmFyICRsaW5rID0gX3RoaXMuJGVsZW1lbnQuZmluZChlLnRhcmdldCk7XG4gICAgICAgICAgIGlmICgkbGluay5sZW5ndGgpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgICAgX3RoaXMuX2hpZGUoKTtcbiAgICAgICAgICAgJGJvZHkub2ZmKCdtb3VzZXVwLnpmLmRyb3Bkb3dubWVudSB0b3VjaGVuZC56Zi5kcm9wZG93bm1lbnUnKTtcbiAgICAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIGEgZHJvcGRvd24gcGFuZSwgYW5kIGNoZWNrcyBmb3IgY29sbGlzaW9ucyBmaXJzdC5cbiAgICogQHBhcmFtIHtqUXVlcnl9ICRzdWIgLSB1bCBlbGVtZW50IHRoYXQgaXMgYSBzdWJtZW51IHRvIHNob3dcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBmaXJlcyBEcm9wZG93bk1lbnUjc2hvd1xuICAgKi9cbiAgX3Nob3coJHN1Yikge1xuICAgIHZhciBpZHggPSB0aGlzLiR0YWJzLmluZGV4KHRoaXMuJHRhYnMuZmlsdGVyKGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICByZXR1cm4gJChlbCkuZmluZCgkc3ViKS5sZW5ndGggPiAwO1xuICAgIH0pKTtcbiAgICB2YXIgJHNpYnMgPSAkc3ViLnBhcmVudCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5zaWJsaW5ncygnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcbiAgICB0aGlzLl9oaWRlKCRzaWJzLCBpZHgpO1xuICAgICRzdWIuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpLmFkZENsYXNzKCdqcy1kcm9wZG93bi1hY3RpdmUnKS5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pXG4gICAgICAgIC5wYXJlbnQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpXG4gICAgICAgIC5hdHRyKHsnYXJpYS1leHBhbmRlZCc6IHRydWV9KTtcbiAgICB2YXIgY2xlYXIgPSBGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KCRzdWIsIG51bGwsIHRydWUpO1xuICAgIGlmICghY2xlYXIpIHtcbiAgICAgIHZhciBvbGRDbGFzcyA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdsZWZ0JyA/ICctcmlnaHQnIDogJy1sZWZ0JyxcbiAgICAgICAgICAkcGFyZW50TGkgPSAkc3ViLnBhcmVudCgnLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jyk7XG4gICAgICAkcGFyZW50TGkucmVtb3ZlQ2xhc3MoYG9wZW5zJHtvbGRDbGFzc31gKS5hZGRDbGFzcyhgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApO1xuICAgICAgY2xlYXIgPSBGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KCRzdWIsIG51bGwsIHRydWUpO1xuICAgICAgaWYgKCFjbGVhcikge1xuICAgICAgICAkcGFyZW50TGkucmVtb3ZlQ2xhc3MoYG9wZW5zLSR7dGhpcy5vcHRpb25zLmFsaWdubWVudH1gKS5hZGRDbGFzcygnb3BlbnMtaW5uZXInKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuY2hhbmdlZCA9IHRydWU7XG4gICAgfVxuICAgICRzdWIuY3NzKCd2aXNpYmlsaXR5JywgJycpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7IHRoaXMuX2FkZEJvZHlIYW5kbGVyKCk7IH1cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBuZXcgZHJvcGRvd24gcGFuZSBpcyB2aXNpYmxlLlxuICAgICAqIEBldmVudCBEcm9wZG93bk1lbnUjc2hvd1xuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2hvdy56Zi5kcm9wZG93bm1lbnUnLCBbJHN1Yl0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhpZGVzIGEgc2luZ2xlLCBjdXJyZW50bHkgb3BlbiBkcm9wZG93biBwYW5lLCBpZiBwYXNzZWQgYSBwYXJhbWV0ZXIsIG90aGVyd2lzZSwgaGlkZXMgZXZlcnl0aGluZy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbSAtIGVsZW1lbnQgd2l0aCBhIHN1Ym1lbnUgdG8gaGlkZVxuICAgKiBAcGFyYW0ge051bWJlcn0gaWR4IC0gaW5kZXggb2YgdGhlICR0YWJzIGNvbGxlY3Rpb24gdG8gaGlkZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2hpZGUoJGVsZW0sIGlkeCkge1xuICAgIHZhciAkdG9DbG9zZTtcbiAgICBpZiAoJGVsZW0gJiYgJGVsZW0ubGVuZ3RoKSB7XG4gICAgICAkdG9DbG9zZSA9ICRlbGVtO1xuICAgIH0gZWxzZSBpZiAoaWR4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICR0b0Nsb3NlID0gdGhpcy4kdGFicy5ub3QoZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAgcmV0dXJuIGkgPT09IGlkeDtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICR0b0Nsb3NlID0gdGhpcy4kZWxlbWVudDtcbiAgICB9XG4gICAgdmFyIHNvbWV0aGluZ1RvQ2xvc2UgPSAkdG9DbG9zZS5oYXNDbGFzcygnaXMtYWN0aXZlJykgfHwgJHRvQ2xvc2UuZmluZCgnLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDA7XG5cbiAgICBpZiAoc29tZXRoaW5nVG9DbG9zZSkge1xuICAgICAgJHRvQ2xvc2UuZmluZCgnbGkuaXMtYWN0aXZlJykuYWRkKCR0b0Nsb3NlKS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBmYWxzZSxcbiAgICAgICAgJ2RhdGEtaXMtY2xpY2snOiBmYWxzZVxuICAgICAgfSkucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuXG4gICAgICAkdG9DbG9zZS5maW5kKCd1bC5qcy1kcm9wZG93bi1hY3RpdmUnKS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZVxuICAgICAgfSkucmVtb3ZlQ2xhc3MoJ2pzLWRyb3Bkb3duLWFjdGl2ZScpO1xuXG4gICAgICBpZiAodGhpcy5jaGFuZ2VkIHx8ICR0b0Nsb3NlLmZpbmQoJ29wZW5zLWlubmVyJykubGVuZ3RoKSB7XG4gICAgICAgIHZhciBvbGRDbGFzcyA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdsZWZ0JyA/ICdyaWdodCcgOiAnbGVmdCc7XG4gICAgICAgICR0b0Nsb3NlLmZpbmQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuYWRkKCR0b0Nsb3NlKVxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhgb3BlbnMtaW5uZXIgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKGBvcGVucy0ke29sZENsYXNzfWApO1xuICAgICAgICB0aGlzLmNoYW5nZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgb3BlbiBtZW51cyBhcmUgY2xvc2VkLlxuICAgICAgICogQGV2ZW50IERyb3Bkb3duTWVudSNoaWRlXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignaGlkZS56Zi5kcm9wZG93bm1lbnUnLCBbJHRvQ2xvc2VdKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIHBsdWdpbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuJG1lbnVJdGVtcy5vZmYoJy56Zi5kcm9wZG93bm1lbnUnKS5yZW1vdmVBdHRyKCdkYXRhLWlzLWNsaWNrJylcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdpcy1yaWdodC1hcnJvdyBpcy1sZWZ0LWFycm93IGlzLWRvd24tYXJyb3cgb3BlbnMtcmlnaHQgb3BlbnMtbGVmdCBvcGVucy1pbm5lcicpO1xuICAgICQoZG9jdW1lbnQuYm9keSkub2ZmKCcuemYuZHJvcGRvd25tZW51Jyk7XG4gICAgRm91bmRhdGlvbi5OZXN0LkJ1cm4odGhpcy4kZWxlbWVudCwgJ2Ryb3Bkb3duJyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbi8qKlxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXG4gKi9cbkRyb3Bkb3duTWVudS5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIERpc2FsbG93cyBob3ZlciBldmVudHMgZnJvbSBvcGVuaW5nIHN1Ym1lbnVzXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGRpc2FibGVIb3ZlcjogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvdyBhIHN1Ym1lbnUgdG8gYXV0b21hdGljYWxseSBjbG9zZSBvbiBhIG1vdXNlbGVhdmUgZXZlbnQsIGlmIG5vdCBjbGlja2VkIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgYXV0b2Nsb3NlOiB0cnVlLFxuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gZGVsYXkgb3BlbmluZyBhIHN1Ym1lbnUgb24gaG92ZXIgZXZlbnQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgNTBcbiAgICovXG4gIGhvdmVyRGVsYXk6IDUwLFxuICAvKipcbiAgICogQWxsb3cgYSBzdWJtZW51IHRvIG9wZW4vcmVtYWluIG9wZW4gb24gcGFyZW50IGNsaWNrIGV2ZW50LiBBbGxvd3MgY3Vyc29yIHRvIG1vdmUgYXdheSBmcm9tIG1lbnUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xpY2tPcGVuOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGRlbGF5IGNsb3NpbmcgYSBzdWJtZW51IG9uIGEgbW91c2VsZWF2ZSBldmVudC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSA1MDBcbiAgICovXG5cbiAgY2xvc2luZ1RpbWU6IDUwMCxcbiAgLyoqXG4gICAqIFBvc2l0aW9uIG9mIHRoZSBtZW51IHJlbGF0aXZlIHRvIHdoYXQgZGlyZWN0aW9uIHRoZSBzdWJtZW51cyBzaG91bGQgb3Blbi4gSGFuZGxlZCBieSBKUy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnbGVmdCdcbiAgICovXG4gIGFsaWdubWVudDogJ2xlZnQnLFxuICAvKipcbiAgICogQWxsb3cgY2xpY2tzIG9uIHRoZSBib2R5IHRvIGNsb3NlIGFueSBvcGVuIHN1Ym1lbnVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gdmVydGljYWwgb3JpZW50ZWQgbWVudXMsIEZvdW5kYXRpb24gZGVmYXVsdCBpcyBgdmVydGljYWxgLiBVcGRhdGUgdGhpcyBpZiB1c2luZyB5b3VyIG93biBjbGFzcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAndmVydGljYWwnXG4gICAqL1xuICB2ZXJ0aWNhbENsYXNzOiAndmVydGljYWwnLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byByaWdodC1zaWRlIG9yaWVudGVkIG1lbnVzLCBGb3VuZGF0aW9uIGRlZmF1bHQgaXMgYGFsaWduLXJpZ2h0YC4gVXBkYXRlIHRoaXMgaWYgdXNpbmcgeW91ciBvd24gY2xhc3MuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2FsaWduLXJpZ2h0J1xuICAgKi9cbiAgcmlnaHRDbGFzczogJ2FsaWduLXJpZ2h0JyxcbiAgLyoqXG4gICAqIEJvb2xlYW4gdG8gZm9yY2Ugb3ZlcmlkZSB0aGUgY2xpY2tpbmcgb2YgbGlua3MgdG8gcGVyZm9ybSBkZWZhdWx0IGFjdGlvbiwgb24gc2Vjb25kIHRvdWNoIGV2ZW50IGZvciBtb2JpbGUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGZvcmNlRm9sbG93OiB0cnVlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oRHJvcGRvd25NZW51LCAnRHJvcGRvd25NZW51Jyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBSZXNwb25zaXZlTWVudSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnVcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5hY2NvcmRpb25NZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmRyaWxsZG93blxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5kcm9wZG93bi1tZW51XG4gKi9cblxuY2xhc3MgUmVzcG9uc2l2ZU1lbnUge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIHJlc3BvbnNpdmUgbWVudS5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlTWVudSNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93biBtZW51LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgdGhpcy5ydWxlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgncmVzcG9uc2l2ZS1tZW51Jyk7XG4gICAgdGhpcy5jdXJyZW50TXEgPSBudWxsO1xuICAgIHRoaXMuY3VycmVudFBsdWdpbiA9IG51bGw7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdSZXNwb25zaXZlTWVudScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBNZW51IGJ5IHBhcnNpbmcgdGhlIGNsYXNzZXMgZnJvbSB0aGUgJ2RhdGEtUmVzcG9uc2l2ZU1lbnUnIGF0dHJpYnV0ZSBvbiB0aGUgZWxlbWVudC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgcnVsZXNUcmVlID0ge307XG5cbiAgICAvLyBQYXJzZSBydWxlcyBmcm9tIFwiY2xhc3Nlc1wiIGluIGRhdGEgYXR0cmlidXRlXG4gICAgdmFyIHJ1bGVzID0gdGhpcy5ydWxlcy5zcGxpdCgnICcpO1xuXG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGV2ZXJ5IHJ1bGUgZm91bmRcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcnVsZSA9IHJ1bGVzW2ldLnNwbGl0KCctJyk7XG4gICAgICB2YXIgcnVsZVNpemUgPSBydWxlLmxlbmd0aCA+IDEgPyBydWxlWzBdIDogJ3NtYWxsJztcbiAgICAgIHZhciBydWxlUGx1Z2luID0gcnVsZS5sZW5ndGggPiAxID8gcnVsZVsxXSA6IHJ1bGVbMF07XG5cbiAgICAgIGlmIChNZW51UGx1Z2luc1tydWxlUGx1Z2luXSAhPT0gbnVsbCkge1xuICAgICAgICBydWxlc1RyZWVbcnVsZVNpemVdID0gTWVudVBsdWdpbnNbcnVsZVBsdWdpbl07XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5ydWxlcyA9IHJ1bGVzVHJlZTtcblxuICAgIGlmICghJC5pc0VtcHR5T2JqZWN0KHJ1bGVzVHJlZSkpIHtcbiAgICAgIHRoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgdGhlIE1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xuICAgIH0pO1xuICAgIC8vICQod2luZG93KS5vbigncmVzaXplLnpmLlJlc3BvbnNpdmVNZW51JywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICBfdGhpcy5fY2hlY2tNZWRpYVF1ZXJpZXMoKTtcbiAgICAvLyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIGN1cnJlbnQgc2NyZWVuIHdpZHRoIGFnYWluc3QgYXZhaWxhYmxlIG1lZGlhIHF1ZXJpZXMuIElmIHRoZSBtZWRpYSBxdWVyeSBoYXMgY2hhbmdlZCwgYW5kIHRoZSBwbHVnaW4gbmVlZGVkIGhhcyBjaGFuZ2VkLCB0aGUgcGx1Z2lucyB3aWxsIHN3YXAgb3V0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9jaGVja01lZGlhUXVlcmllcygpIHtcbiAgICB2YXIgbWF0Y2hlZE1xLCBfdGhpcyA9IHRoaXM7XG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggcnVsZSBhbmQgZmluZCB0aGUgbGFzdCBtYXRjaGluZyBydWxlXG4gICAgJC5lYWNoKHRoaXMucnVsZXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KGtleSkpIHtcbiAgICAgICAgbWF0Y2hlZE1xID0ga2V5O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTm8gbWF0Y2g/IE5vIGRpY2VcbiAgICBpZiAoIW1hdGNoZWRNcSkgcmV0dXJuO1xuXG4gICAgLy8gUGx1Z2luIGFscmVhZHkgaW5pdGlhbGl6ZWQ/IFdlIGdvb2RcbiAgICBpZiAodGhpcy5jdXJyZW50UGx1Z2luIGluc3RhbmNlb2YgdGhpcy5ydWxlc1ttYXRjaGVkTXFdLnBsdWdpbikgcmV0dXJuO1xuXG4gICAgLy8gUmVtb3ZlIGV4aXN0aW5nIHBsdWdpbi1zcGVjaWZpYyBDU1MgY2xhc3Nlc1xuICAgICQuZWFjaChNZW51UGx1Z2lucywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgX3RoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3ModmFsdWUuY3NzQ2xhc3MpO1xuICAgIH0pO1xuXG4gICAgLy8gQWRkIHRoZSBDU1MgY2xhc3MgZm9yIHRoZSBuZXcgcGx1Z2luXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLnJ1bGVzW21hdGNoZWRNcV0uY3NzQ2xhc3MpO1xuXG4gICAgLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBuZXcgcGx1Z2luXG4gICAgaWYgKHRoaXMuY3VycmVudFBsdWdpbikgdGhpcy5jdXJyZW50UGx1Z2luLmRlc3Ryb3koKTtcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4gPSBuZXcgdGhpcy5ydWxlc1ttYXRjaGVkTXFdLnBsdWdpbih0aGlzLiRlbGVtZW50LCB7fSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGluc3RhbmNlIG9mIHRoZSBjdXJyZW50IHBsdWdpbiBvbiB0aGlzIGVsZW1lbnQsIGFzIHdlbGwgYXMgdGhlIHdpbmRvdyByZXNpemUgaGFuZGxlciB0aGF0IHN3aXRjaGVzIHRoZSBwbHVnaW5zIG91dC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY3VycmVudFBsdWdpbi5kZXN0cm95KCk7XG4gICAgJCh3aW5kb3cpLm9mZignLnpmLlJlc3BvbnNpdmVNZW51Jyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblJlc3BvbnNpdmVNZW51LmRlZmF1bHRzID0ge307XG5cbi8vIFRoZSBwbHVnaW4gbWF0Y2hlcyB0aGUgcGx1Z2luIGNsYXNzZXMgd2l0aCB0aGVzZSBwbHVnaW4gaW5zdGFuY2VzLlxudmFyIE1lbnVQbHVnaW5zID0ge1xuICBkcm9wZG93bjoge1xuICAgIGNzc0NsYXNzOiAnZHJvcGRvd24nLFxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snZHJvcGRvd24tbWVudSddIHx8IG51bGxcbiAgfSxcbiBkcmlsbGRvd246IHtcbiAgICBjc3NDbGFzczogJ2RyaWxsZG93bicsXG4gICAgcGx1Z2luOiBGb3VuZGF0aW9uLl9wbHVnaW5zWydkcmlsbGRvd24nXSB8fCBudWxsXG4gIH0sXG4gIGFjY29yZGlvbjoge1xuICAgIGNzc0NsYXNzOiAnYWNjb3JkaW9uLW1lbnUnLFxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snYWNjb3JkaW9uLW1lbnUnXSB8fCBudWxsXG4gIH1cbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihSZXNwb25zaXZlTWVudSwgJ1Jlc3BvbnNpdmVNZW51Jyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBSZXNwb25zaXZlVG9nZ2xlIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5yZXNwb25zaXZlVG9nZ2xlXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqL1xuXG5jbGFzcyBSZXNwb25zaXZlVG9nZ2xlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgVGFiIEJhci5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlVG9nZ2xlI2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGF0dGFjaCB0YWIgYmFyIGZ1bmN0aW9uYWxpdHkgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgUmVzcG9uc2l2ZVRvZ2dsZS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnUmVzcG9uc2l2ZVRvZ2dsZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSB0YWIgYmFyIGJ5IGZpbmRpbmcgdGhlIHRhcmdldCBlbGVtZW50LCB0b2dnbGluZyBlbGVtZW50LCBhbmQgcnVubmluZyB1cGRhdGUoKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgdGFyZ2V0SUQgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3Jlc3BvbnNpdmUtdG9nZ2xlJyk7XG4gICAgaWYgKCF0YXJnZXRJRCkge1xuICAgICAgY29uc29sZS5lcnJvcignWW91ciB0YWIgYmFyIG5lZWRzIGFuIElEIG9mIGEgTWVudSBhcyB0aGUgdmFsdWUgb2YgZGF0YS10YWItYmFyLicpO1xuICAgIH1cblxuICAgIHRoaXMuJHRhcmdldE1lbnUgPSAkKGAjJHt0YXJnZXRJRH1gKTtcbiAgICB0aGlzLiR0b2dnbGVyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS10b2dnbGVdJyk7XG5cbiAgICB0aGlzLl91cGRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIG5lY2Vzc2FyeSBldmVudCBoYW5kbGVycyBmb3IgdGhlIHRhYiBiYXIgdG8gd29yay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIHRoaXMuX3VwZGF0ZS5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMuJHRvZ2dsZXIub24oJ2NsaWNrLnpmLnJlc3BvbnNpdmVUb2dnbGUnLCB0aGlzLnRvZ2dsZU1lbnUuYmluZCh0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjdXJyZW50IG1lZGlhIHF1ZXJ5IHRvIGRldGVybWluZSBpZiB0aGUgdGFiIGJhciBzaG91bGQgYmUgdmlzaWJsZSBvciBoaWRkZW4uXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3VwZGF0ZSgpIHtcbiAgICAvLyBNb2JpbGVcbiAgICBpZiAoIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5oaWRlRm9yKSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5zaG93KCk7XG4gICAgICB0aGlzLiR0YXJnZXRNZW51LmhpZGUoKTtcbiAgICB9XG5cbiAgICAvLyBEZXNrdG9wXG4gICAgZWxzZSB7XG4gICAgICB0aGlzLiRlbGVtZW50LmhpZGUoKTtcbiAgICAgIHRoaXMuJHRhcmdldE1lbnUuc2hvdygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyLiBUaGUgdG9nZ2xlIG9ubHkgaGFwcGVucyBpZiB0aGUgc2NyZWVuIGlzIHNtYWxsIGVub3VnaCB0byBhbGxvdyBpdC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlVG9nZ2xlI3RvZ2dsZWRcbiAgICovXG4gIHRvZ2dsZU1lbnUoKSB7XG4gICAgaWYgKCFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuaGlkZUZvcikpIHtcbiAgICAgIHRoaXMuJHRhcmdldE1lbnUudG9nZ2xlKDApO1xuXG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIGVsZW1lbnQgYXR0YWNoZWQgdG8gdGhlIHRhYiBiYXIgdG9nZ2xlcy5cbiAgICAgICAqIEBldmVudCBSZXNwb25zaXZlVG9nZ2xlI3RvZ2dsZWRcbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd0b2dnbGVkLnpmLnJlc3BvbnNpdmVUb2dnbGUnKTtcbiAgICB9XG4gIH07XG5cbiAgZGVzdHJveSgpIHtcbiAgICAvL1RPRE8gdGhpcy4uLlxuICB9XG59XG5cblJlc3BvbnNpdmVUb2dnbGUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBUaGUgYnJlYWtwb2ludCBhZnRlciB3aGljaCB0aGUgbWVudSBpcyBhbHdheXMgc2hvd24sIGFuZCB0aGUgdGFiIGJhciBpcyBoaWRkZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ21lZGl1bSdcbiAgICovXG4gIGhpZGVGb3I6ICdtZWRpdW0nXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oUmVzcG9uc2l2ZVRvZ2dsZSwgJ1Jlc3BvbnNpdmVUb2dnbGUnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIFJldmVhbCBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ucmV2ZWFsXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvbiBpZiB1c2luZyBhbmltYXRpb25zXG4gKi9cblxuY2xhc3MgUmV2ZWFsIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgUmV2ZWFsLlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHVzZSBmb3IgdGhlIG1vZGFsLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIG9wdGlvbmFsIHBhcmFtZXRlcnMuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFJldmVhbC5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1JldmVhbCcpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ1JldmVhbCcsIHtcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxuICAgICAgJ1RBQic6ICd0YWJfZm9yd2FyZCcsXG4gICAgICAnU0hJRlRfVEFCJzogJ3RhYl9iYWNrd2FyZCdcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgbW9kYWwgYnkgYWRkaW5nIHRoZSBvdmVybGF5IGFuZCBjbG9zZSBidXR0b25zLCAoaWYgc2VsZWN0ZWQpLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdGhpcy5pZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2U7XG4gICAgdGhpcy5jYWNoZWQgPSB7bXE6IEZvdW5kYXRpb24uTWVkaWFRdWVyeS5jdXJyZW50fTtcbiAgICB0aGlzLmlzaU9TID0gaVBob25lU25pZmYoKTtcblxuICAgIGlmKHRoaXMuaXNpT1MpeyB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdpcy1pb3MnKTsgfVxuXG4gICAgdGhpcy4kYW5jaG9yID0gJChgW2RhdGEtb3Blbj1cIiR7dGhpcy5pZH1cIl1gKS5sZW5ndGggPyAkKGBbZGF0YS1vcGVuPVwiJHt0aGlzLmlkfVwiXWApIDogJChgW2RhdGEtdG9nZ2xlPVwiJHt0aGlzLmlkfVwiXWApO1xuXG4gICAgaWYgKHRoaXMuJGFuY2hvci5sZW5ndGgpIHtcbiAgICAgIHZhciBhbmNob3JJZCA9IHRoaXMuJGFuY2hvclswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdyZXZlYWwnKTtcblxuICAgICAgdGhpcy4kYW5jaG9yLmF0dHIoe1xuICAgICAgICAnYXJpYS1jb250cm9scyc6IHRoaXMuaWQsXG4gICAgICAgICdpZCc6IGFuY2hvcklkLFxuICAgICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXG4gICAgICAgICd0YWJpbmRleCc6IDBcbiAgICAgIH0pO1xuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKHsnYXJpYS1sYWJlbGxlZGJ5JzogYW5jaG9ySWR9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4gfHwgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnZnVsbCcpKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuZnVsbFNjcmVlbiA9IHRydWU7XG4gICAgICB0aGlzLm9wdGlvbnMub3ZlcmxheSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgIXRoaXMuJG92ZXJsYXkpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkgPSB0aGlzLl9tYWtlT3ZlcmxheSh0aGlzLmlkKTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xuICAgICAgICAncm9sZSc6ICdkaWFsb2cnLFxuICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxuICAgICAgICAnZGF0YS15ZXRpLWJveCc6IHRoaXMuaWQsXG4gICAgICAgICdkYXRhLXJlc2l6ZSc6IHRoaXMuaWRcbiAgICB9KTtcblxuICAgIGlmKHRoaXMuJG92ZXJsYXkpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuZGV0YWNoKCkuYXBwZW5kVG8odGhpcy4kb3ZlcmxheSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuZGV0YWNoKCkuYXBwZW5kVG8oJCgnYm9keScpKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ3dpdGhvdXQtb3ZlcmxheScpO1xuICAgIH1cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rICYmIHdpbmRvdy5sb2NhdGlvbi5oYXNoID09PSAoIGAjJHt0aGlzLmlkfWApKSB7XG4gICAgICAkKHdpbmRvdykub25lKCdsb2FkLnpmLnJldmVhbCcsIHRoaXMub3Blbi5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvdmVybGF5IGRpdiB0byBkaXNwbGF5IGJlaGluZCB0aGUgbW9kYWwuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfbWFrZU92ZXJsYXkoaWQpIHtcbiAgICB2YXIgJG92ZXJsYXkgPSAkKCc8ZGl2PjwvZGl2PicpXG4gICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygncmV2ZWFsLW92ZXJsYXknKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cih7J3RhYmluZGV4JzogLTEsICdhcmlhLWhpZGRlbic6IHRydWV9KVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8oJ2JvZHknKTtcbiAgICByZXR1cm4gJG92ZXJsYXk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBwb3NpdGlvbiBvZiBtb2RhbFxuICAgKiBUT0RPOiAgRmlndXJlIG91dCBpZiB3ZSBhY3R1YWxseSBuZWVkIHRvIGNhY2hlIHRoZXNlIHZhbHVlcyBvciBpZiBpdCBkb2Vzbid0IG1hdHRlclxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3VwZGF0ZVBvc2l0aW9uKCkge1xuICAgIHZhciB3aWR0aCA9IHRoaXMuJGVsZW1lbnQub3V0ZXJXaWR0aCgpO1xuICAgIHZhciBvdXRlcldpZHRoID0gJCh3aW5kb3cpLndpZHRoKCk7XG4gICAgdmFyIGhlaWdodCA9IHRoaXMuJGVsZW1lbnQub3V0ZXJIZWlnaHQoKTtcbiAgICB2YXIgb3V0ZXJIZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCk7XG4gICAgdmFyIGxlZnQgPSBwYXJzZUludCgob3V0ZXJXaWR0aCAtIHdpZHRoKSAvIDIsIDEwKTtcbiAgICB2YXIgdG9wO1xuICAgIGlmIChoZWlnaHQgPiBvdXRlckhlaWdodCkge1xuICAgICAgdG9wID0gcGFyc2VJbnQoTWF0aC5taW4oMTAwLCBvdXRlckhlaWdodCAvIDEwKSwgMTApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0b3AgPSBwYXJzZUludCgob3V0ZXJIZWlnaHQgLSBoZWlnaHQpIC8gNCwgMTApO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LmNzcyh7dG9wOiB0b3AgKyAncHgnfSk7XG4gICAgLy8gb25seSB3b3JyeSBhYm91dCBsZWZ0IGlmIHdlIGRvbid0IGhhdmUgYW4gb3ZlcmxheSwgb3RoZXJ3aXNlIHdlJ3JlIHBlcmZlY3RseSBpbiB0aGUgbWlkZGxlXG4gICAgaWYoIXRoaXMuJG92ZXJsYXkpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtsZWZ0OiBsZWZ0ICsgJ3B4J30pO1xuICAgIH1cblxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBtb2RhbC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuX3VwZGF0ZVBvc2l0aW9uKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy4kYW5jaG9yLmxlbmd0aCkge1xuICAgICAgdGhpcy4kYW5jaG9yLm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUud2hpY2ggPT09IDEzIHx8IGUud2hpY2ggPT09IDMyKSB7XG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiB0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgdGhpcy4kb3ZlcmxheS5vZmYoJy56Zi5yZXZlYWwnKS5vbignY2xpY2suemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS50YXJnZXQgPT09IF90aGlzLiRlbGVtZW50WzBdIHx8ICQuY29udGFpbnMoX3RoaXMuJGVsZW1lbnRbMF0sIGUudGFyZ2V0KSkgeyByZXR1cm47IH1cbiAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICAkKHdpbmRvdykub24oYHBvcHN0YXRlLnpmLnJldmVhbDoke3RoaXMuaWR9YCwgdGhpcy5faGFuZGxlU3RhdGUuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgbW9kYWwgbWV0aG9kcyBvbiBiYWNrL2ZvcndhcmQgYnV0dG9uIGNsaWNrcyBvciBhbnkgb3RoZXIgZXZlbnQgdGhhdCB0cmlnZ2VycyBwb3BzdGF0ZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9oYW5kbGVTdGF0ZShlKSB7XG4gICAgaWYod2luZG93LmxvY2F0aW9uLmhhc2ggPT09ICggJyMnICsgdGhpcy5pZCkgJiYgIXRoaXMuaXNBY3RpdmUpeyB0aGlzLm9wZW4oKTsgfVxuICAgIGVsc2V7IHRoaXMuY2xvc2UoKTsgfVxuICB9XG5cblxuICAvKipcbiAgICogT3BlbnMgdGhlIG1vZGFsIGNvbnRyb2xsZWQgYnkgYHRoaXMuJGFuY2hvcmAsIGFuZCBjbG9zZXMgYWxsIG90aGVycyBieSBkZWZhdWx0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFJldmVhbCNjbG9zZW1lXG4gICAqIEBmaXJlcyBSZXZlYWwjb3BlblxuICAgKi9cbiAgb3BlbigpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICB2YXIgaGFzaCA9IGAjJHt0aGlzLmlkfWA7XG5cbiAgICAgIGlmICh3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUpIHtcbiAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIGhhc2gpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBoYXNoO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xuXG4gICAgLy8gTWFrZSBlbGVtZW50cyBpbnZpc2libGUsIGJ1dCByZW1vdmUgZGlzcGxheTogbm9uZSBzbyB3ZSBjYW4gZ2V0IHNpemUgYW5kIHBvc2l0aW9uaW5nXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAuY3NzKHsgJ3Zpc2liaWxpdHknOiAnaGlkZGVuJyB9KVxuICAgICAgICAuc2hvdygpXG4gICAgICAgIC5zY3JvbGxUb3AoMCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmNzcyh7J3Zpc2liaWxpdHknOiAnaGlkZGVuJ30pLnNob3coKTtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVQb3NpdGlvbigpO1xuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLmhpZGUoKVxuICAgICAgLmNzcyh7ICd2aXNpYmlsaXR5JzogJycgfSk7XG5cbiAgICBpZih0aGlzLiRvdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmNzcyh7J3Zpc2liaWxpdHknOiAnJ30pLmhpZGUoKTtcbiAgICB9XG5cblxuICAgIGlmICghdGhpcy5vcHRpb25zLm11bHRpcGxlT3BlbmVkKSB7XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgbW9kYWwgb3BlbnMuXG4gICAgICAgKiBDbG9zZXMgYW55IG90aGVyIG1vZGFscyB0aGF0IGFyZSBjdXJyZW50bHkgb3BlblxuICAgICAgICogQGV2ZW50IFJldmVhbCNjbG9zZW1lXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VtZS56Zi5yZXZlYWwnLCB0aGlzLmlkKTtcbiAgICB9XG5cbiAgICAvLyBNb3Rpb24gVUkgbWV0aG9kIG9mIHJldmVhbFxuICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uSW4pIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4odGhpcy4kb3ZlcmxheSwgJ2ZhZGUtaW4nKTtcbiAgICAgIH1cbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbih0aGlzLiRlbGVtZW50LCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uSW4sIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmZvY3VzYWJsZUVsZW1lbnRzID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKHRoaXMuJGVsZW1lbnQpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGpRdWVyeSBtZXRob2Qgb2YgcmV2ZWFsXG4gICAgZWxzZSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcbiAgICAgICAgdGhpcy4kb3ZlcmxheS5zaG93KDApO1xuICAgICAgfVxuICAgICAgdGhpcy4kZWxlbWVudC5zaG93KHRoaXMub3B0aW9ucy5zaG93RGVsYXkpO1xuICAgIH1cblxuICAgIC8vIGhhbmRsZSBhY2Nlc3NpYmlsaXR5XG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLmF0dHIoe1xuICAgICAgICAnYXJpYS1oaWRkZW4nOiBmYWxzZSxcbiAgICAgICAgJ3RhYmluZGV4JzogLTFcbiAgICAgIH0pXG4gICAgICAuZm9jdXMoKTtcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG1vZGFsIGhhcyBzdWNjZXNzZnVsbHkgb3BlbmVkLlxuICAgICAqIEBldmVudCBSZXZlYWwjb3BlblxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb3Blbi56Zi5yZXZlYWwnKTtcblxuICAgIGlmICh0aGlzLmlzaU9TKSB7XG4gICAgICB2YXIgc2Nyb2xsUG9zID0gd2luZG93LnBhZ2VZT2Zmc2V0O1xuICAgICAgJCgnaHRtbCwgYm9keScpLmFkZENsYXNzKCdpcy1yZXZlYWwtb3BlbicpLnNjcm9sbFRvcChzY3JvbGxQb3MpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICQoJ2JvZHknKS5hZGRDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKTtcbiAgICB9XG5cbiAgICAkKCdib2R5JylcbiAgICAgIC5hZGRDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKVxuICAgICAgLmF0dHIoJ2FyaWEtaGlkZGVuJywgKHRoaXMub3B0aW9ucy5vdmVybGF5IHx8IHRoaXMub3B0aW9ucy5mdWxsU2NyZWVuKSA/IHRydWUgOiBmYWxzZSk7XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuX2V4dHJhSGFuZGxlcnMoKTtcbiAgICB9LCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV4dHJhIGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgYm9keSBhbmQgd2luZG93IGlmIG5lY2Vzc2FyeS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9leHRyYUhhbmRsZXJzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy5mb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgdGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiAhdGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4pIHtcbiAgICAgICQoJ2JvZHknKS5vbignY2xpY2suemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS50YXJnZXQgPT09IF90aGlzLiRlbGVtZW50WzBdIHx8ICQuY29udGFpbnMoX3RoaXMuJGVsZW1lbnRbMF0sIGUudGFyZ2V0KSkgeyByZXR1cm47IH1cbiAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkVzYykge1xuICAgICAgJCh3aW5kb3cpLm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ1JldmVhbCcsIHtcbiAgICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5jbG9zZU9uRXNjKSB7XG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMubGVuZ3RoID09PSAwKSB7IC8vIG5vIGZvY3VzYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIG1vZGFsIGF0IGFsbCwgcHJldmVudCB0YWJiaW5nIGluIGdlbmVyYWxcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIGxvY2sgZm9jdXMgd2l0aGluIG1vZGFsIHdoaWxlIHRhYmJpbmdcbiAgICB0aGlzLiRlbGVtZW50Lm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkdGFyZ2V0ID0gJCh0aGlzKTtcbiAgICAgIC8vIGhhbmRsZSBrZXlib2FyZCBldmVudCB3aXRoIGtleWJvYXJkIHV0aWxcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdSZXZlYWwnLCB7XG4gICAgICAgIHRhYl9mb3J3YXJkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXMoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpKSkgeyAvLyBsZWZ0IG1vZGFsIGRvd253YXJkcywgc2V0dGluZyBmb2N1cyB0byBmaXJzdCBlbGVtZW50XG4gICAgICAgICAgICBfdGhpcy5mb2N1c2FibGVFbGVtZW50cy5lcSgwKS5mb2N1cygpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGFiX2JhY2t3YXJkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXMoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMuZXEoMCkpIHx8IF90aGlzLiRlbGVtZW50LmlzKCc6Zm9jdXMnKSkgeyAvLyBsZWZ0IG1vZGFsIHVwd2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gbGFzdCBlbGVtZW50XG4gICAgICAgICAgICBfdGhpcy5mb2N1c2FibGVFbGVtZW50cy5lcSgtMSkuZm9jdXMoKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyhfdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1jbG9zZV0nKSkpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIHNldCBmb2N1cyBiYWNrIHRvIGFuY2hvciBpZiBjbG9zZSBidXR0b24gaGFzIGJlZW4gYWN0aXZhdGVkXG4gICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcbiAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoJHRhcmdldC5pcyhfdGhpcy5mb2N1c2FibGVFbGVtZW50cykpIHsgLy8gZG9udCd0IHRyaWdnZXIgaWYgYWN1YWwgZWxlbWVudCBoYXMgZm9jdXMgKGkuZS4gaW5wdXRzLCBsaW5rcywgLi4uKVxuICAgICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmNsb3NlT25Fc2MpIHtcbiAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmZvY3VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIG1vZGFsLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFJldmVhbCNjbG9zZWRcbiAgICovXG4gIGNsb3NlKCkge1xuICAgIGlmICghdGhpcy5pc0FjdGl2ZSB8fCAhdGhpcy4kZWxlbWVudC5pcygnOnZpc2libGUnKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gTW90aW9uIFVJIG1ldGhvZCBvZiBoaWRpbmdcbiAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGlvbk91dCkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQodGhpcy4kb3ZlcmxheSwgJ2ZhZGUtb3V0JywgZmluaXNoVXApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGZpbmlzaFVwKCk7XG4gICAgICB9XG5cbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQodGhpcy4kZWxlbWVudCwgdGhpcy5vcHRpb25zLmFuaW1hdGlvbk91dCk7XG4gICAgfVxuICAgIC8vIGpRdWVyeSBtZXRob2Qgb2YgaGlkaW5nXG4gICAgZWxzZSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcbiAgICAgICAgdGhpcy4kb3ZlcmxheS5oaWRlKDAsIGZpbmlzaFVwKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBmaW5pc2hVcCgpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLiRlbGVtZW50LmhpZGUodGhpcy5vcHRpb25zLmhpZGVEZWxheSk7XG4gICAgfVxuXG4gICAgLy8gQ29uZGl0aW9uYWxzIHRvIHJlbW92ZSBleHRyYSBldmVudCBsaXN0ZW5lcnMgYWRkZWQgb24gb3BlblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkVzYykge1xuICAgICAgJCh3aW5kb3cpLm9mZigna2V5ZG93bi56Zi5yZXZlYWwnKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5vdmVybGF5ICYmIHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHtcbiAgICAgICQoJ2JvZHknKS5vZmYoJ2NsaWNrLnpmLnJldmVhbCcpO1xuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdrZXlkb3duLnpmLnJldmVhbCcpO1xuXG4gICAgZnVuY3Rpb24gZmluaXNoVXAoKSB7XG4gICAgICBpZiAoX3RoaXMuaXNpT1MpIHtcbiAgICAgICAgJCgnaHRtbCwgYm9keScpLnJlbW92ZUNsYXNzKCdpcy1yZXZlYWwtb3BlbicpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKTtcbiAgICAgIH1cblxuICAgICAgJCgnYm9keScpLmF0dHIoe1xuICAgICAgICAnYXJpYS1oaWRkZW4nOiBmYWxzZSxcbiAgICAgICAgJ3RhYmluZGV4JzogJydcbiAgICAgIH0pO1xuXG4gICAgICBfdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpO1xuXG4gICAgICAvKipcbiAgICAgICogRmlyZXMgd2hlbiB0aGUgbW9kYWwgaXMgZG9uZSBjbG9zaW5nLlxuICAgICAgKiBAZXZlbnQgUmV2ZWFsI2Nsb3NlZFxuICAgICAgKi9cbiAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlZC56Zi5yZXZlYWwnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIFJlc2V0cyB0aGUgbW9kYWwgY29udGVudFxuICAgICogVGhpcyBwcmV2ZW50cyBhIHJ1bm5pbmcgdmlkZW8gdG8ga2VlcCBnb2luZyBpbiB0aGUgYmFja2dyb3VuZFxuICAgICovXG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZXNldE9uQ2xvc2UpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuaHRtbCh0aGlzLiRlbGVtZW50Lmh0bWwoKSk7XG4gICAgfVxuXG4gICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xuICAgICBpZiAoX3RoaXMub3B0aW9ucy5kZWVwTGluaykge1xuICAgICAgIGlmICh3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUpIHtcbiAgICAgICAgIHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZShcIlwiLCBkb2N1bWVudC50aXRsZSwgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcbiAgICAgICB9IGVsc2Uge1xuICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnJztcbiAgICAgICB9XG4gICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBvcGVuL2Nsb3NlZCBzdGF0ZSBvZiBhIG1vZGFsLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHRvZ2dsZSgpIHtcbiAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGEgbW9kYWwuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkuaGlkZSgpLm9mZigpLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LmhpZGUoKS5vZmYoKTtcbiAgICB0aGlzLiRhbmNob3Iub2ZmKCcuemYnKTtcbiAgICAkKHdpbmRvdykub2ZmKGAuemYucmV2ZWFsOiR7dGhpcy5pZH1gKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfTtcbn1cblxuUmV2ZWFsLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogTW90aW9uLVVJIGNsYXNzIHRvIHVzZSBmb3IgYW5pbWF0ZWQgZWxlbWVudHMuIElmIG5vbmUgdXNlZCwgZGVmYXVsdHMgdG8gc2ltcGxlIHNob3cvaGlkZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnc2xpZGUtaW4tbGVmdCdcbiAgICovXG4gIGFuaW1hdGlvbkluOiAnJyxcbiAgLyoqXG4gICAqIE1vdGlvbi1VSSBjbGFzcyB0byB1c2UgZm9yIGFuaW1hdGVkIGVsZW1lbnRzLiBJZiBub25lIHVzZWQsIGRlZmF1bHRzIHRvIHNpbXBsZSBzaG93L2hpZGUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3NsaWRlLW91dC1yaWdodCdcbiAgICovXG4gIGFuaW1hdGlvbk91dDogJycsXG4gIC8qKlxuICAgKiBUaW1lLCBpbiBtcywgdG8gZGVsYXkgdGhlIG9wZW5pbmcgb2YgYSBtb2RhbCBhZnRlciBhIGNsaWNrIGlmIG5vIGFuaW1hdGlvbiB1c2VkLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEwXG4gICAqL1xuICBzaG93RGVsYXk6IDAsXG4gIC8qKlxuICAgKiBUaW1lLCBpbiBtcywgdG8gZGVsYXkgdGhlIGNsb3Npbmcgb2YgYSBtb2RhbCBhZnRlciBhIGNsaWNrIGlmIG5vIGFuaW1hdGlvbiB1c2VkLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEwXG4gICAqL1xuICBoaWRlRGVsYXk6IDAsXG4gIC8qKlxuICAgKiBBbGxvd3MgYSBjbGljayBvbiB0aGUgYm9keS9vdmVybGF5IHRvIGNsb3NlIHRoZSBtb2RhbC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IHRydWUsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGNsb3NlIGlmIHRoZSB1c2VyIHByZXNzZXMgdGhlIGBFU0NBUEVgIGtleS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uRXNjOiB0cnVlLFxuICAvKipcbiAgICogSWYgdHJ1ZSwgYWxsb3dzIG11bHRpcGxlIG1vZGFscyB0byBiZSBkaXNwbGF5ZWQgYXQgb25jZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgbXVsdGlwbGVPcGVuZWQ6IGZhbHNlLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIG1vZGFsIHNob3VsZCBwdXNoIGRvd24gZnJvbSB0aGUgdG9wIG9mIHRoZSBzY3JlZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMTAwXG4gICAqL1xuICB2T2Zmc2V0OiAxMDAsXG4gIC8qKlxuICAgKiBEaXN0YW5jZSwgaW4gcGl4ZWxzLCB0aGUgbW9kYWwgc2hvdWxkIHB1c2ggaW4gZnJvbSB0aGUgc2lkZSBvZiB0aGUgc2NyZWVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDBcbiAgICovXG4gIGhPZmZzZXQ6IDAsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGJlIGZ1bGxzY3JlZW4sIGNvbXBsZXRlbHkgYmxvY2tpbmcgb3V0IHRoZSByZXN0IG9mIHRoZSB2aWV3LiBKUyBjaGVja3MgZm9yIHRoaXMgYXMgd2VsbC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZnVsbFNjcmVlbjogZmFsc2UsXG4gIC8qKlxuICAgKiBQZXJjZW50YWdlIG9mIHNjcmVlbiBoZWlnaHQgdGhlIG1vZGFsIHNob3VsZCBwdXNoIHVwIGZyb20gdGhlIGJvdHRvbSBvZiB0aGUgdmlldy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxMFxuICAgKi9cbiAgYnRtT2Zmc2V0UGN0OiAxMCxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gZ2VuZXJhdGUgYW4gb3ZlcmxheSBkaXYsIHdoaWNoIHdpbGwgY292ZXIgdGhlIHZpZXcgd2hlbiBtb2RhbCBvcGVucy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBvdmVybGF5OiB0cnVlLFxuICAvKipcbiAgICogQWxsb3dzIHRoZSBtb2RhbCB0byByZW1vdmUgYW5kIHJlaW5qZWN0IG1hcmt1cCBvbiBjbG9zZS4gU2hvdWxkIGJlIHRydWUgaWYgdXNpbmcgdmlkZW8gZWxlbWVudHMgdy9vIHVzaW5nIHByb3ZpZGVyJ3MgYXBpLCBvdGhlcndpc2UsIHZpZGVvcyB3aWxsIGNvbnRpbnVlIHRvIHBsYXkgaW4gdGhlIGJhY2tncm91bmQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIHJlc2V0T25DbG9zZTogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGFsdGVyIHRoZSB1cmwgb24gb3Blbi9jbG9zZSwgYW5kIGFsbG93cyB0aGUgdXNlIG9mIHRoZSBgYmFja2AgYnV0dG9uIHRvIGNsb3NlIG1vZGFscy4gQUxTTywgYWxsb3dzIGEgbW9kYWwgdG8gYXV0by1tYW5pYWNhbGx5IG9wZW4gb24gcGFnZSBsb2FkIElGIHRoZSBoYXNoID09PSB0aGUgbW9kYWwncyB1c2VyLXNldCBpZC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZGVlcExpbms6IGZhbHNlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oUmV2ZWFsLCAnUmV2ZWFsJyk7XG5cbmZ1bmN0aW9uIGlQaG9uZVNuaWZmKCkge1xuICByZXR1cm4gL2lQKGFkfGhvbmV8b2QpLipPUy8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59XG5cbn0oalF1ZXJ5KTtcbiIsIi8qIS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBWZWdhcyAtIEZ1bGxzY3JlZW4gQmFja2dyb3VuZHMgYW5kIFNsaWRlc2hvd3MuXG4gKiB2Mi4yLjAgLSBidWlsdCAyMDE2LTAxLTE4XG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4gKiBodHRwOi8vdmVnYXMuamF5c2FsdmF0LmNvbS9cbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIENvcHlyaWdodCAoQykgMjAxMC0yMDE2IEpheSBTYWx2YXRcbiAqIGh0dHA6Ly9qYXlzYWx2YXQuY29tL1xuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4oZnVuY3Rpb24gKCQpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIHNsaWRlOiAgICAgICAgICAgICAgMCxcbiAgICAgICAgZGVsYXk6ICAgICAgICAgICAgICA1MDAwLFxuICAgICAgICBwcmVsb2FkOiAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICBwcmVsb2FkSW1hZ2U6ICAgICAgIGZhbHNlLFxuICAgICAgICBwcmVsb2FkVmlkZW86ICAgICAgIGZhbHNlLFxuICAgICAgICB0aW1lcjogICAgICAgICAgICAgIHRydWUsXG4gICAgICAgIG92ZXJsYXk6ICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgIGF1dG9wbGF5OiAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgc2h1ZmZsZTogICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgY292ZXI6ICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICBjb2xvcjogICAgICAgICAgICAgIG51bGwsXG4gICAgICAgIGFsaWduOiAgICAgICAgICAgICAgJ2NlbnRlcicsXG4gICAgICAgIHZhbGlnbjogICAgICAgICAgICAgJ2NlbnRlcicsXG4gICAgICAgIHRyYW5zaXRpb246ICAgICAgICAgJ2ZhZGUnLFxuICAgICAgICB0cmFuc2l0aW9uRHVyYXRpb246IDEwMDAsXG4gICAgICAgIHRyYW5zaXRpb25SZWdpc3RlcjogW10sXG4gICAgICAgIGFuaW1hdGlvbjogICAgICAgICAgbnVsbCxcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICAnYXV0bycsXG4gICAgICAgIGFuaW1hdGlvblJlZ2lzdGVyOiAgW10sXG4gICAgICAgIGluaXQ6ICBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgcGxheTogIGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBwYXVzZTogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIHdhbGs6ICBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgc2xpZGVzOiBbXG4gICAgICAgICAgICAvLyB7XG4gICAgICAgICAgICAvLyAgc3JjOiAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgLy8gIGNvbG9yOiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIC8vICBkZWxheTogICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAvLyAgYWxpZ246ICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgLy8gIHZhbGlnbjogICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIC8vICB0cmFuc2l0aW9uOiAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAvLyAgdHJhbnNpdGlvbkR1cmF0aW9uOiBudWxsLFxuICAgICAgICAgICAgLy8gIGFuaW1hdGlvbjogICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIC8vICBhbmltYXRpb25EdXJhdGlvbjogIG51bGwsXG4gICAgICAgICAgICAvLyAgY292ZXI6ICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgLy8gIHZpZGVvOiB7XG4gICAgICAgICAgICAvLyAgICAgIHNyYzogW10sXG4gICAgICAgICAgICAvLyAgICAgIG11dGU6IHRydWUsXG4gICAgICAgICAgICAvLyAgICAgIGxvb3A6IHRydWVcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIC4uLlxuICAgICAgICBdXG4gICAgfTtcblxuICAgIHZhciB2aWRlb0NhY2hlID0ge307XG5cbiAgICB2YXIgVmVnYXMgPSBmdW5jdGlvbiAoZWxtdCwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmVsbXQgICAgICAgICA9IGVsbXQ7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgICAgID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCAkLnZlZ2FzLmRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5zbGlkZSAgICAgICAgPSB0aGlzLnNldHRpbmdzLnNsaWRlO1xuICAgICAgICB0aGlzLnRvdGFsICAgICAgICA9IHRoaXMuc2V0dGluZ3Muc2xpZGVzLmxlbmd0aDtcbiAgICAgICAgdGhpcy5ub3Nob3cgICAgICAgPSB0aGlzLnRvdGFsIDwgMjtcbiAgICAgICAgdGhpcy5wYXVzZWQgICAgICAgPSAhdGhpcy5zZXR0aW5ncy5hdXRvcGxheSB8fCB0aGlzLm5vc2hvdztcbiAgICAgICAgdGhpcy4kZWxtdCAgICAgICAgPSAkKGVsbXQpO1xuICAgICAgICB0aGlzLiR0aW1lciAgICAgICA9IG51bGw7XG4gICAgICAgIHRoaXMuJG92ZXJsYXkgICAgID0gbnVsbDtcbiAgICAgICAgdGhpcy4kc2xpZGUgICAgICAgPSBudWxsO1xuICAgICAgICB0aGlzLnRpbWVvdXQgICAgICA9IG51bGw7XG5cbiAgICAgICAgdGhpcy50cmFuc2l0aW9ucyA9IFtcbiAgICAgICAgICAgICdmYWRlJywgJ2ZhZGUyJyxcbiAgICAgICAgICAgICdibHVyJywgJ2JsdXIyJyxcbiAgICAgICAgICAgICdmbGFzaCcsICdmbGFzaDInLFxuICAgICAgICAgICAgJ25lZ2F0aXZlJywgJ25lZ2F0aXZlMicsXG4gICAgICAgICAgICAnYnVybicsICdidXJuMicsXG4gICAgICAgICAgICAnc2xpZGVMZWZ0JywgJ3NsaWRlTGVmdDInLFxuICAgICAgICAgICAgJ3NsaWRlUmlnaHQnLCAnc2xpZGVSaWdodDInLFxuICAgICAgICAgICAgJ3NsaWRlVXAnLCAnc2xpZGVVcDInLFxuICAgICAgICAgICAgJ3NsaWRlRG93bicsICdzbGlkZURvd24yJyxcbiAgICAgICAgICAgICd6b29tSW4nLCAnem9vbUluMicsXG4gICAgICAgICAgICAnem9vbU91dCcsICd6b29tT3V0MicsXG4gICAgICAgICAgICAnc3dpcmxMZWZ0JywgJ3N3aXJsTGVmdDInLFxuICAgICAgICAgICAgJ3N3aXJsUmlnaHQnLCAnc3dpcmxSaWdodDInXG4gICAgICAgIF07XG5cbiAgICAgICAgdGhpcy5hbmltYXRpb25zID0gW1xuICAgICAgICAgICAgJ2tlbmJ1cm5zJyxcbiAgICAgICAgICAgICdrZW5idXJuc0xlZnQnLCAna2VuYnVybnNSaWdodCcsXG4gICAgICAgICAgICAna2VuYnVybnNVcCcsICdrZW5idXJuc1VwTGVmdCcsICdrZW5idXJuc1VwUmlnaHQnLFxuICAgICAgICAgICAgJ2tlbmJ1cm5zRG93bicsICdrZW5idXJuc0Rvd25MZWZ0JywgJ2tlbmJ1cm5zRG93blJpZ2h0J1xuICAgICAgICBdO1xuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRyYW5zaXRpb25SZWdpc3RlciBpbnN0YW5jZW9mIEFycmF5ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy50cmFuc2l0aW9uUmVnaXN0ZXIgPSBbIHRoaXMuc2V0dGluZ3MudHJhbnNpdGlvblJlZ2lzdGVyIF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5hbmltYXRpb25SZWdpc3RlciBpbnN0YW5jZW9mIEFycmF5ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5hbmltYXRpb25SZWdpc3RlciA9IFsgdGhpcy5zZXR0aW5ncy5hbmltYXRpb25SZWdpc3RlciBdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50cmFuc2l0aW9ucyA9IHRoaXMudHJhbnNpdGlvbnMuY29uY2F0KHRoaXMuc2V0dGluZ3MudHJhbnNpdGlvblJlZ2lzdGVyKTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25zICA9IHRoaXMuYW5pbWF0aW9ucy5jb25jYXQodGhpcy5zZXR0aW5ncy5hbmltYXRpb25SZWdpc3Rlcik7XG5cbiAgICAgICAgdGhpcy5zdXBwb3J0ID0ge1xuICAgICAgICAgICAgb2JqZWN0Rml0OiAgJ29iamVjdEZpdCcgIGluIGRvY3VtZW50LmJvZHkuc3R5bGUsXG4gICAgICAgICAgICB0cmFuc2l0aW9uOiAndHJhbnNpdGlvbicgaW4gZG9jdW1lbnQuYm9keS5zdHlsZSB8fCAnV2Via2l0VHJhbnNpdGlvbicgaW4gZG9jdW1lbnQuYm9keS5zdHlsZSxcbiAgICAgICAgICAgIHZpZGVvOiAgICAgICQudmVnYXMuaXNWaWRlb0NvbXBhdGlibGUoKVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnNodWZmbGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMuc2h1ZmZsZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faW5pdCgpO1xuICAgIH07XG5cbiAgICBWZWdhcy5wcm90b3R5cGUgPSB7XG4gICAgICAgIF9pbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgJHdyYXBwZXIsXG4gICAgICAgICAgICAgICAgJG92ZXJsYXksXG4gICAgICAgICAgICAgICAgJHRpbWVyLFxuICAgICAgICAgICAgICAgIGlzQm9keSAgPSB0aGlzLmVsbXQudGFnTmFtZSA9PT0gJ0JPRFknLFxuICAgICAgICAgICAgICAgIHRpbWVyICAgPSB0aGlzLnNldHRpbmdzLnRpbWVyLFxuICAgICAgICAgICAgICAgIG92ZXJsYXkgPSB0aGlzLnNldHRpbmdzLm92ZXJsYXksXG4gICAgICAgICAgICAgICAgc2VsZiAgICA9IHRoaXM7XG5cbiAgICAgICAgICAgIC8vIFByZWxvYWRpbmdcbiAgICAgICAgICAgIHRoaXMuX3ByZWxvYWQoKTtcblxuICAgICAgICAgICAgLy8gV3JhcHBlciB3aXRoIGNvbnRlbnRcbiAgICAgICAgICAgIGlmICghaXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kZWxtdC5jc3MoJ2hlaWdodCcsIHRoaXMuJGVsbXQuY3NzKCdoZWlnaHQnKSk7XG5cbiAgICAgICAgICAgICAgICAkd3JhcHBlciA9ICQoJzxkaXYgY2xhc3M9XCJ2ZWdhcy13cmFwcGVyXCI+JylcbiAgICAgICAgICAgICAgICAgICAgLmNzcygnb3ZlcmZsb3cnLCB0aGlzLiRlbG10LmNzcygnb3ZlcmZsb3cnKSlcbiAgICAgICAgICAgICAgICAgICAgLmNzcygncGFkZGluZycsICB0aGlzLiRlbG10LmNzcygncGFkZGluZycpKTtcblxuICAgICAgICAgICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgZG9uJ3QgY29tcHV0ZSBwYWRkaW5nIHNob3J0aGFuZFxuICAgICAgICAgICAgICAgIGlmICghdGhpcy4kZWxtdC5jc3MoJ3BhZGRpbmcnKSkge1xuICAgICAgICAgICAgICAgICAgICAkd3JhcHBlclxuICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygncGFkZGluZy10b3AnLCAgICB0aGlzLiRlbG10LmNzcygncGFkZGluZy10b3AnKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ3BhZGRpbmctYm90dG9tJywgdGhpcy4kZWxtdC5jc3MoJ3BhZGRpbmctYm90dG9tJykpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdwYWRkaW5nLWxlZnQnLCAgIHRoaXMuJGVsbXQuY3NzKCdwYWRkaW5nLWxlZnQnKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ3BhZGRpbmctcmlnaHQnLCAgdGhpcy4kZWxtdC5jc3MoJ3BhZGRpbmctcmlnaHQnKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy4kZWxtdC5jbG9uZSh0cnVlKS5jaGlsZHJlbigpLmFwcGVuZFRvKCR3cmFwcGVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVsbXQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRpbWVyXG4gICAgICAgICAgICBpZiAodGltZXIgJiYgdGhpcy5zdXBwb3J0LnRyYW5zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAkdGltZXIgPSAkKCc8ZGl2IGNsYXNzPVwidmVnYXMtdGltZXJcIj48ZGl2IGNsYXNzPVwidmVnYXMtdGltZXItcHJvZ3Jlc3NcIj4nKTtcbiAgICAgICAgICAgICAgICB0aGlzLiR0aW1lciA9ICR0aW1lcjtcbiAgICAgICAgICAgICAgICB0aGlzLiRlbG10LnByZXBlbmQoJHRpbWVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gT3ZlcmxheVxuICAgICAgICAgICAgaWYgKG92ZXJsYXkpIHtcbiAgICAgICAgICAgICAgICAkb3ZlcmxheSA9ICQoJzxkaXYgY2xhc3M9XCJ2ZWdhcy1vdmVybGF5XCI+Jyk7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG92ZXJsYXkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICRvdmVybGF5LmNzcygnYmFja2dyb3VuZC1pbWFnZScsICd1cmwoJyArIG92ZXJsYXkgKyAnKScpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuJG92ZXJsYXkgPSAkb3ZlcmxheTtcbiAgICAgICAgICAgICAgICB0aGlzLiRlbG10LnByZXBlbmQoJG92ZXJsYXkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDb250YWluZXJcbiAgICAgICAgICAgIHRoaXMuJGVsbXQuYWRkQ2xhc3MoJ3ZlZ2FzLWNvbnRhaW5lcicpO1xuXG4gICAgICAgICAgICBpZiAoIWlzQm9keSkge1xuICAgICAgICAgICAgICAgIHRoaXMuJGVsbXQuYXBwZW5kKCR3cmFwcGVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2VsZi50cmlnZ2VyKCdpbml0Jyk7XG4gICAgICAgICAgICAgICAgc2VsZi5fZ290byhzZWxmLnNsaWRlKTtcblxuICAgICAgICAgICAgICAgIGlmIChzZWxmLnNldHRpbmdzLmF1dG9wbGF5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudHJpZ2dlcigncGxheScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9wcmVsb2FkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW1nLCBpO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zZXR0aW5ncy5zbGlkZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5wcmVsb2FkIHx8IHRoaXMuc2V0dGluZ3MucHJlbG9hZEltYWdlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zbGlkZXNbaV0uc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZy5zcmMgPSB0aGlzLnNldHRpbmdzLnNsaWRlc1tpXS5zcmM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5wcmVsb2FkIHx8IHRoaXMuc2V0dGluZ3MucHJlbG9hZFZpZGVvcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdXBwb3J0LnZpZGVvICYmIHRoaXMuc2V0dGluZ3Muc2xpZGVzW2ldLnZpZGVvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zbGlkZXNbaV0udmlkZW8gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZpZGVvKHRoaXMuc2V0dGluZ3Muc2xpZGVzW2ldLnZpZGVvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmlkZW8odGhpcy5zZXR0aW5ncy5zbGlkZXNbaV0udmlkZW8uc3JjKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfcmFuZG9tOiBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiBhcnJheVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoYXJyYXkubGVuZ3RoIC0gMSkpXTtcbiAgICAgICAgfSxcblxuICAgICAgICBfc2xpZGVTaG93OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnRvdGFsID4gMSAmJiAhdGhpcy5wYXVzZWQgJiYgIXRoaXMubm9zaG93KSB7XG4gICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubmV4dCgpO1xuICAgICAgICAgICAgICAgIH0sIHRoaXMuX29wdGlvbnMoJ2RlbGF5JykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF90aW1lcjogZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMuJHRpbWVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLiR0aW1lclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygndmVnYXMtdGltZXItcnVubmluZycpXG4gICAgICAgICAgICAgICAgICAgIC5maW5kKCdkaXYnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygndHJhbnNpdGlvbi1kdXJhdGlvbicsICcwbXMnKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMucGF1c2VkIHx8IHRoaXMubm9zaG93KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICBzZWxmLiR0aW1lclxuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZlZ2FzLXRpbWVyLXJ1bm5pbmcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ2RpdicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygndHJhbnNpdGlvbi1kdXJhdGlvbicsIHNlbGYuX29wdGlvbnMoJ2RlbGF5JykgLSAxMDAgKyAnbXMnKTtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF92aWRlbzogZnVuY3Rpb24gKHNyY3MpIHtcbiAgICAgICAgICAgIHZhciB2aWRlbyxcbiAgICAgICAgICAgICAgICBzb3VyY2UsXG4gICAgICAgICAgICAgICAgY2FjaGVLZXkgPSBzcmNzLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIGlmICh2aWRlb0NhY2hlW2NhY2hlS2V5XSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2aWRlb0NhY2hlW2NhY2hlS2V5XTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNyY3MgaW5zdGFuY2VvZiBBcnJheSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBzcmNzID0gWyBzcmNzIF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcbiAgICAgICAgICAgIHZpZGVvLnByZWxvYWQgPSB0cnVlO1xuXG4gICAgICAgICAgICBzcmNzLmZvckVhY2goZnVuY3Rpb24gKHNyYykge1xuICAgICAgICAgICAgICAgIHNvdXJjZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xuICAgICAgICAgICAgICAgIHNvdXJjZS5zcmMgPSBzcmM7XG4gICAgICAgICAgICAgICAgdmlkZW8uYXBwZW5kQ2hpbGQoc291cmNlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2aWRlb0NhY2hlW2NhY2hlS2V5XSA9IHZpZGVvO1xuXG4gICAgICAgICAgICByZXR1cm4gdmlkZW87XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2ZhZGVPdXRTb3VuZDogZnVuY3Rpb24gKHZpZGVvLCBkdXJhdGlvbikge1xuICAgICAgICAgICAgdmFyIHNlbGYgICA9IHRoaXMsXG4gICAgICAgICAgICAgICAgZGVsYXkgID0gZHVyYXRpb24gLyAxMCxcbiAgICAgICAgICAgICAgICB2b2x1bWUgPSB2aWRlby52b2x1bWUgLSAwLjA5O1xuXG4gICAgICAgICAgICBpZiAodm9sdW1lID4gMCkge1xuICAgICAgICAgICAgICAgIHZpZGVvLnZvbHVtZSA9IHZvbHVtZTtcblxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9mYWRlT3V0U291bmQodmlkZW8sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICB9LCBkZWxheSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZpZGVvLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2ZhZGVJblNvdW5kOiBmdW5jdGlvbiAodmlkZW8sIGR1cmF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiAgID0gdGhpcyxcbiAgICAgICAgICAgICAgICBkZWxheSAgPSBkdXJhdGlvbiAvIDEwLFxuICAgICAgICAgICAgICAgIHZvbHVtZSA9IHZpZGVvLnZvbHVtZSArIDAuMDk7XG5cbiAgICAgICAgICAgIGlmICh2b2x1bWUgPCAxKSB7XG4gICAgICAgICAgICAgICAgdmlkZW8udm9sdW1lID0gdm9sdW1lO1xuXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2ZhZGVJblNvdW5kKHZpZGVvLCBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9vcHRpb25zOiBmdW5jdGlvbiAoa2V5LCBpKSB7XG4gICAgICAgICAgICBpZiAoaSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaSA9IHRoaXMuc2xpZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnNsaWRlc1tpXVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5zbGlkZXNbaV1ba2V5XTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3Nba2V5XTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZ290bzogZnVuY3Rpb24gKG5iKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuc2V0dGluZ3Muc2xpZGVzW25iXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBuYiA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2xpZGUgPSBuYjtcblxuICAgICAgICAgICAgdmFyICRzbGlkZSxcbiAgICAgICAgICAgICAgICAkaW5uZXIsXG4gICAgICAgICAgICAgICAgJHZpZGVvLFxuICAgICAgICAgICAgICAgICRzbGlkZXMgICAgICAgPSB0aGlzLiRlbG10LmNoaWxkcmVuKCcudmVnYXMtc2xpZGUnKSxcbiAgICAgICAgICAgICAgICBzcmMgICAgICAgICAgID0gdGhpcy5zZXR0aW5ncy5zbGlkZXNbbmJdLnNyYyxcbiAgICAgICAgICAgICAgICB2aWRlb1NldHRpbmdzID0gdGhpcy5zZXR0aW5ncy5zbGlkZXNbbmJdLnZpZGVvLFxuICAgICAgICAgICAgICAgIGRlbGF5ICAgICAgICAgPSB0aGlzLl9vcHRpb25zKCdkZWxheScpLFxuICAgICAgICAgICAgICAgIGFsaWduICAgICAgICAgPSB0aGlzLl9vcHRpb25zKCdhbGlnbicpLFxuICAgICAgICAgICAgICAgIHZhbGlnbiAgICAgICAgPSB0aGlzLl9vcHRpb25zKCd2YWxpZ24nKSxcbiAgICAgICAgICAgICAgICBjb3ZlciAgICAgICAgID0gdGhpcy5fb3B0aW9ucygnY292ZXInKSxcbiAgICAgICAgICAgICAgICBjb2xvciAgICAgICAgID0gdGhpcy5fb3B0aW9ucygnY29sb3InKSB8fCB0aGlzLiRlbG10LmNzcygnYmFja2dyb3VuZC1jb2xvcicpLFxuICAgICAgICAgICAgICAgIHNlbGYgICAgICAgICAgPSB0aGlzLFxuICAgICAgICAgICAgICAgIHRvdGFsICAgICAgICAgPSAkc2xpZGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICB2aWRlbyxcbiAgICAgICAgICAgICAgICBpbWc7XG5cbiAgICAgICAgICAgIHZhciB0cmFuc2l0aW9uICAgICAgICAgPSB0aGlzLl9vcHRpb25zKCd0cmFuc2l0aW9uJyksXG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbkR1cmF0aW9uID0gdGhpcy5fb3B0aW9ucygndHJhbnNpdGlvbkR1cmF0aW9uJyksXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uICAgICAgICAgID0gdGhpcy5fb3B0aW9ucygnYW5pbWF0aW9uJyksXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb24gID0gdGhpcy5fb3B0aW9ucygnYW5pbWF0aW9uRHVyYXRpb24nKTtcblxuICAgICAgICAgICAgaWYgKGNvdmVyICE9PSAncmVwZWF0Jykge1xuICAgICAgICAgICAgICAgIGlmIChjb3ZlciA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb3ZlciA9ICdjb3Zlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb3ZlciA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY292ZXIgPSAnY29udGFpbic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHJhbnNpdGlvbiA9PT0gJ3JhbmRvbScgfHwgdHJhbnNpdGlvbiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRyYW5zaXRpb24gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uID0gdGhpcy5fcmFuZG9tKHRyYW5zaXRpb24pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb24gPSB0aGlzLl9yYW5kb20odGhpcy50cmFuc2l0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYW5pbWF0aW9uID09PSAncmFuZG9tJyB8fCBhbmltYXRpb24gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgIGlmIChhbmltYXRpb24gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb24gPSB0aGlzLl9yYW5kb20oYW5pbWF0aW9uKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb24gPSB0aGlzLl9yYW5kb20odGhpcy5hbmltYXRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0cmFuc2l0aW9uRHVyYXRpb24gPT09ICdhdXRvJyB8fCB0cmFuc2l0aW9uRHVyYXRpb24gPiBkZWxheSkge1xuICAgICAgICAgICAgICAgIHRyYW5zaXRpb25EdXJhdGlvbiA9IGRlbGF5O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYW5pbWF0aW9uRHVyYXRpb24gPT09ICdhdXRvJykge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uID0gZGVsYXk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICRzbGlkZSA9ICQoJzxkaXYgY2xhc3M9XCJ2ZWdhcy1zbGlkZVwiPjwvZGl2PicpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zdXBwb3J0LnRyYW5zaXRpb24gJiYgdHJhbnNpdGlvbikge1xuICAgICAgICAgICAgICAgICRzbGlkZS5hZGRDbGFzcygndmVnYXMtdHJhbnNpdGlvbi0nICsgdHJhbnNpdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFZpZGVvXG5cbiAgICAgICAgICAgIGlmICh0aGlzLnN1cHBvcnQudmlkZW8gJiYgdmlkZW9TZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIGlmICh2aWRlb1NldHRpbmdzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmlkZW8gPSB0aGlzLl92aWRlbyh2aWRlb1NldHRpbmdzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2aWRlbyA9IHRoaXMuX3ZpZGVvKHZpZGVvU2V0dGluZ3Muc3JjKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2aWRlby5sb29wICA9IHZpZGVvU2V0dGluZ3MubG9vcCAhPT0gdW5kZWZpbmVkID8gdmlkZW9TZXR0aW5ncy5sb29wIDogdHJ1ZTtcbiAgICAgICAgICAgICAgICB2aWRlby5tdXRlZCA9IHZpZGVvU2V0dGluZ3MubXV0ZSAhPT0gdW5kZWZpbmVkID8gdmlkZW9TZXR0aW5ncy5tdXRlIDogdHJ1ZTtcblxuICAgICAgICAgICAgICAgIGlmICh2aWRlby5tdXRlZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmlkZW8udm9sdW1lID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZmFkZUluU291bmQodmlkZW8sIHRyYW5zaXRpb25EdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmlkZW8ucGF1c2UoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkdmlkZW8gPSAkKHZpZGVvKVxuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZlZ2FzLXZpZGVvJylcbiAgICAgICAgICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIGNvbG9yKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN1cHBvcnQub2JqZWN0Rml0KSB7XG4gICAgICAgICAgICAgICAgICAgICR2aWRlb1xuICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygnb2JqZWN0LXBvc2l0aW9uJywgYWxpZ24gKyAnICcgKyB2YWxpZ24pXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdvYmplY3QtZml0JywgY292ZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCd3aWR0aCcsICAnMTAwJScpXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdoZWlnaHQnLCAnMTAwJScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY292ZXIgPT09ICdjb250YWluJykge1xuICAgICAgICAgICAgICAgICAgICAkdmlkZW9cbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ3dpZHRoJywgICcxMDAlJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jc3MoJ2hlaWdodCcsICcxMDAlJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgJHNsaWRlLmFwcGVuZCgkdmlkZW8pO1xuXG4gICAgICAgICAgICAvLyBJbWFnZVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGltZyA9IG5ldyBJbWFnZSgpO1xuXG4gICAgICAgICAgICAgICAgJGlubmVyID0gJCgnPGRpdiBjbGFzcz1cInZlZ2FzLXNsaWRlLWlubmVyXCI+PC9kaXY+JylcbiAgICAgICAgICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1pbWFnZScsICAgICd1cmwoJyArIHNyYyArICcpJylcbiAgICAgICAgICAgICAgICAgICAgLmNzcygnYmFja2dyb3VuZC1jb2xvcicsICAgIGNvbG9yKVxuICAgICAgICAgICAgICAgICAgICAuY3NzKCdiYWNrZ3JvdW5kLXBvc2l0aW9uJywgYWxpZ24gKyAnICcgKyB2YWxpZ24pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGNvdmVyID09PSAncmVwZWF0Jykge1xuICAgICAgICAgICAgICAgICAgICAkaW5uZXIuY3NzKCdiYWNrZ3JvdW5kLXJlcGVhdCcsICdyZXBlYXQnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkaW5uZXIuY3NzKCdiYWNrZ3JvdW5kLXNpemUnLCBjb3Zlcik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3VwcG9ydC50cmFuc2l0aW9uICYmIGFuaW1hdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAkaW5uZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmVnYXMtYW5pbWF0aW9uLScgKyBhbmltYXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCdhbmltYXRpb24tZHVyYXRpb24nLCAgYW5pbWF0aW9uRHVyYXRpb24gKyAnbXMnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkc2xpZGUuYXBwZW5kKCRpbm5lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5zdXBwb3J0LnRyYW5zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAkc2xpZGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRvdGFsKSB7XG4gICAgICAgICAgICAgICAgJHNsaWRlcy5lcSh0b3RhbCAtIDEpLmFmdGVyKCRzbGlkZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuJGVsbXQucHJlcGVuZCgkc2xpZGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxmLl90aW1lcihmYWxzZSk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdvICgpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl90aW1lcih0cnVlKTtcblxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuc3VwcG9ydC50cmFuc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNsaWRlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY3NzKCd0cmFuc2l0aW9uJywgJ2FsbCAnICsgdHJhbnNpdGlvbkR1cmF0aW9uICsgJ21zJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCd2ZWdhcy10cmFuc2l0aW9uLScgKyB0cmFuc2l0aW9uICsgJy1vdXQnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzbGlkZXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2aWRlbyA9ICRzbGlkZXMuZmluZCgndmlkZW8nKS5nZXQoMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZpZGVvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWRlby52b2x1bWUgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fZmFkZU91dFNvdW5kKHZpZGVvLCB0cmFuc2l0aW9uRHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2xpZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNzcygndHJhbnNpdGlvbicsICdhbGwgJyArIHRyYW5zaXRpb25EdXJhdGlvbiArICdtcycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmVnYXMtdHJhbnNpdGlvbi0nICsgdHJhbnNpdGlvbiArICctaW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNsaWRlLmZhZGVJbih0cmFuc2l0aW9uRHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkc2xpZGVzLmxlbmd0aCAtIDQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICRzbGlkZXMuZXEoaSkucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRyaWdnZXIoJ3dhbGsnKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2xpZGVTaG93KCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2aWRlbykge1xuICAgICAgICAgICAgICAgIGlmICh2aWRlby5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZpZGVvLmN1cnJlbnRUaW1lID0gMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2aWRlby5wbGF5KCk7XG4gICAgICAgICAgICAgICAgZ28oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgICAgICAgICBpbWcub25sb2FkID0gZ287XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2h1ZmZsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRlbXAsXG4gICAgICAgICAgICAgICAgcmFuZDtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMudG90YWwgLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgcmFuZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgICAgICAgICAgIHRlbXAgPSB0aGlzLnNldHRpbmdzLnNsaWRlc1tpXTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3Muc2xpZGVzW2ldID0gdGhpcy5zZXR0aW5ncy5zbGlkZXNbcmFuZF07XG4gICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5zbGlkZXNbcmFuZF0gPSB0ZW1wO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHBsYXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnBhdXNlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKCdwbGF5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX3RpbWVyKGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcigncGF1c2UnKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0b2dnbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnBhdXNlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhdXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGxheWluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0aGlzLnBhdXNlZCAmJiAhdGhpcy5ub3Nob3c7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3VycmVudDogZnVuY3Rpb24gKGFkdmFuY2VkKSB7XG4gICAgICAgICAgICBpZiAoYWR2YW5jZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzbGlkZTogdGhpcy5zbGlkZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogIHRoaXMuc2V0dGluZ3Muc2xpZGVzW3RoaXMuc2xpZGVdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNsaWRlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGp1bXA6IGZ1bmN0aW9uIChuYikge1xuICAgICAgICAgICAgaWYgKG5iIDwgMCB8fCBuYiA+IHRoaXMudG90YWwgLSAxIHx8IG5iID09PSB0aGlzLnNsaWRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNsaWRlID0gbmI7XG4gICAgICAgICAgICB0aGlzLl9nb3RvKHRoaXMuc2xpZGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuc2xpZGUrKztcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2xpZGUgPj0gdGhpcy50b3RhbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2xpZGUgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9nb3RvKHRoaXMuc2xpZGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHByZXZpb3VzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnNsaWRlLS07XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNsaWRlIDwgMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2xpZGUgPSB0aGlzLnRvdGFsIC0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZ290byh0aGlzLnNsaWRlKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0cmlnZ2VyOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBbXTtcblxuICAgICAgICAgICAgaWYgKGZuID09PSAnaW5pdCcpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSBbIHRoaXMuc2V0dGluZ3MgXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0gW1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNsaWRlLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLnNsaWRlc1t0aGlzLnNsaWRlXVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuJGVsbXQudHJpZ2dlcigndmVnYXMnICsgZm4sIHBhcmFtcyk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5zZXR0aW5nc1tmbl0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzW2ZuXS5hcHBseSh0aGlzLiRlbG10LCBwYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9wdGlvbnM6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgb2xkU2xpZGVzID0gdGhpcy5zZXR0aW5ncy5zbGlkZXMuc2xpY2UoKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgJC52ZWdhcy5kZWZhdWx0cywga2V5KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5nc1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3M7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEluIGNhc2Ugc2xpZGVzIGhhdmUgY2hhbmdlZFxuICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3Muc2xpZGVzICE9PSBvbGRTbGlkZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRvdGFsICA9IHRoaXMuc2V0dGluZ3Muc2xpZGVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aGlzLm5vc2hvdyA9IHRoaXMudG90YWwgPCAyO1xuICAgICAgICAgICAgICAgIHRoaXMuX3ByZWxvYWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcblxuICAgICAgICAgICAgdGhpcy4kZWxtdC5yZW1vdmVDbGFzcygndmVnYXMtY29udGFpbmVyJyk7XG4gICAgICAgICAgICB0aGlzLiRlbG10LmZpbmQoJz4gLnZlZ2FzLXNsaWRlJykucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLiRlbG10LmZpbmQoJz4gLnZlZ2FzLXdyYXBwZXInKS5jbG9uZSh0cnVlKS5jaGlsZHJlbigpLmFwcGVuZFRvKHRoaXMuJGVsbXQpO1xuICAgICAgICAgICAgdGhpcy4kZWxtdC5maW5kKCc+IC52ZWdhcy13cmFwcGVyJykucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRpbWVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kdGltZXIucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLm92ZXJsYXkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRvdmVybGF5LnJlbW92ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmVsbXQuX3ZlZ2FzID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmZuLnZlZ2FzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgICAgIGVycm9yID0gZmFsc2UsXG4gICAgICAgICAgICByZXR1cm5zO1xuXG4gICAgICAgIGlmIChvcHRpb25zID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX3ZlZ2FzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZlZ2FzID0gbmV3IFZlZ2FzKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLl92ZWdhcztcblxuICAgICAgICAgICAgICAgIGlmICghaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBWZWdhcyBhcHBsaWVkIHRvIHRoaXMgZWxlbWVudC4nKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGluc3RhbmNlW29wdGlvbnNdID09PSAnZnVuY3Rpb24nICYmIG9wdGlvbnNbMF0gIT09ICdfJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5zID0gaW5zdGFuY2Vbb3B0aW9uc10uYXBwbHkoaW5zdGFuY2UsIFtdLnNsaWNlLmNhbGwoYXJncywgMSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBtZXRob2QgXCInICsgb3B0aW9ucyArICdcIiBpbiBWZWdhcy4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldHVybnMgIT09IHVuZGVmaW5lZCA/IHJldHVybnMgOiB0aGlzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQudmVnYXMgPSB7fTtcbiAgICAkLnZlZ2FzLmRlZmF1bHRzID0gZGVmYXVsdHM7XG5cbiAgICAkLnZlZ2FzLmlzVmlkZW9Db21wYXRpYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gIS8oQW5kcm9pZHx3ZWJPU3xQaG9uZXxpUGFkfGlQb2R8QmxhY2tCZXJyeXxXaW5kb3dzIFBob25lKS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gICAgfTtcblxufSkod2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG8pO1xuIiwiLyoqXG4gKiBGZWF0aGVybGlnaHQgLSB1bHRyYSBzbGltIGpRdWVyeSBsaWdodGJveFxuICogVmVyc2lvbiAxLjMuNSAtIGh0dHA6Ly9ub2VsYm9zcy5naXRodWIuaW8vZmVhdGhlcmxpZ2h0L1xuICpcbiAqIENvcHlyaWdodCAyMDE1LCBOb8OrbCBSYW91bCBCb3NzYXJ0IChodHRwOi8vd3d3Lm5vZWxib3NzLmNvbSlcbiAqIE1JVCBMaWNlbnNlZC5cbioqL1xuKGZ1bmN0aW9uKCQpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0aWYoJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiAkKSB7XG5cdFx0aWYoJ2NvbnNvbGUnIGluIHdpbmRvdyl7IHdpbmRvdy5jb25zb2xlLmluZm8oJ1RvbyBtdWNoIGxpZ2h0bmVzcywgRmVhdGhlcmxpZ2h0IG5lZWRzIGpRdWVyeS4nKTsgfVxuXHRcdHJldHVybjtcblx0fVxuXG5cdC8qIEZlYXRoZXJsaWdodCBpcyBleHBvcnRlZCBhcyAkLmZlYXRoZXJsaWdodC5cblx0ICAgSXQgaXMgYSBmdW5jdGlvbiB1c2VkIHRvIG9wZW4gYSBmZWF0aGVybGlnaHQgbGlnaHRib3guXG5cblx0ICAgW3RlY2hdXG5cdCAgIEZlYXRoZXJsaWdodCB1c2VzIHByb3RvdHlwZSBpbmhlcml0YW5jZS5cblx0ICAgRWFjaCBvcGVuZWQgbGlnaHRib3ggd2lsbCBoYXZlIGEgY29ycmVzcG9uZGluZyBvYmplY3QuXG5cdCAgIFRoYXQgb2JqZWN0IG1heSBoYXZlIHNvbWUgYXR0cmlidXRlcyB0aGF0IG92ZXJyaWRlIHRoZVxuXHQgICBwcm90b3R5cGUncy5cblx0ICAgRXh0ZW5zaW9ucyBjcmVhdGVkIHdpdGggRmVhdGhlcmxpZ2h0LmV4dGVuZCB3aWxsIGhhdmUgdGhlaXJcblx0ICAgb3duIHByb3RvdHlwZSB0aGF0IGluaGVyaXRzIGZyb20gRmVhdGhlcmxpZ2h0J3MgcHJvdG90eXBlLFxuXHQgICB0aHVzIGF0dHJpYnV0ZXMgY2FuIGJlIG92ZXJyaWRlbiBlaXRoZXIgYXQgdGhlIG9iamVjdCBsZXZlbCxcblx0ICAgb3IgYXQgdGhlIGV4dGVuc2lvbiBsZXZlbC5cblx0ICAgVG8gY3JlYXRlIGNhbGxiYWNrcyB0aGF0IGNoYWluIHRoZW1zZWx2ZXMgaW5zdGVhZCBvZiBvdmVycmlkaW5nLFxuXHQgICB1c2UgY2hhaW5DYWxsYmFja3MuXG5cdCAgIEZvciB0aG9zZSBmYW1pbGlhciB3aXRoIENvZmZlZVNjcmlwdCwgdGhpcyBjb3JyZXNwb25kIHRvXG5cdCAgIEZlYXRoZXJsaWdodCBiZWluZyBhIGNsYXNzIGFuZCB0aGUgR2FsbGVyeSBiZWluZyBhIGNsYXNzXG5cdCAgIGV4dGVuZGluZyBGZWF0aGVybGlnaHQuXG5cdCAgIFRoZSBjaGFpbkNhbGxiYWNrcyBpcyB1c2VkIHNpbmNlIHdlIGRvbid0IGhhdmUgYWNjZXNzIHRvXG5cdCAgIENvZmZlZVNjcmlwdCdzIGBzdXBlcmAuXG5cdCovXG5cblx0ZnVuY3Rpb24gRmVhdGhlcmxpZ2h0KCRjb250ZW50LCBjb25maWcpIHtcblx0XHRpZih0aGlzIGluc3RhbmNlb2YgRmVhdGhlcmxpZ2h0KSB7ICAvKiBjYWxsZWQgd2l0aCBuZXcgKi9cblx0XHRcdHRoaXMuaWQgPSBGZWF0aGVybGlnaHQuaWQrKztcblx0XHRcdHRoaXMuc2V0dXAoJGNvbnRlbnQsIGNvbmZpZyk7XG5cdFx0XHR0aGlzLmNoYWluQ2FsbGJhY2tzKEZlYXRoZXJsaWdodC5fY2FsbGJhY2tDaGFpbik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBmbCA9IG5ldyBGZWF0aGVybGlnaHQoJGNvbnRlbnQsIGNvbmZpZyk7XG5cdFx0XHRmbC5vcGVuKCk7XG5cdFx0XHRyZXR1cm4gZmw7XG5cdFx0fVxuXHR9XG5cblx0dmFyIG9wZW5lZCA9IFtdLFxuXHRcdHBydW5lT3BlbmVkID0gZnVuY3Rpb24ocmVtb3ZlKSB7XG5cdFx0XHRvcGVuZWQgPSAkLmdyZXAob3BlbmVkLCBmdW5jdGlvbihmbCkge1xuXHRcdFx0XHRyZXR1cm4gZmwgIT09IHJlbW92ZSAmJiBmbC4kaW5zdGFuY2UuY2xvc2VzdCgnYm9keScpLmxlbmd0aCA+IDA7XG5cdFx0XHR9ICk7XG5cdFx0XHRyZXR1cm4gb3BlbmVkO1xuXHRcdH07XG5cblx0Ly8gc3RydWN0dXJlKHtpZnJhbWVNaW5IZWlnaHQ6IDQ0LCBmb286IDB9LCAnaWZyYW1lJylcblx0Ly8gICAjPT4ge21pbi1oZWlnaHQ6IDQ0fVxuXHR2YXIgc3RydWN0dXJlID0gZnVuY3Rpb24ob2JqLCBwcmVmaXgpIHtcblx0XHR2YXIgcmVzdWx0ID0ge30sXG5cdFx0XHRyZWdleCA9IG5ldyBSZWdFeHAoJ14nICsgcHJlZml4ICsgJyhbQS1aXSkoLiopJyk7XG5cdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xuXHRcdFx0dmFyIG1hdGNoID0ga2V5Lm1hdGNoKHJlZ2V4KTtcblx0XHRcdGlmIChtYXRjaCkge1xuXHRcdFx0XHR2YXIgZGFzaGVyaXplZCA9IChtYXRjaFsxXSArIG1hdGNoWzJdLnJlcGxhY2UoLyhbQS1aXSkvZywgJy0kMScpKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRyZXN1bHRbZGFzaGVyaXplZF0gPSBvYmpba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fTtcblxuXHQvKiBkb2N1bWVudCB3aWRlIGtleSBoYW5kbGVyICovXG5cdHZhciBldmVudE1hcCA9IHsga2V5dXA6ICdvbktleVVwJywgcmVzaXplOiAnb25SZXNpemUnIH07XG5cblx0dmFyIGdsb2JhbEV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0JC5lYWNoKEZlYXRoZXJsaWdodC5vcGVuZWQoKS5yZXZlcnNlKCksIGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCFldmVudC5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkge1xuXHRcdFx0XHRpZiAoZmFsc2UgPT09IHRoaXNbZXZlbnRNYXBbZXZlbnQudHlwZV1dKGV2ZW50KSkge1xuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyByZXR1cm4gZmFsc2U7XG5cdFx0XHQgIH1cblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblxuXHR2YXIgdG9nZ2xlR2xvYmFsRXZlbnRzID0gZnVuY3Rpb24oc2V0KSB7XG5cdFx0XHRpZihzZXQgIT09IEZlYXRoZXJsaWdodC5fZ2xvYmFsSGFuZGxlckluc3RhbGxlZCkge1xuXHRcdFx0XHRGZWF0aGVybGlnaHQuX2dsb2JhbEhhbmRsZXJJbnN0YWxsZWQgPSBzZXQ7XG5cdFx0XHRcdHZhciBldmVudHMgPSAkLm1hcChldmVudE1hcCwgZnVuY3Rpb24oXywgbmFtZSkgeyByZXR1cm4gbmFtZSsnLicrRmVhdGhlcmxpZ2h0LnByb3RvdHlwZS5uYW1lc3BhY2U7IH0gKS5qb2luKCcgJyk7XG5cdFx0XHRcdCQod2luZG93KVtzZXQgPyAnb24nIDogJ29mZiddKGV2ZW50cywgZ2xvYmFsRXZlbnRIYW5kbGVyKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdEZlYXRoZXJsaWdodC5wcm90b3R5cGUgPSB7XG5cdFx0Y29uc3RydWN0b3I6IEZlYXRoZXJsaWdodCxcblx0XHQvKioqIGRlZmF1bHRzICoqKi9cblx0XHQvKiBleHRlbmQgZmVhdGhlcmxpZ2h0IHdpdGggZGVmYXVsdHMgYW5kIG1ldGhvZHMgKi9cblx0XHRuYW1lc3BhY2U6ICAgICAgJ2ZlYXRoZXJsaWdodCcsICAgICAgICAvKiBOYW1lIG9mIHRoZSBldmVudHMgYW5kIGNzcyBjbGFzcyBwcmVmaXggKi9cblx0XHR0YXJnZXRBdHRyOiAgICAgJ2RhdGEtZmVhdGhlcmxpZ2h0JywgICAvKiBBdHRyaWJ1dGUgb2YgdGhlIHRyaWdnZXJlZCBlbGVtZW50IHRoYXQgY29udGFpbnMgdGhlIHNlbGVjdG9yIHRvIHRoZSBsaWdodGJveCBjb250ZW50ICovXG5cdFx0dmFyaWFudDogICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgLyogQ2xhc3MgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIGNoYW5nZSBsb29rIG9mIHRoZSBsaWdodGJveCAqL1xuXHRcdHJlc2V0Q3NzOiAgICAgICBmYWxzZSwgICAgICAgICAgICAgICAgIC8qIFJlc2V0IGFsbCBjc3MgKi9cblx0XHRiYWNrZ3JvdW5kOiAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAvKiBDdXN0b20gRE9NIGZvciB0aGUgYmFja2dyb3VuZCwgd3JhcHBlciBhbmQgdGhlIGNsb3NlYnV0dG9uICovXG5cdFx0b3BlblRyaWdnZXI6ICAgICdjbGljaycsICAgICAgICAgICAgICAgLyogRXZlbnQgdGhhdCB0cmlnZ2VycyB0aGUgbGlnaHRib3ggKi9cblx0XHRjbG9zZVRyaWdnZXI6ICAgJ2NsaWNrJywgICAgICAgICAgICAgICAvKiBFdmVudCB0aGF0IHRyaWdnZXJzIHRoZSBjbG9zaW5nIG9mIHRoZSBsaWdodGJveCAqL1xuXHRcdGZpbHRlcjogICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgIC8qIFNlbGVjdG9yIHRvIGZpbHRlciBldmVudHMuIFRoaW5rICQoLi4uKS5vbignY2xpY2snLCBmaWx0ZXIsIGV2ZW50SGFuZGxlcikgKi9cblx0XHRyb290OiAgICAgICAgICAgJ2JvZHknLCAgICAgICAgICAgICAgICAvKiBXaGVyZSB0byBhcHBlbmQgZmVhdGhlcmxpZ2h0cyAqL1xuXHRcdG9wZW5TcGVlZDogICAgICAyNTAsICAgICAgICAgICAgICAgICAgIC8qIER1cmF0aW9uIG9mIG9wZW5pbmcgYW5pbWF0aW9uICovXG5cdFx0Y2xvc2VTcGVlZDogICAgIDI1MCwgICAgICAgICAgICAgICAgICAgLyogRHVyYXRpb24gb2YgY2xvc2luZyBhbmltYXRpb24gKi9cblx0XHRjbG9zZU9uQ2xpY2s6ICAgJ2JhY2tncm91bmQnLCAgICAgICAgICAvKiBDbG9zZSBsaWdodGJveCBvbiBjbGljayAoJ2JhY2tncm91bmQnLCAnYW55d2hlcmUnIG9yIGZhbHNlKSAqL1xuXHRcdGNsb3NlT25Fc2M6ICAgICB0cnVlLCAgICAgICAgICAgICAgICAgIC8qIENsb3NlIGxpZ2h0Ym94IHdoZW4gcHJlc3NpbmcgZXNjICovXG5cdFx0Y2xvc2VJY29uOiAgICAgICcmIzEwMDA1OycsICAgICAgICAgICAgLyogQ2xvc2UgaWNvbiAqL1xuXHRcdGxvYWRpbmc6ICAgICAgICAnJywgICAgICAgICAgICAgICAgICAgIC8qIENvbnRlbnQgdG8gc2hvdyB3aGlsZSBpbml0aWFsIGNvbnRlbnQgaXMgbG9hZGluZyAqL1xuXHRcdHBlcnNpc3Q6ICAgICAgICBmYWxzZSwgICAgICAgICAgICAgICAgIC8qIElmIHNldCwgdGhlIGNvbnRlbnQgd2lsbCBwZXJzaXN0IGFuZCB3aWxsIGJlIHNob3duIGFnYWluIHdoZW4gb3BlbmVkIGFnYWluLiAnc2hhcmVkJyBpcyBhIHNwZWNpYWwgdmFsdWUgd2hlbiBiaW5kaW5nIG11bHRpcGxlIGVsZW1lbnRzIGZvciB0aGVtIHRvIHNoYXJlIHRoZSBzYW1lIGNvbnRlbnQgKi9cblx0XHRvdGhlckNsb3NlOiAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAvKiBTZWxlY3RvciBmb3IgYWx0ZXJuYXRlIGNsb3NlIGJ1dHRvbnMgKGUuZy4gXCJhLmNsb3NlXCIpICovXG5cdFx0YmVmb3JlT3BlbjogICAgICQubm9vcCwgICAgICAgICAgICAgICAgLyogQ2FsbGVkIGJlZm9yZSBvcGVuLiBjYW4gcmV0dXJuIGZhbHNlIHRvIHByZXZlbnQgb3BlbmluZyBvZiBsaWdodGJveC4gR2V0cyBldmVudCBhcyBwYXJhbWV0ZXIsIHRoaXMgY29udGFpbnMgYWxsIGRhdGEgKi9cblx0XHRiZWZvcmVDb250ZW50OiAgJC5ub29wLCAgICAgICAgICAgICAgICAvKiBDYWxsZWQgd2hlbiBjb250ZW50IGlzIGxvYWRlZC4gR2V0cyBldmVudCBhcyBwYXJhbWV0ZXIsIHRoaXMgY29udGFpbnMgYWxsIGRhdGEgKi9cblx0XHRiZWZvcmVDbG9zZTogICAgJC5ub29wLCAgICAgICAgICAgICAgICAvKiBDYWxsZWQgYmVmb3JlIGNsb3NlLiBjYW4gcmV0dXJuIGZhbHNlIHRvIHByZXZlbnQgb3BlbmluZyBvZiBsaWdodGJveC4gR2V0cyBldmVudCBhcyBwYXJhbWV0ZXIsIHRoaXMgY29udGFpbnMgYWxsIGRhdGEgKi9cblx0XHRhZnRlck9wZW46ICAgICAgJC5ub29wLCAgICAgICAgICAgICAgICAvKiBDYWxsZWQgYWZ0ZXIgb3Blbi4gR2V0cyBldmVudCBhcyBwYXJhbWV0ZXIsIHRoaXMgY29udGFpbnMgYWxsIGRhdGEgKi9cblx0XHRhZnRlckNvbnRlbnQ6ICAgJC5ub29wLCAgICAgICAgICAgICAgICAvKiBDYWxsZWQgYWZ0ZXIgY29udGVudCBpcyByZWFkeSBhbmQgaGFzIGJlZW4gc2V0LiBHZXRzIGV2ZW50IGFzIHBhcmFtZXRlciwgdGhpcyBjb250YWlucyBhbGwgZGF0YSAqL1xuXHRcdGFmdGVyQ2xvc2U6ICAgICAkLm5vb3AsICAgICAgICAgICAgICAgIC8qIENhbGxlZCBhZnRlciBjbG9zZS4gR2V0cyBldmVudCBhcyBwYXJhbWV0ZXIsIHRoaXMgY29udGFpbnMgYWxsIGRhdGEgKi9cblx0XHRvbktleVVwOiAgICAgICAgJC5ub29wLCAgICAgICAgICAgICAgICAvKiBDYWxsZWQgb24ga2V5IHVwIGZvciB0aGUgZnJvbnRtb3N0IGZlYXRoZXJsaWdodCAqL1xuXHRcdG9uUmVzaXplOiAgICAgICAkLm5vb3AsICAgICAgICAgICAgICAgIC8qIENhbGxlZCBhZnRlciBuZXcgY29udGVudCBhbmQgd2hlbiBhIHdpbmRvdyBpcyByZXNpemVkICovXG5cdFx0dHlwZTogICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgLyogU3BlY2lmeSB0eXBlIG9mIGxpZ2h0Ym94LiBJZiB1bnNldCwgaXQgd2lsbCBjaGVjayBmb3IgdGhlIHRhcmdldEF0dHJzIHZhbHVlLiAqL1xuXHRcdGNvbnRlbnRGaWx0ZXJzOiBbJ2pxdWVyeScsICdpbWFnZScsICdodG1sJywgJ2FqYXgnLCAnaWZyYW1lJywgJ3RleHQnXSwgLyogTGlzdCBvZiBjb250ZW50IGZpbHRlcnMgdG8gdXNlIHRvIGRldGVybWluZSB0aGUgY29udGVudCAqL1xuXG5cdFx0LyoqKiBtZXRob2RzICoqKi9cblx0XHQvKiBzZXR1cCBpdGVyYXRlcyBvdmVyIGEgc2luZ2xlIGluc3RhbmNlIG9mIGZlYXRoZXJsaWdodCBhbmQgcHJlcGFyZXMgdGhlIGJhY2tncm91bmQgYW5kIGJpbmRzIHRoZSBldmVudHMgKi9cblx0XHRzZXR1cDogZnVuY3Rpb24odGFyZ2V0LCBjb25maWcpe1xuXHRcdFx0LyogYWxsIGFyZ3VtZW50cyBhcmUgb3B0aW9uYWwgKi9cblx0XHRcdGlmICh0eXBlb2YgdGFyZ2V0ID09PSAnb2JqZWN0JyAmJiB0YXJnZXQgaW5zdGFuY2VvZiAkID09PSBmYWxzZSAmJiAhY29uZmlnKSB7XG5cdFx0XHRcdGNvbmZpZyA9IHRhcmdldDtcblx0XHRcdFx0dGFyZ2V0ID0gdW5kZWZpbmVkO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgc2VsZiA9ICQuZXh0ZW5kKHRoaXMsIGNvbmZpZywge3RhcmdldDogdGFyZ2V0fSksXG5cdFx0XHRcdGNzcyA9ICFzZWxmLnJlc2V0Q3NzID8gc2VsZi5uYW1lc3BhY2UgOiBzZWxmLm5hbWVzcGFjZSsnLXJlc2V0JywgLyogYnkgYWRkaW5nIC1yZXNldCB0byB0aGUgY2xhc3NuYW1lLCB3ZSByZXNldCBhbGwgdGhlIGRlZmF1bHQgY3NzICovXG5cdFx0XHRcdCRiYWNrZ3JvdW5kID0gJChzZWxmLmJhY2tncm91bmQgfHwgW1xuXHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiJytjc3MrJy1sb2FkaW5nICcrY3NzKydcIj4nLFxuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCInK2NzcysnLWNvbnRlbnRcIj4nLFxuXHRcdFx0XHRcdFx0XHQnPHNwYW4gY2xhc3M9XCInK2NzcysnLWNsb3NlLWljb24gJysgc2VsZi5uYW1lc3BhY2UgKyAnLWNsb3NlXCI+Jyxcblx0XHRcdFx0XHRcdFx0XHRzZWxmLmNsb3NlSWNvbixcblx0XHRcdFx0XHRcdFx0Jzwvc3Bhbj4nLFxuXHRcdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cIicrc2VsZi5uYW1lc3BhY2UrJy1pbm5lclwiPicgKyBzZWxmLmxvYWRpbmcgKyAnPC9kaXY+Jyxcblx0XHRcdFx0XHRcdCc8L2Rpdj4nLFxuXHRcdFx0XHRcdCc8L2Rpdj4nXS5qb2luKCcnKSksXG5cdFx0XHRcdGNsb3NlQnV0dG9uU2VsZWN0b3IgPSAnLicrc2VsZi5uYW1lc3BhY2UrJy1jbG9zZScgKyAoc2VsZi5vdGhlckNsb3NlID8gJywnICsgc2VsZi5vdGhlckNsb3NlIDogJycpO1xuXG5cdFx0XHRzZWxmLiRpbnN0YW5jZSA9ICRiYWNrZ3JvdW5kLmNsb25lKCkuYWRkQ2xhc3Moc2VsZi52YXJpYW50KTsgLyogY2xvbmUgRE9NIGZvciB0aGUgYmFja2dyb3VuZCwgd3JhcHBlciBhbmQgdGhlIGNsb3NlIGJ1dHRvbiAqL1xuXG5cdFx0XHQvKiBjbG9zZSB3aGVuIGNsaWNrIG9uIGJhY2tncm91bmQvYW55d2hlcmUvbnVsbCBvciBjbG9zZWJveCAqL1xuXHRcdFx0c2VsZi4kaW5zdGFuY2Uub24oc2VsZi5jbG9zZVRyaWdnZXIrJy4nK3NlbGYubmFtZXNwYWNlLCBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHR2YXIgJHRhcmdldCA9ICQoZXZlbnQudGFyZ2V0KTtcblx0XHRcdFx0aWYoICgnYmFja2dyb3VuZCcgPT09IHNlbGYuY2xvc2VPbkNsaWNrICAmJiAkdGFyZ2V0LmlzKCcuJytzZWxmLm5hbWVzcGFjZSkpXG5cdFx0XHRcdFx0fHwgJ2FueXdoZXJlJyA9PT0gc2VsZi5jbG9zZU9uQ2xpY2tcblx0XHRcdFx0XHR8fCAkdGFyZ2V0LmNsb3Nlc3QoY2xvc2VCdXR0b25TZWxlY3RvcikubGVuZ3RoICl7XG5cdFx0XHRcdFx0c2VsZi5jbG9zZShldmVudCk7XG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHQvKiB0aGlzIG1ldGhvZCBwcmVwYXJlcyB0aGUgY29udGVudCBhbmQgY29udmVydHMgaXQgaW50byBhIGpRdWVyeSBvYmplY3Qgb3IgYSBwcm9taXNlICovXG5cdFx0Z2V0Q29udGVudDogZnVuY3Rpb24oKXtcblx0XHRcdGlmKHRoaXMucGVyc2lzdCAhPT0gZmFsc2UgJiYgdGhpcy4kY29udGVudCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy4kY29udGVudDtcblx0XHRcdH1cblx0XHRcdHZhciBzZWxmID0gdGhpcyxcblx0XHRcdFx0ZmlsdGVycyA9IHRoaXMuY29uc3RydWN0b3IuY29udGVudEZpbHRlcnMsXG5cdFx0XHRcdHJlYWRUYXJnZXRBdHRyID0gZnVuY3Rpb24obmFtZSl7IHJldHVybiBzZWxmLiRjdXJyZW50VGFyZ2V0ICYmIHNlbGYuJGN1cnJlbnRUYXJnZXQuYXR0cihuYW1lKTsgfSxcblx0XHRcdFx0dGFyZ2V0VmFsdWUgPSByZWFkVGFyZ2V0QXR0cihzZWxmLnRhcmdldEF0dHIpLFxuXHRcdFx0XHRkYXRhID0gc2VsZi50YXJnZXQgfHwgdGFyZ2V0VmFsdWUgfHwgJyc7XG5cblx0XHRcdC8qIEZpbmQgd2hpY2ggZmlsdGVyIGFwcGxpZXMgKi9cblx0XHRcdHZhciBmaWx0ZXIgPSBmaWx0ZXJzW3NlbGYudHlwZV07IC8qIGNoZWNrIGV4cGxpY2l0IHR5cGUgbGlrZSB7dHlwZTogJ2ltYWdlJ30gKi9cblxuXHRcdFx0LyogY2hlY2sgZXhwbGljaXQgdHlwZSBsaWtlIGRhdGEtZmVhdGhlcmxpZ2h0PVwiaW1hZ2VcIiAqL1xuXHRcdFx0aWYoIWZpbHRlciAmJiBkYXRhIGluIGZpbHRlcnMpIHtcblx0XHRcdFx0ZmlsdGVyID0gZmlsdGVyc1tkYXRhXTtcblx0XHRcdFx0ZGF0YSA9IHNlbGYudGFyZ2V0ICYmIHRhcmdldFZhbHVlO1xuXHRcdFx0fVxuXHRcdFx0ZGF0YSA9IGRhdGEgfHwgcmVhZFRhcmdldEF0dHIoJ2hyZWYnKSB8fCAnJztcblxuXHRcdFx0LyogY2hlY2sgZXhwbGljaXR5IHR5cGUgJiBjb250ZW50IGxpa2Uge2ltYWdlOiAncGhvdG8uanBnJ30gKi9cblx0XHRcdGlmKCFmaWx0ZXIpIHtcblx0XHRcdFx0Zm9yKHZhciBmaWx0ZXJOYW1lIGluIGZpbHRlcnMpIHtcblx0XHRcdFx0XHRpZihzZWxmW2ZpbHRlck5hbWVdKSB7XG5cdFx0XHRcdFx0XHRmaWx0ZXIgPSBmaWx0ZXJzW2ZpbHRlck5hbWVdO1xuXHRcdFx0XHRcdFx0ZGF0YSA9IHNlbGZbZmlsdGVyTmFtZV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8qIG90aGVyd2lzZSBpdCdzIGltcGxpY2l0LCBydW4gY2hlY2tzICovXG5cdFx0XHRpZighZmlsdGVyKSB7XG5cdFx0XHRcdHZhciB0YXJnZXQgPSBkYXRhO1xuXHRcdFx0XHRkYXRhID0gbnVsbDtcblx0XHRcdFx0JC5lYWNoKHNlbGYuY29udGVudEZpbHRlcnMsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGZpbHRlciA9IGZpbHRlcnNbdGhpc107XG5cdFx0XHRcdFx0aWYoZmlsdGVyLnRlc3QpICB7XG5cdFx0XHRcdFx0XHRkYXRhID0gZmlsdGVyLnRlc3QodGFyZ2V0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoIWRhdGEgJiYgZmlsdGVyLnJlZ2V4ICYmIHRhcmdldC5tYXRjaCAmJiB0YXJnZXQubWF0Y2goZmlsdGVyLnJlZ2V4KSkge1xuXHRcdFx0XHRcdFx0ZGF0YSA9IHRhcmdldDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuICFkYXRhO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0aWYoIWRhdGEpIHtcblx0XHRcdFx0XHRpZignY29uc29sZScgaW4gd2luZG93KXsgd2luZG93LmNvbnNvbGUuZXJyb3IoJ0ZlYXRoZXJsaWdodDogbm8gY29udGVudCBmaWx0ZXIgZm91bmQgJyArICh0YXJnZXQgPyAnIGZvciBcIicgKyB0YXJnZXQgKyAnXCInIDogJyAobm8gdGFyZ2V0IHNwZWNpZmllZCknKSk7IH1cblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdC8qIFByb2Nlc3MgaXQgKi9cblx0XHRcdHJldHVybiBmaWx0ZXIucHJvY2Vzcy5jYWxsKHNlbGYsIGRhdGEpO1xuXHRcdH0sXG5cblx0XHQvKiBzZXRzIHRoZSBjb250ZW50IG9mICRpbnN0YW5jZSB0byAkY29udGVudCAqL1xuXHRcdHNldENvbnRlbnQ6IGZ1bmN0aW9uKCRjb250ZW50KXtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcdC8qIHdlIG5lZWQgYSBzcGVjaWFsIGNsYXNzIGZvciB0aGUgaWZyYW1lICovXG5cdFx0XHRpZigkY29udGVudC5pcygnaWZyYW1lJykgfHwgJCgnaWZyYW1lJywgJGNvbnRlbnQpLmxlbmd0aCA+IDApe1xuXHRcdFx0XHRzZWxmLiRpbnN0YW5jZS5hZGRDbGFzcyhzZWxmLm5hbWVzcGFjZSsnLWlmcmFtZScpO1xuXHRcdFx0fVxuXG5cdFx0XHRzZWxmLiRpbnN0YW5jZS5yZW1vdmVDbGFzcyhzZWxmLm5hbWVzcGFjZSsnLWxvYWRpbmcnKTtcblxuXHRcdFx0LyogcmVwbGFjZSBjb250ZW50IGJ5IGFwcGVuZGluZyB0byBleGlzdGluZyBvbmUgYmVmb3JlIGl0IGlzIHJlbW92ZWRcblx0XHRcdCAgIHRoaXMgaW5zdXJlcyB0aGF0IGZlYXRoZXJsaWdodC1pbm5lciByZW1haW4gYXQgdGhlIHNhbWUgcmVsYXRpdmVcblx0XHRcdFx0IHBvc2l0aW9uIHRvIGFueSBvdGhlciBpdGVtcyBhZGRlZCB0byBmZWF0aGVybGlnaHQtY29udGVudCAqL1xuXHRcdFx0c2VsZi4kaW5zdGFuY2UuZmluZCgnLicrc2VsZi5uYW1lc3BhY2UrJy1pbm5lcicpXG5cdFx0XHRcdC5ub3QoJGNvbnRlbnQpICAgICAgICAgICAgICAgIC8qIGV4Y2x1ZGVkIG5ldyBjb250ZW50LCBpbXBvcnRhbnQgaWYgcGVyc2lzdGVkICovXG5cdFx0XHRcdC5zbGljZSgxKS5yZW1vdmUoKS5lbmQoKSAgICAgIC8qIEluIHRoZSB1bmV4cGVjdGVkIGV2ZW50IHdoZXJlIHRoZXJlIGFyZSBtYW55IGlubmVyIGVsZW1lbnRzLCByZW1vdmUgYWxsIGJ1dCB0aGUgZmlyc3Qgb25lICovXG5cdFx0XHRcdC5yZXBsYWNlV2l0aCgkLmNvbnRhaW5zKHNlbGYuJGluc3RhbmNlWzBdLCAkY29udGVudFswXSkgPyAnJyA6ICRjb250ZW50KTtcblxuXHRcdFx0c2VsZi4kY29udGVudCA9ICRjb250ZW50LmFkZENsYXNzKHNlbGYubmFtZXNwYWNlKyctaW5uZXInKTtcblxuXHRcdFx0cmV0dXJuIHNlbGY7XG5cdFx0fSxcblxuXHRcdC8qIG9wZW5zIHRoZSBsaWdodGJveC4gXCJ0aGlzXCIgY29udGFpbnMgJGluc3RhbmNlIHdpdGggdGhlIGxpZ2h0Ym94LCBhbmQgd2l0aCB0aGUgY29uZmlnLlxuXHRcdFx0UmV0dXJucyBhIHByb21pc2UgdGhhdCBpcyByZXNvbHZlZCBhZnRlciBpcyBzdWNjZXNzZnVsbHkgb3BlbmVkLiAqL1xuXHRcdG9wZW46IGZ1bmN0aW9uKGV2ZW50KXtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcdHNlbGYuJGluc3RhbmNlLmhpZGUoKS5hcHBlbmRUbyhzZWxmLnJvb3QpO1xuXHRcdFx0aWYoKCFldmVudCB8fCAhZXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkpXG5cdFx0XHRcdCYmIHNlbGYuYmVmb3JlT3BlbihldmVudCkgIT09IGZhbHNlKSB7XG5cblx0XHRcdFx0aWYoZXZlbnQpe1xuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyICRjb250ZW50ID0gc2VsZi5nZXRDb250ZW50KCk7XG5cblx0XHRcdFx0aWYoJGNvbnRlbnQpIHtcblx0XHRcdFx0XHRvcGVuZWQucHVzaChzZWxmKTtcblxuXHRcdFx0XHRcdHRvZ2dsZUdsb2JhbEV2ZW50cyh0cnVlKTtcblxuXHRcdFx0XHRcdHNlbGYuJGluc3RhbmNlLmZhZGVJbihzZWxmLm9wZW5TcGVlZCk7XG5cdFx0XHRcdFx0c2VsZi5iZWZvcmVDb250ZW50KGV2ZW50KTtcblxuXHRcdFx0XHRcdC8qIFNldCBjb250ZW50IGFuZCBzaG93ICovXG5cdFx0XHRcdFx0cmV0dXJuICQud2hlbigkY29udGVudClcblx0XHRcdFx0XHRcdC5hbHdheXMoZnVuY3Rpb24oJGNvbnRlbnQpe1xuXHRcdFx0XHRcdFx0XHRzZWxmLnNldENvbnRlbnQoJGNvbnRlbnQpO1xuXHRcdFx0XHRcdFx0XHRzZWxmLmFmdGVyQ29udGVudChldmVudCk7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnRoZW4oc2VsZi4kaW5zdGFuY2UucHJvbWlzZSgpKVxuXHRcdFx0XHRcdFx0LyogQ2FsbCBhZnRlck9wZW4gYWZ0ZXIgZmFkZUluIGlzIGRvbmUgKi9cblx0XHRcdFx0XHRcdC5kb25lKGZ1bmN0aW9uKCl7IHNlbGYuYWZ0ZXJPcGVuKGV2ZW50KTsgfSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHNlbGYuJGluc3RhbmNlLmRldGFjaCgpO1xuXHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoKS5yZWplY3QoKS5wcm9taXNlKCk7XG5cdFx0fSxcblxuXHRcdC8qIGNsb3NlcyB0aGUgbGlnaHRib3guIFwidGhpc1wiIGNvbnRhaW5zICRpbnN0YW5jZSB3aXRoIHRoZSBsaWdodGJveCwgYW5kIHdpdGggdGhlIGNvbmZpZ1xuXHRcdFx0cmV0dXJucyBhIHByb21pc2UsIHJlc29sdmVkIGFmdGVyIHRoZSBsaWdodGJveCBpcyBzdWNjZXNzZnVsbHkgY2xvc2VkLiAqL1xuXHRcdGNsb3NlOiBmdW5jdGlvbihldmVudCl7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXMsXG5cdFx0XHRcdGRlZmVycmVkID0gJC5EZWZlcnJlZCgpO1xuXG5cdFx0XHRpZihzZWxmLmJlZm9yZUNsb3NlKGV2ZW50KSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KCk7XG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdGlmICgwID09PSBwcnVuZU9wZW5lZChzZWxmKS5sZW5ndGgpIHtcblx0XHRcdFx0XHR0b2dnbGVHbG9iYWxFdmVudHMoZmFsc2UpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c2VsZi4kaW5zdGFuY2UuZmFkZU91dChzZWxmLmNsb3NlU3BlZWQsZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRzZWxmLiRpbnN0YW5jZS5kZXRhY2goKTtcblx0XHRcdFx0XHRzZWxmLmFmdGVyQ2xvc2UoZXZlbnQpO1xuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuXHRcdH0sXG5cblx0XHQvKiBVdGlsaXR5IGZ1bmN0aW9uIHRvIGNoYWluIGNhbGxiYWNrc1xuXHRcdCAgIFtXYXJuaW5nOiBndXJ1LWxldmVsXVxuXHRcdCAgIFVzZWQgYmUgZXh0ZW5zaW9ucyB0aGF0IHdhbnQgdG8gbGV0IHVzZXJzIHNwZWNpZnkgY2FsbGJhY2tzIGJ1dFxuXHRcdCAgIGFsc28gbmVlZCB0aGVtc2VsdmVzIHRvIHVzZSB0aGUgY2FsbGJhY2tzLlxuXHRcdCAgIFRoZSBhcmd1bWVudCAnY2hhaW4nIGhhcyBjYWxsYmFjayBuYW1lcyBhcyBrZXlzIGFuZCBmdW5jdGlvbihzdXBlciwgZXZlbnQpXG5cdFx0ICAgYXMgdmFsdWVzLiBUaGF0IGZ1bmN0aW9uIGlzIG1lYW50IHRvIGNhbGwgYHN1cGVyYCBhdCBzb21lIHBvaW50LlxuXHRcdCovXG5cdFx0Y2hhaW5DYWxsYmFja3M6IGZ1bmN0aW9uKGNoYWluKSB7XG5cdFx0XHRmb3IgKHZhciBuYW1lIGluIGNoYWluKSB7XG5cdFx0XHRcdHRoaXNbbmFtZV0gPSAkLnByb3h5KGNoYWluW25hbWVdLCB0aGlzLCAkLnByb3h5KHRoaXNbbmFtZV0sIHRoaXMpKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0JC5leHRlbmQoRmVhdGhlcmxpZ2h0LCB7XG5cdFx0aWQ6IDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVXNlZCB0byBpZCBzaW5nbGUgZmVhdGhlcmxpZ2h0IGluc3RhbmNlcyAqL1xuXHRcdGF1dG9CaW5kOiAgICAgICAnW2RhdGEtZmVhdGhlcmxpZ2h0XScsICAgIC8qIFdpbGwgYXV0b21hdGljYWxseSBiaW5kIGVsZW1lbnRzIG1hdGNoaW5nIHRoaXMgc2VsZWN0b3IuIENsZWFyIG9yIHNldCBiZWZvcmUgb25SZWFkeSAqL1xuXHRcdGRlZmF1bHRzOiAgICAgICBGZWF0aGVybGlnaHQucHJvdG90eXBlLCAgIC8qIFlvdSBjYW4gYWNjZXNzIGFuZCBvdmVycmlkZSBhbGwgZGVmYXVsdHMgdXNpbmcgJC5mZWF0aGVybGlnaHQuZGVmYXVsdHMsIHdoaWNoIGlzIGp1c3QgYSBzeW5vbnltIGZvciAkLmZlYXRoZXJsaWdodC5wcm90b3R5cGUgKi9cblx0XHQvKiBDb250YWlucyB0aGUgbG9naWMgdG8gZGV0ZXJtaW5lIGNvbnRlbnQgKi9cblx0XHRjb250ZW50RmlsdGVyczoge1xuXHRcdFx0anF1ZXJ5OiB7XG5cdFx0XHRcdHJlZ2V4OiAvXlsjLl1cXHcvLCAgICAgICAgIC8qIEFueXRoaW5nIHRoYXQgc3RhcnRzIHdpdGggYSBjbGFzcyBuYW1lIG9yIGlkZW50aWZpZXJzICovXG5cdFx0XHRcdHRlc3Q6IGZ1bmN0aW9uKGVsZW0pICAgIHsgcmV0dXJuIGVsZW0gaW5zdGFuY2VvZiAkICYmIGVsZW07IH0sXG5cdFx0XHRcdHByb2Nlc3M6IGZ1bmN0aW9uKGVsZW0pIHsgcmV0dXJuIHRoaXMucGVyc2lzdCAhPT0gZmFsc2UgPyAkKGVsZW0pIDogJChlbGVtKS5jbG9uZSh0cnVlKTsgfVxuXHRcdFx0fSxcblx0XHRcdGltYWdlOiB7XG5cdFx0XHRcdHJlZ2V4OiAvXFwuKHBuZ3xqcGd8anBlZ3xnaWZ8dGlmZnxibXB8c3ZnKShcXD9cXFMqKT8kL2ksXG5cdFx0XHRcdHByb2Nlc3M6IGZ1bmN0aW9uKHVybCkgIHtcblx0XHRcdFx0XHR2YXIgc2VsZiA9IHRoaXMsXG5cdFx0XHRcdFx0XHRkZWZlcnJlZCA9ICQuRGVmZXJyZWQoKSxcblx0XHRcdFx0XHRcdGltZyA9IG5ldyBJbWFnZSgpLFxuXHRcdFx0XHRcdFx0JGltZyA9ICQoJzxpbWcgc3JjPVwiJyt1cmwrJ1wiIGFsdD1cIlwiIGNsYXNzPVwiJytzZWxmLm5hbWVzcGFjZSsnLWltYWdlXCIgLz4nKTtcblx0XHRcdFx0XHRpbWcub25sb2FkICA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0LyogU3RvcmUgbmF0dXJhbFdpZHRoICYgaGVpZ2h0IGZvciBJRTggKi9cblx0XHRcdFx0XHRcdCRpbWcubmF0dXJhbFdpZHRoID0gaW1nLndpZHRoOyAkaW1nLm5hdHVyYWxIZWlnaHQgPSBpbWcuaGVpZ2h0O1xuXHRcdFx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZSggJGltZyApO1xuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0aW1nLm9uZXJyb3IgPSBmdW5jdGlvbigpIHsgZGVmZXJyZWQucmVqZWN0KCRpbWcpOyB9O1xuXHRcdFx0XHRcdGltZy5zcmMgPSB1cmw7XG5cdFx0XHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGh0bWw6IHtcblx0XHRcdFx0cmVnZXg6IC9eXFxzKjxbXFx3IV1bXjxdKj4vLCAvKiBBbnl0aGluZyB0aGF0IHN0YXJ0cyB3aXRoIHNvbWUga2luZCBvZiB2YWxpZCB0YWcgKi9cblx0XHRcdFx0cHJvY2VzczogZnVuY3Rpb24oaHRtbCkgeyByZXR1cm4gJChodG1sKTsgfVxuXHRcdFx0fSxcblx0XHRcdGFqYXg6IHtcblx0XHRcdFx0cmVnZXg6IC8uLywgICAgICAgICAgICAvKiBBdCB0aGlzIHBvaW50LCBhbnkgY29udGVudCBpcyBhc3N1bWVkIHRvIGJlIGFuIFVSTCAqL1xuXHRcdFx0XHRwcm9jZXNzOiBmdW5jdGlvbih1cmwpICB7XG5cdFx0XHRcdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0XHRcdFx0ZGVmZXJyZWQgPSAkLkRlZmVycmVkKCk7XG5cdFx0XHRcdFx0Lyogd2UgYXJlIHVzaW5nIGxvYWQgc28gb25lIGNhbiBzcGVjaWZ5IGEgdGFyZ2V0IHdpdGg6IHVybC5odG1sICN0YXJnZXRlbGVtZW50ICovXG5cdFx0XHRcdFx0dmFyICRjb250YWluZXIgPSAkKCc8ZGl2PjwvZGl2PicpLmxvYWQodXJsLCBmdW5jdGlvbihyZXNwb25zZSwgc3RhdHVzKXtcblx0XHRcdFx0XHRcdGlmICggc3RhdHVzICE9PSBcImVycm9yXCIgKSB7XG5cdFx0XHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoJGNvbnRhaW5lci5jb250ZW50cygpKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGRlZmVycmVkLmZhaWwoKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0aWZyYW1lOiB7XG5cdFx0XHRcdHByb2Nlc3M6IGZ1bmN0aW9uKHVybCkge1xuXHRcdFx0XHRcdHZhciBkZWZlcnJlZCA9IG5ldyAkLkRlZmVycmVkKCk7XG5cdFx0XHRcdFx0dmFyICRjb250ZW50ID0gJCgnPGlmcmFtZS8+Jylcblx0XHRcdFx0XHRcdC5oaWRlKClcblx0XHRcdFx0XHRcdC5hdHRyKCdzcmMnLCB1cmwpXG5cdFx0XHRcdFx0XHQuY3NzKHN0cnVjdHVyZSh0aGlzLCAnaWZyYW1lJykpXG5cdFx0XHRcdFx0XHQub24oJ2xvYWQnLCBmdW5jdGlvbigpIHsgZGVmZXJyZWQucmVzb2x2ZSgkY29udGVudC5zaG93KCkpOyB9KVxuXHRcdFx0XHRcdFx0Ly8gV2UgY2FuJ3QgbW92ZSBhbiA8aWZyYW1lPiBhbmQgYXZvaWQgcmVsb2FkaW5nIGl0LFxuXHRcdFx0XHRcdFx0Ly8gc28gbGV0J3MgcHV0IGl0IGluIHBsYWNlIG91cnNlbHZlcyByaWdodCBub3c6XG5cdFx0XHRcdFx0XHQuYXBwZW5kVG8odGhpcy4kaW5zdGFuY2UuZmluZCgnLicgKyB0aGlzLm5hbWVzcGFjZSArICctY29udGVudCcpKTtcblx0XHRcdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0dGV4dDoge1xuXHRcdFx0XHRwcm9jZXNzOiBmdW5jdGlvbih0ZXh0KSB7IHJldHVybiAkKCc8ZGl2PicsIHt0ZXh0OiB0ZXh0fSk7IH1cblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0ZnVuY3Rpb25BdHRyaWJ1dGVzOiBbJ2JlZm9yZU9wZW4nLCAnYWZ0ZXJPcGVuJywgJ2JlZm9yZUNvbnRlbnQnLCAnYWZ0ZXJDb250ZW50JywgJ2JlZm9yZUNsb3NlJywgJ2FmdGVyQ2xvc2UnXSxcblxuXHRcdC8qKiogY2xhc3MgbWV0aG9kcyAqKiovXG5cdFx0LyogcmVhZCBlbGVtZW50J3MgYXR0cmlidXRlcyBzdGFydGluZyB3aXRoIGRhdGEtZmVhdGhlcmxpZ2h0LSAqL1xuXHRcdHJlYWRFbGVtZW50Q29uZmlnOiBmdW5jdGlvbihlbGVtZW50LCBuYW1lc3BhY2UpIHtcblx0XHRcdHZhciBLbGFzcyA9IHRoaXMsXG5cdFx0XHRcdHJlZ2V4cCA9IG5ldyBSZWdFeHAoJ15kYXRhLScgKyBuYW1lc3BhY2UgKyAnLSguKiknKSxcblx0XHRcdFx0Y29uZmlnID0ge307XG5cdFx0XHRpZiAoZWxlbWVudCAmJiBlbGVtZW50LmF0dHJpYnV0ZXMpIHtcblx0XHRcdFx0JC5lYWNoKGVsZW1lbnQuYXR0cmlidXRlcywgZnVuY3Rpb24oKXtcblx0XHRcdFx0XHR2YXIgbWF0Y2ggPSB0aGlzLm5hbWUubWF0Y2gocmVnZXhwKTtcblx0XHRcdFx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdFx0XHRcdHZhciB2YWwgPSB0aGlzLnZhbHVlLFxuXHRcdFx0XHRcdFx0XHRuYW1lID0gJC5jYW1lbENhc2UobWF0Y2hbMV0pO1xuXHRcdFx0XHRcdFx0aWYgKCQuaW5BcnJheShuYW1lLCBLbGFzcy5mdW5jdGlvbkF0dHJpYnV0ZXMpID49IDApIHsgIC8qIGpzaGludCAtVzA1NCAqL1xuXHRcdFx0XHRcdFx0XHR2YWwgPSBuZXcgRnVuY3Rpb24odmFsKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBqc2hpbnQgK1cwNTQgKi9cblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHRyeSB7IHZhbCA9ICQucGFyc2VKU09OKHZhbCk7IH1cblx0XHRcdFx0XHRcdFx0Y2F0Y2goZSkge31cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvbmZpZ1tuYW1lXSA9IHZhbDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGNvbmZpZztcblx0XHR9LFxuXG5cdFx0LyogVXNlZCB0byBjcmVhdGUgYSBGZWF0aGVybGlnaHQgZXh0ZW5zaW9uXG5cdFx0ICAgW1dhcm5pbmc6IGd1cnUtbGV2ZWxdXG5cdFx0ICAgQ3JlYXRlcyB0aGUgZXh0ZW5zaW9uJ3MgcHJvdG90eXBlIHRoYXQgaW4gdHVyblxuXHRcdCAgIGluaGVyaXRzIEZlYXRoZXJsaWdodCdzIHByb3RvdHlwZS5cblx0XHQgICBDb3VsZCBiZSB1c2VkIHRvIGV4dGVuZCBhbiBleHRlbnNpb24gdG9vLi4uXG5cdFx0ICAgVGhpcyBpcyBwcmV0dHkgaGlnaCBsZXZlbCB3aXphcmR5LCBpdCBjb21lcyBwcmV0dHkgbXVjaCBzdHJhaWdodFxuXHRcdCAgIGZyb20gQ29mZmVlU2NyaXB0IGFuZCB3b24ndCB0ZWFjaCB5b3UgYW55dGhpbmcgYWJvdXQgRmVhdGhlcmxpZ2h0XG5cdFx0ICAgYXMgaXQncyBub3QgcmVhbGx5IHNwZWNpZmljIHRvIHRoaXMgbGlicmFyeS5cblx0XHQgICBNeSBzdWdnZXN0aW9uOiBtb3ZlIGFsb25nIGFuZCBrZWVwIHlvdXIgc2FuaXR5LlxuXHRcdCovXG5cdFx0ZXh0ZW5kOiBmdW5jdGlvbihjaGlsZCwgZGVmYXVsdHMpIHtcblx0XHRcdC8qIFNldHVwIGNsYXNzIGhpZXJhcmNoeSwgYWRhcHRlZCBmcm9tIENvZmZlZVNjcmlwdCAqL1xuXHRcdFx0dmFyIEN0b3IgPSBmdW5jdGlvbigpeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH07XG5cdFx0XHRDdG9yLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xuXHRcdFx0Y2hpbGQucHJvdG90eXBlID0gbmV3IEN0b3IoKTtcblx0XHRcdGNoaWxkLl9fc3VwZXJfXyA9IHRoaXMucHJvdG90eXBlO1xuXHRcdFx0LyogQ29weSBjbGFzcyBtZXRob2RzICYgYXR0cmlidXRlcyAqL1xuXHRcdFx0JC5leHRlbmQoY2hpbGQsIHRoaXMsIGRlZmF1bHRzKTtcblx0XHRcdGNoaWxkLmRlZmF1bHRzID0gY2hpbGQucHJvdG90eXBlO1xuXHRcdFx0cmV0dXJuIGNoaWxkO1xuXHRcdH0sXG5cblx0XHRhdHRhY2g6IGZ1bmN0aW9uKCRzb3VyY2UsICRjb250ZW50LCBjb25maWcpIHtcblx0XHRcdHZhciBLbGFzcyA9IHRoaXM7XG5cdFx0XHRpZiAodHlwZW9mICRjb250ZW50ID09PSAnb2JqZWN0JyAmJiAkY29udGVudCBpbnN0YW5jZW9mICQgPT09IGZhbHNlICYmICFjb25maWcpIHtcblx0XHRcdFx0Y29uZmlnID0gJGNvbnRlbnQ7XG5cdFx0XHRcdCRjb250ZW50ID0gdW5kZWZpbmVkO1xuXHRcdFx0fVxuXHRcdFx0LyogbWFrZSBhIGNvcHkgKi9cblx0XHRcdGNvbmZpZyA9ICQuZXh0ZW5kKHt9LCBjb25maWcpO1xuXG5cdFx0XHQvKiBPbmx5IGZvciBvcGVuVHJpZ2dlciBhbmQgbmFtZXNwYWNlLi4uICovXG5cdFx0XHR2YXIgbmFtZXNwYWNlID0gY29uZmlnLm5hbWVzcGFjZSB8fCBLbGFzcy5kZWZhdWx0cy5uYW1lc3BhY2UsXG5cdFx0XHRcdHRlbXBDb25maWcgPSAkLmV4dGVuZCh7fSwgS2xhc3MuZGVmYXVsdHMsIEtsYXNzLnJlYWRFbGVtZW50Q29uZmlnKCRzb3VyY2VbMF0sIG5hbWVzcGFjZSksIGNvbmZpZyksXG5cdFx0XHRcdHNoYXJlZFBlcnNpc3Q7XG5cblx0XHRcdCRzb3VyY2Uub24odGVtcENvbmZpZy5vcGVuVHJpZ2dlcisnLicrdGVtcENvbmZpZy5uYW1lc3BhY2UsIHRlbXBDb25maWcuZmlsdGVyLCBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHQvKiAuLi4gc2luY2Ugd2UgbWlnaHQgYXMgd2VsbCBjb21wdXRlIHRoZSBjb25maWcgb24gdGhlIGFjdHVhbCB0YXJnZXQgKi9cblx0XHRcdFx0dmFyIGVsZW1Db25maWcgPSAkLmV4dGVuZChcblx0XHRcdFx0XHR7JHNvdXJjZTogJHNvdXJjZSwgJGN1cnJlbnRUYXJnZXQ6ICQodGhpcyl9LFxuXHRcdFx0XHRcdEtsYXNzLnJlYWRFbGVtZW50Q29uZmlnKCRzb3VyY2VbMF0sIHRlbXBDb25maWcubmFtZXNwYWNlKSxcblx0XHRcdFx0XHRLbGFzcy5yZWFkRWxlbWVudENvbmZpZyh0aGlzLCB0ZW1wQ29uZmlnLm5hbWVzcGFjZSksXG5cdFx0XHRcdFx0Y29uZmlnKTtcblx0XHRcdFx0dmFyIGZsID0gc2hhcmVkUGVyc2lzdCB8fCAkKHRoaXMpLmRhdGEoJ2ZlYXRoZXJsaWdodC1wZXJzaXN0ZWQnKSB8fCBuZXcgS2xhc3MoJGNvbnRlbnQsIGVsZW1Db25maWcpO1xuXHRcdFx0XHRpZihmbC5wZXJzaXN0ID09PSAnc2hhcmVkJykge1xuXHRcdFx0XHRcdHNoYXJlZFBlcnNpc3QgPSBmbDtcblx0XHRcdFx0fSBlbHNlIGlmKGZsLnBlcnNpc3QgIT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0JCh0aGlzKS5kYXRhKCdmZWF0aGVybGlnaHQtcGVyc2lzdGVkJywgZmwpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsZW1Db25maWcuJGN1cnJlbnRUYXJnZXQuYmx1cigpOyAvLyBPdGhlcndpc2UgJ2VudGVyJyBrZXkgbWlnaHQgdHJpZ2dlciB0aGUgZGlhbG9nIGFnYWluXG5cdFx0XHRcdGZsLm9wZW4oZXZlbnQpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gJHNvdXJjZTtcblx0XHR9LFxuXG5cdFx0Y3VycmVudDogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgYWxsID0gdGhpcy5vcGVuZWQoKTtcblx0XHRcdHJldHVybiBhbGxbYWxsLmxlbmd0aCAtIDFdIHx8IG51bGw7XG5cdFx0fSxcblxuXHRcdG9wZW5lZDogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIga2xhc3MgPSB0aGlzO1xuXHRcdFx0cHJ1bmVPcGVuZWQoKTtcblx0XHRcdHJldHVybiAkLmdyZXAob3BlbmVkLCBmdW5jdGlvbihmbCkgeyByZXR1cm4gZmwgaW5zdGFuY2VvZiBrbGFzczsgfSApO1xuXHRcdH0sXG5cblx0XHRjbG9zZTogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdHZhciBjdXIgPSB0aGlzLmN1cnJlbnQoKTtcblx0XHRcdGlmKGN1cikgeyByZXR1cm4gY3VyLmNsb3NlKGV2ZW50KTsgfVxuXHRcdH0sXG5cblx0XHQvKiBEb2VzIHRoZSBhdXRvIGJpbmRpbmcgb24gc3RhcnR1cC5cblx0XHQgICBNZWFudCBvbmx5IHRvIGJlIHVzZWQgYnkgRmVhdGhlcmxpZ2h0IGFuZCBpdHMgZXh0ZW5zaW9uc1xuXHRcdCovXG5cdFx0X29uUmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIEtsYXNzID0gdGhpcztcblx0XHRcdGlmKEtsYXNzLmF1dG9CaW5kKXtcblx0XHRcdFx0LyogQmluZCBleGlzdGluZyBlbGVtZW50cyAqL1xuXHRcdFx0XHQkKEtsYXNzLmF1dG9CaW5kKS5lYWNoKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0S2xhc3MuYXR0YWNoKCQodGhpcykpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0LyogSWYgYSBjbGljayBwcm9wYWdhdGVzIHRvIHRoZSBkb2N1bWVudCBsZXZlbCwgdGhlbiB3ZSBoYXZlIGFuIGl0ZW0gdGhhdCB3YXMgYWRkZWQgbGF0ZXIgb24gKi9cblx0XHRcdFx0JChkb2N1bWVudCkub24oJ2NsaWNrJywgS2xhc3MuYXV0b0JpbmQsIGZ1bmN0aW9uKGV2dCkge1xuXHRcdFx0XHRcdGlmIChldnQuaXNEZWZhdWx0UHJldmVudGVkKCkgfHwgZXZ0Lm5hbWVzcGFjZSA9PT0gJ2ZlYXRoZXJsaWdodCcpIHtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0LyogQmluZCBmZWF0aGVybGlnaHQgKi9cblx0XHRcdFx0XHRLbGFzcy5hdHRhY2goJChldnQuY3VycmVudFRhcmdldCkpO1xuXHRcdFx0XHRcdC8qIENsaWNrIGFnYWluOyB0aGlzIHRpbWUgb3VyIGJpbmRpbmcgd2lsbCBjYXRjaCBpdCAqL1xuXHRcdFx0XHRcdCQoZXZ0LnRhcmdldCkudHJpZ2dlcignY2xpY2suZmVhdGhlcmxpZ2h0Jyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvKiBGZWF0aGVybGlnaHQgdXNlcyB0aGUgb25LZXlVcCBjYWxsYmFjayB0byBpbnRlcmNlcHQgdGhlIGVzY2FwZSBrZXkuXG5cdFx0ICAgUHJpdmF0ZSB0byBGZWF0aGVybGlnaHQuXG5cdFx0Ki9cblx0XHRfY2FsbGJhY2tDaGFpbjoge1xuXHRcdFx0b25LZXlVcDogZnVuY3Rpb24oX3N1cGVyLCBldmVudCl7XG5cdFx0XHRcdGlmKDI3ID09PSBldmVudC5rZXlDb2RlKSB7XG5cdFx0XHRcdFx0aWYgKHRoaXMuY2xvc2VPbkVzYykge1xuXHRcdFx0XHRcdFx0JC5mZWF0aGVybGlnaHQuY2xvc2UoZXZlbnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIF9zdXBlcihldmVudCk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdG9uUmVzaXplOiBmdW5jdGlvbihfc3VwZXIsIGV2ZW50KXtcblx0XHRcdFx0aWYgKHRoaXMuJGNvbnRlbnQubmF0dXJhbFdpZHRoKSB7XG5cdFx0XHRcdFx0dmFyIHcgPSB0aGlzLiRjb250ZW50Lm5hdHVyYWxXaWR0aCwgaCA9IHRoaXMuJGNvbnRlbnQubmF0dXJhbEhlaWdodDtcblx0XHRcdFx0XHQvKiBSZXNldCBhcHBhcmVudCBpbWFnZSBzaXplIGZpcnN0IHNvIGNvbnRhaW5lciBncm93cyAqL1xuXHRcdFx0XHRcdHRoaXMuJGNvbnRlbnQuY3NzKCd3aWR0aCcsICcnKS5jc3MoJ2hlaWdodCcsICcnKTtcblx0XHRcdFx0XHQvKiBDYWxjdWxhdGUgdGhlIHdvcnN0IHJhdGlvIHNvIHRoYXQgZGltZW5zaW9ucyBmaXQgKi9cblx0XHRcdFx0XHR2YXIgcmF0aW8gPSBNYXRoLm1heChcblx0XHRcdFx0XHRcdHcgIC8gcGFyc2VJbnQodGhpcy4kY29udGVudC5wYXJlbnQoKS5jc3MoJ3dpZHRoJyksMTApLFxuXHRcdFx0XHRcdFx0aCAvIHBhcnNlSW50KHRoaXMuJGNvbnRlbnQucGFyZW50KCkuY3NzKCdoZWlnaHQnKSwxMCkpO1xuXHRcdFx0XHRcdC8qIFJlc2l6ZSBjb250ZW50ICovXG5cdFx0XHRcdFx0aWYgKHJhdGlvID4gMSkge1xuXHRcdFx0XHRcdFx0dGhpcy4kY29udGVudC5jc3MoJ3dpZHRoJywgJycgKyB3IC8gcmF0aW8gKyAncHgnKS5jc3MoJ2hlaWdodCcsICcnICsgaCAvIHJhdGlvICsgJ3B4Jyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBfc3VwZXIoZXZlbnQpO1xuXHRcdFx0fSxcblxuXHRcdFx0YWZ0ZXJDb250ZW50OiBmdW5jdGlvbihfc3VwZXIsIGV2ZW50KXtcblx0XHRcdFx0dmFyIHIgPSBfc3VwZXIoZXZlbnQpO1xuXHRcdFx0XHR0aGlzLm9uUmVzaXplKGV2ZW50KTtcblx0XHRcdFx0cmV0dXJuIHI7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxuXHQkLmZlYXRoZXJsaWdodCA9IEZlYXRoZXJsaWdodDtcblxuXHQvKiBiaW5kIGpRdWVyeSBlbGVtZW50cyB0byB0cmlnZ2VyIGZlYXRoZXJsaWdodCAqL1xuXHQkLmZuLmZlYXRoZXJsaWdodCA9IGZ1bmN0aW9uKCRjb250ZW50LCBjb25maWcpIHtcblx0XHRyZXR1cm4gRmVhdGhlcmxpZ2h0LmF0dGFjaCh0aGlzLCAkY29udGVudCwgY29uZmlnKTtcblx0fTtcblxuXHQvKiBiaW5kIGZlYXRoZXJsaWdodCBvbiByZWFkeSBpZiBjb25maWcgYXV0b0JpbmQgaXMgc2V0ICovXG5cdCQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7IEZlYXRoZXJsaWdodC5fb25SZWFkeSgpOyB9KTtcbn0oalF1ZXJ5KSk7XG4iLCIvKiFcbiAqIE1hc29ucnkgUEFDS0FHRUQgdjQuMC4wXG4gKiBDYXNjYWRpbmcgZ3JpZCBsYXlvdXQgbGlicmFyeVxuICogaHR0cDovL21hc29ucnkuZGVzYW5kcm8uY29tXG4gKiBNSVQgTGljZW5zZVxuICogYnkgRGF2aWQgRGVTYW5kcm9cbiAqL1xuXG4vKipcbiAqIEJyaWRnZXQgbWFrZXMgalF1ZXJ5IHdpZGdldHNcbiAqIHYyLjAuMFxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKiBqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgc3RyaWN0OiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvKiBnbG9iYWxzIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIHJlcXVpcmU6IGZhbHNlICovXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoICdqcXVlcnktYnJpZGdldC9qcXVlcnktYnJpZGdldCcsWyAnanF1ZXJ5JyBdLCBmdW5jdGlvbiggalF1ZXJ5ICkge1xuICAgICAgZmFjdG9yeSggd2luZG93LCBqUXVlcnkgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2pxdWVyeScpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5qUXVlcnlCcmlkZ2V0ID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5qUXVlcnlcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBqUXVlcnkgKSB7XG4ndXNlIHN0cmljdCc7XG5cbi8vIC0tLS0tIHV0aWxzIC0tLS0tIC8vXG5cbnZhciBhcnJheVNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuXG4vLyBoZWxwZXIgZnVuY3Rpb24gZm9yIGxvZ2dpbmcgZXJyb3JzXG4vLyAkLmVycm9yIGJyZWFrcyBqUXVlcnkgY2hhaW5pbmdcbnZhciBjb25zb2xlID0gd2luZG93LmNvbnNvbGU7XG52YXIgbG9nRXJyb3IgPSB0eXBlb2YgY29uc29sZSA9PSAndW5kZWZpbmVkJyA/IGZ1bmN0aW9uKCkge30gOlxuICBmdW5jdGlvbiggbWVzc2FnZSApIHtcbiAgICBjb25zb2xlLmVycm9yKCBtZXNzYWdlICk7XG4gIH07XG5cbi8vIC0tLS0tIGpRdWVyeUJyaWRnZXQgLS0tLS0gLy9cblxuZnVuY3Rpb24galF1ZXJ5QnJpZGdldCggbmFtZXNwYWNlLCBQbHVnaW5DbGFzcywgJCApIHtcbiAgJCA9ICQgfHwgalF1ZXJ5IHx8IHdpbmRvdy5qUXVlcnk7XG4gIGlmICggISQgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gYWRkIG9wdGlvbiBtZXRob2QgLT4gJCgpLnBsdWdpbignb3B0aW9uJywgey4uLn0pXG4gIGlmICggIVBsdWdpbkNsYXNzLnByb3RvdHlwZS5vcHRpb24gKSB7XG4gICAgLy8gb3B0aW9uIHNldHRlclxuICAgIFBsdWdpbkNsYXNzLnByb3RvdHlwZS5vcHRpb24gPSBmdW5jdGlvbiggb3B0cyApIHtcbiAgICAgIC8vIGJhaWwgb3V0IGlmIG5vdCBhbiBvYmplY3RcbiAgICAgIGlmICggISQuaXNQbGFpbk9iamVjdCggb3B0cyApICl7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKCB0cnVlLCB0aGlzLm9wdGlvbnMsIG9wdHMgKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gbWFrZSBqUXVlcnkgcGx1Z2luXG4gICQuZm5bIG5hbWVzcGFjZSBdID0gZnVuY3Rpb24oIGFyZzAgLyosIGFyZzEgKi8gKSB7XG4gICAgaWYgKCB0eXBlb2YgYXJnMCA9PSAnc3RyaW5nJyApIHtcbiAgICAgIC8vIG1ldGhvZCBjYWxsICQoKS5wbHVnaW4oICdtZXRob2ROYW1lJywgeyBvcHRpb25zIH0gKVxuICAgICAgLy8gc2hpZnQgYXJndW1lbnRzIGJ5IDFcbiAgICAgIHZhciBhcmdzID0gYXJyYXlTbGljZS5jYWxsKCBhcmd1bWVudHMsIDEgKTtcbiAgICAgIHJldHVybiBtZXRob2RDYWxsKCB0aGlzLCBhcmcwLCBhcmdzICk7XG4gICAgfVxuICAgIC8vIGp1c3QgJCgpLnBsdWdpbih7IG9wdGlvbnMgfSlcbiAgICBwbGFpbkNhbGwoIHRoaXMsIGFyZzAgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyAkKCkucGx1Z2luKCdtZXRob2ROYW1lJylcbiAgZnVuY3Rpb24gbWV0aG9kQ2FsbCggJGVsZW1zLCBtZXRob2ROYW1lLCBhcmdzICkge1xuICAgIHZhciByZXR1cm5WYWx1ZTtcbiAgICB2YXIgcGx1Z2luTWV0aG9kU3RyID0gJyQoKS4nICsgbmFtZXNwYWNlICsgJyhcIicgKyBtZXRob2ROYW1lICsgJ1wiKSc7XG5cbiAgICAkZWxlbXMuZWFjaCggZnVuY3Rpb24oIGksIGVsZW0gKSB7XG4gICAgICAvLyBnZXQgaW5zdGFuY2VcbiAgICAgIHZhciBpbnN0YW5jZSA9ICQuZGF0YSggZWxlbSwgbmFtZXNwYWNlICk7XG4gICAgICBpZiAoICFpbnN0YW5jZSApIHtcbiAgICAgICAgbG9nRXJyb3IoIG5hbWVzcGFjZSArICcgbm90IGluaXRpYWxpemVkLiBDYW5ub3QgY2FsbCBtZXRob2RzLCBpLmUuICcgK1xuICAgICAgICAgIHBsdWdpbk1ldGhvZFN0ciApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBtZXRob2QgPSBpbnN0YW5jZVsgbWV0aG9kTmFtZSBdO1xuICAgICAgaWYgKCAhbWV0aG9kIHx8IG1ldGhvZE5hbWUuY2hhckF0KDApID09ICdfJyApIHtcbiAgICAgICAgbG9nRXJyb3IoIHBsdWdpbk1ldGhvZFN0ciArICcgaXMgbm90IGEgdmFsaWQgbWV0aG9kJyApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIGFwcGx5IG1ldGhvZCwgZ2V0IHJldHVybiB2YWx1ZVxuICAgICAgdmFyIHZhbHVlID0gbWV0aG9kLmFwcGx5KCBpbnN0YW5jZSwgYXJncyApO1xuICAgICAgLy8gc2V0IHJldHVybiB2YWx1ZSBpZiB2YWx1ZSBpcyByZXR1cm5lZCwgdXNlIG9ubHkgZmlyc3QgdmFsdWVcbiAgICAgIHJldHVyblZhbHVlID0gcmV0dXJuVmFsdWUgPT09IHVuZGVmaW5lZCA/IHZhbHVlIDogcmV0dXJuVmFsdWU7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmV0dXJuVmFsdWUgIT09IHVuZGVmaW5lZCA/IHJldHVyblZhbHVlIDogJGVsZW1zO1xuICB9XG5cbiAgZnVuY3Rpb24gcGxhaW5DYWxsKCAkZWxlbXMsIG9wdGlvbnMgKSB7XG4gICAgJGVsZW1zLmVhY2goIGZ1bmN0aW9uKCBpLCBlbGVtICkge1xuICAgICAgdmFyIGluc3RhbmNlID0gJC5kYXRhKCBlbGVtLCBuYW1lc3BhY2UgKTtcbiAgICAgIGlmICggaW5zdGFuY2UgKSB7XG4gICAgICAgIC8vIHNldCBvcHRpb25zICYgaW5pdFxuICAgICAgICBpbnN0YW5jZS5vcHRpb24oIG9wdGlvbnMgKTtcbiAgICAgICAgaW5zdGFuY2UuX2luaXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGluaXRpYWxpemUgbmV3IGluc3RhbmNlXG4gICAgICAgIGluc3RhbmNlID0gbmV3IFBsdWdpbkNsYXNzKCBlbGVtLCBvcHRpb25zICk7XG4gICAgICAgICQuZGF0YSggZWxlbSwgbmFtZXNwYWNlLCBpbnN0YW5jZSApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlSlF1ZXJ5KCAkICk7XG5cbn1cblxuLy8gLS0tLS0gdXBkYXRlSlF1ZXJ5IC0tLS0tIC8vXG5cbi8vIHNldCAkLmJyaWRnZXQgZm9yIHYxIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG5mdW5jdGlvbiB1cGRhdGVKUXVlcnkoICQgKSB7XG4gIGlmICggISQgfHwgKCAkICYmICQuYnJpZGdldCApICkge1xuICAgIHJldHVybjtcbiAgfVxuICAkLmJyaWRnZXQgPSBqUXVlcnlCcmlkZ2V0O1xufVxuXG51cGRhdGVKUXVlcnkoIGpRdWVyeSB8fCB3aW5kb3cualF1ZXJ5ICk7XG5cbi8vIC0tLS0tICAtLS0tLSAvL1xuXG5yZXR1cm4galF1ZXJ5QnJpZGdldDtcblxufSkpO1xuXG4vKipcbiAqIEV2RW1pdHRlciB2MS4wLjFcbiAqIExpbCcgZXZlbnQgZW1pdHRlclxuICogTUlUIExpY2Vuc2VcbiAqL1xuXG4vKiBqc2hpbnQgdW51c2VkOiB0cnVlLCB1bmRlZjogdHJ1ZSwgc3RyaWN0OiB0cnVlICovXG5cbiggZnVuY3Rpb24oIGdsb2JhbCwgZmFjdG9yeSApIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG4gIC8qIGpzaGludCBzdHJpY3Q6IGZhbHNlICovIC8qIGdsb2JhbHMgZGVmaW5lLCBtb2R1bGUgKi9cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTUQgLSBSZXF1aXJlSlNcbiAgICBkZWZpbmUoICdldi1lbWl0dGVyL2V2LWVtaXR0ZXInLGZhY3RvcnkgKTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyApIHtcbiAgICAvLyBDb21tb25KUyAtIEJyb3dzZXJpZnksIFdlYnBhY2tcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBCcm93c2VyIGdsb2JhbHNcbiAgICBnbG9iYWwuRXZFbWl0dGVyID0gZmFjdG9yeSgpO1xuICB9XG5cbn0oIHRoaXMsIGZ1bmN0aW9uKCkge1xuXG5cblxuZnVuY3Rpb24gRXZFbWl0dGVyKCkge31cblxudmFyIHByb3RvID0gRXZFbWl0dGVyLnByb3RvdHlwZTtcblxucHJvdG8ub24gPSBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApIHtcbiAgaWYgKCAhZXZlbnROYW1lIHx8ICFsaXN0ZW5lciApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gc2V0IGV2ZW50cyBoYXNoXG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIC8vIHNldCBsaXN0ZW5lcnMgYXJyYXlcbiAgdmFyIGxpc3RlbmVycyA9IGV2ZW50c1sgZXZlbnROYW1lIF0gPSBldmVudHNbIGV2ZW50TmFtZSBdIHx8IFtdO1xuICAvLyBvbmx5IGFkZCBvbmNlXG4gIGlmICggbGlzdGVuZXJzLmluZGV4T2YoIGxpc3RlbmVyICkgPT0gLTEgKSB7XG4gICAgbGlzdGVuZXJzLnB1c2goIGxpc3RlbmVyICk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLm9uY2UgPSBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApIHtcbiAgaWYgKCAhZXZlbnROYW1lIHx8ICFsaXN0ZW5lciApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gYWRkIGV2ZW50XG4gIHRoaXMub24oIGV2ZW50TmFtZSwgbGlzdGVuZXIgKTtcbiAgLy8gc2V0IG9uY2UgZmxhZ1xuICAvLyBzZXQgb25jZUV2ZW50cyBoYXNoXG4gIHZhciBvbmNlRXZlbnRzID0gdGhpcy5fb25jZUV2ZW50cyA9IHRoaXMuX29uY2VFdmVudHMgfHwge307XG4gIC8vIHNldCBvbmNlTGlzdGVuZXJzIGFycmF5XG4gIHZhciBvbmNlTGlzdGVuZXJzID0gb25jZUV2ZW50c1sgZXZlbnROYW1lIF0gPSBvbmNlRXZlbnRzWyBldmVudE5hbWUgXSB8fCBbXTtcbiAgLy8gc2V0IGZsYWdcbiAgb25jZUxpc3RlbmVyc1sgbGlzdGVuZXIgXSA9IHRydWU7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5vZmYgPSBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApIHtcbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbIGV2ZW50TmFtZSBdO1xuICBpZiAoICFsaXN0ZW5lcnMgfHwgIWxpc3RlbmVycy5sZW5ndGggKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBpbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKCBsaXN0ZW5lciApO1xuICBpZiAoIGluZGV4ICE9IC0xICkge1xuICAgIGxpc3RlbmVycy5zcGxpY2UoIGluZGV4LCAxICk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmVtaXRFdmVudCA9IGZ1bmN0aW9uKCBldmVudE5hbWUsIGFyZ3MgKSB7XG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXTtcbiAgaWYgKCAhbGlzdGVuZXJzIHx8ICFsaXN0ZW5lcnMubGVuZ3RoICkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgaSA9IDA7XG4gIHZhciBsaXN0ZW5lciA9IGxpc3RlbmVyc1tpXTtcbiAgYXJncyA9IGFyZ3MgfHwgW107XG4gIC8vIG9uY2Ugc3R1ZmZcbiAgdmFyIG9uY2VMaXN0ZW5lcnMgPSB0aGlzLl9vbmNlRXZlbnRzICYmIHRoaXMuX29uY2VFdmVudHNbIGV2ZW50TmFtZSBdO1xuXG4gIHdoaWxlICggbGlzdGVuZXIgKSB7XG4gICAgdmFyIGlzT25jZSA9IG9uY2VMaXN0ZW5lcnMgJiYgb25jZUxpc3RlbmVyc1sgbGlzdGVuZXIgXTtcbiAgICBpZiAoIGlzT25jZSApIHtcbiAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lclxuICAgICAgLy8gcmVtb3ZlIGJlZm9yZSB0cmlnZ2VyIHRvIHByZXZlbnQgcmVjdXJzaW9uXG4gICAgICB0aGlzLm9mZiggZXZlbnROYW1lLCBsaXN0ZW5lciApO1xuICAgICAgLy8gdW5zZXQgb25jZSBmbGFnXG4gICAgICBkZWxldGUgb25jZUxpc3RlbmVyc1sgbGlzdGVuZXIgXTtcbiAgICB9XG4gICAgLy8gdHJpZ2dlciBsaXN0ZW5lclxuICAgIGxpc3RlbmVyLmFwcGx5KCB0aGlzLCBhcmdzICk7XG4gICAgLy8gZ2V0IG5leHQgbGlzdGVuZXJcbiAgICBpICs9IGlzT25jZSA/IDAgOiAxO1xuICAgIGxpc3RlbmVyID0gbGlzdGVuZXJzW2ldO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5yZXR1cm4gRXZFbWl0dGVyO1xuXG59KSk7XG5cbi8qIVxuICogZ2V0U2l6ZSB2Mi4wLjJcbiAqIG1lYXN1cmUgc2l6ZSBvZiBlbGVtZW50c1xuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCBzdHJpY3Q6IHRydWUsIHVuZGVmOiB0cnVlLCB1bnVzZWQ6IHRydWUgKi9cbi8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIGNvbnNvbGU6IGZhbHNlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCAnZ2V0LXNpemUvZ2V0LXNpemUnLFtdLGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LmdldFNpemUgPSBmYWN0b3J5KCk7XG4gIH1cblxufSkoIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSgpIHtcbid1c2Ugc3RyaWN0JztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGVscGVycyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyBnZXQgYSBudW1iZXIgZnJvbSBhIHN0cmluZywgbm90IGEgcGVyY2VudGFnZVxuZnVuY3Rpb24gZ2V0U3R5bGVTaXplKCB2YWx1ZSApIHtcbiAgdmFyIG51bSA9IHBhcnNlRmxvYXQoIHZhbHVlICk7XG4gIC8vIG5vdCBhIHBlcmNlbnQgbGlrZSAnMTAwJScsIGFuZCBhIG51bWJlclxuICB2YXIgaXNWYWxpZCA9IHZhbHVlLmluZGV4T2YoJyUnKSA9PSAtMSAmJiAhaXNOYU4oIG51bSApO1xuICByZXR1cm4gaXNWYWxpZCAmJiBudW07XG59XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG52YXIgbG9nRXJyb3IgPSB0eXBlb2YgY29uc29sZSA9PSAndW5kZWZpbmVkJyA/IG5vb3AgOlxuICBmdW5jdGlvbiggbWVzc2FnZSApIHtcbiAgICBjb25zb2xlLmVycm9yKCBtZXNzYWdlICk7XG4gIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG1lYXN1cmVtZW50cyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG52YXIgbWVhc3VyZW1lbnRzID0gW1xuICAncGFkZGluZ0xlZnQnLFxuICAncGFkZGluZ1JpZ2h0JyxcbiAgJ3BhZGRpbmdUb3AnLFxuICAncGFkZGluZ0JvdHRvbScsXG4gICdtYXJnaW5MZWZ0JyxcbiAgJ21hcmdpblJpZ2h0JyxcbiAgJ21hcmdpblRvcCcsXG4gICdtYXJnaW5Cb3R0b20nLFxuICAnYm9yZGVyTGVmdFdpZHRoJyxcbiAgJ2JvcmRlclJpZ2h0V2lkdGgnLFxuICAnYm9yZGVyVG9wV2lkdGgnLFxuICAnYm9yZGVyQm90dG9tV2lkdGgnXG5dO1xuXG52YXIgbWVhc3VyZW1lbnRzTGVuZ3RoID0gbWVhc3VyZW1lbnRzLmxlbmd0aDtcblxuZnVuY3Rpb24gZ2V0WmVyb1NpemUoKSB7XG4gIHZhciBzaXplID0ge1xuICAgIHdpZHRoOiAwLFxuICAgIGhlaWdodDogMCxcbiAgICBpbm5lcldpZHRoOiAwLFxuICAgIGlubmVySGVpZ2h0OiAwLFxuICAgIG91dGVyV2lkdGg6IDAsXG4gICAgb3V0ZXJIZWlnaHQ6IDBcbiAgfTtcbiAgZm9yICggdmFyIGk9MDsgaSA8IG1lYXN1cmVtZW50c0xlbmd0aDsgaSsrICkge1xuICAgIHZhciBtZWFzdXJlbWVudCA9IG1lYXN1cmVtZW50c1tpXTtcbiAgICBzaXplWyBtZWFzdXJlbWVudCBdID0gMDtcbiAgfVxuICByZXR1cm4gc2l6ZTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZ2V0U3R5bGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLyoqXG4gKiBnZXRTdHlsZSwgZ2V0IHN0eWxlIG9mIGVsZW1lbnQsIGNoZWNrIGZvciBGaXJlZm94IGJ1Z1xuICogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NTQ4Mzk3XG4gKi9cbmZ1bmN0aW9uIGdldFN0eWxlKCBlbGVtICkge1xuICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKCBlbGVtICk7XG4gIGlmICggIXN0eWxlICkge1xuICAgIGxvZ0Vycm9yKCAnU3R5bGUgcmV0dXJuZWQgJyArIHN0eWxlICtcbiAgICAgICcuIEFyZSB5b3UgcnVubmluZyB0aGlzIGNvZGUgaW4gYSBoaWRkZW4gaWZyYW1lIG9uIEZpcmVmb3g/ICcgK1xuICAgICAgJ1NlZSBodHRwOi8vYml0Lmx5L2dldHNpemVidWcxJyApO1xuICB9XG4gIHJldHVybiBzdHlsZTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gc2V0dXAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxudmFyIGlzU2V0dXAgPSBmYWxzZTtcblxudmFyIGlzQm94U2l6ZU91dGVyO1xuXG4vKipcbiAqIHNldHVwXG4gKiBjaGVjayBpc0JveFNpemVyT3V0ZXJcbiAqIGRvIG9uIGZpcnN0IGdldFNpemUoKSByYXRoZXIgdGhhbiBvbiBwYWdlIGxvYWQgZm9yIEZpcmVmb3ggYnVnXG4gKi9cbmZ1bmN0aW9uIHNldHVwKCkge1xuICAvLyBzZXR1cCBvbmNlXG4gIGlmICggaXNTZXR1cCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaXNTZXR1cCA9IHRydWU7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYm94IHNpemluZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8qKlxuICAgKiBXZWJLaXQgbWVhc3VyZXMgdGhlIG91dGVyLXdpZHRoIG9uIHN0eWxlLndpZHRoIG9uIGJvcmRlci1ib3ggZWxlbXNcbiAgICogSUUgJiBGaXJlZm94PDI5IG1lYXN1cmVzIHRoZSBpbm5lci13aWR0aFxuICAgKi9cbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuc3R5bGUud2lkdGggPSAnMjAwcHgnO1xuICBkaXYuc3R5bGUucGFkZGluZyA9ICcxcHggMnB4IDNweCA0cHgnO1xuICBkaXYuc3R5bGUuYm9yZGVyU3R5bGUgPSAnc29saWQnO1xuICBkaXYuc3R5bGUuYm9yZGVyV2lkdGggPSAnMXB4IDJweCAzcHggNHB4JztcbiAgZGl2LnN0eWxlLmJveFNpemluZyA9ICdib3JkZXItYm94JztcblxuICB2YXIgYm9keSA9IGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICBib2R5LmFwcGVuZENoaWxkKCBkaXYgKTtcbiAgdmFyIHN0eWxlID0gZ2V0U3R5bGUoIGRpdiApO1xuXG4gIGdldFNpemUuaXNCb3hTaXplT3V0ZXIgPSBpc0JveFNpemVPdXRlciA9IGdldFN0eWxlU2l6ZSggc3R5bGUud2lkdGggKSA9PSAyMDA7XG4gIGJvZHkucmVtb3ZlQ2hpbGQoIGRpdiApO1xuXG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGdldFNpemUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuZnVuY3Rpb24gZ2V0U2l6ZSggZWxlbSApIHtcbiAgc2V0dXAoKTtcblxuICAvLyB1c2UgcXVlcnlTZWxldG9yIGlmIGVsZW0gaXMgc3RyaW5nXG4gIGlmICggdHlwZW9mIGVsZW0gPT0gJ3N0cmluZycgKSB7XG4gICAgZWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIGVsZW0gKTtcbiAgfVxuXG4gIC8vIGRvIG5vdCBwcm9jZWVkIG9uIG5vbi1vYmplY3RzXG4gIGlmICggIWVsZW0gfHwgdHlwZW9mIGVsZW0gIT0gJ29iamVjdCcgfHwgIWVsZW0ubm9kZVR5cGUgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHN0eWxlID0gZ2V0U3R5bGUoIGVsZW0gKTtcblxuICAvLyBpZiBoaWRkZW4sIGV2ZXJ5dGhpbmcgaXMgMFxuICBpZiAoIHN0eWxlLmRpc3BsYXkgPT0gJ25vbmUnICkge1xuICAgIHJldHVybiBnZXRaZXJvU2l6ZSgpO1xuICB9XG5cbiAgdmFyIHNpemUgPSB7fTtcbiAgc2l6ZS53aWR0aCA9IGVsZW0ub2Zmc2V0V2lkdGg7XG4gIHNpemUuaGVpZ2h0ID0gZWxlbS5vZmZzZXRIZWlnaHQ7XG5cbiAgdmFyIGlzQm9yZGVyQm94ID0gc2l6ZS5pc0JvcmRlckJveCA9IHN0eWxlLmJveFNpemluZyA9PSAnYm9yZGVyLWJveCc7XG5cbiAgLy8gZ2V0IGFsbCBtZWFzdXJlbWVudHNcbiAgZm9yICggdmFyIGk9MDsgaSA8IG1lYXN1cmVtZW50c0xlbmd0aDsgaSsrICkge1xuICAgIHZhciBtZWFzdXJlbWVudCA9IG1lYXN1cmVtZW50c1tpXTtcbiAgICB2YXIgdmFsdWUgPSBzdHlsZVsgbWVhc3VyZW1lbnQgXTtcbiAgICB2YXIgbnVtID0gcGFyc2VGbG9hdCggdmFsdWUgKTtcbiAgICAvLyBhbnkgJ2F1dG8nLCAnbWVkaXVtJyB2YWx1ZSB3aWxsIGJlIDBcbiAgICBzaXplWyBtZWFzdXJlbWVudCBdID0gIWlzTmFOKCBudW0gKSA/IG51bSA6IDA7XG4gIH1cblxuICB2YXIgcGFkZGluZ1dpZHRoID0gc2l6ZS5wYWRkaW5nTGVmdCArIHNpemUucGFkZGluZ1JpZ2h0O1xuICB2YXIgcGFkZGluZ0hlaWdodCA9IHNpemUucGFkZGluZ1RvcCArIHNpemUucGFkZGluZ0JvdHRvbTtcbiAgdmFyIG1hcmdpbldpZHRoID0gc2l6ZS5tYXJnaW5MZWZ0ICsgc2l6ZS5tYXJnaW5SaWdodDtcbiAgdmFyIG1hcmdpbkhlaWdodCA9IHNpemUubWFyZ2luVG9wICsgc2l6ZS5tYXJnaW5Cb3R0b207XG4gIHZhciBib3JkZXJXaWR0aCA9IHNpemUuYm9yZGVyTGVmdFdpZHRoICsgc2l6ZS5ib3JkZXJSaWdodFdpZHRoO1xuICB2YXIgYm9yZGVySGVpZ2h0ID0gc2l6ZS5ib3JkZXJUb3BXaWR0aCArIHNpemUuYm9yZGVyQm90dG9tV2lkdGg7XG5cbiAgdmFyIGlzQm9yZGVyQm94U2l6ZU91dGVyID0gaXNCb3JkZXJCb3ggJiYgaXNCb3hTaXplT3V0ZXI7XG5cbiAgLy8gb3ZlcndyaXRlIHdpZHRoIGFuZCBoZWlnaHQgaWYgd2UgY2FuIGdldCBpdCBmcm9tIHN0eWxlXG4gIHZhciBzdHlsZVdpZHRoID0gZ2V0U3R5bGVTaXplKCBzdHlsZS53aWR0aCApO1xuICBpZiAoIHN0eWxlV2lkdGggIT09IGZhbHNlICkge1xuICAgIHNpemUud2lkdGggPSBzdHlsZVdpZHRoICtcbiAgICAgIC8vIGFkZCBwYWRkaW5nIGFuZCBib3JkZXIgdW5sZXNzIGl0J3MgYWxyZWFkeSBpbmNsdWRpbmcgaXRcbiAgICAgICggaXNCb3JkZXJCb3hTaXplT3V0ZXIgPyAwIDogcGFkZGluZ1dpZHRoICsgYm9yZGVyV2lkdGggKTtcbiAgfVxuXG4gIHZhciBzdHlsZUhlaWdodCA9IGdldFN0eWxlU2l6ZSggc3R5bGUuaGVpZ2h0ICk7XG4gIGlmICggc3R5bGVIZWlnaHQgIT09IGZhbHNlICkge1xuICAgIHNpemUuaGVpZ2h0ID0gc3R5bGVIZWlnaHQgK1xuICAgICAgLy8gYWRkIHBhZGRpbmcgYW5kIGJvcmRlciB1bmxlc3MgaXQncyBhbHJlYWR5IGluY2x1ZGluZyBpdFxuICAgICAgKCBpc0JvcmRlckJveFNpemVPdXRlciA/IDAgOiBwYWRkaW5nSGVpZ2h0ICsgYm9yZGVySGVpZ2h0ICk7XG4gIH1cblxuICBzaXplLmlubmVyV2lkdGggPSBzaXplLndpZHRoIC0gKCBwYWRkaW5nV2lkdGggKyBib3JkZXJXaWR0aCApO1xuICBzaXplLmlubmVySGVpZ2h0ID0gc2l6ZS5oZWlnaHQgLSAoIHBhZGRpbmdIZWlnaHQgKyBib3JkZXJIZWlnaHQgKTtcblxuICBzaXplLm91dGVyV2lkdGggPSBzaXplLndpZHRoICsgbWFyZ2luV2lkdGg7XG4gIHNpemUub3V0ZXJIZWlnaHQgPSBzaXplLmhlaWdodCArIG1hcmdpbkhlaWdodDtcblxuICByZXR1cm4gc2l6ZTtcbn1cblxucmV0dXJuIGdldFNpemU7XG5cbn0pO1xuXG4vKipcbiAqIG1hdGNoZXNTZWxlY3RvciB2Mi4wLjFcbiAqIG1hdGNoZXNTZWxlY3RvciggZWxlbWVudCwgJy5zZWxlY3RvcicgKVxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCBzdHJpY3Q6IHRydWUsIHVuZGVmOiB0cnVlLCB1bnVzZWQ6IHRydWUgKi9cblxuKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkge1xuICAvKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCBtb2R1bGU6IGZhbHNlICovXG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCAnbWF0Y2hlcy1zZWxlY3Rvci9tYXRjaGVzLXNlbGVjdG9yJyxmYWN0b3J5ICk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5tYXRjaGVzU2VsZWN0b3IgPSBmYWN0b3J5KCk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1hdGNoZXNNZXRob2QgPSAoIGZ1bmN0aW9uKCkge1xuICAgIHZhciBFbGVtUHJvdG8gPSBFbGVtZW50LnByb3RvdHlwZTtcbiAgICAvLyBjaGVjayBmb3IgdGhlIHN0YW5kYXJkIG1ldGhvZCBuYW1lIGZpcnN0XG4gICAgaWYgKCBFbGVtUHJvdG8ubWF0Y2hlcyApIHtcbiAgICAgIHJldHVybiAnbWF0Y2hlcyc7XG4gICAgfVxuICAgIC8vIGNoZWNrIHVuLXByZWZpeGVkXG4gICAgaWYgKCBFbGVtUHJvdG8ubWF0Y2hlc1NlbGVjdG9yICkge1xuICAgICAgcmV0dXJuICdtYXRjaGVzU2VsZWN0b3InO1xuICAgIH1cbiAgICAvLyBjaGVjayB2ZW5kb3IgcHJlZml4ZXNcbiAgICB2YXIgcHJlZml4ZXMgPSBbICd3ZWJraXQnLCAnbW96JywgJ21zJywgJ28nIF07XG5cbiAgICBmb3IgKCB2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICB2YXIgcHJlZml4ID0gcHJlZml4ZXNbaV07XG4gICAgICB2YXIgbWV0aG9kID0gcHJlZml4ICsgJ01hdGNoZXNTZWxlY3Rvcic7XG4gICAgICBpZiAoIEVsZW1Qcm90b1sgbWV0aG9kIF0gKSB7XG4gICAgICAgIHJldHVybiBtZXRob2Q7XG4gICAgICB9XG4gICAgfVxuICB9KSgpO1xuXG4gIHJldHVybiBmdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IoIGVsZW0sIHNlbGVjdG9yICkge1xuICAgIHJldHVybiBlbGVtWyBtYXRjaGVzTWV0aG9kIF0oIHNlbGVjdG9yICk7XG4gIH07XG5cbn0pKTtcblxuLyoqXG4gKiBGaXp6eSBVSSB1dGlscyB2Mi4wLjBcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSwgc3RyaWN0OiB0cnVlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSwgcmVxdWlyZTogZmFsc2UgKi9cbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggJ2Zpenp5LXVpLXV0aWxzL3V0aWxzJyxbXG4gICAgICAnbWF0Y2hlcy1zZWxlY3Rvci9tYXRjaGVzLXNlbGVjdG9yJ1xuICAgIF0sIGZ1bmN0aW9uKCBtYXRjaGVzU2VsZWN0b3IgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBtYXRjaGVzU2VsZWN0b3IgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2Rlc2FuZHJvLW1hdGNoZXMtc2VsZWN0b3InKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuZml6enlVSVV0aWxzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5tYXRjaGVzU2VsZWN0b3JcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBtYXRjaGVzU2VsZWN0b3IgKSB7XG5cblxuXG52YXIgdXRpbHMgPSB7fTtcblxuLy8gLS0tLS0gZXh0ZW5kIC0tLS0tIC8vXG5cbi8vIGV4dGVuZHMgb2JqZWN0c1xudXRpbHMuZXh0ZW5kID0gZnVuY3Rpb24oIGEsIGIgKSB7XG4gIGZvciAoIHZhciBwcm9wIGluIGIgKSB7XG4gICAgYVsgcHJvcCBdID0gYlsgcHJvcCBdO1xuICB9XG4gIHJldHVybiBhO1xufTtcblxuLy8gLS0tLS0gbW9kdWxvIC0tLS0tIC8vXG5cbnV0aWxzLm1vZHVsbyA9IGZ1bmN0aW9uKCBudW0sIGRpdiApIHtcbiAgcmV0dXJuICggKCBudW0gJSBkaXYgKSArIGRpdiApICUgZGl2O1xufTtcblxuLy8gLS0tLS0gbWFrZUFycmF5IC0tLS0tIC8vXG5cbi8vIHR1cm4gZWxlbWVudCBvciBub2RlTGlzdCBpbnRvIGFuIGFycmF5XG51dGlscy5tYWtlQXJyYXkgPSBmdW5jdGlvbiggb2JqICkge1xuICB2YXIgYXJ5ID0gW107XG4gIGlmICggQXJyYXkuaXNBcnJheSggb2JqICkgKSB7XG4gICAgLy8gdXNlIG9iamVjdCBpZiBhbHJlYWR5IGFuIGFycmF5XG4gICAgYXJ5ID0gb2JqO1xuICB9IGVsc2UgaWYgKCBvYmogJiYgdHlwZW9mIG9iai5sZW5ndGggPT0gJ251bWJlcicgKSB7XG4gICAgLy8gY29udmVydCBub2RlTGlzdCB0byBhcnJheVxuICAgIGZvciAoIHZhciBpPTA7IGkgPCBvYmoubGVuZ3RoOyBpKysgKSB7XG4gICAgICBhcnkucHVzaCggb2JqW2ldICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIGFycmF5IG9mIHNpbmdsZSBpbmRleFxuICAgIGFyeS5wdXNoKCBvYmogKTtcbiAgfVxuICByZXR1cm4gYXJ5O1xufTtcblxuLy8gLS0tLS0gcmVtb3ZlRnJvbSAtLS0tLSAvL1xuXG51dGlscy5yZW1vdmVGcm9tID0gZnVuY3Rpb24oIGFyeSwgb2JqICkge1xuICB2YXIgaW5kZXggPSBhcnkuaW5kZXhPZiggb2JqICk7XG4gIGlmICggaW5kZXggIT0gLTEgKSB7XG4gICAgYXJ5LnNwbGljZSggaW5kZXgsIDEgKTtcbiAgfVxufTtcblxuLy8gLS0tLS0gZ2V0UGFyZW50IC0tLS0tIC8vXG5cbnV0aWxzLmdldFBhcmVudCA9IGZ1bmN0aW9uKCBlbGVtLCBzZWxlY3RvciApIHtcbiAgd2hpbGUgKCBlbGVtICE9IGRvY3VtZW50LmJvZHkgKSB7XG4gICAgZWxlbSA9IGVsZW0ucGFyZW50Tm9kZTtcbiAgICBpZiAoIG1hdGNoZXNTZWxlY3RvciggZWxlbSwgc2VsZWN0b3IgKSApIHtcbiAgICAgIHJldHVybiBlbGVtO1xuICAgIH1cbiAgfVxufTtcblxuLy8gLS0tLS0gZ2V0UXVlcnlFbGVtZW50IC0tLS0tIC8vXG5cbi8vIHVzZSBlbGVtZW50IGFzIHNlbGVjdG9yIHN0cmluZ1xudXRpbHMuZ2V0UXVlcnlFbGVtZW50ID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIGlmICggdHlwZW9mIGVsZW0gPT0gJ3N0cmluZycgKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIGVsZW0gKTtcbiAgfVxuICByZXR1cm4gZWxlbTtcbn07XG5cbi8vIC0tLS0tIGhhbmRsZUV2ZW50IC0tLS0tIC8vXG5cbi8vIGVuYWJsZSAub250eXBlIHRvIHRyaWdnZXIgZnJvbSAuYWRkRXZlbnRMaXN0ZW5lciggZWxlbSwgJ3R5cGUnIClcbnV0aWxzLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICB2YXIgbWV0aG9kID0gJ29uJyArIGV2ZW50LnR5cGU7XG4gIGlmICggdGhpc1sgbWV0aG9kIF0gKSB7XG4gICAgdGhpc1sgbWV0aG9kIF0oIGV2ZW50ICk7XG4gIH1cbn07XG5cbi8vIC0tLS0tIGZpbHRlckZpbmRFbGVtZW50cyAtLS0tLSAvL1xuXG51dGlscy5maWx0ZXJGaW5kRWxlbWVudHMgPSBmdW5jdGlvbiggZWxlbXMsIHNlbGVjdG9yICkge1xuICAvLyBtYWtlIGFycmF5IG9mIGVsZW1zXG4gIGVsZW1zID0gdXRpbHMubWFrZUFycmF5KCBlbGVtcyApO1xuICB2YXIgZmZFbGVtcyA9IFtdO1xuXG4gIGVsZW1zLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtICkge1xuICAgIC8vIGNoZWNrIHRoYXQgZWxlbSBpcyBhbiBhY3R1YWwgZWxlbWVudFxuICAgIGlmICggISggZWxlbSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICkgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGFkZCBlbGVtIGlmIG5vIHNlbGVjdG9yXG4gICAgaWYgKCAhc2VsZWN0b3IgKSB7XG4gICAgICBmZkVsZW1zLnB1c2goIGVsZW0gKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gZmlsdGVyICYgZmluZCBpdGVtcyBpZiB3ZSBoYXZlIGEgc2VsZWN0b3JcbiAgICAvLyBmaWx0ZXJcbiAgICBpZiAoIG1hdGNoZXNTZWxlY3RvciggZWxlbSwgc2VsZWN0b3IgKSApIHtcbiAgICAgIGZmRWxlbXMucHVzaCggZWxlbSApO1xuICAgIH1cbiAgICAvLyBmaW5kIGNoaWxkcmVuXG4gICAgdmFyIGNoaWxkRWxlbXMgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoIHNlbGVjdG9yICk7XG4gICAgLy8gY29uY2F0IGNoaWxkRWxlbXMgdG8gZmlsdGVyRm91bmQgYXJyYXlcbiAgICBmb3IgKCB2YXIgaT0wOyBpIDwgY2hpbGRFbGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICAgIGZmRWxlbXMucHVzaCggY2hpbGRFbGVtc1tpXSApO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGZmRWxlbXM7XG59O1xuXG4vLyAtLS0tLSBkZWJvdW5jZU1ldGhvZCAtLS0tLSAvL1xuXG51dGlscy5kZWJvdW5jZU1ldGhvZCA9IGZ1bmN0aW9uKCBfY2xhc3MsIG1ldGhvZE5hbWUsIHRocmVzaG9sZCApIHtcbiAgLy8gb3JpZ2luYWwgbWV0aG9kXG4gIHZhciBtZXRob2QgPSBfY2xhc3MucHJvdG90eXBlWyBtZXRob2ROYW1lIF07XG4gIHZhciB0aW1lb3V0TmFtZSA9IG1ldGhvZE5hbWUgKyAnVGltZW91dCc7XG5cbiAgX2NsYXNzLnByb3RvdHlwZVsgbWV0aG9kTmFtZSBdID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRpbWVvdXQgPSB0aGlzWyB0aW1lb3V0TmFtZSBdO1xuICAgIGlmICggdGltZW91dCApIHtcbiAgICAgIGNsZWFyVGltZW91dCggdGltZW91dCApO1xuICAgIH1cbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpc1sgdGltZW91dE5hbWUgXSA9IHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgbWV0aG9kLmFwcGx5KCBfdGhpcywgYXJncyApO1xuICAgICAgZGVsZXRlIF90aGlzWyB0aW1lb3V0TmFtZSBdO1xuICAgIH0sIHRocmVzaG9sZCB8fCAxMDAgKTtcbiAgfTtcbn07XG5cbi8vIC0tLS0tIGRvY1JlYWR5IC0tLS0tIC8vXG5cbnV0aWxzLmRvY1JlYWR5ID0gZnVuY3Rpb24oIGNhbGxiYWNrICkge1xuICBpZiAoIGRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJyApIHtcbiAgICBjYWxsYmFjaygpO1xuICB9IGVsc2Uge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdET01Db250ZW50TG9hZGVkJywgY2FsbGJhY2sgKTtcbiAgfVxufTtcblxuLy8gLS0tLS0gaHRtbEluaXQgLS0tLS0gLy9cblxuLy8gaHR0cDovL2phbWVzcm9iZXJ0cy5uYW1lL2Jsb2cvMjAxMC8wMi8yMi9zdHJpbmctZnVuY3Rpb25zLWZvci1qYXZhc2NyaXB0LXRyaW0tdG8tY2FtZWwtY2FzZS10by1kYXNoZWQtYW5kLXRvLXVuZGVyc2NvcmUvXG51dGlscy50b0Rhc2hlZCA9IGZ1bmN0aW9uKCBzdHIgKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSggLyguKShbQS1aXSkvZywgZnVuY3Rpb24oIG1hdGNoLCAkMSwgJDIgKSB7XG4gICAgcmV0dXJuICQxICsgJy0nICsgJDI7XG4gIH0pLnRvTG93ZXJDYXNlKCk7XG59O1xuXG52YXIgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlO1xuLyoqXG4gKiBhbGxvdyB1c2VyIHRvIGluaXRpYWxpemUgY2xhc3NlcyB2aWEgW2RhdGEtbmFtZXNwYWNlXSBvciAuanMtbmFtZXNwYWNlIGNsYXNzXG4gKiBodG1sSW5pdCggV2lkZ2V0LCAnd2lkZ2V0TmFtZScgKVxuICogb3B0aW9ucyBhcmUgcGFyc2VkIGZyb20gZGF0YS1uYW1lc3BhY2Utb3B0aW9uc1xuICovXG51dGlscy5odG1sSW5pdCA9IGZ1bmN0aW9uKCBXaWRnZXRDbGFzcywgbmFtZXNwYWNlICkge1xuICB1dGlscy5kb2NSZWFkeSggZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRhc2hlZE5hbWVzcGFjZSA9IHV0aWxzLnRvRGFzaGVkKCBuYW1lc3BhY2UgKTtcbiAgICB2YXIgZGF0YUF0dHIgPSAnZGF0YS0nICsgZGFzaGVkTmFtZXNwYWNlO1xuICAgIHZhciBkYXRhQXR0ckVsZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggJ1snICsgZGF0YUF0dHIgKyAnXScgKTtcbiAgICB2YXIganNEYXNoRWxlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCAnLmpzLScgKyBkYXNoZWROYW1lc3BhY2UgKTtcbiAgICB2YXIgZWxlbXMgPSB1dGlscy5tYWtlQXJyYXkoIGRhdGFBdHRyRWxlbXMgKVxuICAgICAgLmNvbmNhdCggdXRpbHMubWFrZUFycmF5KCBqc0Rhc2hFbGVtcyApICk7XG4gICAgdmFyIGRhdGFPcHRpb25zQXR0ciA9IGRhdGFBdHRyICsgJy1vcHRpb25zJztcbiAgICB2YXIgalF1ZXJ5ID0gd2luZG93LmpRdWVyeTtcblxuICAgIGVsZW1zLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtICkge1xuICAgICAgdmFyIGF0dHIgPSBlbGVtLmdldEF0dHJpYnV0ZSggZGF0YUF0dHIgKSB8fFxuICAgICAgICBlbGVtLmdldEF0dHJpYnV0ZSggZGF0YU9wdGlvbnNBdHRyICk7XG4gICAgICB2YXIgb3B0aW9ucztcbiAgICAgIHRyeSB7XG4gICAgICAgIG9wdGlvbnMgPSBhdHRyICYmIEpTT04ucGFyc2UoIGF0dHIgKTtcbiAgICAgIH0gY2F0Y2ggKCBlcnJvciApIHtcbiAgICAgICAgLy8gbG9nIGVycm9yLCBkbyBub3QgaW5pdGlhbGl6ZVxuICAgICAgICBpZiAoIGNvbnNvbGUgKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvciggJ0Vycm9yIHBhcnNpbmcgJyArIGRhdGFBdHRyICsgJyBvbiAnICsgZWxlbS5jbGFzc05hbWUgK1xuICAgICAgICAgICc6ICcgKyBlcnJvciApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIGluaXRpYWxpemVcbiAgICAgIHZhciBpbnN0YW5jZSA9IG5ldyBXaWRnZXRDbGFzcyggZWxlbSwgb3B0aW9ucyApO1xuICAgICAgLy8gbWFrZSBhdmFpbGFibGUgdmlhICQoKS5kYXRhKCdsYXlvdXRuYW1lJylcbiAgICAgIGlmICggalF1ZXJ5ICkge1xuICAgICAgICBqUXVlcnkuZGF0YSggZWxlbSwgbmFtZXNwYWNlLCBpbnN0YW5jZSApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIH0pO1xufTtcblxuLy8gLS0tLS0gIC0tLS0tIC8vXG5cbnJldHVybiB1dGlscztcblxufSkpO1xuXG4vKipcbiAqIE91dGxheWVyIEl0ZW1cbiAqL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqLyAvKiBnbG9iYWxzIGRlZmluZSwgbW9kdWxlLCByZXF1aXJlICovXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EIC0gUmVxdWlyZUpTXG4gICAgZGVmaW5lKCAnb3V0bGF5ZXIvaXRlbScsW1xuICAgICAgICAnZXYtZW1pdHRlci9ldi1lbWl0dGVyJyxcbiAgICAgICAgJ2dldC1zaXplL2dldC1zaXplJ1xuICAgICAgXSxcbiAgICAgIGZ1bmN0aW9uKCBFdkVtaXR0ZXIsIGdldFNpemUgKSB7XG4gICAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIEV2RW1pdHRlciwgZ2V0U2l6ZSApO1xuICAgICAgfVxuICAgICk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMgKSB7XG4gICAgLy8gQ29tbW9uSlMgLSBCcm93c2VyaWZ5LCBXZWJwYWNrXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgcmVxdWlyZSgnZXYtZW1pdHRlcicpLFxuICAgICAgcmVxdWlyZSgnZ2V0LXNpemUnKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuT3V0bGF5ZXIgPSB7fTtcbiAgICB3aW5kb3cuT3V0bGF5ZXIuSXRlbSA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICB3aW5kb3cuRXZFbWl0dGVyLFxuICAgICAgd2luZG93LmdldFNpemVcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBFdkVtaXR0ZXIsIGdldFNpemUgKSB7XG4ndXNlIHN0cmljdCc7XG5cbi8vIC0tLS0tIGhlbHBlcnMgLS0tLS0gLy9cblxuZnVuY3Rpb24gaXNFbXB0eU9iaiggb2JqICkge1xuICBmb3IgKCB2YXIgcHJvcCBpbiBvYmogKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHByb3AgPSBudWxsO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ1NTMyBzdXBwb3J0IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cblxudmFyIGRvY0VsZW1TdHlsZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZTtcblxudmFyIHRyYW5zaXRpb25Qcm9wZXJ0eSA9IHR5cGVvZiBkb2NFbGVtU3R5bGUudHJhbnNpdGlvbiA9PSAnc3RyaW5nJyA/XG4gICd0cmFuc2l0aW9uJyA6ICdXZWJraXRUcmFuc2l0aW9uJztcbnZhciB0cmFuc2Zvcm1Qcm9wZXJ0eSA9IHR5cGVvZiBkb2NFbGVtU3R5bGUudHJhbnNmb3JtID09ICdzdHJpbmcnID9cbiAgJ3RyYW5zZm9ybScgOiAnV2Via2l0VHJhbnNmb3JtJztcblxudmFyIHRyYW5zaXRpb25FbmRFdmVudCA9IHtcbiAgV2Via2l0VHJhbnNpdGlvbjogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICB0cmFuc2l0aW9uOiAndHJhbnNpdGlvbmVuZCdcbn1bIHRyYW5zaXRpb25Qcm9wZXJ0eSBdO1xuXG4vLyBjYWNoZSBhbGwgdmVuZG9yIHByb3BlcnRpZXNcbnZhciB2ZW5kb3JQcm9wZXJ0aWVzID0gW1xuICB0cmFuc2Zvcm1Qcm9wZXJ0eSxcbiAgdHJhbnNpdGlvblByb3BlcnR5LFxuICB0cmFuc2l0aW9uUHJvcGVydHkgKyAnRHVyYXRpb24nLFxuICB0cmFuc2l0aW9uUHJvcGVydHkgKyAnUHJvcGVydHknXG5dO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJdGVtIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbmZ1bmN0aW9uIEl0ZW0oIGVsZW1lbnQsIGxheW91dCApIHtcbiAgaWYgKCAhZWxlbWVudCApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAvLyBwYXJlbnQgbGF5b3V0IGNsYXNzLCBpLmUuIE1hc29ucnksIElzb3RvcGUsIG9yIFBhY2tlcnlcbiAgdGhpcy5sYXlvdXQgPSBsYXlvdXQ7XG4gIHRoaXMucG9zaXRpb24gPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH07XG5cbiAgdGhpcy5fY3JlYXRlKCk7XG59XG5cbi8vIGluaGVyaXQgRXZFbWl0dGVyXG52YXIgcHJvdG8gPSBJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEV2RW1pdHRlci5wcm90b3R5cGUgKTtcbnByb3RvLmNvbnN0cnVjdG9yID0gSXRlbTtcblxucHJvdG8uX2NyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyB0cmFuc2l0aW9uIG9iamVjdHNcbiAgdGhpcy5fdHJhbnNuID0ge1xuICAgIGluZ1Byb3BlcnRpZXM6IHt9LFxuICAgIGNsZWFuOiB7fSxcbiAgICBvbkVuZDoge31cbiAgfTtcblxuICB0aGlzLmNzcyh7XG4gICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgfSk7XG59O1xuXG4vLyB0cmlnZ2VyIHNwZWNpZmllZCBoYW5kbGVyIGZvciBldmVudCB0eXBlXG5wcm90by5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdmFyIG1ldGhvZCA9ICdvbicgKyBldmVudC50eXBlO1xuICBpZiAoIHRoaXNbIG1ldGhvZCBdICkge1xuICAgIHRoaXNbIG1ldGhvZCBdKCBldmVudCApO1xuICB9XG59O1xuXG5wcm90by5nZXRTaXplID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc2l6ZSA9IGdldFNpemUoIHRoaXMuZWxlbWVudCApO1xufTtcblxuLyoqXG4gKiBhcHBseSBDU1Mgc3R5bGVzIHRvIGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBzdHlsZVxuICovXG5wcm90by5jc3MgPSBmdW5jdGlvbiggc3R5bGUgKSB7XG4gIHZhciBlbGVtU3R5bGUgPSB0aGlzLmVsZW1lbnQuc3R5bGU7XG5cbiAgZm9yICggdmFyIHByb3AgaW4gc3R5bGUgKSB7XG4gICAgLy8gdXNlIHZlbmRvciBwcm9wZXJ0eSBpZiBhdmFpbGFibGVcbiAgICB2YXIgc3VwcG9ydGVkUHJvcCA9IHZlbmRvclByb3BlcnRpZXNbIHByb3AgXSB8fCBwcm9wO1xuICAgIGVsZW1TdHlsZVsgc3VwcG9ydGVkUHJvcCBdID0gc3R5bGVbIHByb3AgXTtcbiAgfVxufTtcblxuIC8vIG1lYXN1cmUgcG9zaXRpb24sIGFuZCBzZXRzIGl0XG5wcm90by5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKCB0aGlzLmVsZW1lbnQgKTtcbiAgdmFyIGlzT3JpZ2luTGVmdCA9IHRoaXMubGF5b3V0Ll9nZXRPcHRpb24oJ29yaWdpbkxlZnQnKTtcbiAgdmFyIGlzT3JpZ2luVG9wID0gdGhpcy5sYXlvdXQuX2dldE9wdGlvbignb3JpZ2luVG9wJyk7XG4gIHZhciB4VmFsdWUgPSBzdHlsZVsgaXNPcmlnaW5MZWZ0ID8gJ2xlZnQnIDogJ3JpZ2h0JyBdO1xuICB2YXIgeVZhbHVlID0gc3R5bGVbIGlzT3JpZ2luVG9wID8gJ3RvcCcgOiAnYm90dG9tJyBdO1xuICAvLyBjb252ZXJ0IHBlcmNlbnQgdG8gcGl4ZWxzXG4gIHZhciBsYXlvdXRTaXplID0gdGhpcy5sYXlvdXQuc2l6ZTtcbiAgdmFyIHggPSB4VmFsdWUuaW5kZXhPZignJScpICE9IC0xID9cbiAgICAoIHBhcnNlRmxvYXQoIHhWYWx1ZSApIC8gMTAwICkgKiBsYXlvdXRTaXplLndpZHRoIDogcGFyc2VJbnQoIHhWYWx1ZSwgMTAgKTtcbiAgdmFyIHkgPSB5VmFsdWUuaW5kZXhPZignJScpICE9IC0xID9cbiAgICAoIHBhcnNlRmxvYXQoIHlWYWx1ZSApIC8gMTAwICkgKiBsYXlvdXRTaXplLmhlaWdodCA6IHBhcnNlSW50KCB5VmFsdWUsIDEwICk7XG5cbiAgLy8gY2xlYW4gdXAgJ2F1dG8nIG9yIG90aGVyIG5vbi1pbnRlZ2VyIHZhbHVlc1xuICB4ID0gaXNOYU4oIHggKSA/IDAgOiB4O1xuICB5ID0gaXNOYU4oIHkgKSA/IDAgOiB5O1xuICAvLyByZW1vdmUgcGFkZGluZyBmcm9tIG1lYXN1cmVtZW50XG4gIHggLT0gaXNPcmlnaW5MZWZ0ID8gbGF5b3V0U2l6ZS5wYWRkaW5nTGVmdCA6IGxheW91dFNpemUucGFkZGluZ1JpZ2h0O1xuICB5IC09IGlzT3JpZ2luVG9wID8gbGF5b3V0U2l6ZS5wYWRkaW5nVG9wIDogbGF5b3V0U2l6ZS5wYWRkaW5nQm90dG9tO1xuXG4gIHRoaXMucG9zaXRpb24ueCA9IHg7XG4gIHRoaXMucG9zaXRpb24ueSA9IHk7XG59O1xuXG4vLyBzZXQgc2V0dGxlZCBwb3NpdGlvbiwgYXBwbHkgcGFkZGluZ1xucHJvdG8ubGF5b3V0UG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGxheW91dFNpemUgPSB0aGlzLmxheW91dC5zaXplO1xuICB2YXIgc3R5bGUgPSB7fTtcbiAgdmFyIGlzT3JpZ2luTGVmdCA9IHRoaXMubGF5b3V0Ll9nZXRPcHRpb24oJ29yaWdpbkxlZnQnKTtcbiAgdmFyIGlzT3JpZ2luVG9wID0gdGhpcy5sYXlvdXQuX2dldE9wdGlvbignb3JpZ2luVG9wJyk7XG5cbiAgLy8geFxuICB2YXIgeFBhZGRpbmcgPSBpc09yaWdpbkxlZnQgPyAncGFkZGluZ0xlZnQnIDogJ3BhZGRpbmdSaWdodCc7XG4gIHZhciB4UHJvcGVydHkgPSBpc09yaWdpbkxlZnQgPyAnbGVmdCcgOiAncmlnaHQnO1xuICB2YXIgeFJlc2V0UHJvcGVydHkgPSBpc09yaWdpbkxlZnQgPyAncmlnaHQnIDogJ2xlZnQnO1xuXG4gIHZhciB4ID0gdGhpcy5wb3NpdGlvbi54ICsgbGF5b3V0U2l6ZVsgeFBhZGRpbmcgXTtcbiAgLy8gc2V0IGluIHBlcmNlbnRhZ2Ugb3IgcGl4ZWxzXG4gIHN0eWxlWyB4UHJvcGVydHkgXSA9IHRoaXMuZ2V0WFZhbHVlKCB4ICk7XG4gIC8vIHJlc2V0IG90aGVyIHByb3BlcnR5XG4gIHN0eWxlWyB4UmVzZXRQcm9wZXJ0eSBdID0gJyc7XG5cbiAgLy8geVxuICB2YXIgeVBhZGRpbmcgPSBpc09yaWdpblRvcCA/ICdwYWRkaW5nVG9wJyA6ICdwYWRkaW5nQm90dG9tJztcbiAgdmFyIHlQcm9wZXJ0eSA9IGlzT3JpZ2luVG9wID8gJ3RvcCcgOiAnYm90dG9tJztcbiAgdmFyIHlSZXNldFByb3BlcnR5ID0gaXNPcmlnaW5Ub3AgPyAnYm90dG9tJyA6ICd0b3AnO1xuXG4gIHZhciB5ID0gdGhpcy5wb3NpdGlvbi55ICsgbGF5b3V0U2l6ZVsgeVBhZGRpbmcgXTtcbiAgLy8gc2V0IGluIHBlcmNlbnRhZ2Ugb3IgcGl4ZWxzXG4gIHN0eWxlWyB5UHJvcGVydHkgXSA9IHRoaXMuZ2V0WVZhbHVlKCB5ICk7XG4gIC8vIHJlc2V0IG90aGVyIHByb3BlcnR5XG4gIHN0eWxlWyB5UmVzZXRQcm9wZXJ0eSBdID0gJyc7XG5cbiAgdGhpcy5jc3MoIHN0eWxlICk7XG4gIHRoaXMuZW1pdEV2ZW50KCAnbGF5b3V0JywgWyB0aGlzIF0gKTtcbn07XG5cbnByb3RvLmdldFhWYWx1ZSA9IGZ1bmN0aW9uKCB4ICkge1xuICB2YXIgaXNIb3Jpem9udGFsID0gdGhpcy5sYXlvdXQuX2dldE9wdGlvbignaG9yaXpvbnRhbCcpO1xuICByZXR1cm4gdGhpcy5sYXlvdXQub3B0aW9ucy5wZXJjZW50UG9zaXRpb24gJiYgIWlzSG9yaXpvbnRhbCA/XG4gICAgKCAoIHggLyB0aGlzLmxheW91dC5zaXplLndpZHRoICkgKiAxMDAgKSArICclJyA6IHggKyAncHgnO1xufTtcblxucHJvdG8uZ2V0WVZhbHVlID0gZnVuY3Rpb24oIHkgKSB7XG4gIHZhciBpc0hvcml6b250YWwgPSB0aGlzLmxheW91dC5fZ2V0T3B0aW9uKCdob3Jpem9udGFsJyk7XG4gIHJldHVybiB0aGlzLmxheW91dC5vcHRpb25zLnBlcmNlbnRQb3NpdGlvbiAmJiBpc0hvcml6b250YWwgP1xuICAgICggKCB5IC8gdGhpcy5sYXlvdXQuc2l6ZS5oZWlnaHQgKSAqIDEwMCApICsgJyUnIDogeSArICdweCc7XG59O1xuXG5wcm90by5fdHJhbnNpdGlvblRvID0gZnVuY3Rpb24oIHgsIHkgKSB7XG4gIHRoaXMuZ2V0UG9zaXRpb24oKTtcbiAgLy8gZ2V0IGN1cnJlbnQgeCAmIHkgZnJvbSB0b3AvbGVmdFxuICB2YXIgY3VyWCA9IHRoaXMucG9zaXRpb24ueDtcbiAgdmFyIGN1clkgPSB0aGlzLnBvc2l0aW9uLnk7XG5cbiAgdmFyIGNvbXBhcmVYID0gcGFyc2VJbnQoIHgsIDEwICk7XG4gIHZhciBjb21wYXJlWSA9IHBhcnNlSW50KCB5LCAxMCApO1xuICB2YXIgZGlkTm90TW92ZSA9IGNvbXBhcmVYID09PSB0aGlzLnBvc2l0aW9uLnggJiYgY29tcGFyZVkgPT09IHRoaXMucG9zaXRpb24ueTtcblxuICAvLyBzYXZlIGVuZCBwb3NpdGlvblxuICB0aGlzLnNldFBvc2l0aW9uKCB4LCB5ICk7XG5cbiAgLy8gaWYgZGlkIG5vdCBtb3ZlIGFuZCBub3QgdHJhbnNpdGlvbmluZywganVzdCBnbyB0byBsYXlvdXRcbiAgaWYgKCBkaWROb3RNb3ZlICYmICF0aGlzLmlzVHJhbnNpdGlvbmluZyApIHtcbiAgICB0aGlzLmxheW91dFBvc2l0aW9uKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHRyYW5zWCA9IHggLSBjdXJYO1xuICB2YXIgdHJhbnNZID0geSAtIGN1clk7XG4gIHZhciB0cmFuc2l0aW9uU3R5bGUgPSB7fTtcbiAgdHJhbnNpdGlvblN0eWxlLnRyYW5zZm9ybSA9IHRoaXMuZ2V0VHJhbnNsYXRlKCB0cmFuc1gsIHRyYW5zWSApO1xuXG4gIHRoaXMudHJhbnNpdGlvbih7XG4gICAgdG86IHRyYW5zaXRpb25TdHlsZSxcbiAgICBvblRyYW5zaXRpb25FbmQ6IHtcbiAgICAgIHRyYW5zZm9ybTogdGhpcy5sYXlvdXRQb3NpdGlvblxuICAgIH0sXG4gICAgaXNDbGVhbmluZzogdHJ1ZVxuICB9KTtcbn07XG5cbnByb3RvLmdldFRyYW5zbGF0ZSA9IGZ1bmN0aW9uKCB4LCB5ICkge1xuICAvLyBmbGlwIGNvb3JpZGluYXRlcyBpZiBvcmlnaW4gb24gcmlnaHQgb3IgYm90dG9tXG4gIHZhciBpc09yaWdpbkxlZnQgPSB0aGlzLmxheW91dC5fZ2V0T3B0aW9uKCdvcmlnaW5MZWZ0Jyk7XG4gIHZhciBpc09yaWdpblRvcCA9IHRoaXMubGF5b3V0Ll9nZXRPcHRpb24oJ29yaWdpblRvcCcpO1xuICB4ID0gaXNPcmlnaW5MZWZ0ID8geCA6IC14O1xuICB5ID0gaXNPcmlnaW5Ub3AgPyB5IDogLXk7XG4gIHJldHVybiAndHJhbnNsYXRlM2QoJyArIHggKyAncHgsICcgKyB5ICsgJ3B4LCAwKSc7XG59O1xuXG4vLyBub24gdHJhbnNpdGlvbiArIHRyYW5zZm9ybSBzdXBwb3J0XG5wcm90by5nb1RvID0gZnVuY3Rpb24oIHgsIHkgKSB7XG4gIHRoaXMuc2V0UG9zaXRpb24oIHgsIHkgKTtcbiAgdGhpcy5sYXlvdXRQb3NpdGlvbigpO1xufTtcblxucHJvdG8ubW92ZVRvID0gcHJvdG8uX3RyYW5zaXRpb25UbztcblxucHJvdG8uc2V0UG9zaXRpb24gPSBmdW5jdGlvbiggeCwgeSApIHtcbiAgdGhpcy5wb3NpdGlvbi54ID0gcGFyc2VJbnQoIHgsIDEwICk7XG4gIHRoaXMucG9zaXRpb24ueSA9IHBhcnNlSW50KCB5LCAxMCApO1xufTtcblxuLy8gLS0tLS0gdHJhbnNpdGlvbiAtLS0tLSAvL1xuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0fSBzdHlsZSAtIENTU1xuICogQHBhcmFtIHtGdW5jdGlvbn0gb25UcmFuc2l0aW9uRW5kXG4gKi9cblxuLy8gbm9uIHRyYW5zaXRpb24sIGp1c3QgdHJpZ2dlciBjYWxsYmFja1xucHJvdG8uX25vblRyYW5zaXRpb24gPSBmdW5jdGlvbiggYXJncyApIHtcbiAgdGhpcy5jc3MoIGFyZ3MudG8gKTtcbiAgaWYgKCBhcmdzLmlzQ2xlYW5pbmcgKSB7XG4gICAgdGhpcy5fcmVtb3ZlU3R5bGVzKCBhcmdzLnRvICk7XG4gIH1cbiAgZm9yICggdmFyIHByb3AgaW4gYXJncy5vblRyYW5zaXRpb25FbmQgKSB7XG4gICAgYXJncy5vblRyYW5zaXRpb25FbmRbIHByb3AgXS5jYWxsKCB0aGlzICk7XG4gIH1cbn07XG5cbi8qKlxuICogcHJvcGVyIHRyYW5zaXRpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBhcmdzIC0gYXJndW1lbnRzXG4gKiAgIEBwYXJhbSB7T2JqZWN0fSB0byAtIHN0eWxlIHRvIHRyYW5zaXRpb24gdG9cbiAqICAgQHBhcmFtIHtPYmplY3R9IGZyb20gLSBzdHlsZSB0byBzdGFydCB0cmFuc2l0aW9uIGZyb21cbiAqICAgQHBhcmFtIHtCb29sZWFufSBpc0NsZWFuaW5nIC0gcmVtb3ZlcyB0cmFuc2l0aW9uIHN0eWxlcyBhZnRlciB0cmFuc2l0aW9uXG4gKiAgIEBwYXJhbSB7RnVuY3Rpb259IG9uVHJhbnNpdGlvbkVuZCAtIGNhbGxiYWNrXG4gKi9cbnByb3RvLl90cmFuc2l0aW9uID0gZnVuY3Rpb24oIGFyZ3MgKSB7XG4gIC8vIHJlZGlyZWN0IHRvIG5vblRyYW5zaXRpb24gaWYgbm8gdHJhbnNpdGlvbiBkdXJhdGlvblxuICBpZiAoICFwYXJzZUZsb2F0KCB0aGlzLmxheW91dC5vcHRpb25zLnRyYW5zaXRpb25EdXJhdGlvbiApICkge1xuICAgIHRoaXMuX25vblRyYW5zaXRpb24oIGFyZ3MgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgX3RyYW5zaXRpb24gPSB0aGlzLl90cmFuc247XG4gIC8vIGtlZXAgdHJhY2sgb2Ygb25UcmFuc2l0aW9uRW5kIGNhbGxiYWNrIGJ5IGNzcyBwcm9wZXJ0eVxuICBmb3IgKCB2YXIgcHJvcCBpbiBhcmdzLm9uVHJhbnNpdGlvbkVuZCApIHtcbiAgICBfdHJhbnNpdGlvbi5vbkVuZFsgcHJvcCBdID0gYXJncy5vblRyYW5zaXRpb25FbmRbIHByb3AgXTtcbiAgfVxuICAvLyBrZWVwIHRyYWNrIG9mIHByb3BlcnRpZXMgdGhhdCBhcmUgdHJhbnNpdGlvbmluZ1xuICBmb3IgKCBwcm9wIGluIGFyZ3MudG8gKSB7XG4gICAgX3RyYW5zaXRpb24uaW5nUHJvcGVydGllc1sgcHJvcCBdID0gdHJ1ZTtcbiAgICAvLyBrZWVwIHRyYWNrIG9mIHByb3BlcnRpZXMgdG8gY2xlYW4gdXAgd2hlbiB0cmFuc2l0aW9uIGlzIGRvbmVcbiAgICBpZiAoIGFyZ3MuaXNDbGVhbmluZyApIHtcbiAgICAgIF90cmFuc2l0aW9uLmNsZWFuWyBwcm9wIF0gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIHNldCBmcm9tIHN0eWxlc1xuICBpZiAoIGFyZ3MuZnJvbSApIHtcbiAgICB0aGlzLmNzcyggYXJncy5mcm9tICk7XG4gICAgLy8gZm9yY2UgcmVkcmF3LiBodHRwOi8vYmxvZy5hbGV4bWFjY2F3LmNvbS9jc3MtdHJhbnNpdGlvbnNcbiAgICB2YXIgaCA9IHRoaXMuZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgLy8gaGFjayBmb3IgSlNIaW50IHRvIGh1c2ggYWJvdXQgdW51c2VkIHZhclxuICAgIGggPSBudWxsO1xuICB9XG4gIC8vIGVuYWJsZSB0cmFuc2l0aW9uXG4gIHRoaXMuZW5hYmxlVHJhbnNpdGlvbiggYXJncy50byApO1xuICAvLyBzZXQgc3R5bGVzIHRoYXQgYXJlIHRyYW5zaXRpb25pbmdcbiAgdGhpcy5jc3MoIGFyZ3MudG8gKTtcblxuICB0aGlzLmlzVHJhbnNpdGlvbmluZyA9IHRydWU7XG5cbn07XG5cbi8vIGRhc2ggYmVmb3JlIGFsbCBjYXAgbGV0dGVycywgaW5jbHVkaW5nIGZpcnN0IGZvclxuLy8gV2Via2l0VHJhbnNmb3JtID0+IC13ZWJraXQtdHJhbnNmb3JtXG5mdW5jdGlvbiB0b0Rhc2hlZEFsbCggc3RyICkge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoIC8oW0EtWl0pL2csIGZ1bmN0aW9uKCAkMSApIHtcbiAgICByZXR1cm4gJy0nICsgJDEudG9Mb3dlckNhc2UoKTtcbiAgfSk7XG59XG5cbnZhciB0cmFuc2l0aW9uUHJvcHMgPSAnb3BhY2l0eSwnICtcbiAgdG9EYXNoZWRBbGwoIHZlbmRvclByb3BlcnRpZXMudHJhbnNmb3JtIHx8ICd0cmFuc2Zvcm0nICk7XG5cbnByb3RvLmVuYWJsZVRyYW5zaXRpb24gPSBmdW5jdGlvbigvKiBzdHlsZSAqLykge1xuICAvLyBIQUNLIGNoYW5naW5nIHRyYW5zaXRpb25Qcm9wZXJ0eSBkdXJpbmcgYSB0cmFuc2l0aW9uXG4gIC8vIHdpbGwgY2F1c2UgdHJhbnNpdGlvbiB0byBqdW1wXG4gIGlmICggdGhpcy5pc1RyYW5zaXRpb25pbmcgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gbWFrZSBgdHJhbnNpdGlvbjogZm9vLCBiYXIsIGJhemAgZnJvbSBzdHlsZSBvYmplY3RcbiAgLy8gSEFDSyB1bi1jb21tZW50IHRoaXMgd2hlbiBlbmFibGVUcmFuc2l0aW9uIGNhbiB3b3JrXG4gIC8vIHdoaWxlIGEgdHJhbnNpdGlvbiBpcyBoYXBwZW5pbmdcbiAgLy8gdmFyIHRyYW5zaXRpb25WYWx1ZXMgPSBbXTtcbiAgLy8gZm9yICggdmFyIHByb3AgaW4gc3R5bGUgKSB7XG4gIC8vICAgLy8gZGFzaC1pZnkgY2FtZWxDYXNlZCBwcm9wZXJ0aWVzIGxpa2UgV2Via2l0VHJhbnNpdGlvblxuICAvLyAgIHByb3AgPSB2ZW5kb3JQcm9wZXJ0aWVzWyBwcm9wIF0gfHwgcHJvcDtcbiAgLy8gICB0cmFuc2l0aW9uVmFsdWVzLnB1c2goIHRvRGFzaGVkQWxsKCBwcm9wICkgKTtcbiAgLy8gfVxuICAvLyBlbmFibGUgdHJhbnNpdGlvbiBzdHlsZXNcbiAgdGhpcy5jc3Moe1xuICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogdHJhbnNpdGlvblByb3BzLFxuICAgIHRyYW5zaXRpb25EdXJhdGlvbjogdGhpcy5sYXlvdXQub3B0aW9ucy50cmFuc2l0aW9uRHVyYXRpb25cbiAgfSk7XG4gIC8vIGxpc3RlbiBmb3IgdHJhbnNpdGlvbiBlbmQgZXZlbnRcbiAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoIHRyYW5zaXRpb25FbmRFdmVudCwgdGhpcywgZmFsc2UgKTtcbn07XG5cbnByb3RvLnRyYW5zaXRpb24gPSBJdGVtLnByb3RvdHlwZVsgdHJhbnNpdGlvblByb3BlcnR5ID8gJ190cmFuc2l0aW9uJyA6ICdfbm9uVHJhbnNpdGlvbicgXTtcblxuLy8gLS0tLS0gZXZlbnRzIC0tLS0tIC8vXG5cbnByb3RvLm9ud2Via2l0VHJhbnNpdGlvbkVuZCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgdGhpcy5vbnRyYW5zaXRpb25lbmQoIGV2ZW50ICk7XG59O1xuXG5wcm90by5vbm90cmFuc2l0aW9uZW5kID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICB0aGlzLm9udHJhbnNpdGlvbmVuZCggZXZlbnQgKTtcbn07XG5cbi8vIHByb3BlcnRpZXMgdGhhdCBJIG11bmdlIHRvIG1ha2UgbXkgbGlmZSBlYXNpZXJcbnZhciBkYXNoZWRWZW5kb3JQcm9wZXJ0aWVzID0ge1xuICAnLXdlYmtpdC10cmFuc2Zvcm0nOiAndHJhbnNmb3JtJ1xufTtcblxucHJvdG8ub250cmFuc2l0aW9uZW5kID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICAvLyBkaXNyZWdhcmQgYnViYmxlZCBldmVudHMgZnJvbSBjaGlsZHJlblxuICBpZiAoIGV2ZW50LnRhcmdldCAhPT0gdGhpcy5lbGVtZW50ICkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgX3RyYW5zaXRpb24gPSB0aGlzLl90cmFuc247XG4gIC8vIGdldCBwcm9wZXJ0eSBuYW1lIG9mIHRyYW5zaXRpb25lZCBwcm9wZXJ0eSwgY29udmVydCB0byBwcmVmaXgtZnJlZVxuICB2YXIgcHJvcGVydHlOYW1lID0gZGFzaGVkVmVuZG9yUHJvcGVydGllc1sgZXZlbnQucHJvcGVydHlOYW1lIF0gfHwgZXZlbnQucHJvcGVydHlOYW1lO1xuXG4gIC8vIHJlbW92ZSBwcm9wZXJ0eSB0aGF0IGhhcyBjb21wbGV0ZWQgdHJhbnNpdGlvbmluZ1xuICBkZWxldGUgX3RyYW5zaXRpb24uaW5nUHJvcGVydGllc1sgcHJvcGVydHlOYW1lIF07XG4gIC8vIGNoZWNrIGlmIGFueSBwcm9wZXJ0aWVzIGFyZSBzdGlsbCB0cmFuc2l0aW9uaW5nXG4gIGlmICggaXNFbXB0eU9iaiggX3RyYW5zaXRpb24uaW5nUHJvcGVydGllcyApICkge1xuICAgIC8vIGFsbCBwcm9wZXJ0aWVzIGhhdmUgY29tcGxldGVkIHRyYW5zaXRpb25pbmdcbiAgICB0aGlzLmRpc2FibGVUcmFuc2l0aW9uKCk7XG4gIH1cbiAgLy8gY2xlYW4gc3R5bGVcbiAgaWYgKCBwcm9wZXJ0eU5hbWUgaW4gX3RyYW5zaXRpb24uY2xlYW4gKSB7XG4gICAgLy8gY2xlYW4gdXAgc3R5bGVcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGVbIGV2ZW50LnByb3BlcnR5TmFtZSBdID0gJyc7XG4gICAgZGVsZXRlIF90cmFuc2l0aW9uLmNsZWFuWyBwcm9wZXJ0eU5hbWUgXTtcbiAgfVxuICAvLyB0cmlnZ2VyIG9uVHJhbnNpdGlvbkVuZCBjYWxsYmFja1xuICBpZiAoIHByb3BlcnR5TmFtZSBpbiBfdHJhbnNpdGlvbi5vbkVuZCApIHtcbiAgICB2YXIgb25UcmFuc2l0aW9uRW5kID0gX3RyYW5zaXRpb24ub25FbmRbIHByb3BlcnR5TmFtZSBdO1xuICAgIG9uVHJhbnNpdGlvbkVuZC5jYWxsKCB0aGlzICk7XG4gICAgZGVsZXRlIF90cmFuc2l0aW9uLm9uRW5kWyBwcm9wZXJ0eU5hbWUgXTtcbiAgfVxuXG4gIHRoaXMuZW1pdEV2ZW50KCAndHJhbnNpdGlvbkVuZCcsIFsgdGhpcyBdICk7XG59O1xuXG5wcm90by5kaXNhYmxlVHJhbnNpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnJlbW92ZVRyYW5zaXRpb25TdHlsZXMoKTtcbiAgdGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoIHRyYW5zaXRpb25FbmRFdmVudCwgdGhpcywgZmFsc2UgKTtcbiAgdGhpcy5pc1RyYW5zaXRpb25pbmcgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogcmVtb3ZlcyBzdHlsZSBwcm9wZXJ0eSBmcm9tIGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBzdHlsZVxuKiovXG5wcm90by5fcmVtb3ZlU3R5bGVzID0gZnVuY3Rpb24oIHN0eWxlICkge1xuICAvLyBjbGVhbiB1cCB0cmFuc2l0aW9uIHN0eWxlc1xuICB2YXIgY2xlYW5TdHlsZSA9IHt9O1xuICBmb3IgKCB2YXIgcHJvcCBpbiBzdHlsZSApIHtcbiAgICBjbGVhblN0eWxlWyBwcm9wIF0gPSAnJztcbiAgfVxuICB0aGlzLmNzcyggY2xlYW5TdHlsZSApO1xufTtcblxudmFyIGNsZWFuVHJhbnNpdGlvblN0eWxlID0ge1xuICB0cmFuc2l0aW9uUHJvcGVydHk6ICcnLFxuICB0cmFuc2l0aW9uRHVyYXRpb246ICcnXG59O1xuXG5wcm90by5yZW1vdmVUcmFuc2l0aW9uU3R5bGVzID0gZnVuY3Rpb24oKSB7XG4gIC8vIHJlbW92ZSB0cmFuc2l0aW9uXG4gIHRoaXMuY3NzKCBjbGVhblRyYW5zaXRpb25TdHlsZSApO1xufTtcblxuLy8gLS0tLS0gc2hvdy9oaWRlL3JlbW92ZSAtLS0tLSAvL1xuXG4vLyByZW1vdmUgZWxlbWVudCBmcm9tIERPTVxucHJvdG8ucmVtb3ZlRWxlbSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCggdGhpcy5lbGVtZW50ICk7XG4gIC8vIHJlbW92ZSBkaXNwbGF5OiBub25lXG4gIHRoaXMuY3NzKHsgZGlzcGxheTogJycgfSk7XG4gIHRoaXMuZW1pdEV2ZW50KCAncmVtb3ZlJywgWyB0aGlzIF0gKTtcbn07XG5cbnByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBqdXN0IHJlbW92ZSBlbGVtZW50IGlmIG5vIHRyYW5zaXRpb24gc3VwcG9ydCBvciBubyB0cmFuc2l0aW9uXG4gIGlmICggIXRyYW5zaXRpb25Qcm9wZXJ0eSB8fCAhcGFyc2VGbG9hdCggdGhpcy5sYXlvdXQub3B0aW9ucy50cmFuc2l0aW9uRHVyYXRpb24gKSApIHtcbiAgICB0aGlzLnJlbW92ZUVsZW0oKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBzdGFydCB0cmFuc2l0aW9uXG4gIHRoaXMub25jZSggJ3RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJlbW92ZUVsZW0oKTtcbiAgfSk7XG4gIHRoaXMuaGlkZSgpO1xufTtcblxucHJvdG8ucmV2ZWFsID0gZnVuY3Rpb24oKSB7XG4gIGRlbGV0ZSB0aGlzLmlzSGlkZGVuO1xuICAvLyByZW1vdmUgZGlzcGxheTogbm9uZVxuICB0aGlzLmNzcyh7IGRpc3BsYXk6ICcnIH0pO1xuXG4gIHZhciBvcHRpb25zID0gdGhpcy5sYXlvdXQub3B0aW9ucztcblxuICB2YXIgb25UcmFuc2l0aW9uRW5kID0ge307XG4gIHZhciB0cmFuc2l0aW9uRW5kUHJvcGVydHkgPSB0aGlzLmdldEhpZGVSZXZlYWxUcmFuc2l0aW9uRW5kUHJvcGVydHkoJ3Zpc2libGVTdHlsZScpO1xuICBvblRyYW5zaXRpb25FbmRbIHRyYW5zaXRpb25FbmRQcm9wZXJ0eSBdID0gdGhpcy5vblJldmVhbFRyYW5zaXRpb25FbmQ7XG5cbiAgdGhpcy50cmFuc2l0aW9uKHtcbiAgICBmcm9tOiBvcHRpb25zLmhpZGRlblN0eWxlLFxuICAgIHRvOiBvcHRpb25zLnZpc2libGVTdHlsZSxcbiAgICBpc0NsZWFuaW5nOiB0cnVlLFxuICAgIG9uVHJhbnNpdGlvbkVuZDogb25UcmFuc2l0aW9uRW5kXG4gIH0pO1xufTtcblxucHJvdG8ub25SZXZlYWxUcmFuc2l0aW9uRW5kID0gZnVuY3Rpb24oKSB7XG4gIC8vIGNoZWNrIGlmIHN0aWxsIHZpc2libGVcbiAgLy8gZHVyaW5nIHRyYW5zaXRpb24sIGl0ZW0gbWF5IGhhdmUgYmVlbiBoaWRkZW5cbiAgaWYgKCAhdGhpcy5pc0hpZGRlbiApIHtcbiAgICB0aGlzLmVtaXRFdmVudCgncmV2ZWFsJyk7XG4gIH1cbn07XG5cbi8qKlxuICogZ2V0IHN0eWxlIHByb3BlcnR5IHVzZSBmb3IgaGlkZS9yZXZlYWwgdHJhbnNpdGlvbiBlbmRcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHlsZVByb3BlcnR5IC0gaGlkZGVuU3R5bGUvdmlzaWJsZVN0eWxlXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5wcm90by5nZXRIaWRlUmV2ZWFsVHJhbnNpdGlvbkVuZFByb3BlcnR5ID0gZnVuY3Rpb24oIHN0eWxlUHJvcGVydHkgKSB7XG4gIHZhciBvcHRpb25TdHlsZSA9IHRoaXMubGF5b3V0Lm9wdGlvbnNbIHN0eWxlUHJvcGVydHkgXTtcbiAgLy8gdXNlIG9wYWNpdHlcbiAgaWYgKCBvcHRpb25TdHlsZS5vcGFjaXR5ICkge1xuICAgIHJldHVybiAnb3BhY2l0eSc7XG4gIH1cbiAgLy8gZ2V0IGZpcnN0IHByb3BlcnR5XG4gIGZvciAoIHZhciBwcm9wIGluIG9wdGlvblN0eWxlICkge1xuICAgIHJldHVybiBwcm9wO1xuICB9XG59O1xuXG5wcm90by5oaWRlID0gZnVuY3Rpb24oKSB7XG4gIC8vIHNldCBmbGFnXG4gIHRoaXMuaXNIaWRkZW4gPSB0cnVlO1xuICAvLyByZW1vdmUgZGlzcGxheTogbm9uZVxuICB0aGlzLmNzcyh7IGRpc3BsYXk6ICcnIH0pO1xuXG4gIHZhciBvcHRpb25zID0gdGhpcy5sYXlvdXQub3B0aW9ucztcblxuICB2YXIgb25UcmFuc2l0aW9uRW5kID0ge307XG4gIHZhciB0cmFuc2l0aW9uRW5kUHJvcGVydHkgPSB0aGlzLmdldEhpZGVSZXZlYWxUcmFuc2l0aW9uRW5kUHJvcGVydHkoJ2hpZGRlblN0eWxlJyk7XG4gIG9uVHJhbnNpdGlvbkVuZFsgdHJhbnNpdGlvbkVuZFByb3BlcnR5IF0gPSB0aGlzLm9uSGlkZVRyYW5zaXRpb25FbmQ7XG5cbiAgdGhpcy50cmFuc2l0aW9uKHtcbiAgICBmcm9tOiBvcHRpb25zLnZpc2libGVTdHlsZSxcbiAgICB0bzogb3B0aW9ucy5oaWRkZW5TdHlsZSxcbiAgICAvLyBrZWVwIGhpZGRlbiBzdHVmZiBoaWRkZW5cbiAgICBpc0NsZWFuaW5nOiB0cnVlLFxuICAgIG9uVHJhbnNpdGlvbkVuZDogb25UcmFuc2l0aW9uRW5kXG4gIH0pO1xufTtcblxucHJvdG8ub25IaWRlVHJhbnNpdGlvbkVuZCA9IGZ1bmN0aW9uKCkge1xuICAvLyBjaGVjayBpZiBzdGlsbCBoaWRkZW5cbiAgLy8gZHVyaW5nIHRyYW5zaXRpb24sIGl0ZW0gbWF5IGhhdmUgYmVlbiB1bi1oaWRkZW5cbiAgaWYgKCB0aGlzLmlzSGlkZGVuICkge1xuICAgIHRoaXMuY3NzKHsgZGlzcGxheTogJ25vbmUnIH0pO1xuICAgIHRoaXMuZW1pdEV2ZW50KCdoaWRlJyk7XG4gIH1cbn07XG5cbnByb3RvLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jc3Moe1xuICAgIHBvc2l0aW9uOiAnJyxcbiAgICBsZWZ0OiAnJyxcbiAgICByaWdodDogJycsXG4gICAgdG9wOiAnJyxcbiAgICBib3R0b206ICcnLFxuICAgIHRyYW5zaXRpb246ICcnLFxuICAgIHRyYW5zZm9ybTogJydcbiAgfSk7XG59O1xuXG5yZXR1cm4gSXRlbTtcblxufSkpO1xuXG4vKiFcbiAqIE91dGxheWVyIHYyLjAuMFxuICogdGhlIGJyYWlucyBhbmQgZ3V0cyBvZiBhIGxheW91dCBsaWJyYXJ5XG4gKiBNSVQgbGljZW5zZVxuICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cbiAgLyoganNoaW50IHN0cmljdDogZmFsc2UgKi8gLyogZ2xvYmFscyBkZWZpbmUsIG1vZHVsZSwgcmVxdWlyZSAqL1xuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRCAtIFJlcXVpcmVKU1xuICAgIGRlZmluZSggJ291dGxheWVyL291dGxheWVyJyxbXG4gICAgICAgICdldi1lbWl0dGVyL2V2LWVtaXR0ZXInLFxuICAgICAgICAnZ2V0LXNpemUvZ2V0LXNpemUnLFxuICAgICAgICAnZml6enktdWktdXRpbHMvdXRpbHMnLFxuICAgICAgICAnLi9pdGVtJ1xuICAgICAgXSxcbiAgICAgIGZ1bmN0aW9uKCBFdkVtaXR0ZXIsIGdldFNpemUsIHV0aWxzLCBJdGVtICkge1xuICAgICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBFdkVtaXR0ZXIsIGdldFNpemUsIHV0aWxzLCBJdGVtKTtcbiAgICAgIH1cbiAgICApO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzICkge1xuICAgIC8vIENvbW1vbkpTIC0gQnJvd3NlcmlmeSwgV2VicGFja1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ2V2LWVtaXR0ZXInKSxcbiAgICAgIHJlcXVpcmUoJ2dldC1zaXplJyksXG4gICAgICByZXF1aXJlKCdmaXp6eS11aS11dGlscycpLFxuICAgICAgcmVxdWlyZSgnLi9pdGVtJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93Lk91dGxheWVyID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5FdkVtaXR0ZXIsXG4gICAgICB3aW5kb3cuZ2V0U2l6ZSxcbiAgICAgIHdpbmRvdy5maXp6eVVJVXRpbHMsXG4gICAgICB3aW5kb3cuT3V0bGF5ZXIuSXRlbVxuICAgICk7XG4gIH1cblxufSggd2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIEV2RW1pdHRlciwgZ2V0U2l6ZSwgdXRpbHMsIEl0ZW0gKSB7XG4ndXNlIHN0cmljdCc7XG5cbi8vIC0tLS0tIHZhcnMgLS0tLS0gLy9cblxudmFyIGNvbnNvbGUgPSB3aW5kb3cuY29uc29sZTtcbnZhciBqUXVlcnkgPSB3aW5kb3cualF1ZXJ5O1xudmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBPdXRsYXllciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyBnbG9iYWxseSB1bmlxdWUgaWRlbnRpZmllcnNcbnZhciBHVUlEID0gMDtcbi8vIGludGVybmFsIHN0b3JlIG9mIGFsbCBPdXRsYXllciBpbnRhbmNlc1xudmFyIGluc3RhbmNlcyA9IHt9O1xuXG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50LCBTdHJpbmd9IGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gT3V0bGF5ZXIoIGVsZW1lbnQsIG9wdGlvbnMgKSB7XG4gIHZhciBxdWVyeUVsZW1lbnQgPSB1dGlscy5nZXRRdWVyeUVsZW1lbnQoIGVsZW1lbnQgKTtcbiAgaWYgKCAhcXVlcnlFbGVtZW50ICkge1xuICAgIGlmICggY29uc29sZSApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoICdCYWQgZWxlbWVudCBmb3IgJyArIHRoaXMuY29uc3RydWN0b3IubmFtZXNwYWNlICtcbiAgICAgICAgJzogJyArICggcXVlcnlFbGVtZW50IHx8IGVsZW1lbnQgKSApO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5lbGVtZW50ID0gcXVlcnlFbGVtZW50O1xuICAvLyBhZGQgalF1ZXJ5XG4gIGlmICggalF1ZXJ5ICkge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBqUXVlcnkoIHRoaXMuZWxlbWVudCApO1xuICB9XG5cbiAgLy8gb3B0aW9uc1xuICB0aGlzLm9wdGlvbnMgPSB1dGlscy5leHRlbmQoIHt9LCB0aGlzLmNvbnN0cnVjdG9yLmRlZmF1bHRzICk7XG4gIHRoaXMub3B0aW9uKCBvcHRpb25zICk7XG5cbiAgLy8gYWRkIGlkIGZvciBPdXRsYXllci5nZXRGcm9tRWxlbWVudFxuICB2YXIgaWQgPSArK0dVSUQ7XG4gIHRoaXMuZWxlbWVudC5vdXRsYXllckdVSUQgPSBpZDsgLy8gZXhwYW5kb1xuICBpbnN0YW5jZXNbIGlkIF0gPSB0aGlzOyAvLyBhc3NvY2lhdGUgdmlhIGlkXG5cbiAgLy8ga2ljayBpdCBvZmZcbiAgdGhpcy5fY3JlYXRlKCk7XG5cbiAgdmFyIGlzSW5pdExheW91dCA9IHRoaXMuX2dldE9wdGlvbignaW5pdExheW91dCcpO1xuICBpZiAoIGlzSW5pdExheW91dCApIHtcbiAgICB0aGlzLmxheW91dCgpO1xuICB9XG59XG5cbi8vIHNldHRpbmdzIGFyZSBmb3IgaW50ZXJuYWwgdXNlIG9ubHlcbk91dGxheWVyLm5hbWVzcGFjZSA9ICdvdXRsYXllcic7XG5PdXRsYXllci5JdGVtID0gSXRlbTtcblxuLy8gZGVmYXVsdCBvcHRpb25zXG5PdXRsYXllci5kZWZhdWx0cyA9IHtcbiAgY29udGFpbmVyU3R5bGU6IHtcbiAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJ1xuICB9LFxuICBpbml0TGF5b3V0OiB0cnVlLFxuICBvcmlnaW5MZWZ0OiB0cnVlLFxuICBvcmlnaW5Ub3A6IHRydWUsXG4gIHJlc2l6ZTogdHJ1ZSxcbiAgcmVzaXplQ29udGFpbmVyOiB0cnVlLFxuICAvLyBpdGVtIG9wdGlvbnNcbiAgdHJhbnNpdGlvbkR1cmF0aW9uOiAnMC40cycsXG4gIGhpZGRlblN0eWxlOiB7XG4gICAgb3BhY2l0eTogMCxcbiAgICB0cmFuc2Zvcm06ICdzY2FsZSgwLjAwMSknXG4gIH0sXG4gIHZpc2libGVTdHlsZToge1xuICAgIG9wYWNpdHk6IDEsXG4gICAgdHJhbnNmb3JtOiAnc2NhbGUoMSknXG4gIH1cbn07XG5cbnZhciBwcm90byA9IE91dGxheWVyLnByb3RvdHlwZTtcbi8vIGluaGVyaXQgRXZFbWl0dGVyXG51dGlscy5leHRlbmQoIHByb3RvLCBFdkVtaXR0ZXIucHJvdG90eXBlICk7XG5cbi8qKlxuICogc2V0IG9wdGlvbnNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXG4gKi9cbnByb3RvLm9wdGlvbiA9IGZ1bmN0aW9uKCBvcHRzICkge1xuICB1dGlscy5leHRlbmQoIHRoaXMub3B0aW9ucywgb3B0cyApO1xufTtcblxuLyoqXG4gKiBnZXQgYmFja3dhcmRzIGNvbXBhdGlibGUgb3B0aW9uIHZhbHVlLCBjaGVjayBvbGQgbmFtZVxuICovXG5wcm90by5fZ2V0T3B0aW9uID0gZnVuY3Rpb24oIG9wdGlvbiApIHtcbiAgdmFyIG9sZE9wdGlvbiA9IHRoaXMuY29uc3RydWN0b3IuY29tcGF0T3B0aW9uc1sgb3B0aW9uIF07XG4gIHJldHVybiBvbGRPcHRpb24gJiYgdGhpcy5vcHRpb25zWyBvbGRPcHRpb24gXSAhPT0gdW5kZWZpbmVkID9cbiAgICB0aGlzLm9wdGlvbnNbIG9sZE9wdGlvbiBdIDogdGhpcy5vcHRpb25zWyBvcHRpb24gXTtcbn07XG5cbk91dGxheWVyLmNvbXBhdE9wdGlvbnMgPSB7XG4gIC8vIGN1cnJlbnROYW1lOiBvbGROYW1lXG4gIGluaXRMYXlvdXQ6ICdpc0luaXRMYXlvdXQnLFxuICBob3Jpem9udGFsOiAnaXNIb3Jpem9udGFsJyxcbiAgbGF5b3V0SW5zdGFudDogJ2lzTGF5b3V0SW5zdGFudCcsXG4gIG9yaWdpbkxlZnQ6ICdpc09yaWdpbkxlZnQnLFxuICBvcmlnaW5Ub3A6ICdpc09yaWdpblRvcCcsXG4gIHJlc2l6ZTogJ2lzUmVzaXplQm91bmQnLFxuICByZXNpemVDb250YWluZXI6ICdpc1Jlc2l6aW5nQ29udGFpbmVyJ1xufTtcblxucHJvdG8uX2NyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBnZXQgaXRlbXMgZnJvbSBjaGlsZHJlblxuICB0aGlzLnJlbG9hZEl0ZW1zKCk7XG4gIC8vIGVsZW1lbnRzIHRoYXQgYWZmZWN0IGxheW91dCwgYnV0IGFyZSBub3QgbGFpZCBvdXRcbiAgdGhpcy5zdGFtcHMgPSBbXTtcbiAgdGhpcy5zdGFtcCggdGhpcy5vcHRpb25zLnN0YW1wICk7XG4gIC8vIHNldCBjb250YWluZXIgc3R5bGVcbiAgdXRpbHMuZXh0ZW5kKCB0aGlzLmVsZW1lbnQuc3R5bGUsIHRoaXMub3B0aW9ucy5jb250YWluZXJTdHlsZSApO1xuXG4gIC8vIGJpbmQgcmVzaXplIG1ldGhvZFxuICB2YXIgY2FuQmluZFJlc2l6ZSA9IHRoaXMuX2dldE9wdGlvbigncmVzaXplJyk7XG4gIGlmICggY2FuQmluZFJlc2l6ZSApIHtcbiAgICB0aGlzLmJpbmRSZXNpemUoKTtcbiAgfVxufTtcblxuLy8gZ29lcyB0aHJvdWdoIGFsbCBjaGlsZHJlbiBhZ2FpbiBhbmQgZ2V0cyBicmlja3MgaW4gcHJvcGVyIG9yZGVyXG5wcm90by5yZWxvYWRJdGVtcyA9IGZ1bmN0aW9uKCkge1xuICAvLyBjb2xsZWN0aW9uIG9mIGl0ZW0gZWxlbWVudHNcbiAgdGhpcy5pdGVtcyA9IHRoaXMuX2l0ZW1pemUoIHRoaXMuZWxlbWVudC5jaGlsZHJlbiApO1xufTtcblxuXG4vKipcbiAqIHR1cm4gZWxlbWVudHMgaW50byBPdXRsYXllci5JdGVtcyB0byBiZSB1c2VkIGluIGxheW91dFxuICogQHBhcmFtIHtBcnJheSBvciBOb2RlTGlzdCBvciBIVE1MRWxlbWVudH0gZWxlbXNcbiAqIEByZXR1cm5zIHtBcnJheX0gaXRlbXMgLSBjb2xsZWN0aW9uIG9mIG5ldyBPdXRsYXllciBJdGVtc1xuICovXG5wcm90by5faXRlbWl6ZSA9IGZ1bmN0aW9uKCBlbGVtcyApIHtcblxuICB2YXIgaXRlbUVsZW1zID0gdGhpcy5fZmlsdGVyRmluZEl0ZW1FbGVtZW50cyggZWxlbXMgKTtcbiAgdmFyIEl0ZW0gPSB0aGlzLmNvbnN0cnVjdG9yLkl0ZW07XG5cbiAgLy8gY3JlYXRlIG5ldyBPdXRsYXllciBJdGVtcyBmb3IgY29sbGVjdGlvblxuICB2YXIgaXRlbXMgPSBbXTtcbiAgZm9yICggdmFyIGk9MDsgaSA8IGl0ZW1FbGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICB2YXIgZWxlbSA9IGl0ZW1FbGVtc1tpXTtcbiAgICB2YXIgaXRlbSA9IG5ldyBJdGVtKCBlbGVtLCB0aGlzICk7XG4gICAgaXRlbXMucHVzaCggaXRlbSApO1xuICB9XG5cbiAgcmV0dXJuIGl0ZW1zO1xufTtcblxuLyoqXG4gKiBnZXQgaXRlbSBlbGVtZW50cyB0byBiZSB1c2VkIGluIGxheW91dFxuICogQHBhcmFtIHtBcnJheSBvciBOb2RlTGlzdCBvciBIVE1MRWxlbWVudH0gZWxlbXNcbiAqIEByZXR1cm5zIHtBcnJheX0gaXRlbXMgLSBpdGVtIGVsZW1lbnRzXG4gKi9cbnByb3RvLl9maWx0ZXJGaW5kSXRlbUVsZW1lbnRzID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICByZXR1cm4gdXRpbHMuZmlsdGVyRmluZEVsZW1lbnRzKCBlbGVtcywgdGhpcy5vcHRpb25zLml0ZW1TZWxlY3RvciApO1xufTtcblxuLyoqXG4gKiBnZXR0ZXIgbWV0aG9kIGZvciBnZXR0aW5nIGl0ZW0gZWxlbWVudHNcbiAqIEByZXR1cm5zIHtBcnJheX0gZWxlbXMgLSBjb2xsZWN0aW9uIG9mIGl0ZW0gZWxlbWVudHNcbiAqL1xucHJvdG8uZ2V0SXRlbUVsZW1lbnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLml0ZW1zLm1hcCggZnVuY3Rpb24oIGl0ZW0gKSB7XG4gICAgcmV0dXJuIGl0ZW0uZWxlbWVudDtcbiAgfSk7XG59O1xuXG4vLyAtLS0tLSBpbml0ICYgbGF5b3V0IC0tLS0tIC8vXG5cbi8qKlxuICogbGF5cyBvdXQgYWxsIGl0ZW1zXG4gKi9cbnByb3RvLmxheW91dCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9yZXNldExheW91dCgpO1xuICB0aGlzLl9tYW5hZ2VTdGFtcHMoKTtcblxuICAvLyBkb24ndCBhbmltYXRlIGZpcnN0IGxheW91dFxuICB2YXIgbGF5b3V0SW5zdGFudCA9IHRoaXMuX2dldE9wdGlvbignbGF5b3V0SW5zdGFudCcpO1xuICB2YXIgaXNJbnN0YW50ID0gbGF5b3V0SW5zdGFudCAhPT0gdW5kZWZpbmVkID9cbiAgICBsYXlvdXRJbnN0YW50IDogIXRoaXMuX2lzTGF5b3V0SW5pdGVkO1xuICB0aGlzLmxheW91dEl0ZW1zKCB0aGlzLml0ZW1zLCBpc0luc3RhbnQgKTtcblxuICAvLyBmbGFnIGZvciBpbml0YWxpemVkXG4gIHRoaXMuX2lzTGF5b3V0SW5pdGVkID0gdHJ1ZTtcbn07XG5cbi8vIF9pbml0IGlzIGFsaWFzIGZvciBsYXlvdXRcbnByb3RvLl9pbml0ID0gcHJvdG8ubGF5b3V0O1xuXG4vKipcbiAqIGxvZ2ljIGJlZm9yZSBhbnkgbmV3IGxheW91dFxuICovXG5wcm90by5fcmVzZXRMYXlvdXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5nZXRTaXplKCk7XG59O1xuXG5cbnByb3RvLmdldFNpemUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zaXplID0gZ2V0U2l6ZSggdGhpcy5lbGVtZW50ICk7XG59O1xuXG4vKipcbiAqIGdldCBtZWFzdXJlbWVudCBmcm9tIG9wdGlvbiwgZm9yIGNvbHVtbldpZHRoLCByb3dIZWlnaHQsIGd1dHRlclxuICogaWYgb3B0aW9uIGlzIFN0cmluZyAtPiBnZXQgZWxlbWVudCBmcm9tIHNlbGVjdG9yIHN0cmluZywgJiBnZXQgc2l6ZSBvZiBlbGVtZW50XG4gKiBpZiBvcHRpb24gaXMgRWxlbWVudCAtPiBnZXQgc2l6ZSBvZiBlbGVtZW50XG4gKiBlbHNlIHVzZSBvcHRpb24gYXMgYSBudW1iZXJcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbWVhc3VyZW1lbnRcbiAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gd2lkdGggb3IgaGVpZ2h0XG4gKiBAcHJpdmF0ZVxuICovXG5wcm90by5fZ2V0TWVhc3VyZW1lbnQgPSBmdW5jdGlvbiggbWVhc3VyZW1lbnQsIHNpemUgKSB7XG4gIHZhciBvcHRpb24gPSB0aGlzLm9wdGlvbnNbIG1lYXN1cmVtZW50IF07XG4gIHZhciBlbGVtO1xuICBpZiAoICFvcHRpb24gKSB7XG4gICAgLy8gZGVmYXVsdCB0byAwXG4gICAgdGhpc1sgbWVhc3VyZW1lbnQgXSA9IDA7XG4gIH0gZWxzZSB7XG4gICAgLy8gdXNlIG9wdGlvbiBhcyBhbiBlbGVtZW50XG4gICAgaWYgKCB0eXBlb2Ygb3B0aW9uID09ICdzdHJpbmcnICkge1xuICAgICAgZWxlbSA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCBvcHRpb24gKTtcbiAgICB9IGVsc2UgaWYgKCBvcHRpb24gaW5zdGFuY2VvZiBIVE1MRWxlbWVudCApIHtcbiAgICAgIGVsZW0gPSBvcHRpb247XG4gICAgfVxuICAgIC8vIHVzZSBzaXplIG9mIGVsZW1lbnQsIGlmIGVsZW1lbnRcbiAgICB0aGlzWyBtZWFzdXJlbWVudCBdID0gZWxlbSA/IGdldFNpemUoIGVsZW0gKVsgc2l6ZSBdIDogb3B0aW9uO1xuICB9XG59O1xuXG4vKipcbiAqIGxheW91dCBhIGNvbGxlY3Rpb24gb2YgaXRlbSBlbGVtZW50c1xuICogQGFwaSBwdWJsaWNcbiAqL1xucHJvdG8ubGF5b3V0SXRlbXMgPSBmdW5jdGlvbiggaXRlbXMsIGlzSW5zdGFudCApIHtcbiAgaXRlbXMgPSB0aGlzLl9nZXRJdGVtc0ZvckxheW91dCggaXRlbXMgKTtcblxuICB0aGlzLl9sYXlvdXRJdGVtcyggaXRlbXMsIGlzSW5zdGFudCApO1xuXG4gIHRoaXMuX3Bvc3RMYXlvdXQoKTtcbn07XG5cbi8qKlxuICogZ2V0IHRoZSBpdGVtcyB0byBiZSBsYWlkIG91dFxuICogeW91IG1heSB3YW50IHRvIHNraXAgb3ZlciBzb21lIGl0ZW1zXG4gKiBAcGFyYW0ge0FycmF5fSBpdGVtc1xuICogQHJldHVybnMge0FycmF5fSBpdGVtc1xuICovXG5wcm90by5fZ2V0SXRlbXNGb3JMYXlvdXQgPSBmdW5jdGlvbiggaXRlbXMgKSB7XG4gIHJldHVybiBpdGVtcy5maWx0ZXIoIGZ1bmN0aW9uKCBpdGVtICkge1xuICAgIHJldHVybiAhaXRlbS5pc0lnbm9yZWQ7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBsYXlvdXQgaXRlbXNcbiAqIEBwYXJhbSB7QXJyYXl9IGl0ZW1zXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzSW5zdGFudFxuICovXG5wcm90by5fbGF5b3V0SXRlbXMgPSBmdW5jdGlvbiggaXRlbXMsIGlzSW5zdGFudCApIHtcbiAgdGhpcy5fZW1pdENvbXBsZXRlT25JdGVtcyggJ2xheW91dCcsIGl0ZW1zICk7XG5cbiAgaWYgKCAhaXRlbXMgfHwgIWl0ZW1zLmxlbmd0aCApIHtcbiAgICAvLyBubyBpdGVtcywgZW1pdCBldmVudCB3aXRoIGVtcHR5IGFycmF5XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHF1ZXVlID0gW107XG5cbiAgaXRlbXMuZm9yRWFjaCggZnVuY3Rpb24oIGl0ZW0gKSB7XG4gICAgLy8gZ2V0IHgveSBvYmplY3QgZnJvbSBtZXRob2RcbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLl9nZXRJdGVtTGF5b3V0UG9zaXRpb24oIGl0ZW0gKTtcbiAgICAvLyBlbnF1ZXVlXG4gICAgcG9zaXRpb24uaXRlbSA9IGl0ZW07XG4gICAgcG9zaXRpb24uaXNJbnN0YW50ID0gaXNJbnN0YW50IHx8IGl0ZW0uaXNMYXlvdXRJbnN0YW50O1xuICAgIHF1ZXVlLnB1c2goIHBvc2l0aW9uICk7XG4gIH0sIHRoaXMgKTtcblxuICB0aGlzLl9wcm9jZXNzTGF5b3V0UXVldWUoIHF1ZXVlICk7XG59O1xuXG4vKipcbiAqIGdldCBpdGVtIGxheW91dCBwb3NpdGlvblxuICogQHBhcmFtIHtPdXRsYXllci5JdGVtfSBpdGVtXG4gKiBAcmV0dXJucyB7T2JqZWN0fSB4IGFuZCB5IHBvc2l0aW9uXG4gKi9cbnByb3RvLl9nZXRJdGVtTGF5b3V0UG9zaXRpb24gPSBmdW5jdGlvbiggLyogaXRlbSAqLyApIHtcbiAgcmV0dXJuIHtcbiAgICB4OiAwLFxuICAgIHk6IDBcbiAgfTtcbn07XG5cbi8qKlxuICogaXRlcmF0ZSBvdmVyIGFycmF5IGFuZCBwb3NpdGlvbiBlYWNoIGl0ZW1cbiAqIFJlYXNvbiBiZWluZyAtIHNlcGFyYXRpbmcgdGhpcyBsb2dpYyBwcmV2ZW50cyAnbGF5b3V0IGludmFsaWRhdGlvbidcbiAqIHRoeCBAcGF1bF9pcmlzaFxuICogQHBhcmFtIHtBcnJheX0gcXVldWVcbiAqL1xucHJvdG8uX3Byb2Nlc3NMYXlvdXRRdWV1ZSA9IGZ1bmN0aW9uKCBxdWV1ZSApIHtcbiAgcXVldWUuZm9yRWFjaCggZnVuY3Rpb24oIG9iaiApIHtcbiAgICB0aGlzLl9wb3NpdGlvbkl0ZW0oIG9iai5pdGVtLCBvYmoueCwgb2JqLnksIG9iai5pc0luc3RhbnQgKTtcbiAgfSwgdGhpcyApO1xufTtcblxuLyoqXG4gKiBTZXRzIHBvc2l0aW9uIG9mIGl0ZW0gaW4gRE9NXG4gKiBAcGFyYW0ge091dGxheWVyLkl0ZW19IGl0ZW1cbiAqIEBwYXJhbSB7TnVtYmVyfSB4IC0gaG9yaXpvbnRhbCBwb3NpdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IHkgLSB2ZXJ0aWNhbCBwb3NpdGlvblxuICogQHBhcmFtIHtCb29sZWFufSBpc0luc3RhbnQgLSBkaXNhYmxlcyB0cmFuc2l0aW9uc1xuICovXG5wcm90by5fcG9zaXRpb25JdGVtID0gZnVuY3Rpb24oIGl0ZW0sIHgsIHksIGlzSW5zdGFudCApIHtcbiAgaWYgKCBpc0luc3RhbnQgKSB7XG4gICAgLy8gaWYgbm90IHRyYW5zaXRpb24sIGp1c3Qgc2V0IENTU1xuICAgIGl0ZW0uZ29UbyggeCwgeSApO1xuICB9IGVsc2Uge1xuICAgIGl0ZW0ubW92ZVRvKCB4LCB5ICk7XG4gIH1cbn07XG5cbi8qKlxuICogQW55IGxvZ2ljIHlvdSB3YW50IHRvIGRvIGFmdGVyIGVhY2ggbGF5b3V0LFxuICogaS5lLiBzaXplIHRoZSBjb250YWluZXJcbiAqL1xucHJvdG8uX3Bvc3RMYXlvdXQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5yZXNpemVDb250YWluZXIoKTtcbn07XG5cbnByb3RvLnJlc2l6ZUNvbnRhaW5lciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaXNSZXNpemluZ0NvbnRhaW5lciA9IHRoaXMuX2dldE9wdGlvbigncmVzaXplQ29udGFpbmVyJyk7XG4gIGlmICggIWlzUmVzaXppbmdDb250YWluZXIgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBzaXplID0gdGhpcy5fZ2V0Q29udGFpbmVyU2l6ZSgpO1xuICBpZiAoIHNpemUgKSB7XG4gICAgdGhpcy5fc2V0Q29udGFpbmVyTWVhc3VyZSggc2l6ZS53aWR0aCwgdHJ1ZSApO1xuICAgIHRoaXMuX3NldENvbnRhaW5lck1lYXN1cmUoIHNpemUuaGVpZ2h0LCBmYWxzZSApO1xuICB9XG59O1xuXG4vKipcbiAqIFNldHMgd2lkdGggb3IgaGVpZ2h0IG9mIGNvbnRhaW5lciBpZiByZXR1cm5lZFxuICogQHJldHVybnMge09iamVjdH0gc2l6ZVxuICogICBAcGFyYW0ge051bWJlcn0gd2lkdGhcbiAqICAgQHBhcmFtIHtOdW1iZXJ9IGhlaWdodFxuICovXG5wcm90by5fZ2V0Q29udGFpbmVyU2l6ZSA9IG5vb3A7XG5cbi8qKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1lYXN1cmUgLSBzaXplIG9mIHdpZHRoIG9yIGhlaWdodFxuICogQHBhcmFtIHtCb29sZWFufSBpc1dpZHRoXG4gKi9cbnByb3RvLl9zZXRDb250YWluZXJNZWFzdXJlID0gZnVuY3Rpb24oIG1lYXN1cmUsIGlzV2lkdGggKSB7XG4gIGlmICggbWVhc3VyZSA9PT0gdW5kZWZpbmVkICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBlbGVtU2l6ZSA9IHRoaXMuc2l6ZTtcbiAgLy8gYWRkIHBhZGRpbmcgYW5kIGJvcmRlciB3aWR0aCBpZiBib3JkZXIgYm94XG4gIGlmICggZWxlbVNpemUuaXNCb3JkZXJCb3ggKSB7XG4gICAgbWVhc3VyZSArPSBpc1dpZHRoID8gZWxlbVNpemUucGFkZGluZ0xlZnQgKyBlbGVtU2l6ZS5wYWRkaW5nUmlnaHQgK1xuICAgICAgZWxlbVNpemUuYm9yZGVyTGVmdFdpZHRoICsgZWxlbVNpemUuYm9yZGVyUmlnaHRXaWR0aCA6XG4gICAgICBlbGVtU2l6ZS5wYWRkaW5nQm90dG9tICsgZWxlbVNpemUucGFkZGluZ1RvcCArXG4gICAgICBlbGVtU2l6ZS5ib3JkZXJUb3BXaWR0aCArIGVsZW1TaXplLmJvcmRlckJvdHRvbVdpZHRoO1xuICB9XG5cbiAgbWVhc3VyZSA9IE1hdGgubWF4KCBtZWFzdXJlLCAwICk7XG4gIHRoaXMuZWxlbWVudC5zdHlsZVsgaXNXaWR0aCA/ICd3aWR0aCcgOiAnaGVpZ2h0JyBdID0gbWVhc3VyZSArICdweCc7XG59O1xuXG4vKipcbiAqIGVtaXQgZXZlbnRDb21wbGV0ZSBvbiBhIGNvbGxlY3Rpb24gb2YgaXRlbXMgZXZlbnRzXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lXG4gKiBAcGFyYW0ge0FycmF5fSBpdGVtcyAtIE91dGxheWVyLkl0ZW1zXG4gKi9cbnByb3RvLl9lbWl0Q29tcGxldGVPbkl0ZW1zID0gZnVuY3Rpb24oIGV2ZW50TmFtZSwgaXRlbXMgKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIGZ1bmN0aW9uIG9uQ29tcGxldGUoKSB7XG4gICAgX3RoaXMuZGlzcGF0Y2hFdmVudCggZXZlbnROYW1lICsgJ0NvbXBsZXRlJywgbnVsbCwgWyBpdGVtcyBdICk7XG4gIH1cblxuICB2YXIgY291bnQgPSBpdGVtcy5sZW5ndGg7XG4gIGlmICggIWl0ZW1zIHx8ICFjb3VudCApIHtcbiAgICBvbkNvbXBsZXRlKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGRvbmVDb3VudCA9IDA7XG4gIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgZG9uZUNvdW50Kys7XG4gICAgaWYgKCBkb25lQ291bnQgPT0gY291bnQgKSB7XG4gICAgICBvbkNvbXBsZXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gYmluZCBjYWxsYmFja1xuICBpdGVtcy5mb3JFYWNoKCBmdW5jdGlvbiggaXRlbSApIHtcbiAgICBpdGVtLm9uY2UoIGV2ZW50TmFtZSwgdGljayApO1xuICB9KTtcbn07XG5cbi8qKlxuICogZW1pdHMgZXZlbnRzIHZpYSBFdkVtaXR0ZXIgYW5kIGpRdWVyeSBldmVudHNcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIC0gbmFtZSBvZiBldmVudFxuICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSBvcmlnaW5hbCBldmVudFxuICogQHBhcmFtIHtBcnJheX0gYXJncyAtIGV4dHJhIGFyZ3VtZW50c1xuICovXG5wcm90by5kaXNwYXRjaEV2ZW50ID0gZnVuY3Rpb24oIHR5cGUsIGV2ZW50LCBhcmdzICkge1xuICAvLyBhZGQgb3JpZ2luYWwgZXZlbnQgdG8gYXJndW1lbnRzXG4gIHZhciBlbWl0QXJncyA9IGV2ZW50ID8gWyBldmVudCBdLmNvbmNhdCggYXJncyApIDogYXJncztcbiAgdGhpcy5lbWl0RXZlbnQoIHR5cGUsIGVtaXRBcmdzICk7XG5cbiAgaWYgKCBqUXVlcnkgKSB7XG4gICAgLy8gc2V0IHRoaXMuJGVsZW1lbnRcbiAgICB0aGlzLiRlbGVtZW50ID0gdGhpcy4kZWxlbWVudCB8fCBqUXVlcnkoIHRoaXMuZWxlbWVudCApO1xuICAgIGlmICggZXZlbnQgKSB7XG4gICAgICAvLyBjcmVhdGUgalF1ZXJ5IGV2ZW50XG4gICAgICB2YXIgJGV2ZW50ID0galF1ZXJ5LkV2ZW50KCBldmVudCApO1xuICAgICAgJGV2ZW50LnR5cGUgPSB0eXBlO1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCAkZXZlbnQsIGFyZ3MgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8ganVzdCB0cmlnZ2VyIHdpdGggdHlwZSBpZiBubyBldmVudCBhdmFpbGFibGVcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlciggdHlwZSwgYXJncyApO1xuICAgIH1cbiAgfVxufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaWdub3JlICYgc3RhbXBzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cblxuLyoqXG4gKiBrZWVwIGl0ZW0gaW4gY29sbGVjdGlvbiwgYnV0IGRvIG5vdCBsYXkgaXQgb3V0XG4gKiBpZ25vcmVkIGl0ZW1zIGRvIG5vdCBnZXQgc2tpcHBlZCBpbiBsYXlvdXRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbVxuICovXG5wcm90by5pZ25vcmUgPSBmdW5jdGlvbiggZWxlbSApIHtcbiAgdmFyIGl0ZW0gPSB0aGlzLmdldEl0ZW0oIGVsZW0gKTtcbiAgaWYgKCBpdGVtICkge1xuICAgIGl0ZW0uaXNJZ25vcmVkID0gdHJ1ZTtcbiAgfVxufTtcblxuLyoqXG4gKiByZXR1cm4gaXRlbSB0byBsYXlvdXQgY29sbGVjdGlvblxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gKi9cbnByb3RvLnVuaWdub3JlID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIHZhciBpdGVtID0gdGhpcy5nZXRJdGVtKCBlbGVtICk7XG4gIGlmICggaXRlbSApIHtcbiAgICBkZWxldGUgaXRlbS5pc0lnbm9yZWQ7XG4gIH1cbn07XG5cbi8qKlxuICogYWRkcyBlbGVtZW50cyB0byBzdGFtcHNcbiAqIEBwYXJhbSB7Tm9kZUxpc3QsIEFycmF5LCBFbGVtZW50LCBvciBTdHJpbmd9IGVsZW1zXG4gKi9cbnByb3RvLnN0YW1wID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICBlbGVtcyA9IHRoaXMuX2ZpbmQoIGVsZW1zICk7XG4gIGlmICggIWVsZW1zICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuc3RhbXBzID0gdGhpcy5zdGFtcHMuY29uY2F0KCBlbGVtcyApO1xuICAvLyBpZ25vcmVcbiAgZWxlbXMuZm9yRWFjaCggdGhpcy5pZ25vcmUsIHRoaXMgKTtcbn07XG5cbi8qKlxuICogcmVtb3ZlcyBlbGVtZW50cyB0byBzdGFtcHNcbiAqIEBwYXJhbSB7Tm9kZUxpc3QsIEFycmF5LCBvciBFbGVtZW50fSBlbGVtc1xuICovXG5wcm90by51bnN0YW1wID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICBlbGVtcyA9IHRoaXMuX2ZpbmQoIGVsZW1zICk7XG4gIGlmICggIWVsZW1zICl7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZWxlbXMuZm9yRWFjaCggZnVuY3Rpb24oIGVsZW0gKSB7XG4gICAgLy8gZmlsdGVyIG91dCByZW1vdmVkIHN0YW1wIGVsZW1lbnRzXG4gICAgdXRpbHMucmVtb3ZlRnJvbSggdGhpcy5zdGFtcHMsIGVsZW0gKTtcbiAgICB0aGlzLnVuaWdub3JlKCBlbGVtICk7XG4gIH0sIHRoaXMgKTtcbn07XG5cbi8qKlxuICogZmluZHMgY2hpbGQgZWxlbWVudHNcbiAqIEBwYXJhbSB7Tm9kZUxpc3QsIEFycmF5LCBFbGVtZW50LCBvciBTdHJpbmd9IGVsZW1zXG4gKiBAcmV0dXJucyB7QXJyYXl9IGVsZW1zXG4gKi9cbnByb3RvLl9maW5kID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICBpZiAoICFlbGVtcyApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gaWYgc3RyaW5nLCB1c2UgYXJndW1lbnQgYXMgc2VsZWN0b3Igc3RyaW5nXG4gIGlmICggdHlwZW9mIGVsZW1zID09ICdzdHJpbmcnICkge1xuICAgIGVsZW1zID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIGVsZW1zICk7XG4gIH1cbiAgZWxlbXMgPSB1dGlscy5tYWtlQXJyYXkoIGVsZW1zICk7XG4gIHJldHVybiBlbGVtcztcbn07XG5cbnByb3RvLl9tYW5hZ2VTdGFtcHMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCAhdGhpcy5zdGFtcHMgfHwgIXRoaXMuc3RhbXBzLmxlbmd0aCApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLl9nZXRCb3VuZGluZ1JlY3QoKTtcblxuICB0aGlzLnN0YW1wcy5mb3JFYWNoKCB0aGlzLl9tYW5hZ2VTdGFtcCwgdGhpcyApO1xufTtcblxuLy8gdXBkYXRlIGJvdW5kaW5nTGVmdCAvIFRvcFxucHJvdG8uX2dldEJvdW5kaW5nUmVjdCA9IGZ1bmN0aW9uKCkge1xuICAvLyBnZXQgYm91bmRpbmcgcmVjdCBmb3IgY29udGFpbmVyIGVsZW1lbnRcbiAgdmFyIGJvdW5kaW5nUmVjdCA9IHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgdmFyIHNpemUgPSB0aGlzLnNpemU7XG4gIHRoaXMuX2JvdW5kaW5nUmVjdCA9IHtcbiAgICBsZWZ0OiBib3VuZGluZ1JlY3QubGVmdCArIHNpemUucGFkZGluZ0xlZnQgKyBzaXplLmJvcmRlckxlZnRXaWR0aCxcbiAgICB0b3A6IGJvdW5kaW5nUmVjdC50b3AgKyBzaXplLnBhZGRpbmdUb3AgKyBzaXplLmJvcmRlclRvcFdpZHRoLFxuICAgIHJpZ2h0OiBib3VuZGluZ1JlY3QucmlnaHQgLSAoIHNpemUucGFkZGluZ1JpZ2h0ICsgc2l6ZS5ib3JkZXJSaWdodFdpZHRoICksXG4gICAgYm90dG9tOiBib3VuZGluZ1JlY3QuYm90dG9tIC0gKCBzaXplLnBhZGRpbmdCb3R0b20gKyBzaXplLmJvcmRlckJvdHRvbVdpZHRoIClcbiAgfTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHtFbGVtZW50fSBzdGFtcFxuKiovXG5wcm90by5fbWFuYWdlU3RhbXAgPSBub29wO1xuXG4vKipcbiAqIGdldCB4L3kgcG9zaXRpb24gb2YgZWxlbWVudCByZWxhdGl2ZSB0byBjb250YWluZXIgZWxlbWVudFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBvZmZzZXQgLSBoYXMgbGVmdCwgdG9wLCByaWdodCwgYm90dG9tXG4gKi9cbnByb3RvLl9nZXRFbGVtZW50T2Zmc2V0ID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIHZhciBib3VuZGluZ1JlY3QgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB2YXIgdGhpc1JlY3QgPSB0aGlzLl9ib3VuZGluZ1JlY3Q7XG4gIHZhciBzaXplID0gZ2V0U2l6ZSggZWxlbSApO1xuICB2YXIgb2Zmc2V0ID0ge1xuICAgIGxlZnQ6IGJvdW5kaW5nUmVjdC5sZWZ0IC0gdGhpc1JlY3QubGVmdCAtIHNpemUubWFyZ2luTGVmdCxcbiAgICB0b3A6IGJvdW5kaW5nUmVjdC50b3AgLSB0aGlzUmVjdC50b3AgLSBzaXplLm1hcmdpblRvcCxcbiAgICByaWdodDogdGhpc1JlY3QucmlnaHQgLSBib3VuZGluZ1JlY3QucmlnaHQgLSBzaXplLm1hcmdpblJpZ2h0LFxuICAgIGJvdHRvbTogdGhpc1JlY3QuYm90dG9tIC0gYm91bmRpbmdSZWN0LmJvdHRvbSAtIHNpemUubWFyZ2luQm90dG9tXG4gIH07XG4gIHJldHVybiBvZmZzZXQ7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSByZXNpemUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLy8gZW5hYmxlIGV2ZW50IGhhbmRsZXJzIGZvciBsaXN0ZW5lcnNcbi8vIGkuZS4gcmVzaXplIC0+IG9ucmVzaXplXG5wcm90by5oYW5kbGVFdmVudCA9IHV0aWxzLmhhbmRsZUV2ZW50O1xuXG4vKipcbiAqIEJpbmQgbGF5b3V0IHRvIHdpbmRvdyByZXNpemluZ1xuICovXG5wcm90by5iaW5kUmVzaXplID0gZnVuY3Rpb24oKSB7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCAncmVzaXplJywgdGhpcyApO1xuICB0aGlzLmlzUmVzaXplQm91bmQgPSB0cnVlO1xufTtcblxuLyoqXG4gKiBVbmJpbmQgbGF5b3V0IHRvIHdpbmRvdyByZXNpemluZ1xuICovXG5wcm90by51bmJpbmRSZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICdyZXNpemUnLCB0aGlzICk7XG4gIHRoaXMuaXNSZXNpemVCb3VuZCA9IGZhbHNlO1xufTtcblxucHJvdG8ub25yZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5yZXNpemUoKTtcbn07XG5cbnV0aWxzLmRlYm91bmNlTWV0aG9kKCBPdXRsYXllciwgJ29ucmVzaXplJywgMTAwICk7XG5cbnByb3RvLnJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBkb24ndCB0cmlnZ2VyIGlmIHNpemUgZGlkIG5vdCBjaGFuZ2VcbiAgLy8gb3IgaWYgcmVzaXplIHdhcyB1bmJvdW5kLiBTZWUgIzlcbiAgaWYgKCAhdGhpcy5pc1Jlc2l6ZUJvdW5kIHx8ICF0aGlzLm5lZWRzUmVzaXplTGF5b3V0KCkgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5sYXlvdXQoKTtcbn07XG5cbi8qKlxuICogY2hlY2sgaWYgbGF5b3V0IGlzIG5lZWRlZCBwb3N0IGxheW91dFxuICogQHJldHVybnMgQm9vbGVhblxuICovXG5wcm90by5uZWVkc1Jlc2l6ZUxheW91dCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2l6ZSA9IGdldFNpemUoIHRoaXMuZWxlbWVudCApO1xuICAvLyBjaGVjayB0aGF0IHRoaXMuc2l6ZSBhbmQgc2l6ZSBhcmUgdGhlcmVcbiAgLy8gSUU4IHRyaWdnZXJzIHJlc2l6ZSBvbiBib2R5IHNpemUgY2hhbmdlLCBzbyB0aGV5IG1pZ2h0IG5vdCBiZVxuICB2YXIgaGFzU2l6ZXMgPSB0aGlzLnNpemUgJiYgc2l6ZTtcbiAgcmV0dXJuIGhhc1NpemVzICYmIHNpemUuaW5uZXJXaWR0aCAhPT0gdGhpcy5zaXplLmlubmVyV2lkdGg7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtZXRob2RzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8qKlxuICogYWRkIGl0ZW1zIHRvIE91dGxheWVyIGluc3RhbmNlXG4gKiBAcGFyYW0ge0FycmF5IG9yIE5vZGVMaXN0IG9yIEVsZW1lbnR9IGVsZW1zXG4gKiBAcmV0dXJucyB7QXJyYXl9IGl0ZW1zIC0gT3V0bGF5ZXIuSXRlbXNcbioqL1xucHJvdG8uYWRkSXRlbXMgPSBmdW5jdGlvbiggZWxlbXMgKSB7XG4gIHZhciBpdGVtcyA9IHRoaXMuX2l0ZW1pemUoIGVsZW1zICk7XG4gIC8vIGFkZCBpdGVtcyB0byBjb2xsZWN0aW9uXG4gIGlmICggaXRlbXMubGVuZ3RoICkge1xuICAgIHRoaXMuaXRlbXMgPSB0aGlzLml0ZW1zLmNvbmNhdCggaXRlbXMgKTtcbiAgfVxuICByZXR1cm4gaXRlbXM7XG59O1xuXG4vKipcbiAqIExheW91dCBuZXdseS1hcHBlbmRlZCBpdGVtIGVsZW1lbnRzXG4gKiBAcGFyYW0ge0FycmF5IG9yIE5vZGVMaXN0IG9yIEVsZW1lbnR9IGVsZW1zXG4gKi9cbnByb3RvLmFwcGVuZGVkID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICB2YXIgaXRlbXMgPSB0aGlzLmFkZEl0ZW1zKCBlbGVtcyApO1xuICBpZiAoICFpdGVtcy5sZW5ndGggKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIGxheW91dCBhbmQgcmV2ZWFsIGp1c3QgdGhlIG5ldyBpdGVtc1xuICB0aGlzLmxheW91dEl0ZW1zKCBpdGVtcywgdHJ1ZSApO1xuICB0aGlzLnJldmVhbCggaXRlbXMgKTtcbn07XG5cbi8qKlxuICogTGF5b3V0IHByZXBlbmRlZCBlbGVtZW50c1xuICogQHBhcmFtIHtBcnJheSBvciBOb2RlTGlzdCBvciBFbGVtZW50fSBlbGVtc1xuICovXG5wcm90by5wcmVwZW5kZWQgPSBmdW5jdGlvbiggZWxlbXMgKSB7XG4gIHZhciBpdGVtcyA9IHRoaXMuX2l0ZW1pemUoIGVsZW1zICk7XG4gIGlmICggIWl0ZW1zLmxlbmd0aCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gYWRkIGl0ZW1zIHRvIGJlZ2lubmluZyBvZiBjb2xsZWN0aW9uXG4gIHZhciBwcmV2aW91c0l0ZW1zID0gdGhpcy5pdGVtcy5zbGljZSgwKTtcbiAgdGhpcy5pdGVtcyA9IGl0ZW1zLmNvbmNhdCggcHJldmlvdXNJdGVtcyApO1xuICAvLyBzdGFydCBuZXcgbGF5b3V0XG4gIHRoaXMuX3Jlc2V0TGF5b3V0KCk7XG4gIHRoaXMuX21hbmFnZVN0YW1wcygpO1xuICAvLyBsYXlvdXQgbmV3IHN0dWZmIHdpdGhvdXQgdHJhbnNpdGlvblxuICB0aGlzLmxheW91dEl0ZW1zKCBpdGVtcywgdHJ1ZSApO1xuICB0aGlzLnJldmVhbCggaXRlbXMgKTtcbiAgLy8gbGF5b3V0IHByZXZpb3VzIGl0ZW1zXG4gIHRoaXMubGF5b3V0SXRlbXMoIHByZXZpb3VzSXRlbXMgKTtcbn07XG5cbi8qKlxuICogcmV2ZWFsIGEgY29sbGVjdGlvbiBvZiBpdGVtc1xuICogQHBhcmFtIHtBcnJheSBvZiBPdXRsYXllci5JdGVtc30gaXRlbXNcbiAqL1xucHJvdG8ucmV2ZWFsID0gZnVuY3Rpb24oIGl0ZW1zICkge1xuICB0aGlzLl9lbWl0Q29tcGxldGVPbkl0ZW1zKCAncmV2ZWFsJywgaXRlbXMgKTtcbiAgaWYgKCAhaXRlbXMgfHwgIWl0ZW1zLmxlbmd0aCApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaXRlbXMuZm9yRWFjaCggZnVuY3Rpb24oIGl0ZW0gKSB7XG4gICAgaXRlbS5yZXZlYWwoKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIGhpZGUgYSBjb2xsZWN0aW9uIG9mIGl0ZW1zXG4gKiBAcGFyYW0ge0FycmF5IG9mIE91dGxheWVyLkl0ZW1zfSBpdGVtc1xuICovXG5wcm90by5oaWRlID0gZnVuY3Rpb24oIGl0ZW1zICkge1xuICB0aGlzLl9lbWl0Q29tcGxldGVPbkl0ZW1zKCAnaGlkZScsIGl0ZW1zICk7XG4gIGlmICggIWl0ZW1zIHx8ICFpdGVtcy5sZW5ndGggKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGl0ZW1zLmZvckVhY2goIGZ1bmN0aW9uKCBpdGVtICkge1xuICAgIGl0ZW0uaGlkZSgpO1xuICB9KTtcbn07XG5cbi8qKlxuICogcmV2ZWFsIGl0ZW0gZWxlbWVudHNcbiAqIEBwYXJhbSB7QXJyYXl9LCB7RWxlbWVudH0sIHtOb2RlTGlzdH0gaXRlbXNcbiAqL1xucHJvdG8ucmV2ZWFsSXRlbUVsZW1lbnRzID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICB2YXIgaXRlbXMgPSB0aGlzLmdldEl0ZW1zKCBlbGVtcyApO1xuICB0aGlzLnJldmVhbCggaXRlbXMgKTtcbn07XG5cbi8qKlxuICogaGlkZSBpdGVtIGVsZW1lbnRzXG4gKiBAcGFyYW0ge0FycmF5fSwge0VsZW1lbnR9LCB7Tm9kZUxpc3R9IGl0ZW1zXG4gKi9cbnByb3RvLmhpZGVJdGVtRWxlbWVudHMgPSBmdW5jdGlvbiggZWxlbXMgKSB7XG4gIHZhciBpdGVtcyA9IHRoaXMuZ2V0SXRlbXMoIGVsZW1zICk7XG4gIHRoaXMuaGlkZSggaXRlbXMgKTtcbn07XG5cbi8qKlxuICogZ2V0IE91dGxheWVyLkl0ZW0sIGdpdmVuIGFuIEVsZW1lbnRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm5zIHtPdXRsYXllci5JdGVtfSBpdGVtXG4gKi9cbnByb3RvLmdldEl0ZW0gPSBmdW5jdGlvbiggZWxlbSApIHtcbiAgLy8gbG9vcCB0aHJvdWdoIGl0ZW1zIHRvIGdldCB0aGUgb25lIHRoYXQgbWF0Y2hlc1xuICBmb3IgKCB2YXIgaT0wOyBpIDwgdGhpcy5pdGVtcy5sZW5ndGg7IGkrKyApIHtcbiAgICB2YXIgaXRlbSA9IHRoaXMuaXRlbXNbaV07XG4gICAgaWYgKCBpdGVtLmVsZW1lbnQgPT0gZWxlbSApIHtcbiAgICAgIC8vIHJldHVybiBpdGVtXG4gICAgICByZXR1cm4gaXRlbTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogZ2V0IGNvbGxlY3Rpb24gb2YgT3V0bGF5ZXIuSXRlbXMsIGdpdmVuIEVsZW1lbnRzXG4gKiBAcGFyYW0ge0FycmF5fSBlbGVtc1xuICogQHJldHVybnMge0FycmF5fSBpdGVtcyAtIE91dGxheWVyLkl0ZW1zXG4gKi9cbnByb3RvLmdldEl0ZW1zID0gZnVuY3Rpb24oIGVsZW1zICkge1xuICBlbGVtcyA9IHV0aWxzLm1ha2VBcnJheSggZWxlbXMgKTtcbiAgdmFyIGl0ZW1zID0gW107XG4gIGVsZW1zLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtICkge1xuICAgIHZhciBpdGVtID0gdGhpcy5nZXRJdGVtKCBlbGVtICk7XG4gICAgaWYgKCBpdGVtICkge1xuICAgICAgaXRlbXMucHVzaCggaXRlbSApO1xuICAgIH1cbiAgfSwgdGhpcyApO1xuXG4gIHJldHVybiBpdGVtcztcbn07XG5cbi8qKlxuICogcmVtb3ZlIGVsZW1lbnQocykgZnJvbSBpbnN0YW5jZSBhbmQgRE9NXG4gKiBAcGFyYW0ge0FycmF5IG9yIE5vZGVMaXN0IG9yIEVsZW1lbnR9IGVsZW1zXG4gKi9cbnByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uKCBlbGVtcyApIHtcbiAgdmFyIHJlbW92ZUl0ZW1zID0gdGhpcy5nZXRJdGVtcyggZWxlbXMgKTtcblxuICB0aGlzLl9lbWl0Q29tcGxldGVPbkl0ZW1zKCAncmVtb3ZlJywgcmVtb3ZlSXRlbXMgKTtcblxuICAvLyBiYWlsIGlmIG5vIGl0ZW1zIHRvIHJlbW92ZVxuICBpZiAoICFyZW1vdmVJdGVtcyB8fCAhcmVtb3ZlSXRlbXMubGVuZ3RoICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHJlbW92ZUl0ZW1zLmZvckVhY2goIGZ1bmN0aW9uKCBpdGVtICkge1xuICAgIGl0ZW0ucmVtb3ZlKCk7XG4gICAgLy8gcmVtb3ZlIGl0ZW0gZnJvbSBjb2xsZWN0aW9uXG4gICAgdXRpbHMucmVtb3ZlRnJvbSggdGhpcy5pdGVtcywgaXRlbSApO1xuICB9LCB0aGlzICk7XG59O1xuXG4vLyAtLS0tLSBkZXN0cm95IC0tLS0tIC8vXG5cbi8vIHJlbW92ZSBhbmQgZGlzYWJsZSBPdXRsYXllciBpbnN0YW5jZVxucHJvdG8uZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAvLyBjbGVhbiB1cCBkeW5hbWljIHN0eWxlc1xuICB2YXIgc3R5bGUgPSB0aGlzLmVsZW1lbnQuc3R5bGU7XG4gIHN0eWxlLmhlaWdodCA9ICcnO1xuICBzdHlsZS5wb3NpdGlvbiA9ICcnO1xuICBzdHlsZS53aWR0aCA9ICcnO1xuICAvLyBkZXN0cm95IGl0ZW1zXG4gIHRoaXMuaXRlbXMuZm9yRWFjaCggZnVuY3Rpb24oIGl0ZW0gKSB7XG4gICAgaXRlbS5kZXN0cm95KCk7XG4gIH0pO1xuXG4gIHRoaXMudW5iaW5kUmVzaXplKCk7XG5cbiAgdmFyIGlkID0gdGhpcy5lbGVtZW50Lm91dGxheWVyR1VJRDtcbiAgZGVsZXRlIGluc3RhbmNlc1sgaWQgXTsgLy8gcmVtb3ZlIHJlZmVyZW5jZSB0byBpbnN0YW5jZSBieSBpZFxuICBkZWxldGUgdGhpcy5lbGVtZW50Lm91dGxheWVyR1VJRDtcbiAgLy8gcmVtb3ZlIGRhdGEgZm9yIGpRdWVyeVxuICBpZiAoIGpRdWVyeSApIHtcbiAgICBqUXVlcnkucmVtb3ZlRGF0YSggdGhpcy5lbGVtZW50LCB0aGlzLmNvbnN0cnVjdG9yLm5hbWVzcGFjZSApO1xuICB9XG5cbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRhdGEgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLyoqXG4gKiBnZXQgT3V0bGF5ZXIgaW5zdGFuY2UgZnJvbSBlbGVtZW50XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1cbiAqIEByZXR1cm5zIHtPdXRsYXllcn1cbiAqL1xuT3V0bGF5ZXIuZGF0YSA9IGZ1bmN0aW9uKCBlbGVtICkge1xuICBlbGVtID0gdXRpbHMuZ2V0UXVlcnlFbGVtZW50KCBlbGVtICk7XG4gIHZhciBpZCA9IGVsZW0gJiYgZWxlbS5vdXRsYXllckdVSUQ7XG4gIHJldHVybiBpZCAmJiBpbnN0YW5jZXNbIGlkIF07XG59O1xuXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGNyZWF0ZSBPdXRsYXllciBjbGFzcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vKipcbiAqIGNyZWF0ZSBhIGxheW91dCBjbGFzc1xuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICovXG5PdXRsYXllci5jcmVhdGUgPSBmdW5jdGlvbiggbmFtZXNwYWNlLCBvcHRpb25zICkge1xuICAvLyBzdWItY2xhc3MgT3V0bGF5ZXJcbiAgdmFyIExheW91dCA9IHN1YmNsYXNzKCBPdXRsYXllciApO1xuICAvLyBhcHBseSBuZXcgb3B0aW9ucyBhbmQgY29tcGF0T3B0aW9uc1xuICBMYXlvdXQuZGVmYXVsdHMgPSB1dGlscy5leHRlbmQoIHt9LCBPdXRsYXllci5kZWZhdWx0cyApO1xuICB1dGlscy5leHRlbmQoIExheW91dC5kZWZhdWx0cywgb3B0aW9ucyApO1xuICBMYXlvdXQuY29tcGF0T3B0aW9ucyA9IHV0aWxzLmV4dGVuZCgge30sIE91dGxheWVyLmNvbXBhdE9wdGlvbnMgICk7XG5cbiAgTGF5b3V0Lm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblxuICBMYXlvdXQuZGF0YSA9IE91dGxheWVyLmRhdGE7XG5cbiAgLy8gc3ViLWNsYXNzIEl0ZW1cbiAgTGF5b3V0Lkl0ZW0gPSBzdWJjbGFzcyggSXRlbSApO1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRlY2xhcmF0aXZlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgdXRpbHMuaHRtbEluaXQoIExheW91dCwgbmFtZXNwYWNlICk7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0galF1ZXJ5IGJyaWRnZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8vIG1ha2UgaW50byBqUXVlcnkgcGx1Z2luXG4gIGlmICggalF1ZXJ5ICYmIGpRdWVyeS5icmlkZ2V0ICkge1xuICAgIGpRdWVyeS5icmlkZ2V0KCBuYW1lc3BhY2UsIExheW91dCApO1xuICB9XG5cbiAgcmV0dXJuIExheW91dDtcbn07XG5cbmZ1bmN0aW9uIHN1YmNsYXNzKCBQYXJlbnQgKSB7XG4gIGZ1bmN0aW9uIFN1YkNsYXNzKCkge1xuICAgIFBhcmVudC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gIH1cblxuICBTdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBQYXJlbnQucHJvdG90eXBlICk7XG4gIFN1YkNsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFN1YkNsYXNzO1xuXG4gIHJldHVybiBTdWJDbGFzcztcbn1cblxuLy8gLS0tLS0gZmluIC0tLS0tIC8vXG5cbi8vIGJhY2sgaW4gZ2xvYmFsXG5PdXRsYXllci5JdGVtID0gSXRlbTtcblxucmV0dXJuIE91dGxheWVyO1xuXG59KSk7XG5cbi8qIVxuICogTWFzb25yeSB2NC4wLjBcbiAqIENhc2NhZGluZyBncmlkIGxheW91dCBsaWJyYXJ5XG4gKiBodHRwOi8vbWFzb25yeS5kZXNhbmRyby5jb21cbiAqIE1JVCBMaWNlbnNlXG4gKiBieSBEYXZpZCBEZVNhbmRyb1xuICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG4gIC8qIGpzaGludCBzdHJpY3Q6IGZhbHNlICovIC8qZ2xvYmFscyBkZWZpbmUsIG1vZHVsZSwgcmVxdWlyZSAqL1xuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgICAnb3V0bGF5ZXIvb3V0bGF5ZXInLFxuICAgICAgICAnZ2V0LXNpemUvZ2V0LXNpemUnXG4gICAgICBdLFxuICAgICAgZmFjdG9yeSApO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgcmVxdWlyZSgnb3V0bGF5ZXInKSxcbiAgICAgIHJlcXVpcmUoJ2dldC1zaXplJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93Lk1hc29ucnkgPSBmYWN0b3J5KFxuICAgICAgd2luZG93Lk91dGxheWVyLFxuICAgICAgd2luZG93LmdldFNpemVcbiAgICApO1xuICB9XG5cbn0oIHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSggT3V0bGF5ZXIsIGdldFNpemUgKSB7XG5cblxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtYXNvbnJ5RGVmaW5pdGlvbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8vIGNyZWF0ZSBhbiBPdXRsYXllciBsYXlvdXQgY2xhc3NcbiAgdmFyIE1hc29ucnkgPSBPdXRsYXllci5jcmVhdGUoJ21hc29ucnknKTtcbiAgLy8gaXNGaXRXaWR0aCAtPiBmaXRXaWR0aFxuICBNYXNvbnJ5LmNvbXBhdE9wdGlvbnMuZml0V2lkdGggPSAnaXNGaXRXaWR0aCc7XG5cbiAgTWFzb25yeS5wcm90b3R5cGUuX3Jlc2V0TGF5b3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5nZXRTaXplKCk7XG4gICAgdGhpcy5fZ2V0TWVhc3VyZW1lbnQoICdjb2x1bW5XaWR0aCcsICdvdXRlcldpZHRoJyApO1xuICAgIHRoaXMuX2dldE1lYXN1cmVtZW50KCAnZ3V0dGVyJywgJ291dGVyV2lkdGgnICk7XG4gICAgdGhpcy5tZWFzdXJlQ29sdW1ucygpO1xuXG4gICAgLy8gcmVzZXQgY29sdW1uIFlcbiAgICB0aGlzLmNvbFlzID0gW107XG4gICAgZm9yICggdmFyIGk9MDsgaSA8IHRoaXMuY29sczsgaSsrICkge1xuICAgICAgdGhpcy5jb2xZcy5wdXNoKCAwICk7XG4gICAgfVxuXG4gICAgdGhpcy5tYXhZID0gMDtcbiAgfTtcblxuICBNYXNvbnJ5LnByb3RvdHlwZS5tZWFzdXJlQ29sdW1ucyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZ2V0Q29udGFpbmVyV2lkdGgoKTtcbiAgICAvLyBpZiBjb2x1bW5XaWR0aCBpcyAwLCBkZWZhdWx0IHRvIG91dGVyV2lkdGggb2YgZmlyc3QgaXRlbVxuICAgIGlmICggIXRoaXMuY29sdW1uV2lkdGggKSB7XG4gICAgICB2YXIgZmlyc3RJdGVtID0gdGhpcy5pdGVtc1swXTtcbiAgICAgIHZhciBmaXJzdEl0ZW1FbGVtID0gZmlyc3RJdGVtICYmIGZpcnN0SXRlbS5lbGVtZW50O1xuICAgICAgLy8gY29sdW1uV2lkdGggZmFsbCBiYWNrIHRvIGl0ZW0gb2YgZmlyc3QgZWxlbWVudFxuICAgICAgdGhpcy5jb2x1bW5XaWR0aCA9IGZpcnN0SXRlbUVsZW0gJiYgZ2V0U2l6ZSggZmlyc3RJdGVtRWxlbSApLm91dGVyV2lkdGggfHxcbiAgICAgICAgLy8gaWYgZmlyc3QgZWxlbSBoYXMgbm8gd2lkdGgsIGRlZmF1bHQgdG8gc2l6ZSBvZiBjb250YWluZXJcbiAgICAgICAgdGhpcy5jb250YWluZXJXaWR0aDtcbiAgICB9XG5cbiAgICB2YXIgY29sdW1uV2lkdGggPSB0aGlzLmNvbHVtbldpZHRoICs9IHRoaXMuZ3V0dGVyO1xuXG4gICAgLy8gY2FsY3VsYXRlIGNvbHVtbnNcbiAgICB2YXIgY29udGFpbmVyV2lkdGggPSB0aGlzLmNvbnRhaW5lcldpZHRoICsgdGhpcy5ndXR0ZXI7XG4gICAgdmFyIGNvbHMgPSBjb250YWluZXJXaWR0aCAvIGNvbHVtbldpZHRoO1xuICAgIC8vIGZpeCByb3VuZGluZyBlcnJvcnMsIHR5cGljYWxseSB3aXRoIGd1dHRlcnNcbiAgICB2YXIgZXhjZXNzID0gY29sdW1uV2lkdGggLSBjb250YWluZXJXaWR0aCAlIGNvbHVtbldpZHRoO1xuICAgIC8vIGlmIG92ZXJzaG9vdCBpcyBsZXNzIHRoYW4gYSBwaXhlbCwgcm91bmQgdXAsIG90aGVyd2lzZSBmbG9vciBpdFxuICAgIHZhciBtYXRoTWV0aG9kID0gZXhjZXNzICYmIGV4Y2VzcyA8IDEgPyAncm91bmQnIDogJ2Zsb29yJztcbiAgICBjb2xzID0gTWF0aFsgbWF0aE1ldGhvZCBdKCBjb2xzICk7XG4gICAgdGhpcy5jb2xzID0gTWF0aC5tYXgoIGNvbHMsIDEgKTtcbiAgfTtcblxuICBNYXNvbnJ5LnByb3RvdHlwZS5nZXRDb250YWluZXJXaWR0aCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGNvbnRhaW5lciBpcyBwYXJlbnQgaWYgZml0IHdpZHRoXG4gICAgdmFyIGlzRml0V2lkdGggPSB0aGlzLl9nZXRPcHRpb24oJ2ZpdFdpZHRoJyk7XG4gICAgdmFyIGNvbnRhaW5lciA9IGlzRml0V2lkdGggPyB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSA6IHRoaXMuZWxlbWVudDtcbiAgICAvLyBjaGVjayB0aGF0IHRoaXMuc2l6ZSBhbmQgc2l6ZSBhcmUgdGhlcmVcbiAgICAvLyBJRTggdHJpZ2dlcnMgcmVzaXplIG9uIGJvZHkgc2l6ZSBjaGFuZ2UsIHNvIHRoZXkgbWlnaHQgbm90IGJlXG4gICAgdmFyIHNpemUgPSBnZXRTaXplKCBjb250YWluZXIgKTtcbiAgICB0aGlzLmNvbnRhaW5lcldpZHRoID0gc2l6ZSAmJiBzaXplLmlubmVyV2lkdGg7XG4gIH07XG5cbiAgTWFzb25yeS5wcm90b3R5cGUuX2dldEl0ZW1MYXlvdXRQb3NpdGlvbiA9IGZ1bmN0aW9uKCBpdGVtICkge1xuICAgIGl0ZW0uZ2V0U2l6ZSgpO1xuICAgIC8vIGhvdyBtYW55IGNvbHVtbnMgZG9lcyB0aGlzIGJyaWNrIHNwYW5cbiAgICB2YXIgcmVtYWluZGVyID0gaXRlbS5zaXplLm91dGVyV2lkdGggJSB0aGlzLmNvbHVtbldpZHRoO1xuICAgIHZhciBtYXRoTWV0aG9kID0gcmVtYWluZGVyICYmIHJlbWFpbmRlciA8IDEgPyAncm91bmQnIDogJ2NlaWwnO1xuICAgIC8vIHJvdW5kIGlmIG9mZiBieSAxIHBpeGVsLCBvdGhlcndpc2UgdXNlIGNlaWxcbiAgICB2YXIgY29sU3BhbiA9IE1hdGhbIG1hdGhNZXRob2QgXSggaXRlbS5zaXplLm91dGVyV2lkdGggLyB0aGlzLmNvbHVtbldpZHRoICk7XG4gICAgY29sU3BhbiA9IE1hdGgubWluKCBjb2xTcGFuLCB0aGlzLmNvbHMgKTtcblxuICAgIHZhciBjb2xHcm91cCA9IHRoaXMuX2dldENvbEdyb3VwKCBjb2xTcGFuICk7XG4gICAgLy8gZ2V0IHRoZSBtaW5pbXVtIFkgdmFsdWUgZnJvbSB0aGUgY29sdW1uc1xuICAgIHZhciBtaW5pbXVtWSA9IE1hdGgubWluLmFwcGx5KCBNYXRoLCBjb2xHcm91cCApO1xuICAgIHZhciBzaG9ydENvbEluZGV4ID0gY29sR3JvdXAuaW5kZXhPZiggbWluaW11bVkgKTtcblxuICAgIC8vIHBvc2l0aW9uIHRoZSBicmlja1xuICAgIHZhciBwb3NpdGlvbiA9IHtcbiAgICAgIHg6IHRoaXMuY29sdW1uV2lkdGggKiBzaG9ydENvbEluZGV4LFxuICAgICAgeTogbWluaW11bVlcbiAgICB9O1xuXG4gICAgLy8gYXBwbHkgc2V0SGVpZ2h0IHRvIG5lY2Vzc2FyeSBjb2x1bW5zXG4gICAgdmFyIHNldEhlaWdodCA9IG1pbmltdW1ZICsgaXRlbS5zaXplLm91dGVySGVpZ2h0O1xuICAgIHZhciBzZXRTcGFuID0gdGhpcy5jb2xzICsgMSAtIGNvbEdyb3VwLmxlbmd0aDtcbiAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBzZXRTcGFuOyBpKysgKSB7XG4gICAgICB0aGlzLmNvbFlzWyBzaG9ydENvbEluZGV4ICsgaSBdID0gc2V0SGVpZ2h0O1xuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbjtcbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGNvbFNwYW4gLSBudW1iZXIgb2YgY29sdW1ucyB0aGUgZWxlbWVudCBzcGFuc1xuICAgKiBAcmV0dXJucyB7QXJyYXl9IGNvbEdyb3VwXG4gICAqL1xuICBNYXNvbnJ5LnByb3RvdHlwZS5fZ2V0Q29sR3JvdXAgPSBmdW5jdGlvbiggY29sU3BhbiApIHtcbiAgICBpZiAoIGNvbFNwYW4gPCAyICkge1xuICAgICAgLy8gaWYgYnJpY2sgc3BhbnMgb25seSBvbmUgY29sdW1uLCB1c2UgYWxsIHRoZSBjb2x1bW4gWXNcbiAgICAgIHJldHVybiB0aGlzLmNvbFlzO1xuICAgIH1cblxuICAgIHZhciBjb2xHcm91cCA9IFtdO1xuICAgIC8vIGhvdyBtYW55IGRpZmZlcmVudCBwbGFjZXMgY291bGQgdGhpcyBicmljayBmaXQgaG9yaXpvbnRhbGx5XG4gICAgdmFyIGdyb3VwQ291bnQgPSB0aGlzLmNvbHMgKyAxIC0gY29sU3BhbjtcbiAgICAvLyBmb3IgZWFjaCBncm91cCBwb3RlbnRpYWwgaG9yaXpvbnRhbCBwb3NpdGlvblxuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGdyb3VwQ291bnQ7IGkrKyApIHtcbiAgICAgIC8vIG1ha2UgYW4gYXJyYXkgb2YgY29sWSB2YWx1ZXMgZm9yIHRoYXQgb25lIGdyb3VwXG4gICAgICB2YXIgZ3JvdXBDb2xZcyA9IHRoaXMuY29sWXMuc2xpY2UoIGksIGkgKyBjb2xTcGFuICk7XG4gICAgICAvLyBhbmQgZ2V0IHRoZSBtYXggdmFsdWUgb2YgdGhlIGFycmF5XG4gICAgICBjb2xHcm91cFtpXSA9IE1hdGgubWF4LmFwcGx5KCBNYXRoLCBncm91cENvbFlzICk7XG4gICAgfVxuICAgIHJldHVybiBjb2xHcm91cDtcbiAgfTtcblxuICBNYXNvbnJ5LnByb3RvdHlwZS5fbWFuYWdlU3RhbXAgPSBmdW5jdGlvbiggc3RhbXAgKSB7XG4gICAgdmFyIHN0YW1wU2l6ZSA9IGdldFNpemUoIHN0YW1wICk7XG4gICAgdmFyIG9mZnNldCA9IHRoaXMuX2dldEVsZW1lbnRPZmZzZXQoIHN0YW1wICk7XG4gICAgLy8gZ2V0IHRoZSBjb2x1bW5zIHRoYXQgdGhpcyBzdGFtcCBhZmZlY3RzXG4gICAgdmFyIGlzT3JpZ2luTGVmdCA9IHRoaXMuX2dldE9wdGlvbignb3JpZ2luTGVmdCcpO1xuICAgIHZhciBmaXJzdFggPSBpc09yaWdpbkxlZnQgPyBvZmZzZXQubGVmdCA6IG9mZnNldC5yaWdodDtcbiAgICB2YXIgbGFzdFggPSBmaXJzdFggKyBzdGFtcFNpemUub3V0ZXJXaWR0aDtcbiAgICB2YXIgZmlyc3RDb2wgPSBNYXRoLmZsb29yKCBmaXJzdFggLyB0aGlzLmNvbHVtbldpZHRoICk7XG4gICAgZmlyc3RDb2wgPSBNYXRoLm1heCggMCwgZmlyc3RDb2wgKTtcbiAgICB2YXIgbGFzdENvbCA9IE1hdGguZmxvb3IoIGxhc3RYIC8gdGhpcy5jb2x1bW5XaWR0aCApO1xuICAgIC8vIGxhc3RDb2wgc2hvdWxkIG5vdCBnbyBvdmVyIGlmIG11bHRpcGxlIG9mIGNvbHVtbldpZHRoICM0MjVcbiAgICBsYXN0Q29sIC09IGxhc3RYICUgdGhpcy5jb2x1bW5XaWR0aCA/IDAgOiAxO1xuICAgIGxhc3RDb2wgPSBNYXRoLm1pbiggdGhpcy5jb2xzIC0gMSwgbGFzdENvbCApO1xuICAgIC8vIHNldCBjb2xZcyB0byBib3R0b20gb2YgdGhlIHN0YW1wXG5cbiAgICB2YXIgaXNPcmlnaW5Ub3AgPSB0aGlzLl9nZXRPcHRpb24oJ29yaWdpblRvcCcpO1xuICAgIHZhciBzdGFtcE1heFkgPSAoIGlzT3JpZ2luVG9wID8gb2Zmc2V0LnRvcCA6IG9mZnNldC5ib3R0b20gKSArXG4gICAgICBzdGFtcFNpemUub3V0ZXJIZWlnaHQ7XG4gICAgZm9yICggdmFyIGkgPSBmaXJzdENvbDsgaSA8PSBsYXN0Q29sOyBpKysgKSB7XG4gICAgICB0aGlzLmNvbFlzW2ldID0gTWF0aC5tYXgoIHN0YW1wTWF4WSwgdGhpcy5jb2xZc1tpXSApO1xuICAgIH1cbiAgfTtcblxuICBNYXNvbnJ5LnByb3RvdHlwZS5fZ2V0Q29udGFpbmVyU2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubWF4WSA9IE1hdGgubWF4LmFwcGx5KCBNYXRoLCB0aGlzLmNvbFlzICk7XG4gICAgdmFyIHNpemUgPSB7XG4gICAgICBoZWlnaHQ6IHRoaXMubWF4WVxuICAgIH07XG5cbiAgICBpZiAoIHRoaXMuX2dldE9wdGlvbignZml0V2lkdGgnKSApIHtcbiAgICAgIHNpemUud2lkdGggPSB0aGlzLl9nZXRDb250YWluZXJGaXRXaWR0aCgpO1xuICAgIH1cblxuICAgIHJldHVybiBzaXplO1xuICB9O1xuXG4gIE1hc29ucnkucHJvdG90eXBlLl9nZXRDb250YWluZXJGaXRXaWR0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB1bnVzZWRDb2xzID0gMDtcbiAgICAvLyBjb3VudCB1bnVzZWQgY29sdW1uc1xuICAgIHZhciBpID0gdGhpcy5jb2xzO1xuICAgIHdoaWxlICggLS1pICkge1xuICAgICAgaWYgKCB0aGlzLmNvbFlzW2ldICE9PSAwICkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHVudXNlZENvbHMrKztcbiAgICB9XG4gICAgLy8gZml0IGNvbnRhaW5lciB0byBjb2x1bW5zIHRoYXQgaGF2ZSBiZWVuIHVzZWRcbiAgICByZXR1cm4gKCB0aGlzLmNvbHMgLSB1bnVzZWRDb2xzICkgKiB0aGlzLmNvbHVtbldpZHRoIC0gdGhpcy5ndXR0ZXI7XG4gIH07XG5cbiAgTWFzb25yeS5wcm90b3R5cGUubmVlZHNSZXNpemVMYXlvdXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcHJldmlvdXNXaWR0aCA9IHRoaXMuY29udGFpbmVyV2lkdGg7XG4gICAgdGhpcy5nZXRDb250YWluZXJXaWR0aCgpO1xuICAgIHJldHVybiBwcmV2aW91c1dpZHRoICE9IHRoaXMuY29udGFpbmVyV2lkdGg7XG4gIH07XG5cbiAgcmV0dXJuIE1hc29ucnk7XG5cbn0pKTtcblxuIiwiLyohXG4gKiBpbWFnZXNMb2FkZWQgUEFDS0FHRUQgdjQuMS4wXG4gKiBKYXZhU2NyaXB0IGlzIGFsbCBsaWtlIFwiWW91IGltYWdlcyBhcmUgZG9uZSB5ZXQgb3Igd2hhdD9cIlxuICogTUlUIExpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEV2RW1pdHRlciB2MS4wLjFcbiAqIExpbCcgZXZlbnQgZW1pdHRlclxuICogTUlUIExpY2Vuc2VcbiAqL1xuXG4vKiBqc2hpbnQgdW51c2VkOiB0cnVlLCB1bmRlZjogdHJ1ZSwgc3RyaWN0OiB0cnVlICovXG5cbiggZnVuY3Rpb24oIGdsb2JhbCwgZmFjdG9yeSApIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG4gIC8qIGpzaGludCBzdHJpY3Q6IGZhbHNlICovIC8qIGdsb2JhbHMgZGVmaW5lLCBtb2R1bGUgKi9cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTUQgLSBSZXF1aXJlSlNcbiAgICBkZWZpbmUoICdldi1lbWl0dGVyL2V2LWVtaXR0ZXInLGZhY3RvcnkgKTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyApIHtcbiAgICAvLyBDb21tb25KUyAtIEJyb3dzZXJpZnksIFdlYnBhY2tcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBCcm93c2VyIGdsb2JhbHNcbiAgICBnbG9iYWwuRXZFbWl0dGVyID0gZmFjdG9yeSgpO1xuICB9XG5cbn0oIHRoaXMsIGZ1bmN0aW9uKCkge1xuXG5cblxuZnVuY3Rpb24gRXZFbWl0dGVyKCkge31cblxudmFyIHByb3RvID0gRXZFbWl0dGVyLnByb3RvdHlwZTtcblxucHJvdG8ub24gPSBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApIHtcbiAgaWYgKCAhZXZlbnROYW1lIHx8ICFsaXN0ZW5lciApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gc2V0IGV2ZW50cyBoYXNoXG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIC8vIHNldCBsaXN0ZW5lcnMgYXJyYXlcbiAgdmFyIGxpc3RlbmVycyA9IGV2ZW50c1sgZXZlbnROYW1lIF0gPSBldmVudHNbIGV2ZW50TmFtZSBdIHx8IFtdO1xuICAvLyBvbmx5IGFkZCBvbmNlXG4gIGlmICggbGlzdGVuZXJzLmluZGV4T2YoIGxpc3RlbmVyICkgPT0gLTEgKSB7XG4gICAgbGlzdGVuZXJzLnB1c2goIGxpc3RlbmVyICk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLm9uY2UgPSBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApIHtcbiAgaWYgKCAhZXZlbnROYW1lIHx8ICFsaXN0ZW5lciApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gYWRkIGV2ZW50XG4gIHRoaXMub24oIGV2ZW50TmFtZSwgbGlzdGVuZXIgKTtcbiAgLy8gc2V0IG9uY2UgZmxhZ1xuICAvLyBzZXQgb25jZUV2ZW50cyBoYXNoXG4gIHZhciBvbmNlRXZlbnRzID0gdGhpcy5fb25jZUV2ZW50cyA9IHRoaXMuX29uY2VFdmVudHMgfHwge307XG4gIC8vIHNldCBvbmNlTGlzdGVuZXJzIGFycmF5XG4gIHZhciBvbmNlTGlzdGVuZXJzID0gb25jZUV2ZW50c1sgZXZlbnROYW1lIF0gPSBvbmNlRXZlbnRzWyBldmVudE5hbWUgXSB8fCBbXTtcbiAgLy8gc2V0IGZsYWdcbiAgb25jZUxpc3RlbmVyc1sgbGlzdGVuZXIgXSA9IHRydWU7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wcm90by5vZmYgPSBmdW5jdGlvbiggZXZlbnROYW1lLCBsaXN0ZW5lciApIHtcbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbIGV2ZW50TmFtZSBdO1xuICBpZiAoICFsaXN0ZW5lcnMgfHwgIWxpc3RlbmVycy5sZW5ndGggKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBpbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKCBsaXN0ZW5lciApO1xuICBpZiAoIGluZGV4ICE9IC0xICkge1xuICAgIGxpc3RlbmVycy5zcGxpY2UoIGluZGV4LCAxICk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbnByb3RvLmVtaXRFdmVudCA9IGZ1bmN0aW9uKCBldmVudE5hbWUsIGFyZ3MgKSB7XG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzWyBldmVudE5hbWUgXTtcbiAgaWYgKCAhbGlzdGVuZXJzIHx8ICFsaXN0ZW5lcnMubGVuZ3RoICkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgaSA9IDA7XG4gIHZhciBsaXN0ZW5lciA9IGxpc3RlbmVyc1tpXTtcbiAgYXJncyA9IGFyZ3MgfHwgW107XG4gIC8vIG9uY2Ugc3R1ZmZcbiAgdmFyIG9uY2VMaXN0ZW5lcnMgPSB0aGlzLl9vbmNlRXZlbnRzICYmIHRoaXMuX29uY2VFdmVudHNbIGV2ZW50TmFtZSBdO1xuXG4gIHdoaWxlICggbGlzdGVuZXIgKSB7XG4gICAgdmFyIGlzT25jZSA9IG9uY2VMaXN0ZW5lcnMgJiYgb25jZUxpc3RlbmVyc1sgbGlzdGVuZXIgXTtcbiAgICBpZiAoIGlzT25jZSApIHtcbiAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lclxuICAgICAgLy8gcmVtb3ZlIGJlZm9yZSB0cmlnZ2VyIHRvIHByZXZlbnQgcmVjdXJzaW9uXG4gICAgICB0aGlzLm9mZiggZXZlbnROYW1lLCBsaXN0ZW5lciApO1xuICAgICAgLy8gdW5zZXQgb25jZSBmbGFnXG4gICAgICBkZWxldGUgb25jZUxpc3RlbmVyc1sgbGlzdGVuZXIgXTtcbiAgICB9XG4gICAgLy8gdHJpZ2dlciBsaXN0ZW5lclxuICAgIGxpc3RlbmVyLmFwcGx5KCB0aGlzLCBhcmdzICk7XG4gICAgLy8gZ2V0IG5leHQgbGlzdGVuZXJcbiAgICBpICs9IGlzT25jZSA/IDAgOiAxO1xuICAgIGxpc3RlbmVyID0gbGlzdGVuZXJzW2ldO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5yZXR1cm4gRXZFbWl0dGVyO1xuXG59KSk7XG5cbi8qIVxuICogaW1hZ2VzTG9hZGVkIHY0LjEuMFxuICogSmF2YVNjcmlwdCBpcyBhbGwgbGlrZSBcIllvdSBpbWFnZXMgYXJlIGRvbmUgeWV0IG9yIHdoYXQ/XCJcbiAqIE1JVCBMaWNlbnNlXG4gKi9cblxuKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkgeyAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIHJlcXVpcmU6IGZhbHNlICovXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICdldi1lbWl0dGVyL2V2LWVtaXR0ZXInXG4gICAgXSwgZnVuY3Rpb24oIEV2RW1pdHRlciApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIEV2RW1pdHRlciApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgcmVxdWlyZSgnZXYtZW1pdHRlcicpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5pbWFnZXNMb2FkZWQgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgd2luZG93LkV2RW1pdHRlclxuICAgICk7XG4gIH1cblxufSkoIHdpbmRvdyxcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIGZhY3RvcnkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBFdkVtaXR0ZXIgKSB7XG5cblxuXG52YXIgJCA9IHdpbmRvdy5qUXVlcnk7XG52YXIgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoZWxwZXJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8vIGV4dGVuZCBvYmplY3RzXG5mdW5jdGlvbiBleHRlbmQoIGEsIGIgKSB7XG4gIGZvciAoIHZhciBwcm9wIGluIGIgKSB7XG4gICAgYVsgcHJvcCBdID0gYlsgcHJvcCBdO1xuICB9XG4gIHJldHVybiBhO1xufVxuXG4vLyB0dXJuIGVsZW1lbnQgb3Igbm9kZUxpc3QgaW50byBhbiBhcnJheVxuZnVuY3Rpb24gbWFrZUFycmF5KCBvYmogKSB7XG4gIHZhciBhcnkgPSBbXTtcbiAgaWYgKCBBcnJheS5pc0FycmF5KCBvYmogKSApIHtcbiAgICAvLyB1c2Ugb2JqZWN0IGlmIGFscmVhZHkgYW4gYXJyYXlcbiAgICBhcnkgPSBvYmo7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBvYmoubGVuZ3RoID09ICdudW1iZXInICkge1xuICAgIC8vIGNvbnZlcnQgbm9kZUxpc3QgdG8gYXJyYXlcbiAgICBmb3IgKCB2YXIgaT0wOyBpIDwgb2JqLmxlbmd0aDsgaSsrICkge1xuICAgICAgYXJ5LnB1c2goIG9ialtpXSApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBhcnJheSBvZiBzaW5nbGUgaW5kZXhcbiAgICBhcnkucHVzaCggb2JqICk7XG4gIH1cbiAgcmV0dXJuIGFyeTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaW1hZ2VzTG9hZGVkIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8qKlxuICogQHBhcmFtIHtBcnJheSwgRWxlbWVudCwgTm9kZUxpc3QsIFN0cmluZ30gZWxlbVxuICogQHBhcmFtIHtPYmplY3Qgb3IgRnVuY3Rpb259IG9wdGlvbnMgLSBpZiBmdW5jdGlvbiwgdXNlIGFzIGNhbGxiYWNrXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvbkFsd2F5cyAtIGNhbGxiYWNrIGZ1bmN0aW9uXG4gKi9cbmZ1bmN0aW9uIEltYWdlc0xvYWRlZCggZWxlbSwgb3B0aW9ucywgb25BbHdheXMgKSB7XG4gIC8vIGNvZXJjZSBJbWFnZXNMb2FkZWQoKSB3aXRob3V0IG5ldywgdG8gYmUgbmV3IEltYWdlc0xvYWRlZCgpXG4gIGlmICggISggdGhpcyBpbnN0YW5jZW9mIEltYWdlc0xvYWRlZCApICkge1xuICAgIHJldHVybiBuZXcgSW1hZ2VzTG9hZGVkKCBlbGVtLCBvcHRpb25zLCBvbkFsd2F5cyApO1xuICB9XG4gIC8vIHVzZSBlbGVtIGFzIHNlbGVjdG9yIHN0cmluZ1xuICBpZiAoIHR5cGVvZiBlbGVtID09ICdzdHJpbmcnICkge1xuICAgIGVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBlbGVtICk7XG4gIH1cblxuICB0aGlzLmVsZW1lbnRzID0gbWFrZUFycmF5KCBlbGVtICk7XG4gIHRoaXMub3B0aW9ucyA9IGV4dGVuZCgge30sIHRoaXMub3B0aW9ucyApO1xuXG4gIGlmICggdHlwZW9mIG9wdGlvbnMgPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICBvbkFsd2F5cyA9IG9wdGlvbnM7XG4gIH0gZWxzZSB7XG4gICAgZXh0ZW5kKCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMgKTtcbiAgfVxuXG4gIGlmICggb25BbHdheXMgKSB7XG4gICAgdGhpcy5vbiggJ2Fsd2F5cycsIG9uQWx3YXlzICk7XG4gIH1cblxuICB0aGlzLmdldEltYWdlcygpO1xuXG4gIGlmICggJCApIHtcbiAgICAvLyBhZGQgalF1ZXJ5IERlZmVycmVkIG9iamVjdFxuICAgIHRoaXMuanFEZWZlcnJlZCA9IG5ldyAkLkRlZmVycmVkKCk7XG4gIH1cblxuICAvLyBIQUNLIGNoZWNrIGFzeW5jIHRvIGFsbG93IHRpbWUgdG8gYmluZCBsaXN0ZW5lcnNcbiAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jaGVjaygpO1xuICB9LmJpbmQoIHRoaXMgKSk7XG59XG5cbkltYWdlc0xvYWRlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBFdkVtaXR0ZXIucHJvdG90eXBlICk7XG5cbkltYWdlc0xvYWRlZC5wcm90b3R5cGUub3B0aW9ucyA9IHt9O1xuXG5JbWFnZXNMb2FkZWQucHJvdG90eXBlLmdldEltYWdlcyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmltYWdlcyA9IFtdO1xuXG4gIC8vIGZpbHRlciAmIGZpbmQgaXRlbXMgaWYgd2UgaGF2ZSBhbiBpdGVtIHNlbGVjdG9yXG4gIHRoaXMuZWxlbWVudHMuZm9yRWFjaCggdGhpcy5hZGRFbGVtZW50SW1hZ2VzLCB0aGlzICk7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7Tm9kZX0gZWxlbWVudFxuICovXG5JbWFnZXNMb2FkZWQucHJvdG90eXBlLmFkZEVsZW1lbnRJbWFnZXMgPSBmdW5jdGlvbiggZWxlbSApIHtcbiAgLy8gZmlsdGVyIHNpYmxpbmdzXG4gIGlmICggZWxlbS5ub2RlTmFtZSA9PSAnSU1HJyApIHtcbiAgICB0aGlzLmFkZEltYWdlKCBlbGVtICk7XG4gIH1cbiAgLy8gZ2V0IGJhY2tncm91bmQgaW1hZ2Ugb24gZWxlbWVudFxuICBpZiAoIHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kID09PSB0cnVlICkge1xuICAgIHRoaXMuYWRkRWxlbWVudEJhY2tncm91bmRJbWFnZXMoIGVsZW0gKTtcbiAgfVxuXG4gIC8vIGZpbmQgY2hpbGRyZW5cbiAgLy8gbm8gbm9uLWVsZW1lbnQgbm9kZXMsICMxNDNcbiAgdmFyIG5vZGVUeXBlID0gZWxlbS5ub2RlVHlwZTtcbiAgaWYgKCAhbm9kZVR5cGUgfHwgIWVsZW1lbnROb2RlVHlwZXNbIG5vZGVUeXBlIF0gKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBjaGlsZEltZ3MgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xuICAvLyBjb25jYXQgY2hpbGRFbGVtcyB0byBmaWx0ZXJGb3VuZCBhcnJheVxuICBmb3IgKCB2YXIgaT0wOyBpIDwgY2hpbGRJbWdzLmxlbmd0aDsgaSsrICkge1xuICAgIHZhciBpbWcgPSBjaGlsZEltZ3NbaV07XG4gICAgdGhpcy5hZGRJbWFnZSggaW1nICk7XG4gIH1cblxuICAvLyBnZXQgY2hpbGQgYmFja2dyb3VuZCBpbWFnZXNcbiAgaWYgKCB0eXBlb2YgdGhpcy5vcHRpb25zLmJhY2tncm91bmQgPT0gJ3N0cmluZycgKSB7XG4gICAgdmFyIGNoaWxkcmVuID0gZWxlbS5xdWVyeVNlbGVjdG9yQWxsKCB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZCApO1xuICAgIGZvciAoIGk9MDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrICkge1xuICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICB0aGlzLmFkZEVsZW1lbnRCYWNrZ3JvdW5kSW1hZ2VzKCBjaGlsZCApO1xuICAgIH1cbiAgfVxufTtcblxudmFyIGVsZW1lbnROb2RlVHlwZXMgPSB7XG4gIDE6IHRydWUsXG4gIDk6IHRydWUsXG4gIDExOiB0cnVlXG59O1xuXG5JbWFnZXNMb2FkZWQucHJvdG90eXBlLmFkZEVsZW1lbnRCYWNrZ3JvdW5kSW1hZ2VzID0gZnVuY3Rpb24oIGVsZW0gKSB7XG4gIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoIGVsZW0gKTtcbiAgaWYgKCAhc3R5bGUgKSB7XG4gICAgLy8gRmlyZWZveCByZXR1cm5zIG51bGwgaWYgaW4gYSBoaWRkZW4gaWZyYW1lIGh0dHBzOi8vYnVnemlsLmxhLzU0ODM5N1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBnZXQgdXJsIGluc2lkZSB1cmwoXCIuLi5cIilcbiAgdmFyIHJlVVJMID0gL3VybFxcKChbJ1wiXSk/KC4qPylcXDFcXCkvZ2k7XG4gIHZhciBtYXRjaGVzID0gcmVVUkwuZXhlYyggc3R5bGUuYmFja2dyb3VuZEltYWdlICk7XG4gIHdoaWxlICggbWF0Y2hlcyAhPT0gbnVsbCApIHtcbiAgICB2YXIgdXJsID0gbWF0Y2hlcyAmJiBtYXRjaGVzWzJdO1xuICAgIGlmICggdXJsICkge1xuICAgICAgdGhpcy5hZGRCYWNrZ3JvdW5kKCB1cmwsIGVsZW0gKTtcbiAgICB9XG4gICAgbWF0Y2hlcyA9IHJlVVJMLmV4ZWMoIHN0eWxlLmJhY2tncm91bmRJbWFnZSApO1xuICB9XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7SW1hZ2V9IGltZ1xuICovXG5JbWFnZXNMb2FkZWQucHJvdG90eXBlLmFkZEltYWdlID0gZnVuY3Rpb24oIGltZyApIHtcbiAgdmFyIGxvYWRpbmdJbWFnZSA9IG5ldyBMb2FkaW5nSW1hZ2UoIGltZyApO1xuICB0aGlzLmltYWdlcy5wdXNoKCBsb2FkaW5nSW1hZ2UgKTtcbn07XG5cbkltYWdlc0xvYWRlZC5wcm90b3R5cGUuYWRkQmFja2dyb3VuZCA9IGZ1bmN0aW9uKCB1cmwsIGVsZW0gKSB7XG4gIHZhciBiYWNrZ3JvdW5kID0gbmV3IEJhY2tncm91bmQoIHVybCwgZWxlbSApO1xuICB0aGlzLmltYWdlcy5wdXNoKCBiYWNrZ3JvdW5kICk7XG59O1xuXG5JbWFnZXNMb2FkZWQucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24oKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHRoaXMucHJvZ3Jlc3NlZENvdW50ID0gMDtcbiAgdGhpcy5oYXNBbnlCcm9rZW4gPSBmYWxzZTtcbiAgLy8gY29tcGxldGUgaWYgbm8gaW1hZ2VzXG4gIGlmICggIXRoaXMuaW1hZ2VzLmxlbmd0aCApIHtcbiAgICB0aGlzLmNvbXBsZXRlKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Qcm9ncmVzcyggaW1hZ2UsIGVsZW0sIG1lc3NhZ2UgKSB7XG4gICAgLy8gSEFDSyAtIENocm9tZSB0cmlnZ2VycyBldmVudCBiZWZvcmUgb2JqZWN0IHByb3BlcnRpZXMgaGF2ZSBjaGFuZ2VkLiAjODNcbiAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLnByb2dyZXNzKCBpbWFnZSwgZWxlbSwgbWVzc2FnZSApO1xuICAgIH0pO1xuICB9XG5cbiAgdGhpcy5pbWFnZXMuZm9yRWFjaCggZnVuY3Rpb24oIGxvYWRpbmdJbWFnZSApIHtcbiAgICBsb2FkaW5nSW1hZ2Uub25jZSggJ3Byb2dyZXNzJywgb25Qcm9ncmVzcyApO1xuICAgIGxvYWRpbmdJbWFnZS5jaGVjaygpO1xuICB9KTtcbn07XG5cbkltYWdlc0xvYWRlZC5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiggaW1hZ2UsIGVsZW0sIG1lc3NhZ2UgKSB7XG4gIHRoaXMucHJvZ3Jlc3NlZENvdW50Kys7XG4gIHRoaXMuaGFzQW55QnJva2VuID0gdGhpcy5oYXNBbnlCcm9rZW4gfHwgIWltYWdlLmlzTG9hZGVkO1xuICAvLyBwcm9ncmVzcyBldmVudFxuICB0aGlzLmVtaXRFdmVudCggJ3Byb2dyZXNzJywgWyB0aGlzLCBpbWFnZSwgZWxlbSBdICk7XG4gIGlmICggdGhpcy5qcURlZmVycmVkICYmIHRoaXMuanFEZWZlcnJlZC5ub3RpZnkgKSB7XG4gICAgdGhpcy5qcURlZmVycmVkLm5vdGlmeSggdGhpcywgaW1hZ2UgKTtcbiAgfVxuICAvLyBjaGVjayBpZiBjb21wbGV0ZWRcbiAgaWYgKCB0aGlzLnByb2dyZXNzZWRDb3VudCA9PSB0aGlzLmltYWdlcy5sZW5ndGggKSB7XG4gICAgdGhpcy5jb21wbGV0ZSgpO1xuICB9XG5cbiAgaWYgKCB0aGlzLm9wdGlvbnMuZGVidWcgJiYgY29uc29sZSApIHtcbiAgICBjb25zb2xlLmxvZyggJ3Byb2dyZXNzOiAnICsgbWVzc2FnZSwgaW1hZ2UsIGVsZW0gKTtcbiAgfVxufTtcblxuSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZXZlbnROYW1lID0gdGhpcy5oYXNBbnlCcm9rZW4gPyAnZmFpbCcgOiAnZG9uZSc7XG4gIHRoaXMuaXNDb21wbGV0ZSA9IHRydWU7XG4gIHRoaXMuZW1pdEV2ZW50KCBldmVudE5hbWUsIFsgdGhpcyBdICk7XG4gIHRoaXMuZW1pdEV2ZW50KCAnYWx3YXlzJywgWyB0aGlzIF0gKTtcbiAgaWYgKCB0aGlzLmpxRGVmZXJyZWQgKSB7XG4gICAgdmFyIGpxTWV0aG9kID0gdGhpcy5oYXNBbnlCcm9rZW4gPyAncmVqZWN0JyA6ICdyZXNvbHZlJztcbiAgICB0aGlzLmpxRGVmZXJyZWRbIGpxTWV0aG9kIF0oIHRoaXMgKTtcbiAgfVxufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbmZ1bmN0aW9uIExvYWRpbmdJbWFnZSggaW1nICkge1xuICB0aGlzLmltZyA9IGltZztcbn1cblxuTG9hZGluZ0ltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEV2RW1pdHRlci5wcm90b3R5cGUgKTtcblxuTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICAvLyBJZiBjb21wbGV0ZSBpcyB0cnVlIGFuZCBicm93c2VyIHN1cHBvcnRzIG5hdHVyYWwgc2l6ZXMsXG4gIC8vIHRyeSB0byBjaGVjayBmb3IgaW1hZ2Ugc3RhdHVzIG1hbnVhbGx5LlxuICB2YXIgaXNDb21wbGV0ZSA9IHRoaXMuZ2V0SXNJbWFnZUNvbXBsZXRlKCk7XG4gIGlmICggaXNDb21wbGV0ZSApIHtcbiAgICAvLyByZXBvcnQgYmFzZWQgb24gbmF0dXJhbFdpZHRoXG4gICAgdGhpcy5jb25maXJtKCB0aGlzLmltZy5uYXR1cmFsV2lkdGggIT09IDAsICduYXR1cmFsV2lkdGgnICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSWYgbm9uZSBvZiB0aGUgY2hlY2tzIGFib3ZlIG1hdGNoZWQsIHNpbXVsYXRlIGxvYWRpbmcgb24gZGV0YWNoZWQgZWxlbWVudC5cbiAgdGhpcy5wcm94eUltYWdlID0gbmV3IEltYWdlKCk7XG4gIHRoaXMucHJveHlJbWFnZS5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIHRoaXMgKTtcbiAgdGhpcy5wcm94eUltYWdlLmFkZEV2ZW50TGlzdGVuZXIoICdlcnJvcicsIHRoaXMgKTtcbiAgLy8gYmluZCB0byBpbWFnZSBhcyB3ZWxsIGZvciBGaXJlZm94LiAjMTkxXG4gIHRoaXMuaW1nLmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgdGhpcyApO1xuICB0aGlzLmltZy5hZGRFdmVudExpc3RlbmVyKCAnZXJyb3InLCB0aGlzICk7XG4gIHRoaXMucHJveHlJbWFnZS5zcmMgPSB0aGlzLmltZy5zcmM7XG59O1xuXG5Mb2FkaW5nSW1hZ2UucHJvdG90eXBlLmdldElzSW1hZ2VDb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5pbWcuY29tcGxldGUgJiYgdGhpcy5pbWcubmF0dXJhbFdpZHRoICE9PSB1bmRlZmluZWQ7XG59O1xuXG5Mb2FkaW5nSW1hZ2UucHJvdG90eXBlLmNvbmZpcm0gPSBmdW5jdGlvbiggaXNMb2FkZWQsIG1lc3NhZ2UgKSB7XG4gIHRoaXMuaXNMb2FkZWQgPSBpc0xvYWRlZDtcbiAgdGhpcy5lbWl0RXZlbnQoICdwcm9ncmVzcycsIFsgdGhpcywgdGhpcy5pbWcsIG1lc3NhZ2UgXSApO1xufTtcblxuLy8gLS0tLS0gZXZlbnRzIC0tLS0tIC8vXG5cbi8vIHRyaWdnZXIgc3BlY2lmaWVkIGhhbmRsZXIgZm9yIGV2ZW50IHR5cGVcbkxvYWRpbmdJbWFnZS5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gIHZhciBtZXRob2QgPSAnb24nICsgZXZlbnQudHlwZTtcbiAgaWYgKCB0aGlzWyBtZXRob2QgXSApIHtcbiAgICB0aGlzWyBtZXRob2QgXSggZXZlbnQgKTtcbiAgfVxufTtcblxuTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jb25maXJtKCB0cnVlLCAnb25sb2FkJyApO1xuICB0aGlzLnVuYmluZEV2ZW50cygpO1xufTtcblxuTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuY29uZmlybSggZmFsc2UsICdvbmVycm9yJyApO1xuICB0aGlzLnVuYmluZEV2ZW50cygpO1xufTtcblxuTG9hZGluZ0ltYWdlLnByb3RvdHlwZS51bmJpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcm94eUltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdsb2FkJywgdGhpcyApO1xuICB0aGlzLnByb3h5SW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2Vycm9yJywgdGhpcyApO1xuICB0aGlzLmltZy5yZW1vdmVFdmVudExpc3RlbmVyKCAnbG9hZCcsIHRoaXMgKTtcbiAgdGhpcy5pbWcucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2Vycm9yJywgdGhpcyApO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQmFja2dyb3VuZCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5mdW5jdGlvbiBCYWNrZ3JvdW5kKCB1cmwsIGVsZW1lbnQgKSB7XG4gIHRoaXMudXJsID0gdXJsO1xuICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICB0aGlzLmltZyA9IG5ldyBJbWFnZSgpO1xufVxuXG4vLyBpbmhlcml0IExvYWRpbmdJbWFnZSBwcm90b3R5cGVcbkJhY2tncm91bmQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggTG9hZGluZ0ltYWdlLnByb3RvdHlwZSApO1xuXG5CYWNrZ3JvdW5kLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmltZy5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIHRoaXMgKTtcbiAgdGhpcy5pbWcuYWRkRXZlbnRMaXN0ZW5lciggJ2Vycm9yJywgdGhpcyApO1xuICB0aGlzLmltZy5zcmMgPSB0aGlzLnVybDtcbiAgLy8gY2hlY2sgaWYgaW1hZ2UgaXMgYWxyZWFkeSBjb21wbGV0ZVxuICB2YXIgaXNDb21wbGV0ZSA9IHRoaXMuZ2V0SXNJbWFnZUNvbXBsZXRlKCk7XG4gIGlmICggaXNDb21wbGV0ZSApIHtcbiAgICB0aGlzLmNvbmZpcm0oIHRoaXMuaW1nLm5hdHVyYWxXaWR0aCAhPT0gMCwgJ25hdHVyYWxXaWR0aCcgKTtcbiAgICB0aGlzLnVuYmluZEV2ZW50cygpO1xuICB9XG59O1xuXG5CYWNrZ3JvdW5kLnByb3RvdHlwZS51bmJpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5pbWcucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ2xvYWQnLCB0aGlzICk7XG4gIHRoaXMuaW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoICdlcnJvcicsIHRoaXMgKTtcbn07XG5cbkJhY2tncm91bmQucHJvdG90eXBlLmNvbmZpcm0gPSBmdW5jdGlvbiggaXNMb2FkZWQsIG1lc3NhZ2UgKSB7XG4gIHRoaXMuaXNMb2FkZWQgPSBpc0xvYWRlZDtcbiAgdGhpcy5lbWl0RXZlbnQoICdwcm9ncmVzcycsIFsgdGhpcywgdGhpcy5lbGVtZW50LCBtZXNzYWdlIF0gKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGpRdWVyeSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5JbWFnZXNMb2FkZWQubWFrZUpRdWVyeVBsdWdpbiA9IGZ1bmN0aW9uKCBqUXVlcnkgKSB7XG4gIGpRdWVyeSA9IGpRdWVyeSB8fCB3aW5kb3cualF1ZXJ5O1xuICBpZiAoICFqUXVlcnkgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIHNldCBsb2NhbCB2YXJpYWJsZVxuICAkID0galF1ZXJ5O1xuICAvLyAkKCkuaW1hZ2VzTG9hZGVkKClcbiAgJC5mbi5pbWFnZXNMb2FkZWQgPSBmdW5jdGlvbiggb3B0aW9ucywgY2FsbGJhY2sgKSB7XG4gICAgdmFyIGluc3RhbmNlID0gbmV3IEltYWdlc0xvYWRlZCggdGhpcywgb3B0aW9ucywgY2FsbGJhY2sgKTtcbiAgICByZXR1cm4gaW5zdGFuY2UuanFEZWZlcnJlZC5wcm9taXNlKCAkKHRoaXMpICk7XG4gIH07XG59O1xuLy8gdHJ5IG1ha2luZyBwbHVnaW5cbkltYWdlc0xvYWRlZC5tYWtlSlF1ZXJ5UGx1Z2luKCk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5yZXR1cm4gSW1hZ2VzTG9hZGVkO1xuXG59KTtcblxuIiwialF1ZXJ5KCAnaWZyYW1lW3NyYyo9XCJ5b3V0dWJlLmNvbVwiXScpLndyYXAoXCI8ZGl2IGNsYXNzPSdmbGV4LXZpZGVvIHdpZGVzY3JlZW4nLz5cIik7XG5qUXVlcnkoICdpZnJhbWVbc3JjKj1cInZpbWVvLmNvbVwiXScpLndyYXAoXCI8ZGl2IGNsYXNzPSdmbGV4LXZpZGVvIHdpZGVzY3JlZW4gdmltZW8nLz5cIik7XG4iLCIiLCJqUXVlcnkoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcbiIsIi8vIEpveXJpZGUgZGVtb1xuJCgnI3N0YXJ0LWpyJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oJ2pveXJpZGUnLCdzdGFydCcpO1xufSk7IiwiIiwiXG4kKHdpbmRvdykuYmluZCgnIGxvYWQgcmVzaXplIG9yaWVudGF0aW9uQ2hhbmdlICcsIGZ1bmN0aW9uICgpIHtcbiAgIHZhciBmb290ZXIgPSAkKFwiI2Zvb3Rlci1jb250YWluZXJcIik7XG4gICB2YXIgcG9zID0gZm9vdGVyLnBvc2l0aW9uKCk7XG4gICB2YXIgaGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpO1xuICAgaGVpZ2h0ID0gaGVpZ2h0IC0gcG9zLnRvcDtcbiAgIGhlaWdodCA9IGhlaWdodCAtIGZvb3Rlci5oZWlnaHQoKSAtMTtcblxuICAgZnVuY3Rpb24gc3RpY2t5Rm9vdGVyKCkge1xuICAgICBmb290ZXIuY3NzKHtcbiAgICAgICAgICdtYXJnaW4tdG9wJzogaGVpZ2h0ICsgJ3B4J1xuICAgICB9KTtcbiAgIH1cblxuICAgaWYgKGhlaWdodCA+IDApIHtcbiAgICAgc3RpY2t5Rm9vdGVyKCk7XG4gICB9XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
