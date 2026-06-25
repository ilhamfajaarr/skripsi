import requests
import pandas as pd
import time

API_KEY = "00d1b065c61c47d6dd565b527b569da8"

def get_movies(page):
    url = f"https://api.themoviedb.org/3/discover/movie?api_key={API_KEY}&sort_by=popularity.desc&page={page}"
    response = requests.get(url)
    return response.json()

def get_movie_details(movie_id):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={API_KEY}"
    data = requests.get(url).json()
    
    genres = " ".join([g['name'] for g in data.get('genres', [])])
    return genres

def get_credits(movie_id):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}/credits?api_key={API_KEY}"
    data = requests.get(url).json()
    
    cast = " ".join([c['name'] for c in data.get('cast', [])[:3]])
    
    director = ""
    for crew in data.get('crew', []):
        if crew['job'] == 'Director':
            director = crew['name']
            break
    
    return cast, director

movies_data = []
movie_ids = set()

START_PAGE = 1
END_PAGE = 250  # ≈ 5000 film

for page in range(START_PAGE, END_PAGE + 1):
    print(f"Ambil halaman {page}...")
    
    data = get_movies(page)
    
    # 🔥 anti error
    if 'results' not in data:
        print(f"❌ Stop di page {page}")
        break
    
    for movie in data['results']:
        movie_id = movie['id']
        
        if movie_id in movie_ids:
            continue
        
        movie_ids.add(movie_id)
        
        title = movie['title']
        overview = movie['overview']
        
        try:
            genres = get_movie_details(movie_id)
            cast, director = get_credits(movie_id)
        except:
            genres, cast, director = "", "", ""
        
        movies_data.append({
            'id': movie_id,
            'title': title,
            'genres': genres,
            'cast': cast,
            'director': director,
            'overview': overview
        })
        
        time.sleep(0.2)
    
    time.sleep(0.5)

df = pd.DataFrame(movies_data)

# 🔥 bersihin duplikat
df = df.drop_duplicates(subset='id')

df.to_csv("tmdb_discover_5000.csv", index=False)

print(f"✅ Total data: {len(df)}")