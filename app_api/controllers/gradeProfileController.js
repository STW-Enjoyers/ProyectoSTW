const _ = require("lodash");
const request = require("request");
const logger = require("../../logger");
const GradeProfile = require("../models/gradeProfileSchema");
const Graduated = require("../models/graduatedSchema");
const Grade = require("../models/gradeSchema");
const User = require("../models/userSchema");
const graduatedURL = "/search?p=DS007-&of=recjson&jrec=1&rg=1";
const GradesController = require("./gradesController");
const cron = require("node-cron");

const serverOptions = {
  server: "https://zaguan.unizar.es",
};

const gradeProfile = function (req, res, next) {
  GradeProfile.findOne(
    { idCarrera: req.query.idCarrera },
    (err, gradeProfile) => {
      if (err) {
        res.status(404).json(err);
        return;
      } else if (!gradeProfile) {
        logger.info("Nuevo perfil");
        Grade.findOne(
          {
            idCarrera: req.query.idCarrera,
          },
          (err, grade) => {
            if (!grade) {
              return res
                .status(404)
                .json({ status: false, message: "No se encontró el grado :C" });
            } else {
              logger.info("Grade:" + grade);
              var gP = new GradeProfile();
              gP.idCarrera = grade.idCarrera;
              gP.graduated = null;
              gP.comments = [];
              getJsonUrl(res, graduatedURL, gP, next);
            }
          }
        );
      } else {
        logger.info("Perfil existente");
        returnProfileWithFilter(res, gradeProfile);
        return;
      }
    }
  );
};

//This function makes the comment body and username invisible if
//the user that commented has erased the comment or if it has been banned
function returnProfileWithFilter(res, gradeProfile) {
  for (let k in gradeProfile.comments) {
    if (!gradeProfile.comments[k].visible) {
      gradeProfile.comments[k].body = "";
      //TODO No se si los demas querrán que se borre el nombre de usuario
      gradeProfile.comments[k].username = "";
    }
    for (let l in gradeProfile.comments[k].responses) {
      if (!gradeProfile.comments[k].responses[l].visible) {
        gradeProfile.comments[k].responses[l].body = "";
        //TODO No se si los demas querrán que se borre el nombre de usuario
        gradeProfile.comments[k].responses[l].username = "";
      }
    }
  }
  res.status(200).json(gradeProfile);
}

const httpNotImplemented = function (req, res) {
  res.status(501).json("Operation not implemented");
};

function getJsonUrl(res, query, gradeProfile, next) {
  const requestOptions = {
    url: serverOptions.server + query,
    method: "GET",
    json: {},
  };
  request(requestOptions, (err, response, body) => {
    if (response.statusCode === 200 && body != null) {
      jsonUrl = body[0].files.find((t) => t.description === "JSON").url;
      getJsonContent(res, jsonUrl, gradeProfile, next);
      return;
    }
    return null;
  });
}

function getJsonContent(res, jsonUrl, gradeProfile, next) {
  const requestOptions = {
    url: jsonUrl,
    method: "GET",
    json: {},
  };
  request(requestOptions, (err, response, body) => {
    if (response.statusCode === 200 && body != null) {
      processGraduatesOne(body.datos, gradeProfile, res, next);
      return;
    }
    return null;
  });
}

function processGraduatesOne(data, gradeProfile, res, next) {
  gradesArr = [];
  for (let k in data) {
    if (
      GradesController.generateHashGrade(
        data[k]["ESTUDIO"],
        data[k]["LOCALIDAD"]
      ) == gradeProfile.idCarrera
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
    { idCarrera: req.query.idCarrera },
    (err, gradeProfile) => {
      if (!gradeProfile) {
        return res.status(404).json({
          status: false,
          message: "No se encontró el perfil del grado :C",
        });
      } else {
        gradeProfile.comments = gradeProfile.comments || [];
        commLength = gradeProfile.comments.push(commentInsert);
        gradeProfile.save();
        user.comments = user.comments || [];
        user.comments.push(gradeProfile.comments[commLength]._id);
        user.save();
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
    { idCarrera: req.query.idCarrera },
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
    { idCarrera: req.query.idCarrera },
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
  logger.info("Es comentario");
  if (userHasUpvoted(req._id, gradeProfile.comments[cIndex].upvotedUsers) < 0) {
    gradeProfile.comments[cIndex].upvotes++;
    gradeProfile.comments[cIndex].upvotedUsers.push(req._id);
  } else {
    return res.status(404).json({
      status: false,
      message: "El usuario ya ha votado",
    });
  }
  logger.info(gradeProfile.comments[cIndex]);
  gradeProfile.save();
  res.send(gradeProfile);
}

function handleUpVoteReply(req, res, gradeProfile) {
  found = false;
  logger.info("Es respuesta");
  for (let k in gradeProfile.comments[cIndex].responses) {
    if (gradeProfile.comments[cIndex].responses[k]["_id"] == req.query.idrep) {
      if (
        userHasUpvoted(
          req._id,
          gradeProfile.comments[cIndex].responses[k].upvotedUsers
        ) < 0
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
      logger.info("Ya ha votado");
      return k;
    }
  }
  logger.info("Nuevo voto");
  return -1;
}

async function processGraduates(data, gradeProfile) {
  gradesArr = [];
  for (let k in data) {
    if (
      GradesController.generateHashGrade(
        data[k]["ESTUDIO"],
        data[k]["LOCALIDAD"]
      ) == gradeProfile.idCarrera
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
  await GradeProfile.updateOne(
    { idCarrera: gradeProfile.idCarrera },
    { $set: { graduated: gradeStats } }
  );
}

function updateExistingGradeProfiles(data) {
  for (let k in data) {
    hash = GradesController.generateHashGrade(
      data[k]["ESTUDIO"],
      data[k]["LOCALIDAD"]
    );
    GradeProfile.findOne({ idCarrera: hash }).exec((err, profile) => {
      if (!err && profile != null) {
        processGraduates(data, profile);
      }
    });
  }
  logger.info("Grades Profile data updated data!");
}

cron.schedule("59 23 * * *", () => {
  logger.info("Updating gradeProfile data..");
  const requestOptions = {
    url: serverOptions.server + graduatedURL,
    method: "GET",
    json: {},
  };
  request(requestOptions, (err, response, body) => {
    if (response.statusCode === 200 && body != null) {
      jsonUrl = body[0].files.find((t) => t.description === "JSON").url;
      const secondRequestOptions = {
        url: jsonUrl,
        method: "GET",
        json: {},
      };
      request(secondRequestOptions, (secondErr, secondResponse, secondBody) => {
        if (secondResponse.statusCode === 200 && secondBody != null) {
          updateExistingGradeProfiles(secondResponse.body.datos);
        }
      });
    }
  });
  logger.info("gradeProfile data updated");
});

const cancelUpVote = function (req, res, next) {
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
    { idCarrera: req.query.idCarrera },
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
          handleCancelUpVoteComment(req, res, gradeProfile);
        } else {
          handleCancelUpVoteReply(req, res, gradeProfile);
        }
      }
    }
  );
};

function handleCancelUpVoteComment(req, res, gradeProfile) {
  console.log("Es comentario");
  k = userHasUpvoted(req._id, gradeProfile.comments[cIndex].upvotedUsers);
  if (k >= 0) {
    gradeProfile.comments[cIndex].upvotes--;
    gradeProfile.comments[cIndex].upvotedUsers.splice(k, 1);
  } else {
    return res.status(400).json({
      status: false,
      message: "El comentario no habia sido votado por este usuario",
    });
  }
  console.log(gradeProfile.comments[cIndex]);
  gradeProfile.save();
  res.send(gradeProfile);
}

function handleCancelUpVoteReply(req, res, gradeProfile) {
  found = false;
  console.log("Es respuesta");
  for (let k in gradeProfile.comments[cIndex].responses) {
    if (gradeProfile.comments[cIndex].responses[k]["_id"] == req.query.idrep) {
      l = userHasUpvoted(
        req._id,
        gradeProfile.comments[cIndex].responses[k].upvotedUsers
      );
      if (l >= 0) {
        gradeProfile.comments[cIndex].responses[k].upvotes--;
        gradeProfile.comments[cIndex].responses[k].upvotedUsers.splice(l, 1);
      } else {
        return res.status(400).json({
          status: false,
          message: "La respuesta no habia sido votada por este usuario",
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

module.exports = {
  gradeProfile,
  comment,
  reply,
  upVote,
  cancelUpVote,
  httpNotImplemented,
};
