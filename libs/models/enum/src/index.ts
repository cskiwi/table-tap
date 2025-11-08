export * from './enums';

import { registerEnumType } from '@nestjs/graphql';
import * as Enums from './enums';

const enums = Object.entries(Enums).filter(([name, value]) => {
  // Enums in compiled JS are plain objects where values map both ways
  // (numeric enums) or only one way (string enums)
  if (typeof value !== 'object' || value === null) return false;

  const keys = Object.keys(value);
  if (keys.length === 0) return false;

  // Numeric enums have both numeric and string keys; string enums only string keys
  const hasNumeric = keys.some((k) => !isNaN(Number(k)));
  const hasString = keys.some((k) => isNaN(Number(k)));

  return hasNumeric || hasString;
});

// Dynamically call a function on each enum
enums.forEach(([name, enumObj]) => {
  registerEnumType(enumObj, { name });
});
