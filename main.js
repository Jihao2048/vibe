const works = [
    {
        title: '无亚像素图片查看器',
        category: 'Python',
        desc: '屏幕上每一个像素都严格对应原图真实像素，绝不出现插值算出来的亚像素。',
        fullDesc: '一个用Python写的图片查看器，从算法层面和显示链路层面双重杜绝亚像素渲染。缩放倍率只能是整数或整数的倒数，同时通过Win32 API声明DPI感知，确保1个图像像素=1个物理像素。支持放大/缩小查看、鼠标拖拽、滚轮缩放，并提供屏幕像素验证工具。',
        avatar: 'avatars/nosubpixel.png',
        link: 'nosubpixel/viewer.py',
    },
    {
        title: 'LaTeX图像生成器',
        category: 'web',
        desc: '把latex的图形玩出花来',
        fullDesc: '你们不是喜欢和DeepSeek调情吗？客户端里面自带了latex图形渲染器，大家都想做出一个特别的聊天框来。今天让你们动动手指就能做出好看的消息框。',
        avatar: 'avatars/latex.png',
        link: 'https://latex.ias1054.cn',
    },
    {
        title: '科学计数法转完整数字',
        category: 'web',
        desc: '将科学计数法表示的数字转换为完整数字。',
        fullDesc: '科学计数法转完整数字工具，超过20位会提示复制到剪贴板，超过50位则生成txt文件并提示下载。',
        avatar: 'avatars/scientificnotation.png',
        link: '科学计数法/index.html',
    },
    {
        title: 'Google Material风格小工具系列',
        category: 'web',
        desc: '一组实用的在线小工具集合，包含颜色选择器、闲鱼税计算、数字转换等工具。以及标题生成器、扫雷等小游戏。',
        fullDesc: 'Material 小工具系列，收录了多个日常实用的小工具，点击下方任意按钮即可跳转到对应页面体验。',
        avatar: 'avatars/materials.png',
        links: [
            { name: '颜色选择器', url: 'material/colorpicker.html' },
            { name: '闲鱼税计算', url: 'material/goofishtax.html' },
            { name: '数字转换', url: 'material/numconvert.html' },
        ],
    },
    {
        title: 'Minecraft Verity模组的API包装工具',
        category: 'Python',
        desc: 'Verity是国外博主ThatMob视频中的原创角色，由爱好者将其制作成模组。通过这个工具可以让Verity模组调用国内ai平台。',
        fullDesc: '由于中国网络限制，可能无法访问ollama或者groq，这个工具将国内ai平台的api包装成Verity模组可调用的接口，方便国内玩家使用。工具特色：可以选择六种国内ai平台，包括通义千问，智谱，字节跳动豆包，DeepSeek，MiniMax。选择后，输入模型名称以及密钥，即可点击开始运行。上次输入的模型名称以及密钥会记录进ini，下一次启动时会自动填充。同时，工具不仅可以供Verity模组调用，还可以让别的软件使用，例如使用curl命令行调用，或者在Python中调用。',
        avatar: 'avatars/veritymod.png',
        link: 'verity/main.py',
    }
];

var coverflowIndex = 0;
var coverflowWorks = [];
var isDragging = false;
var dragStartX = 0;
var dragDeltaX = 0;
var wheelTimer = null;
var cfRafId = null;
var cfPending = false;
var cfWrappers = null;
var cfDots = null;
var cfPrevBtn = null;
var cfNextBtn = null;
var hoverRafId = null;
var dragMoveHandler = null;
var dragUpHandler = null;

function renderGallery(filter) {
    filter = filter || 'all';
    coverflowWorks = filter === 'all' ? works : works.filter(function(w) { return w.category === filter; });
    coverflowIndex = Math.min(coverflowIndex, coverflowWorks.length - 1);
    if (coverflowWorks.length === 0) coverflowIndex = 0;

    var grid = document.getElementById('galleryGrid');

    var html = '<div class="coverflow-container">' +
        '<button class="coverflow-nav prev" aria-label="上一个">◂</button>' +
        '<button class="coverflow-nav next" aria-label="下一个">▸</button>' +
        '<div class="coverflow-stage" id="coverflowStage">';

    coverflowWorks.forEach(function(w, i) {
        html += '<div class="coverflow-card-wrapper" data-index="' + i + '">' +
            '<div class="card" data-index="' + i + '">' +
                '<div class="card-image">' +
                    '<img class="img-bg" src="' + w.avatar + '" alt="' + w.title + '">' +
                    '<span class="card-tag">' + getCategoryLabel(w.category) + '</span>' +
                '</div>' +
                '<div class="card-body">' +
                    '<h3>' + w.title + '</h3>' +
                    '<p>' + w.desc + '</p>' +
                '</div>' +
            '</div>' +
        '</div>';
    });

    html += '</div>' +
        '<div class="coverflow-dots" id="coverflowDots"></div>' +
        '</div>';

    grid.innerHTML = html;

    var dotsHtml = '';
    coverflowWorks.forEach(function(_, i) {
        dotsHtml += '<div class="coverflow-dot" data-index="' + i + '"></div>';
    });
    document.getElementById('coverflowDots').innerHTML = dotsHtml;

    cfWrappers = document.querySelectorAll('.coverflow-card-wrapper');
    cfDots = document.querySelectorAll('.coverflow-dot');
    cfPrevBtn = document.querySelector('.coverflow-nav.prev');
    cfNextBtn = document.querySelector('.coverflow-nav.next');

    attachCoverflowEvents();
    scheduleUpdateCoverflow();
}

function scheduleUpdateCoverflow() {
    if (cfPending) return;
    cfPending = true;
    if (cfRafId) cancelAnimationFrame(cfRafId);
    cfRafId = requestAnimationFrame(function() {
        cfPending = false;
        cfRafId = null;
        updateCoverflow();
    });
}

function updateCoverflow() {
    var wrappers = cfWrappers;
    var dots = cfDots;
    var prevBtn = cfPrevBtn;
    var nextBtn = cfNextBtn;

    if (!wrappers || !wrappers.length) return;

    for (var i = 0; i < wrappers.length; i++) {
        var wrapper = wrappers[i];
        var offset = i - coverflowIndex;
        var t = getCardTransform(offset);

        wrapper.style.transform = 'translateX(' + t.translateX + 'px) ' +
            'rotateY(' + t.rotateY + 'deg) ' +
            'translateZ(' + t.translateZ + 'px) ' +
            'scale(' + t.scale + ')';
        wrapper.style.zIndex = t.zIndex;
        wrapper.style.opacity = t.opacity;

        if (offset === 0) {
            wrapper.classList.add('active');
        } else {
            wrapper.classList.remove('active');
        }
    }

    if (dots) {
        for (var j = 0; j < dots.length; j++) {
            if (j === coverflowIndex) {
                dots[j].classList.add('active');
            } else {
                dots[j].classList.remove('active');
            }
        }
    }

    if (prevBtn) prevBtn.style.visibility = coverflowIndex === 0 ? 'hidden' : 'visible';
    if (nextBtn) nextBtn.style.visibility = coverflowIndex === coverflowWorks.length - 1 ? 'hidden' : 'visible';
}

function getCardTransform(offset) {
    var absOffset = Math.abs(offset);
    var sign = offset < 0 ? -1 : 1;

    if (absOffset === 0) {
        return { translateX: 0, rotateY: 0, translateZ: 0, scale: 1, opacity: 1, zIndex: 100 };
    }
    if (absOffset === 1) {
        return { translateX: sign * 200, rotateY: sign * -38, translateZ: -130, scale: 0.84, opacity: 0.7, zIndex: 80 };
    }
    if (absOffset === 2) {
        return { translateX: sign * 260, rotateY: sign * -55, translateZ: -280, scale: 0.65, opacity: 0.35, zIndex: 55 };
    }
    return { translateX: sign * 300, rotateY: sign * -65, translateZ: -450, scale: 0.4, opacity: 0, zIndex: 0 };
}

function navigateCoverflow(direction) {
    var newIndex = coverflowIndex + direction;
    if (newIndex >= 0 && newIndex < coverflowWorks.length) {
        coverflowIndex = newIndex;
        scheduleUpdateCoverflow();
    }
}

var lastHoveredCard = null;

function attachCoverflowEvents() {
    var stage = document.getElementById('coverflowStage');
    if (!stage) return;

    var prevBtn = cfPrevBtn;
    var nextBtn = cfNextBtn;
    var dots = cfDots;

    stage.addEventListener('click', function(e) {
        if (isDragging) {
            e.preventDefault();
            return;
        }
        var wrapper = e.target.closest('.coverflow-card-wrapper');
        if (!wrapper) return;
        var index = parseInt(wrapper.dataset.index);
        if (index === coverflowIndex) {
            var card = wrapper.querySelector('.card');
            var index = parseInt(card.dataset.index);
            openModal(index);
        } else {
            coverflowIndex = index;
            scheduleUpdateCoverflow();
        }
    });

    stage.addEventListener('mousemove', function(e) {
        if (hoverRafId) return;
        hoverRafId = requestAnimationFrame(function() {
            hoverRafId = null;
            var wrapper = e.target.closest('.coverflow-card-wrapper');
            var card = null;
            if (wrapper && parseInt(wrapper.dataset.index) === coverflowIndex) {
                card = wrapper.querySelector('.card');
            }
            if (lastHoveredCard && lastHoveredCard !== card) {
                lastHoveredCard.style.transform = '';
            }
            lastHoveredCard = card;
            if (!card) return;
            var rect = card.getBoundingClientRect();
            var xRatio = (e.clientX - rect.left) / rect.width;
            var yRatio = (e.clientY - rect.top) / rect.height;
            var rotateY = (xRatio - 0.5) * 20;
            var rotateX = (0.5 - yRatio) * 15;
            card.style.transform = 'perspective(1200px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(20px)';
        });
    });

    stage.addEventListener('mouseleave', function() {
        if (hoverRafId) {
            cancelAnimationFrame(hoverRafId);
            hoverRafId = null;
        }
        if (lastHoveredCard) {
            lastHoveredCard.style.transform = '';
            lastHoveredCard = null;
        }
    });

    if (prevBtn) prevBtn.addEventListener('click', function(e) { e.stopPropagation(); navigateCoverflow(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function(e) { e.stopPropagation(); navigateCoverflow(1); });

    if (dots) {
        for (var d = 0; d < dots.length; d++) {
            (function(idx) {
                dots[idx].addEventListener('click', function() {
                    coverflowIndex = idx;
                    scheduleUpdateCoverflow();
                });
            })(d);
        }
    }

    stage.addEventListener('mousedown', function(e) {
        isDragging = false;
        dragStartX = e.clientX;
        dragDeltaX = 0;

        dragMoveHandler = function(e) {
            if (dragStartX === 0) return;
            dragDeltaX = e.clientX - dragStartX;
            if (Math.abs(dragDeltaX) > 5) {
                isDragging = true;
            }
        };
        dragUpHandler = function() {
            if (isDragging && Math.abs(dragDeltaX) > 50) {
                if (dragDeltaX > 0) {
                    navigateCoverflow(-1);
                } else {
                    navigateCoverflow(1);
                }
            }
            dragStartX = 0;
            dragDeltaX = 0;
            setTimeout(function() { isDragging = false; }, 0);
            document.removeEventListener('mousemove', dragMoveHandler);
            document.removeEventListener('mouseup', dragUpHandler);
            dragMoveHandler = null;
            dragUpHandler = null;
        };
        document.addEventListener('mousemove', dragMoveHandler);
        document.addEventListener('mouseup', dragUpHandler);
    });

    stage.addEventListener('touchstart', function(e) {
        isDragging = false;
        dragStartX = e.touches[0].clientX;
        dragDeltaX = 0;
    }, { passive: true });

    stage.addEventListener('touchmove', function(e) {
        dragDeltaX = e.touches[0].clientX - dragStartX;
        if (Math.abs(dragDeltaX) > 5) {
            isDragging = true;
        }
    }, { passive: true });

    stage.addEventListener('touchend', function() {
        if (isDragging && Math.abs(dragDeltaX) > 40) {
            if (dragDeltaX > 0) {
                navigateCoverflow(-1);
            } else {
                navigateCoverflow(1);
            }
        }
        dragStartX = 0;
        dragDeltaX = 0;
        setTimeout(function() { isDragging = false; }, 0);
    });

    function handleWheel(e) {
        e.preventDefault();
        if (wheelTimer) return;
        wheelTimer = setTimeout(function() {
            wheelTimer = null;
        }, 20);
        if (e.deltaY > 0) {
            navigateCoverflow(1);
        } else {
            navigateCoverflow(-1);
        }
    }

    stage.addEventListener('wheel', handleWheel, { passive: false });
}

function getCategoryLabel(cat) {
    var map = { web: 'Web', ai: 'AI', tool: '工具', game: '游戏' };
    return map[cat] || cat;
}

function openModal(index) {
    var w = coverflowWorks[index];
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
        '<div style="height: 200px; border-radius: 12px; margin-bottom: 20px; overflow: hidden;">' +
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
    renderGallery();
    initReveal();

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { closeModal(); return; }
        if (e.key === 'ArrowLeft') { navigateCoverflow(-1); return; }
        if (e.key === 'ArrowRight') { navigateCoverflow(1); return; }
    });

});