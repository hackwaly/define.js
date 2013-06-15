define(function (require){
    var mat3_create = require('common/vec/mat3/create');
    var mat3_identity = require('common/vec/mat3/identity');
    var mat3_multiply = require('common/vec/mat3/multiply');
    var mat3_translate = require('common/vec/mat3/translate');
    var mat3_scale = require('common/vec/mat3/scale');

    function WebGLCanvas(canvas){
        var gl = canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl', {
                "alpha": false,
                "preserveDrawingBuffer": false,
                "antialias": true,
                "stencil": false,
                "depth": false
            });

        var vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader, '' +
            'precision mediump float;' +
            'attribute vec4 aVertexPosition;' +
            'uniform mat3 uMatrix;' +
            'varying vec2 vTextureCoord;' +
            'void main(void){' +
                'vTextureCoord = aVertexPosition.zw;' +
                'gl_Position = vec4(uMatrix * vec3(aVertexPosition.xy, 1), 1);' +
            '}');
        gl.compileShader(vShader);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fShader, '' +
            'precision mediump float;' +
            'varying vec2 vTextureCoord;' +
            'uniform sampler2D uSampler;' +
            'uniform float uAlpha;' +
            'void main(void){' +
                'gl_FragColor = vec4(vec3(texture2D(uSampler, vTextureCoord)), uAlpha);' +
            '}');
        gl.compileShader(fShader);
        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vShader);
        gl.attachShader(shaderProgram, fShader);
        gl.linkProgram(shaderProgram);

        var aVertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        gl.enableVertexAttribArray(aVertexPosition);
        var aVertexPosition_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, aVertexPosition_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0,1, 0,1,
            0,0, 0,0,
            1,0, 1,0,
            1,1, 1,1
        ]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        var uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');
        var uMatrix = gl.getUniformLocation(shaderProgram, 'uMatrix');
        var uAlpha = gl.getUniformLocation(shaderProgram, 'uAlpha');
        var mat3_matrix = mat3_identity();
        mat3_multiply(mat3_matrix, mat3_translate(-1, 1));

        gl.useProgram(shaderProgram);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.SCISSOR_TEST);
        gl.disable(gl.CULL_FACE);
//        gl.disable(gl.BLEND);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.clearColor(245/256, 245/256, 245/256, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        function uploadImage(image){
            var texture = image._glTexture;
            if (!texture) {
                texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
//                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.bindTexture(gl.TEXTURE_2D, null);
                image._glTexture = texture;
            }
            return texture;
        }
        this.releaseImage = function (image){
            var texture = image._glTexture;
            if (texture) {
                gl.deleteTexture(texture);
                image._glTexture = null;
            }
        };
        this.clear = function (){
            gl.clearColor(245/256, 245/256, 245/256, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        };
        this.updateSize = function (){
            var width = canvas.width;
            var height = canvas.height;
            mat3_matrix = mat3_identity();
            mat3_multiply(mat3_matrix, mat3_translate(-1, 1));
            mat3_multiply(mat3_matrix, mat3_scale(2/width, -2/height, 1));
            gl.viewport(0, 0, width, height);
        };
        this.prepareImage = function (image){
            uploadImage(image);
        };
        this.drawImage = function (image, x, y, w, h, alpha){
            var texture = uploadImage(image);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(uSampler, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindBuffer(gl.ARRAY_BUFFER, aVertexPosition_buffer);
            gl.vertexAttribPointer(aVertexPosition, 4, gl.FLOAT, false, 0, 0);
            var matrix = mat3_multiply(
                mat3_multiply(
                    mat3_matrix, mat3_translate(x, y), mat3_create()),
                mat3_scale(w, h, 1));
            gl.uniformMatrix3fv(uMatrix, false, matrix);
            gl.uniform1f(uAlpha, alpha);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        };
    }
    return WebGLCanvas;
});
