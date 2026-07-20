import { useLang } from '@/contexts/LanguageContext';

const dictT = {
  he: {
    addToDictionary: 'הוסף למילון',
    addedToDictionary: 'נוסף למילון!',
    dictionaryName: 'תרגול המילון שלי',
    dictionaryDesc: 'חזרו על מילים ששמרתם מהצ׳אטים',
    tapToFlip: 'הקש כדי לראות תרגום',
    knowIt: 'אני יודע',
    dontKnowIt: 'לא יודע',
    emptyDictionary: 'המילון ריק — הוסיפו מילים מהצ׳אט או כאן',
    addWord: 'הוסף מילה',
    hebrewWord: 'עברית',
    arabicWord: 'ערבית',
    editDictionary: 'עריכת המילון',
    allDone: 'סיימתם את כל המילים!',
    practiceAgain: 'תרגלו שוב',
    save: 'שמור',
    wordsCount: 'מילים',
  },
  ar: {
    addToDictionary: 'أضف إلى القاموس',
    addedToDictionary: 'أُضيف إلى القاموس!',
    dictionaryName: 'تدرّب على قاموسك',
    dictionaryDesc: 'راجع الكلمات التي حفظتها من الدردشات',
    tapToFlip: 'اضغط لرؤية الترجمة',
    knowIt: 'أعرفها',
    dontKnowIt: 'لا أعرفها',
    emptyDictionary: 'القاموس فارغ — أضف كلمات من الدردشة أو من هنا',
    addWord: 'أضف كلمة',
    hebrewWord: 'بالعبرية',
    arabicWord: 'بالعربية',
    editDictionary: 'تعديل القاموس',
    allDone: 'أنهيت كل الكلمات!',
    practiceAgain: 'تدرّب مجددًا',
    save: 'حفظ',
    wordsCount: 'كلمات',
  },
  en: {
    addToDictionary: 'Add to dictionary',
    addedToDictionary: 'Added to dictionary!',
    dictionaryName: 'Practice your dictionary',
    dictionaryDesc: 'Review words you saved from chats',
    tapToFlip: 'Tap to see translation',
    knowIt: 'I know it',
    dontKnowIt: "Don't know",
    emptyDictionary: 'Your dictionary is empty — add words from chat or here',
    addWord: 'Add word',
    hebrewWord: 'Hebrew',
    arabicWord: 'Arabic',
    editDictionary: 'Edit dictionary',
    allDone: 'You finished all the words!',
    practiceAgain: 'Practice again',
    save: 'Save',
    wordsCount: 'words',
  },
};

export function useDictT() {
  const { lang } = useLang();
  return dictT[lang] || dictT.he;
}