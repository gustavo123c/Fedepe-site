/* =====================================================================
   js/mock/database.js — dados iniciais (seed) do banco mockado.
   Tudo aqui é fictício/demonstrativo. Na primeira visita, o mockApi copia
   este seed para o localStorage; "Resetar dados demo" volta a este estado.
   Para trocar por um backend real (ex.: Back4App), basta reimplementar
   js/services/mockApi.js mantendo as mesmas funções e retornos.
   ===================================================================== */
(function () {
  'use strict';

  // ---------- Utilitários do seed ----------
  // Gera CPF válido (dígitos verificadores corretos) a partir de 9 dígitos base.
  function cpf(base9) {
    var d = String(base9).split('').map(Number);
    var dv = function (arr) {
      var s = arr.reduce(function (acc, n, i) { return acc + n * (arr.length + 1 - i); }, 0);
      var r = (s * 10) % 11; return r === 10 ? 0 : r;
    };
    d.push(dv(d)); d.push(dv(d));
    var t = d.join('');
    return t.slice(0, 3) + '.' + t.slice(3, 6) + '.' + t.slice(6, 9) + '-' + t.slice(9);
  }

  // "Assinatura" vetorial de exemplo (SVG em Base64) para os registros pré-cadastrados.
  function assinatura(nome, seed) {
    var pts = [], x = 20, y = 70;
    for (var i = 0; i < 14; i++) {
      x += 18 + ((seed * (i + 3)) % 9);
      y = 55 + ((seed * (i + 7) * 13) % 40);
      pts.push(x + ',' + y);
    }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="130" viewBox="0 0 360 130">' +
      '<rect width="360" height="130" fill="#ffffff"/>' +
      '<polyline points="20,80 ' + pts.join(' ') + '" fill="none" stroke="#0b1450" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="20" y="118" font-family="Georgia, serif" font-style="italic" font-size="14" fill="#5a6190">' + nome + '</text></svg>';
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  var ESCOLAS = [
    'Colégio Damas da Instrução Cristã',
    'Colégio GGE',
    'ETERAM',
    'CEFET-PE',
    'Colégio São Paulo',
    'EPBM Sul',
    'Colégio Santa Maria',
    'EREM Ginásio Pernambucano',
    'ETE Cícero Dias'
  ];

  // Estatísticas por modalidade: { xp, elim, vit }
  function st(xp, elim, vit) { return { xp: xp, elim: elim, vit: vit }; }

  // senha em texto puro só no seed: o mockApi gera o hash na primeira carga e descarta o texto.
  var USUARIOS = [
    { id: 'u-admin', perfil: 'admin', nome: 'Coordenação FEDEPE', nickname: 'ADM_FEDEPE', email: 'coordenacao@copafedepe.demo',
      escola: 'FEDEPE', ra: 'ADMIN', nascimento: '1990-01-01', senha: 'Fedepe2026', status: 'aprovado', stats: {} },

    // Usuário demo: menor de idade, aprovado, SEM equipe e SEM autorização — ideal para testar todos os fluxos.
    { id: 'u-demo', perfil: 'jogador', nome: 'Gabriel Silva', nickname: 'GabrielPE', email: 'gabriel.demo@copafedepe.demo',
      escola: 'Colégio Damas da Instrução Cristã', ra: '2026001', nascimento: '2009-05-14', senha: 'demo1234', status: 'aprovado',
      stats: { valorant: st(12850, 342, 28), cs2: st(4120, 118, 9) } },

    // Pendentes de validação (aparecem no Painel ADM)
    { id: 'u-mariana', perfil: 'jogador', nome: 'Mariana Costa', nickname: 'Luna.gg', email: 'mariana.costa@email.com',
      escola: 'Colégio Damas da Instrução Cristã', ra: '2026014', nascimento: '2009-09-02', senha: 'demo1234', status: 'pendente',
      stats: { valorant: st(11920, 318, 25), lol: st(6200, 140, 15) } },
    { id: 'u-lucas', perfil: 'jogador', nome: 'Lucas Santos', nickname: 'RecifeRush', email: 'lucas.santos@email.com',
      escola: 'ETERAM', ra: 'ET2026-0331', nascimento: '2010-02-21', senha: 'demo1234', status: 'pendente',
      stats: { valorant: st(10780, 295, 23), fortnite: st(7300, 210, 6) } },
    { id: 'u-ana', perfil: 'jogador', nome: 'Ana Oliveira', nickname: 'NinaPlay', email: 'ana.oliveira@email.com',
      escola: 'CEFET-PE', ra: '20261INFO0457', nascimento: '2008-11-30', senha: 'demo1234', status: 'pendente',
      stats: { valorant: st(9640, 267, 21), lol: st(10100, 188, 22) } },
    { id: 'u-vinicius', perfil: 'jogador', nome: 'Vinícius Lima', nickname: 'ViniClutch', email: 'vinicius.lima@email.com',
      escola: 'Colégio GGE', ra: 'GGE-77812', nascimento: '2009-07-08', senha: 'demo1234', status: 'pendente',
      stats: { valorant: st(8930, 244, 19), cs2: st(9870, 301, 24) } },
    { id: 'u-beatriz', perfil: 'jogador', nome: 'Beatriz Souza', nickname: 'BiaStorm', email: 'beatriz.souza@email.com',
      escola: 'Colégio São Paulo', ra: 'CSP-2026-118', nascimento: '2007-03-12', senha: 'demo1234', status: 'pendente',
      stats: { valorant: st(8120, 226, 17), fortnite: st(11240, 356, 12) } },
    { id: 'u-eduardo', perfil: 'jogador', nome: 'Eduardo Alves', nickname: 'DuduFPS', email: 'eduardo.alves@email.com',
      escola: 'EPBM Sul', ra: 'EPBM-5521', nascimento: '2010-06-19', senha: 'demo1234', status: 'pendente',
      stats: { valorant: st(7450, 208, 16), cs2: st(11380, 344, 27) } },

    // Já avaliados
    { id: 'u-malu', perfil: 'jogador', nome: 'Maria Luiza Rocha', nickname: 'Malu.exe', email: 'malu.rocha@email.com',
      escola: 'Colégio GGE', ra: 'GGE-70145', nascimento: '2009-01-25', senha: 'demo1234', status: 'aprovado',
      stats: { valorant: st(6810, 186, 14), lol: st(12480, 231, 29) } },
    { id: 'u-rafael', perfil: 'jogador', nome: 'Rafael Melo', nickname: 'RafaMid', email: 'rafael.melo@email.com',
      escola: 'Colégio Santa Maria', ra: 'CSM-3390', nascimento: '2008-08-03', senha: 'demo1234', status: 'aprovado',
      stats: { lol: st(11760, 205, 26), cs2: st(8840, 270, 20) } },
    { id: 'u-julia', perfil: 'jogador', nome: 'Júlia Andrade', nickname: 'JujuSupport', email: 'julia.andrade@email.com',
      escola: 'EREM Ginásio Pernambucano', ra: 'GP-2026-062', nascimento: '2009-10-11', senha: 'demo1234', status: 'aprovado',
      stats: { lol: st(9310, 96, 21), fortnite: st(8650, 241, 8) } },
    { id: 'u-pedro', perfil: 'jogador', nome: 'Pedro Cavalcanti', nickname: 'PedroBuild', email: 'pedro.cavalcanti@email.com',
      escola: 'ETE Cícero Dias', ra: 'ECD-1182', nascimento: '2010-04-27', senha: 'demo1234', status: 'aprovado',
      stats: { fortnite: st(12960, 402, 15), cs2: st(6020, 188, 12) } },
    { id: 'u-larissa', perfil: 'jogador', nome: 'Larissa Barros', nickname: 'LariAWP', email: 'larissa.barros@email.com',
      escola: 'Colégio Damas da Instrução Cristã', ra: '2026031', nascimento: '2008-12-01', senha: 'demo1234', status: 'aprovado',
      stats: { cs2: st(12210, 379, 29), valorant: st(5980, 171, 12) } },
    { id: 'u-thiago', perfil: 'jogador', nome: 'Thiago Ferreira', nickname: 'ThiagoJG', email: 'thiago.ferreira@email.com',
      escola: 'CEFET-PE', ra: '20261INFO0512', nascimento: '2009-03-17', senha: 'demo1234', status: 'reprovado',
      stats: { lol: st(7840, 162, 17), fortnite: st(6110, 190, 4) } },
    { id: 'u-camila', perfil: 'jogador', nome: 'Camila Nunes', nickname: 'CamiStorm', email: 'camila.nunes@email.com',
      escola: 'Colégio São Paulo', ra: 'CSP-2026-140', nascimento: '2009-06-05', senha: 'demo1234', status: 'aprovado',
      stats: { fortnite: st(10380, 322, 10), lol: st(5420, 77, 12) } }
  ];

  // Autorização parental por aluno (userId). Status possíveis:
  //   nao_enviada | aguardando_email | assinatura | email | nao_necessaria
  function resp(nome, base, parentesco, whats, email) {
    return { nome: nome, cpf: cpf(base), parentesco: parentesco, whatsapp: whats, email: email };
  }
  var AUTORIZACOES = [
    { userId: 'u-demo', status: 'nao_enviada', log: [] },
    { userId: 'u-mariana', status: 'assinatura', metodo: 'assinatura',
      responsavel: resp('Cláudia Regina Costa', 123456789, 'Mãe', '(81) 99812-4410', 'claudia.costa@email.com'),
      assinatura: assinatura('Cláudia R. Costa', 7), assinadoEm: '2026-11-18T14:32:00-03:00',
      log: [{ data: '2026-11-18T14:32:00-03:00', evento: 'Assinatura digital registrada na tela (dispositivo do aluno).' }] },
    { userId: 'u-lucas', status: 'aguardando_email', metodo: 'email',
      responsavel: resp('Marcos Antônio Santos', 987654321, 'Pai', '(81) 98877-1203', 'marcos.santos@email.com'),
      emailEnviadoEm: '2026-11-21T09:10:00-03:00', token: 'tk-lucas-9f2a',
      log: [{ data: '2026-11-21T09:10:00-03:00', evento: 'E-mail de autorização enviado para marcos.santos@email.com.' }] },
    { userId: 'u-ana', status: 'email', metodo: 'email',
      responsavel: resp('Fernanda Oliveira', 456789123, 'Mãe', '(81) 99654-0098', 'fernanda.oliveira@email.com'),
      emailEnviadoEm: '2026-11-19T19:02:00-03:00', confirmadoEm: '2026-11-19T21:47:00-03:00', token: 'tk-ana-11c0',
      log: [
        { data: '2026-11-19T19:02:00-03:00', evento: 'E-mail de autorização enviado para fernanda.oliveira@email.com.' },
        { data: '2026-11-19T21:47:00-03:00', evento: 'Responsável clicou em "Autorizar Participação do Estudante" (IP 189.40.xx.xx).' }
      ] },
    { userId: 'u-vinicius', status: 'nao_enviada', log: [] },
    { userId: 'u-beatriz', status: 'nao_necessaria', log: [] },
    { userId: 'u-eduardo', status: 'assinatura', metodo: 'assinatura',
      responsavel: resp('José Carlos Alves', 321654987, 'Tutor Legal', '(81) 99120-7765', 'jose.alves@email.com'),
      assinatura: assinatura('José C. Alves', 4), assinadoEm: '2026-11-20T16:05:00-03:00',
      log: [{ data: '2026-11-20T16:05:00-03:00', evento: 'Assinatura digital registrada na tela (dispositivo do aluno).' }] },
    { userId: 'u-malu', status: 'email', metodo: 'email',
      responsavel: resp('Patrícia Rocha', 741852963, 'Mãe', '(81) 99743-2201', 'patricia.rocha@email.com'),
      emailEnviadoEm: '2026-11-02T10:00:00-03:00', confirmadoEm: '2026-11-02T12:31:00-03:00', token: 'tk-malu-5d1e',
      log: [
        { data: '2026-11-02T10:00:00-03:00', evento: 'E-mail de autorização enviado para patricia.rocha@email.com.' },
        { data: '2026-11-02T12:31:00-03:00', evento: 'Responsável clicou em "Autorizar Participação do Estudante".' }
      ] },
    { userId: 'u-rafael', status: 'assinatura', metodo: 'assinatura',
      responsavel: resp('Sérgio Melo', 852963741, 'Pai', '(81) 98444-1022', 'sergio.melo@email.com'),
      assinatura: assinatura('Sérgio Melo', 3), assinadoEm: '2026-10-28T08:40:00-03:00',
      log: [{ data: '2026-10-28T08:40:00-03:00', evento: 'Assinatura digital registrada na tela.' }] },
    { userId: 'u-julia', status: 'assinatura', metodo: 'assinatura',
      responsavel: resp('Renata Andrade', 963741852, 'Mãe', '(81) 99331-5588', 'renata.andrade@email.com'),
      assinatura: assinatura('Renata Andrade', 5), assinadoEm: '2026-10-30T18:15:00-03:00',
      log: [{ data: '2026-10-30T18:15:00-03:00', evento: 'Assinatura digital registrada na tela.' }] },
    { userId: 'u-pedro', status: 'email', metodo: 'email',
      responsavel: resp('Luciana Cavalcanti', 159753486, 'Mãe', '(81) 98123-9090', 'luciana.cavalcanti@email.com'),
      emailEnviadoEm: '2026-10-25T11:00:00-03:00', confirmadoEm: '2026-10-25T13:12:00-03:00', token: 'tk-pedro-77aa',
      log: [
        { data: '2026-10-25T11:00:00-03:00', evento: 'E-mail de autorização enviado para luciana.cavalcanti@email.com.' },
        { data: '2026-10-25T13:12:00-03:00', evento: 'Responsável clicou em "Autorizar Participação do Estudante".' }
      ] },
    { userId: 'u-larissa', status: 'assinatura', metodo: 'assinatura',
      responsavel: resp('Adriana Barros', 357159486, 'Mãe', '(81) 99007-3344', 'adriana.barros@email.com'),
      assinatura: assinatura('Adriana Barros', 9), assinadoEm: '2026-11-05T20:20:00-03:00',
      log: [{ data: '2026-11-05T20:20:00-03:00', evento: 'Assinatura digital registrada na tela.' }] },
    { userId: 'u-thiago', status: 'nao_enviada', log: [] },
    { userId: 'u-camila', status: 'email', metodo: 'email',
      responsavel: resp('Roberta Nunes', 258456951, 'Mãe', '(81) 98600-7171', 'roberta.nunes@email.com'),
      emailEnviadoEm: '2026-11-10T15:00:00-03:00', confirmadoEm: '2026-11-10T15:40:00-03:00', token: 'tk-camila-2b9c',
      log: [
        { data: '2026-11-10T15:00:00-03:00', evento: 'E-mail de autorização enviado para roberta.nunes@email.com.' },
        { data: '2026-11-10T15:40:00-03:00', evento: 'Responsável clicou em "Autorizar Participação do Estudante".' }
      ] }
  ];

  var EQUIPES = [
    { id: 'eq-damas', nome: 'DAMAS Phoenix', capitao: 'u-mariana', escola: 'Colégio Damas da Instrução Cristã',
      participantes: ['Mariana Costa', 'Larissa Barros', 'Clara Menezes', 'Sofia Lins', 'Helena Torres'], criadaEm: '2026-11-12T10:00:00-03:00' },
    { id: 'eq-gge', nome: 'GGE Titans', capitao: 'u-malu', escola: 'Colégio GGE',
      participantes: ['Maria Luiza Rocha', 'Vinícius Lima', 'Arthur Pessoa', 'Davi Moura', 'Igor Farias'], criadaEm: '2026-11-08T17:20:00-03:00' },
    { id: 'eq-cefet', nome: 'CEFET Byte', capitao: 'u-ana', escola: 'CEFET-PE',
      participantes: ['Ana Oliveira', 'Thiago Ferreira', 'Bruno Galvão', 'Kauã Ribeiro', 'Lívia Dantas'], criadaEm: '2026-11-09T09:45:00-03:00' },
    { id: 'eq-eteram', nome: 'ETERAM Storm', capitao: 'u-lucas', escola: 'ETERAM',
      participantes: ['Lucas Santos', 'Matheus Araújo', 'Caio Bezerra', 'Yasmin Leal'], criadaEm: '2026-11-14T14:10:00-03:00' },
    { id: 'eq-csm', nome: 'Santa Maria Mid', capitao: 'u-rafael', escola: 'Colégio Santa Maria',
      participantes: ['Rafael Melo', 'Júlia Andrade', 'Enzo Quirino', 'Gustavo Peixoto', 'Alice Brandão'], criadaEm: '2026-11-01T11:30:00-03:00' },
    { id: 'eq-epbm', nome: 'EPBM Sul Fragers', capitao: 'u-eduardo', escola: 'EPBM Sul',
      participantes: ['Eduardo Alves', 'Pedro Cavalcanti', 'Henrique Lopes', 'Murilo Castro', 'Nicolas Sá'], criadaEm: '2026-11-16T08:00:00-03:00' }
  ];

  function p(a, b, pa, pb) { return { a: a, b: b, pa: pa == null ? null : pa, pb: pb == null ? null : pb }; }
  var TBD = 'A definir';

  var CAMPEONATOS = [
    {
      id: 'valorant-abertura', jogo: 'valorant', status: 'aberta', modo: 'equipe',
      titulo: 'Copa FEDEPE Valorant 2026 — Abertura',
      descricao: 'O maior campeonato de Valorant escolar de Pernambuco. Escolas de todo o estado se enfrentam em partidas táticas e emocionantes para conquistar o título estadual.',
      inicio: '2026-12-15', fim: '2027-01-08', prazo: '2026-12-10',
      formato: 'Eliminatória simples', vagas: 32, ocupadasBase: 21,
      premiacao: 'Medalhas + Certificado + XP', xp: 5000,
      regras: ['Times de 5 jogadores + 1 reserva', 'Jogadores devem ser alunos regularmente matriculados', 'Menores de 18 anos precisam da autorização dos pais/responsáveis',
               'Partidas em MD1 até a semifinal; final em MD3', 'Anti-cheat Riot Vanguard obrigatório'],
      chave: [
        { fase: 'Oitavas', partidas: [p('DAMAS Phoenix', 'Col. São Paulo'), p('CEFET Byte', 'EPBM Sul Fragers'), p('GGE Titans', 'ETE Cícero Dias'), p('ETERAM Storm', 'Santa Maria Mid')] },
        { fase: 'Quartas', partidas: [p(TBD, TBD), p(TBD, TBD)] },
        { fase: 'Final', partidas: [p(TBD, TBD)] }
      ]
    },
    {
      id: 'lol-liga-s1', jogo: 'lol', status: 'aberta', modo: 'equipe',
      titulo: 'Liga FEDEPE — League of Legends S1',
      descricao: 'Primeira temporada da Liga FEDEPE de League of Legends. Quatro grupos com partidas semanais e playoffs presenciais no Recife.',
      inicio: '2026-12-20', fim: '2027-02-14', prazo: '2026-12-15',
      formato: 'Fase de grupos + Playoffs', vagas: 16, ocupadasBase: 14,
      premiacao: 'Troféu + Medalhas + Certificado + XP', xp: 8000,
      regras: ['Times de 5 jogadores + 1 reserva', 'Contas com nível 30 ou superior', 'Menores de 18 anos precisam da autorização dos pais/responsáveis',
               'Fase de grupos em MD1; playoffs em MD3', 'Draft em modo torneio'],
      chave: [
        { fase: 'Quartas', partidas: [p(TBD, TBD), p(TBD, TBD), p(TBD, TBD), p(TBD, TBD)] },
        { fase: 'Semifinal', partidas: [p(TBD, TBD), p(TBD, TBD)] },
        { fase: 'Final', partidas: [p(TBD, TBD)] }
      ]
    },
    {
      id: 'cs2-inverno', jogo: 'cs2', status: 'aberta', modo: 'equipe',
      titulo: 'Torneio CS2 Inverno FEDEPE',
      descricao: 'Torneio de Counter-Strike 2 no formato suíço, com os 8 melhores avançando para a eliminatória.',
      inicio: '2027-01-10', fim: '2027-01-31', prazo: '2027-01-05',
      formato: 'Suíço + Eliminatória', vagas: 24, ocupadasBase: 19,
      premiacao: 'Medalhas + Certificado + XP', xp: 4000,
      regras: ['Times de 5 jogadores + 1 reserva', 'Jogadores devem ser alunos regularmente matriculados', 'Menores de 18 anos precisam da autorização dos pais/responsáveis',
               'Pool de mapas Active Duty', 'Anti-cheat VAC ativo'],
      chave: [
        { fase: 'Quartas', partidas: [p(TBD, TBD), p(TBD, TBD), p(TBD, TBD), p(TBD, TBD)] },
        { fase: 'Semifinal', partidas: [p(TBD, TBD), p(TBD, TBD)] },
        { fase: 'Final', partidas: [p(TBD, TBD)] }
      ]
    },
    {
      id: 'fortnite-duos-verao', jogo: 'fortnite', status: 'aberta', modo: 'solo',
      titulo: 'Copa Fortnite FEDEPE — Verão Solo',
      descricao: 'Seis quedas valendo pontos por eliminação e colocação. Os 20 melhores avançam para a grande final transmitida ao vivo.',
      inicio: '2026-12-27', fim: '2026-12-29', prazo: '2026-12-20',
      formato: 'Pontos por eliminação + colocação', vagas: 100, ocupadasBase: 63,
      premiacao: 'Medalhas + Certificado + XP', xp: 3000,
      regras: ['Participação individual (solo)', 'Jogadores devem ser alunos regularmente matriculados', 'Menores de 18 anos precisam da autorização dos pais/responsáveis',
               '6 quedas por rodada', 'Proibido teaming — desclassificação imediata'],
      chave: [
        { fase: 'Qualificatória', partidas: [p('Lobby A', 'Lobby B'), p('Lobby C', 'Lobby D')] },
        { fase: 'Semifinal', partidas: [p(TBD, TBD)] },
        { fase: 'Final', partidas: [p('Top 20', '')] }
      ]
    },
    {
      id: 'valorant-duos', jogo: 'valorant', status: 'andamento', modo: 'equipe',
      titulo: 'FEDEPE Open — Valorant Duos',
      descricao: 'Campeonato aberto de Valorant em duplas, com partidas no modo Duelo Personalizado.',
      inicio: '2026-11-10', fim: '2026-12-05', prazo: '2026-11-05',
      formato: 'Eliminatória dupla', vagas: 32, ocupadasBase: 32,
      premiacao: 'Medalhas + XP', xp: 2500,
      regras: ['Duplas de jogadores', 'Jogadores devem ser alunos regularmente matriculados', 'Anti-cheat Riot Vanguard obrigatório'],
      chave: [
        { fase: 'Oitavas', partidas: [p('DAMAS Phoenix', 'Col. São Paulo', 13, 8), p('GGE Titans', 'ETE Cícero Dias', 13, 11), p('CEFET Byte', 'EPBM Sul Fragers', 9, 13), p('ETERAM Storm', 'Santa Maria Mid', 13, 6)] },
        { fase: 'Quartas', partidas: [p('DAMAS Phoenix', 'GGE Titans'), p('EPBM Sul Fragers', 'ETERAM Storm')] },
        { fase: 'Final', partidas: [p(TBD, TBD)] }
      ]
    },
    {
      id: 'cs2-copa-recife', jogo: 'cs2', status: 'andamento', modo: 'equipe',
      titulo: 'Copa Recife CS2 Escolar',
      descricao: 'Disputa regional da Região Metropolitana do Recife em formato de grupos.',
      inicio: '2026-11-01', fim: '2026-12-12', prazo: '2026-10-25',
      formato: 'Fase de grupos + Playoffs', vagas: 16, ocupadasBase: 16,
      premiacao: 'Medalhas + Certificado + XP', xp: 3500,
      regras: ['Times de 5 jogadores + 1 reserva', 'Partidas em MD3', 'Anti-cheat VAC ativo'],
      chave: [
        { fase: 'Quartas', partidas: [p('EPBM Sul Fragers', 'CEFET Byte', 2, 1), p('GGE Titans', 'Santa Maria Mid', 2, 0), p('DAMAS Phoenix', 'ETERAM Storm', 1, 2), p('Col. São Paulo', 'ETE Cícero Dias', 2, 1)] },
        { fase: 'Semifinal', partidas: [p('EPBM Sul Fragers', 'GGE Titans'), p('ETERAM Storm', 'Col. São Paulo')] },
        { fase: 'Final', partidas: [p(TBD, TBD)] }
      ]
    },
    {
      id: 'fortnite-solo', jogo: 'fortnite', status: 'encerrado', modo: 'solo',
      titulo: 'Copa Fortnite FEDEPE — Solo',
      descricao: 'Copa de Fortnite no formato solo, com pontuação por eliminações e colocação. Campeão: PedroBuild (ETE Cícero Dias).',
      inicio: '2026-09-05', fim: '2026-09-07', prazo: '2026-08-30',
      formato: 'Pontos por eliminação + colocação', vagas: 64, ocupadasBase: 64,
      premiacao: 'Medalhas + XP', xp: 3000,
      regras: ['Participação individual', 'Jogadores devem ser alunos regularmente matriculados'],
      chave: [
        { fase: 'Semifinal', partidas: [p('Lobby A', 'Lobby B')] },
        { fase: 'Final', partidas: [p('PedroBuild', 'BiaStorm', 87, 74)] }
      ]
    },
    {
      id: 'lol-copa-agreste', jogo: 'lol', status: 'encerrado', modo: 'equipe',
      titulo: 'Copa Agreste de League of Legends',
      descricao: 'Edição de inverno com escolas do Agreste e da RMR. Campeã: Santa Maria Mid.',
      inicio: '2026-07-04', fim: '2026-08-15', prazo: '2026-06-28',
      formato: 'Eliminatória simples', vagas: 16, ocupadasBase: 16,
      premiacao: 'Troféu + Medalhas + XP', xp: 6000,
      regras: ['Times de 5 jogadores + 1 reserva', 'Partidas em MD1; final em MD3'],
      chave: [
        { fase: 'Quartas', partidas: [p('Santa Maria Mid', 'ETERAM Storm', 1, 0), p('GGE Titans', 'CEFET Byte', 1, 0), p('DAMAS Phoenix', 'Col. São Paulo', 1, 0), p('EPBM Sul Fragers', 'ETE Cícero Dias', 0, 1)] },
        { fase: 'Semifinal', partidas: [p('Santa Maria Mid', 'GGE Titans', 1, 0), p('DAMAS Phoenix', 'ETE Cícero Dias', 1, 0)] },
        { fase: 'Final', partidas: [p('Santa Maria Mid', 'DAMAS Phoenix', 2, 1)] }
      ]
    }
  ];

  var INSCRICOES = [
    { id: 'in-1', campId: 'valorant-abertura', userId: 'u-mariana', equipeId: 'eq-damas', data: '2026-11-15T10:00:00-03:00' },
    { id: 'in-2', campId: 'valorant-abertura', userId: 'u-malu', equipeId: 'eq-gge', data: '2026-11-16T11:20:00-03:00' },
    { id: 'in-3', campId: 'valorant-abertura', userId: 'u-ana', equipeId: 'eq-cefet', data: '2026-11-17T18:05:00-03:00' },
    { id: 'in-4', campId: 'lol-liga-s1', userId: 'u-rafael', equipeId: 'eq-csm', data: '2026-11-11T09:00:00-03:00' },
    { id: 'in-5', campId: 'cs2-inverno', userId: 'u-eduardo', equipeId: 'eq-epbm', data: '2026-11-19T15:15:00-03:00' }
  ];

  var TRANSMISSOES = {
    aoVivo: {
      id: 'live-final-valorant', jogo: 'valorant', youtube: '',
      titulo: 'Grand Final — Copa FEDEPE Valorant Abertura DAMAS x GGE',
      descricao: 'A grande final da Copa FEDEPE Valorant 2026 Abertura. Colégio DAMAS x GGE em uma série MD3 decidida em Ascent, Lotus e Bind.',
      timeA: 'DAMAS', timeB: 'GGE', placar: '1 × 1', mapa: 'Mapa 3 · Bind', espectadores: 1240,
      canal: 'https://www.youtube.com/results?search_query=Copa+FEDEPE+de+Esports'
    },
    vods: [
      { id: 'vod-1', jogo: 'lol', youtube: '', titulo: 'Semifinal Liga LoL — CEFET-PE vs EREM Carneiro', timeA: 'CEFET', timeB: 'EREM', data: '2026-10-10', duracao: '1:42:18', views: 3820 },
      { id: 'vod-2', jogo: 'cs2', youtube: '', titulo: 'Torneio CS2 — Fase Suíça Rodada 3', timeA: 'EPBM', timeB: 'GGE', data: '2026-10-08', duracao: '2:05:44', views: 2950 },
      { id: 'vod-3', jogo: 'fortnite', youtube: '', titulo: 'Copa Fortnite Solo — Melhores Momentos', timeA: 'TOP', timeB: '20', data: '2026-10-05', duracao: '0:18:32', views: 6110 },
      { id: 'vod-4', jogo: 'valorant', youtube: '', titulo: 'Quartas de Final — FEDEPE Open Duos', timeA: 'DAMAS', timeB: 'CSP', data: '2026-10-02', duracao: '1:12:09', views: 4480 },
      { id: 'vod-5', jogo: 'lol', youtube: '', titulo: 'Análise Tática: Fase de Grupos Liga LoL', timeA: 'LIGA', timeB: 'S1', data: '2026-09-29', duracao: '0:34:51', views: 1790 },
      { id: 'vod-6', jogo: 'cs2', youtube: '', titulo: 'Copa Recife CS2 — Quartas: EPBM Sul x CEFET-PE', timeA: 'EPBM', timeB: 'CEFET', data: '2026-11-14', duracao: '2:21:03', views: 3305 },
      { id: 'vod-7', jogo: 'valorant', youtube: '', titulo: 'Semifinal Copa Valorant — ETERAM x Santa Maria', timeA: 'ETERAM', timeB: 'CSM', data: '2026-11-20', duracao: '1:38:27', views: 5240 },
      { id: 'vod-8', jogo: 'fortnite', youtube: '', titulo: 'Fortnite — Final Solo: a vitória de PedroBuild', timeA: 'FINAL', timeB: 'SOLO', data: '2026-09-07', duracao: '1:05:12', views: 7020 }
    ]
  };

  window.FEDEPE_SEED = function () {
    return JSON.parse(JSON.stringify({
      versao: 2,
      escolas: ESCOLAS,
      usuarios: USUARIOS,
      autorizacoes: AUTORIZACOES,
      equipes: EQUIPES,
      campeonatos: CAMPEONATOS,
      inscricoes: INSCRICOES,
      transmissoes: TRANSMISSOES
    }));
  };
})();
