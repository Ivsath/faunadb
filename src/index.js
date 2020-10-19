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
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { user, text } = req.body

      const data = {
        user: Select('ref', Call(Fn('getUser'), user)),
        text,
      }

      const doc = await client.query(Create(Collection('tweets'), { data }))

      res.send(doc)
    } catch (err) {
      console.error(err)
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
    console.error(err)
  }
})

app.get('/users/:name/tweets', async (req, res) => {
  try {
    const docs = await client.query(
      Paginate(
        Match(
          Index('tweets_by_user'),
          Select('ref', Call(Fn('getUser'), req.params.name)),
        ),
      ),
    )

    res.send(docs)
  } catch (err) {
    console.error(err)
  }
})

app.post('/relationship', async (req, res) => {
  try {
    const data = {
      follower: Call(Fn('getUser'), 'ivsath'),
      followee: Call(Fn('getUser'), 'gaby'),
    }
    const doc = await client.query(
      Create(Collection('relationships'), { data }),
    )

    res.send(doc)
  } catch (err) {
    console.error(err)
  }
})

app.get('/feed', async (req, res) => {
  try {
    const docs = await client.query(
      Paginate(
        Join(
          Match(Index('followees_by_follower'), Call(Fn('getUser'), 'gaby')),
          Index('tweets_by_user'),
        ),
      ),
    )
    // Select('ref', Call(Fn('getUser'), 'ivsath')),
    res.send(docs)
  } catch (err) {
    console.error(err)
    console.log(err.requestResult.responseContent.errors[0])
  }
})

app.listen(process.env.PORT, () =>
  console.log(`[api] : http://localhost:${process.env.PORT}`),
)
