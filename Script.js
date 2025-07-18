// Firebase Configuration and Initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTrYbSFy_A86Xh4xQaGMHyV4YlEZzTDag",
  authDomain: "todolist87-7e181.firebaseapp.com",
  projectId: "todolist87-7e181",
  storageBucket: "todolist87-7e181.firebasestorage.app",
  messagingSenderId: "99791674796",
  appId: "1:99791674796:web:e083f0094ff672f915ae09",
  measurementId: "G-EY28JXRBHT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global variables
let currentUser = null;
let tasks = [];
let habits = [];

// Authentication handler
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("User authenticated:", user.uid);
    initializeApp();
  } else {
    // Sign in anonymously if not authenticated
    signInAnonymously(auth)
      .then((result) => {
        currentUser = result.user;
        console.log("Anonymous user signed in:", result.user.uid);
        initializeApp();
      })
      .catch((error) => {
        console.error("Error signing in anonymously:", error);
      });
  }
});

// Initialize app after authentication
function initializeApp() {
  loadTasks();
  loadHabits();
  setupEventListeners();
  updateWeekDisplay();
}

// Setup event listeners
function setupEventListeners() {
  // Task form submission
  const taskForm = document.getElementById('taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', handleTaskSubmit);
  }

  // Habit form submission
  const habitForm = document.getElementById('habitForm');
  if (habitForm) {
    habitForm.addEventListener('submit', handleHabitSubmit);
  }

  // Week navigation
  const prevWeekBtn = document.getElementById('prevWeek');
  const nextWeekBtn = document.getElementById('nextWeek');
  
  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
      changeWeek(-1);
    });
  }
  
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
      changeWeek(1);
    });
  }
}

// Task Management
async function handleTaskSubmit(e) {
  e.preventDefault();
  
  const taskInput = document.getElementById('taskInput');
  const taskPriority = document.getElementById('taskPriority');
  const taskCategory = document.getElementById('taskCategory');
  
  if (!taskInput.value.trim()) return;
  
  const taskData = {
    title: taskInput.value.trim(),
    priority: taskPriority ? taskPriority.value : 'medium',
    category: taskCategory ? taskCategory.value : 'personal',
    completed: false,
    createdAt: new Date(),
    userId: currentUser.uid
  };
  
  try {
    await addDoc(collection(db, 'tasks'), taskData);
    taskInput.value = '';
    console.log("Task added successfully");
  } catch (error) {
    console.error("Error adding task:", error);
  }
}

async function loadTasks() {
  if (!currentUser) return;
  
  try {
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    onSnapshot(q, (snapshot) => {
      tasks = [];
      snapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      renderTasks();
    });
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}

function renderTasks() {
  const taskList = document.getElementById('taskList');
  if (!taskList) return;
  
  taskList.innerHTML = '';
  
  tasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`;
    taskElement.innerHTML = `
      <div class="task-content">
        <input type="checkbox" ${task.completed ? 'checked' : ''} 
               onchange="toggleTask('${task.id}', this.checked)">
        <span class="task-title">${task.title}</span>
        <span class="task-category">${task.category}</span>
        <span class="task-priority priority-${task.priority}">${task.priority}</span>
      </div>
      <div class="task-actions">
        <button onclick="editTask('${task.id}')" class="btn-edit">Edit</button>
        <button onclick="deleteTask('${task.id}')" class="btn-delete">Delete</button>
      </div>
    `;
    taskList.appendChild(taskElement);
  });
}

async function toggleTask(taskId, completed) {
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      completed: completed
    });
    console.log("Task updated successfully");
  } catch (error) {
    console.error("Error updating task:", error);
  }
}

async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
    console.log("Task deleted successfully");
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}

// Habit Management
async function handleHabitSubmit(e) {
  e.preventDefault();
  
  const habitInput = document.getElementById('habitInput');
  const habitFrequency = document.getElementById('habitFrequency');
  
  if (!habitInput.value.trim()) return;
  
  const habitData = {
    title: habitInput.value.trim(),
    frequency: habitFrequency ? habitFrequency.value : 'daily',
    completedDays: {},
    createdAt: new Date(),
    userId: currentUser.uid
  };
  
  try {
    await addDoc(collection(db, 'habits'), habitData);
    habitInput.value = '';
    console.log("Habit added successfully");
  } catch (error) {
    console.error("Error adding habit:", error);
  }
}

async function loadHabits() {
  if (!currentUser) return;
  
  try {
    const q = query(
      collection(db, 'habits'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    onSnapshot(q, (snapshot) => {
      habits = [];
      snapshot.forEach((doc) => {
        habits.push({
          id: doc.id,
          ...doc.data()
        });
      });
      renderHabits();
    });
  } catch (error) {
    console.error("Error loading habits:", error);
  }
}

function renderHabits() {
  const habitList = document.getElementById('habitList');
  if (!habitList) return;
  
  habitList.innerHTML = '';
  
  habits.forEach(habit => {
    const habitElement = document.createElement('div');
    habitElement.className = 'habit-item';
    
    const today = new Date().toISOString().split('T')[0];
    const isCompletedToday = habit.completedDays && habit.completedDays[today];
    
    habitElement.innerHTML = `
      <div class="habit-content">
        <span class="habit-title">${habit.title}</span>
        <span class="habit-frequency">${habit.frequency}</span>
      </div>
      <div class="habit-actions">
        <button onclick="toggleHabit('${habit.id}', '${today}')" 
                class="btn-habit ${isCompletedToday ? 'completed' : ''}">
          ${isCompletedToday ? 'Completed' : 'Mark Done'}
        </button>
        <button onclick="deleteHabit('${habit.id}')" class="btn-delete">Delete</button>
      </div>
    `;
    habitList.appendChild(habitElement);
  });
}

async function toggleHabit(habitId, date) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;
  
  const completedDays = habit.completedDays || {};
  const isCompleted = completedDays[date];
  
  if (isCompleted) {
    delete completedDays[date];
  } else {
    completedDays[date] = true;
  }
  
  try {
    await updateDoc(doc(db, 'habits', habitId), {
      completedDays: completedDays
    });
    console.log("Habit updated successfully");
  } catch (error) {
    console.error("Error updating habit:", error);
  }
}

async function deleteHabit(habitId) {
  if (!confirm('Are you sure you want to delete this habit?')) return;
  
  try {
    await deleteDoc(doc(db, 'habits', habitId));
    console.log("Habit deleted successfully");
  } catch (error) {
    console.error("Error deleting habit:", error);
  }
}

// Week Navigation
let currentWeekStart = new Date();
currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

function changeWeek(direction) {
  currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
  updateWeekDisplay();
}

function updateWeekDisplay() {
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const weekStartElement = document.getElementById('weekStart');
  
  if (weekStartElement) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    weekStartElement.textContent = `${currentWeekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
  }
  
  // Update week day headers
  weekDays.forEach((day, index) => {
    const dayElement = document.getElementById(`day-${index}`);
    if (dayElement) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + index);
      dayElement.textContent = `${day} ${date.getDate()}`;
    }
  });
}

// Utility functions
function formatDate(date) {
  return date.toLocaleDateString('vi-VN');
}

function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// Progress tracking
function calculateProgress() {
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const progressElement = document.getElementById('taskProgress');
  if (progressElement) {
    progressElement.style.width = `${progress}%`;
    progressElement.textContent = `${Math.round(progress)}%`;
  }
  
  return progress;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, waiting for authentication...");
});

// Export functions to global scope for HTML onclick handlers
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.editTask = editTask;
window.toggleHabit = toggleHabit;
window.deleteHabit = deleteHabit;

// Edit task function (placeholder)
function editTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    const newTitle = prompt('Edit task:', task.title);
    if (newTitle && newTitle.trim()) {
      updateDoc(doc(db, 'tasks', taskId), {
        title: newTitle.trim()
      }).then(() => {
        console.log("Task updated successfully");
      }).catch((error) => {
        console.error("Error updating task:", error);
      });
    }
  }
}

console.log("Firebase Todo App initialized successfully");