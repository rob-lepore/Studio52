const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: String, // Numero di telefono è ora opzionale
  username: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Riferimento a un modello utente se necessario
    required: true,
  },
  chosen: {
    type: Boolean,
    default: false,
  }
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: false,
  },
  description: {
    type: String,
    required: true,
    default: "Nessuna descrizione disponibile",
  },
  classNames: {
    type: String,
    required: true,
  },
  allDay: {
    type: Boolean,
    required: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
  artists: [artistSchema], // Lista di disponibilità

});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;