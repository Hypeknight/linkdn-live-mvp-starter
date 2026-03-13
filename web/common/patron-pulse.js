(function(){
  const { loadState, saveState, log, sessionId } = window.LinkdNShared;
  function createPoll({ roomId, type, question, options, requiresApproval=true, durationSeconds=60 }) {
    const state = loadState();
    const id = 'poll_'+Math.random().toString(36).slice(2,10);
    const now = Date.now();
    const poll = {
      id, roomId, type, question,
      options: options.map((label,i)=>({ id:'opt_'+(i+1), label, votes:0 })),
      status:'open', requiresApproval,
      approvedOption:null, winnerOption:null,
      createdAt:now, openedAt:now, closesAt:now + durationSeconds*1000,
      votesBySession:{}
    };
    state.patronPulse.polls[id] = poll;
    state.patronPulse.activePollByRoom[roomId] = id;
    log(state, `Patron Pulse poll opened in ${roomId}: ${question}`);
    saveState(state);
    return poll;
  }
  function getActivePoll(roomId){ const state = loadState(); const id = state.patronPulse.activePollByRoom[roomId]; return id ? state.patronPulse.polls[id] : null; }
  function castVote(roomId, optionId){
    const state = loadState();
    const poll = getActivePoll(roomId);
    if (!poll) throw new Error('No active poll for this room.');
    if (poll.status !== 'open') throw new Error('Poll is not open.');
    if (Date.now() > poll.closesAt) { poll.status='closed'; saveState(state); throw new Error('Poll has closed.'); }
    const sid = sessionId();
    if (poll.votesBySession[sid]) throw new Error('This device already voted.');
    const opt = poll.options.find(o=>o.id===optionId);
    if (!opt) throw new Error('Invalid option.');
    opt.votes += 1;
    poll.votesBySession[sid] = optionId;
    state.patronPulse.polls[poll.id] = poll;
    saveState(state);
    return poll;
  }
  function closePoll(roomId){ const state=loadState(); const poll=getActivePoll(roomId); if(!poll) return null; poll.status='closed'; state.patronPulse.polls[poll.id]=poll; log(state,`Patron Pulse poll closed in ${roomId}`); saveState(state); return poll; }
  function approvePollResult(roomId, optionId=null){
    const state=loadState(); const poll=getActivePoll(roomId); if(!poll) return null;
    let winner = optionId ? poll.options.find(o=>o.id===optionId) : [...poll.options].sort((a,b)=>b.votes-a.votes)[0];
    poll.status='approved'; poll.approvedOption=winner?.id||null; poll.winnerOption=winner?.id||null;
    state.patronPulse.polls[poll.id]=poll;
    // execute light integration
    const label = winner?.label;
    if (poll.type === 'next_game' && label) state.eventType = label;
    if (poll.type === 'winner' && label) {
      const venue = state.rooms.flatMap(r=>r.venues).find(v => window.LinkdNShared.venueName(v) === label || v===label.toLowerCase());
      state.winner = venue || state.winner;
    }
    log(state, `Patron Pulse result approved in ${roomId}: ${label || 'No result'}`);
    saveState(state); return poll;
  }
  function clearActivePoll(roomId){ const state=loadState(); delete state.patronPulse.activePollByRoom[roomId]; saveState(state); }
  function voteForCurrentSession(poll){ return poll?.votesBySession?.[sessionId()] || null; }
  window.PatronPulse = { createPoll, getActivePoll, castVote, closePoll, approvePollResult, clearActivePoll, voteForCurrentSession };
})();
