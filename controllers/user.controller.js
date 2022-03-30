const mongoose = require("mongoose");

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
