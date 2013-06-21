// Generated by CoffeeScript 1.6.2
var Cursor, Model, oa, oo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

require('knockout');

oo = ko.observable;

oa = ko.observableArray;

Cursor = (function() {
  function Cursor(api, func_name, query, cb) {
    this.update = __bind(this.update, this);    this.api = api;
    this.func_name = func_name;
    this.query = query;
    this.val = oo(false);
    this.docs = oa([]);
    this._docs = {};
    this.last_err = oo(false);
    this.errors = oa([]);
    this.cb = cb;
  }

  Cursor.prototype.update = function() {
    return this.api[this.func_name](this.query, this.cb, this);
  };

  return Cursor;

})();

Model = (function() {
  Model.create_socket = function(name_space, io) {
    var socket;
    socket = io.connect('/socket_api_' + name_space);
    return socket;
  };

  function Model(name_space, collection_name, model, socket) {
    this.count = __bind(this.count, this);
    this.find = __bind(this.find, this);
    this.remove = __bind(this.remove, this);
    this.update = __bind(this.update, this);
    this.create = __bind(this.create, this);
    this.debug_error = __bind(this.debug_error, this);
    this.event = __bind(this.event, this);
    this.validate = __bind(this.validate, this);
    var _this = this;
    this.name_space = name_space;
    this.collection_name = collection_name;
    this.model = model;
    this.socket = socket;
    this.socket.on('connect', function() {
      return console.log('-- connected --', _this.name_space);
    });
    this.socket.on(this.event('update'), function(data) {
      var cursor, _i, _len, _ref, _results;
      _ref = _this.cursors;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cursor = _ref[_i];
        _results.push(cursor.update());
      }
      return _results;
    });
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
        if (!doc[key]) {
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

  Model.prototype.event = function(name) {
    return this.collection_name + " " + name;
  };

  Model.prototype.debug_error = function(err, options) {
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

  Model.prototype.create = function(doc, cb) {
    var _this = this;
    if (!this.validate(doc)) {
      if (cb) {
        cb(this.last_validate_err());
      }
      return false;
    }
    this.socket.emit(this.event('create'), {
      doc: doc
    }, function(err) {
      if (cb) {
        cb(err);
      }
      return _this.debug_error(err);
    });
    return true;
  };

  Model.prototype.update = function(conditions, update, options, cb) {
    var _this = this;
    delete update["_id"];
    return this.socket.emit(this.event('update'), {
      conditions: conditions,
      update: update,
      options: options
    }, function(err) {
      if (cb) {
        cb(err);
      }
      return _this.debug_error(err);
    });
  };

  Model.prototype.remove = function(conditions, cb) {
    var _this = this;
    return this.socket.emit(this.event('remove'), {
      conditions: conditions
    }, function(err) {
      if (cb) {
        cb(err);
      }
      return _this.debug_error(err);
    });
  };

  Model.prototype.find = function(query, cb, cursor) {
    var conditions, fields, options,
      _this = this;
    conditions = query.conditions;
    fields = query.fields;
    options = query.options;
    if (cursor == null) {
      cursor = new Cursor(this, 'find', query, cb);
      this.cursors.push(cursor);
    }
    this.socket.emit(this.event('find'), {
      conditions: conditions,
      fields: fields,
      options: options
    }, function(err, docs) {
      var doc, _i, _len;
      console.log('find', docs, err);
      cursor.last_err = err;
      if (err) {
        cursor.err.push(err);
      }
      cursor.docs(docs);
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        _this._docs[doc["_id"]] = doc;
        cursor._docs[doc["_id"]] = doc;
      }
      if (cb) {
        cb(err, docs);
      }
      return _this.debug_error(err, docs);
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
    this.socket.emit(this.event('count'), {
      conditions: conditions
    }, function(err, count) {
      cursor.last_err = err;
      if (err) {
        cursor.err.push(err);
      }
      cursor.val(count);
      if (cb) {
        cb(err, count);
      }
      return _this.debug_error(err, count);
    });
    return cursor;
  };

  return Model;

}).call(this);

exports.Model = Model;
