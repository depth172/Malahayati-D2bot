from dotenv import load_dotenv
import base64
import redis
import os
import requests

## アクセスに必要なトークンを取得
def getBungieAccessToken():
	load_dotenv()
	data = redis.Redis(
		host=os.getenv('REDIS_URL'),
		port=os.getenv('REDIS_PORT'),
		password=os.getenv('REDIS_PASS'))
	
	raw = os.getenv('B_CLIENT_ID') + ":" + os.getenv('B_CLIENT_SECRET')
	auth = base64.b64encode(raw.encode()).decode()

	token_headers = {"X-API-Key": os.getenv('B_API_KEY'),
					"Content-Type": "application/x-www-form-urlencoded",
					"Authorization": "Basic " + auth}

	if data.exists('bungie_refresh_token') == 0:
		print("こちらより、アクセスコードを取得してください。\nhttps://www.bungie.net/ja/OAuth/Authorize?client_id=" + str(os.getenv('B_CLIENT_ID')) + "&response_type=code\n")
		code = input('取得したコードを入力: ')

		token_data = {"grant_type": "authorization_code",
					"code": code}
	else:
		# 保存したリフレッシュトークンを読み込み
		load_token = data.get('bungie_refresh_token')

		token_data = {"grant_type": "refresh_token",
					"refresh_token": load_token}

	# 得た情報を基にアクセストークンを取得し、環境変数に保存
	token_request = requests.post("https://www.bungie.net/Platform/App/OAuth/Token/", headers=token_headers, data=token_data).json()
	os.environ["BAPI_ACCESS_TOKEN"] = token_request['access_token']

	# 更新されたリフレッシュトークンをデータベースに保存
	data.set('bungie_refresh_token', token_request['refresh_token'])