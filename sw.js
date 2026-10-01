/* ============================================================
   Service Worker — تطبيق محمد ❤️ مروه
   الهدف: Website يتحول لتطبيق يتثبت على كل الموبايلات
   ويشتغل بسرعة حتى مع نت ضعيف
   ============================================================ */

const CACHE_NAME = 'rory-mahrouy-v1';

/* الملفات الأساسية اللي بتتخزن مرة واحدة */
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './favicon.ico',
    './icon-64.png',
    './icon-128.png',
    './icon-192.png',
    './icon-256.png',
    './icon-384.png',
    './icon-512.png',
    './icon-maskable-512.png',
    './apple-touch-icon.png',
    './1010.jpeg',
    './1000001.jpeg',
    './100000100.jpeg',
    './1001.jpeg'
];

/* ملفات الوسائط (الأغاني والفيديوهات) — ما بنتخزنهاش عشان حجمها كبير */
const MEDIA_RE = /\.(mp3|mp4|m4a|ogg|wav|webm|mov|mkv)$/i;

/* ---------- 1) التثبيت ---------- */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => {
                // addAll بيقف لو ملف واحد فشل، فبنضيف كل ملف لوحده بأمان
                return Promise.all(
                    CORE_ASSETS.map((url) =>
                        cache.add(new Request(url, { cache: 'reload' })).catch(() => null)
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

/* ---------- 2) التفعيل ---------- */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
                )
            )
            .then(() => self.clients.claim())
    );
});

/* ---------- 3) طلبات الملفات ---------- */
self.addEventListener('fetch', (event) => {
    const req = event.request;

    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // الملفات الخارجية (CDN) — نت مباشر بدون تدخل
    if (url.origin !== self.location.origin) return;

    // الأغاني والفيديوهات — نت مباشر بدون تخزين
    if (MEDIA_RE.test(url.pathname)) return;

    // الصفحة الرئيسية — الشبكة الأول عشان أي تحديث يظهر فوراً
    if (req.mode === 'navigate' || req.destination === 'document') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put('./index.html', copy));
                    return res;
                })
                .catch(() =>
                    caches.match('./index.html').then((cached) => cached || caches.match('./'))
                )
        );
        return;
    }

    // باقي الملفات (صور / أيقونات) — الكاش الأول، ثم الشبكة
    event.respondWith(
        caches.match(req).then((cached) => {
            const network = fetch(req)
                .then((res) => {
                    if (res && res.status === 200 && res.type === 'basic') {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
                    }
                    return res;
                })
                .catch(() => cached);

            return cached || network;
        })
    );
});

/* ---------- 4) طلب المستخدم للتحديث ---------- */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
