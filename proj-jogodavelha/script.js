const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontais
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // verticais
  [0, 4, 8], [2, 4, 6]              // diagonais
];

let board, current, over, mode, scores, botThinking;

const cells = document.querySelectorAll('.cell');
const statusEl = document.getElementById('status');
const scoreEl = document.getElementById('score');
const gameEl = document.getElementById('game');
const menuEl = document.getElementById('menu');

// Verifica se há vencedor ou empate
function checkWinner(b) {
  for (const [a, c, d] of WINS) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) {
      return { winner: b[a], line: [a, c, d] };
    }
  }
  if (b.every(Boolean)) return { winner: 'draw' };
  return null;
}

// Algoritmo minimax — retorna a pontuação de cada jogada
function minimax(b, isMax) {
  const result = checkWinner(b);
  if (result) {
    if (result.winner === 'O') return 10;
    if (result.winner === 'X') return -10;
    return 0;
  }

  const scores = [];
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = isMax ? 'O' : 'X';
      scores.push(minimax(b, !isMax));
      b[i] = '';
    }
  }
  return isMax ? Math.max(...scores) : Math.min(...scores);
}

// Encontra a melhor jogada para o bot
function bestMove(b) {
  let best = -Infinity, move = -1;
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = 'O';
      const s = minimax(b, false);
      b[i] = '';
      if (s > best) { best = s; move = i; }
    }
  }
  return move;
}

// Atualiza o placar na tela
function renderScore() {
  if (mode === 'friend') {
    scoreEl.textContent = `X: ${scores.X}  |  Empates: ${scores.D}  |  O: ${scores.O}`;
  } else {
    scoreEl.textContent = `Você (X): ${scores.X}  |  Empates: ${scores.D}  |  Bot (O): ${scores.O}`;
  }
}

// Inicializa (ou reinicia) uma partida
function init() {
  board = Array(9).fill('');
  current = 'X';
  over = false;
  botThinking = false;
  cells.forEach(c => { c.textContent = ''; c.className = 'cell'; });
  statusEl.textContent = mode === 'friend' ? 'Vez do jogador X' : 'Sua vez (X)';
  renderScore();
}

// Define o modo e exibe o tabuleiro
function startMode(m) {
  mode = m;
  scores = { X: 0, O: 0, D: 0 };
  menuEl.style.display = 'none';
  document.querySelector('.sub').style.display = 'none';
  gameEl.style.display = 'block';
  document.getElementById('btn-friend').classList.toggle('active', m === 'friend');
  document.getElementById('btn-bot').classList.toggle('active', m === 'bot');
  init();
}

// Processa uma jogada no índice idx
function applyMove(idx) {
  if (over || board[idx] || botThinking) return;

  board[idx] = current;
  const cell = cells[idx];
  cell.textContent = current;
  cell.classList.add('taken', current === 'X' ? 'x-mark' : 'o-mark');

  const result = checkWinner(board);
  if (result) {
    over = true;
    if (result.winner === 'draw') {
      statusEl.textContent = 'Empate!';
      scores.D++;
    } else {
      result.line.forEach(i => cells[i].classList.add('winner'));
      statusEl.textContent = mode === 'friend'
        ? `Jogador ${result.winner} venceu!`
        : result.winner === 'X' ? 'Você venceu!' : 'O bot venceu!';
      scores[result.winner]++;
    }
    renderScore();
    return;
  }

  current = current === 'X' ? 'O' : 'X';

  if (mode === 'friend') {
    statusEl.textContent = `Vez do jogador ${current}`;
  } else if (current === 'O') {
    statusEl.textContent = 'Bot pensando...';
    botThinking = true;
    setTimeout(() => {
      botThinking = false;
      applyMove(bestMove(board));
    }, 350);
  } else {
    statusEl.textContent = 'Sua vez (X)';
  }
}

// Eventos
cells.forEach(cell => {
  cell.addEventListener('click', () => applyMove(+cell.dataset.i));
});

document.getElementById('restart-btn').addEventListener('click', init);

document.getElementById('back-btn').addEventListener('click', () => {
  gameEl.style.display = 'none';
  menuEl.style.display = 'flex';
  document.querySelector('.sub').style.display = 'block';
  document.getElementById('btn-friend').classList.remove('active');
  document.getElementById('btn-bot').classList.remove('active');
});

document.getElementById('btn-friend').addEventListener('click', () => startMode('friend'));
document.getElementById('btn-bot').addEventListener('click', () => startMode('bot'));