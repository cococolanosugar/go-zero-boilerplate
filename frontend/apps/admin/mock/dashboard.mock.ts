export default {
  // 获取系统大盘聚合信息（模拟 mr.Finish 内网并发拉取用户画像与任务统计）
  "GET /api/v1/dashboard/overview": {
    code: 200,
    msg: "SUCCESS",
    data: {
      userInfo: {
        id: 1,
        name: "超级管理员 (Mock 离线开发)",
        mobile: "13800138000",
        avatar: "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
      },
      systemStats: {
        totalUsers: 128,
        activeTasks: 4,
        completedTasks: 36,
        successRate: 99.8,
      },
      sysTime: Date.now(),
    },
  },
};
