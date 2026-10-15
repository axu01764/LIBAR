importScripts('hero-renderer.js');
let renderer;
self.onmessage = ({ data }) => {
  if (data.type === 'init') renderer = self.createHeroRenderer(data.canvas, data.options, message => self.postMessage(message));
  else if (data.type === 'frame') renderer?.setFrame(data.frame);
  else if (data.type === 'resize') renderer?.resize(data.width, data.height);
  else if (data.type === 'dispose') { renderer?.dispose(); self.close(); }
};
