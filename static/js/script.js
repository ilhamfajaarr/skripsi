/* JS GLOBAL - Digunakan di SEMUA halaman */
document.addEventListener('DOMContentLoaded', function() {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.backgroundColor = '#000000';
                navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
            } else {
                navbar.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                navbar.style.boxShadow = 'none';
            }
        });
    }
});
