export interface WifiQrCredentials {
  ssid: string;
  password: string;
}

// Unescape special characters in ZXing/Android Wi-Fi QR payloads (\;, \:, \\, \,)
function unescapeWifiField(value: string): string {
  return value.replace(/\\([\\;:,])/g, '$1');
}

// Split on unescaped semicolons so passwords containing "\;" stay intact
function splitUnescapedFields(body: string): string[] {
  const fields: string[] = [];
  let current = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '\\' && i + 1 < body.length) {
      current += ch + body[i + 1];
      i++;
      continue;
    }
    if (ch === ';') {
      fields.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.length > 0) {
    fields.push(current);
  }
  return fields;
}

export function parseWifiQr(raw: string): WifiQrCredentials | null {
  const trimmed = raw.trim();
  if (!/^WIFI:/i.test(trimmed)) return null;

  const body = trimmed.slice(5);
  const fields = splitUnescapedFields(body);

  let ssid = '';
  let password = '';

  for (const field of fields) {
    const colonIdx = field.indexOf(':');
    if (colonIdx <= 0) continue;

    const key = field.slice(0, colonIdx).toUpperCase();
    const val = unescapeWifiField(field.slice(colonIdx + 1));

    if (key === 'S') {
      ssid = val;
    } else if (key === 'P') {
      password = val;
    }
  }

  if (!ssid) return null;
  return { ssid, password };
}
