
(() => {
  "use strict";
  const STORAGE_KEY = "solara_profile_v09a2";
  const COMPLETE_KEY = "solara_onboarding_complete_v09a2";

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
    showHome();
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

  function showHome(){
    const p=readProfile();
    onboarding.classList.add("hidden");
    home.classList.remove("hidden");
    document.getElementById("homeGreeting").textContent=`Hallo, ${p.firstName||"Ruby"}!`;
    document.getElementById("summaryName").textContent=p.firstName||"Nicht angegeben";
    document.getElementById("summaryAge").textContent=p.age?`${p.age} Jahre`:"Nicht angegeben";
    document.getElementById("summaryLocation").textContent=p.homeLocation||"Automatischer Standort";
    document.getElementById("summaryType").textContent=p.fitzpatrickRoman?`Typ ${p.fitzpatrickRoman}`:"Nicht berechnet";
    document.getElementById("summarySpf").textContent=p.spfRecommendation||"Nicht berechnet";

    const a=p.answers||{};
    const skinTypeLabels={
      veryDry:"Sehr trocken",dry:"Trocken",normal:"Normal",
      combination:"Mischhaut",oily:"Ölig",unknown:"Nicht sicher"
    };
    const generalLabels={yes:"Ja",sometimes:"Gelegentlich",no:"Nein",unknown:"Nicht sicher"};
    document.getElementById("summarySkinType").textContent=skinTypeLabels[a.skinType]||"Nicht angegeben";
    document.getElementById("summarySensitive").textContent=generalLabels[a.sensitive]||"Nicht angegeben";
    document.getElementById("summaryAcne").textContent=generalLabels[a.acne]||"Nicht angegeben";

    const flags=[];
    if(Array.isArray(a.conditions) && !a.conditions.some(v=>["none","skip"].includes(v))) flags.push("bekannte Hautangaben");
    if(Array.isArray(a.allergies) && !a.allergies.some(v=>["none","unknown"].includes(v))) flags.push("Allergien");
    if(a.pigment==="many"||a.pigment==="some") flags.push("Pigmentierung");
    if(a.moles==="many"||a.moles==="some") flags.push("Hautstellen beobachten");
    if(a.medication==="yes"||a.medication==="unknown") flags.push("Lichtempfindlichkeit prüfen");
    document.getElementById("summaryFlags").textContent=flags.length?flags.join(", "):"Keine besonderen Angaben";
  }

  function showOnboarding(start=0){
    home.classList.add("hidden");
    onboarding.classList.remove("hidden");
    populate();
    showStep(start);
  }

  document.getElementById("editProfile").addEventListener("click",()=>showOnboarding(1));
  document.getElementById("resetOnboarding").addEventListener("click",()=>{
    if(!confirm("Möchtest du dein Testprofil wirklich zurücksetzen?")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COMPLETE_KEY);
    location.reload();
  });

  if(localStorage.getItem(COMPLETE_KEY)==="true") showHome();
  else showOnboarding(0);
})();
