import { useState, useCallback, useRef } from 'react';
import { ReactFlow, Background, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  FileText, Scan, Bot, Play, Upload, X, CheckCircle, AlertCircle, Info, AlertTriangle
} from 'lucide-react';
import useStore from './store';

// Simplified node types - only core nodes
const nodeTypes = {
  input: [
    { type: 'pdf', label: 'PDF', icon: 'pdf', category: 'input', config: { source: 'upload' } },
    { type: 'image', label: 'Image', icon: 'img', category: 'input', config: { source: 'upload' } },
  ],
  process: [
    { type: 'ocr', label: 'OCR', icon: 'ocr', category: 'process', config: { engine: 'tesseract' } },
    { type: 'ai', label: 'AI Extract', icon: 'ai', category: 'process', config: { model: 'gpt-4' } },
  ],
  output: [
    { type: 'json', label: 'JSON', icon: 'json', category: 'output', config: { format: 'json' } },
    { type: 'csv', label: 'CSV', icon: 'csv', category: 'output', config: { format: 'csv' } },
  ],
};

// Custom Workflow Node Component - simplified
function WorkflowNode({ data, selected }) {
  const getCategoryColor = (category) => {
    switch (category) {
      case 'input': return { bg: 'rgba(34, 211, 238, 0.15)', color: '#22D3EE' };
      case 'process': return { bg: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' };
      case 'output': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' };
      default: return { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748B' };
    }
  };

  const getNodeIcon = (iconKey) => {
    const icons = { pdf: '📄', img: '🖼️', ocr: '🔍', ai: '🤖', json: '📋', csv: '📊' };
    return icons[iconKey] || '📄';
  };

  const colors = getCategoryColor(data.category);

  return (
    <div className={`workflow-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="workflow-node-header">
        <div className="workflow-node-icon" style={{ background: colors.bg, color: colors.color }}>
          {getNodeIcon(data.icon)}
        </div>
        <span className="workflow-node-title">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypesMap = { workflow: WorkflowNode };

// Header - Simplified
function Header() {
  const { workflowName, setWorkflowName, runWorkflow, isRunning, addToast } = useStore();

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon"><Scan size={18} /></div>
          <span>LangExtract Lite</span>
        </div>
        <input
          type="text"
          className="workflow-name"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
        />
      </div>
      <div className="header-right">
        <button className="btn btn-primary" onClick={runWorkflow} disabled={isRunning}>
          <Play size={14} />
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>
    </header>
  );
}

// Sidebar - Simplified (no templates)
function Sidebar() {
  const { addNode } = useStore();
  const dragItem = useRef(null);

  const handleDragStart = (e, node) => {
    dragItem.current = node;
    e.dataTransfer.setData('application/json', JSON.stringify(node));
    e.dataTransfer.effectAllowed = 'move';
  };

  const getIconComponent = (iconKey) => {
    const icons = { pdf: <FileText size={14} />, img: <FileText size={14} />, ocr: <Scan size={14} />, ai: <Bot size={14} />, json: <FileText size={14} />, csv: <FileText size={14} /> };
    return icons[iconKey] || <FileText size={14} />;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Input</div>
          <div className="node-palette">
            {nodeTypes.input.map((node) => (
              <div key={node.type} className="palette-node" draggable onDragStart={(e) => handleDragStart(e, node)} onClick={() => addNode(node)}>
                <div className="palette-node-icon input">{getIconComponent(node.icon)}</div>
                <span className="palette-node-name">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">Process</div>
          <div className="node-palette">
            {nodeTypes.process.map((node) => (
              <div key={node.type} className="palette-node" draggable onDragStart={(e) => handleDragStart(e, node)} onClick={() => addNode(node)}>
                <div className="palette-node-icon process">{getIconComponent(node.icon)}</div>
                <span className="palette-node-name">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">Output</div>
          <div className="node-palette">
            {nodeTypes.output.map((node) => (
              <div key={node.type} className="palette-node" draggable onDragStart={(e) => handleDragStart(e, node)} onClick={() => addNode(node)}>
                <div className="palette-node-icon output">{getIconComponent(node.icon)}</div>
                <span className="palette-node-name">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

// Canvas
function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode } = useStore();

  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/json');
    if (!type) return;
    const nodeData = JSON.parse(type);
    useStore.getState().addNode(nodeData);
  }, []);

  return (
    <div className="canvas-container" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node)} onPaneClick={() => selectNode(null)}
        nodeTypes={nodeTypesMap} fitView deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background color="#2D2D3A" gap={20} size={1} />
      </ReactFlow>
      {nodes.length === 0 && (
        <div className="empty-canvas-hint">
          <div className="empty-canvas-icon">📄</div>
          <div className="empty-canvas-title">Quick Extract</div>
          <div className="empty-canvas-text">Drag nodes to build a simple extraction workflow</div>
        </div>
      )}
    </div>
  );
}

// Bottom Panel - Output only
function BottomPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('output');
  const { output, logs } = useStore();

  return (
    <div className={`bottom-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="bottom-panel-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="bottom-panel-tabs">
          <button className={`bottom-panel-tab ${activeTab === 'test' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setActiveTab('test'); }}>Test</button>
          <button className={`bottom-panel-tab ${activeTab === 'output' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setActiveTab('output'); }}>Output</button>
        </div>
      </div>
      {!collapsed && (
        <div className="bottom-panel-content">
          {activeTab === 'test' && (
            <div className="test-input-area">
              <div className="upload-zone">
                <Upload size={32} className="upload-icon" />
                <span className="upload-text">Drop document here</span>
              </div>
            </div>
          )}
          {activeTab === 'output' && (
            <div className="output-area">
              {output ? <pre className="output-json">{JSON.stringify(output, null, 2)}</pre> : (
                <div className="no-selection">
                  <div className="no-selection-title">No Output</div>
                  <div className="no-selection-text">Run workflow to see results</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Toast
function ToastContainer() {
  const { toasts, removeToast } = useStore();
  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} color="#10B981" />;
      case 'error': return <AlertCircle size={18} color="#EF4444" />;
      case 'info': return <Info size={18} color="#22D3EE" />;
      default: return <Info size={18} color="#94A3B8" />;
    }
  };
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <div className="toast-icon">{getIcon(toast.type)}</div>
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-message">{toast.message}</div>
          </div>
          <button onClick={() => removeToast(toast.id)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// Main App
function App() {
  return (
    <div className="app-container">
      <Header />
      <div className="main-layout">
        <Sidebar />
        <Canvas />
      </div>
      <BottomPanel />
      <ToastContainer />
    </div>
  );
}

export default App;
