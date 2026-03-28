import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building2, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default marker icon in Leaflet + React
const createCustomIcon = (color: string) => {
  const iconMarkup = renderToStaticMarkup(
    <div className="relative">
      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white shadow-lg border-2 border-white transform -translate-x-1/2 -translate-y-full`}>
        <MapPin size={18} />
      </div>
      <div className={`absolute bottom-0 left-0 w-1 h-1 ${color} rounded-full transform -translate-x-1/2 translate-y-[-2px]`} />
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-leaflet-icon',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const masjidIcon = createCustomIcon('bg-gov-blue');
const surauIcon = createCustomIcon('bg-islamic-green');

interface GisMapProps {
  locations: any[];
}

export default function GisMap({ locations }: GisMapProps) {
  // Center of Penang
  const center: [number, number] = [5.4141, 100.3288];

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
      <MapContainer 
        center={center} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => {
          if (!loc.latitude || !loc.longitude) return null;
          
          const isMasjid = loc.nama?.toLowerCase().includes('masjid');
          
          return (
            <Marker 
              key={loc.id} 
              position={[loc.latitude, loc.longitude]}
              icon={isMasjid ? masjidIcon : surauIcon}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${isMasjid ? 'bg-gov-blue/10 text-gov-blue' : 'bg-islamic-green/10 text-islamic-green'}`}>
                      <Building2 size={14} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{loc.nama}</h4>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-500">
                    <p><b>Kod:</b> {loc.kod}</p>
                    <p><b>Daerah:</b> {loc.daerah}</p>
                    <p><b>Parlimen/DUN:</b> {loc.parlimen} / {loc.dun}</p>
                    <p className="mt-2 pt-2 border-t border-slate-100 italic">{loc.alamat}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200 text-[10px] font-bold space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gov-blue" />
          <span className="text-slate-700 uppercase tracking-wider">Masjid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-islamic-green" />
          <span className="text-slate-700 uppercase tracking-wider">Surau</span>
        </div>
      </div>
    </div>
  );
}
