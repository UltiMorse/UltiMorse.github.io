const articles = [
    // ここに記事を追加
    {
        title: "信州大学ACSU多要素認証の自動化",
        summary: "WisePointを自動化するTampermonkeyスクリプト",
        url: "articles/2025-08-09-acsu-auto.html",
        date: "2025-08-09"
    },
    {
        title: "レッツノートCF-FV4でFnキーとCtrlキーを入れ替える方法",
        summary: "Fnが左下は使いにくいのでCtrlキーと入れ替える",
        url: "articles/2025-07-17-ctl-fn-swap.html",
        date: "2025-07-17"
    },
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

const articlesPerPage = 4; // 1ページあたりの記事数(記事増えたら変える予定)
let currentPage = 1;

function renderArticles() {
    const blogSection = document.getElementById('blog');
    const totalPages = Math.ceil(articles.length / articlesPerPage);

    const start = (currentPage - 1) * articlesPerPage;
    const end = start + articlesPerPage;
    const visibleArticles = articles.slice(start, end);

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