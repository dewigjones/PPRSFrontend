import MovieTile from "./MovieTile";
import { MovieListInterface } from "./App";
export default function MovieBar({title, movies}: MovieListInterface) {
    return (
        <>
        <h2>{title}</h2>
        <div className="movierow">
            {movies.length >0 && movies.map((curmovie) => <MovieTile title={curmovie.title} poster_path ={curmovie.poster_path} overview={curmovie.overview} vote_average={curmovie.vote_average}  />)}
        </div>
        </>
    );
}