const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI, (err) => {
  if (!err) {
    console.log("Connected to Mongo");
  } else {
    console.log(
      "Error in Mongo connection: " + JSON.stringify(err, undefined, 2)
    );
  }
});
