const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
//////////////////////////////////////////////////////////////////////////////

const catchAsync = require('./../utils/catchAsync');

//////////////////////////////////////////////////////////////////////////////


const guestUserSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email.'],
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email.']
    },
    addressCoordinates: [Number],
    addressDescription: String,
    role: {
        type: String,
        enum: ['guestuser'],
        default: 'guestuser'
    },

    // The order id will be embedded here
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order'
    },
});


/////////////////////////////////////////////////////////////////////////////////////////////

const GuestUser = mongoose.model('GuestUser', guestUserSchema);

module.exports = GuestUser;