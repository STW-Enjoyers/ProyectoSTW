const Mongoose = require("mongoose")

const erasmusSchema = new Mongoose.Schema({
    centro:      { type: String },
    idioma:      { type: String },
    curso :      { type: Number },
    ofertadas:   { type: Number },
    universidad: { type: String },
    area:        { type: String },
    pais:        { type: String },
    asignadas:   { type: Number },
    in_out:      { type: String }, 
  })
module.exports = Mongoose.model("Erasmus", erasmusSchema)


