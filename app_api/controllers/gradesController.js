const request = require('request');
const cron = require('node-cron');
const Grades = require('../models/gradeSchema');
const { hash } = require('bcryptjs');
const  crypto = require('crypto');
const admissionURL = '/search?p=DS003-YYYY&of=recjson&jrec=1&rg=1';
const serverOptions = {
  server : 'https://zaguan.unizar.es'
};

const getLastYear = function(req, res) {
  Grades
    .findOne({})
    .sort('-curso')
    .exec((err, year) => {
      if (err) {
        res
          .status(404)
          .json(err);
        return;
      } else {
          if (year != null) {
            Grades
              .find({curso : year.curso},{_id :0, __v:0})
              .exec((err, lastYear) => {
                if (err) {
                  res
                    .status(404)
                    .json(err);
                } else {
                  res
                    .status(200)
                    .json(lastYear);
                }
              });
            return;
          } 
          getJsonUrl(res,admissionURL.replace("YYYY",""))  
      }
    });
};



const getYear = function (req, res) {
  const year = req.params.year;
  if(year && !isNaN(year)) {
      Grades
        .find({curso : year},{_id :0, __v:0})
        .exec((err, grades) => {
          if (err) {
            res
              .status(404)
              .json(err);
            return;
          } else {
            if (grades.length) {
              res
                .status(200)
                .json(grades)
              return;
            } 
            getJsonUrl(res,admissionURL.replace("YYYY",year));
          }
        });
  } else {
    res
      .status(404)
      .json({
        "year": "Not found, year required"
    });
  }
};

const httpNotImplemented = function (req, res) {
  res.status(501).json("Operation not implemented");
};

function getJsonUrl(res, query){
  const requestOptions = {
    url : serverOptions.server + query,
    method : 'GET',
    json : {},
  };
  request(
    requestOptions,
    (err, response, body) => {
      console.log(response.statusCode)
      if (response.statusCode === 200 && body != null) {
        jsonUrl = body[0].files.find(t=>t.description ==='JSON').url
        getJsonContent(res,jsonUrl)
        return;
      } else if(response.statusCode === 200 && body == null) {
          res
            .status(404)
            .json({
              "message": "Year not saved"
            });
          return;
      } 
      res
        .status(500)
        .json({
          "message": "There was an error while querying Zaguan"
        });
    });
}

function getJsonContent(res, jsonUrl){
  const requestOptions = {
    url : jsonUrl,
    method : 'GET',
    json : {},
  };
  request(
    requestOptions,
    (err, response, body) => {
      if (response.statusCode === 200 && body != null) {
         gradesProc = processGrades(body.datos)
         res
          .status(200)
          .json(gradesProc);
         Grades.insertMany(gradesProc); 
         return;
      } 
      res
        .status(500)
        .json({
          "message": "There was an error while querying Zaguan"
        });
    });
}


function processGrades(data) {
  gradesArr = [];
  for (let k in data) {
    maxGrade = Math.max(data[k]["NOTA_CORTE_DEFINITIVA_1"],
                        data[k]["NOTA_CORTE_DEFINITIVA_2"],
                        data[k]["NOTA_CORTE_ADJUDICACION_1"],
                        data[k]["NOTA_CORTE_ADJUDICACION_2"])
    currentDegree = {nota:       maxGrade, 
                     centro:     data[k]["CENTRO"],
                     estudio :   data[k]["ESTUDIO"],
                     localidad : data[k]["LOCALIDAD"],
                     cupo:       data[k]["CUPO_ADJUDICACION"],
                     curso:      data[k]["CURSO_ACADEMICO"],
                     idCarrera:  generateHashGrade(data[k]["ESTUDIO"],data[k]["CENTRO"])}
    gradesArr.push({...currentDegree})
  }
  return gradesArr;
}


async function updateCurrentYearGrades(data) {
  for (let k in data) {
    maxGrade = Math.max(data[k]["NOTA_CORTE_DEFINITIVA_1"],
                        data[k]["NOTA_CORTE_DEFINITIVA_2"],
                        data[k]["NOTA_CORTE_ADJUDICACION_1"],
                        data[k]["NOTA_CORTE_ADJUDICACION_2"]);
    await Grades.updateOne({estudio :   data[k]["ESTUDIO"], 
                            centro:     data[k]["CENTRO"],
                            estudio :   data[k]["ESTUDIO"],
                            localidad : data[k]["LOCALIDAD"],
                            cupo:       data[k]["CUPO_ADJUDICACION"],
                            curso:      data[k]["CURSO_ACADEMICO"],
                            idCarrera:  generateHashGrade(data[k]["ESTUDIO"],data[k]["CENTRO"]) },
          {$set: {nota : maxGrade}});
  }
}

function generateHashGrade(degree, school) {
  return crypto.createHash('md5').update(degree + school).digest("hex");
}



cron.schedule('* 23 * * *', () => {
  console.log('Updating admission data..');
  const requestOptions = {
    url : serverOptions.server + admissionURL.replace("YYYY",""),
    method : 'GET',
    json : {},
  };
  request(
    requestOptions,
    (err, response, body) => {
      if (response.statusCode === 200 && body != null) {
        jsonUrl = body[0].files.find(t=>t.description ==='JSON').url
        const secondRequestOptions = {
          url : jsonUrl,
          method : 'GET',
          json : {},
        };
        request(
          secondRequestOptions,
          (secondErr, secondResponse, secondBody) => {
            if (secondResponse.statusCode === 200 && secondBody != null) {
              Grades
                .findOne({})
                .sort('-curso')
                .exec((err, year) => {
                  if (!err && (year == null ||
                      secondResponse.body.datos[0]["CURSO_ACADEMICO"] != year.curso)) {
                      console.log("New data!")
                      gradesProc = processGrades(secondResponse.body.datos)
                      Grades.insertMany(gradesProc); 
                  } else if(!err && year != null && 
                            secondResponse.body.datos[0]["CURSO_ACADEMICO"] == year.curso) {
                      console.log("Updated data!")
                      updateCurrentYearGrades(secondResponse.body.datos)
                  }
               });
            } 
          });
      } 
    });
  console.log('Admission data updated');
})

module.exports = {
  getLastYear,
  getYear,
  httpNotImplemented,
};
