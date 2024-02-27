import { useEffect, useReducer, useState } from "react";
import SEAL from 'node-seal'
import movieList from '../movieList.txt'
import './App.css'
import MovieBar from './MovieBar'
import seckey from '../data/seckey.txt'
import { Stream } from "stream";

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

const seal = await SEAL();
const initSeal = () => {
  const schemeType = seal.SchemeType.bgv;
  const securityLevel = seal.SecurityLevel.tc128;
  const polyModulusDegree = 16384;
  const bitSize = 60;

  const encParms = seal.EncryptionParameters(schemeType)

  // Set the PolyModulusDegree
  encParms.setPolyModulusDegree(polyModulusDegree)

  // Create a suitable set of CoeffModulus primes
  encParms.setCoeffModulus(
    seal.CoeffModulus.BFVDefault(polyModulusDegree)
  )

  // Set the PlainModulus to a prime of bitSize 20.
  encParms.setPlainModulus(seal.PlainModulus.Batching(polyModulusDegree, bitSize))

  // Create a new Context
  const context = seal.Context(
    encParms, // Encryption Parameters
    true, // ExpandModChain
    securityLevel // Enforce a security level
  )

  if (!context.parametersSet()) {
    throw new Error(
      'Could not set the parameters in the given context. Please try different encryption parameters.'
    )
  }


  // Create a new KeyGenerator (creates a new keypair internally)
  const keyGenerator = seal.KeyGenerator(context)

  const secretKey = keyGenerator.secretKey();
  // secretKey.load(context, fs.readFileSync('hello.txt', 'utf8'));
  fetch(seckey).then(seckey => seckey.blob())
                .then(blob => blob.stream())
                .then(stream => stream.getReader())
                .then(reader => reader.read())
                .then(result => result.value)
                .then(seckey => { 
                  console.log(seckey); 
                  seckey ? secretKey.loadArray(context, seckey): console.log("Error loading secret key") 
                  console.log(secretKey.save());
                });
  const publicKey = keyGenerator.createPublicKey()
  const relinKey = keyGenerator.createRelinKeys()

  // Saving a key to a string is the same for each type of key
  const secretBase64Key = secretKey.save()
  const publicBase64Key = publicKey.save()

  console.log(secretBase64Key);

}

function App() {
  const apikey = import.meta.env.VITE_REACT_APP_TMDB_API_TOKEN;
  const FeaturedApi = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=${apikey}&page=1`;
  const numOfFilmsToDisplay = 15;

  const [loading, setLoading] = useState<boolean>(true);
  const [movies, setMovies] = useState<MoviesInterface[]>([]);
  const [sealInitialised, setSealInitialised] = useState<boolean>(false);
  const [moviesFetched, setMoviesFetched] = useState<Set<number>>(new Set<number>);
  const [_, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [idMap, setIdMap] = useState<Map<number, string>>(new Map<number, string>());
  const [idMapLoaded, setIdMapLoaded] = useState<boolean>(false);
  let decryptedMovies: [number, number][] = ([
    [1, 2],
    [2, 5],
    [4, 3],
    [3, 5],
    [10, 3],
    [41, 2],
    [54, 2.2],
    [22, 3],
    [11, 2],
    [56, 5],
    [69, 2.5],
    [45, 4.7],
    [25, 2.7],
    [15, 1.7],
    [38, 3.6],
    [23, 2.4],
    [24, 3.2],
    [27, 4.2],

  ])

  fetch(movieList).then(input => input.text()).then(text => text.split("\n").map(text => {
    const entry = text.split("|", 2);
    setIdMap((idMap) => idMap.set(parseInt(entry[0]), entry[1]));
    setIdMapLoaded(true);
  }));

  const processMovies = (decryptedMovies: [number, number][], idMap: Map<number, string>, apikey: string) => {
    decryptedMovies.sort(([, b], [, y]) => y - b);
    const topMovies = decryptedMovies.slice(0, numOfFilmsToDisplay);
    topMovies.forEach(([index,]) => {
      setMoviesFetched(moviesFetched.add(index));
      const movieTitle = idMap.get(index);
      const MovieLookUpApi = `https://api.themoviedb.org/3/search/movie?query=${movieTitle}&include_adult=false&language=en-US&page=1`;
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${apikey}`
        }
      };
      fetch(MovieLookUpApi, options)
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          let firstMovie: MoviesInterface = data.results[0];
          setMovies((movies) => [...movies, firstMovie]);
          setLoading(false);

        })
    })
  }

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
    if (idMapLoaded && moviesFetched.size < Math.min(decryptedMovies.length, numOfFilmsToDisplay)) processMovies(decryptedMovies, idMap, apikey)
  }, [decryptedMovies, idMap, apikey]);

  if (!sealInitialised) {
    initSeal();
    setSealInitialised(true);
  }
  return (
    <>
      <h1 className="pprsTitle">Privacy Preserving Recommender System</h1>
      {loading ? (<h2>Loading</h2>) : (<> <MovieBar title={"Movie results"} movies={movies} /> <MovieBar title={"Movie results"} movies={movies} /> <MovieBar title={"Movie results"} movies={movies} /> <MovieBar title={"Movie results"} movies={movies} /></>)}
    </>
  )
}

export default App
