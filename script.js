// Adicione esta função após as outras funções de controle de toque

// Função para permitir scroll sobre a imagem
function configurarScrollImagem() {
  const imagemElemento = document.getElementById('imagem');
  
  if (!imagemElemento) return;
  
  // Permitir scroll natural sobre a imagem
  imagemElemento.addEventListener('touchstart', (e) => {
    // Não fazer nada - permitir comportamento padrão
  }, { passive: true });
  
  imagemElemento.addEventListener('touchmove', (e) => {
    // Permitir scroll natural - não prevenir default
    e.stopPropagation(); // Impedir que o evento borbulhe para elementos pai
  }, { passive: true });
  
  imagemElemento.addEventListener('touchend', (e) => {
    // Permitir comportamento padrão de scroll
    e.stopPropagation(); // Impedir que interfira com outros elementos
  }, { passive: true });
  
  // Estilo CSS para garantir que a imagem seja scrollável
  imagemElemento.style.touchAction = 'auto';
  imagemElemento.style.userSelect = 'none';
  imagemElemento.style.webkitUserSelect = 'none';
}

// Função melhorada para configurar toda a área de scroll
function configurarScrollContainer() {
  // Elementos que devem permitir scroll natural
  const elementosScroll = [
    '#imagem',
    '.card',
    '.quiz-container',
    '#enunciado'
  ];
  
  elementosScroll.forEach(selector => {
    const elemento = document.querySelector(selector);
    if (elemento) {
      elemento.style.touchAction = 'auto';
      elemento.style.webkitOverflowScrolling = 'touch';
      elemento.style.overflowScrolling = 'touch';
    }
  });
}

// Função aprimorada para detectar scroll vs toque em botão
function criarBotaoAlternativaComScrollCorrigido(alt, index) {
  const botao = document.createElement('button');
  botao.textContent = alt;
  
  let touchData = {
    startTime: 0,
    startX: 0,
    startY: 0,
    moved: false,
    isScrolling: false,
    scrollStart: 0
  };
  
  // TouchStart melhorado
  botao.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchData = {
      startTime: Date.now(),
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false,
      isScrolling: false,
      scrollStart: window.pageYOffset
    };
    
    botao.classList.add('touching');
  }, { passive: true });
  
  // TouchMove com detecção melhorada de scroll
  botao.addEventListener('touchmove', (e) => {
    if (!touchData.startTime) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchData.startX);
    const deltaY = Math.abs(touch.clientY - touchData.startY);
    const scrollDelta = Math.abs(window.pageYOffset - touchData.scrollStart);
    
    // Movimento significativo detectado
    if (deltaX > 5 || deltaY > 5) {
      touchData.moved = true;
    }
    
    // Detectar scroll vertical
    if ((deltaY > deltaX && deltaY > 10) || scrollDelta > 5) {
      touchData.isScrolling = true;
      botao.classList.remove('touching');
    }
  }, { passive: true });
  
  // TouchEnd com verificações aprimoradas
  botao.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    const touchDuration = Date.now() - touchData.startTime;
    const scrollDelta = Math.abs(window.pageYOffset - touchData.scrollStart);
    
    botao.classList.remove('touching');
    
    // Condições para bloquear ação do botão
    const shouldBlock = (
      touchData.isScrolling ||           // Estava fazendo scroll
      scrollDelta > 3 ||                 // Página moveu durante o toque
      touchDuration < 50 ||              // Toque muito rápido
      (touchDuration > 1000 && touchData.moved) || // Toque muito longo com movimento
      alternativaSelecionada !== null || // Já respondeu
      aguardandoConfirmacao             // Aguardando confirmação
    );
    
    if (shouldBlock) {
      console.log('🚫 Toque bloqueado:', {
        scrolling: touchData.isScrolling,
        scrollDelta,
        duration: touchDuration,
        moved: touchData.moved
      });
      return;
    }
    
    console.log('✅ Toque válido registrado');
    
    // MOBILE: Mostrar confirmação
    if (isMobileDevice) {
      mostrarConfirmacaoMobile(index, botao);
    } else {
      // DESKTOP: Seleção direta
      selecionarAlternativa(index, botao);
    }
    
  }, { passive: false });
  
  // Click para desktop (sem mudanças)
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

// Função para aplicar estilos CSS que melhoram o scroll
function aplicarEstilosScrollMobile() {
  // Criar elemento de estilo se não existir
  let styleElement = document.getElementById('mobile-scroll-fix');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'mobile-scroll-fix';
    document.head.appendChild(styleElement);
  }
  
  // CSS para melhorar o scroll em mobile
  styleElement.textContent = `
    /* Permitir scroll suave em toda a página */
    body {
      -webkit-overflow-scrolling: touch !important;
      overflow-scrolling: touch !important;
    }
    
    /* Área da imagem - scroll livre */
    #imagem {
      touch-action: auto !important;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    
    /* Container principal - scroll livre */
    .quiz-container {
      touch-action: auto !important;
      -webkit-overflow-scrolling: touch;
    }
    
    /* Card da questão - scroll livre */
    .card {
      touch-action: auto !important;
      overflow: visible;
    }
    
    /* Área do enunciado - scroll livre */
    #enunciado {
      touch-action: auto !important;
      -webkit-overflow-scrolling: touch;
    }
    
    /* Botões de alternativas - controle específico */
    #alternativas button {
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent;
    }
    
    /* Feedback visual melhorado para toque */
    #alternativas button.touching {
      background-color: rgba(255, 255, 255, 0.1);
      transform: scale(0.98);
      transition: all 0.1s ease;
    }
    
    /* Estados de seleção temporária */
    #alternativas button.selecionada-temp {
      background-color: rgba(33, 150, 243, 0.3);
      border-color: #2196f3;
      box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
    }
    
    /* Container de scroll geral */
    .quiz-wrapper {
      -webkit-overflow-scrolling: touch;
      overflow-scrolling: touch;
      touch-action: auto;
    }
  `;
}

// Atualizar a função de inicialização para incluir as correções
function iniciarQuizComScrollCorrigido(tema) {
  console.log('🎯 Iniciando quiz com scroll corrigido...');
  
  // Detectar dispositivo mobile
  isMobileDevice = detectarMobile();
  console.log('📱 Mobile detectado:', isMobileDevice);
  
  // Aplicar correções de scroll se for mobile
  if (isMobileDevice) {
    aplicarEstilosScrollMobile();
    configurarScrollContainer();
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
  exibirPerguntaComScrollCorrigido(); // Nova função
  
  const menu = document.getElementById('menu');
  if (menu) menu.style.display = 'none';
  document.querySelector('.quiz-container').style.display = 'block';
}

// Atualizar exibição de pergunta para incluir scroll corrigido
function exibirPerguntaComScrollCorrigido() {
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
      
      // Configurar scroll da imagem após carregamento
      imagem.onload = () => {
        if (isMobileDevice) {
          configurarScrollImagem();
        }
      };
    } else {
      imagem.style.display = 'none';
    }
    
    // Limpar e recriar alternativas com scroll corrigido
    alternativasContainer.innerHTML = '';
    pergunta.alternativas.forEach((alt, index) => {
      const botao = criarBotaoAlternativaComScrollCorrigido(alt, index);
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
        
        alternativasContainer.parentNode.insertBefore(
          containerConfirmacao, 
          alternativasContainer.nextSibling
        );
      }
      
      // Configurar scroll após criar elementos
      setTimeout(() => {
        configurarScrollContainer();
        configurarScrollImagem();
      }, 100);
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

// Função de debug para scroll
window.debugScroll = () => {
  console.log('🔍 DEBUG SCROLL:');
  console.log('- É mobile:', isMobileDevice);
  
  const imagem = document.getElementById('imagem');
  if (imagem) {
    console.log('- Imagem touch-action:', getComputedStyle(imagem).touchAction);
    console.log('- Imagem visible:', imagem.style.display !== 'none');
  }
  
  const elementos = ['body', '.quiz-container', '.card', '#enunciado'];
  elementos.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      console.log(`- ${selector} touch-action:`, getComputedStyle(el).touchAction);
    }
  });
};

// INSTRUÇÕES DE USO:
// 1. Substitua iniciarQuizComConfirmacao() por iniciarQuizComScrollCorrigido()
// 2. Substitua exibirPerguntaComConfirmacao() por exibirPerguntaComScrollCorrigido()
// 3. Substitua criarBotaoAlternativaComConfirmacao() por criarBotaoAlternativaComScrollCorrigido()