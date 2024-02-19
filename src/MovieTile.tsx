import { MoviesInterface } from "./App";
export default function MovieTile({ title, poster_path, overview, vote_average }: MoviesInterface) {
        return(
            <button className="movietile" >I'm a movie tile for {title}</button>
        );
}
