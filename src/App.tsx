import { useEffect, useReducer, useState, Dispatch, SetStateAction } from "react";
import SEAL from 'node-seal'
import movieList from '../movieList.txt'
import './App.css'
import MovieBar from './MovieBar'
import TopBar, { topbar } from "./TopBar.tsx";
import seckey from '../data/seckey.txt'
import encryptedList from '../data/filelist.txt'
import { Decryptor } from "node-seal/implementation/decryptor";
import { Evaluator } from "node-seal/implementation/evaluator";
import { BatchEncoder } from "node-seal/implementation/batch-encoder";
import { Context } from "node-seal/implementation/context";
import { SyncLoader } from "react-spinners";
import { User } from "./Avatar.tsx";

export interface MoviesInterface {
  id?: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  genre_ids: number[];
}

export interface MovieListInterface {
  title: string;
  movies: MoviesInterface[];
}

const user1 :User = {
  id: 1,
  name: "Gruff",
  img_path: "Gruff.jpg",
}

const user2 :User = {
  id: 2,
  name: "Dewi",
  img_path: "Dewi.jpg",
}

const extractName = (user: User) => user.name;

const seal = await SEAL();
const initSeal = (setContext, setDecryptor, setEvaluator, setEncoder, setDecryptedMovies, setMoviesDecrypted, decryptedMovies: Set<[number, number]>, idMap: Map<number, string>, apikey: string, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setMovies: Dispatch<SetStateAction<MoviesInterface[]>>, setGenre1Movies, setGenre2Movies, setLoading) => {
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
                  onSecKeyLoad(context, decryptor, encoder, setDecryptedMovies, setMoviesDecrypted, decryptedMovies, idMap, apikey, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setMovies, setGenre1Movies, setGenre2Movies, setLoading)
                });

}

const onSecKeyLoad = (context, decryptor, encoder, setDecryptedMovies:Dispatch<SetStateAction<Set<[number, number]>>>, setMoviesDecrypted, decryptedMovies: Set<[number, number]>, idMap: Map<number, string>, apikey: string, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setMovies, setGenre1Movies, setGenre2Movies, setLoading)  =>{
  fetch(encryptedList).then(data => data.text()).then(text => {
    let counter = 0;
    const lines = text.split('\n');
    const userlines = lines.filter((filename) => filename.startsWith("user1"));
    userlines.forEach((filename) =>
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
                if (counter++ >= userlines.length - 1) {processMovies(decryptedMovies, idMap, apikey, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setMovies, setGenre1Movies, setGenre2Movies, setLoading) }
              });
    })
  })
  }

  const processMovies = (decryptedMovies: Set<[number, number]>, idMap: Map<number, string>, apikey: string, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setMovies:Dispatch<SetStateAction<MoviesInterface[]>>, setGenre1Movies, setGenre2Movies, setLoading) => {
    const decryptedMoviesArray = Array.from(decryptedMovies);
    decryptedMoviesArray.sort(([, b], [, y]) => y - b);
    const topMovies = decryptedMoviesArray.slice(0, numOfFilmsToDisplay);
    const middleMovies = decryptedMoviesArray.slice(numOfFilmsToDisplay + 1, 3 * numOfFilmsToDisplay);
    topMovies.forEach(([index,]) => {
      if(!moviesFetched.has(index)) {
      setMoviesFetched((moviesFetched) => moviesFetched.add(index));
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
          if(firstMovie.genre_ids.includes(35)) setGenre1Movies((genre1Movies) =>[...genre1Movies, firstMovie]);
          if(firstMovie.genre_ids.includes(18)) setGenre2Movies((genre2Movies) =>[...genre2Movies, firstMovie]);
          setLoading(false);
        })
    }})
    middleMovies.forEach(([index, ]) => {
    if(!moviesFetched.has(index)) {
      setMoviesFetched((moviesFetched) => moviesFetched.add(index));
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
          if(firstMovie.genre_ids.includes(35)) setGenre1Movies((genre1Movies) =>[...genre1Movies, firstMovie]);
          if(firstMovie.genre_ids.includes(18)) setGenre2Movies((genre2Movies) =>[...genre2Movies, firstMovie]);
          setLoading(false);

        })
    }
    })
  }
function App() {
  const apikey = import.meta.env.VITE_REACT_APP_TMDB_API_TOKEN;
  const FeaturedApi = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=${apikey}&page=1`;
  const numOfFilmsToDisplay = 15;

  const [loading, setLoading] = useState<boolean>(true);
  const [topMovies, setTopMovies] = useState<MoviesInterface[]>([]);
  const [genre1Movies, setGenre1Movies] = useState<MoviesInterface[]>([]);
  const [genre2Movies, setGenre2Movies] = useState<MoviesInterface[]>([]);
  const [sealInitialised, setSealInitialised] = useState<boolean>(false);
  const [moviesFetched, setMoviesFetched] = useState<Set<number>>(new Set<number>);
  const [idMap, setIdMap] = useState<Map<number, string>>(new Map<number, string>());
  const [idMapLoaded, setIdMapLoaded] = useState<boolean>(false);
  const [curUser, setCurUser] = useState<User>(user1);

  const [context, setContext] = useState<Context>();
  const [decryptor, setDecryptor] = useState<Decryptor>();
  const [evaluator, setEvaluator] = useState<Evaluator>();
  const [encoder, setEncoder] = useState<BatchEncoder>();
  const [decryptedMovies, setDecryptedMovies] = useState<Set<[number, number]>>(new Set<[number, number]>());
  const [moviesDecrypted, setMoviesDecrypted] = useState<boolean>(false);

  const toggleUser = () => {
    (curUser.id === user1.id)? setCurUser(user2) : setCurUser(user1);
    setDecryptedMovies(new Set());
    setTopMovies([]);
    setGenre1Movies([]);
    setGenre2Movies([]);
    setSealInitialised(false);
    setMoviesFetched(new Set());
    initSeal(setContext, setDecryptor, setEvaluator, setEncoder, setDecryptedMovies, setMoviesDecrypted, decryptedMovies, idMap, apikey, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setTopMovies, setGenre1Movies, setGenre2Movies, setLoading);
    setSealInitialised(true);
  };

  if (!sealInitialised) {
    initSeal(setContext, setDecryptor, setEvaluator, setEncoder, setDecryptedMovies, setMoviesDecrypted, decryptedMovies, idMap, apikey, numOfFilmsToDisplay, moviesFetched, setMoviesFetched, setTopMovies, setGenre1Movies, setGenre2Movies, setLoading);
    setSealInitialised(true);
  }

  fetch(movieList).then(input => input.text()).then(text => text.split("\n").map(text => {
    const entry = text.split("|", 2);
    setIdMap((idMap) => idMap.set(parseInt(entry[0]), entry[1]));
    setIdMapLoaded(true);
  }));


  const topbar: topbar = {user: curUser, avatarHandler:toggleUser}
  
  return (
    <>
      {loading ? (<SyncLoader color="#C5C392" />) : (<><TopBar {...topbar} /> <MovieBar title={"Top Picks for " + extractName(curUser)} movies={topMovies} /> <MovieBar title={"Top Comedy Films"} movies={genre1Movies} /> <MovieBar title={"Top Drama Films"} movies={genre2Movies} /></>)}
    </>
  )
}

export default App
