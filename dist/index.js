import express from 'express';
import { app } from './socket.js';
app.use('/public', express.static('./dist/public'));
app.use('/img', express.static('./view/img'));
// app.use('/', (req, res, next) => {
//     console.log(req.url);
//     next();
// })
app.use('/node_modules', express.static('./node_modules'));
app.get('/', (req, res) => {
    res.sendFile('index.html', {
        root: './view'
    });
});
//# sourceMappingURL=index.js.map