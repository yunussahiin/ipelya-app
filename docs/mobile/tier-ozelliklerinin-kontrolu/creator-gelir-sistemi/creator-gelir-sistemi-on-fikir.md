1. Gelir Raporu – Mobil Creator Uygulaması

1.1. Üst Özet Kartı
	•	Toplam Kazanç (Coin):
	•	Dönem filtresine göre toplam coin (hafta/ay/3 ay/6 ay/1 yıl/tümü).
	•	Toplam Kazanç (TL):
	•	Coin → TL dönüşümü (o anki geçerli oranla).
	•	Altında “≈ ₺X” ibaresi.
	•	Üzerine tıklayınca oran detayı açılan bottom sheet:
	•	“1 coin = ₺Y (Ops tarafından belirlenir, sadece bilgilendirme)”.
	•	Oranın son güncellenme tarihi.

1.2. Zaman Filtresi
	•	Şimdiki butonlar kalıyor: Hafta / Ay / 3 Ay / 6 Ay / 1 Yıl / Tümü
	•	Seçili zaman aralığı bütün aşağıdaki alanlara uygulanır:
	•	Toplam kazanç kartı
	•	Gelir dağılımı
	•	Grafikler
	•	İşlem listeleri

1.3. Gelir Dağılımı
	•	Başlık: Gelir Dağılımı
	•	Kart içinde:
	•	Abonelikler:
	•	Toplam coin + ≈ TL karşılığı
	•	İstersen tier bazlı breakdown için tıklayınca sheet:
	•	Tier 1 / Tier 2 / Tier 3
	•	Her biri için: Coin & TL
	•	Hediyeler:
	•	Toplam coin + ≈ TL
	•	Opsiyonel: Kampanyalar / Bonuslar (ileride ödül/bonus eklemek istersen)

1.4. Trend / İstatistik Bölümü (opsiyonel ama güçlü)
	•	Mini grafik alanı:
	•	Günlük/haftalık kazanç çizgi grafiği.
	•	En çok kazandıran gün/ay highlight edilebilir.
	•	“En çok kazandıran tier” / “En çok hediye atan 3 kullanıcı” gibi küçük insight kartları eklenebilir (ileride).

1.5. İşlem Geçmişi
	•	Başlık: İşlem Geçmişi
	•	Satır tipi:
	•	Solda ikon + tip:
	•	“Abonelik – Tier 2”
	•	“Hediye – Süper Hediye”
	•	Sağda:
	•	+150 coin (≈ ₺45)
	•	Alt satır: tarih & saat
	•	Filtre butonları:
	•	Tümü / Abonelikler / Hediyeler / Ödemeler

⸻

2. Ödeme Takvimi & Ödeme Yönetimi Bölümü

Bu bölümü mevcut ekranın altına yeni bir section olarak ekliyoruz.

2.1. Ödeme Durum Özeti
	•	Kart: Ödeme Özeti
	•	“Çekilebilir Bakiye: X coin (≈ ₺Y)”
	•	“Bekleyen Ödeme Talebi: ₺Z” (varsa)
	•	“Minimum ödeme tutarı: 500 coin / ≈ ₺…” bilgilendirmesi.

2.2. Ödeme Yöntemi Durumu
	•	Küçük bir bilgi satırı/kart:
	•	Durumlar:
	•	Ödeme yöntemi eklenmemiş → “Ödeme alabilmek için önce bir yöntem eklemelisin.” + “Ödeme Yöntemi Ekle” butonu.
	•	Onay Bekliyor → “Ödeme yöntemin ops tarafından inceleniyor.”
	•	Onaylandı → “Ödeme yöntemlerin hazır, ödeme talebi oluşturabilirsin.”
	•	Reddedildi → Reddetme sebebi + “Düzenle” butonu.

2.3. Ödeme Yöntemleri (Ayrı ekran/bottom sheet)
	•	Kullanıcı, “Ödeme Yöntemleri” ekranına gider:
	•	TL Banka Hesabı
	•	IBAN, banka adı, hesap sahibi adı soyadı.
	•	Durum: Onaylandı / Beklemede / Reddedildi.
	•	Kripto Hesabı
	•	Ağ (TRC20, ERC20 vs), cüzdan adresi.
	•	Yine aynı statüler.
	•	Birden fazla yöntem eklenebilir, “varsayılan” işaretlenebilir.
	•	Ops tarafı onaylayana kadar bu yöntemle ödeme talebi açılamaz.

2.4. Ödeme Talebi Oluşturma
	•	Kart: Ödeme Talebi
	•	“Uygun bakiye: X coin (≈ ₺Y)”
	•	Manuel Ödeme Talebi Oluştur butonu:
	•	Sheet:
	•	Miktar seçimi:
	•	Slider veya input (min 500 coin, max çekilebilir bakiye).
	•	Ödeme yöntemi seçimi (onaylılar listelenir).
	•	Bilgi: “Talebin oluşturulduktan sonra ops tarafından incelenecek. Ortalama işlem süresi: X gün.”
	•	Onayla ➜ “Talep oluşturuldu” state.
	•	Otomatik Ödeme Talebi toggle:
	•	Açıklama: “Her hafta pazartesi, bakiyem minimum 500 coin ise otomatik ödeme talebi oluştur.”
	•	Altına:
	•	“Oluşturulacak minimum miktar”
	•	“Tercih edilen ödeme yöntemi”

2.5. Ödeme Talebi Durumları

Her talebin durumu ve detayları görünür:
	•	Statüler:
	•	Beklemede (Pending) → Ops henüz bakmadı.
	•	İnceleniyor (In Review) → Ops manuel kontrol aşamasında.
	•	Onaylandı (Approved) → Ödeme çıkışı yapılacak / yapıldı.
	•	Ödendi (Paid) → Gerçekleşme tarihi ve tutarı.
	•	Reddedildi (Rejected) → Sebep: “Hesap bilgisi tutarsız”, “KYC eksik”, vb.
	•	İptal Edildi (Canceled) → Creator kendisi iptal etti (opsiyonel).

Ekranda:
	•	Ödeme Geçmişi listesi:
	•	Satır:
	•	“₺750 – Banka hesabı – 03.12.2025”
	•	Sağda status badge (Onaylandı / Ödendi / Reddedildi).
	•	Tıklayınca detay:
	•	TL tutarı
	•	Karşılık gelen coin miktarı
	•	Kur bilgisi (1 coin = ₺x, kilitlendiği tarih)
	•	Ödeme yöntemi detayı
	•	Durum geçmişi (timeline gibi: Talep edildi → Onaylandı → Ödendi)

⸻

3. Web Ops Panelinde Yönetim Mantığı (Dokümantasyon Fikri)

Bunları LLM’e “ops panel için admin modüllerini, API’yi ve ekranları tarif et” diye verebilirsin.

3.1. Kur & Coin Yönetimi
	•	Coin–TL oranı ayarları
	•	Global oran: “1 coin = X TL”.
	•	Geçerlilik tarihi (versioning): ileride oran değişirse eski işlemler eski kurla kilitli kalır.
	•	Sadece görüntüleme mi, yoksa ödeme sırasında gerçekten bu kurdan mı hesaplanıyor – dokümanda net belirt.

3.2. Creator Bakiye & İşlem Akışı
	•	Ops panel modülleri:
	1.	Creator Detayı
	•	Toplam kazanç, kullanılabilir bakiye, kilitli bakiye, son ödemeler.
	•	Abonelik gelirleri ve hediye gelirlerini ayrı grafikte gösterme.
	2.	İşlem Listesi
	•	Her coin hareketi: “tip, miktar, tarih, kaynak (abonelik/hediye/payout)”.
	3.	Düzeltme İşlemleri
	•	Hatalı işlem durumunda adminin manuel adjustment ekleyebilmesi (pozitif/negatif).

3.3. Ödeme Yöntemi Onayı
	•	Modül: Ödeme Yöntemleri
	•	Filtre: Beklemede / Onaylı / Reddedilmiş.
	•	Her başvuruda:
	•	Creator bilgileri (isim, e-posta, KYC durumu).
	•	Banka/kripto detayları.
	•	Aksiyonlar:
	•	Onayla
	•	Reddet (+ zorunlu açıklama)
	•	Düzeltme için geri bildirim notu.

3.4. Ödeme Talebi Yönetimi
	•	Modül: Ödeme Talepleri
	•	Liste:
	•	Creator, talep tutarı (coin + TL), tarih, seçilen ödeme yöntemi, durum.
	•	Detay sayfası:
	•	Talep log’u (durum değişiklikleri).
	•	İlgili creator’ın bakiye geçmişi.
	•	Şüpheli durum uyarıları (çok sık talep, anormal büyük tutar vs. – ileride ekleyebilirsin).
	•	Aksiyonlar:
	•	“İncelemeye Al”
	•	“Onayla” (ödeme işlemi tamamlandığında “Ödendi”ye çekmek için ayrı aksiyon olabilir)
	•	“Reddet” (sebep zorunlu)
	•	“Not Ekle” (internal note, creator görmez).

3.5. Otomatik Ödemeler
	•	Modül: Otomatik Ödemeler
	•	Hangi creator’ların auto payout açık olduğunu listele.
	•	Kurallar:
	•	Haftalık cron (örneğin her pazartesi).
	•	Bakiye ≥ minimumsa otomatik talep oluştur.
	•	Ops dokümanında:
	•	Bu süreçte oluşan talebin default durumu: “Beklemede”.
	•	İstersen belli güven seviyesi yüksek creator’lar için “Oluşunca direkt Onayla” gibi ayrı parametre.


    Kimlik bilgileri ve doğrulama KVVK uyumlu (Vision Camera kullanıyoruz mevcut.)

    Kullanıcı ad/soyad ve doğum tarihi formdan girer.

Kimlik fotoğrafı çekilir (ön + arka).

Selfie çekilir.

Backend:

Kimlikten OCR ile ad/soyad + doğum tarihi çıkar.

Formdaki verilerle karşılaştırır.

Kimlik fotoğrafındaki yüz ile selfie’deki yüzü karşılaştırır (face recognition).

Bazı basit liveness kontrolleri yapar (göz kırpma, hareket vs.).

Bunu biraz açalım.

2.1. React Native tarafı (VisionCamera akışı)
a) Kimlik çekimi

Ekran: <IDCaptureScreen />

VisionCamera ile sadece fotoğraf çekmen yeterli (frame processor’a bile mecbur değilsin).

Önce ön yüz, sonra arka yüz; her biri için ayrı state:

const [frontIdPhoto, setFrontIdPhoto] = useState<string | null>(null);
const [backIdPhoto, setBackIdPhoto] = useState<string | null>(null);


Çekilen fotoğrafları:

Lokalde kısa süre göster

Sonra backend’e upload et (HTTPS, mümkünse encrypt + kısa süreli signed URL).

b) Selfie çekimi

Ekran: <SelfieCaptureScreen />

Yine VisionCamera ile fotoğraf.

İstersen kullanıcıya küçük bir liveness testi yaptır:

“Başını sağa çevir”

“Gözünü kırp”

Bunu iki farklı karede çekip backend’e gönderebilirsin:

selfie_straight.jpg

selfie_turn_right.jpg

2.2. Backend tarafı (asıl doğrulama burada)
a) OCR ile kimlikten veri çekme

Kimlik fotoğrafından şu bilgileri çıkarırsın:

Ad

Soyad

Doğum tarihi

Kimlik no (istersen)

Bunun için:

Server tarafında bir OCR kütüphanesi (Tesseract, Google Vision API, AWS Textract vs.) kullanırsın.

Çıkan text’i parse edip:

if normalize(form.full_name) ≈ normalize(ocr.full_name)
  and form.birth_date == ocr.birth_date:
      name_match = true
else
      name_match = false


Bu noktada zaten senin yapabileceğin sadece “kimlik ile formda yazdığı isim birbiriyle uyumlu mu?” kontrolü.

b) Yüz eşleştirme (face match)

Burada ihtiyacın olan şey:

id_face_image (kimlikteki yüz)

selfie_image

Backend’te:

Her iki fotoğraftan da yüzü crop et (face detection).

Her yüz için embedding çıkaran bir model kullan (FaceNet, ArcFace, MobileFaceNet vs.).

İki embedding arasındaki mesafeyi hesapla (cosine similarity).

Eğer similarity threshold’un üstündeyse → “same person” varsay.

Pseudo:

embedding_id = faceModel(id_face_image)
embedding_selfie = faceModel(selfie_image)
sim = cosine_similarity(embedding_id, embedding_selfie)

if sim > 0.7:
   face_match = true
else:
   face_match = false


Buradaki 0.7 tamamen örnek; gerçek threshold’u prod ortamda test etmeyle bulursun.

c) Basit liveness

Kendi imkanlarınla yapabileceğin en basic liveness:

“Başını sağa çevir” selfie'sinin yüz embeddingi ile düz selfie’nin embeddingi birbirine benziyor mu?

Yüz landmark’larından gözlerin kapalı / açık olması gibi basit durumları kontrol eden küçük modeller (ama bu da yine ML tarafına giriyor).

Ama dürüst olayım:

Liveness detection işini iyi yapmak zor.
Deepfake / video replay / ekran kaydı vs. karşısında kendi sistemin çok zayıf kalır.

2.3. Bütün bunları birleştirip “biz doğruladık” demek

Backend’te bir sonuç objen olabilir:

{
  "name_match": true,
  "birthdate_match": true,
  "face_match": true,
  "liveness_basic": true,
  "confidence_score": 0.88
}


Sen de DB’ye:

identity_verified_level = "basic" gibi bir flag atarsın.

UI’da da:

“Ipelya basic doğrulama: ✅” gibi gösterirsin.

Ama kullanım şartlarına yazarsın:

Bu doğrulamanın resmi KYC olmadığını

Ödemelerde dolandırıcılık riskinin kullanıcıya/creatore ait olduğunu vs. (bunu avukatla netleştirmen lazım).

1. Kimlik üzerindeki yazıları okumak (OCR)

Amaç: Kimlikten ad/soyad / doğum tarihi vs. çekmek.

Burada iki güçlü seçenek var:

aarongrider/vision-camera-ocr 
GitHub

MLKit Text Recognition kullanıyor.

Sade, stabil, tek iş: OCR.

Eğer VisionCamera v3/v4 farkı çok dert değilse, “sadece kimlikten text okuyacağım” senaryosu için çok yeterli.

gev2002/react-native-vision-camera-text-recognition (v4 için) 
GitHub
+1

ML Kit Text Recognition + çeviri özellikleri var.

VisionCamera v4 ile çalışacak şekilde güncel tutuluyor.

Gelecekte “kimlikteki text’i başka dile çevir, UI’da göster” dersen ekstra özellikleri var.

Eğer projede VisionCamera v4 kullanıyorsan:
→ Direkt react-native-vision-camera-text-recognition (gev2002) ile başla.
V3’taysan veya daha basit istiyorsan:
→ vision-camera-ocr işini görür.

2. Kimlik fotoğrafını düzgün almak (document scan + crop)

Kimlik kartını çerçeve içine alıp, yamuk çekse bile düzgün kesmek için:

tony-xlh/vision-camera-dynamsoft-document-normalizer 
react-native-vision-camera.com
+1

Kenar tespiti, perspektif düzeltme, “document scanner” tarzı deneyim veriyor.

Kimlik/ehliyet gibi kartları düzgün crop edip normalize etmek için çok iyi.

Yanına ek olarak:

tony-xlh/vision-camera-cropper 
react-native-vision-camera.com

Frame’den sadece kimlik bölgesini crop edip dosya olarak kaydetmek için kullanışlı.

Böylece:

Önce kamera + frame processor ile border detection → kullanıcıya overlay.

“Kart tam çerçeve içinde ve net” ise otomatik foto çek → crop → backend’e yolla.

3. Selfie ve yüz algılama

Selfie çekmeden önce yüz var mı, tek yüz mü, kadraj doğru mu diye bakmak için:

Eğer VisionCamera v4 kullanıyorsan:

luicfrr/react-native-vision-camera-face-detector (V4 için face detector)

Bunlar:

Frame içinde yüz sayısı

Bounding box (kafanın yeri)

Bazı durumlarda headEulerAngle vs. verebiliyor.

Sen de JS tarafında:

“Tek yüz var mı?”

“Yüz yeterince büyük mü (uzak değil mi)?”

“Ortada mı?”

gibi kontrolleri yapıp, şartlar sağlanınca otomatik foto çekebilirsin.

Not: Yüz eşleştirme (ID’deki yüz ile selfie’yi karşılaştırma) işini bence backend’de model ile yap; frame processor’ü sadece “iyi fotoğraf çekmek” ve UX için kullan.

4. İleri seviye / geleceğe yatırım

Bu projeyi büyütürsen işine çok yarayacak iki parça daha:

mrousavy/react-native-fast-tflite 
react-native-vision-camera.com

Her türlü TensorFlow Lite modelini on-device çalıştırma (liveness, face embedding vs.).

İleride kendi face recognition / liveness modelini telefonda çalıştırmak istersen bu temel taş olur.

lukaszkurantdev/react-native-fast-opencv 
react-native-vision-camera.com
+1

OpenCV ile image processing (blur detection, sharpness, edge detection vs.)

Örneğin: kimlik bulanık mı? Selfie net mi? gibi kontrolleri on-device yapabilirsin.

Bunlar MVP’de şart değil ama “Ipelya verification stack”i büyütmek istersen baya’ güçlü duruyor.

5. Senin senaryon için minimum paket seti

Eğer bugün hemen bir şey seçmem gerekse, Ipelya için şöyle derim:

OCR (kimlik text’i):

VisionCamera v4 → react-native-vision-camera-text-recognition (gev2002)

V3 / basit → vision-camera-ocr (aarongrider)

Document capture (kimlik düzgün/dik foto):

vision-camera-dynamsoft-document-normalizer + gerekirse vision-camera-cropper

Selfie UX (yüz algıla, kadraj-check):

V4 → react-native-vision-camera-face-detector (luicfrr)

V3 → react-native-vision-camera-v3-face-detection (gev2002)

Future-proof:

react-native-fast-tflite (kendi ML modellerin için)