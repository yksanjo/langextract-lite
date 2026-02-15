import { useState, useCallback, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  FileText, Image, Link, Scan, FileSearch, Bot, Table, 
  Type, Filter, GitMerge, CheckCircle, FileOutput, Database,
  Webhook, Save, Play, Rocket, ChevronDown, Upload,
  X, Check, AlertCircle, Info, AlertTriangle
} from 'lucide-react';
import useStore from './store';

// Node types configuration
const nodeTypes = {
  input: [
    { type: 'pdf', label: 'PDF Input', icon: 'pdf', category: 'input', config: { source: 'upload' } },
    { type: 'image', label: 'Image Input', icon: 'img', category: 'input', config: { source: 'upload' } },
    { type: 'text', label: 'Text Input', icon: 'txt', category: 'input', config: { source: 'paste' } },
    { type: 'url', label: 'URL Input', icon: 'url', category: 'input', config: { source: 'url' } },
  ],
  process: [
    { type: 'ocr', label: 'OCR Processing', icon: 'ocr', category: 'process', config: { engine: 'tesseract' } },
    { type: 'parser', label: 'Parser', icon: 'parser', category: 'process', config: { mode: 'auto' } },
    { type: 'ai-extract', label: 'AI Extract', icon: 'ai', category: 'process', config: { model: 'gpt-4' } },
    { type: 'table', label: 'Table Extract', icon: 'table', category: 'process', config: { mode: 'structured' } },
    { type: 'regex', label: 'Regex Extract', icon: 'regex', category: 'process', config: { patterns: [] } },
  ],
  transform: [
    { type: 'filter', label: 'Filter', icon: 'filter', category: 'transform', config: { rules: [] } },
    { type: 'map', label: 'Map', icon: 'map', category: 'transform', config: { mappings: [] } },
    { type: 'merge', label: 'Merge', icon: 'merge', category: 'transform', config: { strategy: 'concat' } },
    { type: 'validate', label: 'Validate', icon: 'validate', category: 'transform', config: { rules: [] } },
  ],
  output: [
    { type: 'json', label: 'JSON Output', icon: 'json', category: 'output', config: { format: 'json' } },
    { type: 'csv', label: 'CSV Output', icon: 'csv', category: 'output', config: { format: 'csv' } },
    { type: 'database', label: 'Database', icon: 'db', category: 'output', config: { connection: '' } },
    { type: 'webhook', label: 'Webhook', icon: 'webhook', category: 'output', config: { url: '' } },
  ],
};

const templates = [
  { id: 'invoice', name: 'Invoices', icon: 'invoice' },
  { id: 'contract', name: 'Contracts', icon: 'contract' },
  { id: 'medical', name: 'Medical', icon: 'medical' },
  { id: 'receipt', name: 'Receipts', icon: 'receipt' },
  { id: 'custom', name: 'Custom', icon: 'custom' },
];

// Custom Workflow Node Component
function WorkflowNode({ data, selected }) {
  const getCategoryColor = (category) => {
    switch (category) {
      case 'input': return { bg: 'rgba(34, 211, 238, 0.15)', color: '#22D3EE' };
      case 'process': return { bg: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' };
      case 'transform': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' };
      case 'output': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' };
      default: return { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748B' };
    }
  };

  const getNodeIcon = (iconKey) => {
    const icons = {
      pdf: '📄', img: '🖼️', txt: '📝', url: '🔗',
      ocr: '🔍', parser: '📋', ai: '🤖', table: '📊', regex: '🔤',
      filter: '🔽', map: '🗺️', merge: '🔀', validate: '✅',
      json: '📋', csv: '📊', db: '🗄️', webhook: '🔗'
    };
    return icons[iconKey] || '📄';
  };

  const colors = getCategoryColor(data.category);

  return (
    <div className={`workflow-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="workflow-node-header">
        <div 
          className="workflow-node-icon" 
          style={{ background: colors.bg, color: colors.color }}
        >
          {getNodeIcon(data.icon)}
        </div>
        <span className="workflow-node-title">{data.label}</span>
        <div className={`workflow-node-status ${data.status || 'idle'}`} />
      </div>
      <div className="workflow-node-body">
        {data.category}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypesMap = { workflow: WorkflowNode };

// Header Component
function Header() {
  const { workflowName, setWorkflowName, runWorkflow, isRunning, openDeploymentModal, addToast } = useStore();

  const handleSave = () => {
    addToast('success', 'Saved', 'Workflow saved successfully');
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon">
            <Scan size={18} />
          </div>
          <span>LangExtract</span>
        </div>
        <input
          type="text"
          className="workflow-name"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
        />
      </div>
      <div className="header-right">
        <button className="btn btn-secondary" onClick={handleSave}>
          <Save size={14} />
          Save
        </button>
        <button 
          className="btn btn-primary" 
          onClick={runWorkflow}
          disabled={isRunning}
        >
          <Play size={14} />
          {isRunning ? 'Running...' : 'Run'}
        </button>
        <button className="btn btn-deploy" onClick={openDeploymentModal}>
          <Rocket size={14} />
          Deploy
        </button>
        <div className="avatar">JD</div>
      </div>
    </header>
  );
}

// Sidebar Component
function Sidebar() {
  const [activeTab, setActiveTab] = useState('nodes');
  const { addNode, loadTemplate } = useStore();
  const dragItem = useRef(null);

  const handleDragStart = (e, node) => {
    dragItem.current = node;
    e.dataTransfer.setData('application/json', JSON.stringify(node));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    dragItem.current = null;
  };

  const getIconComponent = (iconKey) => {
    const icons = {
      pdf: <FileText size={14} />,
      img: <Image size={14} />,
      txt: <FileText size={14} />,
      url: <Link size={14} />,
      ocr: <Scan size={14} />,
      parser: <FileSearch size={14} />,
      ai: <Bot size={14} />,
      table: <Table size={14} />,
      regex: <Type size={14} />,
      filter: <Filter size={14} />,
      map: <Table size={14} />,
      merge: <GitMerge size={14} />,
      validate: <CheckCircle size={14} />,
      json: <FileOutput size={14} />,
      csv: <Table size={14} />,
      db: <Database size={14} />,
      webhook: <Webhook size={14} />,
    };
    return icons[iconKey] || <FileText size={14} />;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        <button 
          className={`sidebar-tab ${activeTab === 'nodes' ? 'active' : ''}`}
          onClick={() => setActiveTab('nodes')}
        >
          Nodes
        </button>
        <button 
          className={`sidebar-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'nodes' && (
          <>
            <div className="sidebar-section">
              <div className="sidebar-section-title">Input Nodes</div>
              <div className="node-palette">
                {nodeTypes.input.map((node) => (
                  <div
                    key={node.type}
                    className="palette-node"
                    draggable
                    onDragStart={(e) => handleDragStart(e, node)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addNode(node)}
                  >
                    <div className="palette-node-icon input">
                      {getIconComponent(node.icon)}
                    </div>
                    <span className="palette-node-name">{node.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-section-title">Processing Nodes</div>
              <div className="node-palette">
                {nodeTypes.process.map((node) => (
                  <div
                    key={node.type}
                    className="palette-node"
                    draggable
                    onDragStart={(e) => handleDragStart(e, node)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addNode(node)}
                  >
                    <div className="palette-node-icon process">
                      {getIconComponent(node.icon)}
                    </div>
                    <span className="palette-node-name">{node.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-section-title">Transform Nodes</div>
              <div className="node-palette">
                {nodeTypes.transform.map((node) => (
                  <div
                    key={node.type}
                    className="palette-node"
                    draggable
                    onDragStart={(e) => handleDragStart(e, node)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addNode(node)}
                  >
                    <div className="palette-node-icon transform">
                      {getIconComponent(node.icon)}
                    </div>
                    <span className="palette-node-name">{node.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-section-title">Output Nodes</div>
              <div className="node-palette">
                {nodeTypes.output.map((node) => (
                  <div
                    key={node.type}
                    className="palette-node"
                    draggable
                    onDragStart={(e) => handleDragStart(e, node)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addNode(node)}
                  >
                    <div className="palette-node-icon output">
                      {getIconComponent(node.icon)}
                    </div>
                    <span className="palette-node-name">{node.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'templates' && (
          <>
            <div className="sidebar-section">
              <div className="sidebar-section-title">Template Marketplace</div>
              <div className="template-grid">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="template-card"
                    onClick={() => loadTemplate(template.id)}
                  >
                    <div className={`template-icon ${template.icon}`}>
                      {template.id === 'invoice' && <FileText size={18} />}
                      {template.id === 'contract' && <FileSearch size={18} />}
                      {template.id === 'medical' && <Scan size={18} />}
                      {template.id === 'receipt' && <Table size={18} />}
                      {template.id === 'custom' && <Bot size={18} />}
                    </div>
                    <span className="template-name">{template.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

// Properties Panel Component
function PropertiesPanel() {
  const { selectedNode, updateNodeConfig } = useStore();

  if (!selectedNode) {
    return (
      <aside className="properties-panel">
        <div className="properties-header">
          <span className="properties-title">Properties</span>
        </div>
        <div className="no-selection">
          <div className="no-selection-icon">⚙️</div>
          <div className="no-selection-title">No Node Selected</div>
          <div className="no-selection-text">
            Click on a node in the canvas to view and edit its properties.
          </div>
        </div>
      </aside>
    );
  }

  const { label, category, config } = selectedNode.data;

  const handleConfigChange = (key, value) => {
    updateNodeConfig(selectedNode.id, { [key]: value });
  };

  return (
    <aside className="properties-panel">
      <div className="properties-header">
        <span className="properties-title">Node Properties</span>
      </div>
      <div className="properties-content">
        <div className="property-group">
          <label className="property-label">Node Name</label>
          <input
            type="text"
            className="property-input"
            value={label}
            onChange={(e) => handleConfigChange('label', e.target.value)}
          />
        </div>

        <div className="property-group">
          <label className="property-label">Category</label>
          <input
            type="text"
            className="property-input"
            value={category}
            disabled
          />
        </div>

        <div className="property-group">
          <label className="property-label">Configuration</label>
          {category === 'input' && (
            <select
              className="property-select"
              value={config.source || 'upload'}
              onChange={(e) => handleConfigChange('source', e.target.value)}
            >
              <option value="upload">File Upload</option>
              <option value="url">URL</option>
              <option value="paste">Paste Text</option>
            </select>
          )}
          {category === 'process' && label === 'OCR Processing' && (
            <select
              className="property-select"
              value={config.engine || 'tesseract'}
              onChange={(e) => handleConfigChange('engine', e.target.value)}
            >
              <option value="tesseract">Tesseract</option>
              <option value="aws-textract">AWS Textract</option>
              <option value="google-vision">Google Vision</option>
            </select>
          )}
          {category === 'process' && label === 'AI Extract' && (
            <select
              className="property-select"
              value={config.model || 'gpt-4'}
              onChange={(e) => handleConfigChange('model', e.target.value)}
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5">GPT-3.5</option>
              <option value="claude">Claude</option>
            </select>
          )}
          {category === 'output' && (
            <select
              className="property-select"
              value={config.format || 'json'}
              onChange={(e) => handleConfigChange('format', e.target.value)}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="xml">XML</option>
            </select>
          )}
          {category === 'transform' && (
            <select
              className="property-select"
              value={config.strategy || 'concat'}
              onChange={(e) => handleConfigChange('strategy', e.target.value)}
            >
              <option value="concat">Concatenate</option>
              <option value="override">Override</option>
              <option value="merge">Merge Objects</option>
            </select>
          )}
        </div>

        <div className="property-group">
          <label className="property-label">Field Mappings</label>
          <div className="field-mappings">
            <div className="field-mapping">
              <span className="field-name">invoice_number</span>
              <span className="field-arrow">→</span>
              <span className="field-target">invoiceNumber</span>
            </div>
            <div className="field-mapping">
              <span className="field-name">date</span>
              <span className="field-arrow">→</span>
              <span className="field-target">invoiceDate</span>
            </div>
            <div className="field-mapping">
              <span className="field-name">total_amount</span>
              <span className="field-arrow">→</span>
              <span className="field-target">total</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Bottom Panel Component
function BottomPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('output');
  const { output, logs } = useStore();

  return (
    <div className={`bottom-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="bottom-panel-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="bottom-panel-tabs">
          <button 
            className={`bottom-panel-tab ${activeTab === 'test' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setActiveTab('test'); }}
          >
            Test Input
          </button>
          <button 
            className={`bottom-panel-tab ${activeTab === 'output' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setActiveTab('output'); }}
          >
            Output
          </button>
          <button 
            className={`bottom-panel-tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setActiveTab('logs'); }}
          >
            Logs
          </button>
        </div>
        <button className={`collapse-btn ${collapsed ? 'collapsed' : ''}`}>
          <ChevronDown size={16} />
        </button>
      </div>

      {!collapsed && (
        <div className="bottom-panel-content">
          {activeTab === 'test' && (
            <div className="test-input-area">
              <div className="upload-zone">
                <Upload size={32} className="upload-icon" />
                <span className="upload-text">
                  Drop a document here or click to upload
                </span>
                <span className="upload-text" style={{ marginTop: 8, fontSize: 11 }}>
                  Supports PDF, PNG, JPG, TIFF
                </span>
              </div>
            </div>
          )}

          {activeTab === 'output' && (
            <div className="output-area">
              {output ? (
                <pre className="output-json">
                  {JSON.stringify(output, null, 2)}
                </pre>
              ) : (
                <div className="no-selection">
                  <div className="no-selection-title">No Output Yet</div>
                  <div className="no-selection-text">
                    Run the workflow to see extraction results
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="logs-area">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className={`log-entry ${log.type}`}>
                    [{new Date().toLocaleTimeString()}] {log.message}
                  </div>
                ))
              ) : (
                <div className="no-selection">
                  <div className="no-selection-title">No Logs</div>
                  <div className="no-selection-text">
                    Run the workflow to see execution logs
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Toast Component
function ToastContainer() {
  const { toasts, removeToast } = useStore();

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} color="#10B981" />;
      case 'error': return <AlertCircle size={18} color="#EF4444" />;
      case 'warning': return <AlertTriangle size={18} color="#F59E0B" />;
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
          <button onClick={() => removeToast(toast.id)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Deployment Modal Component
function DeploymentModal() {
  const { deploymentModalOpen, closeDeploymentModal, deploymentStep, deployedEndpoint, deployWorkflow } = useStore();

  if (!deploymentModalOpen) return null;

  const steps = [
    { title: 'Preparing bundle', description: 'Compiling workflow logic' },
    { title: 'Building container', description: 'Creating Docker image' },
    { title: 'Deploying', description: 'Uploading to cloud functions' },
    { title: 'Configuring', description: 'Setting up endpoints and scaling' },
  ];

  const handleDeploy = async () => {
    if (deploymentStep === steps.length) {
      closeDeploymentModal();
      return;
    }
    await deployWorkflow();
  };

  return (
    <div className="modal-overlay" onClick={closeDeploymentModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Deploy to Cloud</span>
          <button className="modal-close" onClick={closeDeploymentModal}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="deployment-steps">
            {steps.map((step, index) => (
              <div key={index} className="deployment-step">
                <div className={`step-icon ${
                  index < deploymentStep ? 'completed' : 
                  index === deploymentStep ? 'processing' : 'pending'
                }`}>
                  {index < deploymentStep ? <Check size={14} /> : index + 1}
                </div>
                <div className="step-content">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
          {deployedEndpoint && (
            <div className="endpoint-display">
              Endpoint: {deployedEndpoint}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeDeploymentModal}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleDeploy}
            disabled={deploymentStep < steps.length && deploymentStep > 0}
          >
            {deploymentStep === steps.length ? 'Done' : deploymentStep > 0 ? 'Deploying...' : 'Deploy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Canvas Component
function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode } = useStore();

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/json');
      if (!type) return;

      const nodeData = JSON.parse(type);
      const { addNode } = useStore.getState();
      addNode(nodeData);
    },
    []
  );

  const onNodeClick = useCallback((event, node) => {
    selectNode(node);
  }, [selectNode]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div className="canvas-container" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypesMap}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background color="#2D2D3A" gap={20} size={1} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.data?.category) {
              case 'input': return '#22D3EE';
              case 'process': return '#6366F1';
              case 'transform': return '#F59E0B';
              case 'output': return '#10B981';
              default: return '#64748B';
            }
          }}
          style={{ background: '#16161D' }}
        />
      </ReactFlow>
      
      {nodes.length === 0 && (
        <div className="empty-canvas-hint">
          <div className="empty-canvas-icon">📄</div>
          <div className="empty-canvas-title">Start Building Your Workflow</div>
          <div className="empty-canvas-text">
            Drag nodes from the sidebar or select a template to get started
          </div>
        </div>
      )}
    </div>
  );
}

// Main App Component
function App() {
  return (
    <div className="app-container">
      <Header />
      <div className="main-layout">
        <Sidebar />
        <Canvas />
        <PropertiesPanel />
      </div>
      <BottomPanel />
      <ToastContainer />
      <DeploymentModal />
    </div>
  );
}

export default App;
