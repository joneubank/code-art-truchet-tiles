// import { Vec2, Utils } from '@code-not-art/core';
import {
  Sketch,
  SketchProps,
  Params,
  Parameter,
  Config,
} from '@code-not-art/sketch';

const config = Config({
  menuDelay: 0,
});

const params: Parameter[] = [Params.header('Custom Options')];

// const init = ({}: SketchProps) => {};

const draw = ({ canvas, palette }: SketchProps) => {
  canvas.fill(palette.colors[0]);
};

// const loop = ({}: SketchProps, {}: FrameData): boolean => {
//   return false;
// };

// const reset = ({}: SketchProps) => {};

export default Sketch({
  config,
  params,
  // init,
  draw,
  // loop,
  // reset,
});
