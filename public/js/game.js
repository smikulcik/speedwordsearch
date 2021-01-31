import $ from './jq.module.js'
import Phaser from './phaser.module.js'

function drawGrid (phaserGraphics, startx, starty, width, height, numRows, numCols, opts) {
  phaserGraphics.clear()
  phaserGraphics.lineStyle(opts.width, opts.fill)
  phaserGraphics.beginPath()

  // draw vertical lines
  let x
  for (let col = 0; col <= numCols; col++) {
    x = startx + col * width / numCols
    phaserGraphics.moveTo(x, starty)
    phaserGraphics.lineTo(x, starty + height)
  }
  // draw horizontal lines
  let y
  for (let row = 0; row <= numRows; row++) {
    y = starty + row * height / numRows
    phaserGraphics.moveTo(startx, y)
    phaserGraphics.lineTo(startx + width, y)
  }
  phaserGraphics.closePath()
  phaserGraphics.strokePath()
}

function drawFoundWords (scene, foundWordsGraphics, foundWords, players) {
  foundWordsGraphics.clear()
  if (foundWords === undefined) {
    return
  }

  foundWords.forEach((word) => {
    if (word.player === players[0]) {
      foundWordsGraphics.lineStyle(5, 0xFF0000)
    } else {
      foundWordsGraphics.lineStyle(5, 0x0000FF)
    }
    foundWordsGraphics.beginPath()

    const x = word.coordinates.start.x * 57 + 26 + (scene.cameras.main.centerX - 280 - 10)
    const y = word.coordinates.start.y * 51 + 25 + 100
    const endx = word.coordinates.end.x * 57 + 26 + (scene.cameras.main.centerX - 280 - 10)
    const endy = word.coordinates.end.y * 51 + 25 + 100

    foundWordsGraphics.moveTo(x, y)
    foundWordsGraphics.lineTo(endx, endy)

    foundWordsGraphics.closePath()
    foundWordsGraphics.strokePath()
  })
}

function drawWordSearch (scene, wordsearch) {
  let wordsearchTxt = ''
  for (let row = 0; row < wordsearch.board.length; row++) {
    for (let col = 0; col < wordsearch.board[row].length; col++) {
      wordsearchTxt += wordsearch.board[row][col] + ' '
    }
    wordsearchTxt += '\n'
  }
  scene.wordsearch.setText(wordsearchTxt)
}

export function initializeGame (gameID) {
  class Game extends Phaser.Scene {
    create () {
      const scene = this
      this.username = undefined

      this.scale.on('resize', this.resize, this)

      this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor('#FFFFFC')
      this.usernameTxt = this.add.text(50, 50, '', { font: '24px Courier', fill: '#000000' })
      this.opponentTxt = this.add.text(this.cameras.main.width - 150, 50, '', { font: '24px Courier', fill: '#000000' })
      this.header = this.add.text(this.cameras.main.centerX - 280, 60, '', { font: '24px Courier', fill: '#000000' })
      this.wordsearch = this.add.text(this.cameras.main.centerX - 280, 100, '', { font: '48px Courier', fill: '#000000' })
      this.wordBankTxt = this.add.text(this.cameras.main.centerX - 225, 50, '', { font: '24px Courier', fill: '#000000', align: 'center', wordWrap: { width: 450, useAdvancedWrap: true } })

      this.grid = this.add.graphics()
      this.selection = this.add.graphics()
      this.foundWords = this.add.graphics()

      this.startButton = this.add.text(this.cameras.main.centerX - 40, 620, 'Start!', { font: '24px Courier', fill: '#000000' })
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
        }).on('pointerover', () => {
          scene.startButton.setColor('#FF0000')
        }).on('pointerout', () => {
          scene.startButton.setColor('#000000')
        })
      this.joinButton = this.add.text(this.cameras.main.centerX - 40, 620, 'Join Game!', { font: '24px Courier', fill: '#000' })
        .setInteractive()
        .on('pointerup', () => {
          const searchParams = new URLSearchParams(window.location.search)
          scene.username = searchParams.get('username')
          if (!scene.username) {
            scene.username = window.prompt('Please enter your name')
            searchParams.set('username', scene.username)
            const newRelativePathQuery = window.location.pathname + '?' + searchParams.toString()
            history.pushState(null, '', newRelativePathQuery)
          }

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
        }).on('pointerover', () => {
          scene.joinButton.setColor('#FF0000')
        }).on('pointerout', () => {
          scene.joinButton.setColor('#000000')
        })
      this.refreshButton = this.add.text(this.cameras.main.centerX - 40, 10, 'Refresh', { font: '18px Courier', fill: '#000' })
        .setInteractive()
        .on('pointerup', () => {
          scene.updateScene()
          scene.reconnectSocket()
        }).on('pointerover', () => {
          this.refreshButton.setColor('#FF0000')
        }).on('pointerout', () => {
          this.refreshButton.setColor('#000000')
        })

      // mouse movements
      this.input.on('pointermove', (pointer) => {
        if (this.status !== 'started' || this.username === undefined) {
          return
        }
        this.pointerCoord = { x: pointer.x, y: pointer.y }

        if (this.startSelect !== undefined && this.pointerCoord !== undefined) {
          // check if snap vertical or horizontal
          let angle = (Math.atan2(this.pointerCoord.y - this.startSelect.y, this.pointerCoord.x - this.startSelect.x) * 180 / Math.PI)
          if (angle < 0) { angle += 360 }
          const distance = Math.sqrt(Math.pow(this.pointerCoord.x - this.startSelect.x, 2) + Math.pow(this.pointerCoord.y - this.startSelect.y, 2))
          if (angle < 23) { // horizontal
            this.pointerCoord.y = this.startSelect.y
          } else if (angle < 68) { // diagonal
            this.pointerCoord.x = this.startSelect.x + distance * Math.cos(Math.atan(51 / 57))
            this.pointerCoord.y = this.startSelect.y + distance * Math.sin(Math.atan(51 / 57))
          } else if (angle < 113) { // vertical
            this.pointerCoord.x = this.startSelect.x
          } else if (angle < 158) { // diagonal
            this.pointerCoord.x = this.startSelect.x - distance * Math.cos(Math.atan(51 / 57))
            this.pointerCoord.y = this.startSelect.y + distance * Math.sin(Math.atan(51 / 57))
          } else if (angle < 203) { // horizontal
            this.pointerCoord.y = this.startSelect.y
          } else if (angle < 248) { // diagonal
            this.pointerCoord.x = this.startSelect.x - distance * Math.cos(Math.atan(51 / 57))
            this.pointerCoord.y = this.startSelect.y - distance * Math.sin(Math.atan(51 / 57))
          } else if (angle < 293) { // vertical
            this.pointerCoord.x = this.startSelect.x
          } else if (angle < 333) { // diagonal
            this.pointerCoord.x = this.startSelect.x + distance * Math.cos(Math.atan(51 / 57))
            this.pointerCoord.y = this.startSelect.y - distance * Math.sin(Math.atan(51 / 57))
          } else { // horizontal
            this.pointerCoord.y = this.startSelect.y
          }

          this.selection.clear()
          let color = 0xFF0000
          if (scene.username !== undefined && scene.players.length > 0 && scene.username !== scene.players[0]) {
            color = 0x0000FF
          }
          this.selection.lineStyle(5, color)
          this.selection.beginPath()
          this.selection.moveTo(this.startSelect.x, this.startSelect.y)
          this.selection.lineTo(this.pointerCoord.x, this.pointerCoord.y)
          this.selection.closePath()
          this.selection.strokePath()
          this.selection.visible = true
        }
      })

      this.input.on('pointerdown', (pointer) => {
        if (this.status !== 'started' || this.username === undefined) {
          return
        }
        const gridX = Math.floor((pointer.x - (this.cameras.main.centerX - 280 - 10)) / 57)
        const gridY = Math.floor((pointer.y - 100) / 51)
        if (gridX >= 0 && gridX < 10 && gridY >= 0 && gridY < 10) {
          this.startSelect = { x: pointer.x, y: pointer.y, gridX: gridX, gridY: gridY }
        }
      })
      this.input.on('pointerup', (pointer) => {
        if (this.status !== 'started' || this.username === undefined) {
          return
        }
        const gridX = Math.floor((this.pointerCoord.x - (this.cameras.main.centerX - 280 - 10)) / 57)
        const gridY = Math.floor((this.pointerCoord.y - 100) / 51)
        if (this.startSelect !== undefined && gridX >= 0 && gridX < 10 && gridY >= 0 && gridY < 10) {
          // do push selection
          $.ajax({
            url: '/v1/game/' + gameID + '/found_words',
            type: 'POST',
            data: JSON.stringify({
              player_username: scene.username,
              coordinates: {
                start: {
                  x: this.startSelect.gridX,
                  y: this.startSelect.gridY
                },
                end: {
                  x: gridX,
                  y: gridY
                }
              }
            }),
            contentType: 'application/json; charseet=utf-8',
            dataType: 'json',
            success: () => {
              scene.updateScene()
            },
            error: () => {}
          })
        }
        // reset previous selection
        this.selection.visible = false
        this.startSelect = undefined
      })

      // initial update
      scene.reconnectSocket() // subscribe to game's feed
      this.resize(this.cameras)
      scene.updateScene()
    }

    resize (gameSize, baseSize, displaySize, resolution) {
      const width = gameSize.width
      const height = gameSize.height

      this.cameras.resize(width, height)

      this.opponentTxt.setPosition(this.cameras.main.width - 150, 50)
      this.header.setPosition(this.cameras.main.centerX - 280, 60)
      this.wordsearch.setPosition(this.cameras.main.centerX - 280, 100)
      this.startButton.setPosition(this.cameras.main.centerX - 50, 620)
      this.joinButton.setPosition(this.cameras.main.centerX - 80, 620)
      this.wordBankTxt.setPosition(this.cameras.main.centerX - 225, 620)
      this.refreshButton.setPosition(this.cameras.main.centerX - 40, 10)
      drawGrid(this.grid, this.cameras.main.centerX - 280 - 10, 100, 570, 510, 10, 10, { width: 2, fill: 0xFF7F11 })

      drawFoundWords(this, this.foundWords, this.found_words, this.players)
    }

    reconnectSocket () {
      const scene = this
      if (this.socket !== undefined) {
        this.socket.close(1000, 'Reconnecting')
      }
      this.socket = new WebSocket('ws://' + window.location.host + '/game/wss')
      this.socket.onopen = function () {
        scene.socket.send(JSON.stringify({ type: 'subscribe', game_id: gameID }))
      }
      this.socket.onmessage = function (message) {
        const data = JSON.parse(message.data)
        switch (data.type) {
          case 'register':
            scene.updateScene()
            break
          case 'start_game':
            scene.updateScene()
            break
          case 'found_word':
            scene.updateScene()
            break
          default:
            console.log(message)
        }
      }
    }

    updateScene () {
      const scene = this

      // fetch game data
      $.get('/v1/game/' + gameID).then(data => {
        data = JSON.parse(data)
        console.log(data)
        scene.status = data.status
        scene.players = data.players
        scene.found_words = data.found_words

        // handle query username

        const searchParams = new URLSearchParams(window.location.search)
        const queryUsername = searchParams.get('username')
        if (queryUsername !== undefined && (data.players[0] === queryUsername || data.players[1] === queryUsername)) {
          scene.username = queryUsername
        } else {
        // unset query parameter
          searchParams.delete('username')
          const newRelativePathQuery = window.location.pathname + '?' + searchParams.toString()
          history.pushState(null, '', newRelativePathQuery)
        }

        // count score
        let numP1 = 0
        let numP2 = 0
        if (data.found_words !== undefined) {
          data.found_words.forEach((w) => {
            if (w.player === data.players[0]) {
              numP1++
            } else {
              numP2++
            }
          })
        }
        scene.p1Score = numP1
        scene.p2Score = numP2

        // fill in the usernames
        if (scene.username !== undefined) {
          if (data.players.length > 0 && scene.username === data.players[0]) {
            scene.usernameTxt.setText(scene.username + ': ' + scene.p1Score)
            scene.usernameTxt.setColor('#FF0000')
            if (data.players.length > 1) {
              scene.opponentTxt.setText(data.players[1] + ': ' + scene.p2Score)
              scene.opponentTxt.setColor('#0000FF')
            }
          } else {
            scene.usernameTxt.setText(scene.username + ': ' + scene.p2Score)
            scene.usernameTxt.setColor('#0000FF')
            if (data.players.length > 1) {
              scene.opponentTxt.setText(data.players[0] + ': ' + scene.p1Score)
              scene.opponentTxt.setColor('#FF0000')
            }
          }
        } else {
          if (data.players.length > 0) {
            scene.usernameTxt.setText(scene.players[0] + ': ' + scene.p1Score)
            scene.usernameTxt.setColor('#FF0000')
          }
          if (data.players.length > 1) {
            scene.opponentTxt.setText(scene.players[1] + ': ' + scene.p2Score)
            scene.opponentTxt.setColor('#0000FF')
          }
        }

        // show hide controls as per status
        if (data.status === 'lobby') {
          if (data.players.length < 2) {
            if (scene.username === undefined) {
              this.startButton.visible = false
              this.joinButton.visible = true

              scene.header.setText('Spectating... Join the game to play.')
            } else {
              this.startButton.visible = false
              this.joinButton.visible = false

              scene.header.setText(`Welcome ${scene.username}. Waiting for an opponent...`)
            }
          } else {
            if (scene.username === undefined) {
              this.startButton.visible = false
              this.joinButton.visible = false

              scene.header.setText('Spectating... Waiting for game to start')
            } else {
              this.startButton.visible = true
              this.joinButton.visible = false

              let opponent = data.players[0]
              if (data.players[0] === scene.username) {
                opponent = data.players[1]
              }
              scene.header.setText(`${scene.username} vs ${opponent}! Press start to play`)
            }
          }
        } else if (data.status === 'started') {
          this.startButton.visible = false
          this.joinButton.visible = false

          if (scene.username === undefined) {
            scene.header.setText(`Spectating... ${data.players[0]} vs ${data.players[1]}`)
          } else {
            scene.header.setText(`${data.players[0]} vs ${data.players[1]}`)
          }
          drawWordSearch(scene, data.wordsearch)
          drawFoundWords(scene, scene.foundWords, data.found_words, data.players)

          // add wordbank
          scene.wordBankTxt.setText(data.wordsearch.words.filter(word => {
            let alreadyFound = false
            data.found_words.forEach(w => {
              if (w.value.toLowerCase() === word) {
                alreadyFound = true
              }
            })
            return !alreadyFound
          }).join(' '))
        } else if (data.status === 'ended') {
          this.startButton.visible = false
          this.joinButton.visible = false

          if (numP1 > numP2) {
            scene.header.setText('Game is over! ' + data.players[0] + 'won!')
          } else if (numP1 < numP2) {
            scene.header.setText('Game is over! ' + data.players[1] + 'won!')
          } else {
            scene.header.setText('Game is over! Tie!')
          }

          drawWordSearch(scene, data.wordsearch)
          drawFoundWords(scene, scene.foundWords, data.found_words, data.players)
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
