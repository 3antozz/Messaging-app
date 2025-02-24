const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const controller = require('../controllers/messagesController')
const fn = require('./fn')
const { upload, cloudinary } = require('./uploadConfig')

const router = Router();


router.post('/:convoId', fn.isAuthenticated, asyncHandler(controller.postMessage))
router.post('/upload/:convoId', upload.single('image'), asyncHandler(async(req, res) => {
    const convoId = req.params.convoId;
    const options = {
        use_filename: false,
        overwrite: true,
        asset_folder: `AntodiA/conversations/${convoId}`
    };
    try {
        const uploadResult = await new Promise((resolve) => {
            cloudinary.uploader.upload_stream(options, (error, uploadResult) => {
                return resolve(uploadResult);
            }).end(req.file.buffer);
        });
        return res.json({url: uploadResult.secure_url})
    } catch (error) {
        console.log(error);
    }
}))

module.exports = router;