const fs = require('fs');
const path = require('path');

const pages = [
  { path: 'biz-kimiz', title: 'Biz Kimiz', desc: 'Lavine hakkında detaylı bilgi.' },
  { path: 'markalar', title: 'Markalar', desc: 'Tüm markalarımızı keşfedin.' },
  { path: 'imalattan-goruntuler', title: 'İmalattan Görüntüler', desc: 'Üretim süreçlerimizi inceleyin.' },
  { path: 'etkinlikler', title: 'Etkinlikler ve Sosyal Projeler', desc: 'Etkinliklerimizden haberdar olun.' },
  { path: 'referanslar', title: 'Referanslar', desc: 'Çalıştığımız seçkin markalar.' },
  { path: 'hizmet-bolgeleri', title: 'Hizmet Verilen İller', desc: 'Hizmet bölgelerimizi inceleyin.' },
  { path: 'demo-tatlilar', title: 'Test Tatlıları ve Demolar', desc: 'Demo süreçlerimiz hakkında bilgi alın.' },
  { path: 'sss', title: 'Sıkça Sorulan Sorular', desc: 'Merak edilen sorular.' },
  { path: 'musteri-yorumlari', title: 'Müşteri Yorumları', desc: 'Bizi müşterilerimizden dinleyin.' },
  { path: 'duyurular', title: 'Duyurular', desc: 'Lavine dünyasından son haberler.' },
  { path: 'basinda-biz', title: 'Basında Biz', desc: 'Basında yer alan haberlerimiz.' },
  { path: 'gizlilik-ilkeleri', title: 'Gizlilik İlkeleri', desc: 'Gizlilik ve veri politikamız.' },
  { path: 'sartlar-ve-kosullar', title: 'Şartlar ve Koşullar', desc: 'Kullanım şartlarımız.' },
];

const basePath = path.join(__dirname, 'src', 'app', '(public)');

const template = (title, desc) => `import React from 'react';

export default function Page() {
  return (
    <div style={{ padding: '120px 24px', minHeight: '60vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: '#1e1e2a', marginBottom: 24, letterSpacing: '-0.02em' }}>
          ${title}
        </h1>
        <p style={{ fontSize: 18, color: '#5c5c70', lineHeight: 1.6 }}>
          ${desc} (Bu sayfa yapım aşamasındadır.)
        </p>
      </div>
    </div>
  );
}
`;

pages.forEach(p => {
  const dir = path.join(basePath, p.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'page.tsx'), template(p.title, p.desc));
});

console.log('Pages scaffolded successfully.');
