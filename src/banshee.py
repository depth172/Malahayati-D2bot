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
import math

def getBanshee():
    # 画像生成用のフォント定義
    fontN = ImageFont.truetype('./.font/GenEiGothicN-Regular.otf', 25)
    fontB0 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 28)
    fontB1 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 32)
    fontB2 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 40)
    fontTitle = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 55)
    logoImg = Image.open("./img/logo_full.png").resize((300, 46), 1)

    ### アクセスに必要なトークンを取得 ###

    auth.getBungieAccessToken()

    #### 基本データの取得 ####

    # ヘッダーにAPIキーとアクセストークンを設定
    headers = {"X-API-Key": os.getenv('B_API_KEY'),
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
                    return vendor[j]['ErrorCode']
            if i != 2:
                print("API取得に失敗しました。3秒後にリトライします…")
                sleep(3)
                continue
            else:
                print("APIが取得できませんでした。処理を中断します。")
                print("エラーコード - " + str(vendor[0]['ErrorCode']) + "\n" + vendor[0]['Message'])
                return vendor[0]['ErrorCode']
        else:
            break

    # 日付データの準備
    TimeZone = ZoneInfo("Asia/Tokyo")

    date = datetime.datetime.now(TimeZone)
    dateStr = date.strftime('%Y/%m/%d')

    tweetText = ""
    mediaList = []

    # 販売アイテムリストを生成
    # 0 = ハンター, 1 = タイタン, 2 = ウォーロック
    salesList = []
    salesList.append(list(vendor[0]['Response']['sales']['data'].keys()))
    salesList.append(list(vendor[1]['Response']['sales']['data'].keys()))
    salesList.append(list(vendor[2]['Response']['sales']['data'].keys()))

    # ツイート用の文章を整形

    # 日替わり武器の取得
    tweetText += "【 #バンシー 情報 / 毎日更新】" + dateStr + "\nバンシー44が販売する日替わり武器が以下のように更新されました。\n\n#Destiny2"
    print("日替わり武器:")

    ### 画像生成

    # c: 現在のキャラクターを記憶する変数(0: ハンター)
    # p: 画像のページ数
    # w: 現在取得中の武器が何番目か
    # m: 武器情報を取得する最大数
    c = 0
    p = 1
    w = 0
    m = 5
    
    formFeed = True
    hasClassSword = False
    perkMax = 1
    
    while w < m:
        # 改ページ時の処理
        if formFeed:
            # フォントと背景画像の準備
            resImg = io.BytesIO()

            # タイトルと日付挿入
            baseImg = Image.open("./img/banshee_daily_bg.jpg").convert("RGBA")
            draw = ImageDraw.Draw(baseImg)
            draw.multiline_text((33, 25), "今日のバンシー44", fill=(255, 255, 255), font=fontTitle)
            draw.multiline_text((523, 40), "(" + dateStr + ")", fill=(255, 255, 255), font=fontB2)
            draw.multiline_text((33, 125), "<日替わり武器>", fill=(255, 255, 255), font=fontB1)

            shift_x = 0
            shift_y = 0
            perkCount = 0
            
            formFeed = False

        # データ取得
        lWeaponHash = vendor[c]['Response']['sales']['data'][salesList[c][w + 2]]['itemHash']
        lWeaponData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponHash) + "/?lc=ja", headers=headers).json()
        lWeaponName = lWeaponData['Response']['displayProperties']['name']
        
        print("　" + lWeaponName)
        
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
        draw.multiline_text((195 + shift_x, 195 + shift_y), lWeaponName, fill=(255, 255, 255), font=fontB0)

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
            lWeaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/99f3733354862047493d8550e46a45ec.png").content)).convert("RGBA").resize((50, 50), 1)
        elif lWeaponData['Response']['equippingBlock']['ammoType'] == 2:
            lWeaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/d920203c4fd4571ae7f39eb5249eaecb.png").content)).convert("RGBA").resize((50, 50), 1)
        elif lWeaponData['Response']['equippingBlock']['ammoType'] == 3:
            lWeaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/78ef0e2b281de7b60c48920223e0f9b1.png").content)).convert("RGBA").resize((50, 50), 1)
        baseImg.paste(lWeaponAmmoImg, (190 + elementShift + shift_x, 227 + shift_y), lWeaponAmmoImg)

        ## 武器種挿入
        lWeaponArchName = lWeaponData['Response']['itemTypeDisplayName']
        draw.multiline_text((248 + elementShift + shift_x, 236 + shift_y), lWeaponArchName, fill=(255, 255, 255), font=fontN)

        ## 内在特性挿入
        # 画像挿入
        lWeaponFrameHash = lWeaponData['Response']['sockets']['socketEntries'][0]['singleInitialItemHash']
        lWeaponFrameData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponFrameHash) + "/?lc=ja", headers=headers).json()
        lWeaponFramePath = lWeaponFrameData['Response']['displayProperties']['icon']
        lWeaponFrameName = lWeaponFrameData['Response']['displayProperties']['name']
        lWeaponFrameImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponFramePath).content)).convert("RGBA")

        lWeaponFrameImg = lWeaponFrameImg.resize((80, 80), 1)
        baseImg.paste(lWeaponFrameImg, (85 + shift_x, 295 + shift_y), lWeaponFrameImg)
        draw.multiline_text((178 + shift_x, 317 + shift_y), lWeaponFrameName, fill=(255, 255, 255), font=fontB0)

        ## マスターワークアイコン挿入
        # パスから画像・ウォーターマークを取得
        try:
            lWeaponMWHash = vendor[c]['Response']['itemComponents']['reusablePlugs']['data'][salesList[c][w + 2]]['plugs']['7'][0]['plugItemHash']
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
        except KeyError:
            # マスターワークが存在しない場合はpass
            pass

        # パーク挿入
        for i in range(1, 6):
            try:
                perkQuantity = len(vendor[c]['Response']['itemComponents']['reusablePlugs']['data'][salesList[c][w + 2]]['plugs'][str(i)])
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
                        lWeaponPerkHash = vendor[c]['Response']['itemComponents']['sockets']['data'][salesList[c][w + 2]]['sockets'][s]['plugHash']
                    else:
                        lWeaponPerkHash = vendor[c]['Response']['itemComponents']['reusablePlugs']['data'][salesList[c][w + 2]]['plugs'][str(s)][r]['plugItemHash']
                    if lWeaponPerkHash not in [2302094943, 2931483505, 4248210736, 905869860]:
                        lWeaponPerkData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponPerkHash) + "/?lc=ja", headers=headers).json()
                        lWeaponPerkPath = lWeaponPerkData['Response']['displayProperties']['icon']
                        lWeaponPerkImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponPerkPath).content)).convert("RGBA").resize((80, 80), 1)
                        baseImg.paste(lWeaponPerkImg, (85 + 105 * (i - 1) + shift_x, 480 + 93 * (r - 1) + shift_y), lWeaponPerkImg)
                except KeyError:
                    # 起源特性が存在しなければpass
                    pass
            
        # クラス剣専用のループ ハンター剣のハッシュ(2782325300)が当たったら列を増やす
        if lWeaponHash == 2782325300:
            m += 2
            hasClassSword = True
            formFeed = True
        
        # 部位ごとにずらす
        if (w % 2) == 0:
            shift_x = 620
        else:
            shift_x = 0
            shift_y += 265 + perkMax * 85
            perkCount += perkMax
            perkMax = 1
        
        if w + 1 == m and w % 2 == 0:
            perkCount += perkMax
            imgHeight = 225 + 245 * math.ceil((w + 1 - (p - 1) * 4) / 2) + 90 * perkCount
            baseImg.paste(logoImg, (950, imgHeight - 66), logoImg)
            cropImg = baseImg.crop((0, 0, 1280, imgHeight)).convert("RGB")
            cropImg.save(resImg, format='JPEG')
            mediaList.append(tw.postImage(resImg.getvalue()))
                
            p += 1
        
        if hasClassSword == False:
            w += 1
        elif c == 2:
            c == 0
            hasClassSword = False
            w += 1
        else: 
            c += 1
        
    content = {"text": tweetText, "media": {"media_ids": mediaList}}
    tw.makeTweet(content)

    print("情報取得の全工程完了。")
    
    return 0