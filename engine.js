const API_BASE = 'https://sota-vert.vercel.app';  // stable Vercel host
const CHAT_ENDPOINT = `${API_BASE}/api/chat`;

const chatWho   = document.getElementById('chatWho');
const chatLog   = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendChat  = document.getElementById('sendChat');
const newChat   = document.getElementById('newChat');
const personaPrompts = document.getElementById('personaPrompts');

let chatHistory = [];

const PERSONA_DETAILS = {
  einstein: {
    prompts: [
      'What is the theory of relativity?',
      'How did you come up with E=mc²?',
      'What are your thoughts on the future of science?'
    ]
  },
  galileo: {
    prompts: [
      'Tell me about your discoveries with the telescope.',
      'How did you prove that the Earth revolves around the Sun?',
      'What are your thoughts on the relationship between science and religion?'
    ]
  },
  davinci: {
    prompts: [
      'What inspired your most famous paintings?',
      'How did you become so skilled in so many different areas?',
      'What are your thoughts on the nature of creativity?'
    ]
  },
  adalovelace: {
    prompts: [
      "What were your contributions to Charles Babbage's Analytical Engine?",
      'How did you envision the future of computing?',
      'What is your opinion on the relationship between mathematics and creativity?'
    ]
  },
  cleopatra: {
    prompts: [
      'What were the major challenges you faced as ruler of Egypt?',
      'How did you navigate the political landscape of the Roman Republic?',
      'What is your legacy as a female ruler in the ancient world?'
    ]
  }
};

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
  renderPersonaPrompts(id);
}

function renderPersonaPrompts(id){
  if(!personaPrompts) return;
  personaPrompts.innerHTML = '';
  const persona = PERSONA_DETAILS[id];
  const prompts = persona && Array.isArray(persona.prompts) ? persona.prompts : [];
  if(!prompts.length){
    personaPrompts.style.display = 'none';
    return;
  }

  personaPrompts.style.display = '';

  const label = document.createElement('div');
  label.className = 'dim small';
  label.textContent = 'Suggested prompts';
  personaPrompts.appendChild(label);

  const list = document.createElement('div');
  list.className = 'promptOptions';

  prompts.forEach(prompt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'promptOption';
    btn.textContent = prompt;
    btn.onclick = () => sendChatMsg(prompt);
    list.appendChild(btn);
  });

  personaPrompts.appendChild(list);
}

async function sendChatMsg(preset){
  const sourceText = typeof preset === 'string' ? preset : (chatInput.value || '');
  const q = sourceText.trim();
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
