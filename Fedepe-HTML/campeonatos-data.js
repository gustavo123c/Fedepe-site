/* campeonatos-data.js — dados dos campeonatos (futuramente virão do banco de dados).
   "prazo" (AAAA-MM-DD) é o último dia de inscrição, usado nas regras; "inscricoesAte" é só o texto exibido.
   Datas dos campeonatos abertos estão no futuro de propósito, para testes.
   O "id" é usado na URL: inscricao.html?id=valorant-abertura
   Campos marcados com "A definir" / descrição genérica: preencher com os dados reais. */
const CAMPEONATOS = [
  {
    id: 'valorant-abertura', jogo: 'valorant', jogoNome: 'VALORANT', status: 'aberta',
    titulo: 'Copa FEDEPE Valorant 2026 — Abertura',
    descricao: 'O maior campeonato de Valorant escolar de Pernambuco. Escolas de todo o estado se enfrentam em partidas táticas e emocionantes para conquistar o título estadual.',
    inicio: '15 Dez 2026', fim: '08 Jan 2027', inscricoesAte: '10 Dez 2026', prazo: '2026-12-10',
    formato: 'Eliminatória simples', vagas: '24/32', premiacao: 'Medalhas + Certificado + 5.000 XP',
    regras: ['Times de 5 jogadores + 1 reserva', 'Jogadores devem ser alunos matriculados', 'Mínimo 15 anos de idade',
             'Partidas no formato BO1 até semi; BO3 final', 'Anti-cheat Riot Vanguard obrigatório'],
    chave: [
      { fase: 'Oitavas', times: ['ETEPAM', 'Col. São Paulo', 'CEFET-PE', 'EREM Sul'] },
      { fase: 'Quartas', times: ['TBD', 'TBD'] },
      { fase: 'Final',   times: ['TBD'] }
    ]
  },
  {
    id: 'lol-liga-s1', jogo: 'lol', jogoNome: 'LEAGUE OF LEGENDS', status: 'aberta',
    titulo: 'Liga FEDEPE — League of Legends S1',
    descricao: 'Primeira temporada da Liga FEDEPE de League of Legends para estudantes de Pernambuco. Descrição completa em breve.',
    inicio: '20 Dez 2026', fim: 'A definir', inscricoesAte: '15 Dez 2026', prazo: '2026-12-15',
    formato: 'Fase de grupos + Playoffs', vagas: '16/16', premiacao: 'Troféu + Medalhas + 8.000 XP',
    regras: ['Times de 5 jogadores + 1 reserva', 'Jogadores devem ser alunos matriculados', 'Mínimo 15 anos de idade']
  },
  {
    id: 'cs2-inverno', jogo: 'cs2', jogoNome: 'COUNTER-STRIKE 2', status: 'aberta',
    titulo: 'Torneio CS2 Inverno FEDEPE',
    descricao: 'Torneio de Counter-Strike 2 da Copa FEDEPE para estudantes de Pernambuco. Descrição completa em breve.',
    inicio: '10 Jan 2027', fim: 'A definir', inscricoesAte: '05 Jan 2027', prazo: '2027-01-05',
    formato: 'Suíço + Eliminatória', vagas: '20/24', premiacao: 'Medalhas + 4.000 XP',
    regras: ['Times de 5 jogadores + 1 reserva', 'Jogadores devem ser alunos matriculados', 'Mínimo 15 anos de idade', 'Anti-cheat VAC ativo']
  },
  {
    id: 'fortnite-solo', jogo: 'fortnite', jogoNome: 'FORTNITE', status: 'encerrado',
    titulo: 'Copa Fortnite FEDEPE — Solo',
    descricao: 'Copa de Fortnite no formato solo, com pontuação por eliminações e colocação. Descrição completa em breve.',
    inicio: '05 Set 2026', fim: 'A definir', inscricoesAte: 'A definir',
    formato: 'Pontos kills + placement', vagas: '64/64', premiacao: 'Medalhas + 3.000 XP',
    regras: ['Participação individual', 'Jogadores devem ser alunos matriculados', 'Mínimo 15 anos de idade']
  },
  {
    id: 'valorant-duos', jogo: 'valorant', jogoNome: 'VALORANT', status: 'andamento',
    titulo: 'FEDEPE Open — Valorant Duos',
    descricao: 'Campeonato aberto de Valorant em duplas da Copa FEDEPE. Descrição completa em breve.',
    inicio: '22 Set 2026', fim: 'A definir', inscricoesAte: 'A definir',
    formato: 'Eliminatória dupla', vagas: '32/32', premiacao: 'Medalhas + 2.500 XP',
    regras: ['Duplas de jogadores', 'Jogadores devem ser alunos matriculados', 'Mínimo 15 anos de idade', 'Anti-cheat Riot Vanguard obrigatório']
  }
];