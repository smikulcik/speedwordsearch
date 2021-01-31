import $ from './jq.module.js'
import Phaser from './phaser.module.js'

export function initializeGame (gameID) {
  class Game extends Phaser.Scene {
    create () {
      const scene = this
      //  Using the Scene Data Plugin we can store data on a Scene level
      this.data.set('lives', 3)
      this.data.set('level', 5)
      this.data.set('score', 2000)
      this.username = undefined

      this.text = this.add.text(100, 100, '', { font: '24px Courier', fill: '#00ff00' })
      this.startButton = this.add.text(100, 200, 'Start!', { fill: '#0f0' })
        .setInteractive()
        .on('pointerup', () => {
          $.ajax({
            url: '/v1/game/' + gameID + '/start',
            type: 'POST',
            success: () => {
              this.updateScene()
            },
            error: (resp) => {
              const data = JSON.parse(resp.responseText)
              alert(`Failure: ${data.message}`)
            }
          })
        })
      this.joinButton = this.add.text(300, 200, 'Join Game!', { fill: '#0f0' })
        .setInteractive()
        .on('pointerup', () => {
          scene.username = window.prompt('Please enter your name')

          // register
          $.ajax({
            url: '/v1/game/' + gameID + '/players',
            type: 'POST',
            data: JSON.stringify({
              player_username: scene.username
            }),
            contentType: 'application/json; charseet=utf-8',
            dataType: 'json',
            error: (resp) => {
              const data = JSON.parse(resp.responseText)
              alert(`Failure: ${data.message}`)
            }
          })
        })

      // subscribe to game's feed
      const exampleSocket = new WebSocket('ws://' + window.location.host + '/game/wss')
      exampleSocket.onopen = function () {
        exampleSocket.send(JSON.stringify({ type: 'subscribe', game_id: gameID }))
      }
      exampleSocket.onmessage = function (message) {
        const data = JSON.parse(message.data)
        switch (data.type) {
          case 'register':
            scene.updateScene()
            break
          case 'start_game':
            scene.updateScene()
            break
          case 'found_word':
            console.log(message)
            break
          default:
            console.log(message)
        }
      }

      // initial update
      scene.updateScene()
    }

    updateScene () {
      const scene = this

      // fetch game data
      $.get('/v1/game/' + gameID).then(data => {
        data = JSON.parse(data)
        console.log(data)

        if (data.status === 'lobby') {
          if (data.players.length < 2) {
            if (scene.username === undefined) {
              this.startButton.visible = false
              this.joinButton.visible = true

              scene.text.setText('Spectating... Join the game to play.')
            } else {
              this.startButton.visible = false
              this.joinButton.visible = false

              scene.text.setText(`Welcome ${scene.username}. Waiting for an opponent...`)
            }
          } else {
            if (scene.username === undefined) {
              this.startButton.visible = false
              this.joinButton.visible = false

              scene.text.setText('Spectating...')
            } else {
              this.startButton.visible = true
              this.joinButton.visible = false

              let opponent = data.players[0]
              if (data.players[0] === scene.username) {
                opponent = data.players[1]
              }
              scene.text.setText(`${scene.username} vs ${opponent}! Press start to play`)
            }
          }
        } else if (data.status === 'started') {
          this.startButton.visible = false
          this.joinButton.visible = false

          let wordsearchTxt = ''
          for (let row = 0; row < data.wordsearch.board.length; row++) {
            for (let col = 0; col < data.wordsearch.board[row].length; col++) {
              wordsearchTxt += data.wordsearch.board[row][col] + ' '
            }
            wordsearchTxt += '\n'
          }
          scene.text.setText(wordsearchTxt)
        } else if (data.status === 'ended') {
          this.startButton.visible = false
          this.joinButton.visible = false

          scene.text.setText('Game is over!')
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
  console.log('Gamejs loaded gameID=' + gameID)
}
