const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const db = require('../db/queries')
const fn = require('./fn')



const router = Router();

router.get('/', fn.isAuthenticated , asyncHandler(async(req, res) => {
    const users = await db.getAllUsers(req.user.id);
    return res.json({users})
}))

router.get('/user', fn.isAuthenticated, (req, res) => {
    const newUser = fn.mergeFriends(req.user);
    res.json({user: newUser})
})

router.get('/:userId', asyncHandler(async(req, res) => {
    const userId = +req.params.userId;
    const profile = await db.getUserProfile(userId);
    const formattedDate = fn.formatDateWithoutTime(profile.joinDate);
    const newProfile = {...profile, joinDate: formattedDate}
    return res.json({profile: newProfile})
}))



module.exports = router;