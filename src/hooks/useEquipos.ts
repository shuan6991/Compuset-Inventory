import { useContext } from "react"
import { EquipoContext } from "../context/EquipoContext"

export const useEquipos = ()=>{

    const context = useContext(EquipoContext)

    if(!context){
        throw new Error('Falta el context')
    }

    return context
}
