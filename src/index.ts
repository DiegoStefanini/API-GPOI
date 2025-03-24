import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import dotenv from 'dotenv';

dotenv.config(); // carica variabili da .env

const app = express();
app.use(express.json());

const port = 3000; 

app.get('/', (req, res) => {
  res.send('Hello, TypeScript API!');
});

app.post('/registra', async (req, res) => {
  const {nome, password} = req.body; 
  const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
  try {
    const nuovoDato = await prisma.users.create({
      data: {
        nome: nome,
        password: hashedPassword, 
        permessi: 'noperms'
      }
    });
    console.log("Nuovo utente registrato:\n" + nuovoDato);  
    const risposta = {
      status: "ok"
    }
    res.json(risposta);
  } catch (error) {
    console.error(error);
     res.status(500).json({ error: 'Errore durante il login' });
  }
}); 

app.post('/login', async (req, res) => {
  // rinominando il campo "nome" in arrivo dal body per evitare collisioni
  const { nome: nomeBody, password } = req.body;

  try {
    // Qui l'oggetto utente sarà "nome" (come hai chiesto),
    // che ha i campi .id, .nome, .password
    const riultatoquery = await prisma.users.findUnique({
      where: { nome: nomeBody },
    });

    if (!riultatoquery) {
      res.status(401).json({ error: 'Utente non trovato' });
      return;
    }

    // Ora "nome.password" è la password salvata nel DB.
    const passwordOk = await bcrypt.compare(password, riultatoquery.password!);

    if (!passwordOk) {
      res.status(401).json({ error: 'Password errata' });
      return; 
    } 

    // Genera il token JWT.
    const token = jwt.sign(
      { id: riultatoquery.id,
        permessi: riultatoquery.permessi,
        nome: riultatoquery.nome
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
     res.status(500).json({ error: 'Errore durante il login' });
  }
});

app.get('/dati', async (req, res) => {
  try {
    const dati = await prisma.dati.findMany({
      include: { micro: true } // include dati dal micro collegato
    });
    res.json(dati);
  } catch (error) {
    console.error(error);
    res.status(500).send('Errore nel recupero dei dati dal DB');
  }
});

app.put('/dati', async (req, res) => {
  const { co2, pm10, pm2_5, idMicro, latitude, longitude } = req.body;

  try {
    const nuovoDato = await prisma.dati.create({
      data: {
        co2,
        pm10,
        pm2_5,
        idMicro,
        latitude,
        longitude
      }
    });
    res.json(nuovoDato);
  } catch (error) {
    console.error(error);
    res.status(500).send('Errore nel salvataggio dei dati');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// PUT inserisco dati 
// GET prendo dati 
// DELETE elimino dati 
// POST modifica