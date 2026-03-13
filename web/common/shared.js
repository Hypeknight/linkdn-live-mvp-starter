(function(){
  const STORAGE_KEY = 'linkdnMockNetworkV7';
  const SESSION_KEY = 'linkdnSessionVenue';
  const VENUES = [
    { id: 'kc', name: 'Kansas City', city: 'Kansas City' },
    { id: 'miami', name: 'Miami', city: 'Miami' },
    { id: 'atlanta', name: 'Atlanta', city: 'Atlanta' },
    { id: 'dallas', name: 'Dallas', city: 'Dallas' },
    { id: 'houston', name: 'Houston', city: 'Houston' },
    { id: 'vegas', name: 'Las Vegas', city: 'Las Vegas' }
  ];

  function makeVenueState(){
    return {
      localControls: { cameraOn:true, micOn:false, djReady:false, localPreviewReady:false, selfMuted:false, selfCut:false },
      networkStatus: { connected:true, mutedByModerator:false, cutByModerator:false, spotlighted:false },
      workflow: { ready:false, acknowledged:false, battleReady:false, votingReady:false, helpRequested:false, issue:'' },
      screen: { selectedSourceVenue:'', allowedVisibleVenues:[] },
      settings: { patronPulseEnabled:true, allowedPollTypes:['next_city','next_game','winner'], allowedCities:['miami','atlanta','dallas'], allowedGames:['DJ Swap','Bottle Wars','City Battle'], approvalMode:'moderator_approval', votingDurationSeconds:60 }
    };
  }

  function defaultRooms(){
    return [
      { id:'central-battle-room', title:'Central Battle Room', notes:'Main cross-city battle room', venues:['kc','miami','atlanta'] },
      { id:'southern-showcase', title:'Southern Showcase', notes:'Dallas, Houston, Atlanta showcase room', venues:['dallas','houston','atlanta'] },
      { id:'late-night-finals', title:'Late Night Finals', notes:'Vegas finale room', venues:['vegas','miami','kc'] }
    ];
  }
  function defaultSchedules(){
    return {
      'central-battle-room': [
        { id:'sch1', time:'10:30 PM', title:'Pre-Show', type:'Pre-Show', desc:'Venue warm-up and standby.' },
        { id:'sch2', time:'11:30 PM', title:'Portal Open', type:'Portal Open', desc:'All venues appear on the network.' },
        { id:'sch3', time:'11:45 PM', title:'DJ Swap', type:'DJ Swap', desc:'Featured DJ segment.' },
        { id:'sch4', time:'12:10 AM', title:'City Battle', type:'City Battle', desc:'KC vs Miami, Atlanta judges.' }
      ],
      'southern-showcase': [
        { id:'sch5', time:'10:45 PM', title:'Portal Open', type:'Portal Open', desc:'Southern room opens.' }
      ],
      'late-night-finals': [
        { id:'sch6', time:'12:45 AM', title:'Final Round', type:'City Battle', desc:'Late night finals.' }
      ]
    };
  }
  function defaultState(){
    const venueStates = {};
    VENUES.forEach(v=>venueStates[v.id]=makeVenueState());
    // sensible default screen permissions
    venueStates.kc.screen.allowedVisibleVenues = ['miami','atlanta'];
    venueStates.miami.screen.allowedVisibleVenues = ['kc','atlanta'];
    venueStates.atlanta.screen.allowedVisibleVenues = ['kc','miami'];
    venueStates.dallas.screen.allowedVisibleVenues = ['houston','atlanta'];
    venueStates.houston.screen.allowedVisibleVenues = ['dallas','atlanta'];
    venueStates.vegas.screen.allowedVisibleVenues = ['kc','miami'];

    return {
      moderatorConnected:false,
      moderatorName:'',
      rooms: defaultRooms(),
      schedules: defaultSchedules(),
      activeRoomId:'central-battle-room',
      selectedRoomId:'central-battle-room',
      selectedScheduleId:null,
      currentSegment:'Pre-Show',
      currentRound:'Round 1',
      judgeVenue:'atlanta',
      battlePair:['kc','miami'],
      winner:null,
      portalOpen:false,
      timerRunning:false,
      remainingTime:60,
      roundLength:60,
      eventType:'City Battle',
      voteCode:'KC428',
      scores:{ kc:0, miami:0, atlanta:0, dallas:0, houston:0, vegas:0 },
      venueStates,
      patronPulse:{ polls:{}, activePollByRoom:{} },
      logs:[]
    };
  }

  function loadState(){
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = defaultState();
      saveState(s);
      return s;
    }
    const s = JSON.parse(raw);
    if (!s.patronPulse) s.patronPulse = { polls:{}, activePollByRoom:{} };
    return s;
  }
  function saveState(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function resetState(){ const s = defaultState(); saveState(s); return s; }
  function venueName(id){ return VENUES.find(v=>v.id===id)?.name || id; }
  function currentRoom(state){ return state.rooms.find(r=>r.id===state.activeRoomId) || null; }
  function roomById(state,id){ return state.rooms.find(r=>r.id===id) || null; }
  function pairsForRoom(room){
    const pairs=[]; if(!room) return pairs;
    for(let i=0;i<room.venues.length;i++) for(let j=i+1;j<room.venues.length;j++) pairs.push([room.venues[i], room.venues[j]]);
    return pairs;
  }
  function log(state, message){
    const now = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    state.logs.unshift({ time: now, message });
    state.logs = state.logs.slice(0, 40);
  }
  function selectRoom(state, roomId){
    state.activeRoomId = roomId;
    state.selectedRoomId = roomId;
    const room = roomById(state, roomId);
    if (room && room.venues.length >= 3) {
      state.judgeVenue = room.venues[2];
      state.battlePair = [room.venues[0], room.venues[1]];
    }
  }
  function randomCode(){
    const prefix = ['KC','LN','HY','BT'][Math.floor(Math.random()*4)];
    const num = Math.floor(100+Math.random()*900);
    return `${prefix}${num}`;
  }
  function sessionId(){
    let id = localStorage.getItem(SESSION_KEY);
    if (!id){ id = 'sess_'+Math.random().toString(36).slice(2,10); localStorage.setItem(SESSION_KEY,id); }
    return id;
  }
  window.LinkdNShared = { STORAGE_KEY, VENUES, loadState, saveState, resetState, venueName, currentRoom, roomById, pairsForRoom, log, selectRoom, randomCode, sessionId, defaultState };
})();
