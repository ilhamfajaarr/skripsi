import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re

class MovieRecommender:
    def __init__(self, csv_path="tmdb_with_year.csv"):
        self.df = pd.read_csv(csv_path)
        self.df = self.df.fillna("")
        self.df = self.df.drop_duplicates(subset='id')
        self.df = self.df.reset_index(drop=True)
        self.df['id'] = self.df['id'].astype(int)
        
        # Clean year: remove .0 and handle as string or int
        self.df['year'] = self.df['year'].apply(lambda x: str(int(float(x))) if x != "" else "")
        
        # Apply cleaning to specific columns for better matching
        self.df['director_cleaned'] = self.df['director'].apply(self.clean_string)
        self.df['cast_cleaned'] = self.df['cast'].str.lower()
        self.df['genres_cleaned'] = self.df['genres'].str.lower()

        # Update weights: Director (3x), Cast (2x), Genres (2x)
        # Bobot Cast dikurangi dari 3x menjadi 2x untuk mengurangi noise dari tokenisasi nama
        self.df['features'] = (
            (self.df['director_cleaned'] + " ") * 3 +
            (self.df['cast_cleaned'] + " ") * 2 +
            (self.df['genres_cleaned'] + " ") * 2 +
            self.df['overview']
        )
        
        self.tfidf = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = self.tfidf.fit_transform(self.df['features'])
        
        # Pre-calculate unique lists for autocomplete
        self.all_titles = self.df['title'].unique().tolist()
        self.all_directors = self._generate_directors_list()

    def clean_string(self, x):
        """Helper to clean names: remove spaces and lowercase"""
        if isinstance(x, list):
            return [str.lower(i.replace(" ", "")) for i in x]
        else:
            if isinstance(x, str):
                return str.lower(x.replace(" ", ""))
            else:
                return ""

    def _generate_directors_list(self):
        all_directors = set()
        for d in self.df['director'].tolist():
            if d:
                all_directors.add(d.strip())
        return sorted(list(all_directors))

    def get_all_titles(self):
        return self.all_titles

    def get_all_directors(self):
        return self.all_directors

    def get_movie_by_title(self, title):
        movie = self.df[self.df['title'].str.lower() == title.lower()]
        if not movie.empty:
            return movie.iloc[0]
        return None

    def get_movie_by_id(self, movie_id):
        movie = self.df[self.df['id'] == int(movie_id)]
        if not movie.empty:
            return movie.iloc[0]
        return None

    def get_features_from_movie(self, title):
        movie = self.get_movie_by_title(title)
        if movie is not None:
            return (
                movie['director'],
                movie['cast'],
                movie['genres']
            )
        return None

    def recommend_movies(self, user_query_string, input_titles=[], top_n=10):
        user_vec = self.tfidf.transform([user_query_string])
        sim_scores = cosine_similarity(user_vec, self.tfidf_matrix).flatten()
        
        indices = sim_scores.argsort()[::-1]
        
        results_indices = []
        input_titles_lower = [t.lower() for t in input_titles]
        
        # Get feature names for reasoning
        feature_names = self.tfidf.get_feature_names_out()
        user_terms = set(user_query_string.lower().split())
        
        for idx in indices:
            title = self.df.iloc[idx]['title']
            if title.lower() in input_titles_lower:
                continue
            
            results_indices.append(idx)
            
            if len(results_indices) == top_n:
                break
        
        recommended_df = self.df.iloc[results_indices].copy()
        recommended_df['similarity_score'] = sim_scores[results_indices]
        
        # Add reasoning: find matching important terms
        reasons = []
        for idx in results_indices:
            movie_features = self.df.iloc[idx]['features'].lower()
            # Find which user terms appear in movie features
            matches = [term for term in user_terms if len(term) > 2 and term in movie_features]
            # Limit to top 5 matches
            reasons.append(", ".join(list(set(matches))[:5]))
        
        recommended_df['reasoning'] = reasons
        
        return recommended_df[['id', 'title', 'director', 'cast', 'genres', 'overview', 'year', 'similarity_score', 'reasoning']]

    def calculate_metrics(self, user_query_string, recommended_titles, threshold=0.15):
        """
        Calculate Precision, Recall, and F1-score based on a similarity threshold.
        """
        user_vec = self.tfidf.transform([user_query_string])
        all_sim_scores = cosine_similarity(user_vec, self.tfidf_matrix).flatten()
        
        # 1. Get all relevant items in the dataset (Ground Truth)
        # We consider a movie relevant if its similarity score is above the threshold
        relevant_indices = np.where(all_sim_scores >= threshold)[0]
        total_relevant = len(relevant_indices)
        
        # 2. Get relevant recommended items
        recommended_indices = self.df[self.df['title'].isin(recommended_titles)].index
        recommended_sim_scores = all_sim_scores[recommended_indices]
        relevant_recommended = np.sum(recommended_sim_scores >= threshold)
        
        # 3. Calculate Metrics
        precision = relevant_recommended / len(recommended_titles) if len(recommended_titles) > 0 else 0
        recall = relevant_recommended / total_relevant if total_relevant > 0 else 0
        
        f1_score = 0
        if precision + recall > 0:
            f1_score = 2 * (precision * recall) / (precision + recall)
            
        return {
            'precision': round(precision, 4),
            'recall': round(recall, 4),
            'f1_score': round(f1_score, 4),
            'total_relevant': int(total_relevant),
            'relevant_recommended': int(relevant_recommended),
            'threshold': threshold
        }

if __name__ == "__main__":
    recommender = MovieRecommender()
    print(f"Loaded {len(recommender.df)} movies")
