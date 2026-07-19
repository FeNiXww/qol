import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  he: {
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
      {
        title: 'שני עמים.\nעולם אחד.',
        body: 'ישראלים ופלסטינים חיים זה לצד זה מזה דורות — אך רובם מעולם לא קיימו שיחה אמיתית. QOL משנה את זה.',
      },
      {
        title: 'התחבר מעבר\nלגבול.',
        body: 'גלה אנשים אמיתיים בצד השני. החלק, התאם ופתח שיחה — מתורגמת אוטומטית כדי שהשפה לא תהיה מחסום.',
      },
      {
        title: 'כל הודעה\nהיא גשר.',
        body: 'שלום לא מתחיל בפרלמנטים. הוא מתחיל ב"שלום" פשוט בין שני בני אדם סקרנים.',
      },
      {
        title: 'בטוח.\nמכבד.\nאמיתי.',
        body: 'QOL נבנה עם תכונות בטיחות קפדניות לקטינים ומבוגרים כאחד. קהילה המושרשת בכבוד הדדי.',
      },
    ],

    // Auth
    signUpTitle: 'הצטרף ל-QOL',
    signUpSubtitle: 'צור חשבון חדש',
    email: 'אימייל',
    password: 'סיסמה',
    confirmPassword: 'אשר סיסמה',
    createAccount: 'צור חשבון',
    noAccount: 'אין לך חשבון?',
    signUp: 'הירשם',
    forgotPassword: 'שכחת סיסמה?',
    signInTitle: 'ברוך שובך',

    // Tabs
    discover: 'גלה',
    matches: 'התאמות',
    games: 'משחקים',
    profile: 'פרופיל',

    // Profile page
    profileTitle: 'פרופיל',
    signOut: 'התנתק',
    aboutMe: 'עלי',
    interests: 'תחומי עניין',
    noBio: 'אין ביו עדיין. לחץ ✏️ להוסיף.',
    noInterests: 'אין תחומי עניין עדיין.',
    appLanguage: 'שפת האפליקציה',
    switchToArabic: 'החלף לערבית',
    switchToHebrew: 'החלף לעברית',

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
    dir: 'rtl',
  },

  ar: {
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
      {
        title: 'شعبان.\nعالم واحد.',
        body: 'عاش الإسرائيليون والفلسطينيون جنباً إلى جنب لأجيال — لكن معظمهم لم يجروا محادثة حقيقية قط. QOL يغيّر ذلك.',
      },
      {
        title: 'تواصل عبر\nالحدود.',
        body: 'اكتشف أشخاصاً حقيقيين على الجانب الآخر. مرّر، تطابق وابدأ محادثة — تُترجم تلقائياً حتى لا تكون اللغة عائقاً.',
      },
      {
        title: 'كل رسالة\nهي جسر.',
        body: 'السلام لا يبدأ في البرلمانات. يبدأ بـ"مرحباً" بسيطة بين إنسانَين فضوليَّين.',
      },
      {
        title: 'آمن.\nمحترم.\nحقيقي.',
        body: 'QOL مبني بميزات أمان صارمة للقاصرين والبالغين على حدٍّ سواء. مجتمع متجذّر في الاحترام المتبادل.',
      },
    ],

    // Auth
    signUpTitle: 'انضم إلى QOL',
    signUpSubtitle: 'أنشئ حساباً جديداً',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    createAccount: 'إنشاء حساب',
    noAccount: 'ليس لديك حساب؟',
    signUp: 'سجّل',
    forgotPassword: 'نسيت كلمة المرور؟',
    signInTitle: 'مرحباً بعودتك',

    // Tabs
    discover: 'اكتشف',
    matches: 'التطابقات',
    games: 'الألعاب',
    profile: 'الملف الشخصي',

    // Profile page
    profileTitle: 'الملف الشخصي',
    signOut: 'تسجيل الخروج',
    aboutMe: 'عني',
    interests: 'الاهتمامات',
    noBio: 'لا يوجد ملف شخصي بعد. اضغط ✏️ للإضافة.',
    noInterests: 'لا توجد اهتمامات بعد.',
    appLanguage: 'لغة التطبيق',
    switchToArabic: 'التبديل إلى العربية',
    switchToHebrew: 'التبديل إلى العبرية',

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
    dir: 'rtl',
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