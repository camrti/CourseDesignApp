import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Text,
  Heading,
  VStack,
  HStack,
  Badge,
  Flex,
  IconButton,
  Tooltip,
  Icon,
  Divider,
  Progress
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaGraduationCap, FaSitemap, FaProjectDiagram, FaSearch,
  FaPlusCircle, FaBullseye, FaLayerGroup, FaClipboardList,
  FaMousePointer, FaBrain, FaBalanceScale, FaMagic,
  FaFilter, FaEye, FaFolderPlus, FaHandRock,
  FaCheckCircle, FaTrophy, FaTimes, FaInfoCircle,
  FaArrowRight, FaPlay, FaRedo
} from 'react-icons/fa';

const STORAGE_KEY = 'gdta-tutorial-completed';
const STORAGE_STEP_KEY = 'gdta-tutorial-step';

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.6); }
  70% { box-shadow: 0 0 0 14px rgba(66, 153, 225, 0); }
  100% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0); }
`;

const dotPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
`;

// Phase metadata
const PHASES = {
  'gdta-creation': {
    name: 'Building GDTA',
    shortName: 'GDTA',
    order: 1,
    total: 4,
    color: 'purple',
    icon: FaSitemap,
    description: 'Create your learning structure with goals, subgoals, and requirements',
    stepRange: [0, 3]
  },
  'visualization': {
    name: 'Visualization',
    shortName: 'View',
    order: 2,
    total: 4,
    color: 'teal',
    icon: FaProjectDiagram,
    description: 'See your GDTA as an interactive tree diagram',
    stepRange: [4, 4]
  },
  'content-suggestion': {
    name: 'Content Discovery',
    shortName: 'Content',
    order: 3,
    total: 4,
    color: 'blue',
    icon: FaSearch,
    description: 'Find and evaluate relevant microcontents with AI',
    stepRange: [5, 12]
  },
  'course-creation': {
    name: 'Course Creation',
    shortName: 'Course',
    order: 4,
    total: 4,
    color: 'orange',
    icon: FaFolderPlus,
    description: 'Build your microlearning course by organizing content',
    stepRange: [13, 14]
  }
};

const PHASE_ORDER = ['gdta-creation', 'visualization', 'content-suggestion', 'course-creation'];

const TUTORIAL_STEPS = [
  // PHASE 1: Building GDTA
  {
    target: 'create-gdta',
    saveTarget: 'create-gdta-save',
    title: 'Create GDTA Structure',
    description: 'Let\'s start! Click "Create GDTA" to begin. We\'ve pre-filled an example about Cognitive Biases for you. Feel free to edit it or use it as is, then click "Create" to save.',
    position: 'bottom',
    waitForClick: true,
    phase: 'gdta-creation',
    icon: FaPlusCircle,
    actionType: 'click'
  },
  {
    target: 'add-goal',
    saveTarget: 'add-goal-save',
    title: 'Add a Goal',
    description: 'Now let\'s add a Goal (your main learning objective). Click "Add Goal" \u2014 we\'ve pre-filled an example for you. Review it and click "Add" to save.',
    position: 'bottom',
    waitForClick: true,
    phase: 'gdta-creation',
    icon: FaBullseye,
    actionType: 'click'
  },
  {
    target: 'add-subgoal',
    saveTarget: 'add-subgoal-save',
    title: 'Add a Subgoal',
    description: 'Subgoals break down each Goal into specific objectives. Click "Add Subgoal" to continue \u2014 an example is ready for you. Click "Add" to save.',
    position: 'bottom',
    waitForClick: true,
    phase: 'gdta-creation',
    instruction: 'First expand the Goal to see the "Add Subgoal" button',
    icon: FaLayerGroup,
    actionType: 'click',
    isLastInPhase: false
  },
  {
    target: 'add-requirement',
    saveTarget: 'add-requirement-save',
    title: 'Add Information Requirements',
    description: 'Information Requirements define what learners need at 3 SA levels:\n\n\u2022 Level 1 \u2013 Acquire: Basic knowledge\n\u2022 Level 2 \u2013 Make Meaning: Understanding\n\u2022 Level 3 \u2013 Transfer: Application\n\nClick "Add Information Requirement" \u2014 a Level 1 example is ready. Click "Add" to save.',
    position: 'right',
    waitForClick: true,
    phase: 'gdta-creation',
    instruction: 'First expand the Subgoal to see the "Add Information Requirement" button',
    icon: FaClipboardList,
    actionType: 'click',
    isLastInPhase: true,
    phaseCompleteMessage: 'Your GDTA structure is complete with goals, subgoals, and information requirements.'
  },

  // PHASE 2: Visualization
  {
    target: 'view-tree',
    title: 'Visualize Your GDTA',
    description: 'Click "View Tree" to see your entire GDTA structure as an interactive tree diagram. This helps verify everything is organized correctly.',
    position: 'bottom',
    waitForClick: true,
    phase: 'visualization',
    icon: FaProjectDiagram,
    actionType: 'click',
    isLastInPhase: true,
    phaseCompleteMessage: 'You can now visualize your complete GDTA structure as a tree.'
  },

  // PHASE 3: Content Discovery
  {
    target: 'gdta-element',
    title: 'Select a Goal',
    description: 'Let\'s explore content suggestions! Click on your Goal element to select it. You\'ll learn how we use Semantic Scoring to find relevant content.',
    position: 'right',
    waitForClick: true,
    phase: 'content-suggestion',
    elementType: 'goal',
    icon: FaMousePointer,
    actionType: 'click'
  },
  {
    target: 'scoring-badge',
    title: 'Understanding Semantic Scoring',
    description: 'Notice the SEMANTIC SCORING badge! For Goals and Subgoals, we use AI (SBERT) to measure how similar in meaning the microcontent is to your element. Higher scores = more relevant content.',
    position: 'right',
    waitForClick: false,
    phase: 'content-suggestion',
    icon: FaBrain,
    actionType: 'observe'
  },
  {
    target: 'requirement-element',
    title: 'Select an Info Requirement',
    description: 'Now try clicking on the Information Requirement (blue box below). Watch how the scoring badge changes from Semantic to Hybrid!',
    position: 'right',
    waitForClick: true,
    phase: 'content-suggestion',
    elementType: 'requirement',
    icon: FaMousePointer,
    actionType: 'click'
  },
  {
    target: 'scoring-badge',
    title: 'Understanding Hybrid Scoring',
    description: 'HYBRID SCORING! For Information Requirements, we combine:\n\n\u2022 Semantic Score (topic similarity)\n\u2022 SA Level Match (Acquire/Make Meaning/Transfer)\n\nThis ensures content matches both topic AND cognitive level.',
    position: 'right',
    waitForClick: false,
    phase: 'content-suggestion',
    icon: FaBalanceScale,
    actionType: 'observe'
  },
  {
    target: 'gdta-element',
    title: 'Select Goal 1',
    description: 'Now click on Goal 1 again to get content suggestions tailored for it.',
    position: 'right',
    waitForClick: true,
    phase: 'content-suggestion',
    elementType: 'goal',
    icon: FaMousePointer,
    actionType: 'click'
  },
  {
    target: 'suggest-content-button',
    title: 'Get AI Suggestions',
    description: 'Ready to see the magic? Click "Suggest Content" to get AI-powered microcontent recommendations!',
    position: 'right',
    waitForClick: true,
    phase: 'content-suggestion',
    icon: FaMagic,
    actionType: 'click'
  },
  {
    target: 'fslsm-filters',
    title: 'Learning Styles (FSLSM)',
    description: 'All content is classified by learning style dimensions:\n\n\u2022 Processing: Active vs Reflective\n\u2022 Perception: Sensing vs Intuitive\n\u2022 Input: Visual vs Verbal\n\u2022 Understanding: Sequential vs Global\n\nFilter content to match your learners\' preferences!',
    position: 'right',
    waitForClick: false,
    waitForElement: true,
    phase: 'content-suggestion',
    icon: FaFilter,
    actionType: 'observe'
  },
  {
    target: 'preview-button',
    saveTarget: 'preview-modal-close',
    title: 'Preview Content',
    description: 'Before adding content to your course, preview it! Click the eye icon on any microcontent card. Review it, then close the modal to continue.',
    position: 'left',
    waitForClick: true,
    phase: 'content-suggestion',
    icon: FaEye,
    actionType: 'click',
    isLastInPhase: true,
    phaseCompleteMessage: 'You know how to find, filter, and preview relevant microcontents.'
  },

  // PHASE 4: Course Creation
  {
    target: 'new-section',
    saveTarget: 'add-section-button',
    title: 'Create Course Section',
    description: 'Almost there! Click "Add First Section" to create your first course section. Enter a name (e.g., "Introduction to Cognitive Biases"), optionally map it to a GDTA element, then click "Add".',
    position: 'bottom',
    waitForClick: true,
    phase: 'course-creation',
    icon: FaFolderPlus,
    actionType: 'click'
  },
  {
    target: 'drag-drop-area',
    title: 'Drag & Drop Content',
    description: 'Final step! Drag microcontents from the suggestions panel and drop them into your course section.\n\nThat\'s it! You now know how to create complete microlearning courses.',
    position: 'top',
    waitForClick: false,
    phase: 'course-creation',
    icon: FaHandRock,
    actionType: 'drag',
    isLastInPhase: true,
    phaseCompleteMessage: 'You\'ve mastered the GDTA Microlearning System!'
  }
];

// Helper: get step count label for a phase
const getPhaseStepCount = (phaseKey) => {
  const phase = PHASES[phaseKey];
  const count = phase.stepRange[1] - phase.stepRange[0] + 1;
  return count === 1 ? '1 step' : `${count} steps`;
};

// Confetti particles for completion
const CONFETTI_COLORS = ['#805AD5', '#319795', '#3182CE', '#DD6B20', '#38A169', '#E53E3E'];
const generateConfetti = () =>
  Array.from({ length: 16 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: (Math.random() - 0.5) * 300,
    y: (Math.random() - 0.5) * 300,
    rotation: Math.random() * 360,
    size: 6 + Math.random() * 6
  }));


const GuidedTutorial = ({ onStepChange }) => {
  // State machine: 'idle' | 'welcome' | 'active' | 'phaseTransition' | 'completed'
  const [tutorialState, setTutorialState] = useState('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('target'); // 'target' or 'save'
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState(null);
  const [targetFound, setTargetFound] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [transitionFromPhase, setTransitionFromPhase] = useState(null);
  const [confettiParticles] = useState(generateConfetti);
  const tooltipRef = useRef(null);
  const clickListenerRef = useRef(null);

  const isActive = tutorialState === 'active';

  // Auto-start on first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setTutorialState('welcome'), 1200);
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
      const tooltipW = 400;
      const tooltipH = tooltipRef.current?.offsetHeight || 300;
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
      top = Math.max(60, Math.min(top, window.innerHeight - tooltipH - 12));

      setTooltipPos({ top, left });
    } else {
      setTargetFound(false);
      setHighlightRect(null);
      if (step.waitForElement) {
        return;
      }
      setTooltipPos({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 200
      });
    }
  }, [isActive, currentStep, currentPhase, showTooltip]);

  // Step advancement with phase transitions
  const advanceStep = useCallback((nextStepIndex) => {
    const justCompletedStep = TUTORIAL_STEPS[nextStepIndex - 1];
    const nextStep = TUTORIAL_STEPS[nextStepIndex];

    // Check if we crossed a phase boundary
    if (justCompletedStep?.isLastInPhase && nextStep && nextStep.phase !== justCompletedStep.phase) {
      setTransitionFromPhase(justCompletedStep.phase);
      setCurrentStep(nextStepIndex);
      setTutorialState('phaseTransition');
      return;
    }

    // Check if tutorial is done
    if (nextStepIndex >= TUTORIAL_STEPS.length) {
      setTutorialState('completed');
      setHighlightRect(null);
      return;
    }

    // Normal advancement
    setCurrentStep(nextStepIndex);
    setCurrentPhase('target');
    setShowTooltip(true);
  }, []);

  // Attach click listener on current target
  useEffect(() => {
    if (!isActive || currentStep >= TUTORIAL_STEPS.length) return;

    const step = TUTORIAL_STEPS[currentStep];

    // Clean up previous listeners
    if (clickListenerRef.current) {
      if (Array.isArray(clickListenerRef.current)) {
        clickListenerRef.current.forEach(({ element, handler }) =>
          element.removeEventListener('click', handler, true)
        );
      } else {
        clickListenerRef.current.element.removeEventListener('click', clickListenerRef.current.handler, true);
      }
      clickListenerRef.current = null;
    }

    if (!step.waitForClick) return;

    const targetAttr = (currentPhase === 'save' && step.saveTarget) ? step.saveTarget : step.target;

    const attachListener = () => {
      if (clickListenerRef.current) return;

      const targets = document.querySelectorAll(`[data-tutorial="${targetAttr}"]`);
      if (targets.length === 0) return;

      const handler = (event) => {
        if (step.elementType) {
          const clickedElementType = event.target.closest('[data-element-type]')?.getAttribute('data-element-type');
          if (clickedElementType !== step.elementType) {
            return;
          }
        }

        targets.forEach(t => t.removeEventListener('click', handler, true));
        clickListenerRef.current = null;

        setShowTooltip(false);
        setHighlightRect(null);

        setTimeout(() => {
          if (step.saveTarget && currentPhase === 'target') {
            setCurrentPhase('save');
          } else {
            advanceStep(currentStep + 1);
          }
        }, 300);
      };

      const entries = [];
      targets.forEach(target => {
        target.addEventListener('click', handler, { capture: true });
        entries.push({ element: target, handler });
      });
      clickListenerRef.current = entries;
    };

    attachListener();
    const retryInterval = setInterval(attachListener, 500);

    return () => {
      clearInterval(retryInterval);
      if (clickListenerRef.current) {
        if (Array.isArray(clickListenerRef.current)) {
          clickListenerRef.current.forEach(({ element, handler }) =>
            element.removeEventListener('click', handler, true)
          );
        } else {
          clickListenerRef.current.element.removeEventListener('click', clickListenerRef.current.handler, true);
        }
        clickListenerRef.current = null;
      }
    };
  }, [isActive, currentStep, currentPhase, advanceStep]);

  // Reposition on scroll/resize
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
      setTutorialState('completed');
      setHighlightRect(null);
    }
  }, [currentStep, isActive]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      advanceStep(currentStep + 1);
    } else {
      setTutorialState('completed');
      setHighlightRect(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setCurrentPhase('target');
      setShowTooltip(true);
    }
  };

  const handleComplete = () => {
    setTutorialState('idle');
    setHighlightRect(null);
    setCurrentPhase('target');
    setShowTooltip(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    if (clickListenerRef.current) {
      if (Array.isArray(clickListenerRef.current)) {
        clickListenerRef.current.forEach(({ element, handler }) =>
          element.removeEventListener('click', handler, true)
        );
      } else {
        clickListenerRef.current.element.removeEventListener('click', clickListenerRef.current.handler, true);
      }
      clickListenerRef.current = null;
    }
  };

  const handleStart = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_STEP_KEY);
    window.location.reload();
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setTutorialState('idle');
  };

  const handleStartFromWelcome = () => {
    setCurrentStep(0);
    setCurrentPhase('target');
    setShowTooltip(true);
    setTutorialState('active');
  };

  const handleContinueFromTransition = () => {
    setCurrentPhase('target');
    setShowTooltip(true);
    setTutorialState('active');
  };

  // Current step data
  const step = currentStep < TUTORIAL_STEPS.length ? TUTORIAL_STEPS[currentStep] : null;
  const currentPhaseData = step ? PHASES[step.phase] : null;
  const isClickStep = step?.waitForClick;
  const shouldHide = step?.waitForElement && !targetFound;

  // Progress percentage
  const progressPercent = (currentStep / TUTORIAL_STEPS.length) * 100;

  // Determine completed phases
  const getPhaseStatus = (phaseKey) => {
    const phase = PHASES[phaseKey];
    if (!step) return 'future';
    const currentStepPhaseOrder = PHASES[step.phase]?.order || 0;
    if (phase.order < currentStepPhaseOrder) return 'completed';
    if (phase.order === currentStepPhaseOrder) return 'active';
    return 'future';
  };

  // ========================================
  // RENDER: Welcome Modal
  // ========================================
  if (tutorialState === 'welcome') {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={1004}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Box
            bg="white"
            borderRadius="2xl"
            boxShadow="2xl"
            maxW="520px"
            w="90vw"
            p={8}
            textAlign="center"
          >
            <Box
              w={16}
              h={16}
              borderRadius="full"
              bg="blue.50"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mx="auto"
              mb={4}
            >
              <Icon as={FaGraduationCap} boxSize={8} color="blue.500" />
            </Box>

            <Heading size="lg" color="gray.800" mb={2}>
              Welcome to the Tutorial
            </Heading>
            <Text color="gray.500" fontSize="md" mb={6}>
              This guided tour will walk you through <strong>15 steps</strong> across <strong>4 phases</strong> to help you design your first microlearning course.
            </Text>

            <VStack spacing={3} align="stretch" mb={6}>
              {PHASE_ORDER.map((phaseKey) => {
                const phase = PHASES[phaseKey];
                return (
                  <HStack
                    key={phaseKey}
                    p={3}
                    bg={`${phase.color}.50`}
                    borderRadius="lg"
                    spacing={3}
                    textAlign="left"
                  >
                    <Box
                      w={10}
                      h={10}
                      borderRadius="lg"
                      bg={`${phase.color}.100`}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon as={phase.icon} color={`${phase.color}.500`} boxSize={5} />
                    </Box>
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                        {phase.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {phase.description}
                      </Text>
                    </VStack>
                    <Badge
                      colorScheme={phase.color}
                      variant="subtle"
                      fontSize="xs"
                      borderRadius="full"
                      px={2}
                    >
                      {getPhaseStepCount(phaseKey)}
                    </Badge>
                  </HStack>
                );
              })}
            </VStack>

            <Text fontSize="xs" color="gray.400" mb={5}>
              Estimated time: ~5 minutes
            </Text>

            <HStack justify="center" spacing={3}>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleStartFromWelcome}
                leftIcon={<Icon as={FaPlay} />}
                px={8}
                borderRadius="xl"
              >
                Start Tutorial
              </Button>
              <Button
                variant="ghost"
                size="sm"
                color="gray.500"
                onClick={handleSkip}
              >
                Skip
              </Button>
            </HStack>
          </Box>
        </motion.div>
      </Box>
    );
  }

  // ========================================
  // RENDER: Phase Transition
  // ========================================
  if (tutorialState === 'phaseTransition' && transitionFromPhase) {
    const completedPhase = PHASES[transitionFromPhase];
    const completedStepData = TUTORIAL_STEPS.find(
      s => s.phase === transitionFromPhase && s.isLastInPhase
    );
    const nextPhaseKey = PHASE_ORDER[completedPhase.order]; // next phase (0-indexed after current)
    const nextPhase = nextPhaseKey ? PHASES[nextPhaseKey] : null;

    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={1004}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <Box
            bg="white"
            borderRadius="2xl"
            boxShadow="2xl"
            maxW="460px"
            w="90vw"
            p={8}
            textAlign="center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            >
              <Box
                w={14}
                h={14}
                borderRadius="full"
                bg="green.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mx="auto"
                mb={4}
              >
                <Icon as={FaCheckCircle} boxSize={7} color="green.500" />
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge colorScheme={completedPhase.color} fontSize="sm" mb={2} px={3} py={1} borderRadius="full">
                Phase {completedPhase.order} of {completedPhase.total}
              </Badge>
              <Heading size="md" color="gray.800" mb={2}>
                {completedPhase.name} Complete!
              </Heading>
              <Text color="gray.500" fontSize="sm" mb={5}>
                {completedStepData?.phaseCompleteMessage || 'Great work!'}
              </Text>
            </motion.div>

            {nextPhase && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Divider mb={5} />
                <Text fontSize="xs" color="gray.400" mb={3} textTransform="uppercase" fontWeight="bold" letterSpacing="wide">
                  Next up
                </Text>
                <HStack
                  p={3}
                  bg={`${nextPhase.color}.50`}
                  borderRadius="lg"
                  spacing={3}
                  mb={5}
                  justify="center"
                >
                  <Icon as={nextPhase.icon} color={`${nextPhase.color}.500`} boxSize={5} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                      Phase {nextPhase.order}: {nextPhase.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {nextPhase.description}
                    </Text>
                  </VStack>
                </HStack>
              </motion.div>
            )}

            <Button
              colorScheme="blue"
              size="md"
              onClick={handleContinueFromTransition}
              rightIcon={<Icon as={FaArrowRight} />}
              borderRadius="xl"
              px={6}
            >
              Continue
            </Button>
          </Box>
        </motion.div>
      </Box>
    );
  }

  // ========================================
  // RENDER: Completion Screen
  // ========================================
  if (tutorialState === 'completed') {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={1004}
        display="flex"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        {/* Confetti particles */}
        {confettiParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: 0, x: p.x, y: p.y, scale: 0, rotate: p.rotation }}
            transition={{ duration: 1.8, ease: 'easeOut', delay: 0.3 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: p.size,
              height: p.size,
              borderRadius: p.id % 3 === 0 ? '50%' : '2px',
              backgroundColor: p.color,
              pointerEvents: 'none'
            }}
          />
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Box
            bg="white"
            borderRadius="2xl"
            boxShadow="2xl"
            maxW="480px"
            w="90vw"
            p={8}
            textAlign="center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <Box
                w={20}
                h={20}
                borderRadius="full"
                bg="yellow.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mx="auto"
                mb={4}
              >
                <Icon as={FaTrophy} boxSize={10} color="yellow.400" />
              </Box>
            </motion.div>

            <Heading
              size="xl"
              bgGradient="linear(to-r, blue.400, purple.500)"
              bgClip="text"
              mb={2}
            >
              Congratulations!
            </Heading>
            <Text color="gray.500" fontSize="md" mb={6}>
              You've completed all 15 steps and mastered the GDTA Microlearning System!
            </Text>

            <VStack spacing={2} align="stretch" mb={6} px={4}>
              {PHASE_ORDER.map((phaseKey) => {
                const phase = PHASES[phaseKey];
                return (
                  <HStack key={phaseKey} spacing={3} py={1}>
                    <Icon as={FaCheckCircle} color="green.500" boxSize={4} />
                    <Text fontSize="sm" color="gray.700" fontWeight="medium">
                      {phase.name}
                    </Text>
                  </HStack>
                );
              })}
            </VStack>

            <Text fontSize="sm" color="gray.500" mb={6}>
              You're ready to create professional microlearning courses!
            </Text>

            <HStack justify="center" spacing={3}>
              <Button
                colorScheme="blue"
                size="md"
                onClick={handleComplete}
                borderRadius="xl"
                px={6}
              >
                Close
              </Button>
              <Button
                variant="outline"
                colorScheme="blue"
                size="sm"
                onClick={handleStart}
                leftIcon={<Icon as={FaRedo} />}
              >
                Restart
              </Button>
            </HStack>
          </Box>
        </motion.div>
      </Box>
    );
  }

  // ========================================
  // RENDER: Idle State (Restart Button)
  // ========================================
  if (tutorialState === 'idle') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}
      >
        <Button
          colorScheme="blue"
          size="md"
          onClick={handleStart}
          borderRadius="full"
          boxShadow="lg"
          px={6}
          leftIcon={<Icon as={FaGraduationCap} />}
          _hover={{ boxShadow: 'xl', transform: 'translateY(-2px)' }}
          transition="all 0.2s"
        >
          Guided Tutorial
        </Button>
      </motion.div>
    );
  }

  // ========================================
  // RENDER: Active Tutorial
  // ========================================
  if (!isActive || !step) return null;

  // Overlay with hole
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

  // Action badge config
  const actionBadgeConfig = {
    click: { color: 'green', icon: FaMousePointer, text: 'Click the highlighted element' },
    observe: { color: 'blue', icon: FaEye, text: 'Read, then click Next' },
    drag: { color: 'orange', icon: FaHandRock, text: 'Drag content to complete' }
  };
  const actionCfg = actionBadgeConfig[step.actionType] || actionBadgeConfig.click;

  return (
    <>
      {/* ===== Progress Bar ===== */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1003}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        boxShadow="sm"
      >
        <Flex align="center" px={5} h="44px">
          {/* Phase indicators */}
          <HStack spacing={1} flex={1}>
            {PHASE_ORDER.map((phaseKey, index) => {
              const phase = PHASES[phaseKey];
              const status = getPhaseStatus(phaseKey);
              return (
                <HStack key={phaseKey} spacing={1}>
                  {index > 0 && (
                    <Box
                      h="2px"
                      w="16px"
                      bg={status === 'future' ? 'gray.200' : `${phase.color}.300`}
                      borderRadius="full"
                    />
                  )}
                  <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={
                      status === 'completed'
                        ? `${phase.color}.500`
                        : status === 'active'
                        ? `${phase.color}.500`
                        : 'gray.300'
                    }
                    animation={status === 'active' ? `${dotPulse} 2s ease-in-out infinite` : undefined}
                  />
                  <Text
                    fontSize="xs"
                    fontWeight={status === 'active' ? 'bold' : 'normal'}
                    color={
                      status === 'completed'
                        ? `${phase.color}.600`
                        : status === 'active'
                        ? `${phase.color}.600`
                        : 'gray.400'
                    }
                    display={{ base: 'none', md: 'block' }}
                  >
                    {phase.shortName}
                  </Text>
                </HStack>
              );
            })}
          </HStack>

          {/* Step counter */}
          <HStack spacing={3}>
            <Text fontSize="xs" color="gray.500" fontWeight="medium">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </Text>
            <Tooltip label="Exit tutorial" placement="bottom" hasArrow>
              <IconButton
                icon={<Icon as={FaTimes} />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                aria-label="Exit tutorial"
                onClick={handleComplete}
              />
            </Tooltip>
          </HStack>
        </Flex>

        {/* Progress bar */}
        <Progress
          value={progressPercent}
          size="xs"
          colorScheme={currentPhaseData?.color || 'blue'}
          bg="gray.100"
          hasStripe
          isAnimated
          sx={{ '& > div': { transition: 'width 0.5s ease' } }}
        />
      </Box>

      {/* ===== Overlay ===== */}
      <AnimatePresence>
        {showTooltip && !shouldHide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={overlayStyle}
          />
        )}
      </AnimatePresence>

      {/* ===== Pulse ring around target ===== */}
      {showTooltip && !shouldHide && highlightRect && (
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
          borderColor={`${currentPhaseData?.color || 'blue'}.400`}
          animation={`${pulseAnimation} 2s ease-in-out infinite`}
        />
      )}

      {/* ===== Step Tooltip ===== */}
      <AnimatePresence mode="wait">
        {showTooltip && !shouldHide && (
          <motion.div
            key={`step-${currentStep}-${currentPhase}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              top: `${tooltipPos.top}px`,
              left: `${tooltipPos.left}px`,
              zIndex: 1002,
              width: '400px'
            }}
          >
            <Box
              ref={tooltipRef}
              maxH="75vh"
              overflowY="auto"
              bg="white"
              borderRadius="xl"
              boxShadow="dark-lg"
              border="2px solid"
              borderColor={`${currentPhaseData?.color || 'blue'}.400`}
              p={5}
            >
              {/* Top bar: phase + step counter */}
              <Flex justify="space-between" align="center" mb={3}>
                <HStack spacing={2}>
                  <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={`${currentPhaseData?.color || 'blue'}.500`}
                  />
                  <Text fontSize="xs" color={`${currentPhaseData?.color || 'blue'}.600`} fontWeight="semibold">
                    {currentPhaseData?.name}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.400" fontWeight="medium">
                  {currentStep + 1}/{TUTORIAL_STEPS.length}
                </Text>
              </Flex>

              {/* Icon + Title */}
              <HStack spacing={3} mb={3}>
                <Box
                  w={9}
                  h={9}
                  borderRadius="lg"
                  bg={`${currentPhaseData?.color || 'blue'}.50`}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Icon as={step.icon} color={`${currentPhaseData?.color || 'blue'}.500`} boxSize={4} />
                </Box>
                <Heading size="sm" color="gray.800" lineHeight="1.3">
                  {step.title}
                </Heading>
              </HStack>

              {/* Action badge */}
              <Badge
                colorScheme={actionCfg.color}
                variant="subtle"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="full"
                mb={3}
              >
                <HStack spacing={1}>
                  <Icon as={actionCfg.icon} boxSize={3} />
                  <Text>{actionCfg.text}</Text>
                </HStack>
              </Badge>

              {/* Instruction callout */}
              {step.instruction && (
                <HStack
                  bg="orange.50"
                  p={2}
                  borderRadius="md"
                  mb={3}
                  spacing={2}
                  align="start"
                >
                  <Icon as={FaInfoCircle} color="orange.400" boxSize={4} mt="2px" flexShrink={0} />
                  <Text fontSize="xs" color="orange.700" fontWeight="medium">
                    {step.instruction}
                  </Text>
                </HStack>
              )}

              {/* Description */}
              <Text fontSize="sm" color="gray.600" whiteSpace="pre-line" lineHeight="1.6" mb={3}>
                {step.description}
              </Text>

              {/* Navigation */}
              <Divider mb={3} />
              <HStack justify="space-between" align="center">
                {currentStep > 0 ? (
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="gray"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                ) : <Box />}

                {!isClickStep && (
                  <Button
                    size="sm"
                    colorScheme={currentPhaseData?.color || 'blue'}
                    onClick={handleNext}
                    rightIcon={currentStep === TUTORIAL_STEPS.length - 1 ? undefined : <Icon as={FaArrowRight} boxSize={3} />}
                    borderRadius="lg"
                  >
                    {currentStep === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next'}
                  </Button>
                )}
              </HStack>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GuidedTutorial;
