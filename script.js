let tasks = [];
let currentFilter = 'all';

const taskInput = document.getElementById('taskInput');
const taskDateInput = document.getElementById('taskDate');
const taskTimeInput = document.getElementById('taskTime');
const taskReminderInput = document.getElementById('taskReminder');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        tasks = parsed.map(task => {
            return {
                id: task.id,
                text: task.text,
                completed: task.completed || false,
                dueDateTime: task.dueDateTime || null,
                reminder: task.reminder || false,
                reminded: task.reminded || false
            };
        });
    }
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function formatDateTime(dateString) {
    if (!dateString) {
        return '';
    }
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString();
    const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return datePart + ' ' + timePart;
}

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const dateValue = taskDateInput.value;
    const timeValue = taskTimeInput.value;
    let dueDateTime = null;

    if (dateValue) {
        if (timeValue) {
            dueDateTime = new Date(dateValue + 'T' + timeValue);
        } else {
            dueDateTime = new Date(dateValue + 'T00:00');
        }
    }

    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        dueDateTime: dueDateTime ? dueDateTime.toISOString() : null,
        reminder: taskReminderInput.checked,
        reminded: false
    };

    tasks.push(newTask);
    taskInput.value = '';
    taskDateInput.value = '';
    taskTimeInput.value = '';
    taskReminderInput.checked = false;

    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function toggleComplete(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        const newText = prompt('Edit task:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            saveTasks();
            renderTasks();
        }
    }
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

function filterTasks(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    renderTasks();
}

function renderTasks() {
    taskList.innerHTML = '';

    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }

    const now = new Date();

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        if (task.completed) {
            li.classList.add('completed');
        }

        let dueText = '';
        let dueClass = '';
        if (task.dueDateTime) {
            const dueDate = new Date(task.dueDateTime);
            const formatted = formatDateTime(task.dueDateTime);
            if (dueDate < now && !task.completed) {
                dueText = 'Overdue • ' + formatted;
                dueClass = 'overdue';
            } else {
                dueText = 'Due • ' + formatted;
                dueClass = 'upcoming';
            }
        }

        let reminderText = '';
        if (task.reminder && task.dueDateTime) {
            reminderText = 'Reminder on';
        }

        let metaHTML = '';
        if (dueText || reminderText) {
            metaHTML = `
                <div class="task-meta">
                    ${dueText ? `<span class="task-due ${dueClass}">${dueText}</span>` : ''}
                    ${reminderText ? `<span class="task-reminder-label">${reminderText}</span>` : ''}
                </div>
            `;
        }

        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                ${metaHTML}
            </div>
            <div class="task-actions">
                <button class="btn-edit">Edit</button>
                <button class="btn-delete">Delete</button>
            </div>
        `;

        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleComplete(task.id));

        const editBtn = li.querySelector('.btn-edit');
        editBtn.addEventListener('click', () => editTask(task.id));

        const deleteBtn = li.querySelector('.btn-delete');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        taskList.appendChild(li);
    });

    updateTaskCount();
}

function updateTaskCount() {
    const activeTasks = tasks.filter(task => !task.completed).length;
    taskCount.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} remaining`;
}

function checkReminders() {
    const now = new Date();
    let updated = false;

    tasks.forEach(task => {
        if (task.reminder && task.dueDateTime && !task.reminded && !task.completed) {
            const dueDate = new Date(task.dueDateTime);
            if (dueDate <= now) {
                alert('Reminder: ' + task.text);
                task.reminded = true;
                updated = true;
            }
        }
    });

    if (updated) {
        saveTasks();
        renderTasks();
    }
}

addTaskBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterTasks(btn.dataset.filter);
    });
});

loadTasks();
setInterval(checkReminders, 30000);