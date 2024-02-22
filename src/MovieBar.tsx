import MovieTile from "./MovieTile";
import { MovieListInterface } from "./App";

export default function MovieBar({title, movies}: MovieListInterface) {
    return (
        <>
        <h2 className="movierowTitle">{title}</h2>
        <div className="movierow">
            {Array.isArray(movies) && movies.length > 0? (movies.map((curmovie) => <MovieTile title={curmovie.title} poster_path ={curmovie.poster_path} overview={curmovie.overview} vote_average={curmovie.vote_average} />)) : (<p> loading</p>)}
        </div>
        </>
    );
}