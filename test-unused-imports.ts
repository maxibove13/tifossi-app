import { readFileSync } from 'fs';

export function processFile(filename: string): string {
  const content = readFileSync(filename, 'utf8');
  return content.toUpperCase();
}
