document.addEventListener('DOMContentLoaded', function() {
    const movieSearch = document.getElementById('movieSearch');
    const movieSelect = document.getElementById('movieSelect');
    const selectedMoviesDiv = document.getElementById('selectedMovies');
    const searchResults = document.getElementById('searchResults');
    const maxMovies = 3;
    const selectedMovies = [];

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = '#000000';
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
        } else {
            navbar.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    if (movieSearch) {
        movieSearch.addEventListener('input', async function() {
            const query = this.value.trim();
            if (query.length < 2) {
                searchResults.innerHTML = '';
                searchResults.classList.remove('show');
                return;
            }

            try {
                const response = await fetch(`/search?q=${encodeURIComponent(query)}&type=title`);
                const titles = await response.json();
                
                if (titles.length > 0) {
                    searchResults.innerHTML = titles.map(title => 
                        `<div class="search-result-item" onclick="addMovie('${title.replace(/'/g, "\\'")}')">${title}</div>`
                    ).join('');
                    searchResults.classList.add('show');
                } else {
                    searchResults.innerHTML = '<div class="search-result-item text-muted">No movies found</div>';
                    searchResults.classList.add('show');
                }
            } catch (error) {
                console.error('Error fetching search results:', error);
            }
        });
    }

    // Generic Autocomplete for Director and Cast
    const autocompleteInputs = document.querySelectorAll('.autocomplete-input');
    autocompleteInputs.forEach(input => {
        const resultsContainer = input.nextElementSibling;

        input.addEventListener('input', async function() {
            const query = this.value.trim();
            const type = this.getAttribute('data-type') || 'title';

            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                resultsContainer.classList.remove('show');
                return;
            }

            try {
                const response = await fetch(`/search?q=${encodeURIComponent(query)}&type=${type}`);
                const items = await response.json();

                if (items.length > 0) {
                    resultsContainer.innerHTML = items.map(item => 
                        `<div class="search-result-item" onclick="selectItem('${item.replace(/'/g, "\\'")}', '${input.id}')">${item}</div>`
                    ).join('');
                    resultsContainer.classList.add('show');
                } else {
                    resultsContainer.innerHTML = '<div class="search-result-item text-muted">No matches found</div>';
                    resultsContainer.classList.add('show');
                }
            } catch (error) {
                console.error('Error fetching autocomplete results:', error);
            }
        });
    });

    window.selectItem = function(value, inputId) {
        const input = document.getElementById(inputId);
        input.value = value;
        const resultsContainer = input.nextElementSibling;
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('show');
    };

    // Global click listener to hide all search results
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            document.querySelectorAll('.search-results').forEach(res => {
                res.classList.remove('show');
            });
        }
    });

    function addMovie(title) {
        if (selectedMovies.includes(title)) {
            showFeedback('Film sudah dipilih!', 'info');
            return;
        }
        if (selectedMovies.length >= maxMovies) {
            showFeedback('Maksimal ' + maxMovies + ' film saja ya!', 'danger');
            return;
        }

        selectedMovies.push(title);
        updateSelectedMovies();

        const option = document.createElement('option');
        option.value = title;
        option.selected = true;
        movieSelect.appendChild(option);

        // Clear search
        movieSearch.value = '';
        searchResults.innerHTML = '';
        searchResults.classList.remove('show');
    }

    function removeMovie(title) {
        const index = selectedMovies.indexOf(title);
        if (index > -1) {
            selectedMovies.splice(index, 1);
            updateSelectedMovies();

            const options = movieSelect.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === title) {
                    movieSelect.remove(i);
                    break;
                }
            }
        }
    }

    function updateSelectedMovies() {
        selectedMoviesDiv.innerHTML = selectedMovies.map(title => 
            '<span class="selected-movie-tag">' +
            '<i class="bi bi-film"></i> ' + title +
            '<span class="remove-btn" onclick="removeMovie(\'' + title.replace(/'/g, "\\'") + '\')">&times;</span>' +
            '</span>'
        ).join('');

        const feedback = document.getElementById('movieFeedback');
        if (feedback) {
            if (selectedMovies.length >= maxMovies) {
                feedback.textContent = 'Maksimal ' + maxMovies + ' film sudah dipilih.';
                feedback.style.color = '#E50914';
            } else if (selectedMovies.length > 0) {
                feedback.textContent = 'Anda bisa memilih ' + (maxMovies - selectedMovies.length) + ' film lagi.';
                feedback.style.color = '#808080';
            } else {
                feedback.textContent = 'Cari dan pilih film yang Anda sukai.';
                feedback.style.color = '#808080';
            }
        }
    }

    window.addMovie = addMovie;
    window.removeMovie = removeMovie;

    const likeButtons = document.querySelectorAll('.like-btn');
    const dislikeButtons = document.querySelectorAll('.dislike-btn');

    likeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const movieId = this.dataset.movie;
            showFeedback('Added to your likes!', 'success');
        });
    });

    dislikeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const movieId = this.dataset.movie;
            showFeedback('Marked as not for you.', 'info');
        });
    });

    function showFeedback(message, type = 'danger') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `custom-toast`;
        if (type === 'danger') toast.style.borderLeftColor = '#E50914';
        if (type === 'success') toast.style.borderLeftColor = '#2ecc71';
        if (type === 'info') toast.style.borderLeftColor = '#3498db';

        toast.innerHTML = `
            <div class="toast-body">
                <i class="bi ${type === 'danger' ? 'bi-exclamation-circle' : 'bi-info-circle'} fs-5"></i>
                <span>${message}</span>
            </div>
        `;
        
        toastContainer.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.5s ease';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    // Form validation on submit
    const recommendForm = document.querySelector('form[action="/recommend"]');
    if (recommendForm) {
        recommendForm.addEventListener('submit', function(e) {
            const manualDirector = document.getElementById('director').value.trim();
            const manualCast = document.getElementById('cast').value.trim();
            const selectedGenres = document.querySelectorAll('input[name="genres"]:checked');
            
            if (selectedMovies.length === 0 && !manualDirector && !manualCast && selectedGenres.length === 0) {
                e.preventDefault();
                showFeedback('Mohon masukkan setidaknya satu preferensi (film, sutradara, aktor, atau genre).', 'danger');
            }
        });
    }

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
