const request = require('request');
const cron = require('node-cron');
const Erasmus = require('../models/erasmusSchema');
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
                    erasmusStats(res,"IN","$ofertadas");
                }
              });
            return;
          } 
          getJsonUrl(res,erasmusURL.replace("YYYY",""),"IN","$ofertadas")
      }
    });
}

const getOut = function (req, res) {
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
                  erasmusStats(res,"OUT","$asignadas");
              }
            });
          return;
        } 
        getJsonUrl(res,erasmusURL.replace("YYYY",""),"OUT","$asignadas")
    }
  });
}


function erasmusStats(res, destiny, sum) {
  Erasmus.aggregate(
      [ { $match : { in_out : destiny } },
        {
          $group: {
            _id: { "pais": "$pais" },
            plazas: {
              $sum: sum
            }
          }
        }
      ],
      function(err, result) {
        if (err) {
          res
            .status(500)
            .json({
              "message": "There was an error while obtaining your data"
            });
        } else {
            res
            .status(200)
            .json(result);
        }
      }
    );
};


function getJsonUrl(res, query,destiny, sum){
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
          getJsonContent(res,jsonUrl,destiny, sum)
        } else if(response.statusCode === 200 && body == null) {
            res
              .status(404)
              .json({
                "message": "Information not saved"
              });
        } else {
            res
              .status(500)
              .json({
                "message": "There was an error while querying Zaguan"
              });
        }   
      });
}

function getJsonContent(res, jsonUrl,destiny, sum){
    const requestOptions = {
      url : jsonUrl,
      method : 'GET',
      json : {},
    };
    request(
      requestOptions,
      (err, response, body) => {
        if (response.statusCode === 200 && body != null) {
          erasmusProc = processErasmus(body.datos.filter(a => a.NOMBRE_PROGRAMA_MOVILIDAD == "ERASMUS"));
          (async () => {
            await Erasmus.insertMany(erasmusProc)
            erasmusStats(res,destiny, sum); 
          })()
        } else {
            res
              .status(500)
              .json({
                "message": "There was an error while querying Zaguan"
            });
        }
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
                       in_out:      data[k]["IN_OUT"]}
      gradesArr.push({...currentDegree})
    }
    return gradesArr;
}

  async function updateCurrentErasmus(data) {
    for (let k in data) {
      await Erasmus.updateOne({ centro:      data[k]["CENTRO"],
                                idioma:      data[k]["NOMBRE_IDIOMA_NIVEL_MOVILIDAD"], 
                                curso:       data[k]["CURSO_ACADEMICO"],
                                universidad: data[k]["UNIVERSIDAD_ACUERDO"],
                                area:        data[k]["NOMBRE_AREA_ESTUDIOS_MOV"],
                                pais:        data[k]["PAIS_UNIVERSIDAD_ACUERDO"],
                                in_out:      data[k]["IN_OUT"]},
            {$set: {ofertadas : data[k]["PLAZAS_OFERTADAS_ALUMNOS"], 
                    asignadas : data[k]["PLAZAS_OFERTADAS_ALUMNOS"]}})
    }
    console.log("Updated data!")
  }


const httpNotImplemented = function (req, res) {
    res.status(501).json("Operation not implemented");
};

cron.schedule('50 23 * * *', () => {
  console.log('Updating Erasmus data..');
  const requestOptions = {
    url : serverOptions.server + erasmusURL.replace("YYYY",""),
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
              Erasmus
                .findOne({})
                .sort('-curso')
                .exec((err, year) => {
                  if (!err && (year == null ||
                      secondResponse.body.datos[0]["CURSO_ACADEMICO"] != year.curso)) {
                      console.log("New data!")
                      gradesProc = processErasmus(secondResponse.body.datos.filter(a => a.NOMBRE_PROGRAMA_MOVILIDAD == "ERASMUS"))
                      Erasmus.insertMany(gradesProc); 
                  } else if(!err && year != null && 
                            secondResponse.body.datos[0]["CURSO_ACADEMICO"] == year.curso) {
                      updateCurrentErasmus(secondResponse.body.datos.filter(a => a.NOMBRE_PROGRAMA_MOVILIDAD == "ERASMUS"))
                  }
               });
            } 
          });
      } 
    });
})



module.exports = {
    getIn,
    getOut,
    httpNotImplemented
};
