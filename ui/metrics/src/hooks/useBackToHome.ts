import { useCallback } from "react";
import { useNavigate } from "react-router";
import useAppState from "@/context/useAppState";

/** Returns a function that when called will navigate back to home page (/) */
export default function useBackToHome() {
  const [, dispatch] = useAppState();
  const navigate = useNavigate();

  const backToHome = useCallback(() => {
    dispatch({ type: "setIsMenuOpen", payload: false });
    navigate("/")?.catch((e) => {
      console.error("unexpected error useBackToHome", e);
    });
  }, [navigate, dispatch]);

  return backToHome;
}
