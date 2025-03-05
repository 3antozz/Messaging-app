const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const db = require('../db/queries')
const fn = require('./fn')
const {body, validationResult} = require('express-validator');
const { upload, cloudinary } = require('./uploadConfig')

const router = Router();

const validateGroupName = body("name").trim().notEmpty().withMessage("Name must not be empty").bail().isLength({min: 3, max: 30}).withMessage("Group name must be between 3 and 30 characters");

router.get('/public', asyncHandler(async(req, res) => {
    const group = await db.getPublicGroup();
    setTimeout(() => res.json({group}), 2000)
    // res.json({group})
}))

router.get('/:groupId', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const groupId = +req.params.groupId;
    const group = await db.getGroup(req.user.id, groupId);
    const newGroup = { ...group, creationDate: fn.formatDateWithoutTime(group.creationDate)}
    setTimeout(() => res.json({group: newGroup}), 1500)
    // return res.json({conversation: newgroup});
}))


router.post('/', fn.isAuthenticated, validateGroupName, asyncHandler(async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const { name } = req.body;
    const userId = req.user.id;
    const group = await db.createGroup(userId, name);
    setTimeout(() => res.json({group}), 2500)
    // return res.json({group})
}))

router.put('/:groupId/add-member/:userId', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const groupId = +req.params.groupId;
    const userId = +req.params.userId;
    const group = await db.addUser(groupId, userId)
    const io = req.app.get('io');
    // io.to(`user${userId}`).emit('new group', group);
    // io.to(`convo${groupId}`).emit('new member', groupId);
    setTimeout(() => {
        io.to(`convo${groupId}`).emit('new member', groupId);
        res.json({group})
    }, 2500)
    // res.json({group});
}))

router.put('/:groupId/remove-member/:userId', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const groupId = +req.params.groupId;
    const userId = +req.params.userId;
    const group = await db.removeUser(groupId, userId)
    const io = req.app.get('io');
    // io.to(`user${userId}`).emit('removed group', groupId);
    // io.to(`convo${groupId}`).emit('new member', groupId);
    setTimeout(() => {
        io.to(`convo${groupId}`).emit('new member', groupId);
        res.json({done: true})
    }, 2500)
    // res.json({group});
}))

router.put('/upload/:groupId', fn.isAuthenticated, upload.single('image'), validateGroupName, asyncHandler(async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const groupId = +req.params.groupId;
    const { name } = req.body;
    const options = {
        public_id: `${groupId}`,
        overwrite: true,
        asset_folder: `AntodiA/profile-pictures/group${groupId}`,
        transformation: [
            { width: 300, height: 300, crop: 'auto_pad', gravity: 'auto' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    };
    const uploadResult = await new Promise((resolve) => {
        cloudinary.uploader.upload_stream(options, (error, uploadResult) => {
            return resolve(uploadResult);
        }).end(req.file.buffer);
    });
    const group = await db.updateGroup(groupId, name, uploadResult.secure_url)
    const io = req.app.get('io');
    io.to(`convo${groupId}`).emit('new member', groupId);
    io.to(`convo${groupId}`).emit('group update', group);
    res.send({done: true})
}))

router.put('/edit/:groupId', fn.isAuthenticated, validateGroupName, asyncHandler(async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const groupId = +req.params.groupId;
    const { name } = req.body;
    const group = await db.updateGroup(groupId, name)
    const io = req.app.get('io');
    setTimeout(() => {
        io.to(`convo${groupId}`).emit('new member', groupId);
        io.to(`convo${groupId}`).emit('group update', group);
        res.send({done: true})
    }, 2500)
    // io.to(`convo${groupId}`).emit('new member', groupId);
    // io.to(`convo${groupId}`).emit('group update', group);
    // res.send({done: true})
}))


module.exports = router;