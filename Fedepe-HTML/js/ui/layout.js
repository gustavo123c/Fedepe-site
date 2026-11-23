/* =====================================================================
   js/ui/layout.js — cabeçalho, rodapé, modal, toast e utilitários de UI.
   Cada página declara <body data-pagina="inicio|campeonatos|..."> e inclui
   <div id="app-header"></div> / <div id="app-footer"></div>.
   ===================================================================== */
(function () {
  'use strict';

  var MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  var UI = {
    esc: function (t) {
      return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    // Cria elemento: UI.el('div', { class: 'x', text: 'y', onclick: fn }, [filhos])
    el: function (tag, attrs, filhos) {
      var e = document.createElement(tag);
      Object.keys(attrs || {}).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else if (v === true) e.setAttribute(k, '');
        else e.setAttribute(k, v);
      });
      (filhos || []).forEach(function (f) { if (f != null) e.appendChild(typeof f === 'string' ? document.createTextNode(f) : f); });
      return e;
    },
    data: function (iso) {
      if (!iso) return 'A definir';
      var d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
      return String(d.getDate()).padStart(2, '0') + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear();
    },
    dataHora: function (iso) {
      if (!iso) return '—';
      var d = new Date(iso);
      return UI.data(iso) + ' às ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    },
    numero: function (n) { return Number(n || 0).toLocaleString('pt-BR'); },
    iniciais: function (nome) {
      return (nome || '?').trim().split(/\s+/).map(function (p) { return p[0]; }).filter(Boolean)
        .filter(function (_, i, a) { return i === 0 || i === a.length - 1; }).join('').toUpperCase();
    },
    tag: function (texto, classe) { return UI.el('span', { class: 'tag ' + (classe || ''), text: texto }); },
    statusCamp: function (c) {
      if (c.status === 'andamento') return { texto: 'Em andamento', classe: 'tag-andamento' };
      if (c.status === 'encerrado') return { texto: 'Encerrado', classe: 'tag-encerrado' };
      if (c.prazoEncerrado) return { texto: 'Inscrições encerradas', classe: 'tag-encerrado' };
      if (c.vagasLivres <= 0) return { texto: 'Vagas esgotadas', classe: 'tag-esgotado' };
      return { texto: 'Inscrições abertas', classe: 'tag-aberta' };
    },
    carregando: function (texto) {
      return UI.el('div', { class: 'carregando', role: 'status' }, [UI.el('span', { class: 'spinner' }), texto || 'Carregando…']);
    },
    vazio: function (titulo, texto) {
      return UI.el('div', { class: 'estado-vazio' }, [UI.el('strong', { text: titulo }), texto ? UI.el('p', { text: texto }) : null]);
    },
    ocupado: function (btn, sim, textoCarregando) {
      if (sim) { btn.dataset.textoOriginal = btn.textContent; btn.textContent = textoCarregando || 'Aguarde…'; btn.disabled = true; btn.classList.add('ocupado'); }
      else { btn.textContent = btn.dataset.textoOriginal || btn.textContent; btn.disabled = false; btn.classList.remove('ocupado'); }
    },
    paginaAtual: function () { return location.pathname.split('/').pop() || 'index.html'; },
    irParaLogin: function (motivo) {
      var atual = UI.paginaAtual() + location.search;
      location.href = 'login.html?voltar=' + encodeURIComponent(atual) + (motivo ? '&motivo=' + encodeURIComponent(motivo) : '');
    },
    // Só aceita voltar para páginas .html do próprio site (evita open redirect)
    destinoPosLogin: function (padrao) {
      var v = new URLSearchParams(location.search).get('voltar') || '';
      return /^[\w-]+\.html(\?[\w=&%.-]*)?$/.test(v) ? v : (padrao || 'index.html');
    }
  };

  // ---------- Toast ----------
  UI.toast = function (msg, tipo) {
    var box = document.getElementById('toasts');
    if (!box) { box = UI.el('div', { id: 'toasts', class: 'toasts', 'aria-live': 'polite' }); document.body.appendChild(box); }
    var t = UI.el('div', { class: 'toast toast-' + (tipo || 'info'), text: msg });
    box.appendChild(t);
    setTimeout(function () { t.classList.add('saindo'); }, 3600);
    setTimeout(function () { t.remove(); }, 4000);
  };

  // ---------- Modal ----------
  UI.modal = function (opts) {
    var anterior = document.activeElement;
    var corpo = UI.el('div', { class: 'modal-corpo' });
    var fechar = function () {
      fundo.remove(); document.removeEventListener('keydown', esc);
      if (!document.querySelector('.modal-fundo')) document.body.classList.remove('sem-rolagem');
      if (anterior && anterior.focus) anterior.focus();
      if (opts.aoFechar) opts.aoFechar();
    };
    var esc = function (e) { if (e.key === 'Escape') fechar(); };
    var caixa = UI.el('div', { class: 'modal ' + (opts.classe || ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.titulo || 'Janela' }, [
      UI.el('div', { class: 'modal-topo' }, [
        UI.el('h2', { text: opts.titulo || '' }),
        UI.el('button', { type: 'button', class: 'modal-fechar', 'aria-label': 'Fechar', text: '✕', onclick: fechar })
      ]),
      corpo
    ]);
    var fundo = UI.el('div', { class: 'modal-fundo', onmousedown: function (e) { if (e.target === fundo) fechar(); } }, [caixa]);
    if (typeof opts.conteudo === 'string') corpo.innerHTML = opts.conteudo;
    else if (opts.conteudo) corpo.appendChild(opts.conteudo);
    document.body.appendChild(fundo);
    document.body.classList.add('sem-rolagem');
    document.addEventListener('keydown', esc);
    setTimeout(function () { var f = caixa.querySelector('input, select, button:not(.modal-fechar)'); (f || caixa.querySelector('.modal-fechar')).focus(); }, 30);
    return { fechar: fechar, corpo: corpo, caixa: caixa };
  };

  UI.confirmar = function (titulo, texto, rotuloOk, classeOk) {
    return new Promise(function (resolve) {
      var resolvido = false;
      var conteudo = UI.el('div', {}, [
        UI.el('p', { class: 'modal-texto', text: texto }),
        UI.el('div', { class: 'modal-acoes' }, [
          UI.el('button', { type: 'button', class: 'btn btn-borda', text: 'Cancelar', onclick: function () { m.fechar(); } }),
          UI.el('button', { type: 'button', class: 'btn ' + (classeOk || 'btn-amarelo'), text: rotuloOk || 'Confirmar', onclick: function () { resolvido = true; m.fechar(); resolve(true); } })
        ])
      ]);
      var m = UI.modal({ titulo: titulo, conteudo: conteudo, classe: 'modal-pequeno', aoFechar: function () { if (!resolvido) resolve(false); } });
    });
  };

  // ---------- Cabeçalho ----------
  var LINKS = [
    { id: 'inicio', href: 'index.html', texto: 'Início' },
    { id: 'campeonatos', href: 'campeonatos.html', texto: 'Campeonatos' },
    { id: 'transmissoes', href: 'transmissoes.html', texto: 'Transmissões' },
    { id: 'ranking', href: 'ranking.html', texto: 'Ranking' }
  ];

  function marca(classe) {
    return UI.el('a', { href: 'index.html', class: 'marca ' + (classe || ''), 'aria-label': 'Copa FEDEPE de Esports — início' }, [
      UI.el('img', { src: 'img/logo-fedepe.png', alt: 'Brasão da FEDEPE', width: '36', height: '36' }),
      UI.el('span', { class: 'marca-texto' }, [UI.el('strong', { text: 'Copa FEDEPE' }), UI.el('small', { text: 'de Esports' })])
    ]);
  }

  function montarHeader() {
    var alvo = document.getElementById('app-header');
    if (!alvo) return;
    var pagina = document.body.dataset.pagina;
    var u = window.Api ? Api.usuarioAtual() : null;

    var nav = UI.el('nav', { id: 'menu-principal', class: 'nav', 'aria-label': 'Navegação principal' });
    LINKS.forEach(function (l) {
      nav.appendChild(UI.el('a', { href: l.href, class: pagina === l.id ? 'ativo' : null, 'aria-current': pagina === l.id ? 'page' : null, text: l.texto }));
    });
    if (u && u.perfil === 'admin') {
      nav.appendChild(UI.el('a', { href: 'admin.html', class: 'nav-admin' + (pagina === 'admin' ? ' ativo' : ''), text: 'Painel ADM' }));
    }
    if (u) {
      if (u.perfil !== 'admin') nav.appendChild(UI.el('a', { href: 'perfil.html', class: pagina === 'perfil' ? 'ativo' : null, text: 'Meu perfil' }));
      nav.appendChild(UI.el('a', { href: u.perfil === 'admin' ? 'admin.html' : 'perfil.html', class: 'nav-avatar', title: u.nome, text: UI.iniciais(u.nome) }));
      nav.appendChild(UI.el('button', { type: 'button', class: 'nav-sair', text: 'Sair', onclick: function () { Api.sair(); UI.toast('Você saiu da sua conta.'); location.href = 'index.html'; } }));
    } else {
      nav.appendChild(UI.el('a', { href: 'login.html', class: 'btn btn-amarelo btn-pequeno', text: 'Entrar' }));
    }

    var toggle = UI.el('button', { type: 'button', class: 'menu-toggle', 'aria-label': 'Abrir menu', 'aria-expanded': 'false', 'aria-controls': 'menu-principal', html: '<span></span><span></span><span></span>' });
    toggle.addEventListener('click', function () {
      var aberto = header.classList.toggle('menu-aberto');
      toggle.setAttribute('aria-expanded', String(aberto));
    });

    var header = UI.el('header', { class: 'topo' }, [marca(), toggle, nav]);
    alvo.replaceWith(header);
    header.id = 'app-header';
  }

  function montarFooter() {
    var alvo = document.getElementById('app-footer');
    if (!alvo) return;
    var reset = UI.el('button', { type: 'button', class: 'btn-reset', text: '↺ Resetar dados demo' });
    reset.addEventListener('click', async function () {
      var ok = await UI.confirmar('Resetar dados demo', 'Todos os cadastros, equipes, inscrições e autorizações feitos neste navegador serão apagados e os dados de demonstração serão restaurados. Deseja continuar?', 'Resetar dados', 'btn-vermelho');
      if (!ok) return;
      UI.ocupado(reset, true, 'Resetando…');
      await Api.resetar();
      sessionStorage.setItem('fedepe_toast', 'Dados de demonstração restaurados.');
      location.href = 'index.html';
    });
    var footer = UI.el('footer', { class: 'rodape', id: 'app-footer' }, [
      UI.el('div', { class: 'rodape-marca' }, [
        UI.el('img', { src: 'img/logo-fedepe.png', alt: 'Brasão da FEDEPE', width: '40', height: '40' }),
        UI.el('div', {}, [UI.el('strong', { text: 'Copa FEDEPE de Esports' }), UI.el('small', { text: 'Pernambuco · Temporada 2026' })])
      ]),
      UI.el('div', { class: 'rodape-links' }, [
        UI.el('small', { text: 'Federação do Desporto Escolar de Pernambuco' }),
        reset
      ])
    ]);
    alvo.replaceWith(footer);
  }

  UI.montarLayout = function () { montarHeader(); montarFooter(); };

  // Inicialização comum a todas as páginas: espera o banco e monta o layout.
  UI.iniciar = async function () {
    await Api.ready();
    UI.montarLayout();
    var pendente = sessionStorage.getItem('fedepe_toast');
    if (pendente) { sessionStorage.removeItem('fedepe_toast'); UI.toast(pendente, 'sucesso'); }
    // Se a sessão mudar em outra aba, atualiza o cabeçalho.
    Api.aoMudar(function (d) { if (d.origem === 'sessao' || d.origem === 'outra-aba') { var h = document.getElementById('app-header'); if (h) { h.replaceWith(UI.el('div', { id: 'app-header' })); montarHeader(); } } });
    return Api.usuarioAtual();
  };

  window.UI = UI;
})();
