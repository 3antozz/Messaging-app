const db = require('../db/queries');
const fn = require('../routes/fn');
const { validationResult } = require('express-validator');
const { cloudinary } = require('../routes/uploadConfig')


exports.getPublicGroup = async(req, res) => {
    const group = await db.getPublicGroup();
    res.json({group})
}

exports.getGroup = async(req, res) => {
    const groupId = +req.params.groupId;
    const group = await db.getGroup(req.user.id, groupId);
    const newGroup = { ...group, creationDate: fn.formatDateWithoutTime(group.creationDate)}
    return res.json({group: newGroup});
}

exports.createGroup = async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const { name } = req.body;
    const userId = req.user.id;
    const group = await db.createGroup(userId, name);
    return res.json({group})
}

exports.addUser = async(req, res) => {
    const groupId = +req.params.groupId;
    const userId = +req.params.userId;
    const group = await db.addUser(groupId, userId)
    const io = req.app.get('io');
    io.to(`user${userId}`).emit('new group', group);
    io.to(`convo${groupId}`).emit('new member', groupId);
    res.json({group});
}

exports.removeUser = async(req, res) => {
    const groupId = +req.params.groupId;
    const userId = +req.params.userId;
    await db.removeUser(groupId, userId)
    const io = req.app.get('io');
    io.to(`user${userId}`).emit('removed group', groupId);
    io.to(`convo${groupId}`).emit('new member', groupId);
    res.json({done: true});
}

exports.updateGroupPicture = async(req, res, next) => {
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
}

exports.updateGroup = async(req, res, next) => {
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
    io.to(`convo${groupId}`).emit('new member', groupId);
    io.to(`convo${groupId}`).emit('group update', group);
    res.send({done: true})
}