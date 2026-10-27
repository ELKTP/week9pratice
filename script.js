// =========================================================
// 개인 프로필 웹사이트 — 인터랙션 스크립트
// =========================================================

const EMAIL = 'hong@example.com';

const drawer = document.getElementById('mobile-drawer');
const menuToggle = document.querySelector('.menu-toggle');
const sections = [...document.querySelectorAll('main > section[id]')];
const navLinks = [...document.querySelectorAll('[data-nav]')];
const toastEl = document.getElementById('toast');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- 공통: 토스트 메시지 ---------- */
let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2500);
}

/* ---------- 1. 메뉴 클릭 → 해당 영역으로 이동 ---------- */
function setDrawer(open) {
  drawer.hidden = !open;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  menuToggle.querySelector('.material-symbols-outlined').textContent = open ? 'close' : 'menu';
}

menuToggle.addEventListener('click', () => setDrawer(drawer.hidden));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !drawer.hidden) setDrawer(false);
});

// 메뉴 바깥을 누르면 모바일 메뉴 닫기
document.addEventListener('click', (e) => {
  if (!drawer.hidden && !e.target.closest('.topbar')) setDrawer(false);
});

// 페이지 내부 링크(#home, #about ...)는 부드럽게 스크롤
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link || e.defaultPrevented) return;

  const id = link.getAttribute('href').slice(1);
  const target = id && document.getElementById(id);
  if (!target) return;

  e.preventDefault();
  setDrawer(false);
  target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
});

// 스크롤 위치에 맞춰 현재 메뉴 강조
function setActive(id) {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('is-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function currentSectionId() {
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  if (atBottom) return sections[sections.length - 1].id;

  let current = sections[0].id;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= window.innerHeight * 0.35) current = section.id;
  }
  return current;
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    setActive(currentSectionId());
    ticking = false;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) setDrawer(false);
  onScroll();
});
onScroll();

/* ---------- 2. 프로젝트 카드 클릭 → 관련 링크로 이동 ---------- */
document.querySelectorAll('.project-card[data-href]').forEach((card) => {
  const open = () => window.open(card.dataset.href, '_blank', 'noopener');

  card.addEventListener('click', (e) => {
    // 카드 안의 '라이브 데모', 'GitHub' 링크는 각자의 주소로 이동
    if (e.target.closest('a, button')) return;
    // 텍스트를 드래그해서 선택한 경우는 이동하지 않음
    if (window.getSelection().toString()) return;
    open();
  });

  // 키보드(Tab으로 포커스 후 Enter/Space)로도 열 수 있게
  card.addEventListener('keydown', (e) => {
    if (e.target !== card) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });
});

/* ---------- 3. 이메일 클릭 → 메일 작성창 열기 ---------- */
// mailto: 링크는 브라우저가 기본 메일 앱을 엽니다.
// 메일 앱이 없는 환경을 위해 안내 메시지를 함께 보여 줍니다.
document.querySelectorAll('a[data-mailto]').forEach((link) => {
  link.addEventListener('click', () => {
    showToast('메일 작성창을 여는 중… 열리지 않으면 주소를 복사해 주세요.');
  });
});

// 이메일 주소 복사
const copyBtnText = document.getElementById('copy-btn-text');
document.getElementById('copy-btn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(EMAIL);
  } catch {
    // clipboard API를 쓸 수 없는 환경(일부 브라우저, http 등)용 대체 방법
    const temp = document.createElement('textarea');
    temp.value = EMAIL;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    temp.remove();
  }
  copyBtnText.textContent = '복사됨!';
  showToast('이메일 주소를 복사했습니다.');
  setTimeout(() => { copyBtnText.textContent = '복사'; }, 2000);
});

// 빠른 메시지 폼 → 입력 내용이 채워진 메일 작성창 열기
const form = document.getElementById('contact-form');
const feedback = document.getElementById('submit-feedback');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('sender-name').value.trim();
  const replyEmail = document.getElementById('reply-email').value.trim();
  const message = document.getElementById('message').value.trim();

  const subject = `[포트폴리오 문의] ${name}님의 메시지`;
  const body = `보내는 사람: ${name}\n회신 이메일: ${replyEmail}\n\n${message}`;

  window.location.href =
    `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  feedback.hidden = false;
  setTimeout(() => { feedback.hidden = true; }, 5000);
});

/* ---------- 기타 ---------- */
// 이력서 다운로드 (예시 사이트이므로 안내만 표시)
document.querySelector('[data-resume]').addEventListener('click', (e) => {
  e.preventDefault();
  showToast('예시 사이트입니다. 실제 이력서 PDF 경로로 바꿔 주세요.');
});

// 외부 이미지를 불러오지 못하면 숨기고 대체 배경을 보여 줌
document.querySelectorAll('img').forEach((img) => {
  const markBroken = () => img.classList.add('is-broken');
  if (img.complete && img.naturalWidth === 0) markBroken();
  else img.addEventListener('error', markBroken);
});

// 푸터 연도 자동 표시
document.getElementById('year').textContent = new Date().getFullYear();
