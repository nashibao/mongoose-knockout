
ajax = require('ajax')

class RestAdapter

  constructor: (options)->
    # socket
    @collection_name = if options then options.collection_name else undefined
    @cursor_update = undefined

  initialize: ()=>


  _end_point: (name)=>
    return '/api/' + @collection_name + '/' + name

  # C
  # query: {
  #   doc: doc
  # }
  create: (query, cb)=>
    ajax {
      url: @_end_point('create')
      type: 'POST'
      dataType: 'json'
      data: query
      success: (data, textStatus, jqXHR)=>
        cb(data.err)
        @cursor_update()
    }

  # U
  # query: {
  #   conditions: conditions
  #   update: update
  #   options: options
  # }
  update: (query, cb)=>
    ajax {
      url: @_end_point('update')
      type: 'PUT'
      dataType: 'json'
      data: query
      success: (data, textStatus, jqXHR)=>
        cb(data.err)
        @cursor_update()
    }

  # D
  # query: {
  #   conditions: conditions
  # }
  remove: (query, cb)=>
    ajax {
      url: @_end_point('remove')
      type: 'DELETE'
      dataType: 'json'
      data: query
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
  find: (query, cb)=>
    ajax {
      url: @_end_point('find')
      type: 'GET'
      dataType: 'json'
      data: query
      success: (data, textStatus, jqXHR)=>
        cb(data.err, data.docs)
    }

  # count
  # query: {
  #   conditions: conditions
  # }
  count: (query, cb)=>
    ajax {
      url: @_end_point('count')
      type: 'GET'
      dataType: 'json'
      data: query
      success: (data, textStatus, jqXHR)=>
        cb(data.err, data.count)
    }

module.exports = RestAdapter