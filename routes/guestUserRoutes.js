const express = require("express");

/////////////////////////////////////////////////////////////////////////////////////////////

const guestUserController = require('./../controllers/guestUserController');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');

/////////////////////////////////////////////////////////////////////////////////////////////


const router = express.Router();


router.route('/')
    .get(guestUserController.getAllGuestUsers);


router.route('/getcurrentuser')
    .get(authController.protect, userController.getMe, guestUserController.getGuestUserBeforeNormalUser, userController.getUser);


router.route(`/createguest`)
    .post(authController.createGuestUserAndSendToken);


router.route('/:id')
    .get(guestUserController.getGuestUser)
    .patch(guestUserController.updateGuestUser)
    .delete(guestUserController.deleteGuestUser);


/////////////////////////////////////////////////////////////////////////////////////////////


module.exports = router;