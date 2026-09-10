/**
 * 通用 CSV 数据流导出工具函数
 * 自动添加 UTF-8 BOM，防止 Excel 打开中文乱码
 */
export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  columns: { title: string; dataIndex: string; render?: (val: any, record: T) => string }[],
  filename = "export.csv"
) {
  if (!data || data.length === 0) {
    return false;
  }

  const header = columns.map((c) => `"${String(c.title).replace(/"/g, '""')}"`).join(",");
  const rows = data.map((item) => {
    return columns
      .map((c) => {
        const raw = item[c.dataIndex];
        const val = c.render ? c.render(raw, item) : raw ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  const csvContent = "\uFEFF" + [header, ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
