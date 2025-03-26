import express from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import {RowDataPacket } from 'mysql2/promise';
import path from 'path';


dotenv.config(); // carica variabili da .env
const secret = process.env.JWT_SECRET;

if (!secret) {
    throw new Error('JWT_SECRET non definita nel file .env');

    // esempio: JWT_SECRET=scemo123
}

const app = express();
app.use(express.json());
const port = 3000;

// 1. Crea un pool di connessioni MySQL (ricorda di sostituire host, user, password e database!)
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "gpo"
});

// /registra: inserisce un nuovo utente
app.post("/registra", async (req, res) => {
  const { nome, password } = req.body;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  try {
    // Inseriamo il nuovo utente nella tabella "users"
    const [result] = await pool.query(
        "INSERT INTO users (nome, password, permessi) VALUES (?, ?, ?)",
        [nome, hashedPassword, "noperms"]
    );
    console.log("Nuovo utente registrato:", result);
    res.json({ status: "ok" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore durante la registrazione" });
  }
});

// /login: controlla le credenziali e genera un token JWT
app.post("/login", async (req, res) => {
    const { nome: nomeBody, password } = req.body;
    try {
        // Cerchiamo l'utente per nome
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE nome = ?",
            [nomeBody]
        );

        // "rows" è un array di risultati; se vuoto, l'utente non esiste
        const users = Array.isArray(rows) ? rows : [];
        if (!users.length) {
            res.status(401).json({ error: "Utente non trovato" });
            return 
        }

        const utente = users[0] as RowDataPacket;

        // Confrontiamo la password
        const passwordOk = await bcrypt.compare(password, utente.password);
        if (!passwordOk) {
            res.status(401).json({ error: "Password errata" });
            return 
        }

        // Generiamo il token JWT
        const token = jwt.sign(
        {
            id: utente.id,
            permessi: utente.permessi,
            nome: utente.nome
        },
        secret,
        { expiresIn: "1h" }
        );

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante il login" });
    }
});



app.get("/micro", async (req, res) => {
    const {mac } = req.body;

    if (!mac) {
        res.status(401).json({ error: "mac mancante" });
        return 
    }
    try {
        const [result] = await pool.query(
            "SELECT * FROM micro WHERE mac = ?",
            [mac]
        );
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore durante la get del micro" });
    }
});



app.put("/micro", async (req, res) => {
    const { token, mac, latitude, longitude } = req.body;
    if (!token) {
        res.status(401).json({ error: "Token mancante" });
        return 
    }

    if (!mac || !latitude || !longitude) {
        res.status(401).json({ error: "mac, latitude o longitude mancante" });
        return 
    }
    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        console.log("decoded token:", decoded);

        // Controllo permessi 
        if (decoded.permessi !== "admin" && decoded.permessi !== "micro") {
            res.status(403).json({ error: "Non hai i permessi per inserire dati" });
            return 
        }
        const [result] = await pool.query(
            "INSERT INTO micro (mac, latitude, longitude) VALUES (?, ?, ?)",
            [mac, latitude, longitude]
        );
        console.log("Nuovo micro registrato:", result);
        res.json({ status: "ok" });
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === "TokenExpiredError") {
                console.error("Token scaduto:", error.message);
                res.status(401).json({ error: "Token scaduto" });
                return 
            } else if (error.name === "JsonWebTokenError") {
                console.error("Token non valido:", error.message);
                res.status(403).json({ error: "Token non valido" });
                return 
            } 
        } else {
            console.error(error);
            res.status(500).json({ error: "Errore durante la registrazione micro" });
        }
    }
});

// richieste /dati

app.get("/dati", async (req, res) => {
    const { idMicro } = req.body;

    // Controlla se il token è presente
    if (!idMicro) {
        res.status(401).json({ error: "idMicro mancante" });
        return 
    }

    try {

        // Inseriamo i dati nella tabella "dati"
        const [result] = await pool.query(
            "SELECT * FROM dati WHERE idMicro = ?",
            [idMicro]
        );
        res.json(result);

    } catch (error) {
        console.error("Errore sconosciuto:", error);
        res.status(500).json({ error: "Errore sconosciuto" });
        return   
    }
});



app.delete("/dati", async (req, res) => {
    const { token, idMicro } = req.body;
  
    // 1. Controllo Token
    if (!token) {
        res.status(401).json({ error: "Token mancante" });
        return;
    }
    // 2. Controllo MAC
    if (!idMicro) {
        res.status(400).json({ error: "idMicro mancante" });
        return;
    }
  
    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        console.log("decoded token:", decoded);
    
        // 3. Controllo permessi (admin O micro O web)
        if (decoded.permessi !== "admin" && decoded.permessi !== "micro" && decoded.permessi !== "web") {
            res.status(403).json({ error: "Non hai i permessi per inserire dati" });
            return;
        }
    
        // Costruiamo la query finale
        // il controllo se non è stato eliminato nulla lo fa chi lo usa
        const [result] = await pool.query("DELETE FROM dati WHERE idMicro = ?", [idMicro]);

        res.json({ result });
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === "TokenExpiredError") {
                console.error("Token scaduto:", error.message);
                res.status(401).json({ error: "Token scaduto" });
                return;
            } else if (error.name === "JsonWebTokenError") {
                console.error("Token non valido:", error.message);
                res.status(403).json({ error: "Token non valido" });
                return;
            } else {
                console.error(error);
                res.status(500).json({ error: "Errore durante la modifica di micro" });
                return;
            }
        } else {
            console.error(error);
            res.status(500).json({ error: "Errore sconosciuto" });
            return;
        }
    }
});



app.put("/dati", async (req, res) => {
    const { token, co2, pm10, pm2_5, idMicro, latitude, longitude } = req.body;

    // Controlla se il token è presente
    if (!token) {
        res.status(401).json({ error: "Token mancante" });
        return 
    }

    try {
        // Verifica la validità del token
        const decoded = jwt.verify(token, secret) as JwtPayload;
        console.log("decoded token:", decoded);

        // Controllo permessi (attenzione: l'OR logico qui è quasi sempre vero, potresti voler usare AND)
        if (decoded.permessi !== "admin" || decoded.permessi !== "micro") {
            res.status(403).json({ error: "Non hai i permessi per inserire dati" });
            return 
        }

        // Inseriamo i dati nella tabella "dati"
        const [result] = await pool.query(
        "INSERT INTO dati (co2, pm10, pm2_5, idMicro, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)",
        [co2, pm10, pm2_5, idMicro, latitude, longitude]
        );

        res.json(result);
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === "TokenExpiredError") {
                console.error("Token scaduto:", error.message);
                res.status(401).json({ error: "Token scaduto" });
                return 
            } else if (error.name === "JsonWebTokenError") {
                console.error("Token non valido:", error.message);
                res.status(403).json({ error: "Token non valido" });
                return 
            } else {
                console.error("Errore del server:", error);
                res.status(500).json({ error: "Errore nel salvataggio dei dati" });
                return
            }
        } else {
            console.error("Errore sconosciuto:", error);
            res.status(500).json({ error: "Errore sconosciuto" });
            return 
        }
    }
});


app.post("/micro", async (req, res) => {
    const { token, mac, latitude, longitude, attivo } = req.body;
  
    // 1. Controllo Token
    if (!token) {
        res.status(401).json({ error: "Token mancante" });
        return;
    }
    // 2. Controllo MAC
    if (!mac) {
        res.status(400).json({ error: "mac mancante" });
        return;
    }
  
    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        console.log("decoded token:", decoded);
    
        // 3. Controllo permessi (admin O micro)
        if (decoded.permessi !== "admin" && decoded.permessi !== "micro" && decoded.permessi !== "web") {
            res.status(403).json({ error: "Non hai i permessi per inserire dati" });
            return;
        }
    
        // 4. Costruiamo query di UPDATE in modo dinamico
        const fields: string[] = [];
        const params: any[] = [];
    
        // Controlliamo se i valori non sono undefined o null, e nel caso aggiorniamo
        if (latitude !== undefined) {
            fields.push("latitude = ?");
            params.push(latitude);
        }
        if (longitude !== undefined) {
            fields.push("longitude = ?");
            params.push(longitude);
        }
        if (attivo !== undefined) {
            fields.push("attivo = ?");
            params.push(attivo);
        }
    
        // Se non ci sono campi da modificare, esci
        if (fields.length === 0) {
            res.status(400).json({ error: "Nessun campo da modificare" });
            return;
        }
    
      // Costruiamo la query finale
      // Esempio: UPDATE micro SET latitude = ?, attivo = ? WHERE mac = ?
        const sql = `UPDATE micro SET ${fields.join(", ")} WHERE mac = ?`;
        params.push(mac);
    
        const [result] = await pool.query(sql, params);
    
        res.json({ status: "ok", result });
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === "TokenExpiredError") {
                console.error("Token scaduto:", error.message);
                res.status(401).json({ error: "Token scaduto" });
                return;
            } else if (error.name === "JsonWebTokenError") {
                console.error("Token non valido:", error.message);
                res.status(403).json({ error: "Token non valido" });
                return;
            } else {
                console.error(error);
                res.status(500).json({ error: "Errore durante la modifica di micro" });
                return;
            }
        } else {
            console.error(error);
            res.status(500).json({ error: "Errore sconosciuto" });
            return;
        }
    }
});


app.delete("/micro", async (req, res) => {
    const { token, mac } = req.body;
  
    // 1. Controllo Token
    if (!token) {
        res.status(401).json({ error: "Token mancante" });
        return;
    }
    // 2. Controllo MAC
    if (!mac) {
        res.status(400).json({ error: "mac mancante" });
        return;
    }
  
    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        console.log("decoded token:", decoded);
    
        // 3. Controllo permessi (admin O micro O web)
        if (decoded.permessi !== "admin" && decoded.permessi !== "micro" && decoded.permessi !== "web") {
            res.status(403).json({ error: "Non hai i permessi per inserire dati" });
            return;
        }
    
        // Costruiamo la query finale
        // il controllo se non è stato eliminato nulla lo fa chi lo usa
        const [result] = await pool.query("DELETE FROM micro WHERE mac = ?", [mac]);

        res.json({ result });
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === "TokenExpiredError") {
                console.error("Token scaduto:", error.message);
                res.status(401).json({ error: "Token scaduto" });
                return;
            } else if (error.name === "JsonWebTokenError") {
                console.error("Token non valido:", error.message);
                res.status(403).json({ error: "Token non valido" });
                return;
            } else {
                console.error(error);
                res.status(500).json({ error: "Errore durante la modifica di micro" });
                return;
            }
        } else {
            console.error(error);
            res.status(500).json({ error: "Errore sconosciuto" });
            return;
        }
    }
});


app.get("/documentazione", async (req, res) => { 
    const filePath = path.join(__dirname, 'public', 'documentazione.html');
    res.sendFile(filePath);
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});



