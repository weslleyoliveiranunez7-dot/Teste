/* ============================================
   PROJECT BLUE LOCK — sistema de save (Dia 2)
   Define o formato completo da carreira e todas
   as operações de salvar/carregar/apagar/recuperar.
   Conteúdo real (draft, partidas, etc.) preenche
   estes campos nas próximas fases — aqui é a base.
   ============================================ */

const SAVE_VERSAO_ATUAL = 5;

const SAVE_KEY = "blueLockSave";              // save principal
const SAVE_BACKUP_KEY = "blueLockSaveBackup"; // cópia de segurança
const SETTINGS_KEY = "blueLockSettings";      // config de áudio do dispositivo (não é por carreira)

/* ---------- geração de id ---------- */

function gerarCareerId() {
  return "career_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

/* ---------- formato da carreira ---------- */

function criarNovoSave() {
  const agora = new Date().toISOString();
  return {
    careerId: gerarCareerId(),
    versaoSave: SAVE_VERSAO_ATUAL,
    criadoEm: agora,
    atualizadoEm: agora,

    player: {
      nome: null,
      apelido: null,
      idade: null,
      altura: null,
      cidade: null,
      posicao: null,
      peDominante: null,
      estiloVisual: null,
      avatar: null,
      personalidade: null,
      overall: null,
      nivel: 1,
      xp: 0,
      xpProximoNivel: 100,
      ego: null,
      potencial: null,
      arma: null,
      atributos: null // { velocidade, finalizacao, passe, drible, visao, fisico }
    },

    progress: {
      fase: "novo",       // etapa atual da carreira
      diasPassados: 0,
      temporada: 1
    },

    selection: {
      selecionado: false,
      selecaoAtual: null,
      convocacoes: []
    },

    ranking: {
      pontos: 0,
      colocacaoNacional: null,
      colocacaoMundial: null
    },

    statistics: {
      jogos: 0,
      gols: 0,
      assistencias: 0,
      notaMedia: null
    },

    money: {
      saldo: 0,
      historico: []
    },

    relationships: {
      rivais: [],
      aliados: [],
      reputacao: {}
    },

    inventory: {
      itens: [],
      equipamentoAtual: null
    },

    history: {
      eventos: []   // log de marcos da carreira, preenchido com o tempo
    },

    settings: {
      dificuldade: "normal",
      idioma: "pt-BR"
    }
  };
}

/* ---------- migração entre versões ---------- */
/* Quando o formato do save mudar no futuro, soma aqui
   a lógica pra completar campos que faltam num save antigo,
   sem apagar o progresso que já existe. */

function migrarSave(save) {
  if (!save || typeof save !== "object") return save;
  let s = save;

  if (!s.versaoSave || s.versaoSave < 2) {
    // save do formato antigo (Dia 1) -> completa com os campos novos
    const base = criarNovoSave();
    s = {
      ...base,
      ...s,
      careerId: s.careerId || base.careerId,
      player: { ...base.player, ...(s.player || {}) },
      progress: { ...base.progress, ...(s.career || {}), ...(s.progress || {}) },
      settings: { ...base.settings, ...(s.settings || {}) },
      versaoSave: 2
    };
    delete s.career; // campo antigo, substituído por "progress"
  }

  if (s.versaoSave < 3) {
    // save do Dia 2 -> completa a ficha do jogador com os campos do Dia 3
    const base = criarNovoSave();
    s = {
      ...s,
      player: { ...base.player, ...(s.player || {}) },
      versaoSave: 3
    };
  }

  if (s.versaoSave < 4) {
    // save do Dia 3 -> gera nível/XP/EGO/POTENCIAL/atributos pro jogador já existente
    const base = criarNovoSave();
    const p = { ...base.player, ...(s.player || {}) };
    if (p.nome && !p.atributos) {
      // save recém-chegado do Dia 3: ainda não tinha nenhum atributo,
      // então já nasce direto no formato completo (Dia 5)
      p.atributos = gerarAtributosIniciais(p.posicao);
      p.ego = gerarEgoInicial();
      p.potencial = gerarPotencialInicial();
      p.overall = calcularOverall(p.atributos, p.posicao);
      if (!p.arma) p.arma = calcularArma(p.atributos).nome;
    }
    s = { ...s, player: p, versaoSave: 4 };
  }

  if (s.versaoSave < 5) {
    // save do Dia 4 -> troca os 6 atributos soltos (formato antigo) pelo
    // sistema completo de 19 atributos em 4 categorias
    const p = { ...s.player };
    // só precisa migrar se ainda estiver no formato antigo (chaves soltas,
    // sem "tecnico"/"fisico"/"mental"/"ego" já separados)
    const jaEhNovoFormato = p.atributos && p.atributos.tecnico && typeof p.atributos.tecnico === "object";
    if (p.nome && !jaEhNovoFormato) {
      p.atributos = migrarAtributosParaCategorias(p.atributos, p.posicao);
      p.overall = calcularOverall(p.atributos, p.posicao);
      if (!p.arma) p.arma = calcularArma(p.atributos).nome;
    }
    s = { ...s, player: p, versaoSave: SAVE_VERSAO_ATUAL };
  }

  return s;
}

/* ---------- opções de criação de jogador (Dia 3) ---------- */

const POSICOES = [
  "Goleiro", "Zagueiro", "Lateral Direito", "Lateral Esquerdo",
  "Volante", "Meia", "Ponta Direita", "Ponta Esquerda",
  "Segundo Atacante", "Centroavante"
];

const PES_DOMINANTES = ["Destro", "Canhoto", "Ambidestro"];

const ESTILOS_VISUAIS = ["Clássico", "Ousado", "Discreto", "Extravagante", "Old School", "Moderno"];

const AVATARES = ["⚽", "🔵", "🦁", "🐺", "🔥", "⚡", "🎯", "🛡️", "👑", "🌟", "🥷", "🦅"];

const PERSONALIDADES = [
  { id: "egoista",        nome: "Egoísta",        desc: "Joga pra si, confia só nas próprias pernas." },
  { id: "estrategista",   nome: "Estrategista",    desc: "Lê o jogo antes de agir." },
  { id: "instintivo",     nome: "Instintivo",      desc: "Decide no impulso, sem pensar duas vezes." },
  { id: "lider",          nome: "Líder",           desc: "Puxa o time pelo exemplo." },
  { id: "lobo-solitario", nome: "Lobo Solitário",  desc: "Não depende de ninguém em campo." },
  { id: "workaholic",     nome: "Workaholic",      desc: "Treina além do necessário, sempre." }
];

/* ---------- sistema de atributos (Dia 5 — sistema matemático completo) ---------- */
/* 19 atributos em 4 categorias. Tudo aqui vira números que a simulação
   de partidas vai usar de verdade nas próximas fases. */

const ATRIBUTOS_DEFINICOES = {
  tecnico: {
    nome: "Técnico",
    atributos: {
      finalizacao: "Finalização",
      passe:       "Passe",
      drible:      "Drible",
      dominio:     "Domínio",
      cruzamento:  "Cruzamento"
    }
  },
  fisico: {
    nome: "Físico",
    atributos: {
      velocidade:  "Velocidade",
      aceleracao:  "Aceleração",
      forca:       "Força",
      resistencia: "Resistência",
      equilibrio:  "Equilíbrio"
    }
  },
  mental: {
    nome: "Mental",
    atributos: {
      visao:          "Visão",
      posicionamento: "Posicionamento",
      decisao:        "Decisão",
      concentracao:   "Concentração",
      reacao:         "Reação"
    }
  },
  ego: {
    nome: "Ego",
    atributos: {
      ambicao:         "Ambição",
      confianca:       "Confiança",
      competitividade: "Competitividade",
      pressao:         "Sob Pressão"
    }
  }
};

// nomes de "arma" (o atributo em que o jogador mais se destaca)
const ARMA_FLAVOR = {
  finalizacao: "Chute Fatal", passe: "Passe Cirúrgico", drible: "Drible Alucinante",
  dominio: "Domínio Absoluto", cruzamento: "Cruzamento Preciso",
  velocidade: "Velocidade Explosiva", aceleracao: "Explosão Imediata",
  forca: "Força Bruta", resistencia: "Fôlego Infinito", equilibrio: "Equilíbrio Perfeito",
  visao: "Visão de Jogo", posicionamento: "Posicionamento Cirúrgico", decisao: "Decisão Fria",
  concentracao: "Foco Absoluto", reacao: "Reflexo Sobre-humano",
  ambicao: "Fome de Vitória", confianca: "Confiança Inabalável",
  competitividade: "Instinto Competitivo", pressao: "Sangue Frio Sob Pressão"
};

// peso de cada categoria no overall, por posição (soma = 1 em cada linha)
const POSICAO_PESOS = {
  "Goleiro":              { tecnico: .15, fisico: .30, mental: .35, ego: .20 },
  "Zagueiro":             { tecnico: .20, fisico: .35, mental: .30, ego: .15 },
  "Lateral Direito":      { tecnico: .25, fisico: .35, mental: .25, ego: .15 },
  "Lateral Esquerdo":     { tecnico: .25, fisico: .35, mental: .25, ego: .15 },
  "Volante":              { tecnico: .25, fisico: .25, mental: .35, ego: .15 },
  "Meia":                 { tecnico: .35, fisico: .20, mental: .30, ego: .15 },
  "Ponta Direita":        { tecnico: .35, fisico: .30, mental: .20, ego: .15 },
  "Ponta Esquerda":       { tecnico: .35, fisico: .30, mental: .20, ego: .15 },
  "Segundo Atacante":     { tecnico: .35, fisico: .20, mental: .20, ego: .25 },
  "Centroavante":         { tecnico: .30, fisico: .25, mental: .15, ego: .30 }
};
const PESOS_PADRAO = { tecnico: .25, fisico: .25, mental: .25, ego: .25 };

function aleatorioEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(valor, min, max) {
  return Math.max(min, Math.min(max, valor));
}

// gera uma categoria inteira, com uma leve variação entre atributos
// pra ninguém nascer "reto" (todos os stats iguais)
function gerarCategoria(idsAtributos, min, max) {
  const obj = {};
  idsAtributos.forEach(id => { obj[id] = aleatorioEntre(min, max); });
  return obj;
}

function gerarAtributosIniciais(posicao) {
  const pesos = POSICAO_PESOS[posicao] || PESOS_PADRAO;
  // categorias mais importantes pra posição nascem numa faixa um pouco melhor
  const faixaPara = (peso) => peso >= .30 ? [50, 80] : peso >= .20 ? [45, 72] : [35, 62];

  return {
    tecnico: gerarCategoria(Object.keys(ATRIBUTOS_DEFINICOES.tecnico.atributos), ...faixaPara(pesos.tecnico)),
    fisico:  gerarCategoria(Object.keys(ATRIBUTOS_DEFINICOES.fisico.atributos),  ...faixaPara(pesos.fisico)),
    mental:  gerarCategoria(Object.keys(ATRIBUTOS_DEFINICOES.mental.atributos),  ...faixaPara(pesos.mental)),
    ego:     gerarCategoria(Object.keys(ATRIBUTOS_DEFINICOES.ego.atributos),     ...faixaPara(pesos.ego))
  };
}

// converte o formato antigo (Dia 4: 6 atributos soltos) pro novo (Dia 5: 19 em categorias)
function migrarAtributosParaCategorias(antigos, posicao) {
  antigos = antigos || {};
  const novos = gerarAtributosIniciais(posicao);

  // aproveita o que já existia, mapeando pro atributo mais parecido
  if (antigos.finalizacao != null) novos.tecnico.finalizacao = antigos.finalizacao;
  if (antigos.passe != null)       novos.tecnico.passe = antigos.passe;
  if (antigos.drible != null)      novos.tecnico.drible = antigos.drible;
  if (antigos.velocidade != null)  novos.fisico.velocidade = antigos.velocidade;
  if (antigos.visao != null)       novos.mental.visao = antigos.visao;
  if (antigos.fisico != null) {
    // "fisico" antigo era uma média solta; usa como base pros novos físicos
    ["aceleracao", "forca", "resistencia", "equilibrio"].forEach(id => {
      novos.fisico[id] = clamp(antigos.fisico + aleatorioEntre(-8, 8), 25, 99);
    });
  }
  return novos;
}

function mediaCategoria(categoriaObj) {
  const valores = Object.values(categoriaObj || {});
  if (!valores.length) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

// overall real: média de cada categoria, ponderada pelo peso da posição
function calcularOverall(atributos, posicao) {
  if (!atributos) return null;
  const pesos = POSICAO_PESOS[posicao] || PESOS_PADRAO;
  const soma =
    mediaCategoria(atributos.tecnico) * pesos.tecnico +
    mediaCategoria(atributos.fisico)  * pesos.fisico +
    mediaCategoria(atributos.mental)  * pesos.mental +
    mediaCategoria(atributos.ego)     * pesos.ego;
  return clamp(Math.round(soma), 1, 99);
}

// a "arma" do jogador: o atributo onde ele mais se destaca
function calcularArma(atributos) {
  if (!atributos) return { id: null, nome: "???", valor: 0 };
  let melhor = { id: null, valor: -1 };
  Object.keys(ATRIBUTOS_DEFINICOES).forEach(cat => {
    Object.entries(atributos[cat] || {}).forEach(([id, valor]) => {
      if (valor > melhor.valor) melhor = { id, valor };
    });
  });
  return { id: melhor.id, nome: ARMA_FLAVOR[melhor.id] || "???", valor: melhor.valor };
}

function gerarEgoInicial() {
  return aleatorioEntre(35, 60); // todo jogador começa com o ego adormecido
}

function gerarPotencialInicial() {
  return aleatorioEntre(70, 99); // o teto é sempre um mistério até o Egoísmo despertar
}

/* ---------- criação e validação do personagem ---------- */

function validarJogador(dados) {
  if (!dados.nome) return "Preencha o nome.";
  if (!dados.apelido) return "Preencha o apelido.";
  if (!dados.idade || dados.idade < 15 || dados.idade > 40) return "Idade inválida (15 a 40).";
  if (!dados.altura || dados.altura < 150 || dados.altura > 210) return "Altura inválida (150 a 210 cm).";
  if (!dados.cidade) return "Preencha a cidade natal.";
  if (!dados.posicao) return "Escolha uma posição.";
  if (!dados.peDominante) return "Escolha o pé dominante.";
  if (!dados.estiloVisual) return "Escolha um estilo visual.";
  if (!dados.avatar) return "Escolha um avatar.";
  if (!dados.personalidade) return "Escolha uma personalidade.";
  return null;
}

function criarJogador(dados) {
  const atributos = gerarAtributosIniciais(dados.posicao);
  return {
    nome: dados.nome,
    apelido: dados.apelido,
    idade: dados.idade,
    altura: dados.altura,
    cidade: dados.cidade,
    posicao: dados.posicao,
    peDominante: dados.peDominante,
    estiloVisual: dados.estiloVisual,
    avatar: dados.avatar,
    personalidade: dados.personalidade,
    overall: calcularOverall(atributos, dados.posicao),
    nivel: 1,
    xp: 0,
    xpProximoNivel: 100,
    ego: gerarEgoInicial(),
    potencial: gerarPotencialInicial(),
    arma: calcularArma(atributos).nome,
    atributos: atributos
  };
}

/* ---------- validação básica ---------- */

function saveValido(save) {
  return !!(save && typeof save === "object" && save.careerId && save.player);
}

/* ---------- salvar / carregar / apagar ---------- */

function salvarSave(save) {
  save.atualizadoEm = new Date().toISOString();
  const json = JSON.stringify(save);
  try {
    // grava o backup ANTES de sobrescrever o principal, pra nunca
    // perder as duas cópias ao mesmo tempo por uma falha no meio do processo
    const atual = localStorage.getItem(SAVE_KEY);
    if (atual) localStorage.setItem(SAVE_BACKUP_KEY, atual);
    localStorage.setItem(SAVE_KEY, json);
  } catch (e) {
    console.error("Falha ao salvar a carreira:", e);
  }
}

function obterSave() {
  const principal = lerChave(SAVE_KEY);
  if (saveValido(principal)) {
    return migrarSave(principal);
  }

  // save principal ausente ou corrompido -> tenta recuperar do backup
  const backup = lerChave(SAVE_BACKUP_KEY);
  if (saveValido(backup)) {
    console.warn("Save principal inválido. Recuperado a partir do backup.");
    const recuperado = migrarSave(backup);
    salvarSave(recuperado); // restaura o principal com o que foi recuperado
    return recuperado;
  }

  return null;
}

function lerChave(chave) {
  const raw = localStorage.getItem(chave);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Conteúdo de "' + chave + '" corrompido.', e);
    return null;
  }
}

function apagarSave() {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(SAVE_BACKUP_KEY);
}

/* ---------- configurações de áudio (por dispositivo, não por carreira) ---------- */

function obterConfiguracoes() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return { musica: 70, sfx: 80, mudo: false };
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { musica: 70, sfx: 80, mudo: false };
  }
}

function salvarConfiguracoes(cfg) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(cfg));
}
