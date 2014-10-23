// Generated by CoffeeScript 1.8.0
var Emitter, SocketAdapter, _disconnect_num, _socket_emitter, _sockets,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Emitter = require('emitter');

_sockets = {};

_disconnect_num = 0;

_socket_emitter = {};

Emitter(_socket_emitter);

SocketAdapter = (function() {
  SocketAdapter.on = function(cb) {
    return _socket_emitter.on(cb);
  };

  SocketAdapter.create_socket = function(name_space, io) {
    var name, socket;
    name = '/socket_api_' + name_space;
    if (name in _sockets) {
      return _sockets[name];
    }
    socket = io.connect(name);
    _sockets[name] = socket;
    socket.on('connect', function() {
      console.log('-- connected --', name_space);
      if (_disconnect_num > 0) {
        _disconnect_num -= 1;
        if (_disconnect_num === 0) {
          console.log('reconnect');
          return _socket_emitter.emit('reconnect');
        }
      }
    });
    socket.on('disconnect', function() {
      console.log('-- disconnected --', name_space);
      _disconnect_num += 1;
      if (_disconnect_num === 1) {
        return _socket_emitter.emit('disconnect');
      }
    });
    return socket;
  };

  function SocketAdapter(options) {
    this.aggregate = __bind(this.aggregate, this);
    this.count = __bind(this.count, this);
    this.find = __bind(this.find, this);
    this.findOne = __bind(this.findOne, this);
    this.remove = __bind(this.remove, this);
    this.update = __bind(this.update, this);
    this.create = __bind(this.create, this);
    this.initialize = __bind(this.initialize, this);
    this._end_point = __bind(this._end_point, this);
    this.socket = options.socket ? options.socket : SocketAdapter.create_socket('', io);
    this.collection_name = options.collection_name;
    this.cursor_update = void 0;
  }

  SocketAdapter.prototype._end_point = function(name) {
    return this.collection_name + " " + name;
  };

  SocketAdapter.prototype.initialize = function() {
    return this.socket.on(this._end_point('update'), (function(_this) {
      return function(data) {
        return _this.cursor_update(data);
      };
    })(this));
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

  SocketAdapter.prototype.findOne = function(query, cb) {
    return this.socket.emit(this._end_point('findOne'), query, cb);
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

})();

module.exports = SocketAdapter;
