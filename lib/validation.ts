const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 6;

export interface SignUpFields {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInFields {
  email: string;
  password: string;
}

/**
 * Client validation is UX only — it keeps obvious mistakes off the network.
 * The database and Supabase Auth remain the real boundary.
 */
export function validateSignIn(fields: SignInFields): Partial<Record<keyof SignInFields, string>> {
  const errors: Partial<Record<keyof SignInFields, string>> = {};

  if (!fields.email.trim()) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(fields.email.trim())) errors.email = "That doesn't look like an email address.";

  if (!fields.password) errors.password = "Enter your password.";

  return errors;
}

export function validateSignUp(fields: SignUpFields): Partial<Record<keyof SignUpFields, string>> {
  const errors: Partial<Record<keyof SignUpFields, string>> = {};

  if (!fields.fullName.trim()) errors.fullName = "Enter your name.";

  if (!fields.email.trim()) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(fields.email.trim())) errors.email = "That doesn't look like an email address.";

  if (!fields.password) errors.password = "Choose a password.";
  else if (fields.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = "Both passwords need to match.";
  }

  return errors;
}
