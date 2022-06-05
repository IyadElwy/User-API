const {promisify} = require("util");
const jwt = require("jsonwebtoken");

/////////////////////////////////////////////////////////////////////////////////////////////

const User = require("../models/userModel");
const GuestUser = require("../models/guestUserMode");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");


exports.protectDev = catchAsync(async (req, res, next) => {
    // 1) Getting token

    const token = req.params.usertoken;

    if (!token) {
        return next();
    }

    // 2) Validate the token (Verification)
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);


    // 3) Check if the user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
        return next();
    }

    // 4) Check if user changed password after the token was issued (after token was issued)
    if (user.changedPasswordAfterToken(decoded.iat)) {
        return next(new AppError('User recently changed password. Please log in again.', 401));
    }

    res.status(200).json({
        status: 'success',
        user
    });

});

exports.protectDevGuest = catchAsync(async (req, res, next) => {
    // 1) Getting token

    const token = req.params.usertoken;

    if (!token) {

        return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2) Validate the token (Verification)
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if the user still exists
    const user = await GuestUser.findById(decoded.id);
    if (!user) {
        return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    res.status(200).json({
        status: 'success',
        user
    });

});



