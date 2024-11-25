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

def getNightfall(isTest=False):
	if isTest:
		print("テストモードで実行中。")

	# 頻出する辞書とリストの定義
	ignoreMods = {4226469317, 1783825372, 745014575, 791047754, 4265630562, 4239965093, 3912996116, 3101164718}
	shields = { 93790318, 720259466, 1111960127, 1377274412, 1444852954, 1553093202, 1651706850, 2288210988, 2524382624, 2585386105, 2650740350, 2833087500, 2965677044, 3119632620, 3139381566, 3171609188, 3230561446, 3538098588, 3958417570 }
	champions = {40182179, 197794292, 438106166, 1262171714, 1598783516, 1615778293, 1806568190, 1990363418, 2006149364, 2475764450, 3307318061, 3461252634, 4038464106, 4190795159}
	threats = {186409259, 512042454, 1598472557, 3517267764, 3652821947}
	surges = {426976067, 2691200658, 3196075844, 3809788899, 3810297122}
	overcharges = {95459596, 214700178, 795009574, 929044687, 1282934989, 1326581064, 2178457119, 2626834038, 2743796883, 2984170047, 3132780533, 3320777106, 3406250074, 3758645512}

	# 画像生成用のフォント定義
	fontN = ImageFont.truetype('./.font/GenEiGothicN-Regular.otf', 25)
	fontB0 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 28)
	fontB1 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 32)
	fontB2 = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 40)
	fontTitle = ImageFont.truetype('./.font/GenEiGothicN-Bold.otf', 56)
	logoImg = Image.open("./img/logo_full.png").resize((300, 46), 1)

	### アクセスに必要なトークンを取得 ###
	auth.getBungieAccessToken()

	#### 基本データの取得 ####
	# ヘッダーにAPIキーとアクセストークンを設定
	load_dotenv()
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
		activityData = requests.get("https://www.bungie.net/Platform/Destiny2/Milestones/?lc=ja", headers=headers).json()
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
		
	nightfallHash = activityData['Response']['2029743966']['activities'][-1]['activityHash']
	nightfallData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityDefinition/" + str(nightfallHash) + "/?lc=ja", headers=headers).json()
	
	modifiers = set(activityData['Response']['2029743966']['activities'][-1]['modifierHashes'])
	modifiers -= ignoreMods
	if 1171597537 in modifiers:
		doubleReward = True
		modifiers -= {1171597537}

	# 各種情報の取得
	nightfallName = nightfallData['Response']['displayProperties']['description']

	shieldHash = list(modifiers & shields)[0]
	shieldData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(shieldHash) + "/?lc=ja", headers=headers).json()
	shieldPath = shieldData['Response']['displayProperties']['icon']
	modifiers -= modifiers & shields

	championHash = list(modifiers & champions)[0]
	championData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(championHash) + "/?lc=ja", headers=headers).json()
	championPath = championData['Response']['displayProperties']['icon']
	modifiers -= modifiers & champions

	currentThreat = list(modifiers & threats)
	if currentThreat:
		threatHash = currentThreat[0]
		threatData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(threatHash) + "/?lc=ja", headers=headers).json()
		threatPath = threatData['Response']['displayProperties']['icon']
	modifiers -= modifiers & threats

	currentSurge = list(modifiers & surges)
	surge1Hash = currentSurge[0]
	surge2Hash = currentSurge[1]

	surge1Data = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(surge1Hash) + "/?lc=ja", headers=headers).json()
	surge1Path = surge1Data['Response']['displayProperties']['icon']

	surge2Data = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(surge2Hash) + "/?lc=ja", headers=headers).json()
	surge2Path = surge2Data['Response']['displayProperties']['icon']

	ocHash = list(modifiers & overcharges)[0]
	ocData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(ocHash) + "/?lc=ja", headers=headers).json()
	ocPath = ocData['Response']['displayProperties']['icon']

	specialMods = list(modifiers)
	for specialModHash in specialMods:
		specialModData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityModifierDefinition/" + str(specialModHash) + "/?lc=ja", headers=headers).json()
		specialModPath = specialModData['Response']['displayProperties']['icon']
		specialModName = specialModData['Response']['displayProperties']['name']
		specialModDesc = specialModData['Response']['displayProperties']['description']

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

	weaponOrder = vendorData['Response']['categories']['data']['categories'][2]['itemIndexes'][0]
	weaponHash = vendorData['Response']['sales']['data'][str(weaponOrder)]['itemHash']
	weaponData = requests.get("https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/" + str(weaponHash) + "/?lc=ja", headers=headers).json()

	weaponName = weaponData['Response']['displayProperties']['name']
	weaponSpec = weaponData['Response']['itemTypeDisplayName']
	
	tweetText = ""
	mediaList = []

	# ツイート用の文章を整形
	tweetText = "【 #ナイトフォール 情報】" + todayDateStr + "\n今週のナイトフォールは「" + nightfallName + "」です。\n\n報酬: " + weaponName + "（" + weaponSpec + "）"
	if doubleReward:
		tweetText += "\n今週はドロップする報酬が2倍となっています。"
	tweetText += "\n\n戦闘条件など、詳細は画像をご確認ください。\n\n#Destiny2"
	
	print(tweetText + "\n")

	# 画像生成
	imageURL = nightfallData['Response']['pgcrImage']
	image = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + imageURL).content)).convert('RGBA')
	image = ImageEnhance.Brightness(image).enhance(0.78)
	mask = Image.open("./img/mask.png")

	baseImg = Image.alpha_composite(image, mask)
	
	resImg = io.BytesIO()
	draw = ImageDraw.Draw(baseImg)

	draw.text((43, 39), "ナイトフォール", fill=(255, 255, 255), font=fontB2)
	draw.text((353, 50), "(" + todayDateStr + " ～ " + endDateStr + ")", fill=(255, 255, 255), font=fontB0)
	draw.text((43, 118), nightfallName, fill=(255, 255, 255), font=fontTitle)
	baseImg.paste(logoImg, (935, 45), logoImg)
	
	specialModImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + specialModPath).content)).convert("RGBA").resize((60, 60), 1)
	baseImg.paste(specialModImg, (35, 223), specialModImg)
	draw.text((115, 234), specialModName, fill=(255, 255, 255), font=fontB1)
	draw.text((53, 304), specialModDesc, fill=(255, 255, 255), font=fontN)

	draw.multiline_text((35, 360), "＜戦闘条件＞", fill=(255, 255, 255), font=fontB1)

	draw.text((35, 415), "シールド", fill=(255, 255, 255), font=fontB0)
	shieldImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + shieldPath).content)).convert("RGBA").resize((80, 80), 1)
	baseImg.paste(shieldImg, (46, 460), shieldImg)

	draw.text((193, 416), "脅威", fill=(255, 255, 255), font=fontB0)
	if currentThreat:
		threatImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + threatPath).content)).convert("RGBA").resize((80, 80), 1)
		baseImg.paste(threatImg, (180, 460), threatImg)

	draw.text((70, 555), "チャンピオン", fill=(255, 255, 255), font=fontB0)
	championImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + championPath).content)).convert("RGBA").resize((80, 80), 1)
	baseImg.paste(championImg, (113, 600), championImg)

	draw.text((384, 415), "サージ", fill=(255, 255, 255), font=fontB0)
	surge1Img = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + surge1Path).content)).convert("RGBA").resize((80, 80), 1)
	surge2Img = Image.open(io.BytesIO(requests.get("https://www.bungie.net" + surge2Path).content)).convert("RGBA").resize((80, 80), 1)
	baseImg.paste(surge1Img, (339, 460), surge1Img)
	baseImg.paste(surge2Img, (429, 460), surge2Img)

	draw.text((314, 555), "オーバーチャージ", fill=(255, 255, 255), font=fontB0)
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
	draw.multiline_text((770, 485), weaponName, fill=(255, 255, 255), font=fontB0)
	
	## 弾薬アイコン挿入
	if weaponData['Response']['equippingBlock']['ammoType'] == 1:
		weaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/99f3733354862047493d8550e46a45ec.png").content)).convert("RGBA").resize((50, 50), 1)
	elif weaponData['Response']['equippingBlock']['ammoType'] == 2:
		weaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/d920203c4fd4571ae7f39eb5249eaecb.png").content)).convert("RGBA").resize((50, 50), 1)
	elif weaponData['Response']['equippingBlock']['ammoType'] == 3:
		weaponAmmoImg = Image.open(io.BytesIO(requests.get("https://www.bungie.net/common/destiny2_content/icons/78ef0e2b281de7b60c48920223e0f9b1.png").content)).convert("RGBA").resize((50, 50), 1)
	baseImg.paste(weaponAmmoImg, (764, 517), weaponAmmoImg)

	## 武器種挿入
	weaponArchName = weaponData['Response']['itemTypeDisplayName']
	draw.multiline_text((822, 526), weaponArchName, fill=(255, 255, 255), font=fontN)
	
	draw.text((1250, 680), "＊ 玄人クリアで、上記武器の“新・”版がドロップします。", fill=(255, 255, 255), font=fontN, anchor='rb')

	if not isTest:
		baseImg.convert("RGB").save(resImg, format='JPEG')
		mediaList.append(tw.postImage(resImg.getvalue()))
		
		content = {"text": tweetText, "media": {"media_ids": mediaList}}
		tweetID = tw.makeTweet(content)
		tw.pinTweet(tweetID)
	else:
		baseImg.show()

	print("\n情報取得の全工程完了。")
	
	return 0