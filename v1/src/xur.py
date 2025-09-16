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
import textwrap
import math

def getXur(isTest=False):
    # テストモード判定
	if isTest:
		print("テストモードで実行中。")
    
	# 頻出する辞書とリストの定義
	statsTable = ['2996146975', '392767087', '1943323491', '1735777505', '144602215', '4244567218']
	weaponStatsTable = ['1240592695', '155624089', '943549884', '4188031367']
	classDict = {0: "ハンター", 1:"タイタン", 2:"ウォーロック"}
	partsOrder = [15, 12, 13, 16, 14]

	# 画像生成用のフォント定義
	fontN = ImageFont.truetype('./.font/GenEiGothicN-Regular.otf', 25)
	fontB0ss = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 20)
	fontB0s = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 24)
	fontB0 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 28)
	fontB1 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 32)
	fontB2 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 40)
	fontB3 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 45)
	fontTitle = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 55)
	logoImg = Image.open("./img/logo_full.png").resize((300, 46), 1)

	### アクセスに必要なトークンを取得 ###

	auth.getBungieAccessToken()

	#### 基本データの取得 ####

	# ヘッダーにAPIキーとアクセストークンを設定
	load_dotenv("..env")
	headers = {"X-API-Key": os.getenv('B_API_KEY'),
			   "Authorization": "Bearer " + os.environ["BAPI_ACCESS_TOKEN"]}

	# シュールに関する情報を取得
	# 取得成功可否も確認する
	# 0 = ハンター, 1 = タイタン, 2 = ウォーロック
	for i in range(3):
		vendor = []
		vendor.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009576344512/Vendors/2190858386/?components=402,304,302,305,310", headers=headers).json())
		vendor.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009576344511/Vendors/2190858386/?components=402,304,302,305,310", headers=headers).json())
		vendor.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009405135001/Vendors/2190858386/?components=402,304,302,305,310", headers=headers).json())
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
				print("エラーコード - " + str(vendor[0]['ErrorCode']) + "\n" + vendor[0]['Message'])
				return vendor[0]['ErrorCode']
		else:
			break

	print("\nシュールの出現が確認できました。")

	for i in range(3):
		vendorGear = []
		vendorGear.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009576344512/Vendors/3751514131/?components=402,304,305,310", headers=headers).json())
		vendorGear.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009576344511/Vendors/3751514131/?components=402,304,305,310", headers=headers).json())
		vendorGear.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009405135001/Vendors/3751514131/?components=402,304,305,310", headers=headers).json())
		if ('Response' not in vendorGear[0]) or ('Response' not in vendorGear[1]) or ('Response' not in vendorGear[2]):
			for j in range(3):
				if vendorGear[j]['ErrorCode'] == 5:
					print("現在APIサービスはメンテナンス中です。処理を中断します。")
					return vendorGear[j]['ErrorCode']
			if i != 2:
				print("API取得に失敗しました。3秒後にリトライします…")
				sleep(3)
				continue
			else:
				print("APIが取得できませんでした。処理を中断します。")
				print("エラーコード - " + str(vendorGear[0]['ErrorCode']) + "\n" + vendorGear[0]['Message'])
				return vendorGear[0]['ErrorCode']
		else:
			break

	for i in range(3):
		vendorMiscs = []
		vendorMiscs.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009576344512/Vendors/537912098/?components=402", headers=headers).json())
		vendorMiscs.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009576344511/Vendors/537912098/?components=402", headers=headers).json())
		vendorMiscs.append(requests.get("https://www.bungie.net/Platform/Destiny2/3/Profile/4611686018482984497/Character/2305843009405135001/Vendors/537912098/?components=402", headers=headers).json())
		if ('Response' not in vendorMiscs[0]) or ('Response' not in vendorMiscs[1]) or ('Response' not in vendorMiscs[2]):
			for j in range(3):
				if vendorMiscs[j]['ErrorCode'] == 5:
					print("現在APIサービスはメンテナンス中です。処理を中断します。")
					return vendorMiscs[j]['ErrorCode']
			if i != 2:
				print("API取得に失敗しました。3秒後にリトライします…")
				sleep(3)
				continue
			else:
				print("APIが取得できませんでした。処理を中断します。")
				print("エラーコード - " + str(vendorMiscs[0]['ErrorCode']) + "\n" + vendorMiscs[0]['Message'])
				return vendorMiscs[0]['ErrorCode']
		else:
			break

	# 日付データの準備
	TimeZone = ZoneInfo("Asia/Tokyo")
	
	startDate = datetime.datetime.now(TimeZone)
	startDateStr = startDate.strftime('%Y/%m/%d')

	endDate = startDate + datetime.timedelta(days = 8 - startDate.weekday())
	endDateStr = endDate.strftime('%Y/%m/%d')

	tweetText = ""
	mediaList = []

	baseImg = Image.open("./img/xur_tower.jpg").convert("RGBA")
	resImg = io.BytesIO()
	draw = ImageDraw.Draw(baseImg)

	draw.multiline_text((30, 25), "今週のシュール", fill=(255, 255, 255), font=fontTitle)
	draw.multiline_text((430, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)

	draw.text((1240, 660), "▼アイテム詳細はツリーを確認", fill=(255, 255, 255), anchor="rt", font=fontB0)

	tweetText += "【 #シュール 情報】\n本日は土曜日です。タワーにてシュールが出没しています。\n\n#Destiny2"

	baseImg.paste(logoImg, (30, 654), logoImg)
	cropImg = baseImg.crop((0, 0, 1280, 720)).convert("RGB")
	cropImg.save(resImg, format='JPEG')
	
	if not isTest:
		mediaList.append(tw.postImage(resImg.getvalue()))
		content = {"text": tweetText, "media": {"media_ids": mediaList}}
		recentTweet = tw.makeThread(content)
		tw.pinTweet(recentTweet)
		mediaList = []

	# 販売アイテムリストを生成
	# 0 = ハンター, 1 = タイタン, 2 = ウォーロック
	salesList = []
	salesList.append(list(vendor[0]['Response']['sales']['data'].keys()))
	salesList.append(list(vendor[1]['Response']['sales']['data'].keys()))
	salesList.append(list(vendor[2]['Response']['sales']['data'].keys()))
	
	# 奇妙なコインの画像データを用意
	coinData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/800069450", headers=headers).json()
	coinImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + coinData['Response']['displayProperties']['icon']).content)).resize((40, 40), 1)

	print("")

	print("媒体/スペシャルアイテム:")
	tweetText = "＜媒体 / スペシャルアイテム＞\n"
	### エキゾチック武器媒体の画像生成 ###

	## 背景画像の準備
	baseImg = Image.open("./img/xur_bg.jpg").convert("RGBA")
	resImg = io.BytesIO()
	draw = ImageDraw.Draw(baseImg)

	## タイトルと日付挿入
	draw.multiline_text((30, 25), "今週のシュール", fill=(255, 255, 255), font=fontTitle)

	draw.multiline_text((430, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
	draw.multiline_text((30, 120), "<エキゾチック武器の媒体>", fill=(255, 255, 255), font=fontB1)
	
	shift_y = 0
	for c in range(2):
		catalystHash = vendor[0]['Response']['sales']['data'][salesList[0][c]]['itemHash']
		catalystData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(catalystHash) + "/?lc=ja", headers=headers).json()

		## データを文字列に変換
		catalystName = catalystData['Response']['displayProperties']['name']

		# 表示（テスト用）
		print("　" + catalystName)
		tweetText += "• " + catalystName + "\n"

		## 媒体アイコン挿入
		# パスから画像を取得
		catalystImgPath = catalystData['Response']['displayProperties']['icon']
		catalystImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + catalystImgPath).content))
		# リサイズして挿入
		catalystImg = catalystImg.resize((150, 150), 1)
		baseImg.paste(catalystImg, (50, 185 + shift_y))

		## 媒体名挿入
		draw.multiline_text((233, 198 + shift_y), catalystName, fill=(255, 255, 255), font=fontB3)
			
		## アイテム種類挿入
		catalystArchName = "エキゾチックの媒体"
		draw.multiline_text((233, 277 + shift_y), catalystArchName, fill=(255, 255, 255), font=fontB1)

		## 価格挿入
		draw.multiline_text((1072, 304 + shift_y), "価格", fill=(255, 255, 255), font=fontN)
		baseImg.paste(coinImg, (1137, 295 + shift_y))
		itemCost = vendor[0]['Response']['sales']['data'][salesList[0][c]]['costs'][0]['quantity']
		draw.multiline_text((1185, 302 + shift_y), "x" + str(itemCost), fill=(255, 255, 255), font=fontB0)
  
		## 媒体効果挿入
		### ステータス増加効果挿入
		for stats in catalystData['Response']['investmentStats']:
			# 画像挿入
			catalystStatHash = stats['statTypeHash']
			catalystStatData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyStatDefinition/" + str(catalystStatHash) + "/?lc=ja", headers=headers).json()
   
			## 効果名・説明文挿入
			catalystStatName = catalystStatData['Response']['displayProperties']['name']
			draw.multiline_text((60, 357 + shift_y), catalystStatName + ":", fill=(255, 255, 255), font=fontN)
			if stats['value'] > 0:
				draw.multiline_text((230, 356 + shift_y), "+" + str(stats['value']), fill=(255, 255, 255), font=fontB0)
			else:
				draw.multiline_text((230, 356 + shift_y), str(stats['value']), fill=(255, 255, 255), font=fontB0)

			shift_y += 45

		### 特殊効果挿入
		for perk in catalystData['Response']['perks']:
			# 画像挿入
			catalystPerkHash = perk['perkHash']
			catalystPerkData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinySandboxPerkDefinition/" + str(catalystPerkHash) + "/?lc=ja", headers=headers).json()
			if catalystPerkData['Response']['isDisplayable']:
				catalystPerkPath = catalystPerkData['Response']['displayProperties']['icon']
				catalystPerkImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + catalystPerkPath).content)).convert("RGBA")

				catalystPerkImg = catalystPerkImg.resize((100, 100), 1)
				baseImg.paste(catalystPerkImg, (60, 365 + shift_y), catalystPerkImg)

				## 効果名・説明文挿入
				catalystPerkName = catalystPerkData['Response']['displayProperties']['name']
				draw.multiline_text((183, 374 + shift_y), catalystPerkName, fill=(255, 255, 255), font=fontB1)
				catalystPerkDesc = catalystPerkData['Response']['displayProperties']['description']
				catalystPerkDesc = catalystPerkDesc.replace("[代替武器アクション]を:", "[リロード]を長押しすると、")
				catalystPerkDesc = catalystPerkDesc.replace("を: ", "を押すと")
				# 長い場合は改行を入れる
				if catalystPerkDesc.count("\n", 0, 42) == 0:
					catalystPerkDesc = textwrap.fill(catalystPerkDesc, 42)
				draw.multiline_text((183, 426 + shift_y), catalystPerkDesc, fill=(255, 255, 255), font=fontN)
				shift_y += 24 * (len(catalystPerkDesc) // 42) + 120

		shift_y += 210
  
	baseImg.paste(logoImg, (30, 194 + shift_y), logoImg)
	cropImg = baseImg.crop((0, 0, 1280, 264 + shift_y)).convert("RGB")
	
	if not isTest:
		cropImg.save(resImg, format='JPEG')
		mediaList.append(tw.postImage(resImg.getvalue()))
	else:
		cropImg.show()
		input("Enterを押すと次のページを表示します。")

	#### スペシャルアイテムの取得 ###
 
	# 背景画像の準備
	baseImg = Image.open("./img/xur_bg.jpg").convert("RGBA")
	resImg = io.BytesIO()
	draw = ImageDraw.Draw(baseImg)

	# タイトルと日付挿入
	draw.multiline_text((30, 25), "今週のシュール", fill=(255, 255, 255), font=fontTitle)
	draw.multiline_text((430, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
	draw.multiline_text((30, 120), "<スペシャルアイテム>", fill=(255, 255, 255), font=fontB1)

	tweetText += "\n今週のスペシャルアイテムは"

	itemHash = vendor[0]['Response']['sales']['data'][salesList[0][5]]['itemHash']
	shift_y = 0
 
	if itemHash == 1540068657:
		for c in range(3):
			ecHash = vendor[c]['Response']['sales']['data'][salesList[c][5]]['itemHash']
			ecData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(ecHash) + "/?lc=ja", headers=headers).json()
	
			## データを文字列に変換
			ecName = ecData['Response']['displayProperties']['name']

			# 表示（テスト用）
			print("　" + ecName)
			tweetText += "「" + ecName + "」"

			## 媒体アイコン挿入
			# パスから画像を取得
			ecImgPath = ecData['Response']['displayProperties']['icon']
			ecWMPath = ecData['Response']['iconWatermark']
			ecBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + ecImgPath).content))
			ecBaseImg.putalpha(255)
			ecWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + ecWMPath).content)).convert("RGBA")
			# 武器画像とウォーターマークを合成
			ecImg = Image.alpha_composite(ecBaseImg, ecWM)
			# リサイズして挿入
			ecImg = ecImg.resize((150, 150), 1)
			baseImg.paste(ecImg, (50, 185 + shift_y))

			## アイテム名挿入
			draw.multiline_text((233, 198 + shift_y), ecName, fill=(255, 255, 255), font=fontB3)
				
			## アイテム種類挿入
			ecArchName = "エキゾチッククラスアイテム"
			draw.multiline_text((233, 277 + shift_y), ecArchName, fill=(255, 255, 255), font=fontB1)

			## 価格挿入
			draw.multiline_text((1072, 304 + shift_y), "価格", fill=(255, 255, 255), font=fontN)
			baseImg.paste(coinImg, (1137, 295 + shift_y))
			itemCost = vendor[c]['Response']['sales']['data'][salesList[c][5]]['costs'][0]['quantity']
			draw.multiline_text((1185, 302 + shift_y), "x" + str(itemCost), fill=(255, 255, 255), font=fontB0)
   
			shift_y += 200

		draw.multiline_text((50, 185 + shift_y), "＊ 付与されるパークは、購入するたびに変化します。", fill=(255, 255, 255), font=fontN)
		shift_y += 45
	else:
		itemData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(itemHash) + "/?lc=ja", headers=headers).json()
		if 20 in itemData['Response']['itemCategoryHashes']:
			for c in range(3):
				### データ取得
				armorHash = vendor[c]['Response']['sales']['data'][salesList[c][5]]['itemHash']
				armorData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(armorHash) + "/?lc=ja", headers=headers).json()
				# データを文字列に変換
				armorName = armorData['Response']['displayProperties']['name']
				print("　" + armorName)
				tweetText += "「" + classDict[c] + "」"

				## 防具アイコン挿入
				# パスから画像・ウォーターマークを取得
				armorImgPath = armorData['Response']['displayProperties']['icon']
				armorWMPath = armorData['Response']['quality']['displayVersionWatermarkIcons'][0]
				armorBaseImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + armorImgPath).content))
				armorBaseImg.putalpha(255)
				armorWM = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + armorWMPath).content)).convert("RGBA")
				# 武器画像とウォーターマークを合成
				armorImg = Image.alpha_composite(armorBaseImg, armorWM)
				# リサイズして挿入
				armorImg = armorImg.resize((150, 150), 1)
				baseImg.paste(armorImg, (50, 185 + shift_y))

				## 防具名挿入
				draw.multiline_text((233, 198 + shift_y), armorName, fill=(255, 255, 255), font=fontB3)

				## 防具種挿入
				armorArchName = armorData['Response']['itemTypeDisplayName']
				draw.multiline_text((233, 275 + shift_y), armorArchName, fill=(255, 255, 255), font=fontB1)

				## 内在特性挿入
				# 画像挿入
				armorInstHash = armorData['Response']['sockets']['socketEntries'][11]['singleInitialItemHash']
				armorInstData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(armorInstHash) + "/?lc=ja", headers=headers).json()
				armorInstPath = armorInstData['Response']['displayProperties']['icon']
				armorInstImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + armorInstPath).content)).convert("RGBA")

				armorInstImg = armorInstImg.resize((100, 100), 1)
				baseImg.paste(armorInstImg, (60, 365 + shift_y), armorInstImg)

				## 特性名・説明文挿入
				armorInstName = armorInstData['Response']['displayProperties']['name']
				draw.multiline_text((183, 365 + shift_y), armorInstName, fill=(255, 255, 255), font=fontB1)
				armorInstDesc = armorInstData['Response']['displayProperties']['description']
				# 長い場合は改行を入れる
				if armorInstDesc.count("\n", 0, 19) == 0:
					armorInstDesc = textwrap.fill(armorInstDesc, 19)
				draw.multiline_text((183, 415 + shift_y), armorInstDesc, fill=(255, 255, 255), font=fontN)
				
				## ステータスグラフ挿入
				armorStats = vendor[0]['Response']['itemComponents']['stats']['data'][salesList[0][c + 2]]['stats']

				draw.multiline_text((723, 365 + shift_y), "防具のステータス値", fill=(255, 255, 255), font=fontB1)
				draw.line(((715, 415 + shift_y), (1235, 415)), (255, 255, 255), 2)
				statsTotal = 0
				for s in range(6):
					draw.rectangle((895, 435 + 50 * s + shift_y, 1225, 465 + 50 * s + shift_y), fill=(32, 32, 32))
					draw.rectangle((895, 435 + 50 * s + shift_y, 895 + (330 * (armorStats[statsTable[s]]['value'] / 42)), 465 + 50 * s + shift_y), fill=(255, 255, 255))
					draw.text((885, 440 + 50 * s + shift_y), str(armorStats[statsTable[s]]['value']), fill=(255, 255, 255), font=fontN, anchor='rt')
					statData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyStatDefinition/" + statsTable[s] + "/?lc=ja", headers=headers).json()
					statPath = statData['Response']['displayProperties']['icon']
					draw.multiline_text((723, 433 + 50 * s + shift_y), statData['Response']['displayProperties']['name'], fill=(255, 255, 255), font=fontN)
					statImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + statPath).content)).convert("RGBA").resize((36, 36), 1)
					baseImg.paste(statImg, (808, 432 + 50 * s + shift_y), statImg)
					statsTotal += armorStats[statsTable[s]]['value']
				draw.multiline_text((725, 742 + shift_y), "合計", fill=(255, 255, 255), font=fontN)
				draw.multiline_text((848, 735 + shift_y), str(statsTotal), fill=(255, 255, 255), font=fontB1)
				
				## 価格挿入
				draw.multiline_text((1072, 304 + shift_y), "価格", fill=(255, 255, 255), font=fontN)
				baseImg.paste(coinImg, (1137, 295 + shift_y))
				itemCost = vendor[0]['Response']['sales']['data'][salesList[0][c + 2]]['costs'][0]['quantity']
				draw.multiline_text((1185, 302 + shift_y), "x" + str(itemCost), fill=(255, 255, 255), font=fontB0)
    
				shift_y += 500

			baseImg.paste(logoImg, (30, 254 + shift_y), logoImg)
			cropImg = baseImg.crop((0, 0, 1280, 320 + shift_y)).convert("RGB")
			
			if not isTest:
				cropImg.save(resImg, format='JPEG')
				mediaList.append(tw.postImage(resImg.getvalue()))
			else:
				cropImg.show()
				input("Enterを押すと次のページを表示します。")
		else:
			# それ以外は情報が出次第追加
			pass

	# 表示
	baseImg.paste(logoImg, (950, 784), logoImg)
	cropImg = baseImg.crop((0, 0, 1280, 850)).convert("RGB")

	tweetText += "です。"

	if not isTest:
		cropImg.save(resImg, format='JPEG')
		mediaList.append(tw.postImage(resImg.getvalue()))
		content = {"text": tweetText, "media": {"media_ids": mediaList}}
		recentTweet = tw.makeThread(content, recentTweet)
		mediaList = []
	else:
		cropImg.show()
		input("Enterを押すと次のページを表示します。")

	print("")
	tweetText = "＜エキゾチック防具＞\n"

	#### 販売しているエキゾチック防具の取得と画像生成 ###
	for c in range(3):
		### データ取得
		eArmorHash = vendor[0]['Response']['sales']['data'][salesList[0][c + 2]]['itemHash']
		eArmorData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(eArmorHash) + "/?lc=ja", headers=headers).json()
		# データを文字列に変換
		eArmorName = eArmorData['Response']['displayProperties']['name']
		print("エキゾチック防具（" + classDict[c] + "）: " + eArmorName)
		tweetText += "• " + classDict[c] + ": " + eArmorName + "\n"

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
		draw.multiline_text((233, 198), eArmorName, fill=(255, 255, 255), font=fontB3)

		## 防具種挿入
		eArmorArchName = eArmorData['Response']['itemTypeDisplayName']
		draw.multiline_text((233, 275), eArmorArchName, fill=(255, 255, 255), font=fontB1)

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
		draw.multiline_text((183, 365), eArmorInstName, fill=(255, 255, 255), font=fontB1)
		eArmorInstDesc = eArmorInstData['Response']['displayProperties']['description']
		# 長い場合は改行を入れる
		if eArmorInstDesc.count("\n", 0, 19) == 0:
			eArmorInstDesc = textwrap.fill(eArmorInstDesc, 19)
		draw.multiline_text((183, 415), eArmorInstDesc, fill=(255, 255, 255), font=fontN)
		
		## ステータスグラフ挿入
		eArmorStats = vendor[0]['Response']['itemComponents']['stats']['data'][salesList[0][c + 2]]['stats']

		draw.multiline_text((723, 365), "防具のステータス値", fill=(255, 255, 255), font=fontB1)
		draw.line(((715, 415), (1235, 415)), (255, 255, 255), 2)
		statsTotal = 0
		for s in range(6):
			draw.rectangle((895, 435 + 50 * s, 1225, 465 + 50 * s), fill=(32, 32, 32))
			draw.rectangle((895, 435 + 50 * s, 895 + (330 * (eArmorStats[statsTable[s]]['value'] / 42)), 465 + 50 * s), fill=(255, 255, 255))
			draw.text((885, 440 + 50 * s), str(eArmorStats[statsTable[s]]['value']), fill=(255, 255, 255), font=fontN, anchor='rt')
			statData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyStatDefinition/" + statsTable[s] + "/?lc=ja", headers=headers).json()
			statPath = statData['Response']['displayProperties']['icon']
			draw.multiline_text((723, 433 + 50 * s), statData['Response']['displayProperties']['name'], fill=(255, 255, 255), font=fontN)
			statImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + statPath).content)).convert("RGBA").resize((36, 36), 1)
			baseImg.paste(statImg, (808, 432 + 50 * s), statImg)
			statsTotal += eArmorStats[statsTable[s]]['value']
		draw.multiline_text((725, 742), "合計", fill=(255, 255, 255), font=fontN)
		draw.multiline_text((848, 735), str(statsTotal), fill=(255, 255, 255), font=fontB1)
		
		## 価格挿入
		draw.multiline_text((1072, 304), "価格", fill=(255, 255, 255), font=fontN)
		baseImg.paste(coinImg, (1137, 295))
		itemCost = vendor[0]['Response']['sales']['data'][salesList[0][c + 2]]['costs'][0]['quantity']
		draw.multiline_text((1185, 302), "x" + str(itemCost), fill=(255, 255, 255), font=fontB0)

		baseImg.paste(logoImg, (30, 754), logoImg)
		cropImg = baseImg.crop((0, 0, 1280, 820)).convert("RGB")
		
		if not isTest:
			cropImg.save(resImg, format='JPEG')
			mediaList.append(tw.postImage(resImg.getvalue()))
		else:
			cropImg.show()
			input("Enterを押すと次のページを表示します。")

	if not isTest:
		content = {"text": tweetText, "media": {"media_ids": mediaList}}
		recentTweet = tw.makeThread(content, recentTweet)
		mediaList = []

	print("")

	# 販売アイテムリストを生成
	# 0 = ハンター, 1 = タイタン, 2 = ウォーロック
	salesListGear = []
	salesListGear.append(list(vendorGear[0]['Response']['sales']['data'].keys()))
	salesListGear.append(list(vendorGear[1]['Response']['sales']['data'].keys()))
	salesListGear.append(list(vendorGear[2]['Response']['sales']['data'].keys()))
	
	print("エキゾチック武器:")
	tweetText = "＜エキゾチック武器＞\n"
	for c in range(3):
		eWeaponHash = vendorGear[0]['Response']['sales']['data'][salesListGear[0][c + 1]]['itemHash']
		eWeaponData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(eWeaponHash) + "/?lc=ja", headers=headers).json()

		## データを文字列に変換
		eWeaponName = eWeaponData['Response']['displayProperties']['name']

		# 表示（テスト用）
		print("　" + eWeaponName)
		tweetText += "• " + eWeaponName + "\n"

		### エキゾチック武器の画像生成 ###

		## 背景画像の準備
		baseImg = Image.open("./img/xur_bg.jpg").convert("RGBA")
		resImg = io.BytesIO()
		draw = ImageDraw.Draw(baseImg)

		## タイトルと日付挿入
		draw.multiline_text((30, 25), "今週のシュール", fill=(255, 255, 255), font=fontTitle)

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
		draw.multiline_text((233, 198), eWeaponName, fill=(255, 255, 255), font=fontB3)

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
			draw.multiline_text((290, 277), eWeaponArchName, fill=(255, 255, 255), font=fontB1)
		else:
			draw.multiline_text((233, 277), eWeaponArchName, fill=(255, 255, 255), font=fontB1)

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
		draw.multiline_text((183, 365), eWeaponInstName, fill=(255, 255, 255), font=fontB1)
		eWeaponInstDesc = eWeaponInstData['Response']['displayProperties']['description']
		eWeaponInstDesc = eWeaponInstDesc.replace("[代替武器アクション]を:", "[リロード]を長押しすると、")
		eWeaponInstDesc = eWeaponInstDesc.replace("を: ", "を押すと")
		# 長い場合は改行を入れる
		if eWeaponInstDesc.count("\n", 0, 42) == 0:
			eWeaponInstDesc = textwrap.fill(eWeaponInstDesc, 42)
		draw.multiline_text((183, 417), eWeaponInstDesc, fill=(255, 255, 255), font=fontN)
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
				draw.multiline_text((523, 505 + 22 * cl), eWeaponInstPerkName, fill=(255, 255, 255), font=fontB1)
				eWeaponInstPerkDesc = eWeaponPerkData['Response']['displayProperties']['description']
				eWeaponInstPerkDesc = eWeaponInstPerkDesc.replace("[代替武器アクション]を: ", "[リロード]を長押しすると、")
				eWeaponInstPerkDesc = eWeaponInstPerkDesc.replace("を: ", "を押すと、")
				if eWeaponInstPerkDesc.count("\n", 0, 29) == 0:
					eWeaponInstPerkDesc = textwrap.fill(eWeaponInstPerkDesc, 29)
				draw.multiline_text((523, 550 + 22 * cl), eWeaponInstPerkDesc, fill=(255, 255, 255), font=fontN)

		## 価格挿入
		draw.multiline_text((1072, 304), "価格", fill=(255, 255, 255), font=fontN)
		baseImg.paste(coinImg, (1137, 295))
		itemCost = vendorGear[0]['Response']['sales']['data'][salesListGear[0][c + 1]]['costs'][0]['quantity']
		draw.multiline_text((1185, 302), "x" + str(itemCost), fill=(255, 255, 255), font=fontB0)

		baseImg.paste(logoImg, (30, 754), logoImg)
		cropImg = baseImg.crop((0, 0, 1280, 820)).convert("RGB")
		
		if not isTest:
			cropImg.save(resImg, format='JPEG')
			mediaList.append(tw.postImage(resImg.getvalue()))
		else:
			cropImg.show()
			input("Enterを押すと次のページを表示します。")

	#### ホークムーンのパークの取得 ####
	
	epHash = vendorGear[0]['Response']['sales']['data'][salesListGear[0][4]]['itemHash']
	epData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(epHash) + "/?lc=ja", headers=headers).json()
	
	# 背景画像の準備
	baseImg = Image.open("./img/xur_bg.jpg").convert("RGBA")
	resImg = io.BytesIO()
	draw = ImageDraw.Draw(baseImg)

	# タイトルと日付挿入
	draw.multiline_text((30, 25), "今週のシュール", fill=(255, 255, 255), font=fontTitle)
	draw.multiline_text((430, 40), "(" + startDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB2)
	draw.multiline_text((30, 120), "<エキゾチック武器>", fill=(255, 255, 255), font=fontB1)

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
	draw.multiline_text((213, 188), epName, fill=(255, 255, 255), font=fontB3)
	
	print("　" + epName)
	tweetText += "• " + epName + "\n"

	## 武器種挿入
	epArchName = epData['Response']['itemTypeDisplayName']
	draw.multiline_text((213, 255), epArchName, fill=(255, 255, 255), font=fontB1)

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
	draw.multiline_text((183, 363), epInstName, fill=(255, 255, 255), font=fontB1)

	# パーク挿入
	for i in range(1, 5):
		epPerkHash = vendorGear[0]['Response']['itemComponents']['sockets']['data'][salesListGear[0][4]]['sockets'][i]['plugHash']
		epPerkData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(epPerkHash) + "/?lc=ja", headers=headers).json()
		epPerkPath = epPerkData['Response']['displayProperties']['icon']
		epPerkName = epPerkData['Response']['displayProperties']['name']
		print("　　" + epPerkName)
		if i != 4:
			tweetText += "┣" + epPerkName + "\n"
		else:
			tweetText += "┗" + epPerkName + "\n"
		epPerkImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + epPerkPath).content)).convert("RGBA").resize((80, 80), 1)
		baseImg.paste(epPerkImg, (73, 450 + 93 * (i - 1)), epPerkImg)
		draw.multiline_text((183, 470 + 93 * (i - 1)), epPerkName, fill=(255, 255, 255), font=fontB1)

	## ステータスグラフ挿入
	epStats = vendorGear[0]['Response']['itemComponents']['stats']['data'][salesListGear[0][4]]['stats']
	epDefStats = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(epHash) + "/?lc=ja", headers=headers).json()['Response']['stats']['stats']
	draw.multiline_text((683, 370), "ステータス値", fill=(255, 255, 255), font=fontB1)
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
		draw.multiline_text((856, 441 + 50 * s), str(epStats[weaponStatsTable[s]]['value']), fill=(255, 255, 255), font=fontN)
		statData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyStatDefinition/" + weaponStatsTable[s] + "/?lc=ja", headers=headers).json()
		draw.multiline_text((685, 441 + 50 * s), statData['Response']['displayProperties']['name'], fill=(255, 255, 255), font=fontN)
  
	## 価格挿入
	draw.multiline_text((1072, 274), "価格", fill=(255, 255, 255), font=fontN)
	baseImg.paste(coinImg, (1137, 265))
	itemCost = vendorGear[0]['Response']['sales']['data'][salesListGear[0][4]]['costs'][0]['quantity']
	draw.multiline_text((1185, 272), "x" + str(itemCost), fill=(255, 255, 255), font=fontB0)

	# 表示
	baseImg.paste(logoImg, (950, 784), logoImg)
	cropImg = baseImg.crop((0, 0, 1280, 850)).convert("RGB")

	if not isTest:
		cropImg.save(resImg, format='JPEG')
		mediaList.append(tw.postImage(resImg.getvalue()))
		content = {"text": tweetText, "media": {"media_ids": mediaList}}
		recentTweet = tw.makeThread(content, recentTweet)
		mediaList = []
	else:
		input("Enterを押すと次のページを表示します。")
		pass

	# レジェンダリー武器の取得

	print("\nレジェンダリー武器:")
	tweetText = "＜レジェンダリー武器＞\n"

	### 画像生成
	
	hasClassSword = False
	coinImg = coinImg.resize((32, 32), 1)

	# c: 現在のキャラクターを記憶する変数(0: ハンター)
	# p: 画像のページ数
	# w: 現在取得中の武器が何番目か
	# m: 武器情報を取得する最大数
	c = 0
	w = 0
	p = 1
	m = 6
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
		lWeaponHash = vendorGear[c]['Response']['sales']['data'][salesListGear[c][w + 5 - c]]['itemHash']
		lWeaponData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponHash) + "/?lc=ja", headers=headers).json()
		lWeaponName = lWeaponData['Response']['displayProperties']['name']
		
		print("　" + lWeaponName)
		tweetText += "• " + lWeaponName + "\n"
			
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

		## 価格挿入
		draw.multiline_text((80 + shift_x, 295 + shift_y), "価格:", fill=(255, 255, 255), font=fontN)
		baseImg.paste(coinImg, (147 + shift_x, 295 + shift_y))
		itemCost = vendorGear[c]['Response']['sales']['data'][salesListGear[c][w + 5 - c]]['costs'][0]['quantity']
		draw.multiline_text((187 + shift_x, 293 + shift_y), "x" + str(itemCost), fill=(255, 255, 255), font=fontB0)

		## 内在特性挿入
		# 画像挿入
		lWeaponFrameHash = lWeaponData['Response']['sockets']['socketEntries'][0]['singleInitialItemHash']
		lWeaponFrameData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponFrameHash) + "/?lc=ja", headers=headers).json()
		lWeaponFramePath = lWeaponFrameData['Response']['displayProperties']['icon']
		lWeaponFrameName = lWeaponFrameData['Response']['displayProperties']['name']
		lWeaponFrameImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponFramePath).content)).convert("RGBA")

		lWeaponFrameImg = lWeaponFrameImg.resize((80, 80), 1)
		baseImg.paste(lWeaponFrameImg, (85 + shift_x, 339 + shift_y), lWeaponFrameImg)
		draw.multiline_text((178 + shift_x, 361 + shift_y), lWeaponFrameName, fill=(255, 255, 255), font=fontB0)

		## マスターワークアイコン挿入
		# パスから画像・ウォーターマークを取得
		lWeaponMWHash = vendorGear[c]['Response']['itemComponents']['sockets']['data'][salesListGear[c][w + 5 - c]]['sockets'][7]['plugHash']
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
		baseImg.paste(lWeaponMW, (505 + shift_x, 349 + shift_y))

		# パーク挿入
		for i in range(1, 6):
			try:
				perkQuantity = len(vendorGear[c]['Response']['itemComponents']['reusablePlugs']['data'][salesListGear[c][w + 5 - c]]['plugs'][str(i)])
				if perkQuantity > perkMax: perkMax = perkQuantity
			except KeyError:
				perkQuantity = 1
			for r in range(perkQuantity):
				if i == 5:
					s = 11
				else:
					s = i
				try:
					if perkQuantity == 1:
						lWeaponPerkHash = vendorGear[c]['Response']['itemComponents']['sockets']['data'][salesListGear[c][w + 5 - c]]['sockets'][s]['plugHash']
					else:
						lWeaponPerkHash = vendorGear[c]['Response']['itemComponents']['reusablePlugs']['data'][salesListGear[c][w + 5 - c]]['plugs'][str(s)][r]['plugItemHash']
					if lWeaponPerkHash not in [2302094943, 2931483505, 4248210736, 905869860]:
						lWeaponPerkData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lWeaponPerkHash) + "/?lc=ja", headers=headers).json()
						lWeaponPerkPath = lWeaponPerkData['Response']['displayProperties']['icon']
						lWeaponPerkImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + lWeaponPerkPath).content)).convert("RGBA").resize((80, 80), 1)
						baseImg.paste(lWeaponPerkImg, (85 + 105 * (i - 1) + shift_x, 524 + 93 * (r - 1) + shift_y), lWeaponPerkImg)
				# 起源特性が存在しなければpass
				except KeyError:
					pass
				except IndexError:
					pass
			
		# クラス剣専用のループ ハンター剣のハッシュ(2782325300)が当たったら列を増やす
		if lWeaponHash == 2782325300:
			m += 2
			hasClassSword = True
		
		if hasClassSword == True and c != 2:
			c += 1
			
		# 部位ごとにずらす
		if (w % 2) == 0:
			shift_x = 620
		else:
			shift_x = 0
			shift_y += 309 + perkMax * 85
			perkCount += perkMax
			perkMax = 1
		
		if w == 3 or w + 1 == m:
			if w + 1 == m and w % 2 == 0:
				perkCount += perkMax
			imgHeight = 225 + 289 * math.ceil((w + 1 - (p - 1) * 4) / 2) + 90 * perkCount
			baseImg.paste(logoImg, (950, imgHeight - 66), logoImg)
			cropImg = baseImg.crop((0, 0, 1280, imgHeight)).convert("RGB")

			if not isTest:
				cropImg.save(resImg, format='JPEG')
				mediaList.append(tw.postImage(resImg.getvalue()))
			else:
				cropImg.show()
				input("Enterを押すと次のページを表示します。")

			p += 1

		w += 1

	if not isTest:
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
		lArmorHash = vendorGear[c]['Response']['sales']['data'][salesListGear[c][partsOrder[0]]]['itemHash']
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
			lArmorHash = vendorGear[c]['Response']['sales']['data'][salesListGear[c][partsOrder[p]]]['itemHash']
			lArmorData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(lArmorHash) + "/?lc=ja", headers=headers).json()
			lArmorName = lArmorData['Response']['displayProperties']['name']
			
			# 部位ごとにずらす
			if (p % 2) == 1:
				shift_x = 615
			elif p != 0:
				shift_x = 0
				shift_y += 534
			
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
			if len(lArmorName) < 17:
				draw.multiline_text((198 + shift_x, 195 + shift_y), lArmorName, fill=(255, 255, 255), font=fontB0)
			elif len(lArmorName) < 19:
				draw.multiline_text((198 + shift_x, 197 + shift_y), lArmorName, fill=(255, 255, 255), font=fontB0s)
			else:
				draw.multiline_text((198 + shift_x, 198 + shift_y), lArmorName, fill=(255, 255, 255), font=fontB0ss)

			## 防具種挿入
			lArmorArchName = lArmorData['Response']['itemTypeDisplayName']
			draw.multiline_text((198 + shift_x, 237 + shift_y), lArmorArchName, fill=(255, 255, 255), font=fontN)

			## 価格挿入
			draw.multiline_text((80 + shift_x, 295 + shift_y), "価格:", fill=(255, 255, 255), font=fontN)
			baseImg.paste(coinImg, (147 + shift_x, 295 + shift_y))
			itemCost = vendorGear[c]['Response']['sales']['data'][salesListGear[c][partsOrder[p]]]['costs'][0]['quantity']
			draw.multiline_text((187 + shift_x, 293 + shift_y), "x" + str(itemCost), fill=(255, 255, 255), font=fontB0)

			## ステータスグラフ挿入（クラスアイテム以外）
			if p != 4:
				lArmorStats = vendorGear[c]['Response']['itemComponents']['stats']['data'][salesListGear[c][partsOrder[p]]]['stats']

				statsTotal = 0
				for s in range(6):
					draw.rectangle((260 + shift_x, 344 + 50 * s + shift_y, 590 + shift_x, 374 + 50 * s + shift_y), fill=(32, 32, 32))
					draw.rectangle((260 + shift_x, 344 + 50 * s + shift_y, 260 + (330 * (lArmorStats[statsTable[s]]['value'] / 42)) + shift_x, 374 + 50 * s + shift_y), fill=(255, 255, 255))
					draw.text((249 + shift_x, 349 + 50 * s + shift_y), str(lArmorStats[statsTable[s]]['value']), fill=(255, 255, 255), font=fontN, anchor='rt')
					statData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyStatDefinition/" + statsTable[s] + "/?lc=ja", headers=headers).json()
					statPath = statData['Response']['displayProperties']['icon']
					draw.multiline_text((87 + shift_x, 344 + 50 * s + shift_y), statData['Response']['displayProperties']['name'], fill=(255, 255, 255), font=fontN)
					statImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + statPath).content)).convert("RGBA").resize((36, 36), 1)
					baseImg.paste(statImg, (173 + shift_x, 341 + 50 * s + shift_y), statImg)
					statsTotal += lArmorStats[statsTable[s]]['value']
				draw.multiline_text((87 + shift_x, 644 + shift_y), "合計", fill=(255, 255, 255), font=fontN)
				draw.multiline_text((213 + shift_x, 640 + shift_y), str(statsTotal), fill=(255, 255, 255), font=fontB1)
			
		baseImg.paste(logoImg, (950, 1386), logoImg)			
		cropImg = baseImg.crop((0, 0, 1280, 1452)).convert("RGB")
		if not isTest:
			cropImg.save(resImg, format='JPEG')
			mediaList.append(tw.postImage(resImg.getvalue()))
		else:
			cropImg.show()
			input("Enterを押すと次のページを表示します。")

	if not isTest:
		if lArmorSetName[0] == lArmorSetName[1] == lArmorSetName[2]:
			tweetText += "\n防具は「" + lArmorSetName[0] + "」セットが販売されています。"
		else:
			tweetText += "\n防具は「" + lArmorSetName[0] + "」「" + lArmorSetName[1] + "」「" + lArmorSetName[2] + "」セットが販売されています。"

		content = {"text": tweetText, "media": {"media_ids": mediaList}}
		recentTweet = tw.makeThread(content, recentTweet)
		mediaList = []
	
	print("\n情報取得の全工程完了。")
	
	return 0