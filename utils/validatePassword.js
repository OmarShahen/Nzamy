const isPasswordStrong = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (password.length < minLength) {
    return {
      isAccepted: false,
      message: "Weak: Password should be at least 8 characters long",
    };
  } else if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      isAccepted: false,
      message:
        "Medium: Password should include uppercase, lowercase, and numbers",
    };
  }

  return {
    isAccepted: true,
    message: "Strong: Password meets the criteria for a strong password",
  };
};

module.exports = { isPasswordStrong };
