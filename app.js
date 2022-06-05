const express = require('express');
const rateLimit = require('express-rate-limit');
const upload = require('express-fileupload');
const morgan = require('morgan');

// //////////////////////////////////////////////////////////////////////////////

// security
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
//
// //////////////////////////////////////////////////////////////////////////////
//
const userRouter = require('./routes/userRoutes');
const guestUserRouter = require('./routes/guestUserRoutes');
const devRoutes = require('./routes/devRoutes');
// //////////////////////////////////////////////////////////////////////////////
//
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

//////////////////////////////////////////////////////////////////////////////

const app = express();
// //////////////////////////////////////////////////////////////////////////////

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());
// // adds http headers for security
app.use(helmet());
// // against query selector injection attacks
app.use(mongoSanitize());
// // sanitize untrusted html
app.use(xss());
// // file uploads
app.use(upload({
    preserveExtension: true
}));

//////////////////////////////////////////////////////////////////////////////

// limiting the number of api calls

const limiter = rateLimit({
    max: 100,
    windowMS: 60 * 60 * 1000,
    message: 'Too many requests from this IP Address, please try again in an hour'
});
app.use(limiter);

////////////////////////////////////////////////////////////////////////////
// routes

app.use('/api/v1/users', userRouter);
app.use('/api/v1/guestusers', guestUserRouter);
app.use(`/api/v1/devroutes/${process.env.DEVROUTESKEY}`, devRoutes);

///////////////////////////////////////////////////////////////////////////////

// handle undefined routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

app.use(globalErrorHandler);

//////////////////////////////////////////////////////////////////////////////

module.exports = app;

//////////////////////////////////////////////////////////////////////////////
