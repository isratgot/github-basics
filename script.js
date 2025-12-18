const goals = [
  { id: 1, title: "Study 2 hours daily", target: 730, progress: 0, emoji: "📚" },
  { id: 2, title: "Workout 5x a week", target: 260, progress: 0, emoji: "💪" },
  { id: 3, title: "Read 24 books", target: 24, progress: 0, emoji: "📖" }
];

// Load saved progress
const saved = JSON.parse(localStorage.getItem("goals"));
if (saved) {
  goals.forEach(g => {
    const found = saved.find(s => s.id === g.id);
    if (found) g.progress = found.progress;
  });
}

const container = document.getElementById("goalsContainer");
const searchInput = document.getElementById("searchInput");

function saveGoals() {
  localStorage.setItem("goals", JSON.stringify(goals));
}

function updateProgress(id, change) {
  const goal = goals.find(g => g.id === id);
  if (!goal) return;

  goal.progress = Math.max(0, Math.min(goal.target, goal.progress + change));
  saveGoals();
  renderGoals();
}

function renderGoals(filter = "") {
  container.innerHTML = "";

  goals
    .filter(g => g.title.toLowerCase().includes(filter.toLowerCase()))
    .forEach(goal => {
      const percent = Math.round((goal.progress / goal.target) * 100);

      const div = document.createElement("div");
      div.className = "goal-item bg-gray-800 p-4 rounded";

      div.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <h2 class="text-lg font-semibold">${goal.emoji} ${goal.title}</h2>
          <span>${goal.progress}/${goal.target}</span>
        </div>

        <div class="w-full bg-gray-700 rounded h-3 mb-3">
          <div class="progress-bar bg-green-500 h-3 rounded" style="width:${percent}%"></div>
        </div>

        <div class="flex gap-2">
          <button onclick="updateProgress(${goal.id}, -1)"
            class="px-3 py-1 bg-red-600 rounded">−</button>
          <button onclick="updateProgress(${goal.id}, 1)"
            class="px-3 py-1 bg-green-600 rounded">+</button>
        </div>
      `;

      container.appendChild(div);
    });
}

searchInput.addEventListener("input", e => {
  renderGoals(e.target.value);
});

renderGoals();
