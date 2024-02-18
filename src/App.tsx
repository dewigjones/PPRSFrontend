import './App.css'
import MovieBar from './MovieBar'

function App() {
const apikey = import.meta.env.VITE_REACT_APP_TMDB_API_KEY;
const FeaturedApi = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=${apikey}&page=1`;
const getMovies = (API: string) => {
    fetch(API)
      .then((res) => res.json())
      .then((data) => {
        console.log(data.results);
      });
  };

 getMovies(FeaturedApi); 
  return (
    <>
      <h1>Privacy Preserving Recommender System</h1>
      <MovieBar/>
      <MovieBar/>
      <MovieBar/>
    </>
  )
}

export default App
