### ライブラリのインポート ###
# 認証関連
import refreshAuth
import os
# API取得用
import requests
# 画像処理用
from PIL import Image, ImageDraw, ImageFont
import io
# 細かい処理用
import sys
from time import sleep
import datetime
import math

# 頻出する辞書とリストの定義
statsTable = ['2996146975', '392767087', '1943323491', '1735777505', '144602215', '4244567218']
weaponStatsTable = ['1240592695', '155624089', '943549884', '4188031367']
weekday = {0: '月曜日', 1: '火曜日', 2: '水曜日', 3: '木曜日', 4: '金曜日', 5: '土曜日', 6: '日曜日'}

# 画像生成用のフォント定義
fontN = ImageFont.truetype('/.font/GlowSansSC-Normal-Medium.otf', 25)
fontB0 = ImageFont.truetype('/.font/GlowSansSC-Normal-Bold.otf', 28)
fontB1 = ImageFont.truetype('/.font/GlowSansSC-Normal-Bold.otf', 32)
fontB2 = ImageFont.truetype('/.font/GlowSansSC-Normal-Bold.otf', 40)
fontB3 = ImageFont.truetype('/.font/GlowSansSC-Normal-Bold.otf', 45)
fontTitle = ImageFont.truetype('/.font/GlowSansSC-Normal-Bold.otf', 55)

### アクセスに必要なトークンを取得 ###

refreshAuth.getAccessToken()

#### 基本データの取得 ####

# ヘッダーにAPIキーとアクセストークンを設定
headers = {"X-API-Key": os.getenv('API_KEY'),
           "Authorization": "Bearer " + os.environ["BAPI_ACCESS_TOKEN"]}

# バンシーに関する情報を取得
# 取得成功可否も確認する
# 0 = ハンター, 1 = タイタン, 2 = ウォーロック
for i in range(3):
    vendor = []
    vendor.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009576344512/Vendors/672118013/?components=402,310,305", headers=headers).json())
    vendor.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009576344511/Vendors/672118013/?components=402,310,305", headers=headers).json())
    vendor.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009405135001/Vendors/672118013/?components=402,310,305", headers=headers).json())
    if ('Response' not in vendor[0]) or ('Response' not in vendor[1]) or ('Response' not in vendor[2]):
        for j in range(3):
            if vendor[j]['ErrorCode'] == 5:
                print("現在APIサービスはメンテナンス中です。処理を中断します。")
                sys.exit()
        if i != 2:
            print("API取得に失敗しました。3秒後にリトライします…")
            sleep(3)
            continue
        else:
            print("APIが取得できませんでした。処理を中断します。")
            print("エラーコード - " + str(vendor[0]['ErrorCode']) + "\n" + vendor[j]['Message'])
            sys.exit()
    else:
        break

# 日付データの準備
startDate = datetime.datetime.now()
startDateStr = startDate.strftime('%Y/%m/%d')

tweet = open('tweet_text.txt', 'w', encoding="utf-8")

# 販売アイテムリストを生成
# 0 = ハンター, 1 = タイタン, 2 = ウォーロック
salesList = []
salesList.append(list(vendor[0]['Response']['sales']['data'].keys()))
salesList.append(list(vendor[1]['Response']['sales']['data'].keys()))
salesList.append(list(vendor[2]['Response']['sales']['data'].keys()))

# ツイート用の文章を整形

if startDate.weekday() == 2:
    # 週替わり武器の取得
    tweet.write("【ベンダー情報 / 毎週更新】" + startDateStr + "\n")
    tweet.write("本日は" + weekday[startDate.weekday()] + "、週間リセットの日です。\n")
    print("週替わり武器:")
    tweet.write("バンシー44が販売する週替わり武器は以下のようになっています。\n")
    endDate = startDate + datetime.timedelta(days=6)
    endDateStr = endDate.strftime('%Y/%m/%d')
    isDaily = False
    w = 0
else:
    tweet.write("【ベンダー情報 / 毎日更新】" + startDateStr + "\n")
    # 日替わり武器の取得
    tweet.write("本日は" + weekday[startDate.weekday()] + "です。\n")
    print("日替わり武器:")
    tweet.write("バンシー44が販売する日替わり武器は以下のようになっています。\n")
    isDaily = True
    w = 6


### 画像生成

c = 0
p = 1
m = 11
perkMax = 1
while w < m:
    if w in [0, 4, 6, 10]:
        # フォントと背景画像の準備
        baseImg = Image.open("./banshee_bg.jpg").convert("RGBA")
        draw = ImageDraw.Draw(baseImg)
            
        # タイトルと日付挿入
        if isDaily == False:
            draw.multiline_text((30, 25), "今週のバンシー44", fill=(255, 255, 255), font=fontTitle)
            draw.multiline_text((520, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
            draw.multiline_text((30, 120), "<週替わり武器 (" + str(p) + "/2)>", fill=(255, 255, 255), font=fontB1)
            draw.multiline_text((400, 130), "＊「ウェポン」の欄に販売される武器は週替わりとなります。", fill=(255, 255, 255), font=fontN)
        else:
            draw.multiline_text((30, 25), "今日のバンシー44", fill=(255, 255, 255), font=fontTitle)
            draw.multiline_text((520, 40), "(" + startDateStr + ")", fill=(255, 255, 255), font=fontB2)
            draw.multiline_text((30, 120), "<日替わり武器 (" + str(p) + "/2)>", fill=(255, 255, 255), font=fontB1)
            draw.multiline_text((400, 130), "＊「おすすめ」の欄に販売される武器は日替わりとなります。", fill=(255, 255, 255), font=fontN)

        shift_x = 0
        shift_y = 0
        perkCount = 0

    # データ取得
    lWeaponHash = vendor[c]['Response']['sales']['data'][salesList[c][w + 2 - c]]['itemHash']
    lWeaponData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponHash) + "/?lc=ja", headers=headers).json()
    lWeaponName = lWeaponData['Response']['displayProperties']['name']
    
    print("　" + lWeaponName)
    tweet.write("- " + lWeaponName + "\n")
        
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
    baseImg.paste(lWeaponImg, (75 + shift_x, 180 + shift_y))

    ## 武器名挿入
    draw.multiline_text((195 + shift_x, 190 + shift_y), lWeaponName, fill=(255, 255, 255), font=fontB0)

    ## 属性アイコン挿入
    lWeaponElemHash = lWeaponData['Response']['damageTypeHashes'][0]
    if lWeaponElemHash != 3373582085:
        # 属性アイコンがある場合は間隔を空ける
        elementShift = 42
        lWeaponElemData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyDamageTypeDefinition/" + str(lWeaponElemHash) + "/?lc=ja", headers=headers).json()
        lWeaponElemPath = lWeaponElemData['Response']['displayProperties']['icon']
        lWeaponElemImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponElemPath).content)).convert("RGBA").resize((30, 30), 1)
        baseImg.paste(lWeaponElemImg, (195 + shift_x, 237 + shift_y), lWeaponElemImg)
    else:
        elementShift = 0
    
    ## 弾薬アイコン挿入
    if lWeaponData['Response']['equippingBlock']['ammoType'] == 1:
        lWeaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/dc4bb9bcdd4ae8a83fb9007a51d7d711.png").content)).convert("RGBA").resize((50, 50), 1)
    elif lWeaponData['Response']['equippingBlock']['ammoType'] == 2:
        lWeaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/b6d3805ca8400272b7ee7935b0b75c79.png").content)).convert("RGBA").resize((50, 50), 1)
    elif lWeaponData['Response']['equippingBlock']['ammoType'] == 3:
        lWeaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/9fa60d5a99c9ff9cea0fb6dd690f26ec.png").content)).convert("RGBA").resize((50, 50), 1)
    baseImg.paste(lWeaponAmmoImg, (190 + elementShift + shift_x, 227 + shift_y), lWeaponAmmoImg)

    ## 武器種挿入
    lWeaponArchName = lWeaponData['Response']['itemTypeDisplayName']
    draw.multiline_text((245 + elementShift + shift_x, 232 + shift_y), lWeaponArchName, fill=(255, 255, 255), font=fontN)

    ## 内在特性挿入
    # 画像挿入
    lWeaponFrameHash = lWeaponData['Response']['sockets']['socketEntries'][0]['singleInitialItemHash']
    lWeaponFrameData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponFrameHash) + "/?lc=ja", headers=headers).json()
    lWeaponFramePath = lWeaponFrameData['Response']['displayProperties']['icon']
    lWeaponFrameName = lWeaponFrameData['Response']['displayProperties']['name']
    lWeaponFrameImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponFramePath).content)).convert("RGBA")

    lWeaponFrameImg = lWeaponFrameImg.resize((80, 80), 1)
    baseImg.paste(lWeaponFrameImg, (85 + shift_x, 295 + shift_y), lWeaponFrameImg)
    draw.multiline_text((175 + shift_x, 312 + shift_y), lWeaponFrameName, fill=(255, 255, 255), font=fontB0)

    ## マスターワークアイコン挿入
    # パスから画像・ウォーターマークを取得
    lWeaponMWHash = vendor[c]['Response']['itemComponents']['reusablePlugs']['data'][salesList[c][w + 2 - c]]['plugs']['7'][0]['plugItemHash']
    lWeaponMWData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponMWHash) + "/?lc=ja", headers=headers).json()
    lWeaponMWPath = lWeaponMWData['Response']['displayProperties']['icon']
    lWeaponMWWMPath = lWeaponMWData['Response']['iconWatermark']
    lWeaponMWBase = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponMWPath).content))
    lWeaponMWBase.putalpha(255)
    lWeaponMWWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponMWWMPath).content)).convert("RGBA")
    # 武器画像とウォーターマークを合成
    lWeaponMW = Image.alpha_composite(lWeaponMWBase, lWeaponMWWM)
    # リサイズして挿入
    lWeaponMW = lWeaponMW.resize((80, 80), 1)
    baseImg.paste(lWeaponMW, (505 + shift_x, 295 + shift_y))

    # パーク挿入
    for i in range(1, 6):
        try:
            perkQuantity = len(vendor[c]['Response']['itemComponents']['reusablePlugs']['data'][salesList[c][w + 2 - c]]['plugs'][str(i)])
            if perkQuantity > perkMax: perkMax = perkQuantity
        except KeyError:
            perkQuantity = 1
        for r in range(perkQuantity):
            if i == 5:
                s = 8
            else:
                s = i
            try:
                if perkQuantity == 1:
                    lWeaponPerkHash = vendor[c]['Response']['itemComponents']['sockets']['data'][salesList[c][w + 2 - c]]['sockets'][s]['plugHash']
                else:
                    lWeaponPerkHash = vendor[c]['Response']['itemComponents']['reusablePlugs']['data'][salesList[c][w + 2 - c]]['plugs'][str(s)][r]['plugItemHash']
                lWeaponPerkData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponPerkHash) + "/?lc=ja", headers=headers).json()
                lWeaponPerkPath = lWeaponPerkData['Response']['displayProperties']['icon']
                lWeaponPerkName = lWeaponPerkData['Response']['displayProperties']['name']
                lWeaponPerkImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponPerkPath).content)).convert("RGBA").resize((80, 80), 1)
                baseImg.paste(lWeaponPerkImg, (85 + 105 * (i - 1) + shift_x, 480 + 93 * (r - 1) + shift_y), lWeaponPerkImg)
            except KeyError:
                # 起源特性が存在しなければpass
                pass
           
    # クラス剣専用のループ
    if salesList[0][w + 2] == '102' or c > 0:
        m = 13
        c += 1
    
    # 部位ごとにずらす
    if (w % 2) == 0:
        shift_x = 620
    else:
        shift_x = 0
        shift_y += 265 + perkMax * 85
        perkCount += perkMax
        perkMax = 1
    
    if w in [3, 5, 9] or w + 1 == m:
        if w + 1 == m and w % 2 == 0:
            perkCount += perkMax
        if isDaily:
            resImg = baseImg.crop((0, 0, 1280, 200 + 245 * math.ceil((w - 5 - (p - 1) * 4) / 2) + 90 * perkCount)).convert("RGB")
            resImg.save("./tmp/banshee_daily_legendary_weapon" + str(p) + ".jpg")
        else:
            resImg = baseImg.crop((0, 0, 1280, 200 + 245 * math.ceil((w + 1 - (p - 1) * 4) / 2) + 90 * perkCount)).convert("RGB")
            resImg.save("./tmp/banshee_weekly_legendary_weapon_" + str(p) + ".jpg")
        if w == 5:
            print("日替わり武器:")
            tweet.write("\nバンシー44が販売する日替わり武器は以下のようになっています。\n")
            isDaily = True
            p = 1
        else:
            p += 1
    
    w += 1

tweet.write("\n#Destiny2")
tweet.close()

print("\nツイート文と画像の生成完了。")