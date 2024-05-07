import redis
from dotenv import load_dotenv
import os
from src import *
from zoneinfo import ZoneInfo
import datetime
import src.tweet as tw
import re

noData = False
gotInfo = False
log = False
checkCode = 0
TimeZone = ZoneInfo("Asia/Tokyo")

load_dotenv()
data = redis.Redis(
    host=os.getenv('REDIS_URL'),
    port=os.getenv('REDIS_PORT'),
    password=os.getenv('REDIS_PASS'))

currentTime = datetime.datetime.now(TimeZone)

# 直前実行時の時間を取得
try:
    lastHour = int(re.findall(r'\d+', str(data.get('lastHour')))[0])
except IndexError:
    lastHour = currentTime.hour - 1

# 実行時の時間を取得
currentHour = currentTime.hour

# 最終実行完了時間が現在時間と異なる場合
if lastHour != currentHour:
    # 毎日2時にデイリー取得フラグをリセット
    if currentHour == 2:
        print("定期実行を開始します。[" + currentTime.strftime('%Y/%m/%d %H:%M:%S') + "]\n")
        log = True
        data.set('gotSector', 'False')
        # 水曜日だった場合の週間フラグリセット
        if currentTime.weekday() == 2:
            tw.pinTweet()
            data.set('gotNightfall', 'False')
            data.set('gotEververse', 'False')
        # 土曜日だった場合の週間フラグリセット
        if currentTime.weekday() == 5:
            tw.pinTweet()
            data.set('gotXur', 'False')
    # 毎日9時にバンシー取得フラグをリセットする
    elif currentHour == 9:
        print("定期実行を開始します。[" + currentTime.strftime('%Y/%m/%d %H:%M:%S') + "]\n")
        log = True
        data.set('gotBanshee', 'False')
    # 取得する情報がない時間の場合
    else:
        print("情報の更新はまだ行いません。[" + currentTime.strftime('%Y/%m/%d %H:%M:%S') + "]\n----------------------------------------")
        noData = True
    # 最終実行完了時間を記録
    data.set('lastHour', currentHour)
# 全情報をすでに取得済みの場合（ログを残さない）
elif not (
    (currentTime.weekday() in [0, 1, 5, 6] and data.get('gotXur') == b'False') or 
    data.get('gotNightfall') == b'False' or
    data.get('gotEververse') == b'False' or
    data.get('gotSector') == b'False' or
    data.get('gotBanshee') == b'False'
):
    noData = True
# 取得していない情報が残っている場合
else:
    print("再実行を開始します。[" + currentTime.strftime('%Y/%m/%d %H:%M:%S') + "]\n")
    log = True

# シーズンはじめの一時処理
# data.set('gotSector', 'True')

# 土曜～火曜かつ、シュールに関する情報を未取得だった場合は取得
if currentTime.weekday() in [0, 1, 5, 6] and data.get('gotXur') == b'False':
    gotInfo = True
    print("シュールの情報を取得します。\n")
    checkCode = xur.getXur()
    if checkCode == 0:
        data.set('gotXur', 'True')
        data.set('xurFailed', 'False')
    elif checkCode == 5 and data.get('xurFailed') == b'False':
        timeStr = currentTime.strftime('%Y/%m/%d')
        tweetText = "【ベンダー情報】" + timeStr + "\nAPIのメンテナンス中につき、シュールの販売アイテムに関する情報が取得できませんでした。後ほど再試行致しますので、しばらくお待ち下さい。"
        contents = {"text": tweetText}
        tw.makeTweet(contents)
        data.set('xurFailed', 'True')
        
# エバーバースの情報を未取得だった場合は取得
if data.get('gotEververse') == b'False':
    gotInfo = True
    print("エバーバースの情報を取得します。\n")
    checkCode = eververse.getEververse()
    if checkCode == 0:
        data.set('gotEververse', 'True')
        data.set('eververseFailed', 'False')
    elif checkCode == 5 and data.get('eververseFailed') == b'False':
        timeStr = currentTime.strftime('%Y/%m/%d')
        tweetText = "【エバーバース情報】" + timeStr + "\nAPIのメンテナンス中につき、エバーバースに関する情報が取得できませんでした。後ほど再試行致しますので、しばらくお待ち下さい。"
        contents = {"text": tweetText}
        tw.makeTweet(contents)
        data.set('eververseFailed', 'True')

# ナイトフォールの情報を未取得だった場合は取得
if data.get('gotNightfall') == b'False':
    gotInfo = True
    print("ナイトフォールの情報を取得します。\n")
    checkCode = nightfall.getNightfall()
    if checkCode == 0:
        data.set('gotNightfall', 'True')
        data.set('nightfallFailed', 'False')
    elif checkCode == 5 and data.get('nightfallFailed') == b'False':
        timeStr = currentTime.strftime('%Y/%m/%d')
        tweetText = "【ナイトフォール情報】" + timeStr + "\nAPIのメンテナンス中につき、ナイトフォールに関する情報が取得できませんでした。後ほど再試行致しますので、しばらくお待ち下さい。"
        contents = {"text": tweetText}
        tw.makeTweet(contents)
        data.set('nightfallFailed', 'True')

# 失われたセクターの情報を未取得だった場合は取得
if data.get('gotSector') == b'False':
    gotInfo = True
    print("失われたセクターの情報を取得します。\n")
    checkCode = lostsector.getLostSector()
    if checkCode == 0:
        data.set('gotSector', 'True')
        data.set('lostsectorFailed', 'False')
    elif checkCode == 5 and data.get('lostsectorFailed') == b'False':
        timeStr = currentTime.strftime('%Y/%m/%d')
        tweetText = "【失われたセクター情報】" + timeStr + "\nAPIのメンテナンス中につき、失われたセクター(伝説/達人)に関する情報が取得できませんでした。後ほど再試行致しますので、しばらくお待ち下さい。"
        contents = {"text": tweetText}
        tw.makeTweet(contents)
        data.set('lostsectorFailed', 'True')
        
# バンシー44の販売武器に関する情報を未取得だった場合は取得
if data.get('gotBanshee') == b'False':
    gotInfo = True
    print("バンシー44の販売武器情報を取得します。\n")
    checkCode = banshee.getBanshee()
    if checkCode == 0:
        data.set('gotBanshee', 'True')
        data.set('bansheeFailed', 'False')
    elif checkCode == 5 and data.get('bansheeFailed') == b'False':
        timeStr = currentTime.strftime('%Y/%m/%d')
        tweetText = "【ベンダー情報】" + timeStr + "\nAPIのメンテナンス中につき、バンシー44の日間販売武器に関する情報が取得できませんでした。後ほど再試行致しますので、しばらくお待ち下さい。"
        contents = {"text": tweetText}
        tw.makeTweet(contents)
        data.set('bansheeFailed', 'True')
        
if not noData and not gotInfo:
    print("新しく取得する情報はありませんでした。")

if log:
    print("\n定期実行完了。\n----------------------------------------")