const generalControllers = require("./generalControllers");
const GuestUser = require("../models/guestUserMode");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
//////////////////////////////////////////////////////////////////////////


exports.getAllGuestUsers = generalControllers.getAll(GuestUser);
exports.getGuestUser = generalControllers.getOne(GuestUser);
exports.updateGuestUser = generalControllers.updateOne(GuestUser);
exports.deleteGuestUser = generalControllers.deleteOne(GuestUser);

exports.getGuestUserBeforeNormalUser = catchAsync(async (req, res, next) => {

    const id = req.params.id;
    let query = GuestUser.findById(id);

    const doc = await query;

    if (!doc) {
        return next();
    }


    res.status(200).json({
        status: 'success',
        data: {
            data: doc,
        }
    });


});


//////////////////////////////////////////////////////////////////////////
