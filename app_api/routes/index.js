var express = require("express");
var router = express.Router();

const ctrlGrades = require("../controllers/gradesController");
const ctrlErasmus = require("../controllers/erasmusController");
const controlUser = require("../controllers/userController");
const jwtHelper = require("../../config/jwtHelper");

/* GET all admission grades. */
/**
 * @openapi
 * /grades/last:
 *   get:
 *       description: Get last year admission grades
 *       tags:
 *         - admission
 *       responses:
 *           200:
 *               description: An array of admission grades
 *           404:
 *               description: Data for last year was not found
 *           500:
 *               description: Internal server error
 */
router
  .route("/grades/last")
  .get(ctrlGrades.getLastYear)
  .post(ctrlGrades.httpNotImplemented)
  .delete(ctrlGrades.httpNotImplemented)
  .put(ctrlGrades.httpNotImplemented);

/* GET ${year} admission grades. */
/**
 * @openapi
 * /grades/{year}:
 *   get:
 *       description: Get admission grades for a certain year
 *       tags:
 *         - admission
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
  .route("/grades/:year")
  .get(ctrlGrades.getYear)
  .post(ctrlGrades.httpNotImplemented)
  .delete(ctrlGrades.httpNotImplemented)
  .put(ctrlGrades.httpNotImplemented);

/* GET number of Erasmus offers for studying at Unizar. */
/**
 * @openapi
 * /erasmus/in:
 *   get:
 *       description: Get number of Erasmus offers for studying at Unizar this year
 *       tags:
 *         - Erasmus
 *       responses:
 *           200:
 *               description: An array of Erasmus offers
 *           404:
 *               description: Data for the latest year was not found
 *           500:
 *               description: Internal server error
 */
router
  .route("/erasmus/in")
  .get(ctrlErasmus.getIn)
  .post(ctrlErasmus.httpNotImplemented)
  .delete(ctrlErasmus.httpNotImplemented)
  .put(ctrlErasmus.httpNotImplemented);

/* GET number of Erasmus offers for Unizar students for studying abroad. */
/**
 * @openapi
 * /erasmus/out:
 *   get:
 *       description: Get number of Erasmus offers for Unizar students for studying abroad
 *       tags:
 *         - Erasmus
 *       responses:
 *           200:
 *               description: An array of Erasmus offers
 *           404:
 *               description: Data for the latest year was not found
 *           500:
 *               description: Internal server error
 */
router
  .route("/erasmus/out")
  .get(ctrlErasmus.getOut)
  .post(ctrlErasmus.httpNotImplemented)
  .delete(ctrlErasmus.httpNotImplemented)
  .put(ctrlErasmus.httpNotImplemented);

/* POST new registered User. */
/**
 * @openapi
 * /register:
 *   post:
 *       description: Post new registered User.
 *       tags:
 *         - Register
 *       responses:
 *           200:
 *               description: An array of Erasmus offers
 *           404:
 *               description: Data for the latest year was not found
 *           500:
 *               description: Internal server error
 */
router
  .route("/register")
  .post(controlUser.register)
  .get(controlUser.httpNotImplemented)
  .delete(controlUser.httpNotImplemented)
  .put(controlUser.httpNotImplemented);

/* POST logged user */
/**
 * @openapi
 * /register:
 *   post:
 *       description: Post new registered User.
 *       tags:
 *         - Register
 *       responses:
 *           200:
 *               description: jwt Token
 *           404:
 *               description: User not found
 *           500:
 *               description: Internal server error
 */
router
  .route("/login")
  .post(controlUser.login)
  .get(controlUser.httpNotImplemented)
  .delete(controlUser.httpNotImplemented)
  .put(controlUser.httpNotImplemented);

router
  .route("/profile")
  .get(jwtHelper.verifyJwtToken, controlUser.profile)
  .post(controlUser.httpNotImplemented)
  .delete(controlUser.httpNotImplemented)
  .put(controlUser.httpNotImplemented);

module.exports = router;
