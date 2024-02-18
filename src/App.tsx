import './App.css'
import MovieBar from './MovieBar'

function App() {
const apikey = import.meta.env.VITE_REACT_APP_TMDB_API_KEY;
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
