var express = require('express');
var router = express.Router();

const ctrlGrades = require('../controllers/gradesController');

/* GET all admisison grades. */
/**
* @openapi
* /grades/last:
*   get:
*       description: Get last year admission grades
*       responses:
*           200:
*               description: Returns last year admission grades for Unizar
*/
router.get('/last',ctrlGrades.getLastYear);

/* GET all admisison grades. */
/**
* @openapi
* /grades/year:
*   get:
*       description: Get admission grades for a certain year
*       responses:
*           200:
*               description: Returns admission grades for a certain year at Unizar
*/
router.get('/year',ctrlGrades.getYear);


module.exports = router;
