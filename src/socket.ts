import { Server } from 'socket.io';
import express from 'express';
export const app = express();
const io = new Server(app.listen(4000));
const map = new Map();
let i = 0;
io.on('connection', socket => {
    let r = `room ${i}`;
    while(true){
        const cur = map.get(r);
        if(cur?.length > 1){
            i++;
            r = `room ${i}`;
        } else {
            break;
        }
    }
    socket.join(r);
    const arr = map.get(r) ?? [];
    const id = socket;
    arr.push(id);
    map.set(id, r);
    map.set(r, arr);
    if(arr.length === 2){
        for(let i of arr){
            i.emit('start', '게임 시작');
        }
        socket.emit('first', { room: r, player:'b'});
    } else {
        socket.emit('first', { room: r, player:'w'});
    }
    socket.on('tac', e => {
        const room = map.get(id);
        socket.to(room).emit('tac', e);
    });
    socket.on('win', e => {
        socket.emit('message', '승리하셨습니다.');
    });
    socket.on('lose', e => {
        socket.emit('message', '패배하셨습니다.');
    });
    socket.on('disconnect', e => {
        const room = map.get(id);
        map.delete(id);
        const rooms = map.get(room);
        if(rooms){
            for(let i of rooms){
                map.delete(i);
                i.emit('close', 'room 파괴됨');
                i.disconnect();
            }
        }
        map.delete(room);
    });
});