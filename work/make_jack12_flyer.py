from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


# スクリプト自身の位置から解決する（work/ の親がプロジェクト直下）
ROOT = Path(__file__).resolve().parent.parent
ASSET = ROOT / "assets"
OUT = ROOT / "output" / "pdf"
TMP = ROOT / "tmp" / "pdfs"
OUT.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)

W, H = 2480, 3508
M = 150

COLORS = {
    "ink": (28, 25, 24),
    "paper": (247, 243, 236),
    "soft": (235, 228, 217),
    "burgundy": (112, 22, 31),
    "red": (156, 32, 44),
    "gold": (177, 139, 73),
    "muted": (95, 87, 80),
    "white": (255, 255, 255),
    "black": (8, 8, 8),
}

FONT_REG = "/System/Library/Fonts/ヒラギノ角ゴシック W4.ttc"
FONT_MED = "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc"
FONT_BOLD = "/System/Library/Fonts/ヒラギノ角ゴシック W8.ttc"
FONT_SERIF = "/System/Library/Fonts/ヒラギノ明朝 ProN.ttc"


def font(path, size):
    return ImageFont.truetype(path, size)


F = {
    "eyebrow": font(FONT_MED, 34),
    "title": font(FONT_SERIF, 104),
    "subtitle": font(FONT_MED, 42),
    "body": font(FONT_REG, 34),
    "body_s": font(FONT_REG, 29),
    "body_xs": font(FONT_REG, 24),
    "label": font(FONT_MED, 28),
    "price": font(FONT_BOLD, 52),
    "card_title": font(FONT_BOLD, 39),
    "profile": font(FONT_REG, 28),
    "footer": font(FONT_REG, 22),
}


def cover_crop(img, box, focal=(0.5, 0.5)):
    img = ImageOps.exif_transpose(img).convert("RGB")
    x, y, w, h = box
    src_w, src_h = img.size
    scale = max(w / src_w, h / src_h)
    nw, nh = int(src_w * scale), int(src_h * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    fx, fy = focal
    left = int((nw - w) * fx)
    top = int((nh - h) * fy)
    left = max(0, min(left, nw - w))
    top = max(0, min(top, nh - h))
    return resized.crop((left, top, left + w, top + h))


def fit_crop(img, size, focal=(0.5, 0.5)):
    return cover_crop(img, (0, 0, size[0], size[1]), focal)


def text_size(draw, text, fnt):
    if not text:
        return (0, 0)
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def wrap_text(draw, text, fnt, max_w):
    lines = []
    for para in text.split("\n"):
        line = ""
        for ch in para:
            test = line + ch
            if text_size(draw, test, fnt)[0] <= max_w:
                line = test
            else:
                if line:
                    lines.append(line)
                line = ch
        if line:
            lines.append(line)
    return lines


def draw_multiline(draw, xy, text, fnt, fill, max_w, line_gap=12):
    x, y = xy
    for line in wrap_text(draw, text, fnt, max_w):
        draw.text((x, y), line, font=fnt, fill=fill)
        y += text_size(draw, line, fnt)[1] + line_gap
    return y


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def paste_rounded(base, img, box, radius=36):
    x1, y1, x2, y2 = box
    img = img.resize((x2 - x1, y2 - y1), Image.Resampling.LANCZOS).convert("RGB")
    mask = Image.new("L", img.size, 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, img.size[0], img.size[1]), radius=radius, fill=255)
    base.paste(img, (x1, y1), mask)


def draw_price_card(draw, x, y, w, h, title, price, tag, body, accent):
    rounded(draw, (x, y, x + w, y + h), 22, COLORS["white"], COLORS["soft"], 3)
    draw.rectangle((x, y, x + w, y + 12), fill=accent)
    draw.text((x + 34, y + 38), title, font=F["card_title"], fill=COLORS["ink"])
    draw.text((x + 34, y + 102), price, font=F["price"], fill=accent)
    draw.text((x + 34, y + 166), tag, font=F["label"], fill=COLORS["gold"])
    draw_multiline(draw, (x + 34, y + 220), body, F["body_s"], COLORS["muted"], w - 68, 12)


def generate_mobile_scroll():
    mw, max_h = 1080, 17000
    mm = 54
    canvas = Image.new("RGB", (mw, max_h), COLORS["paper"])
    draw = ImageDraw.Draw(canvas)

    mf = {
        "tag": font(FONT_MED, 24),
        "h1": font(FONT_SERIF, 66),
        "h2": font(FONT_BOLD, 42),
        "h3": font(FONT_BOLD, 31),
        "body": font(FONT_REG, 30),
        "body_s": font(FONT_REG, 25),
        "small": font(FONT_REG, 21),
        "price": font(FONT_BOLD, 43),
        "serif_name": font(FONT_SERIF, 66),
    }

    def ml(x, y, text, fnt, fill=COLORS["ink"], max_w=None, gap=12):
        return draw_multiline(draw, (x, y), text, fnt, fill, max_w or (mw - x - mm), gap)

    def pill(x, y, text, fill, text_fill=COLORS["white"]):
        tw, th = text_size(draw, text, mf["tag"])
        rounded(draw, (x, y, x + tw + 36, y + th + 22), 22, fill)
        draw.text((x + 18, y + 10), text, font=mf["tag"], fill=text_fill)
        return x + tw + 48

    def section(y, label, title, intro=None):
        draw.text((mm, y), label, font=mf["tag"], fill=COLORS["gold"])
        y += 38
        if title:
            y = ml(mm, y, title, mf["h2"], COLORS["ink"], mw - 2 * mm, 10)
        if intro:
            y += 18
            y = ml(mm, y, intro, mf["body"], COLORS["muted"], mw - 2 * mm, 13)
        return y + 34

    def bullet_block(y, items, color=COLORS["burgundy"]):
        for head, body in items:
            draw.ellipse((mm, y + 9, mm + 14, y + 23), fill=color)
            draw.text((mm + 30, y), head, font=mf["h3"], fill=COLORS["ink"])
            y += 44
            y = ml(mm + 30, y, body, mf["body_s"], COLORS["muted"], mw - 2 * mm - 30, 10)
            y += 24
        return y

    def image_card(y, filename, caption, focal=(0.5, 0.5), h=440):
        img = fit_crop(Image.open(ASSET / filename), (mw - 2 * mm, h), focal=focal)
        paste_rounded(canvas, img, (mm, y, mw - mm, y + h), 28)
        draw.text((mm, y + h + 16), caption, font=mf["small"], fill=COLORS["muted"])
        return y + h + 62

    # Hero
    hero_h = 1210
    hero = cover_crop(Image.open(ASSET / "IMG_8274 2.JPG"), (0, 0, mw, hero_h), focal=(0.54, 0.44))
    overlay = Image.new("RGBA", (mw, hero_h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, mw, hero_h), fill=(0, 0, 0, 92))
    od.rectangle((0, 0, mw, int(hero_h * 0.72)), fill=(0, 0, 0, 78))
    canvas.paste(Image.alpha_composite(hero.convert("RGBA"), overlay).convert("RGB"), (0, 0))

    crest = fit_crop(Image.open(ASSET / "IMG_8249 2.JPG"), (118, 118), focal=(0.5, 0.5))
    paste_rounded(canvas, crest, (mm, 54, mm + 118, 172), 20)
    draw.text((mm + 142, 78), "JACK12 PEACE PROGRAM", font=mf["tag"], fill=(235, 220, 184))
    y = 246
    y = ml(mm, y, "世界唯一無二の体験を、\n経営者の学びへ。", mf["h1"], COLORS["white"], mw - 2 * mm, 10)
    y += 28
    y = ml(
        mm,
        y,
        "王族・貴族・国家元首・大統領・国際機関より招請を受けてきたJACK12の現場知を、信頼形成・自己ブランディング・国際的な場づくりへつなげる受講プログラム。",
        mf["body"],
        (245, 239, 228),
        mw - 2 * mm,
        14,
    )
    y += 44
    draw.line((mm, y, mw - mm, y), fill=COLORS["gold"], width=3)
    y += 32
    y = ml(mm, y, "Mission：エンタメと教育で地球平和", mf["h3"], COLORS["white"], mw - 2 * mm, 10)

    # Applicant-first sales positioning
    y = hero_h + 72
    y = section(
        y,
        "FOR APPLICANTS",
        "受講を検討している方へ",
        "このプログラムは、単なる知識講座ではありません。JACK12が国際舞台で培ってきた「人に選ばれる見せ方」「信頼される振る舞い」「上質な場への入り方」を、経営者・事業家の実践に落とし込むための学びです。",
    )
    y = bullet_block(
        y,
        [
            ("自分の価値を、伝わる形に整える", "肩書き・実績・想いを、相手に負担をかけずに信頼へ変えるプロフィール設計を学ぶ。"),
            ("紹介される人になる視座を得る", "国際親善・式典・VIPの場で重視される礼節、第一印象、紹介の受け方・つなぎ方を学ぶ。"),
            ("事業の格を上げる世界観をつくる", "商品やサービスを高単価で選ばれるためのストーリー、写真、言葉、場の見せ方を整える。"),
            ("経営者同士の会話が深まる", "売り込みではなく、理念・信用・未来の可能性から関係が始まるコミュニケーションを目指す。"),
        ],
    )

    y = image_card(y + 8, "IMG_8280 2.JPG", "上質な場での対話・交流を想定したプログラム設計", (0.43, 0.48), 430)

    y = section(y, "WHY JACK12", "高額でも検討される理由", "価格ではなく、得られる視座と個別性で選ぶ講座です。国際舞台での実体験、経営者向けの言語化、上位層に届く印象設計を一つにまとめています。")
    y = bullet_block(
        y,
        [
            ("普通の講座では得にくい現場知", "王族・要人・国際式典・映画祭・公式プログラムなど、実際の舞台で得た経験から学べる。"),
            ("肩書きを“信頼”に変える設計", "強い実績をただ並べるのではなく、相手が自然に興味を持つ順番で伝える力を磨く。"),
            ("経営者のためのブランディング", "講演・顧問・経営者会・教育事業の背景をもとに、事業と個人ブランドを同時に整える。"),
            ("VIP塾は個別伴走型", "マンツーマンで、事業・プロフィール・発信・交流機会の活かし方まで個別に深掘りする。"),
        ],
    )

    # Program cards
    y += 26
    y = section(y, "PROGRAM", "3つの参加スタイル", "まず世界観に触れる、体系的に学ぶ、個別に変える。目的と本気度に合わせて選べます。")
    programs = [
        ("JACK12ピースコミュニティ", "月額 1,320円（税込）", "まずJACK12の世界観に触れたい方へ。\n年間払い 14,400円（税込） / 年間払いの方が1,440円お得。", COLORS["burgundy"]),
        ("JACK12オンライン塾", "550,000円（税込）", "基礎から体系的に学びたい方へ。グループオンライン講座で、ユダヤ人の原理原則レクチャー、信頼形成、自己ブランディングを体系的に学ぶ。", COLORS["red"]),
        ("JACK12 VIP塾", "3,300,000円（税込）", "事業づくりを個別に相談したい方へ。マンツーマンで、原理原則、事業設計、海外王族・要人や日本企業経営者との交流機会の活かし方を深める。", COLORS["black"]),
    ]
    for title, price, desc, accent in programs:
        card_h = 295
        rounded(draw, (mm, y, mw - mm, y + card_h), 24, COLORS["white"], COLORS["soft"], 2)
        draw.rectangle((mm, y, mw - mm, y + 10), fill=accent)
        draw.text((mm + 34, y + 34), title, font=mf["h3"], fill=COLORS["ink"])
        draw.text((mm + 34, y + 86), price, font=mf["price"], fill=accent)
        ml(mm + 34, y + 148, desc, mf["body_s"], COLORS["muted"], mw - 2 * mm - 68, 10)
        y += card_h + 24

    # Executive value
    y += 36
    y = section(y, "VALUE FOR EXECUTIVES", "経営者に届く価値", "華やかな肩書きの紹介に留めず、経営者が自分の事業・人脈・発信力を見直すための実践テーマとして配置します。")
    y = bullet_block(
        y,
        [
            ("国際的な信頼形成の視点", "海外要人・国際式典・親善プログラムの経験をもとに、場づくり、紹介、信頼の積み上げ方を学ぶ。"),
            ("経営者の自己ブランディング", "実績を信頼へ変えるプロフィール設計、肩書きの見せ方、紹介文、登壇・SNSでの印象づくりを扱う。"),
            ("人と場をつなぐ交流設計", "日本企業の経営者、海外関係者、文化・教育領域を横断する活動背景から、事業の可能性を広げる対話を行う。"),
        ],
    )

    # Profile positioning
    y = section(y, "OFFICIAL PROFILE", None, None)
    draw.text((mm, y), "JACK12", font=mf["serif_name"], fill=COLORS["ink"])
    y += 86
    y = ml(mm, y, "地球平和エンターテイナー / Global Peace Entertainer\nJACK12 GLOBAL HOLDINGS 合同会社 CEO", mf["body"], COLORS["burgundy"], mw - 2 * mm, 10)
    y += 26
    y = ml(
        mm,
        y,
        "王様公認で「名誉親善大使」の称号を授かったエンターテイナーです。王族・貴族・国家元首・大統領・国際機関との接点を背景に、国際親善・次世代教育・人権・平和構築へエンターテインメントを通じて貢献しています。",
        mf["body"],
        COLORS["muted"],
        mw - 2 * mm,
        14,
    )

    # Official appointments
    y += 42
    y = section(y, "TRUST 01", "国際親善・公式任命", "バリ島の王様公認の名誉親善大使をはじめ、各国親善大使・国際プログラムでの招聘、出演、実行委員経験を持つことが信頼の土台です。")
    y = bullet_block(
        y,
        [
            ("バリ島名誉親善大使", "バリ島の王様公認。国際親善・文化交流に関わる活動の一環。"),
            ("親善大使・アンバサダー", "AMSグローバルヒマラヤ財団親善大使、Ames Hotelマジシャン大使、ART GRAGE平和親善大使、各種福祉・教育領域のアンバサダー。"),
            ("公式実行委員", "トランプ大統領就任式実行委員会、アフリカ・ジャパン・ナイト、MEC TOKYO 2025などで実行委員を務める。"),
            ("受賞歴", "東久邇宮文化褒賞、東久邇宮記念賞ほか、文化・国際交流領域での表彰歴。"),
        ],
    )
    y = image_card(y, "IMG_8214 2.JPG", "国際機関での活動記録", (0.35, 0.45), 500)

    # Royals and international stages
    y = section(y, "TRUST 02", "王族・要人・国際舞台", "王族関係者、各国大臣、国際式典、カンヌ、モナコ等の場で出演・披露。国際舞台での経験が、活動の大きな背景になっています。")
    y = bullet_block(
        y,
        [
            ("王族・貴族関係者の前で披露", "貴族・ハイアットファミリー御前で披露し、国際的な場で評価を重ねています。"),
            ("王族・国家元首に認められた活動背景", "王族、貴族、国家元首、大統領、国際機関から招請を受けてきた国際親善・文化交流に関わる活動。"),
            ("国際式典・大臣御前での披露", "トランプ大統領就任式関連行事、ネパール日本文化交流プログラム、スリランカ観光大臣御前、タイのロイヤルファミリー関連表彰など。"),
            ("カンヌ・モナコ・Forbes関連の舞台", "カンヌ国際映画祭レッドカーペット、モナコ公室主催『薔薇の舞踏会』、Forbes Villa Party & Dinner、フランス貴族主催パーティー等での参加・出演。"),
        ],
    )
    y = image_card(y, "IMG_8246 2.JPG", "カンヌ国際映画祭での活動記録", (0.5, 0.5), 470)
    y = image_card(y, "IMG_8252 2.JPG", "国際式典参加証明", (0.5, 0.55), 520)

    # Business and education
    y = section(y, "TRUST 03", "経営者向け価値", "JACK12自身のCEO、顧問、経営者会役員、教育事業、国際ブランディングの経験を、経営者向けの学びに接続します。")
    y = bullet_block(
        y,
        [
            ("CEO・事業運営", "JACK12 GLOBAL HOLDINGS合同会社 CEO。GF White Beachリゾートプロジェクト ホテル代表/CEO、GF共鳴会合同会社 業務執行社員、ジュエリー事業など。"),
            ("顧問・経営者会", "株式会社オーリス顧問、Born corporation顧問、年商億以上経営者会（PMA）役員、EPM大阪初代会長、Enishi経営者会 大阪会長、真心磨会 副会長。"),
            ("教育・ブランディング", "企業向け講演・研修・国際ショー、経営者・富裕層向けブランディング、JACK12塾主宰、次世代教育・不登校支援・発達障害支援。"),
            ("映画・表現活動", "映画プロデューサー / 俳優。『冤罪のつくりかた』『カメレオン』『西成ゴローの4億円』関連実績など、表現と社会貢献を横断。"),
        ],
    )
    y = image_card(y, "IMG_8204 2.JPG", "国際表彰・証明資料の一例", (0.5, 0.55), 500)

    # Decision support for warm prospects
    y += 44
    rounded(draw, (mm, y, mw - mm, y + 700), 28, COLORS["ink"])
    draw.text((mm + 34, y + 36), "どのコースを選ぶか", font=mf["h2"], fill=COLORS["white"])
    next_y = y + 112
    decision_items = [
        ("まず世界観に触れたい", "JACK12ピースコミュニティ"),
        ("とにかく学び、発信や考え方を整えたい", "JACK12オンライン塾"),
        ("一緒にビジネスを考え、紹介され方まで個別に変えたい", "JACK12 VIP塾"),
    ]
    for head, body in decision_items:
        draw.ellipse((mm + 34, next_y + 10, mm + 48, next_y + 24), fill=COLORS["gold"])
        draw.text((mm + 64, next_y), head, font=mf["h3"], fill=COLORS["white"])
        next_y += 45
        next_y = ml(mm + 64, next_y, body, mf["body"], (235, 220, 184), mw - 2 * mm - 98, 10)
        next_y += 24
    next_y += 10
    draw.line((mm + 34, next_y, mw - mm - 34, next_y), fill=(102, 91, 80), width=2)
    next_y += 34
    next_y = ml(
        mm + 34,
        next_y,
        "高額講座を選ぶ基準は、知識量だけではなく「自分の事業・プロフィール・人とのつながり方が、どこまで具体的に変わるか」です。特にVIP塾は、JACK12の実体験をもとに、受講者本人の現在地に合わせて深く設計していく最上位プログラムです。",
        mf["body_s"],
        (223, 216, 207),
        mw - 2 * mm - 68,
        11,
    )
    y += 770

    final = canvas.crop((0, 0, mw, y))
    png_path = OUT / "jack12_mobile_scroll_profile.png"
    pdf_path = OUT / "jack12_mobile_scroll_profile.pdf"
    final.save(png_path, "PNG", dpi=(300, 300))
    final.save(pdf_path, "PDF", resolution=300.0)
    print(pdf_path)
    print(png_path)


def main():
    canvas = Image.new("RGB", (W, H), COLORS["paper"])
    draw = ImageDraw.Draw(canvas)

    # Subtle paper bands.
    draw.rectangle((0, 0, W, H), fill=COLORS["paper"])
    draw.rectangle((0, 1590, W, 2310), fill=(251, 249, 245))

    hero_h = 1440
    hero = Image.open(ASSET / "IMG_8274 2.JPG")
    hero = cover_crop(hero, (0, 0, W, hero_h), focal=(0.46, 0.45))
    overlay = Image.new("RGBA", (W, hero_h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, W, hero_h), fill=(0, 0, 0, 74))
    od.rectangle((0, 0, int(W * 0.56), hero_h), fill=(0, 0, 0, 116))
    hero = Image.alpha_composite(hero.convert("RGBA"), overlay).convert("RGB")
    canvas.paste(hero, (0, 0))

    # Crest mark.
    crest = Image.open(ASSET / "IMG_8249 2.JPG")
    crest = fit_crop(crest, (168, 148), focal=(0.5, 0.5))
    paste_rounded(canvas, crest, (M, 108, M + 168, 256), 22)
    draw.rectangle((M + 188, 132, M + 191, 232), fill=COLORS["gold"])

    draw.text((M + 220, 120), "JACK12 PEACE PROGRAM", font=F["eyebrow"], fill=(235, 220, 184))
    draw.text((M, 415), "経営者の視座を、", font=F["title"], fill=COLORS["white"])
    draw.text((M, 535), "世界と人の縁でひらく。", font=F["title"], fill=COLORS["white"])
    draw_multiline(
        draw,
        (M, 720),
        "国際親善・教育・経営・エンターテインメントを横断してきたJACK12による、学びと交流のプログラム。",
        F["subtitle"],
        (245, 239, 228),
        1080,
        18,
    )
    draw.line((M, 930, M + 820, 930), fill=COLORS["gold"], width=3)
    draw.text((M, 980), "Mission", font=F["label"], fill=(235, 220, 184))
    draw.text((M, 1025), "エンタメと教育で地球平和", font=F["subtitle"], fill=COLORS["white"])
    draw.text((M, 1130), "対象：経営者・事業責任者・海外展開や自己ブランディングを深めたい方", font=F["body_s"], fill=(245, 239, 228))

    # Three program cards.
    section_y = 1538
    draw.text((M, section_y), "3つの参加スタイル", font=F["subtitle"], fill=COLORS["ink"])
    draw.text((M, section_y + 60), "まず世界観に触れ、必要に応じて深く学び、個別伴走へ進む設計です。", font=F["body"], fill=COLORS["muted"])

    card_y = section_y + 145
    card_w = int((W - 2 * M - 58) / 3)
    card_h = 580
    draw_price_card(
        draw,
        M,
        card_y,
        card_w,
        card_h,
        "ピースコミュニティ",
        "月額 1,320円",
        "年間 14,400円（税込）",
        "JACK12の理念・活動・学びに継続して触れる入口。年間払いは月額払いより1,440円お得。",
        COLORS["burgundy"],
    )
    draw_price_card(
        draw,
        M + card_w + 29,
        card_y,
        card_w,
        card_h,
        "オンライン塾",
        "550,000円",
        "グループオンライン講座",
        "基礎から体系的に学びたい方へ。ユダヤ人の原理原則レクチャー、信頼形成、自己ブランディングを体系的に学ぶ。",
        COLORS["red"],
    )
    draw_price_card(
        draw,
        M + (card_w + 29) * 2,
        card_y,
        card_w,
        card_h,
        "VIP塾",
        "3,300,000円",
        "マンツーマンセッション",
        "事業づくりを個別に相談したい方へ。事業・ブランド・国際展開を個別に対話し、交流機会の活かし方を深める。",
        COLORS["black"],
    )

    # Profile and credibility images.
    profile_y = 2350
    draw.text((M, profile_y), "Host Profile", font=F["eyebrow"], fill=COLORS["gold"])
    draw.text((M, profile_y + 58), "JACK12", font=font(FONT_SERIF, 82), fill=COLORS["ink"])
    draw.text((M, profile_y + 160), "地球平和エンターテイナー / JACK12 GLOBAL HOLDINGS合同会社 CEO", font=F["body"], fill=COLORS["burgundy"])
    profile_text = (
        "王族・貴族・国際機関等との国際親善、教育、エンターテインメント、経営の現場を横断して活動。"
        "本プログラムでは、その実体験をもとに、参加者が自分の事業と人生の視点を深めるための案内役として、対話と学びの場を設計します。"
    )
    draw_multiline(draw, (M, profile_y + 225), profile_text, F["profile"], COLORS["muted"], 1130, 14)

    thumb_specs = [
        ("IMG_8214 2.JPG", "国際機関での活動", (0.35, 0.45)),
        ("IMG_8252 2.JPG", "国際式典参加証明", (0.5, 0.55)),
        ("IMG_8246 2.JPG", "カンヌでの実績", (0.5, 0.5)),
    ]
    tx = W - M - 840
    ty = profile_y + 18
    tw, th = 260, 335
    for i, (name, cap, focal) in enumerate(thumb_specs):
        img = fit_crop(Image.open(ASSET / name), (tw, th), focal=focal)
        x = tx + i * (tw + 28)
        paste_rounded(canvas, img, (x, ty, x + tw, ty + th), 24)
        draw.text((x, ty + th + 22), cap, font=F["footer"], fill=COLORS["muted"])

    # Trust and decision footer.
    foot_y = 3245
    draw.line((M, foot_y - 42, W - M, foot_y - 42), fill=COLORS["soft"], width=4)
    draw.text((M, foot_y), "受講判断の目安", font=F["label"], fill=COLORS["ink"])
    draw.text((M + 285, foot_y - 2), "世界観に触れる / 体系的に学ぶ / 個別に事業とブランドを深める", font=F["body_s"], fill=COLORS["burgundy"])
    note = "各プログラムは内容・参加条件をご確認のうえお申し込みください。人脈形成、商談成立、成果を保証するものではありません。価格はすべて税込です。"
    draw_multiline(draw, (M, foot_y + 58), note, F["footer"], COLORS["muted"], W - 2 * M, 8)

    png_path = OUT / "jack12_peace_program_flyer.png"
    pdf_path = OUT / "jack12_peace_program_flyer.pdf"
    canvas.save(png_path, "PNG", dpi=(300, 300))
    canvas.save(pdf_path, "PDF", resolution=300.0)
    print(pdf_path)
    print(png_path)


if __name__ == "__main__":
    main()
    generate_mobile_scroll()
