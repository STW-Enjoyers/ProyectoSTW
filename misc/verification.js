const User = require("../app_api/models/userSchema");

function checkIfAdmin(req) {
  User.findOne({ _id: req._id }, (err, user) => {
    if (!user || !user.admin) return false;
    else return true;
  }).then((isadmin) => {
    return isadmin;
  });
}

module.exports = {
  checkIfAdmin,
};
