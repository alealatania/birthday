(() => {
  const $ = (s) => document.querySelector(s);
  const config = window.ALEA_CONFIG || {};
  const q = new URLSearchParams(location.search);
  const token = q.get('id') || '';
  const previewGuest = q.get('guest') || '';
  let guest = previewGuest.trim().slice(0, 80) || 'Guest';
  let activePage = 1;
  const feedback = $('#feedback');
  const setFeedback = (message) => { feedback.textContent = message; };
  function page(n) {
    activePage = n;
    document.querySelectorAll('.page').forEach((p,i) => p.classList.toggle('active', i === n - 1));
  }
  function nameUpdate(name) {
    guest = name;
    $('#guestName').textContent = `Dear ${guest},`;
    const text = $('#guestName');
    text.style.fontSize = guest.length > 21 ? 'clamp(15px, 3.9vw, 26px)' : '';
  }
  nameUpdate(guest);
  let opening = false;
  $('#open').addEventListener('click', () => {
    if (opening) return;
    opening = true;
    $('#page1').classList.add('page1-opening');
    setTimeout(() => { page(2); opening = false; }, 2470);
  });
  $('#toRsvp').addEventListener('click', () => page(3));
  const snow = $('#snow');
  for (let i=0; i<34; i++) {
    const f = document.createElement('span');
    f.className='flake'; f.textContent= i % 5 === 0 ? '❄' : '•';
    f.style.left = `${((i * 71.19) % 100).toFixed(2)}%`;
    f.style.setProperty('--size', `${i%5===0?8+(i%4)*3:4+(i%4)*2}px`);
    f.style.setProperty('--opacity', `${.2+(i%5)*.13}`);
    f.style.setProperty('--dur', `${9+(i*7%12)}s`);
    f.style.setProperty('--delay', `${-((i*13)%21)}s`);
    f.style.setProperty('--drift', `${(i%2?1:-1)*(15+i%60)}px`);
    snow.appendChild(f);
  }
  // Apps Script JSONP read: only the child name for a valid unpredictable invitation id.
  function jsonp(params, timeout=10000) {
    return new Promise((resolve,reject) => {
      if (!config.appsScriptUrl) { reject(new Error('Google Sheets connection is not configured.')); return; }
      const cb = 'alea_cb_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      let timer;
      const clean = () => { clearTimeout(timer); script.remove(); delete window[cb]; };
      window[cb] = (payload) => { clean(); resolve(payload); };
      const url = new URL(config.appsScriptUrl);
      Object.entries({ ...params, callback: cb }).forEach(([k,v]) => url.searchParams.set(k,v));
      script.src=url.toString();
      script.onerror = () => { clean(); reject(new Error('Unable to contact RSVP service.')); };
      timer=setTimeout(() => { clean(); reject(new Error('RSVP service timed out.')); },timeout);
      document.head.append(script);
    });
  }
  async function loadGuest() {
    if (!token) return;
    try {
      const answer = await jsonp({action:'guest',id:token});
      if (!answer.ok || !answer.name) throw new Error('Invitation link not recognized.');
      nameUpdate(answer.name);
    } catch(e) {
      nameUpdate('Guest');
      setFeedback('Invitation link could not be verified.');
    }
  }
  loadGuest();
  const form=$('#rsvpForm');
  form.addEventListener('change', () => {
    const yes=form.querySelector('input[name="attendance"]:checked')?.value;
    const a=form.querySelectorAll('input[name="adults"]');
    // An RSVP of No does not need an adult count. Hide requirement but keep layout intact.
    a.forEach(x=>x.required = (yes !== 'No' && x.value === '1'));
    if(yes==='No') a.forEach(x=>x.checked=false);
    setFeedback('');
  });
  let submitting = false;
  form.addEventListener('submit', async e => {
    e.preventDefault(); if(submitting)return;
    const attendance=form.querySelector('input[name="attendance"]:checked')?.value;
    const adults=attendance==='No' ? '0' : form.querySelector('input[name="adults"]:checked')?.value;
    if(!attendance){setFeedback('Please choose Yes, No, or Maybe.');return;}
    if(!adults){setFeedback('Please select 1 or 2 adults.');return;}
    if(!token){setFeedback('This is a preview. Please open a personalized invitation link to submit.');return;}
    if(!config.appsScriptUrl){setFeedback('RSVP is not connected to Google Sheets yet.');return;}
    submitting=true;setFeedback('Sending your royal reply...');
    const receipt = Array.from(crypto.getRandomValues(new Uint8Array(16)), x=>x.toString(16).padStart(2,'0')).join('');
    try {
      const data=new URLSearchParams({id:token,receipt,attendance,adults});
      // Send a simple form POST without a CORS preflight. Verify the saved receipt with read-only JSONP.
      await fetch(config.appsScriptUrl,{method:'POST',mode:'no-cors',body:data,headers:{'Content-Type':'application/x-www-form-urlencoded'}});
      let done=false;
      for(let retry=0;retry<6;retry++) {
        await new Promise(r=>setTimeout(r,900+retry*450));
        const response=await jsonp({action:'receipt',id:token,receipt});
        if(response.saved){done=true;break;}
        if(response.error)throw new Error(response.error);
      }
      if(!done) throw new Error('Could not verify the saved response. Please check with the host before resubmitting.');
      setFeedback('');
      $('#thankBody').textContent=attendance==='No'?'Thank you for letting us know.':'Thank you! Your response has been recorded.';
      $('#confirmation').hidden=false;
    }catch(err){setFeedback(err.message || 'RSVP could not be saved. Please try again.');}
    finally{submitting=false;}
  });
  $('#closeConfirmation').addEventListener('click',()=>{$('#confirmation').hidden=true;});
})();
