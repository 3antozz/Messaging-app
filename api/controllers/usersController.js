const db = require('../db/queries');
const fn = require('../routes/fn');
const { validationResult } = require('express-validator');
const { cloudinary } = require('../routes/uploadConfig')


exports.getAllUsers = async(req, res) => {
    const users = await db.getAllUsers(req.user.id);
    return res.json({users})
}


exports.getClient = (req, res) => {
    const newUser = fn.mergeFriends(req.user);
    res.json({user: newUser})
}

exports.getProfile = async(req, res) => {
    const userId = +req.params.userId;
    const profile = await db.getUserProfile(userId);
    const formattedDate = fn.formatDateWithoutTime(profile.joinDate);
    const newProfile = {...profile, joinDate: formattedDate}
    return res.json({profile: newProfile})
}

exports.editProfilePicture = async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const userId = +req.params.userId;
    const { first_name, last_name, bio } = req.body;
    const options = {
        public_id: `${userId}`,
        overwrite: true,
        asset_folder: `AntodiA/profile-pictures/user${userId}`,
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
    const user = await db.updateProfile(userId, first_name, last_name, bio, uploadResult.secure_url)
    const io = req.app.get('io');
    io.emit('edit user', user);
    res.send({user})
}

exports.updateProfile = async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const userId = +req.params.userId;
    const { first_name, last_name, bio } = req.body;
    const user = await db.updateProfile(userId, first_name, last_name, bio)
    const io = req.app.get('io');
    io.emit('edit user', user);
    res.send({user})
}