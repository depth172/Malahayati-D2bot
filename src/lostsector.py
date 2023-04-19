### ライブラリのインポート ###
# 認証関連
import src.auth as auth
import os
# API取得用
import requests
# 画像処理用
from PIL import Image, ImageDraw, ImageFont
import io
# ツイート用
from . import tweet as tw
# 細かい処理用
from time import sleep
import datetime
from zoneinfo import ZoneInfo
import csv

def getLostSector():
    # 頻出する辞書とリストの定義
    armor = {0: 'チェストアーマー', 1: 'ヘルメット', 2: 'レッグアーマー', 3: 'ガントレット'}
    champion = {'barrier': "バリア", 'unstoppable': "アンストッパブル", 'overload': "オーバーロード"}
    elemHash = {'solar': "1847026933", 'arc': "2303181850", 'void': "3454344768", 'stasis': "151347233", 'strand': "3949783978"}

    # 画像生成用のフォント定義
    fontS = ImageFont.truetype('./.font/GlowSansSC-Normal-Medium.otf', 17)
    fontN = ImageFont.truetype('./.font/GlowSansSC-Normal-Medium.otf', 25)
    fontB1 = ImageFont.truetype('./.font/GlowSansSC-Normal-Bold.otf', 32)
    fontB2 = ImageFont.truetype('./.font/GlowSansSC-Normal-Bold.otf', 40)
    fontTitle = ImageFont.truetype('./.font/GlowSansSC-Normal-Bold.otf', 55)
    logoImg = Image.open("./img/logo_full.png").resize((300, 46), 1)

    ### アクセスに必要なトークンを取得 ###
    auth.getBungieAccessToken()

    #### 基本データの取得 ####
    # ヘッダーにAPIキーとアクセストークンを設定
    headers = {"X-API-Key": os.getenv('B_API_KEY'),
            "Authorization": "Bearer " + os.environ["BAPI_ACCESS_TOKEN"]}

    # CSVデータの準備
    with open('data/season20.csv') as f:
        reader = csv.reader(f)
        seasonal = [row for row in reader]
    with open('data/sectorBase.csv') as f:
        reader = csv.reader(f)
        sectorRaw = [row for row in reader]
        sector = {}
        for i, sec in enumerate(sectorRaw):
            sector[sectorRaw[i][0]] = []
            for j, content in enumerate(sec):
                if j != 0:
                    if '-' in sectorRaw[i][j]:
                        sector[sectorRaw[i][0]].append([])
                        for k, splited in enumerate(sectorRaw[i][j].split('-')):
                            if '+' in splited:
                                sector[sectorRaw[i][0]][j - 1].append([])
                                for l, moresplited in enumerate(splited.split('+')):
                                    sector[sectorRaw[i][0]][j - 1][k].append(moresplited)
                            else:
                                sector[sectorRaw[i][0]][j - 1].append(splited)
                    else:
                        sector[sectorRaw[i][0]].append(sectorRaw[i][j])

    # 日付データの準備
    TimeZone = ZoneInfo("Asia/Tokyo")
    todayDate = datetime.datetime.now(TimeZone).date()
    todayDateStr = todayDate.strftime('%Y/%m/%d')

    seasonStartDate = datetime.date(int(seasonal[1][0]), int(seasonal[1][1]), int(seasonal[1][2]))
    elapsedDate = (todayDate - seasonStartDate).days

    # ローテーション取得
    sectorRot = seasonal[0][elapsedDate % len(seasonal[0])]
    armorRot = armor[elapsedDate % 4]
    surgeRot = 16 + elapsedDate // 7 % 2

    sectorHash = sector[sectorRot][0]

    # セクターに関する情報を取得
    # 取得成功可否も確認する
    for i in range(3):
        sectorData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityDefinition/" + str(sectorHash) + "/?lc=ja", headers=headers).json()
        if 'Response' not in sectorData:
            for j in range(3):
                if sectorData['ErrorCode'] == 5:
                    print("現在APIサービスはメンテナンス中です。処理を中断します。")
            if i != 2:
                print("API取得に失敗しました。3秒後にリトライします…")
                sleep(3)
                continue
            else:
                print("APIが取得できませんでした。処理を中断します。")
                print("エラーコード - " + str(sectorData['ErrorCode']) + "\n" + sectorData['Message'])
            return sectorData['ErrorCode']
        else:
            break

    tweetText = ""
    resImg = io.BytesIO()
    mediaList = []

    sectorName = sectorData['Response']['originalDisplayProperties']['name']

    sectorLocHash = sectorData['Response']['destinationHash']
    sectorLocData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyDestinationDefinition/" + str(sectorLocHash) + "/?lc=ja", headers=headers).json()
    sectorLocName = sectorLocData['Response']['displayProperties']['name']

    # ツイート用の文章を整形
    tweetText = "【 #失われたセクター 情報】" + todayDateStr + "\n本日の失われたセクター(伝説/達人)は" + sectorLocName + "の「" + sectorName + "」です。"
    tweetText += "\n\n報酬部位: " + armorRot

    threatHash = sectorData['Response']['modifiers'][10]['activityModifierHash']
    threatData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(threatHash) + "/?lc=ja", headers=headers).json()
    threatName = threatData['Response']['displayProperties']['name']

    surge1Hash = sectorData['Response']['modifiers'][surgeRot]['activityModifierHash']
    surge1Data = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(surge1Hash) + "/?lc=ja", headers=headers).json()
    surge1Name = surge1Data['Response']['displayProperties']['name']

    surge2Hash = sectorData['Response']['modifiers'][18]['activityModifierHash']
    surge2Data = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(surge2Hash) + "/?lc=ja", headers=headers).json()
    surge2Name = surge2Data['Response']['displayProperties']['name']

    ocHash = sectorData['Response']['modifiers'][19]['activityModifierHash']
    ocData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(ocHash) + "/?lc=ja", headers=headers).json()
    ocName = ocData['Response']['displayProperties']['name']

    tweetText += "\n\n本日の戦闘条件: \n" + threatName + ", " + surge1Name + ", " + surge2Name + "\n" + ocName

    tweetText += "\n\n#Destiny2"

    # 画像生成
    imageURL = sectorData['Response']['pgcrImage']
    image = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + imageURL).content)).convert('RGBA')
    mask = Image.open("./img/mask.png")

    baseImg = Image.alpha_composite(image, mask)
    resImg = io.BytesIO()
    draw = ImageDraw.Draw(baseImg)

    shift_x = 0

    draw.text((30, 25), "失われたセクター", fill=(255, 255, 255), font=fontTitle)
    draw.text((490, 40), "(" + todayDateStr + ")", fill=(255, 255, 255), font=fontB2)
    draw.text((1240, 680), sectorName, fill=(255, 255, 255), font=fontTitle, anchor="rb")
    draw.text((1235, 600), sectorLocName, fill=(255, 255, 255), font=fontB1, anchor="rb")
    draw.multiline_text((25, 400), "＜チャンピオンと敵のシールド出現数＞", fill=(255, 255, 255), font=fontB1)
    draw.text((25, 600), "伝説:", fill=(255, 255, 255), font=fontN)
    draw.text((25, 660), "達人:", fill=(255, 255, 255), font=fontN)
    baseImg.paste(logoImg, (935, 45), logoImg)

    for i in range(1, 3):
        icon = Image.open("./img/" + sector[sectorRot][i][0] + ".png").resize((70, 70))
        baseImg.paste(icon, (145 + shift_x, 500), icon)
        draw.text((180 + shift_x, 460), champion[sector[sectorRot][i][0]], fill=(255, 255, 255), font=fontS, anchor='mt')
        draw.text((180 + shift_x, 602), "×" + sector[sectorRot][i][1][0], fill=(255, 255, 255), font=fontB2, anchor='mt')
        draw.text((180 + shift_x, 662), "×" + sector[sectorRot][i][1][1], fill=(255, 255, 255), font=fontB2, anchor='mt')
        shift_x += 140

    e = 3
    if sector[sectorRot][3]:
        e += 1
    if sector[sectorRot][4]:
        e += 1
    for i in range(3, e):
        elemData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyDamageTypeDefinition/" + str(elemHash[sector[sectorRot][i][0]]) + "/?lc=ja", headers=headers).json()
        elemName = elemData['Response']['displayProperties']['name']
        elemPath = elemData['Response']['displayProperties']['icon']
        elemImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + elemPath).content)).convert("RGBA").resize((70, 70), 1)
        baseImg.paste(elemImg, (145 + shift_x, 500), elemImg)
        draw.text((180 + shift_x, 460), elemName, fill=(255, 255, 255), font=fontS, anchor='mt')
        draw.text((180 + shift_x, 602), "×" + sector[sectorRot][i][1][0], fill=(255, 255, 255), font=fontB2, anchor='mt')
        draw.text((180 + shift_x, 662), "×" + sector[sectorRot][i][1][1], fill=(255, 255, 255), font=fontB2, anchor='mt')
        shift_x += 140

    if not sectorData['Response']['modifiers'][11]['activityModifierHash'] in [1783825372]:
        modHash = sectorData['Response']['modifiers'][11]['activityModifierHash']
        modData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(modHash) + "/?lc=ja", headers=headers).json()
        modName = modData['Response']['displayProperties']['name']
        modDesc = modData['Response']['displayProperties']['description']
        modPath = modData['Response']['displayProperties']['icon']
        modImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + modPath).content)).convert("RGBA").resize((60, 60), 1)
        baseImg.paste(modImg, (25, 283), modImg)
        draw.text((102, 288), modName, fill=(255, 255, 255), font=fontB1)
        draw.text((40, 356), modDesc, fill=(255, 255, 255), font=fontN)

    baseImg.convert("RGB").save(resImg, format='JPEG')

    mediaList.append(tw.postImage(resImg.getvalue()))
    content = {"text": tweetText, "media": {"media_ids": mediaList}}
    tw.makeTweet(content)

    print(tweetText + "\n")
    print("情報取得の全工程完了。")
    
    return 0