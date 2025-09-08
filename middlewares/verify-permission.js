const config = require("../config/config");
const jwt = require("jsonwebtoken");
const utils = require("../utils/utils");

const verifyToken = (request, response, next) => {
  try {
    if (!request.headers["x-access-token"]) {
      return response.status(401).json({
        accepted: false,
        message: "unauthorized to access resources",
        field: "x-access-token",
      });
    }

    const token = request.headers["x-access-token"];

    jwt.verify(token, config.SECRET_KEY, (error, data) => {
      if (error) {
        return response.status(401).json({
          accepted: false,
          message: "invalid token",
          field: "token",
        });
      }

      request.user = data;

      next();
      return;
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};

const staffPermission = (request, response, next) => {
  try {
    const authorizedRoles = ["STAFF"];

    verifyToken(request, response, () => {
      const { roles } = request.user;

      if (utils.isRolesValid(roles, authorizedRoles)) {
        next();
      } else {
        return response.status(403).json({
          accepted: false,
          message: "unauthorized user type to access this resources",
          field: "token",
        });
      }
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};

const doctorPermission = (request, response, next) => {
  try {
    const authorizedRoles = ["DOCTOR"];

    verifyToken(request, response, () => {
      const { roles } = request.user;

      if (utils.isRolesValid(roles, authorizedRoles)) {
        next();
      } else {
        return response.status(403).json({
          accepted: false,
          message: "unauthorized user type to access this resources",
          field: "token",
        });
      }
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};

const ownerPermission = (request, response, next) => {
  try {
    const authorizedRoles = ["OWNER"];

    verifyToken(request, response, () => {
      const { roles } = request.user;

      if (utils.isRolesValid(roles, authorizedRoles)) {
        next();
      } else {
        return response.status(403).json({
          accepted: false,
          message: "unauthorized user type to access this resources",
          field: "token",
        });
      }
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};

const allPermission = (request, response, next) => {
  try {
    const authorizedRoles = ["EMPLOYEE"];
    const types = ["EMPLOYEE", "ADMIN"];

    verifyToken(request, response, () => {
      const { roles, type } = request.user;

      if (utils.isRolesValid(roles, authorizedRoles) || types.includes(type)) {
        next();
      } else {
        return response.status(403).json({
          accepted: false,
          message: "unauthorized user type to access this resources",
          field: "token",
        });
      }
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};

const adminAndExpertPermission = (request, response, next) => {
  try {
    const authorizedRoles = ["EMPLOYEE"];
    const types = ["EXPERT"];

    verifyToken(request, response, () => {
      const { roles, type } = request.user;

      if (utils.isRolesValid(roles, authorizedRoles) || types.includes(type)) {
        next();
      } else {
        return response.status(403).json({
          accepted: false,
          message: "unauthorized user type to access this resources",
          field: "token",
        });
      }
    });
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      message: "internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  verifyToken,
  staffPermission,
  doctorPermission,
  ownerPermission,
  allPermission,
  adminAndExpertPermission,
};
