/* ═══════════════════════════════════════════════════════════════
   MindWallet — Shared Scripts
   Features: Search Overlay · Show More · Nav Search Icon
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── 1. INJECT SEARCH BUTTON INTO EVERY NAV ──────────────── */
  function injectSearchButton() {
    const nav = document.querySelector('.mw-nav');
    if (!nav) return;

    // Don't double-inject
    if (nav.querySelector('.nav-search-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'nav-search-btn';
    btn.setAttribute('aria-label', 'Search articles');
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    btn.addEventListener('click', openSearch);

    // Insert before nav-cta
    const cta = nav.querySelector('.nav-cta');
    if (cta) nav.insertBefore(btn, cta);
    else nav.appendChild(btn);
  }

  /* ─── 2. SEARCH OVERLAY ────────────────────────────────────── */
  let articlesData = null;

  function buildSearchOverlay() {
    if (document.getElementById('mw-search-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'mw-search-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="mw-search-backdrop" id="mwSearchBackdrop"></div>
      <div class="mw-search-panel" role="dialog" aria-label="Search articles">
        <div class="mw-search-header">
          <div class="mw-search-input-wrap">
            <svg class="mw-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="mwSearchInput" class="mw-search-input" placeholder="Search articles, topics, keywords…" autocomplete="off" spellcheck="false"/>
            <button class="mw-search-clear" id="mwSearchClear" aria-label="Clear search">✕</button>
          </div>
          <button class="mw-search-close" id="mwSearchClose" aria-label="Close search">Close</button>
        </div>
        <div class="mw-search-filters">
          <button class="mw-filter-btn active" data-filter="all">All</button>
          <button class="mw-filter-btn" data-filter="tips">💡 Tips</button>
          <button class="mw-filter-btn" data-filter="stories">📖 Stories</button>
          <button class="mw-filter-btn" data-filter="concept">🎓 Concept</button>
          <button class="mw-filter-btn" data-filter="words">📘 Words</button>
          <button class="mw-filter-btn" data-filter="accounting">📊 Accounting</button>
          <button class="mw-filter-btn" data-filter="tricks">🧠 Tricks</button>
        </div>
        <div class="mw-search-results" id="mwSearchResults">
          <div class="mw-search-empty">
            <div class="mse-icon">🔍</div>
            <p>Start typing to search across all MindWallet articles</p>
          </div>
        </div>
        <div class="mw-search-footer">
          <span id="mwSearchCount"></span>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // Wire up events
    document.getElementById('mwSearchClose').addEventListener('click', closeSearch);
    document.getElementById('mwSearchBackdrop').addEventListener('click', closeSearch);
    document.getElementById('mwSearchClear').addEventListener('click', function () {
      document.getElementById('mwSearchInput').value = '';
      document.getElementById('mwSearchInput').focus();
      renderResults('', activeFilter);
    });
    document.getElementById('mwSearchInput').addEventListener('input', function () {
      renderResults(this.value.trim(), activeFilter);
    });

    // Filter buttons
    document.querySelectorAll('.mw-filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.mw-filter-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        activeFilter = this.dataset.filter;
        renderResults(document.getElementById('mwSearchInput').value.trim(), activeFilter);
      });
    });

    // Keyboard close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSearch();
      // Cmd/Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    });
  }

  let activeFilter = 'all';

  function openSearch() {
    buildSearchOverlay();
    const overlay = document.getElementById('mw-search-overlay');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      document.getElementById('mwSearchInput').focus();
    }, 80);

    // Load articles data if not yet loaded
    if (!articlesData) {
      // Determine base path — works from any subdirectory depth
      const base = getBasePath();
      fetch(base + 'articles.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          articlesData = data.articles;
        })
        .catch(function () {
          // Fallback: no data
          articlesData = [];
        });
    }
  }

  function closeSearch() {
    const overlay = document.getElementById('mw-search-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function getBasePath() {
    // If on index/content/learn/about — same dir. Article pages also same dir.
    return '';
  }

  function renderResults(query, filter) {
    const container = document.getElementById('mwSearchResults');
    const countEl = document.getElementById('mwSearchCount');
    if (!articlesData) {
      container.innerHTML = '<div class="mw-search-empty"><div class="mse-icon">⏳</div><p>Loading articles…</p></div>';
      return;
    }

    if (!query && filter === 'all') {
      container.innerHTML = '<div class="mw-search-empty"><div class="mse-icon">🔍</div><p>Start typing to search across all MindWallet articles</p></div>';
      countEl.textContent = '';
      return;
    }

    const q = query.toLowerCase();
    const results = articlesData.filter(function (a) {
      const matchSection = filter === 'all' || a.section === filter;
      if (!q) return matchSection;
      const inTitle = a.title.toLowerCase().includes(q);
      const inDesc = a.description.toLowerCase().includes(q);
      const inTags = a.tags.some(function (t) { return t.toLowerCase().includes(q); });
      return matchSection && (inTitle || inDesc || inTags);
    });

    countEl.textContent = results.length + ' result' + (results.length !== 1 ? 's' : '');

    if (results.length === 0) {
      container.innerHTML = '<div class="mw-search-empty"><div class="mse-icon">😕</div><p>No articles found for <strong>"' + escHtml(query) + '"</strong></p><p style="font-size:.8rem;margin-top:.5rem;">Try a different keyword or browse by category above</p></div>';
      return;
    }

    const SECTION_LABELS = {
      tips: '💡 Finance Tips',
      stories: '📖 Real Story',
      concept: '🎓 Concept',
      words: '📘 Words',
      accounting: '📊 Accounting',
      tricks: '🧠 Strategy'
    };

    const html = results.map(function (a) {
      const highlighted_title = q ? highlight(a.title, q) : escHtml(a.title);
      const highlighted_desc = q ? highlight(a.description, q) : escHtml(a.description);
      return `<a href="${escHtml(a.url)}" class="mw-result-item">
        <div class="mri-badge mri-${escHtml(a.section)}">${escHtml(SECTION_LABELS[a.section] || a.section)}</div>
        <h4 class="mri-title">${highlighted_title}</h4>
        <p class="mri-desc">${highlighted_desc}</p>
        <div class="mri-meta">${escHtml(a.readTime + ' min read')} · ${escHtml(a.level)}</div>
      </a>`;
    }).join('');

    container.innerHTML = html;
  }

  function highlight(text, query) {
    const escaped = escHtml(text);
    const regex = new RegExp('(' + escRegex(query) + ')', 'gi');
    return escaped.replace(regex, '<mark class="mw-hl">$1</mark>');
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ─── 3. SHOW MORE ─────────────────────────────────────────── */
  function initShowMore() {
    document.querySelectorAll('[data-show-more]').forEach(function (group) {
      const initialCount = parseInt(group.dataset.showMore, 10) || 3;
      const items = Array.from(group.querySelectorAll('[data-item]'));
      if (items.length <= initialCount) return;

      // Hide items beyond initial count
      items.forEach(function (item, i) {
        if (i >= initialCount) item.classList.add('mw-hidden-item');
      });

      // Create "See More" button
      const btn = document.createElement('button');
      btn.className = 'mw-show-more-btn';
      const hiddenCount = items.length - initialCount;
      btn.innerHTML = `See ${hiddenCount} more <span class="smb-arrow">↓</span>`;

      let expanded = false;
      btn.addEventListener('click', function () {
        expanded = !expanded;
        items.forEach(function (item, i) {
          if (i >= initialCount) {
            item.classList.toggle('mw-hidden-item', !expanded);
          }
        });
        btn.innerHTML = expanded
          ? 'Show less <span class="smb-arrow">↑</span>'
          : `See ${hiddenCount} more <span class="smb-arrow">↓</span>`;
      });

      // Insert button after the group
      group.parentNode.insertBefore(btn, group.nextSibling);
    });
  }

  /* ─── 4. INJECT SHARED CSS ─────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('mw-shared-styles')) return;
    const style = document.createElement('style');
    style.id = 'mw-shared-styles';
    style.textContent = `
      /* Nav search button */
      .nav-search-btn {
        background: none;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 8px;
        width: 38px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        color: rgba(255,255,255,0.55);
        transition: all 0.2s;
        flex-shrink: 0;
        margin-right: 0.5rem;
      }
      .nav-search-btn:hover { border-color: #00d4ff; color: #00d4ff; background: rgba(0,212,255,0.08); }

      /* Search overlay backdrop */
      #mw-search-overlay {
        position: fixed; inset: 0; z-index: 9000;
        display: flex; align-items: flex-start; justify-content: center;
        padding-top: 5vh;
        opacity: 0; pointer-events: none;
        transition: opacity 0.2s;
      }
      #mw-search-overlay.open { opacity: 1; pointer-events: all; }

      .mw-search-backdrop {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.75);
        backdrop-filter: blur(6px);
      }

      /* Search panel */
      .mw-search-panel {
        position: relative; z-index: 1;
        background: #111111;
        border: 1px solid #282828;
        border-radius: 16px;
        width: 100%; max-width: 660px;
        margin: 0 1rem;
        max-height: 85vh;
        display: flex; flex-direction: column;
        overflow: hidden;
        box-shadow: 0 24px 60px rgba(0,0,0,0.6);
        transform: translateY(-12px);
        transition: transform 0.2s;
      }
      #mw-search-overlay.open .mw-search-panel { transform: translateY(0); }

      .mw-search-header {
        display: flex; align-items: center; gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #282828;
        flex-shrink: 0;
      }
      .mw-search-input-wrap {
        flex: 1; display: flex; align-items: center; gap: 0.6rem;
        background: #181818; border: 1px solid #383838;
        border-radius: 10px; padding: 0 0.9rem;
      }
      .mw-search-icon { color: #888; flex-shrink: 0; }
      .mw-search-input {
        flex: 1; background: none; border: none; outline: none;
        color: #f0f0f0; font-family: 'DM Sans', sans-serif;
        font-size: 0.97rem; padding: 0.75rem 0;
      }
      .mw-search-input::placeholder { color: #555; }
      .mw-search-clear {
        background: none; border: none; cursor: pointer;
        color: #555; font-size: 0.8rem; padding: 0.25rem;
        border-radius: 4px; transition: color 0.2s;
        flex-shrink: 0;
      }
      .mw-search-clear:hover { color: #ff6b6b; }
      .mw-search-close {
        background: none; border: 1px solid #282828; border-radius: 8px;
        color: #888; font-size: 0.8rem; padding: 0.4rem 0.75rem;
        cursor: pointer; white-space: nowrap; transition: all 0.2s;
        font-family: 'DM Sans', sans-serif;
        flex-shrink: 0;
      }
      .mw-search-close:hover { border-color: #00d4ff; color: #00d4ff; }

      /* Filter buttons */
      .mw-search-filters {
        display: flex; gap: 0.4rem; padding: 0.75rem 1.25rem;
        border-bottom: 1px solid #282828;
        overflow-x: auto; flex-shrink: 0;
        scrollbar-width: none;
      }
      .mw-search-filters::-webkit-scrollbar { display: none; }
      .mw-filter-btn {
        background: #181818; border: 1px solid #282828;
        border-radius: 999px; padding: 0.3rem 0.85rem;
        font-size: 0.73rem; font-weight: 600;
        color: #888; cursor: pointer; white-space: nowrap;
        transition: all 0.2s; font-family: 'DM Sans', sans-serif;
      }
      .mw-filter-btn:hover { border-color: #00d4ff; color: #00d4ff; }
      .mw-filter-btn.active { background: rgba(0,212,255,0.12); border-color: #00d4ff; color: #00d4ff; }

      /* Results */
      .mw-search-results {
        flex: 1; overflow-y: auto; padding: 0.5rem 0;
        scrollbar-width: thin; scrollbar-color: #282828 transparent;
      }
      .mw-search-empty {
        text-align: center; padding: 3rem 2rem;
        color: #555;
      }
      .mse-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
      .mw-search-empty p { font-size: 0.9rem; margin: 0; color: #555; }

      .mw-result-item {
        display: block; padding: 0.9rem 1.25rem;
        text-decoration: none; color: inherit;
        border-bottom: 1px solid #1a1a1a;
        transition: background 0.15s;
      }
      .mw-result-item:last-child { border-bottom: none; }
      .mw-result-item:hover { background: #181818; }

      .mri-badge {
        display: inline-block; font-size: 0.65rem; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.08em;
        padding: 0.15rem 0.55rem; border-radius: 999px; margin-bottom: 0.35rem;
      }
      .mri-tips     { background: rgba(0,212,255,0.12); color: #00d4ff; }
      .mri-stories  { background: rgba(255,107,107,0.12); color: #ff6b6b; }
      .mri-concept  { background: rgba(90,180,255,0.12); color: #5ab4ff; }
      .mri-words    { background: rgba(90,180,255,0.12); color: #5ab4ff; }
      .mri-accounting { background: rgba(78,205,196,0.12); color: #4ecdc4; }
      .mri-tricks   { background: rgba(78,205,196,0.12); color: #4ecdc4; }

      .mri-title {
        font-family: 'Playfair Display', serif;
        font-size: 0.97rem; color: #f0f0f0; margin-bottom: 0.25rem; line-height: 1.35;
      }
      .mri-desc { font-size: 0.82rem; color: #888; margin: 0 0 0.35rem; line-height: 1.5; }
      .mri-meta { font-size: 0.72rem; color: #555; }
      .mw-hl { background: rgba(0,212,255,0.2); color: #00d4ff; border-radius: 2px; padding: 0 1px; font-style: normal; }

      .mw-search-footer {
        padding: 0.6rem 1.25rem; border-top: 1px solid #282828;
        font-size: 0.75rem; color: #555; flex-shrink: 0;
        display: flex; align-items: center; gap: 1rem;
      }
      .mw-search-footer::after {
        content: 'Press Esc to close · Ctrl+K to open';
        margin-left: auto; opacity: 0.6;
      }

      /* Show More */
      .mw-hidden-item { display: none !important; }
      .mw-show-more-btn {
        display: block; width: 100%;
        background: #181818; border: 1px solid #282828;
        border-radius: 10px; padding: 0.85rem;
        color: #00d4ff; font-size: 0.875rem; font-weight: 600;
        cursor: pointer; text-align: center;
        transition: all 0.2s; margin-top: 1rem;
        font-family: 'DM Sans', sans-serif;
      }
      .mw-show-more-btn:hover { background: rgba(0,212,255,0.08); border-color: rgba(0,212,255,0.4); }
      .smb-arrow { font-size: 0.8rem; margin-left: 0.3rem; }

      @media (max-width: 600px) {
        .mw-search-footer::after { display: none; }
        #mw-search-overlay { padding-top: 0; align-items: flex-end; }
        .mw-search-panel { border-radius: 16px 16px 0 0; max-height: 90vh; margin: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ─── INIT ──────────────────────────────────────────────────── */
  function init() {
    injectStyles();
    injectSearchButton();
    initShowMore();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
