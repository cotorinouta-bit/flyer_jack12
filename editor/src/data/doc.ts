import type { Doc, Tokens, Tone, ToneCopy, FlyerToneCopy } from "../types";

const base = {
  paper: "#F7F3EC", ink: "#1C1918", soft: "#EBE4D9", muted: "#5F5750",
  cream: "#F5EFE4", gold: "#B18B49",
};

const elegant: Tokens = {
  ...base,
  primary: "#70161F", label: "#B18B49", divider: "#B18B49", h1: "#FFFFFF",
  cardAccents: ["#70161F", "#9C202C", "#080808"],
  boxBg: "#1C1918", boxAccent: "#B18B49",
  scrollOverlayTop: 0.31, scrollOverlayFull: 0.36,
  flyerOverlayFull: 0.29, flyerOverlayLeft: 0.45,
};
const passion: Tokens = {
  ...base,
  primary: "#9C202C", label: "#9C202C", divider: "#9C202C", h1: "#ffffff",
  cardAccents: ["#9C202C", "#70161F", "#080808"],
  boxBg: "#181212", boxAccent: "#D6B270",
  scrollOverlayTop: 0.41, scrollOverlayFull: 0.52,
  flyerOverlayFull: 0.41, flyerOverlayLeft: 0.59,
};

const worldReasonFor = {
  forTitle: "JACK12が世界に羽ばたいた理由",
  forIntro: "JACK12自身が変化してきた背景を、5つの視点で整理します。",
  forBullets: [
    { head: "① 世界で成果を生み出す原理原則", body: "世界で成果を上げる人々が大切にしてきた、信用・学び・決断の原理原則を学んだから。" },
    { head: "② 一緒にいる人を変える", body: "大統領や大臣、王様、貴族、大企業の会長、一流経営者の方と付き合い、一緒に仕事をする人が大幅に変化しました。" },
    { head: "③ 環境が重要", body: "世界的な方と一緒にいる環境を選んだから、習慣や行動、言動、マインドなどが変わりました。" },
    { head: "④ 世界で遊ぶようになったから", body: "仕事を頑張っていても辿り着けない領域が存在します。世界で遊ぶようになってから人生が大激変しました。" },
    { head: "⑤ 勇気を持って行動と決断", body: "どれだけ学んでも行動しなければ何も変わりません。人生を変えたければ、何事も覚悟と決断が不可欠です。" },
  ],
};

const D: any = {
  tokens: { elegant, passion },
  sizes: { fband: 145 },
  free: { scroll: [], flyer: [] },
  eyebrow: "JACK12 PEACE PROGRAM",
  crest: "IMG_8249 2.JPG",
  heroPhoto: "IMG_8274 2.JPG",
  heroFocalScroll: { x: 0.54, y: 0.44 },
  heroFocalFlyer: { x: 0.46, y: 0.45 },
  scrollMission: "ミッション - エンタメと教育で世界平和",
  flyerMissionLabel: "Mission",
  flyerMissionText: "エンタメと教育で世界平和",

  scroll: {
    elegant: {
      pill: "",
      h1: "誰と出会うかで、\n世界は変わる。",
      heroBody:
        "王族や国家元首、国際機関と渡り合ってきたJACK12。そのご縁の輪に、あなたも加わる。人との繋がりで事業を広げたい皆様が、学び、世界へ羽ばたく場です。",
      ...worldReasonFor,
      whyTitle: "出会う相手が、次の一手を変える",
      whyIntro:
        "選ぶ基準は、価格よりも「誰と出会えるか」。国際舞台での実体験を、経営者が自分の言葉で語れる形にして渡します。上質な場での振る舞い方まで、ここで身につきます。",
      whyBullets: [
        { head: "普通では出会えない世界の現場知", body: "王族や要人を前にした式典、映画祭の現場。そこで実際に起きたことから学べます。" },
        { head: "肩書きより先に、信頼が伝わる順番", body: "実績は並べるほど重くなる。相手が興味を持つ順に話す。その組み立てを身につけます。" },
        { head: "経営者のためのブランディング", body: "講演や顧問、経営者会、教育事業での経験をもとに、会社の見え方と自分自身の見え方を一緒に磨きます。" },
        { head: "VIP塾は個別伴走型", body: "マンツーマンで、事業の組み立てからプロフィール、発信、ご縁の活かし方まで一緒に見ていきます。" },
      ],
      decisionTitle: "どのご縁から始めるか",
      decisionItems: [
        { head: "まず世界観に触れたい", body: "JACK12ピースコミュニティ" },
        { head: "じっくり学び、自分を見直したい", body: "JACK12オンライン塾" },
        { head: "一緒に事業を考え、紹介され方まで変えたい", body: "JACK12 VIP塾" },
      ],
      decisionNote:
        "講座選びで見るべきは、知識の量よりも「自分の事業やプロフィール、人とのつながり方が実際にどう変わるか」。なかでもVIP塾は、JACK12の実体験をもとに、一人ひとりの状況に合わせて内容を組み立てる最上位プログラムです。",
    },
    passion: {
      pill: "",
      h1: "この出会いから、\n流れが変わる。",
      heroBody:
        "王族とも、各国の要人とも。JACK12が本気でつないできたご縁が、ここにあります。同じ志の経営者と出会い、互いに刺激を受けながら前に進む場です。",
      ...worldReasonFor,
      whyTitle: "経営者が、ここに集まる理由",
      whyIntro:
        "価格だけで選ぶ場ではありません。誰と出会えるか、どんな仲間とつながれるか。JACK12が世界の第一線で積んだ実体験と、志を持った経営者が、ここに集まっています。",
      whyBullets: [
        { head: "世界の第一線で積んだ、生きた現場の知恵", body: "王族や要人を前にした式典、映画祭の舞台。そこで実際に起きたことを、余さず伝えます。" },
        { head: "肩書きを、信頼につながる伝え方へ", body: "実績を信頼につなげ、また会いたいと思われる話し方を身につけます。" },
        { head: "夢でつながる経営者の輪", body: "理念と本気で結ばれた仲間と、高め合いながら事業を広げる。" },
        { head: "VIP塾はマンツーマン伴走", body: "あなただけに向き合い、事業の組み立てからご縁の活かし方まで一緒に磨きます。" },
      ],
      decisionTitle: "最初のご縁を、どこから結ぶ？",
      decisionItems: [
        { head: "まずこの世界観に触れたい", body: "JACK12ピースコミュニティ" },
        { head: "本気で学び、自分を変えたい", body: "JACK12オンライン塾" },
        { head: "一緒に事業をつくり、ご縁を活かし切りたい", body: "JACK12 VIP塾" },
      ],
      decisionNote:
        "選ぶときに見てほしいのは、知識の量より「事業やご縁の結び方が、どこまで本気で変わるか」。なかでもVIP塾は、JACK12の実体験をもとに、あなたの今の状況に寄り添って伴走する最上位プログラムです。",
    },
  },

  flyer: {
    elegant: {
      title: ["ご縁が、仕事を", "次の段階へ運ぶ。"],
      subtitle: "国際親善の舞台でご縁を育ててきたJACK12が、その経験を経営者向けの学びに。",
      target: "人とのつながりを軸に事業を広げたい、経営者・事業責任者の方へ",
      cardsSub: "参加、相談、学び、伴走、支援。目的に合わせて選べます。",
      footSub: "参加 / 相談 / 学び / 伴走 / 支援",
    },
    passion: {
      title: ["この出会いから、", "勝負が始まる。"],
      subtitle: "世界の一流と渡り合ってきたJACK12と、志を同じくする仲間が集う。ご縁から始まる学びの場です。",
      target: "人とのつながりを力に、もう一歩先へ進みたい経営者へ",
      cardsSub: "参加、相談、学び、伴走、支援。あなたに合う入り方を選べます。",
      footSub: "参加 / 相談 / 学び / 伴走 / 支援",
    },
  },

  beforeForImage: { file: "jack12-before-for.jpg", caption: "", focal: { x: 0.55, y: 0.48 } },
  forImage: { file: "IMG_8280 2.JPG", caption: "上質な場での対話と交流を大切にしたプログラムです。", focal: { x: 0.43, y: 0.48 } },

  scrollProgramTitle: "プログラム・金額一覧",
  scrollProgramIntro: "参加、相談、学び、伴走、支援。\n今の目的に合わせて選べます。",
  flyerCardsTitle: "プログラム・金額一覧",

  programs: [
    { title: "JACK12ピースコミュニティ", price: "入会金 12,000円（税込） / 月額 1,320円（税込）", desc: "まずJACK12の世界観に触れたい方へ。継続して理念・活動・学びに触れる入口です。" },
    { title: "単発 顧問", price: "120,000円（税込）", desc: "必要なタイミングで個別に相談したい方へ。事業やプロフィール、ご縁の活かし方を単発で整理します。" },
    { title: "JACK12オンライン塾", price: "550,000円（税込）", desc: "基礎から体系的に学びたい方へ。グループオンライン講座で、ユダヤ人に伝わる原理原則、人から信頼される考え方、自分の見せ方を順を追って学びます。" },
    { title: "JACK12 VIP塾", price: "3,300,000円（税込）", desc: "事業づくりを個別に相談したい方へ。マンツーマンで、原理原則から事業の組み立てまで。海外の王族・要人や日本企業の経営者と出会う機会の生かし方も、一緒に掘り下げます。" },
    { title: "スポンサー", price: "1,200万円（税込）", desc: "JACK12の活動や理念を大きく支援し、ともに世界平和へ向けた展開を広げたい方向けの枠です。" },
  ],
  flyerCards: [
    { title: "ピースコミュニティ", price: "入会金 12,000円", tag: "月額 1,320円（税込）", desc: "JACK12の理念・活動・学びに継続して触れる入口。" },
    { title: "単発 顧問", price: "120,000円", tag: "税込 / 単発相談", desc: "必要なタイミングで個別に相談。事業やご縁の活かし方を整理します。" },
    { title: "オンライン塾", price: "550,000円", tag: "グループオンライン講座", desc: "基礎から体系的に学びたい方へ。ユダヤ人に伝わる原理原則と、信頼の築き方、自分の見せ方をまとめて学べます。" },
    { title: "VIP塾", price: "3,300,000円", tag: "マンツーマンセッション", desc: "事業づくりを個別に相談したい方へ。ブランドや海外展開について個別に話し合い、ご縁の活かし方まで一緒に考えます。" },
    { title: "スポンサー", price: "1,200万円", tag: "税込 / スポンサー", desc: "理念と活動を大きく支援し、ともに展開を広げる枠です。" },
  ],

  mediaTitle: "万博出演と受賞歴",
  mediaIntro: "国際活動を支えているのは、メディア出演や受賞、公演など、公開情報として確認できる実績です。",
  mediaBullets: [
    { head: "テレビ・ラジオ出演", body: "NHK Eテレ・MBS などのTV・ラジオに出演しています。" },
    { head: "大阪・関西万博 EXPO 2025 出演", body: "リッツ・カールトン京都、リーガロイヤルホテル京都ほか一流ホテル・式典での公演実績があります。" },
    { head: "競技マジックで日本代表", body: "アジア国際大会（深圳）で日本代表ファイナリストに選出。日本マジック教育普及協会 理事・師範。" },
    { head: "国際映画祭でグランプリ", body: "出演作『西成ゴローの4億円』が、ミラノ・ニース・マドリードなどの国際映画祭でグランプリを受賞。" },
  ],
  mediaImages: [
    { file: "IMG_8235 2.JPG", caption: "満員の客席を魅了する公演（ステージ実績）", focal: { x: 0.5, y: 0.42 } },
    { file: "IMG_8282 2.JPG", caption: "扇子と桜の花びらを操るステージマジック", focal: { x: 0.5, y: 0.42 } },
  ],

  valueTitle: "経営にどう活きるか",
  valueIntro: "華やかな肩書きを眺めて終わりにはしません。自社の事業、人とのつながり、発信のしかた。経営者が自分の手元を見直すきっかけになるよう組んでいます。",
  valueBullets: [
    { head: "海外で信頼を築く要点", body: "海外要人や国際式典、親善プログラムでの経験から、場のつくり方や人の紹介のしかた、信頼の重ね方を学びます。" },
    { head: "経営者の自己ブランディング", body: "実績を信頼につなげるプロフィールのつくり方、肩書きの見せ方や紹介文、登壇やSNSでの印象づくりを扱います。" },
    { head: "人と場を、つなぐ力", body: "日本企業の経営者から海外の関係者、文化や教育の現場まで。幅広い人脈を生かして、事業の次の一手を一緒に話し合います。" },
  ],

  profileTitle: "12の顔を持つ唯一無二の存在",
  profileName: "地球平和エンターテイナーJACK12",
  profileRole: "",
  profileBody: "JACK12は一つの肩書きでは語れない存在です。エンターテイナー、国際外交、経営者、教育者などとして活動していますが、目指す先はただ一つ、世界平和です。",
  profileFaces: [
    { head: "① JACK12 GLOBAL HOLDINGS 合同会社 CEO", body: "すべての活動の起点となる、経営の顔。" },
    { head: "② バリ王宮名誉親善大使", body: "バリ島の王様より正式に授与された、国際外交の顔。" },
    { head: "③ ヒマラヤ財団親善大使（ネパール）", body: "ヒマラヤ財団より正式に授与された、国際平和活動の顔。" },
    { head: "④ トランプ大統領就任式 実行委員", body: "世界的な政治の舞台に関わった、外交の顔。" },
    { head: "⑤ EPM大阪 初代会長・現役員", body: "年商億超えの経営者たちをまとめてきた、リーダーの顔。" },
    { head: "⑥ 真心磨会 副会長", body: "元アデランス社長が発足した会の副会長として、人間力を磨き続ける顔。" },
    { head: "⑦ マレーシア AMES HOTEL マジシャン大使", body: "国境を越えて、エンターテインメントで場をひとつにする顔。" },
    { head: "⑧ 富裕層向けリゾートホテル CEO", body: "最高水準のおもてなしを体現する、ホスピタリティの顔。" },
    { head: "⑨ ART GRAGE® 平和親善大使", body: "世界のVIPとロイヤルファミリーが愛した日本を代表するアートを広める、日本文化発信の顔。" },
    { head: "⑩ JACK12塾 主宰・運営", body: "VISA創業者ご子息より学んだユダヤ人の原理原則と、世界の王族・貴族プログラムを次世代へ伝える、教育者の顔。" },
    { head: "⑪ 映画プロデューサー / 俳優", body: "カンヌのレッドカーペットから吉本新喜劇まで、表現の幅を持つ、芸能の顔。" },
    { head: "⑫ 5つ以上の顧問・アンバサダー", body: "IT、セキュリティー、ホテル、宝石、不動産、障がい福祉など、社会の素晴らしいものを広げていく人道支援の顔。" },
  ],

  trust: [
    {
      code: "TRUST 01", title: "親善大使としての任命と受賞",
      intro: "バリ王宮名誉親善大使をはじめ、各国の親善大使や国際プログラムへの招聘、出演、実行委員、受賞歴。こうした積み重ねが信頼の支えになっています。",
      bullets: [
        { head: "バリ王宮名誉親善大使", body: "バリ島の王様より正式に授与。国際親善・文化交流に関わる活動の一環。" },
        { head: "親善大使・アンバサダー", body: "AMSグローバルヒマラヤ財団親善大使、Ames Hotelマジシャン大使、ART GRAGE平和親善大使、各種福祉・教育領域のアンバサダー。" },
        { head: "公式実行委員", body: "トランプ大統領就任式実行委員会、アフリカ・ジャパン・ナイト、MEC TOKYO 2025（文部科学省後援）などで実行委員を務める。" },
        { head: "受賞歴", body: "東久邇宮文化褒賞、東久邇宮記念賞ほか、文化・国際交流領域での表彰歴。" },
      ],
      pairs: [{
        left: { file: "IMG_8243 2.JPG", caption: "東久邇宮文化褒賞 授与式", focal: { x: 0.5, y: 0.30 } },
        right: { file: "IMG_8259 2.JPG", caption: "ASIA GOLDEN STAR AWARD 2024 受賞", focal: { x: 0.5, y: 0.34 } },
      }],
      wide: [{ file: "IMG_8196 2.JPG", caption: "各国要人との記念・表彰式にて", focal: { x: 0.5, y: 0.40 } }],
    },
    {
      code: "TRUST 02", title: "王族・要人の前に立った舞台",
      intro: "王族関係者や各国大臣、国際式典、カンヌ、モナコなどの場で出演・披露してきました。こうした国際舞台での経験が、活動の大きな背景になっています。",
      bullets: [
        { head: "王族・貴族関係者の前で披露", body: "貴族・ハイアットファミリー御前で披露し、国際的な場で評価を重ねています。" },
        { head: "王族・国家元首に認められた活動背景", body: "王族、貴族、国家元首、大統領、国際機関から招請を受けてきた国際親善・文化交流に関わる活動。" },
        { head: "国際式典・大臣御前での披露", body: "トランプ就任式晩餐会（Trump International Hotel）出演、バリ島王室宮殿での王様専属公演、ネパール日本文化交流プログラム、スリランカ観光大臣御前、タイ・ロイヤルファミリーより国際友好栄誉賞。" },
        { head: "カンヌ・モナコ・Forbes関連の舞台", body: "カンヌ国際映画祭レッドカーペット、モナコ公室主催『薔薇の舞踏会』、Forbes Villa Party & Dinner、フランス貴族主催パーティー等での参加・出演。" },
      ],
      pairs: [
        {
          left: { file: "IMG_8246 2.JPG", caption: "カンヌ国際映画祭での活動記録", focal: { x: 0.5, y: 0.45 } },
          right: { file: "IMG_8252 2.JPG", caption: "米大統領就任式 参加証明書", focal: { x: 0.5, y: 0.30 } },
        },
        {
          left: { file: "IMG_8217 2.JPG", caption: "スリランカ大臣との会談・握手", focal: { x: 0.5, y: 0.32 } },
          right: { file: "IMG_8230 2.JPG", caption: "国際晩餐会での席次（本人の席札）", focal: { x: 0.5, y: 0.62 } },
        },
      ],
    },
    {
      code: "TRUST 03", title: "経営の実務で培った背景",
      intro: "CEOとしての経営、顧問や経営者会での役割、教育事業、国際的なブランディング。こうした自身の経験を、そのまま経営者向けの学びに変えています。",
      bullets: [
        { head: "CEO・事業運営", body: "JACK12 GLOBAL HOLDINGS合同会社 CEO。GF White Beachリゾートプロジェクト ホテル代表/CEO、GF共鳴会合同会社 業務執行社員、ジュエリー事業など。" },
        { head: "顧問・経営者会", body: "株式会社オーリス顧問、Born corporation顧問、年商億以上経営者会（PMA）役員、EPM大阪初代会長、Enishi経営者会 大阪会長、真心磨会 副会長。" },
        { head: "教育・ブランディング", body: "企業向け講演・研修・国際ショー、経営者・富裕層向けブランディング、JACK12塾主宰、生きてプロジェクト（映画・絵本・スピーチコンテスト世界大会）、次世代教育・不登校支援・発達障害支援。" },
        { head: "映画・表現活動", body: "映画プロデューサー / 俳優（吉本新喜劇にも出演）。出演作『西成ゴローの4億円』はミラノ・ニース・マドリード等の国際映画祭でグランプリ。『冤罪のつくりかた』『カメレオン』ほか。" },
      ],
      pairs: [{
        left: { file: "IMG_8204 2.JPG", caption: "国際表彰・証明資料の一例", focal: { x: 0.5, y: 0.32 } },
        right: { file: "IMG_8214 2.JPG", caption: "国連での活動記録", focal: { x: 0.5, y: 0.34 } },
      }],
    },
  ],

  flyerProfile: {
    label: "主宰者プロフィール",
    name: "地球平和エンターテイナーJACK12",
    role: "JACK12 GLOBAL HOLDINGS合同会社 CEO",
    body: "エンターテイナー、国際外交、経営者、教育者など、12の顔を持つ存在。王族や国際機関との国際親善をはじめ、教育やエンターテインメント、経営の現場で活動しています。",
    thumbs: [
      { file: "IMG_8214 2.JPG", caption: "国連での活動", focal: { x: 0.42, y: 0.34 } },
      { file: "IMG_8252 2.JPG", caption: "就任式 参加証明", focal: { x: 0.622245592948718, y: 0.5269921875 } },
      { file: "IMG_8240 2.JPG", caption: "カンヌでの実績", focal: { x: 0.46, y: 0.36 } },
    ],
  },
  band: {
    heading: "現場で確かめられる実績",
    lines: [
      "NHK Eテレ・MBS 等のテレビ・ラジオ出演 ／ 大阪・関西万博 EXPO 2025 出演",
      "出演作『西成ゴローの4億円』ミラノ・ニース等 国際映画祭グランプリ",
      "東久邇宮文化褒賞 受賞 ／ 王族・各国要人との国際親善",
    ],
    thumbs: [
      { file: "IMG_8243 2.JPG", caption: "東久邇宮文化褒賞", focal: { x: 0.32283266129032256, y: 1 } },
      { file: "IMG_8230 2.JPG", caption: "国際晩餐会の席札", focal: { x: 1, y: 1 } },
    ],
  },
  footerLabel: "選ぶときの目安",
  footerNote: "各プログラムは内容・参加条件をご確認のうえお申し込みください。人脈形成、商談成立、成果を保証するものではありません。価格はすべて税込です。",
  cta: {
    headline: "まずは、公式サイトから。",
    sub: "活動の最新情報・お申し込みはこちら",
    url: "https://www.jack12-official.com",
  },
  disclaimer: "",
};

// ===== 2案（現行 / リライト） =====
// リライト差分（AIっぽさを消した自然リライト）。上品=敬体、熱量=常体で統一。
const rewriteScroll: Record<Tone, Partial<ToneCopy>> = {
  elegant: {
    h1: "誰と出会うかで、\n世界は変わる。",
    heroBody: "王族や国家元首、国際機関と渡り合ってきたJACK12。そのご縁の輪に、あなたも加わる。人との繋がりで事業を広げたい皆様が、学び、世界へ羽ばたく場です。",
    ...worldReasonFor,
    whyIntro: "選ぶ基準は、価格より「誰と会えるか」。国際舞台での経験を、自分の言葉で話せる形にしてお渡しします。上質な場での振る舞いまで、ここで。",
  },
  passion: {
    heroBody: "王族とも、各国の要人とも。JACK12が本気で築いた縁が、ここにある。同じ志の経営者と出会い、刺激を受け、前へ進む。",
    ...worldReasonFor,
    whyIntro: "価格だけで選ぶ場ではありません。誰と会えるか、どんな仲間と組めるか。世界の第一線で積んだ実体験が、ここにある。",
    whyBullets: [
      { head: "世界の第一線で積んだ、生きた現場の知恵", body: "王族や要人を前にした式典、映画祭の舞台。そこで起きたことを、余さず伝える。" },
      { head: "肩書きを、信頼につながる伝え方へ", body: "実績を信頼につなげる。また会いたいと思われる話し方を、身につける。" },
      { head: "夢でつながる経営者の輪", body: "理念と本気で結ばれた仲間と、高め合いながら事業を広げる。" },
      { head: "VIP塾はマンツーマン伴走", body: "あなただけに向き合う。事業の組み立てからご縁の活かし方まで、一緒に磨く。" },
    ],
    decisionItems: [
      { head: "まずはこの世界に触れたい", body: "JACK12ピースコミュニティ" },
      { head: "本気で学び、自分を変えたい", body: "JACK12オンライン塾" },
      { head: "一緒に事業をつくり、ご縁を活かし切りたい", body: "JACK12 VIP塾" },
    ],
    decisionNote: "選ぶときに見てほしいのは、知識の量じゃない。「事業やご縁の結び方が、どこまで本気で変わるか」だ。なかでもVIP塾は、実体験をもとに今の状況へ寄り添う、最上位の伴走。",
  },
};
const rewriteFlyer: Record<Tone, Partial<FlyerToneCopy>> = {
  elegant: { title: ["誰と出会うかで、", "世界は変わる。"] },
  passion: {
    subtitle: "世界の一流と渡り合ってきたJACK12。志を同じくする仲間が集う。ご縁から始まる、学びの場。",
    cardsSub: "まず触れる、本気で学ぶ、二人三脚で挑む。入り方は、選べる。",
  },
};

const mergeScroll = (cur: Record<Tone, ToneCopy>, ov: Record<Tone, Partial<ToneCopy>>): Record<Tone, ToneCopy> => ({
  elegant: { ...cur.elegant, ...ov.elegant },
  passion: { ...cur.passion, ...ov.passion },
});
const mergeFlyer = (cur: Record<Tone, FlyerToneCopy>, ov: Record<Tone, Partial<FlyerToneCopy>>): Record<Tone, FlyerToneCopy> => ({
  elegant: { ...cur.elegant, ...ov.elegant },
  passion: { ...cur.passion, ...ov.passion },
});

const { scroll: scrollCurrent, flyer: flyerCurrent, ...rest } = D;

export const initialDoc: Doc = {
  ...rest,
  variant: "rewrite",
  variants: {
    current: { label: "現行案", scroll: scrollCurrent, flyer: flyerCurrent },
    rewrite: {
      label: "リライト案",
      scroll: mergeScroll(scrollCurrent, rewriteScroll),
      flyer: mergeFlyer(flyerCurrent, rewriteFlyer),
    },
  },
};
