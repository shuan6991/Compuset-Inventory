import { useState } from "react";

import {
    FaUser,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaEnvelope,
    FaArrowLeft
} from "react-icons/fa";

import {
    validarLogin,
    solicitarCodigoRecuperacion,
    validarCodigoRecuperacion,
    cambiarContraseña
} from "../services/mantenimientoService";

import type { UsuarioSesion } from "../types";

interface LoginProps {
    onLogin: (usuario: UsuarioSesion) => void;
}

type PasoRecuperacion =
    | "correo"
    | "codigo"
    | "contraseña";

export default function Login({ onLogin }: LoginProps) {

    // =====================================================
    // LOGIN
    // =====================================================

    const [usuario, setUsuario] = useState("");
    const [contraseña, setContraseña] = useState("");
    const [mostrarContraseña, setMostrarContraseña] =
        useState(false);

    const [cargando, setCargando] =
        useState(false);

    const [error, setError] =
        useState("");

    // =====================================================
    // RECUPERACIÓN
    // =====================================================

    const [recuperar, setRecuperar] =
        useState(false);

    const [paso, setPaso] =
        useState<PasoRecuperacion>("correo");

    const [correo, setCorreo] =
        useState("");

    const [codigo, setCodigo] =
        useState("");

    const [nuevaContraseña, setNuevaContraseña] =
        useState("");

    const [confirmarContraseña, setConfirmarContraseña] =
        useState("");

    const [mostrarNuevaContraseña, setMostrarNuevaContraseña] =
        useState(false);

    const [mensaje, setMensaje] =
        useState("");

    // =====================================================
    // LOGIN
    // =====================================================

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {

        e.preventDefault();

        setError("");
        setMensaje("");

        if (
            !usuario.trim() ||
            !contraseña.trim()
        ) {
            setError(
                "Por favor complete todos los campos."
            );

            return;
        }

        try {

            setCargando(true);

            const response =
                await validarLogin(
                    usuario.trim(),
                    contraseña
                );

            if (
                response.success &&
                response.usuario
            ) {

                localStorage.setItem(
                    "usuario",
                    JSON.stringify(
                        response.usuario
                    )
                );

                localStorage.setItem(
                    "usuarioLogueado",
                    "true"
                );

                onLogin(
                    response.usuario
                );

            } else {

                setError(
                    response.message ||
                    "Usuario o contraseña incorrectos."
                );
            }

        } catch (error) {

            console.error(
                "Error realizando login:",
                error
            );

            setError(
                "No fue posible comunicarse con el servidor."
            );

        } finally {

            setCargando(false);
        }
    };

    // =====================================================
    // ABRIR RECUPERACIÓN
    // =====================================================

    const abrirRecuperacion = () => {

        setRecuperar(true);

        setPaso("correo");

        setCorreo("");
        setCodigo("");
        setNuevaContraseña("");
        setConfirmarContraseña("");

        setError("");
        setMensaje("");
    };

    // =====================================================
    // VOLVER AL LOGIN
    // =====================================================

    const volverLogin = () => {

        setRecuperar(false);

        setError("");
        setMensaje("");

        setCorreo("");
        setCodigo("");
        setNuevaContraseña("");
        setConfirmarContraseña("");

        setPaso("correo");
    };

    // =====================================================
    // ENVIAR CÓDIGO DE RECUPERACIÓN
    // =====================================================

    const handleEnviarCodigo = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {

        e.preventDefault();

        setError("");
        setMensaje("");

        const correoNormalizado =
            correo.trim().toLowerCase();

        if (!correoNormalizado) {

            setError(
                "Ingrese su correo electrónico."
            );

            return;
        }

        try {

            setCargando(true);

            const response =
                await solicitarCodigoRecuperacion(
                    correoNormalizado
                );

            if (response.success) {

                setCorreo(
                    correoNormalizado
                );

                setMensaje(
                    "Se ha enviado un código de verificación a su correo."
                );

                setPaso("codigo");

            } else {

                setError(
                    response.message ||
                    "No fue posible enviar el código."
                );
            }

        } catch (error) {

            console.error(
                "Error enviando código:",
                error
            );

            setError(
                "No fue posible enviar el código."
            );

        } finally {

            setCargando(false);
        }
    };

    // =====================================================
    // VALIDAR CÓDIGO
    // =====================================================

    const handleValidarCodigo = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {

        e.preventDefault();

        setError("");
        setMensaje("");

        const correoNormalizado =
            correo.trim().toLowerCase();

        const codigoNormalizado =
            codigo.trim();

        if (!correoNormalizado) {

            setError(
                "No se encontró el correo electrónico."
            );

            return;
        }

        if (!codigoNormalizado) {

            setError(
                "Ingrese el código recibido en su correo."
            );

            return;
        }

        if (!/^\d{6}$/.test(codigoNormalizado)) {

            setError(
                "El código debe tener 6 números."
            );

            return;
        }

        try {

            setCargando(true);

            const response =
                await validarCodigoRecuperacion(
                    correoNormalizado,
                    codigoNormalizado
                );

            if (response.success) {

                setMensaje(
                    "Código validado correctamente."
                );

                setPaso("contraseña");

            } else {

                setError(
                    response.message ||
                    "El código ingresado no es válido."
                );
            }

        } catch (error) {

            console.error(
                "Error validando código:",
                error
            );

            setError(
                "No fue posible validar el código."
            );

        } finally {

            setCargando(false);
        }
    };

    // =====================================================
    // CAMBIAR CONTRASEÑA
    // =====================================================

    const handleCambiarContraseña = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {

        e.preventDefault();

        setError("");
        setMensaje("");

        // =================================================
        // VALIDAR CAMPOS
        // =================================================

        if (
            !nuevaContraseña ||
            !confirmarContraseña
        ) {

            setError(
                "Complete todos los campos."
            );

            return;
        }

        // =================================================
        // VALIDAR COINCIDENCIA
        // =================================================

        if (
            nuevaContraseña !==
            confirmarContraseña
        ) {

            setError(
                "Las contraseñas no coinciden."
            );

            return;
        }

        // =================================================
        // VALIDAR LONGITUD
        // =================================================

        if (
            nuevaContraseña.length < 8
        ) {

            setError(
                "La contraseña debe tener mínimo 8 caracteres."
            );

            return;
        }

        // =================================================
        // VALIDAR MAYÚSCULA
        // =================================================

        if (
            !/[A-Z]/.test(
                nuevaContraseña
            )
        ) {

            setError(
                "La contraseña debe contener al menos una letra mayúscula."
            );

            return;
        }

        // =================================================
        // VALIDAR MINÚSCULA
        // =================================================

        if (
            !/[a-z]/.test(
                nuevaContraseña
            )
        ) {

            setError(
                "La contraseña debe contener al menos una letra minúscula."
            );

            return;
        }

        // =================================================
        // VALIDAR NÚMERO
        // =================================================

        if (
            !/[0-9]/.test(
                nuevaContraseña
            )
        ) {

            setError(
                "La contraseña debe contener al menos un número."
            );

            return;
        }

        try {

            setCargando(true);

            const response =
                await cambiarContraseña(
                    correo.trim().toLowerCase(),
                    codigo.trim(),
                    nuevaContraseña
                );

            if (response.success) {

                setMensaje(
                    "Contraseña actualizada correctamente."
                );

                setTimeout(() => {

                    volverLogin();

                }, 2000);

            } else {

                setError(
                    response.message ||
                    "No fue posible cambiar la contraseña."
                );
            }

        } catch (error) {

            console.error(
                "Error cambiando contraseña:",
                error
            );

            setError(
                "No fue posible cambiar la contraseña."
            );

        } finally {

            setCargando(false);
        }
    };

    // =====================================================
    // VISTA DE RECUPERACIÓN
    // =====================================================

    if (recuperar) {

        return (

            <div className="bg-blue-700 min-h-screen flex items-center justify-center px-4">

                <div className="w-full max-w-md">

                    {/* ENCABEZADO */}

                    <div className="text-center mb-8">

                        <h1 className="text-white text-4xl font-bold uppercase">
                            Compuset Inventory
                        </h1>

                        <p className="text-white mt-2 text-lg">
                            Control de Inventario
                        </p>

                    </div>

                    {/* CARD */}

                    <div className="bg-white rounded-lg p-10 shadow-xl">

                        {/* VOLVER */}

                        <button
                            type="button"
                            onClick={volverLogin}
                            disabled={cargando}
                            className="flex items-center gap-2 text-blue-700 font-bold mb-6 cursor-pointer hover:text-blue-900 disabled:text-gray-400"
                        >

                            <FaArrowLeft />

                            Volver al inicio de sesión

                        </button>

                        {/* TÍTULO */}

                        <h2 className="text-blue-700 text-2xl font-bold text-center uppercase mb-8">
                            Restablecer contraseña
                        </h2>

                        {/* =================================================
                            PASO 1 - CORREO
                        ================================================= */}

                        {paso === "correo" && (

                            <form
                                onSubmit={
                                    handleEnviarCodigo
                                }
                                className="space-y-6"
                            >

                                <p className="text-gray-600 text-center">
                                    Ingresa el correo asociado a tu cuenta.
                                    Te enviaremos un código de verificación.
                                </p>

                                <div>

                                    <label
                                        htmlFor="correo"
                                        className="block text-blue-700 font-bold mb-2"
                                    >
                                        Correo electrónico
                                    </label>

                                    <div className="relative">

                                        <FaEnvelope
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700"
                                        />

                                        <input
                                            id="correo"
                                            type="email"
                                            value={correo}
                                            onChange={(e) =>
                                                setCorreo(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Ingresa tu correo"
                                            disabled={cargando}
                                            autoComplete="email"
                                            className="p-3 pl-10 border border-orange-500 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-600"
                                        />

                                    </div>

                                </div>

                                {mensaje && (

                                    <div className="bg-green-100 border border-green-500 text-green-700 p-3 rounded-lg text-center font-bold">

                                        {mensaje}

                                    </div>

                                )}

                                {error && (

                                    <div className="bg-red-100 border border-red-500 text-red-700 p-3 rounded-lg text-center font-bold">

                                        {error}

                                    </div>

                                )}

                                <button
                                    type="submit"
                                    disabled={cargando}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold p-3 rounded-lg w-full cursor-pointer transition"
                                >

                                    {cargando
                                        ? "ENVIANDO..."
                                        : "ENVIAR CÓDIGO"
                                    }

                                </button>

                            </form>

                        )}

                        {/* =================================================
                            PASO 2 - CÓDIGO
                        ================================================= */}

                        {paso === "codigo" && (

                            <form
                                onSubmit={
                                    handleValidarCodigo
                                }
                                className="space-y-6"
                            >

                                <p className="text-gray-600 text-center">
                                    Hemos enviado un código de
                                    verificación a:
                                </p>

                                <p className="text-blue-700 font-bold text-center break-all">
                                    {correo}
                                </p>

                                <div>

                                    <label
                                        htmlFor="codigo"
                                        className="block text-blue-700 font-bold mb-2"
                                    >
                                        Código de verificación
                                    </label>

                                    <input
                                        id="codigo"
                                        type="text"
                                        value={codigo}
                                        onChange={(e) => {

                                            const valor =
                                                e.target.value.replace(
                                                    /\D/g,
                                                    ""
                                                );

                                            setCodigo(
                                                valor.slice(0, 6)
                                            );
                                        }}
                                        placeholder="Ingresa el código"
                                        maxLength={6}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        disabled={cargando}
                                        className="p-3 border border-orange-500 rounded-lg w-full text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-blue-600"
                                    />

                                </div>

                                {mensaje && (

                                    <div className="bg-green-100 border border-green-500 text-green-700 p-3 rounded-lg text-center font-bold">

                                        {mensaje}

                                    </div>

                                )}

                                {error && (

                                    <div className="bg-red-100 border border-red-500 text-red-700 p-3 rounded-lg text-center font-bold">

                                        {error}

                                    </div>

                                )}

                                <button
                                    type="submit"
                                    disabled={
                                        cargando ||
                                        codigo.length !== 6
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold p-3 rounded-lg w-full cursor-pointer transition"
                                >

                                    {cargando
                                        ? "VALIDANDO..."
                                        : "VALIDAR CÓDIGO"
                                    }

                                </button>

                            </form>

                        )}

                        {/* =================================================
                            PASO 3 - CONTRASEÑA
                        ================================================= */}

                        {paso === "contraseña" && (

                            <form
                                onSubmit={
                                    handleCambiarContraseña
                                }
                                className="space-y-6"
                            >

                                <p className="text-gray-600 text-center">
                                    Código validado correctamente.
                                    Ahora puedes establecer una nueva contraseña.
                                </p>

                                {/* NUEVA CONTRASEÑA */}

                                <div>

                                    <label
                                        htmlFor="nuevaContraseña"
                                        className="block text-blue-700 font-bold mb-2"
                                    >
                                        Nueva contraseña
                                    </label>

                                    <div className="relative">

                                        <FaLock
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700"
                                        />

                                        <input
                                            id="nuevaContraseña"
                                            type={
                                                mostrarNuevaContraseña
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={
                                                nuevaContraseña
                                            }
                                            onChange={(e) =>
                                                setNuevaContraseña(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Nueva contraseña"
                                            disabled={cargando}
                                            autoComplete="new-password"
                                            className="p-3 pl-10 pr-12 border border-orange-500 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-600"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setMostrarNuevaContraseña(
                                                    !mostrarNuevaContraseña
                                                )
                                            }
                                            disabled={cargando}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-700 cursor-pointer disabled:text-gray-400"
                                            aria-label={
                                                mostrarNuevaContraseña
                                                    ? "Ocultar contraseña"
                                                    : "Mostrar contraseña"
                                            }
                                        >

                                            {mostrarNuevaContraseña
                                                ? <FaEyeSlash />
                                                : <FaEye />
                                            }

                                        </button>

                                    </div>

                                </div>

                                {/* CONFIRMAR CONTRASEÑA */}

                                <div>

                                    <label
                                        htmlFor="confirmarContraseña"
                                        className="block text-blue-700 font-bold mb-2"
                                    >
                                        Confirmar contraseña
                                    </label>

                                    <div className="relative">

                                        <FaLock
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700"
                                        />

                                        <input
                                            id="confirmarContraseña"
                                            type={
                                                mostrarNuevaContraseña
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={
                                                confirmarContraseña
                                            }
                                            onChange={(e) =>
                                                setConfirmarContraseña(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Confirma tu contraseña"
                                            disabled={cargando}
                                            autoComplete="new-password"
                                            className="p-3 pl-10 pr-12 border border-orange-500 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-600"
                                        />

                                    </div>

                                </div>

                                {/* REQUISITOS */}

                                <div className="text-sm text-gray-600">

                                    <p className="font-bold mb-1">
                                        La contraseña debe tener:
                                    </p>

                                    <ul className="list-disc ml-5 space-y-1">

                                        <li>
                                            Mínimo 8 caracteres
                                        </li>

                                        <li>
                                            Una letra mayúscula
                                        </li>

                                        <li>
                                            Una letra minúscula
                                        </li>

                                        <li>
                                            Un número
                                        </li>

                                    </ul>

                                </div>

                                {mensaje && (

                                    <div className="bg-green-100 border border-green-500 text-green-700 p-3 rounded-lg text-center font-bold">

                                        {mensaje}

                                    </div>

                                )}

                                {error && (

                                    <div className="bg-red-100 border border-red-500 text-red-700 p-3 rounded-lg text-center font-bold">

                                        {error}

                                    </div>

                                )}

                                <button
                                    type="submit"
                                    disabled={cargando}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold p-3 rounded-lg w-full cursor-pointer transition"
                                >

                                    {cargando
                                        ? "ACTUALIZANDO..."
                                        : "CAMBIAR CONTRASEÑA"
                                    }

                                </button>

                            </form>

                        )}

                    </div>

                    {/* PIE */}

                    <p className="text-white text-center mt-6 text-sm">
                        Sistema de control de inventario
                    </p>

                </div>

            </div>
        );
    }

    // =====================================================
    // LOGIN NORMAL
    // =====================================================

    return (

        <div className="bg-blue-700 min-h-screen flex items-center justify-center px-4">

            <div className="w-full max-w-md">

                {/* ENCABEZADO */}

                <div className="text-center mb-8">

                    <h1 className="text-white text-4xl font-bold uppercase">
                        Compuset Inventory
                    </h1>

                    <p className="text-white mt-2 text-lg">
                        Control de Inventario
                    </p>

                </div>

                {/* CARD */}

                <div className="bg-white rounded-lg p-10 shadow-xl">

                    <h2 className="text-blue-700 text-2xl font-bold text-center uppercase mb-8">
                        Iniciar sesión
                    </h2>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >

                        {/* USUARIO */}

                        <div>

                            <label
                                htmlFor="usuario"
                                className="block text-blue-700 font-bold mb-2"
                            >
                                Usuario
                            </label>

                            <div className="relative">

                                <FaUser
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700"
                                />

                                <input
                                    id="usuario"
                                    type="text"
                                    value={usuario}
                                    onChange={(e) =>
                                        setUsuario(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ingresa tu usuario"
                                    disabled={cargando}
                                    autoComplete="username"
                                    className="p-3 pl-10 border border-orange-500 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-600"
                                />

                            </div>

                        </div>

                        {/* CONTRASEÑA */}

                        <div>

                            <label
                                htmlFor="contraseña"
                                className="block text-blue-700 font-bold mb-2"
                            >
                                Contraseña
                            </label>

                            <div className="relative">

                                <FaLock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700"
                                />

                                <input
                                    id="contraseña"
                                    type={
                                        mostrarContraseña
                                            ? "text"
                                            : "password"
                                    }
                                    value={contraseña}
                                    onChange={(e) =>
                                        setContraseña(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ingresa tu contraseña"
                                    disabled={cargando}
                                    autoComplete="current-password"
                                    className="p-3 pl-10 pr-12 border border-orange-500 rounded-lg w-full outline-none focus:ring-2 focus:ring-blue-600"
                                />

                                <button
                                    type="button"
                                    disabled={cargando}
                                    onClick={() =>
                                        setMostrarContraseña(
                                            !mostrarContraseña
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-700 cursor-pointer disabled:text-gray-400"
                                    aria-label={
                                        mostrarContraseña
                                            ? "Ocultar contraseña"
                                            : "Mostrar contraseña"
                                    }
                                >

                                    {mostrarContraseña
                                        ? <FaEyeSlash />
                                        : <FaEye />
                                    }

                                </button>

                            </div>

                        </div>

                        {/* ERROR */}

                        {error && (

                            <div className="bg-red-100 border border-red-500 text-red-700 p-3 rounded-lg text-center font-bold">

                                {error}

                            </div>

                        )}

                        {/* INGRESAR */}

                        <button
                            type="submit"
                            disabled={cargando}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold p-3 rounded-lg w-full cursor-pointer transition"
                        >

                            {cargando
                                ? "VALIDANDO..."
                                : "INGRESAR"
                            }

                        </button>

                        {/* RECUPERAR */}

                        <div className="text-center">

                            <button
                                type="button"
                                onClick={
                                    abrirRecuperacion
                                }
                                disabled={cargando}
                                className="text-blue-700 font-bold text-sm hover:text-orange-500 hover:underline cursor-pointer disabled:text-gray-400"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>

                        </div>

                    </form>

                </div>

                {/* PIE */}

                <p className="text-white text-center mt-6 text-sm">
                    Sistema de control de inventario
                </p>

            </div>

        </div>
    );
}