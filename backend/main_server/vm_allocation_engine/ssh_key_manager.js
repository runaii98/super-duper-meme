const crypto = require('crypto');

/**
 * Generates an RSA key pair.
 * @returns {Promise<{publicKeyPemSpki: string, privateKeyPemPkcs1: string, publicKeyOpenssh: string}>}
 *          An object containing the public key in SPKI (PKCS#8) PEM format,
 *          private key in PKCS#1 PEM format, and public key in a simplified OpenSSH format.
 */
function generateRsaKeyPair() {
    // Generate KeyObjects first
    const { privateKey: privateKeyObject, publicKey: publicKeyObject } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
    });

    // Export private key to PKCS#1 PEM format
    const privateKeyPemPkcs1 = privateKeyObject.export({
        type: 'pkcs1',
        format: 'pem'
    });

    // Export public key to SPKI (PKCS#8) PEM format
    const publicKeyPemSpki = publicKeyObject.export({
        type: 'spki',
        format: 'pem'
    });

    // --- Helper functions to construct the OpenSSH public key blob ---
    function base64UrlToBuffer(base64Url) {
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return Buffer.from(base64, 'base64');
    }

    function writeSshString(strBuffer) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(strBuffer.length, 0);
        return Buffer.concat([len, strBuffer]);
    }

    function writeSshMpint(mpintBuffer) {
        if (mpintBuffer.length === 1 && mpintBuffer[0] === 0x00) { // Represents actual integer 0
             const len = Buffer.alloc(4);
             len.writeUInt32BE(0,0); // Zero length data for mpint 0
             return len;
        }
        // For positive mpints (non-zero)
        if (mpintBuffer.length === 0 && !(mpintBuffer.length === 1 && mpintBuffer[0] === 0x00) ) { // Should not occur for RSA n, e if they are non-zero
            // This case is more for a generic mpint that could be zero and represented by empty buffer initially
            const len = Buffer.alloc(4);
            len.writeUInt32BE(0, 0); 
            return len;
        }

        let finalBuffer = mpintBuffer;
        if ((finalBuffer[0] & 0x80) && finalBuffer.length > 0) { // Positive, MSB is 1, non-empty
            finalBuffer = Buffer.concat([Buffer.from([0x00]), finalBuffer]);
        }

        const len = Buffer.alloc(4);
        len.writeUInt32BE(finalBuffer.length, 0);
        return Buffer.concat([len, finalBuffer]);
    }
    // --- End helper functions ---

    const jwk = publicKeyObject.export({ format: 'jwk' });
    const n_buffer = base64UrlToBuffer(jwk.n);
    const e_buffer = base64UrlToBuffer(jwk.e);
    const sshKeyTypeBuffer = Buffer.from("ssh-rsa", "utf8");

    const parts = [
        writeSshString(sshKeyTypeBuffer),
        writeSshMpint(e_buffer),
        writeSshMpint(n_buffer)
    ];

    const publicKeyBlob = Buffer.concat(parts);
    const publicKeyOpenssh = `ssh-rsa ${publicKeyBlob.toString('base64')} server-generated-key`;

    return {
        privateKeyPemPkcs1,
        publicKeyPemSpki,
        publicKeyOpenssh
    };
}

module.exports = { generateRsaKeyPair }; 