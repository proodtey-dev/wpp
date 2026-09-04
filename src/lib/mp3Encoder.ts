import { Mp3Encoder } from '@breezystack/lamejs';

export async function convertBlobToMp3(audioBlob: Blob): Promise<Blob> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = Math.min(audioBuffer.numberOfChannels, 2);
  
  const encoder = new Mp3Encoder(numChannels, sampleRate, 128);

  const left = audioBuffer.getChannelData(0);
  const right = numChannels > 1 ? audioBuffer.getChannelData(1) : left;

  const leftInt16 = new Int16Array(left.length);
  const rightInt16 = new Int16Array(right.length);
  
  for (let i = 0; i < left.length; i++) {
    leftInt16[i] = Math.max(-32768, Math.min(32767, left[i] < 0 ? left[i] * 32768 : left[i] * 32767));
    rightInt16[i] = Math.max(-32768, Math.min(32767, right[i] < 0 ? right[i] * 32768 : right[i] * 32767));
  }

  const mp3Data: Uint8Array[] = [];
  const sampleBlockSize = 1152;

  for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
    const mp3buf = numChannels > 1
      ? encoder.encodeBuffer(leftChunk, rightChunk)
      : encoder.encodeBuffer(leftChunk);
      
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }

  const endBuf = encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(new Uint8Array(endBuf));
  }

  const totalLen = mp3Data.reduce((acc, curr) => acc + curr.length, 0);
  const mergedMp3 = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of mp3Data) {
    mergedMp3.set(chunk, offset);
    offset += chunk.length;
  }

  audioCtx.close();

  return new Blob([mergedMp3], { type: 'audio/mpeg' });
}
