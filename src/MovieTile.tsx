import { MoviesInterface } from "./App";
const ImagesApi = "https://image.tmdb.org/t/p/w200";
export default function MovieTile({ title, poster_path, overview, vote_average }: MoviesInterface) {
        return(
            <>
                <img className="movieTile" src={ImagesApi + poster_path} alt={title}/>
            </>
        );
}
