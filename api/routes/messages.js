const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const controller = require('../controllers/messagesController')
const fn = require('./fn')
const { upload, cloudinary } = require('./uploadConfig')

const router = Router();


router.post('/:convoId', fn.isAuthenticated, asyncHandler(controller.postMessage))
router.post('/upload/:convoId',fn.isAuthenticated, upload.single('image'), asyncHandler(async(req, res) => {
    const convoId = req.params.convoId;
    const options = {
        use_filename: false,
        overwrite: true,
        asset_folder: `AntodiA/conversations/${convoId}`,
        transformation: [
            {width: req.file.width > 1080 ? 1080 : req.file.width},
            {crop: 'limit'},
            {fetch_format: 'auto'},
            {quality: 'auto'}
        ]
    };
    const uploadResult = await new Promise((resolve) => {
        cloudinary.uploader.upload_stream(options, (error, uploadResult) => {
            return resolve(uploadResult);
        }).end(req.file.buffer);
    });
    return res.json({url: uploadResult.secure_url})
}))

module.exports = router;