// Estado do quiz
let perguntaAtual = 0;
let pontuacao = 0;
let perguntasSelecionadas = [];
let tempoRestante = 30;
let timerInterval;
let alternativaSelecionada = null;
let quizIniciado = false;

// Elementos do DOM
const enunciado = document.getElementById('enunciado');
const imagem = document.getElementById('imagem');
const alternativasContainer = document.getElementById('alternativas');
const btnProxima = document.getElementById('btnProxima');
const feedback = document.getElementById('feedback');

// Configuração dos temas
const temas = {
  'HEMÁCIAS e ANEMIAS': { inicio: 0, fim: 21 },
  'LEUCÓCITOS': { inicio: 22, fim: 41 },
  'PLAQUETAS': { inicio: 42, fim: 48 },
  'HEMOPARASITAS': { inicio: 49, fim: 54 },
  'LEUCEMIAS e LINFOMAS': { inicio: 55, fim: 99 }
};

// Sons do quiz
const sons = {
  correto: new Audio('assets/game-start-317318.mp3'),
  errado: new Audio('assets/errado.mp3'),
  tempo: new Audio('assets/tempo.mp3'),
  conclusao: new Audio('assets/conclusao.mp3')
};

// Configurar sons (caso não existam os arquivos)
Object.values(sons).forEach(som => {
  som.volume = 0.3;
  som.onerror = () => console.log('Arquivo de som não encontrado');
});

// Inicializar quiz
function iniciarQuiz(tema = null) {
  quizIniciado = true;
  
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
  
  // Esconder menu se existir
  const menu = document.getElementById('menu');
  if (menu) menu.style.display = 'none';
  
  // Mostrar quiz
  document.querySelector('.quiz-container').style.display = 'block';
}

// Criar barra de progresso
function criarBarraProgresso() {
  const header = document.querySelector('header');
  
  // Remover barra existente se houver
  const barraExistente = document.getElementById('progresso-container');
  if (barraExistente) barraExistente.remove();
  
  const progressoContainer = document.createElement('div');
  progressoContainer.id = 'progresso-container';
  progressoContainer.innerHTML = `
    <div class="progresso-info">
      <span id="pergunta-numero">Pergunta ${perguntaAtual + 1} de ${perguntasSelecionadas.length}</span>
      <span id="pontuacao">Pontuação: ${pontuacao}</span>
      <span id="timer">Tempo: 30s</span>
    </div>
    <div class="progresso-barra">
      <div id="progresso-fill"></div>
    </div>
    <div class="timer-barra-container">
      <div class="timer-barra">
        <div id="timer-fill"></div>
      </div>
    </div>
  `;
  
  header.appendChild(progressoContainer);
}

// Atualizar progresso
function atualizarProgresso() {
  const perguntaNumero = document.getElementById('pergunta-numero');
  const pontuacaoElement = document.getElementById('pontuacao');
  const progressoFill = document.getElementById('progresso-fill');
  
  if (perguntaNumero) perguntaNumero.textContent = `Pergunta ${perguntaAtual + 1} de ${perguntasSelecionadas.length}`;
  if (pontuacaoElement) pontuacaoElement.textContent = `Pontuação: ${pontuacao}`;
  if (progressoFill) {
    const porcentagem = ((perguntaAtual + 1) / perguntasSelecionadas.length) * 100;
    progressoFill.style.width = `${porcentagem}%`;
  }
}

// Timer com barra visual
function iniciarTimer() {
  tempoRestante = 30;
  const timerElement = document.getElementById('timer');
  const timerFill = document.getElementById('timer-fill');
  
  // Resetar barra do timer
  if (timerFill) {
    timerFill.style.width = '100%';
    timerFill.style.background = '#4caf50';
    timerFill.style.transition = 'width 0.1s linear, background-color 0.3s ease';
    timerFill.style.animation = 'none';
  }
  
  timerInterval = setInterval(() => {
    tempoRestante--;
    if (timerElement) timerElement.textContent = `Tempo: ${tempoRestante}s`;
    
    // Atualizar barra visual do timer
    if (timerFill) {
      const porcentagemTempo = (tempoRestante / 30) * 100;
      timerFill.style.width = `${porcentagemTempo}%`;
      
      // Mudar cor baseada no tempo restante
      if (porcentagemTempo > 66) {
        timerFill.style.background = '#4caf50'; // Verde
      } else if (porcentagemTempo > 33) {
        timerFill.style.background = '#ff9800'; // Laranja
      } else {
        timerFill.style.background = '#f44336'; // Vermelho
      }
      
      // Animação pulsante nos últimos 10 segundos
      if (tempoRestante <= 10) {
        timerFill.style.animation = 'pulse-timer 0.5s infinite';
      }
    }
    
    // Aviso visual nos últimos 10 segundos
    if (tempoRestante <= 10) {
      if (timerElement) timerElement.style.color = '#ff4444';
    }
    
    if (tempoRestante <= 0) {
      clearInterval(timerInterval);
      sons.tempo.play();
      mostrarFeedback(false, 'Tempo esgotado!');
      desabilitarAlternativas();
      setTimeout(() => proximaPergunta(), 2000);
    }
  }, 1000);
}

// Parar timer
function pararTimer() {
  clearInterval(timerInterval);
  const timerElement = document.getElementById('timer');
  const timerFill = document.getElementById('timer-fill');
  
  if (timerElement) timerElement.style.color = '#fff';
  if (timerFill) {
    timerFill.style.animation = 'none';
    timerFill.style.transition = 'none';
  }
}

// Exibir pergunta
function exibirPergunta() {
// Verificar vídeo
  const pergunta = perguntasSelecionadas[perguntaAtual];
  if (pergunta.video && pergunta.video !== '') {
    btnVideo.style.display = 'block';
    videoPlayer.src = pergunta.video;
    videoContainer.style.display = 'none';
  }   else {
    btnVideo.style.display = 'none';
    videoPlayer.src = '';
    videoContainer.style.display = 'none';
  }

  
  setTimeout(() => {
    // Atualizar conteúdo
    enunciado.textContent = pergunta.enunciado;
    
    // Imagem
    if (pergunta.imagem && pergunta.imagem !== '') {
      imagem.src = `assets/${pergunta.imagem}`;
      imagem.style.display = 'block';
      imagem.onerror = () => imagem.style.display = 'none';
    } else {
      imagem.style.display = 'none';
    }
    
    // Alternativas
    alternativasContainer.innerHTML = '';
    pergunta.alternativas.forEach((alt, index) => {
      const botao = document.createElement('button');
      botao.textContent = alt;
      botao.onclick = () => selecionarAlternativa(index, botao);
      alternativasContainer.appendChild(botao);
    });
    
    // Feedback e botão
    feedback.textContent = '';
    btnProxima.style.display = 'none';
    
    // Animação de entrada
    document.querySelector('.card').style.opacity = '1';
    alternativasContainer.style.opacity = '1';
    
    // Atualizar progresso e iniciar timer
    atualizarProgresso();
    iniciarTimer();
  }, 300);
}

// Selecionar alternativa
function selecionarAlternativa(index, botao) {
  if (alternativaSelecionada !== null) return;
  
  alternativaSelecionada = index;
  pararTimer();
  
  const pergunta = perguntasSelecionadas[perguntaAtual];
  const respostaCorreta = parseInt(pergunta.correta) - 1;
  const acertou = index === respostaCorreta;
  
  // Feedback visual
  botao.classList.add('selecionada');
  
  setTimeout(() => {
    mostrarFeedbackVisual(acertou, respostaCorreta);
    mostrarFeedback(acertou);
    
    if (acertou) {
      pontuacao += calcularPontuacao();
      atualizarProgresso();
    }
    
    setTimeout(() => proximaPergunta(), 3000);
  }, 500);
}

// Mostrar feedback visual nas alternativas
function mostrarFeedbackVisual(acertou, respostaCorreta) {
  const botoes = alternativasContainer.querySelectorAll('button');
  
  botoes.forEach((botao, index) => {
    if (index === respostaCorreta) {
      botao.classList.add('correta');
    } else if (index === alternativaSelecionada && !acertou) {
      botao.classList.add('errada');
    }
    botao.disabled = true;
  });
}

// Mostrar feedback textual
function mostrarFeedback(acertou, mensagem = null) {
  if (mensagem) {
    feedback.textContent = mensagem;
    feedback.className = 'tempo-esgotado';
  } else if (acertou) {
    feedback.textContent = 'Correto! Parabéns! 🎉';
    feedback.className = 'correto';
    sons.correto.play();
  } else {
    feedback.textContent = 'Incorreto 😔';
    feedback.className = 'errado';
    sons.errado.play();
  }
  
  // Animação do feedback
  feedback.style.transform = 'scale(1.1)';
  setTimeout(() => {
    feedback.style.transform = 'scale(1)';
  }, 200);
}

// Calcular pontuação baseada no tempo restante
function calcularPontuacao() {
  const pontuacaoBase = 100;
  const bonusTempo = Math.floor(tempoRestante * 2);
  return pontuacaoBase + bonusTempo;
}

// Desabilitar alternativas
function desabilitarAlternativas() {
  const botoes = alternativasContainer.querySelectorAll('button');
  botoes.forEach(botao => botao.disabled = true);
}

// Próxima pergunta
function proximaPergunta() {
  alternativaSelecionada = null; // resetar seleção
  if (perguntaAtual < perguntasSelecionadas.length - 1) {
    perguntaAtual++;
    exibirPergunta();
  } else {
    exibirResultadoFinal();
  }
}


// Exibir resultado final
function exibirResultadoFinal() {
  pararTimer();
  sons.conclusao.play();
  
  const totalPerguntas = perguntasSelecionadas.length;
  const acertos = Math.floor(pontuacao / 100);
  const porcentagemAcertos = ((acertos / totalPerguntas) * 100).toFixed(1);
  
  // Classificação
  let classificacao = '';
  if (porcentagemAcertos >= 90) classificacao = 'Excelente! 🏆';
  else if (porcentagemAcertos >= 70) classificacao = 'Muito Bom! 🥈';
  else if (porcentagemAcertos >= 50) classificacao = 'Bom! 🥉';
  else classificacao = 'Continue estudando! 📚';
  
  // Tela de resultados
  document.querySelector('.quiz-container').innerHTML = `
    <div class="resultado-final">
      <header>
        <img src="assets/logo.png" alt="Logo Portal Lab" class="logo">
        <h1>RESULTADO FINAL</h1>
      </header>
      
      <div class="resultado-card">
        <h2>${classificacao}</h2>
        <div class="estatisticas">
          <div class="stat">
            <span class="numero">${acertos}</span>
            <span class="label">Acertos</span>
          </div>
          <div class="stat">
            <span class="numero">${totalPerguntas - acertos}</span>
            <span class="label">Erros</span>
          </div>
          <div class="stat">
            <span class="numero">${porcentagemAcertos}%</span>
            <span class="label">Aproveitamento</span>
          </div>
          <div class="stat">
            <span class="numero">${pontuacao}</span>
            <span class="label">Pontuação Total</span>
          </div>
        </div>
        
        <div class="acoes-finais">
          <button onclick="reiniciarQuiz()" class="btn-reiniciar">Refazer Quiz</button>
          <button onclick="voltarMenu()" class="btn-menu">Voltar ao Menu</button>
        </div>
      </div>
    </div>
  `;
}

// Reiniciar quiz
function reiniciarQuiz() {
  location.reload();
}

// Voltar ao menu
function voltarMenu() {
  location.reload();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Se não houver menu, iniciar quiz completo
  if (!document.getElementById('menu')) {
    iniciarQuiz();
  }
  
  // Prevenir fechar acidentalmente
  window.addEventListener('beforeunload', (e) => {
    if (quizIniciado && perguntaAtual < perguntasSelecionadas.length) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
});

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
  if (!quizIniciado || alternativaSelecionada !== null) return;
  
  const tecla = e.key;
  if (tecla >= '1' && tecla <= '5') {
    const index = parseInt(tecla) - 1;
    const botoes = alternativasContainer.querySelectorAll('button');
    if (botoes[index]) {
      selecionarAlternativa(index, botoes[index]);
    }
  }
});
const btnVideo = document.getElementById('btnVideoExplicacao');
const videoContainer = document.getElementById('videoPlayerContainer');
const videoPlayer = document.getElementById('videoPlayer');

// Inicializa vídeo oculto
videoContainer.style.display = 'none';
videoPlayer.src = '';

btnVideo.addEventListener('click', () => {
  videoContainer.style.display = 'block';
  btnVideo.style.display = 'none';

  // ... [todo o seu código acima permanece igual até o final do arquivo]

const btnVideo = document.getElementById('btnVideoExplicacao');
const videoContainer = document.getElementById('videoPlayerContainer');
const videoPlayer = document.getElementById('videoPlayer');

videoContainer.style.display = 'none';
videoPlayer.src = '';

btnVideo.addEventListener('click', () => {
  videoContainer.style.display = 'block';
  btnVideo.style.display = 'none';
});

// Função para extrair parâmetros da URL
function getParametroUrl(nome) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(nome);
}

// DOMContentLoaded com suporte a ?tema=...
document.addEventListener('DOMContentLoaded', () => {
  const temaUrl = getParametroUrl('tema');

  if (!document.getElementById('menu')) {
    if (temaUrl && temas[temaUrl]) {
      iniciarQuiz(temaUrl);
    } else {
      iniciarQuiz(); // Quiz completo se não houver tema válido
    }
  }

  window.addEventListener('beforeunload', (e) => {
    if (quizIniciado && perguntaAtual < perguntasSelecionadas.length) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
});

});

