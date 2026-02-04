// Handle file:// protocol - remove base tag and fix links
(function () {
  const isFile = location.protocol === "file:";

  if (isFile) {
    // Remove the base tag that breaks file:// loading
    const base = document.querySelector('base[href="/"]');
    if (base) base.remove();

    // Rewrite clean URL links to .html files
    const map = {
      "/": "index.html",
      "/edu": "edu.html",
      "/projects": "projects.html",
      "/blog": "blog.html",
      "/post": "post.html",
      "/contact": "contact.html"
    };

    window.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll('a[href^="/"]').forEach(a => {
        const href = a.getAttribute("href") || "";
        const baseHref = href.split("#")[0].split("?")[0];
        const replacement = map[baseHref];
        if (!replacement) return;
        a.setAttribute("href", replacement + href.slice(baseHref.length));
      });
    });
  }
})();

// Theme toggle functionality
function toggleTheme() {
  const root = document.documentElement;
  const currentTheme = root.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  root.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcons();
  updateThemeColor();
}

function updateThemeIcons() {
  const root = document.documentElement;
  const theme = root.getAttribute("data-theme");
  const isDark = theme === "dark" || 
    (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  document.querySelectorAll(".theme-toggle__icon").forEach(icon => {
    const src = isDark ? icon.dataset.darkSrc : icon.dataset.lightSrc;
    if (src) icon.src = src;
  });
}

function updateThemeColor() {
  const root = document.documentElement;
  const theme = root.getAttribute("data-theme");
  const isDark = theme === "dark" || 
    (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", isDark ? "#0f1729" : "#e11d48");
  }
}

// Initialize theme from localStorage or system preference
(function () {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }
})();

// Sidebar toggle functionality
function initSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.querySelector(".sidebar__toggle");
  
  if (!sidebar || !toggleBtn) return;
  
  // Check saved state
  const isCollapsed = localStorage.getItem("sidebar-collapsed") === "true";
  if (isCollapsed) {
    sidebar.classList.add("is-collapsed");
    document.body.classList.add("sidebar-collapsed");
  }
  
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("is-collapsed");
    document.body.classList.toggle("sidebar-collapsed");
    
    const nowCollapsed = sidebar.classList.contains("is-collapsed");
    localStorage.setItem("sidebar-collapsed", nowCollapsed ? "true" : "false");
  });
}

// Hamburger menu functionality
function initHamburgerMenu() {
  const hamburger = document.querySelector(".hamburger");
  const mobileNav = document.querySelector(".mobile-nav");
  
  if (!hamburger || !mobileNav) return;
  
  hamburger.addEventListener("click", () => {
    const isOpen = hamburger.classList.toggle("is-active");
    mobileNav.classList.toggle("is-open", isOpen);
    hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
  
  // Close menu when clicking a link
  mobileNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("is-active");
      mobileNav.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });
  
  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileNav.classList.contains("is-open")) {
      hamburger.classList.remove("is-active");
      mobileNav.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  });
  
  // Close menu when resizing to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      hamburger.classList.remove("is-active");
      mobileNav.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  });
}

// Interactive gradient title effect
function initTitleGradient() {
  const title = document.querySelector(".main-header__title");
  if (!title) return;
  
  function updateGradient(x, y) {
    const rect = title.getBoundingClientRect();
    const mouseX = ((x - rect.left) / rect.width) * 100;
    const mouseY = ((y - rect.top) / rect.height) * 100;
    
    title.style.setProperty("--mouse-x", `${mouseX}%`);
    title.style.setProperty("--mouse-y", `${mouseY}%`);
  }
  
  // Mouse events
  title.addEventListener("mousemove", (e) => {
    updateGradient(e.clientX, e.clientY);
  });
  
  title.addEventListener("mouseleave", () => {
    // Reset to center when mouse leaves
    title.style.setProperty("--mouse-x", "50%");
    title.style.setProperty("--mouse-y", "50%");
  });
  
  // Touch events for mobile
  title.addEventListener("touchstart", () => {
    title.classList.add("is-interacting");
  }, { passive: true });
  
  title.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    updateGradient(touch.clientX, touch.clientY);
  }, { passive: true });
  
  title.addEventListener("touchend", () => {
    title.classList.remove("is-interacting");
    // Reset to center when touch ends
    title.style.setProperty("--mouse-x", "50%");
    title.style.setProperty("--mouse-y", "50%");
  });
}

// Attach event listeners once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  updateThemeIcons();
  updateThemeColor();
  initSidebarToggle();
  initHamburgerMenu();
  initTitleGradient();
  
  document.querySelectorAll(".theme-toggle").forEach(btn => {
    btn.addEventListener("click", toggleTheme);
  });
});

// Discord presence fetcher - updates avatar, status dot, and activity
(function () {
  const DISCORD_USER_ID = "798619259206500365";
  
  const STATUS_LABELS = {
    online: "Online",
    idle: "Idle",
    dnd: "Do Not Disturb",
    offline: "Offline"
  };
  
  const ACTIVITY_TYPES = {
    0: "Playing",
    1: "Streaming",
    2: "Listening to",
    3: "Watching",
    4: "", // Custom status
    5: "Competing in"
  };
  
  function updatePresence(data) {
    const avatarElements = document.querySelectorAll(".discord-avatar");
    const statusDots = document.querySelectorAll(".discord-status-dot");
    const activityTexts = document.querySelectorAll(".discord-activity-text");
    
    // Update avatar
    const user = data.discord_user;
    if (user.avatar) {
      const ext = user.avatar.startsWith("a_") ? "gif" : "png";
      const avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${user.avatar}.${ext}?size=512`;
      avatarElements.forEach(img => { img.src = avatarUrl; });
      
      // Update favicon to Discord avatar
      const faviconUrl = `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${user.avatar}.png?size=64`;
      const favicon = document.getElementById("favicon");
      const appleIcon = document.getElementById("apple-icon");
      if (favicon) favicon.href = faviconUrl;
      if (appleIcon) appleIcon.href = faviconUrl;
    }
    
    // Update status dot
    const status = data.discord_status || "offline";
    statusDots.forEach(dot => {
      dot.setAttribute("data-status", status);
      dot.setAttribute("data-tooltip", STATUS_LABELS[status] || "Offline");
    });
    
    // Update activity text (sidebar and elsewhere)
    const activities = data.activities || [];
    // Filter out custom status (type 4)
    const realActivities = activities.filter(a => a.type !== 4);
    
    // Apps that count as "working on a project"
    const workApps = ["Cursor", "Blender", "Visual Studio Code", "VS Code"];
    
    // Music apps that should show song details
    const musicApps = ["YouTube Music", "Spotify", "Apple Music", "SoundCloud", "Deezer", "Tidal"];
    
    // Helper to check if activity is a work app
    const isWorkApp = (activity) => 
      workApps.some(app => activity.name.toLowerCase().includes(app.toLowerCase()));
    
    // Helper to check if activity is a music app
    const isMusicApp = (activity) => 
      musicApps.some(app => activity.name.toLowerCase().includes(app.toLowerCase())) ||
      activity.type === 2; // Type 2 is "Listening to"
    
    // Helper to get display name for activity
    const getActivityDisplay = (activity) => {
      if (isWorkApp(activity)) {
        return "Working on a project";
      }
      
      // For music apps, show song details
      if (isMusicApp(activity)) {
        const song = activity.details || activity.state || activity.name;
        return `🎵 ${song}`;
      }
      
      const prefix = ACTIVITY_TYPES[activity.type] || "Playing";
      return prefix ? `${prefix} ${activity.name}` : activity.name;
    };
    
    let activityText = "";
    
    if (realActivities.length > 0) {
      activityText = getActivityDisplay(realActivities[0]);
    } else {
      // No activities
      if (status === "offline") {
        activityText = "Sleeping 💤";
      } else {
        // Online, DND, or Idle but no activity
        activityText = "Chilling ✨";
      }
    }
    
    activityTexts.forEach(el => {
      el.textContent = activityText;
    });
  }
  
  function fetchPresence() {
    fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`)
      .then(res => {
        if (!res.ok) throw new Error("Lanyard failed");
        return res.json();
      })
      .then(data => {
        if (!data.success || !data.data) throw new Error("Invalid Lanyard response");
        updatePresence(data.data);
      })
      .catch(err => {
        console.warn("Could not load Discord presence:", err);
        // Set fallback text on error
        document.querySelectorAll(".discord-activity-text").forEach(el => {
          el.textContent = "Unavailable";
        });
      });
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    // Initial fetch
    fetchPresence();
    
    // Refresh every 30 seconds for live updates
    setInterval(fetchPresence, 30000);
  });
})();

// Recent items loader
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("recent-items");
    if (!container) return;

    const SOURCES = {
      projects: {
        api: "https://public-api.wordpress.com/wp/v2/sites/kingowenblog.wordpress.com",
        localHref: (slug) => `blog.html?slug=${slug}`,
        onlineHref: (slug) => `/blog/${slug}`,
        errorText: "Failed to load recent projects."
      },
      posts: {
        api: "https://public-api.wordpress.com/wp/v2/sites/kingowenfyi.wordpress.com",
        localHref: (slug) => `post.html?slug=${slug}`,
        onlineHref: (slug) => `/post/${slug}`,
        errorText: "Failed to load recent posts."
      }
    };

    const tabs = Array.from(document.querySelectorAll(".ko-recent-tab[data-recent]"));

    function getLoaderHTML(id) {
      return `
        <div class="ko-loader-wrapper">
          <div class="ko-loader" data-loader-id="${id}">
            <div class="ko-loader__text">
              Loading<span class="ko-loader__dots"><span class="ko-loader__dot">.</span><span class="ko-loader__dot">.</span><span class="ko-loader__dot">.</span></span>
            </div>
            <div class="ko-loader__bar-wrap">
              <div class="ko-loader__bar-container">
                <div class="ko-loader__bar"></div>
                <div class="ko-loader__percent">0%</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function simulateProgress(loaderId, onComplete) {
      const loader = document.querySelector(`[data-loader-id="${loaderId}"]`);
      if (!loader) return { stop: () => {} };

      const bar = loader.querySelector('.ko-loader__bar');
      const percent = loader.querySelector('.ko-loader__percent');
      let progress = 0;
      let speed = 2;
      let completed = false;

      const interval = setInterval(() => {
        if (completed) return;
        
        if (progress < 30) speed = 3;
        else if (progress < 60) speed = 2;
        else if (progress < 85) speed = 1;
        else speed = 0.3;

        progress = Math.min(progress + speed + Math.random() * speed, 90);
        bar.style.width = Math.round(progress) + '%';
        percent.textContent = Math.round(progress) + '%';
      }, 80);

      return {
        stop: () => {
          completed = true;
          clearInterval(interval);
        },
        complete: () => {
          completed = true;
          clearInterval(interval);
          let current = progress;
          const finishInterval = setInterval(() => {
            current = Math.min(current + 5, 100);
            bar.style.width = Math.round(current) + '%';
            percent.textContent = Math.round(current) + '%';
            if (current >= 100) {
              clearInterval(finishInterval);
              if (onComplete) setTimeout(onComplete, 150);
            }
          }, 30);
        }
      };
    }

    function setActiveTab(key) {
      tabs.forEach(btn => {
        const isActive = btn.getAttribute("data-recent") === key;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
      });
    }

    function renderCards(items, getHref) {
      return items
        .map(p => {
          const img = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
          const excerpt = (p.excerpt?.rendered || "").replace(/<[^>]+>/g, "").trim();
          const href = getHref(p.slug);

          return `
            <a href="${href}" class="post-card">
              ${img ? `<img src="${img}" alt="${p.title.rendered}" draggable="false">` : ""}
              <h3>${p.title.rendered}</h3>
              <p>${excerpt}</p>
              <span>Read more →</span>
            </a>
          `;
        })
        .join("");
    }

    let currentLoaderId = 0;

    function loadRecent(key) {
      const src = SOURCES[key];
      if (!src) return;

      setActiveTab(key);
      const loaderId = 'recent-' + (++currentLoaderId);
      container.innerHTML = getLoaderHTML(loaderId);

      const progress = simulateProgress(loaderId);

      const getHref =
        window.location.protocol === "file:"
          ? src.localHref
          : src.onlineHref;

      fetch(`${src.api}/posts?_embed&per_page=3&orderby=date&order=desc`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to load posts");
          return res.json();
        })
        .then(items => {
          progress.complete();
          setTimeout(() => {
            container.innerHTML = renderCards(items, getHref);
          }, 200);
        })
        .catch(() => {
          progress.stop();
          container.innerHTML = `<p>${src.errorText}</p>`;
        });
    }

    tabs.forEach(btn => {
      btn.addEventListener("click", () => loadRecent(btn.getAttribute("data-recent")));
    });

    loadRecent("projects");
  });
})();
