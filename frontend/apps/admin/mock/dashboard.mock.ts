export default {
  // 获取大盘聚合信息（模拟 mr.Finish 内网并发拉取 User 与 Order 微服务）
  "GET /api/v1/order/dashboard": {
    code: 200,
    msg: "SUCCESS",
    data: {
      userInfo: {
        id: 1,
        name: "超级管理员 (Mock 离线开发)",
        mobile: "13800138000",
        avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
      },
      order: {
        orderId: 1001,
        item: "Go-Zero 高性能微服务全栈架构实操课 (Mock 仿真数据)",
        amount: 888.0,
        status: "PAID",
        userId: 1,
        userName: "超级管理员",
        avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
      },
    },
  },
};
