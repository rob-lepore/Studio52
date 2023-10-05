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
  console.log("listening on " + port);
});

const User = require('../models/user');
const Event = require('../models/event');

const compactEvents = (events) => {
  // Inizializza un array per gli eventi compattati
  const compactedEvents = [];

  let currentEvent = events[0]; // Inizia con il primo evento
  for (let i = 1; i < events.length; i++) {
    const nextEvent = events[i];

    // Verifica se gli eventi sono consecutivi con stesso titolo e descrizione
    if (
      currentEvent.title === nextEvent.title &&
      currentEvent.description === nextEvent.description &&
      currentEvent.available && nextEvent.available &&
      !currentEvent.allDay && !nextEvent.allDay &&
      currentEvent.end.getTime() === nextEvent.start.getTime()
    ) {
      // Aggiungi la durata dell'evento successivo a quello corrente
      currentEvent.end = nextEvent.end;
    } else {
      // Gli eventi non sono consecutivi o non sono uguali, quindi aggiungi l'evento corrente agli eventi compattati
      compactedEvents.push(currentEvent);
      currentEvent = nextEvent; // Passa all'evento successivo
    }
  }

  // Aggiungi l'ultimo evento corrente agli eventi compattati
  compactedEvents.push(currentEvent);

  return compactedEvents;
}

/**
 * POST /api/users/create: create a new user
 */
app.post("/api/users/create", (req, res) => {
  try {
    const { username, phone, email, password } = req.body;

    bcrypt.genSalt(10).then(salt => bcrypt.hash(password, salt)).then(async hash => {
      const newUser = new User({ username, phone, email, password: hash, isAdmin: false });
      try {
        await newUser.save();
        res.cookie("user_id", newUser._id.toString());
        res.status(200).json(newUser);
      } catch (err) {
        console.log(err)
        res.status(400).json({ message: "Email già utilizzata" });
      }

    })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore durante la creazione dell\'utente' });
  }
})

/**
 * POST /api/users/login: log into an account
 */
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
    res.cookie("user_id", user._id.toString());
    res.status(200).json({ message: 'Accesso consentito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore durante il tentativo di accesso' });
  }
})

/**
 * GET /api/users/is-logged-in: tells if the current user is logged in
 */
app.get("/api/users/is-logged-in", async (req, res) => {
  const user = await User.findById(req.cookies.user_id);
  res.json({ ok: user != null });
})

/**
 *  GET /api/users/infos: get data relative to the current user
 */
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

/**
 * POST /api/events/create: creates a new event
 */
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

/**
 * GET /api/event/all: returns all events
 */
app.get("/api/events/all", async (req, res) => {
  try {
    // Cerca tutti gli eventi nel database utilizzando il modello Event
    let events = await Event.find();
    const userId = req.cookies.user_id;
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      events = events.filter(e => e.available || e.artists[0].userId == userId)
    }
    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore durante il recupero degli eventi' });
  }
})

/**
 * GET /api/events/:eventId/add-artist: adds an artist to an event
 */
app.get("/api/events/:eventId/add-artist", async (req, res) => {
  const name = req.query.name;
  const eventId = req.params.eventId;
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

  res.json({ message: "Hai comunicato la tua disponibilità!" });
})

/**
 * GET /api/events/:eventId: gets the event by id
 */
app.get("/api/events/:eventId", async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  res.json(event);
})

/**
 * PUT /api/events/:eventId/update: changes the event by id
 */
app.put('/api/events/:eventId/update', async (req, res) => {
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

/**
 * PUT /api/events/:eventId/set-chosen: changes the event by id
 */
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

/**
 * DELETE /api/events/:eventId: delete the event by id
 */
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

/**
 * DELETE /api/events/:eventId/artists/:artistId: removes the artist from the event
 */
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


/**
 * POST /api/events/:eventId/add-reservation
 */
app.post('/api/events/:eventId/add-reservation', async (req, res) => {
  try {
    const { start, end, name } = req.body;
    const eventId = req.params.eventId;
    const userId = req.cookies.user_id;

    // Trova l'evento esistente dal database
    const existingEvent = await Event.findById(eventId);

    if (!existingEvent) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }

    // Calcola i dati per i nuovi eventi
    const user = await User.findById(userId);

    let artistData = {
      name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      userId
    }

    const T0 = existingEvent.start;
    const T3 = existingEvent.end;

    let date = existingEvent.start.toISOString().substring(0,11);
    let T1 = new Date(date + start + ":00.000+02:00")
    let T2 = new Date(date + end + ":00.000+02:00")
    /*
    const T1 = new Date(existingEvent.start);
    T1.setHours(start.split(":")[0]);
    T1.setMinutes(start.split(":")[1]);
    const T2 = new Date(existingEvent.start);
    T2.setHours(end.split(":")[0]);
    T2.setMinutes(end.split(":")[1]);
    */
    console.log({T0, T1, T2, T3})


    const event2 = new Event({
      title: existingEvent.title,
      start: T1,
      end: T2,
      description: existingEvent.description,
      classNames: existingEvent.classNames + " reserved-event",
      allDay: existingEvent.allDay,
      available: false,
      artists: [artistData]
    });

    if (T0.toString() != T1.toString()) {
      const event1 = new Event({
        title: existingEvent.title,
        start: T0,
        end: T1,
        description: existingEvent.description,
        classNames: existingEvent.classNames,
        allDay: existingEvent.allDay,
        available: true,
      });
      await event1.save();
    }

    if (T2.toString() != T3.toString()) {
      const event3 = new Event({
        title: existingEvent.title,
        start: T2,
        end: T3,
        description: existingEvent.description,
        classNames: existingEvent.classNames,
        allDay: existingEvent.allDay,
        available: true,
      });
      await event3.save();
    }
    await event2.save();
    await Event.findByIdAndRemove(eventId);

    return res.status(200).json({ message: 'Prenotazione completata con successo' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Si è verificato un errore durante l\'aggiornamento dell\'evento' });
  }
});

app.delete('/api/events/:eventId/remove-reservation', async (req, res) => {
  try {
    const eventId = req.params.eventId; // Ottieni l'ID dell'evento dalla richiesta

    // Utilizza il metodo findByIdAndUpdate per aggiornare l'evento
    const ev = await Event.findById(eventId);
    const updatedEvent = await Event.findByIdAndUpdate(eventId, {
      available: true,
      artists: [],
      classNames: ev.classNames.split(" ")[0]
    }, {
      new: true,
    });

    if (!updatedEvent) {
      // Se l'evento non è stato trovato, restituisci una risposta di errore
      return res.status(404).json({ error: 'Evento non trovato' });
    }

    const events = await Event.find().sort({ start: 1 });
    let compactedEvents = compactEvents(events);
    await Event.deleteMany({});
    await Event.insertMany(compactedEvents);


    // Restituisci l'evento aggiornato come risposta
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento dell\'evento' });
  }
})

app.get('/api/compact-events', async (req, res) => {
  try {
    const events = await Event.find().sort({ start: 1 });
    let compactedEvents = compactEvents(events);
    await Event.deleteMany({});
    await Event.insertMany(compactedEvents);
    return res.status(200).json({ message: 'Eventi compattati con successo' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Si è verificato un errore durante la compattazione degli eventi' });
  }
});

app.get("/api/events/by-user/:userId", async (req, res) => {
  let events = await Event.find({});
  events = events.filter(e => e.artists.length > 0 && e.artists[0].userId == req.params.userId && !e.allDay);
  res.json({events})
})

module.exports = app;