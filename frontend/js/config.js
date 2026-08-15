// ============================================================
// 📌 সহপাঠী AI - Central Configuration File
// ============================================================
// Change the values below to customize your site globally.
// ============================================================

const SITE_CONFIG = {
    // ---------- Branding ----------
    brand: {
        name: 'সহপাঠী AI',
        nameEn: 'Sohopathi AI',
        tagline: 'ষষ্ঠ থেকে দশম শ্রেণির শিক্ষার্থীদের জন্য',  // Updated
        
        // Logo settings
        logo: {
            type: 'text', // 'text' or 'image'
            // imagePath: 'images/logo.png',
            // imageWidth: '32px',
            // imageHeight: '32px',
            text: {
                letter: 'স',
                fullName: 'সহপাঠী AI',
                shortName: 'সহপাঠী'
            }
        },
        
        colors: {
            primary: '#C96442',
            secondary: '#2F5D3E',
            dark: '#1a1a2e',
            light: '#F5F0E6'
        },
        
        favicon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">স</text></svg>'
    },

    // ---------- Meta / SEO ----------
    meta: {
        title: 'সহপাঠী AI - ষষ্ঠ থেকে দশম শ্রেণির শিক্ষা সহায়ক',
        description: 'NCTB পাঠ্যবইভিত্তিক AI শিক্ষা সহায়ক। ষষ্ঠ থেকে দশম শ্রেণির সব বিষয়ে সহায়তা করে।',
        keywords: 'ষষ্ঠ শ্রেণি, সপ্তম শ্রেণি, অষ্টম শ্রেণি, নবম শ্রেণি, দশম শ্রেণি, SSC, শিক্ষা, AI, বাংলাদেশ',
        author: 'Sohopathi AI',
        ogImage: '',
        twitterHandle: '@sohopathi'
    },

    // ---------- Features ----------
    features: {
        enabled: {
            darkMode: true,
            chatHistory: true,
            imageUpload: true,
            stopButton: true,
            copyButton: true
        },
        maxHistoryItems: 50,
        defaultClass: 'দশম শ্রেণি'
    },

    // ---------- Available Classes ----------
    classes: [
        { value: 'ষষ্ঠ শ্রেণি', label: 'ষষ্ঠ শ্রেণি' },
        { value: 'সপ্তম শ্রেণি', label: 'সপ্তম শ্রেণি' },
        { value: 'অষ্টম শ্রেণি', label: 'অষ্টম শ্রেণি' },
        { value: 'নবম শ্রেণি', label: 'নবম শ্রেণি' },
        { value: 'দশম শ্রেণি', label: 'দশম শ্রেণি' }
    ],

    // ---------- Subjects (Class 6-10) ----------
    subjects: [
        // Class 6-10 Common Subjects
        { name: 'বাংলা ১ম পত্র', icon: '📖', classes: '৬-১০' },
        { name: 'বাংলা ২য় পত্র', icon: '📝', classes: '৬-১০' },
        { name: 'ইংরেজি ১ম পত্র', icon: '📘', classes: '৬-১০' },
        { name: 'ইংরেজি ২য় পত্র', icon: '📗', classes: '৬-১০' },
        { name: 'গণিত', icon: '📐', classes: '৬-১০' },
        { name: 'বাংলাদেশ ও বিশ্বপরিচয়', icon: '🌍', classes: '৬-১০' },
        { name: 'বিজ্ঞান', icon: '🔬', classes: '৬-১০' },
        { name: 'ইসলাম ও নৈতিক শিক্ষা', icon: '🕌', classes: '৬-১০' },
        // Class 9-10 Only
        { name: 'পদার্থবিজ্ঞান', icon: '⚡', classes: '৯-১০' },
        { name: 'রসায়ন', icon: '🧪', classes: '৯-১০' },
        { name: 'জীববিজ্ঞান', icon: '🧬', classes: '৯-১০' },
        { name: 'উচ্চতর গণিত', icon: '📊', classes: '৯-১০' },
        { name: 'ICT', icon: '💻', classes: '৯-১০' },
        { name: 'বাংলা সহপাঠ', icon: '📚', classes: '৯-১০' }
    ],

    // ---------- Quick Questions ----------
    quickQuestions: {
        science: 'সালোকসংশ্লেষণ কী? ব্যাখ্যা করো।',
        math: 'পাইথাগোরাসের উপপাদ্যটি লেখ।',
        bangla: '‘পল্লীজননী’ কবিতার কবি কে?',
        english: 'What is photosynthesis? Explain.'
    },

    // ---------- API Endpoints ----------
    api: {
        workerUrl: 'https://sohopathi-worker.diablostore.workers.dev'
    },

    // ---------- Footer ----------
    footer: {
        copyright: '© ২০২৬ সহপাঠী AI · ষষ্ঠ থেকে দশম শ্রেণির শিক্ষার্থীদের জন্য',
        links: [
            { text: 'প্রাইভেসি', url: '#' },
            { text: 'সাপোর্ট', url: '#' },
            { text: 'চ্যাট', url: 'index.html' }
        ]
    }
};

// Apply config on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set brand name
    const brandName = SITE_CONFIG.brand.logo.type === 'text' 
        ? SITE_CONFIG.brand.logo.text.fullName 
        : SITE_CONFIG.brand.name;
    
    document.querySelectorAll('.brand-name, #topbarBrand, .logo-text').forEach(el => {
        if (el) el.textContent = brandName;
    });
    
    // Set brand letter
    if (SITE_CONFIG.brand.logo.type === 'text') {
        document.querySelectorAll('.brand-mark, .logo-mark').forEach(el => {
            if (el) el.textContent = SITE_CONFIG.brand.logo.text.letter;
        });
    }
    
    // Set page title
    document.title = SITE_CONFIG.meta.title;
    
    // Set favicon
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
        favicon.href = SITE_CONFIG.brand.favicon;
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SITE_CONFIG;
}