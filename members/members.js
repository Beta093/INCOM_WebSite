(() => {
  'use strict';
  // Public, fictional fixtures only. This page is NOT an authentication boundary.
  // Production must authorize every data read and application on the server.
  const events = [
    { id:'lounge', day:8, type:'교류', title:'오픈 코딩 라운지', time:'18:30 — 20:00', place:'데모 라운지 · 실제 장소 미정', description:'각자 풀고 있는 문제를 가져와 함께 이야기하는 시간. 가볍게 질문하고 서로의 아이디어를 나눠보세요.' },
    { id:'python', day:13, type:'교육', title:'Python, 함께 시작하기', time:'18:00 — 19:30', place:'데모 교육실 · 실제 장소 미정', description:'작은 예제를 직접 만들면서 Python의 기본 흐름을 익히는 예시 교육입니다. 개인 노트북을 준비하는 상황을 가정했어요.' },
    { id:'build', day:22, type:'프로젝트', title:'아이디어 빌드 나이트', time:'19:00 — 21:00', place:'데모 프로젝트룸 · 실제 장소 미정', description:'만들고 싶었던 아이디어를 소개하고 함께할 동료를 찾는 예시 모임입니다. 완성된 기획이 없어도 괜찮아요.' },
    { id:'study', day:28, type:'스터디', title:'알고리즘 페어 스터디', time:'18:30 — 20:00', place:'데모 온라인 공간 · 실제 링크 없음', description:'둘씩 짝을 지어 문제를 풀고 접근 방법을 설명하는 예시 스터디입니다.' }
  ];
  const notices = [
    {title:'회원 공간에 오신 것을 환영해요', kind:'안내 · 데모', text:'현재 화면은 디자인과 이용 흐름을 확인하기 위한 시제품입니다. 모든 일정은 가상이며, 실제 부원 정보나 내부 자료는 포함하지 않습니다.'},
    {title:'정회원과 OB, 이렇게 이용해요', kind:'이용 가이드 · 데모', text:'정회원은 일정·공지·자료 열람과 활동 신청이 가능합니다. OB/이전회원은 동일한 내용을 열람할 수 있지만 신청은 할 수 없습니다. 실제 서비스에서는 디스코드 역할을 서버에서 확인해야 합니다.'},
    {title:'스터디 시작 전 체크리스트', kind:'자료 · 예시', text:'관심 주제를 정하고, 함께할 인원과 만나는 주기를 이야기해 보세요. 첫 모임에서는 목표와 진행 방식을 합의하고 기록을 남겨두면 좋아요. 이 글은 화면 구성을 위한 공개 예시 자료입니다.'}
  ];
  const $ = selector => document.querySelector(selector);
  const dialog = $('#event-dialog');
  let role = null, activeEvent = null, year = 2026, month = 9, toastTimer;
  const applications = new Map();
  const labels = {home:'일정과 소식',schedule:'활동 일정',applications:'내 신청 내역',notices:'공지 · 자료'};
  const dateLabel = event => `2026. 10. ${String(event.day).padStart(2,'0')}`;
  const row = event => `<button class="event-row" data-event="${event.id}"><span class="event-date"><small>OCT</small>${event.day}</span><div><span class="type">${event.type} · 데모</span><h4>${event.title}</h4><p>${event.time}</p></div><span class="arrow">↗</span></button>`;
  const notice = item => `<details class="notice-row"><summary>${item.title}<small>${item.kind}</small></summary><p>${item.text}</p></details>`;
  function toast(message) { clearTimeout(toastTimer); $('#toast').textContent=message; $('#toast').hidden=false; toastTimer=setTimeout(()=>$('#toast').hidden=true,4000); }
  function navigate(view) {
    if (!role) { toast('먼저 정회원 또는 OB 데모로 입장해 주세요.'); return; }
    document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==`${view}-view`);
    document.querySelectorAll('nav [data-view]').forEach(button=>{ if(button.dataset.view===view)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current'); });
    $('#breadcrumb').textContent=labels[view];
    if(view==='schedule') renderCalendar();
    if(view==='applications') renderApplications();
  }
  function updateRole() {
    $('#identity').textContent=role==='member'?'정회원 · 데모 계정':'OB / 이전회원 · 데모 계정';
    $('#role-summary').innerHTML=role==='member'?'정회원 <small>열람 + 신청</small>':'OB <small>열람 전용</small>';
    renderApplications();
  }
  function renderApplications() {
    $('#application-count').innerHTML=`${applications.size} <small>건</small>`;
    if(role==='ob') { $('#applications').innerHTML='<div class="empty">OB/이전회원은 활동 내용을 열람할 수 있어요.<br>신청 기능은 정회원만 이용할 수 있습니다.<button data-view="schedule">일정 둘러보기 ↗</button></div>';return; }
    $('#applications').innerHTML=applications.size?[...applications.keys()].map(id=>{const event=events.find(item=>item.id===id);return `<article class="application-row"><div><span class="type">데모 신청 완료</span><h3>${event.title}</h3><p>${dateLabel(event)} · ${event.time}</p></div><button data-event="${id}">상세 / 취소 ↗</button></article>`;}).join(''):'<div class="empty">아직 신청한 활동이 없어요.<br>함께하고 싶은 일정을 찾아보세요.<button data-view="schedule">활동 일정 둘러보기 ↗</button></div>';
  }
  function renderCalendar() {
    $('#month-label').textContent=`${year}. ${String(month+1).padStart(2,'0')}`;
    const selected=year===2026&&month===9?events.filter(event=>$('#category').value==='all'||event.type===$('#category').value):[];
    const offset=new Date(year,month,1).getDay(), days=new Date(year,month+1,0).getDate();
    let html=['SUN','MON','TUE','WED','THU','FRI','SAT'].map(day=>`<div class="day-label">${day}</div>`).join('');
    for(let index=0;index<Math.ceil((offset+days)/7)*7;index++) {
      const day=index-offset+1;
      html+=day<1||day>days?'<div class="blank" aria-hidden="true"></div>':`<div><span>${day}</span>${selected.filter(event=>event.day===day).map(event=>`<button data-event="${event.id}" aria-label="${month+1}월 ${day}일 ${event.title}">${event.title}</button>`).join('')}</div>`;
    }
    $('#calendar').innerHTML=html;
    $('#schedule-list').innerHTML=selected.length?selected.map(row).join(''):'<div class="empty">이 달에는 해당하는 데모 일정이 없어요.</div>';
  }
  function openEvent(id) {
    if(!role)return;
    activeEvent=events.find(event=>event.id===id); if(!activeEvent)return;
    $('#event-category').textContent=`${activeEvent.type} / DEMO EVENT`;
    $('#event-title').textContent=activeEvent.title;
    $('#event-description').textContent=activeEvent.description;
    $('#event-meta').innerHTML=`<dt>일시</dt><dd>${dateLabel(activeEvent)}<br>${activeEvent.time}</dd><dt>장소</dt><dd>${activeEvent.place}</dd><dt>대상</dt><dd>신청: 정회원 / 열람: 정회원 및 OB</dd>`;
    const applied=applications.has(id);
    $('#permission-note').textContent=role==='ob'?'OB/이전회원은 열람만 가능합니다. 정회원만 신청할 수 있어요.':applied?'데모 신청이 완료되었습니다. 실제 접수된 신청은 아닙니다.':'가상 일정입니다. 신청 내용은 서버에 전송되지 않습니다.';
    $('#application-form').hidden=role!=='member'||applied;
    $('#cancel-application').hidden=role!=='member'||!applied;
    $('#application-note').value='';
    dialog.showModal();
  }
  document.addEventListener('click',event=>{
    const demo=event.target.closest('[data-demo]');
    if(demo){role=demo.dataset.demo;$('#role').value=role;$('#gate').hidden=true;$('#workspace').hidden=false;$('#exit').hidden=false;updateRole();navigate('home');return;}
    const view=event.target.closest('[data-view]');if(view)navigate(view.dataset.view);
    const item=event.target.closest('[data-event]');if(item)openEvent(item.dataset.event);
  });
  $('#role').addEventListener('change',()=>{role=$('#role').value;updateRole();toast(role==='ob'?'OB 열람 전용 화면으로 전환했어요.':'정회원 데모 화면으로 전환했어요.');});
  $('#exit').addEventListener('click',()=>{role=null;applications.clear();$('#workspace').hidden=true;$('#gate').hidden=false;$('#exit').hidden=true;$('#identity').textContent='로그인 전';$('#breadcrumb').textContent='MEMBERS';});
  $('.dialog-close').addEventListener('click',()=>dialog.close());
  $('#application-form').addEventListener('submit',event=>{event.preventDefault();if(role!=='member'||!activeEvent)return;applications.set(activeEvent.id,true);renderApplications();dialog.close();toast('데모 신청 완료! 실제 신청은 전송되지 않았어요.');});
  $('#cancel-application').addEventListener('click',()=>{if(role!=='member'||!activeEvent)return;applications.delete(activeEvent.id);renderApplications();dialog.close();toast('데모 신청을 취소했어요.');});
  function moveMonth(amount){const date=new Date(year,month+amount,1);year=date.getFullYear();month=date.getMonth();renderCalendar();}
  $('#prev-month').addEventListener('click',()=>moveMonth(-1));$('#next-month').addEventListener('click',()=>moveMonth(1));
  $('#sample-month').addEventListener('click',()=>{year=2026;month=9;renderCalendar();});$('#category').addEventListener('change',renderCalendar);
  $('#upcoming').innerHTML=events.slice(0,3).map(row).join('');$('#notice-preview').innerHTML=notices.slice(0,2).map(notice).join('');$('#notices').innerHTML=notices.map(notice).join('');
})();
