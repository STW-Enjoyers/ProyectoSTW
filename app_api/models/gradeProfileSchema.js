const Mongoose = require("mongoose");
const Grade = require("./gradeSchema");

//Lo he copiado tal cual porque explotaba si usaba Grade
const gradeSchema = new Mongoose.Schema({
  nota: { type: Number, min: 0, max: 14 },
  centro: { type: String },
  estudio: { type: String },
  localidad: { type: String },
  cupo: { type: String },
  curso: { type: Number },
  idCarrera: { type: String },
});

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
  grade: { type: gradeSchema, unique: true },
  graduated: graduatedSchema,
  comments: [commentSchema],
});

module.exports = Mongoose.model("GradeProfile", gradeProfileSchema);
