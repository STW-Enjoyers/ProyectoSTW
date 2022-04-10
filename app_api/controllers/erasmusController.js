const request = require('request');
const cron = require('node-cron');
const Erasmus = require('../models/erasmusSchema');
const { hash } = require('bcryptjs');
const  crypto = require('crypto');
const erasmusURL = '/search?p=DS009-YYYY&of=recjson&jrec=1&rg=1';
const serverOptions = {
  server : 'https://zaguan.unizar.es'
};

const getIn = function (req, res) {
    Erasmus
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
            Erasmus
              .find({curso : year.curso},{_id :0, __v:0})
              .exec((err, lastYear) => {
                if (err) {
                  res
                    .status(404)
                    .json(err);
                } else {
                    inStats(res);
                }
              });
            return;
          } 
          getJsonUrl(res,erasmusURL.replace("YYYY",""))
          inStats(res);
      }
    });
}


function inStats(res,year) {
    Erasmus.aggregate(
        [ { $match : { in_out : "IN" } },
          {
            $group: {
              _id: { "pais": "$pais" },
              totalStudents: {
                $sum: "$ofertadas"
              }
            }
          }
        ],
        function(err, result) {
          if (err) {
            res
              .status(500)
              .send(err);
          } else {
            res
             .status(200)
             .json(result);
          }
        }
      );
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
                "message": "Information not saved"
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
           erasmusProc = processErasmus(body.datos.filter(a => a.NOMBRE_PROGRAMA_MOVILIDAD == "ERASMUS"))
           res
            .status(200)
            .json(erasmusProc);
           Erasmus.insertMany(erasmusProc); 
           return;
        } 
        res
          .status(500)
          .json({
            "message": "There was an error while querying Zaguan"
          });
      });
}

function processErasmus(data) {
    gradesArr = [];
    for (let k in data) {
      currentDegree = {centro:      data[k]["CENTRO"],
                       idioma:      data[k]["NOMBRE_IDIOMA_NIVEL_MOVILIDAD"], 
                       curso:       data[k]["CURSO_ACADEMICO"],
                       ofertadas:   data[k]["PLAZAS_OFERTADAS_ALUMNOS"],
                       universidad: data[k]["UNIVERSIDAD_ACUERDO"],
                       area:        data[k]["NOMBRE_AREA_ESTUDIOS_MOV"],
                       pais:        data[k]["PAIS_UNIVERSIDAD_ACUERDO"],
                       asignadas:   data[k]["PLAZAS_ASIGNADAS_ALUMNOS_OUT"],
                       in_out:      data[k]["IN_OUT"],}
      gradesArr.push({...currentDegree})
    }
    return gradesArr;
  }


const httpNotImplemented = function (req, res) {
    res.status(501).json("Operation not implemented");
  };

module.exports = {
    getIn,
    httpNotImplemented
};
