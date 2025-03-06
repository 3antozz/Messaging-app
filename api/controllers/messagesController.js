const db = require('../db/queries')
const { cloudinary } = require('../routes/uploadConfig')
exports.postMessage = async(req, res) => { // unused
    const convoId = +req.params.convoId;
    const { content } = req.body;
    const senderId = +req.user.id
    await db.addMessage(convoId, content, senderId);
    res.json({done: true})
}


exports.postMessageSocket = async (convoId, content, senderId, date, url) => {
    return await db.addMessage(convoId, content, senderId, new Date(date), url);
}

exports.sendImage = async(req, res) => {
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
}