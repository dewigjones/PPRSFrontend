import { MoviesInterface } from "./App";
const ImagesApi = "https://image.tmdb.org/t/p/w1280";
export default function MovieTile({ title, poster_path, overview, vote_average }: MoviesInterface) {
        return(
            <>
                <p className="movietile" >{title}</p>
                <img src={ImagesApi + poster_path}/>
            </>
        );
}
