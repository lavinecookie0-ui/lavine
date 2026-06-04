'use client';

import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, X, ZoomIn, Check, Building2, Camera, Lock, Candy } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { uploadImage, generateStoragePath } from '@/lib/firebase/storage';
import { createApplication } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/Button';
import { TR_CITIES } from '@/lib/utils';
import toast from 'react-hot-toast';

const DISTRICTS: Record<string, string[]> = {
  'Adana': ['Seyhan', 'Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Kozan', 'İmamoğlu', 'Karataş', 'Pozantı', 'Aladağ', 'Tufanbeyli', 'Feke', 'Saimbeyli', 'Karaisalı'],
  'Adıyaman': ['Merkez', 'Besni', 'Kahta', 'Gölbaşı', 'Sincik', 'Çelikhan', 'Gerger', 'Tut', 'Samsat'],
  'Afyonkarahisar': ['Merkez', 'Sandıklı', 'Dinar', 'Bolvadin', 'Emirdağ', 'Çay', 'İscehisar', 'Sultandağı', 'Şuhut', 'Dazkırı', 'Bayat', 'Başmakçı', 'Kızılören', 'Çobanlar'],
  'Ağrı': ['Merkez', 'Patnos', 'Doğubayazıt', 'Diyadin', 'Eleşkirt', 'Hamur', 'Taşlıçay', 'Tutak'],
  'Amasya': ['Merkez', 'Merzifon', 'Suluova', 'Taşova', 'Gümüşhacıköy', 'Hamamözü', 'Göynücek'],
  'Ankara': ['Çankaya', 'Keçiören', 'Mamak', 'Yenimahalle', 'Altındağ', 'Etimesgut', 'Sincan', 'Pursaklar', 'Gölbaşı', 'Polatlı', 'Kazan', 'Çubuk', 'Elmadağ', 'Bala', 'Haymana', 'Nallıhan', 'Güdül', 'Beypazarı', 'Ayaş'],
  'Antalya': ['Muratpaşa', 'Kepez', 'Konyaaltı', 'Alanya', 'Manavgat', 'Serik', 'Aksu', 'Döşemealtı', 'Kaş', 'Kemer', 'Finike', 'Kumluca', 'Elmalı', 'Korkuteli', 'İbradı', 'Demre', 'Akseki', 'Gazipaşa'],
  'Artvin': ['Merkez', 'Arhavi', 'Borçka', 'Hopa', 'Murgul', 'Şavşat', 'Yusufeli', 'Ardanuç'],
  'Aydın': ['Efeler', 'Didim', 'Kuşadası', 'Söke', 'Nazilli', 'İncirliova', 'Köşk', 'Germencik', 'Buharkent', 'Kuyucak', 'Sultanhisar', 'Karacasu', 'Yenipazar', 'Bozdoğan', 'Çine', 'Koçarlı'],
  'Balıkesir': ['Altıeylül', 'Karesi', 'Ayvalık', 'Edremit', 'Bandırma', 'Gönen', 'Burhaniye', 'Havran', 'İvrindi', 'Balya', 'Dursunbey', 'Kepsut', 'Bigadiç', 'Savaştepe', 'Pamukçu', 'Erdek', 'Marmara', 'Susurluk'],
  'Bilecik': ['Merkez', 'Bozüyük', 'Osmaneli', 'Söğüt', 'Pazaryeri', 'Gölpazarı', 'İnhisar', 'Yenipazar'],
  'Bingöl': ['Merkez', 'Genç', 'Karlıova', 'Kiğı', 'Solhan', 'Adaklı', 'Yayladere', 'Yedisu'],
  'Bitlis': ['Merkez', 'Tatvan', 'Ahlat', 'Adilcevaz', 'Güroymak', 'Hizan', 'Mutki'],
  'Bolu': ['Merkez', 'Gerede', 'Göynük', 'Kıbrıscık', 'Mengen', 'Mudurnu', 'Seben', 'Dörtdivan', 'Yeniçağa'],
  'Burdur': ['Merkez', 'Bucak', 'Gölhisar', 'Tefenni', 'Yeşilova', 'Karamanlı', 'Çavdır', 'Ağlasun', 'Altınyayla'],
  'Bursa': ['Osmangazi', 'Yıldırım', 'Nilüfer', 'Gürsu', 'Kestel', 'İnegöl', 'Gemlik', 'Mudanya', 'Mustafakemalpaşa', 'Orhangazi', 'İznik', 'Karacabey', 'Yenişehir', 'Orhaneli', 'Büyükorhan', 'Harmancık', 'Keles'],
  'Çanakkale': ['Merkez', 'Biga', 'Çan', 'Gelibolu', 'Lapseki', 'Yenice', 'Bayramiç', 'Ayvacık', 'Ezine', 'Gökçeada', 'Bozcaada', 'Eceabat'],
  'Çankırı': ['Merkez', 'Çerkeş', 'Ilgaz', 'Kurşunlu', 'Orta', 'Şabanözü', 'Yapraklı', 'Atkaracalar', 'Kızılırmak', 'Bayramören', 'Eldivan'],
  'Çorum': ['Merkez', 'Sungurlu', 'Alaca', 'İskilip', 'Osmancık', 'Bayat', 'Mecitözü', 'Dodurga', 'Kargı', 'Lacin', 'Oğuzlar', 'Ortaköy', 'Uğurludağ', 'Boğazkale'],
  'Denizli': ['Merkezefendi', 'Pamukkale', 'Acıpayam', 'Çivril', 'Tavas', 'Buldan', 'Çal', 'Sarayköy', 'Honaz', 'Kale', 'Güney', 'Bozkurt', 'Bekilli', 'Çardak', 'Babadağ', 'Beyağaç', 'Serinhisar'],
  'Diyarbakır': ['Bağlar', 'Kayapınar', 'Sur', 'Yenişehir', 'Bismil', 'Ergani', 'Silvan', 'Çınar', 'Lice', 'Kulp', 'Eğil', 'Hani', 'Kocaköy', 'Çermik', 'Çüngüş', 'Dicle'],
  'Edirne': ['Merkez', 'Keşan', 'Uzunköprü', 'İpsala', 'Enez', 'Havsa', 'Lalapaşa', 'Meriç', 'Süloğlu'],
  'Elazığ': ['Merkez', 'Karakoçan', 'Kovancılar', 'Sivrice', 'Arıcak', 'Baskil', 'Keban', 'Alacakaya', 'Maden', 'Palu', 'Ağın'],
  'Erzincan': ['Merkez', 'Refahiye', 'Tercan', 'Üzümlü', 'Çayırlı', 'İliç', 'Kemah', 'Kemaliye', 'Otlukbeli'],
  'Erzurum': ['Yakutiye', 'Aziziye', 'Palandöken', 'Oltu', 'Aşkale', 'Horasan', 'İspir', 'Narman', 'Olur', 'Pasinler', 'Şenkaya', 'Tekman', 'Tortum', 'Uzundere', 'Çat', 'Hinis', 'Karaçoban', 'Karayazı', 'Köprüköy'],
  'Eskişehir': ['Odunpazarı', 'Tepebaşı', 'Sivrihisar', 'Çifteler', 'Mihalıççık', 'Mahmudiye', 'İnönü', 'Alpu', 'Beylikova', 'Günyüzü', 'Han', 'Mihalgazi', 'Sarıcakaya'],
  'Gaziantep': ['Şahinbey', 'Şehitkamil', 'Nizip', 'İslahiye', 'Nurdağı', 'Oğuzeli', 'Araban', 'Yavuzeli', 'Karkamış'],
  'Giresun': ['Merkez', 'Bulancak', 'Espiye', 'Tirebolu', 'Görele', 'Alucra', 'Çamoluk', 'Çanakçı', 'Dereli', 'Doğankent', 'Eynesil', 'Güce', 'Keşap', 'Piraziz', 'Şebinkarahisar', 'Yağlıdere'],
  'Gümüşhane': ['Merkez', 'Kelkit', 'Kürtün', 'Şiran', 'Torul', 'Köse'],
  'Hakkari': ['Merkez', 'Çukurca', 'Şemdinli', 'Yüksekova'],
  'Hatay': ['Antakya', 'İskenderun', 'Defne', 'Dörtyol', 'Arsuz', 'Payas', 'Erzin', 'Hassa', 'Kırıkhan', 'Kumlu', 'Reyhanlı', 'Samandağ', 'Yayladağı', 'Altınözü', 'Belen'],
  'Iğdır': ['Merkez', 'Aralık', 'Karakoyunlu', 'Tuzluca'],
  'Isparta': ['Merkez', 'Eğirdir', 'Yalvaç', 'Şarkikaraağaç', 'Senirkent', 'Gelendost', 'Aksu', 'Atabey', 'Gönen', 'Keçiborlu', 'Sütçüler', 'Uluborlu'],
  'İstanbul': ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'],
  'İzmir': ['Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla'],
  'Kahramanmaraş': ['Dulkadiroğlu', 'Onikişubat', 'Elbistan', 'Afşin', 'Göksun', 'Andırın', 'Çağlayancerit', 'Ekinözü', 'Nurhak', 'Pazarcık', 'Türkoğlu'],
  'Karabük': ['Merkez', 'Safranbolu', 'Yenice', 'Eskipazar', 'Eflani', 'Ovacık'],
  'Karaman': ['Merkez', 'Ermenek', 'Ayrancı', 'Başyayla', 'Kazımkarabekir', 'Sarıveliler'],
  'Kars': ['Merkez', 'Sarıkamış', 'Kağızman', 'Selim', 'Arpaçay', 'Digor', 'Akyaka', 'Susuz'],
  'Kastamonu': ['Merkez', 'Taşköprü', 'Tosya', 'Cide', 'İnebolu', 'Bozkurt', 'Daday', 'Araç', 'Abana', 'Ağlı', 'Azdavay', 'Çatalzeytin', 'Doğanyurt', 'Hanönü', 'İhsangazi', 'Küre', 'Pınarbaşı', 'Seydiler', 'Şenpazar', 'Azdavay'],
  'Kayseri': ['Kocasinan', 'Melikgazi', 'Talas', 'Hacılar', 'Develi', 'Tomarza', 'Yahyalı', 'Bünyan', 'Felahiye', 'İncesu', 'Özvatan', 'Pınarbaşı', 'Sarıoğlan', 'Sarız', 'Yeşilhisar', 'Akkışla'],
  'Kilis': ['Merkez', 'Elbeyli', 'Musabeyli', 'Polateli'],
  'Kırıkkale': ['Merkez', 'Delice', 'Keskin', 'Sulakyurt', 'Bahşili', 'Balışeyh', 'Çelebi', 'Karakılıç', 'Yahşihan'],
  'Kırklareli': ['Merkez', 'Lüleburgaz', 'Babaeski', 'Vize', 'Pehlivanköy', 'Demirköy', 'Kofçaz', 'Pınarhisar'],
  'Kırşehir': ['Merkez', 'Kaman', 'Mucur', 'Çiçekdağı', 'Akpınar', 'Akçakent', 'Boztepe'],
  'Kocaeli': ['İzmit', 'Gebze', 'Darıca', 'Gölcük', 'Körfez', 'Çayırova', 'Dilovası', 'Başiskele', 'Kartepe', 'İzmit', 'Kandıra', 'Karamürsel', 'Derince'],
  'Konya': ['Selçuklu', 'Meram', 'Karatay', 'Ereğli', 'Akşehir', 'Beyşehir', 'Seydişehir', 'Ilgın', 'Çumra', 'Kulu', 'Sarayönü', 'Cihanbeyli', 'Kadınhanı', 'Bozkır', 'Derbent', 'Derebucak', 'Doğanhisar', 'Emirgazi', 'Güneysınır', 'Hadim', 'Hüyük', 'Karapınar', 'Taşkent', 'Tuzlukçu', 'Yalıhüyük'],
  'Kütahya': ['Merkez', 'Tavşanlı', 'Simav', 'Gediz', 'Emet', 'Domaniç', 'Altıntaş', 'Aslanapa', 'Çavdarhisar', 'Dumlupınar', 'Hisarcık', 'Pazarlar', 'Şaphane'],
  'Malatya': ['Battalgazi', 'Yeşilyurt', 'Akçadağ', 'Arapgir', 'Arguvan', 'Darende', 'Doğanşehir', 'Doğanyol', 'Hekimhan', 'Kale', 'Kuluncak', 'Pütürge', 'Yazıhan'],
  'Manisa': ['Şehzadeler', 'Yunusemre', 'Akhisar', 'Turgutlu', 'Salihli', 'Soma', 'Alaşehir', 'Saruhanlı', 'Kırkağaç', 'Gördes', 'Demirci', 'Ahmetli', 'Gölmarmara', 'Kula', 'Selendi', 'Köprübaşı'],
  'Mardin': ['Artuklu', 'Kızıltepe', 'Nusaybin', 'Midyat', 'Derik', 'Mazıdağı', 'Dargeçit', 'Ömerli', 'Savur', 'Yeşilli'],
  'Mersin': ['Akdeniz', 'Mezitli', 'Toroslar', 'Yenişehir', 'Tarsus', 'Erdemli', 'Silifke', 'Anamur', 'Mut', 'Aydıncık', 'Bozyazı', 'Çamlıyayla', 'Gülnar'],
  'Muğla': ['Menteşe', 'Bodrum', 'Fethiye', 'Marmaris', 'Milas', 'Datça', 'Köyceğiz', 'Ortaca', 'Dalaman', 'Seydikemer', 'Kavaklıdere', 'Ula', 'Yatağan'],
  'Muş': ['Merkez', 'Bulanık', 'Malazgirt', 'Varto', 'Hasköy', 'Korkut'],
  'Nevşehir': ['Merkez', 'Avanos', 'Derinkuyu', 'Gülşehir', 'Hacıbektaş', 'Kozaklı', 'Ürgüp', 'Acıgöl'],
  'Niğde': ['Merkez', 'Bor', 'Çamardı', 'Ulukışla', 'Altunhisar', 'Çiftlik'],
  'Ordu': ['Altınordu', 'Ünye', 'Fatsa', 'Giresun', 'Perşembe', 'Kabadüz', 'Akkuş', 'Aybastı', 'Çamaş', 'Çatalpınar', 'Çaybaşı', 'Gülyalı', 'Gürgentepe', 'İkizce', 'Kabataş', 'Korgan', 'Kumru', 'Mesudiye', 'Ulubey'],
  'Osmaniye': ['Merkez', 'Kadirli', 'Düziçi', 'Bahçe', 'Hasanbeyli', 'Sumbas', 'Toprakkale'],
  'Rize': ['Merkez', 'Çayeli', 'Ardeşen', 'Fındıklı', 'Güneysu', 'Hemşin', 'İkizdere', 'İyidere', 'Kalkandere', 'Pazar', 'Derepazarı', 'Çamlıhemşin'],
  'Sakarya': ['Adapazarı', 'Arifiye', 'Erenler', 'Serdivan', 'Akyazı', 'Geyve', 'Hendek', 'Karapürçek', 'Karasu', 'Kaynarca', 'Kocaali', 'Pamukova', 'Sapanca', 'Söğütlü', 'Taraklı', 'Ferizli'],
  'Samsun': ['Atakum', 'Canik', 'İlkadım', 'Tekkeköy', 'Bafra', 'Çarşamba', 'Terme', 'Alaçam', 'Ayvacık', 'Asarcık', 'Havza', 'Kavak', 'Ladik', 'Ondokuzmayıs', 'Salıpazarı', 'Vezirköprü', 'Yakakent'],
  'Siirt': ['Merkez', 'Kurtalan', 'Pervari', 'Baykan', 'Eruh', 'Şirvan', 'Tillo'],
  'Sinop': ['Merkez', 'Boyabat', 'Gerze', 'Ayancık', 'Dikmen', 'Durağan', 'Erfelek', 'Saraydüzü', 'Türkeli'],
  'Sivas': ['Merkez', 'Şarkışla', 'Gemerek', 'Suşehri', 'Yıldızeli', 'Zara', 'Akıncılar', 'Altınyayla', 'Divriği', 'Doğanşar', 'Gölova', 'Gürün', 'Hafik', 'İmranlı', 'Kangal', 'Koyulhisar', 'Ulaş'],
  'Şanlıurfa': ['Eyyübiye', 'Haliliye', 'Karaköprü', 'Birecik', 'Bozova', 'Ceylanpınar', 'Halfeti', 'Harran', 'Hilvan', 'Siverek', 'Suruç', 'Viranşehir', 'Akçakale'],
  'Şırnak': ['Merkez', 'Cizre', 'Silopi', 'İdil', 'Beytüşşebap', 'Güçlükonak', 'Uludere'],
  'Tekirdağ': ['Süleymanpaşa', 'Çorlu', 'Çerkezköy', 'Kapaklı', 'Ergene', 'Hayrabolu', 'Malkara', 'Marmaraereğlisi', 'Muratlı', 'Saray', 'Şarköy'],
  'Tokat': ['Merkez', 'Erbaa', 'Niksar', 'Turhal', 'Zile', 'Almus', 'Artova', 'Başçiftlik', 'Pazar', 'Reşadiye', 'Sulusaray', 'Yeşilyurt'],
  'Trabzon': ['Ortahisar', 'Akçaabat', 'Araklı', 'Arsin', 'Çarşıbaşı', 'Çaykara', 'Dernekpazarı', 'Düzköy', 'Hayrat', 'Köprübaşı', 'Maçka', 'Of', 'Sürmene', 'Şalpazarı', 'Tonya', 'Vakfıkebir', 'Yomra', 'Beşikdüzü', 'Çarşıbaşı'],
  'Tunceli': ['Merkez', 'Çemişgezek', 'Hozat', 'Mazgirt', 'Nazımiye', 'Ovacık', 'Pertek', 'Pülümür'],
  'Uşak': ['Merkez', 'Banaz', 'Eşme', 'Karahallı', 'Sivaslı', 'Ulubey'],
  'Van': ['İpekyolu', 'Tuşba', 'Edremit', 'Erciş', 'Özalp', 'Başkale', 'Çatak', 'Çaldıran', 'Gevaş', 'Gürpınar', 'Muradiye', 'Saray', 'Bahçesaray'],
  'Yalova': ['Merkez', 'Altınova', 'Armutlu', 'Çiftlikköy', 'Çınarcık', 'Termal'],
  'Yozgat': ['Merkez', 'Sorgun', 'Yerköy', 'Akdağmadeni', 'Boğazlıyan', 'Sarıkaya', 'Şefaatli', 'Aydıncık', 'Çandır', 'Çayıralan', 'Çekerek', 'Kadışehri', 'Saraykent', 'Yenifakılı'],
  'Zonguldak': ['Merkez', 'Ereğli', 'Çaycuma', 'Devrek', 'Alaplı', 'Gökçebey', 'Kilimli', 'Kozlu'],
};

const INP: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12,
  background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.08)',
  color: '#f1f1f5', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 150ms',
};
const LBL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#9898a8', marginBottom: 7 };
const FIELD: React.CSSProperties = { marginBottom: 0 };

const STEPS = [
  { num: 1, label: 'İşletme', icon: Building2 },
  { num: 2, label: 'Fotoğraflar', icon: Camera },
  { num: 3, label: 'Hesap', icon: Lock },
];

export default function ApplyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const districts = city ? (DISTRICTS[city] || []) : [];

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) { toast.error('En fazla 5 fotoğraf yükleyebilirsiniz'); return; }
    setPhotos(p => [...p, ...files]);
    setPhotoPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (i: number) => {
    setPhotos(p => p.filter((_, idx) => idx !== i));
    setPhotoPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const validateStep1 = () => {
    if (!businessName || !ownerName || !email || !phone || !city || !district || !address) {
      toast.error('Lütfen tüm zorunlu alanları doldurun'); return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!password || password.length < 6) { toast.error('Şifre en az 6 karakter olmalıdır'); return false; }
    if (password !== confirmPassword) { toast.error('Şifreler eşleşmiyor'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setSaving(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const path = generateStoragePath('applications', photo.name);
        const url = await uploadImage(photo, path);
        photoUrls.push(url);
      }
      await createApplication({ name: businessName, ownerName, email: email.trim().toLowerCase(), phone, city, district, address, taxNumber, photos: photoUrls });
      await setDoc(doc(db, 'users', credential.user.uid), { uid: credential.user.uid, email: email.trim().toLowerCase(), role: 'business', status: 'pending', createdAt: serverTimestamp() });
      await signOut(auth);
      toast.success('Başvurunuz alındı!');
      router.push('/pending');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') toast.error('Bu e-posta adresi zaten kullanılıyor');
      else toast.error('Başvuru gönderilemedi. Lütfen tekrar deneyin.');
    } finally { setSaving(false); }
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { e.target.style.borderColor = '#9f1239'; };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px 60px' }}>
      {/* Decorative glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -160, right: -160, width: 480, height: 480, background: 'rgba(159,18,57,0.06)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, background: 'rgba(16,185,129,0.04)', borderRadius: '50%', filter: 'blur(80px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 600, position: 'relative', zIndex: 1 }}>
        {/* Back link */}
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5c5c70', textDecoration: 'none', marginBottom: 28, transition: 'color 150ms' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#9898a8')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#5c5c70')}
        >
          <ArrowLeft size={14} /> Giriş sayfasına dön
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #881337, #9f1239)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(159,18,57,0.35)' }}>
            <Candy size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f1f5', margin: 0 }}>Bayilik Başvurusu</h1>
            <p style={{ fontSize: 13, color: '#5c5c70', margin: '4px 0 0' }}>Lavine bayi ağına katılın</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
          {STEPS.map(({ num, label, icon: Icon }, idx) => {
            const done = step > num;
            const active = step === num;
            return (
              <React.Fragment key={num}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? '#10b981' : active ? '#9f1239' : '#1e1e2a',
                    border: `2px solid ${done ? '#10b981' : active ? '#9f1239' : 'rgba(255,255,255,0.08)'}`,
                    transition: 'all 350ms', boxShadow: active ? '0 0 20px rgba(159,18,57,0.4)' : 'none',
                  }}>
                    {done ? <Check size={16} color="white" strokeWidth={3} /> : <Icon size={16} color={active ? 'white' : '#5c5c70'} />}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: done ? '#34d399' : active ? '#e11d48' : '#5c5c70', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: step > num ? '#10b981' : 'rgba(255,255,255,0.06)', margin: '0 0 20px', transition: 'background 350ms' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <div style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '28px 32px', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>

          {/* ─── Step 1: İşletme Bilgileri ─── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f1f5', margin: '0 0 22px' }}>İşletme Bilgileri</h2>
              <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={FIELD}>
                  <label style={LBL}>İşletme Adı *</label>
                  <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Örn: Tatlı Dünyası" style={INP} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
                <div style={FIELD}>
                  <label style={LBL}>Yetkili Adı Soyadı *</label>
                  <input value={ownerName} onChange={e => setOwnerName(e.target.value)} style={INP} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
                <div style={FIELD}>
                  <label style={LBL}>E-posta *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={INP} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
                <div style={FIELD}>
                  <label style={LBL}>Telefon *</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XX XXX XX XX" style={INP} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
                <div style={FIELD}>
                  <label style={LBL}>İl *</label>
                  <select value={city} onChange={e => { setCity(e.target.value); setDistrict(''); }}
                    style={{ ...INP, cursor: 'pointer', appearance: 'none' as any }}
                    onFocus={focusStyle} onBlur={blurStyle}
                  >
                    <option value="">İl seçin</option>
                    {TR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={FIELD}>
                  <label style={LBL}>İlçe *</label>
                  <select value={district} onChange={e => setDistrict(e.target.value)} disabled={!city}
                    style={{ ...INP, cursor: city ? 'pointer' : 'not-allowed', opacity: city ? 1 : 0.5, appearance: 'none' as any }}
                    onFocus={focusStyle} onBlur={blurStyle}
                  >
                    <option value="">İlçe seçin</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}

                  </select>
                </div>
                <div style={{ ...FIELD, gridColumn: '1 / -1' }}>
                  <label style={LBL}>Adres *</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3}
                    placeholder="Tam adresinizi girin..."
                    style={{ ...INP, resize: 'none' } as React.CSSProperties}
                    onFocus={focusStyle as any} onBlur={blurStyle as any}
                  />
                </div>
                <div style={FIELD}>
                  <label style={LBL}>Vergi No <span style={{ color: '#5c5c70', fontWeight: 400 }}>(isteğe bağlı)</span></label>
                  <input value={taxNumber} onChange={e => setTaxNumber(e.target.value)} style={INP} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <Button onClick={() => validateStep1() && setStep(2)} fullWidth size="lg">Devam Et →</Button>
              </div>
            </div>
          )}

          {/* ─── Step 2: Fotoğraflar ─── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f1f5', margin: '0 0 6px' }}>İşletme Fotoğrafları</h2>
              <p style={{ fontSize: 13, color: '#5c5c70', margin: '0 0 22px', lineHeight: 1.5 }}>İşletmenizin fotoğraflarını yükleyin — en fazla 5 adet (isteğe bağlı)</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                {photoPreviews.map((preview, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: '#1e1e2a' }}
                    onMouseEnter={e => { (e.currentTarget.querySelector('.overlay') as HTMLElement).style.opacity = '1'; }}
                    onMouseLeave={e => { (e.currentTarget.querySelector('.overlay') as HTMLElement).style.opacity = '0'; }}
                  >
                    <img src={preview} alt={`Fotoğraf ${i + 1}`} onClick={() => setLightboxPhoto(preview)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
                    <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 200ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <button onClick={() => setLightboxPhoto(preview)} style={{ padding: 8, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'flex' }}><ZoomIn size={14} /></button>
                      <button onClick={() => removePhoto(i)} style={{ padding: 8, background: 'rgba(239,68,68,0.4)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={14} /></button>
                    </div>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ aspectRatio: '1', borderRadius: 12, border: '2px dashed rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#5c5c70', transition: 'all 150ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(159,18,57,0.4)'; e.currentTarget.style.color = '#e11d48'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#5c5c70'; }}
                  >
                    <Upload size={22} />
                    <span style={{ fontSize: 11, fontWeight: 500 }}>Ekle</span>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoAdd} style={{ display: 'none' }} />

              <div style={{ display: 'flex', gap: 12 }}>
                <Button variant="secondary" onClick={() => setStep(1)}>← Geri</Button>
                <Button fullWidth onClick={() => setStep(3)} size="lg">Devam Et →</Button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Hesap ─── */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f1f5', margin: '0 0 22px' }}>Hesap Oluştur</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={LBL}>Şifre *</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    style={INP} onFocus={focusStyle} onBlur={blurStyle} placeholder="En az 6 karakter" />
                  <p style={{ fontSize: 11, color: '#5c5c70', marginTop: 6 }}>En az 6 karakter</p>
                </div>
                <div>
                  <label style={LBL}>Şifre Tekrar *</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    style={{ ...INP, borderColor: confirmPassword && password !== confirmPassword ? '#ef4444' : 'rgba(255,255,255,0.08)' }}
                    onFocus={focusStyle} onBlur={blurStyle} />
                  {confirmPassword && password !== confirmPassword && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>⚠ Şifreler eşleşmiyor</p>}
                </div>

                {/* Info box */}
                <div style={{ padding: '14px 16px', background: 'rgba(159,18,57,0.06)', border: '1px solid rgba(159,18,57,0.15)', borderRadius: 12 }}>
                  <p style={{ fontSize: 12, color: '#9898a8', lineHeight: 1.7, margin: 0 }}>
                    Başvurunuz onaylandıktan sonra <strong style={{ color: '#e11d48' }}>e-posta adresiniz</strong> ve belirlediğiniz şifre ile giriş yapabileceksiniz.
                    Onay süreci genellikle <strong style={{ color: '#f1f1f5' }}>1–3 iş günü</strong> içinde tamamlanır.
                  </p>
                </div>

                {/* Summary */}
                <div style={{ padding: '14px 16px', background: '#1e1e2a', borderRadius: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#5c5c70', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Başvuru Özeti</p>
                  {[
                    ['İşletme', businessName],
                    ['Yetkili', ownerName],
                    ['E-posta', email],
                    ['Konum', city && district ? `${city} / ${district}` : '-'],
                    ['Fotoğraf', `${photos.length} adet`],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#5c5c70' }}>{l}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f1f5' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Button variant="secondary" onClick={() => setStep(2)} type="button">← Geri</Button>
                  <Button type="submit" fullWidth loading={saving} size="lg">Başvuruyu Gönder 🚀</Button>
                </div>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#5c5c70', marginTop: 24 }}>
          Zaten hesabınız var mı?{' '}
          <Link href="/login" style={{ color: '#e11d48', textDecoration: 'none', fontWeight: 600 }}>Giriş yapın</Link>
        </p>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div onClick={() => setLightboxPhoto(null)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <img src={lightboxPhoto} alt="Önizleme" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 16 }} />
          <button onClick={() => setLightboxPhoto(null)}
            style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <X size={18} />
          </button>
        </div>
      )}

      <style>{`
        select option { background: #1e1e2a; color: #f1f1f5; }
      `}</style>
    </div>
  );
}
