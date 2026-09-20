import fs from 'fs';

const bnPath = './src/locales/bn/common.json';
const bnData = JSON.parse(fs.readFileSync(bnPath, 'utf8'));

bnData.header = {
  "nav": {
    "home": "হোম",
    "tools": "টুলস",
    "blog": "ব্লগ",
    "about": "আমাদের সম্পর্কে",
    "contact": "যোগাযোগ"
  },
  "badgeOffline": "১০০% প্রাইভেট ও অফলাইন",
  "themeToggle": {
    "ariaLabel": "ডার্ক মোড টগল করুন",
    "switchToLight": "লাইট মোডে স্যুইচ করুন",
    "switchToDark": "ডার্ক মোডে স্যুইচ করুন"
  },
  "mobileMenu": {
    "open": "মেনু খুলুন",
    "close": "মেনু বন্ধ করুন"
  }
};

fs.writeFileSync(bnPath, JSON.stringify(bnData, null, 2));
console.log('Added header translations to bn.');
