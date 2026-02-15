import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  workflowName: 'Untitled Workflow',
  isRunning: false,
  output: null,
  logs: [],
  toasts: [],
  deploymentModalOpen: false,
  deploymentStep: 0,
  deployedEndpoint: null,

  setWorkflowName: (name) => set({ workflowName: name }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        { ...connection, animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
        get().edges
      ),
    });
  },

  addNode: (node) => {
    const newNode = {
      id: `${node.type}-${Date.now()}`,
      type: 'workflow',
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: {
        label: node.label,
        icon: node.icon,
        category: node.category,
        status: 'idle',
        config: node.config || {},
      },
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  selectNode: (node) => set({ selectedNode: node }),

  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config: { ...node.data.config, ...config } } }
          : node
      ),
      selectedNode: get().selectedNode?.id === nodeId
        ? { ...get().selectedNode, data: { ...get().selectedNode.data, config: { ...get().selectedNode.data.config, ...config } } }
        : get().selectedNode,
    });
  },

  deleteSelected: () => {
    const { nodes, edges, selectedNode } = get();
    if (!selectedNode) return;
    
    set({
      nodes: nodes.filter((n) => n.id !== selectedNode.id),
      edges: edges.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      ),
      selectedNode: null,
    });
  },

  loadTemplate: (template) => {
    const templateNodes = {
      invoice: [
        { id: 'pdf-1', type: 'workflow', position: { x: 50, y: 100 }, data: { label: 'PDF Input', icon: '📄', category: 'input', status: 'idle', config: { source: 'upload' } } },
        { id: 'ocr-1', type: 'workflow', position: { x: 280, y: 100 }, data: { label: 'OCR Processing', icon: '🔍', category: 'process', status: 'idle', config: { engine: 'tesseract' } } },
        { id: 'extract-1', type: 'workflow', position: { x: 510, y: 100 }, data: { label: 'AI Extract', icon: '🤖', category: 'process', status: 'idle', config: { fields: ['invoice_number', 'date', 'vendor', 'total', 'items'] } } },
        { id: 'json-1', type: 'workflow', position: { x: 740, y: 100 }, data: { label: 'JSON Output', icon: '📋', category: 'output', status: 'idle', config: { format: 'json' } } },
      ],
      contract: [
        { id: 'pdf-1', type: 'workflow', position: { x: 50, y: 100 }, data: { label: 'PDF Input', icon: '📄', category: 'input', status: 'idle', config: { source: 'upload' } } },
        { id: 'parse-1', type: 'workflow', position: { x: 280, y: 100 }, data: { label: 'Parser', icon: '📝', category: 'process', status: 'idle', config: { mode: 'text' } } },
        { id: 'regex-1', type: 'workflow', position: { x: 510, y: 100 }, data: { label: 'Regex Extract', icon: '🔤', category: 'process', status: 'idle', config: { patterns: ['parties', 'dates', 'terms'] } } },
        { id: 'validate-1', type: 'workflow', position: { x: 740, y: 100 }, data: { label: 'Validate', icon: '✅', category: 'transform', status: 'idle', config: { rules: ['required_fields'] } } },
        { id: 'json-1', type: 'workflow', position: { x: 970, y: 100 }, data: { label: 'JSON Output', icon: '📋', category: 'output', status: 'idle', config: { format: 'json' } } },
      ],
      medical: [
        { id: 'img-1', type: 'workflow', position: { x: 50, y: 100 }, data: { label: 'Image Input', icon: '🖼️', category: 'input', status: 'idle', config: { source: 'upload' } } },
        { id: 'ocr-1', type: 'workflow', position: { x: 280, y: 100 }, data: { label: 'OCR Processing', icon: '🔍', category: 'process', status: 'idle', config: { engine: 'tesseract' } } },
        { id: 'extract-1', type: 'workflow', position: { x: 510, y: 100 }, data: { label: 'AI Extract', icon: '🤖', category: 'process', status: 'idle', config: { fields: ['patient_name', 'date_of_birth', 'diagnoses', 'medications'] } } },
        { id: 'table-1', type: 'workflow', position: { x: 740, y: 100 }, data: { label: 'Table Extract', icon: '📊', category: 'process', status: 'idle', config: { mode: 'structured' } } },
        { id: 'json-1', type: 'workflow', position: { x: 970, y: 100 }, data: { label: 'JSON Output', icon: '📋', category: 'output', status: 'idle', config: { format: 'json' } } },
      ],
      receipt: [
        { id: 'img-1', type: 'workflow', position: { x: 50, y: 100 }, data: { label: 'Image Input', icon: '🖼️', category: 'input', status: 'idle', config: { source: 'upload' } } },
        { id: 'ocr-1', type: 'workflow', position: { x: 280, y: 100 }, data: { label: 'OCR Processing', icon: '🔍', category: 'process', status: 'idle', config: { engine: 'tesseract' } } },
        { id: 'extract-1', type: 'workflow', position: { x: 510, y: 100 }, data: { label: 'AI Extract', icon: '🤖', category: 'process', status: 'idle', config: { fields: ['store', 'date', 'items', 'total', 'tax'] } } },
        { id: 'csv-1', type: 'workflow', position: { x: 740, y: 100 }, data: { label: 'CSV Output', icon: '📊', category: 'output', status: 'idle', config: { format: 'csv' } } },
      ],
    };

    const templateEdges = {
      invoice: [
        { id: 'e1', source: 'pdf-1', target: 'ocr-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
        { id: 'e2', source: 'ocr-1', target: 'extract-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
        { id: 'e3', source: 'extract-1', target: 'json-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
      ],
      contract: [
        { id: 'e1', source: 'pdf-1', target: 'parse-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
        { id: 'e2', source: 'parse-1', target: 'regex-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
        { id: 'e3', source: 'regex-1', target: 'validate-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
        { id: 'e4', source: 'validate-1', target: 'json-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
      ],
      medical: [
        { id: 'e1', source: 'img-1', target: 'ocr-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
        { id: 'e2', source: 'ocr-1', target: 'extract-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
        { id: 'e3', source: 'extract-1', target: 'table-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
        { id: 'e4', source: 'table-1', target: 'json-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
      ],
      receipt: [
        { id: 'e1', source: 'img-1', target: 'ocr-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
        { id: 'e2', source: 'ocr-1', target: 'extract-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
        { id: 'e3', source: 'extract-1', target: 'csv-1', animated: true, style: { stroke: '#6366F1', strokeWidth: 2 } },
      ],
    };

    const nodes = templateNodes[template] || [];
    const edges = templateEdges[template] || [];
    
    set({ nodes, edges, selectedNode: null });
    get().addToast('success', 'Template Loaded', `${template.charAt(0).toUpperCase() + template.slice(1)} template has been loaded`);
  },

  runWorkflow: async () => {
    set({ isRunning: true, output: null, logs: [] });
    get().addToast('info', 'Running Workflow', 'Processing document...');

    const newLogs = [
      { type: 'info', message: 'Starting workflow execution...' },
      { type: 'info', message: 'Loading document...' },
    ];
    set({ logs: newLogs });

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 800));
    newLogs.push({ type: 'success', message: 'Document loaded successfully' });
    set({ logs: [...newLogs] });

    await new Promise((resolve) => setTimeout(resolve, 600));
    newLogs.push({ type: 'info', message: 'Processing with OCR engine...' });
    set({ logs: [...newLogs] });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    newLogs.push({ type: 'success', message: 'OCR completed: 98% accuracy' });
    set({ logs: [...newLogs] });

    await new Promise((resolve) => setTimeout(resolve, 700));
    newLogs.push({ type: 'info', message: 'Extracting fields with AI...' });
    set({ logs: [...newLogs] });

    await new Promise((resolve) => setTimeout(resolve, 900));
    newLogs.push({ type: 'success', message: 'Fields extracted successfully' });
    set({ logs: [...newLogs] });

    // Generate sample output
    const sampleOutput = {
      status: 'success',
      document_type: 'invoice',
      extracted_data: {
        invoice_number: 'INV-2024-001234',
        date: '2024-01-15',
        vendor: {
          name: 'Acme Corporation',
          address: '123 Business Ave, Suite 100, San Francisco, CA 94102',
          email: 'billing@acmecorp.com',
        },
        total: 2547.50,
        currency: 'USD',
        items: [
          { description: 'Professional Services', quantity: 40, unit_price: 50.00, total: 2000.00 },
          { description: 'Software License', quantity: 1, unit_price: 299.00, total: 299.00 },
          { description: 'Support Package', quantity: 1, unit_price: 248.50, total: 248.50 },
        ],
        tax: 254.75,
      },
      confidence: 0.97,
      processing_time: '3.2s',
    };

    newLogs.push({ type: 'success', message: 'Workflow completed successfully!' });
    set({ logs: [...newLogs], output: sampleOutput, isRunning: false });
    get().addToast('success', 'Workflow Complete', 'Document extracted successfully');
  },

  openDeploymentModal: () => set({ deploymentModalOpen: true, deploymentStep: 0, deployedEndpoint: null }),
  closeDeploymentModal: () => set({ deploymentModalOpen: false }),

  deployWorkflow: async () => {
    const steps = [
      { title: 'Preparing bundle', description: 'Compiling workflow logic' },
      { title: 'Building container', description: 'Creating Docker image' },
      { title: 'Deploying', description: 'Uploading to cloud functions' },
      { title: 'Configuring', description: 'Setting up endpoints and scaling' },
    ];

    for (let i = 0; i < steps.length; i++) {
      set({ deploymentStep: i });
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    const endpoint = `https://us-central1-langextract.cloudfunctions.net/wf-${Date.now()}`;
    set({ deployedEndpoint: endpoint });
    get().addToast('success', 'Deployment Complete', 'Your workflow is now live!');
  },

  addToast: (type, title, message) => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, type, title, message }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export default useStore;
