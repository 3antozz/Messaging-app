const { Router } = require('express')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt');
const db = require('../db/queries')
const {body, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
require("dotenv").config();

const router = Router();

const validateLogin = [body("username").trim().notEmpty().withMessage("Username must not be empty").bail().matches(/^[a-zA-Z0-9_]+$/). 
withMessage("Incorrect Username").bail().isLength({min: 3, max: 20}).withMessage("Incorrect Username"),
    body("password").trim().notEmpty().withMessage("Password must not be empty")
];

const validateRegistration = [
    body("first_name").trim().notEmpty().withMessage("First Name must not be empty").bail().isAlpha().withMessage("First Name must only contain alphabet and no spaces").isLength({min: 2, max: 20}).withMessage("First name must be between 2 and 20 characters"),
    body("last_name").trim().notEmpty().withMessage("Last Name must not be empty").bail().isAlpha().withMessage("Last Name must only contain alphabet and no spaces").isLength({min: 2, max: 20}).withMessage("Last name must be between 2 and 20 characters"),
    body("username").trim().notEmpty().withMessage("Username must not be empty").bail().matches(/^[a-zA-Z0-9_]+$/).withMessage("Username must only contain alphabet and numbers and no spaces").isLength({min: 3, max: 15}).withMessage("Username must be between 3 and 15 characters"),
    body("password").trim().notEmpty().withMessage("Password must not be empty").bail().isLength({min: 6}).withMessage("Password must be atleast 6 characters long"),
    body('confirm_password').custom((value, { req }) => {
        return value === req.body.password;
      }).withMessage("Passwords don't match")
];


router.post('/register', validateRegistration, asyncHandler(async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const { username, first_name, last_name, password } = req.body;
        const hashedPW = await bcrypt.hash(password, 15)
        const user = await db.createUser(username, first_name, last_name, hashedPW);
        const io = req.app.get('io');
        io.emit('new user', user);
        return res.json({done: true});
}))

router.post('/login', validateLogin, asyncHandler(async(req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.errors.map(err => err.msg);
        errors.code = 400;
        return next(errors)
    }
    const { username, password } = req.body;
    const user = await db.getUser(username)
    if(!user) {
        const error = new Error('Incorrect Username')
        error.code = 400;
        throw error;
    }
    const checkPW = await bcrypt.compare(password, user.password);;
    if(!checkPW) {
        const error = new Error('Incorrect Password')
        error.code = 400;
        throw error;
    }
    const payload = {
        username: user.username
    }
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_KEY, { expiresIn: "7d"})
    res.cookie('jwt', refreshToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 1000 * 60 * 60 * 24 * 7}) // 7 days
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, { expiresIn: 900})
    return res.json({accessToken})
}))

router.post('/refresh', asyncHandler(async(req, res, next) => {
    if(!req.cookies.jwt) {
        const error = new Error('Unauthorized Access')
        error.code = 401;
        throw error;
    }
    const refreshToken = req.cookies.jwt;
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, async(err, decoded) => {
        if(err) {
            const error = new Error(err.message)
            error.code = 401;
            return next(error)
        }
        try {
            const user = await db.getUser(decoded.username);
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, { expiresIn: 900})
            return res.json({accessToken})
        } catch(err) {
            return next(err)
        }
    })
}))

router.post('/logout', asyncHandler((req, res) => {
    if(!req.cookies.jwt) {
        const error = new Error('You are not logged in')
        error.code = 401;
        throw error;
    }
    res.clearCookie('jwt', { httpOnly: true, secure: true, sameSite: 'none' })
    res.json({done: true})
}))








module.exports = router;