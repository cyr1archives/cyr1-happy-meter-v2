// app/lib/constants.ts

/**
 * Shared list of departments used across the Questionnaire,
 * Admin Dashboard, and API validation.
 */
export const DEPARTMENTS = [
  'Executive',
  'Corp',
  'Human Resources',
  'Finance',
  'Data Operations',
  'PABE Trucking',
  'Kariyala Manpower',
  'EDM Security',
  'Trimega'
] as const;

/**
 * Type helper to ensure TypeScript knows exactly which strings
 * are valid departments.
 */
export type Department = typeof DEPARTMENTS[number];