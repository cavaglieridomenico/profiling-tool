/**
 * Performance Report Style Guide
 * Extracted from high-quality document models (e.g., VM-Test on VMMV 5.5.6)
 */
export const PERFORMANCE_STYLE_EXAMPLES = [
  {
    context: 'Improved Longest Task duration',
    style: 'Analysis confirms stable performance KPIs with an important reduction of Longest task duration on the main thread due to relocating heavy logic to a web worker.'
  },
  {
    context: 'Improved VMP Picture Processing',
    style: 'Performance improved by skipping the unnecessary download of ffmpeg and TensorFlow libraries and reducing the hardcoded loop for picture pose inference, freeing the main thread.'
  },
  {
    context: 'Stable KPIs',
    style: 'Results confirm stable performance KPIs, with improved main thread computation during engine initialization and enhanced resource handling.'
  }
];

export const STYLE_GUIDE_PROMPT = `
Use the following professional examples as a style guide for your analysis:
${PERFORMANCE_STYLE_EXAMPLES.map((ex) => `- ${ex.style}`).join('\n')}

Rules:
1. Be technical and precise.
2. Mention specific threads (Main Thread, Web Worker) if relevant.
3. Link improvements to architectural reasons if the metrics strongly suggest them.
4. Keep the tone formal and objective.
`;
