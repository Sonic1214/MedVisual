// Brachial plexus explorer: plexus diagram, nerve course down the arm, and clinical disorders.
// Ported from the first single-file version of MedVisual.

export function brachialPlexus(root){
  var NODES={
    r5:{x:40,y:30,w:36,h:24,t:"C5"},r6:{x:100,y:30,w:36,h:24,t:"C6"},r7:{x:190,y:30,w:36,h:24,t:"C7"},r8:{x:280,y:30,w:36,h:24,t:"C8"},t1:{x:340,y:30,w:36,h:24,t:"T1"},
    tu:{x:70,y:100,w:72,h:24,t:"Upper"},tm:{x:190,y:100,w:72,h:24,t:"Middle"},tl:{x:310,y:100,w:72,h:24,t:"Lower"},
    ua:{x:40,y:165,w:38,h:22,t:"Ant"},ma:{x:95,y:165,w:38,h:22,t:"Ant"},la:{x:150,y:165,w:38,h:22,t:"Ant"},
    up:{x:220,y:165,w:38,h:22,t:"Post"},mp:{x:270,y:165,w:38,h:22,t:"Post"},lp:{x:330,y:165,w:38,h:22,t:"Post"},
    cl:{x:70,y:238,w:74,h:26,t:"Lateral"},cm:{x:150,y:238,w:74,h:26,t:"Medial"},cp:{x:270,y:238,w:80,h:26,t:"Posterior"},
    mc:{x:36,y:352,w:70,h:44,t:"Musculo-\ncutaneous"},med:{x:112,y:352,w:70,h:44,t:"Median"},uln:{x:188,y:352,w:70,h:44,t:"Ulnar"},ax:{x:262,y:352,w:68,h:44,t:"Axillary"},rad:{x:340,y:352,w:66,h:44,t:"Radial"}
  };
  var EDGES=[["r5","tu"],["r6","tu"],["r7","tm"],["r8","tl"],["t1","tl"],["tu","ua"],["tu","up"],["tm","ma"],["tm","mp"],["tl","la"],["tl","lp"],
    ["ua","cl"],["ma","cl"],["la","cm"],["up","cp"],["mp","cp"],["lp","cp"],["cl","mc"],["cl","med"],["cm","med"],["cm","uln"],["cp","ax"],["cp","rad"]];
  var PICK={mc:"mc",med:"med",uln:"uln",ax:"ax",rad:"rad",tu:"ut",tl:"lt"};
  var ALLR=["r5","r6","r7","r8","t1"],ALLT=["tu","tm","tl"];

  var ITEMS={
  rad:{name:"Radial nerve",chip:"Radial",set:ALLR.concat(ALLT,["up","mp","lp","cp","rad"]),roots:"C5 to T1",from:"Posterior cord (its largest branch)",
    motor:"Triceps, anconeus, brachioradialis, supinator and all the extensors of the forearm",
    sens:"Back of the arm and forearm, and the lateral back of the hand. Autonomous zone: first dorsal web space.",
    tip:"Memory aid: a lesion in the axilla loses triceps, in the spiral groove spares triceps, and in the posterior interosseous nerve spares sensation.",
    dis:[
      {n:"Crutch palsy (axilla)",c:"Pressure from a crutch in the armpit.",s:"Wrist drop and finger drop, weak triceps, absent triceps reflex, numb back of the arm, forearm and hand."},
      {n:"Saturday night palsy (spiral groove)",c:"Mid-shaft humeral fracture, or sleeping with the arm hanging over a chair or bench.",s:"Wrist drop and numbness over the back of the hand. Triceps still works because its branches leave higher up."},
      {n:"Posterior interosseous nerve syndrome",c:"Entrapment at the arcade of Frohse in supinator, or Monteggia fracture-dislocation.",s:"Finger drop with no sensory loss. The wrist still extends but deviates radially because extensor carpi radialis longus is spared."},
      {n:"Wartenberg syndrome",c:"Superficial branch squeezed by tight watch straps or handcuffs.",s:"Tingling or numbness over the back of the thumb side of the hand. No weakness."}
    ],
    course:{
      paths:[
        {d:"M205 58 L198 96"},{d:"M198 96 L192 118 L186 140 L180 160",b:1},{d:"M180 160 L176 190 L170 234"},
        {d:"M170 234 L167 270 L165 330 L163 392 L146 430 L138 452",t:1},{d:"M170 238 L172 270 L190 305 L200 350 L200 395",b:1,t:1}
      ],
      lms:[
        {x:204,y:66,t:"Axilla",s:"Lies behind the axillary artery on subscapularis, latissimus dorsi and teres major.",i:"Crutch palsy. Wrist drop, weak triceps, absent triceps reflex and numbness over the back of the arm, forearm and hand."},
        {x:188,y:125,t:"Spiral groove",s:"Passes between the heads of triceps behind the humerus, with the profunda brachii artery.",i:"Mid-shaft humeral fracture or Saturday night palsy. Wrist drop and numb back of the hand, but triceps still works."},
        {x:177,y:185,t:"Lateral intermuscular septum",s:"Pierces the septum in the lower third of the arm and enters the front, between brachialis and brachioradialis.",i:"Distal humeral fractures can injure it here. Triceps is spared, but the wrist and finger extensors are weak."},
        {x:169,y:238,t:"Cubital fossa",s:"Lies in front of the lateral epicondyle and divides into a superficial (sensory) branch and a deep branch, the posterior interosseous nerve.",i:"Elbow dislocation and radial head fractures can injure the deep branch."},
        {x:178,y:274,t:"Supinator",s:"The deep branch pierces supinator through the arcade of Frohse and runs on the back of the forearm as the posterior interosseous nerve.",i:"Posterior interosseous nerve syndrome or Monteggia fracture-dislocation. Finger drop with no sensory loss."},
        {x:163,y:385,t:"Superficial branch at the wrist",s:"Runs under brachioradialis, emerges about 7 cm above the wrist and supplies the back of the lateral hand.",i:"Wartenberg syndrome from tight watch straps or handcuffs. Tingling over the back of the thumb side of the hand, no weakness."}
      ]}},
  med:{name:"Median nerve",chip:"Median",set:ALLR.concat(ALLT,["ua","ma","la","cl","cm","med"]),roots:"C5 to T1 (lateral root C5 to C7, medial root C8 and T1)",from:"Lateral and medial cords. The two roots join in front of the axillary artery.",
    motor:"Most forearm flexors (not flexor carpi ulnaris or the medial half of flexor digitorum profundus), the thenar muscles and the first two lumbricals",
    sens:"Palm side of the lateral 3½ digits and the thenar skin. Nail beds of the same digits on the back.",
    tip:"Memory aid: LOAF muscles. Lateral two lumbricals, Opponens pollicis, Abductor pollicis brevis, Flexor pollicis brevis (superficial head).",
    dis:[
      {n:"Carpal tunnel syndrome",c:"Compression under the flexor retinaculum. Pregnancy, hypothyroidism, diabetes, rheumatoid arthritis and repetitive wrist use.",s:"Night-time tingling and pain in the lateral 3½ digits, relieved by shaking the hand. Positive Tinel and Phalen tests. Late thenar wasting. Thenar skin sensation is spared because the palmar cutaneous branch leaves before the tunnel."},
      {n:"Pronator teres syndrome",c:"Compression between the two heads of pronator teres.",s:"Forearm ache and median-type paraesthesia, worse with repeated pronation."},
      {n:"Anterior interosseous syndrome",c:"Compression below the elbow, or supracondylar fracture.",s:"The OK sign fails and the pinch becomes pulp to pulp, because flexor pollicis longus and the index part of flexor digitorum profundus are weak. No sensory loss."},
      {n:"Ape hand and hand of benediction",c:"High median lesion (elbow or above). Ape hand alone can follow a low lesion or long-standing carpal tunnel syndrome.",s:"Thenar wasting, thumb stays in line with the palm and cannot oppose (ape hand). Asking for a fist leaves the index and middle fingers straight (hand of benediction)."}
    ],
    course:{
      paths:[
        {d:"M206 58 L203 100 L201 140 L202 228 L198 244 L194 266 L192 300 L192 396 L190 412 L186 436"},
        {d:"M194 268 L186 300 L186 372",b:1,t:1},
        {d:"M186 440 L150 440 L134 456",t:1},{d:"M186 440 L160 470 L158 500",t:1},{d:"M188 442 L178 480 L177 508",t:1},{d:"M190 442 L195 472 L196 502",t:1}
      ],
      lms:[
        {x:203,y:128,t:"Upper arm",s:"Runs beside the brachial artery and crosses in front of it, from lateral to medial, near the middle of the arm. It gives no branches in the arm.",i:"Stab wounds or humeral fractures here give the full median picture: weak pronation, wrist flexion and thumb opposition, numb lateral 3½ digits, and a hand of benediction on making a fist."},
        {x:202,y:222,t:"Supracondylar region",s:"Lies medial to the brachial artery in front of the lower humerus.",i:"Supracondylar humeral fracture in children commonly injures the median nerve, especially its anterior interosseous branch."},
        {x:194,y:262,t:"Pronator teres",s:"Enters the forearm under the bicipital aponeurosis, between the two heads of pronator teres.",i:"Pronator teres syndrome: forearm ache and median-type paraesthesia, worse with repeated pronation."},
        {x:187,y:322,t:"Anterior interosseous nerve",s:"Branches off just below the elbow and runs on the interosseous membrane. It supplies flexor pollicis longus, the lateral half of flexor digitorum profundus and pronator quadratus.",i:"Anterior interosseous syndrome: the OK sign fails and there is no sensory loss."},
        {x:190,y:414,t:"Carpal tunnel",s:"Passes deep to the flexor retinaculum with nine flexor tendons (four superficialis, four profundus and flexor pollicis longus). The palmar cutaneous branch leaves before the tunnel.",i:"Carpal tunnel syndrome: night-time tingling in the lateral 3½ digits, weak thumb abduction, later thenar wasting. Thenar skin sensation is spared."},
        {x:168,y:446,t:"Recurrent thenar branch",s:"Curls back after the tunnel to supply abductor pollicis brevis, opponens pollicis and the superficial head of flexor pollicis brevis.",i:"Thenar wasting and loss of thumb opposition (ape hand)."}
      ]}},
  uln:{name:"Ulnar nerve",chip:"Ulnar",set:["r8","t1","tl","la","cm","uln"],roots:"C8 and T1 (sometimes C7)",from:"Medial cord",
    motor:"Flexor carpi ulnaris, the medial half of flexor digitorum profundus, hypothenar muscles, adductor pollicis, interossei and the medial two lumbricals",
    sens:"Medial 1½ digits (front and back), the hypothenar eminence and the medial side of the back of the hand",
    tip:"Memory aid: the ulnar nerve supplies almost all the small muscles of the hand except the LOAF muscles.",
    dis:[
      {n:"Cubital tunnel syndrome",c:"Compression behind the medial epicondyle or under the flexor carpi ulnaris aponeurosis. Prolonged elbow flexion, trauma, medial epicondyle fracture.",s:"Numb ring and little fingers, weak grip, wasting of the hypothenar muscles and interossei. Froment sign positive and Wartenberg sign (little finger stays abducted)."},
      {n:"Ulnar claw hand",c:"Ulnar nerve lesion that paralyses the 3rd and 4th lumbricals.",s:"Ring and little fingers are hyperextended at the MCP joints and flexed at the IP joints. The claw is worse in a low lesion. In a high lesion the profundus to those fingers is also lost, so the claw is milder (ulnar paradox)."},
      {n:"Guyon canal syndrome",c:"Compression at the wrist from cycling handlebars, a hamate hook fracture or a ganglion.",s:"Weak intrinsic muscles with claw hand, numbness on the palm side of the little finger. The back of the hand is spared because the dorsal cutaneous branch leaves above the wrist."}
    ],
    course:{
      paths:[
        {d:"M207 58 L208 100 L210 150"},{d:"M210 150 L214 190 L216 228",b:1},{d:"M216 228 L214 250 L210 270 L210 330 L210 380 L206 410 L204 440"},
        {d:"M210 372 L222 392 L232 425",b:1,t:1},{d:"M204 440 L202 470 L200 502",t:1},{d:"M204 446 L214 470 L214 496",t:1},{d:"M204 440 L190 450 L172 452",b:1,t:1}
      ],
      lms:[
        {x:210,y:150,t:"Medial intermuscular septum",s:"Runs on the medial side of the arm, then pierces the medial intermuscular septum to enter the back of the arm. It gives no branches in the arm.",i:"The arcade of Struthers can rarely compress it here. Otherwise the picture looks like a lesion at the elbow."},
        {x:215,y:232,t:"Behind the medial epicondyle",s:"Passes in the groove behind the medial epicondyle (the funny bone) and into the cubital tunnel.",i:"Cubital tunnel syndrome or medial epicondyle fracture: numb ring and little fingers, weak grip, Froment sign, wasting of the hypothenar muscles and interossei."},
        {x:211,y:268,t:"Flexor carpi ulnaris",s:"Enters the forearm between the two heads of flexor carpi ulnaris, then runs under it beside the ulnar artery.",i:"Compression under the aponeurosis gives the same picture as cubital tunnel syndrome. A high lesion gives a milder claw (ulnar paradox)."},
        {x:224,y:388,t:"Dorsal cutaneous branch",s:"Leaves about 5 to 7 cm above the wrist and supplies the back of the medial hand and 1½ digits.",i:"It leaves before Guyon canal, so a lesion at the wrist spares sensation on the back of the hand."},
        {x:205,y:414,t:"Guyon canal",s:"Enters the hand through Guyon canal, in front of the flexor retinaculum, and splits into superficial and deep branches.",i:"Guyon canal syndrome (cycling, hamate hook fracture, ganglion): claw hand, weak intrinsic muscles and numbness on the palm side of the little finger."},
        {x:190,y:452,t:"Deep branch in the hand",s:"Curves around the hook of the hamate and supplies the hypothenar muscles, the 3rd and 4th lumbricals, the interossei and adductor pollicis.",i:"Weak finger abduction and adduction, and Froment sign: the thumb bends at its tip joint to hold paper because adductor pollicis is weak."}
      ]}},
  mc:{name:"Musculocutaneous nerve",chip:"Musculocutaneous",set:["r5","r6","r7","tu","tm","ua","ma","cl","mc"],roots:"C5, C6, C7",from:"Lateral cord",
    motor:"Coracobrachialis, biceps brachii and brachialis",
    sens:"Lateral forearm, through the lateral cutaneous nerve of the forearm",
    dis:[
      {n:"Musculocutaneous nerve palsy",c:"Rare. Shoulder dislocation, humeral fracture, entrapment in coracobrachialis, heavy weightlifting.",s:"Weak elbow flexion and supination, absent biceps reflex, numb lateral forearm. Elbow flexion is not lost completely because brachioradialis, supplied by the radial nerve, still works."}
    ],
    course:{
      paths:[
        {d:"M178 60 L186 90 L190 100 L192 150 L190 200 L184 232"},{d:"M184 232 L176 250 L170 300 L165 360 L160 400",t:1}
      ],
      lms:[
        {x:186,y:86,t:"Coracobrachialis",s:"Arises from the lateral cord, pierces coracobrachialis and supplies it.",i:"Shoulder dislocation or entrapment in coracobrachialis can injure it. Weak elbow flexion and supination, absent biceps reflex."},
        {x:196,y:150,t:"Between biceps and brachialis",s:"Runs down between biceps and brachialis and supplies both.",i:"Rare. Heavy lifting or humeral fractures. Elbow flexion is weak but not lost because brachioradialis still works."},
        {x:178,y:250,t:"Lateral cutaneous nerve of the forearm",s:"Appears lateral to the biceps tendon at the elbow, pierces the deep fascia and supplies skin on the lateral forearm.",i:"Can be injured by venepuncture in the cubital fossa or during biceps tendon repair. Numbness or pain on the lateral forearm, no weakness."}
      ]}},
  ax:{name:"Axillary nerve",chip:"Axillary",set:["r5","r6","tu","up","cp","ax"],roots:"C5, C6",from:"Posterior cord",
    motor:"Deltoid and teres minor",
    sens:"Skin over the lower deltoid (regimental badge area)",
    dis:[
      {n:"Axillary nerve palsy",c:"Anterior shoulder dislocation, fracture of the surgical neck of the humerus, a blow to the shoulder.",s:"Deltoid wasting and a flat shoulder. Abduction is weak from 15° to 90° (supraspinatus starts the first 15°). Numb regimental badge area."},
      {n:"Quadrangular space syndrome",c:"Compression of the nerve and the posterior circumflex humeral artery in overhead athletes.",s:"Shoulder pain and paraesthesia. Deltoid and teres minor weakness is uncommon."}
    ],
    course:{
      paths:[
        {d:"M200 56 L200 70"},{d:"M200 70 L194 82 L172 92",b:1},{d:"M172 92 L160 110 L152 135",t:1}
      ],
      lms:[
        {x:206,y:68,t:"Quadrangular space",s:"Leaves the axilla through the quadrangular space with the posterior circumflex humeral artery. Teres minor is above, teres major below, the long head of triceps medial and the humerus lateral.",i:"Quadrangular space syndrome in overhead athletes: shoulder pain and paraesthesia, rarely deltoid weakness."},
        {x:178,y:92,t:"Surgical neck of the humerus",s:"Winds around the surgical neck of the humerus under deltoid.",i:"Surgical neck fracture or anterior shoulder dislocation: deltoid paralysis, flat shoulder, abduction lost between 15° and 90°, numb regimental badge area."},
        {x:152,y:130,t:"Deltoid and teres minor",s:"Supplies deltoid and teres minor. The superior lateral cutaneous nerve of the arm supplies the skin over the lower deltoid.",i:"Deltoid wasting and loss of regimental badge sensation are the two signs to test."}
      ]}},
  ut:{name:"Upper trunk (C5, C6)",chip:"Upper trunk",set:["r5","r6","tu"],roots:"C5, C6",from:"Roots C5 and C6 join. Gives the suprascapular nerve and the nerve to subclavius.",
    motor:"Through its branches: deltoid, supraspinatus, infraspinatus, biceps, brachialis, brachioradialis and supinator",
    sens:"Lateral arm and forearm",
    dis:[
      {n:"Erb-Duchenne palsy",c:"Birth injury with shoulder dystocia, or a fall where the shoulder is forced down while the head is pushed to the other side, such as a motorcycle accident.",s:"Waiter’s tip position: arm hangs by the side, adducted and medially rotated, elbow extended, forearm pronated and wrist flexed. Loss of abduction, lateral rotation and elbow flexion, and numbness over the lateral arm and forearm."}
    ]},
  lt:{name:"Lower trunk (C8, T1)",chip:"Lower trunk",set:["r8","t1","tl"],roots:"C8, T1",from:"Roots C8 and T1 join",
    motor:"Through its branches: the small muscles of the hand and the long finger flexors",
    sens:"Medial arm, forearm and hand",
    dis:[
      {n:"Klumpke palsy",c:"Upward pull on the arm, such as grabbing a branch while falling, traction in a breech delivery, or an apical lung tumour (Pancoast).",s:"Claw hand with paralysed small muscles of the hand, numbness along the medial arm and hand. If the T1 sympathetic fibres are involved, Horner syndrome: ptosis, miosis and anhidrosis."}
    ]},
  lth:{name:"Long thoracic nerve",chip:"Long thoracic",set:["r5","r6","r7"],roots:"C5, C6, C7",from:"The roots directly, before the trunks form. Runs down the lateral chest wall on serratus anterior.",
    motor:"Serratus anterior",
    sens:"None (purely motor)",
    dis:[
      {n:"Winged scapula",c:"Injury during mastectomy or axillary node dissection, a stab wound, or carrying a heavy backpack.",s:"The medial border of the scapula sticks out when pushing against a wall. The arm cannot be raised above the horizontal because the scapula does not rotate upward."}
    ]}
  };
  var ORDER=["rad","med","uln","mc","ax","ut","lt","lth"];

  root.innerHTML=
  "<div class=\"bp\">"
  +"<div class=\"bp-pick\"><div class=\"chips\" id=\"chips\"></div>"
  +"<div class=\"seg\" role=\"group\" aria-label=\"View\"><button id=\"vp\" type=\"button\">Plexus</button><button id=\"vc\" type=\"button\">Course</button></div></div>"
  +"<div class=\"bp-fig\"><svg id=\"fig\" width=\"100%\" role=\"img\"></svg><p class=\"cap\" id=\"cap\"></p></div>"
  +"<div class=\"bp-info\" id=\"info\"></div></div>";
  function g(id){return root.querySelector("#"+id)}
  var chips=g("chips"),vp=g("vp"),vc=g("vc"),fig=g("fig"),cap=g("cap"),info=g("info");
  var cur="rad",view="plexus",lm=0;
  ORDER.forEach(function(k){
    var b=document.createElement("button");
    b.type="button";b.className="chip";b.textContent=ITEMS[k].chip;b.setAttribute("data-k",k);
    b.onclick=function(){cur=k;lm=0;render()};
    chips.appendChild(b);
  });
  vp.onclick=function(){view="plexus";render()};
  vc.onclick=function(){if(ITEMS[cur].course){view="course";render()}};

  function drawPlexus(it){
    var on={};it.set.forEach(function(k){on[k]=1});
    var h="<title>Brachial plexus diagram</title><desc>Roots C5 to T1, three trunks, six divisions, three cords and five terminal nerves. The path of the selected nerve is highlighted.</desc>";
    var pass,e,a,b,hot;
    for(pass=0;pass<2;pass++){
      EDGES.forEach(function(e){
        a=NODES[e[0]];b=NODES[e[1]];hot=!!(on[e[0]]&&on[e[1]]);
        if((pass===1)!==hot)return;
        h+="<line class=\"e"+(hot?" on":"")+"\""+(hot?"":" style=\"opacity:.35\"")+" x1=\""+a.x+"\" y1=\""+(a.y+a.h/2)+"\" x2=\""+b.x+"\" y2=\""+(b.y-b.h/2)+"\"/>";
      });
    }
    Object.keys(NODES).forEach(function(k){
      var n=NODES[k],isOn=on[k],pick=PICK[k];
      h+="<g class=\"n"+(isOn?" on":"")+(pick?" sel":"")+"\""+(isOn?"":" style=\"opacity:.45\"")+(pick?" data-p=\""+pick+"\" tabindex=\"0\" role=\"button\" aria-label=\""+ITEMS[pick].name+"\"":"")+">"
        +"<rect x=\""+(n.x-n.w/2)+"\" y=\""+(n.y-n.h/2)+"\" width=\""+n.w+"\" height=\""+n.h+"\" rx=\"6\"/>";
      var ls=n.t.split("\n");
      ls.forEach(function(s,i){h+="<text x=\""+n.x+"\" y=\""+(n.y+(i-(ls.length-1)/2)*13)+"\">"+s+"</text>"});
      h+="</g>";
    });
    return h;
  }

  function drawLimb(it){
    var c=it.course;
    var h="<title>Right upper limb with the course of the "+it.name.toLowerCase()+"</title><desc>Front view of the right arm with numbered points along the nerve. Dashed lines run behind bone or deep.</desc>";
    h+="<text class=\"ts\" x=\"20\" y=\"14\">Lateral</text><text class=\"ts\" x=\"360\" y=\"14\" text-anchor=\"end\">Medial</text>";
    h+="<circle class=\"bone\" cx=\"190\" cy=\"52\" r=\"17\"/><rect class=\"bone\" x=\"180\" y=\"62\" width=\"20\" height=\"170\" rx=\"10\"/><ellipse class=\"bone\" cx=\"190\" cy=\"236\" rx=\"26\" ry=\"11\"/>";
    h+="<rect class=\"bone\" x=\"165\" y=\"246\" width=\"13\" height=\"152\" rx=\"6\"/><rect class=\"bone\" x=\"204\" y=\"246\" width=\"14\" height=\"154\" rx=\"6\"/>";
    h+="<rect class=\"bone\" x=\"160\" y=\"404\" width=\"64\" height=\"22\" rx=\"6\"/><rect class=\"bone\" x=\"148\" y=\"428\" width=\"76\" height=\"40\" rx=\"8\"/>";
    h+="<rect class=\"bone\" x=\"128\" y=\"432\" width=\"14\" height=\"40\" rx=\"7\"/><rect class=\"bone\" x=\"152\" y=\"466\" width=\"13\" height=\"40\" rx=\"6\"/><rect class=\"bone\" x=\"168\" y=\"466\" width=\"13\" height=\"46\" rx=\"6\"/><rect class=\"bone\" x=\"184\" y=\"466\" width=\"13\" height=\"42\" rx=\"6\"/><rect class=\"bone\" x=\"200\" y=\"466\" width=\"13\" height=\"34\" rx=\"6\"/>";
    h+="<text class=\"ts\" x=\"150\" y=\"190\" text-anchor=\"end\">Humerus</text><text class=\"ts\" x=\"148\" y=\"330\" text-anchor=\"end\">Radius</text><text class=\"ts\" x=\"236\" y=\"330\">Ulna</text><text class=\"ts\" x=\"246\" y=\"240\">Elbow</text>";
    c.paths.forEach(function(p){h+="<path class=\"nv"+(p.b?" back":"")+(p.t?" thin":"")+"\" d=\""+p.d+"\"/>"});
    c.lms.forEach(function(s,i){
      h+="<g class=\"lm"+(i===lm?" on":"")+"\" data-i=\""+i+"\" tabindex=\"0\" role=\"button\" aria-label=\"Site "+(i+1)+": "+s.t+"\">"
        +"<circle class=\"hit\" cx=\""+s.x+"\" cy=\""+s.y+"\" r=\"16\"/><circle cx=\""+s.x+"\" cy=\""+s.y+"\" r=\"10\"/><text x=\""+s.x+"\" y=\""+s.y+"\">"+(i+1)+"</text></g>";
    });
    return h;
  }

  function infoHtml(it){
    var h="<h3 class=\"nm\">"+it.name+"</h3>";
    if(view==="course"){
      var s=it.course.lms[lm],n=it.course.lms.length;
      h+="<div class=\"site\"><h4>"+(lm+1)+" of "+n+". "+s.t+"</h4><p>"+s.s+"</p><p class=\"inj\"><b>If injured here:</b> "+s.i+"</p>"
        +"<div class=\"step\"><button class=\"btn\" id=\"pv\" type=\"button\">Previous</button><button class=\"btn\" id=\"nx\" type=\"button\">Next site</button></div></div>";
    }
    h+="<dl class=\"facts\"><dt>Roots</dt><dd>"+it.roots+"</dd><dt>Arises from</dt><dd>"+it.from+"</dd><dt>Motor</dt><dd>"+it.motor+"</dd><dt>Sensory</dt><dd>"+it.sens+"</dd></dl>";
    if(view==="plexus"&&it.course)h+="<p class=\"hint\">Tap Course to follow this nerve down the arm and see what is injured at each site.</p>";
    h+="<h4 class=\"sub\">Clinical disorders</h4>";
    it.dis.forEach(function(d){h+="<details class=\"dis\"><summary>"+d.n+"</summary><div><p><b>Cause:</b> "+d.c+"</p><p><b>Signs:</b> "+d.s+"</p></div></details>"});
    if(it.tip)h+="<p class=\"hint\">"+it.tip+"</p>";
    return h;
  }

  function wire(){
    Array.prototype.forEach.call(fig.querySelectorAll("[data-p]"),function(el){
      function go(){cur=el.getAttribute("data-p");lm=0;render()}
      el.onclick=go;
      el.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();go()}};
    });
    Array.prototype.forEach.call(fig.querySelectorAll("[data-i]"),function(el){
      function go(){lm=+el.getAttribute("data-i");render()}
      el.onclick=go;
      el.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();go()}};
    });
    var pv=info.querySelector("#pv"),nx=info.querySelector("#nx");
    if(pv&&nx){
      var n=ITEMS[cur].course.lms.length;
      pv.onclick=function(){lm=(lm+n-1)%n;render()};
      nx.onclick=function(){lm=(lm+1)%n;render()};
    }
  }

  function render(){
    var it=ITEMS[cur];
    if(view==="course"&&!it.course)view="plexus";
    Array.prototype.forEach.call(chips.children,function(b){b.setAttribute("aria-pressed",b.getAttribute("data-k")===cur?"true":"false")});
    vp.setAttribute("aria-pressed",view==="plexus"?"true":"false");
    vc.setAttribute("aria-pressed",view==="course"?"true":"false");
    vc.disabled=!it.course;
    vc.title=it.course?"":"This item has no limb course to show";
    fig.setAttribute("viewBox",view==="plexus"?"0 0 380 385":"0 0 380 530");
    fig.innerHTML=view==="plexus"?drawPlexus(it):drawLimb(it);
    cap.textContent=view==="plexus"
      ?"Roots, trunks, divisions, cords, branches. Ant and Post are the anterior and posterior divisions. Tap a nerve or trunk, or use the buttons above."
      :"Right arm, front view. Dashed lines run behind bone or deep. Tap a numbered dot, or use Next site.";
    info.innerHTML=infoHtml(it);
    wire();
  }
  render();
  return function(){};
}
