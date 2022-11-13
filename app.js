const express = require('express');
const path = require('path');
const request = require('request');
require('dotenv').config()

const app = express();

const API_KEY = process.env.API_KEY;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res)=>{
    res.render('search');
})

const port = process.env.PORT || 5040;
app.listen(port, function(){
    console.log(`server is listening on port: ${port}`);
});

app.get('/result', (req, res)=>{
   
    let set_language = "pt-BR";
    let media = "tv"
    var media_id;
    let genre_id = req.query.search;
    console.log(genre_id);
    
    getRandomId(randomIntFromInterval(1, 100));


    function getRandomId(page_number) {

        request(`https://api.themoviedb.org/3/discover/${media}?api_key=${API_KEY}&language=${set_language}&
    sort_by=popularity.desc&include_adult=false&with_genres=${genre_id}&include_video=false&page=${page_number}&
    watch_region=BR`, (error, response, body) =>    {

        if(error){
            console.log(error);
        }else{
            r_page = JSON.parse(body);            
            const random_obj_id = randomIntFromInterval(1, 19);
            media_id = Object(r_page.results[random_obj_id].id);

            renderRandomPage(media_id);
            } 
        })
    }

    const getProvider = async(media_id)  => {
        return fetch(`https://api.themoviedb.org/3/${media}/${media_id}/watch/providers?api_key=${API_KEY}`).then((response) => { 
            return response.json().then((data) => {
                return data;
            }).catch((err) => {
                console.log(err);
            }) 
        });
    }

    const renderRandomPage = async(media_id) => {

        let providers = await getProvider(media_id);
        let local_providers = providers.results.BR;

        console.log(Object.keys(local_providers));
        
        if(local_providers.hasOwnProperty("flatrate")) {
            console.log(Object.keys(local_providers.flatrate[1].provider_name));
        }

        request(`https://api.themoviedb.org/3/${media}/${media_id}?api_key=${API_KEY}&language=${set_language}`, (error, response, body)=>{
            if(error){
                console.log(error);
            }else{
                let data = JSON.parse(body);
    
                res.render('result', {data: data, local_providers: local_providers});
            }  
        })
    }


    function randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
      }

});

