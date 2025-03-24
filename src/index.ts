import express from 'express';

const app = express();
const port = 3000;

app.use(express.json());

// Route di test
app.get('/', (req, res) => {
  res.send('Hello, TypeScript API!');
});

app.get('/ciao', (req, res) => {
    res.send('Ciao Bello');
    console.log("qualcuno ha fatto richiesta ciao")
});

app.post('/ciao', (req, res) => {
    const { nome } = req.body;
    console.log(`Qualcuno ha fatto POST su /ciao con nome: ${nome}`);
    res.send(`Ciao, ${nome}!`);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


  