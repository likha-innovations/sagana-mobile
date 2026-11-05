export function changeOtpCode(code: string, text: string, index: number): string {
  let digits = text.replace(/[^0-9]/g, '');
  const previous = code[index]?.trim();
  if (previous && digits.length > 1 && digits.length !== 6) {
    if (digits.startsWith(previous)) digits = digits.slice(1);
    else if (digits.endsWith(previous)) digits = digits.slice(0, -1);
  }
  if (digits.length >= 6) return digits.slice(0, 6);
  if (!digits) return code;

  const chars = code.padEnd(6, ' ').split('');
  if (digits.length > 1) {
    for (let i = 0; i < digits.length && index + i < 6; i++) {
      chars[index + i] = digits[i];
    }
  } else {
    chars[index] = digits[digits.length - 1];
  }
  return chars.join('').trimEnd();
}
