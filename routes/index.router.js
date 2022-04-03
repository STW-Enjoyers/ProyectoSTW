const express = require("express");
const router = express.Router();

const controlUser = require("../controllers/user.controller");
const jwtHelper = require("../config/jwtHelper");

router.post("/register", controlUser.register);
router.post("/login", controlUser.login);
router.get("/profile", jwtHelper.verifyJwtToken, controlUser.profile);

module.exports = router;
