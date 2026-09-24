import { getAdminProfile, getToken, setToken } from "@zero/api";
import type { TitanInitialState } from "./contexts/InitialStateContext";

export async function getInitialState(): Promise<TitanInitialState> {
  const token = getToken();
  if (!token) {
    return {
      currentUser: null,
      isLoggedIn: false,
      loading: false,
    };
  }

  try {
    const user = await getAdminProfile();
    return {
      currentUser: user,
      isLoggedIn: true,
      loading: false,
    };
  } catch (e) {
    console.warn("[Titan] 拉取用户 Profile 失败，清理 Token:", e);
    setToken("");
    return {
      currentUser: null,
      isLoggedIn: false,
      loading: false,
    };
  }
}
