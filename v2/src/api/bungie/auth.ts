// lib/bungie-auth.ts
import { redis } from "@api/redis/redis";
import type { BungieTokenPayload } from "../../typeOriginal";

const TOKENS_KEY = "bungie:tokens";
const REFRESH_LOCK_KEY = "bungie:refresh:lock";
const SKEW_MS = 90 * 1000; // 90秒の余裕

function now() {
  return Date.now();
}

export async function getTokens(): Promise<BungieTokenPayload | null> {
  const raw = await redis.get(TOKENS_KEY);
  return raw ? (JSON.parse(raw) as BungieTokenPayload) : null;
}

export async function setTokens(tokens: BungieTokenPayload) {
  await redis.set(TOKENS_KEY, JSON.stringify(tokens));
}

function isAccessValid(t: BungieTokenPayload) {
  return t.expires_at - SKEW_MS > now();
}

function isRefreshValid(t: BungieTokenPayload) {
  return t.refresh_expires_at - SKEW_MS > now();
}

// 簡易ロック（10秒で自動解放）
async function acquireRefreshLock(): Promise<boolean> {
  const ok = await redis.set(REFRESH_LOCK_KEY, "1", "EX", 10);
  return ok === "OK";
}
async function releaseRefreshLock() {
  await redis.del(REFRESH_LOCK_KEY);
}

/**
 * これだけ呼べば常に「使える access_token」が返る
 */
export async function getValidAccessToken(): Promise<string> {
  let tokens = await getTokens();
  if (!tokens) throw new Error("No Bungie tokens saved in Redis.");

  if (isAccessValid(tokens)) {
    return tokens.access_token;
  }

  // 期限が近い or 切れた → リフレッシュ
  if (!isRefreshValid(tokens)) {
    throw new Error("Refresh token expired. Re-authorize your account.");
  }

  // 同時更新の衝突を防ぐ
  const locked = await acquireRefreshLock();
  if (!locked) {
    // 誰かが更新中 → 少し待ってから再読込
    await new Promise((r) => setTimeout(r, 1500));
    tokens = await getTokens();
    if (!tokens) throw new Error("Tokens disappeared during refresh.");
    if (!isAccessValid(tokens)) throw new Error("Access token still invalid after wait.");
    return tokens.access_token;
  }

  try {
    const newTokens = await refreshTokens(tokens.refresh_token);
    await setTokens(newTokens);
    return newTokens.access_token;
  } finally {
    await releaseRefreshLock();
  }
}

/**
 * Bungie のトークンエンドポイントで refresh
 * POST https://www.bungie.net/Platform/App/OAuth/Token/
 * Content-Type: application/x-www-form-urlencoded
 */
async function refreshTokens(refreshToken: string): Promise<BungieTokenPayload> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.B_CLIENT_ID!,
    client_secret: process.env.B_CLIENT_SECRET!,
  });

	if (!process.env.B_CLIENT_ID || !process.env.B_CLIENT_SECRET) {
		throw new Error('B_CLIENT_ID or B_CLIENT_SECRET is not set in environment variables');
	}

  const res = await fetch("https://www.bungie.net/Platform/App/OAuth/Token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh token: ${res.status} ${text}`);
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    token_type: "Bearer";
    expires_in: number;           // 秒
    refresh_expires_in: number;   // 秒
    membership_id?: string;
    scope?: string;
  };

  const nowMs = now();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    scope: data.scope,
    membership_id: data.membership_id,
    expires_at: nowMs + data.expires_in * 1000,
    refresh_expires_at: nowMs + data.refresh_expires_in * 1000,
  };
}
