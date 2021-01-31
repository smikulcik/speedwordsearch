
const subscriptions = {}

function broadcast (gameID, message) {
  console.log('Broadcast: ' + gameID, JSON.stringify(message))
  if (subscriptions[gameID] !== undefined) {
    subscriptions[gameID].forEach(client => {
      try {
        client.send(JSON.stringify(message))
      } catch (e) {
        console.log(e)
      }
    })
  }
}

function receiveWSMessage (ws, message) {
  switch (message.type) {
    case 'subscribe':
      // todo: add locking
      if (subscriptions[message.game_id] === undefined) {
        subscriptions[message.game_id] = []
      }
      subscriptions[message.game_id].push(ws)
      console.log('Subscription: ' + message.game_id)
      break
    default:
      console.log('Unknown message type: ' + message.type, message)
  }
}

module.exports = {
  broadcast,
  receiveWSMessage
}
