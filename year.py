import time
from pathlib import Path

import pandas as pd
import requests

API_KEY = "00d1b065c61c47d6dd565b527b569da8"


def fetch_release_year(movie_id: int) -> str:
    url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={API_KEY}"
    response = requests.get(url)
    data = response.json()
    release_date = data.get('release_date', "")
    return release_date[:4] if release_date else ""


def add_year_column(input_csv: Path, output_csv: Path | None = None, sleep: float = 0.2, force: bool = False):
    df = pd.read_csv(input_csv)

    if 'year' not in df.columns:
        df['year'] = ""

    # Pastikan year dibersihkan menjadi integer dulu agar tidak muncul .0 di CSV
    df['year'] = pd.to_numeric(df['year'], errors='coerce')
    df['year'] = df['year'].astype('Int64')

    missing_mask = df['year'].isna()
    total_missing = missing_mask.sum()

    if total_missing == 0 and not force:
        print(f"Semua baris sudah memiliki year ({len(df)} baris). Tidak ada perubahan.")
        df['year'] = pd.to_numeric(df['year'], errors='coerce').astype('Int64')
        target = output_csv or input_csv
        df.to_csv(target, index=False)
        return df

    print(f"Menambahkan year untuk {total_missing} dari {len(df)} baris di {input_csv.name}...")

    years = []
    for i, row in df.iterrows():
        if missing_mask.iat[i]:
            movie_id = int(row['id'])
            print(f"[{i+1}/{len(df)}] Mengambil year untuk id={movie_id}...", end=" ")
            try:
                year = fetch_release_year(movie_id)
                print(year or 'kosong')
            except Exception as exc:
                year = ""
                print(f"gagal ({exc})")
            time.sleep(sleep)
        else:
            year = row['year']
        years.append(year)

    df['year'] = pd.Series(years)
    df['year'] = df['year'].replace("", pd.NA).astype('Int64')

    # Susun ulang kolom agar year selalu di akhir seperti tmdb_with_year.csv
    expected_columns = ['id', 'title', 'genres', 'cast', 'director', 'overview', 'year']
    for col in expected_columns:
        if col not in df.columns:
            df[col] = pd.NA
    df = df[expected_columns]

    target = output_csv or input_csv
    df.to_csv(target, index=False)
    print(f"✅ Year berhasil ditambahkan ke {target}")
    return df


if __name__ == '__main__':
    input_path = Path('tmdb_movies_combined.csv')
    add_year_column(input_path, sleep=0.2, force=False)
