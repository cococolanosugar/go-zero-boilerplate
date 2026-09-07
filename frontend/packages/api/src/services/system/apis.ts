import {
  listSysApis,
  type ListSysApisResp,
  type SysApiItem,
} from "../../gateway";

export const systemApisApi = {
  list: listSysApis,
};

export default systemApisApi;
