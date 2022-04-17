const _ = require("lodash");
const request = require("request");
const GradeProfile = require("../models/gradeProfileSchema");
const Grade = require("../models/gradeSchema");
const graduatedURL = "/search?p=DS007-&of=recjson&jrec=1&rg=1";
const serverOptions = {
  server: "https://zaguan.unizar.es",
};

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
              gP.graduated = getJsonUrlgetJsonUrl(
                res,
                graduatedURL,
                grade.localidad,
                grade.estudio
              );
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
      } else {
        gradeProfile.graduated = getJsonUrl(
          res,
          graduatedURL,
          gradeProfile.grade.localidad,
          gradeProfile.grade.estudio
        );
        console.log("CAMBIO : " + gradeProfile);
        return res.status(200).json(gradeProfile);
      }
    }
  );
};

const httpNotImplemented = function (req, res) {
  res.status(501).json("Operation not implemented");
};

function getJsonUrl(res, query, city, grade) {
  const requestOptions = {
    url: serverOptions.server + query,
    method: "GET",
    json: {},
  };
  request(requestOptions, (err, response, body) => {
    console.log(response.statusCode);
    if (response.statusCode === 200 && body != null) {
      jsonUrl = body[0].files.find((t) => t.description === "JSON").url;
      console.log("JSONURL: " + jsonUrl);
      gradeStats = getJsonContent(res, jsonUrl, city, grade);
      return gradeStats;
    }
    return null;
  });
}

function getJsonContent(res, jsonUrl, city, grade) {
  const requestOptions = {
    url: jsonUrl,
    method: "GET",
    json: {},
  };
  request(requestOptions, (err, response, body) => {
    if (response.statusCode === 200 && body != null) {
      gradeStats = processGraduates(body.datos, city, grade);
      return gradeStats;
    }
    return null;
  });
}

function processGraduates(data, city, grade) {
  gradesArr = [];
  for (let k in data) {
    if (data[k]["LOCALIDAD"] == city && data[k]["ESTUDIO"] == grade) {
      currentData = {
        average: data[k]["DURACION_MEDIA_GRADUADOS"],
        graduated: data[k]["ALUMNOS_GRADUADOS"],
        changed: data[k]["ALUMNOS_TRASLADAN_OTRA_UNIV"],
        abandoned: data[k]["ALUMNOS_INTERRUMPEN_ESTUDIOS"],
        type: data[k]["TIPO_EGRESO"],
        sexo: data[k]["SEXO"],
      };
      gradesArr.push({ ...currentData });
    }
  }
  gradeStats = {
    average: 0,
    graduated: 0,
    changed: 0,
    abandoned: 0,
  };
  (avg1 = 0), (avg2 = 0), (grad1 = 0), (grad2 = 0);
  for (let k in gradesArr) {
    gradeStats.changed += gradesArr[k]["changed"];
    gradeStats.graduated += gradesArr[k]["graduated"];
    gradeStats.abandoned += gradesArr[k]["abandoned"];
    //Siempre hay dos entradas que contienen la media, si una de ellas
    //ha dejado de ser 0, se mete en la otra.
    if (avg1 == 0) {
      avg1 += gradesArr[k]["average"];
      grad1 += gradesArr[k]["graduated"];
    } else {
      avg2 += gradesArr[k]["average"];
      grad2 += gradesArr[k]["graduated"];
    }
  }
  //Formula suma de medias por el porcentaje
  gradeStats.average =
    (grad1 / gradeStats.graduated) * avg1 +
    (grad2 / gradeStats.graduated) * avg2;
  console.log(gradeStats);
  return gradeStats;
}

module.exports = {
  gradeProfile,
  httpNotImplemented,
};
