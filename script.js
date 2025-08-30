// Estado do quiz
let perguntaAtual = 0;
let pontuacao = 0;
let perguntasSelecionadas = [];
let alternativaSelecionada = null;
let quizIniciado = false;
let perguntaRespondida = false; // NOVO: Controla se a pergunta foi respondida

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
  correto: new Audio('assets/game-start-317318.mp3'),
  errado: new Audio('assets/errado.mp3'),
  conclusao: new Audio('assets/conclusao.mp3')
};

// Configurar sons (caso não existam os arquivos)
Object.values(sons).forEach(som => {
  som.volume = 0.3;
  som.onerror = () => console.log('Arquivo de som não encontrado');
});

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
      <!-- PONTUAÇÃO COMENTADA - Para reativar, descomente a linha abaixo -->
      <!--<span id="pontuacao">Pontuação: ${pontuacao}</span>-->
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
  // PONTUAÇÃO COMENTADA - Para reativar, descomente as 2 linhas abaixo
  // const pontuacaoElement = document.getElementById('pontuacao');
  const progressoFill = document.getElementById('progresso-fill');
  
  if (perguntaNumero) perguntaNumero.textContent = `Pergunta ${perguntaAtual + 1} de ${perguntasSelecionadas.length}`;
  // PONTUAÇÃO COMENTADA - Para reativar, descomente a linha abaixo
  // if (pontuacaoElement) pontuacaoElement.textContent = `Pontuação: ${pontuacao}`;
  if (progressoFill) {
    const porcentagem = ((perguntaAtual + 1) / perguntasSelecionadas.length) * 100;
    progressoFill.style.width = `${porcentagem}%`;
  }
}

// NOVO: Controlar disponibilidade do botão de vídeo
function controlarBotaoVideo(pergunta) {
  if (!btnVideo) return;
  
  // Se a pergunta tem vídeo
  if (pergunta.video && pergunta.video !== '') {
    btnVideo.style.display = 'block';
    
    // Se ainda não foi respondida, desabilitar
    if (!perguntaRespondida) {
      btnVideo.disabled = true;
      btnVideo.style.opacity = '0.5';
      btnVideo.style.cursor = 'not-allowed';
      btnVideo.title = 'Responda a pergunta para assistir o vídeo';
      videoPlayer.src = ''; // Não carregar o vídeo ainda
    } else {
      // Pergunta foi respondida, habilitar vídeo
      btnVideo.disabled = false;
      btnVideo.style.opacity = '1';
      btnVideo.style.cursor = 'pointer';
      btnVideo.title = 'Clique para assistir a explicação';
      videoPlayer.src = pergunta.video;
    }
  } else {
    // Pergunta não tem vídeo, esconder botão
    btnVideo.style.display = 'none';
    videoPlayer.src = '';
  }
  
  // Sempre esconder o container do vídeo no início
  videoContainer.style.display = 'none';
}

// NOVO: Habilitar botão de vídeo após resposta
function habilitarBotaoVideo() {
  if (!btnVideo || btnVideo.style.display === 'none') return;
  
  const pergunta = perguntasSelecionadas[perguntaAtual];
  
  btnVideo.disabled = false;
  btnVideo.style.opacity = '1';
  btnVideo.style.cursor = 'pointer';
  btnVideo.title = 'Clique para assistir a explicação';
  
  // Carregar o vídeo só agora
  if (pergunta.video && pergunta.video !== '') {
    videoPlayer.src = pergunta.video;
  }
}

// Exibir pergunta
function exibirPergunta() {
  const pergunta = perguntasSelecionadas[perguntaAtual];
  perguntaRespondida = false; // NOVO: Reset do status da pergunta
  
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
    
    // Controlar botão de vídeo
    controlarBotaoVideo(pergunta);
    
    // Feedback e botão próxima
    feedback.textContent = '';
    btnProxima.style.display = 'block';
    btnProxima.textContent = 'Pular Pergunta';
    btnProxima.onclick = () => pularPergunta();
    
    // Animação de entrada
    document.querySelector('.card').style.opacity = '1';
    alternativasContainer.style.opacity = '1';
    
    // Atualizar progresso
    atualizarProgresso();
  }, 300);
}

// Função para pular pergunta
function pularPergunta() {
  if (alternativaSelecionada !== null) return; // Se já respondeu, não pode pular
  
  perguntaRespondida = true; // NOVO: Marcar como respondida
  habilitarBotaoVideo(); // NOVO: Habilitar vídeo mesmo pulando
  
  mostrarFeedback(false, 'Pergunta pulada! ⏭️');
  desabilitarAlternativas();
  
  // Alterar botão
  btnProxima.textContent = 'Continuar';
  btnProxima.onclick = () => proximaPergunta();
  
  setTimeout(() => {
    // Auto-avançar removido para dar tempo de ver o vídeo se quiser
  }, 1500);
}

// Selecionar alternativa
function selecionarAlternativa(index, botao) {
  if (alternativaSelecionada !== null) return;
  
  alternativaSelecionada = index;
  perguntaRespondida = true; // NOVO: Marcar pergunta como respondida
  
  const pergunta = perguntasSelecionadas[perguntaAtual];
  const respostaCorreta = pergunta.correta.charCodeAt(0) - 65; 
// "A"->0, "B"->1, "C"->2, "D"->3, "E"->4...
  const acertou = index === respostaCorreta;

  
  // Feedback visual
  botao.classList.add('selecionada');
  
  setTimeout(() => {
    mostrarFeedbackVisual(acertou, respostaCorreta);
    mostrarFeedback(acertou);
    
    // NOVO: Habilitar botão de vídeo após responder
    habilitarBotaoVideo();
    
    if (acertou) {
      pontuacao += calcularPontuacao();
      atualizarProgresso();
    }
    
    // Alterar texto do botão após responder
    btnProxima.textContent = 'Continuar';
    btnProxima.onclick = () => proximaPergunta();
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
    feedback.className = 'pergunta-pulada';
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

// Calcular pontuação
function calcularPontuacao() {
  return 100; // Pontuação base
}

// Desabilitar alternativas
function desabilitarAlternativas() {
  const botoes = alternativasContainer.querySelectorAll('button');
  botoes.forEach(botao => botao.disabled = true);
}

// Próxima pergunta
function proximaPergunta() {
  alternativaSelecionada = null; // resetar seleção
  perguntaRespondida = false; // NOVO: resetar status da resposta
  
  if (perguntaAtual < perguntasSelecionadas.length - 1) {
    perguntaAtual++;
    exibirPergunta();
  } else {
    exibirResultadoFinal();
  }
}

// FUNÇÃO MODIFICADA: Exibir resultado final com avaliação diagnóstica (PONTUAÇÃO COMENTADA)
function exibirResultadoFinal() {
  sons.conclusao.play();
  
  const totalPerguntas = perguntasSelecionadas.length;
  const acertos = Math.floor(pontuacao / 100);
  const erros = totalPerguntas - acertos;
  const porcentagemAcertos = ((acertos / totalPerguntas) * 100).toFixed(1);
  
  // Verificar se é quiz completo (100 questões) para aplicar avaliação diagnóstica
  const avaliacaoDiagnostica = obterAvaliacaoDiagnostica(acertos, totalPerguntas);
  
  // Classificação para quizzes de tema específico
  let classificacao = '';
  if (porcentagemAcertos >= 90) classificacao = 'Excelente! 🏆';
  else if (porcentagemAcertos >= 70) classificacao = 'Muito Bom! 🥈';
  else if (porcentagemAcertos >= 50) classificacao = 'Bom! 🥉';
  else classificacao = 'Continue estudando! 📚';
  
  let htmlEstatisticas = '';
  
  // Se for quiz completo (100 questões), usar avaliação diagnóstica
  if (avaliacaoDiagnostica) {
    htmlEstatisticas = `
      <div class="estatisticas">
        <div class="stat">
          <span class="numero" style="color: #4caf50;">${acertos}</span>
          <span class="label">Acertos</span>
        </div>
        <div class="stat">
          <span class="numero" style="color: #f44336;">${erros}</span>
          <span class="label">Erros</span>
        </div>
        <div class="stat">
          <span class="numero" style="color: #2196f3;">${totalPerguntas}</span>
          <span class="label">Total de Questões</span>
        </div>
      </div>
      
      ${criarHtmlAvaliacaoDiagnostica(acertos)}
    `;
  } else {
    // Para quizzes de temas específicos, usar sistema sem pontuação total
    htmlEstatisticas = `
      <div class="estatisticas">
        <div class="stat">
          <span class="numero" style="color: #4caf50;">${acertos}</span>
          <span class="label">Acertos</span>
        </div>
        <div class="stat">
          <span class="numero" style="color: #f44336;">${erros}</span>
          <span class="label">Erros</span>
        </div>
        <div class="stat">
          <span class="numero" style="color: #ff9800;">${porcentagemAcertos}%</span>
          <span class="label">Aproveitamento</span>
        </div>
        <!-- PONTUAÇÃO TOTAL COMENTADA - Para reativar, descomente o bloco abaixo -->
        <!--<div class="stat">
          <span class="numero" style="color: #2196f3;">${pontuacao}</span>
          <span class="label">Pontuação Total</span>
        </div>-->
      </div>
    `;
  }
  
  // Tela de resultados
  document.querySelector('.quiz-container').innerHTML = `
    <div class="resultado-final">
      <header>
        <img src="assets/logo.png" alt="Logo Portal Lab" class="logo">
        <h1>RESULTADO FINAL</h1>
      </header>
      
      <div class="resultado-card">
        <h2 style="color: #ff9800;">${avaliacaoDiagnostica ? 'Continue estudando! 📊' : classificacao}</h2>
        
        ${htmlEstatisticas}
        
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
  window.location.href = 'index.html';
}

// =========================
// CONTROLES DO VÍDEO
// =========================

// Event listener para o botão de vídeo
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

  // Se não houver menu, iniciar quiz com tema (se existir)
  if (!document.getElementById('menu')) {
    iniciarQuiz(tema);
  }
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
  
  // Atalho para pular pergunta (tecla Escape)
  if (tecla === 'Escape') {
    e.preventDefault();
    pularPergunta();
  }
  
  // NOVO: Atalho para assistir vídeo (tecla V)
  if (tecla.toLowerCase() === 'v' && perguntaRespondida && btnVideo && !btnVideo.disabled) {
    e.preventDefault();
    btnVideo.click();
  }
});