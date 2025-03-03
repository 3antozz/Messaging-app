const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const db = require('../db/queries')
const fn = require('./fn')
const { upload, cloudinary } = require('./uploadConfig')



const router = Router();

router.get('/', fn.isAuthenticated , asyncHandler(async(req, res) => {
    const users = await db.getAllUsers(req.user.id);
    return res.json({users})
}))

router.get('/user', fn.isAuthenticated, (req, res) => {
    const newUser = fn.mergeFriends(req.user);
    setTimeout(() => res.json({user: newUser}), 2500)
    // res.json({user: newUser})
})

router.get('/:userId', asyncHandler(async(req, res) => {
    const userId = +req.params.userId;
    const profile = await db.getUserProfile(userId);
    const formattedDate = fn.formatDateWithoutTime(profile.joinDate);
    const newProfile = {...profile, joinDate: formattedDate}
    setTimeout(() => res.json({profile: newProfile}), 2500)
    // return res.json({profile: newProfile})
}))

router.put('/:userId/upload', fn.isAuthenticated, upload.single('image'), asyncHandler(async(req, res) => {
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
    console.log(uploadResult);
    const user = await db.updateProfile(userId, first_name, last_name, bio, uploadResult.secure_url)
    console.log(user);
    const io = req.app.get('io');
    io.emit('edit user', user);
    res.send({user})
}))

router.put('/:userId', fn.isAuthenticated, asyncHandler(async(req, res) => {
    const userId = +req.params.userId;
    const { first_name, last_name, bio } = req.body;
    const user = await db.updateProfile(userId, first_name, last_name, bio)
    console.log(user);
    const io = req.app.get('io');
    io.emit('edit user', user);
    res.send({user})
}))



module.exports = router;