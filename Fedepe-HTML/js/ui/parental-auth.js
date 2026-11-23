/* =====================================================================
   js/ui/parental-auth.js — Autorizações obrigatórias (2 etapas)
     tipo 'pais'   → Autorização dos Pais/Responsáveis (menores de 18 anos)
     tipo 'escola' → Autorização da Escola (vínculo institucional, todos os alunos)

   API (window.ParentalAuth, também exposto como window.Autorizacoes):
     montar(container, { tipo, aoAtualizar(aut), aoAutorizar(aut), permitirDepois, aoDepois, textoDepois })
     abrir({ tipo, aoAutorizar(aut) })                  -> abre em modal
     comprovante(aut)                                   -> nó do comprovante (ADM e perfil)
     previaEmail(aut, aluno, aoAutorizar)               -> prévia do e-mail simulado
   Cada tipo valida por assinatura na tela (<canvas>, mouse + toque) ou por e-mail simulado.
   ===================================================================== */
(function () {
  'use strict';
  var el = function () { return UI.el.apply(UI, arguments); };

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

  // ---------- Configuração de cada tipo ----------
  var TIPOS = {
    pais: {
      titulo: 'Autorização dos Pais/Responsáveis',
      etapa: 'Etapa 1 de 2',
      subtitulo: 'Obrigatória para estudantes menores de 18 anos',
      resumoTermo: 'Termo de Autorização de Participação — resumo',
      termo: [
        'Eu, responsável legal pelo(a) estudante identificado(a) neste cadastro, AUTORIZO sua participação na Copa FEDEPE de Egames — Temporada 2026, promovida pela Federação do Desporto Escolar de Pernambuco.',
        'Declaro estar ciente de que: (1) as partidas ocorrem on-line e/ou em eventos presenciais em Pernambuco; (2) o(a) estudante deverá seguir o regulamento, o código de conduta e as regras de cada modalidade; (3) partidas podem ser transmitidas ao vivo, com exibição do nickname, nome da escola e imagem do(a) estudante durante o evento; (4) os dados informados serão tratados conforme a LGPD (Lei nº 13.709/2018), exclusivamente para fins de organização da competição.',
        'Esta autorização pode ser revogada a qualquer momento junto à coordenação da FEDEPE.'
      ],
      campos: [
        { id: 'nome', rotulo: 'Nome completo do responsável *', placeholder: 'Nome completo do responsável', largo: true },
        { id: 'cpf', rotulo: 'CPF *', placeholder: '000.000.000-00', mascara: mascaraCPF, max: 14, modo: 'numeric' },
        { id: 'parentesco', rotulo: 'Grau de parentesco *', opcoes: function () { return Api.PARENTESCOS; } },
        { id: 'email', rotulo: 'E-mail *', placeholder: 'email@responsavel.com', tipo: 'email' },
        { id: 'whatsapp', rotulo: 'WhatsApp (opcional)', placeholder: '(81) 90000-0000', mascara: mascaraTel, max: 15, tipo: 'tel', modo: 'numeric' }
      ],
      aceite: ' Declaro ser o responsável legal e concordo com o Termo de Autorização.',
      pergunta: 'Como o responsável vai autorizar?',
      metodoAssinatura: ['Assinatura digital na tela', 'O responsável assina agora, neste dispositivo.'],
      metodoEmail: ['Aprovação por e-mail', 'Enviamos um link de autorização ao responsável.'],
      textoEmail: 'Ao enviar, o responsável recebe um e-mail institucional com o termo e o botão “Autorizar Participação”. O status ficará como “Aguardando confirmação por e-mail” até o clique.',
      botaoEnviar: 'Enviar autorização por e-mail',
      dica: 'Assine aqui com o mouse ou o dedo',
      simular: '✉ Simular aprovação no e-mail do responsável',
      cta: 'Autorizar Participação',
      ctaOk: '✓ Participação autorizada',
      caixa: 'Caixa de entrada do responsável (simulação)',
      sucesso: 'Tudo certo! A participação foi autorizada pelo responsável.',
      tituloComprovante: 'Comprovante de Autorização dos Pais/Responsáveis',
      quem: 'Responsável',
      rotuloAssinatura: 'Assinatura do responsável'
    },
    escola: {
      titulo: 'Autorização da Escola',
      etapa: 'Etapa 2 de 2',
      subtitulo: 'Vínculo institucional — obrigatória para todos os alunos',
      resumoTermo: 'Declaração de Vínculo Escolar — resumo',
      termo: [
        'A instituição de ensino abaixo DECLARA que o(a) estudante identificado(a) neste cadastro está regularmente matriculado(a) e AUTORIZA sua participação na Copa FEDEPE de Egames — Temporada 2026, representando a escola.',
        'A escola indica um(a) diretor(a) ou coordenador(a) esportivo(a) como contato oficial com a FEDEPE para assuntos de conduta, frequência e participação do(a) estudante na competição.',
        'Esta declaração pode ser revogada pela escola a qualquer momento junto à coordenação da FEDEPE.'
      ],
      campos: [
        { id: 'escola', rotulo: 'Nome da escola *', placeholder: 'Nome da instituição de ensino', largo: true, lista: true },
        { id: 'nome', rotulo: 'Diretor(a) / Coordenador(a) esportivo(a) *', placeholder: 'Nome completo', largo: true },
        { id: 'email', rotulo: 'E-mail institucional *', placeholder: 'esportes@escola.edu.br', tipo: 'email' },
        { id: 'ra', rotulo: 'Matrícula/RA do aluno *', placeholder: 'RA ou matrícula' }
      ],
      aceite: ' Declaro, como responsável escolar, que o(a) aluno(a) está matriculado(a) e autorizo sua participação.',
      pergunta: 'Como a escola vai confirmar o vínculo?',
      metodoAssinatura: ['Assinatura do responsável escolar', 'O diretor/coordenador assina agora, na tela.'],
      metodoEmail: ['Confirmação por e-mail da escola', 'Enviamos um link ao e-mail institucional.'],
      textoEmail: 'Ao enviar, a escola recebe um e-mail institucional com a declaração e o botão “Confirmar Vínculo Escolar”. O status ficará como “Aguardando confirmação da escola” até o clique.',
      botaoEnviar: 'Enviar confirmação para a escola',
      dica: 'Assinatura do diretor/coordenador',
      simular: '✉ Simular aprovação no e-mail da escola',
      cta: 'Confirmar Vínculo Escolar do Estudante',
      ctaOk: '✓ Vínculo escolar confirmado',
      caixa: 'Caixa de entrada da escola (simulação)',
      sucesso: 'Tudo certo! A escola confirmou o vínculo do aluno.',
      tituloComprovante: 'Comprovante de Vínculo Escolar',
      quem: 'Responsável escolar',
      rotuloAssinatura: 'Assinatura do responsável escolar'
    }
  };
  function cfg(tipo) { return TIPOS[tipo] || TIPOS.pais; }

  // ---------- Quadro de assinatura ----------
  function quadroAssinatura(dicaTexto) {
    var canvas = el('canvas', { class: 'assinatura-canvas', 'aria-label': 'Quadro de assinatura. Desenhe com o mouse ou com o dedo.' });
    var dica = el('span', { class: 'assinatura-dica', text: dicaTexto || 'Assine aqui com o mouse ou o dedo' });
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
    var c = cfg(aut.tipo), r = aut.responsavel || {};
    var linhas = [
      ['Status', aut.info.rotulo],
      ['Método', aut.metodo === 'assinatura' ? 'Assinatura digital na tela' : aut.metodo === 'email' ? 'Confirmação por e-mail' : '—']
    ];
    if (aut.tipo === 'escola') {
      linhas.push(['Escola', r.escola || '—'], [c.quem, r.nome || '—'], ['E-mail institucional', r.email || '—'], ['Matrícula/RA', r.ra || '—']);
    } else {
      linhas.push([c.quem, r.nome || '—'], ['CPF', cpfMascarado(r.cpf)], ['Parentesco', r.parentesco || '—'], ['E-mail', r.email || '—']);
      if (r.whatsapp) linhas.push(['WhatsApp', r.whatsapp]);
    }
    linhas.push([aut.metodo === 'assinatura' ? 'Assinado em' : 'Confirmado em', UI.dataHora(aut.assinadoEm || aut.confirmadoEm)]);
    var ok = aut.info.autorizado;
    var box = el('div', { class: 'comprovante' }, [
      el('div', { class: 'comprovante-topo' }, [
        el('img', { src: 'img/logo-fedepe.png', alt: '', width: '34', height: '34' }),
        el('div', {}, [el('strong', { text: c.tituloComprovante }), el('small', { text: 'Copa FEDEPE de Egames · Temporada 2026' })]),
        el('span', { class: 'selo-ok' + (ok ? '' : ' pendente'), text: ok ? '✓' : '…' })
      ]),
      el('dl', { class: 'comprovante-dados' }, linhas.reduce(function (acc, l) { return acc.concat([el('dt', { text: l[0] }), el('dd', { text: l[1] })]); }, []))
    ]);
    if (aut.assinatura) {
      box.appendChild(el('div', { class: 'comprovante-assinatura' }, [
        el('small', { text: c.rotuloAssinatura }),
        el('img', { src: aut.assinatura, alt: 'Assinatura digital de ' + (r.nome || c.quem) })
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
    var tipo = aut.tipo || 'pais', c = cfg(tipo), r = aut.responsavel || {};
    var btn = el('button', { type: 'button', class: 'email-cta', text: c.cta });
    var corpo = tipo === 'escola' ? [
      el('p', { text: 'Prezado(a) ' + (r.nome || 'responsável escolar') + ',' }),
      el('p', {}, ['O(a) estudante ', el('strong', { text: aluno.nome }), ' (' + aluno.nickname + ', RA ' + (r.ra || aluno.ra) + ') se cadastrou na Copa FEDEPE de Egames — Temporada 2026 representando a ', el('strong', { text: r.escola || aluno.escola }), '.']),
      el('p', { text: 'Para liberar a participação, precisamos que a escola confirme o vínculo institucional do(a) aluno(a). Leia a declaração abaixo e, se estiver de acordo, clique no botão.' })
    ] : [
      el('p', { text: 'Olá, ' + (r.nome || 'responsável').split(' ')[0] + '.' }),
      el('p', {}, ['O(a) estudante ', el('strong', { text: aluno.nome }), ' (' + aluno.nickname + ' · ' + aluno.escola + ') solicitou inscrição na Copa FEDEPE de Egames — Temporada 2026 e indicou você como ' + (r.parentesco || 'responsável').toLowerCase() + '.']),
      el('p', { text: 'Por se tratar de menor de 18 anos, precisamos da sua autorização. Leia o resumo do termo abaixo e, se estiver de acordo, clique no botão.' })
    ];
    var conteudo = el('div', { class: 'email-previa' }, [
      el('div', { class: 'email-cabecalho' }, [
        el('div', {}, [el('small', { text: 'De:' }), el('span', { text: 'Copa FEDEPE de Egames <autorizacoes@copafedepe.demo>' })]),
        el('div', {}, [el('small', { text: 'Para:' }), el('span', { text: (r.nome || '') + ' <' + (r.email || '') + '>' })]),
        el('div', {}, [el('small', { text: 'Assunto:' }), el('strong', { text: (tipo === 'escola' ? 'Confirmação de vínculo escolar — ' : 'Autorização de participação — ') + aluno.nome })])
      ]),
      el('div', { class: 'email-corpo' }, [
        el('div', { class: 'email-faixa' }, [el('img', { src: 'img/logo-fedepe.png', alt: '', width: '44', height: '44' }), el('div', {}, [el('strong', { text: 'Copa FEDEPE de Egames' }), el('small', { text: 'Federação do Desporto Escolar de Pernambuco' })])])
      ].concat(corpo).concat([
        el('blockquote', { text: c.termo[0] }),
        btn,
        el('small', { class: 'email-rodape', text: 'Se você não reconhece esta solicitação, ignore este e-mail. Código: ' + (aut.token || '').toUpperCase() })
      ])),
      el('p', { class: 'aviso-simulacao', text: 'Prévia demonstrativa — nenhum e-mail real foi enviado.' })
    ]);
    var m = UI.modal({ titulo: c.caixa, conteudo: conteudo, classe: 'modal-email' });
    btn.addEventListener('click', async function () {
      UI.ocupado(btn, true, 'Registrando…');
      var res = await Api.confirmarAutorizacaoEmail(null, aut.token, tipo);
      if (!res.ok) { UI.ocupado(btn, false); UI.toast(res.erro, 'erro'); return; }
      btn.textContent = c.ctaOk; btn.classList.add('confirmado');
      UI.toast(tipo === 'escola' ? 'Vínculo escolar confirmado pela escola via e-mail.' : 'Autorização confirmada pelo responsável via e-mail.', 'sucesso');
      setTimeout(function () { m.fechar(); if (aoAutorizar) aoAutorizar(res.autorizacao); }, 900);
    });
    return m;
  }

  // ---------- Componente principal ----------
  function montar(container, opts) {
    opts = opts || {};
    var tipo = opts.tipo === 'escola' ? 'escola' : 'pais', c = cfg(tipo);
    var usuario = Api.usuarioAtual();
    var inicial = tipo === 'escola' ? { escola: usuario ? usuario.escola : '', nome: '', email: '', ra: usuario ? usuario.ra : '' } : { nome: '', cpf: '', parentesco: '', whatsapp: '', email: '' };
    var estado = { metodo: 'assinatura', resp: inicial, aceite: false };

    async function render() {
      container.innerHTML = '';
      container.appendChild(UI.carregando('Carregando autorização…'));
      var res = await Api.obterAutorizacao(null, tipo);
      container.innerHTML = '';
      if (!res.ok) { container.appendChild(UI.vazio('Não foi possível carregar', res.erro)); return; }
      var aut = res.autorizacao;
      if (opts.aoAtualizar) opts.aoAtualizar(aut);
      if (aut.responsavel && aut.responsavel.nome && !estado.preenchido) { estado.resp = Object.assign({}, estado.resp, aut.responsavel); estado.preenchido = true; }

      container.appendChild(el('div', { class: 'pa-topo' }, [
        el('div', {}, [el('small', { class: 'pa-etapa', text: c.etapa }), el('h3', { text: c.titulo }), el('small', { text: c.subtitulo })]),
        UI.tag(aut.info.rotulo, aut.info.classe)
      ]));

      if (aut.status === 'nao_necessaria') {
        container.appendChild(el('p', { class: 'pa-info', text: 'Você tem 18 anos ou mais, portanto não precisa de autorização dos responsáveis para participar.' }));
        return;
      }
      if (aut.info.autorizado) {
        container.appendChild(el('p', { class: 'pa-sucesso', text: c.sucesso + ' Guarde o comprovante abaixo.' }));
        container.appendChild(comprovante(aut));
        return;
      }
      if (aut.status === 'aguardando_email') { container.appendChild(telaAguardando(aut)); return; }
      container.appendChild(formulario());
    }

    function telaAguardando(aut) {
      var simular = el('button', { type: 'button', class: 'btn btn-amarelo', text: c.simular });
      simular.addEventListener('click', function () {
        previaEmail(aut, usuario, function (nova) { render(); if (opts.aoAutorizar) opts.aoAutorizar(nova); });
      });
      var reenviar = el('button', { type: 'button', class: 'btn btn-borda btn-pequeno', text: 'Reenviar e-mail' });
      reenviar.addEventListener('click', async function () {
        UI.ocupado(reenviar, true, 'Reenviando…');
        var r = await Api.enviarAutorizacaoEmail({ responsavel: aut.responsavel }, tipo);
        UI.ocupado(reenviar, false);
        UI.toast(r.ok ? 'E-mail reenviado para ' + aut.responsavel.email + '.' : r.erro, r.ok ? 'sucesso' : 'erro');
        if (r.ok) render();
      });
      var trocar = el('button', { type: 'button', class: 'btn btn-borda btn-pequeno', text: 'Trocar para assinatura digital' });
      trocar.addEventListener('click', async function () {
        UI.ocupado(trocar, true);
        var r = await Api.reiniciarAutorizacao(tipo);
        if (!r.ok) { UI.ocupado(trocar, false); UI.toast(r.erro, 'erro'); return; }
        estado.metodo = 'assinatura'; render();
      });
      return el('div', { class: 'pa-aguardando' }, [
        el('div', { class: 'pa-envelope', text: '✉' }),
        el('p', {}, ['Enviamos o pedido para ', el('strong', { text: aut.responsavel.email }), ' em ' + UI.dataHora(aut.emailEnviadoEm) + '. Assim que houver o clique em ', el('em', { text: '“' + c.cta + '”' }), ', o status muda automaticamente aqui e no Painel ADM.']),
        el('div', { class: 'pa-acoes' }, [simular]),
        el('div', { class: 'pa-acoes secundarias' }, [reenviar, trocar])
      ]);
    }

    function formulario() {
      var msg = el('p', { class: 'auth-msg', role: 'alert', hidden: true });
      var mostrarErro = function (t) { msg.textContent = t; msg.hidden = false; msg.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
      var inputs = {};
      var listaId = 'pa-escolas-' + Math.random().toString(36).slice(2, 7);

      var camposNos = c.campos.map(function (f) {
        var input;
        if (f.opcoes) {
          input = el('select', {}, [el('option', { value: '', text: 'Selecione…' })].concat(f.opcoes().map(function (p) { return el('option', { value: p, text: p, selected: estado.resp[f.id] === p }); })));
        } else {
          input = el('input', { type: f.tipo || 'text', inputmode: f.modo || null, autocomplete: 'off', placeholder: f.placeholder, maxlength: f.max ? String(f.max) : null, list: f.lista ? listaId : null });
          input.value = estado.resp[f.id] || '';
          if (f.mascara) input.addEventListener('input', function () { input.value = f.mascara(input.value); });
        }
        var sync = function () { estado.resp[f.id] = input.value; };
        input.addEventListener('input', sync); input.addEventListener('change', sync);
        inputs[f.id] = input;
        return el('label', { class: 'campo' + (f.largo ? ' pa-col-2' : '') }, [el('span', { text: f.rotulo }), input]);
      });
      var datalist = null;
      if (tipo === 'escola') {
        datalist = el('datalist', { id: listaId });
        Api.escolas().then(function (r) { (r.escolas || []).forEach(function (e) { datalist.appendChild(el('option', { value: e })); }); });
      }

      var aceite = el('input', { type: 'checkbox', checked: estado.aceite });
      aceite.addEventListener('change', function () { estado.aceite = aceite.checked; });

      var termo = el('details', { class: 'pa-termo', open: true }, [
        el('summary', { text: c.resumoTermo }),
        el('div', {}, c.termo.map(function (t) { return el('p', { text: t }); }))
      ]);

      var opcoes = el('div', { class: 'pa-metodos', role: 'radiogroup', 'aria-label': 'Método de autorização' });
      var area = el('div', { class: 'pa-area' });
      [['assinatura', '✍', c.metodoAssinatura], ['email', '✉', c.metodoEmail]].forEach(function (m) {
        var b = el('button', { type: 'button', role: 'radio', class: 'pa-metodo' + (estado.metodo === m[0] ? ' ativo' : ''), 'aria-checked': String(estado.metodo === m[0]) }, [
          el('span', { class: 'pa-metodo-icone', text: m[1] }), el('span', {}, [el('strong', { text: m[2][0] }), el('small', { text: m[2][1] })])
        ]);
        b.addEventListener('click', function () {
          estado.metodo = m[0];
          opcoes.querySelectorAll('.pa-metodo').forEach(function (x) { x.classList.toggle('ativo', x === b); x.setAttribute('aria-checked', String(x === b)); });
          renderArea();
        });
        opcoes.appendChild(b);
      });

      function validarLocal(exigirAceite) {
        var r = estado.resp;
        var completo = function (t) { return (t || '').trim().split(/\s+/).length >= 2; };
        if (tipo === 'escola') {
          if ((r.escola || '').trim().length < 3) return 'Informe o nome da escola.';
          if (!completo(r.nome)) return 'Informe o nome completo do diretor ou coordenador esportivo.';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((r.email || '').trim())) return 'E-mail institucional inválido.';
          if ((r.ra || '').trim().length < 4) return 'Informe a matrícula/RA do aluno.';
        } else {
          if (!completo(r.nome)) return 'Informe o nome completo do responsável.';
          if (!Api.cpfValido(r.cpf)) return 'CPF do responsável inválido.';
          if (!r.parentesco) return 'Selecione o grau de parentesco.';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((r.email || '').trim())) return 'E-mail do responsável inválido.';
          var w = (r.whatsapp || '').replace(/\D/g, ''); if (w && w.length < 10) return 'WhatsApp inválido: informe DDD + número (ou deixe em branco).';
        }
        if (exigirAceite && !estado.aceite) return tipo === 'escola' ? 'O responsável escolar precisa marcar a declaração de vínculo.' : 'O responsável precisa declarar que leu e concorda com o termo.';
        return null;
      }

      function renderArea() {
        area.innerHTML = '';
        if (estado.metodo === 'assinatura') {
          var quadro = quadroAssinatura(c.dica);
          var limpar = el('button', { type: 'button', class: 'btn btn-borda btn-pequeno', text: 'Limpar' });
          var confirmar = el('button', { type: 'button', class: 'btn btn-amarelo', text: 'Confirmar Assinatura' });
          limpar.addEventListener('click', function () { quadro.limpar(); });
          confirmar.addEventListener('click', async function () {
            msg.hidden = true;
            var e = validarLocal(true); if (e) return mostrarErro(e);
            if (quadro.vazio()) return mostrarErro('Faça a assinatura no quadro antes de confirmar.');
            UI.ocupado(confirmar, true, 'Salvando assinatura…');
            var r = await Api.assinarAutorizacao({ responsavel: estado.resp, aceite: estado.aceite, assinatura: quadro.exportar() }, tipo);
            if (!r.ok) { UI.ocupado(confirmar, false); return mostrarErro(r.erro); }
            UI.toast(tipo === 'escola' ? 'Vínculo escolar confirmado com assinatura digital.' : 'Autorização registrada com assinatura digital.', 'sucesso');
            await render();
            if (opts.aoAutorizar) opts.aoAutorizar(r.autorizacao);
          });
          area.appendChild(el('div', { class: 'pa-assinatura' }, [quadro.no, el('div', { class: 'pa-acoes' }, [limpar, confirmar])]));
          setTimeout(quadro.ajustar, 30);
        } else {
          var enviar = el('button', { type: 'button', class: 'btn btn-amarelo', text: c.botaoEnviar });
          enviar.addEventListener('click', async function () {
            msg.hidden = true;
            var e = validarLocal(false); if (e) return mostrarErro(e);
            UI.ocupado(enviar, true, 'Enviando e-mail…');
            var r = await Api.enviarAutorizacaoEmail({ responsavel: estado.resp }, tipo);
            if (!r.ok) { UI.ocupado(enviar, false); return mostrarErro(r.erro); }
            UI.toast('E-mail enviado para ' + r.autorizacao.responsavel.email + ' (simulação).', 'sucesso');
            render();
            if (opts.aoEnviar) opts.aoEnviar(r.autorizacao);
          });
          area.appendChild(el('div', { class: 'pa-email' }, [el('p', { text: c.textoEmail }), el('div', { class: 'pa-acoes' }, [enviar])]));
        }
      }
      renderArea();

      var depois = null;
      if (opts.permitirDepois) {
        depois = el('button', { type: 'button', class: 'btn-link', text: opts.textoDepois || 'Fazer isso depois' });
        depois.addEventListener('click', function () { if (opts.aoDepois) opts.aoDepois(); });
      }

      return el('div', { class: 'pa-form' }, [
        termo, msg,
        el('div', { class: 'pa-grade' }, camposNos), datalist,
        el('label', { class: 'check' }, [aceite, c.aceite]),
        el('h4', { class: 'pa-subtitulo', text: c.pergunta }),
        opcoes, area, depois
      ]);
    }

    render();
    return { atualizar: render };
  }

  function abrir(opts) {
    opts = opts || {};
    var tipo = opts.tipo === 'escola' ? 'escola' : 'pais';
    var box = el('div', { class: 'pa' });
    var m = UI.modal({ titulo: cfg(tipo).titulo, conteudo: box, classe: 'modal-largo' });
    montar(box, {
      tipo: tipo,
      aoAutorizar: function (aut) {
        if (!aut.info.autorizado) return;
        setTimeout(function () { m.fechar(); if (opts.aoAutorizar) opts.aoAutorizar(aut); }, 1200);
      }
    });
    return m;
  }

  window.ParentalAuth = window.Autorizacoes = {
    montar: montar, abrir: abrir, comprovante: comprovante, previaEmail: previaEmail, cpfMascarado: cpfMascarado, TIPOS: TIPOS
  };
})();
