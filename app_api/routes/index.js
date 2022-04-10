var express = require('express');
var router = express.Router();

const ctrlGrades = require('../controllers/gradesController');
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
*               description: Returns last year admission grades for Unizar
*/
router
    .route('/grades/last')
    .get(ctrlGrades.getLastYear)
    .post(ctrlGrades.httpNotImplemented)
    .delete(ctrlGrades.httpNotImplemented)
    .put(ctrlGrades.httpNotImplemented)

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
router
    .route('/grades/:year')
    .get(ctrlGrades.getYear)
    .post(ctrlGrades.httpNotImplemented)
    .delete(ctrlGrades.httpNotImplemented)
    .put(ctrlGrades.httpNotImplemented)


router.post("/register", controlUser.register);
router.post("/login", controlUser.login);
router.get("/profile", jwtHelper.verifyJwtToken, controlUser.profile);




module.exports = router;
