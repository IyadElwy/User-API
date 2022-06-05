const jwt = require('jsonwebtoken');
const {promisify} = require('util');
const crypto = require('crypto');
const axios = require('axios').default;

/////////////////////////////////////////////////////////////////////////////////////////////

const User = require('./../models/userModel');
const GuestUser = require('./../models/guestUserMode');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

/////////////////////////////////////////////////////////////////////////////////////////////

const signToken = id => {
    return jwt.sign({id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};


const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        secure: true,
    };

    res.cookie('jwt', token, cookieOptions);


    // Remove password from output
    user.password = undefined;


    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

/////////////////////////////////////////////////////////////////////////////////////////////

// TODO: TELL ABDO TO INTEGRATE HIS NOTIFICATION SYSTEM INTO HERE
exports.signup = catchAsync(
    async (req, res, next) => {


        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            passwordChangedAt: req.body.passwordChangedAt,
            role: req.body.role
        });

        try {

            await axios.post(`http://localhost:${process.env.NOTIFICATIONAPIPORT}/api/v1/notifications/confirmaccount`, {
                email: newUser.email
            });

        } catch (e) {

            return next(new AppError('Error sending account confirmation.', 401));
        }


        createAndSendToken(newUser, 201, res);
    }
);


exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;

    // 1) If email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide an email and a password.', 400));
    }

    // 2) Check if the user exists and if the password is correct
    const user = await User.findOne({email: email}).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3) If everything is ok, send jwt to client
    createAndSendToken(user, 201, res);

});

exports.protect = catchAsync(async (req, res, next) => {

    let token;

    // 1) Getting token and checking if it exists
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }


    if (!token) {
        return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2) Validate the token (Verification)
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);


    // 3) Check if the user still exists
    let user = await User.findById(decoded.id);
    if (!user) {

        user = await GuestUser.findById(decoded.id);

        if (!user) {
            return next(new AppError('The user belonging to this token no longer exists', 401));

        }


    } else {
        // 4) Check if user changed password after the token was issued (after token was issued)
        if (user.changedPasswordAfterToken(decoded.iat)) {
            return next(new AppError('User recently changed password. Please log in again.', 401));
        }
    }


    // Grant accesses to protected route
    req.user = user;


    next();
});

exports.restrictTo = (...roles) => {
    return catchAsync(async (req, res, next) => {
        // roles ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }

        next();
    });
};


exports.isLoggedIn = catchAsync(async (req, res, next) => {

    if (req.cookies.jwt) {
        const decoded = await promisify(jwt.verify)(
            req.cookies.jwt,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new AppError('User is not logged in. Please log in or sign up.'));
        }

        // 4) Check if user changed password after the token was issued (after token was issued)
        if (user.changedPasswordAfterToken(decoded.iat)) {
            return next(new AppError('User is not logged in. Please log in or sign up.'));

        }


        // THERE IS A LOGGED IN USER
        res.locals.user = user;


        res.status(200).json({
            status: 'success',
            loggedin: true
        });


    }
    return next(new AppError('User is not logged in. Please log in or sign up.'));

});


exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({
        status: 'success'
    });
};


/////////////////////////////////////////////////////////////////////////////////////////////////////
// guest user authentication

const createAndSendTokenToGuestUser = catchAsync(
    async (user, statusCode, res, req) => {
        const token = signToken(user._id);


        const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            secure: true,
        };

        res.cookie('jwt', token, cookieOptions);

        res.status(statusCode).json({
            status: 'success',
            token,
            data: {
                user,
            }
        });
    });


exports.createGuestUserAndSendToken = catchAsync(
    async (req, res, next) => {


        const newGuestUser = await GuestUser.create({
            name: req.body.name,
            email: req.body.email,
            addressCoordinates: req.body.addressCoordinates,
            addressDescription: req.body.addressDescription,
        });


        createAndSendTokenToGuestUser(newGuestUser, 201, res, req);
    }
);
