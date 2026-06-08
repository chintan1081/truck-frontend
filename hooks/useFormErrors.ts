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

export function useFormErrors() {
  const [errors, setErrors] = useState<Errors>({});

  function validate(rules: Rules): boolean {
    const next: Errors = {};

    for (const [key, { value, label, type, optional, min, max }] of Object.entries(rules)) {
      const strVal = value === undefined || value === null ? '' : String(value).trim();
      const isEmpty = strVal === '';

      // Required check
      if (isEmpty) {
        if (!optional) next[key] = `${label} is required`;
        continue; // no further checks on empty value
      }

      // Numeric checks
      if (type === 'number' || type === 'positiveNumber') {
        const num = Number(strVal);
        if (isNaN(num)) {
          next[key] = `${label} must be a number`;
          continue;
        }
        if (type === 'positiveNumber' && num <= 0) {
          next[key] = `${label} must be greater than 0`;
          continue;
        }
        if (min !== undefined && num < min) {
          next[key] = `${label} must be at least ${min}`;
          continue;
        }
        if (max !== undefined && num > max) {
          next[key] = `${label} must be at most ${max}`;
          continue;
        }
        continue;
      }

      // Pattern checks (case-insensitive normalise for GST/IFSC)
      if (type && type !== 'text' && PATTERNS[type]) {
        const testVal = type === 'gst' || type === 'ifsc' ? strVal.toUpperCase() : strVal;
        if (!PATTERNS[type]!.test(testVal)) {
          next[key] = FORMAT_MESSAGES[type] ?? `Invalid ${label}`;
          continue;
        }
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
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

  return { errors, validate, clearField, clearAll };
}
