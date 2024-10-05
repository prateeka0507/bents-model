import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ArrowRight, PlusCircle, Search, Send, HelpCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import YouTube from 'react-youtube';
import { Button } from "@/components/ui/button";

// Initial questions
const initialQuestions = [
  "What are the 10 most recommended woodworking tools?",
  "Suggest me some shop layout tips?",
  "What are the benefits of LR32 system for cabinetry?",
];

// Function to extract YouTube video ID from URL
const getYoutubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function Chat({ isVisible }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showInitialQuestions, setShowInitialQuestions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingQuestionIndex, setLoadingQuestionIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState("bents");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const latestConversationRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Assume we have a userId for the current user
  const userId = "user123"; // This should be dynamically set based on your authentication system

  useEffect(() => {
    // Check if this is a new page load or a refresh
    const isNewPageLoad = !sessionStorage.getItem('isPageLoaded');
    
    if (isNewPageLoad) {
      // This is a new page load (refresh), clear session storage and reset state
      sessionStorage.clear();
      sessionStorage.setItem('isPageLoaded', 'true');
      setConversations([]);
      setSearchHistory([]);
      setSelectedIndex("bents");
      setShowInitialQuestions(true);
      setIsInitialized(true);
    } else {
      // This is navigation between pages, try to load data from session storage
      const storedData = sessionStorage.getItem('chatData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setConversations(parsedData.conversations || []);
        setSearchHistory(parsedData.searchHistory || []);
        setSelectedIndex(parsedData.selectedIndex || "bents");
        setShowInitialQuestions(parsedData.conversations.length === 0);
        setIsInitialized(true);
      } else {
        // If no stored data, set initial state
        setConversations([]);
        setSearchHistory([]);
        setSelectedIndex("bents");
        setShowInitialQuestions(true);
        setIsInitialized(true);
      }
    }
  }, []);

  useEffect(() => {
    // Save data to session storage whenever it changes
    if (isInitialized) {
      sessionStorage.setItem('chatData', JSON.stringify({
        conversations,
        searchHistory,
        selectedIndex
      }));
    }
  }, [conversations, searchHistory, selectedIndex, isInitialized]);

  useEffect(() => {
    if (!isVisible && isSearching) {
      // If the chat is not visible but a search is in progress,
      // you might want to show a notification or update the UI somehow
      console.log('Search in progress while Chat is not visible');
    }
  }, [isVisible, isSearching]);

  const scrollToLatestConversation = () => {
    if (latestConversationRef.current) {
      latestConversationRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearch = async (e, initialQuestionIndex = null) => {
    e.preventDefault();
    
    const query = initialQuestionIndex !== null ? initialQuestions[initialQuestionIndex] : searchQuery;
    if (!query.trim() || isSearching) return;
    
    setIsSearching(true);
    setIsLoading(true);
    if (initialQuestionIndex !== null) {
      setLoadingQuestionIndex(initialQuestionIndex);
    }
    
    try {
      const response = await axios.post('https://bents-model-backend.vercel.app/chat', {
        message: query,
        selected_index: selectedIndex,
        chat_history: conversations.flatMap(conv => [conv.question, conv.initial_answer || conv.text])
      }, {
        timeout: 60000 // 60 seconds timeout
      });
      
      const newConversation = {
        question: query,
        text: response.data.response,
        initial_answer: response.data.initial_answer,
        video: response.data.url,
        products: response.data.related_products,
        videoLinks: response.data.video_links
      };
      setConversations(prevConversations => [...prevConversations, newConversation]);
      setSearchHistory(prevHistory => [...prevHistory, query]);
      setShowInitialQuestions(false);
      setSearchQuery("");
      
      if (isVisible) {
        setTimeout(scrollToLatestConversation, 100);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
    } finally {
      setIsLoading(false);
      setLoadingQuestionIndex(null);
      setIsSearching(false);
    }
  };

  const handleNewConversation = () => {
    setConversations([]);
    setShowInitialQuestions(true);
  };

  const renderVideo = (video, videoLinks) => {
    const videoId = getYoutubeVideoId(video);
    if (videoId) {
      return (
        <div className="float-right ml-4 mb-2 w-full sm:w-1/2 md:w-1/3">
          <YouTube
            videoId={videoId}
            opts={{
              height: '195',
              width: '320',
              playerVars: {
                autoplay: 0,
              },
            }}
          />
        </div>
      );
    }
    return null;
  };

  const formatResponse = (text, videoLinks) => {
    // Replace timestamps with hyperlinks
    let formattedText = text.replace(/\[video(\d+)\]/g, (match, p1) => {
      const link = videoLinks[`[video${p1}]`];
      return link ? `<a href="${link}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">Video</a>` : match;
    });
    
    // Format numbered bold text, including colon on the same line, and move content to next line
    formattedText = formattedText.replace(/(\d+)\.\s*\*\*(.*?)\*\*(:?)\s*([-\s]*)(.+)/g, (match, number, title, colon, dash, content) => {
      return `<div class="font-bold mt-2 mb-1">${number}. ${title}${colon}</div><div class="ml-4">${dash}${content}</div>`;
    });
    
    // Remove ****timestamp**** before the time stamp video link
    formattedText = formattedText.replace(/\*\*\*\*timestamp\*\*\*\*\s*(\[video\d+\])/g, '$1');
    
    // Make headings and sub-headings bold if they start with **
    formattedText = formattedText.replace(/^(\#{1,6})\s*\*\*(.*?)\*\*/gm, '$1 <strong>$2</strong>');
    
    return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  const renderDropdownMenu = () => (
    <div className="absolute bottom-full left-0 mb-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
        {[
          { value: "bents", label: "All" },
          { value: "shop-improvement", label: "Shop Improvement" },
          { value: "tool-recommendations", label: "Tool Recommendations" }
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setSelectedIndex(option.value);
              setIsDropdownOpen(false);
            }}
            className={`block px-4 py-2 text-sm w-full text-left ${
              selectedIndex === option.value
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Main content */}
      <div className="flex-grow overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <h2 className="text-3xl font-bold mb-8">A question creates knowledge</h2>
            
            {/* Initial Search bar */}
            <form onSubmit={handleSearch} className="w-full max-w-2xl mb-8">
              <div className="relative flex items-center">
                <div className="absolute left-2 flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="mr-2"
                    onClick={handleNewConversation}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={selectedIndex !== "bents" ? "bg-blue-500 text-white" : ""}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                    {isDropdownOpen && renderDropdownMenu()}
                  </div>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full p-6 pl-28 pr-14 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                />
                <button
                  type="submit"
                  className="absolute right-2 text-gray-400"
                  disabled={isSearching || isLoading || !searchQuery.trim()}
                >
                  {isSearching || isLoading ? (
                    <span className="animate-spin">⌛</span>
                  ) : (
                    <ArrowRight size={24} />
                  )}
                </button>
              </div>
            </form>

            {/* Initial questions */}
            {showInitialQuestions && (
              <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {initialQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={(e) => handleSearch(e, index)}
                    className="p-4 border rounded-lg hover:bg-gray-100 text-center h-full flex items-center justify-center transition-colors duration-200 ease-in-out relative"
                    disabled={isSearching || isLoading || loadingQuestionIndex !== null}
                  >
                    {loadingQuestionIndex === index ? (
                      <span className="animate-spin absolute">⌛</span>
                    ) : (
                      <span>{question}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Conversations */}
            <div className="flex-grow overflow-y-auto p-4">
              {conversations.map((conv, index) => (
                <div 
                  key={index} 
                  className="bg-white p-4 rounded-lg shadow mb-4"
                  ref={index === conversations.length - 1 ? latestConversationRef : null}
                >
                  <h2 className="font-bold mb-4">{conv.question}</h2>
                  
                  {/* Related Products */}
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Related Products</h3>
                    {conv.products && conv.products.length > 0 ? (
                      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:gap-2">
                        {conv.products.map((product, pIndex) => (
                          <Link 
                            key={pIndex} 
                            to={product.link} 
                            className="flex-shrink-0 bg-gray-100 rounded-lg p-2 flex items-center justify-between mr-2 sm:mr-0 sm:w-auto min-w-[200px] sm:min-w-0"
                          >
                            <span className="font-medium">{product.title}</span>
                            <ChevronRight size={20} className="ml-2 text-gray-500" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No related products available at the moment.</p>
                    )}
                  </div>

                  {/* Answer and Video */}
                  <div className="mb-4">
                    {renderVideo(conv.video, conv.videoLinks)}
                    {formatResponse(conv.text, conv.videoLinks)}
                  </div>
                  <div className="clear-both"></div>
                </div>
              ))}
            </div>

            {/* Search Bar for non-empty conversations */}
            <div className="p-4 bg-gray-100">
              <form onSubmit={handleSearch} className="flex items-center w-full max-w-2xl mx-auto">
                <div className="flex mr-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="mr-2"
                    onClick={handleNewConversation}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <div className="relative">
<Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={selectedIndex !== "bents" ? "bg-blue-500 text-white" : ""}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                    {isDropdownOpen && renderDropdownMenu()}
                  </div>
                </div>
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full p-2 pl-4 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  className="bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 ml-2"
                  disabled={isSearching || isLoading || !searchQuery.trim()}
                >
                  {isSearching || isLoading ? (
                    <span className="animate-spin">⌛</span>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
