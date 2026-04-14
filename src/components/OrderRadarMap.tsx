import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";

interface OrderRadarMapProps {
  orderId: number;
  runnerId?: number | null;
  riderId?: number | null;
  customerLat?: number;
  customerLng?: number;
}

const OrderRadarMap = ({ orderId, runnerId, riderId, customerLat, customerLng }: OrderRadarMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const channelRef = useRef<any>(null);

  const tableName = runnerId ? "runners" : riderId ? "riders" : null;
  const workerId = runnerId || riderId;

  useEffect(() => {
    if (!mapRef.current) return;

    const center: [number, number] = [customerLat || -15.4167, customerLng || 28.2833];
    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true,
    }).setView(center, 14);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    setTimeout(() => map.invalidateSize(), 200);

    // Customer marker
    if (customerLat && customerLng) {
      const custIcon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:50%;background:#1a1a2e;border:3px solid #FFF8EE;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><span style="font-size:12px;">📍</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([customerLat, customerLng], { icon: custIcon }).addTo(map).bindPopup("Your location");
    }

    const goldIcon = L.divIcon({
      className: "",
      html: `<div style="width:36px;height:36px;border-radius:50%;background:#B37C1C;border:3px solid #FFF8EE;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(179,124,28,0.45);"><span style="font-size:16px;">🚴</span></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (tableName && workerId) {
      (async () => {
        const { data } = await supabase
          .from(tableName as any)
          .select("latitude, longitude")
          .eq("id", workerId)
          .maybeSingle();
        if (data && (data as any).latitude && (data as any).longitude) {
          const pos: [number, number] = [(data as any).latitude, (data as any).longitude];
          riderMarkerRef.current = L.marker(pos, { icon: goldIcon }).addTo(map).bindPopup("Your rider is here");
          map.panTo(pos, { animate: true });
        }
      })();

      channelRef.current = supabase
        .channel(`rider-track-${orderId}`)
        .on(
          "postgres_changes" as any,
          { event: "UPDATE", schema: "public", table: tableName, filter: `id=eq.${workerId}` },
          (payload: any) => {
            const { latitude, longitude } = payload.new;
            if (latitude && longitude) {
              const pos: [number, number] = [latitude, longitude];
              if (riderMarkerRef.current) {
                riderMarkerRef.current.setLatLng(pos);
              } else {
                riderMarkerRef.current = L.marker(pos, { icon: goldIcon }).addTo(map).bindPopup("Your rider is here");
              }
              map.panTo(pos, { animate: true, duration: 1 });
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      map.remove();
      mapInstanceRef.current = null;
      riderMarkerRef.current = null;
    };
  }, [orderId, runnerId, riderId, customerLat, customerLng, tableName, workerId]);

  return (
    <div
      ref={mapRef}
      className="w-full h-64 md:h-80"
      style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "2px solid hsl(38,73%,40%,0.2)",
        position: "relative",
        zIndex: 1,
        touchAction: "none",
      }}
    />
  );
};

export default OrderRadarMap;
