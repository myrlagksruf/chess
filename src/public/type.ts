export interface ChessInter{
    str:string;
    move:string;
    castle:string;
    arr:string[][];
    pasang:string;
    half:number;
    full:number;
    king:{
        '-1':[number, number],
        '1':[number, number]
    };
}

export interface Pieces{
    v: string;
    ori: [number, number, number, number];
    end: [number, number];
}

export interface Rooms{
    room:string;
    ori:string;
    set:Set<string>;
    size:number;
};