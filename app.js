const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const port = 3000;

// Creați un cache cu un timp de viață de 10 minute
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Cheia API TMDb
const apiKey = '74d948fadbb359af90d43de1a5eef178';

// Middleware pentru a servi fișiere statice
app.use(express.static('public'));

// Endpoint pentru căutarea unui film după nume
app.get('/search-movie', async (req, res) => {
    const movieName = req.query.name;

    if (!movieName) {
        return res.status(400).json({ error: 'Vă rugăm să furnizați un nume de film.' });
    }

    try {
        // Verificați dacă filmul este deja în cache
        const cachedData = cache.get(movieName);
        if (cachedData) {
            console.log('Date recuperate din cache.');
            return res.json(cachedData); // Returnează datele din cache
        }

        // Dacă datele nu sunt în cache, faceți un apel către API
        const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: {
                api_key: apiKey,
                query: movieName,
            },
        });

        if (response.data.results.length === 0) {
            return res.status(404).json({ error: 'Niciun film găsit.' });
        }

        const movie = response.data.results[0]; // Primul rezultat
        const movieId = movie.id;

        // Obțineți detaliile complete ale filmului, inclusiv creditele (actori etc.)
        const movieDetailsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
            params: {
                api_key: apiKey,
                append_to_response: 'credits',
            },
        });

        const movieDetails = movieDetailsResponse.data;

        // Puneți detaliile filmului în cache
        cache.set(movieName, movieDetails);

        res.json(movieDetails); // Returnează detaliile filmului

    } catch (error) {
        console.error(`Eroare la căutarea filmului: ${error}`);
        res.status(500).json({ error: 'Eroare internă a serverului.' });
    }
});

// Porniți serverul
app.listen(port, () => {
    console.log(`Serverul a pornit la http://localhost:${port}`);
});

