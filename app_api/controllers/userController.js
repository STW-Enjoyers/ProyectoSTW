const passport = require("passport");
const _ = require("lodash");
const User = require("../models/userSchema");
const { urlencoded } = require("body-parser");
const logger = require("../../logger");
const GradeProfile = require("../models/gradeProfileSchema");
const Grade = require("../models/gradeSchema");

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

const changeName = function (req, res, next) {
  User.findOne({ _id: req._id }, (err, user) => {
    if (!user)
      return res
        .status(404)
        .json({ status: false, message: "No se encontró el usuario :C" });
    else {
      if (user.username != req.query.username) {
        user.username = req.query.username;
        user.save();
        res.send(user);
      } else {
        res.status(404).json({ status: false, message: "No hay cambio." });
      }
    }
  });
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

const usersYearly = function (req, res) {
  User.findOne({ _id: req._id }, (err, user) => {
    if (!user || !user.admin) {
      return res.status(404).json({
        status: false,
        message: "No se encontró el usuario administrador :C",
      });
    } else {
      User.aggregate(
        [
          {
            $group: {
              _id: {
                $dateToString: { format: "%m-%Y", date: "$registerDate" },
              },
              users: { $sum: 1 },
            },
          },
        ],
        function (err, result) {
          if (err) {
            res.status(500).json({
              message: "There was an error while obtaining your data",
            });
          } else {
            for (var i = 1; i < 13; i++) {
              auxArray = result.filter((a) =>
                a._id.includes(i + "-" + new Date().getFullYear())
              );
              if (auxArray.length == 0) {
                value = { _id: i + "-" + new Date().getFullYear(), users: 0 };
                result.push({ ...value });
              }
            }
            res
              .status(200)
              .json(
                result.filter((a) => a._id.includes(new Date().getFullYear()))
              );
          }
        }
      );
    }
  });
};

const conflictiveGrades = function (req, res) {
  User.findOne({ _id: req._id }, (err, user) => {
    if (!user || !user.admin)
      return res.status(404).json({
        status: false,
        message: "No se encontró el usuario administrador :C",
      });
    else {
      GradeProfile.aggregate([
        {
          $lookup: {
            from: "grades",
            localField: "idCarrera",
            foreignField: "idCarrera",
            as: "grade",
          },
        },
        {
          $sort: {
            deletedCount: -1,
          },
        },
      ]).exec(function (err, result) {
        console.log(result);
        console.log(result.length);
        conflictives = [];
        for (i in result) {
          actual = {
            idCarrera: result[i].idCarrera,
            estudio: result[i].grade[0].estudio,
            deletedCount: result[i].deletedCount,
          };
          conflictives.push(actual);
        }
        res.send(conflictives);
      });
    }
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
  usersYearly,
  conflictiveGrades,
  changeName,
  httpNotImplemented,
};
