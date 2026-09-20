const fs = require('fs');

const enCommon = JSON.parse(fs.readFileSync('src/locales/en/common.json', 'utf8'));

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

const bnOverrides = {
  header: {
    siteName: "PdfMinty",
    tagline: "গোপনীয়তা-প্রথম পিডিএফ টুলস",
    badgeOffline: "100% প্রাইভেট এবং অফলাইন",
    nav: { home: "হোম", tools: "টুলস", blog: "ব্লগ", about: "আমাদের সম্পর্কে", contact: "যোগাযোগ" }
  },
  footer: {
    sections: { coreTools: "প্রধান টুলস", popularTools: "জনপ্রিয় টুলস" },
    copyright: "© {{year}} PdfMinty. সর্বস্বত্ব সংরক্ষিত।"
  },
  languageSwitcher: {
    selectLanguage: "ভাষা নির্বাচন করুন"
  },
  home: {
    hero: {
      badgePrivate: "প্রাইভেট ব্রাউজার টুলস",
      h1Part1: "বিনামূল্যে ব্রাউজার-ভিত্তিক পিডিএফ টুলস — 100% প্রাইভেট, ",
      h1Part2: "কোনো আপলোড নেই",
      subtitle: "আপনার ওয়েব ব্রাউজারে সরাসরি পিডিএফ একত্রিত করুন, বিভক্ত করুন এবং সম্পাদনা করুন।"
    }
  }
};

const hiOverrides = {
  header: {
    siteName: "PdfMinty",
    tagline: "गोपनीयता-प्रथम पीडीएफ उपकरण",
    badgeOffline: "100% निजी और ऑफ़लाइन",
    nav: { home: "होम", tools: "उपकरण", blog: "ब्लॉग", about: "हमारे बारे में", contact: "संपर्क" }
  },
  footer: {
    sections: { coreTools: "मुख्य उपकरण", popularTools: "लोकप्रिय उपकरण" },
    copyright: "© {{year}} PdfMinty. सर्वाधिकार सुरक्षित।"
  },
  languageSwitcher: {
    selectLanguage: "भाषा चुनें"
  },
  home: {
    hero: {
      badgePrivate: "निजी ब्राउज़र उपकरण",
      h1Part1: "मुफ़्त ब्राउज़र-आधारित पीडीएफ उपकरण — 100% निजी, ",
      h1Part2: "कोई अपलोड नहीं",
      subtitle: "अपने वेब ब्राउज़र में सीधे अपने दस्तावेज़ों को मर्ज करें, विभाजित करें और संपादित करें।"
    }
  }
};

const zhOverrides = {
  header: {
    siteName: "PdfMinty",
    tagline: "隐私至上的 PDF 工具",
    badgeOffline: "100% 私密且离线",
    nav: { home: "首页", tools: "工具", blog: "博客", about: "关于我们", contact: "联系我们" }
  },
  footer: {
    sections: { coreTools: "核心工具", popularTools: "热门工具" },
    copyright: "© {{year}} PdfMinty. 保留所有权利。"
  },
  languageSwitcher: {
    selectLanguage: "选择语言"
  },
  home: {
    hero: {
      badgePrivate: "私密浏览器工具",
      h1Part1: "免费的基于浏览器的 PDF 工具 — 100% 私密，",
      h1Part2: "零上传",
      subtitle: "直接在您的 Web 浏览器中合并、拆分和编辑文档。"
    }
  }
};

fs.writeFileSync('src/locales/bn/common.json', JSON.stringify(deepMerge(JSON.parse(JSON.stringify(enCommon)), bnOverrides), null, 2));
fs.writeFileSync('src/locales/hi/common.json', JSON.stringify(deepMerge(JSON.parse(JSON.stringify(enCommon)), hiOverrides), null, 2));
fs.writeFileSync('src/locales/zh/common.json', JSON.stringify(deepMerge(JSON.parse(JSON.stringify(enCommon)), zhOverrides), null, 2));

console.log('Translations generated.');
