import fs from 'fs';
const keys = JSON.parse(fs.readFileSync('auto-keys.json', 'utf8'));

// A small dictionary of important terms in Bengali
const dict: Record<string, string> = {
  "Document Workspace": "ডকুমেন্ট ওয়ার্কস্পেস",
  "Flatten Options": "ফ্ল্যাটেন অপশন",
  "Free In-Browser PDF Tools": "ব্রাউজারে ফ্রি পিডিএফ টুলস",
  "Back to All PDF Tools": "সকল পিডিএফ টুলে ফিরে যান",
  "Are Online PDF Converters Safe? The Privacy Hazards Explained": "অনলাইন পিডিএফ কনভার্টার কি নিরাপদ? প্রাইভেসির ঝুঁকিগুলো",
  "Keep your sensitive documents safe.": "আপনার গোপনীয় ডকুমেন্টগুলো সুরক্ষিত রাখুন।",
  "Start Using Free Tools": "ফ্রি টুলস ব্যবহার শুরু করুন",
  "Page Not Found": "পেজ পাওয়া যায়নি",
  "Back to Home": "হোমে ফিরে যান",
  "Popular Tools": "জনপ্রিয় টুলস",
  "OCR Extracted Result": "ওসিআর ফলাফল",
  "Download TXT": "TXT ডাউনলোড করুন",
  "Download Markdown (MD)": "মার্কডাউন (MD) ডাউনলোড করুন",
  "Real-time Placement Preview": "রিয়েল-টাইম প্লেসমেন্ট প্রিভিউ",
  "Loading Document...": "ডকুমেন্ট লোড হচ্ছে...",
  "Template View": "টেমপ্লেট ভিউ",
  "Layout Format": "লেআউট ফরম্যাট",
  "Rendering pages...": "পেজ রেন্ডারিং হচ্ছে...",
  "Image Export": "ছবি এক্সপোর্ট",
  "No content to display.": "দেখানোর মত কোন কন্টেন্ট নেই।",
  "Source Document": "মূল ডকুমেন্ট",
  "Conversion Options": "কনভার্সন অপশন",
  "Extract images too": "ছবিগুলোও বের করুন",
  "Conversion Output": "কনভার্সন আউটপুট",
  "Rendered Preview": "রেন্ডার করা প্রিভিউ",
  "Privacy Policy": "গোপনীয়তা নীতি",
  "Reset Order": "অর্ডার রিসেট করুন",
  "Apply Order": "অর্ডার অ্যাপ্লাই করুন",
  "Layout Summary": "লেআউট সামারি",
  "Repair Actions": "মেরামত অপশন",
  "Sanitize Actions": "স্যানিটাইজ অপশন",
  "Terms of Service": "ব্যবহারের শর্তাবলী",
  "Watermark Config": "ওয়াটারমার্ক কনফিগারেশন",
  "Select All": "সব সিলেক্ট করুন",
  "Clear All": "সব ক্লিয়ার করুন",
  "Target Pages": "টার্গেট পেজসমূহ",
  "Select Document": "ডকুমেন্ট সিলেক্ট করুন",
  "Document Properties": "ডকুমেন্ট প্রপার্টিজ",
  "Contact Us": "যোগাযোগ করুন",
  "We're Here to Help": "আমরা সাহায্য করতে প্রস্তুত",
  "Send Message": "মেসেজ পাঠান",
  "Sending...": "পাঠানো হচ্ছে...",
  "Message Received!": "মেসেজ পেয়েছি!",
  "Explore All Free Tools": "সব ফ্রি টুলস এক্সপ্লোর করুন",
  "Privacy Guarantee": "গোপনীয়তার গ্যারান্টি",
  "No account required": "কোনো অ্যাকাউন্টের প্রয়োজন নেই",
  "No file uploads": "ফাইল আপলোড করতে হবে না",
  "No watermarks": "কোনো জলছাপ নেই",
  "No subscription": "কোনো সাবস্ক্রিপশন নেই",
  "Pick your task": "আপনার কাজ বেছে নিন",
  "Built for Everyone": "সবার জন্য তৈরি",
  "In-Browser Privacy": "ব্রাউজারের মধ্যে গোপনীয়তা",
  "Fast Local Execution": "দ্রুত লোকাল এক্সিকিউশন",
};

const translatedBn: Record<string, string> = {};
for (const [key, val] of Object.entries(keys)) {
  const shortKey = key.replace('auto.', '');
  let finalVal = dict[val as string];
  if (!finalVal) {
    if ((val as string).includes('successfully') || (val as string).includes('Successfully')) {
      finalVal = 'সফলভাবে সম্পন্ন হয়েছে!';
    } else {
      finalVal = val as string;
    }
  }
  translatedBn[shortKey] = finalVal;
}

const bnPath = './src/locales/bn/common.json';
const bnData = JSON.parse(fs.readFileSync(bnPath, 'utf8'));
bnData.auto = translatedBn;
fs.writeFileSync(bnPath, JSON.stringify(bnData, null, 2));
console.log('Applied Bengali fallback translations.');
