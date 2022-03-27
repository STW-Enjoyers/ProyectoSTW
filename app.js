require("./config/config");
require("./models/db");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

var app = express();

//middleware
app.use(bodyParser.json());
app.use(cors());

//start
app.listen(process.env.PORT, () =>
  console.log(`Server started, PORT: ${process.env.PORT}`)
);
