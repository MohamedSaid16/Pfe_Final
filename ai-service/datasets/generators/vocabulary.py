"""
Multilingual vocabulary database for toxic content detection.
Production-grade vocabulary covering English, French, Arabic, and Algerian Darija.
"""

from typing import Dict, List, Tuple

# ============================================================================
# ENGLISH VOCABULARY
# ============================================================================

ENGLISH_TOXIC = {
    "insult": [
        "stupid", "idiot", "dumb", "moron", "retard", "fool", "incompetent",
        "useless", "pathetic", "worthless", "loser", "failure", "trash",
        "garbage", "jerk", "asshole", "prick", "bastard", "dick", "twat",
        "scumbag", "piece of shit", "lowlife", "nobody", "mediocre",
        "incompetent fool", "brain dead", "empty headed", "air head"
    ],
    "hate_speech": [
        "N-word variations avoided", "go back to your country", "terrorist",
        "barbaric", "savage", "inferior", "subhuman", "infestation",
        "plague", "disease", "parasites", "vermin", "scourge"
    ],
    "harassment": [
        "I hope you die", "kill yourself", "kys", "rope", "neck yourself",
        "end it", "you should be dead", "deserves to die", "should hang",
        "I know where you live", "dox", "I have your address"
    ],
    "profanity": [
        "fuck", "shit", "damn", "hell", "crap", "bloody", "asshat",
        "motherfucker", "cocksucker", "son of a bitch", "bullshit"
    ],
    "threat": [
        "I will kill you", "I'll hurt you", "I'm coming for you",
        "you're dead", "meet you irl", "watch your back", "get what's coming",
        "I know your family", "I'll burn your house"
    ],
    "bullying": [
        "everyone hates you", "you're alone", "no one likes you",
        "you're ugly", "fatty", "you're disgusting", "freak", "weirdo",
        "you don't belong here", "get out", "nobody wants you"
    ],
    "gaming_toxicity": [
        "ez", "u suck", "git gud", "noob", "trash player", "report",
        "you're garbage", "uninstall", "skill issue", "bad at game",
        "stop playing", "you ruin the game"
    ],
    "sexism": [
        "women driver", "go to kitchen", "make me a sandwich",
        "females can't play", "like a girl", "such a woman",
        "girl gamer", "she's too emotional"
    ],
    "racism": [
        "racial slurs avoided but patterns covered", "go back home",
        "you don't belong", "different culture insults"
    ],
    "mockery": [
        "hahahaha loser", "you're a joke", "hilarious failure",
        "comedy gold", "you're funny looking", "laughing stock"
    ]
}

ENGLISH_SAFE = {
    "greeting": [
        "hello", "hi", "hey", "good morning", "good afternoon",
        "good evening", "howdy", "greetings", "nice to meet you",
        "welcome", "glad to see you", "long time no see"
    ],
    "education": [
        "I'm learning python", "studying for exam", "great lecture today",
        "the textbook explains well", "I understand the concept",
        "can you help me with homework", "this is very educational",
        "I love this subject", "interesting point", "good explanation"
    ],
    "business": [
        "let's schedule a meeting", "the project is on track",
        "great quarterly results", "team collaboration is key",
        "deadline is next week", "budget approved", "client satisfied",
        "proposal submitted", "contract signed", "partnership announced"
    ],
    "technical": [
        "this code is clean", "nice implementation", "good refactoring",
        "the algorithm is efficient", "great documentation", "well tested",
        "performance improved", "bug fixed", "feature deployed",
        "continuous integration working"
    ],
    "gaming": [
        "great team game", "you're skilled", "well played", "nice combo",
        "good strategy", "team win", "gg", "wp", "good match"
    ],
    "social": [
        "how was your day", "lovely weather today", "thanks for the help",
        "excited for the weekend", "can't wait to see you",
        "had a great time", "keep in touch", "stay safe", "take care"
    ],
    "formal": [
        "I would like to inquire", "thank you for your consideration",
        "sincerely yours", "respectfully submitted", "as per the agreement",
        "in accordance with", "please find attached", "for your review"
    ]
}

# ============================================================================
# FRENCH VOCABULARY
# ============================================================================

FRENCH_TOXIC = {
    "insult": [
        "débile", "imbécile", "con", "salaud", "connard", "crétin",
        "idiot", "nul", "pourri", "minable", "déchet", "ordure",
        "racaille", "dégénéré", "pourri", "pitre", "farceur",
        "charlatan", "fumiste", "bon à rien", "sans valeur"
    ],
    "hate_speech": [
        "retournez chez vous", "terroriste", "barbares", "sauvages",
        "sous-humains", "infestation", "fléau", "vermine", "parasites"
    ],
    "harassment": [
        "je vais te tuer", "tu devrais mourir", "pendez-toi",
        "je sais où tu habites", "je te retrouverai", "attention",
        "tu vas regretter", "je vais t'attraper"
    ],
    "profanity": [
        "putain", "merde", "bordel", "con", "salaud", "emmerdeur",
        "chieur", "salop", "pourri", "maudit"
    ],
    "threat": [
        "tu es mort", "je vais te frapper", "je viens pour toi",
        "attention à toi", "on se voit dehors", "ça va mal finir"
    ],
    "bullying": [
        "tout le monde te déteste", "tu es seul", "personne t'aime",
        "tu es laid", "grosse", "tu fais peur", "bizarre",
        "tu ne devrais pas être là"
    ],
    "gaming_toxicity": [
        "t'es nul", "arrête de jouer", "tu nous traînes",
        "mauvais joueur", "sans compétence", "nul au jeu", "débile"
    ],
    "sexism": [
        "rentre à la cuisine", "fais-moi un sandwich", "femme",
        "tu joues comme une fille", "trop émotionnelle"
    ],
    "racism": [
        "va d'où tu viens", "tu n'es pas d'ici", "casse-toi"
    ],
    "mockery": [
        "t'es comique", "tu m'amuses", "quelle blague tu fais"
    ]
}

FRENCH_SAFE = {
    "greeting": [
        "bonjour", "bonsoir", "bonne journée", "salut", "hey",
        "ça va", "comment ça va", "ça va bien", "enchanté",
        "bienvenue", "ravi de te rencontrer"
    ],
    "education": [
        "j'apprends", "les études", "excellent cours", "bien expliqué",
        "je comprends", "peux-tu m'aider", "éducatif", "intéressant",
        "bonne explication", "bon point", "merci d'expliquer"
    ],
    "business": [
        "réunion prévue", "projet avance bien", "bons résultats",
        "collaboration importante", "deadline la semaine prochaine",
        "budget approuvé", "client satisfait", "projet terminé"
    ],
    "technical": [
        "code bien écrit", "bonne implémentation", "algorithme efficace",
        "bien documenté", "bien testé", "performance améliorée",
        "bug corrigé", "feature déployée", "implémentation propre"
    ],
    "gaming": [
        "bon match", "tu es fort", "belle stratégie", "bonne équipe",
        "victoire", "bien joué", "merci de jouer"
    ],
    "social": [
        "comment s'est passée ta journée", "beau temps", "merci pour l'aide",
        "impatient pour le week-end", "à bientôt", "garde le contact",
        "reste en sécurité", "prends soin de toi"
    ],
    "formal": [
        "je voudrais demander", "merci pour votre attention",
        "cordialement", "respectueusement soumis", "selon l'accord",
        "conformément à", "veuillez trouver ci-joint", "pour votre examen"
    ]
}

# ============================================================================
# ARABIC VOCABULARY (Modern Standard Arabic)
# ============================================================================

ARABIC_TOXIC = {
    "insult": [
        "أحمق", "غبي", "حمار", "ساقط", "فاسد", "كسول", "ضعيف",
        "خاسر", "عديم الفائدة", "حقير", "وغد", "نذل", "قذر",
        "رذيل", "خسيس", "كسيح", "أعرج", "عمي", "أطرش"
    ],
    "hate_speech": [
        "ارجع لبلادك", "إرهابي", "متخلف", "بربري", "غير متحضر",
        "دون الإنسانية", "طاعون", "وباء", "جراثيم", "طفيلي"
    ],
    "harassment": [
        "سأقتلك", "ستموت", "انتحر", "أنا أعرف أين تسكن",
        "ستندم", "احذر", "انتظرني بالخارج"
    ],
    "profanity": [
        "اللعنة", "اللاويس", "الخ", "يا قحبة", "يا طاقة",
        "يا عاهرة", "يا خنزير"
    ],
    "threat": [
        "أنت ميت", "سأؤلمك", "آتي إليك", "انتبه", "احذر",
        "سيحدث شيء سيء"
    ],
    "bullying": [
        "الجميع يكرهك", "أنت وحيد", "لا أحد يحبك", "أنت قبيح",
        "أنت فظيع", "غريب", "لا تنتمي هنا"
    ],
    "gaming_toxicity": [
        "أنت سيء", "اترك اللعبة", "أنت رديء", "لا موهبة",
        "فاشل", "ضعيف", "مبتدئ"
    ],
    "sexism": [
        "اذهبي للمطبخ", "اصنعي لي طعاماً", "كامرأة",
        "نساء لا يستطعن اللعب", "متحررة"
    ],
    "racism": [
        "عد إلى حيث أتيت", "أنت لا تنتمي", "اذهب بعيداً"
    ]
}

ARABIC_SAFE = {
    "greeting": [
        "السلام عليكم", "صباح الخير", "مساء الخير", "كيف حالك",
        "تشرفت", "أهلا وسهلا", "رقا أهلك ورسا", "مرحبا",
        "كيفك أنت", "بخير"
    ],
    "education": [
        "أتعلم", "الدراسة", "محاضرة رائعة", "شرح واضح",
        "فهمت", "هل تساعدني", "تعليمي", "مثير للاهتمام",
        "شرح جيد", "نقطة جيدة"
    ],
    "business": [
        "اجتماع مجدول", "المشروع يسير بشكل جيد", "نتائج ممتازة",
        "التعاون مهم", "الموعد النهائي الأسبوع القادم",
        "الميزانية موافق عليها", "العميل راضي"
    ],
    "technical": [
        "الكود نظيف", "تنفيذ جيد", "الخوارزمية فعالة",
        "موثق جيداً", "مختبر جيداً", "الأداء تحسنت",
        "الخطأ إصلاح", "الميزة نشرت"
    ],
    "gaming": [
        "مباراة جيدة", "أنت ماهر", "استراتيجية جيدة", "فريق جيد",
        "نصر", "تم لعبها بشكل جيد"
    ],
    "social": [
        "كيف كان يومك", "الطقس جميل", "شكراً للمساعدة",
        "متحمس للعطلة", "قريباً", "حافظ على الاتصال",
        "ابقَ آمناً", "اعتن بنفسك"
    ],
    "formal": [
        "أود أن أسأل", "شكراً لانتباهك", "مع التقدير",
        "المرفوع بصراحة", "وفقاً للاتفاقية", "وفقاً لـ",
        "يرجى العثور على المرفق", "لمراجعتك"
    ]
}

# ============================================================================
# ALGERIAN DARIJA VOCABULARY
# ============================================================================

DARIJA_TOXIC = {
    "insult": [
        "hmar", "kahba", "zamel", "bnaya", "maluh", "khasra",
        "khabith", "nagess", "skhouma", "t9ayyed", "matqadesh",
        "boudhli", "matebdel", "sifha", "rajel sifha", "talkha",
        "khawra", "mawakhir", "rak mwaad", "rah mahboul"
    ],
    "hate_speech": [
        "rah mentafidin", "mentessamen", "khadamin", "slave",
        "ta7hed", "khar", "rah mnadjimin", "ghorba", "mahbouba"
    ],
    "harassment": [
        "nrah nqatlek", "nrah nsib lik wahed ljah", "tseb b9af",
        "anal aandi lmou9af taa7ek", "nrah njib lik wahed lmakla",
        "khtibk almorr", "rah nkhasrek"
    ],
    "profanity": [
        "yah kahba", "yah khabith", "yah maluh", "fih takkhar",
        "khaw", "jah", "mal khif", "lgharsha", "7asm"
    ],
    "threat": [
        "nrah nqatlek", "rah nqallbek", "khammsa f wassak",
        "nrah nkallek khbar qasi", "5ams blak", "nrah nqaysek"
    ],
    "bullying": [
        "t9ayyed", "nta l7adi", "chkoun thqal alik", "baggha teb3a",
        "malkoum hadd", "rah tmouti whdi", "khsara", "mazal tkhsir"
    ],
    "gaming_toxicity": [
        "t9ayyed f lekhra", "khraj mn lekhra", "mta3 khara",
        "tkemmil khara", "khasra", "bouma", "rah matkhtar",
        "skhouma f lekhra"
    ],
    "sexism": [
        "ruh l lmatbakh", "khoj n7it", "nta mta3 khara",
        "bent mta3 lberra", "taqaydha bent", "katba bent"
    ],
    "racism": [
        "ruh blak", "nta ghrib", "khraj mn hna", "nta mnadjim"
    ],
    "mockery": [
        "t9ayyed", "skhum", "malkoum l7ayya", "rah tkhsar qdam kulsh"
    ]
}

DARIJA_SAFE = {
    "greeting": [
        "salam alaikoum", "labas", "wakash", "cashk", "cashmen",
        "sbah lkhir", "massa lkhir", "ki dakhal", "ki raik",
        "ki darti", "ki gallak", "ashmen raik", "nta l7adi"
    ],
    "education": [
        "kdro ntaa3 l dars", "galt l professeur", "hadak zhij",
        "fhemt", "waskhi nwas7ek", "tahsil", "shiyya momima",
        "baraka dak shrah", "bslaha", "braka"
    ],
    "business": [
        "jmaa lmoujjama3a", "l project tkammel", "tablk nabghit",
        "l khedma ktamma", "l khaboula mkhtalfa", "l3mail mrodia",
        "l khat qabla ajouzh"
    ],
    "technical": [
        "l code zhij", "hadak tahqiq", "kmil bar", "l khadma zhija",
        "l nata2ij zhija", "l khatar tsahhh", "baraka",
        "l feature kammla"
    ],
    "gaming": [
        "mahrah", "zhij", "l freeqa zhija", "win", "nti l7adi",
        "skhum f lekhra", "baraka"
    ],
    "social": [
        "ki nhar taa3ak", "shhik l jaj", "shukran 3la l 3ona",
        "mshit n3id", "qriba nshufak", "kol marra",
        "khod balk", "shufak l7amdoulah"
    ],
    "formal": [
        "bghouit nswel", "shukran 3la lintibah", "b akhtira",
        "b khl2", "wafqa l lafia", "wafqa l...", "ghadir tjid",
        "bach t3awed ta3wid"
    ]
}

# ============================================================================
# CONTEXT TEMPLATES FOR DIVERSITY
# ============================================================================

CONTEXT_TEMPLATES = {
    "social_media": [
        "{text}", "{text} #toxic", "{text} 😡", "{text} smh",
        "wow {text}", "seriously {text}", "OMG {text}"
    ],
    "gaming": [
        "gg {text}", "noob {text}", "trash {text}",
        "{text} ez", "you {text}", "just {text} nub"
    ],
    "casual": [
        "{text} lol", "{text}!", "{text}...", "{text}?",
        "like {text}", "so {text}", "really {text}"
    ],
    "formal": [
        "I think {text}", "In my opinion {text}", "{text} regards",
        "With respect {text}", "Formally {text}", "Officially {text}"
    ]
}

# ============================================================================
# AUGMENTATION PATTERNS
# ============================================================================

AUGMENTATION_PATTERNS = {
    "capitalization": ["UPPER", "Title", "MiXeD", "lower"],
    "punctuation": ["!", "!!!", "?", "...", "~", "***"],
    "ocr_noise": ["1", "l", "0", "O", "5", "S"],
    "emoji_toxic": ["😡", "🖕", "💀", "🤬", "😤", "🙄"],
    "emoji_safe": ["😊", "👍", "❤️", "🙏", "😄", "🎉"],
    "repetition": [2, 3, 4, 5],
    "lang_mix_en": ["yeah", "lol", "omg", "bro", "dude"],
    "lang_mix_fr": ["ouais", "mdr", "ouf", "mec", "frère"],
}

# ============================================================================
# CONTEXT SENTENCES FOR MIXING
# ============================================================================

CONTEXT_SENTENCES = {
    "en": [
        "Hey", "Listen", "Check this", "Look", "See",
        "I think", "You know", "Whatever", "Dude", "Bro"
    ],
    "fr": [
        "Écoute", "Regarde", "Dis-moi", "Sérieusement", "Franchement",
        "Tu sais", "En fait", "Quoi", "Mec", "Frère"
    ],
    "ar": [
        "استمع", "انظر", "أخبرني", "بصراحة", "حقاً",
        "تعرف", "في الواقع", "ماذا", "أخي", "صديقي"
    ],
    "dz": [
        "Sme3", "Shouf", "Goulha", "Bsrah", "F7aq",
        "Taa3ref", "F lwa9i3a", "Wakash", "Khoui", "Sidi"
    ]
}


def get_vocabulary() -> Dict[str, Dict[str, List[str]]]:
    """Get complete vocabulary dictionary."""
    return {
        "en": {"toxic": ENGLISH_TOXIC, "safe": ENGLISH_SAFE},
        "fr": {"toxic": FRENCH_TOXIC, "safe": FRENCH_SAFE},
        "ar": {"toxic": ARABIC_TOXIC, "safe": ARABIC_SAFE},
        "dz": {"toxic": DARIJA_TOXIC, "safe": DARIJA_SAFE},
    }


def get_language_names() -> Dict[str, str]:
    """Map language codes to full names."""
    return {
        "en": "English",
        "fr": "French",
        "ar": "Arabic",
        "dz": "Algerian Darija"
    }


def get_toxic_categories() -> List[str]:
    """Get all toxic content categories."""
    return [
        "insult", "hate_speech", "harassment", "profanity",
        "threat", "bullying", "gaming_toxicity", "sexism",
        "racism", "mockery"
    ]


def get_safe_categories() -> List[str]:
    """Get all safe content categories."""
    return [
        "greeting", "education", "business", "technical",
        "gaming", "social", "formal"
    ]
