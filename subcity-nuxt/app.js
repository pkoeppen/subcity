const express = require('express')
const app = express()
const { Nuxt } = require('nuxt')
const path = require('path')

app.use('/static', express.static(path.join(__dirname, '.nuxt', 'dist')))
const config = require('./nuxt.config.js')
const nuxt = new Nuxt(config)
app.use((req, res) => setTimeout(() => nuxt.render(req, res), 0))

module.exports = app
