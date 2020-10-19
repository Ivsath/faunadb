require('dotenv').config()

const express = require('express')
const { body, validationResult } = require('express-validator')
const faunadb = require('faunadb')

const app = express()
const client = new faunadb.Client({ secret: process.env.FAUNA_SECRET_KEY })

// FQL functions
const {
  Ref,
  Paginate,
  Get,
  Match,
  Select,
  Index,
  Create,
  Collection,
  Join,
  Call,
  Function: Fn,
} = faunadb.query

app.use(express.json())

app.post(
  '/tweets',
  [body('user').not().isEmpty(), body('text').isLength({ min: 5, max: 280 })],
  async (req, res) => {
    try {
      // Finds the validation errors in this request and wraps them in an object with handy functions
      const errors = validationResult(req)
      console.log(req.body)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { user, text } = req.body

      const data = {
        user: Select('ref', Get(Match(Index('users_by_name'), user))),
        text,
      }

      const doc = await client.query(Create(Collection('tweets'), { data }))

      res.json(doc)
    } catch (err) {
      console.log(err)
    }
  },
)

app.get('/tweets/:id', async (req, res) => {
  try {
    const doc = await client.query(
      Get(Ref(Collection('tweets'), req.params.id)),
    )

    res.send(doc)
  } catch (err) {
    console.log(err)
  }
})

app.get('/users/:name/tweets', async (req, res) => {
  try {
    const docs = await client.query(
      Paginate(
        Match(
          Index('tweets_by_user'),
          Select('ref', Get(Match(Index('users_by_name'), req.params.name))),
        ),
      ),
    )

    res.send(docs)
  } catch (err) {
    console.log(err)
  }
})

app.listen(process.env.PORT, () =>
  console.log(`[api] : http://localhost:${process.env.PORT}`),
)
