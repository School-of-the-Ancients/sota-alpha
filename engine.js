
/* -------------------- CONFIG -------------------- */
const AI_ENDPOINT = 'https://sota-12glq4u1k-thetophams-projects.vercel.app/api/lesson/next'; // set after API deploy

/* -------------------- STATIC LESSONS (fallback) -------------------- */
const LESSONS = {
  socrates: {
    title: "Socrates — What is courage?",
    nodes: {
      start: { line: "If courage means ‘no fear,’ fools are bravest. If ‘always fear,’ none are brave. Which sounds right to you?",
        choices: [
          { text: "A) No fear", next: "noFear" },
          { text: "B) Always fear", next: "alwaysFear" },
          { text: "C) Act despite fear", next: "despite" }
        ]
      },
      noFear:   { line: "Then the reckless drunk charging a cliff is our hero? Perhaps courage needs judgment.", next: "ending" },
      alwaysFear:{ line: "If we all fear always, who advances? Maybe courage is our relation to the good.", next: "ending" },
      despite:  { line: "Closer. But ‘despite’ what, and for whose good? Add judgment to action.", next: "ending" },
      ending: {
        takeaway: "Courage = knowing fear + judging the good + acting anyway.",
        sources: [
          "Plato, Laches 190e–194e",
          "Aristotle, Nicomachean Ethics III"
        ],
        quiz: [
          { q: "Which element is essential here?", opts: ["Fearlessness", "Judgment of the good", "Constant fear"], correct: 1 },
          { q: "‘No fear’ most risks…", opts: ["Cowardice", "Rashness", "Indecision"], correct: 1 }
        ]
      }
    }
  },
  einstein: {
    title: "Einstein — Why E=mc² matters",
    nodes: {
      start: { line: "If mass can become energy, what follows?",
        choices: [
          { text: "A) Tiny mass holds huge energy", next: "aLot" },
          { text: "B) Only light has energy", next: "onlyLight" },
          { text: "C) Mass and energy are unrelated", next: "unrelated" }
        ]
      },
      aLot:      { line: "Yes. c² is enormous—tiny mass → vast energy. Stars (and reactors) run on this.", next: "ending" },
      onlyLight: { line: "Light has energy, but E=mc² says matter itself embodies energy.", next: "ending" },
      unrelated: { line: "Relativity unites them: mass is ‘condensed’ energy; they convert under conditions.", next: "ending" },
      ending: {
        takeaway: "Mass–energy equivalence: matter stores energy (E=mc²). That’s why stars shine.",
        sources: [
          "Einstein (1905) mass–energy paper",
          "Einstein & Infeld (1938) The Evolution of Physics"
        ],
        quiz: [
          { q: "Why can tiny mass release huge energy?", opts: ["c² is large", "Mass is small", "Light is fast"], correct: 0 },
          { q: "E=mc² unites…", opts: ["Force & time", "Mass & energy", "Charge & spin"], correct: 1 }
        ]
      }
    }
  },
  cleopatra: {
    title: "Cleopatra — Leverage beats force",
    nodes: {
      start: { line: "You face a stronger rival. Which lever first?",
        choices: [
          { text: "A) Information", next: "info" },
          { text: "B) Loyalty", next: "loyalty" },
          { text: "C) Spectacle", next: "spectacle" }
        ]
      },
      info:      { line: "Intelligence turns strength predictable. With timing, you trade weakness for leverage.", next: "ending" },
      loyalty:   { line: "Alliances outlast armies. Bind interests to borrow power you don’t own.", next: "ending" },
      spectacle: { line: "Display reframes negotiation—when paired with substance.", next: "ending" },
      ending: {
        takeaway: "Power is negotiated: combine information, alliances, and timing to bend outcomes.",
        sources: [
          "Plutarch, Life of Antony",
          "Cassius Dio, Roman History"
        ],
        quiz: [
          { q: "Most durable lever?", opts: ["Spectacle", "Alliances/loyalty", "Secrecy"], correct: 1 },
          { q: "Info without timing is…", opts: ["Noise", "Force", "Charm"], correct: 0 }
        ]
      }
    }
  },
  davinci: {
    title: "Leonardo — What is perspective?",
    nodes: {
      start: { line: "A flat painting can feel deep. What trick makes walls become windows?",
        choices: [
          { text: "A) Linear perspective", next: "linear" },
          { text: "B) Random shading", next: "random" },
          { text: "C) Bigger skies", next: "skies" }
        ]
      },
      linear: { line: "Parallel lines meet at a vanishing point; scale shrinks with distance. Space appears.", next: "ending" },
      random: { line: "Shading helps, but without geometry the illusion collapses.", next: "ending" },
      skies:  { line: "Composition matters, but depth needs structure—lines, scale, atmosphere.", next: "ending" },
      ending: {
        takeaway: "Perspective = geometry + light: vanishing points, scaling, and aerial falloff create depth.",
        sources: [
          "Leonardo, Treatise on Painting",
          "Alberti (1435), De pictura"
        ],
        quiz: [
          { q: "Defines linear perspective?", opts: ["Random shadows", "Vanishing point geometry", "Wide canvases"], correct: 1 },
          { q: "Distant objects appear…", opts: ["Larger & sharper", "Smaller & hazier", "Same size"], correct: 1 }
        ]
      }
    }
  }
};

/* -------------------- ENGINES -------------------- */
class StaticScriptEngine {
  constructor(script) { this.script = script; }
  async next(req) {
    const state = req.state || { personaId: req.personaId, history: [] };
    const nodes = this.script.nodes;
    let nodeId = !state.history.length ? 'start' : req.userChoiceId ? req.userChoiceId : 'ending';
    // If choice text equals next id, map via nodes
    if (nodes[nodeId]) {
      // ok
    } else {
      // find the next by last node mapping
      const last = state.history[state.history.length - 1];
      if (last && nodes[last.nodeId] && nodes[last.nodeId].choices) {
        const choice = nodes[last.nodeId].choices.find(c => c.text === req.userChoiceText);
        nodeId = (choice && choice.next) || 'ending';
      } else {
        nodeId = 'ending';
      }
    }
    const node = nodes[nodeId] || nodes['ending'];
    state.history.push({ nodeId, choiceId: req.userChoiceText || null });
    return { node, state };
  }
}

class OpenAICharacterEngine {
  constructor(endpoint) { this.endpoint = endpoint; }
  async next(req) {
    const r = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(req)
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
}

/* -------------------- UI RUNTIME -------------------- */
const el = id => document.getElementById(id);
const picker = el('lessonPicker');
const enginePicker = el('enginePicker');
const startBtn = el('startBtn');
const replayBtn = el('replayBtn');
const scene = el('scene');
const line = el('line');
const choices = el('choices');
const takeaway = el('takeaway');
const sources = el('sources');
const quiz = el('quiz');
const cta = el('cta');
const email = el('email');
const copyBtn = el('copyResults');
const copied = el('copied');

let curKey = 'socrates';
let curEngineMode = 'script';
let engine = null;
let state = undefined;
let transcript = [], answers = [], score = 0;

function tts(text){
  try { const u = new SpeechSynthesisUtterance(text); u.rate=1.02; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e){}
}

function renderNode(node){
  choices.innerHTML = ''; takeaway.innerHTML=''; sources.innerHTML=''; quiz.innerHTML=''; cta.style.display='none';

  if (node.line){
    line.textContent = node.line;
    tts(node.line); transcript.push('> ' + node.line);
    replayBtn.disabled = false;
  } else {
    line.textContent = ''; replayBtn.disabled = true;
  }

  if (node.choices){
    node.choices.forEach(ch=>{
      const b = document.createElement('button');
      b.textContent = ch.text;
      b.onclick = ()=> advance(ch.id || ch.text, ch.text);
      choices.appendChild(b);
    });
  } else if (node.nextId){
    setTimeout(()=>advance(node.nextId), 600);
  } else if (node.takeaway){
    line.textContent = 'Takeaway';
    tts(node.takeaway);
    takeaway.innerHTML = `<div class="pill">Takeaway</div><div class="mt8">${node.takeaway}</div>`;
    sources.innerHTML = `<div class="pill">Sources</div><ul class="mt8">` +
      (node.sources||[]).map(s=>`<li class="small">${s}</li>`).join('') + `</ul>`;

    score = 0;
    quiz.innerHTML = `<div class="pill">Quick check (2)</div>`;
    (node.quiz||[]).forEach((q,i)=>{
      const wrap = document.createElement('div'); wrap.className='mt12';
      wrap.innerHTML = `<div>${i+1}. ${q.q}</div>`;
      q.opts.forEach((opt,idx)=>{
        const btn = document.createElement('button'); btn.className='secondary mt8'; btn.textContent = opt;
        btn.onclick = ()=>{
          btn.disabled = true;
          if(idx === q.correct){ score++; btn.style.borderColor='#2b67f6'; btn.style.color='#cfe0ff'; }
          else { btn.style.opacity='.7'; }
        };
        wrap.appendChild(document.createElement('br'));
        wrap.appendChild(btn);
      });
      quiz.appendChild(wrap);
    });

    cta.style.display = 'block';
  }
}

async function advance(userChoiceId=null, userChoiceText=null){
  const goal = (curKey==='socrates') ? 'define courage via contrasts'
             : (curKey==='einstein') ? 'explain mass-energy equivalence'
             : (curKey==='cleopatra') ? 'show leverage vs force'
             : 'explain linear & aerial perspective';

  const req = { personaId: curKey, goal, state, userChoiceId, userChoiceText };
  try{
    const engineImpl = (curEngineMode==='ai' && AI_ENDPOINT.startsWith('http')) ?
      new OpenAICharacterEngine(AI_ENDPOINT) :
      new StaticScriptEngine(LESSONS[curKey]);

    const resp = await engineImpl.next(req);
    state = resp.state;
    scene.textContent = LESSONS[curKey].title;
    renderNode(resp.node);
    if (userChoiceText){ answers.push(userChoiceText); transcript.push(userChoiceText); }
  }catch(e){
    // fallback to static on error
    const resp = await new StaticScriptEngine(LESSONS[curKey]).next(req);
    state = resp.state;
    scene.textContent = LESSONS[curKey].title + ' (script fallback)';
    renderNode(resp.node);
  }
}

replayBtn.onclick = ()=> {
  const last = transcript.slice().reverse().find(t => t.startsWith('> '));
  if (last) tts(last.slice(2));
};

startBtn.onclick = ()=>{
  curKey = picker.value;
  curEngineMode = enginePicker.value;
  state = undefined; transcript=[]; answers=[]; score=0;
  advance(null, null);
};

copyBtn.onclick = ()=>{
  const payload = [
    `Figure: ${LESSONS[curKey].title}`,
    `Engine: ${enginePicker.value}`,
    `Choices: ${answers.join(' | ') || '(none)'}`,
    `Score: ${score} / 2`,
    `Email: ${email.value || '(none)'}`,
    `Transcript:\n${transcript.join('\n')}`
  ].join('\n');
  navigator.clipboard.writeText(payload).then(()=>{
    copied.style.display='block'; setTimeout(()=> copied.style.display='none', 1500);
  });
};
