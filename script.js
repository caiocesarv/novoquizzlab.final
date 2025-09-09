// Estado do quiz
let perguntaAtual = 0;
let pontuacao = 0;
let perguntasSelecionadas = [];
let alternativaSelecionada = null;
let quizIniciado = false;
let perguntaRespondida = false;
let audioContext = null;
let audioHabilitado = false;

// Elementos do DOM
const enunciado = document.getElementById('enunciado');
const imagem = document.getElementById('imagem');
const alternativasContainer = document.getElementById('alternativas');
const btnProxima = document.getElementById('btnProxima');
const feedback = document.getElementById('feedback');

// Elementos do vídeo
const btnVideo = document.getElementById('btnVideoExplicacao');
const videoContainer = document.getElementById('videoPlayerContainer');
const videoPlayer = document.getElementById('videoPlayer');

// Configuração dos temas
const temas = {
  'HEMÁCIAS e ANEMIAS': { inicio: 0, fim: 21 },
  'LEUCÓCITOS': { inicio: 22, fim: 41 },
  'PLAQUETAS': { inicio: 42, fim: 48 },
  'HEMOPARASITAS': { inicio: 49, fim: 54 },
  'LEUCEMIAS e LINFOMAS': { inicio: 55, fim: 99 }
};

// Sons do quiz com configuração mobile-friendly
const sons = {
  correto: null,
  errado: null,
  conclusao: null
};

// Inicializar áudio para mobile
function inicializarAudio() {
  try {
    // Criar AudioContext apenas quando necessário
    if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Configurar objetos Audio
    sons.correto = new Audio('assets/correto.mp3');
    sons.errado = new Audio('assets/errado.mp3');
    sons.conclusao = new Audio('assets/conclusao.mp3');
    
    // Configuração específica para mobile
    Object.values(sons).forEach(som => {
      if (som) {
        som.volume = 0.3;
        som.preload = 'metadata'; // Preload mais leve para mobile
        som.setAttribute('playsinline', true); // Para iOS
        
        // Event listeners para debug
        som.addEventListener('loadstart', () => console.log('Audio loading started'));
        som.addEventListener('canplay', () => console.log('Audio can start playing'));
        som.addEventListener('error', (e) => {
          console.log('Audio error:', e.error);
          console.log('Audio src:', som.src);
        });
        
        // Tentar carregar o áudio
        som.load();
      }
    });
    
    audioHabilitado = true;
    console.log('Áudio inicializado para mobile');
  } catch (error) {
    console.error('Erro ao inicializar áudio:', error);
    audioHabilitado = false;
  }
}

// Função para tocar som com tratamento mobile
async function tocarSom(tipoSom) {
  if (!audioHabilitado || !sons[tipoSom]) {
    console.log(`Áudio não habilitado ou som ${tipoSom} não encontrado`);
    return;
  }
  
  try {
    const som = sons[tipoSom];
    
    // Resetar o áudio para o início
    som.currentTime = 0;
    
    // Para iOS, é necessário resumir o AudioContext
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Tentar tocar o som
    const playPromise = som.play();
    
    if (playPromise !== undefined) {
      await playPromise;
      console.log(`Som ${tipoSom} tocado com sucesso`);
    }
  } catch (error) {
    console.log(`Erro ao tocar som ${tipoSom}:`, error);
    
    // Fallback: tentar tocar novamente após um pequeno delay
    setTimeout(() => {
      try {
        sons[tipoSom].play();
      } catch (e) {
        console.log(`Fallback também falhou para ${tipoSom}:`, e);
      }
    }, 100);
  }
}

// Função para habilitar áudio com interação do usuário (necessário para iOS)
function habilitarAudioComInteracao() {
  if (audioHabilitado) return;
  
  // Criar um som silencioso para "destrancar" o áudio no iOS
  const silentAudio = new Audio('data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAATQAAL8AAAEAAIA=');
  silentAudio.volume = 0.01;
  silentAudio.play()
    .then(() => {
      console.log('Áudio desbloqueado para iOS');
      inicializarAudio();
    })
    .catch(e => {
      console.log('Erro ao desbloquear áudio:', e);
    });
}

// Função: avaliação diagnóstica
function obterAvaliacaoDiagnostica(acertos, totalQuestoes) {
    const porcentagem = (acertos / totalQuestoes) * 100;
    let nivel = "";
    let cor = "#ff9800";
    
    if (porcentagem >= 90) nivel = "Referência no assunto", cor = "#9c27b0";
    else if (porcentagem >= 80) nivel = "Professor no assunto", cor = "#673ab7";
    else if (porcentagem >= 70) nivel = "Ótimo conhecimento", cor = "#4caf50";
    else if (porcentagem >= 60) nivel = "Bom conhecimento", cor = "#2196f3";
    else if (porcentagem >= 50) nivel = "Conhecimento regular", cor = "#ff9800";
    else nivel = "Necessita mais estudos", cor = "#f44336";
    
    return { nivel, cor };
}

// Criar HTML da avaliação diagnóstica
function criarHtmlAvaliacaoDiagnostica(acertos) {
    const avaliacao = obterAvaliacaoDiagnostica(acertos, 100);
    return `
        <div class="avaliacao-diagnostica" style="
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 15px;
            margin: 1rem 0;
            border: 2px solid rgba(255, 255, 255, 0.2);
        ">
            <h3 style="
                color: #f8cdd5;
                font-size: 1.2rem;
                margin-bottom: 1rem;
                text-align: center;
                line-height: 1.4;
            ">
                AVALIAÇÃO DIAGNÓSTICA<br>
                EM CITOLOGIA HEMATOLÓGICA
            </h3>
            <div class="resultado-diagnostico" style="
                text-align: center;
                padding: 1rem;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 10px;
                border: 2px solid ${avaliacao.cor};
            ">
                <div style="
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: ${avaliacao.cor};
                    margin-bottom: 0.5rem;
                ">
                    ${acertos} acertos
                </div>
                <div style="
                    font-size: 1.1rem;
                    color: ${avaliacao.cor};
                    font-weight: bold;
                ">
                    ${avaliacao.nivel}
                </div>
            </div>
        </div>
    `;
}

// Inicializar quiz
function iniciarQuiz(tema = null) {
  quizIniciado = true;
  
  // Tentar habilitar áudio na primeira interação
  habilitarAudioComInteracao();
  
  if (tema) {
    const config = temas[tema];
    perguntasSelecionadas = perguntas.slice(config.inicio, config.fim + 1);
  } else {
    perguntasSelecionadas = [...perguntas];
  }
  perguntaAtual = 0;
  pontuacao = 0;
  criarBarraProgresso();
  exibirPergunta();
  
  const menu = document.getElementById('menu');
  if (menu) menu.style.display = 'none';
  document.querySelector('.quiz-container').style.display = 'block';
}

// Barra de progresso
function criarBarraProgresso() {
  const header = document.querySelector('header');
  const barraExistente = document.getElementById('progresso-container');
  if (barraExistente) barraExistente.remove();
  const progressoContainer = document.createElement('div');
  progressoContainer.id = 'progresso-container';
  progressoContainer.innerHTML = `
    <div class="progresso-info">
      <span id="pergunta-numero">Pergunta ${perguntaAtual + 1} de ${perguntasSelecionadas.length}</span>
    </div>
    <div class="progresso-barra">
      <div id="progresso-fill"></div>
    </div>
  `;
  header.appendChild(progressoContainer);
}

// Atualizar progresso
function atualizarProgresso() {
  const perguntaNumero = document.getElementById('pergunta-numero');
  const progressoFill = document.getElementById('progresso-fill');
  if (perguntaNumero) perguntaNumero.textContent = `Pergunta ${perguntaAtual + 1} de ${perguntasSelecionadas.length}`;
  if (progressoFill) {
    const porcentagem = ((perguntaAtual + 1) / perguntasSelecionadas.length) * 100;
    progressoFill.style.width = `${porcentagem}%`;
  }
}

// Controlar botão de vídeo
function controlarBotaoVideo(pergunta) {
  if (!btnVideo) return;
  if (pergunta.video && pergunta.video !== '') {
    btnVideo.style.display = 'block';
    if (!perguntaRespondida) {
      btnVideo.disabled = true;
      btnVideo.style.opacity = '0.5';
      btnVideo.style.cursor = 'not-allowed';
      btnVideo.title = 'Responda a pergunta para assistir o vídeo';
      videoPlayer.src = '';
    } else {
      btnVideo.disabled = false;
      btnVideo.style.opacity = '1';
      btnVideo.style.cursor = 'pointer';
      btnVideo.title = 'Clique para assistir a explicação';
      videoPlayer.src = pergunta.video;
    }
  } else {
    btnVideo.style.display = 'none';
    videoPlayer.src = '';
  }
  videoContainer.style.display = 'none';
}

function habilitarBotaoVideo() {
  if (!btnVideo || btnVideo.style.display === 'none') return;
  const pergunta = perguntasSelecionadas[perguntaAtual];
  btnVideo.disabled = false;
  btnVideo.style.opacity = '1';
  btnVideo.style.cursor = 'pointer';
  btnVideo.title = 'Clique para assistir a explicação';
  if (pergunta.video && pergunta.video !== '') {
    videoPlayer.src = pergunta.video;
  }
}

// Exibir pergunta
function exibirPergunta() {
  const pergunta = perguntasSelecionadas[perguntaAtual];
  perguntaRespondida = false;
  setTimeout(() => {
    enunciado.textContent = pergunta.enunciado;
    if (pergunta.imagem && pergunta.imagem !== '') {
      imagem.src = `assets/${pergunta.imagem}`;
      imagem.style.display = 'block';
      imagem.onerror = () => imagem.style.display = 'none';
    } else imagem.style.display = 'none';
    
    alternativasContainer.innerHTML = '';
    pergunta.alternativas.forEach((alt, index) => {
      const botao = document.createElement('button');
      botao.textContent = alt;
      botao.onclick = () => selecionarAlternativa(index, botao);
      
      // Adicionar suporte a touch para mobile
      botao.addEventListener('touchstart', (e) => {
        e.preventDefault();
        selecionarAlternativa(index, botao);
      }, { passive: false });
      
      alternativasContainer.appendChild(botao);
    });
    
    controlarBotaoVideo(pergunta);
    
    feedback.textContent = '';
    btnProxima.style.display = 'block';
    btnProxima.textContent = 'Pular Pergunta';
    btnProxima.onclick = () => pularPergunta();
    
    document.querySelector('.card').style.opacity = '1';
    alternativasContainer.style.opacity = '1';
    atualizarProgresso();
  }, 300);
}

// Pular pergunta
function pularPergunta() {
  if (alternativaSelecionada !== null) return;
  perguntaRespondida = true;
  habilitarBotaoVideo();
  mostrarFeedback(false, 'Pergunta pulada! ⏭️');
  desabilitarAlternativas();
  btnProxima.textContent = 'Continuar';
  btnProxima.onclick = () => proximaPergunta();
}

// Selecionar alternativa (MELHORADO)
function selecionarAlternativa(index, botao) {
  console.log("=== DEBUG SELECIONAR ALTERNATIVA ===");
  console.log("Index selecionado:", index);
  console.log("Alternativa já selecionada?", alternativaSelecionada);
  
  if (alternativaSelecionada !== null) {
    console.log("Alternativa já selecionada, saindo...");
    return;
  }
  
  // Tentar habilitar áudio se ainda não foi feito
  if (!audioHabilitado) {
    habilitarAudioComInteracao();
  }
  
  alternativaSelecionada = index;
  perguntaRespondida = true;
  const pergunta = perguntasSelecionadas[perguntaAtual];
  
  console.log("Pergunta atual:", pergunta);
  console.log("Tipo de pergunta.correta:", typeof pergunta.correta);
  console.log("Valor de pergunta.correta:", pergunta.correta);
  
  let respostaCorreta = -1;
  
  // Tratamento melhorado para resposta correta
  if (typeof pergunta.correta === "number") {
    respostaCorreta = pergunta.correta;
    console.log("Resposta correta (número):", respostaCorreta);
  } else if (typeof pergunta.correta === "string") {
    const letraCorreta = pergunta.correta.trim().toUpperCase();
    respostaCorreta = letraCorreta.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, E=4
    console.log("Resposta correta (string convertida):", `${letraCorreta} → ${respostaCorreta}`);
  }
  
  console.log("Total de alternativas:", pergunta.alternativas.length);
  
  // Validação melhorada
  if (respostaCorreta < 0 || respostaCorreta >= pergunta.alternativas.length) {
    console.error("ERRO: Resposta correta fora do range válido!", {
      respostaCorreta,
      totalAlternativas: pergunta.alternativas.length,
      perguntaCorreta: pergunta.correta
    });
    mostrarFeedback(false, "Erro na pergunta! ⚠️");
    desabilitarAlternativas();
    habilitarBotaoVideo();
    btnProxima.textContent = 'Continuar';
    btnProxima.onclick = () => proximaPergunta();
    return;
  }
  
  const acertou = index === respostaCorreta;
  console.log("Acertou?", acertou);
  console.log("Index selecionado:", index, "Resposta correta:", respostaCorreta);
  
  botao.classList.add('selecionada');
  
  // Feedback visual imediato para mobile
  setTimeout(() => {
    mostrarFeedbackVisual(acertou, respostaCorreta);
    mostrarFeedback(acertou);
    habilitarBotaoVideo();
    if (acertou) {
      pontuacao += calcularPontuacao();
      atualizarProgresso();
    }
    btnProxima.textContent = 'Continuar';
    btnProxima.onclick = () => proximaPergunta();
  }, 200); // Tempo reduzido para melhor responsividade mobile
  
  console.log("=== FIM DEBUG ===");
}

// Mostrar feedback visual (MELHORADO)
function mostrarFeedbackVisual(acertou, respostaCorreta) {
  const botoes = alternativasContainer.querySelectorAll('button');
  
  console.log("Aplicando feedback visual:", { acertou, respostaCorreta, totalBotoes: botoes.length });
  
  botoes.forEach((botao, index) => {
    // Remove classes antigas primeiro
    botao.classList.remove('correta', 'errada');
    
    if (index === respostaCorreta) {
      botao.classList.add('correta');
      console.log(`Botão ${index} marcado como correto`);
    } else if (index === alternativaSelecionada && !acertou) {
      botao.classList.add('errada'); 
      console.log(`Botão ${index} marcado como erro`);
    }
    
    botao.disabled = true;
  });
}

// Mostrar feedback (MELHORADO com áudio mobile)
async function mostrarFeedback(acertou, mensagem = null) {
  const feedbackElement = document.getElementById('feedback');
  
  if (mensagem) {
    feedbackElement.textContent = mensagem;
    feedbackElement.className = 'pergunta-pulada';
  } else if (acertou) {
    feedbackElement.textContent = 'Correto! Parabéns! 🎉';
    feedbackElement.className = 'correto';
    // Tocar som com nova função mobile-friendly
    await tocarSom('correto');
  } else {
    feedbackElement.textContent = 'Incorreto 😔';
    feedbackElement.className = 'errado';
    // Tocar som com nova função mobile-friendly
    await tocarSom('errado');
  }
  
  // Animação de feedback
  feedbackElement.style.transform = 'scale(1.1)';
  setTimeout(() => feedbackElement.style.transform = 'scale(1)', 200);
}

function calcularPontuacao() { return 100; }

function desabilitarAlternativas() {
  alternativasContainer.querySelectorAll('button').forEach(botao => botao.disabled = true);
}

// Próxima pergunta (MELHORADO)
function proximaPergunta() {
  // Reset das variáveis
  alternativaSelecionada = null;
  perguntaRespondida = false;
  
  // Limpar classes das alternativas
  const botoes = alternativasContainer.querySelectorAll('button');
  botoes.forEach(botao => {
    botao.classList.remove('correta', 'errada', 'selecionada');
    botao.disabled = false;
  });
  
  if (perguntaAtual < perguntasSelecionadas.length - 1) {
    perguntaAtual++;
    
    // Fade out antes de mostrar próxima pergunta
    document.querySelector('.card').style.opacity = '0';
    alternativasContainer.style.opacity = '0';
    
    setTimeout(() => {
      exibirPergunta();
    }, 300);
  } else {
    exibirResultadoFinal();
  }
}

// Exibir resultado final (MELHORADO)
async function exibirResultadoFinal() {
  // Tocar som de conclusão com nova função
  await tocarSom('conclusao');
  
  const totalPerguntas = perguntasSelecionadas.length;
  const acertos = Math.floor(pontuacao / 100);
  const erros = totalPerguntas - acertos;
  const porcentagemAcertos = ((acertos / totalPerguntas) * 100).toFixed(1);
  const avaliacaoDiagnostica = obterAvaliacaoDiagnostica(acertos, totalPerguntas);
  let classificacao = '';
  if (porcentagemAcertos >= 90) classificacao = 'Excelente! 🏆';
  else if (porcentagemAcertos >= 70) classificacao = 'Muito Bom! 🥈';
  else if (porcentagemAcertos >= 50) classificacao = 'Bom! 🥉';
  else classificacao = '';
  
  let htmlEstatisticas = '';
  if (avaliacaoDiagnostica) {
    htmlEstatisticas = `
      <div class="estatisticas">
        <div class="stat"><span class="numero" style="color: #4caf50;">${acertos}</span><span class="label">Acertos</span></div>
        <div class="stat"><span class="numero" style="color: #f44336;">${erros}</span><span class="label">Erros</span></div>
        <div class="stat"><span class="numero" style="color: #2196f3;">${totalPerguntas}</span><span class="label">Total de Questões</span></div>
      </div>
      ${criarHtmlAvaliacaoDiagnostica(acertos, totalPerguntas)}
    `;
  } else {
    htmlEstatisticas = `
      <div class="estatisticas">
        <div class="stat"><span class="numero" style="color: #4caf50;">${acertos}</span><span class="label">Acertos</span></div>
        <div class="stat"><span class="numero" style="color: #f44336;">${erros}</span><span class="label">Erros</span></div>
        <div class="stat"><span class="numero" style="color: #ff9800;">${porcentagemAcertos}%</span><span class="label">Aproveitamento</span></div>
      </div>
    `;
  }
  
  document.querySelector('.quiz-container').innerHTML = `
    <div class="resultado-final">
      <header>
        <img src="assets/logo.png" alt="Logo Portal Lab" class="logo">
        <h1>RESULTADO FINAL</h1>
      </header>
      <div class="resultado-card">
        <h2 style="color: #ff9800;"></h2>
        ${htmlEstatisticas}
        <div class="acoes-finais">
          <button onclick="reiniciarQuiz()" class="btn-reiniciar">Refazer Quiz</button>
          <button onclick="voltarMenu()" class="btn-menu">Voltar ao Menu</button>
        </div>
      </div>
    </div>
  `;
}

function reiniciarQuiz() { 
  // Limpar AudioContext se existir
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  location.reload(); 
}

function voltarMenu() { 
  // Limpar AudioContext se existir
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  window.location.href = 'index.html'; 
}

// Controles do vídeo (MELHORADO para mobile)
if (btnVideo) {
  btnVideo.addEventListener('click', (e) => {
    e.preventDefault();
    if (!btnVideo.disabled) {
      if (videoContainer.style.display === 'none' || !videoContainer.style.display) {
        videoContainer.style.display = 'block';
        btnVideo.textContent = '⏹️ Fechar Vídeo';
        
        // Para mobile, garantir que o vídeo seja reproduzido inline
        if (videoPlayer) {
          videoPlayer.setAttribute('playsinline', true);
          videoPlayer.setAttribute('webkit-playsinline', true);
        }
      } else {
        videoContainer.style.display = 'none';
        btnVideo.textContent = '▶️ Assistir Explicação em Vídeo';
        if (videoPlayer) {
          videoPlayer.pause();
        }
      }
    }
  });
  
  // Adicionar suporte a touch
  btnVideo.addEventListener('touchstart', (e) => {
    e.preventDefault();
    btnVideo.click();
  }, { passive: false });
}

// Event listeners (MELHORADOS)
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tema = urlParams.get('tema');
  if (!document.getElementById('menu')) iniciarQuiz(tema);
  
  // Adicionar listener para detectar quando o usuário interage pela primeira vez
  document.addEventListener('touchstart', habilitarAudioComInteracao, { once: true });
  document.addEventListener('click', habilitarAudioComInteracao, { once: true });
});

// Melhorar controles de teclado para desktop
document.addEventListener('keydown', (e) => {
  if (!quizIniciado || alternativaSelecionada !== null) return;
  const tecla = e.key;
  if (tecla >= '1' && tecla <= '5') {
    const index = parseInt(tecla) - 1;
    const botoes = alternativasContainer.querySelectorAll('button');
    if (botoes[index]) selecionarAlternativa(index, botoes[index]);
  }
  if (tecla === 'Escape') { e.preventDefault(); pularPergunta(); }
  if (tecla.toLowerCase() === 'v' && perguntaRespondida && btnVideo && !btnVideo.disabled) { 
    e.preventDefault(); 
    btnVideo.click(); 
  }
});

// Adicionar listener para visibilidade da página (pausar áudio quando sair)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && audioContext && audioContext.state === 'running') {
    audioContext.suspend();
  } else if (!document.hidden && audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
});