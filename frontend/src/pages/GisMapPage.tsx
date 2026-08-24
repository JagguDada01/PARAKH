import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin, Filter, Layers, ShieldAlert, Copy, Eye,
  Navigation, RefreshCw, X, ArrowUpRight, Search,
  UserCheck, Building, Receipt
} from 'lucide-react';

import { GisMarker, DuplicateCandidate } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { TransactionLedgerModal } from '../components/TransactionLedgerModal';

// Helper component to center map dynamically on state/project selection
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

interface GisMapPageProps {
  initialProjectId?: string;
  onSelectProject: (projectId: string) => void;
}

export const GisMapPage: React.FC<GisMapPageProps> = ({
  initialProjectId,
  onSelectProject,
}) => {
  const [markers, setMarkers] = useState<GisMarker[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<GisMarker | null>(null);
  const [txModalProjectId, setTxModalProjectId] = useState<string | null>(null);

  // Filters
  const [stateFilter, setStateFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showDuplicateLinks, setShowDuplicateLinks] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);

  // Map view center & zoom
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const [markerData, dupData] = await Promise.all([
        api.getGisMarkers({
          state: stateFilter || undefined,
          risk_level: riskFilter || undefined,
          project_type: typeFilter || undefined,
        }),
        api.listDuplicates(),
      ]);
      setMarkers(markerData);
      setDuplicates(dupData);

      // If initialProjectId was passed, focus on it
      if (initialProjectId) {
        const found = markerData.find(m => m.project_id.toUpperCase() === initialProjectId.toUpperCase());
        if (found) {
          setSelectedMarker(found);
          setMapCenter([found.latitude, found.longitude]);
          setMapZoom(13);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [stateFilter, riskFilter, typeFilter]);

  const [filterOptions, setFilterOptions] = useState<any>(null);

  const STATE_COORDINATES: Record<string, [number, number]> = {
    'Andaman And Nicobar Islands': [11.7401, 92.6586],
    'Andhra Pradesh': [15.9129, 79.7400],
    'Arunachal Pradesh': [28.2180, 94.7278],
    'Assam': [26.2006, 92.9376],
    'Bihar': [25.0961, 85.3131],
    'Chandigarh': [30.7333, 76.7794],
    'Chhattisgarh': [21.2787, 81.8661],
    'The Dadra And Nagar Haveli And Daman And Diu': [20.1809, 73.0169],
    'Delhi': [28.7041, 77.1025],
    'Goa': [15.2993, 74.1240],
    'Gujarat': [22.2587, 71.1924],
    'Haryana': [29.0588, 76.0856],
    'Himachal Pradesh': [31.1048, 77.1734],
    'Jammu And Kashmir': [33.7782, 76.5762],
    'Jharkhand': [23.6102, 85.2799],
    'Karnataka': [15.3173, 75.7139],
    'Kerala': [10.8505, 76.2711],
    'Ladakh': [34.1526, 77.5771],
    'Lakshadweep': [10.5667, 72.6417],
    'Madhya Pradesh': [22.9734, 78.6569],
    'Maharashtra': [19.7515, 75.7139],
    'Manipur': [24.6637, 93.9063],
    'Meghalaya': [25.4670, 91.3662],
    'Mizoram': [23.1645, 92.9376],
    'Nagaland': [26.1584, 94.5624],
    'Odisha': [20.9517, 85.0985],
    'Puducherry': [11.9416, 79.8083],
    'Punjab': [31.1471, 75.3412],
    'Rajasthan': [27.0238, 74.2179],
    'Sikkim': [27.5330, 88.5122],
    'Tamil Nadu': [11.1271, 78.6569],
    'Telangana': [18.1124, 79.0193],
    'Tripura': [23.9408, 91.9882],
    'Uttar Pradesh': [26.8467, 80.9462],
    'Uttarakhand': [30.0668, 79.0193],
    'West Bengal': [22.9868, 87.8550]
  };

  useEffect(() => {
    api.getFilterOptions().then(setFilterOptions).catch(console.error);
  }, []);

  // Adjust center when state filter changes
  useEffect(() => {
    if (stateFilter && STATE_COORDINATES[stateFilter]) {
      setMapCenter(STATE_COORDINATES[stateFilter]);
      setMapZoom(7);
    } else if (!stateFilter) {
      setMapCenter([20.5937, 78.9629]);
      setMapZoom(5);
    }
  }, [stateFilter]);

  // Custom Marker Icons for Leaflet
  const createCustomIcon = (riskLevel: string, isSelected: boolean) => {
    let color = '#10B981';
    let pulseClass = '';

    if (riskLevel === 'CRITICAL') {
      color = '#EF4444';
      pulseClass = 'animate-ping';
    } else if (riskLevel === 'HIGH') {
      color = '#F97316';
    } else if (riskLevel === 'MEDIUM') {
      color = '#F59E0B';
    }

    const html = `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        ${
          riskLevel === 'CRITICAL'
            ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${color}; opacity: 0.5;" class="${pulseClass}"></div>`
            : ''
        }
        <div style="
          width: ${isSelected ? '22px' : '16px'};
          height: ${isSelected ? '22px' : '16px'};
          background-color: ${color};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          z-index: 10;
          transition: all 0.2s;
        "></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-gis-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  // Build duplicate coordinate pairs for dashed line rendering
  const duplicateLines: { id: number; positions: [number, number][]; label: string; score: number }[] = [];
  if (showDuplicateLinks) {
    const markerMap = new Map(markers.map(m => [m.project_id, m]));
    duplicates.forEach(d => {
      const a = markerMap.get(d.project_a_id);
      const b = markerMap.get(d.project_b_id);
      if (a && b) {
        duplicateLines.push({
          id: d.id,
          positions: [
            [a.latitude, a.longitude],
            [b.latitude, b.longitude],
          ],
          label: `${d.duplicate_score}/100 Match (${d.distance_km.toFixed(2)} km)`,
          score: d.duplicate_score,
        });
      }
    });
  }

  // Dynamically compute high-risk spatial hotspots from active markers
  const hotspots = React.useMemo(() => {
    const highRiskMarkers = markers.filter(m => m.risk_level === 'HIGH' || m.risk_level === 'CRITICAL');
    const districtGroups: Record<string, { lats: number[]; lons: number[]; count: number; state: string; expenditure: number }> = {};

    highRiskMarkers.forEach(m => {
      const key = `${m.district}, ${m.state}`;
      if (!districtGroups[key]) {
        districtGroups[key] = { lats: [], lons: [], count: 0, state: m.state, expenditure: 0 };
      }
      districtGroups[key].lats.push(m.latitude);
      districtGroups[key].lons.push(m.longitude);
      districtGroups[key].count += 1;
      districtGroups[key].expenditure += m.expenditure;
    });

    const list = Object.entries(districtGroups)
      .filter(([_, data]) => data.count >= 2)
      .map(([districtName, data]) => {
        const avgLat = data.lats.reduce((a, b) => a + b, 0) / data.lats.length;
        const avgLon = data.lons.reduce((a, b) => a + b, 0) / data.lons.length;
        return {
          center: [avgLat, avgLon] as [number, number],
          radius: Math.min(25000, Math.max(12000, data.count * 1500)),
          label: `${districtName} Vigilance Hotspot (${data.count} Flagged Projects, ₹${data.expenditure.toFixed(1)}L)`,
          count: data.count,
          expenditure: data.expenditure
        };
      });

    return list.slice(0, 20);
  }, [markers]);

  return (
    <div className="relative h-[calc(100vh-140px)] flex flex-col space-y-4 pb-4">
      {/* Top Map Filter Controls Overlay */}
      <div className="bg-white/95 border border-slate-200 rounded-2xl p-4 shadow-sm backdrop-blur-md z-20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Geospatial Intelligence Map</h2>
            <p className="text-[11px] text-slate-500">
              Visualizing {markers.length} project markers, hotspot clusters & duplicate candidate vectors
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* State Filter */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            <option value="">All States ({filterOptions?.states?.length || Object.keys(STATE_COORDINATES).length})</option>
            {(filterOptions?.states || Object.keys(STATE_COORDINATES)).map((st: string) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            <option value="">All Risk Ratings</option>
            <option value="CRITICAL">Critical Risk Only</option>
            <option value="HIGH">High Risk Only</option>
            <option value="MEDIUM">Medium Risk Only</option>
            <option value="LOW">Low Risk Only</option>
          </select>

          {/* Toggle Layers */}
          <button
            onClick={() => setShowDuplicateLinks(!showDuplicateLinks)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition ${
              showDuplicateLinks
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate Vectors</span>
          </button>

          <button
            onClick={() => setShowHotspots(!showHotspots)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition ${
              showHotspots
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hotspots</span>
          </button>

          <button
            onClick={fetchMapData}
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg border border-slate-200 transition shadow-2xs"
            title="Refresh GIS View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Container Area */}
      <div className="relative flex-1 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* Light Clean Standard Basemap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Hotspot Circles */}
          {showHotspots &&
            hotspots.map((h, i) => (
              <Circle
                key={i}
                center={h.center}
                radius={h.radius}
                pathOptions={{
                  color: '#EF4444',
                  fillColor: '#EF4444',
                  fillOpacity: 0.12,
                  weight: 2,
                  dashArray: '4, 8',
                }}
              >
                <Popup>
                  <div className="p-2 space-y-1.5 text-xs">
                    <div className="flex items-center space-x-1.5 text-red-600 font-bold">
                      <ShieldAlert className="w-4 h-4" />
                      <span>{h.label}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Dense high-risk cluster identified. {h.count} projects flagged with severe milestone delays or cost overruns.
                    </p>
                    <div className="text-[11px] font-mono text-amber-700 font-semibold">
                      Total Capital at Risk: ₹{h.expenditure.toFixed(1)} Lakhs
                    </div>
                  </div>
                </Popup>
              </Circle>
            ))}

          {/* Duplicate Vector Lines */}
          {showDuplicateLinks &&
            duplicateLines.map((line) => (
              <Polyline
                key={line.id}
                positions={line.positions}
                pathOptions={{
                  color: '#9333EA',
                  weight: 3,
                  dashArray: '6, 6',
                  opacity: 0.85,
                }}
              />
            ))}

          {/* Project Pin Markers */}
          {markers.map((m) => {
            const isSelected = selectedMarker?.project_id === m.project_id;
            return (
              <Marker
                key={m.project_id}
                position={[m.latitude, m.longitude]}
                icon={createCustomIcon(m.risk_level, isSelected)}
                eventHandlers={{
                  click: () => {
                    setSelectedMarker(m);
                  },
                }}
              >
                <Popup>
                  <div className="p-1 space-y-2 max-w-xs text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-blue-700">{m.project_id}</span>
                      <RiskBadge level={m.risk_level} score={m.overall_score} size="sm" />
                    </div>
                    <p className="font-semibold text-slate-900 text-xs line-clamp-2">{m.description}</p>
                    <div className="text-[11px] text-slate-500">
                      {m.district}, {m.state} &bull; {m.project_type}
                    </div>
                    <div className="pt-1 border-t border-slate-100 flex justify-between font-mono text-[11px]">
                      <span className="text-slate-700 font-semibold">Spent: ₹{m.expenditure.toFixed(1)}L</span>
                      <span className="text-slate-700 font-semibold">Phys: {m.physical_progress.toFixed(0)}%</span>
                    </div>
                    <button
                      onClick={() => onSelectProject(m.project_id)}
                      className="w-full mt-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-center transition shadow-xs"
                    >
                      Open Full Project File &rarr;
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Live Map Legend & Tally Bar */}
        <div className="absolute left-4 bottom-6 bg-white/95 border border-slate-200 rounded-2xl shadow-lg p-3 z-20 backdrop-blur-md hidden sm:flex items-center space-x-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Map Legend:</span>

          <button
            onClick={() => setRiskFilter(riskFilter === 'CRITICAL' ? '' : 'CRITICAL')}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg border transition cursor-pointer ${
              riskFilter === 'CRITICAL' ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold' : 'border-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
            <span>Critical ({markers.filter(m => m.risk_level === 'CRITICAL').length})</span>
          </button>

          <button
            onClick={() => setRiskFilter(riskFilter === 'HIGH' ? '' : 'HIGH')}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg border transition cursor-pointer ${
              riskFilter === 'HIGH' ? 'bg-orange-50 border-orange-300 text-orange-700 font-bold' : 'border-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
            <span>High ({markers.filter(m => m.risk_level === 'HIGH').length})</span>
          </button>

          <button
            onClick={() => setRiskFilter(riskFilter === 'MEDIUM' ? '' : 'MEDIUM')}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg border transition cursor-pointer ${
              riskFilter === 'MEDIUM' ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold' : 'border-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>Medium ({markers.filter(m => m.risk_level === 'MEDIUM').length})</span>
          </button>

          <button
            onClick={() => setRiskFilter(riskFilter === 'LOW' ? '' : 'LOW')}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg border transition cursor-pointer ${
              riskFilter === 'LOW' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'border-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Low ({markers.filter(m => m.risk_level === 'LOW').length})</span>
          </button>
        </div>

        {/* Selected Project Side Drawer Overlay */}
        {selectedMarker && (
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-white/95 border border-slate-200 rounded-2xl shadow-xl p-5 z-30 backdrop-blur-md flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-blue-700">{selectedMarker.project_id}</span>
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <RiskBadge level={selectedMarker.risk_level} score={selectedMarker.overall_score} size="md" />
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  {selectedMarker.district}, {selectedMarker.state} ({selectedMarker.constituency})
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">
                  Work Description
                </span>
                <p className="text-xs font-medium text-slate-900 leading-relaxed">
                  {selectedMarker.description}
                </p>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">Expenditure</span>
                  <span className="font-bold font-mono text-slate-900">₹{selectedMarker.expenditure.toFixed(1)}L</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">Physical</span>
                  <span className="font-bold font-mono text-emerald-700">{selectedMarker.physical_progress.toFixed(0)}%</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">Financial</span>
                  <span className="font-bold font-mono text-slate-900">{selectedMarker.financial_progress.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button
                onClick={() => setTxModalProjectId(selectedMarker.project_id)}
                className="w-full py-2 bg-white hover:bg-slate-50 text-emerald-700 rounded-xl font-semibold text-xs border border-emerald-200 flex items-center justify-center space-x-1.5 transition shadow-2xs"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>View Transactions & Payee Trail</span>
              </button>
              <button
                onClick={() => onSelectProject(selectedMarker.project_id)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition"
              >
                <span>Investigate Full File</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions & Payee Modal */}
      {txModalProjectId && (
        <TransactionLedgerModal
          projectId={txModalProjectId}
          onClose={() => setTxModalProjectId(null)}
          onSelectProject={onSelectProject}
        />
      )}
    </div>
  );
};
