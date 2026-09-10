/* ============================================
   PROJECT BLUE LOCK — app.js
   Estado da aplicação + navegação entre telas.
   ============================================ */

const AppState = {
  telaAtual: "splash",
  historico: []
};

function mostrarTela(nome, { empilhar = true } = {}) {
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
  const alvo = document.getElementById("screen-" + nome);
  if (!alvo) return;
  alvo.classList.add("active");

  if (nome === "player") renderFichaJogador();

  if (empilhar && AppState.telaAtual !== nome) {
    AppState.historico.push(AppState.telaAtual);
  }
  AppState.telaAtual = nome;

  // reflete no histórico do navegador (permite botão físico/gesto voltar)
  history.pushState({ tela: nome }, "", "#" + nome);
}

function voltar() {
  const anterior = AppState.historico.pop() || "menu";
  mostrarTela(anterior, { empilhar: false });
}

window.addEventListener("popstate", (e) => {
  const tela = (e.state && e.state.tela) || "menu";
  AppState.telaAtual = tela;
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
  const alvo = document.getElementById("screen-" + tela);
  if (alvo) alvo.classList.add("active");
});

function atualizarBotaoContinuar() {
  const save = obterSave();
  const btn = document.getElementById("btn-continue");
  const tag = document.getElementById("continue-tag");
  if (save) {
    btn.disabled = false;
    tag.textContent = "carreira em andamento";
  } else {
    btn.disabled = true;
    tag.textContent = "nenhum save encontrado";
  }
}

function carregarConfiguracoesNaTela() {
  const cfg = obterConfiguracoes();
  document.getElementById("vol-music").value = cfg.musica;
  document.getElementById("vol-sfx").value = cfg.sfx;
  document.getElementById("chk-mute").checked = cfg.mudo;
}

/* ---------- formulário de criação do jogador (Dia 3) ---------- */

function preencherSelect(id, opcoes) {
  document.getElementById(id).innerHTML =
    opcoes.map(o => `<option value="${o}">${o}</option>`).join("");
}

function montarGradeAvatares() {
  const grid = document.getElementById("avatar-grid");
  grid.innerHTML = AVATARES.map(av =>
    `<button type="button" class="avatar-option" data-avatar="${av}">${av}</button>`
  ).join("");
  grid.querySelectorAll(".avatar-option").forEach(btn => {
    btn.addEventListener("click", () => {
      grid.querySelectorAll(".avatar-option").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      grid.dataset.selecionado = btn.dataset.avatar;
    });
  });
}

function montarGradePersonalidades() {
  const grid = document.getElementById("personality-grid");
  grid.innerHTML = PERSONALIDADES.map(p =>
    `<button type="button" class="personality-option" data-personalidade="${p.id}">
       <span class="personality-name">${p.nome}</span>
       <span class="personality-desc">${p.desc}</span>
     </button>`
  ).join("");
  grid.querySelectorAll(".personality-option").forEach(btn => {
    btn.addEventListener("click", () => {
      grid.querySelectorAll(".personality-option").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      grid.dataset.selecionado = btn.dataset.personalidade;
    });
  });
}

function inicializarFormularioJogador() {
  preencherSelect("f-posicao", POSICOES);
  preencherSelect("f-pe", PES_DOMINANTES);
  preencherSelect("f-estilo", ESTILOS_VISUAIS);
  montarGradeAvatares();
  montarGradePersonalidades();
}

function resetarFormularioJogador() {
  document.getElementById("form-player").reset();
  ["avatar-grid", "personality-grid"].forEach(id => {
    const grid = document.getElementById(id);
    grid.querySelectorAll(".selected").forEach(b => b.classList.remove("selected"));
    delete grid.dataset.selecionado;
  });
}

/* ---------- ficha do jogador (tela "MEU JOGADOR", Dia 4) ---------- */

function statBarHTML(label, valor) {
  return `
    <div class="stat-row">
      <div class="stat-row-top"><span>${label}</span><strong>${valor}</strong></div>
      <div class="stat-track"><div class="stat-fill" style="width:${valor}%"></div></div>
    </div>`;
}

// renderiza uma categoria inteira de atributos (Dia 5), com a média no cabeçalho
function categoriaHTML(categoriaId, valores) {
  const def = ATRIBUTOS_DEFINICOES[categoriaId];
  if (!def || !valores) return "";
  const media = Math.round(mediaCategoria(valores));
  const barras = Object.entries(def.atributos)
    .map(([id, nome]) => statBarHTML(nome, valores[id] ?? 0))
    .join("");
  return `
    <div class="atributo-categoria">
      <div class="atributo-categoria-header">
        <span>${def.nome}</span><strong>${media}</strong>
      </div>
      <div class="atributos-list">${barras}</div>
    </div>`;
}

function renderFichaJogador() {
  const vazio = document.getElementById("ficha-vazio");
  const conteudo = document.getElementById("ficha-conteudo");
  const save = obterSave();
  const p = save && save.player;

  if (!p || !p.nome) {
    vazio.style.display = "block";
    conteudo.style.display = "none";
    return;
  }
  vazio.style.display = "none";
  conteudo.style.display = "block";

  const personalidade = PERSONALIDADES.find(x => x.id === p.personalidade);

  document.getElementById("ficha-avatar").textContent = p.avatar || "⚽";
  document.getElementById("ficha-nome").innerHTML = `${p.apelido} <span>(${p.nome})</span>`;
  document.getElementById("ficha-posicao").textContent = p.posicao;
  document.getElementById("ficha-nivel").textContent = "NÍVEL " + String(p.nivel).padStart(2, "0");
  document.getElementById("ficha-xp").textContent = `${p.xp} / ${p.xpProximoNivel} XP`;
  const pct = Math.min(100, Math.round((p.xp / p.xpProximoNivel) * 100));
  document.getElementById("ficha-xp-fill").style.width = pct + "%";

  const a = p.atributos || {};

  document.getElementById("tab-geral").innerHTML = `
    <div class="ficha-grid">
      <div class="ficha-item"><span>Overall</span><strong>${p.overall ?? "—"}</strong></div>
      <div class="ficha-item"><span>Idade</span><strong>${p.idade}</strong></div>
      <div class="ficha-item"><span>Altura</span><strong>${p.altura} cm</strong></div>
      <div class="ficha-item"><span>Pé</span><strong>${p.peDominante}</strong></div>
      <div class="ficha-item"><span>Cidade</span><strong>${p.cidade}</strong></div>
      <div class="ficha-item"><span>Estilo</span><strong>${p.estiloVisual}</strong></div>
      <div class="ficha-item ficha-item-full"><span>Arma</span><strong>${p.arma || "???"}</strong></div>
    </div>`;

  document.getElementById("tab-atributos").innerHTML = `
    <div class="destaque-row">
      ${statBarHTML("OVERALL", p.overall ?? 0)}
      ${statBarHTML("EGO", p.ego ?? 0)}
      ${statBarHTML("POTENCIAL", p.potencial ?? 0)}
    </div>
    ${categoriaHTML("tecnico", a.tecnico)}
    ${categoriaHTML("fisico", a.fisico)}
    ${categoriaHTML("mental", a.mental)}
    ${categoriaHTML("ego", a.ego)}`;

  document.getElementById("tab-mental").innerHTML = `
    <div class="mental-card">
      <span class="mental-label">Personalidade</span>
      <h4>${personalidade ? personalidade.nome : "???"}</h4>
      <p>${personalidade ? personalidade.desc : ""}</p>
    </div>
    <p class="placeholder-text">Traços mentais completos (foco, resiliência, instinto assassino) chegam em fase futura.</p>`;

  document.getElementById("tab-ego").innerHTML = `
    <div class="ego-hero">
      <span class="ego-valor">${p.ego ?? 0}</span>
      <span class="ego-label">EGO</span>
    </div>
    <p class="placeholder-text">O Ego ainda está adormecido. Ele cresce a cada duelo vencido em campo — o despertar completo chega em fase futura.</p>`;

  const st = save.statistics, rk = save.ranking;
  document.getElementById("tab-estatisticas").innerHTML = `
    <div class="ficha-grid">
      <div class="ficha-item"><span>Jogos</span><strong>${st.jogos}</strong></div>
      <div class="ficha-item"><span>Gols</span><strong>${st.gols}</strong></div>
      <div class="ficha-item"><span>Assistências</span><strong>${st.assistencias}</strong></div>
      <div class="ficha-item"><span>Nota média</span><strong>${st.notaMedia ?? "—"}</strong></div>
      <div class="ficha-item"><span>Ranking nacional</span><strong>${rk.colocacaoNacional ?? "—"}</strong></div>
      <div class="ficha-item"><span>Ranking mundial</span><strong>${rk.colocacaoMundial ?? "—"}</strong></div>
    </div>`;

  const eventos = save.history.eventos;
  document.getElementById("tab-historico").innerHTML = eventos.length
    ? '<ul class="historico-list">' + eventos.map(e => `<li>${e}</li>`).join("") + "</ul>"
    : '<p class="placeholder-text">Nenhum evento registrado ainda. Sua jornada começa agora.</p>';

  document.getElementById("tab-conquistas").innerHTML =
    '<p class="placeholder-text">Nenhuma conquista desbloqueada ainda. O sistema de conquistas chega em fase futura.</p>';

  trocarAbaJogador("geral");
}

function trocarAbaJogador(nome) {
  document.querySelectorAll("#player-tabs .tab-btn")
    .forEach(b => b.classList.toggle("active", b.dataset.tab === nome));
  document.querySelectorAll(".tab-content")
    .forEach(c => c.classList.toggle("active", c.id === "tab-" + nome));
}

function ligarEventos() {
  // splash -> menu
  document.getElementById("screen-splash").addEventListener("click", () => {
    mostrarTela("menu", { empilhar: false });
  }, { once: true });

  // qualquer botão de menu toca som e navega (exceto continue desabilitado)
  document.querySelectorAll(".menu-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      AudioSystem.tocarClick();
      const destino = btn.dataset.nav;
      if (destino === "continue") {
        mostrarTela("player"); // fase 1: continuar leva à ficha do jogador (placeholder)
      } else {
        mostrarTela(destino);
      }
    });
  });

  // abas da ficha do jogador
  document.getElementById("player-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    AudioSystem.tocarClick();
    trocarAbaJogador(btn.dataset.tab);
  });

  // botões de voltar
  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => {
      AudioSystem.tocarClick();
      voltar();
    });
  });

  // nova carreira: formulário completo de criação do jogador (Dia 3)
  document.getElementById("form-player").addEventListener("submit", (e) => {
    e.preventDefault();
    const erroEl = document.getElementById("form-error");
    erroEl.textContent = "";

    const dados = {
      nome: document.getElementById("f-nome").value.trim(),
      apelido: document.getElementById("f-apelido").value.trim(),
      idade: Number(document.getElementById("f-idade").value),
      altura: Number(document.getElementById("f-altura").value),
      cidade: document.getElementById("f-cidade").value.trim(),
      posicao: document.getElementById("f-posicao").value,
      peDominante: document.getElementById("f-pe").value,
      estiloVisual: document.getElementById("f-estilo").value,
      avatar: document.getElementById("avatar-grid").dataset.selecionado || null,
      personalidade: document.getElementById("personality-grid").dataset.selecionado || null
    };

    const erro = validarJogador(dados);
    if (erro) {
      erroEl.textContent = erro;
      return;
    }

    const existente = obterSave();
    if (existente && !confirm("Já existe uma carreira salva. Substituir pelo novo save?")) {
      return;
    }

    const novoSave = criarNovoSave();
    novoSave.player = criarJogador(dados);
    salvarSave(novoSave);

    resetarFormularioJogador();
    atualizarBotaoContinuar();
    AudioSystem.tocarClick();
    mostrarTela("menu", { empilhar: false });
  });

  // configurações
  const salvarCfgAtual = () => {
    const cfg = {
      musica: Number(document.getElementById("vol-music").value),
      sfx: Number(document.getElementById("vol-sfx").value),
      mudo: document.getElementById("chk-mute").checked
    };
    salvarConfiguracoes(cfg);
    AudioSystem.atualizarConfig(cfg);
  };
  document.getElementById("vol-music").addEventListener("input", salvarCfgAtual);
  document.getElementById("vol-sfx").addEventListener("input", salvarCfgAtual);
  document.getElementById("chk-mute").addEventListener("change", salvarCfgAtual);

  document.getElementById("btn-reset-save").addEventListener("click", () => {
    if (!confirm("Apagar a carreira salva? Essa ação não pode ser desfeita.")) return;
    apagarSave();
    atualizarBotaoContinuar();
    AudioSystem.tocarClick();
  });
}

function iniciar() {
  atualizarBotaoContinuar();
  carregarConfiguracoesNaTela();
  inicializarFormularioJogador();
  ligarEventos();
  mostrarTela("splash", { empilhar: false });
}

document.addEventListener("DOMContentLoaded", iniciar);
