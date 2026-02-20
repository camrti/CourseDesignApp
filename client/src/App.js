import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  ChakraProvider,
  Box,
  Grid,
  GridItem,
  Container,
  Heading,
  Text,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import GDTAEditor from './components/gdta/GDTAEditor';
import SuggestionPanel from './components/suggestion/SuggestionPanel';
import CourseViewer from './components/course/CourseViewer';
import GuidedTutorial from './components/tutorial/GuidedTutorial';

function App() {
  const [structureVersion, setStructureVersion] = useState(0);
  const [selectedElement, setSelectedElement] = useState(null);

  const [currentGDTAStructureId, setCurrentGDTAStructureId] = useState(null);

  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(null);

  const handleTutorialStepChange = useCallback((step) => {
    setTutorialStep(step);
  }, []);

  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBgColor = useColorModeValue('blue.600', 'blue.800');

  const handleElementSelect = (element) => {
    setSelectedElement(element);
  };

  const handleGDTAStructureChange = (structureId) => {
    setCurrentGDTAStructureId(structureId);

    setSelectedElement(null);
  };

  const handleStructureUpdate = () => {
    setStructureVersion(prevVersion => prevVersion + 1);
  };

  const handleLoadingSuggestionsChange = (loading) => {
    setIsLoadingSuggestions(loading);
  };

  return (
    <ChakraProvider>
      <DndProvider backend={HTML5Backend}>
        <Box
          minH="100vh"
          py={5}
          px={5}
          sx={{
            transform: 'scale(0.8)',
            transformOrigin: 'top center',
            minHeight: '125vh' // Compensate for the scale
          }}
        >
          <Container maxW="1400px">
            <VStack spacing={6} align="stretch">
              <Box
                p={6}
                bg={headerBgColor}
                color="white"
                borderRadius="lg"
                boxShadow="md"
                textAlign="center"
              >
                <Heading size="xl" fontWeight="bold" mb={2}>
                  GDTA-based Microlearning System
                </Heading>
                <Text fontSize="lg">
                  A tool for supporting the design of microlearning courses based on GDTA
                </Text>
              </Box>

              <Grid
                templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                gap={6}
              >
                <GridItem>
                  <VStack spacing={6} align="stretch">
                    <Box
                      p={6}
                      bg={bgColor}
                      borderRadius="lg"
                      boxShadow="md"
                      transition="all 0.3s"
                      _hover={{ boxShadow: "lg" }}
                    >
                      <GDTAEditor
                        onSelectElement={handleElementSelect}
                        onStructureChange={handleGDTAStructureChange}
                        isLoadingSuggestions={isLoadingSuggestions}
                        onStructureUpdate={handleStructureUpdate}
                        tutorialStep={tutorialStep}
                      />
                    </Box>
                    <Box
                      p={6}
                      bg={bgColor}
                      borderRadius="lg"
                      boxShadow="md"
                      transition="all 0.3s"
                      _hover={{ boxShadow: "lg" }}
                    >
                      <SuggestionPanel
                        selectedElement={selectedElement}
                        currentGDTAStructureId={currentGDTAStructureId}
                        onLoadingChange={handleLoadingSuggestionsChange}
                      />
                    </Box>
                  </VStack>
                </GridItem>

                <GridItem>
                  <Box
                    p={6}
                    bg={bgColor}
                    borderRadius="lg"
                    boxShadow="md"
                    h="100%"
                    transition="all 0.3s"
                    _hover={{ boxShadow: "lg" }}
                  >
                    <CourseViewer
                      gdtaStructureId={currentGDTAStructureId}
                      structureVersion={structureVersion}
                    />
                  </Box>
                </GridItem>
              </Grid>

              <Box
                p={4}
                bg={headerBgColor}
                color="white"
                borderRadius="lg"
                boxShadow="md"
                textAlign="center"
              >
                <Text>GDTA Microlearning Prototype © 2025</Text>
              </Box>
            </VStack>
          </Container>
        </Box>
        <GuidedTutorial onStepChange={handleTutorialStepChange} />
      </DndProvider>
    </ChakraProvider>
  );
}

export default App;
