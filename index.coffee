_ = require 'lodash'


oo = ko.observable
oa = ko.observableArray
co = ko.computed

class Cursor
  constructor: (api, func_name, query, cb)->
    @api = api
    @func_name = func_name
    @query = query

    @val = oo(false)

    @docs = oa([])
    @_docs = {}

    @last_err = oo(false)
    @errors = oa([])

    # paging
    @page = oo(0)
    @page_length = oo(0)
    @limit = oo(0)
    @count = oo(0)
    @pages = co ()=>
      if @page_length() > 0
        return [0..(@page_length()-1)]
      return []

    @cb = cb

  update: ()=>
    @api[@func_name](@query, @cb, @)


class Model

  cursor_update: ()=>
    console.log 'cursor_update'
    for cursor in @cursors
      cursor.update()

  constructor: (options)->
    @name_space = options.name_space
    @collection_name = options.collection_name
    @model = options.model

    # adapter
    @adapter = if options.adapter then options.adapter else new SocketAdapter()
    @adapter.collection_name = options.collection_name
    @adapter.cursor_update = @cursor_update

    @adapter.initialize()

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

    @map = options.map || false

  # todo: update validation
  validate: (doc)=>
    for key of @model
      atrs = @model[key]
      if atrs.required
        if not doc[key]?
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

  _debug_error: (err, options)=>
    @last_err(err)
    if err
      console.log err
      @errors.push(err)
    else
      console.log 'success'
      if options
        console.log options

  create: (query, cb)=>
    if not @validate(query.doc)
      if cb
        cb(@last_validate_err())
      return false
    @adapter.create query, (err)=>
      if cb
        cb(err)
      @_debug_error(err)
    return true

  update: (query, cb)=>
    if query.update
      delete query.update["_id"]
    @adapter.update query, (err)=>
      if cb
        cb(err)
      @_debug_error(err)

  remove: (query, cb)=>
    @adapter.remove query, (err)=>
      if cb
        cb(err)
      @_debug_error(err)

  # R
  findOne: (query, cb, cursor)=>
    conditions = query.conditions
    fields = query.fields
    options = query.options
    if not cursor?
      cursor = new Cursor(@, 'findOne', query, cb)
      @cursors.push(cursor)
    @adapter.findOne query, (err, doc)=>
      if @map
        doc = @map(doc)
      cursor.last_err = err
      if err
        cursor.errors.push(err)
      cursor.val(doc)
      if cb
        cb(err, doc)
      @_debug_error(err, doc)
    return cursor

  # R
  find: (query, cb, cursor)=>
    conditions = query.conditions
    fields = query.fields
    options = query.options
    page = query.page
    if not cursor?
      cursor = new Cursor(@, 'find', query, cb)
      @cursors.push(cursor)
    @adapter.find query, (err, docs, options)=>
      if @map
        docs = _.map(docs, @map)
      console.log 'find', docs, err
      cursor.last_err = err
      if err
        cursor.errors.push(err)
      if not (docs==null)
        cursor.docs(docs)
        cursor.page(options.page)
        cursor.page_length(options.page_length)
        cursor.limit(options.limit)
        cursor.count(options.count)
        # todo: mapping
        for doc in docs
          @_docs[doc["_id"]] = doc
          cursor._docs[doc["_id"]] = doc
      if cb
        cb(err, docs)
      @_debug_error(err, docs)
    return cursor

  # count
  count: (query, cb, cursor)=>
    conditions = query.conditions
    if not cursor?
      cursor = new Cursor(@, 'count', query, cb)
      @cursors.push(cursor)
    @adapter.count query, (err, count)=>
      cursor.last_err = err
      if err
        cursor.errors.push(err)
      cursor.val(count)
      if cb
        cb(err, count)
      @_debug_error(err, count)
    return cursor

  # count
  aggregate: (query, cb, cursor)=>
    array = query.array
    if not cursor?
      cursor = new Cursor(@, 'aggregate', query, cb)
      @cursors.push(cursor)
    @adapter.aggregate query, (err, docs)=>
      cursor.last_err = err
      if err
        cursor.errors.push(err)
      cursor.docs(docs)
      if docs.length > 0
        cursor.val(docs[0])
      else
        cursor.val(false)
      # todo: mapping
      for doc in docs
        @_docs[doc["_id"]] = doc
        cursor._docs[doc["_id"]] = doc
      if cb
        cb(err, docs)
      @_debug_error(err, docs)
    return cursor

exports.adapter = require('./adapter')
exports.Cursor = Cursor
exports.Model = Model
