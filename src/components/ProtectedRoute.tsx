import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({
    children
}: ProtectedRouteProps) {

    const usuarioGuardado =
        localStorage.getItem("usuario");


    if (!usuarioGuardado) {

        return <Navigate to="/" replace />;

    }


    const usuario =
        JSON.parse(usuarioGuardado);


    if (usuario.rol !== "admin") {

        return <Navigate to="/" replace />;

    }


    return children;

}