import React, { useEffect, useRef } from 'react';
import { Card, Tooltip, Badge } from 'antd';
// @ts-ignore
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import './bpmn.css';

export interface BpmnViewerProps {
  xml: string;
  completedNodeIds?: string[];
  activeNodeIds?: string[];
  rejectedNodeIds?: string[];
  logs?: Array<{
    nodeId: string;
    nodeName: string;
    operatorName: string;
    actionType: string;
    opinion?: string;
    createTime: string;
  }>;
  height?: number | string;
  style?: React.CSSProperties;
}

export const BpmnViewer: React.FC<BpmnViewerProps> = ({
  xml,
  completedNodeIds = [],
  activeNodeIds = [],
  rejectedNodeIds = [],
  logs = [],
  height = 400,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !xml) return;

    const viewer = new NavigatedViewer({
      container: containerRef.current,
    });
    viewerRef.current = viewer;

    viewer.importXML(xml).then(() => {
      const canvas: any = viewer.get('canvas');
      const overlays: any = viewer.get('overlays');

      canvas?.zoom('fit-viewport');

      // 1. 高亮已完成节点
      completedNodeIds.forEach((nodeId) => {
        try {
          canvas.addMarker(nodeId, 'node-completed');
        } catch (_) {}
      });

      // 2. 高亮办理中节点
      activeNodeIds.forEach((nodeId) => {
        try {
          canvas.addMarker(nodeId, 'node-active');
        } catch (_) {}
      });

      // 3. 高亮驳回/终止节点
      rejectedNodeIds.forEach((nodeId) => {
        try {
          canvas.addMarker(nodeId, 'node-rejected');
        } catch (_) {}
      });

      // 4. 为节点挂载流转日志气泡 (Overlays)
      const logsByNode = new Map<string, typeof logs>();
      logs.forEach((log) => {
        if (!logsByNode.has(log.nodeId)) {
          logsByNode.set(log.nodeId, []);
        }
        logsByNode.get(log.nodeId)!.push(log);
      });

      logsByNode.forEach((nodeLogs, nodeId) => {
        const latestLog = nodeLogs[nodeLogs.length - 1];
        const overlayDom = document.createElement('div');
        overlayDom.style.pointerEvents = 'auto';
        overlayDom.style.cursor = 'pointer';
        overlayDom.style.transform = 'translate(-50%, -100%)';
        overlayDom.style.padding = '2px 6px';
        overlayDom.style.backgroundColor = '#1677ff';
        overlayDom.style.color = '#fff';
        overlayDom.style.borderRadius = '10px';
        overlayDom.style.fontSize = '11px';
        overlayDom.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
        overlayDom.innerHTML = `<span>${latestLog.operatorName || '处理人'}: ${latestLog.actionType}</span>`;

        try {
          overlays.add(nodeId, 'badge', {
            position: {
              top: 0,
              left: 0,
            },
            html: overlayDom,
          });
        } catch (_) {}
      });
    }).catch((err: any) => {
      console.error('[BpmnViewer] Failed to import XML', err);
    });

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [xml, completedNodeIds, activeNodeIds, rejectedNodeIds, logs]);

  return (
    <Card
      variant="borderless"
      styles={{ body: { padding: 0 } }}
      style={{ overflow: 'hidden', ...style }}
    >
      <div className="bpmn-container" style={{ height }}>
        <div ref={containerRef} className="bpmn-canvas" />
      </div>
    </Card>
  );
};
