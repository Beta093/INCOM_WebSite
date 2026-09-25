(() => {
  'use strict';
  const form=document.querySelector('#join-form');
  const panels=[...document.querySelectorAll('[data-step]')];
  const steps=[...document.querySelectorAll('.steps li')];
  const back=document.querySelector('#back'), next=document.querySelector('#next'), finish=document.querySelector('#finish');
  let step=0;
  form.addEventListener('submit',event=>event.preventDefault());
  function validPanel(index){
    for(const input of panels[index].querySelectorAll('input,select,textarea')){
      if(input.required && (input.type==='text'||input.tagName==='TEXTAREA')) input.setCustomValidity(input.value.trim()?'':'내용을 입력해 주세요.');
      if(!input.reportValidity())return false;
    }
    return true;
  }
  function show(index){
    step=index;panels.forEach((panel,i)=>panel.hidden=i!==index);
    steps.forEach((item,i)=>{item.classList.toggle('is-done',i<index);if(i===index)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');});
    back.hidden=index===0;next.hidden=index===2;finish.hidden=index!==2;
    document.querySelector('#step-count').textContent=`${index+1} / 3`;
    panels[index].querySelector('h2').focus();
  }
  function review(){
    const data=new FormData(form), host=document.querySelector('#review');host.replaceChildren();
    const fields=[['이름',data.get('name')],['학과 / 전공',data.get('department')],['학년 / 상태',`${data.get('year')} / ${data.get('status')}`],['이메일',data.get('email')],['관심 활동',data.getAll('interest').join(', ')||'선택하지 않음'],['경험',data.get('experience')||'선택하지 않음'],['해보고 싶은 것',data.get('motivation')],['궁금한 점',data.get('question')||'없음']];
    for(const [label,value] of fields){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;host.append(dt,dd);}
  }
  next.addEventListener('click',()=>{if(!validPanel(step))return;if(step===1)review();show(step+1);});
  back.addEventListener('click',()=>show(Math.max(0,step-1)));
  form.addEventListener('input',event=>{event.target.setCustomValidity?.('');document.querySelector('#motivation-count').textContent=document.querySelector('#motivation').value.length;});
  finish.addEventListener('click',()=>{
    // Preview only: no network requests, browser storage or actual registration.
    for(let i=0;i<2;i++){for(const input of panels[i].querySelectorAll('[required]')){if(!input.checkValidity()){show(i);input.reportValidity();return;}}}
    form.reset();document.querySelector('#review').replaceChildren();document.querySelector('#motivation-count').textContent='0';form.hidden=true;document.querySelector('.steps').hidden=true;document.querySelector('#complete').hidden=false;document.querySelector('#complete h2').focus();
  });
  document.querySelector('#restart').addEventListener('click',()=>{document.querySelector('#complete').hidden=true;form.hidden=false;document.querySelector('.steps').hidden=false;show(0);});
})();
