import { firebaseConfig, adminEmails } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const body = document.body;
const toggleBtn = document.getElementById("toggleBtn");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const navAnchors = document.querySelectorAll(".nav-links a[href^='#']");

const filterContainer = document.getElementById("videoFilters");
const videoGrid = document.getElementById("videoGrid");
const videoStatus = document.getElementById("videoStatus");

const adminPanel = document.getElementById("adminPanel");
const adminBadge = document.getElementById("adminBadge");
const adminEmailInput = document.getElementById("adminEmail");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const adminStatus = document.getElementById("adminStatus");
const uploadForm = document.getElementById("videoUploadForm");
const uploadStatus = document.getElementById("uploadStatus");

let auth = null;
let db = null;
let currentUser = null;
let unsubscribeVideos = null;
let activeFilter = "All";
let allVideos = [];

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

function isFirebaseConfigured() {
    return Boolean(
        firebaseConfig &&
            firebaseConfig.apiKey &&
            !firebaseConfig.apiKey.includes("YOUR_") &&
            firebaseConfig.projectId &&
            !firebaseConfig.projectId.includes("YOUR_")
    );
}

function isAdmin(user) {
    if (!user || !user.email) {
        return false;
    }

    return adminEmails.map((email) => email.toLowerCase()).includes(user.email.toLowerCase());
}

function setAdminStatus(message, isError = false) {
    adminStatus.textContent = message;
    adminStatus.classList.toggle("error", isError);
}

function setUploadStatus(message, isError = false) {
    uploadStatus.textContent = message;
    uploadStatus.classList.toggle("error", isError);
}

function extractYoutubeId(urlValue) {
    try {
        const parsed = new URL(urlValue);

        if (parsed.hostname.includes("youtu.be")) {
            return parsed.pathname.slice(1).split("/")[0];
        }

        if (parsed.hostname.includes("youtube.com")) {
            const id = parsed.searchParams.get("v");
            if (id) {
                return id;
            }

            const pathParts = parsed.pathname.split("/").filter(Boolean);
            const embedIndex = pathParts.indexOf("embed");
            if (embedIndex >= 0 && pathParts[embedIndex + 1]) {
                return pathParts[embedIndex + 1];
            }

            const shortsIndex = pathParts.indexOf("shorts");
            if (shortsIndex >= 0 && pathParts[shortsIndex + 1]) {
                return pathParts[shortsIndex + 1];
            }
        }
    } catch (_error) {
        return "";
    }

    return "";
}

function renderFilters() {
    if (!allVideos.length) {
        filterContainer.innerHTML = "";
        return;
    }

    const filters = ["All", ...new Set(allVideos.map((video) => video.tech))];

    if (activeFilter !== "All" && !filters.includes(activeFilter)) {
        activeFilter = "All";
    }

    filterContainer.innerHTML = filters
        .map((filter) => {
            const isActive = filter === activeFilter ? "active" : "";
            return `<button class="filter-btn ${isActive}" data-filter="${filter}">${filter}</button>`;
        })
        .join("");

    filterContainer.querySelectorAll(".filter-btn").forEach((button) => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter;
            renderFilters();
            renderVideos();
        });
    });
}

function renderVideos() {
    const filteredVideos = activeFilter === "All"
        ? allVideos
        : allVideos.filter((video) => video.tech === activeFilter);

    if (!filteredVideos.length) {
        videoGrid.innerHTML = `
            <article class="video-card video-empty">
                <h3>No videos published yet</h3>
                <p>Video lessons will appear here once published by the site owner.</p>
            </article>
        `;
        return;
    }

    const canManage = isAdmin(currentUser);

    videoGrid.innerHTML = filteredVideos
        .map((video) => {
            const safeId = video.id || "";
            return `
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
                    ${canManage ? `<button class="video-delete" data-id="${safeId}">Delete</button>` : ""}
                </article>
            `;
        })
        .join("");

    if (canManage) {
        videoGrid.querySelectorAll(".video-delete").forEach((button) => {
            button.addEventListener("click", async () => {
                const id = button.dataset.id;
                if (!id || !db || !isAdmin(currentUser)) {
                    return;
                }

                if (!window.confirm("Delete this video from the site?")) {
                    return;
                }

                try {
                    await deleteDoc(doc(db, "videos", id));
                    setUploadStatus("Video deleted.");
                } catch (_error) {
                    setUploadStatus("Unable to delete video. Check Firestore rules.", true);
                }
            });
        });
    }
}

function setAdminUi() {
    const loggedIn = Boolean(currentUser);
    const canManage = isAdmin(currentUser);

    adminBadge.textContent = loggedIn
        ? `Signed in as ${currentUser.email}`
        : "Signed out";

    adminPanel.classList.toggle("admin-ready", canManage);
    adminLoginBtn.classList.toggle("hidden", loggedIn);
    adminLogoutBtn.classList.toggle("hidden", !loggedIn);

    adminEmailInput.disabled = loggedIn;
    adminPasswordInput.disabled = loggedIn;

    if (loggedIn && !canManage) {
        setAdminStatus("Signed in, but this account is not allowed to manage videos.", true);
    }

    if (loggedIn && canManage) {
        setAdminStatus("Admin access granted. You can publish and delete videos.");
    }

    if (!loggedIn) {
        setAdminStatus("Owner sign-in required to manage videos.");
        setUploadStatus("");
    }

    renderVideos();
}

function subscribeVideos() {
    if (!db) {
        return;
    }

    if (unsubscribeVideos) {
        unsubscribeVideos();
    }

    videoStatus.textContent = "Loading videos...";

    const videosQuery = query(collection(db, "videos"), orderBy("createdAt", "desc"));

    unsubscribeVideos = onSnapshot(
        videosQuery,
        (snapshot) => {
            allVideos = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data()
            }));

            videoStatus.textContent = "";
            renderFilters();
            renderVideos();
        },
        (_error) => {
            videoStatus.textContent = "Unable to load videos. Check your Firebase setup.";
            allVideos = [];
            renderFilters();
            renderVideos();
        }
    );
}

function setupAdminAuth() {
    adminLoginBtn.addEventListener("click", async () => {
        if (!auth) {
            setAdminStatus("Firebase is not configured yet.", true);
            return;
        }

        const email = adminEmailInput.value.trim();
        const password = adminPasswordInput.value;

        if (!email || !password) {
            setAdminStatus("Enter email and password.", true);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            setAdminStatus("Sign-in successful.");
        } catch (_error) {
            setAdminStatus("Sign-in failed. Verify credentials and enabled Email/Password auth.", true);
        }
    });

    adminLogoutBtn.addEventListener("click", async () => {
        if (!auth) {
            return;
        }

        try {
            await signOut(auth);
            setAdminStatus("Signed out.");
        } catch (_error) {
            setAdminStatus("Could not sign out right now.", true);
        }
    });
}

function setupUploadForm() {
    uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!db || !isAdmin(currentUser)) {
            setUploadStatus("Only the owner account can publish videos.", true);
            return;
        }

        const title = uploadForm.videoTitle.value.trim();
        const tech = uploadForm.videoTech.value.trim();
        const level = uploadForm.videoLevel.value.trim();
        const duration = uploadForm.videoDuration.value.trim();
        const description = uploadForm.videoDescription.value.trim();
        const url = uploadForm.videoUrl.value.trim();
        const youtubeId = extractYoutubeId(url);

        if (!youtubeId) {
            setUploadStatus("Please use a valid YouTube URL.", true);
            return;
        }

        try {
            await addDoc(collection(db, "videos"), {
                title,
                tech,
                level,
                duration,
                description,
                youtubeId,
                createdAt: serverTimestamp()
            });

            uploadForm.reset();
            setUploadStatus("Video published.");
        } catch (_error) {
            setUploadStatus("Publish failed. Confirm Firestore rules allow this admin.", true);
        }
    });
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

function bootFirebase() {
    if (!isFirebaseConfigured()) {
        videoStatus.textContent = "Owner setup required: add Firebase config in firebase-config.js.";
        setAdminStatus("Firebase config missing. Update firebase-config.js.", true);
        return;
    }

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        setAdminUi();
    });

    subscribeVideos();
}

setupThemeToggle();
setupMenuToggle();
animateProgressBars();
setupAdminAuth();
setupUploadForm();
setupActiveSectionHighlight();
bootFirebase();
