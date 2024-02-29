import { useEffect, useReducer, useState, Dispatch, SetStateAction } from "react";
import SEAL from 'node-seal'
import movieList from '../movieList.txt'
import './App.css'
import MovieBar from './MovieBar'
import seckey from '../data/seckey.txt'
import encryptedList from '../data/filelist.txt'
import { Decryptor } from "node-seal/implementation/decryptor";
import { Evaluator } from "node-seal/implementation/evaluator";
import { BatchEncoder } from "node-seal/implementation/batch-encoder";
import { Context } from "node-seal/implementation/context";
import { SyncLoader } from "react-spinners";
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
const initSeal = (setContext, setDecryptor, setEvaluator, setEncoder, setDecryptedMovies, setMoviesDecrypted, decryptedMovies: Set<[number, number]>, idMap: Map<number, string>, apikey: string, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setMovies: Dispatch<SetStateAction<MoviesInterface[]>>, setLoading) => {
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
  setContext(context);
  if (!context.parametersSet()) {
    throw new Error(
      'Could not set the parameters in the given context. Please try different encryption parameters.'
    )
  }


  // Create a new KeyGenerator (creates a new keypair internally)
  const keyGenerator = seal.KeyGenerator(context)

  const secretKey = keyGenerator.secretKey();
  setEvaluator(seal.Evaluator(context));
  const encoder = seal.BatchEncoder(context);
  setEncoder(encoder);
  fetch(seckey).then(seckey => seckey.blob())
                .then(blob => blob.stream())
                .then(stream => stream.getReader())
                .then(reader => reader.read())
                .then(result => result.value)
                .then(seckey => { 
                  console.log(seckey); 
                  seckey ? secretKey.loadArray(context, seckey): console.log("Error loading secret key") ;
                  const decryptor = seal.Decryptor(context, secretKey);
                  setDecryptor(decryptor);
                  onSecKeyLoad(context, decryptor, encoder, setDecryptedMovies, setMoviesDecrypted, decryptedMovies, idMap, apikey, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setMovies, setLoading)
                });

}

const onSecKeyLoad = (context, decryptor, encoder, setDecryptedMovies:Dispatch<SetStateAction<Set<[number, number]>>>, setMoviesDecrypted, decryptedMovies: Set<[number, number]>, idMap: Map<number, string>, apikey: string, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setMovies, setLoading)  =>{
  fetch(encryptedList).then(data => data.text()).then(text => {
    let counter = 0;
    const lines = text.split('\n');
    lines.forEach((filename) =>
  {fetch("../data/" +filename).then(data => data.arrayBuffer())
              .then(value => { 
                const ciphertext = seal.CipherText();
                (context && value)? ciphertext.loadArray(context, new Uint8Array(value)) : console.log("error setting ciphertext");
                const plaintext = seal.PlainText();
                decryptor?.decrypt(ciphertext, plaintext);
                const decoded = encoder?.decode(plaintext, false);
                const filmNum = filename.substring(filename.search('\_') + 1, filename.length - 4);
                const rating = decoded[0] / Math.pow(2,30);
                console.log(filmNum + ", " + rating.toString());
                decoded? setDecryptedMovies((decryptedMovies)=> decryptedMovies.add([parseInt(filmNum), rating])): console.log("error with decoding");
                if (counter++ >= lines.length - 1) {processMovies(decryptedMovies, idMap, apikey, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setMovies, setLoading) }
              });
    })
  })
  }

  const processMovies = (decryptedMovies: Set<[number, number]>, idMap: Map<number, string>, apikey: string, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setMovies:Dispatch<SetStateAction<MoviesInterface[]>>, setLoading) => {
    const decryptedMoviesArray = Array.from(decryptedMovies);
    decryptedMoviesArray.sort(([, b], [, y]) => y - b);
    const topMovies = decryptedMoviesArray.slice(0, numOfFilmsToDisplay);
    topMovies.forEach(([index,]) => {
      if(!moviesFetched.has(index)) {
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
  }})
  }
function App() {
  const apikey = import.meta.env.VITE_REACT_APP_TMDB_API_TOKEN;
  const FeaturedApi = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=${apikey}&page=1`;
  const numOfFilmsToDisplay = 15;

  const [loading, setLoading] = useState<boolean>(true);
  const [movies, setMovies] = useState<MoviesInterface[]>([]);
  const [sealInitialised, setSealInitialised] = useState<boolean>(false);
  const [moviesFetched, setMoviesFetched] = useState<Set<number>>(new Set<number>);
  const [idMap, setIdMap] = useState<Map<number, string>>(new Map<number, string>());
  const [idMapLoaded, setIdMapLoaded] = useState<boolean>(false);

  const [context, setContext] = useState<Context>();
  const [decryptor, setDecryptor] = useState<Decryptor>();
  const [evaluator, setEvaluator] = useState<Evaluator>();
  const [encoder, setEncoder] = useState<BatchEncoder>();
  const [decryptedMovies, setDecryptedMovies] = useState<Set<[number, number]>>(new Set<[number, number]>());
  const [moviesDecrypted, setMoviesDecrypted] = useState<boolean>(false);

  if (!sealInitialised) {
    initSeal(setContext, setDecryptor, setEvaluator, setEncoder, setDecryptedMovies, setMoviesDecrypted, decryptedMovies, idMap, apikey, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setMovies, setLoading);
    setSealInitialised(true);
  }

  fetch(movieList).then(input => input.text()).then(text => text.split("\n").map(text => {
    const entry = text.split("|", 2);
    setIdMap((idMap) => idMap.set(parseInt(entry[0]), entry[1]));
    setIdMapLoaded(true);
  }));

  


  return (
    <>
      <h1 className="pprsTitle">Privacy Preserving Recommender System</h1>
      {loading ? (<SyncLoader color="#C5C392" />) : (<> <MovieBar title={"Movie results"} movies={movies} /> <MovieBar title={"Movie results"} movies={movies} /> <MovieBar title={"Movie results"} movies={movies} /> <MovieBar title={"Movie results"} movies={movies} /></>)}
    </>
  )
}

export default App
