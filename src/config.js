// =====================================================================
// config.js — CONFIGURACION
// Aqui viven TODOS los "numeros" del juego. Si quieres rebalancear la
// dificultad, los puntos, la velocidad, etc., lo haces aqui sin tocar
// la logica. Esa separacion es la clave de un proyecto mantenible.
// =====================================================================

export const CONFIG = {
  defensePad: 92,            // px desde abajo donde esta la linea de defensa
  shipY: 66,                 // altura de la nave del jugador
  baseFall: 30,              // px/seg base de caida (nivel 1)
  fallPerLevel: 7,           // cuanto acelera por nivel
  spawnBase: 2.4,            // seg entre apariciones en nivel 1
  spawnPerLevel: 0.13,
  spawnMin: 0.6,
  enemiesPerWave: 8,         // enemigos destruidos para subir de oleada
  comboWindow: 6.0,          // seg antes de perder el combo
  comboWindowMin: 2.6,
  focusMax: 100,
  focusPerChar: 3.5,
  focusPerWord: 6,
  overdriveDur: 5.0,         // seg de bullet-time
  overdriveSlow: 0.34,       // factor de tiempo de los enemigos en overdrive
  diff: {
    easy:   { shields: 4, spd: 0.85, spawn: 1.30, label: 'EASY' },
    normal: { shields: 3, spd: 1.00, spawn: 1.00, label: 'NORMAL' },
    hard:   { shields: 1, spd: 1.28, spawn: 0.82, label: 'HARD' }
  }
};

export const TYPES = {
  normal: { emojis: ['👾','👽'],          glow: '#39e0ff', spd: 1.00, base: 10, name: 'normal' },
  fast:   { emojis: ['🛸','🚀'],          glow: '#7CFF4F', spd: 1.85, base: 16, name: 'fast' },
  tank:   { emojis: ['🤖','💀','👹'],     glow: '#ff2d95', spd: 0.58, base: 34, name: 'tank' },
  bonus:  { emojis: ['💎','🛰️','⭐'],      glow: '#ffd23f', spd: 0.92, base: 8,  name: 'bonus' }
};

export const WORDS = {
  es: [
    "sol","mar","luz","paz","rio","pan","sal","voz","rey","ley","gas","pez","ave","ojo","oso",
    "ala","eco","uno","dos","gato","casa","mesa","sopa","lobo","pato","rana","mono","vaca","pelo",
    "dedo","mano","nube","hoja","faro","nave","dado","jugo","taza","vino","foca","pera","rosa","lago",
    "cielo","fuego","nieve","barco","piedra","fruta","playa","perro","tigre","cebra","pluma","libro",
    "silla","queso","leche","pasta","arroz","huevo","fresa","salsa","ritmo","piano","cometa","ciudad",
    "bosque","camino","puente","tomate","conejo","tesoro","pastel","helado","mango","viento","planeta",
    "galaxia","meteoro","cohete","ventana","escuela","maestro","teclado","monitor","mensaje","palabra",
    "ballena","caballo","tortuga","gallina","ardilla","cebolla","naranja","manzana","galleta","trompeta",
    "orquesta","historia","pintura","aventura","castillo","tormenta","elefante","mariposa","programa",
    "internet","pantalla","cuaderno","universo","nebulosa","gravedad","velocidad","distancia","escultura",
    "serpiente","caballero","terremoto","chocolate","bicicleta","carretera","edificio","ascensor","escalera",
    "explorador","ventilador","cocodrilo","dinosaurio","astronave","asteroide","linterna",
    "telescopio","biblioteca","computadora","laboratorio","experimento","motocicleta","abecedario","ordenador"
  ],
  en: [
    "sun","sea","sky","cat","dog","fox","owl","bee","ant","jet","cup","pen","key","map","bug",
    "ice","eye","arm","fan","web","egg","fly","run","oak","bat",
    "star","moon","ship","fire","snow","rain","tree","leaf","bird","frog","fish","lion","bear","wolf",
    "duck","milk","cake","book","lamp","road","wind","gold","ring","song","rock","wave","ball","kite","nest","hill",
    "space","light","cloud","ocean","river","beach","tiger","zebra","eagle","whale","horse","mouse","robot",
    "comet","plane","music","piano","bread","apple","lemon","grape","candy","sugar","plant","storm","world",
    "earth","glass","chair","table","house","pizza",
    "planet","rocket","galaxy","meteor","school","pencil","window","dragon","turtle","rabbit","monkey",
    "cherry","orange","banana","flower","forest","bridge","castle","jungle","guitar","violin","helmet","engine","garden",
    "gravity","machine","journey","picture","history","teacher","monster","dolphin","penguin","octopus",
    "leopard","cricket","blanket","diamond","crystal","station","mission","cluster","rainbow","volcano",
    "keyboard","elephant","dinosaur","mountain","sandwich","hospital","airplane","asteroid","universe",
    "notebook","treasure","sunshine","starfish","mushroom","building","umbrella","scissors",
    "telescope","adventure","chocolate","butterfly","crocodile","alligator","astronaut","satellite",
    "lightning","hurricane","orchestra","spaceship",
    "laboratory","basketball","helicopter","strawberry","playground","friendship","lighthouse","microscope",
    "watermelon","experiment","caterpillar","grasshopper","exploration","observatory","countryside",
    "refrigerator","intelligence"
  ]
};

// idioma activo de las palabras ('es' o 'en')
export let lang = 'es';
export function setLang(v){ if (WORDS[v]) lang = v; }
export function currentWords(){ return WORDS[lang]; }
