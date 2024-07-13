const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/userModel')
const AppError = require('../utils/appError')
const catchAsync = require("../utils/catchAsync")
const { promisify } = require('util');


function signToken(id) {
    try {
        return jwt.sign({id}, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRY
        })    
    } catch (error) {
        return new AppError(error, 400)
    }
}

const createSendToken = (user,statusCode,res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRY * 24 * 60 * 60 * 1000),
        httpOnly: true
    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signUp = catchAsync(async (req,res,next) => {
    const user = await User.findOne({email: req.body.email})

    if (user) {
        return next(new AppError('This email address is already in use.', 400));
    }

    const newUser = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    })

    createSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req,res,next) => {
    const {email, password} = req.body;

    if(!email || !password) {
        return next(new AppError('No email or password given',400));
    }


    const user = await User.findOne({email}).select('+password')
    if(!user) {
        return next(new AppError('No user found', 401));
    }

    if (!(await user.checkPassword(password, user.password))) {
        return next(new AppError('Incorrect credentials', 401));
    }

    createSendToken(user, 200, res)
})

exports.protect = catchAsync(async (req,res,next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    

    if (!token && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if(!token) {
        return next(new AppError('You are not logged in. Please log in to get access',401))
    }

    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)
    const currentUser = await User.findById(decoded.id)
    if(!currentUser) {
        return next(new AppError('No user found with that ID.',401))
    }

    req.user = currentUser
    next()
})