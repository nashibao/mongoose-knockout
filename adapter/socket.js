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
