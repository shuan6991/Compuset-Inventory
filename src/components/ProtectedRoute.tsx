import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({
  children,
  roles
}: ProtectedRouteProps) {
  const usuarioGuardado = localStorage.getItem("usuario");

  // No hay sesión
  if (!usuarioGuardado) {
    return <Navigate to="/" replace />;
  }

  let usuario;

  try {
    usuario = JSON.parse(usuarioGuardado);
  } catch (error) {
    console.error("Error leyendo sesión:", error);

    localStorage.removeItem("usuario");
    localStorage.removeItem("ultimaActividad");

    return <Navigate to="/" replace />;
  }


  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}