const mockOrders: Record<number, any> = {
  1001: {
    orderId: 1001,
    item: "云原生微服务全栈高性能架构方案 (Enterprise Edition)",
    amount: 1999900,
    status: "PAID",
    userId: 1,
    userName: "超级管理员 (Mock)",
    avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
  },
  1002: {
    orderId: 1002,
    item: "分布式缓存 Redis 6.0 深度运维与容灾实战手册",
    amount: 29900,
    status: "PAID",
    userId: 2,
    userName: "架构总监",
    avatar: "https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png",
  },
  1003: {
    orderId: 1003,
    item: "Ant Design 6.x 企业级高阶组件定制与主题研发专栏",
    amount: 68800,
    status: "PENDING",
    userId: 3,
    userName: "业务支持专员",
    avatar: "https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png",
  },
};

export default {
  // 订单详情聚合查询
  "GET /api/v1/order/detail": (req: any, res: any) => {
    const orderId = Number(req.query?.orderId) || 1001;
    const order = mockOrders[orderId] || {
      orderId,
      item: `定制微服务算力集群包 #${orderId}`,
      amount: 888800,
      status: "PAID",
      userId: 1,
      userName: "超级管理员 (Mock)",
      avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
    };

    res.json({
      code: 200,
      msg: "SUCCESS",
      data: order,
    });
  },
};
