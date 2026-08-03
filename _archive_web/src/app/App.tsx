import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast, Toaster } from "sonner";
import {
  Home, Grid3X3, Plus, Sparkles, User, Search,
  Sun, CloudRain, CloudSun, ChevronRight, ShoppingBag, BarChart2,
  Camera, Check, Send, RefreshCw, ChevronLeft, Bell,
  Shirt, MapPin, TrendingUp, Repeat, Zap, Eye,
  Tag, Layers, Palette, Hash, Star, Briefcase,
  Settings, CreditCard, HelpCircle, CheckCircle2, AlertCircle,
  MoreHorizontal, MessageSquare,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "home" | "closet" | "add" | "stylist" | "planning" | "shopping" | "stats" | "profile" | "more";
type NavTab = "home" | "closet" | "add" | "stylist" | "me";
type Status = "available" | "washing" | "borrowed";
interface ClothingItem {
  id: number; name: string; category: string; subcategory: string;
  color: string; colorHex: string; style: string; season: string;
  occasion: string; status: Status; brand: string; uses: number;
  img: string; tall?: boolean;
}
interface ChatMessage { id: number; role: "user" | "ai"; text: string; outfit?: OutfitCard; }
interface OutfitCard { top: ClothingItem; bottom: ClothingItem; shoe: ClothingItem; bag: ClothingItem; }

// ─── Data ─────────────────────────────────────────────────────────────────────
const WARDROBE: ClothingItem[] = [
  { id:1,  name:"Camisa linho branca",        category:"Tops",      subcategory:"Camisas",  color:"Branco",   colorHex:"#F5F0E8", style:"Casual elegante", season:"Verão",   occasion:"Trabalho", status:"available", brand:"Zara",           uses:12, img:"https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=600&h=750&fit=crop&auto=format", tall:true },
  { id:2,  name:"Blazer oversized camel",     category:"Outerwear", subcategory:"Blazers",  color:"Camel",    colorHex:"#C4956A", style:"Business casual",  season:"Outono",  occasion:"Trabalho", status:"available", brand:"COS",            uses:8,  img:"https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=750&fit=crop&auto=format", tall:true },
  { id:3,  name:"Calça wide leg preta",       category:"Bottoms",   subcategory:"Calças",   color:"Preto",    colorHex:"#1A1A1A", style:"Minimalista",      season:"Todos",   occasion:"Trabalho", status:"available", brand:"Arket",          uses:20, img:"https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=600&h=750&fit=crop&auto=format" },
  { id:4,  name:"Vestido midi listrado",      category:"Dresses",   subcategory:"Vestidos", color:"Azul",     colorHex:"#6B8E9F", style:"Casual",           season:"Verão",   occasion:"Social",   status:"available", brand:"Mango",          uses:5,  img:"https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=750&fit=crop&auto=format", tall:true },
  { id:5,  name:"Scarpin nude salto bloco",   category:"Shoes",     subcategory:"Saltos",   color:"Nude",     colorHex:"#C9A882", style:"Clássico",         season:"Todos",   occasion:"Trabalho", status:"available", brand:"Arezzo",         uses:15, img:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=600&fit=crop&auto=format" },
  { id:6,  name:"Trench coat bege",           category:"Outerwear", subcategory:"Casacos",  color:"Bege",     colorHex:"#C9B89A", style:"Clássico",         season:"Outono",  occasion:"Todos",    status:"available", brand:"Burberry",       uses:3,  img:"https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&h=750&fit=crop&auto=format", tall:true },
  { id:7,  name:"Bolsa couro cognac",         category:"Bags",      subcategory:"Bolsas",   color:"Cognac",   colorHex:"#8B5E3C", style:"Clássico",         season:"Todos",   occasion:"Trabalho", status:"available", brand:"Coach",          uses:18, img:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop&auto=format" },
  { id:8,  name:"Jeans slim indigo",          category:"Bottoms",   subcategory:"Jeans",    color:"Azul",     colorHex:"#3B5A7A", style:"Casual",           season:"Todos",   occasion:"Casual",   status:"borrowed",  brand:"Acne Studios",   uses:25, img:"https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop&auto=format" },
  { id:9,  name:"Blusa seda off-white",       category:"Tops",      subcategory:"Blusas",   color:"Off-white",colorHex:"#F0EDE5", style:"Elegante",         season:"Todos",   occasion:"Social",   status:"available", brand:"Vince",          uses:7,  img:"https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=750&fit=crop&auto=format", tall:true },
  { id:10, name:"Tênis chunky branco",        category:"Shoes",     subcategory:"Tênis",    color:"Branco",   colorHex:"#F5F5F5", style:"Casual",           season:"Verão",   occasion:"Casual",   status:"available", brand:"New Balance",    uses:30, img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=500&fit=crop&auto=format" },
  { id:11, name:"Saia midi plissada creme",   category:"Bottoms",   subcategory:"Saias",    color:"Creme",    colorHex:"#E8E0D0", style:"Romântico",        season:"Primavera",occasion:"Social",  status:"washing",   brand:"Reformation",    uses:4,  img:"https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=750&fit=crop&auto=format", tall:true },
  { id:12, name:"Ankle boot couro preto",     category:"Shoes",     subcategory:"Boots",    color:"Preto",    colorHex:"#1A1A1A", style:"Clássico",         season:"Outono",  occasion:"Todos",    status:"available", brand:"Stuart Weitzman",uses:22, img:"https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&h=500&fit=crop&auto=format" },
];

const TODAY_LOOK: OutfitCard = { top: WARDROBE[0], bottom: WARDROBE[2], shoe: WARDROBE[4], bag: WARDROBE[6] };

const OCCASIONS = [
  { id:"trabalho",   emoji:"👔", label:"Trabalho",    look: WARDROBE[0] },
  { id:"reuniao",    emoji:"🤝", label:"Reunião",     look: WARDROBE[1] },
  { id:"homeoffice", emoji:"🏠", label:"Home Office", look: WARDROBE[8] },
  { id:"happyhour",  emoji:"🍻", label:"Happy Hour",  look: WARDROBE[3] },
  { id:"encontro",   emoji:"❤️", label:"Encontro",    look: WARDROBE[3] },
  { id:"praia",      emoji:"🏖️", label:"Praia",       look: WARDROBE[3] },
  { id:"viagem",     emoji:"✈️", label:"Viagem",      look: WARDROBE[5] },
  { id:"evento",     emoji:"🎉", label:"Evento",      look: WARDROBE[3] },
  { id:"livre",      emoji:"✨", label:"Livre",       look: WARDROBE[9] },
] as const;
type OccasionId = typeof OCCASIONS[number]["id"];

interface DayPlan { day: string; date: string; weather: string; temp: number; occasionId: OccasionId; }

const INITIAL_DAYS: DayPlan[] = [
  { day:"Dom", date:"27", weather:"☀️", temp:25, occasionId:"livre" },
  { day:"Seg", date:"28", weather:"☀️", temp:23, occasionId:"trabalho" },
  { day:"Ter", date:"29", weather:"⛅", temp:20, occasionId:"reuniao" },
  { day:"Qua", date:"30", weather:"🌤", temp:22, occasionId:"homeoffice" },
  { day:"Qui", date:"31", weather:"☁️", temp:18, occasionId:"trabalho" },
  { day:"Sex", date:"01", weather:"🌧", temp:16, occasionId:"happyhour" },
  { day:"Sáb", date:"02", weather:"☀️", temp:27, occasionId:"evento" },
];

const CHAT_INITIAL: ChatMessage[] = [
  { id:1, role:"ai", text:"Olá, Nayara. Sou sua stylist pessoal. Como posso te ajudar hoje?" },
  { id:2, role:"user", text:"Monte um look para uma reunião importante amanhã." },
  { id:3, role:"ai", text:"Para amanhã, 20° em São Paulo, recomendo:", outfit: TODAY_LOOK },
];

const AI_RESPONSES = [
  { text:"Para um toque mais sofisticado, experimente essa combinação:", outfit: { top:WARDROBE[0], bottom:WARDROBE[2], shoe:WARDROBE[4], bag:WARDROBE[6] } },
  { text:"Um look tonal que funciona muito bem para o seu estilo:", outfit: { top:WARDROBE[8], bottom:WARDROBE[2], shoe:WARDROBE[11], bag:WARDROBE[6] } },
  { text:"Para um dia mais casual sem perder a elegância:", outfit: { top:WARDROBE[1], bottom:WARDROBE[2], shoe:WARDROBE[4], bag:WARDROBE[6] } },
];

const SHOPPING_RECS = [
  { id:1, name:"Blazer estruturado preto",  brand:"The Row",  price:"R$ 890", store:"Farfetch", img:"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=640&fit=crop&auto=format", impact:"+31%" },
  { id:2, name:"Mule de couro bege",        brand:"Toteme",   price:"R$ 620", store:"SSENSE",   img:"https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=500&h=500&fit=crop&auto=format", impact:"+24%" },
  { id:3, name:"Cardigan oversized creme",  brand:"Arket",    price:"R$ 380", store:"Arket",    img:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=640&fit=crop&auto=format", impact:"+19%" },
];

const STATS_CATEGORY = [
  { name:"Tops",      value:24, fill:"#1C1917" },
  { name:"Bottoms",   value:18, fill:"#C4A97D" },
  { name:"Vestidos",  value:12, fill:"#8C8278" },
  { name:"Outerwear", value:8,  fill:"#C4B8A8" },
  { name:"Sapatos",   value:15, fill:"#D9D1C7" },
  { name:"Bolsas",    value:6,  fill:"#EDE8E2" },
];

const STATS_USAGE = [
  { m:"Mar", v:12 }, { m:"Abr", v:19 }, { m:"Mai", v:15 },
  { m:"Jun", v:22 }, { m:"Jul", v:18 }, { m:"Ago", v:26 },
];

const FILTER_CHIPS = ["Todos", "Tops", "Bottoms", "Vestidos", "Outerwear", "Sapatos", "Bolsas"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const cn = (...c: (string | undefined | false)[]) => c.filter(Boolean).join(" ");
const getOccasion = (id: OccasionId) => OCCASIONS.find(o => o.id === id)!;

const StatusBadge = ({ status }: { status: Status }) => {
  const map: Record<Status, { label: string; cls: string }> = {
    available: { label:"Disponível", cls:"text-emerald-600 bg-emerald-50" },
    washing:   { label:"Lavando",    cls:"text-amber-600  bg-amber-50"   },
    borrowed:  { label:"Emprestada", cls:"text-sky-600    bg-sky-50"     },
  };
  const { label, cls } = map[status];
  return <span className={cn("text-[9px] font-medium px-2 py-0.5 rounded-full font-['DM_Mono'] tracking-wide", cls)}>{label}</span>;
};

const PhoneStatus = () => (
  <div className="flex items-center justify-between px-6 pt-3 pb-1">
    <span className="text-[11px] font-['DM_Mono'] text-[#1C1917]">9:41</span>
    <div className="flex items-center gap-1.5">
      <div className="flex gap-[2px] items-end h-3">
        {[2,3,4,4].map((h,i) => <div key={i} className="w-[3px] bg-[#1C1917] rounded-[1px]" style={{height:`${h*3}px`}} />)}
      </div>
      <svg width="15" height="11" viewBox="0 0 15 11" fill="none"><rect x=".5" y=".5" width="11" height="10" rx="2.5" stroke="#1C1917"/><rect x="12" y="3.5" width="2" height="4" rx="1" fill="#1C1917"/><rect x="1.5" y="1.5" width="9" height="8" rx="2" fill="#1C1917"/></svg>
    </div>
  </div>
);

const WeatherLine = ({ weather, temp }: { weather: string; temp?: number }) => (
  <p className="text-[13px] font-['DM_Sans'] text-[#8C8278] flex items-center gap-1.5">
    <span>{weather}</span>
    {temp && <span className="font-['DM_Mono']">{temp}°</span>}
    <span>·</span>
    <span>São Paulo</span>
  </p>
);

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ onNavigate }: { onNavigate:(s:Screen)=>void }) {
  return (
    <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">

      {/* Greeting */}
      <div className="px-6 pt-6 pb-0">
        <p className="text-[11px] font-['DM_Mono'] text-[#8C8278] tracking-widest uppercase mb-1">Bom dia</p>
        <h1 className="font-['Playfair_Display'] text-[34px] font-semibold leading-none text-[#1C1917] mb-2">Nayara</h1>
        <WeatherLine weather="☀️" temp={18} />
      </div>

      {/* Look de hoje */}
      <div className="px-6 mt-10">
        <h2 className="font-['Playfair_Display'] text-[22px] font-medium text-[#1C1917] mb-5">Look de hoje</h2>

        <div className="bg-white rounded-[24px] overflow-hidden">
          {/* Hero image */}
          <div className="relative">
            <img
              src={TODAY_LOOK.top.img}
              alt={TODAY_LOOK.top.name}
              className="w-full object-cover"
              style={{ height: 300 }}
            />
            {/* Occasion tag */}
            <div className="absolute top-4 left-4">
              <span className="bg-white/90 backdrop-blur-sm text-[#1C1917] text-[11px] font-['DM_Sans'] font-medium px-3 py-1.5 rounded-full">
                👔 Trabalho · Reunião
              </span>
            </div>
          </div>

          {/* 4 pieces row */}
          <div className="p-5">
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { label:"Superior", item:TODAY_LOOK.top },
                { label:"Inferior", item:TODAY_LOOK.bottom },
                { label:"Sapato",   item:TODAY_LOOK.shoe },
                { label:"Bolsa",    item:TODAY_LOOK.bag },
              ].map(({ label, item }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div className="rounded-[14px] overflow-hidden bg-[#F2EDE6] w-full aspect-square">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-['DM_Mono'] text-[#8C8278]">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toast("Look completo", { description: "Camisa linho + calça wide leg + scarpin + bolsa cognac" })}
                className="flex-1 bg-[#1C1917] text-white text-[13px] font-['DM_Sans'] font-medium py-3 rounded-2xl">
                Ver look completo
              </button>
              <button
                onClick={() => toast.success("Novo look gerado")}
                className="w-12 h-12 border border-[#1C1917]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <RefreshCw size={15} className="text-[#8C8278]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Esta semana */}
      <div className="mt-12 px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-['Playfair_Display'] text-[22px] font-medium text-[#1C1917]">Esta semana</h2>
          <button onClick={() => onNavigate("planning")} className="text-[12px] font-['DM_Sans'] text-[#8C8278] flex items-center gap-1">
            Planejar <ChevronRight size={13} />
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-6 px-6">
          {INITIAL_DAYS.slice(1, 6).map((d, i) => {
            const occ = getOccasion(d.occasionId);
            const isToday = i === 1;
            return (
              <div key={d.day} onClick={() => onNavigate("planning")}
                className={cn("flex-shrink-0 flex flex-col rounded-[20px] overflow-hidden cursor-pointer transition-all", isToday ? "ring-2 ring-[#C4A97D]" : "")}>
                {/* Day header */}
                <div className={cn("px-3 pt-2.5 pb-1.5 text-center", isToday ? "bg-[#1C1917]" : "bg-white")}>
                  <p className={cn("text-[9px] font-['DM_Mono'] uppercase tracking-wider", isToday ? "text-white/50" : "text-[#8C8278]")}>{d.day}</p>
                  <p className={cn("text-[11px] font-['DM_Mono'] font-semibold", isToday ? "text-white" : "text-[#1C1917]")}>{d.temp}°</p>
                </div>
                {/* Look thumbnail */}
                <div className="w-[64px]">
                  <img src={occ.look.img} alt="" className="w-full object-cover" style={{ height: 72 }} />
                </div>
                {/* Occasion chip */}
                <div className={cn("px-2 py-2 flex items-center justify-center", isToday ? "bg-[#1C1917]" : "bg-white")}>
                  <span className="text-[12px] leading-none">{occ.emoji}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtle secondary row */}
      <div className="px-6 mt-12 space-y-3">
        <button onClick={() => onNavigate("shopping")} className="w-full bg-white rounded-[20px] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F8F2E8] rounded-xl flex items-center justify-center">
              <ShoppingBag size={14} className="text-[#C4A97D]" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-['DM_Sans'] font-medium text-[#1C1917]">3 sugestões de compra</p>
              <p className="text-[11px] font-['DM_Sans'] text-[#8C8278]">Peças para completar seu estilo</p>
            </div>
          </div>
          <ChevronRight size={15} className="text-[#C4B8A8]" />
        </button>

        <button onClick={() => onNavigate("stats")} className="w-full bg-white rounded-[20px] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F2EDE6] rounded-xl flex items-center justify-center">
              <BarChart2 size={14} className="text-[#8C8278]" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-['DM_Sans'] font-medium text-[#1C1917]">83 peças · 312 combinações</p>
              <p className="text-[11px] font-['DM_Sans'] text-[#8C8278]">Ver estatísticas completas</p>
            </div>
          </div>
          <ChevronRight size={15} className="text-[#C4B8A8]" />
        </button>
      </div>

    </div>
  );
}

// ─── Closet Screen ────────────────────────────────────────────────────────────
function ClosetScreen() {
  const [search, setSearch]       = useState("");
  const [activeFilter, setFilter] = useState("Todos");

  const filtered = WARDROBE.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q);
    const matchFilter = activeFilter === "Todos"
      || (activeFilter === "Tops"      && item.category === "Tops")
      || (activeFilter === "Bottoms"   && item.category === "Bottoms")
      || (activeFilter === "Vestidos"  && item.category === "Dresses")
      || (activeFilter === "Outerwear" && item.category === "Outerwear")
      || (activeFilter === "Sapatos"   && item.category === "Shoes")
      || (activeFilter === "Bolsas"    && item.category === "Bags");
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden pb-20">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-['Playfair_Display'] text-[28px] font-semibold text-[#1C1917]">Guarda-Roupa</h1>
          <span className="font-['DM_Mono'] text-[11px] text-[#8C8278] bg-[#F2EDE6] px-2.5 py-1 rounded-full">{WARDROBE.length}</span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 mb-4">
          <Search size={14} className="text-[#C4B8A8]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar peça, marca, cor..."
            className="flex-1 text-[13px] font-['DM_Sans'] text-[#1C1917] placeholder-[#C4B8A8] bg-transparent outline-none"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTER_CHIPS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3.5 py-1.5 rounded-full text-[12px] font-['DM_Sans'] font-medium whitespace-nowrap transition-all",
                activeFilter === f ? "bg-[#1C1917] text-white" : "bg-white text-[#8C8278]")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 scrollbar-hide">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center pt-16">
            <p className="font-['Playfair_Display'] italic text-lg text-[#8C8278]">Nenhuma peça encontrada</p>
          </div>
        ) : (
          <div className="columns-2 gap-3 pb-4">
            {filtered.map(item => (
              <div key={item.id} className="break-inside-avoid mb-3 bg-white rounded-[20px] overflow-hidden group cursor-pointer">
                <div className="relative overflow-hidden">
                  <img src={item.img} alt={item.name}
                    className={cn("w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]", item.tall ? "h-52" : "h-36")} />
                  <div className="absolute top-2.5 right-2.5"><StatusBadge status={item.status} /></div>
                </div>
                <div className="px-3 py-3">
                  <p className="text-[12px] font-['DM_Sans'] font-medium text-[#1C1917] leading-tight">{item.name}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.colorHex }} />
                    <p className="text-[10px] font-['DM_Mono'] text-[#8C8278]">{item.brand}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Clothing Screen ──────────────────────────────────────────────────────
const AI_ATTRS = [
  { label:"Categoria", value:"Tops — Blusas",               icon: Tag      },
  { label:"Cor",       value:"Preto com detalhes off-white", icon: Palette  },
  { label:"Estilo",    value:"Elegante / Minimalista",       icon: Star     },
  { label:"Tecido",    value:"Seda / Viscose",               icon: Layers   },
  { label:"Estação",   value:"Todos os anos",                icon: Sun      },
  { label:"Ocasião",   value:"Trabalho, Social, Eventos",    icon: Briefcase},
  { label:"Marca",     value:"Theory",                       icon: Hash     },
];

function AddClothingScreen({ onBack }: { onBack:()=>void }) {
  const [phase, setPhase] = useState<0|1|2|3>(0);
  const [progress, setProgress] = useState(0);

  const startScan = () => {
    setPhase(1); let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) { clearInterval(iv); setTimeout(() => setPhase(2), 300); p = 100; }
      setProgress(Math.min(p, 100));
    }, 160);
  };

  const confirm = () => {
    setPhase(3);
    setTimeout(() => { setPhase(0); setProgress(0); onBack(); }, 2200);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-4 pb-5 flex items-center gap-4">
        <button onClick={onBack} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-[0_1px_8px_rgba(28,25,23,0.07)]">
          <ChevronLeft size={17} className="text-[#1C1917]" />
        </button>
        <div>
          <h1 className="font-['Playfair_Display'] text-[22px] font-semibold text-[#1C1917]">Adicionar peça</h1>
          <p className="text-[11px] font-['DM_Sans'] text-[#8C8278]">A IA identifica automaticamente</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 scrollbar-hide">
        <AnimatePresence mode="wait">

          {/* Phase 0 – Camera */}
          {phase === 0 && (
            <motion.div key="cam" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <div className="bg-[#1C1917] rounded-[24px] overflow-hidden relative mb-6" style={{ height:320 }}>
                <img src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&h=700&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-sm bg-white/10">
                    <Camera size={26} className="text-white" />
                  </div>
                  <p className="text-white/80 text-[13px] font-['DM_Sans']">Toque para fotografar</p>
                </div>
                {/* Corner guides */}
                {[["top-4","left-4"],["top-4","right-4"],["bottom-4","left-4"],["bottom-4","right-4"]].map(([t, l], i) => (
                  <div key={i} className={`absolute ${t} ${l} w-5 h-5`} style={{ border:"1.5px solid rgba(255,255,255,0.5)", borderRadius:3, borderStyle:"solid", borderRightColor: i===0||i===2 ? "transparent":"rgba(255,255,255,0.5)", borderLeftColor: i===1||i===3 ? "transparent":"rgba(255,255,255,0.5)", borderBottomColor: i===0||i===1 ? "transparent":"rgba(255,255,255,0.5)", borderTopColor: i===2||i===3 ? "transparent":"rgba(255,255,255,0.5)" }} />
                ))}
              </div>
              <button onClick={startScan} className="w-full bg-[#1C1917] text-white font-['DM_Sans'] font-medium py-4 rounded-2xl text-[14px]">
                Fotografar agora
              </button>
              <button
                onClick={() => toast("Galeria", { description: "Selecione uma foto da sua galeria" })}
                className="w-full mt-3 text-center text-[11px] font-['DM_Sans'] text-[#8C8278]">
                Ou enviar da galeria
              </button>
            </motion.div>
          )}

          {/* Phase 1 – Scanning */}
          {phase === 1 && (
            <motion.div key="scan" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="text-center pt-8">
              <div className="relative w-44 h-44 mx-auto mb-10">
                <img src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop&auto=format" alt="" className="w-full h-full object-cover rounded-[24px]" />
                <motion.div className="absolute left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#C4A97D] to-transparent"
                  animate={{ top:["16px","calc(100% - 16px)","16px"] }} transition={{ duration:2, repeat:Infinity, ease:"linear" }} />
                <div className="absolute inset-0 rounded-[24px] ring-2 ring-[#C4A97D]/30" />
              </div>
              <h2 className="font-['Playfair_Display'] text-[22px] font-medium text-[#1C1917] mb-2">Analisando…</h2>
              <p className="text-[13px] font-['DM_Sans'] text-[#8C8278] mb-8">A IA está identificando sua peça</p>
              <div className="bg-[#F2EDE6] rounded-full h-1 overflow-hidden mx-8">
                <motion.div className="h-full bg-[#C4A97D] rounded-full" style={{ width:`${progress}%` }} />
              </div>
              <p className="font-['DM_Mono'] text-[11px] text-[#C4A97D] mt-2">{Math.round(progress)}%</p>
            </motion.div>
          )}

          {/* Phase 2 – Results */}
          {phase === 2 && (
            <motion.div key="results" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
              <div className="flex items-start gap-4 mb-6">
                <img src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=240&h=300&fit=crop&auto=format" alt="" className="w-24 h-32 object-cover rounded-[18px] flex-shrink-0" />
                <div className="pt-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={12} className="text-[#C4A97D]" />
                    <span className="text-[11px] font-['DM_Sans'] text-[#C4A97D] font-medium">Identificado · 97%</span>
                  </div>
                  <h3 className="font-['Playfair_Display'] text-xl font-semibold text-[#1C1917] leading-tight">Blusa de seda preta</h3>
                  <p className="text-[12px] font-['DM_Sans'] text-[#8C8278] mt-1">Theory · Tops</p>
                </div>
              </div>

              <div className="bg-white rounded-[20px] overflow-hidden mb-5">
                {AI_ATTRS.map(({ label, value, icon:I }, idx) => (
                  <div key={label} className={cn("flex items-center gap-3 px-4 py-3", idx < AI_ATTRS.length-1 ? "border-b border-[#1C1917]/05" : "")}>
                    <I size={14} className="text-[#C4B8A8] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-['DM_Mono'] text-[#8C8278] uppercase tracking-wider">{label}</p>
                      <p className="text-[13px] font-['DM_Sans'] font-medium text-[#1C1917] truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={confirm} className="w-full bg-[#1C1917] text-white font-['DM_Sans'] font-medium py-4 rounded-2xl text-[14px] flex items-center justify-center gap-2">
                <Check size={15} /> Confirmar e adicionar
              </button>
              <button
                onClick={() => toast("Editar informações", { description: "Ajuste categoria, cor e detalhes da peça" })}
                className="w-full mt-2 text-[#8C8278] font-['DM_Sans'] text-[13px] py-2">
                Editar informações
              </button>
            </motion.div>
          )}

          {/* Phase 3 – Success */}
          {phase === 3 && (
            <motion.div key="ok" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="flex flex-col items-center justify-center py-20 text-center">
              <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", delay:0.15 }}
                className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={36} className="text-emerald-500" />
              </motion.div>
              <h2 className="font-['Playfair_Display'] text-2xl font-semibold text-[#1C1917] mb-1">Pronto.</h2>
              <p className="text-[13px] font-['DM_Sans'] text-[#8C8278]">Sua peça foi adicionada ao guarda-roupa.</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Stylist Screen ───────────────────────────────────────────────────────────
function StylistScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_INITIAL);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { id:Date.now(), role:"user", text:input }]);
    setInput(""); setLoading(true);
    setTimeout(() => {
      const r = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
      setMessages(m => [...m, { id:Date.now()+1, role:"ai", text:r.text, outfit:r.outfit }]);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
    }, 1600);
  };

  const QUICK = ["O que vestir amanhã?","Look para casamento","Vou viajar","Mais elegante"];

  return (
    <div className="flex-1 flex flex-col overflow-hidden pb-20">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#1C1917]/05">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1C1917] rounded-2xl flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-[#C4A97D]" />
          </div>
          <div>
            <h1 className="font-['Playfair_Display'] text-[20px] font-semibold text-[#1C1917]">IA Stylist</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <p className="text-[11px] font-['DM_Sans'] text-[#8C8278]">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-hide">
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start gap-2.5")}>
            {msg.role === "ai" && (
              <div className="w-7 h-7 bg-[#1C1917] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles size={11} className="text-[#C4A97D]" />
              </div>
            )}
            <div className={cn("max-w-[82%] flex flex-col gap-3", msg.role === "user" ? "items-end" : "items-start")}>
              <div className={cn("px-4 py-3 rounded-2xl text-[13px] font-['DM_Sans'] leading-relaxed",
                msg.role === "user"
                  ? "bg-[#1C1917] text-white rounded-tr-sm"
                  : "bg-white text-[#1C1917] rounded-tl-sm")}>
                {msg.text}
              </div>

              {msg.outfit && (
                <div className="bg-white rounded-[20px] overflow-hidden w-full">
                  <div className="grid grid-cols-4 gap-px bg-[#F2EDE6]">
                    {[
                      { label:"Top",    item:msg.outfit.top  },
                      { label:"Bottom", item:msg.outfit.bottom },
                      { label:"Sapato", item:msg.outfit.shoe },
                      { label:"Bolsa",  item:msg.outfit.bag  },
                    ].map(({ label, item }) => (
                      <div key={label} className="bg-white">
                        <img src={item.img} alt={item.name} className="w-full object-cover" style={{ height:76 }} />
                        <p className="text-[8px] font-['DM_Mono'] text-[#8C8278] text-center py-1.5 uppercase tracking-wide">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 flex gap-2">
                    <button
                      onClick={() => toast.success("Look salvo no planejamento")}
                      className="flex-1 bg-[#1C1917] text-white text-[11px] font-['DM_Sans'] font-medium py-2 rounded-xl">
                      Salvar look
                    </button>
                    <button
                      onClick={() => toast("Trocar peças", { description: "Escolha outras opções do seu guarda-roupa" })}
                      className="flex-1 border border-[#1C1917]/10 text-[#1C1917] text-[11px] font-['DM_Sans'] font-medium py-2 rounded-xl">
                      Trocar peças
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 bg-[#1C1917] rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={11} className="text-[#C4A97D]" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3.5 flex gap-1.5">
              {[0,0.2,0.4].map((d,i) => (
                <motion.div key={i} className="w-1.5 h-1.5 bg-[#C4A97D] rounded-full"
                  animate={{ scale:[1,1.5,1] }} transition={{ duration:0.7, repeat:Infinity, delay:d }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick chips */}
      {messages.length <= 3 && (
        <div className="px-5 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {QUICK.map(q => (
              <button key={q} onClick={() => setInput(q)}
                className="whitespace-nowrap bg-white border border-[#1C1917]/08 text-[#1C1917] text-[11px] font-['DM_Sans'] font-medium px-3 py-2 rounded-xl flex-shrink-0">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-5 pb-2">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()}
            placeholder="Pergunte para sua stylist…"
            className="flex-1 text-[13px] font-['DM_Sans'] text-[#1C1917] placeholder-[#C4B8A8] bg-transparent outline-none" />
          <button onClick={send} disabled={!input.trim()}
            className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
              input.trim() ? "bg-[#1C1917]" : "bg-[#F2EDE6]")}>
            <Send size={13} className={input.trim() ? "text-white" : "text-[#C4B8A8]"} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Planning Screen ──────────────────────────────────────────────────────────
function PlanningScreen({ onBack }: { onBack:()=>void }) {
  const [days, setDays] = useState<DayPlan[]>(INITIAL_DAYS);
  const [selected, setSelected] = useState(1);
  const [sheetFor, setSheetFor] = useState<number|null>(null);

  const setOccasion = (idx: number, id: OccasionId) => {
    setDays(prev => prev.map((d, i) => i===idx ? { ...d, occasionId:id } : d));
    setSheetFor(null);
  };

  const day = days[selected];
  const occ = getOccasion(day.occasionId);

  const WeatherIcon = ({ w }: { w:string }) => {
    if (w==="🌧") return <CloudRain size={12} className="text-sky-400" />;
    if (w==="⛅") return <CloudSun  size={12} className="text-[#C4A97D]" />;
    if (w==="☁️") return <CloudRain size={12} className="text-[#8C8278]" />;
    return <Sun size={12} className="text-[#C4A97D]" />;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden pb-20 relative">
      {/* Header */}
      <div className="px-6 pt-4 pb-6 flex items-center gap-4">
        <button onClick={onBack} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-[0_1px_8px_rgba(28,25,23,0.07)]">
          <ChevronLeft size={17} />
        </button>
        <div>
          <h1 className="font-['Playfair_Display'] text-[22px] font-semibold text-[#1C1917]">Esta semana</h1>
          <p className="text-[11px] font-['DM_Sans'] text-[#8C8278] flex items-center gap-1">
            <MapPin size={10} /> São Paulo · Toque na ocasião para trocar
          </p>
        </div>
      </div>

      {/* Week strip */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {days.map((d, i) => {
            const o = getOccasion(d.occasionId);
            const isSel = i === selected;
            return (
              <div key={i} className="flex-shrink-0 flex flex-col items-center cursor-pointer" onClick={() => setSelected(i)}>
                {/* Card */}
                <div className={cn("w-[58px] rounded-[18px] overflow-hidden transition-all duration-200",
                  isSel ? "ring-2 ring-[#C4A97D] shadow-[0_4px_20px_rgba(196,169,125,0.25)]" : "opacity-70")}>
                  {/* Day + temp */}
                  <div className={cn("px-2 pt-2.5 pb-1.5 text-center", isSel ? "bg-[#1C1917]" : "bg-white")}>
                    <p className={cn("text-[9px] font-['DM_Mono'] uppercase tracking-wider leading-none mb-1",
                      isSel ? "text-white/50" : "text-[#8C8278]")}>{d.day}</p>
                    <div className="flex items-center justify-center gap-1">
                      <WeatherIcon w={d.weather} />
                      <span className={cn("text-[10px] font-['DM_Mono'] font-semibold", isSel ? "text-white" : "text-[#1C1917]")}>{d.temp}°</span>
                    </div>
                  </div>
                  {/* Look thumbnail */}
                  <img src={o.look.img} alt="" className="w-full object-cover" style={{ height:68 }} />
                  {/* Occasion chip */}
                  <button
                    onClick={e => { e.stopPropagation(); setSelected(i); setSheetFor(i); }}
                    className={cn("w-full flex items-center justify-center gap-1 py-2 transition-colors",
                      isSel ? "bg-[#C4A97D]/15" : "bg-white")}>
                    <span className="text-[13px] leading-none">{o.emoji}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      <div className="flex-1 overflow-y-auto px-6 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div key={selected} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.16 }}>
            {/* Day look card */}
            <div className="bg-white rounded-[24px] overflow-hidden mb-4">
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div>
                  <p className="font-['Playfair_Display'] text-[20px] font-semibold text-[#1C1917]">{day.day}, {day.date}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => setSheetFor(selected)}
                      className="flex items-center gap-1.5 bg-[#F8F2E8] border border-[#C4A97D]/20 text-[#8A6F3E] px-3 py-1.5 rounded-full active:scale-95 transition-transform">
                      <span className="text-[14px] leading-none">{occ.emoji}</span>
                      <span className="text-[11px] font-['DM_Sans'] font-medium">{occ.label}</span>
                    </button>
                    <span className="font-['DM_Mono'] text-[12px] text-[#C4A97D]">{day.temp}°C</span>
                  </div>
                </div>
                <button
                  onClick={() => toast("Editar look", { description: "Personalize as peças deste dia" })}
                  className="text-[12px] font-['DM_Sans'] text-[#8C8278] border border-[#1C1917]/10 px-3 py-1.5 rounded-xl">
                  Editar
                </button>
              </div>

              <div className="relative mx-5">
                <img src={occ.look.img} alt={occ.look.name} className="w-full object-cover rounded-[18px]" style={{ height:220 }} />
                <div className="absolute bottom-3 left-3 right-3 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2">
                  <Sparkles size={11} className="text-[#C4A97D] flex-shrink-0" />
                  <p className="text-white text-[11px] font-['DM_Sans']">Look adaptado para <strong>{occ.label}</strong></p>
                </div>
              </div>

              <div className="px-5 pt-3 pb-5">
                <p className="text-[13px] font-['DM_Sans'] font-medium text-[#1C1917]">{occ.look.name}</p>
                <p className="text-[11px] font-['DM_Sans'] text-[#8C8278] mt-0.5">{occ.look.brand} · {occ.look.style}</p>
              </div>
            </div>

            {/* Reutilização */}
            <div className="bg-white rounded-[20px] p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={13} className="text-[#C4A97D]" />
                <p className="text-[13px] font-['DM_Sans'] font-medium text-[#1C1917]">Reutilização inteligente</p>
              </div>
              {[
                { name:"Variedade de peças", pct:80 },
                { name:"Repetições evitadas", pct:85 },
              ].map(({ name, pct }) => (
                <div key={name} className="mb-3 last:mb-0">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[12px] font-['DM_Sans'] text-[#8C8278]">{name}</span>
                    <span className="font-['DM_Mono'] text-[11px] text-[#C4A97D]">{pct}%</span>
                  </div>
                  <div className="h-1 bg-[#F2EDE6] rounded-full overflow-hidden">
                    <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ delay:0.2, duration:0.8 }}
                      className="h-full bg-[#C4A97D] rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {sheetFor !== null && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="absolute inset-0 bg-black/30 z-40" onClick={() => setSheetFor(null)} />
            <motion.div initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
              transition={{ type:"spring", damping:32, stiffness:320 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] z-50 pb-8">
              <div className="flex justify-center pt-3 mb-1"><div className="w-9 h-1 bg-[#F2EDE6] rounded-full" /></div>
              <div className="px-6 pt-2 pb-4">
                <p className="font-['Playfair_Display'] text-[18px] font-semibold text-[#1C1917]">
                  {sheetFor !== null ? days[sheetFor].day : ""}, {sheetFor !== null ? days[sheetFor].date : ""}
                </p>
                <p className="text-[11px] font-['DM_Sans'] text-[#8C8278] mt-0.5">A IA adapta o look automaticamente</p>
              </div>
              <div className="px-5 grid grid-cols-3 gap-2">
                {OCCASIONS.map(o => {
                  const isSel = sheetFor !== null && days[sheetFor].occasionId === o.id;
                  return (
                    <button key={o.id} onClick={() => sheetFor !== null && setOccasion(sheetFor, o.id)}
                      className={cn("flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-[18px] border-2 transition-all active:scale-95",
                        isSel ? "border-[#C4A97D] bg-[#F8F2E8]" : "border-transparent bg-[#F9F6F2]")}>
                      <span className="text-[22px] leading-none">{o.emoji}</span>
                      <span className={cn("text-[11px] font-['DM_Sans'] font-medium", isSel ? "text-[#8A6F3E]" : "text-[#1C1917]")}>{o.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shopping Screen ──────────────────────────────────────────────────────────
function ShoppingScreen({ onBack }: { onBack:()=>void }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden pb-20">
      <div className="px-6 pt-4 pb-6 flex items-center gap-4">
        <button onClick={onBack} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-[0_1px_8px_rgba(28,25,23,0.07)]">
          <ChevronLeft size={17} />
        </button>
        <div>
          <h1 className="font-['Playfair_Display'] text-[22px] font-semibold text-[#1C1917]">Compras</h1>
          <p className="text-[11px] font-['DM_Sans'] text-[#8C8278]">Selecionado pela IA para o seu estilo</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 scrollbar-hide">
        {/* Gap analysis — subtle, not dominant */}
        <div className="bg-white rounded-[20px] p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={13} className="text-[#C4A97D]" />
            <p className="text-[13px] font-['DM_Sans'] font-medium text-[#1C1917]">Lacunas no guarda-roupa</p>
          </div>
          {[
            { label:"Blazers", have:1, need:3 },
            { label:"Sapatos formais", have:2, need:5 },
            { label:"Bases neutras", have:4, need:8 },
          ].map(({ label, have, need }) => (
            <div key={label} className="mb-3 last:mb-0">
              <div className="flex justify-between mb-1.5">
                <span className="text-[12px] font-['DM_Sans'] text-[#8C8278]">{label}</span>
                <span className="font-['DM_Mono'] text-[10px] text-[#8C8278]">{have}/{need}</span>
              </div>
              <div className="h-1 bg-[#F2EDE6] rounded-full overflow-hidden">
                <div className="h-full bg-[#C4A97D] rounded-full" style={{ width:`${(have/need)*100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Product list */}
        <h2 className="font-['Playfair_Display'] text-[20px] font-medium text-[#1C1917] mb-5">Para você</h2>
        <div className="space-y-4 pb-4">
          {SHOPPING_RECS.map(item => (
            <div key={item.id} className="bg-white rounded-[24px] overflow-hidden">
              <div className="flex">
                <img src={item.img} alt={item.name} className="w-32 object-cover flex-shrink-0" style={{ height:160 }} />
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-['DM_Mono'] text-[#8C8278] uppercase tracking-wider mb-1">{item.brand}</p>
                    <p className="text-[14px] font-['DM_Sans'] font-semibold text-[#1C1917] leading-snug">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-['DM_Mono'] px-2 py-0.5 rounded-full">{item.impact} looks</span>
                    </div>
                    <p className="font-['DM_Mono'] text-[15px] font-medium text-[#1C1917] mt-3">{item.price}</p>
                    <p className="text-[11px] font-['DM_Sans'] text-[#8C8278]">{item.store}</p>
                  </div>
                  <button
                    onClick={() => toast.success(`Abrindo ${item.store}`, { description: item.name })}
                    className="mt-4 bg-[#1C1917] text-white text-[12px] font-['DM_Sans'] font-medium py-2.5 rounded-xl">
                    Comprar
                  </button>
                </div>
              </div>
              <div className="px-5 pb-4">
                <div className="bg-[#F9F6F2] rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <Sparkles size={11} className="text-[#C4A97D] flex-shrink-0" />
                  <p className="text-[11px] font-['DM_Sans'] text-[#8C8278]">Aumenta em <strong className="text-[#1C1917]">{item.impact}</strong> as possibilidades de combinação</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stats SVG Charts ─────────────────────────────────────────────────────────
function UsageAreaChart() {
  const W=320, H=100, pad={t:8,r:4,b:24,l:4};
  const vals = STATS_USAGE.map(d => d.v);
  const max = Math.max(...vals)*1.15, iW=W-pad.l-pad.r, iH=H-pad.t-pad.b;
  const x=(i:number)=>pad.l+(i/(vals.length-1))*iW;
  const y=(v:number)=>pad.t+iH-((v/max))*iH;
  const pts = vals.map((v,i)=>`${x(i)},${y(v)}`).join(" ");
  const area=`M${x(0)},${y(vals[0])} `+vals.slice(1).map((v,i)=>`L${x(i+1)},${y(v)}`).join(" ")+` L${x(vals.length-1)},${H-pad.b} L${x(0)},${H-pad.b} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C4A97D" stopOpacity=".22"/><stop offset="100%" stopColor="#C4A97D" stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill="url(#ag)"/>
      <polyline points={pts} fill="none" stroke="#C4A97D" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      {vals.map((v,i)=><circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="white" stroke="#C4A97D" strokeWidth="1.5"/>)}
      {STATS_USAGE.map((d,i)=><text key={i} x={x(i)} y={H-4} textAnchor="middle" fontSize="9" fontFamily="DM Mono" fill="#8C8278">{d.m}</text>)}
    </svg>
  );
}

function DonutChart() {
  const cx=60,cy=60,r=52,ri=34,gap=2.5;
  const total=STATS_CATEGORY.reduce((s,d)=>s+d.value,0);
  const segs:JSX.Element[]=[];
  let angle=-90;
  STATS_CATEGORY.forEach((d,i)=>{
    const sweep=(d.value/total)*360-gap;
    const a1=(angle*Math.PI)/180, a2=((angle+sweep)*Math.PI)/180;
    const lg=sweep>180?1:0;
    const fill=d.fill==="#EDE8E2"?"#C4B8A8":d.fill;
    segs.push(<path key={`s${i}`} d={`M${cx+r*Math.cos(a1)},${cy+r*Math.sin(a1)} A${r},${r} 0 ${lg},1 ${cx+r*Math.cos(a2)},${cy+r*Math.sin(a2)} L${cx+ri*Math.cos(a2)},${cy+ri*Math.sin(a2)} A${ri},${ri} 0 ${lg},0 ${cx+ri*Math.cos(a1)},${cy+ri*Math.sin(a1)} Z`} fill={fill}/>);
    angle+=sweep+gap;
  });
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" style={{flexShrink:0}}>
      {segs}
      <text x="60" y="57" textAnchor="middle" fontSize="15" fontFamily="DM Mono" fontWeight="500" fill="#1C1917">83</text>
      <text x="60" y="71" textAnchor="middle" fontSize="8"  fontFamily="DM Sans"  fill="#8C8278">peças</text>
    </svg>
  );
}

// ─── Stats Screen ─────────────────────────────────────────────────────────────
function StatsScreen({ onBack }: { onBack:()=>void }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden pb-20">
      <div className="px-6 pt-4 pb-6 flex items-center gap-4">
        <button onClick={onBack} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-[0_1px_8px_rgba(28,25,23,0.07)]">
          <ChevronLeft size={17} />
        </button>
        <h1 className="font-['Playfair_Display'] text-[22px] font-semibold text-[#1C1917]">Estatísticas</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label:"Total de peças",  value:"83",       sub:"guarda-roupa",    icon:Shirt    },
            { label:"Combinações",     value:"312",      sub:"possíveis",       icon:Repeat   },
            { label:"Valor estimado",  value:"R$ 14.2k", sub:"guarda-roupa",    icon:CreditCard},
            { label:"Custo médio",     value:"R$ 18",    sub:"por uso",         icon:TrendingUp},
          ].map(({ label, value, sub, icon:I }) => (
            <div key={label} className="bg-white rounded-[20px] p-5">
              <div className="w-8 h-8 bg-[#F2EDE6] rounded-xl flex items-center justify-center mb-3">
                <I size={14} className="text-[#8C8278]" />
              </div>
              <p className="font-['DM_Mono'] text-[20px] font-medium text-[#1C1917]">{value}</p>
              <p className="text-[11px] font-['DM_Sans'] text-[#8C8278] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Usage chart */}
        <div className="bg-white rounded-[20px] p-5">
          <p className="font-['Playfair_Display'] text-[17px] font-medium text-[#1C1917] mb-4">Uso mensal</p>
          <UsageAreaChart />
        </div>

        {/* Category donut */}
        <div className="bg-white rounded-[20px] p-5">
          <p className="font-['Playfair_Display'] text-[17px] font-medium text-[#1C1917] mb-4">Por categoria</p>
          <div className="flex items-center gap-5">
            <DonutChart />
            <div className="flex-1 space-y-2">
              {STATS_CATEGORY.map(({ name, value, fill }) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: fill==="#EDE8E2"?"#C4B8A8":fill }} />
                  <span className="text-[12px] font-['DM_Sans'] text-[#1C1917] flex-1">{name}</span>
                  <span className="font-['DM_Mono'] text-[11px] text-[#8C8278]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Most used */}
        <div className="bg-white rounded-[20px] p-5 mb-2">
          <p className="font-['Playfair_Display'] text-[17px] font-medium text-[#1C1917] mb-4">Mais utilizadas</p>
          <div className="space-y-4">
            {[...WARDROBE].sort((a,b)=>b.uses-a.uses).slice(0,4).map((item,i) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="font-['DM_Mono'] text-[11px] text-[#C4B8A8] w-4">{i+1}</span>
                <img src={item.img} alt={item.name} className="w-10 h-10 object-cover rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-['DM_Sans'] font-medium text-[#1C1917] truncate">{item.name}</p>
                  <p className="text-[10px] font-['DM_Mono'] text-[#8C8278]">{item.brand}</p>
                </div>
                <p className="font-['DM_Mono'] text-[13px] text-[#1C1917]">{item.uses}×</p>
              </div>
            ))}
          </div>
        </div>

        {/* Forgotten */}
        <div className="bg-white rounded-[20px] p-5 mb-2">
          <div className="flex items-center justify-between mb-4">
            <p className="font-['Playfair_Display'] text-[17px] font-medium text-[#1C1917]">Peças esquecidas</p>
            <Eye size={14} className="text-[#C4B8A8]" />
          </div>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide">
            {[...WARDROBE].sort((a,b)=>a.uses-b.uses).slice(0,5).map(item => (
              <div key={item.id} className="flex-shrink-0">
                <img src={item.img} alt={item.name} className="w-20 h-24 object-cover rounded-[16px]" />
                <p className="text-[9px] font-['DM_Mono'] text-[#8C8278] mt-1.5 text-center">{item.uses}× usado</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────
function ProfileScreen({ onBack }: { onBack:()=>void }) {
  const MENU = [
    { icon:Settings,    label:"Preferências de estilo", sub:"Gostos e restrições"   },
    { icon:CreditCard,  label:"Assinatura Premium",     sub:"Renovação em 15 Set."  },
    { icon:Bell,        label:"Notificações",           sub:"Configurar alertas"    },
    { icon:HelpCircle,  label:"Suporte",                sub:"Central de ajuda"      },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden pb-20">
      <div className="px-6 pt-4 pb-0 flex items-center gap-4">
        <button onClick={onBack} className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-[0_1px_8px_rgba(28,25,23,0.07)]">
          <ChevronLeft size={17} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-5 scrollbar-hide">
        {/* Profile hero */}
        <div className="bg-[#1C1917] rounded-[28px] p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#C4A97D]/08 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="flex items-center gap-4 mb-5">
            <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e0?w=200&h=200&fit=crop&auto=format"
              alt="Nayara" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
            <div>
              <p className="text-[10px] font-['DM_Mono'] text-white/40 uppercase tracking-widest mb-1">Stylist pessoal</p>
              <h2 className="font-['Playfair_Display'] text-[22px] font-semibold text-white leading-none">Nayara Silva</h2>
              <p className="text-[12px] font-['DM_Sans'] text-white/50 mt-1">São Paulo</p>
            </div>
          </div>
          <span className="bg-[#C4A97D] text-white text-[10px] font-['DM_Mono'] font-medium px-3 py-1 rounded-full uppercase tracking-wider">Premium</span>
        </div>

        {/* Style tags */}
        <div className="bg-white rounded-[20px] p-5 mb-4">
          <p className="text-[12px] font-['DM_Mono'] text-[#8C8278] uppercase tracking-wider mb-3">Seu estilo</p>
          <div className="flex flex-wrap gap-2">
            {["Minimalista","Business Casual","Elegante","Neutros","Atemporal","Sustentável"].map(tag => (
              <span key={tag} className="bg-[#F2EDE6] text-[#1C1917] text-[12px] font-['DM_Sans'] font-medium px-3 py-1.5 rounded-xl">{tag}</span>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-[20px] overflow-hidden mb-4">
          {MENU.map(({ icon:I, label, sub }, idx) => (
            <div key={label} className={cn("flex items-center gap-3 px-5 py-4 cursor-pointer", idx < MENU.length-1 ? "border-b border-[#1C1917]/05" : "")}>
              <div className="w-8 h-8 bg-[#F9F6F2] rounded-xl flex items-center justify-center flex-shrink-0">
                <I size={13} className="text-[#8C8278]" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-['DM_Sans'] font-medium text-[#1C1917]">{label}</p>
                <p className="text-[11px] font-['DM_Sans'] text-[#8C8278]">{sub}</p>
              </div>
              <ChevronRight size={14} className="text-[#C4B8A8]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── More Screen ──────────────────────────────────────────────────────────────
function MoreScreen({ onNavigate }: { onNavigate:(s:Screen)=>void }) {
  const items = [
    { icon:BarChart2,   label:"Estatísticas", sub:"Dashboard",       screen:"stats"   as Screen, color:"bg-[#F2EDE6]", ic:"text-[#8C8278]" },
    { icon:ShoppingBag, label:"Compras",      sub:"Inteligentes",    screen:"shopping"as Screen, color:"bg-[#F8F2E8]", ic:"text-[#C4A97D]" },
    { icon:User,        label:"Perfil",       sub:"Configurações",   screen:"profile" as Screen, color:"bg-[#F2EDE6]", ic:"text-[#8C8278]" },
    { icon:MessageSquare,label:"Comunidade",  sub:"Em breve",        screen:"more"    as Screen, color:"bg-[#F2EDE6]", ic:"text-[#C4B8A8]" },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
      <div className="px-6 pt-6 pb-8">
        <p className="text-[11px] font-['DM_Mono'] text-[#8C8278] uppercase tracking-widest mb-1">Mais</p>
        <h1 className="font-['Playfair_Display'] text-[30px] font-semibold text-[#1C1917]">Menu</h1>
      </div>

      <div className="px-6 grid grid-cols-2 gap-3 mb-8">
        {items.map(({ icon:I, label, sub, screen, color, ic }) => (
          <button key={label} onClick={() => screen !== "more" && onNavigate(screen)}
            className="bg-white rounded-[24px] p-5 text-left active:scale-[0.98] transition-transform">
            <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center mb-4", color)}>
              <I size={18} className={ic} />
            </div>
            <p className="font-['DM_Sans'] font-semibold text-[14px] text-[#1C1917]">{label}</p>
            <p className="text-[11px] font-['DM_Sans'] text-[#8C8278] mt-0.5">{sub}</p>
          </button>
        ))}
      </div>

      {/* Premium CTA */}
      <div className="mx-6 bg-[#1C1917] rounded-[24px] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-[#C4A97D]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <span className="bg-[#C4A97D] text-white text-[10px] font-['DM_Mono'] uppercase tracking-wider px-2.5 py-1 rounded-full">Premium</span>
        <h3 className="font-['Playfair_Display'] text-[20px] font-semibold text-white mt-3 mb-1">Seu estilo, elevado.</h3>
        <p className="text-white/50 text-[12px] font-['DM_Sans'] mb-5 leading-relaxed">IA ilimitada · Análise avançada · Planejamento automático</p>
        <button
          onClick={() => toast("Assinatura Premium", { description: "Renovação em 15 de setembro" })}
          className="bg-[#C4A97D] text-white text-[13px] font-['DM_Sans'] font-medium px-5 py-2.5 rounded-xl">
          Gerenciar assinatura
        </button>
      </div>
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
function BottomNav({ active, onTab }: { active:NavTab; onTab:(t:NavTab)=>void }) {
  const tabs: { id:NavTab; icon:React.ElementType; label:string; fab?:boolean }[] = [
    { id:"home",    icon:Home,          label:"Home"       },
    { id:"closet",  icon:Grid3X3,       label:"Closet"     },
    { id:"add",     icon:Plus,          label:"",    fab:true },
    { id:"stylist", icon:Sparkles,      label:"Stylist"    },
    { id:"me",      icon:MoreHorizontal,label:"Mais"       },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#1C1917]/05 px-3 pb-2">
      <div className="flex items-center justify-around h-[60px]">
        {tabs.map(({ id, icon:I, label, fab }) => {
          const isActive = active === id;
          if (fab) return (
            <button key={id} onClick={() => onTab(id)}
              className="w-12 h-12 -mt-6 bg-[#1C1917] rounded-[18px] flex items-center justify-center shadow-[0_8px_24px_rgba(28,25,23,0.22)] active:scale-95 transition-transform">
              <I size={20} className="text-white" />
            </button>
          );
          return (
            <button key={id} onClick={() => onTab(id)}
              className="flex flex-col items-center gap-1 w-14 py-1 active:scale-95 transition-transform">
              <I size={19} className={isActive ? "text-[#1C1917]" : "text-[#C4B8A8]"} strokeWidth={isActive ? 2 : 1.5} />
              <span className={cn("text-[9px] font-['DM_Sans'] font-medium",
                isActive ? "text-[#1C1917]" : "text-[#C4B8A8]")}>{label}</span>
              {isActive && <div className="w-3 h-[2px] bg-[#C4A97D] rounded-full -mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function usePhoneScale(width = 393, height = 852) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const pad = 40;
      const next = Math.min(1, (window.innerWidth - pad) / width, (window.innerHeight - pad) / height);
      setScale(next);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [width, height]);
  return scale;
}

export default function App() {
  const [navTab, setNavTab] = useState<NavTab>("home");
  const [screen, setScreen] = useState<Screen>("home");
  const [history, setHistory] = useState<Screen[]>([]);
  const scale = usePhoneScale();

  const handleTab = (tab: NavTab) => {
    const map: Record<NavTab,Screen> = { home:"home", closet:"closet", add:"add", stylist:"stylist", me:"more" };
    setNavTab(tab); setScreen(map[tab]); setHistory([]);
  };

  const push = (s: Screen) => { setHistory(h=>[...h,screen]); setScreen(s); };
  const goBack = () => {
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    if (prev) {
      setScreen(prev);
      return;
    }
    setScreen("home");
    setNavTab("home");
  };

  const activeTab: NavTab =
    screen==="home" ? "home" : screen==="closet" ? "closet" : screen==="add" ? "add" : screen==="stylist" ? "stylist" : "me";

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor:"#E2DDD7" }}>
      <Toaster
        position="top-center"
        gap={8}
        toastOptions={{
          style: {
            background: "#1C1917",
            color: "#F9F6F2",
            border: "none",
            fontFamily: "DM Sans, sans-serif",
            fontSize: 13,
            borderRadius: 16,
          },
        }}
      />
      {/* Phone frame */}
      <div
        className="relative"
        style={{
          width: 393,
          height: 852,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div className="absolute inset-0 rounded-[50px] overflow-hidden shadow-[0_48px_96px_rgba(28,25,23,0.28),inset_0_0_0_1px_rgba(255,255,255,0.12)]"
          style={{ backgroundColor:"#F9F6F2" }}>

          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1C1917] rounded-b-2xl z-50 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#2A2724] border border-[#333]" />
            <div className="w-16 h-1.5 bg-[#2A2724] rounded-full" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ paddingTop:28 }}>
            <PhoneStatus />

            <AnimatePresence mode="wait">
              <motion.div key={screen}
                initial={{ opacity:0, x: history.length>0 ? 24 : 0 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-12 }}
                transition={{ duration:0.18 }}
                className="flex-1 flex flex-col overflow-hidden">
                {screen==="home"     && <HomeScreen    onNavigate={push} />}
                {screen==="closet"   && <ClosetScreen />}
                {screen==="add"      && <AddClothingScreen onBack={goBack} />}
                {screen==="stylist"  && <StylistScreen />}
                {screen==="planning" && <PlanningScreen onBack={goBack} />}
                {screen==="shopping" && <ShoppingScreen onBack={goBack} />}
                {screen==="stats"    && <StatsScreen    onBack={goBack} />}
                {screen==="profile"  && <ProfileScreen  onBack={goBack} />}
                {screen==="more"     && <MoreScreen     onNavigate={push} />}
              </motion.div>
            </AnimatePresence>

            <BottomNav active={activeTab} onTab={handleTab} />
          </div>
        </div>

        {/* Physical buttons */}
        <div className="absolute left-[-3px] top-32  w-[3px] h-7  bg-[#C8C0B4] rounded-l-full" />
        <div className="absolute left-[-3px] top-44  w-[3px] h-11 bg-[#C8C0B4] rounded-l-full" />
        <div className="absolute left-[-3px] top-60  w-[3px] h-11 bg-[#C8C0B4] rounded-l-full" />
        <div className="absolute right-[-3px] top-44 w-[3px] h-16 bg-[#C8C0B4] rounded-r-full" />
      </div>
    </div>
  );
}
