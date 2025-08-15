async function api(path, opts = {}) {
  const base = window.API_BASE || '';
  const res = await fetch(base + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}



const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const screens ={
    start: $('#start-view'),
    question: $('#question-view'),
    result: $('#result-view')
}


// function id = untuk hide and show class screen (id = start/question/result) ---> object[id] === object.id
function show(id) {
  Object.values(screens).forEach(s => s.classList.remove('is-active'));
  screens[id].classList.add('is-active');
}

let sessionId = null;
let totalPeople = 1;
let currentPerson = 1;

const answerState = {
    q1: '',
    era: '', // new / classic
    moods: [], // [Fun, Serious, Inspiring, Scary]
    q4: '',
    timeLimit: '',
};

/* --- DOM refs --- */

const numPeopleInput = $('#num');
const timeInput = $('#time');
const startBtn = $('#start-btn');
const personNumberEl = $('#person-number');

const q1 = $('#q1');
const eraGroup = $('#mood-era');
const typeGroup = $('#mood-type');
const q4 = $('#q4');

const nextPersonBtn = $('#next-person-btn');
const backBtn = $('#back-btn');

const nextMovieBtn = $('#next-movie-btn');

/* --- helpers --- */

function togglePill(groupEl, multi = false){
    groupEl.addEventListener('click', (e) =>{
        const btn = e.target.closest('.pill');
        if(!btn) return;
        if(!multi){
            //single select
            groupEl.querySelectorAll('.pill').forEach(p=> p.classList.remove('is-selected'));
            btn.classList.add('is-selected');
        }
        if(multi){
            //multi select
            btn.classList.toggle('is-selected');
        }
    })
}

togglePill(eraGroup, false);
togglePill(typeGroup, true);

function collectAnswer(){
    const eraSelected = eraGroup.querySelector('.pill.is-selected');
    const moodsSelected = [...typeGroup.querySelectorAll('.pill.is-selected')].map(p=> p.dataset.v);

    return{
        favoriteWhy: q1.value.trim(),
        era: eraSelected ? eraSelected.dataset.v : '',
        moods: moodsSelected,
        islandWho: q4.value.trim(),
        timeLimit: timeInput.value.trim(),
    }
}

function clearInputForNextPerson(){
    q1.value = '';
    q4.value = '';
    eraGroup.querySelectorAll('.pill').forEach(p => p.classList.remove('is-selected'));
    typeGroup.querySelectorAll('.pill').forEach(p => p.classList.remove('is-selected'));
}

/* ---API---*/
async function api(path, opts = {}) {
    const res = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
    })
    if (!res.ok) {
        const err = await res.json().catch(() =>({}));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
}

/* --- flows --- */

startBtn.addEventListener('click', async () =>{
    totalPeople = Math.max(1, Number(numPeopleInput.value||1));
    answerState.timeLimit = timeInput.value || '';
    const out = await api('/api/session/start', {
        method: 'POST',
        body: JSON.stringify({
            totalPeople,
            timelimit: answerState.timeLimit,
        })
    })
    sessionId = out.sessionId;
    currentPerson = 1;
    personNumberEl.textContent = currentPerson;
    show('question');
});

backBtn.addEventListener('click', () => {
    show('start');
});

nextPersonBtn.addEventListener('click', async () => {
    const payload = collectAnswer();
    await api('/api/session/answers', {
        method: 'POST',
        body: JSON.stringify({
            sessionId,
            personNum: currentPerson,
            answers: payload,
        })
    })
    if (currentPerson < totalPeople) {
        currentPerson++;
        personNumberEl.textContent = currentPerson;
        clearInputForNextPerson();
        q1.focus();
    } else {
        // all answered -> recommend
        await loadRecommendations();
    }
});

async function loadRecommendations(){
 const out = await api(`/api/session/recommend?sessionId=${encodeURIComponent(sessionId)}`);
 renderMovie(out.movies?.[0]); //tampilkan yang terbaik
 // simpan list kalau mau next/prev
 window.__movies = out.movies || [];
 window.__idx = 0;
 show('result')
}

/* --- render --- */
function renderMovie(movie) {
 if(!movie) return;
    const poster = screens.result.querySelector('.movie__poster');
    const title = screens.result.querySelector('.movie__title');
    const meta = screens.result.querySelector('.movie__meta');
    const desc = screens.result.querySelector('.movie__desc');

    poster.src = movie.poster_url || 'poster.jpg';
    poster.alt = movie.title;
    title.textContent = `${movie.title} (${movie.year})`;
    desc.textContent = movie.pretty_reason || movie.description || '';

}

nextMovieBtn.addEventListener('click', ()=>{
    if (!window.__movies?.length) return;
    window.__idx = (window.__idx + 1) % window.__movies.length;
    renderMovie(window.__movies[window.__idx]);
})

