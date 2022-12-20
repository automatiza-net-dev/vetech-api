export const GenerateTag = (counter: number, seq = 5, ch = '0') => {
  const current = new Date().getFullYear();

  return [current, counter.toString().padStart(seq, ch)].join('_');
};
