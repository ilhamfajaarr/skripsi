# Sistem Rekomendasi Film - MovieRec

Sistem rekomendasi film berbasis Content-Based Filtering menggunakan TF-IDF dan Cosine Similarity. Dibangun dengan Python Flask.

## Fitur Utama
- Pilih film favorit untuk mendapatkan rekomendasi
- Filter berdasarkan sutradara, aktor/aktris, dan genre
- Analisis performa sistem dengan metrik Precision, Recall, dan F1-Score
- Antarmuka pengguna modern dan responsif

## Cara Menjalankan Secara Lokal
1. Pastikan Python 3.8+ sudah terinstal
2. Buat virtual environment (opsional tapi disarankan):
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate
   ```
3. Instal dependensi:
   ```bash
   pip install -r requirements.txt
   ```
4. Jalankan aplikasi:
   ```bash
   python main.py
   ```
5. Buka browser dan akses `http://localhost:5000`

## Deployment ke Cloud

### 1. Deploy ke Render (Paling Mudah & Gratis)
1. Buat akun di [Render](https://render.com)
2. Hubungkan repository GitHub/GitLab Anda
3. Buat **New Web Service**
4. Konfigurasi:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn --bind 0.0.0.0:$PORT main:app`
5. Tambahkan Environment Variable (opsional):
   - `SECRET_KEY`: Kunci rahasia Anda (untuk keamanan session)
   - `DEBUG`: `False`
6. Deploy!

### 2. Deploy ke Heroku
1. Buat akun di [Heroku](https://heroku.com)
2. Install Heroku CLI
3. Login ke Heroku:
   ```bash
   heroku login
   ```
4. Inisialisasi Git dan commit kode:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
5. Buat aplikasi Heroku:
   ```bash
   heroku create nama-aplikasi-anda
   ```
6. Deploy ke Heroku:
   ```bash
   git push heroku master
   ```

## Struktur Proyek
```
script/
├── static/
│   ├── css/
│   └── js/
├── templates/
├── main.py                # Aplikasi Flask utama
├── recommender.py         # Logika sistem rekomendasi
├── requirements.txt       # Dependensi Python
├── Procfile               # Konfigurasi Heroku/Render
└── .gitignore
```
