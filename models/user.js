const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: false,
        required: true, // Il campo è obbligatorio
    },
    email: {
        type: String,
        unique: true, // Assicura l'unicità degli indirizzi email
        required: true, // Il campo è obbligatorio
    },
    password: {
        type: String,
        required: true, // Il campo è obbligatorio
    },
    phone: { // Aggiunta del campo numero di cellulare
        type: Number,
        required: true, // Puoi impostare questo campo come obbligatorio o facoltativo a seconda delle tue esigenze
    },
    isAdmin: {
        type: Boolean,
        required: true
    }
    
});

const User = mongoose.model('User', userSchema);
module.exports = User;
