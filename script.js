let goalData = {};
let isUpdating = {};
let currentFilter = 'all';
let currentCategory = 'all';
let searchQuery = '';
let sortBy = 'id';

// Load data from localStorage
function loadData() {
  const saved = localStorage.getItem('goalTrackerData');
  if (saved) {
    goalData = JSON.parse(saved);
  }
  renderGoals();
  updateStats();
}

// Save data to localStorage
function saveData() {
  localStorage.setItem('goalTrackerData', JSON.stringify(goalData));
}

function updateProgress(goalId, change) {
  if (isUpdating[goalId]) return;
  
  const goal = GOALS.find(g => `goal-${g.id}` === goalId);
  if (!goal) return;

  const record = goalData[goalId] || { current: 0, completed: false };
  let newValue = record.current + change;
  
  if (newValue < 0) newValue = 0;
  if (newValue > goal.target) newValue = goal.target;
  
  const isCompleted = newValue >= goal.target;

  isUpdating[goalId] = true;
  const buttons = document.querySelectorAll(`[data-goal="${goalId}"] button`);
  buttons.forEach(btn => btn.disabled = true);

  goalData[goalId] = {
    current: newValue,
    completed: isCompleted,
    last_updated: new Date().toISOString()
  };

  saveData();
  renderGoals();
  updateStats();

  isUpdating[goalId] = false;
  buttons.forEach(btn => btn.disabled = false);
}

function markComplete(goalId) {
  if (isUpdating[goalId]) return;
  
  const goal = GOALS.find(g => `goal-${g.id}` === goalId);
  if (!goal) return;

  isUpdating[goalId] = true;
  const buttons = document.querySelectorAll(`[data-goal="${goalId}"] button`);
  buttons.forEach(btn => btn.disabled = true);

  goalData[goalId] = {
    current: goal.target,
    completed: true,
    last_updated: new Date().toISOString()
  };

  saveData();
  renderGoals();
  updateStats();

  isUpdating[goalId] = false;
  buttons.forEach(btn => btn.disabled = false);
}

function showMessage(text, isError = false) {
  const existing = document.getElementById('toast-message');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-message';
  toast.textContent = text;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${isError ? '#ef4444' : config.primary_action_color};
    color: ${config.text_color};
    border-radius: 8px;
    font-size: ${config.font_size * 0.875}px;
    font-family: ${config.font_family}, sans-serif;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    z-index: 1000;
    transition: opacity 0.3s;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function getFilteredGoals() {
  let filtered = GOALS.filter(goal => {
    const goalId = `goal-${goal.id}`;
    const data = goalData[goalId] || { completed: false };
    
    if (currentFilter === 'completed' && !data.completed) return false;
    if (currentFilter === 'active' && data.completed) return false;
    if (currentCategory !== 'all' && goal.category !== currentCategory) return false;
    if (searchQuery && !goal.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  if (sortBy === 'progress') {
    filtered.sort((a, b) => {
      const aData = goalData[`goal-${a.id}`] || { current: 0 };
      const bData = goalData[`goal-${b.id}`] || { current: 0 };
      const aPercent = (aData.current / a.target) * 100;
      const bPercent = (bData.current / b.target) * 100;
      return bPercent - aPercent;
    });
  } else if (sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  return filtered;
}

function renderGoals() {
  const baseSize = config.font_size;
  const bgColor = config.background_color;
  const surfaceColor = config.surface_color;
  const textColor = config.text_color;
  const primaryColor = config.primary_action_color;
  const secondaryColor = config.secondary_action_color;
  const fontFamily = config.font_family;

  const categories = [...new Set(GOALS.map(g => g.category))];
  const filteredGoals = getFilteredGoals();

  const goalsHtml = filteredGoals.map((goal) => {
    const goalId = `goal-${goal.id}`;
    const data = goalData[goalId] || { current: 0, completed: false };
    const current = data.current || 0;
    const percentage = goal.target > 0 ? Math.round((current / goal.target) * 100) : 0;
    const isCompleted = data.completed || current >= goal.target;
    
    let incrementText = '+1';
    let decrementText = '-1';
    if (goal.type === 'followers' || goal.type === 'money') {
      incrementText = `+${goal.increment}`;
      decrementText = `-${goal.increment}`;
    }
    
    return `
      <div class="goal-item" data-goal="${goalId}" style="background: ${surfaceColor}; padding: 20px; border-radius: 16px; margin-bottom: 16px; opacity: ${isCompleted ? '0.85' : '1'}; border: 3px solid ${isCompleted ? primaryColor : 'transparent'};">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
              <span style="font-size: ${baseSize * 1.75}px;">${goal.emoji}</span>
              <div style="flex: 1; min-width: 200px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="color: ${textColor}; font-size: ${baseSize}px; font-weight: 600; font-family: ${fontFamily}, sans-serif;">${goal.name}</span>
                  ${isCompleted ? `<span style="background: ${primaryColor}; color: ${textColor}; padding: 4px 12px; border-radius: 12px; font-size: ${baseSize * 0.75}px; font-weight: 600; font-family: ${fontFamily}, sans-serif;">✓ Completed</span>` : ''}
                </div>
                <span style="color: ${textColor}; font-size: ${baseSize * 0.75}px; opacity: 0.6; font-family: ${fontFamily}, sans-serif;">${goal.category}</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px;">
              <div style="flex: 1;">
                <div style="background: rgba(0,0,0,0.4); height: 10px; border-radius: 5px; overflow: hidden;">
                  <div class="progress-bar" style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, ${primaryColor}, ${adjustColor(primaryColor, 30)}); border-radius: 5px;"></div>
                </div>
              </div>
              <span style="color: ${primaryColor}; font-size: ${baseSize}px; font-weight: 700; font-family: ${fontFamily}, sans-serif; min-width: 100px; text-align: right;">
                ${current} / ${goal.target} ${goal.unit}
              </span>
              <span style="color: ${textColor}; font-size: ${baseSize * 0.875}px; font-weight: 600; font-family: ${fontFamily}, sans-serif; min-width: 50px; text-align: right; opacity: 0.8;">
                ${percentage}%
              </span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-left: 20px;">
            ${goal.type === 'milestone' ? `
              <button onclick="markComplete('${goalId}')" style="background: ${isCompleted ? secondaryColor : primaryColor}; color: ${textColor}; border: none; padding: 10px 20px; border-radius: 8px; font-size: ${baseSize * 0.875}px; font-weight: 600; cursor: pointer; font-family: ${fontFamily}, sans-serif; transition: all 0.2s; ${isCompleted ? 'cursor: not-allowed;' : ''}" onmouseover="if(!this.disabled) this.style.background='${adjustColor(isCompleted ? secondaryColor : primaryColor, -30)}'" onmouseout="this.style.background='${isCompleted ? secondaryColor : primaryColor}'" ${isCompleted ? 'disabled' : ''}>
                ✓ Mark Done
              </button>
            ` : `
              <button onclick="updateProgress('${goalId}', -${goal.increment})" style="background: ${secondaryColor}; color: ${textColor}; border: none; padding: 8px 16px; border-radius: 8px; font-size: ${baseSize}px; font-weight: 600; cursor: pointer; font-family: ${fontFamily}, sans-serif; transition: all 0.2s; ${current === 0 ? 'opacity: 0.4; cursor: not-allowed;' : ''}" onmouseover="if(!this.disabled) this.style.background='${adjustColor(secondaryColor, -30)}'" onmouseout="this.style.background='${secondaryColor}'" ${current === 0 ? 'disabled' : ''}>
                ${decrementText}
              </button>
              <button onclick="updateProgress('${goalId}', ${goal.increment})" style="background: ${primaryColor}; color: ${textColor}; border: none; padding: 8px 16px; border-radius: 8px; font-size: ${baseSize}px; font-weight: 600; cursor: pointer; font-family: ${fontFamily}, sans-serif; transition: all 0.2s; ${isCompleted ? 'opacity: 0.4; cursor: not-allowed;' : ''}" onmouseover="if(!this.disabled) this.style.background='${adjustColor(primaryColor, -30)}'" onmouseout="this.style.background='${primaryColor}'" ${isCompleted ? 'disabled' : ''}>
                ${incrementText}
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

  const categoryButtons = categories.map(cat => `
    <button class="category-badge" onclick="filterByCategory('${cat}')" style="background: ${currentCategory === cat ? primaryColor : surfaceColor}; color: ${textColor}; border: 2px solid ${currentCategory === cat ? primaryColor : 'transparent'}; padding: 8px 16px; border-radius: 20px; font-size: ${baseSize * 0.875}px; cursor: pointer; font-family: ${fontFamily}, sans-serif; transition: all 0.2s;" onmouseover="this.style.borderColor='${primaryColor}'" onmouseout="this.style.borderColor='${currentCategory === cat ? primaryColor : 'transparent'}'">
      ${cat}
    </button>
  `).join('');

  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="background: ${bgColor}; min-height: 100%; padding: 32px 16px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: ${textColor}; font-size: ${baseSize * 2.5}px; font-weight: 800; margin: 0 0 12px 0; font-family: ${fontFamily}, sans-serif; background: linear-gradient(90deg, ${primaryColor}, ${adjustColor(primaryColor, 50)}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${config.main_title}</h1>
          <p style="color: ${textColor}; font-size: ${baseSize * 1.1}px; opacity: 0.8; margin: 0; font-family: ${fontFamily}, sans-serif;">${config.subtitle}</p>
        </div>

        <div id="stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px;"></div>

        <div style="background: ${surfaceColor}; padding: 24px; border-radius: 20px; margin-bottom: 24px;">
          <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
            <input type="text" id="search-input" placeholder="🔍 Search goals..." onkeyup="handleSearch(this.value)" style="flex: 1; min-width: 200px; background: ${bgColor}; color: ${textColor}; border: 2px solid ${primaryColor}; padding: 12px 16px; border-radius: 12px; font-size: ${baseSize}px; font-family: ${fontFamily}, sans-serif; outline: none;">
            <select id="sort-select" onchange="handleSort(this.value)" style="background: ${bgColor}; color: ${textColor}; border: 2px solid ${primaryColor}; padding: 12px 16px; border-radius: 12px; font-size: ${baseSize}px; font-family: ${fontFamily}, sans-serif; cursor: pointer; outline: none;">
              <option value="id">Sort by: Default</option>
              <option value="progress">Sort by: Progress</option>
              <option value="name">Sort by: Name</option>
            </select>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
            <button class="category-badge" onclick="filterByCategory('all')" style="background: ${currentCategory === 'all' ? primaryColor : surfaceColor}; color: ${textColor}; border: 2px solid ${currentCategory === 'all' ? primaryColor : 'transparent'}; padding: 8px 16px; border-radius: 20px; font-size: ${baseSize * 0.875}px; cursor: pointer; font-family: ${fontFamily}, sans-serif; font-weight: 600;">
              All Categories
            </button>
            ${categoryButtons}
          </div>

          <div style="display: flex; gap: 8px; margin-bottom: 24px;">
            <button onclick="filterGoals('all')" id="filter-all" style="background: ${currentFilter === 'all' ? primaryColor : secondaryColor}; color: ${textColor}; border: none; padding: 10px 20px; border-radius: 8px; font-size: ${baseSize * 0.875}px; cursor: pointer; font-family: ${fontFamily}, sans-serif; font-weight: 600; transition: all 0.2s;">All</button>
            <button onclick="filterGoals('active')" id="filter-active" style="background: ${currentFilter === 'active' ? primaryColor : secondaryColor}; color: ${textColor}; border: none; padding: 10px 20px; border-radius: 8px; font-size: ${baseSize * 0.875}px; cursor: pointer; font-family: ${fontFamily}, sans-serif; font-weight: 600; transition: all 0.2s;">Active</button>
            <button onclick="filterGoals('completed')" id="filter-completed" style="background: ${currentFilter === 'completed' ? primaryColor : secondaryColor}; color: ${textColor}; border: none; padding: 10px 20px; border-radius: 8px; font-size: ${baseSize * 0.875}px; cursor: pointer; font-family: ${fontFamily}, sans-serif; font-weight: 600; transition: all 0.2s;">Completed</button>
          </div>

          <div id="goals-list">${goalsHtml.length > 0 ? goalsHtml : `<p style="text-align: center; color: ${textColor}; opacity: 0.6; font-size: ${baseSize}px; padding: 40px; font-family: ${fontFamily}, sans-serif;">No goals found. Try adjusting your filters.</p>`}</div>
        </div>
      </div>
    </div>
  `;
}

function updateStats() {
  const baseSize = config.font_size;
  const surfaceColor = config.surface_color;
  const textColor = config.text_color;
  const primaryColor = config.primary_action_color;
  const fontFamily = config.font_family;

  const totalGoals = GOALS.length;
  const completedGoals = Object.values(goalData).filter(g => g.completed).length;
  
  let totalPercentage = 0;
  GOALS.forEach(goal => {
    const goalId = `goal-${goal.id}`;
    const data = goalData[goalId] || { current: 0 };
    const percentage = goal.target > 0 ? (data.current / goal.target) * 100 : 0;
    totalPercentage += Math.min(100, percentage);
  });
  const avgProgress = totalGoals > 0 ? Math.round(totalPercentage / totalGoals) : 0;

  const statsEl = document.getElementById('stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div style="background: linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, -30)}); padding: 24px; border-radius: 16px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        <div style="color: ${textColor}; font-size: ${baseSize * 2.5}px; font-weight: 800; font-family: ${fontFamily}, sans-serif;">${completedGoals}</div>
        <div style="color: ${textColor}; font-size: ${baseSize}px; opacity: 0.9; margin-top: 8px; font-family: ${fontFamily}, sans-serif; font-weight: 500;">✓ Completed</div>
      </div>
      <div style="background: ${surfaceColor}; padding: 24px; border-radius: 16px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
        <div style="color: ${primaryColor}; font-size: ${baseSize * 2.5}px; font-weight: 800; font-family: ${fontFamily}, sans-serif;">${totalGoals - completedGoals}</div>
        <div style="color: ${textColor}; font-size: ${baseSize}px; opacity: 0.7; margin-top: 8px; font-family: ${fontFamily}, sans-serif; font-weight: 500;">🎯 In Progress</div>
      </div>
      <div style="background: ${surfaceColor}; padding: 24px; border-radius: 16px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
        <div style="color: ${primaryColor}; font-size: ${baseSize * 2.5}px; font-weight: 800; font-family: ${fontFamily}, sans-serif;">${avgProgress}%</div>
        <div style="color: ${textColor}; font-size: ${baseSize}px; opacity: 0.7; margin-top: 8px; font-family: ${fontFamily}, sans-serif; font-weight: 500;">📊 Overall Progress</div>
      </div>
      <div style="background: ${surfaceColor}; padding: 24px; border-radius: 16px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
        <div style="color: ${primaryColor}; font-size: ${baseSize * 2.5}px; font-weight: 800; font-family: ${fontFamily}, sans-serif;">${totalGoals}</div>
        <div style="color: ${textColor}; font-size: ${baseSize}px; opacity: 0.7; margin-top: 8px; font-family: ${fontFamily}, sans-serif; font-weight: 500;">🎪 Total Goals</div>
      </div>
    `;
  }
}

function filterGoals(filter) {
  currentFilter = filter;
  renderGoals();
}

function filterByCategory(category) {
  currentCategory = category;
  renderGoals();
}

function handleSearch(query) {
  searchQuery = query;
  renderGoals();
}

function handleSort(sort) {
  sortBy = sort;
  renderGoals();
}

function adjustColor(color, amount) {
  const num = parseInt(color.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Initialize on page load
loadData();

