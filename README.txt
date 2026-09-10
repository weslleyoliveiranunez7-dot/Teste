PROJECT BLUE LOCK — Fase 1, Dia 1: Menu Principal
====================================================

O QUE TEM NESTE PACOTE
-----------------------
index.html          -> estrutura de todas as telas
css/style.css        -> visual (paleta azul marinho + azul elétrico, inspirado no anime)
js/data.js            -> formato do save (localStorage) — base pra próximas fases
js/audio.js           -> sistema de áudio preparado (som de clique via WebAudio)
js/app.js             -> navegação entre telas, estado, botão voltar, continue, etc.
assets/logo.png       -> a logo que você enviou

TELAS PRONTAS
-------------
- Splash (toque pra entrar)
- Menu Principal (Nova Carreira / Continuar / Meu Jogador / Seleções / Mundo / Configurações)
- Nova Carreira -> cria um save vazio (o draft de verdade entra na Fase 2/3)
- Continuar -> só fica ativo se existir um save salvo
- Meu Jogador, Seleções, Mundo -> telas "em construção" (conteúdo vem nas próximas fases)
- Configurações -> funcional de verdade: volume de música, volume de efeitos, mudo, e botão pra apagar o save

SISTEMAS JÁ IMPLEMENTADOS
--------------------------
- Navegação entre telas com transição suave
- Estado da aplicação (sabe em qual tela você está e de onde veio)
- Botão Voltar em toda tela secundária + suporte ao botão físico/gesto de voltar do celular
- Detecção automática de save (localStorage)
- Criação de novo save com confirmação se já existir um
- Configurações persistentes (ficam salvas mesmo fechando o navegador)
- Layout mobile-first, testado em telas pequenas
- Sistema de áudio preparado (clique nos botões); música e efeitos de verdade entram depois

COMO TESTAR NO CELULAR
------------------------
1. Extraia o zip.
2. Suba a pasta inteira pro GitHub Pages (mesmo processo que você já usa no outro projeto) OU
   abra o index.html direto pelo Chrome do celular (funciona, mas o ideal é hospedar, porque
   o próximo passo do jogo vai precisar de internet pra Firebase).
3. Toque na tela de splash pra entrar no menu.
4. Toque em "NOVA CARREIRA" -> "CONFIRMAR NOVA CARREIRA": repare que "CONTINUAR" fica
   habilitado depois disso.
5. Entre em "CONFIGURAÇÕES", mexa nos volumes e no mudo, feche o navegador e abra de novo:
   as configurações continuam como você deixou.
6. Teste o botão de voltar do próprio Android/Chrome dentro de qualquer tela secundária.

DIA 2 — SISTEMA DE SAVE (js/data.js)
--------------------------------------
O save da carreira agora tem o formato completo:
careerId, player, progress, selection, ranking, statistics, money,
relationships, inventory, history, settings.

Operações disponíveis:
- criarNovoSave()  -> gera uma carreira nova com todos os campos zerados
- salvarSave(save) -> grava o save e mantém uma cópia de backup automática
- obterSave()      -> carrega o save; se o principal estiver corrompido,
                       recupera sozinho a partir do backup
- apagarSave()     -> apaga carreira e backup
- migrarSave(save) -> atualiza saves antigos (ex: do Dia 1) pro formato novo
                       sem perder o progresso já salvo
- versaoSave       -> todo save carrega a versão do formato (hoje: 2)

Isso já está ligado no botão "NOVA CARREIRA" e em "CONTINUAR"/"APAGAR SAVE"
das telas que você já testou. As telas de conteúdo (Meu Jogador, etc.) ainda
não leem esses campos na interface — isso vem quando o draft de verdade for
implementado.

DIA 3 — CRIAÇÃO DO JOGADOR
----------------------------
A tela "NOVA CARREIRA" agora é um formulário completo: nome, apelido, idade,
cidade, posição, pé dominante, altura, estilo visual, avatar (grade de ícones)
e personalidade (grade com descrição). Ao confirmar, os dados são validados
e viram a ficha do jogador dentro do save (banco de dados em js/data.js:
POSICOES, PES_DOMINANTES, ESTILOS_VISUAIS, AVATARES, PERSONALIDADES,
criarJogador() e validarJogador()). versaoSave subiu pra 3; saves antigos são
migrados automaticamente, completando os campos novos.
A tela "MEU JOGADOR" agora mostra a ficha de verdade (avatar, apelido, nome,
posição, idade, altura, pé, cidade, estilo e personalidade) quando existe um
jogador criado.

PRÓXIMOS PASSOS (fora deste pacote)
------------------------------------
- Fase 1 continua com o restante da fundação (ainda dentro da Fase 1, conforme for pedindo)
- Status/atributos e overall de verdade (o draft completo) entram quando você pedir a próxima etapa

DIA 5 — ATRIBUTOS (SISTEMA MATEMÁTICO COMPLETO)
--------------------------------------------------
Os 6 atributos soltos do Dia 4 viraram 19 atributos reais, organizados
em 4 categorias (js/data.js: ATRIBUTOS_DEFINICOES):
  Técnicos -> finalização, passe, drible, domínio, cruzamento
  Físicos  -> velocidade, aceleração, força, resistência, equilíbrio
  Mentais  -> visão, posicionamento, decisão, concentração, reação
  Ego      -> ambição, confiança, competitividade, pressão

MATEMÁTICA POR TRÁS:
- gerarAtributosIniciais(posicao) sorteia cada atributo dentro de uma
  faixa que depende do peso da posição pra aquela categoria (um
  Centroavante nasce com Técnico/Ego mais fortes; um Zagueiro nasce
  com Físico/Mental mais fortes) -> POSICAO_PESOS define isso pra
  todas as 10 posições.
- calcularOverall(atributos, posicao) tira a média de cada categoria
  e pondera pelos mesmos pesos da posição, gerando o Overall real do
  jogador (1 a 99) -- antes esse campo ficava sempre null.
- calcularArma(atributos) encontra o atributo mais alto do jogador e
  devolve um nome de "arma" (ex: "Chute Fatal", "Reflexo Sobre-humano")
  -- a ficha agora mostra a arma de verdade em vez de "???".
- migrarAtributosParaCategorias() converte saves antigos (Dia 4) pro
  novo formato sem perder o que já existia (ex: "velocidade" antiga
  vira "fisico.velocidade"). versaoSave subiu pra 5; a migração é
  automática ao carregar um save antigo.

TELA "MEU JOGADOR" -> aba Atributos:
- Destaque no topo com OVERALL, EGO (despertar) e POTENCIAL.
- As 4 categorias aparecem em blocos separados, cada uma com a média
  da categoria no cabeçalho e uma barra por atributo.
- A aba Geral agora mostra o Overall e a Arma calculados de verdade.

Esses 19 números são a base real que a simulação de partidas (fases
futuras) vai usar pra decidir duelos, chances de gol, passes certos, etc.

PRÓXIMOS PASSOS (fora deste pacote)
------------------------------------
- Sistema de duelos/simulação de partida usando os atributos de verdade
- Evolução dos atributos por treino/jogo (XP alimentando os números)
