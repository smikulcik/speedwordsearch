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
}
