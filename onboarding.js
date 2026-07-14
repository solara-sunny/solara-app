
(() => {
  "use strict";
  const STORAGE_KEY = "solara_profile_v09a";
  const COMPLETE_KEY = "solara_onboarding_complete_v09a";
  const PRODUCTS_KEY = "solara_products_v09b32";

  function migrateProductDataV32(){
    if(localStorage.getItem(PRODUCTS_KEY))return;
    const previous=
      localStorage.getItem("solara_products_v09b3") ||
      localStorage.getItem("solara_products_v09b2") ||
      localStorage.getItem("solara_products_v09b");
    if(previous)localStorage.setItem(PRODUCTS_KEY,previous);
  }
  migrateProductDataV32();

  function migrateProductData(){
    if(localStorage.getItem(PRODUCTS_KEY))return;
    const previous=localStorage.getItem("solara_products_v09b");
    if(previous)localStorage.setItem(PRODUCTS_KEY,previous);
  }
  migrateProductData();

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
      {label:"Produkte",done:readProducts().length>0,future:false},
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
      chooseTodayProduct(uv,temp);
    }catch(error){
      status.textContent="Live-Daten konnten nicht geladen werden.";
      document.getElementById("currentLocation").textContent=
        "Bitte Standortzugriff in Safari erlauben und erneut versuchen.";
      document.getElementById("kawaiiWeather").innerHTML=kawaiiWeatherSvg(3,true);
      document.getElementById("todayRecommendations").innerHTML=
        "<li>Ohne Standort kann Solara den aktuellen UV-Index nicht zuverlässig bestimmen.</li>";
      chooseTodayProduct(0,20);
    }
  }

  function showOnboarding(start=0){
    home.classList.add("hidden");
    onboarding.classList.remove("hidden");
    populate();
    showStep(start);
  }


  let currentProductAnalysis=null;
  let selectedProductTags=[];
  let currentUserRating=0;
  let todayRecommendedProductId=null;

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

  const INGREDIENT_KNOWLEDGE = {
    "glycerin":{
      title:"Glycerin",
      level:"good",
      label:"Pflegend",
      group:"Feuchtigkeit",
      summary:"Glycerin bindet Feuchtigkeit und kann die Hautbarriere unterstützen.",
      profile:"Kann besonders bei trockener oder feuchtigkeitsarmer Haut hilfreich sein."
    },
    "niacinamide":{
      title:"Niacinamid",
      level:"good",
      label:"Pflegend",
      group:"Beruhigend / Hautbarriere",
      summary:"Niacinamid wird häufig zur Unterstützung der Hautbarriere eingesetzt.",
      profile:"Kann für viele Hauttypen interessant sein, auch bei zu Unreinheiten neigender Haut."
    },
    "panthenol":{
      title:"Panthenol",
      level:"good",
      label:"Beruhigend",
      group:"Beruhigend / Hautbarriere",
      summary:"Panthenol wird häufig wegen seiner pflegenden und beruhigenden Eigenschaften eingesetzt.",
      profile:"Kann bei empfindlicher oder trockener Haut angenehm sein."
    },
    "allantoin":{
      title:"Allantoin",
      level:"good",
      label:"Beruhigend",
      group:"Beruhigend / Hautbarriere",
      summary:"Allantoin wird in Hautpflegeprodukten häufig als beruhigender Bestandteil verwendet.",
      profile:"Kann für empfindliche Haut interessant sein."
    },
    "bisabolol":{
      title:"Bisabolol",
      level:"good",
      label:"Beruhigend",
      group:"Beruhigend / Hautbarriere",
      summary:"Bisabolol wird häufig in Formulierungen für empfindliche Haut verwendet.",
      profile:"Die individuelle Verträglichkeit bleibt unterschiedlich."
    },
    "aloe":{
      title:"Aloe Vera",
      level:"good",
      label:"Pflegend",
      group:"Feuchtigkeit",
      summary:"Aloe-Vera-Bestandteile werden oft wegen ihres feuchtigkeitsspendenden und angenehmen Hautgefühls eingesetzt.",
      profile:"Kann bei trockener oder empfindlicher Haut angenehm sein."
    },
    "hyaluronic acid":{
      title:"Hyaluronsäure",
      level:"good",
      label:"Feuchtigkeit",
      group:"Feuchtigkeit",
      summary:"Hyaluronsäure kann Wasser binden und wird zur Unterstützung der Hautfeuchtigkeit eingesetzt.",
      profile:"Kann besonders bei trockener oder feuchtigkeitsarmer Haut interessant sein."
    },
    "sodium hyaluronate":{
      title:"Sodium Hyaluronate",
      level:"good",
      label:"Feuchtigkeit",
      group:"Feuchtigkeit",
      summary:"Sodium Hyaluronate ist eine Form der Hyaluronsäure und bindet Feuchtigkeit.",
      profile:"Kann trockene Haut unterstützen."
    },
    "alcohol denat.":{
      title:"Alcohol Denat.",
      level:"note",
      label:"Hinweis",
      group:"Mögliche Reizstoffe",
      summary:"Alcohol Denat. kann eine Formulierung leicht und schnell einziehend machen.",
      profile:"Bei trockener oder empfindlicher Haut kann er bei manchen Menschen austrocknend oder reizend wirken."
    },
    "parfum":{
      title:"Parfum",
      level:"note",
      label:"Hinweis",
      group:"Duftstoffe",
      summary:"Parfum fasst Duftstoffe zusammen, die dem Produkt einen Geruch geben.",
      profile:"Bei empfindlicher Haut oder einer Duftstoffallergie kann besondere Vorsicht sinnvoll sein."
    },
    "fragrance":{
      title:"Fragrance",
      level:"note",
      label:"Hinweis",
      group:"Duftstoffe",
      summary:"Fragrance ist eine Bezeichnung für Duftstoffe.",
      profile:"Bei empfindlicher Haut oder Duftstoffallergien kann das Produkt weniger passend sein."
    },
    "limonene":{
      title:"Limonene",
      level:"note",
      label:"Duftstoff",
      group:"Duftstoffe",
      summary:"Limonene ist ein Duftstoffbestandteil.",
      profile:"Oxidierte Duftstoffbestandteile können bei empfindlichen Personen Reaktionen begünstigen."
    },
    "linalool":{
      title:"Linalool",
      level:"note",
      label:"Duftstoff",
      group:"Duftstoffe",
      summary:"Linalool ist ein häufig verwendeter Duftstoffbestandteil.",
      profile:"Bei Duftstoffallergie oder empfindlicher Haut kann besondere Vorsicht sinnvoll sein."
    },
    "octocrylene":{
      title:"Octocrylene",
      level:"neutral",
      label:"UV-Filter",
      group:"UV-Filter",
      summary:"Octocrylene ist ein organischer UV-Filter.",
      profile:"Ob ein Produkt passend ist, hängt von der gesamten geprüften Formulierung und deiner individuellen Verträglichkeit ab."
    },
    "avobenzone":{
      title:"Avobenzone",
      level:"neutral",
      label:"UVA-Filter",
      group:"UV-Filter",
      summary:"Avobenzone ist ein organischer UVA-Filter.",
      profile:"Die Schutzleistung wird durch die gesamte geprüfte Formulierung bestimmt."
    },
    "butyl methoxydibenzoylmethane":{
      title:"Butyl Methoxydibenzoylmethane",
      level:"neutral",
      label:"UVA-Filter",
      group:"UV-Filter",
      summary:"Dies ist die INCI-Bezeichnung für Avobenzone, einen UVA-Filter.",
      profile:"Die Gesamtformulierung entscheidet über den tatsächlichen Schutz."
    },
    "zinc oxide":{
      title:"Zinkoxid",
      level:"neutral",
      label:"Mineralischer UV-Filter",
      group:"UV-Filter",
      summary:"Zinkoxid ist ein mineralischer UV-Filter und kann UVA- und UVB-Strahlung abdecken.",
      profile:"Textur und Weißeln hängen stark von der Formulierung ab."
    },
    "titanium dioxide":{
      title:"Titandioxid",
      level:"neutral",
      label:"Mineralischer UV-Filter",
      group:"UV-Filter",
      summary:"Titandioxid ist ein mineralischer UV-Filter.",
      profile:"Die Schutzwirkung und das Hautgefühl hängen von der Gesamtformulierung ab."
    },
    "diethylamino hydroxybenzoyl hexyl benzoate":{
      title:"Uvinul A Plus",
      level:"neutral",
      label:"UVA-Filter",
      group:"UV-Filter",
      summary:"Uvinul A Plus ist ein moderner organischer UVA-Filter.",
      profile:"Ein einzelner Filter erlaubt noch keine vollständige Aussage über den Gesamtschutz."
    },
    "bis-ethylhexyloxyphenol methoxyphenyl triazine":{
      title:"Tinosorb S",
      level:"neutral",
      label:"Breitband-UV-Filter",
      group:"UV-Filter",
      summary:"Tinosorb S ist ein photostabiler Breitband-UV-Filter.",
      profile:"Der tatsächliche Schutz wird über das fertige Produkt geprüft."
    },
    "ethylhexyl triazone":{
      title:"Uvinul T 150",
      level:"neutral",
      label:"UVB-Filter",
      group:"UV-Filter",
      summary:"Uvinul T 150 ist ein photostabiler UVB-Filter.",
      profile:"Der SPF kann nicht allein aus der Zutatenliste berechnet werden."
    },
    "phenoxyethanol":{
      title:"Phenoxyethanol",
      level:"neutral",
      label:"Konservierung",
      group:"Konservierungsstoffe",
      summary:"Phenoxyethanol wird zur Konservierung kosmetischer Produkte eingesetzt.",
      profile:"Die individuelle Verträglichkeit kann unterschiedlich sein."
    },
    "sodium benzoate":{
      title:"Sodium Benzoate",
      level:"neutral",
      label:"Konservierung",
      group:"Konservierungsstoffe",
      summary:"Sodium Benzoate wird als Konservierungsstoff eingesetzt.",
      profile:"Die individuelle Verträglichkeit kann unterschiedlich sein."
    }
  };

  function splitIngredients(text){
    return String(text||"")
      .split(/,|;|\n/)
      .map(item=>item.trim())
      .filter(Boolean);
  }

  function matchKnowledge(ingredient){
    const normalized=ingredient.toLowerCase().replace(/\s+/g," ").trim();
    const keys=Object.keys(INGREDIENT_KNOWLEDGE)
      .sort((a,b)=>b.length-a.length);
    const key=keys.find(item=>normalized.includes(item));
    return key ? {...INGREDIENT_KNOWLEDGE[key],key,original:ingredient} : {
      key:normalized,
      original:ingredient,
      title:ingredient,
      level:"neutral",
      label:"Nicht eingeordnet",
      group:"Weitere Inhaltsstoffe",
      summary:"Für diesen Inhaltsstoff ist in dieser Testversion noch keine ausführliche Wissenskarte hinterlegt.",
      profile:"Solara bewertet unbekannte Stoffe nicht automatisch als gut oder schlecht."
    };
  }

  function analyseIngredientGroups(text){
    const groups={
      "Feuchtigkeit":[],
      "Beruhigend / Hautbarriere":[],
      "UV-Filter":[],
      "Duftstoffe":[],
      "Mögliche Reizstoffe":[],
      "Konservierungsstoffe":[],
      "Weitere Inhaltsstoffe":[]
    };

    splitIngredients(text).forEach(ingredient=>{
      const info=matchKnowledge(ingredient);
      const group=groups[info.group] ? info.group : "Weitere Inhaltsstoffe";
      groups[group].push(info);
    });

    return groups;
  }

  function ingredientFlags(text){
    const normalized=String(text||"").toLowerCase();
    return {
      fragrance:/parfum|fragrance|limonene|linalool|citral|geraniol|citronellol/.test(normalized),
      alcohol:/alcohol denat|ethanol/.test(normalized),
      glycerin:/glycerin|glycerol/.test(normalized),
      niacinamide:/niacinamide/.test(normalized),
      panthenol:/panthenol/.test(normalized),
      aloe:/aloe/.test(normalized),
      soothing:/panthenol|allantoin|bisabolol|niacinamide|aloe/.test(normalized),
      humectants:/glycerin|glycerol|hyaluronic acid|sodium hyaluronate|aloe/.test(normalized),
      zinc:/zinc oxide/.test(normalized),
      titanium:/titanium dioxide/.test(normalized),
      octocrylene:/octocrylene/.test(normalized),
      avobenzone:/avobenzone|butyl methoxydibenzoylmethane/.test(normalized),
      modernUva:/diethylamino hydroxybenzoyl hexyl benzoate|bis-ethylhexyloxyphenol methoxyphenyl triazine/.test(normalized),
      modernUvb:/ethylhexyl triazone/.test(normalized),
      preservatives:/phenoxyethanol|sodium benzoate|potassium sorbate|benzyl alcohol/.test(normalized)
    };
  }

  function automaticTags(product,flags){
    const tags=new Set(product.tags||[]);
    if(product.area==="face"||product.area==="both")tags.add("Gesicht");
    if(product.area==="body"||product.area==="both")tags.add("Körper");
    if(product.area==="children")tags.add("Kinder");
    if(product.waterproof)tags.add("Wasserfest");
    if(product.nonComedogenic)tags.add("Unreine Haut");
    if(product.fragranceFree&&!flags.fragrance)tags.add("Empfindliche Haut");
    if(product.spf==="50"||product.spf==="50+")tags.add("Hoher UV-Schutz");
    if(product.waterproof)tags.add("Sport");
    if(!tags.size)tags.add("Alltag");
    return [...tags];
  }

  function renderIngredientAnalysis(text){
    const groups=analyseIngredientGroups(text);
    const container=document.getElementById("ingredientGroups");
    if(!container)return;

    const visible=Object.entries(groups).filter(([,items])=>items.length);
    container.innerHTML=visible.length ? visible.map(([group,items])=>`
      <div class="ingredient-group-card">
        <h3>${escapeHtml(group)}</h3>
        <p>${items.length} erkannt</p>
        <ul>
          ${items.slice(0,6).map(item=>`
            <li><button class="ingredient-chip" data-ingredient="${escapeHtml(item.original)}">${escapeHtml(item.title)}</button></li>
          `).join("")}
        </ul>
      </div>`).join("") : "<p>Keine Inhaltsstoffe eingegeben.</p>";

    container.querySelectorAll("[data-ingredient]").forEach(button=>{
      button.addEventListener("click",()=>openIngredientKnowledge(button.dataset.ingredient));
    });
  }

  function renderPersonalIngredientWarnings(flags){
    const p=readProfile();
    const a=p.answers||{};
    const warnings=[];
    const sensitive=a.sensitive==="yes"||a.sensitive==="sometimes";
    const dry=["veryDry","dry"].includes(a.skinType);
    const oily=a.skinType==="oily"||a.acne==="yes"||a.acne==="sometimes";
    const fragranceAllergy=Array.isArray(a.allergies)&&a.allergies.includes("fragrance");

    if(flags.fragrance){
      warnings.push({
        positive:false,
        title:fragranceAllergy ? "Duftstoffallergie angegeben" : "Duftstoffe erkannt",
        text:fragranceAllergy
          ? "Da du eine Duftstoffallergie angegeben hast, solltest du die INCI-Liste besonders sorgfältig prüfen."
          : sensitive
            ? "Bei empfindlicher Haut können Duftstoffe bei manchen Menschen weniger gut verträglich sein."
            : "Duftstoffe sind enthalten. Die individuelle Verträglichkeit ist unterschiedlich."
      });
    }

    if(flags.alcohol && (dry||sensitive)){
      warnings.push({
        positive:false,
        title:"Alcohol Denat. erkannt",
        text:"Bei trockener oder empfindlicher Haut kann Alcohol Denat. bei manchen Menschen austrocknend oder reizend wirken."
      });
    }

    if(flags.humectants){
      warnings.push({
        positive:true,
        title:"Feuchtigkeitsspendende Stoffe erkannt",
        text:dry
          ? "Diese Inhaltsstoffe können gut zu deiner angegebenen trockenen Haut passen."
          : "Die Formulierung enthält Stoffe, die Feuchtigkeit binden können."
      });
    }

    if(flags.soothing){
      warnings.push({
        positive:true,
        title:"Beruhigende Pflegebestandteile erkannt",
        text:sensitive
          ? "Diese Stoffe können für dein empfindliches Hautprofil interessant sein."
          : "Pflegende und beruhigende Bestandteile wurden erkannt."
      });
    }

    if(oily && !document.getElementById("productNonComedogenic").checked){
      warnings.push({
        positive:false,
        title:"Nicht komedogen nicht bestätigt",
        text:"Da du ölige oder zu Unreinheiten neigende Haut angegeben hast, könnte eine bestätigte nicht-komedogene Formulierung besser passen."
      });
    }

    const container=document.getElementById("personalIngredientWarnings");
    container.innerHTML=warnings.length ? warnings.map(item=>`
      <div class="personal-warning ${item.positive?"positive":""}">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.text)}</span>
      </div>`).join("") : `
      <div class="personal-warning positive">
        <strong>Keine besonderen Profilhinweise erkannt</strong>
        <span>Aus den eingegebenen Angaben ergibt sich derzeit kein zusätzlicher persönlicher Hinweis.</span>
      </div>`;
  }

  function openIngredientKnowledge(name){
    const info=matchKnowledge(name);
    document.getElementById("knowledgeTitle").textContent=info.title;
    document.getElementById("knowledgeContent").innerHTML=`
      <span class="knowledge-level ${info.level}">${escapeHtml(info.label)}</span>
      <div class="knowledge-details">
        <h3>${escapeHtml(info.group)}</h3>
        <p>${escapeHtml(info.summary)}</p>
        <h3>Für dein Profil</h3>
        <p>${escapeHtml(info.profile)}</p>
      </div>`;
    document.getElementById("ingredientKnowledgeModal").classList.remove("hidden");
  }

  function closeIngredientKnowledge(){
    document.getElementById("ingredientKnowledgeModal").classList.add("hidden");
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

    if(flags.glycerin||flags.panthenol||flags.aloe||flags.niacinamide||flags.humectants){
      score+=5;strengths.push("Pflegende oder feuchtigkeitsspendende Inhaltsstoffe erkannt.");
    }

    if(flags.modernUva||flags.modernUvb){
      score+=5;
      strengths.push("Moderne, photostabile UV-Filter wurden in der INCI-Liste erkannt.");
    }

    if(flags.soothing){
      score+=3;
      strengths.push("Beruhigende oder hautbarriereunterstützende Inhaltsstoffe erkannt.");
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
      tags:[...selectedProductTags],
      userRating:currentUserRating,
      notes:document.getElementById("productNotes").value.trim(),
      experiences:{
        fastAbsorb:document.getElementById("expFastAbsorb").checked,
        sticky:document.getElementById("expSticky").checked,
        whiteCast:document.getElementById("expWhiteCast").checked,
        greasy:document.getElementById("expGreasy").checked,
        niceSmell:document.getElementById("expNiceSmell").checked
      },
      createdAt:new Date().toISOString()
    };

    currentProductAnalysis.tags=automaticTags(currentProductAnalysis,flags);
    selectedProductTags=[...currentProductAnalysis.tags];
    renderSelectedTags();
    renderIngredientAnalysis(ingredients);
    renderPersonalIngredientWarnings(flags);

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


  function renderSelectedTags(){
    document.querySelectorAll("#productTags .tag-button").forEach(button=>{
      button.classList.toggle("selected",selectedProductTags.includes(button.dataset.tag));
    });
  }

  function setUserRating(value){
    currentUserRating=Number(value||0);
    document.querySelectorAll("#userRating button").forEach(button=>{
      const rating=Number(button.dataset.rating);
      button.textContent=rating<=currentUserRating?"★":"☆";
      button.classList.toggle("selected",rating<=currentUserRating);
    });
  }

  function resetProductFormExtras(){
    selectedProductTags=[];
    currentUserRating=0;
    renderSelectedTags();
    setUserRating(0);
    ["expFastAbsorb","expSticky","expWhiteCast","expGreasy","expNiceSmell"].forEach(id=>{
      const el=document.getElementById(id);
      if(el)el.checked=false;
    });
    document.getElementById("productNotes").value="";
  }

  function prepareOcrHint(){
    const hasBack=Boolean(document.getElementById("backPreview").dataset.image);
    const hint=document.getElementById("ocrHint");
    if(!hasBack){
      hint.textContent="Bitte fotografiere zuerst die Rückseite.";
      return;
    }

    const currentText=document.getElementById("ingredients").value.trim();
    if(currentText){
      hint.textContent="Der eingetragene Text wurde zur Analyse übernommen. Bitte prüfe Schreibfehler und die Reihenfolge der INCI-Liste.";
      renderIngredientAnalysis(currentText);
      renderPersonalIngredientWarnings(ingredientFlags(currentText));
    }else{
      hint.textContent="Das Rückseitenfoto ist vorhanden. Eine zuverlässige automatische Texterkennung läuft in dieser Browser-Testversion noch nicht; füge den erkannten oder abgelesenen Text bitte ein und tippe erneut auf diesen Button.";
    }
  }

  function calculateTodayProductScore(product,uv=0,temp=20){
    let score=Number(product.score||0);
    if(uv>=6 && (product.spf==="50"||product.spf==="50+"))score+=8;
    if(uv>=3 && product.uva)score+=5;
    if(temp>=24 && product.area==="face" && product.nonComedogenic)score+=3;
    if(product.favorite)score+=2;
    if(product.userRating>=4)score+=2;
    return Math.max(0,Math.min(100,score));
  }

  function chooseTodayProduct(uv=0,temp=20){
    const products=readProducts().map(normalizeProduct);
    const card=document.getElementById("todayProductCard");
    if(!card)return;

    if(!products.length){
      card.classList.add("hidden");
      todayRecommendedProductId=null;
      return;
    }

    const ranked=products
      .map(product=>({...product,todayScore:calculateTodayProductScore(product,uv,temp)}))
      .sort((a,b)=>b.todayScore-a.todayScore);

    const best=ranked[0];
    todayRecommendedProductId=best.id;
    document.getElementById("todayProductName").textContent=`${best.brand} ${best.name}`;
    document.getElementById("todayProductScore").textContent=`${best.todayScore}/100`;

    const reasons=[];
    if(uv>=6)reasons.push("hoher UV-Index");
    if(best.spf==="50"||best.spf==="50+")reasons.push("hoher SPF");
    if(best.uva)reasons.push("bestätigter UVA-Schutz");
    if(best.favorite)reasons.push("dein Favorit");
    if(best.userRating>=4)reasons.push("deine gute persönliche Bewertung");
    document.getElementById("todayProductReason").textContent=
      `Heute besonders passend wegen ${reasons.length?reasons.join(", "):"der besten Übereinstimmung mit deinem Hautprofil"}.`;

    card.classList.remove("hidden");
  }

  function productBreakdown(product){
    const protection=Math.min(25,
      (product.spf==="50"||product.spf==="50+"?15:product.spf==="30"?10:5) +
      (product.uva?10:0)
    );

    let profile=20;
    const p=readProfile();
    const a=p.answers||{};
    const flags=ingredientFlags(product.ingredients||"");
    const sensitive=a.sensitive==="yes"||a.sensitive==="sometimes";
    const oily=a.skinType==="oily"||a.acne==="yes"||a.acne==="sometimes";
    const dry=["veryDry","dry"].includes(a.skinType);

    if(sensitive&&flags.fragrance)profile-=8;
    if((sensitive||dry)&&flags.alcohol)profile-=6;
    if(oily&&product.nonComedogenic)profile+=5;
    profile=Math.max(0,Math.min(40,profile));

    let ingredientsScore=12;
    if(flags.glycerin||flags.panthenol||flags.aloe||flags.niacinamide)ingredientsScore+=5;
    if(flags.fragrance)ingredientsScore-=4;
    if(flags.alcohol)ingredientsScore-=3;
    ingredientsScore=Math.max(0,Math.min(20,ingredientsScore));

    let application=5;
    if(product.waterproof)application+=3;
    if(product.area==="both")application+=2;
    application=Math.min(10,application);

    let extras=0;
    if(product.fragranceFree)extras+=2;
    if(product.nonComedogenic)extras+=3;
    extras=Math.min(5,extras);

    return {
      protection,
      profile,
      ingredients:ingredientsScore,
      application,
      extras
    };
  }

  function normalizeProduct(product){
    const normalized={
      ...product,
      id:product.id||Date.now()+Math.floor(Math.random()*1000),
      favorite:Boolean(product.favorite),
      scanCount:Number(product.scanCount||1),
      updatedAt:product.updatedAt||product.createdAt||new Date().toISOString(),
      tags:Array.isArray(product.tags)?product.tags:[],
      userRating:Number(product.userRating||0),
      notes:product.notes||"",
      experiences:product.experiences||{}
    };
    normalized.breakdown=product.breakdown||productBreakdown(normalized);
    return normalized;
  }

  function saveCurrentProduct(){
    if(!currentProductAnalysis){
      alert("Bitte analysiere das Produkt zuerst.");
      return;
    }

    try{
      const products=readProducts().map(normalizeProduct);
      const editingId=Number(document.getElementById("saveProduct").dataset.editingId||0);

      if(editingId){
        const index=products.findIndex(item=>item.id===editingId);
        if(index>=0){
          currentProductAnalysis.id=editingId;
          currentProductAnalysis.favorite=products[index].favorite;
          currentProductAnalysis.createdAt=products[index].createdAt;
          currentProductAnalysis.scanCount=(products[index].scanCount||1)+1;
          currentProductAnalysis.updatedAt=new Date().toISOString();
          currentProductAnalysis.breakdown=productBreakdown(currentProductAnalysis);
          products[index]=normalizeProduct(currentProductAnalysis);
        }
      }else{
        currentProductAnalysis.favorite=false;
        currentProductAnalysis.scanCount=1;
        currentProductAnalysis.updatedAt=new Date().toISOString();
        currentProductAnalysis.breakdown=productBreakdown(currentProductAnalysis);
        products.unshift(normalizeProduct(currentProductAnalysis));
      }

      writeProducts(products);
      document.getElementById("saveProduct").dataset.editingId="";
      document.getElementById("saveProduct").textContent="Zu meinen Produkten hinzufügen";
      renderSavedProducts();
      updateProfileProductStatus();
      chooseTodayProduct(0,20);
      alert(editingId?"Produkt wurde aktualisiert.":"Produkt wurde gespeichert.");
    }catch(error){
      console.error(error);
      alert("Das Produkt konnte nicht gespeichert werden. Bitte versuche es erneut.");
    }
  }

  function filteredSortedProducts(){
    let products=readProducts().map(normalizeProduct);
    const search=(document.getElementById("productSearch")?.value||"").trim().toLowerCase();
    const sort=document.getElementById("productSort")?.value||"newest";

    if(search){
      products=products.filter(product=>
        `${product.brand} ${product.name} ${product.spf}`.toLowerCase().includes(search)
      );
    }

    if(sort==="score")products.sort((a,b)=>b.score-a.score);
    else if(sort==="alphabetical")products.sort((a,b)=>`${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`,"de"));
    else if(sort==="favorites")products.sort((a,b)=>Number(b.favorite)-Number(a.favorite)||new Date(b.updatedAt)-new Date(a.updatedAt));
    else products.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));

    return products;
  }

  function renderSavedProducts(){
    const allProducts=readProducts().map(normalizeProduct);
    const products=filteredSortedProducts();
    const container=document.getElementById("savedProductsList");
    const count=document.getElementById("productCount");
    if(count)count.textContent=`(${allProducts.length})`;

    const badge=document.getElementById("bestProductBadge");
    if(badge)badge.classList.toggle("hidden",allProducts.length===0);

    if(!products.length){
      container.innerHTML=allProducts.length
        ?"<p>Keine Produkte passen zur aktuellen Suche.</p>"
        :"<p>Noch keine Produkte gespeichert.</p>";
      populateCompareSelects();
      return;
    }

    const bestScore=Math.max(...allProducts.map(product=>product.score));

    container.innerHTML=products.map(product=>`
      <div class="product-library-card ${product.favorite?"favorite":""}" data-product-id="${product.id}">
        <div class="product-library-top">
          <div class="product-library-main">
            <div class="product-thumb">
              ${product.frontImage?`<img src="${product.frontImage}" alt="">`:"Kein Foto"}
            </div>
            <div class="product-library-title">
              <strong>${escapeHtml(product.brand)} ${escapeHtml(product.name)}</strong>
              <small>SPF ${escapeHtml(product.spf)} · ${escapeHtml(product.suitability)}</small>
              <small>${product.favorite?"★ Favorit · ":""}${product.score===bestScore?"Beste Übereinstimmung · ":""}zuletzt ${new Date(product.updatedAt).toLocaleDateString("de-DE")}</small>
              <div class="product-tag-list">${(product.tags||[]).slice(0,4).map(tag=>`<span class="product-tag-chip">${escapeHtml(tag)}</span>`).join("")}</div>
              ${product.userRating?`<div class="user-rating-display">${"★".repeat(product.userRating)}${"☆".repeat(5-product.userRating)}</div>`:""}
            </div>
          </div>
          <div class="product-library-score">${product.score}/100</div>
        </div>
        <div class="product-library-actions">
          <button class="mini-button" data-view-product="${product.id}">Details</button>
          <button class="mini-button" data-favorite-product="${product.id}">${product.favorite?"Favorit entfernen":"Favorit"}</button>
          <button class="mini-button" data-edit-product="${product.id}">Bearbeiten</button>
        </div>
      </div>`).join("");

    container.querySelectorAll("[data-view-product]").forEach(button=>{
      button.addEventListener("click",()=>openProductDetail(Number(button.dataset.viewProduct)));
    });
    container.querySelectorAll("[data-favorite-product]").forEach(button=>{
      button.addEventListener("click",()=>toggleProductFavorite(Number(button.dataset.favoriteProduct)));
    });
    container.querySelectorAll("[data-edit-product]").forEach(button=>{
      button.addEventListener("click",()=>editProduct(Number(button.dataset.editProduct)));
    });

    populateCompareSelects();
  }

  function escapeHtml(value){
    return String(value??"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  let activeProductId=null;

  function openProductDetail(id){
    const product=readProducts().map(normalizeProduct).find(item=>item.id===id);
    if(!product)return;
    activeProductId=id;

    document.getElementById("detailTitle").textContent=`${product.brand} ${product.name}`;
    document.getElementById("detailImages").innerHTML=`
      <div class="detail-image">${product.frontImage?`<img src="${product.frontImage}" alt="Vorderseite">`:"Keine Vorderseite"}</div>
      <div class="detail-image">${product.backImage?`<img src="${product.backImage}" alt="Rückseite">`:"Keine Rückseite"}</div>`;

    const breakdown=product.breakdown||productBreakdown(product);
    const ingredients=(product.ingredients||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,20);

    document.getElementById("detailContent").innerHTML=`
      <div class="product-score-card">
        <p class="eyebrow">Solara Produkt Score</p>
        <div class="product-score">${product.score}</div>
        <div class="suitability-badge ${product.score>=80?"good":product.score<50?"poor":"caution"}">${escapeHtml(product.suitability)}</div>
      </div>

      <div class="detail-score-grid">
        <div class="detail-score-item"><span>Hautprofil</span><strong>${breakdown.profile}/40</strong></div>
        <div class="detail-score-item"><span>UV-Schutz</span><strong>${breakdown.protection}/25</strong></div>
        <div class="detail-score-item"><span>Inhaltsstoffe</span><strong>${breakdown.ingredients}/20</strong></div>
        <div class="detail-score-item"><span>Anwendung</span><strong>${breakdown.application}/10</strong></div>
        <div class="detail-score-item"><span>Extras</span><strong>${breakdown.extras}/5</strong></div>
        <div class="detail-score-item"><span>Vertrauen</span><strong>${escapeHtml(product.confidence)}</strong></div>
      </div>

      <div class="analysis-card">
        <h3>Warum ${product.score} Punkte?</h3>
        <p>Die Bewertung berücksichtigt dein gespeichertes Hautprofil, den bestätigten UV-Schutz, Inhaltsstoffe, Anwendung und zusätzliche Eigenschaften.</p>
        <h3>Stärken</h3>
        <ul>${(product.strengths||[]).map(item=>`<li>${escapeHtml(item)}</li>`).join("")}</ul>
        <h3>Darauf achten</h3>
        <ul>${(product.warnings||[]).map(item=>`<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>

      <div class="analysis-card">
        <h3>Inhaltsstoffe</h3>
        <div class="ingredient-chip-list">
          ${ingredients.length?ingredients.map(item=>`<button class="ingredient-chip" data-ingredient="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join(""):"<span>Keine INCI-Liste gespeichert.</span>"}
        </div>
      </div>

      <div class="analysis-card">
        <h3>Produkt-Tags</h3>
        <div class="product-tag-list">
          ${(product.tags||[]).length?(product.tags||[]).map(tag=>`<span class="product-tag-chip">${escapeHtml(tag)}</span>`).join(""):"<span>Keine Tags gespeichert.</span>"}
        </div>
      </div>

      <div class="user-experience-card">
        <h3>Deine Erfahrung</h3>
        <div class="user-rating-display">${product.userRating?`${"★".repeat(product.userRating)}${"☆".repeat(5-product.userRating)}`:"Noch keine Bewertung"}</div>
        <p>${product.notes?escapeHtml(product.notes):"Keine persönliche Notiz gespeichert."}</p>
        <ul>
          ${product.experiences?.fastAbsorb?"<li>Zieht schnell ein</li>":""}
          ${product.experiences?.sticky?"<li>Klebt</li>":""}
          ${product.experiences?.whiteCast?"<li>Weißelt</li>":""}
          ${product.experiences?.greasy?"<li>Hinterlässt Fettfilm</li>":""}
          ${product.experiences?.niceSmell?"<li>Angenehmer Geruch</li>":""}
        </ul>
      </div>

      <div class="analysis-card">
        <h3>Produktverlauf</h3>
        <p>Erstmals gespeichert: ${new Date(product.createdAt).toLocaleDateString("de-DE")}</p>
        <p>Zuletzt geändert: ${new Date(product.updatedAt).toLocaleDateString("de-DE")}</p>
        <p>Analysen: ${product.scanCount||1}</p>
      </div>`;

    document.querySelectorAll("[data-ingredient]").forEach(button=>{
      button.addEventListener("click",()=>explainIngredient(button.dataset.ingredient));
    });

    document.getElementById("toggleFavoriteProduct").textContent=product.favorite?"Favorit entfernen":"Als Favorit markieren";
    document.getElementById("productDetailModal").classList.remove("hidden");
  }

  function closeProductDetail(){
    document.getElementById("productDetailModal").classList.add("hidden");
    activeProductId=null;
  }

  function toggleProductFavorite(id){
    const products=readProducts().map(normalizeProduct);
    const product=products.find(item=>item.id===id);
    if(!product)return;
    product.favorite=!product.favorite;
    product.updatedAt=new Date().toISOString();
    writeProducts(products);
    renderSavedProducts();
    chooseTodayProduct(0,20);
    if(activeProductId===id)openProductDetail(id);
  }

  function editProduct(id){
    const product=readProducts().map(normalizeProduct).find(item=>item.id===id);
    if(!product)return;

    document.getElementById("productBrand").value=product.brand||"";
    document.getElementById("productName").value=product.name||"";
    document.getElementById("productSpf").value=product.spf||"50";
    document.getElementById("productArea").value=product.area||"face";
    document.getElementById("productUva").checked=Boolean(product.uva);
    document.getElementById("productWaterproof").checked=Boolean(product.waterproof);
    document.getElementById("productFragranceFree").checked=Boolean(product.fragranceFree);
    document.getElementById("productNonComedogenic").checked=Boolean(product.nonComedogenic);
    document.getElementById("ingredients").value=product.ingredients||"";
    selectedProductTags=[...(product.tags||[])];
    renderSelectedTags();
    setUserRating(product.userRating||0);
    document.getElementById("productNotes").value=product.notes||"";
    document.getElementById("expFastAbsorb").checked=Boolean(product.experiences?.fastAbsorb);
    document.getElementById("expSticky").checked=Boolean(product.experiences?.sticky);
    document.getElementById("expWhiteCast").checked=Boolean(product.experiences?.whiteCast);
    document.getElementById("expGreasy").checked=Boolean(product.experiences?.greasy);
    document.getElementById("expNiceSmell").checked=Boolean(product.experiences?.niceSmell);

    const front=document.getElementById("frontPreview");
    const back=document.getElementById("backPreview");
    front.dataset.image=product.frontImage||"";
    back.dataset.image=product.backImage||"";
    front.innerHTML=product.frontImage?`<img src="${product.frontImage}" alt="Vorderseite">`:"Noch kein Foto";
    back.innerHTML=product.backImage?`<img src="${product.backImage}" alt="Rückseite">`:"Noch kein Foto";

    currentProductAnalysis={...product};
    document.getElementById("saveProduct").dataset.editingId=String(id);
    document.getElementById("saveProduct").textContent="Änderungen speichern";
    closeProductDetail();
    openTab("tabProducts");
    document.getElementById("productBrand").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function deleteProduct(id){
    if(!confirm("Möchtest du dieses Produkt wirklich löschen?"))return;
    const products=readProducts().map(normalizeProduct).filter(item=>item.id!==id);
    writeProducts(products);
    closeProductDetail();
    renderSavedProducts();
    updateProfileProductStatus();
    chooseTodayProduct(0,20);
  }

  function explainIngredient(name){
    openIngredientKnowledge(name);
  }

  function populateCompareSelects(){
    const products=readProducts().map(normalizeProduct);
    const options=products.map(product=>`<option value="${product.id}">${escapeHtml(product.brand)} ${escapeHtml(product.name)} (${product.score})</option>`).join("");
    ["compareA","compareB"].forEach(id=>{
      const select=document.getElementById(id);
      if(select)select.innerHTML=options;
    });
    if(products.length>1){
      document.getElementById("compareB").selectedIndex=1;
    }
  }

  function openProductCompare(){
    const products=readProducts();
    if(products.length<2){
      alert("Speichere mindestens zwei Produkte, um sie zu vergleichen.");
      return;
    }
    populateCompareSelects();
    document.getElementById("comparisonResult").innerHTML="";
    document.getElementById("productCompareModal").classList.remove("hidden");
  }

  function closeProductCompare(){
    document.getElementById("productCompareModal").classList.add("hidden");
  }

  function runProductComparison(){
    const products=readProducts().map(normalizeProduct);
    const a=products.find(item=>item.id===Number(document.getElementById("compareA").value));
    const b=products.find(item=>item.id===Number(document.getElementById("compareB").value));
    if(!a||!b||a.id===b.id){
      alert("Bitte wähle zwei unterschiedliche Produkte.");
      return;
    }

    const winner=a.score===b.score?null:(a.score>b.score?a:b);
    const card=product=>`
      <div class="comparison-card ${winner?.id===product.id?"winner":""}">
        <h3>${escapeHtml(product.brand)} ${escapeHtml(product.name)}</h3>
        <div class="comparison-row"><span>Score</span><strong>${product.score}/100</strong></div>
        <div class="comparison-row"><span>SPF</span><strong>${escapeHtml(product.spf)}</strong></div>
        <div class="comparison-row"><span>UVA</span><strong>${product.uva?"Ja":"Nicht bestätigt"}</strong></div>
        <div class="comparison-row"><span>Parfumfrei</span><strong>${product.fragranceFree?"Ja":"Nein / unklar"}</strong></div>
        <div class="comparison-row"><span>Nicht komedogen</span><strong>${product.nonComedogenic?"Ja":"Nein / unklar"}</strong></div>
      </div>`;

    document.getElementById("comparisonResult").innerHTML=`
      <p><strong>${winner?`${escapeHtml(winner.brand)} ${escapeHtml(winner.name)} passt nach den gespeicherten Angaben besser zu deinem Profil.`:"Beide Produkte haben denselben Solara Produkt Score."}</strong></p>
      <div class="comparison-grid">${card(a)}${card(b)}</div>`;
  }

  function updateProfileProductStatus(){
    renderProfileStatus();
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

  document.querySelectorAll("#productTags .tag-button").forEach(button=>{
    button.addEventListener("click",()=>{
      const tag=button.dataset.tag;
      selectedProductTags=selectedProductTags.includes(tag)
        ? selectedProductTags.filter(item=>item!==tag)
        : [...selectedProductTags,tag];
      renderSelectedTags();
    });
  });

  document.querySelectorAll("#userRating button").forEach(button=>{
    button.addEventListener("click",()=>setUserRating(button.dataset.rating));
  });

  document.getElementById("prepareOcr").addEventListener("click",prepareOcrHint);
  document.getElementById("openTodayProduct").addEventListener("click",()=>{
    if(todayRecommendedProductId)openProductDetail(todayRecommendedProductId);
  });
  document.getElementById("analyseProduct").addEventListener("click",analyseCurrentProduct);
  document.getElementById("saveProduct").addEventListener("click",saveCurrentProduct);
  document.getElementById("productSearch").addEventListener("input",renderSavedProducts);
  document.getElementById("productSort").addEventListener("change",renderSavedProducts);
  document.getElementById("openCompareProducts").addEventListener("click",openProductCompare);

  document.querySelectorAll("[data-close-product-detail]").forEach(node=>{
    node.addEventListener("click",closeProductDetail);
  });
  document.querySelectorAll("[data-close-product-compare]").forEach(node=>{
    node.addEventListener("click",closeProductCompare);
  });

  document.querySelectorAll("[data-close-ingredient-knowledge]").forEach(node=>{
    node.addEventListener("click",closeIngredientKnowledge);
  });

  document.getElementById("toggleFavoriteProduct").addEventListener("click",()=>{
    if(activeProductId)toggleProductFavorite(activeProductId);
  });
  document.getElementById("editSavedProduct").addEventListener("click",()=>{
    if(activeProductId)editProduct(activeProductId);
  });
  document.getElementById("compareSavedProduct").addEventListener("click",()=>{
    if(!activeProductId)return;
    closeProductDetail();
    openProductCompare();
    const select=document.getElementById("compareA");
    select.value=String(activeProductId);
  });
  document.getElementById("deleteSavedProduct").addEventListener("click",()=>{
    if(activeProductId)deleteProduct(activeProductId);
  });
  document.getElementById("runProductComparison").addEventListener("click",runProductComparison);

  renderSavedProducts();
  resetProductFormExtras();
  chooseTodayProduct(0,20);

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
