/* eslint-disable */

'use strict'
require('eventsource-polyfill')
var hotClient = require('webpack-hot-middleware/client?noInfo=true&reload=true')

hotClient.subscribe(function (event) {
  if ('reload' === event.action) {
    window.location.reload()
  }
})
