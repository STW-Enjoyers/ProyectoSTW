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
  status: String,
  body: String,
  commentId: String,
  adminCheck: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

const commentSchema = new Mongoose.Schema({
  username: String,
  upvotes: Number,
  upvotedUsers: [String],
  visible: Boolean,
  status: String,
  body: String,
  adminCheck: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  responses: [responseSchema],
});

const gradeProfileSchema = new Mongoose.Schema({
  idCarrera: String,
  graduated: graduatedSchema,
  comments: [commentSchema],
  deletedCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
});

module.exports = Mongoose.model("GradeProfile", gradeProfileSchema);
