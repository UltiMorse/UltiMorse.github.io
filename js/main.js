const articles = [
    // ここに記事を追加
    {
        title: "AtCoderを始めた件",
        summary: "天才たちがひしめく謎の界隈に潜入",
        url: "articles/2025-06-22-atcoder-start.html",
        date: "2025-06-22"
    },
    {
        title: "PS4 ProのHDDをSSDに換装",
        summary: "PS4 ProのHDDを余ったSSDに換装して快適になった話",
        url: "articles/2025-04-20-ps4-ssd.html",
        date: "2025-04-20"
    },
    {
        title: "Let's note CF-FV4のSSD交換",
        summary: "生協モデルCF-FV4のSSDが256GBしかなかったので1TBに換装した話",
        url: "articles/2025-04-11-cf-fv4-ssd.html",
        date: "2025-04-11"
    },
];

const articlesPerPage = 3; // 1ページあたりの記事数(記事増えたら変える予定)
let currentPage = 1;

function renderArticles() { // 記事をレンダリング
    const blogSection = document.getElementById('blog'); // id 'blog'の要素を取得
    const totalPages = Math.ceil(articles.length / articlesPerPage); // 総ページ数

    // 表示する記事を決定
    const start = (currentPage - 1) * articlesPerPage; // 現在のページに基づいて開始インデックスを計算
    const end = start + articlesPerPage; // 終了インデックスを計算
    const visibleArticles = articles.slice(start, end); // 表示する記事の配列を取得

    // 記事HTML生成
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

    blogSection.innerHTML = articlesHTML + pagerHTML;

    // イベント設定
    document.getElementById('prev').onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderArticles();
        }
    };
    document.getElementById('next').onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderArticles();
        }
    };
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.onclick = () => {
            currentPage = Number(btn.dataset.page);
            renderArticles();
        };
    });
}

window.onload = renderArticles;