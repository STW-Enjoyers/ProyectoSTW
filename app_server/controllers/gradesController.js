const axios = require('axios')
const cron = require('node-cron');
const Grades = require('../models/gradeSchema')
const admissionGradesURL = 'https://zaguan.unizar.es/search?p=DS003&of=recjson&jrec=1&rg=1';

const getGrades = function(req, res, next) {
    (async () => {
      results = await Grades.find({lastOne : true},{_id :0, __v:0}) 
      if(!results.length) {
        jsonURL = await getLatestJsonUrl(admissionGradesURL);
        jsonContent = await getJsonContent(jsonURL);
        await Grades.insertMany(jsonContent);
        res.send(jsonContent);
      } else {
        res.send(results);
      }
      res.status(200);    
    })()
};


async function getLatestJsonUrl(url) {
  const response = await axios.get(url)
  return response.data[0].files.find(t=>t.description ==='JSON').url
}

async function getJsonContent(url) {
  const response = await axios.get(url)
  
  gradesArr = [];
  for (let k in response.data.datos) {
    maxGrade = Math.max(response.data.datos[k]["NOTA_CORTE_DEFINITIVA_1"],
                        response.data.datos[k]["NOTA_CORTE_DEFINITIVA_2"],
                        response.data.datos[k]["NOTA_CORTE_ADJUDICACION_1"],
                        response.data.datos[k]["NOTA_CORTE_ADJUDICACION_2"])

    currentDegree = {nota: maxGrade, 
                    centro: response.data.datos[k]["CENTRO"],
                    estudio : response.data.datos[k]["ESTUDIO"],
                    localidad :response.data.datos[k]["LOCALIDAD"],
                    cupo: response.data.datos[k]["CUPO_ADJUDICACION"],
                    curso: response.data.datos[k]["CURSO_ACADEMICO"] }
    gradesArr.push({...currentDegree})
  }
  return gradesArr
}

/*cron.schedule('* * * * *', () => {
  (async () => {
    console.log('Ultimo JSON: ');
  })()
})*/

module.exports = {
  getGrades
};