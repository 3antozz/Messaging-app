const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const db = require('../db/queries')
const fn = require('./fn')



const router = Router();


router.put('/add', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const { friendId } = req.body;
    await db.addFriend(req.user.id, +friendId);
    return res.json({done: true})
}))

router.put('/remove', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const { friend_username } = req.body;
    await db.removeFriend(req.user.username, friend_username);
    return res.json({done: true})
}))



module.exports = router;