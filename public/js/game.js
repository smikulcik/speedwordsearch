import $ from './jq.module.js'
import Phaser from './phaser.module.js'

export function initializeGame (gameID, username) {
  class Game extends Phaser.Scene {
    create () {
      //  Using the Scene Data Plugin we can store data on a Scene level
      this.data.set('lives', 3)
      this.data.set('level', 5)
      this.data.set('score', 2000)

      const text = this.add.text(100, 100, '', { font: '24px Courier', fill: '#00ff00' })

      // register
      $.ajax({
        url: '/v1/game/' + gameID + '/players',
        type: 'POST',
        data: JSON.stringify({
          player_username: username
        }),
        contentType: 'application/json; charseet=utf-8',
        dataType: 'json',
        success: (resp) => {
          // fetch game data
          $.get('/v1/game/' + gameID).then(data => {
            data = JSON.parse(data)
            console.log(data)
            console.log(username)

            if (data.status === 'lobby') {
              text.setText(`Welcome ${username}. Waiting for an opponent...`)
            } else if (data.status === 'started') {
              text.setText(JSON.stringify(data.wordsearch.board))
            }
          })
        },
        error: (resp) => {
          const data = JSON.parse(resp.responseText)
          text.setText(`Failure: ${data.message}`)
        }
      })
    }
  }

  const config = {
    type: Phaser.AUTO,
    scale: {
      mode: Phaser.Scale.RESIZE,
      parent: 'game',
      width: '100%',
      height: '100%'
    },
    scene: [Game]
  }

  /* eslint no-unused-vars: */
  const game = new Phaser.Game(config)
  console.log('Gamejs loaded gameID=' + gameID + ' player=' + username)
}
