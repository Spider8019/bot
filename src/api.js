const express = require('express')
const serverless = require('serverless-http')
// Create an instance of the Express app
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const axios = require('axios')
const msgs = require('./msgs.json')
const DB_BACK = 'https://books-temp-dev.vercel.app/'

const client = new Client({
  // authStrategy: new LocalAuth(),
  // puppeteer: {
  //   headless: false,
  // },
})

client.on('qr', (qr) => {
  console.log('QR RECEIVED', qr)
  qrcode.generate(qr, { small: true })
})

client.on('authenticated', () => {
  console.log('AUTHENTICATED')
})

client.on('ready', () => {
  console.log('Client is ready!')
})

client.on('message', async (msg) => {
  switch (true) {
    case msg.body.toLowerCase() === 'hi_pp':
      client.sendMessage(msg.from, msgs.welcome_navigator)
      axios
        .post(`${DB_BACK}createcustomer/`, {
          phonenumber: msg.from,
        })
        .then(async (res) => {
          console.log(res.data)
        })
        .catch((error) => {
          console.error(error)
        })
      break
    case msg.body.toLowerCase().startsWith('1_pp_'):
      if (msg.body) {
        axios
          .get(`${DB_BACK}novel/${encodeURIComponent(msg.body.slice(5))}`)
          .then(async (res) => {
            if (res.data.error) {
              client.sendMessage(
                msg.from,
                'No Book matching your query was found in the database.',
              )
            } else {
              const media = await MessageMedia.fromUrl(res.data[0].url)
              client.sendMessage(msg.from, media, {
                caption: `Title : ${res.data[0].title}\nAuthor : ${res.data[0].author}\nPublication : ${res.data[0].publication}\nISBN : ${res.data[0].isbn}
                `,
              })
            }
          })
          .catch((error) => {
            client.sendMessage(
              msg.from,
              'No Book matching your query was found in the database.' + error,
            )
          })
      }
      break
    case msg.body.toLowerCase() === '2_pp':
      if (msg.body) {
        axios
          .get(`${DB_BACK}userdetail/${encodeURIComponent(msg.from)}`)
          .then(async (res) => {
            console.log(res.data)
            if (res.data.error) {
              client.sendMessage(msg.from, 'Error')
            } else {
              client.sendMessage(
                msg.from,
                `Name : ${res.data[0].name}\nPhoneNumber : ${res.data[0].phonenumber}\nWalletBalance : ${res.data[0].wallet_balance}
                `,
              )
            }
          })
          .catch((error) => {
            client.sendMessage(
              msg.from,
              'No Book matching your query was found in the database.' + error,
            )
          })
      }
      break
  }
})

const app = express()
// Create a router to handle routes
const router = express.Router()

// Define a route that responds with a JSON object when a GET request is made to the root path

router.get('/xyz', (req, res) => {
  client.initialize()
  res.send('hello html')
})

router.get('/', (req, res) => {
  res.json({
    hello: 'hi!',
  })
})

// Use the router to handle requests to the `/.netlify/functions/api` path
app.use(`/.netlify/functions/api`, router)

// Export the app and the serverless function
module.exports = app
module.exports.handler = serverless(app)
