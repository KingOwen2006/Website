// URL handling for file:// protocol vs server
(function () {
  const isFile = location.protocol === "file:";

  if (!isFile) {
    const base = document.createElement("base");
    base.href = "/";
    document.head.appendChild(base);
    return;
  }

  const map = {
    "/": "index.html",
    "/edu": "edu.html",
    "/projects": "projects.html",
    "/blog": "blog.html",
    "/post": "post.html"
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
})();

// Theme toggle functionality
function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  const isDark = document.documentElement.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateThemeIcons();
}

function updateThemeIcons() {
  const isDark = document.documentElement.classList.contains("dark");
  document.querySelectorAll(".theme-toggle__icon").forEach(icon => {
    const src = isDark ? icon.dataset.darkSrc : icon.dataset.lightSrc;
    if (src) icon.src = src;
  });
}

// Initialize theme from localStorage
(function () {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  }
})();

// Attach theme toggle event listeners once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  updateThemeIcons();
  document.querySelectorAll(".theme-toggle").forEach(btn => {
    btn.addEventListener("click", toggleTheme);
  });
});

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

