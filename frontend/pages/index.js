import axios from 'axios';
import React, { useState, useRef } from 'react';
require('dotenv').config();



const Home = () => {
    const mockSuggestions = [
        { name: 'Chicken Soup' },
        { name: 'Tomato Pasta' },
        { name: 'Caesar Salad' },
      ];
    const inputBlurred = useRef(false);
    const [recipe, setRecipe] = useState('');
    const [suggestions, setSuggestions] = useState(mockSuggestions);
    const [playlist, setPlaylist] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    const handleSuggestionClick = (suggestionName) => {
        setRecipe(suggestionName);
        setIsTyping(false);
    };

    const handleInputChange = (event) => {
        const input = event.target.value;
        setRecipe(input);

        if (input.length >= 3) {
            const filteredSuggestions = mockSuggestions.filter(suggestion =>
                suggestion.name.toLowerCase().includes(input.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
            setIsTyping(true);
        } else {
            setSuggestions([]); 
            setIsTyping(false); 
        }

        axios
         .get(`https://api.spoonacular.com/food/menuItems/suggest?query=${input}&number=5&apiKey=${process.env.SPOONACULAR_API_KEY}`)
         .then((response) => {
            setSuggestions(response.data.results);
         }) 
          .catch((error) => {
            console.error('Couldn\'t fetch autocomplete suggestions', error);
            setSuggestions([]);
          });
    };
    
    const handleInputFocus = () => {
        if (recipe.length >= 3) {
            setIsTyping(true);
        }
    };
    
    const handleInputBlur = () => {
        inputBlurred.current = true;
        setTimeout(() => {
            if (inputBlurred.current) {
                setIsTyping(false);
            }
        }, 200); 
    };

    const handleSuggestionMouseDown = (event) => {
        event.preventDefault(); 
        handleSuggestionClick(event.currentTarget.textContent); 
    };

    const handleClear = () => {
        setRecipe(''); 
        setSuggestions([]); 
        setIsTyping(false); 
    };

return (
    <div className="flex flex-col pt-3 w-full items-center h-screen"> 
        <h1 className="font-jost text-6xl font-black">Food2Play</h1>
        <p3 className="text-xs mb-4">A fun way to discover new music, through delicious recipes.</p3>
        <div className="mb-4"> 
            <input 
            type="text"
            value={recipe}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            placeholder="Enter a dish here:"
            className="border-2 border-gray-300 mt-4 p-2 rounded-md"
            />
            {isTyping && suggestions.length > 0 && ( 
                <ul 
                className="absolute z-10 list-none bg-white shadow-lg rounded-md">
                    {suggestions.map((suggestion, index) => (
                            <li key={index} 
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onMouseDown={handleSuggestionMouseDown}
                                onClick={() => handleSuggestionClick(suggestion.name)}
                            >
                                {suggestion.name}
                          </li>
                    ))}
                </ul>
            )}
        </div>
        <div className = "space-x-4">
            <button className="bg-blue-500 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded">
                Generate!
            </button>
            <button className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
            onClick={handleClear}>
                Clear Entry 
            </button>
        </div>
    </div>
);

}


export default Home;
