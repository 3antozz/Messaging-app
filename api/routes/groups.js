const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const fn = require('./fn')
const { body } = require('express-validator');
const { upload } = require('./uploadConfig')
const controller = require('../controllers/groupsController')

const router = Router();

const validateGroupName = body("name").trim().notEmpty().withMessage("Name must not be empty").bail().isLength({min: 3, max: 30}).withMessage("Group name must be between 3 and 30 characters");

router.get('/public', asyncHandler(controller.getPublicGroup))

router.get('/:groupId', fn.isAuthenticated, asyncHandler(controller.getGroup))

router.post('/', fn.isAuthenticated, validateGroupName, asyncHandler(controller.createGroup))

router.put('/:groupId/add-member/:userId', fn.isAuthenticated, asyncHandler(controller.addUser))

router.put('/:groupId/remove-member/:userId', fn.isAuthenticated, asyncHandler(controller.removeUser))

router.put('/upload/:groupId', fn.isAuthenticated, upload.single('image'), validateGroupName, asyncHandler(controller.updateGroupPicture))

router.put('/edit/:groupId', fn.isAuthenticated, validateGroupName, asyncHandler(controller.updateGroup))


module.exports = router;