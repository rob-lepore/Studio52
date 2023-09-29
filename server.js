const express = require("express");
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());


mongoose.connect('mongodb+srv://robertoleporerl:wNRTFSu8C49Jzbm4@calendario.0ou86bp.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Errore nella connessione al database:'));
db.once('open', () => {
    console.log('Connesso al database MongoDB');
});

const port = process.env.PORT || 4000
app.listen(port, () => {
    console.log("listening on " + port );
});

const User = require('./models/user');
const Event = require('./models/event');

app.post("/api/users/create", (req, res) => {
    try {
        const { username, phone, email, password } = req.body;

        bcrypt.genSalt(10).then(salt => bcrypt.hash(password, salt)).then(async hash => {
            const newUser = new User({ username, phone, email, password: hash, isAdmin: false });
            try{
              await newUser.save();
              res.cookie("user_id",newUser._id.toString());
              res.status(200).json(newUser);
            } catch (err) {
              console.log(err)
              res.status(400).json({message: "Email già utilizzata"});
            }
            
        })
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Errore durante la creazione dell\'utente' });
    }
})

app.post("/api/users/login", async (req, res) => {
    try {
        const { email, password } = req.body;
    
        // Cerca un utente con l'email fornita nel database
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({ message: 'Utente non trovato' });
        }
    
        // Verifica la password
        const passwordMatch = await bcrypt.compare(password, user.password);
    
        if (!passwordMatch) {
          return res.status(401).json({ message: 'Password errata' });
        }
        res.cookie("user_id",user._id.toString());
        res.status(200).json({ message: 'Accesso consentito' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Errore durante il tentativo di accesso' });
      }
})

app.get("/api/users/is-logged-in", async (req, res) => {
  const user = await User.findById(req.cookies.user_id);
  res.json({ok: user != null});
})

app.get("/api/users/infos", async (req, res) => {
  try {
    const userId = req.cookies.user_id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore durante la ricerca delle informazioni dell\'utente' });
  }
})

app.post('/api/events/create', async (req, res) => {
  try {
    const eventData = req.body;
    console.log(req.body);
    const newEvent = new Event(eventData);
    await newEvent.save();
  
    // Restituisci il nuovo evento creato come risposta JSON
    res.status(200).json(newEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore durante la creazione dell\'evento' });
  }
});

app.get("/api/events/all", async (req, res) => {
  try {
    // Cerca tutti gli eventi nel database utilizzando il modello Event
    let events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore durante il recupero degli eventi' });
  }
}) 

app.get("/api/events/add_artist", async(req, res) => {
  const name = req.query.name;
  const eventId = req.query.event;
  const userId = req.cookies.user_id;

  const user = await User.findById(userId);
  const event = await Event.findById(eventId);

  let artistData = {
    name,
    email: user.email,
    phone: user.phone,
    username: user.username,
    userId
  }

  event.artists.push(artistData);

  await event.save();
  
  res.json({message: "Hai comunicato la tua disponibilità!"});
})


app.get("/api/events/infos", async (req, res) => {
  const event = await Event.findById(req.query.id);
  res.json(event);
})

app.put('/api/events/update/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId; // Ottieni l'ID dell'evento dalla richiesta
    const eventDataToUpdate = req.body; // Nuovi dati dell'evento dalla richiesta del client

    // Utilizza il metodo findByIdAndUpdate per aggiornare l'evento
    const updatedEvent = await Event.findByIdAndUpdate(eventId, eventDataToUpdate, {
      new: true, // Imposta questa opzione su true per ottenere l'evento aggiornato come risultato
    });

    if (!updatedEvent) {
      // Se l'evento non è stato trovato, restituisci una risposta di errore
      return res.status(404).json({ error: 'Evento non trovato' });
    }

    // Restituisci l'evento aggiornato come risposta
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento dell\'evento' });
  }
});

app.put('/api/events/:eventId/set-chosen', async (req, res) => {
  try {
    const eventId = req.params.eventId; // Ottieni l'ID dell'evento dalla richiesta
    const { artistIdToKeep } = req.body; // ID dell'artista da mantenere come chosen

    // Trova l'evento tramite l'ID
    const event = await Event.findById(eventId);

    if (!event) {
      // Se l'evento non è stato trovato, restituisci una risposta di errore
      return res.status(404).json({ error: 'Evento non trovato' });
    }

    // Imposta chosen a false per tutti gli artisti tranne quello specificato
    event.artists.forEach((artist) => {
      artist.chosen = artist._id.toString() === artistIdToKeep;
    });

    // Salva l'evento aggiornato nel database
    await event.save();

    // Restituisci una risposta di successo
    res.status(200).json({ message: 'Stato chosen aggiornato con successo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento dello stato chosen' });
  }
});

app.delete('/api/events/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId; // Ottieni l'ID dell'evento dalla richiesta

    // Utilizza il metodo findByIdAndRemove di Mongoose per eliminare l'evento
    const deletedEvent = await Event.findByIdAndRemove(eventId);

    if (!deletedEvent) {
      // Se l'evento non è stato trovato, restituisci una risposta di errore
      return res.status(404).json({ error: 'Evento non trovato' });
    }

    // Restituisci una risposta di successo
    res.status(200).json({ message: 'Evento eliminato con successo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'evento' });
  }
});


app.delete('/api/events/:eventId/artists/:artistId', async (req, res) => {
  try {
    const eventId = req.params.eventId; // Ottieni l'ID dell'evento dalla richiesta
    const artistId = req.params.artistId; // Ottieni l'ID dell'artista dalla richiesta

    // Trova l'evento tramite l'ID
    const event = await Event.findById(eventId);

    if (!event) {
      // Se l'evento non è stato trovato, restituisci una risposta di errore
      return res.status(404).json({ error: 'Evento non trovato' });
    }

    // Filtra la lista degli artisti per rimuovere l'artista specificato
    event.artists = event.artists.filter((artist) => artist._id.toString() !== artistId);

    // Salva l'evento aggiornato nel database
    await event.save();

    // Restituisci una risposta di successo
    res.status(200).json({ message: 'Artista eliminato dall\'evento con successo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'artista dall\'evento' });
  }
});