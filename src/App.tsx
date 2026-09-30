import { useEffect, useState } from "react";

import {
  HashRouter,
  Routes,
  Route
} from "react-router-dom";

import Header from "./components/Header";
import Login from "./components/Login";

import { useEquipos } from "./hooks/useEquipos";
import { obtenerTodo } from "./services/mantenimientoService";

import Form from "./views/Form";
import Mantenimientos from "./views/Mantenimientos";
import Dashboard from "./views/Dashboard";
import Reportes from "./views/Reportes";

import type { UsuarioSesion } from "./types";
import ProtectedRoute from "./components/ProtectedRoute";
import FormEquipos from "./views/FormEquipos";


function App() {

  const { dispatch } = useEquipos();




  const usuarioGuardado =
    localStorage.getItem("usuario");


  const [usuario, setUsuario] =
    useState<UsuarioSesion | null>(
      usuarioGuardado
        ? JSON.parse(usuarioGuardado)
        : null
    );


  // LOGIN
  const handleLogin = (
    usuarioLogueado: UsuarioSesion
  ) => {

    setUsuario(usuarioLogueado);

  };



  // CARGAR INFORMACIÓN

  useEffect(() => {

    if (!usuario) {
      return;
    }


    const cargarTodo = async () => {

      try {

        const resRaw =
          await obtenerTodo();


        const res =
          typeof resRaw === "string"
            ? JSON.parse(resRaw)
            : resRaw;


        console.log(
          "Esta es la informacion que esta llegando:",
          res
        );


        dispatch({

          type: "Inicial-bases",

          payload: {

            marca:
              res.marca,

            tecnicos:
              res.tecnicos,

            ciudad:
              res.ciudad,

            novedades:
              res.novedades,

            tipo:
              res.tipo,

            mantenimiento:
              res.mantenimiento || [],

            cantidadEquipos:
              res.cantidadEquipos,

            equipos:
              res.equipos || []

          }

        });


      } catch (error) {

        console.error(
          "Error cargando datos",
          error
        );

      }

    };


    cargarTodo();


  }, [dispatch, usuario]);


  if (!usuario) {

    return (
      <Login
        onLogin={handleLogin}
      />
    );

  }


  return (

    <HashRouter>

      <Header onLogout={() => setUsuario(null)} />

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/mantenimientos"
          element={<Mantenimientos />}
        />

        <Route
          path="/formulario"
          element={<Form />}
        />


        <Route
          path="/formularioEquipo"
          element={<FormEquipos />}
        />


        <Route
          path="/reportes"
          element={
            <ProtectedRoute>
              <Reportes />
            </ProtectedRoute>
          }
        />

      </Routes>

    </HashRouter>
  );
}


export default App;