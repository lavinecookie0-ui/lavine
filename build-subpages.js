const fs = require('fs');
const path = require('path');

const pagesData = {
  'biz-kimiz': {
    title: 'Biz Kimiz',
    desc: 'Üretimden teslimata kadar işletmelere özel profesyonel tatlı tedarik yapısı.',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80',
    content: `
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Hikayemiz</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 24 }}>Lavine olarak, kalite ve lezzeti bir araya getirerek kafe ve restoranlar için premium tatlı çözümleri sunuyoruz. Sektördeki deneyimimizle, en iyi malzemeleri seçip ustalıkla harmanlıyoruz.</p>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>Amacımız, işletmenizin vitrinini zenginleştirmek ve müşterilerinize unutulmaz tatlar sunmanızı sağlamaktır.</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, backdropFilter: 'blur(16px)' }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 32 }}>Sayılarla Lavine</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <p style={{ fontSize: 40, fontWeight: 800, color: '#9f1239', margin: 0 }}>500+</p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Aktif Nokta</p>
            </div>
            <div>
              <p style={{ fontSize: 40, fontWeight: 800, color: '#9f1239', margin: 0 }}>5</p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Özel Marka</p>
            </div>
            <div>
              <p style={{ fontSize: 40, fontWeight: 800, color: '#9f1239', margin: 0 }}>%100</p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Müşteri Memnuniyeti</p>
            </div>
            <div>
              <p style={{ fontSize: 40, fontWeight: 800, color: '#9f1239', margin: 0 }}>7/24</p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Destek</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  'imalattan-goruntuler': {
    title: 'İmalattan Görüntüler',
    desc: 'Hijyenik, modern ve yüksek kapasiteli üretim tesislerimiz.',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1600&q=80',
    content: `
      <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 40, maxWidth: 800, textAlign: 'center', margin: '0 auto 40px' }}>
        Üretim tesislerimizde en yüksek hijyen standartlarında, modern ekipmanlarla hazırlanan ürünlerimizin yapım aşamasından kesitler.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ height: 300, background: 'rgba(255,255,255,0.05)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <img src={\`https://images.unsplash.com/photo-\${1500000000000 + i}?w=600&q=80\`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
          </div>
        ))}
      </div>
    `
  },
  'etkinlikler': {
    title: 'Etkinlikler ve Sosyal Projeler',
    desc: 'Lavine olarak katıldığımız fuarlar, etkinlikler ve desteklediğimiz projeler.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80',
    content: `
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 32 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 32 }}>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Gastronomi Fuarı 2024</h3>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 24 }}>Sektörün önde gelen temsilcileriyle buluştuğumuz gastronomi fuarında yeni ürünlerimizi tanıttık.</p>
            <span style={{ color: '#9f1239', fontWeight: 600 }}>Detayları Oku &rarr;</span>
          </div>
        ))}
      </div>
    `
  },
  'referanslar': {
    title: 'Çalıştığımız Kafeler ve Markalar',
    desc: 'Kafe, restoran ve işletmeler için düzenli tedarik çözümleri sunuyoruz.',
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1600&q=80',
    content: `
      <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 60, maxWidth: 800, textAlign: 'center', margin: '0 auto 60px' }}>
        Türkiye'nin seçkin noktalarında Lavine lezzetleri misafirlerle buluşuyor.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Marka Logo {i}</span>
          </div>
        ))}
      </div>
    `
  },
  'hizmet-bolgeleri': {
    title: 'Hizmet Verilen İller',
    desc: 'Geniş lojistik ağımızla Türkiye\'nin birçok noktasına hizmet sağlıyoruz.',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1600&q=80',
    content: `
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 60, textAlign: 'center' }}>
        <h3 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Kusursuz Soğuk Zincir Lojistiği</h3>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto 40px' }}>Özel donanımlı araç filomuzla, ürünlerimizin tazeliğini ve formunu ilk günkü gibi koruyarak işletmenize ulaştırıyoruz.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
          {['İstanbul', 'Ankara', 'İzmir', 'Gaziantep', 'Bursa', 'Antalya', 'Adana'].map(city => (
            <span key={city} style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: 30, color: '#fff', fontWeight: 600 }}>{city}</span>
          ))}
        </div>
      </div>
    `
  },
  'demo-tatlilar': {
    title: 'Test Tatlıları ve Demolar',
    desc: 'Menünüzü yenilemeden önce ürünlerimizi tadın ve kalitemizi test edin.',
    image: 'https://images.unsplash.com/photo-1559620192-032c4bc4674e?w=1600&q=80',
    content: `
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Ücretsiz Demo Tadım</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 24 }}>İşletmenizin konseptine en uygun tatlıları seçmeniz için uzman ekibimiz demo sunumu gerçekleştiriyor.</p>
          <ul style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 2, paddingLeft: 20 }}>
            <li>Menünüze özel ürün eşleştirmesi</li>
            <li>Saklama ve servis koşulları eğitimi</li>
            <li>Tadım ve maliyet analizi</li>
          </ul>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Demo Talep Edin</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 32 }}>Lütfen randevu formunu doldurun, en kısa sürede sizinle iletişime geçelim.</p>
          <a href="/randevu-al" style={{ display: 'inline-block', background: '#fff', color: '#1e1e2a', padding: '16px 32px', borderRadius: 30, fontWeight: 700, textDecoration: 'none' }}>Randevu Al</a>
        </div>
      </div>
    `
  },
  'sss': {
    title: 'Sıkça Sorulan Sorular',
    desc: 'Operasyon süreçlerimiz ve ürünlerimiz hakkında merak edilenler.',
    image: 'https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?w=1600&q=80',
    content: `
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
          Sorularınızın yanıtlarını ana sayfamızdaki SSS bölümünde veya doğrudan bizimle iletişime geçerek bulabilirsiniz.
        </p>
      </div>
    `
  },
  'basinda-biz': {
    title: 'Basında Biz',
    desc: 'Lavine hakkında basında yer alan haberler ve incelemeler.',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=80',
    content: `
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 32 }}>
            <span style={{ color: '#9f1239', fontWeight: 600, fontSize: 14 }}>Gastronomi Dergisi</span>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '12px 0' }}>Sektörün Yükselen Yıldızı: Lavine</h3>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>Kafe ve restoranlara yönelik profesyonel tatlı çözümleri sunan Lavine, inovatif üretim anlayışıyla dikkat çekiyor.</p>
          </div>
        ))}
      </div>
    `
  },
  'gizlilik-ilkeleri': {
    title: 'Gizlilik İlkeleri',
    desc: 'Kişisel verilerinizin korunması ve gizlilik politikamız.',
    image: 'https://images.unsplash.com/photo-1633265486064-086b219458ce?w=1600&q=80',
    content: `
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 60, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
        <h3 style={{ color: '#fff', fontSize: 24, marginBottom: 24 }}>1. Veri Toplama</h3>
        <p style={{ marginBottom: 32 }}>Lavine olarak, hizmetlerimizi sunarken elde ettiğimiz kişisel verileri en üst düzeyde güvenlikle korumayı taahhüt ediyoruz.</p>
        <h3 style={{ color: '#fff', fontSize: 24, marginBottom: 24 }}>2. Veri Kullanımı</h3>
        <p>Toplanan veriler, siparişlerinizin ulaştırılması, müşteri hizmetleri ve kampanya bilgilendirmeleri amacıyla kullanılmaktadır.</p>
      </div>
    `
  },
  'sartlar-ve-kosullar': {
    title: 'Şartlar ve Koşullar',
    desc: 'Platform kullanım şartları ve B2B sözleşme koşulları.',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66cb85?w=1600&q=80',
    content: `
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 60, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
        <h3 style={{ color: '#fff', fontSize: 24, marginBottom: 24 }}>Genel Kullanım Şartları</h3>
        <p style={{ marginBottom: 32 }}>Bu web sitesini kullanarak, B2B paneline erişim sağladığınızda belirtilen kurallara ve kullanım koşullarına uymayı kabul etmiş sayılırsınız.</p>
        <p>Fiyatlandırma, sevkiyat süreleri ve minimum sipariş tutarları işletmeler arası sözleşmelere göre değişiklik gösterebilir.</p>
      </div>
    `
  }
};

const basePath = path.join(__dirname, 'src', 'app', '(public)');

Object.entries(pagesData).forEach(([slug, data]) => {
  const fileContent = `import React from 'react';
import { PageHero } from '@/components/public/PageHero';

export default function Page() {
  return (
    <div style={{ background: '#050508', minHeight: '100vh', paddingBottom: 120 }}>
      <PageHero 
        title="${data.title}" 
        description="${data.desc}"
        image="${data.image}"
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 0' }}>
        ${data.content}
      </div>
    </div>
  );
}
`;
  const filePath = path.join(basePath, slug, 'page.tsx');
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, fileContent);
  }
});
console.log('Static pages updated with dark theme and PageHero.');
