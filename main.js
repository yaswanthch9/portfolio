// =====================
// STATE
// =====================
let tasks = JSON.parse(localStorage.getItem('taskflow-tasks')) || [
  { id: 1, title: 'Design homepage wireframe', desc: 'Create low-fi wireframe for the new landing page', priority: 'high', status: 'todo', due: '2026-04-10' },
  { id: 2, title: 'Set up project repo', desc: 'Initialize GitHub repo and add README', priority: 'medium', status: 'done', due: '2026-04-05' },
  { id: 3, title: 'Build nav component', desc: 'Responsive navbar with hamburger menu', priority: 'high', status: 'inprogress', due: '2026-04-08' },
  { id: 4, title: 'Write unit tests', desc: '', priority: 'low', status: 'todo', due: '' },
];
let nextId = Math.max(...tasks.map(t => t.id), 0) + 1;
let activeFilter = 'all';
let activePriority = 'all';
let searchQuery = '';
let draggedId = null;

// =====================
// SAVE & RENDER
// =====================
function save() { localStorage.setItem('taskflow-tasks', JSON.stringify(tasks)); }

function getFiltered() {
  return tasks.filter(t => {
    const matchFilter = activeFilter === 'all' || t.status === activeFilter;
    const matchPriority = activePriority === 'all' || t.priority === activePriority;
    const matchSearch = t.title.toLowerCase().includes(searchQuery) || t.desc.toLowerCase().includes(searchQuery);
    return matchFilter && matchPriority && matchSearch;
  });
}

function render() {
  const filtered = getFiltered();
  const statuses = ['todo', 'inprogress', 'done'];

  statuses.forEach(status => {
    const col = document.querySelector(`.droppable[data-status="${status}"]`);
    const cards = filtered.filter(t => t.status === status);
    col.innerHTML = '';

    if (cards.length === 0) {
      col.innerHTML = '<div class="empty-state">Drop tasks here</div>';
    } else {
      cards.forEach(task => {
        col.appendChild(createCard(task));
      });
    }
    document.getElementById(`count-${status}`).textContent = tasks.filter(t => t.status === status).length;
  });

  updateStats();
}

function createCard(task) {
  const card = document.createElement('div');
  card.className = `task-card ${task.priority}`;
  card.draggable = true;
  card.dataset.id = task.id;

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due && task.due < today && task.status !== 'done';

  card.innerHTML = `
    <div class="task-top">
      <div class="task-title">${task.title}</div>
      <button class="task-delete" data-id="${task.id}">✕</button>
    </div>
    ${task.desc ? `<div class="task-desc">${task.desc}</div>` : ''}
    <div class="task-footer">
      <span class="task-priority ${task.priority}">${task.priority}</span>
      ${task.due ? `<span class="task-due ${isOverdue ? 'overdue' : ''}">📅 ${task.due}</span>` : ''}
    </div>
  `;

  // Drag events
  card.addEventListener('dragstart', () => { draggedId = task.id; card.classList.add('dragging'); });
  card.addEventListener('dragend', () => { card.classList.remove('dragging'); draggedId = null; });

  // Delete
  card.querySelector('.task-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    tasks = tasks.filter(t => t.id !== task.id);
    save(); render();
  });

  return card;
}

function updateStats() {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const pending = total - done;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = pct + '%';
}

// =====================
// DRAG & DROP
// =====================
document.querySelectorAll('.droppable').forEach(zone => {
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', () => {
    zone.classList.remove('drag-over');
    if (draggedId) {
      const task = tasks.find(t => t.id === draggedId);
      if (task) { task.status = zone.dataset.status; save(); render(); }
    }
  });
});

// =====================
// MODAL
// =====================
document.getElementById('open-modal').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.add('open');
});
document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.remove('open');
});
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay'))
    document.getElementById('modal-overlay').classList.remove('open');
});

document.getElementById('submit-task').addEventListener('click', () => {
  const title = document.getElementById('task-title').value.trim();
  if (!title) { alert('Please enter a task title!'); return; }
  tasks.push({
    id: nextId++,
    title,
    desc: document.getElementById('task-desc').value.trim(),
    priority: document.getElementById('task-priority').value,
    status: document.getElementById('task-status').value,
    due: document.getElementById('task-due').value,
  });
  save(); render();
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('task-title').value = '';
  document.getElementById('task-desc').value = '';
  document.getElementById('task-due').value = '';
});

// =====================
// FILTERS
// =====================
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    document.getElementById('view-title').textContent = btn.textContent.replace(/[📋⭕🔄✅]/g, '').trim();
    render();
  });
});

document.querySelectorAll('.pf-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activePriority = btn.dataset.priority;
    render();
  });
});

document.getElementById('search').addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase();
  render();
});

// =====================
// DATE
// =====================
document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// =====================
// INIT
// =====================
render();
