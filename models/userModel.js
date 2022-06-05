const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
//////////////////////////////////////////////////////////////////////////////

const catchAsync = require('./../utils/catchAsync');

//////////////////////////////////////////////////////////////////////////////


const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email.'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email.']
    },
    addressCoordinates: [Number],
    addressDescription: String,
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password.'],
        minLength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm the password.'],
        minLength: 8,
        validate: {
            //This only works on CREATE & SAVE not update
            validator: function (password) {
                return password === this.password;
            },
            message: 'The passwords do not match'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
    // The order ids will be embedded here
    // orderIds: [
    //     {
    //         type: mongoose.Schema.ObjectId,
    //         ref: 'Order'
    //     }
    // ],

});

/////////////////////////////////////////////////////////////////////////////////////////////

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) {
        return next();
    }
    this.passwordChangedAt = Date.now() - 1000;
    next();
});


userSchema.pre('save', async function (next) {

    //only run this function if password modified
    if (!this.isModified('password')) {
        return next();
    }

    // has the password with cost of 12 and delete passwordConfirm
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;

    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({active: {$ne: false}});
    next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfterToken = function (JWTTimestamp) {

    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimeStamp;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = async function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    console.log({resetToken}, this.passwordResetToken);
    return resetToken;
};

/////////////////////////////////////////////////////////////////////////////////////////////

const User = mongoose.model('User', userSchema);

module.exports = User;