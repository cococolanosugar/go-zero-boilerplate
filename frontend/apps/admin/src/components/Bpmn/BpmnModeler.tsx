import React, { useEffect, useRef, useState } from 'react';
import { Space, Button, Tooltip, Card, App as AntdApp } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  UndoOutlined,
  RedoOutlined,
  DownloadOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
// @ts-ignore
import Modeler from 'bpmn-js/lib/Modeler';
import './bpmn.css';

export interface BpmnModelerProps {
  xml?: string;
  onChange?: (xml: string) => void;
  onSelectElement?: (element: any, modeler: any) => void;
  style?: React.CSSProperties;
  height?: number | string;
}

const defaultXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" targetNamespace="http://bpmn.io/schema/bpmn">
  <process id="Process_ITSM" name="服务审批流" isExecutable="true">
    <startEvent id="StartEvent_1" name="提报申请">
      <outgoing>Flow_1</outgoing>
    </startEvent>
    <sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Activity_Audit" />
    <userTask id="Activity_Audit" name="部门主管审批">
      <incoming>Flow_1</incoming>
      <outgoing>Flow_2</outgoing>
    </userTask>
    <sequenceFlow id="Flow_2" sourceRef="Activity_Audit" targetRef="EndEvent_1" />
    <endEvent id="EndEvent_1" name="归档完成">
      <incoming>Flow_2</incoming>
    </endEvent>
  </process>
</definitions>`;

export const BpmnModeler: React.FC<BpmnModelerProps> = ({
  xml = defaultXml,
  onChange,
  onSelectElement,
  style,
  height = 600,
}) => {
  const { message } = AntdApp.useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;

    const modeler = new Modeler({
      container: containerRef.current,
      keyboard: {
        bindTo: document,
      },
    });
    modelerRef.current = modeler;

    const initialXml = xml || defaultXml;
    modeler.importXML(initialXml).then(() => {
      const canvas: any = modeler.get('canvas');
      canvas?.zoom('fit-viewport');
    }).catch((err: any) => {
      console.error('[BpmnModeler] Failed to import XML', err);
    });

    // 监听模型变动
    modeler.on('commandStack.changed', async () => {
      try {
        const { xml: updatedXml } = await modeler.saveXML({ format: true });
        if (updatedXml) {
          onChange?.(updatedXml);
        }
      } catch (err) {
        console.error('[BpmnModeler] Failed to export XML on change', err);
      }
    });

    // 监听节点选中
    modeler.on('selection.changed', (e: any) => {
      const selection = e.newSelection;
      if (selection && selection.length > 0) {
        onSelectElement?.(selection[0], modeler);
      } else {
        onSelectElement?.(null, modeler);
      }
    });

    return () => {
      modeler.destroy();
      modelerRef.current = null;
    };
  }, []);

  // 外部 XML 变更同步
  useEffect(() => {
    if (modelerRef.current && xml) {
      modelerRef.current.saveXML({ format: true }).then(({ xml: curXml }: any) => {
        if (curXml !== xml) {
          modelerRef.current.importXML(xml).catch(() => {});
        }
      });
    }
  }, [xml]);

  const handleZoom = (step: number) => {
    if (!modelerRef.current) return;
    const canvas: any = modelerRef.current.get('canvas');
    const newScale = Math.max(0.2, scale + step);
    canvas?.zoom(newScale);
    setScale(newScale);
  };

  const handleFit = () => {
    if (!modelerRef.current) return;
    const canvas: any = modelerRef.current.get('canvas');
    canvas?.zoom('fit-viewport');
    setScale(1);
  };

  const handleUndo = () => {
    if (!modelerRef.current) return;
    modelerRef.current.get('commandStack').undo();
  };

  const handleRedo = () => {
    if (!modelerRef.current) return;
    modelerRef.current.get('commandStack').redo();
  };

  const handleExportXml = async () => {
    if (!modelerRef.current) return;
    try {
      const { xml: currentXml } = await modelerRef.current.saveXML({ format: true });
      const blob = new Blob([currentXml], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'process.bpmn20.xml';
      link.click();
      URL.revokeObjectURL(url);
      message.success('BPMN 流程 XML 导出成功');
    } catch (err) {
      message.error('导出流程 XML 失败');
    }
  };

  const handleExportSvg = async () => {
    if (!modelerRef.current) return;
    try {
      const { svg } = await modelerRef.current.saveSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'process.svg';
      link.click();
      URL.revokeObjectURL(url);
      message.success('流程矢量图 SVG 导出成功');
    } catch (err) {
      message.error('导出 SVG 失败');
    }
  };

  return (
    <Card
      variant="borderless"
      styles={{ body: { padding: 0 } }}
      style={{ overflow: 'hidden', ...style }}
    >
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Tooltip title="放大">
            <Button size="small" icon={<ZoomInOutlined />} onClick={() => handleZoom(0.2)} />
          </Tooltip>
          <Tooltip title="缩小">
            <Button size="small" icon={<ZoomOutOutlined />} onClick={() => handleZoom(-0.2)} />
          </Tooltip>
          <Tooltip title="适应居中">
            <Button size="small" icon={<FullscreenOutlined />} onClick={handleFit} />
          </Tooltip>
          <Tooltip title="撤销 (Ctrl+Z)">
            <Button size="small" icon={<UndoOutlined />} onClick={handleUndo} />
          </Tooltip>
          <Tooltip title="重做 (Ctrl+Y)">
            <Button size="small" icon={<RedoOutlined />} onClick={handleRedo} />
          </Tooltip>
        </Space>
        <Space>
          <Button size="small" icon={<DownloadOutlined />} onClick={handleExportXml}>
            导出 XML
          </Button>
          <Button size="small" icon={<FileImageOutlined />} onClick={handleExportSvg}>
            导出 SVG
          </Button>
        </Space>
      </div>

      <div className="bpmn-container" style={{ height }}>
        <div ref={containerRef} className="bpmn-canvas" />
      </div>
    </Card>
  );
};
