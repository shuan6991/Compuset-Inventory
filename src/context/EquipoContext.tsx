import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import { equipoReducer, initialState, type EquipoAction, type EquipoState } from "../reducers/equipoReducer";


type EquiposProviderProps={
    children: ReactNode
}

type EquiposContextProps = {
    state: EquipoState
    dispatch: Dispatch<EquipoAction>
}

export const EquipoContext = createContext<EquiposContextProps>(null!)


export const EquiposProvider = ({children}:EquiposProviderProps)=>{
    const [state, dispatch] = useReducer(equipoReducer,initialState)

    return(
        <EquipoContext.Provider
            value={{
                state,
                dispatch
            }}
        >
            {children}
        </EquipoContext.Provider>
    )
}
