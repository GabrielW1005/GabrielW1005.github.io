export const TRAITS = [
 {key:'coat',letter:'C',name:'Coat',names:['Amber','Moss','Ice'],effect:'Camouflage works best when coat color matches the habitat.'},
 {key:'fur',letter:'F',name:'Fur',names:['Sleek','Soft','Thick'],effect:'Thicker fur protects against cold but traps heat.'},
 {key:'legs',letter:'L',name:'Legs',names:['Short','Long','Swift'],effect:'Longer legs increase running speed and energy use.'},
 {key:'horns',letter:'H',name:'Horns',names:['None','Small','Large'],effect:'Visible ivory horns knock back nearby predators when defending.'},
 {key:'claws',letter:'K',name:'Claws',names:['None','Sharp','Long'],effect:'Claws improve hunting and defensive strikes.'},
 {key:'armor',letter:'A',name:'Armor',names:['None','Light','Plated'],effect:'Back plates reduce damage but slow movement.'},
 {key:'webbing',letter:'W',name:'Feet',names:['Paws','Broad','Webbed'],effect:'Webbed feet reduce the swimming slowdown.'},
 {key:'ears',letter:'E',name:'Ears',names:['Small','Large','Wide'],effect:'Large ears detect predators earlier and release heat.'},
 {key:'tail',letter:'T',name:'Tail',names:['Short','Long','Plume'],effect:'A longer tail helps a Nimble turn and evade attacks.'},
 {key:'fat',letter:'S',name:'Reserves',names:['Lean','Sturdy','Round'],effect:'Greater reserves reduce starvation damage but add weight.'}
];
export const HABITATS = [
 {name:'Clover Meadow',subtitle:'A gentle beginning',desc:'A bright meadow with berry patches, wandering prey, and foxes on the prowl.',ground:'#799866',grass:'#4f7955',water:'#75b5b8',accent:'#f4cf94',temp:20,trees:40,prey:['beetle','grasshopper','rabbit'],predators:['fox','hawk'],count:5,weather:['clear','rain','storm'],goals:[['forage',8,'Meals gathered'],['births',2,'Offspring born'],['elapsed',45,'Seconds in the wild']]},
 {name:'Reed Marsh',subtitle:'Life at the waterline',desc:'Frogs and fish thrive among the reeds. Snakes lie in wait as heavy rain swells the water.',ground:'#607e68',grass:'#365c55',water:'#547f89',accent:'#cdbb8c',temp:17,trees:25,prey:['frog','fish','beetle'],predators:['snake','fox','croc'],count:7,weather:['rain','storm','fog'],goals:[['kills',4,'Prey captured'],['births',3,'Offspring born'],['weatherTime',25,'Seconds in harsh weather']]},
 {name:'Pine Forest',subtitle:'The pack awakens',desc:'Under tall pines, wolves hunt together. Stay close to shelter and keep the colony fed.',ground:'#576e59',grass:'#365744',water:'#658f98',accent:'#cfba8f',temp:12,trees:100,prey:['rabbit','beetle','grasshopper'],predators:['wolf','fox','hawk'],count:9,weather:['fog','rain','storm'],goals:[['forage',20,'Meals gathered'],['births',4,'Offspring born'],['elapsed',80,'Seconds surviving the pack']]},
 {name:'Windy Highlands',subtitle:'Eyes in the sky',desc:'Open hills leave Nimbles exposed to hawk swoops. Wind and cold reward speed and shelter.',ground:'#93917a',grass:'#657559',water:'#799ea6',accent:'#e4cfa1',temp:8,trees:18,prey:['rabbit','grasshopper','beetle'],predators:['hawk','wolf'],count:10,weather:['storm','fog','clear'],goals:[['defends',5,'Predators repelled'],['births',4,'Offspring born'],['elapsed',90,'Seconds on the highlands']]},
 {name:'Thorn Scrub',subtitle:'Every meal matters',desc:'Dry brush hides snakes, and food recovers slowly in the heat. Sleek coats and large ears help.',ground:'#ad936b',grass:'#81744e',water:'#7a9d9b',accent:'#ecd3a2',temp:32,trees:22,prey:['grasshopper','rabbit','beetle'],predators:['snake','fox','hawk'],count:11,weather:['heat','clear','storm'],goals:[['kills',8,'Prey captured'],['births',4,'Offspring born'],['weatherTime',40,'Seconds in harsh weather']]},
 {name:'River Delta',subtitle:'A shifting shoreline',desc:'Rich fishing grounds draw crocodiles. Webbed feet help Nimbles cross flooded ground.',ground:'#6c8b75',grass:'#416b58',water:'#538d9d',accent:'#dcd3a1',temp:25,trees:55,prey:['fish','frog','beetle'],predators:['croc','snake','hawk'],count:12,weather:['rain','storm','fog'],goals:[['kills',10,'Prey captured'],['births',5,'Offspring born'],['weatherTime',45,'Seconds in harsh weather']]},
 {name:'Snow Valley',subtitle:'The long white season',desc:'Snow quiets the valley while wolves track the colony. Thick fur slows heat loss.',ground:'#c6d9d5',grass:'#91aaa1',water:'#7dabbc',accent:'#e9dbbc',temp:-8,trees:50,prey:['rabbit','beetle','fish'],predators:['wolf','hawk','fox'],count:13,weather:['snow','snow','clear'],goals:[['forage',25,'Meals gathered'],['births',5,'Offspring born'],['weatherTime',60,'Seconds in harsh weather']]},
 {name:'Ember Basin',subtitle:'Beyond the heat haze',desc:'Dark stones radiate heat. Seek shade, hunt beetles, and watch the circling hawks.',ground:'#8e7865',grass:'#645d4c',water:'#729f9f',accent:'#f3ba83',temp:37,trees:15,prey:['beetle','grasshopper','rabbit'],predators:['hawk','snake','fox'],count:14,weather:['heat','storm','heat'],goals:[['kills',12,'Prey captured'],['defends',8,'Predators repelled'],['elapsed',110,'Seconds in the basin']]},
 {name:'Night Jungle',subtitle:'Movement in the mist',desc:'Dense vegetation hides ambushes. Large ears detect threats before they emerge from the fog.',ground:'#456858',grass:'#274c43',water:'#467782',accent:'#c6c287',temp:27,trees:120,prey:['frog','beetle','grasshopper'],predators:['snake','wolf','croc'],count:15,weather:['fog','storm','rain'],goals:[['kills',14,'Prey captured'],['births',6,'Offspring born'],['elapsed',120,'Seconds in the jungle']]},
 {name:'Wild Frontier',subtitle:'A world in balance',desc:'All five predator types share a changing wilderness. Keep a varied colony alive through the seasons.',ground:'#728776',grass:'#446650',water:'#679aa8',accent:'#dec499',temp:16,trees:70,prey:['rabbit','fish','frog','grasshopper','beetle'],predators:['wolf','fox','hawk','snake','croc'],count:18,weather:['clear','storm','snow','heat','fog'],goals:[['births',8,'Offspring born'],['kills',18,'Prey captured'],['weatherTime',80,'Seconds in harsh weather']]}
];
export const ANIMALS = {
 fox:{name:'Fox',role:'predator',speed:66,hp:65,damage:12,range:330,desc:'Singles out young or isolated Nimbles. Fast, but wary of horns.'},
 wolf:{name:'Wolf',role:'predator',speed:72,hp:100,damage:16,range:430,desc:'Pack hunter. Nearby wolves converge on a chase.'},
 hawk:{name:'Hawk',role:'predator',speed:90,hp:55,damage:14,range:450,desc:'Circles overhead, then dives. Watch its shadow and seek a refuge.'},
 snake:{name:'Snake',role:'predator',speed:48,hp:50,damage:15,range:210,desc:'Waits near vegetation, then makes a short ambush strike.'},
 croc:{name:'Crocodile',role:'predator',speed:52,hp:130,damage:22,range:230,desc:'Stays close to water. Very dangerous at the shoreline.'},
 beetle:{name:'Beetle',role:'prey',speed:24,hp:12,energy:18,desc:'Slow clustered prey. Even short claws are useful.'},
 grasshopper:{name:'Grasshopper',role:'prey',speed:62,hp:10,energy:16,desc:'Jumps away from approaching hunters.'},
 rabbit:{name:'Rabbit',role:'prey',speed:84,hp:32,energy:32,desc:'Fast zigzag escape. Longer claws improve the chance of a catch.'},
 fish:{name:'Fish',role:'prey',speed:46,hp:15,energy:24,desc:'Stays in ponds. Webbed feet help Nimbles reach it.'},
 frog:{name:'Frog',role:'prey',speed:47,hp:16,energy:22,desc:'Hops between reeds and water.'}
};
export const geneLevel=(e,key)=>(e.genes?.[key]||[0,0]).reduce((a,b)=>a+b,0);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function rng(seed){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let n=Math.imul(t^t>>>15,t|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296;};}
