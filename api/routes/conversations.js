const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const fn = require('./fn')
const controller = require('../controllers/conversationsController')

const router = Router();

router.post('/:userId', fn.isAuthenticated, asyncHandler(controller.createConversation))

router.get('/public', asyncHandler(controller.getPublicConversation))

router.get('/:convoId', fn.isAuthenticated, asyncHandler(controller.getConversation))


module.exports = router;