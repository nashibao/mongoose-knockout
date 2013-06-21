require('knockout')

oo = ko.observable
oa = ko.observableArray

class Cursor
  constructor: (api, func_name, query, cb)->
    @api = api
    @func_name = func_name
    @query = query

    @val = oo(false)

    @docs = oa([])
    # for search to cache
    @_docs = {}

    @last_err = oo(false)
    @errors = oa([])

    @cb = cb

  update: ()=>
    @api[@func_name](@query, @cb, @)


class Model
  @create_socket: (name_space, io)=>
    socket = io.connect '/socket_api_' + name_space
    return socket

  constructor: (name_space, collection_name, model, socket)->
    @name_space = name_space
    @collection_name = collection_name
    @model = model
    @socket = socket

    # initialize ---
    @socket.on 'connect', ()=>
      console.log '-- connected --', @name_space

    @socket.on @event('update'), (data)=>
      for cursor in @cursors
        cursor.update()

    # cache ---
    @_docs = {}

    # cursors ----
    @cursors = []

    # errors ----
    @last_err = oo(false)
    @errors = oa([])


  event: (name)=>
    return @collection_name + " " + name

  debug_error: (err, options)=>
    @last_err(err)
    if err
      console.log err
      @errors.push(err)
    else
      console.log 'success'
      if options
        console.log options

  # C
  create: (doc, cb)=>
    @socket.emit @event('create'), {doc: doc}, (err)=>
      if cb
        cb(err)
      @debug_error(err)

  # U
  update: (conditions, update, options, cb)=>
    delete update["_id"]
    @socket.emit @event('update'), {conditions: conditions, update: update, options: options}, (err)=>
      if cb
        cb(err)
      @debug_error(err)

  # D
  remove: (conditions, cb)=>
    @socket.emit @event('remove'), {conditions: conditions}, (err)=>
      if cb
        cb(err)
      @debug_error(err)

  # R
  find: (query, cb, cursor)=>
    conditions = query.conditions
    fields = query.fields
    options = query.options
    if not cursor?
      cursor = new Cursor(@, 'find', query, cb)
      @cursors.push(cursor)
    @socket.emit @event('find'), {conditions: conditions, fields: fields, options: options}, (err, docs)=>
      console.log 'find', docs, err
      cursor.last_err = err
      if err
        cursor.err.push(err)
      cursor.docs(docs)
      # todo: mapping
      for doc in docs
        @_docs[doc["_id"]] = doc
        cursor._docs[doc["_id"]] = doc
      if cb
        cb(err, docs)
      @debug_error(err, docs)
    return cursor

  # count
  count: (query, cb, cursor)=>
    conditions = query.conditions
    if not cursor?
      cursor = new Cursor(@, 'count', query, cb)
      @cursors.push(cursor)
    @socket.emit @event('count'), {conditions: conditions}, (err, count)=>
      cursor.last_err = err
      if err
        cursor.err.push(err)
      cursor.val(count)
      if cb
        cb(err, count)
      @debug_error(err, count)
    return cursor

exports.Model = Model
