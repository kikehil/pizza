'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, CheckCircle2, Package, Clock, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RepartidorMap } from './MapIndex';

import { getSocket, API_URL } from '@/lib/socket';


interface DeliveryOrder {
    id: string;
    cliente_nombre: string;
    direccion: string;
    telefono: string;
    items: any[];
    total: number;
    timestamp: string;
    lat?: number;
    lng?: number;
    order_id: string;
}

const DeliveryDashboard = () => {
    const [pedidosListos, setPedidosListos] = useState<DeliveryOrder[]>([]);
    const [socketConnected, setSocketConnected] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [currentPos, setCurrentPos] = useState<{ lat: number, lng: number } | undefined>(undefined);

    useEffect(() => {
        // 1. Cargar pedidos que ya están listos
        const fetchInitialOrders = async () => {
            try {
                const res = await fetch(`${API_URL}/api/pedidos/status/listo`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setPedidosListos(data.map(p => ({
                        ...p,
                        order_id: p.order_id || p.id,
                        // El backend devuelve los campos de DB, mapeamos si es necesario
                        id: p.order_id || p.id.toString(),
                        timestamp: p.timestamp || new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    })));
                }
            } catch (e) {
                console.error("Error cargando pedidos iniciales:", e);
            }
        };

        fetchInitialOrders();

        // 2. Track driver's position
        if ("geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn(err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        setSocketConnected(socket.connected);

        socket.on('connect', () => {
            console.log("✅ Socket REP conectado");
            setSocketConnected(true);
        });

        socket.on('disconnect', () => {
            console.log("❌ Socket REP desconectado");
            setSocketConnected(false);
        });

        // Escuchar cuando cocina marca un pedido como "Listo"
        socket.on('pedido_listo_reparto', (pedido: DeliveryOrder) => {
            console.log("🚛 REPARTIDOR: Recibido pedido listo", pedido);
            setPedidosListos(prev => {
                // Evitar duplicados si ya lo cargamos vía fetch
                const exists = prev.find(p => p.order_id === (pedido.order_id || pedido.id));
                if (exists) return prev;

                return [
                    {
                        ...pedido,
                        order_id: pedido.order_id || pedido.id,
                        id: pedido.order_id || pedido.id.toString(),
                        timestamp: pedido.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    },
                    ...prev
                ];
            });

            // Vibración si está en móvil
            if ("vibrate" in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
        });

        // Escuchar eliminaciones remotas (si otro repartidor lo toma)
        socket.on('pedido_entregado_remoto', (id: string) => {
            setPedidosListos(prev => prev.filter(p => p.id !== id));
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('pedido_listo_reparto');
            socket.off('pedido_entregado_remoto');
        };
    }, []);

    const marcarEntregado = async (id: string) => {
        const order = pedidosListos.find(p => p.id === id);
        if (!order) return;

        try {
            await fetch(`${API_URL}/api/pedidos/${order.order_id || id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'entregado' })
            });
            setPedidosListos(prev => prev.filter(p => p.id !== id));
            if (selectedOrder?.id === id) setIsMapOpen(false);
        } catch (error) {
            console.error("Error al entregar pedido:", error);
            alert("Error al conectar con el servidor.");
        }
    };

    const handleOpenMap = async (pedido: DeliveryOrder) => {
        if (!pedido.lat || !pedido.lng) {
            // Fallback: Geocode address if missing coords
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pedido.direccion)}`);
                const data = await res.json();
                if (data[0]) {
                    pedido.lat = parseFloat(data[0].lat);
                    pedido.lng = parseFloat(data[0].lon);
                } else {
                    alert("No se pudo encontrar la ubicación exacta. Abriendo en Google Maps.");
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.direccion)}`, '_blank');
                    return;
                }
            } catch (e) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.direccion)}`, '_blank');
                return;
            }
        }
        setSelectedOrder(pedido);
        setIsMapOpen(true);
    };

    return (
        <div className="bg-[#f0f2f5] min-h-screen pb-20">
            {/* Header Mobile-First */}
            <header className="bg-slate-950 text-white p-6 pt-12 rounded-b-[2.5rem] shadow-2xl sticky top-0 z-50">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic">Reparto <span className="text-red-600">Flash</span></h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Módulo de Repartidor</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={cn("w-2 h-2 rounded-full", socketConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500 animate-pulse")} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{socketConnected ? 'Conectado' : 'Sin Conexión'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-black animate-pulse uppercase">
                            {pedidosListos.length} Pendientes
                        </span>
                    </div>
                </div>
            </header>

            <main className="p-4 space-y-6 mt-4">
                <AnimatePresence mode="popLayout">
                    {pedidosListos.map((pedido) => (
                        <motion.div
                            key={pedido.id}
                            layout
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white rounded-[2rem] shadow-lg border border-slate-200 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-yellow-400">
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Cliente</span>
                                            <p className="text-xl font-black italic text-slate-900 uppercase leading-tight">
                                                {pedido.cliente_nombre || "Cliente Sin Nombre"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-green-200">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        LISTO
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="bg-red-50 p-2.5 rounded-xl">
                                            <MapPin className="text-red-600" size={22} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Entregar en:</p>
                                            <p className="text-sm font-bold text-slate-800 leading-tight">
                                                {pedido.direccion}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleOpenMap(pedido)}
                                            className="flex items-center justify-center gap-3 bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
                                        >
                                            <Navigation size={20} strokeWidth={3} />
                                            NAVEGAR
                                        </button>
                                        <a
                                            href={`tel:${pedido.telefono}`}
                                            className="flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                        >
                                            <Phone size={20} strokeWidth={3} />
                                            LLAMAR
                                        </a>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-between items-center px-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Clock size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{pedido.timestamp}</span>
                                    </div>
                                    <p className="text-sm font-black text-slate-900 italic">${pedido.total}</p>
                                </div>

                                <button
                                    onClick={() => marcarEntregado(pedido.id)}
                                    className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white py-5 rounded-[1.5rem] font-black text-lg italic uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                >
                                    <CheckCircle2 size={24} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                                    CONFIRMAR ENTREGA
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {pedidosListos.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-20 flex flex-col items-center justify-center text-slate-300"
                    >
                        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-slate-200">
                            <Package size={48} strokeWidth={1} className="opacity-20" />
                        </div>
                        <p className="font-black italic uppercase tracking-widest text-sm opacity-50">Esperando pedidos...</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 opacity-30 text-center px-10">Mantén esta pantalla abierta para recibir alertas en tiempo real.</p>
                    </motion.div>
                )}
            </main>

            {selectedOrder && (
                <RepartidorMap
                    isOpen={isMapOpen}
                    onClose={() => setIsMapOpen(false)}
                    destination={{
                        lat: selectedOrder.lat!,
                        lng: selectedOrder.lng!,
                        address: selectedOrder.direccion
                    }}
                    currentPos={currentPos}
                />
            )}
        </div>
    );
};

export default DeliveryDashboard;
