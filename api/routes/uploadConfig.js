const cloudinary = require('cloudinary').v2;
const multer  = require('multer');
const upload = multer();

cloudinary.config({
    secure: true
});


module.exports = {upload, cloudinary}



