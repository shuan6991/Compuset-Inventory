import { useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import { useEquipos } from "./hooks/useEquipos";
import { obtenerTodo } from "./services/mantenimientoService";

import Form from "./views/Form";
import Mantenimientos from "./views/Mantenimientos";
import Dashboard from "./views/Dashboard";
import Reportes from "./views/Reportes";
import FormEquipos from "./views/FormEquipos";

import type { UsuarioSesion } from "./types";


const TIEMPO_INACTIVIDAD = 30 * 60 * 1000;


const CLAVE_ULTIMA_ACTIVIDAD = "ultimaActividad";

function App() {
  const { dispatch } = useEquipos();

  const usuarioGuardado = localStorage.getItem("usuario");

  const [usuario, setUsuario] = useState<UsuarioSesion | null>(
    usuarioGuardado ? JSON.parse(usuarioGuardado) : null
  );


  useEffect(() => {
    if (!usuario) return;

    const cargarTodo = async () => {
      try {
        const resRaw = await obtenerTodo();

        const res =
          typeof resRaw === "string"
            ? JSON.parse(resRaw)
            : resRaw;

        dispatch({
          type: "Inicial-bases",
          payload: {
            marca: res.marca,
            tecnicos: res.tecnicos,
            ciudad: res.ciudad,
            novedades: res.novedades,
            tipo: res.tipo,
            mantenimiento: res.mantenimiento || [],
            cantidadEquipos: res.cantidadEquipos,
            equipos: res.equipos || []
          }
        });
      } catch (error) {
        console.error("Error cargando datos", error);
      }
    };

    cargarTodo();
  }, [dispatch, usuario]);


  useEffect(() => {
  
    if (!usuario) return;


    const ultimaActividadGuardada =
      localStorage.getItem(CLAVE_ULTIMA_ACTIVIDAD);

    const ahora = Date.now();

    if (ultimaActividadGuardada) {
      const ultimaActividad = Number(ultimaActividadGuardada);

      const tiempoInactivo = ahora - ultimaActividad;

      // ------------------------------------------
      // Si ya superó los 30 minutos
      // ------------------------------------------
      if (tiempoInactivo >= TIEMPO_INACTIVIDAD) {
        localStorage.removeItem("usuario");
        localStorage.removeItem(CLAVE_ULTIMA_ACTIVIDAD);

        setUsuario(null);

        return;
      }
    }


    localStorage.setItem(
      CLAVE_ULTIMA_ACTIVIDAD,
      Date.now().toString()
    );

    let timeout: ReturnType<typeof setTimeout>;


    const actualizarActividad = () => {
      localStorage.setItem(
        CLAVE_ULTIMA_ACTIVIDAD,
        Date.now().toString()
      );

      // Reiniciar temporizador
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        cerrarSesionPorInactividad();
      }, TIEMPO_INACTIVIDAD);
    };

 
    const cerrarSesionPorInactividad = () => {
      localStorage.removeItem("usuario");
      localStorage.removeItem(CLAVE_ULTIMA_ACTIVIDAD);

      setUsuario(null);
    };



    const eventos = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click"
    ];

    eventos.forEach((evento) => {
      window.addEventListener(evento, actualizarActividad);
    });

    // Iniciar temporizador
    timeout = setTimeout(() => {
      cerrarSesionPorInactividad();
    }, TIEMPO_INACTIVIDAD);


    return () => {
      clearTimeout(timeout);

      eventos.forEach((evento) => {
        window.removeEventListener(
          evento,
          actualizarActividad
        );
      });
    };
  }, [usuario]);

  const handleLogin = (usuarioLogueado: UsuarioSesion) => {
    localStorage.setItem(
      "usuario",
      JSON.stringify(usuarioLogueado)
    );

    // Guardar momento en que inició/renovó la sesión
    localStorage.setItem(
      CLAVE_ULTIMA_ACTIVIDAD,
      Date.now().toString()
    );

    setUsuario(usuarioLogueado);
  };

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem(CLAVE_ULTIMA_ACTIVIDAD);

    setUsuario(null);
  };

  if (!usuario) {
    return <Login onLogin={handleLogin} />;
  }

 
  return (
    <HashRouter>

      <Header onLogout={handleLogout} />

      <Routes>

        {/* Dashboard */}
        <Route
          path="/"
          element={<Dashboard />}
        />

        {/* Mantenimientos */}
        <Route
          path="/mantenimientos"
          element={
            <Mantenimientos />
          }
        />

        {/* Formulario mantenimiento */}
        <Route
          path="/formulario"
          element={
            <ProtectedRoute roles={["admin", "user"]}>
              <Form />
            </ProtectedRoute>
          }
        />

        {/* Formulario nuevo equipo */}
        <Route
          path="/formularioEquipo"
          element={
            <ProtectedRoute roles={["admin", "user"]}>
              <FormEquipos />
            </ProtectedRoute>
          }
        />

        {/* Reportes */}
        <Route
          path="/reportes"
          element={
            <ProtectedRoute roles={["admin", "visualizador"]}>
              <Reportes />
            </ProtectedRoute>
          }
        />

        {/* Ruta desconocida */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </HashRouter>
  );
}

export default App;