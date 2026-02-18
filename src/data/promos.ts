export interface Promotion {
    id: number;
    titulo: string;
    subtitulo: string;
    precio: number | string;
    color: string;
    imagen: string;
    badge: string;
}

export const promotions: Promotion[] = [
    {
        id: 1,
        titulo: "COMBO CEREBRO",
        subtitulo: "2 Pizzas Grandes + Refresco 2L",
        precio: 349,
        color: "from-red-600 to-orange-500",
        imagen: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800",
        badge: "OFERTA LIMITADA"
    },
    {
        id: 2,
        titulo: "JUEVES DE 2X1",
        subtitulo: "En todas nuestras especialidades clásicas",
        precio: "¡PIDE YA!",
        color: "from-purple-700 to-blue-600",
        imagen: "https://images.unsplash.com/photo-1593504049359-7b7d92c7185d?q=80&w=800",
        badge: "PROMO SEMANAL"
    },
    {
        id: 3,
        titulo: "PACK FAMILIAR",
        subtitulo: "Pizza Familiar + Alitas + Papas",
        precio: 499,
        color: "from-black to-gray-800",
        imagen: "https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?q=80&w=800",
        badge: "MEJOR PRECIO"
    }
];
