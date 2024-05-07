### ライブラリのインポート ###
# 認証関連
from dotenv import load_dotenv
import os
import src.auth as auth
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

def getEververse():
    ### アクセスに必要なトークンを取得 ###
    auth.getBungieAccessToken()

    #### 基本データの取得 ####
    # ヘッダーにAPIキーとアクセストークンを設定
    load_dotenv("../.env")
    headers = {"X-API-Key": os.getenv('B_API_KEY'),
            "Authorization": "Bearer " + os.environ["BAPI_ACCESS_TOKEN"]}

    # エバーバースの販売情報を取得
    # 取得成功可否も確認する
    # 0 = ハンター, 1 = タイタン, 2 = ウォーロック
    for i in range(3):
        vendor = []
        vendor.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009576344512/Vendors/3361454721/?components=401,402", headers=headers).json())
        vendor.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009576344511/Vendors/3361454721/?components=401,402", headers=headers).json())
        vendor.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009405135001/Vendors/3361454721/?components=401,402", headers=headers).json())
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

    startDate = datetime.datetime.now(TimeZone)
    startDateStr = startDate.strftime('%Y/%m/%d')

    endDate = startDate + datetime.timedelta(days = 8 - startDate.weekday())
    endDateStr = endDate.strftime('%Y/%m/%d')

    ### 販売アイテムリストを生成 ###
    ## 今週販売アイテムのインデックスを取得
    salesItemIndexes = []

    # 3キャラクター分のインデックスを同じ辞書に全部ぶちこむ
    for j in range(3):
        for i in [2, 11, 13]:
            salesItemIndexes += vendor[j]['Response']['categories']['data']['categories'][i]['itemIndexes']
    # 重複するアイテムを削除
    salesItemIndexes = list(set(salesItemIndexes))
    # 濃縮マッタージェム(Index: 769)とグリマーの破片(Index: 770)を削除
    salesItemIndexes.remove(769)
    salesItemIndexes.remove(770)

    ## インデックスからハッシュ番号を取得
    ## 値段表も同時に作成
    salesItemHashes = []
    itemCosts = {}

    # 3キャラクター分の販売アイテムを同じ辞書に全部ぶちこむ
    for j in range(3):
        for i in salesItemIndexes:
            try:
                itemHash = vendor[j]['Response']['sales']['data'][str(i)]['itemHash']
                salesItemHashes.append(itemHash)
                itemCosts[str(itemHash)] = itemHash = vendor[j]['Response']['sales']['data'][str(i)]['costs'][0]['quantity']
            except KeyError:
                pass
    # 重複するアイテムを削除
    salesItemHashes = list(set(salesItemHashes))

    ## 販売アイテムの実データを取得してリストにまとめる
    ## 仕分け辞書も同時に作成
    salesItems = {}
    itemOrder = {}
    for i in salesItemHashes:
        item = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(i) + "/?lc=ja", headers=headers).json()
        salesItems[str(i)] = item['Response']
        added = False
        for j in item['Response']['itemCategoryHashes']:
            if j not in [52, 56, 59, 3683250363, 3229540061, 3684181176]:
                if str(j) in itemOrder:
                    itemOrder[str(j)].append(str(i))
                else:
                    itemOrder[str(j)] = [str(i)]
                added = True
                break
        if not added:
            if '56' in itemOrder:
                itemOrder['56'].append(str(i))
            else:
                itemOrder['56'] = [str(i)]

    # 文字列出力
    print("販売アイテムリスト:")
    for i in itemOrder:
        category = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyItemCategoryDefinition/" + i + "/?lc=ja", headers=headers).json()
        print("　" + category['Response']['displayProperties']['name'] + ":")
        for j in itemOrder[i]:
            print("　　" + salesItems[j]['displayProperties']['name'])
    print("")

    # ツイート文章・画像の準備
    tweetText = ""
    mediaList = []

    # 画像生成用のフォント定義
    fontN = ImageFont.truetype('./.font/GenEiGothicN-Regular.otf', 25)
    fontN2 = ImageFont.truetype('./.font/GenEiGothicN-Regular.otf', 28)
    fontS = ImageFont.truetype('./.font/GenEiGothicN-Regular.otf', 20)
    fontB0 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 28)
    fontB1 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 32)
    fontB2 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 40)
    fontB3 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 50)
    fontTitle = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 55)
    logoImg = Image.open("./img/logo_full.png").resize((300, 46), 1)

    bdData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/2817410917", headers=headers).json()
    bdImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + bdData['Response']['displayProperties']['icon']).content)).resize((80, 80), 1)

    hasWeaponOrnaments = False
    hasEArmorOrnaments = False
    hasLArmorOrnaments = False

    # 武器装飾があるか確認、あれば画像化
    if '3124752623' in itemOrder:
        hasWeaponOrnaments = True
        # 背景画像の準備
        resImg = io.BytesIO()
        baseImg = Image.open("./img/eververse_bg.jpg").convert("RGBA")
        # タイトルと日付挿入
        draw = ImageDraw.Draw(baseImg)
        draw.multiline_text((33, 25), "今週のエバーバース", fill=(255, 255, 255), font=fontTitle)
        draw.multiline_text((550, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
        draw.multiline_text((33, 125), "<武器装飾>", fill=(255, 255, 255), font=fontB1)
        shift_y = -500
        
        for i in range(len(itemOrder['3124752623'])):
            shift_y += 500
            
            # 検索にかけるため、英語名を作る（装飾の説明文から武器名以外を切り落とす）
            weaponDataEng = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + itemOrder['3124752623'][i], headers=headers).json()
            weaponNameRaw = weaponDataEng['Response']['displayProperties']['description']
            weaponNameEng = weaponNameRaw[55:-77]
            print(weaponNameEng)
            
            searchRes = requests.get("https://www.bungie.net/Platform/Destiny2/Armory/Search/DestinyInventoryItemDefinition/" + weaponNameEng + "/", headers=headers).json()
            
            # 検索で得たアイテムが武器であり、今シーズンのもの、かつ新版でないか確認
            # indexを比較し、新しいほうを保存する
            newestWeaponData = 0
            for j in range(len(searchRes['Response']['results']['results'])):
                weaponHash = searchRes['Response']['results']['results'][j]['hash']
                weaponData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(weaponHash), headers=headers).json()
                print(weaponData['Response']['displayProperties']['name'])
                print(weaponData['Response']['itemCategoryHashes'])
                if "(Adept)" not in weaponData['Response']['displayProperties']['name'] and 1 in weaponData['Response']['itemCategoryHashes']:
                    if newestWeaponData == 0:
                        newestWeaponData = weaponData
                    elif weaponData['Response']['index'] > newestWeaponData['Response']['index']:
                        newestWeaponData = weaponData
        
            weaponHash = newestWeaponData['Response']['hash']
            weaponData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(weaponHash) + "/?lc=ja", headers=headers).json()
            print(weaponHash)

            ## 背景画像挿入
            # パスから画像を取得
            bgImgPath = salesItems[itemOrder['3124752623'][i]]['screenshot']
            bgImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + bgImgPath).content))
            bgMask = Image.open("./img/mask_ev.png").convert("L")
            # リサイズして挿入
            bgImg = bgImg.resize((764, 430), 1)
            baseImg.paste(bgImg, (471, 180 + shift_y), bgMask)
            
            ## 装飾アイコン挿入
            # パスから画像・ウォーターマークを取得
            ornamentImgPath = salesItems[itemOrder['3124752623'][i]]['displayProperties']['icon']
            ornamentWMPath = salesItems[itemOrder['3124752623'][i]]['iconWatermark']
            ornamentBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + ornamentImgPath).content))
            ornamentBaseImg.putalpha(255)
            ornamentWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + ornamentWMPath).content)).convert("RGBA")
            # 武器画像とウォーターマークを合成
            ornamentImg = Image.alpha_composite(ornamentBaseImg, ornamentWM)
            # リサイズして挿入
            ornamentImg = ornamentImg.resize((100, 100), 1)
            baseImg.paste(ornamentImg, (75, 180 + shift_y))
            ## 装飾名挿入
            ornamentName = salesItems[itemOrder['3124752623'][i]]['displayProperties']['name']
            draw.multiline_text((195, 205 + shift_y), ornamentName, fill=(255, 255, 255), font=fontB2)
            
            ## 武器アイコン挿入
            # パスから画像・ウォーターマークを取得
            draw.multiline_text((60, 330 + shift_y), "[装備可能武器]", fill=(255, 255, 255), font=fontS)
            weaponImgPath = weaponData['Response']['displayProperties']['icon']
            weaponWMPath = weaponData['Response']['quality']['displayVersionWatermarkIcons'][-1]
            weaponBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + weaponImgPath).content))
            weaponBaseImg.putalpha(255)
            weaponWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + weaponWMPath).content)).convert("RGBA")
            # 武器画像とウォーターマークを合成
            weaponImg = Image.alpha_composite(weaponBaseImg, weaponWM)
            # リサイズして挿入
            weaponImg = weaponImg.resize((80, 80), 1)
            baseImg.paste(weaponImg, (85, 360 + shift_y))
            ## 武器名挿入
            weaponName = weaponData['Response']['displayProperties']['name']
            draw.multiline_text((180, 367 + shift_y), weaponName, fill=(255, 255, 255), font=fontN2)
            ## 武器種挿入
            weaponArchName = weaponData['Response']['itemTypeDisplayName']
            draw.multiline_text((180, 409 + shift_y), weaponArchName, fill=(255, 255, 255), font=fontS)
            
            ## 価格挿入
            draw.multiline_text((50, 492 + shift_y), "価格", fill=(255, 255, 255), font=fontN)
            baseImg.paste(bdImg, (85, 529 + shift_y), bdImg)
            itemCost = itemCosts[itemOrder['3124752623'][i]]
            draw.multiline_text((190, 537 + shift_y), f'{itemCost:,}', fill=(255, 255, 255), font=fontB3)
        
        itemOrder.pop('3124752623')
        
        baseImg.paste(logoImg, (930, 640 + shift_y), logoImg)
        cropImg = baseImg.crop((0, 0, 1280, 720 + shift_y)).convert("RGB")
        
        cropImg.save(resImg, format='JPEG')
        mediaList.append(tw.postImage(resImg.getvalue())) 

    # エキゾチック防具装飾があるか確認、あれば画像化
    if '1742617626' in itemOrder:
        hasEArmorOrnaments = True
        # 背景画像の準備
        resImg = io.BytesIO()
        baseImg = Image.open("./img/eververse_bg.jpg").convert("RGBA")
        # タイトルと日付挿入
        draw = ImageDraw.Draw(baseImg)
        draw.multiline_text((33, 25), "今週のエバーバース", fill=(255, 255, 255), font=fontTitle)
        draw.multiline_text((550, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
        draw.multiline_text((33, 125), "<エキゾチック防具装飾>", fill=(255, 255, 255), font=fontB1)
        shift_y = -500
        
        for i in range(len(itemOrder['1742617626'])):
            shift_y += 500

            # 検索にかけるため、英語名を作る（装飾の説明文から武器名以外を切り落とす）
            armorDataEng = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + itemOrder['3124752623'][i], headers=headers).json()
            armorNameRaw = armorDataEng['Response']['displayProperties']['description']
            armorNameEng = armorNameRaw[54:-1]
            
            searchRes = requests.get("https://www.bungie.net/Platform/Destiny2/Armory/Search/DestinyInventoryItemDefinition/" + armorNameEng + "/", headers=headers).json()
            
            # indexを比較し、新しいほうを保存する
            for j in range(len(searchRes['Response']['results']['results'])):
                armorHash = searchRes['Response']['results']['results'][j]['hash']
                armorData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(armorHash), headers=headers).json()
                if j == 0 or (armorData['Response']['index'] > newestArmorData['Response']['index']):
                    newestArmorData = armorData
        
            armorHash = newestArmorData['Response']['hash']
            armorData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(armorHash) + "/?lc=ja", headers=headers).json()

            ## 背景画像挿入
            # パスから画像を取得
            bgImgPath = salesItems[itemOrder['1742617626'][i]]['screenshot']
            bgImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + bgImgPath).content))
            bgMask = Image.open("./img/mask_ev.png").convert("L")
            # リサイズして挿入
            bgImg = bgImg.resize((764, 430), 1)
            baseImg.paste(bgImg, (471, 180 + shift_y), bgMask)
            
            ## 装飾アイコン挿入
            # パスから画像・ウォーターマークを取得
            ornamentImgPath = salesItems[itemOrder['1742617626'][i]]['displayProperties']['icon']
            ornamentWMPath = salesItems[itemOrder['1742617626'][i]]['iconWatermark']
            ornamentBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + ornamentImgPath).content))
            ornamentBaseImg.putalpha(255)
            ornamentWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + ornamentWMPath).content)).convert("RGBA")
            # 武器画像とウォーターマークを合成
            ornamentImg = Image.alpha_composite(ornamentBaseImg, ornamentWM)
            # リサイズして挿入
            ornamentImg = ornamentImg.resize((100, 100), 1)
            baseImg.paste(ornamentImg, (75, 180 + shift_y))
            ## 装飾名挿入
            ornamentName = salesItems[itemOrder['1742617626'][i]]['displayProperties']['name']
            draw.multiline_text((195, 205 + shift_y), ornamentName, fill=(255, 255, 255), font=fontB2)
            ## 装飾種挿入
            ornamentSpec = salesItems[itemOrder['1742617626'][i]]['itemTypeDisplayName']
            draw.multiline_text((75, 380 + shift_y), ornamentSpec, fill=(255, 255, 255), font=fontB1)
            
            ## 防具アイコン挿入
            # パスから画像・ウォーターマークを取得
            draw.multiline_text((60, 330 + shift_y), "[装備可能防具]", fill=(255, 255, 255), font=fontS)
            armorImgPath = armorData['Response']['displayProperties']['icon']
            armorWMPath = armorData['Response']['quality']['displayVersionWatermarkIcons'][-1]
            armorBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + armorImgPath).content))
            armorBaseImg.putalpha(255)
            armorWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + armorWMPath).content)).convert("RGBA")
            # 防具画像とウォーターマークを合成
            armorImg = Image.alpha_composite(armorBaseImg, armorWM)
            # リサイズして挿入
            armorImg = armorImg.resize((80, 80), 1)
            baseImg.paste(armorImg, (85, 360 + shift_y))
            ## 防具名挿入
            armorName = armorData['Response']['displayProperties']['name']
            draw.multiline_text((180, 367 + shift_y), armorName, fill=(255, 255, 255), font=fontN2)
            ## 防具種挿入
            armorArchName = armorData['Response']['itemTypeDisplayName']
            draw.multiline_text((180, 409 + shift_y), armorArchName, fill=(255, 255, 255), font=fontS)
            
            ## 価格挿入
            draw.multiline_text((50, 492 + shift_y), "価格", fill=(255, 255, 255), font=fontN)
            baseImg.paste(bdImg, (85, 529 + shift_y), bdImg)
            itemCost = itemCosts[itemOrder['1742617626'][i]]
            draw.multiline_text((190, 537 + shift_y), f'{itemCost:,}', fill=(255, 255, 255), font=fontB3)
        
        itemOrder.pop('1742617626')
        
        baseImg.paste(logoImg, (930, 640 + shift_y), logoImg)
        cropImg = baseImg.crop((0, 0, 1280, 720 + shift_y)).convert("RGB")
        
        cropImg.save(resImg, format='JPEG')
        mediaList.append(tw.postImage(resImg.getvalue()))

    # レジェンダリー防具装飾があるか確認、あれば画像化
    if '56' in itemOrder:
        hasLArmorOrnaments = True
        # 背景画像の準備
        resImg = io.BytesIO()
        baseImg = Image.open("./img/eververse_bg.jpg").convert("RGBA")
        # タイトルと日付挿入
        draw = ImageDraw.Draw(baseImg)
        draw.multiline_text((33, 25), "今週のエバーバース", fill=(255, 255, 255), font=fontTitle)
        draw.multiline_text((550, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
        draw.multiline_text((33, 125), "<レジェンダリー防具装飾>", fill=(255, 255, 255), font=fontB1)
        shift_y = -500
        
        for i in range(len(itemOrder['56'])):
            shift_y += 500
            
            ## 背景画像挿入
            # パスから画像を取得
            bgImgPath = salesItems[itemOrder['56'][i]]['screenshot']
            bgImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + bgImgPath).content))
            bgMask = Image.open("./img/mask_ev.png").convert("L")
            # リサイズして挿入
            bgImg = bgImg.resize((764, 430), 1)
            baseImg.paste(bgImg, (471, 180 + shift_y), bgMask)
            
            ## 装飾アイコン挿入
            # パスから画像・ウォーターマークを取得
            ornamentImgPath = salesItems[itemOrder['56'][i]]['displayProperties']['icon']
            ornamentWMPath = salesItems[itemOrder['56'][i]]['iconWatermark']
            ornamentBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + ornamentImgPath).content))
            ornamentBaseImg.putalpha(255)
            ornamentWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + ornamentWMPath).content)).convert("RGBA")
            # 武器画像とウォーターマークを合成
            ornamentImg = Image.alpha_composite(ornamentBaseImg, ornamentWM)
            # リサイズして挿入
            ornamentImg = ornamentImg.resize((100, 100), 1)
            baseImg.paste(ornamentImg, (75, 180 + shift_y))
            ## 装飾名挿入
            ornamentName = salesItems[itemOrder['56'][i]]['displayProperties']['name']
            draw.multiline_text((195, 205 + shift_y), ornamentName, fill=(255, 255, 255), font=fontB2)
            ## 装飾種挿入
            ornamentSpec = salesItems[itemOrder['56'][i]]['itemTypeDisplayName']
            draw.multiline_text((75, 372 + shift_y), ornamentSpec, fill=(255, 255, 255), font=fontB1)
            
            ## 価格挿入
            draw.multiline_text((50, 492 + shift_y), "価格", fill=(255, 255, 255), font=fontN)
            baseImg.paste(bdImg, (85, 529 + shift_y), bdImg)
            itemCost = itemCosts[itemOrder['56'][i]]
            draw.multiline_text((190, 537 + shift_y), f'{itemCost:,}', fill=(255, 255, 255), font=fontB3)
        
        itemOrder.pop('56')
        
        baseImg.paste(logoImg, (930, 640 + shift_y), logoImg)
        cropImg = baseImg.crop((0, 0, 1280, 720 + shift_y)).convert("RGB")
        
        cropImg.save(resImg, format='JPEG')
        mediaList.append(tw.postImage(resImg.getvalue()))

    # その他アイテムを画像化
    # フォントと背景画像の準備
    resImg = io.BytesIO()
    # タイトルと日付挿入
    baseImg = Image.open("./img/eververse_bg.jpg").convert("RGBA")
    draw = ImageDraw.Draw(baseImg)
    draw.multiline_text((33, 25), "今週のエバーバース", fill=(255, 255, 255), font=fontTitle)
    draw.multiline_text((550, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
    shift_x = 0
    shift_y = 0
    bdImg = bdImg.resize((30, 30), 1)

    for i in itemOrder:
        category = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyItemCategoryDefinition/" + i + "/?lc=ja", headers=headers).json()
        draw.multiline_text((33, 125 + shift_y), "<" + category['Response']['displayProperties']['name'] + ">", fill=(255, 255, 255), font=fontB1)
        
        for j in itemOrder[i]:
            ## アイコン挿入
            # パスから画像・ウォーターマークを取得
            iconImgPath = salesItems[j]['displayProperties']['icon']
            iconBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + iconImgPath).content))
            iconBaseImg.putalpha(255)
            try:
                iconWMPath = salesItems[j]['iconWatermark']
                iconWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + iconWMPath).content)).convert("RGBA")
                # 武器画像とウォーターマークを合成
                iconImg = Image.alpha_composite(iconBaseImg, iconWM)
            except KeyError:
                iconImg = iconBaseImg
            # リサイズして挿入
            iconImg = iconImg.resize((100, 100), 1)
            baseImg.paste(iconImg, (75 + shift_x, 180 + shift_y))
            
            ## 武器名挿入
            itemName = salesItems[j]['displayProperties']['name']
            draw.multiline_text((195 + shift_x, 195 + shift_y), itemName, fill=(255, 255, 255), font=fontB0)
            
            ## 価格挿入
            draw.multiline_text((195 + shift_x, 236 + shift_y), "価格:", fill=(255, 255, 255), font=fontN)
            baseImg.paste(bdImg, (263 + shift_x, 238 + shift_y), bdImg)
            itemCost = itemCosts[j]
            draw.multiline_text((303 + shift_x, 235 + shift_y), f'{itemCost:,}', fill=(255, 255, 255), font=fontB0)

            # 部位ごとにずらす
            if shift_x == 0:
                shift_x = 620
            else:
                shift_x = 0
                shift_y += 120
        
        if shift_x != 0:
            shift_x = 0
            shift_y += 180
        else:
            shift_y += 60

    baseImg.paste(logoImg, (930, 140 + shift_y), logoImg)
    cropImg = baseImg.crop((0, 0, 1280, 220 + shift_y)).convert("RGB")
    cropImg.save(resImg, format='JPEG')

    mediaList.append(tw.postImage(resImg.getvalue()))

    # ツイート用の文章を整形
    tweetText = "【 #エバーバース 情報】" + startDateStr + "\n今週のエバーバースでは、以下のアイテムがブライトダストで販売しています。"

    if hasWeaponOrnaments or hasLArmorOrnaments or hasEArmorOrnaments:
        tweetText += "\n今週は、"
        if hasWeaponOrnaments:
            tweetText += "武器装飾"
        if hasEArmorOrnaments:
            if hasWeaponOrnaments:
                tweetText += "、"
            tweetText += "エキゾチック防具装飾"
        if hasLArmorOrnaments:
            if hasWeaponOrnaments or hasEArmorOrnaments:
                tweetText += "、"
            tweetText += "レジェンダリー防具装飾"
        tweetText += "の取り扱いがあります。お買い忘れにご注意ください。"

    tweetText += "\n\n#Destiny2"

    # ツイートする
    content = {"text": tweetText, "media": {"media_ids": mediaList}}
    tw.makeTweet(content)

    print("\n情報取得の全工程完了。")
    
    return 0