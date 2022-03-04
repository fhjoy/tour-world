class AppError extends Error {           // extending from buitin error.
  constructor(message, statusCode) {     // message and statusCode is the new object created from AppError class.
    super(message);                   // use super in oderto call parent constructor. message is the only parameter that buitin error accepts. This is accually Error

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';   //converting statuscode to string and cheacking is it starts with 4 or not.
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);  // captureStackTrace cature where the error happened. Here "this" means the current object and  "this.constructor" means AppError class itself.
	
  }
}

module.exports = AppError;
