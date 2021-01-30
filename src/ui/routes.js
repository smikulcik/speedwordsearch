
const nunjucks = require('nunjucks')
const express = require('express')
const { getGameData } = require('../api/datastore')

function addRoutes (app) {
  const nunjucksOptions = {
    autoescape: true,
    express: app
  }
  if (process.env.DEMO === 'true') {
    nunjucksOptions.watch = true
    nunjucksOptions.noCache = true
  }
  const env = nunjucks.configure('views', nunjucksOptions)

  /**
   * Returns a JSON stringified version of the value, safe for inclusion in an
   * inline <script> tag. The optional argument 'spaces' can be used for
   * pretty-printing.
   *
   * Output is NOT safe for inclusion in HTML! If that's what you need, use the
   * built-in 'dump' filter instead.
   *
   * https://stackoverflow.com/a/46427070
   */
  env.addFilter('json', function (value, spaces) {
    if (value instanceof nunjucks.runtime.SafeString) {
      value = value.toString()
    }
    const jsonString = JSON.stringify(value, null, spaces).replace(/</g, '\\u003c')
    return nunjucks.runtime.markSafe(jsonString)
  })

  app.use(express.static('public'))

  app.get('/', function (req, res) {
    console.log('UI: GET /')
    res.render('index.html')
  })
  app.get('/:id', function (req, res) {
    console.log('UI: GET /' + req.params.id)
    const game = getGameData(req.params.id)
    res.render('game.html', game)
  })
}
module.exports = {
  addRoutes
}
