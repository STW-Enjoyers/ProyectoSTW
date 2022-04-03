const mongoose = require("mongoose");
const passport = require("passport");
const _ = require("lodash");

const User = mongoose.model("User");

module.exports.register = (req, res, next) => {
  console.log("Registrando");
  var user = new User();
  user.username = req.body.username;
  user.email = req.body.email;
  user.password = req.body.password;
  user.save((err, doc) => {
    console.log(doc);
    if (!err) res.send(doc);
    else {
      if (err.code == 11000)
        res.status(422).send(["Duplicate email address found."]);
      else return next(err);
    }
  });
};

module.exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(400).json(err);
    else if (user) return res.status(200).json({ token: user.jwtGen() });
    else return res.status(404).json(info);
  })(req, res);
};

module.exports.profile = (req, res, next) => {
  console.log("AAAAAAAAAAAAA " + req._id);
  User.findOne({ _id: req._id }),
    (err, user) => {
      console.log("No tamo");
      if (!user) {
        console.log("Tamo mal");
        return res
          .status(404)
          .json({ status: false, message: "No se encontró el usuario :C" });
      } else {
        console.log("Tamo bien");
        return res
          .status(200)
          .json({ status: true, user: _.pick(user, ["username", "email"]) });
      }
    };
};
