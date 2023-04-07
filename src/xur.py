### ライブラリのインポート ###
# 認証関連
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
import textwrap
import math

def getXur():
    # 頻出する辞書とリストの定義
    statsTable = ['2996146975', '392767087', '1943323491', '1735777505', '144602215', '4244567218']
    weaponStatsTable = ['1240592695', '155624089', '943549884', '4188031367']
    classDict = {0: "ハンター", 1:"タイタン", 2:"ウォーロック"}
    classDictEn = {0: "hunter", 1:"titan", 2:"warlock"}
    partsOrder = [17, 14, 15, 18, 16]

    # 画像生成用のフォント定義
    fontN = ImageFont.truetype('./.font/GlowSansSC-Normal-Medium.otf', 25)
    fontB0 = ImageFont.truetype('./.font/GlowSansSC-Normal-Bold.otf', 28)
    fontB1 = ImageFont.truetype('./.font/GlowSansSC-Normal-Bold.otf', 32)
    fontB2 = ImageFont.truetype('./.font/GlowSansSC-Normal-Bold.otf', 40)
    fontB3 = ImageFont.truetype('./.font/GlowSansSC-Normal-Bold.otf', 45)
    fontTitle = ImageFont.truetype('./.font/GlowSansSC-Normal-Bold.otf', 55)

    ### アクセスに必要なトークンを取得 ###

    auth.getBungieAccessToken()

    #### 基本データの取得 ####

    # ヘッダーにAPIキーとアクセストークンを設定
    headers = {"X-API-Key": os.getenv('B_API_KEY'),
               "Authorization": "Bearer " + os.environ["BAPI_ACCESS_TOKEN"]}

    # シュールに関する情報を取得
    # 取得成功可否も確認する
    # 0 = ハンター, 1 = タイタン, 2 = ウォーロック
    for i in range(3):
        vendor = []
        vendor.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009576344512/Vendors/2190858386/?components=402,400,304,302,305,310", headers=headers).json())
        vendor.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009576344511/Vendors/2190858386/?components=402,400,304,302,305,310", headers=headers).json())
        vendor.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009405135001/Vendors/2190858386/?components=402,400,304,302,305,310", headers=headers).json())
        if ('Response' not in vendor[0]) or ('Response' not in vendor[1]) or ('Response' not in vendor[2]):
            for j in range(3):
                if vendor[j]['ErrorCode'] == 1627:
                    print("現在シュールは出現していません。処理を中断します。")
                    return vendor[j]['ErrorCode']
                if vendor[j]['ErrorCode'] == 5:
                    print("現在APIサービスはメンテナンス中です。処理を中断します。")
                    return vendor[j]['ErrorCode']
            if i != 2:
                print("API取得に失敗しました。3秒後にリトライします…")
                sleep(3)
                continue
            else:
                print("APIが取得できませんでした。処理を中断します。")
                print("エラーコード - " + str(vendor[0]['ErrorCode']) + "\n" + vendor[j]['Message'])
                return vendor[0]['ErrorCode']
        else:
            break

    # 日付データの準備
    startDate = datetime.datetime.now()
    endDate = startDate + datetime.timedelta(days=3)
    startDateStr = startDate.strftime('%Y/%m/%d')
    endDateStr = endDate.strftime('%Y/%m/%d')

    tweetText = ""
    mediaList = []

    ## 場所の判定

    location = vendor[0]['Response']['vendor']['data']['vendorLocationIndex']
    if (location == 0) :
        locationText = 'タワー，ハンガー'
        baseImg = Image.open("./img/xur_tower.jpg").convert("RGBA")
    elif (location == 1) :
        locationText = 'EDZ，屈曲の細道'
        baseImg = Image.open("./img/xur_edz.jpg").convert("RGBA")
    elif (location == 2) :
        locationText = 'ネッスス，監視者の墓'
        baseImg = Image.open("./img/xur_nessus.jpg").convert("RGBA")
    resImg = io.BytesIO()
    draw = ImageDraw.Draw(baseImg)

    draw.multiline_text((30, 25), "今週のシュール", fill=(255, 255, 255), font=fontTitle)

    draw.multiline_text((430, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
    draw.multiline_text((30, 120), "<出現位置>", fill=(255, 255, 255), font=fontB1)

    draw.text((1240, 580), locationText, fill=(255, 255, 255), anchor="rt", font=fontTitle)
    draw.text((1240, 660), "▼アイテム詳細はツリーを確認", fill=(255, 255, 255), anchor="rt", font=fontB0)

    tweetText += "【ベンダー情報】\n今日は土曜日です。シュールが “" + locationText + "” にて出没していることが確認されています。\n\n#Destiny2"

    # 表示（テスト用）
    print("シュールの現在位置: " + locationText + "\n")

    cropImg = baseImg.crop((0, 0, 1280, 720)).convert("RGB")
    cropImg.save(resImg, format='JPEG')
    mediaList.append(tw.postImage(resImg.getvalue()))
    content = {"text": tweetText, "media": {"media_ids": mediaList}}
    recentTweet = tw.makeThread(content)
    mediaList = []

    # 販売アイテムリストを生成
    # 0 = ハンター, 1 = タイタン, 2 = ウォーロック
    salesList = []
    salesList.append(list(vendor[0]['Response']['sales']['data'].keys()))
    salesList.append(list(vendor[1]['Response']['sales']['data'].keys()))
    salesList.append(list(vendor[2]['Response']['sales']['data'].keys()))

    #### エキゾチック武器 ####
    tweetText = "＜エキゾチック装備＞\n\n"

    eWeaponHash = vendor[0]['Response']['sales']['data'][salesList[0][1]]['itemHash']
    eWeaponData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(eWeaponHash) + "/?lc=ja", headers=headers).json()

    ## データを文字列に変換
    eWeaponName = eWeaponData['Response']['displayProperties']['name']

    # 表示（テスト用）
    print("エキゾチック武器: " + eWeaponName)
    print("")
    tweetText += "武器　　　　: " + eWeaponName + "\n"

    ### エキゾチック武器の画像生成 ###

    ## 背景画像の準備
    baseImg = Image.open("./img/xur_bg.jpg").convert("RGBA")
    resImg = io.BytesIO()
    draw = ImageDraw.Draw(baseImg)

    ## タイトルと日付挿入
    draw.multiline_text((30, 25), "今週のシュール", fill=(255, 255, 255), font=fontTitle)

    startDate = datetime.datetime.now()
    endDate = startDate + datetime.timedelta(days=3)
    startDateStr = startDate.strftime('%Y/%m/%d')
    endDateStr = endDate.strftime('%Y/%m/%d')

    draw.multiline_text((430, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
    draw.multiline_text((30, 120), "<エキゾチック武器>", fill=(255, 255, 255), font=fontB1)

    ## 武器アイコン挿入
    # パスから画像を取得
    eWeaponImgPath = eWeaponData['Response']['displayProperties']['icon']
    eWeaponWMPath = eWeaponData['Response']['quality']['displayVersionWatermarkIcons'][0]
    eWeaponBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + eWeaponImgPath).content))
    eWeaponBaseImg.putalpha(255)
    eWeaponWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + eWeaponWMPath).content)).convert("RGBA")
    # 武器画像とウォーターマークを合成
    eWeaponImg = Image.alpha_composite(eWeaponBaseImg, eWeaponWM)
    # リサイズして挿入
    eWeaponImg = eWeaponImg.resize((150, 150), 1)
    baseImg.paste(eWeaponImg, (50, 185))

    ## 武器名挿入
    draw.multiline_text((230, 190), eWeaponName, fill=(255, 255, 255), font=fontB3)

    ## 属性アイコン挿入
    eWeaponElemHash = eWeaponData['Response']['damageTypeHashes'][0]
    hasElement = False
    if eWeaponElemHash != 3373582085:
        hasElement = True
        eWeaponElemData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyDamageTypeDefinition/" + str(eWeaponElemHash) + "/?lc=ja", headers=headers).json()
        eWeaponElemPath = eWeaponElemData['Response']['displayProperties']['icon']
        eWeaponElemImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + eWeaponElemPath).content)).convert("RGBA").resize((40, 40), 1)
        baseImg.paste(eWeaponElemImg, (235, 277), eWeaponElemImg)
        
    ## 武器種挿入
    eWeaponArchName = eWeaponData['Response']['itemTypeDisplayName']
    # 属性アイコンがある場合は間隔を空ける
    if hasElement == True:
        draw.multiline_text((290, 270), eWeaponArchName, fill=(255, 255, 255), font=fontB1)
    else:
        draw.multiline_text((230, 270), eWeaponArchName, fill=(255, 255, 255), font=fontB1)

    ## 内在特性挿入
    # 画像挿入
    eWeaponInstHash = eWeaponData['Response']['sockets']['socketEntries'][0]['singleInitialItemHash']
    eWeaponInstData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(eWeaponInstHash) + "/?lc=ja", headers=headers).json()
    eWeaponInstPath = eWeaponInstData['Response']['displayProperties']['icon']
    eWeaponInstImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + eWeaponInstPath).content)).convert("RGBA")

    eWeaponInstImg = eWeaponInstImg.resize((100, 100), 1)
    baseImg.paste(eWeaponInstImg, (60, 365), eWeaponInstImg)

    ## 特性名・説明文挿入
    eWeaponInstName = eWeaponInstData['Response']['displayProperties']['name']
    draw.multiline_text((180, 360), eWeaponInstName, fill=(255, 255, 255), font=fontB1)
    eWeaponInstDesc = eWeaponInstData['Response']['displayProperties']['description']
    eWeaponInstDesc = eWeaponInstDesc.replace("[代替武器アクション]を:", "[リロード]を長押しすると、")
    eWeaponInstDesc = eWeaponInstDesc.replace("を: ", "を押すと")
    # 長い場合は改行を入れる
    if eWeaponInstDesc.count("\n", 0, 42) == 0:
        eWeaponInstDesc = textwrap.fill(eWeaponInstDesc, 42)
    draw.multiline_text((180, 425), eWeaponInstDesc, fill=(255, 255, 255), font=fontN)
    # 改行回数をカウント（パーク一覧を下にずらすため）
    cl = eWeaponInstDesc.count('\n')

    ## パーク挿入
    eWeaponPerkList = list(eWeaponData['Response']['sockets']['socketCategories'][1]['socketIndexes'])
    for i in range(len(eWeaponPerkList) - 1):
        eWeaponPerkHash = eWeaponData['Response']['sockets']['socketEntries'][eWeaponPerkList[i]]['singleInitialItemHash']
        eWeaponPerkData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(eWeaponPerkHash) + "/?lc=ja", headers=headers).json()
        eWeaponPerkPath = eWeaponPerkData['Response']['displayProperties']['icon']
        eWeaponPerkImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + eWeaponPerkPath).content)).convert("RGBA")

        eWeaponPerkImg = eWeaponPerkImg.resize((80, 80), 1)
        baseImg.paste(eWeaponPerkImg, (60 + 110 * i, 500 + 22 * cl), eWeaponPerkImg)
        # 3列目のパークのみ、パーク名と説明文を挿入
        if i == 2:
            eWeaponInstPerkName = eWeaponPerkData['Response']['displayProperties']['name']
            draw.multiline_text((520, 500 + 22 * cl), eWeaponInstPerkName, fill=(255, 255, 255), font=fontB1)
            eWeaponInstPerkDesc = eWeaponPerkData['Response']['displayProperties']['description']
            eWeaponInstPerkDesc = eWeaponInstPerkDesc.replace("[代替武器アクション]を: ", "[リロード]を長押しすると、")
            eWeaponInstPerkDesc = eWeaponInstPerkDesc.replace("を: ", "を押すと、")
            if eWeaponInstPerkDesc.count("\n", 0, 29) == 0:
                eWeaponInstPerkDesc = textwrap.fill(eWeaponInstPerkDesc, 29)
            draw.multiline_text((520, 545 + 22 * cl), eWeaponInstPerkDesc, fill=(255, 255, 255), font=fontN)

    cropImg = baseImg.crop((0, 0, 1280, 720)).convert("RGB")
    cropImg.save(resImg, format='JPEG')
    mediaList.append(tw.postImage(resImg.getvalue()))

    #### 販売しているエキゾチック防具の取得と画像生成 ###
    for c in range(3):
        ### データ取得
        eArmorHash = vendor[0]['Response']['sales']['data'][salesList[0][c + 4]]['itemHash']
        eArmorData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(eArmorHash) + "/?lc=ja", headers=headers).json()
        # データを文字列に変換
        eArmorName = eArmorData['Response']['displayProperties']['name']
        print("エキゾチック防具（" + classDict[c] + "）: " + eArmorName)
        tweetText += classDict[c]
        if c in [0, 1]:
            tweetText += "　　"
        tweetText += ": " + eArmorName + "\n"

        ### 画像生成
        # フォントと背景画像の準備
        baseImg = Image.open("./img/xur_bg.jpg").convert("RGBA")
        resImg = io.BytesIO()
        draw = ImageDraw.Draw(baseImg)
        # タイトルと日付挿入
        draw.multiline_text((30, 25), "今週のシュール", fill=(255, 255, 255), font=fontTitle)
        draw.multiline_text((430, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
        draw.multiline_text((30, 120), "<エキゾチック防具 - " + classDict[c] + ">", fill=(255, 255, 255), font=fontB1)

        ## 防具アイコン挿入
        # パスから画像・ウォーターマークを取得
        eArmorImgPath = eArmorData['Response']['displayProperties']['icon']
        eArmorWMPath = eArmorData['Response']['quality']['displayVersionWatermarkIcons'][0]
        eArmorBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + eArmorImgPath).content))
        eArmorBaseImg.putalpha(255)
        eArmorWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + eArmorWMPath).content)).convert("RGBA")
        # 武器画像とウォーターマークを合成
        eArmorImg = Image.alpha_composite(eArmorBaseImg, eArmorWM)
        # リサイズして挿入
        eArmorImg = eArmorImg.resize((150, 150), 1)
        baseImg.paste(eArmorImg, (50, 185))

        ## 防具名挿入
        draw.multiline_text((230, 190), eArmorName, fill=(255, 255, 255), font=fontB3)

        ## 防具種挿入
        eArmorArchName = eArmorData['Response']['itemTypeDisplayName']
        draw.multiline_text((230, 270), eArmorArchName, fill=(255, 255, 255), font=fontB1)

        ## 内在特性挿入
        # 画像挿入
        eArmorInstHash = eArmorData['Response']['sockets']['socketEntries'][11]['singleInitialItemHash']
        eArmorInstData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(eArmorInstHash) + "/?lc=ja", headers=headers).json()
        eArmorInstPath = eArmorInstData['Response']['displayProperties']['icon']
        eArmorInstImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + eArmorInstPath).content)).convert("RGBA")

        eArmorInstImg = eArmorInstImg.resize((100, 100), 1)
        baseImg.paste(eArmorInstImg, (60, 365), eArmorInstImg)

        ## 特性名・説明文挿入
        eArmorInstName = eArmorInstData['Response']['displayProperties']['name']
        draw.multiline_text((180, 360), eArmorInstName, fill=(255, 255, 255), font=fontB1)
        eArmorInstDesc = eArmorInstData['Response']['displayProperties']['description']
        # 長い場合は改行を入れる
        if eArmorInstDesc.count("\n", 0, 19) == 0:
            eArmorInstDesc = textwrap.fill(eArmorInstDesc, 19)
        draw.multiline_text((180, 410), eArmorInstDesc, fill=(255, 255, 255), font=fontN)
        
        ## ステータスグラフ挿入
        eArmorStats = vendor[0]['Response']['itemComponents']['stats']['data'][salesList[0][c + 4]]['stats']

        draw.multiline_text((720, 360), "防具のステータス値", fill=(255, 255, 255), font=fontB1)
        draw.line(((715, 415), (1235, 415)), (255, 255, 255), 2)
        statsTotal = 0
        for s in range(6):
            draw.rectangle((895, 435 + 50 * s, 1225, 465 + 50 * s), fill=(32, 32, 32))
            draw.rectangle((895, 435 + 50 * s, 895 + (330 * (eArmorStats[statsTable[s]]['value'] / 42)), 465 + 50 * s), fill=(255, 255, 255))
            if (len(str(eArmorStats[statsTable[s]]['value'])) == 1):
                draw.multiline_text((867, 431 + 50 * s), str(eArmorStats[statsTable[s]]['value']), fill=(255, 255, 255), font=fontN)
            else:
                draw.multiline_text((855, 431 + 50 * s), str(eArmorStats[statsTable[s]]['value']), fill=(255, 255, 255), font=fontN)
            statData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyStatDefinition/" + statsTable[s] + "/?lc=ja", headers=headers).json()
            statPath = statData['Response']['displayProperties']['icon']
            draw.multiline_text((722, 431 + 50 * s), statData['Response']['displayProperties']['name'], fill=(255, 255, 255), font=fontN)
            statImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + statPath).content)).convert("RGBA").resize((36, 36), 1)
            baseImg.paste(statImg, (808, 433 + 50 * s), statImg)
            statsTotal += eArmorStats[statsTable[s]]['value']
        draw.multiline_text((722, 737), "合計", fill=(255, 255, 255), font=fontN)
        draw.multiline_text((845, 730), str(statsTotal), fill=(255, 255, 255), font=fontB1)
        
        cropImg = baseImg.crop((0, 0, 1280, 820)).convert("RGB")
        cropImg.save(resImg, format='JPEG')
        mediaList.append(tw.postImage(resImg.getvalue()))

    content = {"text": tweetText, "media": {"media_ids": mediaList}}
    recentTweet = tw.makeThread(content, recentTweet)
    mediaList = []

    print("")

    #### ホークムーン、デッドマンズテイルのパークの取得 ####
    tweetText = "＜週替わりパーク武器＞\n"
    
    for w in range(31, 33):
        epHash = vendor[0]['Response']['sales']['data'][str(w)]['itemHash']
        epData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(epHash) + "/?lc=ja", headers=headers).json()
        
        # 背景画像の準備
        baseImg = Image.open("./img/xur_bg.jpg").convert("RGBA")
        resImg = io.BytesIO()
        draw = ImageDraw.Draw(baseImg)

        # タイトルと日付挿入
        draw.multiline_text((30, 25), "今週のシュール", fill=(255, 255, 255), font=fontTitle)
        draw.multiline_text((430, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
        draw.multiline_text((30, 120), "<週替わりパークのエキゾチック武器>", fill=(255, 255, 255), font=fontB1)

        ## 武器画像挿入
        # パスから画像を取得
        epImgPath = epData['Response']['displayProperties']['icon']
        epWMPath = epData['Response']['quality']['displayVersionWatermarkIcons'][0]
        epBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + epImgPath).content))
        epBaseImg.putalpha(255)
        epWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + epWMPath).content)).convert("RGBA")
        # 武器画像とウォーターマークを合成
        epImg = Image.alpha_composite(epBaseImg, epWM)
        # リサイズして挿入
        epImg = epImg.resize((120, 120), 1)
        baseImg.paste(epImg, (50, 185))

        ## 武器名挿入
        epName = epData['Response']['displayProperties']['name']
        draw.multiline_text((210, 180), epName, fill=(255, 255, 255), font=fontB3)
            
        ## 武器種挿入
        epArchName = epData['Response']['itemTypeDisplayName']
        draw.multiline_text((210, 250), epArchName, fill=(255, 255, 255), font=fontB1)

        ## 内在特性挿入
        # 画像挿入
        epInstHash = epData['Response']['sockets']['socketEntries'][0]['singleInitialItemHash']
        epInstData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(epInstHash) + "/?lc=ja", headers=headers).json()
        epInstPath = epInstData['Response']['displayProperties']['icon']
        epInstImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + epInstPath).content)).convert("RGBA")

        epInstImg = epInstImg.resize((100, 100), 1)
        baseImg.paste(epInstImg, (60, 335), epInstImg)
        
        ## 特性名・説明文挿入
        epInstName = epInstData['Response']['displayProperties']['name']
        draw.multiline_text((180, 358), epInstName, fill=(255, 255, 255), font=fontB1)

        # パーク挿入
        print(epName + ":")
        tweetText += epName + ":\n"
        for i in range(1, 5):
            epPerkHash = vendor[0]['Response']['itemComponents']['sockets']['data'][str(w)]['sockets'][i]['plugHash']
            epPerkData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(epPerkHash) + "/?lc=ja", headers=headers).json()
            epPerkPath = epPerkData['Response']['displayProperties']['icon']
            epPerkName = epPerkData['Response']['displayProperties']['name']
            print("　" + epPerkName)
            tweetText += "- " + epPerkName + "\n"
            epPerkImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + epPerkPath).content)).convert("RGBA").resize((80, 80), 1)
            baseImg.paste(epPerkImg, (73, 450 + 93 * (i - 1)), epPerkImg)
            draw.multiline_text((180, 465 + 93 * (i - 1)), epPerkName, fill=(255, 255, 255), font=fontB1)

        ## ステータスグラフ挿入
        epStats = vendor[0]['Response']['itemComponents']['stats']['data'][str(w)]['stats']
        epDefStats = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/3856705927/?lc=ja", headers=headers).json()['Response']['stats']['stats']
        draw.multiline_text((680, 365), "ステータス値", fill=(255, 255, 255), font=fontB1)
        draw.line(((675, 420), (1235, 420)), (255, 255, 255), 2)
        for s in range(4):
            draw.rectangle((895, 440 + 50 * s, 1225, 470 + 50 * s), fill=(32, 32, 32))
            if epStats[weaponStatsTable[s]]['value'] > epDefStats[weaponStatsTable[s]]['value']:
                draw.rectangle((895, 440 + 50 * s, 895 + (330 * (epStats[weaponStatsTable[s]]['value'] / 100)), 470 + 50 * s), fill=(154, 255, 80))
                draw.rectangle((895, 440 + 50 * s, 895 + (330 * (epDefStats[weaponStatsTable[s]]['value'] / 100)), 470 + 50 * s), fill=(255, 255, 255))
            elif epStats[weaponStatsTable[s]]['value'] < epDefStats[weaponStatsTable[s]]['value']:
                draw.rectangle((895, 440 + 50 * s, 895 + (330 * (epDefStats[weaponStatsTable[s]]['value'] / 100)), 470 + 50 * s), fill=(180, 59, 35))
                draw.rectangle((895, 440 + 50 * s, 895 + (330 * (epStats[weaponStatsTable[s]]['value'] / 100)), 470 + 50 * s), fill=(255, 255, 255))
            else:
                draw.rectangle((895, 440 + 50 * s, 895 + (330 * (epStats[weaponStatsTable[s]]['value'] / 100)), 470 + 50 * s), fill=(255, 255, 255))
            draw.multiline_text((855, 436 + 50 * s), str(epStats[weaponStatsTable[s]]['value']), fill=(255, 255, 255), font=fontN)
            statData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyStatDefinition/" + weaponStatsTable[s] + "/?lc=ja", headers=headers).json()
            draw.multiline_text((682, 436 + 50 * s), statData['Response']['displayProperties']['name'], fill=(255, 255, 255), font=fontN)

        # 表示
        cropImg = baseImg.crop((0, 0, 1280, 850)).convert("RGB")
        cropImg.save(resImg, format='JPEG')
        mediaList.append(tw.postImage(resImg.getvalue()))
        tweetText += "\n"

    content = {"text": tweetText, "media": {"media_ids": mediaList}}
    recentTweet = tw.makeThread(content, recentTweet)
    mediaList = []

    # レジェンダリー武器の取得

    print("レジェンダリー武器:")
    tweetText = "＜レジェンダリー武器＞\n"

    ### 画像生成

    c = 0
    w = 0
    p = 1
    m = 7
    perkMax = 1
    while w < m:
        if w in [0, 4]:
            # フォントと背景画像の準備
            baseImg = Image.open("./img/xur_bg.jpg").convert("RGBA")
            resImg = io.BytesIO()
            draw = ImageDraw.Draw(baseImg)
                
            # タイトルと日付挿入
            draw.multiline_text((30, 25), "今週のシュール", fill=(255, 255, 255), font=fontTitle)
            draw.multiline_text((430, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
            draw.multiline_text((30, 120), "<レジェンダリー武器 (" + str(p) + "/2)>", fill=(255, 255, 255), font=fontB1)

            shift_x = 0
            shift_y = 0
            perkCount = 0

        # データ取得
        lWeaponHash = vendor[c]['Response']['sales']['data'][salesList[c][w + 7 - c]]['itemHash']
        lWeaponData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponHash) + "/?lc=ja", headers=headers).json()
        lWeaponName = lWeaponData['Response']['displayProperties']['name']
        
        print("　" + lWeaponName)
        tweetText += "- " + lWeaponName + "\n"
            
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
        lWeaponMWHash = vendor[c]['Response']['itemComponents']['reusablePlugs']['data'][salesList[c][w + 7 - c]]['plugs']['7'][0]['plugItemHash']
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
                perkQuantity = len(vendor[c]['Response']['itemComponents']['reusablePlugs']['data'][salesList[c][w + 7 - c]]['plugs'][str(i)])
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
                        lWeaponPerkHash = vendor[c]['Response']['itemComponents']['sockets']['data'][salesList[c][w + 7 - c]]['sockets'][s]['plugHash']
                    else:
                        lWeaponPerkHash = vendor[c]['Response']['itemComponents']['reusablePlugs']['data'][salesList[c][w + 7 - c]]['plugs'][str(s)][r]['plugItemHash']
                    if lWeaponPerkHash not in [2302094943, 2931483505, 4248210736]:
                        lWeaponPerkData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponPerkHash) + "/?lc=ja", headers=headers).json()
                        lWeaponPerkPath = lWeaponPerkData['Response']['displayProperties']['icon']
                        lWeaponPerkName = lWeaponPerkData['Response']['displayProperties']['name']
                        lWeaponPerkImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponPerkPath).content)).convert("RGBA").resize((80, 80), 1)
                        baseImg.paste(lWeaponPerkImg, (85 + 105 * (i - 1) + shift_x, 480 + 93 * (r - 1) + shift_y), lWeaponPerkImg)
                except KeyError:
                    # 起源特性が存在しなければpass
                    pass
            
        # クラス剣専用のループ
        if salesList[0][w + 7] == '198' or c > 0:
            m = 9
            c += 1
        
        # 部位ごとにずらす
        if (w % 2) == 0:
            shift_x = 620
        else:
            shift_x = 0
            shift_y += 265 + perkMax * 85
            perkCount += perkMax
            perkMax = 1
        
        if w == 3 or w + 1 == m:
            if w + 1 == m and w % 2 == 0:
                perkCount += perkMax
            cropImg = baseImg.crop((0, 0, 1280, 200 + 245 * math.ceil((w + 1 - (p - 1) * 4) / 2) + 90 * perkCount)).convert("RGB")
            cropImg.save(resImg, format='JPEG')
            mediaList.append(tw.postImage(resImg.getvalue()))
            p += 1

        w += 1

    content = {"text": tweetText, "media": {"media_ids": mediaList}}
    recentTweet = tw.makeThread(content, recentTweet)
    mediaList = []
        
    print("")

    # レジェンダリー防具の取得

    tweetText = "＜レジェンダリー防具＞\n"

    lArmorSetName = []
    for c in range(3):
        ### 画像生成
        # フォントと背景画像の準備
        baseImg = Image.open("./img/xur_bg.jpg").convert("RGBA")
        resImg = io.BytesIO()
        draw = ImageDraw.Draw(baseImg)
        
        # タイトルと日付挿入
        draw.multiline_text((30, 25), "今週のシュール", fill=(255, 255, 255), font=fontTitle)
        draw.multiline_text((430, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
        draw.multiline_text((30, 120), "<レジェンダリー防具 - " + classDict[c] + ">", fill=(255, 255, 255), font=fontB1)

        # セットデータ取得
        lArmorHash = vendor[c]['Response']['sales']['data'][salesList[c][partsOrder[0]]]['itemHash']
        lArmorData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lArmorHash) + "/?lc=ja", headers=headers).json()
        lArmorCollectibleData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyCollectibleDefinition/" + str(lArmorData['Response']['collectibleHash']) + "/?lc=ja", headers=headers).json()
        lArmorSetData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyPresentationNodeDefinition/" + str(lArmorCollectibleData['Response']['parentNodeHashes'][0]) + "/?lc=ja", headers=headers).json()
        
        # セットデータをセット名に変換
        lArmorSetName.append(lArmorSetData['Response']['displayProperties']['name'])
        print("レジェンダリー防具（" + classDict[c] + "）: " + lArmorSetName[c])

        # ずらし値のリセット
        shift_x = 0
        shift_y = 0

        for p in range(5):
            # データ取得
            lArmorHash = vendor[c]['Response']['sales']['data'][salesList[c][partsOrder[p]]]['itemHash']
            lArmorData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lArmorHash) + "/?lc=ja", headers=headers).json()
            lArmorName = lArmorData['Response']['displayProperties']['name']
            
            # 部位ごとにずらす
            if (p % 2) == 1:
                shift_x = 620
            elif p != 0:
                shift_x = 0
                shift_y += 490
            
            ## 防具アイコン挿入
            # パスから画像・ウォーターマークを取得
            lArmorImgPath = lArmorData['Response']['displayProperties']['icon']
            lArmorWMPath = lArmorData['Response']['quality']['displayVersionWatermarkIcons'][-1]
            lArmorBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lArmorImgPath).content))
            lArmorBaseImg.putalpha(255)
            lArmorWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lArmorWMPath).content)).convert("RGBA")
            # 武器画像とウォーターマークを合成
            lArmorImg = Image.alpha_composite(lArmorBaseImg, lArmorWM)
            # リサイズして挿入
            lArmorImg = lArmorImg.resize((100, 100), 1)
            baseImg.paste(lArmorImg, (75 + shift_x, 180 + shift_y))

            ## 防具名挿入
            draw.multiline_text((195 + shift_x, 190 + shift_y), lArmorName, fill=(255, 255, 255), font=fontB0)

            ## 防具種挿入
            lArmorArchName = lArmorData['Response']['itemTypeDisplayName']
            draw.multiline_text((195 + shift_x, 232 + shift_y), lArmorArchName, fill=(255, 255, 255), font=fontN)

            ## ステータスグラフ挿入（クラスアイテム以外）
            if p != 4:
                lArmorStats = vendor[c]['Response']['itemComponents']['stats']['data'][salesList[c][partsOrder[p]]]['stats']

                statsTotal = 0
                for s in range(6):
                    draw.rectangle((260 + shift_x, 300 + 50 * s + shift_y, 590 + shift_x, 330 + 50 * s + shift_y), fill=(32, 32, 32))
                    draw.rectangle((260 + shift_x, 300 + 50 * s + shift_y, 260 + (330 * (lArmorStats[statsTable[s]]['value'] / 42)) + shift_x, 330 + 50 * s + shift_y), fill=(255, 255, 255))
                    if (len(str(lArmorStats[statsTable[s]]['value'])) == 1):
                        draw.multiline_text((232 + shift_x, 296 + 50 * s + shift_y), str(lArmorStats[statsTable[s]]['value']), fill=(255, 255, 255), font=fontN)
                    else:
                        draw.multiline_text((220 + shift_x, 296 + 50 * s + shift_y), str(lArmorStats[statsTable[s]]['value']), fill=(255, 255, 255), font=fontN)
                    statData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyStatDefinition/" + statsTable[s] + "/?lc=ja", headers=headers).json()
                    statPath = statData['Response']['displayProperties']['icon']
                    draw.multiline_text((87 + shift_x, 296 + 50 * s + shift_y), statData['Response']['displayProperties']['name'], fill=(255, 255, 255), font=fontN)
                    statImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + statPath).content)).convert("RGBA").resize((36, 36), 1)
                    baseImg.paste(statImg, (173 + shift_x, 298 + 50 * s + shift_y), statImg)
                    statsTotal += lArmorStats[statsTable[s]]['value']
                draw.multiline_text((87 + shift_x, 596 + shift_y), "合計", fill=(255, 255, 255), font=fontN)
                draw.multiline_text((210 + shift_x, 590 + shift_y), str(statsTotal), fill=(255, 255, 255), font=fontB1)
            
        cropImg = baseImg.crop((0, 0, 1280, 1320)).convert("RGB")
        cropImg.save(resImg, format='JPEG')
        mediaList.append(tw.postImage(resImg.getvalue()))

    if lArmorSetName[0] == lArmorSetName[1] == lArmorSetName[2]:
        tweetText += "\n防具は「" + lArmorSetName[0] + "」セットが販売されています。"
    else:
        tweetText += "\n防具は「" + lArmorSetName[0] + "」「" + lArmorSetName[1] + "」「" + lArmorSetName[2] + "」セットが販売されています。"

    content = {"text": tweetText, "media": {"media_ids": mediaList}}
    recentTweet = tw.makeThread(content, recentTweet)
    mediaList = []
    
    print("情報取得の全工程完了。")
    
    return 0