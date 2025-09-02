const CONFIG = Object.freeze({
    // 人気記事の固定順 (空配列なら views 降順)
    popularOrder: [
        // 'articles/2025-04-11-cf-fv4-ssd.html',
    ],
    popularCount: 4,          // 人気記事表示件数
    articlesPerPage: 4,       // 1ページあたりの記事数
    navScrollHintTimeout: 5500 // モバイルナビ横スクロールヒント表示時間(ms)
});

let articles = [];
// 外部JSONから記事メタデータを取得
async function loadArticles() {
    try {
        const res = await fetch(rootPrefix() + 'articles.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (Array.isArray(data)) {
            articles = data;
        } else {
            console.warn('articles.json は配列ではありません');
            articles = [];
        }
    } catch (e) {
        console.error('記事データの読み込みに失敗', e);
        articles = [];
    }
}

// (CONFIG に集約済み)
// popularOrder / popularCount / articlesPerPage は CONFIG から参照

const { popularOrder, popularCount } = CONFIG; // 既存コード互換のため (buildSidebarLists 内など)

let currentPage = 1;
let currentFilter = ""; // 検索語
let currentCategory = ""; // カテゴリフィルタ
// ルートへの相対パス (記事ページなら '../', トップなら './')
function rootPrefix() {
    return location.pathname.includes('/articles/') ? '../' : './';
}

// ===== URL クエリパラメータ =====
function readQueryParams() {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const cat = params.get('cat');
    if (q) currentFilter = decodeURIComponent(q);
    if (cat) currentCategory = decodeURIComponent(cat);
}
function updateQueryParams() {
    const params = new URLSearchParams(location.search);
    if (currentFilter) params.set('q', currentFilter); else params.delete('q');
    if (currentCategory) params.set('cat', currentCategory); else params.delete('cat');
    const newUrl = `${location.pathname}?${params.toString()}${location.hash}`.replace(/\?$/, '');
    window.history.replaceState(null, '', newUrl);
}


function setPageFromHash() {
    const hash = location.hash.match(/page=(\d+)/);
    currentPage = hash ? Math.max(1, Math.min(Number(hash[1]), Math.ceil(articles.length / CONFIG.articlesPerPage))) : 1;
}

function updateHash(page) {
    location.hash = `page=${page}`;
}

function getFilteredArticles() {
    let list = articles;
    if (currentCategory) {
        list = list.filter(a => a.category === currentCategory);
    }
    if (!currentFilter) return list;
    const kw = currentFilter.toLowerCase();
    return list.filter(a =>
        a.title.toLowerCase().includes(kw) ||
        a.summary.toLowerCase().includes(kw) ||
        (a.date && a.date.includes(kw)) ||
        (a.category && a.category.toLowerCase().includes(kw))
    );
}

function renderArticles() {
    const blogSection = document.getElementById('blog');
    if (!blogSection) return; // 記事個別ページではスキップ
    setPageFromHash();
    const filtered = getFilteredArticles();
    const totalPages = Math.ceil(filtered.length / CONFIG.articlesPerPage) || 1;

    // ページが範囲外になったら戻す
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * CONFIG.articlesPerPage;
    const end = start + CONFIG.articlesPerPage;
    const visibleArticles = filtered.slice(start, end);

    let articlesHTML = '<h2>ブログ記事一覧</h2>';
    visibleArticles.forEach(article => {
    articlesHTML += `
        <article>
            <h3>
                ${article.url ? `<a href="${article.url}">${article.title}</a>` : article.title}
            </h3>
            ${article.date ? `<p class="article-date"><small>${article.date}</small></p>` : ""}
            <p>${article.summary}</p>
            <a href="${article.url ? article.url : '#'}">続きを読む</a>
        </article>
    `;
});

    // ページネーションHTML生成
    let pagerHTML = `<div class="pager">`;
    pagerHTML += `<button id="prev" ${currentPage === 1 ? "disabled" : ""}>前へ</button>`;
    for (let i = 1; i <= totalPages; i++) {
        pagerHTML += `<button class="page-btn${i === currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
    }
    pagerHTML += `<button id="next" ${currentPage === totalPages ? "disabled" : ""}>次へ</button>`;
    pagerHTML += `</div>`;

    if (visibleArticles.length === 0) {
        articlesHTML += `<p>該当する記事がありません。</p>`;
    }

    blogSection.innerHTML = articlesHTML + pagerHTML;

        // イベント設定
        document.getElementById('prev').onclick = () => {
            if (currentPage > 1) {
                updateHash(currentPage - 1); // ハッシュでページ数を保持(urlに#page=nのように)
            }
        };
        document.getElementById('next').onclick = () => {
            if (currentPage < totalPages) {
                updateHash(currentPage + 1);
            }
        };
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.onclick = () => {
                updateHash(Number(btn.dataset.page));
            };
        });
    // 検索結果件数表示
    const infoEl = document.getElementById('search-result-info');
    if (infoEl) {
        if (currentFilter) {
            infoEl.textContent = `"${currentFilter}" の検索結果: ${filtered.length}件`;
        } else if (currentCategory) {
            infoEl.textContent = `${currentCategory} カテゴリ: ${filtered.length}件`;
        } else {
            infoEl.textContent = '';
        }
    }
}

function initSearch() {
    const input = document.getElementById('site-search');
    const clearBtn = document.getElementById('clear-search');
    if (!input) return;
    const hasBlog = !!document.getElementById('blog');
    // 既存クエリ反映
    if (currentFilter) input.value = currentFilter;
    const handle = () => {
        if (hasBlog) {
            currentFilter = input.value.trim();
            currentPage = 1;
            renderArticles();
            updateQueryParams();
        }
    };
    input.addEventListener('input', handle);
    // Enterで index へ検索遷移（ブログ一覧が無いページのみ）
    if (!hasBlog) {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const q = encodeURIComponent(input.value.trim());
                location.href = rootPrefix() + `index.html${q ? ('?q=' + q) : ''}`;
            }
        });
    }
    clearBtn && clearBtn.addEventListener('click', () => {
        input.value = '';
        if (hasBlog) {
            handle();
            input.focus();
        } else {
            location.href = rootPrefix() + 'index.html';
        }
    });
}

window.addEventListener('hashchange', renderArticles);
window.onload = async () => {
    readQueryParams();
    await loadArticles();
    initSearch();
    if (document.getElementById('blog')) {
        renderArticles();
    }
    initMobileBottomNav();
    buildSidebarLists();
    // ===== ナビ横スクロールヒント (600px未満 & オーバーフロー時のみ) =====
    (function(){
        if (window.innerWidth >= 600) return;
        const headerNav = document.querySelector('header nav');
        if (!headerNav) return;
        const ul = headerNav.querySelector('ul');
        if (!ul) return;
        if (ul.scrollWidth <= ul.clientWidth + 4) return; // 溢れていない
        if (sessionStorage.getItem('navHintDismissed')) return;
        if (headerNav.querySelector('.nav-scroll-hint')) return;
        const hint = document.createElement('span');
        hint.className = 'nav-scroll-hint';
        hint.textContent = '横スクロール→';
        headerNav.appendChild(hint);
        const dismiss = () => {
            if (!hint.isConnected) return;
            hint.remove();
            sessionStorage.setItem('navHintDismissed','1');
            ul.removeEventListener('scroll', onScroll);
            window.removeEventListener('touchstart', onScroll);
        };
        const onScroll = () => { if (ul.scrollLeft > 8) dismiss(); };
        ul.addEventListener('scroll', onScroll, { passive:true });
        window.addEventListener('touchstart', onScroll, { passive:true });
    setTimeout(dismiss, CONFIG.navScrollHintTimeout);
    })();
};

// ===== Mobile Bottom Nav & Floating Sidebar =====
function initMobileBottomNav() {
    const nav = document.querySelector('.mobile-bottom-nav');
    if (!nav) return;

    // Prepare floating sidebar (clone existing sidebar content)
    const originalSidebar = document.querySelector('.sidebar'); // 元の(PC用)サイドバー
    let floatPanel, dim, menuPanel; 
    if (originalSidebar) {
        floatPanel = document.createElement('div');
        floatPanel.className = 'sidebar-float-panel';
        floatPanel.setAttribute('aria-label','モバイル用サイドバー');
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'sidebar-float-close';
        closeBtn.textContent = '閉じる';
        closeBtn.addEventListener('click', () => toggleSidebar(false));
        floatPanel.appendChild(closeBtn);
        // clone nodes (shallow) then import children
    Array.from(originalSidebar.children).forEach(ch => floatPanel.appendChild(ch.cloneNode(true)));
        document.body.appendChild(floatPanel);
        dim = document.createElement('div');
        dim.className = 'screen-dim';
    dim.addEventListener('click', () => closeAllPanels());
        document.body.appendChild(dim);

        // クローン側検索入力にイベント付与 (ID変更して重複回避)
        const clonedInput = floatPanel.querySelector('#site-search');
        if (clonedInput) {
            clonedInput.id = 'site-search-float';
            const label = floatPanel.querySelector('label[for="site-search"]');
            if (label) label.setAttribute('for','site-search-float');
            const clonedClear = floatPanel.querySelector('#clear-search');
            if (clonedClear) clonedClear.id = 'clear-search-float';
            const attach = (inp, clr) => {
                const handle = () => {
                    currentFilter = inp.value.trim();
                    currentPage = 1;
                    renderArticles();
                };
                inp.addEventListener('input', handle);
                clr && clr.addEventListener('click', () => { inp.value=''; handle(); inp.focus(); });
            };
            attach(clonedInput, floatPanel.querySelector('#clear-search-float'));
        }
    }

    // ===== モバイルメニュー生成 (ヘッダーナビのリンクを抽出) =====
    const headerNav = document.querySelector('header nav ul');
    if (headerNav) {
        menuPanel = document.createElement('div');
        menuPanel.className = 'mobile-menu-panel';
        menuPanel.setAttribute('aria-label','モバイルメニュー');
        const closeBtn2 = document.createElement('button');
        closeBtn2.type = 'button';
        closeBtn2.className = 'mobile-menu-close';
        closeBtn2.textContent = '閉じる';
        closeBtn2.addEventListener('click', () => toggleMenu(false));
        menuPanel.appendChild(closeBtn2);
        const h2 = document.createElement('h2');
        h2.textContent = 'メニュー';
        menuPanel.appendChild(h2);
        const list = document.createElement('ul');
        list.className = 'mobile-menu-links';
        headerNav.querySelectorAll('a').forEach(a => {
            const li = document.createElement('li');
            const copy = a.cloneNode(true);
            li.appendChild(copy);
            list.appendChild(li);
        });
        menuPanel.appendChild(list);
        document.body.appendChild(menuPanel);
    }

    function lockBody(lock) {
        document.body.style.overflow = lock ? 'hidden' : '';
    }

    function toggleSidebar(open) {
        if (!floatPanel) return;
        if (open) {
        // 他方を閉じる
        if (menuPanel && menuPanel.classList.contains('open')) toggleMenu(false);
            floatPanel.classList.add('open');
            dim && dim.classList.add('visible');
            lockBody(true);
        } else {
            floatPanel.classList.remove('open');
            dim && dim.classList.remove('visible');
            lockBody(false);
        }
    }

    function toggleMenu(open) {
        if (!menuPanel) return;
        if (open) {
        if (floatPanel && floatPanel.classList.contains('open')) toggleSidebar(false);
            menuPanel.classList.add('open');
            dim && dim.classList.add('visible');
            lockBody(true);
        } else {
            menuPanel.classList.remove('open');
            // 閉じる際、サイドバーが開いていなければdimを消す
            if (!(floatPanel && floatPanel.classList.contains('open'))) {
                dim && dim.classList.remove('visible');
                lockBody(false);
            }
        }
    }

    function closeAllPanels() {
    if (floatPanel && floatPanel.classList.contains('open')) toggleSidebar(false);
    if (menuPanel && menuPanel.classList.contains('open')) toggleMenu(false);
    }

    nav.addEventListener('click', (e) => {
        const btn = e.target.closest('.mb-nav-btn');
        if (!btn) return;
        const action = btn.dataset.action;
        switch(action) {
            case 'home':
                location.href = rootPrefix() + 'index.html';
                break;
            case 'top':
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'search':
                // モバイルではサイドバーを開いて検索欄にフォーカス
                const viewportWidth = window.innerWidth;
                const sidebarOpen = floatPanel && floatPanel.classList.contains('open');
                if (viewportWidth <= 800 && !sidebarOpen) {
                    toggleSidebar(true);
                    requestAnimationFrame(() => {
                        const floatInput = document.getElementById('site-search-float');
                        if (floatInput) floatInput.focus();
                    });
                } else {
                    const targetInput = document.getElementById('site-search-float') || document.getElementById('site-search');
                    if (targetInput) targetInput.focus();
                }
                break;
            case 'sidebar':
                // サイドバー(プロフィール+検索)
                toggleSidebar(!(floatPanel && floatPanel.classList.contains('open')));
                break;
            case 'menu':
                // 上部ナビの簡易版
                toggleMenu(!(menuPanel && menuPanel.classList.contains('open')));
                break;
        }
    });

    // 外側クリックで閉じる
    document.addEventListener('click', (e) => {
        const target = e.target;
        // パネル内 or ボトムナビ内クリックは除外
        if ((floatPanel && floatPanel.contains(target)) || (menuPanel && menuPanel.contains(target))) return;
        if (nav.contains(target)) return;
        // どちらか開いているなら閉じる
        if ((floatPanel && floatPanel.classList.contains('open')) || (menuPanel && menuPanel.classList.contains('open'))) {
            closeAllPanels();
        }
    });

    // スクロール方向でナビ表示切替
    let lastY = window.scrollY;
    let ticking = false;
    function onScroll() {
        const currentY = window.scrollY;
        const diff = currentY - lastY;
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const atBottom = winHeight + currentY >= docHeight - 24; // 24px 以内を最下部扱い

        if (atBottom) {
            nav.classList.remove('hide');
            lastY = currentY;
        } else if (Math.abs(diff) > 6) { // 小さな揺れは無視
            if (diff > 0 && currentY > 80) { // 下方向
                nav.classList.add('hide');
            } else { // 上方向
                nav.classList.remove('hide');
            }
            lastY = currentY;
        }
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });
}

// ===== サイドバー: カテゴリ / 人気 / おすすめ =====
function buildSidebarLists() {
    // 全カテゴリーリスト(オリジナル + クローン)を対象
    const catLists = document.querySelectorAll('.category-list');
    if (catLists.length) {
        const cats = Array.from(new Set(articles.map(a => a.category))).sort();
        catLists.forEach(listEl => {
            listEl.innerHTML = '';
            cats.forEach(cat => {
                const li = document.createElement('li');
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = cat;
                btn.dataset.cat = cat;
                if (cat === currentCategory) btn.classList.add('active');
                btn.addEventListener('click', () => {
                    const hasBlog = !!document.getElementById('blog');
                    if (hasBlog) {
                        currentCategory = (currentCategory === cat) ? '' : cat;
                        currentPage = 1;
                        document.querySelectorAll('.category-list button').forEach(b => b.classList.toggle('active', b.dataset.cat === currentCategory));
                        renderArticles();
                        updateQueryParams();
                    } else {
                        // 個別記事ページでは index へ遷移
                        const targetCat = (currentCategory === cat) ? '' : cat;
                        if (targetCat) {
                            location.href = rootPrefix() + `index.html?cat=${encodeURIComponent(targetCat)}`;
                        } else {
                            location.href = rootPrefix() + 'index.html';
                        }
                    }
                });
                li.appendChild(btn);
                listEl.appendChild(li);
            });
            // クリアボタン(同じセクション内)
            const clearBtn = listEl.parentElement.querySelector('.clear-category-btn');
            if (clearBtn && !clearBtn.dataset.bound) {
                clearBtn.dataset.bound = '1';
                clearBtn.addEventListener('click', () => {
                    const hasBlog = !!document.getElementById('blog');
                    if (hasBlog) {
                        currentCategory = '';
                        currentPage = 1;
                        document.querySelectorAll('.category-list button').forEach(b => b.classList.remove('active'));
                        renderArticles();
                        updateQueryParams();
                    } else {
                        location.href = rootPrefix() + 'index.html';
                    }
                });
            }
        });
    }

    // 人気記事: HTMLに書かれているものを無視して自動生成 (popularOrder優先 / fallback views)
    const popLists = document.querySelectorAll('.popular-list');
    if (popLists.length) {
        let popularArticles = [];
        if (popularOrder && popularOrder.length) {
            const map = new Map(articles.map(a=>[a.url,a]));
            popularOrder.forEach(u => { if (map.has(u)) popularArticles.push(map.get(u)); });
        } else {
            popularArticles = [...articles].sort((a,b)=> (b.views||0)-(a.views||0));
        }
        popularArticles = popularArticles.slice(0, popularCount);
        popLists.forEach(popEl => {
            popEl.innerHTML = '';
            popularArticles.forEach(a => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${a.url}">${a.title}</a>`;
                popEl.appendChild(li);
            });
        });
    }

    // おすすめ記事 (recommended true) も全クローンへ
    const recLists = document.querySelectorAll('.recommended-list');
    if (recLists.length) {
        const recs = articles.filter(a=>a.recommended).slice(0,6);
        recLists.forEach(recEl => {
            recEl.innerHTML = '';
            recs.forEach(a => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${a.url}">${a.title}</a>`;
                recEl.appendChild(li);
            });
        });
    }
}
