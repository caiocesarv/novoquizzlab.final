// Estado do quiz
let perguntaAtual = 0;
let pontuacao = 0;
let perguntasSelecionadas = [...perguntas];
let alternativaSelecionada = null;
let quizIniciado = false;
let perguntaRespondida = false;

// Elementos do DOM
const enunciado = document.getElementById('enunciado');
const imagem = document.getElementById('imagem');
const alternativasContainer = document.getElementById('alternativas');
const btnProxima = document.getElementById('btnProxima');
const feedback = document.getElementById('feedback');
const btnVideo = document.getElementById('btnVideoExplicacao');
const videoContainer = document.getElementById('videoPlayerContainer');
const videoPlayer = document.getElementById('videoPlayer');

// 🔹 Criar checkbox customizado
function criarCheckboxCustomizado(checked = false) {
  const checkbox = document.createElement('div');
  checkbox.className = 'checkbox-custom' + (checked ? ' checked' : '');
  return checkbox;
}

// 🔹 Selecionar alternativa
function selecionarAlternativaCheckbox(index, elemento) {
  if (alternativaSelecionada !== null) return;

  alternativaSelecionada = index;
  perguntaRespondida = true;

  const pergunta = perguntasSelecionadas[perguntaAtual];

  // Determinar resposta correta
  let respostaCorreta = -1;
  if (typeof pergunta.correta === "number") {
    respostaCorreta = pergunta.correta;
  } else if (typeof pergunta.correta === "string") {
    const letraCorreta = pergunta.correta.trim().toUpperCase();
    respostaCorreta = letraCorreta.charCodeAt(0) - 65;
  }

  const acertou = index === respostaCorreta;

  // Marca visual imediato
  const checkbox = elemento.querySelector('.checkbox-custom');
  checkbox.classList.add('checked');
  elemento.classList.add('selecionada');

  // Mostrar resultado visual
  setTimeout(() => {
    mostrarFeedbackVisual(acertou, respostaCorreta);
    mostrarFeedback(acertou);
    habilitarBotaoVideo();

    if (acertou) {
      pontuacao += 100;
    }

    btnProxima.textContent = 'Continuar';
    btnProxima.onclick = () => proximaPergunta();
  }, 300);
}

// 🔹 Mostrar feedback visual
function mostrarFeedbackVisual(acertou, respostaCorreta) {
  const itens = alternativasContainer.querySelectorAll('.alternativa-item');

  itens.forEach((item, index) => {
    const checkbox = item.querySelector('.checkbox-custom');

    if (index === respostaCorreta) {
      item.classList.add('correta');
      checkbox.classList.add('checked');
    } else if (index === alternativaSelecionada && !acertou) {
      item.classList.add('errada');
    }

    item.style.pointerEvents = 'none'; // trava os cliques depois de responder
  });
}

// 🔹 Mostrar feedback (texto)
function mostrarFeedback(acertou) {
  if (acertou) {
    feedback.textContent = 'Correto! Parabéns! 🎉';
    feedback.className = 'correto';
  } else {
    feedback.textContent = 'Incorreto 😔';
    feedback.className = 'errado';
  }

  feedback.style.transform = 'scale(1.1)';
  setTimeout(() => feedback.style.transform = 'scale(1)', 200);
}

// 🔹 Exibir pergunta
function exibirPergunta() {
  const pergunta = perguntasSelecionadas[perguntaAtual];
  perguntaRespondida = false;
  alternativaSelecionada = null;

  setTimeout(() => {
    enunciado.textContent = pergunta.enunciado;

    // Configurar imagem
    if (pergunta.imagem && pergunta.imagem !== '') {
      imagem.src = `assets/${pergunta.imagem}`;
      imagem.style.display = 'block';
      imagem.onerror = () => imagem.style.display = 'none';
    } else {
      imagem.style.display = 'none';
    }

    // Criar alternativas com checkboxes
    alternativasContainer.innerHTML = '';
    pergunta.alternativas.forEach((alt, index) => {
      const item = document.createElement('div');
      item.className = 'alternativa-item';

      const checkbox = criarCheckboxCustomizado();
      const texto = document.createElement('span');
      texto.className = 'alternativa-texto';
      texto.textContent = alt;

      item.appendChild(checkbox);
      item.appendChild(texto);

      // Event listener para seleção
      item.addEventListener('click', () => {
        selecionarAlternativaCheckbox(index, item);
      });

      alternativasContainer.appendChild(item);
    });

    controlarBotaoVideo(pergunta);

    feedback.textContent = '';
    feedback.className = '';
    btnProxima.textContent = 'Pular Pergunta';
    btnProxima.onclick = () => pularPergunta();

    atualizarProgresso();
  }, 300);
}

// 🔹 Pular pergunta
function pularPergunta() {
  if (alternativaSelecionada !== null) return;

  perguntaRespondida = true;
  habilitarBotaoVideo();
  feedback.textContent = 'Pergunta pulada! ⏭️';
  feedback.className = 'tempo-esgotado';

  // Desabilitar alternativas
  const itens = alternativasContainer.querySelectorAll('.alternativa-item');
  itens.forEach(item => item.style.pointerEvents = 'none');

  btnProxima.textContent = 'Continuar';
  btnProxima.onclick = () => proximaPergunta();
}

// 🔹 Próxima pergunta
function proximaPergunta() {
  alternativaSelecionada = null;
  perguntaRespondida = false;

  if (perguntaAtual < perguntasSelecionadas.length - 1) {
    perguntaAtual++;
    exibirPergunta();
  } else {
    exibirResultadoFinal();
  }
}

// 🔹 Resultado final
function exibirResultadoFinal() {
  const totalPerguntas = perguntasSelecionadas.length;
  const acertos = Math.floor(pontuacao / 100);
  const erros = totalPerguntas - acertos;

  document.querySelector('.quiz-container').innerHTML = `
    <div class="resultado-final">
      <header>
        <img src="assets/logo.png" alt="Logo Portal Lab" class="logo">
        <h1>RESULTADO FINAL</h1>
      </header>
      <div class="resultado-card">
        <h2 style="color: #ff9800;">Quiz Finalizado!</h2>
        <div class="estatisticas">
          <div class="stat"><span class="numero" style="color: #4caf50;">${acertos}</span><span class="label">Acertos</span></div>
          <div class="stat"><span class="numero" style="color: #f44336;">${erros}</span><span class="label">Erros</span></div>
          <div class="stat"><span class="numero" style="color: #2196f3;">${totalPerguntas}</span><span class="label">Total</span></div>
        </div>
        <div class="acoes-finais">
          <button onclick="location.reload()" class="btn-reiniciar">Refazer Quiz</button>
          <button onclick="window.location.href='index.html'" class="btn-menu">Voltar ao Menu</button>
        </div>
      </div>
    </div>
  `;
}

// 🔹 Controle do vídeo
function controlarBotaoVideo(pergunta) {
  if (!btnVideo) return;

  if (pergunta.video && pergunta.video !== '') {
    btnVideo.style.display = 'block';
    if (!perguntaRespondida) {
      btnVideo.disabled = true;
      btnVideo.style.opacity = '0.5';
    } else {
      btnVideo.disabled = false;
      btnVideo.style.opacity = '1';
      videoPlayer.src = pergunta.video;
    }
  } else {
    btnVideo.style.display = 'none';
  }
  videoContainer.style.display = 'none';
}

function habilitarBotaoVideo() {
  if (!btnVideo || btnVideo.style.display === 'none') return;
  btnVideo.disabled = false;
  btnVideo.style.opacity = '1';
}

// 🔹 Barra de progresso
function criarBarraProgresso() {
  const header = document.querySelector('header');
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

function atualizarProgresso() {
  const perguntaNumero = document.getElementById('pergunta-numero');
  const progressoFill = document.getElementById('progresso-fill');

  if (perguntaNumero) perguntaNumero.textContent = `Pergunta ${perguntaAtual + 1} de ${perguntasSelecionadas.length}`;
  if (progressoFill) {
    const porcentagem = ((perguntaAtual + 1) / perguntasSelecionadas.length) * 100;
    progressoFill.style.width = `${porcentagem}%`;
  }
}

// 🔹 Inicialização
function iniciarQuiz() {
  quizIniciado = true;
  perguntaAtual = 0;
  pontuacao = 0;
  criarBarraProgresso();
  exibirPergunta();
}

// Event listeners
if (btnVideo) {
  btnVideo.addEventListener('click', () => {
    if (!btnVideo.disabled) {
      if (videoContainer.style.display === 'none' || !videoContainer.style.display) {
        videoContainer.style.display = 'block';
        btnVideo.textContent = '⏹️ Fechar Vídeo';
      } else {
        videoContainer.style.display = 'none';
        btnVideo.textContent = '▶️ Assistir Explicação em Vídeo';
        if (videoPlayer) videoPlayer.pause();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  iniciarQuiz();
});

// Suporte a teclado (1 a 5 para marcar resposta)
document.addEventListener('keydown', (e) => {
  if (!quizIniciado || alternativaSelecionada !== null) return;

  const tecla = e.key;
  if (tecla >= '1' && tecla <= '5') {
    const index = parseInt(tecla) - 1;
    const itens = alternativasContainer.querySelectorAll('.alternativa-item');
    if (itens[index]) {
      selecionarAlternativaCheckbox(index, itens[index]);
    }
  }
});
