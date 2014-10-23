
Emitter = require('emitter')

_sockets = {}

_disconnect_num = 0

_socket_emitter = {}

Emitter(_socket_emitter)

class SocketAdapter

  @on: (cb) ->
    _socket_emitter.on cb

  @create_socket: (name_space, io)=>
    name = '/socket_api_' + name_space
    return _sockets[name] if name of _sockets
    socket = io.connect name
    _sockets[name] = socket

    socket.on 'connect', ()=>
      console.log '-- connected --', name_space
      if _disconnect_num > 0
        _disconnect_num -= 1
        if _disconnect_num == 0
          console.log 'reconnect'
          _socket_emitter.emit 'reconnect'

    socket.on 'disconnect', ()=>
      console.log '-- disconnected --', name_space
      _disconnect_num += 1
      if _disconnect_num == 1
        _socket_emitter.emit 'disconnect'

    return socket

  constructor: (options)->
    # socket
    @socket = if options.socket then options.socket else SocketAdapter.create_socket('', io)
    @collection_name = options.collection_name
    @cursor_update = undefined

  _end_point: (name)=>
    return @collection_name + " " + name

  initialize: ()=>
    # update
    # 単純に再読み込みしている
    @socket.on @_end_point('update'), (data)=>
      @cursor_update(data)


  # C
  # query: {
  #   doc: doc
  # }
  create: (query, cb)=>
    @socket.emit @_end_point('create'), query, cb

  # U
  # query: {
  #   conditions: conditions
  #   update: update
  #   options: options
  # }
  update: (query, cb)=>
    @socket.emit @_end_point('update'), query, cb

  # D
  # query: {
  #   conditions: conditions
  # }
  remove: (query, cb)=>
    @socket.emit @_end_point('remove'), query, cb

  # R
  # query: {
  #   conditions: conditions
  #   fields: fields
  #   options: options
  # }
  findOne: (query, cb)=>
    @socket.emit @_end_point('findOne'), query, cb

  # R
  # query: {
  #   conditions: conditions
  #   fields: fields
  #   options: options
  #   page: page  -> warning: this field is not in the mongoose API!!
  # }
  find: (query, cb)=>
    @socket.emit @_end_point('find'), query, cb

  # count
  # query: {
  #   conditions: conditions
  # }
  count: (query, cb)=>
    @socket.emit @_end_point('count'), query, cb

  # aggregate
  # query: {
  #   array: array
  #   options: options
  # }
  aggregate: (query, cb)=>
    @socket.emit @_end_point('aggregate'), query, cb

module.exports = SocketAdapter