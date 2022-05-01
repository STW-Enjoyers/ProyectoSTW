var express = require("express");
var router = express.Router();

const ctrlGrades = require("../controllers/gradesController");
const ctrlErasmus = require("../controllers/erasmusController");
const controlUser = require("../controllers/userController");
const ctrlGradeProfile = require("../controllers/gradeProfileController");
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

/* GET ${year} admission grades. */
/**
 * @openapi
 * /grades/historical/:degree:
 *   get:
 *       description: Get historical general admission grades for a degree
 *       tags:
 *         - admission
 *       parameters:
 *         - in: path
 *           name: degree
 *           required: true
 *           description: Hash of the degree you want to check
 *           type: integer
 *       responses:
 *           200:
 *               description: An array of admission grades for each year
 *           404:
 *               description: Data for {degree} was not found
 *           500:
 *               description: Internal server error
 */
router
  .route("/grades/historical/:degree")
  .get(ctrlGrades.getAllDegreeGrades)
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
 *       parameters:
 *         - in: body
 *           name: user
 *           required: true
 *           description: User to create
 *           schema:
 *              type: object
 *              required:
 *                - username
 *                - email
 *                - password
 *              properties:
 *                username:
 *                  type: string
 *                email:
 *                  type: string
 *                password:
 *                  type: string
 *       responses:
 *           200:
 *               description: Token and user from database
 *           404:
 *               description: Data for the latest year was not found
 *           422:
 *               description: Duplicate email address
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
 * /login:
 *   post:
 *       description: Post user email and password and get the token.
 *       tags:
 *         - Login
 *       parameters:
 *         - in: body
 *           name: user
 *           required: true
 *           description: User to create
 *           schema:
 *              type: object
 *              required:
 *                - email
 *                - password
 *              properties:
 *                email:
 *                  type: string
 *                password:
 *                  type: string
 *       responses:
 *           200:
 *               description: jwt Token
 *           404:
 *               description: User not found or Incorrect pwd
 *           500:
 *               description: Internal server error
 */
router
  .route("/login")
  .post(controlUser.login)
  .get(controlUser.httpNotImplemented)
  .delete(controlUser.httpNotImplemented)
  .put(controlUser.httpNotImplemented);

/* GET user profile */
/**
 * @openapi
 * /profile:
 *   get:
 *       description: Get user profile given a token.
 *       tags:
 *         - Login
 *       parameters:
 *         - name: Authorization
 *           in: header
 *           type: string
 *           required: true
 *           description: Don't forget the Bearer
 *       responses:
 *           200:
 *               description: User profile data
 *           404:
 *               description: User not found
 *           500:
 *               description: Internal server error
 */
router
  .route("/profile")
  .get(jwtHelper.verifyJwtToken, controlUser.profile)
  .post(controlUser.httpNotImplemented)
  .delete(controlUser.httpNotImplemented)
  .put(controlUser.httpNotImplemented);

/* GET grade profile */
/**
 * @openapi
 * /gradeProfile:
 *   get:
 *       description: Get grade profile given an id.
 *       tags:
 *         - Grade Profile
 *       parameters:
 *         - name: idCarrera
 *           in: query
 *           description: Id of the grade to get the profile.
 *           required: true
 *           type: string
 *       responses:
 *           200:
 *               description: Grade profile data (comments included)
 *           404:
 *               description: User not found
 *           500:
 *               description: Internal server error
 */
router
  .route("/gradeProfile")
  .get(ctrlGradeProfile.gradeProfile)
  .post(ctrlGradeProfile.httpNotImplemented)
  .delete(ctrlGradeProfile.httpNotImplemented)
  .put(ctrlGradeProfile.httpNotImplemented);

/* Post comment on grade profile forum */
/**
 * @openapi
 * /comment:
 *   post:
 *       description: Post comment on grade profile given an id and comment body.
 *       tags:
 *         - Comment
 *       parameters:
 *         - name: Authorization
 *           in: header
 *           type: string
 *           required: true
 *           description: Don't forget the Bearer
 *         - name: idCarrera
 *           in: query
 *           description: Id of the grade to comment on.
 *           required: true
 *           type: string
 *         - name: cuerpo
 *           in: query
 *           description: Body of the new comment.
 *           required: true
 *           type: string
 *       responses:
 *           200:
 *               description: Grade profile data with the new comment in its forum
 *           404:
 *               description: Grade not found
 *           500:
 *               description: Internal server error
 */
router
  .route("/comment")
  .get(controlUser.httpNotImplemented)
  .post(jwtHelper.verifyJwtToken, ctrlGradeProfile.comment)
  .delete(controlUser.httpNotImplemented)
  .put(controlUser.httpNotImplemented);

/* Post reply to a comment on a grade profile forum */
/**
 * @openapi
 * /reply:
 *   post:
 *       description: Post reply to a comment on grade profile given an grade id, comment id and reply body.
 *       tags:
 *         - Reply
 *       parameters:
 *         - name: Authorization
 *           in: header
 *           type: string
 *           required: true
 *           description: Don't forget the Bearer
 *         - name: idCarrera
 *           in: query
 *           description: Id of the grade to reply on.
 *           required: true
 *           type: string
 *         - name: cuerpo
 *           in: query
 *           description: Body of the new reply.
 *           required: true
 *           type: string
 *         - name: _id
 *           in: query
 *           description: Id of the comment to reply.
 *           required: true
 *           type: string
 *       responses:
 *           200:
 *               description: Grade profile data with the new reply in its forum
 *           404:
 *               description: Grade or comment not found
 *           500:
 *               description: Internal server error
 */
router
  .route("/reply")
  .get(controlUser.httpNotImplemented)
  .post(jwtHelper.verifyJwtToken, ctrlGradeProfile.reply)
  .delete(controlUser.httpNotImplemented)
  .put(controlUser.httpNotImplemented);

/* Post cancel upVote to a comment or reply */
/**
 * @openapi
 * /cancelUpVote:
 *   post:
 *       description: Post cancel upVote to a comment or reply on grade profile given an grade id, comment id (and reply id if you want to upVote a reply).
 *       tags:
 *         - CancelUpvote
 *       parameters:
 *         - name: Authorization
 *           in: header
 *           type: string
 *           required: true
 *           description: Don't forget the Bearer
 *         - name: idCarrera
 *           in: query
 *           description: Id of the grade to reply on.
 *           required: true
 *           type: string
 *         - name: idcom
 *           in: query
 *           description: Id of the comment to cancel upvote.
 *           required: true
 *           type: string
 *         - name: idrep
 *           in: query
 *           description: Id of the reply to cancel upvote (optional).
 *           required: false
 *           type: string
 *       responses:
 *           200:
 *               description: Grade profile data with the upvote cancelled
 *           400:
 *               description: Comment or reply was not upvoted
 *           404:
 *               description: Grade, comment, or reply not found
 *           500:
 *               description: Internal server error
 */
router
  .route("/cancelUpVote")
  .get(controlUser.httpNotImplemented)
  .post(jwtHelper.verifyJwtToken, ctrlGradeProfile.cancelUpVote)
  .delete(controlUser.httpNotImplemented)
  .put(controlUser.httpNotImplemented);

/* Post upVote to a comment or reply */
/**
 * @openapi
 * /upVote:
 *   post:
 *       description: Post upVote to a comment or reply on grade profile given an grade id, comment id (and reply id if you want to upVote a reply).
 *       tags:
 *         - Upvote
 *       parameters:
 *         - name: Authorization
 *           in: header
 *           type: string
 *           required: true
 *           description: Don't forget the Bearer
 *         - name: idCarrera
 *           in: query
 *           description: Id of the grade to reply on.
 *           required: true
 *           type: string
 *         - name: idcom
 *           in: query
 *           description: Id of the comment to upvote.
 *           required: true
 *           type: string
 *         - name: idrep
 *           in: query
 *           description: Id of the reply to upvote (optional).
 *           required: false
 *           type: string
 *       responses:
 *           200:
 *               description: Grade profile data with the new upvote
 *           404:
 *               description: Grade, comment, or reply not found
 *           500:
 *               description: Internal server error
 */
router
  .route("/upVote")
  .get(controlUser.httpNotImplemented)
  .post(jwtHelper.verifyJwtToken, ctrlGradeProfile.upVote)
  .delete(controlUser.httpNotImplemented)
  .put(controlUser.httpNotImplemented);

/* GET Ban user */
/**
 * @openapi
 * /ban:
 *   get:
 *       description: Ban user given a user (And token from an admin).
 *       tags:
 *         - Ban
 *       parameters:
 *         - name: Authorization
 *           in: header
 *           type: string
 *           required: true
 *           description: Don't forget the Bearer
 *         - name: username
 *           in: query
 *           type: string
 *           required: true
 *           description: User to ban
 *
 *       responses:
 *           200:
 *               description: Banned user
 *           404:
 *               description: User not found or auth failed
 *           500:
 *               description: Internal server error
 */
router
  .route("/ban")
  .get(jwtHelper.verifyJwtToken, controlUser.ban)
  .post(controlUser.httpNotImplemented)
  .delete(controlUser.httpNotImplemented)
  .put(controlUser.httpNotImplemented);

module.exports = router;
