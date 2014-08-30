_ = require 'lodash'

oo = ko.observable
oa = ko.observableArray
co = ko.computed

class Storage
  @create_socket: (name_space, io)=>
    socket = io.connect '/socket_api_storage_' + name_space
    return socket

  constructor: (options={})->
    # socket
    @socket = if options.socket then options.socket else Storage.create_socket('', io)

    # name space
    @name_space = options.name_space || ''

    @storage = oo(false)

  _end_point: (name)=>
    return name

  get: (cb)=>
    @socket.emit @_end_point('get'), null, (err, d)=>
      @storage(d)
      cb(d) if cb?

  set: (data, cb)=>
    @socket.emit @_end_point('set'), data, (err)=>
      cb(err) if cb?

  # reactive
  update: (cb)=>
    cb(@storage())
    @set @storage(), (err)=>

module.exports = Storage
