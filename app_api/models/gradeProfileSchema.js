const Mongoose = require("mongoose");
const Grade = require("./gradeSchema");

const graduatedSchema = new Mongoose.Schema({
  average: Number,
  graduated: Number,
  changed: Number,
  abandoned: Number,
});

const responseSchema = new Mongoose.Schema({
  username: String,
  upvotes: Number,
  visible: Boolean,
});

const commentSchema = new Mongoose.Schema({
  username: String,
  upvotes: Number,
  visible: Boolean,
  responses: [responseSchema],
});

const gradeProfileSchema = new Mongoose.Schema({
  grade: Grade,
  graduated: graduatedSchema,
  comments: [commentSchema],
});

module.exports = Mongoose.model("GradeProfile", gradeProfileSchema);
