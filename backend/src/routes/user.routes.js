const express = require("express");
const { createUser, getUserById, updateUserById, deleteUserById, getAllUsers, getProfile, updateProfile } = require("../controllers/user.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { changePassword } = require("../controllers/user.controller");

const router = express.Router();

router.post("/create-user", createUser); // create user
router.get("/get-all-users", authMiddleware, getAllUsers); // get all users
router.get("/get-user-by-id/:id", authMiddleware, getUserById);
router.put("/update-user-by-id/:id", authMiddleware, updateUserById);
router.put("/change-password", authMiddleware, changePassword); // change password
router.delete("/delete-user-by-id/:id", authMiddleware, deleteUserById); // delete user
router.get("/profile", authMiddleware, getProfile);
router.patch("/update-profile", authMiddleware, updateProfile);

module.exports = router;
