/** @format */

const TRUE_STRING = 'Yes';
const FALSE_STRING = 'No';

const ALLOWED_TEXT = 'allowed';
const NOT_ALLOWED_TEXT = `not ${ALLOWED_TEXT}`;

export function booleanToAllowed(allowed: boolean): string {
  if (allowed) return ALLOWED_TEXT;
  return NOT_ALLOWED_TEXT;
}

export function booleanToString(bool: boolean): string {
  if (bool) return TRUE_STRING;
  return FALSE_STRING;
}

export function stringToBoolean(bool: string): boolean {
  if (bool === TRUE_STRING) return true;
  return false;
}
