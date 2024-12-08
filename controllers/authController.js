const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/userModel')
const AppError = require('../utils/appError')
const catchAsync = require("../utils/catchAsync")
const { promisify } = require('util');
const getSpotifyToken = require('../utils/getSpotifyToken')


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
    cookieOptions.secure = false;
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
    const user = await User.findOne({username: req.body.username})

    if (user) {
        return next(new AppError('This username is already in use.', 400));
    }

    // const resp = await 
    // fetch('https://accounts.spotify.com/api/token', {
    //     method: 'POST',
    //     body: new URLSearchParams({
    //         'grant_type': 'client_credentials',
    //         'client_id': req.body.clientID,
    //         'client_secret': req.body.clientSecret
    //     })
    // })
    // const data = await resp.json()

    // if (!resp.ok) {
    //     return next(new AppError('Invalid Spotify clientID or clientSecret.', 400));
    // }

    const newUser = await User.create({
        username: req.body.username,
        password: req.body.password,
        // clientID: req.body.clientID,
        // clientSecret: req.body.clientSecret
    })

    createSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req,res,next) => {
    const {username, password} = req.body;

    if(!username || !password) {
        return next(new AppError('No username or password given',400));
    }


    const user = await User.findOne({username}).select('+password')
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
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer' || 'bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if(!token) {
        return next(new AppError('You are not logged in. Please log in to get access',401))
    }

    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)
    const currentUser = await User.findById(decoded.id)
    if(!currentUser) {
        return next(new AppError('No user found with that ID.',401))
    }
    // if(!currentUser.clientID || !currentUser.clientSecret) {
    //     return next(new AppError('No clientID or clientSecret found with that ID.',401))
    // }

    // const resp = await 
    // fetch('https://accounts.spotify.com/api/token', {
    //     method: 'POST',
    //     body: new URLSearchParams({
    //         'grant_type': 'client_credentials',
    //         'client_id': currentUser.clientID,
    //         'client_secret': currentUser.clientSecret
    //     })
    // })
    // const data = await resp.json()
    
    const spotifyToken = await getSpotifyToken();
    req.user = currentUser
    req.token = spotifyToken
    next()
})

exports.updateSpotifyAccess = catchAsync(async (req,res,next) => {

    const resp = await 
    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        body: new URLSearchParams({
            'grant_type': 'client_credentials',
            'client_id': req.body.clientID,
            'client_secret': req.body.clientSecret
        })
    })

    if (!resp.ok) {
        return next(new AppError('Invalid Spotify clientID or clientSecret.', 400));
    }

    await User.findOneAndUpdate({_id: req.user._id}, {
        clientID: req.body.clientID,
        clientSecret: req.body.clientSecret
    })

    return res.status(200).json({
        status: 'success',
        message: 'Spotify access updated'
    })
})

exports.apiStatus = async (req, res) => {
    return res.status(200).json({
        status: 'success',
        message: 'running'
    })
}