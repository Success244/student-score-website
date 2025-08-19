function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculatePredictedGrade(hours, attendancePct, previousPct) {
  const normalizedHours = clamp(hours, 0, 60);
  const normalizedAttendance = clamp(attendancePct, 0, 100) / 100;
  const normalizedPrevious = clamp(previousPct, 0, 100) / 100;

  // Hours effect with diminishing returns (logistic-like curve via tanh)
  const hoursEffect = Math.tanh(normalizedHours / 20); // 0..~1

  // Attendance factor: strong penalty when very low, gentle boost when high
  const attendanceBoost = 0.8 + 0.4 * normalizedAttendance; // 0.8..1.2

  // Weighted combination
  const baseline = 0.55 * normalizedPrevious + 0.35 * hoursEffect + 0.10 * Math.sqrt(normalizedAttendance);
  let predicted = baseline * attendanceBoost;

  // Soft cap and smoothing
  predicted = Math.pow(predicted, 0.95);

  // Convert to percentage and clamp
  return Math.round(clamp(predicted * 100, 0, 100));
}

function formatLabelFromScore(score) {
  if (score >= 85) return { label: "Excellent", cls: "badge--good" };
  if (score >= 70) return { label: "Strong", cls: "badge--good" };
  if (score >= 55) return { label: "Fair", cls: "badge--warn" };
  if (score >= 40) return { label: "Needs Focus", cls: "badge--warn" };
  return { label: "At Risk", cls: "badge--bad" };
}

function syncPair(rangeEl, numberEl) {
  const sync = (from, to) => {
    to.value = from.value;
  };
  rangeEl.addEventListener('input', () => sync(rangeEl, numberEl));
  numberEl.addEventListener('input', () => sync(numberEl, rangeEl));
}

function setGauge(percent) {
  const progress = document.querySelector('.gauge__progress');
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - percent / 100);
  progress.style.strokeDashoffset = String(offset);
}

function fireConfetti(x) {
  const tpl = document.getElementById('confetti-template');
  if (!tpl) return;
  for (let i = 0; i < 18; i += 1) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const left = clamp(x + (Math.random() - 0.5) * 200, 0, window.innerWidth - 10);
    node.style.left = `${left}px`;
    node.style.background = `linear-gradient(180deg, hsl(${Math.random()*360} 90% 60%), hsl(${Math.random()*360} 90% 70%))`;
    node.style.animationDuration = `${1.2 + Math.random()*0.8}s`;
    node.style.transform = `rotate(${Math.random()*360}deg)`;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2000);
  }
}

function updatePrediction(triggerX) {
  const hours = Number(document.getElementById('hoursNumber').value);
  const attendance = Number(document.getElementById('attendanceNumber').value);
  const previous = Number(document.getElementById('previousNumber').value);

  const score = calculatePredictedGrade(hours, attendance, previous);
  const valueEl = document.getElementById('predictedValue');
  const badgeEl = document.getElementById('badgeLabel');

  valueEl.textContent = String(score);
  setGauge(score);

  const { label, cls } = formatLabelFromScore(score);
  badgeEl.textContent = label;
  badgeEl.className = `badge ${cls}`;

  if (score >= 85 && typeof triggerX === 'number') {
    fireConfetti(triggerX);
  }
}

function toggleTheme() {
  document.documentElement.classList.toggle('theme-light');
}

window.addEventListener('DOMContentLoaded', () => {
  // Pair sync
  syncPair(
    document.getElementById('hoursRange'),
    document.getElementById('hoursNumber')
  );
  syncPair(
    document.getElementById('attendanceRange'),
    document.getElementById('attendanceNumber')
  );
  syncPair(
    document.getElementById('previousRange'),
    document.getElementById('previousNumber')
  );

  // Predict on load
  updatePrediction();

  // Buttons
  document.getElementById('predictBtn').addEventListener('click', (e) => {
    updatePrediction(e.clientX);
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('hoursRange').value = 10;
    document.getElementById('hoursNumber').value = 10;
    document.getElementById('attendanceRange').value = 90;
    document.getElementById('attendanceNumber').value = 90;
    document.getElementById('previousRange').value = 75;
    document.getElementById('previousNumber').value = 75;
    updatePrediction();
  });

  document.getElementById('themeBtn').addEventListener('click', toggleTheme);
});

(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const open = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();