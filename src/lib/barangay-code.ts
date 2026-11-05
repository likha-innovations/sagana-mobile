export function isCompleteBarangayCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

export function changeBarangayCode(
  code: string,
  text: string,
  index: number,
): string {
  let cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const previous = code[index]?.trim();
  if (previous && cleaned.length > 1 && cleaned.length !== 6) {
    if (cleaned.startsWith(previous)) cleaned = cleaned.slice(1);
    else if (cleaned.endsWith(previous)) cleaned = cleaned.slice(0, -1);
  }
  if (cleaned.length >= 6) return cleaned.slice(0, 6);
  const chars = code.padEnd(6, " ").split("");
  if (cleaned.length > 1) {
    for (let i = 0; i < cleaned.length && index + i < 6; i++)
      chars[index + i] = cleaned[i];
  } else {
    chars[index] = cleaned.slice(-1) || " ";
  }
  return chars.join("").trimEnd();
}

export function signupDestination(
  hasBarangay: boolean,
  hasBirthday: boolean,
  hasCode: boolean,
): "code" | "signup" | "app" {
  if (!hasBarangay) return hasCode ? "signup" : "code";
  return hasBirthday ? "app" : "signup";
}
