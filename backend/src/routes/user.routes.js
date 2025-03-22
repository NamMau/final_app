const express = require("express");
const { createUser, getUserById, updateUserById, deleteUserById, getAllUsers } = require("../controllers/user.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { changePassword } = require("../controllers/user.controller");

const router = express.Router();

router.post("/", createUser); // create user
router.get("/", authMiddleware, getAllUsers); // get all users
router.get("/profile/:id", authMiddleware, getUserById);
router.put("/profile/:id", authMiddleware, updateUserById);
router.put("/change-password", authMiddleware, changePassword); // change password
router.delete("/profile/:id", authMiddleware, deleteUserById); // delete user

module.exports = router;
