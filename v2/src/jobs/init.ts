import 'dotenv/config';
import { redis } from "@api/redis/redis";
import { setTokens } from "@api/bungie/auth";
import type { BungieTokenPayload } from "../typeOriginal";

async function run() {
	const code = process.argv[2];
	if (!code) {
		// リセットモード
		await redis.del("portal_data_hash");
		// await redis.del("xur_data_hash");
		console.log("Reset portal_data_hash and xur_data_hash in Redis.");
		return;
	}

  const data = await exchangeCodeForTokens(code);

  const nowMs = Date.now();
  const payload: BungieTokenPayload = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: "Bearer",
    scope: data.scope,
    membership_id: data.membership_id,
    expires_at: nowMs + data.expires_in * 1000,
    refresh_expires_at: nowMs + data.refresh_expires_in * 1000,
  };

  await setTokens(payload);
  console.log("Saved initial Bungie tokens to Redis.");
}

type BungieOAuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;          // seconds
  refresh_expires_in: number;  // seconds
  membership_id?: string;
  scope?: string;
};

async function exchangeCodeForTokens(code: string): Promise<BungieOAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: process.env.B_CLIENT_ID!,
    client_secret: process.env.B_CLIENT_SECRET!,
    redirect_uri: process.env.B_REDIRECT_URI!, // Bungieに登録済みのもの
  });

  const res = await fetch("https://www.bungie.net/Platform/App/OAuth/Token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`Failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data as BungieOAuthTokenResponse;
}

// execute
run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await redis.quit(); } catch {}
  });