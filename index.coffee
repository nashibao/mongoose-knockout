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
  constructor: (options)->
    @name_space = options.name_space
    @collection_name = options.collection_name
    @model = options.model

    # cache ---
    @_docs = {}

    # cursors ----
    @cursors = []

    # errors ----
    @last_err = oo(false)
    @errors = oa([])

    # validation ----
    @last_validate_err = oo(false)
    @validate_errors = oa([])

  # todo: update validation
  validate: (doc)=>
    for key of @model
      atrs = @model[key]
      if atrs.required
        if not doc[key]
          msg = 'required field: ' + key
          @validate_errors.push(msg)
          @last_validate_err(msg)
          return false
      if atrs.validate
        for valid in atrs.validate
          data = false
          valid.validator doc[key], (d)=>
            data = d
          if not data
            @validate_errors.push(valid.msg)
            @last_validate_err(valid.msg)
            return false
    @last_validate_err(false)
    return true

  debug_error: (err, options)=>
    @last_err(err)
    if err
      console.log err
      @errors.push(err)
    else
      console.log 'success'
      if options
        console.log options

  create: (doc, cb)=>
    if not @validate(doc)
      if cb
        cb(@last_validate_err())
      return false
    return true

  update: (conditions, update, options, cb)=>
    delete update["_id"]



class SocketModel extends Model
  @create_socket: (name_space, io)=>
    socket = io.connect '/socket_api_' + name_space
    return socket

  constructor: (options)->
    super options
    @socket = options.socket

    # initialize ---
    @socket.on 'connect', ()=>
      console.log '-- connected --', @name_space

    @socket.on @event('update'), (data)=>
      for cursor in @cursors
        cursor.update()

  event: (name)=>
    return @collection_name + " " + name

  # C
  create: (doc, cb)=>
    if not (super doc, cb)
      return false
    @socket.emit @event('create'), {doc: doc}, (err)=>
      if cb
        cb(err)
      @debug_error(err)
    return true

  # U
  update: (conditions, update, options, cb)=>
    super conditions, update, options
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

exports.SocketModel = SocketModel
