from src import *
import yaml
from zoneinfo import ZoneInfo
import datetime
import src.makeTweet as tw

checkCode = 0
recatch = False
TimeZone = ZoneInfo("Asia/Tokyo")

print("定期実行を開始します。")

with open('./operationStatus.yml') as file:
    currentStatus = yaml.safe_load(file)
    
currentTime = datetime.datetime.now(TimeZone)
    
# 毎日2時に取得フラグをリセット
if currentTime.hour == 2:
    currentStatus['Banshee']['gotDaily'] = False
    if currentTime.weekday() == 2:
        currentStatus['gotXur'] = False
        currentStatus['Banshee']['gotWeekly'] = False
# 毎日9時はパーク更新があるため、取得フラグをもう一度リセットする
elif currentTime.hour == 9:
    currentStatus['Banshee']['gotDaily'] = False
    recatch = True

# 土曜～火曜かつ、シュールに関する情報を未取得だった場合は取得
if currentTime.weekday() in [0, 1, 5, 6] and not currentStatus['gotXur']:
    print("シュールの情報を取得します。")
    checkCode = getXurSell.getXur()
    if checkCode == 0:
        currentStatus['gotXur'] = True
    elif checkCode == 5:
        timeStr = currentTime.strftime('%Y/%m/%d')
        tweetText = "【ベンダー情報】" + timeStr + "\nAPIのメンテナンス中につき、シュールの販売アイテムに関する情報が取得できませんでした。1時間後に再試行致しますので、しばらくお待ち下さい。"
        contents = {"text": tweetText}
        tw.makeTweet(contents)

# バンシー44の販売武器に関する情報を未取得だった場合は取得
if not currentStatus['Banshee']['gotWeekly']:
    print("バンシー44の「ウェポン」「おすすめ」情報を取得します。")
    checkCode = getBansheeSell.getBanshee("Weekly", recatch)
    if checkCode == 0:
        currentStatus['Banshee']['gotWeekly'] = True
elif not currentStatus['Banshee']['gotDaily']:
    print("バンシー44の「ウェポン」情報を取得します。")
    checkCode = getBansheeSell.getBanshee("Daily", recatch)
    if checkCode == 0:
        currentStatus['Banshee']['gotDaily'] = True
    elif checkCode == 5:
        timeStr = currentTime.strftime('%Y/%m/%d')
        tweetText = "【ベンダー情報】" + timeStr + "\nAPIのメンテナンス中につき、バンシー44の販売武器に関する情報が取得できませんでした。1時間後に再試行致しますので、しばらくお待ち下さい。"
        contents = {"text": tweetText}
        tw.makeTweet(contents)

finishedTime = datetime.datetime.now()
currentStatus['lastActive'] = finishedTime.strftime('%Y/%m/%d %I:%M:%S')

print("定期実行完了。")

with open('operationStatus.yml', 'w') as file:
    yaml.dump(currentStatus, file)
