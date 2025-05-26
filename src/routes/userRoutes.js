const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validateRequest = require('../middlewares/validateRequest');

router.post('/', validateRequest, userController.createUser);
router.get('/:id', userController.getUser);
router.put('/:id', validateRequest, userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/', userController.getAllUsers);

module.exports = router;