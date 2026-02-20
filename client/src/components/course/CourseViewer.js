import React, { useState, useCallback, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import axios from 'axios';
import {
  Box,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Icon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Flex,
  IconButton,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  FormControl,
  FormLabel,
  Select
} from '@chakra-ui/react';
import { DownloadIcon, AddIcon, CloseIcon, DeleteIcon, TimeIcon } from '@chakra-ui/icons';
import { FaVideo, FaFileAlt, FaQuestion } from 'react-icons/fa';

const DropTargetSection = ({ section, onAddContent, children }) => {
  const handleDrop = useCallback((item) => {
    onAddContent(section.id, item.content);
    return { dropped: true };
  }, [section.id, onAddContent]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'MICROCONTENT',
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }), [handleDrop]);

  return (
    <Box
      ref={drop}
      p={3}
      bg={isOver ? "blue.50" : "white"}
      borderRadius="md"
      borderWidth={isOver ? "2px" : "1px"}
      borderStyle={isOver ? "dashed" : "solid"}
      borderColor={isOver ? "blue.300" : "gray.200"}
      transition="all 0.2s"
    >
      {children}
    </Box>
  );
};

const CourseViewer = ({ gdtaStructureId, structureVersion }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [courseId, setCourseId] = useState(null);
  const [courseTitle, setCourseTitle] = useState('New Course');
  const [courseSections, setCourseSections] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [newSectionTitle, setNewSectionTitle] = useState('');
  
  const [gdtaStructure, setGdtaStructure] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedSubgoal, setSelectedSubgoal] = useState('');
  
  useEffect(() => {
    if (gdtaStructureId) {
      loadOrCreateCourse();
      loadGDTAStructure();
    } else {
      console.log('GDTA eliminated, reset CourseViewer...');
      setCourseId(null);
      setCourseTitle('New Course');
      setCourseSections([]);
      setHasUnsavedChanges(false);
      setGdtaStructure(null);
    }
  }, [gdtaStructureId, structureVersion]);
  
  useEffect(() => {
    if (hasUnsavedChanges && courseId) {
      const saveTimer = setTimeout(() => {
        saveCourse();
      }, 3000);
      
      return () => clearTimeout(saveTimer);
    }
  }, [courseSections, hasUnsavedChanges]);
  
  const loadGDTAStructure = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/gdta/${gdtaStructureId}`);
      setGdtaStructure(response.data);
      console.log('GDTA structure loaded:', response.data.title);
    } catch (error) {
      console.error('Error loading GDTA structure:', error);
      toast({
        title: 'Warning',
        description: 'Unable to load GDTA structure for section mapping',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const loadOrCreateCourse = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:8080/api/courses/by-gdta/${gdtaStructureId}`);
      
      if (response.data) {
        setCourseId(response.data._id);
        setCourseTitle(response.data.title);
        setCourseSections(response.data.sections || []);

        // Toast rimosso - il caricamento è silenzioso
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        createNewCourse();
      } else {
        console.error('Error loading course:', error);
        toast({
          title: 'Error',
          description: 'Unable to load course',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const createNewCourse = async () => {
    try {
      const response = await axios.post('http://localhost:8080/api/courses', {
        title: 'New Course',
        gdtaStructureId: gdtaStructureId,
        sections: []
      });
      
      setCourseId(response.data._id);
      setCourseTitle(response.data.title);
      setCourseSections(response.data.sections || []);
      
      toast({
        title: 'Course created',
        description: 'New course created successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: 'Unable to create course',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const saveCourse = async () => {
    if (!courseId) return;
    
    setIsSaving(true);
    try {
      await axios.put(`http://localhost:8080/api/courses/${courseId}`, {
        title: courseTitle,
        sections: courseSections
      });

      setHasUnsavedChanges(false);

      // Toast removed - save is silent
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: 'Save error',
        description: 'Unable to save course',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const addContentToSection = useCallback((sectionId, content) => {
    setCourseSections(prevSections => {
      const uniqueId = `${content._id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newSections = prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            contents: [
              ...section.contents,
              {
                id: uniqueId,
                microcontentId: content._id,
                title: content.title,
                contentType: content.contentType,
                difficulty: content.difficulty || 'intermediate',
                source: content.source
              }
            ]
          };
        }
        return section;
      });
      
      setHasUnsavedChanges(true);
      return newSections;
    });

    // Toast removed - content addition is silent
  }, []);
  
  const removeContent = useCallback((sectionId, contentId) => {
    setCourseSections(prevSections => {
      const newSections = prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            contents: section.contents.filter(content => content.id !== contentId)
          };
        }
        return section;
      });
      
      setHasUnsavedChanges(true);
      return newSections;
    });
    
    toast({
      title: 'Content removed',
      description: 'The microcontent has been removed from the section',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  }, [toast]);
  
  const removeSection = useCallback((sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section? All contents in this section will be lost.')) {
      return;
    }
    
    setCourseSections(prevSections => {
      const newSections = prevSections.filter(section => section.id !== sectionId);
      setHasUnsavedChanges(true);
      return newSections;
    });
    
    toast({
      title: 'Section removed',
      description: 'The section has been deleted',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  }, [toast]);
  
  const addNewSection = () => {
    if (!newSectionTitle.trim()) {
      toast({
        title: 'Warning',
        description: 'Enter a title for the section',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const selectedGoalObj = gdtaStructure?.goals?.find(g => g._id === selectedGoal);
    const selectedSubgoalObj = selectedGoalObj?.subgoals?.find(s => s._id === selectedSubgoal);
    
    const newSection = {
      id: `section-${Date.now()}`,
      title: newSectionTitle,
      gdtaMapping: selectedGoal ? {
        goalId: selectedGoal,
        goalTitle: selectedGoalObj?.title,
        subgoalId: selectedSubgoal || null,
        subgoalTitle: selectedSubgoalObj?.title || null
      } : null,
      contents: []
    };
    
    setCourseSections(prev => [...prev, newSection]);
    setNewSectionTitle('');
    setSelectedGoal('');
    setSelectedSubgoal('');
    setHasUnsavedChanges(true);
    onClose();

    // Toast removed - no need to show success message for section creation
  };
  
  const getContentTypeIcon = (contentType) => {
    switch(contentType) {
      case 'video':
        return <Icon as={FaVideo} color="red.500" />;
      case 'audio':
        return <Icon as={FaVideo} color="purple.500" />;
      case 'pdf':
        return <Icon as={FaFileAlt} color="red.500" />;
      case 'infographic':
        return <Icon as={FaFileAlt} color="pink.500" />;
      case 'quiz':
        return <Icon as={FaQuestion} color="green.500" />;
      case 'case_study':
        return <Icon as={FaFileAlt} color="cyan.500" />;
      case 'scenario':
        return <Icon as={FaFileAlt} color="orange.500" />;
      case 'task':
        return <Icon as={FaFileAlt} color="teal.500" />;
      case 'tutorial':
        return <Icon as={FaFileAlt} color="purple.500" />;
      default:
        return <Icon as={FaFileAlt} color="blue.500" />;
    }
  };
  
  const calculateTotalDuration = () => {
    let totalMinutes = 0;
    
    courseSections.forEach(section => {
      section.contents.forEach(content => {
        const duration = content.duration || '5 min';
        const minutes = parseInt(duration.match(/\d+/)?.[0]) || 5;
        totalMinutes += minutes;
      });
    });
    
    if (totalMinutes === 0) return '';
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'beginner':
        return 'green';
      case 'intermediate':
        return 'yellow';
      case 'advanced':
        return 'red';
      default:
        return 'blue';
    }
  };
  
  const handleExportPDF = async () => {
    if (!courseId) {
      toast({
        title: 'Warning',
        description: 'Save the course first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (hasUnsavedChanges) {
      await saveCourse();
    }
    
    try {
      toast({
        title: 'PDF export in progress',
        description: 'Generating PDF...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      const response = await axios.post(`http://localhost:8080/api/courses/${courseId}/export/pdf`);
      
      const courseNameSafe = courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${courseNameSafe}.html`;
      
      const blob = new Blob([response.data.htmlContent], {
        type: 'text/html'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'PDF downloaded',
        description: 'Open the downloaded HTML file and save it as PDF with the browser',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'PDF export error',
        description: 'Unable to generate course PDF',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>Loading course...</Text>
      </Box>
    );
  }
  
  if (!gdtaStructureId) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500" fontSize="lg">
          Select or create a GDTA structure to view the course
        </Text>
      </Box>
    );
  }
  
  return (
    <Box>
      <HStack mb={4} justify="space-between">
        <HStack spacing={3}>
          <Heading size="md" color="blue.600">Course Viewer</Heading>
          {calculateTotalDuration() && (
            <Badge colorScheme="blue" variant="outline" fontSize="sm" px={3} py={1}>
              <HStack spacing={1}>
                <TimeIcon />
                <Text>{calculateTotalDuration()}</Text>
              </HStack>
            </Badge>
          )}
        </HStack>
        <HStack>
          {isSaving && (
            <Badge colorScheme="green" variant="outline">
              <Spinner size="xs" mr={2} />
              Saving...
            </Badge>
          )}
        </HStack>
      </HStack>

      {courseSections.length > 0 && (
        <HStack mb={4} justify="space-between">
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<AddIcon />}
            onClick={onOpen}
            data-tutorial="new-section"
          >
            New Section
          </Button>
        </HStack>
      )}

      <Accordion allowMultiple defaultIndex={[0]} mb={6}>
        {courseSections.map((section, index) => (
          <AccordionItem
            key={section.id}
            border="1px"
            borderColor={borderColor}
            borderRadius="md"
            mb={3}
            overflow="hidden"
          >
            <AccordionButton 
              bg={sectionBg} 
              _hover={{ bg: 'blue.50' }}
              py={3}
            >
              <HStack flex="1" textAlign="left" spacing={3}>
                <Badge colorScheme="purple" fontSize="0.8em">
                  Section {index + 1}
                </Badge>
                <Text fontWeight="semibold">{section.title}</Text>
                
                
                {section.gdtaMapping && gdtaStructure && (
                  <Badge colorScheme="green" variant="outline" fontSize="0.7em">
                    📋 {(() => {
                      const goalIndex = gdtaStructure.goals.findIndex(g => g._id === section.gdtaMapping.goalId);
                      
                      if (section.gdtaMapping.subgoalId) {
                        const goal = gdtaStructure.goals[goalIndex];
                        const subgoalIndex = goal?.subgoals?.findIndex(s => s._id === section.gdtaMapping.subgoalId);
                        return `Subgoal ${goalIndex + 1}.${subgoalIndex + 1}`;
                      } else {
                        return `Goal ${goalIndex + 1}`;
                      }
                    })()}
                  </Badge>
                )}
              </HStack>
              <HStack spacing={2} mr={2}>
                <IconButton
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  aria-label="Delete section"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSection(section.id);
                  }}
                />
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4} bg="white">
              <DropTargetSection
                section={section}
                onAddContent={addContentToSection}
              >
                <Box data-tutorial="drag-drop-area">
                {section.contents.length > 0 ? (
                  <VStack align="stretch" spacing={3}>
                    {section.contents.map((content) => (
                      <Box
                        key={content.id}
                        p={3}
                        borderWidth="1px"
                        borderRadius="md"
                        bg="gray.50"
                        position="relative"
                      >
                        <Flex justify="space-between" align="center">
                          <HStack>
                            {getContentTypeIcon(content.contentType)}
                            <Text fontWeight="medium">{content.title}</Text>
                          </HStack>
                          
                          <HStack>
                            <Badge 
                              variant="outline" 
                              colorScheme={getDifficultyColor(content.difficulty)}
                            >
                              {content.difficulty}
                            </Badge>
                            <IconButton
                              icon={<CloseIcon />}
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => removeContent(section.id, content.id)}
                              aria-label="Remove"
                            />
                          </HStack>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Box p={3} bg="gray.50" borderRadius="md" textAlign="center">
                    <Text color="gray.500">
                      Drag microcontents here from the suggestions panel.
                    </Text>
                  </Box>
                )}
                </Box>
              </DropTargetSection>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
      
      {courseSections.length === 0 && (
        <Box p={8} bg="gray.50" borderRadius="md" textAlign="center" mb={6}>
          <Text color="gray.500" mb={3} fontSize="md">
            Your course is empty. Start by creating your first section!
          </Text>
          <Button
            colorScheme="blue"
            leftIcon={<AddIcon />}
            onClick={onOpen}
            data-tutorial="new-section"
          >
            Add First Section
          </Button>
        </Box>
      )}
      
      <Divider mb={4} />
      
      
      <Button
        leftIcon={<DownloadIcon />}
        colorScheme="orange"
        size="md"
        onClick={handleExportPDF}
        w="100%"
        isDisabled={courseSections.length === 0}
      >
        Export PDF
      </Button>
      
      
      <Modal isOpen={isOpen} onClose={() => {
        onClose();
        setSelectedGoal('');
        setSelectedSubgoal('');
      }}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add new section</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Section title:</FormLabel>
                <Box>
                  <input
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="E.g. Introduction to SA"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '4px'
                    }}
                  />
                </Box>
              </FormControl>

              
              {gdtaStructure && gdtaStructure.goals && (
                <>
                  <FormControl>
                    <FormLabel>Map to Goal (optional):</FormLabel>
                    <Select 
                      value={selectedGoal}
                      onChange={(e) => {
                        setSelectedGoal(e.target.value);
                        setSelectedSubgoal('');
                      }}
                      placeholder="Select a goal"
                    >
                      {gdtaStructure.goals.map(goal => (
                        <option key={goal._id} value={goal._id}>
                          {goal.title}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedGoal && (
                    <FormControl>
                      <FormLabel>Map to Subgoal:</FormLabel>
                      <Select 
                        value={selectedSubgoal}
                        onChange={(e) => setSelectedSubgoal(e.target.value)}
                        placeholder="Select a subgoal"
                      >
                        {gdtaStructure.goals
                          .find(g => g._id === selectedGoal)?.subgoals
                          ?.map(subgoal => (
                            <option key={subgoal._id} value={subgoal._id}>
                              {subgoal.title}
                            </option>
                          )) || []
                        }
                      </Select>
                    </FormControl>
                  )}
                </>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => {
              onClose();
              setSelectedGoal('');
              setSelectedSubgoal('');
            }}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={addNewSection} data-tutorial="add-section-button">
              Add
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CourseViewer;