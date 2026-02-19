'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { CartItem } from '@/data/cart';

interface KitchenOrder {
    id: string;
    items: CartItem[];
    createdAt: string;
    timestamp: string;
    status: 'pending' | 'preparing' | 'ready';
    total: number;
    order_id: string; // Add order_id for API calls
}

import { getSocket, API_URL } from '@/lib/socket';
import OrderCard from './OrderCard';

const KitchenDisplay = () => {
    const [orders, setOrders] = useState<KitchenOrder[]>([]);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        // Escuchar nuevos pedidos desde el Bridge Server
        socket.on('nuevo_pedido', (pedido: any) => {
            console.log("¡Nuevo pedido recibido!", pedido);

            // Notificación de audio
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play();
            } catch (e) {
                console.warn("No se pudo reproducir el audio de alerta");
            }

            // Añadir a la lista (más reciente primero)
            setOrders(prev => [
                {
                    ...pedido,
                    order_id: pedido.order_id || pedido.id, // Ensure we have the string ID
                    createdAt: pedido.createdAt || new Date().toISOString(),
                    status: 'pending'
                },
                ...prev
            ]);

            // Notificación del sistema
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("🍕 ¡NUEVO PEDIDO!", {
                    body: `Pedido #${pedido.id?.split('-')[1] || 'Nuevo'} listo para cocinar.`
                });
            }
        });

        // Solicitar permiso para notificaciones
        if ("Notification" in window && Notification.permission !== "denied") {
            Notification.requestPermission();
        }

        return () => {
            socket.off('nuevo_pedido');
        };
    }, []);

    const completeOrder = async (id: string) => {
        const order = orders.find(o => o.id === id);
        if (!order) return;

        try {
            await fetch(`${API_URL}/api/pedidos/${order.order_id || id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'listo' })
            });
            setOrders(prev => prev.filter(o => o.id !== id));
        } catch (error) {
            console.error("Error al completar pedido:", error);
            alert("Error al conectar con el servidor.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-slate-800 pb-8">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none flex items-center gap-4">
                        <span className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                        Cocina en Tiempo Real
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-2">Mesa de Control - Gestión de Urgencia</p>
                </div>
                <div className="text-left md:text-right">
                    <p className="text-4xl font-black text-slate-100 tabular-nums italic">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Estado: Operativo</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AnimatePresence mode="popLayout">
                    {orders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onComplete={completeOrder}
                        />
                    ))}
                </AnimatePresence>

                {orders.length === 0 && (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-700 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[3rem]">
                        <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-2xl font-black italic uppercase tracking-tighter opacity-30">No hay pedidos pendientes</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KitchenDisplay;
