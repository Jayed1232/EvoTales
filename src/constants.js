export const ARCHETYPES = ['Mage','Sorcerer','Warrior','Healer','Assassin','Ranger','Knight','Summoner','Berserker']
export const AFFINITIES = ['Fire','Water','Ice','Earth','Light','Dark']
export const SPECIAL_AFFs = ['Blood','Void','Magma','Sand']
export const ALL_ELEMENTS = ['Fire','Water','Ice','Earth','Light','Dark','Blood','Void','Magma','Sand']
export const GRADES = ['Beginner','5th Grade','4th Grade','3rd Grade','2nd Grade','1st Grade','Elite','Master','Legend','Mythic','Exceptional']
export const ROLES = ['Protagonist','Antagonist','Sidekick','Mentor','Rival','Neutral','Anti-Hero']
export const GENRES = ['Fantasy','Dark Fantasy','Cultivation','Isekai','Horror','Romance','Sci-Fi','Mystery','Adventure','Thriller']

export const AFF_CLR = {
  Fire:'#ff4d1c',Water:'#00b4d8',Ice:'#a8dadc',Earth:'#8d6e63',
  Light:'#ffd60a',Dark:'#9b5de5',Blood:'#c1121f',Void:'#a855f7',
  Magma:'#e36414',Sand:'#c9a84c'
}
export const GRADE_CLR = {
  'Beginner':'#607d8b',
  '5th Grade':'#9e9e9e','4th Grade':'#4caf50','3rd Grade':'#2196f3',
  '2nd Grade':'#9c27b0','1st Grade':'#ff9800','Elite':'#f44336',
  'Master':'#ff5722','Legend':'#ffc107','Mythic':'#e91e63','Exceptional':'#00bcd4'
}

// Exact stat table from the document
const STAT_TABLE = {
  1:{hp:100,mana:10,speed:1},2:{hp:200,mana:20,speed:2},3:{hp:300,mana:30,speed:3},
  4:{hp:400,mana:40,speed:4},5:{hp:500,mana:50,speed:5},6:{hp:600,mana:60,speed:6},
  7:{hp:700,mana:70,speed:7},8:{hp:800,mana:80,speed:8},9:{hp:900,mana:90,speed:9},
  10:{hp:1000,mana:100,speed:10},
  11:{hp:1200,mana:120,speed:12},12:{hp:1400,mana:140,speed:14},13:{hp:1600,mana:160,speed:16},
  14:{hp:1800,mana:180,speed:18},15:{hp:2000,mana:200,speed:20},16:{hp:2200,mana:220,speed:22},
  17:{hp:2400,mana:240,speed:24},18:{hp:2600,mana:260,speed:26},19:{hp:2800,mana:280,speed:28},
  20:{hp:3000,mana:300,speed:30},
  21:{hp:3300,mana:330,speed:33},22:{hp:3600,mana:360,speed:36},23:{hp:3900,mana:390,speed:39},
  24:{hp:4200,mana:420,speed:42},25:{hp:4500,mana:450,speed:45},26:{hp:4800,mana:480,speed:48},
  27:{hp:5100,mana:510,speed:51},28:{hp:5400,mana:540,speed:54},29:{hp:5700,mana:570,speed:57},
  30:{hp:6000,mana:600,speed:60},
  31:{hp:6400,mana:640,speed:64},32:{hp:6800,mana:680,speed:68},33:{hp:7200,mana:720,speed:72},
  34:{hp:7600,mana:760,speed:76},35:{hp:8000,mana:800,speed:80},36:{hp:8400,mana:840,speed:84},
  37:{hp:8800,mana:880,speed:88},38:{hp:9200,mana:920,speed:92},39:{hp:9600,mana:960,speed:96},
  40:{hp:10000,mana:1000,speed:100},
  41:{hp:10500,mana:1050,speed:105},42:{hp:11000,mana:1100,speed:110},43:{hp:11500,mana:1150,speed:115},
  44:{hp:12000,mana:1200,speed:120},45:{hp:12500,mana:1250,speed:125},46:{hp:13000,mana:1300,speed:130},
  47:{hp:13500,mana:1350,speed:135},48:{hp:14000,mana:1400,speed:140},49:{hp:14500,mana:1450,speed:145},
  50:{hp:15000,mana:1500,speed:150},
  51:{hp:15600,mana:1560,speed:156},52:{hp:16200,mana:1620,speed:162},53:{hp:16800,mana:1680,speed:168},
  54:{hp:17400,mana:1740,speed:174},55:{hp:18000,mana:1800,speed:180},56:{hp:18600,mana:1860,speed:186},
  57:{hp:19200,mana:1920,speed:192},58:{hp:19800,mana:1980,speed:198},59:{hp:20400,mana:2040,speed:204},
  60:{hp:21000,mana:2100,speed:210},
  61:{hp:21700,mana:2170,speed:217},62:{hp:22400,mana:2240,speed:224},63:{hp:23100,mana:2310,speed:231},
  64:{hp:23800,mana:2380,speed:238},65:{hp:24500,mana:2450,speed:245},66:{hp:25200,mana:2520,speed:252},
  67:{hp:25900,mana:2590,speed:259},68:{hp:26600,mana:2660,speed:266},69:{hp:27300,mana:2730,speed:273},
  70:{hp:28000,mana:2800,speed:280},
  71:{hp:28800,mana:2880,speed:288},72:{hp:29600,mana:2960,speed:296},73:{hp:30400,mana:3040,speed:304},
  74:{hp:31200,mana:3120,speed:312},75:{hp:32000,mana:3200,speed:320},76:{hp:32800,mana:3280,speed:328},
  77:{hp:33600,mana:3360,speed:336},78:{hp:34400,mana:3440,speed:344},79:{hp:35200,mana:3520,speed:352},
  80:{hp:36000,mana:3600,speed:360},
  81:{hp:36900,mana:3690,speed:369},82:{hp:37800,mana:3780,speed:378},83:{hp:38700,mana:3870,speed:387},
  84:{hp:39600,mana:3960,speed:396},85:{hp:40500,mana:4050,speed:405},86:{hp:41400,mana:4140,speed:414},
  87:{hp:42300,mana:4230,speed:423},88:{hp:43200,mana:4320,speed:432},89:{hp:44100,mana:4410,speed:441},
  90:{hp:45000,mana:4500,speed:450},
  91:{hp:46000,mana:4600,speed:460},92:{hp:47000,mana:4700,speed:470},93:{hp:48000,mana:4800,speed:480},
  94:{hp:49000,mana:4900,speed:490},95:{hp:50000,mana:5000,speed:500},96:{hp:51000,mana:5100,speed:510},
  97:{hp:52000,mana:5200,speed:520},98:{hp:53000,mana:5300,speed:530},99:{hp:54000,mana:5400,speed:540},
  100:{hp:55000,mana:5500,speed:550},
}

export function calcStats(level) {
  const lvl = Math.max(1, Math.min(100, parseInt(level) || 1))
  return STAT_TABLE[lvl] || STAT_TABLE[1]
}

export function getTierName(level) {
  const lvl = parseInt(level) || 1
  if (lvl <= 10)  return 'The Student'
  if (lvl <= 20)  return 'The Graduate'
  if (lvl <= 30)  return 'The Elite'
  if (lvl <= 40)  return 'The Master'
  if (lvl <= 50)  return 'The High Master'
  if (lvl <= 60)  return 'The Sage'
  if (lvl <= 70)  return 'The Grand Sage'
  if (lvl <= 80)  return 'The Legend'
  if (lvl <= 90)  return 'The Calamity'
  if (lvl <= 99)  return 'The Exceptional'
  return 'The Transcendence'
}
