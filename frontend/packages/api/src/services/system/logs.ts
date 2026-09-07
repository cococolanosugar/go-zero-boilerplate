import {
  listSysLoginLogs,
  listSysOperLogs,
  type ListSysLoginLogsReqParams,
  type ListSysLoginLogsResp,
  type ListSysOperLogsReqParams,
  type ListSysOperLogsResp,
  type SysLoginLogItem,
  type SysOperLogItem,
} from "../../gateway";

export const systemLogsApi = {
  listLoginLogs: listSysLoginLogs,
  listOperLogs: listSysOperLogs,
};

export default systemLogsApi;
