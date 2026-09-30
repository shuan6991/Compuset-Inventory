import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

interface HeaderProps {
    onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {

    const [menuAbierto, setMenuAbierto] = useState(false);

    const usuarioGuardado = localStorage.getItem("usuario");

    const usuario = usuarioGuardado
        ? JSON.parse(usuarioGuardado)
        : null;


    const cerrarSesion = () => {

        localStorage.removeItem("usuario");
        localStorage.removeItem("usuarioLogueado");

        setMenuAbierto(false);

        onLogout();

    };


    const cerrarMenu = () => {
        setMenuAbierto(false);
    };

    const estiloNavLink = ({ isActive }: { isActive: boolean }) =>
        `text-white text-[17px] font-bold px-3 py-2 rounded-lg transition-colors ${isActive
            ? "bg-orange-500"
            : "hover:bg-blue-700 hover:text-orange-400"
        }`;


    return (

        <header className="bg-blue-800 py-5">

            <div className="max-w-8xl w-[95%] mx-auto">

                {/* BARRA PRINCIPAL */}

                <div className="flex justify-between items-center">

                    {/* LOGO */}

                    <Link
                        to="/"
                        onClick={cerrarMenu}
                    >
                        <h1 className="text-xl sm:text-2xl uppercase text-white font-bold">
                            Compuset Inventory
                        </h1>
                    </Link>


                    {/* NAVEGACIÓN DESKTOP */}

                    <nav className="hidden md:flex items-center gap-5">

                        <NavLink
                            className={estiloNavLink}
                            to="/mantenimientos"
                        >
                            Mantenimientos
                        </NavLink>
                        {(usuario?.rol === "admin" || usuario?.rol === "user") && (
                            <>
                                <NavLink
                                    className={estiloNavLink}
                                    to="/formulario"
                                >
                                    Formulario
                                </NavLink>

                                <NavLink
                                    className={estiloNavLink}
                                    to="/formularioEquipo"
                                >
                                    Equipo Nuevo
                                </NavLink>
                            </>
                        )}


                        {(usuario?.rol === "admin" || usuario?.rol === "visualizador") && (
                            <NavLink
                                className={estiloNavLink}
                                to="/reportes"
                            >
                                Reportes
                            </NavLink>
                        )}


                        {/* USUARIO */}

                        {usuario && (

                            <div className="flex items-center gap-3 ml-3">

                                <div className="text-white text-right">

                                    <p className="font-bold">
                                        {usuario.nombre} {usuario.apellido}
                                    </p>

                                    <p className="text-xs uppercase">
                                        {usuario.rol}
                                    </p>

                                </div>


                                <button
                                    onClick={cerrarSesion}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                                >
                                    Cerrar sesión
                                </button>

                            </div>

                        )}

                    </nav>


                    {/* BOTÓN HAMBURGUESA */}

                    <button
                        type="button"
                        onClick={() => setMenuAbierto(!menuAbierto)}
                        className="md:hidden text-white text-3xl cursor-pointer"
                        aria-label="Abrir menú"
                        aria-expanded={menuAbierto}
                    >
                        {menuAbierto ? "✕" : "☰"}
                    </button>

                </div>


                {/* MENÚ MOBILE */}

                {menuAbierto && (

                    <div className="md:hidden mt-5 border-t border-blue-600 pt-5">

                        <nav className="flex flex-col gap-3">

                            <Link
                                className="text-white text-[17px] font-bold hover:bg-blue-700 px-3 py-3 rounded-lg"
                                to="/mantenimientos"
                                onClick={cerrarMenu}
                            >
                                Mantenimientos
                            </Link>

                            {(usuario?.rol === "admin" || usuario?.rol === 'user') && (
                                <>
                                    <Link
                                        className="text-white text-[17px] font-bold hover:bg-blue-700 px-3 py-3 rounded-lg"
                                        to="/formulario"
                                        onClick={cerrarMenu}
                                    >
                                        Formulario
                                    </Link>

                                    <Link
                                        className="text-white text-[17px] font-bold hover:bg-blue-700 px-3 py-3 rounded-lg"
                                        to="/formularioEquipo"
                                        onClick={cerrarMenu}
                                    >
                                        Formulario Equipo
                                    </Link>
                                </>
                            )}

                            {(usuario?.rol === "admin" || usuario?.rol === 'visualizador') && (

                                <Link
                                    className="text-white text-[17px] font-bold hover:bg-blue-700 px-3 py-3 rounded-lg"
                                    to="/reportes"
                                    onClick={cerrarMenu}
                                >
                                    Reportes
                                </Link>

                            )}


                            {/* INFORMACIÓN DEL USUARIO */}

                            {usuario && (

                                <div className="border-t border-blue-600 mt-2 pt-4">

                                    <div className="text-white mb-3 px-3">

                                        <p className="font-bold">
                                            {usuario.nombre} {usuario.apellido}
                                        </p>

                                        <p className="text-sm uppercase text-blue-200">
                                            {usuario.rol}
                                        </p>

                                    </div>


                                    <button
                                        onClick={cerrarSesion}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-lg cursor-pointer w-full"
                                    >
                                        Cerrar sesión
                                    </button>

                                </div>

                            )}

                        </nav>

                    </div>

                )}

            </div>

        </header>

    );
}