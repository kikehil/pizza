export interface Pizza {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    imagen: string;
    categoria: string;
    activo: boolean; // Control de disponibilidad
}

export const pizzas: Pizza[] = [
    {
        id: 1,
        nombre: "Pepperoni Especial",
        descripcion: "Doble porción de pepperoni con queso mozzarella premium y un toque de orégano.",
        precio: 189,
        imagen: "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800",
        categoria: "Clásicas",
        activo: true
    },
    {
        id: 2,
        nombre: "Mexicana",
        descripcion: "Chorizo, jalapeño, cebolla, frijoles y un toque de salsa secreta.",
        precio: 210,
        imagen: "https://images.unsplash.com/photo-1593504049359-7b7d92c7185d?q=80&w=800",
        categoria: "Especialidades",
        activo: true
    },
    {
        id: 3,
        nombre: "Hawaiana Premium",
        descripcion: "Jamón glaseado, piña miel y extra queso mozzarella.",
        precio: 195,
        imagen: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800",
        categoria: "Clásicas",
        activo: true
    },
    {
        id: 4,
        nombre: "Carnes Frías",
        descripcion: "Salami, jamón, salchicha italiana y tocino crujiente.",
        precio: 230,
        imagen: "https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?q=80&w=800",
        categoria: "Especialidades",
        activo: true
    },
    {
        id: 5,
        nombre: "Vegetariana Gourmet",
        descripcion: "Pimiento verde, cebolla morada, champiñones, aceitunas negras y tomate fresco.",
        precio: 185,
        imagen: "https://images.unsplash.com/photo-1511688855354-1261f4794ad7?q=80&w=800",
        categoria: "Clásicas",
        activo: true
    },
    {
        id: 6,
        nombre: "BBQ Chicken",
        descripcion: "Pechuga de pollo a la parrilla, cebolla morada y nuestra salsa BBQ artesanal.",
        precio: 215,
        imagen: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800",
        categoria: "Especialidades",
        activo: true
    },
    {
        id: 7,
        nombre: "Alitas BBQ (6 pzas)",
        descripcion: "Alitas de pollo bañadas en salsa BBQ con aderezo ranch.",
        precio: 120,
        imagen: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?q=80&w=800",
        categoria: "Especialidades",
        activo: true
    },
    {
        id: 8,
        nombre: "Refresco Familiar 2L",
        descripcion: "Coca-Cola, Sprite o Fanta bien fría.",
        precio: 45,
        imagen: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800",
        categoria: "Bebidas",
        activo: true
    },
    {
        id: 9,
        nombre: "Agua Mineral",
        descripcion: "Botella de 600ml.",
        precio: 25,
        imagen: "https://images.unsplash.com/photo-1559839914-17aae19cea9e?q=80&w=800",
        categoria: "Bebidas",
        activo: true
    }
];
