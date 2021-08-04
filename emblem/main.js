//utility functions

//matrix stuff
let matmul = function(a, b, w) {
    let c = [];
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < w; j++) {
            c[i * w + j] = 0;
            for (let k = 0; k < w; k++) {
                c[i * w + j] += a[i * w + k] * b[k * w + j];
            }
        }
    }
    return c;
};

let matvecmul = function(mat, vec) {
    let w = vec.length;
    let vec1 = [];
    for (let i = 0; i < w; i++) {
        vec1[i] = 0;
        for (let j = 0; j < w; j++) {
            vec1[i] += mat[i * w + j]*vec[j];
        }
    }
    return vec1;
};

//vector stuff
let crossProduct3d = function(a,b){
    return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
};

let vectorNormalize = function(vec){
    let v1 = [];
    let r2 = 0;
    for(let i = 0; i < vec.length; i++){
        r2+=vec[i]*vec[i];
    }
    let r = Math.sqrt(r2);
    for(let i = 0; i < vec.length; i++){
        v1[i] = vec[i]/r;
    }
    return v1;
};

let vecadd = function(v1,v2){
    let v3 = [];
    for(let i = 0; i < v1.length; i++){
        v3[i] = v1[i]+v2[i];
    }
    return v3;
};

let vecmul = function(vec,k){
    let vec1 = [];
    for(let i = 0; i < vec.length; i++){
        vec1[i] = vec[i]*k;
    }
    return vec1;
};

let turnDegree = function(vec,angle){
    let x = vec[0];
    let y = vec[1];
    let rad = angle/180*Math.PI;
    return [
        x*Math.cos(rad)-y*Math.sin(rad),
        x*Math.sin(rad)+y*Math.cos(rad)
    ];
};

let vecInterpolate = function(v1,v2,k){
    let v3 = [];
    for(let i = 0; i < v1.length; i++){
        v3[i] = v1[i]+(v2[i]-v1[i])*k;
    }
    return v3;
};


//there can be only two oriention
//0 which skews to the left, and 1, which skews to the right
const LEFT = 0;
const RIGHT = 1;

let IDDD = 0;
let idgen = function(){
    return IDDD++;
};

let Tile = function(angle){
    this.angle = angle;
    this.id = idgen();
    this.orientation = true;
    this.connections = [null,null,null,null];
    this.add = function(edge,angle){
        let tile1 = new Tile(angle);
        this.connections[edge] = tile1;
        if(edge%2 === 0){
            tile1.orientation = !this.orientation;
        }else{
            tile1.orientation = this.orientation;
        }
        tile1.connections[0] = this;
        return tile1;
    };
    this.computeLocation = function(x,y,angle){
        let cache = {};
        this.computeSubLocation(x,y,angle,cache);
        let list = [];
        for(let key in cache){
            list.push(cache[key])
        }
        return list;
    };
    this.computeSubLocation = function(x,y,angle,cache){//based on the bottom left corner
        if(this.id in cache)return false;
        cache[this.id] = this;
        this.x = x;
        this.y = y;
        this.angle1 = angle;
        let connections = this.connections;
        //4 corners
        if(connections[0]){//if not null
            let con = connections[0];
            let angle1 = (angle+180)%360;//using integer to avoid fp error
            //origin is the bottom right corner
            let [x1,y1] = vecadd([x,y],turnDegree([1,0],angle1));
            con.computeSubLocation(x1,y1,angle1,cache);
        }
        if(connections[1]){
            let con = connections[1];
            let angle1 = (angle+this.angle)%360;
            let [x1,y1] = [x,y];
            con.computeSubLocation(x1,y1,angle1,cache);
        }
        if(connections[2]){
            let con = connections[2];
            let angle1 = angle;
            let [x1,y1] = vecadd([x,y],turnDegree([1,0],angle+this.angle));
            con.computeSubLocation(x1,y1,angle1,cache);
        }
        if(connections[3]){
            let con = connections[3];
            let angle1 = (angle+180+this.angle)%360;
            let [x1,y1] = vecadd([x,y],vecadd(turnDegree([1,0],angle),turnDegree([1,0],angle+this.angle)));
            con.computeSubLocation(x1,y1,angle1,cache);
        }
    };
};





//attach to the central line
//
//    ___2___
//  1/      /
//  /______/3
//     0


let t0 = new Tile(120);
t0
.add(3,30)
.add(2,150)
.add(2,60)
.add(3,150)
.add(1,150)
.add(3,150)
.add(1,60)
.add(3,150)
.add(1,60)
.add(1,90)
.add(3,60)
.add(1,120)
.add(3,90)
.add(3,90)
.add(1,120)
.add(3,90)
.add(3,60)
.add(2,30)
.add(1,30);

let shapes = t0.computeLocation(0,0,0);

//draw the shapes
let canvas =  document.getElementById("canvas");
canvas.width = 500;
canvas.height = 500;
let ctx = canvas.getContext("2d");
let PARAMS = {
    GRID:false,
    WHOLE:false,
    AA:0.3,
    BB:0.5,
    START:false
};

let render = function(lambda = 0.5){
    ctx.clearRect(0,0,500,500);
    ctx.fillStyle = "#08154a";
    for(let i = 0; i < shapes.length; i++){
        let tile = shapes[i];
        //console.log(tile);
        let a = [tile.x,tile.y];
        let b = vecadd(a,turnDegree([1,0],tile.angle1+tile.angle));
        let c = vecadd(a,vecadd(turnDegree([1,0],tile.angle1+tile.angle),turnDegree([1,0],tile.angle1)));
        let d = vecadd(a,turnDegree([1,0],tile.angle1));
        let path = [a,b,c,d];
        
        let aa = 0;
        let bb = 0;
        for(let j = 0; j < 4; j++){
            aa += path[j][0];
            bb += path[j][1];
        }
        aa /= 4;
        bb /= 4;
        let dd = Math.sqrt(aa*aa+bb*bb);
        //console.log(dd);
        if(!PARAMS.WHOLE && dd < 2)continue;
        
        for(let k = 0; k < 3; k++){
            if(PARAMS.GRID){
                ctx.beginPath();
                for(let j = 0; j < path.length; j++){
                    let [x,y] = vecadd(turnDegree(vecmul(path[j],50),120*k+45),[250,250]);
                    ctx.lineTo(x,500-y);
                }
                ctx.closePath();
                ctx.stroke();
            }
            //drawing the things
            ctx.beginPath();
            for(let j = 0; j < path.length; j++){
                let p1 = path[j];
                let p2 = path[(j+1)%4];
                let p;
                if(j%2 === 0? !tile.orientation : tile.orientation){
                    p = vecInterpolate(p1,p2,lambda);
                }else{
                    p = vecInterpolate(p2,p1,lambda);
                }
                let [x,y] = vecadd(turnDegree(vecmul(p,50),120*k+45),[250,250]);
                ctx.lineTo(x,500-y);
            }
            ctx.closePath();
            ctx.fill();
        }
    }
};


let frameResolvers = [];
let awaitNextFrame = function(){
    return new Promise((res,rej)=>{
        frameResolvers.push(res);
    });
};

let start = 0;

let tt = 0;

let animate = function(t){
    if(start === 0)start = t;
    let dt = t - start;
    start = t;
    if(PARAMS.START){
        tt += dt;
    }
    for(let i = 0; i < frameResolvers.length; i++){
        let fr = frameResolvers[i];
        fr([dt,t]);
    }
    frameResolvers = [];
    render((Math.sin(tt/1000)*PARAMS.AA)/2+PARAMS.BB);
    requestAnimationFrame(animate);
};
requestAnimationFrame(animate);


let transition = async function(param,target,time){
    let [dt,t] = await awaitNextFrame();
    let start = t;
    let origin = PARAMS[param];
    while(t < start+time){
        [dt,t] = await awaitNextFrame();
        let k = (t-start)/time;
        let kk = -Math.cos(k*Math.PI)/2+0.5;
        PARAMS[param] = origin+(target-origin)*kk;
    }
    PARAMS[param] = target;
};

let toggle = function(param){
    PARAMS[param] = !PARAMS[param];
};

