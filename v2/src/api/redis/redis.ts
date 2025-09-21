import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!, {
	password: process.env.REDIS_PASS,
  connectionName: "Malahayati",
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 1000, 30000),
});
redis.on("error", (err) => {
	console.error("Redis error:", err);
});
redis.on("connect", () => {
	console.log("Connected to Redis");
});