var express = require('express');
var router = express.Router();

const ctrlGrades = require('../controllers/gradesController');

/* GET all admisison grades. */
/**
* @openapi
* /grades:
*   get:
*       description: Get admission grades!
*       responses:
*           200:
*               description: Returns admission grades for Unizar's grades
*/
router.get('/',ctrlGrades.getGrades);

module.exports = router;
