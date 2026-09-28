/* =========================================================
   스크래치 코딩 클래스 — 슬라이드 공통 스크립트
   모든 주차 슬라이드가 이 파일을 공유합니다.
   - 슬라이드 넘기기 / 전체화면 / 발표자 노트 패널 (모든 주차 공통)
   - SlideDeck.createGridStage: 격자 무대 위에서 토큰을 움직이는
     라이브 데모(로봇 조종, 도형 그리기 미리보기 등)를 위한 재사용 헬퍼
   각 주차 HTML은 이 파일을 <script src="../assets/slides/deck.js"></script>로
   불러오기만 하면 내비게이션/노트 기능이 자동으로 생깁니다.
   ========================================================= */
(function(){

  function buildChrome(){
    document.body.insertAdjacentHTML('afterbegin', [
      '<div class="progressbar" id="progress" style="width:0%"></div>',
      '<button class="fsbtn" id="fsbtn">전체화면</button>',
      '<button class="notes-btn" id="notesBtn">🗒️ 노트 (N)</button>',
      '<div class="navzone left" id="navLeft"></div>',
      '<div class="navzone right" id="navRight"></div>',
      '<div class="slidenum" id="slidenum">1 / 1</div>',
      '<div class="navhint">← → 방향키 또는 클릭으로 이동 · N 키로 발표자 노트 켜기/끄기</div>',
      '<div class="notes-panel open" id="notesPanel">',
      '  <div class="notes-label">🗒️ 발표자 노트 — 이렇게 말해보세요</div>',
      '  <div class="notes-content" id="notesContent"></div>',
      '</div>'
    ].join(''));
  }

  function initDeck(){
    buildChrome();
    const slides = document.querySelectorAll('#deck .slide');
    const total = slides.length;
    let idx = 0;

    function render(){
      slides.forEach((s,i)=> s.classList.toggle('active', i===idx));
      document.getElementById('progress').style.width = ((idx+1)/total*100) + '%';
      document.getElementById('slidenum').textContent = (idx+1) + ' / ' + total;
      renderNotes();
    }
    function renderNotes(){
      const src = slides[idx].querySelector('.note-src');
      document.getElementById('notesContent').innerHTML = src ? src.innerHTML : '(이 슬라이드에는 노트가 없어요)';
    }
    function next(){ if(idx < total-1){ idx++; render(); } }
    function prev(){ if(idx > 0){ idx--; render(); } }
    function toggleNotes(){
      document.getElementById('notesPanel').classList.toggle('open');
      document.body.classList.toggle('notes-open');
    }

    document.addEventListener('keydown', (e)=>{
      if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){ next(); e.preventDefault(); }
      else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){ prev(); e.preventDefault(); }
      else if(e.key === 'Home'){ idx=0; render(); }
      else if(e.key === 'End'){ idx=total-1; render(); }
      else if(e.key === 'n' || e.key === 'N'){ toggleNotes(); }
    });
    document.getElementById('navRight').addEventListener('click', next);
    document.getElementById('navLeft').addEventListener('click', prev);
    document.getElementById('fsbtn').addEventListener('click', ()=>{
      if(!document.fullscreenElement){ document.documentElement.requestFullscreen(); }
      else{ document.exitFullscreen(); }
    });
    document.getElementById('notesBtn').addEventListener('click', toggleNotes);
    document.body.classList.add('notes-open');

    render();
  }

  /**
   * 격자 무대 위에서 이모지 토큰을 버튼으로 조종하는 라이브 데모를 만듭니다.
   * container: .grid-stage 역할을 할 빈 div (예: <div class="grid-stage" id="stage"></div>)
   * opts: {
   *   cols, rows,              // 격자 크기 (기본 5x3)
   *   startX, startY, startDir,// 시작 칸(0-index)과 방향(0=위,1=오른쪽,2=아래,3=왼쪽)
   *   tokenEmoji,              // 움직이는 토큰 이모지 (기본 🤖)
   *   flag: {x, y, emoji},     // 목표 지점 표시 (선택)
   *   logEl                    // 실행 기록을 쌓을 요소 (선택, .stage-log)
   * }
   * 반환값: { forward(label), turn(delta, label), reset(), state }
   */
  function createGridStage(container, opts){
    opts = Object.assign({
      cols:5, rows:3, startX:0, startY:1, startDir:0,
      tokenEmoji:'🤖', flag:null, logEl:null
    }, opts);

    container.classList.add('grid-stage');
    container.style.setProperty('--stage-cols', opts.cols);
    container.style.setProperty('--stage-rows', opts.rows);
    container.innerHTML = '';

    if(opts.flag){
      const flagEl = document.createElement('div');
      flagEl.className = 'stage-flag';
      flagEl.style.setProperty('--gx', opts.flag.x);
      flagEl.style.setProperty('--gy', opts.flag.y);
      flagEl.textContent = opts.flag.emoji || '🏁';
      container.appendChild(flagEl);
    }

    const tokenEl = document.createElement('div');
    tokenEl.className = 'stage-token';
    const arrowEl = document.createElement('span');
    arrowEl.className = 'stage-token-arrow';
    arrowEl.textContent = '⬆️';
    const faceEl = document.createElement('span');
    faceEl.className = 'stage-token-face';
    faceEl.textContent = opts.tokenEmoji;
    tokenEl.appendChild(arrowEl);
    tokenEl.appendChild(faceEl);
    container.appendChild(tokenEl);

    let state = { gx: opts.startX, gy: opts.startY, dir: opts.startDir };

    function render(){
      tokenEl.style.setProperty('--gx', state.gx);
      tokenEl.style.setProperty('--gy', state.gy);
      arrowEl.style.transform = 'rotate(' + (state.dir*90) + 'deg)';
    }
    function log(text){
      if(!opts.logEl) return;
      const chip = document.createElement('span');
      chip.textContent = text;
      opts.logEl.appendChild(chip);
      opts.logEl.scrollLeft = opts.logEl.scrollWidth;
    }
    function forward(label){
      let {gx, gy, dir} = state;
      if(dir===0) gy--; else if(dir===1) gx++; else if(dir===2) gy++; else if(dir===3) gx--;
      state.gx = Math.max(0, Math.min(opts.cols-1, gx));
      state.gy = Math.max(0, Math.min(opts.rows-1, gy));
      render();
      log(label || '⬆️ 앞으로 한 칸');
    }
    function turn(delta, label){
      state.dir = (state.dir + delta + 4) % 4;
      render();
      log(label || (delta > 0 ? '↪️ 오른쪽으로 돌기' : '↩️ 왼쪽으로 돌기'));
    }
    function reset(){
      state = { gx: opts.startX, gy: opts.startY, dir: opts.startDir };
      render();
      if(opts.logEl) opts.logEl.innerHTML = '';
    }

    render();
    return { forward, turn, reset, state };
  }

  window.SlideDeck = { init: initDeck, createGridStage: createGridStage };
})();
