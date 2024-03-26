### ライブラリのインポート ###
# 認証関連
import src.auth as auth
from dotenv import load_dotenv
import os
# API取得用
import requests
# 画像処理用
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import io
# ツイート用
from . import tweet as tw
# 細かい処理用
from time import sleep
import datetime
from zoneinfo import ZoneInfo
import csv
import math

def getLostSector():
    # 頻出する辞書とリストの定義
    armor = {0: 'チェストアーマー', 1: 'ヘルメット', 2: 'レッグアーマー', 3: 'ガントレット'}
    armorIcon = {0: 'chest_armor', 1: 'helmet', 2: 'boots', 3: 'gauntlet'}
    champion = {'barrier': "バリア", 'unstoppable': "アンストッパブル", 'overload': "オーバーロード"}
    elemHash = {'solar': "1847026933", 'arc': "2303181850", 'void': "3454344768", 'stasis': "151347233", 'strand': "3949783978"}

    # 画像生成用のフォント定義
    fontS = ImageFont.truetype('./.font/GenEiGothicN-Regular.otf', 17)
    fontN = ImageFont.truetype('./.font/GenEiGothicN-Regular.otf', 25)
    fontLoc = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 22)
    fontB0 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 28)
    fontB1 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 32)
    fontB2 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 40)
    fontTitle = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 55)
    logoImg = Image.open("./img/logo_full.png").resize((300, 46), 1)

    ### アクセスに必要なトークンを取得 ###
    auth.getBungieAccessToken()

    #### 基本データの取得 ####
    # ヘッダーにAPIキーとアクセストークンを設定
    load_dotenv()
    headers = {"X-API-Key": os.getenv('B_API_KEY'),
            "Authorization": "Bearer " + os.environ["BAPI_ACCESS_TOKEN"]}

    # CSVデータの準備
    with open('data/sector_base.csv') as f:
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
    with open('data/drop_exotic.csv') as f:
        reader = csv.reader(f)
        exotics = [row for row in reader]
    with open('data/sector_season23.csv') as f:
        reader = csv.reader(f)
        seasonal = [row for row in reader]
    with open('data/drop_season23.csv') as f:
        reader = csv.reader(f)
        lDrops = [row for row in reader]

    # 日付データの準備
    TimeZone = ZoneInfo("Asia/Tokyo")
    todayDate = datetime.datetime.now(TimeZone).date()
    todayDateStr = todayDate.strftime('%Y/%m/%d')

    baseDate = datetime.date(2023, 3, 2)
    seasonStartDate = datetime.date(int(seasonal[1][0]), int(seasonal[1][1]), int(seasonal[1][2]))
    
    seasonElapsedDate = (todayDate - seasonStartDate).days
    totalElapsedDate = (todayDate - baseDate).days

    # ローテーション取得
    sectorRot = seasonal[0][seasonElapsedDate % len(seasonal[0])]
    armorRot = armor[totalElapsedDate % 4]
    
    sectorHash = sector[sectorRot][0]

    # セクターに関する情報を取得
    # 取得成功可否も確認する
    for i in range(3):
        sectorData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityDefinition/" + str(sectorHash) + "/?lc=ja", headers=headers).json()
        if 'Response' not in sectorData:
            if sectorData['ErrorCode'] == 5:
                print("現在APIサービスはメンテナンス中です。処理を中断します。")
                return sectorData['ErrorCode']
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
    
    # マイルストーン情報取得
    # サージの情報を得るため、ナイトフォールの戦闘条件を流用する
    for i in range(3):
        activityData = requests.get("https://www.bungie.net//Platform/Destiny2/Milestones/?lc=ja", headers=headers).json()
        if 'Response' not in sectorData:
            if sectorData['ErrorCode'] == 5:
                print("現在APIサービスはメンテナンス中です。処理を中断します。")
                return sectorData['ErrorCode']
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
    
    surge1Hash = activityData['Response']['2029743966']['activities'][6]['modifierHashes'][12]
    surge2Hash = activityData['Response']['2029743966']['activities'][6]['modifierHashes'][13]
    
    tweetText = ""
    mediaList = []

    sectorName = sectorData['Response']['originalDisplayProperties']['name']

    sectorPlanetHash = sectorData['Response']['placeHash']
    sectorPlanetData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyPlaceDefinition/" + str(sectorPlanetHash) + "/?lc=ja", headers=headers).json()
    sectorPlanetName = sectorPlanetData['Response']['displayProperties']['name']

    sectorLocHash = sectorData['Response']['destinationHash']
    sectorLocData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyDestinationDefinition/" + str(sectorLocHash) + "/?lc=ja", headers=headers).json()
    sectorLocName = sectorLocData['Response']['displayProperties']['name']

    # ツイート用の文章を整形
    tweetText = "【 #失われたセクター 情報】" + todayDateStr + "\n本日の失われたセクター(伝説/達人)は" + sectorLocName + "の「" + sectorName + "」です。"

    threatHash = sectorData['Response']['modifiers'][10]['activityModifierHash']
    threatData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(threatHash) + "/?lc=ja", headers=headers).json()
    threatName = threatData['Response']['displayProperties']['name']

    surge1Data = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(surge1Hash) + "/?lc=ja", headers=headers).json()
    surge1Name = surge1Data['Response']['displayProperties']['name']

    surge2Data = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(surge2Hash) + "/?lc=ja", headers=headers).json()
    surge2Name = surge2Data['Response']['displayProperties']['name']
    
    ocHash = sectorData['Response']['modifiers'][20]['activityModifierHash']
    ocData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(ocHash) + "/?lc=ja", headers=headers).json()
    ocName = ocData['Response']['displayProperties']['name']
    
    tweetText += "\n\n本日の戦闘条件: \n" + threatName + ", " + surge1Name + ", " + surge2Name + "\n" + ocName

    tweetText += "\n\n#Destiny2"
    
    print(tweetText + "\n")

    # 画像生成
    imageURL = sectorData['Response']['pgcrImage']
    image = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + imageURL).content)).convert('RGBA')
    image = ImageEnhance.Brightness(image).enhance(0.78)
    mask = Image.open("./img/mask.png")

    baseImg = Image.alpha_composite(image, mask)
    resImg1 = io.BytesIO()
    draw = ImageDraw.Draw(baseImg)

    shift_x = 0

    draw.text((33, 30), "失われたセクター", fill=(255, 255, 255), font=fontTitle)
    draw.text((493, 45), "(" + todayDateStr + ")", fill=(255, 255, 255), font=fontB2)
    draw.text((1243, 685), sectorName, fill=(255, 255, 255), font=fontTitle, anchor="rb")
    
    if sectorLocName in sectorPlanetName:
        draw.text((1238, 605), sectorLocName, fill=(255, 255, 255), font=fontLoc, anchor="rb")
    else:
        sectorDestName = sectorPlanetName + "、" + sectorLocName
        draw.text((1238, 605), sectorDestName, fill=(255, 255, 255), font=fontLoc, anchor="rb")
    
    draw.multiline_text((28, 405), "＜チャンピオンと敵のシールド出現数＞", fill=(255, 255, 255), font=fontB1)
    draw.text((28, 605), "伝説:", fill=(255, 255, 255), font=fontN)
    draw.text((28, 665), "達人:", fill=(255, 255, 255), font=fontN)
    baseImg.paste(logoImg, (935, 45), logoImg)

    for i in range(1, 3):
        icon = Image.open("./img/" + sector[sectorRot][i][0] + ".png").resize((70, 70))
        baseImg.paste(icon, (145 + shift_x, 500), icon)
        draw.text((183 + shift_x, 470), champion[sector[sectorRot][i][0]], fill=(255, 255, 255), font=fontS, anchor='mm')
        draw.text((183 + shift_x, 602), "x" + sector[sectorRot][i][1][0], fill=(255, 255, 255), font=fontB2, anchor='mt')
        draw.text((183 + shift_x, 662), "x" + sector[sectorRot][i][1][1], fill=(255, 255, 255), font=fontB2, anchor='mt')
        shift_x += 140

    e = 3
    if sector[sectorRot][3]:
        e += 1
    if sector[sectorRot][4]:
        e += 1
    if sector[sectorRot][5]:
        e += 1
    for i in range(3, e):
        elemData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyDamageTypeDefinition/" + str(elemHash[sector[sectorRot][i][0]]) + "/?lc=ja", headers=headers).json()
        elemName = elemData['Response']['displayProperties']['name']
        elemPath = elemData['Response']['displayProperties']['icon']
        elemImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + elemPath).content)).convert("RGBA").resize((70, 70), 1)
        baseImg.paste(elemImg, (145 + shift_x, 500), elemImg)
        draw.text((183 + shift_x, 470), elemName, fill=(255, 255, 255), font=fontS, anchor='mm')
        draw.text((183 + shift_x, 602), "x" + sector[sectorRot][i][1][0], fill=(255, 255, 255), font=fontB2, anchor='mt')
        draw.text((183 + shift_x, 662), "x" + sector[sectorRot][i][1][1], fill=(255, 255, 255), font=fontB2, anchor='mt')
        shift_x += 140

    if not sectorData['Response']['modifiers'][11]['activityModifierHash'] in [1783825372]:
        modHash = sectorData['Response']['modifiers'][11]['activityModifierHash']
        modData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(modHash) + "/?lc=ja", headers=headers).json()
        modName = modData['Response']['displayProperties']['name']
        modDesc = modData['Response']['displayProperties']['description']
        modPath = modData['Response']['displayProperties']['icon']
        modImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + modPath).content)).convert("RGBA").resize((60, 60), 1)
        baseImg.paste(modImg, (25, 283), modImg)
        draw.text((105, 293), modName, fill=(255, 255, 255), font=fontB1)
        draw.text((43, 361), modDesc, fill=(255, 255, 255), font=fontN)

    baseImg.convert("RGB").save(resImg1, format='JPEG')

    mediaList.append(tw.postImage(resImg1.getvalue()))

    baseImg = Image.alpha_composite(image, mask)
    resImg2 = io.BytesIO()
    draw = ImageDraw.Draw(baseImg)
    baseImg.paste(logoImg, (935, 45), logoImg)

    shift_x = 0
    shift_y = 0

    draw.text((30, 30), "失われたセクター", fill=(255, 255, 255), font=fontB1)
    draw.text((45, 70), "本日のドロップアイテム (1/2)", fill=(255, 255, 255), font=fontTitle)
    draw.text((65, 190), "防具の部位:", fill=(255, 255, 255), font=fontB2)
    draw.text((400, 190), armorRot, fill=(255, 255, 255), font=fontB2)
    draw.text((30, 300), "<セクター限定で本日ドロップするエキゾチック防具>", fill=(255, 255, 255), font=fontB1)
    draw.text((1240, 680), "＊ ソロでクリア時のみドロップします。", fill=(255, 255, 255), font=fontN, anchor='rb')
    
    ## 部位アイコン挿入
    armorIconImg = Image.open("./img/" + armorIcon[totalElapsedDate % 4] + ".png").convert("RGBA").resize((70, 70), 1)
    baseImg.paste(armorIconImg, (305, 183), armorIconImg)
    
    ## 防具アイコン挿入
    for i in range(len(exotics[totalElapsedDate % 4])):
        eArmorData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyCollectibleDefinition/" + str(exotics[totalElapsedDate % 4][i]) + "/?lc=ja", headers=headers).json()
        eArmorImgPath = eArmorData['Response']['displayProperties']['icon']
        eArmorImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + eArmorImgPath).content))
        # リサイズして挿入
        eArmorImg = eArmorImg.resize((110, 110), 1)
        baseImg.paste(eArmorImg, (65 + shift_x, 360 + shift_y))
        
        shift_x += 130
        if ((i + 1) % 9 == 0):
            shift_x = 0
            shift_y += 130
            
    baseImg.convert("RGB").save(resImg2, format='JPEG')
    mediaList.append(tw.postImage(resImg2.getvalue()))

    baseImg = Image.alpha_composite(image, mask)
    resImg3 = io.BytesIO()
    draw = ImageDraw.Draw(baseImg)
    baseImg.paste(logoImg, (935, 45), logoImg)

    shift_x = 0
    shift_y = 0

    draw.text((30, 30), "失われたセクター", fill=(255, 255, 255), font=fontB1)
    draw.text((45, 70), "本日のドロップアイテム (2/2)", fill=(255, 255, 255), font=fontTitle)
    draw.text((30, 150), "<追加ドロップするレジェンダリー武器>", fill=(255, 255, 255), font=fontB1)
    draw.text((1240, 680), "＊ ソロでクリア時のみドロップ。達人クリアの場合、パークが複数個つく可能性があります。", fill=(255, 255, 255), font=fontN, anchor='rb')
        
    ## 武器アイコン挿入
    for i in range(4):
        # データ取得
        lWeaponHash = lDrops[totalElapsedDate % 4][i]
        lWeaponData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponHash) + "/?lc=ja", headers=headers).json()
        lWeaponName = lWeaponData['Response']['displayProperties']['name']

        ## 武器アイコン挿入
        # パスから画像・ウォーターマークを取得
        lWeaponImgPath = lWeaponData['Response']['displayProperties']['icon']
        lWeaponWMPath = lWeaponData['Response']['quality']['displayVersionWatermarkIcons'][-1]
        lWeaponBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponImgPath).content))
        lWeaponBaseImg.putalpha(255)
        lWeaponWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponWMPath).content)).convert("RGBA")
        # 武器画像とウォーターマークを合成
        lWeaponImg = Image.alpha_composite(lWeaponBaseImg, lWeaponWM)
        # リサイズして挿入
        lWeaponImg = lWeaponImg.resize((100, 100), 1)
        baseImg.paste(lWeaponImg, (85 + shift_x, 260 + shift_y))

        ## 武器名挿入
        draw.multiline_text((205 + shift_x, 270 + shift_y), lWeaponName, fill=(255, 255, 255), font=fontB0)

        ## 属性アイコン挿入
        lWeaponElemHash = lWeaponData['Response']['damageTypeHashes'][0]
        if lWeaponElemHash != 3373582085:
            # 属性アイコンがある場合は間隔を空ける
            elementShift = 42
            lWeaponElemData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyDamageTypeDefinition/" + str(lWeaponElemHash) + "/?lc=ja", headers=headers).json()
            lWeaponElemPath = lWeaponElemData['Response']['displayProperties']['icon']
            lWeaponElemImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponElemPath).content)).convert("RGBA").resize((30, 30), 1)
            baseImg.paste(lWeaponElemImg, (205 + shift_x, 312 + shift_y), lWeaponElemImg)
        else:
            elementShift = 0
        
        ## 弾薬アイコン挿入
        if lWeaponData['Response']['equippingBlock']['ammoType'] == 1:
            lWeaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/99f3733354862047493d8550e46a45ec.png").content)).convert("RGBA").resize((50, 50), 1)
        elif lWeaponData['Response']['equippingBlock']['ammoType'] == 2:
            lWeaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/d920203c4fd4571ae7f39eb5249eaecb.png").content)).convert("RGBA").resize((50, 50), 1)
        elif lWeaponData['Response']['equippingBlock']['ammoType'] == 3:
            lWeaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/78ef0e2b281de7b60c48920223e0f9b1.png").content)).convert("RGBA").resize((50, 50), 1)
        baseImg.paste(lWeaponAmmoImg, (200 + elementShift + shift_x, 302 + shift_y), lWeaponAmmoImg)

        ## 武器種挿入
        lWeaponArchName = lWeaponData['Response']['itemTypeDisplayName']
        draw.multiline_text((258 + elementShift + shift_x, 311 + shift_y), lWeaponArchName, fill=(255, 255, 255), font=fontN)

        # 部位ごとにずらす
        if (i % 2) == 0:
            shift_x = 620
        else:
            shift_x = 0
            shift_y += 180
    
    baseImg.convert("RGB").save(resImg3, format='JPEG')
    mediaList.append(tw.postImage(resImg3.getvalue()))
    
    content = {"text": tweetText, "media": {"media_ids": mediaList}}
    tw.makeTweet(content)

    print("\n情報取得の全工程完了。")
    
    return 0