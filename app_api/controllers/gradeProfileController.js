const _ = require("lodash");
const GradeProfile = require("../models/gradeProfileSchema");
const Grade = require("../models/gradeSchema");

const gradeProfile = function (req, res, next) {
  GradeProfile.findOne(
    { "grade.centro": req.query.centro, "grade.estudio": req.query.estudio },
    (err, gradeProfile) => {
      if (!gradeProfile) {
        Grade.findOne(
          {
            "grade.centro": req.query.centro,
            "grade.estudio": req.query.estudio,
          },
          (err, grade) => {
            console.log(req.query._id);
            if (!grade) {
              return res
                .status(404)
                .json({ status: false, message: "No se encontró el grado :C" });
            } else {
              console.log("Grade:" + grade);
              var gP = new GradeProfile();
              gP.grade = grade;
              gP.graduated = null;
              gP.comments = [];
              gP.save((err, doc) => {
                console.log(doc);
                if (!err) res.send(doc);
                else {
                  return next(err);
                }
              });
            }
          }
        );
      } else return res.status(200).json(gradeProfile);
    }
  );
};

const httpNotImplemented = function (req, res) {
  res.status(501).json("Operation not implemented");
};

module.exports = {
  gradeProfile,
  httpNotImplemented,
};
