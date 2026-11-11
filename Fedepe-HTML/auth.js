/* auth.js — "backend" simulado com localStorage.
   Regras de negócio concentradas aqui. Quando o banco/API existir, troque o corpo
   de cada função por fetch() mantendo o retorno { ok, erro }. */
const Auth = (function () {
  const K_USERS = 'fedepe_usuarios', K_SESSAO = 'fedepe_sessao', K_INSC = 'fedepe_inscricoes';

  const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) || padrao; } catch (e) { return padrao; } };
  const gravar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const erro = (msg) => ({ ok: false, erro: msg });
  const norm = (t) => (t || '').trim().toLowerCase();

  // Só protótipo: no backend real use bcrypt/argon2 (nunca SHA simples).
  async function hash(txt) {
    if (!window.crypto || !crypto.subtle) return btoa(unescape(encodeURIComponent(txt)));
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ---------- Cadastro ----------
  async function cadastrar(d) {
    const nome = (d.nome || '').trim(), nick = (d.nickname || '').trim();
    const email = norm(d.email), escola = (d.escola || '').trim(), ra = (d.ra || '').trim();

    if (nome.split(/\s+/).length < 2) return erro('Informe seu nome completo.');
    if (!/^[\w.]{3,16}$/.test(nick)) return erro('Nickname: 3 a 16 caracteres (letras, números, "." ou "_").');
    if (!/^\S+@\S+\.\S+$/.test(email)) return erro('E-mail inválido.');
    if (escola.length < 3) return erro('Informe o nome da sua escola.');
    if (ra.length < 4) return erro('Informe seu RA ou matrícula.');
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(d.senha || '')) return erro('A senha precisa ter 8+ caracteres, com letras e números.');
    if (d.senha !== d.confirmar) return erro('As senhas não conferem.');
    if (!d.aceite) return erro('Aceite os termos de uso e a política de privacidade.');

    const users = ler(K_USERS, []);
    if (users.some(u => norm(u.ra) === norm(ra))) return erro('Este RA/matrícula já está cadastrado.');
    if (users.some(u => u.email === email)) return erro('Este e-mail já está cadastrado.');
    if (users.some(u => norm(u.nickname) === norm(nick))) return erro('Este nickname já está em uso.');

    const user = { id: Date.now(), nome, nickname: nick, email, escola, ra, senha: await hash(d.senha), perfil: 'jogador' };
    users.push(user);
    gravar(K_USERS, users);
    localStorage.setItem(K_SESSAO, JSON.stringify(user.id));
    return { ok: true };
  }

  // ---------- Login (RA/matrícula + senha) ----------
  async function entrar(ra, senha, lembrar) {
    const u = ler(K_USERS, []).find(x => norm(x.ra) === norm(ra));
    if (!u || u.senha !== await hash(senha || '')) return erro('RA/matrícula ou senha incorretos.');
    // "Lembrar de mim": localStorage persiste; sessionStorage some ao fechar a aba
    sessionStorage.removeItem(K_SESSAO); localStorage.removeItem(K_SESSAO);
    (lembrar ? localStorage : sessionStorage).setItem(K_SESSAO, JSON.stringify(u.id));
    return { ok: true };
  }

  function sair() { localStorage.removeItem(K_SESSAO); sessionStorage.removeItem(K_SESSAO); }

  function usuarioAtual() {
    let id = null;
    try { id = JSON.parse(sessionStorage.getItem(K_SESSAO) || localStorage.getItem(K_SESSAO)); } catch (e) {}
    return ler(K_USERS, []).find(u => u.id === id) || null;
  }

  // Regra do README: deslogado + feature que exige login -> Login
  function irParaLogin() {
    const atual = location.pathname.split('/').pop() || 'index.html';
    location.href = 'login.html?voltar=' + encodeURIComponent(atual);
  }

  // Só aceita voltar para páginas .html do próprio site
  function destinoPosLogin() {
    const v = new URLSearchParams(location.search).get('voltar');
    return /^[\w-]+\.html$/.test(v || '') ? v : 'index.html';
  }

  // ---------- Inscrição em campeonato ----------
  const inscritoEm = (campId) => { const u = usuarioAtual(); return !!u && ler(K_INSC, []).some(i => i.usuario === u.id && i.camp === campId); };
  const totalInscritos = (campId) => ler(K_INSC, []).filter(i => i.camp === campId).length;

  // camp = { id, vagas, ocupadas, prazo: 'AAAA-MM-DD' }
  function inscrever(camp) {
    const u = usuarioAtual();
    if (!u) return { ok: false, precisaLogin: true, erro: 'Entre na sua conta para se inscrever.' };
    if (inscritoEm(camp.id)) return erro('Você já está inscrito neste campeonato.');
    if (new Date() > new Date(camp.prazo + 'T23:59:59')) return erro('O prazo de inscrição deste campeonato já terminou.');
    if (camp.ocupadas + totalInscritos(camp.id) >= camp.vagas) return erro('Não há mais vagas disponíveis.');
    const insc = ler(K_INSC, []);
    insc.push({ usuario: u.id, camp: camp.id, data: new Date().toISOString() });
    gravar(K_INSC, insc);
    return { ok: true };
  }

  // ---------- Equipes ----------
  const K_EQUIPES = 'fedepe_equipes', MIN_JOGADORES = 2, MAX_JOGADORES = 6; // 5 titulares + 1 reserva

  function exigirLogin() { const u = usuarioAtual(); if (!u) irParaLogin(); return u; }

  function equipeDoUsuario() {
    const u = usuarioAtual();
    return u ? (ler(K_EQUIPES, []).find(e => e.capitao === u.id) || null) : null;
  }

  function criarEquipe(nome, participantes) {
    const u = usuarioAtual();
    if (!u) return { ok: false, precisaLogin: true, erro: 'Entre na sua conta para criar uma equipe.' };
    nome = (nome || '').trim();
    if (nome.length < 3 || nome.length > 24) return erro('O nome da equipe deve ter de 3 a 24 caracteres.');
    if (equipeDoUsuario()) return erro('Você já possui uma equipe.');
    const equipes = ler(K_EQUIPES, []);
    if (equipes.some(e => norm(e.nome) === norm(nome))) return erro('Já existe uma equipe com esse nome.');
    const nomes = participantes.map(p => p.trim()).filter(Boolean);
    if (nomes.some(n => n.split(/\s+/).length < 2)) return erro('Informe o nome completo de cada participante.');
    const todos = [u.nome].concat(nomes);
    if (new Set(todos.map(norm)).size !== todos.length) return erro('Há participantes repetidos.');
    if (todos.length < MIN_JOGADORES) return erro('A equipe precisa de pelo menos ' + MIN_JOGADORES + ' jogadores.');
    if (todos.length > MAX_JOGADORES) return erro('A equipe pode ter no máximo ' + MAX_JOGADORES + ' jogadores.');
    equipes.push({ id: Date.now(), nome, capitao: u.id, participantes: todos });
    gravar(K_EQUIPES, equipes);
    return { ok: true };
  }

  const iniciais = (u) => u.nome.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();

  // Menu: logado -> link "Perfil" + avatar; deslogado -> botão Entrar aponta para o login
  function atualizarNav() {
    const btn = document.querySelector('nav a.btn-amarelo');
    if (!btn) return;
    const u = usuarioAtual();
    if (!u) { btn.href = 'login.html'; return; }
    const perfil = document.createElement('a');
    perfil.href = 'perfil.html'; perfil.textContent = 'Perfil';
    if (location.pathname.endsWith('perfil.html')) perfil.className = 'ativo';
    const avatar = document.createElement('a');
    avatar.href = 'perfil.html'; avatar.className = 'nav-avatar'; avatar.textContent = iniciais(u);
    btn.replaceWith(perfil, avatar);
  }
  document.addEventListener('DOMContentLoaded', atualizarNav);

  return { exigirLogin, equipeDoUsuario, criarEquipe, iniciais, cadastrar, entrar, sair, usuarioAtual, irParaLogin, destinoPosLogin, inscrever, inscritoEm, totalInscritos };
})();