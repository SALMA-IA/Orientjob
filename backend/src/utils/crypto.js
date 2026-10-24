const crypto = require('crypto');

const key = () => Buffer.from(process.env.CV_KEY, 'hex');

// Format du fichier : [IV 12 octets][tag 16 octets][données chiffrées]
function chiffrer(buf) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]);
}

function dechiffrer(buf) {
  const d = crypto.createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]);
}

module.exports = { chiffrer, dechiffrer };