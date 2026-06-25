from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from recommender import MovieRecommender
import os

app = Flask(__name__)
# Gunakan environment variable untuk secret key, atau buat default
app.secret_key = os.getenv('SECRET_KEY', 'movie_rec_secret_key_2024')

recommender = MovieRecommender()

@app.route('/')
def home():
    genres_list = sorted(list(set([g.strip() for sublist in recommender.df['genres'].str.split().tolist() for g in sublist if g.strip()])))
    return render_template('index.html', 
                         genres=genres_list)

@app.route('/search')
def search():
    query = request.args.get('q', '').lower()
    search_type = request.args.get('type', 'title')
    
    if len(query) < 2:
        return jsonify([])
    
    if search_type == 'director':
        all_items = recommender.get_all_directors()
    else:
        all_items = recommender.get_all_titles()
        
    matches = [t for t in all_items if query in str(t).lower()][:10]
    return jsonify(matches)

@app.route('/recommend', methods=['POST'])
def recommend():
    selected_movies = request.form.getlist('favorite_movies')
    manual_director = request.form.get('director', '').strip()
    manual_cast = request.form.get('cast', '').strip()
    manual_genres = request.form.getlist('genres')
    
    # Clean manual inputs
    final_director = recommender.clean_string(manual_director)
    final_cast = manual_cast.lower()
    final_genres_str = " ".join([g.lower() for g in manual_genres])
    
    if selected_movies:
        for title in selected_movies:
            res = recommender.get_features_from_movie(title)
            if res:
                d, c, g = res
                final_director += " " + recommender.clean_string(d)
                final_cast += " " + c.lower()
                final_genres_str += " " + g.lower()
    
    user_query = (
        (final_director + " ") * 3 +
        (final_cast + " ") * 3 +
        (final_genres_str + " ") * 2
    )
    
    if user_query.strip() == "":
        flash("Mohon masukkan setidaknya satu preferensi.", "error")
        return redirect(url_for('home'))
    
    recommendations = recommender.recommend_movies(
        user_query, 
        input_titles=selected_movies,
        top_n=12
    )
    
    # Calculate evaluation metrics
    recommended_titles = recommendations['title'].tolist()
    metrics = recommender.calculate_metrics(user_query, recommended_titles)
    
    session['recommendations'] = recommendations.to_dict('records')
    session['metrics'] = metrics
    session['user_query'] = user_query # Store for analysis page reference
    session['user_prefs'] = {
        'favorite_movies': selected_movies,
        'director': manual_director,
        'cast': manual_cast,
        'genres': manual_genres
    }
    
    return redirect(url_for('recommendations'))

@app.route('/recommendations')
def recommendations():
    if 'recommendations' not in session or not session['recommendations']:
        flash("Silakan masukkan preferensi terlebih dahulu.", "warning")
        return redirect(url_for('home'))
    
    recs = session['recommendations']
    prefs = session.get('user_prefs', {})
    
    return render_template('recommendations.html', 
                         recommendations=recs,
                         preferences=prefs)

@app.route('/detail/<int:movie_id>')
def detail(movie_id):
    movie = recommender.get_movie_by_id(movie_id)
    if movie is None:
        flash("Film tidak ditemukan.", "error")
        return redirect(url_for('recommendations'))
    
    return render_template('detail.html', movie=movie)

@app.route('/analysis')
def analysis():
    has_recs = 'recommendations' in session and session['recommendations']
    recs = session.get('recommendations', []) if has_recs else []
    metrics = session.get('metrics', None)
    return render_template('analysis.html', recommendations=recs, metrics=metrics)

@app.route('/browse')
def browse():
    query = request.args.get('q', '').strip().lower()
    
    if query:
        # Search by title, director, cast, or genres
        mask = (
            recommender.df['title'].str.lower().str.contains(query, na=False) |
            recommender.df['director'].str.lower().str.contains(query, na=False) |
            recommender.df['cast'].str.lower().str.contains(query, na=False) |
            recommender.df['genres'].str.lower().str.contains(query, na=False)
        )
        results = recommender.df[mask].head(50).to_dict('records')
        title = f"Hasil pencarian: '{query}'"
    else:
        # Show some random or top movies if no search
        results = recommender.df.sample(24).to_dict('records')
        title = "Jelajahi Film"
        
    return render_template('browse.html', movies=results, title=title, query=query)

@app.route('/reset')
def reset():
    session.pop('recommendations', None)
    session.pop('user_prefs', None)
    flash("Pencarian direset.", "info")
    return redirect(url_for('home'))

if __name__ == '__main__':
    # Gunakan PORT dari environment variable untuk deployment
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', debug=debug, port=port)
