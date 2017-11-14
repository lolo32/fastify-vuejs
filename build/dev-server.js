'use strict'

const config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

const path = require('path')
const webpack = require('webpack')
const proxyMiddleware = require('http-proxy-middleware')
const webpackConfig = ('testing' === process.env.NODE_ENV || 'production' === process.env.NODE_ENV)
  ? require('./webpack.prod.conf')
  : require('./webpack.dev.conf')

// default port where dev server listens for incoming traffic
const port = process.env.PORT || config.dev.port
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
const proxyTable = config.dev.proxyTable

const fastify = require('fastify')()
const compiler = webpack(webpackConfig)

const devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

const hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: false,
  heartBeat: 2000
})

fastify.use(hotMiddleware, (err) => {
  if (err) {
    throw err
  }
})

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  let options = proxyTable[context]
  if ('string' === typeof options) {
    options = {target: options}
  }
  fastify.use(proxyMiddleware(options.filter || context, options), (err) => {
    if (err) {
      throw err
    }
  })
})

// handle fallback for HTML5 history API
fastify.use(require('connect-history-api-fallback')({
  logger: fastify.log
}), (err) => {
  if (err) {
    throw err
  }
})

// serve webpack bundle output
fastify.use(devMiddleware, (err) => {
  if (err) {
    throw err
  }
})

// serve pure static assets
const staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
fastify.use(staticPath, (err, req, res, next) => {
  fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'static'),
    prefix: staticPath
  })
  next()
})

let _resolve
let _reject
let readyPromise = new Promise((resolve, reject) => {
  _resolve = resolve
  _reject = reject
})

let portFinder = require('portfinder')
portFinder.basePort = port

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  portFinder.getPort((err, port) => {
    if (err) {
      _reject(err)
    }
    process.env.PORT = port

    let url = `http://localhost:${port}`
    console.log(`> Listening at ${url}\n`)

    fastify.listen(port, (err) => {
      if (err) {
        throw err
      }

      _resolve()
    })
  })
})

module.exports = {
  ready: readyPromise,
  close: () => {
    fastify.close((err) => {
      if (err) {
        throw err
      }
    })
  }
}
