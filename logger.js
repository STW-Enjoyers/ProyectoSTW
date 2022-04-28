const { createLogger, format, transports } = require('winston');
const { combine, timestamp, errors, json} = format;

const logger = 
    createLogger({
        format: combine(
          timestamp(),
          errors({stack : true}),
          json()
        ),
        transports: [new transports.Console()]
      });
module.exports = logger;