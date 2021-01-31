
const expressWs = require('express-ws')
const { getGameData } = require('./datastore')
const { newGame, registerPlayer, startGame, findWord } = require('./game')
const { receiveWSMessage } = require('./websockets')

/**
 *
 * @param {require('express').Express} app
 */
function addRoutes (app) {
  app.post('/v1/game', (req, res) => {
    const game = newGame()

    res.status(201).send(JSON.stringify(game))
    console.log('POST /v1/game => 201')
  })

  app.get('/v1/game/:id', (req, res) => {
    try {
      const game = getGameData(req.params.id)

      res.send(JSON.stringify(game))
      console.log('GET /v1/game/' + req.params.id + ' => 200')
    } catch (e) {
      res.status(404).send(JSON.stringify({
        code: 'not_found',
        message: e.message
      }))
      console.log('GET /v1/game/' + req.params.id + ' => 404')
    }
  })

  app.post('/v1/game/:id/players', (req, res) => {
    try {
      // validate req
      if (typeof req.body.player_username !== 'string' || req.body.player_username.length === 0) {
        throw new Error('username must be a non-empty string')
      }

      registerPlayer({
        game_id: req.params.id,
        player_username: req.body.player_username
      })

      res.status(201).send(JSON.stringify({
        username: req.body.player_username
      }))
      console.log('GET /v1/game/' + req.params.id + '/players => 201')
    } catch (e) {
      res.status(400).send(JSON.stringify({
        code: 'bad_request',
        message: e.message
      }))
      console.log('GET /v1/game/' + req.params.id + '/players => 400')
    }
  })

  app.post('/v1/game/:id/start', (req, res) => {
    try {
      const game = startGame(req.params.id)

      res.status(201).send(JSON.stringify(game))
      console.log('POST /v1/game/' + req.params.id + '/start => 201')
    } catch (e) {
      res.status(400).send(JSON.stringify({
        code: 'bad_request',
        message: e.message
      }))
      console.log('POST /v1/game/' + req.params.id + '/start => 400')
    }
  })

  app.post('/v1/game/:id/found_words', (req, res) => {
    try {
      const game = findWord(req.params.id, req.body.player_username, req.body.coordinates)

      res.status(201).send(JSON.stringify(game))
      console.log('POST /v1/game/' + req.params.id + '/found_words => 201')
    } catch (e) {
      console.log(e)
      res.status(400).send(JSON.stringify({
        code: 'bad_request',
        message: e.message
      }))
      console.log('POST /v1/game/' + req.params.id + '/found_words => 400')
    }
  })

  // WS endpoints
  expressWs(app)
  app.ws('/game/wss', function (ws, req) {
    ws.on('message', (message) => {
      receiveWSMessage(ws, JSON.parse(message))
    })
    ws.send(JSON.stringify({ type: 'welcome' }))
  })
}

module.exports = {
  addRoutes
}
