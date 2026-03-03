
const heroData = [
    {
        title: "Head-to-Head Battles",
        text: "Compare two teams position by position.",
        btnText: "Start Comparing",
        link: "matchup.html",
        background: "assets/img/hero/hero1.jpg"
    },
    {
        title: "Browse Teams",
        text: "Explore real NFL rosters and player positions.",
        btnText: "View Teams",
        link: "teams.html",
        background: "assets/img/hero/hero2.jpg"
    },
    {
        title: "View Your Comparisons",
        text: "Check your saved head-to-head battles.",
        btnText: "See History",
        link: "saved.html",
        background: "assets/img/hero/hero3.jpg"
    }
];


const preloadedImages = [];

heroData.forEach(item => {
    const img = new Image();
    img.src = item.background;
    preloadedImages.push(img);
});

let currentIndex = 0;

const heroSection = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroText = document.getElementById("hero-text");
const heroBtn = document.getElementById("hero-btn");

heroSection.style.backgroundImage = `url(${heroData[0].background})`;

function changeHero() {
    // fade out
    heroTitle.classList.add("fade-out");
    heroText.classList.add("fade-out");
    heroBtn.classList.add("fade-out");

    setTimeout(() => {
        currentIndex = (currentIndex + 1) % heroData.length;

        heroTitle.textContent = heroData[currentIndex].title;
        heroText.textContent = heroData[currentIndex].text;
        heroBtn.textContent = heroData[currentIndex].btnText;
        heroBtn.href = heroData[currentIndex].link
        heroSection.style.backgroundImage = `url(${heroData[currentIndex].background})`;

        // fade in
        heroTitle.classList.remove("fade-out");
        heroText.classList.remove("fade-out");
        heroBtn.classList.remove("fade-out");
    }, 500);
}

setInterval(changeHero, 5000);