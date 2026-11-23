/* =====================================================================
   js/ui/parental-auth.js — ParentalAuthorizationModal
   Componente reutilizável da Autorização dos Pais/Responsáveis.
     ParentalAuth.montar(container, { aoAtualizar(aut), permitirDepois, aoDepois })
     ParentalAuth.abrir({ aoAutorizar(aut) })   -> abre em modal
     ParentalAuth.comprovante(aut)              -> nó com o comprovante (usado no ADM)
     ParentalAuth.previaEmail(aut, nomeAluno, aoAutorizar) -> abre a prévia do e-mail
   Métodos: assinatura digital na tela (<canvas>, mouse + toque) ou e-mail ao responsável.
   ===================================================================== */
(function () {
  'use strict';
  var el = function () { return UI.el.apply(UI, arguments); };

  var TERMO = [
    'Eu, responsável legal pelo(a) estudante identificado(a) neste cadastro, AUTORIZO sua participação na Copa FEDEPE de Esports — Temporada 2026, promovida pela Federação do Desporto Escolar de Pernambuco.',
    'Declaro estar ciente de que: (1) as partidas ocorrem on-line e/ou em eventos presenciais em Pernambuco; (2) o(a) estudante deverá seguir o regulamento, o código de conduta e as regras de cada modalidade; (3) partidas podem ser transmitidas ao vivo, com exibição do nickname, nome da escola e imagem do(a) estudante durante o evento; (4) os dados informados serão tratados conforme a LGPD (Lei nº 13.709/2018), exclusivamente para fins de organização da competição.',
    'Esta autorização pode ser revogada a qualquer momento junto à coordenação da FEDEPE.'
  ];

  // ---------- Máscaras ----------
  function mascaraCPF(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  function mascaraTel(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 2) return v.length ? '(' + v : v;
    if (v.length <= 6) return '(' + v.slice(0, 2) + ') ' + v.slice(2);
    if (v.length <= 10) return '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
    return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
  }
  function cpfMascarado(cpf) { var d = (cpf || '').replace(/\D/g, ''); return d.length === 11 ? '•••.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-••' : '—'; }

  // ---------- Quadro de assinatura ----------
  function quadroAssinatura() {
    var canvas = el('canvas', { class: 'assinatura-canvas', 'aria-label': 'Quadro de assinatura. Desenhe com o mouse ou com o dedo.' });
    var dica = el('span', { class: 'assinatura-dica', text: 'Assine aqui com o mouse ou o dedo' });
    var wrap = el('div', { class: 'assinatura-wrap' }, [canvas, dica, el('span', { class: 'assinatura-linha' })]);
    var ctx = canvas.getContext('2d');
    var desenhando = false, temTinta = false, ultimo = null;

    function ajustar() {
      var r = wrap.getBoundingClientRect();
      if (!r.width) return;
      var dpr = Math.max(1, window.devicePixelRatio || 1);
      var copia = temTinta ? canvas.toDataURL() : null;
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(180 * dpr);
      canvas.style.height = '180px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, r.width, 180);
      ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0b1450';
      if (copia) { var img = new Image(); img.onload = function () { ctx.drawImage(img, 0, 0, r.width, 180); }; img.src = copia; }
    }
    function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault(); desenhando = true; ultimo = pos(e);
      try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
      ctx.beginPath(); ctx.arc(ultimo.x, ultimo.y, 1.2, 0, Math.PI * 2); ctx.fillStyle = '#0b1450'; ctx.fill();
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!desenhando) return;
      e.preventDefault();
      var pts = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      pts.forEach(function (pe) {
        var p = pos(pe);
        ctx.beginPath(); ctx.moveTo(ultimo.x, ultimo.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        ultimo = p;
      });
      if (!temTinta) { temTinta = true; wrap.classList.add('com-tinta'); }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { canvas.addEventListener(ev, function () { desenhando = false; }); });

    var ro = window.ResizeObserver ? new ResizeObserver(function () { ajustar(); }) : null;
    if (ro) ro.observe(wrap); else setTimeout(ajustar, 50);

    return {
      no: wrap,
      limpar: function () { temTinta = false; wrap.classList.remove('com-tinta'); ajustar(); },
      vazio: function () { return !temTinta; },
      // Exporta em PNG reduzido para não pesar no localStorage
      exportar: function () {
        var out = document.createElement('canvas');
        var w = canvas.width / (window.devicePixelRatio || 1);
        out.width = Math.min(600, Math.round(w)); out.height = Math.round(out.width * 180 / w);
        var o = out.getContext('2d'); o.fillStyle = '#fff'; o.fillRect(0, 0, out.width, out.height);
        o.drawImage(canvas, 0, 0, out.width, out.height);
        return out.toDataURL('image/png');
      },
      ajustar: ajustar
    };
  }

  // ---------- Comprovante ----------
  function comprovante(aut) {
    var r = aut.responsavel || {};
    var linhas = [
      ['Status', aut.info.rotulo],
      ['Método', aut.metodo === 'assinatura' ? 'Assinatura digital na tela' : aut.metodo === 'email' ? 'Confirmação por e-mail' : '—'],
      ['Responsável', r.nome || '—'],
      ['CPF', cpfMascarado(r.cpf)],
      ['Parentesco', r.parentesco || '—'],
      ['WhatsApp', r.whatsapp || '—'],
      ['E-mail', r.email || '—'],
      [aut.metodo === 'assinatura' ? 'Assinado em' : 'Confirmado em', UI.dataHora(aut.assinadoEm || aut.confirmadoEm)]
    ];
    var box = el('div', { class: 'comprovante' }, [
      el('div', { class: 'comprovante-topo' }, [
        el('img', { src: 'img/logo-fedepe.png', alt: '', width: '34', height: '34' }),
        el('div', {}, [el('strong', { text: 'Comprovante de Autorização' }), el('small', { text: 'Copa FEDEPE de Esports · Temporada 2026' })]),
        el('span', { class: 'selo-ok', text: '✓' })
      ]),
      el('dl', { class: 'comprovante-dados' }, linhas.reduce(function (acc, l) { return acc.concat([el('dt', { text: l[0] }), el('dd', { text: l[1] })]); }, []))
    ]);
    if (aut.assinatura) {
      box.appendChild(el('div', { class: 'comprovante-assinatura' }, [
        el('small', { text: 'Assinatura do responsável' }),
        el('img', { src: aut.assinatura, alt: 'Assinatura digital de ' + (r.nome || 'responsável') })
      ]));
    }
    if (aut.log && aut.log.length) {
      var ul = el('ul', { class: 'log-lista' });
      aut.log.forEach(function (l) { ul.appendChild(el('li', {}, [el('time', { text: UI.dataHora(l.data) }), el('span', { text: l.evento })])); });
      box.appendChild(el('div', { class: 'comprovante-log' }, [el('small', { text: 'Registro de eventos' }), ul]));
    }
    if (aut.token) box.appendChild(el('small', { class: 'comprovante-codigo', text: 'Código de verificação: ' + aut.token.toUpperCase() }));
    return box;
  }

  // ---------- Prévia do e-mail institucional ----------
  function previaEmail(aut, aluno, aoAutorizar) {
    var r = aut.responsavel || {};
    var btn = el('button', { type: 'button', class: 'email-cta', text: 'Autorizar Participação do Estudante' });
    var conteudo = el('div', { class: 'email-previa' }, [
      el('div', { class: 'email-cabecalho' }, [
        el('div', {}, [el('small', { text: 'De:' }), el('span', { text: 'Copa FEDEPE de Esports <autorizacoes@copafedepe.demo>' })]),
        el('div', {}, [el('small', { text: 'Para:' }), el('span', { text: (r.nome || '') + ' <' + (r.email || '') + '>' })]),
        el('div', {}, [el('small', { text: 'Assunto:' }), el('strong', { text: 'Autorização de participação — ' + aluno.nome })])
      ]),
      el('div', { class: 'email-corpo' }, [
        el('div', { class: 'email-faixa' }, [el('img', { src: 'img/logo-fedepe.png', alt: '', width: '44', height: '44' }), el('div', {}, [el('strong', { text: 'Copa FEDEPE de Esports' }), el('small', { text: 'Federação do Desporto Escolar de Pernambuco' })])]),
        el('p', { text: 'Olá, ' + (r.nome || 'responsável').split(' ')[0] + '.' }),
        el('p', {}, ['O(a) estudante ', el('strong', { text: aluno.nome }), ' (' + aluno.nickname + ' · ' + aluno.escola + ') solicitou inscrição na Copa FEDEPE de Esports — Temporada 2026 e indicou você como ' + (r.parentesco || 'responsável').toLowerCase() + '.']),
        el('p', { text: 'Por se tratar de menor de 18 anos, precisamos da sua autorização. Leia o resumo do termo abaixo e, se estiver de acordo, clique no botão.' }),
        el('blockquote', { text: TERMO[0] }),
        btn,
        el('small', { class: 'email-rodape', text: 'Se você não reconhece esta solicitação, ignore este e-mail. Código: ' + (aut.token || '').toUpperCase() })
      ]),
      el('p', { class: 'aviso-simulacao', text: 'Prévia demonstrativa — nenhum e-mail real foi enviado.' })
    ]);
    var m = UI.modal({ titulo: 'Caixa de entrada do responsável (simulação)', conteudo: conteudo, classe: 'modal-email' });
    btn.addEventListener('click', async function () {
      UI.ocupado(btn, true, 'Registrando autorização…');
      var res = await Api.confirmarAutorizacaoEmail(null, aut.token);
      if (!res.ok) { UI.ocupado(btn, false); UI.toast(res.erro, 'erro'); return; }
      btn.textContent = '✓ Participação autorizada'; btn.classList.add('confirmado');
      UI.toast('Autorização confirmada pelo responsável via e-mail.', 'sucesso');
      setTimeout(function () { m.fechar(); if (aoAutorizar) aoAutorizar(res.autorizacao); }, 900);
    });
    return m;
  }

  // ---------- Componente principal ----------
  function montar(container, opts) {
    opts = opts || {};
    var estado = { metodo: 'assinatura', resp: { nome: '', cpf: '', parentesco: '', whatsapp: '', email: '' }, aceite: false };
    var usuario = Api.usuarioAtual();

    async function render() {
      container.innerHTML = '';
      container.appendChild(UI.carregando('Carregando autorização…'));
      var res = await Api.obterAutorizacao();
      container.innerHTML = '';
      if (!res.ok) { container.appendChild(UI.vazio('Não foi possível carregar', res.erro)); return; }
      var aut = res.autorizacao;
      if (opts.aoAtualizar) opts.aoAtualizar(aut);
      if (aut.responsavel && !estado.resp.nome) estado.resp = Object.assign({}, aut.responsavel);

      var topo = el('div', { class: 'pa-topo' }, [
        el('div', {}, [el('h3', { text: 'Autorização dos Pais/Responsáveis' }), el('small', { text: 'Obrigatória para estudantes menores de 18 anos' })]),
        UI.tag(aut.info.rotulo, aut.info.classe)
      ]);
      container.appendChild(topo);

      if (aut.status === 'nao_necessaria') {
        container.appendChild(el('p', { class: 'pa-info', text: 'Você tem 18 anos ou mais, portanto não precisa de autorização dos responsáveis para participar.' }));
        return;
      }
      if (aut.info.autorizado) {
        container.appendChild(el('p', { class: 'pa-sucesso', text: 'Tudo certo! A participação foi autorizada. Guarde o comprovante abaixo.' }));
        container.appendChild(comprovante(aut));
        return;
      }
      if (aut.status === 'aguardando_email') { container.appendChild(telaAguardando(aut)); return; }
      container.appendChild(formulario());
    }

    function telaAguardando(aut) {
      var simular = el('button', { type: 'button', class: 'btn btn-amarelo', text: '✉ Simular aprovação no e-mail do responsável' });
      simular.addEventListener('click', function () {
        previaEmail(aut, usuario, function (nova) { render(); if (opts.aoAutorizar) opts.aoAutorizar(nova); });
      });
      var reenviar = el('button', { type: 'button', class: 'btn btn-borda btn-pequeno', text: 'Reenviar e-mail' });
      reenviar.addEventListener('click', async function () {
        UI.ocupado(reenviar, true, 'Reenviando…');
        var r = await Api.enviarAutorizacaoEmail({ responsavel: aut.responsavel });
        UI.ocupado(reenviar, false);
        UI.toast(r.ok ? 'E-mail reenviado para ' + aut.responsavel.email + '.' : r.erro, r.ok ? 'sucesso' : 'erro');
        if (r.ok) render();
      });
      var trocar = el('button', { type: 'button', class: 'btn btn-borda btn-pequeno', text: 'Trocar para assinatura digital' });
      trocar.addEventListener('click', async function () {
        UI.ocupado(trocar, true);
        var r = await Api.reiniciarAutorizacao();
        if (!r.ok) { UI.ocupado(trocar, false); UI.toast(r.erro, 'erro'); return; }
        estado.metodo = 'assinatura'; render();
      });
      return el('div', { class: 'pa-aguardando' }, [
        el('div', { class: 'pa-envelope', text: '✉' }),
        el('p', {}, ['Enviamos o pedido de autorização para ', el('strong', { text: aut.responsavel.email }), ' em ' + UI.dataHora(aut.emailEnviadoEm) + '. Assim que o responsável clicar em ', el('em', { text: '“Autorizar Participação do Estudante”' }), ', o status muda automaticamente aqui e no Painel ADM.']),
        el('div', { class: 'pa-acoes' }, [simular]),
        el('div', { class: 'pa-acoes secundarias' }, [reenviar, trocar])
      ]);
    }

    function formulario() {
      var msg = el('p', { class: 'auth-msg', role: 'alert', hidden: true });
      var mostrarErro = function (t) { msg.textContent = t; msg.hidden = false; msg.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };

      function campo(rotulo, input) { return el('label', { class: 'campo' }, [el('span', { text: rotulo }), input]); }
      var iNome = el('input', { type: 'text', autocomplete: 'off', placeholder: 'Nome completo do responsável', value: estado.resp.nome });
      var iCpf = el('input', { type: 'text', inputmode: 'numeric', placeholder: '000.000.000-00', value: estado.resp.cpf, maxlength: '14' });
      var iPar = el('select', {}, [el('option', { value: '', text: 'Selecione…' })].concat(Api.PARENTESCOS.map(function (p) { return el('option', { value: p, text: p, selected: estado.resp.parentesco === p }); })));
      var iWpp = el('input', { type: 'tel', inputmode: 'numeric', placeholder: '(81) 90000-0000', value: estado.resp.whatsapp, maxlength: '15' });
      var iEmail = el('input', { type: 'email', placeholder: 'email@responsavel.com', value: estado.resp.email });
      iCpf.addEventListener('input', function () { iCpf.value = mascaraCPF(iCpf.value); });
      iWpp.addEventListener('input', function () { iWpp.value = mascaraTel(iWpp.value); });
      var sync = function () { estado.resp = { nome: iNome.value, cpf: iCpf.value, parentesco: iPar.value, whatsapp: iWpp.value, email: iEmail.value.trim() }; };
      [iNome, iCpf, iPar, iWpp, iEmail].forEach(function (i) { i.addEventListener('input', sync); i.addEventListener('change', sync); });

      var aceite = el('input', { type: 'checkbox', checked: estado.aceite });
      aceite.addEventListener('change', function () { estado.aceite = aceite.checked; });

      var termo = el('details', { class: 'pa-termo', open: true }, [
        el('summary', { text: 'Termo de Autorização de Participação — resumo' }),
        el('div', {}, TERMO.map(function (t) { return el('p', { text: t }); }))
      ]);

      // Escolha do método
      var opcoes = el('div', { class: 'pa-metodos', role: 'radiogroup', 'aria-label': 'Método de autorização' });
      var area = el('div', { class: 'pa-area' });
      [['assinatura', '✍', 'Assinatura digital na tela', 'O responsável assina agora, neste dispositivo.'],
       ['email', '✉', 'Autorização por e-mail', 'Enviamos um link de confirmação ao responsável.']].forEach(function (m) {
        var b = el('button', { type: 'button', role: 'radio', class: 'pa-metodo' + (estado.metodo === m[0] ? ' ativo' : ''), 'aria-checked': String(estado.metodo === m[0]) }, [
          el('span', { class: 'pa-metodo-icone', text: m[1] }), el('span', {}, [el('strong', { text: m[2] }), el('small', { text: m[3] })])
        ]);
        b.addEventListener('click', function () {
          estado.metodo = m[0];
          opcoes.querySelectorAll('.pa-metodo').forEach(function (x) { x.classList.toggle('ativo', x === b); x.setAttribute('aria-checked', String(x === b)); });
          renderArea();
        });
        opcoes.appendChild(b);
      });

      function validarLocal() {
        sync();
        if (estado.resp.nome.trim().split(/\s+/).length < 2) return 'Informe o nome completo do responsável.';
        if (!Api.cpfValido(estado.resp.cpf)) return 'CPF do responsável inválido.';
        if (!estado.resp.parentesco) return 'Selecione o grau de parentesco.';
        var w = estado.resp.whatsapp.replace(/\D/g, ''); if (w.length < 10) return 'Informe um WhatsApp válido com DDD.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(estado.resp.email)) return 'E-mail do responsável inválido.';
        if (!estado.aceite) return 'O responsável precisa declarar que leu e concorda com o termo.';
        return null;
      }

      function renderArea() {
        area.innerHTML = '';
        if (estado.metodo === 'assinatura') {
          var quadro = quadroAssinatura();
          var limpar = el('button', { type: 'button', class: 'btn btn-borda btn-pequeno', text: 'Limpar' });
          var confirmar = el('button', { type: 'button', class: 'btn btn-amarelo', text: 'Confirmar Assinatura' });
          limpar.addEventListener('click', function () { quadro.limpar(); });
          confirmar.addEventListener('click', async function () {
            msg.hidden = true;
            var e = validarLocal(); if (e) return mostrarErro(e);
            if (quadro.vazio()) return mostrarErro('Faça a assinatura no quadro antes de confirmar.');
            UI.ocupado(confirmar, true, 'Salvando assinatura…');
            var r = await Api.assinarAutorizacao({ responsavel: estado.resp, aceite: estado.aceite, assinatura: quadro.exportar() });
            if (!r.ok) { UI.ocupado(confirmar, false); return mostrarErro(r.erro); }
            UI.toast('Autorização registrada com assinatura digital.', 'sucesso');
            await render();
            if (opts.aoAutorizar) opts.aoAutorizar(r.autorizacao);
          });
          area.appendChild(el('div', { class: 'pa-assinatura' }, [quadro.no, el('div', { class: 'pa-acoes' }, [limpar, confirmar])]));
          setTimeout(quadro.ajustar, 30);
        } else {
          var enviar = el('button', { type: 'button', class: 'btn btn-amarelo', text: 'Enviar autorização por e-mail' });
          enviar.addEventListener('click', async function () {
            msg.hidden = true;
            var e = validarLocal(); if (e) return mostrarErro(e);
            UI.ocupado(enviar, true, 'Enviando e-mail…');
            var r = await Api.enviarAutorizacaoEmail({ responsavel: estado.resp });
            if (!r.ok) { UI.ocupado(enviar, false); return mostrarErro(r.erro); }
            UI.toast('E-mail enviado para ' + r.autorizacao.responsavel.email + ' (simulação).', 'sucesso');
            render();
          });
          area.appendChild(el('div', { class: 'pa-email' }, [
            el('p', { text: 'Ao enviar, o responsável recebe um e-mail institucional com o termo e o botão “Autorizar Participação do Estudante”. O status ficará como “Aguardando confirmação por e-mail” até o clique.' }),
            el('div', { class: 'pa-acoes' }, [enviar])
          ]));
        }
      }
      renderArea();

      var depois = null;
      if (opts.permitirDepois) {
        depois = el('button', { type: 'button', class: 'btn-link', text: 'Fazer isso depois' });
        depois.addEventListener('click', function () { if (opts.aoDepois) opts.aoDepois(); });
      }

      return el('div', { class: 'pa-form' }, [
        termo, msg,
        el('div', { class: 'pa-grade' }, [
          el('div', { class: 'pa-col-2' }, [campo('Nome completo do responsável *', iNome)]),
          campo('CPF *', iCpf), campo('Grau de parentesco *', iPar),
          campo('WhatsApp *', iWpp), campo('E-mail *', iEmail)
        ]),
        el('label', { class: 'check' }, [aceite, ' Declaro ser o responsável legal e concordo com o Termo de Autorização.']),
        el('h4', { class: 'pa-subtitulo', text: 'Como o responsável vai autorizar?' }),
        opcoes, area, depois
      ]);
    }

    render();
    return { atualizar: render };
  }

  function abrir(opts) {
    opts = opts || {};
    var box = el('div', { class: 'pa' });
    var m = UI.modal({ titulo: 'Autorização dos Pais/Responsáveis', conteudo: box, classe: 'modal-largo' });
    montar(box, {
      aoAutorizar: function (aut) {
        if (!aut.info.autorizado) return;
        setTimeout(function () { if (opts.fecharAoAutorizar !== false) m.fechar(); if (opts.aoAutorizar) opts.aoAutorizar(aut); }, opts.fecharAoAutorizar === false ? 0 : 1200);
      }
    });
    return m;
  }

  window.ParentalAuth = { montar: montar, abrir: abrir, comprovante: comprovante, previaEmail: previaEmail, cpfMascarado: cpfMascarado };
})();
