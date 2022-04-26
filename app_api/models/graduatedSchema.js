const Mongoose = require("mongoose");
const graduatedSchema = new Mongoose.Schema({
  average: Number,
  graduated: Number,
  changed: Number,
  abandoned: Number,
});
module.exports = Mongoose.model("Graduated", graduatedSchema);
