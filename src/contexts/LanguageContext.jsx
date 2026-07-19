import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  he: {
    dir: 'rtl',
    // Language picker
    langPickerTitle: 'שפת האפליקציה',
    langPickerSubtitle: 'בחר את השפה שלך',
    langPickerContinue: 'המשך',
    hebrew: 'עברית',
    arabic: 'עברית',

    // Landing
    skip: 'דלג',
    next: 'הבא',
    joinMovement: 'הצטרף לתנועה 🌿',
    alreadyHaveAccount: 'כבר יש לך חשבון?',
    signIn: 'התחבר',

    // Landing slides
    slides: [
      { title: 'שני עמים.\nעולם אחד.', body: 'ישראלים ופלסטינים חיים זה לצד זה מזה דורות — אך רובם מעולם לא קיימו שיחה אמיתית. QOL משנה את זה.' },
      { title: 'התחבר מעבר\nלגבול.', body: 'גלה אנשים אמיתיים בצד השני. החלק, התאם ופתח שיחה — מתורגמת אוטומטית כדי שהשפה לא תהיה מחסום.' },
      { title: 'כל הודעה\nהיא גשר.', body: 'שלום לא מתחיל בפרלמנטים. הוא מתחיל ב"שלום" פשוט בין שני בני אדם סקרנים.' },
      { title: 'בטוח.\nמכבד.\nאמיתי.', body: 'QOL נבנה עם תכונות בטיחות קפדניות לקטינים ומבוגרים כאחד. קהילה המושרשת בכבוד הדדי.' },
    ],

    // Auth
    signInTitle: 'ברוך שובך',
    signInSubtitle: 'מחבר אנשים, גשר בין עולמות',
    signInBtn: 'התחבר',
    signingIn: 'מתחבר…',
    emailLabel: 'אימייל',
    passwordLabel: 'סיסמה',
    confirmPasswordLabel: 'אשר סיסמה',
    forgotPassword: 'שכחת סיסמה?',
    noAccount: 'אין לך חשבון?',
    signUp: 'הירשם',
    signUpTitle: 'צור חשבון',
    signUpSubtitle: 'הצטרף לקהילת QOL',
    createAccount: 'צור חשבון',
    creatingAccount: 'יוצר חשבון…',
    alreadyHaveAccount: 'כבר יש לך חשבון?',
    ageDisclaimer: 'בהרשמה אתה מאשר שאתה בן לפחות 14.',
    passwordMismatch: 'הסיסמאות אינן תואמות',
    passwordTooShort: 'הסיסמה חייבת להכיל לפחות 6 תווים',

    // OTP
    checkEmail: 'בדוק את האימייל שלך',
    otpSentTo: 'שלחנו קוד אימות ל-',
    enterCode: 'הכנס קוד בן 6 ספרות',
    verify: 'אמת',
    verifying: 'מאמת…',
    resendCode: 'שלח קוד מחדש',
    codeResent: 'הקוד נשלח מחדש!',

    // Onboarding
    continue: 'המשך',
    whatsYourName: 'מה שמך?',
    nameSubtitle: 'כך משתמשים אחרים יראו אותך.',
    namePlaceholder: 'השם הפרטי שלך',
    whoAreYou: 'מי אתה?',
    nationalitySubtitle: 'הלאומיות שלך קובעת את השפה באפליקציה.',
    aboutYouTitle: 'קצת עליך',
    aboutYouSubtitle: 'ספר לנו קצת על עצמך.',
    gender: 'מגדר',
    male: 'זכר',
    female: 'נקבה',
    other: 'אחר',
    dateOfBirth: 'תאריך לידה',
    mustBe14: 'חייב להיות בן לפחות 14.',
    selectGender: 'בחר מגדר',
    enterBirthdate: 'הכנס תאריך לידה',
    notOldEnough: 'חייב להיות בן לפחות 14 להצטרף ל-QOL.',
    interestsTitle: 'תחומי העניין שלך',
    interestsSubtitle: 'בחר לפחות 3 תחביבים. הם עוזרים לך להתחבר עם אנשים שחולקים את התשוקות שלך.',
    selected: 'נבחרו',
    needMore: 'עוד נדרשים',
    yourProfileTitle: 'הפרופיל שלך',
    yourProfileSubtitle: 'הוסף תמונה וביו כדי שאנשים יוכלו להכיר אותך.',
    tapToAddPhoto: 'לחץ להוסיף תמונת פרופיל',
    bioLabel: 'ביו',
    bioOptional: '(אופציונלי)',
    bioPlaceholder: 'כמה מילים עליך — תחביבים, עיר, מה אתה מחפש בחיבור…',
    completeProfile: 'סיים פרופיל',
    skipForNow: 'דלג לעכשיו',

    // Tabs
    discover: 'גלה',
    matches: 'התאמות',
    games: 'משחקים',
    profile: 'פרופיל',

    // Matches page
    matchesTitle: 'התאמות',
    connections: 'חיבורים',
    connection: 'חיבור',
    noMatchesYet: 'אין התאמות עדיין',
    noMatchesMsg: 'התחל להחליק בלשונית הגילוי כדי למצוא את החיבור הבין-תרבותי הראשון שלך!',
    goToDiscover: 'עבור לגילוי',
    newMatch: 'התאמה חדשה!',

    // Games page
    miniGamesTitle: 'מיני משחקים',
    learnTogether: 'למד שפה יחד עם ההתאמה שלך',
    chooseGame: 'בחר משחק',
    pickMatch: 'בחר התאמה לשחק איתה',
    noMatchesForGame: 'אתה צריך לפחות התאמה אחת כדי לשחק!',
    noMatchesOnline: 'אין התאמות מחוברות כעת. נסה שוב מאוחר יותר!',
    selectGameHint: 'בחר משחק למעלה כדי להתחיל!',
    playWith: 'שחק',
    twoPlayerGames: 'משחקים לשניים',
    pendingInvites: 'הזמנות ממתינות',
    invitedYou: 'הזמין/ה אותך ל',
    acceptInvite: 'קבל ושחק',
    waitingForOpponent: 'ממתין שהיריב יצטרף…',
    inviteSent: 'ההזמנה נשלחה אל',
    cancel: 'ביטול',

    // Offline / letter match game
    offlineGames: 'משחקים לשחקן יחיד',
    letterMatchName: 'התאם אותיות',
    letterMatchDesc: 'גרור אותיות עברית וערבית לזוגות — לשחקן יחיד',
    matchLettersTitle: 'התאם אותיות',
    howToPlay: 'איך משחקים:',
    howToPlayDesc: 'גרור כל אות אל האות התואמת בשפה השנייה. הקש על אות כדי לשמוע אותה. 3 טעויות והמשחק נגמר.',
    gotIt: 'הבנתי!',
    youDidIt: 'עשית את זה!',
    allMatched: 'כל האותיות הותאמו בהצלחה.',
    playAgain: 'שחק שוב',
    youLost: 'הפסדת',
    lostDesc: 'עשית 3 טעויות. לא נורא, אפשר לנסות שוב!',

    // Memory game
    localTwoPlayerGames: 'משחקים מקומיים לשניים',
    memoryGameName: 'משחק הזיכרון',
    memoryGameDesc: 'הפוך קלפים והתאם זוגות — שני שחקנים באותו מכשיר',
    memoryGameTitle: 'משחק הזיכרון',
    player: 'שחקן',
    player1: 'שחקן 1',
    player2: 'שחקן 2',
    playerTurn: 'תור שחקן',
    tie: 'תיקו!',
    winner: 'מנצח',
    yourTurn: 'תורך!',

    // Profile page
    profileTitle: 'פרופיל',
    signOut: 'התנתק',
    aboutMe: 'עלי',
    interests: 'תחומי עניין',
    noBio: 'אין ביו עדיין. לחץ ✏️ להוסיף.',
    noInterests: 'אין תחומי עניין עדיין.',
    appLanguage: 'שפת האפליקציה',
    writeSomething: 'כתוב משהו על עצמך…',
    needThreeMore: 'נדרשים עוד',
    minor: '🔒 קטין',
    adult: '✓ מבוגר',
    yearsOld: 'שנים',

    // Hobby translations
    hobbyTranslations: { Music: 'מוזיקה', Art: 'אמנות', Cooking: 'בישול', Reading: 'קריאה', Football: 'כדורגל', Basketball: 'כדורסל', Tennis: 'טניס', Swimming: 'שחייה', Hiking: 'טיול', Photography: 'צילום', Gaming: 'גיימינג', Dancing: 'ריקוד', Travel: 'טיול', Yoga: 'יוגה', Fitness: 'כושר', Cinema: 'קולנוע', Theatre: 'תיאטרון', Poetry: 'שירה', Chess: 'שחמט', Cycling: 'רכיבה', Painting: 'ציור', Volunteering: 'התנדבות', Languages: 'שפות', History: 'היסטוריה', Technology: 'טכנולוגיה' },

    // Nationality labels
    israeli: 'ישראלי',
    palestinian: 'פלסטיני',

    // Swipe actions
    like: 'לייק',
    pass: 'פסס',
    interests: 'תחומי עניין',
    stillExploring: 'עדיין מגלה תחביבים',
    findingConnections: 'מוצא חיבורים…',

    // Mini games
    wordGuessName: 'ניחוש מילים',
    wordGuessDesc: 'נחש את המילה בשפה השנייה. בתורות!',
    translationDuelName: 'דו-קרב תרגום',
    translationDuelDesc: 'תרגם משפט — השותף שלך מדרג את תשובתך!',

    // Discover
    discoverTitle: 'גלה',
    meeting: 'פגישה עם',
    palestinians: 'פלסטינים',
    israelis: 'ישראלים',
    filter: 'סנן',
    sayHello: 'אמור שלום!',
    autoTranslated: 'מתורגם אוטומטית.',
    youMetEveryone: 'פגשת את כולם!',
    comeBackSoon: 'עברת על כל החיבורים הזמינים. אנשים חדשים מצטרפים כל יום — חזור בקרוב!',
    refresh: 'רענן',

    // Chat
    autoTranslatedMsg: 'מתורגם אוטומטית',
    translationOff: 'תרגום כבוי',
    clearChat: 'נקה צ\'אט?',
    clearChatMsg: 'כל ההודעות יימחקו לצמיתות עבור שני המשתמשים.',
    cancel: 'ביטול',
    clear: 'נקה',
    writeHere: '…כתוב בעברית',

    // Game room
    opponent: 'יריב',
    roundOf: 'סיבוב',
    of: 'מתוך',
    you: 'אתה',
    finalScore: 'תוצאה סופית',
    playAgain: 'שחק שוב',
    itsDraw: "תיקו!",
    youWon: '🎉 ניצחת!',
    goodGame: 'משחק טוב!',
    opponentLeft: 'היריב עזב את המשחק',
    opponentLeftDesc: 'המשחק הסתיים מכיוון שהשחקן השני עזב.',
    backToGames: 'חזור למשחקים',
    won: 'ניצח',
    wordGuessGameName: '🔤 ניחוש מילים',
    translationDuelGameName: '⚔️ דו-קרב תרגום',

    // Word Guess game
    translateToLang: 'תרגם מילה זו ל',
    arabic: 'ערבית',
    hebrew: 'עברית',
    typeAnswerIn: 'הקלד תשובתך ב',
    answerIn: 'תשובה ב',
    submitBtn: 'שלח',
    yourAnswer: 'התשובה שלך',
    waitingFor: 'ממתין ל',
    correctAnswer: 'תשובה נכונה',
    answered: '✅ ענה',
    thinking: '⏳ חושב…',

    // Translation Duel
    translateTo: 'תרגם ל',
    writeTranslationIn: 'כתוב את התרגום שלך ב',
    yourTranslationIn: 'התרגום שלך ב',
    submitTranslation: 'שלח תרגום',
    yourTranslation: 'התרגום שלך',
    translationOf: 'תרגום של',
    reference: 'עזר',
    rateTranslation: 'דרג את התרגום של',
    close: 'קרוב',
    good: 'טוב',
    perfect: 'מושלם',
    ratingsThisRound: 'דירוגים בסיבוב זה',
    youGot: 'קיבלת',
    got: 'קיבל',
    nextRound: 'הסיבוב הבא מגיע…',
    submitted: '✅ שלח',
    writing: '⏳ כותב…',
  },

  ar: {
    dir: 'rtl',
    // Language picker
    langPickerTitle: 'لغة التطبيق',
    langPickerSubtitle: 'اختر لغتك',
    langPickerContinue: 'استمر',
    hebrew: 'عربي',
    arabic: 'عربي',

    // Landing
    skip: 'تخطى',
    next: 'التالي',
    joinMovement: 'انضم للحركة 🌿',
    alreadyHaveAccount: 'هل لديك حساب؟',
    signIn: 'سجل دخول',

    // Landing slides
    slides: [
      { title: 'شعبان.\nعالم واحد.', body: 'عاش الإسرائيليون والفلسطينيون جنباً إلى جنب لأجيال — لكن معظمهم لم يجروا محادثة حقيقية قط. QOL يغيّر ذلك.' },
      { title: 'تواصل عبر\nالحدود.', body: 'اكتشف أشخاصاً حقيقيين على الجانب الآخر. مرّر، تطابق وابدأ محادثة — تُترجم تلقائياً حتى لا تكون اللغة عائقاً.' },
      { title: 'كل رسالة\nهي جسر.', body: 'السلام لا يبدأ في البرلمانات. يبدأ بـ"مرحباً" بسيطة بين إنسانَين فضوليَّين.' },
      { title: 'آمن.\nمحترم.\nحقيقي.', body: 'QOL مبني بميزات أمان صارمة للقاصرين والبالغين على حدٍّ سواء. مجتمع متجذّر في الاحترام المتبادل.' },
    ],

    // Auth
    signInTitle: 'مرحباً بعودتك',
    signInSubtitle: 'يربط الناس ويجسر العوالم',
    signInBtn: 'تسجيل الدخول',
    signingIn: 'جارٍ تسجيل الدخول…',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟',
    signUp: 'سجّل',
    signUpTitle: 'إنشاء حساب',
    signUpSubtitle: 'انضم إلى مجتمع QOL',
    createAccount: 'إنشاء حساب',
    creatingAccount: 'جارٍ إنشاء الحساب…',
    alreadyHaveAccount: 'هل لديك حساب بالفعل؟',
    ageDisclaimer: 'بالتسجيل، تؤكد أن عمرك 14 سنة على الأقل.',
    passwordMismatch: 'كلمتا المرور غير متطابقتين',
    passwordTooShort: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل',

    // OTP
    checkEmail: 'تحقق من بريدك الإلكتروني',
    otpSentTo: 'أرسلنا رمز التحقق إلى ',
    enterCode: 'أدخل الرمز المكون من 6 أرقام',
    verify: 'تحقق',
    verifying: 'جارٍ التحقق…',
    resendCode: 'إعادة إرسال الرمز',
    codeResent: 'تم إعادة إرسال الرمز!',

    // Onboarding
    continue: 'استمر',
    whatsYourName: 'ما اسمك؟',
    nameSubtitle: 'هكذا سيراك المستخدمون الآخرون.',
    namePlaceholder: 'اسمك الأول',
    whoAreYou: 'من أنت؟',
    nationalitySubtitle: 'تحدد جنسيتك اللغة في التطبيق.',
    aboutYouTitle: 'عنك',
    aboutYouSubtitle: 'أخبرنا قليلاً عن نفسك.',
    gender: 'الجنس',
    male: 'ذكر',
    female: 'أنثى',
    other: 'آخر',
    dateOfBirth: 'تاريخ الميلاد',
    mustBe14: 'يجب أن يكون عمرك 14 سنة على الأقل.',
    selectGender: 'اختر الجنس',
    enterBirthdate: 'أدخل تاريخ الميلاد',
    notOldEnough: 'يجب أن يكون عمرك 14 سنة على الأقل للانضمام إلى QOL.',
    interestsTitle: 'اهتماماتك',
    interestsSubtitle: 'اختر 3 هوايات على الأقل. تساعدك على التواصل مع الأشخاص الذين يشاركونك شغفك.',
    selected: 'محدد',
    male: 'ذكر',
    female: 'أنثى',
    other: 'آخر',
    needMore: 'مطلوب المزيد',
    yourProfileTitle: 'ملفك الشخصي',
    yourProfileSubtitle: 'أضف صورة ونبذة حتى يتعرف عليك الناس.',
    tapToAddPhoto: 'اضغط لإضافة صورة الملف الشخصي',
    bioLabel: 'نبذة',
    bioOptional: '(اختياري)',
    bioPlaceholder: 'بضع كلمات عنك — هواياتك، مدينتك، ما تبحث عنه في تواصل…',
    completeProfile: 'إكمال الملف الشخصي',
    skipForNow: 'تخطى الآن',

    // Tabs
    discover: 'اكتشف',
    matches: 'التطابقات',
    games: 'الألعاب',
    profile: 'الملف الشخصي',

    // Matches page
    matchesTitle: 'التطابقات',
    connections: 'اتصالات',
    connection: 'اتصال',
    noMatchesYet: 'لا تطابقات بعد',
    noMatchesMsg: 'ابدأ بالتمرير في علامة الاكتشاف للعثور على أول تواصل عابر للثقافات!',
    goToDiscover: 'اذهب للاكتشاف',
    newMatch: 'تطابق جديد!',

    // Games page
    miniGamesTitle: 'الألعاب المصغرة',
    learnTogether: 'تعلم لغة مع تطابقك',
    chooseGame: 'اختر لعبة',
    pickMatch: 'اختر تطابقاً للعب معه',
    noMatchesForGame: 'تحتاج إلى تطابق واحد على الأقل للعب!',
    noMatchesOnline: 'لا يوجد تطابقات متصلون الآن. حاول مرة أخرى لاحقاً!',
    selectGameHint: 'اختر لعبة من أعلى للبدء!',
    playWith: 'العب',
    twoPlayerGames: 'ألعاب للاعبين',
    pendingInvites: 'دعوات معلّقة',
    invitedYou: 'دعاك إلى',
    acceptInvite: 'اقبل والعب',
    waitingForOpponent: 'في انتظار انضمام الخصم…',
    inviteSent: 'تم إرسال الدعوة إلى',
    cancel: 'إلغاء',

    // Offline / letter match game
    offlineGames: 'ألعاب للاعب واحد',
    letterMatchName: 'طابق الحروف',
    letterMatchDesc: 'اسحب الحروف العبرية والعربية لتطابقها — للاعب واحد',
    matchLettersTitle: 'طابق الحروف',
    howToPlay: 'كيفية اللعب:',
    howToPlayDesc: 'اسحب كل حرف إلى الحرف المطابق باللغة الأخرى. اضغط على حرف لسماع نطقه. 3 أخطاء تنهي اللعبة.',
    gotIt: 'فهمت!',
    youDidIt: 'أحسنت!',
    allMatched: 'تمت مطابقة جميع الحروف بنجاح.',
    playAgain: 'العب مرة أخرى',
    youLost: 'خسرت',
    lostDesc: 'لقد أخطأت 3 مرات. لا بأس، يمكنك المحاولة مرة أخرى!',

    // Memory game
    localTwoPlayerGames: 'ألعاب محلية للاعبين',
    memoryGameName: 'لعبة الذاكرة',
    memoryGameDesc: 'اقلب البطاقات وطابق الأزواج — لاعبان على نفس الجهاز',
    memoryGameTitle: 'لعبة الذاكرة',
    player: 'لاعب',
    player1: 'لاعب 1',
    player2: 'لاعب 2',
    playerTurn: 'دور اللاعب',
    tie: 'تعادل!',
    winner: 'فاز',
    yourTurn: 'دورك!',

    // Profile page
    profileTitle: 'الملف الشخصي',
    signOut: 'تسجيل الخروج',
    aboutMe: 'عني',
    interests: 'الاهتمامات',
    noBio: 'لا توجد نبذة بعد. اضغط ✏️ للإضافة.',
    noInterests: 'لا توجد اهتمامات بعد.',
    appLanguage: 'لغة التطبيق',
    writeSomething: 'اكتب شيئاً عن نفسك…',
    needThreeMore: 'مطلوب المزيد',
    minor: '🔒 قاصر',
    adult: '✓ بالغ',
    yearsOld: 'سنة',

    // Hobby translations
    hobbyTranslations: { Music: 'موسيقى', Art: 'فن', Cooking: 'طبخ', Reading: 'قراءة', Football: 'كرة قدم', Basketball: 'كرة سلة', Tennis: 'تنس', Swimming: 'سباحة', Hiking: 'مشي', Photography: 'تصوير', Gaming: 'ألعاب', Dancing: 'رقص', Travel: 'سفر', Yoga: 'يوغا', Fitness: 'لياقة', Cinema: 'سينما', Theatre: 'مسرح', Poetry: 'شعر', Chess: 'شطرنج', Cycling: 'دراجات', Painting: 'رسم', Volunteering: 'تطوع', Languages: 'لغات', History: 'تاريخ', Technology: 'تقنية' },

    // Nationality labels
    israeli: 'إسرائيلي',
    palestinian: 'فلسطيني',

    // Swipe actions
    like: 'إعجاب',
    pass: 'تخطى',
    interests: 'الاهتمامات',
    stillExploring: 'لا يزال يستكشف الاهتمامات',
    findingConnections: 'جارٍ البحث عن اتصالات…',

    // Mini games
    wordGuessName: 'تخمين الكلمات',
    wordGuessDesc: 'خمّن الكلمة باللغة الأخرى. بالتناوب!',
    translationDuelName: 'مبارزة الترجمة',
    translationDuelDesc: 'ترجم جملة — شريكك يقيّم إجابتك!',

    // Discover
    discoverTitle: 'اكتشف',
    meeting: 'التعرف على',
    palestinians: 'فلسطينيين',
    israelis: 'إسرائيليين',
    filter: 'تصفية',
    sayHello: 'قل مرحباً!',
    autoTranslated: 'تُترجم تلقائياً.',
    youMetEveryone: 'قابلت الجميع!',
    comeBackSoon: 'لقد مررت على جميع الاتصالات المتاحة. ينضم أشخاص جدد كل يوم — عد قريباً!',
    refresh: 'تحديث',

    // Chat
    autoTranslatedMsg: 'مترجم تلقائياً',
    translationOff: 'الترجمة معطّلة',
    clearChat: 'مسح المحادثة؟',
    clearChatMsg: 'ستُحذف جميع الرسائل نهائياً لكلا المستخدمَين.',
    cancel: 'إلغاء',
    clear: 'مسح',
    writeHere: 'اكتب بالعربية…',

    // Game room
    opponent: 'خصم',
    roundOf: 'جولة',
    of: 'من',
    you: 'أنت',
    finalScore: 'النتيجة النهائية',
    playAgain: 'العب مجدداً',
    itsDraw: 'تعادل!',
    youWon: '🎉 فزت!',
    goodGame: 'لعبة جيدة!',
    opponentLeft: 'غادر الخصم اللعبة',
    opponentLeftDesc: 'انتهت اللعبة لأن اللاعب الآخر غادر.',
    backToGames: 'العودة إلى الألعاب',
    won: 'فاز',
    wordGuessGameName: '🔤 تخمين الكلمات',
    translationDuelGameName: '⚔️ مبارزة الترجمة',

    // Word Guess game
    translateToLang: 'ترجم هذه الكلمة إلى',
    arabic: 'العربية',
    hebrew: 'العبرية',
    typeAnswerIn: 'اكتب إجابتك بـ',
    answerIn: 'إجابة بـ',
    submitBtn: 'إرسال',
    yourAnswer: 'إجابتك',
    waitingFor: 'في انتظار',
    correctAnswer: 'الإجابة الصحيحة',
    answered: '✅ أجاب',
    thinking: '⏳ يفكر…',

    // Translation Duel
    translateTo: 'ترجم إلى',
    writeTranslationIn: 'اكتب ترجمتك بـ',
    yourTranslationIn: 'ترجمتك بـ',
    submitTranslation: 'إرسال الترجمة',
    yourTranslation: 'ترجمتك',
    translationOf: 'ترجمة',
    reference: 'مرجع',
    rateTranslation: 'قيّم ترجمة',
    close: 'قريب',
    good: 'جيد',
    perfect: 'مثالي',
    ratingsThisRound: 'تقييمات هذه الجولة',
    youGot: 'حصلت على',
    got: 'حصل على',
    nextRound: 'الجولة التالية قادمة…',
    submitted: '✅ أرسل',
    writing: '⏳ يكتب…',
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('qol_lang') || null);

  const chooseLang = (l) => {
    localStorage.setItem('qol_lang', l);
    setLang(l);
  };

  const t = translations[lang] || translations['he'];

  return (
    <LanguageContext.Provider value={{ lang, chooseLang, t, hasChosen: !!lang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}