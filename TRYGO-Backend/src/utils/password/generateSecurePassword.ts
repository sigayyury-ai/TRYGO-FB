import crypto from 'crypto';

/**
 * Generates a cryptographically secure random password
 * 
 * @param length - Length of the password (default: 16)
 * @returns A secure random password containing uppercase, lowercase, numbers, and special characters
 */
export function generateSecurePassword(length: number = 16): string {
    // Character sets for password generation
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Combined character set
    const allChars = uppercase + lowercase + numbers + special;
    
    // Ensure we have at least one character from each set for security
    let password = '';
    
    // Add at least one character from each required set
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += special[crypto.randomInt(0, special.length)];
    
    // Fill the rest with random characters from all sets
    const remainingLength = length - password.length;
    for (let i = 0; i < remainingLength; i++) {
        password += allChars[crypto.randomInt(0, allChars.length)];
    }
    
    // Shuffle the password to avoid predictable patterns
    // Convert to array, shuffle, and convert back to string
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    
    return passwordArray.join('');
}
