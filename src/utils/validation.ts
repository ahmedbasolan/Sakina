import { Mood, PrayerContext } from '../types';

// ── Input Validation ─────────────────────────────────────────────────────
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name) {
    errors.push('Name is required');
  } else if (name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (name.length > 50) {
    errors.push('Name must be less than 50 characters');
  } else if (!/^[\p{L}\s]+$/u.test(name)) {
    errors.push('Name can only contain letters and spaces');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validateMood = (mood: Mood): ValidationResult => {
  const validMoods: Mood[] = [
    'Overwhelmed', 'Sad', 'Angry', 'Tired', 'Lonely', 
    'Grateful', 'Hopeful', 'Guilty', 'Calm'
  ];
  
  const errors: string[] = [];
  
  if (!mood) {
    errors.push('Mood selection is required');
  } else if (!validMoods.includes(mood)) {
    errors.push('Invalid mood selected');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validatePrayerContext = (context: PrayerContext): ValidationResult => {
  const validContexts: PrayerContext[] = [
    'fajr_pre', 'fajr_post', 'dhuhr', 'asr', 
    'maghrib_pre', 'maghrib_post', 'isha', 'general'
  ];
  
  const errors: string[] = [];
  
  if (!context) {
    errors.push('Prayer context is required');
  } else if (!validContexts.includes(context)) {
    errors.push('Invalid prayer context');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validateReflection = (content: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!content) {
    errors.push('Reflection content is required');
  } else if (content.length < 10) {
    errors.push('Reflection must be at least 10 characters long');
  } else if (content.length > 1000) {
    errors.push('Reflection must be less than 1000 characters');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validateLocation = (location: { city: string; country: string }): ValidationResult => {
  const errors: string[] = [];
  
  if (!location.city || location.city.trim().length < 2) {
    errors.push('City must be at least 2 characters long');
  }
  
  if (!location.country || location.country.trim().length < 2) {
    errors.push('Country must be at least 2 characters long');
  }
  
  return { isValid: errors.length === 0, errors };
};

// ── Form Validation ─────────────────────────────────────────────────────
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const validateLoginForm = (form: LoginForm): ValidationResult => {
  const emailValidation = validateEmail(form.email);
  const passwordValidation = validatePassword(form.password);
  
  const errors = [...emailValidation.errors, ...passwordValidation.errors];
  
  return { isValid: errors.length === 0, errors };
};

export const validateSignUpForm = (form: SignUpForm): ValidationResult => {
  const nameValidation = validateName(form.name);
  const emailValidation = validateEmail(form.email);
  const passwordValidation = validatePassword(form.password);
  
  const errors = [
    ...nameValidation.errors, 
    ...emailValidation.errors, 
    ...passwordValidation.errors
  ];
  
  if (form.password !== form.confirmPassword) {
    errors.push('Passwords do not match');
  }
  
  return { isValid: errors.length === 0, errors };
};

// ── Sanitization ─────────────────────────────────────────────────────────
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets (no DOM in RN, but defensive)
    .slice(0, 1000); // Limit length
};

export const sanitizeEmail = (email: string): string => {
  return email
    .trim()
    .toLowerCase()
    .slice(0, 254); // RFC 5321 limit
};

export const sanitizeReflection = (content: string): string => {
  return sanitizeString(content).slice(0, 1000);
};

// ── Type Guards ─────────────────────────────────────────────────────────
export const isMood = (value: string): value is Mood => {
  const validMoods: Mood[] = [
    'Overwhelmed', 'Sad', 'Angry', 'Tired', 'Lonely', 
    'Grateful', 'Hopeful', 'Guilty', 'Calm'
  ];
  return validMoods.includes(value as Mood);
};

export const isPrayerContext = (value: string): value is PrayerContext => {
  const validContexts: PrayerContext[] = [
    'fajr_pre', 'fajr_post', 'dhuhr', 'asr', 
    'maghrib_pre', 'maghrib_post', 'isha', 'general'
  ];
  return validContexts.includes(value as PrayerContext);
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// ── Error Boundary Validation ───────────────────────────────────────────
export const isValidError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const getErrorMessage = (error: unknown): string => {
  if (isValidError(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (isObject(error) && isString(error.message)) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};
