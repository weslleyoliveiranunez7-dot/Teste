/* ============================================
   PROJECT BLUE LOCK — sistema de áudio
   Preparado para receber música/efeitos reais
   nas próximas fases. Por enquanto gera um
   "click" curto via WebAudio para dar feedback
   nos botões, respeitando volume/mudo salvos.
   ============================================ */

const AudioSystem = (() => {
  let ctx = null;
  let cfg = obterConfiguracoes();

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function tocarClick() {
    if (cfg.mudo) return;
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "square";
    osc.frequency.value = 520;
    gain.gain.value = (cfg.sfx / 100) * 0.05;
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.05);
  }

  function atualizarConfig(novaCfg) {
    cfg = novaCfg;
  }

  return { tocarClick, atualizarConfig };
})();
