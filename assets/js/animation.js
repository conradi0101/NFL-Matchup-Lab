const items = document.querySelectorAll(".reveal-item");

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {

            items.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add("visible");
                }, index * 300);
            });

            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.2,
    rootMargin: "0px 0px -100px 0px"
});

const section = document.querySelector(".how-section");
observer.observe(section);