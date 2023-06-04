from requests_oauthlib import OAuth1Session
import redis
import os

def getTwitterAccessToken():
    data = redis.from_url(url=os.getenv('REDIS_URL'))
    
    consumer_key = os.environ.get("T_CONSUMER_KEY")
    consumer_secret = os.environ.get("T_CONSUMER_SECRET")

    # 認証のためのリクエストトークンを取得する
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
    
    # アクセストークンを環境変数に保存
    data.set('twitter_access_token', access_token)
    data.set('twitter_access_token_secret', access_token_secret)

# 通常のツイートを投稿する
def makeTweet(payload):
    data = redis.from_url(url=os.getenv('REDIS_URL'))
    
    consumer_key = os.environ.get("T_CONSUMER_KEY")
    consumer_secret = os.environ.get("T_CONSUMER_SECRET")
    
    if data.exists('twitter_access_token') == 0 or data.exists('twitter_access_token_secret') == 0:
        getTwitterAccessToken()
    
    access_token = data.get('twitter_access_token')
    access_token_secret = data.get('twitter_access_token_secret')

    oauth = OAuth1Session(
        consumer_key,
        client_secret=consumer_secret,
        resource_owner_key=access_token,
        resource_owner_secret=access_token_secret,
    )

    # ツイートする
    response = oauth.post(
        "https://api.twitter.com/2/tweets",
        json=payload,
    )

    if response.status_code != 201:
        raise Exception(
            "エラーが発生しました。エラーコード: {} {}".format(response.status_code, response.text)
        )

    print("ツイート投稿完了。")

# スレッド形式のツイートを投稿する
def makeThread(payload, recent_id=0):
    data = redis.from_url(url=os.getenv('REDIS_URL'))

    if data.exists('twitter_access_token') == 0 or data.exists('twitter_access_token_secret') == 0:
        getTwitterAccessToken()
        
    consumer_key = os.environ.get("T_CONSUMER_KEY")
    consumer_secret = os.environ.get("T_CONSUMER_SECRET")
    access_token = data.get('twitter_access_token')
    access_token_secret = data.get('twitter_access_token_secret')

    oauth = OAuth1Session(
        consumer_key,
        client_secret=consumer_secret,
        resource_owner_key=access_token,
        resource_owner_secret=access_token_secret,
    )
    
    # recent_idが渡されていた場合、そこにリプライする形で投稿
    if recent_id != 0:
        payload["reply"] = {}
        payload["reply"]["in_reply_to_tweet_id"] = recent_id

    # ツイート
    response = oauth.post(
        "https://api.twitter.com/2/tweets",
        json=payload,
    )

    if response.status_code != 201:
        raise Exception(
            "エラーが発生しました。エラーコード: {} {}".format(response.status_code, response.text)
        )

    if recent_id == 0:
        print("スレッド元ツイートの投稿完了。")
    else:
        print("指定のツイートに続けて投稿完了。")
        
    # 投稿したツイートのIDを返す
    json_response = response.json()
    return json_response["data"]["id"]

# 画像を投稿する
def postImage(image):
    data = redis.from_url(url=os.getenv('REDIS_URL'))
    
    consumer_key = os.environ.get("T_CONSUMER_KEY")
    consumer_secret = os.environ.get("T_CONSUMER_SECRET")
    
    if data.exists('twitter_access_token') == 0 or data.exists('twitter_access_token_secret') == 0:
        getTwitterAccessToken()
    
    access_token = data.get('twitter_access_token')
    access_token_secret = data.get('twitter_access_token_secret')

    oauth = OAuth1Session(
        consumer_key,
        client_secret=consumer_secret,
        resource_owner_key=access_token,
        resource_owner_secret=access_token_secret,
    )
    
    payload = {"media": image}

    # 画像をアップロード
    response = oauth.post(
        "https://upload.twitter.com/1.1/media/upload.json",
        files=payload,
    )

    if response.status_code != 200:
        raise Exception(
            "Request returned an error: {} {}".format(response.status_code, response.text)
        )

    print("画像投稿完了。")

    # アップロードした画像のIDを返す
    json_response = response.json()
    return json_response["media_id_string"]