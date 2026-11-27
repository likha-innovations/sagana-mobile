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

function parseJsonWifiQr(trimmed: string): WifiQrCredentials | null {
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const ssid = typeof parsed.ssid === 'string'
      ? parsed.ssid
      : typeof parsed.SSID === 'string'
        ? parsed.SSID
        : '';
    const password = typeof parsed.password === 'string'
      ? parsed.password
      : typeof parsed.pass === 'string'
        ? parsed.pass
        : '';
    return ssid ? { ssid, password } : null;
  } catch {
    return null;
  }
}

function parseLineWifiQr(trimmed: string): WifiQrCredentials | null {
  const ssidMatch = /(?:^|\n)\s*(?:SSID|Wi-?Fi(?:\s+Name)?)\s*[:=]\s*(.+)/i.exec(trimmed);
  if (!ssidMatch) return null;
  const passMatch = /(?:^|\n)\s*(?:Password|Pass(?:phrase)?|PSK|Key)\s*[:=]\s*(.+)/i.exec(trimmed);
  const ssid = ssidMatch[1].trim();
  const password = passMatch ? passMatch[1].trim() : '';
  return ssid ? { ssid, password } : null;
}

export function parseWifiQr(raw: string): WifiQrCredentials | null {
  const trimmed = raw.trim();

  if (/^WIFI:\s*/i.test(trimmed)) {
    const body = trimmed.replace(/^WIFI:\s*/i, '');
    const fields = splitUnescapedFields(body);

    let ssid = '';
    let password = '';

    for (const field of fields) {
      const colonIdx = field.indexOf(':');
      if (colonIdx <= 0) continue;

      const key = field.slice(0, colonIdx).trim().toUpperCase();
      const val = unescapeWifiField(field.slice(colonIdx + 1));

      if (key === 'S') {
        ssid = val;
      } else if (key === 'P') {
        password = val;
      }
    }

    return ssid ? { ssid, password } : null;
  }

  return parseJsonWifiQr(trimmed) ?? parseLineWifiQr(trimmed);
}
