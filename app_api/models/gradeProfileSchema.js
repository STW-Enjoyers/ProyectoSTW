const Mongoose = require("mongoose");

const graduatedSchema = new Mongoose.Schema({
  average: Number,
  graduated: Number,
  changed: Number,
  abandoned: Number,
});

const responseSchema = new Mongoose.Schema({
  username: String,
  upvotes: Number,
  upvotedUsers: [String],
  visible: Boolean,
  body: String,
  commentId: String,
  date: { type: Date, default: Date.now },
});

const commentSchema = new Mongoose.Schema({
  username: String,
  upvotes: Number,
  upvotedUsers: [String],
  visible: Boolean,
  body: String,
  date: { type: Date, default: Date.now },
  responses: [responseSchema],
});

const gradeProfileSchema = new Mongoose.Schema({
  idCarrera: String,
  graduated: graduatedSchema,
  comments: [commentSchema],
});

module.exports = Mongoose.model("GradeProfile", gradeProfileSchema);
