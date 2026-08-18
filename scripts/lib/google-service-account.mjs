// Shared RS256 JWT -> OAuth bearer token exchange for a Google service
// account. Used by every script that calls a Google API on this site's
// behalf (submit-google-indexing.mjs, check-index-status.mjs) — one
// service account, multiple scopes. Ported verbatim from
// bytetech247.com.
import { createSign } from "node:crypto";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export function loadServiceAccountCredentials(
  envVarName = "GOOGLE_INDEXING_SERVICE_ACCOUNT",
) {
  const raw = process.env[envVarName];
  if (!raw) return null;
  const { client_email: clientEmail, private_key: privateKey } =
    JSON.parse(raw);
  return { clientEmail, privateKey };
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function getAccessToken({ clientEmail, privateKey }, scope) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope,
    aud: TOKEN_ENDPOINT,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const jwt = `${unsigned}.${signature}`;

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `Token exchange failed: ${response.status} ${JSON.stringify(body)}`,
    );
  }
  return body.access_token;
}
