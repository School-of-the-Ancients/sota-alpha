const API_BASE = 'https://sota-vert.vercel.app';  // stable Vercel host
const CHAT_ENDPOINT = `${API_BASE}/api/chat`;

const chatWho   = document.getElementById('chatWho');
const chatLog   = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendChat  = document.getElementById('sendChat');
const newChat   = document.getElementById('newChat');

let chatHistory = [];

function personaName(id){
  const option = Array.from(chatWho.options).find(opt => opt.value === id);
  return option ? option.text : 'the selected figure';
}

function addMsg(text, me=false){
  const d = document.createElement('div');
  d.className = 'msg ' + (me ? 'me' : 'them');
  d.textContent = text;
  chatLog.appendChild(d);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function resetChat(id = chatWho.value){
  chatHistory = [];
  chatLog.innerHTML = '';
  const name = personaName(id);
  addMsg(`You are now speaking with ${name}. Expect probing questions before answers.`);
}

async function sendChatMsg(){
  const q = (chatInput.value || '').trim();
  if(!q) return;
  chatInput.value = '';
  addMsg(q, true);

  try{
    const r = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ personaId: chatWho.value, history: chatHistory, user: q })
    });
    const j = await r.json();
    chatHistory = j.history || chatHistory;
    addMsg(j.reply || '[no reply]');
  }catch(err){
    addMsg('[error contacting server]');
  }
}

sendChat.onclick = sendChatMsg;
chatInput.onkeydown = e => { if(e.key === 'Enter') sendChatMsg(); };
newChat.onclick = () => resetChat();
chatWho.onchange = () => resetChat(chatWho.value);

document.querySelectorAll('.cardBtn').forEach(btn => {
  btn.onclick = () => {
    const id = btn.dataset.id;
    chatWho.value = id;
    resetChat(id);
  };
});

// default
resetChat();
