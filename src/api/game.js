const datastore = require('./datastore')
const { generateWordsearch } = require('./wordsearch')
const { broadcast } = require('./websockets')

const alphabet = 'abcdefghijklmnopqrstuvwxyz'
function generateID () {
  if (process.env.DEMO === 'true') {
    return 'rjzacx'
  }
  const idLength = 6
  let out = ''
  for (let i = 0; i < idLength; i++) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  }
  return out
}

function newGame () {
  const game = {
    players: [],
    status: 'lobby'
  }
  game.id = generateID()

  datastore.addGameData(game)

  return game
}

function registerPlayer (registerReq) {
  const game = datastore.getGameData(registerReq.game_id)
  if (game.status !== 'lobby') {
    throw new Error('Game must be in lobby to register players')
  }
  if (game.players.length >= 2) {
    throw new Error('Game already has 2 players')
  }
  game.players.push(registerReq.player_username)

  broadcast(game.id, {
    type: 'register',
    player: registerReq.player_username
  })
}

function startGame (gameID) {
  const game = datastore.getGameData(gameID)
  if (game.players.length < 2) {
    throw new Error('Game must have 2 players to start')
  }
  if (game.status !== 'lobby') {
    throw new Error('Game must be in lobby to start')
  }
  game.wordsearch = generateWordsearch()
  game.status = 'started'
  game.started_at = (new Date()).toISOString()
  game.found_words = []

  broadcast(game.id, {
    type: 'start_game',
    started_at: game.started_at
  })
}

// TODO: Implement locking
function findWord (gameID, player, coords) {
  const game = datastore.getGameData(gameID)

  // find word in game
  let foundWord = ''
  if (coords.start.x === coords.end.x) { // vertical
    let y = coords.start.y
    while (true) {
      foundWord += game.wordsearch.board[y][coords.start.x]
      if (y === coords.end.y) break
      if (y < coords.end.y) y++
      else y--
    }
  } else if (coords.start.y === coords.end.y) { // horizontal
    let x = coords.start.x
    while (true) {
      foundWord += game.wordsearch.board[coords.start.y][x]
      if (x === coords.end.x) break
      if (x < coords.end.x) x++
      else x--
    }
  } else if (Math.abs(coords.start.y - coords.end.y) === Math.abs(coords.start.x - coords.end.x)) {
    // if diagonal
    let x = coords.start.x
    let y = coords.start.y
    while (true) {
      foundWord += game.wordsearch.board[y][x]
      if (x === coords.end.x && y === coords.end.y) break
      if (x < coords.end.x) x++
      else x--
      if (y < coords.end.y) y++
      else y--
    }
  } else {
    throw new Error('Invalid Coordinates: Only vertical, horizontal, and diagonal: ' + JSON.stringify(coords))
  }
  // verify it's a match
  let isValid = false
  game.wordsearch.words.forEach((word) => {
    if (word === foundWord.toLowerCase()) {
      isValid = true
    }
  })
  if (!isValid) {
    throw new Error('Word not in board: ' + foundWord)
  }

  // check that the word isn't already found
  let isAlreadyFound = false
  game.found_words.forEach((w) => {
    if (w.value === foundWord) {
      isAlreadyFound = true
    }
  })
  if (isAlreadyFound) {
    throw new Error('Word already found: ' + foundWord)
  }

  // claim word
  const foundWordObj = {
    value: foundWord,
    player: player,
    coordinates: {
      start: {
        x: coords.start.x,
        y: coords.start.y
      },
      end: {
        x: coords.end.x,
        y: coords.end.y
      }
    },
    found_at: (new Date()).toISOString()
  }
  game.found_words.push(foundWordObj)

  // check for end conditions
  if (game.found_words.length === game.wordsearch.words.length) {
    game.status = 'ended'
    game.ended_at = (new Date()).toISOString()
  }

  broadcast(game.id, {
    type: 'found_word',
    found_word: foundWordObj
  })
}

module.exports = {
  newGame,
  registerPlayer,
  startGame,
  findWord
}
