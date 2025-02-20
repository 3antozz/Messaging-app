const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const db = require('../db/queries')
const fn = require('./fn')



const router = Router();


router.put('/add', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const { friendId } = req.body;
    const { conversationId, user2 } = await db.addFriend(req.user.id, +friendId);
    const friend = {conversationId, ...user2}
    return res.json({friend})
}))

router.put('/remove', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const { friendId } = req.body;
    await db.removeFriend(req.user.id, +friendId);
    return res.json({done: true})
}))



module.exports = router;