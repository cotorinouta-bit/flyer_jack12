"""JACK12 フライヤー v2

ターゲット: 人とのつながりを重視する経営者（ネットワークビジネス界隈）。
リード軸: ご縁・人とのつながり。
2トーン（elegant / passion）× 2成果物（A4チラシ / 縦長スクロール）= 4種を生成する。

事実情報（実績・料金）は両トーン共通。差し替えるのは配色とコピーの感情の振り方のみ。
"""

import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


# スクリプト自身の位置から解決する（work/ の親がプロジェクト直下）
ROOT = Path(__file__).resolve().parent.parent
ASSET = ROOT / "assets"
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 2480, 3508  # A4 @ 300dpi
M = 150

COLORS = {
    "ink": (28, 25, 24),
    "paper": (247, 243, 236),
    "soft": (235, 228, 217),
    "burgundy": (112, 22, 31),
    "red": (156, 32, 44),
    "gold": (177, 139, 73),
    "gold_lt": (214, 178, 112),
    "muted": (95, 87, 80),
    "white": (255, 255, 255),
    "black": (8, 8, 8),
    "cream": (245, 239, 228),
}

FONT_REG = "/System/Library/Fonts/ヒラギノ角ゴシック W4.ttc"
FONT_MED = "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc"
FONT_BOLD = "/System/Library/Fonts/ヒラギノ角ゴシック W8.ttc"
FONT_SERIF = "/System/Library/Fonts/ヒラギノ明朝 ProN.ttc"


def font(path, size):
    return ImageFont.truetype(path, size)


# ===== 描画ヘルパー =====================================================

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


# 行頭に置かない文字（前のatomに結合させ、行頭・語内分断を防ぐ）
_NO_LINE_START = set(
    "、。，．・！？）」』】｝〕〉》”’%‐-—…ー〜ゝゞヽヾ々"
    "ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ"
)
# 行末に取り残さない開き括弧（後続atomに結合）
_OPEN_BRACKET = set("（「『【｛〔〈《“‘([{")
# この文字で終わるatomの直後は改行してよい（句読点・区切り）
_BREAK_AFTER = set("、。，．・！？／…—〜：；）」』】%")
# ラテン文字・数字・語中記号（連続を1語とみなし、語内では改行しない）
_LATIN_RE = re.compile(r"[0-9A-Za-zＡ-Ｚａ-ｚ０-９.,/&:'’\-]")
# 数字の直後に結合させる単位
_NUM_UNIT = set("円万億千百％%")


def _tokenize(s):
    atoms = []
    for ch in s:
        if ch in (" ", "　"):
            atoms.append(ch)
        elif atoms and _LATIN_RE.match(ch) and _LATIN_RE.match(atoms[-1][-1]):
            atoms[-1] += ch                       # 連続するラテン/数字を結合
        elif atoms and ch in _NUM_UNIT and atoms[-1][-1].isdigit():
            atoms[-1] += ch                       # 数字＋単位を結合
        elif atoms and ch in _NO_LINE_START:
            atoms[-1] += ch                       # 行頭禁則文字は前に付ける
        else:
            atoms.append(ch)
    # 開き括弧は次のatomに結合（行末に取り残さない）
    merged, i = [], 0
    while i < len(atoms):
        a = atoms[i]
        if a and a[-1] in _OPEN_BRACKET and i + 1 < len(atoms):
            merged.append(a + atoms[i + 1]); i += 2
        else:
            merged.append(a); i += 1
    return merged


def _split_wide(draw, atom, fnt, max_w):
    # 1語で幅を超える場合のみ、最後の手段として文字単位で割る（長い英単語など稀）
    segs, cur = [], ""
    for ch in atom:
        if not cur or text_size(draw, cur + ch, fnt)[0] <= max_w:
            cur += ch
        else:
            segs.append(cur); cur = ch
    if cur:
        segs.append(cur)
    return segs


def _last_break(line):
    # line[:idx] で切ってよい最後の位置。区切り文字の直後、または空白の前後。
    for j in range(len(line) - 1, 0, -1):
        prev = line[j - 1]
        if prev in (" ", "　"):
            return j
        if prev and prev[-1] in _BREAK_AFTER:
            return j
    return 0


def wrap_text(draw, text, fnt, max_w):
    """文節（句読点・区切り）優先で折り返す。英数字・数値の語は割らず、行頭禁則も処理。"""
    def W(atoms):
        return text_size(draw, "".join(atoms), fnt)[0]

    out = []
    for para in text.split("\n"):
        line = []
        for a in _tokenize(para):
            line.append(a)
            if len(line) == 1 and len(a) > 1 and W(line) > max_w:
                segs = _split_wide(draw, a, fnt, max_w)
                out.extend(segs[:-1]); line = [segs[-1]]
                continue
            while len(line) > 1 and W(line) > max_w:
                cut = _last_break(line)
                if cut <= 0:
                    cut = len(line) - 1            # 区切りが無ければ語境界で改行
                out.append("".join(line[:cut]).strip())
                line = line[cut:]
                if len(line) == 1 and len(line[0]) > 1 and W(line) > max_w:
                    segs = _split_wide(draw, line[0], fnt, max_w)
                    out.extend(segs[:-1]); line = [segs[-1]]
        if line:
            out.append("".join(line).strip())
    return out


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


# ===== トーン定義 ======================================================

TONES = {
    "elegant": {
        "label_color": COLORS["gold"],
        "h1_color": COLORS["white"],
        "divider": COLORS["gold"],
        "primary": COLORS["burgundy"],
        "pill_bg": COLORS["burgundy"],
        "card_accents": [COLORS["burgundy"], COLORS["red"], COLORS["black"]],
        "box_bg": COLORS["ink"],
        "box_accent": COLORS["gold"],
        "scroll_overlay": (78, 92),   # (top band alpha, full alpha)
        "flyer_overlay": (74, 116),   # (full alpha, left band alpha)
    },
    "passion": {
        "label_color": COLORS["red"],
        "h1_color": COLORS["gold_lt"],
        "divider": COLORS["red"],
        "primary": COLORS["red"],
        "pill_bg": COLORS["red"],
        "card_accents": [COLORS["red"], COLORS["burgundy"], COLORS["black"]],
        "box_bg": (24, 18, 18),
        "box_accent": COLORS["gold_lt"],
        "scroll_overlay": (105, 132),
        "flyer_overlay": (104, 150),
    },
}


# ===== コピー（縦長スクロール） ========================================
# 事実セクション（PROGRAM / PROFILE / TRUST）は両トーン共通。
# 感情を振る hero / for / why / decision のみトーン別。

SCROLL_COPY = {
    "elegant": {
        "pill": "",
        "h1": "誰と出会うかで、\n仕事の景色は変わる。",
        "hero_body": "王族や国家元首、国際機関と渡り合ってきたJACK12のご縁。その輪の中で、人とのつながりを軸に事業を広げたい経営者が学び、出会う場です。",
        "for_label": "FOR YOU",
        "for_title": "ご縁を、事業の力に変えたい方へ",
        "for_intro": "誰と出会い、どう信頼され、どんな場に身を置くか。事業の伸びしろは、案外そこで決まります。JACK12が国際舞台で身につけてきた、人から選ばれ紹介されるための考え方と振る舞いを、あなたの事業に落とし込みます。",
        "for_bullets": [
            ("ご縁を、信頼に変える", "肩書きや実績を、押しつけがましくならずに信頼へつなげる。そのためのプロフィールと立ち居振る舞いを見直します。"),
            ("紹介される人になる", "一流の場で重んじられる礼節・第一印象・ご縁のつなぎ方を身につける。"),
            ("商品より先に、あなたが選ばれる", "商品ではなくあなた自身が選ばれる、写真・言葉・場づくりを磨く。"),
            ("経営者同士が深くつながる", "理念と信用が先にあれば、関係は売り込みなしでも続きやすい。その始め方を学びます。"),
        ],
        "why_label": "WHY JACK12",
        "why_title": "出会う相手が、次の一手を変える",
        "why_intro": "選ぶ基準は、価格よりも「誰と出会えるか」。国際舞台での実体験を、経営者が自分の言葉で語れる形にして渡します。上質な場での振る舞い方まで、ここで身につきます。",
        "why_bullets": [
            ("普通では出会えない世界の現場知", "王族や要人を前にした式典、映画祭の現場。そこで実際に起きたことから学べます。"),
            ("肩書きより先に、信頼が伝わる順番", "実績は並べるほど重くなる。相手が興味を持つ順に話す。その組み立てを身につけます。"),
            ("経営者のためのブランディング", "講演や顧問、経営者会、教育事業での経験をもとに、会社の見え方と自分自身の見え方を一緒に磨きます。"),
            ("VIP塾は個別伴走型", "マンツーマンで、事業の組み立てからプロフィール、発信、ご縁の活かし方まで一緒に見ていきます。"),
        ],
        "decision_title": "どのご縁から始めるか",
        "decision_items": [
            ("まず世界観に触れたい", "JACK12ピースコミュニティ"),
            ("じっくり学び、自分を見直したい", "JACK12オンライン塾"),
            ("一緒に事業を考え、紹介され方まで変えたい", "JACK12 VIP塾"),
        ],
        "decision_note": "講座選びで見るべきは、知識の量よりも「自分の事業やプロフィール、人とのつながり方が実際にどう変わるか」。なかでもVIP塾は、JACK12の実体験をもとに、一人ひとりの状況に合わせて内容を組み立てる最上位プログラムです。",
    },
    "passion": {
        "pill": "",
        "h1": "この出会いから、\n流れが変わる。",
        "hero_body": "王族とも、各国の要人とも。JACK12が本気でつないできたご縁が、ここにあります。同じ志の経営者と出会い、互いに刺激を受けながら前に進む場です。",
        "for_label": "FOR YOU",
        "for_title": "ご縁が、次の挑戦を押し上げる",
        "for_intro": "誰と出会うかで流れは変わる。人とのつながりで道をひらいてきたあなたなら、肌で分かっているはずです。JACK12が世界の一流と築いてきたご縁を、今度はあなたの事業と仲間のために。",
        "for_bullets": [
            ("出会いの輪が、視野を広げる", "この輪に入ると、付き合う相手が変わり、見えてくるものも変わってきます。"),
            ("一流の現場が、自分を引き上げる", "世界の一流が当たり前にしている振る舞いを間近で知り、自分の立ち位置を一段引き上げます。"),
            ("同じ志の仲間とつながる", "夢と理念で結ばれた経営者の輪なら、売り込み抜きで深い関係を育てていけます。"),
            ("あなた自身が、選ばれる人になる", "写真・言葉・世界観を磨き、人から選ばれ、紹介される自分をつくる。"),
        ],
        "why_label": "WHY JACK12",
        "why_title": "経営者が、ここに集まる理由",
        "why_intro": "価格だけで選ぶ場ではありません。誰と出会えるか、どんな仲間とつながれるか。JACK12が世界の第一線で積んだ実体験と、志を持った経営者が、ここに集まっています。",
        "why_bullets": [
            ("世界の第一線で積んだ、生きた現場の知恵", "王族や要人を前にした式典、映画祭の舞台。そこで実際に起きたことを、余さず伝えます。"),
            ("肩書きを、信頼につながる伝え方へ", "実績を信頼につなげ、また会いたいと思われる話し方を身につけます。"),
            ("夢でつながる経営者の輪", "理念と本気で結ばれた仲間と、高め合いながら事業を広げる。"),
            ("VIP塾はマンツーマン伴走", "あなただけに向き合い、事業の組み立てからご縁の活かし方まで一緒に磨きます。"),
        ],
        "decision_title": "最初のご縁を、どこから結ぶ？",
        "decision_items": [
            ("まずこの世界観に触れたい", "JACK12ピースコミュニティ"),
            ("本気で学び、自分を変えたい", "JACK12オンライン塾"),
            ("一緒に事業をつくり、ご縁を活かし切りたい", "JACK12 VIP塾"),
        ],
        "decision_note": "選ぶときに見てほしいのは、知識の量より「事業やご縁の結び方が、どこまで本気で変わるか」。なかでもVIP塾は、JACK12の実体験をもとに、あなたの今の状況に寄り添って伴走する最上位プログラムです。",
    },
}

# 事実セクション（共通）
PROGRAMS = [
    ("JACK12ピースコミュニティ", "月額 1,320円（税込）", "まずJACK12の世界観に触れたい方へ。\n年間払い 14,400円（税込） / 年間払いの方が1,440円お得。"),
    ("JACK12オンライン塾", "550,000円（税込）", "基礎から体系的に学びたい方へ。グループオンライン講座で、ユダヤ人に伝わる原理原則、人から信頼される考え方、自分の見せ方を順を追って学びます。"),
    ("JACK12 VIP塾", "3,300,000円（税込）", "事業づくりを個別に相談したい方へ。マンツーマンで、原理原則から事業の組み立てまで。海外の王族・要人や日本企業の経営者と出会う機会の生かし方も、一緒に掘り下げます。"),
]

VALUE_BULLETS = [
    ("海外で信頼を築く要点", "海外要人や国際式典、親善プログラムでの経験から、場のつくり方や人の紹介のしかた、信頼の重ね方を学びます。"),
    ("経営者の自己ブランディング", "実績を信頼につなげるプロフィールのつくり方、肩書きの見せ方や紹介文、登壇やSNSでの印象づくりを扱います。"),
    ("人と場を、つなぐ力", "日本企業の経営者から海外の関係者、文化や教育の現場まで。幅広い人脈を生かして、事業の次の一手を一緒に話し合います。"),
]

# 第三者で裏取りできる「現実の実績」（共通）。華やかな国際活動の信頼の土台。
MEDIA_BULLETS = [
    ("テレビ・ラジオ出演", "NHK Eテレ・MBS などのTV・ラジオに出演しています。"),
    ("大阪・関西万博 EXPO 2025 出演", "リッツ・カールトン京都、リーガロイヤルホテル京都ほか一流ホテル・式典での公演実績があります。"),
    ("競技マジックで日本代表", "アジア国際大会（深圳）で日本代表ファイナリストに選出。日本マジック教育普及協会 理事・師範。"),
]

TRUST01 = [
    ("バリ島名誉親善大使", "バリ島の王様公認。国際親善・文化交流に関わる活動の一環。"),
    ("親善大使・アンバサダー", "AMSグローバルヒマラヤ財団親善大使、Ames Hotelマジシャン大使、ART GRAGE平和親善大使、各種福祉・教育領域のアンバサダー。"),
    ("公式実行委員", "トランプ大統領就任式実行委員会、アフリカ・ジャパン・ナイト、MEC TOKYO 2025などで実行委員を務める。"),
    ("受賞歴", "東久邇宮文化褒賞、東久邇宮記念賞ほか、文化・国際交流領域での表彰歴。"),
]

TRUST02 = [
    ("王族・貴族関係者の前で披露", "貴族・ハイアットファミリー御前で披露し、国際的な場で評価を重ねています。"),
    ("王族・国家元首に認められた活動背景", "王族、貴族、国家元首、大統領、国際機関から招請を受けてきた国際親善・文化交流に関わる活動。"),
    ("国際式典・大臣御前での披露", "トランプ大統領就任式関連行事、ネパール日本文化交流プログラム、スリランカ観光大臣御前、タイのロイヤルファミリー関連表彰など。"),
    ("カンヌ・モナコ・Forbes関連の舞台", "カンヌ国際映画祭レッドカーペット、モナコ公室主催『薔薇の舞踏会』、Forbes Villa Party & Dinner、フランス貴族主催パーティー等での参加・出演。"),
]

TRUST03 = [
    ("CEO・事業運営", "JACK12 GLOBAL HOLDINGS合同会社 CEO。GF White Beachリゾートプロジェクト ホテル代表/CEO、GF共鳴会合同会社 業務執行社員、ジュエリー事業など。"),
    ("顧問・経営者会", "株式会社オーリス顧問、Born corporation顧問、年商億以上経営者会（PMA）役員、EPM大阪初代会長、Enishi経営者会 大阪会長、真心磨会 副会長。"),
    ("教育・ブランディング", "企業向け講演・研修・国際ショー、経営者・富裕層向けブランディング、JACK12塾主宰、次世代教育・不登校支援・発達障害支援。"),
    ("映画・表現活動", "映画プロデューサー / 俳優。『冤罪のつくりかた』『カメレオン』『西成ゴローの4億円』関連実績など、表現と社会貢献を横断。"),
]

DISCLAIMER = "本資料は公開用情報をもとに構成しています。人脈形成、商談成立、成果を保証するものではありません。価格はすべて税込です。"


# ===== 縦長スクロール生成 ==============================================

def build_scroll(tone):
    style = TONES[tone]
    copy = SCROLL_COPY[tone]
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
        draw.text((mm, y), label, font=mf["tag"], fill=style["label_color"])
        y += 38
        if title:
            y = ml(mm, y, title, mf["h2"], COLORS["ink"], mw - 2 * mm, 10)
        if intro:
            y += 18
            y = ml(mm, y, intro, mf["body"], COLORS["muted"], mw - 2 * mm, 13)
        return y + 34

    def bullet_block(y, items, color=None):
        color = color or style["primary"]
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

    def image_pair(y, left, right, fh=620):
        # 縦写真は縦フレームに収め、顔の水平スライス切れを防ぐ。各要素=(filename, caption, focal)
        gap = 24
        fw = (mw - 2 * mm - gap) // 2
        cap_bottom = y + fh
        for i, (fn, cap, foc) in enumerate([left, right]):
            x = mm + i * (fw + gap)
            img = fit_crop(Image.open(ASSET / fn), (fw, fh), focal=foc)
            paste_rounded(canvas, img, (x, y, x + fw, y + fh), 24)
            yy = ml(x, y + fh + 12, cap, mf["small"], COLORS["muted"], fw, 6)
            cap_bottom = max(cap_bottom, yy)
        return cap_bottom + 40

    def image_single(y, fn, cap, foc, fw=560, fh=700):
        x = (mw - fw) // 2
        img = fit_crop(Image.open(ASSET / fn), (fw, fh), focal=foc)
        paste_rounded(canvas, img, (x, y, x + fw, y + fh), 24)
        yy = ml(x, y + fh + 12, cap, mf["small"], COLORS["muted"], fw, 6)
        return yy + 40

    # --- Hero ---
    top_a, full_a = style["scroll_overlay"]
    hero_h = 1210
    hero = cover_crop(Image.open(ASSET / "IMG_8274 2.JPG"), (0, 0, mw, hero_h), focal=(0.54, 0.44))
    overlay = Image.new("RGBA", (mw, hero_h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, mw, hero_h), fill=(0, 0, 0, full_a))
    od.rectangle((0, 0, mw, int(hero_h * 0.72)), fill=(0, 0, 0, top_a))
    canvas.paste(Image.alpha_composite(hero.convert("RGBA"), overlay).convert("RGB"), (0, 0))

    crest = fit_crop(Image.open(ASSET / "IMG_8249 2.JPG"), (118, 118), focal=(0.5, 0.5))
    paste_rounded(canvas, crest, (mm, 54, mm + 118, 172), 20)
    draw.text((mm + 142, 78), "JACK12 PEACE PROGRAM", font=mf["tag"], fill=(235, 220, 184))
    y = 246
    pill(mm, y, copy["pill"], style["pill_bg"])
    y += 78
    y = ml(mm, y, copy["h1"], mf["h1"], style["h1_color"], mw - 2 * mm, 10)
    y += 28
    y = ml(mm, y, copy["hero_body"], mf["body"], (245, 239, 228), mw - 2 * mm, 14)
    y += 44
    draw.line((mm, y, mw - mm, y), fill=style["divider"], width=3)
    y += 32
    y = ml(mm, y, "ミッション ─ エンタメと教育で、世界に平和を", mf["h3"], COLORS["white"], mw - 2 * mm, 10)

    # --- FOR YOU ---
    y = hero_h + 72
    y = section(y, copy["for_label"], copy["for_title"], copy["for_intro"])
    y = bullet_block(y, copy["for_bullets"])
    y = image_card(y + 8, "IMG_8280 2.JPG", "上質な場での対話と交流を大切にしたプログラムです。", (0.43, 0.48), 430)

    # --- WHY JACK12 ---
    y = section(y, copy["why_label"], copy["why_title"], copy["why_intro"])
    y = bullet_block(y, copy["why_bullets"])

    # --- MEDIA & STAGE（検証できる実績で土台を示す） ---
    y += 16
    y = section(y, "MEDIA & STAGE", "万博出演と受賞歴", "国際活動を支えているのは、メディア出演や受賞、公演など、公開情報として確認できる実績です。")
    y = bullet_block(y, MEDIA_BULLETS)
    y = image_card(y + 4, "IMG_8235 2.JPG", "満員の客席を魅了する公演（ステージ実績）", (0.5, 0.42), 470)
    y = image_card(y, "IMG_8282 2.JPG", "扇子と桜の花びらを操るステージマジック", (0.5, 0.42), 440)

    # --- PROGRAM cards ---
    y += 26
    y = section(y, "PROGRAM", "ご縁の結び方は3通り", "まず雰囲気を知る道、じっくり学ぶ道、二人三脚で取り組む道。\n今の目的に合わせて選べます。")
    for (title, price, desc), accent in zip(PROGRAMS, style["card_accents"]):
        card_h = 295
        rounded(draw, (mm, y, mw - mm, y + card_h), 24, COLORS["white"], COLORS["soft"], 2)
        draw.rectangle((mm, y, mw - mm, y + 10), fill=accent)
        draw.text((mm + 34, y + 34), title, font=mf["h3"], fill=COLORS["ink"])
        draw.text((mm + 34, y + 86), price, font=mf["price"], fill=accent)
        ml(mm + 34, y + 148, desc, mf["body_s"], COLORS["muted"], mw - 2 * mm - 68, 10)
        y += card_h + 24

    # --- VALUE ---
    y += 36
    y = section(y, "VALUE FOR EXECUTIVES", "経営にどう活きるか", "華やかな肩書きを眺めて終わりにはしません。自社の事業、人とのつながり、発信のしかた。経営者が自分の手元を見直すきっかけになるよう組んでいます。")
    y = bullet_block(y, VALUE_BULLETS)

    # --- PROFILE ---
    y = section(y, "OFFICIAL PROFILE", None, None)
    draw.text((mm, y), "JACK12", font=mf["serif_name"], fill=COLORS["ink"])
    y += 86
    y = ml(mm, y, "地球平和エンターテイナー / Global Peace Entertainer\nJACK12 GLOBAL HOLDINGS 合同会社 CEO", mf["body"], style["primary"], mw - 2 * mm, 10)
    y += 26
    y = ml(mm, y, "バリ島の王様公認で「名誉親善大使」の称号を授かったエンターテイナーです。王族や国家元首、国際機関などとの接点を生かし、エンターテインメントを通じて国際親善や次世代教育、平和構築に取り組んでいます。", mf["body"], COLORS["muted"], mw - 2 * mm, 14)

    # --- TRUST 01 ---
    y += 42
    y = section(y, "TRUST 01", "親善大使としての任命と受賞", "バリ島の王様公認の名誉親善大使をはじめ、各国の親善大使や国際プログラムへの招聘、出演、実行委員、受賞歴。こうした積み重ねが信頼の支えになっています。")
    y = bullet_block(y, TRUST01)
    y = image_pair(
        y,
        ("IMG_8243 2.JPG", "東久邇宮文化褒賞 授与式", (0.5, 0.30)),
        ("IMG_8259 2.JPG", "ASIA GOLDEN STAR AWARD 2024 受賞", (0.5, 0.34)),
    )
    y = image_card(y, "IMG_8196 2.JPG", "各国要人との記念・表彰式にて", (0.5, 0.40), 470)

    # --- TRUST 02 ---
    y = section(y, "TRUST 02", "王族・要人の前に立った舞台", "王族関係者や各国大臣、国際式典、カンヌ、モナコなどの場で出演・披露してきました。こうした国際舞台での経験が、活動の大きな背景になっています。")
    y = bullet_block(y, TRUST02)
    y = image_pair(
        y,
        ("IMG_8246 2.JPG", "カンヌ国際映画祭での活動記録", (0.5, 0.45)),
        ("IMG_8252 2.JPG", "米大統領就任式 参加証明書", (0.5, 0.30)),
    )
    y = image_pair(
        y,
        ("IMG_8217 2.JPG", "スリランカ要人との会談・握手", (0.5, 0.32)),
        ("IMG_8230 2.JPG", "国際晩餐会での席次（本人の席札）", (0.5, 0.62)),
    )

    # --- TRUST 03 ---
    y = section(y, "TRUST 03", "経営の実務で培った背景", "CEOとしての経営、顧問や経営者会での役割、教育事業、国際的なブランディング。こうした自身の経験を、そのまま経営者向けの学びに変えています。")
    y = bullet_block(y, TRUST03)
    y = image_pair(
        y,
        ("IMG_8204 2.JPG", "国際表彰・証明資料の一例", (0.5, 0.32)),
        ("IMG_8214 2.JPG", "国連での活動記録", (0.5, 0.34)),
    )

    # --- Decision box ---
    y += 44
    box_h = 700
    rounded(draw, (mm, y, mw - mm, y + box_h), 28, style["box_bg"])
    draw.text((mm + 34, y + 36), copy["decision_title"], font=mf["h2"], fill=COLORS["white"])
    next_y = y + 112
    for head, body in copy["decision_items"]:
        draw.ellipse((mm + 34, next_y + 10, mm + 48, next_y + 24), fill=style["box_accent"])
        draw.text((mm + 64, next_y), head, font=mf["h3"], fill=COLORS["white"])
        next_y += 45
        next_y = ml(mm + 64, next_y, body, mf["body"], (235, 220, 184), mw - 2 * mm - 98, 10)
        next_y += 24
    next_y += 10
    draw.line((mm + 34, next_y, mw - mm - 34, next_y), fill=(102, 91, 80), width=2)
    next_y += 34
    next_y = ml(mm + 34, next_y, copy["decision_note"], mf["body_s"], (223, 216, 207), mw - 2 * mm - 68, 11)
    next_y += 24
    next_y = ml(mm + 34, next_y, DISCLAIMER, mf["small"], (190, 184, 174), mw - 2 * mm - 68, 9)
    y += box_h + 70

    final = canvas.crop((0, 0, mw, y))
    base = OUT / f"jack12_scroll_{tone}"
    final.save(base.with_suffix(".png"), "PNG", dpi=(300, 300))
    final.save(base.with_suffix(".pdf"), "PDF", resolution=300.0)
    print(base.with_suffix(".png"))
    print(base.with_suffix(".pdf"))


# ===== コピー（A4チラシ） ==============================================

FLYER_COPY = {
    "elegant": {
        "title": ["ご縁が、仕事を", "次の段階へ運ぶ。"],
        "subtitle": "国際親善の舞台でご縁を育ててきたJACK12が、その経験を経営者向けの学びに。",
        "target": "人とのつながりを軸に事業を広げたい、経営者・事業責任者の方へ",
        "cards_sub": "雰囲気を知る、じっくり学ぶ、二人三脚で深める。ご縁の深め方は選べます。",
        "foot_sub": "雰囲気を知る / じっくり学ぶ / 二人三脚で深める",
    },
    "passion": {
        "title": ["この出会いから、", "勝負が始まる。"],
        "subtitle": "世界の一流と渡り合ってきたJACK12と、志を同じくする仲間が集う。ご縁から始まる学びの場です。",
        "target": "人とのつながりを力に、もう一歩先へ進みたい経営者へ",
        "cards_sub": "まず触れてみる、本気で学ぶ、二人三脚で挑む。あなたに合う入り方を選べます。",
        "foot_sub": "まず触れる / 本気で学ぶ / 二人三脚で挑む",
    },
}

FLYER_CARDS = [
    ("ピースコミュニティ", "月額 1,320円", "年間 14,400円（税込）", "JACK12の理念・活動・学びに継続して触れる入口。年間払いは月額払いより1,440円お得。"),
    ("オンライン塾", "550,000円", "グループオンライン講座", "基礎から体系的に学びたい方へ。ユダヤ人に伝わる原理原則と、信頼の築き方、自分の見せ方をまとめて学べます。"),
    ("VIP塾", "3,300,000円", "マンツーマンセッション", "事業づくりを個別に相談したい方へ。ブランドや海外展開について個別に話し合い、ご縁の活かし方まで一緒に考えます。"),
]


def build_flyer(tone):
    style = TONES[tone]
    copy = FLYER_COPY[tone]

    F = {
        "eyebrow": font(FONT_MED, 34),
        "title": font(FONT_SERIF, 104),
        "subtitle": font(FONT_MED, 42),
        "body": font(FONT_REG, 34),
        "body_s": font(FONT_REG, 29),
        "label": font(FONT_MED, 28),
        "price": font(FONT_BOLD, 52),
        "card_title": font(FONT_BOLD, 39),
        "profile": font(FONT_REG, 28),
        "footer": font(FONT_REG, 22),
    }

    canvas = Image.new("RGB", (W, H), COLORS["paper"])
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 1590, W, 2310), fill=(251, 249, 245))

    # --- Hero ---
    full_a, left_a = style["flyer_overlay"]
    hero_h = 1440
    hero = cover_crop(Image.open(ASSET / "IMG_8274 2.JPG"), (0, 0, W, hero_h), focal=(0.46, 0.45))
    overlay = Image.new("RGBA", (W, hero_h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, W, hero_h), fill=(0, 0, 0, full_a))
    od.rectangle((0, 0, int(W * 0.56), hero_h), fill=(0, 0, 0, left_a))
    hero = Image.alpha_composite(hero.convert("RGBA"), overlay).convert("RGB")
    canvas.paste(hero, (0, 0))

    crest = fit_crop(Image.open(ASSET / "IMG_8249 2.JPG"), (168, 148), focal=(0.5, 0.5))
    paste_rounded(canvas, crest, (M, 108, M + 168, 256), 22)
    draw.rectangle((M + 188, 132, M + 191, 232), fill=style["divider"])
    draw.text((M + 220, 120), "JACK12 PEACE PROGRAM", font=F["eyebrow"], fill=(235, 220, 184))

    draw.text((M, 415), copy["title"][0], font=F["title"], fill=COLORS["white"])
    draw.text((M, 535), copy["title"][1], font=F["title"], fill=COLORS["white"])
    draw_multiline(draw, (M, 720), copy["subtitle"], F["subtitle"], (245, 239, 228), 1080, 18)
    draw.line((M, 930, M + 820, 930), fill=style["divider"], width=3)
    draw.text((M, 980), "Mission", font=F["label"], fill=(235, 220, 184))
    draw.text((M, 1025), "エンタメと教育で地球平和", font=F["subtitle"], fill=COLORS["white"])
    draw.text((M, 1130), copy["target"], font=F["body_s"], fill=(245, 239, 228))

    # --- 3 program cards ---
    section_y = 1538
    draw.text((M, section_y), "ご縁の結び方は3通り", font=F["subtitle"], fill=COLORS["ink"])
    draw.text((M, section_y + 60), copy["cards_sub"], font=F["body"], fill=COLORS["muted"])

    card_y = section_y + 145
    card_w = int((W - 2 * M - 58) / 3)
    card_h = 580
    for i, (title, price, tag, body) in enumerate(FLYER_CARDS):
        x = M + (card_w + 29) * i
        accent = style["card_accents"][i]
        rounded(draw, (x, card_y, x + card_w, card_y + card_h), 22, COLORS["white"], COLORS["soft"], 3)
        draw.rectangle((x, card_y, x + card_w, card_y + 12), fill=accent)
        draw.text((x + 34, card_y + 38), title, font=F["card_title"], fill=COLORS["ink"])
        draw.text((x + 34, card_y + 102), price, font=F["price"], fill=accent)
        draw.text((x + 34, card_y + 166), tag, font=F["label"], fill=COLORS["gold"])
        draw_multiline(draw, (x + 34, card_y + 220), body, F["body_s"], COLORS["muted"], card_w - 68, 12)

    # --- Profile + thumbnails ---
    profile_y = 2350
    draw.text((M, profile_y), "主宰者プロフィール", font=F["eyebrow"], fill=style["label_color"])
    draw.text((M, profile_y + 58), "JACK12", font=font(FONT_SERIF, 82), fill=COLORS["ink"])
    draw.text((M, profile_y + 160), "地球平和エンターテイナー / JACK12 GLOBAL HOLDINGS合同会社 CEO", font=F["body"], fill=style["primary"])
    profile_text = (
        "王族や国際機関との国際親善をはじめ、教育やエンターテインメント、経営の現場で活動してきました。"
        "本プログラムでは、その実体験をもとに、参加者が事業と人とのつながりを深められるよう、対話と学びの時間を用意します。"
    )
    draw_multiline(draw, (M, profile_y + 225), profile_text, F["profile"], COLORS["muted"], 1130, 14)

    thumb_specs = [
        ("IMG_8214 2.JPG", "国連での活動", (0.42, 0.34)),
        ("IMG_8252 2.JPG", "就任式 参加証明", (0.5, 0.30)),
        ("IMG_8240 2.JPG", "カンヌでの実績", (0.46, 0.36)),
    ]
    tx = W - M - 840
    ty = profile_y + 18
    tw, th = 260, 335
    for i, (name, cap, focal) in enumerate(thumb_specs):
        img = fit_crop(Image.open(ASSET / name), (tw, th), focal=focal)
        x = tx + i * (tw + 28)
        paste_rounded(canvas, img, (x, ty, x + tw, ty + th), 24)
        draw.text((x, ty + th + 22), cap, font=F["footer"], fill=COLORS["muted"])

    # --- 実在の実績バンド（検証できる実績で信頼を補強） ---
    by, ch = 2790, 372
    rounded(draw, (M, by, W - M, by + ch), 22, COLORS["white"], COLORS["soft"], 3)
    draw.rectangle((M, by, W - M, by + 12), fill=style["primary"])
    draw.text((M + 40, by + 34), "現場で確かめられる実績", font=F["card_title"], fill=COLORS["ink"])
    # 右側に物証サムネ2枚（顔切れ回避の焦点設定）
    bt_w, bt_h = 178, 232
    bt_specs = [
        ("IMG_8243 2.JPG", "東久邇宮文化褒賞", (0.5, 0.30)),
        ("IMG_8230 2.JPG", "国際晩餐会の席札", (0.5, 0.60)),
    ]
    bt_x0 = W - M - 40 - (bt_w * 2 + 24)
    for i, (name, cap, focal) in enumerate(bt_specs):
        img = fit_crop(Image.open(ASSET / name), (bt_w, bt_h), focal=focal)
        x = bt_x0 + i * (bt_w + 24)
        paste_rounded(canvas, img, (x, by + 48, x + bt_w, by + 48 + bt_h), 18)
        draw.text((x, by + 48 + bt_h + 14), cap, font=F["footer"], fill=COLORS["muted"])
    band_lines = [
        "NHK Eテレ・MBS 等のテレビ・ラジオに出演",
        "大阪・関西万博 EXPO 2025 出演 ／ リッツ・カールトン京都ほか一流会場での公演実績",
        "東久邇宮文化褒賞・ASIA GOLDEN STAR AWARD 2024 受賞 ／ 各国要人との国際親善",
    ]
    line_y = by + 118
    for ln in band_lines:
        draw.ellipse((M + 40, line_y + 10, M + 56, line_y + 26), fill=style["primary"])
        draw_multiline(draw, (M + 74, line_y), ln, F["body_s"], COLORS["muted"], bt_x0 - (M + 74) - 30, 8)
        line_y += 78

    # --- Footer ---
    foot_y = 3245
    draw.line((M, foot_y - 42, W - M, foot_y - 42), fill=COLORS["soft"], width=4)
    draw.text((M, foot_y), "選ぶときの目安", font=F["label"], fill=COLORS["ink"])
    draw.text((M + 285, foot_y - 2), copy["foot_sub"], font=F["body_s"], fill=style["primary"])
    note = "各プログラムは内容・参加条件をご確認のうえお申し込みください。人脈形成、商談成立、成果を保証するものではありません。価格はすべて税込です。"
    draw_multiline(draw, (M, foot_y + 58), note, F["footer"], COLORS["muted"], W - 2 * M, 8)

    base = OUT / f"jack12_flyer_{tone}"
    canvas.save(base.with_suffix(".png"), "PNG", dpi=(300, 300))
    canvas.save(base.with_suffix(".pdf"), "PDF", resolution=300.0)
    print(base.with_suffix(".png"))
    print(base.with_suffix(".pdf"))


def main():
    for tone in ("elegant", "passion"):
        build_flyer(tone)
        build_scroll(tone)


if __name__ == "__main__":
    main()
