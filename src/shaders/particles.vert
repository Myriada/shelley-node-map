uniform vec2 uTextureSize;
uniform sampler2D uTexture;
uniform sampler2D uMousePosTexture;
uniform sampler2D positionTexture;
uniform sampler2D defaultPositionTexture;
uniform vec2 uMousePos;
uniform vec2 uPrevMousePos;
uniform float uNoiseMix;

attribute vec3 offset;
attribute vec3 tPosition;

varying vec2 vUv;
varying vec2 vPUv;
varying vec4 vMousePosTexture;

void main() {

	 vUv = uv;

	// particle uv
	vec2 puv = offset.xy / uTextureSize;
	vPUv = puv;

	vec4 color = texture2D(uTexture, puv);

	if (color.r + color.g + color.b > 0.01) {

		#include <begin_vertex>

		vec4 noisePositionData = (texture2D(positionTexture, tPosition.xy) / uTextureSize.x);
		vec4 defaultPosition = (texture2D(defaultPositionTexture, tPosition.xy) / uTextureSize.x);

		transformed.xyz = defaultPosition.xyz;

		vec4 mousePosTexture = texture2D(uMousePosTexture, puv);
		vMousePosTexture = mousePosTexture;

		vec2 dir = mousePosTexture.xy;

		transformed.xyz = mix(defaultPosition.xyz, noisePositionData.xyz, clamp(mousePosTexture.b, -1.0, 1.0 ) );

		float puvToMouse = distance(uMousePos, puv);
		if (puvToMouse < 0.5) {
		 	transformed.xy += ( clamp(dir * 2.0, -1.0, 1.0) * clamp(  pow(1.0-puvToMouse * 2.0, 10.0) , 0.0, 1.0 ) ) * (uNoiseMix * 0.1);
		}

		#include <project_vertex>

		vec4 newPos = vec4(position, 0.);

		float scale = 0.006;
		newPos.xy *= scale;

		mvPosition.xyz += newPos.xyz;
	 	mvPosition.xy -= 0.5;

		gl_Position = projectionMatrix * mvPosition;

	} else {

		gl_Position = vec4(99999.9);

	}
}
