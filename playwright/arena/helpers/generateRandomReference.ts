import { Page } from "playwright";
import crypto from "crypto";

export class GenerateRandomReference {

    private static referenceLength = 20;

    // Safe alphabet: no forbidden characters by construction
    private static readonly alphabet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    constructor(private page: Page, length?: number) {
        if (length) {
            GenerateRandomReference.referenceLength = length;
        }
    }

    /**
     * Returns the reference provided by the UI,
     * or generates a highly unique random reference if none was supplied.
     */
    getOrGenerateReference(
        reference?: string | null,
        prefix = ""
    ): string {
        if (reference && reference.trim()) {
            return reference.trim(); //app will handle validation and error display for invalid references, so we just pass through whatever the user provided (after trimming whitespace)
        }

        return `${prefix}${GenerateRandomReference.generateReference(
            GenerateRandomReference.referenceLength
        )}`;
    }

    /**
     * Generates a cryptographically strong random reference
     * using only safe characters.
     */
    private static generateReference(length: number): string {
        const bytes = crypto.randomBytes(length);
        const alphabet = GenerateRandomReference.alphabet;
        const alphabetLength = alphabet.length;

        let result = "";
        for (let i = 0; i < length; i++) {
            result += alphabet[bytes[i] % alphabetLength];
        }

        return result;
    }
}