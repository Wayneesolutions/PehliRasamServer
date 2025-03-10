exports.successResponse = (
  res = {},
  statusCode = 200,
  message = "Ok",
  data = {}
) => {
  res.status(statusCode).json({
    success: statusCode === 200 || statusCode === 201 ? true : false,
    message: message,
    data,
  });
};

exports.successLoginResponse = (
  res = {},
  statusCode = 200,
  message = "Ok",
  data = {},
  token = ""
) => {
  res.status(statusCode).json({
    success: statusCode === 200 || statusCode === 201 ? true : false,
    message: message,
    data,
    token,
  });
};

exports.catchErrorResponse = (
  res = {},
  statusCode = 500,
  message = "SOMETHING_WENT_WRONG",
  data = {},
  fullError = {}
) => {
  res.status(statusCode).json({
    success: false,
    message: "Validation Error",
    data,
    fullError,
  });
};
