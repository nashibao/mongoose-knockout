// Generated by CoffeeScript 1.6.3
var Cursor, Model, co, oa, oo, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

_ = require('lodash');

oo = ko.observable;

oa = ko.observableArray;

co = ko.computed;

Cursor = (function() {
  function Cursor(model, func_name, query, cb) {
    this.head = __bind(this.head, this);
    this.tail = __bind(this.tail, this);
    this.update = __bind(this.update, this);
    var _this = this;
    this.model = model;
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
    this.status = oo('none');
    this.cb = cb;
    this.has_previous = co(function() {
      if (_this.page() > 0) {
        return true;
      }
      return false;
    });
    this.has_next = co(function() {
      if (_this.page() + 1 < _this.page_length()) {
        return true;
      }
      return false;
    });
    this.more = false;
  }

  Cursor.prototype.update = function(options) {
    if (options == null) {
      options = {};
    }
    if (this.status() === "loading") {
      return;
    }
    return this.model[this.func_name](this.query, options, this.cb, this);
  };

  Cursor.prototype.tail = function() {
    if (this.query.page == null) {
      this.query.page = 0;
    }
    this.query.page += 1;
    this.more = 2;
    return this.update({
      more: this.more
    });
  };

  Cursor.prototype.head = function() {
    this.more = 1;
    return this.update({
      more: this.more,
      page: 0
    });
  };

  return Cursor;

})();

Model = (function() {
  Model.prototype.cursor_update = function(data) {
    var cursor, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _results;
    if (data == null) {
      data = {};
    }
    if (data.method === 'notified') {
      if (this.notified) {
        this.notified(data);
      }
      _ref = this.cursors;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cursor = _ref[_i];
        if (cursor.notified) {
          cursor.notified(data);
        }
      }
      return;
    }
    if (data.method === 'update') {
      _ref1 = this.cursors;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        cursor = _ref1[_j];
        if (cursor.func_name === 'findOne' || cursor.func_name === 'find') {
          if (data.doc._id in cursor._docs) {
            if (this.pre) {
              this.pre(data.doc);
            }
            this.remap(cursor._docs[data.doc._id], data.doc);
          }
        } else {
          cursor.update();
        }
      }
      return;
    }
    _ref2 = this.cursors;
    _results = [];
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      cursor = _ref2[_k];
      _results.push(cursor.update());
    }
    return _results;
  };

  Model.prototype.remap = function(doc, data) {
    var key, _results;
    _results = [];
    for (key in data) {
      if (_.isFunction(doc[key])) {
        _results.push(doc[key](data[key]));
      } else {
        _results.push(doc[key] = data[key]);
      }
    }
    return _results;
  };

  function Model(options) {
    this.aggregate = __bind(this.aggregate, this);
    this.count = __bind(this.count, this);
    this.find = __bind(this.find, this);
    this.findOne = __bind(this.findOne, this);
    this.remove = __bind(this.remove, this);
    this.update = __bind(this.update, this);
    this.create = __bind(this.create, this);
    this._debug_error = __bind(this._debug_error, this);
    this.validate = __bind(this.validate, this);
    this.remap = __bind(this.remap, this);
    this.cursor_update = __bind(this.cursor_update, this);
    var _this = this;
    this.name_space = options.name_space;
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
    this.map = options.map || false;
    this.pre = options.pre || false;
    this.post = options.post || false;
    this._map = function(node) {
      if (_this.pre) {
        _this.pre(node);
      }
      if (_this.map) {
        node = _this.map(node);
      }
      if (_this.post) {
        _this.post(node);
      }
      return node;
    };
    this.notified = options.notified || false;
    this.network_count = oo(0);
    this.network_status = co(function() {
      if (_this.network_count() === 0) {
        return "none";
      }
      return "loading";
    });
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
    this.network_count(this.network_count() - 1);
    this.last_err(err);
    if (err) {
      console.log(err);
      return this.errors.push(err);
    }
  };

  Model.prototype.create = function(query, temp_options, cb) {
    var _this = this;
    if (!this.validate(query.doc)) {
      if (cb) {
        cb(this.last_validate_err());
      }
      return false;
    }
    this.network_count(this.network_count() + 1);
    this.adapter.create(query, function(err) {
      if (cb) {
        cb(err);
      }
      return _this._debug_error(err);
    });
    return true;
  };

  Model.prototype.update = function(query, temp_options, cb) {
    var _this = this;
    if (query.update) {
      delete query.update["_id"];
    }
    this.network_count(this.network_count() + 1);
    return this.adapter.update(query, function(err) {
      if (cb) {
        cb(err);
      }
      return _this._debug_error(err);
    });
  };

  Model.prototype.remove = function(query, temp_options, cb) {
    var _this = this;
    this.network_count(this.network_count() + 1);
    return this.adapter.remove(query, function(err) {
      if (cb) {
        cb(err);
      }
      return _this._debug_error(err);
    });
  };

  Model.prototype.findOne = function(query, temp_options, cb, cursor) {
    var conditions, fields, options,
      _this = this;
    conditions = query.conditions;
    fields = query.fields;
    options = query.options;
    if (cursor == null) {
      cursor = new Cursor(this, 'findOne', query, cb);
      this.cursors.push(cursor);
    }
    cursor.status('loading');
    this.network_count(this.network_count() + 1);
    this.adapter.findOne(query, function(err, doc) {
      doc = _this._map(doc);
      cursor.last_err = err;
      if (err) {
        cursor.errors.push(err);
      }
      cursor._docs[doc['_id']] = doc;
      cursor.val(doc);
      cursor.status('loaded');
      if (cb) {
        cb(err, doc);
      }
      return _this._debug_error(err, doc);
    });
    return cursor;
  };

  Model.prototype.find = function(query, temp_options, cb, cursor) {
    var conditions, fields, more, options, page,
      _this = this;
    temp_options = temp_options || {};
    conditions = query.conditions;
    fields = query.fields;
    options = query.options;
    page = query.page;
    if (temp_options.page != null) {
      page = temp_options.page;
    }
    more = temp_options.more || false;
    if (cursor == null) {
      cursor = new Cursor(this, 'find', query, cb);
      this.cursors.push(cursor);
    }
    cursor.status('loading');
    this.network_count(this.network_count() + 1);
    this.adapter.find(query, function(err, docs, options) {
      var already, doc, _i, _len;
      docs = _.map(docs, _this._map);
      cursor.last_err = err;
      if (err) {
        cursor.errors.push(err);
      }
      if (docs != null) {
        if (!more) {
          _this._docs = {};
          cursor._docs = {};
        }
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          doc = docs[_i];
          already = false;
          if (doc["_id"] in _this._docs) {
            already = true;
          }
          _this._docs[doc["_id"]] = doc;
          cursor._docs[doc["_id"]] = doc;
          if (more) {
            if (!already) {
              switch (more) {
                case 1:
                  cursor.docs.unshift(doc);
                  break;
                case 2:
                  cursor.docs.push(doc);
              }
            }
          }
        }
        if (!more) {
          cursor.docs(docs);
        }
        cursor.page(options.page);
        cursor.page_length(options.page_length);
        cursor.limit(options.limit);
        cursor.count(options.count);
      }
      cursor.status('loaded');
      if (cb) {
        cb(err, docs);
      }
      return _this._debug_error(err, docs);
    });
    return cursor;
  };

  Model.prototype.count = function(query, temp_options, cb, cursor) {
    var conditions,
      _this = this;
    conditions = query.conditions;
    if (cursor == null) {
      cursor = new Cursor(this, 'count', query, cb);
      this.cursors.push(cursor);
    }
    cursor.status('loading');
    this.network_count(this.network_count() + 1);
    this.adapter.count(query, function(err, count) {
      cursor.last_err = err;
      if (err) {
        cursor.errors.push(err);
      }
      cursor.val(count);
      cursor.status('loaded');
      if (cb) {
        cb(err, count);
      }
      return _this._debug_error(err, count);
    });
    return cursor;
  };

  Model.prototype.aggregate = function(query, temp_options, cb, cursor) {
    var array,
      _this = this;
    array = query.array;
    if (cursor == null) {
      cursor = new Cursor(this, 'aggregate', query, cb);
      this.cursors.push(cursor);
    }
    cursor.status('loading');
    this.network_count(this.network_count() + 1);
    this.adapter.aggregate(query, function(err, docs) {
      var doc, _i, _len;
      cursor.last_err = err;
      if (err) {
        cursor.errors.push(err);
      }
      if (docs != null) {
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          doc = docs[_i];
          _this._docs[doc["_id"]] = doc;
          cursor._docs[doc["_id"]] = doc;
        }
        cursor.docs(docs);
        if (docs.length > 0) {
          cursor.val(docs[0]);
        } else {
          cursor.val(false);
        }
      }
      cursor.status('loaded');
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
