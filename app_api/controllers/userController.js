const passport = require("passport");
const _ = require("lodash");
const User = require("../models/userSchema");
const { urlencoded } = require("body-parser");
const logger = require("../../logger");
const GradeProfile = require("../models/gradeProfileSchema");

const register = function (req, res, next) {
  logger.info("Registrando");
  User.findOne({ username: req.body.username }, (err, user) => {
    if (user) res.status(422).send(["Duplicate username found."]);
    else {
      var user = new User();
      user.username = req.body.username;
      user.email = req.body.email;
      user.password = req.body.password;
      user.save((err, doc) => {
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
      return res.status(200).json({
        status: true,
        user: _.pick(user, ["_id", "username", "email"]),
      });
  });
};

const ban = function (req, res, next) {
  User.findOne({ _id: req._id }, (err, user) => {
    if (!user || !user.admin)
      return res.status(404).json({
        status: false,
        message: "No se encontró el usuario administrador :C",
      });
    else
      User.findOne({ username: req.query.username }, (err, user) => {
        if (!user)
          return res.status(404).json({
            status: false,
            message: "No se encontró el usuario para banear",
          });
        else {
          user.banned = true;
          if (user.comments.length > 0) handleComments(user, res);
          else {
            user.save();
            res.send(user);
          }
        }
      });
  });
};

function handleComments(user, res) {
  failed = "";
  for (let k in user.comments) {
    GradeProfile.findOne(
      { "comments._id": user.comments[k][0] },
      (err, gradeProfile) => {
        if (!gradeProfile) {
          failed = "No se encontró el perfil de carrera :C";
        } else {
          cIndex = -1;
          for (let l in gradeProfile.comments) {
            if (gradeProfile.comments[l]["_id"] == user.comments[k][0]) {
              cIndex = l;
              break;
            }
          }
          if (cIndex == -1)
            failed = "No se encontró el comentario (Esto no debería pasar)";
          if (user.comments[k].length > 1) {
            //Reply
            for (let m in gradeProfile.comments[cIndex].responses) {
              if (
                gradeProfile.comments[cIndex].responses[m]["_id"] ==
                user.comments[k][1]
              ) {
                logger.info(
                  "Respuesta baneada" +
                    gradeProfile.comments[cIndex].responses[m]
                );
                gradeProfile.comments[cIndex].responses[m].visible = false;
                gradeProfile.comments[cIndex].responses[m].status = "banned";
              }
            }
          } else {
            //Comment
            logger.info("Comentario baneado" + gradeProfile.comments[cIndex]);
            gradeProfile.comments[cIndex].visible = false;
            gradeProfile.comments[cIndex].status = "banned";
          }
          gradeProfile.save();
        }
        if (k == user.comments.length - 1) {
          if (failed == "") {
            user.save();
            res.send(user);
          } else {
            res.status(404).json({
              status: false,
              message: failed,
            });
          }
        }
      }
    );
  }
}

const httpNotImplemented = function (req, res) {
  res.status(501).json("Operation not implemented");
};

module.exports = {
  register,
  login,
  profile,
  ban,
  httpNotImplemented,
};
