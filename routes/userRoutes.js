const express = require("express");

/////////////////////////////////////////////////////////////////////////////////////////////

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

/////////////////////////////////////////////////////////////////////////////////////////////


const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/isloggedin/', authController.isLoggedIn);

router.route('/:id')
    .get(userController.getUser);


router.use(authController.protect);

router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);


router.route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router.route('/:id')
    .patch(userController.updateUser)
    .delete(userController.deleteUser);


/////////////////////////////////////////////////////////////////////////////////////////////


module.exports = router;