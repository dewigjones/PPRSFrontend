# Privacy Preserving Recommender System Frontend
This is the Frontend for the Privacy Preserving Recommender System (PPRS) for my Third Year Project. To run, you need a few things:
1. Register for an API key from [The Movie Database (TMDB)](https://www.themoviedb.org/settings/api/request). Create a file called `.env` at the top level and put your key next to `VITE_REACT_APP_TMDB_API_KEY=` and the token next to `VITE_REACT_APP_TMDB_API_TOKEN=`
2. Generate data by running the [PPRS model](https://github.com/dewigjones/PrivacyPreservingRecommenderSystem), copying the resulting `data` folder and making a list of all the files with `ls > filelist.txt`, making sure to remove the `pubkey`, `seckey` and final empty line
3. Run `npm i` then `npm run dev`, open the localhost address that is generated in your browser
