const Mongoose = require("mongoose")

const gradeSchema = new Mongoose.Schema({
    nota:       { type: Number, min: 0, max: 14 },
    centro:     { type: String },
    estudio:    { type: String },
    localidad : { type: String },
    cupo :      { type: String },
    curso :     { type: Number },
    idCarrera : { type: String }
  })
module.exports = Mongoose.model("Grade", gradeSchema)


