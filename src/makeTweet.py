from requests_oauthlib import OAuth1Session
import os

# 通常のツイートを投稿する
def makeTweet(payload):
    consumer_key = os.environ.get("T_CONSUMER_KEY")
    consumer_secret = os.environ.get("T_CONSUMER_SECRET")

    with open('./tokens/twitter_access_token') as f:
        access_token = f.readline().replace("\n", "")
        access_token_secret = f.readline().replace("\n", "")

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
    consumer_key = os.environ.get("T_CONSUMER_KEY")
    consumer_secret = os.environ.get("T_CONSUMER_SECRET")

    with open('./tokens/twitter_access_token') as f:
        access_token = f.readline().replace("\n", "")
        access_token_secret = f.readline().replace("\n", "")

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
def postImage(path):
    consumer_key = os.environ.get("T_CONSUMER_KEY")
    consumer_secret = os.environ.get("T_CONSUMER_SECRET")

    with open('./tokens/twitter_access_token') as f:
        access_token = f.readline().replace("\n", "")
        access_token_secret = f.readline().replace("\n", "")

    oauth = OAuth1Session(
        consumer_key,
        client_secret=consumer_secret,
        resource_owner_key=access_token,
        resource_owner_secret=access_token_secret,
    )
    
    payload = {"media": open(path, 'rb')}

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
