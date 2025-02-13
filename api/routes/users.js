const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const db = require('../db/queries')
const fn = require('./fn')



const router = Router();

router.get('/', fn.isAuthenticated , asyncHandler(async(req, res) => {
    const users = await db.getAllUsers(req.user.id);
    return res.json({users})
}))



module.exports = router;