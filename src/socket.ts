import { Server, Socket } from 'socket.io';
import express from 'express';
import crypto from 'crypto';
import { Rooms } from './public/type.js';
export const app = express();
const io = new Server(app.listen(5000));
const map = new Map();

const whatRoom = (set:Set<string>, type:number = 44):string => {
    for(let i of set){
        if(i.length === type) return i;
    }
    return '';
};

const whatRooms = (m:Map<string,Set<string>>, type:number = 44, find:string = ''):Rooms[] => {
    const arr:Rooms[] = [];
    if(find){
        for(let [room, set] of Array.from(m)){
            if(room.length === type && find === room) {
                arr.push({room, ori:map.get(room), set, size:set.size});
                break;
            }
        }
    } else {
        for(let [room, set] of Array.from(m)){
            if(room.length === type)
                arr.push({room, ori:map.get(room), set, size:set.size});
        }
    }
    return arr;
};

const roomOut = (socket:Socket, rooms:Map<string, Set<string>>, reason) => {
    const j = whatRoom(socket.rooms);
    const allMembers = rooms.get(j);
    if(allMembers){
        if(reason.player === 'w' || reason.player === 'b'){
            for(let i of allMembers){
                const other = io.of('/').sockets.get(i);
                other.leave(j);
                if(i !== socket.id)
                    other.emit('close', reason.mes);
                else
                    other.emit('close', '방을 나갔습니다.');
            }
            socket.emit('delete', j);
            socket.broadcast.emit('delete', j);
            map.delete(j);
        } else {
            const ori = map.get(j);
            const room = whatRooms(rooms, 44, j)[0];
            socket.leave(j);
            socket.emit('close', '방을 나갔습니다.');
            socket.emit('set', [{room:j, ori, size:room.size - 1}]);
            socket.broadcast.emit('set', [{room:j, ori, size:room.size - 1}]);
        }
        
    }
};

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
    const arr = whatRooms(rooms);
    socket.emit('set', arr);
    socket.on('make', e => {
        const j = crypto.createHash('sha256').update(e).digest('base64');
        const room = whatRooms(rooms, 44, j)[0];
        if(!room || room.size === 0){
            map.set(j, e);
            socket.join(j);
            socket.join('w');
            socket.emit('start', {player:'w', room:j, ori:e});
            socket.broadcast.emit('set', [{room:j, ori:e, size:1}]);
        } else {
            socket.emit('message', '이미 있는 방입니다.');
        }
    });
    socket.on('active', e => {
        const room = whatRoom(socket.rooms);
        socket.emit(e.type, e);
        socket.to(room).emit(e.type, e);
    });
    socket.on('room', j => {
        const room = whatRooms(rooms, 44, j)[0];
        if(!room){
            socket.emit('message', '방이 이미 없습니다. 새로고침 해주세요.');
            return;
        }
        const e = map.get(j);
        let player = 'o';
        let other = null;
        if(!room){
            player = 'w';
        } else if(room.size === 1){
            const s = [...room.set][0];
            other = io.of('/').sockets.get(s).rooms;
            if(other.has('w')){
                player = 'b';
            } else {
                player = 'w';
            }
        }
        socket.join(player);
        socket.join(j);
        socket.emit('main', {player, room:j, ori:e});
        let otherStr = 'o';
        if(player === 'w'){
            otherStr = 'b';
        } else if(player === 'b'){
            otherStr = 'w';
        } else {
            const others = whatRooms(rooms, 44, j)[0];
            for(let i of others.set){
                const other = io.of('/').sockets.get(i);
                const player = whatRoom(other.rooms, 1);
                if(player === 'w' || player === 'b'){
                    other.emit('get');
                }
            }
        }
        socket.to(j).emit('main', {player: otherStr, room:j, ori:e});
        socket.broadcast.emit('set', [{room:j, ori:e, size:room.size + 1}]);
    });
    socket.on('win', e => {
        socket.emit('message', '승리하셨습니다.');
        for(let j of socket.rooms){
            socket.leave(j);
            socket.emit('close', '게임에서 승리하여 게임을 나갔습니다.');
            map.delete(j);
            socket.broadcast.emit('delete', j);
        }
    });
    socket.on('lose', e => {
        socket.emit('message', '패배하셨습니다.');
        for(let j of socket.rooms){
            socket.leave(j);
            socket.emit('close', '게임에서 패배하여 게임을 나갔습니다.');
            map.delete(j);
            socket.broadcast.emit('delete', j);
        }
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

    socket.on('close', e => {
        roomOut(socket, rooms, e);
    });

    socket.on('disconnecting', e => {
        const player = whatRoom(socket.rooms, 1);
        console.log(player);
        roomOut(socket, rooms, {player, mes:'상대방의 인터넷이 끊겼습니다.'});
    });
    // socket.on('disconnect', e => {
    //     const room = map.get(id);
    //     map.delete(id);
    //     const xxx = rooms.get(room);
    //     socket.to(room).emit('close', '상대방이 게임을 나갔습니다.');
    //     socket.broadcast.emit('delete', room);
    //     if(xxx){
    //         for(let i of xxx){
    //             io.of('/').sockets.get(i).disconnect();
    //             map.delete(i);
    //         }
    //     }
    //     map.delete(room);
    // });
});
