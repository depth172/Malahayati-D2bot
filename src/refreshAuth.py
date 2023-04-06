from dotenv import load_dotenv
import base64
import os
import requests
from requests_oauthlib import OAuth1Session

## アクセスに必要なトークンを取得
def getBungieAccessToken():
    raw = os.getenv('B_CLIENT_ID') + ":" + os.getenv('B_CLIENT_SECRET')
    auth = base64.b64encode(raw.encode()).decode()

    token_headers = {"X-API-Key": os.getenv('B_API_KEY'),
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": "Basic " + auth}

    if os.stat('./tokens/refresh_token_bungie').st_size == 0:
        print("こちらより、アクセスコードを取得してください。\nhttps://www.bungie.net/ja/OAuth/Authorize?client_id=" + str(os.getenv('CLIENT_ID')) + "&response_type=code\n")
        code = input('取得したコードを入力: ')

        token_data = {"grant_type": "authorization_code",
                    "code": code}
    else:
        # 保存したリフレッシュトークンを読み込み
        with open("./tokens/refresh_token_bungie", "r") as f:
            load_token = f.read()

        token_data = {"grant_type": "refresh_token",
                    "refresh_token": load_token}

    # 得た情報を基にアクセストークンを取得し、環境変数に保存
    token_request = requests.post("https://www.bungie.net/Platform/App/OAuth/Token/", headers=token_headers, data=token_data).json()
    os.environ["BAPI_ACCESS_TOKEN"] = token_request['access_token']

    # 更新されたリフレッシュトークンをファイルに保存
    with open("./tokens/refresh_token_bungie", "w") as f:
        f.write(token_request['refresh_token'])

def getTwitterAccessToken():
    consumer_key = os.environ.get("T_CONSUMER_KEY")
    consumer_secret = os.environ.get("T_CONSUMER_SECRET")

    # Get request token
    request_token_url = "https://api.twitter.com/oauth/request_token?oauth_callback=oob&x_auth_access_type=write"
    oauth = OAuth1Session(consumer_key, client_secret=consumer_secret)

    fetch_response = oauth.fetch_request_token(request_token_url)

    resource_owner_key = fetch_response.get("oauth_token")
    resource_owner_secret = fetch_response.get("oauth_token_secret")

    # 認証を得る
    base_authorization_url = "https://api.twitter.com/oauth/authorize"
    authorization_url = oauth.authorization_url(base_authorization_url)
    print("こちらより、アクセスを許可してください。\n%s" % authorization_url)
    verifier = input("取得したPINを入力してください: ")

    # アクセストークンを取得
    access_token_url = "https://api.twitter.com/oauth/access_token"
    oauth = OAuth1Session(
        consumer_key,
        client_secret=consumer_secret,
        resource_owner_key=resource_owner_key,
        resource_owner_secret=resource_owner_secret,
        verifier=verifier,
    )
    oauth_tokens = oauth.fetch_access_token(access_token_url)

    access_token = oauth_tokens["oauth_token"]
    access_token_secret = oauth_tokens["oauth_token_secret"]
    
    # アクセストークンをファイルに保存
    with open("./tokens/twitter_access_token", "w") as f:
        f.write(access_token + "\n" + access_token_secret)
        