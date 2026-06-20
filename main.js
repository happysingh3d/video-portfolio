(function () {
  'use strict';

  const CAT_LABELS = {
    finale: 'Grand Finale',
    kkhd:   'KKHD Reality Show',
    bio:    'Biography Edit',
    motion: 'Motion Graphics',
    judges: 'Judge Edit',
    hobby:  'Short Film',
  };

  const PAGED_CATS = ['kkhd']; // Only KKHD (217) uses Load More
  const PAGE = 24;

  const grid        = document.getElementById('videoGrid');
  const loadMoreBtn = document.getElementById('loadMore');
  const showingCount = document.getElementById('showingCount');
  const tabs        = document.querySelectorAll('.tab');

  let currentCat = 'finale';
  let rendered   = 0;

  function getUrl(v) {
    if (v.host === 'drive') {
      return 'https://drive.google.com/file/d/' + v.id + '/view?usp=sharing';
    }
    if (v.host === 'behance') {
      return 'https://www-ccv.adobe.io/v1/player/ccv/' + v.id + '/embed?bgcolor=%23191919&lazyLoading=true&api_key=BehancePro2View';
    }
    return 'https://www.youtube.com/watch?v=' + v.id;
  }

  function getThumb(v) {
    if (v.host === 'drive' || v.host === 'behance') {
      return 'thumbnails/' + v.thumb;
    }
    return 'https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg';
  }

  function getFallbackThumb(v) {
    if (v.host === 'drive' || v.host === 'behance') {
      return 'thumbnails/' + v.thumb;
    }
    return 'https://img.youtube.com/vi/' + v.id + '/hqdefault.jpg';
  }

  // Card HTML (supports YouTube, Google Drive, and Behance)
  function videoCardHTML(v) {
    var isDrive = v.host === 'drive';
    var isBehance = v.host === 'behance';
    var url = getUrl(v);
    var thumbnail = getThumb(v);
    var fallback = getFallbackThumb(v);
    var watchText = isDrive ? 'Watch on Google Drive' : (isBehance ? 'Watch on Behance' : 'Watch on YouTube');

    return (
      '<a class="card" href="' + url + '" target="_blank" rel="noopener">' +
        '<div class="thumb">' +
          '<span class="badge">' + (CAT_LABELS[v.cat] || 'Video') + '</span>' +
          '<img loading="lazy" src="' + thumbnail + '" alt="' + v.title + '" ' +
            'onerror="this.onerror=null;this.src=\'' + fallback + '\'">' +
          '<div class="play"><span><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></div>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-title">' + v.title + '</div>' +
          '<div class="card-meta">' + (CAT_LABELS[v.cat] || 'Video') + ' · ' + watchText + '</div>' +
        '</div>' +
      '</a>'
    );
  }

  // Pending placeholder card (YouTube link not yet added)
  function pendingCardHTML(v) {
    return (
      '<div class="card card-pending">' +
        '<div class="thumb pending-thumb">' +
          '<span class="badge badge-pending">Coming Soon</span>' +
          '<div class="pending-inner">' +
            '<svg viewBox="0 0 24 24" class="pending-icon"><path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z" fill="currentColor"/></svg>' +
            '<p class="pending-title">' + v.title + '</p>' +
            '<p class="pending-sub">Uploading to YouTube — coming soon</p>' +
          '</div>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-title">' + v.title + '</div>' +
          '<div class="card-meta">Judge Edit · YouTube link pending</div>' +
        '</div>' +
      '</div>'
    );
  }

  function cardHTML(v) {
    return v.pending ? pendingCardHTML(v) : videoCardHTML(v);
  }

  function renderCategory(cat, reset) {
    const list = VIDEO_DATA[cat] || [];
    const usesPaging = PAGED_CATS.indexOf(cat) !== -1;

    if (reset) {
      grid.innerHTML = Array(Math.min(6, list.length || 6))
        .fill('<div class="skeleton-card"><div class="skeleton-thumb shimmer"></div><div class="skeleton-body"><div class="skeleton-title shimmer"></div><div class="skeleton-meta shimmer"></div></div></div>')
        .join('');
      rendered = 0;
      loadMoreBtn.classList.add('hidden');
      showingCount.textContent = 'Loading...';

      setTimeout(function () {
        if (currentCat !== cat) return;
        grid.innerHTML = '';
        doRender();
      }, 300);
    } else {
      doRender();
    }

    function doRender() {
      const end   = usesPaging ? Math.min(rendered + PAGE, list.length) : list.length;
      const slice = list.slice(rendered, end);
      const frag  = document.createElement('div');
      frag.innerHTML = slice.map(cardHTML).join('');
      while (frag.firstChild) grid.appendChild(frag.firstChild);
      rendered = end;
      observeReveals();
      updateLoadMore(list.length, usesPaging);
    }
  }

  function updateLoadMore(total, usesPaging) {
    if (usesPaging && rendered < total) {
      loadMoreBtn.classList.remove('hidden');
      loadMoreBtn.textContent = 'Load More (' + (total - rendered) + ' left)';
    } else {
      loadMoreBtn.classList.add('hidden');
    }
    showingCount.textContent = 'Showing ' + rendered + ' of ' + total + ' videos';
  }

  // Tab switching
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var cat = t.getAttribute('data-cat');
      if (cat === currentCat) return;
      currentCat = cat;
      tabs.forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      renderCategory(cat, true);
    });
  });

  loadMoreBtn.addEventListener('click', function () {
    renderCategory(currentCat, false);
  });

  // Hobbies section
  function renderHobbies() {
    var hg   = document.getElementById('hobbyGrid');
    var list = VIDEO_DATA.hobby || [];
    hg.innerHTML = list.map(function (v) {
      var url = getUrl(v);
      var thumbnail = getThumb(v);
      var fallback = getFallbackThumb(v);
      var tag = (v.title.toLowerCase().indexOf('dance') !== -1) ? 'Dance · Video Edit' : 'Acting · Short Film';

      return (
        '<a class="hobby-card" href="' + url + '" target="_blank" rel="noopener">' +
          '<div class="thumb">' +
            '<img loading="lazy" src="' + thumbnail + '" alt="' + v.title + '" ' +
              'onerror="this.onerror=null;this.src=\'' + fallback + '\'">' +
            '<div class="play"><span><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></div>' +
          '</div>' +
          '<div class="hb-body">' +
            '<div class="hb-tag">' + tag + '</div>' +
            '<div class="hb-title">' + v.title + '</div>' +
          '</div>' +
        '</a>'
      );
    }).join('');
  }

  // Scroll reveal
  var io;
  function observeReveals() {
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    }
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { io.observe(el); });
  }

  // Sticky header and scroll-to-top button
  var header = document.getElementById('header');
  var scrollToTopBtn = document.getElementById('scrollToTop');
  function onScroll() {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');

    if (scrollToTopBtn) {
      if (window.scrollY > 300) {
        scrollToTopBtn.classList.add('visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Mobile menu
  var menuToggle = document.getElementById('menuToggle');
  var nav        = document.getElementById('nav');
  menuToggle.addEventListener('click', function () {
    nav.classList.toggle('open');
    menuToggle.textContent = nav.classList.contains('open') ? '✕' : '☰';
  });
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('open');
      menuToggle.textContent = '☰';
    });
  });

  // Init
  function init() {
    document.body.classList.remove('loading');
    renderCategory('finale', true);
    renderHobbies();
    observeReveals();
    onScroll();
    requestAnimationFrame(function () {
      document.querySelectorAll('.hero .reveal').forEach(function (el) { el.classList.add('in'); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
