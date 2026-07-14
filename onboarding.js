
(() => {
  "use strict";
  const STORAGE_KEY = "solara_profile_v09a";
  const COMPLETE_KEY = "solara_onboarding_complete_v09a";
  const PRODUCTS_KEY = "solara_products_v09b";

  function migratePreviousData(){
    if(!localStorage.getItem(STORAGE_KEY)){
      const previous=localStorage.getItem("solara_profile_v09a2");
      if(previous)localStorage.setItem(STORAGE_KEY,previous);
    }
    if(!localStorage.getItem(COMPLETE_KEY)){
      const previousComplete=localStorage.getItem("solara_onboarding_complete_v09a2");
      if(previousComplete)localStorage.setItem(COMPLETE_KEY,previousComplete);
    }
  }
  migratePreviousData();

  const stepIds = [
    "stepWelcome","stepName","stepAge","stepLocation","stepSkinTone",
    "stepHair","stepEyes","stepBurn","stepTan","stepFreckles",
    "stepSkinType","stepSensitive","stepAcne","stepConditions","stepAllergies",
    "stepPigment","stepMoles","stepMedication","stepPregnancy","stepResult"
  ];
  const steps = stepIds.map(id => document.getElementById(id));
  const onboarding = document.getElementById("onboarding");
  const home = document.getElementById("home");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const backButton = document.getElementById("backButton");
  const firstName = document.getElementById("firstName");
  const age = document.getElementById("age");
  const homeLocation = document.getElementById("homeLocation");
  const answers = {};
  let currentStep = 0;

  function readProfile(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }
  function writeProfile(profile){ localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); }

  function showStep(index){
    currentStep = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step,i)=>step.classList.toggle("active",i===currentStep));
    progressBar.style.width = `${((currentStep+1)/steps.length)*100}%`;
    progressText.textContent = `${currentStep+1} / ${steps.length}`;
    backButton.classList.toggle("hidden", currentStep===0);
  }

  function saveBasics(){
    const p = readProfile();
    if(firstName.value.trim()) p.firstName = firstName.value.trim();
    if(age.value) p.age = Number(age.value);
    if(homeLocation.value.trim()) p.homeLocation = homeLocation.value.trim();
    p.answers = {...(p.answers||{}), ...answers};
    writeProfile(p);
  }

  function validate(){
    document.getElementById("nameError").textContent="";
    document.getElementById("ageError").textContent="";
    if(currentStep===1 && firstName.value.trim().length<2){
      document.getElementById("nameError").textContent="Bitte gib mindestens zwei Zeichen ein.";
      return false;
    }
    if(currentStep===2){
      const n=Number(age.value);
      if(!Number.isInteger(n)||n<13||n>120){
        document.getElementById("ageError").textContent="Bitte gib ein Alter zwischen 13 und 120 ein.";
        return false;
      }
    }
    if(currentStep>=4 && currentStep<=12){
      const q=["skinTone","hair","eyes","burn","tan","freckles","skinType","sensitive","acne"][currentStep-4];
      if(!answers[q]){
        alert("Bitte wähle eine Antwort aus.");
        return false;
      }
    }
    if(currentStep>=13 && currentStep<=14){
      const q=["conditions","allergies"][currentStep-13];
      if(!Array.isArray(answers[q]) || answers[q].length===0){
        alert("Bitte wähle mindestens eine Antwort aus.");
        return false;
      }
    }
    if(currentStep>=15 && currentStep<=18){
      const q=["pigment","moles","medication","pregnancy"][currentStep-15];
      if(!answers[q]){
        alert("Bitte wähle eine Antwort aus.");
        return false;
      }
    }
    return true;
  }

  document.querySelectorAll("[data-question]").forEach(group=>{
    group.querySelectorAll(".choice").forEach(button=>{
      button.addEventListener("click",()=>{
        group.querySelectorAll(".choice").forEach(b=>b.classList.remove("selected"));
        button.classList.add("selected");
        const raw=button.dataset.value;
        answers[group.dataset.question] = /^\d+$/.test(raw) ? Number(raw) : raw;
        saveBasics();
      });
    });
  });

  document.querySelectorAll("[data-multi-question]").forEach(group=>{
    group.querySelectorAll(".multi-choice").forEach(button=>{
      button.addEventListener("click",()=>{
        const question=group.dataset.multiQuestion;
        const value=button.dataset.value;
        let selected=Array.isArray(answers[question]) ? [...answers[question]] : [];

        if(value==="none" || value==="skip" || value==="unknown"){
          selected=[value];
          group.querySelectorAll(".multi-choice").forEach(b=>b.classList.remove("selected"));
          button.classList.add("selected");
        }else{
          selected=selected.filter(v=>!["none","skip","unknown"].includes(v));
          group.querySelectorAll('[data-value="none"],[data-value="skip"],[data-value="unknown"]').forEach(b=>b.classList.remove("selected"));
          if(selected.includes(value)){
            selected=selected.filter(v=>v!==value);
            button.classList.remove("selected");
          }else{
            selected.push(value);
            button.classList.add("selected");
          }
        }
        answers[question]=selected;
        saveBasics();
      });
    });
  });

  document.querySelectorAll("[data-next]").forEach(button=>{
    button.addEventListener("click",()=>{
      if(!validate()) return;
      saveBasics();
      showStep(currentStep+1);
    });
  });

  backButton.addEventListener("click",()=>{ saveBasics(); showStep(currentStep-1); });

  document.getElementById("autoLocation").addEventListener("click",()=>{
    homeLocation.value="";
    document.getElementById("locationHint").textContent=
      "Live-Wetter kann später den Gerätestandort verwenden.";
  });

  function calculateType(){
    const values=["skinTone","hair","eyes","burn","tan","freckles"].map(k=>answers[k]).filter(Boolean);
    const average=values.reduce((a,b)=>a+b,0)/values.length;
    let type=Math.round(average);
    type=Math.max(1,Math.min(6,type));

    const descriptions={
      1:["Sehr helle Haut, sehr hohe Sonnenbrandneigung, kaum Bräunung.","Sehr hoch","Kaum","SPF 50+"],
      2:["Helle Haut, häufig Sonnenbrand, langsame Bräunung.","Hoch","Langsam","SPF 50"],
      3:["Mittlere Haut, gelegentlich Sonnenbrand, gute Bräunung.","Mittel","Gut","SPF 30–50"],
      4:["Olivfarbene Haut, selten Sonnenbrand, schnelle Bräunung.","Eher gering","Schnell","SPF 30–50"],
      5:["Braune Haut, sehr selten Sonnenbrand, starke Pigmentierung.","Gering","Sehr schnell","SPF 30+"],
      6:["Sehr dunkle Haut, Sonnenbrand selten, dennoch UV-Schutz wichtig.","Gering, aber vorhanden","Stark pigmentiert","SPF 30+"]
    };
    const roman=["","I","II","III","IV","V","VI"][type];
    const [desc,risk,tan,spf]=descriptions[type];
    document.getElementById("resultTitle").textContent=`Fitzpatrick Typ ${roman}`;
    document.getElementById("resultDescription").textContent=desc;
    document.getElementById("burnRisk").textContent=risk;
    document.getElementById("tanAbility").textContent=tan;
    document.getElementById("spfRecommendation").textContent=spf;
    document.getElementById("confidence").textContent=values.length===6?"Hoch":"Mittel";

    const p=readProfile();
    p.fitzpatrick=type;
    p.fitzpatrickRoman=roman;
    p.spfRecommendation=spf;
    p.answers={...answers};
    writeProfile(p);
  }

  document.querySelector("[data-finish]").addEventListener("click",()=>{
    if(!validate()) return;
    saveBasics();
    calculateType();
    showStep(10);
  });

  document.querySelector("[data-health-finish]").addEventListener("click",()=>{
    if(!validate()) return;
    saveBasics();
    calculateType();
    showStep(19);
  });

  document.getElementById("showTypes").addEventListener("click",()=>{
    const box=document.getElementById("typesInfo");
    box.classList.toggle("hidden");
    box.innerHTML=`
      <p><strong>Typ I:</strong> sehr hell, fast immer Sonnenbrand, kaum Bräunung.</p>
      <p><strong>Typ II:</strong> hell, häufig Sonnenbrand, langsame Bräunung.</p>
      <p><strong>Typ III:</strong> mittel, manchmal Sonnenbrand, gute Bräunung.</p>
      <p><strong>Typ IV:</strong> oliv, selten Sonnenbrand, schnelle Bräunung.</p>
      <p><strong>Typ V:</strong> braun, sehr selten Sonnenbrand.</p>
      <p><strong>Typ VI:</strong> sehr dunkel, Sonnenbrand selten; UV-Schutz bleibt wichtig.</p>`;
  });

  document.querySelector("[data-complete]").addEventListener("click",()=>{
    localStorage.setItem(COMPLETE_KEY,"true");
    showWelcomeComplete();
  });

  function populate(){
    const p=readProfile();
    firstName.value=p.firstName||"";
    age.value=p.age||"";
    homeLocation.value=p.homeLocation||"";
    Object.assign(answers,p.answers||{});

    document.querySelectorAll("[data-question]").forEach(group=>{
      const value=answers[group.dataset.question];
      group.querySelectorAll(".choice").forEach(button=>{
        const raw=button.dataset.value;
        const buttonValue=/^\d+$/.test(raw)?Number(raw):raw;
        button.classList.toggle("selected", value===buttonValue);
      });
    });

    document.querySelectorAll("[data-multi-question]").forEach(group=>{
      const selected=Array.isArray(answers[group.dataset.multiQuestion])?answers[group.dataset.multiQuestion]:[];
      group.querySelectorAll(".multi-choice").forEach(button=>{
        button.classList.toggle("selected",selected.includes(button.dataset.value));
      });
    });
  }

  function skinTypeLabel(value){
    return {
      veryDry:"Sehr trocken", dry:"Trocken", normal:"Normal",
      combination:"Mischhaut", oily:"Ölig", unknown:"Nicht sicher"
    }[value] || "Nicht angegeben";
  }

  function simpleLabel(value){
    return {yes:"Ja",sometimes:"Gelegentlich",no:"Nein",unknown:"Nicht sicher"}[value] || "Nicht angegeben";
  }

  function fillProfileSummary(){
    const p=readProfile();
    const a=p.answers||{};

    document.getElementById("summaryName").textContent=p.firstName||"Nicht angegeben";
    document.getElementById("summaryAge").textContent=p.age?`${p.age} Jahre`:"Nicht angegeben";
    document.getElementById("summaryLocation").textContent=p.homeLocation||"Automatischer Standort";
    document.getElementById("summaryType").textContent=p.fitzpatrickRoman?`Typ ${p.fitzpatrickRoman}`:"Nicht berechnet";
    document.getElementById("summarySpf").textContent=p.spfRecommendation||"Nicht berechnet";
    document.getElementById("summarySkinType").textContent=skinTypeLabel(a.skinType);
    document.getElementById("summarySensitive").textContent=simpleLabel(a.sensitive);
    document.getElementById("summaryAcne").textContent=simpleLabel(a.acne);

    const flags=[];
    if(Array.isArray(a.conditions) && !a.conditions.some(v=>["none","skip"].includes(v))) flags.push("bekannte Hautangaben");
    if(Array.isArray(a.allergies) && !a.allergies.some(v=>["none","unknown"].includes(v))) flags.push("Allergien");
    if(a.pigment==="many"||a.pigment==="some") flags.push("Pigmentierung");
    if(a.moles==="many"||a.moles==="some") flags.push("Hautstellen beobachten");
    if(a.medication==="yes"||a.medication==="unknown") flags.push("Lichtempfindlichkeit prüfen");
    document.getElementById("summaryFlags").textContent=flags.length?flags.join(", "):"Keine besonderen Angaben";
  }

  function showWelcomeComplete(){
    const p=readProfile();
    const a=p.answers||{};
    onboarding.classList.add("hidden");
    home.classList.add("hidden");
    document.getElementById("welcomeComplete").classList.remove("hidden");

    document.getElementById("welcomeTitle").textContent=`Willkommen bei Solara, ${p.firstName||"Ruby"}!`;
    document.getElementById("welcomeType").textContent=p.fitzpatrickRoman?`Typ ${p.fitzpatrickRoman}`:"Nicht berechnet";
    document.getElementById("welcomeSkinType").textContent=skinTypeLabel(a.skinType);
    document.getElementById("welcomeSpf").textContent=p.spfRecommendation||"Nicht berechnet";
    document.getElementById("welcomeLocation").textContent=p.homeLocation||"Automatischer Standort";
  }

  function timeGreeting(){
    const hour=new Date().getHours();
    if(hour<10)return ["Guten Morgen","Ein ruhiger Start in deinen Sonnentag."];
    if(hour<18)return ["Guten Tag","Das sind deine aktuellen Sonnenbedingungen."];
    if(hour<22)return ["Guten Abend","Die UV-Belastung nimmt jetzt meist deutlich ab."];
    return ["Gute Nacht","Zeit für Ruhe und Regeneration."];
  }


  function profileCompletion(){
    const p=readProfile();
    const a=p.answers||{};
    const sections=[
      {label:"Persönliche Daten",done:Boolean(p.firstName&&p.age)},
      {label:"Wohnort",done:Boolean(p.homeLocation)},
      {label:"Fitzpatrick-Test",done:Boolean(p.fitzpatrickRoman)},
      {label:"Hautprofil",done:Boolean(a.skinType&&a.sensitive&&a.acne)},
      {label:"Besondere Angaben",done:Boolean(a.conditions&&a.allergies&&a.medication)},
      {label:"Produkte",done:false,future:true},
      {label:"Hautverlauf",done:false,future:true}
    ];
    const available=sections.filter(s=>!s.future);
    const completed=available.filter(s=>s.done).length;
    const percent=Math.round(completed/available.length*100);
    return {sections,percent};
  }

  function renderProfileStatus(){
    const {sections,percent}=profileCompletion();
    const percentNode=document.getElementById("profilePercent");
    if(!percentNode)return;

    percentNode.textContent=`${percent} % vollständig`;
    document.getElementById("profileProgressBar").style.width=`${percent}%`;

    const badge=document.getElementById("profileStatusBadge");
    badge.textContent=percent===100?"Grundprofil vollständig":"In Bearbeitung";
    badge.classList.toggle("complete",percent===100);

    document.getElementById("profileChecklist").innerHTML=sections.map(section=>`
      <li>
        <span class="check-dot ${section.done?"done":""}">${section.done?"✓":section.future?"…":"○"}</span>
        <span>${section.label}${section.future?" – folgt":""}</span>
      </li>`).join("");
  }

  function selectOptions(options,current){
    return options.map(([value,label])=>
      `<option value="${value}" ${String(current)===String(value)?"selected":""}>${label}</option>`
    ).join("");
  }

  function openEditModal(section){
    const p=readProfile();
    const a=p.answers||{};
    const modal=document.getElementById("editModal");
    const title=document.getElementById("editModalTitle");
    const content=document.getElementById("editModalContent");
    modal.dataset.section=section;

    if(section==="personal"){
      title.textContent="Persönliche Angaben";
      content.innerHTML=`
        <div class="edit-field"><label for="editName">Vorname</label><input id="editName" value="${p.firstName||""}"></div>
        <div class="edit-field"><label for="editAge">Alter</label><input id="editAge" type="number" min="13" max="120" value="${p.age||""}"></div>
        <div class="edit-field"><label for="editLocation">Wohnort</label><input id="editLocation" value="${p.homeLocation||""}"></div>`;
    }else if(section==="skin"){
      title.textContent="Hautprofil";
      content.innerHTML=`
        <div class="edit-field"><label for="editSkinType">Hauttyp</label>
          <select id="editSkinType">${selectOptions([
            ["veryDry","Sehr trocken"],["dry","Trocken"],["normal","Normal"],
            ["combination","Mischhaut"],["oily","Ölig"],["unknown","Nicht sicher"]
          ],a.skinType)}</select></div>
        <div class="edit-field"><label for="editSensitive">Empfindlichkeit</label>
          <select id="editSensitive">${selectOptions([
            ["yes","Ja"],["sometimes","Manchmal"],["no","Nein"],["unknown","Nicht sicher"]
          ],a.sensitive)}</select></div>
        <div class="edit-field"><label for="editAcne">Unreinheiten</label>
          <select id="editAcne">${selectOptions([
            ["yes","Häufig"],["sometimes","Gelegentlich"],["no","Nein"],["unknown","Nicht sicher"]
          ],a.acne)}</select></div>`;
    }else if(section==="health"){
      title.textContent="Besondere Angaben";
      const allergyOptions=[
        ["none","Keine bekannten"],["fragrance","Duftstoffe"],["preservatives","Konservierungsstoffe"],
        ["filters","Bestimmte Sonnenfilter"],["other","Andere"],["unknown","Nicht sicher"]
      ];
      const conditionOptions=[
        ["none","Keine"],["neurodermatitis","Neurodermitis"],["rosacea","Rosazea"],
        ["psoriasis","Psoriasis"],["other","Andere"],["skip","Keine Angabe"]
      ];
      content.innerHTML=`
        <p>Mehrfachauswahl möglich.</p>
        <div class="edit-field"><label>Hauterkrankungen</label>
          <div class="edit-check-list">${conditionOptions.map(([v,l])=>`
            <label class="edit-check"><input type="checkbox" name="editConditions" value="${v}" ${(a.conditions||[]).includes(v)?"checked":""}><span>${l}</span></label>`).join("")}</div>
        </div>
        <div class="edit-field"><label>Allergien</label>
          <div class="edit-check-list">${allergyOptions.map(([v,l])=>`
            <label class="edit-check"><input type="checkbox" name="editAllergies" value="${v}" ${(a.allergies||[]).includes(v)?"checked":""}><span>${l}</span></label>`).join("")}</div>
        </div>
        <div class="edit-field"><label for="editMedication">Mögliche lichtempfindliche Medikamente</label>
          <select id="editMedication">${selectOptions([
            ["yes","Ja"],["no","Nein"],["unknown","Nicht sicher"],["skip","Keine Angabe"]
          ],a.medication)}</select></div>`;
    }

    modal.classList.remove("hidden");
  }

  function closeEditModal(){
    document.getElementById("editModal").classList.add("hidden");
  }

  function checkedValues(name){
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input=>input.value);
  }

  function saveEditModal(){
    const section=document.getElementById("editModal").dataset.section;
    const p=readProfile();
    p.answers=p.answers||{};

    if(section==="personal"){
      const name=document.getElementById("editName").value.trim();
      const ageValue=Number(document.getElementById("editAge").value);
      const locationValue=document.getElementById("editLocation").value.trim();

      if(name.length<2){
        alert("Bitte gib einen gültigen Vornamen ein.");
        return;
      }
      if(!Number.isInteger(ageValue)||ageValue<13||ageValue>120){
        alert("Bitte gib ein Alter zwischen 13 und 120 ein.");
        return;
      }
      p.firstName=name;
      p.age=ageValue;
      p.homeLocation=locationValue||"Automatischer Standort";
    }else if(section==="skin"){
      p.answers.skinType=document.getElementById("editSkinType").value;
      p.answers.sensitive=document.getElementById("editSensitive").value;
      p.answers.acne=document.getElementById("editAcne").value;
    }else if(section==="health"){
      p.answers.conditions=checkedValues("editConditions");
      p.answers.allergies=checkedValues("editAllergies");
      p.answers.medication=document.getElementById("editMedication").value;
    }

    writeProfile(p);
    closeEditModal();
    fillProfileSummary();
    renderProfileStatus();
    const [greeting,subtitle]=timeGreeting();
    document.getElementById("homeGreeting").textContent=`${greeting}, ${p.firstName||"Ruby"}!`;
    document.getElementById("personalGreeting").textContent=subtitle;
  }

  function showHome(){
    const p=readProfile();
    document.getElementById("welcomeComplete").classList.add("hidden");
    onboarding.classList.add("hidden");
    home.classList.remove("hidden");

    const [greeting,subtitle]=timeGreeting();
    document.getElementById("homeGreeting").textContent=`${greeting}, ${p.firstName||"Ruby"}!`;
    document.getElementById("personalGreeting").textContent=subtitle;
    document.getElementById("scoreSpf").textContent=p.spfRecommendation||"–";
    fillProfileSummary();
    renderProfileStatus();
    openTab("tabToday");
    loadLiveWeather();
  }

  function openTab(tabId){
    document.querySelectorAll(".app-tab").forEach(tab=>tab.classList.toggle("active",tab.id===tabId));
    document.querySelectorAll(".nav-button").forEach(button=>button.classList.toggle("active",button.dataset.tab===tabId));
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function getPosition(){
    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation)return reject(new Error("Standort wird nicht unterstützt."));
      navigator.geolocation.getCurrentPosition(resolve,reject,{
        enableHighAccuracy:true,timeout:15000,maximumAge:300000
      });
    });
  }

  async function fetchWeather(lat,lon){
    const params=new URLSearchParams({
      latitude:String(lat),longitude:String(lon),timezone:"auto",
      current:"temperature_2m,apparent_temperature,is_day,weather_code,cloud_cover,wind_speed_10m,uv_index"
    });
    const response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if(!response.ok)throw new Error("Wetterdienst nicht erreichbar.");
    return response.json();
  }

  async function fetchPlace(lat,lon){
    const params=new URLSearchParams({
      latitude:String(lat),longitude:String(lon),localityLanguage:"de"
    });
    const response=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`);
    if(!response.ok)return null;
    return response.json();
  }


  function kawaiiFace(x,y,s=1){
    return `<circle cx="${x-13*s}" cy="${y}" r="${3.2*s}" class="k-eye"/>
      <circle cx="${x+13*s}" cy="${y}" r="${3.2*s}" class="k-eye"/>
      <path d="M ${x-10*s} ${y+11*s} Q ${x} ${y+20*s} ${x+10*s} ${y+11*s}" class="k-mouth"/>
      <ellipse cx="${x-24*s}" cy="${y+9*s}" rx="${8*s}" ry="${4.5*s}" class="k-cheek"/>
      <ellipse cx="${x+24*s}" cy="${y+9*s}" rx="${8*s}" ry="${4.5*s}" class="k-cheek"/>`;
  }

  function kawaiiCloud(fill="#fffaf3",x=20,y=25,s=1){
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <circle cx="45" cy="46" r="30" fill="${fill}"/>
      <circle cx="85" cy="32" r="38" fill="${fill}"/>
      <circle cx="126" cy="47" r="31" fill="${fill}"/>
      <rect x="35" y="46" width="105" height="35" rx="18" fill="${fill}"/>
      ${kawaiiFace(88,52,.72)}
    </g>`;
  }

  function kawaiiWeatherSvg(code,isDay){
    if(!isDay && [0,1].includes(code)){
      return `<svg viewBox="0 0 200 150">
        <circle cx="95" cy="65" r="40" fill="#f8efbf"/>
        <circle cx="113" cy="50" r="38" fill="#243658"/>
        ${kawaiiFace(82,67,.65)}
        <circle cx="33" cy="30" r="4" class="k-star"/>
        <circle cx="170" cy="35" r="5" class="k-star" style="animation-delay:.6s"/>
        <circle cx="160" cy="105" r="3" class="k-star" style="animation-delay:1.1s"/>
      </svg>`;
    }

    if(code===0){
      const rays=Array.from({length:12},(_,i)=>{
        const a=i*Math.PI/6;
        return `<line x1="${100+Math.cos(a)*42}" y1="${68+Math.sin(a)*42}"
          x2="${100+Math.cos(a)*57}" y2="${68+Math.sin(a)*57}"
          stroke="#f3bd4f" stroke-width="7" stroke-linecap="round"/>`;
      }).join("");
      return `<svg viewBox="0 0 200 150">${rays}
        <circle cx="100" cy="68" r="39" fill="#f8cf6c"/>
        ${kawaiiFace(100,64,.75)}
      </svg>`;
    }

    if([1,2].includes(code)){
      return `<svg viewBox="0 0 200 150">
        <circle cx="74" cy="55" r="32" fill="#f8cf6c"/>
        ${kawaiiFace(74,51,.55)}
        ${kawaiiCloud("#fffaf3",42,48,.82)}
      </svg>`;
    }

    if(code===3){
      return `<svg viewBox="0 0 200 150">${kawaiiCloud("#fffaf3",15,24,1.08)}</svg>`;
    }

    if([45,48].includes(code)){
      return `<svg viewBox="0 0 200 150">${kawaiiCloud("#dfe5e7",15,15,1.05)}
        <g stroke="#f5f7f7" stroke-width="9" stroke-linecap="round">
          <line x1="30" y1="110" x2="170" y2="110"/>
          <line x1="50" y1="132" x2="150" y2="132"/>
        </g>
      </svg>`;
    }

    if([71,73,75,77,85,86].includes(code)){
      return `<svg viewBox="0 0 200 150">${kawaiiCloud("#fffaf3",15,8,1.05)}
        <g fill="#fff" stroke="#b9dce5" stroke-width="2">
          <g transform="translate(55 110)"><line x1="-7" y1="0" x2="7" y2="0"/><line x1="0" y1="-7" x2="0" y2="7"/></g>
          <g transform="translate(100 126)"><line x1="-7" y1="0" x2="7" y2="0"/><line x1="0" y1="-7" x2="0" y2="7"/></g>
          <g transform="translate(145 108)"><line x1="-7" y1="0" x2="7" y2="0"/><line x1="0" y1="-7" x2="0" y2="7"/></g>
        </g>
      </svg>`;
    }

    if([95,96,99].includes(code)){
      return `<svg viewBox="0 0 200 150">${kawaiiCloud("#8f9294",15,4,1.05)}
        <path d="M96 96 L77 126 H95 L84 149 L120 113 H104 L119 96Z" fill="#f4c544"/>
        <path d="M54 105 C47 117 49 127 54 130 C61 127 62 117 54 105Z" class="k-drop"/>
        <path d="M149 105 C142 117 144 127 149 130 C156 127 157 117 149 105Z" class="k-drop"/>
      </svg>`;
    }

    return `<svg viewBox="0 0 200 150">${kawaiiCloud("#c8c9c7",15,4,1.05)}
      ${[48,82,116,150].map((x,i)=>`<path d="M${x} 101 C${x-7} 114 ${x-6} 124 ${x} 127 C${x+7} 124 ${x+8} 114 ${x} 101Z" class="k-drop" style="animation:rain 1.8s ${i*.2}s infinite"/>`).join("")}
    </svg>`;
  }

  function weatherLabel(code){
    if(code===0)return "Klar";
    if([1,2].includes(code))return "Teilweise bewölkt";
    if(code===3)return "Bewölkt";
    if([45,48].includes(code))return "Nebel";
    if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return "Regen";
    if([71,73,75,77,85,86].includes(code))return "Schnee";
    if([95,96,99].includes(code))return "Gewitter";
    return "Wechselhaft";
  }

  function calculateHomeScore(uv,temp,code,isDay){
    const p=readProfile();
    if(!isDay||uv<0.1)return 5;
    let score=74;
    score-=Math.max(0,uv-5)*10;
    score-=Math.max(0,2-uv)*12;
    if(temp>30)score-=(temp-30)*3;
    if(temp<14)score-=(14-temp)*2;
    if([61,63,65,80,81,82].includes(code))score-=35;
    if([95,96,99].includes(code))score-=60;
    if(p.fitzpatrick<=2)score-=8;
    return Math.max(0,Math.min(100,Math.round(score)));
  }

  function renderRecommendations(uv,score,isDay){
    const p=readProfile();
    const a=p.answers||{};
    const items=[];

    if(!isDay||uv<0.1){
      items.push("Aktuell besteht praktisch keine wirksame UV-Strahlung.");
      items.push("Heute Abend ist kein Sonnenfenster aktiv.");
    }else if(uv>=8){
      items.push("Die UV-Belastung ist sehr hoch. Geplantes Sonnenbaden wird nicht empfohlen.");
    }else{
      items.push(`Der aktuelle UV-Index liegt bei ${uv.toLocaleString("de-DE",{maximumFractionDigits:1})}.`);
      items.push(`Für dein Profil ist ${p.spfRecommendation||"ein hoher Sonnenschutz"} die orientierende Empfehlung.`);
    }

    if(a.sensitive==="yes"||a.sensitive==="sometimes"){
      items.push("Bei empfindlicher Haut solltest du auf Reizungen achten und möglichst milde Produkte verwenden.");
    }
    if(a.medication==="yes"||a.medication==="unknown"){
      items.push("Prüfe bei Medikamenten mögliche Lichtempfindlichkeit ärztlich oder in der Apotheke.");
    }
    if(score<40 && isDay)items.push("Die Bedingungen sind aktuell eher ungeeignet für eine geplante Sonnensitzung.");

    document.getElementById("todayRecommendations").innerHTML=items.map(item=>`<li>${item}</li>`).join("");
  }

  async function loadLiveWeather(){
    const status=document.getElementById("weatherStatus");
    status.textContent="Standort und Wetter werden geladen …";
    try{
      const position=await getPosition();
      const lat=position.coords.latitude;
      const lon=position.coords.longitude;
      const [weatherResult,placeResult]=await Promise.allSettled([
        fetchWeather(lat,lon),fetchPlace(lat,lon)
      ]);
      if(weatherResult.status!=="fulfilled")throw weatherResult.reason;

      const current=weatherResult.value.current;
      const place=placeResult.status==="fulfilled"?placeResult.value:null;
      const name=place?.locality||place?.city||place?.principalSubdivision||"Aktueller Standort";
      const temp=Number(current.temperature_2m||0);
      const uv=Number(current.uv_index||0);
      const isDay=current.is_day===1;
      const score=calculateHomeScore(uv,temp,current.weather_code,isDay);

      status.textContent=`Live · aktualisiert ${current.time?.slice(11,16)||""} Uhr`;
      document.getElementById("currentTemperature").textContent=`${Math.round(temp)} °C`;
      document.getElementById("weatherDescription").textContent=weatherLabel(current.weather_code);
      document.getElementById("kawaiiWeather").innerHTML=kawaiiWeatherSvg(current.weather_code,isDay);
      document.getElementById("currentLocation").textContent=`${name} · Standort automatisch erkannt`;
      document.getElementById("currentUv").textContent=uv.toLocaleString("de-DE",{minimumFractionDigits:1,maximumFractionDigits:1});
      document.getElementById("feelsLike").textContent=`${Math.round(Number(current.apparent_temperature||temp))} °C`;
      document.getElementById("homeScore").textContent=score;
      document.getElementById("scoreUv").textContent=uv.toLocaleString("de-DE",{maximumFractionDigits:1});
      document.getElementById("scoreTemp").textContent=`${Math.round(temp)} °C`;
      document.getElementById("scoreExplanation").textContent=
        !isDay||uv<0.1
          ?"Aktuell ist keine relevante UV-Strahlung vorhanden."
          :score>=65
            ?"Die Bedingungen sind grundsätzlich passend. Sonnenschutz und Hautbeobachtung bleiben wichtig."
            :score>=40
              ?"Die Bedingungen sind nur eingeschränkt geeignet."
              :"Solara empfiehlt aktuell keine geplante Sonnensitzung.";

      renderRecommendations(uv,score,isDay);
    }catch(error){
      status.textContent="Live-Daten konnten nicht geladen werden.";
      document.getElementById("currentLocation").textContent=
        "Bitte Standortzugriff in Safari erlauben und erneut versuchen.";
      document.getElementById("kawaiiWeather").innerHTML=kawaiiWeatherSvg(3,true);
      document.getElementById("todayRecommendations").innerHTML=
        "<li>Ohne Standort kann Solara den aktuellen UV-Index nicht zuverlässig bestimmen.</li>";
    }
  }

  function showOnboarding(start=0){
    home.classList.add("hidden");
    onboarding.classList.remove("hidden");
    populate();
    showStep(start);
  }


  let currentProductAnalysis=null;

  function readProducts(){
    try{return JSON.parse(localStorage.getItem(PRODUCTS_KEY))||[]}
    catch{return []}
  }

  function writeProducts(products){
    localStorage.setItem(PRODUCTS_KEY,JSON.stringify(products));
  }

  function previewImage(inputId,previewId){
    const input=document.getElementById(inputId);
    const preview=document.getElementById(previewId);
    input.addEventListener("change",event=>{
      const file=event.target.files?.[0];
      if(!file)return;
      const reader=new FileReader();
      reader.onload=()=>{
        preview.innerHTML=`<img src="${reader.result}" alt="Produktfoto">`;
        preview.dataset.image=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function ingredientFlags(text){
    const normalized=text.toLowerCase();
    return {
      fragrance:/parfum|fragrance|limonene|linalool|citral|geraniol|citronellol/.test(normalized),
      alcohol:/alcohol denat|ethanol/.test(normalized),
      glycerin:/glycerin|glycerol/.test(normalized),
      niacinamide:/niacinamide/.test(normalized),
      panthenol:/panthenol/.test(normalized),
      aloe:/aloe/.test(normalized),
      zinc:/zinc oxide/.test(normalized),
      titanium:/titanium dioxide/.test(normalized),
      octocrylene:/octocrylene/.test(normalized),
      avobenzone:/avobenzone|butyl methoxydibenzoylmethane/.test(normalized)
    };
  }

  function analyseCurrentProduct(){
    const p=readProfile();
    const a=p.answers||{};
    const brand=document.getElementById("productBrand").value.trim();
    const name=document.getElementById("productName").value.trim();
    const spf=document.getElementById("productSpf").value;
    const area=document.getElementById("productArea").value;
    const uva=document.getElementById("productUva").checked;
    const waterproof=document.getElementById("productWaterproof").checked;
    const fragranceFree=document.getElementById("productFragranceFree").checked;
    const nonComedogenic=document.getElementById("productNonComedogenic").checked;
    const ingredients=document.getElementById("ingredients").value.trim();

    if(!brand||!name){
      alert("Bitte gib Marke und Produktname ein.");
      return;
    }

    let score=55;
    const strengths=[];
    const warnings=[];
    const flags=ingredientFlags(ingredients);

    if(spf==="50"||spf==="50+"){score+=15;strengths.push("Hoher angegebener Lichtschutzfaktor.");}
    else if(spf==="30"){score+=9;strengths.push("Solider angegebener Lichtschutzfaktor.");}
    else{warnings.push("Der SPF ist für längere oder starke UV-Exposition eher niedrig.");score-=7;}

    if(uva){score+=10;strengths.push("UVA-/Breitbandschutz ist angegeben.");}
    else{warnings.push("Ein UVA-/Breitbandschutz wurde nicht bestätigt.");score-=12;}

    if(waterproof){score+=3;strengths.push("Wasserfestigkeit kann bei Sport oder Schwimmen hilfreich sein.");}

    if(fragranceFree){score+=8;strengths.push("Als parfumfrei angegeben.");}
    if(nonComedogenic){score+=7;strengths.push("Als nicht komedogen angegeben.");}

    if(flags.glycerin||flags.panthenol||flags.aloe||flags.niacinamide){
      score+=5;strengths.push("Pflegende oder feuchtigkeitsspendende Inhaltsstoffe erkannt.");
    }

    const sensitive=a.sensitive==="yes"||a.sensitive==="sometimes";
    const dry=["veryDry","dry"].includes(a.skinType);
    const oily=a.skinType==="oily"||a.acne==="yes"||a.acne==="sometimes";
    const fragranceAllergy=Array.isArray(a.allergies)&&a.allergies.includes("fragrance");

    if(flags.fragrance&&!fragranceFree){
      warnings.push(fragranceAllergy
        ?"Duftstoffe passen möglicherweise nicht zu deiner angegebenen Duftstoffallergie."
        :"Duftstoffe können empfindliche Haut bei manchen Menschen reizen.");
      score-=fragranceAllergy?22:sensitive?12:5;
    }

    if(flags.alcohol){
      if(dry||sensitive){
        warnings.push("Alcohol Denat. kann bei trockener oder empfindlicher Haut austrocknend oder reizend wirken.");
        score-=12;
      }else{
        warnings.push("Alcohol Denat. ist enthalten; die individuelle Verträglichkeit kann unterschiedlich sein.");
        score-=4;
      }
    }

    if(oily&&nonComedogenic){
      score+=5;
    }else if(oily&&!nonComedogenic){
      warnings.push("Bei zu Unreinheiten neigender Haut fehlt eine bestätigte nicht-komedogene Kennzeichnung.");
      score-=5;
    }

    if(area==="children"){
      warnings.push("Kinderprodukte sollten besonders sorgfältig anhand der Herstellerangaben verwendet werden.");
    }

    score=Math.max(0,Math.min(100,Math.round(score)));

    let suitability="Mit Einschränkungen";
    let className="caution";
    if(score>=80){suitability="Sehr gut geeignet";className="good";}
    else if(score<50){suitability="Für dein Profil eher ungeeignet";className="poor";}

    if(!strengths.length)strengths.push("Keine besonderen Stärken aus den bestätigten Angaben abgeleitet.");
    if(!warnings.length)warnings.push("Keine auffälligen Einschränkungen aus den eingegebenen Angaben erkannt.");

    const confidenceParts=[
      Boolean(brand&&name),Boolean(spf),Boolean(ingredients),uva,
      Boolean(document.getElementById("frontPreview").dataset.image),
      Boolean(document.getElementById("backPreview").dataset.image)
    ];
    const confidencePercent=Math.round(confidenceParts.filter(Boolean).length/confidenceParts.length*100);
    const confidence=confidencePercent>=80?"Hoch":confidencePercent>=50?"Mittel":"Niedrig";

    currentProductAnalysis={
      id:Date.now(),brand,name,spf,area,uva,waterproof,fragranceFree,nonComedogenic,
      ingredients,score,suitability,confidence,confidencePercent,
      strengths,warnings,
      frontImage:document.getElementById("frontPreview").dataset.image||"",
      backImage:document.getElementById("backPreview").dataset.image||"",
      createdAt:new Date().toISOString()
    };

    document.getElementById("productScore").textContent=score;
    const badge=document.getElementById("productSuitability");
    badge.textContent=suitability;
    badge.className=`suitability-badge ${className}`;
    document.getElementById("productConfidence").textContent=
      `Vertrauen der Einschätzung: ${confidence} (${confidencePercent} % der wichtigen Angaben vorhanden)`;
    document.getElementById("productStrengths").innerHTML=strengths.map(x=>`<li>${x}</li>`).join("");
    document.getElementById("productWarnings").innerHTML=warnings.map(x=>`<li>${x}</li>`).join("");
    document.getElementById("productExplanation").textContent=
      `Der Score bewertet die Passung zu deinem gespeicherten Hautprofil und die von dir bestätigten Produktangaben. Er ist keine Garantie für individuelle Verträglichkeit.`;

    renderAlternatives(currentProductAnalysis,a);
    document.getElementById("productResult").classList.remove("hidden");
    document.getElementById("productResult").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function renderAlternatives(product,a){
    const card=document.getElementById("alternativesCard");
    const list=document.getElementById("alternativeList");
    if(product.score>=80){
      card.classList.add("hidden");
      return;
    }

    const alternatives=[];
    const sensitive=a.sensitive==="yes"||a.sensitive==="sometimes";
    const oily=a.skinType==="oily"||a.acne==="yes"||a.acne==="sometimes";
    const dry=["veryDry","dry"].includes(a.skinType);

    if(sensitive)alternatives.push(["Parfumfreie Sensitive-Formulierung SPF 50+","Weniger Duftstoffrisiko für empfindliche Haut."]);
    if(oily)alternatives.push(["Leichtes, nicht komedogenes Gesichtsfluid SPF 50+","Passender für ölige oder zu Unreinheiten neigende Haut."]);
    if(dry)alternatives.push(["Feuchtigkeitsspendende Sonnencreme SPF 50+","Mit reichhaltigerer Pflege für trockene Haut."]);
    if(!alternatives.length)alternatives.push(["Breitband-Sonnenschutz SPF 50+","Mit bestätigtem UVA-Schutz und klarer Hauttyp-Kennzeichnung."]);

    list.innerHTML=alternatives.slice(0,3).map(([title,reason],i)=>`
      <div class="alternative-item">
        <strong>${i+1}. ${title}</strong>
        <small>${reason}</small>
      </div>`).join("");
    card.classList.remove("hidden");
  }

  function saveCurrentProduct(){
    if(!currentProductAnalysis){
      alert("Bitte analysiere das Produkt zuerst.");
      return;
    }
    const products=readProducts();
    products.unshift(currentProductAnalysis);
    writeProducts(products);
    renderSavedProducts();
    alert("Produkt wurde gespeichert.");
  }

  function renderSavedProducts(){
    const products=readProducts();
    const container=document.getElementById("savedProductsList");
    if(!products.length){
      container.innerHTML="<p>Noch keine Produkte gespeichert.</p>";
      return;
    }
    container.innerHTML=products.map(product=>`
      <div class="saved-product">
        <div class="saved-product-top">
          <div><strong>${product.brand} ${product.name}</strong><br><small>SPF ${product.spf} · ${new Date(product.createdAt).toLocaleDateString("de-DE")}</small></div>
          <div class="saved-product-score">${product.score}/100</div>
        </div>
        <p>${product.suitability}</p>
      </div>`).join("");
  }

  document.getElementById("startSolara").addEventListener("click",showHome);

  document.querySelectorAll("[data-edit-section]").forEach(button=>{
    button.addEventListener("click",()=>{
      const section=button.dataset.editSection;
      if(section==="fitzpatrick"){
        const confirmed=confirm("Möchtest du den Fitzpatrick-Test erneut durchführen? Deine bisherigen Testantworten können dabei geändert werden.");
        if(confirmed)showOnboarding(4);
      }else{
        openEditModal(section);
      }
    });
  });

  document.querySelectorAll("[data-close-edit]").forEach(button=>{
    button.addEventListener("click",closeEditModal);
  });
  document.getElementById("saveEditModal").addEventListener("click",saveEditModal);

  document.getElementById("restartSkinTest").addEventListener("click",()=>{
    const confirmed=confirm("Möchtest du den Hauttest erneut durchführen? Deine gespeicherten Antworten bleiben erhalten und können angepasst werden.");
    if(confirmed)showOnboarding(4);
  });
  document.getElementById("refreshWeather").addEventListener("click",loadLiveWeather);

  previewImage("frontPhoto","frontPreview");
  previewImage("backPhoto","backPreview");
  document.getElementById("analyseProduct").addEventListener("click",analyseCurrentProduct);
  document.getElementById("saveProduct").addEventListener("click",saveCurrentProduct);
  renderSavedProducts();

  document.querySelectorAll(".nav-button").forEach(button=>{
    button.addEventListener("click",()=>openTab(button.dataset.tab));
  });

  document.getElementById("resetOnboarding").addEventListener("click",()=>{
    const first=confirm("Möchtest du dein gesamtes Solara-Profil wirklich löschen?");
    if(!first)return;
    const second=confirm("Alle Hautprofil- und Fitzpatrick-Angaben werden gelöscht. Danach musst du den Fragebogen erneut ausfüllen. Wirklich fortfahren?");
    if(!second)return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COMPLETE_KEY);
    location.reload();
  });

  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden && !home.classList.contains("hidden")) loadLiveWeather();
  });

  if(localStorage.getItem(COMPLETE_KEY)==="true") showHome();
  else showOnboarding(0);
})();
