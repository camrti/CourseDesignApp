import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDrag } from 'react-dnd';
import {
  Box,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Spinner,
  Badge,
  Divider,
  useToast,
  Flex,
  Icon,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  Image
} from '@chakra-ui/react';
import { 
  StarIcon, 
  InfoIcon, 
  ViewIcon, 
  ExternalLinkIcon, 
  DownloadIcon 
} from '@chakra-ui/icons';
import { 
  FaVideo, 
  FaFileAlt, 
  FaQuestion, 
  FaBrain, 
  FaEye, 
  FaKeyboard, 
  FaProjectDiagram,
  FaMusic,
  FaFileWord,
  FaFilePdf,
  FaFileAudio,
  FaPlayCircle,
  FaImage
} from 'react-icons/fa';

const getMatchQualityColor = (quality) => {
  switch(quality) {
    case 'Perfect Match':
      return 'green';
    case 'Good Match':
      return 'orange';
    case 'Fair Match':
      return 'yellow';
    case 'Poor Match':
      return 'gray';
    default:
      return 'gray';
  }
};

const DraggableMicroContent = ({ content, onPreview, selectedElement, rankPosition }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'MICROCONTENT',
    item: { content },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  const getContentTypeIcon = () => {
    const fileExtension = content.url ? content.url.toLowerCase().split('.').pop() : '';
    
    switch(content.contentType) {
      case 'video':
        return <Icon as={FaVideo} color="red.500" />;
      case 'audio':
        return <Icon as={FaMusic} color="purple.500" />;
      case 'image':
        return <Icon as={FaImage} color="green.500" />;
      case 'pdf':
        return <Icon as={FaFilePdf} color="red.500" />;
      case 'infographic':
        return <Icon as={FaFilePdf} color="pink.500" />;
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
        if (fileExtension === 'pdf') {
          return <Icon as={FaFilePdf} color="red.500" />;
        } else if (fileExtension === 'docx' || fileExtension === 'doc') {
          return <Icon as={FaFileWord} color="blue.500" />;
        } else if (fileExtension === 'wav' || fileExtension === 'mp3' || fileExtension === 'ogg') {
          return <Icon as={FaFileAudio} color="purple.500" />;
        } else if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png' || fileExtension === 'gif' || fileExtension === 'webp') {
          return <Icon as={FaImage} color="green.500" />;
        }
        return <Icon as={FaFileAlt} color="blue.500" />;
    }
  };

  const getDimensionColor = (dimension) => {
    switch(dimension) {
      case 'Processing':
        return 'purple';
      case 'Perception':
        return 'orange';
      case 'Input':
        return 'blue';
      case 'Understanding':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getRelevanceBorderColor = () => {
    const score = content.relevanceScore || 0;
    if (score >= 0.7) return 'green.400';
    if (score >= 0.5) return 'orange.400';
    if (score >= 0.3) return 'gray.300';
    return 'gray.200';
  };

  const getMatchBadge = () => {
    if (!content.matchQuality) return null;
    
    return (
      <Badge 
        colorScheme={getMatchQualityColor(content.matchQuality)}
        fontSize="xs"
        px={3}
        py={1}
        borderRadius="full"
        fontWeight="bold"
        variant="solid"
      >
        {content.matchQuality}
      </Badge>
    );
  };

  return (
    <Box ref={drag} opacity={isDragging ? 0.4 : 1}>
      <Box
        p={4}
        borderWidth="2px"
        borderColor={getRelevanceBorderColor()}
        borderRadius="md"
        boxShadow="sm"
        bg="white"
        transition="all 0.2s"
        cursor="grab"
        _hover={{ 
          boxShadow: "md", 
          borderColor: getRelevanceBorderColor(),
          transform: "translateY(-2px)"
        }}
        position="relative"
        h="210px"
        minH="210px"
        maxH="210px"
        overflow="hidden"
      >
        <HStack spacing={3} mb={3} align="start">
          {getContentTypeIcon()}
          <Heading size="sm" color="blue.700" flex="1" noOfLines={2} lineHeight="1.4">
            {content.title}
          </Heading>
          <IconButton
            icon={<ViewIcon />}
            size="sm"
            colorScheme="blue"
            variant="ghost"
            aria-label="Preview"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(content);
            }}
            _hover={{ bg: "blue.50" }}
          />
        </HStack>
        
        <Text 
          fontSize="sm" 
          color="gray.600" 
          mb={3}
          h="54px"
          noOfLines={2}
          lineHeight="1.4"
          overflow="hidden"
        >
          {content.description}
        </Text>
        
        
        <Center mb={2}>
          {getMatchBadge()}
        </Center>
        
        <Flex justify="space-between" align="center" h="32px">
          <Badge 
            colorScheme={getDimensionColor(content.learningStyle?.dimension)}
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="full"
            isTruncated
            maxW="110px"
          >
            {content.learningStyle?.category || content.contentType}
          </Badge>
          
          <Text fontSize="xs" color="gray.500" isTruncated maxW="140px">
            Source: {content.source}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
};

const SuggestionPanel = ({ selectedElement, currentGDTAStructureId, onLoadingChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [lastGDTAStructureId, setLastGDTAStructureId] = useState(null);
  
  const [selectedContent, setSelectedContent] = useState(null);
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  
  const toast = useToast();

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    if (selectedElement) {
      // Non carichiamo più la cache automaticamente
      // L'utente deve cliccare "Suggest Content" per ottenere i suggerimenti
      setSuggestions([]);
      setFilteredSuggestions([]);
      setActiveFilters([]);
    } else {
      setSuggestions([]);
      setFilteredSuggestions([]);
      setActiveFilters([]);
    }
  }, [selectedElement]);

  const handlePreview = (content) => {
    setSelectedContent(content);
    onPreviewOpen();
  };
  
  const handleModalClose = () => {
    setSelectedContent(null);
    onPreviewClose();
  };

  const getPreviewUrl = (content) => {
    if (!content || !content.url) return '';
    
    if (content.url.startsWith('/') || content.url.startsWith('file://')) {
      let fileName;
      
      if (content.url.startsWith('/media/')) {
        fileName = content.url.replace('/media/', '');
      } else if (content.url.startsWith('/')) {
        fileName = content.url.substring(1);
      } else {
        fileName = content.url.split('/').pop();
      }
      
      return `http://localhost:8080/media/${fileName}`;
    }
    
    return content.url;
  };
  
  const isLocalFile = (content) => {
    if (!content || !content.url) return false;
    return content.url.startsWith('/') || content.url.startsWith('file://');
  };
  
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    let videoId = '';
    
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const isImageFile = (url) => {
    if (!url) return false;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const fileExtension = url.toLowerCase().split('.').pop();
    return imageExtensions.includes(fileExtension);
  };

  useEffect(() => {
    if (currentGDTAStructureId !== lastGDTAStructureId) {
      setSuggestions([]);
      setFilteredSuggestions([]);
      setActiveFilters([]);
      setError(null);
      setLastGDTAStructureId(currentGDTAStructureId);
    }
  }, [currentGDTAStructureId, lastGDTAStructureId]);

  useEffect(() => {
    if (activeFilters.length === 0) {
      setFilteredSuggestions(suggestions);
    } else {
      setFilteredSuggestions(
        suggestions.filter(item => 
          activeFilters.includes(item.learningStyle?.dimension) ||
          activeFilters.includes(item.contentType)
        )
      );
    }
  }, [suggestions, activeFilters]);
  
  const handleAutoSuggest = async () => {
    if (!selectedElement) {
      toast({
        title: 'Warning',
        description: 'First select a GDTA element',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:8080/api/recommendations/suggestions', {
        gdtaElement: {
          id: selectedElement.id,
          title: selectedElement.title,
          description: selectedElement.description,
          type: selectedElement.type,
          level: selectedElement.level
        }
      });
      
      setSuggestions(response.data);
      setFilteredSuggestions(response.data);
      setActiveFilters([]);
      
      if (response.data.length > 0) {
        toast({
          title: 'Suggestions calculated',
          description: `Found ${response.data.length} relevant microcontents`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'No suggestions',
          description: 'No microcontents found for this element',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error retrieving suggestions:', error);
      setError('Unable to retrieve suggestions');
      
      toast({
        title: 'Error',
        description: 'Error retrieving suggestions',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleFilter = (dimension) => {
    if (activeFilters.includes(dimension)) {
      setActiveFilters(activeFilters.filter(d => d !== dimension));
    } else {
      setActiveFilters([...activeFilters, dimension]);
    }
  };
  
  const getDimensionIcon = (dimension) => {
    switch(dimension) {
      case 'Processing':
        return FaBrain;
      case 'Perception':
        return FaEye;
      case 'Input':
        return FaKeyboard;
      case 'Understanding':
        return FaProjectDiagram;
      default:
        return FaBrain;
    }
  };
  
  const getElementBadge = () => {
    if (!selectedElement) return null;
    
    switch(selectedElement.type) {
      case 'overallGoal':
        return <Badge colorScheme="purple">Overall Goal</Badge>;
      case 'goal':
        return <Badge colorScheme="red">Goal</Badge>;
      case 'subgoal':
        return <Badge colorScheme="green">Subgoal</Badge>;
      case 'requirement':
        if (selectedElement.level === 1) {
          return <Badge colorScheme="blue">Level 1: Acquire</Badge>;
        } else if (selectedElement.level === 2) {
          return <Badge colorScheme="teal">Level 2: Make Meaning</Badge>;
        } else if (selectedElement.level === 3) {
          return <Badge colorScheme="cyan">Level 3: Transfer</Badge>;
        }
        return <Badge colorScheme="blue">Requirement</Badge>;
      default:
        return <Badge>Element</Badge>;
    }
  };
  
  const getScoringMode = () => {
    if (!selectedElement) return null;
    return selectedElement.type === 'requirement' ? 'HYBRID' : 'SEMANTIC_ONLY';
  };
  
  const getScoringBadge = () => {
    const mode = getScoringMode();
    if (!mode) return null;
    
    return (
      <Badge 
        colorScheme={mode === 'HYBRID' ? 'green' : 'blue'}
        variant="outline"
        fontSize="xs"
      >
        {mode === 'HYBRID' ? 'HYBRID Scoring' : 'SEMANTIC Scoring'}
      </Badge>
    );
  };
  
  const renderPreviewContent = () => {
    if (!selectedContent || !selectedContent.url) {
      return (
        <Center h="200px">
          <Text color="gray.500">Content not available</Text>
        </Center>
      );
    }
    
    const previewUrl = getPreviewUrl(selectedContent);
    const isLocal = isLocalFile(selectedContent);
    const fileExtension = selectedContent.url ? selectedContent.url.toLowerCase().split('.').pop() : '';
    
    if (selectedContent.url && (selectedContent.url.includes('youtube.com') || selectedContent.url.includes('youtu.be'))) {
      const embedUrl = getYouTubeEmbedUrl(selectedContent.url);
      return (
        <Box>
          <iframe
            src={embedUrl}
            width="100%"
            height="400"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={selectedContent.title}
          />
        </Box>
      );
    }
    
    
    if (isImageFile(selectedContent.url)) {
      return (
        <Box>
          <Center mb={4}>
            <Text textAlign="center" fontWeight="bold" fontSize="lg">
              {selectedContent.title}
            </Text>
          </Center>
          
          <Center>
            <Image
              src={previewUrl}
              alt={selectedContent.title}
              maxW="100%"
              maxH="500px"
              objectFit="contain"
              borderRadius="md"
              boxShadow="lg"
              fallback={
                <Center h="300px" bg="gray.100" borderRadius="md">
                  <VStack spacing={3}>
                    <Icon as={FaImage} boxSize={16} color="gray.400" />
                    <Text color="gray.500">Image could not be loaded</Text>
                  </VStack>
                </Center>
              }
              onError={(e) => {
                console.error('Image loading error:', e);
                toast({
                  title: 'Image loading error',
                  description: 'Unable to load the image',
                  status: 'error',
                  duration: 3000,
                });
              }}
            />
          </Center>
          
          {isLocal && (
            <Center mt={4}>
              <Button
                leftIcon={<DownloadIcon />}
                colorScheme="blue"
                size="lg"
                onClick={() => {
                  const filename = previewUrl.split('/').pop();
                  const downloadUrl = `http://localhost:8080/media/download/${filename}`;
                  
                  const link = document.createElement('a');
                  link.href = downloadUrl;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  toast({
                    title: 'Download started',
                    description: 'Image download has been initiated',
                    status: 'success',
                    duration: 2000,
                  });
                }}
              >
                Download Image
              </Button>
            </Center>
          )}
          
          <Center mt={2}>
            <Text fontSize="sm" color="gray.500">
              File: {previewUrl.split('/').pop()}
            </Text>
          </Center>
        </Box>
      );
    }
    
    if (fileExtension === 'wav' || fileExtension === 'mp3' || fileExtension === 'ogg') {
      return (
        <Box>
          <Center mb={4}>
            <Icon as={FaMusic} boxSize={12} color="purple.500" />
          </Center>
          
          <Text textAlign="center" fontWeight="bold" mb={4}>
            {selectedContent.title}
          </Text>
          
          <audio 
            controls 
            preload="metadata"
            style={{ width: '100%', height: '60px' }}
          >
            <source src={previewUrl} />
            Your browser does not support audio.
          </audio>
          
          <Center mt={4}>
            <Text fontSize="sm" color="gray.500">
              File: {previewUrl.split('/').pop()}
            </Text>
          </Center>
        </Box>
      );
    }
    
    if (fileExtension === 'pdf') {
      return (
        <Box>
          <iframe
            src={previewUrl}
            width="100%"
            height="500"
            frameBorder="0"
            title={selectedContent.title}
            style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
          />
          
          <Center mt={4}>
            <Button
              leftIcon={<ExternalLinkIcon />}
              colorScheme="red"
              variant="outline"
              onClick={() => {
                window.open(previewUrl, '_blank');
                toast({
                  title: 'PDF opened',
                  description: 'PDF opened in new window',
                  status: 'success',
                  duration: 2000,
                });
              }}
            >
              Open in new window
            </Button>
          </Center>
        </Box>
      );
    }
    
    if (isLocal) {
      return (
        <Center h="300px">
          <VStack spacing={4}>
            <Icon as={FaFileWord} boxSize={16} color="blue.500" />
            <Text fontWeight="bold" fontSize="lg">
              {selectedContent.title}
            </Text>
            <Button
              leftIcon={<DownloadIcon />}
              colorScheme="blue"
              size="lg"
              onClick={() => {
                const link = document.createElement('a');
                link.href = previewUrl;
                link.download = previewUrl.split('/').pop();
                link.click();
                
                toast({
                  title: 'Download started',
                  description: 'File has been downloaded',
                  status: 'success',
                  duration: 2000,
                });
              }}
            >
              Download File
            </Button>
          </VStack>
        </Center>
      );
    }
    
    return (
      <Box>
        <iframe
          src={previewUrl}
          width="100%"
          height="500"
          frameBorder="0"
          title={selectedContent.title}
        />
      </Box>
    );
  };
  
  return (
    <Box>
      <Heading size="md" mb={4} color="blue.600">Microcontent Suggestions</Heading>
      
      <Box 
        mb={4} 
        p={4} 
        borderRadius="md" 
        bg="blue.50" 
        borderWidth="1px" 
        borderColor="blue.200"
      >
        {selectedElement ? (
          <VStack align="stretch" spacing={3}>
            <HStack spacing={3}>
              {getElementBadge()}
              <Text fontWeight="bold">{selectedElement.title}</Text>
            </HStack>
            
            
            <Box>
              {getScoringBadge()}
            </Box>
            
            <Button 
              colorScheme="blue" 
              size="sm"
              onClick={handleAutoSuggest}
              leftIcon={<StarIcon />}
              isLoading={isLoading}
              loadingText="Analyzing..."
            >
              {suggestions.length > 0 ? 'Recalculate' : 'Suggest Content'}
            </Button>

            {suggestions.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Filter by FSLSM dimension:</Text>
                <Wrap spacing={2}>
                  <WrapItem>
                    <Tag 
                      size="md" 
                      colorScheme={activeFilters.includes('Processing') ? "purple" : "gray"} 
                      variant={activeFilters.includes('Processing') ? "solid" : "outline"}
                      cursor="pointer"
                      onClick={() => toggleFilter('Processing')}
                    >
                      <Icon as={getDimensionIcon('Processing')} mr={1} />
                      <TagLabel>Processing</TagLabel>
                    </Tag>
                  </WrapItem>
                  <WrapItem>
                    <Tag 
                      size="md" 
                      colorScheme={activeFilters.includes('Perception') ? "orange" : "gray"} 
                      variant={activeFilters.includes('Perception') ? "solid" : "outline"}
                      cursor="pointer"
                      onClick={() => toggleFilter('Perception')}
                    >
                      <Icon as={getDimensionIcon('Perception')} mr={1} />
                      <TagLabel>Perception</TagLabel>
                    </Tag>
                  </WrapItem>
                  <WrapItem>
                    <Tag 
                      size="md" 
                      colorScheme={activeFilters.includes('Input') ? "blue" : "gray"} 
                      variant={activeFilters.includes('Input') ? "solid" : "outline"}
                      cursor="pointer"
                      onClick={() => toggleFilter('Input')}
                    >
                      <Icon as={getDimensionIcon('Input')} mr={1} />
                      <TagLabel>Input</TagLabel>
                    </Tag>
                  </WrapItem>
                  <WrapItem>
                    <Tag 
                      size="md" 
                      colorScheme={activeFilters.includes('Understanding') ? "green" : "gray"} 
                      variant={activeFilters.includes('Understanding') ? "solid" : "outline"}
                      cursor="pointer"
                      onClick={() => toggleFilter('Understanding')}
                    >
                      <Icon as={getDimensionIcon('Understanding')} mr={1} />
                      <TagLabel>Understanding</TagLabel>
                    </Tag>
                  </WrapItem>
                </Wrap>
              </Box>
            )}
          </VStack>
        ) : (
          <HStack spacing={3}>
            <Icon as={InfoIcon} color="blue.500" boxSize={6} />
            <Text>
              Select a GDTA element to receive personalized microcontent suggestions.
            </Text>
          </HStack>
        )}
      </Box>
      
      <Box maxH="350px" overflowY="auto" pr={2}>
        {isLoading ? (
          <Center h="150px">
            <VStack spacing={3}>
              <Spinner color="blue.500" size="xl" thickness="4px" />
              <Text color="blue.600">Searching content...</Text>
            </VStack>
          </Center>
        ) : error ? (
          <Box bg="red.50" p={3} borderRadius="md" color="red.500">
            {error}
          </Box>
        ) : filteredSuggestions.length > 0 ? (
          <VStack spacing={3} align="stretch">
            {filteredSuggestions.map((content, index) => (
              <DraggableMicroContent 
                key={content._id} 
                content={content}
                onPreview={handlePreview}
                selectedElement={selectedElement}
                rankPosition={index + 1}
              />
            ))}
          </VStack>
        ) : suggestions.length > 0 ? (
          <Box p={4} bg="yellow.50" borderRadius="md" textAlign="center">
            <Text color="yellow.600">
              No content matches selected filters.
            </Text>
          </Box>
        ) : (
          <Center h="150px" bg="gray.50" borderRadius="md" p={5}>
            <VStack spacing={3}>
              <Icon as={StarIcon} color="blue.300" boxSize={10} />
              <Text color="gray.500" textAlign="center">
                Press "Suggest Content" to view relevant microcontents.
              </Text>
            </VStack>
          </Center>
        )}
      </Box>
      
      
      <Modal isOpen={isPreviewOpen} onClose={handleModalClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            <HStack spacing={3}>
              <Icon 
                as={selectedContent?.contentType === 'video' ? FaVideo : 
                   selectedContent?.contentType === 'audio' ? FaMusic :
                   selectedContent?.contentType === 'image' ? FaImage :
                   selectedContent?.contentType === 'quiz' ? FaQuestion : FaFileAlt} 
                color="blue.500" 
              />
              <Text>{selectedContent?.title}</Text>
              <Badge colorScheme="blue">
                {selectedContent?.learningStyle?.dimension} - {selectedContent?.learningStyle?.category}
              </Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {selectedContent && (
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="gray.600">
                  {selectedContent.description}
                </Text>
                
                <HStack justify="space-between">
                  <Text fontSize="sm">
                    <Text as="span" fontWeight="bold">Source:</Text> {selectedContent.source}
                  </Text>
                  <Text fontSize="sm">
                    <Text as="span" fontWeight="bold">Duration:</Text> {selectedContent.duration}
                  </Text>
                  <Text fontSize="sm">
                    <Text as="span" fontWeight="bold">Difficulty:</Text> {selectedContent.difficulty}
                  </Text>
                </HStack>
                
                <Divider />
                
                {renderPreviewContent()}
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SuggestionPanel;