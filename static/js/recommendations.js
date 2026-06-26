/* JS Khusus Halaman Rekomendasi (recommendations.html) */
document.addEventListener('DOMContentLoaded', function() {
    // Filter dan sorting untuk halaman rekomendasi
    const genreFilter = document.getElementById('genreFilter');
    const yearSort = document.getElementById('yearSort');
    const movieCards = document.querySelectorAll('.movie-card');

    if (genreFilter) {
        const allGenres = new Set();
        movieCards.forEach(card => {
            const genres = card.dataset.genres || '';
            genres.split(/\s+/).forEach(g => {
                if (g.trim()) allGenres.add(g.trim());
            });
        });

        Array.from(allGenres).sort().forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreFilter.appendChild(option);
        });

        genreFilter.addEventListener('change', filterMovies);
    }

    if (yearSort) {
        yearSort.addEventListener('change', sortMovies);
    }

    function filterMovies() {
        const selectedGenre = genreFilter.value.toLowerCase();

        movieCards.forEach(card => {
            const genres = (card.dataset.genres || '').toLowerCase();
            const matches = !selectedGenre || genres.includes(selectedGenre);
            card.style.display = matches ? '' : 'none';
        });
    }

    function sortMovies() {
        const sortBy = yearSort.value;
        const container = document.getElementById('movieGrid');
        const cards = Array.from(movieCards).filter(c => c.style.display !== 'none');

        cards.sort((a, b) => {
            if (sortBy === 'year_desc') {
                return parseInt(b.dataset.year) - parseInt(a.dataset.year);
            } else if (sortBy === 'year_asc') {
                return parseInt(a.dataset.year) - parseInt(b.dataset.year);
            } else {
                return parseFloat(b.dataset.score) - parseFloat(a.dataset.score);
            }
        });

        cards.forEach(card => container.appendChild(card));
    }
});
