/* JS Khusus Halaman Beranda (index.html) */
document.addEventListener('DOMContentLoaded', function() {
    const movieSearch = document.getElementById('movieSearch');
    const movieSelect = document.getElementById('movieSelect');
    const selectedMoviesDiv = document.getElementById('selectedMovies');
    const searchResults = document.getElementById('searchResults');
    const maxMovies = 3;
    const selectedMovies = [];

    // Elemen feedback
    const movieFeedback = document.createElement('small');
    movieFeedback.id = 'movieFeedback';
    movieFeedback.style.display = 'block';
    movieFeedback.style.marginTop = '10px';
    movieFeedback.style.color = '#808080';
    movieFeedback.textContent = 'Cari dan pilih film yang Anda sukai.';
    selectedMoviesDiv.parentNode.appendChild(movieFeedback);

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
                    searchResults.innerHTML = '<div class="search-result-item text-muted">Tidak ditemukan</div>';
                    searchResults.classList.add('show');
                }
            } catch (error) {
                console.error('Error fetching search results:', error);
            }
        });
    }

    // Fungsi tambah film
    window.addMovie = function(title) {
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
    };

    // Fungsi hapus film
    window.removeMovie = function(title) {
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
    };

    // Update tampilan film yang dipilih
    function updateSelectedMovies() {
        selectedMoviesDiv.innerHTML = selectedMovies.map(title =>
            '<span class="selected-movie-tag">' +
            '<i class="bi bi-film"></i> ' + title +
            '<span class="remove-btn" onclick="removeMovie(\'' + title.replace(/'/g, "\\'") + '\')">&times;</span>' +
            '</span>'
        ).join('');

        if (movieFeedback) {
            if (selectedMovies.length >= maxMovies) {
                movieFeedback.textContent = 'Maksimal ' + maxMovies + ' film sudah dipilih.';
                movieFeedback.style.color = '#E50914';
            } else if (selectedMovies.length > 0) {
                movieFeedback.textContent = 'Anda bisa memilih ' + (maxMovies - selectedMovies.length) + ' film lagi.';
                movieFeedback.style.color = '#808080';
            } else {
                movieFeedback.textContent = 'Cari dan pilih film yang Anda sukai.';
                movieFeedback.style.color = '#808080';
            }
        }
    }

    // Generic Autocomplete for Director and Cast
    const autocompleteInputs = document.querySelectorAll('.autocomplete-input');
    autocompleteInputs.forEach(input => {
        const resultsContainer = input.nextElementSibling;

        input.addEventListener('input', async function() {
            const query = this.value.trim();
            const search_type = this.getAttribute('data-type') || 'title';

            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                resultsContainer.classList.remove('show');
                return;
            }

            try {
                const response = await fetch(`/search?q=${encodeURIComponent(query)}&type=${search_type}`);
                const items = await response.json();

                if (items.length > 0) {
                    resultsContainer.innerHTML = items.map(item =>
                        `<div class="search-result-item" onclick="selectItem('${item.replace(/'/g, "\\'")}', '${input.id}')">${item}</div>`
                    ).join('');
                    resultsContainer.classList.add('show');
                } else {
                    resultsContainer.innerHTML = '<div class="search-result-item text-muted">Tidak ditemukan</div>';
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

    // Form validation on submit
    const recommendForm = document.querySelector('form[action="/recommend"]');
    if (recommendForm) {
        recommendForm.addEventListener('submit', function(e) {
            const manualDirector = document.getElementById('director').value.trim();
            const manualCast = document.getElementById('cast').value.trim();
            const selectedGenres = document.querySelectorAll('input[name="genres"]:checked');

            if (selectedMovies.length === 0 && !manualDirector && !manualCast && selectedGenres.length === 0) {
                e.preventDefault();
                showFeedback('Mohon masukkan setidaknya satu preferensi.', 'danger');
            }
        });
    }
});

// Fungsi feedback toast (dipindahkan ke global agar bisa diakses dari mana saja)
function showFeedback(message, type = 'danger') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        console.warn('Toast container not found');
        return;
    }

    const toast = document.createElement('div');
    toast.className = 'custom-toast';
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
