# Paper Yönetim Uygulaması - Geliştirme Planı

## Amaç

Akademik paper'ları sade, hızlı ve pratik bir şekilde yönetebileceğim; projelere ve konulara göre organize edebileceğim, önem sırası verebileceğim kişisel bir paper takip uygulaması geliştirmek.

---

# Temel Özellikler (MVP)

## 1. Paper Ekleme

Her paper için aşağıdaki bilgiler girilecek:

- Başlık
- Yazar(lar) (opsiyonel)
- Yayın yılı
- Yayın ayı
- Proje
- Konu/Kategori
- Okundu mu?
- Notlar

İlk sürümde tüm girişler manuel yapılacak.

---

## 2. Proje Yönetimi

### İlk sürüm

- Paper eklenirken proje adı manuel girilecek.

### Sonraki sürüm

- Daha önce oluşturulan projeler listelenecek.
- Var olan projeler arasından seçim yapılabilecek.
- Gerekirse yeni proje oluşturulabilecek.

---

## 3. Konu (Kategori) Yönetimi

### İlk sürüm

- Konu manuel yazılacak.

### Sonraki sürüm

- Var olan konu kategorileri listelenecek.
- Listeden seçim yapılabilecek.
- Yeni kategori eklenebilecek.

---

## 4. Okunma Durumu

Her paper için:

- Okundu
- Okunmadı

Durumu sonradan değiştirilebilecek.

---

## 5. Paper Notları

Her paper için:

- Serbest metin şeklinde not tutulabilecek.
- İstenildiği zaman düzenlenebilecek.

---

# Görüntüleme

## Gruplandırma

Paper'lar aşağıdaki kriterlere göre gruplanabilecek:

- Projeye göre
- Konuya göre
- Okunma durumuna göre

Gruplar açılıp kapatılabilecek.

---

# Sıralama

## 1. Önem Sıralaması

Her paper için manuel önem sırası belirlenecek.

### Özellik

- Drag & Drop ile sıralama
- En üste taşınan en önemli paper olacak.
- Bu sıra "Önem Sırası" olarak saklanacak.

Görüntüleme seçenekleri:

- Önem sırası (yüksek → düşük)

---

## 2. Tarihe Göre

Paper eklenirken:

- Yayın yılı
- Yayın ayı

girilecek.

Görüntüleme seçenekleri:

- Eskiden → Yeniye
- Yeniden → Eskiye

---

# Filtreleme

Kullanıcı aşağıdaki filtreleri uygulayabilecek:

- Proje
- Konu
- Okundu / Okunmadı

Filtreler birlikte çalışabilecek.

---

# Arayüz Tasarımı

## Genel Yaklaşım

- Minimal
- Sade
- Hızlı
- Gereksiz ekranlardan kaçınılacak.

---

## Ana Sayfa

Paper listesi.

Her satırda:

- Başlık
- Proje
- Konu
- Yayın tarihi (Ay / Yıl)
- Okundu durumu
- Önem sırası

---

## Paper Detay Sayfası

Gösterilecek bilgiler:

- Başlık
- Proje
- Konu
- Yayın tarihi
- Okundu durumu
- Notlar

Düzenleme yapılabilecek.

---

# Veri Modeli

## Paper

- id
- title
- authors (opsiyonel)
- project
- topic
- year
- month
- importanceOrder
- isRead
- notes
- createdAt
- updatedAt

---

## Project

- id
- name

---

## Topic

- id
- name

---

# Kullanıcı Akışı

1. Paper ekle
2. Proje seç veya oluştur
3. Konu seç veya oluştur
4. Yayın yılı ve ayını gir
5. Kaydet
6. Daha sonra:
   - Okundu olarak işaretle
   - Not ekle
   - Önem sırasını sürükleyerek değiştir

---

# Gelecekte Eklenebilecek Özellikler

- PDF dosyası ekleme
- DOI bağlantısı
- Arama özelliği
- Favorilere ekleme
- Etiket (Tag) sistemi
- Çoklu seçim
- Toplu düzenleme
- İçe/Dışa aktarma (JSON/CSV)
- Paper linki saklama
- BibTeX desteği
- Okuma istatistikleri
- Son eklenenler görünümü
- En önemli paper'lar görünümü
- Yakın zamanda okunanlar görünümü

---

# Önceliklendirme

## Faz 1 (MVP)

- Paper ekleme
- Manuel proje girişi
- Manuel konu girişi
- Okundu durumu
- Not ekleme
- Listeleme
- Gruplandırma
- Tarihe göre sıralama

---

## Faz 2

- Proje yönetimi
- Konu yönetimi
- Filtreleme
- Drag & Drop ile önem sıralaması

---

## Faz 3

- PDF desteği
- Arama
- Etiket sistemi
- İçe/Dışa aktarma
- Gelişmiş istatistikler
- Diğer gelişmiş özellikler