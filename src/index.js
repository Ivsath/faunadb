require('dotenv').config()

const app = require('express')()
const faunadb = require('faunadb')

const client = new faunadb.Client({ secret: process.env.FAUNA_SECRET_KEY })

app.listen(process.env.PORT, () =>
  console.log(`[api] : http://localhost:${process.env.PORT}`),
)
