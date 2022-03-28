const res = require("express/lib/response");
const mongoose = require("mongoose");

const User = mongoose.model("User");

module.exports.register = (req, resp, next) => {
  console.log("Registrame esta");
  var user = new User();
  user.username = req.body.username;
  user.email = req.body.email;
  user.password = req.body.password;
  user.save((err, doc) => {
    console.log(doc);
    if (!err) resp.send(doc);
  });
};
