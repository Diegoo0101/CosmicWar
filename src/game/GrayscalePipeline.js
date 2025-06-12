import Phaser from 'phaser';
// Clase que extiende de PostFXPipeline para efectos de post-procesamiento
export default class GrayscalePipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({
      game,
      name: 'GrayscalePipeline',
      // Shader de fragmeento que se ejecuta sobre cada pixel, con efecto de escala de grises
      fragShader: `
        precision mediump float;

        uniform sampler2D uMainSampler;
        varying vec2 outTexCoord;

        void main(void) {
          vec4 color = texture2D(uMainSampler, outTexCoord);
          float gray = dot(color.rgb, vec3(0.3, 0.59, 0.11));
          gl_FragColor = vec4(vec3(gray), color.a);
        }
      `
    });
  }
}