/* Alea's 4th birthday — 28 Nov 2026
   This script is meant to be bound to the provided Google Spreadsheet.
   It reads Guest column A (child names only), and writes RSVP columns A–D.
   It creates invitation tokens in Guest C and links in Guest D when you run setupGuestLinks().
*/
const SHEET_ID = '1_Xtz7juN6lhf5G8JcHwm5EfpZIFi98Eye-BnobW5Sck';
const GUEST_TAB='Guest';
const RSVP_TAB='RSVP';
// UPDATE after publishing your GitHub Pages website:
const WEBSITE_URL='https://YOUR-USERNAME.github.io/alea-birthday/';

function setupGuestLinks() {
  if (WEBSITE_URL.includes('YOUR-USERNAME')) throw new Error('Set WEBSITE_URL first.');
  const sh=SpreadsheetApp.openById(SHEET_ID).getSheetByName(GUEST_TAB);
  const last=sh.getLastRow();
  sh.getRange('C1:D1').setValues([['Invitation ID','Personalized Link']]);
  if(last<2)return;
  const names=sh.getRange(2,1,last-1,1).getValues();
  const ids=sh.getRange(2,3,last-1,1).getValues();
  const result=names.map((r,i)=>{
    if(!r[0])return ['', ''];
    const id=String(ids[i][0]||Utilities.getUuid().replace(/-/g,'')).trim();
    return [id,WEBSITE_URL+'?id='+encodeURIComponent(id)];
  });
  sh.getRange(2,3,result.length,2).setValues(result);
}

function doGet(e){
  const p=e.parameter||{};
  const cb=String(p.callback||'');
  if(!/^alea_cb_[a-z0-9]+$/.test(cb))return ContentService.createTextOutput('Invalid callback');
  try {
    let payload={ok:false};
    const id=String(p.id||'');
    const record=guestByToken_(id);
    if(p.action==='guest') payload=record?{ok:true,name:record.name}:{ok:false};
    else if(p.action==='receipt') {
      const receipt=String(p.receipt||'');
      const saved=!!record && /^[a-f0-9]{32}$/.test(receipt) && PropertiesService.getScriptProperties().getProperty('receipt_'+receipt)===id;
      payload={ok:true,saved};
    }
    return ContentService.createTextOutput(cb+'('+JSON.stringify(payload)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  } catch(error){return ContentService.createTextOutput(cb+'('+JSON.stringify({ok:false,error:'Service unavailable'})+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}
}

function doPost(e){
  const p=e.parameter||{};
  const lock=LockService.getScriptLock();
  try{
    lock.waitLock(12000);
    const id=String(p.id||'').trim();
    const receipt=String(p.receipt||'').trim();
    const attendance=String(p.attendance||'').trim();
    let adults=String(p.adults||'').trim();
    if(!/^[a-f0-9]{32}$/.test(receipt))throw new Error('Invalid receipt');
    if(!['Yes','No','Maybe'].includes(attendance))throw new Error('Invalid RSVP');
    if(attendance==='No') adults='0';
    if(!['0','1','2'].includes(adults) || (attendance!=='No'&&adults==='0'))throw new Error('Invalid adults count');
    const person=guestByToken_(id);
    if(!person)throw new Error('Unknown invitation');
    const ss=SpreadsheetApp.openById(SHEET_ID);
    const sheet=ss.getSheetByName(RSVP_TAB);
    if(!sheet)throw new Error('RSVP sheet not found');
    const rowCount=sheet.getLastRow();
    const entries=rowCount>1?sheet.getRange(2,1,rowCount-1,1).getValues():[];
    let target=rowCount+1;
    for(let n=0;n<entries.length;n++)if(String(entries[n][0]).trim()===person.name){target=n+2;break;}
    sheet.getRange(target,1,1,4).setValues([[person.name,attendance,Number(adults),new Date()]]);
    PropertiesService.getScriptProperties().setProperty('receipt_'+receipt,id);
    return json_({ok:true});
  }catch(error){return json_({ok:false,error:String(error.message)});}
  finally{if(lock.hasLock())lock.releaseLock();}
}

function guestByToken_(id){
  if(!/^[a-f0-9]{32}$/.test(id))return null;
  const sh=SpreadsheetApp.openById(SHEET_ID).getSheetByName(GUEST_TAB);
  const last=sh.getLastRow();if(last<2)return null;
  const rows=sh.getRange(2,1,last-1,3).getValues();
  for(let i=0;i<rows.length;i++)if(String(rows[i][2]).trim()===id&&rows[i][0])return {name:String(rows[i][0]).trim()};
  return null;
}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
