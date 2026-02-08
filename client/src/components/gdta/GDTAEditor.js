import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  Spinner,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  IconButton,
  FormControl,
  FormLabel,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Badge
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import GDTATreeView from './GDTATreeView';

const TUTORIAL_EXAMPLES = {
  createGDTA: {
    title: 'Cognitive Biases in Decision-Making',
    overallGoal: 'Recognizing and analyzing how cognitive biases form and manifest in order to design more effective human-machine systems and improve real-world decision-making'
  },
  addGoal: {
    title: 'Understand and evaluate the role of cognitive biases in decision-making'
  },
  addSubgoal: {
    title: 'Identify the cognitive mechanisms that generate biases'
  },
  addRequirement: {
    title: 'Knowing the basic cognitive processes (e.g., memory, attention)',
    level: 1
  }
};

const GDTAEditor = ({ onSelectElement, onStructureChange, isLoadingSuggestions, onStructureUpdate, tutorialStep }) => {
  const [gdtaStructures, setGDTAStructures] = useState([]);
  const [currentStructure, setCurrentStructure] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [accordionIndex, setAccordionIndex] = useState([0]);
  const [subgoalAccordionIndex, setSubgoalAccordionIndex] = useState([]);

  const [newTitle, setNewTitle] = useState('');
  const [newElement, setNewElement] = useState({
    type: '',
    title: '',
    description: '',
    level: 1,
    parentId: null
  });

  const { isOpen: isCreateStructureOpen, onOpen: onCreateStructureOpen, onClose: onCreateStructureClose } = useDisclosure();
  const { isOpen: isAddElementOpen, onOpen: onAddElementOpen, onClose: onAddElementClose } = useDisclosure();
  const { isOpen: isEditElementOpen, onOpen: onEditElementOpen, onClose: onEditElementClose } = useDisclosure();
  const { isOpen: isTreeViewOpen, onOpen: onTreeViewOpen, onClose: onTreeViewClose } = useDisclosure();

  const toast = useToast();
  
  const handleDeleteStructure = async () => {
    if (!currentStructure) {
      toast({
        title: 'Warning',
        description: 'No GDTA structure selected',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the GDTA structure "${currentStructure.title}"? This action will also delete the associated course and cannot be undone.`)) {
      return;
    }

    try {
      console.log('Starting cascade deletion GDTA + Course...');
      console.log('GDTA ID:', currentStructure._id);
      
      try {
        console.log('Looking for course associated with GDTA:', currentStructure._id);
        const courseResponse = await axios.get(`http://localhost:8080/api/courses/by-gdta/${currentStructure._id}`);
        
        console.log('Course search response:', courseResponse.data);
        
        if (courseResponse.data) {
          const courseId = courseResponse.data._id;
          console.log('Course found with ID:', courseId);
          console.log('Proceeding with course deletion...');
          
          const deleteResponse = await axios.delete(`http://localhost:8080/api/courses/${courseId}`);
          console.log('Course deletion response:', deleteResponse.data);
          console.log('Course deleted successfully!');
        } else {
          console.log('No associated course found (response.data is null/undefined)');
        }
      } catch (courseError) {
        console.error('Error during course management:', courseError);
        console.error('Status:', courseError.response?.status);
        console.error('Data:', courseError.response?.data);

        if (courseError.response?.status === 404) {
          console.log('No associated course found (404), proceeding with GDTA deletion');
        } else {
          console.warn('Error in course deletion:', courseError.message);
          toast({
            title: 'Warning',
            description: `Error in course deletion: ${courseError.message}`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      }
      
      console.log('Proceeding with GDTA structure deletion:', currentStructure._id);
      const gdtaDeleteResponse = await axios.delete(`http://localhost:8080/api/gdta/${currentStructure._id}`);
      console.log('GDTA deletion response:', gdtaDeleteResponse.data);
      console.log('GDTA deleted successfully!');
      
      const updatedStructures = gdtaStructures.filter(s => s._id !== currentStructure._id);
      setGDTAStructures(updatedStructures);
      
      setCurrentStructure(null);
      setSelectedElement(null);
      
      if (onStructureChange) {
        onStructureChange(null);
      }
      
      toast({
        title: 'Deletion completed',
        description: 'GDTA and associated course deleted successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (err) {
      console.error('General error in deletion:', err);
      console.error('Stack trace:', err.stack);
      
      toast({
        title: 'Deletion error',
        description: `Unable to complete deletion: ${err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const saveStructureToDatabase = async (updatedStructure) => {
    try {
      await axios.put(`http://localhost:8080/api/gdta/${updatedStructure._id}`, {
        title: updatedStructure.title,
        description: updatedStructure.description,
        overallGoal: updatedStructure.overallGoal,
        goals: updatedStructure.goals
      });
      
      console.log('Structure saved to database successfully');
      if (onStructureUpdate) {
        onStructureUpdate();
      }
    } catch (err) {
      console.error('Error saving:', err);
      
      toast({
        title: 'Save error',
        description: 'Unable to save to database',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  useEffect(() => {
    const fetchGDTAStructures = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:8080/api/gdta');
        setGDTAStructures(response.data);
        setIsLoading(false);
      } catch (err) {
        setError('Error loading GDTA structures');
        setIsLoading(false);
        console.error(err);
      }
    };

    fetchGDTAStructures();
  }, []);

  // Espandi automaticamente la GDTA quando si arriva allo step del requirement
  useEffect(() => {
    if (tutorialStep === 7 && currentStructure?.goals?.length > 0) {
      // Step 8 (index 7): espandi il primo goal e il primo subgoal per mostrare il requirement
      setAccordionIndex([0]);
      setSubgoalAccordionIndex([0]);
    }
  }, [tutorialStep, currentStructure]);
  
  const handleCreateStructure = async () => {
    if (!newTitle.trim()) {
      toast({
        title: 'Warning',
        description: 'Enter a title for the GDTA structure',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      console.log('Starting automatic GDTA + Course creation...');
      
      const gdtaResponse = await axios.post('http://localhost:8080/api/gdta', {
        title: newTitle,
        description: 'New GDTA structure',
        overallGoal: {
          title: newElement.title,
          description: newElement.description
        },
        goals: []
      });
      
      const newGDTAStructure = gdtaResponse.data;
      console.log('GDTA created with ID:', newGDTAStructure._id);
      
      try {
        const courseResponse = await axios.post('http://localhost:8080/api/courses', {
          title: `Course: ${newTitle}`,
          description: `Course based on GDTA structure: ${newTitle}`,
          gdtaStructureId: newGDTAStructure._id,
          sections: []
        });
        
        console.log('Course created with ID:', courseResponse.data._id);
        
        toast({
          title: 'Complete success!',
          description: 'GDTA and associated course created successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (courseError) {
        console.error('Error in course creation:', courseError);
        
        toast({
          title: 'GDTA created, course failed',
          description: 'GDTA created but error in associated course creation',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
      
      setGDTAStructures([...gdtaStructures, newGDTAStructure]);
      setCurrentStructure(newGDTAStructure);
      setNewTitle('');
      setNewElement({
        type: '',
        title: '',
        description: '',
        level: 1,
        parentId: null
      });
      
      if (onStructureChange) {
        onStructureChange(newGDTAStructure._id);
      }
      
      onCreateStructureClose();
      
    } catch (err) {
      console.error('Error in GDTA structure creation:', err);
      
      toast({
        title: 'Error',
        description: 'Unable to create GDTA structure',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleSelectStructure = (structure) => {
    setCurrentStructure(structure);
    setSelectedElement(null);
    
    if (onStructureChange) {
      onStructureChange(structure._id);
    }
  };
  
  const handleAddElementClick = (type, parentId = null) => {
    console.log(`Opening modal to add ${type} with parentId:`, parentId);

    const prefilled = {
      type,
      title: '',
      description: '',
      level: 1,
      parentId: parentId || null
    };

    if (tutorialStep !== null && tutorialStep !== undefined) {
      if (type === 'goal' && tutorialStep === 1) {
        prefilled.title = TUTORIAL_EXAMPLES.addGoal.title;
      } else if (type === 'subgoal' && tutorialStep === 2) {
        prefilled.title = TUTORIAL_EXAMPLES.addSubgoal.title;
      } else if (type === 'requirement' && tutorialStep === 3) {
        prefilled.title = TUTORIAL_EXAMPLES.addRequirement.title;
        prefilled.level = TUTORIAL_EXAMPLES.addRequirement.level;
      }
    }

    setNewElement(prefilled);
    onAddElementOpen();
  };

  const handleOpenCreateStructure = () => {
    if (tutorialStep === 0) {
      setNewTitle(TUTORIAL_EXAMPLES.createGDTA.title);
      setNewElement(prev => ({
        ...prev,
        title: TUTORIAL_EXAMPLES.createGDTA.overallGoal,
        description: ''
      }));
    } else {
      setNewTitle('');
      setNewElement(prev => ({ ...prev, title: '', description: '' }));
    }
    onCreateStructureOpen();
  };


  const handleAddElement = async () => {
    if (!newElement.title.trim()) {
      toast({
        title: 'Warning',
        description: 'Enter a title for the element',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const updatedStructure = { ...currentStructure };
      
      switch(newElement.type) {
        case 'goal':
          updatedStructure.goals = [
            ...(updatedStructure.goals || []),
            {
              _id: `goal-${Date.now()}`,
              title: newElement.title,
              description: newElement.description,
              subgoals: []
            }
          ];
          break;
          
        case 'subgoal':
          const goalIndex = updatedStructure.goals.findIndex(
            goal => goal._id === newElement.parentId
          );
          
          if (goalIndex !== -1) {
            if (!updatedStructure.goals[goalIndex].subgoals) {
              updatedStructure.goals[goalIndex].subgoals = [];
            }
            
            updatedStructure.goals[goalIndex].subgoals.push({
              _id: `subgoal-${Date.now()}`,
              title: newElement.title,
              description: newElement.description,
              informationRequirements: []
            });
          }
          break;
          
        case 'requirement':
          console.log("Adding requirement with parentId:", newElement.parentId);
          
          const idParts = newElement.parentId.split('-');

          if (idParts.length < 4) {
            console.error("Invalid parentId format:", newElement.parentId);
            return;
          }
          
          const parentGoalId = `${idParts[0]}-${idParts[1]}`;
          const parentSubgoalId = `${idParts[2]}-${idParts[3]}`;
          
          console.log("Parsed IDs - Goal:", parentGoalId, "Subgoal:", parentSubgoalId);
          
          const gIndex = updatedStructure.goals.findIndex(
            goal => goal._id === parentGoalId
          );
          
          if (gIndex !== -1) {
            console.log("Found goal at index:", gIndex);
            
            const sgIndex = updatedStructure.goals[gIndex].subgoals.findIndex(
              subgoal => subgoal._id === parentSubgoalId
            );
            
            if (sgIndex !== -1) {
              console.log("Found subgoal at index:", sgIndex);
              
              if (!updatedStructure.goals[gIndex].subgoals[sgIndex].informationRequirements) {
                updatedStructure.goals[gIndex].subgoals[sgIndex].informationRequirements = [];
              }
              
              updatedStructure.goals[gIndex].subgoals[sgIndex].informationRequirements.push({
                _id: `req-${Date.now()}`,
                title: newElement.title,
                description: newElement.description,
                level: parseInt(newElement.level)
              });
              
              console.log("Added information requirement:", newElement.title);
            } else {
              console.error("Subgoal not found with ID:", parentSubgoalId);
            }
          } else {
            console.error("Goal not found with ID:", parentGoalId);
          }
          break;
          
        default:
          console.error('Unsupported element type:', newElement.type);
      }
      
      console.log("Updated structure:", JSON.stringify(updatedStructure, null, 2));
      
      setCurrentStructure(updatedStructure);
      await saveStructureToDatabase(updatedStructure);

      // Toast rimosso - non mostrare messaggi di successo per ogni aggiunta

      onAddElementClose();
    } catch (err) {
      console.error('Error adding element:', err);
      
      toast({
        title: 'Error',
        description: 'Unable to add element',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleSelectElement = (element) => {
    if (isLoadingSuggestions) {
      toast({
        title: 'Please wait',
        description: 'Wait for suggestions completion',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setSelectedElement(element);

    // Gestione espansione/collasso GDTA durante il tutorial
    if (tutorialStep !== null) {
      // Step 6 (index 5): dopo aver cliccato goal, collassa tutto
      if (tutorialStep === 5 && element.type === 'goal') {
        setAccordionIndex([]);
      }
      // Step 8 (index 7): dopo aver cliccato requirement, collassa tutto
      else if (tutorialStep === 7 && element.type === 'requirement') {
        setAccordionIndex([]);
      }
    }

    if (onSelectElement) {
      onSelectElement(element);
    }
  };
  
  const handleDeleteElement = async (type, id, parentId = null) => {
    if (!window.confirm('Are you sure you want to delete this element?')) {
      return;
    }
    
    try {
      const updatedStructure = { ...currentStructure };
      
      switch(type) {
        case 'goal':
          updatedStructure.goals = updatedStructure.goals.filter(goal => goal._id !== id);
          break;
          
        case 'subgoal':
          const goalIndex = updatedStructure.goals.findIndex(
            goal => goal._id === parentId
          );
          
          if (goalIndex !== -1) {
            updatedStructure.goals[goalIndex].subgoals = updatedStructure.goals[goalIndex].subgoals.filter(
              subgoal => subgoal._id !== id
            );
          }
          break;
          
        case 'requirement':
          const parentIdParts = parentId.split('-');

          if (parentIdParts.length < 4) {
            console.error("Invalid parentId format:", parentId);
            return;
          }

          const parentGoalId = `${parentIdParts[0]}-${parentIdParts[1]}`;
          const parentSubgoalId = `${parentIdParts[2]}-${parentIdParts[3]}`;
          
          const parentGoalIndex = updatedStructure.goals.findIndex(
            goal => goal._id === parentGoalId
          );
          
          if (parentGoalIndex !== -1) {
            const parentSubgoalIndex = updatedStructure.goals[parentGoalIndex].subgoals.findIndex(
              subgoal => subgoal._id === parentSubgoalId
            );
            
            if (parentSubgoalIndex !== -1) {
              updatedStructure.goals[parentGoalIndex].subgoals[parentSubgoalIndex].informationRequirements = 
                updatedStructure.goals[parentGoalIndex].subgoals[parentSubgoalIndex].informationRequirements.filter(
                  req => req._id !== id
                );
            }
          }
          break;
      }
      
      setCurrentStructure(updatedStructure);
      await saveStructureToDatabase(updatedStructure);
      
      toast({
        title: 'Element deleted',
        description: 'Element deleted successfully',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error deleting element:', err);
      
      toast({
        title: 'Error',
        description: 'Unable to delete element',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleEditElement = async () => {
    try {
      const updatedStructure = { ...currentStructure };
      
      switch(newElement.type) {
        case 'overallGoal':
          updatedStructure.overallGoal = {
            title: newElement.title,
            description: newElement.description
          };
          break;
          
        case 'goal':
          const goalIndex = updatedStructure.goals.findIndex(
            goal => goal._id === newElement.id
          );
          
          if (goalIndex !== -1) {
            updatedStructure.goals[goalIndex].title = newElement.title;
            updatedStructure.goals[goalIndex].description = newElement.description;
          }
          break;
          
        case 'subgoal':
          const gIndex = updatedStructure.goals.findIndex(
            goal => goal._id === newElement.parentId
          );
          
          if (gIndex !== -1) {
            const subgoalIndex = updatedStructure.goals[gIndex].subgoals.findIndex(
              subgoal => subgoal._id === newElement.id
            );
            
            if (subgoalIndex !== -1) {
              updatedStructure.goals[gIndex].subgoals[subgoalIndex].title = newElement.title;
              updatedStructure.goals[gIndex].subgoals[subgoalIndex].description = newElement.description;
            }
          }
          break;
          
        case 'requirement':
          const [parentGoalId, parentSubgoalId] = newElement.parentId.split('-');
          
          const goalIdx = updatedStructure.goals.findIndex(
            goal => goal._id === parentGoalId
          );
          
          if (goalIdx !== -1) {
            const subgoalIdx = updatedStructure.goals[goalIdx].subgoals.findIndex(
              subgoal => subgoal._id === parentSubgoalId
            );
            
            if (subgoalIdx !== -1) {
              const reqIndex = updatedStructure.goals[goalIdx].subgoals[subgoalIdx].informationRequirements.findIndex(
                req => req._id === newElement.id
              );
              
              if (reqIndex !== -1) {
                updatedStructure.goals[goalIdx].subgoals[subgoalIdx].informationRequirements[reqIndex].title = newElement.title;
                updatedStructure.goals[goalIdx].subgoals[subgoalIdx].informationRequirements[reqIndex].description = newElement.description;
                updatedStructure.goals[goalIdx].subgoals[subgoalIdx].informationRequirements[reqIndex].level = parseInt(newElement.level);
              }
            }
          }
          break;
      }
      
      setCurrentStructure(updatedStructure);
      await saveStructureToDatabase(updatedStructure);

      // Toast rimosso - non mostrare messaggi di successo per ogni modifica

      onEditElementClose();
    } catch (err) {
      console.error('Error editing element:', err);
      
      toast({
        title: 'Error',
        description: 'Unable to modify element',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
const renderGDTAStructure = () => {
  if (!currentStructure) return null;
  
  return (
    <Box>
      
      <Accordion allowMultiple index={accordionIndex} onChange={setAccordionIndex} mt={4}>
        <AccordionItem 
          borderWidth="2px" 
          borderColor="purple.500" 
          borderRadius="md" 
          mb={4}
          bg="purple.50"
        >
          <h2>
            <AccordionButton
              _expanded={{ bg: 'purple.100' }}
              borderRadius="md"
              py={3}
              data-tutorial="overall-goal-accordion"
            >
              <Box flex="1" textAlign="left">
                <HStack>
                  <Badge colorScheme="purple" fontSize="1em" px={2} py={1}>Overall Goal</Badge>
                  <Text fontWeight="bold" fontSize="lg">
                    {currentStructure.overallGoal?.title || "Overall Goal"}
                  </Text>
                </HStack>
              </Box>
              <HStack spacing={2} mr={2}>
                <IconButton
                  icon={<EditIcon />}
                  size="sm"
                  colorScheme="purple"
                  variant="ghost"
                  aria-label="Edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewElement({
                      type: 'overallGoal',
                      title: currentStructure.overallGoal?.title || '',
                      description: currentStructure.overallGoal?.description || '',
                    });
                    onEditElementOpen();
                  }}
                />
              </HStack>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            {currentStructure.overallGoal?.description && (
              <Text fontSize="md" color="gray.700" mb={4}>
                {currentStructure.overallGoal.description}
              </Text>
            )}
            
            <Button
              size="sm"
              colorScheme="purple"
              variant="outline"
              mb={4}
              leftIcon={<AddIcon />}
              onClick={() => handleAddElementClick('goal')}
              data-tutorial="add-goal"
            >
              Add Goal
            </Button>
            
            
            <Accordion allowMultiple defaultIndex={[]}>
              {currentStructure.goals && currentStructure.goals.map((goal, goalIndex) => (
                <AccordionItem 
                  key={goal._id} 
                  borderWidth="1px" 
                  borderColor="red.200" 
                  borderRadius="md" 
                  mb={3}
                >
                  <h3>
                    <AccordionButton
                      _expanded={{ bg: 'red.50' }}
                      borderRadius="md"
                      cursor={isLoadingSuggestions ? "not-allowed" : "pointer"}
                      opacity={isLoadingSuggestions ? 0.5 : 1}
                      onClick={() => handleSelectElement({
                        id: goal._id,
                        title: goal.title,
                        description: goal.description,
                        type: 'goal'
                      })}
                      {...(goalIndex === 0 ? { 'data-tutorial': 'gdta-element', 'data-element-type': 'goal' } : {})}
                    >
                      <Box flex="1" textAlign="left">
                        <HStack>
                          <Badge colorScheme="red">Goal {goalIndex + 1}</Badge>
                          <Text fontWeight="semibold">{goal.title}</Text>
                        </HStack>
                      </Box>
                      <HStack spacing={2} mr={2}>
                        <IconButton
                          icon={<EditIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          aria-label="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewElement({
                              type: 'goal',
                              title: goal.title,
                              description: goal.description || '',
                              id: goal._id
                            });
                            onEditElementOpen();
                          }}
                        />
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          aria-label="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteElement('goal', goal._id);
                          }}
                        />
                      </HStack>
                      <AccordionIcon />
                    </AccordionButton>
                  </h3>
                  <AccordionPanel pb={4}>
                    {goal.description && (
                      <Text fontSize="sm" color="gray.600" mb={3}>
                        {goal.description}
                      </Text>
                    )}
                    
                    <Button
                      size="sm"
                      colorScheme="green"
                      variant="outline"
                      mb={4}
                      leftIcon={<AddIcon />}
                      onClick={() => handleAddElementClick('subgoal', goal._id)}
                      {...(goalIndex === 0 ? { 'data-tutorial': 'add-subgoal' } : {})}
                    >
                      Add Subgoal
                    </Button>
                    
                    
                    {goal.subgoals && goal.subgoals.length > 0 ? (
                      <Accordion
                        allowMultiple
                        {...(goalIndex === 0 && tutorialStep === 7
                          ? { index: subgoalAccordionIndex, onChange: setSubgoalAccordionIndex }
                          : { defaultIndex: [] }
                        )}
                      >
                        {goal.subgoals.map((subgoal, subgoalIndex) => (
                          <AccordionItem 
                            key={subgoal._id} 
                            borderWidth="1px" 
                            borderColor="green.200" 
                            borderRadius="md" 
                            mb={3}
                          >
                            <h4>
                              <AccordionButton
                                _expanded={{ bg: 'green.50' }}
                                borderRadius="md"
                                cursor={isLoadingSuggestions ? "not-allowed" : "pointer"}
                                opacity={isLoadingSuggestions ? 0.5 : 1}
                                onClick={() => handleSelectElement({
                                  id: subgoal._id,
                                  title: subgoal.title,
                                  description: subgoal.description,
                                  type: 'subgoal'
                                })}
                                {...(goalIndex === 0 && subgoalIndex === 0 ? { 'data-tutorial': 'gdta-element', 'data-element-type': 'subgoal' } : {})}
                              >
                                <Box flex="1" textAlign="left">
                                  <HStack>
                                    <Badge colorScheme="green">Subgoal {goalIndex+1}.{subgoalIndex+1}</Badge>
                                    <Text fontWeight="semibold">{subgoal.title}</Text>
                                  </HStack>
                                </Box>
                                <HStack spacing={2} mr={2}>
                                  <IconButton
                                    icon={<EditIcon />}
                                    size="sm"
                                    colorScheme="green"
                                    variant="ghost"
                                    aria-label="Edit"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNewElement({
                                        type: 'subgoal',
                                        title: subgoal.title,
                                        description: subgoal.description || '',
                                        id: subgoal._id,
                                        parentId: goal._id
                                      });
                                      onEditElementOpen();
                                    }}
                                  />
                                  <IconButton
                                    icon={<DeleteIcon />}
                                    size="sm"
                                    colorScheme="green"
                                    variant="ghost"
                                    aria-label="Delete"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteElement('subgoal', subgoal._id, goal._id);
                                    }}
                                  />
                                </HStack>
                                <AccordionIcon />
                              </AccordionButton>
                            </h4>
                            <AccordionPanel pb={4}>
                              {subgoal.description && (
                                <Text fontSize="sm" color="gray.600" mb={3}>
                                  {subgoal.description}
                                </Text>
                              )}
                              
                              <Button
                                size="sm"
                                colorScheme="blue"
                                variant="outline"
                                mb={4}
                                leftIcon={<AddIcon />}
                                onClick={() => {
                                  console.log("Adding requirement for subgoal:", subgoal._id);
                                  console.log("Parent goal:", goal._id);
                                  handleAddElementClick('requirement', `${goal._id}-${subgoal._id}`);
                                }}
                                {...(goalIndex === 0 && subgoalIndex === 0 ? { 'data-tutorial': 'add-requirement' } : {})}
                              >
                                Add Information Requirement
                              </Button>
                              
                              
                              {subgoal.informationRequirements && subgoal.informationRequirements.length > 0 ? (
                                <VStack align="stretch" spacing={3}>
                                  
                                  <Box>
                                    <Heading size="xs" color="blue.600" mb={2}>
                                      Level 1: Acquire 
                                    </Heading>
                                    {subgoal.informationRequirements
                                      .filter(req => req.level === 1)
                                      .map((req, reqIndex) => (
                                        <Box
                                          key={req._id}
                                          p={3}
                                          borderWidth="1px"
                                          borderColor="blue.200"
                                          borderRadius="md"
                                          bg="blue.50"
                                          mb={2}
                                          cursor={isLoadingSuggestions ? "not-allowed" : "pointer"}
                                          opacity={isLoadingSuggestions ? 0.5 : 1}
                                          onClick={() => handleSelectElement({
                                            id: req._id,
                                            title: req.title,
                                            description: req.description,
                                            type: 'requirement',
                                            level: 1
                                          })}
                                          {...(goalIndex === 0 && subgoalIndex === 0 && reqIndex === 0 ? { 'data-tutorial': 'requirement-element', 'data-element-type': 'requirement' } : {})}
                                        >
                                          <HStack justify="space-between">
                                            <Text fontWeight="medium">{req.title}</Text>
                                            <HStack spacing={2}>
                                              <IconButton
                                                icon={<EditIcon />}
                                                size="xs"
                                                colorScheme="blue"
                                                variant="ghost"
                                                aria-label="Edit"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setNewElement({
                                                    type: 'requirement',
                                                    title: req.title,
                                                    description: req.description || '',
                                                    level: req.level,
                                                    id: req._id,
                                                    parentId: `${goal._id}-${subgoal._id}`
                                                  });
                                                  onEditElementOpen();
                                                }}
                                              />
                                              <IconButton
                                                icon={<DeleteIcon />}
                                                size="xs"
                                                colorScheme="blue"
                                                variant="ghost"
                                                aria-label="Delete"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteElement('requirement', req._id, `${goal._id}-${subgoal._id}`);
                                                }}
                                              />
                                            </HStack>
                                          </HStack>
                                          {req.description && (
                                            <Text fontSize="xs" color="gray.600" mt={1}>
                                              {req.description}
                                            </Text>
                                          )}
                                        </Box>
                                      ))}
                                    {!subgoal.informationRequirements.some(req => req.level === 1) && (
                                      <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                        No level 1 requirements
                                      </Text>
                                    )}
                                  </Box>
                                  
                                  
                                  <Box>
                                    <Heading size="xs" color="teal.600" mb={2}>
                                      Level 2: Make Meaning
                                    </Heading>
                                    {subgoal.informationRequirements
                                      .filter(req => req.level === 2)
                                      .map((req, reqIndex) => (
                                        <Box
                                          key={req._id}
                                          p={3}
                                          borderWidth="1px"
                                          borderColor="teal.200"
                                          borderRadius="md"
                                          bg="teal.50"
                                          mb={2}
                                          cursor={isLoadingSuggestions ? "not-allowed" : "pointer"}
                                          opacity={isLoadingSuggestions ? 0.5 : 1}
                                          onClick={() => handleSelectElement({
                                            id: req._id,
                                            title: req.title,
                                            description: req.description,
                                            type: 'requirement',
                                            level: 2
                                          })}
                                          {...(goalIndex === 0 && subgoalIndex === 0 && reqIndex === 0 ? { 'data-tutorial': 'gdta-element', 'data-element-type': 'requirement' } : {})}
                                        >
                                          <HStack justify="space-between">
                                            <Text fontWeight="medium">{req.title}</Text>
                                            <HStack spacing={2}>
                                              <IconButton
                                                icon={<EditIcon />}
                                                size="xs"
                                                colorScheme="teal"
                                                variant="ghost"
                                                aria-label="Edit"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setNewElement({
                                                    type: 'requirement',
                                                    title: req.title,
                                                    description: req.description || '',
                                                    level: req.level,
                                                    id: req._id,
                                                    parentId: `${goal._id}-${subgoal._id}`
                                                  });
                                                  onEditElementOpen();
                                                }}
                                              />
                                              <IconButton
                                                icon={<DeleteIcon />}
                                                size="xs"
                                                colorScheme="teal"
                                                variant="ghost"
                                                aria-label="Delete"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteElement('requirement', req._id, `${goal._id}-${subgoal._id}`);
                                                }}
                                              />
                                            </HStack>
                                          </HStack>
                                          {req.description && (
                                            <Text fontSize="xs" color="gray.600" mt={1}>
                                              {req.description}
                                            </Text>
                                          )}
                                        </Box>
                                      ))}
                                    {!subgoal.informationRequirements.some(req => req.level === 2) && (
                                      <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                        No level 2 requirements
                                      </Text>
                                    )}
                                  </Box>
                                  
                                  
                                  <Box>
                                    <Heading size="xs" color="cyan.600" mb={2}>
                                      Level 3: Transfer
                                    </Heading>
                                    {subgoal.informationRequirements
                                      .filter(req => req.level === 3)
                                      .map((req, reqIndex) => (
                                        <Box
                                          key={req._id}
                                          p={3}
                                          borderWidth="1px"
                                          borderColor="cyan.200"
                                          borderRadius="md"
                                          bg="cyan.50"
                                          mb={2}
                                          cursor={isLoadingSuggestions ? "not-allowed" : "pointer"}
                                          opacity={isLoadingSuggestions ? 0.5 : 1}
                                          onClick={() => handleSelectElement({
                                            id: req._id,
                                            title: req.title,
                                            description: req.description,
                                            type: 'requirement',
                                            level: 3
                                          })}
                                          {...(goalIndex === 0 && subgoalIndex === 0 && reqIndex === 0 ? { 'data-tutorial': 'gdta-element', 'data-element-type': 'requirement' } : {})}
                                        >
                                          <HStack justify="space-between">
                                            <Text fontWeight="medium">{req.title}</Text>
                                            <HStack spacing={2}>
                                              <IconButton
                                                icon={<EditIcon />}
                                                size="xs"
                                                colorScheme="cyan"
                                                variant="ghost"
                                                aria-label="Edit"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setNewElement({
                                                    type: 'requirement',
                                                    title: req.title,
                                                    description: req.description || '',
                                                    level: req.level,
                                                    id: req._id,
                                                    parentId: `${goal._id}-${subgoal._id}`
                                                  });
                                                  onEditElementOpen();
                                                }}
                                              />
                                              <IconButton
                                                icon={<DeleteIcon />}
                                                size="xs"
                                                colorScheme="cyan"
                                                variant="ghost"
                                                aria-label="Delete"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteElement('requirement', req._id, `${goal._id}-${subgoal._id}`);
                                                }}
                                              />
                                            </HStack>
                                          </HStack>
                                          {req.description && (
                                            <Text fontSize="xs" color="gray.600" mt={1}>
                                              {req.description}
                                            </Text>
                                          )}
                                        </Box>
                                      ))}
                                    {!subgoal.informationRequirements.some(req => req.level === 3) && (
                                      <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                        No level 3 requirements
                                      </Text>
                                    )}
                                  </Box>
                                </VStack>
                              ) : (
                                <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                  No information requirements defined
                                </Text>
                              )}
                            </AccordionPanel>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <Text fontSize="sm" color="gray.500" fontStyle="italic">
                        No subgoals defined
                      </Text>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
            
            {(!currentStructure.goals || currentStructure.goals.length === 0) && (
              <Box p={4} textAlign="center" color="gray.500">
                <Text mb={2}>No goals defined</Text>
              </Box>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  );
};
  
  return (
    <Box>
      <Heading size="md" mb={4} color="blue.600">GDTA Editor</Heading>
      
      
      <HStack mb={4} justify="space-between">
        <Box>
          {gdtaStructures.length > 0 && (
            <Select 
              placeholder="Select a GDTA structure" 
              value={currentStructure?._id || ''}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selected = gdtaStructures.find(s => s._id === selectedId);
                if (selected) {
                  handleSelectStructure(selected);
                }
              }}
              maxW="300px"
            >
              {gdtaStructures.map(structure => (
                <option key={structure._id} value={structure._id}>
                  {structure.title}
                </option>
              ))}
            </Select>
          )}
        </Box>
        
        <HStack spacing={2}>
          {currentStructure && (
            <>
              <Button
                colorScheme="blue"
                leftIcon={<AddIcon />}
                onClick={handleOpenCreateStructure}
                size="sm"
                variant="outline"
                data-tutorial="create-gdta"
              >
                Create GDTA
              </Button>
              <Button
                colorScheme="purple"
                leftIcon={<ViewIcon />}
                onClick={onTreeViewOpen}
                size="sm"
                variant="outline"
                data-tutorial="view-tree"
              >
                View Tree
              </Button>
              <Button
                colorScheme="red"
                leftIcon={<DeleteIcon />}
                onClick={handleDeleteStructure}
                size="sm"
                variant="outline"
              >
                Delete GDTA
              </Button>
            </>
          )}
        </HStack>
      </HStack>
      
      <Divider mb={4} />
      
      
      {isLoading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="blue.500" />
          <Text mt={4} color="gray.600">Loading GDTA structures...</Text>
        </Box>
      ) : currentStructure ? (
        renderGDTAStructure()
      ) : (
        <Box p={8} textAlign="center" color="gray.500">
          <Text mb={4}>Select an existing GDTA structure or create a new one</Text>
          <Button
            colorScheme="blue"
            leftIcon={<AddIcon />}
            onClick={handleOpenCreateStructure}
            data-tutorial="create-gdta"
          >
            Create new GDTA
          </Button>
        </Box>
      )}
      
      
      
      <Modal isOpen={isCreateStructureOpen} onClose={onCreateStructureClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create new GDTA structure</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Structure title</FormLabel>
                <Input 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="E.g. Situation Awareness Course"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Overall Goal</FormLabel>
                <Input 
                  value={newElement.title}
                  onChange={(e) => setNewElement({...newElement, title: e.target.value})}
                  placeholder="E.g. Understand and apply SA principles"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Overall Goal description (optional)</FormLabel>
                <Input 
                  value={newElement.description}
                  onChange={(e) => setNewElement({...newElement, description: e.target.value})}
                  placeholder="Brief description of the overall objective"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateStructureClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateStructure} data-tutorial="create-gdta-save">
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      
      <Modal isOpen={isAddElementOpen} onClose={onAddElementClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Add {
              newElement.type === 'goal' ? 'Goal' : 
              newElement.type === 'subgoal' ? 'Subgoal' : 
              'Information Requirement'
            }
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input 
                  value={newElement.title}
                  onChange={(e) => setNewElement({...newElement, title: e.target.value})}
                  placeholder={`Enter a title for the ${newElement.type}`}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description (optional)</FormLabel>
                <Input 
                  value={newElement.description}
                  onChange={(e) => setNewElement({...newElement, description: e.target.value})}
                  placeholder="Brief description"
                />
              </FormControl>
              
              {newElement.type === 'requirement' && (
                <FormControl isRequired>
                  <FormLabel>Situation Awareness Level</FormLabel>
                  <Select 
                    value={newElement.level}
                    onChange={(e) => setNewElement({...newElement, level: parseInt(e.target.value)})}
                  >
                    <option value={1}>Level 1: Acquire</option>
                    <option value={2}>Level 2: Make Meaning</option>
                    <option value={3}>Level 3: Transfer </option>
                  </Select>
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddElementClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAddElement}
              data-tutorial={
                newElement.type === 'goal' ? 'add-goal-save' :
                newElement.type === 'subgoal' ? 'add-subgoal-save' :
                newElement.type === 'requirement' ? 'add-requirement-save' : undefined
              }
            >
              Add
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      
      <Modal isOpen={isEditElementOpen} onClose={onEditElementClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Edit {
              newElement.type === 'overallGoal' ? 'Overall Goal' :
              newElement.type === 'goal' ? 'Goal' : 
              newElement.type === 'subgoal' ? 'Subgoal' : 
              'Information Requirement'
            }
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input 
                  value={newElement.title}
                  onChange={(e) => setNewElement({...newElement, title: e.target.value})}
                  placeholder="Enter a title"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description (optional)</FormLabel>
                <Input 
                  value={newElement.description}
                  onChange={(e) => setNewElement({...newElement, description: e.target.value})}
                  placeholder="Brief description"
                />
              </FormControl>
              
              {newElement.type === 'requirement' && (
                <FormControl isRequired>
                  <FormLabel>Situation Awareness Level</FormLabel>
                  <Select 
                    value={newElement.level}
                    onChange={(e) => setNewElement({...newElement, level: parseInt(e.target.value)})}
                  >
                    <option value={1}>Level 1: Acquire </option>
                    <option value={2}>Level 2: Make Meaning </option>
                    <option value={3}>Level 3: Transfer </option>
                  </Select>
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditElementClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleEditElement}>
              Save changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <GDTATreeView
        isOpen={isTreeViewOpen}
        onClose={onTreeViewClose}
        structure={currentStructure}
      />
    </Box>
  );
};

export default GDTAEditor;