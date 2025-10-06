import 'dotenv/config';
import { redis } from "@api/redis/redis";
import { setTokens } from "@api/bungie/auth";
import type { BungieTokenPayload } from "../typeOriginal";
import open from 'open';
import readline from 'readline';

async function run() {
  const accountType = process.argv[2] as "main" | "sub" | "reset";
  
  if (!accountType) {
    console.log("使用方法:");
    console.log("  pnpm init:bungie main    # メインアカウント設定");
    console.log("  pnpm init:bungie sub     # サブアカウント設定");
    console.log("  pnpm init:bungie reset   # ハッシュリセット");
    return;
  }

  if (accountType === "reset") {
    // リセットモード
    await redis.del("portal_data_hash");
    await redis.del("xur_data_hash");
    console.log("Reset portal_data_hash and xur_data_hash in Redis.");
    return;
  }

  if (accountType !== "main" && accountType !== "sub") {
    throw new Error("引数は 'main', 'sub', または 'reset' を指定してください");
  }

  console.log(`${accountType}アカウントの認証を開始します...`);
  
  // OAuth URL を生成
  const authUrl = generateAuthUrl();
  console.log("\n=== Bungie認証 ===");
  console.log("1. ブラウザでBungieにログインしてください");
  console.log("2. 認証後、URLに含まれるcodeパラメータをコピーしてください");
  console.log("\n認証URL:");
  console.log(authUrl);
  
  // ブラウザを自動で開く
  await openBrowser(authUrl);
  
  // コンソールからコードを取得
  const code = await promptForCode();
  console.log("認証コードを取得しました!");
  
  // トークンを取得
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

  // アカウントタイプ別に保存
  await setTokens(payload, accountType);
  console.log(`${accountType}アカウントのBungieトークンをRedisに保存しました。`);
}

function generateAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.B_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.B_REDIRECT_URI!
  });
  
  return `https://www.bungie.net/en/OAuth/Authorize?${params.toString()}`;
}

async function openBrowser(url: string): Promise<void> {
  try {
    await open(url);
    console.log("\nブラウザを開いています...");
  } catch (error) {
    console.log("\nブラウザを自動で開けませんでした。上記URLを手動でコピーしてブラウザで開いてください。");
  }
}

function promptForCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log("\n認証完了後、リダイレクトされたURLから'code'パラメータを抽出してください。");
    console.log("例: https://example.com/?code=ABC123... → ABC123の部分をコピー\n");
    
    let isResolved = false;
    
    // タイマーの参照を保持
    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        rl.close();
        reject(new Error("入力タイムアウト: 10分以内に認証コードを入力してください"));
      }
    }, 10 * 60 * 1000);
    
    rl.question('認証コードを入力してください: ', (code) => {
      if (isResolved) return;
      isResolved = true;
      
      // タイマーをクリア
      clearTimeout(timeout);
      rl.close();
      
      if (!code || code.trim() === '') {
        reject(new Error('認証コードが入力されませんでした'));
        return;
      }
      
      // URLから抽出したコードをクリーンアップ
      const cleanCode = code.trim().replace(/[&?].*$/, ''); // &以降を削除
      
      if (cleanCode.length < 10) {
        reject(new Error('無効な認証コードです。再度確認してください。'));
        return;
      }
      
      resolve(cleanCode);
    });

    // プロセス終了時の cleanup
    process.on('SIGINT', () => {
      clearTimeout(timeout);
      rl.close();
      process.exit(0);
    });
  });
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
    redirect_uri: process.env.B_REDIRECT_URI!,
  });

  const res = await fetch("https://www.bungie.net/Platform/App/OAuth/Token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data as BungieOAuthTokenResponse;
}

// execute
run()
  .catch((e) => {
    console.error("エラー:", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { 
      await redis.quit(); 
    } catch {}
    // 強制終了を確実にする
    process.exit(process.exitCode || 0);
  });