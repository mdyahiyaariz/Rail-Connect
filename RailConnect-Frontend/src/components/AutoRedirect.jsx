import { useContext, useEffect } from "react";
import { GlobalContext } from "../GlobalContext";

export const AutoRedirect = () => {
    const { state, dispatch } = useContext(GlobalContext);
    useEffect(() => {
        dispatch({ type: "AUTO_REDIRECT" });
    }, []);
    return null;
};
