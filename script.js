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
async function iniciarQuizComToqueLimpo(tema) {
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
  exibirPerguntaComToqueLimpo();
  
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
function exibirPerguntaComToqueLimpo(){
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
      exibirPerguntaComToqueLimpo();
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
    await iniciarQuizComToqueLimpo(tema);
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

// Variáveis para controle de confirmação mobile
let isMobileDevice = false;
let alternativaSelecionadaTemp = null;
let aguardandoConfirmacao = false;

// Detectar se é dispositivo mobile
function detectarMobile() {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android.*(?:Mobile|Tablet)/i.test(userAgent) && window.innerWidth <= 1024;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobile || isTablet || (isTouchDevice && window.innerWidth <= 768);
}

// Criar botão de confirmação para mobile
function criarBotaoConfirmacao() {
  const botaoConfirmar = document.createElement('button');
  botaoConfirmar.id = 'btnConfirmarMobile';
  botaoConfirmar.className = 'btn-confirmar-mobile';
  botaoConfirmar.innerHTML = '✓ Confirmar Resposta';
  botaoConfirmar.style.display = 'none';
  
  botaoConfirmar.addEventListener('click', () => {
    confirmarResposta();
  });
  
  botaoConfirmar.addEventListener('touchend', (e) => {
    e.preventDefault();
    confirmarResposta();
  });
  
  return botaoConfirmar;
}

// Criar botão de cancelar seleção
function criarBotaoCancelar() {
  const botaoCancelar = document.createElement('button');
  botaoCancelar.id = 'btnCancelarMobile';
  botaoCancelar.className = 'btn-cancelar-mobile';
  botaoCancelar.innerHTML = '✗ Cancelar';
  botaoCancelar.style.display = 'none';
  
  botaoCancelar.addEventListener('click', () => {
    cancelarSelecao();
  });
  
  botaoCancelar.addEventListener('touchend', (e) => {
    e.preventDefault();
    cancelarSelecao();
  });
  
  return botaoCancelar;
}

// Função para mostrar botões de confirmação
function mostrarConfirmacaoMobile(index, botaoSelecionado) {
  if (!isMobileDevice) return false;
  
  console.log('📱 Mostrando confirmação mobile para alternativa:', index);
  
  alternativaSelecionadaTemp = index;
  aguardandoConfirmacao = true;
  
  // Adicionar classe visual ao botão selecionado
  const botoes = alternativasContainer.querySelectorAll('button');
  botoes.forEach(btn => btn.classList.remove('selecionada-temp'));
  botaoSelecionado.classList.add('selecionada-temp');
  
  // Mostrar botões de confirmação
  const btnConfirmar = document.getElementById('btnConfirmarMobile');
  const btnCancelar = document.getElementById('btnCancelarMobile');
  
  if (btnConfirmar && btnCancelar) {
    btnConfirmar.style.display = 'block';
    btnCancelar.style.display = 'block';
    
    // Esconder botão de pular pergunta temporariamente
    btnProxima.style.display = 'none';
    
    // Mostrar feedback temporário
    feedback.textContent = 'Confirme sua escolha:';
    feedback.className = 'aguardando-confirmacao';
    
    // Scroll suave até os botões de confirmação
    setTimeout(() => {
      btnConfirmar.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
  
  return true;
}

// Função para confirmar resposta
async function confirmarResposta() {
  if (!aguardandoConfirmacao || alternativaSelecionadaTemp === null) return;
  
  console.log('✅ Confirmando resposta:', alternativaSelecionadaTemp);
  
  // Esconder botões de confirmação
  esconderBotoesConfirmacao();
  
  // Executar lógica original de seleção
  alternativaSelecionada = alternativaSelecionadaTemp;
  perguntaRespondida = true;
  aguardandoConfirmacao = false;
  
  const pergunta = perguntasSelecionadas[perguntaAtual];
  let respostaCorreta = -1;
  
  if (typeof pergunta.correta === "number") {
    respostaCorreta = pergunta.correta;
  } else if (typeof pergunta.correta === "string") {
    const letraCorreta = pergunta.correta.trim().toUpperCase();
    respostaCorreta = letraCorreta.charCodeAt(0) - 65;
  }
  
  const acertou = alternativaSelecionada === respostaCorreta;
  
  // Mostrar resultado visual
  mostrarFeedbackVisual(acertou, respostaCorreta);
  await mostrarFeedback(acertou);
  
  if (acertou) {
    pontuacao += calcularPontuacao();
    atualizarProgresso();
  }
  
  habilitarBotaoVideo();
  btnProxima.style.display = 'block';
  btnProxima.textContent = 'Continuar';
  btnProxima.onclick = () => proximaPergunta();
}

// Função para cancelar seleção
function cancelarSelecao() {
  if (!aguardandoConfirmacao) return;
  
  console.log('❌ Cancelando seleção mobile');
  
  // Limpar seleção temporária
  alternativaSelecionadaTemp = null;
  aguardandoConfirmacao = false;
  
  // Remover classe visual
  const botoes = alternativasContainer.querySelectorAll('button');
  botoes.forEach(btn => btn.classList.remove('selecionada-temp'));
  
  // Esconder botões de confirmação
  esconderBotoesConfirmacao();
  
  // Restaurar estado original
  feedback.textContent = '';
  feedback.className = '';
  btnProxima.style.display = 'block';
  btnProxima.textContent = 'Pular Pergunta';
  btnProxima.onclick = () => pularPergunta();
}

// Função para esconder botões de confirmação
function esconderBotoesConfirmacao() {
  const btnConfirmar = document.getElementById('btnConfirmarMobile');
  const btnCancelar = document.getElementById('btnCancelarMobile');
  
  if (btnConfirmar) btnConfirmar.style.display = 'none';
  if (btnCancelar) btnCancelar.style.display = 'none';
}

// Função modificada para criar botão de alternativa com confirmação mobile
function criarBotaoAlternativaComConfirmacao(alt, index) {
  const botao = document.createElement('button');
  botao.textContent = alt;
  
  // Dados de controle de toque
  let touchData = {
    startTime: 0,
    startX: 0,
    startY: 0,
    moved: false,
    isScrolling: false
  };
  
  // TouchStart
  botao.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchData = {
      startTime: Date.now(),
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false,
      isScrolling: false
    };
    
    botao.classList.add('touching');
  }, { passive: true });
  
  // TouchMove
  botao.addEventListener('touchmove', (e) => {
    if (!touchData.startTime) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchData.startX);
    const deltaY = Math.abs(touch.clientY - touchData.startY);
    
    if (deltaX > 3 || deltaY > 3) {
      touchData.moved = true;
    }
    
    if (deltaY > deltaX && deltaY > 8) {
      touchData.isScrolling = true;
      botao.classList.remove('touching');
    }
  }, { passive: true });
  
  // TouchEnd com sistema de confirmação
  botao.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    const touchDuration = Date.now() - touchData.startTime;
    botao.classList.remove('touching');
    
    // Verificações de bloqueio (mesmo sistema anterior)
    if (touchData.isScrolling || touchDuration < 80 || 
        (touchDuration > 800 && touchData.moved) ||
        alternativaSelecionada !== null || aguardandoConfirmacao) {
      return;
    }
    
    // MOBILE: Mostrar confirmação ao invés de selecionar diretamente
    if (isMobileDevice) {
      mostrarConfirmacaoMobile(index, botao);
    } else {
      // DESKTOP: Seleção direta
      selecionarAlternativa(index, botao);
    }
    
  }, { passive: false });
  
  // Click para desktop
  botao.addEventListener('click', (e) => {
    if (!('ontouchstart' in window) || e.isTrusted === false) {
      e.preventDefault();
      if (!isMobileDevice) {
        selecionarAlternativa(index, botao);
      }
    }
  });
  
  return botao;
}

// Função exibirPergunta() modificada
function exibirPerguntaComToqueLimpo() {
  const pergunta = perguntasSelecionadas[perguntaAtual];
  perguntaRespondida = false;
  aguardandoConfirmacao = false;
  alternativaSelecionadaTemp = null;
  
  setTimeout(() => {
    enunciado.textContent = pergunta.enunciado;
    
    if (pergunta.imagem && pergunta.imagem !== '') {
      imagem.src = `assets/${pergunta.imagem}`;
      imagem.style.display = 'block';
      imagem.onerror = () => imagem.style.display = 'none';
    } else {
      imagem.style.display = 'none';
    }
    
    // Limpar e recriar alternativas
    alternativasContainer.innerHTML = '';
    pergunta.alternativas.forEach((alt, index) => {
      const botao = criarBotaoAlternativaComConfirmacao(alt, index);
      alternativasContainer.appendChild(botao);
    });
    
    // Adicionar botões de confirmação mobile se necessário
    if (isMobileDevice) {
      if (!document.getElementById('btnConfirmarMobile')) {
        const containerConfirmacao = document.createElement('div');
        containerConfirmacao.className = 'confirmacao-mobile-container';
        
        const btnConfirmar = criarBotaoConfirmacao();
        const btnCancelar = criarBotaoCancelar();
        
        containerConfirmacao.appendChild(btnCancelar);
        containerConfirmacao.appendChild(btnConfirmar);
        
        // Inserir após as alternativas
        alternativasContainer.parentNode.insertBefore(
          containerConfirmacao, 
          alternativasContainer.nextSibling
        );
      }
    }
    
    controlarBotaoVideo(pergunta);
    
    feedback.textContent = '';
    feedback.className = '';
    btnProxima.style.display = 'block';
    btnProxima.textContent = 'Pular Pergunta';
    btnProxima.onclick = () => pularPergunta();
    
    document.querySelector('.card').style.opacity = '1';
    alternativasContainer.style.opacity = '1';
    atualizarProgresso();
  }, 300);
}

// Inicialização com detecção de mobile
function iniciarQuizComToqueLimpo(tema) {
  console.log('🎯 Iniciando quiz com confirmação mobile...');
  
  // Detectar dispositivo mobile
  isMobileDevice = detectarMobile();
  console.log('📱 Mobile detectado:', isMobileDevice);
  
  // Aplicar sistema ultra-responsivo APENAS em mobile
  if (isMobileDevice) {
    iniciarSistemaUltraResponsivo();
    aplicarEstilosMobileUltraResponsivos();
  }
  
  quizIniciado = true;
  
  // ... resto do código igual
}

// Função de debug para confirmação mobile
window.debugConfirmacao = () => {
  console.log('🔍 DEBUG CONFIRMAÇÃO MOBILE:');
  console.log('- É mobile:', isMobileDevice);
  console.log('- Aguardando confirmação:', aguardandoConfirmacao);
  console.log('- Seleção temporária:', alternativaSelecionadaTemp);
  console.log('- Botões existem:', {
    confirmar: !!document.getElementById('btnConfirmarMobile'),
    cancelar: !!document.getElementById('btnCancelarMobile')
  });
};
// SISTEMA DE TOQUE LIMPO PARA MOBILE - VERSÃO OTIMIZADA
// Remove hover effects e cria sistema de clique + confirmação robusto

// Função para aplicar estilos CSS limpos (sem hover effects)
function aplicarEstilosMobileUltraResponsivos() {
  let styleElement = document.getElementById('mobile-clean-style');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'mobile-clean-style';
    document.head.appendChild(styleElement);
  }
  
  styleElement.textContent = `
    /* REMOVER TODOS OS HOVER EFFECTS EM MOBILE */
    @media (hover: none) and (pointer: coarse) {
      #alternativas button:hover {
        background-color: initial !important;
        transform: none !important;
        box-shadow: none !important;
      }
      
      #alternativas button:active {
        background-color: initial !important;
        transform: none !important;
      }
    }
    
    /* ESTILOS ESPECÍFICOS PARA MOBILE */
    #alternativas button {
      /* Remover animações de toque em mobile */
      -webkit-tap-highlight-color: transparent !important;
      touch-action: manipulation !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      
      /* Visual limpo sem feedback de toque */
      transition: none !important;
      transform: none !important;
    }
    
    /* Remover classe touching que causava problemas */
    #alternativas button.touching {
      background-color: initial !important;
      transform: none !important;
      transition: none !important;
    }
    
    /* Estado de seleção temporária - mais sutil */
    #alternativas button.selecionada-temp {
      background-color: rgba(33, 150, 243, 0.2) !important;
      border: 2px solid #2196f3 !important;
      color: #ffffff !important;
      font-weight: bold !important;
    }
    
    /* Permitir scroll livre na imagem */
    #imagem {
      touch-action: auto !important;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    
    /* Container principal - scroll livre */
    .quiz-container, .card, #enunciado {
      touch-action: auto !important;
      -webkit-overflow-scrolling: touch;
    }
    
    /* Botões de confirmação */
    .confirmacao-mobile-container {
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    
    .btn-confirmar-mobile, .btn-cancelar-mobile {
      padding: 12px 24px !important;
      border-radius: 8px !important;
      font-weight: bold !important;
      font-size: 16px !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    
    .btn-confirmar-mobile {
      background-color: #4caf50 !important;
      border: 2px solid #4caf50 !important;
      color: white !important;
    }
    
    .btn-cancelar-mobile {
      background-color: #f44336 !important;
      border: 2px solid #f44336 !important;
      color: white !important;
    }
  `;
}

// Função para criar botão de alternativa com toque limpo
function criarBotaoAlternativaUltraResponsivo(alt, index) {
  const botao = document.createElement('button');
  botao.textContent = alt;
  
  // Variáveis para controle de toque robusto
  let touchData = {
    startTime: 0,
    startX: 0,
    startY: 0,
    startScrollY: 0,
    moved: false,
    isScrolling: false,
    touchId: null
  };
  
  // TouchStart - inicializar dados
  botao.addEventListener('touchstart', (e) => {
    // Prevenir múltiplos toques
    if (touchData.touchId !== null) return;
    
    const touch = e.touches[0];
    touchData = {
      startTime: Date.now(),
      startX: touch.clientX,
      startY: touch.clientY,
      startScrollY: window.pageYOffset,
      moved: false,
      isScrolling: false,
      touchId: touch.identifier
    };
    
    // SEM feedback visual durante toque inicial
    
  }, { passive: true });
  
  // TouchMove - detectar movimento/scroll
  botao.addEventListener('touchmove', (e) => {
    // Verificar se é o mesmo toque
    const currentTouch = Array.from(e.touches).find(t => t.identifier === touchData.touchId);
    if (!currentTouch || !touchData.startTime) return;
    
    const deltaX = Math.abs(currentTouch.clientX - touchData.startX);
    const deltaY = Math.abs(currentTouch.clientY - touchData.startY);
    const scrollDelta = Math.abs(window.pageYOffset - touchData.startScrollY);
    
    // Detectar movimento significativo
    if (deltaX > 8 || deltaY > 8) {
      touchData.moved = true;
    }
    
    // Detectar scroll (mais rigoroso)
    if ((deltaY > 15 && deltaY > deltaX) || scrollDelta > 5) {
      touchData.isScrolling = true;
    }
    
  }, { passive: true });
  
  // TouchEnd - processar clique
  botao.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar se é o mesmo toque
    if (touchData.touchId === null) return;
    
    const touchDuration = Date.now() - touchData.startTime;
    const scrollDelta = Math.abs(window.pageYOffset - touchData.startScrollY);
    
    // Reset touch ID
    touchData.touchId = null;
    
    // CONDIÇÕES RIGOROSAS para bloquear clique acidental
    const shouldBlock = (
      touchData.isScrolling ||                    // Estava fazendo scroll
      scrollDelta > 8 ||                         // Página se moveu muito
      touchDuration < 100 ||                     // Toque muito rápido (acidental)
      touchDuration > 1200 ||                    // Toque muito longo
      (touchData.moved && touchDuration < 200) || // Movimento rápido
      alternativaSelecionada !== null ||         // Já respondeu
      aguardandoConfirmacao                      // Aguardando confirmação
    );
    
    if (shouldBlock) {
      console.log('🚫 Clique bloqueado:', {
        scrolling: touchData.isScrolling,
        scrollDelta,
        duration: touchDuration,
        moved: touchData.moved,
        jaRespondida: alternativaSelecionada !== null
      });
      return;
    }
    
    console.log('✅ Clique válido - selecionando alternativa:', index);
    
    // MOBILE: Mostrar confirmação (sem feedback visual de toque)
    if (isMobileDevice) {
      mostrarConfirmacaoImediata(index, botao);
    } else {
      // DESKTOP: Seleção direta
      selecionarAlternativa(index, botao);
    }
    
  }, { passive: false });
  
  // Click para desktop (sem mudanças)
  botao.addEventListener('click', (e) => {
    // Apenas para desktop (sem touch)
    if (!('ontouchstart' in window)) {
      e.preventDefault();
      if (!isMobileDevice) {
        selecionarAlternativa(index, botao);
      }
    }
  });
  
  return botao;
}

// Função para mostrar confirmação limpa (sem efeitos visuais durante seleção)
function mostrarConfirmacaoImediata(index, botaoSelecionado) {
  if (!isMobileDevice) return false;
  
  console.log('📱 Mostrando confirmação limpa para alternativa:', index);
  
  alternativaSelecionadaTemp = index;
  aguardandoConfirmacao = true;
  
  // Aplicar estilo de seleção APENAS após clique confirmado
  const botoes = alternativasContainer.querySelectorAll('button');
  botoes.forEach(btn => btn.classList.remove('selecionada-temp'));
  botaoSelecionado.classList.add('selecionada-temp');
  
  // Mostrar botões de confirmação
  const btnConfirmar = document.getElementById('btnConfirmarMobile');
  const btnCancelar = document.getElementById('btnCancelarMobile');
  
  if (btnConfirmar && btnCancelar) {
    btnConfirmar.style.display = 'block';
    btnCancelar.style.display = 'block';
    
    // Esconder botão de pular pergunta
    btnProxima.style.display = 'none';
    
    // Mostrar feedback claro
    feedback.textContent = 'Confirme sua escolha ou cancele para selecionar outra:';
    feedback.className = 'aguardando-confirmacao';
    
    // Scroll suave até os botões (opcional)
    setTimeout(() => {
      btnConfirmar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  }
  
  return true;
}

// Função para confirmar resposta (sem mudanças)
async function confirmarRespostaRapida() {
  if (!aguardandoConfirmacao || alternativaSelecionadaTemp === null) return;
  
  console.log('✅ Confirmando resposta:', alternativaSelecionadaTemp);
  
  // Esconder botões de confirmação
  esconderBotoesConfirmacao();
  
  // Executar lógica original
  alternativaSelecionada = alternativaSelecionadaTemp;
  perguntaRespondida = true;
  aguardandoConfirmacao = false;
  
  const pergunta = perguntasSelecionadas[perguntaAtual];
  let respostaCorreta = -1;
  
  if (typeof pergunta.correta === "number") {
    respostaCorreta = pergunta.correta;
  } else if (typeof pergunta.correta === "string") {
    const letraCorreta = pergunta.correta.trim().toUpperCase();
    respostaCorreta = letraCorreta.charCodeAt(0) - 65;
  }
  
  const acertou = alternativaSelecionada === respostaCorreta;
  
  // Mostrar resultado
  mostrarFeedbackVisual(acertou, respostaCorreta);
  await mostrarFeedback(acertou);
  
  if (acertou) {
    pontuacao += calcularPontuacao();
    atualizarProgresso();
  }
  
  habilitarBotaoVideo();
  btnProxima.style.display = 'block';
  btnProxima.textContent = 'Continuar';
  btnProxima.onclick = () => proximaPergunta();
}

// Função para cancelar seleção (melhorada)
function cancelarSelecaoRapida() {
  if (!aguardandoConfirmacao) return;
  
  console.log('❌ Cancelando seleção limpa');
  
  // Limpar seleção temporária
  alternativaSelecionadaTemp = null;
  aguardandoConfirmacao = false;
  
  // Remover feedback visual
  const botoes = alternativasContainer.querySelectorAll('button');
  botoes.forEach(btn => btn.classList.remove('selecionada-temp'));
  
  // Esconder botões de confirmação
  esconderBotoesConfirmacao();
  
  // Restaurar estado original
  feedback.textContent = '';
  feedback.className = '';
  btnProxima.style.display = 'block';
  btnProxima.textContent = 'Pular Pergunta';
  btnProxima.onclick = () => pularPergunta();
}

// Criar botões de confirmação com touch limpo
function criarBotaoConfirmacaoUltraResponsivo() {
  const botaoConfirmar = document.createElement('button');
  botaoConfirmar.id = 'btnConfirmarMobile';
  botaoConfirmar.className = 'btn-confirmar-mobile';
  botaoConfirmar.innerHTML = '✓ Confirmar Resposta';
  botaoConfirmar.style.display = 'none';
  
  // Touch limpo para confirmação
  let confirmTouchId = null;
  
  botaoConfirmar.addEventListener('touchstart', (e) => {
    confirmTouchId = e.touches[0].identifier;
  }, { passive: true });
  
  botaoConfirmar.addEventListener('touchend', (e) => {
    if (confirmTouchId !== null) {
      e.preventDefault();
      e.stopPropagation();
      confirmTouchId = null;
      confirmarRespostaRapida();
    }
  }, { passive: false });
  
  // Fallback click
  botaoConfirmar.addEventListener('click', (e) => {
    if (!('ontouchstart' in window)) {
      e.preventDefault();
      confirmarRespostaRapida();
    }
  });
  
  return botaoConfirmar;
}

function criarBotaoCancelarUltraResponsivo() {
  const botaoCancelar = document.createElement('button');
  botaoCancelar.id = 'btnCancelarMobile';
  botaoCancelar.className = 'btn-cancelar-mobile';
  botaoCancelar.innerHTML = '✗ Cancelar';
  botaoCancelar.style.display = 'none';
  
  // Touch limpo para cancelamento
  let cancelTouchId = null;
  
  botaoCancelar.addEventListener('touchstart', (e) => {
    cancelTouchId = e.touches[0].identifier;
  }, { passive: true });
  
  botaoCancelar.addEventListener('touchend', (e) => {
    if (cancelTouchId !== null) {
      e.preventDefault();
      e.stopPropagation();
      cancelTouchId = null;
      cancelarSelecaoRapida();
    }
  }, { passive: false });
  
  // Fallback click
  botaoCancelar.addEventListener('click', (e) => {
    if (!('ontouchstart' in window)) {
      e.preventDefault();
      cancelarSelecaoRapida();
    }
  });
  
  return botaoCancelar;
}

// Função principal para exibir pergunta com sistema limpo
function exibirPerguntaComToqueLimpo() {
  const pergunta = perguntasSelecionadas[perguntaAtual];
  perguntaRespondida = false;
  aguardandoConfirmacao = false;
  alternativaSelecionadaTemp = null;
  
  setTimeout(() => {
    enunciado.textContent = pergunta.enunciado;
    
    if (pergunta.imagem && pergunta.imagem !== '') {
      imagem.src = `assets/${pergunta.imagem}`;
      imagem.style.display = 'block';
      imagem.onerror = () => imagem.style.display = 'none';
    } else {
      imagem.style.display = 'none';
    }
    
    // Recriar alternativas com sistema limpo
    alternativasContainer.innerHTML = '';
    pergunta.alternativas.forEach((alt, index) => {
      const botao = criarBotaoAlternativaUltraResponsivo(alt, index);
      alternativasContainer.appendChild(botao);
    });
    
    // Adicionar botões de confirmação mobile
    if (isMobileDevice) {
      if (!document.getElementById('btnConfirmarMobile')) {
        const containerConfirmacao = document.createElement('div');
        containerConfirmacao.className = 'confirmacao-mobile-container';
        
        const btnConfirmar = criarBotaoConfirmacaoUltraResponsivo();
        const btnCancelar = criarBotaoCancelarUltraResponsivo();
        
        containerConfirmacao.appendChild(btnCancelar);
        containerConfirmacao.appendChild(btnConfirmar);
        
        alternativasContainer.parentNode.insertBefore(
          containerConfirmacao, 
          alternativasContainer.nextSibling
        );
      }
    }
    
    controlarBotaoVideo(pergunta);
    
    feedback.textContent = '';
    feedback.className = '';
    btnProxima.style.display = 'block';
    btnProxima.textContent = 'Pular Pergunta';
    btnProxima.onclick = () => pularPergunta();
    
    document.querySelector('.card').style.opacity = '1';
    alternativasContainer.style.opacity = '1';
    atualizarProgresso();
  }, 300);
}

// Função principal para inicializar quiz com toque limpo
function iniciarQuizComToqueLimpo(tema) {
  console.log('🎯 Iniciando quiz com sistema de toque limpo...');
  
  // Detectar dispositivo mobile
  isMobileDevice = detectarMobile();
  console.log('📱 Mobile detectado:', isMobileDevice);
  
  // Aplicar estilos limpos se for mobile
  if (isMobileDevice) {
    aplicarEstilosMobileUltraResponsivos();
    iniciarSistemaUltraResponsivo();
  }
  
  quizIniciado = true;
  
  // Inicializar áudio
  if (!audioInicializado) {
    initializeAudioForIOS();
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
  exibirPerguntaComToqueLimpo();
  
  const menu = document.getElementById('menu');
  if (menu) menu.style.display = 'none';
  document.querySelector('.quiz-container').style.display = 'block';
}

// Função de debug para sistema limpo
window.debugToqueLimpo = () => {
  console.log('🔍 DEBUG TOQUE LIMPO:');
  console.log('- É mobile:', isMobileDevice);
  console.log('- Aguardando confirmação:', aguardandoConfirmacao);
  console.log('- Seleção temporária:', alternativaSelecionadaTemp);
  console.log('- Estilos aplicados:', !!document.getElementById('mobile-clean-style'));
  
  const botoes = alternativasContainer.querySelectorAll('button');
  console.log('- Botões de alternativas:', botoes.length);
  botoes.forEach((btn, i) => {
    console.log(`  Botão ${i}:`, {
      touchAction: getComputedStyle(btn).touchAction,
      classes: Array.from(btn.classList)
    });
  });
};

// SISTEMA DE TOQUE MOBILE SUPER RESPONSIVO
// Substitui as funções existentes no seu código

// Função otimizada para criar botão de alternativa com toque ultra-responsivo
function criarBotaoAlternativaUltraResponsivo(alt, index) {
  const botao = document.createElement('button');
  botao.textContent = alt;
  
  // Variáveis simplificadas para controle de toque
  let touchData = {
    startTime: 0,
    startY: 0,
    initialScrollY: 0,
    touchStarted: false,
    identifier: null
  };
  
  // TouchStart - muito simples
  botao.addEventListener('touchstart', (e) => {
    // Prevenir múltiplos toques simultâneos
    if (touchData.touchStarted) return;
    
    const touch = e.touches[0];
    touchData = {
      startTime: Date.now(),
      startY: touch.clientY,
      initialScrollY: window.pageYOffset,
      touchStarted: true,
      identifier: touch.identifier
    };
    
    // Feedback visual imediato e sutil
    botao.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
    
  }, { passive: true });
  
  // TouchMove - apenas para detectar scroll real
  botao.addEventListener('touchmove', (e) => {
    // Verificar se é o mesmo toque
    const currentTouch = Array.from(e.touches).find(t => t.identifier === touchData.identifier);
    if (!currentTouch || !touchData.touchStarted) return;
    
    const deltaY = Math.abs(currentTouch.clientY - touchData.startY);
    const scrollDelta = Math.abs(window.pageYOffset - touchData.initialScrollY);
    
    // Marcar como scroll apenas se movimento for significativo E a página realmente se moveu
    if (deltaY > 25 && scrollDelta > 15) {
      touchData.isScrolling = true;
      // Remover feedback visual se começou a fazer scroll
      botao.style.backgroundColor = '';
    }
    
  }, { passive: true });
  
  // TouchEnd - MUITO mais permissivo
  botao.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar se é o mesmo toque
    if (!touchData.touchStarted || touchData.identifier === null) return;
    
    const touchDuration = Date.now() - touchData.startTime;
    const scrollDelta = Math.abs(window.pageYOffset - touchData.initialScrollY);
    
    // Limpar dados de toque
    touchData.touchStarted = false;
    touchData.identifier = null;
    
    // Remover feedback visual
    botao.style.backgroundColor = '';
    
    // CONDIÇÕES MUITO MAIS PERMISSIVAS - apenas bloqueios essenciais
    const shouldBlock = (
      alternativaSelecionada !== null ||         // Já respondeu
      aguardandoConfirmacao ||                   // Aguardando confirmação
      touchData.isScrolling ||                   // Detectou scroll real
      touchDuration < 50 ||                      // Toque muito rápido (acidental)
      touchDuration > 2000 ||                    // Toque muito longo (provavelmente acidental)
      scrollDelta > 30                           // Página se moveu muito (scroll real)
    );
    
    if (shouldBlock) {
      console.log('🚫 Clique bloqueado:', {
        jaRespondida: alternativaSelecionada !== null,
        aguardando: aguardandoConfirmacao,
        scrolling: touchData.isScrolling,
        duration: touchDuration,
        scrollDelta
      });
      return;
    }
    
    console.log('✅ TOQUE VÁLIDO - selecionando alternativa:', index);
    
    // SELEÇÃO IMEDIATA - sem delay
    if (isMobileDevice) {
      mostrarConfirmacaoImediata(index, botao);
    } else {
      selecionarAlternativa(index, botao);
    }
    
  }, { passive: false });
  
  // Click para desktop (inalterado)
  botao.addEventListener('click', (e) => {
    if (!('ontouchstart' in window)) {
      e.preventDefault();
      if (!isMobileDevice) {
        selecionarAlternativa(index, botao);
      }
    }
  });
  
  return botao;
}

// Função para mostrar confirmação de forma IMEDIATA
function mostrarConfirmacaoImediata(index, botaoSelecionado) {
  if (!isMobileDevice) return false;
  
  console.log('⚡ CONFIRMAÇÃO IMEDIATA para alternativa:', index);
  
  alternativaSelecionadaTemp = index;
  aguardandoConfirmacao = true;
  
  // Aplicar estilo de seleção IMEDIATAMENTE
  const botoes = alternativasContainer.querySelectorAll('button');
  botoes.forEach(btn => btn.classList.remove('selecionada-temp'));
  botaoSelecionado.classList.add('selecionada-temp');
  
  // Mostrar botões de confirmação IMEDIATAMENTE
  const btnConfirmar = document.getElementById('btnConfirmarMobile');
  const btnCancelar = document.getElementById('btnCancelarMobile');
  
  if (btnConfirmar && btnCancelar) {
    btnConfirmar.style.display = 'block';
    btnCancelar.style.display = 'block';
    
    // Esconder botão de pular pergunta
    btnProxima.style.display = 'none';
    
    // Feedback mais claro e direto
    feedback.textContent = 'Sua escolha: "' + botaoSelecionado.textContent + '"';
    feedback.className = 'aguardando-confirmacao';
    
    // Scroll suave e rápido até os botões
    requestAnimationFrame(() => {
      btnConfirmar.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'center'
      });
    });
    
    // Vibração leve para confirmação (se disponível)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }
  
  return true;
}

// Botões de confirmação com toque ultra-responsivo
function criarBotaoConfirmacaoUltraResponsivo() {
  const botaoConfirmar = document.createElement('button');
  botaoConfirmar.id = 'btnConfirmarMobile';
  botaoConfirmar.className = 'btn-confirmar-mobile';
  botaoConfirmar.innerHTML = '✓ CONFIRMAR';
  botaoConfirmar.style.display = 'none';
  
  // Sistema de toque simplificado para confirmação
  let confirmTouch = false;
  
  botaoConfirmar.addEventListener('touchstart', (e) => {
    confirmTouch = true;
    // Feedback visual imediato
    botaoConfirmar.style.transform = 'scale(0.95)';
    botaoConfirmar.style.backgroundColor = '#45a049';
  }, { passive: true });
  
  botaoConfirmar.addEventListener('touchend', (e) => {
    if (confirmTouch) {
      e.preventDefault();
      e.stopPropagation();
      confirmTouch = false;
      
      // Restaurar visual
      botaoConfirmar.style.transform = 'scale(1)';
      botaoConfirmar.style.backgroundColor = '#4caf50';
      
      // Vibração de confirmação
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
      
      // Executar confirmação
      confirmarRespostaRapida();
    }
  }, { passive: false });
  
  // Reset se sair do botão
  botaoConfirmar.addEventListener('touchcancel', () => {
    confirmTouch = false;
    botaoConfirmar.style.transform = 'scale(1)';
    botaoConfirmar.style.backgroundColor = '#4caf50';
  });
  
  return botaoConfirmar;
}

function criarBotaoCancelarUltraResponsivo() {
  const botaoCancelar = document.createElement('button');
  botaoCancelar.id = 'btnCancelarMobile';
  botaoCancelar.className = 'btn-cancelar-mobile';
  botaoCancelar.innerHTML = '✗ CANCELAR';
  botaoCancelar.style.display = 'none';
  
  // Sistema de toque simplificado para cancelamento
  let cancelTouch = false;
  
  botaoCancelar.addEventListener('touchstart', (e) => {
    cancelTouch = true;
    // Feedback visual imediato
    botaoCancelar.style.transform = 'scale(0.95)';
    botaoCancelar.style.backgroundColor = '#da190b';
  }, { passive: true });
  
  botaoCancelar.addEventListener('touchend', (e) => {
    if (cancelTouch) {
      e.preventDefault();
      e.stopPropagation();
      cancelTouch = false;
      
      // Restaurar visual
      botaoCancelar.style.transform = 'scale(1)';
      botaoCancelar.style.backgroundColor = '#f44336';
      
      // Vibração de cancelamento
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      // Executar cancelamento
      cancelarSelecaoRapida();
    }
  }, { passive: false });
  
  // Reset se sair do botão
  botaoCancelar.addEventListener('touchcancel', () => {
    cancelTouch = false;
    botaoCancelar.style.transform = 'scale(1)';
    botaoCancelar.style.backgroundColor = '#f44336';
  });
  
  return botaoCancelar;
}

// Confirmação rápida
async function confirmarRespostaRapida() {
  if (!aguardandoConfirmacao || alternativaSelecionadaTemp === null) return;
  
  console.log('⚡ CONFIRMAÇÃO RÁPIDA:', alternativaSelecionadaTemp);
  
  // Esconder botões de confirmação
  esconderBotoesConfirmacao();
  
  // Executar lógica original
  alternativaSelecionada = alternativaSelecionadaTemp;
  perguntaRespondida = true;
  aguardandoConfirmacao = false;
  
  const pergunta = perguntasSelecionadas[perguntaAtual];
  let respostaCorreta = -1;
  
  if (typeof pergunta.correta === "number") {
    respostaCorreta = pergunta.correta;
  } else if (typeof pergunta.correta === "string") {
    const letraCorreta = pergunta.correta.trim().toUpperCase();
    respostaCorreta = letraCorreta.charCodeAt(0) - 65;
  }
  
  const acertou = alternativaSelecionada === respostaCorreta;
  
  // Mostrar resultado
  mostrarFeedbackVisual(acertou, respostaCorreta);
  await mostrarFeedback(acertou);
  
  if (acertou) {
    pontuacao += calcularPontuacao();
    atualizarProgresso();
  }
  
  habilitarBotaoVideo();
  btnProxima.style.display = 'block';
  btnProxima.textContent = 'Continuar';
  btnProxima.onclick = () => proximaPergunta();
}

// Cancelamento rápido
function cancelarSelecaoRapida() {
  if (!aguardandoConfirmacao) return;
  
  console.log('⚡ CANCELAMENTO RÁPIDO');
  
  // Limpar seleção
  alternativaSelecionadaTemp = null;
  aguardandoConfirmacao = false;
  
  // Remover feedback visual
  const botoes = alternativasContainer.querySelectorAll('button');
  botoes.forEach(btn => btn.classList.remove('selecionada-temp'));
  
  // Esconder botões
  esconderBotoesConfirmacao();
  
  // Restaurar estado
  feedback.textContent = '';
  feedback.className = '';
  btnProxima.style.display = 'block';
  btnProxima.textContent = 'Pular Pergunta';
  btnProxima.onclick = () => pularPergunta();
}

// CSS aprimorado para melhor responsividade
function aplicarEstilosMobileUltraResponsivos() {
  let styleElement = document.getElementById('mobile-ultra-responsive-style');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'mobile-ultra-responsive-style';
    document.head.appendChild(styleElement);
  }
  
  styleElement.textContent = `
    /* ESTILOS ULTRA-RESPONSIVOS PARA MOBILE */
    @media (hover: none) and (pointer: coarse) {
      /* Remover todos os hover effects */
      #alternativas button:hover {
        background-color: initial !important;
        transform: none !important;
        box-shadow: none !important;
      }
    }
    
    /* Botões de alternativas otimizados */
    #alternativas button {
      -webkit-tap-highlight-color: transparent !important;
      touch-action: manipulation !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      transition: background-color 0.1s ease !important;
      min-height: 50px !important;
      padding: 12px 16px !important;
      font-size: 16px !important;
    }
    
    /* Estado de seleção temporária mais visível */
    #alternativas button.selecionada-temp {
      background-color: rgba(33, 150, 243, 0.3) !important;
      border: 3px solid #2196f3 !important;
      color: #ffffff !important;
      font-weight: bold !important;
      transform: scale(1.02) !important;
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3) !important;
    }
    
    /* Container de confirmação otimizado */
    .confirmacao-mobile-container {
      margin-top: 1.5rem !important;
      display: flex !important;
      gap: 1rem !important;
      justify-content: center !important;
      align-items: center !important;
      padding: 0 1rem !important;
    }
    
    /* Botões de confirmação maiores e mais visíveis */
    .btn-confirmar-mobile, .btn-cancelar-mobile {
      padding: 16px 32px !important;
      border-radius: 12px !important;
      font-weight: bold !important;
      font-size: 18px !important;
      min-height: 56px !important;
      min-width: 140px !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent !important;
      transition: all 0.1s ease !important;
      border: none !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
    }
    
    .btn-confirmar-mobile {
      background-color: #4caf50 !important;
      color: white !important;
    }
    
    .btn-cancelar-mobile {
      background-color: #f44336 !important;
      color: white !important;
    }
    
    /* Feedback de confirmação mais visível */
    #feedback.aguardando-confirmacao {
      background-color: rgba(33, 150, 243, 0.1) !important;
      border: 2px solid #2196f3 !important;
      padding: 12px !important;
      border-radius: 8px !important;
      margin: 1rem 0 !important;
      font-size: 16px !important;
      font-weight: bold !important;
      color: #2196f3 !important;
      text-align: center !important;
    }
    
    /* Melhorar área de toque para todos os botões */
    button {
      min-height: 44px !important;
    }
    
    /* Scroll suave */
    html {
      scroll-behavior: smooth !important;
    }
  `;
}

// Função para inicializar o sistema ultra-responsivo
function iniciarSistemaUltraResponsivo() {
  console.log('⚡ Iniciando sistema ultra-responsivo para mobile...');
  
  // Aplicar estilos otimizados
  if (isMobileDevice) {
    aplicarEstilosMobileUltraResponsivos();
  }
  
  // Configurações adicionais para iOS
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.body.style.webkitTouchCallout = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.userSelect = 'none';
  }
  
  console.log('✅ Sistema ultra-responsivo ativo!');
}

// SUBSTITUIR AS FUNÇÕES ORIGINAIS NO SEU CÓDIGO PRINCIPAL:

// Substitua "criarBotaoAlternativaLimpo" por "criarBotaoAlternativaUltraResponsivo"
// Substitua "mostrarConfirmacaoMobileLimpa" por "mostrarConfirmacaoImediata"  
// Substitua "criarBotaoConfirmacaoLimpo" por "criarBotaoConfirmacaoUltraResponsivo"
// Substitua "criarBotaoCancelarUltraResponsivo" por "criarBotaoCancelarUltraResponsivo"
// Substitua "aplicarEstilosMobileUltraResponsivos" por "aplicarEstilosMobileUltraResponsivos"

// E adicione esta chamada no início da função iniciarQuizComToqueLimpo:
// iniciarSistemaUltraResponsivo();

// Função de debug atualizada
window.debugUltraResponsivo = () => {
  console.log('🔍 DEBUG SISTEMA ULTRA-RESPONSIVO:');
  console.log('- É mobile:', isMobileDevice);
  console.log('- Aguardando confirmação:', aguardandoConfirmacao);
  console.log('- Seleção temporária:', alternativaSelecionadaTemp);
  console.log('- Suporte à vibração:', !!navigator.vibrate);
  console.log('- Estilos aplicados:', !!document.getElementById('mobile-ultra-responsive-style'));
  
  // Testar responsividade
  const botoes = alternativasContainer.querySelectorAll('button');
  console.log('- Botões encontrados:', botoes.length);
  console.log('- Área de toque mínima atendida:', 
    Array.from(botoes).every(btn => btn.offsetHeight >= 44));
};

