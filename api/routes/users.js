const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const fn = require('./fn')
const { body } = require('express-validator');
const { upload } = require('./uploadConfig')
const controller = require('../controllers/usersController')

const validateProfileEdit = [
    body("first_name").trim().notEmpty().withMessage("First Name must not be empty").bail().isAlpha().withMessage("First Name must only contain alphabet and no spaces").isLength({min: 2, max: 20}).withMessage("First name must be between 2 and 20 characters"),
    body("last_name").trim().notEmpty().withMessage("Last Name must not be empty").bail().isAlpha().withMessage("Last Name must only contain alphabet and no spaces").isLength({min: 2, max: 20}).withMessage("Last name must be between 2 and 20 characters"),
    body("bio").trim().isLength({max: 300}).withMessage("Bio must not be more than 300 characters")
];

const router = Router();

router.get('/', fn.isAuthenticated , asyncHandler(controller.getAllUsers))

router.get('/user', fn.isAuthenticated, asyncHandler(controller.getClient))

router.get('/:userId', asyncHandler(controller.getProfile))

router.put('/:userId/upload', fn.isAuthenticated, upload.single('image'), validateProfileEdit, asyncHandler(controller.editProfilePicture))

router.put('/:userId', fn.isAuthenticated, validateProfileEdit, asyncHandler(controller.updateProfile))



module.exports = router;