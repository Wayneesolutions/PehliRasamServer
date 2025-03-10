const jwt = require("jsonwebtoken");
const Admin = require("../models/admin/adminModel");
const { catchErrorResponse } = require("../utils/response");

exports.checkAdminToken = async (req, res, next) => {
  try {
    let token;
    if (req?.headers?.authorization?.startsWith("Bearer")) {
      token = req?.headers?.authorization?.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);
      let admin = await Admin.findOne({
        _id: decoded.id,
        isDeleted: false,
      });
      if (admin) {
        req.id = admin._id;
        req.role = admin.role;
      } else {
        req.id = null;
        req.role = null;
      }
      next();
    } else {
      return catchErrorResponse(
        res,
        401,
        // commonConstants.UNAUTHORIZED,
        "Unauthorized request",
        {},
        "Token error"
      );
    }
  } catch (error) {
    return catchErrorResponse(
      res,
      401,
      "Not authorized, token failed",
      {},
      error.message
    );
  }
};
