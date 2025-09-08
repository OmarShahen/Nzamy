const router = require("express").Router();
const authController = require("../controllers/auth");
const { verifyUserId } = require("../middlewares/verify-routes-params");

router.post("/v1/auth/seekers/signup", (request, response) =>
  authController.seekerSignup(request, response)
);

router.post("/v1/auth/signup", authController.signup);

router.post("/v1/auth/login", authController.login);

router.post("/v1/auth/login/google", authController.googleLogin);

router.post("/v1/auth/signup/google", authController.googleSignup);

router.post(
  "/v1/auth/verify/users/:userId/verification-codes/:verificationCode",
  verifyUserId,
  authController.verifyEmailVerificationCode
);

router.post("/v1/auth/google/login", (request, response) =>
  authController.userGoogleLogin(request, response)
);

router.post("/v1/auth/seekers/google/signup", (request, response) =>
  authController.seekerGoogleSignup(request, response)
);

router.post("/v1/auth/employee/login", (request, response) =>
  authController.userEmployeeLogin(request, response)
);

router.post("/v1/auth/verify/personal-info", (request, response) =>
  authController.verifyPersonalInfo(request, response)
);

router.post("/v1/auth/verify/demographic-info", (request, response) =>
  authController.verifyDemographicInfo(request, response)
);

router.post("/v1/auth/verify/speciality-info", (request, response) =>
  authController.verifySpecialityInfo(request, response)
);

router.post("/v1/auth/verify/emails/:email", (request, response) =>
  authController.verifyEmail(request, response)
);

router.post(
  "/v1/auth/verify/reset-password/verification-code",
  (request, response) =>
    authController.verifyResetPasswordVerificationCode(request, response)
);

router.post("/v1/auth/forgot-password", (request, response) =>
  authController.forgotPassword(request, response)
);

router.post("/v1/auth/reset-password", (request, response) =>
  authController.resetPassword(request, response)
);

router.post(
  "/v1/auth/users/:userId/delete-account",
  verifyUserId,
  (request, response) =>
    authController.sendUserDeleteAccountVerificationCode(request, response)
);

router.delete(
  "/v1/auth/users/:userId/verification-code/:verificationCode",
  verifyUserId,
  (request, response) =>
    authController.verifyDeleteAccountVerificationCode(request, response)
);

router.patch(
  "/v1/auth/users/:userId/verify",
  verifyUserId,
  (request, response) => authController.setUserVerified(request, response)
);

router.post(
  "/v1/auth/users/:userId/send/verification-codes",
  (request, response) =>
    authController.addUserEmailVerificationCode(request, response)
);

router.post("/v1/auth/emails/send", (request, response) =>
  authController.sendEmail(request, response)
);

module.exports = router;
