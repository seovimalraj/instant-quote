export function normalizeCert(code: string) {
  return code.replace(/\s+/g, '').toUpperCase();
}
