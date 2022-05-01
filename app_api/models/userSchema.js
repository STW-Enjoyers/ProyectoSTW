const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: "Username can't be empty!",
  },
  email: {
    type: String,
    required: "Email can't be empty!",
    unique: true,
  },
  password: {
    type: String,
    required: "Password can't be empty!",
    minlength: [5, "Password must have at least 5 characters!"],
  },
  //If comment [idcomment] if reply [idcomment,idreply]
  comments: [[String]],
  admin: {
    type: Boolean,
    default: false,
  },
  banned: {
    type: Boolean,
    default: false,
  },
  saltSecret: String,
  regen: {
    type: Boolean,
    default: true,
  },
  registerDate: { type: Date, default: Date.now },
});

userSchema.path("email").validate((val) => {
  //Regular expression of an valid mail
  emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(val);
}, "Invalid e-mail.");

//Execute before save
userSchema.pre("save", function (next) {
  if (this.regen) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(this.password, salt, (err, hash) => {
        this.password = hash;
        this.saltSecret = salt;
        this.regen = false;
        next();
      });
    });
  }
  next();
});

//Method to verify the password
userSchema.methods.verifyPassword = function (pwd) {
  return bcrypt.compareSync(pwd, this.password);
};

userSchema.methods.jwtGen = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP,
  });
};

module.exports = mongoose.model("User", userSchema);
