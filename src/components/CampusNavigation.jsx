import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, Navigation, MapPin, Compass, Clock, Accessibility,
  ArrowLeftRight, Layers, Crosshair, CheckCircle2,
  Utensils, BookOpen, GraduationCap, Building2, Trees,
  ChevronRight, ChevronDown, X, Plus, Download, Filter,
  DoorOpen, SlidersHorizontal, ShieldCheck, CornerDownRight,
  ZoomIn, ZoomOut, Maximize2, Sparkles, Eye, Info,
  Footprints, RotateCcw, Play, Pause, Flame, Share2
} from 'lucide-react';
import rawUvceRooms from '../data/uvceRooms.json';

/* ================================================================== */
/* UVCE 3D ISOMETRIC ARCHITECTURAL DIGITAL TWIN DATA MODEL            */
/* ================================================================== */

export const CAMPUS_LANDMARKS = [
  {
    id: 'gate_main',
    name: 'Main Gate (K.R. Circle)',
    shortName: 'Main Gate',
    category: 'gate',
    x: 1220,
    y: 280,
    badge: 'K.R. Circle Entrance',
    iconColor: '#10B981',
    description: 'Main campus ceremonial entrance facing K.R. Circle junction, Post Office Road & Nrupathunga Road.',
  },
  {
    id: 'gate_metro',
    name: 'Back Gate 1 (Metro Gate)',
    shortName: 'Metro Gate',
    category: 'gate',
    x: 110,
    y: 460,
    badge: 'Sir MV Metro Station',
    iconColor: '#10B981',
    description: 'Direct access to Sir M. Visvesvaraya (Central College) Metro Station on Post Office Road.',
  },
  {
    id: 'gate_back2',
    name: 'Gate 2 (Nrupathunga Road Gate)',
    shortName: 'Nrupathunga Gate',
    category: 'gate',
    x: 1220,
    y: 720,
    badge: 'Nrupathunga Road',
    iconColor: '#10B981',
    description: 'Fast entrance along the Left Wing perimeter into admin, library, and quadrangle.',
  },
  {
    id: 'main_building_left',
    name: 'Main Heritage Block - Left Wing',
    shortName: 'Left Wing (CSE / ECE)',
    category: 'academic',
    x: 980,
    y: 440,
    w: 220,
    h: 160,
    badge: 'CSE, ECE & Director Off.',
    iconColor: '#00F0FF',
    floorRange: 'Ground, 1st & 2nd Floors',
    description: 'Iconic heritage stone quadrangle. Houses Director Office, CSE/ECE Depts, Labs 211, 213, EC-201, EC-301 to 308.',
    entranceX: 920,
    entranceY: 440,
  },
  {
    id: 'main_building_right',
    name: 'Main Heritage Block - Right Wing',
    shortName: 'Right Wing (TPO / EE)',
    category: 'academic',
    x: 640,
    y: 440,
    w: 200,
    h: 150,
    badge: 'TPO & Electrical Dept',
    iconColor: '#6366F1',
    floorRange: 'Ground & 1st Floors',
    description: 'Training & Placement Office, TPO Labs, COE Labs, Electrical faculty cabins, and Seminar Halls.',
    entranceX: 700,
    entranceY: 440,
  },
  {
    id: 'minchu',
    name: 'Minchu Building',
    shortName: 'Minchu Central',
    category: 'academic',
    x: 810,
    y: 410,
    w: 110,
    h: 110,
    badge: 'Central Quadrangle',
    iconColor: '#8B5CF6',
    floorRange: 'Ground & 1st Floor',
    description: 'Historic central rotunda structure connecting Left and Right Wings inside the main quadrangle lawn.',
    entranceX: 810,
    entranceY: 450,
  },
  {
    id: 'library',
    name: 'Central Library & Centenary Hall',
    shortName: 'Central Library',
    category: 'library',
    x: 810,
    y: 590,
    w: 190,
    h: 130,
    badge: 'Library & Centenary Hall',
    iconColor: '#3B82F6',
    floorRange: 'Ground & 1st Floor',
    description: 'Located behind Minchu. Features Centenary Seminar Hall, vast technical reference collection, digital e-archives.',
    entranceX: 810,
    entranceY: 530,
  },
  {
    id: 'lhc',
    name: 'Lecture Hall Complex (LHC)',
    shortName: 'LHC (LH 1 - 6)',
    category: 'academic',
    x: 560,
    y: 610,
    w: 180,
    h: 120,
    badge: 'LH 1 to LH 6',
    iconColor: '#0EA5E9',
    floorRange: 'Ground Floor',
    description: 'Tiered lecture theater complex containing Lecture Halls LH 1 through LH 6 for core engineering lectures.',
    entranceX: 560,
    entranceY: 560,
  },
  {
    id: 'rock_garden',
    name: 'Rock Garden & Student Hub',
    shortName: 'Rock Garden',
    category: 'amenity',
    x: 370,
    y: 530,
    w: 170,
    h: 140,
    badge: 'Student Hangout',
    iconColor: '#10B981',
    floorRange: 'Ground Level',
    description: 'Scenic natural stone garden with shade trees, open stone seating, and social gathering zones.',
    entranceX: 430,
    entranceY: 530,
  },
  {
    id: 'nandini',
    name: 'Nandini Canteen',
    shortName: 'Nandini Canteen',
    category: 'dining',
    x: 350,
    y: 570,
    w: 100,
    h: 80,
    badge: 'Canteen & Refreshments',
    iconColor: '#F59E0B',
    floorRange: 'Ground Level',
    description: 'Beloved campus canteen inside Rock Garden serving fresh South Indian breakfast, coffee, and lunch.',
    entranceX: 370,
    entranceY: 540,
  },
  {
    id: 'marvel_ieee',
    name: 'MARVEL & IEEE Innovation Hub',
    shortName: 'MARVEL / IEEE Hub',
    category: 'academic',
    x: 390,
    y: 360,
    w: 150,
    h: 100,
    badge: 'Makerspace R&D',
    iconColor: '#EC4899',
    floorRange: 'Ground Level',
    description: 'State-of-the-art makerspace, hardware prototyping lab, robotics workshop, and IEEE UVCE Student Branch.',
    entranceX: 430,
    entranceY: 390,
  },
  {
    id: 'eee_science_block',
    name: 'Electrical Block & Science Labs',
    shortName: 'EEE & Science Block',
    category: 'academic',
    x: 210,
    y: 630,
    w: 180,
    h: 140,
    badge: 'EEE, Physics & Chem',
    iconColor: '#6366F1',
    floorRange: 'Basement, Ground & 1st Floor',
    description: 'Rear multi-story academic facility with Electrical Dept, Physics Lab, Chemistry Lab, and Rooms 323-330.',
    entranceX: 250,
    entranceY: 580,
  },
  {
    id: 'open_air_theater',
    name: 'Open Air Theater (OAT) & NCC Unit',
    shortName: 'OAT & NCC',
    category: 'amenity',
    x: 740,
    y: 780,
    w: 200,
    h: 120,
    badge: 'Cultural Amphitheater',
    iconColor: '#8B5CF6',
    floorRange: 'Ground Level',
    description: 'Open Air Amphitheater for cultural festivals, Milagro, college fests, and No.2 KAR Air Squadron NCC unit.',
    entranceX: 740,
    entranceY: 730,
  },
  {
    id: 'mech_block',
    name: 'Mechanical Block & Workshops',
    shortName: 'Mechanical Block',
    category: 'academic',
    x: 980,
    y: 150,
    w: 260,
    h: 120,
    badge: 'Across Post Office Rd',
    iconColor: '#06B6D4',
    floorRange: 'Ground, 1st & 2nd Floors',
    description: 'Across Post Office Road. Mechanical Dept, ML 102-104, ML 201-205, Design Innovation Center, and workshops.',
    entranceX: 980,
    entranceY: 200,
  },
];

/* Staircase Vertical Hubs */
export const CAMPUS_STAIRS = [
  { id: 'stair_left_wing', name: 'Left Wing Main Staircase', x: 930, y: 440, block: 'Main Heritage - Left Wing', floors: 'G, 1F, 2F' },
  { id: 'stair_right_wing', name: 'Right Wing Staircase', x: 690, y: 440, block: 'Main Heritage - Right Wing', floors: 'G, 1F, 2F' },
  { id: 'stair_mech', name: 'Mechanical Block Staircase', x: 970, y: 150, block: 'Mechanical Block', floors: 'G, 1F, 2F' },
  { id: 'stair_eee', name: 'Electrical Block Staircase', x: 220, y: 630, block: 'Electrical & Science Block', floors: 'B, G, 1F' },
  { id: 'stair_quad', name: 'Minchu Central Rotunda Stairs', x: 810, y: 450, block: 'Minchu (Central Quad)', floors: 'G, 1F' },
];

/* Walkway Hubs and Intersections */
export const CAMPUS_JUNCTIONS = [
  { id: 'j_kr_circle', name: 'K.R. Circle Gate Plaza', x: 1140, y: 280 },
  { id: 'j_post_office_cross', name: 'Post Office Road Crosswalk', x: 980, y: 250 },
  { id: 'j_front_portico', name: 'Senate Portico Courtyard', x: 920, y: 340 },
  { id: 'j_quad_lawn', name: 'Main Quadrangle Center Lawn', x: 810, y: 360 },
  { id: 'j_nrupathunga_avenue', name: 'Nrupathunga Gate Avenue', x: 1140, y: 720 },
  { id: 'j_library_plaza', name: 'Central Library Plaza', x: 810, y: 520 },
  { id: 'j_lhc_concourse', name: 'LHC Walkway Concourse', x: 670, y: 600 },
  { id: 'j_rock_walkway', name: 'Rock Garden Entrance Path', x: 470, y: 530 },
  { id: 'j_marvel_path', name: 'MARVEL Innovation Way', x: 480, y: 380 },
  { id: 'j_metro_avenue', name: 'Metro Gate Concourse', x: 200, y: 460 },
  { id: 'j_south_promenade', name: 'South Courtyard Promenade', x: 500, y: 720 },
  { id: 'j_oat_court', name: 'Amphitheater Approach', x: 740, y: 720 },
];

/* Campus Pathfinding Walkway Graph Edges */
export const CAMPUS_EDGES = [
  // Outer road & gates
  ['gate_main', 'j_kr_circle', false],
  ['j_kr_circle', 'j_post_office_cross', false],
  ['j_post_office_cross', 'mech_block', false],
  ['j_kr_circle', 'j_front_portico', false],
  ['gate_back2', 'j_nrupathunga_avenue', false],
  ['j_nrupathunga_avenue', 'main_building_left', false],
  ['j_nrupathunga_avenue', 'j_oat_court', false],
  ['gate_metro', 'j_metro_avenue', false],
  ['j_metro_avenue', 'eee_science_block', false],
  ['j_metro_avenue', 'marvel_ieee', false],
  ['j_metro_avenue', 'j_rock_walkway', false],

  // Heritage Quadrangle
  ['j_front_portico', 'main_building_left', false],
  ['j_front_portico', 'j_quad_lawn', false],
  ['j_quad_lawn', 'main_building_right', false],
  ['j_quad_lawn', 'minchu', false],
  ['minchu', 'j_library_plaza', false],
  ['main_building_left', 'minchu', false],
  ['main_building_right', 'minchu', false],
  ['main_building_right', 'j_marvel_path', false],
  ['j_marvel_path', 'marvel_ieee', false],
  ['marvel_ieee', 'j_rock_walkway', false],

  // Library & LHC & Rock Garden
  ['j_library_plaza', 'library', false],
  ['j_library_plaza', 'j_lhc_concourse', false],
  ['j_lhc_concourse', 'lhc', false],
  ['j_lhc_concourse', 'j_rock_walkway', false],
  ['j_rock_walkway', 'rock_garden', false],
  ['rock_garden', 'nandini', false],
  ['rock_garden', 'eee_science_block', false],

  // South area & OAT
  ['lhc', 'j_south_promenade', false],
  ['j_south_promenade', 'eee_science_block', false],
  ['j_south_promenade', 'j_oat_court', false],
  ['j_oat_court', 'open_air_theater', false],
  ['open_air_theater', 'j_nrupathunga_avenue', false],

  // Vertical Staircase Shafts (Stairs)
  ['main_building_left', 'stair_left_wing', true],
  ['main_building_right', 'stair_right_wing', true],
  ['mech_block', 'stair_mech', true],
  ['eee_science_block', 'stair_eee', true],
  ['minchu', 'stair_quad', true],
];

/* Clean Short Label Generator */
function getRoomShortBadge(name) {
  if (!name) return 'Room';
  const match = name.match(/((?:EC|CSE|ML|LH|Room|CE)\s*[-_]?\s*\d+[A-Za-z]?)/i);
  if (match) return match[1].toUpperCase().replace(/\s+/, '-');
  if (name.includes('Physics')) return 'Physics';
  if (name.includes('Chemistry')) return 'Chem Lab';
  if (name.includes('Chairman')) return 'Chairman';
  if (name.includes('Dean')) return 'Dean Off.';
  if (name.includes('Director')) return 'Director';
  if (name.includes('Placement') || name.includes('TPO')) return 'TPO';
  if (name.includes('Library')) return 'Library';
  if (name.includes('Canteen')) return 'Canteen';
  if (name.includes('AICTE')) return 'AICTE R&D';
  if (name.includes('CAD')) return 'CAD Lab';
  if (name.includes('Makerspace') || name.includes('MARVEL')) return 'MARVEL';
  if (name.includes('NCC')) return 'NCC Unit';
  if (name.includes('OAT')) return 'OAT';

  // Dr names
  const drMatch = name.match(/Dr\.?\s*([A-Za-z]+)/i);
  if (drMatch) return `Dr. ${drMatch[1]}`;

  const words = name.trim().split(/\s+/);
  return words.slice(0, 2).join(' ');
}

/* Category Color Accents */
function getRoomCategoryAccent(category) {
  switch (category) {
    case 'Classroom': return { bg: '#0A84FF', border: '#38BDF8', glow: 'rgba(56, 189, 248, 0.4)' };
    case 'Laboratory': return { bg: '#059669', border: '#34D399', glow: 'rgba(52, 211, 153, 0.4)' };
    case 'Faculty Cabin': return { bg: '#7C3AED', border: '#C084FC', glow: 'rgba(192, 132, 252, 0.4)' };
    case 'Seminar Hall': return { bg: '#D97706', border: '#FBBF24', glow: 'rgba(251, 191, 36, 0.4)' };
    case 'Office / Admin': return { bg: '#DB2777', border: '#F472B6', glow: 'rgba(244, 114, 182, 0.4)' };
    default: return { bg: '#0284C7', border: '#38BDF8', glow: 'rgba(56, 189, 248, 0.4)' };
  }
}

/* Floor Filter Configuration */
const FLOOR_TABS = [
  { id: 'all', label: '3D Stack', badge: 'ALL', floorNum: null, desc: 'Exploded multi-tier 3D perspective' },
  { id: '2F', label: '2nd Floor', badge: '2F', floorNum: 2, desc: '31 Classrooms & Labs (EC 301-308, ML 201-205)' },
  { id: '1F', label: '1st Floor', badge: '1F', floorNum: 1, desc: '52 Classrooms & Labs (CSE 211, EC 201, ML VI)' },
  { id: 'G', label: 'Ground Floor', badge: 'G', floorNum: 0, desc: '52 Classrooms & Porticos (LH 1-6, TPO, Quad)' },
  { id: 'B', label: 'Basement', badge: 'B', floorNum: -1, desc: 'Subterranean Research Laboratory' },
];

/* Department / Quick Category Filters */
const QUICK_FILTERS = [
  { id: 'all', label: 'All 136 Rooms' },
  { id: 'cse', label: 'CSE Dept', match: ['cse', 'computer'] },
  { id: 'ece', label: 'ECE Dept', match: ['ece', 'electronics'] },
  { id: 'mech', label: 'Mech Dept', match: ['mech', 'ml-', 'workshop'] },
  { id: 'lhc', label: 'Lecture Halls (LH 1-6)', match: ['lh ', 'lh-'] },
  { id: 'labs', label: 'Laboratories', match: ['lab'] },
  { id: 'cabins', label: 'Faculty Cabins', match: ['dr', 'prof', 'chairman', 'dean'] },
  { id: 'canteen', label: 'Canteen & Hubs', match: ['canteen', 'rock', 'marvel', 'library'] },
];

/* Dijkstra Path Solver */
function solveCampusPath(startId, endId, avoidStairs, allNodesMap, allEdges, allNodesList) {
  if (!startId || !endId || !allNodesMap[startId] || !allNodesMap[endId]) return null;
  if (startId === endId) return { path: [allNodesMap[startId]], distance: 0, estimatedMinutes: 1, floorTransfers: 0 };

  const usableEdges = avoidStairs ? allEdges.filter(([, , stairs]) => !stairs) : allEdges;
  const adj = {};

  usableEdges.forEach(([from, to, stairs]) => {
    const pA = allNodesMap[from];
    const pB = allNodesMap[to];
    if (!pA || !pB) return;
    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;
    const w = Math.hypot(dx, dy) + (stairs ? 35 : 0);
    (adj[from] = adj[from] || []).push({ to, w, stairs });
    (adj[to] = adj[to] || []).push({ to: from, w, stairs });
  });

  const dist = {};
  const prev = {};
  const visited = new Set();
  allNodesList.forEach((n) => { dist[n.id] = Infinity; });
  dist[startId] = 0;

  while (visited.size < allNodesList.length) {
    let u = null;
    let best = Infinity;
    allNodesList.forEach((n) => {
      if (!visited.has(n.id) && dist[n.id] < best) {
        best = dist[n.id];
        u = n.id;
      }
    });
    if (u === null) break;
    visited.add(u);
    if (u === endId) break;

    (adj[u] || []).forEach(({ to, w }) => {
      if (dist[u] + w < dist[to]) {
        dist[to] = dist[u] + w;
        prev[to] = u;
      }
    });
  }

  const path = [];
  let cur = endId;
  let guard = 0;
  while (cur !== undefined && guard < allNodesList.length + 5) {
    path.unshift(cur);
    cur = prev[cur];
    guard++;
  }

  if (path[0] !== startId) {
    return {
      path: [allNodesMap[startId], allNodesMap[endId]],
      distance: 90,
      estimatedMinutes: 2,
      floorTransfers: 0,
    };
  }

  const pathNodes = path.map((id) => allNodesMap[id]);
  const estimatedMeters = Math.max(20, Math.round(dist[endId] * 0.42));
  const estimatedMinutes = Math.max(1, Math.round(estimatedMeters / 65));

  // Count staircase transitions
  let stairsCount = 0;
  for (let i = 0; i < pathNodes.length - 1; i++) {
    if (pathNodes[i].isStair || pathNodes[i + 1].isStair) {
      stairsCount++;
    }
  }

  return {
    path: pathNodes,
    distance: estimatedMeters,
    estimatedMinutes,
    floorTransfers: Math.ceil(stairsCount / 2),
  };
}

/* ================================================================== */
/* MAIN 3D CAMPUS NAVIGATION COMPONENT                                */
/* ================================================================== */

export default function CampusNavigation({ dark = true, c }) {
  // Custom user added rooms
  const [customRooms, setCustomRooms] = useState(() => {
    try {
      const saved = localStorage.getItem('smart_campus_custom_rooms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Camera & 3D Spatial Controls
  const [activeFloor, setActiveFloor] = useState('1F'); // 'all' | '2F' | '1F' | 'G' | 'B'
  const [cameraMode, setCameraMode] = useState('iso3d'); // 'iso3d' | 'perspective' | 'ortho'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Navigation Route State
  const [origin, setOrigin] = useState('gate_main');
  const [destination, setDestination] = useState('room_1'); // default to Dept of ECE / Chairman (1F)
  const [avoidStairs, setAvoidStairs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [viewTab, setViewTab] = useState('3d'); // '3d' | 'directory'
  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);

  // New room modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({
    name: '',
    block: 'Main Heritage - Left Wing',
    floor: '1st Floor',
    floorNumber: 1,
    floorBadge: '1F',
    category: 'Classroom',
  });

  const svgRef = useRef(null);

  /* Compute clean architectural corridor coordinates for all 136 rooms */
  const structuredRooms = useMemo(() => {
    const rawList = [...rawUvceRooms, ...customRooms];

    // Building layout bounding boxes for rooms
    const BLOCK_BOUNDS = {
      'Main Heritage - Left Wing': { x: 890, y: 380, w: 180, h: 120, stairId: 'stair_left_wing' },
      'Main Heritage - Right Wing': { x: 550, y: 380, w: 170, h: 120, stairId: 'stair_right_wing' },
      'Main Heritage Block': { x: 740, y: 370, w: 130, h: 80, stairId: 'stair_left_wing' },
      'Minchu (Central Quad)': { x: 750, y: 410, w: 100, h: 80, stairId: 'stair_quad' },
      'Mechanical Block': { x: 870, y: 100, w: 220, h: 100, stairId: 'stair_mech' },
      'Lecture Hall Complex (LHC)': { x: 480, y: 560, w: 160, h: 100, stairId: 'lhc' },
      'Electrical & Science Block': { x: 130, y: 570, w: 160, h: 120, stairId: 'stair_eee' },
      'Training & Placement Office (TPO)': { x: 580, y: 440, w: 110, h: 70, stairId: 'stair_right_wing' },
      'MARVEL & IEEE Club': { x: 330, y: 330, w: 120, h: 70, stairId: 'marvel_ieee' },
      'Open Air Theater & NCC': { x: 670, y: 740, w: 150, h: 80, stairId: 'open_air_theater' },
    };

    // Group rooms by block & floor
    const groups = {};
    rawList.forEach((r) => {
      const blk = r.block || r.loc || 'Main Heritage - Left Wing';
      const flr = r.floorNumber !== undefined ? r.floorNumber : 0;
      const key = `${blk}::${flr}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    const result = [];

    // For each group, calculate structured corridor grid positions
    Object.keys(groups).forEach((key) => {
      const roomGroup = groups[key];
      const [blk, flrStr] = key.split('::');
      const flrNum = parseInt(flrStr, 10);
      const b = BLOCK_BOUNDS[blk] || BLOCK_BOUNDS['Main Heritage - Left Wing'];

      const total = roomGroup.length;
      const cols = total > 10 ? 4 : (total > 5 ? 3 : (total > 2 ? 2 : 1));
      const rows = Math.ceil(total / cols);
      const padX = 18;
      const padY = 16;
      const stepX = (b.w - 2 * padX) / Math.max(1, cols - 1 || 1);
      const stepY = (b.h - 2 * padY) / Math.max(1, rows - 1 || 1);

      roomGroup.forEach((room, idx) => {
        const cIdx = idx % cols;
        const rIdx = Math.floor(idx / cols);
        const baseX = Math.round(b.x + padX + cIdx * stepX);
        const baseY = Math.round(b.y + padY + rIdx * stepY);

        result.push({
          ...room,
          baseX,
          baseY,
          x: baseX,
          y: baseY,
          shortBadge: getRoomShortBadge(room.name),
          categoryAccent: getRoomCategoryAccent(room.category),
          isRoom: true,
          stairNodeId: room.stairNodeId || b.stairId || 'stair_left_wing',
        });
      });
    });

    return result;
  }, [customRooms]);

  /* Combined Nodes & Graph Edges */
  const { allNodes, allNodesMap, allEdges } = useMemo(() => {
    const nodes = [
      ...CAMPUS_LANDMARKS.map((l) => ({ ...l, isLandmark: true })),
      ...CAMPUS_STAIRS.map((s) => ({ ...s, isStair: true })),
      ...CAMPUS_JUNCTIONS.map((j) => ({ ...j, isJunction: true })),
      ...structuredRooms,
    ];
    const map = Object.fromEntries(nodes.map((n) => [n.id, n]));

    const edges = [...CAMPUS_EDGES];
    structuredRooms.forEach((r) => {
      const stairHub = r.stairNodeId || 'stair_left_wing';
      edges.push([stairHub, r.id, r.floorNumber !== 0]);
    });

    return { allNodes: nodes, allNodesMap: map, allEdges: edges };
  }, [structuredRooms]);

  /* Compute Navigation Route */
  const route = useMemo(() => {
    return solveCampusPath(origin, destination, avoidStairs, allNodesMap, allEdges, allNodes);
  }, [origin, destination, avoidStairs, allNodesMap, allEdges, allNodes]);

  /* Human Step-by-Step Directions */
  const routeSteps = useMemo(() => {
    if (!route || route.path.length < 2) return [];
    const steps = [];
    const p = route.path;

    steps.push({
      text: `Start at ${p[0].name || p[0].shortName}`,
      icon: '🟢',
      badge: 'Start Waypoint',
    });

    for (let i = 1; i < p.length; i++) {
      const node = p[i];
      if (node.isStair) {
        steps.push({
          text: `Reach ${node.name} — ${node.floors || 'Vertical Portal'}`,
          icon: '🪜',
          badge: 'Staircase Transition',
          isStair: true,
        });
      } else if (node.isRoom) {
        steps.push({
          text: `Arrive at ${node.name} (${node.floor || 'Target Level'}, ${node.loc || node.block})`,
          icon: '🏁',
          badge: 'Destination Room',
        });
      } else if (node.isLandmark) {
        steps.push({
          text: `Pass ${node.shortName} along campus walkway`,
          icon: '🏛️',
          badge: 'Campus Landmark',
        });
      } else if (i === p.length - 1) {
        steps.push({
          text: `Arrive at ${node.name || node.shortName}`,
          icon: '🏁',
          badge: 'Final Destination',
        });
      }
    }

    return steps;
  }, [route]);

  /* Search & Filter Results */
  const filteredRooms = useMemo(() => {
    let list = structuredRooms;

    // Floor filter (if not ALL)
    if (activeFloor !== 'all') {
      const targetNum = activeFloor === '2F' ? 2 : (activeFloor === '1F' ? 1 : (activeFloor === 'G' ? 0 : -1));
      list = list.filter((r) => r.floorNumber === targetNum);
    }

    // Quick filter chips
    if (activeQuickFilter !== 'all') {
      const filterDef = QUICK_FILTERS.find((f) => f.id === activeQuickFilter);
      if (filterDef && filterDef.match) {
        list = list.filter((r) => {
          const hay = `${r.name} ${r.block || ''} ${r.loc || ''} ${r.category || ''}`.toLowerCase();
          return filterDef.match.some((m) => hay.includes(m));
        });
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        return (
          r.name.toLowerCase().includes(q) ||
          (r.block && r.block.toLowerCase().includes(q)) ||
          (r.loc && r.loc.toLowerCase().includes(q)) ||
          (r.category && r.category.toLowerCase().includes(q)) ||
          (r.floor && r.floor.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [structuredRooms, activeFloor, activeQuickFilter, searchQuery]);

  /* Pan & Drag Interactions */
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(2.4, Math.max(0.65, +(prev + delta).toFixed(2))));
  };

  const resetCamera = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setCameraMode('iso3d');
  };

  /* Walk Simulation Engine */
  useEffect(() => {
    if (!isSimulatingWalk || !route || route.path.length < 2) return;
    const timer = setInterval(() => {
      setSimStepIndex((prev) => {
        if (prev + 1 >= route.path.length) {
          setIsSimulatingWalk(false);
          return 0;
        }
        return prev + 1;
      });
    }, 900);
    return () => clearInterval(timer);
  }, [isSimulatingWalk, route]);

  /* Instant Room Selector */
  const handleSelectRoom = (room, asOrigin = false) => {
    setSelectedRoom(room);
    if (asOrigin) {
      setOrigin(room.id);
    } else {
      setDestination(room.id);
    }

    // Automatically switch floor tab to match the selected room
    if (room.floorNumber === 2) setActiveFloor('2F');
    else if (room.floorNumber === 1) setActiveFloor('1F');
    else if (room.floorNumber === 0) setActiveFloor('G');
    else if (room.floorNumber === -1) setActiveFloor('B');

    // Pan camera towards the room
    setPanOffset({
      x: (700 - room.x) * 0.4,
      y: (475 - room.y) * 0.4,
    });
  };

  /* Save Custom Room */
  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!newRoomForm.name.trim()) return;

    const newEntry = {
      id: `custom_room_${Date.now()}`,
      name: newRoomForm.name.trim(),
      block: newRoomForm.block,
      loc: newRoomForm.block,
      floor: newRoomForm.floor,
      floorNumber: newRoomForm.floorNumber,
      floorBadge: newRoomForm.floorBadge,
      category: newRoomForm.category,
      type: newRoomForm.category,
      isCustom: true,
    };

    const updated = [...customRooms, newEntry];
    setCustomRooms(updated);
    try {
      localStorage.setItem('smart_campus_custom_rooms', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setShowAddModal(false);
    setSelectedRoom(newEntry);
    setDestination(newEntry.id);
  };

  /* 3D Transform Styles for the World Canvas */
  const worldTransformStyle = useMemo(() => {
    let rotX = 52;
    let rotZ = -34;

    if (cameraMode === 'perspective') {
      rotX = 64;
      rotZ = -22;
    } else if (cameraMode === 'ortho') {
      rotX = 0;
      rotZ = 0;
    }

    return {
      transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
      transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
      transformStyle: 'preserve-3d',
    };
  }, [cameraMode, zoomLevel, panOffset, isDragging]);

  return (
    <div className="relative w-full h-[calc(100vh-4.2rem)] min-h-[680px] bg-[#060911] text-slate-100 font-sans overflow-hidden select-none">
      {/* ------------------------------------------------------------ */}
      {/* Top Floating Command & Search Bar                            */}
      {/* ------------------------------------------------------------ */}
      <header className="absolute top-4 left-4 right-4 z-40 flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Branding & Status Badge */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl px-4 py-2.5 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Compass className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wide text-white uppercase">UVCE Digital Twin</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                3D Spatial AI
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>K.R. Circle Campus • 136 Surveyed Classrooms</span>
            </div>
          </div>
        </div>

        {/* Center Spotlight Search Bar */}
        <div className="pointer-events-auto relative w-full md:w-[460px]">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 136 classrooms, labs, cabins (e.g. CSE-211, EC-301, LH-4)..."
              className="w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 focus:border-cyan-400/80 text-xs text-white placeholder-slate-400 pl-10 pr-9 py-2.5 rounded-2xl shadow-2xl outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-slate-800/80">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/50">
                Found {filteredRooms.length} Matching Rooms
              </div>
              {filteredRooms.length === 0 ? (
                <div className="p-4 text-xs text-slate-400 text-center">No classrooms found matching "{searchQuery}"</div>
              ) : (
                filteredRooms.slice(0, 8).map((room) => (
                  <div
                    key={room.id}
                    onClick={() => {
                      handleSelectRoom(room);
                      setSearchQuery('');
                    }}
                    className="p-3 hover:bg-cyan-500/10 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-cyan-300 flex items-center gap-2">
                        <span>{room.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {room.floorBadge || 'G'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">{room.block || room.loc} • {room.category}</div>
                    </div>
                    <button className="text-[11px] font-medium text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Navigate</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* View Mode Switcher & Add Room Action */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 p-1 rounded-2xl flex items-center shadow-xl">
            <button
              onClick={() => setViewTab('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewTab === '3d'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>3D Explorer</span>
            </button>
            <button
              onClick={() => setViewTab('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewTab === 'directory'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Matrix Grid</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-2 rounded-2xl text-xs font-semibold shadow-lg transition backdrop-blur-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Room</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------ */}
      {/* Quick Category Filter Chips                                  */}
      {/* ------------------------------------------------------------ */}
      <div className="absolute top-20 left-4 right-4 z-30 pointer-events-none flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto max-w-full px-3 py-1.5 bg-slate-950/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl scrollbar-none">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveQuickFilter(f.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
                activeQuickFilter === f.id
                  ? 'bg-cyan-500 text-black font-semibold shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* VIEW TAB 1: 3D ISOMETRIC DIGITAL TWIN CANVAS                 */}
      {/* ------------------------------------------------------------ */}
      {viewTab === '3d' && (
        <div
          className="relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={(e) => handleZoom(e.deltaY < 0 ? 0.1 : -0.1)}
          style={{ perspective: 1200 }}
        >
          {/* Ambient Cyber Grid & Glow Backdrop */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.08)_0%,rgba(6,9,17,1)_85%)]" />

          {/* 3D World Stage */}
          <div style={worldTransformStyle} className="relative origin-center w-[1400px] h-[950px]">
            <svg
              ref={svgRef}
              viewBox="0 0 1400 950"
              className="w-full h-full overflow-visible drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.85))' }}
            >
              <defs>
                {/* Glowing Laser Filter */}
                <filter id="laser-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Building Shadow Filter */}
                <filter id="building-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="10" result="shadow" />
                  <feOffset dx="15" dy="25" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.45" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Roof Gradient 1 */}
                <linearGradient id="roof-grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                {/* Roof Gradient Violet */}
                <linearGradient id="roof-grad-violet" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2E1065" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                {/* Lawn Gradient */}
                <linearGradient id="lawn-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#064E3B" />
                  <stop offset="100%" stopColor="#022C22" />
                </linearGradient>

                {/* Rock Garden Gradient */}
                <linearGradient id="stone-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                {/* Lit Window Pattern */}
                <pattern id="window-grid" width="12" height="10" patternUnits="userSpaceOnUse">
                  <rect x="2" y="2" width="7" height="5" rx="1" fill="#38BDF8" opacity="0.35" />
                </pattern>
              </defs>

              {/* ---------------------------------------------------- */}
              {/* Ground Cyber Plane with Coordinate Grid              */}
              {/* ---------------------------------------------------- */}
              <rect
                x="40"
                y="40"
                width="1320"
                height="870"
                rx="36"
                fill="#090D18"
                stroke="rgba(56, 189, 248, 0.2)"
                strokeWidth="2"
              />

              {/* Grid Lines */}
              <g stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1">
                {Array.from({ length: 26 }).map((_, i) => (
                  <line key={`gx-${i}`} x1={80 + i * 50} y1="40" x2={80 + i * 50} y2="910" />
                ))}
                {Array.from({ length: 18 }).map((_, i) => (
                  <line key={`gy-${i}`} x1="40" y1={80 + i * 48} x2="1360" y2={80 + i * 48} />
                ))}
              </g>

              {/* Campus Roads (Post Office Rd, Nrupathunga Rd) */}
              <path
                d="M 60 250 L 1340 250"
                stroke="#151E32"
                strokeWidth="32"
                strokeLinecap="round"
              />
              <path
                d="M 60 250 L 1340 250"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2"
                strokeDasharray="14 12"
              />
              <text x="110" y="240" fill="#64748B" fontSize="11" fontWeight="600" letterSpacing="2">
                POST OFFICE ROAD (TOWARDS SIR MV METRO STATION)
              </text>

              <path
                d="M 1240 250 L 1240 880"
                stroke="#151E32"
                strokeWidth="36"
                strokeLinecap="round"
              />
              <path
                d="M 1240 250 L 1240 880"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2"
                strokeDasharray="14 12"
              />
              <text x="1260" y="550" fill="#64748B" fontSize="11" fontWeight="600" letterSpacing="2" transform="rotate(90 1260 550)">
                NRUPATHUNGA ROAD (K.R. CIRCLE)
              </text>

              {/* ---------------------------------------------------- */}
              {/* Landscaped Courtyards & Green Spaces                 */}
              {/* ---------------------------------------------------- */}
              {/* Main Heritage Quadrangle Central Lawn */}
              <g>
                <rect
                  x="720"
                  y="360"
                  width="180"
                  height="110"
                  rx="16"
                  fill="url(#lawn-grad)"
                  stroke="#10B981"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <circle cx="810" cy="415" r="22" fill="#047857" opacity="0.6" />
                <circle cx="810" cy="415" r="14" fill="#10B981" opacity="0.3" />
                <text x="810" y="419" fill="#A7F3D0" fontSize="10" fontWeight="700" textAnchor="middle">
                  QUADRANGLE
                </text>
              </g>

              {/* Rock Garden Student Hub */}
              <g>
                <path
                  d="M 300 480 Q 440 450 460 560 Q 440 640 310 630 Z"
                  fill="#0F2B26"
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  opacity="0.8"
                />
                {/* Stylized Garden Boulders */}
                <circle cx="340" cy="510" r="14" fill="#334155" />
                <circle cx="380" cy="495" r="18" fill="#1E293B" />
                <circle cx="430" cy="520" r="12" fill="#475569" />
                <circle cx="420" cy="560" r="16" fill="#334155" />
                <circle cx="340" cy="590" r="15" fill="#1E293B" />
                <text x="380" y="535" fill="#6EE7B7" fontSize="10" fontWeight="700" textAnchor="middle">
                  🌿 ROCK GARDEN
                </text>
              </g>

              {/* Open Air Theater Amphitheater */}
              <g>
                <path
                  d="M 640 760 C 640 820 840 820 840 760"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="10"
                  opacity="0.4"
                />
                <path
                  d="M 660 770 C 660 815 820 815 820 770"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="8"
                  opacity="0.6"
                />
                <rect x="710" y="740" width="60" height="24" rx="4" fill="#4C1D95" stroke="#A78BFA" strokeWidth="1" />
                <text x="740" y="756" fill="#DDD6FE" fontSize="9" fontWeight="700" textAnchor="middle">
                  OAT STAGE
                </text>
              </g>

              {/* ---------------------------------------------------- */}
              {/* Campus Walkway Network (Avenues)                     */}
              {/* ---------------------------------------------------- */}
              <g stroke="#1E293B" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
                {CAMPUS_EDGES.filter(([, , stairs]) => !stairs).map(([f, t], idx) => {
                  const nodeA = allNodesMap[f];
                  const nodeB = allNodesMap[t];
                  if (!nodeA || !nodeB) return null;
                  return (
                    <line
                      key={`path-base-${idx}`}
                      x1={nodeA.x}
                      y1={nodeA.y}
                      x2={nodeB.x}
                      y2={nodeB.y}
                    />
                  );
                })}
              </g>
              <g stroke="rgba(14, 165, 233, 0.4)" strokeWidth="2" strokeDasharray="6 6">
                {CAMPUS_EDGES.filter(([, , stairs]) => !stairs).map(([f, t], idx) => {
                  const nodeA = allNodesMap[f];
                  const nodeB = allNodesMap[t];
                  if (!nodeA || !nodeB) return null;
                  return (
                    <line
                      key={`path-dash-${idx}`}
                      x1={nodeA.x}
                      y1={nodeA.y}
                      x2={nodeB.x}
                      y2={nodeB.y}
                    />
                  );
                })}
              </g>

              {/* ---------------------------------------------------- */}
              {/* 3D EXTRUDED BUILDINGS & ARCHITECTURE BLOCKS          */}
              {/* ---------------------------------------------------- */}
              {CAMPUS_LANDMARKS.filter((l) => l.w && l.h).map((b) => {
                const isSelected = selectedRoom && (selectedRoom.block === b.name || selectedRoom.loc === b.shortName);
                const hasActiveFloor = activeFloor === 'all' || (b.floorRange && b.floorRange.includes(activeFloor === '2F' ? '2nd' : (activeFloor === '1F' ? '1st' : 'Ground')));

                return (
                  <g key={b.id} className="cursor-pointer group" onClick={() => setSelectedRoom(b)}>
                    {/* Ground Cast Shadow */}
                    <rect
                      x={b.x - b.w / 2 + 14}
                      y={b.y - b.h / 2 + 18}
                      width={b.w}
                      height={b.h}
                      rx="14"
                      fill="rgba(0,0,0,0.6)"
                      filter="url(#building-shadow)"
                    />

                    {/* Front Architectural Facade Extrusion */}
                    <rect
                      x={b.x - b.w / 2}
                      y={b.y - b.h / 2 + 12}
                      width={b.w}
                      height={b.h}
                      rx="12"
                      fill="#0B1220"
                      stroke="#1E293B"
                      strokeWidth="2"
                    />

                    {/* Windows on Facade */}
                    <rect
                      x={b.x - b.w / 2 + 12}
                      y={b.y + b.h / 2 - 20}
                      width={b.w - 24}
                      height="18"
                      fill="url(#window-grid)"
                    />

                    {/* Top Roof Slab with 3D Depth */}
                    <rect
                      x={b.x - b.w / 2}
                      y={b.y - b.h / 2}
                      width={b.w}
                      height={b.h}
                      rx="12"
                      fill="url(#roof-grad-cyan)"
                      stroke={isSelected ? '#00F0FF' : (hasActiveFloor ? b.iconColor : '#334155')}
                      strokeWidth={isSelected ? '3' : (hasActiveFloor ? '2' : '1')}
                      className="transition-all duration-300"
                      style={{
                        filter: isSelected ? 'drop-shadow(0 0 16px #00F0FF)' : undefined,
                      }}
                    />

                    {/* Rooftop Trim & Architectural Solar Details */}
                    <rect
                      x={b.x - b.w / 2 + 8}
                      y={b.y - b.h / 2 + 8}
                      width={b.w - 16}
                      height={b.h - 16}
                      rx="8"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeWidth="1"
                    />

                    {/* Entrance Portico Indicator */}
                    {b.entranceX && b.entranceY && (
                      <g>
                        <circle cx={b.entranceX} cy={b.entranceY} r="6" fill="#00F0FF" />
                        <circle cx={b.entranceX} cy={b.entranceY} r="12" fill="none" stroke="#00F0FF" strokeWidth="1" opacity="0.5" />
                      </g>
                    )}

                    {/* Building Name Tag / Badge */}
                    <g transform={`translate(${b.x}, ${b.y - b.h / 2 + 20})`}>
                      <rect
                        x="-70"
                        y="-12"
                        width="140"
                        height="24"
                        rx="12"
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke={b.iconColor}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        fill="#F8FAFC"
                        fontSize="10"
                        fontWeight="800"
                        textAnchor="middle"
                        letterSpacing="0.5"
                      >
                        {b.shortName}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* ---------------------------------------------------- */}
              {/* STAIRCASE VERTICAL PORTALS (TRANSITION HUBS)         */}
              {/* ---------------------------------------------------- */}
              {CAMPUS_STAIRS.map((stair) => (
                <g key={stair.id} className="cursor-pointer">
                  {/* Glowing Vertical Light Column */}
                  <line
                    x1={stair.x}
                    y1={stair.y}
                    x2={stair.x}
                    y2={stair.y - 45}
                    stroke="#8B5CF6"
                    strokeWidth="4"
                    strokeDasharray="4 3"
                    className="animate-pulse"
                  />
                  <circle cx={stair.x} cy={stair.y} r="14" fill="#4C1D95" stroke="#A78BFA" strokeWidth="2" />
                  <text x={stair.x} y={stair.y + 4} fill="#EDE9FE" fontSize="11" fontWeight="800" textAnchor="middle">
                    🪜
                  </text>
                  <text x={stair.x} y={stair.y + 24} fill="#C4B5FD" fontSize="9" fontWeight="700" textAnchor="middle">
                    {stair.name.split(' ')[0]} Stairs
                  </text>
                </g>
              ))}

              {/* ---------------------------------------------------- */}
              {/* 3 CAMPUS GATES WITH GLOWING BEACONS                  */}
              {/* ---------------------------------------------------- */}
              {CAMPUS_LANDMARKS.filter((l) => l.category === 'gate').map((g) => (
                <g key={g.id} className="cursor-pointer" onClick={() => setOrigin(g.id)}>
                  <circle cx={g.x} cy={g.y} r="20" fill="#064E3B" stroke="#10B981" strokeWidth="2" />
                  <circle cx={g.x} cy={g.y} r="30" fill="none" stroke="#10B981" strokeWidth="1.5" opacity="0.4" className="animate-ping" />
                  <text x={g.x} y={g.y + 5} fill="#A7F3D0" fontSize="13" fontWeight="800" textAnchor="middle">
                    🚪
                  </text>
                  <g transform={`translate(${g.x}, ${g.y + 32})`}>
                    <rect x="-55" y="-9" width="110" height="18" rx="9" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
                    <text x="0" y="3" fill="#34D399" fontSize="9" fontWeight="800" textAnchor="middle">
                      {g.shortName}
                    </text>
                  </g>
                </g>
              ))}

              {/* ---------------------------------------------------- */}
              {/* CLASSROOMS & LABS (ALL 136 SURVEYED ROOMS)           */}
              {/* ---------------------------------------------------- */}
              {structuredRooms.map((room) => {
                const isSelected = selectedRoom && selectedRoom.id === room.id;
                const isTarget = destination === room.id;
                const isStart = origin === room.id;

                // Floor visibility logic
                const isFloorVisible = activeFloor === 'all' || (activeFloor === '2F' && room.floorNumber === 2) ||
                  (activeFloor === '1F' && room.floorNumber === 1) ||
                  (activeFloor === 'G' && room.floorNumber === 0) ||
                  (activeFloor === 'B' && room.floorNumber === -1);

                // Vertical elevation in 3D exploded view
                let verticalOffset = 0;
                if (activeFloor === 'all') {
                  if (room.floorNumber === 2) verticalOffset = -42;
                  else if (room.floorNumber === 1) verticalOffset = -22;
                  else if (room.floorNumber === -1) verticalOffset = 18;
                }

                const rx = room.x;
                const ry = room.y + verticalOffset;

                return (
                  <g
                    key={room.id}
                    className="cursor-pointer transition-all duration-300"
                    opacity={isFloorVisible ? 1 : 0.2}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRoom(room);
                    }}
                  >
                    {/* Room Capsule Pill */}
                    <rect
                      x={rx - 22}
                      y={ry - 9}
                      width="44"
                      height="18"
                      rx="9"
                      fill={isSelected || isTarget ? '#00F0FF' : (isStart ? '#10B981' : room.categoryAccent.bg)}
                      stroke={isSelected || isTarget ? '#FFFFFF' : room.categoryAccent.border}
                      strokeWidth={isSelected || isTarget ? '2' : '1'}
                      style={{
                        filter: isSelected || isTarget ? 'url(#laser-glow)' : undefined,
                      }}
                    />
                    <text
                      x={rx}
                      y={ry + 3}
                      fill={isSelected || isTarget ? '#000000' : '#FFFFFF'}
                      fontSize="8"
                      fontWeight="800"
                      textAnchor="middle"
                    >
                      {room.shortBadge}
                    </text>

                    {/* Floor Level Super-script Badge */}
                    <circle cx={rx + 19} cy={ry - 7} r="5" fill="#0F172A" stroke={room.categoryAccent.border} strokeWidth="1" />
                    <text x={rx + 19} y={ry - 5} fill="#E2E8F0" fontSize="5.5" fontWeight="900" textAnchor="middle">
                      {room.floorBadge}
                    </text>

                    {/* Target Navigation Pulsing Marker */}
                    {(isTarget || isSelected) && (
                      <g>
                        <circle cx={rx} cy={ry} r="18" fill="none" stroke="#00F0FF" strokeWidth="1.5" className="animate-ping" />
                        <circle cx={rx} cy={ry} r="26" fill="none" stroke="#00F0FF" strokeWidth="1" opacity="0.4" />
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ---------------------------------------------------- */}
              {/* PULSING NEON LASER NAVIGATION ROUTE                  */}
              {/* ---------------------------------------------------- */}
              {route && route.path && route.path.length > 1 && (
                <g>
                  {/* Thick Neon Glow Underlay */}
                  <polyline
                    points={route.path.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="rgba(0, 240, 255, 0.45)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#laser-glow)"
                  />

                  {/* Core High-Tech Laser Ribbon */}
                  <polyline
                    points={route.path.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#00F0FF"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="10 6"
                    className="animate-pulse"
                  />

                  {/* Animated Traveling Photon Pulses */}
                  {route.path.map((p, idx) => {
                    if (idx % 2 !== 0 && idx !== route.path.length - 1) return null;
                    return (
                      <circle
                        key={`photon-${idx}`}
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill="#FFFFFF"
                        stroke="#00F0FF"
                        strokeWidth="2"
                        className="animate-ping"
                      />
                    );
                  })}

                  {/* Start Point Marker */}
                  <g transform={`translate(${route.path[0].x}, ${route.path[0].y})`}>
                    <circle cx="0" cy="0" r="16" fill="#10B981" />
                    <circle cx="0" cy="0" r="26" fill="none" stroke="#10B981" strokeWidth="2" className="animate-ping" />
                    <text x="0" y="4" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle">
                      A
                    </text>
                  </g>

                  {/* Destination Target Marker */}
                  <g transform={`translate(${route.path[route.path.length - 1].x}, ${route.path[route.path.length - 1].y})`}>
                    <circle cx="0" cy="0" r="16" fill="#00F0FF" />
                    <circle cx="0" cy="0" r="30" fill="none" stroke="#00F0FF" strokeWidth="2" className="animate-ping" />
                    <Crosshair className="w-5 h-5 text-black" x="-10" y="-10" />
                  </g>

                  {/* Live Simulation Walker Dot */}
                  {isSimulatingWalk && route.path[simStepIndex] && (
                    <g transform={`translate(${route.path[simStepIndex].x}, ${route.path[simStepIndex].y})`}>
                      <circle cx="0" cy="0" r="12" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="2" className="animate-bounce" />
                      <Footprints className="w-4 h-4 text-white" x="-8" y="-8" />
                    </g>
                  )}
                </g>
              )}

              {/* Compass Rose Indicator */}
              <g transform="translate(100, 850)">
                <circle cx="0" cy="0" r="28" fill="#0F172A" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                <polygon points="0,-22 6,-6 -6,-6" fill="#EF4444" />
                <polygon points="0,22 6,6 -6,6" fill="#94A3B8" />
                <text x="0" y="-8" fill="#EF4444" fontSize="9" fontWeight="900" textAnchor="middle">
                  N
                </text>
                <text x="0" y="16" fill="#94A3B8" fontSize="8" fontWeight="700" textAnchor="middle">
                  S
                </text>
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* VIEW TAB 2: CLASSROOM DIRECTORY MATRIX (136 ROOMS)           */}
      {/* ------------------------------------------------------------ */}
      {viewTab === 'directory' && (
        <div className="relative w-full h-full pt-32 pb-24 px-6 overflow-y-auto z-20">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white">UVCE Classroom & Lab Matrix Directory</h2>
                <p className="text-xs text-slate-400">
                  Total 136 Surveyed Academic Locations across Ground, 1st, 2nd, and Basement Floors.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {FLOOR_TABS.filter((t) => t.id !== 'all').map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFloor(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeFloor === tab.id
                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="group bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 transition-all duration-200 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {room.floorBadge} • {room.floor}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800">
                        {room.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {room.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{room.block || room.loc}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => {
                        handleSelectRoom(room);
                        setViewTab('3d');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500 hover:to-blue-600 hover:text-white text-cyan-300 border border-cyan-500/30 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Show on 3D Map</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* RIGHT FLOATING CYBER ELEVATOR & CAMERA HUD                   */}
      {/* ------------------------------------------------------------ */}
      <aside className="absolute right-4 top-28 bottom-24 z-30 pointer-events-none flex flex-col items-end justify-center gap-4">
        {/* Futuristic Floor Elevator Dock */}
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-2xl border border-slate-700/80 shadow-2xl p-2 rounded-3xl flex flex-col items-center gap-1.5">
          <div className="px-2 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            FLOOR
          </div>
          {FLOOR_TABS.map((tab) => {
            const isActive = activeFloor === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFloor(tab.id)}
                title={tab.desc}
                className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center text-xs font-black transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-black shadow-lg shadow-cyan-500/40 scale-105'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{tab.badge}</span>
                <span className="text-[8px] font-semibold opacity-75">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}

          <div className="w-6 h-px bg-slate-700/80 my-1" />

          {/* Camera Perspective Angle Presets */}
          <button
            onClick={() => setCameraMode('iso3d')}
            title="3D Isometric View"
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
              cameraMode === 'iso3d' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            3D
          </button>
          <button
            onClick={() => setCameraMode('perspective')}
            title="Spatial Perspective"
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
              cameraMode === 'perspective' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            POV
          </button>
          <button
            onClick={() => setCameraMode('ortho')}
            title="2D Blueprint Orthogonal"
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
              cameraMode === 'ortho' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            CAD
          </button>

          <div className="w-6 h-px bg-slate-700/80 my-1" />

          {/* Zoom In & Out */}
          <button
            onClick={() => handleZoom(0.15)}
            className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.15)}
            className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetCamera}
            title="Reset Camera"
            className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------ */}
      {/* LEFT FLOATING ROUTE TELEMETRY & TURN-BY-TURN GUIDANCE DRAWER */}
      {/* ------------------------------------------------------------ */}
      <aside className="absolute left-4 top-28 bottom-6 z-30 pointer-events-none w-full max-w-[340px] flex flex-col justify-between">
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-2xl border border-slate-700/80 shadow-2xl rounded-3xl p-4 flex flex-col max-h-full overflow-hidden">
          {/* Origin & Destination Route Form */}
          <div className="space-y-2.5 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                <span>Indoor Route Planner</span>
              </span>
              <button
                onClick={() => {
                  const tmp = origin;
                  setOrigin(destination);
                  setDestination(tmp);
                }}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Swap Start & Destination"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Start Selector */}
            <div className="relative">
              <div className="absolute left-2.5 top-2.5 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 text-xs text-white pl-8 pr-3 py-2 rounded-xl outline-none focus:border-cyan-400 transition"
              >
                <optgroup label="Campus Entrance Gates">
                  {CAMPUS_LANDMARKS.filter((l) => l.category === 'gate').map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Heritage Quadrangle & Labs">
                  {CAMPUS_LANDMARKS.filter((l) => l.category !== 'gate').map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Classrooms & Faculty Cabins">
                  {structuredRooms.slice(0, 40).map((r) => (
                    <option key={r.id} value={r.id}>{r.floorBadge} • {r.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Destination Selector */}
            <div className="relative">
              <div className="absolute left-2.5 top-2.5 w-2 h-2 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20" />
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 text-xs text-white pl-8 pr-3 py-2 rounded-xl outline-none focus:border-cyan-400 transition"
              >
                <optgroup label="Classrooms & Laboratories (136 Rooms)">
                  {structuredRooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.floorBadge} • {r.name} ({r.loc || r.block})</option>
                  ))}
                </optgroup>
                <optgroup label="Campus Landmarks & Amenities">
                  {CAMPUS_LANDMARKS.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Avoid Stairs Toggle */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Accessibility className="w-3.5 h-3.5 text-slate-300" />
                <span>Accessible / Avoid Stairs</span>
              </span>
              <button
                onClick={() => setAvoidStairs(!avoidStairs)}
                className={`w-9 h-5 rounded-full transition-colors p-0.5 ${
                  avoidStairs ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    avoidStairs ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Route Stats HUD */}
          {route && (
            <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-800 text-center">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div className="text-sm font-black text-cyan-300">{route.distance} m</div>
                <div className="text-[10px] text-slate-400 font-medium">Distance</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div className="text-sm font-black text-emerald-300">{route.estimatedMinutes} min</div>
                <div className="text-[10px] text-slate-400 font-medium">Walking</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div className="text-sm font-black text-violet-300">
                  {route.floorTransfers > 0 ? `+${route.floorTransfers} Flight` : 'Ground'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Vertical</div>
              </div>
            </div>
          )}

          {/* Turn-by-Turn Guidance Steps */}
          <div className="flex-1 overflow-y-auto my-2 pr-1 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Step-by-Step Guidance
            </div>
            {routeSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                  step.isStair
                    ? 'bg-violet-500/10 border-violet-500/30 text-violet-200'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-200'
                }`}
              >
                <span className="text-base">{step.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold">{step.text}</div>
                  <div className="text-[10px] text-slate-400">{step.badge}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Walk Simulation Button */}
          <div className="pt-2">
            <button
              onClick={() => setIsSimulatingWalk(!isSimulatingWalk)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-cyan-500/25 transition"
            >
              {isSimulatingWalk ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Walking Simulation</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Simulate 3D Route Walk</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------ */}
      {/* BOTTOM-RIGHT FLOATING SELECTED ROOM DETAIL CARD              */}
      {/* ------------------------------------------------------------ */}
      {selectedRoom && (
        <aside className="absolute bottom-6 right-20 z-30 pointer-events-none max-w-sm w-full">
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-2xl border border-cyan-500/40 shadow-2xl rounded-3xl p-4 transition-all animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-500 text-black">
                    {selectedRoom.floorBadge || selectedRoom.floorRange || 'G'}
                  </span>
                  <span className="text-xs text-slate-400">{selectedRoom.category}</span>
                </div>
                <h3 className="text-sm font-extrabold text-white">{selectedRoom.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedRoom.block || selectedRoom.loc || 'Campus Main'}</p>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  setDestination(selectedRoom.id);
                  setSelectedRoom(null);
                }}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-cyan-500/20"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Navigate Here</span>
              </button>
              <button
                onClick={() => {
                  setOrigin(selectedRoom.id);
                  setSelectedRoom(null);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Set as Start</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ------------------------------------------------------------ */}
      {/* ADD ROOM / FACULTY CABIN MODAL                               */}
      {/* ------------------------------------------------------------ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Plus className="w-4 h-4" />
                <span>Add Classroom or Cabin to Digital Twin</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Room or Cabin Name / Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE-214 AI & Vision Lab, Dr. Ramesh Cabin"
                  value={newRoomForm.name}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Campus Block</label>
                  <select
                    value={newRoomForm.block}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, block: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="Main Heritage - Left Wing">Main Left Wing (CSE/ECE)</option>
                    <option value="Main Heritage - Right Wing">Main Right Wing (TPO/EE)</option>
                    <option value="Mechanical Block">Mechanical Block</option>
                    <option value="Electrical & Science Block">Electrical & Science Block</option>
                    <option value="Lecture Hall Complex (LHC)">LHC Complex</option>
                    <option value="Minchu (Central Quad)">Minchu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Floor Level</label>
                  <select
                    value={newRoomForm.floorBadge}
                    onChange={(e) => {
                      const badge = e.target.value;
                      const num = badge === '2F' ? 2 : (badge === '1F' ? 1 : (badge === 'G' ? 0 : -1));
                      const label = badge === '2F' ? '2nd Floor' : (badge === '1F' ? '1st Floor' : (badge === 'G' ? 'Ground Floor' : 'Basement'));
                      setNewRoomForm({ ...newRoomForm, floorBadge: badge, floorNumber: num, floor: label });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="G">Ground Floor (G)</option>
                    <option value="1F">1st Floor (1F)</option>
                    <option value="2F">2nd Floor (2F)</option>
                    <option value="B">Basement (B)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category Type</label>
                <select
                  value={newRoomForm.category}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="Classroom">Classroom / Lecture Hall</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Faculty Cabin">Faculty Cabin</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                  <option value="Office / Admin">Office / Admin</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-2.5 rounded-xl font-bold"
                >
                  Save & Plot on 3D Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
