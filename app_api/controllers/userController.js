const passport = require("passport");
const _ = require("lodash");
const User = require("../models/userSchema");

const register = function (req, res, next) {
  console.log("Registrando");
  var user = new User();
  user.username = req.body.username;
  user.email = req.body.email;
  user.password = req.body.password;
  user.save((err, doc) => {
    console.log(doc);
    if (!err) {
      passport.authenticate("local", (err, user, info) => {
        if (err) return res.status(400).json(err);
        else if (user)
          return res.status(200).json({ token: user.jwtGen(), doc });
        else return res.status(404).json(info);
      })(req, res);
    } else {
      if (err.code == 11000)
        res.status(422).send(["Duplicate email address found."]);
      else return next(err);
    }
  });
};

const login = function (req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(400).json(err);
    else if (user) return res.status(200).json({ token: user.jwtGen() });
    else return res.status(404).json(info);
  })(req, res);
};

const profile = function (req, res, next) {
  User.findOne({ _id: req._id }, (err, user) => {
    if (!user)
      return res
        .status(404)
        .json({ status: false, message: "No se encontró el usuario :C" });
    else
      return res
        .status(200)
        .json({ status: true, user: _.pick(user, ["username", "email"]) });
  });
};

const httpNotImplemented = function (req, res) {
  res.status(501).json("Operation not implemented");
};

module.exports = {
  register,
  login,
  profile,
  httpNotImplemented,
};
