
ajax = require('ajax')
json = require('json')

class RestAdapter

  constructor: (options)->
    # socket
    @name_space = options?.name_space || ''
    @collection_name = if options then options.collection_name else undefined
    @cursor_update = undefined

  initialize: ()=>


  _end_point: (name)=>
    pt = '/api/' + @collection_name + '/'
    if @name_space
      pt += @name_space + '/'
    pt += name
    return pt

  # C
  # query: {
  #   doc: doc
  # }
  create: (query, cb)=>
    q = json.stringify(query)
    ajax {
      url: @_end_point('create')
      type: 'POST'
      dataType: 'json'
      data: {query: q}
      success: (data, textStatus, jqXHR)=>
        cb(data.err, data.doc)
        @cursor_update()
    }

  # U
  # query: {
  #   conditions: conditions
  #   update: update
  #   options: options
  # }
  update: (query, cb)=>
    q = json.stringify(query)
    ajax {
      url: @_end_point('update')
      type: 'PUT'
      dataType: 'json'
      data: {query: q}
      success: (data, textStatus, jqXHR)=>
        cb(data.err)
        @cursor_update()
    }

  # D
  # query: {
  #   conditions: conditions
  # }
  remove: (query, cb)=>
    q = json.stringify(query)
    ajax {
      url: @_end_point('remove')
      type: 'DELETE'
      dataType: 'json'
      data: {query: q}
      success: (data, textStatus, jqXHR)=>
        cb(data.err)
        @cursor_update()
    }

  # R
  # query: {
  #   conditions: conditions
  #   fields: fields
  #   options: options
  # }
  findOne: (query, cb)=>
    q = json.stringify(query)
    ajax {
      url: @_end_point('findOne')
      type: 'GET'
      dataType: 'json'
      data: {query: q}
      success: (data, textStatus, jqXHR)=>
        cb(data.err, data.doc)
    }

  # R
  # query: {
  #   conditions: conditions
  #   fields: fields
  #   options: options
  # }
  find: (query, cb)=>
    q = json.stringify(query)
    ajax {
      url: @_end_point('find')
      type: 'GET'
      dataType: 'json'
      data: {query: q}
      success: (data, textStatus, jqXHR)=>
        cb(data.err, data.docs, data.options)
    }

  # count
  # query: {
  #   conditions: conditions
  # }
  count: (query, cb)=>
    q = json.stringify(query)
    ajax {
      url: @_end_point('count')
      type: 'GET'
      dataType: 'json'
      data: {query: q}
      success: (data, textStatus, jqXHR)=>
        cb(data.err, data.count)
    }

  # R
  # query: {
  #   conditions: conditions
  #   fields: fields
  #   options: options
  # }
  aggregate: (query, cb)=>
    q = json.stringify(query)
    ajax {
      url: @_end_point('aggregate')
      type: 'GET'
      dataType: 'json'
      data: {query: q}
      success: (data, textStatus, jqXHR)=>
        cb(data.err, data.docs, data.options)
    }

module.exports = RestAdapter