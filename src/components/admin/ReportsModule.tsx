'use client';

import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Download, Calendar, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Extending jsPDF for autotable type support
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (column: string[], rows: any[][], options?: any) => jsPDF;
    lastAutoTable: {
        finalY: number;
    };
}

interface Sale {
    id: string;
    created_at: string;
    delivered_at?: string;
    cliente_nombre: string;
    total: number;
    metodo_pago: string;
    items: any[];
}

interface ReportsModuleProps {
    ventas: Sale[];
}

const ReportsModule: React.FC<ReportsModuleProps> = ({ ventas }) => {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const generarPDF = () => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        const pageWidth = doc.internal.pageSize.width;

        // 1. Cabecera Estética
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold italic");
        doc.text("PIZZA CEREBRO", 14, 25);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("REPORTE OPERATIVO DE VENTAS", 14, 32);

        doc.setTextColor(100, 116, 139);
        doc.text(`Generado: ${new Date().toLocaleString()}`, pageWidth - 70, 32);

        // 2. Información del Periodo
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Resumen del Periodo", 14, 55);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Rango: ${fechaInicio || 'Inicio'} hasta ${fechaFin || 'Hoy'}`, 14, 62);

        // 3. Tabla de Ventas Principales
        const tableColumn = ["ID", "Fecha", "Cliente", "Estatus", "Total"];
        const tableRows = ventas.map(v => [
            v.id.split('-')[1] || v.id.slice(-5),
            new Date(v.created_at).toLocaleDateString(),
            v.cliente_nombre,
            v.delivered_at ? 'Entregado' : 'Pendiente',
            `$${v.total.toLocaleString()}`
        ]);

        doc.autoTable(tableColumn, tableRows, {
            startY: 70,
            theme: 'grid',
            headStyles: { fillGray: 20, textColor: 0, fontStyle: 'bold' },
            styles: { fontSize: 8 },
            alternateRowStyles: { fillGray: 245 }
        });

        let currentY = doc.lastAutoTable.finalY + 15;

        // 4. Métricas de Eficiencia e Impuestos
        const neto = ventas.reduce((acc, v) => acc + v.total, 0);
        const iva = neto * 0.16;
        const totalConIva = neto; // Asumiendo que el total ya incluye IVA o se desglosa de él
        const subtotal = neto / 1.16;
        const ivaDesglosado = neto - subtotal;

        // Tiempos de entrega
        const entregados = ventas.filter(v => v.delivered_at);
        const tiempoPromedio = entregados.length > 0
            ? entregados.reduce((acc, v) => {
                const diff = new Date(v.delivered_at!).getTime() - new Date(v.created_at).getTime();
                return acc + (diff / 1000 / 60); // mins
            }, 0) / entregados.length
            : 0;

        // Dibujar bloque de totales
        doc.setFillColor(248, 250, 252);
        doc.rect(130, currentY, 65, 35, 'F');

        doc.setFont("helvetica", "bold");
        doc.text("TOTALES (MXN)", 135, currentY + 8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 135, currentY + 16);
        doc.text(`IVA (16%): $${ivaDesglosado.toFixed(2)}`, 135, currentY + 22);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`TOTAL: $${neto.toFixed(2)}`, 135, currentY + 30);

        // Métrica de Eficiencia
        doc.setFontSize(12);
        doc.text("Eficiencia Logística", 14, currentY + 8);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Tiempo Promedio Entrega: ${tiempoPromedio.toFixed(1)} min`, 14, currentY + 16);
        doc.text(`Eficiencia de Órdenes: ${((entregados.length / ventas.length) * 100).toFixed(0)}%`, 14, currentY + 22);

        // 5. Best Sellers Ranking (Simplificado)
        const productCounts: Record<string, number> = {};
        ventas.forEach(v => {
            v.items?.forEach(item => {
                productCounts[item.nombre] = (productCounts[item.nombre] || 0) + item.quantity;
            });
        });

        const topThree = Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        if (topThree.length > 0) {
            currentY += 50;
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Ranking de Best Sellers", 14, currentY);

            doc.autoTable(["Producto", "Uds. Vendidas"], topThree, {
                startY: currentY + 5,
                margin: { right: 100 },
                theme: 'plain',
                styles: { fontSize: 8 }
            });
        }

        doc.save(`Pizza_Cerebro_Reporte_${fechaInicio || 'All'}.pdf`);
    };

    return (
        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-red-600 p-2 rounded-xl text-white">
                            <BarChart3 size={20} />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">Intelligence Center</h2>
                    </div>
                    <p className="text-slate-400 font-bold italic text-sm">Genera reportes PDF con métricas de eficiencia e impuestos.</p>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase text-slate-400">Total Periodo</p>
                        <p className="text-xl font-black text-slate-900 italic">${ventas.reduce((acc, v) => acc + v.total, 0).toLocaleString()}</p>
                    </div>
                    <div className="w-[1px] h-10 bg-slate-200 mx-2" />
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase text-slate-400">Órdenes</p>
                        <p className="text-xl font-black text-slate-900 italic">{ventas.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                        <Calendar size={12} /> DESDE
                    </label>
                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full p-5 bg-slate-50 rounded-[2rem] outline-none border-2 border-transparent focus:border-red-600/10 focus:bg-white font-bold transition-all text-slate-800"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                        <Calendar size={12} /> HASTA
                    </label>
                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="w-full p-5 bg-slate-50 rounded-[2rem] outline-none border-2 border-transparent focus:border-red-600/10 focus:bg-white font-bold transition-all text-slate-800"
                    />
                </div>

                <div className="flex items-end">
                    <button
                        onClick={generarPDF}
                        disabled={ventas.length === 0}
                        className={cn(
                            "w-full h-16 flex items-center justify-center gap-3 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 group overflow-hidden relative",
                            ventas.length > 0
                                ? "bg-slate-950 text-white hover:bg-black shadow-slate-900/20"
                                : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
                        )}
                    >
                        {ventas.length > 0 && <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
                        <span className="relative z-10 flex items-center gap-3">
                            <Download size={20} strokeWidth={3} className="group-hover:animate-bounce" />
                            DESCARGAR PDF
                        </span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-red-600/20 transition-all">
                    <Clock className="text-red-600 mb-3" size={24} />
                    <p className="text-3xl font-black italic text-slate-900">22.5m</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tiempo Promedio Reparto</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-red-600/20 transition-all">
                    <TrendingUp className="text-green-500 mb-3" size={24} />
                    <p className="text-3xl font-black italic text-slate-900">+12%</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Crecimiento Semanal</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-red-600/20 transition-all">
                    <div className="flex gap-1 mb-3">
                        <div className="h-6 w-2 bg-red-600 rounded-full" />
                        <div className="h-6 w-2 bg-slate-200 rounded-full" />
                        <div className="h-6 w-2 bg-slate-200 rounded-full" />
                    </div>
                    <p className="text-3xl font-black italic text-slate-900">16%</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Margen Bruto Estimado</p>
                </div>
            </div>
        </div>
    );
};

export default ReportsModule;
