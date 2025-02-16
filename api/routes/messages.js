const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const controller = require('../controllers/messagesController')
const fn = require('./fn')

const router = Router();


router.post('/:convoId', fn.isAuthenticated, asyncHandler(controller.postMessage))

module.exports = router;