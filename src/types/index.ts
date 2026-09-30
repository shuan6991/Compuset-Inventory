export type Tecnico = {
    id: number,
    nombre: string,
    apellido: string
}


export type Equipos = {
    activo: string,
    tipo: number,
    serie: string,
    marca: number,
    modelo: number,
    ciudad: string,
    sede: number,
    area: string,
}


export type Marcas = {
    id: number,
    nombre: string,
    modelo: Modelo[]
}


export type Modelo = {
    id: number,
    nombre: string
}


export type Tipo = {
    id: number,
    nombre: string
}


export type Ciudad = {
    id: string,
    nombre: string,
    centro: Centro[]
}


export type Centro = {
    id: number,
    nombre: string
}


export type Novedades = {
    id: number,
    nombre: string
}


export interface InitialData {
    marca: Marcas[];
    tecnicos: Tecnico[];
    ciudad: Ciudad[];
    novedades: Novedades[];
    tipo: Tipo[];
    mantenimiento: Mantenimiento[];
    cantidadEquipos: number;
    equipos: Equipos[];
}


 
export type Mantenimiento = {
    fecha: string,
    tipo: number,
    activo: string,
    serie: string,
    marca: number,
    modelo: number,
    ciudad: string,
    sede: number,
    area: string,
    tecnico: number,
    novedades: number,
    observaciones: string,
    ciclo: number,
    año: number
}


export interface UsuarioSesion {
    id: string | number;
    nombre: string;
    apellido: string;
    usuario: string;
    rol: 'admin' | 'user' | string;
    correo: string;
}


export interface LoginResponse {
    success: boolean;
    message: string;
    usuario?: UsuarioSesion;
}