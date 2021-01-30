const process = require('process')
const express = require('express')
const bodyParser = require('body-parser')
const api = require('../src/api/routes')
const ui = require('../src/ui/routes')

const app = express()

const port = process.env.PORT || 3000

app.use(bodyParser.json())

api.addRoutes(app)
ui.addRoutes(app)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
