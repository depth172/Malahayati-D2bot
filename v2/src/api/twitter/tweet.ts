import { TwitterApi } from 'twitter-api-v2';
import { redis } from '@api/redis/redis';

function getTwitterClient() {
  const accessToken = redis.get('twitter_access_token');
  const accessSecret = redis.get('twitter_access_token_secret');
  return Promise.all([accessToken, accessSecret]).then(([token, secret]) => {
    if (!token || !secret) throw new Error('Twitter access token not found');
    return new TwitterApi({
      appKey: process.env.T_CONSUMER_KEY!,
      appSecret: process.env.T_CONSUMER_SECRET!,
      accessToken: token.toString(),
      accessSecret: secret.toString(),
    });
  });
}

// 通常ツイート
export async function makeTweet(payload: { text: string }) {
  const client = await getTwitterClient();
  const tweet = await client.v2.tweet(payload.text);
  return tweet.data.id;
}

// 画像添付ツイート
export async function makeTweetWithImages(payload: { text: string, images: Buffer[] }) {
  const client = await getTwitterClient();
  const mediaIds: string[] = [];
  for (const img of payload.images.slice(0, 4)) { // 最大4枚
    const id = await client.v1.uploadMedia(img, { mimeType: 'image/png' });
    mediaIds.push(id);
  }
  const tweet = await client.v2.tweet({
    text: payload.text,
    media: { media_ids: mediaIds as [string] },
  });
  return tweet.data.id;
}

// スレッド投稿
export async function makeThread(payloads: { text: string, images?: Buffer[] }[]) {
  const client = await getTwitterClient();
	let threadId: string | undefined;
  let lastTweetId: string | undefined;
  for (const payload of payloads) {
    const mediaIds: string[] = [];
    if (payload.images && payload.images.length > 0) {
      for (const img of payload.images.slice(0, 4)) { // 最大4枚
				const id = await client.v1.uploadMedia(img, { mimeType: 'image/png' });
				mediaIds.push(id);
			}
		}
    const tweet = await client.v2.tweet({
      text: payload.text,
      media: mediaIds.length > 0 ? { media_ids: mediaIds as [string] } : undefined,
      reply: lastTweetId ? { in_reply_to_tweet_id: lastTweetId } : undefined,
    });
		if (!threadId) threadId = tweet.data.id;
    lastTweetId = tweet.data.id;
  }
  return threadId;
}

// ツイート固定
export async function pinTweet(tweetId: string) {
	const client = await getTwitterClient();
	const response = await client.v1.post('account/pin_tweet.json', { id: tweetId });
	return response;
}

// ツイート削除
export async function deleteTweet(tweetId: string) {
	const client = await getTwitterClient();
	const response = await client.v2.deleteTweet(tweetId);
	return response;
}

// 固定ツイート解除
export async function unpinTweet() {
	const client = await getTwitterClient();
	const response = await client.v1.post('account/unpin_tweet.json');
	return response;
}