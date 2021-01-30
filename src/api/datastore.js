
// TODO: Use non-memory datastore
const allGames = {}

function getGameData (id) {
  const gd = allGames[id]
  if (gd === undefined) {
    throw new Error(`Game ID '${id}' not found`)
  }
  return gd
}

function addGameData (game) {
  if (allGames[game.id] !== undefined) {
    throw new Error(`Game with ID='${game.id}' already exists`)
  }
  allGames[game.id] = game
}

module.exports = {
  getGameData,
  addGameData
}
