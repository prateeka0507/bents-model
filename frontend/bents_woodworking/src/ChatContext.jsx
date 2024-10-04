import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
const ChatContext = createContext();
export const useChatContext = () => useContext(ChatContext);
export const ChatProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showInitialQuestions, setShowInitialQuestions] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState("bents");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingQuery, setPendingQuery] = useState(null);
  const userId = "user123"; // This should be dynamically set based on your authentication system
  useEffect(() => {
    const storedData = localStorage.getItem('chatData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setConversations(parsedData.conversations || []);
      setSearchHistory(parsedData.searchHistory || []);
      setSelectedIndex(parsedData.selectedIndex || "bents");
      setShowInitialQuestions(parsedData.conversations.length === 0);
      setPendingQuery(parsedData.pendingQuery || null);
      setIsInitialized(true);
    } else {
      fetchUserData();
    }
  }, []);
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('chatData', JSON.stringify({
        conversations,
        searchHistory,
        selectedIndex,
        pendingQuery
      }));
    }
  }, [conversations, searchHistory, selectedIndex, pendingQuery, isInitialized]);
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
  const handleSearch = async (query) => {
    if (!query.trim() || isSearching) return;
    setIsSearching(true);
    try {
      const response = await axios.post('https://bents-model-backend.vercel.app/chat', {
        message: query,
        selected_index: selectedIndex,
        chat_history: conversations.flatMap(conv => [conv.question, conv.text])
      }, {
        timeout: 30000 // 30 seconds timeout
      });
      const newConversation = {
        question: query,
        text: response.data.response,
        videos: response.data.urls,
        products: response.data.related_products,
        videoLinks: response.data.video_links,
        videoTitles: response.data.video_titles
      };
      setConversations(prevConversations => [...prevConversations, newConversation]);
      setSearchHistory(prevHistory => [...prevHistory, query]);
      setShowInitialQuestions(false);
      setSearchQuery("");
      setPendingQuery(null);
    } catch (error) {
      console.error("Error fetching response:", error);
      setPendingQuery(query);
    } finally {
      setIsSearching(false);
    }
  };
  const handleNewConversation = () => {
    setConversations([]);
    setShowInitialQuestions(true);
  };
  const value = {
    searchQuery,
    setSearchQuery,
    conversations,
    searchHistory,
    showInitialQuestions,
    selectedIndex,
    setSelectedIndex,
    isSearching,
    pendingQuery,
    handleSearch,
    handleNewConversation
  };
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};











