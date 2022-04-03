const express = require("express");
const router = express.Router();

const controlUser = require("../controllers/user.controller");

router.post("/register", controlUser.register);
router.post("/login", controlUser.login);

module.exports = router;
