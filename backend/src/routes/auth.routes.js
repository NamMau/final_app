const express = require("express");
const {register, login} = require("../controllers/auth.controller");
const { refreshAccessToken } = require("../services/auth.service");

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log('\n=== Auth Route ===');
  console.log('Path:', req.path);
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  next();
});

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);

module.exports = router;