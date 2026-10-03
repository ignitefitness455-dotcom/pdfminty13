export interface AuthorProfile {
  name: string;
  nativeName?: string;
  jobTitle: string;
  role: string;
  company: string;
  country: string;
  countryCode: string;
  city: string;
  location: string;
  bio: string;
  shortBio: string;
  credentials: string[];
  expertise: string[];
  email: string;
  github: string;
  avatarUrl: string;
  profileUrl: string;
}

export const PRIMARY_AUTHOR: AuthorProfile = {
  name: 'Mohammed Tanveer Munshi',
  nativeName: 'মোহাম্মদ তানভীর মুন্সী',
  jobTitle: 'Lead Software Engineer & Founder',
  role: 'Founder & Principal Engineer',
  company: 'PdfMinty',
  country: 'Bangladesh',
  countryCode: 'BD',
  city: 'Dhaka',
  location: 'Dhaka, Bangladesh',
  bio: 'Mohammed Tanveer Munshi is a full-stack software engineer, WebAssembly practitioner, and digital privacy advocate based in Dhaka, Bangladesh. With over 6 years of expertise building browser-native architectures and secure client-side applications, he created PdfMinty to protect personal and enterprise documents from unauthorized cloud data logging.',
  shortBio:
    'Full-stack software engineer and web privacy researcher based in Dhaka, Bangladesh. Creator of PdfMinty.',
  credentials: [
    'B.Sc. in Computer Science & Engineering',
    'Specialist in WebAssembly (Wasm) & Browser Memory Sandboxing',
    'Creator & Lead Developer of PdfMinty 100% Client-Side PDF Suite',
  ],
  expertise: [
    'Client-Side WebAssembly (Wasm)',
    'Document Security & Cryptography (AES-GCM)',
    'PDF Spec & Binary Stream Manipulation',
    'Browser Sandbox & Memory Safety',
  ],
  email: 'support@pdfminty.com',
  github: 'https://github.com/ignitefitness455-dotcom/pdfminty13',
  avatarUrl: '/authors/tanveer-munshi.png',
  profileUrl: 'https://pdfminty.com/about-us/#creator',
};
