const _ = require("lodash");
const request = require("request");
const GradeProfile = require("../models/gradeProfileSchema");
const Graduated = require("../models/graduatedSchema");
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
        console.log("No esta");
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
              getJsonUrl(res, graduatedURL, grade.localidad, gP, res, next);
            }
          }
        );
      } else {
        console.log("Si esta");
        getJsonUrl(
          res,
          graduatedURL,
          gradeProfile.grade.localidad,
          gradeProfile,
          res,
          next
        );
        console.log("CAMBIO : " + gradeProfile);
        return;
      }
    }
  );
};

const httpNotImplemented = function (req, res) {
  res.status(501).json("Operation not implemented");
};

function getJsonUrl(res, query, city, gradeProfile, res, next) {
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
      getJsonContent(res, jsonUrl, city, gradeProfile, res, next);
      return;
    }
    return null;
  });
}

function getJsonContent(res, jsonUrl, city, gradeProfile, res, next) {
  const requestOptions = {
    url: jsonUrl,
    method: "GET",
    json: {},
  };
  request(requestOptions, (err, response, body) => {
    if (response.statusCode === 200 && body != null) {
      processGraduates(body.datos, city, gradeProfile, res, next);
      return;
    }
    return null;
  });
}

function processGraduates(data, city, gradeProfile, res, next) {
  console.log(gradeProfile);
  gradesArr = [];
  for (let k in data) {
    if (
      data[k]["LOCALIDAD"] == city &&
      data[k]["ESTUDIO"] == gradeProfile.grade.estudio
    ) {
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
  gradeStats = new Graduated();
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
  gradeProfile.graduated = gradeStats;
  gradeProfile.save((err, doc) => {
    console.log(doc);
    if (!err) res.send(doc);
    else {
      res.send(gradeProfile);
    }
  });
  return;
}

module.exports = {
  gradeProfile,
  httpNotImplemented,
};
