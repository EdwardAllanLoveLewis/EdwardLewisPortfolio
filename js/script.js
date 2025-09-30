document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute("href")).scrollIntoView({
                behavior: "smooth"
            });
        });
    });
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const status = document.getElementById('formStatus');
            status.textContent = 'Message sent — I will get back to you shortly.';
            form.reset();
            setTimeout(() => { status.textContent = ''; }, 5000);
        });
    }
});