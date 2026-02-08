import React, { useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  HStack,
  Badge
} from '@chakra-ui/react';

const NODE_WIDTH = 240;
const HORIZONTAL_GAP = 50;
const VERTICAL_GAP = 120;

const nodeColors = {
  overallGoal: { bg: '#E9D8FD', border: '#805AD5', badge: 'purple' },
  goal: { bg: '#FED7D7', border: '#E53E3E', badge: 'red' },
  subgoal: { bg: '#C6F6D5', border: '#38A169', badge: 'green' },
  req1: { bg: '#BEE3F8', border: '#3182CE', badge: 'blue' },
  req2: { bg: '#B2F5EA', border: '#319795', badge: 'teal' },
  req3: { bg: '#C4F1F9', border: '#00B5D8', badge: 'cyan' }
};

const CustomNode = ({ data, id }) => {
  const colors = nodeColors[data.nodeType] || nodeColors.overallGoal;
  const isExpanded = data.expandedNodes?.has(id);

  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '8px 12px',
        minWidth: `${NODE_WIDTH}px`,
        maxWidth: isExpanded ? '400px' : `${NODE_WIDTH + 40}px`,
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Handle in alto per ricevere connessioni dai genitori */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: colors.border, width: 8, height: 8 }}
      />

      <div style={{
        display: 'inline-block',
        background: colors.border,
        color: 'white',
        borderRadius: '10px',
        padding: '1px 8px',
        fontSize: '10px',
        fontWeight: 'bold',
        marginBottom: '4px'
      }}>
        {data.label}
      </div>
      <div style={{
        fontWeight: '600',
        lineHeight: '1.3',
        overflow: isExpanded ? 'visible' : 'hidden',
        display: isExpanded ? 'block' : '-webkit-box',
        WebkitLineClamp: isExpanded ? 'unset' : 3,
        WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word'
      }}>
        {data.title}
      </div>

      {/* Handle in basso per connettere ai figli */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: colors.border, width: 8, height: 8 }}
      />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const buildTreeLayout = (structure) => {
  if (!structure) return { nodes: [], edges: [] };

  const nodes = [];
  const edges = [];
  const goals = structure.goals || [];

  // Bottom-up width calculation
  const getReqBlockWidth = (reqs) => {
    if (!reqs || reqs.length === 0) return NODE_WIDTH;
    return reqs.length * (NODE_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP;
  };

  const getSubgoalBlockWidth = (subgoals) => {
    if (!subgoals || subgoals.length === 0) return NODE_WIDTH;
    let w = 0;
    subgoals.forEach((sg, i) => {
      w += Math.max(getReqBlockWidth(sg.informationRequirements || []), NODE_WIDTH);
      if (i < subgoals.length - 1) w += HORIZONTAL_GAP;
    });
    return w;
  };

  const getGoalBlockWidth = (goal) => {
    return Math.max(getSubgoalBlockWidth(goal.subgoals || []), NODE_WIDTH);
  };

  let totalWidth = 0;
  goals.forEach((g, i) => {
    totalWidth += getGoalBlockWidth(g);
    if (i < goals.length - 1) totalWidth += HORIZONTAL_GAP * 2;
  });
  totalWidth = Math.max(totalWidth, NODE_WIDTH);

  // Overall Goal
  nodes.push({
    id: 'overall-goal',
    type: 'custom',
    position: { x: totalWidth / 2 - NODE_WIDTH / 2, y: 0 },
    data: {
      label: 'Overall Goal',
      title: structure.overallGoal?.title || 'Overall Goal',
      nodeType: 'overallGoal'
    },
    draggable: false
  });

  let goalX = 0;

  goals.forEach((goal, gi) => {
    const goalId = `goal-${goal._id}`;
    const goalBlockW = getGoalBlockWidth(goal);
    const goalCenterX = goalX + goalBlockW / 2;

    nodes.push({
      id: goalId,
      type: 'custom',
      position: { x: goalCenterX - NODE_WIDTH / 2, y: VERTICAL_GAP },
      data: { label: `Goal ${gi + 1}`, title: goal.title, nodeType: 'goal' },
      draggable: false
    });

    edges.push({
      id: `e-og-${goalId}`,
      source: 'overall-goal',
      target: goalId,
      style: { stroke: '#805AD5', strokeWidth: 2 }
    });

    const subgoals = goal.subgoals || [];
    let sgX = goalX;

    subgoals.forEach((sg, si) => {
      const sgId = `sg-${sg._id}`;
      const reqs = sg.informationRequirements || [];
      const sgBlockW = Math.max(getReqBlockWidth(reqs), NODE_WIDTH);
      const sgCenterX = sgX + sgBlockW / 2;

      nodes.push({
        id: sgId,
        type: 'custom',
        position: { x: sgCenterX - NODE_WIDTH / 2, y: VERTICAL_GAP * 2 },
        data: { label: `Subgoal ${gi + 1}.${si + 1}`, title: sg.title, nodeType: 'subgoal' },
        draggable: false
      });

      edges.push({
        id: `e-${goalId}-${sgId}`,
        source: goalId,
        target: sgId,
        style: { stroke: '#E53E3E', strokeWidth: 2 }
      });

      reqs.forEach((req, ri) => {
        const reqId = `req-${req._id}`;
        const reqX = sgX + ri * (NODE_WIDTH + HORIZONTAL_GAP);
        const levelMap = { 1: 'req1', 2: 'req2', 3: 'req3' };
        const levelLabels = { 1: 'L1: Acquire', 2: 'L2: Make Meaning', 3: 'L3: Transfer' };

        nodes.push({
          id: reqId,
          type: 'custom',
          position: { x: reqX, y: VERTICAL_GAP * 3 },
          data: {
            label: levelLabels[req.level] || 'Requirement',
            title: req.title,
            nodeType: levelMap[req.level] || 'req1'
          },
          draggable: false
        });

        edges.push({
          id: `e-${sgId}-${reqId}`,
          source: sgId,
          target: reqId,
          style: { stroke: '#38A169', strokeWidth: 2 }
        });
      });

      sgX += sgBlockW + HORIZONTAL_GAP;
    });

    goalX += goalBlockW + HORIZONTAL_GAP * 2;
  });

  return { nodes, edges };
};

// Inner component that remounts when structure changes (via key)
const TreeFlowRenderer = ({ nodes, edges, onNodeClick }) => {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={true}
      onNodeClick={(event, node) => onNodeClick(node.id)}
      fitView
      fitViewOptions={{ padding: 0.4 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e2e8f0" gap={20} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(node) => {
          const type = node.data?.nodeType;
          return nodeColors[type]?.border || '#805AD5';
        }}
        maskColor="rgba(0,0,0,0.1)"
      />
    </ReactFlow>
  );
};

const GDTATreeView = ({ isOpen, onClose, structure }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const handleNodeClick = useCallback((nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const { nodes, edges } = useMemo(
    () => {
      const result = buildTreeLayout(structure);
      console.log('GDTATreeView - Building layout:', {
        structure,
        nodesCount: result.nodes.length,
        edgesCount: result.edges.length,
        nodes: result.nodes
      });
      // Add expandedNodes and onNodeClick to each node's data
      result.nodes = result.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          expandedNodes,
          onNodeClick: handleNodeClick
        }
      }));
      return result;
    },
    [structure, expandedNodes, handleNodeClick]
  );

  // Use structure ID + goals count as key to force remount on changes
  const flowKey = structure
    ? `${structure._id}-${(structure.goals || []).length}-${JSON.stringify(structure.goals || []).length}`
    : 'empty';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay />
      <ModalContent m={4} borderRadius="lg" maxH="95vh">
        <ModalHeader py={3}>
          <HStack spacing={3}>
            <Text>GDTA Tree View</Text>
            <Badge colorScheme="purple">{structure?.title}</Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0} display="flex" flexDirection="column" overflow="hidden" h="calc(95vh - 120px)">
          <Box flex="1" minH="0" position="relative" h="100%">
            {nodes.length > 0 ? (
              <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} key={flowKey}>
                <TreeFlowRenderer nodes={nodes} edges={edges} onNodeClick={handleNodeClick} />
              </div>
            ) : (
              <Box textAlign="center" py={20}>
                <Text color="gray.500" fontSize="lg">
                  No GDTA elements to display. Add goals, subgoals, and requirements first.
                </Text>
              </Box>
            )}
          </Box>

          <HStack spacing={4} p={3} justify="center" flexWrap="wrap" flexShrink={0} borderTop="1px" borderColor="gray.200">
            {Object.entries({
              'Overall Goal': 'overallGoal',
              'Goal': 'goal',
              'Subgoal': 'subgoal',
              'L1: Acquire': 'req1',
              'L2: Make Meaning': 'req2',
              'L3: Transfer': 'req3'
            }).map(([label, type]) => (
              <HStack key={type} spacing={1}>
                <Box w={3} h={3} borderRadius="sm" bg={nodeColors[type].border} />
                <Text fontSize="xs" color="gray.600">{label}</Text>
              </HStack>
            ))}
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GDTATreeView;
