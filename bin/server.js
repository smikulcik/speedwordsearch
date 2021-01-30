const process = require('process')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const routes = require('../src/api/routes')

const port = process.env.PORT || 3000

app.use(bodyParser.json())

routes.addRoutes(app)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
