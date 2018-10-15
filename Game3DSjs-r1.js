var $3DS = {
    requestTimeout: 2000,
    topScreenWidth: 400,
    bottomScreenWidth: 320,
    screenHeight: 240,
    pageWidth: 980,
    pageHeight: 650,
    defaultResoltionX: 160,
    defaultResoltionY: 120,
    renderFPS: 0,
    
    key: {
        up: 38,
        down: 40,
        left: 37,
        right: 39,
        A: 13
    },
    
    keyState: {
        up: false,
        down: false,
        left: false,
        right: false,
        A: false
    },

    remove: function(element) {
        return !!element.parentElement.removeChild(element);
    },

	createText: function(txt,x,y,size,color,bg){
        var text = document.createElement('div');
        text.innerText = txt || '';
        text.style.position = 'absolute';
        text.xPos = x;
        text.style.left = x+'px';
        text.yPos = y;
        text.style.top = y+'px';
        text.style.fontSize = size || '';
        text.style.color = color || '';
        text.style.backgroundColor = bg || '';
        
        text.update = function(t){
            text.innerText = t;
        }
              
        text.set = function(x,y){
            text.style.left = x+'px';
            text.style.top = y+'px';
        }
        
        text.setSize = function(s){
            text.style.fontSize = s;
        }
        
        text.setColor = function(c){
            text.style.color = c;
        }
        
        text.setBackgroundColor = function(c){
            text.style.backgroundColor = c;
        }
        
        document.body.appendChild(text);
        return text;
    },

    defineModel: function(id, colArr, meshArr){
        if((colArr.length != 1)&&(colArr.length != 6)){
            $3DS.error('Collision array has wrong number of parameters.');
            return;
        }
        if(((meshArr.length-10)%4)!=0){
            $3DS.error('Mesh array has wrong number of parameters.');
            return;
        }
        $3DS.internal.collisionCache[id] = colArr;
        $3DS.internal.meshCache[id] = meshArr;
    },
    
    createScreen: function(x,y,w,h,rx,ry){
        var screen = document.createElement('canvas');
        screen.style.position = 'absolute';
        screen.style.left = x+'px';
        screen.style.top = y+'px';
        screen.style.width = w || $3DS.pageWidth+'px';
        screen.style.height = h || $3DS.pageHeight+'px';
        screen.width = rx || $3DS.defaultResoltionX;
        screen.height = ry || $3DS.defaultResoltionY;
        screen.depthbuffer = new Array(screen.width * screen.height);
        screen.isScreen = true;
        document.body.appendChild(screen);
        return screen;
    },

    wireframeRender: function(scene, screen, mode){
        var start = +new Date();
        var ctx = screen.getContext('2d');
        ctx.clearRect(0,0,screen.width,screen.height);
        if(mode==2){ scene.models.sort(function(a,b){ return b.zPos-a.zPos; } ); }
        for(i in scene.models){
            var rx = (screen.width/scene.w), ry = (screen.height/scene.h);
            var m = $3DS.internal.meshCache[scene.models[i].id],
                p1x = m[0], p1y = m[1], p1z = m[2], p2x = m[3], p2y = m[4], p2z = m[5];
            for(var k=6; k<m.length; k+=4){
                // Apply scale and rotation tranformations
                var pAx = scene.models[i].scale*(((p1y*Math.sin(scene.models[i].xRot)+p1z*Math.cos(scene.models[i].xRot))
                            *Math.sin(scene.models[i].yRot)+p1x*Math.cos(scene.models[i].yRot))*Math.cos(scene.models[i].zRot)-
                            (p1y*Math.cos(scene.models[i].xRot)-p1z*Math.sin(scene.models[i].xRot))*Math.sin(scene.models[i].zRot)),
                    pAy = scene.models[i].scale*(((p1y*Math.sin(scene.models[i].xRot)+p1z*Math.cos(scene.models[i].xRot))
                            *Math.sin(scene.models[i].yRot)+p1x*Math.cos(scene.models[i].yRot))*Math.sin(scene.models[i].zRot)+
                            (p1y*Math.cos(scene.models[i].xRot)-p1z*Math.sin(scene.models[i].xRot))*Math.cos(scene.models[i].zRot)),
                    pAz = scene.models[i].scale*(((p1y*Math.sin(scene.models[i].xRot)+p1z*Math.cos(scene.models[i].xRot))*
                          Math.cos(scene.models[i].yRot)-p1x*Math.sin(scene.models[i].yRot))),
                    pBx = scene.models[i].scale*(((p2y*Math.sin(scene.models[i].xRot)+p2z*Math.cos(scene.models[i].xRot))
                            *Math.sin(scene.models[i].yRot)+p2x*Math.cos(scene.models[i].yRot))*Math.cos(scene.models[i].zRot)-
                            (p2y*Math.cos(scene.models[i].xRot)-p2z*Math.sin(scene.models[i].xRot))*Math.sin(scene.models[i].zRot)),
                    pBy = scene.models[i].scale*(((p2y*Math.sin(scene.models[i].xRot)+p2z*Math.cos(scene.models[i].xRot))
                            *Math.sin(scene.models[i].yRot)+p2x*Math.cos(scene.models[i].yRot))*Math.sin(scene.models[i].zRot)+
                            (p2y*Math.cos(scene.models[i].xRot)-p2z*Math.sin(scene.models[i].xRot))*Math.cos(scene.models[i].zRot)),
                    pBz = scene.models[i].scale*(((m[k+1]*Math.sin(scene.models[i].xRot)+p2z*Math.cos(scene.models[i].xRot))*
                          Math.cos(scene.models[i].yRot)-p2x*Math.sin(scene.models[i].yRot))),
                    pCx = scene.models[i].scale*(((m[k+1]*Math.sin(scene.models[i].xRot)+m[k+2]*Math.cos(scene.models[i].xRot))
                            *Math.sin(scene.models[i].yRot)+m[k]*Math.cos(scene.models[i].yRot))*Math.cos(scene.models[i].zRot)-
                            (m[k+1]*Math.cos(scene.models[i].xRot)-m[k+2]*Math.sin(scene.models[i].xRot))*Math.sin(scene.models[i].zRot)),
                    pCy = scene.models[i].scale*(((m[k+1]*Math.sin(scene.models[i].xRot)+m[k+2]*Math.cos(scene.models[i].xRot))
                            *Math.sin(scene.models[i].yRot)+m[k]*Math.cos(scene.models[i].yRot))*Math.sin(scene.models[i].zRot)+
                            (m[k+1]*Math.cos(scene.models[i].xRot)-m[k+2]*Math.sin(scene.models[i].xRot))*Math.cos(scene.models[i].zRot)),
                    pCz = scene.models[i].scale*(((m[k+1]*Math.sin(scene.models[i].xRot)+m[k+2]*Math.cos(scene.models[i].xRot))*
                          Math.cos(scene.models[i].yRot)-m[k]*Math.sin(scene.models[i].yRot)));

				// Apply translation transformations and calculate the perspective projection
                pAx = ((((pAx+scene.models[i].xPos)*scene.FOV)/(scene.FOV+pAz+scene.models[i].zPos))+(scene.w/2))*rx;
                pAy = ((((pAy+scene.models[i].yPos)*scene.FOV)/(scene.FOV+pAz+scene.models[i].zPos))+(scene.h/2))*ry;
                pBx = ((((pBx+scene.models[i].xPos)*scene.FOV)/(scene.FOV+pBz+scene.models[i].zPos))+(scene.w/2))*rx;
                pBy = ((((pBy+scene.models[i].yPos)*scene.FOV)/(scene.FOV+pBz+scene.models[i].zPos))+(scene.h/2))*ry;
                pCx = ((((pCx+scene.models[i].xPos)*scene.FOV)/(scene.FOV+pCz+scene.models[i].zPos))+(scene.w/2))*rx;
                pCy = ((((pCy+scene.models[i].yPos)*scene.FOV)/(scene.FOV+pCz+scene.models[i].zPos))+(scene.h/2))*ry;
                
                ctx.beginPath();
                ctx.moveTo(pAx,pAy);
                ctx.lineTo(pBx,pBy);
                ctx.lineTo(pCx,pCy);
                                    
                if(!mode){
                    ctx.lineTo(pAx,pAy);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = m[k+3];
                    ctx.stroke();
                } else {
                    ctx.fillStyle = m[k+3];
                    ctx.fill();
                }
                
                p1x = p2x;  p1y = p2y;    p1z = p2z;
                p2x = m[k]; p2y = m[k+1]; p2z = m[k+2];
            }
        }
        $3DS.renderFPS = 1000/(+new Date() - start + 1);
        if(screen.ivl){
            setTimeout(function(){ $3DS.wireframeRender(scene,screen,mode); }, 0);
        }
    },
    
    setWireframeRenderInterval: function(scene, screen, mode){
        screen.ivl = true;
        $3DS.wireframeRender(scene, screen, mode);
    },

    clearWireframeRenderInterval: function(screen){
        screen.ivl = false;
    },
    
    createScene: function(w,h,cFOV){
        var scene = {
                    w: w || $3DS.topScreenWidth,
                    h: h || $3DS.screenHeight,
                    FOV: cFOV || 90,
                    cX: 0,
                    cY: 0,
                    cZ: 0,
                    crX: 0,
                    crY: 0,
                    crZ: 0,
                    models: []
                    };
       scene.isScene = true;
       
       scene.setCamera = function(x,y,z){
            this.cX = x; this.cY = y; this.cZ = z;
       }
       
       scene.moveCamera = function(x,y,z){
            this.cX += x; this.cY += y; this.cZ += z;
       }
       
       scene.setRotation = function(x,y,z){
            this.crX = x; this.crY = y; this.crZ = z;
       }
       
       scene.rotateCamera = function(x,y,z){
            this.crX += x; this.crY += y; this.crZ += z;
       }
       
       scene.setFOV = function(f){
            this.FOV = f;
       }
       
       return scene;
    },

    createModel: function(scene,id,x,y,z, xr, yr, zr, sc){
        if((!scene.isScene)||(typeof $3DS.internal.collisionCache[id] === "undefined")){ return; }
        var model = {
                    id: id,
                    xPos: x || 0,
                    yPos: y || 0,
                    zPos: z || 0,
                    xRot: xr || 0,
                    yRot: yr || 0,
                    zRot: zr || 0,
                    scale: sc || 1,
                    isModel: true
                    };
        
        model.set = function(x,y,z){
            this.xPos = x; this.yPos = y; this.zPos = z;
        };
        
        model.move = function(x,y,z){
            this.xPos += x; this.yPos += y; this.zPos += z;
        };
        
        model.setRotation = function(x,y,z){
            this.xRot = x; this.yRot = y; this.zRot = z;
        };
        
        model.rotate = function(x,y,z){
            this.xRot += x; this.yRot += y; this.zRot += z;
        };
        
        model.setScale = function(s){
            this.scale = s;
        };
        
        model.resize = function(s){
            this.scale += s;
        };
        
        model.collidesWith = function(m){
            if(!m.isModel){ $3DS.error('Can not detect collision with a non-model.'); return; }
            if(($3DS.internal.collisionCache[this.id].length==1)&&($3DS.internal.collisionCache[m.id].length==1)){
                return (Math.sqrt((this.xPos-m.xPos)*(this.xPos-m.xPos)+(this.yPos-m.yPos)*(this.yPos-m.yPos)+(this.zPos-m.zPos)*(this.zPos-m.zPos))
                        <= (this.scale*$3DS.internal.collisionCache[this.id][0] + m.scale*$3DS.internal.collisionCache[m.id][0]));
            }
            if(($3DS.internal.collisionCache[this.id].length==6)&&($3DS.internal.collisionCache[m.id].length==6)){
                var xMin1 = this.xPos+this.scale*Math.min($3DS.internal.collisionCache[this.id][0],$3DS.internal.collisionCache[this.id][3]),
                    yMin1 = this.yPos+this.scale*Math.min($3DS.internal.collisionCache[this.id][1],$3DS.internal.collisionCache[this.id][4]),
                    zMin1 = this.zPos+this.scale*Math.min($3DS.internal.collisionCache[this.id][2],$3DS.internal.collisionCache[this.id][5]),
                    xMax1 = this.xPos+this.scale*Math.max($3DS.internal.collisionCache[this.id][0],$3DS.internal.collisionCache[this.id][3]),
                    yMax1 = this.yPos+this.scale*Math.max($3DS.internal.collisionCache[this.id][1],$3DS.internal.collisionCache[this.id][4]),
                    zMax1 = this.zPos+this.scale*Math.max($3DS.internal.collisionCache[this.id][2],$3DS.internal.collisionCache[this.id][5]),
                    xMin2 = m.xPos+m.scale*Math.min($3DS.internal.collisionCache[m.id][0],$3DS.internal.collisionCache[m.id][3]),
                    yMin2 = m.yPos+m.scale*Math.min($3DS.internal.collisionCache[m.id][1],$3DS.internal.collisionCache[m.id][4]),
                    zMin2 = m.zPos+m.scale*Math.min($3DS.internal.collisionCache[m.id][2],$3DS.internal.collisionCache[m.id][5]),
                    xMax2 = m.xPos+m.scale*Math.max($3DS.internal.collisionCache[m.id][0],$3DS.internal.collisionCache[m.id][3]),
                    yMax2 = m.yPos+m.scale*Math.max($3DS.internal.collisionCache[m.id][1],$3DS.internal.collisionCache[m.id][4]),
                    zMax2 = m.zPos+m.scale*Math.max($3DS.internal.collisionCache[m.id][2],$3DS.internal.collisionCache[m.id][5]);
                if( xMax1 < xMin2 || xMin1 > xMax2 ) return false;
                if( yMax1 < yMin2 || yMin1 > yMax2 ) return false;
                if( zMax1 < zMin2 || zMin1 > zMax2 ) return false;
                return true;
            }
            if($3DS.internal.collisionCache[this.id].length==6){
                var xMin = this.xPos+this.scale*Math.min($3DS.internal.collisionCache[this.id][0],$3DS.internal.collisionCache[this.id][3]),
                    yMin = this.yPos+this.scale*Math.min($3DS.internal.collisionCache[this.id][1],$3DS.internal.collisionCache[this.id][4]),
                    zMin = this.zPos+this.scale*Math.min($3DS.internal.collisionCache[this.id][2],$3DS.internal.collisionCache[this.id][5]),
                    xMax = this.xPos+this.scale*Math.max($3DS.internal.collisionCache[this.id][0],$3DS.internal.collisionCache[this.id][3]),
                    yMax = this.yPos+this.scale*Math.max($3DS.internal.collisionCache[this.id][1],$3DS.internal.collisionCache[this.id][4]),
                    zMax = this.zPos+this.scale*Math.max($3DS.internal.collisionCache[this.id][2],$3DS.internal.collisionCache[this.id][5]),
                    xP = m.xPos, yP = m.yPos, zP = m.zPos, rad = m.scale*$3DS.internal.collisionCache[m.id][0];
            } else {
                var xMin = m.xPos+m.scale*Math.min($3DS.internal.collisionCache[m.id][0],$3DS.internal.collisionCache[m.id][3]),
                    yMin = m.yPos+m.scale*Math.min($3DS.internal.collisionCache[m.id][1],$3DS.internal.collisionCache[m.id][4]),
                    zMin = m.zPos+m.scale*Math.min($3DS.internal.collisionCache[m.id][2],$3DS.internal.collisionCache[m.id][5]),
                    xMax = m.xPos+m.scale*Math.max($3DS.internal.collisionCache[m.id][0],$3DS.internal.collisionCache[m.id][3]),
                    yMax = m.yPos+m.scale*Math.max($3DS.internal.collisionCache[m.id][1],$3DS.internal.collisionCache[m.id][4]),
                    zMax = m.zPos+m.scale*Math.max($3DS.internal.collisionCache[m.id][2],$3DS.internal.collisionCache[m.id][5]),
                    xP = this.xPos, yP = this.yPos, zP = this.zPos, rad = this.scale*$3DS.internal.collisionCache[this.id][0];
            }
            if(Math.sqrt((xMin-xP)*(xMin-xP)+(yMin-yP)*(yMin-yP)+(zMin-zP)*(zMin-zP)) <= rad){ return true; }
            if(Math.sqrt((xMax-xP)*(xMax-xP)+(yMin-yP)*(yMin-yP)+(zMin-zP)*(zMin-zP)) <= rad){ return true; }
            if(Math.sqrt((xMin-xP)*(xMin-xP)+(yMax-yP)*(yMax-yP)+(zMin-zP)*(zMin-zP)) <= rad){ return true; }
            if(Math.sqrt((xMin-xP)*(xMin-xP)+(yMin-yP)*(yMin-yP)+(zMax-zP)*(zMax-zP)) <= rad){ return true; }
            if(Math.sqrt((xMax-xP)*(xMax-xP)+(yMax-yP)*(yMax-yP)+(zMin-zP)*(zMin-zP)) <= rad){ return true; }
            if(Math.sqrt((xMin-xP)*(xMin-xP)+(yMax-yP)*(yMax-yP)+(zMax-zP)*(zMax-zP)) <= rad){ return true; }
            if(Math.sqrt((xMax-xP)*(xMax-xP)+(yMin-yP)*(yMin-yP)+(zMax-zP)*(zMax-zP)) <= rad){ return true; }
            if(Math.sqrt((xMax-xP)*(xMax-xP)+(yMax-yP)*(yMax-yP)+(zMax-zP)*(zMax-zP)) <= rad){ return true; }
            return false;
        }

        scene.models.push(model);
        return model;
    },
    
    removeModel: function(scene, model){
        var i = scene.models.indexOf(model);
        if(i<0){ return false; }
        scene.models.splice(i,1);
        return true;
    },
    
	internal: {
        collisionCache: {},
        meshCache: {},
        keyUpdate: function(e){
            var charCode = e.charCode || e.keyCode;
            if(e.type=='keydown'){
                if(charCode == $3DS.key.up){
                    $3DS.keyState.up = true;
                    if(typeof $3DS.internal.udCB=="function"){ $3DS.internal.udCB(); }
                }else if(charCode == $3DS.key.down){
                    $3DS.keyState.down = true;
                    if(typeof $3DS.internal.ddCB=="function"){ $3DS.internal.ddCB(); }
                }else if(charCode == $3DS.key.left){
                    $3DS.keyState.left = true;
                    if(typeof $3DS.internal.ldCB=="function"){ $3DS.internal.ldCB(); }
                }else if(charCode == $3DS.key.right){
                    $3DS.keyState.right = true;
                    if(typeof $3DS.internal.rdCB=="function"){ $3DS.internal.rdCB(); }
                }else if(charCode == $3DS.key.A){
                    $3DS.keyState.A = true;
                    if(typeof $3DS.internal.adCB=="function"){ $3DS.internal.adCB(); }
                }
            }else if(e.type=='keyup'){
                if(charCode == $3DS.key.up){
                    $3DS.keyState.up = false;
                    if(typeof $3DS.internal.udCB=="function"){ $3DS.internal.uuCB(); }
                }else if(charCode == $3DS.key.down){
                    $3DS.keyState.down = false;
                    if(typeof $3DS.internal.duCB=="function"){ $3DS.internal.duCB(); }
                }else if(charCode == $3DS.key.left){
                    $3DS.keyState.left = false;
                    if(typeof $3DS.internal.luCB=="function"){ $3DS.internal.luCB(); }
                }else if(charCode == $3DS.key.right){
                    $3DS.keyState.right = false;
                    if(typeof $3DS.internal.ruCB=="function"){ $3DS.internal.ruCB(); }
                }else if(charCode == $3DS.key.A){
                    $3DS.keyState.A = false;
                    if(typeof $3DS.internal.auCB=="function"){ $3DS.internal.auCB(); }
                }
            }
        },
        start: function(){
            window.addEventListener('keydown', $3DS.internal.keyUpdate, false);
            window.addEventListener('keyup', $3DS.internal.keyUpdate, false);
        }
    }
};
$3DS.internal.start();
