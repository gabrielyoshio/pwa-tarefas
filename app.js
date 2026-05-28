// ============================================================
// REGISTRO DO SERVICE WORKER
// Essa é a parte que transforma o site numa PWA.
// O SW é um arquivo separado (sw.js) que roda em segundo plano.
// ============================================================
if ('serviceWorker' in navigator) {
  // Só registra depois que a página terminou de carregar
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        console.log('[App] Service Worker registrado!');
        console.log('[App] Escopo:', registration.scope);
      })
      .catch((err) => {
        console.error('[App] Erro ao registrar SW:', err);
      });
  });
}

// ============================================================
// DADOS — carrega tarefas salvas ou começa com array vazio
// localStorage guarda os dados no navegador, sem banco de dados
// ============================================================
let tasks = JSON.parse(localStorage.getItem('taskflow-tasks')) || [];

// Sempre que as tarefas mudarem, chamamos essa função pra salvar
function saveTasks() {
  localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
}

// ============================================================
// ADICIONAR TAREFA
// ============================================================
function addTask(text) {
  // Não faz nada se o campo estiver vazio
  if (!text || text.trim() === '') return;

  // Cria o objeto da tarefa
  const task = {
    id: Date.now(),       // ID único baseado no horário atual
    text: text.trim(),    // texto sem espaços nas pontas
    done: false           // começa como não concluída
  };

  tasks.unshift(task);   // adiciona no início da lista
  saveTasks();
  renderTasks();
}

// ============================================================
// MARCAR COMO CONCLUÍDA / DESMARCAR
// ============================================================
function toggleTask(id) {
  // Percorre todas as tarefas e inverte o "done" da que tem esse id
  tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTasks();
  renderTasks();
}

// ============================================================
// DELETAR TAREFA
// ============================================================
function deleteTask(id) {
  // Busca o elemento na tela e adiciona a classe de animação
  const item = document.querySelector(`[data-id="${id}"]`);
  if (item) {
    item.classList.add('removing');
    // Espera a animação terminar (300ms) antes de remover do array
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();
    }, 300);
  }
}

// ============================================================
// RENDERIZAR — desenha a lista na tela
// É chamada sempre que algo muda
// ============================================================
function renderTasks() {
  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');

  // Limpa a lista atual antes de redesenhar
  list.innerHTML = '';

  if (tasks.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  // Para cada tarefa, cria um <li> e adiciona na lista
  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = `task-item ${task.done ? 'done' : ''}`;
    li.dataset.id = task.id;

    // innerHTML monta o HTML de cada item da lista
    li.innerHTML = `
      <button class="check-btn ${task.done ? 'checked' : ''}"
              onclick="toggleTask(${task.id})">
      </button>
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="delete-btn" onclick="deleteTask(${task.id})">✕</button>
    `;

    list.appendChild(li);
  });
}

// ============================================================
// SEGURANÇA — evita que texto do usuário vire código HTML
// Isso se chama prevenção de XSS (Cross-Site Scripting)
// ============================================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// STATUS ONLINE / OFFLINE
// O navegador dispara esses eventos automaticamente
// ============================================================
function updateOnlineStatus() {
  const badge = document.getElementById('online-badge');
  if (navigator.onLine) {
    badge.textContent = '🟢 Online';
    badge.className = 'status-badge online';
  } else {
    badge.textContent = '🔴 Offline';
    badge.className = 'status-badge offline';
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ============================================================
// INICIALIZAÇÃO — roda quando a página termina de carregar
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Desenha as tarefas salvas
  renderTasks();
  updateOnlineStatus();

  const input = document.getElementById('task-input');
  const addBtn = document.getElementById('add-btn');

  // Adiciona tarefa ao clicar no botão
  addBtn.addEventListener('click', () => {
    addTask(input.value);
    input.value = '';
    input.focus();
  });

  // Adiciona tarefa ao pressionar Enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addTask(input.value);
      input.value = '';
    }
  });

  // Foca no input automaticamente ao abrir
  input.focus();
});