import { useState } from 'react';

type Errors = Record<string, string>;
type Rules = Record<string, { value: any; label: string }>;

export function useFormErrors() {
  const [errors, setErrors] = useState<Errors>({});

  function validate(rules: Rules): boolean {
    const next: Errors = {};
    for (const [key, { value, label }] of Object.entries(rules)) {
      const isEmpty =
        value === undefined ||
        value === null ||
        String(value).trim() === '' ||
        value === 0;
      if (isEmpty) next[key] = `${label} is required`;
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
