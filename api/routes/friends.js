const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const fn = require('./fn')
const controller = require('../controllers/friendsController')



const router = Router();


router.put('/add', fn.isAuthenticated, asyncHandler(controller.addFriend))

router.put('/remove', fn.isAuthenticated, asyncHandler(controller.removeFriend))



module.exports = router;