const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const db = require('../db/queries')
const fn = require('./fn')

const router = Router();


router.get('/:convoId', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const convoId = +req.params.convoId;
    const convo = await db.getConversation(req.user.id, convoId);
    const formattedMessages = convo.messages.map((message) => ({ ...message, date: fn.formatDate(message.date)}))
    const newConvo = { ...convo, messages: formattedMessages}
    setTimeout(() => res.json({conversation: newConvo}), 1500)
    // return res.json({conversation: newConvo});
}))


module.exports = router;