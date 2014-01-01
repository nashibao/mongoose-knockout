_ = require 'lodash'


oo = ko.observable
oa = ko.observableArray
co = ko.computed

class Cursor
  constructor: (model, func_name, query, cb)->

    # caching ----
    @model = model
    @func_name = func_name
    @query = query

    # result ----
    # object
    @val = oo(false)

    # array
    @docs = oa([])

    # dictionary
    @_docs = {}

    # errors ----
    @last_err = oo(false)
    @errors = oa([])

    # paging ----
    @page = oo(0)
    @page_length = oo(0)
    @limit = oo(0)
    @count = oo(0)
    @pages = co ()=>
      if @page_length() > 0
        return [0..(@page_length()-1)]
      return []

    # none -> loading -> loaded -> loading -> loaded
    @status = oo('none')

    # callback ----
    @cb = cb

    # for paging apis ----
    @has_previous = co ()=>
      if @page() > 0
        return true
      return false

    @has_next = co ()=>
      if @page() + 1 < @page_length()
        return true
      return false

    # updateの方法
    @more = false

  # re query
  update: (options={})=>
    # prohibit multi requesting
    if @status() == "loading"
      return
    @model[@func_name](@query, options, @cb, @)

  # 後ろにくっつける
  tail: ()=>
    if not @query.page?
      @query.page = 0
    @query.page += 1
    @more = 2
    @update({more: @more})

  # 頭にくっつける
  head: ()=>
    @more = 1
    @update({more: @more, page: 0})



class Model
  cursor_update: (data={})=>
    if data.method == 'notified'
      if @notified
        @notified()
      return
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

    @notified = options.notified || false

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

  create: (query, temp_options, cb)=>
    if not @validate(query.doc)
      if cb
        cb(@last_validate_err())
      return false
    @adapter.create query, (err)=>
      if cb
        cb(err)
      @_debug_error(err)
    return true

  update: (query, temp_options, cb)=>
    if query.update
      delete query.update["_id"]
    @adapter.update query, (err)=>
      if cb
        cb(err)
      @_debug_error(err)

  remove: (query, temp_options, cb)=>
    @adapter.remove query, (err)=>
      if cb
        cb(err)
      @_debug_error(err)

  # R
  findOne: (query, temp_options, cb, cursor)=>
    conditions = query.conditions
    fields = query.fields
    options = query.options
    if not cursor?
      cursor = new Cursor(@, 'findOne', query, cb)
      @cursors.push(cursor)
    cursor.status('loading')
    @adapter.findOne query, (err, doc)=>
      if @map
        doc = @map(doc)
      cursor.last_err = err
      if err
        cursor.errors.push(err)
      cursor.val(doc)
      cursor.status('loaded')
      if cb
        cb(err, doc)
      @_debug_error(err, doc)
    return cursor

  # R
  find: (query, temp_options, cb, cursor)=>
    temp_options = temp_options || {}
    conditions = query.conditions
    fields = query.fields
    options = query.options
    page = query.page
    if temp_options.page?
      page = temp_options.page
    more = temp_options.more || false
    if not cursor?
      cursor = new Cursor(@, 'find', query, cb)
      @cursors.push(cursor)
    cursor.status('loading')
    @adapter.find query, (err, docs, options)=>
      if @map
        docs = _.map(docs, @map)
      cursor.last_err = err
      if err
        cursor.errors.push(err)
      if docs?
        if not more
          @_docs = {}
          cursor._docs = {}
        # todo: mapping
        for doc in docs
          already = false
          if doc["_id"] of @_docs
            already = true
          @_docs[doc["_id"]] = doc
          cursor._docs[doc["_id"]] = doc
          if more
            if not already
              switch more
                when 1 then cursor.docs.unshift(doc)
                when 2 then cursor.docs.push(doc)
        if not more
          cursor.docs(docs)
        cursor.page(options.page)
        cursor.page_length(options.page_length)
        cursor.limit(options.limit)
        cursor.count(options.count)
      cursor.status('loaded')
      if cb
        cb(err, docs)
      @_debug_error(err, docs)
    return cursor

  # count
  count: (query, temp_options, cb, cursor)=>
    conditions = query.conditions
    if not cursor?
      cursor = new Cursor(@, 'count', query, cb)
      @cursors.push(cursor)
    cursor.status('loading')
    @adapter.count query, (err, count)=>
      cursor.last_err = err
      if err
        cursor.errors.push(err)
      cursor.val(count)
      cursor.status('loaded')
      if cb
        cb(err, count)
      @_debug_error(err, count)
    return cursor

  # count
  aggregate: (query, temp_options, cb, cursor)=>
    array = query.array
    if not cursor?
      cursor = new Cursor(@, 'aggregate', query, cb)
      @cursors.push(cursor)
    cursor.status('loading')
    @adapter.aggregate query, (err, docs)=>
      cursor.last_err = err
      if err
        cursor.errors.push(err)
      if docs?
        # todo: mapping
        for doc in docs
          @_docs[doc["_id"]] = doc
          cursor._docs[doc["_id"]] = doc
        cursor.docs(docs)
        if docs.length > 0
          cursor.val(docs[0])
        else
          cursor.val(false)
      cursor.status('loaded')
      if cb
        cb(err, docs)
      @_debug_error(err, docs)
    return cursor

exports.adapter = require('./adapter')
exports.Cursor = Cursor
exports.Model = Model
