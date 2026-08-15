// ---------- DOM Elements ----------
const landing = document.getElementById('landing');
const chatView = document.getElementById('chatView');
const messages = document.getElementById('messages');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const stopBtn = document.getElementById('stopBtn');
const classSelect = document.getElementById('classSelect');
const topbarClass = document.getElementById('topbarClass');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const menuBtn = document.getElementById('menuBtn');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
const themeToggle = document.getElementById('themeToggle');
const settingsOverlay = document.getElementById('settingsOverlay');

let currentAbortController = null;
let isDark = false;
let attachedImageBase64 = null;
const CHATS_KEY = 'sohopathi_chats';
let currentChatId = null;

// ---------- Custom Modal for Confirm ----------
function showConfirmModal(message, onConfirm, onCancel) {
  const overlay = document.createElement('div');
  overlay.className = 'custom-modal-overlay';
  overlay.innerHTML = `
    <div class="custom-modal">
      <div class="custom-modal-icon">⚠️</div>
      <div class="custom-modal-message">${message}</div>
      <div class="custom-modal-actions">
        <button class="custom-modal-btn cancel" id="modalCancel">বাতিল</button>
        <button class="custom-modal-btn confirm" id="modalConfirm">নিশ্চিত</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const confirmBtn = overlay.querySelector('#modalConfirm');
  const cancelBtn = overlay.querySelector('#modalCancel');

  confirmBtn.addEventListener('click', () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  });

  cancelBtn.addEventListener('click', () => {
    overlay.remove();
    if (onCancel) onCancel();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (onCancel) onCancel();
    }
  });
}

// Expose showLanding globally for onclick in HTML
window.showLanding = function() {
  showLanding();
};

// ---------- Sidebar Toggle (Mobile only) ----------
function toggleSidebar() {
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
  }
}

function closeSidebar() {
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
  }
}

// Close sidebar when clicking outside (mobile only)
sidebarOverlay.addEventListener('click', closeSidebar);

// Close sidebar with Escape key (mobile only)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && window.innerWidth <= 768 && sidebar.classList.contains('open')) {
    closeSidebar();
  }
});

menuBtn.addEventListener('click', toggleSidebar);
sidebarCloseBtn.addEventListener('click', closeSidebar);

// ---------- Theme Toggle ----------
const savedTheme = localStorage.getItem('sohopathi_theme');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  themeToggle.classList.add('active');
  isDark = true;
}

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  themeToggle.classList.toggle('active');
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('sohopathi_theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('sohopathi_theme', 'light');
  }
});

// ---------- Image attachment ----------
const attachBtn = document.getElementById('attachBtn');
const imageInput = document.getElementById('imageInput');
const imagePreviewRow = document.getElementById('imagePreviewRow');
const imagePreviewThumb = document.getElementById('imagePreviewThumb');
const removeImageBtn = document.getElementById('removeImageBtn');

attachBtn.addEventListener('click', ()=> imageInput.click());

imageInput.addEventListener('change', ()=>{
  const file = imageInput.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    attachedImageBase64 = reader.result;
    imagePreviewThumb.src = attachedImageBase64;
    imagePreviewRow.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

removeImageBtn.addEventListener('click', ()=>{
  attachedImageBase64 = null;
  imageInput.value = '';
  imagePreviewRow.style.display = 'none';
});

classSelect.addEventListener('change', ()=>{
  topbarClass.textContent = classSelect.value;
});

// ---------- Local chat history ----------
function loadChats(){
  try{ return JSON.parse(localStorage.getItem(CHATS_KEY)) || []; }
  catch(e){ return []; }
}
function saveChats(chats){
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}
function renderHistoryList(){
  const chats = loadChats().sort((a,b)=> b.updatedAt - a.updatedAt);
  const historyList = document.getElementById('historyList');
  const emptyMsg = document.getElementById('historyEmpty');
  historyList.querySelectorAll('.history-item').forEach(el=>el.remove());
  if(chats.length === 0){
    if(emptyMsg) emptyMsg.style.display='block';
    return;
  }
  if(emptyMsg) emptyMsg.style.display='none';
  chats.forEach(chat=>{
    const item = document.createElement('div');
    item.className='history-item';
    item.textContent = chat.title;
    item.addEventListener('click', ()=> {
      loadChat(chat.id);
      closeSidebar();
    });
    historyList.appendChild(item);
  });
}
function createNewChat(firstQuestion){
  const chats = loadChats();
  const id = 'chat_' + Date.now();
  chats.push({
    id,
    title: firstQuestion.slice(0, 40),
    updatedAt: Date.now(),
    messages: []
  });
  saveChats(chats);
  currentChatId = id;
  renderHistoryList();
  return id;
}
function appendToChat(role, text){
  if(!currentChatId) return;
  const chats = loadChats();
  const chat = chats.find(c => c.id === currentChatId);
  if(!chat) return;
  chat.messages.push({ role, text });
  chat.updatedAt = Date.now();
  saveChats(chats);
  renderHistoryList();
}
function loadChat(id){
  const chats = loadChats();
  const chat = chats.find(c => c.id === id);
  if(!chat) return;
  currentChatId = id;
  landing.style.display='none';
  chatView.classList.add('active');
  messages.innerHTML='';
  chat.messages.forEach(m=>{
    if(m.role === 'user') addUserMessage(m.text);
    else {
      const wrap = document.createElement('div');
      wrap.className='msg-ai';
      wrap.innerHTML = `<div class="msg-ai-inner"><div class="ai-avatar">স</div><div class="ai-content"></div></div>`;
      messages.appendChild(wrap);
      const target = wrap.querySelector('.ai-content');
      streamContent(target, markdownToBlocks(m.text), () => addMessageFooter(wrap, target));
    }
  });
  messages.scrollTop = messages.scrollHeight;
}

// ---------- Settings / storage panel ----------
// Settings button - opens settings overlay (both desktop and mobile)
document.getElementById('settingsBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  e.preventDefault();
  
  const chats = loadChats();
  document.getElementById('statChatCount').textContent = chats.length;
  const bytes = new Blob([JSON.stringify(chats)]).size;
  document.getElementById('statStorageSize').textContent = (bytes/1024).toFixed(1) + ' KB';
  settingsOverlay.classList.add('open');
  closeSidebar();
});

// Handle any other settings buttons
document.querySelectorAll('.settings-btn').forEach(function(btn) {
  if (btn.id === 'settingsBtn') return;
  
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    
    const chats = loadChats();
    document.getElementById('statChatCount').textContent = chats.length;
    const bytes = new Blob([JSON.stringify(chats)]).size;
    document.getElementById('statStorageSize').textContent = (bytes/1024).toFixed(1) + ' KB';
    settingsOverlay.classList.add('open');
    closeSidebar();
  });
});

document.getElementById('settingsClose').addEventListener('click', function() {
  settingsOverlay.classList.remove('open');
});

settingsOverlay.addEventListener('click', function(e) {
  if (e.target === settingsOverlay) {
    settingsOverlay.classList.remove('open');
  }
});

// Clear data with custom modal
document.getElementById('clearDataBtn').addEventListener('click', function() {
  showConfirmModal(
    'তুমি কি নিশ্চিত? সব সংরক্ষিত চ্যাট মুছে যাবে, এটি ফিরিয়ে আনা যাবে না।',
    function() {
      localStorage.removeItem(CHATS_KEY);
      currentChatId = null;
      renderHistoryList();
      settingsOverlay.classList.remove('open');
      showLanding();
    }
  );
});
renderHistoryList();

// ---------- Core Functions ----------
function showLanding(){
  landing.style.display='flex';
  chatView.classList.remove('active');
  messages.innerHTML='';
  input.value='';
  currentChatId = null;
  stopBtn.classList.remove('show');
  closeSidebar();
}

function autoGrow(){
  input.style.height='auto';
  input.style.height = Math.min(input.scrollHeight, 120)+'px';
}
input.addEventListener('input', autoGrow);
input.addEventListener('keydown', (e)=>{
  if(e.key==='Enter' && !e.shiftKey){
    e.preventDefault();
    handleSend();
  }
});
sendBtn.addEventListener('click', handleSend);

stopBtn.addEventListener('click', ()=>{
  if(currentAbortController){
    currentAbortController.abort();
    currentAbortController = null;
    stopBtn.classList.remove('show');
    sendBtn.disabled = false;
    removeLoadingMessage();
    addAiMessageStreaming([{type:'p', text: '⏹️ উত্তর তৈরি করা থামানো হয়েছে।'}]);
  }
});

function addUserMessage(text, imageDataUrl){
  const div = document.createElement('div');
  div.className='msg-user';
  const bubble = document.createElement('div');
  bubble.className='bubble';
  if(imageDataUrl){
    const img = document.createElement('img');
    img.src = imageDataUrl;
    img.className = 'attached-image';
    bubble.appendChild(img);
  }
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  bubble.appendChild(textSpan);
  div.appendChild(bubble);
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function addAiMessageStreaming(htmlBlocks){
  const wrap = document.createElement('div');
  wrap.className='msg-ai';
  wrap.innerHTML = `
    <div class="msg-ai-inner">
      <div class="ai-avatar">স</div>
      <div class="ai-content" id="stream-target"></div>
    </div>`;
  messages.appendChild(wrap);
  const target = wrap.querySelector('#stream-target');
  target.removeAttribute('id');
  messages.scrollTop = messages.scrollHeight;
  streamContent(target, htmlBlocks, () => addMessageFooter(wrap, target));
}

function addMessageFooter(wrapEl, contentEl){
  const footer = document.createElement('div');
  footer.className='msg-footer';
  footer.innerHTML = `
    <button class="copy-btn" type="button">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      কপি
    </button>
    <span>এইমাত্র</span>
  `;
  wrapEl.querySelector('.msg-ai-inner').appendChild(footer);
  const copyBtn = footer.querySelector('.copy-btn');
  copyBtn.addEventListener('click', ()=>{
    navigator.clipboard.writeText(contentEl.innerText).then(()=>{
      const original = copyBtn.innerHTML;
      copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> কপি হয়েছে`;
      setTimeout(()=>{ copyBtn.innerHTML = original; }, 1600);
    });
  });
}

function streamContent(target, blocks, onComplete){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let blockIndex = 0;
  let charIndex = 0;
  const cursor = document.createElement('span');
  cursor.className='cursor';

  function renderBlockShell(block){
    let el;
    if(block.type==='h3'){ el=document.createElement('h3'); }
    else if(block.type==='summary'){ el=document.createElement('div'); el.className='summary-box'; }
    else if(block.type==='practice'){
      el=document.createElement('div'); el.className='practice-box';
      const label=document.createElement('div'); label.className='practice-label'; label.textContent='অনুশীলন প্রশ্ন';
      el.appendChild(label);
      const body=document.createElement('div'); el.appendChild(body);
      target.appendChild(el);
      return body;
    }
    else if(block.type==='ul'){ el=document.createElement('ul'); }
    else if(block.type==='formula'){ el=document.createElement('div'); el.className='formula-box'; }
    else if(block.type==='varlist'){ el=document.createElement('ul'); el.className='var-list'; }
    else if(block.type==='example'){
      el=document.createElement('div'); el.className='example-box';
      const label=document.createElement('div'); label.className='example-label'; label.textContent='উদাহরণ';
      el.appendChild(label);
      const body=document.createElement('div'); el.appendChild(body);
      target.appendChild(el);
      return body;
    }
    else { el=document.createElement('p'); }
    target.appendChild(el);
    return el;
  }

  if(reduceMotion){
    blocks.forEach(b=>{
      if(b.type==='ul' || b.type==='varlist'){
        const ul=renderBlockShell(b);
        b.items.forEach(it=>{
          const li=document.createElement('li');
          if(b.type==='varlist'){
            li.innerHTML = `<span class="var-sym">${it.sym}</span><span>${it.desc}</span>`;
          } else { li.innerHTML=it; }
          ul.appendChild(li);
        });
      } else {
        const el=renderBlockShell(b);
        el.innerHTML=b.text;
      }
    });
    if(onComplete) onComplete();
    return;
  }

  let currentEl = null;
  let currentLis = [];
  let liIdx = 0;

  function tick(){
    if(blockIndex >= blocks.length){
      if(currentEl && currentEl.contains(cursor)) cursor.remove();
      if(onComplete) onComplete();
      return;
    }
    const block = blocks[blockIndex];

    if(block.type==='ul' || block.type==='varlist'){
      if(!currentEl){ currentEl = renderBlockShell(block); liIdx=0; charIndex=0; }
      if(liIdx >= block.items.length){ blockIndex++; currentEl=null; requestAnimationFrame(tick); return; }
      let li = currentEl.children[liIdx];
      if(!li){ li=document.createElement('li'); currentEl.appendChild(li); li.appendChild(cursor); }
      const full = block.type==='varlist'
        ? `<span class="var-sym">${block.items[liIdx].sym}</span><span>${block.items[liIdx].desc}</span>`
        : block.items[liIdx];
      const plain = full.replace(/<[^>]+>/g,'');
      if(charIndex <= plain.length){
        li.textContent = plain.slice(0, charIndex);
        li.appendChild(cursor);
        charIndex++;
        messages.scrollTop = messages.scrollHeight;
        setTimeout(()=>requestAnimationFrame(tick), 10);
      } else {
        li.innerHTML = full;
        liIdx++; charIndex=0;
        requestAnimationFrame(tick);
      }
      return;
    }

    if(!currentEl){ currentEl = renderBlockShell(block); currentEl.appendChild(cursor); charIndex=0; }
    const plain = block.text.replace(/<[^>]+>/g,'');
    if(charIndex <= plain.length){
      currentEl.textContent = plain.slice(0, charIndex);
      currentEl.appendChild(cursor);
      charIndex++;
      messages.scrollTop = messages.scrollHeight;
      setTimeout(()=>requestAnimationFrame(tick), 10);
    } else {
      currentEl.innerHTML = block.text;
      blockIndex++; currentEl=null;
      requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(tick);
}

function removeEmojis(text) {
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
             .replace(/[\u{2600}-\u{26FF}]/gu, '')
             .replace(/[\u{2700}-\u{27BF}]/gu, '')
             .replace(/[📌⚗️🔑📍🌟📝✅❌⭐🔹🔸]/g, '')
             .trim();
}

function formatMath(text) {
  text = text.replace(/H2O/g, 'H₂O')
             .replace(/CO2/g, 'CO₂')
             .replace(/O2/g, 'O₂')
             .replace(/C6H12O6/g, 'C₆H₁₂O₆')
             .replace(/([A-Za-z])(\d+)/g, (match, letter, num) => {
               const subscripts = {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
               const sub = num.split('').map(d => subscripts[d] || d).join('');
               return letter + sub;
             });
  
  text = text.replace(/\\xrightarrow\[[^\]]*\]\{[^}]*\}/g, '→')
             .replace(/\\xrightarrow\{[^}]*\}/g, '→')
             .replace(/\\rightarrow/g, '→')
             .replace(/\\\[/g, '')
             .replace(/\\\]/g, '')
             .replace(/\\text\{([^}]*)\}/g, '$1');
  
  return text;
}

function markdownToBlocks(markdown){
  const blocks = [];

  let cleanMarkdown = removeEmojis(markdown);
  cleanMarkdown = formatMath(cleanMarkdown);

  const lines = cleanMarkdown.split('\n');
  let listBuffer = [];

  function flushList(){
    if(listBuffer.length){
      blocks.push({type:'ul', items: listBuffer});
      listBuffer = [];
    }
  }
  function inline(text){
    return text
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\\\[|\\\]/g, '')
      .replace(/\\text\{(.+?)\}/g, '$1');
  }

  let paragraphBuffer = [];
  function flushParagraph(){
    if(paragraphBuffer.length){
      let text = inline(paragraphBuffer.join(' ').trim());
      if(text) blocks.push({type:'p', text});
      paragraphBuffer = [];
    }
  }

  for(const rawLine of lines){
    const line = rawLine.trim();
    if(line === ''){ flushParagraph(); flushList(); continue; }
    if(/^#+/.test(line)){
      flushParagraph(); flushList();
      const headingText = line.replace(/^#+\s*/, '').trim();
      blocks.push({type:'h3', text: inline(headingText)});
      continue;
    }
    if(/^[-*•]\s+/.test(line) || /^\d+[\.\)]\s+/.test(line)){
      flushParagraph();
      listBuffer.push(inline(line.replace(/^[-*•]\s+/, '').replace(/^\d+[\.\)]\s+/, '')));
      continue;
    }
    if(line === '---'){ flushParagraph(); flushList(); continue; }
    paragraphBuffer.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

const WORKER_URL = 'https://sohopathi-worker.diablostore.workers.dev';

async function askBackend(question, studentClass, imageDataUrl, signal){
  let history = [];
  if(currentChatId){
    const chats = loadChats();
    const chat = chats.find(c => c.id === currentChatId);
    if(chat){
      history = chat.messages.slice(-10);
    }
  }
  
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ 
      question, 
      studentClass, 
      image: imageDataUrl || null,
      history: history
    }),
    signal: signal
  });
  if(!res.ok){
    throw new Error('Server error: ' + res.status);
  }
  const data = await res.json();
  return data.answer;
}

function addLoadingMessage(){
  const wrap = document.createElement('div');
  wrap.className='msg-ai';
  wrap.id='loading-msg';
  wrap.innerHTML = `
    <div class="msg-ai-inner">
      <div class="ai-avatar">স</div>
      <div class="ai-content loading-text" style="color:var(--ink-soft);display:flex;align-items:center;gap:8px;">
        <span class="stop-indicator"></span> ভাবছি...
      </div>
    </div>`;
  messages.appendChild(wrap);
  messages.scrollTop = messages.scrollHeight;
}
function removeLoadingMessage(){
  const el = document.getElementById('loading-msg');
  if(el) el.remove();
}

function ensureChatVisible(){
  if(!chatView.classList.contains('active')){
    landing.style.display='none';
    chatView.classList.add('active');
  }
}

async function handleSend(){
  const text = input.value.trim();
  const imageToSend = attachedImageBase64;
  if(!text && !imageToSend) return;
  
  if(currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  
  const effectiveText = text || 'এই ছবিতে কী আছে? ব্যাখ্যা করো।';
  const selectedClass = classSelect.value;
  ensureChatVisible();
  if(!currentChatId) createNewChat(effectiveText);
  addUserMessage(effectiveText, imageToSend);
  appendToChat('user', effectiveText);
  input.value='';
  autoGrow();
  attachedImageBase64 = null;
  imageInput.value = '';
  imagePreviewRow.style.display = 'none';
  
  sendBtn.disabled = true;
  stopBtn.classList.add('show');
  
  addLoadingMessage();
  
  currentAbortController = new AbortController();
  
  try{
    const answerText = await askBackend(effectiveText, selectedClass, imageToSend, currentAbortController.signal);
    removeLoadingMessage();
    const blocks = markdownToBlocks(answerText);
    addAiMessageStreaming(blocks);
    appendToChat('ai', answerText);
  } catch(err){
    removeLoadingMessage();
    if(err.name === 'AbortError') {
      return;
    }
    addAiMessageStreaming([{type:'p', text: 'দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করো। (' + err.message + ')'}]);
  } finally {
    sendBtn.disabled = false;
    stopBtn.classList.remove('show');
    currentAbortController = null;
  }
}