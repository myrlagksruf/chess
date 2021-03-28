import { Chess } from './Chess.js';
const tbody = document.querySelector('tbody') as HTMLTableSectionElement;
const container = document.querySelector('#container') as HTMLDivElement;
const menu = document.querySelector('#menu') as HTMLDivElement;
const tac = document.querySelector('#tac') as HTMLAudioElement;
const coin = document.querySelector('#coin') as HTMLAudioElement;
const newButton = document.querySelector('#menu button') as HTMLButtonElement;
const cur = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
let wait = false;
for (let i = 0; i < 8; i++) {
    const div2 = document.createElement('div');
    for (let j = 0; j < 8; j++) {
        const alpha = String.fromCharCode(97 + j);
        const div = document.createElement('div');
        div.dataset.pos = `${alpha}${8 - i}`;
        div.classList.add('chess');
        div.classList.add(`x${i % 2 ^ j % 2}`);
        div2.appendChild(div);
    }
    container.appendChild(div2);
}
const getPos = (pos:string, type:string) => {
    if (type === 'b') {
        return `${pos[0]}${9 - Number(pos[1])}`;
    }
    return pos;
};
const isWin = (eat:string) => {
    if(eat === 'black' || eat === 'white'){
        if(cur.player === eat[0]){
            socket.emit('win');
        } else {
            socket.emit('lose');
        }
    }
};

newButton.addEventListener('click', e => {
    const str = prompt('방이름을 써주세요.');
    if(str){
        socket.emit('make', str);
    }
});
tbody.addEventListener('click', e => {
    const tar = e.target as HTMLButtonElement;
    if(tar.nodeName === 'BUTTON'){
        const par = tar.parentElement.parentElement as HTMLTableRowElement;
        const id = par.dataset.id;
        socket.emit('room', id);
    }
});
container.addEventListener('click', e => {
    const tar = e.target as HTMLDivElement;
    const par = e.currentTarget as HTMLDivElement;
    cur.renderAll();
    if (tar.dataset.piece && tar.dataset.pos && (wait && tar.classList.contains('chess') && (par.classList.contains('pick') || cur.isMove(tar.dataset.piece))) && cur.isPlayer()) {
        if (par.classList.contains('pick')) {
            const sel = document.querySelector('div.sel') as HTMLDivElement;
            if (tar !== sel && tar.classList.contains('active') && sel.dataset.pos) {
                const posStart = getPos(sel.dataset.pos, cur.player);
                const posEnd = getPos(tar.dataset.pos, cur.player);
                const eat = cur.movePiece(posStart, posEnd);
                console.log(eat);
                if (eat) {
                    coin.play();
                }
                else {
                    tac.play();
                }
                socket.emit('tac', {str: cur.str, eat});
                isWin(eat);
                cur.renderAll();
            }
            document.querySelectorAll('div.active').forEach((v) => v.classList.remove('active'));
            sel.classList.remove('sel');
            par.classList.remove('pick');
        }
        else {
            const set = cur.moveGenerator(getPos(tar.dataset.pos, cur.player));
            for (let i of set) {
                const temp = document.querySelector(`[data-pos="${getPos(i, cur.player)}"]`) as HTMLDivElement;
                temp.classList.add('active');
            }
            par.classList.add('pick');
            tar.classList.add('sel');
        }
    }
});
const makeTd = (tr:HTMLTableRowElement, obj) => {
    tr.dataset.id = obj.room;
    tr.innerHTML = '';
    const td1 = document.createElement('td');
    td1.innerHTML = obj.ori;
    tr.appendChild(td1);
    const td2 = document.createElement('td');
    td2.innerHTML = obj.size;
    tr.appendChild(td2);
    const td3 = document.createElement('td');
    td3.innerHTML = `<button>방 입장</button>`;
    tr.appendChild(td3);
};
const socket = io(location.origin);
const s1 = document.querySelector('h1 > span:nth-child(1)') as HTMLSpanElement;
const s2 = document.querySelector('h1 > span:nth-child(2)') as HTMLSpanElement;
const setting = (obj, str) => {
    s2.innerHTML = `, 방이름 : ${obj.ori}`;
    if(!cur.player) cur.player = obj.player;
    menu.classList.add('room');
    s1.innerHTML = str;
    cur.renderAll();
};
socket.on('delete', e => {
    document.querySelector(`tr[data-id="${e}"]`)?.remove();
});
socket.on('start', e => {
    setting(e, '기다리는 중');
})
socket.on('main', e => {
    let mes = '게임 시작';
    setting(e, mes);
    if(cur.player === 'o'){
        s1.innerHTML = '관전 시작';
    }
    wait = true;
});
socket.on('close', (e:string) => {
    s1.innerHTML = e;
    wait = false;
});

socket.on('set', e => {
    for(let i of e){
        let A:HTMLTableRowElement = tbody.querySelector(`tr[data-id="${i.room}"]`);
        if(!A){
            A = document.createElement('tr');
            A.dataset.id = i.room;
            tbody.appendChild(A);
        }
        makeTd(A, i);
    }
});
socket.on('tac', e => {
    Object.assign(cur, Chess.fenToData(e.str));
    isWin(e.eat);
    if (e.eat) {
        coin.play();
    }
    else {
        tac.play();
    }
    cur.renderAll();
});
socket.on('message', e => {
    alert(e);
});