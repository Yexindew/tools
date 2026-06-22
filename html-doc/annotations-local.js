// === 批注系统 — 纯本地 localStorage 版（无需内网）===
(function () {
  var STORE_KEY = 'annotations_' + location.pathname;
  var annotations = [];
  var pending = null;
  var selectedTag = '疑问';
  var TAG_COLORS = { '重点': 'rgba(74,222,128,.3)', '疑问': 'rgba(251,191,36,.3)', '待验证': 'rgba(251,146,60,.3)' };
  var TAG_BORDERS = { '重点': '#16a34a', '疑问': '#d97706', '待验证': '#ea580c' };

  function loadAnnotations() {
    try { annotations = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { annotations = []; }
  }
  function saveAnnotations() { localStorage.setItem(STORE_KEY, JSON.stringify(annotations)); }
  function genId() { return Date.now() + '_' + Math.random().toString(36).slice(2, 7); }
  function getAuthor() { return localStorage.getItem('ann_author') || 'me'; }
  function ensureAuthor(cb) {
    var a = localStorage.getItem('ann_author');
    if (a) { cb(a); return; }
    var name = prompt('你的名字（用于批注署名）：');
    if (name && name.trim()) localStorage.setItem('ann_author', name.trim());
    cb(localStorage.getItem('ann_author') || 'me');
  }
  function mkEl(tag) { return document.createElement(tag); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(v, hi)); }
  function esc(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; }

  // CSS 注入
  var style = mkEl('style');
  style.textContent = [
    '.ann-hl{cursor:pointer;border-radius:2px;padding:0 1px;transition:opacity .15s}',
    '.ann-hl:hover{opacity:.75}',
    '#annToolbar{position:fixed;display:none;z-index:99995;background:#1c1c1e;border-radius:10px;padding:5px 4px;box-shadow:0 4px 16px rgba(0,0,0,.35)}',
    '#annToolbar button{background:none;border:none;color:#fff;padding:6px 12px;cursor:pointer;font-size:12px;border-radius:7px;white-space:nowrap}',
    '#annToolbar button:hover{background:rgba(255,255,255,.12)}',
    '#annToolbar .sep{width:1px;background:rgba(255,255,255,.2);margin:4px 2px;align-self:stretch;display:inline-block}',
    '#annBubble{position:fixed;z-index:99994;background:#fff;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.15);padding:14px;width:268px;display:none;font-size:13px;max-height:min(72vh,520px);overflow-y:auto}',
    '#annForm{position:fixed;z-index:99993;background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.18);padding:14px;width:280px;display:none}',
    '#annForm textarea{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:8px;font-size:13px;resize:none;font-family:inherit;box-sizing:border-box;outline:none}',
    '#annForm textarea:focus{border-color:#0D7A5F}',
    '.ann-tag-btn{font-size:11px;padding:3px 9px;border-radius:10px;border:1px solid #e5e7eb;cursor:pointer;background:#fff;color:#374151;transition:all .15s}',
    '.ann-tag-btn.active{background:#0D7A5F;color:#fff;border-color:#0D7A5F}',
    '#annToggle{position:fixed;top:50%;right:0;transform:translateY(-50%);z-index:99989;background:#0D7A5F;color:#fff;border:none;border-radius:8px 0 0 8px;padding:10px 5px;cursor:pointer;font-size:11px;writing-mode:vertical-rl;letter-spacing:1px;transition:background .2s}',
    '#annToggle:hover{background:#065f46}',
    '#annPanel{position:fixed;top:0;right:-380px;width:360px;height:100vh;background:#fff;box-shadow:-4px 0 20px rgba(0,0,0,.12);z-index:99991;transition:right .3s ease;display:flex;flex-direction:column}',
    '.ann-card{padding:6px 10px;margin-bottom:5px;border-radius:8px;border:1px solid #e5e7eb;cursor:pointer;transition:border-color .2s}',
    '.ann-card:hover{border-color:#0D7A5F}',
    '@media(max-width:600px){#annPanel{width:100vw;right:-100vw}#annForm{width:calc(100vw - 32px);left:16px!important}}'
  ].join('\n');
  document.head.appendChild(style);

  // 工具栏
  var toolbar = mkEl('div'); toolbar.id = 'annToolbar';
  toolbar.innerHTML = '<button data-act="comment">&#x1F4AC; 评论</button><span class="sep"></span><button data-act="highlight">&#x1F516; 划线</button>';
  document.body.appendChild(toolbar);
  toolbar.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    hideToolbar();
    if (btn.dataset.act === 'comment') openForm(); else quickHighlight();
  });
  function showToolbar(rect) {
    toolbar.style.display = 'flex';
    var tw = toolbar.offsetWidth || 170;
    toolbar.style.left = clamp(rect.left + rect.width / 2 - tw / 2, 8, window.innerWidth - tw - 8) + 'px';
    var top = rect.top - 44;
    toolbar.style.top = (top < 8 ? rect.bottom + 8 : top) + 'px';
  }
  function hideToolbar() { toolbar.style.display = 'none'; }

  // 评论表单
  var form = mkEl('div'); form.id = 'annForm';
  form.innerHTML =
    '<div id="_annQuote" style="font-size:11px;color:#6b7280;margin-bottom:8px;border-left:3px solid #e5e7eb;padding-left:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></div>' +
    '<textarea id="_annText" rows="3" placeholder="写下你的想法..."></textarea>' +
    '<div style="display:flex;gap:6px;margin:8px 0">' +
    ['重点', '疑问', '待验证'].map(function (t) {
      return '<button class="ann-tag-btn' + (t === '疑问' ? ' active' : '') + '" data-tag="' + t + '">' +
        (t === '重点' ? '&#x1F7E2;' : t === '疑问' ? '&#x1F7E1;' : '&#x1F7E0;') + ' ' + t + '</button>';
    }).join('') +
    '</div>' +
    '<div style="display:flex;justify-content:flex-end;gap:8px">' +
    '<button id="_annCancel" style="padding:6px 14px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;font-size:12px;cursor:pointer">取消</button>' +
    '<button id="_annSubmit" style="padding:6px 14px;border-radius:8px;border:none;background:#0D7A5F;color:#fff;font-size:13px;cursor:pointer;font-weight:500">提交</button>' +
    '</div>';
  document.body.appendChild(form);
  form.addEventListener('click', function (e) {
    var btn = e.target.closest('.ann-tag-btn');
    if (!btn) return;
    form.querySelectorAll('.ann-tag-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active'); selectedTag = btn.dataset.tag;
  });
  form.querySelector('#_annCancel').onclick = closeForm;
  form.querySelector('#_annSubmit').onclick = submitForm;

  function openForm() {
    if (!pending) return;
    form.querySelector('#_annQuote').textContent = '\u300c' + pending.text.substring(0, 55) + (pending.text.length > 55 ? '...' : '') + '\u300d';
    form.querySelector('#_annText').value = '';
    form.style.display = 'block';
    var rect = pending.rect;
    var left = clamp(rect.left, 8, window.innerWidth - 296);
    var top = rect.bottom + 10;
    if (top + 220 > window.innerHeight) top = rect.top - 230;
    form.style.left = left + 'px';
    form.style.top = clamp(top, 8, window.innerHeight - 230) + 'px';
    form.querySelector('#_annText').focus();
  }
  function closeForm() { form.style.display = 'none'; pending = null; }
  function submitForm() {
    var content = form.querySelector('#_annText').value.trim();
    if (!content || !pending) return;
    var snap = pending;
    ensureAuthor(function (author) {
      annotations.push({ id: genId(), anchor_text: snap.text, content: content, author: author, tags: selectedTag, ts: Date.now() });
      saveAnnotations(); closeForm(); renderHighlights(); renderPanel();
    });
  }
  function quickHighlight() {
    if (!pending) return;
    var snap = pending; pending = null;
    ensureAuthor(function (author) {
      annotations.push({ id: genId(), anchor_text: snap.text, content: '划线', author: author, tags: '重点', ts: Date.now() });
      saveAnnotations(); renderHighlights(); renderPanel();
    });
  }

  // 气泡
  var bubble = mkEl('div'); bubble.id = 'annBubble';
  document.body.appendChild(bubble);
  function showBubble(ann, rect) {
    bubble.innerHTML =
      '<div style="font-size:11px;color:#6b7280;background:#f9fafb;padding:4px 8px;border-radius:6px;margin-bottom:8px;border-left:3px solid ' + (TAG_BORDERS[ann.tags] || '#d1d5db') + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap">\u300c' + esc((ann.anchor_text || '').substring(0, 50)) + '\u300d</div>' +
      '<div style="font-size:13px;color:#1a1a1a;margin-bottom:8px;line-height:1.5">' + esc(ann.content) + '</div>' +
      '<div style="font-size:11px;color:#9ca3af;display:flex;justify-content:space-between;align-items:center">' +
      '<span>' + esc(ann.author) + (ann.tags ? ' \u00b7 <span style="background:#f3f4f6;padding:1px 6px;border-radius:6px">' + ann.tags + '</span>' : '') + '</span>' +
      (ann.author === getAuthor() ? '<button id="_annDeleteBtn" style="background:none;border:none;color:#d1d5db;font-size:11px;cursor:pointer;padding:0" title="\u5220\u9664">&#x1F5D1;</button>' : '') +
      '</div>';
    bubble.style.display = 'block';
    var bh = bubble.offsetHeight;
    var left = clamp(rect.left, 8, window.innerWidth - 284);
    var top = rect.bottom + 10;
    if (top + bh > window.innerHeight - 8) top = rect.top - bh - 10;
    bubble.style.left = left + 'px';
    bubble.style.top = clamp(top, 8, window.innerHeight - bh - 8) + 'px';
    var delBtn = bubble.querySelector('#_annDeleteBtn');
    if (delBtn) delBtn.onclick = function () {
      annotations = annotations.filter(function (a) { return a.id !== ann.id; });
      saveAnnotations(); hideBubble(); renderHighlights(); renderPanel();
    };
  }
  function hideBubble() { bubble.style.display = 'none'; }

  // 侧栏
  var toggle = mkEl('button'); toggle.id = 'annToggle'; toggle.textContent = '&#x1F4DD;\u6279\u6CE8';
  document.body.appendChild(toggle);
  var panel = mkEl('div'); panel.id = 'annPanel';
  panel.innerHTML =
    '<div style="padding:14px 16px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">' +
    '<h3 style="margin:0;font-size:15px;font-weight:600">&#x1F4DD; \u6279\u6CE8 (<span id="_annCount">0</span>)</h3>' +
    '<button id="_annClose" style="background:none;border:none;font-size:20px;cursor:pointer;color:#6b7280;line-height:1">\u2715</button>' +
    '</div><div id="_annList" style="flex:1;overflow-y:auto;padding:14px"></div>';
  document.body.appendChild(panel);
  toggle.onclick = function () { panel.style.right = panel.style.right === '0px' ? '-380px' : '0px'; };
  panel.querySelector('#_annClose').onclick = function () { panel.style.right = '-380px'; };

  // 划词检测
  document.addEventListener('mouseup', function (e) {
    if (e.target.closest('#annToolbar,#annForm,#annToggle,#annPanel,#annBubble,#sidebar,.sidebar')) return;
    setTimeout(function () {
      var sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      var text = sel.toString().trim();
      if (text.length < 2 || text.length > 500) { hideToolbar(); return; }
      var range = sel.getRangeAt(0);
      var rect = range.getBoundingClientRect();
      pending = { text: text, rect: rect };
      showToolbar(rect);
    }, 50);
  });
  document.addEventListener('mousedown', function (e) {
    if (!e.target.closest('#annToolbar,#annForm,#annBubble')) { hideToolbar(); hideBubble(); }
  });

  function renderHighlights() {
    document.querySelectorAll('.ann-hl').forEach(function (el) {
      el.parentNode.replaceChild(document.createTextNode(el.textContent), el);
    });
    annotations.forEach(function (a) { if (!a.anchor_text) return; try { highlightOne(a); } catch (e) {} });
  }
  function highlightOne(a) {
    var color = TAG_COLORS[a.tags] || 'rgba(251,191,36,.25)';
    var border = TAG_BORDERS[a.tags] || '#d97706';
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return n.parentElement.closest('#annToolbar,#annForm,#annToggle,#annPanel,#annBubble,#sidebar,.sidebar')
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      var idx = node.textContent.indexOf(a.anchor_text);
      if (idx >= 0) {
        var range = document.createRange();
        range.setStart(node, idx); range.setEnd(node, idx + a.anchor_text.length);
        var mark = document.createElement('mark');
        mark.className = 'ann-hl'; mark.dataset.id = a.id;
        mark.style.cssText = 'background:' + color + ';border-bottom:2px solid ' + border + ';padding:0 1px';
        mark.addEventListener('click', function (e) {
          e.stopPropagation();
          var id = this.dataset.id;
          var ann = annotations.find(function (x) { return x.id === id; });
          if (ann) showBubble(ann, this.getBoundingClientRect());
        });
        range.surroundContents(mark); return;
      }
    }
  }
  function renderPanel() {
    var list = panel.querySelector('#_annList');
    var count = panel.querySelector('#_annCount');
    count.textContent = annotations.length;
    toggle.textContent = '\u📝\u6279\u6CE8' + (annotations.length > 0 ? '(' + annotations.length + ')' : '');
    if (annotations.length === 0) {
      list.innerHTML = '<p style="color:#9ca3af;text-align:center;margin-top:40px">\u6682\u65E0\u6279\u6CE8<br><small>\u9009\u4E2D\u6587\u5B57\u5373\u53EF\u6DFB\u52A0</small></p>';
      return;
    }
    list.innerHTML = annotations.map(function (a, idx) {
      var border = TAG_BORDERS[a.tags] || '#e5e7eb';
      return '<div class="ann-card" data-sid="' + a.id + '" style="border-left:3px solid ' + border + '">' +
        '<div style="display:flex;align-items:flex-start;gap:5px;margin-bottom:3px">' +
        '<span style="font-size:10px;font-weight:600;color:#fff;background:#9ca3af;border-radius:4px;padding:1px 5px;flex-shrink:0">#' + (idx + 1) + '</span>' +
        (a.anchor_text ? '<div style="font-size:11px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">\u300c' + esc(a.anchor_text.substring(0, 50)) + '\u300d</div>' : '') +
        '</div>' +
        '<div style="font-size:12px;color:#1a1a1a;margin-bottom:3px;line-height:1.55">' + esc(a.content) + '</div>' +
        '<div style="font-size:10px;color:#9ca3af">' + esc(a.author) + (a.tags ? ' \u00b7 <span style="background:#f3f4f6;padding:1px 5px;border-radius:5px">' + esc(a.tags) + '</span>' : '') + '</div>' +
        '</div>';
    }).join('');
    list.querySelectorAll('.ann-card').forEach(function (card) {
      card.onclick = function () {
        var id = this.dataset.sid;
        var hl = document.querySelector('.ann-hl[data-id="' + id + '"]');
        if (hl) { hl.scrollIntoView({ behavior: 'smooth', block: 'center' }); hl.style.outline = '2px solid #0D7A5F'; setTimeout(function () { hl.style.outline = ''; }, 1500); }
      };
    });
  }

  loadAnnotations();
  renderHighlights();
  renderPanel();
})();
