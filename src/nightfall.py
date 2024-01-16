### ライブラリのインポート ###
# 認証関連
import src.auth as auth
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

def getNightfall():
    # 頻出する辞書とリストの定義
    champion = {'barrier': "バリア", 'unstoppable': "アンストッパブル", 'overload': "オーバーロード"}
    elemHash = {'solar': "1847026933", 'arc': "2303181850", 'void': "3454344768", 'stasis': "151347233", 'strand': "3949783978"}

    # 画像生成用のフォント定義
    fontN = ImageFont.truetype('./.font/GlowSansSC-Normal-Medium.otf', 25)
    fontB0 = ImageFont.truetype('./.font/GlowSansSC-Normal-Bold.otf', 28)
    fontB1 = ImageFont.truetype('./.font/GlowSansSC-Normal-Bold.otf', 32)
    fontB2 = ImageFont.truetype('./.font/GlowSansSC-Normal-Bold.otf', 40)
    fontTitle = ImageFont.truetype('./.font/GlowSansSC-Normal-Bold.otf', 56)
    logoImg = Image.open("./img/logo_full.png").resize((300, 46), 1)

    ### アクセスに必要なトークンを取得 ###
    auth.getBungieAccessToken()

    #### 基本データの取得 ####
    # ヘッダーにAPIキーとアクセストークンを設定
    headers = {"X-API-Key": os.getenv('B_API_KEY'),
            "Authorization": "Bearer " + os.environ["BAPI_ACCESS_TOKEN"]}

    # 日付データの準備
    TimeZone = ZoneInfo("Asia/Tokyo")
    todayDate = datetime.datetime.now(TimeZone).date()
    todayDateStr = todayDate.strftime('%Y/%m/%d')
    endDate = todayDate + datetime.timedelta(days=8-todayDate.weekday())
    endDateStr = endDate.strftime('%Y/%m/%d')
    
    # ナイトフォールの情報を取得
    # 取得成功可否も確認する
    for i in range(3):
        activityData = requests.get("https://www.bungie.net//Platform/Destiny2/Milestones/?lc=ja", headers=headers).json()
        if 'Response' not in activityData:
            if activityData['ErrorCode'] == 5:
                print("現在APIサービスはメンテナンス中です。処理を中断します。")
                return activityData['ErrorCode']
            if i != 2:
                print("API取得に失敗しました。3秒後にリトライします…")
                sleep(3)
                continue
            else:
                print("APIが取得できませんでした。処理を中断します。")
                print("エラーコード - " + str(activityData['ErrorCode']) + "\n" + activityData['Message'])
                return activityData['ErrorCode']
        else:
            break
        
    nightfallHash = activityData['Response']['2029743966']['activities'][3]['activityHash']
    nightfallData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityDefinition/" + str(nightfallHash) + "/?lc=ja", headers=headers).json()
    
    # 各種情報の取得    
    nightfallName = nightfallData['Response']['displayProperties']['description']

    shieldHash = activityData['Response']['2029743966']['activities'][3]['modifierHashes'][0]
    shieldData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(shieldHash) + "/?lc=ja", headers=headers).json()
    shieldPath = shieldData['Response']['displayProperties']['icon']

    championHash = activityData['Response']['2029743966']['activities'][3]['modifierHashes'][-12]
    championData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(championHash) + "/?lc=ja", headers=headers).json()
    championPath = championData['Response']['displayProperties']['icon']

    specialModHash = activityData['Response']['2029743966']['activities'][3]['modifierHashes'][-6]
    specialModData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(specialModHash) + "/?lc=ja", headers=headers).json()
    specialModPath = specialModData['Response']['displayProperties']['icon']
    specialModName = specialModData['Response']['displayProperties']['name']
    specialModDesc = specialModData['Response']['displayProperties']['description']

    threatHash = activityData['Response']['2029743966']['activities'][3]['modifierHashes'][-10]
    threatData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(threatHash) + "/?lc=ja", headers=headers).json()
    threatPath = threatData['Response']['displayProperties']['icon']

    surge1Hash = activityData['Response']['2029743966']['activities'][3]['modifierHashes'][-3]
    surge1Data = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(surge1Hash) + "/?lc=ja", headers=headers).json()
    surge1Path = surge1Data['Response']['displayProperties']['icon']

    surge2Hash = activityData['Response']['2029743966']['activities'][3]['modifierHashes'][-2]
    surge2Data = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(surge2Hash) + "/?lc=ja", headers=headers).json()
    surge2Path = surge2Data['Response']['displayProperties']['icon']

    ocHash = activityData['Response']['2029743966']['activities'][3]['modifierHashes'][-1]
    ocData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(ocHash) + "/?lc=ja", headers=headers).json()
    ocPath = ocData['Response']['displayProperties']['icon']

    # 報酬武器の取得
    for i in range(3):
        vendorData = requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009405135001/Vendors/2232145065/?components=401,402", headers=headers).json()
        if 'Response' not in vendorData:
            for j in range(3):
                if vendorData['ErrorCode'] == 5:
                    print("現在APIサービスはメンテナンス中です。処理を中断します。")
                    break
                elif i != 2:
                    print("API取得に失敗しました。3秒後にリトライします…")
                    sleep(3)
                    continue
                else:
                    print("APIが取得できませんでした。処理を中断します。")
                    print("エラーコード - " + str(vendorData['ErrorCode']) + "\n" + vendorData['Message'])
            return vendorData['ErrorCode']
        else:
            break

    weaponOrder = vendorData['Response']['categories']['data']['categories'][1]['itemIndexes'][-1]
    weaponAdeptHash = vendorData['Response']['sales']['data'][str(weaponOrder)]['itemHash']
    
    # 検索にかけるため、英語名を作る（(Adept)つきで取得→(Adept)を切り落とす）
    weaponDataEng = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(weaponAdeptHash), headers=headers).json()
    weaponNameRaw = weaponDataEng['Response']['displayProperties']['name']
    weaponNameEng = weaponNameRaw[:-8]
    
    searchRes = requests.get("https://www.bungie.net/Platform/Destiny2/Armory/Search/DestinyInventoryItemDefinition/" + weaponNameEng + "/", headers=headers).json()
    
    # 検索で得た武器が今シーズンのもの、かつ新版でないか確認
    # indexを比較し、新しいほうを保存する
    for i in range(len(searchRes['Response']['results']['results'])):
        weaponHash = searchRes['Response']['results']['results'][i]['hash']
        weaponData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(weaponHash), headers=headers).json()
        if i == 0 or (weaponData['Response']['index'] > newestWeaponData['Response']['index'] and "(Adept)" not in weaponData['Response']['displayProperties']['name']):
            newestWeaponData = weaponData
    
    weaponHash = newestWeaponData['Response']['hash']
    weaponData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(weaponHash) + "/?lc=ja", headers=headers).json()

    weaponName = weaponData['Response']['displayProperties']['name']
    weaponSpec = weaponData['Response']['itemTypeDisplayName']
    
    tweetText = ""
    mediaList = []

    # ツイート用の文章を整形
    tweetText = "【 #ナイトフォール 情報】" + todayDateStr + "\n今週のナイトフォールは「" + nightfallName + "」です。\n\n報酬: " + weaponName + "（" + weaponSpec + "）\n戦闘条件など、詳細は画像をご確認ください。\n\n#Destiny2"
    
    print(tweetText + "\n")

    # 画像生成
    imageURL = nightfallData['Response']['pgcrImage']
    image = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + imageURL).content)).convert('RGBA')
    image = ImageEnhance.Brightness(image).enhance(0.78)
    mask = Image.open("./img/mask.png")

    baseImg = Image.alpha_composite(image, mask)
    
    resImg = io.BytesIO()
    draw = ImageDraw.Draw(baseImg)

    draw.text((40, 34), "ナイトフォール", fill=(255, 255, 255), font=fontB2)
    draw.text((350, 45), "(" + todayDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB0)
    draw.text((40, 113), nightfallName, fill=(255, 255, 255), font=fontTitle)
    baseImg.paste(logoImg, (935, 45), logoImg)
    
    specialModImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + specialModPath).content)).convert("RGBA").resize((60, 60), 1)
    baseImg.paste(specialModImg, (35, 223), specialModImg)
    draw.text((112, 228), specialModName, fill=(255, 255, 255), font=fontB1)
    draw.text((50, 296), specialModDesc, fill=(255, 255, 255), font=fontN)

    draw.multiline_text((35, 360), "＜戦闘条件＞", fill=(255, 255, 255), font=fontB1)

    draw.text((35, 410), "シールド", fill=(255, 255, 255), font=fontB0)
    shieldImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + shieldPath).content)).convert("RGBA").resize((80, 80), 1)
    baseImg.paste(shieldImg, (46, 460), shieldImg)

    draw.text((194, 411), "脅威", fill=(255, 255, 255), font=fontB0)
    threatImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + threatPath).content)).convert("RGBA").resize((80, 80), 1)
    baseImg.paste(threatImg, (180, 460), threatImg)

    draw.text((70, 550), "チャンピオン", fill=(255, 255, 255), font=fontB0)
    championImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + championPath).content)).convert("RGBA").resize((80, 80), 1)
    baseImg.paste(championImg, (113, 600), championImg)

    draw.text((384, 410), "サージ", fill=(255, 255, 255), font=fontB0)
    surge1Img = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + surge1Path).content)).convert("RGBA").resize((80, 80), 1)
    surge2Img = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + surge2Path).content)).convert("RGBA").resize((80, 80), 1)
    baseImg.paste(surge1Img, (339, 460), surge1Img)
    baseImg.paste(surge2Img, (429, 460), surge2Img)

    draw.text((314, 550), "オーバーチャージ", fill=(255, 255, 255), font=fontB0)
    ocImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + ocPath).content)).convert("RGBA").resize((80, 80), 1)
    baseImg.paste(ocImg, (384, 600), ocImg)

    draw.multiline_text((605, 360), "＜限定報酬＞", fill=(255, 255, 255), font=fontB1)

    ## 武器アイコン挿入
    # パスから画像・ウォーターマークを取得
    weaponImgPath = weaponData['Response']['displayProperties']['icon']
    weaponWMPath = weaponData['Response']['quality']['displayVersionWatermarkIcons'][-1]
    weaponBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + weaponImgPath).content))
    weaponBaseImg.putalpha(255)
    weaponWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + weaponWMPath).content)).convert("RGBA")
    # 武器画像とウォーターマークを合成
    weaponImg = Image.alpha_composite(weaponBaseImg, weaponWM)
    # リサイズして挿入
    weaponImg = weaponImg.resize((100, 100), 1)
    baseImg.paste(weaponImg, (650, 475))

    ## 武器名挿入
    draw.multiline_text((770, 480), weaponName, fill=(255, 255, 255), font=fontB0)

    ## 属性アイコン挿入
    weaponElemHash = weaponData['Response']['damageTypeHashes'][0]
    if weaponElemHash != 3373582085:
        # 属性アイコンがある場合は間隔を空ける
        elementShift = 42
        weaponElemData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyDamageTypeDefinition/" + str(weaponElemHash) + "/?lc=ja", headers=headers).json()
        weaponElemPath = weaponElemData['Response']['displayProperties']['icon']
        weaponElemImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + weaponElemPath).content)).convert("RGBA").resize((30, 30), 1)
        baseImg.paste(weaponElemImg, (770, 527), weaponElemImg)
    else:
        elementShift = 0
    
    ## 弾薬アイコン挿入
    if weaponData['Response']['equippingBlock']['ammoType'] == 1:
        weaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/99f3733354862047493d8550e46a45ec.png").content)).convert("RGBA").resize((50, 50), 1)
    elif weaponData['Response']['equippingBlock']['ammoType'] == 2:
        weaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/d920203c4fd4571ae7f39eb5249eaecb.png").content)).convert("RGBA").resize((50, 50), 1)
    elif weaponData['Response']['equippingBlock']['ammoType'] == 3:
        weaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/78ef0e2b281de7b60c48920223e0f9b1.png").content)).convert("RGBA").resize((50, 50), 1)
    baseImg.paste(weaponAmmoImg, (764 + elementShift, 517), weaponAmmoImg)

    ## 武器種挿入
    weaponArchName = weaponData['Response']['itemTypeDisplayName']
    draw.multiline_text((819 + elementShift, 522), weaponArchName, fill=(255, 255, 255), font=fontN)
    
    draw.text((1250, 680), "＊ 玄人クリアで、上記武器の“新 ・ ”版がドロップします。", fill=(255, 255, 255), font=fontN, anchor='rb')

    baseImg.convert("RGB").save(resImg, format='JPEG')
    mediaList.append(tw.postImage(resImg.getvalue()))
    
    content = {"text": tweetText, "media": {"media_ids": mediaList}}
    tweetID = tw.makeTweet(content)
    tw.pinTweet(tweetID)

    print("情報取得の全工程完了。")
    
    return 0