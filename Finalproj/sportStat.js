const express = require('express');
const path = require('path');
const axios = require('axios');
const { MongoClient, ServerApiVersion } = require('mongodb');
const parse = require('body-parser');
require('dotenv').config();

async function fetchStandings() {

    const options = {
        method: 'GET',
        url: 'https://api-american-football.p.rapidapi.com/standings',
        params: {
            league: '1',
            season: '2022'
        },
        headers: {
            'X-RapidAPI-Key': '0e7342bb4cmsh2ce86dc63d50fe9p12304fjsn8e350f3ad64e',
            'X-RapidAPI-Host': 'api-american-football.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        return response.data.response; // Adjust to return the correct array based on API structure
    } catch (error) {
        console.error('API Fetch Error:', error);
        return null; // Return null in case of an error
    }
}

const app = express();
app.set('views', path.resolve(__dirname, 'templates'));
app.set('view engine', 'ejs');

let portNumber = process.argv[2];
app.listen(portNumber);

const uri = `mongodb+srv://bkavinr:BKr242004@cluster0.8qv4pqs.mongodb.net/`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.use(parse.urlencoded({ extended: false }));

async function run(obj) {
    await client.connect();
    const db = client.db('QuarterbackStats');
    await db.collection('Players').insertOne(obj);
}

app.get('/', async (request, response) => {
    try {
        const standingsData = await fetchStandings(); 

        if (standingsData) {
            let table = '';

            standingsData.forEach(team => {
                if (team.position == 1) {
                    table += `<tr>
                                <td>${team.team.name}</td>
                                <td>${team.won}</td>
                                <td>${team.lost}</td>
                             </tr>`;
                }
            });

            response.render('index', { table });
        } else {
            response.status(500).send('Failed to fetch standings data');
        }
    } catch (error) {
        console.error('Error fetching standings:', error);
        response.status(500).send('Internal Server Error');
    }
});


app.get('/finder', (request, response) => {
    response.render('findMyStat', { portNumber });
});

app.post('/myStat', async (request, response) => {
    await client.connect();
    let filter = { name: `${request.body.name}` };
    const cursor = await client.db('QuarterbackStats').collection('Players').findOne(filter);
    const variables = {
        name: request.body.name,
        tds: Number(cursor.tds),
        rushyards: Number(cursor.rushyards),
        passyards: Number(cursor.passyards)
    };
    response.render('presentSeasonStats', variables);
});

app.get('/newStat', (request, response) => {
    response.render('newGameStat', { portNumber });
});

app.post('/submittedStats', async (request, response) => {
    await client.connect();
    let filter = { name: `${request.body.name}` };
    const cursor = await client.db('QuarterbackStats').collection('Players').findOne(filter);

    if (cursor == undefined) {
        let player = {
            name: request.body.name,
            tds: Number(request.body.tds),
            rushyards: Number(request.body.rushyds),
            passyards: Number(request.body.passyds)
        };
        await run(player);
        const variables = {
            name: request.body.name,
            tds: Number(request.body.tds),
            rushyards: Number(request.body.rushyds),
            passyards: Number(request.body.passyds)
        };
        response.render('presentstats', variables);
    } else {
        let updatedPlayer = {
            $set: {
                tds: Number(cursor.tds) + Number(request.body.tds),
                rushyards: Number(cursor.rushyards) + Number(request.body.rushyds),
                passyards: Number(cursor.passyards) + Number(request.body.passyds)
            }
        };
        await client.db('QuarterbackStats').collection('Players').updateOne(filter, updatedPlayer);
    }

    const variables = {
        name: request.body.name,
        tds: Number(request.body.tds),
        rushyards: Number(request.body.rushyds),
        passyards: Number(request.body.passyds)
    };
    response.render('presentstats', variables);
});

app.get('/TD', async (request, response) => {
    await client.connect();
    let ans = '';
    const cursor = await client.db('QuarterbackStats').collection('Players').find();
    let result = await cursor.toArray();
    result.sort((a, b) => b.tds - a.tds);
    let i = 1;
    result.forEach(e => {
        ans += `<tr><td><strong>${i}</strong></td><td><strong>${e.name}</strong></td><td><strong>${e.tds}</strong></td></tr>`;
        i++;
    });
    const variables = {
        table: ans
    };
    response.render('tdShower', variables);
});

app.get('/Yards', async (request, response) => {
    await client.connect();
    let ans = '';
    const cursor = await client.db('QuarterbackStats').collection('Players').find();
    let result = await cursor.toArray();
    result.sort((a, b) => b.passyards - a.passyards);
    let i = 1;
    result.forEach(e => {
        ans += `<tr><td><strong>${i}</strong></td><td><strong>${e.name}</strong></td><td><strong>${e.passyards}</strong></td></tr>`;
        i++;
    });
    const variables = {
        table: ans
    };
    response.render('passLeader', variables);
});



process.stdin.setEncoding('utf8');
process.stdout.write(`Web server started and running at http://localhost:${portNumber}\n`);

// const prompt = 'Stop to shutdown the server: ';
// process.stdout.write(prompt);
// process.stdin.on('readable', function () {
//     const dataInput = process.stdin.read();
//     if (dataInput !== null) {
//         const command = dataInput.trim();
//         if (command === 'stop') {
//             process.stdout.write('Shutting down the server\n');
//             process.exit(0);
//         }
//         process.stdout.write(prompt);
//         process.stdin.resume();
//     }
// });


// const express = require('express');
// const path = require('path');
// const axios = require('axios');
// const { MongoClient, ServerApiVersion } = require('mongodb');
// const parse = require('body-parser');
// require('dotenv').config();

// async function fetchStandings() {
//     const options = {
//         method: 'GET',
//         url: 'https://api-american-football.p.rapidapi.com/standings',
//         params: {
//             league: '1',
//             season: '2022'
//         },
//         headers: {
//             'X-RapidAPI-Key': '0e7342bb4cmsh2ce86dc63d50fe9p12304fjsn8e350f3ad64e',
//             'X-RapidAPI-Host': 'api-american-football.p.rapidapi.com'
//         }
//     };

//     try {
//         const response = await axios.request(options);
//         return response.data; // Return the fetched data
//     } catch (error) {
//         console.error(error);
//         return null; // Return null in case of an error
//     }
// }
// fetchStandings();

// const app = express();
// app.set('views', path.resolve(__dirname, 'templates'));
// app.set('view engine', 'ejs');

// let portNumber = process.argv[2];
// app.listen(portNumber);

// const uri = `mongodb+srv://bkavinr:BKr242004@cluster0.8qv4pqs.mongodb.net/`;
// const client = new MongoClient(uri, {
//     serverApi: {
//         version: ServerApiVersion.v1,
//         strict: true,
//         deprecationErrors: true,
//     }
// });

// app.use(parse.urlencoded({ extended: false }));

// async function run(obj) {
//     await client.connect();
//     const db = client.db('QuarterbackStats');
//     await db.collection('Players').insertOne(obj);
// }

// app.get('/api/leagues', async (request, response) => {
//     try {
//         const standingsData = await fetchStandings(); // Fetch standings data
//         if (standingsData) {
//             let tableHtml = '<table><thead><tr><th>Position</th><th>Team</th><th>Won</th><th>Lost</th><th>Ties</th><th>Streak</th></tr></thead><tbody>';
//             standingsData.forEach(team => {
//                 tableHtml += `
//                     <tr>
//                         <td>${team.position}</td>
//                         <td>${team.team.name}</td>
//                         <td>${team.won}</td>
//                         <td>${team.lost}</td>
//                         <td>${team.ties}</td>
//                         <td>${team.streak}</td>
//                     </tr>
//                 `;
//             });
//             tableHtml += '</tbody></table>';
//             response.render('standings', { tableHtml: tableHtml }); // Render the standings template with table HTML
//         } else {
//             response.status(500).send('Failed to fetch standings data'); // Handle error if data fetching failed
//         }
//     } catch (error) {
//         console.error('Error fetching standings:', error);
//         response.status(500).send('Internal Server Error'); // Handle unexpected errors
//     }
// });


// app.get('/', (request, response) => {
//     response.render('index');
// });

// app.get('/finder', (request, response) => {
//     response.render('findMyStat', { portNumber });
// });

// app.post('/myStat', async (request, response) => {
//     await client.connect();
//     let filter = { name: `${request.body.name}` };
//     const cursor = await client.db('QuarterbackStats').collection('Players').findOne(filter);
//     const variables = {
//         name: request.body.name,
//         tds: Number(cursor.tds),
//         rushyards: Number(cursor.rushyards),
//         passyards: Number(cursor.passyards)
//     };
//     response.render('presentSeasonStats', variables);
// });

// app.get('/newStat', (request, response) => {
//     response.render('newGameStat', { portNumber });
// });

// app.post('/submittedStats', async (request, response) => {
//     await client.connect();
//     let filter = { name: `${request.body.name}` };
//     const cursor = await client.db('QuarterbackStats').collection('Players').findOne(filter);

//     if (cursor == undefined) {
//         let player = {
//             name: request.body.name,
//             tds: Number(request.body.tds),
//             rushyards: Number(request.body.rushyds),
//             passyards: Number(request.body.passyds)
//         };
//         await run(player);
//         const variables = {
//             name: request.body.name,
//             tds: Number(request.body.tds),
//             rushyards: Number(request.body.rushyds),
//             passyards: Number(request.body.passyds)
//         };
//         response.render('presentstats', variables);
//     } else {
//         let updatedPlayer = {
//             $set: {
//                 tds: Number(cursor.tds) + Number(request.body.tds),
//                 rushyards: Number(cursor.rushyards) + Number(request.body.rushyds),
//                 passyards: Number(cursor.passyards) + Number(request.body.passyds)
//             }
//         };
//         await client.db('QuarterbackStats').collection('Players').updateOne(filter, updatedPlayer);
//     }

//     const variables = {
//         name: request.body.name,
//         tds: Number(request.body.tds),
//         rushyards: Number(request.body.rushyds),
//         passyards: Number(request.body.passyds)
//     };
//     response.render('presentstats', variables);
// });

// app.get('/TD', async (request, response) => {
//     await client.connect();
//     let ans = '';
//     const cursor = await client.db('QuarterbackStats').collection('Players').find();
//     let result = await cursor.toArray();
//     result.sort((a, b) => b.tds - a.tds);
//     let i = 1;
//     result.forEach(e => {
//         ans += `<tr><td><strong>${i}</strong></td><td><strong>${e.name}</strong></td><td><strong>${e.tds}</strong></td></tr>`;
//         i++;
//     });
//     const variables = {
//         table: ans
//     };
//     response.render('tdShower', variables);
// });

// app.get('/Yards', async (request, response) => {
//     await client.connect();
//     let ans = '';
//     const cursor = await client.db('QuarterbackStats').collection('Players').find();
//     let result = await cursor.toArray();
//     result.sort((a, b) => b.passyards - a.passyards);
//     let i = 1;
//     result.forEach(e => {
//         ans += `<tr><td><strong>${i}</strong></td><td><strong>${e.name}</strong></td><td><strong>${e.passyards}</strong></td></tr>`;
//         i++;
//     });
//     const variables = {
//         table: ans
//     };
//     response.render('passLeader', variables);
// });

// process.stdin.setEncoding('utf8');
// process.stdout.write(`Web server started and running at http://localhost:${portNumber}\n`);

// const prompt = 'Stop to shutdown the server: ';
// process.stdout.write(prompt);
// process.stdin.on('readable', function () {
//     const dataInput = process.stdin.read();
//     if (dataInput !== null) {
//         const command = dataInput.trim();
//         if (command === 'stop') {
//             process.stdout.write('Shutting down the server\n');
//             process.exit(0);
//         }
//         process.stdout.write(prompt);
//         process.stdin.resume();
//     }
// });


