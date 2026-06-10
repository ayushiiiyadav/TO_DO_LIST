let tasks   = JSON.parse(localStorage.getItem('kawaii-tasks') || '[]');
let filter  = 'all';

const mascotMessages = {
    idle:     ['Let\'s get things done!', 'You\'ve got this! 🌸', 'Stay cute & focused ✨', 'One task at a time~ 🍓'],
    add:      ['Nice one! 🎉', 'Added! Let\'s gooo 🚀', 'Ooh a new task! 🍓', 'On the list! ✨'],
    complete: ['Yay! 🎊', 'You\'re crushing it! 💪', 'One down! 🌟', 'Amazing work! 🎀'],
    delete:   ['Poof! Gone~ 💨', 'Bye bye task! 👋', 'All cleared! ✨'],
    allDone:  ['ALL DONE!! 🎉🎉', 'You\'re a superstar!! ⭐', 'Task master!! 🏆'],
    empty:    ['Add a task first! 😊', 'Write something! ✏️', 'Don\'t be shy~ 🍓'],
};

function setMascot(category) {
    const msgs = mascotMessages[category];
    const msg  = msgs[Math.floor(Math.random() * msgs.length)];
    const el   = document.getElementById('mascot-bubble');
    if (!el) return;
    el.classList.remove('pop');
    void el.offsetWidth; // reflow
    el.textContent = msg;
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 400);
}

(function initSparkles() {
    const container = document.getElementById('sparkles-container');
    if (!container) return;
    for (let i = 0; i < 18; i++) {
        const s = document.createElement('div');
        s.className = 'sparkle';
        s.style.cssText = `
            left: ${Math.random() * 100}%;
            top:  ${Math.random() * 100}%;
            width:  ${4 + Math.random() * 6}px;
            height: ${4 + Math.random() * 6}px;
            animation-delay:    ${Math.random() * 4}s;
            animation-duration: ${2 + Math.random() * 2}s;
        `;
        container.appendChild(s);
    }
})();

const inputEl     = document.getElementById('input-box');
const charCountEl = document.getElementById('char-count');

inputEl.addEventListener('input', () => {
    const len = inputEl.value.length;
    charCountEl.textContent = `${len}/80`;
    charCountEl.classList.toggle('near-limit', len > 60);
});

inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
});

function saveTasks() {
    localStorage.setItem('kawaii-tasks', JSON.stringify(tasks));
}

function render() {
    const list     = document.getElementById('list-container');
    const emptyEl  = document.getElementById('empty-state');
    const bottomEl = document.getElementById('bottom-bar');

    const filtered = tasks.filter(t => {
        if (filter === 'active')    return !t.done;
        if (filter === 'completed') return  t.done;
        return true;
    });

    list.innerHTML = '';

    if (filtered.length === 0) {
        emptyEl.style.display = 'block';
    } else {
        emptyEl.style.display = 'none';
        filtered.forEach(task => {
            const li = buildTaskEl(task);
            list.appendChild(li);
        });
    }

    const hasAny       = tasks.length > 0;
    const hasCompleted = tasks.some(t => t.done);
    bottomEl.style.display = hasAny ? 'flex' : 'none';

    updateStats();
    updateProgress();
}

function buildTaskEl(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.done ? 'done' : ''}`;
    li.dataset.id = task.id;

    const checkbox = document.createElement('div');
    checkbox.className = 'task-checkbox';
    checkbox.title = task.done ? 'Mark undone' : 'Mark done';
    checkbox.addEventListener('click', () => toggleTask(task.id));

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const badge = document.createElement('span');
    badge.className = `priority-badge priority-${task.priority}`;
    badge.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.title     = 'Delete task';
    del.innerHTML = '✕';
    del.addEventListener('click', () => deleteTask(task.id, li));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(badge);
    li.appendChild(del);

    return li;
}

function updateStats() {
    const total  = tasks.length;
    const done   = tasks.filter(t => t.done).length;
    const active = total - done;

    animateNumber('total-count',  total);
    animateNumber('active-count', active);
    animateNumber('done-count',   done);
}

function animateNumber(id, newVal) {
    const el = document.getElementById(id);
    if (!el) return;
    const old = parseInt(el.textContent) || 0;
    if (old === newVal) return;
    el.textContent = newVal;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 400);
}

function updateProgress() {
    const total = tasks.length;
    const done  = tasks.filter(t => t.done).length;
    const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

    let wrap = document.querySelector('.progress-wrap');
    if (total === 0) {
        if (wrap) wrap.remove();
        return;
    }
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'progress-wrap';
        wrap.innerHTML = `
            <div class="progress-label">
                <span id="prog-label">Progress</span>
                <span id="prog-pct">0%</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" id="progress-fill"></div>
            </div>`;
        const filterTabs = document.querySelector('.filter-tabs');
        filterTabs.after(wrap);
    }
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('prog-pct').textContent = pct + '%';
}

function addTask() {
    const text = inputEl.value.trim();

    if (!text) {
        inputEl.classList.remove('shake');
        void inputEl.offsetWidth;
        inputEl.classList.add('shake');
        inputEl.focus();
        setMascot('empty');
        return;
    }

    const task = {
        id:       Date.now(),
        text,
        done:     false,
        priority: 'medium',
        created:  new Date().toISOString(),
    };

    tasks.unshift(task);
    saveTasks();
    render();
    setMascot('add');
    spawnAddParticles();

    inputEl.value           = '';
    charCountEl.textContent = '0/80';
    charCountEl.classList.remove('near-limit');
    inputEl.focus();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.done = !task.done;
    saveTasks();
    render();

    if (task.done) {
        setMascot('complete');
        spawnCheckConfetti();
        if (tasks.length > 0 && tasks.every(t => t.done)) {
            setTimeout(showCelebration, 300);
        }
    } else {
        setMascot('idle');
    }
}

function deleteTask(id, el) {
    el.classList.add('removing');
    el.addEventListener('animationend', () => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        render();
        setMascot('delete');
    }, { once: true });
}

function filterTasks(f) {
    filter = f;
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === f);
    });
    render();
}

function clearCompleted() {
    tasks = tasks.filter(t => !t.done);
    saveTasks();
    render();
    setMascot('idle');
}

function clearAll() {
    if (tasks.length === 0) return;
    document.querySelectorAll('.task-item').forEach((el, i) => {
        el.style.transitionDelay = (i * 0.04) + 's';
        el.classList.add('removing');
    });
    setTimeout(() => {
        tasks = [];
        saveTasks();
        render();
        setMascot('idle');
    }, 500);
}

function showCelebration() {
    setMascot('allDone');
    const el = document.getElementById('celebration');
    el.classList.add('show');
    spawnConfetti();
    setTimeout(() => el.classList.remove('show'), 3200);
}

function spawnConfetti() {
    const colors = ['#f48cb6','#e85d8a','#ce93d8','#80cbc4','#fff176','#ffb74d'];
    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        const color = colors[Math.floor(Math.random() * colors.length)];
        piece.style.cssText = `
            left:             ${Math.random() * 100}vw;
            background:       ${color};
            width:            ${6 + Math.random() * 10}px;
            height:           ${6 + Math.random() * 10}px;
            border-radius:    ${Math.random() > 0.5 ? '50%' : '2px'};
            animation-duration: ${1.5 + Math.random() * 2}s;
            animation-delay:    ${Math.random() * 0.8}s;
        `;
        document.body.appendChild(piece);
        piece.addEventListener('animationend', () => piece.remove(), { once: true });
    }
}

function spawnCheckConfetti() {
    const colors = ['#f48cb6','#e85d8a','#ce93d8'];
    for (let i = 0; i < 12; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        const color = colors[i % colors.length];
        piece.style.cssText = `
            left:             ${30 + Math.random() * 40}vw;
            background:       ${color};
            width:            5px; height: 5px;
            border-radius:    50%;
            animation-duration: ${0.8 + Math.random() * 0.6}s;
            animation-delay:    ${Math.random() * 0.2}s;
        `;
        document.body.appendChild(piece);
        piece.addEventListener('animationend', () => piece.remove(), { once: true });
    }
}

function spawnAddParticles() {
    const btn = document.getElementById('add-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
        const dot = document.createElement('div');
        dot.className = 'confetti-piece';
        dot.style.cssText = `
            left:             ${rect.left + rect.width / 2}px;
            top:              ${rect.top}px;
            background:       #f48cb6;
            width: 6px; height: 6px;
            border-radius: 50%;
            animation-duration: ${0.5 + Math.random() * 0.4}s;
            animation-delay: ${i * 0.03}s;
        `;
        document.body.appendChild(dot);
        dot.addEventListener('animationend', () => dot.remove(), { once: true });
    }
}

document.getElementById('celebration').addEventListener('click', function () {
    this.classList.remove('show');
});

setInterval(() => {
    if (Math.random() < 0.3) setMascot('idle');
}, 8000);

render();