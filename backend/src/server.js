const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 8081;

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);

        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    }
});
