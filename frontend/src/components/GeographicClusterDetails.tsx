import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin, ShieldAlert, Building, IndianRupee, Layers,
  ArrowUpRight, AlertTriangle, ExternalLink, Info, CheckCircle2, ChevronRight
} from 'lucide-react';
import { NearbyProject, ProjectDetail } from '../types';
import { api } from '../services/api';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';

interface GeographicClusterDetailsProps {
  project: ProjectDetail;
  onSelectProject: (projectId: string) => void;
  onOpenGis: (projectId: string) => void;
}

export const GeographicClusterDetails: React.FC<GeographicClusterDetailsProps> = ({
  project,
  onSelectProject,
  onOpenGis,
}) => {
  const [nearbyProjects, setNearbyProjects] = useState<NearbyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(500);

  useEffect(() => {
    let isMounted = true;
    const fetchNearby = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getNearbyProjects(project.project_id, 1.5);
        if (isMounted) {
          setNearbyProjects(data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(err);
          setError(err.message || 'Failed to load spatial cluster projects');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNearby();
    return () => {
      isMounted = false;
    };
  }, [project.project_id]);

  // Filter projects strictly within chosen radius (default 500m)
  const clusteredProjects = nearbyProjects.filter(p => p.distance_meters <= radiusMeters);
  const widerProjects = nearbyProjects.filter(p => p.distance_meters > radiusMeters && p.distance_meters <= 1500);

  // Cluster aggregate statistics
  const totalClusterCount = clusteredProjects.length + 1; // including current project
  const totalClusterSanctioned = clusteredProjects.reduce((acc, p) => acc + p.sanctioned_amount, project.sanctioned_amount);
  const totalClusterExpended = clusteredProjects.reduce((acc, p) => acc + p.expenditure, project.expenditure);

  // Agency overlap analysis
  const agencyCounts: Record<string, number> = { [project.implementing_agency]: 1 };
  clusteredProjects.forEach(p => {
    agencyCounts[p.implementing_agency] = (agencyCounts[p.implementing_agency] || 0) + 1;
  });
  const dominantAgency = Object.entries(agencyCounts).sort((a, b) => b[1] - a[1])[0];
  const sameAgencyCount = dominantAgency ? dominantAgency[1] : 1;
  const isHighAgencyConcentration = totalClusterCount > 2 && (sameAgencyCount / totalClusterCount) >= 0.7;

  // Custom marker generator
  const createMarkerIcon = (isFocal: boolean, riskLevel: string) => {
    let color = '#3b82f6';
    if (!isFocal) {
      if (riskLevel === 'CRITICAL') color = '#ef4444';
      else if (riskLevel === 'HIGH') color = '#f97316';
      else if (riskLevel === 'MEDIUM') color = '#f59e0b';
      else color = '#10b981';
    }

    const html = `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        ${
          isFocal
            ? '<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #3b82f6; opacity: 0.4;" class="animate-ping"></div>'
            : ''
        }
        <div style="
          width: ${isFocal ? '22px' : '16px'};
          height: ${isFocal ? '22px' : '16px'};
          background-color: ${color};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
        ">
          ${isFocal ? '★' : ''}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'cluster-marker-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  return (
    <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 shrink-0 mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Geographic Cluster Anomaly & Spatial Density Audit
              </h3>
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                {totalClusterCount} Clustered Projects
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Focal Site Coordinates: <span className="font-mono font-semibold text-slate-700">{project.latitude.toFixed(4)}° N, {project.longitude.toFixed(4)}° E</span> ({project.district}, {project.state})
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenGis(project.project_id)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Open in GIS Map &rarr;</span>
        </button>
      </div>

      {/* MoSPI Vigilance Governance Rationale */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-amber-900 font-bold">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>How & Why This Project is Flagged as a Geographic Cluster Anomaly</span>
        </div>
        <p className="text-slate-700 leading-relaxed">
          Under <strong>MoSPI MPLADS Vigilance Guidelines</strong>, an unusually high density of works (<strong>≥3 projects within 500 meters</strong>) is audited to detect:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          <div className="bg-white p-3 rounded-lg border border-amber-200 text-[11px] space-y-1">
            <span className="font-bold text-slate-900 block">1. Work Splitting Risk</span>
            <p className="text-slate-600">
              Subdividing a large scheme into multiple mini-sanctions to bypass higher-level administrative approval thresholds.
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-amber-200 text-[11px] space-y-1">
            <span className="font-bold text-slate-900 block">2. Duplicate / Ghost Asset Risk</span>
            <p className="text-slate-600">
              Sanctioning multiple separate funds for overlapping or identical physical structures on the same ground site.
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-amber-200 text-[11px] space-y-1">
            <span className="font-bold text-slate-900 block">3. Agency Concentration</span>
            <p className="text-slate-600">
              Disproportionate concentration of public funds awarded to a single contractor or executing agency in one localized area.
            </p>
          </div>
        </div>
      </div>

      {/* Cluster Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 block font-medium">Within 500m Radius</span>
          <span className="text-lg font-bold font-mono text-slate-900">{totalClusterCount} Projects</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 block font-medium">Total Sanctioned Capital</span>
          <span className="text-lg font-bold font-mono text-blue-700">₹{totalClusterSanctioned.toFixed(2)}L</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 block font-medium">Total Funds Expended</span>
          <span className="text-lg font-bold font-mono text-emerald-700">₹{totalClusterExpended.toFixed(2)}L</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 block font-medium">Agency Overlap</span>
          <span className={`text-xs font-bold font-mono block mt-1 truncate ${isHighAgencyConcentration ? 'text-rose-700' : 'text-slate-700'}`} title={dominantAgency ? dominantAgency[0] : ''}>
            {sameAgencyCount}/{totalClusterCount} ({dominantAgency ? dominantAgency[0].substring(0, 16) : ''}...)
          </span>
        </div>
      </div>

      {/* Interactive Spatial Cluster Mini-Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Spatial Cluster Map (500m & 1km Radius)</span>
          </span>
          <span className="text-[11px] text-slate-500">
            ★ Blue = Current Project &bull; Red/Orange/Green = Neighboring Clustered Works
          </span>
        </div>

        <div className="h-72 rounded-xl overflow-hidden border border-slate-200 shadow-2xs relative">
          <MapContainer
            center={[project.latitude, project.longitude]}
            zoom={15}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* 500m Radius Critical Cluster Ring */}
            <Circle
              center={[project.latitude, project.longitude]}
              radius={500}
              pathOptions={{
                color: '#EF4444',
                fillColor: '#EF4444',
                fillOpacity: 0.12,
                weight: 2,
                dashArray: '5, 5',
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <strong className="text-rose-700">500-Meter High-Density Cluster Radius</strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {clusteredProjects.length} other MPLADS works sanctioned inside this zone.
                  </p>
                </div>
              </Popup>
            </Circle>

            {/* 1km Secondary Ring */}
            <Circle
              center={[project.latitude, project.longitude]}
              radius={1000}
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.04,
                weight: 1,
                dashArray: '3, 6',
              }}
            />

            {/* Current Focal Project Marker */}
            <Marker
              position={[project.latitude, project.longitude]}
              icon={createMarkerIcon(true, project.risk_score?.risk_level || 'LOW')}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs max-w-xs">
                  <div className="flex items-center space-x-1.5 text-blue-700 font-bold">
                    <span>★ Current Project: {project.project_id}</span>
                  </div>
                  <p className="text-slate-800 font-medium text-[11px] line-clamp-2">{project.description}</p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Sanctioned: ₹{project.sanctioned_amount.toFixed(2)}L &bull; Spent: ₹{project.expenditure.toFixed(2)}L
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Neighboring Projects Markers */}
            {nearbyProjects.map(p => (
              <Marker
                key={p.project_id}
                position={[p.latitude, p.longitude]}
                icon={createMarkerIcon(false, p.risk_level)}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs max-w-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-700">{p.project_id}</span>
                      <RiskBadge level={p.risk_level} score={p.overall_score} size="sm" />
                    </div>
                    <p className="text-slate-800 font-medium text-[11px] line-clamp-2">{p.description}</p>
                    <div className="text-[10px] text-amber-700 font-semibold font-mono">
                      Distance: {p.distance_meters === 0 ? 'Same GPS Site (0m)' : `${p.distance_meters} meters away`}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Sanctioned: ₹{p.sanctioned_amount.toFixed(2)}L &bull; Phys: {p.physical_progress}%
                    </div>
                    <button
                      onClick={() => onSelectProject(p.project_id)}
                      className="w-full mt-1.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-[11px] text-center"
                    >
                      Open Project File &rarr;
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Itemized Clustered Projects Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider">
            Itemized Projects Inside This Geographic Cluster ({clusteredProjects.length})
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Sorted by proximity (meters)
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 space-x-2 text-xs text-slate-500">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Scanning geospatial coordinates across 43,506 projects...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        ) : clusteredProjects.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
            No other projects found within 500m of this location.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Project ID & Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Proximity</th>
                  <th className="py-2.5 px-3">Agency & MP</th>
                  <th className="py-2.5 px-3 text-right">Sanctioned / Spent</th>
                  <th className="py-2.5 px-3 text-center">Risk Rating</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clusteredProjects.map((p) => {
                  const isSameLocation = p.distance_meters === 0;
                  return (
                    <tr key={p.project_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onSelectProject(p.project_id)}
                          className="font-mono font-bold text-blue-700 hover:underline block text-left"
                        >
                          {p.project_id}
                        </button>
                        <span className="text-[10px] text-slate-500 block">{p.project_type}</span>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <p className="text-slate-800 font-medium line-clamp-2 leading-snug" title={p.description}>
                          {p.description}
                        </p>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          isSameLocation
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {isSameLocation ? '0m (Identical GPS)' : `${p.distance_meters}m away`}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-[11px] max-w-xs">
                        <div className="font-semibold text-slate-900 truncate" title={p.implementing_agency}>
                          {p.implementing_agency}
                        </div>
                        <div className="text-slate-500 truncate text-[10px]" title={p.mp_id}>
                          {p.mp_id}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-bold text-slate-900">₹{p.sanctioned_amount.toFixed(2)}L</div>
                        <div className="text-[10px] text-slate-500">Exp: ₹{p.expenditure.toFixed(2)}L</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <RiskBadge level={p.risk_level} score={p.overall_score} size="sm" />
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onSelectProject(p.project_id)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-blue-700 border border-slate-200 rounded-lg font-semibold text-[11px] transition shadow-2xs inline-flex items-center space-x-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional Outer Cluster Notice (500m to 1.5km) */}
      {widerProjects.length > 0 && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Found <strong>{widerProjects.length} additional works</strong> in the surrounding 500m–1.5km perimeter zone.
            </span>
          </div>
          <button
            onClick={() => onOpenGis(project.project_id)}
            className="text-blue-700 font-semibold hover:underline flex items-center space-x-1"
          >
            <span>View Full Area in GIS Explorer</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
