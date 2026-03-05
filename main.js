const body = document.body;
const toggleBtn = document.getElementById("toggleBtn");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const navAnchors = document.querySelectorAll(".nav-links a[href^='#']");
const videos = [
    // Owner-managed list: add your own video objects here.
    // Example:
    // {
    //     title: "JavaScript Arrays Deep Dive",
    //     tech: "JavaScript",
    //     level: "Intermediate",
    //     duration: "35 min",
    //     youtubeId: "YOUR_VIDEO_ID",
    //     description: "Understand map, filter, reduce, and real use cases."
    // }
];

const filterContainer = document.getElementById("videoFilters");
const videoGrid = document.getElementById("videoGrid");

function applyTheme(theme) {
    const isLight = theme === "light";
    body.classList.toggle("light-mode", isLight);
    toggleBtn.textContent = isLight ? "☀️" : "🌙";
}

function setupThemeToggle() {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
        applyTheme(storedTheme);
    }

    toggleBtn.addEventListener("click", () => {
        const nowLight = !body.classList.contains("light-mode");
        const nextTheme = nowLight ? "light" : "dark";
        applyTheme(nextTheme);
        localStorage.setItem("theme", nextTheme);
    });
}

function setupMenuToggle() {
    if (!menuToggle || !navLinks) {
        return;
    }

    menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("active");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navAnchors.forEach((anchor) => {
        anchor.addEventListener("click", () => {
            navLinks.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
        });
    });

    document.addEventListener("click", (event) => {
        const clickInsideNav = navLinks.contains(event.target);
        const clickOnToggle = menuToggle.contains(event.target);
        if (!clickInsideNav && !clickOnToggle) {
            navLinks.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            navLinks.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
        }
    });
}

function animateProgressBars() {
    document.querySelectorAll(".progress-bar").forEach((bar) => {
        const target = bar.dataset.width || "0%";
        requestAnimationFrame(() => {
            bar.style.width = target;
        });
    });
}

function renderFilters(activeFilter) {
    if (!videos.length) {
        filterContainer.innerHTML = "";
        return;
    }

    const filters = ["All", ...new Set(videos.map((video) => video.tech))];

    filterContainer.innerHTML = filters
        .map((filter) => {
            const isActive = filter === activeFilter ? "active" : "";
            return `<button class="filter-btn ${isActive}" data-filter="${filter}">${filter}</button>`;
        })
        .join("");

    filterContainer.querySelectorAll(".filter-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const selectedFilter = button.dataset.filter;
            renderVideos(selectedFilter);
            renderFilters(selectedFilter);
        });
    });
}

function renderVideos(filter = "All") {
    const filteredVideos = filter === "All"
        ? videos
        : videos.filter((video) => video.tech === filter);

    if (!filteredVideos.length) {
        videoGrid.innerHTML = `
            <article class="video-card video-empty">
                <h3>No videos published yet</h3>
                <p>Only the site owner can publish videos by editing the <code>videos</code> array in <code>main.js</code>.</p>
            </article>
        `;
        return;
    }

    videoGrid.innerHTML = filteredVideos
        .map((video) => `
            <article class="video-card">
                <iframe
                    loading="lazy"
                    src="https://www.youtube.com/embed/${video.youtubeId}"
                    title="${video.title}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen>
                </iframe>
                <h3>${video.title}</h3>
                <p>${video.description}</p>
                <div class="video-meta">
                    <span class="video-tag">${video.tech}</span>
                    <span class="video-tag">${video.level}</span>
                    <span class="video-tag">${video.duration}</span>
                </div>
                <a class="video-link" href="https://www.youtube.com/watch?v=${video.youtubeId}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
            </article>
        `)
        .join("");
}

function setupActiveSectionHighlight() {
    const sections = Array.from(document.querySelectorAll("main section[id], footer[id]"));

    if (!sections.length || !navAnchors.length) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const id = entry.target.getAttribute("id");
                navAnchors.forEach((anchor) => {
                    const isMatch = anchor.getAttribute("href") === `#${id}`;
                    anchor.classList.toggle("active", isMatch);
                });
            });
        },
        {
            rootMargin: "-35% 0px -50% 0px",
            threshold: 0.1
        }
    );

    sections.forEach((section) => observer.observe(section));
}

setupThemeToggle();
setupMenuToggle();
animateProgressBars();
renderVideos("All");
renderFilters("All");
setupActiveSectionHighlight();
