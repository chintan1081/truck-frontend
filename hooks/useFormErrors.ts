import { useState } from 'react';

type Errors = Record<string, string>;

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'positiveNumber'
  | 'gst'
  | 'ifsc'
  | 'upi'
  | 'url'
  | 'pincode'
  | 'accountNumber';

export type FieldRule = {
  value: any;
  label: string;
  type?: FieldType;
  optional?: boolean; // when true: skip required check; still validate format if a value is provided
  min?: number;
  max?: number;
};

type Rules = Record<string, FieldRule>;

// Format patterns
const PATTERNS: Partial<Record<FieldType, RegExp>> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Accepts plain 10-digit Indian mobile OR +91 prefix OR any international +XX format
  phone: /^(\+91[\s\-]?)?[6-9]\d{9}$|^\+\d{10,14}$/,
  // Standard 15-char GSTIN: 2-digit state + 10-char PAN + 1 entity + Z + 1 check
  gst: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
  // 11-char IFSC: 4 alpha + literal 0 + 6 alphanumeric
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  // UPI: localpart@provider
  upi: /^[\w.\-]+@[\w.\-]+$/,
  url: /^https?:\/\/.+/,
  // Indian 6-digit pincode — first digit non-zero
  pincode: /^[1-9]\d{5}$/,
  // Bank account: 9–18 digits
  accountNumber: /^\d{9,18}$/,
};

const FORMAT_MESSAGES: Partial<Record<FieldType, string>> = {
  email: 'Enter a valid email address (e.g. user@example.com)',
  phone: 'Enter a valid 10-digit mobile number',
  gst: 'Enter a valid 15-character GST number (e.g. 22AAAAA0000A1Z5)',
  ifsc: 'Enter a valid IFSC code (e.g. HDFC0001234)',
  upi: 'Enter a valid UPI ID (e.g. user@upi)',
  url: 'Enter a valid URL starting with http:// or https://',
  pincode: 'Enter a valid 6-digit pincode',
  accountNumber: 'Enter a valid bank account number (9–18 digits)',
};

/**
 * Validates a single rule and returns an error message, or null when valid.
 * Pure — does not touch React state, so it can be used both for live feedback
 * and for computing whether a form is submittable.
 */
export function checkRule({ value, label, type, optional, min, max }: FieldRule): string | null {
  const strVal = value === undefined || value === null ? '' : String(value).trim();
  const isEmpty = strVal === '';

  // Required check
  if (isEmpty) {
    return optional ? null : `${label} is required`;
  }

  // Numeric checks
  if (type === 'number' || type === 'positiveNumber') {
    const num = Number(strVal);
    if (isNaN(num)) return `${label} must be a number`;
    if (type === 'positiveNumber' && num <= 0) return `${label} must be greater than 0`;
    if (min !== undefined && num < min) return `${label} must be at least ${min}`;
    if (max !== undefined && num > max) return `${label} must be at most ${max}`;
    return null;
  }

  // Pattern checks (case-insensitive normalise for GST/IFSC)
  if (type && type !== 'text' && PATTERNS[type]) {
    const testVal = type === 'gst' || type === 'ifsc' ? strVal.toUpperCase() : strVal;
    if (!PATTERNS[type]!.test(testVal)) {
      return FORMAT_MESSAGES[type] ?? `Invalid ${label}`;
    }
  }

  return null;
}

function computeErrors(rules: Rules): Errors {
  const next: Errors = {};
  for (const [key, rule] of Object.entries(rules)) {
    const msg = checkRule(rule);
    if (msg) next[key] = msg;
  }
  return next;
}

export function useFormErrors() {
  const [errors, setErrors] = useState<Errors>({});

  /** Full-form check used on submit: records every error and returns validity. */
  function validate(rules: Rules): boolean {
    const next = computeErrors(rules);
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /** Live per-field check used on change/blur for instant inline feedback. */
  function validateField(field: string, rule: FieldRule) {
    const msg = checkRule(rule);
    setErrors(prev => {
      if (prev[field] === (msg ?? undefined)) return prev;
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  }

  /** Pure validity check (no state change) — use to enable/disable the submit button. */
  function isValid(rules: Rules): boolean {
    return Object.keys(computeErrors(rules)).length === 0;
  }

  function clearField(field: string) {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function clearAll() {
    setErrors({});
  }

  return { errors, validate, validateField, isValid, clearField, clearAll };
}
