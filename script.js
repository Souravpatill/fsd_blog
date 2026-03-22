document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initCommentSystem();
    initOrientationLab();
    initResizeObserver();
    initCounters();
});

/**
 * Scroll Reveal Animation logic
 * Uses IntersectionObserver for smooth entrance effects.
 */
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('active')) {
                // Short delay to ensure browser captures the 'before' state for transition
                setTimeout(() => {
                    entry.target.classList.add('active');
                }, 150);
                // Once it's active, we can stop observing this specific element
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: "0px 0px -50px 0px"
    });

    reveals.forEach(el => revealObserver.observe(el));
}

// LocalStorage Key
const STORAGE_KEY = 'mobile_blog_comments';

// Mock Comment Data (Load from localStorage if available)
let comments = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

/**
 * Enhanced Comment System with Sorting & Likes & Persistence
 */
function initCommentSystem() {
    const form = document.getElementById('comment-form');
    const thread = document.getElementById('comment-thread');
    const sortSelect = document.getElementById('sort-select');

    function saveComments() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    }

    function renderComments() {
        const sortBy = sortSelect.value;
        const sorted = [...comments].sort((a, b) => {
            if (sortBy === 'top') return b.likes - a.likes;
            return new Date(b.date) - new Date(a.date);
        });

        thread.innerHTML = '';
        if (sorted.length === 0) {
            thread.innerHTML = '<p class="text-center text-muted py-5">No comments yet. Be the first to share your thoughts!</p>';
            return;
        }

        sorted.forEach(c => {
            const el = document.createElement('div');
            el.className = 'comment-card fade-in-up';
            el.innerHTML = `
                <div class="comment-header">
                    <span class="fw-bold text-white h5 m-0">${c.name}</span>
                    <span class="text-muted small">${getTimeAgo(new Date(c.date))}</span>
                </div>
                <p class="m-0 text-muted" style="font-size: 1.1rem;">${c.content}</p>
                <div class="comment-footer">
                    <button class="like-btn ${c.liked ? 'active' : ''}" onclick="toggleLike(${c.id})">
                        <span>↑</span> ${c.likes} Likes
                    </button>
                    <button class="btn btn-link btn-sm text-danger text-decoration-none opacity-50 hover-opacity-100" onclick="deleteComment(${c.id})">Delete</button>
                </div>
            `;
            thread.appendChild(el);
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('user-name');
        const contentInput = document.getElementById('user-comment');

        const newComment = {
            id: Date.now(),
            name: nameInput.value,
            content: contentInput.value,
            likes: 0,
            date: new Date().toISOString(),
            liked: false
        };

        comments.unshift(newComment);
        saveComments();
        renderComments();
        form.reset();
        triggerHaptic(50);
    });

    sortSelect.addEventListener('change', renderComments);

    // Initial render
    renderComments();

    // Global toggle like
    window.toggleLike = (id) => {
        const comment = comments.find(c => c.id === id);
        if (comment) {
            if (comment.liked) {
                comment.likes--;
                comment.liked = false;
            } else {
                comment.likes++;
                comment.liked = true;
                triggerHaptic(20);
            }
            saveComments();
            renderComments();
        }
    };

    // Delete comment functionality
    window.deleteComment = (id) => {
        if (confirm('Are you sure you want to delete this comment?')) {
            comments = comments.filter(c => c.id !== id);
            saveComments();
            renderComments();
        }
    };
}

/**
 * Device Orientation Logic
 */
function initOrientationLab() {
    const card = document.getElementById('tilting-card');
    const dataDisplay = document.getElementById('orientation-data');
    const btn = document.getElementById('request-permission');

    function handleOrientation(e) {
        const beta = Math.round(e.beta); // -180 to 180
        const gamma = Math.round(e.gamma); // -90 to 90

        dataDisplay.textContent = `B:${beta}° G:${gamma}°`;
        
        const rX = Math.max(-30, Math.min(30, (beta - 45) * 1));
        const rY = Math.max(-30, Math.min(30, gamma * -1));
        
        card.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg)`;
    }

    btn.addEventListener('click', () => {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(res => {
                if (res === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                    btn.classList.replace('btn-premium', 'btn-outline-secondary');
                    btn.textContent = 'Sensors Live';
                }
            });
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
            btn.classList.replace('btn-premium', 'btn-outline-secondary');
            btn.textContent = 'Sensors Live';
        }
    });
}

/**
 * ResizeObserver
 */
function initResizeObserver() {
    const target = document.getElementById('resize-target');
    const pxSpan = document.getElementById('resize-px');
    const badge = document.getElementById('resize-badge');

    const ro = new ResizeObserver(entries => {
        for (let entry of entries) {
            const w = Math.round(entry.contentRect.width);
            pxSpan.textContent = w;
            
            badge.textContent = "RESIZING";
            badge.className = "badge rounded-pill bg-warning px-3 py-2 text-dark";
            
            setTimeout(() => {
                badge.textContent = "STABLE";
                badge.className = "badge rounded-pill bg-success px-3 py-2";
            }, 600);
        }
    });
    ro.observe(target);
}

// Helper Utils
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds/60)}m ago`;
    return `${Math.floor(seconds/3600)}h ago`;
}

function triggerHaptic(ms) {
    if ("vibrate" in navigator) navigator.vibrate(ms);
}

/**
 * Animated Stat Counters
 */
function initCounters() {
    const statsSection = document.querySelector('.stats-container');
    const counters = document.querySelectorAll('.stat-number');
    let hasRun = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasRun) {
                hasRun = true;
                counters.forEach(counter => animateNumber(counter));
            }
        });
    }, { threshold: 0.6 });

    if (statsSection) observer.observe(statsSection);
}

function animateNumber(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2500; // ms
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out expo for a premium feel
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        const current = Math.floor(easeProgress * target);
        el.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = target;
        }
    }

    requestAnimationFrame(update);
}
