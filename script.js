// Estado do quiz
let perguntaAtual = 0;
let pontuacao = 0;
let perguntasSelecionadas = [];
let alternativaSelecionada = null;
let quizIniciado = false;
let perguntaRespondida = false;
let audioInicializado = false;
let userInteracted = false;

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

// Sons do quiz - VERSÃO CORRIGIDA
const audioFiles = {
  correto: 'assets/correto.mp3',
  errado: 'assets/errado.mp3',
  conclusao: 'assets/conclusao.mp3'
};

let audioElements = {};
let audioContext = null;
let audioBuffers = {};

// Função melhorada para iOS - usando Web Audio API quando possível
async function initializeAudioForIOS() {
  console.log('🔊 Inicializando áudio para iOS...');
  
  try {
    // Tentar usar Web Audio API se disponível
    if (window.AudioContext || window.webkitAudioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🎵 Web Audio API inicializada');
        
        // Carregar buffers de áudio
        for (const [key, src] of Object.entries(audioFiles)) {
          try {
            const response = await fetch(src);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioBuffers[key] = audioBuffer;
            console.log(`✅ Buffer ${key} carregado`);
          } catch (e) {
            console.warn(`⚠️ Falha ao carregar buffer ${key}:`, e);
          }
        }
      } catch (e) {
        console.warn('⚠️ Web Audio API falhou, usando HTML5 Audio:', e);
        audioContext = null;
      }
    }
    
    // Criar elementos HTML5 Audio como fallback
    Object.keys(audioFiles).forEach(key => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.5;
      audio.crossOrigin = 'anonymous';
      
      // Configurações específicas para iOS
      audio.setAttribute('playsinline', true);
      audio.setAttribute('webkit-playsinline', true);
      audio.muted = false;
      
      // Event listeners melhorados
      audio.addEventListener('canplaythrough', () => {
        console.log(`✅ Áudio HTML5 ${key} carregado`);
      });
      
      audio.addEventListener('error', (e) => {
        console.error(`❌ Erro ao carregar HTML5 ${key}:`, e);
      });
      
      // Carregar fonte após configurar
      audio.src = audioFiles[key];
      audioElements[key] = audio;
    });
    
    audioInicializado = true;
    console.log('✅ Sistema de áudio inicializado!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar áudio:', error);
    audioInicializado = false;
  }
}

// Função melhorada para desbloquear áudio
async function unlockAudioOnIOS() {
  if (userInteracted) return;
  
  console.log('🔓 Desbloqueando áudio no iOS...');
  
  try {
    // Desbloquear Web Audio API se disponível
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('🎵 AudioContext resumido');
    }
    
    // Desbloquear HTML5 Audio
    const unlockPromises = Object.values(audioElements).map(async (audio) => {
      if (audio && audio.readyState >= 2) {
        try {
          const originalVolume = audio.volume;
          audio.volume = 0.001; // Volume quase zero
          audio.currentTime = 0;
          
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
          audio.volume = originalVolume;
          
          return true;
        } catch (e) {
          console.log('⚠️ Falha individual no unlock:', e);
          return false;
        }
      }
      return false;
    });
    
    await Promise.allSettled(unlockPromises);
    userInteracted = true;
    console.log('🔊 Áudio desbloqueado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no unlock:', error);
  }
}

// Função corrigida para tocar som
async function playAudioIOS(soundType) {
  console.log(`🔊 Tocando som: ${soundType}`);
  
  if (!audioInicializado) {
    console.log('❌ Áudio não inicializado');
    return false;
  }
  
  // Garantir que o usuário interagiu
  if (!userInteracted) {
    console.log('⚠️ Usuário ainda não interagiu, tentando desbloquear...');
    await unlockAudioOnIOS();
  }
  
  try {
    // Tentar Web Audio API primeiro (melhor para iOS)
    if (audioContext && audioBuffers[soundType]) {
      try {
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        
        source.buffer = audioBuffers[soundType];
        gainNode.gain.value = 0.5;
        
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        source.start(0);
        console.log(`✅ Som ${soundType} tocado via Web Audio API`);
        return true;
      } catch (e) {
        console.warn(`⚠️ Web Audio falhou para ${soundType}:`, e);
      }
    }
    
    // Fallback para HTML5 Audio
    const audio = audioElements[soundType];
    if (audio) {
      // Parar qualquer reprodução anterior
      audio.pause();
      audio.currentTime = 0;
      
      // Configurar volume
      audio.volume = 0.5;
      
      // Tentar tocar com retry
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          await audio.play();
          console.log(`✅ Som ${soundType} tocado via HTML5 Audio (tentativa ${attempts + 1})`);
          return true;
        } catch (e) {
          attempts++;
          console.warn(`⚠️ Tentativa ${attempts} falhou para ${soundType}:`, e);
          
          if (attempts < maxAttempts) {
            // Pequeno delay antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
    }
    
    console.error(`❌ Falha completa ao tocar ${soundType}`);
    return false;
    
  } catch (error) {
    console.error(`❌ Erro crítico ao tocar ${soundType}:`, error);
    return false;
  }
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
async function iniciarQuiz(tema = null) {
  console.log('🎯 Iniciando quiz...');
  quizIniciado = true;
  
  // Inicializar áudio imediatamente
  if (!audioInicializado) {
    await initializeAudioForIOS();
  }
  
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
      
      // Event listener único que funciona em todos os dispositivos
      botao.addEventListener('click', (e) => {
        e.preventDefault();
        selecionarAlternativa(index, botao);
      });
      
      // Touch específico para mobile
      botao.addEventListener('touchend', (e) => {
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

// Selecionar alternativa - VERSÃO CORRIGIDA
async function selecionarAlternativa(index, botao) {
  console.log("🎯 Selecionando alternativa:", index);
  
  if (alternativaSelecionada !== null) {
    console.log("⚠️ Alternativa já selecionada");
    return;
  }
  
  // GARANTIR DESBLOQUEIO DE ÁUDIO NA PRIMEIRA INTERAÇÃO
  if (!userInteracted) {
    await unlockAudioOnIOS();
  }
  
  alternativaSelecionada = index;
  perguntaRespondida = true;
  const pergunta = perguntasSelecionadas[perguntaAtual];
  
  let respostaCorreta = -1;
  
  if (typeof pergunta.correta === "number") {
    respostaCorreta = pergunta.correta;
  } else if (typeof pergunta.correta === "string") {
    const letraCorreta = pergunta.correta.trim().toUpperCase();
    respostaCorreta = letraCorreta.charCodeAt(0) - 65;
  }
  
  if (respostaCorreta < 0 || respostaCorreta >= pergunta.alternativas.length) {
    console.error("❌ Erro na pergunta!", {
      respostaCorreta,
      totalAlternativas: pergunta.alternativas.length
    });
    mostrarFeedback(false, "Erro na pergunta! ⚠️");
    desabilitarAlternativas();
    habilitarBotaoVideo();
    btnProxima.textContent = 'Continuar';
    btnProxima.onclick = () => proximaPergunta();
    return;
  }
  
  const acertou = index === respostaCorreta;
  console.log(`${acertou ? '✅' : '❌'} Resposta: ${acertou ? 'CORRETA' : 'INCORRETA'}`);
  
  botao.classList.add('selecionada');
  
  // Usar setTimeout para garantir que o áudio toque após a animação visual
  setTimeout(async () => {
    mostrarFeedbackVisual(acertou, respostaCorreta);
    await mostrarFeedback(acertou); // Aguardar o áudio tocar
    habilitarBotaoVideo();
    if (acertou) {
      pontuacao += calcularPontuacao();
      atualizarProgresso();
    }
    btnProxima.textContent = 'Continuar';
    btnProxima.onclick = () => proximaPergunta();
  }, 200);
}

// Mostrar feedback visual
function mostrarFeedbackVisual(acertou, respostaCorreta) {
  const botoes = alternativasContainer.querySelectorAll('button');
  
  botoes.forEach((botao, index) => {
    botao.classList.remove('correta', 'errada');
    
    if (index === respostaCorreta) {
      botao.classList.add('correta');
    } else if (index === alternativaSelecionada && !acertou) {
      botao.classList.add('errada'); 
    }
    
    botao.disabled = true;
  });
}

// Mostrar feedback - VERSÃO CORRIGIDA
async function mostrarFeedback(acertou, mensagem = null) {
  const feedbackElement = document.getElementById('feedback');
  
  if (mensagem) {
    feedbackElement.textContent = mensagem;
    feedbackElement.className = 'pergunta-pulada';
  } else if (acertou) {
    feedbackElement.textContent = 'Correto! Parabéns! 🎉';
    feedbackElement.className = 'correto';
    console.log('🔊 Tocando som CORRETO...');
    
    // Aguardar o áudio tocar completamente
    try {
      await playAudioIOS('correto');
    } catch (error) {
      console.error('❌ Erro ao tocar som correto:', error);
    }
  } else {
    feedbackElement.textContent = 'Incorreto 😔';
    feedbackElement.className = 'errado';
    console.log('🔊 Tocando som ERRADO...');
    
    // Aguardar o áudio tocar completamente
    try {
      await playAudioIOS('errado');
    } catch (error) {
      console.error('❌ Erro ao tocar som errado:', error);
    }
  }
  
  // Animação do feedback
  feedbackElement.style.transform = 'scale(1.1)';
  setTimeout(() => feedbackElement.style.transform = 'scale(1)', 200);
}

function calcularPontuacao() { return 100; }

function desabilitarAlternativas() {
  alternativasContainer.querySelectorAll('button').forEach(botao => botao.disabled = true);
}

// Próxima pergunta
function proximaPergunta() {
  // Reset das variáveis
  alternativaSelecionada = null;
  perguntaRespondida = false;
  
  const botoes = alternativasContainer.querySelectorAll('button');
  botoes.forEach(botao => {
    botao.classList.remove('correta', 'errada', 'selecionada');
    botao.disabled = false;
  });
  
  if (perguntaAtual < perguntasSelecionadas.length - 1) {
    perguntaAtual++;
    
    document.querySelector('.card').style.opacity = '0';
    alternativasContainer.style.opacity = '0';
    
    setTimeout(() => {
      exibirPergunta();
    }, 300);
  } else {
    exibirResultadoFinal();
  }
}

// Exibir resultado final
async function exibirResultadoFinal() {
  console.log('🔊 Tocando som CONCLUSÃO...');
  
  try {
    await playAudioIOS('conclusao');
  } catch (error) {
    console.error('❌ Erro ao tocar som de conclusão:', error);
  }

  const totalPerguntas = perguntasSelecionadas.length;
  const acertos = Math.floor(pontuacao / 100);
  const erros = totalPerguntas - acertos;
  const porcentagemAcertos = ((acertos / totalPerguntas) * 100).toFixed(1);

  // Verifica se é Quiz Completo (sem tema) ou módulo
  const urlParams = new URLSearchParams(window.location.search);
  const tema = urlParams.get('tema');
  const isQuizCompleto = !tema;

  let htmlEstatisticas = `
    <div class="estatisticas">
      <div class="stat"><span class="numero" style="color: #4caf50;">${acertos}</span><span class="label">Acertos</span></div>
      <div class="stat"><span class="numero" style="color: #f44336;">${erros}</span><span class="label">Erros</span></div>
      <div class="stat"><span class="numero" style="color: #2196f3;">${totalPerguntas}</span><span class="label">Total de Questões</span></div>
    </div>
  `;

  // Se for o quiz completo, adiciona avaliação diagnóstica
  if (isQuizCompleto) {
    htmlEstatisticas += criarHtmlAvaliacaoDiagnostica(acertos);
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
  // Parar todos os áudios
  Object.values(audioElements).forEach(audio => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
  
  // Fechar AudioContext se existir
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }
  
  location.reload(); 
}

function voltarMenu() { 
  // Parar todos os áudios
  Object.values(audioElements).forEach(audio => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
  
  // Fechar AudioContext se existir
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }
  
  window.location.href = 'index.html'; 
}

// Controles do vídeo
if (btnVideo) {
  btnVideo.addEventListener('click', (e) => {
    e.preventDefault();
    if (!btnVideo.disabled) {
      if (videoContainer.style.display === 'none' || !videoContainer.style.display) {
        videoContainer.style.display = 'block';
        btnVideo.textContent = '⏹️ Fechar Vídeo';
        
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
}

// Event listeners principais - VERSÃO MELHORADA
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📱 Página carregada - Inicializando sistema...');
  
  // Detectar iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userUser) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  if (isIOS) {
    console.log('📱 Dispositivo iOS detectado - configurações especiais aplicadas');
  }
  
  // Inicializar áudio imediatamente
  await initializeAudioForIOS();
  
  const urlParams = new URLSearchParams(window.location.search);
  const tema = urlParams.get('tema');
  if (!document.getElementById('menu')) {
    await iniciarQuiz(tema);
  }
  
  // Listener específico para primeira interação
  let firstInteraction = false;
  
  const handleFirstInteraction = async (event) => {
    if (!firstInteraction) {
      console.log('🎯 Primeira interação detectada:', event.type);
      firstInteraction = true;
      await unlockAudioOnIOS();
    }
  };
  
  // Adicionar listeners para primeira interação
  ['click', 'touchend', 'touchstart'].forEach(eventType => {
    document.addEventListener(eventType, handleFirstInteraction, { 
      once: true, 
      passive: false 
    });
  });
});

// Controles de teclado para desktop
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

// Funções de debug melhoradas
window.debugAudio = () => {
  console.log('🔍 DEBUG ÁUDIO COMPLETO:');
  console.log('- Audio inicializado:', audioInicializado);
  console.log('- User interacted:', userInteracted);
  console.log('- AudioContext:', audioContext ? audioContext.state : 'N/A');
  console.log('- Buffers carregados:', Object.keys(audioBuffers));
  console.log('- Elementos HTML5:', Object.keys(audioElements));
  
  Object.keys(audioElements).forEach(key => {
    const audio = audioElements[key];
    if (audio) {
      console.log(`- ${key}:`, {
        readyState: audio.readyState,
        paused: audio.paused,
        volume: audio.volume,
        src: audio.src.substring(audio.src.lastIndexOf('/') + 1)
      });
    }
  });
};

window.testAudio = async (type) => {
  console.log(`🧪 Testando áudio: ${type}`);
  const result = await playAudioIOS(type);
  console.log(`🎵 Resultado do teste: ${result ? 'SUCESSO' : 'FALHA'}`);
  return result;
};

// Função para forçar desbloqueio manual
window.forceUnlock = async () => {
  console.log('🔧 Forçando desbloqueio manual...');
  userInteracted = false; // Reset para forçar novo unlock
  await unlockAudioOnIOS();
};

// Função adicional para verificar saúde do sistema de áudio
window.checkAudioHealth = () => {
  const health = {
    initialized: audioInicializado,
    userInteracted: userInteracted,
    webAudioAvailable: !!audioContext,
    webAudioState: audioContext ? audioContext.state : 'N/A',
    buffersLoaded: Object.keys(audioBuffers).length,
    htmlAudioReady: Object.values(audioElements).filter(a => a && a.readyState >= 2).length,
    totalAudioFiles: Object.keys(audioFiles).length
  };
  
  console.log('🏥 SAÚDE DO SISTEMA DE ÁUDIO:', health);
  
  // Verificar problemas comuns
  if (!health.initialized) {
    console.warn('⚠️ Sistema de áudio não inicializado!');
  }
  if (!health.userInteracted) {
    console.warn('⚠️ Usuário ainda não interagiu - áudio pode estar bloqueado!');
  }
  if (health.webAudioAvailable && health.webAudioState === 'suspended') {
    console.warn('⚠️ AudioContext suspenso - pode precisar de interação!');
  }
  if (health.buffersLoaded < health.totalAudioFiles) {
    console.warn('⚠️ Nem todos os buffers foram carregados!');
  }
  
  return health;
};

// Função de debug específica para eventos de toque
window.debugTouch = () => {
  console.log('👆 SISTEMA DE CONTROLE DE TOQUE:');
  console.log('- Touch events suportados:', 'ontouchstart' in window);
  console.log('- Dispositivo móvel detectado:', /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  console.log('- iOS detectado:', /iPad|iPhone|iPod/.test(navigator.userAgent));
  
  const botoes = document.querySelectorAll('.alternativas button');
  console.log(`- Botões de alternativas encontrados: ${botoes.length}`);
  
  // Adicionar listener temporário para debug
  botoes.forEach((botao, index) => {
    const debugListener = (e) => {
      console.log(`🎯 DEBUG Touch no botão ${index}:`, {
        type: e.type,
        timestamp: Date.now(),
        touches: e.touches ? e.touches.length : 'N/A',
        target: e.target.textContent.substring(0, 20) + '...'
      });
    };
    
    ['touchstart', 'touchmove', 'touchend', 'click'].forEach(eventType => {
      botao.addEventListener(eventType, debugListener, { once: true });
    });
  });
  
  console.log('✅ Debug de toque ativado - próximos toques serão logados');
};

// Função para testar comportamento de toque
window.testTouchBehavior = () => {
  console.log('🧪 TESTE DE COMPORTAMENTO DE TOQUE');
  
  const container = document.querySelector('.alternativas');
  if (!container) {
    console.log('❌ Container de alternativas não encontrado');
    return;
  }
  
  // Adicionar listeners temporários para análise
  let touchData = {};
  
  container.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchData = {
      startTime: Date.now(),
      startX: touch.clientX,
      startY: touch.clientY,
      element: e.target.tagName
    };
    console.log('📱 TouchStart:', touchData);
  }, { once: true });
  
  container.addEventListener('touchmove', (e) => {
    if (!touchData.startTime) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchData.startX);
    const deltaY = Math.abs(touch.clientY - touchData.startY);
    
    console.log('📱 TouchMove:', {
      deltaX,
      deltaY,
      isScrolling: deltaY > deltaX && deltaY > 10,
      element: e.target.tagName
    });
  }, { once: true });
  
  container.addEventListener('touchend', (e) => {
    const duration = Date.now() - touchData.startTime;
    console.log('📱 TouchEnd:', {
      duration,
      element: e.target.tagName,
      shouldClick: duration > 50 && duration < 1000
    });
  }, { once: true });
  
  console.log('✅ Listeners de teste adicionados - toque em uma alternativa');
};