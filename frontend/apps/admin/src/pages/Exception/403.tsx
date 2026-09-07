import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { useIntl } from "../../contexts/LocaleContext";

export const Exception403: React.FC = () => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
      }}
    >
      <Result
        status="403"
        title="403"
        subTitle={formatMessage({
          id: "exception.403.subTitle",
          defaultMessage: "抱歉，您暂无访问该页面的操作权限。请联系管理员分配权限或返回大盘。",
        })}
        extra={
          <Button type="primary" onClick={() => navigate("/dashboard")}>
            {formatMessage({
              id: "exception.backHome",
              defaultMessage: "返回监控大盘",
            })}
          </Button>
        }
      />
    </div>
  );
};

export default Exception403;
