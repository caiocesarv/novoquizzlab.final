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

// Sons do quiz - NOVA IMPLEMENTAÇÃO PARA iOS
const audioFiles = {
  correto: 'assets/correto.mp3',
  errado: 'assets/errado.mp3',
  conclusao: 'assets/conclusao.mp3'
};

let audioElements = {};

// Função SUPER específica para iOS
function initializeAudioForIOS() {
  console.log('🔊 Inicializando áudio para iOS...');
  
  try {
    // Criar elementos de áudio
    Object.keys(audioFiles).forEach(key => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.3;
      audio.src = audioFiles[key];
      
      // Configurações específicas para iOS
      audio.setAttribute('playsinline', true);
      audio.setAttribute('webkit-playsinline', true);
      audio.muted = false;
      
      // Event listeners para debug
      audio.addEventListener('canplaythrough', () => {
        console.log(`✅ Áudio ${key} carregado completamente`);
      });
      
      audio.addEventListener('error', (e) => {
        console.error(`❌ Erro ao carregar ${key}:`, e);
      });
      
      audio.addEventListener('loadstart', () => {
        console.log(`⏳ Carregando ${key}...`);
      });
      
      audioElements[key] = audio;
    });
    
    audioInicializado = true;
    console.log('✅ Áudio inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar áudio:', error);
    audioInicializado = false;
  }
}

// Função para "unlock" áudio no iOS
function unlockAudioOnIOS() {
  if (userInteracted) return;
  
  console.log('🔓 Tentando desbloquear áudio no iOS...');
  
  // Tocar um som silencioso para desbloquear
  Object.values(audioElements).forEach(audio => {
    if (audio && audio.readyState >= 2) {
      const originalVolume = audio.volume;
      audio.volume = 0.01;
      audio.currentTime = 0;
      
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.then(() => {
          console.log('🔊 Áudio desbloqueado!');
          audio.pause();
          audio.currentTime = 0;
          audio.volume = originalVolume;
          userInteracted = true;
        }).catch(e => {
          console.log('❌ Falha ao desbloquear:', e);
        });
      }
    }
  });
}

// Função para tocar som - VERSÃO iOS OTIMIZADA
function playAudioIOS(soundType) {
  return new Promise((resolve) => {
    console.log(`🔊 Tentando tocar som: ${soundType}`);
    
    if (!audioInicializado || !audioElements[soundType]) {
      console.log('❌ Áudio não inicializado ou som não encontrado');
      resolve(false);
      return;
    }
    
    const audio = audioElements[soundType];
    
    // Reset do áudio
    try {
      audio.currentTime = 0;
    } catch (e) {
      console.log('⚠️ Não foi possível resetar currentTime');
    }
    
    // Tentar tocar múltiplas vezes se necessário
    let attempts = 0;
    const maxAttempts = 3;
    
    function attemptPlay() {
      attempts++;
      console.log(`🔄 Tentativa ${attempts} de tocar ${soundType}`);
      
      const playPromise = audio.play();
      
      if (playPromise) {
        playPromise.then(() => {
          console.log(`✅ Som ${soundType} tocado com sucesso!`);
          resolve(true);
        }).catch(error => {
          console.log(`❌ Erro na tentativa ${attempts}:`, error);
          
          if (attempts < maxAttempts) {
            // Tentar novamente após um delay
            setTimeout(() => {
              attemptPlay();
            }, 100);
          } else {
            console.log(`❌ Falha após ${maxAttempts} tentativas`);
            resolve(false);
          }
        });
      } else {
        // Fallback para navegadores mais antigos
        try {
          audio.play();
          console.log(`✅ Som ${soundType} tocado (fallback)!`);
          resolve(true);
        } catch (e) {
          console.log(`❌ Fallback falhou:`, e);
          resolve(false);
        }
      }
    }
    
    attemptPlay();
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
  console.log('🎯 Iniciando quiz...');
  quizIniciado = true;
  
  // Inicializar áudio imediatamente
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

// Selecionar alternativa
function selecionarAlternativa(index, botao) {
  console.log("🎯 Selecionando alternativa:", index);
  
  if (alternativaSelecionada !== null) {
    console.log("⚠️ Alternativa já selecionada");
    return;
  }
  
  // TENTAR DESBLOQUEAR ÁUDIO NA PRIMEIRA INTERAÇÃO
  if (!userInteracted) {
    unlockAudioOnIOS();
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

// Mostrar feedback
async function mostrarFeedback(acertou, mensagem = null) {
  const feedbackElement = document.getElementById('feedback');
  
  if (mensagem) {
    feedbackElement.textContent = mensagem;
    feedbackElement.className = 'pergunta-pulada';
  } else if (acertou) {
    feedbackElement.textContent = 'Correto! Parabéns! 🎉';
    feedbackElement.className = 'correto';
    console.log('🔊 Tentando tocar som CORRETO...');
    await playAudioIOS('correto');
  } else {
    feedbackElement.textContent = 'Incorreto 😔';
    feedbackElement.className = 'errado';
    console.log('🔊 Tentando tocar som ERRADO...');
    await playAudioIOS('errado');
  }
  
  feedbackElement.style.transform = 'scale(1.1)';
  setTimeout(() => feedbackElement.style.transform = 'scale(1)', 200);
}

function calcularPontuacao() { return 100; }

function desabilitarAlternativas() {
  alternativasContainer.querySelectorAll('button').forEach(botao => botao.disabled = true);
}

// Próxima pergunta
function proximaPergunta() {
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
  console.log('🔊 Tentando tocar som CONCLUSÃO...');
  await playAudioIOS('conclusao');
  
  const totalPerguntas = perguntasSelecionadas.length;
  const acertos = Math.floor(pontuacao / 100);
  const erros = totalPerguntas - acertos;
  const porcentagemAcertos = ((acertos / totalPerguntas) * 100).toFixed(1);
  const avaliacaoDiagnostica = obterAvaliacaoDiagnostica(acertos, totalPerguntas);
  
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
  // Pausar todos os áudios
  Object.values(audioElements).forEach(audio => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
  location.reload(); 
}

function voltarMenu() { 
  // Pausar todos os áudios
  Object.values(audioElements).forEach(audio => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
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

// Event listeners principais
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 Página carregada - Detectando dispositivo...');
  
  // Detectar se é iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  if (isIOS) {
    console.log('📱 Dispositivo iOS detectado!');
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const tema = urlParams.get('tema');
  if (!document.getElementById('menu')) iniciarQuiz(tema);
  
  // Listeners para desbloquear áudio na primeira interação
  const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'click'];
  
  unlockEvents.forEach(eventType => {
    document.addEventListener(eventType, () => {
      if (!userInteracted && audioInicializado) {
        console.log(`🔓 Primeira interação detectada via ${eventType}`);
        unlockAudioOnIOS();
      }
    }, { once: true, passive: false });
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

// Debug para iOS
window.debugAudio = () => {
  console.log('🔍 DEBUG ÁUDIO:');
  console.log('- Audio inicializado:', audioInicializado);
  console.log('- User interacted:', userInteracted);
  console.log('- Elementos de áudio:', audioElements);
  Object.keys(audioElements).forEach(key => {
    const audio = audioElements[key];
    if (audio) {
      console.log(`- ${key}:`, {
        readyState: audio.readyState,
        paused: audio.paused,
        volume: audio.volume,
        src: audio.src
      });
    }
  });
};

// Expor função de debug globalmente
window.testAudio = (type) => {
  console.log(`🧪 Testando áudio: ${type}`);
  playAudioIOS(type);
};