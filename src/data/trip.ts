export type City = 'sh' | 'hk';

export type LegMode = 'metro' | 'walk' | 'flight' | 'transfer';

export interface Leg {
  kind: 'leg';
  mode: LegMode;
  text: string;
  detail: string;
  at: string;
}

export interface Stop {
  kind: 'stop';
  name: string;
  zh: string;
  hours: string;
  note: string;
  at: string;
  city: City | null;
}

export interface HotelStop {
  kind: 'hotel';
  note: string;
  at: string;
}

export type RouteItem = Leg | Stop | HotelStop;

export interface TripDay {
  date: number;
  weekday: string;
  city: City;
  title: string;
  areas: string;
  start: string;
  headsUp: string;
  items: RouteItem[];
}

export interface Hotel {
  short: string;
  name: string;
  zh: string;
  near: string;
  nights: string;
}

export interface PrepItem {
  id: string;
  title: string;
  why: string;
}

export const CITY_NAMES: Record<City, string> = {
  sh: 'Shanghai',
  hk: 'Hong Kong'
};

export const HOTELS: Record<City, Hotel> = {
  sh: {
    short: 'Heyitang Hotel',
    name: 'Shanghai Hongqiao Heyitang Hotel (Beixinjing Subway Station Branch)',
    zh: '',
    near: 'Line 2 · Beixinjing · Exit 1, then a 5 min walk',
    nights: '6–11 Dec'
  },
  hk: {
    short: 'Empire Prestige',
    name: 'Empire Prestige Causeway Bay',
    zh: '香港皇悅卓越酒店',
    near: 'MTR · Tin Hau · Exit B',
    nights: '12 Dec'
  }
};

export const TAXI_PHRASES: Record<City, { zh: string; en: string }> = {
  sh: { zh: '师傅，请带我们去这里。', en: 'Driver, please take us here.' },
  hk: { zh: '唔該，我哋想去呢度。', en: 'Excuse me, we’d like to go here.' }
};

export const PREP: PrepItem[] = [
  { id: 'flight-pvg', title: 'Pudong flight time, Sat 12 Dec', why: 'The plan only says “go to PVG”, so we don’t know when to leave yet.' },
  { id: 'flight-hkg', title: 'Flight home from Hong Kong, Sun 13 Dec', why: 'We want to be at the airport by 9:00.' },
  { id: 'disney', title: 'Disneyland tickets for Mon 7 Dec', why: 'We’re there from 7:00 until the night show.' },
  { id: 'hotel-zh', title: 'Shanghai hotel name in Chinese', why: 'For the taxi card. It’s on the booking.' },
  { id: 'metro', title: 'Metro QR in Alipay or WeChat', why: 'Every Shanghai day runs on the metro.' },
  { id: 'octopus', title: 'Octopus card for Hong Kong', why: 'For the MTR on Saturday.' },
  { id: 'market', title: 'Rock Bund Christmas Market dates', why: 'Planned for Wed 9 Dec, 15:00–22:00.' }
];

export const TRIP_DAYS: TripDay[] = [
  {
    date: 6,
    weekday: 'Sun',
    city: 'sh',
    title: 'Hello, Shanghai',
    areas: 'Arrival · Hongqiao · Beixinjing',
    start: '18:45',
    headsUp: '',
    items: [
      stop('Hongqiao Airport, Terminal 2', { zh: '上海虹桥国际机场 T2航站楼', note: 'We land at 18:45', at: '18:45' }),
      leg('metro', 'Line 2 to Beixinjing', 'Exit 1 · 5 min walk'),
      hotel('Check in', '20:00'),
      stop('OR. SO Coffee Lab & Bar', { note: 'Near the hotel' }),
      stop('Feishu Pot Sticker (Zhaocheng Fubanghui)', { note: 'Dinner, or Shenmeng Shanghe' }),
      stop('Shenmeng Shanghe', { note: 'Dinner option two' })
    ]
  },
  {
    date: 7,
    weekday: 'Mon',
    city: 'sh',
    title: 'Disney day',
    areas: 'Shanghai Disneyland, all day',
    start: '06:00',
    headsUp: 'Park hours and the night show time can move. Check the Disney app the night before.',
    items: [
      leg('metro', 'Line 11 to Disney Resort', 'Exit 1 · no train ticket needed', '6:00'),
      stop('Shanghai Disneyland', { zh: '上海迪士尼乐园', note: 'Night show & castle photos', at: '7:00–21:30' }),
      leg('metro', 'Line 11 back', '', '22:00'),
      hotel('Home, tired & happy')
    ]
  },
  {
    date: 8,
    weekday: 'Tue',
    city: 'sh',
    title: 'Wukang to Tianzifang',
    areas: 'Wukang · Anfu · Middle Huaihai · Xintiandi · Tianzifang',
    start: '07:30',
    headsUp: 'The gelato at the end closes at 21:00, but the bar before it only opens at 18:30. Swap them if we want both.',
    items: [
      leg('metro', 'Line 11 to Jiaotong University', 'Exit 7 · leave the hotel around 7:30', '7:30'),
      stop('APOLI ITABAKERY', { hours: '9:00-21:00', note: 'Italian bread & cakes' }),
      stop('Wukang Building', { zh: '武康大楼' }),
      stop('Jiya GATHERING Coffee (Wukang Road)'),
      stop('Wukang Road', { zh: '武康路', note: 'History & culture street' }),
      leg('walk', 'Walk 11 min', 'to Anfu Road'),
      stop('13 DE MARZO Café (Anfu Road)', { hours: '10:00-21:30' }),
      stop('wiggle wiggle Flagship Store', { hours: '10:00-22:00' }),
      stop('Anfu Road', { zh: '安福路', note: 'Near Changshu Road metro' }),
      leg('walk', 'Walk 15 min'),
      stop('Wujin Century Building', { note: 'Yuy pop-up' }),
      leg('walk', 'Walk 20 min', 'to Middle Huaihai'),
      stop('GENTLE MONSTER · HAUS NOWHERE', { hours: '10:00-22:00' }),
      stop('UNIQLO Global Flagship (Huaihai Middle Road)'),
      stop('Songmont'),
      stop('Sit ! gelato'),
      stop('Metal HANDS'),
      stop('Guangmingcun Restaurant', { zh: '光明邨大酒家', hours: '7:30-14:00', note: 'Lunch option' }),
      stop('BSF Pastry', { hours: '9:00-22:00' }),
      stop('Matcha Wang · HAI550', { hours: '10:00-22:00' }),
      stop('MASONPRINCE Flagship Store', { hours: '10:00-22:00' }),
      stop('Muva.'),
      leg('walk', 'Walk 16 min to Xintiandi', 'or Line 10, Xintiandi, Exit 1'),
      stop('B&C Butter and Bread (New World)', { hours: '11:00-22:00' }),
      stop('Amo Shouzuo Zhencang (Xintiandi)', { hours: '9:00-22:00' }),
      leg('metro', 'Line 9 to Dapuqiao', 'Exit 1'),
      stop('Tianzifang', { zh: '田子坊' }),
      stop('Hengji Xuhui World', { note: 'Photo spot' }),
      leg('walk', 'Walk 4 min'),
      stop('Long Time Ago Mutton Shashlik', { note: 'Dinner · Dapuqiao Riyueguang branch' }),
      leg('walk', 'Walk 16 min', 'to the bar'),
      stop('Lingxu Ethereal Ruins (Shaoxing Road)', { hours: '18:30-2:00' }),
      leg('walk', 'Walk 12 min'),
      stop('Zhongyaotang GELATO (Xiangyang South Rd)', { hours: '13:00-21:00' }),
      hotel('Home')
    ]
  },
  {
    date: 9,
    weekday: 'Wed',
    city: 'sh',
    title: 'Jing’an to the Bund',
    areas: 'Jing’an · Nanjing Road · People’s Square · Rock Bund · Yuyuan',
    start: '07:30',
    headsUp: 'Lailai Xiaolong takes a break 14:00–15:00. And check the Rock Bund Christmas Market is on that day.',
    items: [
      leg('metro', 'Line 2 to Jiangsu Road', 'Exit 2'),
      stop('BASDBAN (Yuyuan Road)', { hours: '7:30-19:30' }),
      stop('bitmatcha'),
      stop('Yuyuan Road · The Art of Living Block', { zh: '愚园路' }),
      leg('metro', 'Line 2 to Jing’an Temple', 'Exit 1'),
      stop('Jing’an Temple', { zh: '静安寺', hours: '7:30-18:00' }),
      stop('Lailai Xiaolong (Jing’an)', { hours: '8:00-14:00,15:00-20:00', note: 'Lunch, or Renheguan next door' }),
      stop('Renheguan (Jing’ansi)', { note: 'Lunch option two' }),
      stop('AMAM LONBAKERY TOWN (Kerry Centre)'),
      leg('metro', 'Line 2 to Nanjing West Road', 'Exit 3'),
      stop('Starbucks Reserve Roastery', { zh: '星巴克臻选上海烘焙工坊' }),
      stop('LV Giant Ship'),
      stop('UNIQLO Nanjing West'),
      stop('Peijie Chongqing Hot Pot', { note: 'Modu flagship' }),
      leg('metro', 'Line 2 to People’s Square', 'Exit 19'),
      stop('LEGO · Shimao Plaza'),
      stop('M&M’s · Shimao Plaza'),
      stop('MINISO IP Paradise', { note: 'Global No.1 store' }),
      stop('Chiikawa Flagship Store', { hours: '10:00-22:00' }),
      stop('The vessel Bar', { hours: '9:30-6:00', note: 'Café' }),
      stop('Rock Bund Christmas Market', { hours: '15:00-22:00', note: 'Check the dates' }),
      stop('Dahuchun (Sichuan Middle Road)', { note: 'If we’re hungry' }),
      stop('The Bund', { zh: '外滩' }),
      leg('metro', 'Metro to Yuyuan', 'Exit 7'),
      stop('Yuyuan Old Street', { zh: '豫园老街', hours: '24h' }),
      stop('Honglou'),
      hotel('Home')
    ]
  },
  {
    date: 10,
    weekday: 'Thu',
    city: 'sh',
    title: 'North Bund & Duolun Road',
    areas: 'North Bund · Hongkou · Jade Buddha · 1000 Trees · Duolun Road',
    start: '06:30',
    headsUp: 'Early one: we’re at the North Bund by 6:30. Shiyan only opens 17:00–21:00.',
    items: [
      leg('metro', 'Line 12 to International Cruise Terminal', 'Exit 3', '6:30'),
      stop('North Bund Greenland & Little Giant Egg', { zh: '北外滩滨江绿地' }),
      stop('Jiulong Road', { note: 'Photo spot · Hongkou' }),
      stop('1933 Laoyangfang', { zh: '1933老场坊' }),
      leg('metro', 'Line 10 / 12 to Tiantong Road', 'Exit 3', '9:00'),
      stop('Shanghai Postal Museum', { zh: '上海邮政博物馆', at: '9:00–10:00' }),
      stop('Rui flower Coffee Bar'),
      leg('metro', 'Line 13 to Jiangning Road', 'Exit 3'),
      stop('Jade Buddha Temple', { zh: '玉佛禅寺' }),
      stop('M50 Creative Park', { zh: 'M50创意园' }),
      stop('1000 Trees', { zh: '天安千树' }),
      leg('metro', 'Line 10 to Hailun Road', 'Exit 7'),
      stop('Tian’ai Road', { zh: '甜爱路', note: 'The “sweet love” road. Ours, obviously.' }),
      stop('Duolun Road Cultural Street', { zh: '多伦路文化名人街' }),
      leg('metro', 'Line 8 to Huangxing Park', 'Exit 2'),
      stop('Shiyan', { hours: '17:00-21:00' }),
      hotel('Home')
    ]
  },
  {
    date: 11,
    weekday: 'Fri',
    city: 'sh',
    title: 'Zoo, Qibao & Longhua',
    areas: 'Shanghai Zoo · Qibao · Longhua Temple · AI Store',
    start: '08:00',
    headsUp: 'Lots of metro today. The AI Matrix Store is far out in Zhangjiang, so check it’s open before the detour.',
    items: [
      leg('metro', 'Line 10 to Shanghai Zoo', 'Exit 1 or 4', '8:00'),
      stop('Shanghai Zoo', { zh: '上海动物园', at: '8:00–10:00' }),
      stop('Jinri Niushi Chaoshan Beef Hot Pot (Hongjing Road)'),
      leg('metro', 'Line 9 to Qibao', 'Exit 4'),
      stop('Qibao Ancient Town', { zh: '七宝古镇' }),
      leg('walk', 'Walk 11 min'),
      stop('No.3 Warehouse Creativity China Cai', { note: 'Qibao branch' }),
      leg('metro', 'Line 11 to Longhua', 'Exit 4'),
      stop('Longhua Temple', { zh: '龙华寺' }),
      leg('metro', 'Line 13 to Xuelin Road', 'Exit 1'),
      stop('AI Matrix Store', { zh: '张江AI应用商店' }),
      leg('metro', 'Line 7 to Houtan', 'Exit 4'),
      stop('Shanghai Grand Opera House', { zh: '上海大歌剧院' }),
      leg('metro', 'Line 12 to South Shaanxi Road', 'Exit 10'),
      stop('Zhihe Crane by the Reeds', { hours: '19:00-2:00', note: 'Our last Shanghai night' }),
      hotel('Last night in Shanghai')
    ]
  },
  {
    date: 12,
    weekday: 'Sat',
    city: 'hk',
    title: 'Off to Hong Kong',
    areas: 'Pudong → Tin Hau · Kennedy Town · Central · Causeway Bay',
    start: '12:40',
    headsUp: 'Add our Pudong flight time. Lin Fa Kung closes at 17:00 and Tak Tou at 18:00, so do Tin Hau right after check-in.',
    items: [
      stop('Pudong International Airport', { zh: '上海浦东国际机场', note: 'Flight time to add', city: 'sh' }),
      leg('flight', 'Fly to Hong Kong'),
      stop('Hong Kong International Airport', { zh: '香港國際機場', note: 'We land at 12:40', at: '12:40' }),
      leg('metro', 'MTR to Tin Hau', 'Exit B'),
      hotel('Check in, drop the bags'),
      stop('滋味點', { hours: '7:00-21:00', note: 'Restaurant, or Tak Tou' }),
      stop('Tak Tou', { zh: '德島', hours: '8:00-18:00', note: 'Restaurant option two' }),
      stop('Tai Hang Lin Fa Kung', { zh: '大坑蓮花宮', hours: '7:30-17:00' }),
      leg('metro', 'MTR to Kennedy Town', 'Exit C'),
      stop('Winstons Coffee', { note: 'Café · photo spot' }),
      stop('% Arabica', { note: 'Café' }),
      stop('NOOK. Eggwaffle & Gelato'),
      stop('Silk. (Kennedy Town)', { zh: '絲茶 (堅尼地城)' }),
      stop('Belcher Bay Promenade', { zh: '卑路乍灣海濱長廊', note: 'View point' }),
      leg('metro', 'MTR to Central', 'Exit G'),
      stop('LANDMARK', { zh: '置地廣場', note: 'Photo spot' }),
      leg('walk', 'Walk 15 min'),
      stop('Central and Western District Promenade', { zh: '中西區海濱長廊' }),
      leg('metro', 'MTR to Causeway Bay', 'Exit F1'),
      stop('Bakehouse', { hours: '8:00-21:00', note: 'Café' }),
      stop('Hashtag B', { hours: '7:30-21:00', note: 'Café' }),
      stop('UNIQLO Lee Theatre', { hours: '-22:00' }),
      stop('Harbour Station', { zh: '海濱站', note: 'View point' }),
      leg('walk', 'Walk 11 min', 'back to the hotel'),
      hotel('Home')
    ]
  },
  {
    date: 13,
    weekday: 'Sun',
    city: 'hk',
    title: 'Homeward',
    areas: 'Causeway Bay → Hong Kong Airport',
    start: '07:00',
    headsUp: 'We need to be at the airport by 9:00. Leave the hotel with time to spare.',
    items: [
      hotel('Check out'),
      leg('transfer', 'Hotel to the airport', 'how we get there isn’t in the plan yet'),
      stop('Hong Kong International Airport', { zh: '香港國際機場', note: 'Be here by 9:00 · flight time to add', at: '9:00' })
    ]
  }
];

function leg (mode: LegMode, text: string, detail = '', at = ''): Leg {
  return { kind: 'leg', mode, text, detail, at };
}

function stop (name: string, extra: Partial<Omit<Stop, 'kind' | 'name'>> = {}): Stop {
  return {
    kind: 'stop',
    name,
    zh: extra.zh ?? '',
    hours: extra.hours ?? '',
    note: extra.note ?? '',
    at: extra.at ?? '',
    city: extra.city ?? null
  };
}

function hotel (note: string, at = ''): HotelStop {
  return { kind: 'hotel', note, at };
}
