'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { CartItem } from '@/data/cart';
import { cn } from '@/lib/utils';

interface OrderCardProps {
    order: {
        id: string;
        items: CartItem[];
        createdAt: string;
        timestamp: string;
    };
    onComplete: (id: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onComplete }) => {
    const { minutes, seconds, totalSeconds } = useTimer(order.createdAt);

    // Dynamic styles based on time
    let statusColor = "bg-slate-900 border-slate-800";
    let timerColor = "text-yellow-400";
    let accentColor = "text-white";
    let isCritical = false;

    if (totalSeconds > 600 && totalSeconds <= 900) {
        // Warning: 10-15 mins
        statusColor = "bg-yellow-400 border-yellow-500";
        timerColor = "text-black";
        accentColor = "text-black";
    } else if (totalSeconds > 900) {
        // Critical: > 15 mins
        statusColor = "bg-red-600 border-red-700 animate-pulse";
        timerColor = "text-white";
        accentColor = "text-white";
        isCritical = true;
    }

    return (
        <motion.div
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-full border-2 border-slate-100"
        >
            {/* Dynamic Header */}
            <div className={cn("p-6 flex justify-between items-center transition-colors duration-500", statusColor)}>
                <div>
                    <span className={cn("text-[10px] uppercase font-black tracking-[0.2em] opacity-60", accentColor)}>Pedido</span>
                    <p className={cn("text-2xl font-black italic uppercase leading-none", accentColor)}>
                        #{order.id.split('-')[1] || order.id.slice(-4)}
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <div className={cn("flex items-center gap-2", timerColor)}>
                        <Clock className={cn("w-5 h-5", isCritical && "animate-spin-slow")} />
                        <span className="text-3xl font-black tabular-nums italic leading-none">
                            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                        </span>
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="p-8 flex-grow space-y-6">
                {order.items.map((item, idx) => (
                    <div key={idx} className="relative pl-6 border-l-4 border-slate-100">
                        <p className="text-2xl font-black italic text-slate-900 uppercase leading-none tracking-tighter mb-2">
                            {item.quantity}x {item.nombre}
                        </p>
                        {item.extras.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {item.extras.map((extra, eIdx) => (
                                    <span key={eIdx} className="text-[10px] font-black bg-red-50 text-red-600 px-2 py-1 rounded-lg uppercase italic flex items-center gap-1">
                                        <Check className="w-2 h-2 stroke-[4px]" />
                                        {extra.nombre}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Action Button */}
            <div className="p-6 pt-0">
                <button
                    onClick={() => onComplete(order.id)}
                    className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-black text-xl italic uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 overflow-hidden group relative"
                >
                    <div className="absolute inset-0 bg-green-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative z-10 flex items-center gap-3">
                        <Check className="w-7 h-7 stroke-[4px] group-hover:scale-110 transition-transform" />
                        LISTO
                    </span>
                </button>
            </div>
        </motion.div>
    );
};

export default OrderCard;
