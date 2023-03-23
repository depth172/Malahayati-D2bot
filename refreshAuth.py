from dotenv import load_dotenv
import base64
import os
import requests

## アクセスに必要なトークンを取得
def getAccessToken():
    raw = os.getenv('CLIENT_ID') + ":" + os.getenv('CLIENT_SECRET')
    auth = base64.b64encode(raw.encode()).decode()

    token_headers = {"X-API-Key": os.getenv('API_KEY'),
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": "Basic " + auth}

    if os.stat('refresh_token').st_size == 0:
        print("こちらより、アクセスコードを取得してください。\nhttps://www.bungie.net/ja/OAuth/Authorize?client_id=" + str(os.getenv('CLIENT_ID')) + "&response_type=code\n")
        code = input('取得したコードを入力: ')

        token_data = {"grant_type": "authorization_code",
                    "code": code}
    else:
        # 保存したリフレッシュトークンを読み込み
        with open("refresh_token", "r") as f:
            load_token = f.read()

        token_data = {"grant_type": "refresh_token",
                    "refresh_token": load_token}

    # 得た情報を基にアクセストークンを取得し、環境変数に保存
    token_request = requests.post("https://www.bungie.net/Platform/App/OAuth/Token/", headers=token_headers, data=token_data).json()
    os.environ["BAPI_ACCESS_TOKEN"] = token_request['access_token']

    # 更新されたリフレッシュトークンをファイルに保存
    with open("refresh_token", "w") as f:
        f.write(token_request['refresh_token'])

        