const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const controller = require('../controllers/messagesController')
const fn = require('./fn')
const { upload } = require('./uploadConfig')

const router = Router();


router.post('/:convoId', fn.isAuthenticated, asyncHandler(controller.postMessage)) // unused


router.post('/upload/:convoId',fn.isAuthenticated, upload.single('image'), asyncHandler(controller.sendImage))

module.exports = router;