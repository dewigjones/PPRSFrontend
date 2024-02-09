import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import MovieTile from './MovieTile'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Privacy Preserving Recommender System</h1>
      <MovieTile/>
    </>
  )
}

export default App
