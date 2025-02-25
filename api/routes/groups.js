const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const db = require('../db/queries')
const fn = require('./fn')

const router = Router();


router.get('/:groupId', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const groupId = +req.params.groupId;
    const group = await db.getGroup(req.user.id, groupId);
    const newGroup = { ...group, creationDate: fn.formatDateWithoutTime(group.creationDate)}
    setTimeout(() => res.json({group: newGroup}), 1500)
    // return res.json({conversation: newgroup});
}))

router.post('/', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const { name } = req.body;
    const userId = req.user.id;
    const group = await db.createGroup(userId, name);
    return res.json({group})
}))


module.exports = router;