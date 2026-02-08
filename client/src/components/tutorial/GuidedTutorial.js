import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Text,
  Heading,
  VStack,
  HStack,
  CloseButton,
  Badge,
  Flex
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

const STORAGE_KEY = 'gdta-tutorial-completed';

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.6); }
  70% { box-shadow: 0 0 0 14px rgba(66, 153, 225, 0); }
  100% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0); }
`;

const TUTORIAL_STEPS = [
  // FASE 1: Costruzione GDTA
  {
    target: 'create-gdta',
    saveTarget: 'create-gdta-save',
    title: 'Step 1: Create GDTA Structure',
    description: 'Click "Create GDTA" to start. An example about Cognitive Biases will be pre-filled. You can edit it or use it as is. Click "Create" to save.',
    position: 'bottom',
    waitForClick: true,
    phase: 'gdta-creation'
  },
  {
    target: 'add-goal',
    saveTarget: 'add-goal-save',
    title: 'Step 2: Add a Goal',
    description: 'Goals are the main learning objectives. Click "Add Goal" — an example will be pre-filled. Review it and click "Add" to save.',
    position: 'bottom',
    waitForClick: true,
    phase: 'gdta-creation'
  },
  {
    target: 'add-subgoal',
    saveTarget: 'add-subgoal-save',
    title: 'Step 3: Add a Subgoal',
    description: 'Subgoals break down each Goal into specific objectives. Click "Add Subgoal" — an example will be pre-filled. Click "Add" to save.',
    position: 'bottom',
    waitForClick: true,
    phase: 'gdta-creation',
    instruction: 'First expand the Goal to see the "Add Subgoal" button'
  },
  {
    target: 'add-requirement',
    saveTarget: 'add-requirement-save',
    title: 'Step 4: Add Information Requirements',
    description: 'Add Information Requirements at 3 SA levels:\n\n• Level 1 – Acquire: Basic knowledge\n• Level 2 – Make Meaning: Understanding\n• Level 3 – Transfer: Application\n\nClick "Add Information Requirement" — a Level 1 example is pre-filled. Click "Add" to save.',
    position: 'right',
    waitForClick: true,
    phase: 'gdta-creation',
    instruction: 'First expand the Subgoal to see the "Add Information Requirement" button'
  },

  // FASE 2: Visualizzazione
  {
    target: 'view-tree',
    title: 'Step 5: Visualize Your GDTA',
    description: 'Click "View Tree" to see your entire GDTA structure as an interactive tree diagram. This helps verify the hierarchy is complete and well-organized.',
    position: 'bottom',
    waitForClick: true,
    phase: 'visualization'
  },

  // FASE 3: Suggerimento Contenuti
  {
    target: 'gdta-element',
    title: 'Step 6: Select a Goal',
    description: 'Click on the Goal element to select it. This will help you understand Semantic Scoring used for Goals and Subgoals.',
    position: 'right',
    waitForClick: true,
    phase: 'content-suggestion',
    elementType: 'goal'
  },
  {
    target: 'scoring-badge',
    title: 'Step 7: Understanding Semantic Scoring',
    description: 'SEMANTIC SCORING is used for Goals and Subgoals.\n\nIt measures how similar in meaning the microcontent is to your selected element using AI (SBERT). The higher the score, the more relevant the content.',
    position: 'right',
    waitForClick: false,
    phase: 'content-suggestion'
  },
  {
    target: 'requirement-element',
    title: 'Step 8: Select an Info Requirement',
    description: 'Now click on the Information Requirement (blue box) shown below.\n\nAfter clicking, notice how the scoring badge switches from Semantic to Hybrid.',
    position: 'right',
    waitForClick: true,
    phase: 'content-suggestion',
    elementType: 'requirement'
  },
  {
    target: 'scoring-badge',
    title: 'Step 9: Understanding Hybrid Scoring',
    description: 'HYBRID SCORING is used for Information Requirements.\n\nIt combines:\n• Semantic Score (topic similarity)\n• SA Level Match (Acquire/Make Meaning/Transfer alignment)\n\nThis ensures content matches both topic AND cognitive level.',
    position: 'right',
    waitForClick: false,
    phase: 'content-suggestion'
  },
  {
    target: 'gdta-element',
    title: 'Step 10: Select Any Element',
    description: 'Click on any GDTA element (goal, subgoal, or requirement) to get content suggestions for it.',
    position: 'right',
    waitForClick: true,
    phase: 'content-suggestion'
  },
  {
    target: 'suggest-content-button',
    title: 'Step 11: Get Suggestions',
    description: 'Click "Suggest Content" to receive AI-powered microcontent recommendations tailored to your selected element.',
    position: 'right',
    waitForClick: true,
    phase: 'content-suggestion'
  },
  {
    target: 'fslsm-filters',
    title: 'Step 12: Learning Styles (FSLSM)',
    description: 'Content is classified by learning style dimensions:\n\n• Processing: Active vs Reflective\n• Perception: Sensing vs Intuitive\n• Input: Visual vs Verbal\n• Understanding: Sequential vs Global\n\nUse these filters to match content to your learners\' preferences.',
    position: 'right',
    waitForClick: false,
    phase: 'content-suggestion'
  },
  {
    target: 'preview-button',
    saveTarget: 'preview-modal-close',
    title: 'Step 13: Preview Content',
    description: 'Click the eye icon on any microcontent card to preview it. After reviewing the content, close the preview modal to continue.',
    position: 'left',
    waitForClick: true,
    phase: 'content-suggestion'
  },

  // FASE 4: Creazione Corso
  {
    target: 'new-section',
    saveTarget: 'add-section-button',
    title: 'Step 14: Create Course Section',
    description: 'Click "New Section" to open the modal. Enter a section name (e.g., "Introduction to Cognitive Biases"), optionally map it to a GDTA element, then click "Add".',
    position: 'bottom',
    waitForClick: true,
    phase: 'course-creation'
  },
  {
    target: 'drag-drop-area',
    title: 'Step 15: Drag & Drop Content',
    description: 'Drag microcontents from the suggestions panel and drop them into your course sections!\n\nThis is how you build your final course. Congratulations, you\'ve completed the tutorial!',
    position: 'top',
    waitForClick: false,
    phase: 'course-creation'
  }
];

const GuidedTutorial = ({ onStepChange }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('target'); // 'target' or 'save'
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState(null);
  const [targetFound, setTargetFound] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const tooltipRef = useRef(null);
  const clickListenerRef = useRef(null);

  // Auto-start on first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsActive(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Report step changes to parent
  useEffect(() => {
    if (onStepChange) {
      onStepChange(isActive ? currentStep : null);
    }
  }, [isActive, currentStep, onStepChange]);

  // Position tooltip relative to target element
  const positionTooltip = useCallback(() => {
    if (!isActive || currentStep >= TUTORIAL_STEPS.length || !showTooltip) return;

    const step = TUTORIAL_STEPS[currentStep];
    const targetAttr = (currentPhase === 'save' && step.saveTarget) ? step.saveTarget : step.target;
    const target = document.querySelector(`[data-tutorial="${targetAttr}"]`);

    if (target) {
      setTargetFound(true);
      const rect = target.getBoundingClientRect();
      const tooltipW = 380;
      const tooltipH = tooltipRef.current?.offsetHeight || 280;
      const padding = 14;

      setHighlightRect({
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12
      });

      let top, left;

      switch (step.position) {
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2 - tooltipW / 2;
          break;
        case 'top':
          top = rect.top - tooltipH - padding;
          left = rect.left + rect.width / 2 - tooltipW / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipH / 2;
          left = rect.left - tooltipW - padding;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipH / 2;
          left = rect.right + padding;
          break;
        default:
          top = rect.bottom + padding;
          left = rect.left;
      }

      left = Math.max(12, Math.min(left, window.innerWidth - tooltipW - 12));
      top = Math.max(12, Math.min(top, window.innerHeight - tooltipH - 12));

      setTooltipPos({ top, left });
    } else {
      setTargetFound(false);
      setHighlightRect(null);
      setTooltipPos({
        top: window.innerHeight / 2 - 140,
        left: window.innerWidth / 2 - 190
      });
    }
  }, [isActive, currentStep, currentPhase, showTooltip]);

  // Attach click listener on current target to advance step
  useEffect(() => {
    if (!isActive || currentStep >= TUTORIAL_STEPS.length) return;

    const step = TUTORIAL_STEPS[currentStep];

    if (clickListenerRef.current) {
      clickListenerRef.current.element.removeEventListener('click', clickListenerRef.current.handler, true);
      clickListenerRef.current = null;
    }

    if (!step.waitForClick) return;

    // Determine which target to attach listener to based on phase
    const targetAttr = (currentPhase === 'save' && step.saveTarget) ? step.saveTarget : step.target;

    const attachListener = () => {
      if (clickListenerRef.current) return;
      const target = document.querySelector(`[data-tutorial="${targetAttr}"]`);
      if (target) {
        const handler = (event) => {
          // If step has an elementType requirement, check if clicked element matches
          if (step.elementType) {
            const clickedElementType = event.target.closest('[data-element-type]')?.getAttribute('data-element-type');
            if (clickedElementType !== step.elementType) {
              // Wrong element type clicked, ignore and keep waiting
              return;
            }
          }

          // Remove the listener since the correct element was clicked
          target.removeEventListener('click', handler, true);
          clickListenerRef.current = null;

          // Nascondi tooltip immediatamente
          setShowTooltip(false);
          setHighlightRect(null);

          setTimeout(() => {
            if (step.saveTarget && currentPhase === 'target') {
              // Step has two phases: switch from 'target' to 'save'
              // NON mostrare il tooltip, aspetta silenziosamente il click sul saveTarget
              setCurrentPhase('save');
            } else {
              // Step completato, passa automaticamente allo step successivo
              setCurrentStep(prev => prev + 1);
              setCurrentPhase('target');
              setShowTooltip(true);
            }
          }, 300);
        };
        target.addEventListener('click', handler, { capture: true });
        clickListenerRef.current = { element: target, handler };
      }
    };

    attachListener();
    const retryInterval = setInterval(attachListener, 500);

    return () => {
      clearInterval(retryInterval);
      if (clickListenerRef.current) {
        clickListenerRef.current.element.removeEventListener('click', clickListenerRef.current.handler, true);
        clickListenerRef.current = null;
      }
    };
  }, [isActive, currentStep, currentPhase]);

  // Reposition on scroll/resize and periodically
  useEffect(() => {
    if (!isActive || !showTooltip) return;

    positionTooltip();

    const handleUpdate = () => requestAnimationFrame(positionTooltip);

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    const interval = setInterval(positionTooltip, 400);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      clearInterval(interval);
    };
  }, [isActive, currentStep, showTooltip, positionTooltip]);

  // Auto-complete when all steps done
  useEffect(() => {
    if (isActive && currentStep >= TUTORIAL_STEPS.length) {
      handleComplete();
    }
  }, [currentStep, isActive]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setCurrentPhase('target');
      setShowTooltip(true);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    setHighlightRect(null);
    setCurrentPhase('target');
    setShowTooltip(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    if (clickListenerRef.current) {
      clickListenerRef.current.element.removeEventListener('click', clickListenerRef.current.handler, true);
      clickListenerRef.current = null;
    }
  };

  const handleStart = () => {
    setCurrentStep(0);
    setCurrentPhase('target');
    setIsActive(true);
    setShowTooltip(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!isActive) {
    return (
      <Button
        position="fixed"
        bottom={4}
        right={4}
        colorScheme="blue"
        size="sm"
        onClick={handleStart}
        zIndex={999}
        boxShadow="lg"
        borderRadius="full"
        px={5}
      >
        Start Tutorial
      </Button>
    );
  }

  if (currentStep >= TUTORIAL_STEPS.length) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isClickStep = step.waitForClick;

  // Build the overlay with a hole using box-shadow.
  const overlayStyle = highlightRect ? {
    position: 'fixed',
    top: `${highlightRect.top}px`,
    left: `${highlightRect.left}px`,
    width: `${highlightRect.width}px`,
    height: `${highlightRect.height}px`,
    zIndex: 1000,
    borderRadius: '6px',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
    pointerEvents: 'none'
  } : {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    background: 'rgba(0, 0, 0, 0.5)',
    pointerEvents: 'none'
  };

  return (
    <>
      {/* Overlay with hole — pointer-events: none lets clicks pass through */}
      {showTooltip && <div style={overlayStyle} />}

      {/* Pulsing border around the target */}
      {showTooltip && highlightRect && (
        <Box
          position="fixed"
          top={`${highlightRect.top - 3}px`}
          left={`${highlightRect.left - 3}px`}
          width={`${highlightRect.width + 6}px`}
          height={`${highlightRect.height + 6}px`}
          zIndex={1001}
          pointerEvents="none"
          borderRadius="md"
          border="3px solid"
          borderColor="blue.400"
          animation={`${pulseAnimation} 2s ease-in-out infinite`}
        />
      )}

      {/* Tooltip card */}
      {showTooltip && <Box
        ref={tooltipRef}
        position="fixed"
        top={`${tooltipPos.top}px`}
        left={`${tooltipPos.left}px`}
        w="380px"
        maxH="75vh"
        overflowY="auto"
        bg="white"
        borderRadius="lg"
        boxShadow="dark-lg"
        border="2px solid"
        borderColor="blue.400"
        zIndex={1002}
        p={4}
      >
        <Flex justify="space-between" align="center" mb={2}>
          <Badge colorScheme="blue" fontSize="sm" px={2} py={1} borderRadius="md">
            Step {currentStep + 1} / {TUTORIAL_STEPS.length}
          </Badge>
          <CloseButton size="sm" onClick={handleComplete} />
        </Flex>

        <VStack align="stretch" spacing={2}>
          <Heading size="sm" color="blue.700">
            {step.title}
          </Heading>

          {step.instruction && (
            <Text fontSize="xs" color="orange.600" fontWeight="semibold" bg="orange.50" p={2} borderRadius="md">
              💡 {step.instruction}
            </Text>
          )}

          <Text fontSize="sm" color="gray.700" whiteSpace="pre-line" lineHeight="1.5">
            {step.description}
          </Text>
        </VStack>

        <HStack mt={3} justify="space-between" align="center">
          <Button
            size="xs"
            variant="ghost"
            onClick={handleComplete}
            color="gray.500"
          >
            Skip Tutorial
          </Button>

          <HStack spacing={2}>
            {isClickStep && targetFound && (
              <Text fontSize="xs" color="blue.500" fontWeight="semibold">
                {currentPhase === 'save' && step.saveTarget
                  ? 'Now click the highlighted button to save'
                  : 'Click the highlighted element to continue'}
              </Text>
            )}
            {isClickStep && !targetFound && (
              <Text fontSize="xs" color="orange.500">
                Element not visible yet
              </Text>
            )}
            {!isClickStep && (
              <Button
                size="sm"
                colorScheme="blue"
                onClick={handleNext}
              >
                {currentStep === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Got it, Next'}
              </Button>
            )}
          </HStack>
        </HStack>
      </Box>}
    </>
  );
};

export default GuidedTutorial;
