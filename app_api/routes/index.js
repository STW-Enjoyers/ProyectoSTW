var express = require('express');
var router = express.Router();

const ctrlGrades = require('../controllers/gradesController');
const ctrlErasmus = require('../controllers/erasmusController');
const controlUser = require("../controllers/userController");
const jwtHelper = require("../../config/jwtHelper");


/* GET all admisison grades. */
/**
* @openapi
* /grades/last:
*   get:
*       description: Get last year admission grades
*       responses:
*           200:
*               description: An array of admission grades
*           404: 
*               description: Data for last year was not found
*           500:
*               description: Internal server error
*/
router
    .route('/grades/last')
    .get(ctrlGrades.getLastYear)
    .post(ctrlGrades.httpNotImplemented)
    .delete(ctrlGrades.httpNotImplemented)
    .put(ctrlGrades.httpNotImplemented)

/* GET ${year} admisison grades. */
/**
* @openapi
* /grades/{year}:
*   get:
*       description: Get admission grades for a certain year
*       parameters:
*         - in: path  
*           name: year
*           required: true
*           description: The year of the admission grades to retrieve
*           type: integer   
*       responses:
*           200:
*               description: An array of {year} admission grades
*           404: 
*               description: Data for {year} was not found
*           500:
*               description: Internal server error   
*/
router
    .route('/grades/:year')
    .get(ctrlGrades.getYear)
    .post(ctrlGrades.httpNotImplemented)
    .delete(ctrlGrades.httpNotImplemented)
    .put(ctrlGrades.httpNotImplemented)

/* GET number of Erasmus offers for studying at Unizar. */
/**
* @openapi
* /erasmus/in:
*   get:
*       description: Get number of Erasmus offers for studying at Unizar this year
*       responses:
*           200:
*               description: An array of Erasmus offers
*           404: 
*               description: Data for the latest year was not found
*           500:
*               description: Internal server error
*/
router
    .route('/erasmus/in')
    .get(ctrlErasmus.getIn)
    .post(ctrlErasmus.httpNotImplemented)
    .delete(ctrlErasmus.httpNotImplemented)
    .put(ctrlErasmus.httpNotImplemented)


/* GET number of Erasmus offers for Unizar students for studying abroad. */
/**
* @openapi
* /erasmus/out:
*   get:
*       description: Get number of Erasmus offers for Unizar students for studying abroad
*       responses:
*           200:
*               description: An array of Erasmus offers
*           404: 
*               description: Data for the latest year was not found
*           500:
*               description: Internal server error
*/
router
    .route('/erasmus/out')
    .get(ctrlErasmus.getOut)
    .post(ctrlErasmus.httpNotImplemented)
    .delete(ctrlErasmus.httpNotImplemented)
    .put(ctrlErasmus.httpNotImplemented)


router.post("/register", controlUser.register);
router.post("/login", controlUser.login);
router.get("/profile", jwtHelper.verifyJwtToken, controlUser.profile);




module.exports = router;
