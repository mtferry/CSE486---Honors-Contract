var $3DS = {
    topScreenWidth: 400,
    bottomScreenWidth: 320,
    screenHeight: 240,
    pageWidth: 980,
    pageHeight: 650,
    defaultResoltionX: 160,
    defaultResoltionY: 120,
    renderFPS: 0,
    
	// Constants for the keyCodes of buttons that are accessible from the browser
    key: {
        up: 38,
        down: 40,
        left: 37,
        right: 39,
        A: 13
    },
    
	// Current state of each key as a boolean
	// Updated by internal.keyUpdate()
    keyState: {
        up: false,
        down: false,
        left: false,
        right: false,
        A: false
    },

	// Description: Remove a DOM element via its parent
	//              Needed since the 3DS does not support removing elements directly.
	// Inputs: element - element to remove
	// Output: Success as boolean
    remove: function(element) {
        return !!element.parentElement.removeChild(element);
    },

	// Description: Log an error message for debugging
	// Inputs: msg - message to display
	// Output: none
    error: function(msg){
        if($3DS.is3DS()){
            window.alert(msg);
        } else {
			console.error(msg);
        }
    },
    
	// Description: Creates a 2D sprite and add it to the DOM
	// Inputs: img - image to use for sprite
	//         x,y - inital position
	//         w - width
	//         h - height
	// Output: Sprite object
    createSprite: function(img,x,y,w,h){
        var sprite = document.createElement('img');
        sprite.src = img;
        sprite.style.position = 'absolute';
        sprite.xPos = x;
        sprite.style.left = x+'px';
        sprite.yPos = y;
        sprite.style.top = y+'px';
        if(w){ sprite.width = w; }
        if(h){ sprite.height = h; }
        sprite.iw = sprite.width;
        sprite.ih = sprite.height;
        sprite.rot = 0;
        
		// Set position
        sprite.set = function(x,y){
            sprite.xPos = x;
            sprite.yPos = y;
            sprite.style.left = sprite.xPos+'px';
            sprite.style.top = sprite.yPos+'px';
        }
        
		// Set position relative to current position
        sprite.move = function(x,y){
            sprite.xPos += x;
            sprite.yPos += y;
            sprite.style.left = sprite.xPos+'px';
            sprite.style.top = sprite.yPos+'px';
        }
        
		// Set size
        sprite.setSize = function(w,h){
            sprite.style.height = (sprite.style.width = '');
            sprite.width = w;
            sprite.height = h;
        }
        
		// Set size relative to current size
        sprite.resize = function(w,h){
            sprite.style.height = (sprite.style.width = '');
            sprite.width += w;
            sprite.height += h;
        }
        
		// Set size by a factor of the current size
        sprite.scale = function(w,h){
            sprite.style.height = (sprite.style.width = '');
            sprite.width *= w;
            sprite.height *= h;
        }
        
		// Set rotation
        sprite.setRotation = function(r){
            sprite.rot = r;
            sprite.style.webkitTransform = 'rotate('+sprite.rot+'deg)';
        }
        
		// Set rotation relative to current rotation
        sprite.rotate = function(r){
            sprite.rot += r;
            sprite.style.webkitTransform = 'rotate('+sprite.rot+'deg)';
        }
        
		// Check if sprite collides with another sprite or a DOM element
		// Returns result as a boolean
        sprite.collidesWith = function(s) {
            var x1 = this.getBoundingClientRect().left;
            var y1 = this.getBoundingClientRect().top;
            var b1 = this.getBoundingClientRect().bottom;
            var r1 = this.getBoundingClientRect().right;
            var x2 = s.getBoundingClientRect().left;
            var y2 = s.getBoundingClientRect().top;
            var b2 = s.getBoundingClientRect().bottom;
            var r2 = s.getBoundingClientRect().right;

            if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2) return false;
            return true;
        }
        
        document.body.appendChild(sprite);
        return sprite;
    },
    
	// Description: Creates a text box to display scores or other stats
	// Inputs: txt - inital text
	//         x,y - inital position
	//         size - font size
	//         color - text color
	//         bg - bg color
	// Output: Text object
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
        
		// Update the displayed text
        text.update = function(t){
            text.innerText = t;
        }
              
		// Set the position of the text box
        text.set = function(x,y){
            text.style.left = x+'px';
            text.style.top = y+'px';
        }
        
		// Change the font size
        text.setSize = function(s){
            text.style.fontSize = s;
        }
        
		// Change the text color
        text.setColor = function(c){
            text.style.color = c;
        }
        
		// Change the background color
        text.setBackgroundColor = function(c){
            text.style.backgroundColor = c;
        }
        
        document.body.appendChild(text);
        return text;
    },

	// Description: Define a model by id and cache its mesh and bounding volume
	// Inputs: id - model id, colArr - bounding volume, meshArr - mesh and color data
	// Output: none
	//
	// colArr contains an array for a bounding sphere or bounding box
	// Sphere: [r] r - sphere radius
	// Box: [x1,y1,z1,x2,y2,z2]
	//      x1,y1,z1 - coordinates of one corner
	//      x2,y2,z2 - coordinates of opposite corner
	//
	// http://en.wikipedia.org/wiki/Triangle_strip
	// meshArr contains an array with a triangle strip and color 
	// data in the following format:
	// [x1,y1,z1,x2,y2,z2,x3,y3,z3,c1,xn,yn,zn,cn...]
	//  x1,y1,z1,x2,y2,z2,x3,y3,z3 - coordinates of the three points of the first triangle
	//  c1 - color of the first triangle as a string e.g. '#2F4F4F'
	//  xn,yn,zn - coordinate of the next point in the strip
	//  cn - color of the next triangle in the strip
	// The pastern continues for each additional triangle of the mesh
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
    
	// Description: Create a screen and add it to the DOM
	// Inputs: x,y - position of screen
	//         w - width
	//         h - height
	//         rx, ry - resolution
	// Output: Screen object
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

    // Description: Render a scene with z-buffering
	// Inputs: scene - the scene to render
	//         screen - the screen to render the scene on
	// Output: none
    render: function(scene, screen){
        var start = +new Date(),
            w = screen.width,
            h = screen.height
            ctx = screen.getContext('2d');
        ctx.clearRect(0,0,w,h);
        var backbuffer = ctx.getImageData(0,0,w,h);
		
		// Initialize the values of the depthbuffer
        for (var i = 0; i < screen.depthbuffer.length; i++) {
            screen.depthbuffer[i] = 10000000;
        }
		
		// Sort models by z-position
        scene.models.sort(function(a,b){ return b.zPos-a.zPos; });
        
		// Iterate through models
		for(i in scene.models){
            var rx = (h/scene.w), ry = (h/scene.h); // Set resolution
            
			// Initialize variables to first triangle in mesh
			var m = $3DS.internal.meshCache[scene.models[i].id],
                p1x = m[0], p1y = m[1], p1z = m[2], p2x = m[3], p2y = m[4], p2z = m[5];
            
			// Iterate through triangles in mesh
			for(var k=6; k<m.length; k+=4){
                // Apply scale and rotation transformations
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
                          
                // Apply camera translation
                pAx += scene.cX;   pAy += scene.cY;   pAz += scene.cZ;
                pBx += scene.cX;   pBy += scene.cY;   pBz += scene.cZ;
                pCx += scene.cX;   pCy += scene.cY;   pCz += scene.cZ;
                
                // Apply camera rotation
                pAx = (((pAy*Math.sin(scene.crX)+pAz*Math.cos(scene.crX))
                      *Math.sin(scene.crY)+pAx*Math.cos(scene.crY))*Math.cos(scene.crZ)-
                      (pAy*Math.cos(scene.crX)-pAz*Math.sin(scene.crX))*Math.sin(scene.crZ));
                pAy = (((pAy*Math.sin(scene.crX)+pAz*Math.cos(scene.crX))
                      *Math.sin(scene.crY)+pAx*Math.cos(scene.crY))*Math.sin(scene.crZ)+
                      (pAy*Math.cos(scene.crX)-pAz*Math.sin(scene.crX))*Math.cos(scene.crZ));
                pAz = (((pAy*Math.sin(scene.crX)+pAz*Math.cos(scene.crX))*
                      Math.cos(scene.crY)-pAx*Math.sin(scene.crY)));
                pBx = (((pBy*Math.sin(scene.crX)+pBz*Math.cos(scene.crX))
                      *Math.sin(scene.crY)+pBx*Math.cos(scene.crY))*Math.cos(scene.crZ)-
                      (pBy*Math.cos(scene.crX)-pBz*Math.sin(scene.crX))*Math.sin(scene.crZ));
                pBy = (((pBy*Math.sin(scene.crX)+pBz*Math.cos(scene.crX))
                      *Math.sin(scene.crY)+pBx*Math.cos(scene.crY))*Math.sin(scene.crZ)+
                      (pBy*Math.cos(scene.crX)-pBz*Math.sin(scene.crX))*Math.cos(scene.crZ));
                pBz = (((pBy*Math.sin(scene.crX)+pBz*Math.cos(scene.crX))*
                      Math.cos(scene.crY)-pBx*Math.sin(scene.crY)));
                pCx = (((pCy*Math.sin(scene.crX)+pCz*Math.cos(scene.crX))
                      *Math.sin(scene.crY)+pCx*Math.cos(scene.crY))*Math.cos(scene.crZ)-
                      (pCy*Math.cos(scene.crX)-pCz*Math.sin(scene.crX))*Math.sin(scene.crZ));
                pCy = (((pCy*Math.sin(scene.crX)+pCz*Math.cos(scene.crX))
                      *Math.sin(scene.crY)+pCx*Math.cos(scene.crY))*Math.sin(scene.crZ)+
                      (pCy*Math.cos(scene.crX)-pCz*Math.sin(scene.crX))*Math.cos(scene.crZ));
                pCz = (((pCy*Math.sin(scene.crX)+pCz*Math.cos(scene.crX))*
                      Math.cos(scene.crY)-pCx*Math.sin(scene.crY)));
                
                // Apply translation transformations and calculate the perspective projection
                pAx = ((((pAx+scene.models[i].xPos)*scene.FOV)/(scene.FOV+pAz+scene.models[i].zPos))+(scene.w/2))*rx;
                pAy = ((((pAy+scene.models[i].yPos)*scene.FOV)/(scene.FOV+pAz+scene.models[i].zPos))+(scene.h/2))*ry;
                pBx = ((((pBx+scene.models[i].xPos)*scene.FOV)/(scene.FOV+pBz+scene.models[i].zPos))+(scene.w/2))*rx;
                pBy = ((((pBy+scene.models[i].yPos)*scene.FOV)/(scene.FOV+pBz+scene.models[i].zPos))+(scene.h/2))*ry;
                pCx = ((((pCx+scene.models[i].xPos)*scene.FOV)/(scene.FOV+pCz+scene.models[i].zPos))+(scene.w/2))*rx;
                pCy = ((((pCy+scene.models[i].yPos)*scene.FOV)/(scene.FOV+pCz+scene.models[i].zPos))+(scene.h/2))*ry;
                    
				// Rearrange points based on the vertical order
                if(pAy > pBy) {
                    var tx = pBx, ty = pBy, tz = pBz;
                    pBx = pAx; pBy = pAy; pBz = pAz;
                    pAx = tx; pAy = ty; pAz = tz;
                }
                if(pBy > pCy) {
                    var tx = pBx, ty = pBy, tz = pBz;
                    pBx = pCx; pBy = pCy; pBz = pCz;
                    pCx = tx; pCy = ty; pCz = tz;
                }
                if(pAy > pBy) {
                    var tx = pBx, ty = pBy, tz = pBz;
                    pBx = pAx; pBy = pAy; pBz = pAz;
                    pAx = tx; pAy = ty; pAz = tz;
                }
                
				// Find the slopes of the triangle lines
                var dP1P2 = 0, dP1P3 = 0;
                if(pBy - pAy > 0) {
                    dP1P2 = (pBx - pAx) / (pBy - pAy);
                }
                if(pCy - pAy > 0) {
                    dP1P3 = (pCx - pAx) / (pCy - pAy);
                }
                
				// Fills the horizontal lines of a triangle for a given y value
				// Variables starting with p correspond to the points of two lines
				// that make up the triangle. Color is the color used to fill the triangle.
                var processScanLine = function(y,pAx,pAy,pAz,pBx,pBy,pBz,pCx,pCy,pCz,pDx,pDy,pDz,color){
                    var gradient1 = pAy != pBy ? (y - pAy) / (pBy - pAy) : 1;
                    var gradient2 = pCy != pDy ? (y - pCy) / (pDy - pCy) : 1;
                    var sx = (pAx + (pBx-pAx)*Math.max(0,Math.min(gradient1,1))) >> 0;
                    var ex = (pCx + (pDx-pCx)*Math.max(0,Math.min(gradient2,1))) >> 0;
                    if(ex<sx){ var t = sx; sx = ex; ex = t; }
                    var z1 = (pAz + (pBz-pAz)*Math.max(0,Math.min(gradient1,1)));
                    var z2 = (pCz + (pDz-pCz)*Math.max(0,Math.min(gradient2,1)));
                    for(var x = sx; x < ex; x++) {
                        var gradient = (x - sx) / (ex - sx);
                        var z = (z1 + (z2-z1)*Math.max(0,Math.min(gradient,1)));
                        if((x>=0)&&(y>=0)&&(x<w)&&(y<h)){
                            var i = ((x >> 0) + (y >> 0) * w);
                            if(screen.depthbuffer[i] < z){ continue; }
                            screen.depthbuffer[i] = z;
                            i*=4;
                            backbuffer.data[i] = parseInt(color.substr(1,2),16);
                            backbuffer.data[i+1] = parseInt(color.substr(3,2),16);
                            backbuffer.data[i+2] = parseInt(color.substr(5,2),16);
                            backbuffer.data[i+3] = 255;
                        }
                    }
                };
                
				// Process the scan lines of the triangle based on the
				// horizontal order that the points of the line appear
                if(dP1P2 > dP1P3) {
                    for(var y = pAy >> 0; y <= pCy >> 0; y++) {
                        if(y < pBy) {
                            processScanLine(y, pAx, pAy, pAz, pCx, pCy, pCz, pAx, pAy, pAz, pBx, pBy, pBz, m[k+3]);
                        } else {
                            processScanLine(y, pAx, pAy, pAz, pCx, pCy, pCz, pBx, pBy, pBz, pCx, pCy, pCz, m[k+3]);
                        }
                    }
                } else {
                    for(var y = pAy >> 0; y <= pCy >> 0; y++) {
                        if(y < pBy) {
                            processScanLine(y, pAx, pAy, pAz, pBx, pBy, pBz, pAx, pAy, pAz, pCx, pCy, pCz, m[k+3]);
                        } else {
                            processScanLine(y, pBx, pBy, pBz, pCx, pCy, pCz, pAx, pAy, pAz, pCx, pCy, pCz, m[k+3]);
                        }
                    }
                }
                    
                p1x = p2x;  p1y = p2y;    p1z = p2z;
                p2x = m[k]; p2y = m[k+1]; p2z = m[k+2];
            }
        }
        ctx.putImageData(backbuffer, 0, 0);
        $3DS.renderFPS = 1000/(+new Date() - start + 1);
        if(screen.ivl){
			setTimeout(function(){ $3DS.render(scene,screen); }, 0);
        }
    },
    
	// Description: Perform a wireframe render at the fastest interval possible
	// Inputs: scene - the scene to render
	//         screen - the screen to render the scene on
	//         mode - the render mode to use
	// Output: none
    setRenderInterval: function(scene, screen){
        screen.ivl = true;
        $3DS.render(scene, screen);
    },

	// Description: Stop a screen from rendering at an interval
	// Inputs: screen - the screen to stop
	// Output: none
    clearRenderInterval: function(screen){
        screen.ivl = false;
    },
    
	// Description: Render a scene without z-buffering
	// Inputs: scene - the scene to render
	//         screen - the screen to render the scene on
	//         mode - the render mode to use
	// Output: none
	//
	// Render Modes: 0 - Wireframe
	//               1 - Filled Triangles
	//               2 - Filled Triangles with models sorted by z-position
    wireframeRender: function(scene, screen, mode){
        var start = +new Date();
        var ctx = screen.getContext('2d');
        ctx.clearRect(0,0,screen.width,screen.height);
        
		// Sort models by z-position if render mode is 2
		if(mode==2){ scene.models.sort(function(a,b){ return b.zPos-a.zPos; } ); }
        
		// Iterate through models
		for(i in scene.models){
            var rx = (screen.width/scene.w), ry = (screen.height/scene.h);  // Set resolution
            
			// Initialize variables to first triangle in mesh
			var m = $3DS.internal.meshCache[scene.models[i].id],
                p1x = m[0], p1y = m[1], p1z = m[2], p2x = m[3], p2y = m[4], p2z = m[5];
            
			// Iterate through triangles in mesh
			for(var k=6; k<m.length; k+=4){
                // Apply scale and rotation transformations
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

                // Apply camera translation
                pAx += scene.cX;   pAy += scene.cY;   pAz += scene.cZ;
                pBx += scene.cX;   pBy += scene.cY;   pBz += scene.cZ;
                pCx += scene.cX;   pCy += scene.cY;   pCz += scene.cZ;
                
                // Apply camera rotation
                pAx = (((pAy*Math.sin(scene.crX)+pAz*Math.cos(scene.crX))
                      *Math.sin(scene.crY)+pAx*Math.cos(scene.crY))*Math.cos(scene.crZ)-
                      (pAy*Math.cos(scene.crX)-pAz*Math.sin(scene.crX))*Math.sin(scene.crZ));
                pAy = (((pAy*Math.sin(scene.crX)+pAz*Math.cos(scene.crX))
                      *Math.sin(scene.crY)+pAx*Math.cos(scene.crY))*Math.sin(scene.crZ)+
                      (pAy*Math.cos(scene.crX)-pAz*Math.sin(scene.crX))*Math.cos(scene.crZ));
                pAz = (((pAy*Math.sin(scene.crX)+pAz*Math.cos(scene.crX))*
                      Math.cos(scene.crY)-pAx*Math.sin(scene.crY)));
                pBx = (((pBy*Math.sin(scene.crX)+pBz*Math.cos(scene.crX))
                      *Math.sin(scene.crY)+pBx*Math.cos(scene.crY))*Math.cos(scene.crZ)-
                      (pBy*Math.cos(scene.crX)-pBz*Math.sin(scene.crX))*Math.sin(scene.crZ));
                pBy = (((pBy*Math.sin(scene.crX)+pBz*Math.cos(scene.crX))
                      *Math.sin(scene.crY)+pBx*Math.cos(scene.crY))*Math.sin(scene.crZ)+
                      (pBy*Math.cos(scene.crX)-pBz*Math.sin(scene.crX))*Math.cos(scene.crZ));
                pBz = (((pBy*Math.sin(scene.crX)+pBz*Math.cos(scene.crX))*
                      Math.cos(scene.crY)-pBx*Math.sin(scene.crY)));
                pCx = (((pCy*Math.sin(scene.crX)+pCz*Math.cos(scene.crX))
                      *Math.sin(scene.crY)+pCx*Math.cos(scene.crY))*Math.cos(scene.crZ)-
                      (pCy*Math.cos(scene.crX)-pCz*Math.sin(scene.crX))*Math.sin(scene.crZ));
                pCy = (((pCy*Math.sin(scene.crX)+pCz*Math.cos(scene.crX))
                      *Math.sin(scene.crY)+pCx*Math.cos(scene.crY))*Math.sin(scene.crZ)+
                      (pCy*Math.cos(scene.crX)-pCz*Math.sin(scene.crX))*Math.cos(scene.crZ));
                pCz = (((pCy*Math.sin(scene.crX)+pCz*Math.cos(scene.crX))*
                      Math.cos(scene.crY)-pCx*Math.sin(scene.crY)));
                          
                // Apply translation transformations and calculate the perspective projection
                pAx = ((((pAx+scene.models[i].xPos)*scene.FOV)/(scene.FOV+pAz+scene.models[i].zPos))+(scene.w/2))*rx;
                pAy = ((((pAy+scene.models[i].yPos)*scene.FOV)/(scene.FOV+pAz+scene.models[i].zPos))+(scene.h/2))*ry;
                pBx = ((((pBx+scene.models[i].xPos)*scene.FOV)/(scene.FOV+pBz+scene.models[i].zPos))+(scene.w/2))*rx;
                pBy = ((((pBy+scene.models[i].yPos)*scene.FOV)/(scene.FOV+pBz+scene.models[i].zPos))+(scene.h/2))*ry;
                pCx = ((((pCx+scene.models[i].xPos)*scene.FOV)/(scene.FOV+pCz+scene.models[i].zPos))+(scene.w/2))*rx;
                pCy = ((((pCy+scene.models[i].yPos)*scene.FOV)/(scene.FOV+pCz+scene.models[i].zPos))+(scene.h/2))*ry;
                
				// Draw first two lines of triangle
                ctx.beginPath();
                ctx.moveTo(pAx,pAy);
                ctx.lineTo(pBx,pBy);
                ctx.lineTo(pCx,pCy);
                          						  
                if(!mode){
					// Draw third line of triangle
                    ctx.lineTo(pAx,pAy);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = m[k+3];
                    ctx.stroke();
                } else {
					// Fill triangle
                    ctx.fillStyle = m[k+3];
                    ctx.fill();
                }
                
                p1x = p2x;  p1y = p2y;    p1z = p2z;
                p2x = m[k]; p2y = m[k+1]; p2z = m[k+2];
            }
        }
        $3DS.renderFPS = 1000/(+new Date() - start + 1);
        if(screen.ivl){
			setTimeout(function(){ $3DS.wireframeRender(scene,screen,mode); }, 67);
        }
    },
    
	// Description: Perform a wireframe render at the fastest interval possible
	// Inputs: scene - the scene to render
	//         screen - the screen to render the scene on
	//         mode - the render mode to use
	// Output: none
    setWireframeRenderInterval: function(scene, screen, mode){
        screen.ivl = true;
        $3DS.wireframeRender(scene, screen, mode);
    },

	// Description: Stop a screen from rendering at an interval
	// Inputs: screen - the screen to stop
	// Output: none
    clearWireframeRenderInterval: function(screen){
        screen.ivl = false;
    },
    
	// Description: Create a scene
	// Inputs: w - width, h - height, cFOV - field of view
	// Output: The scene object
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
                    models: [],
					isScene: true
                    };
       
	   // Set the camera position
       scene.setCamera = function(x,y,z){
            this.cX = x; this.cY = y; this.cZ = z;
       }
       
	   // Set the camera position relative to its current position
       scene.moveCamera = function(x,y,z){
            this.cX += x; this.cY += y; this.cZ += z;
       }
       
	   // Set the camera rotation
       scene.setRotation = function(x,y,z){
            this.crX = x; this.crY = y; this.crZ = z;
       }
       
	   // Set the camera rotation relative to the current rotation
       scene.rotateCamera = function(x,y,z){
            this.crX += x; this.crY += y; this.crZ += z;
       }
       
	   // Set the field of view
       scene.setFOV = function(f){
            this.FOV = f;
       }
       
       return scene;
    },

	// Description: Create a model and add it to a scene
	// Inputs: scene - the scene to add the model to
	//         id - the id of the model for mesh, color and collision data
	//         x,y,z - initial position
	//         xr,yr,zr - initial rotation
	//         sc - initial scale
	// Output: The model object or undefined if the model id is undefined
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
        
		// Set the position of the model
        model.set = function(x,y,z){
            this.xPos = x; this.yPos = y; this.zPos = z;
        };
        
		// Set the position of the model relative to its current position
        model.move = function(x,y,z){
            this.xPos += x; this.yPos += y; this.zPos += z;
        };
        
		// Set the rotation of the model
        model.setRotation = function(x,y,z){
            this.xRot = x; this.yRot = y; this.zRot = z;
        };
        
		// Set the rotation of the model relative to its current position
        model.rotate = function(x,y,z){
            this.xRot += x; this.yRot += y; this.zRot += z;
        };
        
		// Set the scale of the model
        model.setScale = function(s){
            this.scale = s;
        };
        
		// Set the scale of the model relative to its current scale
        model.resize = function(s){
            this.scale += s;
        };
        
		// Checks if the model collides with another model
		// Returns the result as a boolean
        model.collidesWith = function(m){
            if(!m.isModel){ $3DS.error('Can not detect collision with a non-model.'); return; }
            
			// Check sphere-to-sphere collision by comparing distance
			if(($3DS.internal.collisionCache[this.id].length==1)&&($3DS.internal.collisionCache[m.id].length==1)){
                return (Math.sqrt((this.xPos-m.xPos)*(this.xPos-m.xPos)+(this.yPos-m.yPos)*(this.yPos-m.yPos)+(this.zPos-m.zPos)*(this.zPos-m.zPos))
                        <= (this.scale*$3DS.internal.collisionCache[this.id][0] + m.scale*$3DS.internal.collisionCache[m.id][0]));
            }
			
			// Check box-to-box collision by comparing the positions of the boxes' corner
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
			
			// Check box-to-sphere collision by checking corner distance from sphere
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
    
	// Description: Removes a model from a scene
	// Inputs: scene - the scene containing the model, model - the model to remove
	// Output: true if successful or false if the model couldn't be found
    removeModel: function(scene, model){
        var i = scene.models.indexOf(model);
        if(i<0){ return false; }
        scene.models.splice(i,1);
        return true;
    },
    
	// Description: Set the value of a cookie by name
	// Inputs: name - name of the cookie to set, val - value to set, exp - expiration date
	// Output: none
	setCookie: function(name,val,exp){
        exp = exp || new Date(8640000000000000).toUTCString();
        document.cookie = name+'='+val+';expires='+exp;
    },
    
	// Description: Get the value of a cookie by name
	// Inputs: name - name of the cookie to get
	// Output: The value of the cookie or undefined if the cookie doesn't exist
    getCookie: function(name) {
        try {
            return document.cookie.split(name+'=')[1].split(';')[0];
        } catch(e) {
            return; 
        }
    },
    
	// Description: Deletes a cookie by name
	// Inputs: name - name of the cookie to delete
	// Output: none
    deleteCookie: function(name) {
        document.cookie = name+"=d;expires="+new Date(0).toUTCString();
    },
    
	// Description: Generates a random integer between a given range
	// Inputs: min - minimum value, max - maximum value
	// Output: The random number generated
    randInt: function(min,max){
        return Math.floor(Math.random()*(max-min+1))+min;
    },
    
	// Description: Checks if the code is running on a 3DS
	// Inputs: none
	// Output: true if running on 3DS, false if not
	is3DS: function(){ return (navigator.userAgent.indexOf('3DS') >= 0); },
    
	// Internal functions and attributes used by other functions
	internal: {
        collisionCache: {}, // Cache to store collision volumes for models
        meshCache: {}, // Cache to store meshs and color data for models
        
		// Updates keyState based on key events
		keyUpdate: function(e){
            var charCode = e.charCode || e.keyCode;
            if(e.type=='keydown'){
                if(charCode == $3DS.key.up){
                    $3DS.keyState.up = true;
                }else if(charCode == $3DS.key.down){
                    $3DS.keyState.down = true;
                }else if(charCode == $3DS.key.left){
                    $3DS.keyState.left = true;
                }else if(charCode == $3DS.key.right){
                    $3DS.keyState.right = true;
                }else if(charCode == $3DS.key.A){
                    $3DS.keyState.A = true;
                }
            }else if(e.type=='keyup'){
                if(charCode == $3DS.key.up){
                    $3DS.keyState.up = false;
                }else if(charCode == $3DS.key.down){
                    $3DS.keyState.down = false;
                }else if(charCode == $3DS.key.left){
                    $3DS.keyState.left = false;
                }else if(charCode == $3DS.key.right){
                    $3DS.keyState.right = false;
                }else if(charCode == $3DS.key.A){
                    $3DS.keyState.A = false;
                }
            }
        },
		
		// Initializes the library
        start: function(){
            window.addEventListener('keydown', $3DS.internal.keyUpdate, false);
            window.addEventListener('keyup', $3DS.internal.keyUpdate, false);
        }
    }
};
$3DS.internal.start();
