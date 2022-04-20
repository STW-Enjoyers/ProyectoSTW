const _ = require("lodash");
const request = require("request");
const GradeProfile = require("../models/gradeProfileSchema");
const Graduated = require("../models/graduatedSchema");
const Grade = require("../models/gradeSchema");
const User = require("../models/userSchema");
const graduatedURL = "/search?p=DS007-&of=recjson&jrec=1&rg=1";

const serverOptions = {
  server: "https://zaguan.unizar.es",
};

const gradeProfile = function (req, res, next) {
  GradeProfile.findOne(
    { "grade.idCarrera": req.query.idCarrera },
    (err, gradeProfile) => {
      if (!gradeProfile) {
        console.log("Nuevo perfil");
        Grade.findOne(
          {
            idCarrera: req.query.idCarrera,
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
        console.log("Perfil existente");
        getJsonUrl(
          res,
          graduatedURL,
          gradeProfile.grade.localidad,
          gradeProfile,
          res,
          next
        );
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
    if (response.statusCode === 200 && body != null) {
      jsonUrl = body[0].files.find((t) => t.description === "JSON").url;
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
  console.log(gradeProfile);
  gradeProfile.graduated = gradeStats;
  gradeProfile.save((err, doc) => {
    if (!err) res.send(doc);
    else {
      res.send(gradeProfile);
    }
  });
  return;
}

const comment = function (req, res, next) {
  commentInsert = {
    username: "",
    upvotes: 0,
    visible: true,
    body: req.query.cuerpo,
    responses: [],
  };
  User.findOne({ _id: req._id }, (err, user) => {
    if (!user)
      return res.status(404).json({
        status: false,
        message: "No se encontró el usuario (o no hay token) :C",
      });
    else commentInsert.username = user.username;
  });
  GradeProfile.findOne(
    { "grade.idCarrera": req.query.idCarrera },
    (err, gradeProfile) => {
      if (!gradeProfile) {
        return res.status(404).json({
          status: false,
          message: "No se encontró el perfil del grado :C",
        });
      } else {
        gradeProfile.comments = gradeProfile.comments || [];
        console.log(commentInsert);
        gradeProfile.comments.push(commentInsert);
        console.log(gradeProfile);
        gradeProfile.save();
        res.send(gradeProfile);
      }
    }
  );
};

const reply = function (req, res, next) {
  replyInsert = {
    username: "",
    upvotes: 0,
    visible: true,
    body: req.query.cuerpo,
    commentId: req.query._id,
  };
  User.findOne({ _id: req._id }, (err, user) => {
    if (!user)
      return res.status(404).json({
        status: false,
        message: "No se encontró el usuario (o no hay token) :C",
      });
    else replyInsert.username = user.username;
  });
  GradeProfile.findOne(
    { "grade.idCarrera": req.query.idCarrera },
    (err, gradeProfile) => {
      if (!gradeProfile) {
        return res.status(404).json({
          status: false,
          message: "No se encontró el perfil del grado :C",
        });
      } else {
        done = false;
        for (let k in gradeProfile.comments) {
          if (gradeProfile.comments[k]["_id"] == req.query._id) {
            gradeProfile.comments[k].responses =
              gradeProfile.comments[k].responses || [];
            gradeProfile.comments[k].responses.push(replyInsert);
            console.log(replyInsert);
            done = true;
            break;
          }
        }
        if (!done) {
          return res.status(404).json({
            status: false,
            message: "No se encontró el comentario solicitado :C",
          });
        }
        console.log(gradeProfile);
        gradeProfile.save();
        res.send(gradeProfile);
      }
    }
  );
};

const upVote = function (req, res, next) {
  username = "";
  User.findOne({ _id: req._id }, (err, user) => {
    if (!user)
      return res.status(404).json({
        status: false,
        message: "No se encontró el usuario (o no hay token) :C",
      });
    else username = user.username;
  });
  GradeProfile.findOne(
    { "grade.idCarrera": req.query.idCarrera },
    (err, gradeProfile) => {
      if (!gradeProfile) {
        return res.status(404).json({
          status: false,
          message: "No se encontró el perfil del grado :C",
        });
      } else {
        cIndex = -1;
        for (let k in gradeProfile.comments) {
          if (gradeProfile.comments[k]["_id"] == req.query.idcom) {
            cIndex = k;
            break;
          }
        }
        if (cIndex == -1) {
          return res.status(404).json({
            status: false,
            message: "Comentario no encontrado",
          });
        }
        if (!req.query.idrep) {
          handleUpVoteComment(req, res, gradeProfile);
        } else {
          handleUpVoteReply(req, res, gradeProfile);
        }
      }
    }
  );
};

function handleUpVoteComment(req, res, gradeProfile) {
  console.log("Es comentario");
  if (!userHasUpvoted(req._id, gradeProfile.comments[cIndex].upvotedUsers)) {
    gradeProfile.comments[cIndex].upvotes++;
    gradeProfile.comments[cIndex].upvotedUsers.push(req._id);
  } else {
    return res.status(404).json({
      status: false,
      message: "El usuario ya ha votado",
    });
  }
  console.log(gradeProfile.comments[cIndex]);
  gradeProfile.save();
  res.send(gradeProfile);
}

function handleUpVoteReply(req, res, gradeProfile) {
  found = false;
  console.log("Es respuesta");
  for (let k in gradeProfile.comments[cIndex].responses) {
    if (gradeProfile.comments[cIndex].responses[k]["_id"] == req.query.idrep) {
      if (
        !userHasUpvoted(
          req._id,
          gradeProfile.comments[cIndex].responses[k].upvotedUsers
        )
      ) {
        gradeProfile.comments[cIndex].responses[k].upvotes++;
        gradeProfile.comments[cIndex].responses[k].upvotedUsers.push(req._id);
      } else {
        return res.status(404).json({
          status: false,
          message: "El usuario ya ha votado",
        });
      }
      found = true;
      break;
    }
  }
  if (!found)
    return res.status(404).json({
      status: false,
      message: "Respuesta no encontrada",
    });
  gradeProfile.save();
  res.send(gradeProfile);
}

function userHasUpvoted(id, upvotedUsersArray) {
  for (let k in upvotedUsersArray) {
    if (upvotedUsersArray[k] == id) {
      console.log("Ya ha votado");
      return true;
    }
  }
  console.log("Nuevo voto");
  return false;
}

module.exports = {
  gradeProfile,
  comment,
  reply,
  upVote,
  httpNotImplemented,
};
