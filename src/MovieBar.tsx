import MovieTile from "./MovieTile";

export default function MovieBar() {
    return (
        <>
        <h2>Movie Row</h2>
        <div className="movierow">
            <MovieTile/>
            <MovieTile/>
            <MovieTile/>
        </div>
        </>
    );
}