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
];

function renderGallery(filter) {
    filter = filter || 'all';
    var grid = document.getElementById('galleryGrid');
    var filtered = filter === 'all' ? works : works.filter(function(w) { return w.category === filter; });

    grid.innerHTML = filtered.map(function(w, i) {
        return '<div class="card reveal" style="animation-delay: ' + (i * 0.08) + 's" data-id="' + w.id + '">' +
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
    });

    setTimeout(function() {
        document.querySelectorAll('.reveal').forEach(function(el) {
            if (el.getBoundingClientRect().top < window.innerHeight - 50) {
                el.classList.add('visible');
            }
        });
    }, 100);
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
    content.innerHTML =
        '<div style="background: ' + w.gradient + '; height: 200px; border-radius: 12px; margin-bottom: 20px; overflow: hidden;">' +
            '<img src="' + w.avatar + '" alt="' + w.title + '" style="width: 100%; height: 100%; object-fit: cover; display: block;">' +
        '</div>' +
        '<span class="modal-tag">' + getCategoryLabel(w.category) + '</span>' +
        '<h2>' + w.title + '</h2>' +
        '<p class="modal-desc">' + w.fullDesc + '</p>' +
        '<a class="btn btn-primary modal-link" href="' + (w.link || '#') + '" target="_blank" rel="noopener noreferrer">跳转 →</a>';
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

    document.getElementById('filterBar').addEventListener('click', function(e) {
        if (!e.target.classList.contains('filter-tag')) return;
        this.querySelectorAll('.filter-tag').forEach(function(t) { t.classList.remove('active'); });
        e.target.classList.add('active');
        renderGallery(e.target.dataset.filter);
    });

    window.addEventListener('scroll', function() {
        var navbar = document.querySelector('.navbar');
        if (window.scrollY > 10) {
            navbar.style.boxShadow = '0 4px 30px rgba(42, 124, 140, 0.15)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });
});