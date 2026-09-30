import GraficaFaltantesPorTipo from "../components/GraficaFaltantesPorTipo";
import GraficaMantenimiento from "../components/GraficaMantenimiento";


export default function Dashboard() {
    
  return (
    <div className="py-20 max-w-5xl mx-auto flex flex-col md:grid md:grid-cols-2 gap-10">
        <GraficaMantenimiento />
        <GraficaFaltantesPorTipo />
    </div>
  )
}
