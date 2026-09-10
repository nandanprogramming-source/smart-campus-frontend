import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Search, Navigation, MapPin, Compass, Clock, Accessibility,
  CornerDownRight, ArrowRight, ArrowLeftRight, Layers,
  Crosshair, Star, Info, ShieldCheck, CheckCircle2,
  Utensils, BookOpen, GraduationCap, Building2, Trees, Sparkles, ChevronRight, X
} from 'lucide-react';
import uvceRooms from '../data/uvceRooms.json';

/* ------------------------------------------------------------------ */
/* Accurate UVCE K.R. Circle Dataset & GPS Coordinates                 */
/* Sourced directly from surveyed coordinates at https://myuvce.in/map  */
/* ------------------------------------------------------------------ */
export const UVCE_CENTER = [12.97485, 77.58615];

export const UVCE_LANDMARKS = [
  // 3 GATES
  {
    id: 'gate_main',
    name: 'Main Gate (K.R. Circle Entrance)',
    shortName: 'Main Gate',
    category: 'gate',
    lat: 12.9753648,
    lng: 77.5867286,
    description: 'Main campus gateway at K.R. Circle junction facing Post Office Road & Nrupathunga Road. Exact surveyed entrance.',
    hours: 'Open 24 hours',
    isGate: true,
    badge: 'K.R. Circle Gate',
    iconColor: '#10B981',
  },
  {
    id: 'gate_metro',
    name: 'Back Gate 1 (Metro Gate)',
    shortName: 'Metro Gate',
    category: 'gate',
    lat: 12.9743796,
    lng: 77.5847201,
    description: 'Rear campus gate on Post Office Road directly facing Sir M. Visvesvaraya (Central College) Metro Station.',
    hours: '6:00 AM - 10:00 PM',
    isGate: true,
    badge: 'Metro Gate',
    iconColor: '#10B981',
  },
  {
    id: 'gate_back2',
    name: 'Gate 2 (Nrupathunga Road Gate)',
    shortName: 'Nrupathunga Gate',
    category: 'gate',
    lat: 12.9744166,
    lng: 77.5867586,
    description: 'Campus gate situated on Nrupathunga Road along the Left Wing perimeter, offering fast entry to admin, library, and quadrangle.',
    hours: '6:00 AM - 9:00 PM',
    isGate: true,
    badge: 'Nrupathunga Rd',
    iconColor: '#10B981',
  },

  // BUILDINGS & LANDMARKS (Surveyed coordinates from myuvce.in/map)
  {
    id: 'main_building',
    name: 'Main Heritage Block (Left & Right Wings)',
    shortName: 'Main Heritage Block',
    category: 'academic',
    lat: 12.9750633,
    lng: 77.5866562,
    description: 'Historic main quadrangle building. Ground: Director Office, Admin Office, TPO. 1st & 2nd Floors: CSE & ECE Departments, Labs 211, 213, EC-201, Classrooms.',
    hours: '8:30 AM - 5:30 PM',
    badge: 'Admin & CSE/ECE',
    iconColor: '#0A84FF',
  },
  {
    id: 'minchu',
    name: 'Minchu Building',
    shortName: 'Minchu',
    category: 'academic',
    lat: 12.974937,
    lng: 77.586295,
    description: 'The iconic central structure between the Left and Right Wings inside the main quadrangle.',
    hours: '8:30 AM - 6:00 PM',
    badge: 'Central Quad',
    iconColor: '#8B5CF6',
  },
  {
    id: 'library',
    name: 'Central Library & Centenary Hall',
    shortName: 'Central Library',
    category: 'library',
    lat: 12.9748555,
    lng: 77.5862418,
    description: 'Located behind the Minchu building in the central quadrangle. Centenary Seminar Hall, vast reference collection, digital archives, and quiet study hall.',
    hours: '8:30 AM - 8:00 PM',
    badge: 'Central Library',
    iconColor: '#3B82F6',
  },
  {
    id: 'lhc',
    name: 'Lecture Hall Complex (LHC)',
    shortName: 'LHC',
    category: 'academic',
    lat: 12.974462,
    lng: 77.585887,
    description: 'Situated ~20-30 meters behind the Library. Contains Lecture Halls LH 1 to LH 6, used for general engineering classes, seminars, and examinations.',
    hours: '8:30 AM - 5:30 PM',
    badge: 'LH 1 to LH 6',
    iconColor: '#0A84FF',
  },
  {
    id: 'rock_garden',
    name: 'Rock Garden',
    shortName: 'Rock Garden',
    category: 'amenity',
    lat: 12.974730,
    lng: 77.585773,
    description: 'Vibrant student hangout hub located behind the LHC with stone seating, trees, and natural ambiance.',
    hours: 'Always Open',
    badge: 'Student Hangout',
    iconColor: '#12B981',
  },
  {
    id: 'nandini',
    name: 'Nandini Canteen',
    shortName: 'Nandini Canteen',
    category: 'dining',
    lat: 12.9746106,
    lng: 77.5856191,
    description: 'The campus canteen located right inside the Rock Garden. Serves tea, coffee, snacks, breakfast, and refreshments.',
    hours: '8:00 AM - 6:30 PM',
    badge: 'Canteen & Coffee',
    iconColor: '#F5A623',
  },
  {
    id: 'marvel_ieee',
    name: 'MARVEL & IEEE Club Building',
    shortName: 'MARVEL / IEEE Hub',
    category: 'academic',
    lat: 12.9748563,
    lng: 77.5856111,
    description: 'Active student innovation & makerspace hub in the Rock Garden. Houses MARVEL R&D club and IEEE UVCE Student Branch.',
    hours: '9:00 AM - 7:00 PM',
    badge: 'Innovation Hub',
    iconColor: '#EC4899',
  },
  {
    id: 'eee_science_block',
    name: 'Electrical Block & Basic Science Labs',
    shortName: 'EEE & Science Block',
    category: 'academic',
    lat: 12.974093,
    lng: 77.585458,
    description: 'Rear building situated behind the IEEE club. Houses Electrical & Electronics Engineering Department, Physics Lab, Chemistry Lab, and AC/DC Machines Lab.',
    hours: '8:30 AM - 5:30 PM',
    badge: 'EEE, Physics & Chem',
    iconColor: '#6366F1',
  },
  {
    id: 'open_air_theater',
    name: 'Open Air Theater (OAT) & NCC',
    shortName: 'OAT & NCC Unit',
    category: 'amenity',
    lat: 12.974122,
    lng: 77.586021,
    description: 'Open Air Theater and No.2 KAR Air Squadron NCC unit, adjacent to Electrical block and south Left Wing.',
    hours: 'Open during campus hours',
    badge: 'Cultural & NCC',
    iconColor: '#8B5CF6',
  },
  {
    id: 'mech_block',
    name: 'Mechanical Block & Workshops',
    shortName: 'Mechanical Block',
    category: 'academic',
    lat: 12.9759797,
    lng: 77.5866964,
    description: 'Located across Post Office Road (opposite Main Gate near SBM). Mechanical Engineering Department, ML 102-104, ML 201-205 lecture rooms, CAD Lab, and workshops.',
    hours: '8:30 AM - 5:30 PM',
    badge: 'Across Road (Mech)',
    iconColor: '#06B6D4',
  },
];

/* ------------------------------------------------------------------ */
/* Surveyed Building Polygons from official UVCE map (myuvce.in/map)  */
/* ------------------------------------------------------------------ */
export const UVCE_BUILDING_POLYGONS = [
  {
    id: 'left_wing_poly',
    name: 'Main Heritage - Left Wing (CSE / ECE / Admin)',
    landmarkId: 'main_building',
    color: '#0A84FF',
    points: [
      [12.9752902, 77.5867671],
      [12.9752223, 77.5866598],
      [12.9742343, 77.5862736],
      [12.9742003, 77.5861019],
      [12.9742134, 77.5860832],
      [12.9741924, 77.5859732],
      [12.9740121, 77.5860081],
      [12.9740304, 77.5861288],
      [12.9740774, 77.5861207],
      [12.9741219, 77.5863675],
      [12.9752850, 77.5867886],
      [12.9752902, 77.5867671],
    ],
  },
  {
    id: 'right_wing_poly',
    name: 'Main Heritage - Right Wing (TPO / EE Labs)',
    landmarkId: 'main_building',
    color: '#6366F1',
    points: [
      [12.9754313, 77.5866115],
      [12.9749922, 77.5854904],
      [12.9745897, 77.5853724],
      [12.9745662, 77.5854850],
      [12.9748459, 77.5855682],
      [12.9748929, 77.5856862],
      [12.9749164, 77.5856835],
      [12.9753347, 77.5866626],
      [12.9753928, 77.5866773],
      [12.9754313, 77.5866115],
    ],
  },
  {
    id: 'minchu_poly',
    name: 'Minchu Building (Central Quadrangle)',
    landmarkId: 'minchu',
    color: '#F59E0B',
    points: [
      [12.9749321, 77.5860590],
      [12.9747047, 77.5863165],
      [12.9748093, 77.5864158],
      [12.9748616, 77.5864265],
      [12.9750576, 77.5862200],
      [12.9749321, 77.5860590],
    ],
  },
  {
    id: 'lhc_poly',
    name: 'Lecture Hall Complex (LH 1 - 6)',
    landmarkId: 'lhc',
    color: '#10B981',
    points: [
      [12.9746629, 77.5859678],
      [12.9744747, 77.5857694],
      [12.9742447, 77.5860268],
      [12.9744303, 77.5862012],
      [12.9745296, 77.5860751],
      [12.9745610, 77.5860966],
      [12.9746629, 77.5859678],
    ],
  },
  {
    id: 'electrical_poly',
    name: 'Electrical Block & Science Labs',
    landmarkId: 'eee_science_block',
    color: '#EC4899',
    points: [
      [12.9739363, 77.5854797],
      [12.9739807, 77.5855870],
      [12.9742970, 77.5854046],
      [12.9743754, 77.5854019],
      [12.9743885, 77.5853026],
      [12.9742290, 77.5852758],
      [12.9739363, 77.5854797],
    ],
  },
  {
    id: 'rock_garden_poly',
    name: 'Rock Garden & Nandini',
    landmarkId: 'rock_garden',
    color: '#059669',
    points: [
      [12.9746106, 77.5855172],
      [12.9744146, 77.5856191],
      [12.9747727, 77.5861449],
      [12.9749975, 77.5859544],
      [12.9748563, 77.5856111],
      [12.9746106, 77.5855172],
    ],
  },
  {
    id: 'mech_poly',
    name: 'Mechanical Block (Across Road)',
    landmarkId: 'mech_block',
    color: '#06B6D4',
    points: [
      [12.9761066, 77.5865619],
      [12.9760622, 77.5866049],
      [12.9759459, 77.5865780],
      [12.9757459, 77.5860966],
      [12.9756531, 77.5861341],
      [12.9758740, 77.5866813],
      [12.9759328, 77.5866800],
      [12.9759354, 77.5866961],
      [12.9760465, 77.5867068],
      [12.9761014, 77.5867282],
      [12.9761811, 77.5866223],
      [12.9761066, 77.5865619],
    ],
  },
];

export const UVCE_JUNCTIONS = [
  { id: 'j_crossroad', name: 'Post Office Road Crosswalk', lat: 12.97565, lng: 77.58671 },
  { id: 'j_front_plaza', name: 'Main Heritage Portico (Senate Hall)', lat: 12.9753197, lng: 77.5866713 },
  { id: 'j_nrupathunga_path', name: 'Nrupathunga Gate Walkway', lat: 12.9744166, lng: 77.5867586 },
  { id: 'j_quad_center', name: 'Quadrangle Walkway', lat: 12.97490, lng: 77.58625 },
  { id: 'j_lhc_path', name: 'LHC Walkway', lat: 12.97455, lng: 77.58600 },
  { id: 'j_rock_path', name: 'Rock Garden Entrance', lat: 12.97468, lng: 77.58575 },
  { id: 'j_metro_corridor', name: 'Metro Corridor Walkway', lat: 12.97435, lng: 77.58525 },
  { id: 'j_south_courtyard', name: 'South Courtyard (OAT / EEE)', lat: 12.97412, lng: 77.58580 },
];

export const ALL_NAV_POINTS = [...UVCE_LANDMARKS, ...UVCE_JUNCTIONS];
export const NAV_POINT_MAP = Object.fromEntries(ALL_NAV_POINTS.map((n) => [n.id, n]));

// Graph edges connecting UVCE buildings and paths
export const UVCE_EDGES = [
  // Across Post Office Road to Mechanical Block
  ['mech_block', 'j_crossroad', false],
  ['j_crossroad', 'gate_main', false],
  // Main Gate to Senate Hall Portico and Main Building
  ['gate_main', 'j_front_plaza', false],
  ['j_front_plaza', 'main_building', false],
  ['main_building', 'minchu', false],
  ['minchu', 'j_quad_center', false],
  ['j_quad_center', 'library', false],
  // Nrupathunga Road Gate connections
  ['gate_back2', 'j_nrupathunga_path', false],
  ['j_nrupathunga_path', 'main_building', false],
  ['j_nrupathunga_path', 'minchu', false],
  ['j_nrupathunga_path', 'open_air_theater', false],
  // Library to LHC Walkway
  ['library', 'j_lhc_path', false],
  ['j_lhc_path', 'lhc', false],
  // LHC to Rock Garden, Nandini, and MARVEL / IEEE Hub
  ['lhc', 'rock_garden', false],
  ['rock_garden', 'nandini', false],
  ['rock_garden', 'marvel_ieee', false],
  // Rock Garden / IEEE to EEE & Science Block
  ['marvel_ieee', 'eee_science_block', false],
  ['eee_science_block', 'j_south_courtyard', false],
  ['j_south_courtyard', 'open_air_theater', false],
  // Metro Gate connections
  ['gate_metro', 'j_metro_corridor', false],
  ['j_metro_corridor', 'eee_science_block', false],
  ['j_metro_corridor', 'marvel_ieee', false],
  ['j_metro_corridor', 'lhc', false],
  // Direct corridor connecting Main Building to LHC
  ['main_building', 'j_lhc_path', false],
];

/* ------------------------------------------------------------------ */
/* Geo Math & Dijkstra Pathfinding Engine                             */
/* ------------------------------------------------------------------ */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(5, Math.round(R * c));
}

export function solveShortestPath(startId, endId, avoidStairs = false) {
  if (!startId || !endId || !NAV_POINT_MAP[startId] || !NAV_POINT_MAP[endId]) return null;
  if (startId === endId) {
    return { path: [NAV_POINT_MAP[startId]], distance: 0, estimatedMinutes: 1 };
  }

  const usableEdges = avoidStairs ? UVCE_EDGES.filter(([, , stairs]) => !stairs) : UVCE_EDGES;
  const adj = {};
  usableEdges.forEach(([from, to, stairs]) => {
    const pA = NAV_POINT_MAP[from];
    const pB = NAV_POINT_MAP[to];
    if (!pA || !pB) return;
    const w = haversineDistance(pA.lat, pA.lng, pB.lat, pB.lng);
    (adj[from] = adj[from] || []).push({ to, w });
    (adj[to] = adj[to] || []).push({ to: from, w });
  });

  const dist = {};
  const prev = {};
  const visited = new Set();
  ALL_NAV_POINTS.forEach((n) => { dist[n.id] = Infinity; });
  dist[startId] = 0;

  while (visited.size < ALL_NAV_POINTS.length) {
    let u = null;
    let best = Infinity;
    ALL_NAV_POINTS.forEach((n) => {
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
  while (cur !== undefined && guard < ALL_NAV_POINTS.length + 2) {
    path.unshift(cur);
    cur = prev[cur];
    guard++;
  }

  if (path[0] !== startId) {
    // Fallback: direct line if disconnected
    return {
      path: [NAV_POINT_MAP[startId], NAV_POINT_MAP[endId]],
      distance: haversineDistance(
        NAV_POINT_MAP[startId].lat, NAV_POINT_MAP[startId].lng,
        NAV_POINT_MAP[endId].lat, NAV_POINT_MAP[endId].lng
      ),
      estimatedMinutes: 1,
    };
  }

  const pathPoints = path.map((id) => NAV_POINT_MAP[id]);
  const distance = Math.round(dist[endId]);
  const estimatedMinutes = Math.max(1, Math.round(distance / 80)); // 80 m/min walking speed

  return { path: pathPoints, distance, estimatedMinutes };
}

// Generates human-friendly walking guidance
export function buildHumanDirections(pathPoints) {
  if (!pathPoints || pathPoints.length < 2) return [];
  const steps = [];
  steps.push({
    instruction: `Start at ${pathPoints[0].name || pathPoints[0].label}`,
    distance: 0,
    point: pathPoints[0],
  });

  for (let i = 1; i < pathPoints.length; i++) {
    const from = pathPoints[i - 1];
    const to = pathPoints[i];
    const segDist = haversineDistance(from.lat, from.lng, to.lat, to.lng);

    if (i === pathPoints.length - 1) {
      steps.push({
        instruction: `Arrive at ${to.name || to.label}`,
        distance: segDist,
        point: to,
      });
    } else {
      const next = pathPoints[i + 1];
      const bearing1 = Math.atan2(to.lng - from.lng, to.lat - from.lat) * (180 / Math.PI);
      const bearing2 = Math.atan2(next.lng - to.lng, next.lat - to.lat) * (180 / Math.PI);
      let turnAngle = bearing2 - bearing1;
      while (turnAngle > 180) turnAngle -= 360;
      while (turnAngle < -180) turnAngle += 360;

      let action = 'Continue straight past';
      if (turnAngle > 25) action = 'Turn right towards';
      else if (turnAngle < -25) action = 'Turn left towards';

      steps.push({
        instruction: `${action} ${to.name || to.label}`,
        distance: segDist,
        point: to,
      });
    }
  }
  return steps;
}

/* ------------------------------------------------------------------ */
/* Category Helpers                                                   */
/* ------------------------------------------------------------------ */
const CATEGORIES = [
  { id: 'all', label: 'All Places' },
  { id: 'gate', label: 'Gates' },
  { id: 'academic', label: 'Academic & Blocks' },
  { id: 'dining', label: 'Canteen & Food' },
  { id: 'library', label: 'Library' },
  { id: 'amenity', label: 'Gardens & Hubs' },
];

function getCategoryIcon(cat) {
  switch (cat) {
    case 'gate': return ShieldCheck;
    case 'dining': return Utensils;
    case 'library': return BookOpen;
    case 'amenity': return Trees;
    case 'academic': return GraduationCap;
    default: return Building2;
  }
}

/* ------------------------------------------------------------------ */
/* Main CampusNavigation Component                                    */
/* ------------------------------------------------------------------ */
export default function CampusNavigation({ dark, c, session, api }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const routeLayerRef = useRef(null);
  const userGpsMarkerRef = useRef(null);

  const [origin, setOrigin] = useState('gate_main');
  const [destination, setDestination] = useState('minchu');
  const [avoidStairs, setAvoidStairs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLandmark, setSelectedLandmark] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [mapType, setMapType] = useState('streets'); // 'streets' | 'satellite'
  const [tileLayerRef, setTileLayerRef] = useState(null);

  // Compute Route
  const route = useMemo(() => {
    return solveShortestPath(origin, destination, avoidStairs);
  }, [origin, destination, avoidStairs]);

  const steps = useMemo(() => {
    return route ? buildHumanDirections(route.path) : [];
  }, [route]);

  // Filtered Landmarks
  const filteredLandmarks = useMemo(() => {
    return UVCE_LANDMARKS.filter((l) => {
      const matchCat = selectedCategory === 'all' || l.category === selectedCategory;
      const matchQuery = !searchQuery ||
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Matching specific rooms/labs from the 136 surveyed rooms
  const matchingRooms = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase();
    return (uvceRooms || [])
      .filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.loc.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [searchQuery]);

  /* ------------------------------------------------------------------ */
  /* Initialize Leaflet Map                                             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: UVCE_CENTER,
      zoom: 18,
      minZoom: 16,
      maxZoom: 20,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors | UVCE Campus',
        maxZoom: 20,
      }
    ).addTo(map);

    setTileLayerRef(tileLayer);
    mapInstanceRef.current = map;

    // Render official surveyed building polygons from myuvce.in/map
    UVCE_BUILDING_POLYGONS.forEach((bp) => {
      const poly = L.polygon(bp.points, {
        color: bp.color,
        weight: 2,
        fillColor: bp.color,
        fillOpacity: 0.16,
      }).addTo(map);

      poly.bindTooltip(
        `<div style="font-weight:700;font-size:11px;color:${bp.color};padding:2px 4px;">${bp.name}</div>`,
        { sticky: true, direction: 'top' }
      );

      poly.on('click', () => {
        const landmark = UVCE_LANDMARKS.find((l) => l.id === bp.landmarkId);
        if (landmark) setSelectedLandmark(landmark);
      });
    });

    // Render walkway lines
    UVCE_EDGES.forEach(([fromId, toId, stairs]) => {
      const pA = NAV_POINT_MAP[fromId];
      const pB = NAV_POINT_MAP[toId];
      if (!pA || !pB) return;
      L.polyline([[pA.lat, pA.lng], [pB.lat, pB.lng]], {
        color: stairs ? '#F5A623' : '#64748B',
        weight: 3,
        opacity: 0.25,
        dashArray: stairs ? '2, 6' : undefined,
      }).addTo(map);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Toggle Map Tiles (Streets vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef) return;
    mapInstanceRef.current.removeLayer(tileLayerRef);

    let newLayer;
    if (mapType === 'satellite') {
      newLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS', maxZoom: 19 }
      );
    } else {
      newLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '&copy; OpenStreetMap contributors | UVCE', maxZoom: 20 }
      );
    }
    newLayer.addTo(mapInstanceRef.current);
    setTileLayerRef(newLayer);
  }, [mapType]);

  /* ------------------------------------------------------------------ */
  /* Render Custom Markers on Map                                       */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    UVCE_LANDMARKS.forEach((landmark) => {
      const isOrigin = origin === landmark.id;
      const isDest = destination === landmark.id;
      const isSelected = selectedLandmark?.id === landmark.id;

      // Custom icon HTML
      const isGate = landmark.isGate;
      let bg = landmark.iconColor || '#0A84FF';
      if (isDest) bg = '#EF4444';
      if (isOrigin) bg = '#10B981';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${(isOrigin || isDest || isSelected) ? `
            <div class="absolute -inset-2 rounded-full animate-ping opacity-75" style="background: ${bg}"></div>
          ` : ''}
          <div class="w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-white border-2 border-white transition-transform transform group-hover:scale-110" style="background: ${bg}">
            ${isGate ? '🚪' : (landmark.category === 'dining' ? '☕' : (landmark.category === 'library' ? '📚' : '🏛️'))}
          </div>
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-bold shadow-md pointer-events-none ${dark ? 'bg-slate-900 text-slate-100 border border-slate-700' : 'bg-white text-slate-800 border border-slate-200'}">
            ${landmark.shortName}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-campus-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([landmark.lat, landmark.lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedLandmark(landmark);
      });

      markersRef.current[landmark.id] = marker;
    });
  }, [origin, destination, selectedLandmark, dark]);

  /* ------------------------------------------------------------------ */
  /* Render Active Route Polyline on Map                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (route && route.path.length >= 2) {
      const latLngs = route.path.map((p) => [p.lat, p.lng]);

      const polyline = L.polyline(latLngs, {
        color: '#0A84FF',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routeLayerRef.current = polyline;

      // Fit map view to route with smooth animation
      map.fitBounds(polyline.getBounds(), {
        padding: [60, 60],
        maxZoom: 19,
        animate: true,
      });
    }
  }, [route]);

  /* ------------------------------------------------------------------ */
  /* Live GPS Geolocation Handler                                       */
  /* ------------------------------------------------------------------ */
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);

        const map = mapInstanceRef.current;
        if (map) {
          if (userGpsMarkerRef.current) map.removeLayer(userGpsMarkerRef.current);

          const gpsIcon = L.divIcon({
            html: `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-8 h-8 rounded-full bg-blue-500 opacity-40 animate-ping"></div>
                <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg"></div>
              </div>
            `,
            className: 'user-gps-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          userGpsMarkerRef.current = L.marker([latitude, longitude], { icon: gpsIcon }).addTo(map);
          map.setView([latitude, longitude], 19, { animate: true });

          // Find closest campus landmark or gate
          let closest = null;
          let minD = Infinity;
          UVCE_LANDMARKS.forEach((l) => {
            const d = haversineDistance(latitude, longitude, l.lat, l.lng);
            if (d < minD) {
              minD = d;
              closest = l;
            }
          });

          if (closest && minD < 400) {
            setOrigin(closest.id);
          }
        }
      },
      (err) => {
        setLocatingUser(false);
        alert('Could not retrieve your GPS location. Please check browser location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleCenterCampus = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(UVCE_CENTER, 18, { animate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: c.text }}>
              UVCE Campus Navigation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              K.R. Circle Campus
            </span>
          </div>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: c.subtext }}>
            Accurate GPS-grounded wayfinding, gates, and student facilities
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tile Toggle */}
          <button
            onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-colors"
            style={{
              background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)',
              borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              color: c.text,
            }}
          >
            <Layers size={13} />
            {mapType === 'streets' ? 'Satellite View' : 'Street View'}
          </button>

          {/* Recenter button */}
          <button
            onClick={handleCenterCampus}
            className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-colors"
            style={{
              background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)',
              borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              color: c.text,
            }}
          >
            <Compass size={13} />
            Reset View
          </button>
        </div>
      </div>

      {/* Main Grid: Control Panel + Map */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Route Controls & Turn-by-Turn (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Origin & Destination Card */}
          <div
            className="rounded-3xl border p-4 sm:p-5 shadow-xl backdrop-blur-xl"
            style={{
              background: dark ? 'rgba(28,28,30,0.7)' : 'rgba(255,255,255,0.8)',
              borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                <Navigation size={13} /> Plan Your Route
              </span>
              <button
                onClick={handleLocateMe}
                disabled={locatingUser}
                className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Crosshair size={13} className={locatingUser ? 'animate-spin' : ''} />
                {locatingUser ? 'Locating…' : 'Locate Me (GPS)'}
              </button>
            </div>

            <div className="space-y-3 relative">
              {/* Origin Selector */}
              <div>
                <label className="text-[11px] font-semibold block mb-1" style={{ color: c.subtext }}>
                  START POINT (FROM)
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm font-medium border outline-none transition-colors"
                    style={{
                      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(241,245,249,0.9)',
                      borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                      color: c.text,
                    }}
                  >
                    <optgroup label="Campus Gates (Entrances)">
                      {UVCE_LANDMARKS.filter((l) => l.isGate).map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Buildings & Landmarks">
                      {UVCE_LANDMARKS.filter((l) => !l.isGate).map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-1">
                <button
                  onClick={handleSwap}
                  title="Swap Origin and Destination"
                  className="p-1.5 rounded-full border shadow-sm transition-transform hover:rotate-180 duration-300"
                  style={{
                    background: dark ? 'rgba(40,40,45,0.9)' : '#fff',
                    borderColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                    color: c.text,
                  }}
                >
                  <ArrowLeftRight size={13} />
                </button>
              </div>

              {/* Destination Selector */}
              <div>
                <label className="text-[11px] font-semibold block mb-1" style={{ color: c.subtext }}>
                  DESTINATION (TO)
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm font-medium border outline-none transition-colors"
                    style={{
                      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(241,245,249,0.9)',
                      borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                      color: c.text,
                    }}
                  >
                    <optgroup label="Buildings & Landmarks">
                      {UVCE_LANDMARKS.filter((l) => !l.isGate).map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Campus Gates">
                      {UVCE_LANDMARKS.filter((l) => l.isGate).map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Accessible Route Toggle */}
              <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: c.divider }}>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer" style={{ color: c.subtext }}>
                  <input
                    type="checkbox"
                    checked={avoidStairs}
                    onChange={(e) => setAvoidStairs(e.target.checked)}
                    className="rounded text-blue-500"
                  />
                  <Accessibility size={14} /> Wheelchair Accessible (Avoid stairs)
                </label>
              </div>
            </div>
          </div>

          {/* Route Summary & Turn-by-Turn Card */}
          {route && (
            <div
              className="rounded-3xl border p-4 sm:p-5 shadow-xl backdrop-blur-xl animate-fadeUp"
              style={{
                background: dark ? 'rgba(28,28,30,0.7)' : 'rgba(255,255,255,0.8)',
                borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: c.divider }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.subtext }}>
                    Walking Distance
                  </p>
                  <p className="text-xl font-bold text-blue-500">
                    {route.distance} meters
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.subtext }}>
                    Est. Walk Time
                  </p>
                  <p className="text-xl font-bold text-emerald-500 flex items-center gap-1 justify-end">
                    <Clock size={16} /> ~{route.estimatedMinutes} min
                  </p>
                </div>
              </div>

              {/* Turn Steps */}
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: c.subtext }}>
                  Directions ({steps.length} Steps)
                </p>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs p-2 rounded-xl transition-colors hover:bg-black/5"
                      style={{ color: c.text }}
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium leading-relaxed">{step.instruction}</p>
                        {step.distance > 0 && (
                          <p className="text-[10px] mt-0.5 font-semibold text-slate-400">
                            {step.distance}m walking
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search & Directory Explorer */}
          <div
            className="rounded-3xl border p-4 shadow-xl backdrop-blur-xl"
            style={{
              background: dark ? 'rgba(28,28,30,0.7)' : 'rgba(255,255,255,0.8)',
              borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl mb-3 border" style={{ background: c.input, borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
              <Search size={14} style={{ color: c.faint }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search labs, clubs, classrooms, Nandini…"
                className="bg-transparent outline-none text-xs flex-1"
                style={{ color: c.text }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}><X size={13} style={{ color: c.faint }} /></button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'border text-slate-500 hover:bg-black/5'
                  }`}
                  style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* List of matching landmarks */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto mt-2 pr-1">
              {filteredLandmarks.map((item) => {
                const Icon = getCategoryIcon(item.category);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedLandmark(item);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView([item.lat, item.lng], 19, { animate: true });
                      }
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors hover:bg-black/5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${item.iconColor}20`, color: item.iconColor }}>
                        <Icon size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate" style={{ color: c.text }}>{item.name}</p>
                        <p className="text-[10px] truncate" style={{ color: c.subtext }}>{item.badge}</p>
                      </div>
                    </div>
                    <ChevronRight size={13} style={{ color: c.faint }} />
                  </button>
                );
              })}
              {filteredLandmarks.length === 0 && matchingRooms.length === 0 && (
                <p className="text-xs py-3 text-center" style={{ color: c.faint }}>No matching locations found.</p>
              )}
            </div>

            {/* Matching Surveyed Rooms from myuvce.in */}
            {matchingRooms.length > 0 && (
              <div className="mt-3 pt-2.5 border-t" style={{ borderColor: c.divider }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: c.faint }}>
                  <span>Classrooms & Labs ({matchingRooms.length})</span>
                  <span className="text-[9px] text-blue-500 font-medium">From myuvce.in</span>
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {matchingRooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-2 rounded-xl flex items-center justify-between gap-2 border transition-colors hover:bg-black/5"
                      style={{
                        background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                        borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs truncate" style={{ color: c.text }}>{room.name}</p>
                        <p className="text-[10px] truncate" style={{ color: c.subtext }}>{room.loc} • {room.floor} Floor</p>
                      </div>
                      <button
                        onClick={() => {
                          // Find nearest landmark to route to
                          let best = UVCE_LANDMARKS[0];
                          let minDist = Infinity;
                          UVCE_LANDMARKS.forEach((lm) => {
                            const d = haversineDistance(room.lat, room.lng, lm.lat, lm.lng);
                            if (d < minDist) { minDist = d; best = lm; }
                          });
                          setDestination(best.id);
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.setView([room.lat, room.lng], 19, { animate: true });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors shrink-0 shadow-sm"
                      >
                        Navigate
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Leaflet Interactive Map Viewport (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className="rounded-3xl border overflow-hidden shadow-2xl relative"
            style={{
              height: 580,
              borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              background: dark ? '#1C1C1E' : '#E2E8F0',
            }}
          >
            {/* The Leaflet Container */}
            <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

            {/* Selected Landmark Info Drawer Overlay */}
            {selectedLandmark && (
              <div
                className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl animate-fadeUp"
                style={{
                  background: dark ? 'rgba(28,28,30,0.92)' : 'rgba(255,255,255,0.94)',
                  borderColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold" style={{ color: c.text }}>
                        {selectedLandmark.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${selectedLandmark.iconColor}25`, color: selectedLandmark.iconColor }}>
                        {selectedLandmark.badge}
                      </span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: c.subtext }}>
                      {selectedLandmark.description}
                    </p>
                    <p className="text-[11px] mt-1.5 flex items-center gap-1 font-medium" style={{ color: c.faint }}>
                      <Clock size={11} /> {selectedLandmark.hours}
                    </p>
                  </div>
                  <button onClick={() => setSelectedLandmark(null)} className="p-1 rounded-lg hover:bg-black/5">
                    <X size={14} style={{ color: c.faint }} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t" style={{ borderColor: c.divider }}>
                  <button
                    onClick={() => {
                      setOrigin(selectedLandmark.id);
                      setSelectedLandmark(null);
                    }}
                    className="py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors hover:bg-black/5"
                    style={{ borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)', color: c.text }}
                  >
                    Set as Start
                  </button>
                  <button
                    onClick={() => {
                      setDestination(selectedLandmark.id);
                      setSelectedLandmark(null);
                    }}
                    className="py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-blue-500 text-white shadow-md hover:bg-blue-600 transition-colors"
                  >
                    <Navigation size={12} /> Navigate Here
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
