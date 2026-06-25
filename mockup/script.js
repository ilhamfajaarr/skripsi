/**
 * Mockup Interactivity Script
 * This script provides simple front-end behavior for the UI mockup.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('MovieRec Mockup Loaded');

    // Simple Search Mockup
    const searchInput = document.getElementById('movie-search');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                alert('Mencari film: ' + searchInput.value + '\n(Ini adalah fitur mockup)');
            }
        });
    }

    // Simple delete button mockup
    const deleteButtons = document.querySelectorAll('.movie-card button.btn-secondary');
    deleteButtons.forEach(btn => {
        if (btn.innerText === 'Hapus') {
            btn.addEventListener('click', () => {
                btn.parentElement.remove();
            });
        }
    });
});
