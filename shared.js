// ── SHAREKIT SHARED JS ──
// Included on every page via <script src="shared.js"></script>

const SK = {
  SUPABASE_URL: 'https://pdgbanfrpztnsvnheaob.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZ2JhbmZycHp0bnN2bmhlYW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMTk3MTEsImV4cCI6MjA5MTc5NTcxMX0.FtCy-o9fW6w1nMOwQO84TDtqN2ncFKtUrJ_kuHC6Hja',
  FILESTACK_KEY: 'Ahlx2i5waRYayFFIJaRCpz',
  SITE_URL: 'https://sharekit.in',
  CF: {
    proMonthly:       'https://payments.cashfree.com/forms?code=sharekit-pro-monthly',
    proYearly:        'https://payments.cashfree.com/forms/sharekit-pro-yearly',
    unlimitedMonthly: 'https://payments.cashfree.com/forms/sharekit-unlimited-monthly',
    unlimitedYearly:  'https://payments.cashfree.com/forms/sharekit-unlimited-yearly',
  },
  FREE_LIMITS: { images:10, videos:10, audio:10, docs:5, zips:5, apks:1, storage_gb:3, expiry_days:3 },
  PRO_LIMITS:  { images:10000, videos:10000, audio:10000, docs:5000, zips:5000, apks:100, storage_gb:500, expiry_days:30 },
};

// ── SUPABASE CLIENT ──
let _sb = null;
function getSB() {
  if (!_sb && window.supabase) _sb = window.supabase.createClient(SK.SUPABASE_URL, SK.SUPABASE_KEY);
  return _sb;
}

// ── AUTH HELPERS ──
async function getSession() {
  const sb = getSB();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

async function requireAuth() {
  const session = await getSession();
  if (!session) { window.location.href = 'login.html'; return null; }
  return session;
}

async function handleLogout() {
  const sb = getSB();
  if (sb) await sb.auth.signOut();
  window.location.href = 'login.html';
}

// ── UI HELPERS ──
function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = msg;
  el.className = 'sk-alert sk-alert-' + type + ' show';
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.className = 'sk-alert';
}

function setLoading(btnId, loading, label) {
  const b = document.getElementById(btnId);
  if (!b) return;
  b.disabled = loading;
  b.innerHTML = loading ? '<span class="sk-spinner"></span>&nbsp;' + label : label;
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function getFileEmoji(name) {
  if (!name) return '📎';
  const ext = (name.split('.').pop() || '').toLowerCase();
  const map = {
    jpg:'🖼️', jpeg:'🖼️', png:'🖼️', gif:'🖼️', heic:'🖼️', webp:'🖼️', svg:'🖼️',
    mp4:'🎬', mkv:'🎬', avi:'🎬', mov:'🎬', wmv:'🎬',
    mp3:'🎵', wav:'🎵', aac:'🎵', m4a:'🎵', flac:'🎵', ogg:'🎵',
    pdf:'📄', doc:'📄', docx:'📄', ppt:'📄', pptx:'📄', xls:'📄', xlsx:'📄', txt:'📄', csv:'📄',
    zip:'🗜️', rar:'🗜️', '7z':'🗜️', tar:'🗜️', gz:'🗜️',
    apk:'📱', ipa:'📱',
    exe:'⚙️', dmg:'⚙️', pkg:'⚙️',
  };
  return map[ext] || '📎';
}

function getFileCategory(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['jpg','jpeg','png','gif','heic','webp','svg'].includes(ext)) return 'images';
  if (['mp4','mkv','avi','mov','wmv'].includes(ext)) return 'videos';
  if (['mp3','wav','aac','m4a','flac','ogg'].includes(ext)) return 'audio';
  if (['pdf','doc','docx','ppt','pptx','xls','xlsx','txt','csv'].includes(ext)) return 'docs';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return 'zips';
  if (['apk','ipa'].includes(ext)) return 'apks';
  return 'other';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + 'd ago';
  return new Date(dateStr).toLocaleDateString('en-IN');
}

function daysLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function copyToClipboard(text, btnEl, successText) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btnEl.textContent;
    btnEl.textContent = successText || 'Copied!';
    btnEl.style.background = 'var(--green)';
    btnEl.style.color = '#000';
    setTimeout(() => {
      btnEl.textContent = orig;
      btnEl.style.background = '';
      btnEl.style.color = '';
    }, 2000);
  });
}

// ── SCROLL REVEAL ──
function initScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
}

// ── LANGUAGE SWITCHER ──
const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧', strings: {
    share: 'Share files', upload: 'Drop files here', transfer: 'Transfer',
    login: 'Log in', signup: 'Sign up free', dashboard: 'Dashboard', logout: 'Log out',
    hero_title: 'Share any file.', hero_sub: 'Instantly. Securely.',
    pricing: 'Pricing', features: 'Features', free: 'Free', pro: 'Pro', unlimited: 'Unlimited',
    copy_link: 'Copy link', copied: 'Copied!', uploading: 'Uploading…', done: 'Done!',
  }},
  hi: { name: 'हिन्दी', flag: '🇮🇳', strings: {
    share: 'फ़ाइलें साझा करें', upload: 'यहाँ फ़ाइलें डालें', transfer: 'भेजें',
    login: 'लॉग इन', signup: 'मुफ़्त साइन अप', dashboard: 'डैशबोर्ड', logout: 'लॉग आउट',
    hero_title: 'कोई भी फ़ाइल साझा करें।', hero_sub: 'तुरंत। सुरक्षित।',
    pricing: 'मूल्य निर्धारण', features: 'विशेषताएँ', free: 'मुफ़्त', pro: 'प्रो', unlimited: 'असीमित',
    copy_link: 'लिंक कॉपी करें', copied: 'कॉपी हो गया!', uploading: 'अपलोड हो रहा है…', done: 'हो गया!',
  }},
  bn: { name: 'বাংলা', flag: '🇧🇩', strings: {
    share: 'ফাইল শেয়ার করুন', upload: 'এখানে ফাইল ড্রপ করুন', transfer: 'পাঠান',
    login: 'লগ ইন', signup: 'বিনামূল্যে সাইন আপ', dashboard: 'ড্যাশবোর্ড', logout: 'লগ আউট',
    hero_title: 'যেকোনো ফাইল শেয়ার করুন।', hero_sub: 'তাৎক্ষণিক। নিরাপদ।',
    pricing: 'মূল্য', features: 'বৈশিষ্ট্য', free: 'বিনামূল্যে', pro: 'প্রো', unlimited: 'সীমাহীন',
    copy_link: 'লিংক কপি করুন', copied: 'কপি হয়েছে!', uploading: 'আপলোড হচ্ছে…', done: 'সম্পন্ন!',
  }},
  es: { name: 'Español', flag: '🇪🇸', strings: {
    share: 'Compartir archivos', upload: 'Suelta archivos aquí', transfer: 'Transferir',
    login: 'Iniciar sesión', signup: 'Registrarse gratis', dashboard: 'Panel', logout: 'Cerrar sesión',
    hero_title: 'Comparte cualquier archivo.', hero_sub: 'Al instante. Con seguridad.',
    pricing: 'Precios', features: 'Características', free: 'Gratis', pro: 'Pro', unlimited: 'Ilimitado',
    copy_link: 'Copiar enlace', copied: '¡Copiado!', uploading: 'Subiendo…', done: '¡Listo!',
  }},
  fr: { name: 'Français', flag: '🇫🇷', strings: {
    share: 'Partager des fichiers', upload: 'Déposez les fichiers ici', transfer: 'Transférer',
    login: 'Se connecter', signup: 'S\'inscrire gratuitement', dashboard: 'Tableau de bord', logout: 'Déconnexion',
    hero_title: 'Partagez n\'importe quel fichier.', hero_sub: 'Instantanément. En toute sécurité.',
    pricing: 'Tarifs', features: 'Fonctionnalités', free: 'Gratuit', pro: 'Pro', unlimited: 'Illimité',
    copy_link: 'Copier le lien', copied: 'Copié !', uploading: 'Envoi en cours…', done: 'Terminé !',
  }},
  de: { name: 'Deutsch', flag: '🇩🇪', strings: {
    share: 'Dateien teilen', upload: 'Dateien hier ablegen', transfer: 'Übertragen',
    login: 'Anmelden', signup: 'Kostenlos registrieren', dashboard: 'Dashboard', logout: 'Abmelden',
    hero_title: 'Jede Datei teilen.', hero_sub: 'Sofort. Sicher.',
    pricing: 'Preise', features: 'Funktionen', free: 'Kostenlos', pro: 'Pro', unlimited: 'Unbegrenzt',
    copy_link: 'Link kopieren', copied: 'Kopiert!', uploading: 'Wird hochgeladen…', done: 'Fertig!',
  }},
  pt: { name: 'Português', flag: '🇧🇷', strings: {
    share: 'Compartilhar arquivos', upload: 'Solte arquivos aqui', transfer: 'Transferir',
    login: 'Entrar', signup: 'Cadastrar grátis', dashboard: 'Painel', logout: 'Sair',
    hero_title: 'Compartilhe qualquer arquivo.', hero_sub: 'Instantaneamente. Com segurança.',
    pricing: 'Preços', features: 'Recursos', free: 'Grátis', pro: 'Pro', unlimited: 'Ilimitado',
    copy_link: 'Copiar link', copied: 'Copiado!', uploading: 'Enviando…', done: 'Pronto!',
  }},
  ru: { name: 'Русский', flag: '🇷🇺', strings: {
    share: 'Поделиться файлами', upload: 'Перетащите файлы сюда', transfer: 'Передать',
    login: 'Войти', signup: 'Регистрация бесплатно', dashboard: 'Панель', logout: 'Выйти',
    hero_title: 'Поделись любым файлом.', hero_sub: 'Мгновенно. Безопасно.',
    pricing: 'Цены', features: 'Возможности', free: 'Бесплатно', pro: 'Про', unlimited: 'Безлимит',
    copy_link: 'Скопировать ссылку', copied: 'Скопировано!', uploading: 'Загрузка…', done: 'Готово!',
  }},
  ar: { name: 'العربية', flag: '🇸🇦', dir: 'rtl', strings: {
    share: 'مشاركة الملفات', upload: 'أسقط الملفات هنا', transfer: 'إرسال',
    login: 'تسجيل الدخول', signup: 'إنشاء حساب مجاني', dashboard: 'لوحة التحكم', logout: 'تسجيل الخروج',
    hero_title: 'شارك أي ملف.', hero_sub: 'فوراً. بأمان.',
    pricing: 'الأسعار', features: 'المميزات', free: 'مجاني', pro: 'برو', unlimited: 'غير محدود',
    copy_link: 'نسخ الرابط', copied: 'تم النسخ!', uploading: 'جارٍ الرفع…', done: 'تم!',
  }},
  zh: { name: '中文', flag: '🇨🇳', strings: {
    share: '分享文件', upload: '将文件拖放到此处', transfer: '传输',
    login: '登录', signup: '免费注册', dashboard: '仪表板', logout: '退出',
    hero_title: '分享任何文件。', hero_sub: '即时。安全。',
    pricing: '定价', features: '功能', free: '免费', pro: '专业版', unlimited: '无限制',
    copy_link: '复制链接', copied: '已复制!', uploading: '上传中…', done: '完成!',
  }},
};

let currentLang = localStorage.getItem('sk_lang') || 'en';

function setLanguage(code) {
  currentLang = code;
  localStorage.setItem('sk_lang', code);
  const lang = LANGUAGES[code];
  if (!lang) return;
  document.documentElement.lang = code;
  document.documentElement.dir = lang.dir || 'ltr';
  // Update all elements with data-sk attributes
  document.querySelectorAll('[data-sk]').forEach(el => {
    const key = el.getAttribute('data-sk');
    if (lang.strings[key]) el.textContent = lang.strings[key];
  });
  // Update lang button display
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = lang.flag + ' ' + lang.name;
  // Close dropdown
  const dd = document.getElementById('langDropdown');
  if (dd) dd.style.display = 'none';
}

function toggleLangDropdown() {
  const dd = document.getElementById('langDropdown');
  if (!dd) return;
  dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
}

function buildLangDropdown(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const dd = document.createElement('div');
  dd.id = 'langDropdown';
  dd.style.cssText = 'display:none;position:absolute;top:calc(100% + 8px);right:0;background:var(--bg2);border:1px solid var(--border2);border-radius:12px;padding:6px;min-width:160px;z-index:200;max-height:300px;overflow-y:auto;';
  Object.entries(LANGUAGES).forEach(([code, lang]) => {
    const item = document.createElement('button');
    item.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;background:none;border:none;color:var(--text);font-family:inherit;font-size:0.85rem;cursor:pointer;border-radius:8px;text-align:left;';
    item.innerHTML = lang.flag + ' ' + lang.name;
    item.onmouseover = () => item.style.background = 'var(--bg3)';
    item.onmouseout  = () => item.style.background = 'none';
    item.onclick = () => setLanguage(code);
    dd.appendChild(item);
  });
  container.style.position = 'relative';
  container.appendChild(dd);
  // Close on outside click
  document.addEventListener('click', e => {
    if (!container.contains(e.target)) dd.style.display = 'none';
  });
}

// ── NAV AUTH STATE ──
async function updateNavAuth() {
  const session = await getSession();
  const loginLink = document.getElementById('navLogin');
  const signupLink = document.getElementById('navSignup');
  const dashLink = document.getElementById('navDash');
  if (session) {
    if (loginLink)  loginLink.style.display = 'none';
    if (signupLink) signupLink.style.display = 'none';
    if (dashLink)   dashLink.style.display = 'inline-flex';
  } else {
    if (dashLink) dashLink.style.display = 'none';
  }
}

// ── INIT ON PAGE LOAD ──
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  updateNavAuth();
  if (localStorage.getItem('sk_lang') && localStorage.getItem('sk_lang') !== 'en') {
    setLanguage(localStorage.getItem('sk_lang'));
  }
  const langContainer = document.getElementById('langBtnWrapper');
  if (langContainer) buildLangDropdown('langBtnWrapper');
});
