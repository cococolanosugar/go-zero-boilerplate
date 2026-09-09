import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { useIntl } from "../../contexts/LocaleContext";

export const Exception404: React.FC = () => {
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
        status="404"
        title="404"
        subTitle={formatMessage({
          id: "exception.404.subTitle",
          defaultMessage: "抱歉，您访问的页面不存在或已被移除。",
        })}
        extra={
          <Button type="primary" onClick={() => navigate("/home")}>
            {formatMessage({
              id: "exception.backHome",
              defaultMessage: "返回门户首页",
            })}
          </Button>
        }
      />
    </div>
  );
};

export default Exception404;