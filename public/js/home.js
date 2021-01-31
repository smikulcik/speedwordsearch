import $ from './jq.module.js'

export function initializeHome () {
  $('#new_game').on('click', (event) => {
    event.preventDefault()
    $.post('/v1/game', (data) => {
      data = JSON.parse(data)
      console.log(data)
      window.location.href = '/' + data.id
    })
  })
  $('#joinBtn').on('click', (event) => {
    event.preventDefault()
    const gameID = $('#join>input').val()

    $.get('/v1/game/' + gameID).then(() => {
      // if exists, redirect
      window.location = '/' + gameID
    }).catch(() => {
      alert('Game with ID=' + gameID + ' does not exist')
    })
  })
}
