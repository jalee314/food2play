import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';

const Home = () => {
    const inputBlurred = useRef(false);
    const [recipeId, setRecipeId] = useState(null);
    const [recipe, setRecipe] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [playlist, setPlaylist] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const SPOTIFY_AUTHORIZE_ENDPOINT = "https://accounts.spotify.com/authorize";
    const CLIENT_ID = "6130ac606c11457392c64da9eb0cc4d4";
    const REDIRECT_URI = encodeURIComponent("http://localhost:3000/callback");
    const SCOPES = encodeURIComponent("playlist-modify-public");

    const fetchIngredients = async (recipeId) => { //get data ready for playlist generation
        try {
          const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/ingredientWidget.json`, {
            params: {
              apiKey: `6238889567e643dda87f9cc0bc46fd4f`
            },
          });
          const ingredients = response.data.ingredients.map((ingredient) => ({
            name: ingredient.name,
            amount: ingredient.amount.us.value,
            unit: ingredient.amount.us.unit,
          }));
          searchSpotifyForIngredients(ingredients);
        } catch (error) {
          console.error('Error fetching ingredients', error);
        }
      };
    
     const unitName = {
        'tbsp': 'tablespoon',
        'tsp': 'teaspoon',
    };
    

    const searchSpotifyForIngredients = async (ingredients) => { //goes through spotify songs and picks songs with song titles most relevant (THIS IS BROKEN WHY IS IT NOT WORKING AHHHHHHH)
        const tracks = [];
        const accessToken = getAccessToken();
      
        for (const ingredient of ingredients) {
          // Search for a song for the quantity
          const quantityTrackUri = await searchSpotify(accessToken, ingredient.amount.toString());
          if (quantityTrackUri) tracks.push(quantityTrackUri);
      
          // Search for a song for the unit
          const wordUnit = unitName[ingredient.unit.toLowerCase()] || ingredient.unit;
          const unitTrackUri = await searchSpotify(accessToken, wordUnit);
          if (unitTrackUri) tracks.push(unitTrackUri);
      
          // Search for a song for the ingredient name
          const nameTrackUri = await searchSpotify(accessToken, ingredient.name);
          if (nameTrackUri) tracks.push(nameTrackUri);
        }
        setPlaylist(tracks);
    }; 

    const searchSpotify = async (accessToken, query) => {
        try {
          const response = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            params: {
              q: `*${query}*`,
              type: 'track',
              limit: 1,
            },
          });
      
          const tracks = response.data.tracks.items;
          if (tracks.length > 0) {
            return tracks[0].uri;
          }
        } catch (error) {
          console.error(`Error searching for track: ${query}`, error);
        }
        return null;
    };

    const getAccessToken = async () => {
        const clientId = '6130ac606c11457392c64da9eb0cc4d4';
        const clientSecret = '9eb51b46e0924264beae2d54b3e3ef5c'; // FATHER FORGIVE ME AGAIN I HAVE SINNED
      
        try {
          const response = await axios.post('https://accounts.spotify.com/api/token', 
            new URLSearchParams({
              'grant_type': 'client_credentials'
            }), {
            headers: {
              'Authorization': `Basic ${btoa(clientId + ':' + clientSecret)}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
          });
      
          return response.data.access_token;
        } catch (error) {
          console.error('Error obtaining access token', error);
        }
    };

    const generatePlaylist = async () => {
        if (!recipeId) {
            alert('Please select a recipe first.');
            return;
        }
    
        const accessToken = await getAccessToken(); 
        if (!accessToken) {
            alert('Failed to get access token');
            return;
        }
    
        try {
            await fetchIngredients(recipeId);
    
            const playlistName = `Food2Play ${recipe} Playlist`;
            const spotifyUserId = '31x7s7aqmzuk22cvadk5scwkfvte';
            const playlistResponse = await axios.post(
                `https://api.spotify.com/v1/users/${spotifyUserId}/playlists`,
                { name: playlistName, public: false },
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
    
            const playlistId = playlistResponse.data.id;
    
            await axios.post(
                `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
                { uris:playlist },
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
    
            alert('Playlist created successfully!');
        } catch (error) {
            console.error('Error creating playlist', error);
            alert('Failed to create playlist');
        }
    };
    

    const handleInputChange = (event) => { //autocomplete logic
        const input = event.target.value;
        setRecipe(input);

        if (input.length >= 3) {
            setIsTyping(true);
            axios
                .get(`https://api.spoonacular.com/recipes/autocomplete`, {
                    params: {
                        query: input, 
                        apiKey: '6238889567e643dda87f9cc0bc46fd4f', //forgive me father, for i have sinned
                        number: 5
                    }
                })
                .then((response) => {   
                    const newSuggestions = response.data.map((item) => ({
                        name: item.title,
                        id: item.id 
                    }));
                    setSuggestions(newSuggestions);
                })
                .catch((error) => {
                    console.error('Couldn\'t fetch autocomplete suggestions', error);
                    setSuggestions([]);
                });
        } else {
            setSuggestions([]); 
            setIsTyping(false); 
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setRecipe(suggestion.name);
        setRecipeId(suggestion.id);
        setIsTyping(false);
    };
    
    const handleInputFocus = () => { //autocomplete happens when ur two characters or more in 
        if (recipe.length >= 2) {
            setIsTyping(true);
        }
    };
    
    const handleInputBlur = () => { //makes it so the transition from click to disappearing is smooth
        inputBlurred.current = true;
        setTimeout(() => {
            if (inputBlurred.current) {
                setIsTyping(false);
            }
        }, 200); 
    };

    const handleSuggestionMouseDown = (event, suggestion) => {
        event.preventDefault();
        handleSuggestionClick(suggestion);
    };

    const handleClear = () => { //clear the text box
        setRecipe(''); 
        setSuggestions([]); 
        setIsTyping(false); 
    };

return (
    <div className="flex flex-col pt-3 w-full items-center h-screen"> 
        <h1 className="font-jost text-6xl font-black">Food2Play</h1>
        <p3 className="text-s mt-3 mb-2">A <i><b>fun</b></i> way to discover new music, through delicious recipes.</p3>
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
                                onMouseDown={(e) => handleSuggestionMouseDown(e, suggestion)}
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion.name}
                          </li>
                    ))}
                </ul>
            )}
        </div>
        <div className = "space-x-4">
            <button className="bg-blue-500 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
            onClick={generatePlaylist}>
                Generate!
            </button>
            <button className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
            onClick={handleClear}>
                Clear Entry 
            </button>
        </div>
        <img className = "mt-auto self-center mt-20 pt-8"
        src="/logo.png"
        alt="Logo for Food2Play"
        width={350} 
        height={300} 
      />
      <footer className="text-center px-60 mt-10">
      <div className="text-brown font-black">About Food2Play:</div>
        <p className="text-lg">
            Have a love for food? Have a love for finding new music? Look no further than Food2Play! Food2Play will let you look up any recipe, and it'll give you the ingredients necessary, in the form of a generated Spotify playlist!
        </p>
        <p>Created by Jason Lee and Youssef Adam, art by Youssef Adam</p>
        </footer>
    </div>
);

}


export default Home;
