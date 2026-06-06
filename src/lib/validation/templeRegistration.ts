export type TempleRegistrationValues = {
  templeName: string;
  templeAddress: string;
  adminName: string;
  email: string;
  password: string;
};

export type TempleRegistrationErrors = Partial<
  Record<keyof TempleRegistrationValues, string>
>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export function validateTempleRegistration(
  values: TempleRegistrationValues
): TempleRegistrationErrors {
  return {
    templeName: validateTempleName(values.templeName),
    templeAddress: validateTempleAddress(values.templeAddress),
    adminName: validateAdminName(values.adminName),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  };
}

export function validateField(
  name: keyof TempleRegistrationValues,
  value: string
): string | undefined {
  switch (name) {
    case "templeName":
      return validateTempleName(value);
    case "templeAddress":
      return validateTempleAddress(value);
    case "adminName":
      return validateAdminName(value);
    case "email":
      return validateEmail(value);
    case "password":
      return validatePassword(value);
    default:
      return undefined;
  }
}

function validateTempleName(value: string) {
  if (!value.trim()) {
    return "Temple name is required.";
  }
  if (value.trim().length < 3) {
    return "Temple name must be at least 3 characters.";
  }
  return undefined;
}

function validateTempleAddress(value: string) {
  if (!value.trim()) {
    return "Temple address is required.";
  }
  if (value.trim().length < 5) {
    return "Temple address must be at least 5 characters.";
  }
  return undefined;
}

function validateAdminName(value: string) {
  if (!value.trim()) {
    return "Admin name is required.";
  }
  if (value.trim().length < 3) {
    return "Admin name must be at least 3 characters.";
  }
  return undefined;
}

function validateEmail(value: string) {
  if (!value.trim()) {
    return "Email address is required.";
  }
  if (!emailPattern.test(value.trim())) {
    return "Enter a valid email address.";
  }
  return undefined;
}

function validatePassword(value: string) {
  if (!value) {
    return "Password is required.";
  }
  if (!passwordPattern.test(value)) {
    return "Password must contain uppercase, lowercase, number, and special character.";
  }
  return undefined;
}
