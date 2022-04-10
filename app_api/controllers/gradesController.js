const axios = require("axios");
const cron = require("node-cron");
const Grades = require("../models/gradeSchema");
const admissionURL =
  "https://zaguan.unizar.es/search?p=DS003-YYYY&of=recjson&jrec=1&rg=1";

const getLastYear = function (req, res, next) {
  try {
    (async () => {
      lastYear = await getLastYearSaved();
      if (lastYear != null) {
        results = await Grades.find({ curso: lastYear }, { _id: 0, __v: 0 });
      } else {
        jsonURL = await getJsonUrl(admissionURL.replace("-YYYY", ""));
        results = await getNewYearGrades(jsonURL);
        await Grades.insertMany(results);
      }
      res.status(200).send(results);
    })();
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

const getYear = function (req, res, next) {
  try {
    (async () => {
      const year = req.params.year;
      if (year && !isNaN(year)) {
        results = await Grades.find({ curso: year }, { _id: 0, __v: 0 });
        if (results.length) {
          res.status(200).send(results);
          return;
        } else {
          jsonURL = await getJsonUrl(admissionURL.replace("YYYY", year));
          if (jsonURL != null) {
            results = await getNewYearGrades(jsonURL);
            await Grades.insertMany(results);
            res.status(200).send(results);
            return;
          }
        }
      }
      res.status(404).send("Year not found");
    })();
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

const httpNotImplemented = function (req, res) {
  res.status(501).json("Operation not implemented");
};

async function getJsonUrl(url) {
  const response = await axios.get(url);
  if (response.data != "") {
    return response.data[0].files.find((t) => t.description === "JSON").url;
  }
  return null;
}

async function getNewYearGrades(url) {
  const response = await axios.get(url);
  gradesArr = [];
  for (let k in response.data.datos) {
    maxGrade = Math.max(
      response.data.datos[k]["NOTA_CORTE_DEFINITIVA_1"],
      response.data.datos[k]["NOTA_CORTE_DEFINITIVA_2"],
      response.data.datos[k]["NOTA_CORTE_ADJUDICACION_1"],
      response.data.datos[k]["NOTA_CORTE_ADJUDICACION_2"]
    );
    currentDegree = {
      nota: maxGrade,
      centro: response.data.datos[k]["CENTRO"],
      estudio: response.data.datos[k]["ESTUDIO"],
      localidad: response.data.datos[k]["LOCALIDAD"],
      cupo: response.data.datos[k]["CUPO_ADJUDICACION"],
      curso: response.data.datos[k]["CURSO_ACADEMICO"],
    };
    gradesArr.push({ ...currentDegree });
  }
  return gradesArr;
}

async function getLastYearSaved() {
  yearGrade = await Grades.findOne({}).sort("-curso");
  if (yearGrade) return yearGrade.curso;
  return null;
}

async function updateCurrentYearGrades(url) {
  const response = await axios.get(url);
  for (let k in response.data.datos) {
    maxGrade = Math.max(
      response.data.datos[k]["NOTA_CORTE_DEFINITIVA_1"],
      response.data.datos[k]["NOTA_CORTE_DEFINITIVA_2"],
      response.data.datos[k]["NOTA_CORTE_ADJUDICACION_1"],
      response.data.datos[k]["NOTA_CORTE_ADJUDICACION_2"]
    );
    await Grades.updateOne(
      {
        estudio: response.data.datos[k]["ESTUDIO"],
        centro: response.data.datos[k]["CENTRO"],
        estudio: response.data.datos[k]["ESTUDIO"],
        localidad: response.data.datos[k]["LOCALIDAD"],
        cupo: response.data.datos[k]["CUPO_ADJUDICACION"],
        curso: response.data.datos[k]["CURSO_ACADEMICO"],
      },
      { $set: { nota: maxGrade } }
    );
  }
}

cron.schedule("* 23 * * *", () => {
  (async () => {
    console.log("Updating admission data..");
    // Update last saved year
    lastYear = await getLastYearSaved();
    if (lastYear != null) {
      lastYearUrl = await getJsonUrl(admissionURL.replace("YYYY", lastYear));
      updateCurrentYearGrades(lastYearUrl);
    }
    // Find new grades
    jsonURL = await getJsonUrl(admissionURL.replace("-YYYY", ""));
    if (lastYear == null || lastYearUrl != jsonURL) {
      console.log("There is a new year!");
      results = await getNewYearGrades(jsonURL);
      Grades.insertMany(results);
    }
    console.log("Admission data updated");
  })();
});

module.exports = {
  getLastYear,
  getYear,
  httpNotImplemented,
};
