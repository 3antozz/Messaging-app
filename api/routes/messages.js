const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const db = require('../db/queries')
const fn = require('./fn')

const router = Router();


router.post('/:convoId', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const convoId = +req.params.convoId;
    const { content } = req.body;
    const senderId = +req.user.id
    await db.addMessage(convoId, content, senderId);
    res.json({done: true})
}))

module.exports = router;