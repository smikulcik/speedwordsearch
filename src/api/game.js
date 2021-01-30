const datastore = require('./datastore')
const { generateWordsearch } = require('./wordsearch')

const alphabet = 'abcdefghijklmnopqrstuvwxyz'
function generateID () {
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
}

// TODO: Implement locking
function findWord (gameID, player, coords) {
  const game = datastore.getGameData(gameID)

  // find word in game
  let foundWord = ''
  for (let x = coords.start.x; x <= coords.end.x; x++) {
    for (let y = coords.start.y; y <= coords.end.y; y++) {
      foundWord += game.wordsearch.board[x][y]
    }
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
  game.found_words.push({
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
  })

  // check for end conditions
  if (game.found_words.length === game.wordsearch.words.length) {
    game.status = 'ended'
    game.ended_at = (new Date()).toISOString()
  }
}

module.exports = {
  newGame,
  registerPlayer,
  startGame,
  findWord
}
