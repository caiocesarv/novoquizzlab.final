// Estado do quiz
let perguntaAtual = 0;
let pontuacao = 0;
let perguntasSelecionadas = [];
let alternativaSelecionada = null;
let quizIniciado = false;
let perguntaRespondida = false; // Controla se a pergunta foi respondida

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

// Sons do quiz
const sons = {
  correto: new Audio('assets/correto.mp3'),
  errado: new Audio('assets/errado.mp3'),
  conclusao: new Audio('assets/conclusao.mp3')
};

// Configurar sons com tratamento de erro melhorado
Object.values(sons).forEach(som => {
  som.volume = 0.3;
  som.onerror = () => console.log('Arquivo de som não encontrado');
});

// Função: avaliação diagnóstica
// NOVA FUNÇÃO: Determinar avaliação diagnóstica
function obterAvaliacaoDiagnostica(acertos, totalQuestoes) {
    // Só aplica a avaliação diagnóstica se for o quiz completo (100 questões)
    if (totalQuestoes !== 100) {
        return null; // Retorna null para usar o sistema normal de porcentagem
    }
    
    let nivel = "";
    let cor = "#ff9800"; // Cor padrão (laranja)
    
    if (acertos > 90) {
        nivel = "Referência no assunto";
        cor = "#9c27b0"; // Roxo para o nível mais alto
    } else if (acertos > 80) {
        nivel = "Professor no assunto";
        cor = "#673ab7"; // Roxo escuro
    } else if (acertos > 70) {
        nivel = "Ótimo conhecimento";
        cor = "#4caf50"; // Verde
    } else if (acertos > 60) {
        nivel = "Bom conhecimento";
        cor = "#2196f3"; // Azul
    } else if (acertos > 50) {
        nivel = "Conhecimento regular";
        cor = "#ff9800"; // Laranja
    } else {
        nivel = "Necessita mais estudos";
        cor = "#f44336"; // Vermelho
    }
    
    return { nivel, cor };
}

// NOVA FUNÇÃO: Criar HTML da avaliação diagnóstica
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

// Selecionar alternativa (CORRIGIDO)
function selecionarAlternativa(index, botao) {
  console.log("=== DEBUG SELECIONAR ALTERNATIVA ===");
  console.log("Index selecionado:", index);
  console.log("Alternativa já selecionada?", alternativaSelecionada);
  
  if (alternativaSelecionada !== null) {
    console.log("Alternativa já selecionada, saindo...");
    return;
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
    // Em caso de erro, não marcar como correta ou incorreta
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
  
  // Timeout reduzido para melhor responsividade
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
  }, 300); // Reduzido de 500ms para 300ms
  
  console.log("=== FIM DEBUG ===");
}

// Mostrar feedback visual (CORRIGIDO)
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

// Mostrar feedback (CORRIGIDO)
function mostrarFeedback(acertou, mensagem = null) {
  const feedbackElement = document.getElementById('feedback');
  
  if (mensagem) {
    feedbackElement.textContent = mensagem;
    feedbackElement.className = 'pergunta-pulada';
  } else if (acertou) {
    feedbackElement.textContent = 'Correto! Parabéns! 🎉';
    feedbackElement.className = 'correto';
    // Tocar som apenas se carregado
    if (sons.correto && sons.correto.readyState >= 2) {
      sons.correto.play().catch(e => console.log('Erro ao tocar som:', e));
    }
  } else {
    feedbackElement.textContent = 'Incorreto 😔';
    feedbackElement.className = 'errado';
    // Tocar som apenas se carregado
    if (sons.errado && sons.errado.readyState >= 2) {
      sons.errado.play().catch(e => console.log('Erro ao tocar som:', e));
    }
  }
  
  feedbackElement.style.transform = 'scale(1.1)';
  setTimeout(() => feedbackElement.style.transform = 'scale(1)', 200);
}

function calcularPontuacao() { return 100; }

function desabilitarAlternativas() {
  alternativasContainer.querySelectorAll('button').forEach(botao => botao.disabled = true);
}

// Próxima pergunta (CORRIGIDO)
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

// Exibir resultado final
function exibirResultadoFinal() {
  // Tocar som de conclusão com proteção
  if (sons.conclusao && sons.conclusao.readyState >= 2) {
    sons.conclusao.play().catch(e => console.log('Erro ao tocar som:', e));
  }
  
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

function reiniciarQuiz() { location.reload(); }
function voltarMenu() { window.location.href = 'index.html'; }

// Controles do vídeo
if (btnVideo) {
  btnVideo.addEventListener('click', () => {
    if (!btnVideo.disabled) {
      videoContainer.style.display = 'block';
      btnVideo.textContent = '⏹️ Fechar Vídeo';
      btnVideo.onclick = () => {
        videoContainer.style.display = 'none';
        btnVideo.textContent = '▶️ Assistir Explicação em Vídeo';
        btnVideo.onclick = () => {
          videoContainer.style.display = 'block';
          btnVideo.textContent = '⏹️ Fechar Vídeo';
        };
      };
    }
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tema = urlParams.get('tema');
  if (!document.getElementById('menu')) iniciarQuiz(tema);
});

document.addEventListener('keydown', (e) => {
  if (!quizIniciado || alternativaSelecionada !== null) return;
  const tecla = e.key;
  if (tecla >= '1' && tecla <= '5') {
    const index = parseInt(tecla) - 1;
    const botoes = alternativasContainer.querySelectorAll('button');
    if (botoes[index]) selecionarAlternativa(index, botoes[index]);
  }
  if (tecla === 'Escape') { e.preventDefault(); pularPergunta(); }
  if (tecla.toLowerCase() === 'v' && perguntaRespondida && btnVideo && !btnVideo.disabled) { e.preventDefault(); btnVideo.click(); }
});