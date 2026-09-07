import {
  adminLogin,
  getAdminProfile,
  login,
  register,
  type AdminLoginReq,
  type AdminLoginResp,
  type AdminProfileResp,
  type LoginReq,
  type LoginResp,
  type RegisterReq,
  type RegisterResp,
} from "../gateway";
import { setToken, getToken } from "../gocliRequest";

export const authService = {
  adminLogin,
  getAdminProfile,
  login,
  register,
  setToken,
  getToken,
  logout: () => setToken(null),
};

export default authService;
