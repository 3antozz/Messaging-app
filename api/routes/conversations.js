const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const db = require('../db/queries')
const fn = require('./fn')

const router = Router();

router.post('/:userId', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const user1 = +req.user.id;
    const user2 = +req.params.userId;
    const conversation = await db.createConversation(user1, user2)
    const io = req.app.get('io');
    io.to(`user${user2}`).emit('new convo', JSON.stringify(JSON.parse(JSON.stringify(conversation))))
    setTimeout(() => res.json({conversation}), 2500)
    // res.json({conversation})
}))

router.get('/public', asyncHandler(async(req, res) => {
    const convo = await db.getPublicConversation();
    const formattedMessages = convo.messages.map((message) => ({ ...message, date: fn.formatDate(message.date)}))
    const conversation = { ...convo, messages: formattedMessages}
    setTimeout(() => res.json({conversation}), 2500)
    // res.json({conversation})
}))


router.get('/:convoId', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const convoId = +req.params.convoId;
    const convo = await db.getConversation(req.user.id, convoId);
    const formattedMessages = convo.messages.map((message) => ({ ...message, date: fn.formatDate(message.date)}))
    const newConvo = { ...convo, messages: formattedMessages}
    setTimeout(() => res.json({conversation: newConvo}), 1500)
    // return res.json({conversation: newConvo});
}))


module.exports = router;