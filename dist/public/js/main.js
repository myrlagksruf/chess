import { Chess } from './Chess.js';
const container = document.querySelector('#container');
const tac = document.querySelector('#tac');
const coin = document.querySelector('#coin');
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
const getPos = (pos, type) => {
    if (type === 'b') {
        return `${pos[0]}${9 - Number(pos[1])}`;
    }
    return pos;
};
container.addEventListener('click', e => {
    const tar = e.target;
    const par = e.currentTarget;
    cur.renderAll();
    if (tar.dataset.piece && tar.dataset.pos && (wait && tar.classList.contains('chess') && (par.classList.contains('pick') || cur.isMove(tar.dataset.piece))) && cur.isPlayer()) {
        if (par.classList.contains('pick')) {
            const sel = document.querySelector('div.sel');
            if (tar !== sel && tar.classList.contains('active') && sel.dataset.pos) {
                const posStart = getPos(sel.dataset.pos, cur.player);
                const posEnd = getPos(tar.dataset.pos, cur.player);
                if (cur.movePiece(posStart, posEnd)) {
                    coin.play();
                }
                else {
                    tac.play();
                }
                socket.emit('tac', cur.str);
                cur.renderAll();
            }
            document.querySelectorAll('div.active').forEach((v) => v.classList.remove('active'));
            sel.classList.remove('sel');
            par.classList.remove('pick');
        }
        else {
            const set = cur.moveGenerator(getPos(tar.dataset.pos, cur.player));
            for (let i of set) {
                const temp = document.querySelector(`[data-pos="${getPos(i, cur.player)}"]`);
                temp.classList.add('active');
            }
            par.classList.add('pick');
            tar.classList.add('sel');
        }
    }
});
const socket = io(location.origin);
const s1 = document.querySelector('h1 > span:nth-child(1)');
const s2 = document.querySelector('h1 > span:nth-child(2)');
socket.on('first', e => {
    s2.innerHTML = e.room;
    cur.player = e.player;
    cur.renderAll();
});
socket.on('start', (e) => {
    s1.innerHTML = e;
    wait = true;
});
socket.on('close', (e) => {
    s1.innerHTML = e;
    wait = false;
});
socket.on('tac', (e) => {
    Object.assign(cur, Chess.fenToData(e));
    cur.renderAll();
});
//# sourceMappingURL=main.js.map