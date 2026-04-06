import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        'dashboard': 'Dashboard',
        'library': 'Library',
        'study_plan': 'Study Plan',
        'quiz': 'Quiz & Flashcards',
        'stats': 'My Stats',
        'logout': 'Logout',
        'ask_anything': 'Ask anything about your library...',
        'all_knowledge': 'All Knowledge',
        'what_working_on': 'What are you working on?',
        'core_tutor': 'Core Tutor',
        'beginner': 'Beginner',
        'scholar': 'Scholar',
        // Add more as needed
    },
    tr: {
        'dashboard': 'Kontrol Paneli',
        'library': 'Kütüphane',
        'study_plan': 'Çalışma Planı',
        'quiz': 'Test ve Bilgi Kartları',
        'stats': 'İstatistiklerim',
        'logout': 'Çıkış Yap',
        'ask_anything': 'Kütüphanenizle ilgili her şeyi sorun...',
        'all_knowledge': 'Tüm Bilgiler',
        'what_working_on': 'Şu an ne üzerinde çalışıyorsunuz?',
        'core_tutor': 'Ana Eğitmen',
        'beginner': 'Başlangıç',
        'scholar': 'Akademisyen',
    },
    ar: {
        'dashboard': 'لوحة القيادة',
        'library': 'المكتبة',
        'study_plan': 'خطة الدراسة',
        'quiz': 'اختبار وبطاقات تعليمية',
        'stats': 'إحصائياتي',
        'logout': 'تسجيل خروج',
        'ask_anything': 'اسأل أي شيء عن مكتبتك...',
        'all_knowledge': 'كل المعرفة',
        'what_working_on': 'على ماذا تعمل الآن؟',
        'core_tutor': 'المعلم الأساسي',
        'beginner': 'مبتدئ',
        'scholar': 'باحث',
    }
};

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(() => localStorage.getItem('sc_lang') || 'en');

    useEffect(() => {
        localStorage.setItem('sc_lang', lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    }, [lang]);

    const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
