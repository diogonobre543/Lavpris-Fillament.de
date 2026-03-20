/**
 * BILLIGT FILAMENT - MOTOR JAVASCRIPT 2026
 * Edição: Schilderproduktion (Produção de Placas)
 * FOCO: Correção total da atribuição de preços da API
 */

const API_URL = 'https://www.datamarked.dk/?id=8016&apikey=F47E351103F8082D62BE5163CC64B47D6CD7243E2531EB1C02F5D00C67D6EA5D';

let allProducts = [];
let activeCategory = 'all';

// Filtros de Categoria (Alemão)
const materialKeywords = ['PLA', 'PETG', 'SILK', 'ABS', 'TPU', 'ASA', 'NYLON', 'WOOD', 'CARBON'];
const printerKeywords = ['PRINTER', 'CREALITY', 'BAMBU', 'ANYCUBIC', 'ENDER', 'VORON', 'ELEGOO', 'MACHINE', 'RESIN'];

/**
 * FORMATAÇÃO DE PREÇO PARA EXIBIÇÃO
 * Removemos qualquer menção a "kr" e focamos no valor numérico.
 */
const formatPrice = (p) => {
    return new Intl.NumberFormat('de-DE', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(p);
};

/**
 * 1. NAVEGAÇÃO MOBILE
 */
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const mainNav = document.getElementById('main-nav');
    if (!hamburger || !mainNav) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mainNav.classList.toggle('active');
        document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : 'auto';
    });
}

/**
 * 2. CARREGAR PRODUTOS (LÓGICA DE PREÇO CORRIGIDA)
 */
async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        allProducts = data.map(i => {
            const titleUpper = i.title.toUpperCase();
            let cat = 'ANDERE';
            
            if (printerKeywords.some(k => titleUpper.includes(k))) {
                cat = 'PRINTER';
            } else {
                const found = materialKeywords.find(m => titleUpper.includes(m));
                cat = found || 'ANDERE';
            }

            // --- EXTRAÇÃO DE PREÇO REAL ---
            // Função interna para limpar "76 EUR" ou "125,00 kr" e virar número
            const cleanPrice = (val) => {
                if (!val) return 0;
                // Remove tudo o que não é número, ponto ou vírgula
                let s = String(val).replace(/[^\d.,]/g, '');
                // Se tiver os dois (milhar e decimal), limpa o ponto de milhar
                if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '');
                // Troca vírgula por ponto para o parseFloat do JavaScript
                return parseFloat(s.replace(',', '.')) || 0;
            };

            const pNormal = cleanPrice(i.price);
            const pSale = cleanPrice(i.sale_price);

            // Se o sale_price for maior que zero e menor que o price, usamos o sale_price.
            // Caso contrário, usamos o price normal.
            let finalPrice = (pSale > 0 && pSale < pNormal) ? pSale : pNormal;
            
            // Fallback: se um for zero, usa o outro
            if (finalPrice === 0) finalPrice = pNormal || pSale;

            return {
                title: i.title,
                price: finalPrice,
                img: i.image,
                link: i.link,
                stock: parseInt(i.stock) || 0,
                category: cat,
                description: i.description || ""
            };
        });

        renderHero();
        renderGrid();
        renderProductDetail();
        createFilterButtons();

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
}

/**
 * 3. RENDERIZAR GRID DE PRODUTOS
 */
function renderGrid() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const search = document.getElementById('searchField')?.value.toLowerCase() || '';
    const sort = document.getElementById('sortOrder')?.value || 'default';

    let list = allProducts.filter(p => {
        const matchSearch = p.title.toLowerCase().includes(search);
        const matchCat = activeCategory === 'all' || p.category === activeCategory;
        return matchSearch && matchCat;
    });

    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    if (sort === 'high') list.sort((a, b) => b.price - a.price);

    grid.innerHTML = list.map(p => `
        <article class="product-card">
            <div class="img-wrapper"><img src="${p.img}" alt="${p.title}" loading="lazy"></div>
            <div class="product-info">
                <h3>${p.title}</h3>
                <div class="price">${formatPrice(p.price)}</div>
                <div class="product-actions">
                    <a href="./product-detail.html?title=${encodeURIComponent(p.title)}" class="btn-details">Mehr erfahren</a>
                    <a href="${p.link}" target="_blank" class="btn-buy">Schildproduktion</a>
                </div>
            </div>
        </article>
    `).join('');
}

/**
 * 4. PÁGINA DE DETALHES
 */
function renderProductDetail() {
    const container = document.getElementById('product-detail-render');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productTitle = urlParams.get('title');
    const product = allProducts.find(p => p.title === productTitle);

    if (product) {
        container.innerHTML = `
            <div class="detail-image-box"><img src="${product.img}"></div>
            <div class="detail-content">
                <span class="stock-tag" style="color: ${product.stock > 0 ? '#10b981' : '#ef4444'}">
                    ${product.stock > 0 ? '● AUF LAGER' : '○ AUSVERKAUFT'}
                </span>
                <h1>${product.title}</h1>
                <div class="detail-price" style="font-size: 2.5rem; font-weight: 800; margin: 20px 0;">
                    ${formatPrice(product.price)}
                </div>
                <p><strong>Lagerbestand:</strong> ${product.stock} Stück</p>
                <div style="margin-top:20px;">${product.description}</div>
                <a href="${product.link}" target="_blank" class="btn-buy" style="display:block; text-align:center; margin-top:30px; padding:15px; background:#000; color:#fff; text-decoration:none; border-radius:8px;">JETZT KAUFEN</a>
            </div>
        `;
    }
}

/**
 * 5. FILTROS E HERO
 */
function createFilterButtons() {
    const box = document.getElementById('materialBoxes');
    if (!box) return;
    const cats = ['all', 'PRINTER', ...new Set(allProducts.map(p => p.category).filter(c => c !== 'PRINTER' && c !== 'ANDERE'))].sort();
    box.innerHTML = cats.map(c => `<button class="material-btn ${c === activeCategory ? 'active' : ''}" onclick="changeCategory('${c}')">${c === 'all' ? 'Alle' : c}</button>`).join('');
}

window.changeCategory = (cat) => { activeCategory = cat; renderGrid(); createFilterButtons(); };

function renderHero() {
    const pBox = document.getElementById('hero-random-printer');
    const mBox = document.getElementById('hero-random-material');
    if (!pBox || !mBox) return;

    const printers = allProducts.filter(p => p.category === 'PRINTER');
    const mats = allProducts.filter(p => p.category !== 'PRINTER' && p.category !== 'ANDERE');

    const card = (item) => `<div class="product-card" style="width:220px;"><img src="${item.img}" style="width:100%"><h4>${item.title}</h4><div class="price">${formatPrice(item.price)}</div></div>`;
    if (printers.length) pBox.innerHTML = card(printers[Math.floor(Math.random() * printers.length)]);
    if (mats.length) mBox.innerHTML = card(mats[Math.floor(Math.random() * mats.length)]);
}

// Inicialização Global
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadProducts();
    document.getElementById('searchField')?.addEventListener('input', renderGrid);
    document.getElementById('sortOrder')?.addEventListener('change', renderGrid);
});