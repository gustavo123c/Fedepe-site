# Copa FEDEPE de Esports

Site da Copa FEDEPE de Esports (Federação do Desporto Escolar de Pernambuco) — Temporada 2026.
HTML, CSS e JavaScript puros, sem etapa de build. Tudo funciona com um **banco de dados mockado** salvo no `localStorage` do navegador.

## Como rodar

Abra `Fedepe-HTML/index.html` no navegador, ou sirva a pasta (recomendado):

```bash
cd Fedepe-HTML
python3 -m http.server 8000
# acesse http://localhost:8000
```

## Acessos de teste

Na tela de login há botões de **acesso rápido**:

| Perfil | Nome | RA/Matrícula | Senha |
|---|---|---|---|
| Aluno demo (17 anos, sem equipe e sem autorização) | Gabriel Silva | `2026001` | `demo1234` |
| Administrador | Coordenação FEDEPE | `ADMIN` | `Fedepe2026` |

Os demais alunos fictícios usam a senha `demo1234`. O botão **“Resetar dados demo”** no rodapé restaura o estado inicial.

## Páginas

| Página | Arquivo | O que faz |
|---|---|---|
| Início | `index.html` | Hero, modalidades clicáveis (filtram os campeonatos), próximos campeonatos e transmissão ao vivo |
| Campeonatos | `campeonatos.html` | Filtros combináveis por jogo e status (também via URL: `?jogo=valorant&status=aberta`) |
| Detalhes / inscrição | `inscricao.html?id=...` | Informações, regras, chaveamento e **Confirmar inscrição** com regras de negócio |
| Transmissões | `transmissoes.html` | Player ao vivo, filtro por jogo e grade de partidas gravadas |
| Ranking | `ranking.html` | Pódio, filtro por modalidade e tabela com busca |
| Login / Cadastro | `login.html`, `cadastro.html` | Abas Entrar/Criar conta; cadastro com etapa de autorização dos responsáveis |
| Meu perfil | `perfil.html` | Estatísticas, editar perfil, status da autorização, equipe, inscrições e criação de equipe |
| Painel ADM | `admin.html` | Validação de cadastros (Aprovado/Reprovado) com comprovante da autorização parental |

## Regras de negócio da inscrição

Ao clicar em **Confirmar inscrição** o sistema verifica, nesta ordem: login → inscrições abertas e dentro do prazo → não inscrito ainda → cadastro não reprovado → equipe (em campeonatos por equipe, apenas o capitão inscreve) → **autorização dos pais/responsáveis** (menores de 18 anos) → vagas.
Se faltar a autorização, o fluxo de autorização abre na hora e a inscrição é concluída automaticamente quando ela for aprovada.

## Autorização dos pais/responsáveis

Componente reutilizável em `js/ui/parental-auth.js`, usado no cadastro, no perfil e na inscrição:

- Dados do responsável: nome, CPF (com máscara e validação), parentesco, WhatsApp e e-mail, junto do resumo do termo.
- **Assinatura digital na tela**: `<canvas>` com mouse e toque, botões *Limpar* e *Confirmar Assinatura*. A imagem é salva em Base64 com data e hora → status **Autorizado (Assinatura Digital)** e comprovante.
- **Autorização por e-mail**: envio simulado → status **Aguardando confirmação por e-mail**. O botão *Simular aprovação no e-mail do responsável* abre a prévia do e-mail institucional; ao clicar em *Autorizar Participação do Estudante*, o status passa a **Autorizado (Via E-mail)**.

As mudanças aparecem em tempo real no perfil e no Painel ADM, inclusive entre abas diferentes (evento `storage`).

## Estrutura

```
Fedepe-HTML/
├── js/
│   ├── mock/database.js      # seed: escolas, alunos, equipes, campeonatos, chaveamentos, transmissões, autorizações
│   ├── services/mockApi.js   # "backend": localStorage, latência simulada, regras de negócio, eventos de mudança
│   └── ui/
│       ├── layout.js         # cabeçalho, rodapé, modal, toast e utilitários
│       └── parental-auth.js  # ParentalAuthorizationModal
├── img/                      # brasão da FEDEPE, ícones e banners dos jogos
├── style.css                 # tema escuro com as cores da FEDEPE (responsivo)
└── *.html
```

### Trocando o mock por um backend real (ex.: Back4App)

Todas as páginas falam somente com `window.Api` (`js/services/mockApi.js`). Para usar um banco real, reimplemente essas funções com `fetch()` mantendo os mesmos retornos (`{ ok: true, ... }` ou `{ ok: false, erro, motivo }`). As páginas não precisam mudar.

> O hash de senha no mock serve apenas para demonstração. Em produção, a autenticação e o hash (bcrypt/argon2) devem ficar no servidor.

## Próximos passos

- Backend real (Back4App) no lugar do `mockApi.js`
- Envio real de e-mails de autorização (link com token)
- Edição de campeonatos e chaveamentos pelo Painel ADM
