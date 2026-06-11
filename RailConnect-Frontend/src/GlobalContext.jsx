import { createContext, useReducer } from "react";

/*
    1) Create context : createContext() [EXPORT]
    2) Reducer function : function reducer(state, action) {}
    3) Create Provider : function GlobalProvider({ children }) {} [EXPORT]
*/

export const GlobalContext = createContext();

const initialState = {
    user: null,
    loading: true,
    autoRedirect: true
};

function reducer(state, action) {
    switch (action.type) {
        case "SET_USER":
            return { ...state, user: action.payload, loading: false };

        case "LOADING_USER":
            return { ...state, loading: true };

        case "REMOVE_USER":
            return { ...state, user: null, loading: false };

        case "AUTO_REDIRECT":
            return {...state, autoRedirect: true}

        case "NO_AUTO_REDIRECT":
            return {...state, autoRedirect: false}

        default:
            return state;
    }
}

export function GlobalProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <GlobalContext.Provider value={{ state, dispatch }}>
            {children}
        </GlobalContext.Provider>
    );
}
