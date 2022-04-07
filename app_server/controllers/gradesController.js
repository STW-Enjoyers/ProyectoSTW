const axios = require('axios')
const cron = require('node-cron');

const admissionGradesURL = 'https://zaguan.unizar.es/search?p=DS003&of=recjson&jrec=1&rg=1';
const NOTA_CORTE_DEFINITIVA_1 = "NOTA_CORTE_DEFINITIVA_1"
const NOTA_CORTE_DEFINITIVA_2 = "NOTA_CORTE_DEFINITIVA_2"
const NOTA_CORTE_ADJUDICACION_1 = "NOTA_CORTE_ADJUDICACION_1"
const NOTA_CORTE_ADJUDICACION_2 = "NOTA_CORTE_ADJUDICACION_2"
var admissionGradesJSON = ""

/*cron.schedule('* * * * *', () => {
  (async () => {
    jsonURL = await getLatestJsonUrl(admissionGradesURL);
    console.log('Ultimo JSON: ' + jsonURL);
  })()
});*/

const getGrades = function(req, res, next) {
    (async () => {
      jsonURL = await getLatestJsonUrl(admissionGradesURL)
      res.status(200);
      res.send(await getJson(jsonURL));
    })()
};

async function getLatestJsonUrl(url) {
  const response = await axios.get(url)
  return response.data[0].files.find(t=>t.description ==='JSON').url
}

async function getJson(url) {
  const response = await axios.get(url)
  
  grades = [];
  for (let k in response.data.datos) {
    maxGrade = Math.max(response.data.datos[k]["NOTA_CORTE_DEFINITIVA_1"],
                        response.data.datos[k]["NOTA_CORTE_DEFINITIVA_2"],
                        response.data.datos[k]["NOTA_CORTE_ADJUDICACION_1"],
                        response.data.datos[k]["NOTA_CORTE_ADJUDICACION_2"])
    currentDegree = {"nota": maxGrade, 
                     "centro": response.data.datos[k]["CENTRO"],
                     "estudio" : response.data.datos[k]["ESTUDIO"],
                     "localidad" :response.data.datos[k]["LOCALIDAD"],
                     "cupo": response.data.datos[k]["CUPO_ADJUDICACION"]}
    grades.push({...currentDegree})
  }
  return grades
}

module.exports = {
  getGrades
};