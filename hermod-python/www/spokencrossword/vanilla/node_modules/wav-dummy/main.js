module.exports = (nbSeconds, nbChannels = 2, sampleRate = 44100) => {
	if (nbSeconds === undefined || typeof nbSeconds !== 'number') {
		throw 'nbSeconds must be a valid number!'
	}

	if (nbChannels === undefined || typeof nbChannels !== 'number') {
		throw 'nbChannels must be a valid number!'
	}

	if (sampleRate === undefined || typeof sampleRate !== 'number') {
		throw 'sampleRate must be a valid number!'
	}

	// Constants
	const BITS_PER_BYTE = 8;

	// Configs
	const bitsPerSample = 8;
	const subChunk2Size = sampleRate * (nbSeconds * nbChannels);
	const chunkSize = 36 + subChunk2Size;
	const blockAlign = nbChannels * (bitsPerSample / BITS_PER_BYTE);
	const byteRate = sampleRate * blockAlign;

	// File
	const arrayBuffer = new ArrayBuffer(chunkSize + 8)
	const dataView = new DataView(arrayBuffer);

	// The "RIFF" chunk descriptor
	// ChunkID
	dataView.setUint8(0, 'R'.charCodeAt());
	dataView.setUint8(1, 'I'.charCodeAt());
	dataView.setUint8(2, 'F'.charCodeAt());
	dataView.setUint8(3, 'F'.charCodeAt());
	// ChunkSize
	dataView.setUint32(4, chunkSize, false);
	// Format
	dataView.setUint8(8, 'W'.charCodeAt());
	dataView.setUint8(9, 'A'.charCodeAt());
	dataView.setUint8(10, 'V'.charCodeAt());
	dataView.setUint8(11, 'E'.charCodeAt());

	// The "fmt" sub-chunk
	// Subchunk1ID
	dataView.setUint8(12, 'f'.charCodeAt());
	dataView.setUint8(13, 'm'.charCodeAt());
	dataView.setUint8(14, 't'.charCodeAt());
	dataView.setUint8(15, ' '.charCodeAt());
	// Subchunk1Size
	dataView.setUint8(16, 16);
	// AudioFormat
	dataView.setUint8(20, 1);
	// NumChannels
	dataView.setUint8(22, nbChannels);
	// SampleRate
	dataView.setUint32(24, sampleRate, true);
	// ByteRate
	dataView.setUint32(28, byteRate, true);
	// BlockAlign
	dataView.setUint8(32, blockAlign);
	// BitsPerSample
	dataView.setUint8(34, bitsPerSample);

	// The "data" sub-chunk
	// Subchunk2ID
	dataView.setUint8(36, 'd'.charCodeAt());
	dataView.setUint8(37, 'a'.charCodeAt());
	dataView.setUint8(38, 't'.charCodeAt());
	dataView.setUint8(39, 'a'.charCodeAt());
	// Subchunk2Size
	dataView.setUint32(40, subChunk2Size, false);
	// Data
	for (let i = 0; i < subChunk2Size; i++) {
		dataView.setUint8(44 + i, Math.round((Math.random() * 255)));
	}

	return arrayBuffer;
}