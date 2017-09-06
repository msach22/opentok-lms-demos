/**
 * OpenTok proctoring demo main server script
 */

const express = require('express')
const OpenTok = require('opentok')

// Get configurations
const PORT = process.env.PORT || 8080

const OPENTOK_API_KEY = process.env.OPENTOK_API_KEY
if (!OPENTOK_API_KEY) {
  throw new Error('Provide OPENTOK_API_KEY environment variable')
}

const OPENTOK_API_SECRET = process.env.OPENTOK_API_SECRET
if (!OPENTOK_API_SECRET) {
  throw new Error('Provide OPENTOK_API_SECRET environment variable')
}

// Bootstrap app
function bootstrap (session) {
  // Create expressJS app instance
  const app = express()

  // Mount the `./web` dir to web-root as static.
  app.use('/', express.static('./web'))

  app.get('/sessionId', (req, res) => {
    res.status(200).json({
      sessionId: session.sessionId
    })
  })

  app.get('/token', (req, res) => {
    try {
      const token = OT.generateToken(session.sessionId, {
        role: 'publisher',
        expireTime: Math.round((Date.now() / 1000) + (60 * 60)) // 1 hour from now()
      })
      res.status(200).json({
        token: token,
        sessionId: session.sessionId,
        role: 'publisher'
      })
    } catch (e) {
      console.log('Error creating token', e)
      res.status(500).json({ error: e.message })
    }
  })

  return app
}

// Generate an OpenTok session. Will will use a single session only
const OT = new OpenTok(OPENTOK_API_KEY, OPENTOK_API_SECRET)
OT.createSession({ mediaMode: 'router' }, (err, session) => {
  if (err) {
    console.log('Error creating OpenTok session', err)
    process.exit(1)
  }

  // Bootstrap and start HTTP server for app
  bootstrap(session).listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
  })
})
