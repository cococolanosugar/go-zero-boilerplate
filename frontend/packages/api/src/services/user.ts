import {
  getUserInfo,
  getUserProfile,
  type UserInfoResp,
  type UserProfileResp,
} from "../gateway";

export const userService = {
  getUserInfo,
  getUserProfile,
};

export type { UserInfoResp, UserProfileResp };
export default userService;
