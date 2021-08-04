let DragHandler = function(area){
    //might bundle it up and make it into a package or a module
    //mouse state
    this.down = false;
    //mouse velocity
    this.vx = 0;
    this.vy = 0;
    //mouse coordinates
    let x0 = 0;
    let y0 = 0;
    //mousedown time
    this.t0 = 0;
    
    this.x = 0;
    this.y = 0;
    
    let that = this;


    //adding various events to the canvas
    let onDragStart = function(e) {
        e.preventDefault();
        that.down = true;
        x0 = e.clientX;
        y0 = e.clientY;
        that.t0 = Date.now();
        that.vx = 0;
        that.vy = 0;
        
        that.x = x0;
        that.x = y0;
    };
    let onDrag = function(e) {
        e.preventDefault();
        if (!that.down) return false;
        let x = e.clientX;
        let y = e.clientY;
        let t = Date.now();
        let dt = (t - that.t0) / 1000;
        let dx = x - x0;
        let dy = y - y0;
        if (dt === 0) return false; //infinity->nan bug, preventing being frozen
        that.vx = dx / dt;
        that.vy = dy / dt;
        //console.log(dx, dy, that.vx, that.vy, dt);
        //for the next frame
        x0 = x;
        y0 = y;
        that.t0 = t;
        
        this.x = x0;
        this.x = y0;
    };
    let onDragEnd = function(e) {
        e.preventDefault();
        that.down = false;
    };

    canvas.addEventListener("mousedown", onDragStart);
    document.body.addEventListener("mousemove", onDrag);
    document.body.addEventListener("mouseup", onDragEnd);
};


/*
let drones = new Drones([
    {
        time:0,
        pos:[
            [],
            [],
        ]
    },
    {
        type:""
    },
    {
        time:100,
        pos:[
            [],
            [],
        ]
    }
]);
*/

let Drones = function(keyframes){
    let t0 = keyframes[0].time;
    let t1 = keyframes[keyframes.length-1].time;
    console.log(t0,t1);
    console.log(keyframes);
    this.getPositions = function(ts){
        if(ts <= t0){
            return keyframes[0].pos;
        }else if(t1 < ts){
            //console.log(ts,keyframes[keyframes.length-1].pos);
            return keyframes[keyframes.length-1].pos;
        }else{
            //the ts is in between the keyframes
            for(let i = 0; i < keyframes.length-2; i+=2){//could be binary search, but y'know, that's tiring
                let kf0 = keyframes[i];
                let kf1 = keyframes[i+2];
                if(kf0.time < ts){//found a match
                    let midset = keyframes[i+1];
                    if(true){
                        
                    }
                }
            }
        }
    };
};

let Events = function(that){
    const eventTable = {};
    this.on = function(type, callback) {
        if (!(type in eventTable)) {
            eventTable[type] = [];
        }
        eventTable[type].push(callback);
    };
    this.emit = function(type,args) {
        const elist = eventTable[type] || [];
        for (let i = 0; i < elist.length; i++) {
            elist[i].apply(that, args);
        }
    };
};


let Animation = function(w, h, canvas) {
    let that = this;
    let bus = new Events(that);
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
    
    let cos = Math.cos;
    let sin = Math.sin;

    let genYmat = function(a) {
        return [
            cos(a), 0, sin(a), 0,
            0, 1, 0, 0,
            -sin(a), 0, cos(a), 0,
            0, 0, 0, 1
        ];
    };

    let genXmat = function(a) {
        return [
            1, 0, 0, 0,
            0, cos(a), -sin(a), 0,
            0, sin(a), cos(a), 0,
            0, 0, 0, 1
        ];
    };
    
    //canvas stuff
    canvas.width = w;
    canvas.height = h;
    let zoom = w / 2;
    let ctx = canvas.getContext("2d");
    let timestamp = 0;
    let pause = false;
    let basemat = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 10, //z+3
        0, 0, 0, 1
    ];
    let rotmat = [ //identical
        1, 0, 0, 0, //but going to change once transformation is applied
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
    let drawTS = function(ts) {
        //ctx.fillStyle = "#5914b5";
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#ffffff";
        
        let transmat = matmul(basemat,rotmat,4);
        let positions = that.drones.getPositions(ts);
        for (let i = 0; i < positions.length; i++) {
            //plot drones
            let pos = positions[i];
            //apply the transformation matrix
            //from -1 to 1 scale
            let [x, y, z] = matvecmul(transmat,pos);
            x = x/z*w*3 + w/2;
            y = y/z*w*3 + h/2; //now 0 to w scale
            ctx.fillRect(x,y,1000/z/z/z,1000/z/z/z);
            //ctx.beginPath();
            //ctx.arc(x, y, 1, 0, 6.28);
            //ctx.closePath();
            //ctx.fill();
        }
    };
    //the angle of the whole thing
    let avx = 0;
    let avy = 0;
    
    //drag handler
    let mouse = new DragHandler(canvas);
    
    let vax = 0;
    let vay = 0;
    bus.on("frame", function(t, dt) {
        dt = dt/1000;
        if(mouse.down){
            //to prevent snap backing
            if(Date.now() - mouse.t0 > 50){
                mouse.vx = 0;
                mouse.vy = 0;
                //console.log("cancelled");
            }
            //friction dragging
            vax = vax+(mouse.vx-vax)*dt*3;
            vay = vay+(mouse.vy-vay)*dt*3;
        }
        //matrix multiplication
        let dax = -vax*dt/w*4;
        let day = vay*dt/w*4;
        rotmat = matmul(genYmat(dax), rotmat,4);
        rotmat = matmul(genXmat(day), rotmat,4);
            
        drawTS(timestamp);
        if (!pause) {
            //increment the timestamp
            timestamp += dt;
        }
    });


    let start = 0;
    let animate = function(t) {
        if (start === 0) start = t;
        const dt = t - start;
        start = t;
        bus.emit("frame", [t, dt]);
        requestAnimationFrame(animate);
    };
    
    
    this.setDrones = function(drones){
        this.drones = drones;
    };
    
    this.setDrones(new Drones([
        {
            time:0,
            pos:[
                [0,0,0]
            ]
        }
    ]));
    
    requestAnimationFrame(animate);
};


//vector stuff
let crossProduct3d = function(a,b){
    return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
};

let vectorMul = function(v,a){
    let v1 = [];
    for(let i = 0; i < v.length; i++){
        v1[i] = v[i]*a;
    }
    return v1;
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

let vectorAdd = function(v1,v2){
    let v3 = [];
    for(let i = 0; i < v1.length; i++){
        v3[i] = v1[i]+v2[i];
    }
    return v3;
};

let trueRatio = function(n){
    return Math.random()<n;
};

let icosahedron = function(){
    let result = [];
    //draw faces and vertex
    //vertices
    let verts = [];
    let edges = [];
    let faces = [];
    let rr = Math.sqrt(3)/2;
    //r=1
    //top
    verts.push([0,0,1]);
    //upper echelon
    for(let i = 0; i < 5; i++){
        verts.push(
            [
                rr*Math.cos(Math.PI*2/5*i),
                rr*Math.sin(Math.PI*2/5*i),
                1/2
            ]
        );
    }
    //lower echelon
    for(let i = 0; i < 5; i++){
        verts.push(
            [
                rr*Math.cos(Math.PI*2/5*i+Math.PI*1/5),
                rr*Math.sin(Math.PI*2/5*i+Math.PI*1/5),
                -1/2
            ]
        );
    }
    //bottom
    verts.push([0,0,-1]);
    
    //register edges, then the faces. Do them independently
    //edges
    for(let i = 0; i < 5; i++){
        //top
        edges.push([0,i+1]);
        //second row
        edges.push([i+1,(i+1)%5+1]);
        //intermediate
        edges.push([i+1,i+6]);
        edges.push([i+1,(i+4)%5+6]);
        //third row
        edges.push([i+6,(i+4)%5+6]);
        //bottom
        edges.push([i+6,11]);
    }
    
    //faces
    for(let i = 0; i < 5; i++){
        //top
        faces.push([0,i+1,(i+1)%5+1]);
        //intermediate
        faces.push([(i+1)%5+1,i+1,i+6]);
        faces.push([i+1,(i+4)%5+6,i+6]);
        //bottom
        faces.push([i+6,(i+4)%5+6,11]);
    }
    
    for(let i = 0; i < edges.length; i++){
        let edge = edges[i];
        let v1 = verts[edge[0]];
        let v2 = verts[edge[1]];
        let xvec = [v2[0]-v1[0],v2[1]-v1[1],v2[2]-v1[2]];
        //yvec will be perpandicular to xvec
        //center will be 0,0,0
        let yvec = crossProduct3d(xvec,[(v1[0]+v2[0])/2,(v1[1]+v2[1])/2,(v1[2]+v2[2])/2]);
        
        //attach some points
        for(let i = 0; i < 5; i++){
            for(let j = 0; j < 3; j++){
                let x,y;
                x = vectorMul(xvec,(i+3)/20);
                y = vectorMul(yvec,(j-1)/20);
                if(trueRatio(1))result.push(vectorNormalize(vectorAdd(v1,vectorAdd(x,y))));
                x = vectorMul(xvec,(i+3+5)/20);
                y = vectorMul(yvec,(j-1-3)/20);
                if(trueRatio(1))result.push(vectorNormalize(vectorAdd(v1,vectorAdd(x,y))));
                x = vectorMul(xvec,(i+3+5)/20);
                y = vectorMul(yvec,(j-1+3)/20);
                if(trueRatio(1))result.push(vectorNormalize(vectorAdd(v1,vectorAdd(x,y))));
                x = vectorMul(xvec,(i+3+10)/20);
                y = vectorMul(yvec,(j-1)/20);
                if(trueRatio(1))result.push(vectorNormalize(vectorAdd(v1,vectorAdd(x,y))));
            }
        }
    }
    
    for(let i = 0; i < result.length; i++){
        result[i].push(1);
    }
    return result;
};


let main = function(w, h) {
    let canvas = document.getElementById("canvas");
    canvas.width = w;
    canvas.height = h;
    let ctx = canvas.getContext("2d");
    let animation = new Animation(w,h,document.getElementById("canvas"));
    animation.setDrones(new Drones([
        {
            time:0,
            pos:icosahedron()
        }
    ]));
    console.log(icosahedron());
};
main(500,500);