const works = [
    {
        id: 1,
        title: '科学计数法转完整数字',
        category: 'web',
        desc: '将科学计数法表示的数字转换为完整数字。',
        fullDesc: '科学计数法转完整数字工具，超过20位会提示复制到剪贴板，超过50位则生成txt文件并提示下载。',
        gradient: 'linear-gradient(135deg, #1a3d44, #1a4f5a)',
        avatar: 'avatars/scientificnotation.png',
        link: 'scientificnotation.html',
    },
    {
        id: 2,
        title: 'Google Material风格小工具系列',
        category: 'web',
        desc: '一组实用的在线小工具集合，包含颜色选择器、闲鱼税计算、数字转换等工具。以及标题生成器、扫雷等小游戏。',
        fullDesc: 'Material 小工具系列，收录了多个日常实用的小工具，点击下方任意按钮即可跳转到对应页面体验。',
        gradient: 'linear-gradient(135deg, #3d2a5c, #5c3d6e)',
        avatar: 'avatars/materials.png',
        links: [
            { name: '颜色选择器', url: 'material小工具系列/colorpicker.html' },
            { name: '闲鱼税计算', url: 'material小工具系列/goofishtax.html' },
            { name: '扫雷', url: 'material小工具系列/minesweeper.html' },
            { name: '数字转换', url: 'material小工具系列/numconvert.html' },
            { name: '标题生成器', url: 'material小工具系列/titlegenerator.html' },
        ],
    },
];

function renderGallery(filter) {
    filter = filter || 'all';
    var grid = document.getElementById('galleryGrid');
    var filtered = filter === 'all' ? works : works.filter(function(w) { return w.category === filter; });

    grid.innerHTML = filtered.map(function(w, i) {
        return '<div class="card" style="animation-delay: ' + (i * 0.08) + 's" data-id="' + w.id + '">' +
            '<div class="card-image" style="background: ' + w.gradient + '">' +
                '<img class="img-bg" src="' + w.avatar + '" alt="' + w.title + '">' +
                '<span class="card-tag">' + getCategoryLabel(w.category) + '</span>' +
            '</div>' +
            '<div class="card-body">' +
                '<h3>' + w.title + '</h3>' +
                '<p>' + w.desc + '</p>' +
            '</div>' +
        '</div>';
    }).join('');

    grid.querySelectorAll('.card').forEach(function(card) {
        card.addEventListener('click', function(e) {
            var id = parseInt(this.dataset.id);
            openModal(id);
        });

        card.addEventListener('mousemove', function(e) {
            var rect = card.getBoundingClientRect();
            var xRatio = (e.clientX - rect.left) / rect.width;
            var yRatio = (e.clientY - rect.top) / rect.height;
            var rotateY = (xRatio - 0.5) * 20;
            var rotateX = (0.5 - yRatio) * 15;
            card.style.transform = 'perspective(1200px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(20px)';
        });

        card.addEventListener('mouseleave', function() {
            card.style.transform = 'none';
        });
    });
}

function getCategoryLabel(cat) {
    var map = { web: 'Web', ai: 'AI', tool: '工具', game: '游戏' };
    return map[cat] || cat;
}

function openModal(id) {
    var w = works.find(function(w) { return w.id === id; });
    if (!w) return;
    var overlay = document.getElementById('modalOverlay');
    var content = document.getElementById('modalContent');

    var linkHtml;
    if (w.links && w.links.length) {
        linkHtml = '<div class="modal-links">' + w.links.map(function(l) {
            return '<a class="btn btn-primary modal-link" href="' + l.url + '" target="_blank" rel="noopener noreferrer">' + l.name + ' →</a>';
        }).join('') + '</div>';
    } else {
        linkHtml = '<a class="btn btn-primary modal-link" href="' + (w.link || '#') + '" target="_blank" rel="noopener noreferrer">跳转 →</a>';
    }

    content.innerHTML =
        '<div style="background: ' + w.gradient + '; height: 200px; border-radius: 12px; margin-bottom: 20px; overflow: hidden;">' +
            '<img src="' + w.avatar + '" alt="' + w.title + '" style="width: 100%; height: 100%; object-fit: cover; display: block;">' +
        '</div>' +
        '<span class="modal-tag">' + getCategoryLabel(w.category) + '</span>' +
        '<h2>' + w.title + '</h2>' +
        '<p class="modal-desc">' + w.fullDesc + '</p>' +
        linkHtml;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    var overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function createParticles() {
    var container = document.getElementById('particles');
    var colors = ['#2a7c8c', '#19a7a7', '#3ea0af', '#5cc4c4', '#8ddbd8'];
    for (var i = 0; i < 40; i++) {
        var p = document.createElement('div');
        p.classList.add('particle');
        var size = Math.random() * 4 + 2;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.animationDuration = (Math.random() * 15 + 10) + 's';
        p.style.animationDelay = Math.random() * 15 + 's';
        p.style.boxShadow = '0 0 ' + (size * 2) + 'px ' + p.style.background;
        container.appendChild(p);
    }
}

function initReveal() {
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
}

document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    renderGallery();
    initReveal();

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });

    window.addEventListener('scroll', function() {
        var navbar = document.querySelector('.navbar');
        if (window.scrollY > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
});