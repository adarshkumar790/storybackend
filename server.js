const app = require('./app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(5000, () => {
    console.log(`Server running on port ${5000}`);
});
