const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://aerguetab:analgesico@cluster0.2tvoknd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {    
    // ---- Esto se quitó del código, porque la versión de la Base es diferente ---- //
    //useCreateIndex: true,
    //useNewUrlParse: true, 
    //useFindAndModify: false 
})
    .then(db => console.log('DB is connected')) //Cuando te conectes muestra en consola DB is connected
    .catch(err => console.error(err)); // PROMESA