import redis
import os
from src import *
from zoneinfo import ZoneInfo
import datetime
import src.tweet as tw

gotInfo = False
checkCode = 0
recatch = False
TimeZone = ZoneInfo("Asia/Tokyo")

print("定期実行を開始します。\n")

currentStatus = redis.from_url(url=os.getenv('REDIS_URL'))

currentTime = datetime.datetime.now(TimeZone)

# 毎日2時にセクター取得フラグをリセット
if currentTime.hour == 2:
    currentStatus.set('gotSector', 'False')
    # 水曜日だった場合は週間フラグもリセット
    if currentTime.weekday() == 2:
        currentStatus.set('gotXur', 'False')
# 毎日9時のバンシー取得フラグをリセットする
elif currentTime.hour == 9:
    currentStatus.set('gotBansheeDaily', 'True')

# シーズンはじめの一時処理
currentStatus.set('gotSector', 'True')

# 土曜～火曜かつ、シュールに関する情報を未取得だった場合は取得
if currentTime.weekday() in [0, 1, 5, 6] and currentStatus.get('gotXur') == b'False':
    gotInfo = True
    print("シュールの情報を取得します。")
    checkCode = xur.getXur()
    if checkCode == 0:
        currentStatus.set('gotXur', 'True')
    elif checkCode == 5:
        timeStr = currentTime.strftime('%Y/%m/%d')
        tweetText = "【ベンダー情報】" + timeStr + "\nAPIのメンテナンス中につき、シュールの販売アイテムに関する情報が取得できませんでした。後ほど再試行致しますので、しばらくお待ち下さい。"
        contents = {"text": tweetText}
        tw.makeTweet(contents)

# バンシー44の販売武器に関する情報を未取得だった場合は取得
elif currentStatus.get('gotBanshee') == b'False':
    gotInfo = True
    print("バンシー44の「注目」武器情報を取得します。")
    checkCode = banshee.getBanshee()
    if checkCode == 0:
        currentStatus.set('gotBanshee', 'True')
    elif checkCode == 5:
        timeStr = currentTime.strftime('%Y/%m/%d')
        tweetText = "【ベンダー情報】" + timeStr + "\nAPIのメンテナンス中につき、バンシー44の日間販売武器に関する情報が取得できませんでした。後ほど再試行致しますので、しばらくお待ち下さい。"
        contents = {"text": tweetText}
        tw.makeTweet(contents)


# 失われたセクターの情報を未取得だった場合は取得
if currentStatus.get('gotSector') == b'False':
    gotInfo = True
    print("失われたセクターの情報を取得します。")
    checkCode = lostsector.getLostSector()
    if checkCode == 0:
        currentStatus.set('gotSector', 'True')
    elif checkCode == 5:
        timeStr = currentTime.strftime('%Y/%m/%d')
        tweetText = "【失われたセクター情報】" + timeStr + "\nAPIのメンテナンス中につき、失われたセクター(伝説/達人)に関する情報が取得できませんでした。後ほど再試行致しますので、しばらくお待ち下さい。"
        contents = {"text": tweetText}
        tw.makeTweet(contents)
        
if not gotInfo:
    print("新しく取得する情報はありませんでした。")

print("\n定期実行完了。")