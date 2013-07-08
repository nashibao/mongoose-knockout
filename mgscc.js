;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("ForbesLindesay-ajax/index.js", function(exports, require, module){
var type = require('type');

var jsonpID = 0,
    document = window.document,
    key,
    name,
    rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    scriptTypeRE = /^(?:text|application)\/javascript/i,
    xmlTypeRE = /^(?:text|application)\/xml/i,
    jsonType = 'application/json',
    htmlType = 'text/html',
    blankRE = /^\s*$/

var ajax = module.exports = function(options){
  var settings = extend({}, options || {})
  for (key in ajax.settings) if (settings[key] === undefined) settings[key] = ajax.settings[key]

  ajaxStart(settings)

  if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
    RegExp.$2 != window.location.host

  var dataType = settings.dataType, hasPlaceholder = /=\?/.test(settings.url)
  if (dataType == 'jsonp' || hasPlaceholder) {
    if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')
    return ajax.JSONP(settings)
  }

  if (!settings.url) settings.url = window.location.toString()
  serializeData(settings)

  var mime = settings.accepts[dataType],
      baseHeaders = { },
      protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
      xhr = ajax.settings.xhr(), abortTimeout

  if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
  if (mime) {
    baseHeaders['Accept'] = mime
    if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
    xhr.overrideMimeType && xhr.overrideMimeType(mime)
  }
  if (settings.contentType || (settings.data && settings.type.toUpperCase() != 'GET'))
    baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')
  settings.headers = extend(baseHeaders, settings.headers || {})

  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4) {
      clearTimeout(abortTimeout)
      var result, error = false
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
        dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
        result = xhr.responseText

        try {
          if (dataType == 'script')    (1,eval)(result)
          else if (dataType == 'xml')  result = xhr.responseXML
          else if (dataType == 'json') result = blankRE.test(result) ? null : JSON.parse(result)
        } catch (e) { error = e }

        if (error) ajaxError(error, 'parsererror', xhr, settings)
        else ajaxSuccess(result, xhr, settings)
      } else {
        ajaxError(null, 'error', xhr, settings)
      }
    }
  }

  var async = 'async' in settings ? settings.async : true
  xhr.open(settings.type, settings.url, async)

  for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])

  if (ajaxBeforeSend(xhr, settings) === false) {
    xhr.abort()
    return false
  }

  if (settings.timeout > 0) abortTimeout = setTimeout(function(){
      xhr.onreadystatechange = empty
      xhr.abort()
      ajaxError(null, 'timeout', xhr, settings)
    }, settings.timeout)

  // avoid sending empty string (#319)
  xhr.send(settings.data ? settings.data : null)
  return xhr
}


// trigger a custom event and return false if it was cancelled
function triggerAndReturn(context, eventName, data) {
  //todo: Fire off some events
  //var event = $.Event(eventName)
  //$(context).trigger(event, data)
  return true;//!event.defaultPrevented
}

// trigger an Ajax "global" event
function triggerGlobal(settings, context, eventName, data) {
  if (settings.global) return triggerAndReturn(context || document, eventName, data)
}

// Number of active Ajax requests
ajax.active = 0

function ajaxStart(settings) {
  if (settings.global && ajax.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
}
function ajaxStop(settings) {
  if (settings.global && !(--ajax.active)) triggerGlobal(settings, null, 'ajaxStop')
}

// triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
function ajaxBeforeSend(xhr, settings) {
  var context = settings.context
  if (settings.beforeSend.call(context, xhr, settings) === false ||
      triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
    return false

  triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
}
function ajaxSuccess(data, xhr, settings) {
  var context = settings.context, status = 'success'
  settings.success.call(context, data, status, xhr)
  triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
  ajaxComplete(status, xhr, settings)
}
// type: "timeout", "error", "abort", "parsererror"
function ajaxError(error, type, xhr, settings) {
  var context = settings.context
  settings.error.call(context, xhr, type, error)
  triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])
  ajaxComplete(type, xhr, settings)
}
// status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
function ajaxComplete(status, xhr, settings) {
  var context = settings.context
  settings.complete.call(context, xhr, status)
  triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
  ajaxStop(settings)
}

// Empty function, used as default callback
function empty() {}

ajax.JSONP = function(options){
  if (!('type' in options)) return ajax(options)

  var callbackName = 'jsonp' + (++jsonpID),
    script = document.createElement('script'),
    abort = function(){
      //todo: remove script
      //$(script).remove()
      if (callbackName in window) window[callbackName] = empty
      ajaxComplete('abort', xhr, options)
    },
    xhr = { abort: abort }, abortTimeout

  if (options.error) script.onerror = function() {
    xhr.abort()
    options.error()
  }

  window[callbackName] = function(data){
    clearTimeout(abortTimeout)
      //todo: remove script
      //$(script).remove()
    delete window[callbackName]
    ajaxSuccess(data, xhr, options)
  }

  serializeData(options)
  script.src = options.url.replace(/=\?/, '=' + callbackName)
  //tood: append to head
  //$('head').append(script)

  if (options.timeout > 0) abortTimeout = setTimeout(function(){
      xhr.abort()
      ajaxComplete('timeout', xhr, options)
    }, options.timeout)

  return xhr
}

ajax.settings = {
  // Default type of request
  type: 'GET',
  // Callback that is executed before request
  beforeSend: empty,
  // Callback that is executed if the request succeeds
  success: empty,
  // Callback that is executed the the server drops error
  error: empty,
  // Callback that is executed on request complete (both: error and success)
  complete: empty,
  // The context for the callbacks
  context: null,
  // Whether to trigger "global" Ajax events
  global: true,
  // Transport
  xhr: function () {
    return new window.XMLHttpRequest()
  },
  // MIME types mapping
  accepts: {
    script: 'text/javascript, application/javascript',
    json:   jsonType,
    xml:    'application/xml, text/xml',
    html:   htmlType,
    text:   'text/plain'
  },
  // Whether the request is to another domain
  crossDomain: false,
  // Default timeout
  timeout: 0
}

function mimeToDataType(mime) {
  return mime && ( mime == htmlType ? 'html' :
    mime == jsonType ? 'json' :
    scriptTypeRE.test(mime) ? 'script' :
    xmlTypeRE.test(mime) && 'xml' ) || 'text'
}

function appendQuery(url, query) {
  return (url + '&' + query).replace(/[&?]{1,2}/, '?')
}

// serialize payload and append it to the URL for GET requests
function serializeData(options) {
  if (type(options.data) === 'object') options.data = param(options.data)
  if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
    options.url = appendQuery(options.url, options.data)
}

ajax.get = function(url, success){ return ajax({ url: url, success: success }) }

ajax.post = function(url, data, success, dataType){
  if (type(data) === 'function') dataType = dataType || success, success = data, data = null
  return ajax({ type: 'POST', url: url, data: data, success: success, dataType: dataType })
}

ajax.getJSON = function(url, success){
  return ajax({ url: url, success: success, dataType: 'json' })
}

var escape = encodeURIComponent

function serialize(params, obj, traditional, scope){
  var array = type(obj) === 'array';
  for (var key in obj) {
    var value = obj[key];

    if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
    // handle data in serializeArray() format
    if (!scope && array) params.add(value.name, value.value)
    // recurse into nested objects
    else if (traditional ? (type(value) === 'array') : (type(value) === 'object'))
      serialize(params, value, traditional, key)
    else params.add(key, value)
  }
}

function param(obj, traditional){
  var params = []
  params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
  serialize(params, obj, traditional)
  return params.join('&').replace('%20', '+')
}

function extend(target) {
  var slice = Array.prototype.slice;
  slice.call(arguments, 1).forEach(function(source) {
    for (key in source)
      if (source[key] !== undefined)
        target[key] = source[key]
  })
  return target
}
});
require.register("component-json/index.js", function(exports, require, module){

module.exports = 'undefined' == typeof JSON
  ? require('component-json-fallback')
  : JSON;

});
require.register("mongoose-socket-client/adapter/socket.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
var SocketAdapter,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

SocketAdapter = (function() {
  SocketAdapter.create_socket = function(name_space, io) {
    var socket;
    socket = io.connect('/socket_api_' + name_space);
    return socket;
  };

  function SocketAdapter(options) {
    this.aggregate = __bind(this.aggregate, this);
    this.count = __bind(this.count, this);
    this.find = __bind(this.find, this);
    this.remove = __bind(this.remove, this);
    this.update = __bind(this.update, this);
    this.create = __bind(this.create, this);
    this.initialize = __bind(this.initialize, this);
    this._end_point = __bind(this._end_point, this);    this.socket = options.socket ? options.socket : SocketAdapter.create_socket('', io);
    this.collection_name = options.collection_name;
    this.cursor_update = void 0;
  }

  SocketAdapter.prototype._end_point = function(name) {
    return this.collection_name + " " + name;
  };

  SocketAdapter.prototype.initialize = function() {
    var _this = this;
    this.socket.on('connect', function() {
      return console.log('-- connected --', _this.name_space);
    });
    return this.socket.on(this._end_point('update'), function(data) {
      return _this.cursor_update();
    });
  };

  SocketAdapter.prototype.create = function(query, cb) {
    return this.socket.emit(this._end_point('create'), query, cb);
  };

  SocketAdapter.prototype.update = function(query, cb) {
    return this.socket.emit(this._end_point('update'), query, cb);
  };

  SocketAdapter.prototype.remove = function(query, cb) {
    return this.socket.emit(this._end_point('remove'), query, cb);
  };

  SocketAdapter.prototype.find = function(query, cb) {
    return this.socket.emit(this._end_point('find'), query, cb);
  };

  SocketAdapter.prototype.count = function(query, cb) {
    return this.socket.emit(this._end_point('count'), query, cb);
  };

  SocketAdapter.prototype.aggregate = function(query, cb) {
    return this.socket.emit(this._end_point('aggregate'), query, cb);
  };

  return SocketAdapter;

}).call(this);

module.exports = SocketAdapter;

});
require.register("mongoose-socket-client/adapter/rest.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
var RestAdapter, ajax, json,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ajax = require('ajax');

json = require('json');

RestAdapter = (function() {
  function RestAdapter(options) {
    this.aggregate = __bind(this.aggregate, this);
    this.count = __bind(this.count, this);
    this.find = __bind(this.find, this);
    this.remove = __bind(this.remove, this);
    this.update = __bind(this.update, this);
    this.create = __bind(this.create, this);
    this._end_point = __bind(this._end_point, this);
    this.initialize = __bind(this.initialize, this);    this.collection_name = options ? options.collection_name : void 0;
    this.cursor_update = void 0;
  }

  RestAdapter.prototype.initialize = function() {};

  RestAdapter.prototype._end_point = function(name) {
    return '/api/' + this.collection_name + '/' + name;
  };

  RestAdapter.prototype.create = function(query, cb) {
    var q,
      _this = this;
    q = json.stringify(query);
    return ajax({
      url: this._end_point('create'),
      type: 'POST',
      dataType: 'json',
      data: {
        query: q
      },
      success: function(data, textStatus, jqXHR) {
        cb(data.err);
        return _this.cursor_update();
      }
    });
  };

  RestAdapter.prototype.update = function(query, cb) {
    var q,
      _this = this;
    q = json.stringify(query);
    return ajax({
      url: this._end_point('update'),
      type: 'PUT',
      dataType: 'json',
      data: {
        query: q
      },
      success: function(data, textStatus, jqXHR) {
        cb(data.err);
        return _this.cursor_update();
      }
    });
  };

  RestAdapter.prototype.remove = function(query, cb) {
    var q,
      _this = this;
    q = json.stringify(query);
    return ajax({
      url: this._end_point('remove'),
      type: 'DELETE',
      dataType: 'json',
      data: {
        query: q
      },
      success: function(data, textStatus, jqXHR) {
        cb(data.err);
        return _this.cursor_update();
      }
    });
  };

  RestAdapter.prototype.find = function(query, cb) {
    var q,
      _this = this;
    q = json.stringify(query);
    return ajax({
      url: this._end_point('find'),
      type: 'GET',
      dataType: 'json',
      data: {
        query: q
      },
      success: function(data, textStatus, jqXHR) {
        return cb(data.err, data.docs, data.options);
      }
    });
  };

  RestAdapter.prototype.count = function(query, cb) {
    var q,
      _this = this;
    q = json.stringify(query);
    return ajax({
      url: this._end_point('count'),
      type: 'GET',
      dataType: 'json',
      data: {
        query: q
      },
      success: function(data, textStatus, jqXHR) {
        return cb(data.err, data.count);
      }
    });
  };

  RestAdapter.prototype.aggregate = function(query, cb) {
    var q,
      _this = this;
    q = json.stringify(query);
    return ajax({
      url: this._end_point('aggregate'),
      type: 'GET',
      dataType: 'json',
      data: {
        query: q
      },
      success: function(data, textStatus, jqXHR) {
        return cb(data.err, data.docs, data.options);
      }
    });
  };

  return RestAdapter;

})();

module.exports = RestAdapter;

});
require.register("mongoose-socket-client/adapter/index.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
exports.socket = require('./socket');

exports.rest = require('./rest');

});
require.register("mongoose-socket-client/index.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
var Cursor, Model, co, oa, oo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

oo = ko.observable;

oa = ko.observableArray;

co = ko.computed;

Cursor = (function() {
  function Cursor(api, func_name, query, cb) {
    this.update = __bind(this.update, this);
    var _this = this;
    this.api = api;
    this.func_name = func_name;
    this.query = query;
    this.val = oo(false);
    this.docs = oa([]);
    this._docs = {};
    this.last_err = oo(false);
    this.errors = oa([]);
    this.page = oo(0);
    this.page_length = oo(0);
    this.limit = oo(0);
    this.count = oo(0);
    this.pages = co(function() {
      var _i, _ref, _results;
      if (_this.page_length() > 0) {
        return (function() {
          _results = [];
          for (var _i = 0, _ref = _this.page_length() - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
      }
      return [];
    });
    this.cb = cb;
  }

  Cursor.prototype.update = function() {
    return this.api[this.func_name](this.query, this.cb, this);
  };

  return Cursor;

})();

Model = (function() {
  Model.prototype.cursor_update = function() {
    var cursor, _i, _len, _ref, _results;
    console.log('cursor_update');
    _ref = this.cursors;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cursor = _ref[_i];
      _results.push(cursor.update());
    }
    return _results;
  };

  function Model(options) {
    this.aggregate = __bind(this.aggregate, this);
    this.count = __bind(this.count, this);
    this.find = __bind(this.find, this);
    this.remove = __bind(this.remove, this);
    this.update = __bind(this.update, this);
    this.create = __bind(this.create, this);
    this._debug_error = __bind(this._debug_error, this);
    this.validate = __bind(this.validate, this);
    this.cursor_update = __bind(this.cursor_update, this);    this.name_space = options.name_space;
    this.collection_name = options.collection_name;
    this.model = options.model;
    this.adapter = options.adapter ? options.adapter : new SocketAdapter();
    this.adapter.collection_name = options.collection_name;
    this.adapter.cursor_update = this.cursor_update;
    this.adapter.initialize();
    this._docs = {};
    this.cursors = [];
    this.last_err = oo(false);
    this.errors = oa([]);
    this.last_validate_err = oo(false);
    this.validate_errors = oa([]);
  }

  Model.prototype.validate = function(doc) {
    var atrs, data, key, msg, valid, _i, _len, _ref,
      _this = this;
    for (key in this.model) {
      atrs = this.model[key];
      if (atrs.required) {
        if (doc[key] == null) {
          msg = 'required field: ' + key;
          this.validate_errors.push(msg);
          this.last_validate_err(msg);
          return false;
        }
      }
      if (atrs.validate) {
        _ref = atrs.validate;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          valid = _ref[_i];
          data = false;
          valid.validator(doc[key], function(d) {
            return data = d;
          });
          if (!data) {
            this.validate_errors.push(valid.msg);
            this.last_validate_err(valid.msg);
            return false;
          }
        }
      }
    }
    this.last_validate_err(false);
    return true;
  };

  Model.prototype._debug_error = function(err, options) {
    this.last_err(err);
    if (err) {
      console.log(err);
      return this.errors.push(err);
    } else {
      console.log('success');
      if (options) {
        return console.log(options);
      }
    }
  };

  Model.prototype.create = function(query, cb) {
    var _this = this;
    if (!this.validate(query.doc)) {
      if (cb) {
        cb(this.last_validate_err());
      }
      return false;
    }
    this.adapter.create(query, function(err) {
      if (cb) {
        cb(err);
      }
      return _this._debug_error(err);
    });
    return true;
  };

  Model.prototype.update = function(query, cb) {
    var _this = this;
    if (query.update) {
      delete query.update["_id"];
    }
    return this.adapter.update(query, function(err) {
      if (cb) {
        cb(err);
      }
      return _this._debug_error(err);
    });
  };

  Model.prototype.remove = function(query, cb) {
    var _this = this;
    return this.adapter.remove(query, function(err) {
      if (cb) {
        cb(err);
      }
      return _this._debug_error(err);
    });
  };

  Model.prototype.find = function(query, cb, cursor) {
    var conditions, fields, options, page,
      _this = this;
    conditions = query.conditions;
    fields = query.fields;
    options = query.options;
    page = query.page;
    if (cursor == null) {
      cursor = new Cursor(this, 'find', query, cb);
      this.cursors.push(cursor);
    }
    this.adapter.find(query, function(err, docs, options) {
      var doc, _i, _len;
      console.log('find', docs, err);
      cursor.last_err = err;
      if (err) {
        cursor.err.push(err);
      }
      cursor.docs(docs);
      cursor.page(options.page);
      cursor.page_length(options.page_length);
      cursor.limit(options.limit);
      cursor.count(options.count);
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        _this._docs[doc["_id"]] = doc;
        cursor._docs[doc["_id"]] = doc;
      }
      if (cb) {
        cb(err, docs);
      }
      return _this._debug_error(err, docs);
    });
    return cursor;
  };

  Model.prototype.count = function(query, cb, cursor) {
    var conditions,
      _this = this;
    conditions = query.conditions;
    if (cursor == null) {
      cursor = new Cursor(this, 'count', query, cb);
      this.cursors.push(cursor);
    }
    this.adapter.count(query, function(err, count) {
      cursor.last_err = err;
      if (err) {
        cursor.err.push(err);
      }
      cursor.val(count);
      if (cb) {
        cb(err, count);
      }
      return _this._debug_error(err, count);
    });
    return cursor;
  };

  Model.prototype.aggregate = function(query, cb, cursor) {
    var array,
      _this = this;
    array = query.array;
    if (cursor == null) {
      cursor = new Cursor(this, 'aggregate', query, cb);
      this.cursors.push(cursor);
    }
    this.adapter.aggregate(query, function(err, docs) {
      var doc, _i, _len;
      cursor.last_err = err;
      if (err) {
        cursor.err.push(err);
      }
      cursor.docs(docs);
      if (docs.length > 0) {
        cursor.val(docs[0]);
      } else {
        cursor.val(false);
      }
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        _this._docs[doc["_id"]] = doc;
        cursor._docs[doc["_id"]] = doc;
      }
      if (cb) {
        cb(err, docs);
      }
      return _this._debug_error(err, docs);
    });
    return cursor;
  };

  return Model;

})();

exports.adapter = require('./adapter');

exports.Cursor = Cursor;

exports.Model = Model;

});
require.alias("ForbesLindesay-ajax/index.js", "mongoose-socket-client/deps/ajax/index.js");
require.alias("ForbesLindesay-ajax/index.js", "ajax/index.js");
require.alias("component-type/index.js", "ForbesLindesay-ajax/deps/type/index.js");

require.alias("component-json/index.js", "mongoose-socket-client/deps/json/index.js");
require.alias("component-json/index.js", "json/index.js");

require.alias("mongoose-socket-client/index.js", "mongoose-socket-client/index.js");

if (typeof exports == "object") {
  module.exports = require("mongoose-socket-client");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("mongoose-socket-client"); });
} else {
  this["mgscc"] = require("mongoose-socket-client");
}})();