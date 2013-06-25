
class SocketAdapter
  @create_socket: (name_space, io)=>
    socket = io.connect '/socket_api_' + name_space
    return socket

  constructor: (options)->
    # socket
    @socket = if options.socket then options.socket else SocketAdapter.create_socket('', io)
    @collection_name = options.collection_name
    @cursor_update = undefined

  _end_point: (name)=>
    return @collection_name + " " + name

  initialize: ()=>
    # initialize ---
    @socket.on 'connect', ()=>
      console.log '-- connected --', @name_space

    # update
    @socket.on @_end_point('update'), (data)=>
      console.log 'update???'
      @cursor_update()


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
  find: (query, cb)=>
    @socket.emit @_end_point('find'), query, cb

  # count
  # query: {
  #   conditions: conditions
  # }
  count: (query, cb)=>
    @socket.emit @_end_point('count'), query, cb

module.exports = SocketAdapter