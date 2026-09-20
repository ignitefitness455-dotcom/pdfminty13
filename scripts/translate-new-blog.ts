import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, '../src/locales');

const translations: Record<string, { name: string; shortDesc: string; body: string }> = {
  bn: {
    name: "PDF ফর্মে টাইপ করা যাচ্ছে না? নন-ফিলেবল ফরম পূরণের ৫টি সহজ উপায় (২০২৬)",
    shortDesc: "PDF ফর্মে টাইপ করতে পারছেন না? ফাইলটি ফ্ল্যাটেন বা স্ক্যান করা ছবি হতে পারে। প্রিন্ট ছাড়াই টেক্সট বসিয়ে, স্বাক্ষর করে সেভ করার ৫টি কার্যকরী উপায় জানুন।",
    body: `
<p>আপনি একটি আবেদনপত্র, ট্যাক্স টেমপ্লেট বা ভাড়ার চুক্তিপত্র ডাউনলোড করেছেন। নাম লেখার জন্য প্রথম বক্সে ক্লিক করলেন — কিন্তু কোনো কার্সার আসছে না। আপনি প্রতিটি লাইন ও বক্সে ক্লিক করে দেখলেন, কিছুই কাজ করছে না। প্রিন্টারের সাহায্য ছাড়াই এবং কোনো কাগজপত্র নষ্ট না করে কীভাবে এটি দ্রুত পূরণ করবেন?</p>

<p>আপনার কাছে যা আছে তা হলো একটি <strong>নন-ফিলেবল PDF ফর্ম (Non-Fillable PDF Form)</strong> — এটি দেখতে ফর্মের মতো হলেও এতে কোনো ইন্টারেক্টিভ টেক্সট ফিল্ড নেই। এটি খুব সাধারণ একটি সমস্যা। এই গাইডে আমরা আলোচনা করব কেন এমনটি ঘটে এবং প্রিন্টার বা স্ক্যানার ছাড়াই সম্পূর্ণ ডিজিটালি এটি পূরণের ৫টি সহজ উপায়।</p>

<div class="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl my-6">
  <h2 class="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-2">দ্রুত সমাধান (Quick Answer)</h2>
  <p class="text-emerald-800 dark:text-emerald-300">আপনার ফর্মটি নিশ্চিতভাবেই একটি স্ক্যান করা ছবি অথবা একটি ফ্ল্যাটেন করা PDF যার ফিল্ডগুলো সাধারণ কালিতে পরিণত হয়েছে। দুই ক্ষেত্রেই সবচেয়ে সহজ সমাধান হলো: এমন একটি টুল ব্যবহার করা যা পেজের ওপর টেক্সট বসাতে পারে (ওভারলে এডিটর)। আপনার উত্তরগুলো যথাস্থানে টাইপ করে ফাইলটি সেভ করে নিন। ব্রাউজার-ভিত্তিক সাইন ও ফিল টুল কোনো প্রিন্ট ছাড়াই এই কাজটি সহজে করে দেয়।</p>
</div>

<h2>কেন PDF ফর্মে টাইপ করা যায় না? আসল কারণ</h2>
<h3>ইন্টারেক্টিভ ফিল্ডগুলো ঐচ্ছিক</h3>
<p>PDF মূলগতভাবে একটি প্রিন্ট-লেআউট ফরম্যাট। ফর্মে সরাসরি টাইপ করার জন্য নির্মাতা বা অথরকে আলাদাভাবে টেক্সট বক্স, চেকবক্স বা সিগনেচার এরিয়া যুক্ত করতে হয়। যদি কেউ তা যুক্ত না করে থাকে, তবে ডকুমেন্টটি কেবল একটি সাধারণ ছবি বা লেআউট হিসেবে থাকে, যেখানে সরাসরি টাইপ করা সম্ভব নয়।</p>

<h3>নন-ফিলেবল ফর্ম তৈরির ৩টি সাধারণ কারণ</h3>
<ul class="list-disc pl-5 my-4 space-y-2">
  <li><strong>স্ক্যান করা কপি:</strong> কোনো কাগজের ফর্ম সরাসরি স্ক্যান বা ছবি তোলা হলে তা সম্পূর্ণ ছবিতে রূপান্তরিত হয়। সরকারি বা মেডিকেল নথিতে এটি খুব বেশি দেখা যায়।</li>
  <li><strong>ফ্ল্যাটেন (Flattened) করা PDF:</strong> একটি ফিলেবল ফর্মের ডেটা লক করতে বা পরিবর্তনের সুযোগ বন্ধ করতে তাকে ফ্ল্যাটেন করা হয়, যার ফলে ফিল্ডগুলো স্থায়ী ডকুমেন্টে মিশে যায়।</li>
  <li><strong>সরাসরি এক্সপোর্ট:</strong> ওয়ার্ড বা অন্যান্য সফটওয়্যারে ফর্ম ডিজাইন করে সরাসরি PDF-এ এক্সপোর্ট করা হলে এতে কোনো ইন্টারেক্টিভ ফিল্ড থাকে না।</li>
</ul>

<h2>প্রথমে নিশ্চিত করুন ফিল্ডগুলো আসলেই অনুপস্থিত কিনা</h2>
<p>মাঝে মাঝে আপনার PDF ভিউয়ারের সমস্যার কারণেও ফিল্ড কাজ নাও করতে পারে। নিচে দেওয়া ৩টি সহজ উপায়ে পরীক্ষা করে নিন:</p>
<ol class="list-decimal pl-5 my-4 space-y-2">
  <li><strong>হোভার টেস্ট (Hover test):</strong> ফিল্ডের ওপর মাউস কার্সার নিয়ে যান। ফিলেবল ফিল্ড হলে কার্সার হাত বা টেক্সট আইকনে পরিবর্তিত হয়।</li>
  <li><strong>হাইলাইট টেস্ট:</strong> Adobe Reader-এ Edit &gt; Preferences &gt; Forms-এ গিয়ে হাইলাইট অন করুন। ফিল্ড থাকলে হালকা নীল রঙে উজ্জ্বল হবে।</li>
  <li><strong>ভিন্ন ভিউয়ারে পরীক্ষা:</strong> ফাইলটি আপনার ক্রোম বা অন্য ব্রাউজারে ড্র্যাগ করে ওপেন করুন। সেখানেও কাজ না করলে নিশ্চিত এটি একটি ফ্ল্যাট ফর্ম।</li>
</ol>

<h2>ফিক্স ১: ফর্মের ওপর টেক্সট বসানো (The Overlay Method)</h2>
<p>সবচেয়ে সার্বজনীন এবং দ্রুততম সমাধান: ফর্মটিকে ব্যাকগ্রাউন্ড হিসেবে রেখে তার ওপর টেক্সট লেয়ার বসানো। আপনি যেখানে লিখতে চান সেখানে ক্লিক করুন, টাইপ করুন এবং ফ্রন্ট সাইজ প্রয়োজন অনুযায়ী ছোট-বড় করে নিন।</p>
<p>এক্ষেত্রে ব্রাউজার-ভিত্তিক টুল সবচেয়ে নিরাপদ। <a href="/sign-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">PdfMinty-এর Sign PDF টুল</a> আপনাকে ফর্মের যেকোনো জায়গায় টেক্সট, টিকচিহ্ন এবং তারিখ বসাতে সহায়তা করে। যেহেতু পুরো প্রসেসটি আপনার ব্রাউজারেই সম্পন্ন হয়, তাই আপনার স্পর্শকাতর তথ্য সার্ভারে আপলোড হওয়ার কোনো ঝুঁকি থাকে না।</p>
<ul class="list-disc pl-5 my-4 space-y-2">
  <li>ফর্মের লেখার সাথে মিলিয়ে ১০-১২ pt ফ্রন্ট সাইজ ব্যবহার করুন যাতে লেখা স্বাভাবিক দেখায়।</li>
  <li>লাইনের সাথে টেক্সটের বেসলাইন সুন্দরভাবে মিলিয়ে নিন।</li>
  <li>সঠিক পজিশনিংয়ের জন্য পেজটি ১৫০% জুম করে কাজ করুন।</li>
</ul>

<h2>ফিক্স ২: পূরণ করুন, স্বাক্ষর করুন এবং পাঠান — সম্পূর্ণ ব্রাউজারে</h2>
<p>ফর্মে যদি স্বাক্ষরের প্রয়োজন হয়, তবে টেক্সট লেখার সাথে সাথেই সিগনেচার যুক্ত করুন। মাউস বা আঙুল দিয়ে সাইন আঁকুন অথবা টাইপ করা স্টাইলিশ স্বাক্ষর নির্বাচন করুন। কোনো সফটওয়্যার ইন্সটল বা স্ক্যানার ছাড়াই ৫ মিনিটের মধ্যে সম্পূর্ণ কাজ সম্পন্ন করা যায়। বিস্তারিত জানতে আমাদের <a href="/blog/free-pdf-e-signature-sign-documents-without-uploading/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">ফ্রি PDF ই-স্বাক্ষর গাইড</a> দেখতে পারেন।</p>

<h2>ফিক্স ৩: প্রিন্ট-টু-পিডিএফ ট্রিক (ভিউয়ার সমস্যা ফিক্স)</h2>
<p>যদি ফর্মে কোনো বাগ বা ভিউয়ার সমস্যার কারণে টাইপ করা না যায়, তবে ফাইলটি খুলে Print &gt; Save as PDF নির্বাচন করে নতুন একটি কপি তৈরি করুন। এটি ভিউয়ার সংক্রান্ত অনেক সমস্যা সমাধান করে দেয়।</p>

<h2>ফিক্স ৪: আঁকাবাঁকা স্ক্যান করা ফর্ম সোজা করে সাজানো</h2>
<p>যদি মোবাইল দিয়ে তোলা ফর্ম বাঁকা থাকে, তবে <a href="/rotate-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">Rotate PDF</a> দিয়ে পৃষ্ঠা সোজা করুন এবং <a href="/reorder-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">Reorder PDF</a> দিয়ে পৃষ্ঠার ক্রম ঠিক করুন। ছবিগুলোকে একত্রিত করতে ব্যবহার করুন <a href="/image-to-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">Image to PDF টুল</a>।</p>

<h2>ফিক্স ৫: যখন প্রাপক রিয়েল ফর্ম ফিল্ড দাবি করেন</h2>
<p>কিছু ব্যাংক বা সরকারি পোর্টাল স্বয়ংক্রিয়ভাবে ফিল্ড ডেটা রিড করে। সেক্ষেত্রে প্রেরকের কাছে আসল ফিলেবল কপি চেয়ে নিন অথবা একটি ফর্ম এডিটর ব্যবহার করে ইন্টারেক্টিভ ফিল্ড তৈরি করে নিন।</p>

<h2>ফর্ম পূরণের পর: ডেটা লক বা ফ্ল্যাটেন করুন</h2>
<p>ওভারলে পদ্ধতিতে ফর্ম পূরণের পর ফাইলটি ফ্ল্যাটেন করে নেওয়া উচিত। এতে আপনার টাইপ করা টেক্সট ডকুমেন্টের সাথে স্থায়ীভাবে যুক্ত হয়ে যায় এবং কেউ তা সরাতে বা পরিবর্তন করতে পারে না। <a href="/flatten-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">PdfMinty-এর Flatten PDF টুল</a> এক ক্লিকেই সম্পূর্ণ অফলাইনে এটি সম্পন্ন করে।</p>

<h2>সংক্ষিপ্ত সারসংক্ষেপ: ৫টি সমাধানের রূপরেখা</h2>
<div class="overflow-x-auto my-6">
  <table class="min-w-full text-left border-collapse border border-border-muted rounded-xl overflow-hidden">
    <thead>
      <tr class="bg-surface-container-high border-b border-border-muted text-on-surface">
        <th class="py-3 px-4 font-bold text-sm">আপনার পরিস্থিতি</th>
        <th class="py-3 px-4 font-bold text-sm">সেরা সমাধান</th>
        <th class="py-3 px-4 font-bold text-sm">ফলাফল</th>
      </tr>
    </thead>
    <tbody class="text-sm">
      <tr class="border-b border-border-muted">
        <td class="py-3 px-4 font-medium">ফর্মে কোনো ফিল্ড নেই; উত্তর টাইপ করতে হবে</td>
        <td class="py-3 px-4"><a href="/sign-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">ওভারলে টেক্সট (ফিক্স ১)</a></td>
        <td class="py-3 px-4">পরিচ্ছন্ন ও ডিজিটাল ফর্ম</td>
      </tr>
      <tr class="border-b border-border-muted">
        <td class="py-3 px-4 font-medium">স্বাক্ষর এবং উত্তর দুটোই প্রয়োজন</td>
        <td class="py-3 px-4"><a href="/sign-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">এক ধাপে ফিল ও সাইন (ফিক্স ২)</a></td>
        <td class="py-3 px-4">কয়েক মিনিটেই প্রস্তুত</td>
      </tr>
      <tr class="border-b border-border-muted">
        <td class="py-3 px-4 font-medium">ফিল্ড থাকলেও টাইপ হচ্ছে না</td>
        <td class="py-3 px-4">প্রিন্ট-টু-পিডিএফ রিসেট (ফিক্স ৩)</td>
        <td class="py-3 px-4">ত্রুটিমুক্ত নতুন কপি</td>
      </tr>
      <tr class="border-b border-border-muted">
        <td class="py-3 px-4 font-medium">ফর্মটি বাঁকা স্ক্যান বা ছবি</td>
        <td class="py-3 px-4"><a href="/image-to-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">পরিষ্কার করে পূরণ (ফিক্স ৪)</a></td>
        <td class="py-3 px-4">সুস্পষ্ট ও পাঠযোগ্য নথি</td>
      </tr>
      <tr class="border-b border-border-muted">
        <td class="py-3 px-4 font-medium">প্রাপক আসল ফিল্ড ডেটা দাবি করছেন</td>
        <td class="py-3 px-4">ফিলেবল মূল কপি সংগ্রহ (ফিক্স ৫)</td>
        <td class="py-3 px-4">বৈধ ও স্বীকৃত জমা</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>সাধারণ প্রশ্নোত্তর (FAQ)</h2>
<div class="space-y-4 my-6">
  <div>
    <h3 class="font-bold text-primary">প্রশ্ন ১. কেন কিছু PDF ফর্মে ফিল্ড থাকে এবং কিছুতে থাকে না?</h3>
    <p>উত্তর: কারণ ইন্টারেক্টিভ ফিল্ড একটি অতিরিক্ত লেয়ার যা লেখককে আলাদাভাবে যোগ করতে হয়। স্ক্যান বা সাধারণ এক্সপোর্টে এই লেয়ারটি থাকে না।</p>
  </div>
  <div>
    <h3 class="font-bold text-primary">প্রশ্ন ২. ওভারলে টেক্সট দিয়ে ফর্ম পূরণ কি আইনত বৈধ?</h3>
    <p>উত্তর: অধিকাংশ ক্ষেত্রেই হ্যাঁ — আইনিভাবে তথ্যের সঠিকতা ও স্বাক্ষরই মূল বিষয়।</p>
  </div>
  <div>
    <h3 class="font-bold text-primary">প্রশ্ন ৩. ফ্ল্যাটেন করার কাজ কী?</h3>
    <p>উত্তর: এটি টেক্সট ও স্বাক্ষরকে ডকুমেন্টের মূল পেজের সাথে স্থায়ীভাবে লক করে দেয়, যাতে অন্য কেউ তা পরিবর্তন বা সরাতে না পারে।</p>
  </div>
  <div>
    <h3 class="font-bold text-primary">প্রশ্ন ৪. মোবাইল থেকে কি এই কাজ করা সম্ভব?</h3>
    <p>উত্তর: হ্যাঁ, স্মার্টফোনের ব্রাউজারেও PdfMinty-এর সাইন ও ফিল টুল সমানভাবে কাজ করে।</p>
  </div>
</div>
`
  },
  de: {
    name: "PDF-Formular lässt sich nicht ausfüllen? So füllen Sie nicht-ausfüllbare Formulare aus (2026)",
    shortDesc: "Ihr PDF-Formular lässt keine Eingaben zu? Hier sind 5 Wege, um nicht-ausfüllbare PDF-Formulare digital auszufüllen, zu unterschreiben und zu speichern.",
    body: `
<p>Sie haben einen Antrag, ein Steuerformular oder einen Mietvertrag heruntergeladen. Sie klicken in das erste Feld, um Ihren Namen einzugeben — und der Cursor erscheint einfach nicht. Sie haben ein <strong>nicht-ausfüllbares PDF-Formular</strong> vor sich. Dieser Leitfaden erklärt, warum das passiert und bietet 5 digitale Lösungen ohne Drucker oder Scanner.</p>

<div class="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl my-6">
  <h2 class="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-2">Schnellantwort</h2>
  <p class="text-emerald-800 dark:text-emerald-300">Ihr Formular ist entweder ein gescanntes Bild oder eine zusammengeführte (flache) PDF-Datei. Die universelle Lösung: Öffnen Sie das Dokument in einem browserbasierten Overlay-Editor, platzieren Sie Textfelder an den gewünschten Stellen, tragen Sie Ihre Antworten ein und speichern Sie das Dokument ab.</p>
</div>

<h2>Warum verweigern manche PDFs die Texteingabe?</h2>
<p>Interaktive Formularfelder sind optional. Ein PDF ist primär ein Drucklayout-Format. Wenn der Ersteller keine interaktiven Formularfelder definiert hat, ist das Dokument lediglich ein digitales Bild eines Formulars.</p>

<h2>Lösung 1: Text über das Formular legen (Die Overlay-Methode)</h2>
<p>Mit dem <a href="/sign-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">PdfMinty Sign PDF Werkzeug</a> können Sie Textfelder, Datumsangaben und Kontrollkästchen direkt auf jeder beliebigen Seite platzieren — 100% lokal in Ihrem Browser, ohne Server-Upload.</p>

<h2>Lösung 2: Ausfüllen, signieren und absenden — Alles im Browser</h2>
<p>Fügen Sie Ihre Antworten ein und platzieren Sie Ihre handschriftliche oder getippte Signatur direkt im selben Schritt. In weniger als fünf Minuten ist Ihr Dokument fertig.</p>

<h2>Lösung 3: Der Drucken-als-PDF-Trick</h2>
<p>Falls interaktive Felder in Ihrem PDF-Betrachter fehlerhaft reagieren, drucken Sie die Datei über 'Als PDF speichern' neu aus, um die Anzeige zurückzusetzen.</p>

<h2>Lösung 4: Gescannte Vorlagen bereinigen</h2>
<p>Verwenden Sie <a href="/rotate-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">PDF drehen</a> und <a href="/reorder-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">Seiten neu anordnen</a>, um schiefe oder vertauschte Scans professionell vorzubereiten.</p>

<h2>Lösung 5: Wenn der Empfänger echte Formularfelder verlangt</h2>
<p>Manche Behörden verlangen echte interaktive Felder. Fordern Sie in diesem Fall die offizielle Vorlage an oder erstellen Sie die Felder in einem PDF-Formulareditor neu.</p>

<h2>Nach dem Ausfüllen: Antworten sperren (Flatten PDF)</h2>
<p>Verwenden Sie unser <a href="/flatten-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">Flatten PDF Werkzeug</a>, um alle eingegebenen Texte und Signaturen fest mit dem Dokument zu verschmelzen.</p>
`
  },
  es: {
    name: "¿El formulario PDF no te deja escribir? Cómo rellenar formularios no interactivos (2026)",
    shortDesc: "¿No puedes escribir en tu formulario PDF? Descubre 5 métodos para rellenar formularios PDF planos o escaneados, firmar y guardar sin imprimir.",
    body: `
<p>Descargaste un contrato o solicitud, haces clic en el primer campo para escribir tu nombre y el cursor no aparece. Tienes en tus manos un <strong>formulario PDF no interactivo o plano</strong>. En esta guía te mostramos 5 formas de completarlo de forma digital sin impresoras ni escáneres.</p>

<div class="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl my-6">
  <h2 class="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-2">Respuesta Rápida</h2>
  <p class="text-emerald-800 dark:text-emerald-300">Tu formulario es un documento escaneado o aplanado. La solución: ábrelo en una herramienta de edición superpuesta, añade texto sobre las líneas correspondientes, firma y guarda el archivo directamente en tu navegador.</p>
</div>

<h2>Solución 1: Superponer texto sobre el formulario (Método Overlay)</h2>
<p>Con la <a href="/sign-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">herramienta Firmar PDF de PdfMinty</a> puedes colocar texto, casillas de verificación y firmas en cualquier parte de la página, con privacidad total y sin subir archivos a ningún servidor.</p>

<h2>Solución 2: Rellenar y firmar en un solo paso en el navegador</h2>
<p>Escribe tus datos, añade tu firma dibujada o tipográfica y descarga tu documento listo en menos de 5 minutos.</p>

<h2>Solución 3: El truco de Imprimir a PDF</h2>
<p>Si un visor presenta fallos con los campos existentes, imprimir como un nuevo PDF ayuda a restablecer la visualización de la página.</p>

<h2>Solución 4: Limpiar y ordenar formularios escaneados</h2>
<p>Usa <a href="/rotate-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">Rotar PDF</a> y <a href="/reorder-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">Reordenar páginas</a> para dejar tu documento perfectamente alineado.</p>

<h2>Bloquea tus respuestas: Aplanar el PDF (Flatten)</h2>
<p>Usa nuestra herramienta <a href="/flatten-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">Aplanar PDF</a> para consolidar permanentemente el texto y la firma en el documento.</p>
`
  },
  fr: {
    name: "Impossible d'écrire dans un formulaire PDF ? Comment remplir des formulaires non interactifs (2026)",
    shortDesc: "Votre formulaire PDF ne permet pas la saisie ? Voici 5 méthodes pour remplir des formulaires aplatis ou scannés, signer et enregistrer sans imprimer.",
    body: `
<p>Vous avez téléchargé un formulaire ou un contrat. Vous cliquez sur la première case et rien ne se passe. Vous avez affaire à un <strong>formulaire PDF non remplissable</strong>. Ce guide vous explique pourquoi cela arrive et vous présente 5 solutions 100% numériques.</p>

<div class="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl my-6">
  <h2 class="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-2">Réponse Rapide</h2>
  <p class="text-emerald-800 dark:text-emerald-300">Votre formulaire est une image scannée ou un PDF aplati. La solution : ouvrez-le dans un outil de superposition de texte dans votre navigateur, tapez vos réponses et enregistrez le fichier sans rien imprimer.</p>
</div>

<h2>Solution 1 : Ajouter du texte par superposition</h2>
<p>L'<a href="/sign-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">outil Signer PDF de PdfMinty</a> vous permet de superposer du texte, des dates et des signatures directement dans votre navigateur en toute confidentialité.</p>

<h2>Solution 2 : Remplir et signer dans le navigateur</h2>
<p>Saisissez vos données, insérez votre signature électronique et exportez votre formulaire complet en moins de 5 minutes.</p>

<h2>Verrouillez vos réponses : Aplatir le PDF</h2>
<p>Utilisez l'<a href="/flatten-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">outil Aplatir PDF</a> pour fusionner définitivement votre texte et votre signature avec la page du document.</p>
`
  },
  hi: {
    name: "PDF फॉर्म में टाइप नहीं हो रहा? नॉन-फिलेबल फॉर्म भरने के 5 आसान तरीके (2026)",
    shortDesc: "क्या PDF फॉर्म में टाइप नहीं हो पा रहा? यहां बिना प्रिंट किए नॉन-फिलेबल PDF फॉर्म भरने, साइन करने और सेव करने के 5 बेहतरीन तरीके दिए गए हैं।",
    body: `
<p>आपने कोई फॉर्म, आवेदन या अनुबंध डाउनलोड किया और टाइप करने के लिए क्लिक किया, लेकिन कर्सर नहीं आया। यह एक <strong>नॉन-फिलेबल PDF फॉर्म</strong> है। इस गाइड में हम बिना प्रिंटर के इसे डिजिटली भरने के 5 तरीके जानेंगे।</p>

<div class="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl my-6">
  <h2 class="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-2">त्वरित समाधान</h2>
  <p class="text-emerald-800 dark:text-emerald-300">आपका फॉर्म एक स्कैन की गई इमेज या फ्लैटेड PDF है। इसका सबसे आसान हल है कि आप एक ब्राउज़र-आधारित टेक्स्ट ओवरले टूल का उपयोग करें और सीधे फॉर्म के ऊपर टाइप करके उसे सेव कर लें।</p>
</div>

<h2>तरीका 1: फॉर्म के ऊपर टेक्स्ट ओवरले का उपयोग करें</h2>
<p><a href="/sign-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">PdfMinty का Sign PDF टूल</a> आपको बिना किसी सर्वर अपलोड के सीधे अपने ब्राउज़र में टेक्स्ट, टिक मार्क और तारीख जोड़ने की सुविधा देता है।</p>

<h2>तरीका 2: भरें, साइन करें और तुरंत भेजें</h2>
<p>टेक्स्ट भरने के साथ ही अपनी डिजिटल या टाइप की गई सिग्नेचर जोड़ें और 5 मिनट में फॉर्म तैयार करें।</p>

<h2>फॉर्म भरने के बाद: डेटा को लॉक या Flatten करें</h2>
<p>अपने भरे हुए टेक्स्ट को स्थायी बनाने के लिए हमारे <a href="/flatten-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">Flatten PDF टूल</a> का उपयोग करें।</p>
`
  },
  zh: {
    name: "PDF 表格无法输入？如何填写不可填写的 PDF 表单 (2026)",
    shortDesc: "PDF 表格点不进去无法打字？表单可能已被展平或为扫描图片。本文提供 5 种无需打印即可添加文字、签名并保存的实用方法。",
    body: `
<p>您下载了申请表或合同，点击第一个框准备输入姓名，光标却没有出现。这是一份<strong>不可填写的平面 PDF 表单</strong>。本指南将介绍 5 种完全无需打印或扫描仪的数字化填写方案。</p>

<div class="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl my-6">
  <h2 class="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-2">快速解答</h2>
  <p class="text-emerald-800 dark:text-emerald-300">您的表单通常是扫描图片或已展平的 PDF。最佳解决办法：在浏览器端打开文本叠加工具，在相应横线上输入内容、添加签名并保存即可。</p>
</div>

<h2>方法 1：使用文字叠加层（Overlay 模式）</h2>
<p><a href="/sign-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">PdfMinty 签名与填写工具</a> 允许您在页面任意位置放置文本、复选框和日期，完全在本地运行，零文件上传，保障绝对隐私。</p>

<h2>方法 2：一站式填写与签名</h2>
<p>在添加文本的同时绘制或键入您的签名，5 分钟内即可导出正式文件。</p>

<h2>填写完成后：展平 PDF（Flatten）锁定内容</h2>
<p>使用我们的 <a href="/flatten-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">展平 PDF 工具</a>，将输入的文字和签名与原始页面永久合并，防止篡改。</p>
`
  },
  en: {
    name: "PDF Form Won't Let You Type? How to Fill Out Non-Fillable Forms (2026)",
    shortDesc: "PDF form won't let you type? The form is flattened or an image. Here are 5 ways to fill non-fillable PDF forms — add text, sign, and save without printing anything.",
    body: `
<p>You downloaded the application form, the tax template, the rental agreement. You click into the first field to type your name — and the cursor never appears. You click every box, every line, every gray rectangle. Nothing. The printer sits in the corner looking smug, and the form's deadline is not going to move.</p>

<p>What you have is a <strong>non-fillable PDF form</strong> — a document that looks like a form but contains no interactive fields. It is one of the most common document problems in existence, and it has good solutions that do not involve paper, ink, or a scanner. This guide explains why this happens and gives you five ways to complete the form digitally, from the two-minute fix to the full rebuild.</p>

<div class="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl my-6">
  <h2 class="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-2">Quick Answer</h2>
  <p class="text-emerald-800 dark:text-emerald-300">Your form is almost certainly one of two things: a scanned image of a paper form, or a flattened PDF whose fields were converted to permanent ink. Either way, the fix that works for both: open the form in a tool that lets you place text on top of the page (an overlay editor), type your answers where they belong, and save. Browser-side sign-and-fill tools do exactly this without printing anything.</p>
</div>

<h2>Why PDF Forms Refuse Typing: The Real Reason</h2>
<h3>Interactive fields are optional</h3>
<p>A PDF is, at heart, a print-layout format — a description of ink on pages. Fillable forms are an optional layer built on top: interactive fields (text boxes, checkboxes, signature areas) that some author must deliberately add with a form editor. If nobody added them, the document is just a picture of a form, and no amount of clicking will summon fields that do not exist. When you click a line and expect typing, you are assuming a layer that was never built.</p>

<h3>Three origins of non-fillable forms</h3>
<ul class="list-disc pl-5 my-4 space-y-2">
  <li><strong>The scan:</strong> A paper form was scanned or photographed — every field is literally part of a photo. Extremely common with government, medical, and older corporate paperwork.</li>
  <li><strong>The flatten:</strong> A fillable form was converted so its fields became permanent content — usually to lock in data, prevent edits, or guarantee identical appearance everywhere. Once flattened, the fields are ink, not widgets.</li>
  <li><strong>The export:</strong> The form was designed in Word or a layout tool and exported to PDF for distribution, without ever adding PDF form fields. Looks perfect; types nothing.</li>
</ul>

<h2>First, Confirm the Fields Are Really Missing</h2>
<p>Occasionally fields exist but the viewer is the problem — an outdated reader, a browser preview mode, or a restriction flag suppressing interaction. Thirty seconds of checking saves you a workaround you did not need.</p>
<ol class="list-decimal pl-5 my-4 space-y-2">
  <li><strong>Hover test:</strong> Move the cursor over a field area. Fillable fields usually show a subtle highlight or a pointing-finger cursor as you pass over them. Plain arrow cursor everywhere = no fields.</li>
  <li><strong>Highlight test:</strong> In Adobe Reader, open Edit &gt; Preferences &gt; Forms and enable field highlighting, or look for the purple form bar. Fields, if they exist, glow light blue across the whole document.</li>
  <li><strong>Second-viewer test:</strong> Open the form in a different reader or drag it into a browser. If fields appear and work there, your original viewer was the problem — update or replace it. If two viewers agree there are no fields, there are no fields.</li>
</ol>

<h2>Fix 1: Place Text on Top of the Form (The Overlay Method)</h2>
<p>The universal solution: treat the form as a background image and add your text as a new layer on top. PDF editors call this adding text or typewriter mode — you click where an answer belongs, type, adjust the font size to fit the printed line, and move to the next blank.</p>
<p>Browser-side tools are the natural fit here. <a href="/sign-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">PdfMinty's Sign PDF tool</a> places typed text anywhere on the page — along with checkboxes, dates, and drawn or typed signatures — and because processing is local, your completed form never uploads to anyone's server.</p>

<h2>Fix 2: Fill It, Sign It, Send It Back — All in the Browser</h2>
<p>If the form needs a signature, the overlay method extends naturally: fill the text fields, then add your signature in the same pass. Draw it with the mouse or finger, or type your name in a signature font, position it over the signature line, and resize it to fit. A completed, signed form can be out the door in under five minutes.</p>

<h2>Fix 3: The Print-to-PDF Trick (Fixing Viewer Quirks)</h2>
<p>A lesser-known move for a specific situation: when a form has fields that misbehave in your current viewer (they exist but typing does nothing), print the document to PDF while the form is open to reset viewer quirks.</p>

<h2>Fix 4: Rebuild a Scanned Form Cleanly</h2>
<p>Straighten and reassemble the pages — <a href="/reorder-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">reorder pages</a> so the form flows in the right order, and use <a href="/rotate-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">rotate PDF</a> to fix upside-down or sideways pages. Rebuild image files into PDF with our <a href="/image-to-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">Image to PDF tool</a>.</p>

<h2>Fix 5: When the Receiver Insists on Real Form Fields</h2>
<p>Some workflows validate submissions by reading actual field data. Ask the sender for the fillable original or rebuild the interactive fields yourself in a form editor.</p>

<h2>After Filling: Lock Your Answers In</h2>
<p>Flattening the document merges your overlay text permanently into the page, locking everything in place. <a href="/flatten-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline">PdfMinty's Flatten PDF tool</a> does this in one click, in your browser, with nothing uploaded.</p>
`
  }
};

const articleId = 'blog-pdf-form-wont-let-me-type';

for (const [lang, data] of Object.entries(translations)) {
  const filePath = path.join(localesDir, lang, 'common.json');
  if (fs.existsSync(filePath)) {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!json.articles) {
      json.articles = {};
    }
    json.articles[articleId] = {
      name: data.name,
      shortDesc: data.shortDesc,
      body: data.body
    };
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`✅ Successfully added ${lang} translation for ${articleId}`);
  }
}
