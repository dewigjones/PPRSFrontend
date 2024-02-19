import { useEffect, useState } from "react";
import './App.css'
import MovieBar from './MovieBar'

export interface MoviesInterface {
  id?: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
}

export interface MovieListInterface {
  title: string;
  movies: MoviesInterface[];
}

function App() {
const apikey = import.meta.env.VITE_REACT_APP_TMDB_API_KEY;
const FeaturedApi = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=${apikey}&page=1`;

const [loading, setLoading] = useState<boolean>(false);
const [movies, setMovies] = useState<Movies[]>([]);

const getMovies = (API: string) => {
    setLoading(true);
    fetch(API)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.results);
        setLoading(false);
      });
  };
  useEffect(() => {
    getMovies(FeaturedApi);
  }, [FeaturedApi]);

  return (
    <>
      <h1>Privacy Preserving Recommender System</h1>
      {loading ?(<h2>Loading</h2>)  : (<MovieBar title="Movie results" movies={movies}/>)}
    </>
  )
}

export default App
