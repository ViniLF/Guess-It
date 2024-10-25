import { testDictionary, realDictionary } from './dictionary.js';

// Para fins de teste, certifique-se de usar o dicionário de teste
console.log('test dictionary:', testDictionary);

const dictionary = realDictionary;
const NUM_ROWS = 6; // Número de tentativas
const NUM_COLS = 5; // Comprimento da palavra

const state = {
  secret: dictionary[Math.floor(Math.random() * dictionary.length)], // Palavra secreta aleatória
  grid: Array(NUM_ROWS).fill().map(() => Array(NUM_COLS).fill('')), // Grade inicial
  currentRow: 0, // Linha atual
  currentCol: 0, // Coluna atual
  isAnimating: false, // Verifica se está animando
};

function showNotification(message) {
  const notifyElement = document.getElementById('notify');
  
  if (!notifyElement) {
    console.error("Elemento de notificação não encontrado.");
    return; // Saia da função se o elemento não existir
  }

  notifyElement.textContent = message; // Define a mensagem a ser exibida
  notifyElement.classList.add('show'); // Adiciona a classe que mostra a notificação

  // Remove a notificação após 5 segundos
  setTimeout(() => {
    notifyElement.classList.remove('show'); // Remove a classe que oculta a notificação
  }, 5000);
}

// Função para remover acentos
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function createBox(row, col) {
  const box = document.createElement('div');
  box.className = 'box';
  box.id = `box${row}${col}`;
  return box;
}

function drawGrid(container) {
  const grid = document.createElement('div');
  grid.className = 'grid';

  for (let i = 0; i < NUM_ROWS; i++) {
    for (let j = 0; j < NUM_COLS; j++) {
      const box = createBox(i, j);
      grid.appendChild(box);
    }
  }

  container.appendChild(grid);
}

function registerKeyboardEvents() {
  document.body.onkeydown = (e) => {
      const key = e.key;

      // Permite letras com acento e caracteres especiais
      const isValidCharacter = (char) => /^[a-zA-Zãáàâäêéèëîíìïôóòõöúúùûüç]$/.test(char);

      if (key === 'Enter') {
          handleEnter(); // Chama a função para lidar com a tecla Enter
      }

      if (key === 'Backspace') {
          removeLetter(); // Chama a função para lidar com a tecla Backspace
      }

      // Adiciona letra se for um caractere válido e não estiver animando
      if (isValidCharacter(key) && !state.isAnimating) {
          addLetter(key);
      }

      updateGrid(); // Atualiza a grade de visualização
  };
}

function updateGrid() {
  for (let i = 0; i < state.grid.length; i++) {
    for (let j = 0; j < state.grid[i].length; j++) {
      const box = document.getElementById(`box${i}${j}`);
      box.textContent = state.grid[i][j];
    }
  }
}

function isWordValid(word) {
  if (!dictionary || dictionary.length === 0) {
    console.error("Dicionário não definido ou vazio.");
    return false; // Retorna falso se o dicionário não estiver definido
  }

  const normalizedWord = removeAccents(word);
  const normalizedDictionary = new Set(dictionary.map(removeAccents));
  return normalizedDictionary.has(normalizedWord);
}

function getNumOfOccurrencesInWord(word, letter) {
  return Array.from(word).filter(l => l === letter).length;
}

function getPositionOfOccurrence(word, letter, position) {
  let result = 0;
  for (let i = 0; i <= position; i++) {
    if (word[i] === letter) {
      result++;
    }
  }
  return result;
}

function updateVirtualKeyboard(letter, status) {
  const keyElement = document.querySelector(`.key[data-key="${letter.toLowerCase()}"]`);

  if (keyElement) {
    // Verifica a cor atual da tecla
    const currentColor = keyElement.style.background;

    // Se a letra está correta, sobrescreve qualquer status anterior
    if (status === 'right') {
      keyElement.style.background = 'var(--right)';  // Cor correta (verde)
    } 
    // Se a letra está na posição errada e ainda não foi marcada como correta
    else if (status === 'wrong' && currentColor !== 'var(--right)') {
      keyElement.style.background = 'var(--wrong)';  // Cor na posição errada (amarela)
    } 
    // Caso a letra esteja incorreta e ainda não tenha sido marcada como correta ou errada
    else if (status === 'empty' && currentColor !== 'var(--right)' && currentColor !== 'var(--wrong)') {
      keyElement.style.background = 'var(--empty)';  // Cor incorreta (cinza)
    }
  }
}

function handleLetterReveal(letter, index, guess, row) {
  const box = document.getElementById(`box${row}${index}`);
  box.classList.add('rotate'); // Adiciona a classe de rotação

  const numOfOccurrencesSecret = getNumOfOccurrencesInWord(state.secret, letter);
  const numOfOccurrencesGuess = getNumOfOccurrencesInWord(guess, letter);
  const letterPosition = getPositionOfOccurrence(guess, letter, index);

  if (letter === state.secret[index]) {
    box.classList.add('right');
    updateVirtualKeyboard(letter, 'right'); // Atualiza o teclado virtual
  } else if (state.secret.includes(letter)) {
    if (numOfOccurrencesGuess <= numOfOccurrencesSecret) {
      box.classList.add('wrong');
      updateVirtualKeyboard(letter, 'wrong'); // Atualiza o teclado virtual
    } else {
      box.classList.add('empty');
      updateVirtualKeyboard(letter, 'empty'); // Atualiza o teclado virtual
    }
  } else {
    box.classList.add('empty');
    updateVirtualKeyboard(letter, 'empty'); // Atualiza o teclado virtual
  }
}

function revealWord(guess) {
  const row = state.currentRow;
  const animation_duration = 200; // ms
  state.isAnimating = true; // Inicia a animação

  // Revela a palavra letra por letra com atraso
  guess.split('').forEach((letter, index) => {
    setTimeout(() => {
      handleLetterReveal(letter, index, guess, row);
      
      // Finaliza a animação e verifica se a palavra foi adivinhada
      if (index === guess.length - 1) {
        state.isAnimating = false; // Permite novas tentativas
      }
    }, index * animation_duration);
  });
}

function handleEnter() {
  const guess = state.grid[state.currentRow].join('');

  if (isWordValid(guess)) {
    revealWord(guess); // Revela a palavra

    // Verifica se a palavra adivinhada é a correta
    if (guess === state.secret) {
      showNotification(`Parabéns! Você adivinhou a palavra: ${state.secret}`);
      return; // Para sair da função se a palavra foi adivinhada
    }

    // Verifica se está na última linha
    if (state.currentRow === NUM_ROWS - 1) {  
      showNotification(`Fim do jogo! A palavra era: ${state.secret}`);
      state.currentRow++; // Aqui incrementamos para evitar mais entradas
    } else {
      state.currentRow++;  // Incrementa a linha apenas após revelar a palavra
      state.currentCol = 0; // Reseta a coluna para a próxima linha
    }
  } else {
    showNotification(`A palavra "${guess}" não é válida.`);
  }
}

function addLetter(letter) {
  // Só permite adicionar letra na linha atual
  if (state.currentCol < NUM_COLS && state.currentRow < NUM_ROWS && !state.isAnimating) {
    state.grid[state.currentRow][state.currentCol] = letter.toLowerCase();
    state.currentCol++;
    updateGrid(); // Atualiza a grade visual
  }
}

function removeLetter() {
  // Só permite remover letras na linha atual, antes de confirmar com "Enter"
  if (state.currentCol > 0 && state.currentRow < NUM_ROWS && !state.isAnimating) {
    state.currentCol--;
    state.grid[state.currentRow][state.currentCol] = '';
    updateGrid(); // Atualiza a grade visual
  }
}

function resetGame() {
  state.grid = Array(NUM_ROWS).fill().map(() => Array(NUM_COLS).fill(''));
  state.currentRow = 0;
  state.currentCol = 0;
  state.secret = dictionary[Math.floor(Math.random() * dictionary.length)]; // Gera uma nova palavra
  state.isAnimating = false;
  updateGrid(); // Atualiza a grade visual
}

document.querySelectorAll('.key').forEach(key => {
  key.onclick = () => {
    const letter = key.getAttribute('data-key');
    addLetter(letter); // Chama a função para adicionar a letra
    updateGrid(); // Atualiza a grade visual
  };
});


function startup() {
  const container = document.getElementById('game'); // Obtém o contêiner do jogo
  drawGrid(container); // Desenha a grade
  registerKeyboardEvents(); // Registra eventos do teclado
}

// Inicializa o jogo
startup();
