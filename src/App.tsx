import { useEffect, useState } from "react";
import SEAL from 'node-seal'

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

const seal = await SEAL();
const initSeal = () => {
 
    const schemeType = seal.SchemeType.bgv;
    const securityLevel = seal.SecurityLevel.tc128;
    const polyModulusDegree = 16384;
    const bitSizes = [36, 36, 37];
    const bitSize = 20; 

    const encParms = seal.EncryptionParameters(schemeType)

    // Set the PolyModulusDegree
    encParms.setPolyModulusDegree(polyModulusDegree)

    // Create a suitable set of CoeffModulus primes
    encParms.setCoeffModulus(
      seal.CoeffModulus.Create(polyModulusDegree, Int32Array.from(bitSizes))
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

    const secretKey = keyGenerator.secretKey()
    const publicKey = keyGenerator.createPublicKey()
    const relinKey = keyGenerator.createRelinKeys()

    // Saving a key to a string is the same for each type of key
    const secretBase64Key = secretKey.save()
    const publicBase64Key = publicKey.save()
    const relinBase64Key = relinKey.save()

    console.log(secretBase64Key);
  
}

function App() {
const apikey = import.meta.env.VITE_REACT_APP_TMDB_API_KEY;
const FeaturedApi = `https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=${apikey}&page=1`;

const [loading, setLoading] = useState<boolean>(false);
const [movies, setMovies] = useState<MoviesInterface[]>([]);
const [sealInitialised, setSealInitialised] = useState<boolean>(false);

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

 if (!sealInitialised) {
  initSeal();
  setSealInitialised(true);
 }
  return (
    <>
      <h1>Privacy Preserving Recommender System</h1>
      {loading ?(<h2>Loading</h2>)  : (<MovieBar title={"Movie results"} movies={movies}/>)}
    </>
  )
}

export default App
