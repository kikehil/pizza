'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, DollarSign, Bike, Calendar, User, ChevronRight, CheckSquare, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/socket';

interface Order {
    id: number;
    order_id: string;
    cliente_nombre: string;
    total: number;
    delivered_at: string;
}

interface DriverSettlement {
    repartidor: string;
    total_pedidos: string;
    total_efectivo: string;
    pedidos: Order[];
}

const SettlementManager = () => {
    const [settlements, setSettlements] = useState<DriverSettlement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchSettlements = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('capriccio_token_admin');
            const res = await fetch(`${API_URL}/api/admin/corte-caja`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            setSettlements(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching settlements:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettlements();
    }, []);

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrders(prev => 
            prev.includes(orderId) 
                ? prev.filter(id => id !== orderId) 
                : [...prev, orderId]
        );
    };

    const selectAllFromDriver = (driver: DriverSettlement) => {
        const driverOrderIds = driver.pedidos.map(p => p.order_id);
        const allSelected = driverOrderIds.every(id => selectedOrders.includes(id));
        
        if (allSelected) {
            setSelectedOrders(prev => prev.filter(id => !driverOrderIds.includes(id)));
        } else {
            setSelectedOrders(prev => [...new Set([...prev, ...driverOrderIds])]);
        }
    };

    const handleLiquidation = async () => {
        if (selectedOrders.length === 0) return;
        
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('capriccio_token_admin');
            const res = await fetch(`${API_URL}/api/admin/liquidar-pedidos`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    order_ids: selectedOrders,
                    liquidado_por: 'Admin Host' // Could be dynamic
                })
            });

            if (res.ok) {
                setSuccessMessage(`✅ Se han liquidado ${selectedOrders.length} pedidos correctamente.`);
                setSelectedOrders([]);
                await fetchSettlements();
                setTimeout(() => setSuccessMessage(''), 5000);
            }
        } catch (error) {
            console.error('Error in liquidation:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateSelectedTotal = () => {
        let total = 0;
        settlements.forEach(s => {
            s.pedidos.forEach(p => {
                if (selectedOrders.includes(p.order_id)) {
                    total += Number(p.total);
                }
            });
        });
        return total;
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-2">
                        Corte de <span className="text-capriccio-gold text-stroke-slate">Caja</span>
                    </h2>
                    <p className="text-slate-500 font-bold italic text-sm">Validación de efectivo por repartidor</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 px-8">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Seleccionado</p>
                            <p className="text-2xl font-black italic text-slate-900">${calculateSelectedTotal().toFixed(2)}</p>
                        </div>
                        <DollarSign className="text-capriccio-gold" size={32} />
                    </div>
                    
                    <button
                        onClick={handleLiquidation}
                        disabled={selectedOrders.length === 0 || isSubmitting}
                        className={cn(
                            "py-4 px-8 rounded-3xl font-black uppercase tracking-widest text-sm transition-all flex items-center gap-3",
                            selectedOrders.length > 0 
                                ? "bg-capriccio-gold text-capriccio-dark shadow-xl shadow-capriccio-gold/20 hover:scale-105 active:scale-95" 
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                        Liquidar {selectedOrders.length} Pedidos
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl flex items-center gap-3 font-bold text-sm"
                    >
                        <CheckCircle2 size={20} />
                        {successMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-capriccio-gold" size={48} />
                    <p className="text-slate-400 font-bold italic animate-pulse tracking-widest uppercase text-xs">Cargando datos del corte...</p>
                </div>
            ) : settlements.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-16 text-center border-4 border-dashed border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-green-300" />
                    </div>
                    <h3 className="text-2xl font-black italic text-slate-400 uppercase tracking-tighter mb-2">Caja Cuadrada</h3>
                    <p className="text-slate-400 font-bold italic">No hay pedidos pendientes de liquidar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {settlements.map((driver) => (
                        <div key={driver.repartidor} className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-50">
                            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-capriccio-gold rounded-2xl flex items-center justify-center text-capriccio-dark font-black text-xl italic">
                                        {driver.repartidor.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-capriccio-gold tracking-[0.2em] mb-1">Repartidor</p>
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none">{driver.repartidor}</h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Por Liquidar</p>
                                    <p className="text-2xl font-black italic text-capriccio-gold">${Number(driver.total_efectivo).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest">{driver.pedidos.length} Pedidos entregados</p>
                                    <button 
                                        onClick={() => selectAllFromDriver(driver)}
                                        className="text-[10px] font-black uppercase text-capriccio-gold hover:text-capriccio-dark transition-colors tracking-widest flex items-center gap-2"
                                    >
                                        {driver.pedidos.every(p => selectedOrders.includes(p.order_id)) ? "Deseleccionar todos" : "Seleccionar todos"}
                                        <ChevronRight size={14} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {driver.pedidos.map((order) => (
                                        <div 
                                            key={order.order_id}
                                            onClick={() => toggleOrderSelection(order.order_id)}
                                            className={cn(
                                                "p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                                                selectedOrders.includes(order.order_id)
                                                    ? "bg-capriccio-gold/5 border-capriccio-gold"
                                                    : "bg-slate-50 border-transparent hover:border-slate-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                                    selectedOrders.includes(order.order_id)
                                                        ? "bg-capriccio-gold text-capriccio-dark"
                                                        : "bg-white border-2 border-slate-200 text-transparent"
                                                )}>
                                                    <CheckSquare size={14} strokeWidth={3} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase">#{order.order_id.split('-').pop()}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                                                            {new Date(order.delivered_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="font-bold text-slate-800 uppercase italic">{order.cliente_nombre}</p>
                                                </div>
                                            </div>
                                            <p className="text-lg font-black italic text-slate-900">${Number(order.total).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SettlementManager;
