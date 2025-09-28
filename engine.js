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
  socrates: {
    name: 'Socrates',
    image: './img/socrates.png',
    description: 'classical Greek philosopher',
    timeframe: '5th century BC',
    expertise: 'ethics and dialectics',
    passion: 'challenging assumptions through inquiry',
    prompts: [
      'What does it mean to lead a virtuous life?',
      'Why is self-knowledge important for wisdom?',
      'How do questions help reveal the truth?'
    ]
  },
  einstein: {
    name: 'Albert Einstein',
    image: './img/einstein.jpg',
    description: 'physicist',
    timeframe: 'early 20th century',
    expertise: 'scientific background',
    passion: 'exploring the mysteries of the universe',
    prompts: [
      'What is the theory of relativity?',
      'How did you come up with E=mc²?',
      'What are your thoughts on the future of science?'
    ]
  },
  galileo: {
    name: 'Galileo Galilei',
    image: './img/galileo.jpg',
    description: 'astronomer and physicist',
    timeframe: '16th and 17th centuries',
    expertise: 'astronomical and scientific knowledge',
    passion: 'understanding the cosmos',
    prompts: [
      'Tell me about your discoveries with the telescope.',
      'How did you prove that the Earth revolves around the Sun?',
      'What are your thoughts on the relationship between science and religion?'
    ]
  },
  davinci: {
    name: 'Leonardo Da Vinci',
    image: './img/davinci.jpg',
    description: 'artist, inventor, and scientist',
    timeframe: '15th and 16th centuries',
    expertise: 'artistic, scientific, and engineering skills',
    passion: 'discovering the secrets of nature',
    prompts: [
      'What inspired your most famous paintings?',
      'How did you become so skilled in so many different areas?',
      'What are your thoughts on the nature of creativity?'
    ]
  },
  adalovelace: {
    name: 'Ada Lovelace',
    image: './img/adalovelace.jpg',
    description: 'mathematician and writer',
    timeframe: '19th century',
    expertise: 'mathematical and computational understanding',
    passion: 'the potential of computing machines',
    prompts: [
      "What were your contributions to Charles Babbage's Analytical Engine?",
      'How did you envision the future of computing?',
      'What is your opinion on the relationship between mathematics and creativity?'
    ]
  },
  cleopatra: {
    name: 'Cleopatra',
    image: './img/cleopatra.jpg',
    description: 'the last active ruler of the Ptolemaic Kingdom of Egypt',
    timeframe: '1st century BC',
    expertise: 'politics, diplomacy, and leadership',
    passion: 'preserving the legacy of Egypt',
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
  const persona = PERSONA_DETAILS[id];
  if(persona){
    const introName = persona.description ? `${persona.name} (${persona.description})` : persona.name;
    addMsg(`You are now speaking with ${introName}.`);
    addMsg('Expect probing questions before answers.');
  }else{
    const name = personaName(id);
    addMsg(`You are now speaking with ${name}. Expect probing questions before answers.`);
  }
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

  personaPrompts.style.display = 'block';

  if(persona){
    const meta = document.createElement('div');
    meta.className = 'promptMeta small';
    const bits = [];
    if(persona.timeframe) bits.push(`Timeframe: ${persona.timeframe}`);
    if(persona.expertise) bits.push(`Expertise: ${persona.expertise}`);
    if(persona.passion) bits.push(`Passion: ${persona.passion}`);
    meta.textContent = bits.join(' • ');
    if(bits.length){
      personaPrompts.appendChild(meta);
    }
  }

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
