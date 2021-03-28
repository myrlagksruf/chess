import { Server } from 'socket.io';
import express from 'express';
import crypto from 'crypto';
export const app = express();
const io = new Server(app.listen(5000));
const map = new Map();
io.on('connection', socket => { 
    const rooms = io.of('/').adapter.rooms;
    const id = [...socket.rooms][0];
    // let r = `room ${i}`;
    // while(true){
    //     const cur = map.get(r);
    //     if(cur?.length > 1){
    //         i++;
    //         r = `room ${i}`;
    //     } else {
    //         break;
    //     }
    // }
    // socket.join(r);
    // const arr = map.get(r) ?? [];
    // const id = socket;
    // arr.push(id);
    // map.set(id, r);
    // map.set(r, arr);
    // if(arr.length === 2){
    //     for(let i of arr){
    //         i.emit('start', '게임 시작');
    //     }
    //     socket.emit('first', { room: r, player:'b'});
    // } else {
    //     socket.emit('first', { room: r, player:'w'});
    // }
    
    const arr = [];
    for(let [room, set] of rooms){
        if(room.length === 44){
            arr.push({room, ori:map.get(room), size:set.size});
        }
    }
    socket.emit('set', arr);
    socket.on('make', e => {
        const j = crypto.createHash('sha256').update(e).digest('base64');
        const room = rooms.get(j);
        map.set(id, j);
        map.set(j, e);
        if(!room || room.size === 0){
            socket.join(j);
            socket.join('w');
            socket.emit('start', {player:'w', room:j, ori:e});
            socket.broadcast.emit('set', [{room:j, ori:e, size:1}]);
        } else {
            socket.emit('message', '이미 있는 방입니다.');
        }
    });

    socket.on('room', j => {
        const room = rooms.get(j);
        if(!room){
            socket.emit('message', '방이 이미 없습니다. 새로고침 해주세요.');
            return;
        }
        map.set(id, j);
        const e = map.get(j);
        let player = 'o';
        let other = null;
        if(!room){
            player = 'w';
        } else if(room.size === 1){
            const s = [...room][0];
            other = io.of('/').sockets.get(s).rooms;
            if(other.has('w')){
                player = 'b';
            } else {
                player = 'w';
            }
        } else {

        }
        socket.join(player);
        socket.join(j);
        socket.emit('main', {player, room:j, ori:e});
        let otherStr = 'o';
        if(player === 'w'){
            otherStr = 'b';
        } else if(player === 'b'){
            otherStr = 'w';
        }
        socket.to(j).emit('main', {player: otherStr, room:j, ori:e});
        socket.broadcast.emit('set', [{room:j, ori:e, size:room.size}]);
    });
    socket.on('win', e => {
        socket.emit('message', '승리하셨습니다.');
        for(let i of socket.rooms){
            socket.leave(i);
            map.delete(i);
            socket.broadcast.emit('delete', i);
        }
        socket.disconnect();
    });
    socket.on('lose', e => {
        socket.emit('message', '패배하셨습니다.');
        for(let i of socket.rooms){
            socket.leave(i);
            map.delete(i);
            socket.broadcast.emit('delete', i);
        }
        socket.disconnect();
    });
    socket.on('tac', e => {
        let room = '';
        for(let i of socket.rooms){
            if(i.length === 44){
                room = i;
                break;
            }
        }
        socket.to(room).emit('tac', e);
    });
    socket.on('disconnect', e => {
        const room = map.get(id);
        map.delete(id);
        const xxx = rooms.get(room);
        socket.to(room).emit('close', '상대방이 게임을 나갔습니다.');
        socket.broadcast.emit('delete', room);
        if(xxx){
            for(let i of xxx){
                io.of('/').sockets.get(i).disconnect();
                map.delete(i);
            }
        }
        map.delete(room);
    });
});
