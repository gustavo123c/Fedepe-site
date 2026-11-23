/* =====================================================================
   js/services/mockApi.js — "backend" simulado da Copa FEDEPE.
   - Persiste tudo no localStorage (chave fedepe_db_v2).
   - Toda função pública é assíncrona e tem latência artificial, como uma API real.
   - Retorno padrão: { ok: true, ...dados } ou { ok: false, erro, motivo? }.
   - Dispara o evento "fedepe:dados" (window) sempre que o banco muda — inclusive
     quando outra aba altera os dados —, o que permite atualizar telas em tempo real.
   Para ligar a um backend real, reimplemente estas funções com fetch().
   ===================================================================== */
(function () {
  'use strict';

  var DB_KEY = 'fedepe_db_v2';
  var SESS_KEY = 'fedepe_sessao_v2';
  var EVENTO = 'fedepe:dados';
  var LAT_MIN = 180, LAT_MAX = 450;

  var JOGOS = {
    valorant: { nome: 'Valorant', curto: 'Valorant', caps: 'VALORANT', descricao: 'FPS tático competitivo' },
    lol: { nome: 'League of Legends', curto: 'LoL', caps: 'LEAGUE OF LEGENDS', descricao: 'MOBA mais jogado do mundo' },
    fortnite: { nome: 'Fortnite', curto: 'Fortnite', caps: 'FORTNITE', descricao: 'Battle royale com enorme base de jogadores' },
    cs2: { nome: 'Counter-Strike 2', curto: 'CS2', caps: 'COUNTER-STRIKE 2', descricao: 'FPS clássico de alta competitividade' }
  };

  var STATUS_AUT = {
    nao_enviada: { rotulo: 'Pendente de preenchimento', classe: 'tag-pendente', autorizado: false },
    aguardando_email: { rotulo: 'Aguardando confirmação por e-mail', classe: 'tag-aguardando', autorizado: false },
    assinatura: { rotulo: 'Autorizado (Assinatura Digital)', classe: 'tag-aprovado', autorizado: true },
    email: { rotulo: 'Autorizado (Via E-mail)', classe: 'tag-aprovado', autorizado: true },
    nao_necessaria: { rotulo: 'Não necessária (maior de idade)', classe: 'tag-neutra', autorizado: true }
  };

  var STATUS_CADASTRO = {
    pendente: { rotulo: 'Pendente', classe: 'tag-aguardando' },
    aprovado: { rotulo: 'Aprovado', classe: 'tag-aprovado' },
    reprovado: { rotulo: 'Reprovado', classe: 'tag-reprovado' }
  };

  var PARENTESCOS = ['Pai', 'Mãe', 'Tutor Legal'];

  // ---------- utilitários ----------
  var esperar = function (ms) {
    return new Promise(function (r) { setTimeout(r, ms != null ? ms : LAT_MIN + Math.random() * (LAT_MAX - LAT_MIN)); });
  };
  var copia = function (o) { return o == null ? o : JSON.parse(JSON.stringify(o)); };
  var norm = function (t) {
    return (t || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  };
  var erro = function (msg, motivo) { return { ok: false, erro: msg, motivo: motivo || 'validacao' }; };
  var novoId = function (pfx) { return pfx + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  var agoraISO = function () { return new Date().toISOString(); };
  var soDigitos = function (t) { return (t || '').replace(/\D/g, ''); };

  async function hash(txt) {
    // Apenas protótipo. Em produção: hash no servidor com bcrypt/argon2.
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      try {
        var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('fedepe::' + txt));
        return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      } catch (e) { /* cai no fallback */ }
    }
    var h = 5381; var s = 'fedepe::' + txt;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return 'djb2-' + h.toString(16);
  }

  function idade(nascISO) {
    if (!nascISO) return null;
    var n = new Date(nascISO + 'T12:00:00'), h = new Date();
    var a = h.getFullYear() - n.getFullYear();
    var m = h.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && h.getDate() < n.getDate())) a--;
    return a;
  }

  function cpfValido(c) {
    c = soDigitos(c);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    for (var t = 9; t < 11; t++) {
      var s = 0;
      for (var i = 0; i < t; i++) s += Number(c[i]) * (t + 1 - i);
      var d = (s * 10) % 11; if (d === 10) d = 0;
      if (d !== Number(c[t])) return false;
    }
    return true;
  }

  // ---------- persistência ----------
  var cache = null;
  function ler() {
    if (cache) return cache;
    try { cache = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) { cache = null; }
    return cache;
  }
  function gravar(db) {
    cache = db;
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
    catch (e) { console.error('[mockApi] Falha ao gravar no localStorage', e); throw new Error('Armazenamento local cheio ou indisponível.'); }
    window.dispatchEvent(new CustomEvent(EVENTO, { detail: { origem: 'local' } }));
  }
  window.addEventListener('storage', function (e) {
    if (e.key === DB_KEY || e.key === null) {
      cache = null;
      window.dispatchEvent(new CustomEvent(EVENTO, { detail: { origem: 'outra-aba' } }));
    }
    if (e.key === SESS_KEY) window.dispatchEvent(new CustomEvent(EVENTO, { detail: { origem: 'sessao' } }));
  });

  async function semear() {
    var seed = window.FEDEPE_SEED();
    for (var i = 0; i < seed.usuarios.length; i++) {
      var u = seed.usuarios[i];
      u.senhaHash = await hash(u.senha);
      delete u.senha;
      u.criadoEm = u.criadoEm || '2026-11-0' + ((i % 9) + 1) + 'T10:00:00-03:00';
    }
    seed.semeadoEm = agoraISO();
    gravar(seed);
  }

  var pronto = null;
  function ready() {
    if (!pronto) {
      pronto = (async function () {
        var db = ler();
        if (!db || db.versao !== 2) await semear();
      })();
    }
    return pronto;
  }

  // ---------- sessão ----------
  function idSessao() {
    try { return JSON.parse(sessionStorage.getItem(SESS_KEY) || localStorage.getItem(SESS_KEY)); } catch (e) { return null; }
  }
  function abrirSessao(id, lembrar) {
    sessionStorage.removeItem(SESS_KEY); localStorage.removeItem(SESS_KEY);
    (lembrar ? localStorage : sessionStorage).setItem(SESS_KEY, JSON.stringify(id));
  }
  function usuarioBruto(id) { var db = ler(); return db ? db.usuarios.find(function (u) { return u.id === id; }) || null : null; }

  function publico(u) {
    if (!u) return null;
    var c = copia(u); delete c.senhaHash;
    c.idade = idade(u.nascimento);
    c.menor = c.idade != null && c.idade < 18;
    return c;
  }

  function autorizacaoDe(db, userId) {
    var a = db.autorizacoes.find(function (x) { return x.userId === userId; });
    if (!a) {
      var u = db.usuarios.find(function (x) { return x.id === userId; });
      var menor = u && idade(u.nascimento) < 18;
      a = { userId: userId, status: menor ? 'nao_enviada' : 'nao_necessaria', log: [] };
      db.autorizacoes.push(a);
    }
    return a;
  }
  function autorizacaoPublica(a) {
    var c = copia(a);
    c.info = STATUS_AUT[c.status] || STATUS_AUT.nao_enviada;
    return c;
  }

  function usuarioAtual() { return publico(usuarioBruto(idSessao())); }

  function exigeLogin() {
    var u = usuarioBruto(idSessao());
    return u ? null : erro('Entre na sua conta para continuar.', 'login');
  }
  function exigeAdmin() {
    var u = usuarioBruto(idSessao());
    if (!u) return erro('Entre com uma conta de administrador.', 'login');
    if (u.perfil !== 'admin') return erro('Acesso restrito à coordenação da FEDEPE.', 'permissao');
    return null;
  }

  // ---------- Autenticação ----------
  async function entrar(d) {
    await ready(); await esperar();
    var nome = norm(d.nome), ra = norm(d.ra);
    if (!nome) return erro('Informe seu nome.');
    if (!ra) return erro('Informe seu RA/matrícula.');
    if (!d.senha) return erro('Informe sua senha.');
    var u = ler().usuarios.find(function (x) { return norm(x.ra) === ra; });
    var h = await hash(d.senha);
    var nomeConfere = u && (norm(u.nome) === nome || norm(u.nickname) === nome || norm(u.nome).split(' ')[0] === nome);
    if (!u || u.senhaHash !== h || !nomeConfere) return erro('Nome, RA/matrícula ou senha incorretos.', 'credenciais');
    abrirSessao(u.id, !!d.lembrar);
    window.dispatchEvent(new CustomEvent(EVENTO, { detail: { origem: 'sessao' } }));
    return { ok: true, usuario: publico(u) };
  }

  function sair() {
    sessionStorage.removeItem(SESS_KEY); localStorage.removeItem(SESS_KEY);
    window.dispatchEvent(new CustomEvent(EVENTO, { detail: { origem: 'sessao' } }));
  }

  async function cadastrar(d) {
    await ready(); await esperar();
    var nome = (d.nome || '').trim().replace(/\s+/g, ' '), nick = (d.nickname || '').trim();
    var email = norm(d.email), escola = (d.escola || '').trim(), ra = (d.ra || '').trim();
    var id_ = idade(d.nascimento);

    if (nome.split(' ').length < 2) return erro('Informe seu nome completo.');
    if (!/^[\w.]{3,16}$/.test(nick)) return erro('Nickname: 3 a 16 caracteres (letras, números, "." ou "_").');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('E-mail inválido.');
    if (!d.nascimento || id_ == null || isNaN(id_)) return erro('Informe sua data de nascimento.');
    if (id_ < 10 || id_ > 25) return erro('A Copa FEDEPE é destinada a estudantes entre 10 e 25 anos.');
    if (escola.length < 3) return erro('Informe o nome da sua escola.');
    if (ra.length < 4) return erro('Informe seu RA ou matrícula.');
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(d.senha || '')) return erro('A senha precisa ter 8+ caracteres, com letras e números.');
    if (d.senha !== d.confirmar) return erro('As senhas não conferem.');
    if (!d.aceite) return erro('Aceite os termos de uso e a política de privacidade.');

    var db = ler();
    if (db.usuarios.some(function (u) { return norm(u.ra) === norm(ra); })) return erro('Este RA/matrícula já está cadastrado.');
    if (db.usuarios.some(function (u) { return norm(u.email) === email; })) return erro('Este e-mail já está cadastrado.');
    if (db.usuarios.some(function (u) { return norm(u.nickname) === norm(nick); })) return erro('Este nickname já está em uso.');

    var user = {
      id: novoId('u'), perfil: 'jogador', nome: nome, nickname: nick, email: email, escola: escola, ra: ra,
      nascimento: d.nascimento, senhaHash: await hash(d.senha), status: 'pendente', stats: {}, criadoEm: agoraISO()
    };
    db.usuarios.push(user);
    db.autorizacoes.push({ userId: user.id, status: id_ < 18 ? 'nao_enviada' : 'nao_necessaria', log: [] });
    if (!db.escolas.some(function (e) { return norm(e) === norm(escola); })) db.escolas.push(escola);
    gravar(db);
    abrirSessao(user.id, true);
    return { ok: true, usuario: publico(user) };
  }

  async function recuperarSenha(d) {
    await ready(); await esperar();
    var ra = norm(d.ra);
    if (!ra) return erro('Informe seu RA/matrícula.');
    var u = ler().usuarios.find(function (x) { return norm(x.ra) === ra; });
    // Resposta genérica para não revelar quais RAs existem.
    var destino = u ? u.email.replace(/^(.{2}).*(@.*)$/, '$1•••$2') : null;
    return { ok: true, mensagem: destino
      ? 'Enviamos um link de redefinição para ' + destino + ' (simulação — nenhum e-mail real foi enviado).'
      : 'Se o RA estiver cadastrado, você receberá um link de redefinição no e-mail informado no cadastro.' };
  }

  async function atualizarPerfil(d) {
    await ready(); await esperar();
    var bloq = exigeLogin(); if (bloq) return bloq;
    var db = ler(); var u = db.usuarios.find(function (x) { return x.id === idSessao(); });
    var nick = (d.nickname || '').trim(), email = norm(d.email), escola = (d.escola || '').trim();
    if (!/^[\w.]{3,16}$/.test(nick)) return erro('Nickname: 3 a 16 caracteres (letras, números, "." ou "_").');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('E-mail inválido.');
    if (escola.length < 3) return erro('Informe o nome da sua escola.');
    if (db.usuarios.some(function (x) { return x.id !== u.id && norm(x.nickname) === norm(nick); })) return erro('Este nickname já está em uso.');
    if (db.usuarios.some(function (x) { return x.id !== u.id && norm(x.email) === email; })) return erro('Este e-mail já está cadastrado.');
    u.nickname = nick; u.email = email; u.escola = escola;
    gravar(db);
    return { ok: true, usuario: publico(u) };
  }

  // ---------- Campeonatos ----------
  function enriquecerCamp(db, c, uid) {
    var r = copia(c);
    var insc = db.inscricoes.filter(function (i) { return i.campId === c.id; });
    r.inscritos = insc.length;
    r.ocupadas = Math.min(c.vagas, c.ocupadasBase + insc.length);
    r.vagasLivres = Math.max(0, c.vagas - r.ocupadas);
    r.jogoInfo = JOGOS[c.jogo];
    var fim = new Date(c.prazo + 'T23:59:59');
    r.prazoEncerrado = new Date() > fim;
    r.inscrito = !!uid && insc.some(function (i) {
      if (i.userId === uid) return true;
      var eq = db.equipes.find(function (e) { return e.id === i.equipeId; });
      var u = db.usuarios.find(function (x) { return x.id === uid; });
      return eq && u && eq.participantes.some(function (p) { return norm(p) === norm(u.nome); });
    });
    r.podeInscrever = c.status === 'aberta' && !r.prazoEncerrado && r.vagasLivres > 0;
    return r;
  }

  async function listarCampeonatos(f) {
    await ready(); await esperar();
    f = f || {};
    var db = ler(), uid = idSessao();
    var lista = db.campeonatos
      .filter(function (c) { return !f.jogo || f.jogo === 'todos' || c.jogo === f.jogo; })
      .filter(function (c) { return !f.status || f.status === 'todos' || c.status === f.status; })
      .map(function (c) { return enriquecerCamp(db, c, uid); });
    var ordem = { aberta: 0, andamento: 1, encerrado: 2 };
    lista.sort(function (a, b) { return (ordem[a.status] - ordem[b.status]) || a.inicio.localeCompare(b.inicio); });
    return { ok: true, campeonatos: lista };
  }

  async function obterCampeonato(id) {
    await ready(); await esperar();
    var db = ler();
    var c = db.campeonatos.find(function (x) { return x.id === id; });
    if (!c) return erro('Campeonato não encontrado.', 'nao_encontrado');
    return { ok: true, campeonato: enriquecerCamp(db, c, idSessao()) };
  }

  // Regras de negócio da inscrição, em ordem de verificação.
  async function inscrever(campId) {
    await ready(); await esperar();
    var bloq = exigeLogin(); if (bloq) return bloq;
    var db = ler(), uid = idSessao();
    var u = db.usuarios.find(function (x) { return x.id === uid; });
    var c = db.campeonatos.find(function (x) { return x.id === campId; });
    if (!c) return erro('Campeonato não encontrado.', 'nao_encontrado');
    var cc = enriquecerCamp(db, c, uid);

    if (u.perfil === 'admin') return erro('Contas administrativas não podem se inscrever em campeonatos.', 'permissao');
    if (c.status !== 'aberta') return erro('As inscrições deste campeonato não estão abertas.', 'fechado');
    if (cc.prazoEncerrado) return erro('O prazo de inscrição deste campeonato já terminou.', 'prazo');
    if (cc.inscrito) return erro('Você (ou sua equipe) já está inscrito neste campeonato.', 'duplicado');
    if (u.status === 'reprovado') return erro('Seu cadastro foi reprovado pela coordenação. Procure a FEDEPE para regularizar.', 'reprovado');

    var equipe = null;
    if (c.modo === 'equipe') {
      equipe = db.equipes.find(function (e) { return e.capitao === uid; }) ||
               db.equipes.find(function (e) { return e.participantes.some(function (p) { return norm(p) === norm(u.nome); }); });
      if (!equipe) return erro('Este campeonato é disputado por equipes. Crie sua equipe no perfil antes de se inscrever.', 'equipe');
      if (equipe.capitao !== uid) return erro('Somente o capitão da equipe "' + equipe.nome + '" pode realizar a inscrição.', 'capitao');
    }

    var aut = autorizacaoDe(db, uid);
    if (idade(u.nascimento) < 18 && !STATUS_AUT[aut.status].autorizado) {
      return erro(aut.status === 'aguardando_email'
        ? 'A autorização dos pais/responsáveis foi enviada por e-mail e ainda aguarda confirmação.'
        : 'É necessário enviar a autorização dos pais/responsáveis antes de se inscrever.', 'autorizacao');
    }
    if (cc.vagasLivres <= 0) return erro('Não há mais vagas disponíveis.', 'vagas');

    var insc = { id: novoId('in'), campId: c.id, userId: uid, equipeId: equipe ? equipe.id : null, data: agoraISO() };
    db.inscricoes.push(insc);
    gravar(db);
    return { ok: true, inscricao: copia(insc), equipe: equipe ? copia(equipe) : null };
  }

  async function minhasInscricoes() {
    await ready(); await esperar(120);
    var uid = idSessao(); if (!uid) return { ok: true, inscricoes: [] };
    var db = ler();
    var lista = db.campeonatos
      .map(function (c) { return enriquecerCamp(db, c, uid); })
      .filter(function (c) { return c.inscrito; });
    return { ok: true, inscricoes: lista };
  }

  // ---------- Equipes ----------
  var MIN_JOG = 2, MAX_JOG = 6;
  function equipeDe(db, uid) {
    var u = db.usuarios.find(function (x) { return x.id === uid; });
    return db.equipes.find(function (e) { return e.capitao === uid; }) ||
      (u ? db.equipes.find(function (e) { return e.participantes.some(function (p) { return norm(p) === norm(u.nome); }); }) : null) || null;
  }

  async function minhaEquipe() {
    await ready(); await esperar(150);
    var uid = idSessao(); if (!uid) return { ok: true, equipe: null };
    var eq = equipeDe(ler(), uid);
    return { ok: true, equipe: eq ? Object.assign(copia(eq), { souCapitao: eq.capitao === uid }) : null };
  }

  async function criarEquipe(nome, participantes) {
    await ready(); await esperar();
    var bloq = exigeLogin(); if (bloq) return bloq;
    var db = ler(), uid = idSessao();
    var u = db.usuarios.find(function (x) { return x.id === uid; });
    nome = (nome || '').trim();
    if (nome.length < 3 || nome.length > 24) return erro('O nome da equipe deve ter de 3 a 24 caracteres.');
    if (equipeDe(db, uid)) return erro('Você já faz parte de uma equipe.');
    if (db.equipes.some(function (e) { return norm(e.nome) === norm(nome); })) return erro('Já existe uma equipe com esse nome.');
    var nomes = (participantes || []).map(function (p) { return (p || '').trim().replace(/\s+/g, ' '); }).filter(Boolean);
    if (nomes.some(function (n) { return n.split(' ').length < 2; })) return erro('Informe o nome completo de cada participante.');
    var todos = [u.nome].concat(nomes);
    if (new Set(todos.map(norm)).size !== todos.length) return erro('Há participantes repetidos.');
    if (todos.length < MIN_JOG) return erro('A equipe precisa de pelo menos ' + MIN_JOG + ' jogadores.');
    if (todos.length > MAX_JOG) return erro('A equipe pode ter no máximo ' + MAX_JOG + ' jogadores (5 titulares + 1 reserva).');
    var eq = { id: novoId('eq'), nome: nome, capitao: uid, escola: u.escola, participantes: todos, criadaEm: agoraISO() };
    db.equipes.push(eq);
    gravar(db);
    return { ok: true, equipe: copia(eq) };
  }

  // ---------- Autorização parental ----------
  function validarResponsavel(r) {
    r = r || {};
    var nome = (r.nome || '').trim().replace(/\s+/g, ' ');
    if (nome.split(' ').length < 2) return 'Informe o nome completo do responsável.';
    if (!cpfValido(r.cpf)) return 'CPF do responsável inválido.';
    if (PARENTESCOS.indexOf(r.parentesco) < 0) return 'Selecione o grau de parentesco.';
    var w = soDigitos(r.whatsapp);
    if (w.length < 10 || w.length > 11) return 'Informe um WhatsApp válido com DDD.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((r.email || '').trim())) return 'E-mail do responsável inválido.';
    return null;
  }
  function limparResponsavel(r) {
    return { nome: r.nome.trim().replace(/\s+/g, ' '), cpf: r.cpf, parentesco: r.parentesco, whatsapp: r.whatsapp, email: norm(r.email) };
  }

  async function obterAutorizacao(userId) {
    await ready(); await esperar(150);
    var uid = userId || idSessao();
    if (!uid) return erro('Entre na sua conta para continuar.', 'login');
    if (userId && userId !== idSessao()) { var b = exigeAdmin(); if (b) return b; }
    var db = ler(); var a = autorizacaoDe(db, uid);
    return { ok: true, autorizacao: autorizacaoPublica(a) };
  }

  async function assinarAutorizacao(d) {
    await ready(); await esperar();
    var bloq = exigeLogin(); if (bloq) return bloq;
    var msg = validarResponsavel(d.responsavel); if (msg) return erro(msg);
    if (!d.aceite) return erro('O responsável precisa declarar que leu e concorda com o Termo de Autorização.');
    if (!/^data:image\/(png|jpeg|svg\+xml);base64,/.test(d.assinatura || '') || d.assinatura.length < 800) return erro('Faça a assinatura no quadro antes de confirmar.');
    var db = ler(), uid = idSessao(); var a = autorizacaoDe(db, uid);
    var agora = agoraISO();
    Object.assign(a, {
      status: 'assinatura', metodo: 'assinatura', responsavel: limparResponsavel(d.responsavel),
      assinatura: d.assinatura, assinadoEm: agora, token: null, emailEnviadoEm: null, confirmadoEm: null,
      dispositivo: navigator.userAgent.slice(0, 120)
    });
    a.log = (a.log || []).concat([{ data: agora, evento: 'Assinatura digital registrada na tela por ' + a.responsavel.nome + ' (' + a.responsavel.parentesco + ').' }]);
    gravar(db);
    return { ok: true, autorizacao: autorizacaoPublica(a) };
  }

  async function enviarAutorizacaoEmail(d) {
    await ready(); await esperar(700);
    var bloq = exigeLogin(); if (bloq) return bloq;
    var msg = validarResponsavel(d.responsavel); if (msg) return erro(msg);
    var db = ler(), uid = idSessao(); var a = autorizacaoDe(db, uid);
    var agora = agoraISO();
    Object.assign(a, {
      status: 'aguardando_email', metodo: 'email', responsavel: limparResponsavel(d.responsavel),
      assinatura: null, assinadoEm: null, emailEnviadoEm: agora, confirmadoEm: null,
      token: 'tk-' + Math.random().toString(36).slice(2, 10)
    });
    a.log = (a.log || []).concat([{ data: agora, evento: 'E-mail de autorização enviado para ' + a.responsavel.email + ' (envio simulado).' }]);
    gravar(db);
    return { ok: true, autorizacao: autorizacaoPublica(a) };
  }

  // Simula o clique do responsável no botão do e-mail. Na vida real seria um link com token.
  async function confirmarAutorizacaoEmail(userId, token) {
    await ready(); await esperar();
    var db = ler(); var uid = userId || idSessao();
    if (!uid) return erro('Entre na sua conta para continuar.', 'login');
    var a = autorizacaoDe(db, uid);
    if (a.status !== 'aguardando_email') return erro('Não há autorização aguardando confirmação por e-mail.');
    if (token && token !== a.token) return erro('Link de autorização inválido ou expirado.');
    var agora = agoraISO();
    a.status = 'email'; a.confirmadoEm = agora;
    a.log = (a.log || []).concat([{ data: agora, evento: 'Responsável clicou em "Autorizar Participação do Estudante" no e-mail.' }]);
    gravar(db);
    return { ok: true, autorizacao: autorizacaoPublica(a) };
  }

  async function reiniciarAutorizacao() {
    await ready(); await esperar(150);
    var bloq = exigeLogin(); if (bloq) return bloq;
    var db = ler(), uid = idSessao(); var a = autorizacaoDe(db, uid);
    if (STATUS_AUT[a.status].autorizado) return erro('A autorização já foi concluída.');
    a.status = 'nao_enviada'; a.token = null;
    a.log = (a.log || []).concat([{ data: agoraISO(), evento: 'Aluno escolheu trocar o método de autorização.' }]);
    gravar(db);
    return { ok: true, autorizacao: autorizacaoPublica(a) };
  }

  // ---------- Admin ----------
  async function listarAlunos(f) {
    await ready(); await esperar();
    var bloq = exigeAdmin(); if (bloq) return bloq;
    f = f || {};
    var db = ler();
    var lista = db.usuarios
      .filter(function (u) { return u.perfil === 'jogador'; })
      .filter(function (u) { return !f.status || f.status === 'todos' || u.status === f.status; })
      .map(function (u) {
        var p = publico(u);
        p.autorizacao = autorizacaoPublica(autorizacaoDe(db, u.id));
        var eq = equipeDe(db, u.id); p.equipe = eq ? eq.nome : null;
        return p;
      })
      .sort(function (a, b) { return (b.criadoEm || '').localeCompare(a.criadoEm || ''); });
    var contagem = { pendente: 0, aprovado: 0, reprovado: 0 };
    db.usuarios.forEach(function (u) { if (u.perfil === 'jogador') contagem[u.status] = (contagem[u.status] || 0) + 1; });
    return { ok: true, alunos: lista, contagem: contagem };
  }

  async function definirStatusCadastro(userId, status, obs) {
    await ready(); await esperar();
    var bloq = exigeAdmin(); if (bloq) return bloq;
    if (!STATUS_CADASTRO[status]) return erro('Status inválido.');
    var db = ler(); var u = db.usuarios.find(function (x) { return x.id === userId; });
    if (!u || u.perfil !== 'jogador') return erro('Aluno não encontrado.');
    u.status = status; u.avaliadoEm = agoraISO(); u.avaliadoPor = idSessao(); u.observacao = obs || null;
    gravar(db);
    return { ok: true, usuario: publico(u) };
  }

  // ---------- Ranking e transmissões ----------
  async function ranking(jogo) {
    await ready(); await esperar();
    var db = ler();
    var lista = db.usuarios
      .filter(function (u) { return u.perfil === 'jogador' && u.stats && u.stats[jogo]; })
      .map(function (u) { var s = u.stats[jogo]; return { id: u.id, nome: u.nome, nickname: u.nickname, escola: u.escola, xp: s.xp, elim: s.elim, vit: s.vit }; })
      .sort(function (a, b) { return b.xp - a.xp; })
      .map(function (r, i) { r.posicao = i + 1; return r; });
    return { ok: true, jogadores: lista };
  }

  async function transmissoes() {
    await ready(); await esperar(200);
    return { ok: true, aoVivo: copia(ler().transmissoes.aoVivo), vods: copia(ler().transmissoes.vods) };
  }

  async function escolas() { await ready(); return { ok: true, escolas: copia(ler().escolas) }; }

  async function resetar() {
    await esperar(300);
    sair();
    localStorage.removeItem(DB_KEY); cache = null; pronto = null;
    await ready();
    return { ok: true };
  }

  function aoMudar(fn) {
    var h = function (e) { fn(e.detail || {}); };
    window.addEventListener(EVENTO, h);
    return function () { window.removeEventListener(EVENTO, h); };
  }

  window.Api = {
    ready: ready, aoMudar: aoMudar, resetar: resetar,
    JOGOS: JOGOS, STATUS_AUT: STATUS_AUT, STATUS_CADASTRO: STATUS_CADASTRO, PARENTESCOS: PARENTESCOS,
    idade: idade, cpfValido: cpfValido,
    usuarioAtual: usuarioAtual, entrar: entrar, sair: sair, cadastrar: cadastrar, recuperarSenha: recuperarSenha, atualizarPerfil: atualizarPerfil,
    listarCampeonatos: listarCampeonatos, obterCampeonato: obterCampeonato, inscrever: inscrever, minhasInscricoes: minhasInscricoes,
    minhaEquipe: minhaEquipe, criarEquipe: criarEquipe,
    obterAutorizacao: obterAutorizacao, assinarAutorizacao: assinarAutorizacao, enviarAutorizacaoEmail: enviarAutorizacaoEmail,
    confirmarAutorizacaoEmail: confirmarAutorizacaoEmail, reiniciarAutorizacao: reiniciarAutorizacao,
    listarAlunos: listarAlunos, definirStatusCadastro: definirStatusCadastro,
    ranking: ranking, transmissoes: transmissoes, escolas: escolas
  };
})();
