import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ArrowRight, PlusCircle, Menu, ChevronRight, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import YouTube from 'react-youtube';

// Initial questions
const initialQuestions = [
  "10 woodworking tools ?",
  "Explain the shop layout tips ?",
  "LR 32 benefits for cabinets ?"
];

// Function to extract YouTube video ID from URL
const getYoutubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function Chat() {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showInitialQuestions, setShowInitialQuestions] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingQuestionIndex, setLoadingQuestionIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState("bents");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const sidebarRef = useRef(null);
  const hamburgerRef = useRef(null);
  const latestConversationRef = useRef(null);

  // Assume we have a userId for the current user
  const userId = "user123"; // This should be dynamically set based on your authentication system

  useEffect(() => {
    // Check if this is a new page load or a refresh
    const isNewPageLoad = !sessionStorage.getItem('isPageLoaded');
    
    if (isNewPageLoad) {
      // This is a new page load (refresh), clear local storage
      localStorage.removeItem('chatData');
      sessionStorage.setItem('isPageLoaded', 'true');
    } else {
      // This is navigation between pages, try to load data from local storage
      const storedData = localStorage.getItem('chatData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setConversations(parsedData.conversations || []);
        setSearchHistory(parsedData.searchHistory || []);
        setSelectedIndex(parsedData.selectedIndex || "bents");
        setShowInitialQuestions(parsedData.conversations.length === 0);
        setIsInitialized(true);
        return; // Exit early as we've loaded the data
      }
    }

    // If no stored data or it's a refresh, fetch from the server
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`https://bents-model-backend.vercel.app/api/user/${userId}`);
        const userData = response.data;
        if (userData) {
          setConversations(userData.conversations || []);
          setSearchHistory(userData.searchHistory || []);
          setSelectedIndex(userData.selectedIndex || "bents");
          setShowInitialQuestions(userData.conversations.length === 0);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsInitialized(true);
      }
    };

    fetchUserData();
  }, [userId]);

  useEffect(() => {
    // Save data to local storage whenever it changes
    if (isInitialized) {
      localStorage.setItem('chatData', JSON.stringify({
        conversations,
        searchHistory,
        selectedIndex
      }));
    }
  }, [conversations, searchHistory, selectedIndex, isInitialized]);

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
        chat_history: conversations.flatMap(conv => [conv.question, conv.text])
      });
      
      const newConversation = {
        question: query,
        text: response.data.response,
        video: response.data.url,
        products: response.data.related_products,
        videoLinks: response.data.video_links
      };
      setConversations(prevConversations => [...prevConversations, newConversation]);
      setSearchHistory(prevHistory => [...prevHistory, query]);
      setShowInitialQuestions(false);
      setSearchQuery("");
      
      setTimeout(scrollToLatestConversation, 100);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) &&
          hamburgerRef.current && !hamburgerRef.current.contains(event.target)) {
        setShowSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    } else if (videoLinks && Object.keys(videoLinks).length > 0) {
      return (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Related Video Links:</h3>
          <ul>
            {Object.entries(videoLinks).map(([key, link], index) => (
              <li key={index}>
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {key}
                </a>
              </li>
            ))}
          </ul>
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
    
    // New formatting: Align text enclosed in asterisks on a new line and treat as heading
    formattedText = formattedText.replace(/\*\*\*\*(.*?)\*\*\*\*:/g, '\n<h3 class="font-bold mt-4 mb-2">$1</h3>\n');
    
    return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="bg-white p-4 flex justify-between items-center border-b">
        <div 
          ref={hamburgerRef}
          className="text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <Menu size={24} />
        </div>
        <h1 className="text-xl font-bold">Woodworking Assistant</h1>
        <div className="w-6"></div>
      </header>

      {/* Sidebar */}
      {showSidebar && (
        <div 
          ref={sidebarRef}
          className="fixed top-0 left-0 w-64 bg-white p-4 shadow-lg z-20 h-full mt-7"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Menu</h2>
            <button onClick={() => setShowSidebar(false)} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <button
            onClick={handleNewConversation}
            className="flex items-center justify-center bg-blue-500 text-white py-2 px-4 rounded-lg mb-4 hover:bg-blue-600 w-full"
          >
            <PlusCircle className="mr-2" size={20} />
            New Conversation
          </button>
          <div className="mb-4">
            <label htmlFor="index-select" className="block mb-2">Select Index:</label>
            <select
              id="index-select"
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="bents">All</option>
              <option value="shop-improvement">Shop Improvement</option>
              <option value="tool-recommendations">Tool Recommendations</option>
            </select>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            <h3 className="font-semibold mb-2">Search History</h3>
            {searchHistory.map((query, index) => (
              <div key={index} className="py-2 px-3 hover:bg-gray-100 cursor-pointer rounded">
                {query}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-grow overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <h2 className="text-3xl font-bold mb-8">A question creates knowledge</h2>
            
            {/* Initial Search bar with increased height and grey background */}
            <form onSubmit={handleSearch} className="w-full max-w-2xl mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full p-6 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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

            {/* Initial questions in equal boxes */}
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
          <div className="p-4">
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
        )}
      </div>

      {/* Search Bar for non-empty conversations */}
      {conversations.length > 0 && (
        <div className="p-4 bg-gray-100">
          <form onSubmit={handleSearch} className="flex items-center w-full max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask a question..."
              className="flex-grow p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600"
              disabled={isSearching || isLoading || !searchQuery.trim()}
            >
              {isSearching || isLoading ? (
                <span className="animate-spin">⌛</span>
              ) : (
                <Search size={20} />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
