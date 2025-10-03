// =========================
// Sons
// =========================
const somCorreto = new Audio("assets/correto.mp3");
somCorreto.volume = 0.7;

const somErrado = new Audio("assets/errado.mp3");
somErrado.volume = 0.7;

const somConclusao = new Audio("assets/conclusao.mp3");
somConclusao.volume = 0.7;

function tocarSom(som) {
  som.pause();
  som.currentTime = 0;
  som.play();
}

// =========================
// Estado do quiz
// =========================
let perguntaAtual = 0;
let pontuacao = 0;
let alternativaSelecionada = null;
let perguntaRespondida = false;
let quizIniciado = false;

// =========================
// DOM
// =========================
const enunciado = document.getElementById('enunciado');
const imagem = document.getElementById('imagem');
const alternativasContainer = document.getElementById('alternativas');
const btnProxima = document.getElementById('btnProxima');
const feedback = document.getElementById('feedback');
const btnVideo = document.getElementById('btnVideoExplicacao');
const videoContainer = document.getElementById('videoPlayerContainer');
const videoPlayer = document.getElementById('videoPlayer');

// =========================
// Seleção de perguntas por tema
// =========================
function obterTemaSelecionado() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("tema"); // exemplo: "HEMÁCIAS e ANEMIAS"
}

let perguntasSelecionadas = [];
const tema = obterTemaSelecionado();

if (tema) {
  perguntasSelecionadas = perguntas.filter(p => p.topico === tema);
} else {
  perguntasSelecionadas = [...perguntas]; // quiz completo
}

// =========================
// Funções principais
// =========================
function criarCheckboxCustomizado() {
  const checkbox = document.createElement('div');
  checkbox.className = 'checkbox-custom';
  return checkbox;
}

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

  // Marcar checkbox
  const checkbox = elemento.querySelector('.checkbox-custom');
  checkbox.classList.add('checked');
  elemento.classList.add('selecionada');

  setTimeout(() => {
    mostrarFeedbackVisual(acertou, respostaCorreta);
    mostrarFeedback(acertou);
    habilitarBotaoVideo();

    if (acertou) {
      pontuacao += 100;
      atualizarProgresso();
    }

    btnProxima.textContent = 'Continuar';
    btnProxima.onclick = () => proximaPergunta();
  }, 300);
}

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

    // Desabilitar clique
    item.style.pointerEvents = 'none';
  });
}

function mostrarFeedback(acertou) {
  if (acertou) {
    feedback.textContent = 'Correto! Parabéns! 🎉';
    feedback.className = 'correto';
    tocarSom(somCorreto);
  } else {
    feedback.textContent = 'Incorreto 😔';
    feedback.className = 'errado';
    tocarSom(somErrado);
  }

  feedback.style.transform = 'scale(1.1)';
  setTimeout(() => feedback.style.transform = 'scale(1)', 200);
}

function exibirPergunta() {
  const pergunta = perguntasSelecionadas[perguntaAtual];
  perguntaRespondida = false;
  alternativaSelecionada = null;

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
    const item = document.createElement('div');
    item.className = 'alternativa-item';

    const checkbox = criarCheckboxCustomizado();
    const texto = document.createElement('span');
    texto.className = 'alternativa-texto';
    texto.textContent = alt;

    item.appendChild(checkbox);
    item.appendChild(texto);

    // ✅ Clique só no checkbox
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
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
}

function pularPergunta() {
  if (alternativaSelecionada !== null) return;

  perguntaRespondida = true;
  habilitarBotaoVideo();
  feedback.textContent = 'Pergunta pulada! ⏭️';
  feedback.className = 'tempo-esgotado';

  const itens = alternativasContainer.querySelectorAll('.alternativa-item');
  itens.forEach(item => item.style.pointerEvents = 'none');

  btnProxima.textContent = 'Continuar';
  btnProxima.onclick = () => proximaPergunta();
}

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

function exibirResultadoFinal() {
  const totalPerguntas = perguntasSelecionadas.length;
  const acertos = Math.floor(pontuacao / 100);
  const erros = totalPerguntas - acertos;

  tocarSom(somConclusao);

  // HTML base do resultado final
  let html = `
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
  `;

  // 👉 Se for o quiz completo (100 questões), adiciona avaliação diagnóstica
  if (totalPerguntas === 100) {
    html += criarHtmlAvaliacaoDiagnostica(acertos);
  }

  html += `
        <div class="acoes-finais">
          <button onclick="location.reload()" class="btn-reiniciar">Refazer Quiz</button>
          <button onclick="window.location.href='index.html'" class="btn-menu">Voltar ao Menu</button>
        </div>
      </div>
    </div>
  `;

  document.querySelector('.quiz-container').innerHTML = html;
}


// =========================
// Botão de vídeo
// =========================
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

// =========================
// Progresso
// =========================
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

// =========================
// Inicialização
// =========================
function iniciarQuiz() {
  quizIniciado = true;
  perguntaAtual = 0;
  pontuacao = 0;
  criarBarraProgresso();
  exibirPergunta();
}

document.addEventListener('DOMContentLoaded', () => {
  iniciarQuiz();
});

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
                font-size: 2.5rem;
                font-weight: bold;
                color: ${avaliacao.cor};
                margin-bottom: 0.5rem;
            ">
                ${acertos} acertos
            </div>
            <div style="
                font-size: 1.5rem;
                color: ${avaliacao.cor};
                font-weight: bold;
            ">
                ${avaliacao.nivel}
            </div>
        </div>
    </div>
  `;
}
