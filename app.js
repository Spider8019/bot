const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const axios = require('axios')
const msgs = require('./msgs.json')
const DB_BACK = 'https://books-temp-dev.vercel.app/'
const express = require('express')
const app = express()
const port = process.env.PORT || 4000

const client = new Client({
  // authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false,
  },
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


app.listen(port, () => {
  console.log('server is listening on 4000')
})

app.get('/xyz', (req, res) => {
  client.initialize()
  res.send('hello html')
})