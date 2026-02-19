'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { pizzas as initialPizzas, Pizza } from '@/data/menu';
import { ExtraOption } from '@/data/options';
import { CartItem } from '@/data/cart';
import PizzaCard from '@/components/pizza/PizzaCard';
import FloatingCart from '@/components/cart/FloatingCart';
import CustomizationModal from '@/components/pizza/CustomizationModal';
import CheckoutModal from '@/components/cart/CheckoutModal';
import PromoSlider from '@/components/layout/PromoSlider';
import NotificationToast, { NotificationType } from '@/components/ui/NotificationToast';
import { Pizza as PizzaIcon, Phone, MapPin, Clock } from 'lucide-react';
import { getSocket } from '@/lib/socket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}` : 'http://localhost:3001');

export default function Home() {
  const [menu, setMenu] = useState<Pizza[]>(initialPizzas);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPizza, setSelectedPizza] = useState<Pizza | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Escuchar actualizaciones globales del menú (ej. cuando el admin apaga una pizza)
    socket.on('menu_actualizado', (updatedMenu: Pizza[]) => {
      console.log("Menú actualizado recibido en cliente:", updatedMenu);
      setMenu(updatedMenu);
    });

    return () => {
      socket.off('menu_actualizado');
    };
  }, []);

  // Notification state
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    message: string;
    type: NotificationType;
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const showNotification = (message: string, type: NotificationType = 'success') => {
    setNotification({ isVisible: true, message, type });
  };

  const handleOpenModal = (pizza: Pizza) => {
    setSelectedPizza(pizza);
    setIsModalOpen(true);
  };

  const addToCart = (pizza: Pizza, extras: ExtraOption[], finalPrice: number) => {
    // Generate a unique ID for this cart entry based on pizza ID and sorted extra IDs
    const extraIds = extras.map(e => e.id).sort().join('-');
    const cartId = `${pizza.id}-${extraIds}`;

    const existing = cart.find(item => item.cartId === cartId);
    if (existing) {
      setCart(cart.map(item =>
        item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        ...pizza,
        extras,
        totalItemPrice: finalPrice,
        quantity: 1,
        cartId
      }]);
    }
    setIsModalOpen(false);
  };

  const sendToOrderChannel = async (userData: any) => {
    if (isOrdering) return;
    setIsOrdering(true);
    const totalPrice = cart.reduce((acc, item) => acc + (item.totalItemPrice * item.quantity), 0);
    const orderId = `ord-${Math.floor(Math.random() * 9000) + 1000}`;

    const pedido = {
      id: orderId,
      items: cart,
      total: totalPrice,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cliente_nombre: userData.nombre,
      direccion: userData.direccion,
      telefono: userData.telefono,
      referencias: userData.referencias
    };

    try {
      const response = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido)
      });

      if (response.ok) {
        showNotification(`¡Pedido #${orderId.split('-')[1]} recibido! Preparando su pizza...`, 'success');
        setCart([]);
        setIsCheckoutOpen(false);
      } else {
        throw new Error("Error en el servidor");
      }
    } catch (error) {
      console.error("Error enviando pedido:", error);
      showNotification("No se pudo conectar con cocina. Intente de nuevo.", 'error');
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="bg-[#fafafa] min-h-screen selection:bg-yellow-200">
      {/* Dynamic Header / Hero */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80 z-10" />
          <motion.img
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.7 }}
            transition={{ duration: 1.5 }}
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070"
            className="w-full h-full object-cover"
            alt="Hero Background"
          />
        </div>

        <div className="relative z-20 container mx-auto px-6 text-center py-20 flex flex-col items-center justify-center min-h-full">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center flex-grow justify-center"
          >
            <div className="flex justify-center mb-8">
              <div className="bg-red-600 p-4 rounded-3xl rotate-12 shadow-2xl">
                <PizzaIcon className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-6xl md:text-9xl font-black text-white italic leading-[0.8] tracking-tighter uppercase mb-6 drop-shadow-2xl">
              Pizza <span className="text-yellow-400">Cerebro</span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-200 font-medium italic mb-10 tracking-wide max-w-2xl mx-auto px-4">
              La experiencia definitiva en cada rebanada. Ingredientes premium, pasión artesanal.
            </p>
            <motion.a
              href="#menu"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 md:px-12 md:py-6 rounded-[2rem] font-black text-lg md:text-xl italic uppercase tracking-widest shadow-2xl transition-all inline-block mb-12"
            >
              ORDENAR AHORA
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap justify-center gap-6 md:gap-12 pb-8"
          >
            <div className="flex items-center gap-3 text-white/80">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-bold uppercase tracking-widest">30 MIN</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <MapPin className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-bold uppercase tracking-widest">A DOMICILIO</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Info Bar */}
      <div className="bg-white py-6 border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-2xl font-black italic uppercase tracking-tighter">
              Pizza <span className="text-red-600">Cerebro</span>
            </span>
          </div>
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-2">
            <a href="#clasicas" className="text-sm font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors whitespace-nowrap">Clásicas</a>
            <a href="#especialidades" className="text-sm font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors whitespace-nowrap">Especialidades</a>
            <a href="#bebidas" className="text-sm font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors whitespace-nowrap">Bebidas</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:5212221234567" className="bg-black text-white px-6 py-3 rounded-2xl font-black text-sm uppercase italic flex items-center gap-2 hover:bg-gray-800 transition-all">
              <Phone className="w-4 h-4" />
              PEDIR
            </a>
          </div>
        </div>
      </div>

      {/* Promotions Slider */}
      <PromoSlider />

      {/* Menu Section */}
      <main id="menu" className="container mx-auto px-6 py-20 pb-40">
        <div className="mb-20">
          <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
            Nuestro <span className="text-red-600">Menú</span>
          </h2>
          <div className="w-24 h-2 bg-red-600 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {menu.map(pizza => (
            <PizzaCard
              key={pizza.id}
              pizza={pizza}
              onAddToCart={() => handleOpenModal(pizza)}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-gray-100">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-6">Pizza <span className="text-red-600">Cerebro</span></h3>
            <p className="text-gray-500 font-medium">Las mejores pizzas de la ciudad, elaboradas con ingredientes frescos y el amor que solo nosotros sabemos ponerle.</p>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Horarios</h4>
            <div className="space-y-2">
              <p className="font-bold flex justify-between"><span>Lun - Jue:</span> <span className="text-gray-500">12:00 PM - 10:00 PM</span></p>
              <p className="font-bold flex justify-between"><span>Vie - Dom:</span> <span className="text-gray-500">12:00 PM - 12:00 AM</span></p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Ubicación</h4>
            <p className="font-bold text-gray-700">Av. Siempre Viva 742, Col. Springfield, C.P. 72000</p>
            <p className="text-red-600 font-bold mt-2 underline decoration-2 underline-offset-4">Ver en Mapa</p>
          </div>
        </div>
        <div className="container mx-auto px-6 mt-20 pt-8 border-t border-gray-50 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Pizza Cerebro. Todos los derechos reservados.
        </div>
      </footer>

      {/* Overlays */}
      <CustomizationModal
        pizza={selectedPizza}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={addToCart}
      />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirm={sendToOrderChannel}
        total={cart.reduce((acc, item) => acc + (item.totalItemPrice * item.quantity), 0)}
      />
      <FloatingCart cart={cart} onOrder={() => setIsCheckoutOpen(true)} />

      {/* Notifications */}
      <NotificationToast
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
    </div>
  );
};
